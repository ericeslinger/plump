'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Storage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* eslint no-unused-vars: 0 */

var _bluebird = require('bluebird');

var Bluebird = _interopRequireWildcard(_bluebird);

var _Rx = require('rxjs/Rx');

var _model = require('../model');

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
    value: function read(type, id) {
      var _this = this;

      var key = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _model.$self;

      return Bluebird.resolve().then(function () {
        if (key !== _model.$self && type.$fields[key].type === 'hasMany') {
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
    value: function notifyUpdate(type, id, value) {
      var _this2 = this;

      var field = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : _model.$self;

      return Bluebird.resolve().then(function () {
        if (_this2.terminal) {
          if (field !== _model.$self) {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsIiRlbWl0dGVyIiwiU3ltYm9sIiwiU3RvcmFnZSIsIm9wdHMiLCJ0ZXJtaW5hbCIsInR5cGUiLCJpZCIsInZhbHVlIiwicmVqZWN0IiwiRXJyb3IiLCJrZXkiLCJyZXNvbHZlIiwidGhlbiIsIiRmaWVsZHMiLCJyZWFkTWFueSIsInJlYWRPbmUiLCJyZXN1bHQiLCJub3RpZnlVcGRhdGUiLCJyZWxhdGlvbnNoaXAiLCJjaGlsZElkIiwidmFsZW5jZSIsInEiLCJvYnNlcnZlciIsInN1YnNjcmliZSIsImZpZWxkIiwibmV4dCIsImxpc3QiLCJhcmdzIiwibGVuZ3RoIiwiJGlkIiwidW5kZWZpbmVkIiwibWFzc1JlcGxhY2UiLCJibG9jayIsImNvbnRleHQiLCJtYXAiLCJ2IiwiQXJyYXkiLCJpc0FycmF5IiwibWF0Y2giXSwibWFwcGluZ3MiOiI7Ozs7Ozs7cWpCQUFBOztBQUVBOztJQUFZQSxROztBQUNaOztBQUNBOzs7Ozs7QUFFQSxJQUFNQyxXQUFXQyxPQUFPLFVBQVAsQ0FBakI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztJQUVhQyxPLFdBQUFBLE87QUFFWCxxQkFBdUI7QUFBQSxRQUFYQyxJQUFXLHVFQUFKLEVBQUk7O0FBQUE7O0FBQ3JCO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFNBQUtDLFFBQUwsR0FBZ0JELEtBQUtDLFFBQUwsSUFBaUIsS0FBakM7QUFDQSxTQUFLSixRQUFMLElBQWlCLGlCQUFqQjtBQUNEOzs7O3dCQUVHSyxJLEVBQU1DLEUsRUFBSTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsYUFBTyxLQUFQO0FBQ0Q7OzswQkFFS0QsSSxFQUFNRSxLLEVBQU87QUFDakI7QUFDQTtBQUNBLGFBQU9SLFNBQVNTLE1BQVQsQ0FBZ0IsSUFBSUMsS0FBSixDQUFVLHVCQUFW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UixDQUFoQyxFQUF3RDtBQUM3RCxhQUFPTCxRQUFRRSxFQUFFRyxLQUFGLENBQVEsWUFBUixFQUFzQixDQUF0QixDQUFSLENBQVA7QUFDRCxLQUZNLE1BRUE7QUFDTCxhQUFPSCxDQUFQO0FBQ0Q7QUFDRixHQVJNLENBQVA7QUFTRCxDQVZEIiwiZmlsZSI6InN0b3JhZ2Uvc3RvcmFnZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludCBuby11bnVzZWQtdmFyczogMCAqL1xuXG5pbXBvcnQgKiBhcyBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBTdWJqZWN0IH0gZnJvbSAncnhqcy9SeCc7XG5pbXBvcnQgeyAkc2VsZiB9IGZyb20gJy4uL21vZGVsJztcblxuY29uc3QgJGVtaXR0ZXIgPSBTeW1ib2woJyRlbWl0dGVyJyk7XG5cbi8vIHR5cGU6IGFuIG9iamVjdCB0aGF0IGRlZmluZXMgdGhlIHR5cGUuIHR5cGljYWxseSB0aGlzIHdpbGwgYmVcbi8vIHBhcnQgb2YgdGhlIE1vZGVsIGNsYXNzIGhpZXJhcmNoeSwgYnV0IFN0b3JhZ2Ugb2JqZWN0cyBjYWxsIG5vIG1ldGhvZHNcbi8vIG9uIHRoZSB0eXBlIG9iamVjdC4gV2Ugb25seSBhcmUgaW50ZXJlc3RlZCBpbiBUeXBlLiRuYW1lLCBUeXBlLiRpZCBhbmQgVHlwZS4kZmllbGRzLlxuLy8gTm90ZSB0aGF0IFR5cGUuJGlkIGlzIHRoZSAqbmFtZSBvZiB0aGUgaWQgZmllbGQqIG9uIGluc3RhbmNlc1xuLy8gICAgYW5kIE5PVCB0aGUgYWN0dWFsIGlkIGZpZWxkIChlLmcuLCBpbiBtb3N0IGNhc2VzLCBUeXBlLiRpZCA9PT0gJ2lkJykuXG4vLyBpZDogdW5pcXVlIGlkLiBPZnRlbiBhbiBpbnRlZ2VyLCBidXQgbm90IG5lY2Vzc2FyeSAoY291bGQgYmUgYW4gb2lkKVxuXG5cbi8vIGhhc01hbnkgcmVsYXRpb25zaGlwcyBhcmUgdHJlYXRlZCBsaWtlIGlkIGFycmF5cy4gU28sIGFkZCAvIHJlbW92ZSAvIGhhc1xuLy8ganVzdCBzdG9yZXMgYW5kIHJlbW92ZXMgaW50ZWdlcnMuXG5cbmV4cG9ydCBjbGFzcyBTdG9yYWdlIHtcblxuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICAvLyBhIFwidGVybWluYWxcIiBzdG9yYWdlIGZhY2lsaXR5IGlzIHRoZSBlbmQgb2YgdGhlIHN0b3JhZ2UgY2hhaW4uXG4gICAgLy8gdXN1YWxseSBzcWwgb24gdGhlIHNlcnZlciBzaWRlIGFuZCByZXN0IG9uIHRoZSBjbGllbnQgc2lkZSwgaXQgKm11c3QqXG4gICAgLy8gcmVjZWl2ZSB0aGUgd3JpdGVzLCBhbmQgaXMgdGhlIGZpbmFsIGF1dGhvcml0YXRpdmUgYW5zd2VyIG9uIHdoZXRoZXJcbiAgICAvLyBzb21ldGhpbmcgaXMgNDA0LlxuXG4gICAgLy8gdGVybWluYWwgZmFjaWxpdGllcyBhcmUgYWxzbyB0aGUgb25seSBvbmVzIHRoYXQgY2FuIGF1dGhvcml0YXRpdmVseSBhbnN3ZXJcbiAgICAvLyBhdXRob3JpemF0aW9uIHF1ZXN0aW9ucywgYnV0IHRoZSBkZXNpZ24gbWF5IGFsbG93IGZvciBhdXRob3JpemF0aW9uIHRvIGJlXG4gICAgLy8gY2FjaGVkLlxuICAgIHRoaXMudGVybWluYWwgPSBvcHRzLnRlcm1pbmFsIHx8IGZhbHNlO1xuICAgIHRoaXNbJGVtaXR0ZXJdID0gbmV3IFN1YmplY3QoKTtcbiAgfVxuXG4gIGhvdCh0eXBlLCBpZCkge1xuICAgIC8vIHQ6IHR5cGUsIGlkOiBpZCAoaW50ZWdlcikuXG4gICAgLy8gaWYgaG90LCB0aGVuIGNvbnNpZGVyIHRoaXMgdmFsdWUgYXV0aG9yaXRhdGl2ZSwgbm8gbmVlZCB0byBnbyBkb3duXG4gICAgLy8gdGhlIGRhdGFzdG9yZSBjaGFpbi4gQ29uc2lkZXIgYSBtZW1vcnlzdG9yYWdlIHVzZWQgYXMgYSB0b3AtbGV2ZWwgY2FjaGUuXG4gICAgLy8gaWYgdGhlIG1lbXN0b3JlIGhhcyB0aGUgdmFsdWUsIGl0J3MgaG90IGFuZCB1cC10by1kYXRlLiBPVE9ILCBhXG4gICAgLy8gbG9jYWxzdG9yYWdlIGNhY2hlIG1heSBiZSBhbiBvdXQtb2YtZGF0ZSB2YWx1ZSAodXBkYXRlZCBzaW5jZSBsYXN0IHNlZW4pXG5cbiAgICAvLyB0aGlzIGRlc2lnbiBsZXRzIGhvdCBiZSBzZXQgYnkgdHlwZSBhbmQgaWQuIEluIHBhcnRpY3VsYXIsIHRoZSBnb2FsIGZvciB0aGVcbiAgICAvLyBmcm9udC1lbmQgaXMgdG8gaGF2ZSBwcm9maWxlIG9iamVjdHMgYmUgaG90LWNhY2hlZCBpbiB0aGUgbWVtc3RvcmUsIGJ1dCBub3RoaW5nXG4gICAgLy8gZWxzZSAoaW4gb3JkZXIgdG8gbm90IHJ1biB0aGUgYnJvd3NlciBvdXQgb2YgbWVtb3J5KVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHdyaXRlKHR5cGUsIHZhbHVlKSB7XG4gICAgLy8gaWYgdmFsdWUuaWQgZXhpc3RzLCB0aGlzIGlzIGFuIHVwZGF0ZS4gSWYgaXQgZG9lc24ndCwgaXQgaXMgYW5cbiAgICAvLyBpbnNlcnQuIEluIHRoZSBjYXNlIG9mIGFuIHVwZGF0ZSwgaXQgc2hvdWxkIG1lcmdlIGRvd24gdGhlIHRyZWUuXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ1dyaXRlIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIC8vIFRPRE86IHdyaXRlIHRoZSB0d28td2F5IGhhcy9nZXQgbG9naWMgaW50byB0aGlzIG1ldGhvZFxuICAvLyBhbmQgcHJvdmlkZSBvdmVycmlkZSBob29rcyBmb3IgcmVhZE9uZSByZWFkTWFueVxuXG4gIHJlYWQodHlwZSwgaWQsIGtleSA9ICRzZWxmKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmICgoa2V5ICE9PSAkc2VsZikgJiYgKHR5cGUuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55JykpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZE1hbnkodHlwZSwgaWQsIGtleSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkT25lKHR5cGUsIGlkKTtcbiAgICAgIH1cbiAgICB9KS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgIHJldHVybiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBpZCwgcmVzdWx0LCBrZXkpXG4gICAgICAudGhlbigoKSA9PiByZXN1bHQpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVhZE9uZSh0eXBlLCBpZCkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdSZWFkT25lIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHJlYWRNYW55KHR5cGUsIGlkLCBrZXkpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignUmVhZE1hbnkgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgZGVsZXRlKHR5cGUsIGlkKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0RlbGV0ZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBhZGQodHlwZSwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCwgdmFsZW5jZSA9IHt9KSB7XG4gICAgLy8gYWRkIHRvIGEgaGFzTWFueSByZWxhdGlvbnNoaXBcbiAgICAvLyBub3RlIHRoYXQgaGFzTWFueSBmaWVsZHMgY2FuIGhhdmUgKGltcGwtc3BlY2lmaWMpIHZhbGVuY2UgZGF0YVxuICAgIC8vIGV4YW1wbGU6IG1lbWJlcnNoaXAgYmV0d2VlbiBwcm9maWxlIGFuZCBjb21tdW5pdHkgY2FuIGhhdmUgcGVybSAxLCAyLCAzXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0FkZCBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICByZW1vdmUodHlwZSwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCkge1xuICAgIC8vIHJlbW92ZSBmcm9tIGEgaGFzTWFueSByZWxhdGlvbnNoaXBcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcigncmVtb3ZlIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIG1vZGlmeVJlbGF0aW9uc2hpcCh0eXBlLCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkLCB2YWxlbmNlID0ge30pIHtcbiAgICAvLyBzaG91bGQgbW9kaWZ5IGFuIGV4aXN0aW5nIGhhc01hbnkgdmFsZW5jZSBkYXRhLiBUaHJvdyBpZiBub3QgZXhpc3RpbmcuXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ21vZGlmeVJlbGF0aW9uc2hpcCBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBxdWVyeShxKSB7XG4gICAgLy8gcToge3R5cGU6IHN0cmluZywgcXVlcnk6IGFueX1cbiAgICAvLyBxLnF1ZXJ5IGlzIGltcGwgZGVmaW5lZCAtIGEgc3RyaW5nIGZvciBzcWwgKHJhdyBzcWwpXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ1F1ZXJ5IG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIG9uVXBkYXRlKG9ic2VydmVyKSB7XG4gICAgLy8gb2JzZXJ2ZXIgZm9sbG93cyB0aGUgUnhKUyBwYXR0ZXJuIC0gaXQgaXMgZWl0aGVyIGEgZnVuY3Rpb24gKGZvciBuZXh0KCkpXG4gICAgLy8gb3Ige25leHQsIGVycm9yLCBjb21wbGV0ZX07XG4gICAgLy8gcmV0dXJucyBhbiB1bnN1YiBob29rIChyZXRWYWwudW5zdWJzY3JpYmUoKSlcbiAgICByZXR1cm4gdGhpc1skZW1pdHRlcl0uc3Vic2NyaWJlKG9ic2VydmVyKTtcbiAgfVxuXG4gIG5vdGlmeVVwZGF0ZSh0eXBlLCBpZCwgdmFsdWUsIGZpZWxkID0gJHNlbGYpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgaWYgKGZpZWxkICE9PSAkc2VsZikge1xuICAgICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbJGVtaXR0ZXJdLm5leHQoe1xuICAgICAgICAgICAgICB0eXBlLCBpZCwgZmllbGQsIHZhbHVlOiB2YWx1ZVtmaWVsZF0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVhZE1hbnkodHlwZSwgaWQsIGZpZWxkKVxuICAgICAgICAgICAgLnRoZW4oKGxpc3QpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbJGVtaXR0ZXJdLm5leHQoe1xuICAgICAgICAgICAgICAgIHR5cGUsIGlkLCBmaWVsZCwgdmFsdWU6IGxpc3RbZmllbGRdLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skZW1pdHRlcl0ubmV4dCh7XG4gICAgICAgICAgICB0eXBlLCBpZCwgdmFsdWUsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgJCR0ZXN0SW5kZXgoLi4uYXJncykge1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgaWYgKGFyZ3NbMF0uJGlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbGxlZ2FsIG9wZXJhdGlvbiBvbiBhbiB1bnNhdmVkIG5ldyBtb2RlbCcpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYXJnc1sxXVthcmdzWzBdLiRpZF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbGxlZ2FsIG9wZXJhdGlvbiBvbiBhbiB1bnNhdmVkIG5ldyBtb2RlbCcpO1xuICAgIH1cbiAgfVxufVxuXG5cbi8vIGNvbnZlbmllbmNlIGZ1bmN0aW9uIHRoYXQgd2Fsa3MgYW4gYXJyYXkgcmVwbGFjaW5nIGFueSB7aWR9IHdpdGggY29udGV4dC5pZFxuU3RvcmFnZS5tYXNzUmVwbGFjZSA9IGZ1bmN0aW9uIG1hc3NSZXBsYWNlKGJsb2NrLCBjb250ZXh0KSB7XG4gIHJldHVybiBibG9jay5tYXAoKHYpID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2KSkge1xuICAgICAgcmV0dXJuIG1hc3NSZXBsYWNlKHYsIGNvbnRleHQpO1xuICAgIH0gZWxzZSBpZiAoKHR5cGVvZiB2ID09PSAnc3RyaW5nJykgJiYgKHYubWF0Y2goL15cXHsoLiopXFx9JC8pKSkge1xuICAgICAgcmV0dXJuIGNvbnRleHRbdi5tYXRjaCgvXlxceyguKilcXH0kLylbMV1dO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdjtcbiAgICB9XG4gIH0pO1xufTtcbiJdfQ==
