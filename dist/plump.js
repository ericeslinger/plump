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
  }]);

  return Plump;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBsdW1wLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHN1YnNjcmlwdGlvbnMiLCIkc3RvcmVTdWJzY3JpcHRpb25zIiwiUGx1bXAiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInN0b3JhZ2UiLCJ0eXBlcyIsImZvckVhY2giLCJzIiwiYWRkU3RvcmUiLCJ0IiwiYWRkVHlwZSIsInNjaGVtYSIsIkV4dGVuZGluZ01vZGVsIiwia2V5cyIsImsiLCJEeW5hbWljTW9kZWwiLCJmcm9tSlNPTiIsIlQiLCIkbmFtZSIsInVuZGVmaW5lZCIsIkVycm9yIiwic3RvcmUiLCJ0ZXJtaW5hbCIsInB1c2giLCJvblVwZGF0ZSIsInR5cGUiLCJpZCIsInZhbHVlIiwiZmllbGQiLCJ3cml0ZUhhc01hbnkiLCJ3cml0ZSIsIm5leHQiLCJUeXBlIiwicmV0VmFsIiwiJGlkIiwidmFsIiwidHlwZU5hbWUiLCJoYW5kbGVyIiwic3Vic2NyaWJlIiwidW5zdWJzY3JpYmUiLCJrZXlPcHRzIiwiQXJyYXkiLCJpc0FycmF5IiwicmVkdWNlIiwidGhlbmFibGUiLCJ0aGVuIiwidiIsImhvdCIsInJlYWQiLCJQcm9taXNlIiwicmVzb2x2ZSIsImNyZWF0ZSIsIm9ic2VydmVyIiwiYWxsIiwibWFwIiwidmFsQXJyYXkiLCJwb3NzaVZhbCIsImZpbHRlciIsImxlbmd0aCIsImNvbXBsZXRlIiwicmVqZWN0IiwiYXJncyIsImRlbGV0ZSIsImFkZCIsInJlc3QiLCJtb2RpZnlSZWxhdGlvbnNoaXAiLCJyZW1vdmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7Ozs7Ozs7Ozs7OztBQUVBLElBQU1BLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUMsV0FBV0QsT0FBTyxVQUFQLENBQWpCO0FBQ0EsSUFBTUUsWUFBWUYsT0FBTyxXQUFQLENBQWxCO0FBQ0EsSUFBTUcsaUJBQWlC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ZixDQUFQO0FBQ0Q7QUFDRiIsImZpbGUiOiJwbHVtcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vZGVsLCAkc2VsZiB9IGZyb20gJy4vbW9kZWwnO1xuaW1wb3J0IHsgU3ViamVjdCwgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMvUngnO1xuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcblxuY29uc3QgJHR5cGVzID0gU3ltYm9sKCckdHlwZXMnKTtcbmNvbnN0ICRzdG9yYWdlID0gU3ltYm9sKCckc3RvcmFnZScpO1xuY29uc3QgJHRlcm1pbmFsID0gU3ltYm9sKCckdGVybWluYWwnKTtcbmNvbnN0ICRzdWJzY3JpcHRpb25zID0gU3ltYm9sKCckc3Vic2NyaXB0aW9ucycpO1xuY29uc3QgJHN0b3JlU3Vic2NyaXB0aW9ucyA9IFN5bWJvbCgnJHN0b3JlU3Vic2NyaXB0aW9ucycpO1xuXG5leHBvcnQgY2xhc3MgUGx1bXAge1xuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwge1xuICAgICAgc3RvcmFnZTogW10sXG4gICAgICB0eXBlczogW10sXG4gICAgfSwgb3B0cyk7XG4gICAgdGhpc1skc3Vic2NyaXB0aW9uc10gPSB7fTtcbiAgICB0aGlzWyRzdG9yZVN1YnNjcmlwdGlvbnNdID0gW107XG4gICAgdGhpc1skc3RvcmFnZV0gPSBbXTtcbiAgICB0aGlzWyR0eXBlc10gPSB7fTtcbiAgICBvcHRpb25zLnN0b3JhZ2UuZm9yRWFjaCgocykgPT4gdGhpcy5hZGRTdG9yZShzKSk7XG4gICAgb3B0aW9ucy50eXBlcy5mb3JFYWNoKCh0KSA9PiB0aGlzLmFkZFR5cGUodCkpO1xuICB9XG5cbiAgYWRkVHlwZXNGcm9tU2NoZW1hKHNjaGVtYSwgRXh0ZW5kaW5nTW9kZWwgPSBNb2RlbCkge1xuICAgIE9iamVjdC5rZXlzKHNjaGVtYSkuZm9yRWFjaCgoaykgPT4ge1xuICAgICAgY2xhc3MgRHluYW1pY01vZGVsIGV4dGVuZHMgRXh0ZW5kaW5nTW9kZWwge31cbiAgICAgIER5bmFtaWNNb2RlbC5mcm9tSlNPTihzY2hlbWFba10pO1xuICAgICAgdGhpcy5hZGRUeXBlKER5bmFtaWNNb2RlbCk7XG4gICAgfSk7XG4gIH1cblxuICBhZGRUeXBlKFQpIHtcbiAgICBpZiAodGhpc1skdHlwZXNdW1QuJG5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHR5cGVzXVtULiRuYW1lXSA9IFQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRHVwbGljYXRlIFR5cGUgcmVnaXN0ZXJlZDogJHtULiRuYW1lfWApO1xuICAgIH1cbiAgfVxuXG4gIHR5cGUoVCkge1xuICAgIHJldHVybiB0aGlzWyR0eXBlc11bVF07XG4gIH1cblxuICB0eXBlcygpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpc1skdHlwZXNdKTtcbiAgfVxuXG4gIGFkZFN0b3JlKHN0b3JlKSB7XG4gICAgaWYgKHN0b3JlLnRlcm1pbmFsKSB7XG4gICAgICBpZiAodGhpc1skdGVybWluYWxdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpc1skdGVybWluYWxdID0gc3RvcmU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBoYXZlIG1vcmUgdGhhbiBvbmUgdGVybWluYWwgc3RvcmUnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpc1skc3RvcmFnZV0ucHVzaChzdG9yZSk7XG4gICAgfVxuICAgIGlmIChzdG9yZS50ZXJtaW5hbCkge1xuICAgICAgdGhpc1skc3RvcmVTdWJzY3JpcHRpb25zXS5wdXNoKHN0b3JlLm9uVXBkYXRlKCh7IHR5cGUsIGlkLCB2YWx1ZSwgZmllbGQgfSkgPT4ge1xuICAgICAgICB0aGlzWyRzdG9yYWdlXS5mb3JFYWNoKChzdG9yYWdlKSA9PiB7XG4gICAgICAgICAgaWYgKGZpZWxkKSB7XG4gICAgICAgICAgICBzdG9yYWdlLndyaXRlSGFzTWFueSh0eXBlLCBpZCwgZmllbGQsIHZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RvcmFnZS53cml0ZSh0eXBlLCB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHN0b3JhZ2Uub25DYWNoZWFibGVSZWFkKFR5cGUsIE9iamVjdC5hc3NpZ24oe30sIHUudmFsdWUsIHsgW1R5cGUuJGlkXTogdS5pZCB9KSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV0gJiYgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV1baWRdKSB7XG4gICAgICAgICAgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV1baWRdLm5leHQoeyBmaWVsZCwgdmFsdWUgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9XG4gIH1cblxuICBmaW5kKHQsIGlkKSB7XG4gICAgbGV0IFR5cGUgPSB0O1xuICAgIGlmICh0eXBlb2YgdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIFR5cGUgPSB0aGlzWyR0eXBlc11bdF07XG4gICAgfVxuICAgIGNvbnN0IHJldFZhbCA9IG5ldyBUeXBlKHsgW1R5cGUuJGlkXTogaWQgfSwgdGhpcyk7XG4gICAgcmV0dXJuIHJldFZhbDtcbiAgfVxuXG4gIGZvcmdlKHQsIHZhbCkge1xuICAgIGxldCBUeXBlID0gdDtcbiAgICBpZiAodHlwZW9mIHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBUeXBlID0gdGhpc1skdHlwZXNdW3RdO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFR5cGUodmFsLCB0aGlzKTtcbiAgfVxuXG4gIC8vIExPQUQgKHR5cGUvaWQpLCBTSURFTE9BRCAodHlwZS9pZC9zaWRlKT8gT3IganVzdCBMT0FEQUxMP1xuICAvLyBMT0FEIG5lZWRzIHRvIHNjcnViIHRocm91Z2ggaG90IGNhY2hlcyBmaXJzdFxuXG4gIHN1YnNjcmliZSh0eXBlTmFtZSwgaWQsIGhhbmRsZXIpIHtcbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXSA9IHt9O1xuICAgIH1cbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdW2lkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV1baWRdID0gbmV3IFN1YmplY3QoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXVtpZF0uc3Vic2NyaWJlKGhhbmRsZXIpO1xuICB9XG5cbiAgdGVhcmRvd24oKSB7XG4gICAgdGhpc1skc3RvcmVTdWJzY3JpcHRpb25zXS5mb3JFYWNoKChzKSA9PiBzLnVuc3Vic2NyaWJlKCkpO1xuICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdID0gdW5kZWZpbmVkO1xuICAgIHRoaXNbJHN0b3JlU3Vic2NyaXB0aW9uc10gPSB1bmRlZmluZWQ7XG4gIH1cblxuICBnZXQodHlwZSwgaWQsIGtleU9wdHMpIHtcbiAgICBsZXQga2V5cyA9IGtleU9wdHM7XG4gICAgaWYgKCFrZXlzKSB7XG4gICAgICBrZXlzID0gWyRzZWxmXTtcbiAgICB9XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGtleXMpKSB7XG4gICAgICBrZXlzID0gW2tleXNdO1xuICAgIH1cbiAgICByZXR1cm4gdGhpc1skc3RvcmFnZV0ucmVkdWNlKCh0aGVuYWJsZSwgc3RvcmFnZSkgPT4ge1xuICAgICAgcmV0dXJuIHRoZW5hYmxlLnRoZW4oKHYpID0+IHtcbiAgICAgICAgaWYgKHYgIT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfSBlbHNlIGlmIChzdG9yYWdlLmhvdCh0eXBlLCBpZCkpIHtcbiAgICAgICAgICByZXR1cm4gc3RvcmFnZS5yZWFkKHR5cGUsIGlkLCBrZXlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSwgUHJvbWlzZS5yZXNvbHZlKG51bGwpKVxuICAgIC50aGVuKCh2KSA9PiB7XG4gICAgICBpZiAoKCh2ID09PSBudWxsKSB8fCAodlskc2VsZl0gPT09IG51bGwpKSAmJiAodGhpc1skdGVybWluYWxdKSkge1xuICAgICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlYWQodHlwZSwgaWQsIGtleXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgICB9XG4gICAgfSkudGhlbigodikgPT4ge1xuICAgICAgcmV0dXJuIHY7XG4gICAgfSk7XG4gIH1cblxuICBzdHJlYW1HZXQodHlwZSwgaWQsIGtleU9wdHMpIHtcbiAgICBsZXQga2V5cyA9IGtleU9wdHM7XG4gICAgaWYgKCFrZXlzKSB7XG4gICAgICBrZXlzID0gWyRzZWxmXTtcbiAgICB9XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGtleXMpKSB7XG4gICAgICBrZXlzID0gW2tleXNdO1xuICAgIH1cbiAgICByZXR1cm4gT2JzZXJ2YWJsZS5jcmVhdGUoKG9ic2VydmVyKSA9PiB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKCh0aGlzWyRzdG9yYWdlXS5tYXAoKHN0b3JlKSA9PiB7XG4gICAgICAgIHJldHVybiBzdG9yZS5yZWFkKHR5cGUsIGlkLCBrZXlzKVxuICAgICAgICAudGhlbigodikgPT4ge1xuICAgICAgICAgIG9ic2VydmVyLm5leHQodik7XG4gICAgICAgICAgaWYgKHN0b3JlLmhvdCh0eXBlLCBpZCkpIHtcbiAgICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSkpKVxuICAgICAgLnRoZW4oKHZhbEFycmF5KSA9PiB7XG4gICAgICAgIGNvbnN0IHBvc3NpVmFsID0gdmFsQXJyYXkuZmlsdGVyKCh2KSA9PiB2ICE9PSBudWxsKTtcbiAgICAgICAgaWYgKChwb3NzaVZhbC5sZW5ndGggPT09IDApICYmICh0aGlzWyR0ZXJtaW5hbF0pKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZWFkKHR5cGUsIGlkLCBrZXlzKVxuICAgICAgICAgIC50aGVuKCh2YWwpID0+IHtcbiAgICAgICAgICAgIG9ic2VydmVyLm5leHQodmFsKTtcbiAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHBvc3NpVmFsWzBdO1xuICAgICAgICB9XG4gICAgICB9KS50aGVuKCh2KSA9PiB7XG4gICAgICAgIG9ic2VydmVyLmNvbXBsZXRlKCk7XG4gICAgICAgIHJldHVybiB2O1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzYXZlKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLndyaXRlKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgZGVsZXRlKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLmRlbGV0ZSguLi5hcmdzKS50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbCh0aGlzWyRzdG9yYWdlXS5tYXAoKHN0b3JlKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JlLmRlbGV0ZSguLi5hcmdzKTtcbiAgICAgICAgfSkpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBhZGQoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0uYWRkKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgcmVzdFJlcXVlc3Qob3B0cykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0gJiYgdGhpc1skdGVybWluYWxdLnJlc3QpIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVzdChvcHRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignTm8gUmVzdCB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBtb2RpZnlSZWxhdGlvbnNoaXAoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ubW9kaWZ5UmVsYXRpb25zaGlwKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlbW92ZSguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxufVxuIl19
