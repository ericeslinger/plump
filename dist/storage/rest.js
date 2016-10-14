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
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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
    key: 'write',
    value: function write(t, v) {
      var _this2 = this;

      return _bluebird2.default.resolve().then(function () {
        if (v[t.$id]) {
          return _this2[$axios].patch('/' + t.$name + '/' + v[t.$id], v);
        } else {
          if (_this2.terminal) {
            return _this2[$axios].post('/' + t.$name, v);
          } else {
            throw new Error('Cannot create new content in a non-terminal store');
          }
        }
      }).then(function (d) {
        return d.data[t.$name][0];
      });
    }
  }, {
    key: 'read',
    value: function read(t, id, relationship) {
      if (!relationship) {
        return this[$axios].get('/' + t.$name + '/' + id).then(function (response) {
          return response.data[t.$name][0];
        }).catch(function (err) {
          if (err === 404) {
            return null;
          } else {
            throw err;
          }
        });
      } else {
        return this[$axios].get('/' + t.$name + '/' + id + '/' + relationship).then(function (response) {
          return response.data;
        });
      }
      // TODO: cacheable read
      // {
      //   const retVal = {
      //     main: ,
      //     extra: [],
      //   };
      //   Object.keys(response.data).forEach((typeName) => {
      //     retVal.extra.concat(response.data[typeName].map((d) => {
      //       if ((d[t.$id] === id) && (typeName === t.$name)) {
      //         return null;
      //       } else {
      //         return Object.assign({}, {typeName}, d);
      //       }
      //     }).filter((v) => v !== null));
      //   });
      //   return retVal;
      // });
    }
  }, {
    key: 'add',
    value: function add(t, id, relationship, childId, extras) {
      var newField = _defineProperty({}, t.$id, childId);
      (t.$fields[relationship].extras || []).forEach(function (e) {
        newField[e] = extras[e];
      });
      return this[$axios].put('/' + t.$name + '/' + id + '/' + relationship, newField);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvcmVzdC5qcyJdLCJuYW1lcyI6WyJheGlvcyIsIiRheGlvcyIsIlN5bWJvbCIsIlJlc3RTdG9yYWdlIiwib3B0cyIsIm9wdGlvbnMiLCJPYmplY3QiLCJhc3NpZ24iLCJiYXNlVVJMIiwiY3JlYXRlIiwidCIsInYiLCJyZXNvbHZlIiwidGhlbiIsIiRpZCIsInBhdGNoIiwiJG5hbWUiLCJ0ZXJtaW5hbCIsInBvc3QiLCJFcnJvciIsImQiLCJkYXRhIiwiaWQiLCJyZWxhdGlvbnNoaXAiLCJnZXQiLCJyZXNwb25zZSIsImNhdGNoIiwiZXJyIiwiY2hpbGRJZCIsImV4dHJhcyIsIm5ld0ZpZWxkIiwiJGZpZWxkcyIsImZvckVhY2giLCJlIiwicHV0IiwiZGVsZXRlIiwicSIsInR5cGUiLCJwYXJhbXMiLCJxdWVyeSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0lBQVlBLEs7O0FBQ1o7O0FBR0E7Ozs7Ozs7Ozs7Ozs7Ozs7QUFEQSxJQUFNQyxTQUFTQyxPQUFPLFFBQVAsQ0FBZjs7SUFHYUMsVyxXQUFBQSxXOzs7QUFFWCx5QkFBdUI7QUFBQSxRQUFYQyxJQUFXLHlEQUFKLEVBQUk7O0FBQUE7O0FBQUEsMEhBQ2ZBLElBRGU7O0FBRXJCLFFBQU1DLFVBQVVDLE9BQU9DLE1BQVAsQ0FDZCxFQURjLEVBRWQ7QUFDRUMsZUFBUztBQURYLEtBRmMsRUFLZEosSUFMYyxDQUFoQjtBQU9BLFVBQUtILE1BQUwsSUFBZUksUUFBUUwsS0FBUixJQUFpQkEsTUFBTVMsTUFBTixDQUFhSixPQUFiLENBQWhDO0FBVHFCO0FBVXRCOzs7O3NDQUVpQixDQUFFOzs7MEJBRWRLLEMsRUFBR0MsQyxFQUFHO0FBQUE7O0FBQ1YsYUFBTyxtQkFBUUMsT0FBUixHQUNOQyxJQURNLENBQ0QsWUFBTTtBQUNWLFlBQUlGLEVBQUVELEVBQUVJLEdBQUosQ0FBSixFQUFjO0FBQ1osaUJBQU8sT0FBS2IsTUFBTCxFQUFhYyxLQUFiLE9BQXVCTCxFQUFFTSxLQUF6QixTQUFrQ0wsRUFBRUQsRUFBRUksR0FBSixDQUFsQyxFQUE4Q0gsQ0FBOUMsQ0FBUDtBQUNELFNBRkQsTUFFTztBQUNMLGNBQUksT0FBS00sUUFBVCxFQUFtQjtBQUNqQixtQkFBTyxPQUFLaEIsTUFBTCxFQUFhaUIsSUFBYixPQUFzQlIsRUFBRU0sS0FBeEIsRUFBaUNMLENBQWpDLENBQVA7QUFDRCxXQUZELE1BRU87QUFDTCxrQkFBTSxJQUFJUSxLQUFKLENBQVUsbURBQVYsQ0FBTjtBQUNEO0FBQ0Y7QUFDRixPQVhNLEVBV0pOLElBWEksQ0FXQyxVQUFDTyxDQUFEO0FBQUEsZUFBT0EsRUFBRUMsSUFBRixDQUFPWCxFQUFFTSxLQUFULEVBQWdCLENBQWhCLENBQVA7QUFBQSxPQVhELENBQVA7QUFZRDs7O3lCQUVJTixDLEVBQUdZLEUsRUFBSUMsWSxFQUFjO0FBQ3hCLFVBQUksQ0FBQ0EsWUFBTCxFQUFtQjtBQUNqQixlQUFPLEtBQUt0QixNQUFMLEVBQWF1QixHQUFiLE9BQXFCZCxFQUFFTSxLQUF2QixTQUFnQ00sRUFBaEMsRUFDTlQsSUFETSxDQUNELFVBQUNZLFFBQUQsRUFBYztBQUNsQixpQkFBT0EsU0FBU0osSUFBVCxDQUFjWCxFQUFFTSxLQUFoQixFQUF1QixDQUF2QixDQUFQO0FBQ0QsU0FITSxFQUdKVSxLQUhJLENBR0UsVUFBQ0MsR0FBRCxFQUFTO0FBQ2hCLGNBQUlBLFFBQVEsR0FBWixFQUFpQjtBQUNmLG1CQUFPLElBQVA7QUFDRCxXQUZELE1BRU87QUFDTCxrQkFBTUEsR0FBTjtBQUNEO0FBQ0YsU0FUTSxDQUFQO0FBVUQsT0FYRCxNQVdPO0FBQ0wsZUFBTyxLQUFLMUIsTUFBTCxFQUFhdUIsR0FBYixPQUFxQmQsRUFBRU0sS0FBdkIsU0FBZ0NNLEVBQWhDLFNBQXNDQyxZQUF0QyxFQUNOVixJQURNLENBQ0QsVUFBQ1ksUUFBRDtBQUFBLGlCQUFjQSxTQUFTSixJQUF2QjtBQUFBLFNBREMsQ0FBUDtBQUVEO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNEOzs7d0JBRUdYLEMsRUFBR1ksRSxFQUFJQyxZLEVBQWNLLE8sRUFBU0MsTSxFQUFRO0FBQ3hDLFVBQU1DLCtCQUFhcEIsRUFBRUksR0FBZixFQUFxQmMsT0FBckIsQ0FBTjtBQUNBLE9BQUNsQixFQUFFcUIsT0FBRixDQUFVUixZQUFWLEVBQXdCTSxNQUF4QixJQUFrQyxFQUFuQyxFQUF1Q0csT0FBdkMsQ0FBK0MsVUFBQ0MsQ0FBRCxFQUFPO0FBQ3BESCxpQkFBU0csQ0FBVCxJQUFjSixPQUFPSSxDQUFQLENBQWQ7QUFDRCxPQUZEO0FBR0EsYUFBTyxLQUFLaEMsTUFBTCxFQUFhaUMsR0FBYixPQUFxQnhCLEVBQUVNLEtBQXZCLFNBQWdDTSxFQUFoQyxTQUFzQ0MsWUFBdEMsRUFBc0RPLFFBQXRELENBQVA7QUFDRDs7OzJCQUVNcEIsQyxFQUFHWSxFLEVBQUlDLFksRUFBY0ssTyxFQUFTO0FBQ25DLGFBQU8sS0FBSzNCLE1BQUwsRUFBYWtDLE1BQWIsT0FBd0J6QixFQUFFTSxLQUExQixTQUFtQ00sRUFBbkMsU0FBeUNDLFlBQXpDLFNBQXlESyxPQUF6RCxDQUFQO0FBQ0Q7Ozt1Q0FFa0JsQixDLEVBQUdZLEUsRUFBSUMsWSxFQUFjSyxPLEVBQVNDLE0sRUFBUTtBQUN2RCxhQUFPLEtBQUs1QixNQUFMLEVBQWFjLEtBQWIsT0FBdUJMLEVBQUVNLEtBQXpCLFNBQWtDTSxFQUFsQyxTQUF3Q0MsWUFBeEMsU0FBd0RLLE9BQXhELEVBQW1FQyxNQUFuRSxDQUFQO0FBQ0Q7Ozs0QkFFTW5CLEMsRUFBR1ksRSxFQUFJO0FBQ1osYUFBTyxLQUFLckIsTUFBTCxFQUFha0MsTUFBYixPQUF3QnpCLEVBQUVNLEtBQTFCLFNBQW1DTSxFQUFuQyxFQUNOVCxJQURNLENBQ0QsVUFBQ1ksUUFBRCxFQUFjO0FBQ2xCLGVBQU9BLFNBQVNKLElBQWhCO0FBQ0QsT0FITSxDQUFQO0FBSUQ7OzswQkFFS2UsQyxFQUFHO0FBQ1AsYUFBTyxLQUFLbkMsTUFBTCxFQUFhdUIsR0FBYixPQUFxQlksRUFBRUMsSUFBdkIsRUFBK0IsRUFBQ0MsUUFBUUYsRUFBRUcsS0FBWCxFQUEvQixFQUNOMUIsSUFETSxDQUNELFVBQUNZLFFBQUQsRUFBYztBQUNsQixlQUFPQSxTQUFTSixJQUFoQjtBQUNELE9BSE0sQ0FBUDtBQUlEIiwiZmlsZSI6InN0b3JhZ2UvcmVzdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF4aW9zIGZyb20gJ2F4aW9zJztcbmltcG9ydCB7U3RvcmFnZX0gZnJvbSAnLi9zdG9yYWdlJztcblxuY29uc3QgJGF4aW9zID0gU3ltYm9sKCckYXhpb3MnKTtcbmltcG9ydCBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcblxuZXhwb3J0IGNsYXNzIFJlc3RTdG9yYWdlIGV4dGVuZHMgU3RvcmFnZSB7XG5cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgc3VwZXIob3B0cyk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHtcbiAgICAgICAgYmFzZVVSTDogJ2h0dHA6Ly9sb2NhbGhvc3QvYXBpJyxcbiAgICAgIH0sXG4gICAgICBvcHRzXG4gICAgKTtcbiAgICB0aGlzWyRheGlvc10gPSBvcHRpb25zLmF4aW9zIHx8IGF4aW9zLmNyZWF0ZShvcHRpb25zKTtcbiAgfVxuXG4gIG9uQ2FjaGVhYmxlUmVhZCgpIHt9XG5cbiAgd3JpdGUodCwgdikge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmICh2W3QuJGlkXSkge1xuICAgICAgICByZXR1cm4gdGhpc1skYXhpb3NdLnBhdGNoKGAvJHt0LiRuYW1lfS8ke3ZbdC4kaWRdfWAsIHYpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skYXhpb3NdLnBvc3QoYC8ke3QuJG5hbWV9YCwgdik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIG5ldyBjb250ZW50IGluIGEgbm9uLXRlcm1pbmFsIHN0b3JlJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KS50aGVuKChkKSA9PiBkLmRhdGFbdC4kbmFtZV1bMF0pO1xuICB9XG5cbiAgcmVhZCh0LCBpZCwgcmVsYXRpb25zaGlwKSB7XG4gICAgaWYgKCFyZWxhdGlvbnNoaXApIHtcbiAgICAgIHJldHVybiB0aGlzWyRheGlvc10uZ2V0KGAvJHt0LiRuYW1lfS8ke2lkfWApXG4gICAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGFbdC4kbmFtZV1bMF07XG4gICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIGlmIChlcnIgPT09IDQwNCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzWyRheGlvc10uZ2V0KGAvJHt0LiRuYW1lfS8ke2lkfS8ke3JlbGF0aW9uc2hpcH1gKVxuICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiByZXNwb25zZS5kYXRhKTtcbiAgICB9XG4gICAgLy8gVE9ETzogY2FjaGVhYmxlIHJlYWRcbiAgICAvLyB7XG4gICAgLy8gICBjb25zdCByZXRWYWwgPSB7XG4gICAgLy8gICAgIG1haW46ICxcbiAgICAvLyAgICAgZXh0cmE6IFtdLFxuICAgIC8vICAgfTtcbiAgICAvLyAgIE9iamVjdC5rZXlzKHJlc3BvbnNlLmRhdGEpLmZvckVhY2goKHR5cGVOYW1lKSA9PiB7XG4gICAgLy8gICAgIHJldFZhbC5leHRyYS5jb25jYXQocmVzcG9uc2UuZGF0YVt0eXBlTmFtZV0ubWFwKChkKSA9PiB7XG4gICAgLy8gICAgICAgaWYgKChkW3QuJGlkXSA9PT0gaWQpICYmICh0eXBlTmFtZSA9PT0gdC4kbmFtZSkpIHtcbiAgICAvLyAgICAgICAgIHJldHVybiBudWxsO1xuICAgIC8vICAgICAgIH0gZWxzZSB7XG4gICAgLy8gICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwge3R5cGVOYW1lfSwgZCk7XG4gICAgLy8gICAgICAgfVxuICAgIC8vICAgICB9KS5maWx0ZXIoKHYpID0+IHYgIT09IG51bGwpKTtcbiAgICAvLyAgIH0pO1xuICAgIC8vICAgcmV0dXJuIHJldFZhbDtcbiAgICAvLyB9KTtcbiAgfVxuXG4gIGFkZCh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkLCBleHRyYXMpIHtcbiAgICBjb25zdCBuZXdGaWVsZCA9IHtbdC4kaWRdOiBjaGlsZElkfTtcbiAgICAodC4kZmllbGRzW3JlbGF0aW9uc2hpcF0uZXh0cmFzIHx8IFtdKS5mb3JFYWNoKChlKSA9PiB7XG4gICAgICBuZXdGaWVsZFtlXSA9IGV4dHJhc1tlXTtcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLnB1dChgLyR7dC4kbmFtZX0vJHtpZH0vJHtyZWxhdGlvbnNoaXB9YCwgbmV3RmllbGQpO1xuICB9XG5cbiAgcmVtb3ZlKHQsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQpIHtcbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLmRlbGV0ZShgLyR7dC4kbmFtZX0vJHtpZH0vJHtyZWxhdGlvbnNoaXB9LyR7Y2hpbGRJZH1gKTtcbiAgfVxuXG4gIG1vZGlmeVJlbGF0aW9uc2hpcCh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkLCBleHRyYXMpIHtcbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLnBhdGNoKGAvJHt0LiRuYW1lfS8ke2lkfS8ke3JlbGF0aW9uc2hpcH0vJHtjaGlsZElkfWAsIGV4dHJhcyk7XG4gIH1cblxuICBkZWxldGUodCwgaWQpIHtcbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLmRlbGV0ZShgLyR7dC4kbmFtZX0vJHtpZH1gKVxuICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgfSk7XG4gIH1cblxuICBxdWVyeShxKSB7XG4gICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5nZXQoYC8ke3EudHlwZX1gLCB7cGFyYW1zOiBxLnF1ZXJ5fSlcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgIH0pO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
