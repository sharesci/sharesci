const
	express = require('express'),
	assert = require('assert'),
	http = require('http'),
	ObjectId = require('mongodb').ObjectId,
	MongoClient = require('mongodb').MongoClient,
	mongo_url = 'mongodb://localhost:27017/sharesci';

function relatedDocuments(req, res){
	
	MongoClient.connect(mongo_url, function(err, db) {

		if (err !== null) {
			console.error("Error opening db");
			res(err);
			return;
		}
		var cursor = db.collection(req.query.collection).find({'$and':[{'$text': {'$search': req.query.docid}}]}, {'_id': 1, 'title': 1, 'authors': 1, 'updated-date': 1, 'versions': 1, 'documentJson': 1, score: {'$meta': 'textScore'}});
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
				res.json({'results': stripVersions(arr), 'numHits': numHits});
			}
			db.close();
			
			res.end();
		})
		.catch((err)=>{console.error(err);db.close();});
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
	relatedDocuments: relatedDocuments
};