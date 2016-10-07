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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvcmVzdC5qcyJdLCJuYW1lcyI6WyJheGlvcyIsIiRheGlvcyIsIlN5bWJvbCIsIlJlc3RTdG9yYWdlIiwib3B0cyIsIm9wdGlvbnMiLCJPYmplY3QiLCJhc3NpZ24iLCJiYXNlVVJMIiwiY3JlYXRlIiwidCIsInYiLCJyZXNvbHZlIiwidGhlbiIsIiRpZCIsInBhdGNoIiwiJG5hbWUiLCJ0ZXJtaW5hbCIsInBvc3QiLCJFcnJvciIsImQiLCJkYXRhIiwiaWQiLCJnZXQiLCJyZXNwb25zZSIsImNvbnNvbGUiLCJsb2ciLCJKU09OIiwic3RyaW5naWZ5IiwiY2F0Y2giLCJlcnIiLCJyZWxhdGlvbnNoaXAiLCJjaGlsZElkIiwicHV0IiwiZGVsZXRlIiwicSIsInR5cGUiLCJwYXJhbXMiLCJxdWVyeSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0lBQVlBLEs7O0FBQ1o7O0FBR0E7Ozs7Ozs7Ozs7Ozs7O0FBREEsSUFBTUMsU0FBU0MsT0FBTyxRQUFQLENBQWY7O0lBR2FDLFcsV0FBQUEsVzs7O0FBRVgseUJBQXVCO0FBQUEsUUFBWEMsSUFBVyx1RUFBSixFQUFJOztBQUFBOztBQUFBLDBIQUNmQSxJQURlOztBQUVyQixRQUFNQyxVQUFVQyxPQUFPQyxNQUFQLENBQ2QsRUFEYyxFQUVkO0FBQ0VDLGVBQVM7QUFEWCxLQUZjLEVBS2RKLElBTGMsQ0FBaEI7QUFPQSxVQUFLSCxNQUFMLElBQWVJLFFBQVFMLEtBQVIsSUFBaUJBLE1BQU1TLE1BQU4sQ0FBYUosT0FBYixDQUFoQztBQVRxQjtBQVV0Qjs7OztzQ0FFaUIsQ0FBRTs7OzBCQUVkSyxDLEVBQUdDLEMsRUFBRztBQUFBOztBQUNWLGFBQU8sbUJBQVFDLE9BQVIsR0FDTkMsSUFETSxDQUNELFlBQU07QUFDVixZQUFJRixFQUFFRCxFQUFFSSxHQUFKLENBQUosRUFBYztBQUNaLGlCQUFPLE9BQUtiLE1BQUwsRUFBYWMsS0FBYixPQUF1QkwsRUFBRU0sS0FBekIsU0FBa0NMLEVBQUVELEVBQUVJLEdBQUosQ0FBbEMsRUFBOENILENBQTlDLENBQVA7QUFDRCxTQUZELE1BRU87QUFDTCxjQUFJLE9BQUtNLFFBQVQsRUFBbUI7QUFDakIsbUJBQU8sT0FBS2hCLE1BQUwsRUFBYWlCLElBQWIsT0FBc0JSLEVBQUVNLEtBQXhCLEVBQWlDTCxDQUFqQyxDQUFQO0FBQ0QsV0FGRCxNQUVPO0FBQ0wsa0JBQU0sSUFBSVEsS0FBSixDQUFVLG1EQUFWLENBQU47QUFDRDtBQUNGO0FBQ0YsT0FYTSxFQVdKTixJQVhJLENBV0MsVUFBQ08sQ0FBRDtBQUFBLGVBQU9BLEVBQUVDLElBQUYsQ0FBT1gsRUFBRU0sS0FBVCxFQUFnQixDQUFoQixDQUFQO0FBQUEsT0FYRCxDQUFQO0FBWUQ7Ozt5QkFFSU4sQyxFQUFHWSxFLEVBQUk7QUFDVixhQUFPLEtBQUtyQixNQUFMLEVBQWFzQixHQUFiLE9BQXFCYixFQUFFTSxLQUF2QixTQUFnQ00sRUFBaEMsRUFDTlQsSUFETSxDQUNELFVBQUNXLFFBQUQsRUFBYztBQUNsQkMsZ0JBQVFDLEdBQVIsQ0FBWSxnQkFBWjtBQUNBRCxnQkFBUUMsR0FBUixDQUFZQyxLQUFLQyxTQUFMLENBQWVKLFFBQWYsQ0FBWjtBQUNBLGVBQU9BLFNBQVNILElBQVQsQ0FBY1gsRUFBRU0sS0FBaEIsRUFBdUIsQ0FBdkIsQ0FBUDtBQUNELE9BTE0sRUFLSmEsS0FMSSxDQUtFLFVBQUNDLEdBQUQsRUFBUztBQUNoQixZQUFJQSxRQUFRLEdBQVosRUFBaUI7QUFDZixpQkFBTyxJQUFQO0FBQ0QsU0FGRCxNQUVPO0FBQ0wsZ0JBQU1BLEdBQU47QUFDRDtBQUNGLE9BWE0sQ0FBUDs7QUFhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Q7Ozt3QkFFR3BCLEMsRUFBR1ksRSxFQUFJUyxZLEVBQWM7QUFDdkIsYUFBTyxLQUFLOUIsTUFBTCxFQUFhc0IsR0FBYixPQUFxQmIsRUFBRU0sS0FBdkIsU0FBZ0NNLEVBQWhDLFNBQXNDUyxZQUF0QyxFQUNObEIsSUFETSxDQUNELFVBQUNXLFFBQUQ7QUFBQSxlQUFjQSxTQUFTSCxJQUF2QjtBQUFBLE9BREMsQ0FBUDtBQUVEOzs7d0JBRUdYLEMsRUFBR1ksRSxFQUFJUyxZLEVBQWNDLE8sRUFBUztBQUNoQyxhQUFPLEtBQUsvQixNQUFMLEVBQWFnQyxHQUFiLE9BQXFCdkIsRUFBRU0sS0FBdkIsU0FBZ0NNLEVBQWhDLFNBQXNDUyxZQUF0QyxFQUFzREMsT0FBdEQsQ0FBUDtBQUNEOzs7MkJBRU10QixDLEVBQUdZLEUsRUFBSVMsWSxFQUFjQyxPLEVBQVM7QUFDbkMsYUFBTyxLQUFLL0IsTUFBTCxFQUFhaUMsTUFBYixPQUF3QnhCLEVBQUVNLEtBQTFCLFNBQW1DTSxFQUFuQyxTQUF5Q1MsWUFBekMsU0FBeURDLE9BQXpELENBQVA7QUFDRDs7OzRCQUVNdEIsQyxFQUFHWSxFLEVBQUk7QUFDWixhQUFPLEtBQUtyQixNQUFMLEVBQWFpQyxNQUFiLE9BQXdCeEIsRUFBRU0sS0FBMUIsU0FBbUNNLEVBQW5DLEVBQ05ULElBRE0sQ0FDRCxVQUFDVyxRQUFELEVBQWM7QUFDbEIsZUFBT0EsU0FBU0gsSUFBaEI7QUFDRCxPQUhNLENBQVA7QUFJRDs7OzBCQUVLYyxDLEVBQUc7QUFDUCxhQUFPLEtBQUtsQyxNQUFMLEVBQWFzQixHQUFiLE9BQXFCWSxFQUFFQyxJQUF2QixFQUErQixFQUFDQyxRQUFRRixFQUFFRyxLQUFYLEVBQS9CLEVBQ056QixJQURNLENBQ0QsVUFBQ1csUUFBRCxFQUFjO0FBQ2xCLGVBQU9BLFNBQVNILElBQWhCO0FBQ0QsT0FITSxDQUFQO0FBSUQiLCJmaWxlIjoic3RvcmFnZS9yZXN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXhpb3MgZnJvbSAnYXhpb3MnO1xuaW1wb3J0IHtTdG9yYWdlfSBmcm9tICcuL3N0b3JhZ2UnO1xuXG5jb25zdCAkYXhpb3MgPSBTeW1ib2woJyRheGlvcycpO1xuaW1wb3J0IFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuXG5leHBvcnQgY2xhc3MgUmVzdFN0b3JhZ2UgZXh0ZW5kcyBTdG9yYWdlIHtcblxuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBzdXBlcihvcHRzKTtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAge1xuICAgICAgICBiYXNlVVJMOiAnaHR0cDovL2xvY2FsaG9zdC9hcGknLFxuICAgICAgfSxcbiAgICAgIG9wdHNcbiAgICApO1xuICAgIHRoaXNbJGF4aW9zXSA9IG9wdGlvbnMuYXhpb3MgfHwgYXhpb3MuY3JlYXRlKG9wdGlvbnMpO1xuICB9XG5cbiAgb25DYWNoZWFibGVSZWFkKCkge31cblxuICB3cml0ZSh0LCB2KSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKHZbdC4kaWRdKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyRheGlvc10ucGF0Y2goYC8ke3QuJG5hbWV9LyR7dlt0LiRpZF19YCwgdik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy50ZXJtaW5hbCkge1xuICAgICAgICAgIHJldHVybiB0aGlzWyRheGlvc10ucG9zdChgLyR7dC4kbmFtZX1gLCB2KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgbmV3IGNvbnRlbnQgaW4gYSBub24tdGVybWluYWwgc3RvcmUnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLnRoZW4oKGQpID0+IGQuZGF0YVt0LiRuYW1lXVswXSk7XG4gIH1cblxuICByZWFkKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5nZXQoYC8ke3QuJG5hbWV9LyR7aWR9YClcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdBWElPUyBSRVNQT05TRScpO1xuICAgICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UpKTtcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhW3QuJG5hbWVdWzBdO1xuICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGlmIChlcnIgPT09IDQwNCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFRPRE86IGNhY2hlYWJsZSByZWFkXG4gICAgLy8ge1xuICAgIC8vICAgY29uc3QgcmV0VmFsID0ge1xuICAgIC8vICAgICBtYWluOiAsXG4gICAgLy8gICAgIGV4dHJhOiBbXSxcbiAgICAvLyAgIH07XG4gICAgLy8gICBPYmplY3Qua2V5cyhyZXNwb25zZS5kYXRhKS5mb3JFYWNoKCh0eXBlTmFtZSkgPT4ge1xuICAgIC8vICAgICByZXRWYWwuZXh0cmEuY29uY2F0KHJlc3BvbnNlLmRhdGFbdHlwZU5hbWVdLm1hcCgoZCkgPT4ge1xuICAgIC8vICAgICAgIGlmICgoZFt0LiRpZF0gPT09IGlkKSAmJiAodHlwZU5hbWUgPT09IHQuJG5hbWUpKSB7XG4gICAgLy8gICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAvLyAgICAgICB9IGVsc2Uge1xuICAgIC8vICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHt0eXBlTmFtZX0sIGQpO1xuICAgIC8vICAgICAgIH1cbiAgICAvLyAgICAgfSkuZmlsdGVyKCh2KSA9PiB2ICE9PSBudWxsKSk7XG4gICAgLy8gICB9KTtcbiAgICAvLyAgIHJldHVybiByZXRWYWw7XG4gICAgLy8gfSk7XG4gIH1cblxuICBoYXModCwgaWQsIHJlbGF0aW9uc2hpcCkge1xuICAgIHJldHVybiB0aGlzWyRheGlvc10uZ2V0KGAvJHt0LiRuYW1lfS8ke2lkfS8ke3JlbGF0aW9uc2hpcH1gKVxuICAgIC50aGVuKChyZXNwb25zZSkgPT4gcmVzcG9uc2UuZGF0YSk7XG4gIH1cblxuICBhZGQodCwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCkge1xuICAgIHJldHVybiB0aGlzWyRheGlvc10ucHV0KGAvJHt0LiRuYW1lfS8ke2lkfS8ke3JlbGF0aW9uc2hpcH1gLCBjaGlsZElkKTtcbiAgfVxuXG4gIHJlbW92ZSh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKSB7XG4gICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5kZWxldGUoYC8ke3QuJG5hbWV9LyR7aWR9LyR7cmVsYXRpb25zaGlwfS8ke2NoaWxkSWR9YCk7XG4gIH1cblxuICBkZWxldGUodCwgaWQpIHtcbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLmRlbGV0ZShgLyR7dC4kbmFtZX0vJHtpZH1gKVxuICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgfSk7XG4gIH1cblxuICBxdWVyeShxKSB7XG4gICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5nZXQoYC8ke3EudHlwZX1gLCB7cGFyYW1zOiBxLnF1ZXJ5fSlcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgIH0pO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
