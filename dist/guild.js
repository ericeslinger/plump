'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Guild = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Rx = require('rxjs/Rx');

var _Rx2 = _interopRequireDefault(_Rx);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $types = Symbol('$types');
var $storage = Symbol('$storage');
var $terminal = Symbol('$terminal');
var $subscriptions = Symbol('$subscriptions');

var Guild = exports.Guild = function () {
  function Guild() {
    var _this = this;

    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Guild);

    var options = Object.assign({}, {
      storage: [],
      types: []
    }, opts);
    this[$subscriptions] = {};
    this[$storage] = [];
    this[$types] = {};
    options.storage.forEach(function (s) {
      return _this.addStore(s);
    });
    options.types.forEach(function (t) {
      return _this.addType(t);
    });
  }

  _createClass(Guild, [{
    key: 'addType',
    value: function addType(T) {
      if (this[$types][T.$name] === undefined) {
        this[$types][T.$name] = T;
      } else {
        throw new Error('Duplicate Type registered: ' + T.$name);
      }
    }
  }, {
    key: 'addStore',
    value: function addStore(store) {
      var _this2 = this;

      if (store.terminal) {
        if (this[$terminal] === undefined) {
          this[$terminal] = store;
        } else {
          throw new Error('cannot have more than one terminal store');
        }
      } else {
        this[$storage].push(store);
      }
      store.onUpdate(function (u) {
        _this2[$storage].forEach(function (storage) {
          var Type = _this2[$types][u.type];
          storage.onCacheableRead(Type, Object.assign({}, u.value, _defineProperty({}, Type.$id, u.id)));
        });
        if (_this2[$subscriptions][u.type] && _this2[$subscriptions][u.type][u.id]) {
          _this2[$subscriptions][u.type][u.id].next(u.value);
        }
      });
    }
  }, {
    key: 'find',
    value: function find(t, id) {
      var Type = t;
      if (typeof t === 'string') {
        Type = this[$types][t];
      }
      var retVal = new Type(_defineProperty({}, Type.$id, id), this);
      return retVal;
    }

    // LOAD (type/id), SIDELOAD (type/id/side)? Or just LOADALL?
    // LOAD needs to scrub through hot caches first

  }, {
    key: 'subscribe',
    value: function subscribe(typeName, id, handler) {
      if (this[$subscriptions][typeName] === undefined) {
        this[$subscriptions][typeName] = {};
      }
      if (this[$subscriptions][typeName][id] === undefined) {
        this[$subscriptions][typeName][id] = new _Rx2.default.Subject();
      }
      return this[$subscriptions][typeName][id].subscribe(handler);
    }
  }, {
    key: 'has',
    value: function has(type, id, field) {
      return this[$storage].reduce(function (thenable, storage) {
        return thenable.then(function (v) {
          return v !== null ? v : storage.has(type, id, field);
        });
      }, Promise.resolve(null));
    }
  }, {
    key: 'get',
    value: function get(type, id) {
      return this[$storage].reduce(function (thenable, storage) {
        return thenable.then(function (v) {
          if (v !== null) {
            return v;
          } else {
            return storage.read(type, id);
          }
        });
      }, Promise.resolve(null));
    }
  }]);

  return Guild;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImd1aWxkLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHN1YnNjcmlwdGlvbnMiLCJHdWlsZCIsIm9wdHMiLCJvcHRpb25zIiwiT2JqZWN0IiwiYXNzaWduIiwic3RvcmFnZSIsInR5cGVzIiwiZm9yRWFjaCIsInMiLCJhZGRTdG9yZSIsInQiLCJhZGRUeXBlIiwiVCIsIiRuYW1lIiwidW5kZWZpbmVkIiwiRXJyb3IiLCJzdG9yZSIsInRlcm1pbmFsIiwicHVzaCIsIm9uVXBkYXRlIiwidSIsIlR5cGUiLCJ0eXBlIiwib25DYWNoZWFibGVSZWFkIiwidmFsdWUiLCIkaWQiLCJpZCIsIm5leHQiLCJyZXRWYWwiLCJ0eXBlTmFtZSIsImhhbmRsZXIiLCJTdWJqZWN0Iiwic3Vic2NyaWJlIiwiZmllbGQiLCJyZWR1Y2UiLCJ0aGVuYWJsZSIsInRoZW4iLCJ2IiwiaGFzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWFkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFLQTs7Ozs7Ozs7OztBQUxBLElBQU1BLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUMsV0FBV0QsT0FBTyxVQUFQLENBQWpCO0FBQ0EsSUFBTUUsWUFBWUYsT0FBTyxXQUFQLENBQWxCO0FBQ0EsSUFBTUcsaUJBQWlCSCxPQUFPLGdCQUFQLENBQXZCOztJQUlhSSxLLFdBQUFBLEs7QUFDWCxtQkFBdUI7QUFBQTs7QUFBQSxRQUFYQyxJQUFXLHlEQUFKLEVBQUk7O0FBQUE7O0FBQ3JCLFFBQU1DLFVBQVVDLE9BQU9DLE1BQVAsQ0FBYyxFQUFkLEVBQWtCO0FBQ2hDQyxlQUFTLEVBRHVCO0FBRWhDQyxhQUFPO0FBRnlCLEtBQWxCLEVBR2JMLElBSGEsQ0FBaEI7QUFJQSxTQUFLRixjQUFMLElBQXVCLEVBQXZCO0FBQ0EsU0FBS0YsUUFBTCxJQUFpQixFQUFqQjtBQUNBLFNBQUtGLE1BQUwsSUFBZSxFQUFmO0FBQ0FPLFlBQVFHLE9BQVIs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QyxRQUFELEVBQVc5QixPQUFYLEVBQXVCO0FBQ2xELGVBQU84QixTQUFTQyxJQUFULENBQWMsVUFBQ0MsQ0FBRCxFQUFPO0FBQzFCLGlCQUFRQSxNQUFNLElBQVAsR0FBZUEsQ0FBZixHQUFtQmhDLFFBQVFpQyxHQUFSLENBQVloQixJQUFaLEVBQWtCSSxFQUFsQixFQUFzQk8sS0FBdEIsQ0FBMUI7QUFDRCxTQUZNLENBQVA7QUFHRCxPQUpNLEVBSUpNLFFBQVFDLE9BQVIsQ0FBZ0IsSUFBaEIsQ0FKSSxDQUFQO0FBS0Q7Ozt3QkFFR2xCLEksRUFBTUksRSxFQUFJO0FBQ1osYUFBTyxLQUFLN0IsUUFBTCxFQUFlcUMsTUFBZixDQUFzQixVQUFDQyxRQUFELEVBQVc5QixPQUFYLEVBQXVCO0FBQ2xELGVBQU84QixTQUFTQyxJQUFULENBQWMsVUFBQ0MsQ0FBRCxFQUFPO0FBQzFCLGNBQUlBLE1BQU0sSUFBVixFQUFnQjtBQUNkLG1CQUFPQSxDQUFQO0FBQ0QsV0FGRCxNQUVPO0FBQ0wsbUJBQU9oQyxRQUFRb0MsSUFBUixDQUFhbkIsSUFBYixFQUFtQkksRUFBbkIsQ0FBUDtBQUNEO0FBQ0YsU0FOTSxDQUFQO0FBT0QsT0FSTSxFQVFKYSxRQUFRQyxPQUFSLENBQWdCLElBQWhCLENBUkksQ0FBUDtBQVNEIiwiZmlsZSI6Imd1aWxkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgJHR5cGVzID0gU3ltYm9sKCckdHlwZXMnKTtcbmNvbnN0ICRzdG9yYWdlID0gU3ltYm9sKCckc3RvcmFnZScpO1xuY29uc3QgJHRlcm1pbmFsID0gU3ltYm9sKCckdGVybWluYWwnKTtcbmNvbnN0ICRzdWJzY3JpcHRpb25zID0gU3ltYm9sKCckc3Vic2NyaXB0aW9ucycpO1xuXG5pbXBvcnQgUnggZnJvbSAncnhqcy9SeCc7XG5cbmV4cG9ydCBjbGFzcyBHdWlsZCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB7XG4gICAgICBzdG9yYWdlOiBbXSxcbiAgICAgIHR5cGVzOiBbXSxcbiAgICB9LCBvcHRzKTtcbiAgICB0aGlzWyRzdWJzY3JpcHRpb25zXSA9IHt9O1xuICAgIHRoaXNbJHN0b3JhZ2VdID0gW107XG4gICAgdGhpc1skdHlwZXNdID0ge307XG4gICAgb3B0aW9ucy5zdG9yYWdlLmZvckVhY2goKHMpID0+IHRoaXMuYWRkU3RvcmUocykpO1xuICAgIG9wdGlvbnMudHlwZXMuZm9yRWFjaCgodCkgPT4gdGhpcy5hZGRUeXBlKHQpKTtcbiAgfVxuXG4gIGFkZFR5cGUoVCkge1xuICAgIGlmICh0aGlzWyR0eXBlc11bVC4kbmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skdHlwZXNdW1QuJG5hbWVdID0gVDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBEdXBsaWNhdGUgVHlwZSByZWdpc3RlcmVkOiAke1QuJG5hbWV9YCk7XG4gICAgfVxuICB9XG5cbiAgYWRkU3RvcmUoc3RvcmUpIHtcbiAgICBpZiAoc3RvcmUudGVybWluYWwpIHtcbiAgICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzWyR0ZXJtaW5hbF0gPSBzdG9yZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGhhdmUgbW9yZSB0aGFuIG9uZSB0ZXJtaW5hbCBzdG9yZScpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzWyRzdG9yYWdlXS5wdXNoKHN0b3JlKTtcbiAgICB9XG4gICAgc3RvcmUub25VcGRhdGUoKHUpID0+IHtcbiAgICAgIHRoaXNbJHN0b3JhZ2VdLmZvckVhY2goKHN0b3JhZ2UpID0+IHtcbiAgICAgICAgY29uc3QgVHlwZSA9IHRoaXNbJHR5cGVzXVt1LnR5cGVdO1xuICAgICAgICBzdG9yYWdlLm9uQ2FjaGVhYmxlUmVhZChUeXBlLCBPYmplY3QuYXNzaWduKHt9LCB1LnZhbHVlLCB7W1R5cGUuJGlkXTogdS5pZH0pKTtcbiAgICAgIH0pO1xuICAgICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3UudHlwZV0gJiYgdGhpc1skc3Vic2NyaXB0aW9uc11bdS50eXBlXVt1LmlkXSkge1xuICAgICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt1LnR5cGVdW3UuaWRdLm5leHQodS52YWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmaW5kKHQsIGlkKSB7XG4gICAgbGV0IFR5cGUgPSB0O1xuICAgIGlmICh0eXBlb2YgdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIFR5cGUgPSB0aGlzWyR0eXBlc11bdF07XG4gICAgfVxuICAgIGNvbnN0IHJldFZhbCA9IG5ldyBUeXBlKHtbVHlwZS4kaWRdOiBpZH0sIHRoaXMpO1xuICAgIHJldHVybiByZXRWYWw7XG4gIH1cblxuICAvLyBMT0FEICh0eXBlL2lkKSwgU0lERUxPQUQgKHR5cGUvaWQvc2lkZSk/IE9yIGp1c3QgTE9BREFMTD9cbiAgLy8gTE9BRCBuZWVkcyB0byBzY3J1YiB0aHJvdWdoIGhvdCBjYWNoZXMgZmlyc3RcblxuICBzdWJzY3JpYmUodHlwZU5hbWUsIGlkLCBoYW5kbGVyKSB7XG4gICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV0gPSB7fTtcbiAgICB9XG4gICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXVtpZF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdW2lkXSA9IG5ldyBSeC5TdWJqZWN0KCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV1baWRdLnN1YnNjcmliZShoYW5kbGVyKTtcbiAgfVxuXG4gIGhhcyh0eXBlLCBpZCwgZmllbGQpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmFnZV0ucmVkdWNlKCh0aGVuYWJsZSwgc3RvcmFnZSkgPT4ge1xuICAgICAgcmV0dXJuIHRoZW5hYmxlLnRoZW4oKHYpID0+IHtcbiAgICAgICAgcmV0dXJuICh2ICE9PSBudWxsKSA/IHYgOiBzdG9yYWdlLmhhcyh0eXBlLCBpZCwgZmllbGQpO1xuICAgICAgfSk7XG4gICAgfSwgUHJvbWlzZS5yZXNvbHZlKG51bGwpKTtcbiAgfVxuXG4gIGdldCh0eXBlLCBpZCkge1xuICAgIHJldHVybiB0aGlzWyRzdG9yYWdlXS5yZWR1Y2UoKHRoZW5hYmxlLCBzdG9yYWdlKSA9PiB7XG4gICAgICByZXR1cm4gdGhlbmFibGUudGhlbigodikgPT4ge1xuICAgICAgICBpZiAodiAhPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBzdG9yYWdlLnJlYWQodHlwZSwgaWQpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LCBQcm9taXNlLnJlc29sdmUobnVsbCkpO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
