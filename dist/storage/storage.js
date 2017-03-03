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
            return { type: type, id: id, attributes: attributes, relationships: relationships };
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsIiRlbWl0dGVyIiwiU3ltYm9sIiwiU3RvcmFnZSIsIm9wdHMiLCJ0ZXJtaW5hbCIsInR5cGUiLCJpZCIsInZhbHVlIiwicmVqZWN0IiwiRXJyb3IiLCJrZXlzIiwiQXJyYXkiLCJpc0FycmF5IiwicmVhZEF0dHJpYnV0ZXMiLCJ0aGVuIiwiYXR0cmlidXRlcyIsInJlYWRSZWxhdGlvbnNoaXBzIiwicmVsYXRpb25zaGlwcyIsInJlc3VsdCIsIm5vdGlmeVVwZGF0ZSIsImtleSIsInQiLCJmaWx0ZXIiLCJrIiwiJHNjaGVtYSIsIm1hcCIsInJlYWRSZWxhdGlvbnNoaXAiLCJyZWxOYW1lIiwicmVkdWNlIiwidGhlbmFibGVBY2MiLCJ0aGVuYWJsZUN1cnIiLCJhbGwiLCJhY2MiLCJjdXJyIiwicmVzb2x2ZSIsImZpZWxkIiwicmVsYXRpb25zaGlwVGl0bGUiLCJjaGlsZElkIiwiZXh0cmFzIiwicSIsIm9ic2VydmVyIiwic3Vic2NyaWJlIiwidmFsIiwibmV4dCIsImFyZ3MiLCJsZW5ndGgiLCIkaWQiLCJ1bmRlZmluZWQiLCJtYXNzUmVwbGFjZSIsImJsb2NrIiwiY29udGV4dCIsInYiLCJtYXRjaCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O3FqQkFBQTs7QUFFQTs7SUFBWUEsUTs7QUFDWjs7OztBQUNBOztBQUVBOzs7Ozs7OztBQUVBLElBQU1DLFdBQVdDLE9BQU8sVUFBUCxDQUFqQjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0lBRWFDLE8sV0FBQUEsTztBQUVYLHFCQUF1QjtBQUFBLFFBQVhDLElBQVcsdUVBQUosRUFBSTs7QUFBQTs7QUFDckI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsU0FBS0MsUUFBTCxHQUFnQkQsS0FBS0MsUUFBTCxJQUFpQixLQUFqQztBQUNBLFNBQUtKLFFBQUwsSUFBaUIsaUJBQWpCO0FBQ0Q7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O0FBQzdCLGdCQUFNLElBQUl0QyxLQUFKLENBQVUsMkNBQVYsQ0FBTjtBQUNEO0FBQ0YsT0FKRCxNQUlPLElBQUltQyxLQUFLLENBQUwsRUFBUUEsS0FBSyxDQUFMLEVBQVFFLEdBQWhCLE1BQXlCQyxTQUE3QixFQUF3QztBQUM3QyxjQUFNLElBQUl0QyxLQUFKLENBQVUsMkNBQVYsQ0FBTjtBQUNEO0FBQ0Y7Ozs7OztBQUlIOzs7QUFDQVAsUUFBUThDLFdBQVIsR0FBc0IsU0FBU0EsV0FBVCxDQUFxQkMsS0FBckIsRUFBNEJDLE9BQTVCLEVBQXFDO0FBQ3pELFNBQU9ELE1BQU14QixHQUFOLENBQVUsVUFBQzBCLENBQUQsRUFBTztBQUN0QixRQUFJeEMsTUFBTUMsT0FBTixDQUFjdUMsQ0FBZCxDQUFKLEVBQXNCO0FBQ3BCLGFBQU9ILFlBQVlHLENBQVosRUFBZUQsT0FBZixDQUFQO0FBQ0QsS0FGRCxNQUVPLElBQUssT0FBT0MsQ0FBUCxLQUFhLFFBQWQsSUFBNEJBLEVBQUVDLEtBQUYsQ0FBUSxZQUFSLENBQWhDLEVBQXdEO0FBQzdELGFBQU9GLFFBQVFDLEVBQUVDLEtBQUYsQ0FBUSxZQUFSLEVBQXNCLENBQXRCLENBQVIsQ0FBUDtBQUNELEtBRk0sTUFFQTtBQUNMLGFBQU9ELENBQVA7QUFDRDtBQUNGLEdBUk0sQ0FBUDtBQVNELENBVkQiLCJmaWxlIjoic3RvcmFnZS9zdG9yYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50IG5vLXVudXNlZC12YXJzOiAwICovXG5cbmltcG9ydCAqIGFzIEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBtZXJnZU9wdGlvbnMgZnJvbSAnbWVyZ2Utb3B0aW9ucyc7XG5pbXBvcnQgeyBTdWJqZWN0IH0gZnJvbSAncnhqcy9SeCc7XG5cbmltcG9ydCB7ICRzZWxmLCAkYWxsIH0gZnJvbSAnLi4vbW9kZWwnO1xuXG5jb25zdCAkZW1pdHRlciA9IFN5bWJvbCgnJGVtaXR0ZXInKTtcblxuLy8gdHlwZTogYW4gb2JqZWN0IHRoYXQgZGVmaW5lcyB0aGUgdHlwZS4gdHlwaWNhbGx5IHRoaXMgd2lsbCBiZVxuLy8gcGFydCBvZiB0aGUgTW9kZWwgY2xhc3MgaGllcmFyY2h5LCBidXQgU3RvcmFnZSBvYmplY3RzIGNhbGwgbm8gbWV0aG9kc1xuLy8gb24gdGhlIHR5cGUgb2JqZWN0LiBXZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIFR5cGUuJG5hbWUsIFR5cGUuJGlkIGFuZCBUeXBlLiRzY2hlbWEuXG4vLyBOb3RlIHRoYXQgVHlwZS4kaWQgaXMgdGhlICpuYW1lIG9mIHRoZSBpZCBmaWVsZCogb24gaW5zdGFuY2VzXG4vLyAgICBhbmQgTk9UIHRoZSBhY3R1YWwgaWQgZmllbGQgKGUuZy4sIGluIG1vc3QgY2FzZXMsIFR5cGUuJGlkID09PSAnaWQnKS5cbi8vIGlkOiB1bmlxdWUgaWQuIE9mdGVuIGFuIGludGVnZXIsIGJ1dCBub3QgbmVjZXNzYXJ5IChjb3VsZCBiZSBhbiBvaWQpXG5cblxuLy8gaGFzTWFueSByZWxhdGlvbnNoaXBzIGFyZSB0cmVhdGVkIGxpa2UgaWQgYXJyYXlzLiBTbywgYWRkIC8gcmVtb3ZlIC8gaGFzXG4vLyBqdXN0IHN0b3JlcyBhbmQgcmVtb3ZlcyBpbnRlZ2Vycy5cblxuZXhwb3J0IGNsYXNzIFN0b3JhZ2Uge1xuXG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIC8vIGEgXCJ0ZXJtaW5hbFwiIHN0b3JhZ2UgZmFjaWxpdHkgaXMgdGhlIGVuZCBvZiB0aGUgc3RvcmFnZSBjaGFpbi5cbiAgICAvLyB1c3VhbGx5IHNxbCBvbiB0aGUgc2VydmVyIHNpZGUgYW5kIHJlc3Qgb24gdGhlIGNsaWVudCBzaWRlLCBpdCAqbXVzdCpcbiAgICAvLyByZWNlaXZlIHRoZSB3cml0ZXMsIGFuZCBpcyB0aGUgZmluYWwgYXV0aG9yaXRhdGl2ZSBhbnN3ZXIgb24gd2hldGhlclxuICAgIC8vIHNvbWV0aGluZyBpcyA0MDQuXG5cbiAgICAvLyB0ZXJtaW5hbCBmYWNpbGl0aWVzIGFyZSBhbHNvIHRoZSBvbmx5IG9uZXMgdGhhdCBjYW4gYXV0aG9yaXRhdGl2ZWx5IGFuc3dlclxuICAgIC8vIGF1dGhvcml6YXRpb24gcXVlc3Rpb25zLCBidXQgdGhlIGRlc2lnbiBtYXkgYWxsb3cgZm9yIGF1dGhvcml6YXRpb24gdG8gYmVcbiAgICAvLyBjYWNoZWQuXG4gICAgdGhpcy50ZXJtaW5hbCA9IG9wdHMudGVybWluYWwgfHwgZmFsc2U7XG4gICAgdGhpc1skZW1pdHRlcl0gPSBuZXcgU3ViamVjdCgpO1xuICB9XG5cbiAgaG90KHR5cGUsIGlkKSB7XG4gICAgLy8gdDogdHlwZSwgaWQ6IGlkIChpbnRlZ2VyKS5cbiAgICAvLyBpZiBob3QsIHRoZW4gY29uc2lkZXIgdGhpcyB2YWx1ZSBhdXRob3JpdGF0aXZlLCBubyBuZWVkIHRvIGdvIGRvd25cbiAgICAvLyB0aGUgZGF0YXN0b3JlIGNoYWluLiBDb25zaWRlciBhIG1lbW9yeXN0b3JhZ2UgdXNlZCBhcyBhIHRvcC1sZXZlbCBjYWNoZS5cbiAgICAvLyBpZiB0aGUgbWVtc3RvcmUgaGFzIHRoZSB2YWx1ZSwgaXQncyBob3QgYW5kIHVwLXRvLWRhdGUuIE9UT0gsIGFcbiAgICAvLyBsb2NhbHN0b3JhZ2UgY2FjaGUgbWF5IGJlIGFuIG91dC1vZi1kYXRlIHZhbHVlICh1cGRhdGVkIHNpbmNlIGxhc3Qgc2VlbilcblxuICAgIC8vIHRoaXMgZGVzaWduIGxldHMgaG90IGJlIHNldCBieSB0eXBlIGFuZCBpZC4gSW4gcGFydGljdWxhciwgdGhlIGdvYWwgZm9yIHRoZVxuICAgIC8vIGZyb250LWVuZCBpcyB0byBoYXZlIHByb2ZpbGUgb2JqZWN0cyBiZSBob3QtY2FjaGVkIGluIHRoZSBtZW1zdG9yZSwgYnV0IG5vdGhpbmdcbiAgICAvLyBlbHNlIChpbiBvcmRlciB0byBub3QgcnVuIHRoZSBicm93c2VyIG91dCBvZiBtZW1vcnkpXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgd3JpdGUodHlwZSwgdmFsdWUpIHtcbiAgICAvLyBpZiB2YWx1ZS5pZCBleGlzdHMsIHRoaXMgaXMgYW4gdXBkYXRlLiBJZiBpdCBkb2Vzbid0LCBpdCBpcyBhblxuICAgIC8vIGluc2VydC4gSW4gdGhlIGNhc2Ugb2YgYW4gdXBkYXRlLCBpdCBzaG91bGQgbWVyZ2UgZG93biB0aGUgdHJlZS5cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignV3JpdGUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgLy8gVE9ETzogd3JpdGUgdGhlIHR3by13YXkgaGFzL2dldCBsb2dpYyBpbnRvIHRoaXMgbWV0aG9kXG4gIC8vIGFuZCBwcm92aWRlIG92ZXJyaWRlIGhvb2tzIGZvciByZWFkQXR0cmlidXRlcyByZWFkUmVsYXRpb25zaGlwXG5cbiAgcmVhZCh0eXBlLCBpZCwgb3B0cykge1xuICAgIGNvbnN0IGtleXMgPSBvcHRzICYmICFBcnJheS5pc0FycmF5KG9wdHMpID8gW29wdHNdIDogb3B0cztcbiAgICByZXR1cm4gdGhpcy5yZWFkQXR0cmlidXRlcyh0eXBlLCBpZClcbiAgICAudGhlbihhdHRyaWJ1dGVzID0+IHtcbiAgICAgIGlmIChhdHRyaWJ1dGVzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWRSZWxhdGlvbnNoaXBzKHR5cGUsIGlkLCBrZXlzKVxuICAgICAgICAudGhlbihyZWxhdGlvbnNoaXBzID0+IHtcbiAgICAgICAgICByZXR1cm4geyB0eXBlLCBpZCwgYXR0cmlidXRlcywgcmVsYXRpb25zaGlwcyB9O1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ub3RpZnlVcGRhdGUodHlwZSwgaWQsIHJlc3VsdCwga2V5cylcbiAgICAgICAgLnRoZW4oKCkgPT4gcmVzdWx0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZWFkQXR0cmlidXRlcyh0eXBlLCBpZCkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdyZWFkQXR0cmlidXRlcyBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICByZWFkUmVsYXRpb25zaGlwKHR5cGUsIGlkLCBrZXkpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcigncmVhZFJlbGF0aW9uc2hpcCBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICByZWFkUmVsYXRpb25zaGlwcyh0LCBpZCwga2V5LCBhdHRyaWJ1dGVzKSB7XG4gICAgLy8gSWYgdGhlcmUgaXMgbm8ga2V5LCBpdCBkZWZhdWx0cyB0byBhbGwgcmVsYXRpb25zaGlwc1xuICAgIC8vIE90aGVyd2lzZSwgaXQgd3JhcHMgaXQgaW4gYW4gQXJyYXkgaWYgaXQgaXNuJ3QgYWxyZWFkeSBvbmVcbiAgICBjb25zdCBrZXlzID0ga2V5ICYmICFBcnJheS5pc0FycmF5KGtleSkgPyBba2V5XSA6IGtleSB8fCBbXTtcbiAgICByZXR1cm4ga2V5cy5maWx0ZXIoayA9PiBrIGluIHQuJHNjaGVtYS5yZWxhdGlvbnNoaXBzKS5tYXAocmVsTmFtZSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5yZWFkUmVsYXRpb25zaGlwKHQsIGlkLCByZWxOYW1lLCBhdHRyaWJ1dGVzKTtcbiAgICB9KS5yZWR1Y2UoKHRoZW5hYmxlQWNjLCB0aGVuYWJsZUN1cnIpID0+IHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW3RoZW5hYmxlQWNjLCB0aGVuYWJsZUN1cnJdKVxuICAgICAgLnRoZW4oKFthY2MsIGN1cnJdKSA9PiB7XG4gICAgICAgIHJldHVybiBtZXJnZU9wdGlvbnMoYWNjLCBjdXJyKTtcbiAgICAgIH0pO1xuICAgIH0sIEJsdWViaXJkLnJlc29sdmUoe30pKTtcbiAgfVxuXG4gIC8vIHdpcGUgc2hvdWxkIHF1aWV0bHkgZXJhc2UgYSB2YWx1ZSBmcm9tIHRoZSBzdG9yZS4gVGhpcyBpcyB1c2VkIGR1cmluZ1xuICAvLyBjYWNoZSBpbnZhbGlkYXRpb24gZXZlbnRzIHdoZW4gdGhlIGN1cnJlbnQgdmFsdWUgaXMga25vd24gdG8gYmUgaW5jb3JyZWN0LlxuICAvLyBpdCBpcyBub3QgYSBkZWxldGUgKHdoaWNoIGlzIGEgdXNlci1pbml0aWF0ZWQsIGV2ZW50LWNhdXNpbmcgdGhpbmcpLCBidXRcbiAgLy8gc2hvdWxkIHJlc3VsdCBpbiB0aGlzIHZhbHVlIG5vdCBzdG9yZWQgaW4gc3RvcmFnZSBhbnltb3JlLlxuXG4gIHdpcGUodHlwZSwgaWQsIGZpZWxkKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ1dpcGUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgZGVsZXRlKHR5cGUsIGlkKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0RlbGV0ZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBhZGQodHlwZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlLCBjaGlsZElkLCBleHRyYXMgPSB7fSkge1xuICAgIC8vIGFkZCB0byBhIGhhc01hbnkgcmVsYXRpb25zaGlwXG4gICAgLy8gbm90ZSB0aGF0IGhhc01hbnkgZmllbGRzIGNhbiBoYXZlIChpbXBsLXNwZWNpZmljKSB2YWxlbmNlIGRhdGEgKG5vdyByZW5hbWVkIGV4dHJhcylcbiAgICAvLyBleGFtcGxlOiBtZW1iZXJzaGlwIGJldHdlZW4gcHJvZmlsZSBhbmQgY29tbXVuaXR5IGNhbiBoYXZlIHBlcm0gMSwgMiwgM1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdBZGQgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgcmVtb3ZlKHR5cGUsIGlkLCByZWxhdGlvbnNoaXBUaXRsZSwgY2hpbGRJZCkge1xuICAgIC8vIHJlbW92ZSBmcm9tIGEgaGFzTWFueSByZWxhdGlvbnNoaXBcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcigncmVtb3ZlIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIG1vZGlmeVJlbGF0aW9uc2hpcCh0eXBlLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUsIGNoaWxkSWQsIGV4dHJhcyA9IHt9KSB7XG4gICAgLy8gc2hvdWxkIG1vZGlmeSBhbiBleGlzdGluZyBoYXNNYW55IHZhbGVuY2UgZGF0YS4gVGhyb3cgaWYgbm90IGV4aXN0aW5nLlxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdtb2RpZnlSZWxhdGlvbnNoaXAgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgcXVlcnkocSkge1xuICAgIC8vIHE6IHt0eXBlOiBzdHJpbmcsIHF1ZXJ5OiBhbnl9XG4gICAgLy8gcS5xdWVyeSBpcyBpbXBsIGRlZmluZWQgLSBhIHN0cmluZyBmb3Igc3FsIChyYXcgc3FsKVxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdRdWVyeSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBvblVwZGF0ZShvYnNlcnZlcikge1xuICAgIC8vIG9ic2VydmVyIGZvbGxvd3MgdGhlIFJ4SlMgcGF0dGVybiAtIGl0IGlzIGVpdGhlciBhIGZ1bmN0aW9uIChmb3IgbmV4dCgpKVxuICAgIC8vIG9yIHtuZXh0LCBlcnJvciwgY29tcGxldGV9O1xuICAgIC8vIHJldHVybnMgYW4gdW5zdWIgaG9vayAocmV0VmFsLnVuc3Vic2NyaWJlKCkpXG4gICAgcmV0dXJuIHRoaXNbJGVtaXR0ZXJdLnN1YnNjcmliZShvYnNlcnZlcik7XG4gIH1cblxuICBub3RpZnlVcGRhdGUodHlwZSwgaWQsIHZhbHVlLCBvcHRzID0gWydhdHRyaWJ1dGVzJ10pIHtcbiAgICBjb25zdCBrZXlzID0gQXJyYXkuaXNBcnJheShvcHRzKSA/IG9wdHMgOiBbb3B0c107XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChrZXlzLm1hcCgoZmllbGQpID0+IHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgICBpZiAoZmllbGQgPT09ICdhdHRyaWJ1dGVzJykge1xuICAgICAgICAgICAgcmV0dXJuIGZpZWxkIGluIHZhbHVlID8gQmx1ZWJpcmQucmVzb2x2ZSh2YWx1ZVtmaWVsZF0pIDogdGhpcy5yZWFkQXR0cmlidXRlcyh0eXBlLCBpZCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5yZWxhdGlvbnNoaXBzICYmIGZpZWxkIGluIHZhbHVlLnJlbGF0aW9uc2hpcHMpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1sb25lbHktaWZcbiAgICAgICAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUodmFsdWUucmVsYXRpb25zaGlwc1tmaWVsZF0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVhZFJlbGF0aW9uc2hpcCh0eXBlLCBpZCwgZmllbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfSkudGhlbigodmFsKSA9PiB7XG4gICAgICAgIGlmICh2YWwpIHtcbiAgICAgICAgICB0aGlzWyRlbWl0dGVyXS5uZXh0KHtcbiAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICBpZCxcbiAgICAgICAgICAgIHZhbHVlOiB2YWwsXG4gICAgICAgICAgICBmaWVsZCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0pO1xuICAgIH0pKTtcbiAgfVxuXG4gICQkdGVzdEluZGV4KC4uLmFyZ3MpIHtcbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDEpIHtcbiAgICAgIGlmIChhcmdzWzBdLiRpZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBvcGVyYXRpb24gb24gYW4gdW5zYXZlZCBuZXcgbW9kZWwnKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGFyZ3NbMV1bYXJnc1swXS4kaWRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBvcGVyYXRpb24gb24gYW4gdW5zYXZlZCBuZXcgbW9kZWwnKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vLyBjb252ZW5pZW5jZSBmdW5jdGlvbiB0aGF0IHdhbGtzIGFuIGFycmF5IHJlcGxhY2luZyBhbnkge2lkfSB3aXRoIGNvbnRleHQuaWRcblN0b3JhZ2UubWFzc1JlcGxhY2UgPSBmdW5jdGlvbiBtYXNzUmVwbGFjZShibG9jaywgY29udGV4dCkge1xuICByZXR1cm4gYmxvY2subWFwKCh2KSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodikpIHtcbiAgICAgIHJldHVybiBtYXNzUmVwbGFjZSh2LCBjb250ZXh0KTtcbiAgICB9IGVsc2UgaWYgKCh0eXBlb2YgdiA9PT0gJ3N0cmluZycpICYmICh2Lm1hdGNoKC9eXFx7KC4qKVxcfSQvKSkpIHtcbiAgICAgIHJldHVybiBjb250ZXh0W3YubWF0Y2goL15cXHsoLiopXFx9JC8pWzFdXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHY7XG4gICAgfVxuICB9KTtcbn07XG4iXX0=
