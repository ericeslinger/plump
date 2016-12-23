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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRzdG9yZSIsIlN5bWJvbCIsIiRwbHVtcCIsIiRsb2FkZWQiLCIkdW5zdWJzY3JpYmUiLCIkc3ViamVjdCIsIiRzZWxmIiwiTW9kZWwiLCJvcHRzIiwicGx1bXAiLCIkcmVsYXRpb25zaGlwcyIsIk9iamVjdCIsImtleXMiLCJjb25zdHJ1Y3RvciIsIiRmaWVsZHMiLCJmb3JFYWNoIiwia2V5IiwidHlwZSIsIlJlbCIsInJlbGF0aW9uc2hpcCIsImRlZmF1bHQiLCIkJGNvcHlWYWx1ZXNGcm9tIiwiJCRjb25uZWN0VG9QbHVtcCIsImZpZWxkTmFtZSIsInVuZGVmaW5lZCIsImNvbmNhdCIsImFzc2lnbiIsImwiLCJzdWJzY3JpYmUiLCJuZXh0IiwicmVzb2x2ZSIsInRoZW4iLCJnZXQiLCIkaWQiLCIkbGlzdCIsInYiLCIkc2V0IiwidSIsInVwZGF0ZSIsInNhdmUiLCJ1cGRhdGVkIiwiZGVsZXRlIiwicmVzdE9wdHMiLCJ1cmwiLCIkbmFtZSIsInJlc3RSZXF1ZXN0IiwiaXRlbSIsImV4dHJhcyIsImlkIiwiJHNpZGVzIiwib3RoZXIiLCJmaWVsZCIsImFkZCIsInJlamVjdCIsIkVycm9yIiwibW9kaWZ5UmVsYXRpb25zaGlwIiwicmVtb3ZlIiwidW5zdWJzY3JpYmUiLCJmcm9tSlNPTiIsImpzb24iLCJrIiwiRHluYW1pY1JlbGF0aW9uc2hpcCIsInRvSlNPTiIsInJldFZhbCIsImZpZWxkTmFtZXMiLCIkcmVzdCIsInN0YXJ0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7OztBQUNBLElBQU1BLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUMsU0FBU0QsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNRSxVQUFVRixPQUFPLFNBQVAsQ0FBaEI7QUFDQSxJQUFNRyxlQUFlSCxPQUFPLGNBQVAsQ0FBckI7QUFDQSxJQUFNSSxXQUFXSixPQUFPLFVBQVAs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LE1BQU1xQyxLQUFOLEdBQWMsTUFBZDtBQUNBckMsTUFBTUQsS0FBTixHQUFjQSxLQUFkO0FBQ0FDLE1BQU1PLE9BQU4sR0FBZ0I7QUFDZGtDLE1BQUk7QUFDRi9CLFVBQU07QUFESjtBQURVLENBQWhCIiwiZmlsZSI6Im1vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IFJlbGF0aW9uc2hpcCB9IGZyb20gJy4vcmVsYXRpb25zaGlwJztcbmltcG9ydCBtZXJnZU9wdGlvbnMgZnJvbSAnbWVyZ2Utb3B0aW9ucyc7XG5pbXBvcnQgeyBCZWhhdmlvclN1YmplY3QgfSBmcm9tICdyeGpzL1J4JztcbmNvbnN0ICRzdG9yZSA9IFN5bWJvbCgnJHN0b3JlJyk7XG5jb25zdCAkcGx1bXAgPSBTeW1ib2woJyRwbHVtcCcpO1xuY29uc3QgJGxvYWRlZCA9IFN5bWJvbCgnJGxvYWRlZCcpO1xuY29uc3QgJHVuc3Vic2NyaWJlID0gU3ltYm9sKCckdW5zdWJzY3JpYmUnKTtcbmNvbnN0ICRzdWJqZWN0ID0gU3ltYm9sKCckc3ViamVjdCcpO1xuZXhwb3J0IGNvbnN0ICRzZWxmID0gU3ltYm9sKCckc2VsZicpO1xuXG4vLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIGVycm9yIGV2ZW50cyBvcmlnaW5hdGUgKHN0b3JhZ2Ugb3IgbW9kZWwpXG4vLyBhbmQgd2hvIGtlZXBzIGEgcm9sbC1iYWNrYWJsZSBkZWx0YVxuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzLCBwbHVtcCkge1xuICAgIHRoaXNbJHN0b3JlXSA9IHtcbiAgICAgIFskbG9hZGVkXTogZmFsc2UsXG4gICAgfTtcbiAgICB0aGlzLiRyZWxhdGlvbnNoaXBzID0ge307XG4gICAgdGhpc1skc3ViamVjdF0gPSBuZXcgQmVoYXZpb3JTdWJqZWN0KCk7XG4gICAgdGhpc1skbG9hZGVkXSA9IHtcbiAgICAgIFskc2VsZl06IGZhbHNlLFxuICAgIH07XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgY29uc3QgUmVsID0gdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0ucmVsYXRpb25zaGlwO1xuICAgICAgICB0aGlzLiRyZWxhdGlvbnNoaXBzW2tleV0gPSBuZXcgUmVsKHRoaXMsIGtleSwgcGx1bXApO1xuICAgICAgICB0aGlzWyRzdG9yZV1ba2V5XSA9IFtdO1xuICAgICAgICB0aGlzWyRsb2FkZWRdW2tleV0gPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0uZGVmYXVsdCB8fCBudWxsO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbShvcHRzIHx8IHt9KTtcbiAgICBpZiAocGx1bXApIHtcbiAgICAgIHRoaXMuJCRjb25uZWN0VG9QbHVtcChwbHVtcCk7XG4gICAgfVxuICB9XG5cbiAgJCRjb25uZWN0VG9QbHVtcChwbHVtcCkge1xuICAgIHRoaXNbJHBsdW1wXSA9IHBsdW1wO1xuICAgIC8vIHRoaXNbJHVuc3Vic2NyaWJlXSA9IHBsdW1wLnN1YnNjcmliZSh0aGlzLmNvbnN0cnVjdG9yLiRuYW1lLCB0aGlzLiRpZCwgKHYpID0+IHtcbiAgICAvLyAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KTtcbiAgICAvLyB9KTtcbiAgfVxuXG4gIGdldCAkbmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci4kbmFtZTtcbiAgfVxuXG4gIGdldCAkaWQoKSB7XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JlXVt0aGlzLmNvbnN0cnVjdG9yLiRpZF07XG4gIH1cblxuICAkJGNvcHlWYWx1ZXNGcm9tKG9wdHMgPSB7fSkge1xuICAgIE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkcykuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICBpZiAob3B0c1tmaWVsZE5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gY29weSBmcm9tIG9wdHMgdG8gdGhlIGJlc3Qgb2Ygb3VyIGFiaWxpdHlcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnYXJyYXknKSB8fFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnaGFzTWFueScpXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gKG9wdHNbZmllbGROYW1lXSB8fCBbXSkuY29uY2F0KCk7XG4gICAgICAgICAgdGhpc1skbG9hZGVkXVtmaWVsZE5hbWVdID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0c1tmaWVsZE5hbWVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IG9wdHNbZmllbGROYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgJHN1YnNjcmliZShsKSB7XG4gICAgcmV0dXJuIHRoaXNbJHN1YmplY3RdLnN1YnNjcmliZShsKTtcbiAgfVxuXG4gICQkZmlyZVVwZGF0ZSgpIHtcbiAgICB0aGlzWyRzdWJqZWN0XS5uZXh0KHRoaXNbJHN0b3JlXSk7XG4gIH1cblxuICAvLyBUT0RPOiBkb24ndCBmZXRjaCBpZiB3ZSAkZ2V0KCkgc29tZXRoaW5nIHRoYXQgd2UgYWxyZWFkeSBoYXZlXG5cbiAgJGdldChrZXkgPSAkc2VsZikge1xuICAgIC8vIHRocmVlIGNhc2VzLlxuICAgIC8vIGtleSA9PT0gdW5kZWZpbmVkIC0gZmV0Y2ggYWxsLCB1bmxlc3MgJGxvYWRlZCwgYnV0IHJldHVybiBhbGwuXG4gICAgLy8gZmllbGRzW2tleV0gPT09ICdoYXNNYW55JyAtIGZldGNoIGNoaWxkcmVuIChwZXJoYXBzIG1vdmUgdGhpcyBkZWNpc2lvbiB0byBzdG9yZSlcbiAgICAvLyBvdGhlcndpc2UgLSBmZXRjaCBhbGwsIHVubGVzcyAkc3RvcmVba2V5XSwgcmV0dXJuICRzdG9yZVtrZXldLlxuXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmICgoa2V5ID09PSAkc2VsZikgfHwgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgIT09ICdoYXNNYW55JykpIHtcbiAgICAgICAgaWYgKHRoaXNbJGxvYWRlZF1bJHNlbGZdID09PSBmYWxzZSAmJiB0aGlzWyRwbHVtcF0pIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLmdldCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCh0aGlzWyRsb2FkZWRdW2tleV0gPT09IGZhbHNlKSAmJiB0aGlzWyRwbHVtcF0pIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1sb25lbHktaWZcbiAgICAgICAgICByZXR1cm4gdGhpcy4kcmVsYXRpb25zaGlwc1trZXldLiRsaXN0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KS50aGVuKCh2KSA9PiB7XG4gICAgICBpZiAodiA9PT0gdHJ1ZSkge1xuICAgICAgICBpZiAoa2V5ID09PSAkc2VsZikge1xuICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCB0aGlzWyRzdG9yZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzWyRzdG9yZV1ba2V5XTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh2KSB7XG4gICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KTtcbiAgICAgICAgaWYgKChrZXkgPT09ICRzZWxmKSB8fCAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSkge1xuICAgICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtleSA9PT0gJHNlbGYpIHtcbiAgICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgdGhpc1skc3RvcmVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skc3RvcmVdW2tleV07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgJHNhdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHNldCgpO1xuICB9XG5cbiAgJHNldCh1ID0gdGhpc1skc3RvcmVdKSB7XG4gICAgY29uc3QgdXBkYXRlID0gbWVyZ2VPcHRpb25zKHt9LCB0aGlzWyRzdG9yZV0sIHUpO1xuICAgIE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkcykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICAgIGRlbGV0ZSB1cGRhdGVba2V5XTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odXBkYXRlKTsgLy8gdGhpcyBpcyB0aGUgb3B0aW1pc3RpYyB1cGRhdGU7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5zYXZlKHRoaXMuY29uc3RydWN0b3IsIHVwZGF0ZSlcbiAgICAudGhlbigodXBkYXRlZCkgPT4ge1xuICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHVwZGF0ZWQpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSk7XG4gIH1cblxuICAkZGVsZXRlKCkge1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZGVsZXRlKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkKTtcbiAgfVxuXG4gICRyZXN0KG9wdHMpIHtcbiAgICBjb25zdCByZXN0T3B0cyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIG9wdHMsXG4gICAgICB7XG4gICAgICAgIHVybDogYC8ke3RoaXMuY29uc3RydWN0b3IuJG5hbWV9LyR7dGhpcy4kaWR9LyR7b3B0cy51cmx9YCxcbiAgICAgIH1cbiAgICApO1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0ucmVzdFJlcXVlc3QocmVzdE9wdHMpO1xuICB9XG5cbiAgJGFkZChrZXksIGl0ZW0sIGV4dHJhcykge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSBpZiAoaXRlbS4kaWQpIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbVt0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS5yZWxhdGlvbnNoaXAuJHNpZGVzW2tleV0ub3RoZXIuZmllbGRdO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5hZGQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaWQsIGV4dHJhcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkbW9kaWZ5UmVsYXRpb25zaGlwKGtleSwgaXRlbSwgZXh0cmFzKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gW107XG4gICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLm1vZGlmeVJlbGF0aW9uc2hpcCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpZCwgZXh0cmFzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gYWRkZWQgdG8gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICRyZW1vdmUoa2V5LCBpdGVtKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gW107XG4gICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLnJlbW92ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtICRyZW1vdmVkIGZyb20gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkcmVtb3ZlIGV4Y2VwdCBmcm9tIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG5cbiAgJHRlYXJkb3duKCkge1xuICAgIHRoaXNbJHVuc3Vic2NyaWJlXS51bnN1YnNjcmliZSgpO1xuICB9XG59XG5cbk1vZGVsLmZyb21KU09OID0gZnVuY3Rpb24gZnJvbUpTT04oanNvbikge1xuICB0aGlzLiRpZCA9IGpzb24uJGlkIHx8ICdpZCc7XG4gIHRoaXMuJG5hbWUgPSBqc29uLiRuYW1lO1xuICB0aGlzLiRmaWVsZHMgPSB7fTtcbiAgT2JqZWN0LmtleXMoanNvbi4kZmllbGRzKS5mb3JFYWNoKChrKSA9PiB7XG4gICAgY29uc3QgZmllbGQgPSBqc29uLiRmaWVsZHNba107XG4gICAgaWYgKGZpZWxkLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgY2xhc3MgRHluYW1pY1JlbGF0aW9uc2hpcCBleHRlbmRzIFJlbGF0aW9uc2hpcCB7fVxuICAgICAgRHluYW1pY1JlbGF0aW9uc2hpcC5mcm9tSlNPTihmaWVsZC5yZWxhdGlvbnNoaXApO1xuICAgICAgdGhpcy4kZmllbGRzW2tdID0ge1xuICAgICAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgICAgIHJlbGF0aW9uc2hpcDogRHluYW1pY1JlbGF0aW9uc2hpcCxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJGZpZWxkc1trXSA9IE9iamVjdC5hc3NpZ24oe30sIGZpZWxkKTtcbiAgICB9XG4gIH0pO1xufTtcblxuTW9kZWwudG9KU09OID0gZnVuY3Rpb24gdG9KU09OKCkge1xuICBjb25zdCByZXRWYWwgPSB7XG4gICAgJGlkOiB0aGlzLiRpZCxcbiAgICAkbmFtZTogdGhpcy4kbmFtZSxcbiAgICAkZmllbGRzOiB7fSxcbiAgfTtcbiAgY29uc3QgZmllbGROYW1lcyA9IE9iamVjdC5rZXlzKHRoaXMuJGZpZWxkcyk7XG4gIGZpZWxkTmFtZXMuZm9yRWFjaCgoaykgPT4ge1xuICAgIGlmICh0aGlzLiRmaWVsZHNba10udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICByZXRWYWwuJGZpZWxkc1trXSA9IHtcbiAgICAgICAgdHlwZTogJ2hhc01hbnknLFxuICAgICAgICByZWxhdGlvbnNoaXA6IHRoaXMuJGZpZWxkc1trXS5yZWxhdGlvbnNoaXAudG9KU09OKCksXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXRWYWwuJGZpZWxkc1trXSA9IHRoaXMuJGZpZWxkc1trXTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcmV0VmFsO1xufTtcblxuTW9kZWwuJHJlc3QgPSBmdW5jdGlvbiAkcmVzdChwbHVtcCwgb3B0cykge1xuICBjb25zdCByZXN0T3B0cyA9IE9iamVjdC5hc3NpZ24oXG4gICAge30sXG4gICAgb3B0cyxcbiAgICB7XG4gICAgICB1cmw6IGAvJHt0aGlzLiRuYW1lfS8ke29wdHMudXJsfWAsXG4gICAgfVxuICApO1xuICByZXR1cm4gcGx1bXAucmVzdFJlcXVlc3QocmVzdE9wdHMpO1xufTtcblxuTW9kZWwuYXNzaWduID0gZnVuY3Rpb24gYXNzaWduKG9wdHMpIHtcbiAgY29uc3Qgc3RhcnQgPSB7fTtcbiAgT2JqZWN0LmtleXModGhpcy4kZmllbGRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICBpZiAob3B0c1trZXldKSB7XG4gICAgICBzdGFydFtrZXldID0gb3B0c1trZXldO1xuICAgIH0gZWxzZSBpZiAodGhpcy4kZmllbGRzW2tleV0uZGVmYXVsdCkge1xuICAgICAgc3RhcnRba2V5XSA9IHRoaXMuJGZpZWxkc1trZXldLmRlZmF1bHQ7XG4gICAgfSBlbHNlIGlmICh0aGlzLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIHN0YXJ0W2tleV0gPSBbXTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhcnRba2V5XSA9IG51bGw7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHN0YXJ0O1xufTtcblxuTW9kZWwuJGlkID0gJ2lkJztcbk1vZGVsLiRuYW1lID0gJ0Jhc2UnO1xuTW9kZWwuJHNlbGYgPSAkc2VsZjtcbk1vZGVsLiRmaWVsZHMgPSB7XG4gIGlkOiB7XG4gICAgdHlwZTogJ251bWJlcicsXG4gIH0sXG59O1xuIl19
