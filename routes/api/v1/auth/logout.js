const
	express = require('express'),
	bodyParser = require('body-parser'),
	logoutController = require.main.require('./controllers/api/v1/auth/logout');

var router = express.Router();

router.use('/', bodyParser.urlencoded({ extended: true }));
router.use('/', logoutController.logoutAction);


module.exports = router;

