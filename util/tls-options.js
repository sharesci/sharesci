const
	fs = require('fs');

var options = {isValid: false};

try {
	options = {
		key: fs.readFileSync('/etc/letsencrypt/live/sharesci.org/privkey.pem'),
		cert: fs.readFileSync('/etc/letsencrypt/live/sharesci.org/cert.pem')
	};
	options['isValid'] = true;
	options['errObj'] = null;
} catch (err) {
	options['isValid'] = false;
	options['errObj'] = err;
	if (err.errno === -13 && err.syscall === 'open') {
		console.error('Access permissions denied to SSL certificate files.' +
			' TLS/SSL will not be available. Try running as root.');
	} else {
		console.error(err);
	}
}

module.exports = options;

