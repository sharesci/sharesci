const
	express = require('express'),
	pdftotext = require('pdftotextjs'),
	assert = require('assert'),
	rp = require('request-promise'),
	ObjectId = require('mongodb').ObjectId,
	MongoClient = require('mongodb').MongoClient,
	mongo_url = 'mongodb://localhost:27017/sharesci',
	validator = require.main.require('./util/account_info_validation');


function getArticle(req, res) {
	var responseJson = {
		errno: 0,
		errstr: '',
		articleJson: null
	};

	var usePdf = (req.query.pdf === "1");
	var version = ('version' in req.params && typeof req.params.version === 'string') ? new String(req.params.version) : 'v0';
	if(!(/^v(\d+)$/).test(version)) {
		responseJson.errno = 1;
		responseJson.errstr = 'Incorrect version number format';
		res.status(422).json(responseJson);
		return;
	}
	try {
		version = parseInt(version.slice(1));
	} catch(err) {
		console.log(err);
		version = 0;
	}

	MongoClient.connect(mongo_url, function(err, db) {
		if(err !== null) {
			console.error("Error opening db");
			res.status(500).json({errno: 1, errstr: 'Error opening DB'}).end();
			return;
		}
		if (!req.params.id) {
			db.close();
			responseJson.errno = 5;
			res.status(422).json(responseJson);
			res.end();
			return;
		}
		var cursor;

		try {
			cursor = db.collection('papers').find({'_id': new ObjectId(req.params.id)});
		} catch(err) {
			console.error(err);
			res.status(500).json({errno: 1, errstr: 'Unknown error'});
			return;
		}
		cursor.toArray((err, articleJson)=>{
			if(err){
				res.writeHead(500);
				responseJson.errno = 1;	
			} else {
				responseJson.errno = 0;
				responseJson.articleJson = null;
				if(articleJson.length > 0) {
					let aj = articleJson[0];
					if ('versions' in aj && version <= aj.versions.length && 0 < aj.versions.length) {
						// Use slice() so negative indexes work
						responseJson.articleJson = aj.versions.slice(version-1)[0];
						responseJson.articleJson['_id'] = aj['_id'];
					} else if(!('versions' in articleJson) && version === 0) {
						// Unversioned article, so the whole blob represents v0.
						responseJson.articleJson = aj;
					} else {
						responseJson.errno = 1;
						responseJson.errstr = 'Version not found';
						responseJson.articleJson = null;
						res.status(404);
					}
				}
			}
			db.close();

			// For user recommendations: if user is logged in,
			// post article id to users history collection
			if(req.session.user_id) {
				var articleId = JSON.parse(JSON.stringify(responseJson.articleJson._id));
				var options = {
					method: 'POST',
					uri: 'http://127.0.0.1/api/v1/userHistory',
					body: {
						'type': 'docIds',
						'value': articleId,
						'userid': req.session.user_id
					},
					json: true
				};
				rp(options).catch(function(err) {
					console.error('userHistory article post request unsuccessful');
				});
			}

			if(!usePdf) {
				res.json(responseJson);
				res.end();
				return;
			}
			if(articleJson.length === 0) {
				res.status(404).json({errno: 1, errstr: 'File not found'}).end();
				return;
			}

			// The responseJson.articleJson contains the desired
			// version of the article, and it is the JSON for this
			// version that has the relevant information about
			// where the PDF file is stored.
			// TODO: This is an ugly hack. articleJson shouldn't be
			// getting reassigned like this all the time
			articleJson = responseJson.articleJson;
			if(!articleJson['file'] || !articleJson['file']['name']) {
				res.status(404).json({errno: 1, errstr: 'File not found'}).end();
				return;
			}
			var headers = {
				'x-timestamp': new Date(),
				'x-sent': true
			}
			if(typeof articleJson['file']['mimetype'] === 'string') {
				headers['Content-Type'] = articleJson['file']['mimetype'];
			}
			if(typeof articleJson['file']['originalname'] === 'string') {
				headers['Content-disposition'] = 'inline; filename='+articleJson['file']['originalname'];
			}
			var sendfileOptions = {
				root: __dirname + '/../../../uploads/',
				dotfiles: 'deny',
				headers: headers
			};
			res.sendFile(articleJson['file']['name'], sendfileOptions, (err) => {
				if(err) {
					console.error(err);
					console.error('Problem sending file: ', articleJson);
				}
				res.end();
			});
		});
	});
}

function postArticle(req, res) {
	var responseJson = {
		errno: 0,
		errstr: ''
	};

	var metaJson = req.body.metaJson;
	if(!validator.is_valid_articleMetaJson(metaJson)) {
		console.error('Invalid JSON');
		res.status(422).json({errno: 1, errstr: 'Invalid JSON'}).end();
		return;
	}
	metaJson = JSON.parse(metaJson);

	var curDateJson = (new Date()).toJSON();

	// Sanitize some protected fields
	delete metaJson['file'];
	metaJson['updated'] = curDateJson;

	if(!metaJson['_id']) {
		delete metaJson['_id'];
		if (!metaJson['title']) {
			res.status(422).json({errno: 1, errstr: 'Missing title'}).end();
			return;
		}
		metaJson['references'] = metaJson['references'] || [];
		metaJson['created'] = curDateJson;
	}
	else {
		metaJson['_id'] = new ObjectId(metaJson['_id']);
	}

	let fullTextPromise = Promise.resolve(metaJson['fulltext_text'] || "");

	if(req.files.length > 0) {
		fullTextPromise = parseFullText(__dirname + '/../../../uploads/' + req.files[0].filename);
		let fileinfo = req.files[0];
		metaJson['file'] = {
			'name': fileinfo['filename'],
			'originalname': fileinfo['originalname'],
			'mimetype': fileinfo['mimetype']
		};
	}

	fullTextPromise = fullTextPromise.then((text) => {
		metaJson['fulltext_text'] = text;
		return metaJson['fulltext_text'];
	})
	.catch((err) => {
		console.error(err);
		metaJson['fulltext_text'] = metaJson['fulltext_text'] || "";
		return metaJson['fulltext_text'];
	});

	MongoClient.connect(mongo_url, function(err, db) {
		if(err !== null) {
			console.error("Error opening db");
			res.status(500).json({errno: 1, errstr: 'Error opening DB'}).end();
			return;
		}
		var handlerFunc = (err, data)=>{
			db.close();
			if(err){
				res.writeHead(500);
				responseJson.errno = 1;	
			} else {
				responseJson.errno = 0;
				responseJson.errstr = '';
			}
			if(data['insertedIds']) {
				responseJson.insertedIds = data.insertedIds;
			}
			res.json(responseJson);
			res.end();
		};

		fullTextPromise.then((text) => {
			if(metaJson['_id']) {
				db.collection('papers').update({'_id': metaJson['_id']}, {'$push': {'versions': metaJson}}, handlerFunc);
			} else {
				let docJson = {
					'versions': [metaJson]
				};
				db.collection('papers').insert(docJson, handlerFunc);
			}

			// Notify the server of new document upload for reindexing purposes
			var newDocOptions = {
				method: 'POST',
				uri: 'https://127.0.0.1/api/v1/notifyNewDocs',
				body: {
					_id: docJson._id
				},
				json: true
			};
			
			rp(newDocOptions).catch(function(err) { 
				console.error('notifyNewDocs post request unsuccessful');
			});
			
		})
		.catch((err) => {
			console.log(err);
			responseJson.errno = 1;
			responseJson.errstr = 'Unknown error';
			res.status(500).json(responseJson);
		});
	});
}

function parseFullText(paperfile) {
return new Promise((resolve, reject) => {
	pdf = new pdftotext(paperfile);
	pdf.getText((err, data, cmd) => {
		if(err) {
			reject(err);
			return;
		}
		resolve(data);
	});
});
}


module.exports = {
	getArticle: getArticle,
	postArticle: postArticle
};