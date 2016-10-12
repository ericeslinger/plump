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
    value: function read(t, id) {
      return this[$axios].get('/' + t.$name + '/' + id).then(function (response) {
        return response.data[t.$name][0];
      }).catch(function (err) {
        if (err === 404) {
          return null;
        } else {
          throw err;
        }
      });

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
    key: 'has',
    value: function has(t, id, relationship) {
      return this[$axios].get('/' + t.$name + '/' + id + '/' + relationship).then(function (response) {
        return response.data;
      });
    }
  }, {
    key: 'add',
    value: function add(t, id, relationship, childId) {
      return this[$axios].put('/' + t.$name + '/' + id + '/' + relationship, childId);
    }
  }, {
    key: 'remove',
    value: function remove(t, id, relationship, childId) {
      return this[$axios].delete('/' + t.$name + '/' + id + '/' + relationship + '/' + childId);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvcmVzdC5qcyJdLCJuYW1lcyI6WyJheGlvcyIsIiRheGlvcyIsIlN5bWJvbCIsIlJlc3RTdG9yYWdlIiwib3B0cyIsIm9wdGlvbnMiLCJPYmplY3QiLCJhc3NpZ24iLCJiYXNlVVJMIiwiY3JlYXRlIiwidCIsInYiLCJyZXNvbHZlIiwidGhlbiIsIiRpZCIsInBhdGNoIiwiJG5hbWUiLCJ0ZXJtaW5hbCIsInBvc3QiLCJFcnJvciIsImQiLCJkYXRhIiwiaWQiLCJnZXQiLCJyZXNwb25zZSIsImNhdGNoIiwiZXJyIiwicmVsYXRpb25zaGlwIiwiY2hpbGRJZCIsInB1dCIsImRlbGV0ZSIsInEiLCJ0eXBlIiwicGFyYW1zIiwicXVlcnkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQUFZQSxLOztBQUNaOztBQUdBOzs7Ozs7Ozs7Ozs7OztBQURBLElBQU1DLFNBQVNDLE9BQU8sUUFBUCxDQUFmOztJQUdhQyxXLFdBQUFBLFc7OztBQUVYLHlCQUF1QjtBQUFBLFFBQVhDLElBQVcsdUVBQUosRUFBSTs7QUFBQTs7QUFBQSwwSEFDZkEsSUFEZTs7QUFFckIsUUFBTUMsVUFBVUMsT0FBT0MsTUFBUCxDQUNkLEVBRGMsRUFFZDtBQUNFQyxlQUFTO0FBRFgsS0FGYyxFQUtkSixJQUxjLENBQWhCO0FBT0EsVUFBS0gsTUFBTCxJQUFlSSxRQUFRTCxLQUFSLElBQWlCQSxNQUFNUyxNQUFOLENBQWFKLE9BQWIsQ0FBaEM7QUFUcUI7QUFVdEI7Ozs7c0NBRWlCLENBQUU7OzswQkFFZEssQyxFQUFHQyxDLEVBQUc7QUFBQTs7QUFDVixhQUFPLG1CQUFRQyxPQUFSLEdBQ05DLElBRE0sQ0FDRCxZQUFNO0FBQ1YsWUFBSUYsRUFBRUQsRUFBRUksR0FBSixDQUFKLEVBQWM7QUFDWixpQkFBTyxPQUFLYixNQUFMLEVBQWFjLEtBQWIsT0FBdUJMLEVBQUVNLEtBQXpCLFNBQWtDTCxFQUFFRCxFQUFFSSxHQUFKLENBQWxDLEVBQThDSCxDQUE5QyxDQUFQO0FBQ0QsU0FGRCxNQUVPO0FBQ0wsY0FBSSxPQUFLTSxRQUFULEVBQW1CO0FBQ2pCLG1CQUFPLE9BQUtoQixNQUFMLEVBQWFpQixJQUFiLE9BQXNCUixFQUFFTSxLQUF4QixFQUFpQ0wsQ0FBakMsQ0FBUDtBQUNELFdBRkQsTUFFTztBQUNMLGtCQUFNLElBQUlRLEtBQUosQ0FBVSxtREFBVixDQUFOO0FBQ0Q7QUFDRjtBQUNGLE9BWE0sRUFXSk4sSUFYSSxDQVdDLFVBQUNPLENBQUQ7QUFBQSxlQUFPQSxFQUFFQyxJQUFGLENBQU9YLEVBQUVNLEtBQVQsRUFBZ0IsQ0FBaEIsQ0FBUDtBQUFBLE9BWEQsQ0FBUDtBQVlEOzs7eUJBRUlOLEMsRUFBR1ksRSxFQUFJO0FBQ1YsYUFBTyxLQUFLckIsTUFBTCxFQUFhc0IsR0FBYixPQUFxQmIsRUFBRU0sS0FBdkIsU0FBZ0NNLEVBQWhDLEVBQ05ULElBRE0sQ0FDRCxVQUFDVyxRQUFELEVBQWM7QUFDbEIsZUFBT0EsU0FBU0gsSUFBVCxDQUFjWCxFQUFFTSxLQUFoQixFQUF1QixDQUF2QixDQUFQO0FBQ0QsT0FITSxFQUdKUyxLQUhJLENBR0UsVUFBQ0MsR0FBRCxFQUFTO0FBQ2hCLFlBQUlBLFFBQVEsR0FBWixFQUFpQjtBQUNmLGlCQUFPLElBQVA7QUFDRCxTQUZELE1BRU87QUFDTCxnQkFBTUEsR0FBTjtBQUNEO0FBQ0YsT0FUTSxDQUFQOztBQVdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDRDs7O3dCQUVHaEIsQyxFQUFHWSxFLEVBQUlLLFksRUFBYztBQUN2QixhQUFPLEtBQUsxQixNQUFMLEVBQWFzQixHQUFiLE9BQXFCYixFQUFFTSxLQUF2QixTQUFnQ00sRUFBaEMsU0FBc0NLLFlBQXRDLEVBQ05kLElBRE0sQ0FDRCxVQUFDVyxRQUFEO0FBQUEsZUFBY0EsU0FBU0gsSUFBdkI7QUFBQSxPQURDLENBQVA7QUFFRDs7O3dCQUVHWCxDLEVBQUdZLEUsRUFBSUssWSxFQUFjQyxPLEVBQVM7QUFDaEMsYUFBTyxLQUFLM0IsTUFBTCxFQUFhNEIsR0FBYixPQUFxQm5CLEVBQUVNLEtBQXZCLFNBQWdDTSxFQUFoQyxTQUFzQ0ssWUFBdEMsRUFBc0RDLE9BQXRELENBQVA7QUFDRDs7OzJCQUVNbEIsQyxFQUFHWSxFLEVBQUlLLFksRUFBY0MsTyxFQUFTO0FBQ25DLGFBQU8sS0FBSzNCLE1BQUwsRUFBYTZCLE1BQWIsT0FBd0JwQixFQUFFTSxLQUExQixTQUFtQ00sRUFBbkMsU0FBeUNLLFlBQXpDLFNBQXlEQyxPQUF6RCxDQUFQO0FBQ0Q7Ozs0QkFFTWxCLEMsRUFBR1ksRSxFQUFJO0FBQ1osYUFBTyxLQUFLckIsTUFBTCxFQUFhNkIsTUFBYixPQUF3QnBCLEVBQUVNLEtBQTFCLFNBQW1DTSxFQUFuQyxFQUNOVCxJQURNLENBQ0QsVUFBQ1csUUFBRCxFQUFjO0FBQ2xCLGVBQU9BLFNBQVNILElBQWhCO0FBQ0QsT0FITSxDQUFQO0FBSUQ7OzswQkFFS1UsQyxFQUFHO0FBQ1AsYUFBTyxLQUFLOUIsTUFBTCxFQUFhc0IsR0FBYixPQUFxQlEsRUFBRUMsSUFBdkIsRUFBK0IsRUFBQ0MsUUFBUUYsRUFBRUcsS0FBWCxFQUEvQixFQUNOckIsSUFETSxDQUNELFVBQUNXLFFBQUQsRUFBYztBQUNsQixlQUFPQSxTQUFTSCxJQUFoQjtBQUNELE9BSE0sQ0FBUDtBQUlEIiwiZmlsZSI6InN0b3JhZ2UvcmVzdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF4aW9zIGZyb20gJ2F4aW9zJztcbmltcG9ydCB7U3RvcmFnZX0gZnJvbSAnLi9zdG9yYWdlJztcblxuY29uc3QgJGF4aW9zID0gU3ltYm9sKCckYXhpb3MnKTtcbmltcG9ydCBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcblxuZXhwb3J0IGNsYXNzIFJlc3RTdG9yYWdlIGV4dGVuZHMgU3RvcmFnZSB7XG5cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgc3VwZXIob3B0cyk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHtcbiAgICAgICAgYmFzZVVSTDogJ2h0dHA6Ly9sb2NhbGhvc3QvYXBpJyxcbiAgICAgIH0sXG4gICAgICBvcHRzXG4gICAgKTtcbiAgICB0aGlzWyRheGlvc10gPSBvcHRpb25zLmF4aW9zIHx8IGF4aW9zLmNyZWF0ZShvcHRpb25zKTtcbiAgfVxuXG4gIG9uQ2FjaGVhYmxlUmVhZCgpIHt9XG5cbiAgd3JpdGUodCwgdikge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmICh2W3QuJGlkXSkge1xuICAgICAgICByZXR1cm4gdGhpc1skYXhpb3NdLnBhdGNoKGAvJHt0LiRuYW1lfS8ke3ZbdC4kaWRdfWAsIHYpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skYXhpb3NdLnBvc3QoYC8ke3QuJG5hbWV9YCwgdik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIG5ldyBjb250ZW50IGluIGEgbm9uLXRlcm1pbmFsIHN0b3JlJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KS50aGVuKChkKSA9PiBkLmRhdGFbdC4kbmFtZV1bMF0pO1xuICB9XG5cbiAgcmVhZCh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzWyRheGlvc10uZ2V0KGAvJHt0LiRuYW1lfS8ke2lkfWApXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YVt0LiRuYW1lXVswXTtcbiAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyID09PSA0MDQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBUT0RPOiBjYWNoZWFibGUgcmVhZFxuICAgIC8vIHtcbiAgICAvLyAgIGNvbnN0IHJldFZhbCA9IHtcbiAgICAvLyAgICAgbWFpbjogLFxuICAgIC8vICAgICBleHRyYTogW10sXG4gICAgLy8gICB9O1xuICAgIC8vICAgT2JqZWN0LmtleXMocmVzcG9uc2UuZGF0YSkuZm9yRWFjaCgodHlwZU5hbWUpID0+IHtcbiAgICAvLyAgICAgcmV0VmFsLmV4dHJhLmNvbmNhdChyZXNwb25zZS5kYXRhW3R5cGVOYW1lXS5tYXAoKGQpID0+IHtcbiAgICAvLyAgICAgICBpZiAoKGRbdC4kaWRdID09PSBpZCkgJiYgKHR5cGVOYW1lID09PSB0LiRuYW1lKSkge1xuICAgIC8vICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgLy8gICAgICAgfSBlbHNlIHtcbiAgICAvLyAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCB7dHlwZU5hbWV9LCBkKTtcbiAgICAvLyAgICAgICB9XG4gICAgLy8gICAgIH0pLmZpbHRlcigodikgPT4gdiAhPT0gbnVsbCkpO1xuICAgIC8vICAgfSk7XG4gICAgLy8gICByZXR1cm4gcmV0VmFsO1xuICAgIC8vIH0pO1xuICB9XG5cbiAgaGFzKHQsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLmdldChgLyR7dC4kbmFtZX0vJHtpZH0vJHtyZWxhdGlvbnNoaXB9YClcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHJlc3BvbnNlLmRhdGEpO1xuICB9XG5cbiAgYWRkKHQsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQpIHtcbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLnB1dChgLyR7dC4kbmFtZX0vJHtpZH0vJHtyZWxhdGlvbnNoaXB9YCwgY2hpbGRJZCk7XG4gIH1cblxuICByZW1vdmUodCwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCkge1xuICAgIHJldHVybiB0aGlzWyRheGlvc10uZGVsZXRlKGAvJHt0LiRuYW1lfS8ke2lkfS8ke3JlbGF0aW9uc2hpcH0vJHtjaGlsZElkfWApO1xuICB9XG5cbiAgZGVsZXRlKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5kZWxldGUoYC8ke3QuJG5hbWV9LyR7aWR9YClcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgIH0pO1xuICB9XG5cbiAgcXVlcnkocSkge1xuICAgIHJldHVybiB0aGlzWyRheGlvc10uZ2V0KGAvJHtxLnR5cGV9YCwge3BhcmFtczogcS5xdWVyeX0pXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICB9KTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
