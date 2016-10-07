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
//# sourceMappingURL=data:application/json;base64,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YixPQUF3QixFQUFFLEtBQTFCLFNBQW1DLEVBQW5DLEVBQ04sSUFETSxDQUNELFVBQUMsUUFBRCxFQUFjO0FBQ2xCLGVBQU8sU0FBUyxJQUFoQjtBQUNELE9BSE0sQ0FBUDtBQUlEOzs7MEJBRUssQyxFQUFHO0FBQ1AsYUFBTyxLQUFLLE1BQUwsRUFBYSxHQUFiLE9BQXFCLEVBQUUsSUFBdkIsRUFBK0IsRUFBQyxRQUFRLEVBQUUsS0FBWCxFQUEvQixFQUNOLElBRE0sQ0FDRCxVQUFDLFFBQUQsRUFBYztBQUNsQixlQUFPLFNBQVMsSUFBaEI7QUFDRCxPQUhNLENBQVA7QUFJRCIsImZpbGUiOiJzdG9yYWdlL3Jlc3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBheGlvcyBmcm9tICdheGlvcyc7XG5pbXBvcnQge1N0b3JhZ2V9IGZyb20gJy4vc3RvcmFnZSc7XG5cbmNvbnN0ICRheGlvcyA9IFN5bWJvbCgnJGF4aW9zJyk7XG5pbXBvcnQgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5cbmV4cG9ydCBjbGFzcyBSZXN0U3RvcmFnZSBleHRlbmRzIFN0b3JhZ2Uge1xuXG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIHN1cGVyKG9wdHMpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIGJhc2VVUkw6ICdodHRwOi8vbG9jYWxob3N0L2FwaScsXG4gICAgICB9LFxuICAgICAgb3B0c1xuICAgICk7XG4gICAgdGhpc1skYXhpb3NdID0gb3B0aW9ucy5heGlvcyB8fCBheGlvcy5jcmVhdGUob3B0aW9ucyk7XG4gIH1cblxuICBvbkNhY2hlYWJsZVJlYWQoKSB7fVxuXG4gIHdyaXRlKHQsIHYpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBpZiAodlt0LiRpZF0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5wYXRjaChgLyR7dC4kbmFtZX0vJHt2W3QuJGlkXX1gLCB2KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5wb3N0KGAvJHt0LiRuYW1lfWAsIHYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBuZXcgY29udGVudCBpbiBhIG5vbi10ZXJtaW5hbCBzdG9yZScpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkudGhlbigoZCkgPT4gZC5kYXRhW3QuJG5hbWVdWzBdKTtcbiAgfVxuXG4gIHJlYWQodCwgaWQpIHtcbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLmdldChgLyR7dC4kbmFtZX0vJHtpZH1gKVxuICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ0FYSU9TIFJFU1BPTlNFJyk7XG4gICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShyZXNwb25zZSkpO1xuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGFbdC4kbmFtZV1bMF07XG4gICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgaWYgKGVyciA9PT0gNDA0KSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogY2FjaGVhYmxlIHJlYWRcbiAgICAvLyB7XG4gICAgLy8gICBjb25zdCByZXRWYWwgPSB7XG4gICAgLy8gICAgIG1haW46ICxcbiAgICAvLyAgICAgZXh0cmE6IFtdLFxuICAgIC8vICAgfTtcbiAgICAvLyAgIE9iamVjdC5rZXlzKHJlc3BvbnNlLmRhdGEpLmZvckVhY2goKHR5cGVOYW1lKSA9PiB7XG4gICAgLy8gICAgIHJldFZhbC5leHRyYS5jb25jYXQocmVzcG9uc2UuZGF0YVt0eXBlTmFtZV0ubWFwKChkKSA9PiB7XG4gICAgLy8gICAgICAgaWYgKChkW3QuJGlkXSA9PT0gaWQpICYmICh0eXBlTmFtZSA9PT0gdC4kbmFtZSkpIHtcbiAgICAvLyAgICAgICAgIHJldHVybiBudWxsO1xuICAgIC8vICAgICAgIH0gZWxzZSB7XG4gICAgLy8gICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwge3R5cGVOYW1lfSwgZCk7XG4gICAgLy8gICAgICAgfVxuICAgIC8vICAgICB9KS5maWx0ZXIoKHYpID0+IHYgIT09IG51bGwpKTtcbiAgICAvLyAgIH0pO1xuICAgIC8vICAgcmV0dXJuIHJldFZhbDtcbiAgICAvLyB9KTtcbiAgfVxuXG4gIGhhcyh0LCBpZCwgcmVsYXRpb25zaGlwKSB7XG4gICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5nZXQoYC8ke3QuJG5hbWV9LyR7aWR9LyR7cmVsYXRpb25zaGlwfWApXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiByZXNwb25zZS5kYXRhKTtcbiAgfVxuXG4gIGFkZCh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKSB7XG4gICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5wdXQoYC8ke3QuJG5hbWV9LyR7aWR9LyR7cmVsYXRpb25zaGlwfWAsIGNoaWxkSWQpO1xuICB9XG5cbiAgcmVtb3ZlKHQsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQpIHtcbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLmRlbGV0ZShgLyR7dC4kbmFtZX0vJHtpZH0vJHtyZWxhdGlvbnNoaXB9LyR7Y2hpbGRJZH1gKTtcbiAgfVxuXG4gIGRlbGV0ZSh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzWyRheGlvc10uZGVsZXRlKGAvJHt0LiRuYW1lfS8ke2lkfWApXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICB9KTtcbiAgfVxuXG4gIHF1ZXJ5KHEpIHtcbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLmdldChgLyR7cS50eXBlfWAsIHtwYXJhbXM6IHEucXVlcnl9KVxuICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgfSk7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
