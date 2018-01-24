const
	express = require('express'),
	assert = require('assert'),
	ObjectId = require('mongodb').ObjectId,
	MongoClient = require('mongodb').MongoClient,
	mongo_url = 'mongodb://localhost:27017/sharesci';
	validator = require.main.require('./util/account_info_validation');

function getWiki(req, res){
	var responseJson = {
		errno: 0,
		errstr: '',
		wikiJson: null
	};

	MongoClient.connect(mongo_url, function(err, db) {

		if (err !== null) {
			console.error("Error opening db");
			reject(err);
			return;
		}
		var cursor;

		try {
			cursor = db.collection('wiki').find( { '_id': new ObjectId(req.params.id) } );
		} catch(err) {
			console.error(err);
			res.status(500).json( { errno: 1, errstr: 'Unknown error' } );
			return;
		}
		cursor.toArray((err, wikiJson) => {
			if(err){
				res.writeHead(500);
				responseJson.errno = 1;
				responseJson.errstr = "Something went wrong";
			} else {
				responseJson.errno = 0;
				responseJson.wikiJson = wikiJson;
			}
			db.close();
			res.json(responseJson);
			res.end();
		});
	});
}

module.exports = {
	getWiki: getWiki,
};