const
	express = require('express'),
	bodyParser = require('body-parser'),
	orcidController = require('../../../../controllers/api/v1/auth/orcid');

var router = express.Router();

router.get('/', orcidController.orcidLogin);

module.exports = router;

