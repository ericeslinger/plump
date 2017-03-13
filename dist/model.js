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
      // wrapping the request in a Array if it wasn't already one
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
  }, {
    key: '$bulkGet',
    value: function $bulkGet() {
      return this[$plump].bulkGet(this.constructor, this.$id);
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
        return (0, _mergeOptions2.default)(acc, curr);
      }, { id: this.$id, type: this.constructor.$name });

      return this[$plump].save(this.constructor, update).then(function (updated) {
        _this5.$$resetDirty(opts);
        if (updated.id) {
          _this5[_this5.constructor.$id] = updated.id;
        }
        // this.$$fireUpdate(updated);
        return _this5.$get();
      });
    }
  }, {
    key: '$set',
    value: function $set(update) {
      var _this6 = this;

      var flat = update.attributes || update;
      // Filter out non-attribute keys
      var sanitized = Object.keys(flat).filter(function (k) {
        return k in _this6.$schema.attributes;
      }).map(function (k) {
        return _defineProperty({}, k, flat[k]);
      }).reduce(function (acc, curr) {
        return (0, _mergeOptions2.default)(acc, curr);
      }, {});

      this.$$copyValuesFrom(sanitized);
      // this.$$fireUpdate(sanitized);
      return this;
    }
  }, {
    key: '$delete',
    value: function $delete() {
      var _this7 = this;

      return this[$plump].delete(this.constructor, this.$id).then(function (data) {
        return data.map(_this7.constructor.schematize);
      });
    }
  }, {
    key: '$rest',
    value: function $rest(opts) {
      var _this8 = this;

      var restOpts = Object.assign({}, opts, {
        url: '/' + this.constructor.$name + '/' + this.$id + '/' + opts.url
      });
      return this[$plump].restRequest(restOpts).then(function (data) {
        return _this8.constructor.schematize(data);
      });
    }
  }, {
    key: '$add',
    value: function $add(key, item, extras) {
      if (this.$schema.relationships[key]) {
        var id = 0;
        if (typeof item === 'number') {
          id = item;
        } else if (item.id) {
          id = item.id;
        } else {
          id = item[this.$schema.relationships[key].type.$sides[key].other.field];
        }
        if (typeof id === 'number' && id >= 1) {
          var data = { id: id, meta: extras || item.meta };
          this[$dirty].relationships[key] = this[$dirty].relationships[key] || [];
          this[$dirty].relationships[key].push({
            op: 'add',
            data: data
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
            data: Object.assign({ id: id }, { meta: extras || item.meta })
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
      var _this9 = this;

      return Object.keys(this[$dirty]).map(function (k) {
        return Object.keys(_this9[$dirty][k]);
      }).reduce(function (acc, curr) {
        return acc.concat(curr);
      }, []).filter(function (k) {
        return k !== _this9.constructor.$id;
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
  var _this11 = this;

  return relationship.map(function (rel) {
    var relSchema = _this11.$schema.relationships[relName].type.$sides[relName];
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
  var _this12 = this;

  var retVal = (0, _mergeOptions2.default)({}, v);
  for (var attr in this.$schema.attributes) {
    if ('default' in this.$schema.attributes[attr] && !(attr in retVal.attributes)) {
      retVal.attributes[attr] = this.$schema.attributes[attr].default;
    }
  }
  Object.keys(this.$schema).filter(function (k) {
    return k[0] !== '$';
  }).forEach(function (schemaField) {
    for (var field in _this12.$schema[schemaField]) {
      if (!(field in retVal[schemaField])) {
        if ('default' in _this12.$schema[schemaField][field]) {
          retVal[schemaField][field] = _this12.$schema[schemaField][field].default;
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
  var _this13 = this;

  var schematized = this.schematize(opts, { includeId: true });
  var retVal = this.applyDefaults(schematized);
  Object.keys(this.$schema).filter(function (k) {
    return k[0] !== '$';
  }).forEach(function (schemaField) {
    for (var field in _this13.$schema[schemaField]) {
      if (!(field in retVal[schemaField])) {
        retVal[schemaField][field] = schemaField === 'relationships' ? [] : null;
      }
    }
  });
  retVal.type = this.$name;
  return retVal;
};

Model.cacheGet = function cacheGet(store, key) {
  return (this.$$storeCache.get(store) || {})[key];
};

Model.cacheSet = function cacheSet(store, key, value) {
  if (this.$$storeCache.get(store) === undefined) {
    this.$$storeCache.set(store, {});
  }
  this.$$storeCache.get(store)[key] = value;
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
  var _this14 = this;

  var base = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var updates = Object.keys(deltas).map(function (relName) {
    var resolved = _this14.resolveRelationship(deltas[relName], base[relName]);
    return _defineProperty({}, relName, resolved);
  }).reduce(function (acc, curr) {
    return (0, _mergeOptions2.default)(acc, curr);
  }, {});
  return (0, _mergeOptions2.default)({}, base, updates);
};

Model.resolveRelationship = function resolveRelationship(deltas) {
  var _this15 = this;

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
    updates[childId] = delta.op ? _this15.applyDelta(updates[childId], delta) : delta;
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

Model.schematize = function schematize() {
  var _this16 = this;

  var v = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { includeId: false };

  var retVal = {};
  if (opts.includeId) {
    retVal.id = this.$id in v ? v[this.$id] : v.id;
  }
  Object.keys(this.$schema).filter(function (k) {
    return k[0] !== '$';
  }).forEach(function (schemaField) {
    if (schemaField in v) {
      retVal[schemaField] = (0, _mergeOptions2.default)({}, v[schemaField]);
    } else {
      retVal[schemaField] = retVal[schemaField] || {};
      for (var field in _this16.$schema[schemaField]) {
        if (field in v) {
          retVal[schemaField][field] = schemaField === 'relationships' ? _this16.addDelta(field, v[field]) : v[field];
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
  $name: 'base',
  $id: 'id',
  attributes: {},
  relationships: {}
};
Model.$included = [];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRkaXJ0eSIsIlN5bWJvbCIsIiRwbHVtcCIsIiR1bnN1YnNjcmliZSIsIiRzdWJqZWN0IiwiJGFsbCIsIk1vZGVsIiwib3B0cyIsInBsdW1wIiwiRXJyb3IiLCJhdHRyaWJ1dGVzIiwicmVsYXRpb25zaGlwcyIsIm5leHQiLCIkJGNvcHlWYWx1ZXNGcm9tIiwiaWRGaWVsZCIsImNvbnN0cnVjdG9yIiwiJGlkIiwic2NoZW1hdGl6ZSIsInVuZGVmaW5lZCIsInN1YnNjcmliZSIsIiRuYW1lIiwiZmllbGQiLCJ2YWx1ZSIsImZpZWxkcyIsImNiIiwibGVuZ3RoIiwiQXJyYXkiLCJpc0FycmF5IiwiJCRob29rVG9QbHVtcCIsInN0cmVhbUdldCIsInYiLCIkJGZpcmVVcGRhdGUiLCJzdWJzY3JpYmVPbiIsImtleSIsIiRkaXJ0eUZpZWxkcyIsIm5ld0RpcnR5Iiwia2V5cyIsIk9iamVjdCIsImZvckVhY2giLCJzY2hlbWFGaWVsZCIsImluZGV4T2YiLCJ2YWwiLCJ1cGRhdGUiLCJyZXNvbHZlQW5kT3ZlcmxheSIsImlkIiwidW5zdWJzY3JpYmUiLCIkc2NoZW1hIiwiZ2V0IiwidGhlbiIsInNlbGYiLCJzY2hlbWF0aXplZCIsIndpdGhEaXJ0eSIsInJldFZhbCIsImFwcGx5RGVmYXVsdHMiLCJ0eXBlIiwiYnVsa0dldCIsIm9wdGlvbnMiLCIkZmllbGRzIiwibWFwIiwiZmlsdGVyIiwicmVkdWNlIiwiYWNjIiwiY3VyciIsImFzc2lnbiIsInNhdmUiLCJ1cGRhdGVkIiwiJCRyZXNldERpcnR5IiwiJGdldCIsImZsYXQiLCJzYW5pdGl6ZWQiLCJrIiwiZGVsZXRlIiwiZGF0YSIsInJlc3RPcHRzIiwidXJsIiwicmVzdFJlcXVlc3QiLCJpdGVtIiwiZXh0cmFzIiwiJHNpZGVzIiwib3RoZXIiLCJtZXRhIiwicHVzaCIsIm9wIiwiY29uY2F0IiwiZnJvbUpTT04iLCJqc29uIiwiJGluY2x1ZGUiLCJyZWwiLCJEeW5hbWljUmVsYXRpb25zaGlwIiwidG9KU09OIiwiJHJlc3QiLCJhZGREZWx0YSIsInJlbE5hbWUiLCJyZWxhdGlvbnNoaXAiLCJyZWxTY2hlbWEiLCJyZWxGaWVsZCIsImF0dHIiLCJkZWZhdWx0IiwiYXBwbHlEZWx0YSIsImN1cnJlbnQiLCJkZWx0YSIsImluY2x1ZGVJZCIsImNhY2hlR2V0Iiwic3RvcmUiLCIkJHN0b3JlQ2FjaGUiLCJjYWNoZVNldCIsInNldCIsImJhc2UiLCJiYXNlSXNSZXNvbHZlZCIsInJlc29sdmVkQmFzZVJlbHMiLCJyZXNvbHZlUmVsYXRpb25zaGlwcyIsInJlc29sdmVkUmVsYXRpb25zaGlwcyIsImRlbHRhcyIsInVwZGF0ZXMiLCJyZXNvbHZlZCIsInJlc29sdmVSZWxhdGlvbnNoaXAiLCJjaGlsZElkIiwiTWFwIiwiJGluY2x1ZGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBRUE7Ozs7Ozs7Ozs7OztBQUNBLElBQU1BLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUMsU0FBU0QsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNRSxlQUFlRixPQUFPLGNBQVAsQ0FBckI7QUFDQSxJQUFNRyxXQUFXSCxPQUFPLFVBQVAsQ0FBakI7QUFDTyxJQUFNSSxzQkFBT0osT0FBTyxNQUFQLENBQWI7O0FBRVA7QUFDQTs7SUFFYUssSyxXQUFBQSxLO0FBQ1gsaUJBQVlDLElBQVosRUFBa0JDLEtBQWxCLEVBQXlCO0FBQUE7O0FBQ3ZCLFFBQUlBLEtBQUosRUFBVztBQUNULFdBQUtOLE1BQUwsSUFBZU0sS0FBZjtBQUNELEtBRkQsTUFFTztBQUNMLFlBQU0sSUFBSUMsS0FBSixDQUFVLDhDQUFWLENBQU47QUFDRDtBQUNEO0FBQ0EsU0FBS1QsTUFBTCxJQUFlO0FBQ2JVLGtCQUFZLEVBREMsRUFDRztBQUNoQkMscUJBQWUsRUFGRixFQUFmO0FBSUEsU0FBS1AsUUFBTCxJQUFpQix5QkFBakI7QUFDQSxTQUFLQSxRQUFMLEVBQWVRLElBQWYsQ0FBb0IsRUFBcEI7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QUFhLEVBQWIsRUFBaUJULEVBQUVTLFdBQUYsQ0FBakIsQ0FBdEI7QUFDRCxLQUZELE1BRU87QUFDTGEsYUFBT2IsV0FBUCxJQUFzQmEsT0FBT2IsV0FBUCxLQUF1QixFQUE3QztBQUNBLFdBQUssSUFBTWxCLEtBQVgsSUFBb0IsUUFBS3lCLE9BQUwsQ0FBYVAsV0FBYixDQUFwQixFQUErQztBQUM3QyxZQUFJbEIsU0FBU1MsQ0FBYixFQUFnQjtBQUNkc0IsaUJBQU9iLFdBQVAsRUFBb0JsQixLQUFwQixJQUE2QmtCLGdCQUFnQixlQUFoQixHQUFrQyxRQUFLb0QsUUFBTCxDQUFjdEUsS0FBZCxFQUFxQlMsRUFBRVQsS0FBRixDQUFyQixDQUFsQyxHQUFtRVMsRUFBRVQsS0FBRixDQUFoRztBQUNEO0FBQ0Y7QUFDRjtBQUNGLEdBYkQ7QUFjQSxTQUFPK0IsTUFBUDtBQUNELENBcEJEOztBQXNCQTs7QUFFQTlDLE1BQU1rRyxZQUFOLEdBQXFCLElBQUlhLEdBQUosRUFBckI7O0FBRUEvRyxNQUFNVSxHQUFOLEdBQVksSUFBWjtBQUNBVixNQUFNYyxLQUFOLEdBQWMsTUFBZDtBQUNBZCxNQUFNd0MsT0FBTixHQUFnQjtBQUNkMUIsU0FBTyxNQURPO0FBRWRKLE9BQUssSUFGUztBQUdkTixjQUFZLEVBSEU7QUFJZEMsaUJBQWU7QUFKRCxDQUFoQjtBQU1BTCxNQUFNZ0gsU0FBTixHQUFrQixFQUFsQiIsImZpbGUiOiJtb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtZXJnZU9wdGlvbnMgZnJvbSAnbWVyZ2Utb3B0aW9ucyc7XG5pbXBvcnQgeyBCZWhhdmlvclN1YmplY3QgfSBmcm9tICdyeGpzL1J4JztcblxuaW1wb3J0IHsgUmVsYXRpb25zaGlwIH0gZnJvbSAnLi9yZWxhdGlvbnNoaXAnO1xuY29uc3QgJGRpcnR5ID0gU3ltYm9sKCckZGlydHknKTtcbmNvbnN0ICRwbHVtcCA9IFN5bWJvbCgnJHBsdW1wJyk7XG5jb25zdCAkdW5zdWJzY3JpYmUgPSBTeW1ib2woJyR1bnN1YnNjcmliZScpO1xuY29uc3QgJHN1YmplY3QgPSBTeW1ib2woJyRzdWJqZWN0Jyk7XG5leHBvcnQgY29uc3QgJGFsbCA9IFN5bWJvbCgnJGFsbCcpO1xuXG4vLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIGVycm9yIGV2ZW50cyBvcmlnaW5hdGUgKHN0b3JhZ2Ugb3IgbW9kZWwpXG4vLyBhbmQgd2hvIGtlZXBzIGEgcm9sbC1iYWNrYWJsZSBkZWx0YVxuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzLCBwbHVtcCkge1xuICAgIGlmIChwbHVtcCkge1xuICAgICAgdGhpc1skcGx1bXBdID0gcGx1bXA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNvbnN0cnVjdCBQbHVtcCBtb2RlbCB3aXRob3V0IGEgUGx1bXAnKTtcbiAgICB9XG4gICAgLy8gVE9ETzogRGVmaW5lIERlbHRhIGludGVyZmFjZVxuICAgIHRoaXNbJGRpcnR5XSA9IHtcbiAgICAgIGF0dHJpYnV0ZXM6IHt9LCAvLyBTaW1wbGUga2V5LXZhbHVlXG4gICAgICByZWxhdGlvbnNoaXBzOiB7fSwgLy8gcmVsTmFtZTogRGVsdGFbXVxuICAgIH07XG4gICAgdGhpc1skc3ViamVjdF0gPSBuZXcgQmVoYXZpb3JTdWJqZWN0KCk7XG4gICAgdGhpc1skc3ViamVjdF0ubmV4dCh7fSk7XG4gICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKG9wdHMpO1xuICAgIC8vIHRoaXMuJCRmaXJlVXBkYXRlKG9wdHMpO1xuICB9XG5cbiAgLy8gQ09OVkVOSUVOQ0UgQUNDRVNTT1JTXG5cbiAgZ2V0ICRuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLiRuYW1lO1xuICB9XG5cbiAgZ2V0ICRpZCgpIHtcbiAgICByZXR1cm4gdGhpc1t0aGlzLmNvbnN0cnVjdG9yLiRpZF07XG4gIH1cblxuICBnZXQgJGZpZWxkcygpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy4kc2NoZW1hLmF0dHJpYnV0ZXMpXG4gICAgLmNvbmNhdChPYmplY3Qua2V5cyh0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwcykpO1xuICB9XG5cbiAgZ2V0ICRzY2hlbWEoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuJHNjaGVtYTtcbiAgfVxuXG4gIGdldCAkZGlydHlGaWVsZHMoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXNbJGRpcnR5XSlcbiAgICAubWFwKGsgPT4gT2JqZWN0LmtleXModGhpc1skZGlydHldW2tdKSlcbiAgICAucmVkdWNlKChhY2MsIGN1cnIpID0+IGFjYy5jb25jYXQoY3VyciksIFtdKVxuICAgIC5maWx0ZXIoayA9PiBrICE9PSB0aGlzLmNvbnN0cnVjdG9yLiRpZCkgLy8gaWQgc2hvdWxkIG5ldmVyIGJlIGRpcnR5XG4gICAgLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBhY2MuY29uY2F0KGN1cnIpLCBbXSk7XG4gIH1cblxuICAvLyBXSVJJTkdcblxuICAkJGNvcHlWYWx1ZXNGcm9tKG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IGlkRmllbGQgPSB0aGlzLmNvbnN0cnVjdG9yLiRpZCBpbiBvcHRzID8gdGhpcy5jb25zdHJ1Y3Rvci4kaWQgOiAnaWQnO1xuICAgIHRoaXNbdGhpcy5jb25zdHJ1Y3Rvci4kaWRdID0gb3B0c1tpZEZpZWxkXSB8fCB0aGlzLiRpZDtcbiAgICB0aGlzWyRkaXJ0eV0gPSB0aGlzLmNvbnN0cnVjdG9yLnNjaGVtYXRpemUob3B0cyk7XG4gIH1cblxuICAkJGhvb2tUb1BsdW1wKCkge1xuICAgIGlmICh0aGlzWyR1bnN1YnNjcmliZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skdW5zdWJzY3JpYmVdID0gdGhpc1skcGx1bXBdLnN1YnNjcmliZSh0aGlzLmNvbnN0cnVjdG9yLiRuYW1lLCB0aGlzLiRpZCwgKHsgZmllbGQsIHZhbHVlIH0pID0+IHtcbiAgICAgICAgaWYgKGZpZWxkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh7IFtmaWVsZF06IHZhbHVlIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAkc3Vic2NyaWJlKC4uLmFyZ3MpIHtcbiAgICBsZXQgZmllbGRzID0gWydhdHRyaWJ1dGVzJ107XG4gICAgbGV0IGNiO1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMikge1xuICAgICAgZmllbGRzID0gYXJnc1swXTtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShmaWVsZHMpKSB7XG4gICAgICAgIGZpZWxkcyA9IFtmaWVsZHNdO1xuICAgICAgfVxuICAgICAgY2IgPSBhcmdzWzFdO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYiA9IGFyZ3NbMF07XG4gICAgfVxuICAgIHRoaXMuJCRob29rVG9QbHVtcCgpO1xuICAgIHRoaXNbJHBsdW1wXS5zdHJlYW1HZXQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGZpZWxkcylcbiAgICAuc3Vic2NyaWJlKCh2KSA9PiB7XG4gICAgICB0aGlzLiQkZmlyZVVwZGF0ZSh2KTtcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpc1skc3ViamVjdF0uc3Vic2NyaWJlT24oY2IpO1xuICB9XG5cbiAgJCRyZXNldERpcnR5KG9wdHMpIHtcbiAgICBjb25zdCBrZXkgPSBvcHRzIHx8IHRoaXMuJGRpcnR5RmllbGRzO1xuICAgIGNvbnN0IG5ld0RpcnR5ID0geyBhdHRyaWJ1dGVzOiB7fSwgcmVsYXRpb25zaGlwczoge30gfTtcbiAgICBjb25zdCBrZXlzID0gQXJyYXkuaXNBcnJheShrZXkpID8ga2V5IDogW2tleV07XG4gICAgT2JqZWN0LmtleXModGhpc1skZGlydHldKS5mb3JFYWNoKHNjaGVtYUZpZWxkID0+IHtcbiAgICAgIGZvciAoY29uc3QgZmllbGQgaW4gdGhpc1skZGlydHldW3NjaGVtYUZpZWxkXSkge1xuICAgICAgICBpZiAoa2V5cy5pbmRleE9mKGZpZWxkKSA8IDApIHtcbiAgICAgICAgICBjb25zdCB2YWwgPSB0aGlzWyRkaXJ0eV1bc2NoZW1hRmllbGRdW2ZpZWxkXTtcbiAgICAgICAgICBuZXdEaXJ0eVtzY2hlbWFGaWVsZF1bZmllbGRdID0gdHlwZW9mIHZhbCA9PT0gJ29iamVjdCcgPyBtZXJnZU9wdGlvbnMoe30sIHZhbCkgOiB2YWw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzWyRkaXJ0eV0gPSBuZXdEaXJ0eTtcbiAgfVxuXG4gICQkZmlyZVVwZGF0ZSh2KSB7XG4gICAgY29uc3QgdXBkYXRlID0gdGhpcy5jb25zdHJ1Y3Rvci5yZXNvbHZlQW5kT3ZlcmxheSh0aGlzWyRkaXJ0eV0sIHYpO1xuICAgIGlmICh0aGlzLiRpZCkge1xuICAgICAgdXBkYXRlLmlkID0gdGhpcy4kaWQ7XG4gICAgfVxuICAgIHRoaXNbJHN1YmplY3RdLm5leHQodXBkYXRlKTtcbiAgfVxuXG4gICR0ZWFyZG93bigpIHtcbiAgICBpZiAodGhpc1skdW5zdWJzY3JpYmVdKSB7XG4gICAgICB0aGlzWyR1bnN1YnNjcmliZV0udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cblxuICAvLyBBUEkgTUVUSE9EU1xuXG4gICRnZXQob3B0cykge1xuICAgIC8vIElmIG9wdHMgaXMgZmFsc3kgKGkuZS4sIHVuZGVmaW5lZCksIGdldCBhdHRyaWJ1dGVzXG4gICAgLy8gT3RoZXJ3aXNlLCBnZXQgd2hhdCB3YXMgcmVxdWVzdGVkLFxuICAgIC8vIHdyYXBwaW5nIHRoZSByZXF1ZXN0IGluIGEgQXJyYXkgaWYgaXQgd2Fzbid0IGFscmVhZHkgb25lXG4gICAgbGV0IGtleXMgPSBvcHRzICYmICFBcnJheS5pc0FycmF5KG9wdHMpID8gW29wdHNdIDogb3B0cztcbiAgICBpZiAoa2V5cyAmJiBrZXlzLmluZGV4T2YoJGFsbCkgPj0gMCkge1xuICAgICAga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5nZXQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleXMpXG4gICAgLnRoZW4oc2VsZiA9PiB7XG4gICAgICBpZiAoIXNlbGYgJiYgdGhpcy4kZGlydHlGaWVsZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgc2NoZW1hdGl6ZWQgPSB0aGlzLmNvbnN0cnVjdG9yLnNjaGVtYXRpemUoc2VsZiB8fCB7fSk7XG4gICAgICAgIGNvbnN0IHdpdGhEaXJ0eSA9IHRoaXMuY29uc3RydWN0b3IucmVzb2x2ZUFuZE92ZXJsYXkodGhpc1skZGlydHldLCBzY2hlbWF0aXplZCk7XG4gICAgICAgIGNvbnN0IHJldFZhbCA9IHRoaXMuY29uc3RydWN0b3IuYXBwbHlEZWZhdWx0cyh3aXRoRGlydHkpO1xuICAgICAgICByZXRWYWwudHlwZSA9IHRoaXMuJG5hbWU7XG4gICAgICAgIHJldFZhbC5pZCA9IHRoaXMuJGlkO1xuICAgICAgICByZXR1cm4gcmV0VmFsO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgJGJ1bGtHZXQoKSB7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5idWxrR2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkKTtcbiAgfVxuXG4gIC8vIFRPRE86IFNob3VsZCAkc2F2ZSB1bHRpbWF0ZWx5IHJldHVybiB0aGlzLiRnZXQoKT9cbiAgJHNhdmUob3B0cykge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRzIHx8IHRoaXMuJGZpZWxkcztcbiAgICBjb25zdCBrZXlzID0gQXJyYXkuaXNBcnJheShvcHRpb25zKSA/IG9wdGlvbnMgOiBbb3B0aW9uc107XG5cbiAgICAvLyBEZWVwIGNvcHkgZGlydHkgY2FjaGUsIGZpbHRlcmluZyBvdXQga2V5cyB0aGF0IGFyZSBub3QgaW4gb3B0c1xuICAgIGNvbnN0IHVwZGF0ZSA9IE9iamVjdC5rZXlzKHRoaXNbJGRpcnR5XSkubWFwKHNjaGVtYUZpZWxkID0+IHtcbiAgICAgIGNvbnN0IHZhbHVlID0gT2JqZWN0LmtleXModGhpc1skZGlydHldW3NjaGVtYUZpZWxkXSlcbiAgICAgICAgLmZpbHRlcihrZXkgPT4ga2V5cy5pbmRleE9mKGtleSkgPj0gMClcbiAgICAgICAgLm1hcChrZXkgPT4ge1xuICAgICAgICAgIHJldHVybiB7IFtrZXldOiB0aGlzWyRkaXJ0eV1bc2NoZW1hRmllbGRdW2tleV0gfTtcbiAgICAgICAgfSlcbiAgICAgICAgLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBPYmplY3QuYXNzaWduKGFjYywgY3VyciksIHt9KTtcblxuICAgICAgcmV0dXJuIHsgW3NjaGVtYUZpZWxkXTogdmFsdWUgfTtcbiAgICB9KVxuICAgIC5yZWR1Y2UoXG4gICAgICAoYWNjLCBjdXJyKSA9PiBtZXJnZU9wdGlvbnMoYWNjLCBjdXJyKSxcbiAgICAgIHsgaWQ6IHRoaXMuJGlkLCB0eXBlOiB0aGlzLmNvbnN0cnVjdG9yLiRuYW1lIH0pO1xuXG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5zYXZlKHRoaXMuY29uc3RydWN0b3IsIHVwZGF0ZSlcbiAgICAudGhlbigodXBkYXRlZCkgPT4ge1xuICAgICAgdGhpcy4kJHJlc2V0RGlydHkob3B0cyk7XG4gICAgICBpZiAodXBkYXRlZC5pZCkge1xuICAgICAgICB0aGlzW3RoaXMuY29uc3RydWN0b3IuJGlkXSA9IHVwZGF0ZWQuaWQ7XG4gICAgICB9XG4gICAgICAvLyB0aGlzLiQkZmlyZVVwZGF0ZSh1cGRhdGVkKTtcbiAgICAgIHJldHVybiB0aGlzLiRnZXQoKTtcbiAgICB9KTtcbiAgfVxuXG4gICRzZXQodXBkYXRlKSB7XG4gICAgY29uc3QgZmxhdCA9IHVwZGF0ZS5hdHRyaWJ1dGVzIHx8IHVwZGF0ZTtcbiAgICAvLyBGaWx0ZXIgb3V0IG5vbi1hdHRyaWJ1dGUga2V5c1xuICAgIGNvbnN0IHNhbml0aXplZCA9IE9iamVjdC5rZXlzKGZsYXQpXG4gICAgICAuZmlsdGVyKGsgPT4gayBpbiB0aGlzLiRzY2hlbWEuYXR0cmlidXRlcylcbiAgICAgIC5tYXAoayA9PiB7IHJldHVybiB7IFtrXTogZmxhdFtrXSB9OyB9KVxuICAgICAgLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBtZXJnZU9wdGlvbnMoYWNjLCBjdXJyKSwge30pO1xuXG4gICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHNhbml0aXplZCk7XG4gICAgLy8gdGhpcy4kJGZpcmVVcGRhdGUoc2FuaXRpemVkKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gICRkZWxldGUoKSB7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5kZWxldGUodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQpXG4gICAgLnRoZW4oZGF0YSA9PiBkYXRhLm1hcCh0aGlzLmNvbnN0cnVjdG9yLnNjaGVtYXRpemUpKTtcbiAgfVxuXG4gICRyZXN0KG9wdHMpIHtcbiAgICBjb25zdCByZXN0T3B0cyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIG9wdHMsXG4gICAgICB7XG4gICAgICAgIHVybDogYC8ke3RoaXMuY29uc3RydWN0b3IuJG5hbWV9LyR7dGhpcy4kaWR9LyR7b3B0cy51cmx9YCxcbiAgICAgIH1cbiAgICApO1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0ucmVzdFJlcXVlc3QocmVzdE9wdHMpLnRoZW4oZGF0YSA9PiB0aGlzLmNvbnN0cnVjdG9yLnNjaGVtYXRpemUoZGF0YSkpO1xuICB9XG5cbiAgJGFkZChrZXksIGl0ZW0sIGV4dHJhcykge1xuICAgIGlmICh0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwc1trZXldKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2UgaWYgKGl0ZW0uaWQpIHtcbiAgICAgICAgaWQgPSBpdGVtLmlkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtW3RoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW2tleV0udHlwZS4kc2lkZXNba2V5XS5vdGhlci5maWVsZF07XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICBjb25zdCBkYXRhID0geyBpZCwgbWV0YTogZXh0cmFzIHx8IGl0ZW0ubWV0YSB9O1xuICAgICAgICB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwc1trZXldID0gdGhpc1skZGlydHldLnJlbGF0aW9uc2hpcHNba2V5XSB8fCBbXTtcbiAgICAgICAgdGhpc1skZGlydHldLnJlbGF0aW9uc2hpcHNba2V5XS5wdXNoKHtcbiAgICAgICAgICBvcDogJ2FkZCcsXG4gICAgICAgICAgZGF0YSxcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHRoaXMuJCRmaXJlVXBkYXRlKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gYWRkZWQgdG8gaGFzTWFueScpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJyk7XG4gICAgfVxuICB9XG5cbiAgJG1vZGlmeVJlbGF0aW9uc2hpcChrZXksIGl0ZW0sIGV4dHJhcykge1xuICAgIGlmIChrZXkgaW4gdGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHMpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICBpZiAoIShrZXkgaW4gdGhpc1skZGlydHldLnJlbGF0aW9uc2hpcHMpKSB7XG4gICAgICAgICAgdGhpc1skZGlydHldLnJlbGF0aW9uc2hpcHNba2V5XSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzW2tleV0ucHVzaCh7XG4gICAgICAgICAgb3A6ICdtb2RpZnknLFxuICAgICAgICAgIGRhdGE6IE9iamVjdC5hc3NpZ24oeyBpZCB9LCB7IG1ldGE6IGV4dHJhcyB8fCBpdGVtLm1ldGEgfSksXG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aGlzLiQkZmlyZVVwZGF0ZSgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpO1xuICAgIH1cbiAgfVxuXG4gICRyZW1vdmUoa2V5LCBpdGVtKSB7XG4gICAgaWYgKGtleSBpbiB0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwcykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIGlmICghKGtleSBpbiB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwcykpIHtcbiAgICAgICAgICB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwc1trZXldID0gW107XG4gICAgICAgIH1cbiAgICAgICAgdGhpc1skZGlydHldLnJlbGF0aW9uc2hpcHNba2V5XS5wdXNoKHtcbiAgICAgICAgICBvcDogJ3JlbW92ZScsXG4gICAgICAgICAgZGF0YTogeyBpZCB9LFxuICAgICAgICB9KTtcbiAgICAgICAgLy8gdGhpcy4kJGZpcmVVcGRhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSAkcmVtb3ZlZCBmcm9tIGhhc01hbnknKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgJHJlbW92ZSBleGNlcHQgZnJvbSBoYXNNYW55IGZpZWxkJyk7XG4gICAgfVxuICB9XG59XG5cbk1vZGVsLmZyb21KU09OID0gZnVuY3Rpb24gZnJvbUpTT04oanNvbikge1xuICB0aGlzLiRpZCA9IGpzb24uJGlkIHx8ICdpZCc7XG4gIHRoaXMuJG5hbWUgPSBqc29uLiRuYW1lO1xuICB0aGlzLiRpbmNsdWRlID0ganNvbi4kaW5jbHVkZTtcbiAgdGhpcy4kc2NoZW1hID0ge1xuICAgIGF0dHJpYnV0ZXM6IG1lcmdlT3B0aW9ucyhqc29uLiRzY2hlbWEuYXR0cmlidXRlcyksXG4gICAgcmVsYXRpb25zaGlwczoge30sXG4gIH07XG4gIGZvciAoY29uc3QgcmVsIGluIGpzb24uJHNjaGVtYS5yZWxhdGlvbnNoaXBzKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZ3VhcmQtZm9yLWluXG4gICAgdGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsXSA9IHt9O1xuICAgIGNsYXNzIER5bmFtaWNSZWxhdGlvbnNoaXAgZXh0ZW5kcyBSZWxhdGlvbnNoaXAge31cbiAgICBEeW5hbWljUmVsYXRpb25zaGlwLmZyb21KU09OKGpzb24uJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbF0pO1xuICAgIHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbF0udHlwZSA9IER5bmFtaWNSZWxhdGlvbnNoaXA7XG4gIH1cbn07XG5cbk1vZGVsLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTigpIHtcbiAgY29uc3QgcmV0VmFsID0ge1xuICAgICRpZDogdGhpcy4kaWQsXG4gICAgJG5hbWU6IHRoaXMuJG5hbWUsXG4gICAgJGluY2x1ZGU6IHRoaXMuJGluY2x1ZGUsXG4gICAgJHNjaGVtYTogeyBhdHRyaWJ1dGVzOiB0aGlzLiRzY2hlbWEuYXR0cmlidXRlcywgcmVsYXRpb25zaGlwczoge30gfSxcbiAgfTtcbiAgZm9yIChjb25zdCByZWwgaW4gdGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHMpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBndWFyZC1mb3ItaW5cbiAgICByZXRWYWwuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbF0gPSB0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxdLnR5cGUudG9KU09OKCk7XG4gIH1cbiAgcmV0dXJuIHJldFZhbDtcbn07XG5cbk1vZGVsLiRyZXN0ID0gZnVuY3Rpb24gJHJlc3QocGx1bXAsIG9wdHMpIHtcbiAgY29uc3QgcmVzdE9wdHMgPSBPYmplY3QuYXNzaWduKFxuICAgIHt9LFxuICAgIG9wdHMsXG4gICAge1xuICAgICAgdXJsOiBgLyR7dGhpcy4kbmFtZX0vJHtvcHRzLnVybH1gLFxuICAgIH1cbiAgKTtcbiAgcmV0dXJuIHBsdW1wLnJlc3RSZXF1ZXN0KHJlc3RPcHRzKTtcbn07XG5cbi8vIFNDSEVNQSBGVU5DVElPTlNcblxuTW9kZWwuYWRkRGVsdGEgPSBmdW5jdGlvbiBhZGREZWx0YShyZWxOYW1lLCByZWxhdGlvbnNoaXApIHtcbiAgcmV0dXJuIHJlbGF0aW9uc2hpcC5tYXAocmVsID0+IHtcbiAgICBjb25zdCByZWxTY2hlbWEgPSB0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxOYW1lXS50eXBlLiRzaWRlc1tyZWxOYW1lXTtcbiAgICBjb25zdCBzY2hlbWF0aXplZCA9IHsgb3A6ICdhZGQnLCBkYXRhOiB7IGlkOiByZWxbcmVsU2NoZW1hLm90aGVyLmZpZWxkXSB9IH07XG4gICAgZm9yIChjb25zdCByZWxGaWVsZCBpbiByZWwpIHtcbiAgICAgIGlmICghKHJlbEZpZWxkID09PSByZWxTY2hlbWEuc2VsZi5maWVsZCB8fCByZWxGaWVsZCA9PT0gcmVsU2NoZW1hLm90aGVyLmZpZWxkKSkge1xuICAgICAgICBzY2hlbWF0aXplZC5kYXRhW3JlbEZpZWxkXSA9IHJlbFtyZWxGaWVsZF07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzY2hlbWF0aXplZDtcbiAgfSk7XG59O1xuXG5Nb2RlbC5hcHBseURlZmF1bHRzID0gZnVuY3Rpb24gYXBwbHlEZWZhdWx0cyh2KSB7XG4gIGNvbnN0IHJldFZhbCA9IG1lcmdlT3B0aW9ucyh7fSwgdik7XG4gIGZvciAoY29uc3QgYXR0ciBpbiB0aGlzLiRzY2hlbWEuYXR0cmlidXRlcykge1xuICAgIGlmICgnZGVmYXVsdCcgaW4gdGhpcy4kc2NoZW1hLmF0dHJpYnV0ZXNbYXR0cl0gJiYgIShhdHRyIGluIHJldFZhbC5hdHRyaWJ1dGVzKSkge1xuICAgICAgcmV0VmFsLmF0dHJpYnV0ZXNbYXR0cl0gPSB0aGlzLiRzY2hlbWEuYXR0cmlidXRlc1thdHRyXS5kZWZhdWx0O1xuICAgIH1cbiAgfVxuICBPYmplY3Qua2V5cyh0aGlzLiRzY2hlbWEpXG4gIC5maWx0ZXIoayA9PiBrWzBdICE9PSAnJCcpXG4gIC5mb3JFYWNoKHNjaGVtYUZpZWxkID0+IHtcbiAgICBmb3IgKGNvbnN0IGZpZWxkIGluIHRoaXMuJHNjaGVtYVtzY2hlbWFGaWVsZF0pIHtcbiAgICAgIGlmICghKGZpZWxkIGluIHJldFZhbFtzY2hlbWFGaWVsZF0pKSB7XG4gICAgICAgIGlmICgnZGVmYXVsdCcgaW4gdGhpcy4kc2NoZW1hW3NjaGVtYUZpZWxkXVtmaWVsZF0pIHtcbiAgICAgICAgICByZXRWYWxbc2NoZW1hRmllbGRdW2ZpZWxkXSA9IHRoaXMuJHNjaGVtYVtzY2hlbWFGaWVsZF1bZmllbGRdLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcmV0VmFsO1xufTtcblxuTW9kZWwuYXBwbHlEZWx0YSA9IGZ1bmN0aW9uIGFwcGx5RGVsdGEoY3VycmVudCwgZGVsdGEpIHtcbiAgaWYgKGRlbHRhLm9wID09PSAnYWRkJyB8fCBkZWx0YS5vcCA9PT0gJ21vZGlmeScpIHtcbiAgICBjb25zdCByZXRWYWwgPSBtZXJnZU9wdGlvbnMoe30sIGN1cnJlbnQsIGRlbHRhLmRhdGEpO1xuICAgIHJldHVybiByZXRWYWw7XG4gIH0gZWxzZSBpZiAoZGVsdGEub3AgPT09ICdyZW1vdmUnKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gY3VycmVudDtcbiAgfVxufTtcblxuTW9kZWwuYXNzaWduID0gZnVuY3Rpb24gYXNzaWduKG9wdHMpIHtcbiAgY29uc3Qgc2NoZW1hdGl6ZWQgPSB0aGlzLnNjaGVtYXRpemUob3B0cywgeyBpbmNsdWRlSWQ6IHRydWUgfSk7XG4gIGNvbnN0IHJldFZhbCA9IHRoaXMuYXBwbHlEZWZhdWx0cyhzY2hlbWF0aXplZCk7XG4gIE9iamVjdC5rZXlzKHRoaXMuJHNjaGVtYSlcbiAgLmZpbHRlcihrID0+IGtbMF0gIT09ICckJylcbiAgLmZvckVhY2goc2NoZW1hRmllbGQgPT4ge1xuICAgIGZvciAoY29uc3QgZmllbGQgaW4gdGhpcy4kc2NoZW1hW3NjaGVtYUZpZWxkXSkge1xuICAgICAgaWYgKCEoZmllbGQgaW4gcmV0VmFsW3NjaGVtYUZpZWxkXSkpIHtcbiAgICAgICAgcmV0VmFsW3NjaGVtYUZpZWxkXVtmaWVsZF0gPSBzY2hlbWFGaWVsZCA9PT0gJ3JlbGF0aW9uc2hpcHMnID8gW10gOiBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIHJldFZhbC50eXBlID0gdGhpcy4kbmFtZTtcbiAgcmV0dXJuIHJldFZhbDtcbn07XG5cbk1vZGVsLmNhY2hlR2V0ID0gZnVuY3Rpb24gY2FjaGVHZXQoc3RvcmUsIGtleSkge1xuICByZXR1cm4gKHRoaXMuJCRzdG9yZUNhY2hlLmdldChzdG9yZSkgfHwge30pW2tleV07XG59O1xuXG5Nb2RlbC5jYWNoZVNldCA9IGZ1bmN0aW9uIGNhY2hlU2V0KHN0b3JlLCBrZXksIHZhbHVlKSB7XG4gIGlmICh0aGlzLiQkc3RvcmVDYWNoZS5nZXQoc3RvcmUpID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLiQkc3RvcmVDYWNoZS5zZXQoc3RvcmUsIHt9KTtcbiAgfVxuICB0aGlzLiQkc3RvcmVDYWNoZS5nZXQoc3RvcmUpW2tleV0gPSB2YWx1ZTtcbn07XG5cbk1vZGVsLnJlc29sdmVBbmRPdmVybGF5ID0gZnVuY3Rpb24gcmVzb2x2ZUFuZE92ZXJsYXkodXBkYXRlLCBiYXNlID0geyBhdHRyaWJ1dGVzOiB7fSwgcmVsYXRpb25zaGlwczoge30gfSkge1xuICBjb25zdCBhdHRyaWJ1dGVzID0gbWVyZ2VPcHRpb25zKHt9LCBiYXNlLmF0dHJpYnV0ZXMsIHVwZGF0ZS5hdHRyaWJ1dGVzKTtcbiAgY29uc3QgYmFzZUlzUmVzb2x2ZWQgPSBPYmplY3Qua2V5cyhiYXNlLnJlbGF0aW9uc2hpcHMpLm1hcChyZWxOYW1lID0+IHtcbiAgICByZXR1cm4gYmFzZS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLm1hcChyZWwgPT4gISgnb3AnIGluIHJlbCkpLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBhY2MgJiYgY3VyciwgdHJ1ZSk7XG4gIH0pLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBhY2MgJiYgY3VyciwgdHJ1ZSk7XG4gIGNvbnN0IHJlc29sdmVkQmFzZVJlbHMgPSBiYXNlSXNSZXNvbHZlZCA/IGJhc2UucmVsYXRpb25zaGlwcyA6IHRoaXMucmVzb2x2ZVJlbGF0aW9uc2hpcHMoYmFzZS5yZWxhdGlvbnNoaXBzKTtcbiAgY29uc3QgcmVzb2x2ZWRSZWxhdGlvbnNoaXBzID0gdGhpcy5yZXNvbHZlUmVsYXRpb25zaGlwcyh1cGRhdGUucmVsYXRpb25zaGlwcywgcmVzb2x2ZWRCYXNlUmVscyk7XG4gIHJldHVybiB7IGF0dHJpYnV0ZXMsIHJlbGF0aW9uc2hpcHM6IHJlc29sdmVkUmVsYXRpb25zaGlwcyB9O1xufTtcblxuTW9kZWwucmVzb2x2ZVJlbGF0aW9uc2hpcHMgPSBmdW5jdGlvbiByZXNvbHZlUmVsYXRpb25zaGlwcyhkZWx0YXMsIGJhc2UgPSB7fSkge1xuICBjb25zdCB1cGRhdGVzID0gT2JqZWN0LmtleXMoZGVsdGFzKS5tYXAocmVsTmFtZSA9PiB7XG4gICAgY29uc3QgcmVzb2x2ZWQgPSB0aGlzLnJlc29sdmVSZWxhdGlvbnNoaXAoZGVsdGFzW3JlbE5hbWVdLCBiYXNlW3JlbE5hbWVdKTtcbiAgICByZXR1cm4geyBbcmVsTmFtZV06IHJlc29sdmVkIH07XG4gIH0pXG4gIC5yZWR1Y2UoKGFjYywgY3VycikgPT4gbWVyZ2VPcHRpb25zKGFjYywgY3VyciksIHt9KTtcbiAgcmV0dXJuIG1lcmdlT3B0aW9ucyh7fSwgYmFzZSwgdXBkYXRlcyk7XG59O1xuXG5Nb2RlbC5yZXNvbHZlUmVsYXRpb25zaGlwID0gZnVuY3Rpb24gcmVzb2x2ZVJlbGF0aW9uc2hpcChkZWx0YXMsIGJhc2UgPSBbXSkge1xuICAvLyBJbmRleCBjdXJyZW50IHJlbGF0aW9uc2hpcHMgYnkgSUQgZm9yIGVmZmljaWVudCBtb2RpZmljYXRpb25cbiAgY29uc3QgdXBkYXRlcyA9IGJhc2UubWFwKHJlbCA9PiB7XG4gICAgcmV0dXJuIHsgW3JlbC5pZF06IHJlbCB9O1xuICB9KS5yZWR1Y2UoKGFjYywgY3VycikgPT4gbWVyZ2VPcHRpb25zKGFjYywgY3VyciksIHt9KTtcblxuICAvLyBBcHBseSBkZWx0YXMgb24gdG9wIG9mIHVwZGF0ZXNcbiAgZGVsdGFzLmZvckVhY2goZGVsdGEgPT4ge1xuICAgIGNvbnN0IGNoaWxkSWQgPSBkZWx0YS5kYXRhID8gZGVsdGEuZGF0YS5pZCA6IGRlbHRhLmlkO1xuICAgIHVwZGF0ZXNbY2hpbGRJZF0gPSBkZWx0YS5vcCA/IHRoaXMuYXBwbHlEZWx0YSh1cGRhdGVzW2NoaWxkSWRdLCBkZWx0YSkgOiBkZWx0YTtcbiAgfSk7XG5cbiAgLy8gUmVkdWNlIHVwZGF0ZXMgYmFjayBpbnRvIGxpc3QsIG9taXR0aW5nIHVuZGVmaW5lZHNcbiAgcmV0dXJuIE9iamVjdC5rZXlzKHVwZGF0ZXMpXG4gICAgLm1hcChpZCA9PiB1cGRhdGVzW2lkXSlcbiAgICAuZmlsdGVyKHJlbCA9PiByZWwgIT09IHVuZGVmaW5lZClcbiAgICAucmVkdWNlKChhY2MsIGN1cnIpID0+IGFjYy5jb25jYXQoY3VyciksIFtdKTtcbn07XG5cbk1vZGVsLnNjaGVtYXRpemUgPSBmdW5jdGlvbiBzY2hlbWF0aXplKHYgPSB7fSwgb3B0cyA9IHsgaW5jbHVkZUlkOiBmYWxzZSB9KSB7XG4gIGNvbnN0IHJldFZhbCA9IHt9O1xuICBpZiAob3B0cy5pbmNsdWRlSWQpIHtcbiAgICByZXRWYWwuaWQgPSB0aGlzLiRpZCBpbiB2ID8gdlt0aGlzLiRpZF0gOiB2LmlkO1xuICB9XG4gIE9iamVjdC5rZXlzKHRoaXMuJHNjaGVtYSlcbiAgLmZpbHRlcihrID0+IGtbMF0gIT09ICckJylcbiAgLmZvckVhY2goc2NoZW1hRmllbGQgPT4ge1xuICAgIGlmIChzY2hlbWFGaWVsZCBpbiB2KSB7XG4gICAgICByZXRWYWxbc2NoZW1hRmllbGRdID0gbWVyZ2VPcHRpb25zKHt9LCB2W3NjaGVtYUZpZWxkXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldFZhbFtzY2hlbWFGaWVsZF0gPSByZXRWYWxbc2NoZW1hRmllbGRdIHx8IHt9O1xuICAgICAgZm9yIChjb25zdCBmaWVsZCBpbiB0aGlzLiRzY2hlbWFbc2NoZW1hRmllbGRdKSB7XG4gICAgICAgIGlmIChmaWVsZCBpbiB2KSB7XG4gICAgICAgICAgcmV0VmFsW3NjaGVtYUZpZWxkXVtmaWVsZF0gPSBzY2hlbWFGaWVsZCA9PT0gJ3JlbGF0aW9uc2hpcHMnID8gdGhpcy5hZGREZWx0YShmaWVsZCwgdltmaWVsZF0pIDogdltmaWVsZF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcmV0VmFsO1xufTtcblxuLy8gTUVUQURBVEFcblxuTW9kZWwuJCRzdG9yZUNhY2hlID0gbmV3IE1hcCgpO1xuXG5Nb2RlbC4kaWQgPSAnaWQnO1xuTW9kZWwuJG5hbWUgPSAnQmFzZSc7XG5Nb2RlbC4kc2NoZW1hID0ge1xuICAkbmFtZTogJ2Jhc2UnLFxuICAkaWQ6ICdpZCcsXG4gIGF0dHJpYnV0ZXM6IHt9LFxuICByZWxhdGlvbnNoaXBzOiB7fSxcbn07XG5Nb2RlbC4kaW5jbHVkZWQgPSBbXTtcbiJdfQ==
