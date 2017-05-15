const
	express = require('express'),
	express_session = require('express-session'),
	compression = require('compression'),
	https = require('https'),
	http = require('http'),
	tls_options = require('./util/tls-options'),
	rootRouter = require('./routes/index');

const app = express();

var https_options = tls_options;
var https_ok = tls_options['isValid'];

app.use('/', (req, res, next) => {
	if(https_ok && !req.secure) {
		return res.redirect(['https://', req.get('Host'), req.url].join(''));
	}
	next();
});
app.use(compression());
app.use(express_session({
	secret: require('crypto').randomBytes(64).toString('base64'),
	resave: false,
	saveUninitialized: false,
	httpOnly: true,
	secure: true,
	ephemeral: true,
	cookie: { maxAge: 16*60*60*1000 }
}));
app.use('/', rootRouter);
app.use('/', express.static(__dirname + '/client'));

http.createServer(app).listen(80);

if (https_ok) {
	try {
		https.createServer(https_options, app).listen(443);
	} catch (err) {
		https_ok = false;
	}
}
