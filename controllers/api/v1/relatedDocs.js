const
	express = require('express'),
	assert = require('assert'),
	ObjectId = require('mongodb').ObjectId,
	MongoClient = require('mongodb').MongoClient,
	mongo_url = 'mongodb://localhost:27017/sharesci';


function relatedDocs(req, res) {
	var responseJSON = {
		errno: 0,
		errstr: '',
		results: []
	};

	MongoClient.connect(mongo_url, function(err, db) {

		if (err !== null) {
			console.error("Error opening db");
			reject(err);
			return;
		}
		var cursor;

		try {
			cursor = db.collection('papers').find( { '_id': req.params.id } );
		} catch(err) {
			console.error(err);
			res.status(500).json({ 
				errno: 1, 
				errstr: 'Unknown error' 
			});
			return;
		}

		cursor.toArray((err, results) => {
			if(err){
				res.writeHead(500);
				responseJson.errno = 1;
				responseJson.errstr = err;
			} else {
				responseJson.errno = 0;
				responseJson.results = results.results;
			}
			db.close();
			res.json(responseJson);
			res.end();
		});
	});
}

module.exports = {
	relatedDocs: relatedDocs
};

