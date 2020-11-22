const Couchbase = require('./couchbase.js')
/**
 * set app.couchbaseClient
 * @param { couchbase, bucket, cluster } config 
 * @param {*} app 
  */
 function connect(config,app) {
    if (!app) {
      app = this;
    }
    if (!config){
      config = app.get('couchbase');
    }
    if (!app.get('couchbaseClient')) {
      config = new Couchbase(config);
      app.set('couchbaseClient', config);
    }
  }

  module.exports = connect;