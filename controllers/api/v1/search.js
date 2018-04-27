const
	express = require('express'),
	assert = require('assert'),
	session = require('express-session'),
	request = require('request'),
	ObjectId = require('mongodb').ObjectId,
	MongoClient = require('mongodb').MongoClient,
	mongo_url = 'mongodb://localhost:27017/sharesci',
	http = require('http');

function index(req, res) {
	var responseJSON = {
		errno: 0,
		errstr: '',
		results: []
	};

	var searchParams = JSON.parse(JSON.stringify(req.query));

	if(!searchParams.offset) {
		searchParams.offset = 0;
	}
	if(!searchParams.any) {
		searchParams['any'] = 'estimation';
	}
	if(searchParams.maxResults) {
		searchParams.maxResults = parseInt(searchParams.maxResults);
	}
	if(!searchParams.searchType) {
		searchParams['searchType'] = 'Augmented TF-IDF';
	}
	if(!searchParams.uri) {
		if (searchParams.searchType == 'wiki') {
			searchParams['uri'] = 'http://137.148.142.215:1025/search';
		} else {
			searchParams['uri'] = 'http://137.148.142.215:8000/search';
		}
	}
	if(!searchParams.collection) {
		searchParams['collection'] = 'papers';
	}
	if(!searchParams.getFullDocs) {
		searchParams['getFullDocs'] = false;
	}

	var options = {
		uri: searchParams.uri,
		qs: {
			'offset': searchParams.offset,
			'q': searchParams.any,
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
		if (searchParams.searchType == 'wiki') {
			return Promise.resolve(results);
		} else {
			var metadataPromise = new Promise((resolve, reject) => { getInfo(results, options, resolve, reject); });
			return Promise.all([results, metadataPromise]);	
		}
	})
	.then((results) => {
		responseJSON.results = results[1];
		res.json(responseJSON);
		res.end();
	})
	.catch((err) => {
		responseJSON.errno = 1;
		responseJSON.errstr = err.message;
		res.json(responseJSON);
		res.end();
	});
}

function getInfo(results, params, resolve, reject) {
	MongoClient.connect(mongo_url, function(err, db) {
		if(err !== null) {
			console.error("Error opening database");
			reject(err);
			return;
		}
		var idObject = results.body.results.map(obj => { return ObjectId(obj._id) });
		var newObj = results.body.results.map(obj => {
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
				var finalResult = boldSearchTerms(params.qs.q, results);
				resolve(sortByScore(finalResult));
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

function boldSearchTerms(search_token, search_results) {
	var words = search_token.split(" ");

	search_results.forEach(obj => {
		words.forEach(token => {
			obj.abstract = obj.abstract.replace(new RegExp(token, "gi"), '<b>$&</b>');
		});
	});
	return search_results;
}

module.exports = {
	index: index
};