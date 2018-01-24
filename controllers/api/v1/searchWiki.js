const
	express = require('express'),
	assert = require('assert'),
	http = require('http'),
	ObjectId = require('mongodb').ObjectId,
	MongoClient = require('mongodb').MongoClient,
	mongo_url = 'mongodb://localhost:27017/sharesci';

function searchWiki(req, res){
	var responseJson = {
		errno: 0,
		errstr: '',
		results: null
	};
	MongoClient.connect(mongo_url, function(err, db) {

		if (err !== null) {
			console.error("Error opening db");
			res(err);
			return;
		}
		var cursor = db.collection('wiki').find({'$and':[{'$text': {'$search': req.query.any}}]}, {'_id': 1, 'url': 1, 'title': 1, score: {'$meta': 'textScore'}});
		var numHitsPromise = cursor.count();
		numHitsPromise.then((data)=>{console.log(data);});
		cursor.sort({'score': {'$meta': 'textScore'}});
		cursor.skip(parseInt(req.query.offset));
		if(req.query.maxResults) {
			cursor.limit(parseInt(req.query.maxResults));
		}
		Promise.all([cursor.toArray(), numHitsPromise])
		.then((promiseVals)=>{
			var arr = promiseVals[0];
			var numHits = promiseVals[1];
			if(err){
				res.writeHead(500);
				res(err);
			} else {
				res.json({'results': arr, 'numHits': numHits});
			}
			db.close();
			res.end();
		})
		.catch((err)=>{console.error(err);db.close();});
	});
}

module.exports = {
	searchWiki: searchWiki
};