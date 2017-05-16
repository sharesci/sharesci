var fs = require('fs');
var resources = [
  ['node_modules/core-js/client/shim.min.js', 'aot/shim.min.js'],
  ['node_modules/zone.js/dist/zone.min.js', 'aot/zone.min.js'],
  ['src/index-aot.html', 'aot/index.html']
];
resources.map(function(f) {
  console.log(f);
  var s = f[0];
  var d = f[1];
  fs.createReadStream(s).pipe(fs.createWriteStream(d));
});
