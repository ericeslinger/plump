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
    key: 'get',
    value: function get() {
      var _this3 = this;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return this[$storage].reduce(function (thenable, storage) {
        return thenable.then(function (v) {
          if (v !== null) {
            return v;
          } else {
            return storage.read.apply(storage, args);
          }
        });
      }, Promise.resolve(null)).then(function (v) {
        if (v === null && _this3[$terminal]) {
          var _$terminal;

          return (_$terminal = _this3[$terminal]).read.apply(_$terminal, args);
        } else {
          return v;
        }
      }).then(function (v) {
        return v;
      });
    }
  }, {
    key: 'save',
    value: function save() {
      if (this[$terminal]) {
        var _$terminal2;

        return (_$terminal2 = this[$terminal]).write.apply(_$terminal2, arguments);
      } else {
        return Promise.reject(new Error('Guild has no terminal store'));
      }
    }
  }, {
    key: 'add',
    value: function add() {
      if (this[$terminal]) {
        var _$terminal3;

        return (_$terminal3 = this[$terminal]).add.apply(_$terminal3, arguments);
      } else {
        return Promise.reject(new Error('Guild has no terminal store'));
      }
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship() {
      if (this[$terminal]) {
        var _$terminal4;

        return (_$terminal4 = this[$terminal]).modifyRelationship.apply(_$terminal4, arguments);
      } else {
        return Promise.reject(new Error('Guild has no terminal store'));
      }
    }
  }, {
    key: 'remove',
    value: function remove() {
      if (this[$terminal]) {
        var _$terminal5;

        return (_$terminal5 = this[$terminal]).remove.apply(_$terminal5, arguments);
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
  }]);

  return Guild;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImd1aWxkLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHN1YnNjcmlwdGlvbnMiLCJHdWlsZCIsIm9wdHMiLCJvcHRpb25zIiwiT2JqZWN0IiwiYXNzaWduIiwic3RvcmFnZSIsInR5cGVzIiwiZm9yRWFjaCIsInMiLCJhZGRTdG9yZSIsInQiLCJhZGRUeXBlIiwiVCIsIiRuYW1lIiwidW5kZWZpbmVkIiwiRXJyb3IiLCJzdG9yZSIsInRlcm1pbmFsIiwicHVzaCIsIm9uVXBkYXRlIiwidSIsIlR5cGUiLCJ0eXBlIiwib25DYWNoZWFibGVSZWFkIiwidmFsdWUiLCIkaWQiLCJpZCIsIm5leHQiLCJyZXRWYWwiLCJ0eXBlTmFtZSIsImhhbmRsZXIiLCJTdWJqZWN0Iiwic3Vic2NyaWJlIiwiYXJncyIsInJlZHVjZSIsInRoZW5hYmxlIiwidGhlbiIsInYiLCJyZWFkIiwiUHJvbWlzZSIsInJlc29sdmUiLCJ3cml0ZSIsInJlamVjdCIsImFkZCIsIm1vZGlmeVJlbGF0aW9uc2hpcCIsInJlbW92ZSIsInZhbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBS0E7Ozs7Ozs7Ozs7QUFMQSxJQUFNQSxTQUFTQyxPQUFPLFFBQVAsQ0FBZjtBQUNBLElBQU1DLFdBQVdELE9BQU8sVUFBUCxDQUFqQjtBQUNBLElBQU1FLFlBQVlGLE9BQU8sV0FBUCxDQUFsQjtBQUNBLElBQU1HLGlCQUFpQkgsT0FBTyxnQkFBUCxDQUF2Qjs7SUFJYUksSyxXQUFBQSxLO0FBQ1gsbUJBQXVCO0FBQUE7O0FBQUEsUUFBWEMsSUFBVyx5REFBSixFQUFJOztBQUFBOztBQUNyQixRQUFNQyxVQUFVQyxPQUFPQyxNQUFQLENBQWMsRUFBZCxFQUFrQjtBQUNoQ0MsZUFBUyxFQUR1QjtBQUVoQ0MsYUFBTztBQUZ5QixLQUFsQixFQUdiTCxJQUhhLENBQWhCO0FBSUEsU0FBS0YsY0FBTCxJQUF1QixFQUF2QjtBQUNBLFNBQUtGLFFBQUwsSUFB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QWYsQ0FBUDtBQUNEO0FBQ0Y7Ozt5Q0FFMkI7QUFDMUIsVUFBSSxLQUFLakIsU0FBTCxDQUFKLEVBQXFCO0FBQUE7O0FBQ25CLGVBQU8sb0JBQUtBLFNBQUwsR0FBZ0I4QyxrQkFBaEIsOEJBQVA7QUFDRCxPQUZELE1BRU87QUFDTCxlQUFPTCxRQUFRRyxNQUFSLENBQWUsSUFBSTNCLEtBQUosQ0FBVSw2QkFBVixDQUFmLENBQVA7QUFDRDtBQUNGOzs7NkJBRWU7QUFDZCxVQUFJLEtBQUtqQixTQUFMLENBQUosRUFBcUI7QUFBQTs7QUFDbkIsZUFBTyxvQkFBS0EsU0FBTCxHQUFnQitDLE1BQWhCLDhCQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBT04sUUFBUUcsTUFBUixDQUFlLElBQUkzQixLQUFKLENBQVUsNkJBQVYsQ0FBZixDQUFQO0FBQ0Q7QUFDRjs7OzBCQUVLTCxDLEVBQUdvQyxHLEVBQUs7QUFDWixVQUFJekIsT0FBT1gsQ0FBWDtBQUNBLFVBQUksT0FBT0EsQ0FBUCxLQUFhLFFBQWpCLEVBQTJCO0FBQ3pCVyxlQUFPLEtBQUsxQixNQUFMLEVBQWFlLENBQWIsQ0FBUDtBQUNEO0FBQ0QsYUFBTyxJQUFJVyxJQUFKLENBQVN5QixHQUFULEVBQWMsSUFBZCxDQUFQO0FBQ0QiLCJmaWxlIjoiZ3VpbGQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCAkdHlwZXMgPSBTeW1ib2woJyR0eXBlcycpO1xuY29uc3QgJHN0b3JhZ2UgPSBTeW1ib2woJyRzdG9yYWdlJyk7XG5jb25zdCAkdGVybWluYWwgPSBTeW1ib2woJyR0ZXJtaW5hbCcpO1xuY29uc3QgJHN1YnNjcmlwdGlvbnMgPSBTeW1ib2woJyRzdWJzY3JpcHRpb25zJyk7XG5cbmltcG9ydCBSeCBmcm9tICdyeGpzL1J4JztcblxuZXhwb3J0IGNsYXNzIEd1aWxkIHtcbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIHtcbiAgICAgIHN0b3JhZ2U6IFtdLFxuICAgICAgdHlwZXM6IFtdLFxuICAgIH0sIG9wdHMpO1xuICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdID0ge307XG4gICAgdGhpc1skc3RvcmFnZV0gPSBbXTtcbiAgICB0aGlzWyR0eXBlc10gPSB7fTtcbiAgICBvcHRpb25zLnN0b3JhZ2UuZm9yRWFjaCgocykgPT4gdGhpcy5hZGRTdG9yZShzKSk7XG4gICAgb3B0aW9ucy50eXBlcy5mb3JFYWNoKCh0KSA9PiB0aGlzLmFkZFR5cGUodCkpO1xuICB9XG5cbiAgYWRkVHlwZShUKSB7XG4gICAgaWYgKHRoaXNbJHR5cGVzXVtULiRuYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyR0eXBlc11bVC4kbmFtZV0gPSBUO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYER1cGxpY2F0ZSBUeXBlIHJlZ2lzdGVyZWQ6ICR7VC4kbmFtZX1gKTtcbiAgICB9XG4gIH1cblxuICBhZGRTdG9yZShzdG9yZSkge1xuICAgIGlmIChzdG9yZS50ZXJtaW5hbCkge1xuICAgICAgaWYgKHRoaXNbJHRlcm1pbmFsXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXNbJHRlcm1pbmFsXSA9IHN0b3JlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgaGF2ZSBtb3JlIHRoYW4gb25lIHRlcm1pbmFsIHN0b3JlJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXNbJHN0b3JhZ2VdLnB1c2goc3RvcmUpO1xuICAgIH1cbiAgICBzdG9yZS5vblVwZGF0ZSgodSkgPT4ge1xuICAgICAgdGhpc1skc3RvcmFnZV0uZm9yRWFjaCgoc3RvcmFnZSkgPT4ge1xuICAgICAgICBjb25zdCBUeXBlID0gdGhpc1skdHlwZXNdW3UudHlwZV07XG4gICAgICAgIHN0b3JhZ2Uub25DYWNoZWFibGVSZWFkKFR5cGUsIE9iamVjdC5hc3NpZ24oe30sIHUudmFsdWUsIHtbVHlwZS4kaWRdOiB1LmlkfSkpO1xuICAgICAgfSk7XG4gICAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdS50eXBlXSAmJiB0aGlzWyRzdWJzY3JpcHRpb25zXVt1LnR5cGVdW3UuaWRdKSB7XG4gICAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3UudHlwZV1bdS5pZF0ubmV4dCh1LnZhbHVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZpbmQodCwgaWQpIHtcbiAgICBsZXQgVHlwZSA9IHQ7XG4gICAgaWYgKHR5cGVvZiB0ID09PSAnc3RyaW5nJykge1xuICAgICAgVHlwZSA9IHRoaXNbJHR5cGVzXVt0XTtcbiAgICB9XG4gICAgY29uc3QgcmV0VmFsID0gbmV3IFR5cGUoe1tUeXBlLiRpZF06IGlkfSwgdGhpcyk7XG4gICAgcmV0dXJuIHJldFZhbDtcbiAgfVxuXG4gIC8vIExPQUQgKHR5cGUvaWQpLCBTSURFTE9BRCAodHlwZS9pZC9zaWRlKT8gT3IganVzdCBMT0FEQUxMP1xuICAvLyBMT0FEIG5lZWRzIHRvIHNjcnViIHRocm91Z2ggaG90IGNhY2hlcyBmaXJzdFxuXG4gIHN1YnNjcmliZSh0eXBlTmFtZSwgaWQsIGhhbmRsZXIpIHtcbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXSA9IHt9O1xuICAgIH1cbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdW2lkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV1baWRdID0gbmV3IFJ4LlN1YmplY3QoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXVtpZF0uc3Vic2NyaWJlKGhhbmRsZXIpO1xuICB9XG5cbiAgZ2V0KC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmFnZV0ucmVkdWNlKCh0aGVuYWJsZSwgc3RvcmFnZSkgPT4ge1xuICAgICAgcmV0dXJuIHRoZW5hYmxlLnRoZW4oKHYpID0+IHtcbiAgICAgICAgaWYgKHYgIT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gc3RvcmFnZS5yZWFkKC4uLmFyZ3MpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LCBQcm9taXNlLnJlc29sdmUobnVsbCkpXG4gICAgLnRoZW4oKHYpID0+IHtcbiAgICAgIGlmICgodiA9PT0gbnVsbCkgJiYgKHRoaXNbJHRlcm1pbmFsXSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZWFkKC4uLmFyZ3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgICB9XG4gICAgfSkudGhlbigodikgPT4ge1xuICAgICAgcmV0dXJuIHY7XG4gICAgfSk7XG4gIH1cblxuICBzYXZlKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLndyaXRlKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdHdWlsZCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgYWRkKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLmFkZCguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignR3VpbGQgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIG1vZGlmeVJlbGF0aW9uc2hpcCguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5tb2RpZnlSZWxhdGlvbnNoaXAoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0d1aWxkIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICByZW1vdmUoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVtb3ZlKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdHdWlsZCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgZm9yZ2UodCwgdmFsKSB7XG4gICAgbGV0IFR5cGUgPSB0O1xuICAgIGlmICh0eXBlb2YgdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIFR5cGUgPSB0aGlzWyR0eXBlc11bdF07XG4gICAgfVxuICAgIHJldHVybiBuZXcgVHlwZSh2YWwsIHRoaXMpO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
