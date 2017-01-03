'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Model = exports.$self = undefined;

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

var $store = Symbol('$store');
var $plump = Symbol('$plump');
var $loaded = Symbol('$loaded');
var $unsubscribe = Symbol('$unsubscribe');
var $subject = Symbol('$subject');
var $self = exports.$self = Symbol('$self');

// TODO: figure out where error events originate (storage or model)
// and who keeps a roll-backable delta

var Model = exports.Model = function () {
  function Model(opts, plump) {
    var _this = this;

    _classCallCheck(this, Model);

    this[$store] = _defineProperty({}, $loaded, false);
    this.$relationships = {};
    this[$subject] = new _Rx.BehaviorSubject();
    this[$subject].next({});
    this[$loaded] = _defineProperty({}, $self, false);
    Object.keys(this.constructor.$fields).forEach(function (key) {
      if (_this.constructor.$fields[key].type === 'hasMany') {
        var Rel = _this.constructor.$fields[key].relationship;
        _this.$relationships[key] = new Rel(_this, key, plump);
        _this[$store][key] = [];
        _this[$loaded][key] = false;
      } else {
        _this[$store][key] = _this.constructor.$fields[key].default || null;
      }
    });
    this.$$copyValuesFrom(opts || {});
    if (plump) {
      this[$plump] = plump;
    }
  }

  _createClass(Model, [{
    key: '$$copyValuesFrom',
    value: function $$copyValuesFrom() {
      var _this2 = this;

      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      Object.keys(this.constructor.$fields).forEach(function (fieldName) {
        if (opts[fieldName] !== undefined) {
          // copy from opts to the best of our ability
          if (_this2.constructor.$fields[fieldName].type === 'array' || _this2.constructor.$fields[fieldName].type === 'hasMany') {
            _this2[$store][fieldName] = (opts[fieldName] || []).concat();
            _this2[$loaded][fieldName] = true;
          } else if (_this2.constructor.$fields[fieldName].type === 'object') {
            _this2[$store][fieldName] = Object.assign({}, opts[fieldName]);
          } else {
            _this2[$store][fieldName] = opts[fieldName];
          }
        }
      });
      this.$$fireUpdate();
    }
  }, {
    key: '$$hookToPlump',
    value: function $$hookToPlump() {
      var _this3 = this;

      if (this[$unsubscribe] === undefined) {
        this[$unsubscribe] = this[$plump].subscribe(this.constructor.$name, this.$id, function (_ref) {
          var field = _ref.field,
              value = _ref.value;

          if (field !== undefined) {
            _this3.$$copyValuesFrom(_defineProperty({}, field, value));
          } else {
            _this3.$$copyValuesFrom(value);
          }
        });
      }
    }
  }, {
    key: '$subscribe',
    value: function $subscribe(l) {
      this.$$hookToPlump();
      return this[$subject].subscribe(l);
    }
  }, {
    key: '$$fireUpdate',
    value: function $$fireUpdate() {
      this[$subject].next(this[$store]);
    }

    // TODO: don't fetch if we $get() something that we already have

  }, {
    key: '$get',
    value: function $get() {
      var _this4 = this;

      var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : $self;

      // three cases.
      // key === undefined - fetch all, unless $loaded, but return all.
      // fields[key] === 'hasMany' - fetch children (perhaps move this decision to store)
      // otherwise - fetch all, unless $store[key], return $store[key].

      return _bluebird2.default.resolve().then(function () {
        if (key === $self || _this4.constructor.$fields[key].type !== 'hasMany') {
          if (_this4[$loaded][$self] === false && _this4[$plump]) {
            return _this4[$plump].get(_this4.constructor, _this4.$id, key);
          } else {
            return true;
          }
        } else {
          if (_this4[$loaded][key] === false && _this4[$plump]) {
            // eslint-disable-line no-lonely-if
            return _this4.$relationships[key].$list();
          } else {
            return true;
          }
        }
      }).then(function (v) {
        if (v === true) {
          if (key === $self) {
            return Object.assign({}, _this4[$store]);
          } else {
            return _this4[$store][key];
          }
        } else if (v) {
          _this4.$$copyValuesFrom(v);
          if (key === $self || _this4.constructor.$fields[key].type === 'hasMany') {
            _this4[$loaded][key] = true;
          }
          if (key === $self) {
            return Object.assign({}, _this4[$store]);
          } else {
            return _this4[$store][key];
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
      var _this5 = this;

      var u = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this[$store];

      var update = (0, _mergeOptions2.default)({}, this[$store], u);
      Object.keys(this.constructor.$fields).forEach(function (key) {
        if (_this5.constructor.$fields[key].type === 'hasMany') {
          delete update[key];
        }
      });
      // this.$$copyValuesFrom(update); // this is the optimistic update;
      return this[$plump].save(this.constructor, update).then(function (updated) {
        _this5.$$copyValuesFrom(updated);
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
      if (this.constructor.$fields[key].type === 'hasMany') {
        var id = 0;
        if (typeof item === 'number') {
          id = item;
        } else if (item.$id) {
          id = item.$id;
        } else {
          id = item[this.constructor.$fields[key].relationship.$sides[key].other.field];
        }
        if (typeof id === 'number' && id >= 1) {
          return this[$plump].add(this.constructor, this.$id, key, id, extras);
        } else {
          return _bluebird2.default.reject(new Error('Invalid item added to hasMany'));
        }
      } else {
        return _bluebird2.default.reject(new Error('Cannot $add except to hasMany field'));
      }
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
  }]);

  return Model;
}();

Model.fromJSON = function fromJSON(json) {
  var _this7 = this;

  this.$id = json.$id || 'id';
  this.$name = json.$name;
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
      _this7.$fields[k] = {
        type: 'hasMany',
        relationship: DynamicRelationship
      };
    } else {
      _this7.$fields[k] = Object.assign({}, field);
    }
  });
};

Model.toJSON = function toJSON() {
  var _this8 = this;

  var retVal = {
    $id: this.$id,
    $name: this.$name,
    $fields: {}
  };
  var fieldNames = Object.keys(this.$fields);
  fieldNames.forEach(function (k) {
    if (_this8.$fields[k].type === 'hasMany') {
      retVal.$fields[k] = {
        type: 'hasMany',
        relationship: _this8.$fields[k].relationship.toJSON()
      };
    } else {
      retVal.$fields[k] = _this8.$fields[k];
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
  var _this9 = this;

  var start = {};
  Object.keys(this.$fields).forEach(function (key) {
    if (opts[key]) {
      start[key] = opts[key];
    } else if (_this9.$fields[key].default) {
      start[key] = _this9.$fields[key].default;
    } else if (_this9.$fields[key].type === 'hasMany') {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRzdG9yZSIsIlN5bWJvbCIsIiRwbHVtcCIsIiRsb2FkZWQiLCIkdW5zdWJzY3JpYmUiLCIkc3ViamVjdCIsIiRzZWxmIiwiTW9kZWwiLCJvcHRzIiwicGx1bXAiLCIkcmVsYXRpb25zaGlwcyIsIm5leHQiLCJPYmplY3QiLCJrZXlzIiwiY29uc3RydWN0b3IiLCIkZmllbGRzIiwiZm9yRWFjaCIsImtleSIsInR5cGUiLCJSZWwiLCJyZWxhdGlvbnNoaXAiLCJkZWZhdWx0IiwiJCRjb3B5VmFsdWVzRnJvbSIsImZpZWxkTmFtZSIsInVuZGVmaW5lZCIsImNvbmNhdCIsImFzc2lnbiIsIiQkZmlyZVVwZGF0ZSIsInN1YnNjcmliZSIsIiRuYW1lIiwiJGlkIiwiZmllbGQiLCJ2YWx1ZSIsImwiLCIkJGhvb2tUb1BsdW1wIiwicmVzb2x2ZSIsInRoZW4iLCJnZXQiLCIkbGlzdCIsInYiLCIkc2V0IiwidSIsInVwZGF0ZSIsInNhdmUiLCJ1cGRhdGVkIiwiZGVsZXRlIiwicmVzdE9wdHMiLCJ1cmwiLCJyZXN0UmVxdWVzdCIsIml0ZW0iLCJleHRyYXMiLCJpZCIsIiRzaWRlcyIsIm90aGVyIiwiYWRkIiwicmVqZWN0IiwiRXJyb3IiLCJtb2RpZnlSZWxhdGlvbnNoaXAiLCJyZW1vdmUiLCJ1bnN1YnNjcmliZSIsImZyb21KU09OIiwianNvbiIsImsiLCJEeW5hbWljUmVsYXRpb25zaGlwIiwidG9KU09OIiwicmV0VmFsIiwiZmllbGROYW1lcyIsIiRyZXN0Iiwic3RhcnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7Ozs7O0FBQ0EsSUFBTUEsU0FBU0MsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNQyxTQUFTRCxPQUFPLFFBQVAsQ0FBZjtBQUNBLElBQU1FLFVBQVVGLE9BQU8sU0FBUCxDQUFoQjtBQUNBLElBQU1HLGVBQWVILE9BQU8sY0FBUCxDQUFyQjtBQUNBLElBQU1JLFdBQVdKLE9BQU8sVUFBUCxDQUFqQjtBQUNPLElBQU1LLHdCQUFRTCxPQUFPLE9BQVAsQ0FBZDs7QUFFUDtBQUNBOztJQUVhTSxLLFdBQUFBLEs7QUFDWCxpQkFBWUMsSUFBWixFQUFrQkMsS0FBbEIsRUFBeUI7QUFBQTs7QUFBQTs7QUFDdkIsU0FBS1QsTUFBTCx3QkFDR0csT0FESCxFQUNhLEtBRGI7QUFHQSxTQUFLTyxjQUFMLEdBQXNCLEVBQXRCO0FBQ0EsU0FBS0wsUUFBTCxJQUFpQix5QkFBakI7QUFDQSxTQUFLQSxRQUFMLEVBQWVNLElBQWYsQ0FBb0IsRUFBcEI7QUFDQSxTQUFLUixPQUFMLHdCQUNHRyxLQURILEVBQ1csS0FEWDtBQUdBTSxXQUFPQyxJQUFQLENBQVksS0FBS0MsV0FBTCxDQUFpQkMsT0FBN0IsRUFBc0NDLE9BQXRDLENBQThDLFVBQUNDLEdBQUQsRUFBUztBQUNyRCxVQUFJLE1BQUtILFdBQUwsQ0FBaUJDLE9BQWpCLENBQXlCRSxHQUF6QixFQUE4QkMsSUFBOUIsS0FBdUMsU0FBM0MsRUFBc0Q7QUFDcEQsWUFBTUMsTUFBTSxNQUFLTCxXQUFMLENBQWlCQyxPQUFqQixDQUF5QkUsR0FBekIsRUFBOEJHLFlBQTFDO0FBQ0EsY0FBS1YsY0FBTCxDQUFvQk8sR0FBcEIsSUFBMkIsSUFBSUUsR0FBSixRQUFjRixHQUFkLEVBQW1CUixLQUFuQixDQUEzQjtBQUNBLGNBQUtULE1BQUwsRUFBYWlCLEdBQWIsSUFBb0IsRUFBcEI7QUFDQSxjQUFLZCxPQUFMLEVBQWNjLEdBQWQsSUFBcUIsS0FBckI7QUFDRCxPQUxELE1BS087QUFDTCxjQUFLakIsTUFBTCxFQUFhaUIsR0FBYixJQUFvQixNQUFLSCxXQUFMLENBQWlCQyxPQUFqQixDQUF5QkUsR0FBekIsRUFBOEJJLE9BQTlCLElBQXlDLElBQTdEO0FBQ0Q7QUFDRixLQVREO0FBVUEsU0FBS0MsZ0JBQUwsQ0FBc0JkLFFBQVEsRUFBOUI7QUFDQSxRQUFJQyxLQUFKLEVBQVc7QUFDVCxXQUFLUCxNQUFMLElBQWVPLEtBQWY7QUFDRDtBQUNGOzs7O3VDQVUyQjtBQUFBOztBQUFBLFVBQVhELElBQVcsdUVBQUosRUFBSTs7QUFDMUJJLGFBQU9DLElBQVAsQ0FBWSxLQUFLQyxXQUFMLENBQWlCQyxPQUE3QixFQUFzQ0MsT0FBdEMsQ0FBOEMsVUFBQ08sU0FBRCxFQUFlO0FBQzNELFlBQUlmLEtBQUtlLFNBQUwsTUFBb0JDLFNBQXhCLEVBQW1DO0FBQ2pDO0FBQ0EsY0FDRyxPQUFLVixXQUFMLENBQWlCQyxPQUFqQixDQUF5QlEsU0FBekIsRUFBb0NMLElBQXBDLEtBQTZDLE9BQTlDLElBQ0MsT0FBS0osV0FBTCxDQUFpQkMsT0FBakIsQ0FBeUJRLFNBQXpCLEVBQW9DTCxJQUFwQyxLQUE2QyxTQUZoRCxFQUdFO0FBQ0EsbUJBQUtsQixNQUFMLEVBQWF1QixTQUFiLElBQTBCLENBQUNmLEtBQUtlLFNBQUwsS0FBbUIsRUFBcEIsRUFBd0JFLE1BQXhCLEVBQTFCO0FBQ0EsbUJBQUt0QixPQUFMLEVBQWNvQixTQUFkLElBQTJCLElBQTNCO0FBQ0QsV0FORCxNQU1PLElBQUksT0FBS1QsV0FBTCxDQUFpQkMsT0FBakIsQ0FBeUJRLFNBQXpCLEVBQW9DTCxJQUFwQyxLQUE2QyxRQUFqRCxFQUEyRDtBQUNoRSxtQkFBS2xCLE1BQUwsRUFBYXVCLFNBQWIsSUFBMEJYLE9BQU9jLE1BQVAsQ0FBYyxFQUFkLEVBQWtCbEIsS0FBS2UsU0FBTCxDQUFsQixDQUExQjtBQUNELFdBRk0sTUFFQTtBQUNMLG1CQUFLdkIsTUFBTCxFQUFhdUIsU0FBYixJQUEwQmYsS0FBS2UsU0FBTCxDQUExQjtBQUNEO0FBQ0Y7QUFDRixPQWZEO0FBZ0JBLFdBQUtJLFlBQUw7QUFDRDs7O29DQUVlO0FBQUE7O0FBQ2QsVUFBSSxLQUFLdkIsWUFBTCxNQUF1Qm9CLFNBQTNCLEVBQXNDO0FBQ3BDLGFBQUtwQixZQUFMLElBQXFCLEtBQUtGLE1BQUwsRUFBYTBCLFNBQWIsQ0FBdUIsS0FBS2QsV0FBTCxDQUFpQmUsS0FBeEMsRUFBK0MsS0FBS0MsR0FBcEQsRUFBeUQsZ0JBQXNCO0FBQUEsY0FBbkJDLEtBQW1CLFFBQW5CQSxLQUFtQjtBQUFBLGNBQVpDLEtBQVksUUFBWkEsS0FBWTs7QUFDbEcsY0FBSUQsVUFBVVAsU0FBZCxFQUF5QjtBQUN2QixtQkFBS0YsZ0JBQUwscUJBQXlCUyxLQUF6QixFQUFpQ0MsS0FBakM7QUFDRCxXQUZELE1BRU87QUFDTCxtQkFBS1YsZ0JBQUwsQ0FBc0JVLEtBQXRCO0FBQ0Q7QUFDRixTQU5vQixDQUFyQjtBQU9EO0FBQ0Y7OzsrQkFFVUMsQyxFQUFHO0FBQ1osV0FBS0MsYUFBTDtBQUNBLGFBQU8sS0FBSzdCLFFBQUwsRUFBZXVCLFNBQWYsQ0FBeUJLLENBQXpCLENBQVA7QUFDRDs7O21DQUVjO0FBQ2IsV0FBSzVCLFFBQUwsRUFBZU0sSUFBZixDQUFvQixLQUFLWCxNQUFMLENBQXBCO0FBQ0Q7O0FBRUQ7Ozs7MkJBRWtCO0FBQUE7O0FBQUEsVUFBYmlCLEdBQWEsdUVBQVBYLEtBQU87O0FBQ2hCO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGFBQU8sbUJBQVM2QixPQUFULEdBQ05DLElBRE0sQ0FDRCxZQUFNO0FBQ1YsWUFBS25CLFFBQVFYLEtBQVQsSUFBb0IsT0FBS1EsV0FBTCxDQUFpQkMsT0FBakIsQ0FBeUJFLEdBQXpCLEVBQThCQyxJQUE5QixLQUF1QyxTQUEvRCxFQUEyRTtBQUN6RSxjQUFJLE9BQUtmLE9BQUwsRUFBY0csS0FBZCxNQUF5QixLQUF6QixJQUFrQyxPQUFLSixNQUFMLENBQXRDLEVBQW9EO0FBQ2xELG1CQUFPLE9BQUtBLE1BQUwsRUFBYW1DLEdBQWIsQ0FBaUIsT0FBS3ZCLFdBQXRCLEVBQW1DLE9BQUtnQixHQUF4QyxFQUE2Q2IsR0FBN0MsQ0FBUDtBQUNELFdBRkQsTUFFTztBQUNMLG1CQUFPLElBQVA7QUFDRDtBQUNGLFNBTkQsTUFNTztBQUNMLGNBQUssT0FBS2QsT0FBTCxFQUFjYyxHQUFkLE1BQXVCLEtBQXhCLElBQWtDLE9BQUtmLE1BQUwsQ0FBdEMsRUFBb0Q7QUFBRTtBQUNwRCxtQkFBTyxPQUFLUSxjQUFMLENBQW9CTyxHQUFwQixFQUF5QnFCLEtBQXpCLEVBQVA7QUFDRCxXQUZELE1BRU87QUFDTCxtQkFBTyxJQUFQO0FBQ0Q7QUFDRjtBQUNGLE9BZk0sRUFlSkYsSUFmSSxDQWVDLFVBQUNHLENBQUQsRUFBTztBQUNiLFlBQUlBLE1BQU0sSUFBVixFQUFnQjtBQUNkLGNBQUl0QixRQUFRWCxLQUFaLEVBQW1CO0FBQ2pCLG1CQUFPTSxPQUFPYyxNQUFQLENBQWMsRUFBZCxFQUFrQixPQUFLMUIsTUFBTCxDQUFsQixDQUFQO0FBQ0QsV0FGRCxNQUVPO0FBQ0wsbUJBQU8sT0FBS0EsTUFBTCxFQUFhaUIsR0FBYixDQUFQO0FBQ0Q7QUFDRixTQU5ELE1BTU8sSUFBSXNCLENBQUosRUFBTztBQUNaLGlCQUFLakIsZ0JBQUwsQ0FBc0JpQixDQUF0QjtBQUNBLGNBQUt0QixRQUFRWCxLQUFULElBQW9CLE9BQUtRLFdBQUwsQ0FBaUJDLE9BQWpCLENBQXlCRSxHQUF6QixFQUE4QkMsSUFBOUIsS0FBdUMsU0FBL0QsRUFBMkU7QUFDekUsbUJBQUtmLE9BQUwsRUFBY2MsR0FBZCxJQUFxQixJQUFyQjtBQUNEO0FBQ0QsY0FBSUEsUUFBUVgsS0FBWixFQUFtQjtBQUNqQixtQkFBT00sT0FBT2MsTUFBUCxDQUFjLEVBQWQsRUFBa0IsT0FBSzFCLE1BQUwsQ0FBbEIsQ0FBUDtBQUNELFdBRkQsTUFFTztBQUNMLG1CQUFPLE9BQUtBLE1BQUwsRUFBYWlCLEdBQWIsQ0FBUDtBQUNEO0FBQ0YsU0FWTSxNQVVBO0FBQ0wsaUJBQU8sSUFBUDtBQUNEO0FBQ0YsT0FuQ00sQ0FBUDtBQW9DRDs7OzRCQUVPO0FBQ04sYUFBTyxLQUFLdUIsSUFBTCxFQUFQO0FBQ0Q7OzsyQkFFc0I7QUFBQTs7QUFBQSxVQUFsQkMsQ0FBa0IsdUVBQWQsS0FBS3pDLE1BQUwsQ0FBYzs7QUFDckIsVUFBTTBDLFNBQVMsNEJBQWEsRUFBYixFQUFpQixLQUFLMUMsTUFBTCxDQUFqQixFQUErQnlDLENBQS9CLENBQWY7QUFDQTdCLGFBQU9DLElBQVAsQ0FBWSxLQUFLQyxXQUFMLENBQWlCQyxPQUE3QixFQUFzQ0MsT0FBdEMsQ0FBOEMsVUFBQ0MsR0FBRCxFQUFTO0FBQ3JELFlBQUksT0FBS0gsV0FBTCxDQUFpQkMsT0FBakIsQ0FBeUJFLEdBQXpCLEVBQThCQyxJQUE5QixLQUF1QyxTQUEzQyxFQUFzRDtBQUNwRCxpQkFBT3dCLE9BQU96QixHQUFQLENBQVA7QUFDRDtBQUNGLE9BSkQ7QUFLQTtBQUNBLGFBQU8sS0FBS2YsTUFBTCxFQUFheUMsSUFBYixDQUFrQixLQUFLN0IsV0FBdkIsRUFBb0M0QixNQUFwQyxFQUNOTixJQURNLENBQ0QsVUFBQ1EsT0FBRCxFQUFhO0FBQ2pCLGVBQUt0QixnQkFBTCxDQUFzQnNCLE9BQXRCO0FBQ0E7QUFDRCxPQUpNLENBQVA7QUFLRDs7OzhCQUVTO0FBQ1IsYUFBTyxLQUFLMUMsTUFBTCxFQUFhMkMsTUFBYixDQUFvQixLQUFLL0IsV0FBekIsRUFBc0MsS0FBS2dCLEdBQTNDLENBQVA7QUFDRDs7OzBCQUVLdEIsSSxFQUFNO0FBQ1YsVUFBTXNDLFdBQVdsQyxPQUFPYyxNQUFQLENBQ2YsRUFEZSxFQUVmbEIsSUFGZSxFQUdmO0FBQ0V1QyxtQkFBUyxLQUFLakMsV0FBTCxDQUFpQmUsS0FBMUIsU0FBbUMsS0FBS0MsR0FBeEMsU0FBK0N0QixLQUFLdUM7QUFEdEQsT0FIZSxDQUFqQjtBQU9BLGFBQU8sS0FBSzdDLE1BQUwsRUFBYThDLFdBQWIsQ0FBeUJGLFFBQXpCLENBQVA7QUFDRDs7O3lCQUVJN0IsRyxFQUFLZ0MsSSxFQUFNQyxNLEVBQVE7QUFDdEIsVUFBSSxLQUFLcEMsV0FBTCxDQUFpQkMsT0FBakIsQ0FBeUJFLEdBQXpCLEVBQThCQyxJQUE5QixLQUF1QyxTQUEzQyxFQUFzRDtBQUNwRCxZQUFJaUMsS0FBSyxDQUFUO0FBQ0EsWUFBSSxPQUFPRixJQUFQLEtBQWdCLFFBQXBCLEVBQThCO0FBQzVCRSxlQUFLRixJQUFMO0FBQ0QsU0FGRCxNQUVPLElBQUlBLEtBQUtuQixHQUFULEVBQWM7QUFDbkJxQixlQUFLRixLQUFLbkIsR0FBVjtBQUNELFNBRk0sTUFFQTtBQUNMcUIsZUFBS0YsS0FBSyxLQUFLbkMsV0FBTCxDQUFpQkMsT0FBakIsQ0FBeUJFLEdBQXpCLEVBQThCRyxZQUE5QixDQUEyQ2dDLE1BQTNDLENBQWtEbkMsR0FBbEQsRUFBdURvQyxLQUF2RCxDQUE2RHRCLEtBQWxFLENBQUw7QUFDRDtBQUNELFlBQUssT0FBT29CLEVBQVAsS0FBYyxRQUFmLElBQTZCQSxNQUFNLENBQXZDLEVBQTJDO0FBQ3pDLGlCQUFPLEtBQUtqRCxNQUFMLEVBQWFvRCxHQUFiLENBQWlCLEtBQUt4QyxXQUF0QixFQUFtQyxLQUFLZ0IsR0FBeEMsRUFBNkNiLEdBQTdDLEVBQWtEa0MsRUFBbEQsRUFBc0RELE1BQXRELENBQVA7QUFDRCxTQUZELE1BRU87QUFDTCxpQkFBTyxtQkFBU0ssTUFBVCxDQUFnQixJQUFJQyxLQUFKLENBQVUsK0JBQVYsQ0FBaEIsQ0FBUDtBQUNEO0FBQ0YsT0FkRCxNQWNPO0FBQ0wsZUFBTyxtQkFBU0QsTUFBVCxDQUFnQixJQUFJQyxLQUFKLENBQVUscUNBQVYsQ0FBaEIsQ0FBUDtBQUNEO0FBQ0Y7Ozt3Q0FFbUJ2QyxHLEVBQUtnQyxJLEVBQU1DLE0sRUFBUTtBQUNyQyxVQUFJLEtBQUtwQyxXQUFMLENBQWlCQyxPQUFqQixDQUF5QkUsR0FBekIsRUFBOEJDLElBQTlCLEtBQXVDLFNBQTNDLEVBQXNEO0FBQ3BELFlBQUlpQyxLQUFLLENBQVQ7QUFDQSxZQUFJLE9BQU9GLElBQVAsS0FBZ0IsUUFBcEIsRUFBOEI7QUFDNUJFLGVBQUtGLElBQUw7QUFDRCxTQUZELE1BRU87QUFDTEUsZUFBS0YsS0FBS25CLEdBQVY7QUFDRDtBQUNELFlBQUssT0FBT3FCLEVBQVAsS0FBYyxRQUFmLElBQTZCQSxNQUFNLENBQXZDLEVBQTJDO0FBQ3pDLGVBQUtuRCxNQUFMLEVBQWFpQixHQUFiLElBQW9CLEVBQXBCO0FBQ0EsZUFBS2QsT0FBTCxFQUFjYyxHQUFkLElBQXFCLEtBQXJCO0FBQ0EsaUJBQU8sS0FBS2YsTUFBTCxFQUFhdUQsa0JBQWIsQ0FBZ0MsS0FBSzNDLFdBQXJDLEVBQWtELEtBQUtnQixHQUF2RCxFQUE0RGIsR0FBNUQsRUFBaUVrQyxFQUFqRSxFQUFxRUQsTUFBckUsQ0FBUDtBQUNELFNBSkQsTUFJTztBQUNMLGlCQUFPLG1CQUFTSyxNQUFULENBQWdCLElBQUlDLEtBQUosQ0FBVSwrQkFBVixDQUFoQixDQUFQO0FBQ0Q7QUFDRixPQWRELE1BY087QUFDTCxlQUFPLG1CQUFTRCxNQUFULENBQWdCLElBQUlDLEtBQUosQ0FBVSxxQ0FBVixDQUFoQixDQUFQO0FBQ0Q7QUFDRjs7OzRCQUVPdkMsRyxFQUFLZ0MsSSxFQUFNO0FBQ2pCLFVBQUksS0FBS25DLFdBQUwsQ0FBaUJDLE9BQWpCLENBQXlCRSxHQUF6QixFQUE4QkMsSUFBOUIsS0FBdUMsU0FBM0MsRUFBc0Q7QUFDcEQsWUFBSWlDLEtBQUssQ0FBVDtBQUNBLFlBQUksT0FBT0YsSUFBUCxLQUFnQixRQUFwQixFQUE4QjtBQUM1QkUsZUFBS0YsSUFBTDtBQUNELFNBRkQsTUFFTztBQUNMRSxlQUFLRixLQUFLbkIsR0FBVjtBQUNEO0FBQ0QsWUFBSyxPQUFPcUIsRUFBUCxLQUFjLFFBQWYsSUFBNkJBLE1BQU0sQ0FBdkMsRUFBMkM7QUFDekMsZUFBS25ELE1BQUwsRUFBYWlCLEdBQWIsSUFBb0IsRUFBcEI7QUFDQSxlQUFLZCxPQUFMLEVBQWNjLEdBQWQsSUFBcUIsS0FBckI7QUFDQSxpQkFBTyxLQUFLZixNQUFMLEVBQWF3RCxNQUFiLENBQW9CLEtBQUs1QyxXQUF6QixFQUFzQyxLQUFLZ0IsR0FBM0MsRUFBZ0RiLEdBQWhELEVBQXFEa0MsRUFBckQsQ0FBUDtBQUNELFNBSkQsTUFJTztBQUNMLGlCQUFPLG1CQUFTSSxNQUFULENBQWdCLElBQUlDLEtBQUosQ0FBVSxvQ0FBVixDQUFoQixDQUFQO0FBQ0Q7QUFDRixPQWRELE1BY087QUFDTCxlQUFPLG1CQUFTRCxNQUFULENBQWdCLElBQUlDLEtBQUosQ0FBVSwwQ0FBVixDQUFoQixDQUFQO0FBQ0Q7QUFDRjs7O2dDQUVXO0FBQ1YsVUFBSSxLQUFLcEQsWUFBTCxDQUFKLEVBQXdCO0FBQ3RCLGFBQUtBLFlBQUwsRUFBbUJ1RCxXQUFuQjtBQUNEO0FBQ0Y7Ozt3QkFqTVc7QUFDVixhQUFPLEtBQUs3QyxXQUFMLENBQWlCZSxLQUF4QjtBQUNEOzs7d0JBRVM7QUFDUixhQUFPLEtBQUs3QixNQUFMLEVBQWEsS0FBS2MsV0FBTCxDQUFpQmdCLEdBQTlCLENBQVA7QUFDRDs7Ozs7O0FBOExIdkIsTUFBTXFELFFBQU4sR0FBaUIsU0FBU0EsUUFBVCxDQUFrQkMsSUFBbEIsRUFBd0I7QUFBQTs7QUFDdkMsT0FBSy9CLEdBQUwsR0FBVytCLEtBQUsvQixHQUFMLElBQVksSUFBdkI7QUFDQSxPQUFLRCxLQUFMLEdBQWFnQyxLQUFLaEMsS0FBbEI7QUFDQSxPQUFLZCxPQUFMLEdBQWUsRUFBZjtBQUNBSCxTQUFPQyxJQUFQLENBQVlnRCxLQUFLOUMsT0FBakIsRUFBMEJDLE9BQTFCLENBQWtDLFVBQUM4QyxDQUFELEVBQU87QUFDdkMsUUFBTS9CLFFBQVE4QixLQUFLOUMsT0FBTCxDQUFhK0MsQ0FBYixDQUFkO0FBQ0EsUUFBSS9CLE1BQU1iLElBQU4sS0FBZSxTQUFuQixFQUE4QjtBQUFBLFVBQ3RCNkMsbUJBRHNCO0FBQUE7O0FBQUE7QUFBQTs7QUFBQTtBQUFBOztBQUFBO0FBQUE7O0FBRTVCQSwwQkFBb0JILFFBQXBCLENBQTZCN0IsTUFBTVgsWUFBbkM7QUFDQSxhQUFLTCxPQUFMLENBQWErQyxDQUFiLElBQWtCO0FBQ2hCNUMsY0FBTSxTQURVO0FBRWhCRSxzQkFBYzJDO0FBRkUsT0FBbEI7QUFJRCxLQVBELE1BT087QUFDTCxhQUFLaEQsT0FBTCxDQUFhK0MsQ0FBYixJQUFrQmxELE9BQU9jLE1BQVAsQ0FBYyxFQUFkLEVBQWtCSyxLQUFsQixDQUFsQjtBQUNEO0FBQ0YsR0FaRDtBQWFELENBakJEOztBQW1CQXhCLE1BQU15RCxNQUFOLEdBQWUsU0FBU0EsTUFBVCxHQUFrQjtBQUFBOztBQUMvQixNQUFNQyxTQUFTO0FBQ2JuQyxTQUFLLEtBQUtBLEdBREc7QUFFYkQsV0FBTyxLQUFLQSxLQUZDO0FBR2JkLGFBQVM7QUFISSxHQUFmO0FBS0EsTUFBTW1ELGFBQWF0RCxPQUFPQyxJQUFQLENBQVksS0FBS0UsT0FBakIsQ0FBbkI7QUFDQW1ELGFBQVdsRCxPQUFYLENBQW1CLFVBQUM4QyxDQUFELEVBQU87QUFDeEIsUUFBSSxPQUFLL0MsT0FBTCxDQUFhK0MsQ0FBYixFQUFnQjVDLElBQWhCLEtBQXlCLFNBQTdCLEVBQXdDO0FBQ3RDK0MsYUFBT2xELE9BQVAsQ0FBZStDLENBQWYsSUFBb0I7QUFDbEI1QyxjQUFNLFNBRFk7QUFFbEJFLHNCQUFjLE9BQUtMLE9BQUwsQ0FBYStDLENBQWIsRUFBZ0IxQyxZQUFoQixDQUE2QjRDLE1BQTdCO0FBRkksT0FBcEI7QUFJRCxLQUxELE1BS087QUFDTEMsYUFBT2xELE9BQVAsQ0FBZStDLENBQWYsSUFBb0IsT0FBSy9DLE9BQUwsQ0FBYStDLENBQWIsQ0FBcEI7QUFDRDtBQUNGLEdBVEQ7QUFVQSxTQUFPRyxNQUFQO0FBQ0QsQ0FsQkQ7O0FBb0JBMUQsTUFBTTRELEtBQU4sR0FBYyxTQUFTQSxLQUFULENBQWUxRCxLQUFmLEVBQXNCRCxJQUF0QixFQUE0QjtBQUN4QyxNQUFNc0MsV0FBV2xDLE9BQU9jLE1BQVAsQ0FDZixFQURlLEVBRWZsQixJQUZlLEVBR2Y7QUFDRXVDLGVBQVMsS0FBS2xCLEtBQWQsU0FBdUJyQixLQUFLdUM7QUFEOUIsR0FIZSxDQUFqQjtBQU9BLFNBQU90QyxNQUFNdUMsV0FBTixDQUFrQkYsUUFBbEIsQ0FBUDtBQUNELENBVEQ7O0FBV0F2QyxNQUFNbUIsTUFBTixHQUFlLFNBQVNBLE1BQVQsQ0FBZ0JsQixJQUFoQixFQUFzQjtBQUFBOztBQUNuQyxNQUFNNEQsUUFBUSxFQUFkO0FBQ0F4RCxTQUFPQyxJQUFQLENBQVksS0FBS0UsT0FBakIsRUFBMEJDLE9BQTFCLENBQWtDLFVBQUNDLEdBQUQsRUFBUztBQUN6QyxRQUFJVCxLQUFLUyxHQUFMLENBQUosRUFBZTtBQUNibUQsWUFBTW5ELEdBQU4sSUFBYVQsS0FBS1MsR0FBTCxDQUFiO0FBQ0QsS0FGRCxNQUVPLElBQUksT0FBS0YsT0FBTCxDQUFhRSxHQUFiLEVBQWtCSSxPQUF0QixFQUErQjtBQUNwQytDLFlBQU1uRCxHQUFOLElBQWEsT0FBS0YsT0FBTCxDQUFhRSxHQUFiLEVBQWtCSSxPQUEvQjtBQUNELEtBRk0sTUFFQSxJQUFJLE9BQUtOLE9BQUwsQ0FBYUUsR0FBYixFQUFrQkMsSUFBbEIsS0FBMkIsU0FBL0IsRUFBMEM7QUFDL0NrRCxZQUFNbkQsR0FBTixJQUFhLEVBQWI7QUFDRCxLQUZNLE1BRUE7QUFDTG1ELFlBQU1uRCxHQUFOLElBQWEsSUFBYjtBQUNEO0FBQ0YsR0FWRDtBQVdBLFNBQU9tRCxLQUFQO0FBQ0QsQ0FkRDs7QUFnQkE3RCxNQUFNdUIsR0FBTixHQUFZLElBQVo7QUFDQXZCLE1BQU1zQixLQUFOLEdBQWMsTUFBZDtBQUNBdEIsTUFBTUQsS0FBTixHQUFjQSxLQUFkO0FBQ0FDLE1BQU1RLE9BQU4sR0FBZ0I7QUFDZG9DLE1BQUk7QUFDRmpDLFVBQU07QUFESjtBQURVLENBQWhCIiwiZmlsZSI6Im1vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IFJlbGF0aW9uc2hpcCB9IGZyb20gJy4vcmVsYXRpb25zaGlwJztcbmltcG9ydCBtZXJnZU9wdGlvbnMgZnJvbSAnbWVyZ2Utb3B0aW9ucyc7XG5pbXBvcnQgeyBCZWhhdmlvclN1YmplY3QgfSBmcm9tICdyeGpzL1J4JztcbmNvbnN0ICRzdG9yZSA9IFN5bWJvbCgnJHN0b3JlJyk7XG5jb25zdCAkcGx1bXAgPSBTeW1ib2woJyRwbHVtcCcpO1xuY29uc3QgJGxvYWRlZCA9IFN5bWJvbCgnJGxvYWRlZCcpO1xuY29uc3QgJHVuc3Vic2NyaWJlID0gU3ltYm9sKCckdW5zdWJzY3JpYmUnKTtcbmNvbnN0ICRzdWJqZWN0ID0gU3ltYm9sKCckc3ViamVjdCcpO1xuZXhwb3J0IGNvbnN0ICRzZWxmID0gU3ltYm9sKCckc2VsZicpO1xuXG4vLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIGVycm9yIGV2ZW50cyBvcmlnaW5hdGUgKHN0b3JhZ2Ugb3IgbW9kZWwpXG4vLyBhbmQgd2hvIGtlZXBzIGEgcm9sbC1iYWNrYWJsZSBkZWx0YVxuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzLCBwbHVtcCkge1xuICAgIHRoaXNbJHN0b3JlXSA9IHtcbiAgICAgIFskbG9hZGVkXTogZmFsc2UsXG4gICAgfTtcbiAgICB0aGlzLiRyZWxhdGlvbnNoaXBzID0ge307XG4gICAgdGhpc1skc3ViamVjdF0gPSBuZXcgQmVoYXZpb3JTdWJqZWN0KCk7XG4gICAgdGhpc1skc3ViamVjdF0ubmV4dCh7fSk7XG4gICAgdGhpc1skbG9hZGVkXSA9IHtcbiAgICAgIFskc2VsZl06IGZhbHNlLFxuICAgIH07XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgY29uc3QgUmVsID0gdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0ucmVsYXRpb25zaGlwO1xuICAgICAgICB0aGlzLiRyZWxhdGlvbnNoaXBzW2tleV0gPSBuZXcgUmVsKHRoaXMsIGtleSwgcGx1bXApO1xuICAgICAgICB0aGlzWyRzdG9yZV1ba2V5XSA9IFtdO1xuICAgICAgICB0aGlzWyRsb2FkZWRdW2tleV0gPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0uZGVmYXVsdCB8fCBudWxsO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbShvcHRzIHx8IHt9KTtcbiAgICBpZiAocGx1bXApIHtcbiAgICAgIHRoaXNbJHBsdW1wXSA9IHBsdW1wO1xuICAgIH1cbiAgfVxuXG4gIGdldCAkbmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci4kbmFtZTtcbiAgfVxuXG4gIGdldCAkaWQoKSB7XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JlXVt0aGlzLmNvbnN0cnVjdG9yLiRpZF07XG4gIH1cblxuICAkJGNvcHlWYWx1ZXNGcm9tKG9wdHMgPSB7fSkge1xuICAgIE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkcykuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICBpZiAob3B0c1tmaWVsZE5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gY29weSBmcm9tIG9wdHMgdG8gdGhlIGJlc3Qgb2Ygb3VyIGFiaWxpdHlcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnYXJyYXknKSB8fFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnaGFzTWFueScpXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gKG9wdHNbZmllbGROYW1lXSB8fCBbXSkuY29uY2F0KCk7XG4gICAgICAgICAgdGhpc1skbG9hZGVkXVtmaWVsZE5hbWVdID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0c1tmaWVsZE5hbWVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IG9wdHNbZmllbGROYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuJCRmaXJlVXBkYXRlKCk7XG4gIH1cblxuICAkJGhvb2tUb1BsdW1wKCkge1xuICAgIGlmICh0aGlzWyR1bnN1YnNjcmliZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skdW5zdWJzY3JpYmVdID0gdGhpc1skcGx1bXBdLnN1YnNjcmliZSh0aGlzLmNvbnN0cnVjdG9yLiRuYW1lLCB0aGlzLiRpZCwgKHsgZmllbGQsIHZhbHVlIH0pID0+IHtcbiAgICAgICAgaWYgKGZpZWxkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20oeyBbZmllbGRdOiB2YWx1ZSB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAkc3Vic2NyaWJlKGwpIHtcbiAgICB0aGlzLiQkaG9va1RvUGx1bXAoKTtcbiAgICByZXR1cm4gdGhpc1skc3ViamVjdF0uc3Vic2NyaWJlKGwpO1xuICB9XG5cbiAgJCRmaXJlVXBkYXRlKCkge1xuICAgIHRoaXNbJHN1YmplY3RdLm5leHQodGhpc1skc3RvcmVdKTtcbiAgfVxuXG4gIC8vIFRPRE86IGRvbid0IGZldGNoIGlmIHdlICRnZXQoKSBzb21ldGhpbmcgdGhhdCB3ZSBhbHJlYWR5IGhhdmVcblxuICAkZ2V0KGtleSA9ICRzZWxmKSB7XG4gICAgLy8gdGhyZWUgY2FzZXMuXG4gICAgLy8ga2V5ID09PSB1bmRlZmluZWQgLSBmZXRjaCBhbGwsIHVubGVzcyAkbG9hZGVkLCBidXQgcmV0dXJuIGFsbC5cbiAgICAvLyBmaWVsZHNba2V5XSA9PT0gJ2hhc01hbnknIC0gZmV0Y2ggY2hpbGRyZW4gKHBlcmhhcHMgbW92ZSB0aGlzIGRlY2lzaW9uIHRvIHN0b3JlKVxuICAgIC8vIG90aGVyd2lzZSAtIGZldGNoIGFsbCwgdW5sZXNzICRzdG9yZVtrZXldLCByZXR1cm4gJHN0b3JlW2tleV0uXG5cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKChrZXkgPT09ICRzZWxmKSB8fCAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSAhPT0gJ2hhc01hbnknKSkge1xuICAgICAgICBpZiAodGhpc1skbG9hZGVkXVskc2VsZl0gPT09IGZhbHNlICYmIHRoaXNbJHBsdW1wXSkge1xuICAgICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZ2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoKHRoaXNbJGxvYWRlZF1ba2V5XSA9PT0gZmFsc2UpICYmIHRoaXNbJHBsdW1wXSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWxvbmVseS1pZlxuICAgICAgICAgIHJldHVybiB0aGlzLiRyZWxhdGlvbnNoaXBzW2tleV0uJGxpc3QoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLnRoZW4oKHYpID0+IHtcbiAgICAgIGlmICh2ID09PSB0cnVlKSB7XG4gICAgICAgIGlmIChrZXkgPT09ICRzZWxmKSB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXNbJHN0b3JlXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHN0b3JlXVtrZXldO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHYpIHtcbiAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHYpO1xuICAgICAgICBpZiAoKGtleSA9PT0gJHNlbGYpIHx8ICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpKSB7XG4gICAgICAgICAgdGhpc1skbG9hZGVkXVtrZXldID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5ID09PSAkc2VsZikge1xuICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCB0aGlzWyRzdG9yZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzWyRzdG9yZV1ba2V5XTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAkc2F2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy4kc2V0KCk7XG4gIH1cblxuICAkc2V0KHUgPSB0aGlzWyRzdG9yZV0pIHtcbiAgICBjb25zdCB1cGRhdGUgPSBtZXJnZU9wdGlvbnMoe30sIHRoaXNbJHN0b3JlXSwgdSk7XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgZGVsZXRlIHVwZGF0ZVtrZXldO1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8vIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh1cGRhdGUpOyAvLyB0aGlzIGlzIHRoZSBvcHRpbWlzdGljIHVwZGF0ZTtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLnNhdmUodGhpcy5jb25zdHJ1Y3RvciwgdXBkYXRlKVxuICAgIC50aGVuKCh1cGRhdGVkKSA9PiB7XG4gICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odXBkYXRlZCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9KTtcbiAgfVxuXG4gICRkZWxldGUoKSB7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5kZWxldGUodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQpO1xuICB9XG5cbiAgJHJlc3Qob3B0cykge1xuICAgIGNvbnN0IHJlc3RPcHRzID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAgb3B0cyxcbiAgICAgIHtcbiAgICAgICAgdXJsOiBgLyR7dGhpcy5jb25zdHJ1Y3Rvci4kbmFtZX0vJHt0aGlzLiRpZH0vJHtvcHRzLnVybH1gLFxuICAgICAgfVxuICAgICk7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5yZXN0UmVxdWVzdChyZXN0T3B0cyk7XG4gIH1cblxuICAkYWRkKGtleSwgaXRlbSwgZXh0cmFzKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIGlmIChpdGVtLiRpZCkge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtW3RoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnJlbGF0aW9uc2hpcC4kc2lkZXNba2V5XS5vdGhlci5maWVsZF07XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLmFkZCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpZCwgZXh0cmFzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gYWRkZWQgdG8gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICRtb2RpZnlSZWxhdGlvbnNoaXAoa2V5LCBpdGVtLCBleHRyYXMpIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgdGhpc1skc3RvcmVdW2tleV0gPSBbXTtcbiAgICAgICAgdGhpc1skbG9hZGVkXVtrZXldID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0ubW9kaWZ5UmVsYXRpb25zaGlwKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkLCBleHRyYXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSBhZGRlZCB0byBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRhZGQgZXhjZXB0IHRvIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG5cbiAgJHJlbW92ZShrZXksIGl0ZW0pIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgdGhpc1skc3RvcmVdW2tleV0gPSBbXTtcbiAgICAgICAgdGhpc1skbG9hZGVkXVtrZXldID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0ucmVtb3ZlKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gJHJlbW92ZWQgZnJvbSBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRyZW1vdmUgZXhjZXB0IGZyb20gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkdGVhcmRvd24oKSB7XG4gICAgaWYgKHRoaXNbJHVuc3Vic2NyaWJlXSkge1xuICAgICAgdGhpc1skdW5zdWJzY3JpYmVdLnVuc3Vic2NyaWJlKCk7XG4gICAgfVxuICB9XG59XG5cbk1vZGVsLmZyb21KU09OID0gZnVuY3Rpb24gZnJvbUpTT04oanNvbikge1xuICB0aGlzLiRpZCA9IGpzb24uJGlkIHx8ICdpZCc7XG4gIHRoaXMuJG5hbWUgPSBqc29uLiRuYW1lO1xuICB0aGlzLiRmaWVsZHMgPSB7fTtcbiAgT2JqZWN0LmtleXMoanNvbi4kZmllbGRzKS5mb3JFYWNoKChrKSA9PiB7XG4gICAgY29uc3QgZmllbGQgPSBqc29uLiRmaWVsZHNba107XG4gICAgaWYgKGZpZWxkLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgY2xhc3MgRHluYW1pY1JlbGF0aW9uc2hpcCBleHRlbmRzIFJlbGF0aW9uc2hpcCB7fVxuICAgICAgRHluYW1pY1JlbGF0aW9uc2hpcC5mcm9tSlNPTihmaWVsZC5yZWxhdGlvbnNoaXApO1xuICAgICAgdGhpcy4kZmllbGRzW2tdID0ge1xuICAgICAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgICAgIHJlbGF0aW9uc2hpcDogRHluYW1pY1JlbGF0aW9uc2hpcCxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJGZpZWxkc1trXSA9IE9iamVjdC5hc3NpZ24oe30sIGZpZWxkKTtcbiAgICB9XG4gIH0pO1xufTtcblxuTW9kZWwudG9KU09OID0gZnVuY3Rpb24gdG9KU09OKCkge1xuICBjb25zdCByZXRWYWwgPSB7XG4gICAgJGlkOiB0aGlzLiRpZCxcbiAgICAkbmFtZTogdGhpcy4kbmFtZSxcbiAgICAkZmllbGRzOiB7fSxcbiAgfTtcbiAgY29uc3QgZmllbGROYW1lcyA9IE9iamVjdC5rZXlzKHRoaXMuJGZpZWxkcyk7XG4gIGZpZWxkTmFtZXMuZm9yRWFjaCgoaykgPT4ge1xuICAgIGlmICh0aGlzLiRmaWVsZHNba10udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICByZXRWYWwuJGZpZWxkc1trXSA9IHtcbiAgICAgICAgdHlwZTogJ2hhc01hbnknLFxuICAgICAgICByZWxhdGlvbnNoaXA6IHRoaXMuJGZpZWxkc1trXS5yZWxhdGlvbnNoaXAudG9KU09OKCksXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXRWYWwuJGZpZWxkc1trXSA9IHRoaXMuJGZpZWxkc1trXTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcmV0VmFsO1xufTtcblxuTW9kZWwuJHJlc3QgPSBmdW5jdGlvbiAkcmVzdChwbHVtcCwgb3B0cykge1xuICBjb25zdCByZXN0T3B0cyA9IE9iamVjdC5hc3NpZ24oXG4gICAge30sXG4gICAgb3B0cyxcbiAgICB7XG4gICAgICB1cmw6IGAvJHt0aGlzLiRuYW1lfS8ke29wdHMudXJsfWAsXG4gICAgfVxuICApO1xuICByZXR1cm4gcGx1bXAucmVzdFJlcXVlc3QocmVzdE9wdHMpO1xufTtcblxuTW9kZWwuYXNzaWduID0gZnVuY3Rpb24gYXNzaWduKG9wdHMpIHtcbiAgY29uc3Qgc3RhcnQgPSB7fTtcbiAgT2JqZWN0LmtleXModGhpcy4kZmllbGRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICBpZiAob3B0c1trZXldKSB7XG4gICAgICBzdGFydFtrZXldID0gb3B0c1trZXldO1xuICAgIH0gZWxzZSBpZiAodGhpcy4kZmllbGRzW2tleV0uZGVmYXVsdCkge1xuICAgICAgc3RhcnRba2V5XSA9IHRoaXMuJGZpZWxkc1trZXldLmRlZmF1bHQ7XG4gICAgfSBlbHNlIGlmICh0aGlzLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIHN0YXJ0W2tleV0gPSBbXTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhcnRba2V5XSA9IG51bGw7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHN0YXJ0O1xufTtcblxuTW9kZWwuJGlkID0gJ2lkJztcbk1vZGVsLiRuYW1lID0gJ0Jhc2UnO1xuTW9kZWwuJHNlbGYgPSAkc2VsZjtcbk1vZGVsLiRmaWVsZHMgPSB7XG4gIGlkOiB7XG4gICAgdHlwZTogJ251bWJlcicsXG4gIH0sXG59O1xuIl19
