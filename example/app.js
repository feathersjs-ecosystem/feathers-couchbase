const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');

const couchbase = require('couchbase');
const cluster = new couchbase.Cluster('couchbase://localhost', {
  username: 'Administrator',
  password: 'test123'
});

const { CouchbaseService } = require('../lib'); // require('feathers-couchbase')

// Creates an ExpressJS compatible Feathers application
const app = express(feathers());

// Parse HTTP JSON bodies
app.use(express.json());
// Parse URL-encoded params
app.use(express.urlencoded({ extended: true }));
// Host static files from the current folder
app.use(express.static(__dirname));
// Add REST API support
app.configure(express.rest());
// Register a Couchbase people service
app.use('/people', new CouchbaseService({
  cluster,
  name: 'feathers-test',
  paginate: {
    default: 10,
    max: 100
  }
}));
// Register a nicer error handler than the default Express one
app.use(express.errorHandler());

app.listen(3030).on('listening', () => console.log('feathers-couchbase example started'));
