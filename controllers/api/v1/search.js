const
	express = require('express'),
	assert = require('assert'),
	session = require('express-session'),
	request = require('request'),
	rp = require('request-promise'),
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
		searchParams['uri'] = 'http://127.0.0.1/api/v1/searchPapers';
	}
	if(!searchParams.collection) {
		searchParams['collection'] = 'papers';
	}
	if(!searchParams.engine) {
		searchParams['engine'] = 'mongo';
	}
	
	var options = {
		uri: searchParams.uri,
		qs: {
			'offset': searchParams.offset,
			'any': searchParams.any,
			'maxResults': searchParams.maxResults,
			'collection': searchParams.collection,
			'engine': searchParams.engine
		},
		json: true
	};

	rp(options)
	.then((results) => {
		responseJSON.results = results.results;
		responseJSON.numResults = results.numHits;
		res.json(responseJSON);
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
		res.end();
	})
	.catch(function(err) {
		responseJSON.errno = 1;
		responseJSON.errstr = err.error;
		res.json(responseJSON);
		res.end();
	});
}

module.exports = {
	index: index
};

