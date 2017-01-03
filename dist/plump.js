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
      var _this6 = this;

      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      if (this[$terminal]) {
        var _$terminal3;

        return (_$terminal3 = this[$terminal]).delete.apply(_$terminal3, args).then(function () {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBsdW1wLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHN1YnNjcmlwdGlvbnMiLCIkc3RvcmVTdWJzY3JpcHRpb25zIiwiUGx1bXAiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInN0b3JhZ2UiLCJ0eXBlcyIsImZvckVhY2giLCJzIiwiYWRkU3RvcmUiLCJ0IiwiYWRkVHlwZSIsInNjaGVtYSIsIkV4dGVuZGluZ01vZGVsIiwia2V5cyIsImsiLCJEeW5hbWljTW9kZWwiLCJmcm9tSlNPTiIsIlQiLCIkbmFtZSIsInVuZGVmaW5lZCIsIkVycm9yIiwic3RvcmUiLCJ0ZXJtaW5hbCIsInB1c2giLCJvblVwZGF0ZSIsInR5cGUiLCJpZCIsInZhbHVlIiwiZmllbGQiLCJ3cml0ZUhhc01hbnkiLCJ3cml0ZSIsIm5leHQiLCJUeXBlIiwicmV0VmFsIiwiJGlkIiwidmFsIiwidHlwZU5hbWUiLCJoYW5kbGVyIiwic3Vic2NyaWJlIiwidW5zdWJzY3JpYmUiLCJhcmdzIiwicmVkdWNlIiwidGhlbmFibGUiLCJ0aGVuIiwidiIsInJlYWQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImRlbGV0ZSIsImFsbCIsIm1hcCIsImFkZCIsInJlc3QiLCJtb2RpZnlSZWxhdGlvbnNoaXAiLCJyZW1vdmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7Ozs7Ozs7Ozs7OztBQUVBLElBQU1BLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUMsV0FBV0QsT0FBTyxVQUFQLENBQWpCO0FBQ0EsSUFBTUUsWUFBWUYsT0FBTyxXQUFQLENBQWxCO0FBQ0EsSUFBTUcsaUJBQWlCSCxPQUFPLGdCQUFQLENBQXZCO0FBQ0EsSUFBTUksc0JBQXNCSixPQUFPLHFCQUFQLENBQTVCOztJQUVhSyxLLFdBQUFBLEs7QUFDWCxtQkFBdUI7QUFBQTs7QUFBQSxRQUFYQyxJQUFX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b0JBQUtBLFNBQUwsR0FBZ0IwRCxrQkFBaEIsOEJBQVA7QUFDRCxPQUZELE1BRU87QUFDTCxlQUFPUixRQUFRRSxNQUFSLENBQWUsSUFBSTVCLEtBQUosQ0FBVSw2QkFBVixDQUFmLENBQVA7QUFDRDtBQUNGOzs7NkJBRWU7QUFDZCxVQUFJLEtBQUt4QixTQUFMLENBQUosRUFBcUI7QUFBQTs7QUFDbkIsZUFBTyxvQkFBS0EsU0FBTCxHQUFnQjJELE1BQWhCLDhCQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBT1QsUUFBUUUsTUFBUixDQUFlLElBQUk1QixLQUFKLENBQVUsNkJBQVYsQ0FBZixDQUFQO0FBQ0Q7QUFDRiIsImZpbGUiOiJwbHVtcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vZGVsIH0gZnJvbSAnLi9tb2RlbCc7XG5pbXBvcnQgeyBTdWJqZWN0IH0gZnJvbSAncnhqcy9SeCc7XG5pbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuXG5jb25zdCAkdHlwZXMgPSBTeW1ib2woJyR0eXBlcycpO1xuY29uc3QgJHN0b3JhZ2UgPSBTeW1ib2woJyRzdG9yYWdlJyk7XG5jb25zdCAkdGVybWluYWwgPSBTeW1ib2woJyR0ZXJtaW5hbCcpO1xuY29uc3QgJHN1YnNjcmlwdGlvbnMgPSBTeW1ib2woJyRzdWJzY3JpcHRpb25zJyk7XG5jb25zdCAkc3RvcmVTdWJzY3JpcHRpb25zID0gU3ltYm9sKCckc3RvcmVTdWJzY3JpcHRpb25zJyk7XG5cbmV4cG9ydCBjbGFzcyBQbHVtcCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB7XG4gICAgICBzdG9yYWdlOiBbXSxcbiAgICAgIHR5cGVzOiBbXSxcbiAgICB9LCBvcHRzKTtcbiAgICB0aGlzWyRzdWJzY3JpcHRpb25zXSA9IHt9O1xuICAgIHRoaXNbJHN0b3JlU3Vic2NyaXB0aW9uc10gPSBbXTtcbiAgICB0aGlzWyRzdG9yYWdlXSA9IFtdO1xuICAgIHRoaXNbJHR5cGVzXSA9IHt9O1xuICAgIG9wdGlvbnMuc3RvcmFnZS5mb3JFYWNoKChzKSA9PiB0aGlzLmFkZFN0b3JlKHMpKTtcbiAgICBvcHRpb25zLnR5cGVzLmZvckVhY2goKHQpID0+IHRoaXMuYWRkVHlwZSh0KSk7XG4gIH1cblxuICBhZGRUeXBlc0Zyb21TY2hlbWEoc2NoZW1hLCBFeHRlbmRpbmdNb2RlbCA9IE1vZGVsKSB7XG4gICAgT2JqZWN0LmtleXMoc2NoZW1hKS5mb3JFYWNoKChrKSA9PiB7XG4gICAgICBjbGFzcyBEeW5hbWljTW9kZWwgZXh0ZW5kcyBFeHRlbmRpbmdNb2RlbCB7fVxuICAgICAgRHluYW1pY01vZGVsLmZyb21KU09OKHNjaGVtYVtrXSk7XG4gICAgICB0aGlzLmFkZFR5cGUoRHluYW1pY01vZGVsKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFkZFR5cGUoVCkge1xuICAgIGlmICh0aGlzWyR0eXBlc11bVC4kbmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skdHlwZXNdW1QuJG5hbWVdID0gVDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBEdXBsaWNhdGUgVHlwZSByZWdpc3RlcmVkOiAke1QuJG5hbWV9YCk7XG4gICAgfVxuICB9XG5cbiAgdHlwZShUKSB7XG4gICAgcmV0dXJuIHRoaXNbJHR5cGVzXVtUXTtcbiAgfVxuXG4gIHR5cGVzKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzWyR0eXBlc10pO1xuICB9XG5cbiAgYWRkU3RvcmUoc3RvcmUpIHtcbiAgICBpZiAoc3RvcmUudGVybWluYWwpIHtcbiAgICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzWyR0ZXJtaW5hbF0gPSBzdG9yZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGhhdmUgbW9yZSB0aGFuIG9uZSB0ZXJtaW5hbCBzdG9yZScpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzWyRzdG9yYWdlXS5wdXNoKHN0b3JlKTtcbiAgICB9XG4gICAgaWYgKHN0b3JlLnRlcm1pbmFsKSB7XG4gICAgICB0aGlzWyRzdG9yZVN1YnNjcmlwdGlvbnNdLnB1c2goc3RvcmUub25VcGRhdGUoKHsgdHlwZSwgaWQsIHZhbHVlLCBmaWVsZCB9KSA9PiB7XG4gICAgICAgIHRoaXNbJHN0b3JhZ2VdLmZvckVhY2goKHN0b3JhZ2UpID0+IHtcbiAgICAgICAgICBpZiAoZmllbGQpIHtcbiAgICAgICAgICAgIHN0b3JhZ2Uud3JpdGVIYXNNYW55KHR5cGUsIGlkLCBmaWVsZCwgdmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdG9yYWdlLndyaXRlKHR5cGUsIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gc3RvcmFnZS5vbkNhY2hlYWJsZVJlYWQoVHlwZSwgT2JqZWN0LmFzc2lnbih7fSwgdS52YWx1ZSwgeyBbVHlwZS4kaWRdOiB1LmlkIH0pKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlLiRuYW1lXSAmJiB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlLiRuYW1lXVtpZF0pIHtcbiAgICAgICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlLiRuYW1lXVtpZF0ubmV4dCh7IGZpZWxkLCB2YWx1ZSB9KTtcbiAgICAgICAgfVxuICAgICAgfSkpO1xuICAgIH1cbiAgfVxuXG4gIGZpbmQodCwgaWQpIHtcbiAgICBsZXQgVHlwZSA9IHQ7XG4gICAgaWYgKHR5cGVvZiB0ID09PSAnc3RyaW5nJykge1xuICAgICAgVHlwZSA9IHRoaXNbJHR5cGVzXVt0XTtcbiAgICB9XG4gICAgY29uc3QgcmV0VmFsID0gbmV3IFR5cGUoeyBbVHlwZS4kaWRdOiBpZCB9LCB0aGlzKTtcbiAgICByZXR1cm4gcmV0VmFsO1xuICB9XG5cbiAgZm9yZ2UodCwgdmFsKSB7XG4gICAgbGV0IFR5cGUgPSB0O1xuICAgIGlmICh0eXBlb2YgdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIFR5cGUgPSB0aGlzWyR0eXBlc11bdF07XG4gICAgfVxuICAgIHJldHVybiBuZXcgVHlwZSh2YWwsIHRoaXMpO1xuICB9XG5cbiAgLy8gTE9BRCAodHlwZS9pZCksIFNJREVMT0FEICh0eXBlL2lkL3NpZGUpPyBPciBqdXN0IExPQURBTEw/XG4gIC8vIExPQUQgbmVlZHMgdG8gc2NydWIgdGhyb3VnaCBob3QgY2FjaGVzIGZpcnN0XG5cbiAgc3Vic2NyaWJlKHR5cGVOYW1lLCBpZCwgaGFuZGxlcikge1xuICAgIGlmICh0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdID0ge307XG4gICAgfVxuICAgIGlmICh0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV1baWRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXVtpZF0gPSBuZXcgU3ViamVjdCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdW2lkXS5zdWJzY3JpYmUoaGFuZGxlcik7XG4gIH1cblxuICB0ZWFyZG93bigpIHtcbiAgICB0aGlzWyRzdG9yZVN1YnNjcmlwdGlvbnNdLmZvckVhY2goKHMpID0+IHMudW5zdWJzY3JpYmUoKSk7XG4gICAgdGhpc1skc3Vic2NyaXB0aW9uc10gPSB1bmRlZmluZWQ7XG4gICAgdGhpc1skc3RvcmVTdWJzY3JpcHRpb25zXSA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGdldCguLi5hcmdzKSB7XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JhZ2VdLnJlZHVjZSgodGhlbmFibGUsIHN0b3JhZ2UpID0+IHtcbiAgICAgIHJldHVybiB0aGVuYWJsZS50aGVuKCh2KSA9PiB7XG4gICAgICAgIGlmICh2ICE9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JhZ2UucmVhZCguLi5hcmdzKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSwgUHJvbWlzZS5yZXNvbHZlKG51bGwpKVxuICAgIC50aGVuKCh2KSA9PiB7XG4gICAgICBpZiAoKHYgPT09IG51bGwpICYmICh0aGlzWyR0ZXJtaW5hbF0pKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVhZCguLi5hcmdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB2O1xuICAgICAgfVxuICAgIH0pLnRoZW4oKHYpID0+IHtcbiAgICAgIHJldHVybiB2O1xuICAgIH0pO1xuICB9XG5cbiAgc2F2ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS53cml0ZSguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIGRlbGV0ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5kZWxldGUoLi4uYXJncykudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwodGhpc1skc3RvcmFnZV0ubWFwKChzdG9yZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBzdG9yZS5kZWxldGUoLi4uYXJncyk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgYWRkKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLmFkZCguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIHJlc3RSZXF1ZXN0KG9wdHMpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdICYmIHRoaXNbJHRlcm1pbmFsXS5yZXN0KSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlc3Qob3B0cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ05vIFJlc3QgdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLm1vZGlmeVJlbGF0aW9uc2hpcCguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZW1vdmUoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==
