// TypeScript Version: 3.0
import { Params, Paginated, Id, NullableId } from '@feathersjs/feathers';
import { AdapterService, ServiceOptions, InternalServiceMethods } from '@feathersjs/adapter-commons';
import { Cluster } from 'couchbase';

export interface CouchbaseServiceOptions extends ServiceOptions {
  name: string;
  cluster: Cluster;
  retries?: number;
}

export class CouchbaseService<T = any> extends AdapterService<T> implements InternalServiceMethods<T> {
  constructor(config?: Partial<CouchbaseServiceOptions>);

  _find(params?: Params): Promise<T | T[] | Paginated<T>>;
  _get(id: Id, params?: Params): Promise<T>;
  _create(data: Partial<T> | Array<Partial<T>>, params?: Params): Promise<T | T[]>;
  _update(id: NullableId, data: T, params?: Params): Promise<T>;
  _patch(id: NullableId, data: Partial<T>, params?: Params): Promise<T>;
  _remove(id: NullableId, params?: Params): Promise<T>;
}

declare const init: ((config?: Partial<CouchbaseServiceOptions>) => CouchbaseService);
export default init;
