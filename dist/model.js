'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Model = exports.$all = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mergeOptions = require('merge-options');

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _Rx = require('rxjs/Rx');

var _relationship = require('./relationship');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $dirty = Symbol('$dirty');
var $plump = Symbol('$plump');
var $unsubscribe = Symbol('$unsubscribe');
var $subject = Symbol('$subject');
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
    // this.$$fireUpdate(opts);
  }

  // CONVENIENCE ACCESSORS

  _createClass(Model, [{
    key: '$$copyValuesFrom',


    // WIRING

    value: function $$copyValuesFrom() {
      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var idField = this.constructor.$id in opts ? this.constructor.$id : 'id';
      this[this.constructor.$id] = opts[idField] || this.$id;
      this[$dirty] = this.constructor.schematize(opts);
    }
  }, {
    key: '$$hookToPlump',
    value: function $$hookToPlump() {
      var _this = this;

      if (this[$unsubscribe] === undefined) {
        this[$unsubscribe] = this[$plump].subscribe(this.constructor.$name, this.$id, function (_ref) {
          var field = _ref.field,
              value = _ref.value;

          if (field === undefined) {
            _this.$$copyValuesFrom(value);
          } else {
            _this.$$copyValuesFrom(_defineProperty({}, field, value));
          }
        });
      }
    }
  }, {
    key: '$subscribe',
    value: function $subscribe() {
      var _this2 = this;

      var fields = ['attributes'];
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
      this[$plump].streamGet(this.constructor, this.$id, fields).subscribe(function (v) {
        _this2.$$fireUpdate(v);
      });
      return this[$subject].subscribeOn(cb);
    }
  }, {
    key: '$$resetDirty',
    value: function $$resetDirty(opts) {
      var _this3 = this;

      var key = opts || this.$dirtyFields;
      var newDirty = { attributes: {}, relationships: {} };
      var keys = Array.isArray(key) ? key : [key];
      Object.keys(this[$dirty]).forEach(function (schemaField) {
        for (var field in _this3[$dirty][schemaField]) {
          if (keys.indexOf(field) < 0) {
            var val = _this3[$dirty][schemaField][field];
            newDirty[schemaField][field] = (typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object' ? (0, _mergeOptions2.default)({}, val) : val;
          }
        }
      });
      this[$dirty] = newDirty;
    }
  }, {
    key: '$$fireUpdate',
    value: function $$fireUpdate(v) {
      var update = this.constructor.resolveAndOverlay(this[$dirty], v);
      if (this.$id) {
        update.id = this.$id;
      }
      this[$subject].next(update);
    }
  }, {
    key: '$teardown',
    value: function $teardown() {
      if (this[$unsubscribe]) {
        this[$unsubscribe].unsubscribe();
      }
    }

    // API METHODS

  }, {
    key: '$get',
    value: function $get(opts) {
      var _this4 = this;

      // If opts is falsy (i.e., undefined), get attributes
      // Otherwise, get what was requested,
      // wrapping it in a Array if it wasn't already one
      var keys = opts && !Array.isArray(opts) ? [opts] : opts;
      if (keys && keys.indexOf($all) >= 0) {
        keys = Object.keys(this.$schema.relationships);
      }
      return this[$plump].get(this.constructor, this.$id, keys).then(function (self) {
        if (!self && _this4.$dirtyFields.length === 0) {
          return null;
        } else {
          var schematized = _this4.constructor.schematize(self || {});
          var withDirty = _this4.constructor.resolveAndOverlay(_this4[$dirty], schematized);
          var retVal = _this4.constructor.applyDefaults(withDirty);
          retVal.type = _this4.$name;
          retVal.id = _this4.$id;
          return retVal;
        }
      });
    }

    // TODO: Should $save ultimately return this.$get()?

  }, {
    key: '$save',
    value: function $save(opts) {
      var _this5 = this;

      var options = opts || this.$fields;
      var keys = Array.isArray(options) ? options : [options];

      // Deep copy dirty cache, filtering out keys that are not in opts
      var update = Object.keys(this[$dirty]).map(function (schemaField) {
        var value = Object.keys(_this5[$dirty][schemaField]).filter(function (key) {
          return keys.indexOf(key) >= 0;
        }).map(function (key) {
          return _defineProperty({}, key, _this5[$dirty][schemaField][key]);
        }).reduce(function (acc, curr) {
          return Object.assign(acc, curr);
        }, {});

        return _defineProperty({}, schemaField, value);
      }).reduce(function (acc, curr) {
        return Object.assign(acc, curr);
      }, {});

      if (this.$id !== undefined) {
        update[this.constructor.$id] = this.$id;
      }

      return this[$plump].save(this.constructor, update).then(function (updated) {
        _this5.$$resetDirty(opts);
        if (updated.id) {
          _this5[_this5.constructor.$id] = updated.id;
        }
        // this.$$fireUpdate(updated);
        return _this5;
      });
    }
  }, {
    key: '$set',
    value: function $set(update) {
      // Filter out non-attribute keys
      var sanitized = {};
      for (var key in update) {
        if (key in this.$schema.attributes) {
          sanitized[key] = update[key];
        } else {
          throw new Error('Key ' + key + ' is not an attributes of ' + this.$name);
        }
      }
      this.$$copyValuesFrom(sanitized);
      // this.$$fireUpdate(sanitized);
      return this;
    }
  }, {
    key: '$delete',
    value: function $delete() {
      var _this6 = this;

      return this[$plump].delete(this.constructor, this.$id).then(function (data) {
        return data.map(_this6.constructor.schematize);
      });
    }
  }, {
    key: '$rest',
    value: function $rest(opts) {
      var _this7 = this;

      var restOpts = Object.assign({}, opts, {
        url: '/' + this.constructor.$name + '/' + this.$id + '/' + opts.url
      });
      return this[$plump].restRequest(restOpts).then(function (data) {
        return _this7.constructor.schematize(data);
      });
    }
  }, {
    key: '$add',
    value: function $add(key, item, extras) {
      if (this.$schema.relationships[key]) {
        var id = 0;
        if (typeof item === 'number') {
          id = item;
        } else if (item.$id) {
          id = item.$id;
        } else {
          id = item[this.$schema.relationships[key].type.$sides[key].other.field];
        }
        if (typeof id === 'number' && id >= 1) {
          if (!(key in this[$dirty].relationships)) {
            this[$dirty].relationships[key] = [];
          }
          this[$dirty].relationships[key].push({
            op: 'add',
            data: Object.assign({ id: id }, { meta: extras })
          });
          // this.$$fireUpdate();
          return this;
        } else {
          throw new Error('Invalid item added to hasMany');
        }
      } else {
        throw new Error('Cannot $add except to hasMany field');
      }
    }
  }, {
    key: '$modifyRelationship',
    value: function $modifyRelationship(key, item, extras) {
      if (key in this.$schema.relationships) {
        var id = 0;
        if (typeof item === 'number') {
          id = item;
        } else {
          id = item.$id;
        }
        if (typeof id === 'number' && id >= 1) {
          if (!(key in this[$dirty].relationships)) {
            this[$dirty].relationships[key] = [];
          }
          this[$dirty].relationships[key].push({
            op: 'modify',
            data: Object.assign({ id: id }, { meta: extras })
          });
          // this.$$fireUpdate();
          return this;
        } else {
          throw new Error('Invalid item added to hasMany');
        }
      } else {
        throw new Error('Cannot $add except to hasMany field');
      }
    }
  }, {
    key: '$remove',
    value: function $remove(key, item) {
      if (key in this.$schema.relationships) {
        var id = 0;
        if (typeof item === 'number') {
          id = item;
        } else {
          id = item.$id;
        }
        if (typeof id === 'number' && id >= 1) {
          if (!(key in this[$dirty].relationships)) {
            this[$dirty].relationships[key] = [];
          }
          this[$dirty].relationships[key].push({
            op: 'remove',
            data: { id: id }
          });
          // this.$$fireUpdate();
          return this;
        } else {
          throw new Error('Invalid item $removed from hasMany');
        }
      } else {
        throw new Error('Cannot $remove except from hasMany field');
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
    key: '$fields',
    get: function get() {
      return Object.keys(this.$schema.attributes).concat(Object.keys(this.$schema.relationships));
    }
  }, {
    key: '$schema',
    get: function get() {
      return this.constructor.$schema;
    }
  }, {
    key: '$dirtyFields',
    get: function get() {
      var _this8 = this;

      return Object.keys(this[$dirty]).map(function (k) {
        return Object.keys(_this8[$dirty][k]);
      }).reduce(function (acc, curr) {
        return acc.concat(curr);
      }, []).filter(function (k) {
        return k !== _this8.constructor.$id;
      }) // id should never be dirty
      .reduce(function (acc, curr) {
        return acc.concat(curr);
      }, []);
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

// SCHEMA FUNCTIONS

Model.addDelta = function addDelta(relName, relationship) {
  var _this10 = this;

  return relationship.map(function (rel) {
    var relSchema = _this10.$schema.relationships[relName].type.$sides[relName];
    var schematized = { op: 'add', data: { id: rel[relSchema.other.field] } };
    for (var relField in rel) {
      if (!(relField === relSchema.self.field || relField === relSchema.other.field)) {
        schematized.data[relField] = rel[relField];
      }
    }
    return schematized;
  });
};

Model.applyDefaults = function applyDefaults(v) {
  var _this11 = this;

  var retVal = (0, _mergeOptions2.default)({}, v);
  for (var attr in this.$schema.attributes) {
    if ('default' in this.$schema.attributes[attr] && !(attr in retVal.attributes)) {
      retVal.attributes[attr] = this.$schema.attributes[attr].default;
    }
  }
  Object.keys(this.$schema).filter(function (k) {
    return k !== '$id';
  }).forEach(function (schemaField) {
    for (var field in _this11.$schema[schemaField]) {
      if (!(field in retVal[schemaField])) {
        if ('default' in _this11.$schema[schemaField][field]) {
          retVal[schemaField][field] = _this11.$schema[schemaField][field].default;
        }
      }
    }
  });
  return retVal;
};

Model.applyDelta = function applyDelta(current, delta) {
  if (delta.op === 'add' || delta.op === 'modify') {
    var retVal = (0, _mergeOptions2.default)({}, current, delta.data);
    return retVal;
  } else if (delta.op === 'remove') {
    return undefined;
  } else {
    return current;
  }
};

Model.assign = function assign(opts) {
  var _this12 = this;

  var schematized = this.schematize(opts, { includeId: true });
  var retVal = this.applyDefaults(schematized);
  Object.keys(this.$schema).filter(function (k) {
    return k !== '$id';
  }).forEach(function (schemaField) {
    for (var field in _this12.$schema[schemaField]) {
      if (!(field in retVal[schemaField])) {
        retVal[schemaField][field] = schemaField === 'relationships' ? [] : null;
      }
    }
  });
  retVal.type = this.$name;
  return retVal;
};

Model.resolveAndOverlay = function resolveAndOverlay(update) {
  var base = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { attributes: {}, relationships: {} };

  var attributes = (0, _mergeOptions2.default)({}, base.attributes, update.attributes);
  var baseIsResolved = Object.keys(base.relationships).map(function (relName) {
    return base.relationships[relName].map(function (rel) {
      return !('op' in rel);
    }).reduce(function (acc, curr) {
      return acc && curr;
    }, true);
  }).reduce(function (acc, curr) {
    return acc && curr;
  }, true);
  var resolvedBaseRels = baseIsResolved ? base.relationships : this.resolveRelationships(base.relationships);
  var resolvedRelationships = this.resolveRelationships(update.relationships, resolvedBaseRels);
  return { attributes: attributes, relationships: resolvedRelationships };
};

Model.resolveRelationships = function resolveRelationships(deltas) {
  var _this13 = this;

  var base = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var updates = Object.keys(deltas).map(function (relName) {
    var resolved = _this13.resolveRelationship(deltas[relName], base[relName]);
    return _defineProperty({}, relName, resolved);
  }).reduce(function (acc, curr) {
    return (0, _mergeOptions2.default)(acc, curr);
  }, {});
  return (0, _mergeOptions2.default)({}, base, updates);
};

Model.resolveRelationship = function resolveRelationship(deltas) {
  var _this14 = this;

  var base = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  // Index current relationships by ID for efficient modification
  var updates = base.map(function (rel) {
    return _defineProperty({}, rel.id, rel);
  }).reduce(function (acc, curr) {
    return (0, _mergeOptions2.default)(acc, curr);
  }, {});

  // Apply deltas on top of updates
  deltas.forEach(function (delta) {
    var childId = delta.data ? delta.data.id : delta.id;
    updates[childId] = delta.op ? _this14.applyDelta(updates[childId], delta) : delta;
  });

  // Reduce updates back into list, omitting undefineds
  return Object.keys(updates).map(function (id) {
    return updates[id];
  }).filter(function (rel) {
    return rel !== undefined;
  }).reduce(function (acc, curr) {
    return acc.concat(curr);
  }, []);
};

Model.cacheSet = function cacheSet(store, key, value) {
  if (this.$$storeCache.get(store) === undefined) {
    this.$$storeCache.set(store, {});
  }
  this.$$storeCache.get(store)[key] = value;
};

Model.cacheGet = function cacheGet(store, key) {
  return (this.$$storeCache.get(store) || {})[key];
};

Model.schematize = function schematize() {
  var _this15 = this;

  var v = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { includeId: false };

  var retVal = {};
  if (opts.includeId) {
    retVal.id = this.$id in v ? v[this.$id] : v.id;
  }
  Object.keys(this.$schema).filter(function (k) {
    return k !== '$id';
  }).forEach(function (schemaField) {
    if (schemaField in v) {
      retVal[schemaField] = (0, _mergeOptions2.default)({}, v[schemaField]);
    } else {
      if (!(schemaField in retVal)) {
        retVal[schemaField] = {};
      }
      for (var field in _this15.$schema[schemaField]) {
        if (field in v) {
          retVal[schemaField][field] = schemaField === 'relationships' ? _this15.addDelta(field, v[field]) : v[field];
        }
      }
    }
  });
  return retVal;
};

// METADATA

Model.$$storeCache = new Map();

Model.$id = 'id';
Model.$name = 'Base';
Model.$schema = {
  $id: 'id',
  attributes: {},
  relationships: {}
};
Model.$included = [];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRkaXJ0eSIsIlN5bWJvbCIsIiRwbHVtcCIsIiR1bnN1YnNjcmliZSIsIiRzdWJqZWN0IiwiJGFsbCIsIk1vZGVsIiwib3B0cyIsInBsdW1wIiwiRXJyb3IiLCJhdHRyaWJ1dGVzIiwicmVsYXRpb25zaGlwcyIsIm5leHQiLCIkJGNvcHlWYWx1ZXNGcm9tIiwiaWRGaWVsZCIsImNvbnN0cnVjdG9yIiwiJGlkIiwic2NoZW1hdGl6ZSIsInVuZGVmaW5lZCIsInN1YnNjcmliZSIsIiRuYW1lIiwiZmllbGQiLCJ2YWx1ZSIsImZpZWxkcyIsImNiIiwibGVuZ3RoIiwiQXJyYXkiLCJpc0FycmF5IiwiJCRob29rVG9QbHVtcCIsInN0cmVhbUdldCIsInYiLCIkJGZpcmVVcGRhdGUiLCJzdWJzY3JpYmVPbiIsImtleSIsIiRkaXJ0eUZpZWxkcyIsIm5ld0RpcnR5Iiwia2V5cyIsIk9iamVjdCIsImZvckVhY2giLCJzY2hlbWFGaWVsZCIsImluZGV4T2YiLCJ2YWwiLCJ1cGRhdGUiLCJyZXNvbHZlQW5kT3ZlcmxheSIsImlkIiwidW5zdWJzY3JpYmUiLCIkc2NoZW1hIiwiZ2V0IiwidGhlbiIsInNlbGYiLCJzY2hlbWF0aXplZCIsIndpdGhEaXJ0eSIsInJldFZhbCIsImFwcGx5RGVmYXVsdHMiLCJ0eXBlIiwib3B0aW9ucyIsIiRmaWVsZHMiLCJtYXAiLCJmaWx0ZXIiLCJyZWR1Y2UiLCJhY2MiLCJjdXJyIiwiYXNzaWduIiwic2F2ZSIsInVwZGF0ZWQiLCIkJHJlc2V0RGlydHkiLCJzYW5pdGl6ZWQiLCJkZWxldGUiLCJkYXRhIiwicmVzdE9wdHMiLCJ1cmwiLCJyZXN0UmVxdWVzdCIsIml0ZW0iLCJleHRyYXMiLCIkc2lkZXMiLCJvdGhlciIsInB1c2giLCJvcCIsIm1ldGEiLCJjb25jYXQiLCJrIiwiZnJvbUpTT04iLCJqc29uIiwiJGluY2x1ZGUiLCJyZWwiLCJEeW5hbWljUmVsYXRpb25zaGlwIiwidG9KU09OIiwiJHJlc3QiLCJhZGREZWx0YSIsInJlbE5hbWUiLCJyZWxhdGlvbnNoaXAiLCJyZWxTY2hlbWEiLCJyZWxGaWVsZCIsImF0dHIiLCJkZWZhdWx0IiwiYXBwbHlEZWx0YSIsImN1cnJlbnQiLCJkZWx0YSIsImluY2x1ZGVJZCIsImJhc2UiLCJiYXNlSXNSZXNvbHZlZCIsInJlc29sdmVkQmFzZVJlbHMiLCJyZXNvbHZlUmVsYXRpb25zaGlwcyIsInJlc29sdmVkUmVsYXRpb25zaGlwcyIsImRlbHRhcyIsInVwZGF0ZXMiLCJyZXNvbHZlZCIsInJlc29sdmVSZWxhdGlvbnNoaXAiLCJjaGlsZElkIiwiY2FjaGVTZXQiLCJzdG9yZSIsIiQkc3RvcmVDYWNoZSIsInNldCIsImNhY2hlR2V0IiwiTWFwIiwiJGluY2x1ZGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBRUE7Ozs7Ozs7Ozs7OztBQUNBLElBQU1BLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUMsU0FBU0QsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNRSxlQUFlRixPQUFPLGNBQVAsQ0FBckI7QUFDQSxJQUFNRyxXQUFXSCxPQUFPLFVBQVAsQ0FBakI7QUFDTyxJQUFNSSxzQkFBT0osT0FBTyxNQUFQLENBQWI7O0FBRVA7QUFDQTs7SUFFYUssSyxXQUFBQSxLO0FBQ1gsaUJBQVlDLElBQVosRUFBa0JDLEtBQWxCLEVBQXlCO0FBQUE7O0FBQ3ZCLFFBQUlBLEtBQUosRUFBVztBQUNULFdBQUtOLE1BQUwsSUFBZU0sS0FBZjtBQUNELEtBRkQsTUFFTztBQUNMLFlBQU0sSUFBSUMsS0FBSixDQUFVLDhDQUFWLENBQU47QUFDRDtBQUNEO0FBQ0EsU0FBS1QsTUFBTCxJQUFlO0FBQ2JVLGtCQUFZLEVBREMsRUFDRztBQUNoQkMscUJBQWUsRUFGRixFQUFmO0FBSUEsU0FBS1AsUUFBTCxJQUFpQix5QkFBakI7QUFDQSxTQUFLQSxRQUFMLEVBQWVRLElBQWYsQ0FBb0IsRUFBcEI7QUFDQSxTQUFLQyxnQkFBTCxDQUFzQk4s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QXBCLEVBQStDO0FBQzdDLFlBQUlsQixTQUFTUyxDQUFiLEVBQWdCO0FBQ2RzQixpQkFBT2IsV0FBUCxFQUFvQmxCLEtBQXBCLElBQTZCa0IsZ0JBQWdCLGVBQWhCLEdBQWtDLFFBQUtpRCxRQUFMLENBQWNuRSxLQUFkLEVBQXFCUyxFQUFFVCxLQUFGLENBQXJCLENBQWxDLEdBQW1FUyxFQUFFVCxLQUFGLENBQWhHO0FBQ0Q7QUFDRjtBQUNGO0FBQ0YsR0FkRDtBQWVBLFNBQU8rQixNQUFQO0FBQ0QsQ0FyQkQ7O0FBdUJBOztBQUVBOUMsTUFBTXlHLFlBQU4sR0FBcUIsSUFBSUcsR0FBSixFQUFyQjs7QUFFQTVHLE1BQU1VLEdBQU4sR0FBWSxJQUFaO0FBQ0FWLE1BQU1jLEtBQU4sR0FBYyxNQUFkO0FBQ0FkLE1BQU13QyxPQUFOLEdBQWdCO0FBQ2Q5QixPQUFLLElBRFM7QUFFZE4sY0FBWSxFQUZFO0FBR2RDLGlCQUFlO0FBSEQsQ0FBaEI7QUFLQUwsTUFBTTZHLFNBQU4sR0FBa0IsRUFBbEIiLCJmaWxlIjoibW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbWVyZ2VPcHRpb25zIGZyb20gJ21lcmdlLW9wdGlvbnMnO1xuaW1wb3J0IHsgQmVoYXZpb3JTdWJqZWN0IH0gZnJvbSAncnhqcy9SeCc7XG5cbmltcG9ydCB7IFJlbGF0aW9uc2hpcCB9IGZyb20gJy4vcmVsYXRpb25zaGlwJztcbmNvbnN0ICRkaXJ0eSA9IFN5bWJvbCgnJGRpcnR5Jyk7XG5jb25zdCAkcGx1bXAgPSBTeW1ib2woJyRwbHVtcCcpO1xuY29uc3QgJHVuc3Vic2NyaWJlID0gU3ltYm9sKCckdW5zdWJzY3JpYmUnKTtcbmNvbnN0ICRzdWJqZWN0ID0gU3ltYm9sKCckc3ViamVjdCcpO1xuZXhwb3J0IGNvbnN0ICRhbGwgPSBTeW1ib2woJyRhbGwnKTtcblxuLy8gVE9ETzogZmlndXJlIG91dCB3aGVyZSBlcnJvciBldmVudHMgb3JpZ2luYXRlIChzdG9yYWdlIG9yIG1vZGVsKVxuLy8gYW5kIHdobyBrZWVwcyBhIHJvbGwtYmFja2FibGUgZGVsdGFcblxuZXhwb3J0IGNsYXNzIE1vZGVsIHtcbiAgY29uc3RydWN0b3Iob3B0cywgcGx1bXApIHtcbiAgICBpZiAocGx1bXApIHtcbiAgICAgIHRoaXNbJHBsdW1wXSA9IHBsdW1wO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjb25zdHJ1Y3QgUGx1bXAgbW9kZWwgd2l0aG91dCBhIFBsdW1wJyk7XG4gICAgfVxuICAgIC8vIFRPRE86IERlZmluZSBEZWx0YSBpbnRlcmZhY2VcbiAgICB0aGlzWyRkaXJ0eV0gPSB7XG4gICAgICBhdHRyaWJ1dGVzOiB7fSwgLy8gU2ltcGxlIGtleS12YWx1ZVxuICAgICAgcmVsYXRpb25zaGlwczoge30sIC8vIHJlbE5hbWU6IERlbHRhW11cbiAgICB9O1xuICAgIHRoaXNbJHN1YmplY3RdID0gbmV3IEJlaGF2aW9yU3ViamVjdCgpO1xuICAgIHRoaXNbJHN1YmplY3RdLm5leHQoe30pO1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbShvcHRzKTtcbiAgICAvLyB0aGlzLiQkZmlyZVVwZGF0ZShvcHRzKTtcbiAgfVxuXG4gIC8vIENPTlZFTklFTkNFIEFDQ0VTU09SU1xuXG4gIGdldCAkbmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci4kbmFtZTtcbiAgfVxuXG4gIGdldCAkaWQoKSB7XG4gICAgcmV0dXJuIHRoaXNbdGhpcy5jb25zdHJ1Y3Rvci4kaWRdO1xuICB9XG5cbiAgZ2V0ICRmaWVsZHMoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuJHNjaGVtYS5hdHRyaWJ1dGVzKVxuICAgIC5jb25jYXQoT2JqZWN0LmtleXModGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHMpKTtcbiAgfVxuXG4gIGdldCAkc2NoZW1hKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLiRzY2hlbWE7XG4gIH1cblxuICBnZXQgJGRpcnR5RmllbGRzKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzWyRkaXJ0eV0pXG4gICAgLm1hcChrID0+IE9iamVjdC5rZXlzKHRoaXNbJGRpcnR5XVtrXSkpXG4gICAgLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBhY2MuY29uY2F0KGN1cnIpLCBbXSlcbiAgICAuZmlsdGVyKGsgPT4gayAhPT0gdGhpcy5jb25zdHJ1Y3Rvci4kaWQpIC8vIGlkIHNob3VsZCBuZXZlciBiZSBkaXJ0eVxuICAgIC5yZWR1Y2UoKGFjYywgY3VycikgPT4gYWNjLmNvbmNhdChjdXJyKSwgW10pO1xuICB9XG5cbiAgLy8gV0lSSU5HXG5cbiAgJCRjb3B5VmFsdWVzRnJvbShvcHRzID0ge30pIHtcbiAgICBjb25zdCBpZEZpZWxkID0gdGhpcy5jb25zdHJ1Y3Rvci4kaWQgaW4gb3B0cyA/IHRoaXMuY29uc3RydWN0b3IuJGlkIDogJ2lkJztcbiAgICB0aGlzW3RoaXMuY29uc3RydWN0b3IuJGlkXSA9IG9wdHNbaWRGaWVsZF0gfHwgdGhpcy4kaWQ7XG4gICAgdGhpc1skZGlydHldID0gdGhpcy5jb25zdHJ1Y3Rvci5zY2hlbWF0aXplKG9wdHMpO1xuICB9XG5cbiAgJCRob29rVG9QbHVtcCgpIHtcbiAgICBpZiAodGhpc1skdW5zdWJzY3JpYmVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHVuc3Vic2NyaWJlXSA9IHRoaXNbJHBsdW1wXS5zdWJzY3JpYmUodGhpcy5jb25zdHJ1Y3Rvci4kbmFtZSwgdGhpcy4kaWQsICh7IGZpZWxkLCB2YWx1ZSB9KSA9PiB7XG4gICAgICAgIGlmIChmaWVsZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20oeyBbZmllbGRdOiB2YWx1ZSB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgJHN1YnNjcmliZSguLi5hcmdzKSB7XG4gICAgbGV0IGZpZWxkcyA9IFsnYXR0cmlidXRlcyddO1xuICAgIGxldCBjYjtcbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDIpIHtcbiAgICAgIGZpZWxkcyA9IGFyZ3NbMF07XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZmllbGRzKSkge1xuICAgICAgICBmaWVsZHMgPSBbZmllbGRzXTtcbiAgICAgIH1cbiAgICAgIGNiID0gYXJnc1sxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2IgPSBhcmdzWzBdO1xuICAgIH1cbiAgICB0aGlzLiQkaG9va1RvUGx1bXAoKTtcbiAgICB0aGlzWyRwbHVtcF0uc3RyZWFtR2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBmaWVsZHMpXG4gICAgLnN1YnNjcmliZSgodikgPT4ge1xuICAgICAgdGhpcy4kJGZpcmVVcGRhdGUodik7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXNbJHN1YmplY3RdLnN1YnNjcmliZU9uKGNiKTtcbiAgfVxuXG4gICQkcmVzZXREaXJ0eShvcHRzKSB7XG4gICAgY29uc3Qga2V5ID0gb3B0cyB8fCB0aGlzLiRkaXJ0eUZpZWxkcztcbiAgICBjb25zdCBuZXdEaXJ0eSA9IHsgYXR0cmlidXRlczoge30sIHJlbGF0aW9uc2hpcHM6IHt9IH07XG4gICAgY29uc3Qga2V5cyA9IEFycmF5LmlzQXJyYXkoa2V5KSA/IGtleSA6IFtrZXldO1xuICAgIE9iamVjdC5rZXlzKHRoaXNbJGRpcnR5XSkuZm9yRWFjaChzY2hlbWFGaWVsZCA9PiB7XG4gICAgICBmb3IgKGNvbnN0IGZpZWxkIGluIHRoaXNbJGRpcnR5XVtzY2hlbWFGaWVsZF0pIHtcbiAgICAgICAgaWYgKGtleXMuaW5kZXhPZihmaWVsZCkgPCAwKSB7XG4gICAgICAgICAgY29uc3QgdmFsID0gdGhpc1skZGlydHldW3NjaGVtYUZpZWxkXVtmaWVsZF07XG4gICAgICAgICAgbmV3RGlydHlbc2NoZW1hRmllbGRdW2ZpZWxkXSA9IHR5cGVvZiB2YWwgPT09ICdvYmplY3QnID8gbWVyZ2VPcHRpb25zKHt9LCB2YWwpIDogdmFsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpc1skZGlydHldID0gbmV3RGlydHk7XG4gIH1cblxuICAkJGZpcmVVcGRhdGUodikge1xuICAgIGNvbnN0IHVwZGF0ZSA9IHRoaXMuY29uc3RydWN0b3IucmVzb2x2ZUFuZE92ZXJsYXkodGhpc1skZGlydHldLCB2KTtcbiAgICBpZiAodGhpcy4kaWQpIHtcbiAgICAgIHVwZGF0ZS5pZCA9IHRoaXMuJGlkO1xuICAgIH1cbiAgICB0aGlzWyRzdWJqZWN0XS5uZXh0KHVwZGF0ZSk7XG4gIH1cblxuICAkdGVhcmRvd24oKSB7XG4gICAgaWYgKHRoaXNbJHVuc3Vic2NyaWJlXSkge1xuICAgICAgdGhpc1skdW5zdWJzY3JpYmVdLnVuc3Vic2NyaWJlKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gQVBJIE1FVEhPRFNcblxuICAkZ2V0KG9wdHMpIHtcbiAgICAvLyBJZiBvcHRzIGlzIGZhbHN5IChpLmUuLCB1bmRlZmluZWQpLCBnZXQgYXR0cmlidXRlc1xuICAgIC8vIE90aGVyd2lzZSwgZ2V0IHdoYXQgd2FzIHJlcXVlc3RlZCxcbiAgICAvLyB3cmFwcGluZyBpdCBpbiBhIEFycmF5IGlmIGl0IHdhc24ndCBhbHJlYWR5IG9uZVxuICAgIGxldCBrZXlzID0gb3B0cyAmJiAhQXJyYXkuaXNBcnJheShvcHRzKSA/IFtvcHRzXSA6IG9wdHM7XG4gICAgaWYgKGtleXMgJiYga2V5cy5pbmRleE9mKCRhbGwpID49IDApIHtcbiAgICAgIGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwcyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZ2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXlzKVxuICAgIC50aGVuKHNlbGYgPT4ge1xuICAgICAgaWYgKCFzZWxmICYmIHRoaXMuJGRpcnR5RmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHNjaGVtYXRpemVkID0gdGhpcy5jb25zdHJ1Y3Rvci5zY2hlbWF0aXplKHNlbGYgfHwge30pO1xuICAgICAgICBjb25zdCB3aXRoRGlydHkgPSB0aGlzLmNvbnN0cnVjdG9yLnJlc29sdmVBbmRPdmVybGF5KHRoaXNbJGRpcnR5XSwgc2NoZW1hdGl6ZWQpO1xuICAgICAgICBjb25zdCByZXRWYWwgPSB0aGlzLmNvbnN0cnVjdG9yLmFwcGx5RGVmYXVsdHMod2l0aERpcnR5KTtcbiAgICAgICAgcmV0VmFsLnR5cGUgPSB0aGlzLiRuYW1lO1xuICAgICAgICByZXRWYWwuaWQgPSB0aGlzLiRpZDtcbiAgICAgICAgcmV0dXJuIHJldFZhbDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIFRPRE86IFNob3VsZCAkc2F2ZSB1bHRpbWF0ZWx5IHJldHVybiB0aGlzLiRnZXQoKT9cbiAgJHNhdmUob3B0cykge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRzIHx8IHRoaXMuJGZpZWxkcztcbiAgICBjb25zdCBrZXlzID0gQXJyYXkuaXNBcnJheShvcHRpb25zKSA/IG9wdGlvbnMgOiBbb3B0aW9uc107XG5cbiAgICAvLyBEZWVwIGNvcHkgZGlydHkgY2FjaGUsIGZpbHRlcmluZyBvdXQga2V5cyB0aGF0IGFyZSBub3QgaW4gb3B0c1xuICAgIGNvbnN0IHVwZGF0ZSA9IE9iamVjdC5rZXlzKHRoaXNbJGRpcnR5XSkubWFwKHNjaGVtYUZpZWxkID0+IHtcbiAgICAgIGNvbnN0IHZhbHVlID0gT2JqZWN0LmtleXModGhpc1skZGlydHldW3NjaGVtYUZpZWxkXSlcbiAgICAgICAgLmZpbHRlcihrZXkgPT4ga2V5cy5pbmRleE9mKGtleSkgPj0gMClcbiAgICAgICAgLm1hcChrZXkgPT4ge1xuICAgICAgICAgIHJldHVybiB7IFtrZXldOiB0aGlzWyRkaXJ0eV1bc2NoZW1hRmllbGRdW2tleV0gfTtcbiAgICAgICAgfSlcbiAgICAgICAgLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBPYmplY3QuYXNzaWduKGFjYywgY3VyciksIHt9KTtcblxuICAgICAgcmV0dXJuIHsgW3NjaGVtYUZpZWxkXTogdmFsdWUgfTtcbiAgICB9KS5yZWR1Y2UoKGFjYywgY3VycikgPT4gT2JqZWN0LmFzc2lnbihhY2MsIGN1cnIpLCB7fSk7XG5cbiAgICBpZiAodGhpcy4kaWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdXBkYXRlW3RoaXMuY29uc3RydWN0b3IuJGlkXSA9IHRoaXMuJGlkO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzWyRwbHVtcF0uc2F2ZSh0aGlzLmNvbnN0cnVjdG9yLCB1cGRhdGUpXG4gICAgLnRoZW4oKHVwZGF0ZWQpID0+IHtcbiAgICAgIHRoaXMuJCRyZXNldERpcnR5KG9wdHMpO1xuICAgICAgaWYgKHVwZGF0ZWQuaWQpIHtcbiAgICAgICAgdGhpc1t0aGlzLmNvbnN0cnVjdG9yLiRpZF0gPSB1cGRhdGVkLmlkO1xuICAgICAgfVxuICAgICAgLy8gdGhpcy4kJGZpcmVVcGRhdGUodXBkYXRlZCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9KTtcbiAgfVxuXG4gICRzZXQodXBkYXRlKSB7XG4gICAgLy8gRmlsdGVyIG91dCBub24tYXR0cmlidXRlIGtleXNcbiAgICBjb25zdCBzYW5pdGl6ZWQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiB1cGRhdGUpIHtcbiAgICAgIGlmIChrZXkgaW4gdGhpcy4kc2NoZW1hLmF0dHJpYnV0ZXMpIHtcbiAgICAgICAgc2FuaXRpemVkW2tleV0gPSB1cGRhdGVba2V5XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgS2V5ICR7a2V5fSBpcyBub3QgYW4gYXR0cmlidXRlcyBvZiAke3RoaXMuJG5hbWV9YCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbShzYW5pdGl6ZWQpO1xuICAgIC8vIHRoaXMuJCRmaXJlVXBkYXRlKHNhbml0aXplZCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAkZGVsZXRlKCkge1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZGVsZXRlKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkKVxuICAgIC50aGVuKGRhdGEgPT4gZGF0YS5tYXAodGhpcy5jb25zdHJ1Y3Rvci5zY2hlbWF0aXplKSk7XG4gIH1cblxuICAkcmVzdChvcHRzKSB7XG4gICAgY29uc3QgcmVzdE9wdHMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICBvcHRzLFxuICAgICAge1xuICAgICAgICB1cmw6IGAvJHt0aGlzLmNvbnN0cnVjdG9yLiRuYW1lfS8ke3RoaXMuJGlkfS8ke29wdHMudXJsfWAsXG4gICAgICB9XG4gICAgKTtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLnJlc3RSZXF1ZXN0KHJlc3RPcHRzKS50aGVuKGRhdGEgPT4gdGhpcy5jb25zdHJ1Y3Rvci5zY2hlbWF0aXplKGRhdGEpKTtcbiAgfVxuXG4gICRhZGQoa2V5LCBpdGVtLCBleHRyYXMpIHtcbiAgICBpZiAodGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHNba2V5XSkge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIGlmIChpdGVtLiRpZCkge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtW3RoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW2tleV0udHlwZS4kc2lkZXNba2V5XS5vdGhlci5maWVsZF07XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICBpZiAoIShrZXkgaW4gdGhpc1skZGlydHldLnJlbGF0aW9uc2hpcHMpKSB7XG4gICAgICAgICAgdGhpc1skZGlydHldLnJlbGF0aW9uc2hpcHNba2V5XSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzW2tleV0ucHVzaCh7XG4gICAgICAgICAgb3A6ICdhZGQnLFxuICAgICAgICAgIGRhdGE6IE9iamVjdC5hc3NpZ24oeyBpZCB9LCB7IG1ldGE6IGV4dHJhcyB9KSxcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHRoaXMuJCRmaXJlVXBkYXRlKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gYWRkZWQgdG8gaGFzTWFueScpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJyk7XG4gICAgfVxuICB9XG5cbiAgJG1vZGlmeVJlbGF0aW9uc2hpcChrZXksIGl0ZW0sIGV4dHJhcykge1xuICAgIGlmIChrZXkgaW4gdGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHMpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICBpZiAoIShrZXkgaW4gdGhpc1skZGlydHldLnJlbGF0aW9uc2hpcHMpKSB7XG4gICAgICAgICAgdGhpc1skZGlydHldLnJlbGF0aW9uc2hpcHNba2V5XSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzW2tleV0ucHVzaCh7XG4gICAgICAgICAgb3A6ICdtb2RpZnknLFxuICAgICAgICAgIGRhdGE6IE9iamVjdC5hc3NpZ24oeyBpZCB9LCB7IG1ldGE6IGV4dHJhcyB9KSxcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHRoaXMuJCRmaXJlVXBkYXRlKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gYWRkZWQgdG8gaGFzTWFueScpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJyk7XG4gICAgfVxuICB9XG5cbiAgJHJlbW92ZShrZXksIGl0ZW0pIHtcbiAgICBpZiAoa2V5IGluIHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgaWYgKCEoa2V5IGluIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzKSkge1xuICAgICAgICAgIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzW2tleV0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwc1trZXldLnB1c2goe1xuICAgICAgICAgIG9wOiAncmVtb3ZlJyxcbiAgICAgICAgICBkYXRhOiB7IGlkIH0sXG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aGlzLiQkZmlyZVVwZGF0ZSgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBpdGVtICRyZW1vdmVkIGZyb20gaGFzTWFueScpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCAkcmVtb3ZlIGV4Y2VwdCBmcm9tIGhhc01hbnkgZmllbGQnKTtcbiAgICB9XG4gIH1cbn1cblxuTW9kZWwuZnJvbUpTT04gPSBmdW5jdGlvbiBmcm9tSlNPTihqc29uKSB7XG4gIHRoaXMuJGlkID0ganNvbi4kaWQgfHwgJ2lkJztcbiAgdGhpcy4kbmFtZSA9IGpzb24uJG5hbWU7XG4gIHRoaXMuJGluY2x1ZGUgPSBqc29uLiRpbmNsdWRlO1xuICB0aGlzLiRzY2hlbWEgPSB7XG4gICAgYXR0cmlidXRlczogbWVyZ2VPcHRpb25zKGpzb24uJHNjaGVtYS5hdHRyaWJ1dGVzKSxcbiAgICByZWxhdGlvbnNoaXBzOiB7fSxcbiAgfTtcbiAgZm9yIChjb25zdCByZWwgaW4ganNvbi4kc2NoZW1hLnJlbGF0aW9uc2hpcHMpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBndWFyZC1mb3ItaW5cbiAgICB0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxdID0ge307XG4gICAgY2xhc3MgRHluYW1pY1JlbGF0aW9uc2hpcCBleHRlbmRzIFJlbGF0aW9uc2hpcCB7fVxuICAgIER5bmFtaWNSZWxhdGlvbnNoaXAuZnJvbUpTT04oanNvbi4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsXSk7XG4gICAgdGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsXS50eXBlID0gRHluYW1pY1JlbGF0aW9uc2hpcDtcbiAgfVxufTtcblxuTW9kZWwudG9KU09OID0gZnVuY3Rpb24gdG9KU09OKCkge1xuICBjb25zdCByZXRWYWwgPSB7XG4gICAgJGlkOiB0aGlzLiRpZCxcbiAgICAkbmFtZTogdGhpcy4kbmFtZSxcbiAgICAkaW5jbHVkZTogdGhpcy4kaW5jbHVkZSxcbiAgICAkc2NoZW1hOiB7IGF0dHJpYnV0ZXM6IHRoaXMuJHNjaGVtYS5hdHRyaWJ1dGVzLCByZWxhdGlvbnNoaXBzOiB7fSB9LFxuICB9O1xuICBmb3IgKGNvbnN0IHJlbCBpbiB0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwcykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGd1YXJkLWZvci1pblxuICAgIHJldFZhbC4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsXSA9IHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbF0udHlwZS50b0pTT04oKTtcbiAgfVxuICByZXR1cm4gcmV0VmFsO1xufTtcblxuTW9kZWwuJHJlc3QgPSBmdW5jdGlvbiAkcmVzdChwbHVtcCwgb3B0cykge1xuICBjb25zdCByZXN0T3B0cyA9IE9iamVjdC5hc3NpZ24oXG4gICAge30sXG4gICAgb3B0cyxcbiAgICB7XG4gICAgICB1cmw6IGAvJHt0aGlzLiRuYW1lfS8ke29wdHMudXJsfWAsXG4gICAgfVxuICApO1xuICByZXR1cm4gcGx1bXAucmVzdFJlcXVlc3QocmVzdE9wdHMpO1xufTtcblxuLy8gU0NIRU1BIEZVTkNUSU9OU1xuXG5Nb2RlbC5hZGREZWx0YSA9IGZ1bmN0aW9uIGFkZERlbHRhKHJlbE5hbWUsIHJlbGF0aW9uc2hpcCkge1xuICByZXR1cm4gcmVsYXRpb25zaGlwLm1hcChyZWwgPT4ge1xuICAgIGNvbnN0IHJlbFNjaGVtYSA9IHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnR5cGUuJHNpZGVzW3JlbE5hbWVdO1xuICAgIGNvbnN0IHNjaGVtYXRpemVkID0geyBvcDogJ2FkZCcsIGRhdGE6IHsgaWQ6IHJlbFtyZWxTY2hlbWEub3RoZXIuZmllbGRdIH0gfTtcbiAgICBmb3IgKGNvbnN0IHJlbEZpZWxkIGluIHJlbCkge1xuICAgICAgaWYgKCEocmVsRmllbGQgPT09IHJlbFNjaGVtYS5zZWxmLmZpZWxkIHx8IHJlbEZpZWxkID09PSByZWxTY2hlbWEub3RoZXIuZmllbGQpKSB7XG4gICAgICAgIHNjaGVtYXRpemVkLmRhdGFbcmVsRmllbGRdID0gcmVsW3JlbEZpZWxkXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNjaGVtYXRpemVkO1xuICB9KTtcbn07XG5cbk1vZGVsLmFwcGx5RGVmYXVsdHMgPSBmdW5jdGlvbiBhcHBseURlZmF1bHRzKHYpIHtcbiAgY29uc3QgcmV0VmFsID0gbWVyZ2VPcHRpb25zKHt9LCB2KTtcbiAgZm9yIChjb25zdCBhdHRyIGluIHRoaXMuJHNjaGVtYS5hdHRyaWJ1dGVzKSB7XG4gICAgaWYgKCdkZWZhdWx0JyBpbiB0aGlzLiRzY2hlbWEuYXR0cmlidXRlc1thdHRyXSAmJiAhKGF0dHIgaW4gcmV0VmFsLmF0dHJpYnV0ZXMpKSB7XG4gICAgICByZXRWYWwuYXR0cmlidXRlc1thdHRyXSA9IHRoaXMuJHNjaGVtYS5hdHRyaWJ1dGVzW2F0dHJdLmRlZmF1bHQ7XG4gICAgfVxuICB9XG4gIE9iamVjdC5rZXlzKHRoaXMuJHNjaGVtYSkuZmlsdGVyKGsgPT4gayAhPT0gJyRpZCcpXG4gIC5mb3JFYWNoKHNjaGVtYUZpZWxkID0+IHtcbiAgICBmb3IgKGNvbnN0IGZpZWxkIGluIHRoaXMuJHNjaGVtYVtzY2hlbWFGaWVsZF0pIHtcbiAgICAgIGlmICghKGZpZWxkIGluIHJldFZhbFtzY2hlbWFGaWVsZF0pKSB7XG4gICAgICAgIGlmICgnZGVmYXVsdCcgaW4gdGhpcy4kc2NoZW1hW3NjaGVtYUZpZWxkXVtmaWVsZF0pIHtcbiAgICAgICAgICByZXRWYWxbc2NoZW1hRmllbGRdW2ZpZWxkXSA9IHRoaXMuJHNjaGVtYVtzY2hlbWFGaWVsZF1bZmllbGRdLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcmV0VmFsO1xufTtcblxuTW9kZWwuYXBwbHlEZWx0YSA9IGZ1bmN0aW9uIGFwcGx5RGVsdGEoY3VycmVudCwgZGVsdGEpIHtcbiAgaWYgKGRlbHRhLm9wID09PSAnYWRkJyB8fCBkZWx0YS5vcCA9PT0gJ21vZGlmeScpIHtcbiAgICBjb25zdCByZXRWYWwgPSBtZXJnZU9wdGlvbnMoe30sIGN1cnJlbnQsIGRlbHRhLmRhdGEpO1xuICAgIHJldHVybiByZXRWYWw7XG4gIH0gZWxzZSBpZiAoZGVsdGEub3AgPT09ICdyZW1vdmUnKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gY3VycmVudDtcbiAgfVxufTtcblxuTW9kZWwuYXNzaWduID0gZnVuY3Rpb24gYXNzaWduKG9wdHMpIHtcbiAgY29uc3Qgc2NoZW1hdGl6ZWQgPSB0aGlzLnNjaGVtYXRpemUob3B0cywgeyBpbmNsdWRlSWQ6IHRydWUgfSk7XG4gIGNvbnN0IHJldFZhbCA9IHRoaXMuYXBwbHlEZWZhdWx0cyhzY2hlbWF0aXplZCk7XG4gIE9iamVjdC5rZXlzKHRoaXMuJHNjaGVtYSkuZmlsdGVyKGsgPT4gayAhPT0gJyRpZCcpXG4gIC5mb3JFYWNoKHNjaGVtYUZpZWxkID0+IHtcbiAgICBmb3IgKGNvbnN0IGZpZWxkIGluIHRoaXMuJHNjaGVtYVtzY2hlbWFGaWVsZF0pIHtcbiAgICAgIGlmICghKGZpZWxkIGluIHJldFZhbFtzY2hlbWFGaWVsZF0pKSB7XG4gICAgICAgIHJldFZhbFtzY2hlbWFGaWVsZF1bZmllbGRdID0gc2NoZW1hRmllbGQgPT09ICdyZWxhdGlvbnNoaXBzJyA/IFtdIDogbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXRWYWwudHlwZSA9IHRoaXMuJG5hbWU7XG4gIHJldHVybiByZXRWYWw7XG59O1xuXG5Nb2RlbC5yZXNvbHZlQW5kT3ZlcmxheSA9IGZ1bmN0aW9uIHJlc29sdmVBbmRPdmVybGF5KHVwZGF0ZSwgYmFzZSA9IHsgYXR0cmlidXRlczoge30sIHJlbGF0aW9uc2hpcHM6IHt9IH0pIHtcbiAgY29uc3QgYXR0cmlidXRlcyA9IG1lcmdlT3B0aW9ucyh7fSwgYmFzZS5hdHRyaWJ1dGVzLCB1cGRhdGUuYXR0cmlidXRlcyk7XG4gIGNvbnN0IGJhc2VJc1Jlc29sdmVkID0gT2JqZWN0LmtleXMoYmFzZS5yZWxhdGlvbnNoaXBzKS5tYXAocmVsTmFtZSA9PiB7XG4gICAgcmV0dXJuIGJhc2UucmVsYXRpb25zaGlwc1tyZWxOYW1lXS5tYXAocmVsID0+ICEoJ29wJyBpbiByZWwpKS5yZWR1Y2UoKGFjYywgY3VycikgPT4gYWNjICYmIGN1cnIsIHRydWUpO1xuICB9KS5yZWR1Y2UoKGFjYywgY3VycikgPT4gYWNjICYmIGN1cnIsIHRydWUpO1xuICBjb25zdCByZXNvbHZlZEJhc2VSZWxzID0gYmFzZUlzUmVzb2x2ZWQgPyBiYXNlLnJlbGF0aW9uc2hpcHMgOiB0aGlzLnJlc29sdmVSZWxhdGlvbnNoaXBzKGJhc2UucmVsYXRpb25zaGlwcyk7XG4gIGNvbnN0IHJlc29sdmVkUmVsYXRpb25zaGlwcyA9IHRoaXMucmVzb2x2ZVJlbGF0aW9uc2hpcHModXBkYXRlLnJlbGF0aW9uc2hpcHMsIHJlc29sdmVkQmFzZVJlbHMpO1xuICByZXR1cm4geyBhdHRyaWJ1dGVzLCByZWxhdGlvbnNoaXBzOiByZXNvbHZlZFJlbGF0aW9uc2hpcHMgfTtcbn07XG5cbk1vZGVsLnJlc29sdmVSZWxhdGlvbnNoaXBzID0gZnVuY3Rpb24gcmVzb2x2ZVJlbGF0aW9uc2hpcHMoZGVsdGFzLCBiYXNlID0ge30pIHtcbiAgY29uc3QgdXBkYXRlcyA9IE9iamVjdC5rZXlzKGRlbHRhcykubWFwKHJlbE5hbWUgPT4ge1xuICAgIGNvbnN0IHJlc29sdmVkID0gdGhpcy5yZXNvbHZlUmVsYXRpb25zaGlwKGRlbHRhc1tyZWxOYW1lXSwgYmFzZVtyZWxOYW1lXSk7XG4gICAgcmV0dXJuIHsgW3JlbE5hbWVdOiByZXNvbHZlZCB9O1xuICB9KVxuICAucmVkdWNlKChhY2MsIGN1cnIpID0+IG1lcmdlT3B0aW9ucyhhY2MsIGN1cnIpLCB7fSk7XG4gIHJldHVybiBtZXJnZU9wdGlvbnMoe30sIGJhc2UsIHVwZGF0ZXMpO1xufTtcblxuTW9kZWwucmVzb2x2ZVJlbGF0aW9uc2hpcCA9IGZ1bmN0aW9uIHJlc29sdmVSZWxhdGlvbnNoaXAoZGVsdGFzLCBiYXNlID0gW10pIHtcbiAgLy8gSW5kZXggY3VycmVudCByZWxhdGlvbnNoaXBzIGJ5IElEIGZvciBlZmZpY2llbnQgbW9kaWZpY2F0aW9uXG4gIGNvbnN0IHVwZGF0ZXMgPSBiYXNlLm1hcChyZWwgPT4ge1xuICAgIHJldHVybiB7IFtyZWwuaWRdOiByZWwgfTtcbiAgfSkucmVkdWNlKChhY2MsIGN1cnIpID0+IG1lcmdlT3B0aW9ucyhhY2MsIGN1cnIpLCB7fSk7XG5cbiAgLy8gQXBwbHkgZGVsdGFzIG9uIHRvcCBvZiB1cGRhdGVzXG4gIGRlbHRhcy5mb3JFYWNoKGRlbHRhID0+IHtcbiAgICBjb25zdCBjaGlsZElkID0gZGVsdGEuZGF0YSA/IGRlbHRhLmRhdGEuaWQgOiBkZWx0YS5pZDtcbiAgICB1cGRhdGVzW2NoaWxkSWRdID0gZGVsdGEub3AgPyB0aGlzLmFwcGx5RGVsdGEodXBkYXRlc1tjaGlsZElkXSwgZGVsdGEpIDogZGVsdGE7XG4gIH0pO1xuXG4gIC8vIFJlZHVjZSB1cGRhdGVzIGJhY2sgaW50byBsaXN0LCBvbWl0dGluZyB1bmRlZmluZWRzXG4gIHJldHVybiBPYmplY3Qua2V5cyh1cGRhdGVzKVxuICAgIC5tYXAoaWQgPT4gdXBkYXRlc1tpZF0pXG4gICAgLmZpbHRlcihyZWwgPT4gcmVsICE9PSB1bmRlZmluZWQpXG4gICAgLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBhY2MuY29uY2F0KGN1cnIpLCBbXSk7XG59O1xuXG5Nb2RlbC5jYWNoZVNldCA9IGZ1bmN0aW9uIGNhY2hlU2V0KHN0b3JlLCBrZXksIHZhbHVlKSB7XG4gIGlmICh0aGlzLiQkc3RvcmVDYWNoZS5nZXQoc3RvcmUpID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLiQkc3RvcmVDYWNoZS5zZXQoc3RvcmUsIHt9KTtcbiAgfVxuICB0aGlzLiQkc3RvcmVDYWNoZS5nZXQoc3RvcmUpW2tleV0gPSB2YWx1ZTtcbn07XG5cbk1vZGVsLmNhY2hlR2V0ID0gZnVuY3Rpb24gY2FjaGVHZXQoc3RvcmUsIGtleSkge1xuICByZXR1cm4gKHRoaXMuJCRzdG9yZUNhY2hlLmdldChzdG9yZSkgfHwge30pW2tleV07XG59O1xuXG5Nb2RlbC5zY2hlbWF0aXplID0gZnVuY3Rpb24gc2NoZW1hdGl6ZSh2ID0ge30sIG9wdHMgPSB7IGluY2x1ZGVJZDogZmFsc2UgfSkge1xuICBjb25zdCByZXRWYWwgPSB7fTtcbiAgaWYgKG9wdHMuaW5jbHVkZUlkKSB7XG4gICAgcmV0VmFsLmlkID0gdGhpcy4kaWQgaW4gdiA/IHZbdGhpcy4kaWRdIDogdi5pZDtcbiAgfVxuICBPYmplY3Qua2V5cyh0aGlzLiRzY2hlbWEpLmZpbHRlcihrID0+IGsgIT09ICckaWQnKVxuICAuZm9yRWFjaChzY2hlbWFGaWVsZCA9PiB7XG4gICAgaWYgKHNjaGVtYUZpZWxkIGluIHYpIHtcbiAgICAgIHJldFZhbFtzY2hlbWFGaWVsZF0gPSBtZXJnZU9wdGlvbnMoe30sIHZbc2NoZW1hRmllbGRdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCEoc2NoZW1hRmllbGQgaW4gcmV0VmFsKSkge1xuICAgICAgICByZXRWYWxbc2NoZW1hRmllbGRdID0ge307XG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IGZpZWxkIGluIHRoaXMuJHNjaGVtYVtzY2hlbWFGaWVsZF0pIHtcbiAgICAgICAgaWYgKGZpZWxkIGluIHYpIHtcbiAgICAgICAgICByZXRWYWxbc2NoZW1hRmllbGRdW2ZpZWxkXSA9IHNjaGVtYUZpZWxkID09PSAncmVsYXRpb25zaGlwcycgPyB0aGlzLmFkZERlbHRhKGZpZWxkLCB2W2ZpZWxkXSkgOiB2W2ZpZWxkXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZXRWYWw7XG59O1xuXG4vLyBNRVRBREFUQVxuXG5Nb2RlbC4kJHN0b3JlQ2FjaGUgPSBuZXcgTWFwKCk7XG5cbk1vZGVsLiRpZCA9ICdpZCc7XG5Nb2RlbC4kbmFtZSA9ICdCYXNlJztcbk1vZGVsLiRzY2hlbWEgPSB7XG4gICRpZDogJ2lkJyxcbiAgYXR0cmlidXRlczoge30sXG4gIHJlbGF0aW9uc2hpcHM6IHt9LFxufTtcbk1vZGVsLiRpbmNsdWRlZCA9IFtdO1xuIl19
