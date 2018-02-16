const
	express = require('express'),
	assert = require('assert'),
	session = require('express-session'),
	request = require('request'),
	rp = require('request-promise'),
	http = require('http');

function relatedDocs(req, res) {
	var responseJSON = {
		errno: 0,
		errstr: '',
		results: []
	};

	var searchParams = JSON.parse(JSON.stringify(req.query));

	if(!searchParams['docid']) {
		responseJSON.errno = 5;
		responseJSON.errstr = 'Valid docid required';
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
		searchParams['uri'] = 'http://127.0.0.1/api/v1/related-docs';
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
			'docid': searchParams.docid,
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
	relatedDocs: relatedDocs
};

