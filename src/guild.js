const $types = Symbol('$types');
const $storage = Symbol('$storage');
const $terminal = Symbol('$terminal');
const $subscriptions = Symbol('$subscriptions');

import Rx from 'rxjs/Rx';

export class Guild {
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
        storage.onCacheableRead(Type, Object.assign({}, u.value, {[Type.$id]: u.id}));
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
    const retVal = new Type({[Type.$id]: id}, this);
    return retVal;
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

  get(type, id, field) {
    return this[$storage].reduce((thenable, storage) => {
      return thenable.then((v) => {
        if (v !== null) {
          return v;
        } else {
          return storage.read(type, id, field);
        }
      });
    }, Promise.resolve(null))
    .then((v) => {
      if ((v === null) && (this[$terminal])) {
        return this[$terminal].read(type, id, field);
      } else {
        return v;
      }
    }).then((v) => {
      return v;
    });
  }

  save(type, val) {
    if (this[$terminal]) {
      return this[$terminal].write(type, val);
    } else {
      return Promise.reject(new Error('Guild has no terminal store'));
    }
  }

  add(type, parentId, relationship, childId) {
    if (this[$terminal]) {
      return this[$terminal].add(type, parentId, relationship, childId);
    } else {
      return Promise.reject(new Error('Guild has no terminal store'));
    }
  }

  remove(type, parentId, relationship, childId) {
    if (this[$terminal]) {
      return this[$terminal].remove(type, parentId, relationship, childId);
    } else {
      return Promise.reject(new Error('Guild has no terminal store'));
    }
  }

  forge(t, val) {
    let Type = t;
    if (typeof t === 'string') {
      Type = this[$types][t];
    }
    return new Type(val, this);
  }
}
