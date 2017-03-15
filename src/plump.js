import { Model } from './model';
import { Subject } from 'rxjs/Rx';
import Bluebird from 'bluebird';

const $types = Symbol('$types');
const $storage = Symbol('$storage');
const $terminal = Symbol('$terminal');
const $teardown = Symbol('$teardown');
const $subscriptions = Symbol('$subscriptions');
const $storeSubscriptions = Symbol('$storeSubscriptions');

export class Plump {
  constructor(opts = {}) {
    const options = Object.assign({}, {
      storage: [],
      types: [],
    }, opts);
    this[$teardown] = new Subject();
    this.destroy$ = this[$teardown].asObservable();
    this[$subscriptions] = {};
    this[$storeSubscriptions] = [];
    this[$storage] = [];
    this.stores = [];
    this[$types] = {};
    options.storage.forEach((s) => this.addStore(s));
    options.types.forEach((t) => this.addType(t));
  }

  addTypesFromSchema(schemata, ExtendingModel = Model) {
    for (const k in schemata) { // eslint-disable-line guard-for-in
      class DynamicModel extends ExtendingModel {}
      DynamicModel.fromJSON(schemata[k]);
      this.addType(DynamicModel);
    }
  }

  addType(T) {
    if (this[$types][T.$name] === undefined) {
      this[$types][T.$name] = T;
      this[$storage].forEach(s => s.addType(T));
      if (this[$terminal]) {
        this[$terminal].addType(T);
      }
    } else {
      throw new Error(`Duplicate Type registered: ${T.$name}`);
    }
  }

  type(T) {
    return this[$types][T];
  }

  types() {
    return Object.keys(this[$types]);
  }

  addStore(store) {
    if (store.terminal) {
      if (this[$terminal] !== undefined) {
        throw new Error('cannot have more than one terminal store');
      } else {
        this[$terminal] = store;
        this[$storage].forEach((cacheStore) => {
          cacheStore.wire(store, this.destroy$);
        });
      }
    } else {
      this[$storage].push(store);
      if (this[$terminal] !== undefined) {
        store.wire(this[$terminal], this.destroy$);
      }
    }
    this.stores.push(store);
    this.types().forEach(t => store.addType(this.type(t)));
  }

  find(t, id) {
    const Type = typeof t === 'string' ? this[$types][t] : t;
    return new Type({ [Type.$id]: id }, this);
  }

  forge(t, val) {
    const Type = typeof t === 'string' ? this[$types][t] : t;
    return new Type(val, this);
  }

  teardown() {
    this[$teardown].next(0);
  }

  get(type, id, opts) {
    const keys = opts && !Array.isArray(opts) ? [opts] : opts;
    return this[$storage].reduce((thenable, storage) => {
      return thenable.then((v) => {
        if (v !== null) {
          return v;
        } else if (storage.hot(type, id)) {
          return storage.read(type, id, keys);
        } else {
          return null;
        }
      });
    }, Promise.resolve(null))
    .then((v) => {
      if (((v === null) || (v.attributes === null)) && (this[$terminal])) {
        return this[$terminal].read(type, id, keys);
      } else {
        return v;
      }
    });
  }

  bulkGet(type, id) {
    return this[$terminal].bulkRead(type, id);
  }

  save(...args) {
    if (this[$terminal]) {
      return this[$terminal].write(...args);
    } else {
      return Promise.reject(new Error('Plump has no terminal store'));
    }
  }

  delete(...args) {
    if (this[$terminal]) {
      return this[$terminal].delete(...args).then(() => {
        return Bluebird.all(this[$storage].map((store) => {
          return store.delete(...args);
        }));
      });
    } else {
      return Promise.reject(new Error('Plump has no terminal store'));
    }
  }

  add(...args) {
    if (this[$terminal]) {
      return this[$terminal].add(...args);
    } else {
      return Promise.reject(new Error('Plump has no terminal store'));
    }
  }

  restRequest(opts) {
    if (this[$terminal] && this[$terminal].rest) {
      return this[$terminal].rest(opts);
    } else {
      return Promise.reject(new Error('No Rest terminal store'));
    }
  }

  modifyRelationship(...args) {
    if (this[$terminal]) {
      return this[$terminal].modifyRelationship(...args);
    } else {
      return Promise.reject(new Error('Plump has no terminal store'));
    }
  }

  remove(...args) {
    if (this[$terminal]) {
      return this[$terminal].remove(...args);
    } else {
      return Promise.reject(new Error('Plump has no terminal store'));
    }
  }

  // invalidate(type, id, field) {
  //   const hots = this[$storage].filter((store) => store.hot(type, id));
  //   if (this[$terminal].hot(type, id)) {
  //     hots.push(this[$terminal]);
  //   }
  //   return Bluebird.all(hots.map((store) => {
  //     return store.wipe(type, id, field);
  //   })).then(() => {
  //     if (this[$subscriptions][type.$name] && this[$subscriptions][type.$name][id]) {
  //       return this[$terminal].read(type, id, field);
  //     } else {
  //       return null;
  //     }
  //   });
  // }
}
