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

var _mergeOptions = require('merge-options');

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _Rx = require('rxjs/Rx');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $dirty = Symbol('$dirty');
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
    _classCallCheck(this, Model);

    if (plump) {
      this[$plump] = plump;
    } else {
      throw new Error('Cannot construct Plump model without a Plump');
    }
    // TODO: Define Delta interface
    this[$dirty] = {
      attributes: {}, // Simple key-value
      relationships: {} };
    this[$subject] = new _Rx.BehaviorSubject();
    this[$subject].next({});
    this.$$copyValuesFrom(opts);
  }

  _createClass(Model, [{
    key: '$$copyValuesFrom',
    value: function $$copyValuesFrom() {
      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      for (var key in opts) {
        // eslint-disable-line guard-for-in
        // Deep copy arrays and objects
        var val = _typeof(opts[key]) === 'object' ? (0, _mergeOptions2.default)({}, opts[key]) : opts[key];
        if (key === this.constructor.$id) {
          this[this.constructor.$id] = val;
        } else if (this.$schema.attributes[key]) {
          this[$dirty].attributes[key] = val;
        } else if (this.$schema.relationships[key]) {
          this[$dirty].relationships[key] = val;
        }
      }
      this.$$fireUpdate();
    }
  }, {
    key: '$$hookToPlump',
    value: function $$hookToPlump() {
      var _this = this;

      if (this[$unsubscribe] === undefined) {
        this[$unsubscribe] = this[$plump].subscribe(this.constructor.$name, this.$id, function (_ref) {
          var field = _ref.field,
              value = _ref.value;

          if (field !== undefined) {
            // this.$$copyValuesFrom(value);
            _this.$$copyValuesFrom(_defineProperty({}, field, value));
          }
        });
      }
    }

    // TODO: update for new $dirty interface

  }, {
    key: '$subscribe',
    value: function $subscribe() {
      var _this2 = this;

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
          return _this2.$$copyValuesFrom(v);
        });
      }
      return this[$subject].subscribe(cb);
    }
  }, {
    key: '$$resetDirty',
    value: function $$resetDirty() {
      this[$dirty] = { attributes: {}, relationships: {} };
    }
  }, {
    key: '$$fireUpdate',
    value: function $$fireUpdate() {
      this[$subject].next(this[$dirty]);
    }
  }, {
    key: '$get',
    value: function $get(opts) {
      var _this3 = this;

      return _bluebird2.default.resolve().then(function () {
        if (opts) {
          // just get the stuff that was requested
          var keys = Array.isArray(opts) ? opts : [opts];
          return _this3[$plump].get(_this3.constructor, _this3.$id, keys);
        } else {
          // get everything
          return _this3[$plump].get(_this3.constructor, _this3.$id);
        }
      }).then(function (self) {
        var isClean = Object.keys(_this3[$dirty]).map(function (k) {
          return Object.keys(_this3[$dirty][k]).length;
        }).reduce(function (acc, curr) {
          return acc + curr;
        }, 0) === 0;
        if (!self && isClean) {
          return null;
        } else {
          var retVal = {
            type: _this3.$name,
            id: _this3.$id,
            attributes: {},
            relationships: {}
          };
          for (var key in self) {
            if (_this3.$schema.attributes[key]) {
              retVal.attributes[key] = self[key] || _this3[$dirty].attributes[key];
            } else if (_this3.$schema.relationships[key]) {
              retVal.relationships[key] = self[key] || _this3[$dirty].relationships[key];
            }
          }
          return retVal;
        }
      });
    }

    // TODO: Unstub this

  }, {
    key: '$$resolveRelDeltas',
    value: function $$resolveRelDeltas(key) {
      return this[$dirty].relationships[key];
    }
  }, {
    key: '$save',
    value: function $save(opts) {
      var _this4 = this;

      var key = opts || Object.keys(this[$dirty].attributes).concat(Object.keys(this[$dirty].relationships));
      var keys = Array.isArray(key) ? key : [key];
      var update = {};
      keys.forEach(function (k) {
        if (_this4[$dirty].attributes[k]) {
          update[k] = _this4[$dirty].attributes[k];
          delete _this4[$dirty].attributes[k];
        } else if (_this4[$dirty].relationships[k]) {
          update[k] = _this4.$$resolveRelDeltas(k);
          delete _this4[$dirty].relationships[k];
        }
      });
      return this[$plump].save(this.constructor, update).then(function (updated) {
        if (updated[_this4.$schema.$id]) {
          _this4[_this4.$schema.$id] = updated[_this4.$schema.$id];
        }
        return _this4;
      });
    }
  }, {
    key: '$set',
    value: function $set() {
      var _this5 = this;

      var u = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var update = (0, _mergeOptions2.default)({}, this[$dirty].attributes, u);
      // this.$$copyValuesFrom(update); // this is the optimistic update;
      return this[$plump].save(this.constructor, update).then(function (updated) {
        _this5.$$copyValuesFrom(updated);
        _this5.$$resetDirty();
        return _this5;
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
      var _this6 = this;

      return _bluebird2.default.resolve().then(function () {
        if (_this6.$schema.relationships[key]) {
          var id = 0;
          if (typeof item === 'number') {
            id = item;
          } else if (item.$id) {
            id = item.$id;
          } else {
            id = item[_this6.$schema.relationships[key].relationship.$sides[key].other.field];
          }
          if (typeof id === 'number' && id >= 1) {
            return _this6[$plump].add(_this6.constructor, _this6.$id, key, id, extras);
          } else {
            return _bluebird2.default.reject(new Error('Invalid item added to hasMany'));
          }
        } else {
          return _bluebird2.default.reject(new Error('Cannot $add except to hasMany field'));
        }
      }).then(function (l) {
        _this6.$$copyValuesFrom(_defineProperty({}, key, l));
        return l;
      });
    }
  }, {
    key: '$modifyRelationship',
    value: function $modifyRelationship(key, item, extras) {
      if (this.$schema.relationships[key]) {
        var id = 0;
        if (typeof item === 'number') {
          id = item;
        } else {
          id = item.$id;
        }
        if (typeof id === 'number' && id >= 1) {
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
      if (this.$schema.relationships[key]) {
        var id = 0;
        if (typeof item === 'number') {
          id = item;
        } else {
          id = item.$id;
        }
        if (typeof id === 'number' && id >= 1) {
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
      return this[this.constructor.$id];
    }
  }, {
    key: '$schema',
    get: function get() {
      return this.constructor.$schema;
    }
  }]);

  return Model;
}();

Model.fromJSON = function fromJSON(json) {
  this.$id = json.$id || 'id';
  this.$name = json.$name;
  this.$include = json.$include;
  this.$schema = {
    attributes: (0, _mergeOptions2.default)(json.$schema.attributes),
    relationships: {}
  };
  for (var rel in json.$schema.relationships) {
    // eslint-disable-line guard-for-in
    this.$schema.relationships[rel] = {};

    var DynamicRelationship = function (_Relationship) {
      _inherits(DynamicRelationship, _Relationship);

      function DynamicRelationship() {
        _classCallCheck(this, DynamicRelationship);

        return _possibleConstructorReturn(this, (DynamicRelationship.__proto__ || Object.getPrototypeOf(DynamicRelationship)).apply(this, arguments));
      }

      return DynamicRelationship;
    }(_relationship.Relationship);

    DynamicRelationship.fromJSON(json.$schema.relationships[rel]);
    this.$schema.relationships[rel].type = DynamicRelationship;
  }
};

Model.toJSON = function toJSON() {
  var retVal = {
    $id: this.$id,
    $name: this.$name,
    $include: this.$include,
    $schema: { attributes: this.$schema.attributes, relationships: {} }
  };
  for (var rel in this.$schema.relationships) {
    // eslint-disable-line guard-for-in
    retVal.$schema.relationships[rel] = this.$schema.relationships[rel].type.toJSON();
  }
  return retVal;
};

Model.$rest = function $rest(plump, opts) {
  var restOpts = Object.assign({}, opts, {
    url: '/' + this.$name + '/' + opts.url
  });
  return plump.restRequest(restOpts);
};

Model.assign = function assign(opts) {
  var _this8 = this;

  var start = {
    type: this.$name,
    id: opts[this.$schema.$id] || null,
    attributes: {},
    relationships: {}
  };
  ['attributes', 'relationships'].forEach(function (fieldType) {
    for (var key in _this8.$schema[fieldType]) {
      if (opts[key]) {
        start[fieldType][key] = opts[key];
      } else if (_this8.$schema[fieldType][key].default) {
        start[fieldType][key] = _this8.$schema[fieldType][key].default;
      } else {
        start[fieldType][key] = fieldType === 'attributes' ? null : [];
      }
    }
  });
  return start;
};

Model.$id = 'id';
Model.$name = 'Base';
Model.$self = $self;
Model.$schema = {
  $id: 'id',
  attributes: {},
  relationships: {}
};
Model.$included = [];