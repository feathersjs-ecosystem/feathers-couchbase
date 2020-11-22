const CouchbaseService = require('./couchbase-service.js');
/**
 * FeathersJS init hook
 * @param { couchbase, bucket, cluster } config 
 * @param {*} options 
 */
function init( config = false, options = {} ) {
    const app = this;
    connect(config,app);
    return new CouchbaseService( app.get('couchbaseClient'), options );
}
module.exports = init;