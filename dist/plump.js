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
      return this[$terminal].bulkRead(opts);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBsdW1wLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHN1YnNjcmlwdGlvbnMiLCIkc3RvcmVTdWJzY3JpcHRpb25zIiwiUGx1bXAiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInN0b3JhZ2UiLCJ0eXBlcyIsImZvckVhY2giLCJzIiwiYWRkU3RvcmUiLCJ0IiwiYWRkVHlwZSIsInNjaGVtYSIsIkV4dGVuZGluZ01vZGVsIiwia2V5cyIsImsiLCJEeW5hbWljTW9kZWwiLCJmcm9tSlNPTiIsIlQiLCIkbmFtZSIsInVuZGVmaW5lZCIsIkVycm9yIiwic3RvcmUiLCJ0ZXJtaW5hbCIsInB1c2giLCJvblVwZGF0ZSIsInR5cGUiLCJpZCIsInZhbHVlIiwiZmllbGQiLCJ3cml0ZUhhc01hbnkiLCJ3cml0ZSIsIm5leHQiLCJUeXBlIiwicmV0VmFsIiwiJGlkIiwidmFsIiwidHlwZU5hbWUiLCJoYW5kbGVyIiwic3Vic2NyaWJlIiwidW5zdWJzY3JpYmUiLCJrZXlPcHRzIiwiQXJyYXkiLCJpc0FycmF5IiwicmVkdWNlIiwidGhlbmFibGUiLCJ0aGVuIiwidiIsImhvdCIsInJlYWQiLCJQcm9taXNlIiwicmVzb2x2ZSIsImNyZWF0ZSIsIm9ic2VydmVyIiwiYWxsIiwibWFwIiwidmFsQXJyYXkiLCJwb3NzaVZhbCIsImZpbHRlciIsImxlbmd0aCIsImNvbXBsZXRlIiwiYnVsa1JlYWQiLCJyZWplY3QiLCJhcmdzIiwiZGVsZXRlIiwiYWRkIiwicmVzdCIsIm1vZGlmeVJlbGF0aW9uc2hpcCIsInJlbW92ZSIsImhvdHMiLCJ3aXBlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7OztBQUVBOzs7Ozs7Ozs7Ozs7QUFFQSxJQUFNQSxTQUFTQyxPQUFPLFFBQVAsQ0FBZjtBQUNBLElBQU1DLFdBQVdELE9BQU8sVUFBUCxDQUFqQjtBQUNBLElBQU1FLFlBQVlGLE9BQU8sV0FBUCxDQUFsQjtBQUNBLElBQU1HLGlCQUFpQkgsT0FBTyxnQkFBUCxDQUF2QjtBQUNBLElBQU1JLHNCQUFzQkosT0FBTyxxQkFBUCxDQUE1Qjs7SUFFYUssSyxXQUFBQSxLO0FBQ1gsbUJBQXVCO0FBQUE7O0FBQUEsUUFBWEMsSUFBVyx1RUFBSixFQUFJOztBQUFBOztBQUNyQixRQUFNQyxVQUFVQyxPQUFPQyxNQUFQLENBQWMsRUFBZCxFQUFrQjtBQUNoQ0MsZUFBUyxFQUR1QjtBQUVoQ0MsYUFBTztBQUZ5QixLQUFsQixFQUdiTCxJQUhhLENBQWhCO0FBSUEsU0FBS0gsY0FBTCxJQUF1QixFQUF2QjtBQUNBLFNBQUtDLG1CQUFMLElBQTRCLEVBQTVCO0FBQ0EsU0FBS0gsUUFBTCxJQUFpQixFQUFqQjtBQUNBLFNBQUtGLE1BQUwsSUFBZSxFQUFmO0FBQ0FRLFlBQVFHLE9BQVIsQ0FBZ0JFLE9BQWhCLENBQXdCLFVBQUNDLENBQUQ7QUFBQSxhQUFPLE1BQUtDLFFBQUwsQ0FBY0QsQ0FBZCxDQUFQO0FBQUEsS0FBeEI7QUFDQU4sWUFBUUksS0FBUixDQUFjQyxPQUFkLENBQXNCLFVBQUNHLENBQUQ7QUFBQSxhQUFPLE1BQUtDLE9BQUwsQ0FBYUQsQ0FBYixDQUFQO0FBQUEsS0FBdEI7QUFDRDs7Ozt1Q0FFa0JFLE0sRUFBZ0M7QUFBQTs7QUFBQSxVQUF4QkMsY0FBd0I7O0FBQ2pEVixhQUFPVyxJQUFQLENBQVlGLE1BQVosRUFBb0JMLE9BQXBCLENBQTRCLFVBQUNRLENBQUQsRUFBTztBQUFBLFlBQzNCQyxZQUQyQjtBQUFBOztBQUFBO0FBQUE7O0FBQUE7QUFBQTs7QUFBQTtBQUFBLFVBQ05ILGNBRE07O0FBRWpDRyxxQkFBYUMsUUFBYixDQUFzQkwsT0FBT0csQ0FBUCxDQUF0QjtBQUNBLGVBQUtKLE9BQUwsQ0FBYUssWUFBYjtBQUNELE9BSkQ7QUFLRDs7OzRCQUVPRSxDLEVBQUc7QUFDVCxVQUFJLEtBQUt4QixNQUFMLEVBQWF3QixFQUFFQyxLQUFmLE1BQTBCQyxTQUE5QixFQUF5QztBQUN2QyxhQUFLMUIsTUFBTCxFQUFhd0IsRUFBRUMsS0FBZixJQUF3QkQsQ0FBeEI7QUFDRCxPQUZELE1BRU87QUFDTCxjQUFNLElBQUlHLEtBQUosaUNBQXdDSCxFQUFFQyxLQUExQyxDQUFOO0FBQ0Q7QUFDRjs7O3lCQUVJRCxDLEVBQUc7QUFDTixhQUFPLEtBQUt4QixNQUFMLEVBQWF3QixDQUFiLENBQVA7QUFDRDs7OzRCQUVPO0FBQ04sYUFBT2YsT0FBT1csSUFBUCxDQUFZLEtBQUtwQixNQUFMLENBQVosQ0FBUDtBQUNEOzs7NkJBRVE0QixLLEVBQU87QUFBQTs7QUFDZCxVQUFJQSxNQUFNQyxRQUFWLEVBQW9CO0FBQ2xCLFlBQUksS0FBSzFCLFNBQUwsTUFBb0J1QixTQUF4QixFQUFtQztBQUNqQyxlQUFLdkIsU0FBTCxJQUFrQnlCLEtBQWxCO0FBQ0QsU0FGRCxNQUVPO0FBQ0wsZ0JBQU0sSUFBSUQsS0FBSixDQUFVLDBDQUFWLENBQU47QUFDRDtBQUNGLE9BTkQsTUFNTztBQUNMLGFBQUt6QixRQUFMLEVBQWU0QixJQUFmLENBQW9CRixLQUFwQjtBQUNEO0FBQ0QsVUFBSUEsTUFBTUMsUUFBVixFQUFvQjtBQUNsQixhQUFLeEIsbUJBQUwsRUFBMEJ5QixJQUExQixDQUErQkYsTUFBTUcsUUFBTixDQUFlLGdCQUFnQztBQUFBLGNBQTdCQyxJQUE2QixRQUE3QkEsSUFBNkI7QUFBQSxjQUF2QkMsRUFBdUIsUUFBdkJBLEVBQXVCO0FBQUEsY0FBbkJDLEtBQW1CLFFBQW5CQSxLQUFtQjtBQUFBLGNBQVpDLEtBQVksUUFBWkEsS0FBWTs7QUFDNUUsaUJBQUtqQyxRQUFMLEVBQWVXLE9BQWYsQ0FBdUIsVUFBQ0YsT0FBRCxFQUFhO0FBQ2xDLGdCQUFJd0IsS0FBSixFQUFXO0FBQ1R4QixzQkFBUXlCLFlBQVIsQ0FBcUJKLElBQXJCLEVBQTJCQyxFQUEzQixFQUErQkUsS0FBL0IsRUFBc0NELEtBQXRDO0FBQ0QsYUFGRCxNQUVPO0FBQ0x2QixzQkFBUTBCLEtBQVIsQ0FBY0wsSUFBZCxFQUFvQkUsS0FBcEI7QUFDRDtBQUNEO0FBQ0QsV0FQRDtBQVFBLGNBQUksT0FBSzlCLGNBQUwsRUFBcUI0QixLQUFLUCxLQUExQixLQUFvQyxPQUFLckIsY0FBTCxFQUFxQjRCLEtBQUtQLEtBQTFCLEVBQWlDUSxFQUFqQyxDQUF4QyxFQUE4RTtBQUM1RSxtQkFBSzdCLGNBQUwsRUFBcUI0QixLQUFLUCxLQUExQixFQUFpQ1EsRUFBakMsRUFBcUNLLElBQXJDLENBQTBDLEVBQUVILFlBQUYsRUFBU0QsWUFBVCxFQUExQztBQUNEO0FBQ0YsU0FaOEIsQ0FBL0I7QUFhRDtBQUNGOzs7eUJBRUlsQixDLEVBQUdpQixFLEVBQUk7QUFDVixVQUFJTSxPQUFPdkIsQ0FBWDtBQUNBLFVBQUksT0FBT0EsQ0FBUCxLQUFhLFFBQWpCLEVBQTJCO0FBQ3pCdUIsZUFBTyxLQUFLdkMsTUFBTCxFQUFhZ0IsQ0FBYixDQUFQO0FBQ0Q7QUFDRCxVQUFNd0IsU0FBUyxJQUFJRCxJQUFKLHFCQUFZQSxLQUFLRSxHQUFqQixFQUF1QlIsRUFBdkIsR0FBNkIsSUFBN0IsQ0FBZjtBQUNBLGFBQU9PLE1BQVA7QUFDRDs7OzBCQUVLeEIsQyxFQUFHMEIsRyxFQUFLO0FBQ1osVUFBSUgsT0FBT3ZCLENBQVg7QUFDQSxVQUFJLE9BQU9BLENBQVAsS0FBYSxRQUFqQixFQUEyQjtBQUN6QnVCLGVBQU8sS0FBS3ZDLE1BQUwsRUFBYWdCLENBQWIsQ0FBUDtBQUNEO0FBQ0QsYUFBTyxJQUFJdUIsSUFBSixDQUFTRyxHQUFULEVBQWMsSUFBZCxDQUFQO0FBQ0Q7O0FBRUQ7QUFDQTs7Ozs4QkFFVUMsUSxFQUFVVixFLEVBQUlXLE8sRUFBUztBQUMvQixVQUFJLEtBQUt4QyxjQUFMLEVBQXFCdUMsUUFBckIsTUFBbUNqQixTQUF2QyxFQUFrRDtBQUNoRCxhQUFLdEIsY0FBTCxFQUFxQnVDLFFBQXJCLElBQWlDLEVBQWpDO0FBQ0Q7QUFDRCxVQUFJLEtBQUt2QyxjQUFMLEVBQXFCdUMsUUFBckIsRUFBK0JWLEVBQS9CLE1BQXVDUCxTQUEzQyxFQUFzRDtBQUNwRCxhQUFLdEIsY0FBTCxFQUFxQnVDLFFBQXJCLEVBQStCVixFQUEvQixJQUFxQyxpQkFBckM7QUFDRDtBQUNELGFBQU8sS0FBSzdCLGNBQUwsRUFBcUJ1QyxRQUFyQixFQUErQlYsRUFBL0IsRUFBbUNZLFNBQW5DLENBQTZDRCxPQUE3QyxDQUFQO0FBQ0Q7OzsrQkFFVTtBQUNULFdBQUt2QyxtQkFBTCxFQUEwQlEsT0FBMUIsQ0FBa0MsVUFBQ0MsQ0FBRDtBQUFBLGVBQU9BLEVBQUVnQyxXQUFGLEVBQVA7QUFBQSxPQUFsQztBQUNBLFdBQUsxQyxjQUFMLElBQXVCc0IsU0FBdkI7QUFDQSxXQUFLckIsbUJBQUwsSUFBNEJxQixTQUE1QjtBQUNEOzs7d0JBRUdNLEksRUFBTUMsRSxFQUFJYyxPLEVBQVM7QUFBQTs7QUFDckIsVUFBSTNCLE9BQU8yQixPQUFYO0FBQ0EsVUFBSSxDQUFDM0IsSUFBTCxFQUFXO0FBQ1RBLGVBQU8sY0FBUDtBQUNEO0FBQ0QsVUFBSSxDQUFDNEIsTUFBTUMsT0FBTixDQUFjN0IsSUFBZCxDQUFMLEVBQTBCO0FBQ3hCQSxlQUFPLENBQUNBLElBQUQsQ0FBUDtBQUNEO0FBQ0QsYUFBTyxLQUFLbEIsUUFBTCxFQUFlZ0QsTUFBZixDQUFzQixVQUFDQyxRQUFELEVBQVd4QyxPQUFYLEVBQXVCO0FBQ2xELGVBQU93QyxTQUFTQyxJQUFULENBQWMsVUFBQ0MsQ0FBRCxFQUFPO0FBQzFCLGNBQUlBLE1BQU0sSUFBVixFQUFnQjtBQUNkLG1CQUFPQSxDQUFQO0FBQ0QsV0FGRCxNQUVPLElBQUkxQyxRQUFRMkMsR0FBUixDQUFZdEIsSUFBWixFQUFrQkMsRUFBbEIsQ0FBSixFQUEyQjtBQUNoQyxtQkFBT3RCLFFBQVE0QyxJQUFSLENBQWF2QixJQUFiLEVBQW1CQyxFQUFuQixFQUF1QmIsSUFBdkIsQ0FBUDtBQUNELFdBRk0sTUFFQTtBQUNMLG1CQUFPLElBQVA7QUFDRDtBQUNGLFNBUk0sQ0FBUDtBQVNELE9BVk0sRUFVSm9DLFFBQVFDLE9BQVIsQ0FBZ0IsSUFBaEIsQ0FWSSxFQVdOTCxJQVhNLENBV0QsVUFBQ0MsQ0FBRCxFQUFPO0FBQ1gsWUFBSSxDQUFFQSxNQUFNLElBQVAsSUFBaUJBLG9CQUFhLElBQS9CLEtBQTBDLE9BQUtsRCxTQUFMLENBQTlDLEVBQWdFO0FBQzlELGlCQUFPLE9BQUtBLFNBQUwsRUFBZ0JvRCxJQUFoQixDQUFxQnZCLElBQXJCLEVBQTJCQyxFQUEzQixFQUErQmIsSUFBL0IsQ0FBUDtBQUNELFNBRkQsTUFFTztBQUNMLGlCQUFPaUMsQ0FBUDtBQUNEO0FBQ0YsT0FqQk0sRUFpQkpELElBakJJLENBaUJDLFVBQUNDLENBQUQsRUFBTztBQUNiLGVBQU9BLENBQVA7QUFDRCxPQW5CTSxDQUFQO0FBb0JEOzs7OEJBRVNyQixJLEVBQU1DLEUsRUFBSWMsTyxFQUFTO0FBQUE7O0FBQzNCLFVBQUkzQixPQUFPMkIsT0FBWDtBQUNBLFVBQUksQ0FBQzNCLElBQUwsRUFBVztBQUNUQSxlQUFPLGNBQVA7QUFDRDtBQUNELFVBQUksQ0FBQzRCLE1BQU1DLE9BQU4sQ0FBYzdCLElBQWQsQ0FBTCxFQUEwQjtBQUN4QkEsZUFBTyxDQUFDQSxJQUFELENBQVA7QUFDRDtBQUNELGFBQU8sZUFBV3NDLE1BQVgsQ0FBa0IsVUFBQ0MsUUFBRCxFQUFjO0FBQ3JDLGVBQU8sbUJBQVNDLEdBQVQsQ0FBYyxPQUFLMUQsUUFBTCxFQUFlMkQsR0FBZixDQUFtQixVQUFDakMsS0FBRCxFQUFXO0FBQ2pELGlCQUFPQSxNQUFNMkIsSUFBTixDQUFXdkIsSUFBWCxFQUFpQkMsRUFBakIsRUFBcUJiLElBQXJCLEVBQ05nQyxJQURNLENBQ0QsVUFBQ0MsQ0FBRCxFQUFPO0FBQ1hNLHFCQUFTckIsSUFBVCxDQUFjZSxDQUFkO0FBQ0EsZ0JBQUl6QixNQUFNMEIsR0FBTixDQUFVdEIsSUFBVixFQUFnQkMsRUFBaEIsQ0FBSixFQUF5QjtBQUN2QixxQkFBT29CLENBQVA7QUFDRCxhQUZELE1BRU87QUFDTCxxQkFBTyxJQUFQO0FBQ0Q7QUFDRixXQVJNLENBQVA7QUFTRCxTQVZvQixDQUFkLEVBV05ELElBWE0sQ0FXRCxVQUFDVSxRQUFELEVBQWM7QUFDbEIsY0FBTUMsV0FBV0QsU0FBU0UsTUFBVCxDQUFnQixVQUFDWCxDQUFEO0FBQUEsbUJBQU9BLE1BQU0sSUFBYjtBQUFBLFdBQWhCLENBQWpCO0FBQ0EsY0FBS1UsU0FBU0UsTUFBVCxLQUFvQixDQUFyQixJQUE0QixPQUFLOUQsU0FBTCxDQUFoQyxFQUFrRDtBQUNoRCxtQkFBTyxPQUFLQSxTQUFMLEVBQWdCb0QsSUFBaEIsQ0FBcUJ2QixJQUFyQixFQUEyQkMsRUFBM0IsRUFBK0JiLElBQS9CLEVBQ05nQyxJQURNLENBQ0QsVUFBQ1YsR0FBRCxFQUFTO0FBQ2JpQix1QkFBU3JCLElBQVQsQ0FBY0ksR0FBZDtBQUNBLHFCQUFPQSxHQUFQO0FBQ0QsYUFKTSxDQUFQO0FBS0QsV0FORCxNQU1PO0FBQ0wsbUJBQU9xQixTQUFTLENBQVQsQ0FBUDtBQUNEO0FBQ0YsU0F0Qk0sRUFzQkpYLElBdEJJLENBc0JDLFVBQUNDLENBQUQsRUFBTztBQUNiTSxtQkFBU08sUUFBVDtBQUNBLGlCQUFPYixDQUFQO0FBQ0QsU0F6Qk0sQ0FBUDtBQTBCRCxPQTNCTSxDQUFQO0FBNEJEOzs7NEJBRU85QyxJLEVBQU07QUFDWixhQUFPLEtBQUtKLFNBQUwsRUFBZ0JnRSxRQUFoQixDQUF5QjVELElBQXpCLENBQVA7QUFDRDs7OzJCQUVhO0FBQ1osVUFBSSxLQUFLSixTQUFMLENBQUosRUFBcUI7QUFBQTs7QUFDbkIsZUFBTyxtQkFBS0EsU0FBTCxHQUFnQmtDLEtBQWhCLDZCQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBT21CLFFBQVFZLE1BQVIsQ0FBZSxJQUFJekMsS0FBSixDQUFVLDZCQUFWLENBQWYsQ0FBUDtBQUNEO0FBQ0Y7Ozs4QkFFZTtBQUFBOztBQUFBLHdDQUFOMEMsSUFBTTtBQUFOQSxZQUFNO0FBQUE7O0FBQ2QsVUFBSSxLQUFLbEUsU0FBTCxDQUFKLEVBQXFCO0FBQUE7O0FBQ25CLGVBQU8sb0JBQUtBLFNBQUwsR0FBZ0JtRSxNQUFoQixvQkFBMEJELElBQTFCLEVBQWdDakIsSUFBaEMsQ0FBcUMsWUFBTTtBQUNoRCxpQkFBTyxtQkFBU1EsR0FBVCxDQUFhLE9BQUsxRCxRQUFMLEVBQWUyRCxHQUFmLENBQW1CLFVBQUNqQyxLQUFELEVBQVc7QUFDaEQsbUJBQU9BLE1BQU0wQyxNQUFOLGNBQWdCRCxJQUFoQixDQUFQO0FBQ0QsV0FGbUIsQ0FBYixDQUFQO0FBR0QsU0FKTSxDQUFQO0FBS0QsT0FORCxNQU1PO0FBQ0wsZUFBT2IsUUFBUVksTUFBUixDQUFlLElBQUl6QyxLQUFKLENBQVUsNkJBQVYsQ0FBZixDQUFQO0FBQ0Q7QUFDRjs7OzBCQUVZO0FBQ1gsVUFBSSxLQUFLeEIsU0FBTCxDQUFKLEVBQXFCO0FBQUE7O0FBQ25CLGVBQU8sb0JBQUtBLFNBQUwsR0FBZ0JvRSxHQUFoQiw4QkFBUDtBQUNELE9BRkQsTUFFTztBQUNMLGVBQU9mLFFBQVFZLE1BQVIsQ0FBZSxJQUFJekMsS0FBSixDQUFVLDZCQUFWLENBQWYsQ0FBUDtBQUNEO0FBQ0Y7OztnQ0FFV3BCLEksRUFBTTtBQUNoQixVQUFJLEtBQUtKLFNBQUwsS0FBbUIsS0FBS0EsU0FBTCxFQUFnQnFFLElBQXZDLEVBQTZDO0FBQzNDLGVBQU8sS0FBS3JFLFNBQUwsRUFBZ0JxRSxJQUFoQixDQUFxQmpFLElBQXJCLENBQVA7QUFDRCxPQUZELE1BRU87QUFDTCxlQUFPaUQsUUFBUVksTUFBUixDQUFlLElBQUl6QyxLQUFKLENBQVUsd0JBQVYsQ0FBZixDQUFQO0FBQ0Q7QUFDRjs7O3lDQUUyQjtBQUMxQixVQUFJLEtBQUt4QixTQUFMLENBQUosRUFBcUI7QUFBQTs7QUFDbkIsZUFBTyxvQkFBS0EsU0FBTCxHQUFnQnNFLGtCQUFoQiw4QkFBUDtBQUNELE9BRkQsTUFFTztBQUNMLGVBQU9qQixRQUFRWSxNQUFSLENBQWUsSUFBSXpDLEtBQUosQ0FBVSw2QkFBVixDQUFmLENBQVA7QUFDRDtBQUNGOzs7NkJBRWU7QUFDZCxVQUFJLEtBQUt4QixTQUFMLENBQUosRUFBcUI7QUFBQTs7QUFDbkIsZUFBTyxvQkFBS0EsU0FBTCxHQUFnQnVFLE1BQWhCLDhCQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBT2xCLFFBQVFZLE1BQVIsQ0FBZSxJQUFJekMsS0FBSixDQUFVLDZCQUFWLENBQWYsQ0FBUDtBQUNEO0FBQ0Y7OzsrQkFFVUssSSxFQUFNQyxFLEVBQUlFLEssRUFBTztBQUFBOztBQUMxQixVQUFNd0MsT0FBTyxLQUFLekUsUUFBTCxFQUFlOEQsTUFBZixDQUFzQixVQUFDcEMsS0FBRDtBQUFBLGVBQVdBLE1BQU0wQixHQUFOLENBQVV0QixJQUFWLEVBQWdCQyxFQUFoQixDQUFYO0FBQUEsT0FBdEIsQ0FBYjtBQUNBLFVBQUksS0FBSzlCLFNBQUwsRUFBZ0JtRCxHQUFoQixDQUFvQnRCLElBQXBCLEVBQTBCQyxFQUExQixDQUFKLEVBQW1DO0FBQ2pDMEMsYUFBSzdDLElBQUwsQ0FBVSxLQUFLM0IsU0FBTCxDQUFWO0FBQ0Q7QUFDRCxhQUFPLG1CQUFTeUQsR0FBVCxDQUFhZSxLQUFLZCxHQUFMLENBQVMsVUFBQ2pDLEtBQUQsRUFBVztBQUN0QyxlQUFPQSxNQUFNZ0QsSUFBTixDQUFXNUMsSUFBWCxFQUFpQkMsRUFBakIsRUFBcUJFLEtBQXJCLENBQVA7QUFDRCxPQUZtQixDQUFiLEVBRUhpQixJQUZHLENBRUUsWUFBTTtBQUNiLFlBQUksT0FBS2hELGNBQUwsRUFBcUI0QixLQUFLUCxLQUExQixLQUFvQyxPQUFLckIsY0FBTCxFQUFxQjRCLEtBQUtQLEtBQTFCLEVBQWlDUSxFQUFqQyxDQUF4QyxFQUE4RTtBQUM1RSxpQkFBTyxPQUFLOUIsU0FBTCxFQUFnQm9ELElBQWhCLENBQXFCdkIsSUFBckIsRUFBMkJDLEVBQTNCLEVBQStCRSxLQUEvQixDQUFQO0FBQ0QsU0FGRCxNQUVPO0FBQ0wsaUJBQU8sSUFBUDtBQUNEO0FBQ0YsT0FSTSxDQUFQO0FBU0QiLCJmaWxlIjoicGx1bXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2RlbCwgJHNlbGYgfSBmcm9tICcuL21vZGVsJztcbmltcG9ydCB7IFN1YmplY3QsIE9ic2VydmFibGUgfSBmcm9tICdyeGpzL1J4JztcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5cbmltcG9ydCB7IFRlc3RUeXBlIH0gZnJvbSAnLi90ZXN0L3Rlc3RUeXBlJztcblxuY29uc3QgJHR5cGVzID0gU3ltYm9sKCckdHlwZXMnKTtcbmNvbnN0ICRzdG9yYWdlID0gU3ltYm9sKCckc3RvcmFnZScpO1xuY29uc3QgJHRlcm1pbmFsID0gU3ltYm9sKCckdGVybWluYWwnKTtcbmNvbnN0ICRzdWJzY3JpcHRpb25zID0gU3ltYm9sKCckc3Vic2NyaXB0aW9ucycpO1xuY29uc3QgJHN0b3JlU3Vic2NyaXB0aW9ucyA9IFN5bWJvbCgnJHN0b3JlU3Vic2NyaXB0aW9ucycpO1xuXG5leHBvcnQgY2xhc3MgUGx1bXAge1xuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwge1xuICAgICAgc3RvcmFnZTogW10sXG4gICAgICB0eXBlczogW10sXG4gICAgfSwgb3B0cyk7XG4gICAgdGhpc1skc3Vic2NyaXB0aW9uc10gPSB7fTtcbiAgICB0aGlzWyRzdG9yZVN1YnNjcmlwdGlvbnNdID0gW107XG4gICAgdGhpc1skc3RvcmFnZV0gPSBbXTtcbiAgICB0aGlzWyR0eXBlc10gPSB7fTtcbiAgICBvcHRpb25zLnN0b3JhZ2UuZm9yRWFjaCgocykgPT4gdGhpcy5hZGRTdG9yZShzKSk7XG4gICAgb3B0aW9ucy50eXBlcy5mb3JFYWNoKCh0KSA9PiB0aGlzLmFkZFR5cGUodCkpO1xuICB9XG5cbiAgYWRkVHlwZXNGcm9tU2NoZW1hKHNjaGVtYSwgRXh0ZW5kaW5nTW9kZWwgPSBNb2RlbCkge1xuICAgIE9iamVjdC5rZXlzKHNjaGVtYSkuZm9yRWFjaCgoaykgPT4ge1xuICAgICAgY2xhc3MgRHluYW1pY01vZGVsIGV4dGVuZHMgRXh0ZW5kaW5nTW9kZWwge31cbiAgICAgIER5bmFtaWNNb2RlbC5mcm9tSlNPTihzY2hlbWFba10pO1xuICAgICAgdGhpcy5hZGRUeXBlKER5bmFtaWNNb2RlbCk7XG4gICAgfSk7XG4gIH1cblxuICBhZGRUeXBlKFQpIHtcbiAgICBpZiAodGhpc1skdHlwZXNdW1QuJG5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHR5cGVzXVtULiRuYW1lXSA9IFQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRHVwbGljYXRlIFR5cGUgcmVnaXN0ZXJlZDogJHtULiRuYW1lfWApO1xuICAgIH1cbiAgfVxuXG4gIHR5cGUoVCkge1xuICAgIHJldHVybiB0aGlzWyR0eXBlc11bVF07XG4gIH1cblxuICB0eXBlcygpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpc1skdHlwZXNdKTtcbiAgfVxuXG4gIGFkZFN0b3JlKHN0b3JlKSB7XG4gICAgaWYgKHN0b3JlLnRlcm1pbmFsKSB7XG4gICAgICBpZiAodGhpc1skdGVybWluYWxdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpc1skdGVybWluYWxdID0gc3RvcmU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBoYXZlIG1vcmUgdGhhbiBvbmUgdGVybWluYWwgc3RvcmUnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpc1skc3RvcmFnZV0ucHVzaChzdG9yZSk7XG4gICAgfVxuICAgIGlmIChzdG9yZS50ZXJtaW5hbCkge1xuICAgICAgdGhpc1skc3RvcmVTdWJzY3JpcHRpb25zXS5wdXNoKHN0b3JlLm9uVXBkYXRlKCh7IHR5cGUsIGlkLCB2YWx1ZSwgZmllbGQgfSkgPT4ge1xuICAgICAgICB0aGlzWyRzdG9yYWdlXS5mb3JFYWNoKChzdG9yYWdlKSA9PiB7XG4gICAgICAgICAgaWYgKGZpZWxkKSB7XG4gICAgICAgICAgICBzdG9yYWdlLndyaXRlSGFzTWFueSh0eXBlLCBpZCwgZmllbGQsIHZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RvcmFnZS53cml0ZSh0eXBlLCB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHN0b3JhZ2Uub25DYWNoZWFibGVSZWFkKFR5cGUsIE9iamVjdC5hc3NpZ24oe30sIHUudmFsdWUsIHsgW1R5cGUuJGlkXTogdS5pZCB9KSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV0gJiYgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV1baWRdKSB7XG4gICAgICAgICAgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV1baWRdLm5leHQoeyBmaWVsZCwgdmFsdWUgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9XG4gIH1cblxuICBmaW5kKHQsIGlkKSB7XG4gICAgbGV0IFR5cGUgPSB0O1xuICAgIGlmICh0eXBlb2YgdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIFR5cGUgPSB0aGlzWyR0eXBlc11bdF07XG4gICAgfVxuICAgIGNvbnN0IHJldFZhbCA9IG5ldyBUeXBlKHsgW1R5cGUuJGlkXTogaWQgfSwgdGhpcyk7XG4gICAgcmV0dXJuIHJldFZhbDtcbiAgfVxuXG4gIGZvcmdlKHQsIHZhbCkge1xuICAgIGxldCBUeXBlID0gdDtcbiAgICBpZiAodHlwZW9mIHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBUeXBlID0gdGhpc1skdHlwZXNdW3RdO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFR5cGUodmFsLCB0aGlzKTtcbiAgfVxuXG4gIC8vIExPQUQgKHR5cGUvaWQpLCBTSURFTE9BRCAodHlwZS9pZC9zaWRlKT8gT3IganVzdCBMT0FEQUxMP1xuICAvLyBMT0FEIG5lZWRzIHRvIHNjcnViIHRocm91Z2ggaG90IGNhY2hlcyBmaXJzdFxuXG4gIHN1YnNjcmliZSh0eXBlTmFtZSwgaWQsIGhhbmRsZXIpIHtcbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXSA9IHt9O1xuICAgIH1cbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdW2lkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV1baWRdID0gbmV3IFN1YmplY3QoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXVtpZF0uc3Vic2NyaWJlKGhhbmRsZXIpO1xuICB9XG5cbiAgdGVhcmRvd24oKSB7XG4gICAgdGhpc1skc3RvcmVTdWJzY3JpcHRpb25zXS5mb3JFYWNoKChzKSA9PiBzLnVuc3Vic2NyaWJlKCkpO1xuICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdID0gdW5kZWZpbmVkO1xuICAgIHRoaXNbJHN0b3JlU3Vic2NyaXB0aW9uc10gPSB1bmRlZmluZWQ7XG4gIH1cblxuICBnZXQodHlwZSwgaWQsIGtleU9wdHMpIHtcbiAgICBsZXQga2V5cyA9IGtleU9wdHM7XG4gICAgaWYgKCFrZXlzKSB7XG4gICAgICBrZXlzID0gWyRzZWxmXTtcbiAgICB9XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGtleXMpKSB7XG4gICAgICBrZXlzID0gW2tleXNdO1xuICAgIH1cbiAgICByZXR1cm4gdGhpc1skc3RvcmFnZV0ucmVkdWNlKCh0aGVuYWJsZSwgc3RvcmFnZSkgPT4ge1xuICAgICAgcmV0dXJuIHRoZW5hYmxlLnRoZW4oKHYpID0+IHtcbiAgICAgICAgaWYgKHYgIT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfSBlbHNlIGlmIChzdG9yYWdlLmhvdCh0eXBlLCBpZCkpIHtcbiAgICAgICAgICByZXR1cm4gc3RvcmFnZS5yZWFkKHR5cGUsIGlkLCBrZXlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSwgUHJvbWlzZS5yZXNvbHZlKG51bGwpKVxuICAgIC50aGVuKCh2KSA9PiB7XG4gICAgICBpZiAoKCh2ID09PSBudWxsKSB8fCAodlskc2VsZl0gPT09IG51bGwpKSAmJiAodGhpc1skdGVybWluYWxdKSkge1xuICAgICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlYWQodHlwZSwgaWQsIGtleXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgICB9XG4gICAgfSkudGhlbigodikgPT4ge1xuICAgICAgcmV0dXJuIHY7XG4gICAgfSk7XG4gIH1cblxuICBzdHJlYW1HZXQodHlwZSwgaWQsIGtleU9wdHMpIHtcbiAgICBsZXQga2V5cyA9IGtleU9wdHM7XG4gICAgaWYgKCFrZXlzKSB7XG4gICAgICBrZXlzID0gWyRzZWxmXTtcbiAgICB9XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGtleXMpKSB7XG4gICAgICBrZXlzID0gW2tleXNdO1xuICAgIH1cbiAgICByZXR1cm4gT2JzZXJ2YWJsZS5jcmVhdGUoKG9ic2VydmVyKSA9PiB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKCh0aGlzWyRzdG9yYWdlXS5tYXAoKHN0b3JlKSA9PiB7XG4gICAgICAgIHJldHVybiBzdG9yZS5yZWFkKHR5cGUsIGlkLCBrZXlzKVxuICAgICAgICAudGhlbigodikgPT4ge1xuICAgICAgICAgIG9ic2VydmVyLm5leHQodik7XG4gICAgICAgICAgaWYgKHN0b3JlLmhvdCh0eXBlLCBpZCkpIHtcbiAgICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSkpKVxuICAgICAgLnRoZW4oKHZhbEFycmF5KSA9PiB7XG4gICAgICAgIGNvbnN0IHBvc3NpVmFsID0gdmFsQXJyYXkuZmlsdGVyKCh2KSA9PiB2ICE9PSBudWxsKTtcbiAgICAgICAgaWYgKChwb3NzaVZhbC5sZW5ndGggPT09IDApICYmICh0aGlzWyR0ZXJtaW5hbF0pKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZWFkKHR5cGUsIGlkLCBrZXlzKVxuICAgICAgICAgIC50aGVuKCh2YWwpID0+IHtcbiAgICAgICAgICAgIG9ic2VydmVyLm5leHQodmFsKTtcbiAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHBvc3NpVmFsWzBdO1xuICAgICAgICB9XG4gICAgICB9KS50aGVuKCh2KSA9PiB7XG4gICAgICAgIG9ic2VydmVyLmNvbXBsZXRlKCk7XG4gICAgICAgIHJldHVybiB2O1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBidWxrR2V0KG9wdHMpIHtcbiAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLmJ1bGtSZWFkKG9wdHMpO1xuICB9XG5cbiAgc2F2ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS53cml0ZSguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIGRlbGV0ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5kZWxldGUoLi4uYXJncykudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwodGhpc1skc3RvcmFnZV0ubWFwKChzdG9yZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBzdG9yZS5kZWxldGUoLi4uYXJncyk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgYWRkKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLmFkZCguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIHJlc3RSZXF1ZXN0KG9wdHMpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdICYmIHRoaXNbJHRlcm1pbmFsXS5yZXN0KSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlc3Qob3B0cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ05vIFJlc3QgdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLm1vZGlmeVJlbGF0aW9uc2hpcCguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZW1vdmUoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBpbnZhbGlkYXRlKHR5cGUsIGlkLCBmaWVsZCkge1xuICAgIGNvbnN0IGhvdHMgPSB0aGlzWyRzdG9yYWdlXS5maWx0ZXIoKHN0b3JlKSA9PiBzdG9yZS5ob3QodHlwZSwgaWQpKTtcbiAgICBpZiAodGhpc1skdGVybWluYWxdLmhvdCh0eXBlLCBpZCkpIHtcbiAgICAgIGhvdHMucHVzaCh0aGlzWyR0ZXJtaW5hbF0pO1xuICAgIH1cbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKGhvdHMubWFwKChzdG9yZSkgPT4ge1xuICAgICAgcmV0dXJuIHN0b3JlLndpcGUodHlwZSwgaWQsIGZpZWxkKTtcbiAgICB9KSkudGhlbigoKSA9PiB7XG4gICAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV0gJiYgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV1baWRdKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVhZCh0eXBlLCBpZCwgZmllbGQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==
