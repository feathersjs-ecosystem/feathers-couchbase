# feathers-couchbase

[![Dependency Status](https://img.shields.io/david/daffl/feathers-couchbase.svg?style=flat-square)](https://david-dm.org/daffl/feathers-couchbase)
[![Download Status](https://img.shields.io/npm/dm/feathers-couchbase.svg?style=flat-square)](https://www.npmjs.com/package/feathers-couchbase)

A [Feathers](https://feathersjs.com) service adapter for Couchbase.

```bash
$ npm install --save feathers-couchbase
```

> __Important:__ `feathers-couchbase` implements the [Feathers Common database adapter API](https://docs.feathersjs.com/api/databases/common.html) and [querying syntax](https://docs.feathersjs.com/api/databases/querying.html).

## Supported by

[![fortify-logo](https://user-images.githubusercontent.com/338316/99841179-9befd280-2b22-11eb-932e-b8ff850fe44c.png)](https://fortify.pro/)

## API

### `service([options])`

Returns a new service instance initialized with the given options.

```js
const service = require('feathers-couchbase');

app.use('/messages', service());
app.use('/messages', service({ id, startId, store, events, paginate }));
```

__Options:__

- `id` (*optional*, default: `'id'`) - The name of the id field property.
- `events` (*optional*) - A list of [custom service events](https://docs.feathersjs.com/api/events.html#custom-events) sent by this service
- `name` - The name of the bucket (must be created in Couchbase admin)
- `cluster` - The couchbase cluster instance
- `paginate` (*optional*) - A [pagination object](https://docs.feathersjs.com/api/databases/common.html#pagination) containing a `default` and `max` page size
- `whitelist` (*optional*) - A list of additional query parameters to allow
- `multi` (*optional*) - Allow `create` with arrays and `update` and `remove` with `id` `null` to change multiple items. Can be `true` for all methods or an array of allowed methods (e.g. `[ 'remove', 'create' ]`)

## Example

Here is an example of a Feathers server with a `messages` in-memory service that supports pagination:

```
$ npm install @feathersjs/feathers @feathersjs/express couchbase feathers-couchbase
```

In `app.js`:

```js
const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');

const couchbase = require('couchbase');
const cluster = new couchbase.Cluster('couchbase://localhost', {
  username: 'Administrator',
  password: 'test123'
});

const { CouchbaseService } = require('feathers-couchbase');

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
```

Run the example with `node app` and go to [localhost:3030/messages](http://localhost:3030/messages).

## License

Copyright (c) 2020

Licensed under the [MIT license](LICENSE).

# TODO
- make backup configure able 

# New Futures

- update method choose able (n1ql,upsert)
- patch method choose able (n1ql,upsert)
- pagination
- generic n1ql find method

## Use

```javascript
const couchbase = require('couchbase')
const cluster = new couchbase.Cluster('couchbase://127.0.0.1')
const bucket = cluster.openBucket('default')
const config = {
  cluster,
  bucket,
  // Optional Default uses module npm.resolve(couchbase)
}

const createService = require('feathers-couchbase')

// Method one Set the couchbaseClient on App
app.set('couchbaseClient', config);
app.use('/',createService()); // reads automatic app.couchbaseClient

// Method 2
app.use('/',createService(config));

// Method 4
import { Service } from 'feathers-couchbase';
new Service(config)
```