const
	express = require('express'),
	path = require('path'),
	loginRouter = require('./api/v1/auth/login'),
	logoutRouter = require('./api/v1/auth/logout'),
	accountRouter = require('./account'),
	apiRouter = require('./api');

var router = express.Router();

router.get('/', (req, res, next) => {
	if(req.query.code) {
		res.redirect('/api/v1/auth/orcid?code=' + req.query.code);
		res.end();
	} else {
		next();
	}
});

router.get('/', express.static(__dirname + '/../client'));

router.get('/', function(req, res) {
		res.sendFile(path.resolve('client/aot/index.html'));
});
router.use('/login', loginRouter);
router.use('/logout', logoutRouter);
router.use('/account', accountRouter);
router.use('/api', apiRouter);

module.exports = router;

