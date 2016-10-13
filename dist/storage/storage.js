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
    value: function read(type, id) {
      return Promise.reject(new Error('Read not implemented'));
    }
  }, {
    key: 'delete',
    value: function _delete(type, id) {
      return Promise.reject(new Error('Delete not implemented'));
    }
  }, {
    key: 'add',
    value: function add(type, id, relationship, childId) {
      var valence = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

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
      var valence = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJQcm9taXNlIiwiJGVtaXR0ZXIiLCJTeW1ib2wiLCJTdG9yYWdlIiwib3B0cyIsInRlcm1pbmFsIiwiU3ViamVjdCIsInR5cGUiLCJpZCIsInZhbHVlIiwicmVqZWN0IiwiRXJyb3IiLCJ3cml0ZSIsInJlbGF0aW9uc2hpcCIsImNoaWxkSWQiLCJ2YWxlbmNlIiwicSIsIm9ic2VydmVyIiwic3Vic2NyaWJlIiwiYXJncyIsImxlbmd0aCIsIiRpZCIsInVuZGVmaW5lZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztxakJBQUE7O0FBRUE7O0lBQVlBLE87O0FBQ1o7Ozs7Ozs7Ozs7QUFFQSxJQUFNQyxXQUFXQyxPQUFPLFVBQVAsQ0FBakI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztJQUVhQyxPLFdBQUFBLE87QUFFWCxxQkFBdUI7QUFBQSxRQUFYQyxJQUFXLHVFQUFKLEVBQUk7O0FBQUE7O0FBQ3JCO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFNBQUtDLFFBQUwsR0FBZ0JELEtBQUtDLFFBQUwsSUFBaUIsS0FBakM7QUFDQSxTQUFLSixRQUFMLElBQWlCLElBQUksYUFBR0ssT0FBUCxFQUFqQjtBQUNEOzs7O3dCQUVHQyxJLEVBQU1DLEUsRUFBSTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsYUFBTyxLQUFQO0FBQ0Q7OzswQkFFS0QsSSxFQUFNRSxLLEVBQU87QUFDakI7QUFDQTtBQUNBLGFBQU9ULFFBQVFVLE1BQVIsQ0FBZSxJQUFJQyxLQUFKLENBQVUsdUJBQVYsQ0FBZixDQUFQO0FBQ0Q7OztvQ0FFZUosSSxFQUFNRSxLLEVBQU87QUFDM0I7QUFDQSxhQUFPLEtBQUtHLEtBQUwsQ0FBV0wsSUFBWCxFQUFpQkUsS0FBakIsQ0FBUDtBQUNEOztBQUVEO0FBQ0E7Ozs7eUJBRUtGLEksRUFBTUMsRSxFQUFJO0FBQ2IsYUFBT1IsUUFBUVUsTUFBUixDQUFlLElBQUlDLEtBQUosQ0FBVSxzQkFBVixDQUFmLENBQVA7QUFDRDs7OzRCQUVNSixJLEVBQU1DLEUsRUFBSTtBQUNmLGFBQU9SLFFBQVFVLE1BQVIsQ0FBZSxJQUFJQyxLQUFKLENBQVUsd0JBQVYsQ0FBZixDQUFQO0FBQ0Q7Ozt3QkFFR0osSSxFQUFNQyxFLEVBQUlLLFksRUFBY0MsTyxFQUF1QjtBQUFBLFVBQWRDLE9BQWMsdUVBQUosRUFBSTs7QUFDakQ7QUFDQTtBQUNBO0FBQ0EsYUFBT2YsUUFBUVUsTUFBUixDQUFlLElBQUlDLEtBQUosQ0FBVSxxQkFBVixDQUFmLENBQVA7QUFDRDs7OzJCQUVNSixJLEVBQU1DLEUsRUFBSUssWSxFQUFjQyxPLEVBQVM7QUFDdEM7QUFDQSxhQUFPZCxRQUFRVSxNQUFSLENBQWUsSUFBSUMsS0FBSixDQUFVLHdCQUFWLENBQWYsQ0FBUDtBQUNEOzs7dUNBRWtCSixJLEVBQU1DLEUsRUFBSUssWSxFQUFjQyxPLEVBQXVCO0FBQUEsVUFBZEMsT0FBYyx1RUFBSixFQUFJOztBQUNoRTtBQUNBLGFBQU9mLFFBQVFVLE1BQVIsQ0FBZSxJQUFJQyxLQUFKLENBQVUsb0NBQVYsQ0FBZixDQUFQO0FBQ0Q7OzswQkFFS0ssQyxFQUFHO0FBQ1A7QUFDQTtBQUNBLGFBQU9oQixRQUFRVSxNQUFSLENBQWUsSUFBSUMsS0FBSixDQUFVLHVCQUFWLENBQWYsQ0FBUDtBQUNEOzs7NkJBRVFNLFEsRUFBVTtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxhQUFPLEtBQUtoQixRQUFMLEVBQWVpQixTQUFmLENBQXlCRCxRQUF6QixDQUFQO0FBQ0Q7OzsyQkFFTVYsSSxFQUFNQyxFLEVBQUlDLEssRUFBTztBQUN0QixXQUFLUixRQUFMLEVBQWU7QUFDYk0sa0JBRGEsRUFDUEMsTUFETyxFQUNIQztBQURHLE9BQWY7QUFHRDs7O2tDQUVvQjtBQUFBLHdDQUFOVSxJQUFNO0FBQU5BLFlBQU07QUFBQTs7QUFDbkIsVUFBSUEsS0FBS0MsTUFBTCxLQUFnQixDQUFwQixFQUF1QjtBQUNyQixZQUFJRCxLQUFLLENBQUwsRUFBUUUsR0FBUixLQUFnQkMsU0FBcEIsRUFBK0I7QUFDN0IsZ0JBQU0sSUFBSVgsS0FBSixDQUFVLDJDQUFWLENBQU47QUFDRDtBQUNGLE9BSkQsTUFJTztBQUNMLFlBQUlRLEtBQUssQ0FBTCxFQUFRQSxLQUFLLENBQUwsRUFBUUUsR0FBaEIsTUFBeUJDLFNBQTdCLEVBQXdDO0FBQ3RDLGdCQUFNLElBQUlYLEtBQUosQ0FBVSwyQ0FBVixDQUFOO0FBQ0Q7QUFDRjtBQUNGIiwiZmlsZSI6InN0b3JhZ2Uvc3RvcmFnZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludCBuby11bnVzZWQtdmFyczogMCAqL1xuXG5pbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBSeCBmcm9tICdyeGpzL1J4JztcblxuY29uc3QgJGVtaXR0ZXIgPSBTeW1ib2woJyRlbWl0dGVyJyk7XG5cbi8vIHR5cGU6IGFuIG9iamVjdCB0aGF0IGRlZmluZXMgdGhlIHR5cGUuIHR5cGljYWxseSB0aGlzIHdpbGwgYmVcbi8vIHBhcnQgb2YgdGhlIE1vZGVsIGNsYXNzIGhpZXJhcmNoeSwgYnV0IFN0b3JhZ2Ugb2JqZWN0cyBjYWxsIG5vIG1ldGhvZHNcbi8vIG9uIHRoZSB0eXBlIG9iamVjdC4gV2Ugb25seSBhcmUgaW50ZXJlc3RlZCBpbiBUeXBlLiRuYW1lLCBUeXBlLiRpZCBhbmQgVHlwZS4kZmllbGRzLlxuLy8gTm90ZSB0aGF0IFR5cGUuJGlkIGlzIHRoZSAqbmFtZSBvZiB0aGUgaWQgZmllbGQqIG9uIGluc3RhbmNlc1xuLy8gICAgYW5kIE5PVCB0aGUgYWN0dWFsIGlkIGZpZWxkIChlLmcuLCBpbiBtb3N0IGNhc2VzLCBUeXBlLiRpZCA9PT0gJ2lkJykuXG4vLyBpZDogdW5pcXVlIGlkLiBPZnRlbiBhbiBpbnRlZ2VyLCBidXQgbm90IG5lY2Vzc2FyeSAoY291bGQgYmUgYW4gb2lkKVxuXG5cbi8vIGhhc01hbnkgcmVsYXRpb25zaGlwcyBhcmUgdHJlYXRlZCBsaWtlIGlkIGFycmF5cy4gU28sIGFkZCAvIHJlbW92ZSAvIGhhc1xuLy8ganVzdCBzdG9yZXMgYW5kIHJlbW92ZXMgaW50ZWdlcnMuXG5cbmV4cG9ydCBjbGFzcyBTdG9yYWdlIHtcblxuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICAvLyBhIFwidGVybWluYWxcIiBzdG9yYWdlIGZhY2lsaXR5IGlzIHRoZSBlbmQgb2YgdGhlIHN0b3JhZ2UgY2hhaW4uXG4gICAgLy8gdXN1YWxseSBzcWwgb24gdGhlIHNlcnZlciBzaWRlIGFuZCByZXN0IG9uIHRoZSBjbGllbnQgc2lkZSwgaXQgKm11c3QqXG4gICAgLy8gcmVjZWl2ZSB0aGUgd3JpdGVzLCBhbmQgaXMgdGhlIGZpbmFsIGF1dGhvcml0YXRpdmUgYW5zd2VyIG9uIHdoZXRoZXJcbiAgICAvLyBzb21ldGhpbmcgaXMgNDA0LlxuXG4gICAgLy8gdGVybWluYWwgZmFjaWxpdGllcyBhcmUgYWxzbyB0aGUgb25seSBvbmVzIHRoYXQgY2FuIGF1dGhvcml0YXRpdmVseSBhbnN3ZXJcbiAgICAvLyBhdXRob3JpemF0aW9uIHF1ZXN0aW9ucywgYnV0IHRoZSBkZXNpZ24gbWF5IGFsbG93IGZvciBhdXRob3JpemF0aW9uIHRvIGJlXG4gICAgLy8gY2FjaGVkLlxuICAgIHRoaXMudGVybWluYWwgPSBvcHRzLnRlcm1pbmFsIHx8IGZhbHNlO1xuICAgIHRoaXNbJGVtaXR0ZXJdID0gbmV3IFJ4LlN1YmplY3QoKTtcbiAgfVxuXG4gIGhvdCh0eXBlLCBpZCkge1xuICAgIC8vIHQ6IHR5cGUsIGlkOiBpZCAoaW50ZWdlcikuXG4gICAgLy8gaWYgaG90LCB0aGVuIGNvbnNpZGVyIHRoaXMgdmFsdWUgYXV0aG9yaXRhdGl2ZSwgbm8gbmVlZCB0byBnbyBkb3duXG4gICAgLy8gdGhlIGRhdGFzdG9yZSBjaGFpbi4gQ29uc2lkZXIgYSBtZW1vcnlzdG9yYWdlIHVzZWQgYXMgYSB0b3AtbGV2ZWwgY2FjaGUuXG4gICAgLy8gaWYgdGhlIG1lbXN0b3JlIGhhcyB0aGUgdmFsdWUsIGl0J3MgaG90IGFuZCB1cC10by1kYXRlLiBPVE9ILCBhXG4gICAgLy8gbG9jYWxzdG9yYWdlIGNhY2hlIG1heSBiZSBhbiBvdXQtb2YtZGF0ZSB2YWx1ZSAodXBkYXRlZCBzaW5jZSBsYXN0IHNlZW4pXG5cbiAgICAvLyB0aGlzIGRlc2lnbiBsZXRzIGhvdCBiZSBzZXQgYnkgdHlwZSBhbmQgaWQuIEluIHBhcnRpY3VsYXIsIHRoZSBnb2FsIGZvciB0aGVcbiAgICAvLyBmcm9udC1lbmQgaXMgdG8gaGF2ZSBwcm9maWxlIG9iamVjdHMgYmUgaG90LWNhY2hlZCBpbiB0aGUgbWVtc3RvcmUsIGJ1dCBub3RoaW5nXG4gICAgLy8gZWxzZSAoaW4gb3JkZXIgdG8gbm90IHJ1biB0aGUgYnJvd3NlciBvdXQgb2YgbWVtb3J5KVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHdyaXRlKHR5cGUsIHZhbHVlKSB7XG4gICAgLy8gaWYgdmFsdWUuaWQgZXhpc3RzLCB0aGlzIGlzIGFuIHVwZGF0ZS4gSWYgaXQgZG9lc24ndCwgaXQgaXMgYW5cbiAgICAvLyBpbnNlcnQuIEluIHRoZSBjYXNlIG9mIGFuIHVwZGF0ZSwgaXQgc2hvdWxkIG1lcmdlIGRvd24gdGhlIHRyZWUuXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignV3JpdGUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgb25DYWNoZWFibGVSZWFkKHR5cGUsIHZhbHVlKSB7XG4gICAgLy8gb3ZlcnJpZGUgdGhpcyBpZiB5b3Ugd2FudCB0byBub3QgcmVhY3QgdG8gY2FjaGVhYmxlUmVhZCBldmVudHMuXG4gICAgcmV0dXJuIHRoaXMud3JpdGUodHlwZSwgdmFsdWUpO1xuICB9XG5cbiAgLy8gVE9ETzogd3JpdGUgdGhlIHR3by13YXkgaGFzL2dldCBsb2dpYyBpbnRvIHRoaXMgbWV0aG9kXG4gIC8vIGFuZCBwcm92aWRlIG92ZXJyaWRlIGhvb2tzIGZvciByZWFkT25lIHJlYWRNYW55XG5cbiAgcmVhZCh0eXBlLCBpZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1JlYWQgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgZGVsZXRlKHR5cGUsIGlkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignRGVsZXRlIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIGFkZCh0eXBlLCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkLCB2YWxlbmNlID0ge30pIHtcbiAgICAvLyBhZGQgdG8gYSBoYXNNYW55IHJlbGF0aW9uc2hpcFxuICAgIC8vIG5vdGUgdGhhdCBoYXNNYW55IGZpZWxkcyBjYW4gaGF2ZSAoaW1wbC1zcGVjaWZpYykgdmFsZW5jZSBkYXRhXG4gICAgLy8gZXhhbXBsZTogbWVtYmVyc2hpcCBiZXR3ZWVuIHByb2ZpbGUgYW5kIGNvbW11bml0eSBjYW4gaGF2ZSBwZXJtIDEsIDIsIDNcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdBZGQgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgcmVtb3ZlKHR5cGUsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQpIHtcbiAgICAvLyByZW1vdmUgZnJvbSBhIGhhc01hbnkgcmVsYXRpb25zaGlwXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcigncmVtb3ZlIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIG1vZGlmeVJlbGF0aW9uc2hpcCh0eXBlLCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkLCB2YWxlbmNlID0ge30pIHtcbiAgICAvLyBzaG91bGQgbW9kaWZ5IGFuIGV4aXN0aW5nIGhhc01hbnkgdmFsZW5jZSBkYXRhLiBUaHJvdyBpZiBub3QgZXhpc3RpbmcuXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignbW9kaWZ5UmVsYXRpb25zaGlwIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHF1ZXJ5KHEpIHtcbiAgICAvLyBxOiB7dHlwZTogc3RyaW5nLCBxdWVyeTogYW55fVxuICAgIC8vIHEucXVlcnkgaXMgaW1wbCBkZWZpbmVkIC0gYSBzdHJpbmcgZm9yIHNxbCAocmF3IHNxbClcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdRdWVyeSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBvblVwZGF0ZShvYnNlcnZlcikge1xuICAgIC8vIG9ic2VydmVyIGZvbGxvd3MgdGhlIFJ4SlMgcGF0dGVybiAtIGl0IGlzIGVpdGhlciBhIGZ1bmN0aW9uIChmb3IgbmV4dCgpKVxuICAgIC8vIG9yIHtuZXh0LCBlcnJvciwgY29tcGxldGV9O1xuICAgIC8vIHJldHVybnMgYW4gdW5zdWIgaG9vayAocmV0VmFsLnVuc3Vic2NyaWJlKCkpXG4gICAgcmV0dXJuIHRoaXNbJGVtaXR0ZXJdLnN1YnNjcmliZShvYnNlcnZlcik7XG4gIH1cblxuICB1cGRhdGUodHlwZSwgaWQsIHZhbHVlKSB7XG4gICAgdGhpc1skZW1pdHRlcl0oe1xuICAgICAgdHlwZSwgaWQsIHZhbHVlLFxuICAgIH0pO1xuICB9XG5cbiAgJCR0ZXN0SW5kZXgoLi4uYXJncykge1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgaWYgKGFyZ3NbMF0uJGlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbGxlZ2FsIG9wZXJhdGlvbiBvbiBhbiB1bnNhdmVkIG5ldyBtb2RlbCcpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoYXJnc1sxXVthcmdzWzBdLiRpZF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lsbGVnYWwgb3BlcmF0aW9uIG9uIGFuIHVuc2F2ZWQgbmV3IG1vZGVsJyk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
