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
    var _ref;

    _classCallCheck(this, MemoryStorage);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_ref = MemoryStorage.__proto__ || Object.getPrototypeOf(MemoryStorage)).call.apply(_ref, [this].concat(args)));

    _this[$store] = {};
    _this.maxId = 0;
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
    key: 'write',
    value: function write(t, v) {
      var id = v[t.$id];
      if (id === undefined) {
        if (this.terminal) {
          id = this.maxId + 1;
        } else {
          throw new Error('Cannot create new content in a non-terminal store');
        }
      }
      var updateObject = this.$$ensure(t)[id];
      if (updateObject === undefined) {
        this.maxId = id;
        updateObject = _defineProperty({}, t.$id, id);
        this.$$ensure(t)[id] = updateObject;
      }
      Object.keys(t.$fields).forEach(function (fieldName) {
        if (v[fieldName] !== undefined) {
          // copy from v to the best of our ability
          if (t.$fields[fieldName].type === 'array' || t.$fields[fieldName].type === 'hasMany') {
            updateObject[fieldName] = v[fieldName].concat();
          } else if (t.$fields[fieldName].type === 'object') {
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
    key: 'add',
    value: function add(t, id, relationship, childId) {
      var relationshipArray = this.$$ensure(t)[relationship + ':' + id];
      if (relationshipArray === undefined) {
        relationshipArray = [];
        this.$$ensure(t)[relationship + ':' + id] = relationshipArray;
      }
      if (relationshipArray.indexOf(childId) < 0) {
        relationshipArray.push(childId);
      }
      return Promise.resolve(relationshipArray.concat());
    }
  }, {
    key: 'read',
    value: function read(t, id, relationship) {
      var _this2 = this;

      return Promise.resolve().then(function () {
        if (relationship && t.$fields[relationship].type === 'hasMany') {
          return _defineProperty({}, relationship, (_this2.$$ensure(t)[relationship + ':' + id] || []).concat());
        } else {
          return Promise.resolve(_this2.$$ensure(t)[id] || null);
        }
      });
    }
  }, {
    key: 'remove',
    value: function remove(t, id, relationship, childId) {
      var relationshipArray = this.$$ensure(t)[relationship + ':' + id];
      if (relationshipArray !== undefined) {
        var idx = relationshipArray.indexOf(childId);
        if (idx >= 0) {
          relationshipArray.splice(idx, 1);
          return Promise.resolve(relationshipArray.concat());
        }
      }
      return Promise.reject(new Error('Item ' + childId + ' not found in ' + relationship + ' of ' + t.$name));
    }
  }, {
    key: 'query',
    value: function query() {
      return Promise.reject(new Error('Query interface not supported on MemoryStorage'));
    }
  }]);

  return MemoryStorage;
}(_storage.Storage);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvbWVtb3J5LmpzIl0sIm5hbWVzIjpbIlByb21pc2UiLCIkc3RvcmUiLCJTeW1ib2wiLCJNZW1vcnlTdG9yYWdlIiwiYXJncyIsIm1heElkIiwidCIsIiRuYW1lIiwidW5kZWZpbmVkIiwidiIsImlkIiwiJGlkIiwidGVybWluYWwiLCJFcnJvciIsInVwZGF0ZU9iamVjdCIsIiQkZW5zdXJlIiwiT2JqZWN0Iiwia2V5cyIsIiRmaWVsZHMiLCJmb3JFYWNoIiwiZmllbGROYW1lIiwidHlwZSIsImNvbmNhdCIsImFzc2lnbiIsInJlc29sdmUiLCJyZXRWYWwiLCJyZWxhdGlvbnNoaXAiLCJjaGlsZElkIiwicmVsYXRpb25zaGlwQXJyYXkiLCJpbmRleE9mIiwicHVzaCIsInRoZW4iLCJpZHgiLCJzcGxpY2UiLCJyZWplY3QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQUFZQSxPOztBQUNaOzs7Ozs7Ozs7Ozs7QUFFQSxJQUFNQyxTQUFTQyxPQUFPLFFBQVAsQ0FBZjs7SUFFYUMsYSxXQUFBQSxhOzs7QUFFWCwyQkFBcUI7QUFBQTs7QUFBQTs7QUFBQSxzQ0FBTkMsSUFBTTtBQUFOQSxVQUFNO0FBQUE7O0FBQUEseUpBQ1ZBLElBRFU7O0FBRW5CLFVBQUtILE1BQUwsSUFBZSxFQUFmO0FBQ0EsVUFBS0ksS0FBTCxHQUFhLENBQWI7QUFIbUI7QUFJcEI7Ozs7NkJBRVFDLEMsRUFBRztBQUNWLFVBQUksS0FBS0wsTUFBTCxFQUFhSyxFQUFFQyxLQUFmLE1BQTBCQyxTQUE5QixFQUF5QztBQUN2QyxhQUFLUCxNQUFMLEVBQWFLLEVBQUVDLEtBQWYsSUFBd0IsRUFBeEI7QUFDRDtBQUNELGFBQU8sS0FBS04sTUFBTCxFQUFhSyxFQUFFQyxLQUFmLENBQVA7QUFDRDs7OzBCQUVLRCxDLEVBQUdHLEMsRUFBRztBQUNWLFVBQUlDLEtBQUtELEVBQUVILEVBQUVLLEdBQUosQ0FBVDtBQUNBLFVBQUlELE9BQU9GLFNBQVgsRUFBc0I7QUFDcEIsWUFB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d0IsT0FBUixDQUFnQixPQUFLVCxRQUFMLENBQWNULENBQWQsRUFBaUJJLEVBQWpCLEtBQXdCLElBQXhDLENBQVA7QUFDRDtBQUNGLE9BUE0sQ0FBUDtBQVFEOzs7MkJBRU1KLEMsRUFBR0ksRSxFQUFJZ0IsWSxFQUFjQyxPLEVBQVM7QUFDbkMsVUFBTUMsb0JBQW9CLEtBQUtiLFFBQUwsQ0FBY1QsQ0FBZCxFQUFvQm9CLFlBQXBCLFNBQW9DaEIsRUFBcEMsQ0FBMUI7QUFDQSxVQUFJa0Isc0JBQXNCcEIsU0FBMUIsRUFBcUM7QUFDbkMsWUFBTXdCLE1BQU1KLGtCQUFrQkMsT0FBbEIsQ0FBMEJGLE9BQTFCLENBQVo7QUFDQSxZQUFJSyxPQUFPLENBQVgsRUFBYztBQUNaSiw0QkFBa0JLLE1BQWxCLENBQXlCRCxHQUF6QixFQUE4QixDQUE5QjtBQUNBLGlCQUFPaEMsUUFBUXdCLE9BQVIsQ0FBZ0JJLGtCQUFrQk4sTUFBbEIsRUFBaEIsQ0FBUDtBQUNEO0FBQ0Y7QUFDRCxhQUFPdEIsUUFBUWtDLE1BQVIsQ0FBZSxJQUFJckIsS0FBSixXQUFrQmMsT0FBbEIsc0JBQTBDRCxZQUExQyxZQUE2RHBCLEVBQUVDLEtBQS9ELENBQWYsQ0FBUDtBQUNEOzs7NEJBRU87QUFDTixhQUFPUCxRQUFRa0MsTUFBUixDQUFlLElBQUlyQixLQUFKLENBQVUsZ0RBQVYsQ0FBZixDQUFQO0FBQ0QiLCJmaWxlIjoic3RvcmFnZS9tZW1vcnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7U3RvcmFnZX0gZnJvbSAnLi9zdG9yYWdlJztcblxuY29uc3QgJHN0b3JlID0gU3ltYm9sKCckc3RvcmUnKTtcblxuZXhwb3J0IGNsYXNzIE1lbW9yeVN0b3JhZ2UgZXh0ZW5kcyBTdG9yYWdlIHtcblxuICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgc3VwZXIoLi4uYXJncyk7XG4gICAgdGhpc1skc3RvcmVdID0ge307XG4gICAgdGhpcy5tYXhJZCA9IDA7XG4gIH1cblxuICAkJGVuc3VyZSh0KSB7XG4gICAgaWYgKHRoaXNbJHN0b3JlXVt0LiRuYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyRzdG9yZV1bdC4kbmFtZV0gPSB7fTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JlXVt0LiRuYW1lXTtcbiAgfVxuXG4gIHdyaXRlKHQsIHYpIHtcbiAgICBsZXQgaWQgPSB2W3QuJGlkXTtcbiAgICBpZiAoaWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgaWQgPSB0aGlzLm1heElkICsgMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBuZXcgY29udGVudCBpbiBhIG5vbi10ZXJtaW5hbCBzdG9yZScpO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgdXBkYXRlT2JqZWN0ID0gdGhpcy4kJGVuc3VyZSh0KVtpZF07XG4gICAgaWYgKHVwZGF0ZU9iamVjdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm1heElkID0gaWQ7XG4gICAgICB1cGRhdGVPYmplY3QgPSB7XG4gICAgICAgIFt0LiRpZF06IGlkLFxuICAgICAgfTtcbiAgICAgIHRoaXMuJCRlbnN1cmUodClbaWRdID0gdXBkYXRlT2JqZWN0O1xuICAgIH1cbiAgICBPYmplY3Qua2V5cyh0LiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgaWYgKHZbZmllbGROYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGNvcHkgZnJvbSB2IHRvIHRoZSBiZXN0IG9mIG91ciBhYmlsaXR5XG4gICAgICAgIGlmIChcbiAgICAgICAgICAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2FycmF5JykgfHxcbiAgICAgICAgICAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2hhc01hbnknKVxuICAgICAgICApIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IHZbZmllbGROYW1lXS5jb25jYXQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0LiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgdltmaWVsZE5hbWVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IHZbZmllbGROYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoT2JqZWN0LmFzc2lnbih7fSwgdXBkYXRlT2JqZWN0KSk7XG4gIH1cblxuICBkZWxldGUodCwgaWQpIHtcbiAgICBjb25zdCByZXRWYWwgPSB0aGlzLiQkZW5zdXJlKHQpW2lkXTtcbiAgICBkZWxldGUgdGhpcy4kJGVuc3VyZSh0KVtpZF07XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXRWYWwpO1xuICB9XG5cbiAgYWRkKHQsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQpIHtcbiAgICBsZXQgcmVsYXRpb25zaGlwQXJyYXkgPSB0aGlzLiQkZW5zdXJlKHQpW2Ake3JlbGF0aW9uc2hpcH06JHtpZH1gXTtcbiAgICBpZiAocmVsYXRpb25zaGlwQXJyYXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmVsYXRpb25zaGlwQXJyYXkgPSBbXTtcbiAgICAgIHRoaXMuJCRlbnN1cmUodClbYCR7cmVsYXRpb25zaGlwfToke2lkfWBdID0gcmVsYXRpb25zaGlwQXJyYXk7XG4gICAgfVxuICAgIGlmIChyZWxhdGlvbnNoaXBBcnJheS5pbmRleE9mKGNoaWxkSWQpIDwgMCkge1xuICAgICAgcmVsYXRpb25zaGlwQXJyYXkucHVzaChjaGlsZElkKTtcbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZWxhdGlvbnNoaXBBcnJheS5jb25jYXQoKSk7XG4gIH1cblxuICByZWFkKHQsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBpZiAocmVsYXRpb25zaGlwICYmICh0LiRmaWVsZHNbcmVsYXRpb25zaGlwXS50eXBlID09PSAnaGFzTWFueScpKSB7XG4gICAgICAgIHJldHVybiB7W3JlbGF0aW9uc2hpcF06ICh0aGlzLiQkZW5zdXJlKHQpW2Ake3JlbGF0aW9uc2hpcH06JHtpZH1gXSB8fCBbXSkuY29uY2F0KCl9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLiQkZW5zdXJlKHQpW2lkXSB8fCBudWxsKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHJlbW92ZSh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKSB7XG4gICAgY29uc3QgcmVsYXRpb25zaGlwQXJyYXkgPSB0aGlzLiQkZW5zdXJlKHQpW2Ake3JlbGF0aW9uc2hpcH06JHtpZH1gXTtcbiAgICBpZiAocmVsYXRpb25zaGlwQXJyYXkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgaWR4ID0gcmVsYXRpb25zaGlwQXJyYXkuaW5kZXhPZihjaGlsZElkKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICByZWxhdGlvbnNoaXBBcnJheS5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZWxhdGlvbnNoaXBBcnJheS5jb25jYXQoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYEl0ZW0gJHtjaGlsZElkfSBub3QgZm91bmQgaW4gJHtyZWxhdGlvbnNoaXB9IG9mICR7dC4kbmFtZX1gKSk7XG4gIH1cblxuICBxdWVyeSgpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdRdWVyeSBpbnRlcmZhY2Ugbm90IHN1cHBvcnRlZCBvbiBNZW1vcnlTdG9yYWdlJykpO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
