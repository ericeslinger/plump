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
            if (field && field !== 'attributes') {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBsdW1wLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHN1YnNjcmlwdGlvbnMiLCIkc3RvcmVTdWJzY3JpcHRpb25zIiwiUGx1bXAiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInN0b3JhZ2UiLCJ0eXBlcyIsImZvckVhY2giLCJzIiwiYWRkU3RvcmUiLCJ0IiwiYWRkVHlwZSIsInNjaGVtYXRhIiwiRXh0ZW5kaW5nTW9kZWwiLCJrIiwiRHluYW1pY01vZGVsIiwiZnJvbUpTT04iLCJUIiwiJG5hbWUiLCJ1bmRlZmluZWQiLCJFcnJvciIsImtleXMiLCJzdG9yZSIsInRlcm1pbmFsIiwicHVzaCIsIm9uVXBkYXRlIiwidHlwZSIsImlkIiwidmFsdWUiLCJmaWVsZCIsIndyaXRlSGFzTWFueSIsInJlbGF0aW9uc2hpcHMiLCJ3cml0ZSIsIm5leHQiLCJUeXBlIiwiJGlkIiwidmFsIiwidHlwZU5hbWUiLCJoYW5kbGVyIiwic3Vic2NyaWJlIiwidW5zdWJzY3JpYmUiLCJBcnJheSIsImlzQXJyYXkiLCJyZWR1Y2UiLCJ0aGVuYWJsZSIsInRoZW4iLCJ2IiwiaG90IiwicmVhZCIsIlByb21pc2UiLCJyZXNvbHZlIiwiYXR0cmlidXRlcyIsImNyZWF0ZSIsIm9ic2VydmVyIiwiYWxsIiwibWFwIiwidmFsQXJyYXkiLCJwb3NzaVZhbCIsImZpbHRlciIsImxlbmd0aCIsImNvbXBsZXRlIiwicm9vdCIsImJ1bGtSZWFkIiwicmVqZWN0IiwiYXJncyIsImRlbGV0ZSIsImFkZCIsInJlc3QiLCJtb2RpZnlSZWxhdGlvbnNoaXAiLCJyZW1vdmUiLCJob3RzIiwid2lwZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0FBRUEsSUFBTUEsU0FBU0MsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNQyxXQUFXRCxPQUFPLFVBQVAsQ0FBakI7QUFDQSxJ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LEVBQWU4RCxNQUFmLENBQXNCLFVBQUNwQyxLQUFEO0FBQUEsZUFBV0EsTUFBTXlCLEdBQU4sQ0FBVXJCLElBQVYsRUFBZ0JDLEVBQWhCLENBQVg7QUFBQSxPQUF0QixDQUFiO0FBQ0EsVUFBSSxLQUFLOUIsU0FBTCxFQUFnQmtELEdBQWhCLENBQW9CckIsSUFBcEIsRUFBMEJDLEVBQTFCLENBQUosRUFBbUM7QUFDakMyQyxhQUFLOUMsSUFBTCxDQUFVLEtBQUszQixTQUFMLENBQVY7QUFDRDtBQUNELGFBQU8sbUJBQVN5RCxHQUFULENBQWFnQixLQUFLZixHQUFMLENBQVMsVUFBQ2pDLEtBQUQsRUFBVztBQUN0QyxlQUFPQSxNQUFNaUQsSUFBTixDQUFXN0MsSUFBWCxFQUFpQkMsRUFBakIsRUFBcUJFLEtBQXJCLENBQVA7QUFDRCxPQUZtQixDQUFiLEVBRUhnQixJQUZHLENBRUUsWUFBTTtBQUNiLFlBQUksT0FBSy9DLGNBQUwsRUFBcUI0QixLQUFLUixLQUExQixLQUFvQyxPQUFLcEIsY0FBTCxFQUFxQjRCLEtBQUtSLEtBQTFCLEVBQWlDUyxFQUFqQyxDQUF4QyxFQUE4RTtBQUM1RSxpQkFBTyxPQUFLOUIsU0FBTCxFQUFnQm1ELElBQWhCLENBQXFCdEIsSUFBckIsRUFBMkJDLEVBQTNCLEVBQStCRSxLQUEvQixDQUFQO0FBQ0QsU0FGRCxNQUVPO0FBQ0wsaUJBQU8sSUFBUDtBQUNEO0FBQ0YsT0FSTSxDQUFQO0FBU0QiLCJmaWxlIjoicGx1bXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2RlbCB9IGZyb20gJy4vbW9kZWwnO1xuaW1wb3J0IHsgU3ViamVjdCwgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMvUngnO1xuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcblxuY29uc3QgJHR5cGVzID0gU3ltYm9sKCckdHlwZXMnKTtcbmNvbnN0ICRzdG9yYWdlID0gU3ltYm9sKCckc3RvcmFnZScpO1xuY29uc3QgJHRlcm1pbmFsID0gU3ltYm9sKCckdGVybWluYWwnKTtcbmNvbnN0ICRzdWJzY3JpcHRpb25zID0gU3ltYm9sKCckc3Vic2NyaXB0aW9ucycpO1xuY29uc3QgJHN0b3JlU3Vic2NyaXB0aW9ucyA9IFN5bWJvbCgnJHN0b3JlU3Vic2NyaXB0aW9ucycpO1xuXG5leHBvcnQgY2xhc3MgUGx1bXAge1xuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwge1xuICAgICAgc3RvcmFnZTogW10sXG4gICAgICB0eXBlczogW10sXG4gICAgfSwgb3B0cyk7XG4gICAgdGhpc1skc3Vic2NyaXB0aW9uc10gPSB7fTtcbiAgICB0aGlzWyRzdG9yZVN1YnNjcmlwdGlvbnNdID0gW107XG4gICAgdGhpc1skc3RvcmFnZV0gPSBbXTtcbiAgICB0aGlzWyR0eXBlc10gPSB7fTtcbiAgICBvcHRpb25zLnN0b3JhZ2UuZm9yRWFjaCgocykgPT4gdGhpcy5hZGRTdG9yZShzKSk7XG4gICAgb3B0aW9ucy50eXBlcy5mb3JFYWNoKCh0KSA9PiB0aGlzLmFkZFR5cGUodCkpO1xuICB9XG5cbiAgYWRkVHlwZXNGcm9tU2NoZW1hKHNjaGVtYXRhLCBFeHRlbmRpbmdNb2RlbCA9IE1vZGVsKSB7XG4gICAgZm9yIChjb25zdCBrIGluIHNjaGVtYXRhKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZ3VhcmQtZm9yLWluXG4gICAgICBjbGFzcyBEeW5hbWljTW9kZWwgZXh0ZW5kcyBFeHRlbmRpbmdNb2RlbCB7fVxuICAgICAgRHluYW1pY01vZGVsLmZyb21KU09OKHNjaGVtYXRhW2tdKTtcbiAgICAgIHRoaXMuYWRkVHlwZShEeW5hbWljTW9kZWwpO1xuICAgIH1cbiAgfVxuXG4gIGFkZFR5cGUoVCkge1xuICAgIGlmICh0aGlzWyR0eXBlc11bVC4kbmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skdHlwZXNdW1QuJG5hbWVdID0gVDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBEdXBsaWNhdGUgVHlwZSByZWdpc3RlcmVkOiAke1QuJG5hbWV9YCk7XG4gICAgfVxuICB9XG5cbiAgdHlwZShUKSB7XG4gICAgcmV0dXJuIHRoaXNbJHR5cGVzXVtUXTtcbiAgfVxuXG4gIHR5cGVzKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzWyR0eXBlc10pO1xuICB9XG5cbiAgYWRkU3RvcmUoc3RvcmUpIHtcbiAgICBpZiAoc3RvcmUudGVybWluYWwpIHtcbiAgICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzWyR0ZXJtaW5hbF0gPSBzdG9yZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGhhdmUgbW9yZSB0aGFuIG9uZSB0ZXJtaW5hbCBzdG9yZScpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzWyRzdG9yYWdlXS5wdXNoKHN0b3JlKTtcbiAgICB9XG4gICAgaWYgKHN0b3JlLnRlcm1pbmFsKSB7XG4gICAgICB0aGlzWyRzdG9yZVN1YnNjcmlwdGlvbnNdLnB1c2goc3RvcmUub25VcGRhdGUoKHsgdHlwZSwgaWQsIHZhbHVlLCBmaWVsZCB9KSA9PiB7XG4gICAgICAgIHRoaXNbJHN0b3JhZ2VdLmZvckVhY2goKHN0b3JhZ2UpID0+IHtcbiAgICAgICAgICBpZiAoZmllbGQgJiYgZmllbGQgIT09ICdhdHRyaWJ1dGVzJykge1xuICAgICAgICAgICAgc3RvcmFnZS53cml0ZUhhc01hbnkodHlwZSwgaWQsIGZpZWxkLCB2YWx1ZS5yZWxhdGlvbnNoaXBzW2ZpZWxkXSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0b3JhZ2Uud3JpdGUodHlwZSwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBzdG9yYWdlLm9uQ2FjaGVhYmxlUmVhZChUeXBlLCBPYmplY3QuYXNzaWduKHt9LCB1LnZhbHVlLCB7IFtUeXBlLiRpZF06IHUuaWQgfSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGUuJG5hbWVdICYmIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGUuJG5hbWVdW2lkXSkge1xuICAgICAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGUuJG5hbWVdW2lkXS5uZXh0KHsgZmllbGQsIHZhbHVlIH0pO1xuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgfVxuICB9XG5cbiAgZmluZCh0LCBpZCkge1xuICAgIGNvbnN0IFR5cGUgPSB0eXBlb2YgdCA9PT0gJ3N0cmluZycgPyB0aGlzWyR0eXBlc11bdF0gOiB0O1xuICAgIHJldHVybiBuZXcgVHlwZSh7IFtUeXBlLiRpZF06IGlkIH0sIHRoaXMpO1xuICB9XG5cbiAgZm9yZ2UodCwgdmFsKSB7XG4gICAgY29uc3QgVHlwZSA9IHR5cGVvZiB0ID09PSAnc3RyaW5nJyA/IHRoaXNbJHR5cGVzXVt0XSA6IHQ7XG4gICAgcmV0dXJuIG5ldyBUeXBlKHZhbCwgdGhpcyk7XG4gIH1cblxuICAvLyBMT0FEICh0eXBlL2lkKSwgU0lERUxPQUQgKHR5cGUvaWQvc2lkZSk/IE9yIGp1c3QgTE9BREFMTD9cbiAgLy8gTE9BRCBuZWVkcyB0byBzY3J1YiB0aHJvdWdoIGhvdCBjYWNoZXMgZmlyc3RcblxuICBzdWJzY3JpYmUodHlwZU5hbWUsIGlkLCBoYW5kbGVyKSB7XG4gICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV0gPSB7fTtcbiAgICB9XG4gICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXVtpZF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdW2lkXSA9IG5ldyBTdWJqZWN0KCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV1baWRdLnN1YnNjcmliZShoYW5kbGVyKTtcbiAgfVxuXG4gIHRlYXJkb3duKCkge1xuICAgIHRoaXNbJHN0b3JlU3Vic2NyaXB0aW9uc10uZm9yRWFjaCgocykgPT4gcy51bnN1YnNjcmliZSgpKTtcbiAgICB0aGlzWyRzdWJzY3JpcHRpb25zXSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzWyRzdG9yZVN1YnNjcmlwdGlvbnNdID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgZ2V0KHR5cGUsIGlkLCBvcHRzKSB7XG4gICAgY29uc3Qga2V5cyA9IG9wdHMgJiYgIUFycmF5LmlzQXJyYXkob3B0cykgPyBbb3B0c10gOiBvcHRzO1xuICAgIHJldHVybiB0aGlzWyRzdG9yYWdlXS5yZWR1Y2UoKHRoZW5hYmxlLCBzdG9yYWdlKSA9PiB7XG4gICAgICByZXR1cm4gdGhlbmFibGUudGhlbigodikgPT4ge1xuICAgICAgICBpZiAodiAhPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICB9IGVsc2UgaWYgKHN0b3JhZ2UuaG90KHR5cGUsIGlkKSkge1xuICAgICAgICAgIHJldHVybiBzdG9yYWdlLnJlYWQodHlwZSwgaWQsIGtleXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LCBQcm9taXNlLnJlc29sdmUobnVsbCkpXG4gICAgLnRoZW4oKHYpID0+IHtcbiAgICAgIGlmICgoKHYgPT09IG51bGwpIHx8ICh2LmF0dHJpYnV0ZXMgPT09IG51bGwpKSAmJiAodGhpc1skdGVybWluYWxdKSkge1xuICAgICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlYWQodHlwZSwgaWQsIGtleXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzdHJlYW1HZXQodHlwZSwgaWQsIG9wdHMpIHtcbiAgICBjb25zdCBrZXlzID0gb3B0cyAmJiAhQXJyYXkuaXNBcnJheShvcHRzKSA/IFtvcHRzXSA6IG9wdHM7XG4gICAgcmV0dXJuIE9ic2VydmFibGUuY3JlYXRlKChvYnNlcnZlcikgPT4ge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbCgodGhpc1skc3RvcmFnZV0ubWFwKChzdG9yZSkgPT4ge1xuICAgICAgICByZXR1cm4gc3RvcmUucmVhZCh0eXBlLCBpZCwga2V5cylcbiAgICAgICAgLnRoZW4oKHYpID0+IHtcbiAgICAgICAgICBvYnNlcnZlci5uZXh0KHYpO1xuICAgICAgICAgIGlmIChzdG9yZS5ob3QodHlwZSwgaWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pKSlcbiAgICAgIC50aGVuKCh2YWxBcnJheSkgPT4ge1xuICAgICAgICBjb25zdCBwb3NzaVZhbCA9IHZhbEFycmF5LmZpbHRlcigodikgPT4gdiAhPT0gbnVsbCk7XG4gICAgICAgIGlmICgocG9zc2lWYWwubGVuZ3RoID09PSAwKSAmJiAodGhpc1skdGVybWluYWxdKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVhZCh0eXBlLCBpZCwga2V5cylcbiAgICAgICAgICAudGhlbigodmFsKSA9PiB7XG4gICAgICAgICAgICBvYnNlcnZlci5uZXh0KHZhbCk7XG4gICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBwb3NzaVZhbFswXTtcbiAgICAgICAgfVxuICAgICAgfSkudGhlbigodikgPT4ge1xuICAgICAgICBvYnNlcnZlci5jb21wbGV0ZSgpO1xuICAgICAgICByZXR1cm4gdjtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgYnVsa0dldChyb290LCBvcHRzKSB7XG4gICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5idWxrUmVhZChyb290LCBvcHRzKTtcbiAgfVxuXG4gIHNhdmUoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ud3JpdGUoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBkZWxldGUoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0uZGVsZXRlKC4uLmFyZ3MpLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKHRoaXNbJHN0b3JhZ2VdLm1hcCgoc3RvcmUpID0+IHtcbiAgICAgICAgICByZXR1cm4gc3RvcmUuZGVsZXRlKC4uLmFyZ3MpO1xuICAgICAgICB9KSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIGFkZCguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5hZGQoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICByZXN0UmVxdWVzdChvcHRzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSAmJiB0aGlzWyR0ZXJtaW5hbF0ucmVzdCkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZXN0KG9wdHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdObyBSZXN0IHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIG1vZGlmeVJlbGF0aW9uc2hpcCguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5tb2RpZnlSZWxhdGlvbnNoaXAoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICByZW1vdmUoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVtb3ZlKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgaW52YWxpZGF0ZSh0eXBlLCBpZCwgZmllbGQpIHtcbiAgICBjb25zdCBob3RzID0gdGhpc1skc3RvcmFnZV0uZmlsdGVyKChzdG9yZSkgPT4gc3RvcmUuaG90KHR5cGUsIGlkKSk7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXS5ob3QodHlwZSwgaWQpKSB7XG4gICAgICBob3RzLnB1c2godGhpc1skdGVybWluYWxdKTtcbiAgICB9XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChob3RzLm1hcCgoc3RvcmUpID0+IHtcbiAgICAgIHJldHVybiBzdG9yZS53aXBlKHR5cGUsIGlkLCBmaWVsZCk7XG4gICAgfSkpLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGUuJG5hbWVdICYmIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGUuJG5hbWVdW2lkXSkge1xuICAgICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlYWQodHlwZSwgaWQsIGZpZWxkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG4iXX0=
