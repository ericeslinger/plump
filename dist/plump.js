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

var _testType = require('./test/testType');

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
    value: function get(type, id, keyOpts) {
      var _this5 = this;

      var keys = keyOpts;
      if (!keys) {
        keys = [_model.$self];
      }
      if (!Array.isArray(keys)) {
        keys = [keys];
      }
      return this[$storage].reduce(function (thenable, storage) {
        return thenable.then(function (v) {
          if (v !== null) {
            return v;
          } else if (storage.hot(type, id)) {
            return storage.read(type, id, keys);
          } else {
            return null;
          }
        });
      }, Promise.resolve(null)).then(function (v) {
        if ((v === null || v[_model.$self] === null) && _this5[$terminal]) {
          return _this5[$terminal].read(type, id, keys);
        } else {
          return v;
        }
      }).then(function (v) {
        return v;
      });
    }
  }, {
    key: 'streamGet',
    value: function streamGet(type, id, keyOpts) {
      var _this6 = this;

      var keys = keyOpts;
      if (!keys) {
        keys = [_model.$self];
      }
      if (!Array.isArray(keys)) {
        keys = [keys];
      }
      return _Rx.Observable.create(function (observer) {
        return _bluebird2.default.all(_this6[$storage].map(function (store) {
          return store.read(type, id, keys).then(function (v) {
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
            return _this6[$terminal].read(type, id, keys).then(function (val) {
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
    key: 'bulkGet',
    value: function bulkGet(opts) {
      // eslint-disable-line no-unused-vars
      return {
        children: [{
          id: 2,
          name: 'frotato',
          extended: { cohort: 2013 },
          children: [{
            child_id: 3,
            parent_id: 2
          }]
        }, {
          id: 3,
          name: 'rutabaga',
          extended: {}
        }]
      };
    }
  }, {
    key: 'save',
    value: function save() {
      if (this[$terminal]) {
        var _$terminal;

        return (_$terminal = this[$terminal]).write.apply(_$terminal, arguments);
      } else {
        return Promise.reject(new Error('Plump has no terminal store'));
      }
    }
  }, {
    key: 'delete',
    value: function _delete() {
      var _this7 = this;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (this[$terminal]) {
        var _$terminal2;

        return (_$terminal2 = this[$terminal]).delete.apply(_$terminal2, args).then(function () {
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
        var _$terminal3;

        return (_$terminal3 = this[$terminal]).add.apply(_$terminal3, arguments);
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
        var _$terminal4;

        return (_$terminal4 = this[$terminal]).modifyRelationship.apply(_$terminal4, arguments);
      } else {
        return Promise.reject(new Error('Plump has no terminal store'));
      }
    }
  }, {
    key: 'remove',
    value: function remove() {
      if (this[$terminal]) {
        var _$terminal5;

        return (_$terminal5 = this[$terminal]).remove.apply(_$terminal5, arguments);
      } else {
        return Promise.reject(new Error('Plump has no terminal store'));
      }
    }
  }, {
    key: 'invalidate',
    value: function invalidate(type, id, field) {
      var _this8 = this;

      var hots = this[$storage].filter(function (store) {
        return store.hot(type, id);
      });
      if (this[$terminal].hot(type, id)) {
        hots.push(this[$terminal]);
      }
      return _bluebird2.default.all(hots.map(function (store) {
        return store.wipe(type, id, field);
      })).then(function () {
        if (_this8[$subscriptions][type.$name] && _this8[$subscriptions][type.$name][id]) {
          return _this8[$terminal].read(type, id, field);
        } else {
          return null;
        }
      });
    }
  }]);

  return Plump;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBsdW1wLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHN1YnNjcmlwdGlvbnMiLCIkc3RvcmVTdWJzY3JpcHRpb25zIiwiUGx1bXAiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInN0b3JhZ2UiLCJ0eXBlcyIsImZvckVhY2giLCJzIiwiYWRkU3RvcmUiLCJ0IiwiYWRkVHlwZSIsInNjaGVtYSIsIkV4dGVuZGluZ01vZGVsIiwia2V5cyIsImsiLCJEeW5hbWljTW9kZWwiLCJmcm9tSlNPTiIsIlQiLCIkbmFtZSIsInVuZGVmaW5lZCIsIkVycm9yIiwic3RvcmUiLCJ0ZXJtaW5hbCIsInB1c2giLCJvblVwZGF0ZSIsInR5cGUiLCJpZCIsInZhbHVlIiwiZmllbGQiLCJ3cml0ZUhhc01hbnkiLCJ3cml0ZSIsIm5leHQiLCJUeXBlIiwicmV0VmFsIiwiJGlkIiwidmFsIiwidHlwZU5hbWUiLCJoYW5kbGVyIiwic3Vic2NyaWJlIiwidW5zdWJzY3JpYmUiLCJrZXlPcHRzIiwiQXJyYXkiLCJpc0FycmF5IiwicmVkdWNlIiwidGhlbmFibGUiLCJ0aGVuIiwidiIsImhvdCIsInJlYWQiLCJQcm9taXNlIiwicmVzb2x2ZSIsImNyZWF0ZSIsIm9ic2VydmVyIiwiYWxsIiwibWFwIiwidmFsQXJyYXkiLCJwb3NzaVZhbCIsImZpbHRlciIsImxlbmd0aCIsImNvbXBsZXRlIiwiY2hpbGRyZW4iLCJuYW1lIiwiZXh0ZW5kZWQiLCJjb2hvcnQiLCJjaGlsZF9pZCIsInBhcmVudF9pZCIsInJlamVjdCIsImFyZ3MiLCJkZWxldGUiLCJhZGQiLCJyZXN0IiwibW9kaWZ5UmVsYXRpb25zaGlwIiwicmVtb3ZlIiwiaG90cyIsIndpcGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7O0FBRUE7Ozs7Ozs7Ozs7OztBQUVBLElBQU1BLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FB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QUExQixFQUFpQ1EsRUFBakMsQ0FBeEMsRUFBOEU7QUFDNUUsaUJBQU8sT0FBSzlCLFNBQUwsRUFBZ0JvRCxJQUFoQixDQUFxQnZCLElBQXJCLEVBQTJCQyxFQUEzQixFQUErQkUsS0FBL0IsQ0FBUDtBQUNELFNBRkQsTUFFTztBQUNMLGlCQUFPLElBQVA7QUFDRDtBQUNGLE9BUk0sQ0FBUDtBQVNEIiwiZmlsZSI6InBsdW1wLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kZWwsICRzZWxmIH0gZnJvbSAnLi9tb2RlbCc7XG5pbXBvcnQgeyBTdWJqZWN0LCBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcy9SeCc7XG5pbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuXG5pbXBvcnQgeyBUZXN0VHlwZSB9IGZyb20gJy4vdGVzdC90ZXN0VHlwZSc7XG5cbmNvbnN0ICR0eXBlcyA9IFN5bWJvbCgnJHR5cGVzJyk7XG5jb25zdCAkc3RvcmFnZSA9IFN5bWJvbCgnJHN0b3JhZ2UnKTtcbmNvbnN0ICR0ZXJtaW5hbCA9IFN5bWJvbCgnJHRlcm1pbmFsJyk7XG5jb25zdCAkc3Vic2NyaXB0aW9ucyA9IFN5bWJvbCgnJHN1YnNjcmlwdGlvbnMnKTtcbmNvbnN0ICRzdG9yZVN1YnNjcmlwdGlvbnMgPSBTeW1ib2woJyRzdG9yZVN1YnNjcmlwdGlvbnMnKTtcblxuZXhwb3J0IGNsYXNzIFBsdW1wIHtcbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIHtcbiAgICAgIHN0b3JhZ2U6IFtdLFxuICAgICAgdHlwZXM6IFtdLFxuICAgIH0sIG9wdHMpO1xuICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdID0ge307XG4gICAgdGhpc1skc3RvcmVTdWJzY3JpcHRpb25zXSA9IFtdO1xuICAgIHRoaXNbJHN0b3JhZ2VdID0gW107XG4gICAgdGhpc1skdHlwZXNdID0ge307XG4gICAgb3B0aW9ucy5zdG9yYWdlLmZvckVhY2goKHMpID0+IHRoaXMuYWRkU3RvcmUocykpO1xuICAgIG9wdGlvbnMudHlwZXMuZm9yRWFjaCgodCkgPT4gdGhpcy5hZGRUeXBlKHQpKTtcbiAgfVxuXG4gIGFkZFR5cGVzRnJvbVNjaGVtYShzY2hlbWEsIEV4dGVuZGluZ01vZGVsID0gTW9kZWwpIHtcbiAgICBPYmplY3Qua2V5cyhzY2hlbWEpLmZvckVhY2goKGspID0+IHtcbiAgICAgIGNsYXNzIER5bmFtaWNNb2RlbCBleHRlbmRzIEV4dGVuZGluZ01vZGVsIHt9XG4gICAgICBEeW5hbWljTW9kZWwuZnJvbUpTT04oc2NoZW1hW2tdKTtcbiAgICAgIHRoaXMuYWRkVHlwZShEeW5hbWljTW9kZWwpO1xuICAgIH0pO1xuICB9XG5cbiAgYWRkVHlwZShUKSB7XG4gICAgaWYgKHRoaXNbJHR5cGVzXVtULiRuYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyR0eXBlc11bVC4kbmFtZV0gPSBUO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYER1cGxpY2F0ZSBUeXBlIHJlZ2lzdGVyZWQ6ICR7VC4kbmFtZX1gKTtcbiAgICB9XG4gIH1cblxuICB0eXBlKFQpIHtcbiAgICByZXR1cm4gdGhpc1skdHlwZXNdW1RdO1xuICB9XG5cbiAgdHlwZXMoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXNbJHR5cGVzXSk7XG4gIH1cblxuICBhZGRTdG9yZShzdG9yZSkge1xuICAgIGlmIChzdG9yZS50ZXJtaW5hbCkge1xuICAgICAgaWYgKHRoaXNbJHRlcm1pbmFsXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXNbJHRlcm1pbmFsXSA9IHN0b3JlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgaGF2ZSBtb3JlIHRoYW4gb25lIHRlcm1pbmFsIHN0b3JlJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXNbJHN0b3JhZ2VdLnB1c2goc3RvcmUpO1xuICAgIH1cbiAgICBpZiAoc3RvcmUudGVybWluYWwpIHtcbiAgICAgIHRoaXNbJHN0b3JlU3Vic2NyaXB0aW9uc10ucHVzaChzdG9yZS5vblVwZGF0ZSgoeyB0eXBlLCBpZCwgdmFsdWUsIGZpZWxkIH0pID0+IHtcbiAgICAgICAgdGhpc1skc3RvcmFnZV0uZm9yRWFjaCgoc3RvcmFnZSkgPT4ge1xuICAgICAgICAgIGlmIChmaWVsZCkge1xuICAgICAgICAgICAgc3RvcmFnZS53cml0ZUhhc01hbnkodHlwZSwgaWQsIGZpZWxkLCB2YWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0b3JhZ2Uud3JpdGUodHlwZSwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBzdG9yYWdlLm9uQ2FjaGVhYmxlUmVhZChUeXBlLCBPYmplY3QuYXNzaWduKHt9LCB1LnZhbHVlLCB7IFtUeXBlLiRpZF06IHUuaWQgfSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGUuJG5hbWVdICYmIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGUuJG5hbWVdW2lkXSkge1xuICAgICAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGUuJG5hbWVdW2lkXS5uZXh0KHsgZmllbGQsIHZhbHVlIH0pO1xuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgfVxuICB9XG5cbiAgZmluZCh0LCBpZCkge1xuICAgIGxldCBUeXBlID0gdDtcbiAgICBpZiAodHlwZW9mIHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBUeXBlID0gdGhpc1skdHlwZXNdW3RdO1xuICAgIH1cbiAgICBjb25zdCByZXRWYWwgPSBuZXcgVHlwZSh7IFtUeXBlLiRpZF06IGlkIH0sIHRoaXMpO1xuICAgIHJldHVybiByZXRWYWw7XG4gIH1cblxuICBmb3JnZSh0LCB2YWwpIHtcbiAgICBsZXQgVHlwZSA9IHQ7XG4gICAgaWYgKHR5cGVvZiB0ID09PSAnc3RyaW5nJykge1xuICAgICAgVHlwZSA9IHRoaXNbJHR5cGVzXVt0XTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBUeXBlKHZhbCwgdGhpcyk7XG4gIH1cblxuICAvLyBMT0FEICh0eXBlL2lkKSwgU0lERUxPQUQgKHR5cGUvaWQvc2lkZSk/IE9yIGp1c3QgTE9BREFMTD9cbiAgLy8gTE9BRCBuZWVkcyB0byBzY3J1YiB0aHJvdWdoIGhvdCBjYWNoZXMgZmlyc3RcblxuICBzdWJzY3JpYmUodHlwZU5hbWUsIGlkLCBoYW5kbGVyKSB7XG4gICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV0gPSB7fTtcbiAgICB9XG4gICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXVtpZF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdW2lkXSA9IG5ldyBTdWJqZWN0KCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV1baWRdLnN1YnNjcmliZShoYW5kbGVyKTtcbiAgfVxuXG4gIHRlYXJkb3duKCkge1xuICAgIHRoaXNbJHN0b3JlU3Vic2NyaXB0aW9uc10uZm9yRWFjaCgocykgPT4gcy51bnN1YnNjcmliZSgpKTtcbiAgICB0aGlzWyRzdWJzY3JpcHRpb25zXSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzWyRzdG9yZVN1YnNjcmlwdGlvbnNdID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgZ2V0KHR5cGUsIGlkLCBrZXlPcHRzKSB7XG4gICAgbGV0IGtleXMgPSBrZXlPcHRzO1xuICAgIGlmICgha2V5cykge1xuICAgICAga2V5cyA9IFskc2VsZl07XG4gICAgfVxuICAgIGlmICghQXJyYXkuaXNBcnJheShrZXlzKSkge1xuICAgICAga2V5cyA9IFtrZXlzXTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JhZ2VdLnJlZHVjZSgodGhlbmFibGUsIHN0b3JhZ2UpID0+IHtcbiAgICAgIHJldHVybiB0aGVuYWJsZS50aGVuKCh2KSA9PiB7XG4gICAgICAgIGlmICh2ICE9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RvcmFnZS5ob3QodHlwZSwgaWQpKSB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JhZ2UucmVhZCh0eXBlLCBpZCwga2V5cyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sIFByb21pc2UucmVzb2x2ZShudWxsKSlcbiAgICAudGhlbigodikgPT4ge1xuICAgICAgaWYgKCgodiA9PT0gbnVsbCkgfHwgKHZbJHNlbGZdID09PSBudWxsKSkgJiYgKHRoaXNbJHRlcm1pbmFsXSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZWFkKHR5cGUsIGlkLCBrZXlzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB2O1xuICAgICAgfVxuICAgIH0pLnRoZW4oKHYpID0+IHtcbiAgICAgIHJldHVybiB2O1xuICAgIH0pO1xuICB9XG5cbiAgc3RyZWFtR2V0KHR5cGUsIGlkLCBrZXlPcHRzKSB7XG4gICAgbGV0IGtleXMgPSBrZXlPcHRzO1xuICAgIGlmICgha2V5cykge1xuICAgICAga2V5cyA9IFskc2VsZl07XG4gICAgfVxuICAgIGlmICghQXJyYXkuaXNBcnJheShrZXlzKSkge1xuICAgICAga2V5cyA9IFtrZXlzXTtcbiAgICB9XG4gICAgcmV0dXJuIE9ic2VydmFibGUuY3JlYXRlKChvYnNlcnZlcikgPT4ge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbCgodGhpc1skc3RvcmFnZV0ubWFwKChzdG9yZSkgPT4ge1xuICAgICAgICByZXR1cm4gc3RvcmUucmVhZCh0eXBlLCBpZCwga2V5cylcbiAgICAgICAgLnRoZW4oKHYpID0+IHtcbiAgICAgICAgICBvYnNlcnZlci5uZXh0KHYpO1xuICAgICAgICAgIGlmIChzdG9yZS5ob3QodHlwZSwgaWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pKSlcbiAgICAgIC50aGVuKCh2YWxBcnJheSkgPT4ge1xuICAgICAgICBjb25zdCBwb3NzaVZhbCA9IHZhbEFycmF5LmZpbHRlcigodikgPT4gdiAhPT0gbnVsbCk7XG4gICAgICAgIGlmICgocG9zc2lWYWwubGVuZ3RoID09PSAwKSAmJiAodGhpc1skdGVybWluYWxdKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVhZCh0eXBlLCBpZCwga2V5cylcbiAgICAgICAgICAudGhlbigodmFsKSA9PiB7XG4gICAgICAgICAgICBvYnNlcnZlci5uZXh0KHZhbCk7XG4gICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBwb3NzaVZhbFswXTtcbiAgICAgICAgfVxuICAgICAgfSkudGhlbigodikgPT4ge1xuICAgICAgICBvYnNlcnZlci5jb21wbGV0ZSgpO1xuICAgICAgICByZXR1cm4gdjtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgYnVsa0dldChvcHRzKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICByZXR1cm4ge1xuICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAyLFxuICAgICAgICAgIG5hbWU6ICdmcm90YXRvJyxcbiAgICAgICAgICBleHRlbmRlZDogeyBjb2hvcnQ6IDIwMTMgfSxcbiAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBjaGlsZF9pZDogMyxcbiAgICAgICAgICAgICAgcGFyZW50X2lkOiAyLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IDMsXG4gICAgICAgICAgbmFtZTogJ3J1dGFiYWdhJyxcbiAgICAgICAgICBleHRlbmRlZDoge30sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH07XG4gIH1cblxuICBzYXZlKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLndyaXRlKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgZGVsZXRlKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLmRlbGV0ZSguLi5hcmdzKS50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbCh0aGlzWyRzdG9yYWdlXS5tYXAoKHN0b3JlKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JlLmRlbGV0ZSguLi5hcmdzKTtcbiAgICAgICAgfSkpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBhZGQoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0uYWRkKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgcmVzdFJlcXVlc3Qob3B0cykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0gJiYgdGhpc1skdGVybWluYWxdLnJlc3QpIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVzdChvcHRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignTm8gUmVzdCB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBtb2RpZnlSZWxhdGlvbnNoaXAoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ubW9kaWZ5UmVsYXRpb25zaGlwKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlbW92ZSguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIGludmFsaWRhdGUodHlwZSwgaWQsIGZpZWxkKSB7XG4gICAgY29uc3QgaG90cyA9IHRoaXNbJHN0b3JhZ2VdLmZpbHRlcigoc3RvcmUpID0+IHN0b3JlLmhvdCh0eXBlLCBpZCkpO1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0uaG90KHR5cGUsIGlkKSkge1xuICAgICAgaG90cy5wdXNoKHRoaXNbJHRlcm1pbmFsXSk7XG4gICAgfVxuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoaG90cy5tYXAoKHN0b3JlKSA9PiB7XG4gICAgICByZXR1cm4gc3RvcmUud2lwZSh0eXBlLCBpZCwgZmllbGQpO1xuICAgIH0pKS50aGVuKCgpID0+IHtcbiAgICAgIGlmICh0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlLiRuYW1lXSAmJiB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlLiRuYW1lXVtpZF0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZWFkKHR5cGUsIGlkLCBmaWVsZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIl19
