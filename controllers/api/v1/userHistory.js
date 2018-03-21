const
	express = require('express'),
	session = require('express-session'),
	assert = require('assert'),
	ObjectId = require('mongodb').ObjectId,
	MongoClient = require('mongodb').MongoClient,
	mongo_url = 'mongodb://localhost:27017/sharesci';

function userHistory(req, res){

	MongoClient.connect(mongo_url, function(err, db) {

		if (err !== null) {
			console.error("Error opening db");
			res.status(500).json( { errno: 1, errstr: 'Error opening DB' } ).end();
			return;
		}

		try {
			db.collection('users').update({'_id': req.body.userid}, {$addToSet: {[req.body.type]: req.body.value}}, {upsert: true});
			res.json('Processed userHistory request successfully');
		} catch(err) {
			console.error(err);
			res.status(500).json( { errno: 1, errstr: 'Unknown error' } );
			return;
		}
		db.close();
		res.end();
	});
}

module.exports = {
	userHistory: userHistory,
};