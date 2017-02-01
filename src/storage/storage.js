/* eslint no-unused-vars: 0 */

import * as Bluebird from 'bluebird';
import { Subject } from 'rxjs/Rx';
import { $self, $all } from '../model';

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
    this[$emitter] = new Subject();
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
    return Bluebird.reject(new Error('Write not implemented'));
  }

  // TODO: write the two-way has/get logic into this method
  // and provide override hooks for readOne readMany

  read(type, id, key) {
    let keys = [$self];
    if (Array.isArray(key)) {
      keys = key;
    } else if (key) {
      keys = [key];
    }
    if (keys.indexOf($all) >= 0) {
      keys = Object.keys(type.$fields)
      .filter((k) => type.$fields[k].type === 'hasMany');
      keys.push($self);
    }
    // if (keys.indexOf($self) < 0) {
    //   keys.push($self);
    // }
    return Bluebird.resolve()
    .then(() => {
      return Bluebird.all(keys.map((k) => {
        if ((k !== $self) && (type.$fields[k].type === 'hasMany')) {
          return this.readMany(type, id, k);
        } else {
          return this.readOne(type, id);
        }
      })).then((valArray) => {
        const selfIdx = keys.indexOf($self);
        const retVal = {};
        if (selfIdx >= 0) {
          if (valArray[selfIdx] === null) {
            return null;
          } else {
            Object.assign(retVal, valArray[selfIdx]);
          }
        }
        valArray.forEach((val, idx) => {
          if (idx !== selfIdx) {
            Object.assign(retVal, val);
          }
        });
        return retVal;
      });
    }).then((result) => {
      if (result) {
        return this.notifyUpdate(type, id, result, keys)
        .then(() => result);
      } else {
        return result;
      }
    });
  }

  // wipe should quietly erase a value from the store. This is used during
  // cache invalidation events when the current value is known to be incorrect.
  // it is not a delete (which is a user-initiated, event-causing thing), but
  // should result in this value not stored in storage anymore.

  wipe(type, id, field) {
    return Bluebird.reject(new Error('Wipe not implemented'));
  }

  readOne(type, id) {
    return Bluebird.reject(new Error('ReadOne not implemented'));
  }

  readMany(type, id, key) {
    return Bluebird.reject(new Error('ReadMany not implemented'));
  }

  delete(type, id) {
    return Bluebird.reject(new Error('Delete not implemented'));
  }

  add(type, id, relationship, childId, valence = {}) {
    // add to a hasMany relationship
    // note that hasMany fields can have (impl-specific) valence data
    // example: membership between profile and community can have perm 1, 2, 3
    return Bluebird.reject(new Error('Add not implemented'));
  }

  remove(type, id, relationship, childId) {
    // remove from a hasMany relationship
    return Bluebird.reject(new Error('remove not implemented'));
  }

  modifyRelationship(type, id, relationship, childId, valence = {}) {
    // should modify an existing hasMany valence data. Throw if not existing.
    return Bluebird.reject(new Error('modifyRelationship not implemented'));
  }

  query(q) {
    // q: {type: string, query: any}
    // q.query is impl defined - a string for sql (raw sql)
    return Bluebird.reject(new Error('Query not implemented'));
  }

  onUpdate(observer) {
    // observer follows the RxJS pattern - it is either a function (for next())
    // or {next, error, complete};
    // returns an unsub hook (retVal.unsubscribe())
    return this[$emitter].subscribe(observer);
  }

  notifyUpdate(type, id, value, opts = [$self]) {
    let keys = opts;
    if (!Array.isArray(keys)) {
      keys = [keys];
    }
    return Bluebird.all(keys.map((field) => {
      return Bluebird.resolve()
      .then(() => {
        if (this.terminal) {
          if (field !== $self) {
            if (value !== null) {
              return this[$emitter].next({
                type, id, field, value: value[field],
              });
            } else {
              return this.readMany(type, id, field)
              .then((list) => {
                return this[$emitter].next({
                  type, id, field, value: list[field],
                });
              });
            }
          } else {
            return this[$emitter].next({
              type, id, value,
            });
          }
        } else {
          return null;
        }
      });
    }));
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
