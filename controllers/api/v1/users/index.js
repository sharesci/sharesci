const
	express = require('express'),
	session = require('express-session'),
	validator = require.main.require('./util/account_info_validation.js'),
	pgdb = require.main.require('./util/sharesci-pg-db'),
	bcrypt = require('bcrypt');


function getUserInfo(req, res) {
	var responseJson = {
		errno: 0,
		errstr: '',
		userJson: null
	};

	var username = req.params.username;

	if(!username) {
		responseJson.errno = 2;
		responseJson.errstr = 'Invalid or unknown username';
		res.json(responseJson);
		res.end();
		return;
	}

	pgdb.func('get_user_public_info', [username])
	.then((data) => {
		responseJson.userJson = data;
		res.json(responseJson);
		res.end();
	})
	.catch((err) => {
		console.error(err);
		responseJson.errno = 1;
		responseJson.errstr = 'Unknown error';
		res.json(responseJson);
		res.end();
	});

}


function postUserInfo(req, res) {
	var responseJson = {
		errno: 0,
		errstr: '',
	};
	var respond_error = function(errJson, resHeadStatus) {
		if(resHeadStatus) {
			res.statusCode = resHeadStatus;
		}
		res.json(errJson);
		res.end();
	};

	var username = req.session.user_id;

	if (!username) {
		respond_error({errno: 9, errstr: 'Unauthorized'}, 401);
		return;
	}

	var query_pieces = [];
	var values = {'username': username};
	if(req.body['firstname']) {
		if (!validator.is_valid_firstname(req.body['firstname'])) {
			respond_error({errno: 6, errstr: 'Invalid firstname'});
			return;
		}
		query_pieces.push('firstname = ${firstname}');
		values['firstname'] = req.body['firstname'];
	}
	if(req.body['lastname']) {
		if (!validator.is_valid_lastname(req.body['lastname'])) {
			respond_error({errno: 6, errstr: 'Invalid lastname'});
			return;
		}
		query_pieces.push('lastname = ${lastname}');
		values['lastname'] = req.body['lastname'];
	}
	if(req.body['self_bio']) {
		if (!validator.is_valid_self_bio(req.body['self_bio'])) {
			respond_error({errno: 6, errstr: 'Invalid self_bio'});
			return;
		}
		query_pieces.push('self_bio = ${self_bio}');
		values['self_bio'] = req.body['self_bio'];
	}
	if(req.body['institution']) {
		if (!validator.is_valid_institution(req.body['institution'])) {
			respond_error({errno: 6, errstr: 'Invalid institution'});
			return;
		}
		query_pieces.push('institution = ${institution}');
		values['institution'] = req.body['institution'];
	}

	if(query_pieces.length === 0) {
		respond_error({errno: 7, errstr: 'Missing parameter (one of firstname, lastname, institution, etc)'});
		return;
	}

	var queryStr = 'UPDATE account SET ' + query_pieces.join(', ') + ' WHERE username = ${username};';

	pgdb.none(queryStr, values)
	.then((data) => {
		res.json(responseJson);
		res.end();
	})
	.catch((err) => {
		console.error(err);
		respond_error({errno: 1, errstr: 'Unknown error'});
	});
}


function createUser(req, res) {
	var responseObj = {
		errno: 0,
		errstr: ""
	};

	function onInsertComplete(data){
		responseObj.errno = 0;
		responseObj.errstr = "";
		res.json(responseObj);
		res.end();
	}

	function onInsertFailed(err) {
		if (err.code === '23505') {
			// Violated 'UNIQUE' constraint, so username was already in use
			responseObj.errno = 8;
			responseObj.errstr = "Account already exists";
			res.json(responseObj);
		} else {
			console.error(err);
			responseObj.errno = 1;
			responseObj.errstr = "Unknown error";
			res.json(responseObj);
		}
		res.end();
	}

	valuesPromise = new Promise((resolve, reject) => {values_from_request(req, resolve, reject);});
	valuesPromise.then((values)=>{
		return new Promise((resolve, reject)=>{insertValues(values, resolve, reject);});
	})
	.then(onInsertComplete)
	.catch(onInsertFailed);

	valuesPromise.catch((err) => {
		responseObj.errno = err.errno;
		responseObj.errstr = err.errstr;
		res.json(responseObj);
		res.end();
	});

}

function insertValues(values, resolve, reject) {
	const query = 'INSERT INTO account (username, passhash, firstname, lastname, self_bio, institution) VALUES (${username}, ${passhash}, ${firstname}, ${lastname}, ${self_bio}, ${institution});';
	pgdb.any(query, values)
		.then((data) => {
			resolve(data);
		})
		.catch((err) => {
			reject(err);
		});
}


// Sets up values for insertion into the database
// and validates them. Calls `resolve` with a JSON 
// object containing the values on success, calls 
// `reject` with a JSON object containing error info 
// on failure.
function values_from_request(req, resolve, reject) {
	if(!req.body.password) {
		reject({errno: 6, errstr: 'Missing password'});
		return;
	}
	var passsalt = bcrypt.genSaltSync(10);
	var passhash = bcrypt.hashSync(req.body.password, passsalt);
	var values = {
		'username': req.body.username,
		'passhash': passhash,
		'firstname': req.body.firstname,
		'lastname': req.body.lastname,
		'self_bio': req.body.self_bio,
		'institution': req.body.institution
	};

	for (key in values) {
		if(typeof values[key] === 'undefined') {
			values[key] = null;
		}
	}

	// Validate values
	if (!validator.is_valid_username(values['username'])) {
		reject({errno: 2, errstr: 'Invalid username'});
		return;
	}
	if (!validator.is_valid_password(req.body.password)) {
		reject({errno: 3, errstr: 'Invalid password'});
		return;
	}
	if (!validator.is_valid_firstname(values['firstname'])) {
		reject({errno: 6, errstr: 'Invalid firstname'});
		return;
	}
	if (!validator.is_valid_lastname(values['lastname'])) {
		reject({errno: 6, errstr: 'Invalid lastname'});
		return;
	}
	if (!validator.is_valid_institution(values['institution'])) {
		reject({errno: 6, errstr: 'Invalid institution'});
		return;
	}
	if (!validator.is_valid_self_bio(values['self_bio'])) {
		reject({errno: 6, errstr: 'Invalid self-biography'});
		return;
	}

	resolve(values);
	
}



module.exports = {
	getUserInfo: getUserInfo,
	postUserInfo: postUserInfo,
	createUser: createUser
};

