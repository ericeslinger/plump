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
        return _this5;
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRkaXJ0eSIsIlN5bWJvbCIsIiRwbHVtcCIsIiR1bnN1YnNjcmliZSIsIiRzdWJqZWN0IiwiJGFsbCIsIk1vZGVsIiwib3B0cyIsInBsdW1wIiwiRXJyb3IiLCJhdHRyaWJ1dGVzIiwicmVsYXRpb25zaGlwcyIsIm5leHQiLCIkJGNvcHlWYWx1ZXNGcm9tIiwiaWRGaWVsZCIsImNvbnN0cnVjdG9yIiwiJGlkIiwic2NoZW1hdGl6ZSIsInVuZGVmaW5lZCIsInN1YnNjcmliZSIsIiRuYW1lIiwiZmllbGQiLCJ2YWx1ZSIsImZpZWxkcyIsImNiIiwibGVuZ3RoIiwiQXJyYXkiLCJpc0FycmF5IiwiJCRob29rVG9QbHVtcCIsInN0cmVhbUdldCIsInYiLCIkJGZpcmVVcGRhdGUiLCJzdWJzY3JpYmVPbiIsImtleSIsIiRkaXJ0eUZpZWxkcyIsIm5ld0RpcnR5Iiwia2V5cyIsIk9iamVjdCIsImZvckVhY2giLCJzY2hlbWFGaWVsZCIsImluZGV4T2YiLCJ2YWwiLCJ1cGRhdGUiLCJyZXNvbHZlQW5kT3ZlcmxheSIsImlkIiwidW5zdWJzY3JpYmUiLCIkc2NoZW1hIiwiZ2V0IiwidGhlbiIsInNlbGYiLCJzY2hlbWF0aXplZCIsIndpdGhEaXJ0eSIsInJldFZhbCIsImFwcGx5RGVmYXVsdHMiLCJ0eXBlIiwiYnVsa0dldCIsIm9wdGlvbnMiLCIkZmllbGRzIiwibWFwIiwiZmlsdGVyIiwicmVkdWNlIiwiYWNjIiwiY3VyciIsImFzc2lnbiIsInNhdmUiLCJ1cGRhdGVkIiwiJCRyZXNldERpcnR5IiwiZmxhdCIsInNhbml0aXplZCIsImsiLCJkZWxldGUiLCJkYXRhIiwicmVzdE9wdHMiLCJ1cmwiLCJyZXN0UmVxdWVzdCIsIml0ZW0iLCJleHRyYXMiLCIkc2lkZXMiLCJvdGhlciIsInB1c2giLCJvcCIsIm1ldGEiLCJjb25jYXQiLCJmcm9tSlNPTiIsImpzb24iLCIkaW5jbHVkZSIsInJlbCIsIkR5bmFtaWNSZWxhdGlvbnNoaXAiLCJ0b0pTT04iLCIkcmVzdCIsImFkZERlbHRhIiwicmVsTmFtZSIsInJlbGF0aW9uc2hpcCIsInJlbFNjaGVtYSIsInJlbEZpZWxkIiwiYXR0ciIsImRlZmF1bHQiLCJhcHBseURlbHRhIiwiY3VycmVudCIsImRlbHRhIiwiaW5jbHVkZUlkIiwiY2FjaGVHZXQiLCJzdG9yZSIsIiQkc3RvcmVDYWNoZSIsImNhY2hlU2V0Iiwic2V0IiwiYmFzZSIsImJhc2VJc1Jlc29sdmVkIiwicmVzb2x2ZWRCYXNlUmVscyIsInJlc29sdmVSZWxhdGlvbnNoaXBzIiwicmVzb2x2ZWRSZWxhdGlvbnNoaXBzIiwiZGVsdGFzIiwidXBkYXRlcyIsInJlc29sdmVkIiwicmVzb2x2ZVJlbGF0aW9uc2hpcCIsImNoaWxkSWQiLCJNYXAiLCIkaW5jbHVkZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7QUFFQTs7Ozs7Ozs7Ozs7O0FBQ0EsSUFBTUEsU0FBU0MsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNQyxTQUFTRCxPQUFPLFFBQVAsQ0FBZjtBQUNBLElBQU1FLGVBQWVGLE9BQU8sY0FBUCxDQUFyQjtBQUNBLElBQU1HLFdBQVdILE9BQU8sVUFBUCxDQUFqQjtBQUNPLElBQU1JLHNCQUFPSixPQUFPLE1BQVAsQ0FBYjs7QUFFUDtBQUNBOztJQUVhSyxLLFdBQUFBLEs7QUFDWCxpQkFBWUMsSUFBWixFQUFrQkMsS0FBbEIsRUFBeUI7QUFBQTs7QUFDdkIsUUFBSUEsS0FBSixFQUFXO0FBQ1QsV0FBS04sTUFBTCxJQUFlTSxLQUFmO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsWUFBTSxJQUFJQyxLQUFKLENBQVUsOENBQVYsQ0FBTjtBQUNEO0FBQ0Q7QUFDQSxTQUFLVCxNQUFMLElBQWU7QUFDYlUsa0JBQVksRUFEQyxFQUNHO0FBQ2hCQyxxQkFBZSxFQUZGLEVBQWY7QUFJQSxTQUFLUCxRQUFMLElBQWlCLHlCQUFqQjtBQUNBLFNBQUtBLFFBQUwsRUFBZVEsSUFBZixDQUFvQixFQUFwQjtBQUNBLFNB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QUFPYixXQUFQLElBQXNCLDRCQUFhLEVBQWIsRUFBaUJULEVBQUVTLFdBQUYsQ0FBakIsQ0FBdEI7QUFDRCxLQUZELE1BRU87QUFDTCxVQUFJLEVBQUVBLGVBQWVhLE1BQWpCLENBQUosRUFBOEI7QUFDNUJBLGVBQU9iLFdBQVAsSUFBc0IsRUFBdEI7QUFDRDtBQUNELFdBQUssSUFBTWxCLEtBQVgsSUFBb0IsUUFBS3lCLE9BQUwsQ0FBYVAsV0FBYixDQUFwQixFQUErQztBQUM3QyxZQUFJbEIsU0FBU1MsQ0FBYixFQUFnQjtBQUNkc0IsaUJBQU9iLFdBQVAsRUFBb0JsQixLQUFwQixJQUE2QmtCLGdCQUFnQixlQUFoQixHQUFrQyxRQUFLbUQsUUFBTCxDQUFjckUsS0FBZCxFQUFxQlMsRUFBRVQsS0FBRixDQUFyQixDQUFsQyxHQUFtRVMsRUFBRVQsS0FBRixDQUFoRztBQUNEO0FBQ0Y7QUFDRjtBQUNGLEdBZEQ7QUFlQSxTQUFPK0IsTUFBUDtBQUNELENBckJEOztBQXVCQTs7QUFFQTlDLE1BQU1pRyxZQUFOLEdBQXFCLElBQUlhLEdBQUosRUFBckI7O0FBRUE5RyxNQUFNVSxHQUFOLEdBQVksSUFBWjtBQUNBVixNQUFNYyxLQUFOLEdBQWMsTUFBZDtBQUNBZCxNQUFNd0MsT0FBTixHQUFnQjtBQUNkOUIsT0FBSyxJQURTO0FBRWROLGNBQVksRUFGRTtBQUdkQyxpQkFBZTtBQUhELENBQWhCO0FBS0FMLE1BQU0rRyxTQUFOLEdBQWtCLEVBQWxCIiwiZmlsZSI6Im1vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcbmltcG9ydCB7IEJlaGF2aW9yU3ViamVjdCB9IGZyb20gJ3J4anMvUngnO1xuXG5pbXBvcnQgeyBSZWxhdGlvbnNoaXAgfSBmcm9tICcuL3JlbGF0aW9uc2hpcCc7XG5jb25zdCAkZGlydHkgPSBTeW1ib2woJyRkaXJ0eScpO1xuY29uc3QgJHBsdW1wID0gU3ltYm9sKCckcGx1bXAnKTtcbmNvbnN0ICR1bnN1YnNjcmliZSA9IFN5bWJvbCgnJHVuc3Vic2NyaWJlJyk7XG5jb25zdCAkc3ViamVjdCA9IFN5bWJvbCgnJHN1YmplY3QnKTtcbmV4cG9ydCBjb25zdCAkYWxsID0gU3ltYm9sKCckYWxsJyk7XG5cbi8vIFRPRE86IGZpZ3VyZSBvdXQgd2hlcmUgZXJyb3IgZXZlbnRzIG9yaWdpbmF0ZSAoc3RvcmFnZSBvciBtb2RlbClcbi8vIGFuZCB3aG8ga2VlcHMgYSByb2xsLWJhY2thYmxlIGRlbHRhXG5cbmV4cG9ydCBjbGFzcyBNb2RlbCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMsIHBsdW1wKSB7XG4gICAgaWYgKHBsdW1wKSB7XG4gICAgICB0aGlzWyRwbHVtcF0gPSBwbHVtcDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY29uc3RydWN0IFBsdW1wIG1vZGVsIHdpdGhvdXQgYSBQbHVtcCcpO1xuICAgIH1cbiAgICAvLyBUT0RPOiBEZWZpbmUgRGVsdGEgaW50ZXJmYWNlXG4gICAgdGhpc1skZGlydHldID0ge1xuICAgICAgYXR0cmlidXRlczoge30sIC8vIFNpbXBsZSBrZXktdmFsdWVcbiAgICAgIHJlbGF0aW9uc2hpcHM6IHt9LCAvLyByZWxOYW1lOiBEZWx0YVtdXG4gICAgfTtcbiAgICB0aGlzWyRzdWJqZWN0XSA9IG5ldyBCZWhhdmlvclN1YmplY3QoKTtcbiAgICB0aGlzWyRzdWJqZWN0XS5uZXh0KHt9KTtcbiAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20ob3B0cyk7XG4gICAgLy8gdGhpcy4kJGZpcmVVcGRhdGUob3B0cyk7XG4gIH1cblxuICAvLyBDT05WRU5JRU5DRSBBQ0NFU1NPUlNcblxuICBnZXQgJG5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuJG5hbWU7XG4gIH1cblxuICBnZXQgJGlkKCkge1xuICAgIHJldHVybiB0aGlzW3RoaXMuY29uc3RydWN0b3IuJGlkXTtcbiAgfVxuXG4gIGdldCAkZmllbGRzKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLiRzY2hlbWEuYXR0cmlidXRlcylcbiAgICAuY29uY2F0KE9iamVjdC5rZXlzKHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzKSk7XG4gIH1cblxuICBnZXQgJHNjaGVtYSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci4kc2NoZW1hO1xuICB9XG5cbiAgZ2V0ICRkaXJ0eUZpZWxkcygpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpc1skZGlydHldKVxuICAgIC5tYXAoayA9PiBPYmplY3Qua2V5cyh0aGlzWyRkaXJ0eV1ba10pKVxuICAgIC5yZWR1Y2UoKGFjYywgY3VycikgPT4gYWNjLmNvbmNhdChjdXJyKSwgW10pXG4gICAgLmZpbHRlcihrID0+IGsgIT09IHRoaXMuY29uc3RydWN0b3IuJGlkKSAvLyBpZCBzaG91bGQgbmV2ZXIgYmUgZGlydHlcbiAgICAucmVkdWNlKChhY2MsIGN1cnIpID0+IGFjYy5jb25jYXQoY3VyciksIFtdKTtcbiAgfVxuXG4gIC8vIFdJUklOR1xuXG4gICQkY29weVZhbHVlc0Zyb20ob3B0cyA9IHt9KSB7XG4gICAgY29uc3QgaWRGaWVsZCA9IHRoaXMuY29uc3RydWN0b3IuJGlkIGluIG9wdHMgPyB0aGlzLmNvbnN0cnVjdG9yLiRpZCA6ICdpZCc7XG4gICAgdGhpc1t0aGlzLmNvbnN0cnVjdG9yLiRpZF0gPSBvcHRzW2lkRmllbGRdIHx8IHRoaXMuJGlkO1xuICAgIHRoaXNbJGRpcnR5XSA9IHRoaXMuY29uc3RydWN0b3Iuc2NoZW1hdGl6ZShvcHRzKTtcbiAgfVxuXG4gICQkaG9va1RvUGx1bXAoKSB7XG4gICAgaWYgKHRoaXNbJHVuc3Vic2NyaWJlXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyR1bnN1YnNjcmliZV0gPSB0aGlzWyRwbHVtcF0uc3Vic2NyaWJlKHRoaXMuY29uc3RydWN0b3IuJG5hbWUsIHRoaXMuJGlkLCAoeyBmaWVsZCwgdmFsdWUgfSkgPT4ge1xuICAgICAgICBpZiAoZmllbGQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHsgW2ZpZWxkXTogdmFsdWUgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gICRzdWJzY3JpYmUoLi4uYXJncykge1xuICAgIGxldCBmaWVsZHMgPSBbJ2F0dHJpYnV0ZXMnXTtcbiAgICBsZXQgY2I7XG4gICAgaWYgKGFyZ3MubGVuZ3RoID09PSAyKSB7XG4gICAgICBmaWVsZHMgPSBhcmdzWzBdO1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGZpZWxkcykpIHtcbiAgICAgICAgZmllbGRzID0gW2ZpZWxkc107XG4gICAgICB9XG4gICAgICBjYiA9IGFyZ3NbMV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGNiID0gYXJnc1swXTtcbiAgICB9XG4gICAgdGhpcy4kJGhvb2tUb1BsdW1wKCk7XG4gICAgdGhpc1skcGx1bXBdLnN0cmVhbUdldCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwgZmllbGRzKVxuICAgIC5zdWJzY3JpYmUoKHYpID0+IHtcbiAgICAgIHRoaXMuJCRmaXJlVXBkYXRlKHYpO1xuICAgIH0pO1xuICAgIHJldHVybiB0aGlzWyRzdWJqZWN0XS5zdWJzY3JpYmVPbihjYik7XG4gIH1cblxuICAkJHJlc2V0RGlydHkob3B0cykge1xuICAgIGNvbnN0IGtleSA9IG9wdHMgfHwgdGhpcy4kZGlydHlGaWVsZHM7XG4gICAgY29uc3QgbmV3RGlydHkgPSB7IGF0dHJpYnV0ZXM6IHt9LCByZWxhdGlvbnNoaXBzOiB7fSB9O1xuICAgIGNvbnN0IGtleXMgPSBBcnJheS5pc0FycmF5KGtleSkgPyBrZXkgOiBba2V5XTtcbiAgICBPYmplY3Qua2V5cyh0aGlzWyRkaXJ0eV0pLmZvckVhY2goc2NoZW1hRmllbGQgPT4ge1xuICAgICAgZm9yIChjb25zdCBmaWVsZCBpbiB0aGlzWyRkaXJ0eV1bc2NoZW1hRmllbGRdKSB7XG4gICAgICAgIGlmIChrZXlzLmluZGV4T2YoZmllbGQpIDwgMCkge1xuICAgICAgICAgIGNvbnN0IHZhbCA9IHRoaXNbJGRpcnR5XVtzY2hlbWFGaWVsZF1bZmllbGRdO1xuICAgICAgICAgIG5ld0RpcnR5W3NjaGVtYUZpZWxkXVtmaWVsZF0gPSB0eXBlb2YgdmFsID09PSAnb2JqZWN0JyA/IG1lcmdlT3B0aW9ucyh7fSwgdmFsKSA6IHZhbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXNbJGRpcnR5XSA9IG5ld0RpcnR5O1xuICB9XG5cbiAgJCRmaXJlVXBkYXRlKHYpIHtcbiAgICBjb25zdCB1cGRhdGUgPSB0aGlzLmNvbnN0cnVjdG9yLnJlc29sdmVBbmRPdmVybGF5KHRoaXNbJGRpcnR5XSwgdik7XG4gICAgaWYgKHRoaXMuJGlkKSB7XG4gICAgICB1cGRhdGUuaWQgPSB0aGlzLiRpZDtcbiAgICB9XG4gICAgdGhpc1skc3ViamVjdF0ubmV4dCh1cGRhdGUpO1xuICB9XG5cbiAgJHRlYXJkb3duKCkge1xuICAgIGlmICh0aGlzWyR1bnN1YnNjcmliZV0pIHtcbiAgICAgIHRoaXNbJHVuc3Vic2NyaWJlXS51bnN1YnNjcmliZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEFQSSBNRVRIT0RTXG5cbiAgJGdldChvcHRzKSB7XG4gICAgLy8gSWYgb3B0cyBpcyBmYWxzeSAoaS5lLiwgdW5kZWZpbmVkKSwgZ2V0IGF0dHJpYnV0ZXNcbiAgICAvLyBPdGhlcndpc2UsIGdldCB3aGF0IHdhcyByZXF1ZXN0ZWQsXG4gICAgLy8gd3JhcHBpbmcgdGhlIHJlcXVlc3QgaW4gYSBBcnJheSBpZiBpdCB3YXNuJ3QgYWxyZWFkeSBvbmVcbiAgICBsZXQga2V5cyA9IG9wdHMgJiYgIUFycmF5LmlzQXJyYXkob3B0cykgPyBbb3B0c10gOiBvcHRzO1xuICAgIGlmIChrZXlzICYmIGtleXMuaW5kZXhPZigkYWxsKSA+PSAwKSB7XG4gICAgICBrZXlzID0gT2JqZWN0LmtleXModGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHMpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLmdldCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5cylcbiAgICAudGhlbihzZWxmID0+IHtcbiAgICAgIGlmICghc2VsZiAmJiB0aGlzLiRkaXJ0eUZpZWxkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBzY2hlbWF0aXplZCA9IHRoaXMuY29uc3RydWN0b3Iuc2NoZW1hdGl6ZShzZWxmIHx8IHt9KTtcbiAgICAgICAgY29uc3Qgd2l0aERpcnR5ID0gdGhpcy5jb25zdHJ1Y3Rvci5yZXNvbHZlQW5kT3ZlcmxheSh0aGlzWyRkaXJ0eV0sIHNjaGVtYXRpemVkKTtcbiAgICAgICAgY29uc3QgcmV0VmFsID0gdGhpcy5jb25zdHJ1Y3Rvci5hcHBseURlZmF1bHRzKHdpdGhEaXJ0eSk7XG4gICAgICAgIHJldFZhbC50eXBlID0gdGhpcy4kbmFtZTtcbiAgICAgICAgcmV0VmFsLmlkID0gdGhpcy4kaWQ7XG4gICAgICAgIHJldHVybiByZXRWYWw7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAkYnVsa0dldCgpIHtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLmJ1bGtHZXQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQpO1xuICB9XG5cbiAgLy8gVE9ETzogU2hvdWxkICRzYXZlIHVsdGltYXRlbHkgcmV0dXJuIHRoaXMuJGdldCgpP1xuICAkc2F2ZShvcHRzKSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdHMgfHwgdGhpcy4kZmllbGRzO1xuICAgIGNvbnN0IGtleXMgPSBBcnJheS5pc0FycmF5KG9wdGlvbnMpID8gb3B0aW9ucyA6IFtvcHRpb25zXTtcblxuICAgIC8vIERlZXAgY29weSBkaXJ0eSBjYWNoZSwgZmlsdGVyaW5nIG91dCBrZXlzIHRoYXQgYXJlIG5vdCBpbiBvcHRzXG4gICAgY29uc3QgdXBkYXRlID0gT2JqZWN0LmtleXModGhpc1skZGlydHldKS5tYXAoc2NoZW1hRmllbGQgPT4ge1xuICAgICAgY29uc3QgdmFsdWUgPSBPYmplY3Qua2V5cyh0aGlzWyRkaXJ0eV1bc2NoZW1hRmllbGRdKVxuICAgICAgICAuZmlsdGVyKGtleSA9PiBrZXlzLmluZGV4T2Yoa2V5KSA+PSAwKVxuICAgICAgICAubWFwKGtleSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHsgW2tleV06IHRoaXNbJGRpcnR5XVtzY2hlbWFGaWVsZF1ba2V5XSB9O1xuICAgICAgICB9KVxuICAgICAgICAucmVkdWNlKChhY2MsIGN1cnIpID0+IE9iamVjdC5hc3NpZ24oYWNjLCBjdXJyKSwge30pO1xuXG4gICAgICByZXR1cm4geyBbc2NoZW1hRmllbGRdOiB2YWx1ZSB9O1xuICAgIH0pLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBPYmplY3QuYXNzaWduKGFjYywgY3VyciksIHt9KTtcblxuICAgIGlmICh0aGlzLiRpZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB1cGRhdGVbdGhpcy5jb25zdHJ1Y3Rvci4kaWRdID0gdGhpcy4kaWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5zYXZlKHRoaXMuY29uc3RydWN0b3IsIHVwZGF0ZSlcbiAgICAudGhlbigodXBkYXRlZCkgPT4ge1xuICAgICAgdGhpcy4kJHJlc2V0RGlydHkob3B0cyk7XG4gICAgICBpZiAodXBkYXRlZC5pZCkge1xuICAgICAgICB0aGlzW3RoaXMuY29uc3RydWN0b3IuJGlkXSA9IHVwZGF0ZWQuaWQ7XG4gICAgICB9XG4gICAgICAvLyB0aGlzLiQkZmlyZVVwZGF0ZSh1cGRhdGVkKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0pO1xuICB9XG5cbiAgJHNldCh1cGRhdGUpIHtcbiAgICBjb25zdCBmbGF0ID0gdXBkYXRlLmF0dHJpYnV0ZXMgfHwgdXBkYXRlO1xuICAgIC8vIEZpbHRlciBvdXQgbm9uLWF0dHJpYnV0ZSBrZXlzXG4gICAgY29uc3Qgc2FuaXRpemVkID0gT2JqZWN0LmtleXMoZmxhdClcbiAgICAgIC5maWx0ZXIoayA9PiBrIGluIHRoaXMuJHNjaGVtYS5hdHRyaWJ1dGVzKVxuICAgICAgLm1hcChrID0+IHsgcmV0dXJuIHsgW2tdOiBmbGF0W2tdIH07IH0pXG4gICAgICAucmVkdWNlKChhY2MsIGN1cnIpID0+IG1lcmdlT3B0aW9ucyhhY2MsIGN1cnIpLCB7fSk7XG5cbiAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20oc2FuaXRpemVkKTtcbiAgICAvLyB0aGlzLiQkZmlyZVVwZGF0ZShzYW5pdGl6ZWQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgJGRlbGV0ZSgpIHtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLmRlbGV0ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZClcbiAgICAudGhlbihkYXRhID0+IGRhdGEubWFwKHRoaXMuY29uc3RydWN0b3Iuc2NoZW1hdGl6ZSkpO1xuICB9XG5cbiAgJHJlc3Qob3B0cykge1xuICAgIGNvbnN0IHJlc3RPcHRzID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAgb3B0cyxcbiAgICAgIHtcbiAgICAgICAgdXJsOiBgLyR7dGhpcy5jb25zdHJ1Y3Rvci4kbmFtZX0vJHt0aGlzLiRpZH0vJHtvcHRzLnVybH1gLFxuICAgICAgfVxuICAgICk7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5yZXN0UmVxdWVzdChyZXN0T3B0cykudGhlbihkYXRhID0+IHRoaXMuY29uc3RydWN0b3Iuc2NoZW1hdGl6ZShkYXRhKSk7XG4gIH1cblxuICAkYWRkKGtleSwgaXRlbSwgZXh0cmFzKSB7XG4gICAgaWYgKHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW2tleV0pIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSBpZiAoaXRlbS5pZCkge1xuICAgICAgICBpZCA9IGl0ZW0uaWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW1bdGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHNba2V5XS50eXBlLiRzaWRlc1trZXldLm90aGVyLmZpZWxkXTtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIGlmICghKGtleSBpbiB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwcykpIHtcbiAgICAgICAgICB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwc1trZXldID0gW107XG4gICAgICAgIH1cbiAgICAgICAgdGhpc1skZGlydHldLnJlbGF0aW9uc2hpcHNba2V5XS5wdXNoKHtcbiAgICAgICAgICBvcDogJ2FkZCcsXG4gICAgICAgICAgZGF0YTogT2JqZWN0LmFzc2lnbih7IGlkIH0sIHsgbWV0YTogZXh0cmFzIH0pLFxuICAgICAgICB9KTtcbiAgICAgICAgLy8gdGhpcy4kJGZpcmVVcGRhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSBhZGRlZCB0byBoYXNNYW55Jyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90ICRhZGQgZXhjZXB0IHRvIGhhc01hbnkgZmllbGQnKTtcbiAgICB9XG4gIH1cblxuICAkbW9kaWZ5UmVsYXRpb25zaGlwKGtleSwgaXRlbSwgZXh0cmFzKSB7XG4gICAgaWYgKGtleSBpbiB0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwcykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIGlmICghKGtleSBpbiB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwcykpIHtcbiAgICAgICAgICB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwc1trZXldID0gW107XG4gICAgICAgIH1cbiAgICAgICAgdGhpc1skZGlydHldLnJlbGF0aW9uc2hpcHNba2V5XS5wdXNoKHtcbiAgICAgICAgICBvcDogJ21vZGlmeScsXG4gICAgICAgICAgZGF0YTogT2JqZWN0LmFzc2lnbih7IGlkIH0sIHsgbWV0YTogZXh0cmFzIH0pLFxuICAgICAgICB9KTtcbiAgICAgICAgLy8gdGhpcy4kJGZpcmVVcGRhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSBhZGRlZCB0byBoYXNNYW55Jyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90ICRhZGQgZXhjZXB0IHRvIGhhc01hbnkgZmllbGQnKTtcbiAgICB9XG4gIH1cblxuICAkcmVtb3ZlKGtleSwgaXRlbSkge1xuICAgIGlmIChrZXkgaW4gdGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHMpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICBpZiAoIShrZXkgaW4gdGhpc1skZGlydHldLnJlbGF0aW9uc2hpcHMpKSB7XG4gICAgICAgICAgdGhpc1skZGlydHldLnJlbGF0aW9uc2hpcHNba2V5XSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzW2tleV0ucHVzaCh7XG4gICAgICAgICAgb3A6ICdyZW1vdmUnLFxuICAgICAgICAgIGRhdGE6IHsgaWQgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHRoaXMuJCRmaXJlVXBkYXRlKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gJHJlbW92ZWQgZnJvbSBoYXNNYW55Jyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90ICRyZW1vdmUgZXhjZXB0IGZyb20gaGFzTWFueSBmaWVsZCcpO1xuICAgIH1cbiAgfVxufVxuXG5Nb2RlbC5mcm9tSlNPTiA9IGZ1bmN0aW9uIGZyb21KU09OKGpzb24pIHtcbiAgdGhpcy4kaWQgPSBqc29uLiRpZCB8fCAnaWQnO1xuICB0aGlzLiRuYW1lID0ganNvbi4kbmFtZTtcbiAgdGhpcy4kaW5jbHVkZSA9IGpzb24uJGluY2x1ZGU7XG4gIHRoaXMuJHNjaGVtYSA9IHtcbiAgICBhdHRyaWJ1dGVzOiBtZXJnZU9wdGlvbnMoanNvbi4kc2NoZW1hLmF0dHJpYnV0ZXMpLFxuICAgIHJlbGF0aW9uc2hpcHM6IHt9LFxuICB9O1xuICBmb3IgKGNvbnN0IHJlbCBpbiBqc29uLiRzY2hlbWEucmVsYXRpb25zaGlwcykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGd1YXJkLWZvci1pblxuICAgIHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbF0gPSB7fTtcbiAgICBjbGFzcyBEeW5hbWljUmVsYXRpb25zaGlwIGV4dGVuZHMgUmVsYXRpb25zaGlwIHt9XG4gICAgRHluYW1pY1JlbGF0aW9uc2hpcC5mcm9tSlNPTihqc29uLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxdKTtcbiAgICB0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxdLnR5cGUgPSBEeW5hbWljUmVsYXRpb25zaGlwO1xuICB9XG59O1xuXG5Nb2RlbC50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04oKSB7XG4gIGNvbnN0IHJldFZhbCA9IHtcbiAgICAkaWQ6IHRoaXMuJGlkLFxuICAgICRuYW1lOiB0aGlzLiRuYW1lLFxuICAgICRpbmNsdWRlOiB0aGlzLiRpbmNsdWRlLFxuICAgICRzY2hlbWE6IHsgYXR0cmlidXRlczogdGhpcy4kc2NoZW1hLmF0dHJpYnV0ZXMsIHJlbGF0aW9uc2hpcHM6IHt9IH0sXG4gIH07XG4gIGZvciAoY29uc3QgcmVsIGluIHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZ3VhcmQtZm9yLWluXG4gICAgcmV0VmFsLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxdID0gdGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsXS50eXBlLnRvSlNPTigpO1xuICB9XG4gIHJldHVybiByZXRWYWw7XG59O1xuXG5Nb2RlbC4kcmVzdCA9IGZ1bmN0aW9uICRyZXN0KHBsdW1wLCBvcHRzKSB7XG4gIGNvbnN0IHJlc3RPcHRzID0gT2JqZWN0LmFzc2lnbihcbiAgICB7fSxcbiAgICBvcHRzLFxuICAgIHtcbiAgICAgIHVybDogYC8ke3RoaXMuJG5hbWV9LyR7b3B0cy51cmx9YCxcbiAgICB9XG4gICk7XG4gIHJldHVybiBwbHVtcC5yZXN0UmVxdWVzdChyZXN0T3B0cyk7XG59O1xuXG4vLyBTQ0hFTUEgRlVOQ1RJT05TXG5cbk1vZGVsLmFkZERlbHRhID0gZnVuY3Rpb24gYWRkRGVsdGEocmVsTmFtZSwgcmVsYXRpb25zaGlwKSB7XG4gIHJldHVybiByZWxhdGlvbnNoaXAubWFwKHJlbCA9PiB7XG4gICAgY29uc3QgcmVsU2NoZW1hID0gdGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0udHlwZS4kc2lkZXNbcmVsTmFtZV07XG4gICAgY29uc3Qgc2NoZW1hdGl6ZWQgPSB7IG9wOiAnYWRkJywgZGF0YTogeyBpZDogcmVsW3JlbFNjaGVtYS5vdGhlci5maWVsZF0gfSB9O1xuICAgIGZvciAoY29uc3QgcmVsRmllbGQgaW4gcmVsKSB7XG4gICAgICBpZiAoIShyZWxGaWVsZCA9PT0gcmVsU2NoZW1hLnNlbGYuZmllbGQgfHwgcmVsRmllbGQgPT09IHJlbFNjaGVtYS5vdGhlci5maWVsZCkpIHtcbiAgICAgICAgc2NoZW1hdGl6ZWQuZGF0YVtyZWxGaWVsZF0gPSByZWxbcmVsRmllbGRdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2NoZW1hdGl6ZWQ7XG4gIH0pO1xufTtcblxuTW9kZWwuYXBwbHlEZWZhdWx0cyA9IGZ1bmN0aW9uIGFwcGx5RGVmYXVsdHModikge1xuICBjb25zdCByZXRWYWwgPSBtZXJnZU9wdGlvbnMoe30sIHYpO1xuICBmb3IgKGNvbnN0IGF0dHIgaW4gdGhpcy4kc2NoZW1hLmF0dHJpYnV0ZXMpIHtcbiAgICBpZiAoJ2RlZmF1bHQnIGluIHRoaXMuJHNjaGVtYS5hdHRyaWJ1dGVzW2F0dHJdICYmICEoYXR0ciBpbiByZXRWYWwuYXR0cmlidXRlcykpIHtcbiAgICAgIHJldFZhbC5hdHRyaWJ1dGVzW2F0dHJdID0gdGhpcy4kc2NoZW1hLmF0dHJpYnV0ZXNbYXR0cl0uZGVmYXVsdDtcbiAgICB9XG4gIH1cbiAgT2JqZWN0LmtleXModGhpcy4kc2NoZW1hKS5maWx0ZXIoayA9PiBrICE9PSAnJGlkJylcbiAgLmZvckVhY2goc2NoZW1hRmllbGQgPT4ge1xuICAgIGZvciAoY29uc3QgZmllbGQgaW4gdGhpcy4kc2NoZW1hW3NjaGVtYUZpZWxkXSkge1xuICAgICAgaWYgKCEoZmllbGQgaW4gcmV0VmFsW3NjaGVtYUZpZWxkXSkpIHtcbiAgICAgICAgaWYgKCdkZWZhdWx0JyBpbiB0aGlzLiRzY2hlbWFbc2NoZW1hRmllbGRdW2ZpZWxkXSkge1xuICAgICAgICAgIHJldFZhbFtzY2hlbWFGaWVsZF1bZmllbGRdID0gdGhpcy4kc2NoZW1hW3NjaGVtYUZpZWxkXVtmaWVsZF0uZGVmYXVsdDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZXRWYWw7XG59O1xuXG5Nb2RlbC5hcHBseURlbHRhID0gZnVuY3Rpb24gYXBwbHlEZWx0YShjdXJyZW50LCBkZWx0YSkge1xuICBpZiAoZGVsdGEub3AgPT09ICdhZGQnIHx8IGRlbHRhLm9wID09PSAnbW9kaWZ5Jykge1xuICAgIGNvbnN0IHJldFZhbCA9IG1lcmdlT3B0aW9ucyh7fSwgY3VycmVudCwgZGVsdGEuZGF0YSk7XG4gICAgcmV0dXJuIHJldFZhbDtcbiAgfSBlbHNlIGlmIChkZWx0YS5vcCA9PT0gJ3JlbW92ZScpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBjdXJyZW50O1xuICB9XG59O1xuXG5Nb2RlbC5hc3NpZ24gPSBmdW5jdGlvbiBhc3NpZ24ob3B0cykge1xuICBjb25zdCBzY2hlbWF0aXplZCA9IHRoaXMuc2NoZW1hdGl6ZShvcHRzLCB7IGluY2x1ZGVJZDogdHJ1ZSB9KTtcbiAgY29uc3QgcmV0VmFsID0gdGhpcy5hcHBseURlZmF1bHRzKHNjaGVtYXRpemVkKTtcbiAgT2JqZWN0LmtleXModGhpcy4kc2NoZW1hKS5maWx0ZXIoayA9PiBrICE9PSAnJGlkJylcbiAgLmZvckVhY2goc2NoZW1hRmllbGQgPT4ge1xuICAgIGZvciAoY29uc3QgZmllbGQgaW4gdGhpcy4kc2NoZW1hW3NjaGVtYUZpZWxkXSkge1xuICAgICAgaWYgKCEoZmllbGQgaW4gcmV0VmFsW3NjaGVtYUZpZWxkXSkpIHtcbiAgICAgICAgcmV0VmFsW3NjaGVtYUZpZWxkXVtmaWVsZF0gPSBzY2hlbWFGaWVsZCA9PT0gJ3JlbGF0aW9uc2hpcHMnID8gW10gOiBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIHJldFZhbC50eXBlID0gdGhpcy4kbmFtZTtcbiAgcmV0dXJuIHJldFZhbDtcbn07XG5cbk1vZGVsLmNhY2hlR2V0ID0gZnVuY3Rpb24gY2FjaGVHZXQoc3RvcmUsIGtleSkge1xuICByZXR1cm4gKHRoaXMuJCRzdG9yZUNhY2hlLmdldChzdG9yZSkgfHwge30pW2tleV07XG59O1xuXG5Nb2RlbC5jYWNoZVNldCA9IGZ1bmN0aW9uIGNhY2hlU2V0KHN0b3JlLCBrZXksIHZhbHVlKSB7XG4gIGlmICh0aGlzLiQkc3RvcmVDYWNoZS5nZXQoc3RvcmUpID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLiQkc3RvcmVDYWNoZS5zZXQoc3RvcmUsIHt9KTtcbiAgfVxuICB0aGlzLiQkc3RvcmVDYWNoZS5nZXQoc3RvcmUpW2tleV0gPSB2YWx1ZTtcbn07XG5cbk1vZGVsLnJlc29sdmVBbmRPdmVybGF5ID0gZnVuY3Rpb24gcmVzb2x2ZUFuZE92ZXJsYXkodXBkYXRlLCBiYXNlID0geyBhdHRyaWJ1dGVzOiB7fSwgcmVsYXRpb25zaGlwczoge30gfSkge1xuICBjb25zdCBhdHRyaWJ1dGVzID0gbWVyZ2VPcHRpb25zKHt9LCBiYXNlLmF0dHJpYnV0ZXMsIHVwZGF0ZS5hdHRyaWJ1dGVzKTtcbiAgY29uc3QgYmFzZUlzUmVzb2x2ZWQgPSBPYmplY3Qua2V5cyhiYXNlLnJlbGF0aW9uc2hpcHMpLm1hcChyZWxOYW1lID0+IHtcbiAgICByZXR1cm4gYmFzZS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLm1hcChyZWwgPT4gISgnb3AnIGluIHJlbCkpLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBhY2MgJiYgY3VyciwgdHJ1ZSk7XG4gIH0pLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBhY2MgJiYgY3VyciwgdHJ1ZSk7XG4gIGNvbnN0IHJlc29sdmVkQmFzZVJlbHMgPSBiYXNlSXNSZXNvbHZlZCA/IGJhc2UucmVsYXRpb25zaGlwcyA6IHRoaXMucmVzb2x2ZVJlbGF0aW9uc2hpcHMoYmFzZS5yZWxhdGlvbnNoaXBzKTtcbiAgY29uc3QgcmVzb2x2ZWRSZWxhdGlvbnNoaXBzID0gdGhpcy5yZXNvbHZlUmVsYXRpb25zaGlwcyh1cGRhdGUucmVsYXRpb25zaGlwcywgcmVzb2x2ZWRCYXNlUmVscyk7XG4gIHJldHVybiB7IGF0dHJpYnV0ZXMsIHJlbGF0aW9uc2hpcHM6IHJlc29sdmVkUmVsYXRpb25zaGlwcyB9O1xufTtcblxuTW9kZWwucmVzb2x2ZVJlbGF0aW9uc2hpcHMgPSBmdW5jdGlvbiByZXNvbHZlUmVsYXRpb25zaGlwcyhkZWx0YXMsIGJhc2UgPSB7fSkge1xuICBjb25zdCB1cGRhdGVzID0gT2JqZWN0LmtleXMoZGVsdGFzKS5tYXAocmVsTmFtZSA9PiB7XG4gICAgY29uc3QgcmVzb2x2ZWQgPSB0aGlzLnJlc29sdmVSZWxhdGlvbnNoaXAoZGVsdGFzW3JlbE5hbWVdLCBiYXNlW3JlbE5hbWVdKTtcbiAgICByZXR1cm4geyBbcmVsTmFtZV06IHJlc29sdmVkIH07XG4gIH0pXG4gIC5yZWR1Y2UoKGFjYywgY3VycikgPT4gbWVyZ2VPcHRpb25zKGFjYywgY3VyciksIHt9KTtcbiAgcmV0dXJuIG1lcmdlT3B0aW9ucyh7fSwgYmFzZSwgdXBkYXRlcyk7XG59O1xuXG5Nb2RlbC5yZXNvbHZlUmVsYXRpb25zaGlwID0gZnVuY3Rpb24gcmVzb2x2ZVJlbGF0aW9uc2hpcChkZWx0YXMsIGJhc2UgPSBbXSkge1xuICAvLyBJbmRleCBjdXJyZW50IHJlbGF0aW9uc2hpcHMgYnkgSUQgZm9yIGVmZmljaWVudCBtb2RpZmljYXRpb25cbiAgY29uc3QgdXBkYXRlcyA9IGJhc2UubWFwKHJlbCA9PiB7XG4gICAgcmV0dXJuIHsgW3JlbC5pZF06IHJlbCB9O1xuICB9KS5yZWR1Y2UoKGFjYywgY3VycikgPT4gbWVyZ2VPcHRpb25zKGFjYywgY3VyciksIHt9KTtcblxuICAvLyBBcHBseSBkZWx0YXMgb24gdG9wIG9mIHVwZGF0ZXNcbiAgZGVsdGFzLmZvckVhY2goZGVsdGEgPT4ge1xuICAgIGNvbnN0IGNoaWxkSWQgPSBkZWx0YS5kYXRhID8gZGVsdGEuZGF0YS5pZCA6IGRlbHRhLmlkO1xuICAgIHVwZGF0ZXNbY2hpbGRJZF0gPSBkZWx0YS5vcCA/IHRoaXMuYXBwbHlEZWx0YSh1cGRhdGVzW2NoaWxkSWRdLCBkZWx0YSkgOiBkZWx0YTtcbiAgfSk7XG5cbiAgLy8gUmVkdWNlIHVwZGF0ZXMgYmFjayBpbnRvIGxpc3QsIG9taXR0aW5nIHVuZGVmaW5lZHNcbiAgcmV0dXJuIE9iamVjdC5rZXlzKHVwZGF0ZXMpXG4gICAgLm1hcChpZCA9PiB1cGRhdGVzW2lkXSlcbiAgICAuZmlsdGVyKHJlbCA9PiByZWwgIT09IHVuZGVmaW5lZClcbiAgICAucmVkdWNlKChhY2MsIGN1cnIpID0+IGFjYy5jb25jYXQoY3VyciksIFtdKTtcbn07XG5cbk1vZGVsLnNjaGVtYXRpemUgPSBmdW5jdGlvbiBzY2hlbWF0aXplKHYgPSB7fSwgb3B0cyA9IHsgaW5jbHVkZUlkOiBmYWxzZSB9KSB7XG4gIGNvbnN0IHJldFZhbCA9IHt9O1xuICBpZiAob3B0cy5pbmNsdWRlSWQpIHtcbiAgICByZXRWYWwuaWQgPSB0aGlzLiRpZCBpbiB2ID8gdlt0aGlzLiRpZF0gOiB2LmlkO1xuICB9XG4gIE9iamVjdC5rZXlzKHRoaXMuJHNjaGVtYSkuZmlsdGVyKGsgPT4gayAhPT0gJyRpZCcpXG4gIC5mb3JFYWNoKHNjaGVtYUZpZWxkID0+IHtcbiAgICBpZiAoc2NoZW1hRmllbGQgaW4gdikge1xuICAgICAgcmV0VmFsW3NjaGVtYUZpZWxkXSA9IG1lcmdlT3B0aW9ucyh7fSwgdltzY2hlbWFGaWVsZF0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIShzY2hlbWFGaWVsZCBpbiByZXRWYWwpKSB7XG4gICAgICAgIHJldFZhbFtzY2hlbWFGaWVsZF0gPSB7fTtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgZmllbGQgaW4gdGhpcy4kc2NoZW1hW3NjaGVtYUZpZWxkXSkge1xuICAgICAgICBpZiAoZmllbGQgaW4gdikge1xuICAgICAgICAgIHJldFZhbFtzY2hlbWFGaWVsZF1bZmllbGRdID0gc2NoZW1hRmllbGQgPT09ICdyZWxhdGlvbnNoaXBzJyA/IHRoaXMuYWRkRGVsdGEoZmllbGQsIHZbZmllbGRdKSA6IHZbZmllbGRdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHJldFZhbDtcbn07XG5cbi8vIE1FVEFEQVRBXG5cbk1vZGVsLiQkc3RvcmVDYWNoZSA9IG5ldyBNYXAoKTtcblxuTW9kZWwuJGlkID0gJ2lkJztcbk1vZGVsLiRuYW1lID0gJ0Jhc2UnO1xuTW9kZWwuJHNjaGVtYSA9IHtcbiAgJGlkOiAnaWQnLFxuICBhdHRyaWJ1dGVzOiB7fSxcbiAgcmVsYXRpb25zaGlwczoge30sXG59O1xuTW9kZWwuJGluY2x1ZGVkID0gW107XG4iXX0=
