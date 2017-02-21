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
    key: '$$copyValuesFrom',
    value: function $$copyValuesFrom() {
      var _this = this;

      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _loop = function _loop(key) {
        // eslint-disable-line guard-for-in
        // Deep copy arrays and objects
        if (key === _this.constructor.$id) {
          _this[_this.constructor.$id] = opts[key];
        } else if (_this.$schema.attributes[key]) {
          _this[$dirty].attributes[key] = opts[key];
        } else if (_this.$schema.relationships[key]) {
          if (!_this[$dirty].relationships[key]) {
            _this[$dirty].relationships[key] = [];
          }
          opts[key].forEach(function (rel) {
            _this[$dirty].relationships[key].push({
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
      var _this2 = this;

      if (this[$unsubscribe] === undefined) {
        this[$unsubscribe] = this[$plump].subscribe(this.constructor.$name, this.$id, function (_ref) {
          var field = _ref.field,
              value = _ref.value;

          if (field !== undefined) {
            // this.$$copyValuesFrom(value);
            _this2.$$copyValuesFrom(_defineProperty({}, field, value));
          }
        });
      }
    }
  }, {
    key: '$subscribe',
    value: function $subscribe() {
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
      // if (this[$loaded][$self] === false) {
      //   this[$plump].streamGet(this.constructor, this.$id, fields)
      //   .subscribe((v) => this.$$copyValuesFrom(v));
      // }
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
      var update = (0, _mergeOptions2.default)(this[$dirty]);
      if (this.$id) {
        update.id = this.$id;
      }
      this[$subject].next(update);
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
          // copy from DB data
          for (var key in self) {
            if (_this3.$schema.attributes[key]) {
              retVal.attributes[key] = self[key];
            } else if (_this3.$schema.relationships[key]) {
              retVal.relationships[key] = self[key];
            }
          }
          // override from dirty cache
          for (var attr in _this3[$dirty].attributes) {
            // eslint-disable-line guard-for-in
            retVal.attributes[attr] = _this3[$dirty].attributes[attr];
          }
          for (var rel in _this3[$dirty].relationships) {
            // eslint-disable-line guard-for-in
            retVal[rel] = _this3.$$resolveRelDeltas(retVal[rel], rel);
          }
          return retVal;
        }
      });
    }
  }, {
    key: '$$applyDelta',
    value: function $$applyDelta(current, delta) {
      if (delta.op === 'add' || delta.op === 'modify') {
        return (0, _mergeOptions2.default)({}, current, delta.data);
      } else if (delta.op === 'remove') {
        return undefined;
      } else {
        return current;
      }
    }
  }, {
    key: '$$resolveRelDeltas',
    value: function $$resolveRelDeltas(current, opts) {
      var _this4 = this;

      var key = opts || this.$dirtyFields;
      var keys = Array.isArray(key) ? key : [key];
      var updates = {};
      for (var relName in current) {
        if (current in this.$schema.relationships) {
          updates[relName] = current[relName].map(function (rel) {
            return _defineProperty({}, rel.id, rel);
          }).reduce(function (acc, curr) {
            return (0, _mergeOptions2.default)(acc, curr);
          }, {});
        }
      }

      var _loop2 = function _loop2(_relName) {
        // Apply any deltas in dirty cache on top of updates
        if (_relName in _this4[$dirty].relationships) {
          _this4[$dirty].relationships.forEach(function (delta) {
            if (!updates[_relName]) {
              updates[_relName] = {};
            }
            updates[_relName][delta.data.id] = _this4.$$applyDelta(updates[_relName][delta.data.id], delta);
          });
        }
      };

      for (var _relName in keys) {
        _loop2(_relName);
      }

      // Collapse updates back into list, omitting undefineds
      return Object.keys(updates).map(function (relName) {
        return _defineProperty({}, relName, Object.keys(updates[relName]).map(function (id) {
          return updates[relName][id];
        }).filter(function (rel) {
          return rel !== undefined;
        }).reduce(function (acc, curr) {
          return acc.concat(curr);
        }, []));
      });
    }
  }, {
    key: '$save',
    value: function $save(opts) {
      var _this5 = this;

      var key = opts || this.$dirtyFields;
      var keys = Array.isArray(key) ? key : [key];
      var update = {};
      if (this.$id) {
        update[this.constructor.$id] = this.$id;
      }
      keys.forEach(function (k) {
        if (_this5[$dirty].attributes[k]) {
          update[k] = _this5[$dirty].attributes[k];
          delete _this5[$dirty].attributes[k];
        } else if (_this5[$dirty].relationships[k]) {
          update[k] = _this5.$$resolveRelDeltas(null, k);
          delete _this5[$dirty].relationships[k];
        }
      });
      return this[$plump].save(this.constructor, update).then(function (updated) {
        _this5.$$copyValuesFrom(updated);
        return _this5;
      });
    }
  }, {
    key: '$set',
    value: function $set(update) {
      for (var key in update) {
        if (key in this.$schema.attributes) {
          this[$dirty].attributes[key] = update[key];
        } else if (key in this.$schema.relationships) {
          if (!(key in this[$dirty].relationships)) {
            this[$dirty].relationships[key] = [];
          }
          this[$dirty].relationships[key].push({
            op: 'modify',
            data: update[key]
          });
        }
      }

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
        console.log(JSON.stringify(l));
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
  }, {
    key: '$dirtyFields',
    get: function get() {
      var _this7 = this;

      return Object.keys(this[$dirty]).map(function (k) {
        return Object.keys(_this7[$dirty][k]);
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
  var _this9 = this;

  var start = {
    type: this.$name,
    id: opts[this.$schema.$id] || null,
    attributes: {},
    relationships: {}
  };
  ['attributes', 'relationships'].forEach(function (fieldType) {
    for (var key in _this9.$schema[fieldType]) {
      if (opts[key]) {
        start[fieldType][key] = opts[key];
      } else if (_this9.$schema[fieldType][key].default) {
        start[fieldType][key] = _this9.$schema[fieldType][key].default;
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRzdG9yZSIsIlN5bWJvbCIsIiRwbHVtcCIsIiRsb2FkZWQiLCIkdW5zdWJzY3JpYmUiLCIkc3ViamVjdCIsIiRzZWxmIiwiJGFsbCIsIk1vZGVsIiwib3B0cyIsInBsdW1wIiwiJHJlbGF0aW9uc2hpcHMiLCJuZXh0IiwiT2JqZWN0Iiwia2V5cyIsImNvbnN0cnVjdG9yIiwiJGZpZWxkcyIsImZvckVhY2giLCJmaWVsZE5hbWUiLCJ0eXBlIiwiUmVsIiwicmVsYXRpb25zaGlwIiwiZGVmYXVsdCIsIiQkY29weVZhbHVlc0Zyb20iLCJrZXkiLCJtYXAiLCJrIiwicmVkdWNlIiwiYWNjIiwiY3VyciIsImZpZWxkIiwidW5kZWZpbmVkIiwiY29uY2F0Iiwic2lkZSIsIiRzaWRlcyIsInYiLCJyZXRWYWwiLCJpZCIsIm90aGVyIiwiJGV4dHJhcyIsImV4dHJhIiwiYXNzaWduIiwiJCRmaXJlVXBkYXRlIiwic3Vic2NyaWJlIiwiJG5hbWUiLCIkaWQiLCJ2YWx1ZSIsImZpZWxkcyIsImNiIiwibGVuZ3RoIiwiQXJyYXkiLCJpc0FycmF5IiwiJCRob29rVG9QbHVtcCIsInN0cmVhbUdldCIsImFsbCIsIiQkc2luZ2xlR2V0IiwidGhlbiIsInZhbHVlQXJyYXkiLCJzZWxmSWR4IiwiaW5kZXhPZiIsImFjY3VtIiwib3B0IiwicmVzb2x2ZSIsIiQkaXNMb2FkZWQiLCJnZXQiLCIkbGlzdCIsIiRzZXQiLCJ1IiwidXBkYXRlIiwic2F2ZSIsInVwZGF0ZWQiLCJkZWxldGUiLCJyZXN0T3B0cyIsInVybCIsInJlc3RSZXF1ZXN0IiwiaXRlbSIsImV4dHJhcyIsImFkZCIsInJlamVjdCIsIkVycm9yIiwibCIsIm1vZGlmeVJlbGF0aW9uc2hpcCIsInJlbW92ZSIsInVuc3Vic2NyaWJlIiwiJGluY2x1ZGUiLCJmcm9tSlNPTiIsImpzb24iLCJEeW5hbWljUmVsYXRpb25zaGlwIiwidG9KU09OIiwiZmllbGROYW1lcyIsIiRyZXN0Iiwi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QVksSUFBWjtBQUNBckMsTUFBTW9DLEtBQU4sR0FBYyxNQUFkO0FBQ0FwQyxNQUFNRixLQUFOLEdBQWNBLEtBQWQ7QUFDQUUsTUFBTVEsT0FBTixHQUFnQjtBQUNkcUIsTUFBSTtBQUNGbEIsVUFBTTtBQURKO0FBRFUsQ0FBaEI7QUFLQVgsTUFBTW9GLFNBQU4sR0FBa0IsRUFBbEIiLCJmaWxlIjoibW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHsgUmVsYXRpb25zaGlwIH0gZnJvbSAnLi9yZWxhdGlvbnNoaXAnO1xuaW1wb3J0IG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcbmltcG9ydCB7IEJlaGF2aW9yU3ViamVjdCB9IGZyb20gJ3J4anMvUngnO1xuY29uc3QgJHN0b3JlID0gU3ltYm9sKCckc3RvcmUnKTtcbmNvbnN0ICRwbHVtcCA9IFN5bWJvbCgnJHBsdW1wJyk7XG5jb25zdCAkbG9hZGVkID0gU3ltYm9sKCckbG9hZGVkJyk7XG5jb25zdCAkdW5zdWJzY3JpYmUgPSBTeW1ib2woJyR1bnN1YnNjcmliZScpO1xuY29uc3QgJHN1YmplY3QgPSBTeW1ib2woJyRzdWJqZWN0Jyk7XG5leHBvcnQgY29uc3QgJHNlbGYgPSBTeW1ib2woJyRzZWxmJyk7XG5leHBvcnQgY29uc3QgJGFsbCA9IFN5bWJvbCgnJGFsbCcpO1xuXG4vLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIGVycm9yIGV2ZW50cyBvcmlnaW5hdGUgKHN0b3JhZ2Ugb3IgbW9kZWwpXG4vLyBhbmQgd2hvIGtlZXBzIGEgcm9sbC1iYWNrYWJsZSBkZWx0YVxuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzLCBwbHVtcCkge1xuICAgIHRoaXNbJHN0b3JlXSA9IHt9O1xuICAgIHRoaXMuJHJlbGF0aW9uc2hpcHMgPSB7fTtcbiAgICB0aGlzWyRzdWJqZWN0XSA9IG5ldyBCZWhhdmlvclN1YmplY3QoKTtcbiAgICB0aGlzWyRzdWJqZWN0XS5uZXh0KHt9KTtcbiAgICB0aGlzWyRsb2FkZWRdID0ge1xuICAgICAgWyRzZWxmXTogZmFsc2UsXG4gICAgfTtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgICBjb25zdCBSZWwgPSB0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS5yZWxhdGlvbnNoaXA7XG4gICAgICAgIHRoaXMuJHJlbGF0aW9uc2hpcHNbZmllbGROYW1lXSA9IG5ldyBSZWwodGhpcywgZmllbGROYW1lLCBwbHVtcCk7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gW107XG4gICAgICAgIHRoaXNbJGxvYWRlZF1bZmllbGROYW1lXSA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSB0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS5kZWZhdWx0IHx8IG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKG9wdHMgfHwge30pO1xuICAgIGlmIChwbHVtcCkge1xuICAgICAgdGhpc1skcGx1bXBdID0gcGx1bXA7XG4gICAgfVxuICB9XG5cbiAgZ2V0ICRuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLiRuYW1lO1xuICB9XG5cbiAgZ2V0ICRpZCgpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmVdW3RoaXMuY29uc3RydWN0b3IuJGlkXTtcbiAgfVxuXG4gIGdldCAkJHJlbGF0ZWRGaWVsZHMoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IuJGluY2x1ZGUpO1xuICB9XG5cbiAgZ2V0ICQkcGF0aCgpIHtcbiAgICByZXR1cm4gYC8ke3RoaXMuJG5hbWV9LyR7dGhpcy4kaWR9YDtcbiAgfVxuXG4gIGdldCAkJGRhdGFKU09OKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiB0aGlzLiRuYW1lLFxuICAgICAgaWQ6IHRoaXMuJGlkLFxuICAgIH07XG4gIH1cblxuICAkJGlzTG9hZGVkKGtleSkge1xuICAgIGlmIChrZXkgPT09ICRhbGwpIHtcbiAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzWyRsb2FkZWRdKVxuICAgICAgICAubWFwKGsgPT4gdGhpc1skbG9hZGVkXVtrXSlcbiAgICAgICAgLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBhY2MgJiYgY3VyciwgdHJ1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzWyRsb2FkZWRdW2tleV07XG4gICAgfVxuICB9XG5cbiAgJCRjb3B5VmFsdWVzRnJvbShvcHRzID0ge30pIHtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgY29uc3QgZmllbGQgPSB0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXTtcbiAgICAgIGlmIChvcHRzW2ZpZWxkTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBjb3B5IGZyb20gb3B0cyB0byB0aGUgYmVzdCBvZiBvdXIgYWJpbGl0eVxuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gJ2FycmF5Jykge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gKG9wdHNbZmllbGROYW1lXSB8fCBbXSkuY29uY2F0KCk7XG4gICAgICAgICAgdGhpc1skbG9hZGVkXVtmaWVsZE5hbWVdID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgICBjb25zdCBzaWRlID0gZmllbGQucmVsYXRpb25zaGlwLiRzaWRlc1tmaWVsZE5hbWVdO1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gb3B0c1tmaWVsZE5hbWVdLm1hcCgodikgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmV0VmFsID0ge1xuICAgICAgICAgICAgICBpZDogdltzaWRlLm90aGVyLmZpZWxkXSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoZmllbGQucmVsYXRpb25zaGlwLiRleHRyYXMpIHtcbiAgICAgICAgICAgICAgT2JqZWN0LmtleXMoZmllbGQucmVsYXRpb25zaGlwLiRleHRyYXMpLmZvckVhY2goKGV4dHJhKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0VmFsW2V4dHJhXSA9IHZbZXh0cmFdO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXRWYWw7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGhpc1skbG9hZGVkXVtmaWVsZE5hbWVdID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0c1tmaWVsZE5hbWVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IG9wdHNbZmllbGROYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuJCRmaXJlVXBkYXRlKCk7XG4gIH1cblxuICAkJGhvb2tUb1BsdW1wKCkge1xuICAgIGlmICh0aGlzWyR1bnN1YnNjcmliZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skdW5zdWJzY3JpYmVdID0gdGhpc1skcGx1bXBdLnN1YnNjcmliZSh0aGlzLmNvbnN0cnVjdG9yLiRuYW1lLCB0aGlzLiRpZCwgKHsgZmllbGQsIHZhbHVlIH0pID0+IHtcbiAgICAgICAgaWYgKGZpZWxkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAvLyB0aGlzLiQkY29weVZhbHVlc0Zyb20odmFsdWUpO1xuICAgICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh7IFtmaWVsZF06IHZhbHVlIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gICRzdWJzY3JpYmUoLi4uYXJncykge1xuICAgIGxldCBmaWVsZHMgPSBbJHNlbGZdO1xuICAgIGxldCBjYjtcbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDIpIHtcbiAgICAgIGZpZWxkcyA9IGFyZ3NbMF07XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZmllbGRzKSkge1xuICAgICAgICBmaWVsZHMgPSBbZmllbGRzXTtcbiAgICAgIH1cbiAgICAgIGNiID0gYXJnc1sxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2IgPSBhcmdzWzBdO1xuICAgIH1cbiAgICB0aGlzLiQkaG9va1RvUGx1bXAoKTtcbiAgICBpZiAodGhpc1skbG9hZGVkXVskc2VsZl0gPT09IGZhbHNlKSB7XG4gICAgICB0aGlzWyRwbHVtcF0uc3RyZWFtR2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBmaWVsZHMpXG4gICAgICAuc3Vic2NyaWJlKCh2KSA9PiB0aGlzLiQkY29weVZhbHVlc0Zyb20odikpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpc1skc3ViamVjdF0uc3Vic2NyaWJlKGNiKTtcbiAgfVxuXG4gICQkZmlyZVVwZGF0ZSgpIHtcbiAgICB0aGlzWyRzdWJqZWN0XS5uZXh0KHRoaXNbJHN0b3JlXSk7XG4gIH1cblxuICAvLyBNb2RlbC4kZ2V0LCB3aGVuIGFza2luZyBmb3IgYSBoYXNNYW55IGZpZWxkIHdpbGxcbiAgLy8gQUxXQVlTIHJlc29sdmUgdG8gYW4gb2JqZWN0IHdpdGggdGhhdCBmaWVsZCBhcyBhIHByb3BlcnR5LlxuICAvLyBUaGUgdmFsdWUgb2YgdGhhdCBwcm9wZXJ0eSB3aWxsIEFMV0FZUyBiZSBhbiBhcnJheSAocG9zc2libHkgZW1wdHkpLlxuICAvLyBUaGUgZWxlbWVudHMgb2YgdGhlIGFycmF5IHdpbGwgQUxXQVlTIGJlIG9iamVjdHMsIHdpdGggYXQgbGVhc3QgYW4gJ2lkJyBmaWVsZC5cbiAgLy8gQXJyYXkgZWxlbWVudHMgTUFZIGhhdmUgb3RoZXIgZmllbGRzIChpZiB0aGUgaGFzTWFueSBoYXMgdmFsZW5jZSkuXG5cbiAgJGdldChvcHRzID0gJHNlbGYpIHtcbiAgICBsZXQga2V5cztcbiAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRzKSkge1xuICAgICAga2V5cyA9IG9wdHM7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtleXMgPSBbb3B0c107XG4gICAgfVxuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoa2V5cy5tYXAoKGtleSkgPT4gdGhpcy4kJHNpbmdsZUdldChrZXkpKSlcbiAgICAudGhlbigodmFsdWVBcnJheSkgPT4ge1xuICAgICAgY29uc3Qgc2VsZklkeCA9IGtleXMuaW5kZXhPZigkc2VsZik7XG4gICAgICBpZiAoKHNlbGZJZHggPj0gMCkgJiYgKHZhbHVlQXJyYXlbc2VsZklkeF0gPT09IG51bGwpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlQXJyYXkucmVkdWNlKChhY2N1bSwgY3VycikgPT4gT2JqZWN0LmFzc2lnbihhY2N1bSwgY3VyciksIHt9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICQkc2luZ2xlR2V0KG9wdCA9ICRzZWxmKSB7XG4gICAgLy8gWCBjYXNlcy5cbiAgICAvLyBrZXkgPT09ICRhbGwgLSBmZXRjaCBhbGwgZmllbGRzIHVubGVzcyBsb2FkZWQsIHJldHVybiBhbGwgZmllbGRzXG4gICAgLy8gJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55JywgLSBmZXRjaCBjaGlsZHJlbiAocGVyaGFwcyBtb3ZlIHRoaXMgZGVjaXNpb24gdG8gc3RvcmUpXG4gICAgLy8gb3RoZXJ3aXNlIC0gZmV0Y2ggbm9uLWhhc01hbnkgZmllbGRzIHVubGVzcyBhbHJlYWR5IGxvYWRlZCwgcmV0dXJuIGFsbCBub24taGFzTWFueSBmaWVsZHNcbiAgICBsZXQga2V5O1xuICAgIGlmICgob3B0ICE9PSAkc2VsZikgJiYgKG9wdCAhPT0gJGFsbCkgJiYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tvcHRdLnR5cGUgIT09ICdoYXNNYW55JykpIHtcbiAgICAgIGtleSA9ICRzZWxmO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXkgPSBvcHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmICghdGhpcy4kJGlzTG9hZGVkKGtleSkgJiYgdGhpc1skcGx1bXBdKSB7XG4gICAgICAgIGlmICh0eXBlb2Yga2V5ID09PSAnc3ltYm9sJykgeyAvLyBrZXkgPT09ICRzZWxmIG9yICRhbGxcbiAgICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLmdldCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy4kcmVsYXRpb25zaGlwc1trZXldLiRsaXN0KCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKHYpID0+IHtcbiAgICAgIGlmICh2ID09PSB0cnVlKSB7XG4gICAgICAgIGlmIChrZXkgPT09ICRzZWxmKSB7XG4gICAgICAgICAgY29uc3QgcmV0VmFsID0ge307XG4gICAgICAgICAgZm9yIChjb25zdCBrIGluIHRoaXNbJHN0b3JlXSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trXS50eXBlICE9PSAnaGFzTWFueScpIHtcbiAgICAgICAgICAgICAgcmV0VmFsW2tdID0gdGhpc1skc3RvcmVdW2tdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmV0VmFsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCB7IFtrZXldOiB0aGlzWyRzdG9yZV1ba2V5XSB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh2ICYmICh2WyRzZWxmXSAhPT0gbnVsbCkpIHtcbiAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHYpO1xuICAgICAgICBpZiAoa2V5ID09PSAkYWxsKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBrIGluIHRoaXNbJGxvYWRlZF0pIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBndWFyZC1mb3ItaW5cbiAgICAgICAgICAgIHRoaXNbJGxvYWRlZF1ba10gPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzWyRsb2FkZWRdW2tleV0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXkgPT09ICRzZWxmKSB7XG4gICAgICAgICAgY29uc3QgcmV0VmFsID0ge307XG4gICAgICAgICAgZm9yIChjb25zdCBrIGluIHRoaXNbJHN0b3JlXSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trXS50eXBlICE9PSAnaGFzTWFueScpIHtcbiAgICAgICAgICAgICAgcmV0VmFsW2tdID0gdGhpc1skc3RvcmVdW2tdOyAvLyBUT0RPOiBkZWVwIGNvcHkgb2Ygb2JqZWN0XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXRWYWw7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSAkYWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG1lcmdlT3B0aW9ucyh7fSwgdGhpc1skc3RvcmVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbWVyZ2VPcHRpb25zKHt9LCB7IFtrZXldOiB0aGlzWyRzdG9yZV1ba2V5XSB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAkc2F2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy4kc2V0KCk7XG4gIH1cblxuICAkc2V0KHUgPSB0aGlzWyRzdG9yZV0pIHtcbiAgICBjb25zdCB1cGRhdGUgPSBtZXJnZU9wdGlvbnMoe30sIHRoaXNbJHN0b3JlXSwgdSk7XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgZGVsZXRlIHVwZGF0ZVtrZXldO1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8vIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh1cGRhdGUpOyAvLyB0aGlzIGlzIHRoZSBvcHRpbWlzdGljIHVwZGF0ZTtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLnNhdmUodGhpcy5jb25zdHJ1Y3RvciwgdXBkYXRlKVxuICAgIC50aGVuKCh1cGRhdGVkKSA9PiB7XG4gICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odXBkYXRlZCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9KTtcbiAgfVxuXG4gICRkZWxldGUoKSB7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5kZWxldGUodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQpO1xuICB9XG5cbiAgJHJlc3Qob3B0cykge1xuICAgIGNvbnN0IHJlc3RPcHRzID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAgb3B0cyxcbiAgICAgIHtcbiAgICAgICAgdXJsOiBgLyR7dGhpcy5jb25zdHJ1Y3Rvci4kbmFtZX0vJHt0aGlzLiRpZH0vJHtvcHRzLnVybH1gLFxuICAgICAgfVxuICAgICk7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5yZXN0UmVxdWVzdChyZXN0T3B0cyk7XG4gIH1cblxuICAkYWRkKGtleSwgaXRlbSwgZXh0cmFzKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgbGV0IGlkID0gMDtcbiAgICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIGlkID0gaXRlbTtcbiAgICAgICAgfSBlbHNlIGlmIChpdGVtLiRpZCkge1xuICAgICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWQgPSBpdGVtW3RoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnJlbGF0aW9uc2hpcC4kc2lkZXNba2V5XS5vdGhlci5maWVsZF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLmFkZCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpZCwgZXh0cmFzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpKTtcbiAgICAgIH1cbiAgICB9KS50aGVuKChsKSA9PiB7XG4gICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20oeyBba2V5XTogbCB9KTtcbiAgICAgIHJldHVybiBsO1xuICAgIH0pO1xuICB9XG5cbiAgJG1vZGlmeVJlbGF0aW9uc2hpcChrZXksIGl0ZW0sIGV4dHJhcykge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICB0aGlzWyRzdG9yZV1ba2V5XSA9IFtdO1xuICAgICAgICB0aGlzWyRsb2FkZWRdW2tleV0gPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5tb2RpZnlSZWxhdGlvbnNoaXAodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaWQsIGV4dHJhcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkcmVtb3ZlKGtleSwgaXRlbSkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICB0aGlzWyRzdG9yZV1ba2V5XSA9IFtdO1xuICAgICAgICB0aGlzWyRsb2FkZWRdW2tleV0gPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5yZW1vdmUodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSAkcmVtb3ZlZCBmcm9tIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJHJlbW92ZSBleGNlcHQgZnJvbSBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICR0ZWFyZG93bigpIHtcbiAgICBpZiAodGhpc1skdW5zdWJzY3JpYmVdKSB7XG4gICAgICB0aGlzWyR1bnN1YnNjcmliZV0udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cbn1cblxuTW9kZWwuZnJvbUpTT04gPSBmdW5jdGlvbiBmcm9tSlNPTihqc29uKSB7XG4gIHRoaXMuJGlkID0ganNvbi4kaWQgfHwgJ2lkJztcbiAgdGhpcy4kbmFtZSA9IGpzb24uJG5hbWU7XG4gIHRoaXMuJGluY2x1ZGUgPSBqc29uLiRpbmNsdWRlO1xuICB0aGlzLiRmaWVsZHMgPSB7fTtcbiAgT2JqZWN0LmtleXMoanNvbi4kZmllbGRzKS5mb3JFYWNoKChrKSA9PiB7XG4gICAgY29uc3QgZmllbGQgPSBqc29uLiRmaWVsZHNba107XG4gICAgaWYgKGZpZWxkLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgY2xhc3MgRHluYW1pY1JlbGF0aW9uc2hpcCBleHRlbmRzIFJlbGF0aW9uc2hpcCB7fVxuICAgICAgRHluYW1pY1JlbGF0aW9uc2hpcC5mcm9tSlNPTihmaWVsZC5yZWxhdGlvbnNoaXApO1xuICAgICAgdGhpcy4kZmllbGRzW2tdID0ge1xuICAgICAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgICAgIHJlbGF0aW9uc2hpcDogRHluYW1pY1JlbGF0aW9uc2hpcCxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJGZpZWxkc1trXSA9IE9iamVjdC5hc3NpZ24oe30sIGZpZWxkKTtcbiAgICB9XG4gIH0pO1xufTtcblxuTW9kZWwudG9KU09OID0gZnVuY3Rpb24gdG9KU09OKCkge1xuICBjb25zdCByZXRWYWwgPSB7XG4gICAgJGlkOiB0aGlzLiRpZCxcbiAgICAkbmFtZTogdGhpcy4kbmFtZSxcbiAgICAkaW5jbHVkZTogdGhpcy4kaW5jbHVkZSxcbiAgICAkZmllbGRzOiB7fSxcbiAgfTtcbiAgY29uc3QgZmllbGROYW1lcyA9IE9iamVjdC5rZXlzKHRoaXMuJGZpZWxkcyk7XG4gIGZpZWxkTmFtZXMuZm9yRWFjaCgoaykgPT4ge1xuICAgIGlmICh0aGlzLiRmaWVsZHNba10udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICByZXRWYWwuJGZpZWxkc1trXSA9IHtcbiAgICAgICAgdHlwZTogJ2hhc01hbnknLFxuICAgICAgICByZWxhdGlvbnNoaXA6IHRoaXMuJGZpZWxkc1trXS5yZWxhdGlvbnNoaXAudG9KU09OKCksXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXRWYWwuJGZpZWxkc1trXSA9IHRoaXMuJGZpZWxkc1trXTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcmV0VmFsO1xufTtcblxuTW9kZWwuJHJlc3QgPSBmdW5jdGlvbiAkcmVzdChwbHVtcCwgb3B0cykge1xuICBjb25zdCByZXN0T3B0cyA9IE9iamVjdC5hc3NpZ24oXG4gICAge30sXG4gICAgb3B0cyxcbiAgICB7XG4gICAgICB1cmw6IGAvJHt0aGlzLiRuYW1lfS8ke29wdHMudXJsfWAsXG4gICAgfVxuICApO1xuICByZXR1cm4gcGx1bXAucmVzdFJlcXVlc3QocmVzdE9wdHMpO1xufTtcblxuTW9kZWwuYXNzaWduID0gZnVuY3Rpb24gYXNzaWduKG9wdHMpIHtcbiAgY29uc3Qgc3RhcnQgPSB7fTtcbiAgT2JqZWN0LmtleXModGhpcy4kZmllbGRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICBpZiAob3B0c1trZXldKSB7XG4gICAgICBzdGFydFtrZXldID0gb3B0c1trZXldO1xuICAgIH0gZWxzZSBpZiAodGhpcy4kZmllbGRzW2tleV0uZGVmYXVsdCkge1xuICAgICAgc3RhcnRba2V5XSA9IHRoaXMuJGZpZWxkc1trZXldLmRlZmF1bHQ7XG4gICAgfSBlbHNlIGlmICh0aGlzLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIHN0YXJ0W2tleV0gPSBbXTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhcnRba2V5XSA9IG51bGw7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHN0YXJ0O1xufTtcblxuTW9kZWwuJGlkID0gJ2lkJztcbk1vZGVsLiRuYW1lID0gJ0Jhc2UnO1xuTW9kZWwuJHNlbGYgPSAkc2VsZjtcbk1vZGVsLiRmaWVsZHMgPSB7XG4gIGlkOiB7XG4gICAgdHlwZTogJ251bWJlcicsXG4gIH0sXG59O1xuTW9kZWwuJGluY2x1ZGVkID0gW107XG4iXX0=
