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
    options.storage.forEach(function (s) {
      return _this.addStore(s);
    });
  }

  _createClass(Guild, [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImd1aWxkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUtBOzs7Ozs7Ozs7O0FBTEEsSUFBTSxTQUFTLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTSxXQUFXLE9BQU8sVUFBUCxDQUFqQjtBQUNBLElBQU0sWUFBWSxPQUFPLFdBQVAsQ0FBbEI7QUFDQSxJQUFNLGlCQUFpQixPQUFPLGdCQUFQLENBQXZCOztJQUlhLEssV0FBQSxLO0FBQ1gsbUJBQXVCO0FBQUE7O0FBQUEsUUFBWCxJQUFXLHlEQUFKLEVBQUk7O0FBQUE7O0FBQ3JCLFFBQU0sVUFBVSxPQUFPLE1BQVAsQ0FBYyxFQUFkLEVBQWtCO0FBQ2hDLGVBQVM7QUFEdUIsS0FBbEIsRUFFYixJQUZhLENBQWhCO0FBR0EsU0FBSyxjQUFMLElBQXVCLEVBQXZCO0FBQ0EsWUFBUSxPQUFSLENBQWdCLE9BQWhCLENBQXdCLFVBQUMsQ0FBRDtBQUFBLGFBQU8sTUFBSyxRQUFMLENBQWMsQ0FBZCxDQUFQO0FBQUEsS0FBeEI7QUFDRDs7Ozs2QkFFUSxLLEVBQU87QUFBQTs7QUFDZCxVQUFJLE1BQU0sUUFBVixFQUFvQjtBQUNsQixZQUFJLEtBQUssU0FBTCxNQUFvQixTQUF4QixFQUFtQztBQUNqQyxlQUFLLFNBQUwsSUFBa0IsS0FBbEI7QUFDRCxTQUZELE1BRU87QUFDTCxnQkFBTSxJQUFJLEtBQUosQ0FBVSwwQ0FBVixDQUFOO0FBQ0Q7QUFDRixPQU5ELE1BTU87QUFDTCxhQUFLLFFBQUwsRUFBZSxJQUFmLENBQW9CLEtBQXBCO0FBQ0Q7QUFDRCxZQUFNLFFBQU4sQ0FBZSxVQUFDLENBQUQsRUFBTztBQUNwQixlQUFLLFFBQUwsRUFBZSxPQUFmLENBQXVCLFVBQUMsT0FBRCxFQUFhO0FBQ2xDLGNBQU0sT0FBTyxPQUFLLE1BQUwsRUFBYSxFQUFFLElBQWYsQ0FBYjtBQUNBLGtCQUFRLGVBQVIsQ0FBd0IsSUFBeEIsRUFBOEIsT0FBTyxNQUFQLENBQWMsRUFBZCxFQUFrQixFQUFFLEtBQXBCLHNCQUE2QixLQUFLLEdBQWxDLEVBQXdDLEVBQUUsRUFBMUMsRUFBOUI7QUFDRCxTQUhEO0FBSUEsWUFBSSxPQUFLLGNBQUwsRUFBcUIsRUFBRSxJQUF2QixLQUFnQyxPQUFLLGNBQUwsRUFBcUIsRUFBRSxJQUF2QixFQUE2QixFQUFFLEVBQS9CLENBQXBDLEVBQXdFO0FBQ3RFLGlCQUFLLGNBQUwsRUFBcUIsRUFBRSxJQUF2QixFQUE2QixFQUFFLEVBQS9CLEVBQW1DLElBQW5DLENBQXdDLEVBQUUsS0FBMUM7QUFDRDtBQUNGLE9BUkQ7QUFTRDs7O3lCQUVJLEMsRUFBRyxFLEVBQUk7QUFDVixVQUFJLE9BQU8sQ0FBWDtBQUNBLFVBQUksT0FBTyxDQUFQLEtBQWEsUUFBakIsRUFBMkI7QUFDekIsZUFBTyxLQUFLLE1BQUwsRUFBYSxDQUFiLENBQVA7QUFDRDtBQUNELFVBQU0sU0FBUyxJQUFJLElBQUoscUJBQVcsS0FBSyxHQUFoQixFQUFzQixFQUF0QixHQUEyQixJQUEzQixDQUFmO0FBQ0EsYUFBTyxNQUFQO0FBQ0Q7O0FBRUQ7QUFDQTs7Ozs4QkFFVSxRLEVBQVUsRSxFQUFJLE8sRUFBUztBQUMvQixVQUFJLEtBQUssY0FBTCxFQUFxQixRQUFyQixNQUFtQyxTQUF2QyxFQUFrRDtBQUNoRCxhQUFLLGNBQUwsRUFBcUIsUUFBckIsSUFBaUMsRUFBakM7QUFDRDtBQUNELFVBQUksS0FBSyxjQUFMLEVBQXFCLFFBQXJCLEVBQStCLEVBQS9CLE1BQXVDLFNBQTNDLEVBQXNEO0FBQ3BELGFBQUssY0FBTCxFQUFxQixRQUFyQixFQUErQixFQUEvQixJQUFxQyxJQUFJLGFBQUcsT0FBUCxFQUFyQztBQUNEO0FBQ0QsYUFBTyxLQUFLLGNBQUwsRUFBcUIsUUFBckIsRUFBK0IsRUFBL0IsRUFBbUMsU0FBbkMsQ0FBNkMsT0FBN0MsQ0FBUDtBQUNEOzs7d0JBRUcsSSxFQUFNLEUsRUFBSSxLLEVBQU87QUFDbkIsYUFBTyxLQUFLLFFBQUwsRUFBZSxNQUFmLENBQXNCLFVBQUMsUUFBRCxFQUFXLE9BQVgsRUFBdUI7QUFDbEQsZUFBTyxTQUFTLElBQVQsQ0FBYyxVQUFDLENBQUQsRUFBTztBQUMxQixpQkFBUSxNQUFNLElBQVAsR0FBZSxDQUFmLEdBQW1CLFFBQVEsR0FBUixDQUFZLElBQVosRUFBa0IsRUFBbEIsRUFBc0IsS0FBdEIsQ0FBMUI7QUFDRCxTQUZNLENBQVA7QUFHRCxPQUpNLEVBSUosUUFBUSxPQUFSLENBQWdCLElBQWhCLENBSkksQ0FBUDtBQUtEOzs7d0JBRUcsSSxFQUFNLEUsRUFBSTtBQUNaLGFBQU8sS0FBSyxRQUFMLEVBQWUsTUFBZixDQUFzQixVQUFDLFFBQUQsRUFBVyxPQUFYLEVBQXVCO0FBQ2xELGVBQU8sU0FBUyxJQUFULENBQWMsVUFBQyxDQUFELEVBQU87QUFDMUIsY0FBSSxNQUFNLElBQVYsRUFBZ0I7QUFDZCxtQkFBTyxDQUFQO0FBQ0QsV0FGRCxNQUVPO0FBQ0wsbUJBQU8sUUFBUSxJQUFSLENBQWEsSUFBYixFQUFtQixFQUFuQixDQUFQO0FBQ0Q7QUFDRixTQU5NLENBQVA7QUFPRCxPQVJNLEVBUUosUUFBUSxPQUFSLENBQWdCLElBQWhCLENBUkksQ0FBUDtBQVNEIiwiZmlsZSI6Imd1aWxkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgJHR5cGVzID0gU3ltYm9sKCckdHlwZXMnKTtcbmNvbnN0ICRzdG9yYWdlID0gU3ltYm9sKCckc3RvcmFnZScpO1xuY29uc3QgJHRlcm1pbmFsID0gU3ltYm9sKCckdGVybWluYWwnKTtcbmNvbnN0ICRzdWJzY3JpcHRpb25zID0gU3ltYm9sKCckc3Vic2NyaXB0aW9ucycpO1xuXG5pbXBvcnQgUnggZnJvbSAncnhqcy9SeCc7XG5cbmV4cG9ydCBjbGFzcyBHdWlsZCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB7XG4gICAgICBzdG9yYWdlOiBbXSxcbiAgICB9LCBvcHRzKTtcbiAgICB0aGlzWyRzdWJzY3JpcHRpb25zXSA9IHt9O1xuICAgIG9wdGlvbnMuc3RvcmFnZS5mb3JFYWNoKChzKSA9PiB0aGlzLmFkZFN0b3JlKHMpKTtcbiAgfVxuXG4gIGFkZFN0b3JlKHN0b3JlKSB7XG4gICAgaWYgKHN0b3JlLnRlcm1pbmFsKSB7XG4gICAgICBpZiAodGhpc1skdGVybWluYWxdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpc1skdGVybWluYWxdID0gc3RvcmU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBoYXZlIG1vcmUgdGhhbiBvbmUgdGVybWluYWwgc3RvcmUnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpc1skc3RvcmFnZV0ucHVzaChzdG9yZSk7XG4gICAgfVxuICAgIHN0b3JlLm9uVXBkYXRlKCh1KSA9PiB7XG4gICAgICB0aGlzWyRzdG9yYWdlXS5mb3JFYWNoKChzdG9yYWdlKSA9PiB7XG4gICAgICAgIGNvbnN0IFR5cGUgPSB0aGlzWyR0eXBlc11bdS50eXBlXTtcbiAgICAgICAgc3RvcmFnZS5vbkNhY2hlYWJsZVJlYWQoVHlwZSwgT2JqZWN0LmFzc2lnbih7fSwgdS52YWx1ZSwge1tUeXBlLiRpZF06IHUuaWR9KSk7XG4gICAgICB9KTtcbiAgICAgIGlmICh0aGlzWyRzdWJzY3JpcHRpb25zXVt1LnR5cGVdICYmIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3UudHlwZV1bdS5pZF0pIHtcbiAgICAgICAgdGhpc1skc3Vic2NyaXB0aW9uc11bdS50eXBlXVt1LmlkXS5uZXh0KHUudmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZmluZCh0LCBpZCkge1xuICAgIGxldCBUeXBlID0gdDtcbiAgICBpZiAodHlwZW9mIHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBUeXBlID0gdGhpc1skdHlwZXNdW3RdO1xuICAgIH1cbiAgICBjb25zdCByZXRWYWwgPSBuZXcgVHlwZSh7W1R5cGUuJGlkXTogaWR9LCB0aGlzKTtcbiAgICByZXR1cm4gcmV0VmFsO1xuICB9XG5cbiAgLy8gTE9BRCAodHlwZS9pZCksIFNJREVMT0FEICh0eXBlL2lkL3NpZGUpPyBPciBqdXN0IExPQURBTEw/XG4gIC8vIExPQUQgbmVlZHMgdG8gc2NydWIgdGhyb3VnaCBob3QgY2FjaGVzIGZpcnN0XG5cbiAgc3Vic2NyaWJlKHR5cGVOYW1lLCBpZCwgaGFuZGxlcikge1xuICAgIGlmICh0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdID0ge307XG4gICAgfVxuICAgIGlmICh0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV1baWRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXVtpZF0gPSBuZXcgUnguU3ViamVjdCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdW2lkXS5zdWJzY3JpYmUoaGFuZGxlcik7XG4gIH1cblxuICBoYXModHlwZSwgaWQsIGZpZWxkKSB7XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JhZ2VdLnJlZHVjZSgodGhlbmFibGUsIHN0b3JhZ2UpID0+IHtcbiAgICAgIHJldHVybiB0aGVuYWJsZS50aGVuKCh2KSA9PiB7XG4gICAgICAgIHJldHVybiAodiAhPT0gbnVsbCkgPyB2IDogc3RvcmFnZS5oYXModHlwZSwgaWQsIGZpZWxkKTtcbiAgICAgIH0pO1xuICAgIH0sIFByb21pc2UucmVzb2x2ZShudWxsKSk7XG4gIH1cblxuICBnZXQodHlwZSwgaWQpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmFnZV0ucmVkdWNlKCh0aGVuYWJsZSwgc3RvcmFnZSkgPT4ge1xuICAgICAgcmV0dXJuIHRoZW5hYmxlLnRoZW4oKHYpID0+IHtcbiAgICAgICAgaWYgKHYgIT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gc3RvcmFnZS5yZWFkKHR5cGUsIGlkKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSwgUHJvbWlzZS5yZXNvbHZlKG51bGwpKTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
