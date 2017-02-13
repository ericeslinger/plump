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