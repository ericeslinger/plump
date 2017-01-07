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
    value: function $subscribe() {
      var _this4 = this;

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
      if (this[$loaded][$self] === false) {
        this[$plump].streamGet(this.constructor, this.$id, fields).subscribe(function (v) {
          return _this4.$$copyValuesFrom(v);
        });
      }
      return this[$subject].subscribe(cb);
    }
  }, {
    key: '$$fireUpdate',
    value: function $$fireUpdate() {
      this[$subject].next(this[$store]);
    }

    // TODO: don't fetch if we $get() something that we already have

  }, {
    key: '$get',
    value: function $get(opts) {
      var _this5 = this;

      var keys = [$self];
      if (Array.isArray(opts)) {
        keys = opts;
      } else if (opts !== undefined) {
        keys = [opts];
      }
      return _bluebird2.default.all(keys.map(function (key) {
        return _this5.$$singleGet(key);
      })).then(function (valueArray) {
        var selfIdx = keys.indexOf($self);
        if (selfIdx >= 0 && valueArray[selfIdx] === null) {
          return null;
        } else {
          return valueArray.reduce(function (accum, curr) {
            return Object.assign(accum, curr);
          }, {});
        }
      });
    }
  }, {
    key: '$$singleGet',
    value: function $$singleGet() {
      var _this6 = this;

      var opt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : $self;

      // three cases.
      // key === undefined - fetch all, unless $loaded, but return all.
      // fields[key] === 'hasMany' - fetch children (perhaps move this decision to store)
      // otherwise - fetch all, unless $store[key], return $store[key].
      var key = void 0;
      if (opt !== $self && this.constructor.$fields[opt].type !== 'hasMany') {
        key = $self;
      } else {
        key = opt;
      }
      return _bluebird2.default.resolve().then(function () {
        if (key === $self) {
          if (_this6[$loaded][$self] === false && _this6[$plump]) {
            return _this6[$plump].get(_this6.constructor, _this6.$id, key);
          } else {
            return true;
          }
        } else {
          if (_this6[$loaded][key] === false && _this6[$plump]) {
            // eslint-disable-line no-lonely-if
            return _this6.$relationships[key].$list();
          } else {
            return true;
          }
        }
      }).then(function (v) {
        if (v === true) {
          if (key === $self) {
            return Object.assign({}, _this6[$store]);
          } else {
            return Object.assign({}, _defineProperty({}, key, _this6[$store][key]));
          }
        } else if (v && v[$self] !== null) {
          _this6.$$copyValuesFrom(v);
          _this6[$loaded][key] = true;
          if (key === $self) {
            return Object.assign({}, _this6[$store]);
          } else {
            return Object.assign({}, _defineProperty({}, key, _this6[$store][key]));
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
      var _this7 = this;

      var u = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this[$store];

      var update = (0, _mergeOptions2.default)({}, this[$store], u);
      Object.keys(this.constructor.$fields).forEach(function (key) {
        if (_this7.constructor.$fields[key].type === 'hasMany') {
          delete update[key];
        }
      });
      // this.$$copyValuesFrom(update); // this is the optimistic update;
      return this[$plump].save(this.constructor, update).then(function (updated) {
        _this7.$$copyValuesFrom(updated);
        return _this7;
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
      var _this8 = this;

      return _bluebird2.default.resolve().then(function () {
        if (_this8.constructor.$fields[key].type === 'hasMany') {
          var id = 0;
          if (typeof item === 'number') {
            id = item;
          } else if (item.$id) {
            id = item.$id;
          } else {
            id = item[_this8.constructor.$fields[key].relationship.$sides[key].other.field];
          }
          if (typeof id === 'number' && id >= 1) {
            return _this8[$plump].add(_this8.constructor, _this8.$id, key, id, extras);
          } else {
            return _bluebird2.default.reject(new Error('Invalid item added to hasMany'));
          }
        } else {
          return _bluebird2.default.reject(new Error('Cannot $add except to hasMany field'));
        }
      }).then(function (l) {
        _this8.$$copyValuesFrom(_defineProperty({}, key, l));
        return l;
      });
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
  var _this10 = this;

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
      _this10.$fields[k] = {
        type: 'hasMany',
        relationship: DynamicRelationship
      };
    } else {
      _this10.$fields[k] = Object.assign({}, field);
    }
  });
};

Model.toJSON = function toJSON() {
  var _this11 = this;

  var retVal = {
    $id: this.$id,
    $name: this.$name,
    $fields: {}
  };
  var fieldNames = Object.keys(this.$fields);
  fieldNames.forEach(function (k) {
    if (_this11.$fields[k].type === 'hasMany') {
      retVal.$fields[k] = {
        type: 'hasMany',
        relationship: _this11.$fields[k].relationship.toJSON()
      };
    } else {
      retVal.$fields[k] = _this11.$fields[k];
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
  var _this12 = this;

  var start = {};
  Object.keys(this.$fields).forEach(function (key) {
    if (opts[key]) {
      start[key] = opts[key];
    } else if (_this12.$fields[key].default) {
      start[key] = _this12.$fields[key].default;
    } else if (_this12.$fields[key].type === 'hasMany') {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRzdG9yZSIsIlN5bWJvbCIsIiRwbHVtcCIsIiRsb2FkZWQiLCIkdW5zdWJzY3JpYmUiLCIkc3ViamVjdCIsIiRzZWxmIiwiJGFsbCIsIk1vZGVsIiwib3B0cyIsInBsdW1wIiwiJHJlbGF0aW9uc2hpcHMiLCJuZXh0IiwiT2JqZWN0Iiwia2V5cyIsImNvbnN0cnVjdG9yIiwiJGZpZWxkcyIsImZvckVhY2giLCJrZXkiLCJ0eXBlIiwiUmVsIiwicmVsYXRpb25zaGlwIiwiZGVmYXVsdCIsIiQkY29weVZhbHVlc0Zyb20iLCJmaWVsZE5hbWUiLCJ1bmRlZmluZWQiLCJjb25jYXQiLCJhc3NpZ24iLCIkJGZpcmVVcGRhdGUiLCJzdWJzY3JpYmUiLCIkbmFtZSIsIiRpZCIsImZpZWxkIiwidmFsdWUiLCJmaWVsZHMiLCJjYiIsImxlbmd0aCIsIkFycmF5IiwiaXNBcnJheSIsIiQkaG9va1RvUGx1bXAiLCJzdHJlYW1HZXQiLCJ2IiwiYWxsIiwibWFwIiwiJCRzaW5nbGVHZXQiLCJ0aGVuIiwidmFsdWVBcnJheSIsInNlbGZJZHgiLCJpbmRleE9mIiwicmVkdWNlIiwiYWNjdW0iLCJjdXJyIiwib3B0IiwicmVzb2x2ZSIsImdldCIsIiRsaXN0IiwiJHNldCIsInUiLCJ1cGRhdGUiLCJzYXZlIiwidXBkYXRlZCIsImRlbGV0ZSIsInJlc3RPcHRzIiwidXJsIiwicmVzdFJlcXVlc3QiLCJpdGVtIiwiZXh0cmFzIiwiaWQiLCIkc2lkZXMiLCJvdGhlciIsImFkZCIsInJlamVjdCIsIkVycm9yIiwibCIsIm1vZGlmeVJlbGF0aW9uc2hpcCIsInJlbW92ZSIsInVuc3Vic2NyaWJlIiwiZnJvbUpTT04iLCJqc29uIiwiayIsIkR5bmFtaWNSZWxhdGlvbnNoaXAiLCJ0b0pTT04iLCJyZXRWYWwiLCJmaWVsZE5hbWVzIiwiJHJlc3QiLCJzdGFydCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7OztBQUNB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QUFDL0NrRSxZQUFNbkUsR0FBTixJQUFhLEVBQWI7QUFDRCxLQUZNLE1BRUE7QUFDTG1FLFlBQU1uRSxHQUFOLElBQWEsSUFBYjtBQUNEO0FBQ0YsR0FWRDtBQVdBLFNBQU9tRSxLQUFQO0FBQ0QsQ0FkRDs7QUFnQkE3RSxNQUFNdUIsR0FBTixHQUFZLElBQVo7QUFDQXZCLE1BQU1zQixLQUFOLEdBQWMsTUFBZDtBQUNBdEIsTUFBTUYsS0FBTixHQUFjQSxLQUFkO0FBQ0FFLE1BQU1RLE9BQU4sR0FBZ0I7QUFDZG1ELE1BQUk7QUFDRmhELFVBQU07QUFESjtBQURVLENBQWhCIiwiZmlsZSI6Im1vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IFJlbGF0aW9uc2hpcCB9IGZyb20gJy4vcmVsYXRpb25zaGlwJztcbmltcG9ydCBtZXJnZU9wdGlvbnMgZnJvbSAnbWVyZ2Utb3B0aW9ucyc7XG5pbXBvcnQgeyBCZWhhdmlvclN1YmplY3QgfSBmcm9tICdyeGpzL1J4JztcbmNvbnN0ICRzdG9yZSA9IFN5bWJvbCgnJHN0b3JlJyk7XG5jb25zdCAkcGx1bXAgPSBTeW1ib2woJyRwbHVtcCcpO1xuY29uc3QgJGxvYWRlZCA9IFN5bWJvbCgnJGxvYWRlZCcpO1xuY29uc3QgJHVuc3Vic2NyaWJlID0gU3ltYm9sKCckdW5zdWJzY3JpYmUnKTtcbmNvbnN0ICRzdWJqZWN0ID0gU3ltYm9sKCckc3ViamVjdCcpO1xuZXhwb3J0IGNvbnN0ICRzZWxmID0gU3ltYm9sKCckc2VsZicpO1xuZXhwb3J0IGNvbnN0ICRhbGwgPSBTeW1ib2woJyRhbGwnKTtcblxuLy8gVE9ETzogZmlndXJlIG91dCB3aGVyZSBlcnJvciBldmVudHMgb3JpZ2luYXRlIChzdG9yYWdlIG9yIG1vZGVsKVxuLy8gYW5kIHdobyBrZWVwcyBhIHJvbGwtYmFja2FibGUgZGVsdGFcblxuZXhwb3J0IGNsYXNzIE1vZGVsIHtcbiAgY29uc3RydWN0b3Iob3B0cywgcGx1bXApIHtcbiAgICB0aGlzWyRzdG9yZV0gPSB7XG4gICAgfTtcbiAgICB0aGlzLiRyZWxhdGlvbnNoaXBzID0ge307XG4gICAgdGhpc1skc3ViamVjdF0gPSBuZXcgQmVoYXZpb3JTdWJqZWN0KCk7XG4gICAgdGhpc1skc3ViamVjdF0ubmV4dCh7fSk7XG4gICAgdGhpc1skbG9hZGVkXSA9IHtcbiAgICAgIFskc2VsZl06IGZhbHNlLFxuICAgIH07XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgY29uc3QgUmVsID0gdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0ucmVsYXRpb25zaGlwO1xuICAgICAgICB0aGlzLiRyZWxhdGlvbnNoaXBzW2tleV0gPSBuZXcgUmVsKHRoaXMsIGtleSwgcGx1bXApO1xuICAgICAgICB0aGlzWyRzdG9yZV1ba2V5XSA9IFtdO1xuICAgICAgICB0aGlzWyRsb2FkZWRdW2tleV0gPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0uZGVmYXVsdCB8fCBudWxsO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbShvcHRzIHx8IHt9KTtcbiAgICBpZiAocGx1bXApIHtcbiAgICAgIHRoaXNbJHBsdW1wXSA9IHBsdW1wO1xuICAgIH1cbiAgfVxuXG4gIGdldCAkbmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci4kbmFtZTtcbiAgfVxuXG4gIGdldCAkaWQoKSB7XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JlXVt0aGlzLmNvbnN0cnVjdG9yLiRpZF07XG4gIH1cblxuICAkJGNvcHlWYWx1ZXNGcm9tKG9wdHMgPSB7fSkge1xuICAgIE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkcykuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICBpZiAob3B0c1tmaWVsZE5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gY29weSBmcm9tIG9wdHMgdG8gdGhlIGJlc3Qgb2Ygb3VyIGFiaWxpdHlcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnYXJyYXknKSB8fFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnaGFzTWFueScpXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gKG9wdHNbZmllbGROYW1lXSB8fCBbXSkuY29uY2F0KCk7XG4gICAgICAgICAgdGhpc1skbG9hZGVkXVtmaWVsZE5hbWVdID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0c1tmaWVsZE5hbWVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IG9wdHNbZmllbGROYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuJCRmaXJlVXBkYXRlKCk7XG4gIH1cblxuICAkJGhvb2tUb1BsdW1wKCkge1xuICAgIGlmICh0aGlzWyR1bnN1YnNjcmliZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skdW5zdWJzY3JpYmVdID0gdGhpc1skcGx1bXBdLnN1YnNjcmliZSh0aGlzLmNvbnN0cnVjdG9yLiRuYW1lLCB0aGlzLiRpZCwgKHsgZmllbGQsIHZhbHVlIH0pID0+IHtcbiAgICAgICAgaWYgKGZpZWxkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAvLyB0aGlzLiQkY29weVZhbHVlc0Zyb20odmFsdWUpO1xuICAgICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh7IFtmaWVsZF06IHZhbHVlIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gICRzdWJzY3JpYmUoLi4uYXJncykge1xuICAgIGxldCBmaWVsZHMgPSBbJHNlbGZdO1xuICAgIGxldCBjYjtcbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDIpIHtcbiAgICAgIGZpZWxkcyA9IGFyZ3NbMF07XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZmllbGRzKSkge1xuICAgICAgICBmaWVsZHMgPSBbZmllbGRzXTtcbiAgICAgIH1cbiAgICAgIGNiID0gYXJnc1sxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2IgPSBhcmdzWzBdO1xuICAgIH1cbiAgICB0aGlzLiQkaG9va1RvUGx1bXAoKTtcbiAgICBpZiAodGhpc1skbG9hZGVkXVskc2VsZl0gPT09IGZhbHNlKSB7XG4gICAgICB0aGlzWyRwbHVtcF0uc3RyZWFtR2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBmaWVsZHMpXG4gICAgICAuc3Vic2NyaWJlKCh2KSA9PiB0aGlzLiQkY29weVZhbHVlc0Zyb20odikpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpc1skc3ViamVjdF0uc3Vic2NyaWJlKGNiKTtcbiAgfVxuXG4gICQkZmlyZVVwZGF0ZSgpIHtcbiAgICB0aGlzWyRzdWJqZWN0XS5uZXh0KHRoaXNbJHN0b3JlXSk7XG4gIH1cblxuICAvLyBUT0RPOiBkb24ndCBmZXRjaCBpZiB3ZSAkZ2V0KCkgc29tZXRoaW5nIHRoYXQgd2UgYWxyZWFkeSBoYXZlXG5cbiAgJGdldChvcHRzKSB7XG4gICAgbGV0IGtleXMgPSBbJHNlbGZdO1xuICAgIGlmIChBcnJheS5pc0FycmF5KG9wdHMpKSB7XG4gICAgICBrZXlzID0gb3B0cztcbiAgICB9IGVsc2UgaWYgKG9wdHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAga2V5cyA9IFtvcHRzXTtcbiAgICB9XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChrZXlzLm1hcCgoa2V5KSA9PiB0aGlzLiQkc2luZ2xlR2V0KGtleSkpKVxuICAgIC50aGVuKCh2YWx1ZUFycmF5KSA9PiB7XG4gICAgICBjb25zdCBzZWxmSWR4ID0ga2V5cy5pbmRleE9mKCRzZWxmKTtcbiAgICAgIGlmICgoc2VsZklkeCA+PSAwKSAmJiAodmFsdWVBcnJheVtzZWxmSWR4XSA9PT0gbnVsbCkpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdmFsdWVBcnJheS5yZWR1Y2UoKGFjY3VtLCBjdXJyKSA9PiBPYmplY3QuYXNzaWduKGFjY3VtLCBjdXJyKSwge30pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgJCRzaW5nbGVHZXQob3B0ID0gJHNlbGYpIHtcbiAgICAvLyB0aHJlZSBjYXNlcy5cbiAgICAvLyBrZXkgPT09IHVuZGVmaW5lZCAtIGZldGNoIGFsbCwgdW5sZXNzICRsb2FkZWQsIGJ1dCByZXR1cm4gYWxsLlxuICAgIC8vIGZpZWxkc1trZXldID09PSAnaGFzTWFueScgLSBmZXRjaCBjaGlsZHJlbiAocGVyaGFwcyBtb3ZlIHRoaXMgZGVjaXNpb24gdG8gc3RvcmUpXG4gICAgLy8gb3RoZXJ3aXNlIC0gZmV0Y2ggYWxsLCB1bmxlc3MgJHN0b3JlW2tleV0sIHJldHVybiAkc3RvcmVba2V5XS5cbiAgICBsZXQga2V5O1xuICAgIGlmICgob3B0ICE9PSAkc2VsZikgJiYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tvcHRdLnR5cGUgIT09ICdoYXNNYW55JykpIHtcbiAgICAgIGtleSA9ICRzZWxmO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXkgPSBvcHQ7XG4gICAgfVxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBpZiAoa2V5ID09PSAkc2VsZikge1xuICAgICAgICBpZiAodGhpc1skbG9hZGVkXVskc2VsZl0gPT09IGZhbHNlICYmIHRoaXNbJHBsdW1wXSkge1xuICAgICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZ2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoKHRoaXNbJGxvYWRlZF1ba2V5XSA9PT0gZmFsc2UpICYmIHRoaXNbJHBsdW1wXSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWxvbmVseS1pZlxuICAgICAgICAgIHJldHVybiB0aGlzLiRyZWxhdGlvbnNoaXBzW2tleV0uJGxpc3QoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLnRoZW4oKHYpID0+IHtcbiAgICAgIGlmICh2ID09PSB0cnVlKSB7XG4gICAgICAgIGlmIChrZXkgPT09ICRzZWxmKSB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXNbJHN0b3JlXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHsgW2tleV06IHRoaXNbJHN0b3JlXVtrZXldIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHYgJiYgKHZbJHNlbGZdICE9PSBudWxsKSkge1xuICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odik7XG4gICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IHRydWU7XG4gICAgICAgIGlmIChrZXkgPT09ICRzZWxmKSB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXNbJHN0b3JlXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHsgW2tleV06IHRoaXNbJHN0b3JlXVtrZXldIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICRzYXZlKCkge1xuICAgIHJldHVybiB0aGlzLiRzZXQoKTtcbiAgfVxuXG4gICRzZXQodSA9IHRoaXNbJHN0b3JlXSkge1xuICAgIGNvbnN0IHVwZGF0ZSA9IG1lcmdlT3B0aW9ucyh7fSwgdGhpc1skc3RvcmVdLCB1KTtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgICBkZWxldGUgdXBkYXRlW2tleV07XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHVwZGF0ZSk7IC8vIHRoaXMgaXMgdGhlIG9wdGltaXN0aWMgdXBkYXRlO1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0uc2F2ZSh0aGlzLmNvbnN0cnVjdG9yLCB1cGRhdGUpXG4gICAgLnRoZW4oKHVwZGF0ZWQpID0+IHtcbiAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh1cGRhdGVkKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0pO1xuICB9XG5cbiAgJGRlbGV0ZSgpIHtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLmRlbGV0ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCk7XG4gIH1cblxuICAkcmVzdChvcHRzKSB7XG4gICAgY29uc3QgcmVzdE9wdHMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICBvcHRzLFxuICAgICAge1xuICAgICAgICB1cmw6IGAvJHt0aGlzLmNvbnN0cnVjdG9yLiRuYW1lfS8ke3RoaXMuJGlkfS8ke29wdHMudXJsfWAsXG4gICAgICB9XG4gICAgKTtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLnJlc3RSZXF1ZXN0KHJlc3RPcHRzKTtcbiAgfVxuXG4gICRhZGQoa2V5LCBpdGVtLCBleHRyYXMpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgICBsZXQgaWQgPSAwO1xuICAgICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgICB9IGVsc2UgaWYgKGl0ZW0uJGlkKSB7XG4gICAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZCA9IGl0ZW1bdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0ucmVsYXRpb25zaGlwLiRzaWRlc1trZXldLm90aGVyLmZpZWxkXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0uYWRkKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkLCBleHRyYXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gYWRkZWQgdG8gaGFzTWFueScpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJykpO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKGwpID0+IHtcbiAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh7IFtrZXldOiBsIH0pO1xuICAgICAgcmV0dXJuIGw7XG4gICAgfSk7XG4gIH1cblxuICAkbW9kaWZ5UmVsYXRpb25zaGlwKGtleSwgaXRlbSwgZXh0cmFzKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gW107XG4gICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLm1vZGlmeVJlbGF0aW9uc2hpcCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpZCwgZXh0cmFzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gYWRkZWQgdG8gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICRyZW1vdmUoa2V5LCBpdGVtKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gW107XG4gICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLnJlbW92ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtICRyZW1vdmVkIGZyb20gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkcmVtb3ZlIGV4Y2VwdCBmcm9tIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG5cbiAgJHRlYXJkb3duKCkge1xuICAgIGlmICh0aGlzWyR1bnN1YnNjcmliZV0pIHtcbiAgICAgIHRoaXNbJHVuc3Vic2NyaWJlXS51bnN1YnNjcmliZSgpO1xuICAgIH1cbiAgfVxufVxuXG5Nb2RlbC5mcm9tSlNPTiA9IGZ1bmN0aW9uIGZyb21KU09OKGpzb24pIHtcbiAgdGhpcy4kaWQgPSBqc29uLiRpZCB8fCAnaWQnO1xuICB0aGlzLiRuYW1lID0ganNvbi4kbmFtZTtcbiAgdGhpcy4kZmllbGRzID0ge307XG4gIE9iamVjdC5rZXlzKGpzb24uJGZpZWxkcykuZm9yRWFjaCgoaykgPT4ge1xuICAgIGNvbnN0IGZpZWxkID0ganNvbi4kZmllbGRzW2tdO1xuICAgIGlmIChmaWVsZC50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGNsYXNzIER5bmFtaWNSZWxhdGlvbnNoaXAgZXh0ZW5kcyBSZWxhdGlvbnNoaXAge31cbiAgICAgIER5bmFtaWNSZWxhdGlvbnNoaXAuZnJvbUpTT04oZmllbGQucmVsYXRpb25zaGlwKTtcbiAgICAgIHRoaXMuJGZpZWxkc1trXSA9IHtcbiAgICAgICAgdHlwZTogJ2hhc01hbnknLFxuICAgICAgICByZWxhdGlvbnNoaXA6IER5bmFtaWNSZWxhdGlvbnNoaXAsXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiRmaWVsZHNba10gPSBPYmplY3QuYXNzaWduKHt9LCBmaWVsZCk7XG4gICAgfVxuICB9KTtcbn07XG5cbk1vZGVsLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTigpIHtcbiAgY29uc3QgcmV0VmFsID0ge1xuICAgICRpZDogdGhpcy4kaWQsXG4gICAgJG5hbWU6IHRoaXMuJG5hbWUsXG4gICAgJGZpZWxkczoge30sXG4gIH07XG4gIGNvbnN0IGZpZWxkTmFtZXMgPSBPYmplY3Qua2V5cyh0aGlzLiRmaWVsZHMpO1xuICBmaWVsZE5hbWVzLmZvckVhY2goKGspID0+IHtcbiAgICBpZiAodGhpcy4kZmllbGRzW2tdLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgcmV0VmFsLiRmaWVsZHNba10gPSB7XG4gICAgICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICAgICAgcmVsYXRpb25zaGlwOiB0aGlzLiRmaWVsZHNba10ucmVsYXRpb25zaGlwLnRvSlNPTigpLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0VmFsLiRmaWVsZHNba10gPSB0aGlzLiRmaWVsZHNba107XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHJldFZhbDtcbn07XG5cbk1vZGVsLiRyZXN0ID0gZnVuY3Rpb24gJHJlc3QocGx1bXAsIG9wdHMpIHtcbiAgY29uc3QgcmVzdE9wdHMgPSBPYmplY3QuYXNzaWduKFxuICAgIHt9LFxuICAgIG9wdHMsXG4gICAge1xuICAgICAgdXJsOiBgLyR7dGhpcy4kbmFtZX0vJHtvcHRzLnVybH1gLFxuICAgIH1cbiAgKTtcbiAgcmV0dXJuIHBsdW1wLnJlc3RSZXF1ZXN0KHJlc3RPcHRzKTtcbn07XG5cbk1vZGVsLmFzc2lnbiA9IGZ1bmN0aW9uIGFzc2lnbihvcHRzKSB7XG4gIGNvbnN0IHN0YXJ0ID0ge307XG4gIE9iamVjdC5rZXlzKHRoaXMuJGZpZWxkcykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgaWYgKG9wdHNba2V5XSkge1xuICAgICAgc3RhcnRba2V5XSA9IG9wdHNba2V5XTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuJGZpZWxkc1trZXldLmRlZmF1bHQpIHtcbiAgICAgIHN0YXJ0W2tleV0gPSB0aGlzLiRmaWVsZHNba2V5XS5kZWZhdWx0O1xuICAgIH0gZWxzZSBpZiAodGhpcy4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBzdGFydFtrZXldID0gW107XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXJ0W2tleV0gPSBudWxsO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBzdGFydDtcbn07XG5cbk1vZGVsLiRpZCA9ICdpZCc7XG5Nb2RlbC4kbmFtZSA9ICdCYXNlJztcbk1vZGVsLiRzZWxmID0gJHNlbGY7XG5Nb2RlbC4kZmllbGRzID0ge1xuICBpZDoge1xuICAgIHR5cGU6ICdudW1iZXInLFxuICB9LFxufTtcbiJdfQ==
