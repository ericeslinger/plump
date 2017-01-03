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

    this[$store] = {};
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
      if (this[$loaded][$self] === false) {
        this.$get();
      }
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRzdG9yZSIsIlN5bWJvbCIsIiRwbHVtcCIsIiRsb2FkZWQiLCIkdW5zdWJzY3JpYmUiLCIkc3ViamVjdCIsIiRzZWxmIiwiTW9kZWwiLCJvcHRzIiwicGx1bXAiLCIkcmVsYXRpb25zaGlwcyIsIm5leHQiLCJPYmplY3QiLCJrZXlzIiwiY29uc3RydWN0b3IiLCIkZmllbGRzIiwiZm9yRWFjaCIsImtleSIsInR5cGUiLCJSZWwiLCJyZWxhdGlvbnNoaXAiLCJkZWZhdWx0IiwiJCRjb3B5VmFsdWVzRnJvbSIsImZpZWxkTmFtZSIsInVuZGVmaW5lZCIsImNvbmNhdCIsImFzc2lnbiIsIiQkZmlyZVVwZGF0ZSIsInN1YnNjcmliZSIsIiRuYW1lIiwiJGlkIiwiZmllbGQiLCJ2YWx1ZSIsImwiLCIkJGhvb2tUb1BsdW1wIiwiJGdldCIsInJlc29sdmUiLCJ0aGVuIiwiZ2V0IiwiJGxpc3QiLCJ2IiwiJHNldCIsInUiLCJ1cGRhdGUiLCJzYXZlIiwidXBkYXRlZCIsImRlbGV0ZSIsInJlc3RPcHRzIiwidXJsIiwicmVzdFJlcXVlc3QiLCJpdGVtIiwiZXh0cmFzIiwiaWQiLCIkc2lkZXMiLCJvdGhlciIsImFkZCIsInJlamVjdCIsIkVycm9yIiwibW9kaWZ5UmVsYXRpb25zaGlwIiwicmVtb3ZlIiwidW5zdWJzY3JpYmUiLCJmcm9tSlNPTiIsImpzb24iLCJrIiwiRHluYW1pY1JlbGF0aW9uc2hpcCIsInRvSlNPTiIsInJldFZhbCIsImZpZWxkTmFtZXMiLCIkcmVzdCIsInN0YXJ0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7OztBQUNBLElBQU1BLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUMsU0FBU0QsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNRSxVQUFVRixPQUFPLFNBQVAsQ0FBaEI7QUFDQSxJQUFNRyxlQUFlSCxPQUFPLGNBQVAsQ0FBckI7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LENBQVksS0FBS0UsT0FBakIsRUFBMEJDLE9BQTFCLENBQWtDLFVBQUNDLEdBQUQsRUFBUztBQUN6QyxRQUFJVCxLQUFLUyxHQUFMLENBQUosRUFBZTtBQUNib0QsWUFBTXBELEdBQU4sSUFBYVQsS0FBS1MsR0FBTCxDQUFiO0FBQ0QsS0FGRCxNQUVPLElBQUksT0FBS0YsT0FBTCxDQUFhRSxHQUFiLEVBQWtCSSxPQUF0QixFQUErQjtBQUNwQ2dELFlBQU1wRCxHQUFOLElBQWEsT0FBS0YsT0FBTCxDQUFhRSxHQUFiLEVBQWtCSSxPQUEvQjtBQUNELEtBRk0sTUFFQSxJQUFJLE9BQUtOLE9BQUwsQ0FBYUUsR0FBYixFQUFrQkMsSUFBbEIsS0FBMkIsU0FBL0IsRUFBMEM7QUFDL0NtRCxZQUFNcEQsR0FBTixJQUFhLEVBQWI7QUFDRCxLQUZNLE1BRUE7QUFDTG9ELFlBQU1wRCxHQUFOLElBQWEsSUFBYjtBQUNEO0FBQ0YsR0FWRDtBQVdBLFNBQU9vRCxLQUFQO0FBQ0QsQ0FkRDs7QUFnQkE5RCxNQUFNdUIsR0FBTixHQUFZLElBQVo7QUFDQXZCLE1BQU1zQixLQUFOLEdBQWMsTUFBZDtBQUNBdEIsTUFBTUQsS0FBTixHQUFjQSxLQUFkO0FBQ0FDLE1BQU1RLE9BQU4sR0FBZ0I7QUFDZHFDLE1BQUk7QUFDRmxDLFVBQU07QUFESjtBQURVLENBQWhCIiwiZmlsZSI6Im1vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IFJlbGF0aW9uc2hpcCB9IGZyb20gJy4vcmVsYXRpb25zaGlwJztcbmltcG9ydCBtZXJnZU9wdGlvbnMgZnJvbSAnbWVyZ2Utb3B0aW9ucyc7XG5pbXBvcnQgeyBCZWhhdmlvclN1YmplY3QgfSBmcm9tICdyeGpzL1J4JztcbmNvbnN0ICRzdG9yZSA9IFN5bWJvbCgnJHN0b3JlJyk7XG5jb25zdCAkcGx1bXAgPSBTeW1ib2woJyRwbHVtcCcpO1xuY29uc3QgJGxvYWRlZCA9IFN5bWJvbCgnJGxvYWRlZCcpO1xuY29uc3QgJHVuc3Vic2NyaWJlID0gU3ltYm9sKCckdW5zdWJzY3JpYmUnKTtcbmNvbnN0ICRzdWJqZWN0ID0gU3ltYm9sKCckc3ViamVjdCcpO1xuZXhwb3J0IGNvbnN0ICRzZWxmID0gU3ltYm9sKCckc2VsZicpO1xuXG4vLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIGVycm9yIGV2ZW50cyBvcmlnaW5hdGUgKHN0b3JhZ2Ugb3IgbW9kZWwpXG4vLyBhbmQgd2hvIGtlZXBzIGEgcm9sbC1iYWNrYWJsZSBkZWx0YVxuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzLCBwbHVtcCkge1xuICAgIHRoaXNbJHN0b3JlXSA9IHtcbiAgICB9O1xuICAgIHRoaXMuJHJlbGF0aW9uc2hpcHMgPSB7fTtcbiAgICB0aGlzWyRzdWJqZWN0XSA9IG5ldyBCZWhhdmlvclN1YmplY3QoKTtcbiAgICB0aGlzWyRzdWJqZWN0XS5uZXh0KHt9KTtcbiAgICB0aGlzWyRsb2FkZWRdID0ge1xuICAgICAgWyRzZWxmXTogZmFsc2UsXG4gICAgfTtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgICBjb25zdCBSZWwgPSB0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS5yZWxhdGlvbnNoaXA7XG4gICAgICAgIHRoaXMuJHJlbGF0aW9uc2hpcHNba2V5XSA9IG5ldyBSZWwodGhpcywga2V5LCBwbHVtcCk7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gW107XG4gICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpc1skc3RvcmVdW2tleV0gPSB0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS5kZWZhdWx0IHx8IG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKG9wdHMgfHwge30pO1xuICAgIGlmIChwbHVtcCkge1xuICAgICAgdGhpc1skcGx1bXBdID0gcGx1bXA7XG4gICAgfVxuICB9XG5cbiAgZ2V0ICRuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLiRuYW1lO1xuICB9XG5cbiAgZ2V0ICRpZCgpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmVdW3RoaXMuY29uc3RydWN0b3IuJGlkXTtcbiAgfVxuXG4gICQkY29weVZhbHVlc0Zyb20ob3B0cyA9IHt9KSB7XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChmaWVsZE5hbWUpID0+IHtcbiAgICAgIGlmIChvcHRzW2ZpZWxkTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBjb3B5IGZyb20gb3B0cyB0byB0aGUgYmVzdCBvZiBvdXIgYWJpbGl0eVxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdhcnJheScpIHx8XG4gICAgICAgICAgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdoYXNNYW55JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSAob3B0c1tmaWVsZE5hbWVdIHx8IFtdKS5jb25jYXQoKTtcbiAgICAgICAgICB0aGlzWyRsb2FkZWRdW2ZpZWxkTmFtZV0gPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBPYmplY3QuYXNzaWduKHt9LCBvcHRzW2ZpZWxkTmFtZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gb3B0c1tmaWVsZE5hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy4kJGZpcmVVcGRhdGUoKTtcbiAgfVxuXG4gICQkaG9va1RvUGx1bXAoKSB7XG4gICAgaWYgKHRoaXNbJHVuc3Vic2NyaWJlXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyR1bnN1YnNjcmliZV0gPSB0aGlzWyRwbHVtcF0uc3Vic2NyaWJlKHRoaXMuY29uc3RydWN0b3IuJG5hbWUsIHRoaXMuJGlkLCAoeyBmaWVsZCwgdmFsdWUgfSkgPT4ge1xuICAgICAgICBpZiAoZmllbGQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh7IFtmaWVsZF06IHZhbHVlIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gICRzdWJzY3JpYmUobCkge1xuICAgIHRoaXMuJCRob29rVG9QbHVtcCgpO1xuICAgIGlmICh0aGlzWyRsb2FkZWRdWyRzZWxmXSA9PT0gZmFsc2UpIHtcbiAgICAgIHRoaXMuJGdldCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpc1skc3ViamVjdF0uc3Vic2NyaWJlKGwpO1xuICB9XG5cbiAgJCRmaXJlVXBkYXRlKCkge1xuICAgIHRoaXNbJHN1YmplY3RdLm5leHQodGhpc1skc3RvcmVdKTtcbiAgfVxuXG4gIC8vIFRPRE86IGRvbid0IGZldGNoIGlmIHdlICRnZXQoKSBzb21ldGhpbmcgdGhhdCB3ZSBhbHJlYWR5IGhhdmVcblxuICAkZ2V0KGtleSA9ICRzZWxmKSB7XG4gICAgLy8gdGhyZWUgY2FzZXMuXG4gICAgLy8ga2V5ID09PSB1bmRlZmluZWQgLSBmZXRjaCBhbGwsIHVubGVzcyAkbG9hZGVkLCBidXQgcmV0dXJuIGFsbC5cbiAgICAvLyBmaWVsZHNba2V5XSA9PT0gJ2hhc01hbnknIC0gZmV0Y2ggY2hpbGRyZW4gKHBlcmhhcHMgbW92ZSB0aGlzIGRlY2lzaW9uIHRvIHN0b3JlKVxuICAgIC8vIG90aGVyd2lzZSAtIGZldGNoIGFsbCwgdW5sZXNzICRzdG9yZVtrZXldLCByZXR1cm4gJHN0b3JlW2tleV0uXG5cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKChrZXkgPT09ICRzZWxmKSB8fCAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSAhPT0gJ2hhc01hbnknKSkge1xuICAgICAgICBpZiAodGhpc1skbG9hZGVkXVskc2VsZl0gPT09IGZhbHNlICYmIHRoaXNbJHBsdW1wXSkge1xuICAgICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZ2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoKHRoaXNbJGxvYWRlZF1ba2V5XSA9PT0gZmFsc2UpICYmIHRoaXNbJHBsdW1wXSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWxvbmVseS1pZlxuICAgICAgICAgIHJldHVybiB0aGlzLiRyZWxhdGlvbnNoaXBzW2tleV0uJGxpc3QoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLnRoZW4oKHYpID0+IHtcbiAgICAgIGlmICh2ID09PSB0cnVlKSB7XG4gICAgICAgIGlmIChrZXkgPT09ICRzZWxmKSB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXNbJHN0b3JlXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHN0b3JlXVtrZXldO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHYpIHtcbiAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHYpO1xuICAgICAgICBpZiAoKGtleSA9PT0gJHNlbGYpIHx8ICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpKSB7XG4gICAgICAgICAgdGhpc1skbG9hZGVkXVtrZXldID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5ID09PSAkc2VsZikge1xuICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCB0aGlzWyRzdG9yZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzWyRzdG9yZV1ba2V5XTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAkc2F2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy4kc2V0KCk7XG4gIH1cblxuICAkc2V0KHUgPSB0aGlzWyRzdG9yZV0pIHtcbiAgICBjb25zdCB1cGRhdGUgPSBtZXJnZU9wdGlvbnMoe30sIHRoaXNbJHN0b3JlXSwgdSk7XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgZGVsZXRlIHVwZGF0ZVtrZXldO1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8vIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh1cGRhdGUpOyAvLyB0aGlzIGlzIHRoZSBvcHRpbWlzdGljIHVwZGF0ZTtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLnNhdmUodGhpcy5jb25zdHJ1Y3RvciwgdXBkYXRlKVxuICAgIC50aGVuKCh1cGRhdGVkKSA9PiB7XG4gICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odXBkYXRlZCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9KTtcbiAgfVxuXG4gICRkZWxldGUoKSB7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5kZWxldGUodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQpO1xuICB9XG5cbiAgJHJlc3Qob3B0cykge1xuICAgIGNvbnN0IHJlc3RPcHRzID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAgb3B0cyxcbiAgICAgIHtcbiAgICAgICAgdXJsOiBgLyR7dGhpcy5jb25zdHJ1Y3Rvci4kbmFtZX0vJHt0aGlzLiRpZH0vJHtvcHRzLnVybH1gLFxuICAgICAgfVxuICAgICk7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5yZXN0UmVxdWVzdChyZXN0T3B0cyk7XG4gIH1cblxuICAkYWRkKGtleSwgaXRlbSwgZXh0cmFzKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIGlmIChpdGVtLiRpZCkge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtW3RoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnJlbGF0aW9uc2hpcC4kc2lkZXNba2V5XS5vdGhlci5maWVsZF07XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLmFkZCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpZCwgZXh0cmFzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gYWRkZWQgdG8gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICRtb2RpZnlSZWxhdGlvbnNoaXAoa2V5LCBpdGVtLCBleHRyYXMpIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgdGhpc1skc3RvcmVdW2tleV0gPSBbXTtcbiAgICAgICAgdGhpc1skbG9hZGVkXVtrZXldID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0ubW9kaWZ5UmVsYXRpb25zaGlwKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkLCBleHRyYXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSBhZGRlZCB0byBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRhZGQgZXhjZXB0IHRvIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG5cbiAgJHJlbW92ZShrZXksIGl0ZW0pIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgdGhpc1skc3RvcmVdW2tleV0gPSBbXTtcbiAgICAgICAgdGhpc1skbG9hZGVkXVtrZXldID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0ucmVtb3ZlKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gJHJlbW92ZWQgZnJvbSBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRyZW1vdmUgZXhjZXB0IGZyb20gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkdGVhcmRvd24oKSB7XG4gICAgaWYgKHRoaXNbJHVuc3Vic2NyaWJlXSkge1xuICAgICAgdGhpc1skdW5zdWJzY3JpYmVdLnVuc3Vic2NyaWJlKCk7XG4gICAgfVxuICB9XG59XG5cbk1vZGVsLmZyb21KU09OID0gZnVuY3Rpb24gZnJvbUpTT04oanNvbikge1xuICB0aGlzLiRpZCA9IGpzb24uJGlkIHx8ICdpZCc7XG4gIHRoaXMuJG5hbWUgPSBqc29uLiRuYW1lO1xuICB0aGlzLiRmaWVsZHMgPSB7fTtcbiAgT2JqZWN0LmtleXMoanNvbi4kZmllbGRzKS5mb3JFYWNoKChrKSA9PiB7XG4gICAgY29uc3QgZmllbGQgPSBqc29uLiRmaWVsZHNba107XG4gICAgaWYgKGZpZWxkLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgY2xhc3MgRHluYW1pY1JlbGF0aW9uc2hpcCBleHRlbmRzIFJlbGF0aW9uc2hpcCB7fVxuICAgICAgRHluYW1pY1JlbGF0aW9uc2hpcC5mcm9tSlNPTihmaWVsZC5yZWxhdGlvbnNoaXApO1xuICAgICAgdGhpcy4kZmllbGRzW2tdID0ge1xuICAgICAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgICAgIHJlbGF0aW9uc2hpcDogRHluYW1pY1JlbGF0aW9uc2hpcCxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJGZpZWxkc1trXSA9IE9iamVjdC5hc3NpZ24oe30sIGZpZWxkKTtcbiAgICB9XG4gIH0pO1xufTtcblxuTW9kZWwudG9KU09OID0gZnVuY3Rpb24gdG9KU09OKCkge1xuICBjb25zdCByZXRWYWwgPSB7XG4gICAgJGlkOiB0aGlzLiRpZCxcbiAgICAkbmFtZTogdGhpcy4kbmFtZSxcbiAgICAkZmllbGRzOiB7fSxcbiAgfTtcbiAgY29uc3QgZmllbGROYW1lcyA9IE9iamVjdC5rZXlzKHRoaXMuJGZpZWxkcyk7XG4gIGZpZWxkTmFtZXMuZm9yRWFjaCgoaykgPT4ge1xuICAgIGlmICh0aGlzLiRmaWVsZHNba10udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICByZXRWYWwuJGZpZWxkc1trXSA9IHtcbiAgICAgICAgdHlwZTogJ2hhc01hbnknLFxuICAgICAgICByZWxhdGlvbnNoaXA6IHRoaXMuJGZpZWxkc1trXS5yZWxhdGlvbnNoaXAudG9KU09OKCksXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXRWYWwuJGZpZWxkc1trXSA9IHRoaXMuJGZpZWxkc1trXTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcmV0VmFsO1xufTtcblxuTW9kZWwuJHJlc3QgPSBmdW5jdGlvbiAkcmVzdChwbHVtcCwgb3B0cykge1xuICBjb25zdCByZXN0T3B0cyA9IE9iamVjdC5hc3NpZ24oXG4gICAge30sXG4gICAgb3B0cyxcbiAgICB7XG4gICAgICB1cmw6IGAvJHt0aGlzLiRuYW1lfS8ke29wdHMudXJsfWAsXG4gICAgfVxuICApO1xuICByZXR1cm4gcGx1bXAucmVzdFJlcXVlc3QocmVzdE9wdHMpO1xufTtcblxuTW9kZWwuYXNzaWduID0gZnVuY3Rpb24gYXNzaWduKG9wdHMpIHtcbiAgY29uc3Qgc3RhcnQgPSB7fTtcbiAgT2JqZWN0LmtleXModGhpcy4kZmllbGRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICBpZiAob3B0c1trZXldKSB7XG4gICAgICBzdGFydFtrZXldID0gb3B0c1trZXldO1xuICAgIH0gZWxzZSBpZiAodGhpcy4kZmllbGRzW2tleV0uZGVmYXVsdCkge1xuICAgICAgc3RhcnRba2V5XSA9IHRoaXMuJGZpZWxkc1trZXldLmRlZmF1bHQ7XG4gICAgfSBlbHNlIGlmICh0aGlzLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIHN0YXJ0W2tleV0gPSBbXTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhcnRba2V5XSA9IG51bGw7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHN0YXJ0O1xufTtcblxuTW9kZWwuJGlkID0gJ2lkJztcbk1vZGVsLiRuYW1lID0gJ0Jhc2UnO1xuTW9kZWwuJHNlbGYgPSAkc2VsZjtcbk1vZGVsLiRmaWVsZHMgPSB7XG4gIGlkOiB7XG4gICAgdHlwZTogJ251bWJlcicsXG4gIH0sXG59O1xuIl19
