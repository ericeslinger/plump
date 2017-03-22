'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Storage = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* eslint no-unused-vars: 0 */

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _mergeOptions = require('merge-options');

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _Rx = require('rxjs/Rx');

var _model = require('../model');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

  // Abstract - all stores must provide below:

  _createClass(Storage, [{
    key: 'writeAttributes',
    value: function writeAttributes(value) {
      // if value.id exists, this is an update. If it doesn't, it is an
      // insert. In the case of an update, it should merge down the tree.
      return _bluebird2.default.reject(new Error('writeAttributes not implemented'));
    }
  }, {
    key: 'readAttributes',
    value: function readAttributes(value) {
      return _bluebird2.default.reject(new Error('readAttributes not implemented'));
    }
  }, {
    key: 'cacheAttributes',
    value: function cacheAttributes(value) {
      return _bluebird2.default.reject(new Error('cacheAttributes not implemented'));
    }
  }, {
    key: 'readRelationship',
    value: function readRelationship(value, key) {
      return _bluebird2.default.reject(new Error('readRelationship not implemented'));
    }

    // wipe should quietly erase a value from the store. This is used during
    // cache invalidation events when the current value is known to be incorrect.
    // it is not a delete (which is a user-initiated, event-causing thing), but
    // should result in this value not stored in storage anymore.

  }, {
    key: 'wipe',
    value: function wipe(type, id, field) {
      return _bluebird2.default.reject(new Error('Wipe not implemented'));
    }
  }, {
    key: 'delete',
    value: function _delete(value) {
      return _bluebird2.default.reject(new Error('Delete not implemented'));
    }
  }, {
    key: 'writeRelationshipItem',
    value: function writeRelationshipItem(value, relationshipTitle, child) {
      // add to a hasMany relationship
      // note that hasMany fields can have (impl-specific) valence data (now renamed extras)
      // example: membership between profile and community can have perm 1, 2, 3
      return _bluebird2.default.reject(new Error('write relationship item not implemented'));
    }
  }, {
    key: 'removeRelationshipItem',
    value: function removeRelationshipItem(value, relationshipTitle, childId) {
      // remove from a hasMany relationship
      return _bluebird2.default.reject(new Error('remove not implemented'));
    }
  }, {
    key: 'query',
    value: function query(q) {
      // q: {type: string, query: any}
      // q.query is impl defined - a string for sql (raw sql)
      return _bluebird2.default.reject(new Error('Query not implemented'));
    }

    // convenience function used internally
    // read a bunch of relationships and merge them together.

  }, {
    key: 'readRelationships',
    value: function readRelationships(item, relationships) {
      var _this = this;

      return _bluebird2.default.all(relationships.map(function (r) {
        return _this.readRelationship(r);
      })).then(function (rA) {
        return rA.reduce(function (a, r) {
          return (0, _mergeOptions2.default)(a, r);
        }, { type: item.type, id: item.id, attributes: {}, relationships: {} });
      });
    }

    // read a value from the store.
    // opts is an array of attributes to read - syntax is:
    // 'attributes' (to read the attributes, at least, and is the default)
    // 'relationships' to read all relationships
    // 'relationships.relationshipname' to read a certain relationship only

  }, {
    key: 'read',
    value: function read(item) {
      var _this2 = this;

      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ['attributes'];

      var type = this.getType(item.type);
      var keys = opts && !Array.isArray(opts) ? [opts] : opts;

      return this.readAttributes(item).then(function (attributes) {
        if (!attributes) {
          return null;
        } else {
          var relsWanted = keys.indexOf('relationships') >= 0 ? Object.keys(type.$schema.relationships) : keys.map(function (k) {
            return k.split('.');
          }).filter(function (ka) {
            return ka[0] === 'relationships';
          }).map(function (ka) {
            return ka[1];
          });
          var relsToFetch = relsWanted.filter(function (relName) {
            return !attributes.relationships[relName];
          });
          // readAttributes can return relationship data, so don't fetch those
          if (relsToFetch.length > 0) {
            return _this2.readRelationships(type, relsToFetch).then(function (rels) {
              return (0, _mergeOptions2.default)(attributes, rels);
            });
          } else {
            return attributes;
          }
        }
      }).then(function (result) {
        if (result) {
          _this2.fireReadUpdate(result);
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
      var _this3 = this;

      if (this.terminal) {
        throw new Error('Cannot wire a terminal store into another store');
      } else {
        // TODO: figure out where the type data comes from.
        store.read$.takeUntil(shutdownSignal).subscribe(function (v) {
          _this3.cache(v);
        });
        store.write$.takeUntil(shutdownSignal).subscribe(function (v) {
          v.invalidate.forEach(function (invalid) {
            _this3.wipe(v, invalid);
          });
        });
      }
    }
  }, {
    key: 'validateInput',
    value: function validateInput(value) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var type = this.getType(value.type);
      var retVal = { type: value.type, id: value.id, attributes: {}, relationships: {} };
      var typeAttrs = Object.keys(type.$schema.attributes);
      var valAttrs = Object.keys(value.attributes);
      var typeRels = Object.keys(type.$schema.relationships);
      var valRels = Object.keys(value.relationships);

      var invalidAttrs = valAttrs.filter(function (item) {
        return typeAttrs.indexOf(item) < 0;
      });
      var invalidRels = valRels.filter(function (item) {
        return typeRels.indexOf(item) < 0;
      });

      if (invalidAttrs.length > 0) {
        throw new Error('Invalid attributes on value object: ' + JSON.stringify(invalidAttrs));
      }

      if (invalidRels.length > 0) {
        throw new Error('Invalid relationships on value object: ' + JSON.stringify(invalidRels));
      }

      for (var attrName in type.$schema.attributes) {
        if (!value.attributes[attrName] && type.$schema.attributes[attrName].default !== undefined) {
          if (Array.isArray(type.$schema.attributes[attrName].default)) {
            retVal.attributes[attrName] = type.$schema.attributes[attrName].default.concat();
          } else if (_typeof(type.$schema.attributes[attrName].default) === 'object') {
            retVal.attributes[attrName] = Object.assign(type.$schema.attributes[attrName].default);
          } else {
            retVal.attributes[attrName] = type.$schema.attributes[attrName].default;
          }
        }
      }

      for (var relName in type.$schema.relationships) {
        if (value.relationships[relName] && !Array.isArray(value.relationships[relName])) {
          throw new Error('relation ' + relName + ' is not an array');
        }
      }
      return (0, _mergeOptions2.default)({}, value, retVal);
    }

    // store type info data on the store itself

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
      var _this4 = this;

      a.forEach(function (t) {
        return _this4.addType(t);
      });
    }
  }, {
    key: 'fireWriteUpdate',
    value: function fireWriteUpdate(val) {
      this[$writeSubject].next(val);
      return _bluebird2.default.resolve(val);
    }
  }, {
    key: 'fireReadUpdate',
    value: function fireReadUpdate(val) {
      this[$readSubject].next(val);
      return _bluebird2.default.resolve(val);
    }
  }, {
    key: 'notifyUpdate',
    value: function notifyUpdate(v) {
      return _bluebird2.default.resolve(v);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyIkcmVhZFN1YmplY3QiLCJTeW1ib2wiLCIkd3JpdGVTdWJqZWN0IiwiJHR5cGVzIiwiU3RvcmFnZSIsIm9wdHMiLCJ0ZXJtaW5hbCIsInJlYWQkIiwiYXNPYnNlcnZhYmxlIiwid3JpdGUkIiwidmFsdWUiLCJyZWplY3QiLCJFcnJvciIsImtleSIsInR5cGUiLCJpZCIsImZpZWxkIiwicmVsYXRpb25zaGlwVGl0bGUiLCJjaGlsZCIsImNoaWxkSWQiLCJxIiwiaXRlbSIsInJlbGF0aW9uc2hpcHMiLCJhbGwiLCJtYXAiLCJyZWFkUmVsYXRpb25zaGlwIiwiciIsInRoZW4iLCJyQSIsInJlZHVjZSIsImEiLCJhdHRyaWJ1dGVzIiwiZ2V0VHlwZSIsImtleXMiLCJBcnJheSIsImlzQXJyYXkiLCJyZWFkQXR0cmlidXRlcyIsInJlbHNXYW50ZWQiLCJpbmRleE9mIiwiT2JqZWN0IiwiJHNjaGVtYSIsImsiLCJzcGxpdCIsImZpbHRlciIsImthIiwicmVsc1RvRmV0Y2giLCJyZWxOYW1lIiwibGVuZ3RoIiwicmVhZFJlbGF0aW9uc2hpcHMiLCJyZWxzIiwicmVzdWx0IiwiZmlyZVJlYWRVcGRhdGUiLCJyZWFkIiwiZGF0YSIsImluY2x1ZGVkIiwic3RvcmUiLCJzaHV0ZG93blNpZ25hbCIsInRha2VVbnRpbCIsInN1YnNjcmliZSIsInYiLCJjYWNoZSIsImludmFsaWRhdGUiLCJmb3JFYWNoIiwiaW52YWxpZCIsIndpcGUiLCJyZXRWYWwiLCJ0eXBlQXR0cnMiLCJ2YWxBdHRycyIsInR5cGVSZWxzIiwidmFsUmVscyIsImludmFsaWRBdHRycyIsImludmFsaWRSZWxzIiwiSlNPTiIsInN0cmluZ2lmeSIsImF0dHJOYW1lIiwiZGVmYXVsdCIsInVuZGVmaW5lZCIsImNvbmNhdCIsImFzc2lnbiIsInQiLCIkbmFtZSIsImFkZFR5cGUiLCJ2YWwiLCJuZXh0IiwicmVzb2x2ZSIsImFyZ3MiLCIkaWQiLCJtYXNzUmVwbGFjZSIsImJsb2NrIiwiY29udGV4dCIsIm1hdGNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7cWpCQUFBOztBQUVBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFFQTs7Ozs7O0FBRUEsSUFBTUEsZUFBZUMsT0FBTyxjQUFQLENBQXJCO0FBQ0EsSUFBTUMsZ0JBQWdCRCxPQUFPLGVBQVAsQ0FBdEI7QUFDQSxJQUFNRSxTQUFTRixPQUFPLFFBQVAsQ0FBZjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0lBRWFHLE8sV0FBQUEsTztBQUVYLHFCQUF1QjtBQUFBLFFBQVhDLElBQVcsdUVBQUosRUFBSTs7QUFBQTs7QUFDckI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsU0FBS0MsUUFBTCxHQUFnQkQsS0FBS0MsUUFBTCxJQUFpQixLQUFqQztBQUNBLFNBQUtOLFlBQUwsSUFBcUIsaUJBQXJCO0FBQ0EsU0FBS0UsYUFBTCxJQUFzQixpQkFBdEI7QUFDQSxTQUFLSyxLQUFMLEdBQWEsS0FBS1AsWUFBTCxFQUFtQlEsWUFBbkIsRUFBYjtBQUNBLFNBQUtDLE1BQUwsR0FBYyxLQUFLUCxhQUFMLEVBQW9CTSxZQUFwQixFQUFkO0FBQ0EsU0FBS0wsTUFBTCxJQUFlLEVBQWY7QUFDRDs7QUFFRDs7OztvQ0FFZ0JPLEssRUFBTztBQUNyQjtBQUNBO0FBQ0EsYUFBTyxtQkFBU0MsTUFBVCxDQUFnQixJQUFJQyxLQUFKLENBQVUsaUNBQVYsQ0FBaEIsQ0FBUDtBQUNEOzs7bUNBRWNGLEssRUFBTztBQUNwQixhQUFPLG1CQUFTQyxNQUFULENBQWdCLElBQUlDLEtBQUosQ0FBVSxnQ0FBVixDQUFoQixDQUFQO0FBQ0Q7OztvQ0FFZUYsSyxFQUFPO0FBQ3JCLGFBQU8sbUJBQVNDLE1BQVQsQ0FBZ0IsSUFBSUMsS0FBSixDQUFVLGlDQUFWLENBQWhCLENBQVA7QUFDRDs7O3FDQUVnQkYsSyxFQUFPRyxHLEVBQUs7QUFDM0IsYUFBTyxtQkFBU0YsTUFBVCxDQUFnQixJQUFJQyxLQUFKLENBQVUsa0NBQVYsQ0FBaEIsQ0FBUDtBQUNEOztBQUVEO0FBQ0E7QUFDQTtBQUNBOzs7O3lCQUVLRSxJLEVBQU1DLEUsRUFBSUMsSyxFQUFPO0FBQ3BCLGFBQU8sbUJBQVNMLE1BQVQsQ0FBZ0IsSUFBSUMsS0FBSixDQUFVLHNCQUFWLENBQWhCLENBQVA7QUFDRDs7OzRCQUVNRixLLEVBQU87QUFDWixhQUFPLG1CQUFTQyxNQUFULENBQWdCLElBQUlDLEtBQUosQ0FBVSx3QkFBVixDQUFoQixDQUFQO0FBQ0Q7OzswQ0FFcUJGLEssRUFBT08saUIsRUFBbUJDLEssRUFBTztBQUNyRDtBQUNBO0FBQ0E7QUFDQSxhQUFPLG1CQUFTUCxNQUFULENBQWdCLElBQUlDLEtBQUosQ0FBVSx5Q0FBVixDQUFoQixDQUFQO0FBQ0Q7OzsyQ0FFc0JGLEssRUFBT08saUIsRUFBbUJFLE8sRUFBUztBQUN4RDtBQUNBLGFBQU8sbUJBQVNSLE1BQVQsQ0FBZ0IsSUFBSUMsS0FBSixDQUFVLHdCQUFWLENBQWhCLENBQVA7QUFDRDs7OzBCQUVLUSxDLEVBQUc7QUFDUDtBQUNBO0FBQ0EsYUFBTyxtQkFBU1QsTUFBVCxDQUFnQixJQUFJQyxLQUFKLENBQVUsdUJBQVYsQ0FBaEIsQ0FBUDtBQUNEOztBQUVEO0FBQ0E7Ozs7c0NBQ2tCUyxJLEVBQU1DLGEsRUFBZTtBQUFBOztBQUNyQyxhQUFPLG1CQUFTQyxHQUFULENBQWFELGNBQWNFLEdBQWQsQ0FBa0I7QUFBQSxlQUFLLE1BQUtDLGdCQUFMLENBQXNCQyxDQUF0QixDQUFMO0FBQUEsT0FBbEIsQ0FBYixFQUNOQyxJQURNLENBRUw7QUFBQSxlQUFNQyxHQUFHQyxNQUFILENBQVUsVUFBQ0MsQ0FBRCxFQUFJSixDQUFKO0FBQUEsaUJBQVUsNEJBQWFJLENBQWIsRUFBZ0JKLENBQWhCLENBQVY7QUFBQSxTQUFWLEVBQXdDLEVBQUVaLE1BQU1PLEtBQUtQLElBQWIsRUFBbUJDLElBQUlNLEtBQUtOLEVBQTVCLEVBQWdDZ0IsWUFBWSxFQUE1QyxFQUFnRFQsZUFBZSxFQUEvRCxFQUF4QyxDQUFOO0FBQUEsT0FGSyxDQUFQO0FBSUQ7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozt5QkFFS0QsSSxFQUE2QjtBQUFBOztBQUFBLFVBQXZCaEIsSUFBdUIsdUVBQWhCLENBQUMsWUFBRCxDQUFnQjs7QUFDaEMsVUFBTVMsT0FBTyxLQUFLa0IsT0FBTCxDQUFhWCxLQUFLUCxJQUFsQixDQUFiO0FBQ0EsVUFBTW1CLE9BQU81QixRQUFRLENBQUM2QixNQUFNQyxPQUFOLENBQWM5QixJQUFkLENBQVQsR0FBK0IsQ0FBQ0EsSUFBRCxDQUEvQixHQUF3Q0EsSUFBckQ7O0FBRUEsYUFBTyxLQUFLK0IsY0FBTCxDQUFvQmYsSUFBcEIsRUFDTk0sSUFETSxDQUNELHNCQUFjO0FBQ2xCLFlBQUksQ0FBQ0ksVUFBTCxFQUFpQjtBQUNmLGlCQUFPLElBQVA7QUFDRCxTQUZELE1BRU87QUFDTCxjQUFNTSxhQUFjSixLQUFLSyxPQUFMLENBQWEsZUFBYixLQUFpQyxDQUFsQyxHQUNmQyxPQUFPTixJQUFQLENBQVluQixLQUFLMEIsT0FBTCxDQUFhbEIsYUFBekIsQ0FEZSxHQUVmVyxLQUFLVCxHQUFMLENBQVM7QUFBQSxtQkFBS2lCLEVBQUVDLEtBQUYsQ0FBUSxHQUFSLENBQUw7QUFBQSxXQUFULEVBQ0NDLE1BREQsQ0FDUTtBQUFBLG1CQUFNQyxHQUFHLENBQUgsTUFBVSxlQUFoQjtBQUFBLFdBRFIsRUFFQ3BCLEdBRkQsQ0FFSztBQUFBLG1CQUFNb0IsR0FBRyxDQUFILENBQU47QUFBQSxXQUZMLENBRko7QUFLQSxjQUFNQyxjQUFjUixXQUFXTSxNQUFYLENBQWtCO0FBQUEsbUJBQVcsQ0FBQ1osV0FBV1QsYUFBWCxDQUF5QndCLE9BQXpCLENBQVo7QUFBQSxXQUFsQixDQUFwQjtBQUNBO0FBQ0EsY0FBSUQsWUFBWUUsTUFBWixHQUFxQixDQUF6QixFQUE0QjtBQUMxQixtQkFBTyxPQUFLQyxpQkFBTCxDQUF1QmxDLElBQXZCLEVBQTZCK0IsV0FBN0IsRUFDTmxCLElBRE0sQ0FDRDtBQUFBLHFCQUFRLDRCQUFhSSxVQUFiLEVBQXlCa0IsSUFBekIsQ0FBUjtBQUFBLGFBREMsQ0FBUDtBQUVELFdBSEQsTUFHTztBQUNMLG1CQUFPbEIsVUFBUDtBQUNEO0FBQ0Y7QUFDRixPQW5CTSxFQW1CSkosSUFuQkksQ0FtQkMsVUFBQ3VCLE1BQUQsRUFBWTtBQUNsQixZQUFJQSxNQUFKLEVBQVk7QUFDVixpQkFBS0MsY0FBTCxDQUFvQkQsTUFBcEI7QUFDRDtBQUNELGVBQU9BLE1BQVA7QUFDRCxPQXhCTSxDQUFQO0FBeUJEOzs7NkJBRVFwQyxJLEVBQU1DLEUsRUFBSTtBQUNqQjtBQUNBO0FBQ0EsYUFBTyxLQUFLcUMsSUFBTCxDQUFVdEMsSUFBVixFQUFnQkMsRUFBaEIsRUFBb0JZLElBQXBCLENBQXlCLGdCQUFRO0FBQ3RDLGVBQU8sRUFBRTBCLFVBQUYsRUFBUUMsVUFBVSxFQUFsQixFQUFQO0FBQ0QsT0FGTSxDQUFQO0FBR0Q7Ozt3QkFHR3hDLEksRUFBTUMsRSxFQUFJO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxhQUFPLEtBQVA7QUFDRDs7QUFFRDs7Ozt5QkFDS3dDLEssRUFBT0MsYyxFQUFnQjtBQUFBOztBQUMxQixVQUFJLEtBQUtsRCxRQUFULEVBQW1CO0FBQ2pCLGNBQU0sSUFBSU0sS0FBSixDQUFVLGlEQUFWLENBQU47QUFDRCxPQUZELE1BRU87QUFDTDtBQUNBMkMsY0FBTWhELEtBQU4sQ0FBWWtELFNBQVosQ0FBc0JELGNBQXRCLEVBQXNDRSxTQUF0QyxDQUFnRCxVQUFDQyxDQUFELEVBQU87QUFDckQsaUJBQUtDLEtBQUwsQ0FBV0QsQ0FBWDtBQUNELFNBRkQ7QUFHQUosY0FBTTlDLE1BQU4sQ0FBYWdELFNBQWIsQ0FBdUJELGNBQXZCLEVBQXVDRSxTQUF2QyxDQUFpRCxVQUFDQyxDQUFELEVBQU87QUFDdERBLFlBQUVFLFVBQUYsQ0FBYUMsT0FBYixDQUFxQixVQUFDQyxPQUFELEVBQWE7QUFDaEMsbUJBQUtDLElBQUwsQ0FBVUwsQ0FBVixFQUFhSSxPQUFiO0FBQ0QsV0FGRDtBQUdELFNBSkQ7QUFLRDtBQUNGOzs7a0NBRWFyRCxLLEVBQWtCO0FBQUEsVUFBWEwsSUFBVyx1RUFBSixFQUFJOztBQUM5QixVQUFNUyxPQUFPLEtBQUtrQixPQUFMLENBQWF0QixNQUFNSSxJQUFuQixDQUFiO0FBQ0EsVUFBTW1ELFNBQVMsRUFBRW5ELE1BQU1KLE1BQU1JLElBQWQsRUFBb0JDLElBQUlMLE1BQU1LLEVBQTlCLEVBQWtDZ0IsWUFBWSxFQUE5QyxFQUFrRFQsZUFBZSxFQUFqRSxFQUFmO0FBQ0EsVUFBTTRDLFlBQVkzQixPQUFPTixJQUFQLENBQVluQixLQUFLMEIsT0FBTCxDQUFhVCxVQUF6QixDQUFsQjtBQUNBLFVBQU1vQyxXQUFXNUIsT0FBT04sSUFBUCxDQUFZdkIsTUFBTXFCLFVBQWxCLENBQWpCO0FBQ0EsVUFBTXFDLFdBQVc3QixPQUFPTixJQUFQLENBQVluQixLQUFLMEIsT0FBTCxDQUFhbEIsYUFBekIsQ0FBakI7QUFDQSxVQUFNK0MsVUFBVTlCLE9BQU9OLElBQVAsQ0FBWXZCLE1BQU1ZLGFBQWxCLENBQWhCOztBQUVBLFVBQU1nRCxlQUFlSCxTQUFTeEIsTUFBVCxDQUFnQjtBQUFBLGVBQVF1QixVQUFVNUIsT0FBVixDQUFrQmpCLElBQWxCLElBQTBCLENBQWxDO0FBQUEsT0FBaEIsQ0FBckI7QUFDQSxVQUFNa0QsY0FBY0YsUUFBUTFCLE1BQVIsQ0FBZTtBQUFBLGVBQVF5QixTQUFTOUIsT0FBVCxDQUFpQmpCLElBQWpCLElBQXlCLENBQWpDO0FBQUEsT0FBZixDQUFwQjs7QUFFQSxVQUFJaUQsYUFBYXZCLE1BQWIsR0FBc0IsQ0FBMUIsRUFBNkI7QUFDM0IsY0FBTSxJQUFJbkMsS0FBSiwwQ0FBaUQ0RCxLQUFLQyxTQUFMLENBQWVILFlBQWYsQ0FBakQsQ0FBTjtBQUNEOztBQUVELFVBQUlDLFlBQVl4QixNQUFaLEdBQXFCLENBQXpCLEVBQTRCO0FBQzFCLGNBQU0sSUFBSW5DLEtBQUosNkNBQW9ENEQsS0FBS0MsU0FBTCxDQUFlRixXQUFmLENBQXBELENBQU47QUFDRDs7QUFHRCxXQUFLLElBQU1HLFFBQVgsSUFBdUI1RCxLQUFLMEIsT0FBTCxDQUFhVCxVQUFwQyxFQUFnRDtBQUM5QyxZQUFJLENBQUNyQixNQUFNcUIsVUFBTixDQUFpQjJDLFFBQWpCLENBQUQsSUFBZ0M1RCxLQUFLMEIsT0FBTCxDQUFhVCxVQUFiLENBQXdCMkMsUUFBeEIsRUFBa0NDLE9BQWxDLEtBQThDQyxTQUFsRixFQUE4RjtBQUM1RixjQUFJMUMsTUFBTUMsT0FBTixDQUFjckIsS0FBSzBCLE9BQUwsQ0FBYVQsVUFBYixDQUF3QjJDLFFBQXhCLEVBQWtDQyxPQUFoRCxDQUFKLEVBQThEO0FBQzVEVixtQkFBT2xDLFVBQVAsQ0FBa0IyQyxRQUFsQixJQUE4QjVELEtBQUswQixPQUFMLENBQWFULFVBQWIsQ0FBd0IyQyxRQUF4QixFQUFrQ0MsT0FBbEMsQ0FBMENFLE1BQTFDLEVBQTlCO0FBQ0QsV0FGRCxNQUVPLElBQUksUUFBTy9ELEtBQUswQixPQUFMLENBQWFULFVBQWIsQ0FBd0IyQyxRQUF4QixFQUFrQ0MsT0FBekMsTUFBcUQsUUFBekQsRUFBbUU7QUFDeEVWLG1CQUFPbEMsVUFBUCxDQUFrQjJDLFFBQWxCLElBQThCbkMsT0FBT3VDLE1BQVAsQ0FBY2hFLEtBQUswQixPQUFMLENBQWFULFVBQWIsQ0FBd0IyQyxRQUF4QixFQUFrQ0MsT0FBaEQsQ0FBOUI7QUFDRCxXQUZNLE1BRUE7QUFDTFYsbUJBQU9sQyxVQUFQLENBQWtCMkMsUUFBbEIsSUFBOEI1RCxLQUFLMEIsT0FBTCxDQUFhVCxVQUFiLENBQXdCMkMsUUFBeEIsRUFBa0NDLE9BQWhFO0FBQ0Q7QUFDRjtBQUNGOztBQUVELFdBQUssSUFBTTdCLE9BQVgsSUFBc0JoQyxLQUFLMEIsT0FBTCxDQUFhbEIsYUFBbkMsRUFBa0Q7QUFDaEQsWUFBSVosTUFBTVksYUFBTixDQUFvQndCLE9BQXBCLEtBQWdDLENBQUNaLE1BQU1DLE9BQU4sQ0FBY3pCLE1BQU1ZLGFBQU4sQ0FBb0J3QixPQUFwQixDQUFkLENBQXJDLEVBQWtGO0FBQ2hGLGdCQUFNLElBQUlsQyxLQUFKLGVBQXNCa0MsT0FBdEIsc0JBQU47QUFDRDtBQUNGO0FBQ0QsYUFBTyw0QkFBYSxFQUFiLEVBQWlCcEMsS0FBakIsRUFBd0J1RCxNQUF4QixDQUFQO0FBQ0Q7O0FBRUQ7Ozs7NEJBRVFjLEMsRUFBRztBQUNULFVBQUksT0FBT0EsQ0FBUCxLQUFhLFFBQWpCLEVBQTJCO0FBQ3pCLGVBQU8sS0FBSzVFLE1BQUwsRUFBYTRFLENBQWIsQ0FBUDtBQUNELE9BRkQsTUFFTztBQUNMLGVBQU9BLENBQVA7QUFDRDtBQUNGOzs7NEJBRU9BLEMsRUFBRztBQUNULFdBQUs1RSxNQUFMLEVBQWE0RSxFQUFFQyxLQUFmLElBQXdCRCxDQUF4QjtBQUNEOzs7NkJBRVFqRCxDLEVBQUc7QUFBQTs7QUFDVkEsUUFBRWdDLE9BQUYsQ0FBVTtBQUFBLGVBQUssT0FBS21CLE9BQUwsQ0FBYUYsQ0FBYixDQUFMO0FBQUEsT0FBVjtBQUNEOzs7b0NBR2VHLEcsRUFBSztBQUNuQixXQUFLaEYsYUFBTCxFQUFvQmlGLElBQXBCLENBQXlCRCxHQUF6QjtBQUNBLGFBQU8sbUJBQVNFLE9BQVQsQ0FBaUJGLEdBQWpCLENBQVA7QUFDRDs7O21DQUVjQSxHLEVBQUs7QUFDbEIsV0FBS2xGLFlBQUwsRUFBbUJtRixJQUFuQixDQUF3QkQsR0FBeEI7QUFDQSxhQUFPLG1CQUFTRSxPQUFULENBQWlCRixHQUFqQixDQUFQO0FBQ0Q7OztpQ0FFWXZCLEMsRUFBRztBQUNkLGFBQU8sbUJBQVN5QixPQUFULENBQWlCekIsQ0FBakIsQ0FBUDtBQUNEOzs7a0NBRW9CO0FBQUEsd0NBQU4wQixJQUFNO0FBQU5BLFlBQU07QUFBQTs7QUFDbkIsVUFBSUEsS0FBS3RDLE1BQUwsS0FBZ0IsQ0FBcEIsRUFBdUI7QUFDckIsWUFBSXNDLEtBQUssQ0FBTCxFQUFRQyxHQUFSLEtBQWdCVixTQUFwQixFQUErQjtBQUM3QixnQkFBTSxJQUFJaEUsS0FBSixDQUFVLDJDQUFWLENBQU47QUFDRDtBQUNGLE9BSkQsTUFJTyxJQUFJeUUsS0FBSyxDQUFMLEVBQVFBLEtBQUssQ0FBTCxFQUFRQyxHQUFoQixNQUF5QlYsU0FBN0IsRUFBd0M7QUFDN0MsY0FBTSxJQUFJaEUsS0FBSixDQUFVLDJDQUFWLENBQU47QUFDRDtBQUNGOzs7Ozs7QUFJSDs7O0FBQ0FSLFFBQVFtRixXQUFSLEdBQXNCLFNBQVNBLFdBQVQsQ0FBcUJDLEtBQXJCLEVBQTRCQyxPQUE1QixFQUFxQztBQUN6RCxTQUFPRCxNQUFNaEUsR0FBTixDQUFVLFVBQUNtQyxDQUFELEVBQU87QUFDdEIsUUFBSXpCLE1BQU1DLE9BQU4sQ0FBY3dCLENBQWQsQ0FBSixFQUFzQjtBQUNwQixhQUFPNEIsWUFBWTVCLENBQVosRUFBZThCLE9BQWYsQ0FBUDtBQUNELEtBRkQsTUFFTyxJQUFLLE9BQU85QixDQUFQLEtBQWEsUUFBZCxJQUE0QkEsRUFBRStCLEtBQUYsQ0FBUSxZQUFSLENBQWhDLEVBQXdEO0FBQzdELGFBQU9ELFFBQVE5QixFQUFFK0IsS0FBRixDQUFRLFlBQVIsRUFBc0IsQ0FBdEIsQ0FBUixDQUFQO0FBQ0QsS0FGTSxNQUVBO0FBQ0wsYUFBTy9CLENBQVA7QUFDRDtBQUNGLEdBUk0sQ0FBUDtBQVNELENBVkQiLCJmaWxlIjoic3RvcmFnZS9zdG9yYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50IG5vLXVudXNlZC12YXJzOiAwICovXG5cbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgbWVyZ2VPcHRpb25zIGZyb20gJ21lcmdlLW9wdGlvbnMnO1xuaW1wb3J0IHsgU3ViamVjdCB9IGZyb20gJ3J4anMvUngnO1xuXG5pbXBvcnQgeyAkc2VsZiwgJGFsbCB9IGZyb20gJy4uL21vZGVsJztcblxuY29uc3QgJHJlYWRTdWJqZWN0ID0gU3ltYm9sKCckcmVhZFN1YmplY3QnKTtcbmNvbnN0ICR3cml0ZVN1YmplY3QgPSBTeW1ib2woJyR3cml0ZVN1YmplY3QnKTtcbmNvbnN0ICR0eXBlcyA9IFN5bWJvbCgnJHR5cGVzJyk7XG5cbi8vIHR5cGU6IGFuIG9iamVjdCB0aGF0IGRlZmluZXMgdGhlIHR5cGUuIHR5cGljYWxseSB0aGlzIHdpbGwgYmVcbi8vIHBhcnQgb2YgdGhlIE1vZGVsIGNsYXNzIGhpZXJhcmNoeSwgYnV0IFN0b3JhZ2Ugb2JqZWN0cyBjYWxsIG5vIG1ldGhvZHNcbi8vIG9uIHRoZSB0eXBlIG9iamVjdC4gV2Ugb25seSBhcmUgaW50ZXJlc3RlZCBpbiBUeXBlLiRuYW1lLCBUeXBlLiRpZCBhbmQgVHlwZS4kc2NoZW1hLlxuLy8gTm90ZSB0aGF0IFR5cGUuJGlkIGlzIHRoZSAqbmFtZSBvZiB0aGUgaWQgZmllbGQqIG9uIGluc3RhbmNlc1xuLy8gICAgYW5kIE5PVCB0aGUgYWN0dWFsIGlkIGZpZWxkIChlLmcuLCBpbiBtb3N0IGNhc2VzLCBUeXBlLiRpZCA9PT0gJ2lkJykuXG4vLyBpZDogdW5pcXVlIGlkLiBPZnRlbiBhbiBpbnRlZ2VyLCBidXQgbm90IG5lY2Vzc2FyeSAoY291bGQgYmUgYW4gb2lkKVxuXG5cbi8vIGhhc01hbnkgcmVsYXRpb25zaGlwcyBhcmUgdHJlYXRlZCBsaWtlIGlkIGFycmF5cy4gU28sIGFkZCAvIHJlbW92ZSAvIGhhc1xuLy8ganVzdCBzdG9yZXMgYW5kIHJlbW92ZXMgaW50ZWdlcnMuXG5cbmV4cG9ydCBjbGFzcyBTdG9yYWdlIHtcblxuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICAvLyBhIFwidGVybWluYWxcIiBzdG9yYWdlIGZhY2lsaXR5IGlzIHRoZSBlbmQgb2YgdGhlIHN0b3JhZ2UgY2hhaW4uXG4gICAgLy8gdXN1YWxseSBzcWwgb24gdGhlIHNlcnZlciBzaWRlIGFuZCByZXN0IG9uIHRoZSBjbGllbnQgc2lkZSwgaXQgKm11c3QqXG4gICAgLy8gcmVjZWl2ZSB0aGUgd3JpdGVzLCBhbmQgaXMgdGhlIGZpbmFsIGF1dGhvcml0YXRpdmUgYW5zd2VyIG9uIHdoZXRoZXJcbiAgICAvLyBzb21ldGhpbmcgaXMgNDA0LlxuXG4gICAgLy8gdGVybWluYWwgZmFjaWxpdGllcyBhcmUgYWxzbyB0aGUgb25seSBvbmVzIHRoYXQgY2FuIGF1dGhvcml0YXRpdmVseSBhbnN3ZXJcbiAgICAvLyBhdXRob3JpemF0aW9uIHF1ZXN0aW9ucywgYnV0IHRoZSBkZXNpZ24gbWF5IGFsbG93IGZvciBhdXRob3JpemF0aW9uIHRvIGJlXG4gICAgLy8gY2FjaGVkLlxuICAgIHRoaXMudGVybWluYWwgPSBvcHRzLnRlcm1pbmFsIHx8IGZhbHNlO1xuICAgIHRoaXNbJHJlYWRTdWJqZWN0XSA9IG5ldyBTdWJqZWN0KCk7XG4gICAgdGhpc1skd3JpdGVTdWJqZWN0XSA9IG5ldyBTdWJqZWN0KCk7XG4gICAgdGhpcy5yZWFkJCA9IHRoaXNbJHJlYWRTdWJqZWN0XS5hc09ic2VydmFibGUoKTtcbiAgICB0aGlzLndyaXRlJCA9IHRoaXNbJHdyaXRlU3ViamVjdF0uYXNPYnNlcnZhYmxlKCk7XG4gICAgdGhpc1skdHlwZXNdID0ge307XG4gIH1cblxuICAvLyBBYnN0cmFjdCAtIGFsbCBzdG9yZXMgbXVzdCBwcm92aWRlIGJlbG93OlxuXG4gIHdyaXRlQXR0cmlidXRlcyh2YWx1ZSkge1xuICAgIC8vIGlmIHZhbHVlLmlkIGV4aXN0cywgdGhpcyBpcyBhbiB1cGRhdGUuIElmIGl0IGRvZXNuJ3QsIGl0IGlzIGFuXG4gICAgLy8gaW5zZXJ0LiBJbiB0aGUgY2FzZSBvZiBhbiB1cGRhdGUsIGl0IHNob3VsZCBtZXJnZSBkb3duIHRoZSB0cmVlLlxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCd3cml0ZUF0dHJpYnV0ZXMgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgcmVhZEF0dHJpYnV0ZXModmFsdWUpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcigncmVhZEF0dHJpYnV0ZXMgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgY2FjaGVBdHRyaWJ1dGVzKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ2NhY2hlQXR0cmlidXRlcyBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICByZWFkUmVsYXRpb25zaGlwKHZhbHVlLCBrZXkpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcigncmVhZFJlbGF0aW9uc2hpcCBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICAvLyB3aXBlIHNob3VsZCBxdWlldGx5IGVyYXNlIGEgdmFsdWUgZnJvbSB0aGUgc3RvcmUuIFRoaXMgaXMgdXNlZCBkdXJpbmdcbiAgLy8gY2FjaGUgaW52YWxpZGF0aW9uIGV2ZW50cyB3aGVuIHRoZSBjdXJyZW50IHZhbHVlIGlzIGtub3duIHRvIGJlIGluY29ycmVjdC5cbiAgLy8gaXQgaXMgbm90IGEgZGVsZXRlICh3aGljaCBpcyBhIHVzZXItaW5pdGlhdGVkLCBldmVudC1jYXVzaW5nIHRoaW5nKSwgYnV0XG4gIC8vIHNob3VsZCByZXN1bHQgaW4gdGhpcyB2YWx1ZSBub3Qgc3RvcmVkIGluIHN0b3JhZ2UgYW55bW9yZS5cblxuICB3aXBlKHR5cGUsIGlkLCBmaWVsZCkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdXaXBlIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIGRlbGV0ZSh2YWx1ZSkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdEZWxldGUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgd3JpdGVSZWxhdGlvbnNoaXBJdGVtKHZhbHVlLCByZWxhdGlvbnNoaXBUaXRsZSwgY2hpbGQpIHtcbiAgICAvLyBhZGQgdG8gYSBoYXNNYW55IHJlbGF0aW9uc2hpcFxuICAgIC8vIG5vdGUgdGhhdCBoYXNNYW55IGZpZWxkcyBjYW4gaGF2ZSAoaW1wbC1zcGVjaWZpYykgdmFsZW5jZSBkYXRhIChub3cgcmVuYW1lZCBleHRyYXMpXG4gICAgLy8gZXhhbXBsZTogbWVtYmVyc2hpcCBiZXR3ZWVuIHByb2ZpbGUgYW5kIGNvbW11bml0eSBjYW4gaGF2ZSBwZXJtIDEsIDIsIDNcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignd3JpdGUgcmVsYXRpb25zaGlwIGl0ZW0gbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgcmVtb3ZlUmVsYXRpb25zaGlwSXRlbSh2YWx1ZSwgcmVsYXRpb25zaGlwVGl0bGUsIGNoaWxkSWQpIHtcbiAgICAvLyByZW1vdmUgZnJvbSBhIGhhc01hbnkgcmVsYXRpb25zaGlwXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ3JlbW92ZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBxdWVyeShxKSB7XG4gICAgLy8gcToge3R5cGU6IHN0cmluZywgcXVlcnk6IGFueX1cbiAgICAvLyBxLnF1ZXJ5IGlzIGltcGwgZGVmaW5lZCAtIGEgc3RyaW5nIGZvciBzcWwgKHJhdyBzcWwpXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ1F1ZXJ5IG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIC8vIGNvbnZlbmllbmNlIGZ1bmN0aW9uIHVzZWQgaW50ZXJuYWxseVxuICAvLyByZWFkIGEgYnVuY2ggb2YgcmVsYXRpb25zaGlwcyBhbmQgbWVyZ2UgdGhlbSB0b2dldGhlci5cbiAgcmVhZFJlbGF0aW9uc2hpcHMoaXRlbSwgcmVsYXRpb25zaGlwcykge1xuICAgIHJldHVybiBCbHVlYmlyZC5hbGwocmVsYXRpb25zaGlwcy5tYXAociA9PiB0aGlzLnJlYWRSZWxhdGlvbnNoaXAocikpKVxuICAgIC50aGVuKFxuICAgICAgckEgPT4gckEucmVkdWNlKChhLCByKSA9PiBtZXJnZU9wdGlvbnMoYSwgciksIHsgdHlwZTogaXRlbS50eXBlLCBpZDogaXRlbS5pZCwgYXR0cmlidXRlczoge30sIHJlbGF0aW9uc2hpcHM6IHt9IH0pXG4gICAgKTtcbiAgfVxuXG4gIC8vIHJlYWQgYSB2YWx1ZSBmcm9tIHRoZSBzdG9yZS5cbiAgLy8gb3B0cyBpcyBhbiBhcnJheSBvZiBhdHRyaWJ1dGVzIHRvIHJlYWQgLSBzeW50YXggaXM6XG4gIC8vICdhdHRyaWJ1dGVzJyAodG8gcmVhZCB0aGUgYXR0cmlidXRlcywgYXQgbGVhc3QsIGFuZCBpcyB0aGUgZGVmYXVsdClcbiAgLy8gJ3JlbGF0aW9uc2hpcHMnIHRvIHJlYWQgYWxsIHJlbGF0aW9uc2hpcHNcbiAgLy8gJ3JlbGF0aW9uc2hpcHMucmVsYXRpb25zaGlwbmFtZScgdG8gcmVhZCBhIGNlcnRhaW4gcmVsYXRpb25zaGlwIG9ubHlcblxuICByZWFkKGl0ZW0sIG9wdHMgPSBbJ2F0dHJpYnV0ZXMnXSkge1xuICAgIGNvbnN0IHR5cGUgPSB0aGlzLmdldFR5cGUoaXRlbS50eXBlKTtcbiAgICBjb25zdCBrZXlzID0gb3B0cyAmJiAhQXJyYXkuaXNBcnJheShvcHRzKSA/IFtvcHRzXSA6IG9wdHM7XG5cbiAgICByZXR1cm4gdGhpcy5yZWFkQXR0cmlidXRlcyhpdGVtKVxuICAgIC50aGVuKGF0dHJpYnV0ZXMgPT4ge1xuICAgICAgaWYgKCFhdHRyaWJ1dGVzKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcmVsc1dhbnRlZCA9IChrZXlzLmluZGV4T2YoJ3JlbGF0aW9uc2hpcHMnKSA+PSAwKVxuICAgICAgICAgID8gT2JqZWN0LmtleXModHlwZS4kc2NoZW1hLnJlbGF0aW9uc2hpcHMpXG4gICAgICAgICAgOiBrZXlzLm1hcChrID0+IGsuc3BsaXQoJy4nKSlcbiAgICAgICAgICAgIC5maWx0ZXIoa2EgPT4ga2FbMF0gPT09ICdyZWxhdGlvbnNoaXBzJylcbiAgICAgICAgICAgIC5tYXAoa2EgPT4ga2FbMV0pO1xuICAgICAgICBjb25zdCByZWxzVG9GZXRjaCA9IHJlbHNXYW50ZWQuZmlsdGVyKHJlbE5hbWUgPT4gIWF0dHJpYnV0ZXMucmVsYXRpb25zaGlwc1tyZWxOYW1lXSk7XG4gICAgICAgIC8vIHJlYWRBdHRyaWJ1dGVzIGNhbiByZXR1cm4gcmVsYXRpb25zaGlwIGRhdGEsIHNvIGRvbid0IGZldGNoIHRob3NlXG4gICAgICAgIGlmIChyZWxzVG9GZXRjaC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucmVhZFJlbGF0aW9uc2hpcHModHlwZSwgcmVsc1RvRmV0Y2gpXG4gICAgICAgICAgLnRoZW4ocmVscyA9PiBtZXJnZU9wdGlvbnMoYXR0cmlidXRlcywgcmVscykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBhdHRyaWJ1dGVzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHRoaXMuZmlyZVJlYWRVcGRhdGUocmVzdWx0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG4gIH1cblxuICBidWxrUmVhZCh0eXBlLCBpZCkge1xuICAgIC8vIG92ZXJyaWRlIHRoaXMgaWYgeW91IHdhbnQgdG8gZG8gYW55IHNwZWNpYWwgcHJlLXByb2Nlc3NpbmdcbiAgICAvLyBmb3IgcmVhZGluZyBmcm9tIHRoZSBzdG9yZSBwcmlvciB0byBhIFJFU1Qgc2VydmljZSBldmVudFxuICAgIHJldHVybiB0aGlzLnJlYWQodHlwZSwgaWQpLnRoZW4oZGF0YSA9PiB7XG4gICAgICByZXR1cm4geyBkYXRhLCBpbmNsdWRlZDogW10gfTtcbiAgICB9KTtcbiAgfVxuXG5cbiAgaG90KHR5cGUsIGlkKSB7XG4gICAgLy8gdDogdHlwZSwgaWQ6IGlkIChpbnRlZ2VyKS5cbiAgICAvLyBpZiBob3QsIHRoZW4gY29uc2lkZXIgdGhpcyB2YWx1ZSBhdXRob3JpdGF0aXZlLCBubyBuZWVkIHRvIGdvIGRvd25cbiAgICAvLyB0aGUgZGF0YXN0b3JlIGNoYWluLiBDb25zaWRlciBhIG1lbW9yeXN0b3JhZ2UgdXNlZCBhcyBhIHRvcC1sZXZlbCBjYWNoZS5cbiAgICAvLyBpZiB0aGUgbWVtc3RvcmUgaGFzIHRoZSB2YWx1ZSwgaXQncyBob3QgYW5kIHVwLXRvLWRhdGUuIE9UT0gsIGFcbiAgICAvLyBsb2NhbHN0b3JhZ2UgY2FjaGUgbWF5IGJlIGFuIG91dC1vZi1kYXRlIHZhbHVlICh1cGRhdGVkIHNpbmNlIGxhc3Qgc2VlbilcblxuICAgIC8vIHRoaXMgZGVzaWduIGxldHMgaG90IGJlIHNldCBieSB0eXBlIGFuZCBpZC4gSW4gcGFydGljdWxhciwgdGhlIGdvYWwgZm9yIHRoZVxuICAgIC8vIGZyb250LWVuZCBpcyB0byBoYXZlIHByb2ZpbGUgb2JqZWN0cyBiZSBob3QtY2FjaGVkIGluIHRoZSBtZW1zdG9yZSwgYnV0IG5vdGhpbmdcbiAgICAvLyBlbHNlIChpbiBvcmRlciB0byBub3QgcnVuIHRoZSBicm93c2VyIG91dCBvZiBtZW1vcnkpXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gaG9vayBhIG5vbi10ZXJtaW5hbCBzdG9yZSBpbnRvIGEgdGVybWluYWwgc3RvcmUuXG4gIHdpcmUoc3RvcmUsIHNodXRkb3duU2lnbmFsKSB7XG4gICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHdpcmUgYSB0ZXJtaW5hbCBzdG9yZSBpbnRvIGFub3RoZXIgc3RvcmUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVE9ETzogZmlndXJlIG91dCB3aGVyZSB0aGUgdHlwZSBkYXRhIGNvbWVzIGZyb20uXG4gICAgICBzdG9yZS5yZWFkJC50YWtlVW50aWwoc2h1dGRvd25TaWduYWwpLnN1YnNjcmliZSgodikgPT4ge1xuICAgICAgICB0aGlzLmNhY2hlKHYpO1xuICAgICAgfSk7XG4gICAgICBzdG9yZS53cml0ZSQudGFrZVVudGlsKHNodXRkb3duU2lnbmFsKS5zdWJzY3JpYmUoKHYpID0+IHtcbiAgICAgICAgdi5pbnZhbGlkYXRlLmZvckVhY2goKGludmFsaWQpID0+IHtcbiAgICAgICAgICB0aGlzLndpcGUodiwgaW52YWxpZCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgdmFsaWRhdGVJbnB1dCh2YWx1ZSwgb3B0cyA9IHt9KSB7XG4gICAgY29uc3QgdHlwZSA9IHRoaXMuZ2V0VHlwZSh2YWx1ZS50eXBlKTtcbiAgICBjb25zdCByZXRWYWwgPSB7IHR5cGU6IHZhbHVlLnR5cGUsIGlkOiB2YWx1ZS5pZCwgYXR0cmlidXRlczoge30sIHJlbGF0aW9uc2hpcHM6IHt9IH07XG4gICAgY29uc3QgdHlwZUF0dHJzID0gT2JqZWN0LmtleXModHlwZS4kc2NoZW1hLmF0dHJpYnV0ZXMpO1xuICAgIGNvbnN0IHZhbEF0dHJzID0gT2JqZWN0LmtleXModmFsdWUuYXR0cmlidXRlcyk7XG4gICAgY29uc3QgdHlwZVJlbHMgPSBPYmplY3Qua2V5cyh0eXBlLiRzY2hlbWEucmVsYXRpb25zaGlwcyk7XG4gICAgY29uc3QgdmFsUmVscyA9IE9iamVjdC5rZXlzKHZhbHVlLnJlbGF0aW9uc2hpcHMpO1xuXG4gICAgY29uc3QgaW52YWxpZEF0dHJzID0gdmFsQXR0cnMuZmlsdGVyKGl0ZW0gPT4gdHlwZUF0dHJzLmluZGV4T2YoaXRlbSkgPCAwKTtcbiAgICBjb25zdCBpbnZhbGlkUmVscyA9IHZhbFJlbHMuZmlsdGVyKGl0ZW0gPT4gdHlwZVJlbHMuaW5kZXhPZihpdGVtKSA8IDApO1xuXG4gICAgaWYgKGludmFsaWRBdHRycy5sZW5ndGggPiAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgYXR0cmlidXRlcyBvbiB2YWx1ZSBvYmplY3Q6ICR7SlNPTi5zdHJpbmdpZnkoaW52YWxpZEF0dHJzKX1gKTtcbiAgICB9XG5cbiAgICBpZiAoaW52YWxpZFJlbHMubGVuZ3RoID4gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHJlbGF0aW9uc2hpcHMgb24gdmFsdWUgb2JqZWN0OiAke0pTT04uc3RyaW5naWZ5KGludmFsaWRSZWxzKX1gKTtcbiAgICB9XG5cblxuICAgIGZvciAoY29uc3QgYXR0ck5hbWUgaW4gdHlwZS4kc2NoZW1hLmF0dHJpYnV0ZXMpIHtcbiAgICAgIGlmICghdmFsdWUuYXR0cmlidXRlc1thdHRyTmFtZV0gJiYgKHR5cGUuJHNjaGVtYS5hdHRyaWJ1dGVzW2F0dHJOYW1lXS5kZWZhdWx0ICE9PSB1bmRlZmluZWQpKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHR5cGUuJHNjaGVtYS5hdHRyaWJ1dGVzW2F0dHJOYW1lXS5kZWZhdWx0KSkge1xuICAgICAgICAgIHJldFZhbC5hdHRyaWJ1dGVzW2F0dHJOYW1lXSA9IHR5cGUuJHNjaGVtYS5hdHRyaWJ1dGVzW2F0dHJOYW1lXS5kZWZhdWx0LmNvbmNhdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0eXBlLiRzY2hlbWEuYXR0cmlidXRlc1thdHRyTmFtZV0uZGVmYXVsdCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICByZXRWYWwuYXR0cmlidXRlc1thdHRyTmFtZV0gPSBPYmplY3QuYXNzaWduKHR5cGUuJHNjaGVtYS5hdHRyaWJ1dGVzW2F0dHJOYW1lXS5kZWZhdWx0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXRWYWwuYXR0cmlidXRlc1thdHRyTmFtZV0gPSB0eXBlLiRzY2hlbWEuYXR0cmlidXRlc1thdHRyTmFtZV0uZGVmYXVsdDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgcmVsTmFtZSBpbiB0eXBlLiRzY2hlbWEucmVsYXRpb25zaGlwcykge1xuICAgICAgaWYgKHZhbHVlLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0gJiYgIUFycmF5LmlzQXJyYXkodmFsdWUucmVsYXRpb25zaGlwc1tyZWxOYW1lXSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGByZWxhdGlvbiAke3JlbE5hbWV9IGlzIG5vdCBhbiBhcnJheWApO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWVyZ2VPcHRpb25zKHt9LCB2YWx1ZSwgcmV0VmFsKTtcbiAgfVxuXG4gIC8vIHN0b3JlIHR5cGUgaW5mbyBkYXRhIG9uIHRoZSBzdG9yZSBpdHNlbGZcblxuICBnZXRUeXBlKHQpIHtcbiAgICBpZiAodHlwZW9mIHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gdGhpc1skdHlwZXNdW3RdO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdDtcbiAgICB9XG4gIH1cblxuICBhZGRUeXBlKHQpIHtcbiAgICB0aGlzWyR0eXBlc11bdC4kbmFtZV0gPSB0O1xuICB9XG5cbiAgYWRkVHlwZXMoYSkge1xuICAgIGEuZm9yRWFjaCh0ID0+IHRoaXMuYWRkVHlwZSh0KSk7XG4gIH1cblxuXG4gIGZpcmVXcml0ZVVwZGF0ZSh2YWwpIHtcbiAgICB0aGlzWyR3cml0ZVN1YmplY3RdLm5leHQodmFsKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh2YWwpO1xuICB9XG5cbiAgZmlyZVJlYWRVcGRhdGUodmFsKSB7XG4gICAgdGhpc1skcmVhZFN1YmplY3RdLm5leHQodmFsKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh2YWwpO1xuICB9XG5cbiAgbm90aWZ5VXBkYXRlKHYpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh2KTtcbiAgfVxuXG4gICQkdGVzdEluZGV4KC4uLmFyZ3MpIHtcbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDEpIHtcbiAgICAgIGlmIChhcmdzWzBdLiRpZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBvcGVyYXRpb24gb24gYW4gdW5zYXZlZCBuZXcgbW9kZWwnKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGFyZ3NbMV1bYXJnc1swXS4kaWRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBvcGVyYXRpb24gb24gYW4gdW5zYXZlZCBuZXcgbW9kZWwnKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vLyBjb252ZW5pZW5jZSBmdW5jdGlvbiB0aGF0IHdhbGtzIGFuIGFycmF5IHJlcGxhY2luZyBhbnkge2lkfSB3aXRoIGNvbnRleHQuaWRcblN0b3JhZ2UubWFzc1JlcGxhY2UgPSBmdW5jdGlvbiBtYXNzUmVwbGFjZShibG9jaywgY29udGV4dCkge1xuICByZXR1cm4gYmxvY2subWFwKCh2KSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodikpIHtcbiAgICAgIHJldHVybiBtYXNzUmVwbGFjZSh2LCBjb250ZXh0KTtcbiAgICB9IGVsc2UgaWYgKCh0eXBlb2YgdiA9PT0gJ3N0cmluZycpICYmICh2Lm1hdGNoKC9eXFx7KC4qKVxcfSQvKSkpIHtcbiAgICAgIHJldHVybiBjb250ZXh0W3YubWF0Y2goL15cXHsoLiopXFx9JC8pWzFdXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHY7XG4gICAgfVxuICB9KTtcbn07XG4iXX0=
