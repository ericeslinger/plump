'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Model = exports.$all = exports.$self = undefined;

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
    key: '$$schematize',
    value: function $$schematize(v) {
      var retVal = { attributes: {}, relationships: {} };
      for (var field in v) {
        if (field in this.$schema.attributes) {
          retVal.attributes[field] = v[field];
        } else if (field in this.$schema.relationships) {
          retVal.relationships[field] = v[field];
        }
      }
      return retVal;
    }
  }, {
    key: '$$flatten',
    value: function $$flatten(opts) {
      var _this = this;

      var key = opts || this.$dirtyFields;
      var keys = Array.isArray(key) ? key : [key];
      var retVal = {};
      keys.forEach(function (k) {
        if (_this[$dirty].attributes[k]) {
          retVal[k] = _this[$dirty].attributes[k];
        } else if (_this[$dirty].relationships[k]) {
          retVal[k] = _this.$$resolveRelDeltas(k);
        }
      });
      return retVal;
    }
  }, {
    key: '$$overlayDirty',
    value: function $$overlayDirty(v) {
      var retVal = (0, _mergeOptions2.default)({}, this.$$schematize(v));
      for (var attr in this[$dirty].attributes) {
        // eslint-disable-line guard-for-in
        if (!retVal.attributes) {
          retVal.attributes = {};
        }
        retVal.attributes[attr] = this[$dirty].attributes[attr];
      }
      for (var rel in this[$dirty].relationships) {
        // eslint-disable-line guard-for-in
        if (!retVal.relationships) {
          retVal.relationships = {};
        }
        var newRel = this.$$resolveRelDeltas(rel, retVal.relationships[rel]);
        retVal.relationships[rel] = newRel; // this.$$resolveRelDeltas(rel, retVal.relationships[rel]);
      }
      return retVal;
    }
  }, {
    key: '$$applyDelta',
    value: function $$applyDelta(current, delta) {
      if (delta.op === 'add' || delta.op === 'modify') {
        var retVal = (0, _mergeOptions2.default)({}, current, delta.data);
        return retVal;
      } else if (delta.op === 'remove') {
        return undefined;
      } else {
        return current;
      }
    }
  }, {
    key: '$$resolveRelDeltas',
    value: function $$resolveRelDeltas(relName, current) {
      var _this2 = this;

      // Index current relationships by ID for efficient modification
      var childIdField = this.$schema.relationships[relName].type.$sides[relName].other.field;
      var updates = (current || []).map(function (rel) {
        return _defineProperty({}, rel[childIdField], rel);
      }).reduce(function (acc, curr) {
        return (0, _mergeOptions2.default)(acc, curr);
      }, {});

      // Apply any deltas in dirty cache on top of updates
      if (relName in this[$dirty].relationships) {
        this[$dirty].relationships[relName].forEach(function (delta) {
          var childId = delta.data[childIdField];
          updates[childId] = _this2.$$applyDelta(updates[childId], delta);
        });
      }

      // Collapse updates back into list, omitting undefineds
      return Object.keys(updates).map(function (id) {
        return updates[id];
      }).filter(function (rel) {
        return rel !== undefined;
      }).reduce(function (acc, curr) {
        return acc.concat(curr);
      }, []);
    }
  }, {
    key: '$$copyValuesFrom',
    value: function $$copyValuesFrom() {
      var _this3 = this;

      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _loop = function _loop(key) {
        // eslint-disable-line guard-for-in
        // Deep copy arrays and objects
        if (key === _this3.constructor.$id) {
          _this3[_this3.constructor.$id] = opts[key];
        } else if (_this3.$schema.attributes[key]) {
          _this3[$dirty].attributes[key] = opts[key];
        } else if (_this3.$schema.relationships[key]) {
          if (!_this3[$dirty].relationships[key]) {
            _this3[$dirty].relationships[key] = [];
          }
          opts[key].forEach(function (rel) {
            _this3[$dirty].relationships[key].push({
              op: 'add',
              data: rel
            });
          });
        }
      };

      for (var key in opts) {
        _loop(key);
      }
      this.$$fireUpdate();
    }
  }, {
    key: '$$hookToPlump',
    value: function $$hookToPlump() {
      var _this4 = this;

      if (this[$unsubscribe] === undefined) {
        this[$unsubscribe] = this[$plump].subscribe(this.constructor.$name, this.$id, function (_ref2) {
          var field = _ref2.field,
              value = _ref2.value;

          if (field === undefined) {
            _this4.$$copyValuesFrom(value);
          } else {
            _this4.$$copyValuesFrom(_defineProperty({}, field, value));
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
      this[$plump].streamGet(this.constructor, this.$id, fields).subscribe(function (v) {
        _this5.$$fireUpdate(v);
      });
      return this[$subject].subscribe(cb);
    }
  }, {
    key: '$$resetDirty',
    value: function $$resetDirty(opts) {
      var _this6 = this;

      var key = opts || this.$dirtyFields;
      var keys = Array.isArray(key) ? key : [key];
      keys.forEach(function (field) {
        if (field in _this6[$dirty].attributes) {
          delete _this6[$dirty].attributes[field];
        } else if (field in _this6[$dirty].relationships) {
          delete _this6[$dirty].relationships[field];
        }
      });
    }
  }, {
    key: '$$fireUpdate',
    value: function $$fireUpdate(v) {
      var update = this.$$overlayDirty(v);
      if (this.$id) {
        update.id = this.$id;
      }
      this[$subject].next(update);
    }
  }, {
    key: '$get',
    value: function $get(opts) {
      var _this7 = this;

      return _bluebird2.default.resolve().then(function () {
        // If opts is falsy (i.e., undefined), get everything
        // Otherwise, get what was requested,
        // wrapping it in a Array if it wasn't already one
        var keys = opts && !Array.isArray(opts) ? [opts] : opts;
        return _this7[$plump].get(_this7.constructor, _this7.$id, keys);
      }).then(function (self) {
        var isClean = Object.keys(_this7[$dirty]).map(function (k) {
          return Object.keys(_this7[$dirty][k]).length;
        }).reduce(function (acc, curr) {
          return acc + curr;
        }, 0) === 0;
        if (!self && isClean) {
          return null;
        } else {
          var retVal = _this7.$$overlayDirty(self);
          retVal.type = _this7.$name;
          retVal.id = _this7.$id;
          return retVal;
        }
      });
    }
  }, {
    key: '$save',
    value: function $save(opts) {
      var _this8 = this;

      var update = this.$$flatten(opts);
      if (this.$id !== undefined) {
        update[this.constructor.$id] = this.$id;
      }
      return this[$plump].save(this.constructor, update).then(function (updated) {
        _this8.$$resetDirty(opts);
        if (updated[_this8.constructor.$id]) {
          _this8[_this8.constructor.$id] = updated[_this8.constructor.$id];
        }
        _this8.$$fireUpdate(updated);
        return _this8;
      });
    }
  }, {
    key: '$set',
    value: function $set(update) {
      this.$$copyValuesFrom(update);
      this.$$fireUpdate(update);
      return this;
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
        if (_this9.$schema.relationships[key]) {
          var id = 0;
          if (typeof item === 'number') {
            id = item;
          } else if (item.$id) {
            id = item.$id;
          } else {
            id = item[_this9.$schema.relationships[key].relationship.$sides[key].other.field];
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
      if (key in this.$schema.relationships) {
        var relSchema = this.$schema.relationships[key].type.$sides[key];
        var id = 0;
        if (typeof item === 'number') {
          id = item;
        } else {
          id = item.$id;
        }
        if (typeof id === 'number' && id >= 1) {
          var _Object$assign;

          if (!(key in this[$dirty].relationships)) {
            this[$dirty].relationships[key] = [];
          }
          this[$dirty].relationships[key].push({
            op: 'modify',
            data: Object.assign((_Object$assign = {}, _defineProperty(_Object$assign, relSchema.self.field, this.$id), _defineProperty(_Object$assign, relSchema.other.field, id), _Object$assign), extras)
          });
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
      if (key in this.$schema.relationships) {
        var relSchema = this.$schema.relationships[key].type.$sides[key];
        var id = 0;
        if (typeof item === 'number') {
          id = item;
        } else {
          id = item.$id;
        }
        if (typeof id === 'number' && id >= 1) {
          if (key in this[$dirty].relationships) {
            var _data;

            this[$dirty].relationships[key].push({
              op: 'remove',
              data: (_data = {}, _defineProperty(_data, relSchema.self.field, this.$id), _defineProperty(_data, relSchema.other.field, id), _data)
            });
          }
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
  }, {
    key: '$dirtyFields',
    get: function get() {
      var _this10 = this;

      return Object.keys(this[$dirty]).map(function (k) {
        return Object.keys(_this10[$dirty][k]);
      }).reduce(function (acc, curr) {
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

Model.assign = function assign(opts) {
  var _this12 = this;

  var start = {
    type: this.$name,
    id: opts[this.$schema.$id] || null,
    attributes: {},
    relationships: {}
  };
  ['attributes', 'relationships'].forEach(function (fieldType) {
    for (var key in _this12.$schema[fieldType]) {
      if (opts[key]) {
        start[fieldType][key] = opts[key];
      } else if (_this12.$schema[fieldType][key].default) {
        start[fieldType][key] = _this12.$schema[fieldType][key].default;
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRkaXJ0eSIsIlN5bWJvbCIsIiRwbHVtcCIsIiR1bnN1YnNjcmliZSIsIiRzdWJqZWN0IiwiJHNlbGYiLCIkYWxsIiwiTW9kZWwiLCJvcHRzIiwicGx1bXAiLCJFcnJvciIsImF0dHJpYnV0ZXMiLCJyZWxhdGlvbnNoaXBzIiwibmV4dCIsIiQkY29weVZhbHVlc0Zyb20iLCJ2IiwicmV0VmFsIiwiZmllbGQiLCIkc2NoZW1hIiwia2V5IiwiJGRpcnR5RmllbGRzIiwia2V5cyIsIkFycmF5IiwiaXNBcnJheSIsImZvckVhY2giLCJrIiwiJCRyZXNvbHZlUmVsRGVsdGFzIiwiJCRzY2hlbWF0aXplIiwiYXR0ciIsInJlbCIsIm5ld1JlbCIsImN1cnJlbnQiLCJkZWx0YSIsIm9wIiwiZGF0YSIsInVuZGVmaW5lZCIsInJlbE5hbWUiLCJjaGlsZElkRmllbGQiLCJ0eXBlIiwiJHNpZGVzIiwib3RoZXIiLCJ1cGRhdGVzIiwibWFwIiwicmVkdWNlIiwiYWNjIiwiY3VyciIsImNoaWxkSWQiLCIkJGFwcGx5RGVsdGEiLCJPYmplY3QiLCJpZCIsImZpbHRlciIsImNvbmNhdCIsImNvbnN0cnVjdG9yIiwiJGlkIiwicHVzaCIsIiQkZmlyZVVwZGF0ZSIsInN1YnNjcmliZSIsIiRuYW1lIiwidmFsdWUiLCJmaWVsZHMiLCJjYiIsImxlbmd0aCIsIiQkaG9va1RvUGx1bXAiLCJzdHJlYW1HZXQiLCJ1cGRhdGUiLCIkJG92ZXJsYXlEaXJ0eSIsInJlc29sdmUiLCJ0aGVuIiwiZ2V0IiwiaXNDbGVhbiIsInNlbGYiLCIkJGZsYXR0ZW4iLCJzYXZlIiwidXBkYXRlZCIsIiQkcmVzZXREaXJ0eSIsImRlbGV0ZSIsInJlc3RPcHRzIiwiYXNzaWduIiwidXJsIiwicmVzdFJlcXVlc3QiLCJpdGVtIiwiZXh0cmFzIiwicmVsYXRpb25zaGlwIiwiYWRkIiwicmVqZWN0IiwibCIsInJlbFNjaGVtYSIsIm1vZGlmeVJlbGF0aW9uc2hpcCIsInJlbW92ZSIsInVuc3Vic2NyaWJlIiwiZnJvbUpTT04iLCJqc29uIiwiJGluY2x1ZGUiLCJEeW5hbWljUmVsYXRpb25zaGlwIiwidG9KU09OIiwiJHJlc3QiLCJzdGFydCIsImZpZWxkVHlwZSIsImRlZmF1bHQiLCIkaW5jbHVkZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7Ozs7O0FBQ0EsSUFBTUEsU0FBU0MsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNQyxTQUFTRCxPQUFPLFFBQVAsQ0FBZjtBQUNBLElBQU1FLGVBQWVGLE9BQU8sY0FBUCxDQUFyQjtBQUNBLElBQU1HLFdBQVdILE9BQU8sVUFBUCxDQUFqQjtBQUNPLElBQU1JLHdCQUFRSixPQUFPLE9BQVAsQ0FBZDtBQUNBLElBQU1LLHNCQUFPTCxPQUFPLE1BQVAsQ0FBYjs7QUFFUDtBQUNBOztJQUVhTSxLLFdBQUFBLEs7QUFDWCxpQkFBWUMsSUFBWixFQUFrQkMsS0FBbEIsRUFBeUI7QUFBQTs7QUFDdkIsUUFBSUEsS0FBSixFQUFXO0FBQ1QsV0FBS1AsTUFBTCxJQUFlTyxLQUFmO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsWUFBTSxJQUFJQyxLQUFKLENBQVUsOENBQVYsQ0FBTjtBQUNEO0FBQ0Q7QUFDQSxTQUFLVixNQUFMLElBQWU7QUFDYlcsa0JBQVksRUFEQyxFQUNHO0FBQ2hCQyxxQkFBZSxFQUZGLEVBQWY7QUFJQSxTQUFLUixRQUFMLElBQWlCLHlCQUFqQjtBQUNBLFNBQUtBLFFBQUwsRUFBZVMsSUFBZixDQUFvQixFQUFwQjtBQUNBLFNBQUtDLGdCQUFMLENBQXNCTixJQUF0QjtBQUNEOzs7O2lDQW1CWU8sQyxFQUFHO0FBQ2QsVUFBTUMsU0FBUyxFQUFFTCxZQUFZLEVBQWQsRUFBa0JDLGVBQWUsRUFBakMsRUFBZjtBQUNBLFdBQUssSUFBTUssS0FBWCxJQUFvQkYsQ0FBcEIsRUFBdUI7QUFDckIsWUFBSUUsU0FBUyxLQUFLQyxPQUFMLENBQWFQLFVBQTFCLEVBQXNDO0FBQ3BD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QUFoQjtBQUtBTCxNQUFNNEYsU0FBTixHQUFrQixFQUFsQiIsImZpbGUiOiJtb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBSZWxhdGlvbnNoaXAgfSBmcm9tICcuL3JlbGF0aW9uc2hpcCc7XG5pbXBvcnQgbWVyZ2VPcHRpb25zIGZyb20gJ21lcmdlLW9wdGlvbnMnO1xuaW1wb3J0IHsgQmVoYXZpb3JTdWJqZWN0IH0gZnJvbSAncnhqcy9SeCc7XG5jb25zdCAkZGlydHkgPSBTeW1ib2woJyRkaXJ0eScpO1xuY29uc3QgJHBsdW1wID0gU3ltYm9sKCckcGx1bXAnKTtcbmNvbnN0ICR1bnN1YnNjcmliZSA9IFN5bWJvbCgnJHVuc3Vic2NyaWJlJyk7XG5jb25zdCAkc3ViamVjdCA9IFN5bWJvbCgnJHN1YmplY3QnKTtcbmV4cG9ydCBjb25zdCAkc2VsZiA9IFN5bWJvbCgnJHNlbGYnKTtcbmV4cG9ydCBjb25zdCAkYWxsID0gU3ltYm9sKCckYWxsJyk7XG5cbi8vIFRPRE86IGZpZ3VyZSBvdXQgd2hlcmUgZXJyb3IgZXZlbnRzIG9yaWdpbmF0ZSAoc3RvcmFnZSBvciBtb2RlbClcbi8vIGFuZCB3aG8ga2VlcHMgYSByb2xsLWJhY2thYmxlIGRlbHRhXG5cbmV4cG9ydCBjbGFzcyBNb2RlbCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMsIHBsdW1wKSB7XG4gICAgaWYgKHBsdW1wKSB7XG4gICAgICB0aGlzWyRwbHVtcF0gPSBwbHVtcDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY29uc3RydWN0IFBsdW1wIG1vZGVsIHdpdGhvdXQgYSBQbHVtcCcpO1xuICAgIH1cbiAgICAvLyBUT0RPOiBEZWZpbmUgRGVsdGEgaW50ZXJmYWNlXG4gICAgdGhpc1skZGlydHldID0ge1xuICAgICAgYXR0cmlidXRlczoge30sIC8vIFNpbXBsZSBrZXktdmFsdWVcbiAgICAgIHJlbGF0aW9uc2hpcHM6IHt9LCAvLyByZWxOYW1lOiBEZWx0YVtdXG4gICAgfTtcbiAgICB0aGlzWyRzdWJqZWN0XSA9IG5ldyBCZWhhdmlvclN1YmplY3QoKTtcbiAgICB0aGlzWyRzdWJqZWN0XS5uZXh0KHt9KTtcbiAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20ob3B0cyk7XG4gIH1cblxuICBnZXQgJG5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuJG5hbWU7XG4gIH1cblxuICBnZXQgJGlkKCkge1xuICAgIHJldHVybiB0aGlzW3RoaXMuY29uc3RydWN0b3IuJGlkXTtcbiAgfVxuXG4gIGdldCAkc2NoZW1hKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLiRzY2hlbWE7XG4gIH1cblxuICBnZXQgJGRpcnR5RmllbGRzKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzWyRkaXJ0eV0pLm1hcChrID0+IE9iamVjdC5rZXlzKHRoaXNbJGRpcnR5XVtrXSkpXG4gICAgLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBhY2MuY29uY2F0KGN1cnIpLCBbXSk7XG4gIH1cblxuICAkJHNjaGVtYXRpemUodikge1xuICAgIGNvbnN0IHJldFZhbCA9IHsgYXR0cmlidXRlczoge30sIHJlbGF0aW9uc2hpcHM6IHt9IH07XG4gICAgZm9yIChjb25zdCBmaWVsZCBpbiB2KSB7XG4gICAgICBpZiAoZmllbGQgaW4gdGhpcy4kc2NoZW1hLmF0dHJpYnV0ZXMpIHtcbiAgICAgICAgcmV0VmFsLmF0dHJpYnV0ZXNbZmllbGRdID0gdltmaWVsZF07XG4gICAgICB9IGVsc2UgaWYgKGZpZWxkIGluIHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzKSB7XG4gICAgICAgIHJldFZhbC5yZWxhdGlvbnNoaXBzW2ZpZWxkXSA9IHZbZmllbGRdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0VmFsO1xuICB9XG5cbiAgJCRmbGF0dGVuKG9wdHMpIHtcbiAgICBjb25zdCBrZXkgPSBvcHRzIHx8IHRoaXMuJGRpcnR5RmllbGRzO1xuICAgIGNvbnN0IGtleXMgPSBBcnJheS5pc0FycmF5KGtleSkgPyBrZXkgOiBba2V5XTtcbiAgICBjb25zdCByZXRWYWwgPSB7fTtcbiAgICBrZXlzLmZvckVhY2goayA9PiB7XG4gICAgICBpZiAodGhpc1skZGlydHldLmF0dHJpYnV0ZXNba10pIHtcbiAgICAgICAgcmV0VmFsW2tdID0gdGhpc1skZGlydHldLmF0dHJpYnV0ZXNba107XG4gICAgICB9IGVsc2UgaWYgKHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzW2tdKSB7XG4gICAgICAgIHJldFZhbFtrXSA9IHRoaXMuJCRyZXNvbHZlUmVsRGVsdGFzKGspO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXRWYWw7XG4gIH1cblxuICAkJG92ZXJsYXlEaXJ0eSh2KSB7XG4gICAgY29uc3QgcmV0VmFsID0gbWVyZ2VPcHRpb25zKHt9LCB0aGlzLiQkc2NoZW1hdGl6ZSh2KSk7XG4gICAgZm9yIChjb25zdCBhdHRyIGluIHRoaXNbJGRpcnR5XS5hdHRyaWJ1dGVzKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZ3VhcmQtZm9yLWluXG4gICAgICBpZiAoIXJldFZhbC5hdHRyaWJ1dGVzKSB7XG4gICAgICAgIHJldFZhbC5hdHRyaWJ1dGVzID0ge307XG4gICAgICB9XG4gICAgICByZXRWYWwuYXR0cmlidXRlc1thdHRyXSA9IHRoaXNbJGRpcnR5XS5hdHRyaWJ1dGVzW2F0dHJdO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHJlbCBpbiB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwcykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGd1YXJkLWZvci1pblxuICAgICAgaWYgKCFyZXRWYWwucmVsYXRpb25zaGlwcykge1xuICAgICAgICByZXRWYWwucmVsYXRpb25zaGlwcyA9IHt9O1xuICAgICAgfVxuICAgICAgY29uc3QgbmV3UmVsID0gdGhpcy4kJHJlc29sdmVSZWxEZWx0YXMocmVsLCByZXRWYWwucmVsYXRpb25zaGlwc1tyZWxdKTtcbiAgICAgIHJldFZhbC5yZWxhdGlvbnNoaXBzW3JlbF0gPSBuZXdSZWw7IC8vIHRoaXMuJCRyZXNvbHZlUmVsRGVsdGFzKHJlbCwgcmV0VmFsLnJlbGF0aW9uc2hpcHNbcmVsXSk7XG4gICAgfVxuICAgIHJldHVybiByZXRWYWw7XG4gIH1cblxuICAkJGFwcGx5RGVsdGEoY3VycmVudCwgZGVsdGEpIHtcbiAgICBpZiAoZGVsdGEub3AgPT09ICdhZGQnIHx8IGRlbHRhLm9wID09PSAnbW9kaWZ5Jykge1xuICAgICAgY29uc3QgcmV0VmFsID0gbWVyZ2VPcHRpb25zKHt9LCBjdXJyZW50LCBkZWx0YS5kYXRhKTtcbiAgICAgIHJldHVybiByZXRWYWw7XG4gICAgfSBlbHNlIGlmIChkZWx0YS5vcCA9PT0gJ3JlbW92ZScpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdXJyZW50O1xuICAgIH1cbiAgfVxuXG4gICQkcmVzb2x2ZVJlbERlbHRhcyhyZWxOYW1lLCBjdXJyZW50KSB7XG4gICAgLy8gSW5kZXggY3VycmVudCByZWxhdGlvbnNoaXBzIGJ5IElEIGZvciBlZmZpY2llbnQgbW9kaWZpY2F0aW9uXG4gICAgY29uc3QgY2hpbGRJZEZpZWxkID0gdGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0udHlwZS4kc2lkZXNbcmVsTmFtZV0ub3RoZXIuZmllbGQ7XG4gICAgY29uc3QgdXBkYXRlcyA9IChjdXJyZW50IHx8IFtdKS5tYXAocmVsID0+IHtcbiAgICAgIHJldHVybiB7IFtyZWxbY2hpbGRJZEZpZWxkXV06IHJlbCB9O1xuICAgIH0pLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBtZXJnZU9wdGlvbnMoYWNjLCBjdXJyKSwge30pO1xuXG4gICAgLy8gQXBwbHkgYW55IGRlbHRhcyBpbiBkaXJ0eSBjYWNoZSBvbiB0b3Agb2YgdXBkYXRlc1xuICAgIGlmIChyZWxOYW1lIGluIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzKSB7XG4gICAgICB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwc1tyZWxOYW1lXS5mb3JFYWNoKGRlbHRhID0+IHtcbiAgICAgICAgY29uc3QgY2hpbGRJZCA9IGRlbHRhLmRhdGFbY2hpbGRJZEZpZWxkXTtcbiAgICAgICAgdXBkYXRlc1tjaGlsZElkXSA9IHRoaXMuJCRhcHBseURlbHRhKHVwZGF0ZXNbY2hpbGRJZF0sIGRlbHRhKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIENvbGxhcHNlIHVwZGF0ZXMgYmFjayBpbnRvIGxpc3QsIG9taXR0aW5nIHVuZGVmaW5lZHNcbiAgICByZXR1cm4gT2JqZWN0LmtleXModXBkYXRlcylcbiAgICAgIC5tYXAoaWQgPT4gdXBkYXRlc1tpZF0pXG4gICAgICAuZmlsdGVyKHJlbCA9PiByZWwgIT09IHVuZGVmaW5lZClcbiAgICAgIC5yZWR1Y2UoKGFjYywgY3VycikgPT4gYWNjLmNvbmNhdChjdXJyKSwgW10pO1xuICB9XG5cbiAgJCRjb3B5VmFsdWVzRnJvbShvcHRzID0ge30pIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBvcHRzKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZ3VhcmQtZm9yLWluXG4gICAgICAvLyBEZWVwIGNvcHkgYXJyYXlzIGFuZCBvYmplY3RzXG4gICAgICBpZiAoa2V5ID09PSB0aGlzLmNvbnN0cnVjdG9yLiRpZCkge1xuICAgICAgICB0aGlzW3RoaXMuY29uc3RydWN0b3IuJGlkXSA9IG9wdHNba2V5XTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy4kc2NoZW1hLmF0dHJpYnV0ZXNba2V5XSkge1xuICAgICAgICB0aGlzWyRkaXJ0eV0uYXR0cmlidXRlc1trZXldID0gb3B0c1trZXldO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwc1trZXldKSB7XG4gICAgICAgIGlmICghdGhpc1skZGlydHldLnJlbGF0aW9uc2hpcHNba2V5XSkge1xuICAgICAgICAgIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzW2tleV0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICBvcHRzW2tleV0uZm9yRWFjaChyZWwgPT4ge1xuICAgICAgICAgIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzW2tleV0ucHVzaCh7XG4gICAgICAgICAgICBvcDogJ2FkZCcsXG4gICAgICAgICAgICBkYXRhOiByZWwsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLiQkZmlyZVVwZGF0ZSgpO1xuICB9XG5cbiAgJCRob29rVG9QbHVtcCgpIHtcbiAgICBpZiAodGhpc1skdW5zdWJzY3JpYmVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHVuc3Vic2NyaWJlXSA9IHRoaXNbJHBsdW1wXS5zdWJzY3JpYmUodGhpcy5jb25zdHJ1Y3Rvci4kbmFtZSwgdGhpcy4kaWQsICh7IGZpZWxkLCB2YWx1ZSB9KSA9PiB7XG4gICAgICAgIGlmIChmaWVsZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20oeyBbZmllbGRdOiB2YWx1ZSB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgJHN1YnNjcmliZSguLi5hcmdzKSB7XG4gICAgbGV0IGZpZWxkcyA9IFskc2VsZl07XG4gICAgbGV0IGNiO1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMikge1xuICAgICAgZmllbGRzID0gYXJnc1swXTtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShmaWVsZHMpKSB7XG4gICAgICAgIGZpZWxkcyA9IFtmaWVsZHNdO1xuICAgICAgfVxuICAgICAgY2IgPSBhcmdzWzFdO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYiA9IGFyZ3NbMF07XG4gICAgfVxuICAgIHRoaXMuJCRob29rVG9QbHVtcCgpO1xuICAgIHRoaXNbJHBsdW1wXS5zdHJlYW1HZXQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGZpZWxkcylcbiAgICAuc3Vic2NyaWJlKCh2KSA9PiB7XG4gICAgICB0aGlzLiQkZmlyZVVwZGF0ZSh2KTtcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpc1skc3ViamVjdF0uc3Vic2NyaWJlKGNiKTtcbiAgfVxuXG4gICQkcmVzZXREaXJ0eShvcHRzKSB7XG4gICAgY29uc3Qga2V5ID0gb3B0cyB8fCB0aGlzLiRkaXJ0eUZpZWxkcztcbiAgICBjb25zdCBrZXlzID0gQXJyYXkuaXNBcnJheShrZXkpID8ga2V5IDogW2tleV07XG4gICAga2V5cy5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgIGlmIChmaWVsZCBpbiB0aGlzWyRkaXJ0eV0uYXR0cmlidXRlcykge1xuICAgICAgICBkZWxldGUgdGhpc1skZGlydHldLmF0dHJpYnV0ZXNbZmllbGRdO1xuICAgICAgfSBlbHNlIGlmIChmaWVsZCBpbiB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwcykge1xuICAgICAgICBkZWxldGUgdGhpc1skZGlydHldLnJlbGF0aW9uc2hpcHNbZmllbGRdO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgJCRmaXJlVXBkYXRlKHYpIHtcbiAgICBjb25zdCB1cGRhdGUgPSB0aGlzLiQkb3ZlcmxheURpcnR5KHYpO1xuICAgIGlmICh0aGlzLiRpZCkge1xuICAgICAgdXBkYXRlLmlkID0gdGhpcy4kaWQ7XG4gICAgfVxuICAgIHRoaXNbJHN1YmplY3RdLm5leHQodXBkYXRlKTtcbiAgfVxuXG4gICRnZXQob3B0cykge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICAvLyBJZiBvcHRzIGlzIGZhbHN5IChpLmUuLCB1bmRlZmluZWQpLCBnZXQgZXZlcnl0aGluZ1xuICAgICAgLy8gT3RoZXJ3aXNlLCBnZXQgd2hhdCB3YXMgcmVxdWVzdGVkLFxuICAgICAgLy8gd3JhcHBpbmcgaXQgaW4gYSBBcnJheSBpZiBpdCB3YXNuJ3QgYWxyZWFkeSBvbmVcbiAgICAgIGNvbnN0IGtleXMgPSBvcHRzICYmICFBcnJheS5pc0FycmF5KG9wdHMpID8gW29wdHNdIDogb3B0cztcbiAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZ2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXlzKTtcbiAgICB9KS50aGVuKHNlbGYgPT4ge1xuICAgICAgY29uc3QgaXNDbGVhbiA9IE9iamVjdC5rZXlzKHRoaXNbJGRpcnR5XSlcbiAgICAgIC5tYXAoayA9PiBPYmplY3Qua2V5cyh0aGlzWyRkaXJ0eV1ba10pLmxlbmd0aClcbiAgICAgIC5yZWR1Y2UoKGFjYywgY3VycikgPT4gYWNjICsgY3VyciwgMCkgPT09IDA7XG4gICAgICBpZiAoIXNlbGYgJiYgaXNDbGVhbikge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHJldFZhbCA9IHRoaXMuJCRvdmVybGF5RGlydHkoc2VsZik7XG4gICAgICAgIHJldFZhbC50eXBlID0gdGhpcy4kbmFtZTtcbiAgICAgICAgcmV0VmFsLmlkID0gdGhpcy4kaWQ7XG4gICAgICAgIHJldHVybiByZXRWYWw7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAkc2F2ZShvcHRzKSB7XG4gICAgY29uc3QgdXBkYXRlID0gdGhpcy4kJGZsYXR0ZW4ob3B0cyk7XG4gICAgaWYgKHRoaXMuJGlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHVwZGF0ZVt0aGlzLmNvbnN0cnVjdG9yLiRpZF0gPSB0aGlzLiRpZDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5zYXZlKHRoaXMuY29uc3RydWN0b3IsIHVwZGF0ZSlcbiAgICAudGhlbigodXBkYXRlZCkgPT4ge1xuICAgICAgdGhpcy4kJHJlc2V0RGlydHkob3B0cyk7XG4gICAgICBpZiAodXBkYXRlZFt0aGlzLmNvbnN0cnVjdG9yLiRpZF0pIHtcbiAgICAgICAgdGhpc1t0aGlzLmNvbnN0cnVjdG9yLiRpZF0gPSB1cGRhdGVkW3RoaXMuY29uc3RydWN0b3IuJGlkXTtcbiAgICAgIH1cbiAgICAgIHRoaXMuJCRmaXJlVXBkYXRlKHVwZGF0ZWQpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSk7XG4gIH1cblxuICAkc2V0KHVwZGF0ZSkge1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh1cGRhdGUpO1xuICAgIHRoaXMuJCRmaXJlVXBkYXRlKHVwZGF0ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAkZGVsZXRlKCkge1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZGVsZXRlKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkKTtcbiAgfVxuXG4gICRyZXN0KG9wdHMpIHtcbiAgICBjb25zdCByZXN0T3B0cyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIG9wdHMsXG4gICAgICB7XG4gICAgICAgIHVybDogYC8ke3RoaXMuY29uc3RydWN0b3IuJG5hbWV9LyR7dGhpcy4kaWR9LyR7b3B0cy51cmx9YCxcbiAgICAgIH1cbiAgICApO1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0ucmVzdFJlcXVlc3QocmVzdE9wdHMpO1xuICB9XG5cbiAgJGFkZChrZXksIGl0ZW0sIGV4dHJhcykge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBpZiAodGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHNba2V5XSkge1xuICAgICAgICBsZXQgaWQgPSAwO1xuICAgICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgICB9IGVsc2UgaWYgKGl0ZW0uJGlkKSB7XG4gICAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZCA9IGl0ZW1bdGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHNba2V5XS5yZWxhdGlvbnNoaXAuJHNpZGVzW2tleV0ub3RoZXIuZmllbGRdO1xuICAgICAgICB9XG4gICAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5hZGQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaWQsIGV4dHJhcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSBhZGRlZCB0byBoYXNNYW55JykpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRhZGQgZXhjZXB0IHRvIGhhc01hbnkgZmllbGQnKSk7XG4gICAgICB9XG4gICAgfSkudGhlbigobCkgPT4ge1xuICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHsgW2tleV06IGwgfSk7XG4gICAgICByZXR1cm4gbDtcbiAgICB9KTtcbiAgfVxuXG4gICRtb2RpZnlSZWxhdGlvbnNoaXAoa2V5LCBpdGVtLCBleHRyYXMpIHtcbiAgICBpZiAoa2V5IGluIHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzKSB7XG4gICAgICBjb25zdCByZWxTY2hlbWEgPSB0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwc1trZXldLnR5cGUuJHNpZGVzW2tleV07XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgaWYgKCEoa2V5IGluIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzKSkge1xuICAgICAgICAgIHRoaXNbJGRpcnR5XS5yZWxhdGlvbnNoaXBzW2tleV0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwc1trZXldLnB1c2goe1xuICAgICAgICAgIG9wOiAnbW9kaWZ5JyxcbiAgICAgICAgICBkYXRhOiBPYmplY3QuYXNzaWduKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBbcmVsU2NoZW1hLnNlbGYuZmllbGRdOiB0aGlzLiRpZCxcbiAgICAgICAgICAgICAgW3JlbFNjaGVtYS5vdGhlci5maWVsZF06IGlkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4dHJhc1xuICAgICAgICAgICksXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLm1vZGlmeVJlbGF0aW9uc2hpcCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpZCwgZXh0cmFzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gYWRkZWQgdG8gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICRyZW1vdmUoa2V5LCBpdGVtKSB7XG4gICAgaWYgKGtleSBpbiB0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwcykge1xuICAgICAgY29uc3QgcmVsU2NoZW1hID0gdGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHNba2V5XS50eXBlLiRzaWRlc1trZXldO1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIGlmIChrZXkgaW4gdGhpc1skZGlydHldLnJlbGF0aW9uc2hpcHMpIHtcbiAgICAgICAgICB0aGlzWyRkaXJ0eV0ucmVsYXRpb25zaGlwc1trZXldLnB1c2goe1xuICAgICAgICAgICAgb3A6ICdyZW1vdmUnLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICBbcmVsU2NoZW1hLnNlbGYuZmllbGRdOiB0aGlzLiRpZCxcbiAgICAgICAgICAgICAgW3JlbFNjaGVtYS5vdGhlci5maWVsZF06IGlkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLnJlbW92ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtICRyZW1vdmVkIGZyb20gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkcmVtb3ZlIGV4Y2VwdCBmcm9tIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG5cbiAgJHRlYXJkb3duKCkge1xuICAgIGlmICh0aGlzWyR1bnN1YnNjcmliZV0pIHtcbiAgICAgIHRoaXNbJHVuc3Vic2NyaWJlXS51bnN1YnNjcmliZSgpO1xuICAgIH1cbiAgfVxufVxuXG5Nb2RlbC5mcm9tSlNPTiA9IGZ1bmN0aW9uIGZyb21KU09OKGpzb24pIHtcbiAgdGhpcy4kaWQgPSBqc29uLiRpZCB8fCAnaWQnO1xuICB0aGlzLiRuYW1lID0ganNvbi4kbmFtZTtcbiAgdGhpcy4kaW5jbHVkZSA9IGpzb24uJGluY2x1ZGU7XG4gIHRoaXMuJHNjaGVtYSA9IHtcbiAgICBhdHRyaWJ1dGVzOiBtZXJnZU9wdGlvbnMoanNvbi4kc2NoZW1hLmF0dHJpYnV0ZXMpLFxuICAgIHJlbGF0aW9uc2hpcHM6IHt9LFxuICB9O1xuICBmb3IgKGNvbnN0IHJlbCBpbiBqc29uLiRzY2hlbWEucmVsYXRpb25zaGlwcykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGd1YXJkLWZvci1pblxuICAgIHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbF0gPSB7fTtcbiAgICBjbGFzcyBEeW5hbWljUmVsYXRpb25zaGlwIGV4dGVuZHMgUmVsYXRpb25zaGlwIHt9XG4gICAgRHluYW1pY1JlbGF0aW9uc2hpcC5mcm9tSlNPTihqc29uLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxdKTtcbiAgICB0aGlzLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxdLnR5cGUgPSBEeW5hbWljUmVsYXRpb25zaGlwO1xuICB9XG59O1xuXG5Nb2RlbC50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04oKSB7XG4gIGNvbnN0IHJldFZhbCA9IHtcbiAgICAkaWQ6IHRoaXMuJGlkLFxuICAgICRuYW1lOiB0aGlzLiRuYW1lLFxuICAgICRpbmNsdWRlOiB0aGlzLiRpbmNsdWRlLFxuICAgICRzY2hlbWE6IHsgYXR0cmlidXRlczogdGhpcy4kc2NoZW1hLmF0dHJpYnV0ZXMsIHJlbGF0aW9uc2hpcHM6IHt9IH0sXG4gIH07XG4gIGZvciAoY29uc3QgcmVsIGluIHRoaXMuJHNjaGVtYS5yZWxhdGlvbnNoaXBzKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZ3VhcmQtZm9yLWluXG4gICAgcmV0VmFsLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxdID0gdGhpcy4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsXS50eXBlLnRvSlNPTigpO1xuICB9XG4gIHJldHVybiByZXRWYWw7XG59O1xuXG5Nb2RlbC4kcmVzdCA9IGZ1bmN0aW9uICRyZXN0KHBsdW1wLCBvcHRzKSB7XG4gIGNvbnN0IHJlc3RPcHRzID0gT2JqZWN0LmFzc2lnbihcbiAgICB7fSxcbiAgICBvcHRzLFxuICAgIHtcbiAgICAgIHVybDogYC8ke3RoaXMuJG5hbWV9LyR7b3B0cy51cmx9YCxcbiAgICB9XG4gICk7XG4gIHJldHVybiBwbHVtcC5yZXN0UmVxdWVzdChyZXN0T3B0cyk7XG59O1xuXG5Nb2RlbC5hc3NpZ24gPSBmdW5jdGlvbiBhc3NpZ24ob3B0cykge1xuICBjb25zdCBzdGFydCA9IHtcbiAgICB0eXBlOiB0aGlzLiRuYW1lLFxuICAgIGlkOiBvcHRzW3RoaXMuJHNjaGVtYS4kaWRdIHx8IG51bGwsXG4gICAgYXR0cmlidXRlczoge30sXG4gICAgcmVsYXRpb25zaGlwczoge30sXG4gIH07XG4gIFsnYXR0cmlidXRlcycsICdyZWxhdGlvbnNoaXBzJ10uZm9yRWFjaChmaWVsZFR5cGUgPT4ge1xuICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMuJHNjaGVtYVtmaWVsZFR5cGVdKSB7XG4gICAgICBpZiAob3B0c1trZXldKSB7XG4gICAgICAgIHN0YXJ0W2ZpZWxkVHlwZV1ba2V5XSA9IG9wdHNba2V5XTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy4kc2NoZW1hW2ZpZWxkVHlwZV1ba2V5XS5kZWZhdWx0KSB7XG4gICAgICAgIHN0YXJ0W2ZpZWxkVHlwZV1ba2V5XSA9IHRoaXMuJHNjaGVtYVtmaWVsZFR5cGVdW2tleV0uZGVmYXVsdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXJ0W2ZpZWxkVHlwZV1ba2V5XSA9IGZpZWxkVHlwZSA9PT0gJ2F0dHJpYnV0ZXMnID8gbnVsbCA6IFtdO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIHJldHVybiBzdGFydDtcbn07XG5cbk1vZGVsLiRpZCA9ICdpZCc7XG5Nb2RlbC4kbmFtZSA9ICdCYXNlJztcbk1vZGVsLiRzZWxmID0gJHNlbGY7XG5Nb2RlbC4kc2NoZW1hID0ge1xuICAkaWQ6ICdpZCcsXG4gIGF0dHJpYnV0ZXM6IHt9LFxuICByZWxhdGlvbnNoaXBzOiB7fSxcbn07XG5Nb2RlbC4kaW5jbHVkZWQgPSBbXTtcbiJdfQ==
