const
	express = require('express'),
	bodyParser = require('body-parser'),
	usersController = require.main.require('./controllers/api/v1/users'),
	useremailsController = require.main.require('./controllers/api/v1/users/emails'),
	userCommentsController = require.main.require('./controllers/api/v1/comments');

var router = express.Router();

router.post('/', bodyParser.urlencoded({extended: true}), usersController.createUser);

router.get('/:username', usersController.getUserInfo);

router.get('/:username/emails', useremailsController.getUserEmail);

router.get('/:username/comments', userCommentsController.getUserComments);

module.exports = router;

