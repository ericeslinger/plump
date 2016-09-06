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

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(RestStorage).call(this));

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvcmVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7SUFBWSxLOztBQUNaOzs7Ozs7Ozs7O0lBRWEsVyxXQUFBLFc7OztBQUVYLHlCQUF1QjtBQUFBLFFBQVgsSUFBVyx5REFBSixFQUFJOztBQUFBOztBQUFBOztBQUVyQixRQUFNLFVBQVUsT0FBTyxNQUFQLENBQ2QsRUFEYyxFQUVkO0FBQ0UsZUFBUztBQURYLEtBRmMsRUFLZCxJQUxjLENBQWhCO0FBT0EsVUFBSyxNQUFMLEdBQWMsTUFBTSxNQUFOLENBQWEsT0FBYixDQUFkO0FBVHFCO0FBVXRCOzs7OzJCQUVNLEMsRUFBRyxDLEVBQUc7QUFDWCxhQUFPLEtBQUssTUFBTCxDQUFZLElBQVosT0FBcUIsQ0FBckIsRUFBMEIsQ0FBMUIsQ0FBUDtBQUNEOzs7eUJBRUksQyxFQUFHLEUsRUFBSTtBQUNWLGFBQU8sS0FBSyxNQUFMLENBQVksR0FBWixPQUFvQixDQUFwQixTQUF5QixFQUF6QixFQUNOLElBRE0sQ0FDRCxVQUFDLFFBQUQsRUFBYztBQUNsQixlQUFPLFNBQVMsSUFBaEI7QUFDRCxPQUhNLENBQVA7QUFJRDs7OzJCQUVNLEMsRUFBRyxFLEVBQUksQyxFQUFHO0FBQ2YsYUFBTyxLQUFLLE1BQUwsQ0FBWSxHQUFaLE9BQW9CLENBQXBCLFNBQXlCLEVBQXpCLEVBQStCLENBQS9CLEVBQ04sSUFETSxDQUNELFVBQUMsUUFBRCxFQUFjO0FBQ2xCLGVBQU8sU0FBUyxJQUFoQjtBQUNELE9BSE0sQ0FBUDtBQUlEOzs7NEJBRU0sQyxFQUFHLEUsRUFBSTtBQUNaLGFBQU8sS0FBSyxNQUFMLENBQVksTUFBWixPQUF1QixDQUF2QixTQUE0QixFQUE1QixFQUNOLElBRE0sQ0FDRCxVQUFDLFFBQUQsRUFBYztBQUNsQixlQUFPLFNBQVMsSUFBaEI7QUFDRCxPQUhNLENBQVA7QUFJRDs7OzBCQUVLLEMsRUFBRztBQUNQLGFBQU8sS0FBSyxNQUFMLENBQVksR0FBWixPQUFvQixFQUFFLElBQXRCLEVBQThCLEVBQUMsUUFBUSxFQUFFLEtBQVgsRUFBOUIsRUFDTixJQURNLENBQ0QsVUFBQyxRQUFELEVBQWM7QUFDbEIsZUFBTyxTQUFTLElBQWhCO0FBQ0QsT0FITSxDQUFQO0FBSUQiLCJmaWxlIjoic3RvcmFnZS9yZXN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXhpb3MgZnJvbSAnYXhpb3MnO1xuaW1wb3J0IHtTdG9yYWdlfSBmcm9tICcuL3N0b3JhZ2UnO1xuXG5leHBvcnQgY2xhc3MgUmVzdFN0b3JhZ2UgZXh0ZW5kcyBTdG9yYWdlIHtcblxuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBzdXBlcigpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIGJhc2VVUkw6ICdodHRwOi8vbG9jYWxob3N0L2FwaScsXG4gICAgICB9LFxuICAgICAgb3B0c1xuICAgICk7XG4gICAgdGhpcy5fYXhpb3MgPSBheGlvcy5jcmVhdGUob3B0aW9ucyk7XG4gIH1cblxuICBjcmVhdGUodCwgdikge1xuICAgIHJldHVybiB0aGlzLl9heGlvcy5wb3N0KGAvJHt0fWAsIHYpO1xuICB9XG5cbiAgcmVhZCh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzLl9heGlvcy5nZXQoYC8ke3R9LyR7aWR9YClcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgIH0pO1xuICB9XG5cbiAgdXBkYXRlKHQsIGlkLCB2KSB7XG4gICAgcmV0dXJuIHRoaXMuX2F4aW9zLnB1dChgLyR7dH0vJHtpZH1gLCB2KVxuICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgfSk7XG4gIH1cblxuICBkZWxldGUodCwgaWQpIHtcbiAgICByZXR1cm4gdGhpcy5fYXhpb3MuZGVsZXRlKGAvJHt0fS8ke2lkfWApXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICB9KTtcbiAgfVxuXG4gIHF1ZXJ5KHEpIHtcbiAgICByZXR1cm4gdGhpcy5fYXhpb3MuZ2V0KGAvJHtxLnR5cGV9YCwge3BhcmFtczogcS5xdWVyeX0pXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICB9KTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
