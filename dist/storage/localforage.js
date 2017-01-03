'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LocalForageStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _localforage = require('localforage');

var _localforage2 = _interopRequireDefault(_localforage);

var _keyValueStore = require('./keyValueStore');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var LocalForageStorage = exports.LocalForageStorage = function (_KeyValueStore) {
  _inherits(LocalForageStorage, _KeyValueStore);

  function LocalForageStorage() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, LocalForageStorage);

    var _this = _possibleConstructorReturn(this, (LocalForageStorage.__proto__ || Object.getPrototypeOf(LocalForageStorage)).call(this));

    _this.isCache = true;
    _localforage2.default.config({
      name: opts.name || 'Trellis Storage',
      storeName: opts.storeName || 'localCache'
    });
    return _this;
  }

  _createClass(LocalForageStorage, [{
    key: '_keys',
    value: function _keys(typeName) {
      return _localforage2.default.keys().then(function (keyArray) {
        return keyArray.filter(function (k) {
          return k.indexOf(typeName + ':store:') === 0;
        });
      });
    }
  }, {
    key: '_get',
    value: function _get(k) {
      return _localforage2.default.getItem(k);
    }
  }, {
    key: '_set',
    value: function _set(k, v) {
      return _localforage2.default.setItem(k, v);
    }
  }, {
    key: '_del',
    value: function _del(k) {
      return _localforage2.default.removeItem(k);
    }
  }]);

  return LocalForageStorage;
}(_keyValueStore.KeyValueStore);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvbG9jYWxmb3JhZ2UuanMiXSwibmFtZXMiOlsiTG9jYWxGb3JhZ2VTdG9yYWdlIiwib3B0cyIsImlzQ2FjaGUiLCJjb25maWciLCJuYW1lIiwic3RvcmVOYW1lIiwidHlwZU5hbWUiLCJrZXlzIiwidGhlbiIsImtleUFycmF5IiwiZmlsdGVyIiwiayIsImluZGV4T2YiLCJnZXRJdGVtIiwidiIsInNldEl0ZW0iLCJyZW1vdmVJdGVtIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7Ozs7Ozs7O0lBRWFBLGtCLFdBQUFBLGtCOzs7QUFFWCxnQ0FBdUI7QUFBQSxRQUFYQyxJQUFXLHVFQUFKLEVBQUk7O0FBQUE7O0FBQUE7O0FBRXJCLFVBQUtDLE9BQUwsR0FBZSxJQUFmO0FBQ0EsMEJBQVlDLE1BQVosQ0FBbUI7QUFDakJDLFlBQU1ILEtBQUtHLElBQUwsSUFBYSxpQkFERjtBQUVqQkMsaUJBQVdKLEtBQUtJLFNBQUwsSUFBa0I7QUFGWixLQUFuQjtBQUhxQjtBQU90Qjs7OzswQkFFS0MsUSxFQUFVO0FBQ2QsYUFBTyxzQkFBWUMsSUFBWixHQUNOQyxJQURNLENBQ0QsVUFBQ0MsUUFBRDtBQUFBLGVBQWNBLFNBQVNDLE1BQVQsQ0FBZ0IsVUFBQ0MsQ0FBRDtBQUFBLGlCQUFPQSxFQUFFQyxPQUFGLENBQWFOLFFBQWIsa0JBQW9DLENBQTNDO0FBQUEsU0FBaEIsQ0FBZDtBQUFBLE9BREMsQ0FBUDtBQUVEOzs7eUJBRUlLLEMsRUFBRztBQUNOLGFBQU8sc0JBQVlFLE9BQVosQ0FBb0JGLENBQXBCLENBQVA7QUFDRDs7O3lCQUVJQSxDLEVBQUdHLEMsRUFBRztBQUNULGFBQU8sc0JBQVlDLE9BQVosQ0FBb0JKLENBQXBCLEVBQXVCRyxDQUF2QixDQUFQO0FBQ0Q7Ozt5QkFFSUgsQyxFQUFHO0FBQ04sYUFBTyxzQkFBWUssVUFBWixDQUF1QkwsQ0FBdkIsQ0FBUDtBQUNEIiwiZmlsZSI6InN0b3JhZ2UvbG9jYWxmb3JhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbG9jYWxmb3JhZ2UgZnJvbSAnbG9jYWxmb3JhZ2UnO1xuaW1wb3J0IHsgS2V5VmFsdWVTdG9yZSB9IGZyb20gJy4va2V5VmFsdWVTdG9yZSc7XG5cbmV4cG9ydCBjbGFzcyBMb2NhbEZvcmFnZVN0b3JhZ2UgZXh0ZW5kcyBLZXlWYWx1ZVN0b3JlIHtcblxuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuaXNDYWNoZSA9IHRydWU7XG4gICAgbG9jYWxmb3JhZ2UuY29uZmlnKHtcbiAgICAgIG5hbWU6IG9wdHMubmFtZSB8fCAnVHJlbGxpcyBTdG9yYWdlJyxcbiAgICAgIHN0b3JlTmFtZTogb3B0cy5zdG9yZU5hbWUgfHwgJ2xvY2FsQ2FjaGUnLFxuICAgIH0pO1xuICB9XG5cbiAgX2tleXModHlwZU5hbWUpIHtcbiAgICByZXR1cm4gbG9jYWxmb3JhZ2Uua2V5cygpXG4gICAgLnRoZW4oKGtleUFycmF5KSA9PiBrZXlBcnJheS5maWx0ZXIoKGspID0+IGsuaW5kZXhPZihgJHt0eXBlTmFtZX06c3RvcmU6YCkgPT09IDApKTtcbiAgfVxuXG4gIF9nZXQoaykge1xuICAgIHJldHVybiBsb2NhbGZvcmFnZS5nZXRJdGVtKGspO1xuICB9XG5cbiAgX3NldChrLCB2KSB7XG4gICAgcmV0dXJuIGxvY2FsZm9yYWdlLnNldEl0ZW0oaywgdik7XG4gIH1cblxuICBfZGVsKGspIHtcbiAgICByZXR1cm4gbG9jYWxmb3JhZ2UucmVtb3ZlSXRlbShrKTtcbiAgfVxufVxuIl19
