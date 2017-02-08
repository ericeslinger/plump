'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Plump = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _model = require('./model');

var _Rx = require('rxjs/Rx');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _mergeOptions = require('merge-options');

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

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
  }, {
    key: '$$relatedPackage',
    value: function $$relatedPackage(type, id, opts) {
      var model = this.forge(type, _defineProperty({}, type.$id, id));
      var options = Object.assign({}, {
        include: type.$include,
        extended: {},
        domain: 'https://example.com',
        apiPath: '/api'
      }, opts);
      var prefix = '' + options.domain + options.apiPath;
      var fields = Object.keys(options.include).filter(function (rel) {
        return model.constructor.$fields[rel];
      });

      return this.get(type, id, fields).then(function (root) {
        var retVal = {};
        fields.forEach(function (field) {
          if (opts.extended[field] && root[field].length) {
            (function () {
              var childIds = root[field].map(function (rel) {
                return rel[type.$fields[field].relationship.$sides[field].other.field];
              });
              retVal[field] = {
                links: {
                  related: prefix + '/' + type.$name + '/' + id + '/' + field
                },
                data: opts.extended[field].filter(function (child) {
                  return childIds.indexOf(child.$id) >= 0;
                }).map(function (child) {
                  return child.$$dataJSON;
                })
              };
            })();
          }
        });

        return retVal;
      });
    }
  }, {
    key: '$$includedPackage',
    value: function $$includedPackage(type, id, opts) {
      var _this5 = this;

      var options = Object.assign({}, {
        include: type.$include,
        extended: {},
        domain: 'https://example.com',
        apiPath: '/api'
      }, opts);
      return _bluebird2.default.all(Object.keys(options.extended).map(function (relationship) {
        return _bluebird2.default.all(options.extended[relationship].map(function (child) {
          return _this5.$$packageForInclusion(child.constructor, child.$id, options);
        }));
      })).then(function (relationships) {
        return relationships.reduce(function (acc, curr) {
          return acc.concat(curr);
        });
      });
    }
  }, {
    key: '$$packageForInclusion',
    value: function $$packageForInclusion(type, id) {
      var _this6 = this;

      var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var options = Object.assign({}, {
        domain: 'https://example.com',
        apiPath: '/api',
        include: type.$include,
        extended: {}
      }, opts);
      var prefix = '' + options.domain + opts.apiPath;

      // Fields that are both in the include list and
      // exist on the model we're currently packaging
      var fields = Object.keys(options.include).filter(function (rel) {
        return Object.keys(type.$include).indexOf(rel) >= 0;
      });

      return this.get(type, id, fields.concat(_model.$self)).then(function (model) {
        return _this6.$$relatedPackage(type, id, options).then(function (relationships) {
          var attributes = {};
          Object.keys(type.$fields).filter(function (field) {
            return field !== type.$id && type.$fields[field].type !== 'hasMany';
          }).forEach(function (field) {
            if (model[field] !== 'undefined') {
              attributes[field] = model[field];
            }
          });

          var retVal = {
            type: type.$name,
            id: id,
            attributes: attributes,
            links: {
              self: prefix + '/' + type.$name + '/' + id
            }
          };

          if (Object.keys(relationships).length > 0) {
            retVal.relationships = relationships;
          }

          return retVal;
        });
      });
    }
  }, {
    key: 'jsonAPIify',
    value: function jsonAPIify(typeName, id, opts) {
      var _this7 = this;

      var type = this.type(typeName);
      var options = Object.assign({}, {
        domain: 'https://example.com',
        apiPath: '/api'
      }, opts);
      var prefix = '' + options.domain + options.apiPath;

      return _bluebird2.default.all([this.get(type, id, Object.keys(type.$include).concat(_model.$self)), this.bulkGet(this.$$relatedFields)]).then(function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
            self = _ref4[0],
            extendedJSON = _ref4[1];

        console.log(extendedJSON);
        var extended = {};

        var _loop = function _loop(rel) {
          // eslint-disable-line guard-for-in
          var otherType = type.$fields[rel].relationship.$sides[rel].other.type;
          extended[rel] = extendedJSON[rel].map(function (data) {
            return _this7.forge(otherType, data);
          });
        };

        for (var rel in extendedJSON) {
          _loop(rel);
        }
        var extendedOpts = (0, _mergeOptions2.default)({}, opts, { extended: extended });

        return _bluebird2.default.all([self, _this7.$$relatedPackage(type, id, extendedOpts), _this7.$$includedPackage(type, id, extendedOpts)]);
      }).then(function (_ref5) {
        var _ref6 = _slicedToArray(_ref5, 3),
            self = _ref6[0],
            relationships = _ref6[1],
            included = _ref6[2];

        var attributes = {};
        Object.keys(type.$fields).filter(function (field) {
          return field !== type.$id && type.$fields[field].type !== 'hasMany';
        }).forEach(function (key) {
          attributes[key] = self[key];
        });

        var retVal = {
          links: { self: prefix + '/' + typeName + '/' + id },
          data: { type: typeName, id: id },
          attributes: attributes,
          included: included
        };

        if (Object.keys(relationships).length > 0) {
          retVal.relationships = relationships;
        }

        return retVal;
      });
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
      var _this8 = this;

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
        if ((v === null || v[_model.$self] === null) && _this8[$terminal]) {
          return _this8[$terminal].read(type, id, keys);
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
      var _this9 = this;

      var keys = keyOpts;
      if (!keys) {
        keys = [_model.$self];
      }
      if (!Array.isArray(keys)) {
        keys = [keys];
      }
      return _Rx.Observable.create(function (observer) {
        return _bluebird2.default.all(_this9[$storage].map(function (store) {
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
          if (possiVal.length === 0 && _this9[$terminal]) {
            return _this9[$terminal].read(type, id, keys).then(function (val) {
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
      var _this10 = this;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (this[$terminal]) {
        var _$terminal2;

        return (_$terminal2 = this[$terminal]).delete.apply(_$terminal2, args).then(function () {
          return _bluebird2.default.all(_this10[$storage].map(function (store) {
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
      var _this11 = this;

      var hots = this[$storage].filter(function (store) {
        return store.hot(type, id);
      });
      if (this[$terminal].hot(type, id)) {
        hots.push(this[$terminal]);
      }
      return _bluebird2.default.all(hots.map(function (store) {
        return store.wipe(type, id, field);
      })).then(function () {
        if (_this11[$subscriptions][type.$name] && _this11[$subscriptions][type.$name][id]) {
          return _this11[$terminal].read(type, id, field);
        } else {
          return null;
        }
      });
    }
  }]);

  return Plump;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBsdW1wLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHN1YnNjcmlwdGlvbnMiLCIkc3RvcmVTdWJzY3JpcHRpb25zIiwiUGx1bXAiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInN0b3JhZ2UiLCJ0eXBlcyIsImZvckVhY2giLCJzIiwiYWRkU3RvcmUiLCJ0IiwiYWRkVHlwZSIsInNjaGVtYSIsIkV4dGVuZGluZ01vZGVsIiwia2V5cyIsImsiLCJEeW5hbWljTW9kZWwiLCJmcm9tSlNPTiIsIlQiLCIkbmFtZSIsInVuZGVmaW5lZCIsIkVycm9yIiwic3RvcmUiLCJ0ZXJtaW5hbCIsInB1c2giLCJvblVwZGF0ZSIsInR5cGUiLCJpZCIsInZhbHVlIiwiZmllbGQiLCJ3cml0ZUhhc01hbnkiLCJ3cml0ZSIsIm5leHQiLCJUeXBlIiwicmV0VmFsIiwiJGlkIiwidmFsIiwibW9kZWwiLCJmb3JnZSIsImluY2x1ZGUiLCIkaW5jbHVkZSIsImV4dGVuZGVkIiwiZG9tYWluIiwiYXBpUGF0aCIsInByZWZpeCIsImZpZWxkcyIsImZpbHRlciIsImNvbnN0cnVjdG9yIiwiJGZpZWxkcyIsInJlbCIsImdldCIsInRoZW4iLCJyb290IiwibGVuZ3RoIiwiY2hpbGRJZHMiLCJtYXAiLCJyZWxhdGlvbnNoaXAiLCIkc2lkZXMiLCJvdGhlciIsImxpbmtzIiwicmVsYXRlZCIsImRhdGEiLCJpbmRleE9mIiwiY2hpbGQiLCIkJGRhdGFKU09OIiwiYWxsIiwiJCRwYWNrYWdlRm9ySW5jbHVzaW9uIiwicmVsYXRpb25zaGlwcyIsInJlZHVjZSIsImFjYyIsImN1cnIiLCJjb25jYXQiLCIkJHJlbGF0ZWRQYWNrYWdlIiwiYXR0cmlidXRlcyIsInNlbGYiLCJ0eXBlTmFtZSIsImJ1bGtHZXQiLCIkJHJlbGF0ZWRGaWVsZHMiLCJleHRlbmRlZEpTT04iLCJjb25zb2xlIiwibG9nIiwib3RoZXJUeXBlIiwiZXh0ZW5kZWRPcHRzIiwiJCRpbmNsdWRlZFBhY2thZ2UiLCJpbmNsdWRlZCIsImtleSIsImhhbmRsZXIiLCJzdWJzY3JpYmUiLCJ1bnN1YnNjcmliZSIsImtleU9wdHMiLCJBcnJheSIsImlzQXJyYXkiLCJ0aGVuYWJsZSIsInYiLCJob3QiLCJyZWFkIiwiUHJvbWlzZSIsInJlc29sdmUiLCJjcmVhdGUiLCJvYnNlcnZlciIsInZhbEFycmF5IiwicG9zc2lWYWwiLCJjb21wbGV0ZSIsImJ1bGtSZWFkIiwicmVqZWN0IiwiYXJncyIsImRlbGV0ZSIsImFkZCIsInJlc3QiLCJtb2RpZnlSZWxhdGlvbnNoaXAiLCJyZW1vdmUiLCJob3RzIiwid2lwZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7OztBQUVBLElBQU1BLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUMsV0FBV0QsT0FBTyxVQUFQLENBQWpCO0FBQ0EsSUFBTUUsWUFBWUYsT0FBTyxXQUFQLENBQWxCO0FBQ0EsSUFBTUcsaUJBQWlCSCxPQUFPLGdCQUFQLENBQXZCO0FBQ0EsSUFBTUksc0JBQXNCSixPQUFPLHFCQUFQLENBQTVCOztJQUVhSyxLLFdBQUFBLEs7QUFDWCxtQkFBdUI7QUFBQTs7QUFBQSxRQUFYQyxJQUFXLHVFQUFKLEVBQUk7O0FBQUE7O0FBQ3JCLFFBQU1DLFVBQVVDLE9BQU9DLE1BQVAsQ0FBYyxFQUFkLEVBQWtCO0FBQ2hDQyxlQUFTLEVBRHVCO0FBRWhDQyxhQUFPO0FBRnlCLEtBQWxCLEVBR2JMLElBSGEsQ0FBaEI7QUFJQSxTQUFLSCxjQUFMLElBQXVCLEVBQXZCO0FBQ0EsU0FBS0MsbUJBQUwsSUFBNEIsRUFBNUI7QUFDQSxTQUFLSCxRQUFMLElBQWlCLEVBQWpCO0FBQ0EsU0FBS0YsTUFBTCxJQUFlLEVBQWY7QUFDQVEsWUFBUUcsT0FBUixDQUFnQkUsT0FBaEIsQ0FBd0IsVUFBQ0MsQ0FBRDtBQUFBLGFBQU8sTUFBS0MsUUFBTCxDQUFjRCxD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b20gJy4vbW9kZWwnO1xuaW1wb3J0IHsgU3ViamVjdCwgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMvUngnO1xuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBtZXJnZU9wdGlvbnMgZnJvbSAnbWVyZ2Utb3B0aW9ucyc7XG5cbmNvbnN0ICR0eXBlcyA9IFN5bWJvbCgnJHR5cGVzJyk7XG5jb25zdCAkc3RvcmFnZSA9IFN5bWJvbCgnJHN0b3JhZ2UnKTtcbmNvbnN0ICR0ZXJtaW5hbCA9IFN5bWJvbCgnJHRlcm1pbmFsJyk7XG5jb25zdCAkc3Vic2NyaXB0aW9ucyA9IFN5bWJvbCgnJHN1YnNjcmlwdGlvbnMnKTtcbmNvbnN0ICRzdG9yZVN1YnNjcmlwdGlvbnMgPSBTeW1ib2woJyRzdG9yZVN1YnNjcmlwdGlvbnMnKTtcblxuZXhwb3J0IGNsYXNzIFBsdW1wIHtcbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIHtcbiAgICAgIHN0b3JhZ2U6IFtdLFxuICAgICAgdHlwZXM6IFtdLFxuICAgIH0sIG9wdHMpO1xuICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdID0ge307XG4gICAgdGhpc1skc3RvcmVTdWJzY3JpcHRpb25zXSA9IFtdO1xuICAgIHRoaXNbJHN0b3JhZ2VdID0gW107XG4gICAgdGhpc1skdHlwZXNdID0ge307XG4gICAgb3B0aW9ucy5zdG9yYWdlLmZvckVhY2goKHMpID0+IHRoaXMuYWRkU3RvcmUocykpO1xuICAgIG9wdGlvbnMudHlwZXMuZm9yRWFjaCgodCkgPT4gdGhpcy5hZGRUeXBlKHQpKTtcbiAgfVxuXG4gIGFkZFR5cGVzRnJvbVNjaGVtYShzY2hlbWEsIEV4dGVuZGluZ01vZGVsID0gTW9kZWwpIHtcbiAgICBPYmplY3Qua2V5cyhzY2hlbWEpLmZvckVhY2goKGspID0+IHtcbiAgICAgIGNsYXNzIER5bmFtaWNNb2RlbCBleHRlbmRzIEV4dGVuZGluZ01vZGVsIHt9XG4gICAgICBEeW5hbWljTW9kZWwuZnJvbUpTT04oc2NoZW1hW2tdKTtcbiAgICAgIHRoaXMuYWRkVHlwZShEeW5hbWljTW9kZWwpO1xuICAgIH0pO1xuICB9XG5cbiAgYWRkVHlwZShUKSB7XG4gICAgaWYgKHRoaXNbJHR5cGVzXVtULiRuYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyR0eXBlc11bVC4kbmFtZV0gPSBUO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYER1cGxpY2F0ZSBUeXBlIHJlZ2lzdGVyZWQ6ICR7VC4kbmFtZX1gKTtcbiAgICB9XG4gIH1cblxuICB0eXBlKFQpIHtcbiAgICByZXR1cm4gdGhpc1skdHlwZXNdW1RdO1xuICB9XG5cbiAgdHlwZXMoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXNbJHR5cGVzXSk7XG4gIH1cblxuICBhZGRTdG9yZShzdG9yZSkge1xuICAgIGlmIChzdG9yZS50ZXJtaW5hbCkge1xuICAgICAgaWYgKHRoaXNbJHRlcm1pbmFsXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXNbJHRlcm1pbmFsXSA9IHN0b3JlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgaGF2ZSBtb3JlIHRoYW4gb25lIHRlcm1pbmFsIHN0b3JlJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXNbJHN0b3JhZ2VdLnB1c2goc3RvcmUpO1xuICAgIH1cbiAgICBpZiAoc3RvcmUudGVybWluYWwpIHtcbiAgICAgIHRoaXNbJHN0b3JlU3Vic2NyaXB0aW9uc10ucHVzaChzdG9yZS5vblVwZGF0ZSgoeyB0eXBlLCBpZCwgdmFsdWUsIGZpZWxkIH0pID0+IHtcbiAgICAgICAgdGhpc1skc3RvcmFnZV0uZm9yRWFjaCgoc3RvcmFnZSkgPT4ge1xuICAgICAgICAgIGlmIChmaWVsZCkge1xuICAgICAgICAgICAgc3RvcmFnZS53cml0ZUhhc01hbnkodHlwZSwgaWQsIGZpZWxkLCB2YWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0b3JhZ2Uud3JpdGUodHlwZSwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBzdG9yYWdlLm9uQ2FjaGVhYmxlUmVhZChUeXBlLCBPYmplY3QuYXNzaWduKHt9LCB1LnZhbHVlLCB7IFtUeXBlLiRpZF06IHUuaWQgfSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGUuJG5hbWVdICYmIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGUuJG5hbWVdW2lkXSkge1xuICAgICAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGUuJG5hbWVdW2lkXS5uZXh0KHsgZmllbGQsIHZhbHVlIH0pO1xuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgfVxuICB9XG5cbiAgZmluZCh0LCBpZCkge1xuICAgIGxldCBUeXBlID0gdDtcbiAgICBpZiAodHlwZW9mIHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBUeXBlID0gdGhpc1skdHlwZXNdW3RdO1xuICAgIH1cbiAgICBjb25zdCByZXRWYWwgPSBuZXcgVHlwZSh7IFtUeXBlLiRpZF06IGlkIH0sIHRoaXMpO1xuICAgIHJldHVybiByZXRWYWw7XG4gIH1cblxuICBmb3JnZSh0LCB2YWwpIHtcbiAgICBsZXQgVHlwZSA9IHQ7XG4gICAgaWYgKHR5cGVvZiB0ID09PSAnc3RyaW5nJykge1xuICAgICAgVHlwZSA9IHRoaXNbJHR5cGVzXVt0XTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBUeXBlKHZhbCwgdGhpcyk7XG4gIH1cblxuICAkJHJlbGF0ZWRQYWNrYWdlKHR5cGUsIGlkLCBvcHRzKSB7XG4gICAgY29uc3QgbW9kZWwgPSB0aGlzLmZvcmdlKHR5cGUsIHsgW3R5cGUuJGlkXTogaWQgfSk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHtcbiAgICAgICAgaW5jbHVkZTogdHlwZS4kaW5jbHVkZSxcbiAgICAgICAgZXh0ZW5kZWQ6IHt9LFxuICAgICAgICBkb21haW46ICdodHRwczovL2V4YW1wbGUuY29tJyxcbiAgICAgICAgYXBpUGF0aDogJy9hcGknLFxuICAgICAgfSxcbiAgICAgIG9wdHNcbiAgICApO1xuICAgIGNvbnN0IHByZWZpeCA9IGAke29wdGlvbnMuZG9tYWlufSR7b3B0aW9ucy5hcGlQYXRofWA7XG4gICAgY29uc3QgZmllbGRzID0gT2JqZWN0LmtleXMob3B0aW9ucy5pbmNsdWRlKS5maWx0ZXIocmVsID0+IHtcbiAgICAgIHJldHVybiBtb2RlbC5jb25zdHJ1Y3Rvci4kZmllbGRzW3JlbF07XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcy5nZXQodHlwZSwgaWQsIGZpZWxkcylcbiAgICAudGhlbihyb290ID0+IHtcbiAgICAgIGNvbnN0IHJldFZhbCA9IHt9O1xuICAgICAgZmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgICBpZiAob3B0cy5leHRlbmRlZFtmaWVsZF0gJiYgcm9vdFtmaWVsZF0ubGVuZ3RoKSB7XG4gICAgICAgICAgY29uc3QgY2hpbGRJZHMgPSByb290W2ZpZWxkXS5tYXAocmVsID0+IHtcbiAgICAgICAgICAgIHJldHVybiByZWxbdHlwZS4kZmllbGRzW2ZpZWxkXS5yZWxhdGlvbnNoaXAuJHNpZGVzW2ZpZWxkXS5vdGhlci5maWVsZF07XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0VmFsW2ZpZWxkXSA9IHtcbiAgICAgICAgICAgIGxpbmtzOiB7XG4gICAgICAgICAgICAgIHJlbGF0ZWQ6IGAke3ByZWZpeH0vJHt0eXBlLiRuYW1lfS8ke2lkfS8ke2ZpZWxkfWAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGF0YTogb3B0cy5leHRlbmRlZFtmaWVsZF0uZmlsdGVyKGNoaWxkID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNoaWxkSWRzLmluZGV4T2YoY2hpbGQuJGlkKSA+PSAwO1xuICAgICAgICAgICAgfSkubWFwKGNoaWxkID0+IGNoaWxkLiQkZGF0YUpTT04pLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gcmV0VmFsO1xuICAgIH0pO1xuICB9XG5cbiAgJCRpbmNsdWRlZFBhY2thZ2UodHlwZSwgaWQsIG9wdHMpIHtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAge1xuICAgICAgICBpbmNsdWRlOiB0eXBlLiRpbmNsdWRlLFxuICAgICAgICBleHRlbmRlZDoge30sXG4gICAgICAgIGRvbWFpbjogJ2h0dHBzOi8vZXhhbXBsZS5jb20nLFxuICAgICAgICBhcGlQYXRoOiAnL2FwaScsXG4gICAgICB9LFxuICAgICAgb3B0c1xuICAgICk7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChcbiAgICAgIE9iamVjdC5rZXlzKG9wdGlvbnMuZXh0ZW5kZWQpLm1hcChyZWxhdGlvbnNoaXAgPT4ge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFxuICAgICAgICAgIG9wdGlvbnMuZXh0ZW5kZWRbcmVsYXRpb25zaGlwXS5tYXAoY2hpbGQgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuJCRwYWNrYWdlRm9ySW5jbHVzaW9uKGNoaWxkLmNvbnN0cnVjdG9yLCBjaGlsZC4kaWQsIG9wdGlvbnMpO1xuICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICB9KVxuICAgICkudGhlbihyZWxhdGlvbnNoaXBzID0+IHtcbiAgICAgIHJldHVybiByZWxhdGlvbnNoaXBzLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBhY2MuY29uY2F0KGN1cnIpKTtcbiAgICB9KTtcbiAgfVxuXG4gICQkcGFja2FnZUZvckluY2x1c2lvbih0eXBlLCBpZCwgb3B0cyA9IHt9KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHtcbiAgICAgICAgZG9tYWluOiAnaHR0cHM6Ly9leGFtcGxlLmNvbScsXG4gICAgICAgIGFwaVBhdGg6ICcvYXBpJyxcbiAgICAgICAgaW5jbHVkZTogdHlwZS4kaW5jbHVkZSxcbiAgICAgICAgZXh0ZW5kZWQ6IHt9LFxuICAgICAgfSxcbiAgICAgIG9wdHNcbiAgICApO1xuICAgIGNvbnN0IHByZWZpeCA9IGAke29wdGlvbnMuZG9tYWlufSR7b3B0cy5hcGlQYXRofWA7XG5cbiAgICAvLyBGaWVsZHMgdGhhdCBhcmUgYm90aCBpbiB0aGUgaW5jbHVkZSBsaXN0IGFuZFxuICAgIC8vIGV4aXN0IG9uIHRoZSBtb2RlbCB3ZSdyZSBjdXJyZW50bHkgcGFja2FnaW5nXG4gICAgY29uc3QgZmllbGRzID0gT2JqZWN0LmtleXMob3B0aW9ucy5pbmNsdWRlKS5maWx0ZXIocmVsID0+IHtcbiAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0eXBlLiRpbmNsdWRlKS5pbmRleE9mKHJlbCkgPj0gMDtcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzLmdldCh0eXBlLCBpZCwgZmllbGRzLmNvbmNhdCgkc2VsZikpXG4gICAgLnRoZW4obW9kZWwgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuJCRyZWxhdGVkUGFja2FnZSh0eXBlLCBpZCwgb3B0aW9ucylcbiAgICAgIC50aGVuKHJlbGF0aW9uc2hpcHMgPT4ge1xuICAgICAgICBjb25zdCBhdHRyaWJ1dGVzID0ge307XG4gICAgICAgIE9iamVjdC5rZXlzKHR5cGUuJGZpZWxkcykuZmlsdGVyKGZpZWxkID0+IHtcbiAgICAgICAgICByZXR1cm4gZmllbGQgIT09IHR5cGUuJGlkICYmIHR5cGUuJGZpZWxkc1tmaWVsZF0udHlwZSAhPT0gJ2hhc01hbnknO1xuICAgICAgICB9KS5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgICAgICBpZiAobW9kZWxbZmllbGRdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgYXR0cmlidXRlc1tmaWVsZF0gPSBtb2RlbFtmaWVsZF07XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCByZXRWYWwgPSB7XG4gICAgICAgICAgdHlwZTogdHlwZS4kbmFtZSxcbiAgICAgICAgICBpZDogaWQsXG4gICAgICAgICAgYXR0cmlidXRlczogYXR0cmlidXRlcyxcbiAgICAgICAgICBsaW5rczoge1xuICAgICAgICAgICAgc2VsZjogYCR7cHJlZml4fS8ke3R5cGUuJG5hbWV9LyR7aWR9YCxcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChPYmplY3Qua2V5cyhyZWxhdGlvbnNoaXBzKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0VmFsLnJlbGF0aW9uc2hpcHMgPSByZWxhdGlvbnNoaXBzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldFZhbDtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAganNvbkFQSWlmeSh0eXBlTmFtZSwgaWQsIG9wdHMpIHtcbiAgICBjb25zdCB0eXBlID0gdGhpcy50eXBlKHR5cGVOYW1lKTtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAge1xuICAgICAgICBkb21haW46ICdodHRwczovL2V4YW1wbGUuY29tJyxcbiAgICAgICAgYXBpUGF0aDogJy9hcGknLFxuICAgICAgfSxcbiAgICAgIG9wdHNcbiAgICApO1xuICAgIGNvbnN0IHByZWZpeCA9IGAke29wdGlvbnMuZG9tYWlufSR7b3B0aW9ucy5hcGlQYXRofWA7XG5cbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgIHRoaXMuZ2V0KHR5cGUsIGlkLCBPYmplY3Qua2V5cyh0eXBlLiRpbmNsdWRlKS5jb25jYXQoJHNlbGYpKSxcbiAgICAgIHRoaXMuYnVsa0dldCh0aGlzLiQkcmVsYXRlZEZpZWxkcyksXG4gICAgXSkudGhlbigoW3NlbGYsIGV4dGVuZGVkSlNPTl0pID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGV4dGVuZGVkSlNPTik7XG4gICAgICBjb25zdCBleHRlbmRlZCA9IHt9O1xuICAgICAgZm9yIChjb25zdCByZWwgaW4gZXh0ZW5kZWRKU09OKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZ3VhcmQtZm9yLWluXG4gICAgICAgIGNvbnN0IG90aGVyVHlwZSA9IHR5cGUuJGZpZWxkc1tyZWxdLnJlbGF0aW9uc2hpcC4kc2lkZXNbcmVsXS5vdGhlci50eXBlO1xuICAgICAgICBleHRlbmRlZFtyZWxdID0gZXh0ZW5kZWRKU09OW3JlbF0ubWFwKGRhdGEgPT4ge1xuICAgICAgICAgIHJldHVybiB0aGlzLmZvcmdlKG90aGVyVHlwZSwgZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgY29uc3QgZXh0ZW5kZWRPcHRzID0gbWVyZ2VPcHRpb25zKHt9LCBvcHRzLCB7IGV4dGVuZGVkOiBleHRlbmRlZCB9KTtcblxuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIHNlbGYsXG4gICAgICAgIHRoaXMuJCRyZWxhdGVkUGFja2FnZSh0eXBlLCBpZCwgZXh0ZW5kZWRPcHRzKSxcbiAgICAgICAgdGhpcy4kJGluY2x1ZGVkUGFja2FnZSh0eXBlLCBpZCwgZXh0ZW5kZWRPcHRzKSxcbiAgICAgIF0pO1xuICAgIH0pLnRoZW4oKFtzZWxmLCByZWxhdGlvbnNoaXBzLCBpbmNsdWRlZF0pID0+IHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSB7fTtcbiAgICAgIE9iamVjdC5rZXlzKHR5cGUuJGZpZWxkcykuZmlsdGVyKGZpZWxkID0+IHtcbiAgICAgICAgcmV0dXJuIGZpZWxkICE9PSB0eXBlLiRpZCAmJiB0eXBlLiRmaWVsZHNbZmllbGRdLnR5cGUgIT09ICdoYXNNYW55JztcbiAgICAgIH0pLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgYXR0cmlidXRlc1trZXldID0gc2VsZltrZXldO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHJldFZhbCA9IHtcbiAgICAgICAgbGlua3M6IHsgc2VsZjogYCR7cHJlZml4fS8ke3R5cGVOYW1lfS8ke2lkfWAgfSxcbiAgICAgICAgZGF0YTogeyB0eXBlOiB0eXBlTmFtZSwgaWQ6IGlkIH0sXG4gICAgICAgIGF0dHJpYnV0ZXM6IGF0dHJpYnV0ZXMsXG4gICAgICAgIGluY2x1ZGVkOiBpbmNsdWRlZCxcbiAgICAgIH07XG5cbiAgICAgIGlmIChPYmplY3Qua2V5cyhyZWxhdGlvbnNoaXBzKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldFZhbC5yZWxhdGlvbnNoaXBzID0gcmVsYXRpb25zaGlwcztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJldFZhbDtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIExPQUQgKHR5cGUvaWQpLCBTSURFTE9BRCAodHlwZS9pZC9zaWRlKT8gT3IganVzdCBMT0FEQUxMP1xuICAvLyBMT0FEIG5lZWRzIHRvIHNjcnViIHRocm91Z2ggaG90IGNhY2hlcyBmaXJzdFxuXG4gIHN1YnNjcmliZSh0eXBlTmFtZSwgaWQsIGhhbmRsZXIpIHtcbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXSA9IHt9O1xuICAgIH1cbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdW2lkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV1baWRdID0gbmV3IFN1YmplY3QoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXVtpZF0uc3Vic2NyaWJlKGhhbmRsZXIpO1xuICB9XG5cbiAgdGVhcmRvd24oKSB7XG4gICAgdGhpc1skc3RvcmVTdWJzY3JpcHRpb25zXS5mb3JFYWNoKChzKSA9PiBzLnVuc3Vic2NyaWJlKCkpO1xuICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdID0gdW5kZWZpbmVkO1xuICAgIHRoaXNbJHN0b3JlU3Vic2NyaXB0aW9uc10gPSB1bmRlZmluZWQ7XG4gIH1cblxuICBnZXQodHlwZSwgaWQsIGtleU9wdHMpIHtcbiAgICBsZXQga2V5cyA9IGtleU9wdHM7XG4gICAgaWYgKCFrZXlzKSB7XG4gICAgICBrZXlzID0gWyRzZWxmXTtcbiAgICB9XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGtleXMpKSB7XG4gICAgICBrZXlzID0gW2tleXNdO1xuICAgIH1cbiAgICByZXR1cm4gdGhpc1skc3RvcmFnZV0ucmVkdWNlKCh0aGVuYWJsZSwgc3RvcmFnZSkgPT4ge1xuICAgICAgcmV0dXJuIHRoZW5hYmxlLnRoZW4oKHYpID0+IHtcbiAgICAgICAgaWYgKHYgIT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfSBlbHNlIGlmIChzdG9yYWdlLmhvdCh0eXBlLCBpZCkpIHtcbiAgICAgICAgICByZXR1cm4gc3RvcmFnZS5yZWFkKHR5cGUsIGlkLCBrZXlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSwgUHJvbWlzZS5yZXNvbHZlKG51bGwpKVxuICAgIC50aGVuKCh2KSA9PiB7XG4gICAgICBpZiAoKCh2ID09PSBudWxsKSB8fCAodlskc2VsZl0gPT09IG51bGwpKSAmJiAodGhpc1skdGVybWluYWxdKSkge1xuICAgICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlYWQodHlwZSwgaWQsIGtleXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgICB9XG4gICAgfSkudGhlbigodikgPT4ge1xuICAgICAgcmV0dXJuIHY7XG4gICAgfSk7XG4gIH1cblxuICBzdHJlYW1HZXQodHlwZSwgaWQsIGtleU9wdHMpIHtcbiAgICBsZXQga2V5cyA9IGtleU9wdHM7XG4gICAgaWYgKCFrZXlzKSB7XG4gICAgICBrZXlzID0gWyRzZWxmXTtcbiAgICB9XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGtleXMpKSB7XG4gICAgICBrZXlzID0gW2tleXNdO1xuICAgIH1cbiAgICByZXR1cm4gT2JzZXJ2YWJsZS5jcmVhdGUoKG9ic2VydmVyKSA9PiB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKCh0aGlzWyRzdG9yYWdlXS5tYXAoKHN0b3JlKSA9PiB7XG4gICAgICAgIHJldHVybiBzdG9yZS5yZWFkKHR5cGUsIGlkLCBrZXlzKVxuICAgICAgICAudGhlbigodikgPT4ge1xuICAgICAgICAgIG9ic2VydmVyLm5leHQodik7XG4gICAgICAgICAgaWYgKHN0b3JlLmhvdCh0eXBlLCBpZCkpIHtcbiAgICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSkpKVxuICAgICAgLnRoZW4oKHZhbEFycmF5KSA9PiB7XG4gICAgICAgIGNvbnN0IHBvc3NpVmFsID0gdmFsQXJyYXkuZmlsdGVyKCh2KSA9PiB2ICE9PSBudWxsKTtcbiAgICAgICAgaWYgKChwb3NzaVZhbC5sZW5ndGggPT09IDApICYmICh0aGlzWyR0ZXJtaW5hbF0pKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZWFkKHR5cGUsIGlkLCBrZXlzKVxuICAgICAgICAgIC50aGVuKCh2YWwpID0+IHtcbiAgICAgICAgICAgIG9ic2VydmVyLm5leHQodmFsKTtcbiAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHBvc3NpVmFsWzBdO1xuICAgICAgICB9XG4gICAgICB9KS50aGVuKCh2KSA9PiB7XG4gICAgICAgIG9ic2VydmVyLmNvbXBsZXRlKCk7XG4gICAgICAgIHJldHVybiB2O1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBidWxrR2V0KHJvb3QsIG9wdHMpIHtcbiAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLmJ1bGtSZWFkKHJvb3QsIG9wdHMpO1xuICB9XG5cbiAgc2F2ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS53cml0ZSguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIGRlbGV0ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5kZWxldGUoLi4uYXJncykudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwodGhpc1skc3RvcmFnZV0ubWFwKChzdG9yZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBzdG9yZS5kZWxldGUoLi4uYXJncyk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgYWRkKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLmFkZCguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIHJlc3RSZXF1ZXN0KG9wdHMpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdICYmIHRoaXNbJHRlcm1pbmFsXS5yZXN0KSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlc3Qob3B0cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ05vIFJlc3QgdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLm1vZGlmeVJlbGF0aW9uc2hpcCguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZSguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZW1vdmUoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBpbnZhbGlkYXRlKHR5cGUsIGlkLCBmaWVsZCkge1xuICAgIGNvbnN0IGhvdHMgPSB0aGlzWyRzdG9yYWdlXS5maWx0ZXIoKHN0b3JlKSA9PiBzdG9yZS5ob3QodHlwZSwgaWQpKTtcbiAgICBpZiAodGhpc1skdGVybWluYWxdLmhvdCh0eXBlLCBpZCkpIHtcbiAgICAgIGhvdHMucHVzaCh0aGlzWyR0ZXJtaW5hbF0pO1xuICAgIH1cbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKGhvdHMubWFwKChzdG9yZSkgPT4ge1xuICAgICAgcmV0dXJuIHN0b3JlLndpcGUodHlwZSwgaWQsIGZpZWxkKTtcbiAgICB9KSkudGhlbigoKSA9PiB7XG4gICAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV0gJiYgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV1baWRdKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVhZCh0eXBlLCBpZCwgZmllbGQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==
