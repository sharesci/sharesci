const
	express = require('express'),
	bodyParser = require('body-parser'),
	usersController = require.main.require('./controllers/api/v1/users'),
	useremailsController = require.main.require('./controllers/api/v1/users/emails');

var router = express.Router();

router.post('/', bodyParser.urlencoded({extended: true}), usersController.createUser);

router.get('/:username', usersController.getUserInfo);

router.get('/:username/emails', useremailsController.getUserEmail);

module.exports = router;

