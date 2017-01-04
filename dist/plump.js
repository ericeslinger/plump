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
          } else {
            return storage.read.apply(storage, args);
          }
        });
      }, Promise.resolve(null)).then(function (v) {
        if (v === null && _this5[$terminal]) {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBsdW1wLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHN1YnNjcmlwdGlvbnMiLCIkc3RvcmVTdWJzY3JpcHRpb25zIiwiUGx1bXAiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInN0b3JhZ2UiLCJ0eXBlcyIsImZvckVhY2giLCJzIiwiYWRkU3RvcmUiLCJ0IiwiYWRkVHlwZSIsInNjaGVtYSIsIkV4dGVuZGluZ01vZGVsIiwia2V5cyIsImsiLCJEeW5hbWljTW9kZWwiLCJmcm9tSlNPTiIsIlQiLCIkbmFtZSIsInVuZGVmaW5lZCIsIkVycm9yIiwic3RvcmUiLCJ0ZXJtaW5hbCIsInB1c2giLCJvblVwZGF0ZSIsInR5cGUiLCJpZCIsInZhbHVlIiwiZmllbGQiLCJ3cml0ZUhhc01hbnkiLCJ3cml0ZSIsIm5leHQiLCJUeXBlIiwicmV0VmFsIiwiJGlkIiwidmFsIiwidHlwZU5hbWUiLCJoYW5kbGVyIiwic3Vic2NyaWJlIiwidW5zdWJzY3JpYmUiLCJhcmdzIiwicmVkdWNlIiwidGhlbmFibGUiLCJ0aGVuIiwidiIsInJlYWQiLCJQcm9taXNlIiwicmVzb2x2ZSIsImtleSIsImNyZWF0ZSIsIm9ic2VydmVyIiwiYWxsIiwibWFwIiwiaG90IiwidmFsQXJyYXkiLCJwb3NzaVZhbCIsImZpbHRlciIsImxlbmd0aCIsImNvbXBsZXRlIiwicmVqZWN0IiwiZGVsZXRlIiwiYWRkIiwicmVzdCIsIm1vZGlmeVJlbGF0aW9uc2hpcCIsInJlbW92ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0FBRUEsSUFBTUEsU0FBU0MsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNQyxXQUFXRCxPQUFPLFVBQVAsQ0FBakI7QUFDQSxJQUFNRSxZQUFZRixPQUFPLFdBQVAsQ0FBbEI7QUFDQSxJQUFNRyxpQkFBaUJILE9BQU8sZ0JBQVAsQ0FBdkI7QUFD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UDtBQUNELE9BRkQsTUFFTztBQUNMLGVBQU84QyxRQUFRYSxNQUFSLENBQWUsSUFBSXZDLEtBQUosQ0FBVSx3QkFBVixDQUFmLENBQVA7QUFDRDtBQUNGOzs7eUNBRTJCO0FBQzFCLFVBQUksS0FBS3hCLFNBQUwsQ0FBSixFQUFxQjtBQUFBOztBQUNuQixlQUFPLG9CQUFLQSxTQUFMLEdBQWdCbUUsa0JBQWhCLDhCQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBT2pCLFFBQVFhLE1BQVIsQ0FBZSxJQUFJdkMsS0FBSixDQUFVLDZCQUFWLENBQWYsQ0FBUDtBQUNEO0FBQ0Y7Ozs2QkFFZTtBQUNkLFVBQUksS0FBS3hCLFNBQUwsQ0FBSixFQUFxQjtBQUFBOztBQUNuQixlQUFPLG9CQUFLQSxTQUFMLEdBQWdCb0UsTUFBaEIsOEJBQVA7QUFDRCxPQUZELE1BRU87QUFDTCxlQUFPbEIsUUFBUWEsTUFBUixDQUFlLElBQUl2QyxLQUFKLENBQVUsNkJBQVYsQ0FBZixDQUFQO0FBQ0Q7QUFDRiIsImZpbGUiOiJwbHVtcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vZGVsLCAkc2VsZiB9IGZyb20gJy4vbW9kZWwnO1xuaW1wb3J0IHsgU3ViamVjdCwgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMvUngnO1xuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcblxuY29uc3QgJHR5cGVzID0gU3ltYm9sKCckdHlwZXMnKTtcbmNvbnN0ICRzdG9yYWdlID0gU3ltYm9sKCckc3RvcmFnZScpO1xuY29uc3QgJHRlcm1pbmFsID0gU3ltYm9sKCckdGVybWluYWwnKTtcbmNvbnN0ICRzdWJzY3JpcHRpb25zID0gU3ltYm9sKCckc3Vic2NyaXB0aW9ucycpO1xuY29uc3QgJHN0b3JlU3Vic2NyaXB0aW9ucyA9IFN5bWJvbCgnJHN0b3JlU3Vic2NyaXB0aW9ucycpO1xuXG5leHBvcnQgY2xhc3MgUGx1bXAge1xuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwge1xuICAgICAgc3RvcmFnZTogW10sXG4gICAgICB0eXBlczogW10sXG4gICAgfSwgb3B0cyk7XG4gICAgdGhpc1skc3Vic2NyaXB0aW9uc10gPSB7fTtcbiAgICB0aGlzWyRzdG9yZVN1YnNjcmlwdGlvbnNdID0gW107XG4gICAgdGhpc1skc3RvcmFnZV0gPSBbXTtcbiAgICB0aGlzWyR0eXBlc10gPSB7fTtcbiAgICBvcHRpb25zLnN0b3JhZ2UuZm9yRWFjaCgocykgPT4gdGhpcy5hZGRTdG9yZShzKSk7XG4gICAgb3B0aW9ucy50eXBlcy5mb3JFYWNoKCh0KSA9PiB0aGlzLmFkZFR5cGUodCkpO1xuICB9XG5cbiAgYWRkVHlwZXNGcm9tU2NoZW1hKHNjaGVtYSwgRXh0ZW5kaW5nTW9kZWwgPSBNb2RlbCkge1xuICAgIE9iamVjdC5rZXlzKHNjaGVtYSkuZm9yRWFjaCgoaykgPT4ge1xuICAgICAgY2xhc3MgRHluYW1pY01vZGVsIGV4dGVuZHMgRXh0ZW5kaW5nTW9kZWwge31cbiAgICAgIER5bmFtaWNNb2RlbC5mcm9tSlNPTihzY2hlbWFba10pO1xuICAgICAgdGhpcy5hZGRUeXBlKER5bmFtaWNNb2RlbCk7XG4gICAgfSk7XG4gIH1cblxuICBhZGRUeXBlKFQpIHtcbiAgICBpZiAodGhpc1skdHlwZXNdW1QuJG5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHR5cGVzXVtULiRuYW1lXSA9IFQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRHVwbGljYXRlIFR5cGUgcmVnaXN0ZXJlZDogJHtULiRuYW1lfWApO1xuICAgIH1cbiAgfVxuXG4gIHR5cGUoVCkge1xuICAgIHJldHVybiB0aGlzWyR0eXBlc11bVF07XG4gIH1cblxuICB0eXBlcygpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpc1skdHlwZXNdKTtcbiAgfVxuXG4gIGFkZFN0b3JlKHN0b3JlKSB7XG4gICAgaWYgKHN0b3JlLnRlcm1pbmFsKSB7XG4gICAgICBpZiAodGhpc1skdGVybWluYWxdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpc1skdGVybWluYWxdID0gc3RvcmU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBoYXZlIG1vcmUgdGhhbiBvbmUgdGVybWluYWwgc3RvcmUnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpc1skc3RvcmFnZV0ucHVzaChzdG9yZSk7XG4gICAgfVxuICAgIGlmIChzdG9yZS50ZXJtaW5hbCkge1xuICAgICAgdGhpc1skc3RvcmVTdWJzY3JpcHRpb25zXS5wdXNoKHN0b3JlLm9uVXBkYXRlKCh7IHR5cGUsIGlkLCB2YWx1ZSwgZmllbGQgfSkgPT4ge1xuICAgICAgICB0aGlzWyRzdG9yYWdlXS5mb3JFYWNoKChzdG9yYWdlKSA9PiB7XG4gICAgICAgICAgaWYgKGZpZWxkKSB7XG4gICAgICAgICAgICBzdG9yYWdlLndyaXRlSGFzTWFueSh0eXBlLCBpZCwgZmllbGQsIHZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RvcmFnZS53cml0ZSh0eXBlLCB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHN0b3JhZ2Uub25DYWNoZWFibGVSZWFkKFR5cGUsIE9iamVjdC5hc3NpZ24oe30sIHUudmFsdWUsIHsgW1R5cGUuJGlkXTogdS5pZCB9KSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV0gJiYgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV1baWRdKSB7XG4gICAgICAgICAgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV1baWRdLm5leHQoeyBmaWVsZCwgdmFsdWUgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9XG4gIH1cblxuICBmaW5kKHQsIGlkKSB7XG4gICAgbGV0IFR5cGUgPSB0O1xuICAgIGlmICh0eXBlb2YgdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIFR5cGUgPSB0aGlzWyR0eXBlc11bdF07XG4gICAgfVxuICAgIGNvbnN0IHJldFZhbCA9IG5ldyBUeXBlKHsgW1R5cGUuJGlkXTogaWQgfSwgdGhpcyk7XG4gICAgcmV0dXJuIHJldFZhbDtcbiAgfVxuXG4gIGZvcmdlKHQsIHZhbCkge1xuICAgIGxldCBUeXBlID0gdDtcbiAgICBpZiAodHlwZW9mIHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBUeXBlID0gdGhpc1skdHlwZXNdW3RdO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFR5cGUodmFsLCB0aGlzKTtcbiAgfVxuXG4gIC8vIExPQUQgKHR5cGUvaWQpLCBTSURFTE9BRCAodHlwZS9pZC9zaWRlKT8gT3IganVzdCBMT0FEQUxMP1xuICAvLyBMT0FEIG5lZWRzIHRvIHNjcnViIHRocm91Z2ggaG90IGNhY2hlcyBmaXJzdFxuXG4gIHN1YnNjcmliZSh0eXBlTmFtZSwgaWQsIGhhbmRsZXIpIHtcbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXSA9IHt9O1xuICAgIH1cbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdW2lkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV1baWRdID0gbmV3IFN1YmplY3QoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXVtpZF0uc3Vic2NyaWJlKGhhbmRsZXIpO1xuICB9XG5cbiAgdGVhcmRvd24oKSB7XG4gICAgdGhpc1skc3RvcmVTdWJzY3JpcHRpb25zXS5mb3JFYWNoKChzKSA9PiBzLnVuc3Vic2NyaWJlKCkpO1xuICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdID0gdW5kZWZpbmVkO1xuICAgIHRoaXNbJHN0b3JlU3Vic2NyaXB0aW9uc10gPSB1bmRlZmluZWQ7XG4gIH1cblxuICBnZXQoLi4uYXJncykge1xuICAgIHJldHVybiB0aGlzWyRzdG9yYWdlXS5yZWR1Y2UoKHRoZW5hYmxlLCBzdG9yYWdlKSA9PiB7XG4gICAgICByZXR1cm4gdGhlbmFibGUudGhlbigodikgPT4ge1xuICAgICAgICBpZiAodiAhPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBzdG9yYWdlLnJlYWQoLi4uYXJncyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sIFByb21pc2UucmVzb2x2ZShudWxsKSlcbiAgICAudGhlbigodikgPT4ge1xuICAgICAgaWYgKCh2ID09PSBudWxsKSAmJiAodGhpc1skdGVybWluYWxdKSkge1xuICAgICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlYWQoLi4uYXJncyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdjtcbiAgICAgIH1cbiAgICB9KS50aGVuKCh2KSA9PiB7XG4gICAgICByZXR1cm4gdjtcbiAgICB9KTtcbiAgfVxuXG4gIHN0cmVhbUdldCh0eXBlLCBpZCwga2V5ID0gJHNlbGYpIHtcbiAgICByZXR1cm4gT2JzZXJ2YWJsZS5jcmVhdGUoKG9ic2VydmVyKSA9PiB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKCh0aGlzWyRzdG9yYWdlXS5tYXAoKHN0b3JlKSA9PiB7XG4gICAgICAgIHJldHVybiBzdG9yZS5yZWFkKHR5cGUsIGlkLCBrZXkpXG4gICAgICAgIC50aGVuKCh2KSA9PiB7XG4gICAgICAgICAgb2JzZXJ2ZXIubmV4dCh2KTtcbiAgICAgICAgICBpZiAoc3RvcmUuaG90KHR5cGUsIGlkKSkge1xuICAgICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KSkpXG4gICAgICAudGhlbigodmFsQXJyYXkpID0+IHtcbiAgICAgICAgY29uc3QgcG9zc2lWYWwgPSB2YWxBcnJheS5maWx0ZXIoKHYpID0+IHYgIT09IG51bGwpO1xuICAgICAgICBpZiAoKHBvc3NpVmFsLmxlbmd0aCA9PT0gMCkgJiYgKHRoaXNbJHRlcm1pbmFsXSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlYWQodHlwZSwgaWQsIGtleSlcbiAgICAgICAgICAudGhlbigodmFsKSA9PiB7XG4gICAgICAgICAgICBvYnNlcnZlci5uZXh0KHZhbCk7XG4gICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBwb3NzaVZhbFswXTtcbiAgICAgICAgfVxuICAgICAgfSkudGhlbigodikgPT4ge1xuICAgICAgICBvYnNlcnZlci5jb21wbGV0ZSgpO1xuICAgICAgICByZXR1cm4gdjtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc2F2ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS53cml0ZSguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIGRlbGV0ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5kZWxldGUoLi4uYXJncykudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwodGhpc1skc3RvcmFnZV0ubWFwKChzdG9yZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBzdG9yZS5kZWxldGUoLi4uYXJncyk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgYWRkKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLmFkZCguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIHJlc3RSZXF1ZXN0KG9wdHMpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdICYmIHRoaXNbJHRlcm1pbmFsXS5yZXN0KSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlc3Qob3B0cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ05vIFJlc3QgdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLm1vZGlmeVJlbGF0aW9uc2hpcCguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZW1vdmUoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==
