import { Model } from './model';
import { Subject, Observable } from 'rxjs/Rx';
import Bluebird from 'bluebird';

const $types = Symbol('$types');
const $storage = Symbol('$storage');
const $terminal = Symbol('$terminal');
const $subscriptions = Symbol('$subscriptions');
const $storeSubscriptions = Symbol('$storeSubscriptions');

export class Plump {
  constructor(opts = {}) {
    const options = Object.assign({}, {
      storage: [],
      types: [],
    }, opts);
    this[$subscriptions] = {};
    this[$storeSubscriptions] = [];
    this[$storage] = [];
    this[$types] = {};
    options.storage.forEach((s) => this.addStore(s));
    options.types.forEach((t) => this.addType(t));
  }

  addTypesFromSchema(schema, ExtendingModel = Model) {
    Object.keys(schema).forEach((k) => {
      class DynamicModel extends ExtendingModel {}
      DynamicModel.fromJSON(schema[k]);
      this.addType(DynamicModel);
    });
  }

  addType(T) {
    if (this[$types][T.$name] === undefined) {
      this[$types][T.$name] = T;
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
      if (this[$terminal] === undefined) {
        this[$terminal] = store;
      } else {
        throw new Error('cannot have more than one terminal store');
      }
    } else {
      this[$storage].push(store);
    }
    if (store.terminal) {
      this[$storeSubscriptions].push(store.onUpdate(({ type, id, value, field }) => {
        this[$storage].forEach((storage) => {
          if (field) {
            storage.writeHasMany(type, id, field, value.relationships[field]);
          } else {
            storage.write(type, value);
          }
          // storage.onCacheableRead(Type, Object.assign({}, u.value, { [Type.$id]: u.id }));
        });
        if (this[$subscriptions][type.$name] && this[$subscriptions][type.$name][id]) {
          this[$subscriptions][type.$name][id].next({ field, value });
        }
      }));
    }
  }

  find(t, id) {
    const Type = typeof t === 'string' ? this[$types][t] : t;
    return new Type({ [Type.$id]: id }, this);
  }

  forge(t, val) {
    const Type = typeof t === 'string' ? this[$types][t] : t;
    return new Type(val, this);
  }

  // LOAD (type/id), SIDELOAD (type/id/side)? Or just LOADALL?
  // LOAD needs to scrub through hot caches first

  subscribe(typeName, id, handler) {
    if (this[$subscriptions][typeName] === undefined) {
      this[$subscriptions][typeName] = {};
    }
    if (this[$subscriptions][typeName][id] === undefined) {
      this[$subscriptions][typeName][id] = new Subject();
    }
    return this[$subscriptions][typeName][id].subscribe(handler);
  }

  teardown() {
    this[$storeSubscriptions].forEach((s) => s.unsubscribe());
    this[$subscriptions] = undefined;
    this[$storeSubscriptions] = undefined;
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
    }).then((v) => {
      return v;
    });
  }

  streamGet(type, id, opts) {
    const keys = opts && !Array.isArray(opts) ? [opts] : opts;
    return Observable.create((observer) => {
      return Bluebird.all((this[$storage].map((store) => {
        return store.read(type, id, keys)
        .then((v) => {
          observer.next(v);
          if (store.hot(type, id)) {
            return v;
          } else {
            return null;
          }
        });
      })))
      .then((valArray) => {
        const possiVal = valArray.filter((v) => v !== null);
        if ((possiVal.length === 0) && (this[$terminal])) {
          return this[$terminal].read(type, id, keys)
          .then((val) => {
            observer.next(val);
            return val;
          });
        } else {
          return possiVal[0];
        }
      }).then((v) => {
        observer.complete();
        return v;
      });
    });
  }

  bulkGet(root, opts) {
    return this[$terminal].bulkRead(root, opts);
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

  invalidate(type, id, field) {
    const hots = this[$storage].filter((store) => store.hot(type, id));
    if (this[$terminal].hot(type, id)) {
      hots.push(this[$terminal]);
    }
    return Bluebird.all(hots.map((store) => {
      return store.wipe(type, id, field);
    })).then(() => {
      if (this[$subscriptions][type.$name] && this[$subscriptions][type.$name][id]) {
        return this[$terminal].read(type, id, field);
      } else {
        return null;
      }
    });
  }
}
