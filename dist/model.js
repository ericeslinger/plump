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
        this[$unsubscribe] = this[$plump].subscribe(this.constructor.$name, this.$id, function (v) {
          console.log('subscription fired');
          console.log(JSON.stringify(v, null, 2));
          _this3.$$copyValuesFrom(v);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRzdG9yZSIsIlN5bWJvbCIsIiRwbHVtcCIsIiRsb2FkZWQiLCIkdW5zdWJzY3JpYmUiLCIkc3ViamVjdCIsIiRzZWxmIiwiTW9kZWwiLCJvcHRzIiwicGx1bXAiLCIkcmVsYXRpb25zaGlwcyIsIm5leHQiLCJPYmplY3QiLCJrZXlzIiwiY29uc3RydWN0b3IiLCIkZmllbGRzIiwiZm9yRWFjaCIsImtleSIsInR5cGUiLCJSZWwiLCJyZWxhdGlvbnNoaXAiLCJkZWZhdWx0IiwiJCRjb3B5VmFsdWVzRnJvbSIsImZpZWxkTmFtZSIsInVuZGVmaW5lZCIsImNvbmNhdCIsImFzc2lnbiIsIiQkZmlyZVVwZGF0ZSIsInN1YnNjcmliZSIsIiRuYW1lIiwiJGlkIiwidiIsImNvbnNvbGUiLCJsb2ciLCJKU09OIiwic3RyaW5naWZ5IiwibCIsIiQkaG9va1RvUGx1bXAiLCJyZXNvbHZlIiwidGhlbiIsImdldCIsIiRsaXN0IiwiJHNldCIsInUiLCJ1cGRhdGUiLCJzYXZlIiwidXBkYXRlZCIsImRlbGV0ZSIsInJlc3RPcHRzIiwidXJsIiwicmVzdFJlcXVlc3QiLCJpdGVtIiwiZXh0cmFzIiwiaWQiLCIkc2lkZXMiLCJvdGhlciIsImZpZWxkIiwiYWRkIiwicmVqZWN0IiwiRXJyb3IiLCJtb2RpZnlSZWxhdGlvbnNoaXAiLCJyZW1vdmUiLCJ1bnN1YnNjcmliZSIsImZyb21KU09OIiwianNvbiIsImsiLCJEeW5hbWljUmVsYXRpb25zaGlwIiwidG9KU09OIiwicmV0VmFsIiwiZmllbGROYW1lcyIsIiRyZXN0Iiwic3RhcnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7Ozs7O0FBQ0EsSUFBTUEsU0FBU0MsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNQyxTQUFTRCxPQUFPLFFBQVAsQ0FBZjtBQUNBLElBQU1FLFVBQVVGLE9BQU8sU0FBUCxDQUFoQjtBQUNBLElBQU1HLGVB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c0QsWUFBTXRELEdBQU4sSUFBYVQsS0FBS1MsR0FBTCxDQUFiO0FBQ0QsS0FGRCxNQUVPLElBQUksT0FBS0YsT0FBTCxDQUFhRSxHQUFiLEVBQWtCSSxPQUF0QixFQUErQjtBQUNwQ2tELFlBQU10RCxHQUFOLElBQWEsT0FBS0YsT0FBTCxDQUFhRSxHQUFiLEVBQWtCSSxPQUEvQjtBQUNELEtBRk0sTUFFQSxJQUFJLE9BQUtOLE9BQUwsQ0FBYUUsR0FBYixFQUFrQkMsSUFBbEIsS0FBMkIsU0FBL0IsRUFBMEM7QUFDL0NxRCxZQUFNdEQsR0FBTixJQUFhLEVBQWI7QUFDRCxLQUZNLE1BRUE7QUFDTHNELFlBQU10RCxHQUFOLElBQWEsSUFBYjtBQUNEO0FBQ0YsR0FWRDtBQVdBLFNBQU9zRCxLQUFQO0FBQ0QsQ0FkRDs7QUFnQkFoRSxNQUFNdUIsR0FBTixHQUFZLElBQVo7QUFDQXZCLE1BQU1zQixLQUFOLEdBQWMsTUFBZDtBQUNBdEIsTUFBTUQsS0FBTixHQUFjQSxLQUFkO0FBQ0FDLE1BQU1RLE9BQU4sR0FBZ0I7QUFDZHNDLE1BQUk7QUFDRm5DLFVBQU07QUFESjtBQURVLENBQWhCIiwiZmlsZSI6Im1vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IFJlbGF0aW9uc2hpcCB9IGZyb20gJy4vcmVsYXRpb25zaGlwJztcbmltcG9ydCBtZXJnZU9wdGlvbnMgZnJvbSAnbWVyZ2Utb3B0aW9ucyc7XG5pbXBvcnQgeyBCZWhhdmlvclN1YmplY3QgfSBmcm9tICdyeGpzL1J4JztcbmNvbnN0ICRzdG9yZSA9IFN5bWJvbCgnJHN0b3JlJyk7XG5jb25zdCAkcGx1bXAgPSBTeW1ib2woJyRwbHVtcCcpO1xuY29uc3QgJGxvYWRlZCA9IFN5bWJvbCgnJGxvYWRlZCcpO1xuY29uc3QgJHVuc3Vic2NyaWJlID0gU3ltYm9sKCckdW5zdWJzY3JpYmUnKTtcbmNvbnN0ICRzdWJqZWN0ID0gU3ltYm9sKCckc3ViamVjdCcpO1xuZXhwb3J0IGNvbnN0ICRzZWxmID0gU3ltYm9sKCckc2VsZicpO1xuXG4vLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIGVycm9yIGV2ZW50cyBvcmlnaW5hdGUgKHN0b3JhZ2Ugb3IgbW9kZWwpXG4vLyBhbmQgd2hvIGtlZXBzIGEgcm9sbC1iYWNrYWJsZSBkZWx0YVxuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzLCBwbHVtcCkge1xuICAgIHRoaXNbJHN0b3JlXSA9IHtcbiAgICAgIFskbG9hZGVkXTogZmFsc2UsXG4gICAgfTtcbiAgICB0aGlzLiRyZWxhdGlvbnNoaXBzID0ge307XG4gICAgdGhpc1skc3ViamVjdF0gPSBuZXcgQmVoYXZpb3JTdWJqZWN0KCk7XG4gICAgdGhpc1skc3ViamVjdF0ubmV4dCh7fSk7XG4gICAgdGhpc1skbG9hZGVkXSA9IHtcbiAgICAgIFskc2VsZl06IGZhbHNlLFxuICAgIH07XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgY29uc3QgUmVsID0gdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0ucmVsYXRpb25zaGlwO1xuICAgICAgICB0aGlzLiRyZWxhdGlvbnNoaXBzW2tleV0gPSBuZXcgUmVsKHRoaXMsIGtleSwgcGx1bXApO1xuICAgICAgICB0aGlzWyRzdG9yZV1ba2V5XSA9IFtdO1xuICAgICAgICB0aGlzWyRsb2FkZWRdW2tleV0gPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0uZGVmYXVsdCB8fCBudWxsO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbShvcHRzIHx8IHt9KTtcbiAgICBpZiAocGx1bXApIHtcbiAgICAgIHRoaXNbJHBsdW1wXSA9IHBsdW1wO1xuICAgIH1cbiAgfVxuXG4gIGdldCAkbmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci4kbmFtZTtcbiAgfVxuXG4gIGdldCAkaWQoKSB7XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JlXVt0aGlzLmNvbnN0cnVjdG9yLiRpZF07XG4gIH1cblxuICAkJGNvcHlWYWx1ZXNGcm9tKG9wdHMgPSB7fSkge1xuICAgIE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkcykuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICBpZiAob3B0c1tmaWVsZE5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gY29weSBmcm9tIG9wdHMgdG8gdGhlIGJlc3Qgb2Ygb3VyIGFiaWxpdHlcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnYXJyYXknKSB8fFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnaGFzTWFueScpXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gKG9wdHNbZmllbGROYW1lXSB8fCBbXSkuY29uY2F0KCk7XG4gICAgICAgICAgdGhpc1skbG9hZGVkXVtmaWVsZE5hbWVdID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0c1tmaWVsZE5hbWVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IG9wdHNbZmllbGROYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuJCRmaXJlVXBkYXRlKCk7XG4gIH1cblxuICAkJGhvb2tUb1BsdW1wKCkge1xuICAgIGlmICh0aGlzWyR1bnN1YnNjcmliZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skdW5zdWJzY3JpYmVdID0gdGhpc1skcGx1bXBdLnN1YnNjcmliZSh0aGlzLmNvbnN0cnVjdG9yLiRuYW1lLCB0aGlzLiRpZCwgKHYpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ3N1YnNjcmlwdGlvbiBmaXJlZCcpO1xuICAgICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh2LCBudWxsLCAyKSk7XG4gICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gICRzdWJzY3JpYmUobCkge1xuICAgIHRoaXMuJCRob29rVG9QbHVtcCgpO1xuICAgIHJldHVybiB0aGlzWyRzdWJqZWN0XS5zdWJzY3JpYmUobCk7XG4gIH1cblxuICAkJGZpcmVVcGRhdGUoKSB7XG4gICAgdGhpc1skc3ViamVjdF0ubmV4dCh0aGlzWyRzdG9yZV0pO1xuICB9XG5cbiAgLy8gVE9ETzogZG9uJ3QgZmV0Y2ggaWYgd2UgJGdldCgpIHNvbWV0aGluZyB0aGF0IHdlIGFscmVhZHkgaGF2ZVxuXG4gICRnZXQoa2V5ID0gJHNlbGYpIHtcbiAgICAvLyB0aHJlZSBjYXNlcy5cbiAgICAvLyBrZXkgPT09IHVuZGVmaW5lZCAtIGZldGNoIGFsbCwgdW5sZXNzICRsb2FkZWQsIGJ1dCByZXR1cm4gYWxsLlxuICAgIC8vIGZpZWxkc1trZXldID09PSAnaGFzTWFueScgLSBmZXRjaCBjaGlsZHJlbiAocGVyaGFwcyBtb3ZlIHRoaXMgZGVjaXNpb24gdG8gc3RvcmUpXG4gICAgLy8gb3RoZXJ3aXNlIC0gZmV0Y2ggYWxsLCB1bmxlc3MgJHN0b3JlW2tleV0sIHJldHVybiAkc3RvcmVba2V5XS5cblxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBpZiAoKGtleSA9PT0gJHNlbGYpIHx8ICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlICE9PSAnaGFzTWFueScpKSB7XG4gICAgICAgIGlmICh0aGlzWyRsb2FkZWRdWyRzZWxmXSA9PT0gZmFsc2UgJiYgdGhpc1skcGx1bXBdKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5nZXQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICgodGhpc1skbG9hZGVkXVtrZXldID09PSBmYWxzZSkgJiYgdGhpc1skcGx1bXBdKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbG9uZWx5LWlmXG4gICAgICAgICAgcmV0dXJuIHRoaXMuJHJlbGF0aW9uc2hpcHNba2V5XS4kbGlzdCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkudGhlbigodikgPT4ge1xuICAgICAgaWYgKHYgPT09IHRydWUpIHtcbiAgICAgICAgaWYgKGtleSA9PT0gJHNlbGYpIHtcbiAgICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgdGhpc1skc3RvcmVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skc3RvcmVdW2tleV07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodikge1xuICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odik7XG4gICAgICAgIGlmICgoa2V5ID09PSAkc2VsZikgfHwgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55JykpIHtcbiAgICAgICAgICB0aGlzWyRsb2FkZWRdW2tleV0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXkgPT09ICRzZWxmKSB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXNbJHN0b3JlXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHN0b3JlXVtrZXldO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICRzYXZlKCkge1xuICAgIHJldHVybiB0aGlzLiRzZXQoKTtcbiAgfVxuXG4gICRzZXQodSA9IHRoaXNbJHN0b3JlXSkge1xuICAgIGNvbnN0IHVwZGF0ZSA9IG1lcmdlT3B0aW9ucyh7fSwgdGhpc1skc3RvcmVdLCB1KTtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgICBkZWxldGUgdXBkYXRlW2tleV07XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHVwZGF0ZSk7IC8vIHRoaXMgaXMgdGhlIG9wdGltaXN0aWMgdXBkYXRlO1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0uc2F2ZSh0aGlzLmNvbnN0cnVjdG9yLCB1cGRhdGUpXG4gICAgLnRoZW4oKHVwZGF0ZWQpID0+IHtcbiAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh1cGRhdGVkKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0pO1xuICB9XG5cbiAgJGRlbGV0ZSgpIHtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLmRlbGV0ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCk7XG4gIH1cblxuICAkcmVzdChvcHRzKSB7XG4gICAgY29uc3QgcmVzdE9wdHMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICBvcHRzLFxuICAgICAge1xuICAgICAgICB1cmw6IGAvJHt0aGlzLmNvbnN0cnVjdG9yLiRuYW1lfS8ke3RoaXMuJGlkfS8ke29wdHMudXJsfWAsXG4gICAgICB9XG4gICAgKTtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLnJlc3RSZXF1ZXN0KHJlc3RPcHRzKTtcbiAgfVxuXG4gICRhZGQoa2V5LCBpdGVtLCBleHRyYXMpIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2UgaWYgKGl0ZW0uJGlkKSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW1bdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0ucmVsYXRpb25zaGlwLiRzaWRlc1trZXldLm90aGVyLmZpZWxkXTtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0uYWRkKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkLCBleHRyYXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSBhZGRlZCB0byBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRhZGQgZXhjZXB0IHRvIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG5cbiAgJG1vZGlmeVJlbGF0aW9uc2hpcChrZXksIGl0ZW0sIGV4dHJhcykge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICB0aGlzWyRzdG9yZV1ba2V5XSA9IFtdO1xuICAgICAgICB0aGlzWyRsb2FkZWRdW2tleV0gPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5tb2RpZnlSZWxhdGlvbnNoaXAodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaWQsIGV4dHJhcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkcmVtb3ZlKGtleSwgaXRlbSkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICB0aGlzWyRzdG9yZV1ba2V5XSA9IFtdO1xuICAgICAgICB0aGlzWyRsb2FkZWRdW2tleV0gPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5yZW1vdmUodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSAkcmVtb3ZlZCBmcm9tIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJHJlbW92ZSBleGNlcHQgZnJvbSBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICR0ZWFyZG93bigpIHtcbiAgICBpZiAodGhpc1skdW5zdWJzY3JpYmVdKSB7XG4gICAgICB0aGlzWyR1bnN1YnNjcmliZV0udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cbn1cblxuTW9kZWwuZnJvbUpTT04gPSBmdW5jdGlvbiBmcm9tSlNPTihqc29uKSB7XG4gIHRoaXMuJGlkID0ganNvbi4kaWQgfHwgJ2lkJztcbiAgdGhpcy4kbmFtZSA9IGpzb24uJG5hbWU7XG4gIHRoaXMuJGZpZWxkcyA9IHt9O1xuICBPYmplY3Qua2V5cyhqc29uLiRmaWVsZHMpLmZvckVhY2goKGspID0+IHtcbiAgICBjb25zdCBmaWVsZCA9IGpzb24uJGZpZWxkc1trXTtcbiAgICBpZiAoZmllbGQudHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBjbGFzcyBEeW5hbWljUmVsYXRpb25zaGlwIGV4dGVuZHMgUmVsYXRpb25zaGlwIHt9XG4gICAgICBEeW5hbWljUmVsYXRpb25zaGlwLmZyb21KU09OKGZpZWxkLnJlbGF0aW9uc2hpcCk7XG4gICAgICB0aGlzLiRmaWVsZHNba10gPSB7XG4gICAgICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICAgICAgcmVsYXRpb25zaGlwOiBEeW5hbWljUmVsYXRpb25zaGlwLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kZmllbGRzW2tdID0gT2JqZWN0LmFzc2lnbih7fSwgZmllbGQpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5Nb2RlbC50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04oKSB7XG4gIGNvbnN0IHJldFZhbCA9IHtcbiAgICAkaWQ6IHRoaXMuJGlkLFxuICAgICRuYW1lOiB0aGlzLiRuYW1lLFxuICAgICRmaWVsZHM6IHt9LFxuICB9O1xuICBjb25zdCBmaWVsZE5hbWVzID0gT2JqZWN0LmtleXModGhpcy4kZmllbGRzKTtcbiAgZmllbGROYW1lcy5mb3JFYWNoKChrKSA9PiB7XG4gICAgaWYgKHRoaXMuJGZpZWxkc1trXS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIHJldFZhbC4kZmllbGRzW2tdID0ge1xuICAgICAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgICAgIHJlbGF0aW9uc2hpcDogdGhpcy4kZmllbGRzW2tdLnJlbGF0aW9uc2hpcC50b0pTT04oKSxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldFZhbC4kZmllbGRzW2tdID0gdGhpcy4kZmllbGRzW2tdO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZXRWYWw7XG59O1xuXG5Nb2RlbC4kcmVzdCA9IGZ1bmN0aW9uICRyZXN0KHBsdW1wLCBvcHRzKSB7XG4gIGNvbnN0IHJlc3RPcHRzID0gT2JqZWN0LmFzc2lnbihcbiAgICB7fSxcbiAgICBvcHRzLFxuICAgIHtcbiAgICAgIHVybDogYC8ke3RoaXMuJG5hbWV9LyR7b3B0cy51cmx9YCxcbiAgICB9XG4gICk7XG4gIHJldHVybiBwbHVtcC5yZXN0UmVxdWVzdChyZXN0T3B0cyk7XG59O1xuXG5Nb2RlbC5hc3NpZ24gPSBmdW5jdGlvbiBhc3NpZ24ob3B0cykge1xuICBjb25zdCBzdGFydCA9IHt9O1xuICBPYmplY3Qua2V5cyh0aGlzLiRmaWVsZHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgIGlmIChvcHRzW2tleV0pIHtcbiAgICAgIHN0YXJ0W2tleV0gPSBvcHRzW2tleV07XG4gICAgfSBlbHNlIGlmICh0aGlzLiRmaWVsZHNba2V5XS5kZWZhdWx0KSB7XG4gICAgICBzdGFydFtrZXldID0gdGhpcy4kZmllbGRzW2tleV0uZGVmYXVsdDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgc3RhcnRba2V5XSA9IFtdO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGFydFtrZXldID0gbnVsbDtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gc3RhcnQ7XG59O1xuXG5Nb2RlbC4kaWQgPSAnaWQnO1xuTW9kZWwuJG5hbWUgPSAnQmFzZSc7XG5Nb2RlbC4kc2VsZiA9ICRzZWxmO1xuTW9kZWwuJGZpZWxkcyA9IHtcbiAgaWQ6IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbn07XG4iXX0=
