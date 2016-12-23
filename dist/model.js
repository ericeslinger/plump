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
      this.$$connectToPlump(plump);
    }
  }

  _createClass(Model, [{
    key: '$$connectToPlump',
    value: function $$connectToPlump(plump) {
      this[$plump] = plump;
      // this[$unsubscribe] = plump.subscribe(this.constructor.$name, this.$id, (v) => {
      //   this.$$copyValuesFrom(v);
      // });
    }
  }, {
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
    }
  }, {
    key: '$subscribe',
    value: function $subscribe(l) {
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
      var _this3 = this;

      var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : $self;

      // three cases.
      // key === undefined - fetch all, unless $loaded, but return all.
      // fields[key] === 'hasMany' - fetch children (perhaps move this decision to store)
      // otherwise - fetch all, unless $store[key], return $store[key].

      return _bluebird2.default.resolve().then(function () {
        if (key === $self || _this3.constructor.$fields[key].type !== 'hasMany') {
          if (_this3[$loaded][$self] === false && _this3[$plump]) {
            return _this3[$plump].get(_this3.constructor, _this3.$id, key);
          } else {
            return true;
          }
        } else {
          if (_this3[$loaded][key] === false && _this3[$plump]) {
            // eslint-disable-line no-lonely-if
            return _this3.$relationships[key].$list();
          } else {
            return true;
          }
        }
      }).then(function (v) {
        if (v === true) {
          if (key === $self) {
            return Object.assign({}, _this3[$store]);
          } else {
            return _this3[$store][key];
          }
        } else if (v) {
          _this3.$$copyValuesFrom(v);
          if (key === $self || _this3.constructor.$fields[key].type === 'hasMany') {
            _this3[$loaded][key] = true;
          }
          if (key === $self) {
            return Object.assign({}, _this3[$store]);
          } else {
            return _this3[$store][key];
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
      var _this4 = this;

      var u = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this[$store];

      var update = (0, _mergeOptions2.default)({}, this[$store], u);
      Object.keys(this.constructor.$fields).forEach(function (key) {
        if (_this4.constructor.$fields[key].type === 'hasMany') {
          delete update[key];
        }
      });
      this.$$copyValuesFrom(update); // this is the optimistic update;
      return this[$plump].save(this.constructor, update).then(function (updated) {
        _this4.$$copyValuesFrom(updated);
        return _this4;
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
      this[$unsubscribe].unsubscribe();
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
  var _this6 = this;

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
      _this6.$fields[k] = {
        type: 'hasMany',
        relationship: DynamicRelationship
      };
    } else {
      _this6.$fields[k] = Object.assign({}, field);
    }
  });
};

Model.toJSON = function toJSON() {
  var _this7 = this;

  var retVal = {
    $id: this.$id,
    $name: this.$name,
    $fields: {}
  };
  var fieldNames = Object.keys(this.$fields);
  fieldNames.forEach(function (k) {
    if (_this7.$fields[k].type === 'hasMany') {
      retVal.$fields[k] = {
        type: 'hasMany',
        relationship: _this7.$fields[k].relationship.toJSON()
      };
    } else {
      retVal.$fields[k] = _this7.$fields[k];
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
  var _this8 = this;

  var start = {};
  Object.keys(this.$fields).forEach(function (key) {
    if (opts[key]) {
      start[key] = opts[key];
    } else if (_this8.$fields[key].default) {
      start[key] = _this8.$fields[key].default;
    } else if (_this8.$fields[key].type === 'hasMany') {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRzdG9yZSIsIlN5bWJvbCIsIiRwbHVtcCIsIiRsb2FkZWQiLCIkdW5zdWJzY3JpYmUiLCIkc3ViamVjdCIsIiRzZWxmIiwiTW9kZWwiLCJvcHRzIiwicGx1bXAiLCIkcmVsYXRpb25zaGlwcyIsIm5leHQiLCJPYmplY3QiLCJrZXlzIiwiY29uc3RydWN0b3IiLCIkZmllbGRzIiwiZm9yRWFjaCIsImtleSIsInR5cGUiLCJSZWwiLCJyZWxhdGlvbnNoaXAiLCJkZWZhdWx0IiwiJCRjb3B5VmFsdWVzRnJvbSIsIiQkY29ubmVjdFRvUGx1bXAiLCJmaWVsZE5hbWUiLCJ1bmRlZmluZWQiLCJjb25jYXQiLCJhc3NpZ24iLCJsIiwic3Vic2NyaWJlIiwicmVzb2x2ZSIsInRoZW4iLCJnZXQiLCIkaWQiLCIkbGlzdCIsInYiLCIkc2V0IiwidSIsInVwZGF0ZSIsInNhdmUiLCJ1cGRhdGVkIiwiZGVsZXRlIiwicmVzdE9wdHMiLCJ1cmwiLCIkbmFtZSIsInJlc3RSZXF1ZXN0IiwiaXRlbSIsImV4dHJhcyIsImlkIiwiJHNpZGVzIiwib3RoZXIiLCJmaWVsZCIsImFkZCIsInJlamVjdCIsIkVycm9yIiwibW9kaWZ5UmVsYXRpb25zaGlwIiwicmVtb3ZlIiwidW5zdWJzY3JpYmUiLCJmcm9tSlNPTiIsImpzb24iLCJrIiwiRHluYW1pY1JlbGF0aW9uc2hpcCIsInRvSlNPTiIsInJldFZhbCIsImZpZWxkTmFtZXMiLCIkcmVzdCIsInN0YXJ0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7OztBQUNBLElBQU1BLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUMsU0FBU0QsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNRSxVQUFVRixPQUFPLFNBQVAsQ0FBaEI7QUFDQSxJQUFNRyxlQUFlSCxPQUFPLGNBQVAsQ0FBckI7QUFDQSxJQUFNSSxXQUFXSixPQUFPLFVBQVAs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RCxDQWREOztBQWdCQTNELE1BQU0wQixHQUFOLEdBQVksSUFBWjtBQUNBMUIsTUFBTXFDLEtBQU4sR0FBYyxNQUFkO0FBQ0FyQyxNQUFNRCxLQUFOLEdBQWNBLEtBQWQ7QUFDQUMsTUFBTVEsT0FBTixHQUFnQjtBQUNkaUMsTUFBSTtBQUNGOUIsVUFBTTtBQURKO0FBRFUsQ0FBaEIiLCJmaWxlIjoibW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHsgUmVsYXRpb25zaGlwIH0gZnJvbSAnLi9yZWxhdGlvbnNoaXAnO1xuaW1wb3J0IG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcbmltcG9ydCB7IEJlaGF2aW9yU3ViamVjdCB9IGZyb20gJ3J4anMvUngnO1xuY29uc3QgJHN0b3JlID0gU3ltYm9sKCckc3RvcmUnKTtcbmNvbnN0ICRwbHVtcCA9IFN5bWJvbCgnJHBsdW1wJyk7XG5jb25zdCAkbG9hZGVkID0gU3ltYm9sKCckbG9hZGVkJyk7XG5jb25zdCAkdW5zdWJzY3JpYmUgPSBTeW1ib2woJyR1bnN1YnNjcmliZScpO1xuY29uc3QgJHN1YmplY3QgPSBTeW1ib2woJyRzdWJqZWN0Jyk7XG5leHBvcnQgY29uc3QgJHNlbGYgPSBTeW1ib2woJyRzZWxmJyk7XG5cbi8vIFRPRE86IGZpZ3VyZSBvdXQgd2hlcmUgZXJyb3IgZXZlbnRzIG9yaWdpbmF0ZSAoc3RvcmFnZSBvciBtb2RlbClcbi8vIGFuZCB3aG8ga2VlcHMgYSByb2xsLWJhY2thYmxlIGRlbHRhXG5cbmV4cG9ydCBjbGFzcyBNb2RlbCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMsIHBsdW1wKSB7XG4gICAgdGhpc1skc3RvcmVdID0ge1xuICAgICAgWyRsb2FkZWRdOiBmYWxzZSxcbiAgICB9O1xuICAgIHRoaXMuJHJlbGF0aW9uc2hpcHMgPSB7fTtcbiAgICB0aGlzWyRzdWJqZWN0XSA9IG5ldyBCZWhhdmlvclN1YmplY3QoKTtcbiAgICB0aGlzWyRzdWJqZWN0XS5uZXh0KHt9KTtcbiAgICB0aGlzWyRsb2FkZWRdID0ge1xuICAgICAgWyRzZWxmXTogZmFsc2UsXG4gICAgfTtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgICBjb25zdCBSZWwgPSB0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS5yZWxhdGlvbnNoaXA7XG4gICAgICAgIHRoaXMuJHJlbGF0aW9uc2hpcHNba2V5XSA9IG5ldyBSZWwodGhpcywga2V5LCBwbHVtcCk7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gW107XG4gICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpc1skc3RvcmVdW2tleV0gPSB0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS5kZWZhdWx0IHx8IG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKG9wdHMgfHwge30pO1xuICAgIGlmIChwbHVtcCkge1xuICAgICAgdGhpcy4kJGNvbm5lY3RUb1BsdW1wKHBsdW1wKTtcbiAgICB9XG4gIH1cblxuICAkJGNvbm5lY3RUb1BsdW1wKHBsdW1wKSB7XG4gICAgdGhpc1skcGx1bXBdID0gcGx1bXA7XG4gICAgLy8gdGhpc1skdW5zdWJzY3JpYmVdID0gcGx1bXAuc3Vic2NyaWJlKHRoaXMuY29uc3RydWN0b3IuJG5hbWUsIHRoaXMuJGlkLCAodikgPT4ge1xuICAgIC8vICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHYpO1xuICAgIC8vIH0pO1xuICB9XG5cbiAgZ2V0ICRuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLiRuYW1lO1xuICB9XG5cbiAgZ2V0ICRpZCgpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmVdW3RoaXMuY29uc3RydWN0b3IuJGlkXTtcbiAgfVxuXG4gICQkY29weVZhbHVlc0Zyb20ob3B0cyA9IHt9KSB7XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChmaWVsZE5hbWUpID0+IHtcbiAgICAgIGlmIChvcHRzW2ZpZWxkTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBjb3B5IGZyb20gb3B0cyB0byB0aGUgYmVzdCBvZiBvdXIgYWJpbGl0eVxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdhcnJheScpIHx8XG4gICAgICAgICAgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdoYXNNYW55JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSAob3B0c1tmaWVsZE5hbWVdIHx8IFtdKS5jb25jYXQoKTtcbiAgICAgICAgICB0aGlzWyRsb2FkZWRdW2ZpZWxkTmFtZV0gPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBPYmplY3QuYXNzaWduKHt9LCBvcHRzW2ZpZWxkTmFtZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gb3B0c1tmaWVsZE5hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAkc3Vic2NyaWJlKGwpIHtcbiAgICByZXR1cm4gdGhpc1skc3ViamVjdF0uc3Vic2NyaWJlKGwpO1xuICB9XG5cbiAgJCRmaXJlVXBkYXRlKCkge1xuICAgIHRoaXNbJHN1YmplY3RdLm5leHQodGhpc1skc3RvcmVdKTtcbiAgfVxuXG4gIC8vIFRPRE86IGRvbid0IGZldGNoIGlmIHdlICRnZXQoKSBzb21ldGhpbmcgdGhhdCB3ZSBhbHJlYWR5IGhhdmVcblxuICAkZ2V0KGtleSA9ICRzZWxmKSB7XG4gICAgLy8gdGhyZWUgY2FzZXMuXG4gICAgLy8ga2V5ID09PSB1bmRlZmluZWQgLSBmZXRjaCBhbGwsIHVubGVzcyAkbG9hZGVkLCBidXQgcmV0dXJuIGFsbC5cbiAgICAvLyBmaWVsZHNba2V5XSA9PT0gJ2hhc01hbnknIC0gZmV0Y2ggY2hpbGRyZW4gKHBlcmhhcHMgbW92ZSB0aGlzIGRlY2lzaW9uIHRvIHN0b3JlKVxuICAgIC8vIG90aGVyd2lzZSAtIGZldGNoIGFsbCwgdW5sZXNzICRzdG9yZVtrZXldLCByZXR1cm4gJHN0b3JlW2tleV0uXG5cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKChrZXkgPT09ICRzZWxmKSB8fCAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSAhPT0gJ2hhc01hbnknKSkge1xuICAgICAgICBpZiAodGhpc1skbG9hZGVkXVskc2VsZl0gPT09IGZhbHNlICYmIHRoaXNbJHBsdW1wXSkge1xuICAgICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZ2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoKHRoaXNbJGxvYWRlZF1ba2V5XSA9PT0gZmFsc2UpICYmIHRoaXNbJHBsdW1wXSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWxvbmVseS1pZlxuICAgICAgICAgIHJldHVybiB0aGlzLiRyZWxhdGlvbnNoaXBzW2tleV0uJGxpc3QoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLnRoZW4oKHYpID0+IHtcbiAgICAgIGlmICh2ID09PSB0cnVlKSB7XG4gICAgICAgIGlmIChrZXkgPT09ICRzZWxmKSB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXNbJHN0b3JlXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHN0b3JlXVtrZXldO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHYpIHtcbiAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHYpO1xuICAgICAgICBpZiAoKGtleSA9PT0gJHNlbGYpIHx8ICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpKSB7XG4gICAgICAgICAgdGhpc1skbG9hZGVkXVtrZXldID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5ID09PSAkc2VsZikge1xuICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCB0aGlzWyRzdG9yZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzWyRzdG9yZV1ba2V5XTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAkc2F2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy4kc2V0KCk7XG4gIH1cblxuICAkc2V0KHUgPSB0aGlzWyRzdG9yZV0pIHtcbiAgICBjb25zdCB1cGRhdGUgPSBtZXJnZU9wdGlvbnMoe30sIHRoaXNbJHN0b3JlXSwgdSk7XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgZGVsZXRlIHVwZGF0ZVtrZXldO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh1cGRhdGUpOyAvLyB0aGlzIGlzIHRoZSBvcHRpbWlzdGljIHVwZGF0ZTtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLnNhdmUodGhpcy5jb25zdHJ1Y3RvciwgdXBkYXRlKVxuICAgIC50aGVuKCh1cGRhdGVkKSA9PiB7XG4gICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odXBkYXRlZCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9KTtcbiAgfVxuXG4gICRkZWxldGUoKSB7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5kZWxldGUodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQpO1xuICB9XG5cbiAgJHJlc3Qob3B0cykge1xuICAgIGNvbnN0IHJlc3RPcHRzID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAgb3B0cyxcbiAgICAgIHtcbiAgICAgICAgdXJsOiBgLyR7dGhpcy5jb25zdHJ1Y3Rvci4kbmFtZX0vJHt0aGlzLiRpZH0vJHtvcHRzLnVybH1gLFxuICAgICAgfVxuICAgICk7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5yZXN0UmVxdWVzdChyZXN0T3B0cyk7XG4gIH1cblxuICAkYWRkKGtleSwgaXRlbSwgZXh0cmFzKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIGlmIChpdGVtLiRpZCkge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtW3RoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnJlbGF0aW9uc2hpcC4kc2lkZXNba2V5XS5vdGhlci5maWVsZF07XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLmFkZCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpZCwgZXh0cmFzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gYWRkZWQgdG8gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICRtb2RpZnlSZWxhdGlvbnNoaXAoa2V5LCBpdGVtLCBleHRyYXMpIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgdGhpc1skc3RvcmVdW2tleV0gPSBbXTtcbiAgICAgICAgdGhpc1skbG9hZGVkXVtrZXldID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0ubW9kaWZ5UmVsYXRpb25zaGlwKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkLCBleHRyYXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSBhZGRlZCB0byBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRhZGQgZXhjZXB0IHRvIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG5cbiAgJHJlbW92ZShrZXksIGl0ZW0pIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgdGhpc1skc3RvcmVdW2tleV0gPSBbXTtcbiAgICAgICAgdGhpc1skbG9hZGVkXVtrZXldID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0ucmVtb3ZlKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gJHJlbW92ZWQgZnJvbSBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRyZW1vdmUgZXhjZXB0IGZyb20gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkdGVhcmRvd24oKSB7XG4gICAgdGhpc1skdW5zdWJzY3JpYmVdLnVuc3Vic2NyaWJlKCk7XG4gIH1cbn1cblxuTW9kZWwuZnJvbUpTT04gPSBmdW5jdGlvbiBmcm9tSlNPTihqc29uKSB7XG4gIHRoaXMuJGlkID0ganNvbi4kaWQgfHwgJ2lkJztcbiAgdGhpcy4kbmFtZSA9IGpzb24uJG5hbWU7XG4gIHRoaXMuJGZpZWxkcyA9IHt9O1xuICBPYmplY3Qua2V5cyhqc29uLiRmaWVsZHMpLmZvckVhY2goKGspID0+IHtcbiAgICBjb25zdCBmaWVsZCA9IGpzb24uJGZpZWxkc1trXTtcbiAgICBpZiAoZmllbGQudHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBjbGFzcyBEeW5hbWljUmVsYXRpb25zaGlwIGV4dGVuZHMgUmVsYXRpb25zaGlwIHt9XG4gICAgICBEeW5hbWljUmVsYXRpb25zaGlwLmZyb21KU09OKGZpZWxkLnJlbGF0aW9uc2hpcCk7XG4gICAgICB0aGlzLiRmaWVsZHNba10gPSB7XG4gICAgICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICAgICAgcmVsYXRpb25zaGlwOiBEeW5hbWljUmVsYXRpb25zaGlwLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kZmllbGRzW2tdID0gT2JqZWN0LmFzc2lnbih7fSwgZmllbGQpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5Nb2RlbC50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04oKSB7XG4gIGNvbnN0IHJldFZhbCA9IHtcbiAgICAkaWQ6IHRoaXMuJGlkLFxuICAgICRuYW1lOiB0aGlzLiRuYW1lLFxuICAgICRmaWVsZHM6IHt9LFxuICB9O1xuICBjb25zdCBmaWVsZE5hbWVzID0gT2JqZWN0LmtleXModGhpcy4kZmllbGRzKTtcbiAgZmllbGROYW1lcy5mb3JFYWNoKChrKSA9PiB7XG4gICAgaWYgKHRoaXMuJGZpZWxkc1trXS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIHJldFZhbC4kZmllbGRzW2tdID0ge1xuICAgICAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgICAgIHJlbGF0aW9uc2hpcDogdGhpcy4kZmllbGRzW2tdLnJlbGF0aW9uc2hpcC50b0pTT04oKSxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldFZhbC4kZmllbGRzW2tdID0gdGhpcy4kZmllbGRzW2tdO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZXRWYWw7XG59O1xuXG5Nb2RlbC4kcmVzdCA9IGZ1bmN0aW9uICRyZXN0KHBsdW1wLCBvcHRzKSB7XG4gIGNvbnN0IHJlc3RPcHRzID0gT2JqZWN0LmFzc2lnbihcbiAgICB7fSxcbiAgICBvcHRzLFxuICAgIHtcbiAgICAgIHVybDogYC8ke3RoaXMuJG5hbWV9LyR7b3B0cy51cmx9YCxcbiAgICB9XG4gICk7XG4gIHJldHVybiBwbHVtcC5yZXN0UmVxdWVzdChyZXN0T3B0cyk7XG59O1xuXG5Nb2RlbC5hc3NpZ24gPSBmdW5jdGlvbiBhc3NpZ24ob3B0cykge1xuICBjb25zdCBzdGFydCA9IHt9O1xuICBPYmplY3Qua2V5cyh0aGlzLiRmaWVsZHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgIGlmIChvcHRzW2tleV0pIHtcbiAgICAgIHN0YXJ0W2tleV0gPSBvcHRzW2tleV07XG4gICAgfSBlbHNlIGlmICh0aGlzLiRmaWVsZHNba2V5XS5kZWZhdWx0KSB7XG4gICAgICBzdGFydFtrZXldID0gdGhpcy4kZmllbGRzW2tleV0uZGVmYXVsdDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgc3RhcnRba2V5XSA9IFtdO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGFydFtrZXldID0gbnVsbDtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gc3RhcnQ7XG59O1xuXG5Nb2RlbC4kaWQgPSAnaWQnO1xuTW9kZWwuJG5hbWUgPSAnQmFzZSc7XG5Nb2RlbC4kc2VsZiA9ICRzZWxmO1xuTW9kZWwuJGZpZWxkcyA9IHtcbiAgaWQ6IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbn07XG4iXX0=
