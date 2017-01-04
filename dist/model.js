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

var $store = Symbol('$store');
var $plump = Symbol('$plump');
var $loaded = Symbol('$loaded');
var $unsubscribe = Symbol('$unsubscribe');
var $subject = Symbol('$subject');
var $self = exports.$self = Symbol('$self');
var $all = exports.$all = Symbol('$all');

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
            // this.$$copyValuesFrom(value);
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
        } else if (v && v[$self] !== null) {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRzdG9yZSIsIlN5bWJvbCIsIiRwbHVtcCIsIiRsb2FkZWQiLCIkdW5zdWJzY3JpYmUiLCIkc3ViamVjdCIsIiRzZWxmIiwiJGFsbCIsIk1vZGVsIiwib3B0cyIsInBsdW1wIiwiJHJlbGF0aW9uc2hpcHMiLCJuZXh0IiwiT2JqZWN0Iiwia2V5cyIsImNvbnN0cnVjdG9yIiwiJGZpZWxkcyIsImZvckVhY2giLCJrZXkiLCJ0eXBlIiwiUmVsIiwicmVsYXRpb25zaGlwIiwiZGVmYXVsdCIsIiQkY29weVZhbHVlc0Zyb20iLCJmaWVsZE5hbWUiLCJ1bmRlZmluZWQiLCJjb25jYXQiLCJhc3NpZ24iLCIkJGZpcmVVcGRhdGUiLCJzdWJzY3JpYmUiLCIkbmFtZSIsIiRpZCIsImZpZWxkIiwidmFsdWUiLCJsIiwiJCRob29rVG9QbHVtcCIsInN0cmVhbUdldCIsInYiLCJyZXNvbHZlIiwidGhlbiIsImdldCIsIiRsaXN0IiwiJHNldCIsInUiLCJ1cGRhdGUiLCJzYXZlIiwidXBkYXRlZCIsImRlbGV0ZSIsInJlc3RPcHRzIiwidXJsIiwicmVzdFJlcXVlc3QiLCJpdGVtIiwiZXh0cmFzIiwiaWQiLCIkc2lkZXMiLCJvdGhlciIsImFkZCIsInJlamVjdCIsIkVycm9yIiwibW9kaWZ5UmVsYXRpb25zaGlwIiwicmVtb3ZlIiwidW5zdWJzY3JpYmUiLCJmcm9tSlNPTiIsImpzb24iLCJrIiwiRHluYW1pY1JlbGF0aW9uc2hpcCIsInRvSlNPTiIsInJldFZhbCIsImZpZWxkTmFtZXMiLCIkcmVzdCIsInN0YXJ0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7OztBQUNBLElBQU1BLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUMsU0FBU0QsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNRSxVQUFVRixPQUFPLFNBQVAsQ0FBaEI7QUFDQSxJQUFNRyxlQUFlSCxPQUFP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ZSxFQUVmbEIsSUFGZSxFQUdmO0FBQ0V3QyxlQUFTLEtBQUtuQixLQUFkLFNBQXVCckIsS0FBS3dDO0FBRDlCLEdBSGUsQ0FBakI7QUFPQSxTQUFPdkMsTUFBTXdDLFdBQU4sQ0FBa0JGLFFBQWxCLENBQVA7QUFDRCxDQVREOztBQVdBeEMsTUFBTW1CLE1BQU4sR0FBZSxTQUFTQSxNQUFULENBQWdCbEIsSUFBaEIsRUFBc0I7QUFBQTs7QUFDbkMsTUFBTTZELFFBQVEsRUFBZDtBQUNBekQsU0FBT0MsSUFBUCxDQUFZLEtBQUtFLE9BQWpCLEVBQTBCQyxPQUExQixDQUFrQyxVQUFDQyxHQUFELEVBQVM7QUFDekMsUUFBSVQsS0FBS1MsR0FBTCxDQUFKLEVBQWU7QUFDYm9ELFlBQU1wRCxHQUFOLElBQWFULEtBQUtTLEdBQUwsQ0FBYjtBQUNELEtBRkQsTUFFTyxJQUFJLFFBQUtGLE9BQUwsQ0FBYUUsR0FBYixFQUFrQkksT0FBdEIsRUFBK0I7QUFDcENnRCxZQUFNcEQsR0FBTixJQUFhLFFBQUtGLE9BQUwsQ0FBYUUsR0FBYixFQUFrQkksT0FBL0I7QUFDRCxLQUZNLE1BRUEsSUFBSSxRQUFLTixPQUFMLENBQWFFLEdBQWIsRUFBa0JDLElBQWxCLEtBQTJCLFNBQS9CLEVBQTBDO0FBQy9DbUQsWUFBTXBELEdBQU4sSUFBYSxFQUFiO0FBQ0QsS0FGTSxNQUVBO0FBQ0xvRCxZQUFNcEQsR0FBTixJQUFhLElBQWI7QUFDRDtBQUNGLEdBVkQ7QUFXQSxTQUFPb0QsS0FBUDtBQUNELENBZEQ7O0FBZ0JBOUQsTUFBTXVCLEdBQU4sR0FBWSxJQUFaO0FBQ0F2QixNQUFNc0IsS0FBTixHQUFjLE1BQWQ7QUFDQXRCLE1BQU1GLEtBQU4sR0FBY0EsS0FBZDtBQUNBRSxNQUFNUSxPQUFOLEdBQWdCO0FBQ2RxQyxNQUFJO0FBQ0ZsQyxVQUFNO0FBREo7QUFEVSxDQUFoQiIsImZpbGUiOiJtb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBSZWxhdGlvbnNoaXAgfSBmcm9tICcuL3JlbGF0aW9uc2hpcCc7XG5pbXBvcnQgbWVyZ2VPcHRpb25zIGZyb20gJ21lcmdlLW9wdGlvbnMnO1xuaW1wb3J0IHsgQmVoYXZpb3JTdWJqZWN0IH0gZnJvbSAncnhqcy9SeCc7XG5jb25zdCAkc3RvcmUgPSBTeW1ib2woJyRzdG9yZScpO1xuY29uc3QgJHBsdW1wID0gU3ltYm9sKCckcGx1bXAnKTtcbmNvbnN0ICRsb2FkZWQgPSBTeW1ib2woJyRsb2FkZWQnKTtcbmNvbnN0ICR1bnN1YnNjcmliZSA9IFN5bWJvbCgnJHVuc3Vic2NyaWJlJyk7XG5jb25zdCAkc3ViamVjdCA9IFN5bWJvbCgnJHN1YmplY3QnKTtcbmV4cG9ydCBjb25zdCAkc2VsZiA9IFN5bWJvbCgnJHNlbGYnKTtcbmV4cG9ydCBjb25zdCAkYWxsID0gU3ltYm9sKCckYWxsJyk7XG5cbi8vIFRPRE86IGZpZ3VyZSBvdXQgd2hlcmUgZXJyb3IgZXZlbnRzIG9yaWdpbmF0ZSAoc3RvcmFnZSBvciBtb2RlbClcbi8vIGFuZCB3aG8ga2VlcHMgYSByb2xsLWJhY2thYmxlIGRlbHRhXG5cbmV4cG9ydCBjbGFzcyBNb2RlbCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMsIHBsdW1wKSB7XG4gICAgdGhpc1skc3RvcmVdID0ge1xuICAgIH07XG4gICAgdGhpcy4kcmVsYXRpb25zaGlwcyA9IHt9O1xuICAgIHRoaXNbJHN1YmplY3RdID0gbmV3IEJlaGF2aW9yU3ViamVjdCgpO1xuICAgIHRoaXNbJHN1YmplY3RdLm5leHQoe30pO1xuICAgIHRoaXNbJGxvYWRlZF0gPSB7XG4gICAgICBbJHNlbGZdOiBmYWxzZSxcbiAgICB9O1xuICAgIE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkcykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICAgIGNvbnN0IFJlbCA9IHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnJlbGF0aW9uc2hpcDtcbiAgICAgICAgdGhpcy4kcmVsYXRpb25zaGlwc1trZXldID0gbmV3IFJlbCh0aGlzLCBrZXksIHBsdW1wKTtcbiAgICAgICAgdGhpc1skc3RvcmVdW2tleV0gPSBbXTtcbiAgICAgICAgdGhpc1skbG9hZGVkXVtrZXldID0gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzWyRzdG9yZV1ba2V5XSA9IHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLmRlZmF1bHQgfHwgbnVsbDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20ob3B0cyB8fCB7fSk7XG4gICAgaWYgKHBsdW1wKSB7XG4gICAgICB0aGlzWyRwbHVtcF0gPSBwbHVtcDtcbiAgICB9XG4gIH1cblxuICBnZXQgJG5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuJG5hbWU7XG4gIH1cblxuICBnZXQgJGlkKCkge1xuICAgIHJldHVybiB0aGlzWyRzdG9yZV1bdGhpcy5jb25zdHJ1Y3Rvci4kaWRdO1xuICB9XG5cbiAgJCRjb3B5VmFsdWVzRnJvbShvcHRzID0ge30pIHtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgaWYgKG9wdHNbZmllbGROYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGNvcHkgZnJvbSBvcHRzIHRvIHRoZSBiZXN0IG9mIG91ciBhYmlsaXR5XG4gICAgICAgIGlmIChcbiAgICAgICAgICAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2FycmF5JykgfHxcbiAgICAgICAgICAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2hhc01hbnknKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IChvcHRzW2ZpZWxkTmFtZV0gfHwgW10pLmNvbmNhdCgpO1xuICAgICAgICAgIHRoaXNbJGxvYWRlZF1bZmllbGROYW1lXSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IE9iamVjdC5hc3NpZ24oe30sIG9wdHNbZmllbGROYW1lXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBvcHRzW2ZpZWxkTmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLiQkZmlyZVVwZGF0ZSgpO1xuICB9XG5cbiAgJCRob29rVG9QbHVtcCgpIHtcbiAgICBpZiAodGhpc1skdW5zdWJzY3JpYmVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHVuc3Vic2NyaWJlXSA9IHRoaXNbJHBsdW1wXS5zdWJzY3JpYmUodGhpcy5jb25zdHJ1Y3Rvci4kbmFtZSwgdGhpcy4kaWQsICh7IGZpZWxkLCB2YWx1ZSB9KSA9PiB7XG4gICAgICAgIGlmIChmaWVsZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgLy8gdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHZhbHVlKTtcbiAgICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20oeyBbZmllbGRdOiB2YWx1ZSB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAkc3Vic2NyaWJlKGwpIHtcbiAgICB0aGlzLiQkaG9va1RvUGx1bXAoKTtcbiAgICBpZiAodGhpc1skbG9hZGVkXVskc2VsZl0gPT09IGZhbHNlKSB7XG4gICAgICB0aGlzWyRwbHVtcF0uc3RyZWFtR2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCAkc2VsZilcbiAgICAgIC5zdWJzY3JpYmUoKHYpID0+IHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzWyRzdWJqZWN0XS5zdWJzY3JpYmUobCk7XG4gIH1cblxuICAkJGZpcmVVcGRhdGUoKSB7XG4gICAgdGhpc1skc3ViamVjdF0ubmV4dCh0aGlzWyRzdG9yZV0pO1xuICB9XG5cbiAgLy8gVE9ETzogZG9uJ3QgZmV0Y2ggaWYgd2UgJGdldCgpIHNvbWV0aGluZyB0aGF0IHdlIGFscmVhZHkgaGF2ZVxuXG4gICRnZXQoa2V5ID0gJHNlbGYpIHtcbiAgICAvLyB0aHJlZSBjYXNlcy5cbiAgICAvLyBrZXkgPT09IHVuZGVmaW5lZCAtIGZldGNoIGFsbCwgdW5sZXNzICRsb2FkZWQsIGJ1dCByZXR1cm4gYWxsLlxuICAgIC8vIGZpZWxkc1trZXldID09PSAnaGFzTWFueScgLSBmZXRjaCBjaGlsZHJlbiAocGVyaGFwcyBtb3ZlIHRoaXMgZGVjaXNpb24gdG8gc3RvcmUpXG4gICAgLy8gb3RoZXJ3aXNlIC0gZmV0Y2ggYWxsLCB1bmxlc3MgJHN0b3JlW2tleV0sIHJldHVybiAkc3RvcmVba2V5XS5cblxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBpZiAoKGtleSA9PT0gJHNlbGYpIHx8ICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlICE9PSAnaGFzTWFueScpKSB7XG4gICAgICAgIGlmICh0aGlzWyRsb2FkZWRdWyRzZWxmXSA9PT0gZmFsc2UgJiYgdGhpc1skcGx1bXBdKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5nZXQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICgodGhpc1skbG9hZGVkXVtrZXldID09PSBmYWxzZSkgJiYgdGhpc1skcGx1bXBdKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbG9uZWx5LWlmXG4gICAgICAgICAgcmV0dXJuIHRoaXMuJHJlbGF0aW9uc2hpcHNba2V5XS4kbGlzdCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkudGhlbigodikgPT4ge1xuICAgICAgaWYgKHYgPT09IHRydWUpIHtcbiAgICAgICAgaWYgKGtleSA9PT0gJHNlbGYpIHtcbiAgICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgdGhpc1skc3RvcmVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skc3RvcmVdW2tleV07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodiAmJiAodlskc2VsZl0gIT09IG51bGwpKSB7XG4gICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KTtcbiAgICAgICAgaWYgKChrZXkgPT09ICRzZWxmKSB8fCAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSkge1xuICAgICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtleSA9PT0gJHNlbGYpIHtcbiAgICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgdGhpc1skc3RvcmVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skc3RvcmVdW2tleV07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgJHNhdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHNldCgpO1xuICB9XG5cbiAgJHNldCh1ID0gdGhpc1skc3RvcmVdKSB7XG4gICAgY29uc3QgdXBkYXRlID0gbWVyZ2VPcHRpb25zKHt9LCB0aGlzWyRzdG9yZV0sIHUpO1xuICAgIE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkcykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICAgIGRlbGV0ZSB1cGRhdGVba2V5XTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyB0aGlzLiQkY29weVZhbHVlc0Zyb20odXBkYXRlKTsgLy8gdGhpcyBpcyB0aGUgb3B0aW1pc3RpYyB1cGRhdGU7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5zYXZlKHRoaXMuY29uc3RydWN0b3IsIHVwZGF0ZSlcbiAgICAudGhlbigodXBkYXRlZCkgPT4ge1xuICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHVwZGF0ZWQpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSk7XG4gIH1cblxuICAkZGVsZXRlKCkge1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZGVsZXRlKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkKTtcbiAgfVxuXG4gICRyZXN0KG9wdHMpIHtcbiAgICBjb25zdCByZXN0T3B0cyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIG9wdHMsXG4gICAgICB7XG4gICAgICAgIHVybDogYC8ke3RoaXMuY29uc3RydWN0b3IuJG5hbWV9LyR7dGhpcy4kaWR9LyR7b3B0cy51cmx9YCxcbiAgICAgIH1cbiAgICApO1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0ucmVzdFJlcXVlc3QocmVzdE9wdHMpO1xuICB9XG5cbiAgJGFkZChrZXksIGl0ZW0sIGV4dHJhcykge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSBpZiAoaXRlbS4kaWQpIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbVt0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS5yZWxhdGlvbnNoaXAuJHNpZGVzW2tleV0ub3RoZXIuZmllbGRdO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5hZGQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaWQsIGV4dHJhcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkbW9kaWZ5UmVsYXRpb25zaGlwKGtleSwgaXRlbSwgZXh0cmFzKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gW107XG4gICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLm1vZGlmeVJlbGF0aW9uc2hpcCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpZCwgZXh0cmFzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gYWRkZWQgdG8gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICRyZW1vdmUoa2V5LCBpdGVtKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gW107XG4gICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLnJlbW92ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtICRyZW1vdmVkIGZyb20gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkcmVtb3ZlIGV4Y2VwdCBmcm9tIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG5cbiAgJHRlYXJkb3duKCkge1xuICAgIGlmICh0aGlzWyR1bnN1YnNjcmliZV0pIHtcbiAgICAgIHRoaXNbJHVuc3Vic2NyaWJlXS51bnN1YnNjcmliZSgpO1xuICAgIH1cbiAgfVxufVxuXG5Nb2RlbC5mcm9tSlNPTiA9IGZ1bmN0aW9uIGZyb21KU09OKGpzb24pIHtcbiAgdGhpcy4kaWQgPSBqc29uLiRpZCB8fCAnaWQnO1xuICB0aGlzLiRuYW1lID0ganNvbi4kbmFtZTtcbiAgdGhpcy4kZmllbGRzID0ge307XG4gIE9iamVjdC5rZXlzKGpzb24uJGZpZWxkcykuZm9yRWFjaCgoaykgPT4ge1xuICAgIGNvbnN0IGZpZWxkID0ganNvbi4kZmllbGRzW2tdO1xuICAgIGlmIChmaWVsZC50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGNsYXNzIER5bmFtaWNSZWxhdGlvbnNoaXAgZXh0ZW5kcyBSZWxhdGlvbnNoaXAge31cbiAgICAgIER5bmFtaWNSZWxhdGlvbnNoaXAuZnJvbUpTT04oZmllbGQucmVsYXRpb25zaGlwKTtcbiAgICAgIHRoaXMuJGZpZWxkc1trXSA9IHtcbiAgICAgICAgdHlwZTogJ2hhc01hbnknLFxuICAgICAgICByZWxhdGlvbnNoaXA6IER5bmFtaWNSZWxhdGlvbnNoaXAsXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiRmaWVsZHNba10gPSBPYmplY3QuYXNzaWduKHt9LCBmaWVsZCk7XG4gICAgfVxuICB9KTtcbn07XG5cbk1vZGVsLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTigpIHtcbiAgY29uc3QgcmV0VmFsID0ge1xuICAgICRpZDogdGhpcy4kaWQsXG4gICAgJG5hbWU6IHRoaXMuJG5hbWUsXG4gICAgJGZpZWxkczoge30sXG4gIH07XG4gIGNvbnN0IGZpZWxkTmFtZXMgPSBPYmplY3Qua2V5cyh0aGlzLiRmaWVsZHMpO1xuICBmaWVsZE5hbWVzLmZvckVhY2goKGspID0+IHtcbiAgICBpZiAodGhpcy4kZmllbGRzW2tdLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgcmV0VmFsLiRmaWVsZHNba10gPSB7XG4gICAgICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICAgICAgcmVsYXRpb25zaGlwOiB0aGlzLiRmaWVsZHNba10ucmVsYXRpb25zaGlwLnRvSlNPTigpLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0VmFsLiRmaWVsZHNba10gPSB0aGlzLiRmaWVsZHNba107XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHJldFZhbDtcbn07XG5cbk1vZGVsLiRyZXN0ID0gZnVuY3Rpb24gJHJlc3QocGx1bXAsIG9wdHMpIHtcbiAgY29uc3QgcmVzdE9wdHMgPSBPYmplY3QuYXNzaWduKFxuICAgIHt9LFxuICAgIG9wdHMsXG4gICAge1xuICAgICAgdXJsOiBgLyR7dGhpcy4kbmFtZX0vJHtvcHRzLnVybH1gLFxuICAgIH1cbiAgKTtcbiAgcmV0dXJuIHBsdW1wLnJlc3RSZXF1ZXN0KHJlc3RPcHRzKTtcbn07XG5cbk1vZGVsLmFzc2lnbiA9IGZ1bmN0aW9uIGFzc2lnbihvcHRzKSB7XG4gIGNvbnN0IHN0YXJ0ID0ge307XG4gIE9iamVjdC5rZXlzKHRoaXMuJGZpZWxkcykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgaWYgKG9wdHNba2V5XSkge1xuICAgICAgc3RhcnRba2V5XSA9IG9wdHNba2V5XTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuJGZpZWxkc1trZXldLmRlZmF1bHQpIHtcbiAgICAgIHN0YXJ0W2tleV0gPSB0aGlzLiRmaWVsZHNba2V5XS5kZWZhdWx0O1xuICAgIH0gZWxzZSBpZiAodGhpcy4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBzdGFydFtrZXldID0gW107XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXJ0W2tleV0gPSBudWxsO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBzdGFydDtcbn07XG5cbk1vZGVsLiRpZCA9ICdpZCc7XG5Nb2RlbC4kbmFtZSA9ICdCYXNlJztcbk1vZGVsLiRzZWxmID0gJHNlbGY7XG5Nb2RlbC4kZmllbGRzID0ge1xuICBpZDoge1xuICAgIHR5cGU6ICdudW1iZXInLFxuICB9LFxufTtcbiJdfQ==
