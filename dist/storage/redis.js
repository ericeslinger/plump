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
    return _this;
  }

  _createClass(RedisStorage, [{
    key: 'teardown',
    value: function teardown() {
      return this[$redis].quitAsync();
    }
  }, {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvcmVkaXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0lBQVksTzs7QUFDWjs7SUFBWSxLOztBQUNaOzs7Ozs7Ozs7O0FBR0EsSUFBTSxlQUFlLFFBQVEsWUFBUixDQUFxQixLQUFyQixDQUFyQjtBQUNBLElBQU0sU0FBUyxPQUFPLFFBQVAsQ0FBZjs7SUFFYSxZLFdBQUEsWTs7O0FBRVgsMEJBQXVCO0FBQUEsUUFBWCxJQUFXLHlEQUFKLEVBQUk7O0FBQUE7O0FBQUE7O0FBRXJCLFFBQU0sVUFBVSxPQUFPLE1BQVAsQ0FDZCxFQURjLEVBRWQ7QUFDRSxZQUFNLElBRFI7QUFFRSxZQUFNLFdBRlI7QUFHRSxVQUFJLENBSE47QUFJRSxzQkFBZ0Isd0JBQUMsQ0FBRCxFQUFPO0FBQ3JCLFlBQUksRUFBRSxLQUFGLENBQVEsSUFBUixLQUFpQixjQUFyQixFQUFxQztBQUNuQztBQUNBLGlCQUFPLElBQUksS0FBSixDQUFVLG1DQUFWLENBQVA7QUFDRDtBQUNELFlBQUksRUFBRSxnQkFBRixHQUFxQixPQUFPLEVBQVAsR0FBWSxFQUFyQyxFQUF5QztBQUN2QztBQUNBLGlCQUFPLElBQUksS0FBSixDQUFVLHNCQUFWLENBQVA7QUFDRDtBQUNELFlBQUksRUFBRSxlQUFGLEdBQW9CLEVBQXhCLEVBQTRCO0FBQzFCO0FBQ0EsaUJBQU8sU0FBUDtBQUNEO0FBQ0Q7QUFDQSxlQUFPLEtBQUssR0FBTCxDQUFTLEVBQUUsT0FBRixHQUFZLEdBQXJCLEVBQTBCLElBQTFCLENBQVA7QUFDRDtBQW5CSCxLQUZjLEVBdUJkLElBdkJjLENBQWhCO0FBeUJBLFVBQUssTUFBTCxJQUFlLGFBQWEsWUFBYixDQUEwQixPQUExQixDQUFmO0FBQ0EsVUFBSyxPQUFMLEdBQWUsSUFBZjtBQTVCcUI7QUE2QnRCOzs7OytCQUVVO0FBQ1QsYUFBTyxLQUFLLE1BQUwsRUFBYSxTQUFiLEVBQVA7QUFDRDs7OzJCQUVNLEMsRUFBRyxDLEVBQUc7QUFDWCxVQUFJLEVBQUUsRUFBRixLQUFTLFNBQWIsRUFBd0I7QUFDdEIsZUFBTyxRQUFRLE1BQVIsQ0FBZSx3Q0FBZixDQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBTyxLQUFLLE1BQUwsRUFBYSxRQUFiLENBQXlCLENBQXpCLFNBQThCLEVBQUUsRUFBaEMsRUFBc0MsS0FBSyxTQUFMLENBQWUsQ0FBZixDQUF0QyxDQUFQO0FBQ0Q7QUFDRjs7O3lCQUVJLEMsRUFBRyxFLEVBQUk7QUFDVixhQUFPLEtBQUssTUFBTCxFQUFhLFFBQWIsQ0FBeUIsQ0FBekIsU0FBOEIsRUFBOUIsRUFDTixJQURNLENBQ0QsVUFBQyxDQUFEO0FBQUEsZUFBTyxLQUFLLEtBQUwsQ0FBVyxDQUFYLENBQVA7QUFBQSxPQURDLENBQVA7QUFFRDs7OzJCQUVNLEMsRUFBRyxFLEVBQUksQyxFQUFHO0FBQ2YsYUFBTyxLQUFLLE1BQUwsQ0FBWSxDQUFaLEVBQWUsQ0FBZixDQUFQO0FBQ0Q7Ozs0QkFFTSxDLEVBQUcsRSxFQUFJO0FBQ1osYUFBTyxLQUFLLE1BQUwsRUFBYSxRQUFiLENBQXlCLENBQXpCLFNBQThCLEVBQTlCLENBQVA7QUFDRDs7OzBCQUVLLEMsRUFBRztBQUNQLGFBQU8sS0FBSyxNQUFMLEVBQWEsU0FBYixDQUEwQixFQUFFLElBQTVCLFNBQW9DLEVBQUUsS0FBdEMsQ0FBUDtBQUNEIiwiZmlsZSI6InN0b3JhZ2UvcmVkaXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCAqIGFzIFJlZGlzIGZyb20gJ3JlZGlzJztcbmltcG9ydCB7U3RvcmFnZX0gZnJvbSAnLi9zdG9yYWdlJztcblxuXG5jb25zdCBSZWRpc1NlcnZpY2UgPSBQcm9taXNlLnByb21pc2lmeUFsbChSZWRpcyk7XG5jb25zdCAkcmVkaXMgPSBTeW1ib2woJyRyZWRpcycpO1xuXG5leHBvcnQgY2xhc3MgUmVkaXNTdG9yYWdlIGV4dGVuZHMgU3RvcmFnZSB7XG5cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgc3VwZXIoKTtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAge1xuICAgICAgICBwb3J0OiA2Mzc5LFxuICAgICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgICAgZGI6IDAsXG4gICAgICAgIHJldHJ5X3N0cmF0ZWd5OiAobykgPT4ge1xuICAgICAgICAgIGlmIChvLmVycm9yLmNvZGUgPT09ICdFQ09OTlJFRlVTRUQnKSB7XG4gICAgICAgICAgICAvLyBFbmQgcmVjb25uZWN0aW5nIG9uIGEgc3BlY2lmaWMgZXJyb3IgYW5kIGZsdXNoIGFsbCBjb21tYW5kcyB3aXRoIGEgaW5kaXZpZHVhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBFcnJvcignVGhlIHNlcnZlciByZWZ1c2VkIHRoZSBjb25uZWN0aW9uJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChvLnRvdGFsX3JldHJ5X3RpbWUgPiAxMDAwICogNjAgKiA2MCkge1xuICAgICAgICAgICAgLy8gRW5kIHJlY29ubmVjdGluZyBhZnRlciBhIHNwZWNpZmljIHRpbWVvdXQgYW5kIGZsdXNoIGFsbCBjb21tYW5kcyB3aXRoIGEgaW5kaXZpZHVhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBFcnJvcignUmV0cnkgdGltZSBleGhhdXN0ZWQnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG8udGltZXNfY29ubmVjdGVkID4gMTApIHtcbiAgICAgICAgICAgIC8vIEVuZCByZWNvbm5lY3Rpbmcgd2l0aCBidWlsdCBpbiBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gcmVjb25uZWN0IGFmdGVyXG4gICAgICAgICAgcmV0dXJuIE1hdGgubWF4KG8uYXR0ZW1wdCAqIDEwMCwgMzAwMCk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgb3B0c1xuICAgICk7XG4gICAgdGhpc1skcmVkaXNdID0gUmVkaXNTZXJ2aWNlLmNyZWF0ZUNsaWVudChvcHRpb25zKTtcbiAgICB0aGlzLmlzQ2FjaGUgPSB0cnVlO1xuICB9XG5cbiAgdGVhcmRvd24oKSB7XG4gICAgcmV0dXJuIHRoaXNbJHJlZGlzXS5xdWl0QXN5bmMoKTtcbiAgfVxuXG4gIGNyZWF0ZSh0LCB2KSB7XG4gICAgaWYgKHYuaWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCdUaGlzIHNlcnZpY2UgY2Fubm90IGFsbG9jYXRlIElEIHZhbHVlcycpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpc1skcmVkaXNdLnNldEFzeW5jKGAke3R9OiR7di5pZH1gLCBKU09OLnN0cmluZ2lmeSh2KSk7XG4gICAgfVxuICB9XG5cbiAgcmVhZCh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzWyRyZWRpc10uZ2V0QXN5bmMoYCR7dH06JHtpZH1gKVxuICAgIC50aGVuKChkKSA9PiBKU09OLnBhcnNlKGQpKTtcbiAgfVxuXG4gIHVwZGF0ZSh0LCBpZCwgdikge1xuICAgIHJldHVybiB0aGlzLmNyZWF0ZSh0LCB2KTtcbiAgfVxuXG4gIGRlbGV0ZSh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzWyRyZWRpc10uZGVsQXN5bmMoYCR7dH06JHtpZH1gKTtcbiAgfVxuXG4gIHF1ZXJ5KHEpIHtcbiAgICByZXR1cm4gdGhpc1skcmVkaXNdLmtleXNBc3luYyhgJHtxLnR5cGV9OiR7cS5xdWVyeX1gKTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
