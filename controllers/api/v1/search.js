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
	if(!searchParams.uri) {
		searchParams['uri'] = 'http://137.148.142.215:8000/search';
	}
	if(!searchParams.collection) {
		searchParams['collection'] = 'papers';
	}
	if(!searchParams.engine) {
		searchParams['engine'] = 'mongo';
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
			'collection': searchParams.collection,
			'engine': searchParams.engine,
			'getFullDocs': searchParams.getFullDocs
		},
		json: true
	};

	rp(options)
	.then((searchResults) => {
		if(req.session.user_id) {
			var userSearchOptions = {
				method: 'POST',
				uri: 'http://127.0.0.1/api/v1/userHistory',
				body: {
					'type': 'terms',
					'value': searchParams.any,
					'userid': req.session.user_id
				},
				json: true
			};
			rp(userSearchOptions).catch(function(err) { console.error('userHistory term post request unsuccessful')});
		}
		searchResults['options'] = options;
		return new Promise((resolve, reject) => {getInfo(searchResults, resolve, reject)}).catch(err => {console.error(err)});
	})
	.then((searchResults) => {
		responseJSON.results = searchResults.results;
		responseJSON.numResults = searchResults.numHits;
		res.json(responseJSON);
		res.end();
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
		
		var idObject = params.results.map(obj => { return ObjectId(obj._id) });
		var newObj = params.results.map(obj => {
			var nObj = {};
			nObj[obj._id] = obj.score;
			return nObj;
		});
		var oneObject = Object.assign({}, ...newObj);
		
		var cursor = db.collection('papers').find({'_id': {$in: idObject}}, {'_id': 1, 'title': 1, 'authors': 1}).map(obj => {
			obj['score'] = oneObject[obj._id];
			return obj;
		});

		var numHitsPromise = cursor.count();
		numHitsPromise.then((data)=>{console.log(data);});
		cursor.skip(parseInt(params.options.qs.offset));
		if(params.options.qs.maxResults) {
			cursor.limit(parseInt(params.options.qs.maxResults));
		}

		Promise.all([cursor.toArray(), numHitsPromise])
		.then((results) => {
			var arr = results[0];
			var numHits = results[1];

			if(err) {
				reject(err);
			} else {
				resolve({'results': sortByScore(arr, 'score'), 'numHits': numHits});
			}
			db.close();
		});
	});
}

function sortByScore(result, score) {
    return result.sort(function(a, b) {
        return b[score] - a[score];
    });
}

module.exports = {
	index: index
};