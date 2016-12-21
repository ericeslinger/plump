'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RestStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _axios = require('axios');

var axios = _interopRequireWildcard(_axios);

var _storage = require('./storage');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var $axios = Symbol('$axios');

var RestStorage = exports.RestStorage = function (_Storage) {
  _inherits(RestStorage, _Storage);

  function RestStorage() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, RestStorage);

    var _this = _possibleConstructorReturn(this, (RestStorage.__proto__ || Object.getPrototypeOf(RestStorage)).call(this, opts));

    var options = Object.assign({}, {
      baseURL: 'http://localhost/api'
    }, opts);
    _this[$axios] = options.axios || axios.create(options);
    return _this;
  }

  _createClass(RestStorage, [{
    key: 'onCacheableRead',
    value: function onCacheableRead() {}
  }, {
    key: 'rest',
    value: function rest(options) {
      return this[$axios](options);
    }
  }, {
    key: 'write',
    value: function write(t, v) {
      var _this2 = this;

      return _bluebird2.default.resolve().then(function () {
        if (v[t.$id]) {
          return _this2[$axios].patch('/' + t.$name + '/' + v[t.$id], v);
        } else if (_this2.terminal) {
          return _this2[$axios].post('/' + t.$name, v);
        } else {
          throw new Error('Cannot create new content in a non-terminal store');
        }
      }).then(function (d) {
        return d.data[t.$name][0];
      });
    }
  }, {
    key: 'readOne',
    value: function readOne(t, id) {
      var _this3 = this;

      return _bluebird2.default.resolve().then(function () {
        return _this3[$axios].get('/' + t.$name + '/' + id);
      }).then(function (response) {
        return response.data[t.$name][0];
      }).catch(function (err) {
        if (err.response && err.response.status === 404) {
          return null;
        } else {
          throw err;
        }
      });
    }
  }, {
    key: 'readMany',
    value: function readMany(t, id, relationship) {
      return this[$axios].get('/' + t.$name + '/' + id + '/' + relationship).then(function (response) {
        return response.data;
      }).catch(function (err) {
        if (err.response && err.response.status === 404) {
          return [];
        } else {
          throw err;
        }
      });
    }
  }, {
    key: 'add',
    value: function add(type, id, relationshipTitle, childId, extras) {
      var _newField;

      var relationshipBlock = type.$fields[relationshipTitle];
      var sideInfo = relationshipBlock.relationship.$sides[relationshipTitle];
      var newField = (_newField = {}, _defineProperty(_newField, sideInfo.self.field, id), _defineProperty(_newField, sideInfo.other.field, childId), _newField);
      if (relationshipBlock.relationship.$extras) {
        Object.keys(relationshipBlock.relationship.$extras).forEach(function (extra) {
          newField[extra] = extras[extra];
        });
      }
      return this[$axios].put('/' + type.$name + '/' + id + '/' + relationshipTitle, newField);
    }
  }, {
    key: 'remove',
    value: function remove(t, id, relationship, childId) {
      return this[$axios].delete('/' + t.$name + '/' + id + '/' + relationship + '/' + childId);
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(t, id, relationship, childId, extras) {
      return this[$axios].patch('/' + t.$name + '/' + id + '/' + relationship + '/' + childId, extras);
    }
  }, {
    key: 'delete',
    value: function _delete(t, id) {
      return this[$axios].delete('/' + t.$name + '/' + id).then(function (response) {
        return response.data;
      });
    }
  }, {
    key: 'query',
    value: function query(q) {
      return this[$axios].get('/' + q.type, { params: q.query }).then(function (response) {
        return response.data;
      });
    }
  }]);

  return RestStorage;
}(_storage.Storage);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvcmVzdC5qcyJdLCJuYW1lcyI6WyJheGlvcyIsIiRheGlvcyIsIlN5bWJvbCIsIlJlc3RTdG9yYWdlIiwib3B0cyIsIm9wdGlvbnMiLCJPYmplY3QiLCJhc3NpZ24iLCJiYXNlVVJMIiwiY3JlYXRlIiwidCIsInYiLCJyZXNvbHZlIiwidGhlbiIsIiRpZCIsInBhdGNoIiwiJG5hbWUiLCJ0ZXJtaW5hbCIsInBvc3QiLCJFcnJvciIsImQiLCJkYXRhIiwiaWQiLCJnZXQiLCJyZXNwb25zZSIsImNhdGNoIiwiZXJyIiwic3RhdHVzIiwicmVsYXRpb25zaGlwIiwidHlwZSIsInJlbGF0aW9uc2hpcFRpdGxlIiwiY2hpbGRJZCIsImV4dHJhcyIsInJlbGF0aW9uc2hpcEJsb2NrIiwiJGZpZWxkcyIsInNpZGVJbmZvIiwiJHNpZGVzIiwibmV3RmllbGQiLCJzZWxmIiwiZmllbGQiLCJvdGhlciIsIiRleHRyYXMiLCJrZXlzIiwiZm9yRWFjaCIsImV4dHJhIiwicHV0IiwiZGVsZXRlIiwicSIsInBhcmFtcyIsInF1ZXJ5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7SUFBWUEsSzs7QUFDWjs7QUFHQTs7Ozs7Ozs7Ozs7Ozs7OztBQURBLElBQU1DLFNBQVNDLE9BQU8sUUFBUCxDQUFmOztJQUdhQyxXLFdBQUFBLFc7OztBQUVYLHlCQUF1QjtBQUFBLFFBQVhDLElBQVcsdUVBQUosRUFBSTs7QUFBQTs7QUFBQSwwSEFDZkEsSUFEZTs7QUFFckIsUUFBTUMsVUFBVUMsT0FBT0MsTUFBUCxDQUNkLEVBRGMsRUFFZDtBQUNFQyxlQUFTO0FBRFgsS0FGYyxFQUtkSixJQUxjLENBQWhCO0FBT0EsVUFBS0gsTUFBTCxJQUFlSSxRQUFRTCxLQUFSLElBQWlCQSxNQUFNUyxNQUFOLENBQWFKLE9BQWIsQ0FBaEM7QUFUcUI7QUFVdEI7Ozs7c0NBRWlCLENBQUU7Ozt5QkFFZkEsTyxFQUFTO0FBQ1osYUFBTyxLQUFLSixNQUFMLEVBQWFJLE9BQWIsQ0FBUDtB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QXlDUSxpQkFBekMsRUFBOERPLFFBQTlELENBQVA7QUFDRDs7OzJCQUVNM0IsQyxFQUFHWSxFLEVBQUlNLFksRUFBY0csTyxFQUFTO0FBQ25DLGFBQU8sS0FBSzlCLE1BQUwsRUFBYTZDLE1BQWIsT0FBd0JwQyxFQUFFTSxLQUExQixTQUFtQ00sRUFBbkMsU0FBeUNNLFlBQXpDLFNBQXlERyxPQUF6RCxDQUFQO0FBQ0Q7Ozt1Q0FFa0JyQixDLEVBQUdZLEUsRUFBSU0sWSxFQUFjRyxPLEVBQVNDLE0sRUFBUTtBQUN2RCxhQUFPLEtBQUsvQixNQUFMLEVBQWFjLEtBQWIsT0FBdUJMLEVBQUVNLEtBQXpCLFNBQWtDTSxFQUFsQyxTQUF3Q00sWUFBeEMsU0FBd0RHLE9BQXhELEVBQW1FQyxNQUFuRSxDQUFQO0FBQ0Q7Ozs0QkFFTXRCLEMsRUFBR1ksRSxFQUFJO0FBQ1osYUFBTyxLQUFLckIsTUFBTCxFQUFhNkMsTUFBYixPQUF3QnBDLEVBQUVNLEtBQTFCLFNBQW1DTSxFQUFuQyxFQUNOVCxJQURNLENBQ0QsVUFBQ1csUUFBRCxFQUFjO0FBQ2xCLGVBQU9BLFNBQVNILElBQWhCO0FBQ0QsT0FITSxDQUFQO0FBSUQ7OzswQkFFSzBCLEMsRUFBRztBQUNQLGFBQU8sS0FBSzlDLE1BQUwsRUFBYXNCLEdBQWIsT0FBcUJ3QixFQUFFbEIsSUFBdkIsRUFBK0IsRUFBRW1CLFFBQVFELEVBQUVFLEtBQVosRUFBL0IsRUFDTnBDLElBRE0sQ0FDRCxVQUFDVyxRQUFELEVBQWM7QUFDbEIsZUFBT0EsU0FBU0gsSUFBaEI7QUFDRCxPQUhNLENBQVA7QUFJRCIsImZpbGUiOiJzdG9yYWdlL3Jlc3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBheGlvcyBmcm9tICdheGlvcyc7XG5pbXBvcnQgeyBTdG9yYWdlIH0gZnJvbSAnLi9zdG9yYWdlJztcblxuY29uc3QgJGF4aW9zID0gU3ltYm9sKCckYXhpb3MnKTtcbmltcG9ydCBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcblxuZXhwb3J0IGNsYXNzIFJlc3RTdG9yYWdlIGV4dGVuZHMgU3RvcmFnZSB7XG5cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgc3VwZXIob3B0cyk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHtcbiAgICAgICAgYmFzZVVSTDogJ2h0dHA6Ly9sb2NhbGhvc3QvYXBpJyxcbiAgICAgIH0sXG4gICAgICBvcHRzXG4gICAgKTtcbiAgICB0aGlzWyRheGlvc10gPSBvcHRpb25zLmF4aW9zIHx8IGF4aW9zLmNyZWF0ZShvcHRpb25zKTtcbiAgfVxuXG4gIG9uQ2FjaGVhYmxlUmVhZCgpIHt9XG5cbiAgcmVzdChvcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXNbJGF4aW9zXShvcHRpb25zKTtcbiAgfVxuXG4gIHdyaXRlKHQsIHYpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBpZiAodlt0LiRpZF0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5wYXRjaChgLyR7dC4kbmFtZX0vJHt2W3QuJGlkXX1gLCB2KTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy50ZXJtaW5hbCkge1xuICAgICAgICByZXR1cm4gdGhpc1skYXhpb3NdLnBvc3QoYC8ke3QuJG5hbWV9YCwgdik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgbmV3IGNvbnRlbnQgaW4gYSBub24tdGVybWluYWwgc3RvcmUnKTtcbiAgICAgIH1cbiAgICB9KS50aGVuKChkKSA9PiBkLmRhdGFbdC4kbmFtZV1bMF0pO1xuICB9XG5cbiAgcmVhZE9uZSh0LCBpZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHRoaXNbJGF4aW9zXS5nZXQoYC8ke3QuJG5hbWV9LyR7aWR9YCkpXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YVt0LiRuYW1lXVswXTtcbiAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyLnJlc3BvbnNlICYmIGVyci5yZXNwb25zZS5zdGF0dXMgPT09IDQwNCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHJlYWRNYW55KHQsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLmdldChgLyR7dC4kbmFtZX0vJHtpZH0vJHtyZWxhdGlvbnNoaXB9YClcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHJlc3BvbnNlLmRhdGEpXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGlmIChlcnIucmVzcG9uc2UgJiYgZXJyLnJlc3BvbnNlLnN0YXR1cyA9PT0gNDA0KSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGFkZCh0eXBlLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUsIGNoaWxkSWQsIGV4dHJhcykge1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcEJsb2NrID0gdHlwZS4kZmllbGRzW3JlbGF0aW9uc2hpcFRpdGxlXTtcbiAgICBjb25zdCBzaWRlSW5mbyA9IHJlbGF0aW9uc2hpcEJsb2NrLnJlbGF0aW9uc2hpcC4kc2lkZXNbcmVsYXRpb25zaGlwVGl0bGVdO1xuICAgIGNvbnN0IG5ld0ZpZWxkID0geyBbc2lkZUluZm8uc2VsZi5maWVsZF06IGlkLCBbc2lkZUluZm8ub3RoZXIuZmllbGRdOiBjaGlsZElkIH07XG4gICAgaWYgKHJlbGF0aW9uc2hpcEJsb2NrLnJlbGF0aW9uc2hpcC4kZXh0cmFzKSB7XG4gICAgICBPYmplY3Qua2V5cyhyZWxhdGlvbnNoaXBCbG9jay5yZWxhdGlvbnNoaXAuJGV4dHJhcykuZm9yRWFjaCgoZXh0cmEpID0+IHtcbiAgICAgICAgbmV3RmllbGRbZXh0cmFdID0gZXh0cmFzW2V4dHJhXTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLnB1dChgLyR7dHlwZS4kbmFtZX0vJHtpZH0vJHtyZWxhdGlvbnNoaXBUaXRsZX1gLCBuZXdGaWVsZCk7XG4gIH1cblxuICByZW1vdmUodCwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCkge1xuICAgIHJldHVybiB0aGlzWyRheGlvc10uZGVsZXRlKGAvJHt0LiRuYW1lfS8ke2lkfS8ke3JlbGF0aW9uc2hpcH0vJHtjaGlsZElkfWApO1xuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKHQsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQsIGV4dHJhcykge1xuICAgIHJldHVybiB0aGlzWyRheGlvc10ucGF0Y2goYC8ke3QuJG5hbWV9LyR7aWR9LyR7cmVsYXRpb25zaGlwfS8ke2NoaWxkSWR9YCwgZXh0cmFzKTtcbiAgfVxuXG4gIGRlbGV0ZSh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzWyRheGlvc10uZGVsZXRlKGAvJHt0LiRuYW1lfS8ke2lkfWApXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICB9KTtcbiAgfVxuXG4gIHF1ZXJ5KHEpIHtcbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLmdldChgLyR7cS50eXBlfWAsIHsgcGFyYW1zOiBxLnF1ZXJ5IH0pXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICB9KTtcbiAgfVxufVxuIl19
