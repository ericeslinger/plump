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
            return (0, _mergeOptions2.default)({
              type: type.$name,
              id: id,
              attributes: {},
              relationships: {}
            }, attributes, relationships);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsIiRlbWl0dGVyIiwiU3ltYm9sIiwiU3RvcmFnZSIsIm9wdHMiLCJ0ZXJtaW5hbCIsInR5cGUiLCJpZCIsInZhbHVlIiwicmVqZWN0IiwiRXJyb3IiLCJrZXlzIiwiQXJyYXkiLCJpc0FycmF5IiwicmVhZEF0dHJpYnV0ZXMiLCJ0aGVuIiwiYXR0cmlidXRlcyIsInJlYWRSZWxhdGlvbnNoaXBzIiwiJG5hbWUiLCJyZWxhdGlvbnNoaXBzIiwicmVzdWx0Iiwibm90aWZ5VXBkYXRlIiwia2V5IiwidCIsImZpbHRlciIsImsiLCIkc2NoZW1hIiwibWFwIiwicmVhZFJlbGF0aW9uc2hpcCIsInJlbE5hbWUiLCJyZWR1Y2UiLCJ0aGVuYWJsZUFjYyIsInRoZW5hYmxlQ3VyciIsImFsbCIsImFjYyIsImN1cnIiLCJyZXNvbHZlIiwiZmllbGQiLCJyZWxhdGlvbnNoaXBUaXRsZSIsImNoaWxkSWQiLCJleHRyYXMiLCJxIiwib2JzZXJ2ZXIiLCJzdWJzY3JpYmUiLCJ2YWwiLCJuZXh0IiwiYXJncyIsImxlbmd0aCIsIiRpZCIsInVuZGVmaW5lZCIsIm1hc3NSZXBsYWNlIiwiYmxvY2siLCJjb250ZXh0IiwidiIsIm1hdGNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7cWpCQUFBOztBQUVBOztJQUFZQSxROztBQUNaOzs7O0FBQ0E7O0FBRUE7Ozs7Ozs7O0FBRUEsSUFBTUMsV0FBV0MsT0FBTyxVQUFQLENBQWpCOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7SUFFYUMsTyxXQUFBQSxPO0FBRVgscUJBQXVCO0FBQUEsUUFBWEMsSUFBVyx1RUFBSixFQUFJOztBQUFBOztBQUNyQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxTQUFLQyxRQUFMLEdBQWdCRCxLQUFLQyxRQUFMLElBQWlCLEtBQWpDO0FBQ0EsU0FBS0osUUFBTCxJQUFpQixpQkFB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S0FBS0MsTUFBTCxLQUFnQixDQUFwQixFQUF1QjtBQUNyQixZQUFJRCxLQUFLLENBQUwsRUFBUUUsR0FBUixLQUFnQkMsU0FBcEIsRUFBK0I7QUFDN0IsZ0JBQU0sSUFBSXZDLEtBQUosQ0FBVSwyQ0FBVixDQUFOO0FBQ0Q7QUFDRixPQUpELE1BSU8sSUFBSW9DLEtBQUssQ0FBTCxFQUFRQSxLQUFLLENBQUwsRUFBUUUsR0FBaEIsTUFBeUJDLFNBQTdCLEVBQXdDO0FBQzdDLGNBQU0sSUFBSXZDLEtBQUosQ0FBVSwyQ0FBVixDQUFOO0FBQ0Q7QUFDRjs7Ozs7O0FBSUg7OztBQUNBUCxRQUFRK0MsV0FBUixHQUFzQixTQUFTQSxXQUFULENBQXFCQyxLQUFyQixFQUE0QkMsT0FBNUIsRUFBcUM7QUFDekQsU0FBT0QsTUFBTXhCLEdBQU4sQ0FBVSxVQUFDMEIsQ0FBRCxFQUFPO0FBQ3RCLFFBQUl6QyxNQUFNQyxPQUFOLENBQWN3QyxDQUFkLENBQUosRUFBc0I7QUFDcEIsYUFBT0gsWUFBWUcsQ0FBWixFQUFlRCxPQUFmLENBQVA7QUFDRCxLQUZELE1BRU8sSUFBSyxPQUFPQyxDQUFQLEtBQWEsUUFBZCxJQUE0QkEsRUFBRUMsS0FBRixDQUFRLFlBQVIsQ0FBaEMsRUFBd0Q7QUFDN0QsYUFBT0YsUUFBUUMsRUFBRUMsS0FBRixDQUFRLFlBQVIsRUFBc0IsQ0FBdEIsQ0FBUixDQUFQO0FBQ0QsS0FGTSxNQUVBO0FBQ0wsYUFBT0QsQ0FBUDtBQUNEO0FBQ0YsR0FSTSxDQUFQO0FBU0QsQ0FWRCIsImZpbGUiOiJzdG9yYWdlL3N0b3JhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQgbm8tdW51c2VkLXZhcnM6IDAgKi9cblxuaW1wb3J0ICogYXMgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcbmltcG9ydCB7IFN1YmplY3QgfSBmcm9tICdyeGpzL1J4JztcblxuaW1wb3J0IHsgJHNlbGYsICRhbGwgfSBmcm9tICcuLi9tb2RlbCc7XG5cbmNvbnN0ICRlbWl0dGVyID0gU3ltYm9sKCckZW1pdHRlcicpO1xuXG4vLyB0eXBlOiBhbiBvYmplY3QgdGhhdCBkZWZpbmVzIHRoZSB0eXBlLiB0eXBpY2FsbHkgdGhpcyB3aWxsIGJlXG4vLyBwYXJ0IG9mIHRoZSBNb2RlbCBjbGFzcyBoaWVyYXJjaHksIGJ1dCBTdG9yYWdlIG9iamVjdHMgY2FsbCBubyBtZXRob2RzXG4vLyBvbiB0aGUgdHlwZSBvYmplY3QuIFdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gVHlwZS4kbmFtZSwgVHlwZS4kaWQgYW5kIFR5cGUuJHNjaGVtYS5cbi8vIE5vdGUgdGhhdCBUeXBlLiRpZCBpcyB0aGUgKm5hbWUgb2YgdGhlIGlkIGZpZWxkKiBvbiBpbnN0YW5jZXNcbi8vICAgIGFuZCBOT1QgdGhlIGFjdHVhbCBpZCBmaWVsZCAoZS5nLiwgaW4gbW9zdCBjYXNlcywgVHlwZS4kaWQgPT09ICdpZCcpLlxuLy8gaWQ6IHVuaXF1ZSBpZC4gT2Z0ZW4gYW4gaW50ZWdlciwgYnV0IG5vdCBuZWNlc3NhcnkgKGNvdWxkIGJlIGFuIG9pZClcblxuXG4vLyBoYXNNYW55IHJlbGF0aW9uc2hpcHMgYXJlIHRyZWF0ZWQgbGlrZSBpZCBhcnJheXMuIFNvLCBhZGQgLyByZW1vdmUgLyBoYXNcbi8vIGp1c3Qgc3RvcmVzIGFuZCByZW1vdmVzIGludGVnZXJzLlxuXG5leHBvcnQgY2xhc3MgU3RvcmFnZSB7XG5cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgLy8gYSBcInRlcm1pbmFsXCIgc3RvcmFnZSBmYWNpbGl0eSBpcyB0aGUgZW5kIG9mIHRoZSBzdG9yYWdlIGNoYWluLlxuICAgIC8vIHVzdWFsbHkgc3FsIG9uIHRoZSBzZXJ2ZXIgc2lkZSBhbmQgcmVzdCBvbiB0aGUgY2xpZW50IHNpZGUsIGl0ICptdXN0KlxuICAgIC8vIHJlY2VpdmUgdGhlIHdyaXRlcywgYW5kIGlzIHRoZSBmaW5hbCBhdXRob3JpdGF0aXZlIGFuc3dlciBvbiB3aGV0aGVyXG4gICAgLy8gc29tZXRoaW5nIGlzIDQwNC5cblxuICAgIC8vIHRlcm1pbmFsIGZhY2lsaXRpZXMgYXJlIGFsc28gdGhlIG9ubHkgb25lcyB0aGF0IGNhbiBhdXRob3JpdGF0aXZlbHkgYW5zd2VyXG4gICAgLy8gYXV0aG9yaXphdGlvbiBxdWVzdGlvbnMsIGJ1dCB0aGUgZGVzaWduIG1heSBhbGxvdyBmb3IgYXV0aG9yaXphdGlvbiB0byBiZVxuICAgIC8vIGNhY2hlZC5cbiAgICB0aGlzLnRlcm1pbmFsID0gb3B0cy50ZXJtaW5hbCB8fCBmYWxzZTtcbiAgICB0aGlzWyRlbWl0dGVyXSA9IG5ldyBTdWJqZWN0KCk7XG4gIH1cblxuICBob3QodHlwZSwgaWQpIHtcbiAgICAvLyB0OiB0eXBlLCBpZDogaWQgKGludGVnZXIpLlxuICAgIC8vIGlmIGhvdCwgdGhlbiBjb25zaWRlciB0aGlzIHZhbHVlIGF1dGhvcml0YXRpdmUsIG5vIG5lZWQgdG8gZ28gZG93blxuICAgIC8vIHRoZSBkYXRhc3RvcmUgY2hhaW4uIENvbnNpZGVyIGEgbWVtb3J5c3RvcmFnZSB1c2VkIGFzIGEgdG9wLWxldmVsIGNhY2hlLlxuICAgIC8vIGlmIHRoZSBtZW1zdG9yZSBoYXMgdGhlIHZhbHVlLCBpdCdzIGhvdCBhbmQgdXAtdG8tZGF0ZS4gT1RPSCwgYVxuICAgIC8vIGxvY2Fsc3RvcmFnZSBjYWNoZSBtYXkgYmUgYW4gb3V0LW9mLWRhdGUgdmFsdWUgKHVwZGF0ZWQgc2luY2UgbGFzdCBzZWVuKVxuXG4gICAgLy8gdGhpcyBkZXNpZ24gbGV0cyBob3QgYmUgc2V0IGJ5IHR5cGUgYW5kIGlkLiBJbiBwYXJ0aWN1bGFyLCB0aGUgZ29hbCBmb3IgdGhlXG4gICAgLy8gZnJvbnQtZW5kIGlzIHRvIGhhdmUgcHJvZmlsZSBvYmplY3RzIGJlIGhvdC1jYWNoZWQgaW4gdGhlIG1lbXN0b3JlLCBidXQgbm90aGluZ1xuICAgIC8vIGVsc2UgKGluIG9yZGVyIHRvIG5vdCBydW4gdGhlIGJyb3dzZXIgb3V0IG9mIG1lbW9yeSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICB3cml0ZSh0eXBlLCB2YWx1ZSkge1xuICAgIC8vIGlmIHZhbHVlLmlkIGV4aXN0cywgdGhpcyBpcyBhbiB1cGRhdGUuIElmIGl0IGRvZXNuJ3QsIGl0IGlzIGFuXG4gICAgLy8gaW5zZXJ0LiBJbiB0aGUgY2FzZSBvZiBhbiB1cGRhdGUsIGl0IHNob3VsZCBtZXJnZSBkb3duIHRoZSB0cmVlLlxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdXcml0ZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICAvLyBUT0RPOiB3cml0ZSB0aGUgdHdvLXdheSBoYXMvZ2V0IGxvZ2ljIGludG8gdGhpcyBtZXRob2RcbiAgLy8gYW5kIHByb3ZpZGUgb3ZlcnJpZGUgaG9va3MgZm9yIHJlYWRBdHRyaWJ1dGVzIHJlYWRSZWxhdGlvbnNoaXBcblxuICByZWFkKHR5cGUsIGlkLCBvcHRzKSB7XG4gICAgY29uc3Qga2V5cyA9IG9wdHMgJiYgIUFycmF5LmlzQXJyYXkob3B0cykgPyBbb3B0c10gOiBvcHRzO1xuICAgIHJldHVybiB0aGlzLnJlYWRBdHRyaWJ1dGVzKHR5cGUsIGlkKVxuICAgIC50aGVuKGF0dHJpYnV0ZXMgPT4ge1xuICAgICAgaWYgKGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZFJlbGF0aW9uc2hpcHModHlwZSwgaWQsIGtleXMpXG4gICAgICAgIC50aGVuKHJlbGF0aW9uc2hpcHMgPT4ge1xuICAgICAgICAgIHJldHVybiBtZXJnZU9wdGlvbnMoe1xuICAgICAgICAgICAgdHlwZTogdHlwZS4kbmFtZSxcbiAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHt9LFxuICAgICAgICAgICAgcmVsYXRpb25zaGlwczoge30sXG4gICAgICAgICAgfSxcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMsXG4gICAgICAgICAgICByZWxhdGlvbnNoaXBzXG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9KS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm90aWZ5VXBkYXRlKHR5cGUsIGlkLCByZXN1bHQsIGtleXMpXG4gICAgICAgIC50aGVuKCgpID0+IHJlc3VsdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcmVhZEF0dHJpYnV0ZXModHlwZSwgaWQpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcigncmVhZEF0dHJpYnV0ZXMgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgcmVhZFJlbGF0aW9uc2hpcCh0eXBlLCBpZCwga2V5KSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ3JlYWRSZWxhdGlvbnNoaXAgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgcmVhZFJlbGF0aW9uc2hpcHModCwgaWQsIGtleSwgYXR0cmlidXRlcykge1xuICAgIC8vIElmIHRoZXJlIGlzIG5vIGtleSwgaXQgZGVmYXVsdHMgdG8gYWxsIHJlbGF0aW9uc2hpcHNcbiAgICAvLyBPdGhlcndpc2UsIGl0IHdyYXBzIGl0IGluIGFuIEFycmF5IGlmIGl0IGlzbid0IGFscmVhZHkgb25lXG4gICAgY29uc3Qga2V5cyA9IGtleSAmJiAhQXJyYXkuaXNBcnJheShrZXkpID8gW2tleV0gOiBrZXkgfHwgW107XG4gICAgcmV0dXJuIGtleXMuZmlsdGVyKGsgPT4gayBpbiB0LiRzY2hlbWEucmVsYXRpb25zaGlwcykubWFwKHJlbE5hbWUgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMucmVhZFJlbGF0aW9uc2hpcCh0LCBpZCwgcmVsTmFtZSwgYXR0cmlidXRlcyk7XG4gICAgfSkucmVkdWNlKCh0aGVuYWJsZUFjYywgdGhlbmFibGVDdXJyKSA9PiB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFt0aGVuYWJsZUFjYywgdGhlbmFibGVDdXJyXSlcbiAgICAgIC50aGVuKChbYWNjLCBjdXJyXSkgPT4ge1xuICAgICAgICByZXR1cm4gbWVyZ2VPcHRpb25zKGFjYywgY3Vycik7XG4gICAgICB9KTtcbiAgICB9LCBCbHVlYmlyZC5yZXNvbHZlKHt9KSk7XG4gIH1cblxuICAvLyB3aXBlIHNob3VsZCBxdWlldGx5IGVyYXNlIGEgdmFsdWUgZnJvbSB0aGUgc3RvcmUuIFRoaXMgaXMgdXNlZCBkdXJpbmdcbiAgLy8gY2FjaGUgaW52YWxpZGF0aW9uIGV2ZW50cyB3aGVuIHRoZSBjdXJyZW50IHZhbHVlIGlzIGtub3duIHRvIGJlIGluY29ycmVjdC5cbiAgLy8gaXQgaXMgbm90IGEgZGVsZXRlICh3aGljaCBpcyBhIHVzZXItaW5pdGlhdGVkLCBldmVudC1jYXVzaW5nIHRoaW5nKSwgYnV0XG4gIC8vIHNob3VsZCByZXN1bHQgaW4gdGhpcyB2YWx1ZSBub3Qgc3RvcmVkIGluIHN0b3JhZ2UgYW55bW9yZS5cblxuICB3aXBlKHR5cGUsIGlkLCBmaWVsZCkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdXaXBlIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIGRlbGV0ZSh0eXBlLCBpZCkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdEZWxldGUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgYWRkKHR5cGUsIGlkLCByZWxhdGlvbnNoaXBUaXRsZSwgY2hpbGRJZCwgZXh0cmFzID0ge30pIHtcbiAgICAvLyBhZGQgdG8gYSBoYXNNYW55IHJlbGF0aW9uc2hpcFxuICAgIC8vIG5vdGUgdGhhdCBoYXNNYW55IGZpZWxkcyBjYW4gaGF2ZSAoaW1wbC1zcGVjaWZpYykgdmFsZW5jZSBkYXRhIChub3cgcmVuYW1lZCBleHRyYXMpXG4gICAgLy8gZXhhbXBsZTogbWVtYmVyc2hpcCBiZXR3ZWVuIHByb2ZpbGUgYW5kIGNvbW11bml0eSBjYW4gaGF2ZSBwZXJtIDEsIDIsIDNcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignQWRkIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHJlbW92ZSh0eXBlLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUsIGNoaWxkSWQpIHtcbiAgICAvLyByZW1vdmUgZnJvbSBhIGhhc01hbnkgcmVsYXRpb25zaGlwXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ3JlbW92ZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBtb2RpZnlSZWxhdGlvbnNoaXAodHlwZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlLCBjaGlsZElkLCBleHRyYXMgPSB7fSkge1xuICAgIC8vIHNob3VsZCBtb2RpZnkgYW4gZXhpc3RpbmcgaGFzTWFueSB2YWxlbmNlIGRhdGEuIFRocm93IGlmIG5vdCBleGlzdGluZy5cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignbW9kaWZ5UmVsYXRpb25zaGlwIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHF1ZXJ5KHEpIHtcbiAgICAvLyBxOiB7dHlwZTogc3RyaW5nLCBxdWVyeTogYW55fVxuICAgIC8vIHEucXVlcnkgaXMgaW1wbCBkZWZpbmVkIC0gYSBzdHJpbmcgZm9yIHNxbCAocmF3IHNxbClcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignUXVlcnkgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgb25VcGRhdGUob2JzZXJ2ZXIpIHtcbiAgICAvLyBvYnNlcnZlciBmb2xsb3dzIHRoZSBSeEpTIHBhdHRlcm4gLSBpdCBpcyBlaXRoZXIgYSBmdW5jdGlvbiAoZm9yIG5leHQoKSlcbiAgICAvLyBvciB7bmV4dCwgZXJyb3IsIGNvbXBsZXRlfTtcbiAgICAvLyByZXR1cm5zIGFuIHVuc3ViIGhvb2sgKHJldFZhbC51bnN1YnNjcmliZSgpKVxuICAgIHJldHVybiB0aGlzWyRlbWl0dGVyXS5zdWJzY3JpYmUob2JzZXJ2ZXIpO1xuICB9XG5cbiAgbm90aWZ5VXBkYXRlKHR5cGUsIGlkLCB2YWx1ZSwgb3B0cyA9IFsnYXR0cmlidXRlcyddKSB7XG4gICAgY29uc3Qga2V5cyA9IEFycmF5LmlzQXJyYXkob3B0cykgPyBvcHRzIDogW29wdHNdO1xuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoa2V5cy5tYXAoKGZpZWxkKSA9PiB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgICAgaWYgKGZpZWxkID09PSAnYXR0cmlidXRlcycpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWVsZCBpbiB2YWx1ZSA/IEJsdWViaXJkLnJlc29sdmUodmFsdWVbZmllbGRdKSA6IHRoaXMucmVhZEF0dHJpYnV0ZXModHlwZSwgaWQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWUucmVsYXRpb25zaGlwcyAmJiBmaWVsZCBpbiB2YWx1ZS5yZWxhdGlvbnNoaXBzKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbG9uZWx5LWlmXG4gICAgICAgICAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHZhbHVlLnJlbGF0aW9uc2hpcHNbZmllbGRdKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlYWRSZWxhdGlvbnNoaXAodHlwZSwgaWQsIGZpZWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0pLnRoZW4oKHZhbCkgPT4ge1xuICAgICAgICBpZiAodmFsKSB7XG4gICAgICAgICAgdGhpc1skZW1pdHRlcl0ubmV4dCh7XG4gICAgICAgICAgICB0eXBlLFxuICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICB2YWx1ZTogdmFsLFxuICAgICAgICAgICAgZmllbGQsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9KTtcbiAgICB9KSk7XG4gIH1cblxuICAkJHRlc3RJbmRleCguLi5hcmdzKSB7XG4gICAgaWYgKGFyZ3MubGVuZ3RoID09PSAxKSB7XG4gICAgICBpZiAoYXJnc1swXS4kaWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lsbGVnYWwgb3BlcmF0aW9uIG9uIGFuIHVuc2F2ZWQgbmV3IG1vZGVsJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChhcmdzWzFdW2FyZ3NbMF0uJGlkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lsbGVnYWwgb3BlcmF0aW9uIG9uIGFuIHVuc2F2ZWQgbmV3IG1vZGVsJyk7XG4gICAgfVxuICB9XG59XG5cblxuLy8gY29udmVuaWVuY2UgZnVuY3Rpb24gdGhhdCB3YWxrcyBhbiBhcnJheSByZXBsYWNpbmcgYW55IHtpZH0gd2l0aCBjb250ZXh0LmlkXG5TdG9yYWdlLm1hc3NSZXBsYWNlID0gZnVuY3Rpb24gbWFzc1JlcGxhY2UoYmxvY2ssIGNvbnRleHQpIHtcbiAgcmV0dXJuIGJsb2NrLm1hcCgodikgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHYpKSB7XG4gICAgICByZXR1cm4gbWFzc1JlcGxhY2UodiwgY29udGV4dCk7XG4gICAgfSBlbHNlIGlmICgodHlwZW9mIHYgPT09ICdzdHJpbmcnKSAmJiAodi5tYXRjaCgvXlxceyguKilcXH0kLykpKSB7XG4gICAgICByZXR1cm4gY29udGV4dFt2Lm1hdGNoKC9eXFx7KC4qKVxcfSQvKVsxXV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB2O1xuICAgIH1cbiAgfSk7XG59O1xuIl19
