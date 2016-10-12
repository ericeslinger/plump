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

    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

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
    key: 'save',
    value: function save(type, val) {
      if (this[$terminal]) {
        return this[$terminal].write(type, val);
      } else {
        return Promise.reject(new Error('Guild has no terminal store'));
      }
    }
  }, {
    key: 'forge',
    value: function forge(t, val) {
      var Type = t;
      if (typeof t === 'string') {
        Type = this[$types][t];
      }
      return new Type(val, this);
    }
  }, {
    key: 'get',
    value: function get(type, id) {
      var _this3 = this;

      return this[$storage].reduce(function (thenable, storage) {
        return thenable.then(function (v) {
          if (v !== null) {
            return v;
          } else {
            return storage.read(type, id);
          }
        });
      }, Promise.resolve(null)).then(function (v) {
        if (v === null && _this3[$terminal]) {
          return _this3[$terminal].read(type, id);
        } else {
          return v;
        }
      });
    }
  }]);

  return Guild;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImd1aWxkLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHN1YnNjcmlwdGlvbnMiLCJHdWlsZCIsIm9wdHMiLCJvcHRpb25zIiwiT2JqZWN0IiwiYXNzaWduIiwic3RvcmFnZSIsInR5cGVzIiwiZm9yRWFjaCIsInMiLCJhZGRTdG9yZSIsInQiLCJhZGRUeXBlIiwiVCIsIiRuYW1lIiwidW5kZWZpbmVkIiwiRXJyb3IiLCJzdG9yZSIsInRlcm1pbmFsIiwicHVzaCIsIm9uVXBkYXRlIiwidSIsIlR5cGUiLCJ0eXBlIiwib25DYWNoZWFibGVSZWFkIiwidmFsdWUiLCIkaWQiLCJpZCIsIm5leHQiLCJyZXRWYWwiLCJ0eXBlTmFtZSIsImhhbmRsZXIiLCJTdWJqZWN0Iiwic3Vic2NyaWJlIiwiZmllbGQiLCJyZWR1Y2UiLCJ0aGVuYWJsZSIsInRoZW4iLCJ2IiwiaGFzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJ2YWwiLCJ3cml0ZSIsInJlamVjdCIsInJlYWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUtBOzs7Ozs7Ozs7O0FBTEEsSUFBTUEsU0FBU0MsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNQyxXQUFXRCxPQUFPLFVBQVAsQ0FBakI7QUFDQSxJQUFNRSxZQUFZRixPQUFPLFdBQVAsQ0FBbEI7QUFDQSxJQUFNRyxpQkFBaUJILE9BQU8sZ0JBQVAsQ0FBdkI7O0lBSWFJLEssV0FBQUEsSztBQUNYLG1CQUF1QjtBQUFBOztBQUFBLFFBQVhDLElBQVcsdUVBQUosRUFBSTs7QUFBQTs7QUFDckIsUUFBTUMsVUFBVUMsT0FBT0MsTUFBUCxDQUFjLEVBQWQsRUFBa0I7QUFDaENDLGVBQVMsRUFEdUI7QUFFaENDLGFBQU87QUFGeUIsS0FBbEIsRUFHYkwsSUFIYSxDQUFoQjtBQUlBLFNBQUtGLGNBQUwsSUFBdUIsRUFBdkI7QUFDQSxTQUFLRixRQUFMLElBQWlCLEVBQWpCO0FBQ0EsU0FBS0YsTUFBTCxJQUFl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QUFtQkksRUFBbkIsQ0FBUDtBQUNEO0FBQ0YsU0FOTSxDQUFQO0FBT0QsT0FSTSxFQVFKYSxRQUFRQyxPQUFSLENBQWdCLElBQWhCLENBUkksRUFTTkosSUFUTSxDQVNELFVBQUNDLENBQUQsRUFBTztBQUNYLFlBQUtBLE1BQU0sSUFBUCxJQUFpQixPQUFLdkMsU0FBTCxDQUFyQixFQUF1QztBQUNyQyxpQkFBTyxPQUFLQSxTQUFMLEVBQWdCOEMsSUFBaEIsQ0FBcUJ0QixJQUFyQixFQUEyQkksRUFBM0IsQ0FBUDtBQUNELFNBRkQsTUFFTztBQUNMLGlCQUFPVyxDQUFQO0FBQ0Q7QUFDRixPQWZNLENBQVA7QUFnQkQiLCJmaWxlIjoiZ3VpbGQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCAkdHlwZXMgPSBTeW1ib2woJyR0eXBlcycpO1xuY29uc3QgJHN0b3JhZ2UgPSBTeW1ib2woJyRzdG9yYWdlJyk7XG5jb25zdCAkdGVybWluYWwgPSBTeW1ib2woJyR0ZXJtaW5hbCcpO1xuY29uc3QgJHN1YnNjcmlwdGlvbnMgPSBTeW1ib2woJyRzdWJzY3JpcHRpb25zJyk7XG5cbmltcG9ydCBSeCBmcm9tICdyeGpzL1J4JztcblxuZXhwb3J0IGNsYXNzIEd1aWxkIHtcbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIHtcbiAgICAgIHN0b3JhZ2U6IFtdLFxuICAgICAgdHlwZXM6IFtdLFxuICAgIH0sIG9wdHMpO1xuICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdID0ge307XG4gICAgdGhpc1skc3RvcmFnZV0gPSBbXTtcbiAgICB0aGlzWyR0eXBlc10gPSB7fTtcbiAgICBvcHRpb25zLnN0b3JhZ2UuZm9yRWFjaCgocykgPT4gdGhpcy5hZGRTdG9yZShzKSk7XG4gICAgb3B0aW9ucy50eXBlcy5mb3JFYWNoKCh0KSA9PiB0aGlzLmFkZFR5cGUodCkpO1xuICB9XG5cbiAgYWRkVHlwZShUKSB7XG4gICAgaWYgKHRoaXNbJHR5cGVzXVtULiRuYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyR0eXBlc11bVC4kbmFtZV0gPSBUO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYER1cGxpY2F0ZSBUeXBlIHJlZ2lzdGVyZWQ6ICR7VC4kbmFtZX1gKTtcbiAgICB9XG4gIH1cblxuICBhZGRTdG9yZShzdG9yZSkge1xuICAgIGlmIChzdG9yZS50ZXJtaW5hbCkge1xuICAgICAgaWYgKHRoaXNbJHRlcm1pbmFsXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXNbJHRlcm1pbmFsXSA9IHN0b3JlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgaGF2ZSBtb3JlIHRoYW4gb25lIHRlcm1pbmFsIHN0b3JlJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXNbJHN0b3JhZ2VdLnB1c2goc3RvcmUpO1xuICAgIH1cbiAgICBzdG9yZS5vblVwZGF0ZSgodSkgPT4ge1xuICAgICAgdGhpc1skc3RvcmFnZV0uZm9yRWFjaCgoc3RvcmFnZSkgPT4ge1xuICAgICAgICBjb25zdCBUeXBlID0gdGhpc1skdHlwZXNdW3UudHlwZV07XG4gICAgICAgIHN0b3JhZ2Uub25DYWNoZWFibGVSZWFkKFR5cGUsIE9iamVjdC5hc3NpZ24oe30sIHUudmFsdWUsIHtbVHlwZS4kaWRdOiB1LmlkfSkpO1xuICAgICAgfSk7XG4gICAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdS50eXBlXSAmJiB0aGlzWyRzdWJzY3JpcHRpb25zXVt1LnR5cGVdW3UuaWRdKSB7XG4gICAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3UudHlwZV1bdS5pZF0ubmV4dCh1LnZhbHVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZpbmQodCwgaWQpIHtcbiAgICBsZXQgVHlwZSA9IHQ7XG4gICAgaWYgKHR5cGVvZiB0ID09PSAnc3RyaW5nJykge1xuICAgICAgVHlwZSA9IHRoaXNbJHR5cGVzXVt0XTtcbiAgICB9XG4gICAgY29uc3QgcmV0VmFsID0gbmV3IFR5cGUoe1tUeXBlLiRpZF06IGlkfSwgdGhpcyk7XG4gICAgcmV0dXJuIHJldFZhbDtcbiAgfVxuXG4gIC8vIExPQUQgKHR5cGUvaWQpLCBTSURFTE9BRCAodHlwZS9pZC9zaWRlKT8gT3IganVzdCBMT0FEQUxMP1xuICAvLyBMT0FEIG5lZWRzIHRvIHNjcnViIHRocm91Z2ggaG90IGNhY2hlcyBmaXJzdFxuXG4gIHN1YnNjcmliZSh0eXBlTmFtZSwgaWQsIGhhbmRsZXIpIHtcbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXSA9IHt9O1xuICAgIH1cbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdW2lkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV1baWRdID0gbmV3IFJ4LlN1YmplY3QoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXVtpZF0uc3Vic2NyaWJlKGhhbmRsZXIpO1xuICB9XG5cbiAgaGFzKHR5cGUsIGlkLCBmaWVsZCkge1xuICAgIHJldHVybiB0aGlzWyRzdG9yYWdlXS5yZWR1Y2UoKHRoZW5hYmxlLCBzdG9yYWdlKSA9PiB7XG4gICAgICByZXR1cm4gdGhlbmFibGUudGhlbigodikgPT4ge1xuICAgICAgICByZXR1cm4gKHYgIT09IG51bGwpID8gdiA6IHN0b3JhZ2UuaGFzKHR5cGUsIGlkLCBmaWVsZCk7XG4gICAgICB9KTtcbiAgICB9LCBQcm9taXNlLnJlc29sdmUobnVsbCkpO1xuICB9XG5cbiAgc2F2ZSh0eXBlLCB2YWwpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLndyaXRlKHR5cGUsIHZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0d1aWxkIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBmb3JnZSh0LCB2YWwpIHtcbiAgICBsZXQgVHlwZSA9IHQ7XG4gICAgaWYgKHR5cGVvZiB0ID09PSAnc3RyaW5nJykge1xuICAgICAgVHlwZSA9IHRoaXNbJHR5cGVzXVt0XTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBUeXBlKHZhbCwgdGhpcyk7XG4gIH1cblxuICBnZXQodHlwZSwgaWQpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmFnZV0ucmVkdWNlKCh0aGVuYWJsZSwgc3RvcmFnZSkgPT4ge1xuICAgICAgcmV0dXJuIHRoZW5hYmxlLnRoZW4oKHYpID0+IHtcbiAgICAgICAgaWYgKHYgIT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gc3RvcmFnZS5yZWFkKHR5cGUsIGlkKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSwgUHJvbWlzZS5yZXNvbHZlKG51bGwpKVxuICAgIC50aGVuKCh2KSA9PiB7XG4gICAgICBpZiAoKHYgPT09IG51bGwpICYmICh0aGlzWyR0ZXJtaW5hbF0pKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVhZCh0eXBlLCBpZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdjtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
