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
          this[$dirty].relationships[key] = this[$dirty].relationships[key] || [];
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
    return k !== '$id';
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
    return k !== '$id';
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
    return k !== '$id';
  }).forEach(function (schemaField) {
    if (schemaField in v) {
      retVal[schemaField] = (0, _mergeOptions2.default)({}, v[schemaField]);
    } else {
      if (!(schemaField in retVal)) {
        retVal[schemaField] = {};
      }
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
  $id: 'id',
  attributes: {},
  relationships: {}
};
Model.$included = [];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRkaXJ0eSIsIlN5bWJvbCIsIiRwbHVtcCIsIiR1bnN1YnNjcmliZSIsIiRzdWJqZWN0IiwiJGFsbCIsIk1vZGVsIiwib3B0cyIsInBsdW1wIiwiRXJyb3IiLCJhdHRyaWJ1dGVzIiwicmVsYXRpb25zaGlwcyIsIm5leHQiLCIkJGNvcHlWYWx1ZXNGcm9tIiwiaWRGaWVsZCIsImNvbnN0cnVjdG9yIiwiJGlkIiwic2NoZW1hdGl6ZSIsInVuZGVmaW5lZCIsInN1YnNjcmliZSIsIiRuYW1lIiwiZmllbGQiLCJ2YWx1ZSIsImZpZWxkcyIsImNiIiwibGVuZ3RoIiwiQXJyYXkiLCJpc0FycmF5IiwiJCRob29rVG9QbHVtcCIsInN0cmVhbUdldCIsInYiLCIkJGZpcmVVcGRhdGUiLCJzdWJzY3JpYmVPbiIsImtleSIsIiRkaXJ0eUZpZWxkcyIsIm5ld0RpcnR5Iiwia2V5cyIsIk9iamVjdCIsImZvckVhY2giLCJzY2hlbWFGaWVsZCIsImluZGV4T2YiLCJ2YWwiLCJ1cGRhdGUiLCJyZXNvbHZlQW5kT3ZlcmxheSIsImlkIiwidW5zdWJzY3JpYmUiLCIkc2NoZW1hIiwiZ2V0IiwidGhlbiIsInNlbGYiLCJzY2hlbWF0aXplZCIsIndpdGhEaXJ0eSIsInJldFZhbCIsImFwcGx5RGVmYXVsdHMiLCJ0eXBlIiwiYnVsa0dldCIsIm9wdGlvbnMiLCIkZmllbGRzIiwibWFwIiwiZmlsdGVyIiwicmVkdWNlIiwiYWNjIiwiY3VyciIsImFzc2lnbiIsInNhdmUiLCJ1cGRhdGVkIiwiJCRyZXNldERpcnR5IiwiJGdldCIsImZsYXQiLCJzYW5pdGl6ZWQiLCJrIiwiZGVsZXRlIiwiZGF0YSIsInJlc3RPcHRzIiwidXJsIiwicmVzdFJlcXVlc3QiLCJpdGVtIiwiZXh0cmFzIiwiJHNpZGVzIiwib3RoZXIiLCJwdXNoIiwib3AiLCJtZXRhIiwiY29uY2F0IiwiZnJvbUpTT04iLCJqc29uIiwiJGluY2x1ZGUiLCJyZWwiLCJEeW5hbWljUmVsYXRpb25zaGlwIiwidG9KU09OIiwiJHJlc3QiLCJhZGREZWx0YSIsInJlbE5hbWUiLCJyZWxhdGlvbnNoaXAiLCJyZWxTY2hlbWEiLCJyZWxGaWVsZCIsImF0dHIiLCJkZWZhdWx0IiwiYXBwbHlEZWx0YSIsImN1cnJlbnQiLCJkZWx0YSIsImluY2x1ZGVJZCIsImNhY2hlR2V0Iiwic3RvcmUiLCIkJHN0b3JlQ2FjaGUiLCJjYWNoZVNldCIsInNldCIsImJhc2UiLCJiYXNlSXNSZXNvbHZlZCIsInJlc29sdmVkQmFzZVJlbHMiLCJyZXNvbHZlUmVsYXRpb25zaGlwcyIsInJlc29sdmVkUmVsYXRpb25zaGlwcyIsImRlbHRhcyIsInVwZGF0ZXMiLCJyZXNvbHZlZCIsInJlc29sdmVSZWxhdGlvbnNoaXAiLCJjaGlsZElkIiwiTWFwIiwiJGluY2x1ZGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBRUE7Ozs7Ozs7Ozs7OztBQUNBLElBQU1BLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUMsU0FBU0QsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNRSxlQUFlRixPQUFPLGNBQVAsQ0FBckI7QUFDQSxJQUFNRyxXQUFXSCxPQUFPLFVBQVAsQ0FBakI7QUFDTyxJQUFNSSxzQkFBT0osT0FBTyxNQUFQLENBQWI7O0FBRVA7QUFDQTs7SUFFYUssSyxXQUFBQSxLO0FBQ1gsaUJBQVlDLElBQVosRUFBa0JDLEtBQWxCLEVBQXlCO0FBQUE7O0FBQ3ZCLFFBQUlBLEtBQUosRUFBVztBQUNULFdBQUtOLE1BQUwsSUFBZU0sS0FBZjtBQUNELEtBRkQsTUFFTztBQUNMLFlBQU0sSUFBSUMsS0FBSixDQUFVLDhDQUFWLENBQU47QUFDRDtBQUNEO0FBQ0EsU0FBS1QsTUFBTCxJQUFlO0FBQ2JVLGtCQUFZLEVBREMsRUFDRztBQUNoQkMscUJBQWUsRUFGRixFQUFmO0FBSUEsU0FBS1AsUUFBTCxJQUFpQix5QkFBakI7QUFDQSxTQUFLQSxRQUFMLEVBQWVRLElBQWYsQ0FBb0IsRUFBcEI7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QjtBQUNwQnNCLGFBQU9iLFdBQVAsSUFBc0IsNEJBQWEsRUFBYixFQUFpQlQsRUFBRVMsV0FBRixDQUFqQixDQUF0QjtBQUNELEtBRkQsTUFFTztBQUNMLFVBQUksRUFBRUEsZUFBZWEsTUFBakIsQ0FBSixFQUE4QjtBQUM1QkEsZUFBT2IsV0FBUCxJQUFzQixFQUF0QjtBQUNEO0FBQ0QsV0FBSyxJQUFNbEIsS0FBWCxJQUFvQixRQUFLeUIsT0FBTCxDQUFhUCxXQUFiLENBQXBCLEVBQStDO0FBQzdDLFlBQUlsQixTQUFTUyxDQUFiLEVBQWdCO0FBQ2RzQixpQkFBT2IsV0FBUCxFQUFvQmxCLEtBQXBCLElBQTZCa0IsZ0JBQWdCLGVBQWhCLEdBQWtDLFFBQUtvRCxRQUFMLENBQWN0RSxLQUFkLEVBQXFCUyxFQUFFVCxLQUFGLENBQXJCLENBQWxDLEdBQW1FUyxFQUFFVCxLQUFGLENBQWhHO0FBQ0Q7QUFDRjtBQUNGO0FBQ0YsR0FkRDtBQWVBLFNBQU8rQixNQUFQO0FBQ0QsQ0FyQkQ7O0FBdUJBOztBQUVBOUMsTUFBTWtHLFlBQU4sR0FBcUIsSUFBSWEsR0FBSixFQUFyQjs7QUFFQS9HLE1BQU1VLEdBQU4sR0FBWSxJQUFaO0FBQ0FWLE1BQU1jLEtBQU4sR0FBYyxNQUFkO0FBQ0FkLE1BQU13QyxPQUFOLEdBQWdCO0FBQ2Q5QixPQUFLLElBRFM7QUFFZE4sY0FBWSxFQUZFO0FBR2RDLGlCQUFlO0FBSEQsQ0FBaEI7QUFLQUwsTUFBTWdILFNBQU4sR0FBa0IsRUFBbEIiLCJmaWxlIjoibW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbWVyZ2VPcHRpb25zIGZyb20gJ21lcmdlLW9wdGlvbnMnO1xuaW1wb3J0IHsgQmVoYXZpb3JTdWJqZWN0IH0gZnJvbSAncnhqcy9SeCc7XG5cbmltcG9ydCB7IFJlbGF0aW9uc2hpcCB9IGZyb20gJy4vcmVsYXRpb25zaGlwJztcbmNvbnN0ICRkaXJ0eSA9IFN5bWJvbCgnJGRpcnR5Jyk7XG5jb25zdCAkcGx1bXAgPSBTeW1ib2woJyRwbHVtcCcpO1xuY29uc3QgJHVuc3Vic2NyaWJlID0gU3ltYm9sKCckdW5zdWJzY3JpYmUnKTtcbmNvbnN0ICRzdWJqZWN0ID0gU3ltYm9sKCckc3ViamVjdCcpO1xuZXhwb3J0IGNvbnN0ICRhbGwgPSBTeW1ib2woJyRhbGwnKTtcblxuLy8gVE9ETzogZmlndXJlIG91dCB3aGVyZSBlcnJvciBldmVudHMgb3JpZ2luYXRlIChzdG9yYWdlIG9yIG1vZGVsKVxuLy8gYW5kIHdobyBrZWVwcyBhIHJvbGwtYmFja2FibGUgZGVsdGFcblxuZXhwb3J0IGNsYXNzIE1vZGVsIHtcbiAgY29uc3RydWN0b3Iob3B0cywgcGx1bXApIHtcbiAgICBpZiAocGx1bXApIHtcbiAgICAgIHRoaXNbJHBsdW1wXSA9IHBsdW1wO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjb25zdHJ1Y3QgUGx1bXAgbW9kZWwgd2l0aG91dCBhIFBsdW1wJyk7XG4gICAgfVxuICAgIC8vIFRPRE86IERlZmluZSBEZWx0YSBpbnRlcmZhY2VcbiAgICB0aGlzWyRkaXJ0eV0gPSB7XG4gICAgICBhdHRyaWJ1dGVzOiB7fSwgLy8gU2ltcGxlIGtleS12YWx1ZVxuICAgICAgcmVsYXRpb25zaGlwczoge30sIC8vIHJlbE5hbWU6IERlbHRhW11cbiAgICB9O1xuICAgIHRoaXNbJHN1YmplY3RdID0gbmV3IEJlaGF2aW9yU3ViamVjdCgpO1xuICAgIHRoaXNbJHN1YmplY3RdLm5leHQoe30pO1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbShvcHRzKTtcbiAgICAvLyB0aGlzLiQkZmlyZVVwZGF0ZShvcHRzKTtcbiAgfVxuXG4gIC8vIENPTlZFTklFTkNFIEFDQ0VTU09SU1xuXG4gIGdldCAkbmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci4kbmFtZTtcbiAgfVxuXG4gIGdldCAkaWQoKSB7XG4gICAgcmV0dXJuIHRoaXNbdGhpcy5jb25zdHJ1Y3Rvci4kaWRdO1xuICB9XG5cbiAgZ2V0ICRmaWVsZHMoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuJHNjaGVtYS5hdHRyaWJ1dGVzKVxuICAgIC5jb25jYXQoT2JqZWN0LmtleXModGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHMpKTtcbiAgfVxuXG4gIGdldCAkc2NoZW1hKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLiRzY2hlbWE7XG4gIH1cblxuICBnZXQgJGRpcnR5RmllbGRzKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzWyRkaXJ0eV0pXG4gICAgLm1hcChrID0+IE9iamVjdC5rZXlzKHRoaXNbJGRpcnR5XVtrXSkpXG4gICAgLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBhY2MuY29uY2F0KGN1cnIpLCBbXSlcbiAgICAuZmlsdGVyKGsgPT4gayAhPT0gdGhpcy5jb25zdHJ1Y3Rvci4kaWQpIC8vIGlkIHNob3VsZCBuZXZlciBiZSBkaXJ0eVxuICAgIC5yZWR1Y2UoKGFjYywgY3VycikgPT4gYWNjLmNvbmNhdChjdXJyKSwgW10pO1xuICB9XG5cbiAgLy8gV0lSSU5HXG5cbiAgJCRjb3B5VmFsdWVzRnJvbShvcHRzID0ge30pIHtcbiAgICBjb25zdCBpZEZpZWxkID0gdGhpcy5jb25zdHJ1Y3Rvci4kaWQgaW4gb3B0cyA/IHRoaXMuY29uc3RydWN0b3IuJGlkIDogJ2lkJztcbiAgICB0aGlzW3RoaXMuY29uc3RydWN0b3IuJGlkXSA9IG9wdHNbaWRGaWVsZF0gfHwgdGhpcy4kaWQ7XG4gICAgdGhpc1skZGlydHldID0gdGhpcy5jb25zdHJ1Y3Rvci5zY2hlbWF0aXplKG9wdHMpO1xuICB9XG5cbiAgJCRob29rVG9QbHVtcCgpIHtcbiAgICBpZiAodGhpc1skdW5zdWJzY3JpYmVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHVuc3Vic2NyaWJlXSA9IHRoaXNbJHBsdW1wXS5zdWJzY3JpYmUodGhpcy5jb25zdHJ1Y3Rvci4kbmFtZSwgdGhpcy4kaWQsICh7IGZpZWxkLCB2YWx1ZSB9KSA9PiB7XG4gICAgICAgIGlmIChmaWVsZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20oeyBbZmllbGRdOiB2YWx1ZSB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgJHN1YnNjcmliZSguLi5hcmdzKSB7XG4gICAgbGV0IGZpZWxkcyA9IFsnYXR0cmlidXRlcyddO1xuICAgIGxldCBjYjtcbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDIpIHtcbiAgICAgIGZpZWxkcyA9IGFyZ3NbMF07XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZmllbGRzKSkge1xuICAgICAgICBmaWVsZHMgPSBbZmllbGRzXTtcbiAgICAgIH1cbiAgICAgIGNiID0gYXJnc1sxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2IgPSBhcmdzWzBdO1xuICAgIH1cbiAgICB0aGlzLiQkaG9va1RvUGx1bXAoKTtcbiAgICB0aGlzWyRwbHVtcF0uc3RyZWFtR2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBmaWVsZHMpXG4gICAgLnN1YnNjcmliZSgodikgPT4ge1xuICAgICAgdGhpcy4kJGZpcmVVcGRhdGUodik7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXNbJHN1YmplY3RdLnN1YnNjcmliZU9uKGNiKTtcbiAgfVxuXG4gICQkcmVzZXREaXJ0eShvcHRzKSB7XG4gICAgY29uc3Qga2V5ID0gb3B0cyB8fCB0aGlzLiRkaXJ0eUZpZWxkcztcbiAgICBjb25zdCBuZXdEaXJ0eSA9IHsgYXR0cmlidXRlczoge30sIHJlbGF0aW9uc2hpcHM6IHt9IH07XG4gICAgY29uc3Qga2V5cyA9IEFycmF5LmlzQXJyYXkoa2V5KSA/IGtleSA6IFtrZXldO1xuICAgIE9iamVjdC5rZXlzKHRoaXNbJGRpcnR5XSkuZm9yRWFjaChzY2hlbWFGaWVsZCA9PiB7XG4gICAgICBmb3IgKGNvbnN0IGZpZWxkIGluIHRoaXNbJGRpcnR5XVtzY2hlbWFGaWVsZF0pIHtcbiAgICAgICAgaWYgKGtleXMuaW5kZXhPZihmaWVsZCkgPCAwKSB7XG4gICAgICAgICAgY29uc3QgdmFsID0gdGhpc1skZGlydHldW3NjaGVtYUZpZWxkXVtmaWVsZF07XG4gICAgICAgICAgbmV3RGlydHlbc2NoZW1hRmllbGRdW2ZpZWxkXSA9IHR5cGVvZiB2YWwgPT09ICdvYmplY3QnID8gbWVyZ2VPcHRpb25zKHt9LCB2YWwpIDogdmFsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpc1skZGlydHldID0gbmV3RGlydHk7XG4gIH1cblxuICAkJGZpcmVVcGRhdGUodikge1xuICAgIGNvbnN0IHVwZGF0ZSA9IHRoaXMuY29uc3RydWN0b3IucmVzb2x2ZUFuZE92ZXJsYXkodGhpc1skZGlydHldLCB2KTtcbiAgICBpZiAodGhpcy4kaWQpIHtcbiAgICAgIHVwZGF0ZS5pZCA9IHRoaXMuJGlkO1xuICAgIH1cbiAgICB0aGlzWyRzdWJqZWN0XS5uZXh0KHVwZGF0ZSk7XG4gIH1cblxuICAkdGVhcmRvd24oKSB7XG4gICAgaWYgKHRoaXNbJHVuc3Vic2NyaWJlXSkge1xuICAgICAgdGhpc1skdW5zdWJzY3JpYmVdLnVuc3Vic2NyaWJlKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gQVBJIE1FVEhPRFNcblxuICAkZ2V0KG9wdHMpIHtcbiAgICAvLyBJZiBvcHRzIGlzIGZhbHN5IChpLmUuLCB1bmRlZmluZWQpLCBnZXQgYXR0cmlidXRlc1xuICAgIC8vIE90aGVyd2lzZSwgZ2V0IHdoYXQgd2FzIHJlcXVlc3RlZCxcbiAgICAvLyB3cmFwcGluZyB0aGUgcmVxdWVzdCBpbiBhIEFycmF5IGlmIGl0IHdhc24ndCBhbHJlYWR5IG9uZVxuICAgIGxldCBrZXlzID0gb3B0cyAmJiAhQXJyYXkuaXNBcnJheShvcHRzKSA/IFtvcHRzXSA6IG9wdHM7XG4gICAgaWYgKGtleXMgJiYga2V5cy5pbmRleE9mKCRhbGwpID49IDApIHtcbiAgICAgIGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwcyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZ2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXlzKVxuICAgIC50aGVuKHNlbGYgPT4ge1xuICAgICAgaWYgKCFzZWxmICYmIHRoaXMuJGRpcnR5RmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHNjaGVtYXRpemVkID0gdGhpcy5jb25zdHJ1Y3Rvci5zY2hlbWF0aXplKHNlbGYgfHwge30pO1xuICAgICAgICBjb25zdCB3aXRoRGlydHkgPSB0aGlzLmNvbnN0cnVjdG9yLnJlc29sdmVBbmRPdmVybGF5KHRoaXNbJGRpcnR5XSwgc2NoZW1hdGl6ZWQpO1xuICAgICAgICBjb25zdCByZXRWYWwgPSB0aGlzLmNvbnN0cnVjdG9yLmFwcGx5RGVmYXVsdHMod2l0aERpcnR5KTtcbiAgICAgICAgcmV0VmFsLnR5cGUgPSB0aGlzLiRuYW1lO1xuICAgICAgICByZXRWYWwuaWQgPSB0aGlzLiRpZDtcbiAgICAgICAgcmV0dXJuIHJldFZhbDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICRidWxrR2V0KCkge1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0uYnVsa0dldCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCk7XG4gIH1cblxuICAvLyBUT0RPOiBTaG91bGQgJHNhdmUgdWx0aW1hdGVseSByZXR1cm4gdGhpcy4kZ2V0KCk/XG4gICRzYXZlKG9wdHMpIHtcbiAgICBjb25zdCBvcHRpb25zID0gb3B0cyB8fCB0aGlzLiRmaWVsZHM7XG4gICAgY29uc3Qga2V5cyA9IEFycmF5LmlzQXJyYXkob3B0aW9ucykgPyBvcHRpb25zIDogW29wdGlvbnNdO1xuXG4gICAgLy8gRGVlcCBjb3B5IGRpcnR5IGNhY2hlLCBmaWx0ZXJpbmcgb3V0IGtleXMgdGhhdCBhcmUgbm90IGluIG9wdHNcbiAgICBjb25zdCB1cGRhdGUgPSBPYmplY3Qua2V5cyh0aGlzWyRkaXJ0eV0pLm1hcChzY2hlbWFGaWVsZCA9PiB7XG4gICAgICBjb25zdCB2YWx1ZSA9IE9iamVjdC5rZXlzKHRoaXNbJGRpcnR5XVtzY2hlbWFGaWVsZF0pXG4gICAgICAgIC5maWx0ZXIoa2V5ID0+IGtleXMuaW5kZXhPZihrZXkpID49IDApXG4gICAgICAgIC5tYXAoa2V5ID0+IHtcbiAgICAgICAgICByZXR1cm4geyBba2V5XTogdGhpc1skZGlydHldW3NjaGVtYUZpZWxkXVtrZXldIH07XG4gICAgICAgIH0pXG4gICAgICAgIC5yZWR1Y2UoKGFjYywgY3VycikgPT4gT2JqZWN0LmFzc2lnbihhY2MsIGN1cnIpLCB7fSk7XG5cbiAgICAgIHJldHVybiB7IFtzY2hlbWFGaWVsZF06IHZhbHVlIH07XG4gICAgfSkucmVkdWNlKChhY2MsIGN1cnIpID0+IE9iamVjdC5hc3NpZ24oYWNjLCBjdXJyKSwge30pO1xuXG4gICAgaWYgKHRoaXMuJGlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHVwZGF0ZVt0aGlzLmNvbnN0cnVjdG9yLiRpZF0gPSB0aGlzLiRpZDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLnNhdmUodGhpcy5jb25zdHJ1Y3RvciwgdXBkYXRlKVxuICAgIC50aGVuKCh1cGRhdGVkKSA9PiB7XG4gICAgICB0aGlzLiQkcmVzZXREaXJ0eShvcHRzKTtcbiAgICAgIGlmICh1cGRhdGVkLmlkKSB7XG4gICAgICAgIHRoaXNbdGhpcy5jb25zdHJ1Y3Rvci4kaWRdID0gdXBkYXRlZC5pZDtcbiAgICAgIH1cbiAgICAgIC8vIHRoaXMuJCRmaXJlVXBkYXRlKHVwZGF0ZWQpO1xuICAgICAgcmV0dXJuIHRoaXMuJGdldCgpO1xuICAgIH0pO1xuICB9XG5cbiAgJHNldCh1cGRhdGUpIHtcbiAgICBjb25zdCBmbGF0ID0gdXBkYXRlLmF0dHJpYnV0ZXMgfHwgdXBkYXRlO1xuICAgIC8vIEZpbHRlciBvdXQgbm9uLWF0dHJpYnV0ZSBrZXlzXG4gICAgY29uc3Qgc2FuaXRpemVkID0gT2JqZWN0LmtleXMoZmxhdClcbiAgICAgIC5maWx0ZXIoayA9PiBrIGluIHRoaXMuJHNjaGVtYS5hdHRyaWJ1dGVzKVxuICAgICAgLm1hcChrID0+IHsgcmV0dXJuIHsgW2tdOiBmbGF0W2tdIH07IH0pXG4gICAgICAucmVkdWNlKChhY2MsIGN1cnIpID0+IG1lcmdlT3B0aW9ucyhhY2MsIGN1cnIpLCB7fSk7XG5cbiAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20oc2FuaXRpemVkKTtcbiAgICAvLyB0aGlzLiQkZmlyZVVwZGF0ZShzYW5pdGl6ZWQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgJGRlbGV0ZSgpIHtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLmRlbGV0ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZClcbiAgICAudGhlbihkYXRhID0+IGRhdGEubWFwKHRoaXMuY29uc3RydWN0b3Iuc2NoZW1hdGl6ZSkpO1xuICB9XG5cbiAgJHJlc3Qob3B0cykge1xuICAgIGNvbnN0IHJlc3RPcHRzID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAgb3B0cyxcbiAgICAgIHtcbiAgICAgICAgdXJsOiBgLyR7dGhpcy5jb25zdHJ1Y3Rvci4kbmFtZX0vJHt0aGlzLiRpZH0vJHtvcHRzLnVybH1gLFxuICAgICAgfVxuICAgICk7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5yZXN0UmVxdWVzdChyZXN0T3B0cykudGhlbihkYXRhID0+IHRoaXMuY29uc3RydWN0b3Iuc2NoZW1hdGl6ZShkYXRhKSk7XG4gIH1cblxuICAkYWRkKGtleSwgaXRlbSwgZXh0cmFzKSB7XG4gICAgaWYgKHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW2tleV0pIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSBpZiAoaXRlbS5pZCkge1xuICAgICAgICBpZCA9IGl0ZW0uaWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW1bdGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHNba2V5XS50eXBlLiRzaWRlc1trZXldLm90aGVyLmZpZWxkXTtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzW2tleV0gPSB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwc1trZXldIHx8IFtdO1xuICAgICAgICB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwc1trZXldLnB1c2goe1xuICAgICAgICAgIG9wOiAnYWRkJyxcbiAgICAgICAgICBkYXRhOiBPYmplY3QuYXNzaWduKHsgaWQgfSwgeyBtZXRhOiBleHRyYXMgfSksXG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aGlzLiQkZmlyZVVwZGF0ZSgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpO1xuICAgIH1cbiAgfVxuXG4gICRtb2RpZnlSZWxhdGlvbnNoaXAoa2V5LCBpdGVtLCBleHRyYXMpIHtcbiAgICBpZiAoa2V5IGluIHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgaWYgKCEoa2V5IGluIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzKSkge1xuICAgICAgICAgIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzW2tleV0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwc1trZXldLnB1c2goe1xuICAgICAgICAgIG9wOiAnbW9kaWZ5JyxcbiAgICAgICAgICBkYXRhOiBPYmplY3QuYXNzaWduKHsgaWQgfSwgeyBtZXRhOiBleHRyYXMgfSksXG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aGlzLiQkZmlyZVVwZGF0ZSgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpO1xuICAgIH1cbiAgfVxuXG4gICRyZW1vdmUoa2V5LCBpdGVtKSB7XG4gICAgaWYgKGtleSBpbiB0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwcykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIGlmICghKGtleSBpbiB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwcykpIHtcbiAgICAgICAgICB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwc1trZXldID0gW107XG4gICAgICAgIH1cbiAgICAgICAgdGhpc1skZGlydHldLnJlbGF0aW9uc2hpcHNba2V5XS5wdXNoKHtcbiAgICAgICAgICBvcDogJ3JlbW92ZScsXG4gICAgICAgICAgZGF0YTogeyBpZCB9LFxuICAgICAgICB9KTtcbiAgICAgICAgLy8gdGhpcy4kJGZpcmVVcGRhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSAkcmVtb3ZlZCBmcm9tIGhhc01hbnknKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgJHJlbW92ZSBleGNlcHQgZnJvbSBoYXNNYW55IGZpZWxkJyk7XG4gICAgfVxuICB9XG59XG5cbk1vZGVsLmZyb21KU09OID0gZnVuY3Rpb24gZnJvbUpTT04oanNvbikge1xuICB0aGlzLiRpZCA9IGpzb24uJGlkIHx8ICdpZCc7XG4gIHRoaXMuJG5hbWUgPSBqc29uLiRuYW1lO1xuICB0aGlzLiRpbmNsdWRlID0ganNvbi4kaW5jbHVkZTtcbiAgdGhpcy4kc2NoZW1hID0ge1xuICAgIGF0dHJpYnV0ZXM6IG1lcmdlT3B0aW9ucyhqc29uLiRzY2hlbWEuYXR0cmlidXRlcyksXG4gICAgcmVsYXRpb25zaGlwczoge30sXG4gIH07XG4gIGZvciAoY29uc3QgcmVsIGluIGpzb24uJHNjaGVtYS5yZWxhdGlvbnNoaXBzKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZ3VhcmQtZm9yLWluXG4gICAgdGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsXSA9IHt9O1xuICAgIGNsYXNzIER5bmFtaWNSZWxhdGlvbnNoaXAgZXh0ZW5kcyBSZWxhdGlvbnNoaXAge31cbiAgICBEeW5hbWljUmVsYXRpb25zaGlwLmZyb21KU09OKGpzb24uJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbF0pO1xuICAgIHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbF0udHlwZSA9IER5bmFtaWNSZWxhdGlvbnNoaXA7XG4gIH1cbn07XG5cbk1vZGVsLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTigpIHtcbiAgY29uc3QgcmV0VmFsID0ge1xuICAgICRpZDogdGhpcy4kaWQsXG4gICAgJG5hbWU6IHRoaXMuJG5hbWUsXG4gICAgJGluY2x1ZGU6IHRoaXMuJGluY2x1ZGUsXG4gICAgJHNjaGVtYTogeyBhdHRyaWJ1dGVzOiB0aGlzLiRzY2hlbWEuYXR0cmlidXRlcywgcmVsYXRpb25zaGlwczoge30gfSxcbiAgfTtcbiAgZm9yIChjb25zdCByZWwgaW4gdGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHMpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBndWFyZC1mb3ItaW5cbiAgICByZXRWYWwuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbF0gPSB0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxdLnR5cGUudG9KU09OKCk7XG4gIH1cbiAgcmV0dXJuIHJldFZhbDtcbn07XG5cbk1vZGVsLiRyZXN0ID0gZnVuY3Rpb24gJHJlc3QocGx1bXAsIG9wdHMpIHtcbiAgY29uc3QgcmVzdE9wdHMgPSBPYmplY3QuYXNzaWduKFxuICAgIHt9LFxuICAgIG9wdHMsXG4gICAge1xuICAgICAgdXJsOiBgLyR7dGhpcy4kbmFtZX0vJHtvcHRzLnVybH1gLFxuICAgIH1cbiAgKTtcbiAgcmV0dXJuIHBsdW1wLnJlc3RSZXF1ZXN0KHJlc3RPcHRzKTtcbn07XG5cbi8vIFNDSEVNQSBGVU5DVElPTlNcblxuTW9kZWwuYWRkRGVsdGEgPSBmdW5jdGlvbiBhZGREZWx0YShyZWxOYW1lLCByZWxhdGlvbnNoaXApIHtcbiAgcmV0dXJuIHJlbGF0aW9uc2hpcC5tYXAocmVsID0+IHtcbiAgICBjb25zdCByZWxTY2hlbWEgPSB0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxOYW1lXS50eXBlLiRzaWRlc1tyZWxOYW1lXTtcbiAgICBjb25zdCBzY2hlbWF0aXplZCA9IHsgb3A6ICdhZGQnLCBkYXRhOiB7IGlkOiByZWxbcmVsU2NoZW1hLm90aGVyLmZpZWxkXSB9IH07XG4gICAgZm9yIChjb25zdCByZWxGaWVsZCBpbiByZWwpIHtcbiAgICAgIGlmICghKHJlbEZpZWxkID09PSByZWxTY2hlbWEuc2VsZi5maWVsZCB8fCByZWxGaWVsZCA9PT0gcmVsU2NoZW1hLm90aGVyLmZpZWxkKSkge1xuICAgICAgICBzY2hlbWF0aXplZC5kYXRhW3JlbEZpZWxkXSA9IHJlbFtyZWxGaWVsZF07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzY2hlbWF0aXplZDtcbiAgfSk7XG59O1xuXG5Nb2RlbC5hcHBseURlZmF1bHRzID0gZnVuY3Rpb24gYXBwbHlEZWZhdWx0cyh2KSB7XG4gIGNvbnN0IHJldFZhbCA9IG1lcmdlT3B0aW9ucyh7fSwgdik7XG4gIGZvciAoY29uc3QgYXR0ciBpbiB0aGlzLiRzY2hlbWEuYXR0cmlidXRlcykge1xuICAgIGlmICgnZGVmYXVsdCcgaW4gdGhpcy4kc2NoZW1hLmF0dHJpYnV0ZXNbYXR0cl0gJiYgIShhdHRyIGluIHJldFZhbC5hdHRyaWJ1dGVzKSkge1xuICAgICAgcmV0VmFsLmF0dHJpYnV0ZXNbYXR0cl0gPSB0aGlzLiRzY2hlbWEuYXR0cmlidXRlc1thdHRyXS5kZWZhdWx0O1xuICAgIH1cbiAgfVxuICBPYmplY3Qua2V5cyh0aGlzLiRzY2hlbWEpLmZpbHRlcihrID0+IGsgIT09ICckaWQnKVxuICAuZm9yRWFjaChzY2hlbWFGaWVsZCA9PiB7XG4gICAgZm9yIChjb25zdCBmaWVsZCBpbiB0aGlzLiRzY2hlbWFbc2NoZW1hRmllbGRdKSB7XG4gICAgICBpZiAoIShmaWVsZCBpbiByZXRWYWxbc2NoZW1hRmllbGRdKSkge1xuICAgICAgICBpZiAoJ2RlZmF1bHQnIGluIHRoaXMuJHNjaGVtYVtzY2hlbWFGaWVsZF1bZmllbGRdKSB7XG4gICAgICAgICAgcmV0VmFsW3NjaGVtYUZpZWxkXVtmaWVsZF0gPSB0aGlzLiRzY2hlbWFbc2NoZW1hRmllbGRdW2ZpZWxkXS5kZWZhdWx0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHJldFZhbDtcbn07XG5cbk1vZGVsLmFwcGx5RGVsdGEgPSBmdW5jdGlvbiBhcHBseURlbHRhKGN1cnJlbnQsIGRlbHRhKSB7XG4gIGlmIChkZWx0YS5vcCA9PT0gJ2FkZCcgfHwgZGVsdGEub3AgPT09ICdtb2RpZnknKSB7XG4gICAgY29uc3QgcmV0VmFsID0gbWVyZ2VPcHRpb25zKHt9LCBjdXJyZW50LCBkZWx0YS5kYXRhKTtcbiAgICByZXR1cm4gcmV0VmFsO1xuICB9IGVsc2UgaWYgKGRlbHRhLm9wID09PSAncmVtb3ZlJykge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGN1cnJlbnQ7XG4gIH1cbn07XG5cbk1vZGVsLmFzc2lnbiA9IGZ1bmN0aW9uIGFzc2lnbihvcHRzKSB7XG4gIGNvbnN0IHNjaGVtYXRpemVkID0gdGhpcy5zY2hlbWF0aXplKG9wdHMsIHsgaW5jbHVkZUlkOiB0cnVlIH0pO1xuICBjb25zdCByZXRWYWwgPSB0aGlzLmFwcGx5RGVmYXVsdHMoc2NoZW1hdGl6ZWQpO1xuICBPYmplY3Qua2V5cyh0aGlzLiRzY2hlbWEpLmZpbHRlcihrID0+IGsgIT09ICckaWQnKVxuICAuZm9yRWFjaChzY2hlbWFGaWVsZCA9PiB7XG4gICAgZm9yIChjb25zdCBmaWVsZCBpbiB0aGlzLiRzY2hlbWFbc2NoZW1hRmllbGRdKSB7XG4gICAgICBpZiAoIShmaWVsZCBpbiByZXRWYWxbc2NoZW1hRmllbGRdKSkge1xuICAgICAgICByZXRWYWxbc2NoZW1hRmllbGRdW2ZpZWxkXSA9IHNjaGVtYUZpZWxkID09PSAncmVsYXRpb25zaGlwcycgPyBbXSA6IG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0VmFsLnR5cGUgPSB0aGlzLiRuYW1lO1xuICByZXR1cm4gcmV0VmFsO1xufTtcblxuTW9kZWwuY2FjaGVHZXQgPSBmdW5jdGlvbiBjYWNoZUdldChzdG9yZSwga2V5KSB7XG4gIHJldHVybiAodGhpcy4kJHN0b3JlQ2FjaGUuZ2V0KHN0b3JlKSB8fCB7fSlba2V5XTtcbn07XG5cbk1vZGVsLmNhY2hlU2V0ID0gZnVuY3Rpb24gY2FjaGVTZXQoc3RvcmUsIGtleSwgdmFsdWUpIHtcbiAgaWYgKHRoaXMuJCRzdG9yZUNhY2hlLmdldChzdG9yZSkgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuJCRzdG9yZUNhY2hlLnNldChzdG9yZSwge30pO1xuICB9XG4gIHRoaXMuJCRzdG9yZUNhY2hlLmdldChzdG9yZSlba2V5XSA9IHZhbHVlO1xufTtcblxuTW9kZWwucmVzb2x2ZUFuZE92ZXJsYXkgPSBmdW5jdGlvbiByZXNvbHZlQW5kT3ZlcmxheSh1cGRhdGUsIGJhc2UgPSB7IGF0dHJpYnV0ZXM6IHt9LCByZWxhdGlvbnNoaXBzOiB7fSB9KSB7XG4gIGNvbnN0IGF0dHJpYnV0ZXMgPSBtZXJnZU9wdGlvbnMoe30sIGJhc2UuYXR0cmlidXRlcywgdXBkYXRlLmF0dHJpYnV0ZXMpO1xuICBjb25zdCBiYXNlSXNSZXNvbHZlZCA9IE9iamVjdC5rZXlzKGJhc2UucmVsYXRpb25zaGlwcykubWFwKHJlbE5hbWUgPT4ge1xuICAgIHJldHVybiBiYXNlLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0ubWFwKHJlbCA9PiAhKCdvcCcgaW4gcmVsKSkucmVkdWNlKChhY2MsIGN1cnIpID0+IGFjYyAmJiBjdXJyLCB0cnVlKTtcbiAgfSkucmVkdWNlKChhY2MsIGN1cnIpID0+IGFjYyAmJiBjdXJyLCB0cnVlKTtcbiAgY29uc3QgcmVzb2x2ZWRCYXNlUmVscyA9IGJhc2VJc1Jlc29sdmVkID8gYmFzZS5yZWxhdGlvbnNoaXBzIDogdGhpcy5yZXNvbHZlUmVsYXRpb25zaGlwcyhiYXNlLnJlbGF0aW9uc2hpcHMpO1xuICBjb25zdCByZXNvbHZlZFJlbGF0aW9uc2hpcHMgPSB0aGlzLnJlc29sdmVSZWxhdGlvbnNoaXBzKHVwZGF0ZS5yZWxhdGlvbnNoaXBzLCByZXNvbHZlZEJhc2VSZWxzKTtcbiAgcmV0dXJuIHsgYXR0cmlidXRlcywgcmVsYXRpb25zaGlwczogcmVzb2x2ZWRSZWxhdGlvbnNoaXBzIH07XG59O1xuXG5Nb2RlbC5yZXNvbHZlUmVsYXRpb25zaGlwcyA9IGZ1bmN0aW9uIHJlc29sdmVSZWxhdGlvbnNoaXBzKGRlbHRhcywgYmFzZSA9IHt9KSB7XG4gIGNvbnN0IHVwZGF0ZXMgPSBPYmplY3Qua2V5cyhkZWx0YXMpLm1hcChyZWxOYW1lID0+IHtcbiAgICBjb25zdCByZXNvbHZlZCA9IHRoaXMucmVzb2x2ZVJlbGF0aW9uc2hpcChkZWx0YXNbcmVsTmFtZV0sIGJhc2VbcmVsTmFtZV0pO1xuICAgIHJldHVybiB7IFtyZWxOYW1lXTogcmVzb2x2ZWQgfTtcbiAgfSlcbiAgLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBtZXJnZU9wdGlvbnMoYWNjLCBjdXJyKSwge30pO1xuICByZXR1cm4gbWVyZ2VPcHRpb25zKHt9LCBiYXNlLCB1cGRhdGVzKTtcbn07XG5cbk1vZGVsLnJlc29sdmVSZWxhdGlvbnNoaXAgPSBmdW5jdGlvbiByZXNvbHZlUmVsYXRpb25zaGlwKGRlbHRhcywgYmFzZSA9IFtdKSB7XG4gIC8vIEluZGV4IGN1cnJlbnQgcmVsYXRpb25zaGlwcyBieSBJRCBmb3IgZWZmaWNpZW50IG1vZGlmaWNhdGlvblxuICBjb25zdCB1cGRhdGVzID0gYmFzZS5tYXAocmVsID0+IHtcbiAgICByZXR1cm4geyBbcmVsLmlkXTogcmVsIH07XG4gIH0pLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBtZXJnZU9wdGlvbnMoYWNjLCBjdXJyKSwge30pO1xuXG4gIC8vIEFwcGx5IGRlbHRhcyBvbiB0b3Agb2YgdXBkYXRlc1xuICBkZWx0YXMuZm9yRWFjaChkZWx0YSA9PiB7XG4gICAgY29uc3QgY2hpbGRJZCA9IGRlbHRhLmRhdGEgPyBkZWx0YS5kYXRhLmlkIDogZGVsdGEuaWQ7XG4gICAgdXBkYXRlc1tjaGlsZElkXSA9IGRlbHRhLm9wID8gdGhpcy5hcHBseURlbHRhKHVwZGF0ZXNbY2hpbGRJZF0sIGRlbHRhKSA6IGRlbHRhO1xuICB9KTtcblxuICAvLyBSZWR1Y2UgdXBkYXRlcyBiYWNrIGludG8gbGlzdCwgb21pdHRpbmcgdW5kZWZpbmVkc1xuICByZXR1cm4gT2JqZWN0LmtleXModXBkYXRlcylcbiAgICAubWFwKGlkID0+IHVwZGF0ZXNbaWRdKVxuICAgIC5maWx0ZXIocmVsID0+IHJlbCAhPT0gdW5kZWZpbmVkKVxuICAgIC5yZWR1Y2UoKGFjYywgY3VycikgPT4gYWNjLmNvbmNhdChjdXJyKSwgW10pO1xufTtcblxuTW9kZWwuc2NoZW1hdGl6ZSA9IGZ1bmN0aW9uIHNjaGVtYXRpemUodiA9IHt9LCBvcHRzID0geyBpbmNsdWRlSWQ6IGZhbHNlIH0pIHtcbiAgY29uc3QgcmV0VmFsID0ge307XG4gIGlmIChvcHRzLmluY2x1ZGVJZCkge1xuICAgIHJldFZhbC5pZCA9IHRoaXMuJGlkIGluIHYgPyB2W3RoaXMuJGlkXSA6IHYuaWQ7XG4gIH1cbiAgT2JqZWN0LmtleXModGhpcy4kc2NoZW1hKS5maWx0ZXIoayA9PiBrICE9PSAnJGlkJylcbiAgLmZvckVhY2goc2NoZW1hRmllbGQgPT4ge1xuICAgIGlmIChzY2hlbWFGaWVsZCBpbiB2KSB7XG4gICAgICByZXRWYWxbc2NoZW1hRmllbGRdID0gbWVyZ2VPcHRpb25zKHt9LCB2W3NjaGVtYUZpZWxkXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghKHNjaGVtYUZpZWxkIGluIHJldFZhbCkpIHtcbiAgICAgICAgcmV0VmFsW3NjaGVtYUZpZWxkXSA9IHt9O1xuICAgICAgfVxuICAgICAgZm9yIChjb25zdCBmaWVsZCBpbiB0aGlzLiRzY2hlbWFbc2NoZW1hRmllbGRdKSB7XG4gICAgICAgIGlmIChmaWVsZCBpbiB2KSB7XG4gICAgICAgICAgcmV0VmFsW3NjaGVtYUZpZWxkXVtmaWVsZF0gPSBzY2hlbWFGaWVsZCA9PT0gJ3JlbGF0aW9uc2hpcHMnID8gdGhpcy5hZGREZWx0YShmaWVsZCwgdltmaWVsZF0pIDogdltmaWVsZF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcmV0VmFsO1xufTtcblxuLy8gTUVUQURBVEFcblxuTW9kZWwuJCRzdG9yZUNhY2hlID0gbmV3IE1hcCgpO1xuXG5Nb2RlbC4kaWQgPSAnaWQnO1xuTW9kZWwuJG5hbWUgPSAnQmFzZSc7XG5Nb2RlbC4kc2NoZW1hID0ge1xuICAkaWQ6ICdpZCcsXG4gIGF0dHJpYnV0ZXM6IHt9LFxuICByZWxhdGlvbnNoaXBzOiB7fSxcbn07XG5Nb2RlbC4kaW5jbHVkZWQgPSBbXTtcbiJdfQ==
