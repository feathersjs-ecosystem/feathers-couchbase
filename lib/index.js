//TODO: remove the Stuff that was integrated for 
const couchbase = require('couchbase');
const uuid = require('uuid/v4');
const Debug = require('debug');
const Proto = require('uberproto');

const errors = require('@feathersjs/errors');
const feathersCommons = require('@feathersjs/commons');

const debug = Debug('feathers-couchbase:');
// TODO: Add cas support
const Service = class CouchbaseService {
  constructor (config = {},options = {}) {
    if(!config.cluster) {
      throw new Error('config { !cluster, bucket }');
    } 
    
    if(!config.bucket) {
      throw new Error('config { cluster, !bucket');
    }

    this.couchbase = couchbase;
    
    this.options = options;
    
    this.bucket = config.bucket;
    this.cluster = config.cluster;
    this.paginate = options.paginate || {};
    this._id = this.id = options.idField || options.id || '_id';
    this._uId = options.startId || 0;
    this.store = options.store || {};
    this.events = options.events || [];
    this._matcher = options.matcher;
    this._sorter = options.sorter; 
    this._select = options.select;
    this._filter = options.filter || feathersCommons.filterQuery;
    this._errors = options.errors || errors;
    this.options.required = options.required || [];
    //this._ = _;
    debug('constructor',options);
    /**
     * Defines the degree of consistency required for a particular query.
     * @readonly
     * @enum {number}
     */
    this.SearchConsistency = {
      /**
       * No degree consistency required
       */
      NONE: 0,

      /**
       * Operations performed by this ottoman instance will be reflected
       *   in queries performed by this particular ottoman instance.  This
       *   type of consistency will be slower than no consistency, but faster
       *   than GLOBAL as the index state is tracked internally rather than
       *   requested from the server.
       */
      LOCAL: 1,

      /**
       * Operations performed by any client of the Couchbase Server up to the
       *   time of the queries dispatch will be reflected in any index results.
       *   This is the slowest of all consistency levels as it requires that the
       *   server synchronize its indexes to the current key-value state prior to
       *   execution of the query.
       */
      GLOBAL: 2
    };
    /*
    {
      "total": "<total number of records>",
      "limit": "<max number of items per page>",
      "skip": "<number of skipped items (offset)>",
      "data": [/* data *//*
    }

    {
      limit: 10,
      skip: 10,
      consistency: ottoman.Consistency.LOCAL
    }
    */
  }
  extend (obj) {
    debug('extend',Object.prototype.toString.call(obj).slice(8, -1));
    if (obj.constructor) {
      debug('extend',obj.constructor.name);
    }
    return Proto.extend(obj, this);
  }
  setup (app, path) {
    debug('setup',(app), path);
    this.app = app;
    this.path = path;
  }
  find (params) {
    debug('find',params);
    return this._query(params);
  }
  get (id, params) {
    debug('get',id, params);
    return this._get(id, params);
  }
  create (data, params) {
    // TODO: Handle Array
    /*
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current,params)));
    }
    */
    debug('create',data, params);
    return this._create(data, params);
  }
  update (id, data, params) {
    debug('update',id, data, params);
    return this._update(id, data, params);
  }
  patch (id, data, params) {
    debug('patch',id, data, params);
    return this._patch(id, data, params);
  }
  remove (id, params) {
    // TODO: Fix Remove Backup
    if (params.backup) {
      // return this._get(id);
    }
    debug('create',id, params);
    return this._remove(id, params);
    // this.backup(id,params)
    //      .then(()=>this.removeBackup('status-'+id,params));
  }
  _applyDataMeta (data, params) {
    if (!data.channel) {
      debug('_applyDataChannel',data, params);
      data.channel = params.channel;
    }
    if (!data.CLIENT_IP) {
      debug('_applyDataChannel',data, params);
      data.CLIENT_IP = params.CLIENT_IP;
    }
    return data;
  }
  _patch (id, data, params) {
    var msg = 'PATCH Not Implamented';
    debug('_patch',msg, id, data, params);
    return Promise.reject(new errors.BadRequest(msg));
  }
  _countQuery (query) {
    var countQuery = this.couchbase.N1qlQuery.fromString(query.replace('*', 'COUNT(*)'));
    return new Promise((resolve, reject) => {
      this.bucket.query(countQuery, (err, total) => {
        if (!err) {
          return resolve(total);
        }
        return reject(new errors.GeneralError(err));
      });
    });
  }
  _buildQueryOld (params) {
    // var QUERY = 'SELECT *, META(val).id FROM default val WHERE META(val).id LIKE "'+query+'%" ';
    
    params.query = params.query || {};debug('_buildQueryOld',params);
    
    params = params || {};
    
    params.paginate = params.paginate || false;
    debug('_query',params);
    // var FILTER_ARRAY = [' WHERE val._type LIKE "Artist"'];
    var FILTER_ARRAY = [];
    Object.keys(params.query).map((key) => FILTER_ARRAY.push('val.' + key + ' LIKE "' + params.query[key] + '"'));
    var QUERY;
    if (FILTER_ARRAY.length > 0) {
      QUERY = 'SELECT * FROM default val WHERE ' + FILTER_ARRAY.join(' AND ');
    } else {
      QUERY = 'SELECT * FROM default val';
    }

    debug
    return QUERY;
  }
  _query (params, fullQs) {
    if (!fullQs) {
      fullQs = this._buildQueryOld(params);
    }

    var self = this;
    var QueryPromise = new Promise((resolve, reject) => {
      var n1qlQuery = this.couchbase.N1qlQuery.fromString(fullQs);
      debug('_query::error',n1qlQuery, fullQs);
      if (params.consistency) {
        if (params.consistency === this.SearchConsistency.GLOBAL) {
          n1qlQuery.consistency(this.couchbase.N1qlQuery.Consistency.REQUEST_PLUS);
        } else if (params.consistency === this.SearchConsistency.LOCAL) {
          n1qlQuery.consistency(this.couchbase.N1qlQuery.Consistency.REQUEST_PLUS);
        } else if (params.consistency === this.SearchConsistency.NONE) {
          n1qlQuery.consistency(this.couchbase.N1qlQuery.Consistency.NOT_BOUNDED);
        } else {
          return reject(new Error('Unexpected consistency option.'));
        }
      }
      debug('_query::error',n1qlQuery, fullQs);
      self.bucket.query(n1qlQuery, (err, data) => {
        if (err) {
          debug('_query::error',err);
          return reject(err);
        }
        debug('_query::result',data);
    
    }).then((res) => res.map((itm) => itm.val));    return resolve(data);
      
  });
    
    /*
    return this._countQuery(QUERY).then((total)=>{
    
      if(params.paginate){
      
        var result = {
          total,
          'limit': params.paginate.limit || 100,
          'skip': params.paginate.skip || 0,
          data: []
        };
        return result;
      }).then((result)=>{
        if (result.total === 0){
        } else {
          return QueryPromise
            .then((data)=> {
                         });
        }
      });
    }
    */
    // We try and open bucket again here. If its successful, couchbaseConnected will bet set to true and next time data will be fetched from couchbase
    return QueryPromise;
    // .then(logReturn)
    // .then(jsonStringify)
  }
  // update is single patch is mult
  _update (id, data, params) {
    debug('_update::start',id, data, params);
    return this._checkRequired(data).then(() => {
      return new Promise((resolve, reject) => {
        this.bucket.upsert(id, data, function (err, result) {
          if (err) {
            debug('_update::error',id, data, params, err);
            return reject(err);
          }
          debug('_update::done',id, data, params, result);
          resolve(data);
        });
      });
    });
  }
  _create (data, params) {
    // TODO: Handle Array
    /*
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current,params)));
    }
    */
    // TODO: Replace with createKey Method
    var hasId = '' + (!!data._id);

    if (!data._id) {
      data._id = uuid();
    }

    var cbKey = data._id;
    if (data._type) {
      cbKey = data._type + '|' + data._id;
    }

    if (data.cbKey) {
      cbKey = data.cbKey;
    }
    data.cbKey = cbKey;
    var self = this;
    return this._checkRequired(data)
      .then(() => self._upsert(cbKey, data))
      .catch((err) => {
        debug('_create::error',data, params, hasId, err);
      });
  }
  _upsert (key, data) {
    return new Promise((resolve, reject) => {
      this.bucket.upsert(key, data, (err, done) => {
        if (!err) {
          debug('_upsert::result',{key, data, done});
          resolve(data);
        } else {
          debug('_upsert::error',{key, data, err});
          reject(err);
        }
      });
    });
  }
  _checkRequired (data) {
    var Keys = Object.keys(data);
    return new Promise((resolve, reject) => {
      if (this.options.required.length > 0) {
        this.options.required.map((key) => {
          if (key.indexOf(Keys) === -1) {
            reject(new Error('data.' + key + ' is a required property'));
          }
        });
      }
      resolve(true);
    });
  }
  _backup (id, params) {
    var DELETE_ID = 'recycleBin|' + id + '-' + new Date().toISOString();
    return this.get(id)
      .then((TARGET) => {
        return this._create(DELETE_ID, TARGET);
      }).then(() => {
        this._remove(id, params);
      });
  }
  _servicelogger ({ id, params, data, commandName }) {
    data.lastModifyedBy = '' + commandName;
    data.lastModifyed = new Date().toISOString();
    let serviceArguments = { id, params, data };
    return this.app.service('servicelogger').create({
      date: data.lastModifyed,
      serviceName: 'couchbase',
      commandName,
      serviceArguments
    });
  }
  _createLogEntryPromise ({ id, params, data }) {
    return Promise.resolve({ id, params, data });
  }
  _remove (id, params) {
    return this._get(id)
      .then((data) => {
        return this._isArray(id, this._removePromise)
          // Logging includes backup!
          .then(() => {
            if (Array.isArray(id)) {
              debug('_isArray::true',id);
              return Promise.all(data.map((data) => this._servicelogger({ id: data._id, params, data })));
            } else {
              debug('_isArray::false',id);
              return this._servicelogger(id, params, data);
            }
          });
      });
  }
  _removePromise (id) {
    return new Promise((resolve, reject) => {
      this.bucket.remove(id, (error, done) => {
        if (!error) {
          debug('_removePromise::done',id, done);
          resolve({ id, done });
        } else {
          debug('_removePromise::error',id, error);

          reject(new Error({ id, error }));
        }
      });
    });
  }
  _get (id, params) {
    debug('_get',id, params);
    return this._isArray(id);
  }
  _isArray (id) {
    if (Array.isArray(id)) {
      // TODO: Use getMulti?
      debug('_isArray::true',id);
      return Promise.all(id.map(this._getPromise));
    } else {
      debug('_isArray::false',id);
      return this._getPromise(id);
    }
  }
  _getPromise (id) {
    debug('_getPromise::result',id);
    var promise = new Promise((resolve, reject) => {
      this.bucket.get(id, (err, data) => {
        if (!err) {
          debug('_getPromise::result',id, data);
          resolve(data.value);
        }
        debug(err, id);
        reject(new errors.BadRequest(err));
      });
    });
    return promise;
  }
  _getMultiPromise (ids) {
    // TODO: Better Error Handling
    return new Promise((resolve, reject) => {
      this.bucket.getMulti(ids, (err, data) => {
        if (!err) {
          debug('_get::result',data);
          resolve(data);
        }

        reject(new Error({err, ids}));
      }).then((data) => {
        data
          .filter((entry) => typeof entry.value !== typeof Error) // Condition maybe Wrong?=!
          .map((result) => result.value);
        return data;
      });
    });
  }
  /**
 * Builds a N1QL expression that will filter based on the
 *   specified Ottoman filter expression.
 *
 * @param {Object} filters
 *   The Ottoman filter expression object that we are currently parsing.
 * @param {string[]} expressions
 *   A list of expresion that have been generated so far.
 * @param {string} [root]
 *   The root path leading up to the keys specified in the filter.
 * @private
 * @ignore
 */
  _buildFilterExprs (filters, expressions, root) {
    var SPECIAL_KEYS = ['$exists', '$missing', '$contains', '$like', '$in'];
    var BOOLEAN = ['or', 'and'];
    if (!root) {
      root = '';
    }

    for (var i in filters) {
      if (filters.hasOwnProperty(i)) {
        if (SPECIAL_KEYS.indexOf(i) !== -1) {
          continue;
        }

        var ident = root + '`' + i.split('.').join('`.`') + '`';
        if (filters[i].$exists) {
          expressions.push(ident + ' IS VALUED');
        } else if (filters[i].$missing) {
          expressions.push(ident + ' IS MISSING');
        }
        if (filters[i].$like) {
          expressions.push(ident + ' LIKE ' + '\'' + filters[i].$like + '\'');
        }
        if (filters[i].$contains) {
          var subfilters = filters[i].$contains;
          var subexprs = [];
          this._buildFilterExprs(subfilters, subexprs, 'x.');
          expressions.push('ANY x IN ' + ident + ' SATISFIES ' +
          subexprs.join(' AND ') + ' END');
        }
        if (BOOLEAN.indexOf(i.toLowerCase()) !== -1) {
          var booleanExprs = [];

          for (var j in filters[i]) {
            if (filters[i].hasOwnProperty(j)) {
              this._buildFilterExprs(filters[i][j], booleanExprs, '');
            }
          }

          expressions.push('(' + booleanExprs.join(' ' +
          i.toUpperCase() + ' ') + ')');
        } else if (i.toLowerCase() === 'not') {
          var notExprs = [];
          for (var z in filters[i]) {
            if (filters[i].hasOwnProperty(z)) {
              this._buildFilterExprs(filters[i][z], notExprs, '');
            }
          }
          expressions.push('NOT (' + notExprs.join(' AND ') + ')');
        } else if (filters[i] instanceof Object) {
          this._buildFilterExprs(filters[i], expressions, ident + '.');
        } else {
          if (typeof filters[i] === 'number' || typeof filters[i] === 'boolean') {
            expressions.push(ident + '=' + filters[i]);
          } else if (typeof filters[i] === 'string') {
            expressions.push(
              ident + '=\'' + filters[i].replace('\'', '\\\'') + '\'');
          } else {
            throw new Error('Invalid filter value.');
          }
        }
      }
    }
  }
  /**
 * Performs a count of the documents matching a particular
 *   filter expression and model type.
 *
 * @param {string} type
 *   The type of index to use for the search.  Currently unused (always N1QL).
 * @param {string} modelName
 *   The name of the model to look for.
 * @param {Object} options
 *   @param {Object} options.filter
 *     The filter expression for filtering documents for counting.
 * @param {StoreAdapter~SearchCallback} callback
 */
  _count (params) {
    var options = params;
    options.filter = params.query;
    debug('CbStoreAdapter::count',options);
    var expressions = [];
    // expressions.push('_type=\'' + modelName + '\'');
    if (options.filter) {
      this._buildFilterExprs(options.filter, expressions);
    }
    var bucketName = this.bucket._name;
    var whereQs = '';
    if (expressions.length > 0) {
      whereQs = ' WHERE ' + expressions.join(' AND ');
    }

    var fullQs = 'SELECT COUNT(b) AS count FROM `' + bucketName + '` b' + whereQs;
    debug('CbStoreAdapter::count~query',fullQs);

    return this._query({ QUERY: fullQs }).then((res) => {
      if (res.length > 0) {
        return res[0].count;
      } else {
        return 0;
      }
    });
    /*
    var query = couchbase.N1qlQuery.fromString(fullQs);
    return new Promise((resolve,reject)=>{
      this.bucket.query(query, function (err, res) {
        if (err) {
          return reject(err);
        }

        if (res.length > 0) {
          return resolve(res[0].count);
        } else {
          return resolve(0);
        }
      });
    });
    */
  }

  /**
 * Performs a generic find by a filter expression.
 *
 * @param {string} type
 *   The type of index to use for the search.  Currently unused (always N1QL).
 * @param {string} modelName
 *   The name of the model to search within.
 * @param {Object} options
 *   @param {Object} options.filter
 *     The filter expression to filter with.
 *   @param {number} options.limit
 *     The maximum number of results to return.
 *   @param {number} options.skip
 *     The number of results to skip before returning results.
 *   @param {string|string[]} options.sort
 *     A field name or list of field names to sort the results by.
 *
 */
  _fullQueryString (params) {
    var options = {};
    options.filter = params.query;
    options.limit = params.limit;
    options.skip = params.skip;
    options.sort = params.sort;
    debug('CbStoreAdapter::find',options, params);

    var expressions = [];

    // expressions.push('_type=\'' + modelName + '\'');
    if (options.filter) {
      this._buildFilterExprs(options.filter, expressions);
    }
    var bucketName = this.bucket._name;
    var whereQs = '';
    if (expressions.length > 0) {
      whereQs = ' WHERE ' + expressions.join(' AND ');
    }
    var pagingQs = '';
    if (options.limit !== undefined && options.skip !== undefined) {
      pagingQs = ' LIMIT ' + options.limit + ' OFFSET ' + options.skip;
    } else if (options.limit !== undefined) {
      pagingQs = ' LIMIT ' + options.limit;
    } else if (options.skip !== undefined) {
      throw new Error('Must have limit to use skip.');
    }
    var sortQs = '';
    if (options.sort !== undefined) {
      var sortKeys = options.sort;
      if (typeof sortKeys === 'string') {
        sortKeys = [sortKeys];
      }

      if (Array.isArray(sortKeys)) {
        sortQs = ' ORDER BY ' + sortKeys.join(',');
      } else if (sortKeys instanceof Object) {
        var sortWords = [];
        for (var i in sortKeys) {
          if (sortKeys.hasOwnProperty(i)) {
            if (sortKeys[i] === 1 || sortKeys[i] === true) {
              sortWords.push(i + ' ASC');
            } else {
              sortWords.push(i + ' DESC');
            }
          }
        }
        sortQs = ' ORDER BY ' + sortWords.join(',');
      } else {
        throw new Error('Unknown sort value.');
      }
    }
    // 'SELECT META(b).id AS id FROM `' + bucketName +
    var fullQs =
      'SELECT * FROM `' + bucketName +
      '` val' + whereQs + sortQs + pagingQs;
    debug('CbStoreAdapter::find~query',fullQs);
    return fullQs;
  }
  // ._find({ query: { _type: 'Artist', images: { $contains: { path: '2.jpg' } } } }).then(console.log)
  _find (params) {
    var fullQs = this._fullQueryString(params);
    return this._query(params, fullQs);
  }
  _createKey (data, params) {
    // TODO: if params use that key
    if (data._id === undefined) {
      data._id = uuid();
    }
    debug('_createKey',data._id, params);
    return data;
  }
};


// TODO: Add cas support
/**
 * Class OdemService extends the core methods of CouchbaseService to use
 * Ottoman key patterns gets used for individual key patterns and to
 * use Ottoman Models.
 * @param {*} config 
 * @param {*} options 
 */
const OdmService = class OdmService extends CouchbaseService {
  constructor (config = {} ,options = {}) {
    
    if (config.keySpcae) {
      options.prefix = config.keySpcae;
      debug('deprecated please use prefix instead of keySpace');
    } else if (!config.prefix) {
      if (!options.prefix) {
        throw new errors.GeneralError('no prefix for this service?');
      }
    }

    super(config,options);
    this.prefix = config.prefix || options.prefix;
    this.seperator = options.seperator || '|';
    this.typeProp = options.typeProp || '_type';
    this.idProp = options.idProp || '_id';
  }
  extend (obj) {
    return Proto.extend(obj, this);
  }
  setup (app, path) {
    this.app = app;
    this.path = path;
    super.setup(app, path);
  }
  find (params) {
    debug('find::info',params);
    if (params.query[this.typeProp] !== this.prefix) {
      debug('find::info','params.query[this.typeProp] !== this.prefix',params.query[this.typeProp], this.prefix);
    }
    params.query[this.typeProp] = this.prefix;
    const seperator = this.seperator;
    return super._find(params).then((data) => {
      return data.filter((itm) => {
        if (itm.cbKey) {
          if (itm.cbKey === itm[this.typeProp] + seperator + itm[this.idProp]) {
            return itm;
          } else {
            debug('find::warning::filtered',itm);
          }
        }
      });
    });
  }
  get (id, params) {
    if (Array.isArray(id)) {
      debug('get::multi',id, params);
    } else {
      debug('get::single',id, params);
    }

    return super.get(this.prefix + this.seperator + id);
    // .then((res)=>res[0]);
    // return this._query({ _id: id, _type: this.prefix}).then((res)=>res[0]);
  }
  create (data, params) {
    if (data[this.idProp]) {
      debug('create::warning','DEPRECATED: Called with id set %s', data[this.idProp]);
    }
    if (data[this.typeProp]) {
      debug('create::warning','DEPRECATED: Called with type set %s', data[this.typeProp]);
    }

    return super._create(this._createKey(data), params);

    /*
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current,params)));
    }
    */
  }
  // update is single patch is mult
  update (id, data) {
    debug('update',id, this._getKey(id), data);
    return super.update(this._getKey(id), data);
  }
  patch (id, data, params) {
    return this._patch(this._getKey(id), params);
  }
  remove (id, params) {
    debug('remove',id, this._getKey(id), params);
    return this._remove(this._getKey(id), params)
      .catch((e) => {
        if (e.code === 13) {
          debug('remove::Warning::KeyNotFoundTryId',id, this._getKey(id), params);
          return this._remove(id, params);
        }
        debug('remove::error',e);
      });
  }
  _queryOdm (filter) {
    // var QUERY = 'SELECT *, META(val).id FROM default val WHERE META(val).id LIKE "'+query+'%" ';
    delete filter[this.typeProp];

    // var FILTER_ARRAY = [' WHERE val[this.typeProp] LIKE "Artist"'];
    var FILTER_ARRAY = [' WHERE META(val).id LIKE "' + this.prefix + '%"'];
    Object.keys(filter).map((key) => FILTER_ARRAY.push('val.' + key + ' LIKE "' + filter[key] + '"'));
    var QUERY = 'SELECT *, META(val).id FROM default val' + FILTER_ARRAY.join(' AND ');
    debug(':_queryOdm',QUERY);
    return 'DEPERECATED';
    // return db.runQuery(QUERY).then((res)=>res.map((itm)=>itm.val));
  }
  _getKey (id) {
    var prefix = this.prefix + this.seperator + id;
    debug(':_getKey',prefix);
    return prefix;
  }
  _createKey (data, params) {
    // TODO: if params use that key
    if (data[this.idProp] === undefined) {
      data[this.idProp] = uuid();
    }
    if (data[this.typeProp] === undefined) {
      data[this.typeProp] = this.prefix;
    }

    var cbKey = data[this.typeProp] + this.seperator + data[this.idProp];
    debug(':_createKey',cbKey, params);
    data.cbKey = cbKey;
    return data;
  }
}



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
/**
 * set app.couchbaseClient
 * @param {*} config 
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

// config { couchbase, bucket, cluster }
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

init.Service = CouchbaseService;
init.OdmService = OdmService;
init.Couchbase = Couchbase;
init.connect = connect;

module.exports = init;