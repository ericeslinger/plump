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
    value: function addTypesFromSchema(schemata) {
      var ExtendingModel = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _model.Model;

      for (var k in schemata) {
        // eslint-disable-line guard-for-in
        var DynamicModel = function (_ExtendingModel) {
          _inherits(DynamicModel, _ExtendingModel);

          function DynamicModel() {
            _classCallCheck(this, DynamicModel);

            return _possibleConstructorReturn(this, (DynamicModel.__proto__ || Object.getPrototypeOf(DynamicModel)).apply(this, arguments));
          }

          return DynamicModel;
        }(ExtendingModel);

        DynamicModel.fromJSON(schemata[k]);
        this.addType(DynamicModel);
      }
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
      var _this3 = this;

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

          _this3[$storage].forEach(function (storage) {
            if (field) {
              storage.writeHasMany(type, id, field, value.relationships[field]);
            } else {
              storage.write(type, value);
            }
            // storage.onCacheableRead(Type, Object.assign({}, u.value, { [Type.$id]: u.id }));
          });
          if (_this3[$subscriptions][type.$name] && _this3[$subscriptions][type.$name][id]) {
            _this3[$subscriptions][type.$name][id].next({ field: field, value: value });
          }
        }));
      }
    }
  }, {
    key: 'find',
    value: function find(t, id) {
      var Type = typeof t === 'string' ? this[$types][t] : t;
      return new Type(_defineProperty({}, Type.$id, id), this);
    }
  }, {
    key: 'forge',
    value: function forge(t, val) {
      var Type = typeof t === 'string' ? this[$types][t] : t;
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
    value: function get(type, id, opts) {
      var _this4 = this;

      var keys = opts && !Array.isArray(opts) ? [opts] : opts;
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
        if ((v === null || v.attributes === null) && _this4[$terminal]) {
          return _this4[$terminal].read(type, id, keys);
        } else {
          return v;
        }
      });
    }
  }, {
    key: 'streamGet',
    value: function streamGet(type, id, opts) {
      var _this5 = this;

      var keys = opts && !Array.isArray(opts) ? [opts] : opts;
      return _Rx.Observable.create(function (observer) {
        return _bluebird2.default.all(_this5[$storage].map(function (store) {
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
          if (possiVal.length === 0 && _this5[$terminal]) {
            return _this5[$terminal].read(type, id, keys).then(function (val) {
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
    value: function bulkGet(root, opts) {
      return this[$terminal].bulkRead(root, opts);
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
      var _this6 = this;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (this[$terminal]) {
        var _$terminal2;

        return (_$terminal2 = this[$terminal]).delete.apply(_$terminal2, args).then(function () {
          return _bluebird2.default.all(_this6[$storage].map(function (store) {
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
      var _this7 = this;

      var hots = this[$storage].filter(function (store) {
        return store.hot(type, id);
      });
      if (this[$terminal].hot(type, id)) {
        hots.push(this[$terminal]);
      }
      return _bluebird2.default.all(hots.map(function (store) {
        return store.wipe(type, id, field);
      })).then(function () {
        if (_this7[$subscriptions][type.$name] && _this7[$subscriptions][type.$name][id]) {
          return _this7[$terminal].read(type, id, field);
        } else {
          return null;
        }
      });
    }
  }]);

  return Plump;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBsdW1wLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHN1YnNjcmlwdGlvbnMiLCIkc3RvcmVTdWJzY3JpcHRpb25zIiwiUGx1bXAiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInN0b3JhZ2UiLCJ0eXBlcyIsImZvckVhY2giLCJzIiwiYWRkU3RvcmUiLCJ0IiwiYWRkVHlwZSIsInNjaGVtYXRhIiwiRXh0ZW5kaW5nTW9kZWwiLCJrIiwiRHluYW1pY01vZGVsIiwiZnJvbUpTT04iLCJUIiwiJG5hbWUiLCJ1bmRlZmluZWQiLCJFcnJvciIsImtleXMiLCJzdG9yZSIsInRlcm1pbmFsIiwicHVzaCIsIm9uVXBkYXRlIiwidHlwZSIsImlkIiwidmFsdWUiLCJmaWVsZCIsIndyaXRlSGFzTWFueSIsInJlbGF0aW9uc2hpcHMiLCJ3cml0ZSIsIm5leHQiLCJUeXBlIiwiJGlkIiwidmFsIiwidHlwZU5hbWUiLCJoYW5kbGVyIiwic3Vic2NyaWJlIiwidW5zdWJzY3JpYmUiLCJBcnJheSIsImlzQXJyYXkiLCJyZWR1Y2UiLCJ0aGVuYWJsZSIsInRoZW4iLCJ2IiwiaG90IiwicmVhZCIsIlByb21pc2UiLCJyZXNvbHZlIiwiYXR0cmlidXRlcyIsImNyZWF0ZSIsIm9ic2VydmVyIiwiYWxsIiwibWFwIiwidmFsQXJyYXkiLCJwb3NzaVZhbCIsImZpbHRlciIsImxlbmd0aCIsImNvbXBsZXRlIiwicm9vdCIsImJ1bGtSZWFkIiwicmVqZWN0IiwiYXJncyIsImRlbGV0ZSIsImFkZCIsInJlc3QiLCJtb2RpZnlSZWxhdGlvbnNoaXAiLCJyZW1vdmUiLCJob3RzIiwid2lwZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0FBRUEsSUFBTUEsU0FBU0MsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNQyxXQUFXRCxPQUFPLFVBQVAsQ0FBakI7QUFDQSxJ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QUFzQixVQUFDcEMsS0FBRDtBQUFBLGVBQVdBLE1BQU15QixHQUFOLENBQVVyQixJQUFWLEVBQWdCQyxFQUFoQixDQUFYO0FBQUEsT0FBdEIsQ0FBYjtBQUNBLFVBQUksS0FBSzlCLFNBQUwsRUFBZ0JrRCxHQUFoQixDQUFvQnJCLElBQXBCLEVBQTBCQyxFQUExQixDQUFKLEVBQW1DO0FBQ2pDMkMsYUFBSzlDLElBQUwsQ0FBVSxLQUFLM0IsU0FBTCxDQUFWO0FBQ0Q7QUFDRCxhQUFPLG1CQUFTeUQsR0FBVCxDQUFhZ0IsS0FBS2YsR0FBTCxDQUFTLFVBQUNqQyxLQUFELEVBQVc7QUFDdEMsZUFBT0EsTUFBTWlELElBQU4sQ0FBVzdDLElBQVgsRUFBaUJDLEVBQWpCLEVBQXFCRSxLQUFyQixDQUFQO0FBQ0QsT0FGbUIsQ0FBYixFQUVIZ0IsSUFGRyxDQUVFLFlBQU07QUFDYixZQUFJLE9BQUsvQyxjQUFMLEVBQXFCNEIsS0FBS1IsS0FBMUIsS0FBb0MsT0FBS3BCLGNBQUwsRUFBcUI0QixLQUFLUixLQUExQixFQUFpQ1MsRUFBakMsQ0FBeEMsRUFBOEU7QUFDNUUsaUJBQU8sT0FBSzlCLFNBQUwsRUFBZ0JtRCxJQUFoQixDQUFxQnRCLElBQXJCLEVBQTJCQyxFQUEzQixFQUErQkUsS0FBL0IsQ0FBUDtBQUNELFNBRkQsTUFFTztBQUNMLGlCQUFPLElBQVA7QUFDRDtBQUNGLE9BUk0sQ0FBUDtBQVNEIiwiZmlsZSI6InBsdW1wLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kZWwgfSBmcm9tICcuL21vZGVsJztcbmltcG9ydCB7IFN1YmplY3QsIE9ic2VydmFibGUgfSBmcm9tICdyeGpzL1J4JztcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5cbmNvbnN0ICR0eXBlcyA9IFN5bWJvbCgnJHR5cGVzJyk7XG5jb25zdCAkc3RvcmFnZSA9IFN5bWJvbCgnJHN0b3JhZ2UnKTtcbmNvbnN0ICR0ZXJtaW5hbCA9IFN5bWJvbCgnJHRlcm1pbmFsJyk7XG5jb25zdCAkc3Vic2NyaXB0aW9ucyA9IFN5bWJvbCgnJHN1YnNjcmlwdGlvbnMnKTtcbmNvbnN0ICRzdG9yZVN1YnNjcmlwdGlvbnMgPSBTeW1ib2woJyRzdG9yZVN1YnNjcmlwdGlvbnMnKTtcblxuZXhwb3J0IGNsYXNzIFBsdW1wIHtcbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIHtcbiAgICAgIHN0b3JhZ2U6IFtdLFxuICAgICAgdHlwZXM6IFtdLFxuICAgIH0sIG9wdHMpO1xuICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdID0ge307XG4gICAgdGhpc1skc3RvcmVTdWJzY3JpcHRpb25zXSA9IFtdO1xuICAgIHRoaXNbJHN0b3JhZ2VdID0gW107XG4gICAgdGhpc1skdHlwZXNdID0ge307XG4gICAgb3B0aW9ucy5zdG9yYWdlLmZvckVhY2goKHMpID0+IHRoaXMuYWRkU3RvcmUocykpO1xuICAgIG9wdGlvbnMudHlwZXMuZm9yRWFjaCgodCkgPT4gdGhpcy5hZGRUeXBlKHQpKTtcbiAgfVxuXG4gIGFkZFR5cGVzRnJvbVNjaGVtYShzY2hlbWF0YSwgRXh0ZW5kaW5nTW9kZWwgPSBNb2RlbCkge1xuICAgIGZvciAoY29uc3QgayBpbiBzY2hlbWF0YSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGd1YXJkLWZvci1pblxuICAgICAgY2xhc3MgRHluYW1pY01vZGVsIGV4dGVuZHMgRXh0ZW5kaW5nTW9kZWwge31cbiAgICAgIER5bmFtaWNNb2RlbC5mcm9tSlNPTihzY2hlbWF0YVtrXSk7XG4gICAgICB0aGlzLmFkZFR5cGUoRHluYW1pY01vZGVsKTtcbiAgICB9XG4gIH1cblxuICBhZGRUeXBlKFQpIHtcbiAgICBpZiAodGhpc1skdHlwZXNdW1QuJG5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHR5cGVzXVtULiRuYW1lXSA9IFQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRHVwbGljYXRlIFR5cGUgcmVnaXN0ZXJlZDogJHtULiRuYW1lfWApO1xuICAgIH1cbiAgfVxuXG4gIHR5cGUoVCkge1xuICAgIHJldHVybiB0aGlzWyR0eXBlc11bVF07XG4gIH1cblxuICB0eXBlcygpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpc1skdHlwZXNdKTtcbiAgfVxuXG4gIGFkZFN0b3JlKHN0b3JlKSB7XG4gICAgaWYgKHN0b3JlLnRlcm1pbmFsKSB7XG4gICAgICBpZiAodGhpc1skdGVybWluYWxdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpc1skdGVybWluYWxdID0gc3RvcmU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBoYXZlIG1vcmUgdGhhbiBvbmUgdGVybWluYWwgc3RvcmUnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpc1skc3RvcmFnZV0ucHVzaChzdG9yZSk7XG4gICAgfVxuICAgIGlmIChzdG9yZS50ZXJtaW5hbCkge1xuICAgICAgdGhpc1skc3RvcmVTdWJzY3JpcHRpb25zXS5wdXNoKHN0b3JlLm9uVXBkYXRlKCh7IHR5cGUsIGlkLCB2YWx1ZSwgZmllbGQgfSkgPT4ge1xuICAgICAgICB0aGlzWyRzdG9yYWdlXS5mb3JFYWNoKChzdG9yYWdlKSA9PiB7XG4gICAgICAgICAgaWYgKGZpZWxkKSB7XG4gICAgICAgICAgICBzdG9yYWdlLndyaXRlSGFzTWFueSh0eXBlLCBpZCwgZmllbGQsIHZhbHVlLnJlbGF0aW9uc2hpcHNbZmllbGRdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RvcmFnZS53cml0ZSh0eXBlLCB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHN0b3JhZ2Uub25DYWNoZWFibGVSZWFkKFR5cGUsIE9iamVjdC5hc3NpZ24oe30sIHUudmFsdWUsIHsgW1R5cGUuJGlkXTogdS5pZCB9KSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV0gJiYgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV1baWRdKSB7XG4gICAgICAgICAgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV1baWRdLm5leHQoeyBmaWVsZCwgdmFsdWUgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9XG4gIH1cblxuICBmaW5kKHQsIGlkKSB7XG4gICAgY29uc3QgVHlwZSA9IHR5cGVvZiB0ID09PSAnc3RyaW5nJyA/IHRoaXNbJHR5cGVzXVt0XSA6IHQ7XG4gICAgcmV0dXJuIG5ldyBUeXBlKHsgW1R5cGUuJGlkXTogaWQgfSwgdGhpcyk7XG4gIH1cblxuICBmb3JnZSh0LCB2YWwpIHtcbiAgICBjb25zdCBUeXBlID0gdHlwZW9mIHQgPT09ICdzdHJpbmcnID8gdGhpc1skdHlwZXNdW3RdIDogdDtcbiAgICByZXR1cm4gbmV3IFR5cGUodmFsLCB0aGlzKTtcbiAgfVxuXG4gIC8vIExPQUQgKHR5cGUvaWQpLCBTSURFTE9BRCAodHlwZS9pZC9zaWRlKT8gT3IganVzdCBMT0FEQUxMP1xuICAvLyBMT0FEIG5lZWRzIHRvIHNjcnViIHRocm91Z2ggaG90IGNhY2hlcyBmaXJzdFxuXG4gIHN1YnNjcmliZSh0eXBlTmFtZSwgaWQsIGhhbmRsZXIpIHtcbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXSA9IHt9O1xuICAgIH1cbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdW2lkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV1baWRdID0gbmV3IFN1YmplY3QoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXVtpZF0uc3Vic2NyaWJlKGhhbmRsZXIpO1xuICB9XG5cbiAgdGVhcmRvd24oKSB7XG4gICAgdGhpc1skc3RvcmVTdWJzY3JpcHRpb25zXS5mb3JFYWNoKChzKSA9PiBzLnVuc3Vic2NyaWJlKCkpO1xuICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdID0gdW5kZWZpbmVkO1xuICAgIHRoaXNbJHN0b3JlU3Vic2NyaXB0aW9uc10gPSB1bmRlZmluZWQ7XG4gIH1cblxuICBnZXQodHlwZSwgaWQsIG9wdHMpIHtcbiAgICBjb25zdCBrZXlzID0gb3B0cyAmJiAhQXJyYXkuaXNBcnJheShvcHRzKSA/IFtvcHRzXSA6IG9wdHM7XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JhZ2VdLnJlZHVjZSgodGhlbmFibGUsIHN0b3JhZ2UpID0+IHtcbiAgICAgIHJldHVybiB0aGVuYWJsZS50aGVuKCh2KSA9PiB7XG4gICAgICAgIGlmICh2ICE9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RvcmFnZS5ob3QodHlwZSwgaWQpKSB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JhZ2UucmVhZCh0eXBlLCBpZCwga2V5cyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sIFByb21pc2UucmVzb2x2ZShudWxsKSlcbiAgICAudGhlbigodikgPT4ge1xuICAgICAgaWYgKCgodiA9PT0gbnVsbCkgfHwgKHYuYXR0cmlidXRlcyA9PT0gbnVsbCkpICYmICh0aGlzWyR0ZXJtaW5hbF0pKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVhZCh0eXBlLCBpZCwga2V5cyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdjtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHN0cmVhbUdldCh0eXBlLCBpZCwgb3B0cykge1xuICAgIGNvbnN0IGtleXMgPSBvcHRzICYmICFBcnJheS5pc0FycmF5KG9wdHMpID8gW29wdHNdIDogb3B0cztcbiAgICByZXR1cm4gT2JzZXJ2YWJsZS5jcmVhdGUoKG9ic2VydmVyKSA9PiB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKCh0aGlzWyRzdG9yYWdlXS5tYXAoKHN0b3JlKSA9PiB7XG4gICAgICAgIHJldHVybiBzdG9yZS5yZWFkKHR5cGUsIGlkLCBrZXlzKVxuICAgICAgICAudGhlbigodikgPT4ge1xuICAgICAgICAgIG9ic2VydmVyLm5leHQodik7XG4gICAgICAgICAgaWYgKHN0b3JlLmhvdCh0eXBlLCBpZCkpIHtcbiAgICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSkpKVxuICAgICAgLnRoZW4oKHZhbEFycmF5KSA9PiB7XG4gICAgICAgIGNvbnN0IHBvc3NpVmFsID0gdmFsQXJyYXkuZmlsdGVyKCh2KSA9PiB2ICE9PSBudWxsKTtcbiAgICAgICAgaWYgKChwb3NzaVZhbC5sZW5ndGggPT09IDApICYmICh0aGlzWyR0ZXJtaW5hbF0pKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZWFkKHR5cGUsIGlkLCBrZXlzKVxuICAgICAgICAgIC50aGVuKCh2YWwpID0+IHtcbiAgICAgICAgICAgIG9ic2VydmVyLm5leHQodmFsKTtcbiAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHBvc3NpVmFsWzBdO1xuICAgICAgICB9XG4gICAgICB9KS50aGVuKCh2KSA9PiB7XG4gICAgICAgIG9ic2VydmVyLmNvbXBsZXRlKCk7XG4gICAgICAgIHJldHVybiB2O1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBidWxrR2V0KHJvb3QsIG9wdHMpIHtcbiAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLmJ1bGtSZWFkKHJvb3QsIG9wdHMpO1xuICB9XG5cbiAgc2F2ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS53cml0ZSguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIGRlbGV0ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5kZWxldGUoLi4uYXJncykudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwodGhpc1skc3RvcmFnZV0ubWFwKChzdG9yZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBzdG9yZS5kZWxldGUoLi4uYXJncyk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgYWRkKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLmFkZCguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIHJlc3RSZXF1ZXN0KG9wdHMpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdICYmIHRoaXNbJHRlcm1pbmFsXS5yZXN0KSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlc3Qob3B0cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ05vIFJlc3QgdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLm1vZGlmeVJlbGF0aW9uc2hpcCguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZW1vdmUoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBpbnZhbGlkYXRlKHR5cGUsIGlkLCBmaWVsZCkge1xuICAgIGNvbnN0IGhvdHMgPSB0aGlzWyRzdG9yYWdlXS5maWx0ZXIoKHN0b3JlKSA9PiBzdG9yZS5ob3QodHlwZSwgaWQpKTtcbiAgICBpZiAodGhpc1skdGVybWluYWxdLmhvdCh0eXBlLCBpZCkpIHtcbiAgICAgIGhvdHMucHVzaCh0aGlzWyR0ZXJtaW5hbF0pO1xuICAgIH1cbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKGhvdHMubWFwKChzdG9yZSkgPT4ge1xuICAgICAgcmV0dXJuIHN0b3JlLndpcGUodHlwZSwgaWQsIGZpZWxkKTtcbiAgICB9KSkudGhlbigoKSA9PiB7XG4gICAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV0gJiYgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV1baWRdKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVhZCh0eXBlLCBpZCwgZmllbGQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==
