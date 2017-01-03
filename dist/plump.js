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
          if (_this4[$subscriptions][type] && _this4[$subscriptions][type][id]) {
            console.log('firing from store in plump');
            _this4[$subscriptions][type][id].next(value);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBsdW1wLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHN1YnNjcmlwdGlvbnMiLCIkc3RvcmVTdWJzY3JpcHRpb25zIiwiUGx1bXAiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInN0b3JhZ2UiLCJ0eXBlcyIsImZvckVhY2giLCJzIiwiYWRkU3RvcmUiLCJ0IiwiYWRkVHlwZSIsInNjaGVtYSIsIkV4dGVuZGluZ01vZGVsIiwia2V5cyIsImsiLCJEeW5hbWljTW9kZWwiLCJmcm9tSlNPTiIsIlQiLCIkbmFtZSIsInVuZGVmaW5lZCIsIkVycm9yIiwic3RvcmUiLCJ0ZXJtaW5hbCIsInB1c2giLCJvblVwZGF0ZSIsInR5cGUiLCJpZCIsInZhbHVlIiwiZmllbGQiLCJ3cml0ZUhhc01hbnkiLCJ3cml0ZSIsImNvbnNvbGUiLCJsb2ciLCJuZXh0IiwiVHlwZSIsInJldFZhbCIsIiRpZCIsInZhbCIsInR5cGVOYW1lIiwiaGFuZGxlciIsInN1YnNjcmliZSIsInVuc3Vic2NyaWJlIiwiYXJncyIsInJlZHVjZSIsInRoZW5hYmxlIiwidGhlbiIsInYiLCJyZWFkIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJkZWxldGUiLCJhZGQiLCJyZXN0IiwibW9kaWZ5UmVsYXRpb25zaGlwIiwicmVtb3ZlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFNQTs7QUFFQTs7Ozs7Ozs7OztBQVJBLElBQU1BLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUMsV0FBV0QsT0FBTyxVQUFQLENBQWpCO0FBQ0EsSUFBTUUsWUFBWUYsT0FBTyxXQUFQLENBQWxCO0FBQ0EsSUFBTUcsaUJBQWlCSCxPQUFPLGdCQUFQLENBQXZCO0FBQ0EsSUFBTUksc0JBQXNCSixPQUFPLHFCQUFQLENBQTVCOztJQU1hSyxLLFdBQUFBLEs7QUFDWCxtQkFBdUI7QUFBQTs7QUFBQSxRQUFYQyxJQUFXLHVFQUFK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LENBQWUsSUFBSTlCLEtBQUosQ0FBVSw2QkFBVixDQUFmLENBQVA7QUFDRDtBQUNGIiwiZmlsZSI6InBsdW1wLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgJHR5cGVzID0gU3ltYm9sKCckdHlwZXMnKTtcbmNvbnN0ICRzdG9yYWdlID0gU3ltYm9sKCckc3RvcmFnZScpO1xuY29uc3QgJHRlcm1pbmFsID0gU3ltYm9sKCckdGVybWluYWwnKTtcbmNvbnN0ICRzdWJzY3JpcHRpb25zID0gU3ltYm9sKCckc3Vic2NyaXB0aW9ucycpO1xuY29uc3QgJHN0b3JlU3Vic2NyaXB0aW9ucyA9IFN5bWJvbCgnJHN0b3JlU3Vic2NyaXB0aW9ucycpO1xuXG5pbXBvcnQgeyBNb2RlbCB9IGZyb20gJy4vbW9kZWwnO1xuXG5pbXBvcnQgeyBTdWJqZWN0IH0gZnJvbSAncnhqcy9SeCc7XG5cbmV4cG9ydCBjbGFzcyBQbHVtcCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB7XG4gICAgICBzdG9yYWdlOiBbXSxcbiAgICAgIHR5cGVzOiBbXSxcbiAgICB9LCBvcHRzKTtcbiAgICB0aGlzWyRzdWJzY3JpcHRpb25zXSA9IHt9O1xuICAgIHRoaXNbJHN0b3JlU3Vic2NyaXB0aW9uc10gPSBbXTtcbiAgICB0aGlzWyRzdG9yYWdlXSA9IFtdO1xuICAgIHRoaXNbJHR5cGVzXSA9IHt9O1xuICAgIG9wdGlvbnMuc3RvcmFnZS5mb3JFYWNoKChzKSA9PiB0aGlzLmFkZFN0b3JlKHMpKTtcbiAgICBvcHRpb25zLnR5cGVzLmZvckVhY2goKHQpID0+IHRoaXMuYWRkVHlwZSh0KSk7XG4gIH1cblxuICBhZGRUeXBlc0Zyb21TY2hlbWEoc2NoZW1hLCBFeHRlbmRpbmdNb2RlbCA9IE1vZGVsKSB7XG4gICAgT2JqZWN0LmtleXMoc2NoZW1hKS5mb3JFYWNoKChrKSA9PiB7XG4gICAgICBjbGFzcyBEeW5hbWljTW9kZWwgZXh0ZW5kcyBFeHRlbmRpbmdNb2RlbCB7fVxuICAgICAgRHluYW1pY01vZGVsLmZyb21KU09OKHNjaGVtYVtrXSk7XG4gICAgICB0aGlzLmFkZFR5cGUoRHluYW1pY01vZGVsKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFkZFR5cGUoVCkge1xuICAgIGlmICh0aGlzWyR0eXBlc11bVC4kbmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skdHlwZXNdW1QuJG5hbWVdID0gVDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBEdXBsaWNhdGUgVHlwZSByZWdpc3RlcmVkOiAke1QuJG5hbWV9YCk7XG4gICAgfVxuICB9XG5cbiAgdHlwZShUKSB7XG4gICAgcmV0dXJuIHRoaXNbJHR5cGVzXVtUXTtcbiAgfVxuXG4gIHR5cGVzKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzWyR0eXBlc10pO1xuICB9XG5cbiAgYWRkU3RvcmUoc3RvcmUpIHtcbiAgICBpZiAoc3RvcmUudGVybWluYWwpIHtcbiAgICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzWyR0ZXJtaW5hbF0gPSBzdG9yZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGhhdmUgbW9yZSB0aGFuIG9uZSB0ZXJtaW5hbCBzdG9yZScpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzWyRzdG9yYWdlXS5wdXNoKHN0b3JlKTtcbiAgICB9XG4gICAgaWYgKHN0b3JlLnRlcm1pbmFsKSB7XG4gICAgICB0aGlzWyRzdG9yZVN1YnNjcmlwdGlvbnNdLnB1c2goc3RvcmUub25VcGRhdGUoKHsgdHlwZSwgaWQsIHZhbHVlLCBmaWVsZCB9KSA9PiB7XG4gICAgICAgIHRoaXNbJHN0b3JhZ2VdLmZvckVhY2goKHN0b3JhZ2UpID0+IHtcbiAgICAgICAgICBpZiAoZmllbGQpIHtcbiAgICAgICAgICAgIHN0b3JhZ2Uud3JpdGVIYXNNYW55KHR5cGUsIGlkLCBmaWVsZCwgdmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdG9yYWdlLndyaXRlKHR5cGUsIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gc3RvcmFnZS5vbkNhY2hlYWJsZVJlYWQoVHlwZSwgT2JqZWN0LmFzc2lnbih7fSwgdS52YWx1ZSwgeyBbVHlwZS4kaWRdOiB1LmlkIH0pKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlXSAmJiB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlXVtpZF0pIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnZmlyaW5nIGZyb20gc3RvcmUgaW4gcGx1bXAnKTtcbiAgICAgICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlXVtpZF0ubmV4dCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9XG4gIH1cblxuICBmaW5kKHQsIGlkKSB7XG4gICAgbGV0IFR5cGUgPSB0O1xuICAgIGlmICh0eXBlb2YgdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIFR5cGUgPSB0aGlzWyR0eXBlc11bdF07XG4gICAgfVxuICAgIGNvbnN0IHJldFZhbCA9IG5ldyBUeXBlKHsgW1R5cGUuJGlkXTogaWQgfSwgdGhpcyk7XG4gICAgcmV0dXJuIHJldFZhbDtcbiAgfVxuXG4gIGZvcmdlKHQsIHZhbCkge1xuICAgIGxldCBUeXBlID0gdDtcbiAgICBpZiAodHlwZW9mIHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBUeXBlID0gdGhpc1skdHlwZXNdW3RdO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFR5cGUodmFsLCB0aGlzKTtcbiAgfVxuXG4gIC8vIExPQUQgKHR5cGUvaWQpLCBTSURFTE9BRCAodHlwZS9pZC9zaWRlKT8gT3IganVzdCBMT0FEQUxMP1xuICAvLyBMT0FEIG5lZWRzIHRvIHNjcnViIHRocm91Z2ggaG90IGNhY2hlcyBmaXJzdFxuXG4gIHN1YnNjcmliZSh0eXBlTmFtZSwgaWQsIGhhbmRsZXIpIHtcbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXSA9IHt9O1xuICAgIH1cbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdW2lkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV1baWRdID0gbmV3IFN1YmplY3QoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXVtpZF0uc3Vic2NyaWJlKGhhbmRsZXIpO1xuICB9XG5cbiAgdGVhcmRvd24oKSB7XG4gICAgdGhpc1skc3RvcmVTdWJzY3JpcHRpb25zXS5mb3JFYWNoKChzKSA9PiBzLnVuc3Vic2NyaWJlKCkpO1xuICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdID0gdW5kZWZpbmVkO1xuICAgIHRoaXNbJHN0b3JlU3Vic2NyaXB0aW9uc10gPSB1bmRlZmluZWQ7XG4gIH1cblxuICBnZXQoLi4uYXJncykge1xuICAgIHJldHVybiB0aGlzWyRzdG9yYWdlXS5yZWR1Y2UoKHRoZW5hYmxlLCBzdG9yYWdlKSA9PiB7XG4gICAgICByZXR1cm4gdGhlbmFibGUudGhlbigodikgPT4ge1xuICAgICAgICBpZiAodiAhPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBzdG9yYWdlLnJlYWQoLi4uYXJncyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sIFByb21pc2UucmVzb2x2ZShudWxsKSlcbiAgICAudGhlbigodikgPT4ge1xuICAgICAgaWYgKCh2ID09PSBudWxsKSAmJiAodGhpc1skdGVybWluYWxdKSkge1xuICAgICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlYWQoLi4uYXJncyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdjtcbiAgICAgIH1cbiAgICB9KS50aGVuKCh2KSA9PiB7XG4gICAgICByZXR1cm4gdjtcbiAgICB9KTtcbiAgfVxuXG4gIHNhdmUoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ud3JpdGUoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBkZWxldGUoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0uZGVsZXRlKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgYWRkKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLmFkZCguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIHJlc3RSZXF1ZXN0KG9wdHMpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdICYmIHRoaXNbJHRlcm1pbmFsXS5yZXN0KSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlc3Qob3B0cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ05vIFJlc3QgdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLm1vZGlmeVJlbGF0aW9uc2hpcCguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZW1vdmUoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==
