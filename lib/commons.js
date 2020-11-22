const uuid = require('uuid/v4');
const Debug = require('debug');
const Proto = require('uberproto');

const errors = require('@feathersjs/errors');
const feathersCommons = require('@feathersjs/commons');

const debug = Debug('feathers-couchbase:');
module.exports = { uuid, Debug, Proto, errors, feathers,feathersCommons, debug};