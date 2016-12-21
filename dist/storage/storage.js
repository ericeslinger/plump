'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Storage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* eslint no-unused-vars: 0 */

var _bluebird = require('bluebird');

var Bluebird = _interopRequireWildcard(_bluebird);

var _Rx = require('rxjs/Rx');

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
      var _this = this;

      return Bluebird.resolve().then(function () {
        if (key && type.$fields[key].type === 'hasMany') {
          return _this.readMany(type, id, key);
        } else {
          return _this.readOne(type, id);
        }
      }).then(function (result) {
        return _this.notifyUpdate(type, id, result).then(function () {
          return result;
        });
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
    key: 'notifyRelationshipUpdate',
    value: function notifyRelationshipUpdate(type, id, field) {
      var _this2 = this;

      return Bluebird.resolve().then(function () {
        if (_this2.terminal) {
          return _this2.readMany(type, id, field).then(function (value) {
            return _this2[$emitter].next({
              type: type, id: id, field: field, value: value[field]
            });
          });
        } else {
          return null;
        }
      });
    }
  }, {
    key: 'notifyUpdate',
    value: function notifyUpdate(type, id, value) {
      var _this3 = this;

      return Bluebird.resolve().then(function () {
        if (_this3.terminal) {
          return _this3[$emitter].next({
            type: type, id: id, value: value
          });
        } else {
          return null;
        }
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsIiRlbWl0dGVyIiwiU3ltYm9sIiwiU3RvcmFnZSIsIm9wdHMiLCJ0ZXJtaW5hbCIsInR5cGUiLCJpZCIsInZhbHVlIiwicmVqZWN0IiwiRXJyb3IiLCJ3cml0ZSIsImtleSIsInJlc29sdmUiLCJ0aGVuIiwiJGZpZWxkcyIsInJlYWRNYW55IiwicmVhZE9uZSIsInJlc3VsdCIsIm5vdGlmeVVwZGF0ZSIsInJlbGF0aW9uc2hpcCIsImNoaWxkSWQiLCJ2YWxlbmNlIiwicSIsIm9ic2VydmVyIiwic3Vic2NyaWJlIiwiZmllbGQiLCJuZXh0IiwiYXJncyIsImxlbmd0aCIsIiRpZCIsInVuZGVmaW5lZCIsIm1hc3NSZXBsYWNlIiwiYmxvY2siLCJjb250ZXh0IiwibWFwIiwidiIsIkFycmF5IiwiaXNBcnJheSIsIm1hdGNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O3FqQkFBQTs7QUFFQTs7SUFBWUEsUTs7QUFDWjs7Ozs7O0FBRUEsSUFBTUMsV0FBV0MsT0FBTyxVQUFQLENBQWpCOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7SUFFYUMsTyxXQUFBQSxPO0FBRVgscUJBQXVCO0FBQUEsUUFBWEMsSUFBVyx1RUFBSixFQUFJOztBQUFBOztBQUNyQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxTQUFLQyxRQUFMLEdBQWdCRCxLQUFLQyxRQUFMLElBQWlCLEtBQWpDO0FBQ0EsU0FBS0osUUFBTCxJQUFpQixpQkFBakI7QUFDRDs7Ozt3QkFFR0ssSSxFQUFNQyxFLEVBQUk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGFBQU8sS0FBUDtBQUNEOzs7MEJBRUtELEksRUFBTUUsSyxFQUFPO0FBQ2pCO0FBQ0E7QUFDQSxhQUFPUixTQUFTUyxNQUFULENBQWdCLElBQUlDLEtBQUosQ0FBVSx1QkFBVixDQUFo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T0wsUUFBUUUsRUFBRUcsS0FBRixDQUFRLFlBQVIsRUFBc0IsQ0FBdEIsQ0FBUixDQUFQO0FBQ0QsS0FGTSxNQUVBO0FBQ0wsYUFBT0gsQ0FBUDtBQUNEO0FBQ0YsR0FSTSxDQUFQO0FBU0QsQ0FWRCIsImZpbGUiOiJzdG9yYWdlL3N0b3JhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQgbm8tdW51c2VkLXZhcnM6IDAgKi9cblxuaW1wb3J0ICogYXMgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHsgU3ViamVjdCB9IGZyb20gJ3J4anMvUngnO1xuXG5jb25zdCAkZW1pdHRlciA9IFN5bWJvbCgnJGVtaXR0ZXInKTtcblxuLy8gdHlwZTogYW4gb2JqZWN0IHRoYXQgZGVmaW5lcyB0aGUgdHlwZS4gdHlwaWNhbGx5IHRoaXMgd2lsbCBiZVxuLy8gcGFydCBvZiB0aGUgTW9kZWwgY2xhc3MgaGllcmFyY2h5LCBidXQgU3RvcmFnZSBvYmplY3RzIGNhbGwgbm8gbWV0aG9kc1xuLy8gb24gdGhlIHR5cGUgb2JqZWN0LiBXZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIFR5cGUuJG5hbWUsIFR5cGUuJGlkIGFuZCBUeXBlLiRmaWVsZHMuXG4vLyBOb3RlIHRoYXQgVHlwZS4kaWQgaXMgdGhlICpuYW1lIG9mIHRoZSBpZCBmaWVsZCogb24gaW5zdGFuY2VzXG4vLyAgICBhbmQgTk9UIHRoZSBhY3R1YWwgaWQgZmllbGQgKGUuZy4sIGluIG1vc3QgY2FzZXMsIFR5cGUuJGlkID09PSAnaWQnKS5cbi8vIGlkOiB1bmlxdWUgaWQuIE9mdGVuIGFuIGludGVnZXIsIGJ1dCBub3QgbmVjZXNzYXJ5IChjb3VsZCBiZSBhbiBvaWQpXG5cblxuLy8gaGFzTWFueSByZWxhdGlvbnNoaXBzIGFyZSB0cmVhdGVkIGxpa2UgaWQgYXJyYXlzLiBTbywgYWRkIC8gcmVtb3ZlIC8gaGFzXG4vLyBqdXN0IHN0b3JlcyBhbmQgcmVtb3ZlcyBpbnRlZ2Vycy5cblxuZXhwb3J0IGNsYXNzIFN0b3JhZ2Uge1xuXG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIC8vIGEgXCJ0ZXJtaW5hbFwiIHN0b3JhZ2UgZmFjaWxpdHkgaXMgdGhlIGVuZCBvZiB0aGUgc3RvcmFnZSBjaGFpbi5cbiAgICAvLyB1c3VhbGx5IHNxbCBvbiB0aGUgc2VydmVyIHNpZGUgYW5kIHJlc3Qgb24gdGhlIGNsaWVudCBzaWRlLCBpdCAqbXVzdCpcbiAgICAvLyByZWNlaXZlIHRoZSB3cml0ZXMsIGFuZCBpcyB0aGUgZmluYWwgYXV0aG9yaXRhdGl2ZSBhbnN3ZXIgb24gd2hldGhlclxuICAgIC8vIHNvbWV0aGluZyBpcyA0MDQuXG5cbiAgICAvLyB0ZXJtaW5hbCBmYWNpbGl0aWVzIGFyZSBhbHNvIHRoZSBvbmx5IG9uZXMgdGhhdCBjYW4gYXV0aG9yaXRhdGl2ZWx5IGFuc3dlclxuICAgIC8vIGF1dGhvcml6YXRpb24gcXVlc3Rpb25zLCBidXQgdGhlIGRlc2lnbiBtYXkgYWxsb3cgZm9yIGF1dGhvcml6YXRpb24gdG8gYmVcbiAgICAvLyBjYWNoZWQuXG4gICAgdGhpcy50ZXJtaW5hbCA9IG9wdHMudGVybWluYWwgfHwgZmFsc2U7XG4gICAgdGhpc1skZW1pdHRlcl0gPSBuZXcgU3ViamVjdCgpO1xuICB9XG5cbiAgaG90KHR5cGUsIGlkKSB7XG4gICAgLy8gdDogdHlwZSwgaWQ6IGlkIChpbnRlZ2VyKS5cbiAgICAvLyBpZiBob3QsIHRoZW4gY29uc2lkZXIgdGhpcyB2YWx1ZSBhdXRob3JpdGF0aXZlLCBubyBuZWVkIHRvIGdvIGRvd25cbiAgICAvLyB0aGUgZGF0YXN0b3JlIGNoYWluLiBDb25zaWRlciBhIG1lbW9yeXN0b3JhZ2UgdXNlZCBhcyBhIHRvcC1sZXZlbCBjYWNoZS5cbiAgICAvLyBpZiB0aGUgbWVtc3RvcmUgaGFzIHRoZSB2YWx1ZSwgaXQncyBob3QgYW5kIHVwLXRvLWRhdGUuIE9UT0gsIGFcbiAgICAvLyBsb2NhbHN0b3JhZ2UgY2FjaGUgbWF5IGJlIGFuIG91dC1vZi1kYXRlIHZhbHVlICh1cGRhdGVkIHNpbmNlIGxhc3Qgc2VlbilcblxuICAgIC8vIHRoaXMgZGVzaWduIGxldHMgaG90IGJlIHNldCBieSB0eXBlIGFuZCBpZC4gSW4gcGFydGljdWxhciwgdGhlIGdvYWwgZm9yIHRoZVxuICAgIC8vIGZyb250LWVuZCBpcyB0byBoYXZlIHByb2ZpbGUgb2JqZWN0cyBiZSBob3QtY2FjaGVkIGluIHRoZSBtZW1zdG9yZSwgYnV0IG5vdGhpbmdcbiAgICAvLyBlbHNlIChpbiBvcmRlciB0byBub3QgcnVuIHRoZSBicm93c2VyIG91dCBvZiBtZW1vcnkpXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgd3JpdGUodHlwZSwgdmFsdWUpIHtcbiAgICAvLyBpZiB2YWx1ZS5pZCBleGlzdHMsIHRoaXMgaXMgYW4gdXBkYXRlLiBJZiBpdCBkb2Vzbid0LCBpdCBpcyBhblxuICAgIC8vIGluc2VydC4gSW4gdGhlIGNhc2Ugb2YgYW4gdXBkYXRlLCBpdCBzaG91bGQgbWVyZ2UgZG93biB0aGUgdHJlZS5cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignV3JpdGUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgb25DYWNoZWFibGVSZWFkKHR5cGUsIHZhbHVlKSB7XG4gICAgLy8gb3ZlcnJpZGUgdGhpcyBpZiB5b3Ugd2FudCB0byBub3QgcmVhY3QgdG8gY2FjaGVhYmxlUmVhZCBldmVudHMuXG4gICAgcmV0dXJuIHRoaXMud3JpdGUodHlwZSwgdmFsdWUpO1xuICB9XG5cbiAgLy8gVE9ETzogd3JpdGUgdGhlIHR3by13YXkgaGFzL2dldCBsb2dpYyBpbnRvIHRoaXMgbWV0aG9kXG4gIC8vIGFuZCBwcm92aWRlIG92ZXJyaWRlIGhvb2tzIGZvciByZWFkT25lIHJlYWRNYW55XG5cbiAgcmVhZCh0eXBlLCBpZCwga2V5KSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmIChrZXkgJiYgdHlwZS4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWRNYW55KHR5cGUsIGlkLCBrZXkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZE9uZSh0eXBlLCBpZCk7XG4gICAgICB9XG4gICAgfSkudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5ub3RpZnlVcGRhdGUodHlwZSwgaWQsIHJlc3VsdClcbiAgICAgIC50aGVuKCgpID0+IHJlc3VsdCk7XG4gICAgfSk7XG4gIH1cblxuICByZWFkT25lKHR5cGUsIGlkKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ1JlYWRPbmUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgcmVhZE1hbnkodHlwZSwgaWQsIGtleSkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdSZWFkTWFueSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBkZWxldGUodHlwZSwgaWQpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignRGVsZXRlIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIGFkZCh0eXBlLCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkLCB2YWxlbmNlID0ge30pIHtcbiAgICAvLyBhZGQgdG8gYSBoYXNNYW55IHJlbGF0aW9uc2hpcFxuICAgIC8vIG5vdGUgdGhhdCBoYXNNYW55IGZpZWxkcyBjYW4gaGF2ZSAoaW1wbC1zcGVjaWZpYykgdmFsZW5jZSBkYXRhXG4gICAgLy8gZXhhbXBsZTogbWVtYmVyc2hpcCBiZXR3ZWVuIHByb2ZpbGUgYW5kIGNvbW11bml0eSBjYW4gaGF2ZSBwZXJtIDEsIDIsIDNcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignQWRkIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHJlbW92ZSh0eXBlLCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKSB7XG4gICAgLy8gcmVtb3ZlIGZyb20gYSBoYXNNYW55IHJlbGF0aW9uc2hpcFxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdyZW1vdmUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKHR5cGUsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQsIHZhbGVuY2UgPSB7fSkge1xuICAgIC8vIHNob3VsZCBtb2RpZnkgYW4gZXhpc3RpbmcgaGFzTWFueSB2YWxlbmNlIGRhdGEuIFRocm93IGlmIG5vdCBleGlzdGluZy5cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignbW9kaWZ5UmVsYXRpb25zaGlwIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHF1ZXJ5KHEpIHtcbiAgICAvLyBxOiB7dHlwZTogc3RyaW5nLCBxdWVyeTogYW55fVxuICAgIC8vIHEucXVlcnkgaXMgaW1wbCBkZWZpbmVkIC0gYSBzdHJpbmcgZm9yIHNxbCAocmF3IHNxbClcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignUXVlcnkgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgb25VcGRhdGUob2JzZXJ2ZXIpIHtcbiAgICAvLyBvYnNlcnZlciBmb2xsb3dzIHRoZSBSeEpTIHBhdHRlcm4gLSBpdCBpcyBlaXRoZXIgYSBmdW5jdGlvbiAoZm9yIG5leHQoKSlcbiAgICAvLyBvciB7bmV4dCwgZXJyb3IsIGNvbXBsZXRlfTtcbiAgICAvLyByZXR1cm5zIGFuIHVuc3ViIGhvb2sgKHJldFZhbC51bnN1YnNjcmliZSgpKVxuICAgIHJldHVybiB0aGlzWyRlbWl0dGVyXS5zdWJzY3JpYmUob2JzZXJ2ZXIpO1xuICB9XG5cbiAgbm90aWZ5UmVsYXRpb25zaGlwVXBkYXRlKHR5cGUsIGlkLCBmaWVsZCkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBpZiAodGhpcy50ZXJtaW5hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkTWFueSh0eXBlLCBpZCwgZmllbGQpXG4gICAgICAgIC50aGVuKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHJldHVybiB0aGlzWyRlbWl0dGVyXS5uZXh0KHtcbiAgICAgICAgICAgIHR5cGUsIGlkLCBmaWVsZCwgdmFsdWU6IHZhbHVlW2ZpZWxkXSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIG5vdGlmeVVwZGF0ZSh0eXBlLCBpZCwgdmFsdWUpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJGVtaXR0ZXJdLm5leHQoe1xuICAgICAgICAgIHR5cGUsIGlkLCB2YWx1ZSxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICQkdGVzdEluZGV4KC4uLmFyZ3MpIHtcbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDEpIHtcbiAgICAgIGlmIChhcmdzWzBdLiRpZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBvcGVyYXRpb24gb24gYW4gdW5zYXZlZCBuZXcgbW9kZWwnKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGFyZ3NbMV1bYXJnc1swXS4kaWRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBvcGVyYXRpb24gb24gYW4gdW5zYXZlZCBuZXcgbW9kZWwnKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vLyBjb252ZW5pZW5jZSBmdW5jdGlvbiB0aGF0IHdhbGtzIGFuIGFycmF5IHJlcGxhY2luZyBhbnkge2lkfSB3aXRoIGNvbnRleHQuaWRcblN0b3JhZ2UubWFzc1JlcGxhY2UgPSBmdW5jdGlvbiBtYXNzUmVwbGFjZShibG9jaywgY29udGV4dCkge1xuICByZXR1cm4gYmxvY2subWFwKCh2KSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodikpIHtcbiAgICAgIHJldHVybiBtYXNzUmVwbGFjZSh2LCBjb250ZXh0KTtcbiAgICB9IGVsc2UgaWYgKCh0eXBlb2YgdiA9PT0gJ3N0cmluZycpICYmICh2Lm1hdGNoKC9eXFx7KC4qKVxcfSQvKSkpIHtcbiAgICAgIHJldHVybiBjb250ZXh0W3YubWF0Y2goL15cXHsoLiopXFx9JC8pWzFdXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHY7XG4gICAgfVxuICB9KTtcbn07XG4iXX0=
