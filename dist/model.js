'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Model = exports.$all = exports.$self = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _relationship = require('./relationship');

var _mergeOptions = require('merge-options');

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _Rx = require('rxjs/Rx');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $store = Symbol('$store');
var $plump = Symbol('$plump');
var $loaded = Symbol('$loaded');
var $unsubscribe = Symbol('$unsubscribe');
var $subject = Symbol('$subject');
var $self = exports.$self = Symbol('$self');
var $all = exports.$all = Symbol('$all');

// TODO: figure out where error events originate (storage or model)
// and who keeps a roll-backable delta

var Model = exports.Model = function () {
  function Model(opts, plump) {
    var _this = this;

    _classCallCheck(this, Model);

    this[$store] = {};
    this.$relationships = {};
    this[$subject] = new _Rx.BehaviorSubject();
    this[$subject].next({});
    this[$loaded] = _defineProperty({}, $self, false);
    Object.keys(this.constructor.$fields).forEach(function (key) {
      if (_this.constructor.$fields[key].type === 'hasMany') {
        var Rel = _this.constructor.$fields[key].relationship;
        _this.$relationships[key] = new Rel(_this, key, plump);
        _this[$store][key] = [];
        _this[$loaded][key] = false;
      } else {
        _this[$store][key] = _this.constructor.$fields[key].default || null;
      }
    });
    this.$$copyValuesFrom(opts || {});
    if (plump) {
      this[$plump] = plump;
    }
  }

  _createClass(Model, [{
    key: '$$isLoaded',
    value: function $$isLoaded(key) {
      var _this2 = this;

      if (key === $all) {
        return Object.keys(this[$loaded]).map(function (k) {
          return _this2[$loaded][k];
        }).reduce(function (acc, curr) {
          return acc && curr;
        }, true);
      } else {
        return this[$loaded][key];
      }
    }
  }, {
    key: '$$copyValuesFrom',
    value: function $$copyValuesFrom() {
      var _this3 = this;

      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      Object.keys(this.constructor.$fields).forEach(function (fieldName) {
        if (opts[fieldName] !== undefined) {
          // copy from opts to the best of our ability
          if (_this3.constructor.$fields[fieldName].type === 'array' || _this3.constructor.$fields[fieldName].type === 'hasMany') {
            _this3[$store][fieldName] = (opts[fieldName] || []).concat();
            _this3[$loaded][fieldName] = true;
          } else if (_this3.constructor.$fields[fieldName].type === 'object') {
            _this3[$store][fieldName] = Object.assign({}, opts[fieldName]);
          } else {
            _this3[$store][fieldName] = opts[fieldName];
          }
        }
      });
      this.$$fireUpdate();
    }
  }, {
    key: '$$hookToPlump',
    value: function $$hookToPlump() {
      var _this4 = this;

      if (this[$unsubscribe] === undefined) {
        this[$unsubscribe] = this[$plump].subscribe(this.constructor.$name, this.$id, function (_ref) {
          var field = _ref.field,
              value = _ref.value;

          if (field !== undefined) {
            // this.$$copyValuesFrom(value);
            _this4.$$copyValuesFrom(_defineProperty({}, field, value));
          } else {
            _this4.$$copyValuesFrom(value);
          }
        });
      }
    }
  }, {
    key: '$subscribe',
    value: function $subscribe() {
      var _this5 = this;

      var fields = [$self];
      var cb = void 0;
      if (arguments.length === 2) {
        fields = arguments.length <= 0 ? undefined : arguments[0];
        if (!Array.isArray(fields)) {
          fields = [fields];
        }
        cb = arguments.length <= 1 ? undefined : arguments[1];
      } else {
        cb = arguments.length <= 0 ? undefined : arguments[0];
      }
      this.$$hookToPlump();
      if (this[$loaded][$self] === false) {
        this[$plump].streamGet(this.constructor, this.$id, fields).subscribe(function (v) {
          return _this5.$$copyValuesFrom(v);
        });
      }
      return this[$subject].subscribe(cb);
    }
  }, {
    key: '$$fireUpdate',
    value: function $$fireUpdate() {
      this[$subject].next(this[$store]);
    }
  }, {
    key: '$package',
    value: function $package(opts) {
      var _this6 = this;

      var options = Object.assign({}, {
        domain: 'https://example.com',
        apiPath: '/api'
      }, opts);
      var prefix = '' + options.domain + options.apiPath;

      return _bluebird2.default.all([this.$get(this.$$relatedFields.concat($self)), this[$plump].bulkGet(this.$$relatedFields)]).then(function (_ref2) {
        var _ref3 = _slicedToArray(_ref2, 2),
            self = _ref3[0],
            extendedJSON = _ref3[1];

        var extended = {};

        var _loop = function _loop(rel) {
          // eslint-disable-line guard-for-in
          var type = _this6.$relationships[rel].constructor.$sides[rel].other.type;
          extended[rel] = extendedJSON[rel].map(function (data) {
            return _this6[$plump].forge(type, data);
          });
        };

        for (var rel in extendedJSON) {
          _loop(rel);
        }

        return _bluebird2.default.all([self, _this6.$$relatedPackage(extended, options), _this6.$$includedPackage(extended, options)]);
      }).then(function (_ref4) {
        var _ref5 = _slicedToArray(_ref4, 3),
            self = _ref5[0],
            relationships = _ref5[1],
            included = _ref5[2];

        var attributes = {};
        _this6.$$attributeFields.forEach(function (key) {
          attributes[key] = self[key];
        });

        var retVal = {
          links: { self: '' + prefix + _this6.$$path },
          data: _this6.$$dataJSON,
          attributes: attributes,
          included: included
        };

        if (Object.keys(relationships).length > 0) {
          retVal.relationships = relationships;
        }

        return retVal;
      });
    }
  }, {
    key: '$$relatedPackage',
    value: function $$relatedPackage(extended, opts) {
      var _this7 = this;

      var options = Object.assign({}, {
        include: this.constructor.$include,
        domain: 'https://example.com',
        apiPath: '/api'
      }, opts);
      var prefix = '' + options.domain + opts.apiPath;
      var fields = Object.keys(options.include).filter(function (rel) {
        return _this7[$store][rel] !== undefined;
      });

      return this.$get(fields).then(function (self) {
        var retVal = {};
        fields.forEach(function (field) {
          if (extended[field] && self[field].length) {
            (function () {
              var childIds = self[field].map(function (rel) {
                return rel[_this7.$relationships[field].constructor.$sides[field].other.field];
              });
              retVal[field] = {
                links: {
                  related: '' + prefix + _this7.$$path + '/' + field
                },
                data: extended[field].filter(function (child) {
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
    value: function $$includedPackage(extended, opts) {
      var _this8 = this;

      return _bluebird2.default.all(Object.keys(extended).map(function (relationship) {
        return _bluebird2.default.all(extended[relationship].map(function (child) {
          var childOpts = Object.assign({}, opts, { include: _this8.constructor.$include });
          return child.$$packageForInclusion(extended, childOpts);
        }));
      })).then(function (relationships) {
        return relationships.reduce(function (acc, curr) {
          return acc.concat(curr);
        });
      });
    }
  }, {
    key: '$$packageForInclusion',
    value: function $$packageForInclusion(extended) {
      var _this9 = this;

      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var options = Object.assign({}, {
        domain: 'https://example.com',
        apiPath: '/api',
        include: this.constructor.$include
      }, opts);
      var prefix = '' + options.domain + options.apiPath;

      return this.$get(this.$$relatedFields.concat($self)).then(function (self) {
        var related = {};
        _this9.$$relatedFields.forEach(function (field) {
          var childIds = self[field].map(function (rel) {
            return rel[_this9.$relationships[field].constructor.$sides[field].other.field];
          });
          related[field] = extended[field].filter(function (model) {
            return childIds.indexOf(model.$id) >= 0;
          });
        });
        return _this9.$$relatedPackage(related, opts).then(function (relationships) {
          var attributes = {};
          _this9.$$attributeFields.forEach(function (field) {
            attributes[field] = self[field];
          });

          var retVal = {
            type: _this9.$name,
            id: _this9.$id,
            attributes: attributes,
            links: {
              self: '' + prefix + _this9.$$path
            }
          };

          if (Object.keys(relationships).length > 0) {
            retVal.relationships = relationships;
          }

          return retVal;
        });
      });
    }

    // TODO: don't fetch if we $get() something that we already have

  }, {
    key: '$get',
    value: function $get() {
      var _this10 = this;

      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : $self;

      var keys = void 0;
      if (Array.isArray(opts)) {
        keys = opts;
      } else {
        keys = [opts];
      }
      return _bluebird2.default.all(keys.map(function (key) {
        return _this10.$$singleGet(key);
      })).then(function (valueArray) {
        var selfIdx = keys.indexOf($self);
        if (selfIdx >= 0 && valueArray[selfIdx] === null) {
          return null;
        } else {
          return valueArray.reduce(function (accum, curr) {
            return Object.assign(accum, curr);
          }, {});
        }
      });
    }
  }, {
    key: '$$singleGet',
    value: function $$singleGet() {
      var _this11 = this;

      var opt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : $self;

      // X cases.
      // key === $all - fetch all fields unless loaded, return all fields
      // $fields[key].type === 'hasMany', - fetch children (perhaps move this decision to store)
      // otherwise - fetch non-hasMany fields unless already loaded, return all non-hasMany fields
      var key = void 0;
      if (opt !== $self && opt !== $all && this.constructor.$fields[opt].type !== 'hasMany') {
        key = $self;
      } else {
        key = opt;
      }

      return _bluebird2.default.resolve().then(function () {
        if (!_this11.$$isLoaded(key) && _this11[$plump]) {
          if ((typeof key === 'undefined' ? 'undefined' : _typeof(key)) === 'symbol') {
            // key === $self or $all
            return _this11[$plump].get(_this11.constructor, _this11.$id, key);
          } else {
            return _this11.$relationships[key].$list();
          }
        } else {
          return true;
        }
      }).then(function (v) {
        if (v === true) {
          if (key === $self) {
            var retVal = {};
            for (var k in _this11[$store]) {
              if (_this11.constructor.$fields[k].type !== 'hasMany') {
                retVal[k] = _this11[$store][k];
              }
            }
            return retVal;
          } else {
            return Object.assign({}, _defineProperty({}, key, _this11[$store][key]));
          }
        } else if (v && v[$self] !== null) {
          _this11.$$copyValuesFrom(v);
          if (key === $all) {
            for (var _k in _this11[$loaded]) {
              // eslint-disable-line guard-for-in
              _this11[$loaded][_k] = true;
            }
          } else {
            _this11[$loaded][key] = true;
          }
          if (key === $self) {
            var _retVal = {};
            for (var _k2 in _this11[$store]) {
              if (_this11.constructor.$fields[_k2].type !== 'hasMany') {
                _retVal[_k2] = _this11[$store][_k2];
              }
            }
            return _retVal;
          } else if (key === $all) {
            return Object.assign({}, _this11[$store]);
          } else {
            return Object.assign({}, _defineProperty({}, key, _this11[$store][key]));
          }
        } else {
          return null;
        }
      });
    }
  }, {
    key: '$save',
    value: function $save() {
      return this.$set();
    }
  }, {
    key: '$set',
    value: function $set() {
      var _this12 = this;

      var u = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this[$store];

      var update = (0, _mergeOptions2.default)({}, this[$store], u);
      Object.keys(this.constructor.$fields).forEach(function (key) {
        if (_this12.constructor.$fields[key].type === 'hasMany') {
          delete update[key];
        }
      });
      // this.$$copyValuesFrom(update); // this is the optimistic update;
      return this[$plump].save(this.constructor, update).then(function (updated) {
        _this12.$$copyValuesFrom(updated);
        return _this12;
      });
    }
  }, {
    key: '$delete',
    value: function $delete() {
      return this[$plump].delete(this.constructor, this.$id);
    }
  }, {
    key: '$rest',
    value: function $rest(opts) {
      var restOpts = Object.assign({}, opts, {
        url: '/' + this.constructor.$name + '/' + this.$id + '/' + opts.url
      });
      return this[$plump].restRequest(restOpts);
    }
  }, {
    key: '$add',
    value: function $add(key, item, extras) {
      var _this13 = this;

      return _bluebird2.default.resolve().then(function () {
        if (_this13.constructor.$fields[key].type === 'hasMany') {
          var id = 0;
          if (typeof item === 'number') {
            id = item;
          } else if (item.$id) {
            id = item.$id;
          } else {
            id = item[_this13.constructor.$fields[key].relationship.$sides[key].other.field];
          }
          if (typeof id === 'number' && id >= 1) {
            return _this13[$plump].add(_this13.constructor, _this13.$id, key, id, extras);
          } else {
            return _bluebird2.default.reject(new Error('Invalid item added to hasMany'));
          }
        } else {
          return _bluebird2.default.reject(new Error('Cannot $add except to hasMany field'));
        }
      }).then(function (l) {
        _this13.$$copyValuesFrom(_defineProperty({}, key, l));
        return l;
      });
    }
  }, {
    key: '$modifyRelationship',
    value: function $modifyRelationship(key, item, extras) {
      if (this.constructor.$fields[key].type === 'hasMany') {
        var id = 0;
        if (typeof item === 'number') {
          id = item;
        } else {
          id = item.$id;
        }
        if (typeof id === 'number' && id >= 1) {
          this[$store][key] = [];
          this[$loaded][key] = false;
          return this[$plump].modifyRelationship(this.constructor, this.$id, key, id, extras);
        } else {
          return _bluebird2.default.reject(new Error('Invalid item added to hasMany'));
        }
      } else {
        return _bluebird2.default.reject(new Error('Cannot $add except to hasMany field'));
      }
    }
  }, {
    key: '$remove',
    value: function $remove(key, item) {
      if (this.constructor.$fields[key].type === 'hasMany') {
        var id = 0;
        if (typeof item === 'number') {
          id = item;
        } else {
          id = item.$id;
        }
        if (typeof id === 'number' && id >= 1) {
          this[$store][key] = [];
          this[$loaded][key] = false;
          return this[$plump].remove(this.constructor, this.$id, key, id);
        } else {
          return _bluebird2.default.reject(new Error('Invalid item $removed from hasMany'));
        }
      } else {
        return _bluebird2.default.reject(new Error('Cannot $remove except from hasMany field'));
      }
    }
  }, {
    key: '$teardown',
    value: function $teardown() {
      if (this[$unsubscribe]) {
        this[$unsubscribe].unsubscribe();
      }
    }
  }, {
    key: '$name',
    get: function get() {
      return this.constructor.$name;
    }
  }, {
    key: '$id',
    get: function get() {
      return this[$store][this.constructor.$id];
    }
  }, {
    key: '$$attributeFields',
    get: function get() {
      var _this14 = this;

      return Object.keys(this.constructor.$fields).filter(function (key) {
        return key !== _this14.constructor.$id && _this14.constructor.$fields[key].type !== 'hasMany';
      });
    }
  }, {
    key: '$$relatedFields',
    get: function get() {
      return Object.keys(this.constructor.$include);
    }
  }, {
    key: '$$path',
    get: function get() {
      return '/' + this.$name + '/' + this.$id;
    }
  }, {
    key: '$$dataJSON',
    get: function get() {
      return {
        type: this.$name,
        id: this.$id
      };
    }
  }]);

  return Model;
}();

Model.fromJSON = function fromJSON(json) {
  var _this16 = this;

  this.$id = json.$id || 'id';
  this.$name = json.$name;
  this.$fields = {};
  Object.keys(json.$fields).forEach(function (k) {
    var field = json.$fields[k];
    if (field.type === 'hasMany') {
      var DynamicRelationship = function (_Relationship) {
        _inherits(DynamicRelationship, _Relationship);

        function DynamicRelationship() {
          _classCallCheck(this, DynamicRelationship);

          return _possibleConstructorReturn(this, (DynamicRelationship.__proto__ || Object.getPrototypeOf(DynamicRelationship)).apply(this, arguments));
        }

        return DynamicRelationship;
      }(_relationship.Relationship);

      DynamicRelationship.fromJSON(field.relationship);
      _this16.$fields[k] = {
        type: 'hasMany',
        relationship: DynamicRelationship
      };
    } else {
      _this16.$fields[k] = Object.assign({}, field);
    }
  });
};

Model.toJSON = function toJSON() {
  var _this17 = this;

  var retVal = {
    $id: this.$id,
    $name: this.$name,
    $fields: {}
  };
  var fieldNames = Object.keys(this.$fields);
  fieldNames.forEach(function (k) {
    if (_this17.$fields[k].type === 'hasMany') {
      retVal.$fields[k] = {
        type: 'hasMany',
        relationship: _this17.$fields[k].relationship.toJSON()
      };
    } else {
      retVal.$fields[k] = _this17.$fields[k];
    }
  });
  return retVal;
};

Model.$rest = function $rest(plump, opts) {
  var restOpts = Object.assign({}, opts, {
    url: '/' + this.$name + '/' + opts.url
  });
  return plump.restRequest(restOpts);
};

Model.assign = function assign(opts) {
  var _this18 = this;

  var start = {};
  Object.keys(this.$fields).forEach(function (key) {
    if (opts[key]) {
      start[key] = opts[key];
    } else if (_this18.$fields[key].default) {
      start[key] = _this18.$fields[key].default;
    } else if (_this18.$fields[key].type === 'hasMany') {
      start[key] = [];
    } else {
      start[key] = null;
    }
  });
  return start;
};

Model.$id = 'id';
Model.$name = 'Base';
Model.$self = $self;
Model.$fields = {
  id: {
    type: 'number'
  }
};
Model.$included = [];