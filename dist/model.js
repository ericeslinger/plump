'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Model = exports.$all = exports.$self = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _relationship = require('./relationship');

var _mergeOptions2 = require('merge-options');

var _mergeOptions3 = _interopRequireDefault(_mergeOptions2);

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
    Object.keys(this.constructor.$fields).forEach(function (fieldName) {
      if (_this.constructor.$fields[fieldName].type === 'hasMany') {
        var Rel = _this.constructor.$fields[fieldName].relationship;
        _this.$relationships[fieldName] = new Rel(_this, fieldName, plump);
        _this[$store][fieldName] = [];
        _this[$loaded][fieldName] = false;
      } else {
        _this[$store][fieldName] = _this.constructor.$fields[fieldName].default || null;
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
        var field = _this3.constructor.$fields[fieldName];
        if (opts[fieldName] !== undefined) {
          // copy from opts to the best of our ability
          if (field.type === 'array') {
            _this3[$store][fieldName] = (opts[fieldName] || []).concat();
            _this3[$loaded][fieldName] = true;
          } else if (field.type === 'hasMany') {
            (function () {
              var side = field.relationship.$sides[fieldName];
              _this3[$store][fieldName] = opts[fieldName].map(function (v) {
                var retVal = {
                  id: v[side.other.field]
                };
                if (field.relationship.$extras) {
                  Object.keys(field.relationship.$extras).forEach(function (extra) {
                    retVal[extra] = v[extra];
                  });
                }
                return retVal;
              });
              _this3[$loaded][fieldName] = true;
            })();
          } else if (field.type === 'object') {
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

    // Model.$get, when asking for a hasMany field will
    // ALWAYS resolve to an object with that field as a property.
    // The value of that property will ALWAYS be an array (possibly empty).
    // The elements of the array will ALWAYS be objects, with at least an 'id' field.
    // Array elements MAY have other fields (if the hasMany has valence).

  }, {
    key: '$get',
    value: function $get() {
      var _this6 = this;

      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : $self;

      var keys = void 0;
      if (Array.isArray(opts)) {
        keys = opts;
      } else {
        keys = [opts];
      }
      return _bluebird2.default.all(keys.map(function (key) {
        return _this6.$$singleGet(key);
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
      var _this7 = this;

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
        if (!_this7.$$isLoaded(key) && _this7[$plump]) {
          if ((typeof key === 'undefined' ? 'undefined' : _typeof(key)) === 'symbol') {
            // key === $self or $all
            return _this7[$plump].get(_this7.constructor, _this7.$id, key);
          } else {
            return _this7.$relationships[key].$list();
          }
        } else {
          return true;
        }
      }).then(function (v) {
        if (v === true) {
          if (key === $self) {
            var retVal = {};
            for (var k in _this7[$store]) {
              if (_this7.constructor.$fields[k].type !== 'hasMany') {
                retVal[k] = _this7[$store][k];
              }
            }
            return retVal;
          } else {
            return Object.assign({}, _defineProperty({}, key, _this7[$store][key]));
          }
        } else if (v && v[$self] !== null) {
          _this7.$$copyValuesFrom(v);
          if (key === $all) {
            for (var _k in _this7[$loaded]) {
              // eslint-disable-line guard-for-in
              _this7[$loaded][_k] = true;
            }
          } else {
            _this7[$loaded][key] = true;
          }
          if (key === $self) {
            var _retVal = {};
            for (var _k2 in _this7[$store]) {
              if (_this7.constructor.$fields[_k2].type !== 'hasMany') {
                _retVal[_k2] = _this7[$store][_k2]; // TODO: deep copy of object
              }
            }
            return _retVal;
          } else if (key === $all) {
            return (0, _mergeOptions3.default)({}, _this7[$store]);
          } else {
            return (0, _mergeOptions3.default)({}, _defineProperty({}, key, _this7[$store][key]));
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
      var _this8 = this;

      var u = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this[$store];

      var update = (0, _mergeOptions3.default)({}, this[$store], u);
      Object.keys(this.constructor.$fields).forEach(function (key) {
        if (_this8.constructor.$fields[key].type === 'hasMany') {
          delete update[key];
        }
      });
      // this.$$copyValuesFrom(update); // this is the optimistic update;
      return this[$plump].save(this.constructor, update).then(function (updated) {
        _this8.$$copyValuesFrom(updated);
        return _this8;
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
      var _this9 = this;

      return _bluebird2.default.resolve().then(function () {
        if (_this9.constructor.$fields[key].type === 'hasMany') {
          var id = 0;
          if (typeof item === 'number') {
            id = item;
          } else if (item.$id) {
            id = item.$id;
          } else {
            id = item[_this9.constructor.$fields[key].relationship.$sides[key].other.field];
          }
          if (typeof id === 'number' && id >= 1) {
            return _this9[$plump].add(_this9.constructor, _this9.$id, key, id, extras);
          } else {
            return _bluebird2.default.reject(new Error('Invalid item added to hasMany'));
          }
        } else {
          return _bluebird2.default.reject(new Error('Cannot $add except to hasMany field'));
        }
      }).then(function (l) {
        _this9.$$copyValuesFrom(_defineProperty({}, key, l));
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
  var _this11 = this;

  this.$id = json.$id || 'id';
  this.$name = json.$name;
  this.$include = json.$include;
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
      _this11.$fields[k] = {
        type: 'hasMany',
        relationship: DynamicRelationship
      };
    } else {
      _this11.$fields[k] = Object.assign({}, field);
    }
  });
};

Model.toJSON = function toJSON() {
  var _this12 = this;

  var retVal = {
    $id: this.$id,
    $name: this.$name,
    $include: this.$include,
    $fields: {}
  };
  var fieldNames = Object.keys(this.$fields);
  fieldNames.forEach(function (k) {
    if (_this12.$fields[k].type === 'hasMany') {
      retVal.$fields[k] = {
        type: 'hasMany',
        relationship: _this12.$fields[k].relationship.toJSON()
      };
    } else {
      retVal.$fields[k] = _this12.$fields[k];
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
  var _this13 = this;

  var start = {};
  Object.keys(this.$fields).forEach(function (key) {
    if (opts[key]) {
      start[key] = opts[key];
    } else if (_this13.$fields[key].default) {
      start[key] = _this13.$fields[key].default;
    } else if (_this13.$fields[key].type === 'hasMany') {
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