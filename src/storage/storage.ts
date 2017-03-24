/* eslint no-unused-vars: 0 */

import * as Bluebird from 'bluebird';
import * as mergeOptions from 'merge-options';
import { validateInput } from '../util';
import { Subject, Observable } from 'rxjs/Rx';
import * as Interfaces from '../dataTypes';

// type: an object that defines the type. typically this will be
// part of the Model class hierarchy, but Storage objects call no methods
// on the type object. We only are interested in Type.$name, Type.$id and Type.$schema.
// Note that Type.$id is the *name of the id field* on instances
//    and NOT the actual id field (e.g., in most cases, Type.$id === 'id').
// id: unique id. Often an integer, but not necessary (could be an oid)


// hasMany relationships are treated like id arrays. So, add / remove / has
// just stores and removes integers.

export abstract class Storage {

  terminal: boolean;
  read$: Observable<Interfaces.ModelData>;
  write$: Observable<Interfaces.ModelDelta>;
  private readSubject = new Subject();
  private writeSubject = new Subject();
  protected types: Interfaces.StringIndexed<{$schema: Interfaces.ModelSchema, type: string}> = {};
  // protected types: Model[]; TODO: figure this out

  constructor(opts:any = {}) {
    // a "terminal" storage facility is the end of the storage chain.
    // usually sql on the server side and rest on the client side, it *must*
    // receive the writes, and is the final authoritative answer on whether
    // something is 404.

    // terminal facilities are also the only ones that can authoritatively answer
    // authorization questions, but the design may allow for authorization to be
    // cached.
    this.terminal = opts.terminal || false;
    this.read$ = this.readSubject.asObservable();
    this.write$ = this.writeSubject.asObservable();
  }

  // Abstract - all stores must provide below:

  abstract writeAttributes(value: Interfaces.ModelData): Bluebird<Interfaces.ModelData>;
  abstract readAttributes(value: Interfaces.ModelReference): Bluebird<Interfaces.ModelData>;
  abstract cache(value: Interfaces.ModelData): Bluebird<Interfaces.ModelData>;
  abstract cacheAttributes(value: Interfaces.ModelData): Bluebird<Interfaces.ModelData>;
  abstract cacheRelationship(value: Interfaces.ModelData): Bluebird<Interfaces.ModelData>;
  abstract readRelationship(value: Interfaces.ModelReference, key?: string | string[]): Bluebird<Interfaces.ModelData>;
  abstract wipe(value: Interfaces.ModelReference, key?: string | string[]): void;
  abstract delete(value: Interfaces.ModelReference): void;
  abstract writeRelationshipItem(value: Interfaces.ModelReference, relationshipTitle: string, child: {id: string | number}): Bluebird<Interfaces.ModelData>;
  abstract deleteRelationshipItem(value: Interfaces.ModelReference, relationshipTitle: string, child: {id: string | number}): Bluebird<Interfaces.ModelData>;
  query(q) {
    // q: {type: string, query: any}
    // q.query is impl defined - a string for sql (raw sql)
    return Bluebird.reject(new Error('Query not implemented'));
  }

  // convenience function used internally
  // read a bunch of relationships and merge them together.
  readRelationships(item: Interfaces.ModelReference, relationships: string[]) {
    return Bluebird.all(relationships.map(r => this.readRelationship(item, r)))
    .then(rA =>
      rA.reduce(
        (a, r) => mergeOptions(a, r || {}),
        { type: item.type, id: item.id, attributes: {}, relationships: {} }
      )
    );
  }

  read(item: Interfaces.ModelReference, opts: string | string[] = ['attributes']) {
    const type = this.getType(item.type);
    const keys = (opts && !Array.isArray(opts) ? [opts] : opts) as string[];
    return this.readAttributes(item)
    .then(attributes => {
      if (!attributes) {
        return null;
      } else {
        if (attributes.id && attributes.attributes && !attributes.attributes[type.$id]) {
          attributes.attributes[type.$id] = attributes.id; // eslint-disable-line no-param-reassign
        }
        const relsWanted = (keys.indexOf('relationships') >= 0)
          ? Object.keys(type.$schema.relationships)
          : keys.map(k => k.split('.'))
            .filter(ka => ka[0] === 'relationships')
            .map(ka => ka[1]);
        const relsToFetch = relsWanted.filter(relName => !attributes.relationships[relName]);
        // readAttributes can return relationship data, so don't fetch those
        if (relsToFetch.length > 0) {
          return this.readRelationships(item, relsToFetch)
          .then(rels => {
            return mergeOptions(attributes, rels);
          });
        } else {
          return attributes;
        }
      }
    }).then((result) => {
      if (result) {
        this.fireReadUpdate(result);
      }
      return result;
    });
  }

  bulkRead(item: Interfaces.ModelReference) {
    // override this if you want to do any special pre-processing
    // for reading from the store prior to a REST service event
    return this.read(item).then(data => {
      return { data, included: [] };
    });
  }


  hot(item: Interfaces.ModelReference) : boolean {
    // t: type, id: id (integer).
    // if hot, then consider this value authoritative, no need to go down
    // the datastore chain. Consider a memorystorage used as a top-level cache.
    // if the memstore has the value, it's hot and up-to-date. OTOH, a
    // localstorage cache may be an out-of-date value (updated since last seen)

    // this design lets hot be set by type and id. In particular, the goal for the
    // front-end is to have profile objects be hot-cached in the memstore, but nothing
    // else (in order to not run the browser out of memory)
    return false;
  }

  // hook a non-terminal store into a terminal store.
  wire(store, shutdownSignal) {
    if (this.terminal) {
      throw new Error('Cannot wire a terminal store into another store');
    } else {
      // TODO: figure out where the type data comes from.
      debugger;
      store.read$.takeUntil(shutdownSignal).subscribe((v) => {
        this.cache(v);
      });
      store.write$.takeUntil(shutdownSignal).subscribe((v) => {
        v.invalidate.forEach((invalid) => {
          this.wipe(v, invalid);
        });
      });
    }
  }

  validateInput(value, opts = {}) {
    const type = this.getType(value.type);
    return validateInput(type, value);
  }

  // store type info data on the store itself

  getType(t) {
    if (typeof t === 'string') {
      return this.types[t];
    } else {
      return t;
    }
  }

  addType(t) {
    this.types[t.type] = t;
  }

  addTypes(a) {
    a.forEach(t => this.addType(t));
  }


  fireWriteUpdate(val: Interfaces.ModelData & {invalidate: string[]}) {
    this.writeSubject.next(val);
    return Bluebird.resolve(val);
  }

  fireReadUpdate(val: Interfaces.ModelData) {
    this.readSubject.next(val);
    return Bluebird.resolve(val);
  }
}
