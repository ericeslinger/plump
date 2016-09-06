'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RedisStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _localforage = require('localforage');

var localforage = _interopRequireWildcard(_localforage);

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _redis = require('redis');

var Redis = _interopRequireWildcard(_redis);

var _storage = require('./storage');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var RedisService = Promise.promisifyAll(Redis);
var $redis = Symbol('$redis');

var RedisStorage = exports.RedisStorage = function (_Storage) {
  _inherits(RedisStorage, _Storage);

  function RedisStorage() {
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, RedisStorage);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(RedisStorage).call(this));

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
    localforage.config({
      name: opts.name || 'Trellis Storage',
      storeName: opts.storeName || 'localCache'
    });
    return _this;
  }

  _createClass(RedisStorage, [{
    key: 'create',
    value: function create(t, v) {
      if (v.id === undefined) {
        return Promise.reject('This service cannot allocate ID values');
      } else {
        return this[$redis].setAsync(t + ':' + v.id, JSON.stringify(v));
      }
    }
  }, {
    key: 'read',
    value: function read(t, id) {
      return this[$redis].getAsync(t + ':' + id).then(function (d) {
        return JSON.parse(d);
      });
    }
  }, {
    key: 'update',
    value: function update(t, id, v) {
      return this.create(t, v);
    }
  }, {
    key: 'delete',
    value: function _delete(t, id) {
      return this[$redis].delAsync(t + ':' + id);
    }
  }, {
    key: 'query',
    value: function query(q) {
      return this[$redis].keysAsync(q.type + ':' + q.query);
    }
  }]);

  return RedisStorage;
}(_storage.Storage);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvcmVkaXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0lBQVksVzs7QUFDWjs7SUFBWSxPOztBQUNaOztJQUFZLEs7O0FBQ1o7Ozs7Ozs7Ozs7QUFHQSxJQUFNLGVBQWUsUUFBUSxZQUFSLENBQXFCLEtBQXJCLENBQXJCO0FBQ0EsSUFBTSxTQUFTLE9BQU8sUUFBUCxDQUFmOztJQUVhLFksV0FBQSxZOzs7QUFFWCwwQkFBdUI7QUFBQSxRQUFYLElBQVcseURBQUosRUFBSTs7QUFBQTs7QUFBQTs7QUFFckIsUUFBTSxVQUFVLE9BQU8sTUFBUCxDQUNkLEVBRGMsRUFFZDtBQUNFLFlBQU0sSUFEUjtBQUVFLFlBQU0sV0FGUjtBQUdFLFVBQUksQ0FITjtBQUlFLHNCQUFnQix3QkFBQyxDQUFELEVBQU87QUFDckIsWUFBSSxFQUFFLEtBQUYsQ0FBUSxJQUFSLEtBQWlCLGNBQXJCLEVBQXFDO0FBQ25DO0FBQ0EsaUJBQU8sSUFBSSxLQUFKLENBQVUsbUNBQVYsQ0FBUDtBQUNEO0FBQ0QsWUFBSSxFQUFFLGdCQUFGLEdBQXFCLE9BQU8sRUFBUCxHQUFZLEVBQXJDLEVBQXlDO0FBQ3ZDO0FBQ0EsaUJBQU8sSUFBSSxLQUFKLENBQVUsc0JBQVYsQ0FBUDtBQUNEO0FBQ0QsWUFBSSxFQUFFLGVBQUYsR0FBb0IsRUFBeEIsRUFBNEI7QUFDMUI7QUFDQSxpQkFBTyxTQUFQO0FBQ0Q7QUFDRDtBQUNBLGVBQU8sS0FBSyxHQUFMLENBQVMsRUFBRSxPQUFGLEdBQVksR0FBckIsRUFBMEIsSUFBMUIsQ0FBUDtBQUNEO0FBbkJILEtBRmMsRUF1QmQsSUF2QmMsQ0FBaEI7QUF5QkEsVUFBSyxNQUFMLElBQWUsYUFBYSxZQUFiLENBQTBCLE9BQTFCLENBQWY7QUFDQSxVQUFLLE9BQUwsR0FBZSxJQUFmO0FBQ0EsZ0JBQVksTUFBWixDQUFtQjtBQUNqQixZQUFNLEtBQUssSUFBTCxJQUFhLGlCQURGO0FBRWpCLGlCQUFXLEtBQUssU0FBTCxJQUFrQjtBQUZaLEtBQW5CO0FBN0JxQjtBQWlDdEI7Ozs7MkJBRU0sQyxFQUFHLEMsRUFBRztBQUNYLFVBQUksRUFBRSxFQUFGLEtBQVMsU0FBYixFQUF3QjtBQUN0QixlQUFPLFFBQVEsTUFBUixDQUFlLHdDQUFmLENBQVA7QUFDRCxPQUZELE1BRU87QUFDTCxlQUFPLEtBQUssTUFBTCxFQUFhLFFBQWIsQ0FBeUIsQ0FBekIsU0FBOEIsRUFBRSxFQUFoQyxFQUFzQyxLQUFLLFNBQUwsQ0FBZSxDQUFmLENBQXRDLENBQVA7QUFDRDtBQUNGOzs7eUJBRUksQyxFQUFHLEUsRUFBSTtBQUNWLGFBQU8sS0FBSyxNQUFMLEVBQWEsUUFBYixDQUF5QixDQUF6QixTQUE4QixFQUE5QixFQUNOLElBRE0sQ0FDRCxVQUFDLENBQUQ7QUFBQSxlQUFPLEtBQUssS0FBTCxDQUFXLENBQVgsQ0FBUDtBQUFBLE9BREMsQ0FBUDtBQUVEOzs7MkJBRU0sQyxFQUFHLEUsRUFBSSxDLEVBQUc7QUFDZixhQUFPLEtBQUssTUFBTCxDQUFZLENBQVosRUFBZSxDQUFmLENBQVA7QUFDRDs7OzRCQUVNLEMsRUFBRyxFLEVBQUk7QUFDWixhQUFPLEtBQUssTUFBTCxFQUFhLFFBQWIsQ0FBeUIsQ0FBekIsU0FBOEIsRUFBOUIsQ0FBUDtBQUNEOzs7MEJBRUssQyxFQUFHO0FBQ1AsYUFBTyxLQUFLLE1BQUwsRUFBYSxTQUFiLENBQTBCLEVBQUUsSUFBNUIsU0FBb0MsRUFBRSxLQUF0QyxDQUFQO0FBQ0QiLCJmaWxlIjoic3RvcmFnZS9yZWRpcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGxvY2FsZm9yYWdlIGZyb20gJ2xvY2FsZm9yYWdlJztcbmltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0ICogYXMgUmVkaXMgZnJvbSAncmVkaXMnO1xuaW1wb3J0IHtTdG9yYWdlfSBmcm9tICcuL3N0b3JhZ2UnO1xuXG5cbmNvbnN0IFJlZGlzU2VydmljZSA9IFByb21pc2UucHJvbWlzaWZ5QWxsKFJlZGlzKTtcbmNvbnN0ICRyZWRpcyA9IFN5bWJvbCgnJHJlZGlzJyk7XG5cbmV4cG9ydCBjbGFzcyBSZWRpc1N0b3JhZ2UgZXh0ZW5kcyBTdG9yYWdlIHtcblxuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBzdXBlcigpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIHBvcnQ6IDYzNzksXG4gICAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgICBkYjogMCxcbiAgICAgICAgcmV0cnlfc3RyYXRlZ3k6IChvKSA9PiB7XG4gICAgICAgICAgaWYgKG8uZXJyb3IuY29kZSA9PT0gJ0VDT05OUkVGVVNFRCcpIHtcbiAgICAgICAgICAgIC8vIEVuZCByZWNvbm5lY3Rpbmcgb24gYSBzcGVjaWZpYyBlcnJvciBhbmQgZmx1c2ggYWxsIGNvbW1hbmRzIHdpdGggYSBpbmRpdmlkdWFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gbmV3IEVycm9yKCdUaGUgc2VydmVyIHJlZnVzZWQgdGhlIGNvbm5lY3Rpb24nKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG8udG90YWxfcmV0cnlfdGltZSA+IDEwMDAgKiA2MCAqIDYwKSB7XG4gICAgICAgICAgICAvLyBFbmQgcmVjb25uZWN0aW5nIGFmdGVyIGEgc3BlY2lmaWMgdGltZW91dCBhbmQgZmx1c2ggYWxsIGNvbW1hbmRzIHdpdGggYSBpbmRpdmlkdWFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gbmV3IEVycm9yKCdSZXRyeSB0aW1lIGV4aGF1c3RlZCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoby50aW1lc19jb25uZWN0ZWQgPiAxMCkge1xuICAgICAgICAgICAgLy8gRW5kIHJlY29ubmVjdGluZyB3aXRoIGJ1aWx0IGluIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyByZWNvbm5lY3QgYWZ0ZXJcbiAgICAgICAgICByZXR1cm4gTWF0aC5tYXgoby5hdHRlbXB0ICogMTAwLCAzMDAwKTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBvcHRzXG4gICAgKTtcbiAgICB0aGlzWyRyZWRpc10gPSBSZWRpc1NlcnZpY2UuY3JlYXRlQ2xpZW50KG9wdGlvbnMpO1xuICAgIHRoaXMuaXNDYWNoZSA9IHRydWU7XG4gICAgbG9jYWxmb3JhZ2UuY29uZmlnKHtcbiAgICAgIG5hbWU6IG9wdHMubmFtZSB8fCAnVHJlbGxpcyBTdG9yYWdlJyxcbiAgICAgIHN0b3JlTmFtZTogb3B0cy5zdG9yZU5hbWUgfHwgJ2xvY2FsQ2FjaGUnLFxuICAgIH0pO1xuICB9XG5cbiAgY3JlYXRlKHQsIHYpIHtcbiAgICBpZiAodi5pZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ1RoaXMgc2VydmljZSBjYW5ub3QgYWxsb2NhdGUgSUQgdmFsdWVzJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzWyRyZWRpc10uc2V0QXN5bmMoYCR7dH06JHt2LmlkfWAsIEpTT04uc3RyaW5naWZ5KHYpKTtcbiAgICB9XG4gIH1cblxuICByZWFkKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXNbJHJlZGlzXS5nZXRBc3luYyhgJHt0fToke2lkfWApXG4gICAgLnRoZW4oKGQpID0+IEpTT04ucGFyc2UoZCkpO1xuICB9XG5cbiAgdXBkYXRlKHQsIGlkLCB2KSB7XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlKHQsIHYpO1xuICB9XG5cbiAgZGVsZXRlKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXNbJHJlZGlzXS5kZWxBc3luYyhgJHt0fToke2lkfWApO1xuICB9XG5cbiAgcXVlcnkocSkge1xuICAgIHJldHVybiB0aGlzWyRyZWRpc10ua2V5c0FzeW5jKGAke3EudHlwZX06JHtxLnF1ZXJ5fWApO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
