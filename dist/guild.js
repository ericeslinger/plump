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
      var _this3 = this;

      return this[$storage].reduce(function (thenable, storage) {
        return thenable.then(function (v) {
          return v !== null ? v : storage.has(type, id, field);
        });
      }, Promise.resolve(null)).then(function (v) {
        if (v === null && _this3[$terminal]) {
          return _this3[$terminal].has(type, id, field);
        } else {
          return v;
        }
      });
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
    key: 'add',
    value: function add(type, parentId, relationship, childId) {
      if (this[$terminal]) {
        return this[$terminal].add(type, parentId, relationship, childId);
      } else {
        return Promise.reject(new Error('Guild has no terminal store'));
      }
    }
  }, {
    key: 'remove',
    value: function remove(type, parentId, relationship, childId) {
      if (this[$terminal]) {
        return this[$terminal].remove(type, parentId, relationship, childId);
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
      var _this4 = this;

      return this[$storage].reduce(function (thenable, storage) {
        return thenable.then(function (v) {
          if (v !== null) {
            return v;
          } else {
            return storage.read(type, id);
          }
        });
      }, Promise.resolve(null)).then(function (v) {
        if (v === null && _this4[$terminal]) {
          return _this4[$terminal].read(type, id);
        } else {
          return v;
        }
      });
    }
  }]);

  return Guild;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImd1aWxkLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHN1YnNjcmlwdGlvbnMiLCJHdWlsZCIsIm9wdHMiLCJvcHRpb25zIiwiT2JqZWN0IiwiYXNzaWduIiwic3RvcmFnZSIsInR5cGVzIiwiZm9yRWFjaCIsInMiLCJhZGRTdG9yZSIsInQiLCJhZGRUeXBlIiwiVCIsIiRuYW1lIiwidW5kZWZpbmVkIiwiRXJyb3IiLCJzdG9yZSIsInRlcm1pbmFsIiwicHVzaCIsIm9uVXBkYXRlIiwidSIsIlR5cGUiLCJ0eXBlIiwib25DYWNoZWFibGVSZWFkIiwidmFsdWUiLCIkaWQiLCJpZCIsIm5leHQiLCJyZXRWYWwiLCJ0eXBlTmFtZSIsImhhbmRsZXIiLCJTdWJqZWN0Iiwic3Vic2NyaWJlIiwiZmllbGQiLCJyZWR1Y2UiLCJ0aGVuYWJsZSIsInRoZW4iLCJ2IiwiaGFzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJ2YWwiLCJ3cml0ZSIsInJlamVjdCIsInBhcmVudElkIiwicmVsYXRpb25zaGlwIiwiY2hpbGRJZCIsImFkZCIsInJlbW92ZSIsInJlYWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUtBOzs7Ozs7Ozs7O0FBTEEsSUFBTUEsU0FBU0MsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNQyxXQUFXRCxPQUFPLFVBQVAsQ0FBakI7QUFDQSxJQUFNRSxZQUFZRixPQUFPLFdBQVAsQ0FBbEI7QUFDQSxJQUFNRyxpQkFBaUJILE9BQU8sZ0JBQVAsQ0FBdkI7O0lBSWFJLEssV0FBQUEsSztBQUNYLG1CQUF1QjtBQUFBOztBQUFBLFFBQVhDLElBQVcsdUVBQUosRUFBSTs7QUFBQTs7QUFDckIsUUFBTUMsVUFBVUMsT0FBT0MsTUFBUCxDQUFjLEVBQWQsRUFBa0I7QUFDaENDLGVBQVMsRUFEdUI7QUFFaENDLGFBQU87QUFGeUIsS0FBbEIsRUFHYkwsSUFIYSxDQUFoQjtBQUlBLFNBQUtGLGNBQUwsSUFBdUIsRUFB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QSxNQUFNLElBQVAsSUFBaUIsT0FBS3ZDLFNBQUwsQ0FBckIsRUFBdUM7QUFDckMsaUJBQU8sT0FBS0EsU0FBTCxFQUFnQm1ELElBQWhCLENBQXFCM0IsSUFBckIsRUFBMkJJLEVBQTNCLENBQVA7QUFDRCxTQUZELE1BRU87QUFDTCxpQkFBT1csQ0FBUDtBQUNEO0FBQ0YsT0FmTSxDQUFQO0FBZ0JEIiwiZmlsZSI6Imd1aWxkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgJHR5cGVzID0gU3ltYm9sKCckdHlwZXMnKTtcbmNvbnN0ICRzdG9yYWdlID0gU3ltYm9sKCckc3RvcmFnZScpO1xuY29uc3QgJHRlcm1pbmFsID0gU3ltYm9sKCckdGVybWluYWwnKTtcbmNvbnN0ICRzdWJzY3JpcHRpb25zID0gU3ltYm9sKCckc3Vic2NyaXB0aW9ucycpO1xuXG5pbXBvcnQgUnggZnJvbSAncnhqcy9SeCc7XG5cbmV4cG9ydCBjbGFzcyBHdWlsZCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB7XG4gICAgICBzdG9yYWdlOiBbXSxcbiAgICAgIHR5cGVzOiBbXSxcbiAgICB9LCBvcHRzKTtcbiAgICB0aGlzWyRzdWJzY3JpcHRpb25zXSA9IHt9O1xuICAgIHRoaXNbJHN0b3JhZ2VdID0gW107XG4gICAgdGhpc1skdHlwZXNdID0ge307XG4gICAgb3B0aW9ucy5zdG9yYWdlLmZvckVhY2goKHMpID0+IHRoaXMuYWRkU3RvcmUocykpO1xuICAgIG9wdGlvbnMudHlwZXMuZm9yRWFjaCgodCkgPT4gdGhpcy5hZGRUeXBlKHQpKTtcbiAgfVxuXG4gIGFkZFR5cGUoVCkge1xuICAgIGlmICh0aGlzWyR0eXBlc11bVC4kbmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skdHlwZXNdW1QuJG5hbWVdID0gVDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBEdXBsaWNhdGUgVHlwZSByZWdpc3RlcmVkOiAke1QuJG5hbWV9YCk7XG4gICAgfVxuICB9XG5cbiAgYWRkU3RvcmUoc3RvcmUpIHtcbiAgICBpZiAoc3RvcmUudGVybWluYWwpIHtcbiAgICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzWyR0ZXJtaW5hbF0gPSBzdG9yZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGhhdmUgbW9yZSB0aGFuIG9uZSB0ZXJtaW5hbCBzdG9yZScpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzWyRzdG9yYWdlXS5wdXNoKHN0b3JlKTtcbiAgICB9XG4gICAgc3RvcmUub25VcGRhdGUoKHUpID0+IHtcbiAgICAgIHRoaXNbJHN0b3JhZ2VdLmZvckVhY2goKHN0b3JhZ2UpID0+IHtcbiAgICAgICAgY29uc3QgVHlwZSA9IHRoaXNbJHR5cGVzXVt1LnR5cGVdO1xuICAgICAgICBzdG9yYWdlLm9uQ2FjaGVhYmxlUmVhZChUeXBlLCBPYmplY3QuYXNzaWduKHt9LCB1LnZhbHVlLCB7W1R5cGUuJGlkXTogdS5pZH0pKTtcbiAgICAgIH0pO1xuICAgICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3UudHlwZV0gJiYgdGhpc1skc3Vic2NyaXB0aW9uc11bdS50eXBlXVt1LmlkXSkge1xuICAgICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt1LnR5cGVdW3UuaWRdLm5leHQodS52YWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmaW5kKHQsIGlkKSB7XG4gICAgbGV0IFR5cGUgPSB0O1xuICAgIGlmICh0eXBlb2YgdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIFR5cGUgPSB0aGlzWyR0eXBlc11bdF07XG4gICAgfVxuICAgIGNvbnN0IHJldFZhbCA9IG5ldyBUeXBlKHtbVHlwZS4kaWRdOiBpZH0sIHRoaXMpO1xuICAgIHJldHVybiByZXRWYWw7XG4gIH1cblxuICAvLyBMT0FEICh0eXBlL2lkKSwgU0lERUxPQUQgKHR5cGUvaWQvc2lkZSk/IE9yIGp1c3QgTE9BREFMTD9cbiAgLy8gTE9BRCBuZWVkcyB0byBzY3J1YiB0aHJvdWdoIGhvdCBjYWNoZXMgZmlyc3RcblxuICBzdWJzY3JpYmUodHlwZU5hbWUsIGlkLCBoYW5kbGVyKSB7XG4gICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV0gPSB7fTtcbiAgICB9XG4gICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXVtpZF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdW2lkXSA9IG5ldyBSeC5TdWJqZWN0KCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV1baWRdLnN1YnNjcmliZShoYW5kbGVyKTtcbiAgfVxuXG4gIGhhcyh0eXBlLCBpZCwgZmllbGQpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmFnZV0ucmVkdWNlKCh0aGVuYWJsZSwgc3RvcmFnZSkgPT4ge1xuICAgICAgcmV0dXJuIHRoZW5hYmxlLnRoZW4oKHYpID0+IHtcbiAgICAgICAgcmV0dXJuICh2ICE9PSBudWxsKSA/IHYgOiBzdG9yYWdlLmhhcyh0eXBlLCBpZCwgZmllbGQpO1xuICAgICAgfSk7XG4gICAgfSwgUHJvbWlzZS5yZXNvbHZlKG51bGwpKVxuICAgIC50aGVuKCh2KSA9PiB7XG4gICAgICBpZiAoKHYgPT09IG51bGwpICYmICh0aGlzWyR0ZXJtaW5hbF0pKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0uaGFzKHR5cGUsIGlkLCBmaWVsZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdjtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHNhdmUodHlwZSwgdmFsKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS53cml0ZSh0eXBlLCB2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdHdWlsZCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgYWRkKHR5cGUsIHBhcmVudElkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLmFkZCh0eXBlLCBwYXJlbnRJZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignR3VpbGQgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZSh0eXBlLCBwYXJlbnRJZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZW1vdmUodHlwZSwgcGFyZW50SWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0d1aWxkIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBmb3JnZSh0LCB2YWwpIHtcbiAgICBsZXQgVHlwZSA9IHQ7XG4gICAgaWYgKHR5cGVvZiB0ID09PSAnc3RyaW5nJykge1xuICAgICAgVHlwZSA9IHRoaXNbJHR5cGVzXVt0XTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBUeXBlKHZhbCwgdGhpcyk7XG4gIH1cblxuICBnZXQodHlwZSwgaWQpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmFnZV0ucmVkdWNlKCh0aGVuYWJsZSwgc3RvcmFnZSkgPT4ge1xuICAgICAgcmV0dXJuIHRoZW5hYmxlLnRoZW4oKHYpID0+IHtcbiAgICAgICAgaWYgKHYgIT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gc3RvcmFnZS5yZWFkKHR5cGUsIGlkKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSwgUHJvbWlzZS5yZXNvbHZlKG51bGwpKVxuICAgIC50aGVuKCh2KSA9PiB7XG4gICAgICBpZiAoKHYgPT09IG51bGwpICYmICh0aGlzWyR0ZXJtaW5hbF0pKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVhZCh0eXBlLCBpZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdjtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
