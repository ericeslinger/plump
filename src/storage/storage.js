/* eslint no-unused-vars: 0 */

import Bluebird from 'bluebird';
import mergeOptions from 'merge-options';
import { validateInput } from '../util';
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

  // Abstract - all stores must provide below:

  writeAttributes(value) {
    // if value.id exists, this is an update. If it doesn't, it is an
    // insert. In the case of an update, it should merge down the tree.
    return Bluebird.reject(new Error('writeAttributes not implemented'));
  }

  readAttributes(value) {
    return Bluebird.reject(new Error('readAttributes not implemented'));
  }

  cacheAttributes(value) {
    return Bluebird.reject(new Error('cacheAttributes not implemented'));
  }

  readRelationship(value, key) {
    return Bluebird.reject(new Error('readRelationship not implemented'));
  }

  // wipe should quietly erase a value from the store. This is used during
  // cache invalidation events when the current value is known to be incorrect.
  // it is not a delete (which is a user-initiated, event-causing thing), but
  // should result in this value not stored in storage anymore.

  wipe(type, id, field) {
    return Bluebird.reject(new Error('Wipe not implemented'));
  }

  delete(value) {
    return Bluebird.reject(new Error('Delete not implemented'));
  }

  writeRelationshipItem(value, relationshipTitle, child) {
    // add to a hasMany relationship
    // note that hasMany fields can have (impl-specific) valence data (now renamed extras)
    // example: membership between profile and community can have perm 1, 2, 3
    return Bluebird.reject(new Error('write relationship item not implemented'));
  }

  removeRelationshipItem(value, relationshipTitle, child) {
    // remove from a hasMany relationship
    return Bluebird.reject(new Error('remove not implemented'));
  }

  query(q) {
    // q: {type: string, query: any}
    // q.query is impl defined - a string for sql (raw sql)
    return Bluebird.reject(new Error('Query not implemented'));
  }

  // convenience function used internally
  // read a bunch of relationships and merge them together.
  readRelationships(item, relationships) {
    return Bluebird.all(relationships.map(r => this.readRelationship(item, r)))
    .then(
      rA => rA.reduce((a, r) => mergeOptions(a, r || {}), { type: item.type, id: item.id, attributes: {}, relationships: {} })
    );
  }

  // read a value from the store.
  // opts is an array of attributes to read - syntax is:
  // 'attributes' (to read the attributes, at least, and is the default)
  // 'relationships' to read all relationships
  // 'relationships.relationshipname' to read a certain relationship only

  read(item, opts = ['attributes']) {
    const type = this.getType(item.type);
    const keys = opts && !Array.isArray(opts) ? [opts] : opts;

    return this.readAttributes(item)
    .then(attributes => {
      if (!attributes) {
        return null;
      } else {
        if (attributes.id && attributes.attributes && !attributes.attributes[type.$id]) {
          attributes.attributes[type.$id] = attributes.id;
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

  bulkRead(type, id) {
    // override this if you want to do any special pre-processing
    // for reading from the store prior to a REST service event
    return this.read(type, id).then(data => {
      return { data, included: [] };
    });
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
      return this[$types][t];
    } else {
      return t;
    }
  }

  addType(t) {
    this[$types][t.type] = t;
  }

  addTypes(a) {
    a.forEach(t => this.addType(t));
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
