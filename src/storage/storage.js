/* eslint no-unused-vars: 0 */

import * as Bluebird from 'bluebird';
import mergeOptions from 'merge-options';
import { Subject } from 'rxjs/Rx';

import { $self, $all } from '../model';

const $readSubject = Symbol('$readSubject');
const $writeSubject = Symbol('$writeSubject');
const $types = Symbol('$types');

// type: an object that defines the type. typically this will be
// part of the Model class hierarchy, but Storage objects call no methods
// on the type object. We only are interested in Type.$name, Type.$id and Type.$schema.
// Note that Type.$id is the *name of the id field* on instances
//    and NOT the actual id field (e.g., in most cases, Type.$id === 'id').
// id: unique id. Often an integer, but not necessary (could be an oid)


// hasMany relationships are treated like id arrays. So, add / remove / has
// just stores and removes integers.

export class Storage {

  constructor(opts = {}) {
    // a "terminal" storage facility is the end of the storage chain.
    // usually sql on the server side and rest on the client side, it *must*
    // receive the writes, and is the final authoritative answer on whether
    // something is 404.

    // terminal facilities are also the only ones that can authoritatively answer
    // authorization questions, but the design may allow for authorization to be
    // cached.
    this.terminal = opts.terminal || false;
    this[$readSubject] = new Subject();
    this[$writeSubject] = new Subject();
    this.read$ = this[$readSubject].asObservable();
    this.write$ = this[$writeSubject].asObservable();
    this[$types] = {};
  }

  hot(type, id) {
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
      store.read$.takeUntil(shutdownSignal).subscribe((v) => this.write(v));
      store.write$.takeUntil(shutdownSignal).subscribe((v) => {
        v.invalidate.forEach((invalid) => {
          this.wipe(v.type, v.id, invalid);
        });
      });
    }
  }

  write(value, opts) {
    // if value.id exists, this is an update. If it doesn't, it is an
    // insert. In the case of an update, it should merge down the tree.
    return Bluebird.reject(new Error('Write not implemented'));
  }

  getType(t) {
    if (typeof t === 'string') {
      return this[$types][t];
    } else {
      return t;
    }
  }

  addType(t) {
    this[$types][t.$name] = t;
  }

  addTypes(a) {
    a.forEach(t => this.addType(t));
  }

  // TODO: write the two-way has/get logic into this method
  // and provide override hooks for readAttributes readRelationship

  read(typeName, id, opts) {
    const type = this.getType(typeName);
    const keys = opts && !Array.isArray(opts) ? [opts] : opts;
    return this.readAttributes(type, id)
    .then(attributes => {
      if (attributes) {
        return this.readRelationships(type, id, keys)
        .then(relationships => {
          return mergeOptions({
            type: type.$name,
            id: id,
            attributes: {},
            relationships: {},
          },
            attributes,
            relationships
          );
        });
      } else {
        return null;
      }
    }).then((result) => {
      if (result) {
        this.fireReadUpdate(result);
      }
      return result;
    });
  }

  bulkRead(type, id) {
    // override this if you want to do any special pre-processing
    // for reading from the store prior to a REST service event
    return this.readAttributes(type, id);
  }

  readAttributes(type, id) {
    return Bluebird.reject(new Error('readAttributes not implemented'));
  }

  readRelationship(type, id, key) {
    return Bluebird.reject(new Error('readRelationship not implemented'));
  }

  readRelationships(type, id, key, attributes) {
    const t = this.getType(type);
    // If there is no key, it defaults to all relationships
    // Otherwise, it wraps it in an Array if it isn't already one
    const keys = key && !Array.isArray(key) ? [key] : key || [];
    return keys.filter(k => k in t.$schema.relationships).map(relName => {
      return this.readRelationship(t, id, relName, attributes);
    }).reduce((thenableAcc, thenableCurr) => {
      return Bluebird.all([thenableAcc, thenableCurr])
      .then(([acc, curr]) => {
        return mergeOptions(acc, curr);
      });
    }, Bluebird.resolve({}));
  }

  // wipe should quietly erase a value from the store. This is used during
  // cache invalidation events when the current value is known to be incorrect.
  // it is not a delete (which is a user-initiated, event-causing thing), but
  // should result in this value not stored in storage anymore.

  wipe(type, id, field) {
    return Bluebird.reject(new Error('Wipe not implemented'));
  }

  delete(type, id) {
    return Bluebird.reject(new Error('Delete not implemented'));
  }

  add(type, id, relationshipTitle, childId, extras = {}) {
    // add to a hasMany relationship
    // note that hasMany fields can have (impl-specific) valence data (now renamed extras)
    // example: membership between profile and community can have perm 1, 2, 3
    return Bluebird.reject(new Error('Add not implemented'));
  }

  remove(type, id, relationshipTitle, childId) {
    // remove from a hasMany relationship
    return Bluebird.reject(new Error('remove not implemented'));
  }

  modifyRelationship(type, id, relationshipTitle, childId, extras = {}) {
    // should modify an existing hasMany valence data. Throw if not existing.
    return Bluebird.reject(new Error('modifyRelationship not implemented'));
  }

  query(q) {
    // q: {type: string, query: any}
    // q.query is impl defined - a string for sql (raw sql)
    return Bluebird.reject(new Error('Query not implemented'));
  }

  fireWriteUpdate(val) {
    this[$writeSubject].next(val);
    return Bluebird.resolve(val);
  }

  fireReadUpdate(val) {
    this[$readSubject].next(val);
    return Bluebird.resolve(val);
  }

  notifyUpdate(v) {
    return Bluebird.resolve(v);
  }

  $$testIndex(...args) {
    if (args.length === 1) {
      if (args[0].$id === undefined) {
        throw new Error('Illegal operation on an unsaved new model');
      }
    } else if (args[1][args[0].$id] === undefined) {
      throw new Error('Illegal operation on an unsaved new model');
    }
  }
}


// convenience function that walks an array replacing any {id} with context.id
Storage.massReplace = function massReplace(block, context) {
  return block.map((v) => {
    if (Array.isArray(v)) {
      return massReplace(v, context);
    } else if ((typeof v === 'string') && (v.match(/^\{(.*)\}$/))) {
      return context[v.match(/^\{(.*)\}$/)[1]];
    } else {
      return v;
    }
  });
};
