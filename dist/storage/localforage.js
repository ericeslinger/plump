'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LocalForageStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _localforage = require('localforage');

var localforage = _interopRequireWildcard(_localforage);

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _storage = require('./storage');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var LocalForageStorage = exports.LocalForageStorage = function (_Storage) {
  _inherits(LocalForageStorage, _Storage);

  function LocalForageStorage() {
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, LocalForageStorage);

    var _this = _possibleConstructorReturn(this, (LocalForageStorage.__proto__ || Object.getPrototypeOf(LocalForageStorage)).call(this));

    _this.isCache = true;
    localforage.config({
      name: opts.name || 'Trellis Storage',
      storeName: opts.storeName || 'localCache'
    });
    return _this;
  }

  _createClass(LocalForageStorage, [{
    key: 'create',
    value: function create(t, v) {
      if (v.id === undefined) {
        return Promise.reject('This service cannot allocate ID values');
      } else {
        return localforage.setItem(t.$name + ':' + v.id, v);
      }
    }

    // TODO: fix this whole file.

  }, {
    key: 'read',
    value: function read(t, id, relationship) {
      if (relationship) {
        var retVal = localforage.getItem[t.$name + ':' + relationship + ':' + id];
        if (retVal) {
          return Promise.resolve(retVal.concat());
        } else {
          return Promise.resolve(null);
        }
      } else {
        return localforage.getItem(t + ':' + id);
      }
    }
  }, {
    key: 'update',
    value: function update(t, id, v) {
      return this.create(t, v);
    }
  }, {
    key: 'delete',
    value: function _delete(t, id) {
      return localforage.removeItem(t + ':' + id);
    }
  }, {
    key: 'query',
    value: function query() {
      return Promise.reject('Query interface not supported on LocalForageStorage');
    }
  }]);

  return LocalForageStorage;
}(_storage.Storage);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvbG9jYWxmb3JhZ2UuanMiXSwibmFtZXMiOlsibG9jYWxmb3JhZ2UiLCJQcm9taXNlIiwiTG9jYWxGb3JhZ2VTdG9yYWdlIiwib3B0cyIsImlzQ2FjaGUiLCJjb25maWciLCJuYW1lIiwic3RvcmVOYW1lIiwidCIsInYiLCJpZCIsInVuZGVmaW5lZCIsInJlamVjdCIsInNldEl0ZW0iLCIkbmFtZSIsInJlbGF0aW9uc2hpcCIsInJldFZhbCIsImdldEl0ZW0iLCJyZXNvbHZlIiwiY29uY2F0IiwiY3JlYXRlIiwicmVtb3ZlSXRlbSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0lBQVlBLFc7O0FBQ1o7O0lBQVlDLE87O0FBQ1o7Ozs7Ozs7Ozs7SUFFYUMsa0IsV0FBQUEsa0I7OztBQUVYLGdDQUF1QjtBQUFBLFFBQVhDLElBQVcseURBQUosRUFBSTs7QUFBQTs7QUFBQTs7QUFFckIsVUFBS0MsT0FBTCxHQUFlLElBQWY7QUFDQUosZ0JBQVlLLE1BQVosQ0FBbUI7QUFDakJDLFlBQU1ILEtBQUtHLElBQUwsSUFBYSxpQkFERjtBQUVqQkMsaUJBQVdKLEtBQUtJLFNBQUwsSUFBa0I7QUFGWixLQUFuQjtBQUhxQjtBQU90Qjs7OzsyQkFFTUMsQyxFQUFHQyxDLEVBQUc7QUFDWCxVQUFJQSxFQUFFQyxFQUFGLEtBQVNDLFNBQWIsRUFBd0I7QUFDdEIsZUFBT1YsUUFBUVcsTUFBUixDQUFlLHdDQUFmLENBQVA7QUFDRCxPQUZELE1BRU87QUFDTCxlQUFPWixZQUFZYSxPQUFaLENBQXVCTCxFQUFFTSxLQUF6QixTQUFrQ0wsRUFBRUMsRUFBcEMsRUFBMENELENBQTFDLENBQVA7QUFDRDtBQUNGOztBQUVEOzs7O3lCQUVLRCxDLEVBQUdFLEUsRUFBSUssWSxFQUFjO0FBQ3hCLFVBQUlBLFlBQUosRUFBa0I7QUFDaEIsWUFBTUMsU0FBU2hCLFlBQVlpQixPQUFaLENBQXVCVCxFQUFFTSxLQUF6QixTQUFrQ0MsWUFBbEMsU0FBa0RMLEVBQWxELENBQWY7QUFDQSxZQUFJTSxNQUFKLEVBQVk7QUFDVixpQkFBT2YsUUFBUWlCLE9BQVIsQ0FBZ0JGLE9BQU9HLE1BQVAsRUFBaEIsQ0FBUDtBQUNELFNBRkQsTUFFTztBQUNMLGlCQUFPbEIsUUFBUWlCLE9BQVIsQ0FBZ0IsSUFBaEIsQ0FBUDtBQUNEO0FBQ0YsT0FQRCxNQU9PO0FBQ0wsZUFBT2xCLFlBQVlpQixPQUFaLENBQXVCVCxDQUF2QixTQUE0QkUsRUFBNUIsQ0FBUDtBQUNEO0FBQ0Y7OzsyQkFFTUYsQyxFQUFHRSxFLEVBQUlELEMsRUFBRztBQUNmLGFBQU8sS0FBS1csTUFBTCxDQUFZWixDQUFaLEVBQWVDLENBQWYsQ0FBUDtBQUNEOzs7NEJBRU1ELEMsRUFBR0UsRSxFQUFJO0FBQ1osYUFBT1YsWUFBWXFCLFVBQVosQ0FBMEJiLENBQTFCLFNBQStCRSxFQUEvQixDQUFQO0FBQ0Q7Ozs0QkFFTztBQUNOLGFBQU9ULFFBQVFXLE1BQVIsQ0FBZSxxREFBZixDQUFQO0FBQ0QiLCJmaWxlIjoic3RvcmFnZS9sb2NhbGZvcmFnZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGxvY2FsZm9yYWdlIGZyb20gJ2xvY2FsZm9yYWdlJztcbmltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHtTdG9yYWdlfSBmcm9tICcuL3N0b3JhZ2UnO1xuXG5leHBvcnQgY2xhc3MgTG9jYWxGb3JhZ2VTdG9yYWdlIGV4dGVuZHMgU3RvcmFnZSB7XG5cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmlzQ2FjaGUgPSB0cnVlO1xuICAgIGxvY2FsZm9yYWdlLmNvbmZpZyh7XG4gICAgICBuYW1lOiBvcHRzLm5hbWUgfHwgJ1RyZWxsaXMgU3RvcmFnZScsXG4gICAgICBzdG9yZU5hbWU6IG9wdHMuc3RvcmVOYW1lIHx8ICdsb2NhbENhY2hlJyxcbiAgICB9KTtcbiAgfVxuXG4gIGNyZWF0ZSh0LCB2KSB7XG4gICAgaWYgKHYuaWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCdUaGlzIHNlcnZpY2UgY2Fubm90IGFsbG9jYXRlIElEIHZhbHVlcycpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbG9jYWxmb3JhZ2Uuc2V0SXRlbShgJHt0LiRuYW1lfToke3YuaWR9YCwgdik7XG4gICAgfVxuICB9XG5cbiAgLy8gVE9ETzogZml4IHRoaXMgd2hvbGUgZmlsZS5cblxuICByZWFkKHQsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgICBpZiAocmVsYXRpb25zaGlwKSB7XG4gICAgICBjb25zdCByZXRWYWwgPSBsb2NhbGZvcmFnZS5nZXRJdGVtW2Ake3QuJG5hbWV9OiR7cmVsYXRpb25zaGlwfToke2lkfWBdO1xuICAgICAgaWYgKHJldFZhbCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJldFZhbC5jb25jYXQoKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbG9jYWxmb3JhZ2UuZ2V0SXRlbShgJHt0fToke2lkfWApO1xuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZSh0LCBpZCwgdikge1xuICAgIHJldHVybiB0aGlzLmNyZWF0ZSh0LCB2KTtcbiAgfVxuXG4gIGRlbGV0ZSh0LCBpZCkge1xuICAgIHJldHVybiBsb2NhbGZvcmFnZS5yZW1vdmVJdGVtKGAke3R9OiR7aWR9YCk7XG4gIH1cblxuICBxdWVyeSgpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ1F1ZXJ5IGludGVyZmFjZSBub3Qgc3VwcG9ydGVkIG9uIExvY2FsRm9yYWdlU3RvcmFnZScpO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
