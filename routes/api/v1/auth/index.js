const
	express = require('express'),
	path = require('path'),
	loginRouter = require('./login'),
	logoutRouter = require('./logout'),
	orcidRouter = require('./orcid');

var router = express.Router();

router.use('/login', loginRouter);
router.use('/logout', logoutRouter);
router.use('/orcid', orcidRouter);

module.exports = router;

