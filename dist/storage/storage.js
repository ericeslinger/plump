'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Storage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* eslint no-unused-vars: 0 */

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _Rx = require('rxjs/Rx');

var _Rx2 = _interopRequireDefault(_Rx);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Storage);

    // a "terminal" storage facility is the end of the storage chain.
    // usually sql on the server side and rest on the client side, it *must*
    // receive the writes, and is the final authoritative answer on whether
    // something is 404.

    // terminal facilities are also the only ones that can authoritatively answer
    // authorization questions, but the design may allow for authorization to be
    // cached.
    this.terminal = opts.terminal || false;
    this[$emitter] = new _Rx2.default.Subject();
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
      return Promise.reject(new Error('Write not implemented'));
    }
  }, {
    key: 'onCacheableRead',
    value: function onCacheableRead(type, value) {
      // override this if you want to not react to cacheableRead events.
      return this.write(type, value);
    }

    // TODO: write the two-way has/get logic into this method
    // and provide override hooks for readOne readMany

  }, {
    key: 'read',
    value: function read(type, id, key) {
      if (key && type.$fields[key].type === 'hasMany') {
        return this.readMany(type, id, key);
      } else {
        return this.readOne(type, id);
      }
    }
  }, {
    key: 'readOne',
    value: function readOne(type, id) {
      return Promise.reject(new Error('ReadOne not implemented'));
    }
  }, {
    key: 'readMany',
    value: function readMany(type, id, key) {
      return Promise.reject(new Error('ReadMany not implemented'));
    }
  }, {
    key: 'delete',
    value: function _delete(type, id) {
      return Promise.reject(new Error('Delete not implemented'));
    }
  }, {
    key: 'add',
    value: function add(type, id, relationship, childId) {
      var valence = arguments.length <= 4 || arguments[4] === undefined ? {} : arguments[4];

      // add to a hasMany relationship
      // note that hasMany fields can have (impl-specific) valence data
      // example: membership between profile and community can have perm 1, 2, 3
      return Promise.reject(new Error('Add not implemented'));
    }
  }, {
    key: 'remove',
    value: function remove(type, id, relationship, childId) {
      // remove from a hasMany relationship
      return Promise.reject(new Error('remove not implemented'));
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(type, id, relationship, childId) {
      var valence = arguments.length <= 4 || arguments[4] === undefined ? {} : arguments[4];

      // should modify an existing hasMany valence data. Throw if not existing.
      return Promise.reject(new Error('modifyRelationship not implemented'));
    }
  }, {
    key: 'query',
    value: function query(q) {
      // q: {type: string, query: any}
      // q.query is impl defined - a string for sql (raw sql)
      return Promise.reject(new Error('Query not implemented'));
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
    key: 'update',
    value: function update(type, id, value) {
      this[$emitter]({
        type: type, id: id, value: value
      });
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
      } else {
        if (args[1][args[0].$id] === undefined) {
          throw new Error('Illegal operation on an unsaved new model');
        }
      }
    }
  }]);

  return Storage;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJQcm9taXNlIiwiJGVtaXR0ZXIiLCJTeW1ib2wiLCJTdG9yYWdlIiwib3B0cyIsInRlcm1pbmFsIiwiU3ViamVjdCIsInR5cGUiLCJpZCIsInZhbHVlIiwicmVqZWN0IiwiRXJyb3IiLCJ3cml0ZSIsImtleSIsIiRmaWVsZHMiLCJyZWFkTWFueSIsInJlYWRPbmUiLCJyZWxhdGlvbnNoaXAiLCJjaGlsZElkIiwidmFsZW5jZSIsInEiLCJvYnNlcnZlciIsInN1YnNjcmliZSIsImFyZ3MiLCJsZW5ndGgiLCIkaWQiLCJ1bmRlZmluZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7cWpCQUFBOztBQUVBOztJQUFZQSxPOztBQUNaOzs7Ozs7Ozs7O0FBRUEsSUFBTUMsV0FBV0MsT0FBTyxVQUFQLENBQWpCOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7SUFFYUMsTyxXQUFBQSxPO0FBRVgscUJBQXVCO0FBQUEsUUFBWEMsSUFBVyx5REFBSixFQUFJOztBQUFBOztBQUNyQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxTQUFLQyxRQUFMLEdBQWdCRCxLQUFLQyxRQUFMLElBQWlCLEtBQWpDO0FBQ0EsU0FBS0osUUFBTCxJQUFpQixJQUFJLGFBQUdLLE9BQVAsRUFBakI7QUFDRDs7Ozt3QkFFR0MsSSxFQUFNQyxFLEVBQUk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGFBQU8sS0FBUDtBQUNEOzs7MEJBRUtELEksRUFBTUUsSyxFQUFPO0FBQ2pCO0FBQ0E7QUFDQSxhQUFPVCxRQUFRVSxNQUFSLENBQWUsSUFBSUMsS0FBSixDQUFVLHVCQUFWLENBQWYsQ0FBUDtBQUNEOzs7b0NBRWVKLEksRUFBTUUsSyxFQUFPO0FBQzNCO0FBQ0EsYUFBTyxLQUFLRyxLQUFMLENBQVdMLElBQVgsRUFBaUJFLEtBQWpCLENBQVA7QUFDRDs7QUFFRDtBQUNBOzs7O3lCQUVLRixJLEVBQU1DLEUsRUFBSUssRyxFQUFLO0FBQ2xCLFVBQUlBLE9BQU9OLEtBQUtPLE9BQUwsQ0FBYUQsR0FBYixFQUFrQk4sSUFBbEIsS0FBMkIsU0FBdEMsRUFBaUQ7QUFDL0MsZUFBTyxLQUFLUSxRQUFMLENBQWNSLElBQWQsRUFBb0JDLEVBQXBCLEVBQXdCSyxHQUF4QixDQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBTyxLQUFLRyxPQUFMLENBQWFULElBQWIsRUFBbUJDLEVBQW5CLENBQVA7QUFDRDtBQUNGOzs7NEJBRU9ELEksRUFBTUMsRSxFQUFJO0FBQ2hCLGFBQU9SLFFBQVFVLE1BQVIsQ0FBZSxJQUFJQyxLQUFKLENBQVUseUJBQVYsQ0FBZixDQUFQO0FBQ0Q7Ozs2QkFFUUosSSxFQUFNQyxFLEVBQUlLLEcsRUFBSztBQUN0QixhQUFPYixRQUFRVSxNQUFSLENBQWUsSUFBSUMsS0FBSixDQUFVLDBCQUFWLENBQWYsQ0FBUDtBQUNEOzs7NEJBRU1KLEksRUFBTUMsRSxFQUFJO0FBQ2YsYUFBT1IsUUFBUVUsTUFBUixDQUFlLElBQUlDLEtBQUosQ0FBVSx3QkFBVixDQUFmLENBQVA7QUFDRDs7O3dCQUVHSixJLEVBQU1DLEUsRUFBSVMsWSxFQUFjQyxPLEVBQXVCO0FBQUEsVUFBZEMsT0FBYyx5REFBSixFQUFJOztBQUNqRDtBQUNBO0FBQ0E7QUFDQSxhQUFPbkIsUUFBUVUsTUFBUixDQUFlLElBQUlDLEtBQUosQ0FBVSxxQkFBVixDQUFmLENBQVA7QUFDRDs7OzJCQUVNSixJLEVBQU1DLEUsRUFBSVMsWSxFQUFjQyxPLEVBQVM7QUFDdEM7QUFDQSxhQUFPbEIsUUFBUVUsTUFBUixDQUFlLElBQUlDLEtBQUosQ0FBVSx3QkFBVixDQUFmLENBQVA7QUFDRDs7O3VDQUVrQkosSSxFQUFNQyxFLEVBQUlTLFksRUFBY0MsTyxFQUF1QjtBQUFBLFVBQWRDLE9BQWMseURBQUosRUFBSTs7QUFDaEU7QUFDQSxhQUFPbkIsUUFBUVUsTUFBUixDQUFlLElBQUlDLEtBQUosQ0FBVSxvQ0FBVixDQUFmLENBQVA7QUFDRDs7OzBCQUVLUyxDLEVBQUc7QUFDUDtBQUNBO0FBQ0EsYUFBT3BCLFFBQVFVLE1BQVIsQ0FBZSxJQUFJQyxLQUFKLENBQVUsdUJBQVYsQ0FBZixDQUFQO0FBQ0Q7Ozs2QkFFUVUsUSxFQUFVO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBLGFBQU8sS0FBS3BCLFFBQUwsRUFBZXFCLFNBQWYsQ0FBeUJELFFBQXpCLENBQVA7QUFDRDs7OzJCQUVNZCxJLEVBQU1DLEUsRUFBSUMsSyxFQUFPO0FBQ3RCLFdBQUtSLFFBQUwsRUFBZTtBQUNiTSxrQkFEYSxFQUNQQyxNQURPLEVBQ0hDO0FBREcsT0FBZjtBQUdEOzs7a0NBRW9CO0FBQUEsd0NBQU5jLElBQU07QUFBTkEsWUFBTTtBQUFBOztBQUNuQixVQUFJQSxLQUFLQyxNQUFMLEtBQWdCLENBQXBCLEVBQXVCO0FBQ3JCLFlBQUlELEtBQUssQ0FBTCxFQUFRRSxHQUFSLEtBQWdCQyxTQUFwQixFQUErQjtBQUM3QixnQkFBTSxJQUFJZixLQUFKLENBQVUsMkNBQVYsQ0FBTjtBQUNEO0FBQ0YsT0FKRCxNQUlPO0FBQ0wsWUFBSVksS0FBSyxDQUFMLEVBQVFBLEtBQUssQ0FBTCxFQUFRRSxHQUFoQixNQUF5QkMsU0FBN0IsRUFBd0M7QUFDdEMsZ0JBQU0sSUFBSWYsS0FBSixDQUFVLDJDQUFWLENBQU47QUFDRDtBQUNGO0FBQ0YiLCJmaWxlIjoic3RvcmFnZS9zdG9yYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50IG5vLXVudXNlZC12YXJzOiAwICovXG5cbmltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IFJ4IGZyb20gJ3J4anMvUngnO1xuXG5jb25zdCAkZW1pdHRlciA9IFN5bWJvbCgnJGVtaXR0ZXInKTtcblxuLy8gdHlwZTogYW4gb2JqZWN0IHRoYXQgZGVmaW5lcyB0aGUgdHlwZS4gdHlwaWNhbGx5IHRoaXMgd2lsbCBiZVxuLy8gcGFydCBvZiB0aGUgTW9kZWwgY2xhc3MgaGllcmFyY2h5LCBidXQgU3RvcmFnZSBvYmplY3RzIGNhbGwgbm8gbWV0aG9kc1xuLy8gb24gdGhlIHR5cGUgb2JqZWN0LiBXZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIFR5cGUuJG5hbWUsIFR5cGUuJGlkIGFuZCBUeXBlLiRmaWVsZHMuXG4vLyBOb3RlIHRoYXQgVHlwZS4kaWQgaXMgdGhlICpuYW1lIG9mIHRoZSBpZCBmaWVsZCogb24gaW5zdGFuY2VzXG4vLyAgICBhbmQgTk9UIHRoZSBhY3R1YWwgaWQgZmllbGQgKGUuZy4sIGluIG1vc3QgY2FzZXMsIFR5cGUuJGlkID09PSAnaWQnKS5cbi8vIGlkOiB1bmlxdWUgaWQuIE9mdGVuIGFuIGludGVnZXIsIGJ1dCBub3QgbmVjZXNzYXJ5IChjb3VsZCBiZSBhbiBvaWQpXG5cblxuLy8gaGFzTWFueSByZWxhdGlvbnNoaXBzIGFyZSB0cmVhdGVkIGxpa2UgaWQgYXJyYXlzLiBTbywgYWRkIC8gcmVtb3ZlIC8gaGFzXG4vLyBqdXN0IHN0b3JlcyBhbmQgcmVtb3ZlcyBpbnRlZ2Vycy5cblxuZXhwb3J0IGNsYXNzIFN0b3JhZ2Uge1xuXG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIC8vIGEgXCJ0ZXJtaW5hbFwiIHN0b3JhZ2UgZmFjaWxpdHkgaXMgdGhlIGVuZCBvZiB0aGUgc3RvcmFnZSBjaGFpbi5cbiAgICAvLyB1c3VhbGx5IHNxbCBvbiB0aGUgc2VydmVyIHNpZGUgYW5kIHJlc3Qgb24gdGhlIGNsaWVudCBzaWRlLCBpdCAqbXVzdCpcbiAgICAvLyByZWNlaXZlIHRoZSB3cml0ZXMsIGFuZCBpcyB0aGUgZmluYWwgYXV0aG9yaXRhdGl2ZSBhbnN3ZXIgb24gd2hldGhlclxuICAgIC8vIHNvbWV0aGluZyBpcyA0MDQuXG5cbiAgICAvLyB0ZXJtaW5hbCBmYWNpbGl0aWVzIGFyZSBhbHNvIHRoZSBvbmx5IG9uZXMgdGhhdCBjYW4gYXV0aG9yaXRhdGl2ZWx5IGFuc3dlclxuICAgIC8vIGF1dGhvcml6YXRpb24gcXVlc3Rpb25zLCBidXQgdGhlIGRlc2lnbiBtYXkgYWxsb3cgZm9yIGF1dGhvcml6YXRpb24gdG8gYmVcbiAgICAvLyBjYWNoZWQuXG4gICAgdGhpcy50ZXJtaW5hbCA9IG9wdHMudGVybWluYWwgfHwgZmFsc2U7XG4gICAgdGhpc1skZW1pdHRlcl0gPSBuZXcgUnguU3ViamVjdCgpO1xuICB9XG5cbiAgaG90KHR5cGUsIGlkKSB7XG4gICAgLy8gdDogdHlwZSwgaWQ6IGlkIChpbnRlZ2VyKS5cbiAgICAvLyBpZiBob3QsIHRoZW4gY29uc2lkZXIgdGhpcyB2YWx1ZSBhdXRob3JpdGF0aXZlLCBubyBuZWVkIHRvIGdvIGRvd25cbiAgICAvLyB0aGUgZGF0YXN0b3JlIGNoYWluLiBDb25zaWRlciBhIG1lbW9yeXN0b3JhZ2UgdXNlZCBhcyBhIHRvcC1sZXZlbCBjYWNoZS5cbiAgICAvLyBpZiB0aGUgbWVtc3RvcmUgaGFzIHRoZSB2YWx1ZSwgaXQncyBob3QgYW5kIHVwLXRvLWRhdGUuIE9UT0gsIGFcbiAgICAvLyBsb2NhbHN0b3JhZ2UgY2FjaGUgbWF5IGJlIGFuIG91dC1vZi1kYXRlIHZhbHVlICh1cGRhdGVkIHNpbmNlIGxhc3Qgc2VlbilcblxuICAgIC8vIHRoaXMgZGVzaWduIGxldHMgaG90IGJlIHNldCBieSB0eXBlIGFuZCBpZC4gSW4gcGFydGljdWxhciwgdGhlIGdvYWwgZm9yIHRoZVxuICAgIC8vIGZyb250LWVuZCBpcyB0byBoYXZlIHByb2ZpbGUgb2JqZWN0cyBiZSBob3QtY2FjaGVkIGluIHRoZSBtZW1zdG9yZSwgYnV0IG5vdGhpbmdcbiAgICAvLyBlbHNlIChpbiBvcmRlciB0byBub3QgcnVuIHRoZSBicm93c2VyIG91dCBvZiBtZW1vcnkpXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgd3JpdGUodHlwZSwgdmFsdWUpIHtcbiAgICAvLyBpZiB2YWx1ZS5pZCBleGlzdHMsIHRoaXMgaXMgYW4gdXBkYXRlLiBJZiBpdCBkb2Vzbid0LCBpdCBpcyBhblxuICAgIC8vIGluc2VydC4gSW4gdGhlIGNhc2Ugb2YgYW4gdXBkYXRlLCBpdCBzaG91bGQgbWVyZ2UgZG93biB0aGUgdHJlZS5cbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdXcml0ZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBvbkNhY2hlYWJsZVJlYWQodHlwZSwgdmFsdWUpIHtcbiAgICAvLyBvdmVycmlkZSB0aGlzIGlmIHlvdSB3YW50IHRvIG5vdCByZWFjdCB0byBjYWNoZWFibGVSZWFkIGV2ZW50cy5cbiAgICByZXR1cm4gdGhpcy53cml0ZSh0eXBlLCB2YWx1ZSk7XG4gIH1cblxuICAvLyBUT0RPOiB3cml0ZSB0aGUgdHdvLXdheSBoYXMvZ2V0IGxvZ2ljIGludG8gdGhpcyBtZXRob2RcbiAgLy8gYW5kIHByb3ZpZGUgb3ZlcnJpZGUgaG9va3MgZm9yIHJlYWRPbmUgcmVhZE1hbnlcblxuICByZWFkKHR5cGUsIGlkLCBrZXkpIHtcbiAgICBpZiAoa2V5ICYmIHR5cGUuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgcmV0dXJuIHRoaXMucmVhZE1hbnkodHlwZSwgaWQsIGtleSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnJlYWRPbmUodHlwZSwgaWQpO1xuICAgIH1cbiAgfVxuXG4gIHJlYWRPbmUodHlwZSwgaWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdSZWFkT25lIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHJlYWRNYW55KHR5cGUsIGlkLCBrZXkpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdSZWFkTWFueSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBkZWxldGUodHlwZSwgaWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdEZWxldGUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgYWRkKHR5cGUsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQsIHZhbGVuY2UgPSB7fSkge1xuICAgIC8vIGFkZCB0byBhIGhhc01hbnkgcmVsYXRpb25zaGlwXG4gICAgLy8gbm90ZSB0aGF0IGhhc01hbnkgZmllbGRzIGNhbiBoYXZlIChpbXBsLXNwZWNpZmljKSB2YWxlbmNlIGRhdGFcbiAgICAvLyBleGFtcGxlOiBtZW1iZXJzaGlwIGJldHdlZW4gcHJvZmlsZSBhbmQgY29tbXVuaXR5IGNhbiBoYXZlIHBlcm0gMSwgMiwgM1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0FkZCBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICByZW1vdmUodHlwZSwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCkge1xuICAgIC8vIHJlbW92ZSBmcm9tIGEgaGFzTWFueSByZWxhdGlvbnNoaXBcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdyZW1vdmUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKHR5cGUsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQsIHZhbGVuY2UgPSB7fSkge1xuICAgIC8vIHNob3VsZCBtb2RpZnkgYW4gZXhpc3RpbmcgaGFzTWFueSB2YWxlbmNlIGRhdGEuIFRocm93IGlmIG5vdCBleGlzdGluZy5cbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdtb2RpZnlSZWxhdGlvbnNoaXAgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgcXVlcnkocSkge1xuICAgIC8vIHE6IHt0eXBlOiBzdHJpbmcsIHF1ZXJ5OiBhbnl9XG4gICAgLy8gcS5xdWVyeSBpcyBpbXBsIGRlZmluZWQgLSBhIHN0cmluZyBmb3Igc3FsIChyYXcgc3FsKVxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1F1ZXJ5IG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIG9uVXBkYXRlKG9ic2VydmVyKSB7XG4gICAgLy8gb2JzZXJ2ZXIgZm9sbG93cyB0aGUgUnhKUyBwYXR0ZXJuIC0gaXQgaXMgZWl0aGVyIGEgZnVuY3Rpb24gKGZvciBuZXh0KCkpXG4gICAgLy8gb3Ige25leHQsIGVycm9yLCBjb21wbGV0ZX07XG4gICAgLy8gcmV0dXJucyBhbiB1bnN1YiBob29rIChyZXRWYWwudW5zdWJzY3JpYmUoKSlcbiAgICByZXR1cm4gdGhpc1skZW1pdHRlcl0uc3Vic2NyaWJlKG9ic2VydmVyKTtcbiAgfVxuXG4gIHVwZGF0ZSh0eXBlLCBpZCwgdmFsdWUpIHtcbiAgICB0aGlzWyRlbWl0dGVyXSh7XG4gICAgICB0eXBlLCBpZCwgdmFsdWUsXG4gICAgfSk7XG4gIH1cblxuICAkJHRlc3RJbmRleCguLi5hcmdzKSB7XG4gICAgaWYgKGFyZ3MubGVuZ3RoID09PSAxKSB7XG4gICAgICBpZiAoYXJnc1swXS4kaWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lsbGVnYWwgb3BlcmF0aW9uIG9uIGFuIHVuc2F2ZWQgbmV3IG1vZGVsJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChhcmdzWzFdW2FyZ3NbMF0uJGlkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBvcGVyYXRpb24gb24gYW4gdW5zYXZlZCBuZXcgbW9kZWwnKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
