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
var $teardown = Symbol('$teardown');
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
    this[$teardown] = new _Rx.Subject();
    this.destroy$ = this[$teardown].asObservable();
    this[$subscriptions] = {};
    this[$storeSubscriptions] = [];
    this[$storage] = [];
    this.stores = [];
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
        this[$storage].forEach(function (s) {
          return s.addType(T);
        });
        if (this[$terminal]) {
          this[$terminal].addType(T);
        }
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
        if (this[$terminal] !== undefined) {
          throw new Error('cannot have more than one terminal store');
        } else {
          this[$terminal] = store;
          this[$storage].forEach(function (cacheStore) {
            cacheStore.wire(store, _this3.destroy$);
          });
        }
      } else {
        this[$storage].push(store);
        if (this[$terminal] !== undefined) {
          store.wire(this[$terminal], this.destroy$);
        }
      }
      this.stores.push(store);
      this.types().forEach(function (t) {
        return store.addType(_this3.type(t));
      });
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
  }, {
    key: 'teardown',
    value: function teardown() {
      this[$teardown].next(0);
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
      var _this5 = this;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (this[$terminal]) {
        var _$terminal2;

        return (_$terminal2 = this[$terminal]).delete.apply(_$terminal2, args).then(function () {
          return _bluebird2.default.all(_this5[$storage].map(function (store) {
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
      var fields = Array.isArray(field) ? field : [field];
      this[$terminal].fireWriteUpdate({ type: type, id: id, invalidate: fields });
    }
  }]);

  return Plump;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBsdW1wLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHRlYXJkb3duIiwiJHN1YnNjcmlwdGlvbnMiLCIkc3RvcmVTdWJzY3JpcHRpb25zIiwiUGx1bXAiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInN0b3JhZ2UiLCJ0eXBlcyIsImRlc3Ryb3kkIiwiYXNPYnNlcnZhYmxlIiwic3RvcmVzIiwiZm9yRWFjaCIsInMiLCJhZGRTdG9yZSIsInQiLCJhZGRUeXBlIiwic2NoZW1hdGEiLCJFeHRlbmRpbmdNb2RlbCIsImsiLCJEeW5hbWljTW9kZWwiLCJmcm9tSlNPTiIsIlQiLCIkbmFtZSIsInVuZGVmaW5lZCIsIkVycm9yIiwia2V5cyIsInN0b3JlIiwidGVybWluYWwiLCJjYWNoZVN0b3JlIiwid2lyZSIsInB1c2giLCJ0eXBlIiwiaWQiLCJUeXBlIiwiJGlkIiwidmFsIiwibmV4dCIsIkFycmF5IiwiaXNBcnJheSIsInJlZHVjZSIsInRoZW5hYmxlIiwidGhlbiIsInYiLCJob3QiLCJyZWFkIiwiUHJvbWlzZSIsInJlc29sdmUiLCJhdHRyaWJ1dGVzIiwiYnVsa1JlYWQiLCJ3cml0ZSIsInJlamVjdCIsImFyZ3MiLCJkZWxldGUiLCJhbGwiLCJtYXAiLCJhZGQiLCJyZXN0IiwibW9kaWZ5UmVsYXRpb25zaGlwIiwicmVtb3ZlIiwiZmllbGQiLCJmaWVsZHMiLCJmaXJlV3JpdGVVcGRhdGUiLCJpbnZhbGlkYXRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7QUFFQSxJQUFNQSxTQUFTQyxPQUFPLFFBQVAsQ0FBZjtBQUNBLElBQU1DLFdBQVdELE9BQU8sVUFBUCxDQUFqQjtBQUNBLElBQU1FLFlBQVlGLE9BQU8sV0FBUCxDQUFsQjtBQUNBLElBQU1HLFlBQVlILE9BQU8sV0FBUCxDQUFsQjtBQUNBLElBQU1JLGlCQUFpQkosT0FB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QUFDRCxPQUZELE1BRU87QUFDTCxlQUFPYixRQUFRSyxNQUFSLENBQWUsSUFBSTFCLEtBQUosQ0FBVSw2QkFBVixDQUFmLENBQVA7QUFDRDtBQUNGOzs7K0JBRVVPLEksRUFBTUMsRSxFQUFJMkIsSyxFQUFPO0FBQzFCLFVBQU1DLFNBQVN2QixNQUFNQyxPQUFOLENBQWNxQixLQUFkLElBQXVCQSxLQUF2QixHQUErQixDQUFDQSxLQUFELENBQTlDO0FBQ0EsV0FBSzlELFNBQUwsRUFBZ0JnRSxlQUFoQixDQUFnQyxFQUFFOUIsVUFBRixFQUFRQyxNQUFSLEVBQVk4QixZQUFZRixNQUF4QixFQUFoQztBQUNEIiwiZmlsZSI6InBsdW1wLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kZWwgfSBmcm9tICcuL21vZGVsJztcbmltcG9ydCB7IFN1YmplY3QgfSBmcm9tICdyeGpzL1J4JztcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5cbmNvbnN0ICR0eXBlcyA9IFN5bWJvbCgnJHR5cGVzJyk7XG5jb25zdCAkc3RvcmFnZSA9IFN5bWJvbCgnJHN0b3JhZ2UnKTtcbmNvbnN0ICR0ZXJtaW5hbCA9IFN5bWJvbCgnJHRlcm1pbmFsJyk7XG5jb25zdCAkdGVhcmRvd24gPSBTeW1ib2woJyR0ZWFyZG93bicpO1xuY29uc3QgJHN1YnNjcmlwdGlvbnMgPSBTeW1ib2woJyRzdWJzY3JpcHRpb25zJyk7XG5jb25zdCAkc3RvcmVTdWJzY3JpcHRpb25zID0gU3ltYm9sKCckc3RvcmVTdWJzY3JpcHRpb25zJyk7XG5cbmV4cG9ydCBjbGFzcyBQbHVtcCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB7XG4gICAgICBzdG9yYWdlOiBbXSxcbiAgICAgIHR5cGVzOiBbXSxcbiAgICB9LCBvcHRzKTtcbiAgICB0aGlzWyR0ZWFyZG93bl0gPSBuZXcgU3ViamVjdCgpO1xuICAgIHRoaXMuZGVzdHJveSQgPSB0aGlzWyR0ZWFyZG93bl0uYXNPYnNlcnZhYmxlKCk7XG4gICAgdGhpc1skc3Vic2NyaXB0aW9uc10gPSB7fTtcbiAgICB0aGlzWyRzdG9yZVN1YnNjcmlwdGlvbnNdID0gW107XG4gICAgdGhpc1skc3RvcmFnZV0gPSBbXTtcbiAgICB0aGlzLnN0b3JlcyA9IFtdO1xuICAgIHRoaXNbJHR5cGVzXSA9IHt9O1xuICAgIG9wdGlvbnMuc3RvcmFnZS5mb3JFYWNoKChzKSA9PiB0aGlzLmFkZFN0b3JlKHMpKTtcbiAgICBvcHRpb25zLnR5cGVzLmZvckVhY2goKHQpID0+IHRoaXMuYWRkVHlwZSh0KSk7XG4gIH1cblxuICBhZGRUeXBlc0Zyb21TY2hlbWEoc2NoZW1hdGEsIEV4dGVuZGluZ01vZGVsID0gTW9kZWwpIHtcbiAgICBmb3IgKGNvbnN0IGsgaW4gc2NoZW1hdGEpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBndWFyZC1mb3ItaW5cbiAgICAgIGNsYXNzIER5bmFtaWNNb2RlbCBleHRlbmRzIEV4dGVuZGluZ01vZGVsIHt9XG4gICAgICBEeW5hbWljTW9kZWwuZnJvbUpTT04oc2NoZW1hdGFba10pO1xuICAgICAgdGhpcy5hZGRUeXBlKER5bmFtaWNNb2RlbCk7XG4gICAgfVxuICB9XG5cbiAgYWRkVHlwZShUKSB7XG4gICAgaWYgKHRoaXNbJHR5cGVzXVtULiRuYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyR0eXBlc11bVC4kbmFtZV0gPSBUO1xuICAgICAgdGhpc1skc3RvcmFnZV0uZm9yRWFjaChzID0+IHMuYWRkVHlwZShUKSk7XG4gICAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICAgIHRoaXNbJHRlcm1pbmFsXS5hZGRUeXBlKFQpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYER1cGxpY2F0ZSBUeXBlIHJlZ2lzdGVyZWQ6ICR7VC4kbmFtZX1gKTtcbiAgICB9XG4gIH1cblxuICB0eXBlKFQpIHtcbiAgICByZXR1cm4gdGhpc1skdHlwZXNdW1RdO1xuICB9XG5cbiAgdHlwZXMoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXNbJHR5cGVzXSk7XG4gIH1cblxuICBhZGRTdG9yZShzdG9yZSkge1xuICAgIGlmIChzdG9yZS50ZXJtaW5hbCkge1xuICAgICAgaWYgKHRoaXNbJHRlcm1pbmFsXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGhhdmUgbW9yZSB0aGFuIG9uZSB0ZXJtaW5hbCBzdG9yZScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpc1skdGVybWluYWxdID0gc3RvcmU7XG4gICAgICAgIHRoaXNbJHN0b3JhZ2VdLmZvckVhY2goKGNhY2hlU3RvcmUpID0+IHtcbiAgICAgICAgICBjYWNoZVN0b3JlLndpcmUoc3RvcmUsIHRoaXMuZGVzdHJveSQpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpc1skc3RvcmFnZV0ucHVzaChzdG9yZSk7XG4gICAgICBpZiAodGhpc1skdGVybWluYWxdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgc3RvcmUud2lyZSh0aGlzWyR0ZXJtaW5hbF0sIHRoaXMuZGVzdHJveSQpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnN0b3Jlcy5wdXNoKHN0b3JlKTtcbiAgICB0aGlzLnR5cGVzKCkuZm9yRWFjaCh0ID0+IHN0b3JlLmFkZFR5cGUodGhpcy50eXBlKHQpKSk7XG4gIH1cblxuICBmaW5kKHQsIGlkKSB7XG4gICAgY29uc3QgVHlwZSA9IHR5cGVvZiB0ID09PSAnc3RyaW5nJyA/IHRoaXNbJHR5cGVzXVt0XSA6IHQ7XG4gICAgcmV0dXJuIG5ldyBUeXBlKHsgW1R5cGUuJGlkXTogaWQgfSwgdGhpcyk7XG4gIH1cblxuICBmb3JnZSh0LCB2YWwpIHtcbiAgICBjb25zdCBUeXBlID0gdHlwZW9mIHQgPT09ICdzdHJpbmcnID8gdGhpc1skdHlwZXNdW3RdIDogdDtcbiAgICByZXR1cm4gbmV3IFR5cGUodmFsLCB0aGlzKTtcbiAgfVxuXG4gIHRlYXJkb3duKCkge1xuICAgIHRoaXNbJHRlYXJkb3duXS5uZXh0KDApO1xuICB9XG5cbiAgZ2V0KHR5cGUsIGlkLCBvcHRzKSB7XG4gICAgY29uc3Qga2V5cyA9IG9wdHMgJiYgIUFycmF5LmlzQXJyYXkob3B0cykgPyBbb3B0c10gOiBvcHRzO1xuICAgIHJldHVybiB0aGlzWyRzdG9yYWdlXS5yZWR1Y2UoKHRoZW5hYmxlLCBzdG9yYWdlKSA9PiB7XG4gICAgICByZXR1cm4gdGhlbmFibGUudGhlbigodikgPT4ge1xuICAgICAgICBpZiAodiAhPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICB9IGVsc2UgaWYgKHN0b3JhZ2UuaG90KHR5cGUsIGlkKSkge1xuICAgICAgICAgIHJldHVybiBzdG9yYWdlLnJlYWQodHlwZSwgaWQsIGtleXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LCBQcm9taXNlLnJlc29sdmUobnVsbCkpXG4gICAgLnRoZW4oKHYpID0+IHtcbiAgICAgIGlmICgoKHYgPT09IG51bGwpIHx8ICh2LmF0dHJpYnV0ZXMgPT09IG51bGwpKSAmJiAodGhpc1skdGVybWluYWxdKSkge1xuICAgICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlYWQodHlwZSwgaWQsIGtleXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBidWxrR2V0KHR5cGUsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5idWxrUmVhZCh0eXBlLCBpZCk7XG4gIH1cblxuICBzYXZlKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLndyaXRlKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgZGVsZXRlKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLmRlbGV0ZSguLi5hcmdzKS50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbCh0aGlzWyRzdG9yYWdlXS5tYXAoKHN0b3JlKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JlLmRlbGV0ZSguLi5hcmdzKTtcbiAgICAgICAgfSkpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBhZGQoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0uYWRkKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgcmVzdFJlcXVlc3Qob3B0cykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0gJiYgdGhpc1skdGVybWluYWxdLnJlc3QpIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVzdChvcHRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignTm8gUmVzdCB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBtb2RpZnlSZWxhdGlvbnNoaXAoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ubW9kaWZ5UmVsYXRpb25zaGlwKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlbW92ZSguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIGludmFsaWRhdGUodHlwZSwgaWQsIGZpZWxkKSB7XG4gICAgY29uc3QgZmllbGRzID0gQXJyYXkuaXNBcnJheShmaWVsZCkgPyBmaWVsZCA6IFtmaWVsZF07XG4gICAgdGhpc1skdGVybWluYWxdLmZpcmVXcml0ZVVwZGF0ZSh7IHR5cGUsIGlkLCBpbnZhbGlkYXRlOiBmaWVsZHMgfSk7XG4gIH1cbn1cbiJdfQ==
