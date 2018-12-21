const path = require('path');
const nconf = require('nconf');

const defaultConfiguration = require(path.resolve(process.cwd(), 'config.default.json'));

nconf
  .argv()
  .env()
  .defaults(defaultConfiguration);

module.exports = nconf;