import * as mergeOptions from 'merge-options';
import { Observable, Subscription, Observer } from 'rxjs';

import {
  ModelData,
  ModelDelta,
  ModelSchema,
  DirtyValues,
  DirtyModel,
  RelationshipDelta,
  RelationshipItem,
  CacheStore,
  TerminalStore,
} from './dataTypes';

import { Plump } from './plump';
import { PlumpObservable } from './plumpObservable';
import { PlumpError } from './errors';

// TODO: figure out where error events originate (storage or model)
// and who keeps a roll-backable delta

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

  private dirty: DirtyValues;

  get type() {
    return this.constructor['type'];
  }

  get schema() {
    return this.constructor['schema'];
  }

  dirtyFields() {
    return Object.keys(this.dirty.attributes)
      .filter(k => k !== this.schema.idAttribute)
      .concat(Object.keys(this.dirty.relationships));
  }

  constructor(opts, private plump: Plump) {
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
      this.id = opts[this.schema.idAttribute];
    }
    this.dirty = mergeOptions(this.dirty, { attributes: opts });
  }

  $$resetDirty(): void {
    this.dirty = {
      attributes: {}, // Simple key-value
      relationships: {}, // relName: Delta[]
    };
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

  set(update) {
    const flat = update.attributes || update;
    // Filter out non-attribute keys
    const sanitized = Object.keys(flat)
      .filter(k => k in this.schema.attributes)
      .map(k => {
        return { [k]: flat[k] };
      })
      .reduce((acc, curr) => mergeOptions(acc, curr), {});

    this.$$copyValuesFrom(sanitized);
    // this.$$fireUpdate(sanitized);
    return this;
  }

  asObservable(
    opts: string | string[] = ['relationships', 'attributes'],
  ): PlumpObservable<MD> {
    let fields = Array.isArray(opts) ? opts.concat() : [opts];
    if (fields.indexOf('relationships') >= 0) {
      fields = fields.concat(
        Object.keys(this.schema.relationships).map(k => `relationships.${k}`),
      );
    }

    const hots = this.plump.caches.filter(s => s.hot(this));
    const colds = this.plump.caches.filter(s => !s.hot(this));
    const terminal = this.plump.terminal;

    const preload$ = Observable.from(hots)
      .flatMap((s: CacheStore) => Observable.fromPromise(s.read(this, fields)))
      .defaultIfEmpty(null)
      .flatMap(v => {
        if (v !== null) {
          return Observable.of(v);
        } else {
          const terminal$ = Observable.fromPromise(terminal.read(this, fields));
          const cold$ = Observable.from(colds).flatMap((s: CacheStore) =>
            Observable.fromPromise(s.read(this, fields)),
          );
          // .startWith(undefined);
          return Observable.merge(terminal$, cold$.takeUntil(terminal$));
        }
      });
    // TODO: cacheable reads
    // const watchRead$ = Observable.from(terminal)
    // .flatMap(s => s.read$.filter(v => v.type === this.type && v.id === this.id));
    const watchWrite$: Observable<ModelData> = terminal.write$
      .filter((v: ModelDelta) => {
        return (
          v.type === this.type &&
          v.id === this.id &&
          v.invalidate.some(i => fields.indexOf(i) >= 0)
        );
      })
      .flatMapTo(
        Observable.of(terminal).flatMap((s: TerminalStore) =>
          Observable.fromPromise(s.read(this, fields)),
        ),
      );
    // );
    return Observable.merge(preload$, watchWrite$).let(obs => {
      return new PlumpObservable(this.plump, obs);
    }) as PlumpObservable<MD>;
  }

  subscribe(cb: Observer<MD>): Subscription;
  subscribe(fields: string | string[], cb: Observer<MD>): Subscription;
  subscribe(
    arg1: Observer<MD> | string | string[],
    arg2?: Observer<MD>,
  ): Subscription {
    let fields: string[] = [];
    let cb: Observer<MD> = null;

    if (arg2) {
      cb = arg2;
      if (Array.isArray(arg1)) {
        fields = arg1 as string[];
      } else {
        fields = [arg1 as string];
      }
    } else {
      cb = arg1 as Observer<MD>;
      fields = ['attributes'];
    }
    return this.asObservable(fields).subscribe(cb);
  }

  delete() {
    return this.plump.delete(this);
  }

  // $rest(opts) {
  //   const restOpts = Object.assign(
  //     {},
  //     opts,
  //     {
  //       url: `/${this.constructor['type']}/${this.id}/${opts.url}`,
  //     }
  //   );
  //   return this.plump.restRequest(restOpts).then(res => res.data);
  // }

  add(key: string, item: RelationshipItem): this {
    if (key in this.schema.relationships) {
      if (item.id >= 1) {
        if (this.dirty.relationships[key] === undefined) {
          this.dirty.relationships[key] = [];
        }

        this.dirty.relationships[key].push({
          op: 'add',
          data: item,
        });
        // this.$$fireUpdate();
        return this;
      } else {
        throw new Error('Invalid item added to hasMany');
      }
    } else {
      throw new Error('Cannot $add except to hasMany field');
    }
  }

  modifyRelationship(key: string, item: RelationshipItem): this {
    if (key in this.schema.relationships) {
      if (item.id >= 1) {
        this.dirty.relationships[key] = this.dirty.relationships[key] || [];
        this.dirty.relationships[key].push({
          op: 'modify',
          data: item,
        });
        // this.$$fireUpdate();
        return this;
      } else {
        throw new Error('Invalid item added to hasMany');
      }
    } else {
      throw new Error('Cannot $add except to hasMany field');
    }
  }

  remove(key: string, item: RelationshipItem): this {
    if (key in this.schema.relationships) {
      if (item.id >= 1) {
        if (!(key in this.dirty.relationships)) {
          this.dirty.relationships[key] = [];
        }
        this.dirty.relationships[key].push({
          op: 'remove',
          data: item,
        });
        // this.$$fireUpdate();
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

  static resolveRelationships(deltas, base = {}) {
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
    base: RelationshipItem[] = [],
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
