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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBsdW1wLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHN1YnNjcmlwdGlvbnMiLCIkc3RvcmVTdWJzY3JpcHRpb25zIiwiUGx1bXAiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInN0b3JhZ2UiLCJ0eXBlcyIsImZvckVhY2giLCJzIiwiYWRkU3RvcmUiLCJ0IiwiYWRkVHlwZSIsInNjaGVtYSIsIkV4dGVuZGluZ01vZGVsIiwia2V5cyIsImsiLCJEeW5hbWljTW9kZWwiLCJmcm9tSlNPTiIsIlQiLCIkbmFtZSIsInVuZGVmaW5lZCIsIkVycm9yIiwic3RvcmUiLCJ0ZXJtaW5hbCIsInB1c2giLCJvblVwZGF0ZSIsInR5cGUiLCJpZCIsInZhbHVlIiwiZmllbGQiLCJ3cml0ZUhhc01hbnkiLCJ3cml0ZSIsIm5leHQiLCJUeXBlIiwicmV0VmFsIiwiJGlkIiwidmFsIiwibW9kZWwiLCJmb3JnZSIsImluY2x1ZGUiLCIkaW5jbHVkZSIsImV4dGVuZGVkIiwiZG9tYWluIiwiYXBpUGF0aCIsInByZWZpeCIsImZpZWxkcyIsImZpbHRlciIsImNvbnN0cnVjdG9yIiwiJGZpZWxkcyIsInJlbCIsImdldCIsInRoZW4iLCJyb290IiwibGVuZ3RoIiwiY2hpbGRJZHMiLCJtYXAiLCJyZWxhdGlvbnNoaXAiLCIkc2lkZXMiLCJvdGhlciIsImxpbmtzIiwicmVsYXRlZCIsImRhdGEiLCJpbmRleE9mIiwiY2hpbGQiLCIkJGRhdGFKU09OIiwiYWxsIiwiJCRwYWNrYWdlRm9ySW5jbHVzaW9uIiwicmVsYXRpb25zaGlwcyIsInJlZHVjZSIsImFjYyIsImN1cnIiLCJjb25jYXQiLCIkJHJlbGF0ZWRQYWNrYWdlIiwiYXR0cmlidXRlcyIsInNlbGYiLCJ0eXBlTmFtZSIsImJ1bGtHZXQiLCIkJHJlbGF0ZWRGaWVsZHMiLCJleHRlbmRlZEpTT04iLCJvdGhlclR5cGUiLCJleHRlbmRlZE9wdHMiLCIkJGluY2x1ZGVkUGFja2FnZSIsImluY2x1ZGVkIiwia2V5IiwiaGFuZGxlciIsInN1YnNjcmliZSIsInVuc3Vic2NyaWJlIiwia2V5T3B0cyIsIkFycmF5IiwiaXNBcnJheSIsInRoZW5hYmxlIiwidiIsImhvdCIsInJlYWQiLCJQcm9taXNlIiwicmVzb2x2ZSIsImNyZWF0ZSIsIm9ic2VydmVyIiwidmFsQXJyYXkiLCJwb3NzaVZhbCIsImNvbXBsZXRlIiwiYnVsa1JlYWQiLCJyZWplY3QiLCJhcmdzIiwiZGVsZXRlIiwiYWRkIiwicmVzdCIsIm1vZGlmeVJlbGF0aW9uc2hpcCIsInJlbW92ZSIsImhvdHMiLCJ3aXBlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0FBRUEsSUFBTUEsU0FBU0MsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNQyxXQUFXRCxPQUFPLFVBQVAsQ0FBakI7QUFDQSxJQUFNRSxZQUFZRixPQUFPLFdBQVAsQ0FBbEI7QUFDQSxJQUFNRyxpQkFBaUJILE9BQU8sZ0JBQVAsQ0FBdkI7QUFDQSxJQUFNSSxzQkFBc0JKLE9BQU8scUJBQVAsQ0FBNUI7O0lBRWFLLEssV0FBQUEsSztBQUNYLG1CQUF1QjtBQUFBOztBQUFBLFFBQVhDLElBQVcsdUVBQUosRUFBSTs7QUFBQTs7QUFDckIsUUFBTUMsVUFBVUMsT0FBT0MsTUFBUCxDQUFjLEVBQWQsRUFBa0I7QUFDaENDLGVBQVMsRUFEdUI7QUFFaENDLGFBQU87QUFGeUIsS0FBbEIsRUFHYkwsSUFIYSxDQUFoQjtBQUlBLFNBQUtILGNBQUwsSUFBdUIsRUFBdkI7QUFDQSxTQUFLQyxtQkFBTCxJQUE0QixFQUE1QjtBQUNBLFNBQUtILFFBQUwsSUFBaUIsRUFBakI7QUFDQSxTQUFLRixNQUFMLElBQWUsRUFBZjtBQUNBUSxZQUFRRyxPQUFSLENBQWdCRSxPQUFoQixDQUF3QixVQUFDQyxDQUFEO0FBQUEsYUFBTyxNQUFLQyxRQUFMLENBQWNELENBQWQsQ0FBUDtBQUFBLEtB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QUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBT2QsUUFBUVEsTUFBUixDQUFlLElBQUlqRixLQUFKLENBQVUsNkJBQVYsQ0FBZixDQUFQO0FBQ0Q7QUFDRjs7OytCQUVVSyxJLEVBQU1DLEUsRUFBSUUsSyxFQUFPO0FBQUE7O0FBQzFCLFVBQU1nRixPQUFPLEtBQUtqSCxRQUFMLEVBQWVrRCxNQUFmLENBQXNCLFVBQUN4QixLQUFEO0FBQUEsZUFBV0EsTUFBTXNFLEdBQU4sQ0FBVWxFLElBQVYsRUFBZ0JDLEVBQWhCLENBQVg7QUFBQSxPQUF0QixDQUFiO0FBQ0EsVUFBSSxLQUFLOUIsU0FBTCxFQUFnQitGLEdBQWhCLENBQW9CbEUsSUFBcEIsRUFBMEJDLEVBQTFCLENBQUosRUFBbUM7QUFDakNrRixhQUFLckYsSUFBTCxDQUFVLEtBQUszQixTQUFMLENBQVY7QUFDRDtBQUNELGFBQU8sbUJBQVNvRSxHQUFULENBQWE0QyxLQUFLdEQsR0FBTCxDQUFTLFVBQUNqQyxLQUFELEVBQVc7QUFDdEMsZUFBT0EsTUFBTXdGLElBQU4sQ0FBV3BGLElBQVgsRUFBaUJDLEVBQWpCLEVBQXFCRSxLQUFyQixDQUFQO0FBQ0QsT0FGbUIsQ0FBYixFQUVIc0IsSUFGRyxDQUVFLFlBQU07QUFDYixZQUFJLFFBQUtyRCxjQUFMLEVBQXFCNEIsS0FBS1AsS0FBMUIsS0FBb0MsUUFBS3JCLGNBQUwsRUFBcUI0QixLQUFLUCxLQUExQixFQUFpQ1EsRUFBakMsQ0FBeEMsRUFBOEU7QUFDNUUsaUJBQU8sUUFBSzlCLFNBQUwsRUFBZ0JnRyxJQUFoQixDQUFxQm5FLElBQXJCLEVBQTJCQyxFQUEzQixFQUErQkUsS0FBL0IsQ0FBUDtBQUNELFNBRkQsTUFFTztBQUNMLGlCQUFPLElBQVA7QUFDRDtBQUNGLE9BUk0sQ0FBUDtBQVNEIiwiZmlsZSI6InBsdW1wLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kZWwsICRzZWxmIH0gZnJvbSAnLi9tb2RlbCc7XG5pbXBvcnQgeyBTdWJqZWN0LCBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcy9SeCc7XG5pbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcblxuY29uc3QgJHR5cGVzID0gU3ltYm9sKCckdHlwZXMnKTtcbmNvbnN0ICRzdG9yYWdlID0gU3ltYm9sKCckc3RvcmFnZScpO1xuY29uc3QgJHRlcm1pbmFsID0gU3ltYm9sKCckdGVybWluYWwnKTtcbmNvbnN0ICRzdWJzY3JpcHRpb25zID0gU3ltYm9sKCckc3Vic2NyaXB0aW9ucycpO1xuY29uc3QgJHN0b3JlU3Vic2NyaXB0aW9ucyA9IFN5bWJvbCgnJHN0b3JlU3Vic2NyaXB0aW9ucycpO1xuXG5leHBvcnQgY2xhc3MgUGx1bXAge1xuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwge1xuICAgICAgc3RvcmFnZTogW10sXG4gICAgICB0eXBlczogW10sXG4gICAgfSwgb3B0cyk7XG4gICAgdGhpc1skc3Vic2NyaXB0aW9uc10gPSB7fTtcbiAgICB0aGlzWyRzdG9yZVN1YnNjcmlwdGlvbnNdID0gW107XG4gICAgdGhpc1skc3RvcmFnZV0gPSBbXTtcbiAgICB0aGlzWyR0eXBlc10gPSB7fTtcbiAgICBvcHRpb25zLnN0b3JhZ2UuZm9yRWFjaCgocykgPT4gdGhpcy5hZGRTdG9yZShzKSk7XG4gICAgb3B0aW9ucy50eXBlcy5mb3JFYWNoKCh0KSA9PiB0aGlzLmFkZFR5cGUodCkpO1xuICB9XG5cbiAgYWRkVHlwZXNGcm9tU2NoZW1hKHNjaGVtYSwgRXh0ZW5kaW5nTW9kZWwgPSBNb2RlbCkge1xuICAgIE9iamVjdC5rZXlzKHNjaGVtYSkuZm9yRWFjaCgoaykgPT4ge1xuICAgICAgY2xhc3MgRHluYW1pY01vZGVsIGV4dGVuZHMgRXh0ZW5kaW5nTW9kZWwge31cbiAgICAgIER5bmFtaWNNb2RlbC5mcm9tSlNPTihzY2hlbWFba10pO1xuICAgICAgdGhpcy5hZGRUeXBlKER5bmFtaWNNb2RlbCk7XG4gICAgfSk7XG4gIH1cblxuICBhZGRUeXBlKFQpIHtcbiAgICBpZiAodGhpc1skdHlwZXNdW1QuJG5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHR5cGVzXVtULiRuYW1lXSA9IFQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRHVwbGljYXRlIFR5cGUgcmVnaXN0ZXJlZDogJHtULiRuYW1lfWApO1xuICAgIH1cbiAgfVxuXG4gIHR5cGUoVCkge1xuICAgIHJldHVybiB0aGlzWyR0eXBlc11bVF07XG4gIH1cblxuICB0eXBlcygpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpc1skdHlwZXNdKTtcbiAgfVxuXG4gIGFkZFN0b3JlKHN0b3JlKSB7XG4gICAgaWYgKHN0b3JlLnRlcm1pbmFsKSB7XG4gICAgICBpZiAodGhpc1skdGVybWluYWxdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpc1skdGVybWluYWxdID0gc3RvcmU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBoYXZlIG1vcmUgdGhhbiBvbmUgdGVybWluYWwgc3RvcmUnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpc1skc3RvcmFnZV0ucHVzaChzdG9yZSk7XG4gICAgfVxuICAgIGlmIChzdG9yZS50ZXJtaW5hbCkge1xuICAgICAgdGhpc1skc3RvcmVTdWJzY3JpcHRpb25zXS5wdXNoKHN0b3JlLm9uVXBkYXRlKCh7IHR5cGUsIGlkLCB2YWx1ZSwgZmllbGQgfSkgPT4ge1xuICAgICAgICB0aGlzWyRzdG9yYWdlXS5mb3JFYWNoKChzdG9yYWdlKSA9PiB7XG4gICAgICAgICAgaWYgKGZpZWxkKSB7XG4gICAgICAgICAgICBzdG9yYWdlLndyaXRlSGFzTWFueSh0eXBlLCBpZCwgZmllbGQsIHZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RvcmFnZS53cml0ZSh0eXBlLCB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHN0b3JhZ2Uub25DYWNoZWFibGVSZWFkKFR5cGUsIE9iamVjdC5hc3NpZ24oe30sIHUudmFsdWUsIHsgW1R5cGUuJGlkXTogdS5pZCB9KSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV0gJiYgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV1baWRdKSB7XG4gICAgICAgICAgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZS4kbmFtZV1baWRdLm5leHQoeyBmaWVsZCwgdmFsdWUgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9XG4gIH1cblxuICBmaW5kKHQsIGlkKSB7XG4gICAgbGV0IFR5cGUgPSB0O1xuICAgIGlmICh0eXBlb2YgdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIFR5cGUgPSB0aGlzWyR0eXBlc11bdF07XG4gICAgfVxuICAgIGNvbnN0IHJldFZhbCA9IG5ldyBUeXBlKHsgW1R5cGUuJGlkXTogaWQgfSwgdGhpcyk7XG4gICAgcmV0dXJuIHJldFZhbDtcbiAgfVxuXG4gIGZvcmdlKHQsIHZhbCkge1xuICAgIGxldCBUeXBlID0gdDtcbiAgICBpZiAodHlwZW9mIHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBUeXBlID0gdGhpc1skdHlwZXNdW3RdO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFR5cGUodmFsLCB0aGlzKTtcbiAgfVxuXG4gICQkcmVsYXRlZFBhY2thZ2UodHlwZSwgaWQsIG9wdHMpIHtcbiAgICBjb25zdCBtb2RlbCA9IHRoaXMuZm9yZ2UodHlwZSwgeyBbdHlwZS4kaWRdOiBpZCB9KTtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAge1xuICAgICAgICBpbmNsdWRlOiB0eXBlLiRpbmNsdWRlLFxuICAgICAgICBleHRlbmRlZDoge30sXG4gICAgICAgIGRvbWFpbjogJ2h0dHBzOi8vZXhhbXBsZS5jb20nLFxuICAgICAgICBhcGlQYXRoOiAnL2FwaScsXG4gICAgICB9LFxuICAgICAgb3B0c1xuICAgICk7XG4gICAgY29uc3QgcHJlZml4ID0gYCR7b3B0aW9ucy5kb21haW59JHtvcHRpb25zLmFwaVBhdGh9YDtcbiAgICBjb25zdCBmaWVsZHMgPSBPYmplY3Qua2V5cyhvcHRpb25zLmluY2x1ZGUpLmZpbHRlcihyZWwgPT4ge1xuICAgICAgcmV0dXJuIG1vZGVsLmNvbnN0cnVjdG9yLiRmaWVsZHNbcmVsXTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzLmdldCh0eXBlLCBpZCwgZmllbGRzKVxuICAgIC50aGVuKHJvb3QgPT4ge1xuICAgICAgY29uc3QgcmV0VmFsID0ge307XG4gICAgICBmaWVsZHMuZm9yRWFjaChmaWVsZCA9PiB7XG4gICAgICAgIGlmIChvcHRzLmV4dGVuZGVkW2ZpZWxkXSAmJiByb290W2ZpZWxkXS5sZW5ndGgpIHtcbiAgICAgICAgICBjb25zdCBjaGlsZElkcyA9IHJvb3RbZmllbGRdLm1hcChyZWwgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHJlbFt0eXBlLiRmaWVsZHNbZmllbGRdLnJlbGF0aW9uc2hpcC4kc2lkZXNbZmllbGRdLm90aGVyLmZpZWxkXTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXRWYWxbZmllbGRdID0ge1xuICAgICAgICAgICAgbGlua3M6IHtcbiAgICAgICAgICAgICAgcmVsYXRlZDogYCR7cHJlZml4fS8ke3R5cGUuJG5hbWV9LyR7aWR9LyR7ZmllbGR9YCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkYXRhOiBvcHRzLmV4dGVuZGVkW2ZpZWxkXS5maWx0ZXIoY2hpbGQgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gY2hpbGRJZHMuaW5kZXhPZihjaGlsZC4kaWQpID49IDA7XG4gICAgICAgICAgICB9KS5tYXAoY2hpbGQgPT4gY2hpbGQuJCRkYXRhSlNPTiksXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiByZXRWYWw7XG4gICAgfSk7XG4gIH1cblxuICAkJGluY2x1ZGVkUGFja2FnZSh0eXBlLCBpZCwgb3B0cykge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIGluY2x1ZGU6IHR5cGUuJGluY2x1ZGUsXG4gICAgICAgIGV4dGVuZGVkOiB7fSxcbiAgICAgICAgZG9tYWluOiAnaHR0cHM6Ly9leGFtcGxlLmNvbScsXG4gICAgICAgIGFwaVBhdGg6ICcvYXBpJyxcbiAgICAgIH0sXG4gICAgICBvcHRzXG4gICAgKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFxuICAgICAgT2JqZWN0LmtleXMob3B0aW9ucy5leHRlbmRlZCkubWFwKHJlbGF0aW9uc2hpcCA9PiB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoXG4gICAgICAgICAgb3B0aW9ucy5leHRlbmRlZFtyZWxhdGlvbnNoaXBdLm1hcChjaGlsZCA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy4kJHBhY2thZ2VGb3JJbmNsdXNpb24oY2hpbGQuY29uc3RydWN0b3IsIGNoaWxkLiRpZCwgb3B0aW9ucyk7XG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgIH0pXG4gICAgKS50aGVuKHJlbGF0aW9uc2hpcHMgPT4ge1xuICAgICAgcmV0dXJuIHJlbGF0aW9uc2hpcHMucmVkdWNlKChhY2MsIGN1cnIpID0+IGFjYy5jb25jYXQoY3VycikpO1xuICAgIH0pO1xuICB9XG5cbiAgJCRwYWNrYWdlRm9ySW5jbHVzaW9uKHR5cGUsIGlkLCBvcHRzID0ge30pIHtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAge1xuICAgICAgICBkb21haW46ICdodHRwczovL2V4YW1wbGUuY29tJyxcbiAgICAgICAgYXBpUGF0aDogJy9hcGknLFxuICAgICAgICBpbmNsdWRlOiB0eXBlLiRpbmNsdWRlLFxuICAgICAgICBleHRlbmRlZDoge30sXG4gICAgICB9LFxuICAgICAgb3B0c1xuICAgICk7XG4gICAgY29uc3QgcHJlZml4ID0gYCR7b3B0aW9ucy5kb21haW59JHtvcHRzLmFwaVBhdGh9YDtcblxuICAgIC8vIEZpZWxkcyB0aGF0IGFyZSBib3RoIGluIHRoZSBpbmNsdWRlIGxpc3QgYW5kXG4gICAgLy8gZXhpc3Qgb24gdGhlIG1vZGVsIHdlJ3JlIGN1cnJlbnRseSBwYWNrYWdpbmdcbiAgICBjb25zdCBmaWVsZHMgPSBPYmplY3Qua2V5cyhvcHRpb25zLmluY2x1ZGUpLmZpbHRlcihyZWwgPT4ge1xuICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHR5cGUuJGluY2x1ZGUpLmluZGV4T2YocmVsKSA+PSAwO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXMuZ2V0KHR5cGUsIGlkLCBmaWVsZHMuY29uY2F0KCRzZWxmKSlcbiAgICAudGhlbihtb2RlbCA9PiB7XG4gICAgICByZXR1cm4gdGhpcy4kJHJlbGF0ZWRQYWNrYWdlKHR5cGUsIGlkLCBvcHRpb25zKVxuICAgICAgLnRoZW4ocmVsYXRpb25zaGlwcyA9PiB7XG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSB7fTtcbiAgICAgICAgT2JqZWN0LmtleXModHlwZS4kZmllbGRzKS5maWx0ZXIoZmllbGQgPT4ge1xuICAgICAgICAgIHJldHVybiBmaWVsZCAhPT0gdHlwZS4kaWQgJiYgdHlwZS4kZmllbGRzW2ZpZWxkXS50eXBlICE9PSAnaGFzTWFueSc7XG4gICAgICAgIH0pLmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgICAgIGlmIChtb2RlbFtmaWVsZF0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzW2ZpZWxkXSA9IG1vZGVsW2ZpZWxkXTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHJldFZhbCA9IHtcbiAgICAgICAgICB0eXBlOiB0eXBlLiRuYW1lLFxuICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiBhdHRyaWJ1dGVzLFxuICAgICAgICAgIGxpbmtzOiB7XG4gICAgICAgICAgICBzZWxmOiBgJHtwcmVmaXh9LyR7dHlwZS4kbmFtZX0vJHtpZH1gLFxuICAgICAgICAgIH0sXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKHJlbGF0aW9uc2hpcHMpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXRWYWwucmVsYXRpb25zaGlwcyA9IHJlbGF0aW9uc2hpcHM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0VmFsO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBqc29uQVBJaWZ5KHR5cGVOYW1lLCBpZCwgb3B0cykge1xuICAgIGNvbnN0IHR5cGUgPSB0aGlzLnR5cGUodHlwZU5hbWUpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIGRvbWFpbjogJ2h0dHBzOi8vZXhhbXBsZS5jb20nLFxuICAgICAgICBhcGlQYXRoOiAnL2FwaScsXG4gICAgICB9LFxuICAgICAgb3B0c1xuICAgICk7XG4gICAgY29uc3QgcHJlZml4ID0gYCR7b3B0aW9ucy5kb21haW59JHtvcHRpb25zLmFwaVBhdGh9YDtcblxuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgdGhpcy5nZXQodHlwZSwgaWQsIE9iamVjdC5rZXlzKHR5cGUuJGluY2x1ZGUpLmNvbmNhdCgkc2VsZikpLFxuICAgICAgdGhpcy5idWxrR2V0KHRoaXMuJCRyZWxhdGVkRmllbGRzKSxcbiAgICBdKS50aGVuKChbc2VsZiwgZXh0ZW5kZWRKU09OXSkgPT4ge1xuICAgICAgY29uc3QgZXh0ZW5kZWQgPSB7fTtcbiAgICAgIGZvciAoY29uc3QgcmVsIGluIGV4dGVuZGVkSlNPTikgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGd1YXJkLWZvci1pblxuICAgICAgICBjb25zdCBvdGhlclR5cGUgPSB0eXBlLiRmaWVsZHNbcmVsXS5yZWxhdGlvbnNoaXAuJHNpZGVzW3JlbF0ub3RoZXIudHlwZTtcbiAgICAgICAgZXh0ZW5kZWRbcmVsXSA9IGV4dGVuZGVkSlNPTltyZWxdLm1hcChkYXRhID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5mb3JnZShvdGhlclR5cGUsIGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGV4dGVuZGVkT3B0cyA9IG1lcmdlT3B0aW9ucyh7fSwgb3B0cywgeyBleHRlbmRlZDogZXh0ZW5kZWQgfSk7XG5cbiAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICBzZWxmLFxuICAgICAgICB0aGlzLiQkcmVsYXRlZFBhY2thZ2UodHlwZSwgaWQsIGV4dGVuZGVkT3B0cyksXG4gICAgICAgIHRoaXMuJCRpbmNsdWRlZFBhY2thZ2UodHlwZSwgaWQsIGV4dGVuZGVkT3B0cyksXG4gICAgICBdKTtcbiAgICB9KS50aGVuKChbc2VsZiwgcmVsYXRpb25zaGlwcywgaW5jbHVkZWRdKSA9PiB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGVzID0ge307XG4gICAgICBPYmplY3Qua2V5cyh0eXBlLiRmaWVsZHMpLmZpbHRlcihmaWVsZCA9PiB7XG4gICAgICAgIHJldHVybiBmaWVsZCAhPT0gdHlwZS4kaWQgJiYgdHlwZS4kZmllbGRzW2ZpZWxkXS50eXBlICE9PSAnaGFzTWFueSc7XG4gICAgICB9KS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIGF0dHJpYnV0ZXNba2V5XSA9IHNlbGZba2V5XTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXRWYWwgPSB7XG4gICAgICAgIGxpbmtzOiB7IHNlbGY6IGAke3ByZWZpeH0vJHt0eXBlTmFtZX0vJHtpZH1gIH0sXG4gICAgICAgIGRhdGE6IHsgdHlwZTogdHlwZU5hbWUsIGlkOiBpZCB9LFxuICAgICAgICBhdHRyaWJ1dGVzOiBhdHRyaWJ1dGVzLFxuICAgICAgICBpbmNsdWRlZDogaW5jbHVkZWQsXG4gICAgICB9O1xuXG4gICAgICBpZiAoT2JqZWN0LmtleXMocmVsYXRpb25zaGlwcykubGVuZ3RoID4gMCkge1xuICAgICAgICByZXRWYWwucmVsYXRpb25zaGlwcyA9IHJlbGF0aW9uc2hpcHM7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXRWYWw7XG4gICAgfSk7XG4gIH1cblxuICAvLyBMT0FEICh0eXBlL2lkKSwgU0lERUxPQUQgKHR5cGUvaWQvc2lkZSk/IE9yIGp1c3QgTE9BREFMTD9cbiAgLy8gTE9BRCBuZWVkcyB0byBzY3J1YiB0aHJvdWdoIGhvdCBjYWNoZXMgZmlyc3RcblxuICBzdWJzY3JpYmUodHlwZU5hbWUsIGlkLCBoYW5kbGVyKSB7XG4gICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV0gPSB7fTtcbiAgICB9XG4gICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXVtpZF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdW2lkXSA9IG5ldyBTdWJqZWN0KCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV1baWRdLnN1YnNjcmliZShoYW5kbGVyKTtcbiAgfVxuXG4gIHRlYXJkb3duKCkge1xuICAgIHRoaXNbJHN0b3JlU3Vic2NyaXB0aW9uc10uZm9yRWFjaCgocykgPT4gcy51bnN1YnNjcmliZSgpKTtcbiAgICB0aGlzWyRzdWJzY3JpcHRpb25zXSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzWyRzdG9yZVN1YnNjcmlwdGlvbnNdID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgZ2V0KHR5cGUsIGlkLCBrZXlPcHRzKSB7XG4gICAgbGV0IGtleXMgPSBrZXlPcHRzO1xuICAgIGlmICgha2V5cykge1xuICAgICAga2V5cyA9IFskc2VsZl07XG4gICAgfVxuICAgIGlmICghQXJyYXkuaXNBcnJheShrZXlzKSkge1xuICAgICAga2V5cyA9IFtrZXlzXTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JhZ2VdLnJlZHVjZSgodGhlbmFibGUsIHN0b3JhZ2UpID0+IHtcbiAgICAgIHJldHVybiB0aGVuYWJsZS50aGVuKCh2KSA9PiB7XG4gICAgICAgIGlmICh2ICE9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RvcmFnZS5ob3QodHlwZSwgaWQpKSB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JhZ2UucmVhZCh0eXBlLCBpZCwga2V5cyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sIFByb21pc2UucmVzb2x2ZShudWxsKSlcbiAgICAudGhlbigodikgPT4ge1xuICAgICAgaWYgKCgodiA9PT0gbnVsbCkgfHwgKHZbJHNlbGZdID09PSBudWxsKSkgJiYgKHRoaXNbJHRlcm1pbmFsXSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZWFkKHR5cGUsIGlkLCBrZXlzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB2O1xuICAgICAgfVxuICAgIH0pLnRoZW4oKHYpID0+IHtcbiAgICAgIHJldHVybiB2O1xuICAgIH0pO1xuICB9XG5cbiAgc3RyZWFtR2V0KHR5cGUsIGlkLCBrZXlPcHRzKSB7XG4gICAgbGV0IGtleXMgPSBrZXlPcHRzO1xuICAgIGlmICgha2V5cykge1xuICAgICAga2V5cyA9IFskc2VsZl07XG4gICAgfVxuICAgIGlmICghQXJyYXkuaXNBcnJheShrZXlzKSkge1xuICAgICAga2V5cyA9IFtrZXlzXTtcbiAgICB9XG4gICAgcmV0dXJuIE9ic2VydmFibGUuY3JlYXRlKChvYnNlcnZlcikgPT4ge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbCgodGhpc1skc3RvcmFnZV0ubWFwKChzdG9yZSkgPT4ge1xuICAgICAgICByZXR1cm4gc3RvcmUucmVhZCh0eXBlLCBpZCwga2V5cylcbiAgICAgICAgLnRoZW4oKHYpID0+IHtcbiAgICAgICAgICBvYnNlcnZlci5uZXh0KHYpO1xuICAgICAgICAgIGlmIChzdG9yZS5ob3QodHlwZSwgaWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pKSlcbiAgICAgIC50aGVuKCh2YWxBcnJheSkgPT4ge1xuICAgICAgICBjb25zdCBwb3NzaVZhbCA9IHZhbEFycmF5LmZpbHRlcigodikgPT4gdiAhPT0gbnVsbCk7XG4gICAgICAgIGlmICgocG9zc2lWYWwubGVuZ3RoID09PSAwKSAmJiAodGhpc1skdGVybWluYWxdKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVhZCh0eXBlLCBpZCwga2V5cylcbiAgICAgICAgICAudGhlbigodmFsKSA9PiB7XG4gICAgICAgICAgICBvYnNlcnZlci5uZXh0KHZhbCk7XG4gICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBwb3NzaVZhbFswXTtcbiAgICAgICAgfVxuICAgICAgfSkudGhlbigodikgPT4ge1xuICAgICAgICBvYnNlcnZlci5jb21wbGV0ZSgpO1xuICAgICAgICByZXR1cm4gdjtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgYnVsa0dldChyb290LCBvcHRzKSB7XG4gICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5idWxrUmVhZChyb290LCBvcHRzKTtcbiAgfVxuXG4gIHNhdmUoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ud3JpdGUoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBkZWxldGUoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0uZGVsZXRlKC4uLmFyZ3MpLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKHRoaXNbJHN0b3JhZ2VdLm1hcCgoc3RvcmUpID0+IHtcbiAgICAgICAgICByZXR1cm4gc3RvcmUuZGVsZXRlKC4uLmFyZ3MpO1xuICAgICAgICB9KSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIGFkZCguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5hZGQoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICByZXN0UmVxdWVzdChvcHRzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSAmJiB0aGlzWyR0ZXJtaW5hbF0ucmVzdCkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZXN0KG9wdHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdObyBSZXN0IHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIG1vZGlmeVJlbGF0aW9uc2hpcCguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5tb2RpZnlSZWxhdGlvbnNoaXAoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICByZW1vdmUoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVtb3ZlKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgaW52YWxpZGF0ZSh0eXBlLCBpZCwgZmllbGQpIHtcbiAgICBjb25zdCBob3RzID0gdGhpc1skc3RvcmFnZV0uZmlsdGVyKChzdG9yZSkgPT4gc3RvcmUuaG90KHR5cGUsIGlkKSk7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXS5ob3QodHlwZSwgaWQpKSB7XG4gICAgICBob3RzLnB1c2godGhpc1skdGVybWluYWxdKTtcbiAgICB9XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChob3RzLm1hcCgoc3RvcmUpID0+IHtcbiAgICAgIHJldHVybiBzdG9yZS53aXBlKHR5cGUsIGlkLCBmaWVsZCk7XG4gICAgfSkpLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGUuJG5hbWVdICYmIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGUuJG5hbWVdW2lkXSkge1xuICAgICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlYWQodHlwZSwgaWQsIGZpZWxkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG4iXX0=
