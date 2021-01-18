const { NotFound } = require('@feathersjs/errors');
const { _ } = require('@feathersjs/commons');
const { AdapterService } = require('@feathersjs/adapter-commons');
const shortid = require('shortid');
const couchbase = require('couchbase');

class CouchbaseService extends AdapterService {
  constructor (options = {}) {
    super(_.extend({
      id: 'id',
      retries: 10
    }, options));

    this.cluster = options.cluster;
    this.bucket = this.cluster.bucket(options.name);
    this.Model = this.bucket.defaultCollection();
  }

  getWhere (params) {
    const mapping = {
      $gt: '>',
      $gte: '>=',
      $lt: '<',
      $lte: '<=',
      $ne: '!=',
      $in: 'IN',
      $nin: 'NOT IN'
    };
    const { query, filters, paginate } = this.filterQuery(params);

    const parameters = [];
    const objectToQuery = obj => Object.keys(obj).map(field => {
      const value = obj[field];

      if (field === '$or' && Array.isArray(value)) {
        return value.map(current => `(${objectToQuery(current)})`).join('OR');
      }

      if (typeof value === 'object') {
        return Object.keys(value).map(qualifier => {
          const qualifierValue = value[qualifier];
          const placeholder = parameters.push(qualifierValue);

          return `${field} ${mapping[qualifier]} $${placeholder}`;
        }).join(' AND ');
      }

      const placeholder = parameters.push(value);

      return `${field} == $${placeholder}`;
    }).join(' AND ');

    const result = objectToQuery(query);

    let where = result ? `WHERE ${result} ` : '';
    const count = where;

    if (filters.$sort) {
      where += 'ORDER BY ' + Object.keys(filters.$sort).map(field => {
        const value = filters.$sort[field];

        return `${field} ${value === 1 ? 'ASC' : 'DESC'}`;
      }).join(' , ');
    }

    if (filters.$limit !== undefined) {
      where += ` LIMIT $${parameters.push(filters.$limit)}`;
    }

    if (filters.$skip) {
      where += ` OFFSET $${parameters.push(filters.$skip)}`;
    }

    return { where, count, parameters, query, filters, paginate };
  }

  getSelect (query = {}) {
    const { $select } = query;

    if (!$select) {
      return `\`${this.options.name}\`.*`;
    }

    const fields = $select.concat(this.id);

    return fields.map(name => `\`${this.options.name}\`.${name}`).join(', ');
  }

  async query (query, options) {
    return this.cluster.query(query, {
      ...this.options.couchbase,
      ...options
    });
  }

  async _find (params = {}) {
    const { where, count, parameters, paginate, filters } = this.getWhere(params);
    const query = `SELECT ${this.getSelect(params.query)} FROM \`${this.options.name}\` ${where};`;
    const { rows: data } = await this.query(query, {
      parameters
    });

    if (paginate.default !== undefined) {
      const countQuery = `SELECT COUNT(${this.id}) AS count FROM \`${this.options.name}\` ${count}`;
      const { rows: [{ count: total }] } = await this.query(countQuery, { parameters });
      const { $limit: limit, $skip: skip = 0 } = filters;

      return { total, limit, skip, data };
    }

    return data;
  }

  async _get (id, params = {}) {
    const { where, parameters } = this.getWhere(params);
    const query = `SELECT ${this.getSelect(params.query)} FROM \`${this.options.name}\` USE KEYS '${id}' ${where}`;
    const { rows } = await this.query(query, { parameters });

    if (rows && rows[0]) {
      return rows[0];
    }

    throw new NotFound(`No record found for id ${id}`);
  }

  async _create (data, params = {}) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this._create(current, params)));
    }

    const id = data[this.id] || shortid.generate();
    const doc = {
      ...data,
      [this.id]: id
    };
    const q = `INSERT INTO \`${this.options.name}\` (KEY, VALUE) VALUES ("${id}", $1) RETURNING ${this.getSelect(params.query)}`;
    const { rows } = await this.query(q, {
      parameters: [doc]
    });

    return Array.isArray(data) ? rows : rows[0];
  }

  async _update (id, data, params = {}) {
    // Not great but recommended in the docs
    // https://docs.couchbase.com/nodejs-sdk/current/howtos/error-handling.html
    for (let retry = 0; retry < this.options.retries; ++retry) {
      try {
        await this._get(id, params);
        await this.Model.replace(id, data);

        // success!
        break;
      } catch (e) {
        if (e instanceof couchbase.CasMismatchError) {
          // we can simply try the cas operation again...
          continue;
        }

        // if we ran into another kind of error, let's re-throw it...
        throw e;
      }
    }

    return this._get(id, params);
  }

  async _patch (id, data, params = {}) {
    if (id === null) {
      const entries = await this._find({
        ...params,
        paginate: false
      });

      return Promise.all(entries.map(current => this._patch(current[this.id], data, params)));
    }

    const original = await this._get(id, params);

    return this._update(id, {
      ...original,
      ...data
    });
  }

  async _remove (id, params = {}) {
    if (id === null) {
      const entries = await this._find({
        ...params,
        paginate: false
      });

      return Promise.all(entries.map(current => this._remove(current[this.id], params)));
    }

    const model = await this._get(id, params);

    await this.Model.remove(id);

    return model;
  }
}

module.exports = options => {
  return new CouchbaseService(options);
};

module.exports.CouchbaseService = CouchbaseService;
