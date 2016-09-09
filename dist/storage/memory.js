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
    key: 'read',
    value: function read(t, id) {
      return Promise.resolve(this.$$ensure(t)[id] || null);
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
    key: 'has',
    value: function has(t, id, relationship) {
      return Promise.resolve((this.$$ensure(t)[relationship + ':' + id] || []).concat());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvbWVtb3J5LmpzIl0sIm5hbWVzIjpbIlByb21pc2UiLCIkc3RvcmUiLCJTeW1ib2wiLCJNZW1vcnlTdG9yYWdlIiwiYXJncyIsIm1heElkIiwidCIsIiRuYW1lIiwidW5kZWZpbmVkIiwiaWQiLCJyZXNvbHZlIiwiJCRlbnN1cmUiLCJ2IiwiJGlkIiwidGVybWluYWwiLCJFcnJvciIsInVwZGF0ZU9iamVjdCIsIk9iamVjdCIsImtleXMiLCIkZmllbGRzIiwiZm9yRWFjaCIsImZpZWxkTmFtZSIsInR5cGUiLCJjb25jYXQiLCJhc3NpZ24iLCJyZXRWYWwiLCJyZWxhdGlvbnNoaXAiLCJjaGlsZElkIiwicmVsYXRpb25zaGlwQXJyYXkiLCJpbmRleE9mIiwicHVzaCIsImlkeCIsInNwbGljZSIsInJlamVjdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0lBQVlBLE87O0FBQ1o7Ozs7Ozs7Ozs7OztBQUVBLElBQU1DLFNBQVNDLE9BQU8sUUFBUCxDQUFmOztJQUVhQyxhLFdBQUFBLGE7OztBQUVYLDJCQUFxQjtBQUFBOztBQUFBOztBQUFBLHNDQUFOQyxJQUFNO0FBQU5BLFVBQU07QUFBQTs7QUFBQSx5SkFDVkEsSUFEVTs7QUFFbkIsVUFBS0gsTUFBTCxJQUFlLEVBQWY7QUFDQSxVQUFLSSxLQUFMLEdBQWEsQ0FBYjtBQUhtQjtBQUlwQjs7Ozs2QkFFUUMsQyxFQUFHO0FBQ1YsVUFBSSxLQUFLTCxNQUFMLEVBQWFLLEVBQUVDLEtBQWYsTUFBMEJDLFNBQTlCLEVBQXlDO0FBQ3ZDLGFBQUtQLE1BQUwsRUFBYUssRUFBRUMsS0FBZixJQUF3QixFQUF4QjtBQUNEO0FBQ0QsYUFBTyxLQUFLTixNQUFMLEVBQWFLLEVBQUVDLEtBQWYsQ0FBUDtBQUNEOzs7eUJBRUlELEMsRUFBR0csRSxFQUFJO0FBQ1YsYUFBT1QsUUFBUVUsT0FBUixDQUFnQixLQUFLQyxRQUFMLENBQWNMLENBQWQsRUFBaUJHLEVBQWpCLEtBQXdCLElBQXhDLENBQVA7QUFD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RUFBUztBQUNuQyxVQUFNQyxvQkFBb0IsS0FBS2pCLFFBQUwsQ0FBY0wsQ0FBZCxFQUFvQm9CLFlBQXBCLFNBQW9DakIsRUFBcEMsQ0FBMUI7QUFDQSxVQUFJbUIsc0JBQXNCcEIsU0FBMUIsRUFBcUM7QUFDbkMsWUFBTXVCLE1BQU1ILGtCQUFrQkMsT0FBbEIsQ0FBMEJGLE9BQTFCLENBQVo7QUFDQSxZQUFJSSxPQUFPLENBQVgsRUFBYztBQUNaSCw0QkFBa0JJLE1BQWxCLENBQXlCRCxHQUF6QixFQUE4QixDQUE5QjtBQUNBLGlCQUFPL0IsUUFBUVUsT0FBUixDQUFnQmtCLGtCQUFrQkwsTUFBbEIsRUFBaEIsQ0FBUDtBQUNEO0FBQ0Y7QUFDRCxhQUFPdkIsUUFBUWlDLE1BQVIsQ0FBZSxJQUFJbEIsS0FBSixXQUFrQlksT0FBbEIsc0JBQTBDRCxZQUExQyxZQUE2RHBCLEVBQUVDLEtBQS9ELENBQWYsQ0FBUDtBQUNEOzs7NEJBRU87QUFDTixhQUFPUCxRQUFRaUMsTUFBUixDQUFlLElBQUlsQixLQUFKLENBQVUsZ0RBQVYsQ0FBZixDQUFQO0FBQ0QiLCJmaWxlIjoic3RvcmFnZS9tZW1vcnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7U3RvcmFnZX0gZnJvbSAnLi9zdG9yYWdlJztcblxuY29uc3QgJHN0b3JlID0gU3ltYm9sKCckc3RvcmUnKTtcblxuZXhwb3J0IGNsYXNzIE1lbW9yeVN0b3JhZ2UgZXh0ZW5kcyBTdG9yYWdlIHtcblxuICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgc3VwZXIoLi4uYXJncyk7XG4gICAgdGhpc1skc3RvcmVdID0ge307XG4gICAgdGhpcy5tYXhJZCA9IDA7XG4gIH1cblxuICAkJGVuc3VyZSh0KSB7XG4gICAgaWYgKHRoaXNbJHN0b3JlXVt0LiRuYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyRzdG9yZV1bdC4kbmFtZV0gPSB7fTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JlXVt0LiRuYW1lXTtcbiAgfVxuXG4gIHJlYWQodCwgaWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuJCRlbnN1cmUodClbaWRdIHx8IG51bGwpO1xuICB9XG5cbiAgd3JpdGUodCwgdikge1xuICAgIGxldCBpZCA9IHZbdC4kaWRdO1xuICAgIGlmIChpZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodGhpcy50ZXJtaW5hbCkge1xuICAgICAgICBpZCA9IHRoaXMubWF4SWQgKyAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIG5ldyBjb250ZW50IGluIGEgbm9uLXRlcm1pbmFsIHN0b3JlJyk7XG4gICAgICB9XG4gICAgfVxuICAgIGxldCB1cGRhdGVPYmplY3QgPSB0aGlzLiQkZW5zdXJlKHQpW2lkXTtcbiAgICBpZiAodXBkYXRlT2JqZWN0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMubWF4SWQgPSBpZDtcbiAgICAgIHVwZGF0ZU9iamVjdCA9IHtcbiAgICAgICAgW3QuJGlkXTogaWQsXG4gICAgICB9O1xuICAgICAgdGhpcy4kJGVuc3VyZSh0KVtpZF0gPSB1cGRhdGVPYmplY3Q7XG4gICAgfVxuICAgIE9iamVjdC5rZXlzKHQuJGZpZWxkcykuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICBpZiAodltmaWVsZE5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gY29weSBmcm9tIHYgdG8gdGhlIGJlc3Qgb2Ygb3VyIGFiaWxpdHlcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0LiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnYXJyYXknKSB8fFxuICAgICAgICAgICh0LiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnaGFzTWFueScpXG4gICAgICAgICkge1xuICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gdltmaWVsZE5hbWVdLmNvbmNhdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSBPYmplY3QuYXNzaWduKHt9LCB2W2ZpZWxkTmFtZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gdltmaWVsZE5hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShPYmplY3QuYXNzaWduKHt9LCB1cGRhdGVPYmplY3QpKTtcbiAgfVxuXG4gIGRlbGV0ZSh0LCBpZCkge1xuICAgIGNvbnN0IHJldFZhbCA9IHRoaXMuJCRlbnN1cmUodClbaWRdO1xuICAgIGRlbGV0ZSB0aGlzLiQkZW5zdXJlKHQpW2lkXTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJldFZhbCk7XG4gIH1cblxuICBhZGQodCwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCkge1xuICAgIGxldCByZWxhdGlvbnNoaXBBcnJheSA9IHRoaXMuJCRlbnN1cmUodClbYCR7cmVsYXRpb25zaGlwfToke2lkfWBdO1xuICAgIGlmIChyZWxhdGlvbnNoaXBBcnJheSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZWxhdGlvbnNoaXBBcnJheSA9IFtdO1xuICAgICAgdGhpcy4kJGVuc3VyZSh0KVtgJHtyZWxhdGlvbnNoaXB9OiR7aWR9YF0gPSByZWxhdGlvbnNoaXBBcnJheTtcbiAgICB9XG4gICAgaWYgKHJlbGF0aW9uc2hpcEFycmF5LmluZGV4T2YoY2hpbGRJZCkgPCAwKSB7XG4gICAgICByZWxhdGlvbnNoaXBBcnJheS5wdXNoKGNoaWxkSWQpO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlbGF0aW9uc2hpcEFycmF5LmNvbmNhdCgpKTtcbiAgfVxuXG4gIGhhcyh0LCBpZCwgcmVsYXRpb25zaGlwKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgodGhpcy4kJGVuc3VyZSh0KVtgJHtyZWxhdGlvbnNoaXB9OiR7aWR9YF0gfHwgW10pLmNvbmNhdCgpKTtcbiAgfVxuXG4gIHJlbW92ZSh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKSB7XG4gICAgY29uc3QgcmVsYXRpb25zaGlwQXJyYXkgPSB0aGlzLiQkZW5zdXJlKHQpW2Ake3JlbGF0aW9uc2hpcH06JHtpZH1gXTtcbiAgICBpZiAocmVsYXRpb25zaGlwQXJyYXkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgaWR4ID0gcmVsYXRpb25zaGlwQXJyYXkuaW5kZXhPZihjaGlsZElkKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICByZWxhdGlvbnNoaXBBcnJheS5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZWxhdGlvbnNoaXBBcnJheS5jb25jYXQoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYEl0ZW0gJHtjaGlsZElkfSBub3QgZm91bmQgaW4gJHtyZWxhdGlvbnNoaXB9IG9mICR7dC4kbmFtZX1gKSk7XG4gIH1cblxuICBxdWVyeSgpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdRdWVyeSBpbnRlcmZhY2Ugbm90IHN1cHBvcnRlZCBvbiBNZW1vcnlTdG9yYWdlJykpO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
