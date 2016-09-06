'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MemoryStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _storage = require('./storage');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var $store = Symbol('$store');

var MemoryStorage = exports.MemoryStorage = function (_Storage) {
  _inherits(MemoryStorage, _Storage);

  function MemoryStorage() {
    _classCallCheck(this, MemoryStorage);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(MemoryStorage).call(this));

    _this[$store] = [];
    return _this;
  }

  _createClass(MemoryStorage, [{
    key: '$$ensure',
    value: function $$ensure(t) {
      if (this[$store][t.$name] === undefined) {
        this[$store][t.$name] = {};
      }
      return this[$store][t.$name];
    }
  }, {
    key: 'create',
    value: function create(t, v) {
      if (this.$$ensure(t)[v.id] === undefined) {
        this.$$ensure(t)[v.id] = v;
        return Promise.resolve(v);
      } else {
        return Promise.reject(new Error('Cannot overwrite existing value in memstore'));
      }
    }
  }, {
    key: 'read',
    value: function read(t, id) {
      return Promise.resolve(this.$$ensure(t)[id] || null);
    }
  }, {
    key: 'update',
    value: function update(t, v) {
      if (this.$$ensure(t)[t.$id] === undefined) {
        this.$$ensure(t)[t.$id] = _defineProperty({}, t.constructor.$id, t.$id);
      }
      var updateObject = this.$$ensure(t)[t.$id];
      Object.keys(t.constructor.$fields).forEach(function (fieldName) {
        if (v[fieldName] !== undefined) {
          // copy from v to the best of our ability
          if (t.constructor.$fields[fieldName].type === 'array' || t.constructor.$fields[fieldName].type === 'hasMany') {
            updateObject[fieldName] = v[fieldName].concat();
          } else if (t.constructor.$fields[fieldName].type === 'object') {
            updateObject[fieldName] = Object.assign({}, v[fieldName]);
          } else {
            updateObject[fieldName] = v[fieldName];
          }
        }
      });
      return Promise.resolve(Object.assign({}, updateObject));
    }
  }, {
    key: 'delete',
    value: function _delete(t, id) {
      var retVal = this.$$ensure(t)[id];
      delete this.$$ensure(t)[id];
      return Promise.resolve(retVal);
    }
  }, {
    key: 'query',
    value: function query() {
      return Promise.reject(new Error('Query interface not supported on MemoryStorage'));
    }
  }]);

  return MemoryStorage;
}(_storage.Storage);
//# sourceMappingURL=data:application/json;base64,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QUNEIiwiZmlsZSI6InN0b3JhZ2UvbWVtb3J5LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQge1N0b3JhZ2V9IGZyb20gJy4vc3RvcmFnZSc7XG5cbmNvbnN0ICRzdG9yZSA9IFN5bWJvbCgnJHN0b3JlJyk7XG5cbmV4cG9ydCBjbGFzcyBNZW1vcnlTdG9yYWdlIGV4dGVuZHMgU3RvcmFnZSB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzWyRzdG9yZV0gPSBbXTtcbiAgfVxuXG4gICQkZW5zdXJlKHQpIHtcbiAgICBpZiAodGhpc1skc3RvcmVdW3QuJG5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHN0b3JlXVt0LiRuYW1lXSA9IHt9O1xuICAgIH1cbiAgICByZXR1cm4gdGhpc1skc3RvcmVdW3QuJG5hbWVdO1xuICB9XG5cbiAgY3JlYXRlKHQsIHYpIHtcbiAgICBpZiAodGhpcy4kJGVuc3VyZSh0KVt2LmlkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLiQkZW5zdXJlKHQpW3YuaWRdID0gdjtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCBvdmVyd3JpdGUgZXhpc3RpbmcgdmFsdWUgaW4gbWVtc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgcmVhZCh0LCBpZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy4kJGVuc3VyZSh0KVtpZF0gfHwgbnVsbCk7XG4gIH1cblxuICB1cGRhdGUodCwgdikge1xuICAgIGlmICh0aGlzLiQkZW5zdXJlKHQpW3QuJGlkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLiQkZW5zdXJlKHQpW3QuJGlkXSA9IHtcbiAgICAgICAgW3QuY29uc3RydWN0b3IuJGlkXTogdC4kaWQsXG4gICAgICB9O1xuICAgIH1cbiAgICBjb25zdCB1cGRhdGVPYmplY3QgPSB0aGlzLiQkZW5zdXJlKHQpW3QuJGlkXTtcbiAgICBPYmplY3Qua2V5cyh0LmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgaWYgKHZbZmllbGROYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGNvcHkgZnJvbSB2IHRvIHRoZSBiZXN0IG9mIG91ciBhYmlsaXR5XG4gICAgICAgIGlmIChcbiAgICAgICAgICAodC5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2FycmF5JykgfHxcbiAgICAgICAgICAodC5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2hhc01hbnknKVxuICAgICAgICApIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IHZbZmllbGROYW1lXS5jb25jYXQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0LmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgdltmaWVsZE5hbWVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IHZbZmllbGROYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoT2JqZWN0LmFzc2lnbih7fSwgdXBkYXRlT2JqZWN0KSk7XG4gIH1cblxuICBkZWxldGUodCwgaWQpIHtcbiAgICBjb25zdCByZXRWYWwgPSB0aGlzLiQkZW5zdXJlKHQpW2lkXTtcbiAgICBkZWxldGUgdGhpcy4kJGVuc3VyZSh0KVtpZF07XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXRWYWwpO1xuICB9XG5cbiAgcXVlcnkoKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUXVlcnkgaW50ZXJmYWNlIG5vdCBzdXBwb3J0ZWQgb24gTWVtb3J5U3RvcmFnZScpKTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
