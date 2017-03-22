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
    value: function save(value) {
      var _this5 = this;

      if (this[$terminal]) {
        return _bluebird2.default.resolve().then(function () {
          if (Object.keys(value.attributes).length > 0) {
            return _this5[$terminal].write(value);
          } else {
            return null;
          }
        }).then(function (updated) {
          if (value.relationships && Object.keys(value.relationships).length > 0) {
            return _bluebird2.default.all(Object.keys(value.relationships).map(function (relName) {
              return _bluebird2.default.all(value.relationships[relName].map(function (delta) {
                if (delta.op === 'add') {
                  return _this5[$terminal].add(value.type, updated.id, relName, delta.id, delta.meta);
                } else if (delta.op === 'remove') {
                  return _this5[$terminal].remove(value.type, updated.id, relName, delta.id);
                } else if (delta.op === 'modify') {
                  return _this5[$terminal].modifyRelationship(value.type, updated.id, relName, delta.id, delta.meta);
                } else {
                  throw new Error('Unknown relationship delta ' + JSON.stringify(delta));
                }
              }));
            })).then(function () {
              return updated;
            });
          } else {
            return updated;
          }
        });
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
        var _$terminal;

        return (_$terminal = this[$terminal]).delete.apply(_$terminal, args).then(function () {
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
        var _$terminal2;

        return (_$terminal2 = this[$terminal]).add.apply(_$terminal2, arguments);
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
        var _$terminal3;

        return (_$terminal3 = this[$terminal]).modifyRelationship.apply(_$terminal3, arguments);
      } else {
        return Promise.reject(new Error('Plump has no terminal store'));
      }
    }
  }, {
    key: 'remove',
    value: function remove() {
      if (this[$terminal]) {
        var _$terminal4;

        return (_$terminal4 = this[$terminal]).remove.apply(_$terminal4, arguments);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBsdW1wLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHRlYXJkb3duIiwiJHN1YnNjcmlwdGlvbnMiLCIkc3RvcmVTdWJzY3JpcHRpb25zIiwiUGx1bXAiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInN0b3JhZ2UiLCJ0eXBlcyIsImRlc3Ryb3kkIiwiYXNPYnNlcnZhYmxlIiwic3RvcmVzIiwiZm9yRWFjaCIsInMiLCJhZGRTdG9yZSIsInQiLCJhZGRUeXBlIiwic2NoZW1hdGEiLCJFeHRlbmRpbmdNb2RlbCIsImsiLCJEeW5hbWljTW9kZWwiLCJmcm9tSlNPTiIsIlQiLCIkbmFtZSIsInVuZGVmaW5lZCIsIkVycm9yIiwia2V5cyIsInN0b3JlIiwidGVybWluYWwiLCJjYWNoZVN0b3JlIiwid2lyZSIsInB1c2giLCJ0eXBlIiwiaWQiLCJUeXBlIiwiJGlkIiwidmFsIiwibmV4dCIsIkFycmF5IiwiaXNBcnJheSIsInJlZHVjZSIsInRoZW5hYmxlIiwidGhlbiIsInYiLCJob3QiLCJyZWFkIiwiUHJvbWlzZSIsInJlc29sdmUiLCJhdHRyaWJ1dGVzIiwiYnVsa1JlYWQiLCJ2YWx1ZSIsImxlbmd0aCIsIndyaXRlIiwidXBkYXRlZCIsInJlbGF0aW9uc2hpcHMiLCJhbGwiLCJtYXAiLCJyZWxOYW1lIiwiZGVsdGEiLCJvcCIsImFkZCIsIm1ldGEiLCJyZW1vdmUiLCJtb2RpZnlSZWxhdGlvbnNoaXAiLCJKU09OIiwic3RyaW5naWZ5IiwicmVqZWN0IiwiYXJncyIsImRlbGV0ZSIsInJlc3QiLCJmaWVsZCIsImZpZWxkcyIsImZpcmVXcml0ZVVwZGF0ZSIsImludmFsaWRhdGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7Ozs7Ozs7Ozs7OztBQUVBLElBQU1BLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUMsV0FBV0QsT0FBTyxVQUFQLENB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SSxLQUFLTCxTQUFMLEtBQW1CLEtBQUtBLFNBQUwsRUFBZ0J1RSxJQUF2QyxFQUE2QztBQUMzQyxlQUFPLEtBQUt2RSxTQUFMLEVBQWdCdUUsSUFBaEIsQ0FBcUJsRSxJQUFyQixDQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBTzJDLFFBQVFvQixNQUFSLENBQWUsSUFBSXpDLEtBQUosQ0FBVSx3QkFBVixDQUFmLENBQVA7QUFDRDtBQUNGOzs7eUNBRTJCO0FBQzFCLFVBQUksS0FBSzNCLFNBQUwsQ0FBSixFQUFxQjtBQUFBOztBQUNuQixlQUFPLG9CQUFLQSxTQUFMLEdBQWdCaUUsa0JBQWhCLDhCQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBT2pCLFFBQVFvQixNQUFSLENBQWUsSUFBSXpDLEtBQUosQ0FBVSw2QkFBVixDQUFmLENBQVA7QUFDRDtBQUNGOzs7NkJBRWU7QUFDZCxVQUFJLEtBQUszQixTQUFMLENBQUosRUFBcUI7QUFBQTs7QUFDbkIsZUFBTyxvQkFBS0EsU0FBTCxHQUFnQmdFLE1BQWhCLDhCQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBT2hCLFFBQVFvQixNQUFSLENBQWUsSUFBSXpDLEtBQUosQ0FBVSw2QkFBVixDQUFmLENBQVA7QUFDRDtBQUNGOzs7K0JBRVVPLEksRUFBTUMsRSxFQUFJcUMsSyxFQUFPO0FBQzFCLFVBQU1DLFNBQVNqQyxNQUFNQyxPQUFOLENBQWMrQixLQUFkLElBQXVCQSxLQUF2QixHQUErQixDQUFDQSxLQUFELENBQTlDO0FBQ0EsV0FBS3hFLFNBQUwsRUFBZ0IwRSxlQUFoQixDQUFnQyxFQUFFeEMsVUFBRixFQUFRQyxNQUFSLEVBQVl3QyxZQUFZRixNQUF4QixFQUFoQztBQUNEIiwiZmlsZSI6InBsdW1wLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kZWwgfSBmcm9tICcuL21vZGVsJztcbmltcG9ydCB7IFN1YmplY3QgfSBmcm9tICdyeGpzL1J4JztcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5cbmNvbnN0ICR0eXBlcyA9IFN5bWJvbCgnJHR5cGVzJyk7XG5jb25zdCAkc3RvcmFnZSA9IFN5bWJvbCgnJHN0b3JhZ2UnKTtcbmNvbnN0ICR0ZXJtaW5hbCA9IFN5bWJvbCgnJHRlcm1pbmFsJyk7XG5jb25zdCAkdGVhcmRvd24gPSBTeW1ib2woJyR0ZWFyZG93bicpO1xuY29uc3QgJHN1YnNjcmlwdGlvbnMgPSBTeW1ib2woJyRzdWJzY3JpcHRpb25zJyk7XG5jb25zdCAkc3RvcmVTdWJzY3JpcHRpb25zID0gU3ltYm9sKCckc3RvcmVTdWJzY3JpcHRpb25zJyk7XG5cbmV4cG9ydCBjbGFzcyBQbHVtcCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB7XG4gICAgICBzdG9yYWdlOiBbXSxcbiAgICAgIHR5cGVzOiBbXSxcbiAgICB9LCBvcHRzKTtcbiAgICB0aGlzWyR0ZWFyZG93bl0gPSBuZXcgU3ViamVjdCgpO1xuICAgIHRoaXMuZGVzdHJveSQgPSB0aGlzWyR0ZWFyZG93bl0uYXNPYnNlcnZhYmxlKCk7XG4gICAgdGhpc1skc3Vic2NyaXB0aW9uc10gPSB7fTtcbiAgICB0aGlzWyRzdG9yZVN1YnNjcmlwdGlvbnNdID0gW107XG4gICAgdGhpc1skc3RvcmFnZV0gPSBbXTtcbiAgICB0aGlzLnN0b3JlcyA9IFtdO1xuICAgIHRoaXNbJHR5cGVzXSA9IHt9O1xuICAgIG9wdGlvbnMuc3RvcmFnZS5mb3JFYWNoKChzKSA9PiB0aGlzLmFkZFN0b3JlKHMpKTtcbiAgICBvcHRpb25zLnR5cGVzLmZvckVhY2goKHQpID0+IHRoaXMuYWRkVHlwZSh0KSk7XG4gIH1cblxuICBhZGRUeXBlc0Zyb21TY2hlbWEoc2NoZW1hdGEsIEV4dGVuZGluZ01vZGVsID0gTW9kZWwpIHtcbiAgICBmb3IgKGNvbnN0IGsgaW4gc2NoZW1hdGEpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBndWFyZC1mb3ItaW5cbiAgICAgIGNsYXNzIER5bmFtaWNNb2RlbCBleHRlbmRzIEV4dGVuZGluZ01vZGVsIHt9XG4gICAgICBEeW5hbWljTW9kZWwuZnJvbUpTT04oc2NoZW1hdGFba10pO1xuICAgICAgdGhpcy5hZGRUeXBlKER5bmFtaWNNb2RlbCk7XG4gICAgfVxuICB9XG5cbiAgYWRkVHlwZShUKSB7XG4gICAgaWYgKHRoaXNbJHR5cGVzXVtULiRuYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyR0eXBlc11bVC4kbmFtZV0gPSBUO1xuICAgICAgdGhpc1skc3RvcmFnZV0uZm9yRWFjaChzID0+IHMuYWRkVHlwZShUKSk7XG4gICAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICAgIHRoaXNbJHRlcm1pbmFsXS5hZGRUeXBlKFQpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYER1cGxpY2F0ZSBUeXBlIHJlZ2lzdGVyZWQ6ICR7VC4kbmFtZX1gKTtcbiAgICB9XG4gIH1cblxuICB0eXBlKFQpIHtcbiAgICByZXR1cm4gdGhpc1skdHlwZXNdW1RdO1xuICB9XG5cbiAgdHlwZXMoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXNbJHR5cGVzXSk7XG4gIH1cblxuICBhZGRTdG9yZShzdG9yZSkge1xuICAgIGlmIChzdG9yZS50ZXJtaW5hbCkge1xuICAgICAgaWYgKHRoaXNbJHRlcm1pbmFsXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGhhdmUgbW9yZSB0aGFuIG9uZSB0ZXJtaW5hbCBzdG9yZScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpc1skdGVybWluYWxdID0gc3RvcmU7XG4gICAgICAgIHRoaXNbJHN0b3JhZ2VdLmZvckVhY2goKGNhY2hlU3RvcmUpID0+IHtcbiAgICAgICAgICBjYWNoZVN0b3JlLndpcmUoc3RvcmUsIHRoaXMuZGVzdHJveSQpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpc1skc3RvcmFnZV0ucHVzaChzdG9yZSk7XG4gICAgICBpZiAodGhpc1skdGVybWluYWxdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgc3RvcmUud2lyZSh0aGlzWyR0ZXJtaW5hbF0sIHRoaXMuZGVzdHJveSQpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnN0b3Jlcy5wdXNoKHN0b3JlKTtcbiAgICB0aGlzLnR5cGVzKCkuZm9yRWFjaCh0ID0+IHN0b3JlLmFkZFR5cGUodGhpcy50eXBlKHQpKSk7XG4gIH1cblxuICBmaW5kKHQsIGlkKSB7XG4gICAgY29uc3QgVHlwZSA9IHR5cGVvZiB0ID09PSAnc3RyaW5nJyA/IHRoaXNbJHR5cGVzXVt0XSA6IHQ7XG4gICAgcmV0dXJuIG5ldyBUeXBlKHsgW1R5cGUuJGlkXTogaWQgfSwgdGhpcyk7XG4gIH1cblxuICBmb3JnZSh0LCB2YWwpIHtcbiAgICBjb25zdCBUeXBlID0gdHlwZW9mIHQgPT09ICdzdHJpbmcnID8gdGhpc1skdHlwZXNdW3RdIDogdDtcbiAgICByZXR1cm4gbmV3IFR5cGUodmFsLCB0aGlzKTtcbiAgfVxuXG4gIHRlYXJkb3duKCkge1xuICAgIHRoaXNbJHRlYXJkb3duXS5uZXh0KDApO1xuICB9XG5cbiAgZ2V0KHR5cGUsIGlkLCBvcHRzKSB7XG4gICAgY29uc3Qga2V5cyA9IG9wdHMgJiYgIUFycmF5LmlzQXJyYXkob3B0cykgPyBbb3B0c10gOiBvcHRzO1xuICAgIHJldHVybiB0aGlzWyRzdG9yYWdlXS5yZWR1Y2UoKHRoZW5hYmxlLCBzdG9yYWdlKSA9PiB7XG4gICAgICByZXR1cm4gdGhlbmFibGUudGhlbigodikgPT4ge1xuICAgICAgICBpZiAodiAhPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICB9IGVsc2UgaWYgKHN0b3JhZ2UuaG90KHR5cGUsIGlkKSkge1xuICAgICAgICAgIHJldHVybiBzdG9yYWdlLnJlYWQodHlwZSwgaWQsIGtleXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LCBQcm9taXNlLnJlc29sdmUobnVsbCkpXG4gICAgLnRoZW4oKHYpID0+IHtcbiAgICAgIGlmICgoKHYgPT09IG51bGwpIHx8ICh2LmF0dHJpYnV0ZXMgPT09IG51bGwpKSAmJiAodGhpc1skdGVybWluYWxdKSkge1xuICAgICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlYWQodHlwZSwgaWQsIGtleXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBidWxrR2V0KHR5cGUsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5idWxrUmVhZCh0eXBlLCBpZCk7XG4gIH1cblxuICBzYXZlKHZhbHVlKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBpZiAoT2JqZWN0LmtleXModmFsdWUuYXR0cmlidXRlcykubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ud3JpdGUodmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnRoZW4oKHVwZGF0ZWQpID0+IHtcbiAgICAgICAgaWYgKHZhbHVlLnJlbGF0aW9uc2hpcHMgJiYgT2JqZWN0LmtleXModmFsdWUucmVsYXRpb25zaGlwcykubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoT2JqZWN0LmtleXModmFsdWUucmVsYXRpb25zaGlwcykubWFwKChyZWxOYW1lKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKHZhbHVlLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0ubWFwKChkZWx0YSkgPT4ge1xuICAgICAgICAgICAgICBpZiAoZGVsdGEub3AgPT09ICdhZGQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5hZGQodmFsdWUudHlwZSwgdXBkYXRlZC5pZCwgcmVsTmFtZSwgZGVsdGEuaWQsIGRlbHRhLm1ldGEpO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRlbHRhLm9wID09PSAncmVtb3ZlJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVtb3ZlKHZhbHVlLnR5cGUsIHVwZGF0ZWQuaWQsIHJlbE5hbWUsIGRlbHRhLmlkKTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChkZWx0YS5vcCA9PT0gJ21vZGlmeScpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLm1vZGlmeVJlbGF0aW9uc2hpcCh2YWx1ZS50eXBlLCB1cGRhdGVkLmlkLCByZWxOYW1lLCBkZWx0YS5pZCwgZGVsdGEubWV0YSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHJlbGF0aW9uc2hpcCBkZWx0YSAke0pTT04uc3RyaW5naWZ5KGRlbHRhKX1gKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgIH0pKS50aGVuKCgpID0+IHVwZGF0ZWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB1cGRhdGVkO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIGRlbGV0ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5kZWxldGUoLi4uYXJncykudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwodGhpc1skc3RvcmFnZV0ubWFwKChzdG9yZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBzdG9yZS5kZWxldGUoLi4uYXJncyk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgYWRkKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLmFkZCguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIHJlc3RSZXF1ZXN0KG9wdHMpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdICYmIHRoaXNbJHRlcm1pbmFsXS5yZXN0KSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlc3Qob3B0cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ05vIFJlc3QgdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLm1vZGlmeVJlbGF0aW9uc2hpcCguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZW1vdmUoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBpbnZhbGlkYXRlKHR5cGUsIGlkLCBmaWVsZCkge1xuICAgIGNvbnN0IGZpZWxkcyA9IEFycmF5LmlzQXJyYXkoZmllbGQpID8gZmllbGQgOiBbZmllbGRdO1xuICAgIHRoaXNbJHRlcm1pbmFsXS5maXJlV3JpdGVVcGRhdGUoeyB0eXBlLCBpZCwgaW52YWxpZGF0ZTogZmllbGRzIH0pO1xuICB9XG59XG4iXX0=
