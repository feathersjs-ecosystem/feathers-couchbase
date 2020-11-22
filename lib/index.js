// TODO: Add cas support
const init = require('./init.js');
init.Service = require('./couchbase-service.js');
init.OdmService = require('./odm-service.js');
init.Couchbase = require('./couchbase.js');
init.connect = require('./connect.js');

module.exports = init;