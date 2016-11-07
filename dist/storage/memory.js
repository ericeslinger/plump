'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MemoryStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _keyValueStore = require('./keyValueStore');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var $store = Symbol('$store');

var MemoryStorage = exports.MemoryStorage = function (_KeyValueStore) {
  _inherits(MemoryStorage, _KeyValueStore);

  function MemoryStorage() {
    var _ref;

    _classCallCheck(this, MemoryStorage);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_ref = MemoryStorage.__proto__ || Object.getPrototypeOf(MemoryStorage)).call.apply(_ref, [this].concat(args)));

    _this[$store] = {};
    return _this;
  }

  _createClass(MemoryStorage, [{
    key: 'logStore',
    value: function logStore() {
      console.log(JSON.stringify(this[$store], null, 2));
    }
  }, {
    key: '_keys',
    value: function _keys(typeName) {
      return Promise.resolve(Object.keys(this[$store]).filter(function (k) {
        return k.indexOf(typeName + ':store:') === 0;
      }));
    }
  }, {
    key: '_get',
    value: function _get(k) {
      return Promise.resolve(this[$store][k] || null);
    }
  }, {
    key: '_set',
    value: function _set(k, v) {
      var _this2 = this;

      return Promise.resolve().then(function () {
        _this2[$store][k] = v;
      });
    }
  }, {
    key: '_del',
    value: function _del(k) {
      var _this3 = this;

      return Promise.resolve().then(function () {
        var retVal = _this3[$store][k];
        delete _this3[$store][k];
        return retVal;
      });
    }
  }]);

  return MemoryStorage;
}(_keyValueStore.KeyValueStore);