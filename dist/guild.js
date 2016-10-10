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
      storage: []
    }, opts);
    this[$subscriptions] = {};
    this[$storage] = [];
    this[$types] = {};
    options.storage.forEach(function (s) {
      return _this.addStore(s);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImd1aWxkLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHN1YnNjcmlwdGlvbnMiLCJHdWlsZCIsIm9wdHMiLCJvcHRpb25zIiwiT2JqZWN0IiwiYXNzaWduIiwic3RvcmFnZSIsImZvckVhY2giLCJzIiwiYWRkU3RvcmUiLCJUIiwiJG5hbWUiLCJ1bmRlZmluZWQiLCJFcnJvciIsInN0b3JlIiwidGVybWluYWwiLCJwdXNoIiwib25VcGRhdGUiLCJ1IiwiVHlwZSIsInR5cGUiLCJvbkNhY2hlYWJsZVJlYWQiLCJ2YWx1ZSIsIiRpZCIsImlkIiwibmV4dCIsInQiLCJyZXRWYWwiLCJ0eXBlTmFtZSIsImhhbmRsZXIiLCJTdWJqZWN0Iiwic3Vic2NyaWJlIiwiZmllbGQiLCJyZWR1Y2UiLCJ0aGVuYWJsZSIsInRoZW4iLCJ2IiwiaGFzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWFkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFLQTs7Ozs7Ozs7OztBQUxBLElBQU1BLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUMsV0FBV0QsT0FBTyxVQUFQLENBQWpCO0FBQ0EsSUFBTUUsWUFBWUYsT0FBTyxXQUFQLENBQWxCO0FBQ0EsSUFBTUcsaUJBQWlCSCxPQUFPLGdCQUFQLENBQXZCOztJQUlhSSxLLFdBQUFBLEs7QUFDWCxtQkFBdUI7QUFBQTs7QUFBQSxRQUFYQyxJQUFXLHlEQUFKLEVBQUk7O0FBQUE7O0FBQ3JCLFFBQU1DLFVBQVVDLE9BQU9DLE1BQVAsQ0FBYyxFQUFkLEVBQWtCO0FBQ2hDQyxlQUFTO0FBRHVCLEtBQWxCLEVBRWJKLElBRmEsQ0FBaEI7QUFHQSxTQUFLRixjQUFMLElBQXVCLEVBQXZCO0FBQ0EsU0FBS0YsUUFBTCxJQUFpQixFQUFqQjtBQUNBLFNBQUtGLE1BQUwsSUFBZSxFQUFmO0FBQ0FPLFlBQVFHLE9BQVIsQ0FBZ0JDLE9BQWhCLENBQXdCLFVBQUNDLENBQUQ7QUFBQSxh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SSxFQUFsQixFQUFzQlEsS0FBdEIsQ0FBMUI7QUFDRCxTQUZNLENBQVA7QUFHRCxPQUpNLEVBSUpNLFFBQVFDLE9BQVIsQ0FBZ0IsSUFBaEIsQ0FKSSxDQUFQO0FBS0Q7Ozt3QkFFR25CLEksRUFBTUksRSxFQUFJO0FBQ1osYUFBTyxLQUFLMUIsUUFBTCxFQUFlbUMsTUFBZixDQUFzQixVQUFDQyxRQUFELEVBQVc1QixPQUFYLEVBQXVCO0FBQ2xELGVBQU80QixTQUFTQyxJQUFULENBQWMsVUFBQ0MsQ0FBRCxFQUFPO0FBQzFCLGNBQUlBLE1BQU0sSUFBVixFQUFnQjtBQUNkLG1CQUFPQSxDQUFQO0FBQ0QsV0FGRCxNQUVPO0FBQ0wsbUJBQU85QixRQUFRa0MsSUFBUixDQUFhcEIsSUFBYixFQUFtQkksRUFBbkIsQ0FBUDtBQUNEO0FBQ0YsU0FOTSxDQUFQO0FBT0QsT0FSTSxFQVFKYyxRQUFRQyxPQUFSLENBQWdCLElBQWhCLENBUkksQ0FBUDtBQVNEIiwiZmlsZSI6Imd1aWxkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgJHR5cGVzID0gU3ltYm9sKCckdHlwZXMnKTtcbmNvbnN0ICRzdG9yYWdlID0gU3ltYm9sKCckc3RvcmFnZScpO1xuY29uc3QgJHRlcm1pbmFsID0gU3ltYm9sKCckdGVybWluYWwnKTtcbmNvbnN0ICRzdWJzY3JpcHRpb25zID0gU3ltYm9sKCckc3Vic2NyaXB0aW9ucycpO1xuXG5pbXBvcnQgUnggZnJvbSAncnhqcy9SeCc7XG5cbmV4cG9ydCBjbGFzcyBHdWlsZCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB7XG4gICAgICBzdG9yYWdlOiBbXSxcbiAgICB9LCBvcHRzKTtcbiAgICB0aGlzWyRzdWJzY3JpcHRpb25zXSA9IHt9O1xuICAgIHRoaXNbJHN0b3JhZ2VdID0gW107XG4gICAgdGhpc1skdHlwZXNdID0ge307XG4gICAgb3B0aW9ucy5zdG9yYWdlLmZvckVhY2goKHMpID0+IHRoaXMuYWRkU3RvcmUocykpO1xuICB9XG5cbiAgYWRkVHlwZShUKSB7XG4gICAgaWYgKHRoaXNbJHR5cGVzXVtULiRuYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyR0eXBlc11bVC4kbmFtZV0gPSBUO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYER1cGxpY2F0ZSBUeXBlIHJlZ2lzdGVyZWQ6ICR7VC4kbmFtZX1gKTtcbiAgICB9XG4gIH1cblxuICBhZGRTdG9yZShzdG9yZSkge1xuICAgIGlmIChzdG9yZS50ZXJtaW5hbCkge1xuICAgICAgaWYgKHRoaXNbJHRlcm1pbmFsXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXNbJHRlcm1pbmFsXSA9IHN0b3JlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgaGF2ZSBtb3JlIHRoYW4gb25lIHRlcm1pbmFsIHN0b3JlJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXNbJHN0b3JhZ2VdLnB1c2goc3RvcmUpO1xuICAgIH1cbiAgICBzdG9yZS5vblVwZGF0ZSgodSkgPT4ge1xuICAgICAgdGhpc1skc3RvcmFnZV0uZm9yRWFjaCgoc3RvcmFnZSkgPT4ge1xuICAgICAgICBjb25zdCBUeXBlID0gdGhpc1skdHlwZXNdW3UudHlwZV07XG4gICAgICAgIHN0b3JhZ2Uub25DYWNoZWFibGVSZWFkKFR5cGUsIE9iamVjdC5hc3NpZ24oe30sIHUudmFsdWUsIHtbVHlwZS4kaWRdOiB1LmlkfSkpO1xuICAgICAgfSk7XG4gICAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdS50eXBlXSAmJiB0aGlzWyRzdWJzY3JpcHRpb25zXVt1LnR5cGVdW3UuaWRdKSB7XG4gICAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3UudHlwZV1bdS5pZF0ubmV4dCh1LnZhbHVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZpbmQodCwgaWQpIHtcbiAgICBsZXQgVHlwZSA9IHQ7XG4gICAgaWYgKHR5cGVvZiB0ID09PSAnc3RyaW5nJykge1xuICAgICAgVHlwZSA9IHRoaXNbJHR5cGVzXVt0XTtcbiAgICB9XG4gICAgY29uc3QgcmV0VmFsID0gbmV3IFR5cGUoe1tUeXBlLiRpZF06IGlkfSwgdGhpcyk7XG4gICAgcmV0dXJuIHJldFZhbDtcbiAgfVxuXG4gIC8vIExPQUQgKHR5cGUvaWQpLCBTSURFTE9BRCAodHlwZS9pZC9zaWRlKT8gT3IganVzdCBMT0FEQUxMP1xuICAvLyBMT0FEIG5lZWRzIHRvIHNjcnViIHRocm91Z2ggaG90IGNhY2hlcyBmaXJzdFxuXG4gIHN1YnNjcmliZSh0eXBlTmFtZSwgaWQsIGhhbmRsZXIpIHtcbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXSA9IHt9O1xuICAgIH1cbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdW2lkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV1baWRdID0gbmV3IFJ4LlN1YmplY3QoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXVtpZF0uc3Vic2NyaWJlKGhhbmRsZXIpO1xuICB9XG5cbiAgaGFzKHR5cGUsIGlkLCBmaWVsZCkge1xuICAgIHJldHVybiB0aGlzWyRzdG9yYWdlXS5yZWR1Y2UoKHRoZW5hYmxlLCBzdG9yYWdlKSA9PiB7XG4gICAgICByZXR1cm4gdGhlbmFibGUudGhlbigodikgPT4ge1xuICAgICAgICByZXR1cm4gKHYgIT09IG51bGwpID8gdiA6IHN0b3JhZ2UuaGFzKHR5cGUsIGlkLCBmaWVsZCk7XG4gICAgICB9KTtcbiAgICB9LCBQcm9taXNlLnJlc29sdmUobnVsbCkpO1xuICB9XG5cbiAgZ2V0KHR5cGUsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JhZ2VdLnJlZHVjZSgodGhlbmFibGUsIHN0b3JhZ2UpID0+IHtcbiAgICAgIHJldHVybiB0aGVuYWJsZS50aGVuKCh2KSA9PiB7XG4gICAgICAgIGlmICh2ICE9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JhZ2UucmVhZCh0eXBlLCBpZCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sIFByb21pc2UucmVzb2x2ZShudWxsKSk7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
