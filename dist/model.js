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
      var _this4 = this;

      this.$$hookToPlump();
      if (this[$loaded][$self] === false) {
        this[$plump].streamGet(this.constructor, this.$id, $self).subscribe(function (v) {
          return _this4.$$copyValuesFrom(v);
        });
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
      var _this5 = this;

      var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : $self;

      // three cases.
      // key === undefined - fetch all, unless $loaded, but return all.
      // fields[key] === 'hasMany' - fetch children (perhaps move this decision to store)
      // otherwise - fetch all, unless $store[key], return $store[key].

      return _bluebird2.default.resolve().then(function () {
        if (key === $self || _this5.constructor.$fields[key].type !== 'hasMany') {
          if (_this5[$loaded][$self] === false && _this5[$plump]) {
            return _this5[$plump].get(_this5.constructor, _this5.$id, key);
          } else {
            return true;
          }
        } else {
          if (_this5[$loaded][key] === false && _this5[$plump]) {
            // eslint-disable-line no-lonely-if
            return _this5.$relationships[key].$list();
          } else {
            return true;
          }
        }
      }).then(function (v) {
        if (v === true) {
          if (key === $self) {
            return Object.assign({}, _this5[$store]);
          } else {
            return _this5[$store][key];
          }
        } else if (v) {
          _this5.$$copyValuesFrom(v);
          if (key === $self || _this5.constructor.$fields[key].type === 'hasMany') {
            _this5[$loaded][key] = true;
          }
          if (key === $self) {
            return Object.assign({}, _this5[$store]);
          } else {
            return _this5[$store][key];
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
      var _this6 = this;

      var u = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this[$store];

      var update = (0, _mergeOptions2.default)({}, this[$store], u);
      Object.keys(this.constructor.$fields).forEach(function (key) {
        if (_this6.constructor.$fields[key].type === 'hasMany') {
          delete update[key];
        }
      });
      // this.$$copyValuesFrom(update); // this is the optimistic update;
      return this[$plump].save(this.constructor, update).then(function (updated) {
        _this6.$$copyValuesFrom(updated);
        return _this6;
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
  var _this8 = this;

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
      _this8.$fields[k] = {
        type: 'hasMany',
        relationship: DynamicRelationship
      };
    } else {
      _this8.$fields[k] = Object.assign({}, field);
    }
  });
};

Model.toJSON = function toJSON() {
  var _this9 = this;

  var retVal = {
    $id: this.$id,
    $name: this.$name,
    $fields: {}
  };
  var fieldNames = Object.keys(this.$fields);
  fieldNames.forEach(function (k) {
    if (_this9.$fields[k].type === 'hasMany') {
      retVal.$fields[k] = {
        type: 'hasMany',
        relationship: _this9.$fields[k].relationship.toJSON()
      };
    } else {
      retVal.$fields[k] = _this9.$fields[k];
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
  var _this10 = this;

  var start = {};
  Object.keys(this.$fields).forEach(function (key) {
    if (opts[key]) {
      start[key] = opts[key];
    } else if (_this10.$fields[key].default) {
      start[key] = _this10.$fields[key].default;
    } else if (_this10.$fields[key].type === 'hasMany') {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRzdG9yZSIsIlN5bWJvbCIsIiRwbHVtcCIsIiRsb2FkZWQiLCIkdW5zdWJzY3JpYmUiLCIkc3ViamVjdCIsIiRzZWxmIiwiTW9kZWwiLCJvcHRzIiwicGx1bXAiLCIkcmVsYXRpb25zaGlwcyIsIm5leHQiLCJPYmplY3QiLCJrZXlzIiwiY29uc3RydWN0b3IiLCIkZmllbGRzIiwiZm9yRWFjaCIsImtleSIsInR5cGUiLCJSZWwiLCJyZWxhdGlvbnNoaXAiLCJkZWZhdWx0IiwiJCRjb3B5VmFsdWVzRnJvbSIsImZpZWxkTmFtZSIsInVuZGVmaW5lZCIsImNvbmNhdCIsImFzc2lnbiIsIiQkZmlyZVVwZGF0ZSIsInN1YnNjcmliZSIsIiRuYW1lIiwiJGlkIiwiZmllbGQiLCJ2YWx1ZSIsImwiLCIkJGhvb2tUb1BsdW1wIiwic3RyZWFtR2V0IiwidiIsInJlc29sdmUiLCJ0aGVuIiwiZ2V0IiwiJGxpc3QiLCIkc2V0IiwidSIsInVwZGF0ZSIsInNhdmUiLCJ1cGRhdGVkIiwiZGVsZXRlIiwicmVzdE9wdHMiLCJ1cmwiLCJyZXN0UmVxdWVzdCIsIml0ZW0iLCJleHRyYXMiLCJpZCIsIiRzaWRlcyIsIm90aGVyIiwiYWRkIiwicmVqZWN0IiwiRXJyb3IiLCJtb2RpZnlSZWxhdGlvbnNoaXAiLCJyZW1vdmUiLCJ1bnN1YnNjcmliZSIsImZyb21KU09OIiwianNvbiIsImsiLCJEeW5hbWljUmVsYXRpb25zaGlwIiwidG9KU09OIiwicmV0VmFsIiwiZmllbGROYW1lcyIsIiRyZXN0Iiwic3RhcnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7Ozs7O0FBQ0EsSUFBTUEsU0FBU0MsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNQyxTQUFTRCxPQUFPLFFBQVAsQ0FBZjtBQUNBLElBQU1FLFVBQVVGLE9BQU8sU0FBUCxDQUFoQjtBQUNBLElBQU1HLGVBQWVILE9BQU8sY0FBUCxD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QSxTQUFPdkMsTUFBTXdDLFdBQU4sQ0FBa0JGLFFBQWxCLENBQVA7QUFDRCxDQVREOztBQVdBeEMsTUFBTW1CLE1BQU4sR0FBZSxTQUFTQSxNQUFULENBQWdCbEIsSUFBaEIsRUFBc0I7QUFBQTs7QUFDbkMsTUFBTTZELFFBQVEsRUFBZDtBQUNBekQsU0FBT0MsSUFBUCxDQUFZLEtBQUtFLE9BQWpCLEVBQTBCQyxPQUExQixDQUFrQyxVQUFDQyxHQUFELEVBQVM7QUFDekMsUUFBSVQsS0FBS1MsR0FBTCxDQUFKLEVBQWU7QUFDYm9ELFlBQU1wRCxHQUFOLElBQWFULEtBQUtTLEdBQUwsQ0FBYjtBQUNELEtBRkQsTUFFTyxJQUFJLFFBQUtGLE9BQUwsQ0FBYUUsR0FBYixFQUFrQkksT0FBdEIsRUFBK0I7QUFDcENnRCxZQUFNcEQsR0FBTixJQUFhLFFBQUtGLE9BQUwsQ0FBYUUsR0FBYixFQUFrQkksT0FBL0I7QUFDRCxLQUZNLE1BRUEsSUFBSSxRQUFLTixPQUFMLENBQWFFLEdBQWIsRUFBa0JDLElBQWxCLEtBQTJCLFNBQS9CLEVBQTBDO0FBQy9DbUQsWUFBTXBELEdBQU4sSUFBYSxFQUFiO0FBQ0QsS0FGTSxNQUVBO0FBQ0xvRCxZQUFNcEQsR0FBTixJQUFhLElBQWI7QUFDRDtBQUNGLEdBVkQ7QUFXQSxTQUFPb0QsS0FBUDtBQUNELENBZEQ7O0FBZ0JBOUQsTUFBTXVCLEdBQU4sR0FBWSxJQUFaO0FBQ0F2QixNQUFNc0IsS0FBTixHQUFjLE1BQWQ7QUFDQXRCLE1BQU1ELEtBQU4sR0FBY0EsS0FBZDtBQUNBQyxNQUFNUSxPQUFOLEdBQWdCO0FBQ2RxQyxNQUFJO0FBQ0ZsQyxVQUFNO0FBREo7QUFEVSxDQUFoQiIsImZpbGUiOiJtb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBSZWxhdGlvbnNoaXAgfSBmcm9tICcuL3JlbGF0aW9uc2hpcCc7XG5pbXBvcnQgbWVyZ2VPcHRpb25zIGZyb20gJ21lcmdlLW9wdGlvbnMnO1xuaW1wb3J0IHsgQmVoYXZpb3JTdWJqZWN0IH0gZnJvbSAncnhqcy9SeCc7XG5jb25zdCAkc3RvcmUgPSBTeW1ib2woJyRzdG9yZScpO1xuY29uc3QgJHBsdW1wID0gU3ltYm9sKCckcGx1bXAnKTtcbmNvbnN0ICRsb2FkZWQgPSBTeW1ib2woJyRsb2FkZWQnKTtcbmNvbnN0ICR1bnN1YnNjcmliZSA9IFN5bWJvbCgnJHVuc3Vic2NyaWJlJyk7XG5jb25zdCAkc3ViamVjdCA9IFN5bWJvbCgnJHN1YmplY3QnKTtcbmV4cG9ydCBjb25zdCAkc2VsZiA9IFN5bWJvbCgnJHNlbGYnKTtcblxuLy8gVE9ETzogZmlndXJlIG91dCB3aGVyZSBlcnJvciBldmVudHMgb3JpZ2luYXRlIChzdG9yYWdlIG9yIG1vZGVsKVxuLy8gYW5kIHdobyBrZWVwcyBhIHJvbGwtYmFja2FibGUgZGVsdGFcblxuZXhwb3J0IGNsYXNzIE1vZGVsIHtcbiAgY29uc3RydWN0b3Iob3B0cywgcGx1bXApIHtcbiAgICB0aGlzWyRzdG9yZV0gPSB7XG4gICAgfTtcbiAgICB0aGlzLiRyZWxhdGlvbnNoaXBzID0ge307XG4gICAgdGhpc1skc3ViamVjdF0gPSBuZXcgQmVoYXZpb3JTdWJqZWN0KCk7XG4gICAgdGhpc1skc3ViamVjdF0ubmV4dCh7fSk7XG4gICAgdGhpc1skbG9hZGVkXSA9IHtcbiAgICAgIFskc2VsZl06IGZhbHNlLFxuICAgIH07XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgY29uc3QgUmVsID0gdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0ucmVsYXRpb25zaGlwO1xuICAgICAgICB0aGlzLiRyZWxhdGlvbnNoaXBzW2tleV0gPSBuZXcgUmVsKHRoaXMsIGtleSwgcGx1bXApO1xuICAgICAgICB0aGlzWyRzdG9yZV1ba2V5XSA9IFtdO1xuICAgICAgICB0aGlzWyRsb2FkZWRdW2tleV0gPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0uZGVmYXVsdCB8fCBudWxsO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbShvcHRzIHx8IHt9KTtcbiAgICBpZiAocGx1bXApIHtcbiAgICAgIHRoaXNbJHBsdW1wXSA9IHBsdW1wO1xuICAgIH1cbiAgfVxuXG4gIGdldCAkbmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci4kbmFtZTtcbiAgfVxuXG4gIGdldCAkaWQoKSB7XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JlXVt0aGlzLmNvbnN0cnVjdG9yLiRpZF07XG4gIH1cblxuICAkJGNvcHlWYWx1ZXNGcm9tKG9wdHMgPSB7fSkge1xuICAgIE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkcykuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICBpZiAob3B0c1tmaWVsZE5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gY29weSBmcm9tIG9wdHMgdG8gdGhlIGJlc3Qgb2Ygb3VyIGFiaWxpdHlcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnYXJyYXknKSB8fFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnaGFzTWFueScpXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gKG9wdHNbZmllbGROYW1lXSB8fCBbXSkuY29uY2F0KCk7XG4gICAgICAgICAgdGhpc1skbG9hZGVkXVtmaWVsZE5hbWVdID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0c1tmaWVsZE5hbWVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IG9wdHNbZmllbGROYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuJCRmaXJlVXBkYXRlKCk7XG4gIH1cblxuICAkJGhvb2tUb1BsdW1wKCkge1xuICAgIGlmICh0aGlzWyR1bnN1YnNjcmliZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skdW5zdWJzY3JpYmVdID0gdGhpc1skcGx1bXBdLnN1YnNjcmliZSh0aGlzLmNvbnN0cnVjdG9yLiRuYW1lLCB0aGlzLiRpZCwgKHsgZmllbGQsIHZhbHVlIH0pID0+IHtcbiAgICAgICAgaWYgKGZpZWxkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20oeyBbZmllbGRdOiB2YWx1ZSB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAkc3Vic2NyaWJlKGwpIHtcbiAgICB0aGlzLiQkaG9va1RvUGx1bXAoKTtcbiAgICBpZiAodGhpc1skbG9hZGVkXVskc2VsZl0gPT09IGZhbHNlKSB7XG4gICAgICB0aGlzWyRwbHVtcF0uc3RyZWFtR2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCAkc2VsZilcbiAgICAgIC5zdWJzY3JpYmUoKHYpID0+IHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzWyRzdWJqZWN0XS5zdWJzY3JpYmUobCk7XG4gIH1cblxuICAkJGZpcmVVcGRhdGUoKSB7XG4gICAgdGhpc1skc3ViamVjdF0ubmV4dCh0aGlzWyRzdG9yZV0pO1xuICB9XG5cbiAgLy8gVE9ETzogZG9uJ3QgZmV0Y2ggaWYgd2UgJGdldCgpIHNvbWV0aGluZyB0aGF0IHdlIGFscmVhZHkgaGF2ZVxuXG4gICRnZXQoa2V5ID0gJHNlbGYpIHtcbiAgICAvLyB0aHJlZSBjYXNlcy5cbiAgICAvLyBrZXkgPT09IHVuZGVmaW5lZCAtIGZldGNoIGFsbCwgdW5sZXNzICRsb2FkZWQsIGJ1dCByZXR1cm4gYWxsLlxuICAgIC8vIGZpZWxkc1trZXldID09PSAnaGFzTWFueScgLSBmZXRjaCBjaGlsZHJlbiAocGVyaGFwcyBtb3ZlIHRoaXMgZGVjaXNpb24gdG8gc3RvcmUpXG4gICAgLy8gb3RoZXJ3aXNlIC0gZmV0Y2ggYWxsLCB1bmxlc3MgJHN0b3JlW2tleV0sIHJldHVybiAkc3RvcmVba2V5XS5cblxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBpZiAoKGtleSA9PT0gJHNlbGYpIHx8ICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlICE9PSAnaGFzTWFueScpKSB7XG4gICAgICAgIGlmICh0aGlzWyRsb2FkZWRdWyRzZWxmXSA9PT0gZmFsc2UgJiYgdGhpc1skcGx1bXBdKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5nZXQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICgodGhpc1skbG9hZGVkXVtrZXldID09PSBmYWxzZSkgJiYgdGhpc1skcGx1bXBdKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbG9uZWx5LWlmXG4gICAgICAgICAgcmV0dXJuIHRoaXMuJHJlbGF0aW9uc2hpcHNba2V5XS4kbGlzdCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkudGhlbigodikgPT4ge1xuICAgICAgaWYgKHYgPT09IHRydWUpIHtcbiAgICAgICAgaWYgKGtleSA9PT0gJHNlbGYpIHtcbiAgICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgdGhpc1skc3RvcmVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skc3RvcmVdW2tleV07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodikge1xuICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odik7XG4gICAgICAgIGlmICgoa2V5ID09PSAkc2VsZikgfHwgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55JykpIHtcbiAgICAgICAgICB0aGlzWyRsb2FkZWRdW2tleV0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXkgPT09ICRzZWxmKSB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXNbJHN0b3JlXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHN0b3JlXVtrZXldO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICRzYXZlKCkge1xuICAgIHJldHVybiB0aGlzLiRzZXQoKTtcbiAgfVxuXG4gICRzZXQodSA9IHRoaXNbJHN0b3JlXSkge1xuICAgIGNvbnN0IHVwZGF0ZSA9IG1lcmdlT3B0aW9ucyh7fSwgdGhpc1skc3RvcmVdLCB1KTtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgICBkZWxldGUgdXBkYXRlW2tleV07XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHVwZGF0ZSk7IC8vIHRoaXMgaXMgdGhlIG9wdGltaXN0aWMgdXBkYXRlO1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0uc2F2ZSh0aGlzLmNvbnN0cnVjdG9yLCB1cGRhdGUpXG4gICAgLnRoZW4oKHVwZGF0ZWQpID0+IHtcbiAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh1cGRhdGVkKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0pO1xuICB9XG5cbiAgJGRlbGV0ZSgpIHtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLmRlbGV0ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCk7XG4gIH1cblxuICAkcmVzdChvcHRzKSB7XG4gICAgY29uc3QgcmVzdE9wdHMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICBvcHRzLFxuICAgICAge1xuICAgICAgICB1cmw6IGAvJHt0aGlzLmNvbnN0cnVjdG9yLiRuYW1lfS8ke3RoaXMuJGlkfS8ke29wdHMudXJsfWAsXG4gICAgICB9XG4gICAgKTtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLnJlc3RSZXF1ZXN0KHJlc3RPcHRzKTtcbiAgfVxuXG4gICRhZGQoa2V5LCBpdGVtLCBleHRyYXMpIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2UgaWYgKGl0ZW0uJGlkKSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW1bdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0ucmVsYXRpb25zaGlwLiRzaWRlc1trZXldLm90aGVyLmZpZWxkXTtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0uYWRkKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkLCBleHRyYXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSBhZGRlZCB0byBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRhZGQgZXhjZXB0IHRvIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG5cbiAgJG1vZGlmeVJlbGF0aW9uc2hpcChrZXksIGl0ZW0sIGV4dHJhcykge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICB0aGlzWyRzdG9yZV1ba2V5XSA9IFtdO1xuICAgICAgICB0aGlzWyRsb2FkZWRdW2tleV0gPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5tb2RpZnlSZWxhdGlvbnNoaXAodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaWQsIGV4dHJhcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkcmVtb3ZlKGtleSwgaXRlbSkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICB0aGlzWyRzdG9yZV1ba2V5XSA9IFtdO1xuICAgICAgICB0aGlzWyRsb2FkZWRdW2tleV0gPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5yZW1vdmUodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSAkcmVtb3ZlZCBmcm9tIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJHJlbW92ZSBleGNlcHQgZnJvbSBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICR0ZWFyZG93bigpIHtcbiAgICBpZiAodGhpc1skdW5zdWJzY3JpYmVdKSB7XG4gICAgICB0aGlzWyR1bnN1YnNjcmliZV0udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cbn1cblxuTW9kZWwuZnJvbUpTT04gPSBmdW5jdGlvbiBmcm9tSlNPTihqc29uKSB7XG4gIHRoaXMuJGlkID0ganNvbi4kaWQgfHwgJ2lkJztcbiAgdGhpcy4kbmFtZSA9IGpzb24uJG5hbWU7XG4gIHRoaXMuJGZpZWxkcyA9IHt9O1xuICBPYmplY3Qua2V5cyhqc29uLiRmaWVsZHMpLmZvckVhY2goKGspID0+IHtcbiAgICBjb25zdCBmaWVsZCA9IGpzb24uJGZpZWxkc1trXTtcbiAgICBpZiAoZmllbGQudHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBjbGFzcyBEeW5hbWljUmVsYXRpb25zaGlwIGV4dGVuZHMgUmVsYXRpb25zaGlwIHt9XG4gICAgICBEeW5hbWljUmVsYXRpb25zaGlwLmZyb21KU09OKGZpZWxkLnJlbGF0aW9uc2hpcCk7XG4gICAgICB0aGlzLiRmaWVsZHNba10gPSB7XG4gICAgICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICAgICAgcmVsYXRpb25zaGlwOiBEeW5hbWljUmVsYXRpb25zaGlwLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kZmllbGRzW2tdID0gT2JqZWN0LmFzc2lnbih7fSwgZmllbGQpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5Nb2RlbC50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04oKSB7XG4gIGNvbnN0IHJldFZhbCA9IHtcbiAgICAkaWQ6IHRoaXMuJGlkLFxuICAgICRuYW1lOiB0aGlzLiRuYW1lLFxuICAgICRmaWVsZHM6IHt9LFxuICB9O1xuICBjb25zdCBmaWVsZE5hbWVzID0gT2JqZWN0LmtleXModGhpcy4kZmllbGRzKTtcbiAgZmllbGROYW1lcy5mb3JFYWNoKChrKSA9PiB7XG4gICAgaWYgKHRoaXMuJGZpZWxkc1trXS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIHJldFZhbC4kZmllbGRzW2tdID0ge1xuICAgICAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgICAgIHJlbGF0aW9uc2hpcDogdGhpcy4kZmllbGRzW2tdLnJlbGF0aW9uc2hpcC50b0pTT04oKSxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldFZhbC4kZmllbGRzW2tdID0gdGhpcy4kZmllbGRzW2tdO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZXRWYWw7XG59O1xuXG5Nb2RlbC4kcmVzdCA9IGZ1bmN0aW9uICRyZXN0KHBsdW1wLCBvcHRzKSB7XG4gIGNvbnN0IHJlc3RPcHRzID0gT2JqZWN0LmFzc2lnbihcbiAgICB7fSxcbiAgICBvcHRzLFxuICAgIHtcbiAgICAgIHVybDogYC8ke3RoaXMuJG5hbWV9LyR7b3B0cy51cmx9YCxcbiAgICB9XG4gICk7XG4gIHJldHVybiBwbHVtcC5yZXN0UmVxdWVzdChyZXN0T3B0cyk7XG59O1xuXG5Nb2RlbC5hc3NpZ24gPSBmdW5jdGlvbiBhc3NpZ24ob3B0cykge1xuICBjb25zdCBzdGFydCA9IHt9O1xuICBPYmplY3Qua2V5cyh0aGlzLiRmaWVsZHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgIGlmIChvcHRzW2tleV0pIHtcbiAgICAgIHN0YXJ0W2tleV0gPSBvcHRzW2tleV07XG4gICAgfSBlbHNlIGlmICh0aGlzLiRmaWVsZHNba2V5XS5kZWZhdWx0KSB7XG4gICAgICBzdGFydFtrZXldID0gdGhpcy4kZmllbGRzW2tleV0uZGVmYXVsdDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgc3RhcnRba2V5XSA9IFtdO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGFydFtrZXldID0gbnVsbDtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gc3RhcnQ7XG59O1xuXG5Nb2RlbC4kaWQgPSAnaWQnO1xuTW9kZWwuJG5hbWUgPSAnQmFzZSc7XG5Nb2RlbC4kc2VsZiA9ICRzZWxmO1xuTW9kZWwuJGZpZWxkcyA9IHtcbiAgaWQ6IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbn07XG4iXX0=
