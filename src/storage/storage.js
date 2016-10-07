/* eslint no-unused-vars: 0 */

import * as Promise from 'bluebird';
import Rx from 'rxjs-es/Rx';

const $emitter = Symbol('$emitter');

// type: an object that defines the type. typically this will be
// part of the Model class hierarchy, but Storage objects call no methods
// on the type object. We only are interested in Type.$name, Type.$id and Type.$fields.
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
    this[$emitter] = new Rx.Subject();
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

  write(type, value) {
    // if value.id exists, this is an update. If it doesn't, it is an
    // insert. In the case of an update, it should merge down the tree.
    return Promise.reject(new Error('Write not implemented'));
  }

  onCacheableRead(type, value) {
    // override this if you want to not react to cacheableRead events.
    return this.write(type, value);
  }

  read(type, id) {
    return Promise.reject(new Error('Read not implemented'));
  }

  delete(type, id) {
    return Promise.reject(new Error('Delete not implemented'));
  }

  add(type, id, relationship, childId, valence = {}) {
    // add to a hasMany relationship
    // note that hasMany fields can have (impl-specific) valence data
    // example: membership between profile and community can have perm 1, 2, 3
    return Promise.reject(new Error('Add not implemented'));
  }

  remove(type, id, relationship, childId) {
    // remove from a hasMany relationship
    return Promise.reject(new Error('remove not implemented'));
  }

  has(type, id, relationship) {
    // load a hasMany relationship
    return Promise.reject(new Error('has not implemented'));
  }

  query(q) {
    // q: {type: string, query: any}
    // q.query is impl defined - a string for sql (raw sql)
    return Promise.reject(new Error('Query not implemented'));
  }

  onUpdate(observer) {
    // observer follows the RxJS pattern - it is either a function (for next())
    // or {next, error, complete};
    // returns an unsub hook (retVal.unsubscribe())
    return this[$emitter].subscribe(observer);
  }

  update(type, id, value) {
    this[$emitter]({
      type, id, value,
    });
  }

  $$testIndex(...args) {
    if (args.length === 1) {
      if (args[0].$id === undefined) {
        throw new Error('Illegal operation on an unsaved new model');
      }
    } else {
      if (args[1][args[0].$id] === undefined) {
        throw new Error('Illegal operation on an unsaved new model');
      }
    }
  }
}
