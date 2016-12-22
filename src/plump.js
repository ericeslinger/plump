const $types = Symbol('$types');
const $storage = Symbol('$storage');
const $terminal = Symbol('$terminal');
const $subscriptions = Symbol('$subscriptions');
const $storeSubscriptions = Symbol('$storeSubscriptions');

import { Model } from './model';

import { Subject } from 'rxjs/Rx';

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
            storage.writeHasMany(type, id, field, value);
          } else {
            storage.write(type, value);
          }
          // storage.onCacheableRead(Type, Object.assign({}, u.value, { [Type.$id]: u.id }));
        });
        if (this[$subscriptions][type] && this[$subscriptions][type][id]) {
          this[$subscriptions][type][id].next(value);
        }
      }));
    }
  }

  find(t, id) {
    let Type = t;
    if (typeof t === 'string') {
      Type = this[$types][t];
    }
    const retVal = new Type({ [Type.$id]: id }, this);
    return retVal;
  }

  forge(t, val) {
    let Type = t;
    if (typeof t === 'string') {
      Type = this[$types][t];
    }
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

  get(...args) {
    return this[$storage].reduce((thenable, storage) => {
      return thenable.then((v) => {
        if (v !== null) {
          return v;
        } else {
          return storage.read(...args);
        }
      });
    }, Promise.resolve(null))
    .then((v) => {
      if ((v === null) && (this[$terminal])) {
        return this[$terminal].read(...args);
      } else {
        return v;
      }
    }).then((v) => {
      return v;
    });
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
      return this[$terminal].delete(...args);
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
}
