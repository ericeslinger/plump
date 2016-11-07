'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LocalForageStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _localforage = require('localforage');

var localforage = _interopRequireWildcard(_localforage);

var _keyValueStore2 = require('./keyValueStore');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var LocalForageStorage = exports.LocalForageStorage = function (_keyValueStore) {
  _inherits(LocalForageStorage, _keyValueStore);

  function LocalForageStorage() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, LocalForageStorage);

    var _this = _possibleConstructorReturn(this, (LocalForageStorage.__proto__ || Object.getPrototypeOf(LocalForageStorage)).call(this));

    _this.isCache = true;
    localforage.config({
      name: opts.name || 'Trellis Storage',
      storeName: opts.storeName || 'localCache'
    });
    return _this;
  }

  _createClass(LocalForageStorage, [{
    key: '_keys',
    value: function _keys(typeName) {
      return localforage.keys().then(function (keyArray) {
        return keyArray.filter(function (k) {
          return k.indexOf(typeName + ':store:') === 0;
        });
      });
    }
  }, {
    key: '_get',
    value: function _get(k) {
      return localforage.getItem(k);
    }
  }, {
    key: '_set',
    value: function _set(k, v) {
      return localforage.setItem(k, v);
    }
  }, {
    key: '_del',
    value: function _del(k) {
      return localforage.removeItem(k);
    }
  }]);

  return LocalForageStorage;
}(_keyValueStore2.keyValueStore);