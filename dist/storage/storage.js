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
              attributes: attributes.attributes || attributes,
              relationships: attributes.relationships ? (0, _mergeOptions2.default)({}, attributes.relationships, relationships.relationships || relationships) : relationships.relationships || relationships
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsIiRlbWl0dGVyIiwiU3ltYm9sIiwiU3RvcmFnZSIsIm9wdHMiLCJ0ZXJtaW5hbCIsInR5cGUiLCJpZCIsInZhbHVlIiwicmVqZWN0IiwiRXJyb3IiLCJrZXlzIiwiQXJyYXkiLCJpc0FycmF5IiwicmVhZEF0dHJpYnV0ZXMiLCJ0aGVuIiwiYXR0cmlidXRlcyIsInJlYWRSZWxhdGlvbnNoaXBzIiwiJG5hbWUiLCJyZWxhdGlvbnNoaXBzIiwicmVzdWx0Iiwibm90aWZ5VXBkYXRlIiwicmVhZCIsImRhdGEiLCJpbmNsdWRlZCIsImtleSIsInQiLCJmaWx0ZXIiLCJrIiwiJHNjaGVtYSIsIm1hcCIsInJlYWRSZWxhdGlvbnNoaXAiLCJyZWxOYW1lIiwicmVkdWNlIiwidGhlbmFibGVBY2MiLCJ0aGVuYWJsZUN1cnIiLCJhbGwiLCJhY2MiLCJjdXJyIiwicmVzb2x2ZSIsImZpZWxkIiwicmVsYXRpb25zaGlwVGl0bGUiLCJjaGlsZElkIiwiZXh0cmFzIiwicSIsIm9ic2VydmVyIiwic3Vic2NyaWJlIiwidmFsIiwibmV4dCIsImFyZ3MiLCJsZW5ndGgiLCIkaWQiLCJ1bmRlZmluZWQiLCJtYXNzUmVwbGFjZSIsImJsb2NrIiwiY29udGV4dCIsInYiLCJtYXRjaCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O3FqQkFBQTs7QUFFQTs7SUFBWUEsUTs7QUFDWjs7OztBQUNBOztBQUVBOzs7Ozs7OztBQUVBLElBQU1DLFdBQVdDLE9BQU8sVUFBUCxDQUFqQjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0lBRWFDLE8sV0FBQUEsTztBQUVYLHFCQUF1QjtBQUFBLFFBQVhDLElBQVcsdUVBQUosRUFBSTs7QUFBQTs7QUFDckI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsU0FBS0MsUUFBTCxHQUFnQkQsS0FBS0MsUUFBTCxJQUFpQixLQUFqQztB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QUZNLE1BRUE7QUFDTCxhQUFPRCxDQUFQO0FBQ0Q7QUFDRixHQVJNLENBQVA7QUFTRCxDQVZEIiwiZmlsZSI6InN0b3JhZ2Uvc3RvcmFnZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludCBuby11bnVzZWQtdmFyczogMCAqL1xuXG5pbXBvcnQgKiBhcyBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgbWVyZ2VPcHRpb25zIGZyb20gJ21lcmdlLW9wdGlvbnMnO1xuaW1wb3J0IHsgU3ViamVjdCB9IGZyb20gJ3J4anMvUngnO1xuXG5pbXBvcnQgeyAkc2VsZiwgJGFsbCB9IGZyb20gJy4uL21vZGVsJztcblxuY29uc3QgJGVtaXR0ZXIgPSBTeW1ib2woJyRlbWl0dGVyJyk7XG5cbi8vIHR5cGU6IGFuIG9iamVjdCB0aGF0IGRlZmluZXMgdGhlIHR5cGUuIHR5cGljYWxseSB0aGlzIHdpbGwgYmVcbi8vIHBhcnQgb2YgdGhlIE1vZGVsIGNsYXNzIGhpZXJhcmNoeSwgYnV0IFN0b3JhZ2Ugb2JqZWN0cyBjYWxsIG5vIG1ldGhvZHNcbi8vIG9uIHRoZSB0eXBlIG9iamVjdC4gV2Ugb25seSBhcmUgaW50ZXJlc3RlZCBpbiBUeXBlLiRuYW1lLCBUeXBlLiRpZCBhbmQgVHlwZS4kc2NoZW1hLlxuLy8gTm90ZSB0aGF0IFR5cGUuJGlkIGlzIHRoZSAqbmFtZSBvZiB0aGUgaWQgZmllbGQqIG9uIGluc3RhbmNlc1xuLy8gICAgYW5kIE5PVCB0aGUgYWN0dWFsIGlkIGZpZWxkIChlLmcuLCBpbiBtb3N0IGNhc2VzLCBUeXBlLiRpZCA9PT0gJ2lkJykuXG4vLyBpZDogdW5pcXVlIGlkLiBPZnRlbiBhbiBpbnRlZ2VyLCBidXQgbm90IG5lY2Vzc2FyeSAoY291bGQgYmUgYW4gb2lkKVxuXG5cbi8vIGhhc01hbnkgcmVsYXRpb25zaGlwcyBhcmUgdHJlYXRlZCBsaWtlIGlkIGFycmF5cy4gU28sIGFkZCAvIHJlbW92ZSAvIGhhc1xuLy8ganVzdCBzdG9yZXMgYW5kIHJlbW92ZXMgaW50ZWdlcnMuXG5cbmV4cG9ydCBjbGFzcyBTdG9yYWdlIHtcblxuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICAvLyBhIFwidGVybWluYWxcIiBzdG9yYWdlIGZhY2lsaXR5IGlzIHRoZSBlbmQgb2YgdGhlIHN0b3JhZ2UgY2hhaW4uXG4gICAgLy8gdXN1YWxseSBzcWwgb24gdGhlIHNlcnZlciBzaWRlIGFuZCByZXN0IG9uIHRoZSBjbGllbnQgc2lkZSwgaXQgKm11c3QqXG4gICAgLy8gcmVjZWl2ZSB0aGUgd3JpdGVzLCBhbmQgaXMgdGhlIGZpbmFsIGF1dGhvcml0YXRpdmUgYW5zd2VyIG9uIHdoZXRoZXJcbiAgICAvLyBzb21ldGhpbmcgaXMgNDA0LlxuXG4gICAgLy8gdGVybWluYWwgZmFjaWxpdGllcyBhcmUgYWxzbyB0aGUgb25seSBvbmVzIHRoYXQgY2FuIGF1dGhvcml0YXRpdmVseSBhbnN3ZXJcbiAgICAvLyBhdXRob3JpemF0aW9uIHF1ZXN0aW9ucywgYnV0IHRoZSBkZXNpZ24gbWF5IGFsbG93IGZvciBhdXRob3JpemF0aW9uIHRvIGJlXG4gICAgLy8gY2FjaGVkLlxuICAgIHRoaXMudGVybWluYWwgPSBvcHRzLnRlcm1pbmFsIHx8IGZhbHNlO1xuICAgIHRoaXNbJGVtaXR0ZXJdID0gbmV3IFN1YmplY3QoKTtcbiAgfVxuXG4gIGhvdCh0eXBlLCBpZCkge1xuICAgIC8vIHQ6IHR5cGUsIGlkOiBpZCAoaW50ZWdlcikuXG4gICAgLy8gaWYgaG90LCB0aGVuIGNvbnNpZGVyIHRoaXMgdmFsdWUgYXV0aG9yaXRhdGl2ZSwgbm8gbmVlZCB0byBnbyBkb3duXG4gICAgLy8gdGhlIGRhdGFzdG9yZSBjaGFpbi4gQ29uc2lkZXIgYSBtZW1vcnlzdG9yYWdlIHVzZWQgYXMgYSB0b3AtbGV2ZWwgY2FjaGUuXG4gICAgLy8gaWYgdGhlIG1lbXN0b3JlIGhhcyB0aGUgdmFsdWUsIGl0J3MgaG90IGFuZCB1cC10by1kYXRlLiBPVE9ILCBhXG4gICAgLy8gbG9jYWxzdG9yYWdlIGNhY2hlIG1heSBiZSBhbiBvdXQtb2YtZGF0ZSB2YWx1ZSAodXBkYXRlZCBzaW5jZSBsYXN0IHNlZW4pXG5cbiAgICAvLyB0aGlzIGRlc2lnbiBsZXRzIGhvdCBiZSBzZXQgYnkgdHlwZSBhbmQgaWQuIEluIHBhcnRpY3VsYXIsIHRoZSBnb2FsIGZvciB0aGVcbiAgICAvLyBmcm9udC1lbmQgaXMgdG8gaGF2ZSBwcm9maWxlIG9iamVjdHMgYmUgaG90LWNhY2hlZCBpbiB0aGUgbWVtc3RvcmUsIGJ1dCBub3RoaW5nXG4gICAgLy8gZWxzZSAoaW4gb3JkZXIgdG8gbm90IHJ1biB0aGUgYnJvd3NlciBvdXQgb2YgbWVtb3J5KVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHdyaXRlKHR5cGUsIHZhbHVlKSB7XG4gICAgLy8gaWYgdmFsdWUuaWQgZXhpc3RzLCB0aGlzIGlzIGFuIHVwZGF0ZS4gSWYgaXQgZG9lc24ndCwgaXQgaXMgYW5cbiAgICAvLyBpbnNlcnQuIEluIHRoZSBjYXNlIG9mIGFuIHVwZGF0ZSwgaXQgc2hvdWxkIG1lcmdlIGRvd24gdGhlIHRyZWUuXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ1dyaXRlIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIC8vIFRPRE86IHdyaXRlIHRoZSB0d28td2F5IGhhcy9nZXQgbG9naWMgaW50byB0aGlzIG1ldGhvZFxuICAvLyBhbmQgcHJvdmlkZSBvdmVycmlkZSBob29rcyBmb3IgcmVhZEF0dHJpYnV0ZXMgcmVhZFJlbGF0aW9uc2hpcFxuXG4gIHJlYWQodHlwZSwgaWQsIG9wdHMpIHtcbiAgICBjb25zdCBrZXlzID0gb3B0cyAmJiAhQXJyYXkuaXNBcnJheShvcHRzKSA/IFtvcHRzXSA6IG9wdHM7XG4gICAgcmV0dXJuIHRoaXMucmVhZEF0dHJpYnV0ZXModHlwZSwgaWQpXG4gICAgLnRoZW4oYXR0cmlidXRlcyA9PiB7XG4gICAgICBpZiAoYXR0cmlidXRlcykge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkUmVsYXRpb25zaGlwcyh0eXBlLCBpZCwga2V5cylcbiAgICAgICAgLnRoZW4ocmVsYXRpb25zaGlwcyA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IHR5cGUuJG5hbWUsXG4gICAgICAgICAgICBpZCxcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IGF0dHJpYnV0ZXMuYXR0cmlidXRlcyB8fCBhdHRyaWJ1dGVzLFxuICAgICAgICAgICAgcmVsYXRpb25zaGlwczpcbiAgICAgICAgICAgICAgYXR0cmlidXRlcy5yZWxhdGlvbnNoaXBzXG4gICAgICAgICAgICAgICAgPyBtZXJnZU9wdGlvbnMoe30sIGF0dHJpYnV0ZXMucmVsYXRpb25zaGlwcywgcmVsYXRpb25zaGlwcy5yZWxhdGlvbnNoaXBzIHx8IHJlbGF0aW9uc2hpcHMpXG4gICAgICAgICAgICAgICAgOiByZWxhdGlvbnNoaXBzLnJlbGF0aW9uc2hpcHMgfHwgcmVsYXRpb25zaGlwcyxcbiAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ub3RpZnlVcGRhdGUodHlwZSwgaWQsIHJlc3VsdCwga2V5cylcbiAgICAgICAgLnRoZW4oKCkgPT4gcmVzdWx0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBidWxrUmVhZCh0eXBlLCBpZCkge1xuICAgIC8vIG92ZXJyaWRlIHRoaXMgaWYgeW91IHdhbnQgdG8gZG8gYW55IHNwZWNpYWwgcHJlLXByb2Nlc3NpbmdcbiAgICAvLyBmb3IgcmVhZGluZyBmcm9tIHRoZSBzdG9yZSBwcmlvciB0byBhIFJFU1Qgc2VydmljZSBldmVudFxuICAgIHJldHVybiB0aGlzLnJlYWQodHlwZSwgaWQpLnRoZW4oZGF0YSA9PiB7XG4gICAgICByZXR1cm4geyBkYXRhLCBpbmNsdWRlZDogW10gfTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlYWRBdHRyaWJ1dGVzKHR5cGUsIGlkKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ3JlYWRBdHRyaWJ1dGVzIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHJlYWRSZWxhdGlvbnNoaXAodHlwZSwgaWQsIGtleSkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdyZWFkUmVsYXRpb25zaGlwIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHJlYWRSZWxhdGlvbnNoaXBzKHQsIGlkLCBrZXksIGF0dHJpYnV0ZXMpIHtcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBrZXksIGl0IGRlZmF1bHRzIHRvIGFsbCByZWxhdGlvbnNoaXBzXG4gICAgLy8gT3RoZXJ3aXNlLCBpdCB3cmFwcyBpdCBpbiBhbiBBcnJheSBpZiBpdCBpc24ndCBhbHJlYWR5IG9uZVxuICAgIGNvbnN0IGtleXMgPSBrZXkgJiYgIUFycmF5LmlzQXJyYXkoa2V5KSA/IFtrZXldIDoga2V5IHx8IFtdO1xuICAgIHJldHVybiBrZXlzLmZpbHRlcihrID0+IGsgaW4gdC4kc2NoZW1hLnJlbGF0aW9uc2hpcHMpLm1hcChyZWxOYW1lID0+IHtcbiAgICAgIHJldHVybiB0aGlzLnJlYWRSZWxhdGlvbnNoaXAodCwgaWQsIHJlbE5hbWUsIGF0dHJpYnV0ZXMpO1xuICAgIH0pLnJlZHVjZSgodGhlbmFibGVBY2MsIHRoZW5hYmxlQ3VycikgPT4ge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbdGhlbmFibGVBY2MsIHRoZW5hYmxlQ3Vycl0pXG4gICAgICAudGhlbigoW2FjYywgY3Vycl0pID0+IHtcbiAgICAgICAgcmV0dXJuIG1lcmdlT3B0aW9ucyhhY2MsIGN1cnIpO1xuICAgICAgfSk7XG4gICAgfSwgQmx1ZWJpcmQucmVzb2x2ZSh7fSkpO1xuICB9XG5cbiAgLy8gd2lwZSBzaG91bGQgcXVpZXRseSBlcmFzZSBhIHZhbHVlIGZyb20gdGhlIHN0b3JlLiBUaGlzIGlzIHVzZWQgZHVyaW5nXG4gIC8vIGNhY2hlIGludmFsaWRhdGlvbiBldmVudHMgd2hlbiB0aGUgY3VycmVudCB2YWx1ZSBpcyBrbm93biB0byBiZSBpbmNvcnJlY3QuXG4gIC8vIGl0IGlzIG5vdCBhIGRlbGV0ZSAod2hpY2ggaXMgYSB1c2VyLWluaXRpYXRlZCwgZXZlbnQtY2F1c2luZyB0aGluZyksIGJ1dFxuICAvLyBzaG91bGQgcmVzdWx0IGluIHRoaXMgdmFsdWUgbm90IHN0b3JlZCBpbiBzdG9yYWdlIGFueW1vcmUuXG5cbiAgd2lwZSh0eXBlLCBpZCwgZmllbGQpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignV2lwZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBkZWxldGUodHlwZSwgaWQpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignRGVsZXRlIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIGFkZCh0eXBlLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUsIGNoaWxkSWQsIGV4dHJhcyA9IHt9KSB7XG4gICAgLy8gYWRkIHRvIGEgaGFzTWFueSByZWxhdGlvbnNoaXBcbiAgICAvLyBub3RlIHRoYXQgaGFzTWFueSBmaWVsZHMgY2FuIGhhdmUgKGltcGwtc3BlY2lmaWMpIHZhbGVuY2UgZGF0YSAobm93IHJlbmFtZWQgZXh0cmFzKVxuICAgIC8vIGV4YW1wbGU6IG1lbWJlcnNoaXAgYmV0d2VlbiBwcm9maWxlIGFuZCBjb21tdW5pdHkgY2FuIGhhdmUgcGVybSAxLCAyLCAzXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0FkZCBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICByZW1vdmUodHlwZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlLCBjaGlsZElkKSB7XG4gICAgLy8gcmVtb3ZlIGZyb20gYSBoYXNNYW55IHJlbGF0aW9uc2hpcFxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdyZW1vdmUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKHR5cGUsIGlkLCByZWxhdGlvbnNoaXBUaXRsZSwgY2hpbGRJZCwgZXh0cmFzID0ge30pIHtcbiAgICAvLyBzaG91bGQgbW9kaWZ5IGFuIGV4aXN0aW5nIGhhc01hbnkgdmFsZW5jZSBkYXRhLiBUaHJvdyBpZiBub3QgZXhpc3RpbmcuXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ21vZGlmeVJlbGF0aW9uc2hpcCBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBxdWVyeShxKSB7XG4gICAgLy8gcToge3R5cGU6IHN0cmluZywgcXVlcnk6IGFueX1cbiAgICAvLyBxLnF1ZXJ5IGlzIGltcGwgZGVmaW5lZCAtIGEgc3RyaW5nIGZvciBzcWwgKHJhdyBzcWwpXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ1F1ZXJ5IG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIG9uVXBkYXRlKG9ic2VydmVyKSB7XG4gICAgLy8gb2JzZXJ2ZXIgZm9sbG93cyB0aGUgUnhKUyBwYXR0ZXJuIC0gaXQgaXMgZWl0aGVyIGEgZnVuY3Rpb24gKGZvciBuZXh0KCkpXG4gICAgLy8gb3Ige25leHQsIGVycm9yLCBjb21wbGV0ZX07XG4gICAgLy8gcmV0dXJucyBhbiB1bnN1YiBob29rIChyZXRWYWwudW5zdWJzY3JpYmUoKSlcbiAgICByZXR1cm4gdGhpc1skZW1pdHRlcl0uc3Vic2NyaWJlKG9ic2VydmVyKTtcbiAgfVxuXG4gIG5vdGlmeVVwZGF0ZSh0eXBlLCBpZCwgdmFsdWUsIG9wdHMgPSBbJ2F0dHJpYnV0ZXMnXSkge1xuICAgIGNvbnN0IGtleXMgPSBBcnJheS5pc0FycmF5KG9wdHMpID8gb3B0cyA6IFtvcHRzXTtcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKGtleXMubWFwKChmaWVsZCkgPT4ge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy50ZXJtaW5hbCkge1xuICAgICAgICAgIGlmIChmaWVsZCA9PT0gJ2F0dHJpYnV0ZXMnKSB7XG4gICAgICAgICAgICByZXR1cm4gZmllbGQgaW4gdmFsdWUgPyBCbHVlYmlyZC5yZXNvbHZlKHZhbHVlW2ZpZWxkXSkgOiB0aGlzLnJlYWRBdHRyaWJ1dGVzKHR5cGUsIGlkKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlLnJlbGF0aW9uc2hpcHMgJiYgZmllbGQgaW4gdmFsdWUucmVsYXRpb25zaGlwcykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWxvbmVseS1pZlxuICAgICAgICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh2YWx1ZS5yZWxhdGlvbnNoaXBzW2ZpZWxkXSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWFkUmVsYXRpb25zaGlwKHR5cGUsIGlkLCBmaWVsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9KS50aGVuKCh2YWwpID0+IHtcbiAgICAgICAgaWYgKHZhbCkge1xuICAgICAgICAgIHRoaXNbJGVtaXR0ZXJdLm5leHQoe1xuICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgdmFsdWU6IHZhbCxcbiAgICAgICAgICAgIGZpZWxkLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSk7XG4gICAgfSkpO1xuICB9XG5cbiAgJCR0ZXN0SW5kZXgoLi4uYXJncykge1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgaWYgKGFyZ3NbMF0uJGlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbGxlZ2FsIG9wZXJhdGlvbiBvbiBhbiB1bnNhdmVkIG5ldyBtb2RlbCcpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYXJnc1sxXVthcmdzWzBdLiRpZF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbGxlZ2FsIG9wZXJhdGlvbiBvbiBhbiB1bnNhdmVkIG5ldyBtb2RlbCcpO1xuICAgIH1cbiAgfVxufVxuXG5cbi8vIGNvbnZlbmllbmNlIGZ1bmN0aW9uIHRoYXQgd2Fsa3MgYW4gYXJyYXkgcmVwbGFjaW5nIGFueSB7aWR9IHdpdGggY29udGV4dC5pZFxuU3RvcmFnZS5tYXNzUmVwbGFjZSA9IGZ1bmN0aW9uIG1hc3NSZXBsYWNlKGJsb2NrLCBjb250ZXh0KSB7XG4gIHJldHVybiBibG9jay5tYXAoKHYpID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2KSkge1xuICAgICAgcmV0dXJuIG1hc3NSZXBsYWNlKHYsIGNvbnRleHQpO1xuICAgIH0gZWxzZSBpZiAoKHR5cGVvZiB2ID09PSAnc3RyaW5nJykgJiYgKHYubWF0Y2goL15cXHsoLiopXFx9JC8pKSkge1xuICAgICAgcmV0dXJuIGNvbnRleHRbdi5tYXRjaCgvXlxceyguKilcXH0kLylbMV1dO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdjtcbiAgICB9XG4gIH0pO1xufTtcbiJdfQ==
