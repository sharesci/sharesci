var request = require('request'),
	MongoClient = require('mongodb').MongoClient,
	assert = require('assert'),
	cheerio = require('cheerio'),
	fs = require('fs'),
	xml2js = require('xml2js');

// Connection URL
var mongo_url = 'mongodb://localhost:27017/sharesci';


function oaiXmlToJson(oaiXML) {
	alldata = [];
	var metadatax = oaiXML('record > metadata > arXiv');
	oaiXML('categories', metadatax).remove();
	metadatax.each((index, obj) => {
		xml2js.parseString(oaiXML.xml(obj), {explicitArray: false, trim: true}, (err, data) => {
			data = data['arXiv'];
			delete data['$'];
oth={};
oth['arxiv_id']=data['id'];
			delete data['id'];
			data['authors'] = data['authors']['author'];
if(data['authors'].keyname) {
data['authors'].lastname=data['authors'].keyname;
data['authors'].firstname=data['authors'].forenames;
delete data['authors'].forenames;
delete data['authors'].keyname;
}
else {
for(var count=0; count<data['authors'].length; ++count) {
data['authors'][count].firstname=data['authors'][count].forenames;
data['authors'][count].lastname=data['authors'][count].keyname;
delete data['authors'][count].forenames;
delete data['authors'][count].keyname;
}
}
oth['comments']=data.comments;
delete data.comments;
oth.license=data.license;
delete data.license;
oth.doi=data.doi;
delete data.doi;

			data['references'] = [];
data['other']=oth;
//console.log(data);
			alldata.push(data);
		});
	});
	return alldata;
}

function mongoClearPapers(callback) {
	MongoClient.connect(mongo_url, function(err, db) {
		assert.equal(null, err);
		console.log("Connected successfully to server for clearing papers");
		var collection = db.collection('papers');
		collection.drop();
		db.close();
		callback(0);
	});
}

function mongoInsertPapers(paperdata, callback) {
	MongoClient.connect(mongo_url, function(err, db) {
		assert.equal(null, err);
		console.log("Connected successfully to server for inserting papers");
		var collection = db.collection('papers');
var papersInserted=0, papersUpdated=0, ids=[];
for(var count=0; count<paperdata.length; count++)
{
ids.push(paperdata[count].other.arxiv_id);
var searchFor={'other.arxiv_id':paperdata[count].other.arxiv_id};
var exists=collection.find(searchFor).limit(1).count();
if(exists) {
console.log("updated "+paperdata[count].title);
collection.update(searchFor,paperdata[count]);
papersUpdated++;
}
else {
collection.insert(paperdata[count]);
console.log("inserted "+paperdata[count].title);
papersInserted++;
}
}
			console.log("Inserted " + papersInserted + " papers, updated "+papersUpdated+" papers");
callback(ids);
			db.close();
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
		
		if (error || response.statusCode != 200) {
			console.error(error, '\nstatusCode = ' + response.statusCode);
			return;
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
			setTimeout(()=>{harvestOAI(resume_url + resumptionToken, resume_url, mongoPromise, completion_callback);}, 19000);
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
		request.post('http://localhost:8000/notifynewdoc', (err, res, body) => {
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