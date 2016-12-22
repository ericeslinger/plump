'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Storage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* eslint no-unused-vars: 0 */

var _bluebird = require('bluebird');

var Bluebird = _interopRequireWildcard(_bluebird);

var _Rx = require('rxjs/Rx');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $emitter = Symbol('$emitter');

// type: an object that defines the type. typically this will be
// part of the Model class hierarchy, but Storage objects call no methods
// on the type object. We only are interested in Type.$name, Type.$id and Type.$fields.
// Note that Type.$id is the *name of the id field* on instances
//    and NOT the actual id field (e.g., in most cases, Type.$id === 'id').
// id: unique id. Often an integer, but not necessary (could be an oid)


// hasMany relationships are treated like id arrays. So, add / remove / has
// just stores and removes integers.

var Storage = exports.Storage = function () {
  function Storage() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Storage);

    // a "terminal" storage facility is the end of the storage chain.
    // usually sql on the server side and rest on the client side, it *must*
    // receive the writes, and is the final authoritative answer on whether
    // something is 404.

    // terminal facilities are also the only ones that can authoritatively answer
    // authorization questions, but the design may allow for authorization to be
    // cached.
    this.terminal = opts.terminal || false;
    this[$emitter] = new _Rx.Subject();
  }

  _createClass(Storage, [{
    key: 'hot',
    value: function hot(type, id) {
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
  }, {
    key: 'write',
    value: function write(type, value) {
      // if value.id exists, this is an update. If it doesn't, it is an
      // insert. In the case of an update, it should merge down the tree.
      return Bluebird.reject(new Error('Write not implemented'));
    }

    // TODO: write the two-way has/get logic into this method
    // and provide override hooks for readOne readMany

  }, {
    key: 'read',
    value: function read(type, id, key) {
      var _this = this;

      return Bluebird.resolve().then(function () {
        if (key && type.$fields[key].type === 'hasMany') {
          return _this.readMany(type, id, key);
        } else {
          return _this.readOne(type, id);
        }
      }).then(function (result) {
        return _this.notifyUpdate(type, id, result, key).then(function () {
          return result;
        });
      });
    }
  }, {
    key: 'readOne',
    value: function readOne(type, id) {
      return Bluebird.reject(new Error('ReadOne not implemented'));
    }
  }, {
    key: 'readMany',
    value: function readMany(type, id, key) {
      return Bluebird.reject(new Error('ReadMany not implemented'));
    }
  }, {
    key: 'delete',
    value: function _delete(type, id) {
      return Bluebird.reject(new Error('Delete not implemented'));
    }
  }, {
    key: 'add',
    value: function add(type, id, relationship, childId) {
      var valence = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

      // add to a hasMany relationship
      // note that hasMany fields can have (impl-specific) valence data
      // example: membership between profile and community can have perm 1, 2, 3
      return Bluebird.reject(new Error('Add not implemented'));
    }
  }, {
    key: 'remove',
    value: function remove(type, id, relationship, childId) {
      // remove from a hasMany relationship
      return Bluebird.reject(new Error('remove not implemented'));
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(type, id, relationship, childId) {
      var valence = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

      // should modify an existing hasMany valence data. Throw if not existing.
      return Bluebird.reject(new Error('modifyRelationship not implemented'));
    }
  }, {
    key: 'query',
    value: function query(q) {
      // q: {type: string, query: any}
      // q.query is impl defined - a string for sql (raw sql)
      return Bluebird.reject(new Error('Query not implemented'));
    }
  }, {
    key: 'onUpdate',
    value: function onUpdate(observer) {
      // observer follows the RxJS pattern - it is either a function (for next())
      // or {next, error, complete};
      // returns an unsub hook (retVal.unsubscribe())
      return this[$emitter].subscribe(observer);
    }
  }, {
    key: 'notifyUpdate',
    value: function notifyUpdate(type, id, value, field) {
      var _this2 = this;

      return Bluebird.resolve().then(function () {
        if (_this2.terminal) {
          if (field) {
            if (value !== null) {
              return _this2[$emitter].next({
                type: type, id: id, field: field, value: value[field]
              });
            } else {
              return _this2.readMany(type, id, field).then(function (list) {
                return _this2[$emitter].next({
                  type: type, id: id, field: field, value: list[field]
                });
              });
            }
          } else {
            return _this2[$emitter].next({
              type: type, id: id, value: value
            });
          }
        } else {
          return null;
        }
      });
    }
  }, {
    key: '$$testIndex',
    value: function $$testIndex() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (args.length === 1) {
        if (args[0].$id === undefined) {
          throw new Error('Illegal operation on an unsaved new model');
        }
      } else if (args[1][args[0].$id] === undefined) {
        throw new Error('Illegal operation on an unsaved new model');
      }
    }
  }]);

  return Storage;
}();

// convenience function that walks an array replacing any {id} with context.id


Storage.massReplace = function massReplace(block, context) {
  return block.map(function (v) {
    if (Array.isArray(v)) {
      return massReplace(v, context);
    } else if (typeof v === 'string' && v.match(/^\{(.*)\}$/)) {
      return context[v.match(/^\{(.*)\}$/)[1]];
    } else {
      return v;
    }
  });
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsIiRlbWl0dGVyIiwiU3ltYm9sIiwiU3RvcmFnZSIsIm9wdHMiLCJ0ZXJtaW5hbCIsInR5cGUiLCJpZCIsInZhbHVlIiwicmVqZWN0IiwiRXJyb3IiLCJrZXkiLCJyZXNvbHZlIiwidGhlbiIsIiRmaWVsZHMiLCJyZWFkTWFueSIsInJlYWRPbmUiLCJyZXN1bHQiLCJub3RpZnlVcGRhdGUiLCJyZWxhdGlvbnNoaXAiLCJjaGlsZElkIiwidmFsZW5jZSIsInEiLCJvYnNlcnZlciIsInN1YnNjcmliZSIsImZpZWxkIiwibmV4dCIsImxpc3QiLCJhcmdzIiwibGVuZ3RoIiwiJGlkIiwidW5kZWZpbmVkIiwibWFzc1JlcGxhY2UiLCJibG9jayIsImNvbnRleHQiLCJtYXAiLCJ2IiwiQXJyYXkiLCJpc0FycmF5IiwibWF0Y2giXSwibWFwcGluZ3MiOiI7Ozs7Ozs7cWpCQUFBOztBQUVBOztJQUFZQSxROztBQUNaOzs7Ozs7QUFFQSxJQUFNQyxXQUFXQyxPQUFPLFVBQVAsQ0FBakI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztJQUVhQyxPLFdBQUFBLE87QUFFWCxxQkFBdUI7QUFBQSxRQUFYQyxJQUFXLHVFQUFKLEVBQUk7O0FBQUE7O0FBQ3JCO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFNBQUtDLFFBQUwsR0FBZ0JELEtBQUtDLFFBQUwsSUFBaUIsS0FBakM7QUFDQSxTQUFLSixRQUFMLElBQWlCLGlCQUFqQjtBQUNEOzs7O3dCQUVHSyxJLEVBQU1DLEUsRUFBSTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsYUFBTyxLQUFQO0FBQ0Q7OzswQkFFS0QsSSxFQUFNRSxLLEVBQU87QUFDakI7QUFDQTtBQUNBLGFBQU9SLFNBQVNTLE1BQVQsQ0FBZ0IsSUFBSUMsS0FBSixDQUFVLHVCQUFWLENBQWhC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RyxLQUFGLENBQVEsWUFBUixFQUFzQixDQUF0QixDQUFSLENBQVA7QUFDRCxLQUZNLE1BRUE7QUFDTCxhQUFPSCxDQUFQO0FBQ0Q7QUFDRixHQVJNLENBQVA7QUFTRCxDQVZEIiwiZmlsZSI6InN0b3JhZ2Uvc3RvcmFnZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludCBuby11bnVzZWQtdmFyczogMCAqL1xuXG5pbXBvcnQgKiBhcyBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBTdWJqZWN0IH0gZnJvbSAncnhqcy9SeCc7XG5cbmNvbnN0ICRlbWl0dGVyID0gU3ltYm9sKCckZW1pdHRlcicpO1xuXG4vLyB0eXBlOiBhbiBvYmplY3QgdGhhdCBkZWZpbmVzIHRoZSB0eXBlLiB0eXBpY2FsbHkgdGhpcyB3aWxsIGJlXG4vLyBwYXJ0IG9mIHRoZSBNb2RlbCBjbGFzcyBoaWVyYXJjaHksIGJ1dCBTdG9yYWdlIG9iamVjdHMgY2FsbCBubyBtZXRob2RzXG4vLyBvbiB0aGUgdHlwZSBvYmplY3QuIFdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gVHlwZS4kbmFtZSwgVHlwZS4kaWQgYW5kIFR5cGUuJGZpZWxkcy5cbi8vIE5vdGUgdGhhdCBUeXBlLiRpZCBpcyB0aGUgKm5hbWUgb2YgdGhlIGlkIGZpZWxkKiBvbiBpbnN0YW5jZXNcbi8vICAgIGFuZCBOT1QgdGhlIGFjdHVhbCBpZCBmaWVsZCAoZS5nLiwgaW4gbW9zdCBjYXNlcywgVHlwZS4kaWQgPT09ICdpZCcpLlxuLy8gaWQ6IHVuaXF1ZSBpZC4gT2Z0ZW4gYW4gaW50ZWdlciwgYnV0IG5vdCBuZWNlc3NhcnkgKGNvdWxkIGJlIGFuIG9pZClcblxuXG4vLyBoYXNNYW55IHJlbGF0aW9uc2hpcHMgYXJlIHRyZWF0ZWQgbGlrZSBpZCBhcnJheXMuIFNvLCBhZGQgLyByZW1vdmUgLyBoYXNcbi8vIGp1c3Qgc3RvcmVzIGFuZCByZW1vdmVzIGludGVnZXJzLlxuXG5leHBvcnQgY2xhc3MgU3RvcmFnZSB7XG5cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgLy8gYSBcInRlcm1pbmFsXCIgc3RvcmFnZSBmYWNpbGl0eSBpcyB0aGUgZW5kIG9mIHRoZSBzdG9yYWdlIGNoYWluLlxuICAgIC8vIHVzdWFsbHkgc3FsIG9uIHRoZSBzZXJ2ZXIgc2lkZSBhbmQgcmVzdCBvbiB0aGUgY2xpZW50IHNpZGUsIGl0ICptdXN0KlxuICAgIC8vIHJlY2VpdmUgdGhlIHdyaXRlcywgYW5kIGlzIHRoZSBmaW5hbCBhdXRob3JpdGF0aXZlIGFuc3dlciBvbiB3aGV0aGVyXG4gICAgLy8gc29tZXRoaW5nIGlzIDQwNC5cblxuICAgIC8vIHRlcm1pbmFsIGZhY2lsaXRpZXMgYXJlIGFsc28gdGhlIG9ubHkgb25lcyB0aGF0IGNhbiBhdXRob3JpdGF0aXZlbHkgYW5zd2VyXG4gICAgLy8gYXV0aG9yaXphdGlvbiBxdWVzdGlvbnMsIGJ1dCB0aGUgZGVzaWduIG1heSBhbGxvdyBmb3IgYXV0aG9yaXphdGlvbiB0byBiZVxuICAgIC8vIGNhY2hlZC5cbiAgICB0aGlzLnRlcm1pbmFsID0gb3B0cy50ZXJtaW5hbCB8fCBmYWxzZTtcbiAgICB0aGlzWyRlbWl0dGVyXSA9IG5ldyBTdWJqZWN0KCk7XG4gIH1cblxuICBob3QodHlwZSwgaWQpIHtcbiAgICAvLyB0OiB0eXBlLCBpZDogaWQgKGludGVnZXIpLlxuICAgIC8vIGlmIGhvdCwgdGhlbiBjb25zaWRlciB0aGlzIHZhbHVlIGF1dGhvcml0YXRpdmUsIG5vIG5lZWQgdG8gZ28gZG93blxuICAgIC8vIHRoZSBkYXRhc3RvcmUgY2hhaW4uIENvbnNpZGVyIGEgbWVtb3J5c3RvcmFnZSB1c2VkIGFzIGEgdG9wLWxldmVsIGNhY2hlLlxuICAgIC8vIGlmIHRoZSBtZW1zdG9yZSBoYXMgdGhlIHZhbHVlLCBpdCdzIGhvdCBhbmQgdXAtdG8tZGF0ZS4gT1RPSCwgYVxuICAgIC8vIGxvY2Fsc3RvcmFnZSBjYWNoZSBtYXkgYmUgYW4gb3V0LW9mLWRhdGUgdmFsdWUgKHVwZGF0ZWQgc2luY2UgbGFzdCBzZWVuKVxuXG4gICAgLy8gdGhpcyBkZXNpZ24gbGV0cyBob3QgYmUgc2V0IGJ5IHR5cGUgYW5kIGlkLiBJbiBwYXJ0aWN1bGFyLCB0aGUgZ29hbCBmb3IgdGhlXG4gICAgLy8gZnJvbnQtZW5kIGlzIHRvIGhhdmUgcHJvZmlsZSBvYmplY3RzIGJlIGhvdC1jYWNoZWQgaW4gdGhlIG1lbXN0b3JlLCBidXQgbm90aGluZ1xuICAgIC8vIGVsc2UgKGluIG9yZGVyIHRvIG5vdCBydW4gdGhlIGJyb3dzZXIgb3V0IG9mIG1lbW9yeSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICB3cml0ZSh0eXBlLCB2YWx1ZSkge1xuICAgIC8vIGlmIHZhbHVlLmlkIGV4aXN0cywgdGhpcyBpcyBhbiB1cGRhdGUuIElmIGl0IGRvZXNuJ3QsIGl0IGlzIGFuXG4gICAgLy8gaW5zZXJ0LiBJbiB0aGUgY2FzZSBvZiBhbiB1cGRhdGUsIGl0IHNob3VsZCBtZXJnZSBkb3duIHRoZSB0cmVlLlxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdXcml0ZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICAvLyBUT0RPOiB3cml0ZSB0aGUgdHdvLXdheSBoYXMvZ2V0IGxvZ2ljIGludG8gdGhpcyBtZXRob2RcbiAgLy8gYW5kIHByb3ZpZGUgb3ZlcnJpZGUgaG9va3MgZm9yIHJlYWRPbmUgcmVhZE1hbnlcblxuICByZWFkKHR5cGUsIGlkLCBrZXkpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKGtleSAmJiB0eXBlLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZE1hbnkodHlwZSwgaWQsIGtleSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkT25lKHR5cGUsIGlkKTtcbiAgICAgIH1cbiAgICB9KS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgIHJldHVybiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBpZCwgcmVzdWx0LCBrZXkpXG4gICAgICAudGhlbigoKSA9PiByZXN1bHQpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVhZE9uZSh0eXBlLCBpZCkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdSZWFkT25lIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHJlYWRNYW55KHR5cGUsIGlkLCBrZXkpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignUmVhZE1hbnkgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgZGVsZXRlKHR5cGUsIGlkKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0RlbGV0ZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBhZGQodHlwZSwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCwgdmFsZW5jZSA9IHt9KSB7XG4gICAgLy8gYWRkIHRvIGEgaGFzTWFueSByZWxhdGlvbnNoaXBcbiAgICAvLyBub3RlIHRoYXQgaGFzTWFueSBmaWVsZHMgY2FuIGhhdmUgKGltcGwtc3BlY2lmaWMpIHZhbGVuY2UgZGF0YVxuICAgIC8vIGV4YW1wbGU6IG1lbWJlcnNoaXAgYmV0d2VlbiBwcm9maWxlIGFuZCBjb21tdW5pdHkgY2FuIGhhdmUgcGVybSAxLCAyLCAzXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0FkZCBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICByZW1vdmUodHlwZSwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCkge1xuICAgIC8vIHJlbW92ZSBmcm9tIGEgaGFzTWFueSByZWxhdGlvbnNoaXBcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcigncmVtb3ZlIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIG1vZGlmeVJlbGF0aW9uc2hpcCh0eXBlLCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkLCB2YWxlbmNlID0ge30pIHtcbiAgICAvLyBzaG91bGQgbW9kaWZ5IGFuIGV4aXN0aW5nIGhhc01hbnkgdmFsZW5jZSBkYXRhLiBUaHJvdyBpZiBub3QgZXhpc3RpbmcuXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ21vZGlmeVJlbGF0aW9uc2hpcCBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBxdWVyeShxKSB7XG4gICAgLy8gcToge3R5cGU6IHN0cmluZywgcXVlcnk6IGFueX1cbiAgICAvLyBxLnF1ZXJ5IGlzIGltcGwgZGVmaW5lZCAtIGEgc3RyaW5nIGZvciBzcWwgKHJhdyBzcWwpXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ1F1ZXJ5IG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIG9uVXBkYXRlKG9ic2VydmVyKSB7XG4gICAgLy8gb2JzZXJ2ZXIgZm9sbG93cyB0aGUgUnhKUyBwYXR0ZXJuIC0gaXQgaXMgZWl0aGVyIGEgZnVuY3Rpb24gKGZvciBuZXh0KCkpXG4gICAgLy8gb3Ige25leHQsIGVycm9yLCBjb21wbGV0ZX07XG4gICAgLy8gcmV0dXJucyBhbiB1bnN1YiBob29rIChyZXRWYWwudW5zdWJzY3JpYmUoKSlcbiAgICByZXR1cm4gdGhpc1skZW1pdHRlcl0uc3Vic2NyaWJlKG9ic2VydmVyKTtcbiAgfVxuXG4gIG5vdGlmeVVwZGF0ZSh0eXBlLCBpZCwgdmFsdWUsIGZpZWxkKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgIGlmIChmaWVsZCkge1xuICAgICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbJGVtaXR0ZXJdLm5leHQoe1xuICAgICAgICAgICAgICB0eXBlLCBpZCwgZmllbGQsIHZhbHVlOiB2YWx1ZVtmaWVsZF0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVhZE1hbnkodHlwZSwgaWQsIGZpZWxkKVxuICAgICAgICAgICAgLnRoZW4oKGxpc3QpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbJGVtaXR0ZXJdLm5leHQoe1xuICAgICAgICAgICAgICAgIHR5cGUsIGlkLCBmaWVsZCwgdmFsdWU6IGxpc3RbZmllbGRdLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skZW1pdHRlcl0ubmV4dCh7XG4gICAgICAgICAgICB0eXBlLCBpZCwgdmFsdWUsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgJCR0ZXN0SW5kZXgoLi4uYXJncykge1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgaWYgKGFyZ3NbMF0uJGlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbGxlZ2FsIG9wZXJhdGlvbiBvbiBhbiB1bnNhdmVkIG5ldyBtb2RlbCcpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYXJnc1sxXVthcmdzWzBdLiRpZF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbGxlZ2FsIG9wZXJhdGlvbiBvbiBhbiB1bnNhdmVkIG5ldyBtb2RlbCcpO1xuICAgIH1cbiAgfVxufVxuXG5cbi8vIGNvbnZlbmllbmNlIGZ1bmN0aW9uIHRoYXQgd2Fsa3MgYW4gYXJyYXkgcmVwbGFjaW5nIGFueSB7aWR9IHdpdGggY29udGV4dC5pZFxuU3RvcmFnZS5tYXNzUmVwbGFjZSA9IGZ1bmN0aW9uIG1hc3NSZXBsYWNlKGJsb2NrLCBjb250ZXh0KSB7XG4gIHJldHVybiBibG9jay5tYXAoKHYpID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2KSkge1xuICAgICAgcmV0dXJuIG1hc3NSZXBsYWNlKHYsIGNvbnRleHQpO1xuICAgIH0gZWxzZSBpZiAoKHR5cGVvZiB2ID09PSAnc3RyaW5nJykgJiYgKHYubWF0Y2goL15cXHsoLiopXFx9JC8pKSkge1xuICAgICAgcmV0dXJuIGNvbnRleHRbdi5tYXRjaCgvXlxceyguKilcXH0kLylbMV1dO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdjtcbiAgICB9XG4gIH0pO1xufTtcbiJdfQ==
