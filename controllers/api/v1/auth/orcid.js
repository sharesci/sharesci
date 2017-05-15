const
	tls_options = require('../../../../util/tls-options'),
	fs = require('fs'),
	request = require('request');

function orcidLogin(req, res) {
	var responseJson = {
		errno: 0,
		errstr: ""
	};
	if(req.session.user_id) {
		responseJson.errno = 4;
		responseJson.errstr = "Already logged in";
		res.json(responseObj);
		res.end();
		return;
	}

	if(!req.query.code) {
		res.status(500).json({errno: 6, errstr: 'Missing code'});
		res.end();
		return;
	}

	if(!tls_options['isValid']) {
		res.status(500).json({errno: 1, errstr: 'TLS/SSL initialization failed'});
		res.end();
		return;
	}

	var client_secret = '';
	try {
		client_secret = fs.readFileSync(__dirname + '/../../../../../nocommit/secrets/orcid_client_secret').toString().trim();
	} catch(err) {
		console.error('Failed to find ORCID secret. Cannot use ORCID authentication. Error: ' + err);	
		res.status(500).json({errno: 1, errstr: 'ORCID keys not found on server'});
		res.end();
		return;
	}

	request_options = tls_options;
	request_options['uri'] = 'https://sandbox.orcid.org/oauth/token';
	request_options['method'] = 'POST';
	request_options['form'] = {
		'client_id': 'APP-G1MS6JF7CHPPD08E',
		'client_secret': client_secret,
		'grant_type': 'authorization_code',
		'redirect_url': 'https://sharesci.org',
		'code': req.query.code
	};
	request_options['headers'] = {
		'Accept': 'application/json'
	};

	request(request_options, (err, response, body) => {
		if(err) {
			console.error('Failed to connect to ORCID. Error: ' + err);	
			res.status(500).json({errno: 1, errstr: 'Failed to connect to ORCID'});
			res.end();
			return;
		}
		var orcid_json = {};
		try {
			orcid_json = JSON.parse(body);
		} catch(err) {	
			console.error('Got a bad response from ORCID. Error: ' + err);	
			res.status(500).json({errno: 1, errstr: 'Got a bad response from ORCID'});
			res.end();
			return;
		}
		req.session.user_id = 'orcid:' + orcid_json['orcid'];
		res.redirect('/');
		res.end();
	});

// curl -i -L -k -H 'Accept: application/json' --data 'client_id=APP-G1MS6JF7CHPPD08E&client_secret=c60af9bb-0a2a-4731-b08f-cb21c49e0429&grant_type=authorization_code&redirect_uri=https://sharesci.org&code=HA6tyY' https://sandbox.orcid.org/oauth/token
}


module.exports = {
	orcidLogin: orcidLogin
}
