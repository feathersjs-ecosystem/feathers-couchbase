# New Futures
- update method choose able (n1ql,upsert)
- patch method choose able (n1ql,upsert)
- pagination
- generic n1ql find method


## Use
```javascript
// Create App Model
function createModel(app)
module.exports = function (app) {
  const Cluster = app.get('couchbase'); // from config
  const Model = {
   Couchbase: Couchbase,
   Cluster:
   Bucket:
   paginate:
  }

  return Model;
};




const FeathersCouchbase = require('feathers-couchbase')
app.set(CouchbaseConnection, FeathersCouchbase(Model)
```




```javascript
// Initializes the `users` service on path `/api/users`
const createService = require('feathers-nedb');
const createModel = require('../../models/users.model');
const hooks = require('./users.hooks');
//const filters = require('./users.filters');

module.exports = function () {
  const app = this;
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'users',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/api/users', createService(options));


  // Get our initialized service so that we can register hooks and filters
  const service = app.service('api/users');

  

  service.hooks(hooks);

  // if (service.filter) {
  //  service.filter(filters);
  //}
};
```
