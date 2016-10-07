'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Storage = undefined;

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _Rx = require('rxjs-es/Rx');

var _Rx2 = _interopRequireDefault(_Rx);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/* eslint no-unused-vars: 0 */

const $emitter = Symbol('$emitter');

// type: an object that defines the type. typically this will be
// part of the Model class hierarchy, but Storage objects call no methods
// on the type object. We only are interested in Type.$name, Type.$id and Type.$fields.
// Note that Type.$id is the *name of the id field* on instances
//    and NOT the actual id field (e.g., in most cases, Type.$id === 'id').
// id: unique id. Often an integer, but not necessary (could be an oid)


// hasMany relationships are treated like id arrays. So, add / remove / has
// just stores and removes integers.

class Storage {

  constructor(opts = {}) {
    // a "terminal" storage facility is the end of the storage chain.
    // usually sql on the server side and rest on the client side, it *must*
    // receive the writes, and is the final authoritative answer on whether
    // something is 404.

    // terminal facilities are also the only ones that can authoritatively answer
    // authorization questions, but the design may allow for authorization to be
    // cached.
    this.terminal = opts.terminal || false;
    this[$emitter] = new _Rx2.default.Subject();
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
      type, id, value
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
exports.Storage = Storage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3RvcmFnZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7O0lBQVksTzs7QUFDWjs7Ozs7Ozs7QUFIQTs7QUFLQSxNQUFNLFdBQVcsT0FBTyxVQUFQLENBQWpCOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFTyxNQUFNLE9BQU4sQ0FBYzs7QUFFbkIsY0FBWSxPQUFPLEVBQW5CLEVBQXVCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFNBQUssUUFBTCxHQUFnQixLQUFLLFFBQUwsSUFBaUIsS0FBakM7QUFDQSxTQUFLLFFBQUwsSUFBaUIsSUFBSSxhQUFHLE9BQVAsRUFBakI7QUFDRDs7QUFFRCxNQUFJLElBQUosRUFBVSxFQUFWLEVBQWM7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQU8sS0FBUDtBQUNEOztBQUVELFFBQU0sSUFBTixFQUFZLEtBQVosRUFBbUI7QUFDakI7QUFDQTtBQUNBLFdBQU8sUUFBUSxNQUFSLENBQWUsSUFBSSxLQUFKLENBQVUsdUJBQVYsQ0FBZixDQUFQO0FBQ0Q7O0FBRUQsa0JBQWdCLElBQWhCLEVBQXNCLEtBQXRCLEVBQTZCO0FBQzNCO0FBQ0EsV0FBTyxLQUFLLEtBQUwsQ0FBVyxJQUFYLEVBQWlCLEtBQWpCLENBQVA7QUFDRDs7QUFFRCxPQUFLLElBQUwsRUFBVyxFQUFYLEVBQWU7QUFDYixXQUFPLFFBQVEsTUFBUixDQUFlLElBQUksS0FBSixDQUFVLHNCQUFWLENBQWYsQ0FBUDtBQUNEOztBQUVELFNBQU8sSUFBUCxFQUFhLEVBQWIsRUFBaUI7QUFDZixXQUFPLFFBQVEsTUFBUixDQUFlLElBQUksS0FBSixDQUFVLHdCQUFWLENBQWYsQ0FBUDtBQUNEOztBQUVELE1BQUksSUFBSixFQUFVLEVBQVYsRUFBYyxZQUFkLEVBQTRCLE9BQTVCLEVBQXFDLFVBQVUsRUFBL0MsRUFBbUQ7QUFDakQ7QUFDQTtBQUNBO0FBQ0EsV0FBTyxRQUFRLE1BQVIsQ0FBZSxJQUFJLEtBQUosQ0FBVSxxQkFBVixDQUFmLENBQVA7QUFDRDs7QUFFRCxTQUFPLElBQVAsRUFBYSxFQUFiLEVBQWlCLFlBQWpCLEVBQStCLE9BQS9CLEVBQXdDO0FBQ3RDO0FBQ0EsV0FBTyxRQUFRLE1BQVIsQ0FBZSxJQUFJLEtBQUosQ0FBVSx3QkFBVixDQUFmLENBQVA7QUFDRDs7QUFFRCxNQUFJLElBQUosRUFBVSxFQUFWLEVBQWMsWUFBZCxFQUE0QjtBQUMxQjtBQUNBLFdBQU8sUUFBUSxNQUFSLENBQWUsSUFBSSxLQUFKLENBQVUscUJBQVYsQ0FBZixDQUFQO0FBQ0Q7O0FBRUQsUUFBTSxDQUFOLEVBQVM7QUFDUDtBQUNBO0FBQ0EsV0FBTyxRQUFRLE1BQVIsQ0FBZSxJQUFJLEtBQUosQ0FBVSx1QkFBVixDQUFmLENBQVA7QUFDRDs7QUFFRCxXQUFTLFFBQVQsRUFBbUI7QUFDakI7QUFDQTtBQUNBO0FBQ0EsV0FBTyxLQUFLLFFBQUwsRUFBZSxTQUFmLENBQXlCLFFBQXpCLENBQVA7QUFDRDs7QUFFRCxTQUFPLElBQVAsRUFBYSxFQUFiLEVBQWlCLEtBQWpCLEVBQXdCO0FBQ3RCLFNBQUssUUFBTCxFQUFlO0FBQ2IsVUFEYSxFQUNQLEVBRE8sRUFDSDtBQURHLEtBQWY7QUFHRDs7QUFFRCxjQUFZLEdBQUcsSUFBZixFQUFxQjtBQUNuQixRQUFJLEtBQUssTUFBTCxLQUFnQixDQUFwQixFQUF1QjtBQUNyQixVQUFJLEtBQUssQ0FBTCxFQUFRLEdBQVIsS0FBZ0IsU0FBcEIsRUFBK0I7QUFDN0IsY0FBTSxJQUFJLEtBQUosQ0FBVSwyQ0FBVixDQUFOO0FBQ0Q7QUFDRixLQUpELE1BSU87QUFDTCxVQUFJLEtBQUssQ0FBTCxFQUFRLEtBQUssQ0FBTCxFQUFRLEdBQWhCLE1BQXlCLFNBQTdCLEVBQXdDO0FBQ3RDLGNBQU0sSUFBSSxLQUFKLENBQVUsMkNBQVYsQ0FBTjtBQUNEO0FBQ0Y7QUFDRjtBQTdGa0I7UUFBUixPLEdBQUEsTyIsImZpbGUiOiJzdG9yYWdlL3N0b3JhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQgbm8tdW51c2VkLXZhcnM6IDAgKi9cblxuaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgUnggZnJvbSAncnhqcy1lcy9SeCc7XG5cbmNvbnN0ICRlbWl0dGVyID0gU3ltYm9sKCckZW1pdHRlcicpO1xuXG4vLyB0eXBlOiBhbiBvYmplY3QgdGhhdCBkZWZpbmVzIHRoZSB0eXBlLiB0eXBpY2FsbHkgdGhpcyB3aWxsIGJlXG4vLyBwYXJ0IG9mIHRoZSBNb2RlbCBjbGFzcyBoaWVyYXJjaHksIGJ1dCBTdG9yYWdlIG9iamVjdHMgY2FsbCBubyBtZXRob2RzXG4vLyBvbiB0aGUgdHlwZSBvYmplY3QuIFdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gVHlwZS4kbmFtZSwgVHlwZS4kaWQgYW5kIFR5cGUuJGZpZWxkcy5cbi8vIE5vdGUgdGhhdCBUeXBlLiRpZCBpcyB0aGUgKm5hbWUgb2YgdGhlIGlkIGZpZWxkKiBvbiBpbnN0YW5jZXNcbi8vICAgIGFuZCBOT1QgdGhlIGFjdHVhbCBpZCBmaWVsZCAoZS5nLiwgaW4gbW9zdCBjYXNlcywgVHlwZS4kaWQgPT09ICdpZCcpLlxuLy8gaWQ6IHVuaXF1ZSBpZC4gT2Z0ZW4gYW4gaW50ZWdlciwgYnV0IG5vdCBuZWNlc3NhcnkgKGNvdWxkIGJlIGFuIG9pZClcblxuXG4vLyBoYXNNYW55IHJlbGF0aW9uc2hpcHMgYXJlIHRyZWF0ZWQgbGlrZSBpZCBhcnJheXMuIFNvLCBhZGQgLyByZW1vdmUgLyBoYXNcbi8vIGp1c3Qgc3RvcmVzIGFuZCByZW1vdmVzIGludGVnZXJzLlxuXG5leHBvcnQgY2xhc3MgU3RvcmFnZSB7XG5cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgLy8gYSBcInRlcm1pbmFsXCIgc3RvcmFnZSBmYWNpbGl0eSBpcyB0aGUgZW5kIG9mIHRoZSBzdG9yYWdlIGNoYWluLlxuICAgIC8vIHVzdWFsbHkgc3FsIG9uIHRoZSBzZXJ2ZXIgc2lkZSBhbmQgcmVzdCBvbiB0aGUgY2xpZW50IHNpZGUsIGl0ICptdXN0KlxuICAgIC8vIHJlY2VpdmUgdGhlIHdyaXRlcywgYW5kIGlzIHRoZSBmaW5hbCBhdXRob3JpdGF0aXZlIGFuc3dlciBvbiB3aGV0aGVyXG4gICAgLy8gc29tZXRoaW5nIGlzIDQwNC5cblxuICAgIC8vIHRlcm1pbmFsIGZhY2lsaXRpZXMgYXJlIGFsc28gdGhlIG9ubHkgb25lcyB0aGF0IGNhbiBhdXRob3JpdGF0aXZlbHkgYW5zd2VyXG4gICAgLy8gYXV0aG9yaXphdGlvbiBxdWVzdGlvbnMsIGJ1dCB0aGUgZGVzaWduIG1heSBhbGxvdyBmb3IgYXV0aG9yaXphdGlvbiB0byBiZVxuICAgIC8vIGNhY2hlZC5cbiAgICB0aGlzLnRlcm1pbmFsID0gb3B0cy50ZXJtaW5hbCB8fCBmYWxzZTtcbiAgICB0aGlzWyRlbWl0dGVyXSA9IG5ldyBSeC5TdWJqZWN0KCk7XG4gIH1cblxuICBob3QodHlwZSwgaWQpIHtcbiAgICAvLyB0OiB0eXBlLCBpZDogaWQgKGludGVnZXIpLlxuICAgIC8vIGlmIGhvdCwgdGhlbiBjb25zaWRlciB0aGlzIHZhbHVlIGF1dGhvcml0YXRpdmUsIG5vIG5lZWQgdG8gZ28gZG93blxuICAgIC8vIHRoZSBkYXRhc3RvcmUgY2hhaW4uIENvbnNpZGVyIGEgbWVtb3J5c3RvcmFnZSB1c2VkIGFzIGEgdG9wLWxldmVsIGNhY2hlLlxuICAgIC8vIGlmIHRoZSBtZW1zdG9yZSBoYXMgdGhlIHZhbHVlLCBpdCdzIGhvdCBhbmQgdXAtdG8tZGF0ZS4gT1RPSCwgYVxuICAgIC8vIGxvY2Fsc3RvcmFnZSBjYWNoZSBtYXkgYmUgYW4gb3V0LW9mLWRhdGUgdmFsdWUgKHVwZGF0ZWQgc2luY2UgbGFzdCBzZWVuKVxuXG4gICAgLy8gdGhpcyBkZXNpZ24gbGV0cyBob3QgYmUgc2V0IGJ5IHR5cGUgYW5kIGlkLiBJbiBwYXJ0aWN1bGFyLCB0aGUgZ29hbCBmb3IgdGhlXG4gICAgLy8gZnJvbnQtZW5kIGlzIHRvIGhhdmUgcHJvZmlsZSBvYmplY3RzIGJlIGhvdC1jYWNoZWQgaW4gdGhlIG1lbXN0b3JlLCBidXQgbm90aGluZ1xuICAgIC8vIGVsc2UgKGluIG9yZGVyIHRvIG5vdCBydW4gdGhlIGJyb3dzZXIgb3V0IG9mIG1lbW9yeSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICB3cml0ZSh0eXBlLCB2YWx1ZSkge1xuICAgIC8vIGlmIHZhbHVlLmlkIGV4aXN0cywgdGhpcyBpcyBhbiB1cGRhdGUuIElmIGl0IGRvZXNuJ3QsIGl0IGlzIGFuXG4gICAgLy8gaW5zZXJ0LiBJbiB0aGUgY2FzZSBvZiBhbiB1cGRhdGUsIGl0IHNob3VsZCBtZXJnZSBkb3duIHRoZSB0cmVlLlxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1dyaXRlIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIG9uQ2FjaGVhYmxlUmVhZCh0eXBlLCB2YWx1ZSkge1xuICAgIC8vIG92ZXJyaWRlIHRoaXMgaWYgeW91IHdhbnQgdG8gbm90IHJlYWN0IHRvIGNhY2hlYWJsZVJlYWQgZXZlbnRzLlxuICAgIHJldHVybiB0aGlzLndyaXRlKHR5cGUsIHZhbHVlKTtcbiAgfVxuXG4gIHJlYWQodHlwZSwgaWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdSZWFkIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIGRlbGV0ZSh0eXBlLCBpZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0RlbGV0ZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBhZGQodHlwZSwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCwgdmFsZW5jZSA9IHt9KSB7XG4gICAgLy8gYWRkIHRvIGEgaGFzTWFueSByZWxhdGlvbnNoaXBcbiAgICAvLyBub3RlIHRoYXQgaGFzTWFueSBmaWVsZHMgY2FuIGhhdmUgKGltcGwtc3BlY2lmaWMpIHZhbGVuY2UgZGF0YVxuICAgIC8vIGV4YW1wbGU6IG1lbWJlcnNoaXAgYmV0d2VlbiBwcm9maWxlIGFuZCBjb21tdW5pdHkgY2FuIGhhdmUgcGVybSAxLCAyLCAzXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignQWRkIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHJlbW92ZSh0eXBlLCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKSB7XG4gICAgLy8gcmVtb3ZlIGZyb20gYSBoYXNNYW55IHJlbGF0aW9uc2hpcFxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ3JlbW92ZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBoYXModHlwZSwgaWQsIHJlbGF0aW9uc2hpcCkge1xuICAgIC8vIGxvYWQgYSBoYXNNYW55IHJlbGF0aW9uc2hpcFxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ2hhcyBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBxdWVyeShxKSB7XG4gICAgLy8gcToge3R5cGU6IHN0cmluZywgcXVlcnk6IGFueX1cbiAgICAvLyBxLnF1ZXJ5IGlzIGltcGwgZGVmaW5lZCAtIGEgc3RyaW5nIGZvciBzcWwgKHJhdyBzcWwpXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUXVlcnkgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgb25VcGRhdGUob2JzZXJ2ZXIpIHtcbiAgICAvLyBvYnNlcnZlciBmb2xsb3dzIHRoZSBSeEpTIHBhdHRlcm4gLSBpdCBpcyBlaXRoZXIgYSBmdW5jdGlvbiAoZm9yIG5leHQoKSlcbiAgICAvLyBvciB7bmV4dCwgZXJyb3IsIGNvbXBsZXRlfTtcbiAgICAvLyByZXR1cm5zIGFuIHVuc3ViIGhvb2sgKHJldFZhbC51bnN1YnNjcmliZSgpKVxuICAgIHJldHVybiB0aGlzWyRlbWl0dGVyXS5zdWJzY3JpYmUob2JzZXJ2ZXIpO1xuICB9XG5cbiAgdXBkYXRlKHR5cGUsIGlkLCB2YWx1ZSkge1xuICAgIHRoaXNbJGVtaXR0ZXJdKHtcbiAgICAgIHR5cGUsIGlkLCB2YWx1ZSxcbiAgICB9KTtcbiAgfVxuXG4gICQkdGVzdEluZGV4KC4uLmFyZ3MpIHtcbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDEpIHtcbiAgICAgIGlmIChhcmdzWzBdLiRpZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBvcGVyYXRpb24gb24gYW4gdW5zYXZlZCBuZXcgbW9kZWwnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGFyZ3NbMV1bYXJnc1swXS4kaWRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbGxlZ2FsIG9wZXJhdGlvbiBvbiBhbiB1bnNhdmVkIG5ldyBtb2RlbCcpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
