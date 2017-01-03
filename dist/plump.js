'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Plump = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _model = require('./model');

var _Rx = require('rxjs/Rx');

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
      if (this[$terminal]) {
        var _$terminal3;

        return (_$terminal3 = this[$terminal]).delete.apply(_$terminal3, arguments);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBsdW1wLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHN1YnNjcmlwdGlvbnMiLCIkc3RvcmVTdWJzY3JpcHRpb25zIiwiUGx1bXAiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInN0b3JhZ2UiLCJ0eXBlcyIsImZvckVhY2giLCJzIiwiYWRkU3RvcmUiLCJ0IiwiYWRkVHlwZSIsInNjaGVtYSIsIkV4dGVuZGluZ01vZGVsIiwia2V5cyIsImsiLCJEeW5hbWljTW9kZWwiLCJmcm9tSlNPTiIsIlQiLCIkbmFtZSIsInVuZGVmaW5lZCIsIkVycm9yIiwic3RvcmUiLCJ0ZXJtaW5hbCIsInB1c2giLCJvblVwZGF0ZSIsInR5cGUiLCJpZCIsInZhbHVlIiwiZmllbGQiLCJ3cml0ZUhhc01hbnkiLCJ3cml0ZSIsIm5leHQiLCJUeXBlIiwicmV0VmFsIiwiJGlkIiwidmFsIiwidHlwZU5hbWUiLCJoYW5kbGVyIiwic3Vic2NyaWJlIiwidW5zdWJzY3JpYmUiLCJhcmdzIiwicmVkdWNlIiwidGhlbmFibGUiLCJ0aGVuIiwidiIsInJlYWQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImRlbGV0ZSIsImFkZCIsInJlc3QiLCJtb2RpZnlSZWxhdGlvbnNoaXAiLCJyZW1vdmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQU1BOztBQUVBOzs7Ozs7Ozs7O0FBUkEsSUFBTUEsU0FBU0MsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNQyxXQUFXRCxPQUFPLFVBQVAsQ0FBakI7QUFDQSxJQUFNRSxZQUFZRixPQUFPLFdBQVAsQ0FBbEI7QUFDQSxJQUFNRyxpQkFBaUJILE9BQU8sZ0JBQVAsQ0FBdkI7QUFDQSxJQUFNSSxzQkFBc0JKLE9BQU8scUJBQVAsQ0FBNUI7O0lBTWFLLEssV0FBQUEsSztBQUNYLG1CQUF1QjtBQUFBOztBQUFBLFFBQVhDLElBQVcsdUVBQUosRUFBSTs7QUFBQTs7QUFDckIsUUFBTUMsVUFBVUMsT0FBT0MsTUFBUCxDQUFjLEVBQWQsRUFBa0I7QUFDaENDLGVBQVMsRUFEdUI7QUFFaENDLGFBQU87QUFGeUIsS0FBbEIsRUFHYkwsSUFIYSxDQUFoQjtBQUlBLFNBQUtILGNBQUwsSUFBdUIsRUFBdkI7QUFDQSxTQUFLQyxtQkFBTCxJQUE0QixFQUE1QjtBQUNBLFNBQUtILFFBQUwsSUFBaUIsRUFBakI7QUFDQSxTQUFLRixNQUFMLElBQWUsRUFBZjtBQUNBUSxZQUFRRyxPQUFSLENBQWdCRSxPQUFoQixDQUF3QixVQUFDQyxDQUFEO0FBQUEsYUFBTyxNQUFLQyxRQUFMLENBQWNELENBQWQsQ0FBUDtBQUFBLEtBQXhCO0FBQ0FOLFlBQVFJLEtBQVIsQ0FBY0MsT0FBZCxDQUFzQixVQUFDRyxDQUFEO0FBQUEsYUFBTyxNQUFLQyxPQUFMLENBQWFELENBQWIsQ0FBUDtBQUFBLEtBQXRCO0FBQ0Q7Ozs7dUNBRWtCRSxNLEVBQWdDO0FBQUE7O0FBQUEsVUFBeEJDLGNBQXdCOztBQUNqRFYsYUFBT1csSUFBUCxDQUFZRixNQUFaLEVBQW9CTCxPQUFwQixDQUE0QixVQUFDUSxDQUFELEVBQU87QUFBQSxZQUMzQkMsWUFEMkI7QUFBQTs7QUFBQTtBQUFBOztBQUFBO0FBQUE7O0FBQUE7QUFBQSxVQUNOSCxjQURNOztBQUVqQ0cscUJBQWFDLFFBQWIsQ0FBc0JMLE9BQU9HLENBQVAsQ0FBdEI7QUFDQSxlQUFLSixPQUFMLENBQWFLLFlBQWI7QUFDRCxPQUpEO0FBS0Q7Ozs0QkFFT0UsQyxFQUFHO0FBQ1QsVUFBSSxLQUFLeEIsTUFBTCxFQUFhd0IsRUFBRUMsS0FBZixNQUEwQkMsU0FBOUIsRUFBeUM7QUFDdkMsYUFBSzFCLE1BQUwsRUFBYXdCLEVBQUVDLEtBQWYsSUFBd0JELENBQXhCO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsY0FBTSxJQUFJRyxLQUFKLGlDQUF3Q0gsRUFBRUMsS0FBMUMsQ0FBTjtBQUNEO0FBQ0Y7Ozt5QkFFSUQsQyxFQUFHO0FBQ04sYUFBTyxLQUFLeEIsTUFBTCxFQUFhd0IsQ0FBYixDQUFQO0FBQ0Q7Ozs0QkFFTztBQUNOLGFBQU9mLE9BQU9XLElBQVAsQ0FBWSxLQUFLcEIsTUFBTCxDQUFaLENBQVA7QUFDRDs7OzZCQUVRNEIsSyxFQUFPO0FBQUE7O0FBQ2QsVUFBSUEsTUFBTUMsUUFBVixFQUFvQjtBQUNsQixZQUFJLEtBQUsxQixTQUFMLE1BQW9CdUIsU0FBeEIsRUFBbUM7QUFDakMsZUFBS3ZCLFNBQUwsSUFBa0J5QixLQUFsQjtBQUNELFNBRkQsTUFFTztBQUNMLGdCQUFNLElBQUlELEtBQUosQ0FBVSwwQ0FBVixDQUFOO0FBQ0Q7QUFDRixPQU5ELE1BTU87QUFDTCxhQUFLekIsUUFBTCxFQUFlNEIsSUFBZixDQUFvQkYsS0FBcEI7QUFDRDtBQUNELFVBQUlBLE1BQU1DLFFBQVYsRUFBb0I7QUFDbEIsYUFBS3hCLG1CQUFMLEVBQTBCeUIsSUFBMUIsQ0FBK0JGLE1BQU1HLFFBQU4sQ0FBZSxnQkFBZ0M7QUFBQSxjQUE3QkMsSUFBNkIsUUFBN0JBLElBQTZCO0FBQUEsY0FBdkJDLEVBQXVCLFFBQXZCQSxFQUF1QjtBQUFBLGNBQW5CQyxLQUFtQixRQUFuQkEsS0FBbUI7QUFBQSxjQUFaQyxLQUFZLFFBQVpBLEtBQVk7O0FBQzVFLGlCQUFLakMsUUFBTCxFQUFlVyxPQUFmLENBQXVCLFVBQUNGLE9BQUQsRUFBYTtBQUNsQyxnQkFBSXdCLEtBQUosRUFBVztBQUNUeEIsc0JBQVF5QixZQUFSLENBQXFCSixJQUFyQixFQUEyQkMsRUFBM0IsRUFBK0JFLEtBQS9CLEVBQXNDRCxLQUF0QztBQUNELGFBRkQsTUFFTztBQUNMdkIsc0JBQVEwQixLQUFSLENBQWNMLElBQWQsRUFBb0JFLEtBQXBCO0FBQ0Q7QUFDRDtBQUNELFdBUEQ7QUFRQSxjQUFJLE9BQUs5QixjQUFMLEVBQXFCNEIsS0FBS1AsS0FBMUIsS0FBb0MsT0FBS3JCLGNBQUwsRUFBcUI0QixLQUFLUCxLQUExQixFQUFpQ1EsRUFBakMsQ0FBeEMsRUFBOEU7QUFDNUUsbUJBQUs3QixjQUFMLEVBQXFCNEIsS0FBS1AsS0FBMUIsRUFBaUNRLEVBQWpDLEVBQXFDSyxJQUFyQyxDQUEwQyxFQUFFSCxZQUFGLEVBQVNELFlBQVQsRUFBMUM7QUFDRDtBQUNGLFNBWjhCLENBQS9CO0FBYUQ7QUFDRjs7O3lCQUVJbEIsQyxFQUFHaUIsRSxFQUFJO0FBQ1YsVUFBSU0sT0FBT3ZCLENBQVg7QUFDQSxVQUFJLE9BQU9BLENBQVAsS0FBYSxRQUFqQixFQUEyQjtBQUN6QnVCLGVBQU8sS0FBS3ZDLE1BQUwsRUFBYWdCLENBQWIsQ0FBUDtBQUNEO0FBQ0QsVUFBTXdCLFNBQVMsSUFBSUQsSUFBSixxQkFBWUEsS0FBS0UsR0FBakIsRUFBdUJSLEVBQXZCLEdBQTZCLElBQTdCLENBQWY7QUFDQSxhQUFPTyxNQUFQO0FBQ0Q7OzswQkFFS3hCLEMsRUFBRzBCLEcsRUFBSztBQUNaLFVBQUlILE9BQU92QixDQUFYO0FBQ0EsVUFBSSxPQUFPQSxDQUFQLEtBQWEsUUFBakIsRUFBMkI7QUFDekJ1QixlQUFPLEtBQUt2QyxNQUFMLEVBQWFnQixDQUFiLENBQVA7QUFDRDtBQUNELGFBQU8sSUFBSXVCLElBQUosQ0FBU0csR0FBVCxFQUFjLElBQWQsQ0FBUDtBQUNEOztBQUVEO0FBQ0E7Ozs7OEJBRVVDLFEsRUFBVVYsRSxFQUFJVyxPLEVBQVM7QUFDL0IsVUFBSSxLQUFLeEMsY0FBTCxFQUFxQnVDLFFBQXJCLE1BQW1DakIsU0FBdkMsRUFBa0Q7QUFDaEQsYUFBS3RCLGNBQUwsRUFBcUJ1QyxRQUFyQixJQUFpQyxFQUFqQztBQUNEO0FBQ0QsVUFBSSxLQUFLdkMsY0FBTCxFQUFxQnVDLFFBQXJCLEVBQStCVixFQUEvQixNQUF1Q1AsU0FBM0MsRUFBc0Q7QUFDcEQsYUFBS3RCLGNBQUwsRUFBcUJ1QyxRQUFyQixFQUErQlYsRUFBL0IsSUFBcUMsaUJBQXJDO0FBQ0Q7QUFDRCxhQUFPLEtBQUs3QixjQUFMLEVBQXFCdUMsUUFBckIsRUFBK0JWLEVBQS9CLEVBQW1DWSxTQUFuQyxDQUE2Q0QsT0FBN0MsQ0FBUDtBQUNEOzs7K0JBRVU7QUFDVCxXQUFLdkMsbUJBQUwsRUFBMEJRLE9BQTFCLENBQWtDLFVBQUNDLENBQUQ7QUFBQSxlQUFPQSxFQUFFZ0MsV0FBRixFQUFQO0FBQUEsT0FBbEM7QUFDQSxXQUFLMUMsY0FBTCxJQUF1QnNCLFNBQXZCO0FBQ0EsV0FBS3JCLG1CQUFMLElBQTRCcUIsU0FBNUI7QUFDRDs7OzBCQUVZO0FBQUE7O0FBQUEsd0NBQU5xQixJQUFNO0FBQU5BLFlBQU07QUFBQTs7QUFDWCxhQUFPLEtBQUs3QyxRQUFMLEVBQWU4QyxNQUFmLENBQXNCLFVBQUNDLFFBQUQsRUFBV3RDLE9BQVgsRUFBdUI7QUFDbEQsZUFBT3NDLFNBQVNDLElBQVQsQ0FBYyxVQUFDQyxDQUFELEVBQU87QUFDMUIsY0FBSUEsTUFBTSxJQUFWLEVBQWdCO0FBQ2QsbUJBQU9BLENBQVA7QUFDRCxXQUZELE1BRU87QUFDTCxtQkFBT3hDLFFBQVF5QyxJQUFSLGdCQUFnQkwsSUFBaEIsQ0FBUDtBQUNEO0FBQ0YsU0FOTSxDQUFQO0FBT0QsT0FSTSxFQVFKTSxRQUFRQyxPQUFSLENBQWdCLElBQWhCLENBUkksRUFTTkosSUFUTSxDQVNELFVBQUNDLENBQUQsRUFBTztBQUNYLFlBQUtBLE1BQU0sSUFBUCxJQUFpQixPQUFLaEQsU0FBTCxDQUFyQixFQUF1QztBQUFBOztBQUNyQyxpQkFBTyxxQkFBS0EsU0FBTCxHQUFnQmlELElBQWhCLG1CQUF3QkwsSUFBeEIsQ0FBUDtBQUNELFNBRkQsTUFFTztBQUNMLGlCQUFPSSxDQUFQO0FBQ0Q7QUFDRixPQWZNLEVBZUpELElBZkksQ0FlQyxVQUFDQyxDQUFELEVBQU87QUFDYixlQUFPQSxDQUFQO0FBQ0QsT0FqQk0sQ0FBUDtBQWtCRDs7OzJCQUVhO0FBQ1osVUFBSSxLQUFLaEQsU0FBTCxDQUFKLEVBQXFCO0FBQUE7O0FBQ25CLGVBQU8sb0JBQUtBLFNBQUwsR0FBZ0JrQyxLQUFoQiw4QkFBUDtBQUNELE9BRkQsTUFFTztBQUNMLGVBQU9nQixRQUFRRSxNQUFSLENBQWUsSUFBSTVCLEtBQUosQ0FBVSw2QkFBVixDQUFmLENBQVA7QUFDRDtBQUNGOzs7OEJBRWU7QUFDZCxVQUFJLEtBQUt4QixTQUFMLENBQUosRUFBcUI7QUFBQTs7QUFDbkIsZUFBTyxvQkFBS0EsU0FBTCxHQUFnQnFELE1BQWhCLDhCQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBT0gsUUFBUUUsTUFBUixDQUFlLElBQUk1QixLQUFKLENBQVUsNkJBQVYsQ0FBZixDQUFQO0FBQ0Q7QUFDRjs7OzBCQUVZO0FBQ1gsVUFBSSxLQUFLeEIsU0FBTCxDQUFKLEVBQXFCO0FBQUE7O0FBQ25CLGVBQU8sb0JBQUtBLFNBQUwsR0FBZ0JzRCxHQUFoQiw4QkFBUDtBQUNELE9BRkQsTUFFTztBQUNMLGVBQU9KLFFBQVFFLE1BQVIsQ0FBZSxJQUFJNUIsS0FBSixDQUFVLDZCQUFWLENBQWYsQ0FBUDtBQUNEO0FBQ0Y7OztnQ0FFV3BCLEksRUFBTTtBQUNoQixVQUFJLEtBQUtKLFNBQUwsS0FBbUIsS0FBS0EsU0FBTCxFQUFnQnVELElBQXZDLEVBQTZDO0FBQzNDLGVBQU8sS0FBS3ZELFNBQUwsRUFBZ0J1RCxJQUFoQixDQUFxQm5ELElBQXJCLENBQVA7QUFDRCxPQUZELE1BRU87QUFDTCxlQUFPOEMsUUFBUUUsTUFBUixDQUFlLElBQUk1QixLQUFKLENBQVUsd0JBQVYsQ0FBZixDQUFQO0FBQ0Q7QUFDRjs7O3lDQUUyQjtBQUMxQixVQUFJLEtBQUt4QixTQUFMLENBQUosRUFBcUI7QUFBQTs7QUFDbkIsZUFBTyxvQkFBS0EsU0FBTCxHQUFnQndELGtCQUFoQiw4QkFBUDtBQUNELE9BRkQsTUFFTztBQUNMLGVBQU9OLFFBQVFFLE1BQVIsQ0FBZSxJQUFJNUIsS0FBSixDQUFVLDZCQUFWLENBQWYsQ0FBUDtBQUNEO0FBQ0Y7Ozs2QkFFZTtBQUNkLFVBQUksS0FBS3hCLFNBQUwsQ0FBSixFQUFxQjtBQUFBOztBQUNuQixlQUFPLG9CQUFLQSxTQUFMLEdBQWdCeUQsTUFBaEIsOEJBQVA7QUFDRCxPQUZELE1BRU87QUFDTCxlQUFPUCxRQUFRRSxNQUFSLENBQWUsSUFBSTVCLEtBQUosQ0FBVSw2QkFBVixDQUFmLENBQVA7QUFDRDtBQUNGIiwiZmlsZSI6InBsdW1wLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgJHR5cGVzID0gU3ltYm9sKCckdHlwZXMnKTtcbmNvbnN0ICRzdG9yYWdlID0gU3ltYm9sKCckc3RvcmFnZScpO1xuY29uc3QgJHRlcm1pbmFsID0gU3ltYm9sKCckdGVybWluYWwnKTtcbmNvbnN0ICRzdWJzY3JpcHRpb25zID0gU3ltYm9sKCckc3Vic2NyaXB0aW9ucycpO1xuY29uc3QgJHN0b3JlU3Vic2NyaXB0aW9ucyA9IFN5bWJvbCgnJHN0b3JlU3Vic2NyaXB0aW9ucycpO1xuXG5pbXBvcnQgeyBNb2RlbCB9IGZyb20gJy4vbW9kZWwnO1xuXG5pbXBvcnQgeyBTdWJqZWN0IH0gZnJvbSAncnhqcy9SeCc7XG5cbmV4cG9ydCBjbGFzcyBQbHVtcCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB7XG4gICAgICBzdG9yYWdlOiBbXSxcbiAgICAgIHR5cGVzOiBbXSxcbiAgICB9LCBvcHRzKTtcbiAgICB0aGlzWyRzdWJzY3JpcHRpb25zXSA9IHt9O1xuICAgIHRoaXNbJHN0b3JlU3Vic2NyaXB0aW9uc10gPSBbXTtcbiAgICB0aGlzWyRzdG9yYWdlXSA9IFtdO1xuICAgIHRoaXNbJHR5cGVzXSA9IHt9O1xuICAgIG9wdGlvbnMuc3RvcmFnZS5mb3JFYWNoKChzKSA9PiB0aGlzLmFkZFN0b3JlKHMpKTtcbiAgICBvcHRpb25zLnR5cGVzLmZvckVhY2goKHQpID0+IHRoaXMuYWRkVHlwZSh0KSk7XG4gIH1cblxuICBhZGRUeXBlc0Zyb21TY2hlbWEoc2NoZW1hLCBFeHRlbmRpbmdNb2RlbCA9IE1vZGVsKSB7XG4gICAgT2JqZWN0LmtleXMoc2NoZW1hKS5mb3JFYWNoKChrKSA9PiB7XG4gICAgICBjbGFzcyBEeW5hbWljTW9kZWwgZXh0ZW5kcyBFeHRlbmRpbmdNb2RlbCB7fVxuICAgICAgRHluYW1pY01vZGVsLmZyb21KU09OKHNjaGVtYVtrXSk7XG4gICAgICB0aGlzLmFkZFR5cGUoRHluYW1pY01vZGVsKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFkZFR5cGUoVCkge1xuICAgIGlmICh0aGlzWyR0eXBlc11bVC4kbmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skdHlwZXNdW1QuJG5hbWVdID0gVDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBEdXBsaWNhdGUgVHlwZSByZWdpc3RlcmVkOiAke1QuJG5hbWV9YCk7XG4gICAgfVxuICB9XG5cbiAgdHlwZShUKSB7XG4gICAgcmV0dXJuIHRoaXNbJHR5cGVzXVtUXTtcbiAgfVxuXG4gIHR5cGVzKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzWyR0eXBlc10pO1xuICB9XG5cbiAgYWRkU3RvcmUoc3RvcmUpIHtcbiAgICBpZiAoc3RvcmUudGVybWluYWwpIHtcbiAgICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzWyR0ZXJtaW5hbF0gPSBzdG9yZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGhhdmUgbW9yZSB0aGFuIG9uZSB0ZXJtaW5hbCBzdG9yZScpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzWyRzdG9yYWdlXS5wdXNoKHN0b3JlKTtcbiAgICB9XG4gICAgaWYgKHN0b3JlLnRlcm1pbmFsKSB7XG4gICAgICB0aGlzWyRzdG9yZVN1YnNjcmlwdGlvbnNdLnB1c2goc3RvcmUub25VcGRhdGUoKHsgdHlwZSwgaWQsIHZhbHVlLCBmaWVsZCB9KSA9PiB7XG4gICAgICAgIHRoaXNbJHN0b3JhZ2VdLmZvckVhY2goKHN0b3JhZ2UpID0+IHtcbiAgICAgICAgICBpZiAoZmllbGQpIHtcbiAgICAgICAgICAgIHN0b3JhZ2Uud3JpdGVIYXNNYW55KHR5cGUsIGlkLCBmaWVsZCwgdmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdG9yYWdlLndyaXRlKHR5cGUsIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gc3RvcmFnZS5vbkNhY2hlYWJsZVJlYWQoVHlwZSwgT2JqZWN0LmFzc2lnbih7fSwgdS52YWx1ZSwgeyBbVHlwZS4kaWRdOiB1LmlkIH0pKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlLiRuYW1lXSAmJiB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlLiRuYW1lXVtpZF0pIHtcbiAgICAgICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlLiRuYW1lXVtpZF0ubmV4dCh7IGZpZWxkLCB2YWx1ZSB9KTtcbiAgICAgICAgfVxuICAgICAgfSkpO1xuICAgIH1cbiAgfVxuXG4gIGZpbmQodCwgaWQpIHtcbiAgICBsZXQgVHlwZSA9IHQ7XG4gICAgaWYgKHR5cGVvZiB0ID09PSAnc3RyaW5nJykge1xuICAgICAgVHlwZSA9IHRoaXNbJHR5cGVzXVt0XTtcbiAgICB9XG4gICAgY29uc3QgcmV0VmFsID0gbmV3IFR5cGUoeyBbVHlwZS4kaWRdOiBpZCB9LCB0aGlzKTtcbiAgICByZXR1cm4gcmV0VmFsO1xuICB9XG5cbiAgZm9yZ2UodCwgdmFsKSB7XG4gICAgbGV0IFR5cGUgPSB0O1xuICAgIGlmICh0eXBlb2YgdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIFR5cGUgPSB0aGlzWyR0eXBlc11bdF07XG4gICAgfVxuICAgIHJldHVybiBuZXcgVHlwZSh2YWwsIHRoaXMpO1xuICB9XG5cbiAgLy8gTE9BRCAodHlwZS9pZCksIFNJREVMT0FEICh0eXBlL2lkL3NpZGUpPyBPciBqdXN0IExPQURBTEw/XG4gIC8vIExPQUQgbmVlZHMgdG8gc2NydWIgdGhyb3VnaCBob3QgY2FjaGVzIGZpcnN0XG5cbiAgc3Vic2NyaWJlKHR5cGVOYW1lLCBpZCwgaGFuZGxlcikge1xuICAgIGlmICh0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdID0ge307XG4gICAgfVxuICAgIGlmICh0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV1baWRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXVtpZF0gPSBuZXcgU3ViamVjdCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdW2lkXS5zdWJzY3JpYmUoaGFuZGxlcik7XG4gIH1cblxuICB0ZWFyZG93bigpIHtcbiAgICB0aGlzWyRzdG9yZVN1YnNjcmlwdGlvbnNdLmZvckVhY2goKHMpID0+IHMudW5zdWJzY3JpYmUoKSk7XG4gICAgdGhpc1skc3Vic2NyaXB0aW9uc10gPSB1bmRlZmluZWQ7XG4gICAgdGhpc1skc3RvcmVTdWJzY3JpcHRpb25zXSA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGdldCguLi5hcmdzKSB7XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JhZ2VdLnJlZHVjZSgodGhlbmFibGUsIHN0b3JhZ2UpID0+IHtcbiAgICAgIHJldHVybiB0aGVuYWJsZS50aGVuKCh2KSA9PiB7XG4gICAgICAgIGlmICh2ICE9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JhZ2UucmVhZCguLi5hcmdzKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSwgUHJvbWlzZS5yZXNvbHZlKG51bGwpKVxuICAgIC50aGVuKCh2KSA9PiB7XG4gICAgICBpZiAoKHYgPT09IG51bGwpICYmICh0aGlzWyR0ZXJtaW5hbF0pKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVhZCguLi5hcmdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB2O1xuICAgICAgfVxuICAgIH0pLnRoZW4oKHYpID0+IHtcbiAgICAgIHJldHVybiB2O1xuICAgIH0pO1xuICB9XG5cbiAgc2F2ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS53cml0ZSguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIGRlbGV0ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5kZWxldGUoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBhZGQoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0uYWRkKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgcmVzdFJlcXVlc3Qob3B0cykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0gJiYgdGhpc1skdGVybWluYWxdLnJlc3QpIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVzdChvcHRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignTm8gUmVzdCB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBtb2RpZnlSZWxhdGlvbnNoaXAoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ubW9kaWZ5UmVsYXRpb25zaGlwKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlbW92ZSguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxufVxuIl19
