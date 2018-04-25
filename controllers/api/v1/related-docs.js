const
	express = require('express'),
	assert = require('assert'),
	session = require('express-session'),
	request = require('request'),
	rp = require('request-promise'),
	ObjectId = require('mongodb').ObjectId,
	MongoClient = require('mongodb').MongoClient,
	mongo_url = 'mongodb://localhost:27017/sharesci',
	http = require('http');

function relatedDocs(req, res) {
	var responseJSON = {
		errno: 0,
		errstr: '',
		results: []
	};
	var searchParams = JSON.parse(JSON.stringify(req.query));

	if(!searchParams['docid']) {
		responseJSON.errno = 5;
		responseJSON.errstr = 'Valid docid required';
		res.status(422).json(responseJSON);
		res.end();
		return;
	}
	if(!searchParams.offset) {
		searchParams.offset = 0;
	}
	if(searchParams.maxResults) {
		searchParams.maxResults = parseInt(searchParams.maxResults);
	}
	if(!searchParams.uri) {
		searchParams['uri'] = 'http://137.148.142.215:8000/related-docs';
	}
	if(!searchParams.searchType) {
		searchParams['searchType'] = 'mongo';
	}
	if(!searchParams.getFullDocs) {
		searchParams['getFullDocs'] = false;
	}
	
	var options = {
		uri: searchParams.uri,
		qs: {
			'offset': searchParams.offset,
			'docid': searchParams.docid,
			'maxResults': searchParams.maxResults,
			'searchType': searchParams.searchType,
			'getFullDocs': searchParams.getFullDocs
		},
		json: true
	};

	var searchPromise = new Promise((resolve, reject) => { 
		request(options, (error, response, body) => { 
			if (error) {
				reject(error);
			} else {
				resolve(response);
			}
		});
	});
	searchPromise.then((results) => {
		var searchResults = results;
		searchResults['search_token'] = options.qs.q;
		var metaDataPromise = new Promise((resolve, reject) => { getInfo(searchResults, resolve, reject); });
		metaDataPromise.then((metadata) => {
			responseJSON.results = metadata;
			res.json(responseJSON);
			res.end();
		})
	})
	.catch((err) => {
		responseJSON.errno = 1;
		responseJSON.errstr = err;
		res.json(responseJSON);
		res.end();
	});
}

function getInfo(params, resolve, reject) {
	MongoClient.connect(mongo_url, function(err, db) {
		if(err !== null) {
			console.error("Error opening database");
			reject(err);
			return;
		}
		var idObject = params.body.results.map(obj => { return ObjectId(obj._id) });
		var newObj = params.body.results.map(obj => {
			var nObj = {};
			nObj[obj._id] = obj.score;
			return nObj;
		});
		var oneObject = Object.assign({}, ...newObj);
		
		var cursor = db.collection('papers').find({'_id': {$in: idObject}}, {'_id': 1, 'authors': 1, 'title': 1, 'abstract': 1}).map(obj => {
			obj['score'] = oneObject[obj._id];
			obj.abstract = obj.abstract.slice(0, 218) + '...';
			return obj;
		});

		cursor.toArray((err, results) => {
			if(err) {
				rej(err);
			} else {
				var replace = new RegExp(params.search_token, "gi");
				results.forEach(obj => {
					obj.abstract = obj.abstract.replace(replace, '<b>$&</b>');
				});
				var finalResult = sortByScore(results);
				resolve(finalResult);
			}
			db.close();
		});
	});
}

function sortByScore(result, score) {
	return result.sort(function(a, b) {
  		return b.score == a.score ? 0 : +(b.score > a.score) || -1;
  	});
}

module.exports = {
	relatedDocs: relatedDocs
};

