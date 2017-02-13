'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Model = exports.$all = exports.$self = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _relationship = require('./relationship');

var _mergeOptions2 = require('merge-options');

var _mergeOptions3 = _interopRequireDefault(_mergeOptions2);

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
    key: '$$isLoaded',
    value: function $$isLoaded(key) {
      var _this2 = this;

      if (key === $all) {
        return Object.keys(this[$loaded]).map(function (k) {
          return _this2[$loaded][k];
        }).reduce(function (acc, curr) {
          return acc && curr;
        }, true);
      } else {
        return this[$loaded][key];
      }
    }
  }, {
    key: '$$copyValuesFrom',
    value: function $$copyValuesFrom() {
      var _this3 = this;

      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      Object.keys(this.constructor.$fields).forEach(function (fieldName) {
        if (opts[fieldName] !== undefined) {
          // copy from opts to the best of our ability
          if (_this3.constructor.$fields[fieldName].type === 'array' || _this3.constructor.$fields[fieldName].type === 'hasMany') {
            _this3[$store][fieldName] = (opts[fieldName] || []).concat();
            _this3[$loaded][fieldName] = true;
          } else if (_this3.constructor.$fields[fieldName].type === 'object') {
            _this3[$store][fieldName] = Object.assign({}, opts[fieldName]);
          } else {
            _this3[$store][fieldName] = opts[fieldName];
          }
        }
      });
      this.$$fireUpdate();
    }
  }, {
    key: '$$hookToPlump',
    value: function $$hookToPlump() {
      var _this4 = this;

      if (this[$unsubscribe] === undefined) {
        this[$unsubscribe] = this[$plump].subscribe(this.constructor.$name, this.$id, function (_ref) {
          var field = _ref.field,
              value = _ref.value;

          if (field !== undefined) {
            // this.$$copyValuesFrom(value);
            _this4.$$copyValuesFrom(_defineProperty({}, field, value));
          } else {
            _this4.$$copyValuesFrom(value);
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
      if (this[$loaded][$self] === false) {
        this[$plump].streamGet(this.constructor, this.$id, fields).subscribe(function (v) {
          return _this5.$$copyValuesFrom(v);
        });
      }
      return this[$subject].subscribe(cb);
    }
  }, {
    key: '$$fireUpdate',
    value: function $$fireUpdate() {
      this[$subject].next(this[$store]);
    }
  }, {
    key: '$get',
    value: function $get() {
      var _this6 = this;

      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : $self;

      var keys = void 0;
      if (Array.isArray(opts)) {
        keys = opts;
      } else {
        keys = [opts];
      }
      return _bluebird2.default.all(keys.map(function (key) {
        return _this6.$$singleGet(key);
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
      var _this7 = this;

      var opt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : $self;

      // X cases.
      // key === $all - fetch all fields unless loaded, return all fields
      // $fields[key].type === 'hasMany', - fetch children (perhaps move this decision to store)
      // otherwise - fetch non-hasMany fields unless already loaded, return all non-hasMany fields
      var key = void 0;
      if (opt !== $self && opt !== $all && this.constructor.$fields[opt].type !== 'hasMany') {
        key = $self;
      } else {
        key = opt;
      }

      return _bluebird2.default.resolve().then(function () {
        if (!_this7.$$isLoaded(key) && _this7[$plump]) {
          if ((typeof key === 'undefined' ? 'undefined' : _typeof(key)) === 'symbol') {
            // key === $self or $all
            return _this7[$plump].get(_this7.constructor, _this7.$id, key);
          } else {
            return _this7.$relationships[key].$list();
          }
        } else {
          return true;
        }
      }).then(function (v) {
        if (v === true) {
          if (key === $self) {
            var retVal = {};
            for (var k in _this7[$store]) {
              if (_this7.constructor.$fields[k].type !== 'hasMany') {
                retVal[k] = _this7[$store][k];
              }
            }
            return retVal;
          } else {
            return Object.assign({}, _defineProperty({}, key, _this7[$store][key]));
          }
        } else if (v && v[$self] !== null) {
          _this7.$$copyValuesFrom(v);
          if (key === $all) {
            for (var _k in _this7[$loaded]) {
              // eslint-disable-line guard-for-in
              _this7[$loaded][_k] = true;
            }
          } else {
            _this7[$loaded][key] = true;
          }
          if (key === $self) {
            var _retVal = {};
            for (var _k2 in _this7[$store]) {
              if (_this7.constructor.$fields[_k2].type !== 'hasMany') {
                _retVal[_k2] = _this7[$store][_k2]; // TODO: deep copy of object
              }
            }
            return _retVal;
          } else if (key === $all) {
            return (0, _mergeOptions3.default)({}, _this7[$store]);
          } else {
            return (0, _mergeOptions3.default)({}, _defineProperty({}, key, _this7[$store][key]));
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
      var _this8 = this;

      var u = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this[$store];

      var update = (0, _mergeOptions3.default)({}, this[$store], u);
      Object.keys(this.constructor.$fields).forEach(function (key) {
        if (_this8.constructor.$fields[key].type === 'hasMany') {
          delete update[key];
        }
      });
      // this.$$copyValuesFrom(update); // this is the optimistic update;
      return this[$plump].save(this.constructor, update).then(function (updated) {
        _this8.$$copyValuesFrom(updated);
        return _this8;
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
      var _this9 = this;

      return _bluebird2.default.resolve().then(function () {
        if (_this9.constructor.$fields[key].type === 'hasMany') {
          var id = 0;
          if (typeof item === 'number') {
            id = item;
          } else if (item.$id) {
            id = item.$id;
          } else {
            id = item[_this9.constructor.$fields[key].relationship.$sides[key].other.field];
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
  }, {
    key: '$$relatedFields',
    get: function get() {
      return Object.keys(this.constructor.$include);
    }
  }, {
    key: '$$path',
    get: function get() {
      return '/' + this.$name + '/' + this.$id;
    }
  }, {
    key: '$$dataJSON',
    get: function get() {
      return {
        type: this.$name,
        id: this.$id
      };
    }
  }]);

  return Model;
}();

Model.fromJSON = function fromJSON(json) {
  var _this11 = this;

  this.$id = json.$id || 'id';
  this.$name = json.$name;
  this.$include = json.$include;
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
      _this11.$fields[k] = {
        type: 'hasMany',
        relationship: DynamicRelationship
      };
    } else {
      _this11.$fields[k] = Object.assign({}, field);
    }
  });
};

Model.toJSON = function toJSON() {
  var _this12 = this;

  var retVal = {
    $id: this.$id,
    $name: this.$name,
    $include: this.$include,
    $fields: {}
  };
  var fieldNames = Object.keys(this.$fields);
  fieldNames.forEach(function (k) {
    if (_this12.$fields[k].type === 'hasMany') {
      retVal.$fields[k] = {
        type: 'hasMany',
        relationship: _this12.$fields[k].relationship.toJSON()
      };
    } else {
      retVal.$fields[k] = _this12.$fields[k];
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
  var _this13 = this;

  var start = {};
  Object.keys(this.$fields).forEach(function (key) {
    if (opts[key]) {
      start[key] = opts[key];
    } else if (_this13.$fields[key].default) {
      start[key] = _this13.$fields[key].default;
    } else if (_this13.$fields[key].type === 'hasMany') {
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
Model.$included = [];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRzdG9yZSIsIlN5bWJvbCIsIiRwbHVtcCIsIiRsb2FkZWQiLCIkdW5zdWJzY3JpYmUiLCIkc3ViamVjdCIsIiRzZWxmIiwiJGFsbCIsIk1vZGVsIiwib3B0cyIsInBsdW1wIiwiJHJlbGF0aW9uc2hpcHMiLCJuZXh0IiwiT2JqZWN0Iiwia2V5cyIsImNvbnN0cnVjdG9yIiwiJGZpZWxkcyIsImZvckVhY2giLCJrZXkiLCJ0eXBlIiwiUmVsIiwicmVsYXRpb25zaGlwIiwiZGVmYXVsdCIsIiQkY29weVZhbHVlc0Zyb20iLCJtYXAiLCJrIiwicmVkdWNlIiwiYWNjIiwiY3VyciIsImZpZWxkTmFtZSIsInVuZGVmaW5lZCIsImNvbmNhdCIsImFzc2lnbiIsIiQkZmlyZVVwZGF0ZSIsInN1YnNjcmliZSIsIiRuYW1lIiwiJGlkIiwiZmllbGQiLCJ2YWx1ZSIsImZpZWxkcyIsImNiIiwibGVuZ3RoIiwiQXJyYXkiLCJpc0FycmF5IiwiJCRob29rVG9QbHVtcCIsInN0cmVhbUdldCIsInYiLCJhbGwiLCIkJHNpbmdsZUdldCIsInRoZW4iLCJ2YWx1ZUFycmF5Iiwic2VsZklkeCIsImluZGV4T2YiLCJhY2N1bSIsIm9wdCIsInJlc29sdmUiLCIkJGlzTG9hZGVkIiwiZ2V0IiwiJGxpc3QiLCJyZXRWYWwiLCIkc2V0IiwidSIsInVwZGF0ZSIsInNhdmUiLCJ1cGRhdGVkIiwiZGVsZXRlIiwicmVzdE9wdHMiLCJ1cmwiLCJyZXN0UmVxdWVzdCIsIml0ZW0iLCJleHRyYXMiLCJpZCIsIiRzaWRlcyIsIm90aGVyIiwiYWRkIiwicmVqZWN0IiwiRXJyb3IiLCJsIiwibW9kaWZ5UmVsYXRpb25zaGlwIiwicmVtb3ZlIiwidW5zdWJzY3JpYmUiLCIkaW5jbHVkZSIsImZyb21KU09OIiwianNvbiIsIkR5bmFtaWNSZWxhdGlvbnNoaXAiLCJ0b0pTT04iLCJmaWVsZE5hbWVzIiwiJHJlc3QiLCJzdGFydCIsIiRpbmNsdWRlZCJdLCJtYXBw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R0FBTCxDQUFKLEVBQWU7QUFDYnNFLFlBQU10RSxHQUFOLElBQWFULEtBQUtTLEdBQUwsQ0FBYjtBQUNELEtBRkQsTUFFTyxJQUFJLFFBQUtGLE9BQUwsQ0FBYUUsR0FBYixFQUFrQkksT0FBdEIsRUFBK0I7QUFDcENrRSxZQUFNdEUsR0FBTixJQUFhLFFBQUtGLE9BQUwsQ0FBYUUsR0FBYixFQUFrQkksT0FBL0I7QUFDRCxLQUZNLE1BRUEsSUFBSSxRQUFLTixPQUFMLENBQWFFLEdBQWIsRUFBa0JDLElBQWxCLEtBQTJCLFNBQS9CLEVBQTBDO0FBQy9DcUUsWUFBTXRFLEdBQU4sSUFBYSxFQUFiO0FBQ0QsS0FGTSxNQUVBO0FBQ0xzRSxZQUFNdEUsR0FBTixJQUFhLElBQWI7QUFDRDtBQUNGLEdBVkQ7QUFXQSxTQUFPc0UsS0FBUDtBQUNELENBZEQ7O0FBZ0JBaEYsTUFBTTRCLEdBQU4sR0FBWSxJQUFaO0FBQ0E1QixNQUFNMkIsS0FBTixHQUFjLE1BQWQ7QUFDQTNCLE1BQU1GLEtBQU4sR0FBY0EsS0FBZDtBQUNBRSxNQUFNUSxPQUFOLEdBQWdCO0FBQ2R1RCxNQUFJO0FBQ0ZwRCxVQUFNO0FBREo7QUFEVSxDQUFoQjtBQUtBWCxNQUFNaUYsU0FBTixHQUFrQixFQUFsQiIsImZpbGUiOiJtb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBSZWxhdGlvbnNoaXAgfSBmcm9tICcuL3JlbGF0aW9uc2hpcCc7XG5pbXBvcnQgbWVyZ2VPcHRpb25zIGZyb20gJ21lcmdlLW9wdGlvbnMnO1xuaW1wb3J0IHsgQmVoYXZpb3JTdWJqZWN0IH0gZnJvbSAncnhqcy9SeCc7XG5jb25zdCAkc3RvcmUgPSBTeW1ib2woJyRzdG9yZScpO1xuY29uc3QgJHBsdW1wID0gU3ltYm9sKCckcGx1bXAnKTtcbmNvbnN0ICRsb2FkZWQgPSBTeW1ib2woJyRsb2FkZWQnKTtcbmNvbnN0ICR1bnN1YnNjcmliZSA9IFN5bWJvbCgnJHVuc3Vic2NyaWJlJyk7XG5jb25zdCAkc3ViamVjdCA9IFN5bWJvbCgnJHN1YmplY3QnKTtcbmV4cG9ydCBjb25zdCAkc2VsZiA9IFN5bWJvbCgnJHNlbGYnKTtcbmV4cG9ydCBjb25zdCAkYWxsID0gU3ltYm9sKCckYWxsJyk7XG5cbi8vIFRPRE86IGZpZ3VyZSBvdXQgd2hlcmUgZXJyb3IgZXZlbnRzIG9yaWdpbmF0ZSAoc3RvcmFnZSBvciBtb2RlbClcbi8vIGFuZCB3aG8ga2VlcHMgYSByb2xsLWJhY2thYmxlIGRlbHRhXG5cbmV4cG9ydCBjbGFzcyBNb2RlbCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMsIHBsdW1wKSB7XG4gICAgdGhpc1skc3RvcmVdID0ge307XG4gICAgdGhpcy4kcmVsYXRpb25zaGlwcyA9IHt9O1xuICAgIHRoaXNbJHN1YmplY3RdID0gbmV3IEJlaGF2aW9yU3ViamVjdCgpO1xuICAgIHRoaXNbJHN1YmplY3RdLm5leHQoe30pO1xuICAgIHRoaXNbJGxvYWRlZF0gPSB7XG4gICAgICBbJHNlbGZdOiBmYWxzZSxcbiAgICB9O1xuICAgIE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkcykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICAgIGNvbnN0IFJlbCA9IHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnJlbGF0aW9uc2hpcDtcbiAgICAgICAgdGhpcy4kcmVsYXRpb25zaGlwc1trZXldID0gbmV3IFJlbCh0aGlzLCBrZXksIHBsdW1wKTtcbiAgICAgICAgdGhpc1skc3RvcmVdW2tleV0gPSBbXTtcbiAgICAgICAgdGhpc1skbG9hZGVkXVtrZXldID0gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzWyRzdG9yZV1ba2V5XSA9IHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLmRlZmF1bHQgfHwgbnVsbDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20ob3B0cyB8fCB7fSk7XG4gICAgaWYgKHBsdW1wKSB7XG4gICAgICB0aGlzWyRwbHVtcF0gPSBwbHVtcDtcbiAgICB9XG4gIH1cblxuICBnZXQgJG5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuJG5hbWU7XG4gIH1cblxuICBnZXQgJGlkKCkge1xuICAgIHJldHVybiB0aGlzWyRzdG9yZV1bdGhpcy5jb25zdHJ1Y3Rvci4kaWRdO1xuICB9XG5cbiAgZ2V0ICQkcmVsYXRlZEZpZWxkcygpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kaW5jbHVkZSk7XG4gIH1cblxuICBnZXQgJCRwYXRoKCkge1xuICAgIHJldHVybiBgLyR7dGhpcy4kbmFtZX0vJHt0aGlzLiRpZH1gO1xuICB9XG5cbiAgZ2V0ICQkZGF0YUpTT04oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMuJG5hbWUsXG4gICAgICBpZDogdGhpcy4kaWQsXG4gICAgfTtcbiAgfVxuXG4gICQkaXNMb2FkZWQoa2V5KSB7XG4gICAgaWYgKGtleSA9PT0gJGFsbCkge1xuICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXNbJGxvYWRlZF0pXG4gICAgICAgIC5tYXAoayA9PiB0aGlzWyRsb2FkZWRdW2tdKVxuICAgICAgICAucmVkdWNlKChhY2MsIGN1cnIpID0+IGFjYyAmJiBjdXJyLCB0cnVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXNbJGxvYWRlZF1ba2V5XTtcbiAgICB9XG4gIH1cblxuICAkJGNvcHlWYWx1ZXNGcm9tKG9wdHMgPSB7fSkge1xuICAgIE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkcykuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICBpZiAob3B0c1tmaWVsZE5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gY29weSBmcm9tIG9wdHMgdG8gdGhlIGJlc3Qgb2Ygb3VyIGFiaWxpdHlcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnYXJyYXknKSB8fFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnaGFzTWFueScpXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gKG9wdHNbZmllbGROYW1lXSB8fCBbXSkuY29uY2F0KCk7XG4gICAgICAgICAgdGhpc1skbG9hZGVkXVtmaWVsZE5hbWVdID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0c1tmaWVsZE5hbWVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IG9wdHNbZmllbGROYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuJCRmaXJlVXBkYXRlKCk7XG4gIH1cblxuICAkJGhvb2tUb1BsdW1wKCkge1xuICAgIGlmICh0aGlzWyR1bnN1YnNjcmliZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skdW5zdWJzY3JpYmVdID0gdGhpc1skcGx1bXBdLnN1YnNjcmliZSh0aGlzLmNvbnN0cnVjdG9yLiRuYW1lLCB0aGlzLiRpZCwgKHsgZmllbGQsIHZhbHVlIH0pID0+IHtcbiAgICAgICAgaWYgKGZpZWxkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAvLyB0aGlzLiQkY29weVZhbHVlc0Zyb20odmFsdWUpO1xuICAgICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh7IFtmaWVsZF06IHZhbHVlIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gICRzdWJzY3JpYmUoLi4uYXJncykge1xuICAgIGxldCBmaWVsZHMgPSBbJHNlbGZdO1xuICAgIGxldCBjYjtcbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDIpIHtcbiAgICAgIGZpZWxkcyA9IGFyZ3NbMF07XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZmllbGRzKSkge1xuICAgICAgICBmaWVsZHMgPSBbZmllbGRzXTtcbiAgICAgIH1cbiAgICAgIGNiID0gYXJnc1sxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2IgPSBhcmdzWzBdO1xuICAgIH1cbiAgICB0aGlzLiQkaG9va1RvUGx1bXAoKTtcbiAgICBpZiAodGhpc1skbG9hZGVkXVskc2VsZl0gPT09IGZhbHNlKSB7XG4gICAgICB0aGlzWyRwbHVtcF0uc3RyZWFtR2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBmaWVsZHMpXG4gICAgICAuc3Vic2NyaWJlKCh2KSA9PiB0aGlzLiQkY29weVZhbHVlc0Zyb20odikpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpc1skc3ViamVjdF0uc3Vic2NyaWJlKGNiKTtcbiAgfVxuXG4gICQkZmlyZVVwZGF0ZSgpIHtcbiAgICB0aGlzWyRzdWJqZWN0XS5uZXh0KHRoaXNbJHN0b3JlXSk7XG4gIH1cblxuICAkZ2V0KG9wdHMgPSAkc2VsZikge1xuICAgIGxldCBrZXlzO1xuICAgIGlmIChBcnJheS5pc0FycmF5KG9wdHMpKSB7XG4gICAgICBrZXlzID0gb3B0cztcbiAgICB9IGVsc2Uge1xuICAgICAga2V5cyA9IFtvcHRzXTtcbiAgICB9XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChrZXlzLm1hcCgoa2V5KSA9PiB0aGlzLiQkc2luZ2xlR2V0KGtleSkpKVxuICAgIC50aGVuKCh2YWx1ZUFycmF5KSA9PiB7XG4gICAgICBjb25zdCBzZWxmSWR4ID0ga2V5cy5pbmRleE9mKCRzZWxmKTtcbiAgICAgIGlmICgoc2VsZklkeCA+PSAwKSAmJiAodmFsdWVBcnJheVtzZWxmSWR4XSA9PT0gbnVsbCkpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdmFsdWVBcnJheS5yZWR1Y2UoKGFjY3VtLCBjdXJyKSA9PiBPYmplY3QuYXNzaWduKGFjY3VtLCBjdXJyKSwge30pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgJCRzaW5nbGVHZXQob3B0ID0gJHNlbGYpIHtcbiAgICAvLyBYIGNhc2VzLlxuICAgIC8vIGtleSA9PT0gJGFsbCAtIGZldGNoIGFsbCBmaWVsZHMgdW5sZXNzIGxvYWRlZCwgcmV0dXJuIGFsbCBmaWVsZHNcbiAgICAvLyAkZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknLCAtIGZldGNoIGNoaWxkcmVuIChwZXJoYXBzIG1vdmUgdGhpcyBkZWNpc2lvbiB0byBzdG9yZSlcbiAgICAvLyBvdGhlcndpc2UgLSBmZXRjaCBub24taGFzTWFueSBmaWVsZHMgdW5sZXNzIGFscmVhZHkgbG9hZGVkLCByZXR1cm4gYWxsIG5vbi1oYXNNYW55IGZpZWxkc1xuICAgIGxldCBrZXk7XG4gICAgaWYgKChvcHQgIT09ICRzZWxmKSAmJiAob3B0ICE9PSAkYWxsKSAmJiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW29wdF0udHlwZSAhPT0gJ2hhc01hbnknKSkge1xuICAgICAga2V5ID0gJHNlbGY7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtleSA9IG9wdDtcbiAgICB9XG5cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLiQkaXNMb2FkZWQoa2V5KSAmJiB0aGlzWyRwbHVtcF0pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzeW1ib2wnKSB7IC8vIGtleSA9PT0gJHNlbGYgb3IgJGFsbFxuICAgICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZ2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzLiRyZWxhdGlvbnNoaXBzW2tleV0uJGxpc3QoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfSkudGhlbigodikgPT4ge1xuICAgICAgaWYgKHYgPT09IHRydWUpIHtcbiAgICAgICAgaWYgKGtleSA9PT0gJHNlbGYpIHtcbiAgICAgICAgICBjb25zdCByZXRWYWwgPSB7fTtcbiAgICAgICAgICBmb3IgKGNvbnN0IGsgaW4gdGhpc1skc3RvcmVdKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tdLnR5cGUgIT09ICdoYXNNYW55Jykge1xuICAgICAgICAgICAgICByZXRWYWxba10gPSB0aGlzWyRzdG9yZV1ba107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXRWYWw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHsgW2tleV06IHRoaXNbJHN0b3JlXVtrZXldIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHYgJiYgKHZbJHNlbGZdICE9PSBudWxsKSkge1xuICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odik7XG4gICAgICAgIGlmIChrZXkgPT09ICRhbGwpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGsgaW4gdGhpc1skbG9hZGVkXSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGd1YXJkLWZvci1pblxuICAgICAgICAgICAgdGhpc1skbG9hZGVkXVtrXSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtleSA9PT0gJHNlbGYpIHtcbiAgICAgICAgICBjb25zdCByZXRWYWwgPSB7fTtcbiAgICAgICAgICBmb3IgKGNvbnN0IGsgaW4gdGhpc1skc3RvcmVdKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tdLnR5cGUgIT09ICdoYXNNYW55Jykge1xuICAgICAgICAgICAgICByZXRWYWxba10gPSB0aGlzWyRzdG9yZV1ba107IC8vIFRPRE86IGRlZXAgY29weSBvZiBvYmplY3RcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJldFZhbDtcbiAgICAgICAgfSBlbHNlIGlmIChrZXkgPT09ICRhbGwpIHtcbiAgICAgICAgICByZXR1cm4gbWVyZ2VPcHRpb25zKHt9LCB0aGlzWyRzdG9yZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBtZXJnZU9wdGlvbnMoe30sIHsgW2tleV06IHRoaXNbJHN0b3JlXVtrZXldIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICRzYXZlKCkge1xuICAgIHJldHVybiB0aGlzLiRzZXQoKTtcbiAgfVxuXG4gICRzZXQodSA9IHRoaXNbJHN0b3JlXSkge1xuICAgIGNvbnN0IHVwZGF0ZSA9IG1lcmdlT3B0aW9ucyh7fSwgdGhpc1skc3RvcmVdLCB1KTtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgICBkZWxldGUgdXBkYXRlW2tleV07XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHVwZGF0ZSk7IC8vIHRoaXMgaXMgdGhlIG9wdGltaXN0aWMgdXBkYXRlO1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0uc2F2ZSh0aGlzLmNvbnN0cnVjdG9yLCB1cGRhdGUpXG4gICAgLnRoZW4oKHVwZGF0ZWQpID0+IHtcbiAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh1cGRhdGVkKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0pO1xuICB9XG5cbiAgJGRlbGV0ZSgpIHtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLmRlbGV0ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCk7XG4gIH1cblxuICAkcmVzdChvcHRzKSB7XG4gICAgY29uc3QgcmVzdE9wdHMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICBvcHRzLFxuICAgICAge1xuICAgICAgICB1cmw6IGAvJHt0aGlzLmNvbnN0cnVjdG9yLiRuYW1lfS8ke3RoaXMuJGlkfS8ke29wdHMudXJsfWAsXG4gICAgICB9XG4gICAgKTtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLnJlc3RSZXF1ZXN0KHJlc3RPcHRzKTtcbiAgfVxuXG4gICRhZGQoa2V5LCBpdGVtLCBleHRyYXMpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgICBsZXQgaWQgPSAwO1xuICAgICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgICB9IGVsc2UgaWYgKGl0ZW0uJGlkKSB7XG4gICAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZCA9IGl0ZW1bdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0ucmVsYXRpb25zaGlwLiRzaWRlc1trZXldLm90aGVyLmZpZWxkXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0uYWRkKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkLCBleHRyYXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gYWRkZWQgdG8gaGFzTWFueScpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJykpO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKGwpID0+IHtcbiAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh7IFtrZXldOiBsIH0pO1xuICAgICAgcmV0dXJuIGw7XG4gICAgfSk7XG4gIH1cblxuICAkbW9kaWZ5UmVsYXRpb25zaGlwKGtleSwgaXRlbSwgZXh0cmFzKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gW107XG4gICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLm1vZGlmeVJlbGF0aW9uc2hpcCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpZCwgZXh0cmFzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gYWRkZWQgdG8gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICRyZW1vdmUoa2V5LCBpdGVtKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gW107XG4gICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLnJlbW92ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtICRyZW1vdmVkIGZyb20gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkcmVtb3ZlIGV4Y2VwdCBmcm9tIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG5cbiAgJHRlYXJkb3duKCkge1xuICAgIGlmICh0aGlzWyR1bnN1YnNjcmliZV0pIHtcbiAgICAgIHRoaXNbJHVuc3Vic2NyaWJlXS51bnN1YnNjcmliZSgpO1xuICAgIH1cbiAgfVxufVxuXG5Nb2RlbC5mcm9tSlNPTiA9IGZ1bmN0aW9uIGZyb21KU09OKGpzb24pIHtcbiAgdGhpcy4kaWQgPSBqc29uLiRpZCB8fCAnaWQnO1xuICB0aGlzLiRuYW1lID0ganNvbi4kbmFtZTtcbiAgdGhpcy4kaW5jbHVkZSA9IGpzb24uJGluY2x1ZGU7XG4gIHRoaXMuJGZpZWxkcyA9IHt9O1xuICBPYmplY3Qua2V5cyhqc29uLiRmaWVsZHMpLmZvckVhY2goKGspID0+IHtcbiAgICBjb25zdCBmaWVsZCA9IGpzb24uJGZpZWxkc1trXTtcbiAgICBpZiAoZmllbGQudHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBjbGFzcyBEeW5hbWljUmVsYXRpb25zaGlwIGV4dGVuZHMgUmVsYXRpb25zaGlwIHt9XG4gICAgICBEeW5hbWljUmVsYXRpb25zaGlwLmZyb21KU09OKGZpZWxkLnJlbGF0aW9uc2hpcCk7XG4gICAgICB0aGlzLiRmaWVsZHNba10gPSB7XG4gICAgICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICAgICAgcmVsYXRpb25zaGlwOiBEeW5hbWljUmVsYXRpb25zaGlwLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kZmllbGRzW2tdID0gT2JqZWN0LmFzc2lnbih7fSwgZmllbGQpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5Nb2RlbC50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04oKSB7XG4gIGNvbnN0IHJldFZhbCA9IHtcbiAgICAkaWQ6IHRoaXMuJGlkLFxuICAgICRuYW1lOiB0aGlzLiRuYW1lLFxuICAgICRpbmNsdWRlOiB0aGlzLiRpbmNsdWRlLFxuICAgICRmaWVsZHM6IHt9LFxuICB9O1xuICBjb25zdCBmaWVsZE5hbWVzID0gT2JqZWN0LmtleXModGhpcy4kZmllbGRzKTtcbiAgZmllbGROYW1lcy5mb3JFYWNoKChrKSA9PiB7XG4gICAgaWYgKHRoaXMuJGZpZWxkc1trXS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIHJldFZhbC4kZmllbGRzW2tdID0ge1xuICAgICAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgICAgIHJlbGF0aW9uc2hpcDogdGhpcy4kZmllbGRzW2tdLnJlbGF0aW9uc2hpcC50b0pTT04oKSxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldFZhbC4kZmllbGRzW2tdID0gdGhpcy4kZmllbGRzW2tdO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZXRWYWw7XG59O1xuXG5Nb2RlbC4kcmVzdCA9IGZ1bmN0aW9uICRyZXN0KHBsdW1wLCBvcHRzKSB7XG4gIGNvbnN0IHJlc3RPcHRzID0gT2JqZWN0LmFzc2lnbihcbiAgICB7fSxcbiAgICBvcHRzLFxuICAgIHtcbiAgICAgIHVybDogYC8ke3RoaXMuJG5hbWV9LyR7b3B0cy51cmx9YCxcbiAgICB9XG4gICk7XG4gIHJldHVybiBwbHVtcC5yZXN0UmVxdWVzdChyZXN0T3B0cyk7XG59O1xuXG5Nb2RlbC5hc3NpZ24gPSBmdW5jdGlvbiBhc3NpZ24ob3B0cykge1xuICBjb25zdCBzdGFydCA9IHt9O1xuICBPYmplY3Qua2V5cyh0aGlzLiRmaWVsZHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgIGlmIChvcHRzW2tleV0pIHtcbiAgICAgIHN0YXJ0W2tleV0gPSBvcHRzW2tleV07XG4gICAgfSBlbHNlIGlmICh0aGlzLiRmaWVsZHNba2V5XS5kZWZhdWx0KSB7XG4gICAgICBzdGFydFtrZXldID0gdGhpcy4kZmllbGRzW2tleV0uZGVmYXVsdDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgc3RhcnRba2V5XSA9IFtdO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGFydFtrZXldID0gbnVsbDtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gc3RhcnQ7XG59O1xuXG5Nb2RlbC4kaWQgPSAnaWQnO1xuTW9kZWwuJG5hbWUgPSAnQmFzZSc7XG5Nb2RlbC4kc2VsZiA9ICRzZWxmO1xuTW9kZWwuJGZpZWxkcyA9IHtcbiAgaWQ6IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbn07XG5Nb2RlbC4kaW5jbHVkZWQgPSBbXTtcbiJdfQ==
