'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Storage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* eslint no-unused-vars: 0 */

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Storage = exports.Storage = function () {
  function Storage() {
    _classCallCheck(this, Storage);

    this.isCache = false;
  }

  _createClass(Storage, [{
    key: 'create',
    value: function create(t, v) {
      // t: type (string) v: value
      // if v.id === undefined, this is a true create otherwise it is a store
      return Promise.reject(new Error('Create not implemented'));
    }
  }, {
    key: 'store',
    value: function store(t, key, v) {
      // t: type (string), key: key (primitive), v: value
      // often (but not always, v.id === key)
      return Promise.reject(new Error('Store not implemented'));
    }
  }, {
    key: 'read',
    value: function read(t, id) {
      // t: type (string), id: id (usually int)
      return Promise.reject(new Error('Read not implemented'));
    }
  }, {
    key: 'update',
    value: function update(t, v) {
      // t: type (string) v: value
      // v.id must not be undefined
      return Promise.reject(new Error('Update not implemented'));
    }
  }, {
    key: 'delete',
    value: function _delete(t, id) {
      // t: type (string), id: id (usually int)
      return Promise.reject(new Error('Delete not implemented'));
    }
  }, {
    key: 'query',
    value: function query(q) {
      // q: {type: string, query: any}
      // q.query is impl defined - a string for sql (raw sql)
      return Promise.reject(new Error('Query not implemented'));
    }
  }]);

  return Storage;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3RvcmFnZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7O3FqQkFBQTs7QUFFQTs7SUFBWSxPOzs7Ozs7SUFFQyxPLFdBQUEsTztBQUVYLHFCQUFjO0FBQUE7O0FBQ1osU0FBSyxPQUFMLEdBQWUsS0FBZjtBQUNEOzs7OzJCQUVNLEMsRUFBRyxDLEVBQUc7QUFDWDtBQUNBO0FBQ0EsYUFBTyxRQUFRLE1BQVIsQ0FBZSxJQUFJLEtBQUosQ0FBVSx3QkFBVixDQUFmLENBQVA7QUFDRDs7OzBCQUVLLEMsRUFBRyxHLEVBQUssQyxFQUFHO0FBQ2Y7QUFDQTtBQUNBLGFBQU8sUUFBUSxNQUFSLENBQWUsSUFBSSxLQUFKLENBQVUsdUJBQVYsQ0FBZixDQUFQO0FBQ0Q7Ozt5QkFFSSxDLEVBQUcsRSxFQUFJO0FBQ1Y7QUFDQSxhQUFPLFFBQVEsTUFBUixDQUFlLElBQUksS0FBSixDQUFVLHNCQUFWLENBQWYsQ0FBUDtBQUNEOzs7MkJBRU0sQyxFQUFHLEMsRUFBRztBQUNYO0FBQ0E7QUFDQSxhQUFPLFFBQVEsTUFBUixDQUFlLElBQUksS0FBSixDQUFVLHdCQUFWLENBQWYsQ0FBUDtBQUNEOzs7NEJBRU0sQyxFQUFHLEUsRUFBSTtBQUNaO0FBQ0EsYUFBTyxRQUFRLE1BQVIsQ0FBZSxJQUFJLEtBQUosQ0FBVSx3QkFBVixDQUFmLENBQVA7QUFDRDs7OzBCQUVLLEMsRUFBRztBQUNQO0FBQ0E7QUFDQSxhQUFPLFFBQVEsTUFBUixDQUFlLElBQUksS0FBSixDQUFVLHVCQUFWLENBQWYsQ0FBUDtBQUNEIiwiZmlsZSI6InN0b3JhZ2Uvc3RvcmFnZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludCBuby11bnVzZWQtdmFyczogMCAqL1xuXG5pbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcblxuZXhwb3J0IGNsYXNzIFN0b3JhZ2Uge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuaXNDYWNoZSA9IGZhbHNlO1xuICB9XG5cbiAgY3JlYXRlKHQsIHYpIHtcbiAgICAvLyB0OiB0eXBlIChzdHJpbmcpIHY6IHZhbHVlXG4gICAgLy8gaWYgdi5pZCA9PT0gdW5kZWZpbmVkLCB0aGlzIGlzIGEgdHJ1ZSBjcmVhdGUgb3RoZXJ3aXNlIGl0IGlzIGEgc3RvcmVcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdDcmVhdGUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgc3RvcmUodCwga2V5LCB2KSB7XG4gICAgLy8gdDogdHlwZSAoc3RyaW5nKSwga2V5OiBrZXkgKHByaW1pdGl2ZSksIHY6IHZhbHVlXG4gICAgLy8gb2Z0ZW4gKGJ1dCBub3QgYWx3YXlzLCB2LmlkID09PSBrZXkpXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignU3RvcmUgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgcmVhZCh0LCBpZCkge1xuICAgIC8vIHQ6IHR5cGUgKHN0cmluZyksIGlkOiBpZCAodXN1YWxseSBpbnQpXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUmVhZCBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICB1cGRhdGUodCwgdikge1xuICAgIC8vIHQ6IHR5cGUgKHN0cmluZykgdjogdmFsdWVcbiAgICAvLyB2LmlkIG11c3Qgbm90IGJlIHVuZGVmaW5lZFxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1VwZGF0ZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBkZWxldGUodCwgaWQpIHtcbiAgICAvLyB0OiB0eXBlIChzdHJpbmcpLCBpZDogaWQgKHVzdWFsbHkgaW50KVxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0RlbGV0ZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBxdWVyeShxKSB7XG4gICAgLy8gcToge3R5cGU6IHN0cmluZywgcXVlcnk6IGFueX1cbiAgICAvLyBxLnF1ZXJ5IGlzIGltcGwgZGVmaW5lZCAtIGEgc3RyaW5nIGZvciBzcWwgKHJhdyBzcWwpXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUXVlcnkgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
