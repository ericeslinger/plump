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
      } else if (key && key !== _model.$all) {
        keys = [key];
      } else if (key === _model.$all) {
        keys = Object.keys(type.$fields).map(function (k) {
          return type.$fields[k].type === 'hasMany' ? k : null;
        }).filter(function (v) {
          return v !== null;
        }).push(_model.$self);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsIiRlbWl0dGVyIiwiU3ltYm9sIiwiU3RvcmFnZSIsIm9wdHMiLCJ0ZXJtaW5hbCIsInR5cGUiLCJpZCIsInZhbHVlIiwicmVqZWN0IiwiRXJyb3IiLCJrZXkiLCJrZXlzIiwiQXJyYXkiLCJpc0FycmF5IiwiT2JqZWN0IiwiJGZpZWxkcyIsIm1hcCIsImsiLCJmaWx0ZXIiLCJ2IiwicHVzaCIsInJlc29sdmUiLCJ0aGVuIiwiYWxsIiwicmVhZE1hbnkiLCJyZWFkT25lIiwidmFsQXJyYXkiLCJzZWxmSWR4IiwiaW5kZXhPZiIsInJldFZhbCIsImFzc2lnbiIsImZvckVhY2giLCJ2YWwiLCJpZHgiLCJyZXN1bHQiLCJub3RpZnlVcGRhdGUiLCJyZWxhdGlvbnNoaXAiLCJjaGlsZElkIiwidmFsZW5jZSIsInEiLCJvYnNlcnZlciIsInN1YnNjcmliZSIsImZpZWxkIiwibmV4dCIsImxpc3QiLCJhcmdzIiwibGVuZ3RoIiwiJGlkIiwidW5kZWZpbmVkIiwibWFzc1JlcGxhY2UiLCJibG9jayIsImNvbnRleHQiLCJtYXRjaCJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztxakJBQUE7O0FBRUE7O0lBQVlBLFE7O0FBQ1o7O0FBQ0E7Ozs7OztBQUVBLElBQU1DLFdBQVdDLE9BQU8sVUFBUCxDQUFqQjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0lBRWFDLE8sV0FBQUEsTztBQUVYLHFCQUF1QjtBQUFBLFFBQVhDLElBQVcsdUVBQUosRUFBSTs7QUFBQTs7QUFDckI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsU0FBS0MsUUFBTCxHQUFnQkQsS0FBS0MsUUFBTCxJQUFpQixLQUFqQztBQUNBLFNBQUtKLFFBQUwsSUFBaUIsaUJBQWpCO0FBQ0Q7Ozs7d0JBRUdLLEksRUFBTUMsRSxFQUFJO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtB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QixnQkFBTSxJQUFJdkMsS0FBSixDQUFVLDJDQUFWLENBQU47QUFDRDtBQUNGLE9BSkQsTUFJTyxJQUFJb0MsS0FBSyxDQUFMLEVBQVFBLEtBQUssQ0FBTCxFQUFRRSxHQUFoQixNQUF5QkMsU0FBN0IsRUFBd0M7QUFDN0MsY0FBTSxJQUFJdkMsS0FBSixDQUFVLDJDQUFWLENBQU47QUFDRDtBQUNGOzs7Ozs7QUFJSDs7O0FBQ0FQLFFBQVErQyxXQUFSLEdBQXNCLFNBQVNBLFdBQVQsQ0FBcUJDLEtBQXJCLEVBQTRCQyxPQUE1QixFQUFxQztBQUN6RCxTQUFPRCxNQUFNbEMsR0FBTixDQUFVLFVBQUNHLENBQUQsRUFBTztBQUN0QixRQUFJUCxNQUFNQyxPQUFOLENBQWNNLENBQWQsQ0FBSixFQUFzQjtBQUNwQixhQUFPOEIsWUFBWTlCLENBQVosRUFBZWdDLE9BQWYsQ0FBUDtBQUNELEtBRkQsTUFFTyxJQUFLLE9BQU9oQyxDQUFQLEtBQWEsUUFBZCxJQUE0QkEsRUFBRWlDLEtBQUYsQ0FBUSxZQUFSLENBQWhDLEVBQXdEO0FBQzdELGFBQU9ELFFBQVFoQyxFQUFFaUMsS0FBRixDQUFRLFlBQVIsRUFBc0IsQ0FBdEIsQ0FBUixDQUFQO0FBQ0QsS0FGTSxNQUVBO0FBQ0wsYUFBT2pDLENBQVA7QUFDRDtBQUNGLEdBUk0sQ0FBUDtBQVNELENBVkQiLCJmaWxlIjoic3RvcmFnZS9zdG9yYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50IG5vLXVudXNlZC12YXJzOiAwICovXG5cbmltcG9ydCAqIGFzIEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IFN1YmplY3QgfSBmcm9tICdyeGpzL1J4JztcbmltcG9ydCB7ICRzZWxmLCAkYWxsIH0gZnJvbSAnLi4vbW9kZWwnO1xuXG5jb25zdCAkZW1pdHRlciA9IFN5bWJvbCgnJGVtaXR0ZXInKTtcblxuLy8gdHlwZTogYW4gb2JqZWN0IHRoYXQgZGVmaW5lcyB0aGUgdHlwZS4gdHlwaWNhbGx5IHRoaXMgd2lsbCBiZVxuLy8gcGFydCBvZiB0aGUgTW9kZWwgY2xhc3MgaGllcmFyY2h5LCBidXQgU3RvcmFnZSBvYmplY3RzIGNhbGwgbm8gbWV0aG9kc1xuLy8gb24gdGhlIHR5cGUgb2JqZWN0LiBXZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIFR5cGUuJG5hbWUsIFR5cGUuJGlkIGFuZCBUeXBlLiRmaWVsZHMuXG4vLyBOb3RlIHRoYXQgVHlwZS4kaWQgaXMgdGhlICpuYW1lIG9mIHRoZSBpZCBmaWVsZCogb24gaW5zdGFuY2VzXG4vLyAgICBhbmQgTk9UIHRoZSBhY3R1YWwgaWQgZmllbGQgKGUuZy4sIGluIG1vc3QgY2FzZXMsIFR5cGUuJGlkID09PSAnaWQnKS5cbi8vIGlkOiB1bmlxdWUgaWQuIE9mdGVuIGFuIGludGVnZXIsIGJ1dCBub3QgbmVjZXNzYXJ5IChjb3VsZCBiZSBhbiBvaWQpXG5cblxuLy8gaGFzTWFueSByZWxhdGlvbnNoaXBzIGFyZSB0cmVhdGVkIGxpa2UgaWQgYXJyYXlzLiBTbywgYWRkIC8gcmVtb3ZlIC8gaGFzXG4vLyBqdXN0IHN0b3JlcyBhbmQgcmVtb3ZlcyBpbnRlZ2Vycy5cblxuZXhwb3J0IGNsYXNzIFN0b3JhZ2Uge1xuXG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIC8vIGEgXCJ0ZXJtaW5hbFwiIHN0b3JhZ2UgZmFjaWxpdHkgaXMgdGhlIGVuZCBvZiB0aGUgc3RvcmFnZSBjaGFpbi5cbiAgICAvLyB1c3VhbGx5IHNxbCBvbiB0aGUgc2VydmVyIHNpZGUgYW5kIHJlc3Qgb24gdGhlIGNsaWVudCBzaWRlLCBpdCAqbXVzdCpcbiAgICAvLyByZWNlaXZlIHRoZSB3cml0ZXMsIGFuZCBpcyB0aGUgZmluYWwgYXV0aG9yaXRhdGl2ZSBhbnN3ZXIgb24gd2hldGhlclxuICAgIC8vIHNvbWV0aGluZyBpcyA0MDQuXG5cbiAgICAvLyB0ZXJtaW5hbCBmYWNpbGl0aWVzIGFyZSBhbHNvIHRoZSBvbmx5IG9uZXMgdGhhdCBjYW4gYXV0aG9yaXRhdGl2ZWx5IGFuc3dlclxuICAgIC8vIGF1dGhvcml6YXRpb24gcXVlc3Rpb25zLCBidXQgdGhlIGRlc2lnbiBtYXkgYWxsb3cgZm9yIGF1dGhvcml6YXRpb24gdG8gYmVcbiAgICAvLyBjYWNoZWQuXG4gICAgdGhpcy50ZXJtaW5hbCA9IG9wdHMudGVybWluYWwgfHwgZmFsc2U7XG4gICAgdGhpc1skZW1pdHRlcl0gPSBuZXcgU3ViamVjdCgpO1xuICB9XG5cbiAgaG90KHR5cGUsIGlkKSB7XG4gICAgLy8gdDogdHlwZSwgaWQ6IGlkIChpbnRlZ2VyKS5cbiAgICAvLyBpZiBob3QsIHRoZW4gY29uc2lkZXIgdGhpcyB2YWx1ZSBhdXRob3JpdGF0aXZlLCBubyBuZWVkIHRvIGdvIGRvd25cbiAgICAvLyB0aGUgZGF0YXN0b3JlIGNoYWluLiBDb25zaWRlciBhIG1lbW9yeXN0b3JhZ2UgdXNlZCBhcyBhIHRvcC1sZXZlbCBjYWNoZS5cbiAgICAvLyBpZiB0aGUgbWVtc3RvcmUgaGFzIHRoZSB2YWx1ZSwgaXQncyBob3QgYW5kIHVwLXRvLWRhdGUuIE9UT0gsIGFcbiAgICAvLyBsb2NhbHN0b3JhZ2UgY2FjaGUgbWF5IGJlIGFuIG91dC1vZi1kYXRlIHZhbHVlICh1cGRhdGVkIHNpbmNlIGxhc3Qgc2VlbilcblxuICAgIC8vIHRoaXMgZGVzaWduIGxldHMgaG90IGJlIHNldCBieSB0eXBlIGFuZCBpZC4gSW4gcGFydGljdWxhciwgdGhlIGdvYWwgZm9yIHRoZVxuICAgIC8vIGZyb250LWVuZCBpcyB0byBoYXZlIHByb2ZpbGUgb2JqZWN0cyBiZSBob3QtY2FjaGVkIGluIHRoZSBtZW1zdG9yZSwgYnV0IG5vdGhpbmdcbiAgICAvLyBlbHNlIChpbiBvcmRlciB0byBub3QgcnVuIHRoZSBicm93c2VyIG91dCBvZiBtZW1vcnkpXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgd3JpdGUodHlwZSwgdmFsdWUpIHtcbiAgICAvLyBpZiB2YWx1ZS5pZCBleGlzdHMsIHRoaXMgaXMgYW4gdXBkYXRlLiBJZiBpdCBkb2Vzbid0LCBpdCBpcyBhblxuICAgIC8vIGluc2VydC4gSW4gdGhlIGNhc2Ugb2YgYW4gdXBkYXRlLCBpdCBzaG91bGQgbWVyZ2UgZG93biB0aGUgdHJlZS5cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignV3JpdGUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgLy8gVE9ETzogd3JpdGUgdGhlIHR3by13YXkgaGFzL2dldCBsb2dpYyBpbnRvIHRoaXMgbWV0aG9kXG4gIC8vIGFuZCBwcm92aWRlIG92ZXJyaWRlIGhvb2tzIGZvciByZWFkT25lIHJlYWRNYW55XG5cbiAgcmVhZCh0eXBlLCBpZCwga2V5KSB7XG4gICAgbGV0IGtleXMgPSBbJHNlbGZdO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGtleSkpIHtcbiAgICAgIGtleXMgPSBrZXk7XG4gICAgfSBlbHNlIGlmIChrZXkgJiYga2V5ICE9PSAkYWxsKSB7XG4gICAgICBrZXlzID0gW2tleV07XG4gICAgfSBlbHNlIGlmIChrZXkgPT09ICRhbGwpIHtcbiAgICAgIGtleXMgPSBPYmplY3Qua2V5cyh0eXBlLiRmaWVsZHMpXG4gICAgICAubWFwKChrKSA9PiB0eXBlLiRmaWVsZHNba10udHlwZSA9PT0gJ2hhc01hbnknID8gayA6IG51bGwpXG4gICAgICAuZmlsdGVyKCh2KSA9PiB2ICE9PSBudWxsKVxuICAgICAgLnB1c2goJHNlbGYpO1xuICAgIH1cbiAgICAvLyBpZiAoa2V5cy5pbmRleE9mKCRzZWxmKSA8IDApIHtcbiAgICAvLyAgIGtleXMucHVzaCgkc2VsZik7XG4gICAgLy8gfVxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKGtleXMubWFwKChrKSA9PiB7XG4gICAgICAgIGlmICgoayAhPT0gJHNlbGYpICYmICh0eXBlLiRmaWVsZHNba10udHlwZSA9PT0gJ2hhc01hbnknKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnJlYWRNYW55KHR5cGUsIGlkLCBrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yZWFkT25lKHR5cGUsIGlkKTtcbiAgICAgICAgfVxuICAgICAgfSkpLnRoZW4oKHZhbEFycmF5KSA9PiB7XG4gICAgICAgIGNvbnN0IHNlbGZJZHggPSBrZXlzLmluZGV4T2YoJHNlbGYpO1xuICAgICAgICBjb25zdCByZXRWYWwgPSB7fTtcbiAgICAgICAgaWYgKHNlbGZJZHggPj0gMCkge1xuICAgICAgICAgIGlmICh2YWxBcnJheVtzZWxmSWR4XSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24ocmV0VmFsLCB2YWxBcnJheVtzZWxmSWR4XSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhbEFycmF5LmZvckVhY2goKHZhbCwgaWR4KSA9PiB7XG4gICAgICAgICAgaWYgKGlkeCAhPT0gc2VsZklkeCkge1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihyZXRWYWwsIHZhbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJldFZhbDtcbiAgICAgIH0pO1xuICAgIH0pLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ub3RpZnlVcGRhdGUodHlwZSwgaWQsIHJlc3VsdCwga2V5cylcbiAgICAgICAgLnRoZW4oKCkgPT4gcmVzdWx0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZWFkT25lKHR5cGUsIGlkKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ1JlYWRPbmUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgcmVhZE1hbnkodHlwZSwgaWQsIGtleSkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdSZWFkTWFueSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBkZWxldGUodHlwZSwgaWQpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignRGVsZXRlIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIGFkZCh0eXBlLCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkLCB2YWxlbmNlID0ge30pIHtcbiAgICAvLyBhZGQgdG8gYSBoYXNNYW55IHJlbGF0aW9uc2hpcFxuICAgIC8vIG5vdGUgdGhhdCBoYXNNYW55IGZpZWxkcyBjYW4gaGF2ZSAoaW1wbC1zcGVjaWZpYykgdmFsZW5jZSBkYXRhXG4gICAgLy8gZXhhbXBsZTogbWVtYmVyc2hpcCBiZXR3ZWVuIHByb2ZpbGUgYW5kIGNvbW11bml0eSBjYW4gaGF2ZSBwZXJtIDEsIDIsIDNcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignQWRkIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHJlbW92ZSh0eXBlLCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKSB7XG4gICAgLy8gcmVtb3ZlIGZyb20gYSBoYXNNYW55IHJlbGF0aW9uc2hpcFxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdyZW1vdmUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKHR5cGUsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQsIHZhbGVuY2UgPSB7fSkge1xuICAgIC8vIHNob3VsZCBtb2RpZnkgYW4gZXhpc3RpbmcgaGFzTWFueSB2YWxlbmNlIGRhdGEuIFRocm93IGlmIG5vdCBleGlzdGluZy5cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignbW9kaWZ5UmVsYXRpb25zaGlwIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHF1ZXJ5KHEpIHtcbiAgICAvLyBxOiB7dHlwZTogc3RyaW5nLCBxdWVyeTogYW55fVxuICAgIC8vIHEucXVlcnkgaXMgaW1wbCBkZWZpbmVkIC0gYSBzdHJpbmcgZm9yIHNxbCAocmF3IHNxbClcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignUXVlcnkgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgb25VcGRhdGUob2JzZXJ2ZXIpIHtcbiAgICAvLyBvYnNlcnZlciBmb2xsb3dzIHRoZSBSeEpTIHBhdHRlcm4gLSBpdCBpcyBlaXRoZXIgYSBmdW5jdGlvbiAoZm9yIG5leHQoKSlcbiAgICAvLyBvciB7bmV4dCwgZXJyb3IsIGNvbXBsZXRlfTtcbiAgICAvLyByZXR1cm5zIGFuIHVuc3ViIGhvb2sgKHJldFZhbC51bnN1YnNjcmliZSgpKVxuICAgIHJldHVybiB0aGlzWyRlbWl0dGVyXS5zdWJzY3JpYmUob2JzZXJ2ZXIpO1xuICB9XG5cbiAgbm90aWZ5VXBkYXRlKHR5cGUsIGlkLCB2YWx1ZSwgb3B0cyA9IFskc2VsZl0pIHtcbiAgICBsZXQga2V5cyA9IG9wdHM7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGtleXMpKSB7XG4gICAgICBrZXlzID0gW2tleXNdO1xuICAgIH1cbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKGtleXMubWFwKChmaWVsZCkgPT4ge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy50ZXJtaW5hbCkge1xuICAgICAgICAgIGlmIChmaWVsZCAhPT0gJHNlbGYpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICByZXR1cm4gdGhpc1skZW1pdHRlcl0ubmV4dCh7XG4gICAgICAgICAgICAgICAgdHlwZSwgaWQsIGZpZWxkLCB2YWx1ZTogdmFsdWVbZmllbGRdLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlYWRNYW55KHR5cGUsIGlkLCBmaWVsZClcbiAgICAgICAgICAgICAgLnRoZW4oKGxpc3QpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1skZW1pdHRlcl0ubmV4dCh7XG4gICAgICAgICAgICAgICAgICB0eXBlLCBpZCwgZmllbGQsIHZhbHVlOiBsaXN0W2ZpZWxkXSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzWyRlbWl0dGVyXS5uZXh0KHtcbiAgICAgICAgICAgICAgdHlwZSwgaWQsIHZhbHVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KSk7XG4gIH1cblxuICAkJHRlc3RJbmRleCguLi5hcmdzKSB7XG4gICAgaWYgKGFyZ3MubGVuZ3RoID09PSAxKSB7XG4gICAgICBpZiAoYXJnc1swXS4kaWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lsbGVnYWwgb3BlcmF0aW9uIG9uIGFuIHVuc2F2ZWQgbmV3IG1vZGVsJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChhcmdzWzFdW2FyZ3NbMF0uJGlkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lsbGVnYWwgb3BlcmF0aW9uIG9uIGFuIHVuc2F2ZWQgbmV3IG1vZGVsJyk7XG4gICAgfVxuICB9XG59XG5cblxuLy8gY29udmVuaWVuY2UgZnVuY3Rpb24gdGhhdCB3YWxrcyBhbiBhcnJheSByZXBsYWNpbmcgYW55IHtpZH0gd2l0aCBjb250ZXh0LmlkXG5TdG9yYWdlLm1hc3NSZXBsYWNlID0gZnVuY3Rpb24gbWFzc1JlcGxhY2UoYmxvY2ssIGNvbnRleHQpIHtcbiAgcmV0dXJuIGJsb2NrLm1hcCgodikgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHYpKSB7XG4gICAgICByZXR1cm4gbWFzc1JlcGxhY2UodiwgY29udGV4dCk7XG4gICAgfSBlbHNlIGlmICgodHlwZW9mIHYgPT09ICdzdHJpbmcnKSAmJiAodi5tYXRjaCgvXlxceyguKilcXH0kLykpKSB7XG4gICAgICByZXR1cm4gY29udGV4dFt2Lm1hdGNoKC9eXFx7KC4qKVxcfSQvKVsxXV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB2O1xuICAgIH1cbiAgfSk7XG59O1xuIl19
