const
	express = require('express'),
	assert = require('assert'),
	request = require('request'),
	rp = require('request-promise'),
	http = require('http');

function newDoc(req, res) {
	var responseJSON = {
		errno: 0,
		errstr: '',
	};

	var apiUrl = 'http://137.148.142.215:8000/notifynewdoc';

	var options = {
		uri: apiUrl,
		body: {
			'_id': req.body._id
		},
		json: true
	};

	rp(options)
	.then(function(results) {
		res.json(responseJSON);
		res.end();
	})
	.catch(function(err) {
		responseJSON.errno = 1;
		responseJSON.errstr = err;
		res.json(responseJSON);
		res.end();
	});
}

module.exports = {
	newDoc: newDoc
};

