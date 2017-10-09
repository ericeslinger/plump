import { Subject, Observable } from 'rxjs';

import { Model } from './model';
import {
  ModelAttributes,
  // IndefiniteModelData,
  ModelData,
  // ModelDelta,
  // ModelSchema,
  ModelReference,
  DirtyModel,
  RelationshipItem,
  CacheStore,
  TerminalStore,
} from './dataTypes';

export const types: { [type: string]: typeof Model } = {};

export interface TypeMap {
  [type: string]: any;
}

export function pathExists(obj: any, path: string) {
  return (
    path.split('.').reduce<boolean>((acc, next) => {
      if (acc === false) {
        return false;
      } else {
        if (!!acc[next]) {
          return acc[next];
        } else {
          return false;
        }
      }
    }, obj) !== false
  );
}

export class Plump<TermType extends TerminalStore = TerminalStore> {
  public destroy$: Observable<string>;
  public caches: CacheStore[];
  public types: TypeMap = {};

  public teardownSubject: Subject<string>;

  constructor(public terminal: TermType) {
    this.teardownSubject = new Subject();
    this.terminal.terminal = true;
    this.caches = [];
    this.destroy$ = this.teardownSubject.asObservable();
  }

  addType(T: any): Promise<void> {
    // addType(T: typeof Model): Promise<void> {
    if (this.types[T.type] === undefined) {
      this.types[T.type] = T;
      return Promise.all(this.caches.map(s => s.addSchema(T))).then(() => {
        if (this.terminal) {
          this.terminal.addSchema(T);
        }
      });
    } else {
      return Promise.reject(`Duplicate Type registered: ${T.type}`);
    }
  }

  type(T: string): typeof Model {
    return this.types[T];
  }

  getTypes(): typeof Model[] {
    return Object.keys(this.types).map(t => this.type(t));
  }

  addCache(store: CacheStore): Promise<void> {
    this.caches.push(store);
    if (this.terminal !== undefined) {
      Plump.wire(store, this.terminal, this.destroy$);
    }
    return store.addSchemas(Object.keys(this.types).map(k => this.types[k]));
  }

  // find<X extends TypeMap, K extends keyof typeof X>(
  //   ref: ModelReference,
  // ): typeof types[K]['prototype'] {
  //   const Type = this.types[ref.type];
  //   return new Type({ [Type.schema.idAttribute]: ref.id }, this);
  // }

  find<T extends ModelData>(ref: ModelReference): Model<T> {
    const Type = this.types[ref.type];
    return new Type(
      { attributes: { [Type.schema.idAttribute]: ref.id } },
      this,
    );
  }

  forge<
    A extends ModelAttributes,
    T extends Model<ModelData & { attributes?: A }>
  >(t: string, val: Partial<A>): T {
    const Type = this.types[t];
    return new Type(val, this) as T;
  }

  teardown(): void {
    this.teardownSubject.next('done');
  }

  get(
    value: ModelReference,
    opts: string[] = ['attributes'],
  ): Promise<ModelData> {
    const keys = opts && !Array.isArray(opts) ? [opts] : opts;
    if (keys.indexOf('relationships') >= 0) {
      keys.splice(keys.indexOf('relationships'), 1);
      keys.unshift(
        ...Object.keys(this.types[value.type].schema.relationships).map(
          v => `relationships.${v}`,
        ),
      );
    }
    return this.caches
      .reduce((thenable, storage) => {
        return thenable.then(v => {
          if (v !== null) {
            return v;
          } else if (storage.hot(value)) {
            return storage.read(value, keys);
          } else {
            return null;
          }
        });
      }, Promise.resolve(null))
      .then(v => {
        if (
          this.terminal &&
          (v === null || !opts.every(path => pathExists(v, path)))
        ) {
          return this.terminal.read(value, keys);
        } else {
          return v;
        }
      });
  }

  bulkGet(value: ModelReference): Promise<ModelData> {
    return this.terminal.bulkRead(value);
  }

  forceCreate(value: DirtyModel) {
    return this.save(value, { stripId: false });
  }

  save(
    value: DirtyModel,
    options: { stripId: boolean } = { stripId: true },
  ): Promise<ModelData> {
    if (this.terminal) {
      return Promise.resolve()
        .then(() => {
          const attrs = Object.assign({}, value.attributes);
          if (options.stripId) {
            const idAttribute = (this.types[value.type] as typeof Model).schema
              .idAttribute;
            if (attrs[idAttribute]) {
              delete attrs[idAttribute];
            }
          }
          if (Object.keys(attrs).length > 0) {
            return this.terminal.writeAttributes({
              attributes: value.attributes,
              id: value.id,
              type: value.type,
            });
          } else {
            return {
              id: value.id,
              type: value.type,
            };
          }
        })
        .then(updated => {
          if (
            value.relationships &&
            Object.keys(value.relationships).length > 0
          ) {
            return Promise.all(
              Object.keys(value.relationships).map(relName => {
                return value.relationships[
                  relName
                ].reduce((thenable: Promise<void | ModelData>, delta) => {
                  return thenable.then(() => {
                    if (delta.op === 'add') {
                      return this.terminal.writeRelationshipItem(
                        updated,
                        relName,
                        delta.data,
                      );
                    } else if (delta.op === 'remove') {
                      return this.terminal.deleteRelationshipItem(
                        updated,
                        relName,
                        delta.data,
                      );
                    } else if (delta.op === 'modify') {
                      return this.terminal.writeRelationshipItem(
                        updated,
                        relName,
                        delta.data,
                      );
                    } else {
                      throw new Error(
                        `Unknown relationship delta ${JSON.stringify(delta)}`,
                      );
                    }
                  });
                }, Promise.resolve());
              }),
            ).then(() => updated);
          } else {
            return updated;
          }
        });
    } else {
      return Promise.reject(new Error('Plump has no terminal store'));
    }
  }

  delete(item: ModelReference): Promise<void> {
    if (this.terminal) {
      return this.terminal
        .delete(item)
        .then(() => {
          return Promise.all(
            this.caches.map(store => {
              return store.wipe(item);
            }),
          );
        })
        .then(() => {
          /* noop */
        });
    } else {
      return Promise.reject(new Error('Plump has no terminal store'));
    }
  }

  add(item: ModelReference, relName: string, child: RelationshipItem) {
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

  modifyRelationship(
    item: ModelReference,
    relName: string,
    child: RelationshipItem,
  ) {
    return this.add(item, relName, child);
  }

  query(type: string, q?: any): Promise<ModelReference[]> {
    return this.terminal.query(type, q);
  }

  deleteRelationshipItem(
    item: ModelReference,
    relName: string,
    child: RelationshipItem,
  ) {
    if (this.terminal) {
      return this.terminal.deleteRelationshipItem(item, relName, child);
    } else {
      return Promise.reject(new Error('Plump has no terminal store'));
    }
  }

  invalidate(item: ModelReference, field?: string | string[]): void {
    const fields = Array.isArray(field) ? field : [field];
    this.terminal.fireWriteUpdate({
      type: item.type,
      id: item.id,
      invalidate: fields,
    });
  }

  static wire(
    me: CacheStore,
    they: TerminalStore,
    shutdownSignal: Observable<string>,
  ) {
    if (me.terminal) {
      throw new Error('Cannot wire a terminal store into another store');
    } else {
      // TODO: figure out where the type data comes from.
      they.read$.takeUntil(shutdownSignal).subscribe(v => {
        me.cache(v);
      });
      they.write$.takeUntil(shutdownSignal).subscribe(v => {
        v.invalidate.forEach(invalid => {
          me.wipe(v, invalid);
        });
      });
    }
  }
}
