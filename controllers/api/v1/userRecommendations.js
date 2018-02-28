const
	express = require('express'),
	assert = require('assert'),
	session = require('express-session'),
	request = require('request'),
	rp = require('request-promise'),
	http = require('http');

function userRecommendations(req, res) {
	var responseJSON = {
		errno: 0,
		errstr: '',
		results: []
	};

	var searchParams = JSON.parse(JSON.stringify(req.query));

	if(!searchParams['userid']) {
		responseJSON.errno = 5;
		responseJSON.errstr = 'Valid userid required';
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
		searchParams['uri'] = 'http://137.148.142.215:8000/user-recommendations';
	}
	if(!searchParams.collection) {
		searchParams['collection'] = 'papers';
	}
	if(!searchParams.engine) {
		searchParams['engine'] = 'mongo';
	}
	if(!searchParams.getFullDocs) {
		searchParams['getFullDocs'] = true;
	}
	
	var options = {
		uri: searchParams.uri,
		qs: {
			'offset': searchParams.offset,
			'userid': searchParams.userid,
			'maxResults': searchParams.maxResults,
			'collection': searchParams.collection,
			'engine': searchParams.engine,
			'getFullDocs': searchParams.getFullDocs
		},
		json: true
	};

	rp(options)
	.then((searchResults) => {
		responseJSON.numResults = searchResults.numHits;

		if(searchParams.getFullDocs) {
			searchResults['options'] = options;
			var newPromise = new Promise((resolve, reject) => {getInfo(searchResults, resolve, reject)});
			newPromise.then((results) => {
				responseJSON.results = results.results;
				res.json(responseJSON);
				res.end();
			})
			.catch((err) => {
				console.error(err);
			});
		} else {
			responseJSON.results = searchResults.results;
			res.json(responseJSON);
			res.end();
		}
	})
	.catch(function(err) {
		responseJSON.errno = 1;
		responseJSON.errstr = err.error;
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

		var cursor = db.collection('papers').find({'_id': {$in: idObject}});
		var numHitsPromise = cursor.count();
		numHitsPromise.then((data)=>{console.log(data);});
		cursor.sort({'score': 1});
		cursor.skip(parseInt(params.options.qs.offset));
		if(params.options.qs.maxResults) {
			cursor.limit(parseInt(params.options.qs.maxResults));
		}
		Promise.all([cursor.toArray(), numHitsPromise])
		.then((promiseVals)=>{
			var arr = promiseVals[0];
			var numHits = promiseVals[1];
			var newArr = stripVersions(arr);

			var finalObj = newArr.map(obj => {
				var fObj = {};
				fObj['_id'] = obj._id;
				fObj['documentJson'] = obj;
				fObj['score'] = oneObject[obj._id];
				delete fObj.documentJson._id;
				return fObj;
			});

			if(err){
				reject(err);

			} else {
				resolve({'results': finalObj, 'numHits': numHits});
			}
			db.close();
		})
		.catch((err) => {
			console.error(err);
			db.close();
		});
	});
}


// Processes the JSON a search results set so any articles with multiple
// versions show the most recent version
function stripVersions(resultSet) {
	for (let i = 0; i < resultSet.length; i++) {
		if (!('versions' in resultSet[i])) {
			continue;
		}
		// Just take the most recent version and discard everything
		// else
		// TODO: Currently this will return extra information like
		// fulltext and abstract if the version JSON has it; to be
		// correct, it should only return the same fields specified by
		// the MongoDB query
		recentVersion = resultSet[i].versions.slice(-1)[0];
		recentVersion._id = resultSet[i]._id;
		recentVersion.score = resultSet[i].score;
		resultSet[i] = recentVersion;
	}
	return resultSet;
}

module.exports = {
	userRecommendations: userRecommendations
};

