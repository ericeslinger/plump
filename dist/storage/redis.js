'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RedisStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _redis = require('redis');

var Redis = _interopRequireWildcard(_redis);

var _keyValueStore = require('./keyValueStore');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var RedisService = Promise.promisifyAll(Redis);
var $redis = Symbol('$redis');

var RedisStorage = exports.RedisStorage = function (_KeyValueStore) {
  _inherits(RedisStorage, _KeyValueStore);

  function RedisStorage() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, RedisStorage);

    var _this = _possibleConstructorReturn(this, (RedisStorage.__proto__ || Object.getPrototypeOf(RedisStorage)).call(this, opts));

    var options = Object.assign({}, {
      port: 6379,
      host: 'localhost',
      db: 0,
      retry_strategy: function retry_strategy(o) {
        if (o.error.code === 'ECONNREFUSED') {
          // End reconnecting on a specific error and flush all commands with a individual error
          return new Error('The server refused the connection');
        }
        if (o.total_retry_time > 1000 * 60 * 60) {
          // End reconnecting after a specific timeout and flush all commands with a individual error
          return new Error('Retry time exhausted');
        }
        if (o.times_connected > 10) {
          // End reconnecting with built in error
          return undefined;
        }
        // reconnect after
        return Math.max(o.attempt * 100, 3000);
      }
    }, opts);
    _this[$redis] = RedisService.createClient(options);
    _this.isCache = true;
    return _this;
  }

  _createClass(RedisStorage, [{
    key: 'teardown',
    value: function teardown() {
      return this[$redis].quitAsync();
    }
  }, {
    key: '_keys',
    value: function _keys(typeName) {
      return this[$redis].keysAsync(typeName + ':store:*');
    }
  }, {
    key: '_get',
    value: function _get(k) {
      return this[$redis].getAsync(k);
    }
  }, {
    key: '_set',
    value: function _set(k, v) {
      return this[$redis].setAsync(k, v);
    }
  }, {
    key: '_del',
    value: function _del(k) {
      return this[$redis].delAsync(k);
    }
  }]);

  return RedisStorage;
}(_keyValueStore.KeyValueStore);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvcmVkaXMuanMiXSwibmFtZXMiOlsiUHJvbWlzZSIsIlJlZGlzIiwiUmVkaXNTZXJ2aWNlIiwicHJvbWlzaWZ5QWxsIiwiJHJlZGlzIiwiU3ltYm9sIiwiUmVkaXNTdG9yYWdlIiwib3B0cyIsIm9wdGlvbnMiLCJPYmplY3QiLCJhc3NpZ24iLCJwb3J0IiwiaG9zdCIsImRiIiwicmV0cnlfc3RyYXRlZ3kiLCJvIiwiZXJyb3IiLCJjb2RlIiwiRXJyb3IiLCJ0b3RhbF9yZXRyeV90aW1lIiwidGltZXNfY29ubmVjdGVkIiwidW5kZWZpbmVkIiwiTWF0aCIsIm1heCIsImF0dGVtcHQiLCJjcmVhdGVDbGllbnQiLCJpc0NhY2hlIiwicXVpdEFzeW5jIiwidHlwZU5hbWUiLCJrZXlzQXN5bmMiLCJrIiwiZ2V0QXN5bmMiLCJ2Iiwic2V0QXN5bmMiLCJkZWxBc3luYyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0lBQVlBLE87O0FBQ1o7O0lBQVlDLEs7O0FBQ1o7Ozs7Ozs7Ozs7QUFHQSxJQUFNQyxlQUFlRixRQUFRRyxZQUFSLENBQXFCRixLQUFyQixDQUFyQjtBQUNBLElBQU1HLFNBQVNDLE9BQU8sUUFBUCxDQUFmOztJQUVhQyxZLFdBQUFBLFk7OztBQUVYLDBCQUF1QjtBQUFBLFFBQVhDLElBQVcsdUVBQUosRUFBSTs7QUFBQTs7QUFBQSw0SEFDZkEsSUFEZTs7QUFFckIsUUFBTUMsVUFBVUMsT0FBT0MsTUFBUCxDQUNkLEVBRGMsRUFFZDtBQUNFQyxZQUFNLElBRFI7QUFFRUMsWUFBTSxXQUZSO0FBR0VDLFVBQUksQ0FITjtBQUlFQyxzQkFBZ0Isd0JBQUNDLENBQUQsRUFBTztBQUNyQixZQUFJQSxFQUFFQyxLQUFGLENBQVFDLElBQVIsS0FBaUIsY0FBckIsRUFBcUM7QUFDbkM7QUFDQSxpQkFBTyxJQUFJQyxLQUFKLENBQVUsbUNBQVYsQ0FBUDtBQUNEO0FBQ0QsWUFBSUgsRUFBRUksZ0JBQUYsR0FBcUIsT0FBTyxFQUFQLEdBQVksRUFBckMsRUFBeUM7QUFDdkM7QUFDQSxpQkFBTyxJQUFJRCxLQUFKLENBQVUsc0JBQVYsQ0FBUDtBQUNEO0FBQ0QsWUFBSUgsRUFBRUssZUFBRixHQUFvQixFQUF4QixFQUE0QjtBQUMxQjtBQUNBLGlCQUFPQyxTQUFQO0FBQ0Q7QUFDRDtBQUNBLGVBQU9DLEtBQUtDLEdBQUwsQ0FBU1IsRUFBRVMsT0FBRixHQUFZLEdBQXJCLEVBQTBCLElBQTFCLENBQVA7QUFDRDtBQW5CSCxLQUZjLEVBdUJkakIsSUF2QmMsQ0FBaEI7QUF5QkEsVUFBS0gsTUFBTCxJQUFlRixhQUFhdUIsWUFBYixDQUEwQmpCLE9BQTFCLENBQWY7QUFDQSxVQUFLa0IsT0FBTCxHQUFlLElBQWY7QUE1QnFCO0FBNkJ0Qjs7OzsrQkFFVTtBQUNULGFBQU8sS0FBS3RCLE1BQUwsRUFBYXVCLFNBQWIsRUFBUDtBQUNEOzs7MEJBRUtDLFEsRUFBVTtBQUNkLGFBQU8sS0FBS3hCLE1BQUwsRUFBYXlCLFNBQWIsQ0FBMEJELFFBQTFCLGNBQVA7QUFDRDs7O3lCQUVJRSxDLEVBQUc7QUFDTixhQUFPLEtBQUsxQixNQUFMLEVBQWEyQixRQUFiLENBQXNCRCxDQUF0QixDQUFQO0FBQ0Q7Ozt5QkFFSUEsQyxFQUFHRSxDLEVBQUc7QUFDVCxhQUFPLEtBQUs1QixNQUFMLEVBQWE2QixRQUFiLENBQXNCSCxDQUF0QixFQUF5QkUsQ0FBekIsQ0FBUDtBQUNEOzs7eUJBRUlGLEMsRUFBRztBQUNOLGFBQU8sS0FBSzFCLE1BQUwsRUFBYThCLFFBQWIsQ0FBc0JKLENBQXRCLENBQVA7QUFDRCIsImZpbGUiOiJzdG9yYWdlL3JlZGlzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgKiBhcyBSZWRpcyBmcm9tICdyZWRpcyc7XG5pbXBvcnQgeyBLZXlWYWx1ZVN0b3JlIH0gZnJvbSAnLi9rZXlWYWx1ZVN0b3JlJztcblxuXG5jb25zdCBSZWRpc1NlcnZpY2UgPSBQcm9taXNlLnByb21pc2lmeUFsbChSZWRpcyk7XG5jb25zdCAkcmVkaXMgPSBTeW1ib2woJyRyZWRpcycpO1xuXG5leHBvcnQgY2xhc3MgUmVkaXNTdG9yYWdlIGV4dGVuZHMgS2V5VmFsdWVTdG9yZSB7XG5cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgc3VwZXIob3B0cyk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHtcbiAgICAgICAgcG9ydDogNjM3OSxcbiAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgICAgIGRiOiAwLFxuICAgICAgICByZXRyeV9zdHJhdGVneTogKG8pID0+IHtcbiAgICAgICAgICBpZiAoby5lcnJvci5jb2RlID09PSAnRUNPTk5SRUZVU0VEJykge1xuICAgICAgICAgICAgLy8gRW5kIHJlY29ubmVjdGluZyBvbiBhIHNwZWNpZmljIGVycm9yIGFuZCBmbHVzaCBhbGwgY29tbWFuZHMgd2l0aCBhIGluZGl2aWR1YWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXJyb3IoJ1RoZSBzZXJ2ZXIgcmVmdXNlZCB0aGUgY29ubmVjdGlvbicpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoby50b3RhbF9yZXRyeV90aW1lID4gMTAwMCAqIDYwICogNjApIHtcbiAgICAgICAgICAgIC8vIEVuZCByZWNvbm5lY3RpbmcgYWZ0ZXIgYSBzcGVjaWZpYyB0aW1lb3V0IGFuZCBmbHVzaCBhbGwgY29tbWFuZHMgd2l0aCBhIGluZGl2aWR1YWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXJyb3IoJ1JldHJ5IHRpbWUgZXhoYXVzdGVkJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChvLnRpbWVzX2Nvbm5lY3RlZCA+IDEwKSB7XG4gICAgICAgICAgICAvLyBFbmQgcmVjb25uZWN0aW5nIHdpdGggYnVpbHQgaW4gZXJyb3JcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHJlY29ubmVjdCBhZnRlclxuICAgICAgICAgIHJldHVybiBNYXRoLm1heChvLmF0dGVtcHQgKiAxMDAsIDMwMDApO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIG9wdHNcbiAgICApO1xuICAgIHRoaXNbJHJlZGlzXSA9IFJlZGlzU2VydmljZS5jcmVhdGVDbGllbnQob3B0aW9ucyk7XG4gICAgdGhpcy5pc0NhY2hlID0gdHJ1ZTtcbiAgfVxuXG4gIHRlYXJkb3duKCkge1xuICAgIHJldHVybiB0aGlzWyRyZWRpc10ucXVpdEFzeW5jKCk7XG4gIH1cblxuICBfa2V5cyh0eXBlTmFtZSkge1xuICAgIHJldHVybiB0aGlzWyRyZWRpc10ua2V5c0FzeW5jKGAke3R5cGVOYW1lfTpzdG9yZToqYCk7XG4gIH1cblxuICBfZ2V0KGspIHtcbiAgICByZXR1cm4gdGhpc1skcmVkaXNdLmdldEFzeW5jKGspO1xuICB9XG5cbiAgX3NldChrLCB2KSB7XG4gICAgcmV0dXJuIHRoaXNbJHJlZGlzXS5zZXRBc3luYyhrLCB2KTtcbiAgfVxuXG4gIF9kZWwoaykge1xuICAgIHJldHVybiB0aGlzWyRyZWRpc10uZGVsQXN5bmMoayk7XG4gIH1cbn1cbiJdfQ==
