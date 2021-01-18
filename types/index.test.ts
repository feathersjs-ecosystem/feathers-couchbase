import { default as createService, Service } from 'feathers-couchbase';

const service1 = createService();
const service2 = new Service({
  name: 'feathers-test'
});

service1._find({});
