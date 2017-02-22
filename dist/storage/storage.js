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
        keys = Object.keys(type.$schema.relationships);
        keys.push(_model.$self);
      }
      // if (keys.indexOf($self) < 0) {
      //   keys.push($self);
      // }
      return Bluebird.resolve().then(function () {
        return Bluebird.all(keys.map(function (k) {
          if (k !== _model.$self && type.$schema.relationships[k]) {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsIiRlbWl0dGVyIiwiU3ltYm9sIiwiU3RvcmFnZSIsIm9wdHMiLCJ0ZXJtaW5hbCIsInR5cGUiLCJpZCIsInZhbHVlIiwicmVqZWN0IiwiRXJyb3IiLCJrZXkiLCJrZXlzIiwiQXJyYXkiLCJpc0FycmF5IiwiaW5kZXhPZiIsIk9iamVjdCIsIiRzY2hlbWEiLCJyZWxhdGlvbnNoaXBzIiwicHVzaCIsInJlc29sdmUiLCJ0aGVuIiwiYWxsIiwibWFwIiwiayIsInJlYWRNYW55IiwicmVhZE9uZSIsInZhbEFycmF5Iiwic2VsZklkeCIsInJldFZhbCIsImFzc2lnbiIsImZvckVhY2giLCJ2YWwiLCJpZHgiLCJyZXN1bHQiLCJub3RpZnlVcGRhdGUiLCJmaWVsZCIsInJlbGF0aW9uc2hpcFRpdGxlIiwiY2hpbGRJZCIsImV4dHJhcyIsInEiLCJvYnNlcnZlciIsInN1YnNjcmliZSIsIm5leHQiLCJsaXN0IiwiYXJncyIsImxlbmd0aCIsIiRpZCIsInVuZGVmaW5lZCIsIm1hc3NSZXBsYWNlIiwiYmxvY2siLCJjb250ZXh0IiwidiIsIm1hdGNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O3FqQkFBQTs7QUFFQTs7SUFBWUEsUTs7QUFDWjs7QUFDQTs7Ozs7O0FBRUEsSUFBTUMsV0FBV0MsT0FBTyxVQUFQLENBQWpCOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7SUFFYUMsTyxXQUFBQSxPO0FBRVgscUJBQXVCO0FBQUEsUUFBWEMsSUFBVyx1RUFBSixFQUFJOztBQUFBOztBQUNyQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxTQUFLQyxRQUFMLEdBQWdCRCxLQUFLQyxRQUFMLElBQWlCLEtBQWpDO0FBQ0EsU0FBS0osUUFBTCxJQUFpQixpQkFBakI7QUFDRDs7Ozt3QkFFR0ssSSxFQUFNQyxFLEVBQUk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtB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LENBQVUsMkNBQVYsQ0FBTjtBQUNEO0FBQ0YsT0FKRCxNQUlPLElBQUltQyxLQUFLLENBQUwsRUFBUUEsS0FBSyxDQUFMLEVBQVFFLEdBQWhCLE1BQXlCQyxTQUE3QixFQUF3QztBQUM3QyxjQUFNLElBQUl0QyxLQUFKLENBQVUsMkNBQVYsQ0FBTjtBQUNEO0FBQ0Y7Ozs7OztBQUlIOzs7QUFDQVAsUUFBUThDLFdBQVIsR0FBc0IsU0FBU0EsV0FBVCxDQUFxQkMsS0FBckIsRUFBNEJDLE9BQTVCLEVBQXFDO0FBQ3pELFNBQU9ELE1BQU0zQixHQUFOLENBQVUsVUFBQzZCLENBQUQsRUFBTztBQUN0QixRQUFJdkMsTUFBTUMsT0FBTixDQUFjc0MsQ0FBZCxDQUFKLEVBQXNCO0FBQ3BCLGFBQU9ILFlBQVlHLENBQVosRUFBZUQsT0FBZixDQUFQO0FBQ0QsS0FGRCxNQUVPLElBQUssT0FBT0MsQ0FBUCxLQUFhLFFBQWQsSUFBNEJBLEVBQUVDLEtBQUYsQ0FBUSxZQUFSLENBQWhDLEVBQXdEO0FBQzdELGFBQU9GLFFBQVFDLEVBQUVDLEtBQUYsQ0FBUSxZQUFSLEVBQXNCLENBQXRCLENBQVIsQ0FBUDtBQUNELEtBRk0sTUFFQTtBQUNMLGFBQU9ELENBQVA7QUFDRDtBQUNGLEdBUk0sQ0FBUDtBQVNELENBVkQiLCJmaWxlIjoic3RvcmFnZS9zdG9yYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50IG5vLXVudXNlZC12YXJzOiAwICovXG5cbmltcG9ydCAqIGFzIEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IFN1YmplY3QgfSBmcm9tICdyeGpzL1J4JztcbmltcG9ydCB7ICRzZWxmLCAkYWxsIH0gZnJvbSAnLi4vbW9kZWwnO1xuXG5jb25zdCAkZW1pdHRlciA9IFN5bWJvbCgnJGVtaXR0ZXInKTtcblxuLy8gdHlwZTogYW4gb2JqZWN0IHRoYXQgZGVmaW5lcyB0aGUgdHlwZS4gdHlwaWNhbGx5IHRoaXMgd2lsbCBiZVxuLy8gcGFydCBvZiB0aGUgTW9kZWwgY2xhc3MgaGllcmFyY2h5LCBidXQgU3RvcmFnZSBvYmplY3RzIGNhbGwgbm8gbWV0aG9kc1xuLy8gb24gdGhlIHR5cGUgb2JqZWN0LiBXZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIFR5cGUuJG5hbWUsIFR5cGUuJGlkIGFuZCBUeXBlLiRzY2hlbWEuXG4vLyBOb3RlIHRoYXQgVHlwZS4kaWQgaXMgdGhlICpuYW1lIG9mIHRoZSBpZCBmaWVsZCogb24gaW5zdGFuY2VzXG4vLyAgICBhbmQgTk9UIHRoZSBhY3R1YWwgaWQgZmllbGQgKGUuZy4sIGluIG1vc3QgY2FzZXMsIFR5cGUuJGlkID09PSAnaWQnKS5cbi8vIGlkOiB1bmlxdWUgaWQuIE9mdGVuIGFuIGludGVnZXIsIGJ1dCBub3QgbmVjZXNzYXJ5IChjb3VsZCBiZSBhbiBvaWQpXG5cblxuLy8gaGFzTWFueSByZWxhdGlvbnNoaXBzIGFyZSB0cmVhdGVkIGxpa2UgaWQgYXJyYXlzLiBTbywgYWRkIC8gcmVtb3ZlIC8gaGFzXG4vLyBqdXN0IHN0b3JlcyBhbmQgcmVtb3ZlcyBpbnRlZ2Vycy5cblxuZXhwb3J0IGNsYXNzIFN0b3JhZ2Uge1xuXG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIC8vIGEgXCJ0ZXJtaW5hbFwiIHN0b3JhZ2UgZmFjaWxpdHkgaXMgdGhlIGVuZCBvZiB0aGUgc3RvcmFnZSBjaGFpbi5cbiAgICAvLyB1c3VhbGx5IHNxbCBvbiB0aGUgc2VydmVyIHNpZGUgYW5kIHJlc3Qgb24gdGhlIGNsaWVudCBzaWRlLCBpdCAqbXVzdCpcbiAgICAvLyByZWNlaXZlIHRoZSB3cml0ZXMsIGFuZCBpcyB0aGUgZmluYWwgYXV0aG9yaXRhdGl2ZSBhbnN3ZXIgb24gd2hldGhlclxuICAgIC8vIHNvbWV0aGluZyBpcyA0MDQuXG5cbiAgICAvLyB0ZXJtaW5hbCBmYWNpbGl0aWVzIGFyZSBhbHNvIHRoZSBvbmx5IG9uZXMgdGhhdCBjYW4gYXV0aG9yaXRhdGl2ZWx5IGFuc3dlclxuICAgIC8vIGF1dGhvcml6YXRpb24gcXVlc3Rpb25zLCBidXQgdGhlIGRlc2lnbiBtYXkgYWxsb3cgZm9yIGF1dGhvcml6YXRpb24gdG8gYmVcbiAgICAvLyBjYWNoZWQuXG4gICAgdGhpcy50ZXJtaW5hbCA9IG9wdHMudGVybWluYWwgfHwgZmFsc2U7XG4gICAgdGhpc1skZW1pdHRlcl0gPSBuZXcgU3ViamVjdCgpO1xuICB9XG5cbiAgaG90KHR5cGUsIGlkKSB7XG4gICAgLy8gdDogdHlwZSwgaWQ6IGlkIChpbnRlZ2VyKS5cbiAgICAvLyBpZiBob3QsIHRoZW4gY29uc2lkZXIgdGhpcyB2YWx1ZSBhdXRob3JpdGF0aXZlLCBubyBuZWVkIHRvIGdvIGRvd25cbiAgICAvLyB0aGUgZGF0YXN0b3JlIGNoYWluLiBDb25zaWRlciBhIG1lbW9yeXN0b3JhZ2UgdXNlZCBhcyBhIHRvcC1sZXZlbCBjYWNoZS5cbiAgICAvLyBpZiB0aGUgbWVtc3RvcmUgaGFzIHRoZSB2YWx1ZSwgaXQncyBob3QgYW5kIHVwLXRvLWRhdGUuIE9UT0gsIGFcbiAgICAvLyBsb2NhbHN0b3JhZ2UgY2FjaGUgbWF5IGJlIGFuIG91dC1vZi1kYXRlIHZhbHVlICh1cGRhdGVkIHNpbmNlIGxhc3Qgc2VlbilcblxuICAgIC8vIHRoaXMgZGVzaWduIGxldHMgaG90IGJlIHNldCBieSB0eXBlIGFuZCBpZC4gSW4gcGFydGljdWxhciwgdGhlIGdvYWwgZm9yIHRoZVxuICAgIC8vIGZyb250LWVuZCBpcyB0byBoYXZlIHByb2ZpbGUgb2JqZWN0cyBiZSBob3QtY2FjaGVkIGluIHRoZSBtZW1zdG9yZSwgYnV0IG5vdGhpbmdcbiAgICAvLyBlbHNlIChpbiBvcmRlciB0byBub3QgcnVuIHRoZSBicm93c2VyIG91dCBvZiBtZW1vcnkpXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgd3JpdGUodHlwZSwgdmFsdWUpIHtcbiAgICAvLyBpZiB2YWx1ZS5pZCBleGlzdHMsIHRoaXMgaXMgYW4gdXBkYXRlLiBJZiBpdCBkb2Vzbid0LCBpdCBpcyBhblxuICAgIC8vIGluc2VydC4gSW4gdGhlIGNhc2Ugb2YgYW4gdXBkYXRlLCBpdCBzaG91bGQgbWVyZ2UgZG93biB0aGUgdHJlZS5cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignV3JpdGUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgLy8gVE9ETzogd3JpdGUgdGhlIHR3by13YXkgaGFzL2dldCBsb2dpYyBpbnRvIHRoaXMgbWV0aG9kXG4gIC8vIGFuZCBwcm92aWRlIG92ZXJyaWRlIGhvb2tzIGZvciByZWFkT25lIHJlYWRNYW55XG5cbiAgcmVhZCh0eXBlLCBpZCwga2V5KSB7XG4gICAgbGV0IGtleXMgPSBbJHNlbGZdO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGtleSkpIHtcbiAgICAgIGtleXMgPSBrZXk7XG4gICAgfSBlbHNlIGlmIChrZXkpIHtcbiAgICAgIGtleXMgPSBba2V5XTtcbiAgICB9XG4gICAgaWYgKGtleXMuaW5kZXhPZigkYWxsKSA+PSAwKSB7XG4gICAgICBrZXlzID0gT2JqZWN0LmtleXModHlwZS4kc2NoZW1hLnJlbGF0aW9uc2hpcHMpO1xuICAgICAga2V5cy5wdXNoKCRzZWxmKTtcbiAgICB9XG4gICAgLy8gaWYgKGtleXMuaW5kZXhPZigkc2VsZikgPCAwKSB7XG4gICAgLy8gICBrZXlzLnB1c2goJHNlbGYpO1xuICAgIC8vIH1cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChrZXlzLm1hcCgoaykgPT4ge1xuICAgICAgICBpZiAoKGsgIT09ICRzZWxmKSAmJiAodHlwZS4kc2NoZW1hLnJlbGF0aW9uc2hpcHNba10pKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucmVhZE1hbnkodHlwZSwgaWQsIGspO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzLnJlYWRPbmUodHlwZSwgaWQpO1xuICAgICAgICB9XG4gICAgICB9KSkudGhlbigodmFsQXJyYXkpID0+IHtcbiAgICAgICAgY29uc3Qgc2VsZklkeCA9IGtleXMuaW5kZXhPZigkc2VsZik7XG4gICAgICAgIGNvbnN0IHJldFZhbCA9IHt9O1xuICAgICAgICBpZiAoc2VsZklkeCA+PSAwKSB7XG4gICAgICAgICAgaWYgKHZhbEFycmF5W3NlbGZJZHhdID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihyZXRWYWwsIHZhbEFycmF5W3NlbGZJZHhdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFsQXJyYXkuZm9yRWFjaCgodmFsLCBpZHgpID0+IHtcbiAgICAgICAgICBpZiAoaWR4ICE9PSBzZWxmSWR4KSB7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKHJldFZhbCwgdmFsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmV0VmFsO1xuICAgICAgfSk7XG4gICAgfSkudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBpZCwgcmVzdWx0LCBrZXlzKVxuICAgICAgICAudGhlbigoKSA9PiByZXN1bHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIHdpcGUgc2hvdWxkIHF1aWV0bHkgZXJhc2UgYSB2YWx1ZSBmcm9tIHRoZSBzdG9yZS4gVGhpcyBpcyB1c2VkIGR1cmluZ1xuICAvLyBjYWNoZSBpbnZhbGlkYXRpb24gZXZlbnRzIHdoZW4gdGhlIGN1cnJlbnQgdmFsdWUgaXMga25vd24gdG8gYmUgaW5jb3JyZWN0LlxuICAvLyBpdCBpcyBub3QgYSBkZWxldGUgKHdoaWNoIGlzIGEgdXNlci1pbml0aWF0ZWQsIGV2ZW50LWNhdXNpbmcgdGhpbmcpLCBidXRcbiAgLy8gc2hvdWxkIHJlc3VsdCBpbiB0aGlzIHZhbHVlIG5vdCBzdG9yZWQgaW4gc3RvcmFnZSBhbnltb3JlLlxuXG4gIHdpcGUodHlwZSwgaWQsIGZpZWxkKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ1dpcGUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgcmVhZE9uZSh0eXBlLCBpZCkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdSZWFkT25lIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHJlYWRNYW55KHR5cGUsIGlkLCBrZXkpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignUmVhZE1hbnkgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgZGVsZXRlKHR5cGUsIGlkKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0RlbGV0ZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBhZGQodHlwZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlLCBjaGlsZElkLCBleHRyYXMgPSB7fSkge1xuICAgIC8vIGFkZCB0byBhIGhhc01hbnkgcmVsYXRpb25zaGlwXG4gICAgLy8gbm90ZSB0aGF0IGhhc01hbnkgZmllbGRzIGNhbiBoYXZlIChpbXBsLXNwZWNpZmljKSB2YWxlbmNlIGRhdGEgKG5vdyByZW5hbWVkIGV4dHJhcylcbiAgICAvLyBleGFtcGxlOiBtZW1iZXJzaGlwIGJldHdlZW4gcHJvZmlsZSBhbmQgY29tbXVuaXR5IGNhbiBoYXZlIHBlcm0gMSwgMiwgM1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdBZGQgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgcmVtb3ZlKHR5cGUsIGlkLCByZWxhdGlvbnNoaXBUaXRsZSwgY2hpbGRJZCkge1xuICAgIC8vIHJlbW92ZSBmcm9tIGEgaGFzTWFueSByZWxhdGlvbnNoaXBcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcigncmVtb3ZlIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIG1vZGlmeVJlbGF0aW9uc2hpcCh0eXBlLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUsIGNoaWxkSWQsIGV4dHJhcyA9IHt9KSB7XG4gICAgLy8gc2hvdWxkIG1vZGlmeSBhbiBleGlzdGluZyBoYXNNYW55IHZhbGVuY2UgZGF0YS4gVGhyb3cgaWYgbm90IGV4aXN0aW5nLlxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdtb2RpZnlSZWxhdGlvbnNoaXAgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgcXVlcnkocSkge1xuICAgIC8vIHE6IHt0eXBlOiBzdHJpbmcsIHF1ZXJ5OiBhbnl9XG4gICAgLy8gcS5xdWVyeSBpcyBpbXBsIGRlZmluZWQgLSBhIHN0cmluZyBmb3Igc3FsIChyYXcgc3FsKVxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdRdWVyeSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBvblVwZGF0ZShvYnNlcnZlcikge1xuICAgIC8vIG9ic2VydmVyIGZvbGxvd3MgdGhlIFJ4SlMgcGF0dGVybiAtIGl0IGlzIGVpdGhlciBhIGZ1bmN0aW9uIChmb3IgbmV4dCgpKVxuICAgIC8vIG9yIHtuZXh0LCBlcnJvciwgY29tcGxldGV9O1xuICAgIC8vIHJldHVybnMgYW4gdW5zdWIgaG9vayAocmV0VmFsLnVuc3Vic2NyaWJlKCkpXG4gICAgcmV0dXJuIHRoaXNbJGVtaXR0ZXJdLnN1YnNjcmliZShvYnNlcnZlcik7XG4gIH1cblxuICBub3RpZnlVcGRhdGUodHlwZSwgaWQsIHZhbHVlLCBvcHRzID0gWyRzZWxmXSkge1xuICAgIGxldCBrZXlzID0gb3B0cztcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoa2V5cykpIHtcbiAgICAgIGtleXMgPSBba2V5c107XG4gICAgfVxuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoa2V5cy5tYXAoKGZpZWxkKSA9PiB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgICAgaWYgKGZpZWxkICE9PSAkc2VsZikge1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIHRoaXNbJGVtaXR0ZXJdLm5leHQoe1xuICAgICAgICAgICAgICAgIHR5cGUsIGlkLCBmaWVsZCwgdmFsdWU6IHZhbHVlW2ZpZWxkXSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVhZE1hbnkodHlwZSwgaWQsIGZpZWxkKVxuICAgICAgICAgICAgICAudGhlbigobGlzdCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXNbJGVtaXR0ZXJdLm5leHQoe1xuICAgICAgICAgICAgICAgICAgdHlwZSwgaWQsIGZpZWxkLCB2YWx1ZTogbGlzdFtmaWVsZF0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzWyRlbWl0dGVyXS5uZXh0KHtcbiAgICAgICAgICAgICAgdHlwZSwgaWQsIHZhbHVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pKTtcbiAgfVxuXG4gICQkdGVzdEluZGV4KC4uLmFyZ3MpIHtcbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDEpIHtcbiAgICAgIGlmIChhcmdzWzBdLiRpZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBvcGVyYXRpb24gb24gYW4gdW5zYXZlZCBuZXcgbW9kZWwnKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGFyZ3NbMV1bYXJnc1swXS4kaWRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBvcGVyYXRpb24gb24gYW4gdW5zYXZlZCBuZXcgbW9kZWwnKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vLyBjb252ZW5pZW5jZSBmdW5jdGlvbiB0aGF0IHdhbGtzIGFuIGFycmF5IHJlcGxhY2luZyBhbnkge2lkfSB3aXRoIGNvbnRleHQuaWRcblN0b3JhZ2UubWFzc1JlcGxhY2UgPSBmdW5jdGlvbiBtYXNzUmVwbGFjZShibG9jaywgY29udGV4dCkge1xuICByZXR1cm4gYmxvY2subWFwKCh2KSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodikpIHtcbiAgICAgIHJldHVybiBtYXNzUmVwbGFjZSh2LCBjb250ZXh0KTtcbiAgICB9IGVsc2UgaWYgKCh0eXBlb2YgdiA9PT0gJ3N0cmluZycpICYmICh2Lm1hdGNoKC9eXFx7KC4qKVxcfSQvKSkpIHtcbiAgICAgIHJldHVybiBjb250ZXh0W3YubWF0Y2goL15cXHsoLiopXFx9JC8pWzFdXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHY7XG4gICAgfVxuICB9KTtcbn07XG4iXX0=
