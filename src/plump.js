const $types = Symbol('$types');
const $storage = Symbol('$storage');
const $terminal = Symbol('$terminal');
const $subscriptions = Symbol('$subscriptions');

import Rx from 'rxjs/Rx';

export class Plump {
  constructor(opts = {}) {
    const options = Object.assign({}, {
      storage: [],
      types: [],
    }, opts);
    this[$subscriptions] = {};
    this[$storage] = [];
    this[$types] = {};
    options.storage.forEach((s) => this.addStore(s));
    options.types.forEach((t) => this.addType(t));
  }

  addType(T) {
    if (this[$types][T.$name] === undefined) {
      this[$types][T.$name] = T;
    } else {
      throw new Error(`Duplicate Type registered: ${T.$name}`);
    }
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
    store.onUpdate((u) => {
      this[$storage].forEach((storage) => {
        const Type = this[$types][u.type];
        storage.onCacheableRead(Type, Object.assign({}, u.value, { [Type.$id]: u.id }));
      });
      if (this[$subscriptions][u.type] && this[$subscriptions][u.type][u.id]) {
        this[$subscriptions][u.type][u.id].next(u.value);
      }
    });
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
      this[$subscriptions][typeName][id] = new Rx.Subject();
    }
    return this[$subscriptions][typeName][id].subscribe(handler);
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
