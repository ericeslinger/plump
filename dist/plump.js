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
    value: function bulkGet(type, id) {
      return this[$terminal].bulkRead(type, id);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBsdW1wLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHN1YnNjcmlwdGlvbnMiLCIkc3RvcmVTdWJzY3JpcHRpb25zIiwiUGx1bXAiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInN0b3JhZ2UiLCJ0eXBlcyIsImZvckVhY2giLCJzIiwiYWRkU3RvcmUiLCJ0IiwiYWRkVHlwZSIsInNjaGVtYXRhIiwiRXh0ZW5kaW5nTW9kZWwiLCJrIiwiRHluYW1pY01vZGVsIiwiZnJvbUpTT04iLCJUIiwiJG5hbWUiLCJ1bmRlZmluZWQiLCJFcnJvciIsImtleXMiLCJzdG9yZSIsInRlcm1pbmFsIiwicHVzaCIsIm9uVXBkYXRlIiwidHlwZSIsImlkIiwidmFsdWUiLCJmaWVsZCIsIndyaXRlSGFzTWFueSIsInJlbGF0aW9uc2hpcHMiLCJ3cml0ZSIsIm5leHQiLCJUeXBlIiwiJGlkIiwidmFsIiwidHlwZU5hbWUiLCJoYW5kbGVyIiwic3Vic2NyaWJlIiwidW5zdWJzY3JpYmUiLCJBcnJheSIsImlzQXJyYXkiLCJyZWR1Y2UiLCJ0aGVuYWJsZSIsInRoZW4iLCJ2IiwiaG90IiwicmVhZCIsIlByb21pc2UiLCJyZXNvbHZlIiwiYXR0cmlidXRlcyIsImNyZWF0ZSIsIm9ic2VydmVyIiwiYWxsIiwibWFwIiwidmFsQXJyYXkiLCJwb3NzaVZhbCIsImZpbHRlciIsImxlbmd0aCIsImNvbXBsZXRlIiwiYnVsa1JlYWQiLCJyZWplY3QiLCJhcmdzIiwiZGVsZXRlIiwiYWRkIiwicmVzdCIsIm1vZGlmeVJlbGF0aW9uc2hpcCIsInJlbW92ZSIsImhvdHMiLCJ3aXBlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7QUFFQSxJQUFNQSxTQUFTQyxPQUFPLFFBQVAsQ0FBZjtBQUNBLElBQU1DLFdBQVdELE9BQU8sVUFBUCxDQUFqQjtBQUNBLElBQU1FLFlB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OEQsTUFBZixDQUFzQixVQUFDcEMsS0FBRDtBQUFBLGVBQVdBLE1BQU15QixHQUFOLENBQVVyQixJQUFWLEVBQWdCQyxFQUFoQixDQUFYO0FBQUEsT0FBdEIsQ0FBYjtBQUNBLFVBQUksS0FBSzlCLFNBQUwsRUFBZ0JrRCxHQUFoQixDQUFvQnJCLElBQXBCLEVBQTBCQyxFQUExQixDQUFKLEVBQW1DO0FBQ2pDMEMsYUFBSzdDLElBQUwsQ0FBVSxLQUFLM0IsU0FBTCxDQUFWO0FBQ0Q7QUFDRCxhQUFPLG1CQUFTeUQsR0FBVCxDQUFhZSxLQUFLZCxHQUFMLENBQVMsVUFBQ2pDLEtBQUQsRUFBVztBQUN0QyxlQUFPQSxNQUFNZ0QsSUFBTixDQUFXNUMsSUFBWCxFQUFpQkMsRUFBakIsRUFBcUJFLEtBQXJCLENBQVA7QUFDRCxPQUZtQixDQUFiLEVBRUhnQixJQUZHLENBRUUsWUFBTTtBQUNiLFlBQUksT0FBSy9DLGNBQUwsRUFBcUI0QixLQUFLUixLQUExQixLQUFvQyxPQUFLcEIsY0FBTCxFQUFxQjRCLEtBQUtSLEtBQTFCLEVBQWlDUyxFQUFqQyxDQUF4QyxFQUE4RTtBQUM1RSxpQkFBTyxPQUFLOUIsU0FBTCxFQUFnQm1ELElBQWhCLENBQXFCdEIsSUFBckIsRUFBMkJDLEVBQTNCLEVBQStCRSxLQUEvQixDQUFQO0FBQ0QsU0FGRCxNQUVPO0FBQ0wsaUJBQU8sSUFBUDtBQUNEO0FBQ0YsT0FSTSxDQUFQO0FBU0QiLCJmaWxlIjoicGx1bXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2RlbCB9IGZyb20gJy4vbW9kZWwnO1xuaW1wb3J0IHsgU3ViamVjdCwgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMvUngnO1xuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcblxuY29uc3QgJHR5cGVzID0gU3ltYm9sKCckdHlwZXMnKTtcbmNvbnN0ICRzdG9yYWdlID0gU3ltYm9sKCckc3RvcmFnZScpO1xuY29uc3QgJHRlcm1pbmFsID0gU3ltYm9sKCckdGVybWluYWwnKTtcbmNvbnN0ICRzdWJzY3JpcHRpb25zID0gU3ltYm9sKCckc3Vic2NyaXB0aW9ucycpO1xuY29uc3QgJHN0b3JlU3Vic2NyaXB0aW9ucyA9IFN5bWJvbCgnJHN0b3JlU3Vic2NyaXB0aW9ucycpO1xuXG5leHBvcnQgY2xhc3MgUGx1bXAge1xuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwge1xuICAgICAgc3RvcmFnZTogW10sXG4gICAgICB0eXBlczogW10sXG4gICAgfSwgb3B0cyk7XG4gICAgdGhpc1skc3Vic2NyaXB0aW9uc10gPSB7fTtcbiAgICB0aGlzWyRzdG9yZVN1YnNjcmlwdGlvbnNdID0gW107XG4gICAgdGhpc1skc3RvcmFnZV0gPSBbXTtcbiAgICB0aGlzWyR0eXBlc10gPSB7fTtcbiAgICBvcHRpb25zLnN0b3JhZ2UuZm9yRWFjaCgocykgPT4gdGhpcy5hZGRTdG9yZShzKSk7XG4gICAgb3B0aW9ucy50eXBlcy5mb3JFYWNoKCh0KSA9PiB0aGlzLmFkZFR5cGUodCkpO1xuICB9XG5cbiAgYWRkVHlwZXNGcm9tU2NoZW1hKHNjaGVtYXRhLCBFeHRlbmRpbmdNb2RlbCA9IE1vZGVsKSB7XG4gICAgZm9yIChjb25zdCBrIGluIHNjaGVtYXRhKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZ3VhcmQtZm9yLWluXG4gICAgICBjbGFzcyBEeW5hbWljTW9kZWwgZXh0ZW5kcyBFeHRlbmRpbmdNb2RlbCB7fVxuICAgICAgRHluYW1pY01vZGVsLmZyb21KU09OKHNjaGVtYXRhW2tdKTtcbiAgICAgIHRoaXMuYWRkVHlwZShEeW5hbWljTW9kZWwpO1xuICAgIH1cbiAgfVxuXG4gIGFkZFR5cGUoVCkge1xuICAgIGlmICh0aGlzWyR0eXBlc11bVC4kbmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skdHlwZXNdW1QuJG5hbWVdID0gVDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBEdXBsaWNhdGUgVHlwZSByZWdpc3RlcmVkOiAke1QuJG5hbWV9YCk7XG4gICAgfVxuICB9XG5cbiAgdHlwZShUKSB7XG4gICAgcmV0dXJuIHRoaXNbJHR5cGVzXVtUXTtcbiAgfVxuXG4gIHR5cGVzKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzWyR0eXBlc10pO1xuICB9XG5cbiAgYWRkU3RvcmUoc3RvcmUpIHtcbiAgICBpZiAoc3RvcmUudGVybWluYWwpIHtcbiAgICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzWyR0ZXJtaW5hbF0gPSBzdG9yZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGhhdmUgbW9yZSB0aGFuIG9uZSB0ZXJtaW5hbCBzdG9yZScpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzWyRzdG9yYWdlXS5wdXNoKHN0b3JlKTtcbiAgICB9XG4gICAgaWYgKHN0b3JlLnRlcm1pbmFsKSB7XG4gICAgICB0aGlzWyRzdG9yZVN1YnNjcmlwdGlvbnNdLnB1c2goc3RvcmUub25VcGRhdGUoKHsgdHlwZSwgaWQsIHZhbHVlLCBmaWVsZCB9KSA9PiB7XG4gICAgICAgIHRoaXNbJHN0b3JhZ2VdLmZvckVhY2goKHN0b3JhZ2UpID0+IHtcbiAgICAgICAgICBpZiAoZmllbGQgJiYgZmllbGQgIT09ICdhdHRyaWJ1dGVzJykge1xuICAgICAgICAgICAgc3RvcmFnZS53cml0ZUhhc01hbnkodHlwZSwgaWQsIGZpZWxkLCB2YWx1ZS5yZWxhdGlvbnNoaXBzW2ZpZWxkXSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0b3JhZ2Uud3JpdGUodHlwZSwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBzdG9yYWdlLm9uQ2FjaGVhYmxlUmVhZChUeXBlLCBPYmplY3QuYXNzaWduKHt9LCB1LnZhbHVlLCB7IFtUeXBlLiRpZF06IHUuaWQgfSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGUuJG5hbWVdICYmIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGUuJG5hbWVdW2lkXSkge1xuICAgICAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGUuJG5hbWVdW2lkXS5uZXh0KHsgZmllbGQsIHZhbHVlIH0pO1xuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgfVxuICB9XG5cbiAgZmluZCh0LCBpZCkge1xuICAgIGNvbnN0IFR5cGUgPSB0eXBlb2YgdCA9PT0gJ3N0cmluZycgPyB0aGlzWyR0eXBlc11bdF0gOiB0O1xuICAgIHJldHVybiBuZXcgVHlwZSh7IFtUeXBlLiRpZF06IGlkIH0sIHRoaXMpO1xuICB9XG5cbiAgZm9yZ2UodCwgdmFsKSB7XG4gICAgY29uc3QgVHlwZSA9IHR5cGVvZiB0ID09PSAnc3RyaW5nJyA/IHRoaXNbJHR5cGVzXVt0XSA6IHQ7XG4gICAgcmV0dXJuIG5ldyBUeXBlKHZhbCwgdGhpcyk7XG4gIH1cblxuICAvLyBMT0FEICh0eXBlL2lkKSwgU0lERUxPQUQgKHR5cGUvaWQvc2lkZSk/IE9yIGp1c3QgTE9BREFMTD9cbiAgLy8gTE9BRCBuZWVkcyB0byBzY3J1YiB0aHJvdWdoIGhvdCBjYWNoZXMgZmlyc3RcblxuICBzdWJzY3JpYmUodHlwZU5hbWUsIGlkLCBoYW5kbGVyKSB7XG4gICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV0gPSB7fTtcbiAgICB9XG4gICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXVtpZF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdW2lkXSA9IG5ldyBTdWJqZWN0KCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV1baWRdLnN1YnNjcmliZShoYW5kbGVyKTtcbiAgfVxuXG4gIHRlYXJkb3duKCkge1xuICAgIHRoaXNbJHN0b3JlU3Vic2NyaXB0aW9uc10uZm9yRWFjaCgocykgPT4gcy51bnN1YnNjcmliZSgpKTtcbiAgICB0aGlzWyRzdWJzY3JpcHRpb25zXSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzWyRzdG9yZVN1YnNjcmlwdGlvbnNdID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgZ2V0KHR5cGUsIGlkLCBvcHRzKSB7XG4gICAgY29uc3Qga2V5cyA9IG9wdHMgJiYgIUFycmF5LmlzQXJyYXkob3B0cykgPyBbb3B0c10gOiBvcHRzO1xuICAgIHJldHVybiB0aGlzWyRzdG9yYWdlXS5yZWR1Y2UoKHRoZW5hYmxlLCBzdG9yYWdlKSA9PiB7XG4gICAgICByZXR1cm4gdGhlbmFibGUudGhlbigodikgPT4ge1xuICAgICAgICBpZiAodiAhPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICB9IGVsc2UgaWYgKHN0b3JhZ2UuaG90KHR5cGUsIGlkKSkge1xuICAgICAgICAgIHJldHVybiBzdG9yYWdlLnJlYWQodHlwZSwgaWQsIGtleXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LCBQcm9taXNlLnJlc29sdmUobnVsbCkpXG4gICAgLnRoZW4oKHYpID0+IHtcbiAgICAgIGlmICgoKHYgPT09IG51bGwpIHx8ICh2LmF0dHJpYnV0ZXMgPT09IG51bGwpKSAmJiAodGhpc1skdGVybWluYWxdKSkge1xuICAgICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlYWQodHlwZSwgaWQsIGtleXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzdHJlYW1HZXQodHlwZSwgaWQsIG9wdHMpIHtcbiAgICBjb25zdCBrZXlzID0gb3B0cyAmJiAhQXJyYXkuaXNBcnJheShvcHRzKSA/IFtvcHRzXSA6IG9wdHM7XG4gICAgcmV0dXJuIE9ic2VydmFibGUuY3JlYXRlKChvYnNlcnZlcikgPT4ge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbCgodGhpc1skc3RvcmFnZV0ubWFwKChzdG9yZSkgPT4ge1xuICAgICAgICByZXR1cm4gc3RvcmUucmVhZCh0eXBlLCBpZCwga2V5cylcbiAgICAgICAgLnRoZW4oKHYpID0+IHtcbiAgICAgICAgICBvYnNlcnZlci5uZXh0KHYpO1xuICAgICAgICAgIGlmIChzdG9yZS5ob3QodHlwZSwgaWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pKSlcbiAgICAgIC50aGVuKCh2YWxBcnJheSkgPT4ge1xuICAgICAgICBjb25zdCBwb3NzaVZhbCA9IHZhbEFycmF5LmZpbHRlcigodikgPT4gdiAhPT0gbnVsbCk7XG4gICAgICAgIGlmICgocG9zc2lWYWwubGVuZ3RoID09PSAwKSAmJiAodGhpc1skdGVybWluYWxdKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVhZCh0eXBlLCBpZCwga2V5cylcbiAgICAgICAgICAudGhlbigodmFsKSA9PiB7XG4gICAgICAgICAgICBvYnNlcnZlci5uZXh0KHZhbCk7XG4gICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBwb3NzaVZhbFswXTtcbiAgICAgICAgfVxuICAgICAgfSkudGhlbigodikgPT4ge1xuICAgICAgICBvYnNlcnZlci5jb21wbGV0ZSgpO1xuICAgICAgICByZXR1cm4gdjtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgYnVsa0dldCh0eXBlLCBpZCkge1xuICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0uYnVsa1JlYWQodHlwZSwgaWQpO1xuICB9XG5cbiAgc2F2ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS53cml0ZSguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIGRlbGV0ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5kZWxldGUoLi4uYXJncykudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwodGhpc1skc3RvcmFnZV0ubWFwKChzdG9yZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBzdG9yZS5kZWxldGUoLi4uYXJncyk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgYWRkKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLmFkZCguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIHJlc3RSZXF1ZXN0KG9wdHMpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdICYmIHRoaXNbJHRlcm1pbmFsXS5yZXN0KSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlc3Qob3B0cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ05vIFJlc3QgdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLm1vZGlmeVJlbGF0aW9uc2hpcCguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZW1vdmUoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBpbnZhbGlkYXRlKHR5cGUsIGlkLCBmaWVsZCkge1xuICAgIGNvbnN0IGhvdHMgPSB0aGlzWyRzdG9yYWdlXS5maWx0ZXIoKHN0b3JlKSA9PiBzdG9yZS5ob3QodHlwZSwgaWQpKTtcbiAgICBpZiAodGhpc1skdGVybWluYWxdLmhvdCh0eXBlLCBpZCkpIHtcbiAgICAgIGhvdHMucHVzaCh0aGlzWyR0ZXJtaW5hbF0pO1xuICAgIH1cbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKGhvdHMubWFwKChzdG9yZSkgPT4ge1xuICAgICAgcmV0dXJuIHN0b3JlLndpcGUodHlwZSwgaWQsIGZpZWxkKTtcbiAgICB9KSkudGhlbigoKSA9PiB7XG4gICAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV0gJiYgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV1baWRdKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVhZCh0eXBlLCBpZCwgZmllbGQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==
