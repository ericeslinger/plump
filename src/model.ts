import * as mergeOptions from 'merge-options';
import * as deepEqual from 'deep-equal';
import { Observable, Subscription, Observer, Subject } from 'rxjs';

import {
  ModelData,
  ModelDelta,
  ModelSchema,
  DirtyValues,
  DirtyModel,
  UntypedRelationshipItem,
  TypedRelationshipItem,
  RelationshipDelta,
  CacheStore,
  StringIndexed,
  TerminalStore,
} from './dataTypes';

import { Plump, pathExists } from './plump';
import { PlumpError, NotFoundError } from './errors';

// TODO: figure out where error events originate (storage or model)
// and who keeps a roll-backable delta

function condMerge(arg: any[]) {
  return mergeOptions(...arg.filter(v => !!v));
}

export class Model<MD extends ModelData> {
  id: string | number;
  static type = 'BASE';
  static schema: ModelSchema = {
    idAttribute: 'id',
    name: 'BASE',
    attributes: {},
    relationships: {},
  };

  public error: PlumpError;

  public _write$: Subject<MD> = new Subject<MD>();
  public dirty: DirtyValues;

  get type() {
    return this.constructor['type'];
  }

  get schema() {
    return this.constructor['schema'];
  }

  static empty(id: number | string) {
    const retVal = {
      id: id,
      type: this.type,
      attributes: {},
      relationships: {},
    };
    Object.keys(this.schema.attributes).forEach(key => {
      if (this.schema.attributes[key].type === 'number') {
        retVal.attributes[key] = this.schema.attributes[key].default || 0;
      } else if (this.schema.attributes[key].type === 'date') {
        retVal.attributes[key] = new Date(
          (this.schema.attributes[key].default as any) || Date.now(),
        );
      } else if (this.schema.attributes[key].type === 'string') {
        retVal.attributes[key] = this.schema.attributes[key].default || '';
      } else if (this.schema.attributes[key].type === 'object') {
        retVal.attributes[key] = Object.assign(
          {},
          this.schema.attributes[key].default,
        );
      } else if (this.schema.attributes[key].type === 'array') {
        retVal.attributes[key] = ((this.schema.attributes[key]
          .default as any[]) || []
        ).concat();
      }
    });
    Object.keys(this.schema.relationships).forEach(key => {
      retVal.relationships[key] = [];
    });
    return retVal;
  }

  empty(id: number | string): MD {
    return this.constructor['empty'](id);
  }

  dirtyFields() {
    return Object.keys(this.dirty.attributes)
      .filter(k => k !== this.schema.idAttribute)
      .concat(Object.keys(this.dirty.relationships));
  }

  constructor(opts, public plump: Plump) {
    // TODO: Define Delta interface
    this.error = null;
    if (this.type === 'BASE') {
      throw new TypeError(
        'Cannot instantiate base plump Models, please subclass with a schema and valid type',
      );
    }

    this.dirty = {
      attributes: {}, // Simple key-value
      relationships: {}, // relName: Delta[]
    };
    this.$$copyValuesFrom(opts);
    // this.$$fireUpdate(opts);
  }

  $$copyValuesFrom(opts = {}): void {
    // const idField = this.constructor.$id in opts ? this.constructor.$id : 'id';
    // this[this.constructor.$id] = opts[idField] || this.id;
    if (this.id === undefined && opts[this.schema.idAttribute]) {
      if (this.schema.attributes[this.schema.idAttribute].type === 'number') {
        this.id = parseInt(opts[this.schema.idAttribute], 10);
      } else {
        this.id = opts[this.schema.idAttribute];
      }
    }
    this.dirty = mergeOptions(this.dirty, { attributes: opts });
  }

  $$resetDirty(): void {
    this.dirty = {
      attributes: {}, // Simple key-value
      relationships: {}, // relName: Delta[]
    };
    this.$$fireUpdate();
  }

  $$fireUpdate(force: boolean = false) {
    if (!this.id || force) {
      this._write$.next({
        attributes: this.dirty.attributes,
        type: this.type,
      } as MD);
    }
  }

  get<T extends ModelData>(opts: string | string[] = 'attributes'): Promise<T> {
    // If opts is falsy (i.e., undefined), get attributes
    // Otherwise, get what was requested,
    // wrapping the request in a Array if it wasn't already one
    const keys = opts && !Array.isArray(opts) ? [opts] : opts as string[];
    return this.plump
      .get(this, keys)
      .catch((e: PlumpError) => {
        this.error = e;
        return null;
      })
      .then<T>(self => {
        if (!self && this.dirtyFields().length === 0) {
          if (this.id) {
            this.error = new NotFoundError();
          }
          return null;
        } else if (this.dirtyFields().length === 0) {
          return self;
        } else {
          const resolved = Model.resolveAndOverlay(
            this.dirty,
            self || undefined,
          );
          return mergeOptions(
            {},
            self || { id: this.id, type: this.type },
            resolved,
          );
        }
      });
  }

  bulkGet<T extends ModelData>(): Promise<T> {
    return this.plump.bulkGet(this) as Promise<T>;
  }

  // TODO: Should $save ultimately return this.get()?
  save<T extends ModelData>(): Promise<T> {
    const update: DirtyModel = mergeOptions(
      { id: this.id, type: this.type },
      this.dirty,
    );
    return this.plump
      .save(update)
      .then<T>(updated => {
        this.$$resetDirty();
        if (updated.id) {
          this.id = updated.id;
        }
        return this.get();
      })
      .catch(err => {
        throw err;
      });
  }

  set(update): this {
    const flat = update.attributes || update;
    // Filter out non-attribute keys
    const sanitized = Object.keys(flat)
      .filter(k => k in this.schema.attributes)
      .map(k => {
        return { [k]: flat[k] };
      })
      .reduce((acc, curr) => mergeOptions(acc, curr), {});

    this.$$copyValuesFrom(sanitized);
    this.$$fireUpdate();
    return this;
  }

  asObservable(
    opts: string | string[] = ['relationships', 'attributes'],
  ): Observable<MD> {
    let fields = Array.isArray(opts) ? opts.concat() : [opts];
    if (fields.indexOf('relationships') >= 0) {
      fields.splice(fields.indexOf('relationships'), 1);
      fields = fields.concat(
        Object.keys(this.schema.relationships).map(k => `relationships.${k}`),
      );
    }

    const hots = this.plump.caches.filter(s => s.hot(this));
    const colds = this.plump.caches.filter(s => !s.hot(this));
    const terminal = this.plump.terminal;

    const preload$: Observable<ModelData> = Observable.from(hots)
      .flatMap((s: CacheStore) => Observable.fromPromise(s.read(this, fields)))
      .defaultIfEmpty(null)
      .flatMap(v => {
        if (v !== null && fields.every(f => pathExists(v, f))) {
          return Observable.of(v);
        } else {
          const terminal$ = Observable.fromPromise(
            terminal.read(this, fields).then(terminalValue => {
              if (terminalValue === null) {
                throw new NotFoundError();
              } else {
                return terminalValue;
              }
            }),
          );
          const cold$ = Observable.from(colds).flatMap((s: CacheStore) =>
            Observable.fromPromise(s.read(this, fields)),
          );
          // .startWith(undefined);
          return Observable.merge(
            terminal$,
            cold$.takeUntil(terminal$),
          ) as Observable<ModelData>;
        }
      });
    const watchWrite$: Observable<ModelData> = terminal.write$
      .filter((v: ModelDelta) => {
        return (
          v.type === this.type && v.id === this.id // && v.invalidate.some(i => fields.indexOf(i) >= 0)
        );
      })
      .flatMapTo(
        Observable.of(terminal).flatMap((s: TerminalStore) =>
          Observable.fromPromise(s.read(this, fields, true)),
        ),
      )
      .startWith(null);
    return Observable.combineLatest(
      Observable.of(this.empty(this.id)),
      preload$,
      watchWrite$,
      this._write$.asObservable().startWith(null) as Observable<ModelData>,
    )
      .map((a: ModelData[]) => condMerge(a))
      .map((v: ModelData) => {
        v.relationships = Model.resolveRelationships(
          this.dirty.relationships,
          v.relationships,
        );
        return v;
      })
      .distinctUntilChanged(deepEqual) as Observable<MD>;
  }

  delete() {
    return this.plump.delete(this);
  }

  add(key: string, item: UntypedRelationshipItem): this {
    const toAdd: TypedRelationshipItem = Object.assign(
      {},
      { type: this.schema.relationships[key].type.sides[key].otherType },
      item,
    );
    if (key in this.schema.relationships) {
      if (item.id >= 1) {
        if (this.dirty.relationships[key] === undefined) {
          this.dirty.relationships[key] = [];
        }

        this.dirty.relationships[key].push({
          op: 'add',
          data: toAdd,
        });
        this.$$fireUpdate(true);
        return this;
      } else {
        throw new Error('Invalid item added to hasMany');
      }
    } else {
      throw new Error('Cannot $add except to hasMany field');
    }
  }

  modifyRelationship(key: string, item: UntypedRelationshipItem): this {
    const toAdd: TypedRelationshipItem = Object.assign(
      {},
      { type: this.schema.relationships[key].type.sides[key].otherType },
      item,
    );
    if (key in this.schema.relationships) {
      if (item.id >= 1) {
        this.dirty.relationships[key] = this.dirty.relationships[key] || [];
        this.dirty.relationships[key].push({
          op: 'modify',
          data: toAdd,
        });
        this.$$fireUpdate(true);
        return this;
      } else {
        throw new Error('Invalid item added to hasMany');
      }
    } else {
      throw new Error('Cannot $add except to hasMany field');
    }
  }

  remove(key: string, item: UntypedRelationshipItem): this {
    const toAdd: TypedRelationshipItem = Object.assign(
      {},
      { type: this.schema.relationships[key].type.sides[key].otherType },
      item,
    );
    if (key in this.schema.relationships) {
      if (item.id >= 1) {
        if (!(key in this.dirty.relationships)) {
          this.dirty.relationships[key] = [];
        }
        this.dirty.relationships[key].push({
          op: 'remove',
          data: toAdd,
        });
        this.$$fireUpdate(true);
        return this;
      } else {
        throw new Error('Invalid item $removed from hasMany');
      }
    } else {
      throw new Error('Cannot $remove except from hasMany field');
    }
  }

  static applyDelta(current, delta) {
    if (delta.op === 'add' || delta.op === 'modify') {
      const retVal = mergeOptions({}, current, delta.data);
      return retVal;
    } else if (delta.op === 'remove') {
      return undefined;
    } else {
      return current;
    }
  }

  static resolveAndOverlay(
    update,
    base: { attributes?: any; relationships?: any } = {
      attributes: {},
      relationships: {},
    },
  ) {
    const attributes = mergeOptions({}, base.attributes, update.attributes);
    const resolvedRelationships = this.resolveRelationships(
      update.relationships,
      base.relationships,
    );
    return { attributes, relationships: resolvedRelationships };
  }

  static resolveRelationships(
    deltas: StringIndexed<RelationshipDelta[]>,
    base: StringIndexed<TypedRelationshipItem[]> = {},
  ) {
    const updates = Object.keys(deltas)
      .map(relName => {
        const resolved = this.resolveRelationship(
          deltas[relName],
          base[relName],
        );
        return { [relName]: resolved };
      })
      .reduce((acc, curr) => mergeOptions(acc, curr), {});
    return mergeOptions({}, base, updates);
  }

  static resolveRelationship(
    deltas: RelationshipDelta[],
    base: TypedRelationshipItem[] = [],
  ) {
    const retVal = base.concat();
    deltas.forEach(delta => {
      if (delta.op === 'add' || delta.op === 'modify') {
        const currentIndex = retVal.findIndex(v => v.id === delta.data.id);
        if (currentIndex >= 0) {
          retVal[currentIndex] = delta.data;
        } else {
          retVal.push(delta.data);
        }
      } else if (delta.op === 'remove') {
        const currentIndex = retVal.findIndex(v => v.id === delta.data.id);
        if (currentIndex >= 0) {
          retVal.splice(currentIndex, 1);
        }
      }
    });
    return retVal;
  }
}
