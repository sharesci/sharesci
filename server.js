const
	express = require('express'),
	express_session = require('express-session'),
	compression = require('compression'),
	https = require('https'),
	http = require('http'),
	tls_options = require('./util/tls-options'),
	rootRouter = require('./routes/index');

const httpPort = 80;
const httpsPort = 443;

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
app.use('/', express.static(__dirname + '/client/dist'));

try {
	httpServer = http.createServer(app).listen(httpPort);
	httpServer.on('error', (err) => {
		console.error('HTTP server error: ', err)
	});
	console.log("Started HTTP server at port " + httpPort);
} catch (err) {
	console.error("Failed to start HTTP server at port " + httpPort);
}

if (https_ok) {
	try {
		https.createServer(https_options, app).listen(9443);
		console.log("Started HTTPS server at port " + httpsPort);
	} catch (err) {
		https_ok = false;
		console.error("Failed to start HTTPS server at port " + httpsPort);
	}
}
