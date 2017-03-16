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

var _Rx2 = _interopRequireDefault(_Rx);

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
    key: '$$resetDirty',
    value: function $$resetDirty(opts) {
      var _this = this;

      var key = opts || this.$dirtyFields;
      var newDirty = { attributes: {}, relationships: {} };
      var keys = Array.isArray(key) ? key : [key];
      Object.keys(this[$dirty]).forEach(function (schemaField) {
        for (var field in _this[$dirty][schemaField]) {
          if (keys.indexOf(field) < 0) {
            var val = _this[$dirty][schemaField][field];
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
      var _this2 = this;

      // If opts is falsy (i.e., undefined), get attributes
      // Otherwise, get what was requested,
      // wrapping the request in a Array if it wasn't already one
      var keys = opts && !Array.isArray(opts) ? [opts] : opts;
      if (keys && keys.indexOf($all) >= 0) {
        keys = Object.keys(this.$schema.relationships);
      }
      return this[$plump].get(this.constructor, this.$id, keys).then(function (self) {
        if (!self && _this2.$dirtyFields.length === 0) {
          return null;
        } else {
          var schematized = _this2.constructor.schematize(self || {});
          var withDirty = _this2.constructor.resolveAndOverlay(_this2[$dirty], schematized);
          var retVal = _this2.constructor.applyDefaults(withDirty);
          retVal.type = _this2.$name;
          retVal.id = _this2.$id;
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
      var _this3 = this;

      var options = opts || this.$fields;
      var keys = Array.isArray(options) ? options : [options];

      // Deep copy dirty cache, filtering out keys that are not in opts
      var update = Object.keys(this[$dirty]).map(function (schemaField) {
        var value = Object.keys(_this3[$dirty][schemaField]).filter(function (key) {
          return keys.indexOf(key) >= 0;
        }).map(function (key) {
          return _defineProperty({}, key, _this3[$dirty][schemaField][key]);
        }).reduce(function (acc, curr) {
          return Object.assign(acc, curr);
        }, {});
        return _defineProperty({}, schemaField, value);
      }).reduce(function (acc, curr) {
        return (0, _mergeOptions2.default)(acc, curr);
      }, { id: this.$id, type: this.constructor.$name });

      if (this.$id !== undefined) {
        update.id = this.$id;
      }
      update.type = this.$name;

      return this[$plump].save(update).then(function (updated) {
        _this3.$$resetDirty(opts);
        if (updated.id) {
          _this3[_this3.constructor.$id] = updated.id;
        }
        // this.$$fireUpdate(updated);
        return _this3.$get();
      });
    }
  }, {
    key: '$set',
    value: function $set(update) {
      var _this4 = this;

      var flat = update.attributes || update;
      // Filter out non-attribute keys
      var sanitized = Object.keys(flat).filter(function (k) {
        return k in _this4.$schema.attributes;
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
    key: 'subscribe',
    value: function subscribe() {
      var _this5 = this;

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

      if (fields.indexOf($all) >= 0) {
        fields = Object.keys(this.$schema.relationships).concat('attributes');
      }

      var hots = this[$plump].stores.filter(function (s) {
        return s.hot(_this5.$name, _this5.$id);
      });
      var colds = this[$plump].stores.filter(function (s) {
        return !s.hot(_this5.$name, _this5.$id);
      });
      var terminal = this[$plump].stores.filter(function (s) {
        return s.terminal === true;
      });

      var preload$ = _Rx2.default.Observable.from(hots).flatMap(function (s) {
        return _Rx2.default.Observable.fromPromise(s.read(_this5.$name, _this5.$id, fields));
      }).defaultIfEmpty(null).flatMap(function (v) {
        if (v !== null) {
          return _Rx2.default.Observable.of(v);
        } else {
          var terminal$ = _Rx2.default.Observable.from(terminal).flatMap(function (s) {
            return _Rx2.default.Observable.fromPromise(s.read(_this5.$name, _this5.$id, fields));
          }).share();
          var cold$ = _Rx2.default.Observable.from(colds).flatMap(function (s) {
            return _Rx2.default.Observable.fromPromise(s.read(_this5.$name, _this5.$id, fields));
          });
          return _Rx2.default.Observable.merge(terminal$, cold$.takeUntil(terminal$));
        }
      });
      // TODO: cacheable reads
      // const watchRead$ = Rx.Observable.from(terminal)
      // .flatMap(s => s.read$.filter(v => v.type === this.$name && v.id === this.$id));
      var watchWrite$ = _Rx2.default.Observable.from(terminal).flatMap(function (s) {
        return s.write$;
      }).filter(function (v) {
        return v.type === _this5.$name && v.id === _this5.$id && v.invalidate.some(function (i) {
          return fields.indexOf(i) >= 0;
        });
      }).flatMapTo(_Rx2.default.Observable.from(terminal).flatMap(function (s) {
        return _Rx2.default.Observable.fromPromise(s.read(_this5.$name, _this5.$id, fields));
      }));
      // );
      return preload$.merge(watchWrite$).subscribe(cb);
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
    return k[0] !== '$';
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
    return k[0] !== '$';
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
    return k[0] !== '$';
  }).forEach(function (schemaField) {
    if (schemaField in v) {
      retVal[schemaField] = (0, _mergeOptions2.default)({}, v[schemaField]);
    } else {
      retVal[schemaField] = retVal[schemaField] || {};
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
  $name: 'base',
  $id: 'id',
  attributes: {},
  relationships: {}
};
Model.$included = [];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRkaXJ0eSIsIlN5bWJvbCIsIiRwbHVtcCIsIiR1bnN1YnNjcmliZSIsIiRzdWJqZWN0IiwiJGFsbCIsIk1vZGVsIiwib3B0cyIsInBsdW1wIiwiRXJyb3IiLCJhdHRyaWJ1dGVzIiwicmVsYXRpb25zaGlwcyIsIiQkY29weVZhbHVlc0Zyb20iLCJpZEZpZWxkIiwiY29uc3RydWN0b3IiLCIkaWQiLCJzY2hlbWF0aXplIiwia2V5IiwiJGRpcnR5RmllbGRzIiwibmV3RGlydHkiLCJrZXlzIiwiQXJyYXkiLCJpc0FycmF5IiwiT2JqZWN0IiwiZm9yRWFjaCIsImZpZWxkIiwic2NoZW1hRmllbGQiLCJpbmRleE9mIiwidmFsIiwidiIsInVwZGF0ZSIsInJlc29sdmVBbmRPdmVybGF5IiwiaWQiLCJuZXh0IiwidW5zdWJzY3JpYmUiLCIkc2NoZW1hIiwiZ2V0IiwidGhlbiIsInNlbGYiLCJsZW5ndGgiLCJzY2hlbWF0aXplZCIsIndpdGhEaXJ0eSIsInJldFZhbCIsImFwcGx5RGVmYXVsdHMiLCJ0eXBlIiwiJG5hbWUiLCJidWxrR2V0Iiwib3B0aW9ucyIsIiRmaWVsZHMiLCJtYXAiLCJ2YWx1ZSIsImZpbHRlciIsInJlZHVjZSIsImFjYyIsImN1cnIiLCJhc3NpZ24iLCJ1bmRlZmluZWQiLCJzYXZlIiwidXBkYXRlZCIsIiQkcmVzZXREaXJ0eSIsIiRnZXQiLCJmbGF0Iiwic2FuaXRpemVkIiwiayIsImZpZWxkcyIsImNiIiwiY29uY2F0IiwiaG90cyIsInN0b3JlcyIsInMiLCJob3QiLCJjb2xkcyIsInRlcm1pbmFsIiwicHJlbG9hZCQiLCJPYnNlcnZhYmxlIiwiZnJvbSIsImZsYXRNYXAiLCJmcm9tUHJvbWlzZSIsInJlYWQiLCJkZWZhdWx0SWZFbXB0eSIsIm9mIiwidGVybWluYWwkIiwic2hhcmUiLCJjb2xkJCIsIm1lcmdlIiwidGFrZVVudGlsIiwid2F0Y2hXcml0ZSQiLCJ3cml0ZSQiLCJpbnZhbGlkYXRlIiwic29tZSIsImkiLCJmbGF0TWFwVG8iLCJzdWJzY3JpYmUiLCJkZWxldGUiLCJkYXRhIiwicmVzdE9wdHMiLCJ1cmwiLCJyZXN0UmVxdWVzdCIsIml0ZW0iLCJleHRyYXMiLCIkc2lkZXMiLCJvdGhlciIsIm1ldGEiLCJwdXNoIiwib3AiLCJmcm9tSlNPTiIsImpzb24iLCIkaW5jbHVkZSIsInJlbCIsIkR5bmFtaWNSZWxhdGlvbnNoaXAiLCJ0b0pTT04iLCIkcmVzdCIsImFkZERlbHRhIiwicmVsTmFtZSIsInJlbGF0aW9uc2hpcCIsInJlbFNjaGVtYSIsInJlbEZpZWxkIiwiYXR0ciIsImRlZmF1bHQiLCJhcHBseURlbHRhIiwiY3VycmVudCIsImRlbHRhIiwiaW5jbHVkZUlkIiwiY2FjaGVHZXQiLCJzdG9yZSIsIiQkc3RvcmVDYWNoZSIsImNhY2hlU2V0Iiwic2V0IiwiYmFzZSIsImJhc2VJc1Jlc29sdmVkIiwicmVzb2x2ZWRCYXNlUmVscyIsInJlc29sdmVSZWxhdGlvbnNoaXBzIiwicmVzb2x2ZWRSZWxhdGlvbnNoaXBzIiwiZGVsdGFzIiwidXBkYXRlcyIsInJlc29sdmVkIiwicmVzb2x2ZVJlbGF0aW9uc2hpcCIsImNoaWxkSWQiLCJNYXAiLCIkaW5jbHVkZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7OztBQUVBOzs7Ozs7Ozs7Ozs7QUFDQSxJQUFNQSxTQUFTQyxPQUFPLFFBQVAsQ0FBZjtBQUNBLElBQU1DLFNBQVNELE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUUsZUFBZUYsT0FBTyxjQUFQLENBQXJCO0FBQ0EsSUFBTUcsV0FBV0gsT0FBTyxVQUFQLENBQWpCO0FBQ08sSUFBTUksc0JBQU9KLE9BQU8sTUFBUCxDQUFiOztBQUVQO0FBQ0E7O0lBRWFLLEssV0FBQUEsSztBQUNYLGlCQUFZQyxJQUFaLEVBQWtCQyxLQUFsQixFQUF5QjtBQUFBOztBQUN2QixRQUFJQSxLQUFKLEVBQVc7QUFDVCxXQUFLTixNQUFMLElBQWVNLEtBQWY7QUFDRCxLQUZELE1BRU87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RCxLQUFwQixJQUE2QkMsZ0JBQWdCLGVBQWhCLEdBQWtDLFFBQUtzRixRQUFMLENBQWN2RixLQUFkLEVBQXFCSSxFQUFFSixLQUFGLENBQXJCLENBQWxDLEdBQW1FSSxFQUFFSixLQUFGLENBQWhHO0FBQ0Q7QUFDRjtBQUNGO0FBQ0YsR0FiRDtBQWNBLFNBQU9pQixNQUFQO0FBQ0QsQ0FwQkQ7O0FBc0JBOztBQUVBcEMsTUFBTXVILFlBQU4sR0FBcUIsSUFBSWEsR0FBSixFQUFyQjs7QUFFQXBJLE1BQU1TLEdBQU4sR0FBWSxJQUFaO0FBQ0FULE1BQU11QyxLQUFOLEdBQWMsTUFBZDtBQUNBdkMsTUFBTTZCLE9BQU4sR0FBZ0I7QUFDZFUsU0FBTyxNQURPO0FBRWQ5QixPQUFLLElBRlM7QUFHZEwsY0FBWSxFQUhFO0FBSWRDLGlCQUFlO0FBSkQsQ0FBaEI7QUFNQUwsTUFBTXFJLFNBQU4sR0FBa0IsRUFBbEIiLCJmaWxlIjoibW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbWVyZ2VPcHRpb25zIGZyb20gJ21lcmdlLW9wdGlvbnMnO1xuaW1wb3J0IFJ4IGZyb20gJ3J4anMvUngnO1xuXG5pbXBvcnQgeyBSZWxhdGlvbnNoaXAgfSBmcm9tICcuL3JlbGF0aW9uc2hpcCc7XG5jb25zdCAkZGlydHkgPSBTeW1ib2woJyRkaXJ0eScpO1xuY29uc3QgJHBsdW1wID0gU3ltYm9sKCckcGx1bXAnKTtcbmNvbnN0ICR1bnN1YnNjcmliZSA9IFN5bWJvbCgnJHVuc3Vic2NyaWJlJyk7XG5jb25zdCAkc3ViamVjdCA9IFN5bWJvbCgnJHN1YmplY3QnKTtcbmV4cG9ydCBjb25zdCAkYWxsID0gU3ltYm9sKCckYWxsJyk7XG5cbi8vIFRPRE86IGZpZ3VyZSBvdXQgd2hlcmUgZXJyb3IgZXZlbnRzIG9yaWdpbmF0ZSAoc3RvcmFnZSBvciBtb2RlbClcbi8vIGFuZCB3aG8ga2VlcHMgYSByb2xsLWJhY2thYmxlIGRlbHRhXG5cbmV4cG9ydCBjbGFzcyBNb2RlbCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMsIHBsdW1wKSB7XG4gICAgaWYgKHBsdW1wKSB7XG4gICAgICB0aGlzWyRwbHVtcF0gPSBwbHVtcDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY29uc3RydWN0IFBsdW1wIG1vZGVsIHdpdGhvdXQgYSBQbHVtcCcpO1xuICAgIH1cbiAgICAvLyBUT0RPOiBEZWZpbmUgRGVsdGEgaW50ZXJmYWNlXG4gICAgdGhpc1skZGlydHldID0ge1xuICAgICAgYXR0cmlidXRlczoge30sIC8vIFNpbXBsZSBrZXktdmFsdWVcbiAgICAgIHJlbGF0aW9uc2hpcHM6IHt9LCAvLyByZWxOYW1lOiBEZWx0YVtdXG4gICAgfTtcbiAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20ob3B0cyk7XG4gICAgLy8gdGhpcy4kJGZpcmVVcGRhdGUob3B0cyk7XG4gIH1cblxuICAvLyBDT05WRU5JRU5DRSBBQ0NFU1NPUlNcblxuICBnZXQgJG5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuJG5hbWU7XG4gIH1cblxuICBnZXQgJGlkKCkge1xuICAgIHJldHVybiB0aGlzW3RoaXMuY29uc3RydWN0b3IuJGlkXTtcbiAgfVxuXG4gIGdldCAkZmllbGRzKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLiRzY2hlbWEuYXR0cmlidXRlcylcbiAgICAuY29uY2F0KE9iamVjdC5rZXlzKHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzKSk7XG4gIH1cblxuICBnZXQgJHNjaGVtYSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci4kc2NoZW1hO1xuICB9XG5cbiAgZ2V0ICRkaXJ0eUZpZWxkcygpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpc1skZGlydHldKVxuICAgIC5tYXAoayA9PiBPYmplY3Qua2V5cyh0aGlzWyRkaXJ0eV1ba10pKVxuICAgIC5yZWR1Y2UoKGFjYywgY3VycikgPT4gYWNjLmNvbmNhdChjdXJyKSwgW10pXG4gICAgLmZpbHRlcihrID0+IGsgIT09IHRoaXMuY29uc3RydWN0b3IuJGlkKSAvLyBpZCBzaG91bGQgbmV2ZXIgYmUgZGlydHlcbiAgICAucmVkdWNlKChhY2MsIGN1cnIpID0+IGFjYy5jb25jYXQoY3VyciksIFtdKTtcbiAgfVxuXG4gIC8vIFdJUklOR1xuXG4gICQkY29weVZhbHVlc0Zyb20ob3B0cyA9IHt9KSB7XG4gICAgY29uc3QgaWRGaWVsZCA9IHRoaXMuY29uc3RydWN0b3IuJGlkIGluIG9wdHMgPyB0aGlzLmNvbnN0cnVjdG9yLiRpZCA6ICdpZCc7XG4gICAgdGhpc1t0aGlzLmNvbnN0cnVjdG9yLiRpZF0gPSBvcHRzW2lkRmllbGRdIHx8IHRoaXMuJGlkO1xuICAgIHRoaXNbJGRpcnR5XSA9IHRoaXMuY29uc3RydWN0b3Iuc2NoZW1hdGl6ZShvcHRzKTtcbiAgfVxuXG4gICQkcmVzZXREaXJ0eShvcHRzKSB7XG4gICAgY29uc3Qga2V5ID0gb3B0cyB8fCB0aGlzLiRkaXJ0eUZpZWxkcztcbiAgICBjb25zdCBuZXdEaXJ0eSA9IHsgYXR0cmlidXRlczoge30sIHJlbGF0aW9uc2hpcHM6IHt9IH07XG4gICAgY29uc3Qga2V5cyA9IEFycmF5LmlzQXJyYXkoa2V5KSA/IGtleSA6IFtrZXldO1xuICAgIE9iamVjdC5rZXlzKHRoaXNbJGRpcnR5XSkuZm9yRWFjaChzY2hlbWFGaWVsZCA9PiB7XG4gICAgICBmb3IgKGNvbnN0IGZpZWxkIGluIHRoaXNbJGRpcnR5XVtzY2hlbWFGaWVsZF0pIHtcbiAgICAgICAgaWYgKGtleXMuaW5kZXhPZihmaWVsZCkgPCAwKSB7XG4gICAgICAgICAgY29uc3QgdmFsID0gdGhpc1skZGlydHldW3NjaGVtYUZpZWxkXVtmaWVsZF07XG4gICAgICAgICAgbmV3RGlydHlbc2NoZW1hRmllbGRdW2ZpZWxkXSA9IHR5cGVvZiB2YWwgPT09ICdvYmplY3QnID8gbWVyZ2VPcHRpb25zKHt9LCB2YWwpIDogdmFsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpc1skZGlydHldID0gbmV3RGlydHk7XG4gIH1cblxuICAkJGZpcmVVcGRhdGUodikge1xuICAgIGNvbnN0IHVwZGF0ZSA9IHRoaXMuY29uc3RydWN0b3IucmVzb2x2ZUFuZE92ZXJsYXkodGhpc1skZGlydHldLCB2KTtcbiAgICBpZiAodGhpcy4kaWQpIHtcbiAgICAgIHVwZGF0ZS5pZCA9IHRoaXMuJGlkO1xuICAgIH1cbiAgICB0aGlzWyRzdWJqZWN0XS5uZXh0KHVwZGF0ZSk7XG4gIH1cblxuICAkdGVhcmRvd24oKSB7XG4gICAgaWYgKHRoaXNbJHVuc3Vic2NyaWJlXSkge1xuICAgICAgdGhpc1skdW5zdWJzY3JpYmVdLnVuc3Vic2NyaWJlKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gQVBJIE1FVEhPRFNcblxuICAkZ2V0KG9wdHMpIHtcbiAgICAvLyBJZiBvcHRzIGlzIGZhbHN5IChpLmUuLCB1bmRlZmluZWQpLCBnZXQgYXR0cmlidXRlc1xuICAgIC8vIE90aGVyd2lzZSwgZ2V0IHdoYXQgd2FzIHJlcXVlc3RlZCxcbiAgICAvLyB3cmFwcGluZyB0aGUgcmVxdWVzdCBpbiBhIEFycmF5IGlmIGl0IHdhc24ndCBhbHJlYWR5IG9uZVxuICAgIGxldCBrZXlzID0gb3B0cyAmJiAhQXJyYXkuaXNBcnJheShvcHRzKSA/IFtvcHRzXSA6IG9wdHM7XG4gICAgaWYgKGtleXMgJiYga2V5cy5pbmRleE9mKCRhbGwpID49IDApIHtcbiAgICAgIGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwcyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZ2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXlzKVxuICAgIC50aGVuKHNlbGYgPT4ge1xuICAgICAgaWYgKCFzZWxmICYmIHRoaXMuJGRpcnR5RmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHNjaGVtYXRpemVkID0gdGhpcy5jb25zdHJ1Y3Rvci5zY2hlbWF0aXplKHNlbGYgfHwge30pO1xuICAgICAgICBjb25zdCB3aXRoRGlydHkgPSB0aGlzLmNvbnN0cnVjdG9yLnJlc29sdmVBbmRPdmVybGF5KHRoaXNbJGRpcnR5XSwgc2NoZW1hdGl6ZWQpO1xuICAgICAgICBjb25zdCByZXRWYWwgPSB0aGlzLmNvbnN0cnVjdG9yLmFwcGx5RGVmYXVsdHMod2l0aERpcnR5KTtcbiAgICAgICAgcmV0VmFsLnR5cGUgPSB0aGlzLiRuYW1lO1xuICAgICAgICByZXRWYWwuaWQgPSB0aGlzLiRpZDtcbiAgICAgICAgcmV0dXJuIHJldFZhbDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICRidWxrR2V0KCkge1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0uYnVsa0dldCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCk7XG4gIH1cblxuICAvLyBUT0RPOiBTaG91bGQgJHNhdmUgdWx0aW1hdGVseSByZXR1cm4gdGhpcy4kZ2V0KCk/XG4gICRzYXZlKG9wdHMpIHtcbiAgICBjb25zdCBvcHRpb25zID0gb3B0cyB8fCB0aGlzLiRmaWVsZHM7XG4gICAgY29uc3Qga2V5cyA9IEFycmF5LmlzQXJyYXkob3B0aW9ucykgPyBvcHRpb25zIDogW29wdGlvbnNdO1xuXG4gICAgLy8gRGVlcCBjb3B5IGRpcnR5IGNhY2hlLCBmaWx0ZXJpbmcgb3V0IGtleXMgdGhhdCBhcmUgbm90IGluIG9wdHNcbiAgICBjb25zdCB1cGRhdGUgPSBPYmplY3Qua2V5cyh0aGlzWyRkaXJ0eV0pLm1hcChzY2hlbWFGaWVsZCA9PiB7XG4gICAgICBjb25zdCB2YWx1ZSA9IE9iamVjdC5rZXlzKHRoaXNbJGRpcnR5XVtzY2hlbWFGaWVsZF0pXG4gICAgICAgIC5maWx0ZXIoa2V5ID0+IGtleXMuaW5kZXhPZihrZXkpID49IDApXG4gICAgICAgIC5tYXAoa2V5ID0+ICh7IFtrZXldOiB0aGlzWyRkaXJ0eV1bc2NoZW1hRmllbGRdW2tleV0gfSkpXG4gICAgICAgIC5yZWR1Y2UoKGFjYywgY3VycikgPT4gT2JqZWN0LmFzc2lnbihhY2MsIGN1cnIpLCB7fSk7XG4gICAgICByZXR1cm4geyBbc2NoZW1hRmllbGRdOiB2YWx1ZSB9O1xuICAgIH0pXG4gICAgLnJlZHVjZShcbiAgICAgIChhY2MsIGN1cnIpID0+IG1lcmdlT3B0aW9ucyhhY2MsIGN1cnIpLFxuICAgICAgeyBpZDogdGhpcy4kaWQsIHR5cGU6IHRoaXMuY29uc3RydWN0b3IuJG5hbWUgfSk7XG5cbiAgICBpZiAodGhpcy4kaWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdXBkYXRlLmlkID0gdGhpcy4kaWQ7XG4gICAgfVxuICAgIHVwZGF0ZS50eXBlID0gdGhpcy4kbmFtZTtcblxuICAgIHJldHVybiB0aGlzWyRwbHVtcF0uc2F2ZSh1cGRhdGUpXG4gICAgLnRoZW4oKHVwZGF0ZWQpID0+IHtcbiAgICAgIHRoaXMuJCRyZXNldERpcnR5KG9wdHMpO1xuICAgICAgaWYgKHVwZGF0ZWQuaWQpIHtcbiAgICAgICAgdGhpc1t0aGlzLmNvbnN0cnVjdG9yLiRpZF0gPSB1cGRhdGVkLmlkO1xuICAgICAgfVxuICAgICAgLy8gdGhpcy4kJGZpcmVVcGRhdGUodXBkYXRlZCk7XG4gICAgICByZXR1cm4gdGhpcy4kZ2V0KCk7XG4gICAgfSk7XG4gIH1cblxuICAkc2V0KHVwZGF0ZSkge1xuICAgIGNvbnN0IGZsYXQgPSB1cGRhdGUuYXR0cmlidXRlcyB8fCB1cGRhdGU7XG4gICAgLy8gRmlsdGVyIG91dCBub24tYXR0cmlidXRlIGtleXNcbiAgICBjb25zdCBzYW5pdGl6ZWQgPSBPYmplY3Qua2V5cyhmbGF0KVxuICAgICAgLmZpbHRlcihrID0+IGsgaW4gdGhpcy4kc2NoZW1hLmF0dHJpYnV0ZXMpXG4gICAgICAubWFwKGsgPT4geyByZXR1cm4geyBba106IGZsYXRba10gfTsgfSlcbiAgICAgIC5yZWR1Y2UoKGFjYywgY3VycikgPT4gbWVyZ2VPcHRpb25zKGFjYywgY3VyciksIHt9KTtcblxuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbShzYW5pdGl6ZWQpO1xuICAgIC8vIHRoaXMuJCRmaXJlVXBkYXRlKHNhbml0aXplZCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzdWJzY3JpYmUoLi4uYXJncykge1xuICAgIGxldCBmaWVsZHMgPSBbJ2F0dHJpYnV0ZXMnXTtcbiAgICBsZXQgY2I7XG4gICAgaWYgKGFyZ3MubGVuZ3RoID09PSAyKSB7XG4gICAgICBmaWVsZHMgPSBhcmdzWzBdO1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGZpZWxkcykpIHtcbiAgICAgICAgZmllbGRzID0gW2ZpZWxkc107XG4gICAgICB9XG4gICAgICBjYiA9IGFyZ3NbMV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGNiID0gYXJnc1swXTtcbiAgICB9XG5cbiAgICBpZiAoZmllbGRzLmluZGV4T2YoJGFsbCkgPj0gMCkge1xuICAgICAgZmllbGRzID0gT2JqZWN0LmtleXModGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHMpLmNvbmNhdCgnYXR0cmlidXRlcycpO1xuICAgIH1cblxuICAgIGNvbnN0IGhvdHMgPSB0aGlzWyRwbHVtcF0uc3RvcmVzLmZpbHRlcihzID0+IHMuaG90KHRoaXMuJG5hbWUsIHRoaXMuJGlkKSk7XG4gICAgY29uc3QgY29sZHMgPSB0aGlzWyRwbHVtcF0uc3RvcmVzLmZpbHRlcihzID0+ICFzLmhvdCh0aGlzLiRuYW1lLCB0aGlzLiRpZCkpO1xuICAgIGNvbnN0IHRlcm1pbmFsID0gdGhpc1skcGx1bXBdLnN0b3Jlcy5maWx0ZXIocyA9PiBzLnRlcm1pbmFsID09PSB0cnVlKTtcblxuICAgIGNvbnN0IHByZWxvYWQkID0gUnguT2JzZXJ2YWJsZS5mcm9tKGhvdHMpXG4gICAgLmZsYXRNYXAocyA9PiBSeC5PYnNlcnZhYmxlLmZyb21Qcm9taXNlKHMucmVhZCh0aGlzLiRuYW1lLCB0aGlzLiRpZCwgZmllbGRzKSkpXG4gICAgLmRlZmF1bHRJZkVtcHR5KG51bGwpXG4gICAgLmZsYXRNYXAoKHYpID0+IHtcbiAgICAgIGlmICh2ICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBSeC5PYnNlcnZhYmxlLm9mKHYpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgdGVybWluYWwkID0gUnguT2JzZXJ2YWJsZS5mcm9tKHRlcm1pbmFsKVxuICAgICAgICAuZmxhdE1hcChzID0+IFJ4Lk9ic2VydmFibGUuZnJvbVByb21pc2Uocy5yZWFkKHRoaXMuJG5hbWUsIHRoaXMuJGlkLCBmaWVsZHMpKSlcbiAgICAgICAgLnNoYXJlKCk7XG4gICAgICAgIGNvbnN0IGNvbGQkID0gUnguT2JzZXJ2YWJsZS5mcm9tKGNvbGRzKVxuICAgICAgICAuZmxhdE1hcChzID0+IFJ4Lk9ic2VydmFibGUuZnJvbVByb21pc2Uocy5yZWFkKHRoaXMuJG5hbWUsIHRoaXMuJGlkLCBmaWVsZHMpKSk7XG4gICAgICAgIHJldHVybiBSeC5PYnNlcnZhYmxlLm1lcmdlKFxuICAgICAgICAgIHRlcm1pbmFsJCxcbiAgICAgICAgICBjb2xkJC50YWtlVW50aWwodGVybWluYWwkKVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8vIFRPRE86IGNhY2hlYWJsZSByZWFkc1xuICAgIC8vIGNvbnN0IHdhdGNoUmVhZCQgPSBSeC5PYnNlcnZhYmxlLmZyb20odGVybWluYWwpXG4gICAgLy8gLmZsYXRNYXAocyA9PiBzLnJlYWQkLmZpbHRlcih2ID0+IHYudHlwZSA9PT0gdGhpcy4kbmFtZSAmJiB2LmlkID09PSB0aGlzLiRpZCkpO1xuICAgIGNvbnN0IHdhdGNoV3JpdGUkID0gUnguT2JzZXJ2YWJsZS5mcm9tKHRlcm1pbmFsKVxuICAgIC5mbGF0TWFwKHMgPT4gcy53cml0ZSQpXG4gICAgLmZpbHRlcih2ID0+IHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgICh2LnR5cGUgPT09IHRoaXMuJG5hbWUpICYmXG4gICAgICAgICh2LmlkID09PSB0aGlzLiRpZCkgJiZcbiAgICAgICAgKHYuaW52YWxpZGF0ZS5zb21lKGkgPT4gZmllbGRzLmluZGV4T2YoaSkgPj0gMCkpXG4gICAgICApO1xuICAgIH0pXG4gICAgLmZsYXRNYXBUbyhcbiAgICAgIFJ4Lk9ic2VydmFibGUuZnJvbSh0ZXJtaW5hbClcbiAgICAgIC5mbGF0TWFwKHMgPT4gUnguT2JzZXJ2YWJsZS5mcm9tUHJvbWlzZShzLnJlYWQodGhpcy4kbmFtZSwgdGhpcy4kaWQsIGZpZWxkcykpKVxuICAgICk7XG4gICAgLy8gKTtcbiAgICByZXR1cm4gcHJlbG9hZCQubWVyZ2Uod2F0Y2hXcml0ZSQpXG4gICAgLnN1YnNjcmliZShjYik7XG4gIH1cblxuICAkZGVsZXRlKCkge1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZGVsZXRlKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkKVxuICAgIC50aGVuKGRhdGEgPT4gZGF0YS5tYXAodGhpcy5jb25zdHJ1Y3Rvci5zY2hlbWF0aXplKSk7XG4gIH1cblxuICAkcmVzdChvcHRzKSB7XG4gICAgY29uc3QgcmVzdE9wdHMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICBvcHRzLFxuICAgICAge1xuICAgICAgICB1cmw6IGAvJHt0aGlzLmNvbnN0cnVjdG9yLiRuYW1lfS8ke3RoaXMuJGlkfS8ke29wdHMudXJsfWAsXG4gICAgICB9XG4gICAgKTtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLnJlc3RSZXF1ZXN0KHJlc3RPcHRzKS50aGVuKGRhdGEgPT4gdGhpcy5jb25zdHJ1Y3Rvci5zY2hlbWF0aXplKGRhdGEpKTtcbiAgfVxuXG4gICRhZGQoa2V5LCBpdGVtLCBleHRyYXMpIHtcbiAgICBpZiAodGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHNba2V5XSkge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIGlmIChpdGVtLmlkKSB7XG4gICAgICAgIGlkID0gaXRlbS5pZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbVt0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwc1trZXldLnR5cGUuJHNpZGVzW2tleV0ub3RoZXIuZmllbGRdO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgY29uc3QgZGF0YSA9IHsgaWQsIG1ldGE6IGV4dHJhcyB8fCBpdGVtLm1ldGEgfTtcbiAgICAgICAgdGhpc1skZGlydHldLnJlbGF0aW9uc2hpcHNba2V5XSA9IHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzW2tleV0gfHwgW107XG4gICAgICAgIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzW2tleV0ucHVzaCh7XG4gICAgICAgICAgb3A6ICdhZGQnLFxuICAgICAgICAgIGRhdGEsXG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aGlzLiQkZmlyZVVwZGF0ZSgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpO1xuICAgIH1cbiAgfVxuXG4gICRtb2RpZnlSZWxhdGlvbnNoaXAoa2V5LCBpdGVtLCBleHRyYXMpIHtcbiAgICBpZiAoa2V5IGluIHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgaWYgKCEoa2V5IGluIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzKSkge1xuICAgICAgICAgIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzW2tleV0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwc1trZXldLnB1c2goe1xuICAgICAgICAgIG9wOiAnbW9kaWZ5JyxcbiAgICAgICAgICBkYXRhOiBPYmplY3QuYXNzaWduKHsgaWQgfSwgeyBtZXRhOiBleHRyYXMgfHwgaXRlbS5tZXRhIH0pLFxuICAgICAgICB9KTtcbiAgICAgICAgLy8gdGhpcy4kJGZpcmVVcGRhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSBhZGRlZCB0byBoYXNNYW55Jyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90ICRhZGQgZXhjZXB0IHRvIGhhc01hbnkgZmllbGQnKTtcbiAgICB9XG4gIH1cblxuICAkcmVtb3ZlKGtleSwgaXRlbSkge1xuICAgIGlmIChrZXkgaW4gdGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHMpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICBpZiAoIShrZXkgaW4gdGhpc1skZGlydHldLnJlbGF0aW9uc2hpcHMpKSB7XG4gICAgICAgICAgdGhpc1skZGlydHldLnJlbGF0aW9uc2hpcHNba2V5XSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzW2tleV0ucHVzaCh7XG4gICAgICAgICAgb3A6ICdyZW1vdmUnLFxuICAgICAgICAgIGRhdGE6IHsgaWQgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHRoaXMuJCRmaXJlVXBkYXRlKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gJHJlbW92ZWQgZnJvbSBoYXNNYW55Jyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90ICRyZW1vdmUgZXhjZXB0IGZyb20gaGFzTWFueSBmaWVsZCcpO1xuICAgIH1cbiAgfVxufVxuXG5Nb2RlbC5mcm9tSlNPTiA9IGZ1bmN0aW9uIGZyb21KU09OKGpzb24pIHtcbiAgdGhpcy4kaWQgPSBqc29uLiRpZCB8fCAnaWQnO1xuICB0aGlzLiRuYW1lID0ganNvbi4kbmFtZTtcbiAgdGhpcy4kaW5jbHVkZSA9IGpzb24uJGluY2x1ZGU7XG4gIHRoaXMuJHNjaGVtYSA9IHtcbiAgICBhdHRyaWJ1dGVzOiBtZXJnZU9wdGlvbnMoanNvbi4kc2NoZW1hLmF0dHJpYnV0ZXMpLFxuICAgIHJlbGF0aW9uc2hpcHM6IHt9LFxuICB9O1xuICBmb3IgKGNvbnN0IHJlbCBpbiBqc29uLiRzY2hlbWEucmVsYXRpb25zaGlwcykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGd1YXJkLWZvci1pblxuICAgIHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbF0gPSB7fTtcbiAgICBjbGFzcyBEeW5hbWljUmVsYXRpb25zaGlwIGV4dGVuZHMgUmVsYXRpb25zaGlwIHt9XG4gICAgRHluYW1pY1JlbGF0aW9uc2hpcC5mcm9tSlNPTihqc29uLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxdKTtcbiAgICB0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxdLnR5cGUgPSBEeW5hbWljUmVsYXRpb25zaGlwO1xuICB9XG59O1xuXG5Nb2RlbC50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04oKSB7XG4gIGNvbnN0IHJldFZhbCA9IHtcbiAgICAkaWQ6IHRoaXMuJGlkLFxuICAgICRuYW1lOiB0aGlzLiRuYW1lLFxuICAgICRpbmNsdWRlOiB0aGlzLiRpbmNsdWRlLFxuICAgICRzY2hlbWE6IHsgYXR0cmlidXRlczogdGhpcy4kc2NoZW1hLmF0dHJpYnV0ZXMsIHJlbGF0aW9uc2hpcHM6IHt9IH0sXG4gIH07XG4gIGZvciAoY29uc3QgcmVsIGluIHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZ3VhcmQtZm9yLWluXG4gICAgcmV0VmFsLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxdID0gdGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsXS50eXBlLnRvSlNPTigpO1xuICB9XG4gIHJldHVybiByZXRWYWw7XG59O1xuXG5Nb2RlbC4kcmVzdCA9IGZ1bmN0aW9uICRyZXN0KHBsdW1wLCBvcHRzKSB7XG4gIGNvbnN0IHJlc3RPcHRzID0gT2JqZWN0LmFzc2lnbihcbiAgICB7fSxcbiAgICBvcHRzLFxuICAgIHtcbiAgICAgIHVybDogYC8ke3RoaXMuJG5hbWV9LyR7b3B0cy51cmx9YCxcbiAgICB9XG4gICk7XG4gIHJldHVybiBwbHVtcC5yZXN0UmVxdWVzdChyZXN0T3B0cyk7XG59O1xuXG4vLyBTQ0hFTUEgRlVOQ1RJT05TXG5cbk1vZGVsLmFkZERlbHRhID0gZnVuY3Rpb24gYWRkRGVsdGEocmVsTmFtZSwgcmVsYXRpb25zaGlwKSB7XG4gIHJldHVybiByZWxhdGlvbnNoaXAubWFwKHJlbCA9PiB7XG4gICAgY29uc3QgcmVsU2NoZW1hID0gdGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0udHlwZS4kc2lkZXNbcmVsTmFtZV07XG4gICAgY29uc3Qgc2NoZW1hdGl6ZWQgPSB7IG9wOiAnYWRkJywgZGF0YTogeyBpZDogcmVsW3JlbFNjaGVtYS5vdGhlci5maWVsZF0gfSB9O1xuICAgIGZvciAoY29uc3QgcmVsRmllbGQgaW4gcmVsKSB7XG4gICAgICBpZiAoIShyZWxGaWVsZCA9PT0gcmVsU2NoZW1hLnNlbGYuZmllbGQgfHwgcmVsRmllbGQgPT09IHJlbFNjaGVtYS5vdGhlci5maWVsZCkpIHtcbiAgICAgICAgc2NoZW1hdGl6ZWQuZGF0YVtyZWxGaWVsZF0gPSByZWxbcmVsRmllbGRdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2NoZW1hdGl6ZWQ7XG4gIH0pO1xufTtcblxuTW9kZWwuYXBwbHlEZWZhdWx0cyA9IGZ1bmN0aW9uIGFwcGx5RGVmYXVsdHModikge1xuICBjb25zdCByZXRWYWwgPSBtZXJnZU9wdGlvbnMoe30sIHYpO1xuICBmb3IgKGNvbnN0IGF0dHIgaW4gdGhpcy4kc2NoZW1hLmF0dHJpYnV0ZXMpIHtcbiAgICBpZiAoJ2RlZmF1bHQnIGluIHRoaXMuJHNjaGVtYS5hdHRyaWJ1dGVzW2F0dHJdICYmICEoYXR0ciBpbiByZXRWYWwuYXR0cmlidXRlcykpIHtcbiAgICAgIHJldFZhbC5hdHRyaWJ1dGVzW2F0dHJdID0gdGhpcy4kc2NoZW1hLmF0dHJpYnV0ZXNbYXR0cl0uZGVmYXVsdDtcbiAgICB9XG4gIH1cbiAgT2JqZWN0LmtleXModGhpcy4kc2NoZW1hKVxuICAuZmlsdGVyKGsgPT4ga1swXSAhPT0gJyQnKVxuICAuZm9yRWFjaChzY2hlbWFGaWVsZCA9PiB7XG4gICAgZm9yIChjb25zdCBmaWVsZCBpbiB0aGlzLiRzY2hlbWFbc2NoZW1hRmllbGRdKSB7XG4gICAgICBpZiAoIShmaWVsZCBpbiByZXRWYWxbc2NoZW1hRmllbGRdKSkge1xuICAgICAgICBpZiAoJ2RlZmF1bHQnIGluIHRoaXMuJHNjaGVtYVtzY2hlbWFGaWVsZF1bZmllbGRdKSB7XG4gICAgICAgICAgcmV0VmFsW3NjaGVtYUZpZWxkXVtmaWVsZF0gPSB0aGlzLiRzY2hlbWFbc2NoZW1hRmllbGRdW2ZpZWxkXS5kZWZhdWx0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHJldFZhbDtcbn07XG5cbk1vZGVsLmFwcGx5RGVsdGEgPSBmdW5jdGlvbiBhcHBseURlbHRhKGN1cnJlbnQsIGRlbHRhKSB7XG4gIGlmIChkZWx0YS5vcCA9PT0gJ2FkZCcgfHwgZGVsdGEub3AgPT09ICdtb2RpZnknKSB7XG4gICAgY29uc3QgcmV0VmFsID0gbWVyZ2VPcHRpb25zKHt9LCBjdXJyZW50LCBkZWx0YS5kYXRhKTtcbiAgICByZXR1cm4gcmV0VmFsO1xuICB9IGVsc2UgaWYgKGRlbHRhLm9wID09PSAncmVtb3ZlJykge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGN1cnJlbnQ7XG4gIH1cbn07XG5cbk1vZGVsLmFzc2lnbiA9IGZ1bmN0aW9uIGFzc2lnbihvcHRzKSB7XG4gIGNvbnN0IHNjaGVtYXRpemVkID0gdGhpcy5zY2hlbWF0aXplKG9wdHMsIHsgaW5jbHVkZUlkOiB0cnVlIH0pO1xuICBjb25zdCByZXRWYWwgPSB0aGlzLmFwcGx5RGVmYXVsdHMoc2NoZW1hdGl6ZWQpO1xuICBPYmplY3Qua2V5cyh0aGlzLiRzY2hlbWEpXG4gIC5maWx0ZXIoayA9PiBrWzBdICE9PSAnJCcpXG4gIC5mb3JFYWNoKHNjaGVtYUZpZWxkID0+IHtcbiAgICBmb3IgKGNvbnN0IGZpZWxkIGluIHRoaXMuJHNjaGVtYVtzY2hlbWFGaWVsZF0pIHtcbiAgICAgIGlmICghKGZpZWxkIGluIHJldFZhbFtzY2hlbWFGaWVsZF0pKSB7XG4gICAgICAgIHJldFZhbFtzY2hlbWFGaWVsZF1bZmllbGRdID0gc2NoZW1hRmllbGQgPT09ICdyZWxhdGlvbnNoaXBzJyA/IFtdIDogbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXRWYWwudHlwZSA9IHRoaXMuJG5hbWU7XG4gIHJldHVybiByZXRWYWw7XG59O1xuXG5Nb2RlbC5jYWNoZUdldCA9IGZ1bmN0aW9uIGNhY2hlR2V0KHN0b3JlLCBrZXkpIHtcbiAgcmV0dXJuICh0aGlzLiQkc3RvcmVDYWNoZS5nZXQoc3RvcmUpIHx8IHt9KVtrZXldO1xufTtcblxuTW9kZWwuY2FjaGVTZXQgPSBmdW5jdGlvbiBjYWNoZVNldChzdG9yZSwga2V5LCB2YWx1ZSkge1xuICBpZiAodGhpcy4kJHN0b3JlQ2FjaGUuZ2V0KHN0b3JlKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy4kJHN0b3JlQ2FjaGUuc2V0KHN0b3JlLCB7fSk7XG4gIH1cbiAgdGhpcy4kJHN0b3JlQ2FjaGUuZ2V0KHN0b3JlKVtrZXldID0gdmFsdWU7XG59O1xuXG5Nb2RlbC5yZXNvbHZlQW5kT3ZlcmxheSA9IGZ1bmN0aW9uIHJlc29sdmVBbmRPdmVybGF5KHVwZGF0ZSwgYmFzZSA9IHsgYXR0cmlidXRlczoge30sIHJlbGF0aW9uc2hpcHM6IHt9IH0pIHtcbiAgY29uc3QgYXR0cmlidXRlcyA9IG1lcmdlT3B0aW9ucyh7fSwgYmFzZS5hdHRyaWJ1dGVzLCB1cGRhdGUuYXR0cmlidXRlcyk7XG4gIGNvbnN0IGJhc2VJc1Jlc29sdmVkID0gT2JqZWN0LmtleXMoYmFzZS5yZWxhdGlvbnNoaXBzKS5tYXAocmVsTmFtZSA9PiB7XG4gICAgcmV0dXJuIGJhc2UucmVsYXRpb25zaGlwc1tyZWxOYW1lXS5tYXAocmVsID0+ICEoJ29wJyBpbiByZWwpKS5yZWR1Y2UoKGFjYywgY3VycikgPT4gYWNjICYmIGN1cnIsIHRydWUpO1xuICB9KS5yZWR1Y2UoKGFjYywgY3VycikgPT4gYWNjICYmIGN1cnIsIHRydWUpO1xuICBjb25zdCByZXNvbHZlZEJhc2VSZWxzID0gYmFzZUlzUmVzb2x2ZWQgPyBiYXNlLnJlbGF0aW9uc2hpcHMgOiB0aGlzLnJlc29sdmVSZWxhdGlvbnNoaXBzKGJhc2UucmVsYXRpb25zaGlwcyk7XG4gIGNvbnN0IHJlc29sdmVkUmVsYXRpb25zaGlwcyA9IHRoaXMucmVzb2x2ZVJlbGF0aW9uc2hpcHModXBkYXRlLnJlbGF0aW9uc2hpcHMsIHJlc29sdmVkQmFzZVJlbHMpO1xuICByZXR1cm4geyBhdHRyaWJ1dGVzLCByZWxhdGlvbnNoaXBzOiByZXNvbHZlZFJlbGF0aW9uc2hpcHMgfTtcbn07XG5cbk1vZGVsLnJlc29sdmVSZWxhdGlvbnNoaXBzID0gZnVuY3Rpb24gcmVzb2x2ZVJlbGF0aW9uc2hpcHMoZGVsdGFzLCBiYXNlID0ge30pIHtcbiAgY29uc3QgdXBkYXRlcyA9IE9iamVjdC5rZXlzKGRlbHRhcykubWFwKHJlbE5hbWUgPT4ge1xuICAgIGNvbnN0IHJlc29sdmVkID0gdGhpcy5yZXNvbHZlUmVsYXRpb25zaGlwKGRlbHRhc1tyZWxOYW1lXSwgYmFzZVtyZWxOYW1lXSk7XG4gICAgcmV0dXJuIHsgW3JlbE5hbWVdOiByZXNvbHZlZCB9O1xuICB9KVxuICAucmVkdWNlKChhY2MsIGN1cnIpID0+IG1lcmdlT3B0aW9ucyhhY2MsIGN1cnIpLCB7fSk7XG4gIHJldHVybiBtZXJnZU9wdGlvbnMoe30sIGJhc2UsIHVwZGF0ZXMpO1xufTtcblxuTW9kZWwucmVzb2x2ZVJlbGF0aW9uc2hpcCA9IGZ1bmN0aW9uIHJlc29sdmVSZWxhdGlvbnNoaXAoZGVsdGFzLCBiYXNlID0gW10pIHtcbiAgLy8gSW5kZXggY3VycmVudCByZWxhdGlvbnNoaXBzIGJ5IElEIGZvciBlZmZpY2llbnQgbW9kaWZpY2F0aW9uXG4gIGNvbnN0IHVwZGF0ZXMgPSBiYXNlLm1hcChyZWwgPT4ge1xuICAgIHJldHVybiB7IFtyZWwuaWRdOiByZWwgfTtcbiAgfSkucmVkdWNlKChhY2MsIGN1cnIpID0+IG1lcmdlT3B0aW9ucyhhY2MsIGN1cnIpLCB7fSk7XG5cbiAgLy8gQXBwbHkgZGVsdGFzIG9uIHRvcCBvZiB1cGRhdGVzXG4gIGRlbHRhcy5mb3JFYWNoKGRlbHRhID0+IHtcbiAgICBjb25zdCBjaGlsZElkID0gZGVsdGEuZGF0YSA/IGRlbHRhLmRhdGEuaWQgOiBkZWx0YS5pZDtcbiAgICB1cGRhdGVzW2NoaWxkSWRdID0gZGVsdGEub3AgPyB0aGlzLmFwcGx5RGVsdGEodXBkYXRlc1tjaGlsZElkXSwgZGVsdGEpIDogZGVsdGE7XG4gIH0pO1xuXG4gIC8vIFJlZHVjZSB1cGRhdGVzIGJhY2sgaW50byBsaXN0LCBvbWl0dGluZyB1bmRlZmluZWRzXG4gIHJldHVybiBPYmplY3Qua2V5cyh1cGRhdGVzKVxuICAgIC5tYXAoaWQgPT4gdXBkYXRlc1tpZF0pXG4gICAgLmZpbHRlcihyZWwgPT4gcmVsICE9PSB1bmRlZmluZWQpXG4gICAgLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBhY2MuY29uY2F0KGN1cnIpLCBbXSk7XG59O1xuXG5Nb2RlbC5zY2hlbWF0aXplID0gZnVuY3Rpb24gc2NoZW1hdGl6ZSh2ID0ge30sIG9wdHMgPSB7IGluY2x1ZGVJZDogZmFsc2UgfSkge1xuICBjb25zdCByZXRWYWwgPSB7fTtcbiAgaWYgKG9wdHMuaW5jbHVkZUlkKSB7XG4gICAgcmV0VmFsLmlkID0gdGhpcy4kaWQgaW4gdiA/IHZbdGhpcy4kaWRdIDogdi5pZDtcbiAgfVxuICBPYmplY3Qua2V5cyh0aGlzLiRzY2hlbWEpXG4gIC5maWx0ZXIoayA9PiBrWzBdICE9PSAnJCcpXG4gIC5mb3JFYWNoKHNjaGVtYUZpZWxkID0+IHtcbiAgICBpZiAoc2NoZW1hRmllbGQgaW4gdikge1xuICAgICAgcmV0VmFsW3NjaGVtYUZpZWxkXSA9IG1lcmdlT3B0aW9ucyh7fSwgdltzY2hlbWFGaWVsZF0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXRWYWxbc2NoZW1hRmllbGRdID0gcmV0VmFsW3NjaGVtYUZpZWxkXSB8fCB7fTtcbiAgICAgIGZvciAoY29uc3QgZmllbGQgaW4gdGhpcy4kc2NoZW1hW3NjaGVtYUZpZWxkXSkge1xuICAgICAgICBpZiAoZmllbGQgaW4gdikge1xuICAgICAgICAgIHJldFZhbFtzY2hlbWFGaWVsZF1bZmllbGRdID0gc2NoZW1hRmllbGQgPT09ICdyZWxhdGlvbnNoaXBzJyA/IHRoaXMuYWRkRGVsdGEoZmllbGQsIHZbZmllbGRdKSA6IHZbZmllbGRdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHJldFZhbDtcbn07XG5cbi8vIE1FVEFEQVRBXG5cbk1vZGVsLiQkc3RvcmVDYWNoZSA9IG5ldyBNYXAoKTtcblxuTW9kZWwuJGlkID0gJ2lkJztcbk1vZGVsLiRuYW1lID0gJ0Jhc2UnO1xuTW9kZWwuJHNjaGVtYSA9IHtcbiAgJG5hbWU6ICdiYXNlJyxcbiAgJGlkOiAnaWQnLFxuICBhdHRyaWJ1dGVzOiB7fSxcbiAgcmVsYXRpb25zaGlwczoge30sXG59O1xuTW9kZWwuJGluY2x1ZGVkID0gW107XG4iXX0=
