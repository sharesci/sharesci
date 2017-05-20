const
	express = require('express'),
	bodyParser = require('body-parser'),
	loginController = require.main.require('./controllers/api/v1/auth/login');

var router = express.Router();

router.post('/', bodyParser.urlencoded({ extended: true }));
router.post('/', loginController.loginAction);
router.get('/', loginController.getLogin);

module.exports = router;

