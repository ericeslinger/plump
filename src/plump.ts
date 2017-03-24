import { Model } from './model';
import { Subject, Observable } from 'rxjs/Rx';
import * as Bluebird from 'bluebird';
import { Interfaces } from './dataTypes';

export class Plump {

  destroy$: Observable<string>;

  private teardownSubject: Subject<string>;
  private storage: Storage[];
  private types: Interfaces.StringIndexed<Model>;
  private terminal: Storage;

  constructor(opts = {}) {
    const options = Object.assign({}, {
      storage: [],
      types: [],
    }, opts);
    this.teardownSubject = new Subject();
    this.storage = [];
    this.types = {};
    this.destroy$ = this.teardownSubject.asObservable();
    options.storage.forEach((s) => this.addStore(s));
    options.types.forEach((t) => this.addType(t));
  }

  addType(T) {
    if (this.types[T.type] === undefined) {
      this.types[T.type] = T;
      this.storage.forEach(s => s.addType(T));
      if (this.terminal) {
        this.terminal.addType(T);
      }
    } else {
      throw new Error(`Duplicate Type registered: ${T.type}`);
    }
  }

  type(T) {
    return this.types[T];
  }

  addStore(store) {
    if (store.terminal) {
      if (this.terminal !== undefined) {
        throw new Error('cannot have more than one terminal store');
      } else {
        this.terminal = store;
        this.storage.forEach((cacheStore) => {
          cacheStore.wire(store, this.destroy$);
        });
      }
    } else {
      this.storage.push(store);
      if (this.terminal !== undefined) {
        store.wire(this.terminal, this.destroy$);
      }
    }
    for (const typeName in this.types) {
      store.addType(this.types[typeName]);
    }
  }

  find(t, id) {
    const Type = typeof t === 'string' ? this.types[t] : t;
    return new Type({ [Type.$id]: id }, this);
  }

  forge(t, val) {
    const Type = typeof t === 'string' ? this.types[t] : t;
    return new Type(val, this);
  }

  teardown() {
    this.teardownSubject.next('done');
  }

  get(value, opts = ['attributes']) {
    const keys = opts && !Array.isArray(opts) ? [opts] : opts;
    return this.storage.reduce((thenable, storage) => {
      return thenable.then((v) => {
        if (v !== null) {
          return v;
        } else if (storage.hot(value)) {
          return storage.read(value, keys);
        } else {
          return null;
        }
      });
    }, Promise.resolve(null))
    .then((v) => {
      if (((v === null) || (v.attributes === null)) && (this.terminal)) {
        return this.terminal.read(value, keys);
      } else {
        return v;
      }
    });
  }

  bulkGet(type, id) {
    return this.terminal.bulkRead(type, id);
  }

  save(value) {
    if (this.terminal) {
      return Bluebird.resolve()
      .then(() => {
        if (Object.keys(value.attributes).length > 0) {
          return this.terminal.writeAttributes(value);
        } else {
          return null;
        }
      })
      .then((updated) => {
        if (value.relationships && Object.keys(value.relationships).length > 0) {
          return Bluebird.all(Object.keys(value.relationships).map((relName) => {
            return Bluebird.all(value.relationships[relName].map((delta) => {
              if (delta.op === 'add') {
                return this.terminal.writeRelationshipItem(value, relName, delta);
              } else if (delta.op === 'remove') {
                return this.terminal.deleteRelationshipItem(value, relName, delta);
              } else if (delta.op === 'modify') {
                return this.terminal.writeRelationshipItem(value, relName, delta);
              } else {
                throw new Error(`Unknown relationship delta ${JSON.stringify(delta)}`);
              }
            }));
          })).then(() => updated);
        } else {
          return updated;
        }
      });
    } else {
      return Promise.reject(new Error('Plump has no terminal store'));
    }
  }

  delete(...args) {
    if (this.terminal) {
      return this.terminal.delete(...args).then(() => {
        return Bluebird.all(this.storage.map((store) => {
          return store.delete(...args);
        }));
      });
    } else {
      return Promise.reject(new Error('Plump has no terminal store'));
    }
  }

  add(...args) {
    if (this.terminal) {
      return this.terminal.add(...args);
    } else {
      return Promise.reject(new Error('Plump has no terminal store'));
    }
  }

  restRequest(opts) {
    if (this.terminal && this.terminal.rest) {
      return this.terminal.rest(opts);
    } else {
      return Promise.reject(new Error('No Rest terminal store'));
    }
  }

  modifyRelationship(...args) {
    if (this.terminal) {
      return this.terminal.modifyRelationship(...args);
    } else {
      return Promise.reject(new Error('Plump has no terminal store'));
    }
  }

  remove(...args) {
    if (this.terminal) {
      return this.terminal.remove(...args);
    } else {
      return Promise.reject(new Error('Plump has no terminal store'));
    }
  }

  invalidate(type, id, field) {
    const fields = Array.isArray(field) ? field : [field];
    this.terminal.fireWriteUpdate({ type, id, invalidate: fields });
  }
}
