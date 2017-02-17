'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MemoryStore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _keyValueStore = require('./keyValueStore');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var $store = Symbol('$store');

var MemoryStore = exports.MemoryStore = function (_KeyValueStore) {
  _inherits(MemoryStore, _KeyValueStore);

  function MemoryStore() {
    var _ref;

    _classCallCheck(this, MemoryStore);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_ref = MemoryStore.__proto__ || Object.getPrototypeOf(MemoryStore)).call.apply(_ref, [this].concat(args)));

    _this[$store] = {};
    return _this;
  }

  _createClass(MemoryStore, [{
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

  return MemoryStore;
}(_keyValueStore.KeyValueStore);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvbWVtb3J5LmpzIl0sIm5hbWVzIjpbIlByb21pc2UiLCIkc3RvcmUiLCJTeW1ib2wiLCJNZW1vcnlTdG9yZSIsImFyZ3MiLCJjb25zb2xlIiwibG9nIiwiSlNPTiIsInN0cmluZ2lmeSIsInR5cGVOYW1lIiwicmVzb2x2ZSIsIk9iamVjdCIsImtleXMiLCJmaWx0ZXIiLCJrIiwiaW5kZXhPZiIsInYiLCJ0aGVuIiwicmV0VmFsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7SUFBWUEsTzs7QUFDWjs7Ozs7Ozs7OztBQUVBLElBQU1DLFNBQVNDLE9BQU8sUUFBUCxDQUFmOztJQUVhQyxXLFdBQUFBLFc7OztBQUVYLHlCQUFxQjtBQUFBOztBQUFBOztBQUFBLHNDQUFOQyxJQUFNO0FBQU5BLFVBQU07QUFBQTs7QUFBQSxxSkFDVkEsSUFEVTs7QUFFbkIsVUFBS0gsTUFBTCxJQUFlLEVBQWY7QUFGbUI7QUFHcEI7Ozs7K0JBRVU7QUFDVEksY0FBUUMsR0FBUixDQUFZQyxLQUFLQyxTQUFMLENBQWUsS0FBS1AsTUFBTCxDQUFmLEVBQTZCLElBQTdCLEVBQW1DLENBQW5DLENBQVo7QUFDRDs7OzBCQUVLUSxRLEVBQVU7QUFDZCxhQUFPVCxRQUFRVSxPQUFSLENBQWdCQyxPQUFPQyxJQUFQLENBQVksS0FBS1gsTUFBTCxDQUFaLEVBQTBCWSxNQUExQixDQUFpQyxVQUFDQyxDQUFEO0FBQUEsZUFBT0EsRUFBRUMsT0FBRixDQUFhTixRQUFiLGtCQUFvQyxDQUEzQztBQUFBLE9BQWpDLENBQWhCLENBQVA7QUFDRDs7O3lCQUVJSyxDLEVBQUc7QUFDTixhQUFPZCxRQUFRVSxPQUFSLENBQWdCLEtBQUtULE1BQUwsRUFBYWEsQ0FBYixLQUFtQixJQUFuQyxDQUFQO0FBQ0Q7Ozt5QkFFSUEsQyxFQUFHRSxDLEVBQUc7QUFBQTs7QUFDVCxhQUFPaEIsUUFBUVUsT0FBUixHQUNOTyxJQURNLENBQ0QsWUFBTTtBQUNWLGVBQUtoQixNQUFMLEVBQWFhLENBQWIsSUFBa0JFLENBQWxCO0FBQ0QsT0FITSxDQUFQO0FBSUQ7Ozt5QkFFSUYsQyxFQUFHO0FBQUE7O0FBQ04sYUFBT2QsUUFBUVUsT0FBUixHQUNOTyxJQURNLENBQ0QsWUFBTTtBQUNWLFlBQU1DLFNBQVMsT0FBS2pCLE1BQUwsRUFBYWEsQ0FBYixDQUFmO0FBQ0EsZUFBTyxPQUFLYixNQUFMLEVBQWFhLENBQWIsQ0FBUDtBQUNBLGVBQU9JLE1BQVA7QUFDRCxPQUxNLENBQVA7QUFNRCIsImZpbGUiOiJzdG9yYWdlL21lbW9yeS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHsgS2V5VmFsdWVTdG9yZSB9IGZyb20gJy4va2V5VmFsdWVTdG9yZSc7XG5cbmNvbnN0ICRzdG9yZSA9IFN5bWJvbCgnJHN0b3JlJyk7XG5cbmV4cG9ydCBjbGFzcyBNZW1vcnlTdG9yZSBleHRlbmRzIEtleVZhbHVlU3RvcmUge1xuXG4gIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICBzdXBlciguLi5hcmdzKTtcbiAgICB0aGlzWyRzdG9yZV0gPSB7fTtcbiAgfVxuXG4gIGxvZ1N0b3JlKCkge1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRoaXNbJHN0b3JlXSwgbnVsbCwgMikpO1xuICB9XG5cbiAgX2tleXModHlwZU5hbWUpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKE9iamVjdC5rZXlzKHRoaXNbJHN0b3JlXSkuZmlsdGVyKChrKSA9PiBrLmluZGV4T2YoYCR7dHlwZU5hbWV9OnN0b3JlOmApID09PSAwKSk7XG4gIH1cblxuICBfZ2V0KGspIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXNbJHN0b3JlXVtrXSB8fCBudWxsKTtcbiAgfVxuXG4gIF9zZXQoaywgdikge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIHRoaXNbJHN0b3JlXVtrXSA9IHY7XG4gICAgfSk7XG4gIH1cblxuICBfZGVsKGspIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCByZXRWYWwgPSB0aGlzWyRzdG9yZV1ba107XG4gICAgICBkZWxldGUgdGhpc1skc3RvcmVdW2tdO1xuICAgICAgcmV0dXJuIHJldFZhbDtcbiAgICB9KTtcbiAgfVxufVxuIl19
