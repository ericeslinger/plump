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
    key: 'write',
    value: function write(t, v) {
      if (v[t.$id]) {
        return this[$axios].put('/' + t.$name + '/' + v[t.$id], v);
      } else {
        if (this.terminal) {
          return this[$axios].post('/' + t.$name, v);
        } else {
          throw new Error('Cannot create new content in a non-terminal store');
        }
      }
    }
  }, {
    key: 'read',
    value: function read(t, id) {
      return this[$axios].get('/' + t.$name + '/' + id).then(function (response) {
        return response.data[t.$name][id];
      });

      // TODO: cahceable read
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvcmVzdC5qcyJdLCJuYW1lcyI6WyJheGlvcyIsIiRheGlvcyIsIlN5bWJvbCIsIlJlc3RTdG9yYWdlIiwib3B0cyIsIm9wdGlvbnMiLCJPYmplY3QiLCJhc3NpZ24iLCJiYXNlVVJMIiwiY3JlYXRlIiwidCIsInYiLCIkaWQiLCJwdXQiLCIkbmFtZSIsInRlcm1pbmFsIiwicG9zdCIsIkVycm9yIiwiaWQiLCJnZXQiLCJ0aGVuIiwicmVzcG9uc2UiLCJkYXRhIiwiZGVsZXRlIiwicSIsInR5cGUiLCJwYXJhbXMiLCJxdWVyeSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0lBQVlBLEs7O0FBQ1o7Ozs7Ozs7Ozs7QUFFQSxJQUFNQyxTQUFTQyxPQUFPLFFBQVAsQ0FBZjs7SUFFYUMsVyxXQUFBQSxXOzs7QUFFWCx5QkFBdUI7QUFBQSxRQUFYQyxJQUFXLHlEQUFKLEVBQUk7O0FBQUE7O0FBQUEsMEhBQ2ZBLElBRGU7O0FBRXJCLFFBQU1DLFVBQVVDLE9BQU9DLE1BQVAsQ0FDZCxFQURjLEVBRWQ7QUFDRUMsZUFBUztBQURYLEtBRmMsRUFLZEosSUFMYyxDQUFoQjtBQU9BLFVBQUtILE1BQUwsSUFBZUksUUFBUUwsS0FBUixJQUFpQkEsTUFBTVMsTUFBTixDQUFhSixPQUFiLENBQWhDO0FBVHFCO0FBVXRCOzs7OzBCQUVLSyxDLEVBQUdDLEMsRUFBRztBQUNWLFVBQUlBLEVBQUVELEVBQUVFLEdBQUosQ0FBSixFQUFjO0FBQ1osZUFBTyxLQUFLWCxNQUFMLEVBQWFZLEdBQWIsT0FBcUJILEVBQUVJLEtBQXZCLFNBQWdDSCxFQUFFRCxFQUFFRSxHQUFKLENBQWhDLEVBQTRDRCxDQUE1QyxDQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsWUFBSSxLQUFLSSxRQUFULEVBQW1CO0FBQ2pCLGlCQUFPLEtBQUtkLE1BQUwsRUFBYWUsSUFBYixPQUFzQk4sRUFBRUksS0FBeEIsRUFBaUNILENBQWpDLENBQVA7QUFDRCxTQUZELE1BRU87QUFDTCxnQkFBTSxJQUFJTSxLQUFKLENBQVUsbURBQVYsQ0FBTjtBQUNEO0FBQ0Y7QUFDRjs7O3lCQUVJUCxDLEVBQUdRLEUsRUFBSTtBQUNWLGFBQU8sS0FBS2pCLE1BQUwsRUFBYWtCLEdBQWIsT0FBcUJULEVBQUVJLEtBQXZCLFNBQWdDSSxFQUFoQyxFQUNORSxJQURNLENBQ0QsVUFBQ0MsUUFBRCxFQUFjO0FBQ2xCLGVBQU9BLFNBQVNDLElBQVQsQ0FBY1osRUFBRUksS0FBaEIsRUFBdUJJLEVBQXZCLENBQVA7QUFDRCxPQUhNLENBQVA7O0FBS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNEOzs7NEJBRU1SLEMsRUFBR1EsRSxFQUFJO0FBQ1osYUFBTyxLQUFLakIsTUFBTCxFQUFhc0IsTUFBYixPQUF3QmIsRUFBRUksS0FBMUIsU0FBbUNJLEVBQW5DLEVBQ05FLElBRE0sQ0FDRCxVQUFDQyxRQUFELEVBQWM7QUFDbEIsZUFBT0EsU0FBU0MsSUFBaEI7QUFDRCxPQUhNLENBQVA7QUFJRDs7OzBCQUVLRSxDLEVBQUc7QUFDUCxhQUFPLEtBQUt2QixNQUFMLEVBQWFrQixHQUFiLE9BQXFCSyxFQUFFQyxJQUF2QixFQUErQixFQUFDQyxRQUFRRixFQUFFRyxLQUFYLEVBQS9CLEVBQ05QLElBRE0sQ0FDRCxVQUFDQyxRQUFELEVBQWM7QUFDbEIsZUFBT0EsU0FBU0MsSUFBaEI7QUFDRCxPQUhNLENBQVA7QUFJRCIsImZpbGUiOiJzdG9yYWdlL3Jlc3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBheGlvcyBmcm9tICdheGlvcyc7XG5pbXBvcnQge1N0b3JhZ2V9IGZyb20gJy4vc3RvcmFnZSc7XG5cbmNvbnN0ICRheGlvcyA9IFN5bWJvbCgnJGF4aW9zJyk7XG5cbmV4cG9ydCBjbGFzcyBSZXN0U3RvcmFnZSBleHRlbmRzIFN0b3JhZ2Uge1xuXG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIHN1cGVyKG9wdHMpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIGJhc2VVUkw6ICdodHRwOi8vbG9jYWxob3N0L2FwaScsXG4gICAgICB9LFxuICAgICAgb3B0c1xuICAgICk7XG4gICAgdGhpc1skYXhpb3NdID0gb3B0aW9ucy5heGlvcyB8fCBheGlvcy5jcmVhdGUob3B0aW9ucyk7XG4gIH1cblxuICB3cml0ZSh0LCB2KSB7XG4gICAgaWYgKHZbdC4kaWRdKSB7XG4gICAgICByZXR1cm4gdGhpc1skYXhpb3NdLnB1dChgLyR7dC4kbmFtZX0vJHt2W3QuJGlkXX1gLCB2KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5wb3N0KGAvJHt0LiRuYW1lfWAsIHYpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIG5ldyBjb250ZW50IGluIGEgbm9uLXRlcm1pbmFsIHN0b3JlJyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmVhZCh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzWyRheGlvc10uZ2V0KGAvJHt0LiRuYW1lfS8ke2lkfWApXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YVt0LiRuYW1lXVtpZF07XG4gICAgfSk7XG5cbiAgICAvLyBUT0RPOiBjYWhjZWFibGUgcmVhZFxuICAgIC8vIHtcbiAgICAvLyAgIGNvbnN0IHJldFZhbCA9IHtcbiAgICAvLyAgICAgbWFpbjogLFxuICAgIC8vICAgICBleHRyYTogW10sXG4gICAgLy8gICB9O1xuICAgIC8vICAgT2JqZWN0LmtleXMocmVzcG9uc2UuZGF0YSkuZm9yRWFjaCgodHlwZU5hbWUpID0+IHtcbiAgICAvLyAgICAgcmV0VmFsLmV4dHJhLmNvbmNhdChyZXNwb25zZS5kYXRhW3R5cGVOYW1lXS5tYXAoKGQpID0+IHtcbiAgICAvLyAgICAgICBpZiAoKGRbdC4kaWRdID09PSBpZCkgJiYgKHR5cGVOYW1lID09PSB0LiRuYW1lKSkge1xuICAgIC8vICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgLy8gICAgICAgfSBlbHNlIHtcbiAgICAvLyAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCB7dHlwZU5hbWV9LCBkKTtcbiAgICAvLyAgICAgICB9XG4gICAgLy8gICAgIH0pLmZpbHRlcigodikgPT4gdiAhPT0gbnVsbCkpO1xuICAgIC8vICAgfSk7XG4gICAgLy8gICByZXR1cm4gcmV0VmFsO1xuICAgIC8vIH0pO1xuICB9XG5cbiAgZGVsZXRlKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5kZWxldGUoYC8ke3QuJG5hbWV9LyR7aWR9YClcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgIH0pO1xuICB9XG5cbiAgcXVlcnkocSkge1xuICAgIHJldHVybiB0aGlzWyRheGlvc10uZ2V0KGAvJHtxLnR5cGV9YCwge3BhcmFtczogcS5xdWVyeX0pXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICB9KTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
