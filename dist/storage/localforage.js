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
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

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
        return localforage.setItem(t + ':' + v.id, v);
      }
    }
  }, {
    key: 'read',
    value: function read(t, id) {
      return localforage.getItem(t + ':' + id);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvbG9jYWxmb3JhZ2UuanMiXSwibmFtZXMiOlsibG9jYWxmb3JhZ2UiLCJQcm9taXNlIiwiTG9jYWxGb3JhZ2VTdG9yYWdlIiwib3B0cyIsImlzQ2FjaGUiLCJjb25maWciLCJuYW1lIiwic3RvcmVOYW1lIiwidCIsInYiLCJpZCIsInVuZGVmaW5lZCIsInJlamVjdCIsInNldEl0ZW0iLCJnZXRJdGVtIiwiY3JlYXRlIiwicmVtb3ZlSXRlbSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0lBQVlBLFc7O0FBQ1o7O0lBQVlDLE87O0FBQ1o7Ozs7Ozs7Ozs7SUFFYUMsa0IsV0FBQUEsa0I7OztBQUVYLGdDQUF1QjtBQUFBLFFBQVhDLElBQVcsdUVBQUosRUFBSTs7QUFBQTs7QUFBQTs7QUFFckIsVUFBS0MsT0FBTCxHQUFlLElBQWY7QUFDQUosZ0JBQVlLLE1BQVosQ0FBbUI7QUFDakJDLFlBQU1ILEtBQUtHLElBQUwsSUFBYSxpQkFERjtBQUVqQkMsaUJBQVdKLEtBQUtJLFNBQUwsSUFBa0I7QUFGWixLQUFuQjtBQUhxQjtBQU90Qjs7OzsyQkFFTUMsQyxFQUFHQyxDLEVBQUc7QUFDWCxVQUFJQSxFQUFFQyxFQUFGLEtBQVNDLFNBQWIsRUFBd0I7QUFDdEIsZUFBT1YsUUFBUVcsTUFBUixDQUFlLHdDQUFmLENBQVA7QUFDRCxPQUZELE1BRU87QUFDTCxlQUFPWixZQUFZYSxPQUFaLENBQXVCTCxDQUF2QixTQUE0QkMsRUFBRUMsRUFBOUIsRUFBb0NELENBQXBDLENBQVA7QUFDRDtBQUNGOzs7eUJBRUlELEMsRUFBR0UsRSxFQUFJO0FBQ1YsYUFBT1YsWUFBWWMsT0FBWixDQUF1Qk4sQ0FBdkIsU0FBNEJFLEVBQTVCLENBQVA7QUFDRDs7OzJCQUVNRixDLEVBQUdFLEUsRUFBSUQsQyxFQUFHO0FBQ2YsYUFBTyxLQUFLTSxNQUFMLENBQVlQLENBQVosRUFBZUMsQ0FBZixDQUFQO0FBQ0Q7Ozs0QkFFTUQsQyxFQUFHRSxFLEVBQUk7QUFDWixhQUFPVixZQUFZZ0IsVUFBWixDQUEwQlIsQ0FBMUIsU0FBK0JFLEVBQS9CLENBQVA7QUFDRDs7OzRCQUVPO0FBQ04sYUFBT1QsUUFBUVcsTUFBUixDQUFlLHFEQUFmLENBQVA7QUFDRCIsImZpbGUiOiJzdG9yYWdlL2xvY2FsZm9yYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgbG9jYWxmb3JhZ2UgZnJvbSAnbG9jYWxmb3JhZ2UnO1xuaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQge1N0b3JhZ2V9IGZyb20gJy4vc3RvcmFnZSc7XG5cbmV4cG9ydCBjbGFzcyBMb2NhbEZvcmFnZVN0b3JhZ2UgZXh0ZW5kcyBTdG9yYWdlIHtcblxuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuaXNDYWNoZSA9IHRydWU7XG4gICAgbG9jYWxmb3JhZ2UuY29uZmlnKHtcbiAgICAgIG5hbWU6IG9wdHMubmFtZSB8fCAnVHJlbGxpcyBTdG9yYWdlJyxcbiAgICAgIHN0b3JlTmFtZTogb3B0cy5zdG9yZU5hbWUgfHwgJ2xvY2FsQ2FjaGUnLFxuICAgIH0pO1xuICB9XG5cbiAgY3JlYXRlKHQsIHYpIHtcbiAgICBpZiAodi5pZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ1RoaXMgc2VydmljZSBjYW5ub3QgYWxsb2NhdGUgSUQgdmFsdWVzJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBsb2NhbGZvcmFnZS5zZXRJdGVtKGAke3R9OiR7di5pZH1gLCB2KTtcbiAgICB9XG4gIH1cblxuICByZWFkKHQsIGlkKSB7XG4gICAgcmV0dXJuIGxvY2FsZm9yYWdlLmdldEl0ZW0oYCR7dH06JHtpZH1gKTtcbiAgfVxuXG4gIHVwZGF0ZSh0LCBpZCwgdikge1xuICAgIHJldHVybiB0aGlzLmNyZWF0ZSh0LCB2KTtcbiAgfVxuXG4gIGRlbGV0ZSh0LCBpZCkge1xuICAgIHJldHVybiBsb2NhbGZvcmFnZS5yZW1vdmVJdGVtKGAke3R9OiR7aWR9YCk7XG4gIH1cblxuICBxdWVyeSgpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ1F1ZXJ5IGludGVyZmFjZSBub3Qgc3VwcG9ydGVkIG9uIExvY2FsRm9yYWdlU3RvcmFnZScpO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
