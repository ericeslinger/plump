import { Subject, Observable } from 'rxjs/Rx';
import * as Bluebird from 'bluebird';
import * as Interfaces from './dataTypes';
import { Storage } from './storage/storage';
import { Model } from './model';

export class Plump {

  destroy$: Observable<string>;

  private teardownSubject: Subject<string>;
  private storage: Storage[];
  private types: Interfaces.StringIndexed<Interfaces.ModelConstructor>;
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

  addType(T: Interfaces.ModelConstructor) {
    if (this.types[T.typeName] === undefined) {
      this.types[T.typeName] = T;
      this.storage.forEach(s => s.addSchema(T));
      if (this.terminal) {
        this.terminal.addSchema(T);
      }
    } else {
      throw new Error(`Duplicate Type registered: ${T.typeName}`);
    }
  }

  type(T) {
    return this.types[T];
  }

  addStore(store: Storage) {
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
      store.addSchema(this.types[typeName]);
    }
  }

  find(t, id): Model {
    const Type = typeof t === 'string' ? this.types[t] : t;
    return new Type({ [Type.schema.idAttribute]: id }, this);
  }

  forge(t, val) {
    const Type = typeof t === 'string' ? this.types[t] : t;
    return new Type(val, this);
  }

  teardown() {
    this.teardownSubject.next('done');
  }

  get(value: Interfaces.ModelReference, opts = ['attributes']) {
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

  // bulkGet(type, id) {
  //   return this.terminal.bulkRead(type, id);
  // }

  save(value: Interfaces.DirtyModel) {
    if (this.terminal) {
      return Bluebird.resolve()
      .then(() => {
        if (Object.keys(value.attributes).length > 0) {
          return this.terminal.writeAttributes({
            attributes: value.attributes,
            id: value.id,
            typeName: value.typeName,
          });
        } else {
          return {
            id: value.id,
            typeName: value.typeName,
          };
        }
      })
      .then((updated) => {
        if (value.relationships && Object.keys(value.relationships).length > 0) {
          return Bluebird.all(Object.keys(value.relationships).map((relName) => {
            return Bluebird.all(value.relationships[relName].map((delta) => {
              if (delta.op === 'add') {
                return this.terminal.writeRelationshipItem(updated, relName, delta.data);
              } else if (delta.op === 'remove') {
                return this.terminal.deleteRelationshipItem(updated, relName, delta.data);
              } else if (delta.op === 'modify') {
                return this.terminal.writeRelationshipItem(updated, relName, delta.data);
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

  delete(item: Interfaces.ModelReference) {
    if (this.terminal) {
      return this.terminal.delete(item).then(() => {
        return Bluebird.all(this.storage.map((store) => {
          return store.delete(item);
        }));
      });
    } else {
      return Promise.reject(new Error('Plump has no terminal store'));
    }
  }

  add(item: Interfaces.ModelReference, relName: string, child: Interfaces.RelationshipItem) {
    if (this.terminal) {
      return this.terminal.writeRelationshipItem(item, relName, child);
    } else {
      return Promise.reject(new Error('Plump has no terminal store'));
    }
  }

  // restRequest(opts) {
  //   if (this.terminal && this.terminal.rest) {
  //     return this.terminal.rest(opts);
  //   } else {
  //     return Promise.reject(new Error('No Rest terminal store'));
  //   }
  // }

  modifyRelationship(item: Interfaces.ModelReference, relName: string, child: Interfaces.RelationshipItem) {
    return this.add(item, relName, child);
  }

  deleteRelationshipItem(item: Interfaces.ModelReference, relName: string, child: Interfaces.RelationshipItem) {
    if (this.terminal) {
      return this.terminal.deleteRelationshipItem(item, relName, child);
    } else {
      return Promise.reject(new Error('Plump has no terminal store'));
    }
  }

  invalidate(item: Interfaces.ModelReference, field?: string | string[]) {
    const fields = Array.isArray(field) ? field : [field];
    this.terminal.fireWriteUpdate({ typeName: item.typeName, id: item.id , invalidate: fields });
  }
}
