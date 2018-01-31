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
  // Optional Default uses module resolve(couchbase)
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
