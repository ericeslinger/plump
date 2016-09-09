'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RestStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _axios = require('axios');

var axios = _interopRequireWildcard(_axios);

var _storage = require('./storage');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var RestStorage = exports.RestStorage = function (_Storage) {
  _inherits(RestStorage, _Storage);

  function RestStorage() {
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, RestStorage);

    var _this = _possibleConstructorReturn(this, (RestStorage.__proto__ || Object.getPrototypeOf(RestStorage)).call(this));

    var options = Object.assign({}, {
      baseURL: 'http://localhost/api'
    }, opts);
    _this._axios = axios.create(options);
    return _this;
  }

  _createClass(RestStorage, [{
    key: 'create',
    value: function create(t, v) {
      return this._axios.post('/' + t, v);
    }
  }, {
    key: 'read',
    value: function read(t, id) {
      return this._axios.get('/' + t + '/' + id).then(function (response) {
        return response.data;
      });
    }
  }, {
    key: 'update',
    value: function update(t, id, v) {
      return this._axios.put('/' + t + '/' + id, v).then(function (response) {
        return response.data;
      });
    }
  }, {
    key: 'delete',
    value: function _delete(t, id) {
      return this._axios.delete('/' + t + '/' + id).then(function (response) {
        return response.data;
      });
    }
  }, {
    key: 'query',
    value: function query(q) {
      return this._axios.get('/' + q.type, { params: q.query }).then(function (response) {
        return response.data;
      });
    }
  }]);

  return RestStorage;
}(_storage.Storage);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvcmVzdC5qcyJdLCJuYW1lcyI6WyJheGlvcyIsIlJlc3RTdG9yYWdlIiwib3B0cyIsIm9wdGlvbnMiLCJPYmplY3QiLCJhc3NpZ24iLCJiYXNlVVJMIiwiX2F4aW9zIiwiY3JlYXRlIiwidCIsInYiLCJwb3N0IiwiaWQiLCJnZXQiLCJ0aGVuIiwicmVzcG9uc2UiLCJkYXRhIiwicHV0IiwiZGVsZXRlIiwicSIsInR5cGUiLCJwYXJhbXMiLCJxdWVyeSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0lBQVlBLEs7O0FBQ1o7Ozs7Ozs7Ozs7SUFFYUMsVyxXQUFBQSxXOzs7QUFFWCx5QkFBdUI7QUFBQSxRQUFYQyxJQUFXLHlEQUFKLEVBQUk7O0FBQUE7O0FBQUE7O0FBRXJCLFFBQU1DLFVBQVVDLE9BQU9DLE1BQVAsQ0FDZCxFQURjLEVBRWQ7QUFDRUMsZUFBUztBQURYLEtBRmMsRUFLZEosSUFMYyxDQUFoQjtBQU9BLFVBQUtLLE1BQUwsR0FBY1AsTUFBTVEsTUFBTixDQUFhTCxPQUFiLENBQWQ7QUFUcUI7QUFVdEI7Ozs7MkJBRU1NLEMsRUFBR0MsQyxFQUFHO0FBQ1gsYUFBTyxLQUFLSCxNQUFMLENBQVlJLElBQVosT0FBcUJGLENBQXJCLEVBQTBCQyxDQUExQixDQUFQO0FBQ0Q7Ozt5QkFFSUQsQyxFQUFHRyxFLEVBQUk7QUFDVixhQUFPLEtBQUtMLE1BQUwsQ0FBWU0sR0FBWixPQUFvQkosQ0FBcEIsU0FBeUJHLEVBQXpCLEVBQ05FLElBRE0sQ0FDRCxVQUFDQyxRQUFELEVBQWM7QUFDbEIsZUFBT0EsU0FBU0MsSUFBaEI7QUFDRCxPQUhNLENBQVA7QUFJRDs7OzJCQUVNUCxDLEVBQUdHLEUsRUFBSUYsQyxFQUFHO0FBQ2YsYUFBTyxLQUFLSCxNQUFMLENBQVlVLEdBQVosT0FBb0JSLENBQXBCLFNBQXlCRyxFQUF6QixFQUErQkYsQ0FBL0IsRUFDTkksSUFETSxDQUNELFVBQUNDLFFBQUQsRUFBYztBQUNsQixlQUFPQSxTQUFTQyxJQUFoQjtBQUNELE9BSE0sQ0FBUDtBQUlEOzs7NEJBRU1QLEMsRUFBR0csRSxFQUFJO0FBQ1osYUFBTyxLQUFLTCxNQUFMLENBQVlXLE1BQVosT0FBdUJULENBQXZCLFNBQTRCRyxFQUE1QixFQUNORSxJQURNLENBQ0QsVUFBQ0MsUUFBRCxFQUFjO0FBQ2xCLGVBQU9BLFNBQVNDLElBQWhCO0FBQ0QsT0FITSxDQUFQO0FBSUQ7OzswQkFFS0csQyxFQUFHO0FBQ1AsYUFBTyxLQUFLWixNQUFMLENBQVlNLEdBQVosT0FBb0JNLEVBQUVDLElBQXRCLEVBQThCLEVBQUNDLFFBQVFGLEVBQUVHLEtBQVgsRUFBOUIsRUFDTlIsSUFETSxDQUNELFVBQUNDLFFBQUQsRUFBYztBQUNsQixlQUFPQSxTQUFTQyxJQUFoQjtBQUNELE9BSE0sQ0FBUDtBQUlEIiwiZmlsZSI6InN0b3JhZ2UvcmVzdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF4aW9zIGZyb20gJ2F4aW9zJztcbmltcG9ydCB7U3RvcmFnZX0gZnJvbSAnLi9zdG9yYWdlJztcblxuZXhwb3J0IGNsYXNzIFJlc3RTdG9yYWdlIGV4dGVuZHMgU3RvcmFnZSB7XG5cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgc3VwZXIoKTtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAge1xuICAgICAgICBiYXNlVVJMOiAnaHR0cDovL2xvY2FsaG9zdC9hcGknLFxuICAgICAgfSxcbiAgICAgIG9wdHNcbiAgICApO1xuICAgIHRoaXMuX2F4aW9zID0gYXhpb3MuY3JlYXRlKG9wdGlvbnMpO1xuICB9XG5cbiAgY3JlYXRlKHQsIHYpIHtcbiAgICByZXR1cm4gdGhpcy5fYXhpb3MucG9zdChgLyR7dH1gLCB2KTtcbiAgfVxuXG4gIHJlYWQodCwgaWQpIHtcbiAgICByZXR1cm4gdGhpcy5fYXhpb3MuZ2V0KGAvJHt0fS8ke2lkfWApXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICB9KTtcbiAgfVxuXG4gIHVwZGF0ZSh0LCBpZCwgdikge1xuICAgIHJldHVybiB0aGlzLl9heGlvcy5wdXQoYC8ke3R9LyR7aWR9YCwgdilcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgIH0pO1xuICB9XG5cbiAgZGVsZXRlKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXMuX2F4aW9zLmRlbGV0ZShgLyR7dH0vJHtpZH1gKVxuICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgfSk7XG4gIH1cblxuICBxdWVyeShxKSB7XG4gICAgcmV0dXJuIHRoaXMuX2F4aW9zLmdldChgLyR7cS50eXBlfWAsIHtwYXJhbXM6IHEucXVlcnl9KVxuICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgfSk7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
