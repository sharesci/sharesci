const
	express = require('express'),
	path = require('path'),
	loginRouter = require('./login'),
	logoutRouter = require('./logout');

var router = express.Router();

router.use('/login', loginRouter);
router.use('/logout', logoutRouter);

module.exports = router;

