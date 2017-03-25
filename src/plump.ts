import { Subject, Observable } from 'rxjs/Rx';
import * as Bluebird from 'bluebird';

import { Storage } from './storage/storage';
import { Model } from './model';
import {
  IndefiniteModelData,
  ModelData,
  ModelDelta,
  ModelSchema,
  ModelReference,
  DirtyModel,
  RelationshipItem,
} from './dataTypes';

export class Plump {

  destroy$: Observable<string>;

  private teardownSubject: Subject<string>;
  private storage: Storage[];
  private types: { [type: string]: typeof Model };
  private terminal: Storage;

  constructor() {
    this.teardownSubject = new Subject();
    this.storage = [];
    this.types = {};
    this.destroy$ = this.teardownSubject.asObservable();
  }

  addType(T: typeof Model): Bluebird<void> {
    if (this.types[T.typeName] === undefined) {
      this.types[T.typeName] = T;
      return Bluebird.all(
        this.storage.map(s => s.addSchema(T))
      ).then(() => {
        if (this.terminal) {
          this.terminal.addSchema(T);
        }
      });
    } else {
      return Bluebird.reject(`Duplicate Type registered: ${T.typeName}`);
    }
  }

  type(T: string): typeof Model {
    return this.types[T];
  }

  addStore(store: Storage): Bluebird<void> {
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
    return store.addSchemas(
      Object.keys(this.types).map(k => this.types[k])
    );
  }

  find(t, id): Model {
    const Type = typeof t === 'string' ? this.types[t] : t;
    return new Type({ [Type.schema.idAttribute]: id }, this);
  }

  forge(t, val): Model {
    const Type = typeof t === 'string' ? this.types[t] : t;
    return new Type(val, this);
  }

  teardown(): void {
    this.teardownSubject.next('done');
  }

  get(value: ModelReference, opts: string[] = ['attributes']): Bluebird<ModelData> {
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
    }, Bluebird.resolve(null))
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

  save(value: DirtyModel): Bluebird<ModelData> {
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
      return Bluebird.reject(new Error('Plump has no terminal store'));
    }
  }

  delete(item: ModelReference): Bluebird<void[]> {
    if (this.terminal) {
      return this.terminal.delete(item).then(() => {
        return Bluebird.all(this.storage.map((store) => {
          return store.delete(item);
        }));
      });
    } else {
      return Bluebird.reject(new Error('Plump has no terminal store'));
    }
  }

  add(item: ModelReference, relName: string, child: RelationshipItem) {
    if (this.terminal) {
      return this.terminal.writeRelationshipItem(item, relName, child);
    } else {
      return Bluebird.reject(new Error('Plump has no terminal store'));
    }
  }

  // restRequest(opts) {
  //   if (this.terminal && this.terminal.rest) {
  //     return this.terminal.rest(opts);
  //   } else {
  //     return Bluebird.reject(new Error('No Rest terminal store'));
  //   }
  // }

  modifyRelationship(item: ModelReference, relName: string, child: RelationshipItem) {
    return this.add(item, relName, child);
  }

  deleteRelationshipItem(item: ModelReference, relName: string, child: RelationshipItem) {
    if (this.terminal) {
      return this.terminal.deleteRelationshipItem(item, relName, child);
    } else {
      return Bluebird.reject(new Error('Plump has no terminal store'));
    }
  }

  invalidate(item: ModelReference, field?: string | string[]): void {
    const fields = Array.isArray(field) ? field : [field];
    this.terminal.fireWriteUpdate({ typeName: item.typeName, id: item.id , invalidate: fields });
  }
}
