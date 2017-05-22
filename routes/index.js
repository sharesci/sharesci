const
	express = require('express'),
	path = require('path'),
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

router.use('/api', apiRouter);

module.exports = router;

