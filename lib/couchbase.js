//TODO: remove the Stuff that was integrated for 
const couchbase = require('couchbase');
/**
 * Tryed to solve connection issues when couchbase is not used frequently enough.
 */
class Couchbase {
    constructor(options = {}) {
  
      this.couchbase = options.couchbase || couchbase;
  
      if (!options.cluster) {
        this.cluster = new this.couchbase.Cluster('couchbase://127.0.0.1');
      } else {
        if (typeof options.cluster === 'string') {
          this.cluster = new this.couchbase.Cluster(options.cluster);
        } else {
          this.cluster = options.cluster;
        }
      }
      if (options.username && options.password) {
        this.cluster.authenticate(options.username, options.password);
      }
      
      debug('Couchbase',options);
      if (options.bucket) {
        if (typeof options.bucket === 'string') {
          this.bucket = this.cluster.openBucket(options.bucket);
        } else {
          this.bucket = options.bucket;
        }
      } else {
        this.bucket = this.cluster.openBucket('default');
      }
      // tryOpenBucket();
    }
    tryOpenBucket() {
  
      return new Promise((resolve,reject) => {
        this.bucket.on('error', (err)=> {
          this.couchbaseConnected = false;
          debug('CONNECT ERROR:', err);
          reject(err);
        });
  
        this.bucket.on('connect', () => {
          this.couchbaseConnected = true;
          debug('connected couchbase');
          resolve(true);
        });
      });
  
      /*
      tryOpenBucket();
      const couchbaseConnected = false;
  
      if (couchbaseConnected) {
        return QueryPromise;
      } else {
         // We try and open bucket again here. If its successful, couchbaseConnected will bet set to true and next time data will be fetched from couchbase
        return tryOpenBucket().then(QueryPromise);
         // Get data from persistent store, mysql
      }
      */
    }
  }
  module.exports = Couchbase;