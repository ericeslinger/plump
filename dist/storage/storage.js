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
    value: function read(type, id, key) {
      var _this = this;

      var keys = [_model.$self];
      if (Array.isArray(key)) {
        keys = key;
      } else if (key) {
        keys = [key];
      }
      if (keys.indexOf(_model.$all) >= 0) {
        keys = Object.keys(type.$fields).filter(function (k) {
          return type.$fields[k].type === 'hasMany';
        });
        keys.push(_model.$self);
      }
      // if (keys.indexOf($self) < 0) {
      //   keys.push($self);
      // }
      return Bluebird.resolve().then(function () {
        return Bluebird.all(keys.map(function (k) {
          if (k !== _model.$self && type.$fields[k].type === 'hasMany') {
            return _this.readMany(type, id, k);
          } else {
            return _this.readOne(type, id);
          }
        })).then(function (valArray) {
          var selfIdx = keys.indexOf(_model.$self);
          var retVal = {};
          if (selfIdx >= 0) {
            if (valArray[selfIdx] === null) {
              return null;
            } else {
              Object.assign(retVal, valArray[selfIdx]);
            }
          }
          valArray.forEach(function (val, idx) {
            if (idx !== selfIdx) {
              Object.assign(retVal, val);
            }
          });
          return retVal;
        });
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
      var _this2 = this;

      var opts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [_model.$self];

      var keys = opts;
      if (!Array.isArray(keys)) {
        keys = [keys];
      }
      return Bluebird.all(keys.map(function (field) {
        return Bluebird.resolve().then(function () {
          if (_this2.terminal) {
            if (field !== _model.$self) {
              if (value !== null) {
                _this2[$emitter].next({
                  type: type, id: id, field: field, value: value[field]
                });
                return null;
              } else {
                return _this2.readMany(type, id, field).then(function (list) {
                  _this2[$emitter].next({
                    type: type, id: id, field: field, value: list[field]
                  });
                  return null;
                });
              }
            } else {
              _this2[$emitter].next({
                type: type, id: id, value: value
              });
              return null;
            }
          } else {
            return null;
          }
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsIiRlbWl0dGVyIiwiU3ltYm9sIiwiU3RvcmFnZSIsIm9wdHMiLCJ0ZXJtaW5hbCIsInR5cGUiLCJpZCIsInZhbHVlIiwicmVqZWN0IiwiRXJyb3IiLCJrZXkiLCJrZXlzIiwiQXJyYXkiLCJpc0FycmF5IiwiaW5kZXhPZiIsIk9iamVjdCIsIiRmaWVsZHMiLCJmaWx0ZXIiLCJrIiwicHVzaCIsInJlc29sdmUiLCJ0aGVuIiwiYWxsIiwibWFwIiwicmVhZE1hbnkiLCJyZWFkT25lIiwidmFsQXJyYXkiLCJzZWxmSWR4IiwicmV0VmFsIiwiYXNzaWduIiwiZm9yRWFjaCIsInZhbCIsImlkeCIsInJlc3VsdCIsIm5vdGlmeVVwZGF0ZSIsImZpZWxkIiwicmVsYXRpb25zaGlwVGl0bGUiLCJjaGlsZElkIiwiZXh0cmFzIiwicSIsIm9ic2VydmVyIiwic3Vic2NyaWJlIiwibmV4dCIsImxpc3QiLCJhcmdzIiwibGVuZ3RoIiwiJGlkIiwidW5kZWZpbmVkIiwibWFzc1JlcGxhY2UiLCJibG9jayIsImNvbnRleHQiLCJ2IiwibWF0Y2giXSwibWFwcGluZ3MiOiI7Ozs7Ozs7cWpCQUFBOztBQUVBOztJQUFZQSxROztBQUNaOztBQUNBOzs7Ozs7QUFFQSxJQUFNQyxXQUFXQyxPQUFPLFVBQVAsQ0FBakI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztJQUVhQyxPLFdBQUFBLE87QUFFWCxxQkFBdUI7QUFBQSxRQUFYQyxJQUFXLHVFQUFKLEVBQUk7O0FBQUE7O0FBQ3JCO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFNBQUtDLFFBQUwsR0FBZ0JELEtBQUtDLFFBQUwsSUFBaUIsS0FBakM7QUFDQSxTQUFLSixRQUFMLElBQWlCLGlCQUFqQjtBQUNEOzs7O3dCQUVHSyxJLEVBQU1DLEUsRUFBSTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsYUFBTyxLQUFQO0FBQ0Q7OzswQkFFS0QsSSxFQUFNRSxLLEVBQU87QUFDakI7QUFDQTtBQUNBLGFBQU9SLFNBQVNTLE1BQVQsQ0FBZ0IsSUFBSUMsS0FBSixDQUFVLHVCQUFWLENBQWhCLENBQVA7QUFDRDs7QUFFRDtBQUNBOzs7O3lCQUVLSixJLEVBQU1DLEUsRUFBSUksRyxFQUFLO0FBQUE7O0FBQ2xCLFVBQUlDLE9BQU8sY0FBWDtBQUNBLFVBQUlDLE1BQU1DLE9BQU4sQ0FBY0gsR0FBZCxDQUFKLEVBQXdCO0FBQ3RCQyxlQUFPRCxHQUFQO0FBQ0QsT0FGRCxNQUVPLElBQUlBLEdBQUosRUFBUztBQUNkQyxlQUFPLENBQUNELEdBQUQsQ0FBUDtBQUNEO0FBQ0QsVUFBSUMsS0FBS0csT0FBTCxpQkFBc0IsQ0FBMUIsRUFBNkI7QUFDM0JILGVBQU9JLE9BQU9KLElBQVAsQ0FBWU4sS0FBS1csT0FBakIsRUFDTkMsTUFETSxDQUNDLFVBQUNDLENBQUQ7QUFBQSxpQkFBT2IsS0FBS1csT0FBTCxDQUFhRSxDQUFiLEVBQWdCYixJQUFoQixLQUF5QixTQUFoQztBQUFBLFNBREQsQ0FBUDtBQUVBTSxhQUFLUSxJQUFMO0FBQ0Q7QUFDRDtBQUNBO0FBQ0E7QUFDQSxhQUFPcEIsU0FBU3FCLE9BQVQsR0FDTkMsSUFETSxDQUNELFlBQU07QUFDVixlQUFPdEIsU0FBU3VCLEdBQVQsQ0FBYVgsS0FBS1ksR0FBTCxDQUFTLFVBQUNMLENBQUQsRUFBTztBQUNsQyxjQUFLQSxrQkFBRCxJQUFrQmIsS0FBS1csT0FBTCxDQUFhRSxDQUFiLEVBQWdCYixJQUFoQixLQUF5QixTQUEvQyxFQUEyRDtBQUN6RCxtQkFBTyxNQUFLbUIsUUFBTCxDQUFjbkIsSUFBZCxFQUFvQkMsRUFBcEIsRUFBd0JZLENBQXhCLENBQVA7QUFDRCxXQUZELE1BRU87QUFDTCxtQkFBTyxNQUFLTyxPQUFMLENBQWFwQixJQUFiLEVBQW1CQyxFQUFuQixDQUFQO0FBQ0Q7QUFDRixTQU5tQixDQUFiLEVBTUhlLElBTkcsQ0FNRSxVQUFDSyxRQUFELEVBQWM7QUFDckIsY0FBTUMsVUFBVWhCLEtBQUtHLE9BQUwsY0FBaEI7QUFDQSxjQUFNYyxTQUFTLEVBQWY7QUFDQSxjQUFJRCxXQUFXLENBQWYsRUFBa0I7QUFDaEIsZ0JBQUlELFNBQVNDLE9BQVQsTUFBc0IsSUFBMUIsRUFBZ0M7QUFDOUIscUJBQU8sSUFBUDtBQUNELGFBRkQsTUFFTztBQUNMWixxQkFBT2MsTUFBUCxDQUFjRCxNQUFkLEVBQXNCRixTQUFTQyxPQUFULENBQXRCO0FBQ0Q7QUFDRjtBQUNERCxtQkFBU0ksT0FBVCxDQUFpQixVQUFDQyxHQUFELEVBQU1DLEdBQU4sRUFBYztBQUM3QixnQkFBSUEsUUFBUUwsT0FBWixFQUFxQjtBQUNuQloscUJBQU9jLE1BQVAsQ0FBY0QsTUFBZCxFQUFzQkcsR0FBdEI7QUFDRDtBQUNGLFdBSkQ7QUFLQSxpQkFBT0gsTUFBUDtBQUNELFNBdEJNLENBQVA7QUF1QkQsT0F6Qk0sRUF5QkpQLElBekJJLENBeUJDLFVBQUNZLE1BQUQsRUFBWTtBQUNsQixZQUFJQSxNQUFKLEVBQVk7QUFDVixpQkFBTyxNQUFLQyxZQUFMLENBQWtCN0IsSUFBbEIsRUFBd0JDLEVBQXhCLEVBQTRCMkIsTUFBNUIsRUFBb0N0QixJQUFwQyxFQUNOVSxJQURNLENBQ0Q7QUFBQSxtQkFBTVksTUFBTjtBQUFBLFdBREMsQ0FBUDtBQUVELFNBSEQsTUFHTztBQUNMLGlCQUFPQSxNQUFQO0FBQ0Q7QUFDRixPQWhDTSxDQUFQO0FBaUNEOztBQUVEO0FBQ0E7QUFDQTtBQUNBOzs7O3lCQUVLNUIsSSxFQUFNQyxFLEVBQUk2QixLLEVBQU87QUFDcEIsYUFBT3BDLFNBQVNTLE1BQVQsQ0FBZ0IsSUFBSUMsS0FBSixDQUFVLHNCQUFWLENBQWhCLENBQVA7QUFDRDs7OzRCQUVPSixJLEVBQU1DLEUsRUFBSTtBQUNoQixhQUFPUCxTQUFTUyxNQUFULENBQWdCLElBQUlDLEtBQUosQ0FBVSx5QkFBVixDQUFoQixDQUFQO0FBQ0Q7Ozs2QkFFUUosSSxFQUFNQyxFLEVBQUlJLEcsRUFBSztBQUN0QixhQUFPWCxTQUFTUyxNQUFULENBQWdCLElBQUlDLEtBQUosQ0FBVSwwQkFBVixDQUFoQixDQUFQO0FBQ0Q7Ozs0QkFFTUosSSxFQUFNQyxFLEVBQUk7QUFDZixhQUFPUCxTQUFTUyxNQUFULENBQWdCLElBQUlDLEtBQUosQ0FBVSx3QkFBVixDQUFoQixDQUFQO0FBQ0Q7Ozt3QkFFR0osSSxFQUFNQyxFLEVBQUk4QixpQixFQUFtQkMsTyxFQUFzQjtBQUFBLFVBQWJDLE1BQWEsdUVBQUosRUFBSTs7QUFDckQ7QUFDQTtBQUNBO0FBQ0EsYUFBT3ZDLFNBQVNTLE1BQVQsQ0FBZ0IsSUFBSUMsS0FBSixDQUFVLHFCQUFWLENBQWhCLENBQVA7QUFDRDs7OzJCQUVNSixJLEVBQU1DLEUsRUFBSThCLGlCLEVBQW1CQyxPLEVBQVM7QUFDM0M7QUFDQSxhQUFPdEMsU0FBU1MsTUFBVCxDQUFnQixJQUFJQyxLQUFKLENBQVUsd0JBQVYsQ0FBaEIsQ0FBUDtBQUNEOzs7dUNBRWtCSixJLEVBQU1DLEUsRUFBSThCLGlCLEVBQW1CQyxPLEVBQXNCO0FBQUEsVUFBYkMsTUFBYSx1RUFBSixFQUFJOztBQUNwRTtBQUNBLGFBQU92QyxTQUFTUyxNQUFULENBQWdCLElBQUlDLEtBQUosQ0FBVSxvQ0FBVixDQUFoQixDQUFQO0FBQ0Q7OzswQkFFSzhCLEMsRUFBRztBQUNQO0FBQ0E7QUFDQSxhQUFPeEMsU0FBU1MsTUFBVCxDQUFnQixJQUFJQyxLQUFKLENBQVUsdUJBQVYsQ0FBaEIsQ0FBUDtBQUNEOzs7NkJBRVErQixRLEVBQVU7QUFDakI7QUFDQTtBQUNBO0FBQ0EsYUFBTyxLQUFLeEMsUUFBTCxFQUFleUMsU0FBZixDQUF5QkQsUUFBekIsQ0FBUDtBQUNEOzs7aUNBRVluQyxJLEVBQU1DLEUsRUFBSUMsSyxFQUF1QjtBQUFBOztBQUFBLFVBQWhCSixJQUFnQix1RUFBVCxjQUFTOztBQUM1QyxVQUFJUSxPQUFPUixJQUFYO0FBQ0EsVUFBSSxDQUFDUyxNQUFNQyxPQUFOLENBQWNGLElBQWQsQ0FBTCxFQUEwQjtBQUN4QkEsZUFBTyxDQUFDQSxJQUFELENBQVA7QUFDRDtBQUNELGFBQU9aLFNBQVN1QixHQUFULENBQWFYLEtBQUtZLEdBQUwsQ0FBUyxVQUFDWSxLQUFELEVBQVc7QUFDdEMsZUFBT3BDLFNBQVNxQixPQUFULEdBQ05DLElBRE0sQ0FDRCxZQUFNO0FBQ1YsY0FBSSxPQUFLakIsUUFBVCxFQUFtQjtBQUNqQixnQkFBSStCLHNCQUFKLEVBQXFCO0FBQ25CLGtCQUFJNUIsVUFBVSxJQUFkLEVBQW9CO0FBQ2xCLHVCQUFLUCxRQUFMLEVBQWUwQyxJQUFmLENBQW9CO0FBQ2xCckMsNEJBRGtCLEVBQ1pDLE1BRFksRUFDUjZCLFlBRFEsRUFDRDVCLE9BQU9BLE1BQU00QixLQUFOO0FBRE4saUJBQXBCO0FBR0EsdUJBQU8sSUFBUDtBQUNELGVBTEQsTUFLTztBQUNMLHVCQUFPLE9BQUtYLFFBQUwsQ0FBY25CLElBQWQsRUFBb0JDLEVBQXBCLEVBQXdCNkIsS0FBeEIsRUFDTmQsSUFETSxDQUNELFVBQUNzQixJQUFELEVBQVU7QUFDZCx5QkFBSzNDLFFBQUwsRUFBZTBDLElBQWYsQ0FBb0I7QUFDbEJyQyw4QkFEa0IsRUFDWkMsTUFEWSxFQUNSNkIsWUFEUSxFQUNENUIsT0FBT29DLEtBQUtSLEtBQUw7QUFETixtQkFBcEI7QUFHQSx5QkFBTyxJQUFQO0FBQ0QsaUJBTk0sQ0FBUDtBQU9EO0FBQ0YsYUFmRCxNQWVPO0FBQ0wscUJBQUtuQyxRQUFMLEVBQWUwQyxJQUFmLENBQW9CO0FBQ2xCckMsMEJBRGtCLEVBQ1pDLE1BRFksRUFDUkM7QUFEUSxlQUFwQjtBQUdBLHFCQUFPLElBQVA7QUFDRDtBQUNGLFdBdEJELE1Bc0JPO0FBQ0wsbUJBQU8sSUFBUDtBQUNEO0FBQ0YsU0EzQk0sQ0FBUDtBQTRCRCxPQTdCbUIsQ0FBYixDQUFQO0FBOEJEOzs7a0NBRW9CO0FBQUEsd0NBQU5xQyxJQUFNO0FBQU5BLFlBQU07QUFBQTs7QUFDbkIsVUFBSUEsS0FBS0MsTUFBTCxLQUFnQixDQUFwQixFQUF1QjtBQUNyQixZQUFJRCxLQUFLLENBQUwsRUFBUUUsR0FBUixLQUFnQkMsU0FBcEIsRUFBK0I7QUFDN0IsZ0JBQU0sSUFBSXRDLEtBQUosQ0FBVSwyQ0FBVixDQUFOO0FBQ0Q7QUFDRixPQUpELE1BSU8sSUFBSW1DLEtBQUssQ0FBTCxFQUFRQSxLQUFLLENBQUwsRUFBUUUsR0FBaEIsTUFBeUJDLFNBQTdCLEVBQXdDO0FBQzdDLGNBQU0sSUFBSXRDLEtBQUosQ0FBVSwyQ0FBVixDQUFOO0FBQ0Q7QUFDRjs7Ozs7O0FBSUg7OztBQUNBUCxRQUFROEMsV0FBUixHQUFzQixTQUFTQSxXQUFULENBQXFCQyxLQUFyQixFQUE0QkMsT0FBNUIsRUFBcUM7QUFDekQsU0FBT0QsTUFBTTFCLEdBQU4sQ0FBVSxVQUFDNEIsQ0FBRCxFQUFPO0FBQ3RCLFFBQUl2QyxNQUFNQyxPQUFOLENBQWNzQyxDQUFkLENBQUosRUFBc0I7QUFDcEIsYUFBT0gsWUFBWUcsQ0FBWixFQUFlRCxPQUFmLENBQVA7QUFDRCxLQUZELE1BRU8sSUFBSyxPQUFPQyxDQUFQLEtBQWEsUUFBZCxJQUE0QkEsRUFBRUMsS0FBRixDQUFRLFlBQVIsQ0FBaEMsRUFBd0Q7QUFDN0QsYUFBT0YsUUFBUUMsRUFBRUMsS0FBRixDQUFRLFlBQVIsRUFBc0IsQ0FBdEIsQ0FBUixDQUFQO0FBQ0QsS0FGTSxNQUVBO0FBQ0wsYUFBT0QsQ0FBUDtBQUNEO0FBQ0YsR0FSTSxDQUFQO0FBU0QsQ0FWRCIsImZpbGUiOiJzdG9yYWdlL3N0b3JhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQgbm8tdW51c2VkLXZhcnM6IDAgKi9cblxuaW1wb3J0ICogYXMgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHsgU3ViamVjdCB9IGZyb20gJ3J4anMvUngnO1xuaW1wb3J0IHsgJHNlbGYsICRhbGwgfSBmcm9tICcuLi9tb2RlbCc7XG5cbmNvbnN0ICRlbWl0dGVyID0gU3ltYm9sKCckZW1pdHRlcicpO1xuXG4vLyB0eXBlOiBhbiBvYmplY3QgdGhhdCBkZWZpbmVzIHRoZSB0eXBlLiB0eXBpY2FsbHkgdGhpcyB3aWxsIGJlXG4vLyBwYXJ0IG9mIHRoZSBNb2RlbCBjbGFzcyBoaWVyYXJjaHksIGJ1dCBTdG9yYWdlIG9iamVjdHMgY2FsbCBubyBtZXRob2RzXG4vLyBvbiB0aGUgdHlwZSBvYmplY3QuIFdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gVHlwZS4kbmFtZSwgVHlwZS4kaWQgYW5kIFR5cGUuJGZpZWxkcy5cbi8vIE5vdGUgdGhhdCBUeXBlLiRpZCBpcyB0aGUgKm5hbWUgb2YgdGhlIGlkIGZpZWxkKiBvbiBpbnN0YW5jZXNcbi8vICAgIGFuZCBOT1QgdGhlIGFjdHVhbCBpZCBmaWVsZCAoZS5nLiwgaW4gbW9zdCBjYXNlcywgVHlwZS4kaWQgPT09ICdpZCcpLlxuLy8gaWQ6IHVuaXF1ZSBpZC4gT2Z0ZW4gYW4gaW50ZWdlciwgYnV0IG5vdCBuZWNlc3NhcnkgKGNvdWxkIGJlIGFuIG9pZClcblxuXG4vLyBoYXNNYW55IHJlbGF0aW9uc2hpcHMgYXJlIHRyZWF0ZWQgbGlrZSBpZCBhcnJheXMuIFNvLCBhZGQgLyByZW1vdmUgLyBoYXNcbi8vIGp1c3Qgc3RvcmVzIGFuZCByZW1vdmVzIGludGVnZXJzLlxuXG5leHBvcnQgY2xhc3MgU3RvcmFnZSB7XG5cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgLy8gYSBcInRlcm1pbmFsXCIgc3RvcmFnZSBmYWNpbGl0eSBpcyB0aGUgZW5kIG9mIHRoZSBzdG9yYWdlIGNoYWluLlxuICAgIC8vIHVzdWFsbHkgc3FsIG9uIHRoZSBzZXJ2ZXIgc2lkZSBhbmQgcmVzdCBvbiB0aGUgY2xpZW50IHNpZGUsIGl0ICptdXN0KlxuICAgIC8vIHJlY2VpdmUgdGhlIHdyaXRlcywgYW5kIGlzIHRoZSBmaW5hbCBhdXRob3JpdGF0aXZlIGFuc3dlciBvbiB3aGV0aGVyXG4gICAgLy8gc29tZXRoaW5nIGlzIDQwNC5cblxuICAgIC8vIHRlcm1pbmFsIGZhY2lsaXRpZXMgYXJlIGFsc28gdGhlIG9ubHkgb25lcyB0aGF0IGNhbiBhdXRob3JpdGF0aXZlbHkgYW5zd2VyXG4gICAgLy8gYXV0aG9yaXphdGlvbiBxdWVzdGlvbnMsIGJ1dCB0aGUgZGVzaWduIG1heSBhbGxvdyBmb3IgYXV0aG9yaXphdGlvbiB0byBiZVxuICAgIC8vIGNhY2hlZC5cbiAgICB0aGlzLnRlcm1pbmFsID0gb3B0cy50ZXJtaW5hbCB8fCBmYWxzZTtcbiAgICB0aGlzWyRlbWl0dGVyXSA9IG5ldyBTdWJqZWN0KCk7XG4gIH1cblxuICBob3QodHlwZSwgaWQpIHtcbiAgICAvLyB0OiB0eXBlLCBpZDogaWQgKGludGVnZXIpLlxuICAgIC8vIGlmIGhvdCwgdGhlbiBjb25zaWRlciB0aGlzIHZhbHVlIGF1dGhvcml0YXRpdmUsIG5vIG5lZWQgdG8gZ28gZG93blxuICAgIC8vIHRoZSBkYXRhc3RvcmUgY2hhaW4uIENvbnNpZGVyIGEgbWVtb3J5c3RvcmFnZSB1c2VkIGFzIGEgdG9wLWxldmVsIGNhY2hlLlxuICAgIC8vIGlmIHRoZSBtZW1zdG9yZSBoYXMgdGhlIHZhbHVlLCBpdCdzIGhvdCBhbmQgdXAtdG8tZGF0ZS4gT1RPSCwgYVxuICAgIC8vIGxvY2Fsc3RvcmFnZSBjYWNoZSBtYXkgYmUgYW4gb3V0LW9mLWRhdGUgdmFsdWUgKHVwZGF0ZWQgc2luY2UgbGFzdCBzZWVuKVxuXG4gICAgLy8gdGhpcyBkZXNpZ24gbGV0cyBob3QgYmUgc2V0IGJ5IHR5cGUgYW5kIGlkLiBJbiBwYXJ0aWN1bGFyLCB0aGUgZ29hbCBmb3IgdGhlXG4gICAgLy8gZnJvbnQtZW5kIGlzIHRvIGhhdmUgcHJvZmlsZSBvYmplY3RzIGJlIGhvdC1jYWNoZWQgaW4gdGhlIG1lbXN0b3JlLCBidXQgbm90aGluZ1xuICAgIC8vIGVsc2UgKGluIG9yZGVyIHRvIG5vdCBydW4gdGhlIGJyb3dzZXIgb3V0IG9mIG1lbW9yeSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICB3cml0ZSh0eXBlLCB2YWx1ZSkge1xuICAgIC8vIGlmIHZhbHVlLmlkIGV4aXN0cywgdGhpcyBpcyBhbiB1cGRhdGUuIElmIGl0IGRvZXNuJ3QsIGl0IGlzIGFuXG4gICAgLy8gaW5zZXJ0LiBJbiB0aGUgY2FzZSBvZiBhbiB1cGRhdGUsIGl0IHNob3VsZCBtZXJnZSBkb3duIHRoZSB0cmVlLlxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdXcml0ZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICAvLyBUT0RPOiB3cml0ZSB0aGUgdHdvLXdheSBoYXMvZ2V0IGxvZ2ljIGludG8gdGhpcyBtZXRob2RcbiAgLy8gYW5kIHByb3ZpZGUgb3ZlcnJpZGUgaG9va3MgZm9yIHJlYWRPbmUgcmVhZE1hbnlcblxuICByZWFkKHR5cGUsIGlkLCBrZXkpIHtcbiAgICBsZXQga2V5cyA9IFskc2VsZl07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoa2V5KSkge1xuICAgICAga2V5cyA9IGtleTtcbiAgICB9IGVsc2UgaWYgKGtleSkge1xuICAgICAga2V5cyA9IFtrZXldO1xuICAgIH1cbiAgICBpZiAoa2V5cy5pbmRleE9mKCRhbGwpID49IDApIHtcbiAgICAgIGtleXMgPSBPYmplY3Qua2V5cyh0eXBlLiRmaWVsZHMpXG4gICAgICAuZmlsdGVyKChrKSA9PiB0eXBlLiRmaWVsZHNba10udHlwZSA9PT0gJ2hhc01hbnknKTtcbiAgICAgIGtleXMucHVzaCgkc2VsZik7XG4gICAgfVxuICAgIC8vIGlmIChrZXlzLmluZGV4T2YoJHNlbGYpIDwgMCkge1xuICAgIC8vICAga2V5cy5wdXNoKCRzZWxmKTtcbiAgICAvLyB9XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoa2V5cy5tYXAoKGspID0+IHtcbiAgICAgICAgaWYgKChrICE9PSAkc2VsZikgJiYgKHR5cGUuJGZpZWxkc1trXS50eXBlID09PSAnaGFzTWFueScpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucmVhZE1hbnkodHlwZSwgaWQsIGspO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzLnJlYWRPbmUodHlwZSwgaWQpO1xuICAgICAgICB9XG4gICAgICB9KSkudGhlbigodmFsQXJyYXkpID0+IHtcbiAgICAgICAgY29uc3Qgc2VsZklkeCA9IGtleXMuaW5kZXhPZigkc2VsZik7XG4gICAgICAgIGNvbnN0IHJldFZhbCA9IHt9O1xuICAgICAgICBpZiAoc2VsZklkeCA+PSAwKSB7XG4gICAgICAgICAgaWYgKHZhbEFycmF5W3NlbGZJZHhdID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihyZXRWYWwsIHZhbEFycmF5W3NlbGZJZHhdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFsQXJyYXkuZm9yRWFjaCgodmFsLCBpZHgpID0+IHtcbiAgICAgICAgICBpZiAoaWR4ICE9PSBzZWxmSWR4KSB7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKHJldFZhbCwgdmFsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmV0VmFsO1xuICAgICAgfSk7XG4gICAgfSkudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBpZCwgcmVzdWx0LCBrZXlzKVxuICAgICAgICAudGhlbigoKSA9PiByZXN1bHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIHdpcGUgc2hvdWxkIHF1aWV0bHkgZXJhc2UgYSB2YWx1ZSBmcm9tIHRoZSBzdG9yZS4gVGhpcyBpcyB1c2VkIGR1cmluZ1xuICAvLyBjYWNoZSBpbnZhbGlkYXRpb24gZXZlbnRzIHdoZW4gdGhlIGN1cnJlbnQgdmFsdWUgaXMga25vd24gdG8gYmUgaW5jb3JyZWN0LlxuICAvLyBpdCBpcyBub3QgYSBkZWxldGUgKHdoaWNoIGlzIGEgdXNlci1pbml0aWF0ZWQsIGV2ZW50LWNhdXNpbmcgdGhpbmcpLCBidXRcbiAgLy8gc2hvdWxkIHJlc3VsdCBpbiB0aGlzIHZhbHVlIG5vdCBzdG9yZWQgaW4gc3RvcmFnZSBhbnltb3JlLlxuXG4gIHdpcGUodHlwZSwgaWQsIGZpZWxkKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ1dpcGUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgcmVhZE9uZSh0eXBlLCBpZCkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdSZWFkT25lIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHJlYWRNYW55KHR5cGUsIGlkLCBrZXkpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignUmVhZE1hbnkgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgZGVsZXRlKHR5cGUsIGlkKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0RlbGV0ZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBhZGQodHlwZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlLCBjaGlsZElkLCBleHRyYXMgPSB7fSkge1xuICAgIC8vIGFkZCB0byBhIGhhc01hbnkgcmVsYXRpb25zaGlwXG4gICAgLy8gbm90ZSB0aGF0IGhhc01hbnkgZmllbGRzIGNhbiBoYXZlIChpbXBsLXNwZWNpZmljKSB2YWxlbmNlIGRhdGEgKG5vdyByZW5hbWVkIGV4dHJhcylcbiAgICAvLyBleGFtcGxlOiBtZW1iZXJzaGlwIGJldHdlZW4gcHJvZmlsZSBhbmQgY29tbXVuaXR5IGNhbiBoYXZlIHBlcm0gMSwgMiwgM1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdBZGQgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgcmVtb3ZlKHR5cGUsIGlkLCByZWxhdGlvbnNoaXBUaXRsZSwgY2hpbGRJZCkge1xuICAgIC8vIHJlbW92ZSBmcm9tIGEgaGFzTWFueSByZWxhdGlvbnNoaXBcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcigncmVtb3ZlIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIG1vZGlmeVJlbGF0aW9uc2hpcCh0eXBlLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUsIGNoaWxkSWQsIGV4dHJhcyA9IHt9KSB7XG4gICAgLy8gc2hvdWxkIG1vZGlmeSBhbiBleGlzdGluZyBoYXNNYW55IHZhbGVuY2UgZGF0YS4gVGhyb3cgaWYgbm90IGV4aXN0aW5nLlxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdtb2RpZnlSZWxhdGlvbnNoaXAgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgcXVlcnkocSkge1xuICAgIC8vIHE6IHt0eXBlOiBzdHJpbmcsIHF1ZXJ5OiBhbnl9XG4gICAgLy8gcS5xdWVyeSBpcyBpbXBsIGRlZmluZWQgLSBhIHN0cmluZyBmb3Igc3FsIChyYXcgc3FsKVxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdRdWVyeSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBvblVwZGF0ZShvYnNlcnZlcikge1xuICAgIC8vIG9ic2VydmVyIGZvbGxvd3MgdGhlIFJ4SlMgcGF0dGVybiAtIGl0IGlzIGVpdGhlciBhIGZ1bmN0aW9uIChmb3IgbmV4dCgpKVxuICAgIC8vIG9yIHtuZXh0LCBlcnJvciwgY29tcGxldGV9O1xuICAgIC8vIHJldHVybnMgYW4gdW5zdWIgaG9vayAocmV0VmFsLnVuc3Vic2NyaWJlKCkpXG4gICAgcmV0dXJuIHRoaXNbJGVtaXR0ZXJdLnN1YnNjcmliZShvYnNlcnZlcik7XG4gIH1cblxuICBub3RpZnlVcGRhdGUodHlwZSwgaWQsIHZhbHVlLCBvcHRzID0gWyRzZWxmXSkge1xuICAgIGxldCBrZXlzID0gb3B0cztcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoa2V5cykpIHtcbiAgICAgIGtleXMgPSBba2V5c107XG4gICAgfVxuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoa2V5cy5tYXAoKGZpZWxkKSA9PiB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgICAgaWYgKGZpZWxkICE9PSAkc2VsZikge1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIHRoaXNbJGVtaXR0ZXJdLm5leHQoe1xuICAgICAgICAgICAgICAgIHR5cGUsIGlkLCBmaWVsZCwgdmFsdWU6IHZhbHVlW2ZpZWxkXSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVhZE1hbnkodHlwZSwgaWQsIGZpZWxkKVxuICAgICAgICAgICAgICAudGhlbigobGlzdCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXNbJGVtaXR0ZXJdLm5leHQoe1xuICAgICAgICAgICAgICAgICAgdHlwZSwgaWQsIGZpZWxkLCB2YWx1ZTogbGlzdFtmaWVsZF0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzWyRlbWl0dGVyXS5uZXh0KHtcbiAgICAgICAgICAgICAgdHlwZSwgaWQsIHZhbHVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pKTtcbiAgfVxuXG4gICQkdGVzdEluZGV4KC4uLmFyZ3MpIHtcbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDEpIHtcbiAgICAgIGlmIChhcmdzWzBdLiRpZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBvcGVyYXRpb24gb24gYW4gdW5zYXZlZCBuZXcgbW9kZWwnKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGFyZ3NbMV1bYXJnc1swXS4kaWRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBvcGVyYXRpb24gb24gYW4gdW5zYXZlZCBuZXcgbW9kZWwnKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vLyBjb252ZW5pZW5jZSBmdW5jdGlvbiB0aGF0IHdhbGtzIGFuIGFycmF5IHJlcGxhY2luZyBhbnkge2lkfSB3aXRoIGNvbnRleHQuaWRcblN0b3JhZ2UubWFzc1JlcGxhY2UgPSBmdW5jdGlvbiBtYXNzUmVwbGFjZShibG9jaywgY29udGV4dCkge1xuICByZXR1cm4gYmxvY2subWFwKCh2KSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodikpIHtcbiAgICAgIHJldHVybiBtYXNzUmVwbGFjZSh2LCBjb250ZXh0KTtcbiAgICB9IGVsc2UgaWYgKCh0eXBlb2YgdiA9PT0gJ3N0cmluZycpICYmICh2Lm1hdGNoKC9eXFx7KC4qKVxcfSQvKSkpIHtcbiAgICAgIHJldHVybiBjb250ZXh0W3YubWF0Y2goL15cXHsoLiopXFx9JC8pWzFdXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHY7XG4gICAgfVxuICB9KTtcbn07XG4iXX0=
