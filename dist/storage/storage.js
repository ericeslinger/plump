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
        if (result) {
          return _this.notifyUpdate(type, id, result, key).then(function () {
            return result;
          });
        } else {
          return result;
        }
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsIiRlbWl0dGVyIiwiU3ltYm9sIiwiU3RvcmFnZSIsIm9wdHMiLCJ0ZXJtaW5hbCIsInR5cGUiLCJpZCIsInZhbHVlIiwicmVqZWN0IiwiRXJyb3IiLCJrZXkiLCJyZXNvbHZlIiwidGhlbiIsIiRmaWVsZHMiLCJyZWFkTWFueSIsInJlYWRPbmUiLCJyZXN1bHQiLCJub3RpZnlVcGRhdGUiLCJyZWxhdGlvbnNoaXAiLCJjaGlsZElkIiwidmFsZW5jZSIsInEiLCJvYnNlcnZlciIsInN1YnNjcmliZSIsImZpZWxkIiwibmV4dCIsImxpc3QiLCJhcmdzIiwibGVuZ3RoIiwiJGlkIiwidW5kZWZpbmVkIiwibWFzc1JlcGxhY2UiLCJibG9jayIsImNvbnRleHQiLCJtYXAiLCJ2IiwiQXJyYXkiLCJpc0FycmF5IiwibWF0Y2giXSwibWFwcGluZ3MiOiI7Ozs7Ozs7cWpCQUFBOztBQUVBOztJQUFZQSxROztBQUNaOztBQUNBOzs7Ozs7QUFFQSxJQUFNQyxXQUFXQyxPQUFPLFVBQVAsQ0FBakI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztJQUVhQyxPLFdBQUFBLE87QUFFWCxxQkFBdUI7QUFBQSxRQUFYQyxJQUFXLHVFQUFKLEVBQUk7O0FBQUE7O0FBQ3JCO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFNBQUtDLFFBQUwsR0FBZ0JELEtBQUtDLFFBQUwsSUFBaUIsS0FBakM7QUFDQSxTQUFLSixRQUFMLElBQWlCLGlCQUFqQjtBQUNEOzs7O3dCQUVHSyxJLEVBQU1DLEUsRUFBSTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsYUFBTyxLQUFQO0FBQ0Q7OzswQkFFS0QsSSxFQUFNRSxLLEVBQU87QUFDakI7QUFDQTtBQUNBLGFBQU9SLFNBQVNTLE1BQVQsQ0FBZ0IsSUFBSUMsS0FBSixDQUFVLHVCQUFW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RCxNQUVPLElBQUssT0FBT0UsQ0FBUCxLQUFhLFFBQWQsSUFBNEJBLEVBQUVHLEtBQUYsQ0FBUSxZQUFSLENBQWhDLEVBQXdEO0FBQzdELGFBQU9MLFFBQVFFLEVBQUVHLEtBQUYsQ0FBUSxZQUFSLEVBQXNCLENBQXRCLENBQVIsQ0FBUDtBQUNELEtBRk0sTUFFQTtBQUNMLGFBQU9ILENBQVA7QUFDRDtBQUNGLEdBUk0sQ0FBUDtBQVNELENBVkQiLCJmaWxlIjoic3RvcmFnZS9zdG9yYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50IG5vLXVudXNlZC12YXJzOiAwICovXG5cbmltcG9ydCAqIGFzIEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IFN1YmplY3QgfSBmcm9tICdyeGpzL1J4JztcbmltcG9ydCB7ICRzZWxmIH0gZnJvbSAnLi4vbW9kZWwnO1xuXG5jb25zdCAkZW1pdHRlciA9IFN5bWJvbCgnJGVtaXR0ZXInKTtcblxuLy8gdHlwZTogYW4gb2JqZWN0IHRoYXQgZGVmaW5lcyB0aGUgdHlwZS4gdHlwaWNhbGx5IHRoaXMgd2lsbCBiZVxuLy8gcGFydCBvZiB0aGUgTW9kZWwgY2xhc3MgaGllcmFyY2h5LCBidXQgU3RvcmFnZSBvYmplY3RzIGNhbGwgbm8gbWV0aG9kc1xuLy8gb24gdGhlIHR5cGUgb2JqZWN0LiBXZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIFR5cGUuJG5hbWUsIFR5cGUuJGlkIGFuZCBUeXBlLiRmaWVsZHMuXG4vLyBOb3RlIHRoYXQgVHlwZS4kaWQgaXMgdGhlICpuYW1lIG9mIHRoZSBpZCBmaWVsZCogb24gaW5zdGFuY2VzXG4vLyAgICBhbmQgTk9UIHRoZSBhY3R1YWwgaWQgZmllbGQgKGUuZy4sIGluIG1vc3QgY2FzZXMsIFR5cGUuJGlkID09PSAnaWQnKS5cbi8vIGlkOiB1bmlxdWUgaWQuIE9mdGVuIGFuIGludGVnZXIsIGJ1dCBub3QgbmVjZXNzYXJ5IChjb3VsZCBiZSBhbiBvaWQpXG5cblxuLy8gaGFzTWFueSByZWxhdGlvbnNoaXBzIGFyZSB0cmVhdGVkIGxpa2UgaWQgYXJyYXlzLiBTbywgYWRkIC8gcmVtb3ZlIC8gaGFzXG4vLyBqdXN0IHN0b3JlcyBhbmQgcmVtb3ZlcyBpbnRlZ2Vycy5cblxuZXhwb3J0IGNsYXNzIFN0b3JhZ2Uge1xuXG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIC8vIGEgXCJ0ZXJtaW5hbFwiIHN0b3JhZ2UgZmFjaWxpdHkgaXMgdGhlIGVuZCBvZiB0aGUgc3RvcmFnZSBjaGFpbi5cbiAgICAvLyB1c3VhbGx5IHNxbCBvbiB0aGUgc2VydmVyIHNpZGUgYW5kIHJlc3Qgb24gdGhlIGNsaWVudCBzaWRlLCBpdCAqbXVzdCpcbiAgICAvLyByZWNlaXZlIHRoZSB3cml0ZXMsIGFuZCBpcyB0aGUgZmluYWwgYXV0aG9yaXRhdGl2ZSBhbnN3ZXIgb24gd2hldGhlclxuICAgIC8vIHNvbWV0aGluZyBpcyA0MDQuXG5cbiAgICAvLyB0ZXJtaW5hbCBmYWNpbGl0aWVzIGFyZSBhbHNvIHRoZSBvbmx5IG9uZXMgdGhhdCBjYW4gYXV0aG9yaXRhdGl2ZWx5IGFuc3dlclxuICAgIC8vIGF1dGhvcml6YXRpb24gcXVlc3Rpb25zLCBidXQgdGhlIGRlc2lnbiBtYXkgYWxsb3cgZm9yIGF1dGhvcml6YXRpb24gdG8gYmVcbiAgICAvLyBjYWNoZWQuXG4gICAgdGhpcy50ZXJtaW5hbCA9IG9wdHMudGVybWluYWwgfHwgZmFsc2U7XG4gICAgdGhpc1skZW1pdHRlcl0gPSBuZXcgU3ViamVjdCgpO1xuICB9XG5cbiAgaG90KHR5cGUsIGlkKSB7XG4gICAgLy8gdDogdHlwZSwgaWQ6IGlkIChpbnRlZ2VyKS5cbiAgICAvLyBpZiBob3QsIHRoZW4gY29uc2lkZXIgdGhpcyB2YWx1ZSBhdXRob3JpdGF0aXZlLCBubyBuZWVkIHRvIGdvIGRvd25cbiAgICAvLyB0aGUgZGF0YXN0b3JlIGNoYWluLiBDb25zaWRlciBhIG1lbW9yeXN0b3JhZ2UgdXNlZCBhcyBhIHRvcC1sZXZlbCBjYWNoZS5cbiAgICAvLyBpZiB0aGUgbWVtc3RvcmUgaGFzIHRoZSB2YWx1ZSwgaXQncyBob3QgYW5kIHVwLXRvLWRhdGUuIE9UT0gsIGFcbiAgICAvLyBsb2NhbHN0b3JhZ2UgY2FjaGUgbWF5IGJlIGFuIG91dC1vZi1kYXRlIHZhbHVlICh1cGRhdGVkIHNpbmNlIGxhc3Qgc2VlbilcblxuICAgIC8vIHRoaXMgZGVzaWduIGxldHMgaG90IGJlIHNldCBieSB0eXBlIGFuZCBpZC4gSW4gcGFydGljdWxhciwgdGhlIGdvYWwgZm9yIHRoZVxuICAgIC8vIGZyb250LWVuZCBpcyB0byBoYXZlIHByb2ZpbGUgb2JqZWN0cyBiZSBob3QtY2FjaGVkIGluIHRoZSBtZW1zdG9yZSwgYnV0IG5vdGhpbmdcbiAgICAvLyBlbHNlIChpbiBvcmRlciB0byBub3QgcnVuIHRoZSBicm93c2VyIG91dCBvZiBtZW1vcnkpXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgd3JpdGUodHlwZSwgdmFsdWUpIHtcbiAgICAvLyBpZiB2YWx1ZS5pZCBleGlzdHMsIHRoaXMgaXMgYW4gdXBkYXRlLiBJZiBpdCBkb2Vzbid0LCBpdCBpcyBhblxuICAgIC8vIGluc2VydC4gSW4gdGhlIGNhc2Ugb2YgYW4gdXBkYXRlLCBpdCBzaG91bGQgbWVyZ2UgZG93biB0aGUgdHJlZS5cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignV3JpdGUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgLy8gVE9ETzogd3JpdGUgdGhlIHR3by13YXkgaGFzL2dldCBsb2dpYyBpbnRvIHRoaXMgbWV0aG9kXG4gIC8vIGFuZCBwcm92aWRlIG92ZXJyaWRlIGhvb2tzIGZvciByZWFkT25lIHJlYWRNYW55XG5cbiAgcmVhZCh0eXBlLCBpZCwga2V5ID0gJHNlbGYpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKChrZXkgIT09ICRzZWxmKSAmJiAodHlwZS4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkTWFueSh0eXBlLCBpZCwga2V5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWRPbmUodHlwZSwgaWQpO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ub3RpZnlVcGRhdGUodHlwZSwgaWQsIHJlc3VsdCwga2V5KVxuICAgICAgICAudGhlbigoKSA9PiByZXN1bHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHJlYWRPbmUodHlwZSwgaWQpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignUmVhZE9uZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICByZWFkTWFueSh0eXBlLCBpZCwga2V5KSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ1JlYWRNYW55IG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIGRlbGV0ZSh0eXBlLCBpZCkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdEZWxldGUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgYWRkKHR5cGUsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQsIHZhbGVuY2UgPSB7fSkge1xuICAgIC8vIGFkZCB0byBhIGhhc01hbnkgcmVsYXRpb25zaGlwXG4gICAgLy8gbm90ZSB0aGF0IGhhc01hbnkgZmllbGRzIGNhbiBoYXZlIChpbXBsLXNwZWNpZmljKSB2YWxlbmNlIGRhdGFcbiAgICAvLyBleGFtcGxlOiBtZW1iZXJzaGlwIGJldHdlZW4gcHJvZmlsZSBhbmQgY29tbXVuaXR5IGNhbiBoYXZlIHBlcm0gMSwgMiwgM1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdBZGQgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgcmVtb3ZlKHR5cGUsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQpIHtcbiAgICAvLyByZW1vdmUgZnJvbSBhIGhhc01hbnkgcmVsYXRpb25zaGlwXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ3JlbW92ZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBtb2RpZnlSZWxhdGlvbnNoaXAodHlwZSwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCwgdmFsZW5jZSA9IHt9KSB7XG4gICAgLy8gc2hvdWxkIG1vZGlmeSBhbiBleGlzdGluZyBoYXNNYW55IHZhbGVuY2UgZGF0YS4gVGhyb3cgaWYgbm90IGV4aXN0aW5nLlxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdtb2RpZnlSZWxhdGlvbnNoaXAgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgcXVlcnkocSkge1xuICAgIC8vIHE6IHt0eXBlOiBzdHJpbmcsIHF1ZXJ5OiBhbnl9XG4gICAgLy8gcS5xdWVyeSBpcyBpbXBsIGRlZmluZWQgLSBhIHN0cmluZyBmb3Igc3FsIChyYXcgc3FsKVxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdRdWVyeSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBvblVwZGF0ZShvYnNlcnZlcikge1xuICAgIC8vIG9ic2VydmVyIGZvbGxvd3MgdGhlIFJ4SlMgcGF0dGVybiAtIGl0IGlzIGVpdGhlciBhIGZ1bmN0aW9uIChmb3IgbmV4dCgpKVxuICAgIC8vIG9yIHtuZXh0LCBlcnJvciwgY29tcGxldGV9O1xuICAgIC8vIHJldHVybnMgYW4gdW5zdWIgaG9vayAocmV0VmFsLnVuc3Vic2NyaWJlKCkpXG4gICAgcmV0dXJuIHRoaXNbJGVtaXR0ZXJdLnN1YnNjcmliZShvYnNlcnZlcik7XG4gIH1cblxuICBub3RpZnlVcGRhdGUodHlwZSwgaWQsIHZhbHVlLCBmaWVsZCA9ICRzZWxmKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgIGlmIChmaWVsZCAhPT0gJHNlbGYpIHtcbiAgICAgICAgICBpZiAodmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzWyRlbWl0dGVyXS5uZXh0KHtcbiAgICAgICAgICAgICAgdHlwZSwgaWQsIGZpZWxkLCB2YWx1ZTogdmFsdWVbZmllbGRdLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlYWRNYW55KHR5cGUsIGlkLCBmaWVsZClcbiAgICAgICAgICAgIC50aGVuKChsaXN0KSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzWyRlbWl0dGVyXS5uZXh0KHtcbiAgICAgICAgICAgICAgICB0eXBlLCBpZCwgZmllbGQsIHZhbHVlOiBsaXN0W2ZpZWxkXSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJGVtaXR0ZXJdLm5leHQoe1xuICAgICAgICAgICAgdHlwZSwgaWQsIHZhbHVlLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICQkdGVzdEluZGV4KC4uLmFyZ3MpIHtcbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDEpIHtcbiAgICAgIGlmIChhcmdzWzBdLiRpZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBvcGVyYXRpb24gb24gYW4gdW5zYXZlZCBuZXcgbW9kZWwnKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGFyZ3NbMV1bYXJnc1swXS4kaWRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBvcGVyYXRpb24gb24gYW4gdW5zYXZlZCBuZXcgbW9kZWwnKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vLyBjb252ZW5pZW5jZSBmdW5jdGlvbiB0aGF0IHdhbGtzIGFuIGFycmF5IHJlcGxhY2luZyBhbnkge2lkfSB3aXRoIGNvbnRleHQuaWRcblN0b3JhZ2UubWFzc1JlcGxhY2UgPSBmdW5jdGlvbiBtYXNzUmVwbGFjZShibG9jaywgY29udGV4dCkge1xuICByZXR1cm4gYmxvY2subWFwKCh2KSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodikpIHtcbiAgICAgIHJldHVybiBtYXNzUmVwbGFjZSh2LCBjb250ZXh0KTtcbiAgICB9IGVsc2UgaWYgKCh0eXBlb2YgdiA9PT0gJ3N0cmluZycpICYmICh2Lm1hdGNoKC9eXFx7KC4qKVxcfSQvKSkpIHtcbiAgICAgIHJldHVybiBjb250ZXh0W3YubWF0Y2goL15cXHsoLiopXFx9JC8pWzFdXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHY7XG4gICAgfVxuICB9KTtcbn07XG4iXX0=
