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
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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