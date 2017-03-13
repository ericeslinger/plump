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
          return _this.write(v);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsIiRyZWFkU3ViamVjdCIsIlN5bWJvbCIsIiR3cml0ZVN1YmplY3QiLCIkdHlwZXMiLCJTdG9yYWdlIiwib3B0cyIsInRlcm1pbmFsIiwicmVhZCQiLCJhc09ic2VydmFibGUiLCJ3cml0ZSQiLCJ0eXBlIiwiaWQiLCJzdG9yZSIsInNodXRkb3duU2lnbmFsIiwiRXJyb3IiLCJ0YWtlVW50aWwiLCJzdWJzY3JpYmUiLCJ2Iiwid3JpdGUiLCJpbnZhbGlkYXRlIiwiZm9yRWFjaCIsImludmFsaWQiLCJ3aXBlIiwidmFsdWUiLCJyZWplY3QiLCJ0IiwiJG5hbWUiLCJhIiwiYWRkVHlwZSIsInR5cGVOYW1lIiwiZ2V0VHlwZSIsImtleXMiLCJBcnJheSIsImlzQXJyYXkiLCJyZWFkQXR0cmlidXRlcyIsInRoZW4iLCJhdHRyaWJ1dGVzIiwicmVhZFJlbGF0aW9uc2hpcHMiLCJyZWxhdGlvbnNoaXBzIiwicmVzdWx0IiwiZmlyZVJlYWRVcGRhdGUiLCJyZWFkIiwiZGF0YSIsImluY2x1ZGVkIiwia2V5IiwiZmlsdGVyIiwiayIsIiRzY2hlbWEiLCJtYXAiLCJyZWFkUmVsYXRpb25zaGlwIiwicmVsTmFtZSIsInJlZHVjZSIsInRoZW5hYmxlQWNjIiwidGhlbmFibGVDdXJyIiwiYWxsIiwiYWNjIiwiY3VyciIsInJlc29sdmUiLCJmaWVsZCIsInJlbGF0aW9uc2hpcFRpdGxlIiwiY2hpbGRJZCIsImV4dHJhcyIsInEiLCJ2YWwiLCJuZXh0IiwiYXJncyIsImxlbmd0aCIsIiRpZCIsInVuZGVmaW5lZCIsIm1hc3NSZXBsYWNlIiwiYmxvY2siLCJjb250ZXh0IiwibWF0Y2giXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztxakJBQUE7O0FBRUE7O0lBQVlBLFE7O0FBQ1o7Ozs7QUFDQTs7QUFFQTs7Ozs7Ozs7QUFFQSxJQUFNQyxlQUFlQyxPQUFPLGNBQVAsQ0FBckI7QUFDQSxJQUFNQyxnQkFBZ0JE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S0FBSixDQUFVLDJDQUFWLENBQU47QUFDRDtBQUNGOzs7Ozs7QUFJSDs7O0FBQ0FWLFFBQVFpRSxXQUFSLEdBQXNCLFNBQVNBLFdBQVQsQ0FBcUJDLEtBQXJCLEVBQTRCQyxPQUE1QixFQUFxQztBQUN6RCxTQUFPRCxNQUFNdEIsR0FBTixDQUFVLFVBQUMvQixDQUFELEVBQU87QUFDdEIsUUFBSWUsTUFBTUMsT0FBTixDQUFjaEIsQ0FBZCxDQUFKLEVBQXNCO0FBQ3BCLGFBQU9vRCxZQUFZcEQsQ0FBWixFQUFlc0QsT0FBZixDQUFQO0FBQ0QsS0FGRCxNQUVPLElBQUssT0FBT3RELENBQVAsS0FBYSxRQUFkLElBQTRCQSxFQUFFdUQsS0FBRixDQUFRLFlBQVIsQ0FBaEMsRUFBd0Q7QUFDN0QsYUFBT0QsUUFBUXRELEVBQUV1RCxLQUFGLENBQVEsWUFBUixFQUFzQixDQUF0QixDQUFSLENBQVA7QUFDRCxLQUZNLE1BRUE7QUFDTCxhQUFPdkQsQ0FBUDtBQUNEO0FBQ0YsR0FSTSxDQUFQO0FBU0QsQ0FWRCIsImZpbGUiOiJzdG9yYWdlL3N0b3JhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQgbm8tdW51c2VkLXZhcnM6IDAgKi9cblxuaW1wb3J0ICogYXMgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcbmltcG9ydCB7IFN1YmplY3QgfSBmcm9tICdyeGpzL1J4JztcblxuaW1wb3J0IHsgJHNlbGYsICRhbGwgfSBmcm9tICcuLi9tb2RlbCc7XG5cbmNvbnN0ICRyZWFkU3ViamVjdCA9IFN5bWJvbCgnJHJlYWRTdWJqZWN0Jyk7XG5jb25zdCAkd3JpdGVTdWJqZWN0ID0gU3ltYm9sKCckd3JpdGVTdWJqZWN0Jyk7XG5jb25zdCAkdHlwZXMgPSBTeW1ib2woJyR0eXBlcycpO1xuXG4vLyB0eXBlOiBhbiBvYmplY3QgdGhhdCBkZWZpbmVzIHRoZSB0eXBlLiB0eXBpY2FsbHkgdGhpcyB3aWxsIGJlXG4vLyBwYXJ0IG9mIHRoZSBNb2RlbCBjbGFzcyBoaWVyYXJjaHksIGJ1dCBTdG9yYWdlIG9iamVjdHMgY2FsbCBubyBtZXRob2RzXG4vLyBvbiB0aGUgdHlwZSBvYmplY3QuIFdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gVHlwZS4kbmFtZSwgVHlwZS4kaWQgYW5kIFR5cGUuJHNjaGVtYS5cbi8vIE5vdGUgdGhhdCBUeXBlLiRpZCBpcyB0aGUgKm5hbWUgb2YgdGhlIGlkIGZpZWxkKiBvbiBpbnN0YW5jZXNcbi8vICAgIGFuZCBOT1QgdGhlIGFjdHVhbCBpZCBmaWVsZCAoZS5nLiwgaW4gbW9zdCBjYXNlcywgVHlwZS4kaWQgPT09ICdpZCcpLlxuLy8gaWQ6IHVuaXF1ZSBpZC4gT2Z0ZW4gYW4gaW50ZWdlciwgYnV0IG5vdCBuZWNlc3NhcnkgKGNvdWxkIGJlIGFuIG9pZClcblxuXG4vLyBoYXNNYW55IHJlbGF0aW9uc2hpcHMgYXJlIHRyZWF0ZWQgbGlrZSBpZCBhcnJheXMuIFNvLCBhZGQgLyByZW1vdmUgLyBoYXNcbi8vIGp1c3Qgc3RvcmVzIGFuZCByZW1vdmVzIGludGVnZXJzLlxuXG5leHBvcnQgY2xhc3MgU3RvcmFnZSB7XG5cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgLy8gYSBcInRlcm1pbmFsXCIgc3RvcmFnZSBmYWNpbGl0eSBpcyB0aGUgZW5kIG9mIHRoZSBzdG9yYWdlIGNoYWluLlxuICAgIC8vIHVzdWFsbHkgc3FsIG9uIHRoZSBzZXJ2ZXIgc2lkZSBhbmQgcmVzdCBvbiB0aGUgY2xpZW50IHNpZGUsIGl0ICptdXN0KlxuICAgIC8vIHJlY2VpdmUgdGhlIHdyaXRlcywgYW5kIGlzIHRoZSBmaW5hbCBhdXRob3JpdGF0aXZlIGFuc3dlciBvbiB3aGV0aGVyXG4gICAgLy8gc29tZXRoaW5nIGlzIDQwNC5cblxuICAgIC8vIHRlcm1pbmFsIGZhY2lsaXRpZXMgYXJlIGFsc28gdGhlIG9ubHkgb25lcyB0aGF0IGNhbiBhdXRob3JpdGF0aXZlbHkgYW5zd2VyXG4gICAgLy8gYXV0aG9yaXphdGlvbiBxdWVzdGlvbnMsIGJ1dCB0aGUgZGVzaWduIG1heSBhbGxvdyBmb3IgYXV0aG9yaXphdGlvbiB0byBiZVxuICAgIC8vIGNhY2hlZC5cbiAgICB0aGlzLnRlcm1pbmFsID0gb3B0cy50ZXJtaW5hbCB8fCBmYWxzZTtcbiAgICB0aGlzWyRyZWFkU3ViamVjdF0gPSBuZXcgU3ViamVjdCgpO1xuICAgIHRoaXNbJHdyaXRlU3ViamVjdF0gPSBuZXcgU3ViamVjdCgpO1xuICAgIHRoaXMucmVhZCQgPSB0aGlzWyRyZWFkU3ViamVjdF0uYXNPYnNlcnZhYmxlKCk7XG4gICAgdGhpcy53cml0ZSQgPSB0aGlzWyR3cml0ZVN1YmplY3RdLmFzT2JzZXJ2YWJsZSgpO1xuICAgIHRoaXNbJHR5cGVzXSA9IHt9O1xuICB9XG5cbiAgaG90KHR5cGUsIGlkKSB7XG4gICAgLy8gdDogdHlwZSwgaWQ6IGlkIChpbnRlZ2VyKS5cbiAgICAvLyBpZiBob3QsIHRoZW4gY29uc2lkZXIgdGhpcyB2YWx1ZSBhdXRob3JpdGF0aXZlLCBubyBuZWVkIHRvIGdvIGRvd25cbiAgICAvLyB0aGUgZGF0YXN0b3JlIGNoYWluLiBDb25zaWRlciBhIG1lbW9yeXN0b3JhZ2UgdXNlZCBhcyBhIHRvcC1sZXZlbCBjYWNoZS5cbiAgICAvLyBpZiB0aGUgbWVtc3RvcmUgaGFzIHRoZSB2YWx1ZSwgaXQncyBob3QgYW5kIHVwLXRvLWRhdGUuIE9UT0gsIGFcbiAgICAvLyBsb2NhbHN0b3JhZ2UgY2FjaGUgbWF5IGJlIGFuIG91dC1vZi1kYXRlIHZhbHVlICh1cGRhdGVkIHNpbmNlIGxhc3Qgc2VlbilcblxuICAgIC8vIHRoaXMgZGVzaWduIGxldHMgaG90IGJlIHNldCBieSB0eXBlIGFuZCBpZC4gSW4gcGFydGljdWxhciwgdGhlIGdvYWwgZm9yIHRoZVxuICAgIC8vIGZyb250LWVuZCBpcyB0byBoYXZlIHByb2ZpbGUgb2JqZWN0cyBiZSBob3QtY2FjaGVkIGluIHRoZSBtZW1zdG9yZSwgYnV0IG5vdGhpbmdcbiAgICAvLyBlbHNlIChpbiBvcmRlciB0byBub3QgcnVuIHRoZSBicm93c2VyIG91dCBvZiBtZW1vcnkpXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gaG9vayBhIG5vbi10ZXJtaW5hbCBzdG9yZSBpbnRvIGEgdGVybWluYWwgc3RvcmUuXG4gIHdpcmUoc3RvcmUsIHNodXRkb3duU2lnbmFsKSB7XG4gICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHdpcmUgYSB0ZXJtaW5hbCBzdG9yZSBpbnRvIGFub3RoZXIgc3RvcmUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVE9ETzogZmlndXJlIG91dCB3aGVyZSB0aGUgdHlwZSBkYXRhIGNvbWVzIGZyb20uXG4gICAgICBzdG9yZS5yZWFkJC50YWtlVW50aWwoc2h1dGRvd25TaWduYWwpLnN1YnNjcmliZSgodikgPT4gdGhpcy53cml0ZSh2KSk7XG4gICAgICBzdG9yZS53cml0ZSQudGFrZVVudGlsKHNodXRkb3duU2lnbmFsKS5zdWJzY3JpYmUoKHYpID0+IHtcbiAgICAgICAgdi5pbnZhbGlkYXRlLmZvckVhY2goKGludmFsaWQpID0+IHtcbiAgICAgICAgICB0aGlzLndpcGUodi50eXBlLCB2LmlkLCBpbnZhbGlkKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICB3cml0ZSh2YWx1ZSwgb3B0cykge1xuICAgIC8vIGlmIHZhbHVlLmlkIGV4aXN0cywgdGhpcyBpcyBhbiB1cGRhdGUuIElmIGl0IGRvZXNuJ3QsIGl0IGlzIGFuXG4gICAgLy8gaW5zZXJ0LiBJbiB0aGUgY2FzZSBvZiBhbiB1cGRhdGUsIGl0IHNob3VsZCBtZXJnZSBkb3duIHRoZSB0cmVlLlxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdXcml0ZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBnZXRUeXBlKHQpIHtcbiAgICBpZiAodHlwZW9mIHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gdGhpc1skdHlwZXNdW3RdO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdDtcbiAgICB9XG4gIH1cblxuICBhZGRUeXBlKHQpIHtcbiAgICB0aGlzWyR0eXBlc11bdC4kbmFtZV0gPSB0O1xuICB9XG5cbiAgYWRkVHlwZXMoYSkge1xuICAgIGEuZm9yRWFjaCh0ID0+IHRoaXMuYWRkVHlwZSh0KSk7XG4gIH1cblxuICAvLyBUT0RPOiB3cml0ZSB0aGUgdHdvLXdheSBoYXMvZ2V0IGxvZ2ljIGludG8gdGhpcyBtZXRob2RcbiAgLy8gYW5kIHByb3ZpZGUgb3ZlcnJpZGUgaG9va3MgZm9yIHJlYWRBdHRyaWJ1dGVzIHJlYWRSZWxhdGlvbnNoaXBcblxuICByZWFkKHR5cGVOYW1lLCBpZCwgb3B0cykge1xuICAgIGNvbnN0IHR5cGUgPSB0aGlzLmdldFR5cGUodHlwZU5hbWUpO1xuICAgIGNvbnN0IGtleXMgPSBvcHRzICYmICFBcnJheS5pc0FycmF5KG9wdHMpID8gW29wdHNdIDogb3B0cztcbiAgICByZXR1cm4gdGhpcy5yZWFkQXR0cmlidXRlcyh0eXBlLCBpZClcbiAgICAudGhlbihhdHRyaWJ1dGVzID0+IHtcbiAgICAgIGlmIChhdHRyaWJ1dGVzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWRSZWxhdGlvbnNoaXBzKHR5cGUsIGlkLCBrZXlzKVxuICAgICAgICAudGhlbihyZWxhdGlvbnNoaXBzID0+IHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogdHlwZS4kbmFtZSxcbiAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgYXR0cmlidXRlczogYXR0cmlidXRlcy5hdHRyaWJ1dGVzIHx8IGF0dHJpYnV0ZXMsXG4gICAgICAgICAgICByZWxhdGlvbnNoaXBzOlxuICAgICAgICAgICAgICBhdHRyaWJ1dGVzLnJlbGF0aW9uc2hpcHNcbiAgICAgICAgICAgICAgICA/IG1lcmdlT3B0aW9ucyh7fSwgYXR0cmlidXRlcy5yZWxhdGlvbnNoaXBzLCByZWxhdGlvbnNoaXBzLnJlbGF0aW9uc2hpcHMgfHwgcmVsYXRpb25zaGlwcylcbiAgICAgICAgICAgICAgICA6IHJlbGF0aW9uc2hpcHMucmVsYXRpb25zaGlwcyB8fCByZWxhdGlvbnNoaXBzLFxuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSkudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHRoaXMuZmlyZVJlYWRVcGRhdGUocmVzdWx0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG4gIH1cblxuICBidWxrUmVhZCh0eXBlLCBpZCkge1xuICAgIC8vIG92ZXJyaWRlIHRoaXMgaWYgeW91IHdhbnQgdG8gZG8gYW55IHNwZWNpYWwgcHJlLXByb2Nlc3NpbmdcbiAgICAvLyBmb3IgcmVhZGluZyBmcm9tIHRoZSBzdG9yZSBwcmlvciB0byBhIFJFU1Qgc2VydmljZSBldmVudFxuICAgIHJldHVybiB0aGlzLnJlYWQodHlwZSwgaWQpLnRoZW4oZGF0YSA9PiB7XG4gICAgICByZXR1cm4geyBkYXRhLCBpbmNsdWRlZDogW10gfTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlYWRBdHRyaWJ1dGVzKHR5cGUsIGlkKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ3JlYWRBdHRyaWJ1dGVzIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHJlYWRSZWxhdGlvbnNoaXAodHlwZSwgaWQsIGtleSkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdyZWFkUmVsYXRpb25zaGlwIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHJlYWRSZWxhdGlvbnNoaXBzKHR5cGUsIGlkLCBrZXksIGF0dHJpYnV0ZXMpIHtcbiAgICBjb25zdCB0ID0gdGhpcy5nZXRUeXBlKHR5cGUpO1xuICAgIC8vIElmIHRoZXJlIGlzIG5vIGtleSwgaXQgZGVmYXVsdHMgdG8gYWxsIHJlbGF0aW9uc2hpcHNcbiAgICAvLyBPdGhlcndpc2UsIGl0IHdyYXBzIGl0IGluIGFuIEFycmF5IGlmIGl0IGlzbid0IGFscmVhZHkgb25lXG4gICAgY29uc3Qga2V5cyA9IGtleSAmJiAhQXJyYXkuaXNBcnJheShrZXkpID8gW2tleV0gOiBrZXkgfHwgW107XG4gICAgcmV0dXJuIGtleXMuZmlsdGVyKGsgPT4gayBpbiB0LiRzY2hlbWEucmVsYXRpb25zaGlwcykubWFwKHJlbE5hbWUgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMucmVhZFJlbGF0aW9uc2hpcCh0LCBpZCwgcmVsTmFtZSwgYXR0cmlidXRlcyk7XG4gICAgfSkucmVkdWNlKCh0aGVuYWJsZUFjYywgdGhlbmFibGVDdXJyKSA9PiB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFt0aGVuYWJsZUFjYywgdGhlbmFibGVDdXJyXSlcbiAgICAgIC50aGVuKChbYWNjLCBjdXJyXSkgPT4ge1xuICAgICAgICByZXR1cm4gbWVyZ2VPcHRpb25zKGFjYywgY3Vycik7XG4gICAgICB9KTtcbiAgICB9LCBCbHVlYmlyZC5yZXNvbHZlKHt9KSk7XG4gIH1cblxuICAvLyB3aXBlIHNob3VsZCBxdWlldGx5IGVyYXNlIGEgdmFsdWUgZnJvbSB0aGUgc3RvcmUuIFRoaXMgaXMgdXNlZCBkdXJpbmdcbiAgLy8gY2FjaGUgaW52YWxpZGF0aW9uIGV2ZW50cyB3aGVuIHRoZSBjdXJyZW50IHZhbHVlIGlzIGtub3duIHRvIGJlIGluY29ycmVjdC5cbiAgLy8gaXQgaXMgbm90IGEgZGVsZXRlICh3aGljaCBpcyBhIHVzZXItaW5pdGlhdGVkLCBldmVudC1jYXVzaW5nIHRoaW5nKSwgYnV0XG4gIC8vIHNob3VsZCByZXN1bHQgaW4gdGhpcyB2YWx1ZSBub3Qgc3RvcmVkIGluIHN0b3JhZ2UgYW55bW9yZS5cblxuICB3aXBlKHR5cGUsIGlkLCBmaWVsZCkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdXaXBlIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIGRlbGV0ZSh0eXBlLCBpZCkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdEZWxldGUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgYWRkKHR5cGUsIGlkLCByZWxhdGlvbnNoaXBUaXRsZSwgY2hpbGRJZCwgZXh0cmFzID0ge30pIHtcbiAgICAvLyBhZGQgdG8gYSBoYXNNYW55IHJlbGF0aW9uc2hpcFxuICAgIC8vIG5vdGUgdGhhdCBoYXNNYW55IGZpZWxkcyBjYW4gaGF2ZSAoaW1wbC1zcGVjaWZpYykgdmFsZW5jZSBkYXRhIChub3cgcmVuYW1lZCBleHRyYXMpXG4gICAgLy8gZXhhbXBsZTogbWVtYmVyc2hpcCBiZXR3ZWVuIHByb2ZpbGUgYW5kIGNvbW11bml0eSBjYW4gaGF2ZSBwZXJtIDEsIDIsIDNcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignQWRkIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHJlbW92ZSh0eXBlLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUsIGNoaWxkSWQpIHtcbiAgICAvLyByZW1vdmUgZnJvbSBhIGhhc01hbnkgcmVsYXRpb25zaGlwXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ3JlbW92ZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBtb2RpZnlSZWxhdGlvbnNoaXAodHlwZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlLCBjaGlsZElkLCBleHRyYXMgPSB7fSkge1xuICAgIC8vIHNob3VsZCBtb2RpZnkgYW4gZXhpc3RpbmcgaGFzTWFueSB2YWxlbmNlIGRhdGEuIFRocm93IGlmIG5vdCBleGlzdGluZy5cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignbW9kaWZ5UmVsYXRpb25zaGlwIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHF1ZXJ5KHEpIHtcbiAgICAvLyBxOiB7dHlwZTogc3RyaW5nLCBxdWVyeTogYW55fVxuICAgIC8vIHEucXVlcnkgaXMgaW1wbCBkZWZpbmVkIC0gYSBzdHJpbmcgZm9yIHNxbCAocmF3IHNxbClcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignUXVlcnkgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgZmlyZVdyaXRlVXBkYXRlKHZhbCkge1xuICAgIHRoaXNbJHdyaXRlU3ViamVjdF0ubmV4dCh2YWwpO1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHZhbCk7XG4gIH1cblxuICBmaXJlUmVhZFVwZGF0ZSh2YWwpIHtcbiAgICB0aGlzWyRyZWFkU3ViamVjdF0ubmV4dCh2YWwpO1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHZhbCk7XG4gIH1cblxuICBub3RpZnlVcGRhdGUodikge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHYpO1xuICB9XG5cbiAgJCR0ZXN0SW5kZXgoLi4uYXJncykge1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgaWYgKGFyZ3NbMF0uJGlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbGxlZ2FsIG9wZXJhdGlvbiBvbiBhbiB1bnNhdmVkIG5ldyBtb2RlbCcpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYXJnc1sxXVthcmdzWzBdLiRpZF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbGxlZ2FsIG9wZXJhdGlvbiBvbiBhbiB1bnNhdmVkIG5ldyBtb2RlbCcpO1xuICAgIH1cbiAgfVxufVxuXG5cbi8vIGNvbnZlbmllbmNlIGZ1bmN0aW9uIHRoYXQgd2Fsa3MgYW4gYXJyYXkgcmVwbGFjaW5nIGFueSB7aWR9IHdpdGggY29udGV4dC5pZFxuU3RvcmFnZS5tYXNzUmVwbGFjZSA9IGZ1bmN0aW9uIG1hc3NSZXBsYWNlKGJsb2NrLCBjb250ZXh0KSB7XG4gIHJldHVybiBibG9jay5tYXAoKHYpID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2KSkge1xuICAgICAgcmV0dXJuIG1hc3NSZXBsYWNlKHYsIGNvbnRleHQpO1xuICAgIH0gZWxzZSBpZiAoKHR5cGVvZiB2ID09PSAnc3RyaW5nJykgJiYgKHYubWF0Y2goL15cXHsoLiopXFx9JC8pKSkge1xuICAgICAgcmV0dXJuIGNvbnRleHRbdi5tYXRjaCgvXlxceyguKilcXH0kLylbMV1dO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdjtcbiAgICB9XG4gIH0pO1xufTtcbiJdfQ==
