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
        console.log('AXIOS RESPONSE');
        console.log(JSON.stringify(response));
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
//# sourceMappingURL=data:application/json;base64,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QUExQixTQUFtQyxFQUFuQyxFQUNOLElBRE0sQ0FDRCxVQUFDLFFBQUQsRUFBYztBQUNsQixlQUFPLFNBQVMsSUFBaEI7QUFDRCxPQUhNLENBQVA7QUFJRDs7OzBCQUVLLEMsRUFBRztBQUNQLGFBQU8sS0FBSyxNQUFMLEVBQWEsR0FBYixPQUFxQixFQUFFLElBQXZCLEVBQStCLEVBQUMsUUFBUSxFQUFFLEtBQVgsRUFBL0IsRUFDTixJQURNLENBQ0QsVUFBQyxRQUFELEVBQWM7QUFDbEIsZUFBTyxTQUFTLElBQWhCO0FBQ0QsT0FITSxDQUFQO0FBSUQiLCJmaWxlIjoic3RvcmFnZS9yZXN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXhpb3MgZnJvbSAnYXhpb3MnO1xuaW1wb3J0IHtTdG9yYWdlfSBmcm9tICcuL3N0b3JhZ2UnO1xuXG5jb25zdCAkYXhpb3MgPSBTeW1ib2woJyRheGlvcycpO1xuaW1wb3J0IFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuXG5leHBvcnQgY2xhc3MgUmVzdFN0b3JhZ2UgZXh0ZW5kcyBTdG9yYWdlIHtcblxuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBzdXBlcihvcHRzKTtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAge1xuICAgICAgICBiYXNlVVJMOiAnaHR0cDovL2xvY2FsaG9zdC9hcGknLFxuICAgICAgfSxcbiAgICAgIG9wdHNcbiAgICApO1xuICAgIHRoaXNbJGF4aW9zXSA9IG9wdGlvbnMuYXhpb3MgfHwgYXhpb3MuY3JlYXRlKG9wdGlvbnMpO1xuICB9XG5cbiAgd3JpdGUodCwgdikge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmICh2W3QuJGlkXSkge1xuICAgICAgICByZXR1cm4gdGhpc1skYXhpb3NdLnBhdGNoKGAvJHt0LiRuYW1lfS8ke3ZbdC4kaWRdfWAsIHYpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skYXhpb3NdLnBvc3QoYC8ke3QuJG5hbWV9YCwgdik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIG5ldyBjb250ZW50IGluIGEgbm9uLXRlcm1pbmFsIHN0b3JlJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KS50aGVuKChkKSA9PiBkLmRhdGFbdC4kbmFtZV1bMF0pO1xuICB9XG5cbiAgcmVhZCh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzWyRheGlvc10uZ2V0KGAvJHt0LiRuYW1lfS8ke2lkfWApXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnQVhJT1MgUkVTUE9OU0UnKTtcbiAgICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlKSk7XG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YVt0LiRuYW1lXVswXTtcbiAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyID09PSA0MDQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBUT0RPOiBjYWNoZWFibGUgcmVhZFxuICAgIC8vIHtcbiAgICAvLyAgIGNvbnN0IHJldFZhbCA9IHtcbiAgICAvLyAgICAgbWFpbjogLFxuICAgIC8vICAgICBleHRyYTogW10sXG4gICAgLy8gICB9O1xuICAgIC8vICAgT2JqZWN0LmtleXMocmVzcG9uc2UuZGF0YSkuZm9yRWFjaCgodHlwZU5hbWUpID0+IHtcbiAgICAvLyAgICAgcmV0VmFsLmV4dHJhLmNvbmNhdChyZXNwb25zZS5kYXRhW3R5cGVOYW1lXS5tYXAoKGQpID0+IHtcbiAgICAvLyAgICAgICBpZiAoKGRbdC4kaWRdID09PSBpZCkgJiYgKHR5cGVOYW1lID09PSB0LiRuYW1lKSkge1xuICAgIC8vICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgLy8gICAgICAgfSBlbHNlIHtcbiAgICAvLyAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCB7dHlwZU5hbWV9LCBkKTtcbiAgICAvLyAgICAgICB9XG4gICAgLy8gICAgIH0pLmZpbHRlcigodikgPT4gdiAhPT0gbnVsbCkpO1xuICAgIC8vICAgfSk7XG4gICAgLy8gICByZXR1cm4gcmV0VmFsO1xuICAgIC8vIH0pO1xuICB9XG5cbiAgaGFzKHQsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLmdldChgLyR7dC4kbmFtZX0vJHtpZH0vJHtyZWxhdGlvbnNoaXB9YClcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHJlc3BvbnNlLmRhdGEpO1xuICB9XG5cbiAgYWRkKHQsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQpIHtcbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLnB1dChgLyR7dC4kbmFtZX0vJHtpZH0vJHtyZWxhdGlvbnNoaXB9YCwgY2hpbGRJZCk7XG4gIH1cblxuICByZW1vdmUodCwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCkge1xuICAgIHJldHVybiB0aGlzWyRheGlvc10uZGVsZXRlKGAvJHt0LiRuYW1lfS8ke2lkfS8ke3JlbGF0aW9uc2hpcH0vJHtjaGlsZElkfWApO1xuICB9XG5cbiAgZGVsZXRlKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5kZWxldGUoYC8ke3QuJG5hbWV9LyR7aWR9YClcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgIH0pO1xuICB9XG5cbiAgcXVlcnkocSkge1xuICAgIHJldHVybiB0aGlzWyRheGlvc10uZ2V0KGAvJHtxLnR5cGV9YCwge3BhcmFtczogcS5xdWVyeX0pXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICB9KTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
