const
	express = require('express'),
	session = require('express-session'),
	assert = require('assert'),
	ObjectId = require('mongodb').ObjectId,
	MongoClient = require('mongodb').MongoClient,
	mongo_url = 'mongodb://localhost:27017/sharesci';

function getComments(req, res){
	var responseJson = {
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
			cursor = db.collection('comments').find( { 'articleId': new ObjectId(req.params.id) });
		} catch(err) {
			console.error(err);
			res.status(500).json( { errno: 1, errstr: 'Unknown error' } );
			return;
		}
		cursor.toArray((err, commentsJson) => {
			if(err){
				responseJson.errno = 1;
				responseJson.errstr = "Something went wrong";
				res.writeHead(500);
			} else {
				responseJson.errno = 0;
				responseJson.results = sortByDate(commentsJson);
				res.json(responseJson);
			}
			db.close();
			res.end();
		});
	});
}

function getUserComments(req, res) {
	var responseJson = {
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

		var cursor, commentsResults, idObject;
		try {
			cursor = db.collection('comments').find({ 'username': req.session.user_id });
		} catch(err) {
			console.error(err);
			res.status(500).json( { errno: 1, errstr: 'Unknown error' } );
			return;
		}
		cursor.toArray((err, commentsJson) => {
			if(err) {
				res.writeHead(500);
				responseJson.errno = 1;
			} else {
				commentsResults = commentsJson;
				idObject = commentsResults.map(obj => { return ObjectId(obj.articleId)});
				var cursor2;
				try {
					cursor2 = db.collection('papers').find({'_id': {$in: idObject}}, {'_id': 1, 'title': 1}).map(obj => {
						var tempObj = {};
						tempObj[obj._id] = obj.title;
						return tempObj;
					});
				} catch(err) {
					console.error(err);
					res.status(500).json( { errno: 1, errstr: 'Unknown error' } );
					return;
				}
				cursor2.toArray((err2, commentsJson2) => {
					if(err2) {
						res.writeHead(500);
						responseJson.errno = 1;
					} else {
						var finalObject = Object.assign({}, ...commentsJson2);
						commentsResults.forEach(function(obj) {
							obj['articleTitle'] = finalObject[obj.articleId];
						});
						db.close();
						responseJson.results = sortByDate(commentsResults);
						res.json(responseJson);
						res.end();
					}
				});
			}
		});
	});
}

function postComment(req, res){
	var responseJson = {
		errno: 0,
		errstr: ''
	};

	if (!req.body.username) {
		res.status(401).json({errno: 1, errstr: 'Unauthorized'});
		return;
	}
	MongoClient.connect(mongo_url, function(err, db) {

		if (err !== null) {
			console.error("Error opening db");
			res.status(500).json( { errno: 1, errstr: 'Error opening DB' } ).end();
			return;
		}

		var date = new Date();
        var options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false };
        var thisDate = new Intl.DateTimeFormat('en-US', options).format(date).replace(',','');

		var cursor;

		try {
			cursor = db.collection('comments').insert({'_id': new ObjectId(), 'username': req.body.username, 'date': thisDate, 'comment': req.body.comment, 'articleId': new ObjectId(req.body.articleId)});
			responseJson.results = {'username': req.body.username, 'date': thisDate, 'comment': req.body.comment};
			res.json(responseJson);
		} catch(err) {
			console.error(err);
			res.status(500).json({ errno: 1, errstr: 'Unknown error' });
			return;
		}
		db.close();
		res.end();
	});
}


function sortByDate(result) {
    return result.sort(function(a, b) {
        return ((a.date > b.date) ? -1 : ((a.date < b.date) ? 1 : 0));
    });
}

/*
function sortByDate(result) {
	return result.sort(function(a, b) {
  		return b.date == a.date ? 0 : +(b.date > a.date) || -1;
  	});
}
*/
module.exports = {
	getComments: getComments,
	getUserComments: getUserComments,
	postComment: postComment
};