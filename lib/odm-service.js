const { uuid, Proto, errors, debug} = require('./commons.js');
const CouchbaseService = require('./couchbase-service.js');
/**
 * Class OdemService extends the core methods of CouchbaseService to use
 * Ottoman key patterns gets used for individual key patterns and to
 * use Ottoman Models.
 * @param {*} config 
 * @param {*} options 
 */
class OdmService extends CouchbaseService {
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
module.exports = OdmService;  