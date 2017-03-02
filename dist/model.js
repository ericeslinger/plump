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

Model.$id = 'id';
Model.$name = 'Base';
Model.$schema = {
  $id: 'id',
  attributes: {},
  relationships: {}
};
Model.$included = [];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRkaXJ0eSIsIlN5bWJvbCIsIiRwbHVtcCIsIiR1bnN1YnNjcmliZSIsIiRzdWJqZWN0IiwiJGFsbCIsIk1vZGVsIiwib3B0cyIsInBsdW1wIiwiRXJyb3IiLCJhdHRyaWJ1dGVzIiwicmVsYXRpb25zaGlwcyIsIm5leHQiLCIkJGNvcHlWYWx1ZXNGcm9tIiwiaWRGaWVsZCIsImNvbnN0cnVjdG9yIiwiJGlkIiwic2NoZW1hdGl6ZSIsInVuZGVmaW5lZCIsInN1YnNjcmliZSIsIiRuYW1lIiwiZmllbGQiLCJ2YWx1ZSIsImZpZWxkcyIsImNiIiwibGVuZ3RoIiwiQXJyYXkiLCJpc0FycmF5IiwiJCRob29rVG9QbHVtcCIsInN0cmVhbUdldCIsInYiLCIkJGZpcmVVcGRhdGUiLCJzdWJzY3JpYmVPbiIsImtleSIsIiRkaXJ0eUZpZWxkcyIsIm5ld0RpcnR5Iiwia2V5cyIsIk9iamVjdCIsImZvckVhY2giLCJzY2hlbWFGaWVsZCIsImluZGV4T2YiLCJ2YWwiLCJ1cGRhdGUiLCJyZXNvbHZlQW5kT3ZlcmxheSIsImlkIiwidW5zdWJzY3JpYmUiLCIkc2NoZW1hIiwiZ2V0IiwidGhlbiIsInNlbGYiLCJzY2hlbWF0aXplZCIsIndpdGhEaXJ0eSIsInJldFZhbCIsImFwcGx5RGVmYXVsdHMiLCJ0eXBlIiwib3B0aW9ucyIsIiRmaWVsZHMiLCJtYXAiLCJmaWx0ZXIiLCJyZWR1Y2UiLCJhY2MiLCJjdXJyIiwiYXNzaWduIiwic2F2ZSIsInVwZGF0ZWQiLCIkJHJlc2V0RGlydHkiLCJzYW5pdGl6ZWQiLCJkZWxldGUiLCJkYXRhIiwicmVzdE9wdHMiLCJ1cmwiLCJyZXN0UmVxdWVzdCIsIml0ZW0iLCJleHRyYXMiLCIkc2lkZXMiLCJvdGhlciIsInB1c2giLCJvcCIsIm1ldGEiLCJjb25jYXQiLCJrIiwiZnJvbUpTT04iLCJqc29uIiwiJGluY2x1ZGUiLCJyZWwiLCJEeW5hbWljUmVsYXRpb25zaGlwIiwidG9KU09OIiwiJHJlc3QiLCJhZGREZWx0YSIsInJlbE5hbWUiLCJyZWxhdGlvbnNoaXAiLCJyZWxTY2hlbWEiLCJyZWxGaWVsZCIsImF0dHIiLCJkZWZhdWx0IiwiYXBwbHlEZWx0YSIsImN1cnJlbnQiLCJkZWx0YSIsImluY2x1ZGVJZCIsImJhc2UiLCJiYXNlSXNSZXNvbHZlZCIsInJlc29sdmVkQmFzZVJlbHMiLCJyZXNvbHZlUmVsYXRpb25zaGlwcyIsInJlc29sdmVkUmVsYXRpb25zaGlwcyIsImRlbHRhcyIsInVwZGF0ZXMiLCJyZXNvbHZlZCIsInJlc29sdmVSZWxhdGlvbnNoaXAiLCJjaGlsZElkIiwiJGluY2x1ZGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBRUE7Ozs7Ozs7Ozs7OztBQUNBLElBQU1BLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUMsU0FBU0QsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNRSxlQUFlRixPQUFPLGNBQVAsQ0FBckI7QUFDQSxJQUFNRyxXQUFXSCxPQUFPLFVBQVAsQ0FBakI7QUFDTyxJQUFNSSxzQkFBT0osT0FBTyxNQUFQLENBQWI7O0FBRVA7QUFDQTs7SUFFYUssSyxXQUFBQSxLO0FBQ1gsaUJBQVlDLElBQVosRUFBa0JDLEtBQWxCLEVBQXlCO0FBQUE7O0FBQ3ZCLFFBQUlBLEtBQUosRUFBVztBQUNULFdBQUtOLE1BQUwsSUFBZU0sS0FBZjtBQUNELEtBRkQsTUFFTztBQUNMLFlBQU0sSUFBSUMsS0FBSixDQUFVLDhDQUFWLENBQU47QUFDRDtBQUNEO0FBQ0EsU0FBS1QsTUFBTCxJQUFlO0FBQ2JVLGtCQUFZLEVBREMsRUFDRztBQUNoQkMscUJBQWUsRUFGRixFQUFmO0FBSUEsU0FBS1AsUUFBTCxJQUFpQix5QkFBakI7QUFDQSxTQUFLQSxRQUFMLEVBQWVRLElBQWYsQ0FBb0IsRUFBcEI7QUFDQSxTQUFLQyxnQkFBTCxDQUFzQk4sSUFBdEI7QUFDQTtBQUNEOztBQUVEOzs7Ozs7QUEyQkE7O3VDQUU0QjtBQUFBLFVBQVhBLElBQVcs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QVAsQ0FBaEIsR0FBOEJjLEVBQUVjLEVBQTVDO0FBQ0Q7QUFDRFAsU0FBT0QsSUFBUCxDQUFZLEtBQUtVLE9BQWpCLEVBQTBCWSxNQUExQixDQUFpQztBQUFBLFdBQUtzQixNQUFNLEtBQVg7QUFBQSxHQUFqQyxFQUNDMUMsT0FERCxDQUNTLHVCQUFlO0FBQ3RCLFFBQUlDLGVBQWVULENBQW5CLEVBQXNCO0FBQ3BCc0IsYUFBT2IsV0FBUCxJQUFzQiw0QkFBYSxFQUFiLEVBQWlCVCxFQUFFUyxXQUFGLENBQWpCLENBQXRCO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsVUFBSSxFQUFFQSxlQUFlYSxNQUFqQixDQUFKLEVBQThCO0FBQzVCQSxlQUFPYixXQUFQLElBQXNCLEVBQXRCO0FBQ0Q7QUFDRCxXQUFLLElBQU1sQixLQUFYLElBQW9CLFFBQUt5QixPQUFMLENBQWFQLFdBQWIsQ0FBcEIsRUFBK0M7QUFDN0MsWUFBSWxCLFNBQVNTLENBQWIsRUFBZ0I7QUFDZHNCLGlCQUFPYixXQUFQLEVBQW9CbEIsS0FBcEIsSUFBNkJrQixnQkFBZ0IsZUFBaEIsR0FBa0MsUUFBS2lELFFBQUwsQ0FBY25FLEtBQWQsRUFBcUJTLEVBQUVULEtBQUYsQ0FBckIsQ0FBbEMsR0FBbUVTLEVBQUVULEtBQUYsQ0FBaEc7QUFDRDtBQUNGO0FBQ0Y7QUFDRixHQWREO0FBZUEsU0FBTytCLE1BQVA7QUFDRCxDQXJCRDs7QUF1QkE7O0FBRUE5QyxNQUFNVSxHQUFOLEdBQVksSUFBWjtBQUNBVixNQUFNYyxLQUFOLEdBQWMsTUFBZDtBQUNBZCxNQUFNd0MsT0FBTixHQUFnQjtBQUNkOUIsT0FBSyxJQURTO0FBRWROLGNBQVksRUFGRTtBQUdkQyxpQkFBZTtBQUhELENBQWhCO0FBS0FMLE1BQU11RyxTQUFOLEdBQWtCLEVBQWxCIiwiZmlsZSI6Im1vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcbmltcG9ydCB7IEJlaGF2aW9yU3ViamVjdCB9IGZyb20gJ3J4anMvUngnO1xuXG5pbXBvcnQgeyBSZWxhdGlvbnNoaXAgfSBmcm9tICcuL3JlbGF0aW9uc2hpcCc7XG5jb25zdCAkZGlydHkgPSBTeW1ib2woJyRkaXJ0eScpO1xuY29uc3QgJHBsdW1wID0gU3ltYm9sKCckcGx1bXAnKTtcbmNvbnN0ICR1bnN1YnNjcmliZSA9IFN5bWJvbCgnJHVuc3Vic2NyaWJlJyk7XG5jb25zdCAkc3ViamVjdCA9IFN5bWJvbCgnJHN1YmplY3QnKTtcbmV4cG9ydCBjb25zdCAkYWxsID0gU3ltYm9sKCckYWxsJyk7XG5cbi8vIFRPRE86IGZpZ3VyZSBvdXQgd2hlcmUgZXJyb3IgZXZlbnRzIG9yaWdpbmF0ZSAoc3RvcmFnZSBvciBtb2RlbClcbi8vIGFuZCB3aG8ga2VlcHMgYSByb2xsLWJhY2thYmxlIGRlbHRhXG5cbmV4cG9ydCBjbGFzcyBNb2RlbCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMsIHBsdW1wKSB7XG4gICAgaWYgKHBsdW1wKSB7XG4gICAgICB0aGlzWyRwbHVtcF0gPSBwbHVtcDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY29uc3RydWN0IFBsdW1wIG1vZGVsIHdpdGhvdXQgYSBQbHVtcCcpO1xuICAgIH1cbiAgICAvLyBUT0RPOiBEZWZpbmUgRGVsdGEgaW50ZXJmYWNlXG4gICAgdGhpc1skZGlydHldID0ge1xuICAgICAgYXR0cmlidXRlczoge30sIC8vIFNpbXBsZSBrZXktdmFsdWVcbiAgICAgIHJlbGF0aW9uc2hpcHM6IHt9LCAvLyByZWxOYW1lOiBEZWx0YVtdXG4gICAgfTtcbiAgICB0aGlzWyRzdWJqZWN0XSA9IG5ldyBCZWhhdmlvclN1YmplY3QoKTtcbiAgICB0aGlzWyRzdWJqZWN0XS5uZXh0KHt9KTtcbiAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20ob3B0cyk7XG4gICAgLy8gdGhpcy4kJGZpcmVVcGRhdGUob3B0cyk7XG4gIH1cblxuICAvLyBDT05WRU5JRU5DRSBBQ0NFU1NPUlNcblxuICBnZXQgJG5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuJG5hbWU7XG4gIH1cblxuICBnZXQgJGlkKCkge1xuICAgIHJldHVybiB0aGlzW3RoaXMuY29uc3RydWN0b3IuJGlkXTtcbiAgfVxuXG4gIGdldCAkZmllbGRzKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLiRzY2hlbWEuYXR0cmlidXRlcylcbiAgICAuY29uY2F0KE9iamVjdC5rZXlzKHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzKSk7XG4gIH1cblxuICBnZXQgJHNjaGVtYSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci4kc2NoZW1hO1xuICB9XG5cbiAgZ2V0ICRkaXJ0eUZpZWxkcygpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpc1skZGlydHldKVxuICAgIC5tYXAoayA9PiBPYmplY3Qua2V5cyh0aGlzWyRkaXJ0eV1ba10pKVxuICAgIC5yZWR1Y2UoKGFjYywgY3VycikgPT4gYWNjLmNvbmNhdChjdXJyKSwgW10pXG4gICAgLmZpbHRlcihrID0+IGsgIT09IHRoaXMuY29uc3RydWN0b3IuJGlkKSAvLyBpZCBzaG91bGQgbmV2ZXIgYmUgZGlydHlcbiAgICAucmVkdWNlKChhY2MsIGN1cnIpID0+IGFjYy5jb25jYXQoY3VyciksIFtdKTtcbiAgfVxuXG4gIC8vIFdJUklOR1xuXG4gICQkY29weVZhbHVlc0Zyb20ob3B0cyA9IHt9KSB7XG4gICAgY29uc3QgaWRGaWVsZCA9IHRoaXMuY29uc3RydWN0b3IuJGlkIGluIG9wdHMgPyB0aGlzLmNvbnN0cnVjdG9yLiRpZCA6ICdpZCc7XG4gICAgdGhpc1t0aGlzLmNvbnN0cnVjdG9yLiRpZF0gPSBvcHRzW2lkRmllbGRdIHx8IHRoaXMuJGlkO1xuICAgIHRoaXNbJGRpcnR5XSA9IHRoaXMuY29uc3RydWN0b3Iuc2NoZW1hdGl6ZShvcHRzKTtcbiAgfVxuXG4gICQkaG9va1RvUGx1bXAoKSB7XG4gICAgaWYgKHRoaXNbJHVuc3Vic2NyaWJlXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyR1bnN1YnNjcmliZV0gPSB0aGlzWyRwbHVtcF0uc3Vic2NyaWJlKHRoaXMuY29uc3RydWN0b3IuJG5hbWUsIHRoaXMuJGlkLCAoeyBmaWVsZCwgdmFsdWUgfSkgPT4ge1xuICAgICAgICBpZiAoZmllbGQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHsgW2ZpZWxkXTogdmFsdWUgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gICRzdWJzY3JpYmUoLi4uYXJncykge1xuICAgIGxldCBmaWVsZHMgPSBbJ2F0dHJpYnV0ZXMnXTtcbiAgICBsZXQgY2I7XG4gICAgaWYgKGFyZ3MubGVuZ3RoID09PSAyKSB7XG4gICAgICBmaWVsZHMgPSBhcmdzWzBdO1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGZpZWxkcykpIHtcbiAgICAgICAgZmllbGRzID0gW2ZpZWxkc107XG4gICAgICB9XG4gICAgICBjYiA9IGFyZ3NbMV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGNiID0gYXJnc1swXTtcbiAgICB9XG4gICAgdGhpcy4kJGhvb2tUb1BsdW1wKCk7XG4gICAgdGhpc1skcGx1bXBdLnN0cmVhbUdldCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwgZmllbGRzKVxuICAgIC5zdWJzY3JpYmUoKHYpID0+IHtcbiAgICAgIHRoaXMuJCRmaXJlVXBkYXRlKHYpO1xuICAgIH0pO1xuICAgIHJldHVybiB0aGlzWyRzdWJqZWN0XS5zdWJzY3JpYmVPbihjYik7XG4gIH1cblxuICAkJHJlc2V0RGlydHkob3B0cykge1xuICAgIGNvbnN0IGtleSA9IG9wdHMgfHwgdGhpcy4kZGlydHlGaWVsZHM7XG4gICAgY29uc3QgbmV3RGlydHkgPSB7IGF0dHJpYnV0ZXM6IHt9LCByZWxhdGlvbnNoaXBzOiB7fSB9O1xuICAgIGNvbnN0IGtleXMgPSBBcnJheS5pc0FycmF5KGtleSkgPyBrZXkgOiBba2V5XTtcbiAgICBPYmplY3Qua2V5cyh0aGlzWyRkaXJ0eV0pLmZvckVhY2goc2NoZW1hRmllbGQgPT4ge1xuICAgICAgZm9yIChjb25zdCBmaWVsZCBpbiB0aGlzWyRkaXJ0eV1bc2NoZW1hRmllbGRdKSB7XG4gICAgICAgIGlmIChrZXlzLmluZGV4T2YoZmllbGQpIDwgMCkge1xuICAgICAgICAgIGNvbnN0IHZhbCA9IHRoaXNbJGRpcnR5XVtzY2hlbWFGaWVsZF1bZmllbGRdO1xuICAgICAgICAgIG5ld0RpcnR5W3NjaGVtYUZpZWxkXVtmaWVsZF0gPSB0eXBlb2YgdmFsID09PSAnb2JqZWN0JyA/IG1lcmdlT3B0aW9ucyh7fSwgdmFsKSA6IHZhbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXNbJGRpcnR5XSA9IG5ld0RpcnR5O1xuICB9XG5cbiAgJCRmaXJlVXBkYXRlKHYpIHtcbiAgICBjb25zdCB1cGRhdGUgPSB0aGlzLmNvbnN0cnVjdG9yLnJlc29sdmVBbmRPdmVybGF5KHRoaXNbJGRpcnR5XSwgdik7XG4gICAgaWYgKHRoaXMuJGlkKSB7XG4gICAgICB1cGRhdGUuaWQgPSB0aGlzLiRpZDtcbiAgICB9XG4gICAgdGhpc1skc3ViamVjdF0ubmV4dCh1cGRhdGUpO1xuICB9XG5cbiAgJHRlYXJkb3duKCkge1xuICAgIGlmICh0aGlzWyR1bnN1YnNjcmliZV0pIHtcbiAgICAgIHRoaXNbJHVuc3Vic2NyaWJlXS51bnN1YnNjcmliZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEFQSSBNRVRIT0RTXG5cbiAgJGdldChvcHRzKSB7XG4gICAgLy8gSWYgb3B0cyBpcyBmYWxzeSAoaS5lLiwgdW5kZWZpbmVkKSwgZ2V0IGF0dHJpYnV0ZXNcbiAgICAvLyBPdGhlcndpc2UsIGdldCB3aGF0IHdhcyByZXF1ZXN0ZWQsXG4gICAgLy8gd3JhcHBpbmcgaXQgaW4gYSBBcnJheSBpZiBpdCB3YXNuJ3QgYWxyZWFkeSBvbmVcbiAgICBsZXQga2V5cyA9IG9wdHMgJiYgIUFycmF5LmlzQXJyYXkob3B0cykgPyBbb3B0c10gOiBvcHRzO1xuICAgIGlmIChrZXlzICYmIGtleXMuaW5kZXhPZigkYWxsKSA+PSAwKSB7XG4gICAgICBrZXlzID0gT2JqZWN0LmtleXModGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHMpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLmdldCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5cylcbiAgICAudGhlbihzZWxmID0+IHtcbiAgICAgIGlmICghc2VsZiAmJiB0aGlzLiRkaXJ0eUZpZWxkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBzY2hlbWF0aXplZCA9IHRoaXMuY29uc3RydWN0b3Iuc2NoZW1hdGl6ZShzZWxmIHx8IHt9KTtcbiAgICAgICAgY29uc3Qgd2l0aERpcnR5ID0gdGhpcy5jb25zdHJ1Y3Rvci5yZXNvbHZlQW5kT3ZlcmxheSh0aGlzWyRkaXJ0eV0sIHNjaGVtYXRpemVkKTtcbiAgICAgICAgY29uc3QgcmV0VmFsID0gdGhpcy5jb25zdHJ1Y3Rvci5hcHBseURlZmF1bHRzKHdpdGhEaXJ0eSk7XG4gICAgICAgIHJldFZhbC50eXBlID0gdGhpcy4kbmFtZTtcbiAgICAgICAgcmV0VmFsLmlkID0gdGhpcy4kaWQ7XG4gICAgICAgIHJldHVybiByZXRWYWw7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvLyBUT0RPOiBTaG91bGQgJHNhdmUgdWx0aW1hdGVseSByZXR1cm4gdGhpcy4kZ2V0KCk/XG4gICRzYXZlKG9wdHMpIHtcbiAgICBjb25zdCBvcHRpb25zID0gb3B0cyB8fCB0aGlzLiRmaWVsZHM7XG4gICAgY29uc3Qga2V5cyA9IEFycmF5LmlzQXJyYXkob3B0aW9ucykgPyBvcHRpb25zIDogW29wdGlvbnNdO1xuXG4gICAgLy8gRGVlcCBjb3B5IGRpcnR5IGNhY2hlLCBmaWx0ZXJpbmcgb3V0IGtleXMgdGhhdCBhcmUgbm90IGluIG9wdHNcbiAgICBjb25zdCB1cGRhdGUgPSBPYmplY3Qua2V5cyh0aGlzWyRkaXJ0eV0pLm1hcChzY2hlbWFGaWVsZCA9PiB7XG4gICAgICBjb25zdCB2YWx1ZSA9IE9iamVjdC5rZXlzKHRoaXNbJGRpcnR5XVtzY2hlbWFGaWVsZF0pXG4gICAgICAgIC5maWx0ZXIoa2V5ID0+IGtleXMuaW5kZXhPZihrZXkpID49IDApXG4gICAgICAgIC5tYXAoa2V5ID0+IHtcbiAgICAgICAgICByZXR1cm4geyBba2V5XTogdGhpc1skZGlydHldW3NjaGVtYUZpZWxkXVtrZXldIH07XG4gICAgICAgIH0pXG4gICAgICAgIC5yZWR1Y2UoKGFjYywgY3VycikgPT4gT2JqZWN0LmFzc2lnbihhY2MsIGN1cnIpLCB7fSk7XG5cbiAgICAgIHJldHVybiB7IFtzY2hlbWFGaWVsZF06IHZhbHVlIH07XG4gICAgfSkucmVkdWNlKChhY2MsIGN1cnIpID0+IE9iamVjdC5hc3NpZ24oYWNjLCBjdXJyKSwge30pO1xuXG4gICAgaWYgKHRoaXMuJGlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHVwZGF0ZVt0aGlzLmNvbnN0cnVjdG9yLiRpZF0gPSB0aGlzLiRpZDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLnNhdmUodGhpcy5jb25zdHJ1Y3RvciwgdXBkYXRlKVxuICAgIC50aGVuKCh1cGRhdGVkKSA9PiB7XG4gICAgICB0aGlzLiQkcmVzZXREaXJ0eShvcHRzKTtcbiAgICAgIGlmICh1cGRhdGVkLmlkKSB7XG4gICAgICAgIHRoaXNbdGhpcy5jb25zdHJ1Y3Rvci4kaWRdID0gdXBkYXRlZC5pZDtcbiAgICAgIH1cbiAgICAgIC8vIHRoaXMuJCRmaXJlVXBkYXRlKHVwZGF0ZWQpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSk7XG4gIH1cblxuICAkc2V0KHVwZGF0ZSkge1xuICAgIC8vIEZpbHRlciBvdXQgbm9uLWF0dHJpYnV0ZSBrZXlzXG4gICAgY29uc3Qgc2FuaXRpemVkID0ge307XG4gICAgZm9yIChjb25zdCBrZXkgaW4gdXBkYXRlKSB7XG4gICAgICBpZiAoa2V5IGluIHRoaXMuJHNjaGVtYS5hdHRyaWJ1dGVzKSB7XG4gICAgICAgIHNhbml0aXplZFtrZXldID0gdXBkYXRlW2tleV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEtleSAke2tleX0gaXMgbm90IGFuIGF0dHJpYnV0ZXMgb2YgJHt0aGlzLiRuYW1lfWApO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20oc2FuaXRpemVkKTtcbiAgICAvLyB0aGlzLiQkZmlyZVVwZGF0ZShzYW5pdGl6ZWQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgJGRlbGV0ZSgpIHtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLmRlbGV0ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZClcbiAgICAudGhlbihkYXRhID0+IGRhdGEubWFwKHRoaXMuY29uc3RydWN0b3Iuc2NoZW1hdGl6ZSkpO1xuICB9XG5cbiAgJHJlc3Qob3B0cykge1xuICAgIGNvbnN0IHJlc3RPcHRzID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAgb3B0cyxcbiAgICAgIHtcbiAgICAgICAgdXJsOiBgLyR7dGhpcy5jb25zdHJ1Y3Rvci4kbmFtZX0vJHt0aGlzLiRpZH0vJHtvcHRzLnVybH1gLFxuICAgICAgfVxuICAgICk7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5yZXN0UmVxdWVzdChyZXN0T3B0cykudGhlbihkYXRhID0+IHRoaXMuY29uc3RydWN0b3Iuc2NoZW1hdGl6ZShkYXRhKSk7XG4gIH1cblxuICAkYWRkKGtleSwgaXRlbSwgZXh0cmFzKSB7XG4gICAgaWYgKHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW2tleV0pIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSBpZiAoaXRlbS4kaWQpIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbVt0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwc1trZXldLnR5cGUuJHNpZGVzW2tleV0ub3RoZXIuZmllbGRdO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgaWYgKCEoa2V5IGluIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzKSkge1xuICAgICAgICAgIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzW2tleV0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwc1trZXldLnB1c2goe1xuICAgICAgICAgIG9wOiAnYWRkJyxcbiAgICAgICAgICBkYXRhOiBPYmplY3QuYXNzaWduKHsgaWQgfSwgeyBtZXRhOiBleHRyYXMgfSksXG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aGlzLiQkZmlyZVVwZGF0ZSgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpO1xuICAgIH1cbiAgfVxuXG4gICRtb2RpZnlSZWxhdGlvbnNoaXAoa2V5LCBpdGVtLCBleHRyYXMpIHtcbiAgICBpZiAoa2V5IGluIHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgaWYgKCEoa2V5IGluIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzKSkge1xuICAgICAgICAgIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzW2tleV0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwc1trZXldLnB1c2goe1xuICAgICAgICAgIG9wOiAnbW9kaWZ5JyxcbiAgICAgICAgICBkYXRhOiBPYmplY3QuYXNzaWduKHsgaWQgfSwgeyBtZXRhOiBleHRyYXMgfSksXG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aGlzLiQkZmlyZVVwZGF0ZSgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpO1xuICAgIH1cbiAgfVxuXG4gICRyZW1vdmUoa2V5LCBpdGVtKSB7XG4gICAgaWYgKGtleSBpbiB0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwcykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIGlmICghKGtleSBpbiB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwcykpIHtcbiAgICAgICAgICB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwc1trZXldID0gW107XG4gICAgICAgIH1cbiAgICAgICAgdGhpc1skZGlydHldLnJlbGF0aW9uc2hpcHNba2V5XS5wdXNoKHtcbiAgICAgICAgICBvcDogJ3JlbW92ZScsXG4gICAgICAgICAgZGF0YTogeyBpZCB9LFxuICAgICAgICB9KTtcbiAgICAgICAgLy8gdGhpcy4kJGZpcmVVcGRhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSAkcmVtb3ZlZCBmcm9tIGhhc01hbnknKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgJHJlbW92ZSBleGNlcHQgZnJvbSBoYXNNYW55IGZpZWxkJyk7XG4gICAgfVxuICB9XG59XG5cbk1vZGVsLmZyb21KU09OID0gZnVuY3Rpb24gZnJvbUpTT04oanNvbikge1xuICB0aGlzLiRpZCA9IGpzb24uJGlkIHx8ICdpZCc7XG4gIHRoaXMuJG5hbWUgPSBqc29uLiRuYW1lO1xuICB0aGlzLiRpbmNsdWRlID0ganNvbi4kaW5jbHVkZTtcbiAgdGhpcy4kc2NoZW1hID0ge1xuICAgIGF0dHJpYnV0ZXM6IG1lcmdlT3B0aW9ucyhqc29uLiRzY2hlbWEuYXR0cmlidXRlcyksXG4gICAgcmVsYXRpb25zaGlwczoge30sXG4gIH07XG4gIGZvciAoY29uc3QgcmVsIGluIGpzb24uJHNjaGVtYS5yZWxhdGlvbnNoaXBzKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZ3VhcmQtZm9yLWluXG4gICAgdGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsXSA9IHt9O1xuICAgIGNsYXNzIER5bmFtaWNSZWxhdGlvbnNoaXAgZXh0ZW5kcyBSZWxhdGlvbnNoaXAge31cbiAgICBEeW5hbWljUmVsYXRpb25zaGlwLmZyb21KU09OKGpzb24uJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbF0pO1xuICAgIHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbF0udHlwZSA9IER5bmFtaWNSZWxhdGlvbnNoaXA7XG4gIH1cbn07XG5cbk1vZGVsLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTigpIHtcbiAgY29uc3QgcmV0VmFsID0ge1xuICAgICRpZDogdGhpcy4kaWQsXG4gICAgJG5hbWU6IHRoaXMuJG5hbWUsXG4gICAgJGluY2x1ZGU6IHRoaXMuJGluY2x1ZGUsXG4gICAgJHNjaGVtYTogeyBhdHRyaWJ1dGVzOiB0aGlzLiRzY2hlbWEuYXR0cmlidXRlcywgcmVsYXRpb25zaGlwczoge30gfSxcbiAgfTtcbiAgZm9yIChjb25zdCByZWwgaW4gdGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHMpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBndWFyZC1mb3ItaW5cbiAgICByZXRWYWwuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbF0gPSB0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxdLnR5cGUudG9KU09OKCk7XG4gIH1cbiAgcmV0dXJuIHJldFZhbDtcbn07XG5cbk1vZGVsLiRyZXN0ID0gZnVuY3Rpb24gJHJlc3QocGx1bXAsIG9wdHMpIHtcbiAgY29uc3QgcmVzdE9wdHMgPSBPYmplY3QuYXNzaWduKFxuICAgIHt9LFxuICAgIG9wdHMsXG4gICAge1xuICAgICAgdXJsOiBgLyR7dGhpcy4kbmFtZX0vJHtvcHRzLnVybH1gLFxuICAgIH1cbiAgKTtcbiAgcmV0dXJuIHBsdW1wLnJlc3RSZXF1ZXN0KHJlc3RPcHRzKTtcbn07XG5cbi8vIFNDSEVNQSBGVU5DVElPTlNcblxuTW9kZWwuYWRkRGVsdGEgPSBmdW5jdGlvbiBhZGREZWx0YShyZWxOYW1lLCByZWxhdGlvbnNoaXApIHtcbiAgcmV0dXJuIHJlbGF0aW9uc2hpcC5tYXAocmVsID0+IHtcbiAgICBjb25zdCByZWxTY2hlbWEgPSB0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxOYW1lXS50eXBlLiRzaWRlc1tyZWxOYW1lXTtcbiAgICBjb25zdCBzY2hlbWF0aXplZCA9IHsgb3A6ICdhZGQnLCBkYXRhOiB7IGlkOiByZWxbcmVsU2NoZW1hLm90aGVyLmZpZWxkXSB9IH07XG4gICAgZm9yIChjb25zdCByZWxGaWVsZCBpbiByZWwpIHtcbiAgICAgIGlmICghKHJlbEZpZWxkID09PSByZWxTY2hlbWEuc2VsZi5maWVsZCB8fCByZWxGaWVsZCA9PT0gcmVsU2NoZW1hLm90aGVyLmZpZWxkKSkge1xuICAgICAgICBzY2hlbWF0aXplZC5kYXRhW3JlbEZpZWxkXSA9IHJlbFtyZWxGaWVsZF07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzY2hlbWF0aXplZDtcbiAgfSk7XG59O1xuXG5Nb2RlbC5hcHBseURlZmF1bHRzID0gZnVuY3Rpb24gYXBwbHlEZWZhdWx0cyh2KSB7XG4gIGNvbnN0IHJldFZhbCA9IG1lcmdlT3B0aW9ucyh7fSwgdik7XG4gIGZvciAoY29uc3QgYXR0ciBpbiB0aGlzLiRzY2hlbWEuYXR0cmlidXRlcykge1xuICAgIGlmICgnZGVmYXVsdCcgaW4gdGhpcy4kc2NoZW1hLmF0dHJpYnV0ZXNbYXR0cl0gJiYgIShhdHRyIGluIHJldFZhbC5hdHRyaWJ1dGVzKSkge1xuICAgICAgcmV0VmFsLmF0dHJpYnV0ZXNbYXR0cl0gPSB0aGlzLiRzY2hlbWEuYXR0cmlidXRlc1thdHRyXS5kZWZhdWx0O1xuICAgIH1cbiAgfVxuICBPYmplY3Qua2V5cyh0aGlzLiRzY2hlbWEpLmZpbHRlcihrID0+IGsgIT09ICckaWQnKVxuICAuZm9yRWFjaChzY2hlbWFGaWVsZCA9PiB7XG4gICAgZm9yIChjb25zdCBmaWVsZCBpbiB0aGlzLiRzY2hlbWFbc2NoZW1hRmllbGRdKSB7XG4gICAgICBpZiAoIShmaWVsZCBpbiByZXRWYWxbc2NoZW1hRmllbGRdKSkge1xuICAgICAgICBpZiAoJ2RlZmF1bHQnIGluIHRoaXMuJHNjaGVtYVtzY2hlbWFGaWVsZF1bZmllbGRdKSB7XG4gICAgICAgICAgcmV0VmFsW3NjaGVtYUZpZWxkXVtmaWVsZF0gPSB0aGlzLiRzY2hlbWFbc2NoZW1hRmllbGRdW2ZpZWxkXS5kZWZhdWx0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHJldFZhbDtcbn07XG5cbk1vZGVsLmFwcGx5RGVsdGEgPSBmdW5jdGlvbiBhcHBseURlbHRhKGN1cnJlbnQsIGRlbHRhKSB7XG4gIGlmIChkZWx0YS5vcCA9PT0gJ2FkZCcgfHwgZGVsdGEub3AgPT09ICdtb2RpZnknKSB7XG4gICAgY29uc3QgcmV0VmFsID0gbWVyZ2VPcHRpb25zKHt9LCBjdXJyZW50LCBkZWx0YS5kYXRhKTtcbiAgICByZXR1cm4gcmV0VmFsO1xuICB9IGVsc2UgaWYgKGRlbHRhLm9wID09PSAncmVtb3ZlJykge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGN1cnJlbnQ7XG4gIH1cbn07XG5cbk1vZGVsLmFzc2lnbiA9IGZ1bmN0aW9uIGFzc2lnbihvcHRzKSB7XG4gIGNvbnN0IHNjaGVtYXRpemVkID0gdGhpcy5zY2hlbWF0aXplKG9wdHMsIHsgaW5jbHVkZUlkOiB0cnVlIH0pO1xuICBjb25zdCByZXRWYWwgPSB0aGlzLmFwcGx5RGVmYXVsdHMoc2NoZW1hdGl6ZWQpO1xuICBPYmplY3Qua2V5cyh0aGlzLiRzY2hlbWEpLmZpbHRlcihrID0+IGsgIT09ICckaWQnKVxuICAuZm9yRWFjaChzY2hlbWFGaWVsZCA9PiB7XG4gICAgZm9yIChjb25zdCBmaWVsZCBpbiB0aGlzLiRzY2hlbWFbc2NoZW1hRmllbGRdKSB7XG4gICAgICBpZiAoIShmaWVsZCBpbiByZXRWYWxbc2NoZW1hRmllbGRdKSkge1xuICAgICAgICByZXRWYWxbc2NoZW1hRmllbGRdW2ZpZWxkXSA9IHNjaGVtYUZpZWxkID09PSAncmVsYXRpb25zaGlwcycgPyBbXSA6IG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0VmFsLnR5cGUgPSB0aGlzLiRuYW1lO1xuICByZXR1cm4gcmV0VmFsO1xufTtcblxuTW9kZWwucmVzb2x2ZUFuZE92ZXJsYXkgPSBmdW5jdGlvbiByZXNvbHZlQW5kT3ZlcmxheSh1cGRhdGUsIGJhc2UgPSB7IGF0dHJpYnV0ZXM6IHt9LCByZWxhdGlvbnNoaXBzOiB7fSB9KSB7XG4gIGNvbnN0IGF0dHJpYnV0ZXMgPSBtZXJnZU9wdGlvbnMoe30sIGJhc2UuYXR0cmlidXRlcywgdXBkYXRlLmF0dHJpYnV0ZXMpO1xuICBjb25zdCBiYXNlSXNSZXNvbHZlZCA9IE9iamVjdC5rZXlzKGJhc2UucmVsYXRpb25zaGlwcykubWFwKHJlbE5hbWUgPT4ge1xuICAgIHJldHVybiBiYXNlLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0ubWFwKHJlbCA9PiAhKCdvcCcgaW4gcmVsKSkucmVkdWNlKChhY2MsIGN1cnIpID0+IGFjYyAmJiBjdXJyLCB0cnVlKTtcbiAgfSkucmVkdWNlKChhY2MsIGN1cnIpID0+IGFjYyAmJiBjdXJyLCB0cnVlKTtcbiAgY29uc3QgcmVzb2x2ZWRCYXNlUmVscyA9IGJhc2VJc1Jlc29sdmVkID8gYmFzZS5yZWxhdGlvbnNoaXBzIDogdGhpcy5yZXNvbHZlUmVsYXRpb25zaGlwcyhiYXNlLnJlbGF0aW9uc2hpcHMpO1xuICBjb25zdCByZXNvbHZlZFJlbGF0aW9uc2hpcHMgPSB0aGlzLnJlc29sdmVSZWxhdGlvbnNoaXBzKHVwZGF0ZS5yZWxhdGlvbnNoaXBzLCByZXNvbHZlZEJhc2VSZWxzKTtcbiAgcmV0dXJuIHsgYXR0cmlidXRlcywgcmVsYXRpb25zaGlwczogcmVzb2x2ZWRSZWxhdGlvbnNoaXBzIH07XG59O1xuXG5Nb2RlbC5yZXNvbHZlUmVsYXRpb25zaGlwcyA9IGZ1bmN0aW9uIHJlc29sdmVSZWxhdGlvbnNoaXBzKGRlbHRhcywgYmFzZSA9IHt9KSB7XG4gIGNvbnN0IHVwZGF0ZXMgPSBPYmplY3Qua2V5cyhkZWx0YXMpLm1hcChyZWxOYW1lID0+IHtcbiAgICBjb25zdCByZXNvbHZlZCA9IHRoaXMucmVzb2x2ZVJlbGF0aW9uc2hpcChkZWx0YXNbcmVsTmFtZV0sIGJhc2VbcmVsTmFtZV0pO1xuICAgIHJldHVybiB7IFtyZWxOYW1lXTogcmVzb2x2ZWQgfTtcbiAgfSlcbiAgLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBtZXJnZU9wdGlvbnMoYWNjLCBjdXJyKSwge30pO1xuICByZXR1cm4gbWVyZ2VPcHRpb25zKHt9LCBiYXNlLCB1cGRhdGVzKTtcbn07XG5cbk1vZGVsLnJlc29sdmVSZWxhdGlvbnNoaXAgPSBmdW5jdGlvbiByZXNvbHZlUmVsYXRpb25zaGlwKGRlbHRhcywgYmFzZSA9IFtdKSB7XG4gIC8vIEluZGV4IGN1cnJlbnQgcmVsYXRpb25zaGlwcyBieSBJRCBmb3IgZWZmaWNpZW50IG1vZGlmaWNhdGlvblxuICBjb25zdCB1cGRhdGVzID0gYmFzZS5tYXAocmVsID0+IHtcbiAgICByZXR1cm4geyBbcmVsLmlkXTogcmVsIH07XG4gIH0pLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBtZXJnZU9wdGlvbnMoYWNjLCBjdXJyKSwge30pO1xuXG4gIC8vIEFwcGx5IGRlbHRhcyBvbiB0b3Agb2YgdXBkYXRlc1xuICBkZWx0YXMuZm9yRWFjaChkZWx0YSA9PiB7XG4gICAgY29uc3QgY2hpbGRJZCA9IGRlbHRhLmRhdGEgPyBkZWx0YS5kYXRhLmlkIDogZGVsdGEuaWQ7XG4gICAgdXBkYXRlc1tjaGlsZElkXSA9IGRlbHRhLm9wID8gdGhpcy5hcHBseURlbHRhKHVwZGF0ZXNbY2hpbGRJZF0sIGRlbHRhKSA6IGRlbHRhO1xuICB9KTtcblxuICAvLyBSZWR1Y2UgdXBkYXRlcyBiYWNrIGludG8gbGlzdCwgb21pdHRpbmcgdW5kZWZpbmVkc1xuICByZXR1cm4gT2JqZWN0LmtleXModXBkYXRlcylcbiAgICAubWFwKGlkID0+IHVwZGF0ZXNbaWRdKVxuICAgIC5maWx0ZXIocmVsID0+IHJlbCAhPT0gdW5kZWZpbmVkKVxuICAgIC5yZWR1Y2UoKGFjYywgY3VycikgPT4gYWNjLmNvbmNhdChjdXJyKSwgW10pO1xufTtcblxuTW9kZWwuc2NoZW1hdGl6ZSA9IGZ1bmN0aW9uIHNjaGVtYXRpemUodiA9IHt9LCBvcHRzID0geyBpbmNsdWRlSWQ6IGZhbHNlIH0pIHtcbiAgY29uc3QgcmV0VmFsID0ge307XG4gIGlmIChvcHRzLmluY2x1ZGVJZCkge1xuICAgIHJldFZhbC5pZCA9IHRoaXMuJGlkIGluIHYgPyB2W3RoaXMuJGlkXSA6IHYuaWQ7XG4gIH1cbiAgT2JqZWN0LmtleXModGhpcy4kc2NoZW1hKS5maWx0ZXIoayA9PiBrICE9PSAnJGlkJylcbiAgLmZvckVhY2goc2NoZW1hRmllbGQgPT4ge1xuICAgIGlmIChzY2hlbWFGaWVsZCBpbiB2KSB7XG4gICAgICByZXRWYWxbc2NoZW1hRmllbGRdID0gbWVyZ2VPcHRpb25zKHt9LCB2W3NjaGVtYUZpZWxkXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghKHNjaGVtYUZpZWxkIGluIHJldFZhbCkpIHtcbiAgICAgICAgcmV0VmFsW3NjaGVtYUZpZWxkXSA9IHt9O1xuICAgICAgfVxuICAgICAgZm9yIChjb25zdCBmaWVsZCBpbiB0aGlzLiRzY2hlbWFbc2NoZW1hRmllbGRdKSB7XG4gICAgICAgIGlmIChmaWVsZCBpbiB2KSB7XG4gICAgICAgICAgcmV0VmFsW3NjaGVtYUZpZWxkXVtmaWVsZF0gPSBzY2hlbWFGaWVsZCA9PT0gJ3JlbGF0aW9uc2hpcHMnID8gdGhpcy5hZGREZWx0YShmaWVsZCwgdltmaWVsZF0pIDogdltmaWVsZF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcmV0VmFsO1xufTtcblxuLy8gTUVUQURBVEFcblxuTW9kZWwuJGlkID0gJ2lkJztcbk1vZGVsLiRuYW1lID0gJ0Jhc2UnO1xuTW9kZWwuJHNjaGVtYSA9IHtcbiAgJGlkOiAnaWQnLFxuICBhdHRyaWJ1dGVzOiB7fSxcbiAgcmVsYXRpb25zaGlwczoge30sXG59O1xuTW9kZWwuJGluY2x1ZGVkID0gW107XG4iXX0=
