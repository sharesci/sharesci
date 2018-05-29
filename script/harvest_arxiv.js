var request = require('request'),
	MongoClient = require('mongodb').MongoClient,
	assert = require('assert'),
	cheerio = require('cheerio'),
	fs = require('fs'),
	xml2js = require('xml2js');

// Connection URL
var mongo_url = 'mongodb://localhost:27017/sharesci';
var search_server_url = 'http://localhost:8000/notifynewdoc';


function oaiXmlToJson(oaiXML) {
	alldata = [];
	var metadatax = oaiXML('record > metadata > arXiv');
	oaiXML('categories', metadatax).remove();
	metadatax.each((index, obj) => {
		xml2js.parseString(oaiXML.xml(obj), {explicitArray: false, trim: true}, (err, data) => {
			data = data['arXiv'];
			delete data['$'];
			oth = {};
			oth['arxiv_id'] = data['id'];
			delete data['id'];
			data['authors'] = data['authors']['author'];
			if(data['authors'].keyname) {
				data['authors'].lastname = data['authors'].keyname;
				data['authors'].firstname = data['authors'].forenames;
				delete data['authors'].forenames;
				delete data['authors'].keyname;
			}
			else {
				for(var count = 0; count < data['authors'].length; ++count) {
					data['authors'][count].firstname = data['authors'][count].forenames;
					data['authors'][count].lastname = data['authors'][count].keyname;
					delete data['authors'][count].forenames;
					delete data['authors'][count].keyname;
				}
			}
			if(data.comments !== undefined && data.comments !== null) {
				oth['comments'] = data.comments;
				delete data.comments;
			}
			if(data.license !== undefined && data.license !== null) {
				oth.license = data.license;
				delete data.license;
			}
			if(data.doi !== undefined && data.doi !== null) {
				oth.doi = data.doi;
				delete data.doi;
			}

			data['references'] = [];
			data['other'] = oth;
			//console.log(data);
			alldata.push(data);
		});
	});
	return alldata;
}

function mongoInsertPapers(paperdata, callback) {
	MongoClient.connect(mongo_url, {reconnectInterval: 10000, connectTimeoutMS: 60000}, function(err, db) {
		assert.equal(null, err);
		console.log("Connected successfully to server for inserting papers");
		var collection = db.collection('papers');
		var papersInserted = 0, papersUpdated = 0, papersDeleted = 0;
		arxiv_ids_map = {}
		all_arxiv_ids = []
		for(var count = 0; count < paperdata.length; count++) {
			arxiv_ids_map[paperdata[count]['other']['arxiv_id']] = paperdata[count];
			all_arxiv_ids.push(paperdata[count]['other']['arxiv_id']);
		}

		collection.find({'other.arxiv_id': {'$in': all_arxiv_ids}}, {'_id': 1, 'other.arxiv_id': 1}).toArray((err, docs) => {
			if (err) {
				console.error('There was an error when trying to find duplicates in Mongo: ', err);
			}

			seen_arxiv_ids = {}

			for(let i = 0; i < docs.length; i++) {
				if (docs[i]['other']['arxiv_id'] in seen_arxiv_ids) {
					collection.deleteOne({'_id': docs[i]['_id']});
					papersDeleted++;
					continue;
				}
				collection.update({'_id': docs[i]['_id']}, arxiv_ids_map[doc[i]['other']['arxiv_id']]);
				seen_arxiv_ids[docs[i]['other']['arxiv_id']] = true;
				papersUpdated++;
				delete arxiv_ids_map[docs[i]['other']['arxiv_id']]
			}
			papers_to_insert = [];
			for (let arxiv_id in arxiv_ids_map) {
				papers_to_insert.push(arxiv_ids_map[arxiv_id]);
				papersInserted++;
			}
			collection.insertMany(papers_to_insert, (err, result) => {
				console.log('Sent request to DB server: ' + papersInserted + ' inserts, ' + papersUpdated + " updates, " + papersDeleted + ' deletions');
				callback();
				console.log('Notifying search server to reload...');
				request.post(search_server_url, (err, res, body) => {console.log('Search server reloaded.'); })
				db.close();
			});
		});
	});
}

function harvestOAI(url, resume_url, last_promise, completion_callback) {
	var reqpromise = new Promise((resolve, reject) => {
		request(url, (err,res,xml)=>{resolve([err, res, xml]);});
	});
	reqpromise.then((vals) => {
		var error = vals[0],
			response = vals[1],
			xml = vals[2];

		if (error) {
			console.error(error, 'statusCode = ' + response.statusCode);
			return;
		}

		if (response.statusCode == 503) {
			// Status 503 is for rate-limiting. Rather than parsing
			// the whole response, we'll just wait five minutes and
			// hope its enough.
			console.log('Status 503 received. Waiting 10 minutes. Here\'s the full response body in case you\'re interested: ', xml);
			setTimeout(() => {harvestOAI(url, resume_url, last_promise, completion_callback);}, 600000);
			return;
		}
		if (response.statusCode != 200) {
			console.error('Non-200/503 status code received (code was ' + response.statusCode + '). Aborting since I don\'t know what it means. Here is the response: ', xml);
		}
		var xmld = cheerio.load(xml, {
			xmlMode: true
		});
		var resumptionToken = xmld('ListRecords > resumptionToken').text();
		console.log('resumption = ' + resumptionToken);
		console.log('resumptionXML = ' + xmld.html('ListRecords > resumptionToken'));
		var alldata = oaiXmlToJson(xmld);
		var mongoPromise = new Promise((resolve, reject) => {
			last_promise.then(() => {
				if(alldata.length>0) {

					mongoInsertPapers(alldata, resolve);
				}
				else {
					console.log("nothing to insert.");
				}
			});
		});
		if (resumptionToken && 0 < resumptionToken.length) {
			timer_promise = new Promise((resolve, reject) => {setTimeout(() => {resolve();}, 25000);});
			Promise.all([last_promise, timer_promise]).then(()=>{
				harvestOAI(resume_url + resumptionToken, resume_url, mongoPromise, completion_callback);
			});
		} else if (completion_callback !== undefined && completion_callback !== null) {
			mongoPromise.then(() => {
				completion_callback();
			});
		}
	});
}


var latestFetch = "";
//get last time the data was retrieved
var getLatestFetchPromise = new Promise((resolve, reject) => {
	MongoClient.connect(mongo_url, function(err, db) {
		assert.equal(null, err);
		console.log("Connected to server, retrieving latest fetch date");
		special_objects=db.collection('special_objects');
		fetchCursor=special_objects.find({'key':'last_harvester_run_date'});
		fetchCursor.count().then((count) => {
			if (count === 0) {
				// If we cannot find a latest fetch date, then
				// we set the latest fetch date to 1980-01-01.
				resolve("1980-01-01");
			}
		});
		fetchCursor.each(function(err, item) {
			if(item === null) {
				return;
			}

			resolve(item.value);
		});

		db.close();
	});
});

getLatestFetchPromise.then((latestFetch) => {
	var first_url = 'http://export.arxiv.org/oai2?verb=ListRecords&metadataPrefix=arXiv&from='+latestFetch;
	var resume_url = 'http://export.arxiv.org/oai2?verb=ListRecords&resumptionToken=';

	final_promise = new Promise((resolve, reject) => {
		harvestOAI(first_url, resume_url, Promise.resolve(0), resolve);
	});

	final_promise.then(() => {
		// Tell the search server we got new docs
		console.log('Notifying search server to reload...');
		request.post(search_server_url, (err, res, body) => {
			var today = (new Date()).toISOString().split('T')[0]; // Get just the YYYY-MM-DD representation
			MongoClient.connect(mongo_url, function(err, db) {
				assert.equal(null, err);
				console.log("We're finished, updating retrieval date to "+today);
				special_objects=db.collection('special_objects');
				special_objects.update({'key':'last_harvester_run_date'}, {'$set': {'value': today}}, {'upsert': true});
				db.close();

				console.log('All done.');
			});
		});
	});
});
