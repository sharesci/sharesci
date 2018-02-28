const
	express = require('express'),
	session = require('express-session'),
	assert = require('assert'),
	ObjectId = require('mongodb').ObjectId,
	MongoClient = require('mongodb').MongoClient,
	mongo_url = 'mongodb://localhost:27017/sharesci',
	validator = require.main.require('./util/account_info_validation');

function getComments(req, res){
	var responseJson = {
		errno: 0,
		errstr: '',
		commentsJson: null
	};

	MongoClient.connect(mongo_url, function(err, db) {

		if (err !== null) {
			console.error("Error opening db");
			reject(err);
			return;
		}
		var cursor;

		try {
			cursor = db.collection('comments').find( { '_id': new ObjectId(req.params.id) } );
		} catch(err) {
			console.error(err);
			res.status(500).json( { errno: 1, errstr: 'Unknown error' } );
			return;
		}
		cursor.toArray((err, commentsJson) => {
			if(err){
				res.writeHead(500);
				responseJson.errno = 1;
				responseJson.errstr = "Something went wrong";
			} else {
				responseJson.errno = 0;
				responseJson.commentsJson = commentsJson;
			}
			db.close();
			res.json(responseJson);
			res.end();
		});
	});
}

function getUserComments(req, res) {
	var responseJson = {
		errno: 0,
		errstr: '',
		commentsJson: null
	};

	MongoClient.connect(mongo_url, function(err, db) {

		if (err !== null) {
			console.error("Error opening db");
			reject(err);
			return;
		}
		var cursor;

		try {
			cursor = db.collection('comments').find( { 'username': req.params.username } );
		} catch(err) {
			console.error(err);
			res.status(500).json( { errno: 1, errstr: 'Unknown error' } );
			return;
		}
		cursor.toArray((err, commentsJson) => {
			if(err){
				res.writeHead(500);
				responseJson.errno = 1;
				responseJson.errstr = "Something went wrong";
			} else {
				responseJson.errno = 0;
				responseJson.commentsJson = commentsJson;
			}
			db.close();
			res.json(responseJson);
			res.end();
		});
	});
}

function postComments(req, res){
	var responseJson = {
		errno: 0,
		errstr: ''
	};

	var username = req.session.user_id;

	if (!username) {
		respond_error({errno: 9, errstr: 'Unauthorized'}, 401);
		return;
	}
	MongoClient.connect(mongo_url, function(err, db) {

		if (err !== null) {
			console.error("Error opening db");
			res.status(500).json( { errno: 1, errstr: 'Error opening DB' } ).end();
			return;
		}

		var now = new Date();
		var strDateTime = [[now.getDate(), now.getMonth() + 1, now.getFullYear()].join("/"), [now.getHours(), now.getMinutes()].join(":"), 
    		now.getHours() >= 12 ? "PM" : "AM"].join(" ");

		var cursor, newComment;

		try {
			newComment = "{'_id': req.params.id}, {$addToSet: {'comments':{ _id: ObjectId(), 'username': req.session.user_id, 'date': strDateTime, 'comment': req.params.body, 'articleid': req.params.id}}}, {upsert : true}";
			cursor = db.collection('comments').findAndModify( newComment );
			console.log("inserted ID: ", cursor[0]._id);
		} catch(err) {
			console.error(err);
			res.status(500).json( { errno: 1, errstr: 'Unknown error' } );
			return;
		}
		cursor.toArray((err, postUserComment) => {
			if(err){
				res.writeHead(500);
				responseJson.errno = 1;
			} else {
				responseJson.errno = 0;
				responseJson.commentsJson.push(postUserComment);
			}
			db.close();
			res.json(responseJson);
			res.end();
		});
	});
}

module.exports = {
	getComments: getComments,
	getUserComments: getUserComments,
	postComments: postComments
};