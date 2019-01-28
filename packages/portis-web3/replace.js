const replace = require('replace-in-file');
const pkg = require('./package');
const options = {
  files: ['lib/index.js', 'es/index.js'],
  from: '$$PORTIS_SDK_VERSION$$',
  to: pkg.version,
};
return replace(options);
