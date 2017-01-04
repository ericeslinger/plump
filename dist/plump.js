'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Plump = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _model = require('./model');

var _Rx = require('rxjs/Rx');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $types = Symbol('$types');
var $storage = Symbol('$storage');
var $terminal = Symbol('$terminal');
var $subscriptions = Symbol('$subscriptions');
var $storeSubscriptions = Symbol('$storeSubscriptions');

var Plump = exports.Plump = function () {
  function Plump() {
    var _this = this;

    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Plump);

    var options = Object.assign({}, {
      storage: [],
      types: []
    }, opts);
    this[$subscriptions] = {};
    this[$storeSubscriptions] = [];
    this[$storage] = [];
    this[$types] = {};
    options.storage.forEach(function (s) {
      return _this.addStore(s);
    });
    options.types.forEach(function (t) {
      return _this.addType(t);
    });
  }

  _createClass(Plump, [{
    key: 'addTypesFromSchema',
    value: function addTypesFromSchema(schema) {
      var _this3 = this;

      var ExtendingModel = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _model.Model;

      Object.keys(schema).forEach(function (k) {
        var DynamicModel = function (_ExtendingModel) {
          _inherits(DynamicModel, _ExtendingModel);

          function DynamicModel() {
            _classCallCheck(this, DynamicModel);

            return _possibleConstructorReturn(this, (DynamicModel.__proto__ || Object.getPrototypeOf(DynamicModel)).apply(this, arguments));
          }

          return DynamicModel;
        }(ExtendingModel);

        DynamicModel.fromJSON(schema[k]);
        _this3.addType(DynamicModel);
      });
    }
  }, {
    key: 'addType',
    value: function addType(T) {
      if (this[$types][T.$name] === undefined) {
        this[$types][T.$name] = T;
      } else {
        throw new Error('Duplicate Type registered: ' + T.$name);
      }
    }
  }, {
    key: 'type',
    value: function type(T) {
      return this[$types][T];
    }
  }, {
    key: 'types',
    value: function types() {
      return Object.keys(this[$types]);
    }
  }, {
    key: 'addStore',
    value: function addStore(store) {
      var _this4 = this;

      if (store.terminal) {
        if (this[$terminal] === undefined) {
          this[$terminal] = store;
        } else {
          throw new Error('cannot have more than one terminal store');
        }
      } else {
        this[$storage].push(store);
      }
      if (store.terminal) {
        this[$storeSubscriptions].push(store.onUpdate(function (_ref) {
          var type = _ref.type,
              id = _ref.id,
              value = _ref.value,
              field = _ref.field;

          _this4[$storage].forEach(function (storage) {
            if (field) {
              storage.writeHasMany(type, id, field, value);
            } else {
              storage.write(type, value);
            }
            // storage.onCacheableRead(Type, Object.assign({}, u.value, { [Type.$id]: u.id }));
          });
          if (_this4[$subscriptions][type.$name] && _this4[$subscriptions][type.$name][id]) {
            _this4[$subscriptions][type.$name][id].next({ field: field, value: value });
          }
        }));
      }
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
  }, {
    key: 'forge',
    value: function forge(t, val) {
      var Type = t;
      if (typeof t === 'string') {
        Type = this[$types][t];
      }
      return new Type(val, this);
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
        this[$subscriptions][typeName][id] = new _Rx.Subject();
      }
      return this[$subscriptions][typeName][id].subscribe(handler);
    }
  }, {
    key: 'teardown',
    value: function teardown() {
      this[$storeSubscriptions].forEach(function (s) {
        return s.unsubscribe();
      });
      this[$subscriptions] = undefined;
      this[$storeSubscriptions] = undefined;
    }
  }, {
    key: 'get',
    value: function get() {
      var _this5 = this;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return this[$storage].reduce(function (thenable, storage) {
        return thenable.then(function (v) {
          if (v !== null) {
            return v;
          } else if (storage.hot.apply(storage, args)) {
            return storage.read.apply(storage, args);
          } else {
            return null;
          }
        });
      }, Promise.resolve(null)).then(function (v) {
        if ((v === null || v[_model.$self] === null) && _this5[$terminal]) {
          var _$terminal;

          return (_$terminal = _this5[$terminal]).read.apply(_$terminal, args);
        } else {
          return v;
        }
      }).then(function (v) {
        return v;
      });
    }
  }, {
    key: 'streamGet',
    value: function streamGet(type, id) {
      var _this6 = this;

      var key = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _model.$self;

      return _Rx.Observable.create(function (observer) {
        return _bluebird2.default.all(_this6[$storage].map(function (store) {
          return store.read(type, id, key).then(function (v) {
            observer.next(v);
            if (store.hot(type, id)) {
              return v;
            } else {
              return null;
            }
          });
        })).then(function (valArray) {
          var possiVal = valArray.filter(function (v) {
            return v !== null;
          });
          if (possiVal.length === 0 && _this6[$terminal]) {
            return _this6[$terminal].read(type, id, key).then(function (val) {
              observer.next(val);
              return val;
            });
          } else {
            return possiVal[0];
          }
        }).then(function (v) {
          observer.complete();
          return v;
        });
      });
    }
  }, {
    key: 'save',
    value: function save() {
      if (this[$terminal]) {
        var _$terminal2;

        return (_$terminal2 = this[$terminal]).write.apply(_$terminal2, arguments);
      } else {
        return Promise.reject(new Error('Plump has no terminal store'));
      }
    }
  }, {
    key: 'delete',
    value: function _delete() {
      var _this7 = this;

      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      if (this[$terminal]) {
        var _$terminal3;

        return (_$terminal3 = this[$terminal]).delete.apply(_$terminal3, args).then(function () {
          return _bluebird2.default.all(_this7[$storage].map(function (store) {
            return store.delete.apply(store, args);
          }));
        });
      } else {
        return Promise.reject(new Error('Plump has no terminal store'));
      }
    }
  }, {
    key: 'add',
    value: function add() {
      if (this[$terminal]) {
        var _$terminal4;

        return (_$terminal4 = this[$terminal]).add.apply(_$terminal4, arguments);
      } else {
        return Promise.reject(new Error('Plump has no terminal store'));
      }
    }
  }, {
    key: 'restRequest',
    value: function restRequest(opts) {
      if (this[$terminal] && this[$terminal].rest) {
        return this[$terminal].rest(opts);
      } else {
        return Promise.reject(new Error('No Rest terminal store'));
      }
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship() {
      if (this[$terminal]) {
        var _$terminal5;

        return (_$terminal5 = this[$terminal]).modifyRelationship.apply(_$terminal5, arguments);
      } else {
        return Promise.reject(new Error('Plump has no terminal store'));
      }
    }
  }, {
    key: 'remove',
    value: function remove() {
      if (this[$terminal]) {
        var _$terminal6;

        return (_$terminal6 = this[$terminal]).remove.apply(_$terminal6, arguments);
      } else {
        return Promise.reject(new Error('Plump has no terminal store'));
      }
    }
  }]);

  return Plump;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBsdW1wLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHN1YnNjcmlwdGlvbnMiLCIkc3RvcmVTdWJzY3JpcHRpb25zIiwiUGx1bXAiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInN0b3JhZ2UiLCJ0eXBlcyIsImZvckVhY2giLCJzIiwiYWRkU3RvcmUiLCJ0IiwiYWRkVHlwZSIsInNjaGVtYSIsIkV4dGVuZGluZ01vZGVsIiwia2V5cyIsImsiLCJEeW5hbWljTW9kZWwiLCJmcm9tSlNPTiIsIlQiLCIkbmFtZSIsInVuZGVmaW5lZCIsIkVycm9yIiwic3RvcmUiLCJ0ZXJtaW5hbCIsInB1c2giLCJvblVwZGF0ZSIsInR5cGUiLCJpZCIsInZhbHVlIiwiZmllbGQiLCJ3cml0ZUhhc01hbnkiLCJ3cml0ZSIsIm5leHQiLCJUeXBlIiwicmV0VmFsIiwiJGlkIiwidmFsIiwidHlwZU5hbWUiLCJoYW5kbGVyIiwic3Vic2NyaWJlIiwidW5zdWJzY3JpYmUiLCJhcmdzIiwicmVkdWNlIiwidGhlbmFibGUiLCJ0aGVuIiwidiIsImhvdCIsInJlYWQiLCJQcm9taXNlIiwicmVzb2x2ZSIsImtleSIsImNyZWF0ZSIsIm9ic2VydmVyIiwiYWxsIiwibWFwIiwidmFsQXJyYXkiLCJwb3NzaVZhbCIsImZpbHRlciIsImxlbmd0aCIsImNvbXBsZXRlIiwicmVqZWN0IiwiZGVsZXRlIiwiYWRkIiwicmVzdCIsIm1vZGlmeVJlbGF0aW9uc2hpcCIsInJlbW92ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0FBRUEsSUFBTUEsU0FBU0MsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNQyxXQUFXRCxPQUFPLFVBQVAsQ0FBakI7QUFDQSxJQUFNRSxZQUFZRixPQUFPLFdBQVAsQ0FBbEI7QUFDQSxJQUFNRyxpQkFBaUJILE9BQU8sZ0JBQVAsQ0FBdkI7QUFD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LEtBQUtKLFNBQUwsS0FBbUIsS0FBS0EsU0FBTCxFQUFnQmtFLElBQXZDLEVBQTZDO0FBQzNDLGVBQU8sS0FBS2xFLFNBQUwsRUFBZ0JrRSxJQUFoQixDQUFxQjlELElBQXJCLENBQVA7QUFDRCxPQUZELE1BRU87QUFDTCxlQUFPK0MsUUFBUVksTUFBUixDQUFlLElBQUl2QyxLQUFKLENBQVUsd0JBQVYsQ0FBZixDQUFQO0FBQ0Q7QUFDRjs7O3lDQUUyQjtBQUMxQixVQUFJLEtBQUt4QixTQUFMLENBQUosRUFBcUI7QUFBQTs7QUFDbkIsZUFBTyxvQkFBS0EsU0FBTCxHQUFnQm1FLGtCQUFoQiw4QkFBUDtBQUNELE9BRkQsTUFFTztBQUNMLGVBQU9oQixRQUFRWSxNQUFSLENBQWUsSUFBSXZDLEtBQUosQ0FBVSw2QkFBVixDQUFmLENBQVA7QUFDRDtBQUNGOzs7NkJBRWU7QUFDZCxVQUFJLEtBQUt4QixTQUFMLENBQUosRUFBcUI7QUFBQTs7QUFDbkIsZUFBTyxvQkFBS0EsU0FBTCxHQUFnQm9FLE1BQWhCLDhCQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBT2pCLFFBQVFZLE1BQVIsQ0FBZSxJQUFJdkMsS0FBSixDQUFVLDZCQUFWLENBQWYsQ0FBUDtBQUNEO0FBQ0YiLCJmaWxlIjoicGx1bXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2RlbCwgJHNlbGYgfSBmcm9tICcuL21vZGVsJztcbmltcG9ydCB7IFN1YmplY3QsIE9ic2VydmFibGUgfSBmcm9tICdyeGpzL1J4JztcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5cbmNvbnN0ICR0eXBlcyA9IFN5bWJvbCgnJHR5cGVzJyk7XG5jb25zdCAkc3RvcmFnZSA9IFN5bWJvbCgnJHN0b3JhZ2UnKTtcbmNvbnN0ICR0ZXJtaW5hbCA9IFN5bWJvbCgnJHRlcm1pbmFsJyk7XG5jb25zdCAkc3Vic2NyaXB0aW9ucyA9IFN5bWJvbCgnJHN1YnNjcmlwdGlvbnMnKTtcbmNvbnN0ICRzdG9yZVN1YnNjcmlwdGlvbnMgPSBTeW1ib2woJyRzdG9yZVN1YnNjcmlwdGlvbnMnKTtcblxuZXhwb3J0IGNsYXNzIFBsdW1wIHtcbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIHtcbiAgICAgIHN0b3JhZ2U6IFtdLFxuICAgICAgdHlwZXM6IFtdLFxuICAgIH0sIG9wdHMpO1xuICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdID0ge307XG4gICAgdGhpc1skc3RvcmVTdWJzY3JpcHRpb25zXSA9IFtdO1xuICAgIHRoaXNbJHN0b3JhZ2VdID0gW107XG4gICAgdGhpc1skdHlwZXNdID0ge307XG4gICAgb3B0aW9ucy5zdG9yYWdlLmZvckVhY2goKHMpID0+IHRoaXMuYWRkU3RvcmUocykpO1xuICAgIG9wdGlvbnMudHlwZXMuZm9yRWFjaCgodCkgPT4gdGhpcy5hZGRUeXBlKHQpKTtcbiAgfVxuXG4gIGFkZFR5cGVzRnJvbVNjaGVtYShzY2hlbWEsIEV4dGVuZGluZ01vZGVsID0gTW9kZWwpIHtcbiAgICBPYmplY3Qua2V5cyhzY2hlbWEpLmZvckVhY2goKGspID0+IHtcbiAgICAgIGNsYXNzIER5bmFtaWNNb2RlbCBleHRlbmRzIEV4dGVuZGluZ01vZGVsIHt9XG4gICAgICBEeW5hbWljTW9kZWwuZnJvbUpTT04oc2NoZW1hW2tdKTtcbiAgICAgIHRoaXMuYWRkVHlwZShEeW5hbWljTW9kZWwpO1xuICAgIH0pO1xuICB9XG5cbiAgYWRkVHlwZShUKSB7XG4gICAgaWYgKHRoaXNbJHR5cGVzXVtULiRuYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyR0eXBlc11bVC4kbmFtZV0gPSBUO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYER1cGxpY2F0ZSBUeXBlIHJlZ2lzdGVyZWQ6ICR7VC4kbmFtZX1gKTtcbiAgICB9XG4gIH1cblxuICB0eXBlKFQpIHtcbiAgICByZXR1cm4gdGhpc1skdHlwZXNdW1RdO1xuICB9XG5cbiAgdHlwZXMoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXNbJHR5cGVzXSk7XG4gIH1cblxuICBhZGRTdG9yZShzdG9yZSkge1xuICAgIGlmIChzdG9yZS50ZXJtaW5hbCkge1xuICAgICAgaWYgKHRoaXNbJHRlcm1pbmFsXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXNbJHRlcm1pbmFsXSA9IHN0b3JlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgaGF2ZSBtb3JlIHRoYW4gb25lIHRlcm1pbmFsIHN0b3JlJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXNbJHN0b3JhZ2VdLnB1c2goc3RvcmUpO1xuICAgIH1cbiAgICBpZiAoc3RvcmUudGVybWluYWwpIHtcbiAgICAgIHRoaXNbJHN0b3JlU3Vic2NyaXB0aW9uc10ucHVzaChzdG9yZS5vblVwZGF0ZSgoeyB0eXBlLCBpZCwgdmFsdWUsIGZpZWxkIH0pID0+IHtcbiAgICAgICAgdGhpc1skc3RvcmFnZV0uZm9yRWFjaCgoc3RvcmFnZSkgPT4ge1xuICAgICAgICAgIGlmIChmaWVsZCkge1xuICAgICAgICAgICAgc3RvcmFnZS53cml0ZUhhc01hbnkodHlwZSwgaWQsIGZpZWxkLCB2YWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0b3JhZ2Uud3JpdGUodHlwZSwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBzdG9yYWdlLm9uQ2FjaGVhYmxlUmVhZChUeXBlLCBPYmplY3QuYXNzaWduKHt9LCB1LnZhbHVlLCB7IFtUeXBlLiRpZF06IHUuaWQgfSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGUuJG5hbWVdICYmIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGUuJG5hbWVdW2lkXSkge1xuICAgICAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGUuJG5hbWVdW2lkXS5uZXh0KHsgZmllbGQsIHZhbHVlIH0pO1xuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgfVxuICB9XG5cbiAgZmluZCh0LCBpZCkge1xuICAgIGxldCBUeXBlID0gdDtcbiAgICBpZiAodHlwZW9mIHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBUeXBlID0gdGhpc1skdHlwZXNdW3RdO1xuICAgIH1cbiAgICBjb25zdCByZXRWYWwgPSBuZXcgVHlwZSh7IFtUeXBlLiRpZF06IGlkIH0sIHRoaXMpO1xuICAgIHJldHVybiByZXRWYWw7XG4gIH1cblxuICBmb3JnZSh0LCB2YWwpIHtcbiAgICBsZXQgVHlwZSA9IHQ7XG4gICAgaWYgKHR5cGVvZiB0ID09PSAnc3RyaW5nJykge1xuICAgICAgVHlwZSA9IHRoaXNbJHR5cGVzXVt0XTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBUeXBlKHZhbCwgdGhpcyk7XG4gIH1cblxuICAvLyBMT0FEICh0eXBlL2lkKSwgU0lERUxPQUQgKHR5cGUvaWQvc2lkZSk/IE9yIGp1c3QgTE9BREFMTD9cbiAgLy8gTE9BRCBuZWVkcyB0byBzY3J1YiB0aHJvdWdoIGhvdCBjYWNoZXMgZmlyc3RcblxuICBzdWJzY3JpYmUodHlwZU5hbWUsIGlkLCBoYW5kbGVyKSB7XG4gICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV0gPSB7fTtcbiAgICB9XG4gICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXVtpZF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdW2lkXSA9IG5ldyBTdWJqZWN0KCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV1baWRdLnN1YnNjcmliZShoYW5kbGVyKTtcbiAgfVxuXG4gIHRlYXJkb3duKCkge1xuICAgIHRoaXNbJHN0b3JlU3Vic2NyaXB0aW9uc10uZm9yRWFjaCgocykgPT4gcy51bnN1YnNjcmliZSgpKTtcbiAgICB0aGlzWyRzdWJzY3JpcHRpb25zXSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzWyRzdG9yZVN1YnNjcmlwdGlvbnNdID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgZ2V0KC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmFnZV0ucmVkdWNlKCh0aGVuYWJsZSwgc3RvcmFnZSkgPT4ge1xuICAgICAgcmV0dXJuIHRoZW5hYmxlLnRoZW4oKHYpID0+IHtcbiAgICAgICAgaWYgKHYgIT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfSBlbHNlIGlmIChzdG9yYWdlLmhvdCguLi5hcmdzKSkge1xuICAgICAgICAgIHJldHVybiBzdG9yYWdlLnJlYWQoLi4uYXJncyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sIFByb21pc2UucmVzb2x2ZShudWxsKSlcbiAgICAudGhlbigodikgPT4ge1xuICAgICAgaWYgKCgodiA9PT0gbnVsbCkgfHwgKHZbJHNlbGZdID09PSBudWxsKSkgJiYgKHRoaXNbJHRlcm1pbmFsXSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZWFkKC4uLmFyZ3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgICB9XG4gICAgfSkudGhlbigodikgPT4ge1xuICAgICAgcmV0dXJuIHY7XG4gICAgfSk7XG4gIH1cblxuICBzdHJlYW1HZXQodHlwZSwgaWQsIGtleSA9ICRzZWxmKSB7XG4gICAgcmV0dXJuIE9ic2VydmFibGUuY3JlYXRlKChvYnNlcnZlcikgPT4ge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbCgodGhpc1skc3RvcmFnZV0ubWFwKChzdG9yZSkgPT4ge1xuICAgICAgICByZXR1cm4gc3RvcmUucmVhZCh0eXBlLCBpZCwga2V5KVxuICAgICAgICAudGhlbigodikgPT4ge1xuICAgICAgICAgIG9ic2VydmVyLm5leHQodik7XG4gICAgICAgICAgaWYgKHN0b3JlLmhvdCh0eXBlLCBpZCkpIHtcbiAgICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSkpKVxuICAgICAgLnRoZW4oKHZhbEFycmF5KSA9PiB7XG4gICAgICAgIGNvbnN0IHBvc3NpVmFsID0gdmFsQXJyYXkuZmlsdGVyKCh2KSA9PiB2ICE9PSBudWxsKTtcbiAgICAgICAgaWYgKChwb3NzaVZhbC5sZW5ndGggPT09IDApICYmICh0aGlzWyR0ZXJtaW5hbF0pKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZWFkKHR5cGUsIGlkLCBrZXkpXG4gICAgICAgICAgLnRoZW4oKHZhbCkgPT4ge1xuICAgICAgICAgICAgb2JzZXJ2ZXIubmV4dCh2YWwpO1xuICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gcG9zc2lWYWxbMF07XG4gICAgICAgIH1cbiAgICAgIH0pLnRoZW4oKHYpID0+IHtcbiAgICAgICAgb2JzZXJ2ZXIuY29tcGxldGUoKTtcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHNhdmUoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ud3JpdGUoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBkZWxldGUoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0uZGVsZXRlKC4uLmFyZ3MpLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKHRoaXNbJHN0b3JhZ2VdLm1hcCgoc3RvcmUpID0+IHtcbiAgICAgICAgICByZXR1cm4gc3RvcmUuZGVsZXRlKC4uLmFyZ3MpO1xuICAgICAgICB9KSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIGFkZCguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5hZGQoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICByZXN0UmVxdWVzdChvcHRzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSAmJiB0aGlzWyR0ZXJtaW5hbF0ucmVzdCkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZXN0KG9wdHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdObyBSZXN0IHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIG1vZGlmeVJlbGF0aW9uc2hpcCguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5tb2RpZnlSZWxhdGlvbnNoaXAoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICByZW1vdmUoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVtb3ZlKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG59XG4iXX0=
