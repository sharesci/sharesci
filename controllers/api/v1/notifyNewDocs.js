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
		result: ''
	};

	var apiUrl = 'http://127.0.0.1/api/v1/notifynewdoc';

	var options = {
		uri: apiUrl,
		body: {
			'id': req.params.id
		},
		json: true
	};

	rp(options)
		.then(function(results) {
			responseJSON.result = 'Success';
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

