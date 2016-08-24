'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RestStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _axios = require('axios');

var axios = _interopRequireWildcard(_axios);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RestStorage = exports.RestStorage = function () {
  function RestStorage() {
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, RestStorage);

    var options = Object.assign({}, {
      baseURL: 'http://localhost/api'
    }, opts);
    this._axios = axios.create(options);
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
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvcmVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7SUFBWSxLOzs7Ozs7SUFFQyxXLFdBQUEsVztBQUVYLHlCQUF1QjtBQUFBLFFBQVgsSUFBVyx5REFBSixFQUFJOztBQUFBOztBQUNyQixRQUFNLFVBQVUsT0FBTyxNQUFQLENBQ2QsRUFEYyxFQUVkO0FBQ0UsZUFBUztBQURYLEtBRmMsRUFLZCxJQUxjLENBQWhCO0FBT0EsU0FBSyxNQUFMLEdBQWMsTUFBTSxNQUFOLENBQWEsT0FBYixDQUFkO0FBQ0Q7Ozs7MkJBRU0sQyxFQUFHLEMsRUFBRztBQUNYLGFBQU8sS0FBSyxNQUFMLENBQVksSUFBWixPQUFxQixDQUFyQixFQUEwQixDQUExQixDQUFQO0FBQ0Q7Ozt5QkFFSSxDLEVBQUcsRSxFQUFJO0FBQ1YsYUFBTyxLQUFLLE1BQUwsQ0FBWSxHQUFaLE9BQW9CLENBQXBCLFNBQXlCLEVBQXpCLEVBQ04sSUFETSxDQUNELFVBQUMsUUFBRCxFQUFjO0FBQ2xCLGVBQU8sU0FBUyxJQUFoQjtBQUNELE9BSE0sQ0FBUDtBQUlEOzs7MkJBRU0sQyxFQUFHLEUsRUFBSSxDLEVBQUc7QUFDZixhQUFPLEtBQUssTUFBTCxDQUFZLEdBQVosT0FBb0IsQ0FBcEIsU0FBeUIsRUFBekIsRUFBK0IsQ0FBL0IsRUFDTixJQURNLENBQ0QsVUFBQyxRQUFELEVBQWM7QUFDbEIsZUFBTyxTQUFTLElBQWhCO0FBQ0QsT0FITSxDQUFQO0FBSUQ7Ozs0QkFFTSxDLEVBQUcsRSxFQUFJO0FBQ1osYUFBTyxLQUFLLE1BQUwsQ0FBWSxNQUFaLE9BQXVCLENBQXZCLFNBQTRCLEVBQTVCLEVBQ04sSUFETSxDQUNELFVBQUMsUUFBRCxFQUFjO0FBQ2xCLGVBQU8sU0FBUyxJQUFoQjtBQUNELE9BSE0sQ0FBUDtBQUlEOzs7MEJBRUssQyxFQUFHO0FBQ1AsYUFBTyxLQUFLLE1BQUwsQ0FBWSxHQUFaLE9BQW9CLEVBQUUsSUFBdEIsRUFBOEIsRUFBQyxRQUFRLEVBQUUsS0FBWCxFQUE5QixFQUNOLElBRE0sQ0FDRCxVQUFDLFFBQUQsRUFBYztBQUNsQixlQUFPLFNBQVMsSUFBaEI7QUFDRCxPQUhNLENBQVA7QUFJRCIsImZpbGUiOiJzdG9yYWdlL3Jlc3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBheGlvcyBmcm9tICdheGlvcyc7XG5cbmV4cG9ydCBjbGFzcyBSZXN0U3RvcmFnZSB7XG5cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHtcbiAgICAgICAgYmFzZVVSTDogJ2h0dHA6Ly9sb2NhbGhvc3QvYXBpJyxcbiAgICAgIH0sXG4gICAgICBvcHRzXG4gICAgKTtcbiAgICB0aGlzLl9heGlvcyA9IGF4aW9zLmNyZWF0ZShvcHRpb25zKTtcbiAgfVxuXG4gIGNyZWF0ZSh0LCB2KSB7XG4gICAgcmV0dXJuIHRoaXMuX2F4aW9zLnBvc3QoYC8ke3R9YCwgdik7XG4gIH1cblxuICByZWFkKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXMuX2F4aW9zLmdldChgLyR7dH0vJHtpZH1gKVxuICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgfSk7XG4gIH1cblxuICB1cGRhdGUodCwgaWQsIHYpIHtcbiAgICByZXR1cm4gdGhpcy5fYXhpb3MucHV0KGAvJHt0fS8ke2lkfWAsIHYpXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICB9KTtcbiAgfVxuXG4gIGRlbGV0ZSh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzLl9heGlvcy5kZWxldGUoYC8ke3R9LyR7aWR9YClcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgIH0pO1xuICB9XG5cbiAgcXVlcnkocSkge1xuICAgIHJldHVybiB0aGlzLl9heGlvcy5nZXQoYC8ke3EudHlwZX1gLCB7cGFyYW1zOiBxLnF1ZXJ5fSlcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgIH0pO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
