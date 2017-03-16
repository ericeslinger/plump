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

var $readSubject = Symbol('$readSubject');
var $writeSubject = Symbol('$writeSubject');
var $types = Symbol('$types');

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
    this[$readSubject] = new _Rx.Subject();
    this[$writeSubject] = new _Rx.Subject();
    this.read$ = this[$readSubject].asObservable();
    this.write$ = this[$writeSubject].asObservable();
    this[$types] = {};
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

    // hook a non-terminal store into a terminal store.

  }, {
    key: 'wire',
    value: function wire(store, shutdownSignal) {
      var _this = this;

      if (this.terminal) {
        throw new Error('Cannot wire a terminal store into another store');
      } else {
        // TODO: figure out where the type data comes from.
        store.read$.takeUntil(shutdownSignal).subscribe(function (v) {
          _this.write(v);
        });
        store.write$.takeUntil(shutdownSignal).subscribe(function (v) {
          v.invalidate.forEach(function (invalid) {
            _this.wipe(v.type, v.id, invalid);
          });
        });
      }
    }
  }, {
    key: 'write',
    value: function write(value, opts) {
      // if value.id exists, this is an update. If it doesn't, it is an
      // insert. In the case of an update, it should merge down the tree.
      return Bluebird.reject(new Error('Write not implemented'));
    }
  }, {
    key: 'getType',
    value: function getType(t) {
      if (typeof t === 'string') {
        return this[$types][t];
      } else {
        return t;
      }
    }
  }, {
    key: 'addType',
    value: function addType(t) {
      this[$types][t.$name] = t;
    }
  }, {
    key: 'addTypes',
    value: function addTypes(a) {
      var _this2 = this;

      a.forEach(function (t) {
        return _this2.addType(t);
      });
    }

    // TODO: write the two-way has/get logic into this method
    // and provide override hooks for readAttributes readRelationship

  }, {
    key: 'read',
    value: function read(typeName, id, opts) {
      var _this3 = this;

      var type = this.getType(typeName);
      var keys = opts && !Array.isArray(opts) ? [opts] : opts;
      return this.readAttributes(type, id).then(function (attributes) {
        if (attributes) {
          return _this3.readRelationships(type, id, keys).then(function (relationships) {
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
          _this3.fireReadUpdate(result);
        }
        return result;
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
    value: function readRelationships(type, id, key, attributes) {
      var _this4 = this;

      var t = this.getType(type);
      // If there is no key, it defaults to all relationships
      // Otherwise, it wraps it in an Array if it isn't already one
      var keys = key && !Array.isArray(key) ? [key] : key || [];
      return keys.filter(function (k) {
        return k in t.$schema.relationships;
      }).map(function (relName) {
        return _this4.readRelationship(t, id, relName, attributes);
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
    key: 'fireWriteUpdate',
    value: function fireWriteUpdate(val) {
      this[$writeSubject].next(val);
      return Bluebird.resolve(val);
    }
  }, {
    key: 'fireReadUpdate',
    value: function fireReadUpdate(val) {
      this[$readSubject].next(val);
      return Bluebird.resolve(val);
    }
  }, {
    key: 'notifyUpdate',
    value: function notifyUpdate(v) {
      return Bluebird.resolve(v);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsIiRyZWFkU3ViamVjdCIsIlN5bWJvbCIsIiR3cml0ZVN1YmplY3QiLCIkdHlwZXMiLCJTdG9yYWdlIiwib3B0cyIsInRlcm1pbmFsIiwicmVhZCQiLCJhc09ic2VydmFibGUiLCJ3cml0ZSQiLCJ0eXBlIiwiaWQiLCJzdG9yZSIsInNodXRkb3duU2lnbmFsIiwiRXJyb3IiLCJ0YWtlVW50aWwiLCJzdWJzY3JpYmUiLCJ2Iiwid3JpdGUiLCJpbnZhbGlkYXRlIiwiZm9yRWFjaCIsImludmFsaWQiLCJ3aXBlIiwidmFsdWUiLCJyZWplY3QiLCJ0IiwiJG5hbWUiLCJhIiwiYWRkVHlwZSIsInR5cGVOYW1lIiwiZ2V0VHlwZSIsImtleXMiLCJBcnJheSIsImlzQXJyYXkiLCJyZWFkQXR0cmlidXRlcyIsInRoZW4iLCJhdHRyaWJ1dGVzIiwicmVhZFJlbGF0aW9uc2hpcHMiLCJyZWxhdGlvbnNoaXBzIiwicmVzdWx0IiwiZmlyZVJlYWRVcGRhdGUiLCJyZWFkIiwiZGF0YSIsImluY2x1ZGVkIiwia2V5IiwiZmlsdGVyIiwiayIsIiRzY2hlbWEiLCJtYXAiLCJyZWFkUmVsYXRpb25zaGlwIiwicmVsTmFtZSIsInJlZHVjZSIsInRoZW5hYmxlQWNjIiwidGhlbmFibGVDdXJyIiwiYWxsIiwiYWNjIiwiY3VyciIsInJlc29sdmUiLCJmaWVsZCIsInJlbGF0aW9uc2hpcFRpdGxlIiwiY2hpbGRJZCIsImV4dHJhcyIsInEiLCJ2YWwiLCJuZXh0IiwiYXJncyIsImxlbmd0aCIsIiRpZCIsInVuZGVmaW5lZCIsIm1hc3NSZXBsYWNlIiwiYmxvY2siLCJjb250ZXh0IiwibWF0Y2giXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztxakJBQUE7O0FBRUE7O0lBQVlBLFE7O0FBQ1o7Ozs7QUFDQTs7QUFFQTs7Ozs7Ozs7QUFFQSxJQUFNQyxlQUFlQyxPQUFPLGNBQVAsQ0FBckI7QUFDQSxJQUFNQyxnQkFBZ0JE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Q0FBVSwyQ0FBVixDQUFOO0FBQ0Q7QUFDRjs7Ozs7O0FBSUg7OztBQUNBVixRQUFRaUUsV0FBUixHQUFzQixTQUFTQSxXQUFULENBQXFCQyxLQUFyQixFQUE0QkMsT0FBNUIsRUFBcUM7QUFDekQsU0FBT0QsTUFBTXRCLEdBQU4sQ0FBVSxVQUFDL0IsQ0FBRCxFQUFPO0FBQ3RCLFFBQUllLE1BQU1DLE9BQU4sQ0FBY2hCLENBQWQsQ0FBSixFQUFzQjtBQUNwQixhQUFPb0QsWUFBWXBELENBQVosRUFBZXNELE9BQWYsQ0FBUDtBQUNELEtBRkQsTUFFTyxJQUFLLE9BQU90RCxDQUFQLEtBQWEsUUFBZCxJQUE0QkEsRUFBRXVELEtBQUYsQ0FBUSxZQUFSLENBQWhDLEVBQXdEO0FBQzdELGFBQU9ELFFBQVF0RCxFQUFFdUQsS0FBRixDQUFRLFlBQVIsRUFBc0IsQ0FBdEIsQ0FBUixDQUFQO0FBQ0QsS0FGTSxNQUVBO0FBQ0wsYUFBT3ZELENBQVA7QUFDRDtBQUNGLEdBUk0sQ0FBUDtBQVNELENBVkQiLCJmaWxlIjoic3RvcmFnZS9zdG9yYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50IG5vLXVudXNlZC12YXJzOiAwICovXG5cbmltcG9ydCAqIGFzIEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBtZXJnZU9wdGlvbnMgZnJvbSAnbWVyZ2Utb3B0aW9ucyc7XG5pbXBvcnQgeyBTdWJqZWN0IH0gZnJvbSAncnhqcy9SeCc7XG5cbmltcG9ydCB7ICRzZWxmLCAkYWxsIH0gZnJvbSAnLi4vbW9kZWwnO1xuXG5jb25zdCAkcmVhZFN1YmplY3QgPSBTeW1ib2woJyRyZWFkU3ViamVjdCcpO1xuY29uc3QgJHdyaXRlU3ViamVjdCA9IFN5bWJvbCgnJHdyaXRlU3ViamVjdCcpO1xuY29uc3QgJHR5cGVzID0gU3ltYm9sKCckdHlwZXMnKTtcblxuLy8gdHlwZTogYW4gb2JqZWN0IHRoYXQgZGVmaW5lcyB0aGUgdHlwZS4gdHlwaWNhbGx5IHRoaXMgd2lsbCBiZVxuLy8gcGFydCBvZiB0aGUgTW9kZWwgY2xhc3MgaGllcmFyY2h5LCBidXQgU3RvcmFnZSBvYmplY3RzIGNhbGwgbm8gbWV0aG9kc1xuLy8gb24gdGhlIHR5cGUgb2JqZWN0LiBXZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIFR5cGUuJG5hbWUsIFR5cGUuJGlkIGFuZCBUeXBlLiRzY2hlbWEuXG4vLyBOb3RlIHRoYXQgVHlwZS4kaWQgaXMgdGhlICpuYW1lIG9mIHRoZSBpZCBmaWVsZCogb24gaW5zdGFuY2VzXG4vLyAgICBhbmQgTk9UIHRoZSBhY3R1YWwgaWQgZmllbGQgKGUuZy4sIGluIG1vc3QgY2FzZXMsIFR5cGUuJGlkID09PSAnaWQnKS5cbi8vIGlkOiB1bmlxdWUgaWQuIE9mdGVuIGFuIGludGVnZXIsIGJ1dCBub3QgbmVjZXNzYXJ5IChjb3VsZCBiZSBhbiBvaWQpXG5cblxuLy8gaGFzTWFueSByZWxhdGlvbnNoaXBzIGFyZSB0cmVhdGVkIGxpa2UgaWQgYXJyYXlzLiBTbywgYWRkIC8gcmVtb3ZlIC8gaGFzXG4vLyBqdXN0IHN0b3JlcyBhbmQgcmVtb3ZlcyBpbnRlZ2Vycy5cblxuZXhwb3J0IGNsYXNzIFN0b3JhZ2Uge1xuXG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIC8vIGEgXCJ0ZXJtaW5hbFwiIHN0b3JhZ2UgZmFjaWxpdHkgaXMgdGhlIGVuZCBvZiB0aGUgc3RvcmFnZSBjaGFpbi5cbiAgICAvLyB1c3VhbGx5IHNxbCBvbiB0aGUgc2VydmVyIHNpZGUgYW5kIHJlc3Qgb24gdGhlIGNsaWVudCBzaWRlLCBpdCAqbXVzdCpcbiAgICAvLyByZWNlaXZlIHRoZSB3cml0ZXMsIGFuZCBpcyB0aGUgZmluYWwgYXV0aG9yaXRhdGl2ZSBhbnN3ZXIgb24gd2hldGhlclxuICAgIC8vIHNvbWV0aGluZyBpcyA0MDQuXG5cbiAgICAvLyB0ZXJtaW5hbCBmYWNpbGl0aWVzIGFyZSBhbHNvIHRoZSBvbmx5IG9uZXMgdGhhdCBjYW4gYXV0aG9yaXRhdGl2ZWx5IGFuc3dlclxuICAgIC8vIGF1dGhvcml6YXRpb24gcXVlc3Rpb25zLCBidXQgdGhlIGRlc2lnbiBtYXkgYWxsb3cgZm9yIGF1dGhvcml6YXRpb24gdG8gYmVcbiAgICAvLyBjYWNoZWQuXG4gICAgdGhpcy50ZXJtaW5hbCA9IG9wdHMudGVybWluYWwgfHwgZmFsc2U7XG4gICAgdGhpc1skcmVhZFN1YmplY3RdID0gbmV3IFN1YmplY3QoKTtcbiAgICB0aGlzWyR3cml0ZVN1YmplY3RdID0gbmV3IFN1YmplY3QoKTtcbiAgICB0aGlzLnJlYWQkID0gdGhpc1skcmVhZFN1YmplY3RdLmFzT2JzZXJ2YWJsZSgpO1xuICAgIHRoaXMud3JpdGUkID0gdGhpc1skd3JpdGVTdWJqZWN0XS5hc09ic2VydmFibGUoKTtcbiAgICB0aGlzWyR0eXBlc10gPSB7fTtcbiAgfVxuXG4gIGhvdCh0eXBlLCBpZCkge1xuICAgIC8vIHQ6IHR5cGUsIGlkOiBpZCAoaW50ZWdlcikuXG4gICAgLy8gaWYgaG90LCB0aGVuIGNvbnNpZGVyIHRoaXMgdmFsdWUgYXV0aG9yaXRhdGl2ZSwgbm8gbmVlZCB0byBnbyBkb3duXG4gICAgLy8gdGhlIGRhdGFzdG9yZSBjaGFpbi4gQ29uc2lkZXIgYSBtZW1vcnlzdG9yYWdlIHVzZWQgYXMgYSB0b3AtbGV2ZWwgY2FjaGUuXG4gICAgLy8gaWYgdGhlIG1lbXN0b3JlIGhhcyB0aGUgdmFsdWUsIGl0J3MgaG90IGFuZCB1cC10by1kYXRlLiBPVE9ILCBhXG4gICAgLy8gbG9jYWxzdG9yYWdlIGNhY2hlIG1heSBiZSBhbiBvdXQtb2YtZGF0ZSB2YWx1ZSAodXBkYXRlZCBzaW5jZSBsYXN0IHNlZW4pXG5cbiAgICAvLyB0aGlzIGRlc2lnbiBsZXRzIGhvdCBiZSBzZXQgYnkgdHlwZSBhbmQgaWQuIEluIHBhcnRpY3VsYXIsIHRoZSBnb2FsIGZvciB0aGVcbiAgICAvLyBmcm9udC1lbmQgaXMgdG8gaGF2ZSBwcm9maWxlIG9iamVjdHMgYmUgaG90LWNhY2hlZCBpbiB0aGUgbWVtc3RvcmUsIGJ1dCBub3RoaW5nXG4gICAgLy8gZWxzZSAoaW4gb3JkZXIgdG8gbm90IHJ1biB0aGUgYnJvd3NlciBvdXQgb2YgbWVtb3J5KVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIGhvb2sgYSBub24tdGVybWluYWwgc3RvcmUgaW50byBhIHRlcm1pbmFsIHN0b3JlLlxuICB3aXJlKHN0b3JlLCBzaHV0ZG93blNpZ25hbCkge1xuICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCB3aXJlIGEgdGVybWluYWwgc3RvcmUgaW50byBhbm90aGVyIHN0b3JlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRPRE86IGZpZ3VyZSBvdXQgd2hlcmUgdGhlIHR5cGUgZGF0YSBjb21lcyBmcm9tLlxuICAgICAgc3RvcmUucmVhZCQudGFrZVVudGlsKHNodXRkb3duU2lnbmFsKS5zdWJzY3JpYmUoKHYpID0+IHtcbiAgICAgICAgdGhpcy53cml0ZSh2KTtcbiAgICAgIH0pO1xuICAgICAgc3RvcmUud3JpdGUkLnRha2VVbnRpbChzaHV0ZG93blNpZ25hbCkuc3Vic2NyaWJlKCh2KSA9PiB7XG4gICAgICAgIHYuaW52YWxpZGF0ZS5mb3JFYWNoKChpbnZhbGlkKSA9PiB7XG4gICAgICAgICAgdGhpcy53aXBlKHYudHlwZSwgdi5pZCwgaW52YWxpZCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgd3JpdGUodmFsdWUsIG9wdHMpIHtcbiAgICAvLyBpZiB2YWx1ZS5pZCBleGlzdHMsIHRoaXMgaXMgYW4gdXBkYXRlLiBJZiBpdCBkb2Vzbid0LCBpdCBpcyBhblxuICAgIC8vIGluc2VydC4gSW4gdGhlIGNhc2Ugb2YgYW4gdXBkYXRlLCBpdCBzaG91bGQgbWVyZ2UgZG93biB0aGUgdHJlZS5cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignV3JpdGUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgZ2V0VHlwZSh0KSB7XG4gICAgaWYgKHR5cGVvZiB0ID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHRoaXNbJHR5cGVzXVt0XTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHQ7XG4gICAgfVxuICB9XG5cbiAgYWRkVHlwZSh0KSB7XG4gICAgdGhpc1skdHlwZXNdW3QuJG5hbWVdID0gdDtcbiAgfVxuXG4gIGFkZFR5cGVzKGEpIHtcbiAgICBhLmZvckVhY2godCA9PiB0aGlzLmFkZFR5cGUodCkpO1xuICB9XG5cbiAgLy8gVE9ETzogd3JpdGUgdGhlIHR3by13YXkgaGFzL2dldCBsb2dpYyBpbnRvIHRoaXMgbWV0aG9kXG4gIC8vIGFuZCBwcm92aWRlIG92ZXJyaWRlIGhvb2tzIGZvciByZWFkQXR0cmlidXRlcyByZWFkUmVsYXRpb25zaGlwXG5cbiAgcmVhZCh0eXBlTmFtZSwgaWQsIG9wdHMpIHtcbiAgICBjb25zdCB0eXBlID0gdGhpcy5nZXRUeXBlKHR5cGVOYW1lKTtcbiAgICBjb25zdCBrZXlzID0gb3B0cyAmJiAhQXJyYXkuaXNBcnJheShvcHRzKSA/IFtvcHRzXSA6IG9wdHM7XG4gICAgcmV0dXJuIHRoaXMucmVhZEF0dHJpYnV0ZXModHlwZSwgaWQpXG4gICAgLnRoZW4oYXR0cmlidXRlcyA9PiB7XG4gICAgICBpZiAoYXR0cmlidXRlcykge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkUmVsYXRpb25zaGlwcyh0eXBlLCBpZCwga2V5cylcbiAgICAgICAgLnRoZW4ocmVsYXRpb25zaGlwcyA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IHR5cGUuJG5hbWUsXG4gICAgICAgICAgICBpZCxcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IGF0dHJpYnV0ZXMuYXR0cmlidXRlcyB8fCBhdHRyaWJ1dGVzLFxuICAgICAgICAgICAgcmVsYXRpb25zaGlwczpcbiAgICAgICAgICAgICAgYXR0cmlidXRlcy5yZWxhdGlvbnNoaXBzXG4gICAgICAgICAgICAgICAgPyBtZXJnZU9wdGlvbnMoe30sIGF0dHJpYnV0ZXMucmVsYXRpb25zaGlwcywgcmVsYXRpb25zaGlwcy5yZWxhdGlvbnNoaXBzIHx8IHJlbGF0aW9uc2hpcHMpXG4gICAgICAgICAgICAgICAgOiByZWxhdGlvbnNoaXBzLnJlbGF0aW9uc2hpcHMgfHwgcmVsYXRpb25zaGlwcyxcbiAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICB0aGlzLmZpcmVSZWFkVXBkYXRlKHJlc3VsdCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pO1xuICB9XG5cbiAgYnVsa1JlYWQodHlwZSwgaWQpIHtcbiAgICAvLyBvdmVycmlkZSB0aGlzIGlmIHlvdSB3YW50IHRvIGRvIGFueSBzcGVjaWFsIHByZS1wcm9jZXNzaW5nXG4gICAgLy8gZm9yIHJlYWRpbmcgZnJvbSB0aGUgc3RvcmUgcHJpb3IgdG8gYSBSRVNUIHNlcnZpY2UgZXZlbnRcbiAgICByZXR1cm4gdGhpcy5yZWFkKHR5cGUsIGlkKS50aGVuKGRhdGEgPT4ge1xuICAgICAgcmV0dXJuIHsgZGF0YSwgaW5jbHVkZWQ6IFtdIH07XG4gICAgfSk7XG4gIH1cblxuICByZWFkQXR0cmlidXRlcyh0eXBlLCBpZCkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdyZWFkQXR0cmlidXRlcyBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICByZWFkUmVsYXRpb25zaGlwKHR5cGUsIGlkLCBrZXkpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcigncmVhZFJlbGF0aW9uc2hpcCBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICByZWFkUmVsYXRpb25zaGlwcyh0eXBlLCBpZCwga2V5LCBhdHRyaWJ1dGVzKSB7XG4gICAgY29uc3QgdCA9IHRoaXMuZ2V0VHlwZSh0eXBlKTtcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBrZXksIGl0IGRlZmF1bHRzIHRvIGFsbCByZWxhdGlvbnNoaXBzXG4gICAgLy8gT3RoZXJ3aXNlLCBpdCB3cmFwcyBpdCBpbiBhbiBBcnJheSBpZiBpdCBpc24ndCBhbHJlYWR5IG9uZVxuICAgIGNvbnN0IGtleXMgPSBrZXkgJiYgIUFycmF5LmlzQXJyYXkoa2V5KSA/IFtrZXldIDoga2V5IHx8IFtdO1xuICAgIHJldHVybiBrZXlzLmZpbHRlcihrID0+IGsgaW4gdC4kc2NoZW1hLnJlbGF0aW9uc2hpcHMpLm1hcChyZWxOYW1lID0+IHtcbiAgICAgIHJldHVybiB0aGlzLnJlYWRSZWxhdGlvbnNoaXAodCwgaWQsIHJlbE5hbWUsIGF0dHJpYnV0ZXMpO1xuICAgIH0pLnJlZHVjZSgodGhlbmFibGVBY2MsIHRoZW5hYmxlQ3VycikgPT4ge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbdGhlbmFibGVBY2MsIHRoZW5hYmxlQ3Vycl0pXG4gICAgICAudGhlbigoW2FjYywgY3Vycl0pID0+IHtcbiAgICAgICAgcmV0dXJuIG1lcmdlT3B0aW9ucyhhY2MsIGN1cnIpO1xuICAgICAgfSk7XG4gICAgfSwgQmx1ZWJpcmQucmVzb2x2ZSh7fSkpO1xuICB9XG5cbiAgLy8gd2lwZSBzaG91bGQgcXVpZXRseSBlcmFzZSBhIHZhbHVlIGZyb20gdGhlIHN0b3JlLiBUaGlzIGlzIHVzZWQgZHVyaW5nXG4gIC8vIGNhY2hlIGludmFsaWRhdGlvbiBldmVudHMgd2hlbiB0aGUgY3VycmVudCB2YWx1ZSBpcyBrbm93biB0byBiZSBpbmNvcnJlY3QuXG4gIC8vIGl0IGlzIG5vdCBhIGRlbGV0ZSAod2hpY2ggaXMgYSB1c2VyLWluaXRpYXRlZCwgZXZlbnQtY2F1c2luZyB0aGluZyksIGJ1dFxuICAvLyBzaG91bGQgcmVzdWx0IGluIHRoaXMgdmFsdWUgbm90IHN0b3JlZCBpbiBzdG9yYWdlIGFueW1vcmUuXG5cbiAgd2lwZSh0eXBlLCBpZCwgZmllbGQpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignV2lwZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBkZWxldGUodHlwZSwgaWQpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignRGVsZXRlIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIGFkZCh0eXBlLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUsIGNoaWxkSWQsIGV4dHJhcyA9IHt9KSB7XG4gICAgLy8gYWRkIHRvIGEgaGFzTWFueSByZWxhdGlvbnNoaXBcbiAgICAvLyBub3RlIHRoYXQgaGFzTWFueSBmaWVsZHMgY2FuIGhhdmUgKGltcGwtc3BlY2lmaWMpIHZhbGVuY2UgZGF0YSAobm93IHJlbmFtZWQgZXh0cmFzKVxuICAgIC8vIGV4YW1wbGU6IG1lbWJlcnNoaXAgYmV0d2VlbiBwcm9maWxlIGFuZCBjb21tdW5pdHkgY2FuIGhhdmUgcGVybSAxLCAyLCAzXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0FkZCBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICByZW1vdmUodHlwZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlLCBjaGlsZElkKSB7XG4gICAgLy8gcmVtb3ZlIGZyb20gYSBoYXNNYW55IHJlbGF0aW9uc2hpcFxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdyZW1vdmUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKHR5cGUsIGlkLCByZWxhdGlvbnNoaXBUaXRsZSwgY2hpbGRJZCwgZXh0cmFzID0ge30pIHtcbiAgICAvLyBzaG91bGQgbW9kaWZ5IGFuIGV4aXN0aW5nIGhhc01hbnkgdmFsZW5jZSBkYXRhLiBUaHJvdyBpZiBub3QgZXhpc3RpbmcuXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ21vZGlmeVJlbGF0aW9uc2hpcCBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBxdWVyeShxKSB7XG4gICAgLy8gcToge3R5cGU6IHN0cmluZywgcXVlcnk6IGFueX1cbiAgICAvLyBxLnF1ZXJ5IGlzIGltcGwgZGVmaW5lZCAtIGEgc3RyaW5nIGZvciBzcWwgKHJhdyBzcWwpXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ1F1ZXJ5IG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIGZpcmVXcml0ZVVwZGF0ZSh2YWwpIHtcbiAgICB0aGlzWyR3cml0ZVN1YmplY3RdLm5leHQodmFsKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh2YWwpO1xuICB9XG5cbiAgZmlyZVJlYWRVcGRhdGUodmFsKSB7XG4gICAgdGhpc1skcmVhZFN1YmplY3RdLm5leHQodmFsKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh2YWwpO1xuICB9XG5cbiAgbm90aWZ5VXBkYXRlKHYpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh2KTtcbiAgfVxuXG4gICQkdGVzdEluZGV4KC4uLmFyZ3MpIHtcbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDEpIHtcbiAgICAgIGlmIChhcmdzWzBdLiRpZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBvcGVyYXRpb24gb24gYW4gdW5zYXZlZCBuZXcgbW9kZWwnKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGFyZ3NbMV1bYXJnc1swXS4kaWRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBvcGVyYXRpb24gb24gYW4gdW5zYXZlZCBuZXcgbW9kZWwnKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vLyBjb252ZW5pZW5jZSBmdW5jdGlvbiB0aGF0IHdhbGtzIGFuIGFycmF5IHJlcGxhY2luZyBhbnkge2lkfSB3aXRoIGNvbnRleHQuaWRcblN0b3JhZ2UubWFzc1JlcGxhY2UgPSBmdW5jdGlvbiBtYXNzUmVwbGFjZShibG9jaywgY29udGV4dCkge1xuICByZXR1cm4gYmxvY2subWFwKCh2KSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodikpIHtcbiAgICAgIHJldHVybiBtYXNzUmVwbGFjZSh2LCBjb250ZXh0KTtcbiAgICB9IGVsc2UgaWYgKCh0eXBlb2YgdiA9PT0gJ3N0cmluZycpICYmICh2Lm1hdGNoKC9eXFx7KC4qKVxcfSQvKSkpIHtcbiAgICAgIHJldHVybiBjb250ZXh0W3YubWF0Y2goL15cXHsoLiopXFx9JC8pWzFdXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHY7XG4gICAgfVxuICB9KTtcbn07XG4iXX0=
