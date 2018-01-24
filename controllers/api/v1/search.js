const
	express = require('express'),
	assert = require('assert'),
	request = require('request');
	rp = require('request-promise');
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
	if(!searchParams.uri) {
		searchParams['uri'] = 'http://127.0.0.1/api/v1/searchPapers';
	}
	if(searchParams.maxResults) {
		searchParams.maxResults = parseInt(searchParams.maxResults);
	}
	var options = {
		uri: searchParams.uri,
		qs: {
			'offset': searchParams.offset,
			'any': searchParams.any,
			'maxResults': searchParams.maxResults
		},
		json: true
	};
	rp(options)
		.then(function(results) {
			responseJSON.results = results.results;
			responseJSON.numResults = results.numHits;
			res.json(responseJSON);
			res.end();
		})
		.catch(function(err) {
			responseJSON.errno = 1;
			res.json(responseJSON);
			res.end();
		});
}

module.exports = {
	index: index
};

