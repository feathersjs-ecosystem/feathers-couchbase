const assert = require('assert');
const adapterTests = require('@feathersjs/adapter-tests');
const errors = require('@feathersjs/errors');
const feathers = require('@feathersjs/feathers');
const couchbase = require('couchbase');

const couchbaseService = require('../lib');
const testSuite = adapterTests([
  '.options',
  '.events',
  '._get',
  '._find',
  '._create',
  '._update',
  '._patch',
  '._remove',
  '.get',
  '.get + $select',
  '.get + id + query',
  '.get + NotFound',
  '.get + id + query id',
  '.find',
  '.remove',
  '.remove + $select',
  '.remove + id + query',
  '.remove + multi',
  '.remove + id + query id',
  '.update',
  '.update + $select',
  '.update + id + query',
  '.update + NotFound',
  '.update + id + query id',
  '.patch',
  '.patch + $select',
  '.patch + id + query',
  '.patch multiple',
  '.patch multi query',
  '.patch + NotFound',
  '.patch + id + query id',
  '.create',
  '.create + $select',
  '.create multi',
  'internal .find',
  'internal .get',
  'internal .create',
  'internal .update',
  'internal .patch',
  'internal .remove',
  '.find + equal',
  '.find + equal multiple',
  '.find + $sort',
  '.find + $sort + string',
  '.find + $limit',
  '.find + $limit 0',
  '.find + $skip',
  '.find + $select',
  '.find + $or',
  '.find + $in',
  '.find + $nin',
  '.find + $lt',
  '.find + $lte',
  '.find + $gt',
  '.find + $gte',
  '.find + $ne',
  '.find + $gt + $lt + $sort',
  '.find + $or nested + $sort',
  '.find + paginate',
  '.find + paginate + $limit + $skip',
  '.find + paginate + $limit 0',
  '.find + paginate + params'
]);

describe('Feathers Couchbase Service', () => {
  const cluster = new couchbase.Cluster('couchbase://localhost', {
    username: 'Administrator',
    password: 'password'
  });
  const app = feathers()
    .use('/people', couchbaseService({
      cluster,
      couchbase: {
        scanConsistency: couchbase.QueryScanConsistency.RequestPlus
      },
      name: 'feathers-test',
      events: ['testing']
    }));

  before(async () => {
    try {
      await cluster.query('CREATE PRIMARY INDEX `feathers-test-index` ON `feathers-test` USING GSI;');
    } catch (error) {
      // Index exists, nothing to do here
    }
    await cluster.query('DELETE from `feathers-test`;');
  });

  it('exports', () => {
    assert.ok(typeof couchbaseService === 'function');
  });

  testSuite(app, errors, 'people', 'id');
  // testSuite(app, errors, 'people-customid', 'customid');
});
