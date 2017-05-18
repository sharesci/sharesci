const
	express = require('express'),
	bodyParser = require('body-parser'),
	loginController = require.main.require('./controllers/api/v1/auth/login');
	usersController = require.main.require('./controllers/api/v1/users'),
	useremailController = require.main.require('./controllers/api/v1/users/emails'),
	userpasswordController = require.main.require('./controllers/api/v1/users/password');

var router = express.Router();

router.use('/', bodyParser.urlencoded({ extended: true }));
router.get('/', loginController.getLogin);
router.post('/', usersController.postUserInfo);

router.post('/password', bodyParser.urlencoded({ extended: true }));
router.post('/password', userpasswordController.putUserPassword);

router.use('/emails', bodyParser.urlencoded({ extended: true }));
router.post('/emails', useremailController.postUserEmail);
router.delete('/emails', useremailController.deleteUserEmail);

module.exports = router;

