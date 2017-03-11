'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Storage = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* eslint no-unused-vars: 0 */

var _bluebird = require('bluebird');

var Bluebird = _interopRequireWildcard(_bluebird);

var _mergeOptions = require('merge-options');

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _Rx = require('rxjs/Rx');

var _model = require('../model');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $emitter = Symbol('$emitter');

// type: an object that defines the type. typically this will be
// part of the Model class hierarchy, but Storage objects call no methods
// on the type object. We only are interested in Type.$name, Type.$id and Type.$schema.
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
    // and provide override hooks for readAttributes readRelationship

  }, {
    key: 'read',
    value: function read(type, id, opts) {
      var _this = this;

      var keys = opts && !Array.isArray(opts) ? [opts] : opts;
      return this.readAttributes(type, id).then(function (attributes) {
        if (attributes) {
          return _this.readRelationships(type, id, keys).then(function (relationships) {
            return {
              type: type.$name,
              id: id,
              attributes: attributes,
              relationships: relationships
            };
          });
        } else {
          return null;
        }
      }).then(function (result) {
        if (result) {
          return _this.notifyUpdate(type, id, result, keys).then(function () {
            return result;
          });
        } else {
          return result;
        }
      });
    }
  }, {
    key: 'bulkRead',
    value: function bulkRead(type, id) {
      // override this if you want to do any special pre-processing
      // for reading from the store prior to a REST service event
      return this.read(type, id).then(function (data) {
        return { data: data, included: [] };
      });
    }
  }, {
    key: 'readAttributes',
    value: function readAttributes(type, id) {
      return Bluebird.reject(new Error('readAttributes not implemented'));
    }
  }, {
    key: 'readRelationship',
    value: function readRelationship(type, id, key) {
      return Bluebird.reject(new Error('readRelationship not implemented'));
    }
  }, {
    key: 'readRelationships',
    value: function readRelationships(t, id, key, attributes) {
      var _this2 = this;

      // If there is no key, it defaults to all relationships
      // Otherwise, it wraps it in an Array if it isn't already one
      var keys = key && !Array.isArray(key) ? [key] : key || [];
      return keys.filter(function (k) {
        return k in t.$schema.relationships;
      }).map(function (relName) {
        return _this2.readRelationship(t, id, relName, attributes);
      }).reduce(function (thenableAcc, thenableCurr) {
        return Bluebird.all([thenableAcc, thenableCurr]).then(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2),
              acc = _ref2[0],
              curr = _ref2[1];

          return (0, _mergeOptions2.default)(acc, curr);
        });
      }, Bluebird.resolve({}));
    }

    // wipe should quietly erase a value from the store. This is used during
    // cache invalidation events when the current value is known to be incorrect.
    // it is not a delete (which is a user-initiated, event-causing thing), but
    // should result in this value not stored in storage anymore.

  }, {
    key: 'wipe',
    value: function wipe(type, id, field) {
      return Bluebird.reject(new Error('Wipe not implemented'));
    }
  }, {
    key: 'delete',
    value: function _delete(type, id) {
      return Bluebird.reject(new Error('Delete not implemented'));
    }
  }, {
    key: 'add',
    value: function add(type, id, relationshipTitle, childId) {
      var extras = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

      // add to a hasMany relationship
      // note that hasMany fields can have (impl-specific) valence data (now renamed extras)
      // example: membership between profile and community can have perm 1, 2, 3
      return Bluebird.reject(new Error('Add not implemented'));
    }
  }, {
    key: 'remove',
    value: function remove(type, id, relationshipTitle, childId) {
      // remove from a hasMany relationship
      return Bluebird.reject(new Error('remove not implemented'));
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(type, id, relationshipTitle, childId) {
      var extras = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

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
      var _this3 = this;

      var opts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : ['attributes'];

      var keys = Array.isArray(opts) ? opts : [opts];
      return Bluebird.all(keys.map(function (field) {
        return Bluebird.resolve().then(function () {
          if (_this3.terminal) {
            if (field === 'attributes') {
              return field in value ? Bluebird.resolve(value[field]) : _this3.readAttributes(type, id);
            } else {
              if (value && value.relationships && field in value.relationships) {
                // eslint-disable-line no-lonely-if
                return Bluebird.resolve(value.relationships[field]);
              } else {
                return _this3.readRelationship(type, id, field);
              }
            }
          } else {
            return null;
          }
        }).then(function (val) {
          if (val) {
            _this3[$emitter].next({
              type: type,
              id: id,
              value: val,
              field: field
            });
          }
          return null;
        });
      }));
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsIiRlbWl0dGVyIiwiU3ltYm9sIiwiU3RvcmFnZSIsIm9wdHMiLCJ0ZXJtaW5hbCIsInR5cGUiLCJpZCIsInZhbHVlIiwicmVqZWN0IiwiRXJyb3IiLCJrZXlzIiwiQXJyYXkiLCJpc0FycmF5IiwicmVhZEF0dHJpYnV0ZXMiLCJ0aGVuIiwiYXR0cmlidXRlcyIsInJlYWRSZWxhdGlvbnNoaXBzIiwiJG5hbWUiLCJyZWxhdGlvbnNoaXBzIiwicmVzdWx0Iiwibm90aWZ5VXBkYXRlIiwicmVhZCIsImRhdGEiLCJpbmNsdWRlZCIsImtleSIsInQiLCJmaWx0ZXIiLCJrIiwiJHNjaGVtYSIsIm1hcCIsInJlYWRSZWxhdGlvbnNoaXAiLCJyZWxOYW1lIiwicmVkdWNlIiwidGhlbmFibGVBY2MiLCJ0aGVuYWJsZUN1cnIiLCJhbGwiLCJhY2MiLCJjdXJyIiwicmVzb2x2ZSIsImZpZWxkIiwicmVsYXRpb25zaGlwVGl0bGUiLCJjaGlsZElkIiwiZXh0cmFzIiwicSIsIm9ic2VydmVyIiwic3Vic2NyaWJlIiwidmFsIiwibmV4dCIsImFyZ3MiLCJsZW5ndGgiLCIkaWQiLCJ1bmRlZmluZWQiLCJtYXNzUmVwbGFjZSIsImJsb2NrIiwiY29udGV4dCIsInYiLCJtYXRjaCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O3FqQkFBQTs7QUFFQTs7SUFBWUEsUTs7QUFDWjs7OztBQUNBOztBQUVBOzs7Ozs7OztBQUVBLElBQU1DLFdBQVdDLE9BQU8sVUFBUCxDQUFqQjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0lBRWFDLE8sV0FBQUEsTztBQUVYLHFCQUF1QjtBQUFBLFFBQVhDLElBQVcsdUVBQUosRUFBSTs7QUFBQTs7QUFDckI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsU0FBS0MsUUFBTCxHQUFnQkQsS0FBS0MsUUFBTCxJQUFpQixLQUFqQztB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YXJzOiAwICovXG5cbmltcG9ydCAqIGFzIEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBtZXJnZU9wdGlvbnMgZnJvbSAnbWVyZ2Utb3B0aW9ucyc7XG5pbXBvcnQgeyBTdWJqZWN0IH0gZnJvbSAncnhqcy9SeCc7XG5cbmltcG9ydCB7ICRzZWxmLCAkYWxsIH0gZnJvbSAnLi4vbW9kZWwnO1xuXG5jb25zdCAkZW1pdHRlciA9IFN5bWJvbCgnJGVtaXR0ZXInKTtcblxuLy8gdHlwZTogYW4gb2JqZWN0IHRoYXQgZGVmaW5lcyB0aGUgdHlwZS4gdHlwaWNhbGx5IHRoaXMgd2lsbCBiZVxuLy8gcGFydCBvZiB0aGUgTW9kZWwgY2xhc3MgaGllcmFyY2h5LCBidXQgU3RvcmFnZSBvYmplY3RzIGNhbGwgbm8gbWV0aG9kc1xuLy8gb24gdGhlIHR5cGUgb2JqZWN0LiBXZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIFR5cGUuJG5hbWUsIFR5cGUuJGlkIGFuZCBUeXBlLiRzY2hlbWEuXG4vLyBOb3RlIHRoYXQgVHlwZS4kaWQgaXMgdGhlICpuYW1lIG9mIHRoZSBpZCBmaWVsZCogb24gaW5zdGFuY2VzXG4vLyAgICBhbmQgTk9UIHRoZSBhY3R1YWwgaWQgZmllbGQgKGUuZy4sIGluIG1vc3QgY2FzZXMsIFR5cGUuJGlkID09PSAnaWQnKS5cbi8vIGlkOiB1bmlxdWUgaWQuIE9mdGVuIGFuIGludGVnZXIsIGJ1dCBub3QgbmVjZXNzYXJ5IChjb3VsZCBiZSBhbiBvaWQpXG5cblxuLy8gaGFzTWFueSByZWxhdGlvbnNoaXBzIGFyZSB0cmVhdGVkIGxpa2UgaWQgYXJyYXlzLiBTbywgYWRkIC8gcmVtb3ZlIC8gaGFzXG4vLyBqdXN0IHN0b3JlcyBhbmQgcmVtb3ZlcyBpbnRlZ2Vycy5cblxuZXhwb3J0IGNsYXNzIFN0b3JhZ2Uge1xuXG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIC8vIGEgXCJ0ZXJtaW5hbFwiIHN0b3JhZ2UgZmFjaWxpdHkgaXMgdGhlIGVuZCBvZiB0aGUgc3RvcmFnZSBjaGFpbi5cbiAgICAvLyB1c3VhbGx5IHNxbCBvbiB0aGUgc2VydmVyIHNpZGUgYW5kIHJlc3Qgb24gdGhlIGNsaWVudCBzaWRlLCBpdCAqbXVzdCpcbiAgICAvLyByZWNlaXZlIHRoZSB3cml0ZXMsIGFuZCBpcyB0aGUgZmluYWwgYXV0aG9yaXRhdGl2ZSBhbnN3ZXIgb24gd2hldGhlclxuICAgIC8vIHNvbWV0aGluZyBpcyA0MDQuXG5cbiAgICAvLyB0ZXJtaW5hbCBmYWNpbGl0aWVzIGFyZSBhbHNvIHRoZSBvbmx5IG9uZXMgdGhhdCBjYW4gYXV0aG9yaXRhdGl2ZWx5IGFuc3dlclxuICAgIC8vIGF1dGhvcml6YXRpb24gcXVlc3Rpb25zLCBidXQgdGhlIGRlc2lnbiBtYXkgYWxsb3cgZm9yIGF1dGhvcml6YXRpb24gdG8gYmVcbiAgICAvLyBjYWNoZWQuXG4gICAgdGhpcy50ZXJtaW5hbCA9IG9wdHMudGVybWluYWwgfHwgZmFsc2U7XG4gICAgdGhpc1skZW1pdHRlcl0gPSBuZXcgU3ViamVjdCgpO1xuICB9XG5cbiAgaG90KHR5cGUsIGlkKSB7XG4gICAgLy8gdDogdHlwZSwgaWQ6IGlkIChpbnRlZ2VyKS5cbiAgICAvLyBpZiBob3QsIHRoZW4gY29uc2lkZXIgdGhpcyB2YWx1ZSBhdXRob3JpdGF0aXZlLCBubyBuZWVkIHRvIGdvIGRvd25cbiAgICAvLyB0aGUgZGF0YXN0b3JlIGNoYWluLiBDb25zaWRlciBhIG1lbW9yeXN0b3JhZ2UgdXNlZCBhcyBhIHRvcC1sZXZlbCBjYWNoZS5cbiAgICAvLyBpZiB0aGUgbWVtc3RvcmUgaGFzIHRoZSB2YWx1ZSwgaXQncyBob3QgYW5kIHVwLXRvLWRhdGUuIE9UT0gsIGFcbiAgICAvLyBsb2NhbHN0b3JhZ2UgY2FjaGUgbWF5IGJlIGFuIG91dC1vZi1kYXRlIHZhbHVlICh1cGRhdGVkIHNpbmNlIGxhc3Qgc2VlbilcblxuICAgIC8vIHRoaXMgZGVzaWduIGxldHMgaG90IGJlIHNldCBieSB0eXBlIGFuZCBpZC4gSW4gcGFydGljdWxhciwgdGhlIGdvYWwgZm9yIHRoZVxuICAgIC8vIGZyb250LWVuZCBpcyB0byBoYXZlIHByb2ZpbGUgb2JqZWN0cyBiZSBob3QtY2FjaGVkIGluIHRoZSBtZW1zdG9yZSwgYnV0IG5vdGhpbmdcbiAgICAvLyBlbHNlIChpbiBvcmRlciB0byBub3QgcnVuIHRoZSBicm93c2VyIG91dCBvZiBtZW1vcnkpXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgd3JpdGUodHlwZSwgdmFsdWUpIHtcbiAgICAvLyBpZiB2YWx1ZS5pZCBleGlzdHMsIHRoaXMgaXMgYW4gdXBkYXRlLiBJZiBpdCBkb2Vzbid0LCBpdCBpcyBhblxuICAgIC8vIGluc2VydC4gSW4gdGhlIGNhc2Ugb2YgYW4gdXBkYXRlLCBpdCBzaG91bGQgbWVyZ2UgZG93biB0aGUgdHJlZS5cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignV3JpdGUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgLy8gVE9ETzogd3JpdGUgdGhlIHR3by13YXkgaGFzL2dldCBsb2dpYyBpbnRvIHRoaXMgbWV0aG9kXG4gIC8vIGFuZCBwcm92aWRlIG92ZXJyaWRlIGhvb2tzIGZvciByZWFkQXR0cmlidXRlcyByZWFkUmVsYXRpb25zaGlwXG5cbiAgcmVhZCh0eXBlLCBpZCwgb3B0cykge1xuICAgIGNvbnN0IGtleXMgPSBvcHRzICYmICFBcnJheS5pc0FycmF5KG9wdHMpID8gW29wdHNdIDogb3B0cztcbiAgICByZXR1cm4gdGhpcy5yZWFkQXR0cmlidXRlcyh0eXBlLCBpZClcbiAgICAudGhlbihhdHRyaWJ1dGVzID0+IHtcbiAgICAgIGlmIChhdHRyaWJ1dGVzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWRSZWxhdGlvbnNoaXBzKHR5cGUsIGlkLCBrZXlzKVxuICAgICAgICAudGhlbihyZWxhdGlvbnNoaXBzID0+IHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogdHlwZS4kbmFtZSxcbiAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IGF0dHJpYnV0ZXMsXG4gICAgICAgICAgICByZWxhdGlvbnNoaXBzOiByZWxhdGlvbnNoaXBzLFxuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSkudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBpZCwgcmVzdWx0LCBrZXlzKVxuICAgICAgICAudGhlbigoKSA9PiByZXN1bHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGJ1bGtSZWFkKHR5cGUsIGlkKSB7XG4gICAgLy8gb3ZlcnJpZGUgdGhpcyBpZiB5b3Ugd2FudCB0byBkbyBhbnkgc3BlY2lhbCBwcmUtcHJvY2Vzc2luZ1xuICAgIC8vIGZvciByZWFkaW5nIGZyb20gdGhlIHN0b3JlIHByaW9yIHRvIGEgUkVTVCBzZXJ2aWNlIGV2ZW50XG4gICAgcmV0dXJuIHRoaXMucmVhZCh0eXBlLCBpZCkudGhlbihkYXRhID0+IHtcbiAgICAgIHJldHVybiB7IGRhdGEsIGluY2x1ZGVkOiBbXSB9O1xuICAgIH0pO1xuICB9XG5cbiAgcmVhZEF0dHJpYnV0ZXModHlwZSwgaWQpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcigncmVhZEF0dHJpYnV0ZXMgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgcmVhZFJlbGF0aW9uc2hpcCh0eXBlLCBpZCwga2V5KSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ3JlYWRSZWxhdGlvbnNoaXAgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgcmVhZFJlbGF0aW9uc2hpcHModCwgaWQsIGtleSwgYXR0cmlidXRlcykge1xuICAgIC8vIElmIHRoZXJlIGlzIG5vIGtleSwgaXQgZGVmYXVsdHMgdG8gYWxsIHJlbGF0aW9uc2hpcHNcbiAgICAvLyBPdGhlcndpc2UsIGl0IHdyYXBzIGl0IGluIGFuIEFycmF5IGlmIGl0IGlzbid0IGFscmVhZHkgb25lXG4gICAgY29uc3Qga2V5cyA9IGtleSAmJiAhQXJyYXkuaXNBcnJheShrZXkpID8gW2tleV0gOiBrZXkgfHwgW107XG4gICAgcmV0dXJuIGtleXMuZmlsdGVyKGsgPT4gayBpbiB0LiRzY2hlbWEucmVsYXRpb25zaGlwcykubWFwKHJlbE5hbWUgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMucmVhZFJlbGF0aW9uc2hpcCh0LCBpZCwgcmVsTmFtZSwgYXR0cmlidXRlcyk7XG4gICAgfSkucmVkdWNlKCh0aGVuYWJsZUFjYywgdGhlbmFibGVDdXJyKSA9PiB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFt0aGVuYWJsZUFjYywgdGhlbmFibGVDdXJyXSlcbiAgICAgIC50aGVuKChbYWNjLCBjdXJyXSkgPT4ge1xuICAgICAgICByZXR1cm4gbWVyZ2VPcHRpb25zKGFjYywgY3Vycik7XG4gICAgICB9KTtcbiAgICB9LCBCbHVlYmlyZC5yZXNvbHZlKHt9KSk7XG4gIH1cblxuICAvLyB3aXBlIHNob3VsZCBxdWlldGx5IGVyYXNlIGEgdmFsdWUgZnJvbSB0aGUgc3RvcmUuIFRoaXMgaXMgdXNlZCBkdXJpbmdcbiAgLy8gY2FjaGUgaW52YWxpZGF0aW9uIGV2ZW50cyB3aGVuIHRoZSBjdXJyZW50IHZhbHVlIGlzIGtub3duIHRvIGJlIGluY29ycmVjdC5cbiAgLy8gaXQgaXMgbm90IGEgZGVsZXRlICh3aGljaCBpcyBhIHVzZXItaW5pdGlhdGVkLCBldmVudC1jYXVzaW5nIHRoaW5nKSwgYnV0XG4gIC8vIHNob3VsZCByZXN1bHQgaW4gdGhpcyB2YWx1ZSBub3Qgc3RvcmVkIGluIHN0b3JhZ2UgYW55bW9yZS5cblxuICB3aXBlKHR5cGUsIGlkLCBmaWVsZCkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdXaXBlIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIGRlbGV0ZSh0eXBlLCBpZCkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdEZWxldGUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgYWRkKHR5cGUsIGlkLCByZWxhdGlvbnNoaXBUaXRsZSwgY2hpbGRJZCwgZXh0cmFzID0ge30pIHtcbiAgICAvLyBhZGQgdG8gYSBoYXNNYW55IHJlbGF0aW9uc2hpcFxuICAgIC8vIG5vdGUgdGhhdCBoYXNNYW55IGZpZWxkcyBjYW4gaGF2ZSAoaW1wbC1zcGVjaWZpYykgdmFsZW5jZSBkYXRhIChub3cgcmVuYW1lZCBleHRyYXMpXG4gICAgLy8gZXhhbXBsZTogbWVtYmVyc2hpcCBiZXR3ZWVuIHByb2ZpbGUgYW5kIGNvbW11bml0eSBjYW4gaGF2ZSBwZXJtIDEsIDIsIDNcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignQWRkIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHJlbW92ZSh0eXBlLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUsIGNoaWxkSWQpIHtcbiAgICAvLyByZW1vdmUgZnJvbSBhIGhhc01hbnkgcmVsYXRpb25zaGlwXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ3JlbW92ZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBtb2RpZnlSZWxhdGlvbnNoaXAodHlwZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlLCBjaGlsZElkLCBleHRyYXMgPSB7fSkge1xuICAgIC8vIHNob3VsZCBtb2RpZnkgYW4gZXhpc3RpbmcgaGFzTWFueSB2YWxlbmNlIGRhdGEuIFRocm93IGlmIG5vdCBleGlzdGluZy5cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignbW9kaWZ5UmVsYXRpb25zaGlwIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHF1ZXJ5KHEpIHtcbiAgICAvLyBxOiB7dHlwZTogc3RyaW5nLCBxdWVyeTogYW55fVxuICAgIC8vIHEucXVlcnkgaXMgaW1wbCBkZWZpbmVkIC0gYSBzdHJpbmcgZm9yIHNxbCAocmF3IHNxbClcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignUXVlcnkgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgb25VcGRhdGUob2JzZXJ2ZXIpIHtcbiAgICAvLyBvYnNlcnZlciBmb2xsb3dzIHRoZSBSeEpTIHBhdHRlcm4gLSBpdCBpcyBlaXRoZXIgYSBmdW5jdGlvbiAoZm9yIG5leHQoKSlcbiAgICAvLyBvciB7bmV4dCwgZXJyb3IsIGNvbXBsZXRlfTtcbiAgICAvLyByZXR1cm5zIGFuIHVuc3ViIGhvb2sgKHJldFZhbC51bnN1YnNjcmliZSgpKVxuICAgIHJldHVybiB0aGlzWyRlbWl0dGVyXS5zdWJzY3JpYmUob2JzZXJ2ZXIpO1xuICB9XG5cbiAgbm90aWZ5VXBkYXRlKHR5cGUsIGlkLCB2YWx1ZSwgb3B0cyA9IFsnYXR0cmlidXRlcyddKSB7XG4gICAgY29uc3Qga2V5cyA9IEFycmF5LmlzQXJyYXkob3B0cykgPyBvcHRzIDogW29wdHNdO1xuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoa2V5cy5tYXAoKGZpZWxkKSA9PiB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgICAgaWYgKGZpZWxkID09PSAnYXR0cmlidXRlcycpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWVsZCBpbiB2YWx1ZSA/IEJsdWViaXJkLnJlc29sdmUodmFsdWVbZmllbGRdKSA6IHRoaXMucmVhZEF0dHJpYnV0ZXModHlwZSwgaWQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWUucmVsYXRpb25zaGlwcyAmJiBmaWVsZCBpbiB2YWx1ZS5yZWxhdGlvbnNoaXBzKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbG9uZWx5LWlmXG4gICAgICAgICAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHZhbHVlLnJlbGF0aW9uc2hpcHNbZmllbGRdKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlYWRSZWxhdGlvbnNoaXAodHlwZSwgaWQsIGZpZWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0pLnRoZW4oKHZhbCkgPT4ge1xuICAgICAgICBpZiAodmFsKSB7XG4gICAgICAgICAgdGhpc1skZW1pdHRlcl0ubmV4dCh7XG4gICAgICAgICAgICB0eXBlLFxuICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICB2YWx1ZTogdmFsLFxuICAgICAgICAgICAgZmllbGQsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9KTtcbiAgICB9KSk7XG4gIH1cblxuICAkJHRlc3RJbmRleCguLi5hcmdzKSB7XG4gICAgaWYgKGFyZ3MubGVuZ3RoID09PSAxKSB7XG4gICAgICBpZiAoYXJnc1swXS4kaWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lsbGVnYWwgb3BlcmF0aW9uIG9uIGFuIHVuc2F2ZWQgbmV3IG1vZGVsJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChhcmdzWzFdW2FyZ3NbMF0uJGlkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lsbGVnYWwgb3BlcmF0aW9uIG9uIGFuIHVuc2F2ZWQgbmV3IG1vZGVsJyk7XG4gICAgfVxuICB9XG59XG5cblxuLy8gY29udmVuaWVuY2UgZnVuY3Rpb24gdGhhdCB3YWxrcyBhbiBhcnJheSByZXBsYWNpbmcgYW55IHtpZH0gd2l0aCBjb250ZXh0LmlkXG5TdG9yYWdlLm1hc3NSZXBsYWNlID0gZnVuY3Rpb24gbWFzc1JlcGxhY2UoYmxvY2ssIGNvbnRleHQpIHtcbiAgcmV0dXJuIGJsb2NrLm1hcCgodikgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHYpKSB7XG4gICAgICByZXR1cm4gbWFzc1JlcGxhY2UodiwgY29udGV4dCk7XG4gICAgfSBlbHNlIGlmICgodHlwZW9mIHYgPT09ICdzdHJpbmcnKSAmJiAodi5tYXRjaCgvXlxceyguKilcXH0kLykpKSB7XG4gICAgICByZXR1cm4gY29udGV4dFt2Lm1hdGNoKC9eXFx7KC4qKVxcfSQvKVsxXV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB2O1xuICAgIH1cbiAgfSk7XG59O1xuIl19
