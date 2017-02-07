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
        if (opts === $all) {
          keys = Object.keys(this.constructor.$fields).filter(function (key) {
            return _this5.constructor.$fields[key].type === 'hasMany';
          }).concat($self);
        } else {
          keys = [opts];
        }
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
            var retVal = {};
            for (var k in _this6[$store]) {
              if (_this6.constructor.$fields[k].type !== 'hasMany') {
                retVal[k] = _this6[$store][k];
              }
            }
            return retVal;
          } else {
            return Object.assign({}, _defineProperty({}, key, _this6[$store][key]));
          }
        } else if (v && v[$self] !== null) {
          _this6.$$copyValuesFrom(v);
          _this6[$loaded][key] = true;
          if (key === $self) {
            var _retVal = {};
            for (var _k in _this6[$store]) {
              if (_this6.constructor.$fields[_k].type !== 'hasMany') {
                _retVal[_k] = _this6[$store][_k];
              }
            }
            return _retVal;
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRzdG9yZSIsIlN5bWJvbCIsIiRwbHVtcCIsIiRsb2FkZWQiLCIkdW5zdWJzY3JpYmUiLCIkc3ViamVjdCIsIiRzZWxmIiwiJGFsbCIsIk1vZGVsIiwib3B0cyIsInBsdW1wIiwiJHJlbGF0aW9uc2hpcHMiLCJuZXh0IiwiT2JqZWN0Iiwia2V5cyIsImNvbnN0cnVjdG9yIiwiJGZpZWxkcyIsImZvckVhY2giLCJrZXkiLCJ0eXBlIiwiUmVsIiwicmVsYXRpb25zaGlwIiwiZGVmYXVsdCIsIiQkY29weVZhbHVlc0Zyb20iLCJmaWVsZE5hbWUiLCJ1bmRlZmluZWQiLCJjb25jYXQiLCJhc3NpZ24iLCIkJGZpcmVVcGRhdGUiLCJzdWJzY3JpYmUiLCIkbmFtZSIsIiRpZCIsImZpZWxkIiwidmFsdWUiLCJmaWVsZHMiLCJjYiIsImxlbmd0aCIsIkFycmF5IiwiaXNBcnJheSIsIiQkaG9va1RvUGx1bXAiLCJzdHJlYW1HZXQiLCJ2IiwiZmlsdGVyIiwiYWxsIiwibWFwIiwiJCRzaW5nbGVHZXQiLCJ0aGVuIiwidmFsdWVBcnJheSIsInNlbGZJZHgiLCJpbmRleE9mIiwicmVkdWNlIiwiYWNjdW0iLCJjdXJyIiwib3B0IiwicmVzb2x2ZSIsImdldCIsIiRsaXN0IiwicmV0VmFsIiwiayIsIiRzZXQiLCJ1IiwidXBkYXRlIiwic2F2ZSIsInVwZGF0ZWQiLCJkZWxldGUiLCJyZXN0T3B0cyIsInVybCIsInJlc3RSZXF1ZXN0IiwiaXRlbSIsImV4dHJhcyIsImlkIiwiJHNpZGVzIiwib3RoZXIiLCJhZGQiLCJyZWplY3QiLCJFcnJvciIsImwiLCJtb2RpZnlSZWxhdGlvbnNoaXAiLCJyZW1vdmUiLCJ1bnN1YnNjcmliZSIsImZyb21KU09OIiwianNvbiIsIkR5bmFtaWNSZWxhdGlvbnNoaXAiLCJ0b0pTT04iLCJmaWVsZE5hbWVzIiwiJHJlc3QiLCJzdGFydCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7QUFD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dXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBSZWxhdGlvbnNoaXAgfSBmcm9tICcuL3JlbGF0aW9uc2hpcCc7XG5pbXBvcnQgbWVyZ2VPcHRpb25zIGZyb20gJ21lcmdlLW9wdGlvbnMnO1xuaW1wb3J0IHsgQmVoYXZpb3JTdWJqZWN0IH0gZnJvbSAncnhqcy9SeCc7XG5jb25zdCAkc3RvcmUgPSBTeW1ib2woJyRzdG9yZScpO1xuY29uc3QgJHBsdW1wID0gU3ltYm9sKCckcGx1bXAnKTtcbmNvbnN0ICRsb2FkZWQgPSBTeW1ib2woJyRsb2FkZWQnKTtcbmNvbnN0ICR1bnN1YnNjcmliZSA9IFN5bWJvbCgnJHVuc3Vic2NyaWJlJyk7XG5jb25zdCAkc3ViamVjdCA9IFN5bWJvbCgnJHN1YmplY3QnKTtcbmV4cG9ydCBjb25zdCAkc2VsZiA9IFN5bWJvbCgnJHNlbGYnKTtcbmV4cG9ydCBjb25zdCAkYWxsID0gU3ltYm9sKCckYWxsJyk7XG5cbi8vIFRPRE86IGZpZ3VyZSBvdXQgd2hlcmUgZXJyb3IgZXZlbnRzIG9yaWdpbmF0ZSAoc3RvcmFnZSBvciBtb2RlbClcbi8vIGFuZCB3aG8ga2VlcHMgYSByb2xsLWJhY2thYmxlIGRlbHRhXG5cbmV4cG9ydCBjbGFzcyBNb2RlbCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMsIHBsdW1wKSB7XG4gICAgdGhpc1skc3RvcmVdID0ge307XG4gICAgdGhpcy4kcmVsYXRpb25zaGlwcyA9IHt9O1xuICAgIHRoaXNbJHN1YmplY3RdID0gbmV3IEJlaGF2aW9yU3ViamVjdCgpO1xuICAgIHRoaXNbJHN1YmplY3RdLm5leHQoe30pO1xuICAgIHRoaXNbJGxvYWRlZF0gPSB7XG4gICAgICBbJHNlbGZdOiBmYWxzZSxcbiAgICB9O1xuICAgIE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkcykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICAgIGNvbnN0IFJlbCA9IHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnJlbGF0aW9uc2hpcDtcbiAgICAgICAgdGhpcy4kcmVsYXRpb25zaGlwc1trZXldID0gbmV3IFJlbCh0aGlzLCBrZXksIHBsdW1wKTtcbiAgICAgICAgdGhpc1skc3RvcmVdW2tleV0gPSBbXTtcbiAgICAgICAgdGhpc1skbG9hZGVkXVtrZXldID0gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzWyRzdG9yZV1ba2V5XSA9IHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLmRlZmF1bHQgfHwgbnVsbDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20ob3B0cyB8fCB7fSk7XG4gICAgaWYgKHBsdW1wKSB7XG4gICAgICB0aGlzWyRwbHVtcF0gPSBwbHVtcDtcbiAgICB9XG4gIH1cblxuICBnZXQgJG5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuJG5hbWU7XG4gIH1cblxuICBnZXQgJGlkKCkge1xuICAgIHJldHVybiB0aGlzWyRzdG9yZV1bdGhpcy5jb25zdHJ1Y3Rvci4kaWRdO1xuICB9XG5cbiAgJCRjb3B5VmFsdWVzRnJvbShvcHRzID0ge30pIHtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgaWYgKG9wdHNbZmllbGROYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGNvcHkgZnJvbSBvcHRzIHRvIHRoZSBiZXN0IG9mIG91ciBhYmlsaXR5XG4gICAgICAgIGlmIChcbiAgICAgICAgICAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2FycmF5JykgfHxcbiAgICAgICAgICAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2hhc01hbnknKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IChvcHRzW2ZpZWxkTmFtZV0gfHwgW10pLmNvbmNhdCgpO1xuICAgICAgICAgIHRoaXNbJGxvYWRlZF1bZmllbGROYW1lXSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IE9iamVjdC5hc3NpZ24oe30sIG9wdHNbZmllbGROYW1lXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBvcHRzW2ZpZWxkTmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLiQkZmlyZVVwZGF0ZSgpO1xuICB9XG5cbiAgJCRob29rVG9QbHVtcCgpIHtcbiAgICBpZiAodGhpc1skdW5zdWJzY3JpYmVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHVuc3Vic2NyaWJlXSA9IHRoaXNbJHBsdW1wXS5zdWJzY3JpYmUodGhpcy5jb25zdHJ1Y3Rvci4kbmFtZSwgdGhpcy4kaWQsICh7IGZpZWxkLCB2YWx1ZSB9KSA9PiB7XG4gICAgICAgIGlmIChmaWVsZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgLy8gdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHZhbHVlKTtcbiAgICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20oeyBbZmllbGRdOiB2YWx1ZSB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAkc3Vic2NyaWJlKC4uLmFyZ3MpIHtcbiAgICBsZXQgZmllbGRzID0gWyRzZWxmXTtcbiAgICBsZXQgY2I7XG4gICAgaWYgKGFyZ3MubGVuZ3RoID09PSAyKSB7XG4gICAgICBmaWVsZHMgPSBhcmdzWzBdO1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGZpZWxkcykpIHtcbiAgICAgICAgZmllbGRzID0gW2ZpZWxkc107XG4gICAgICB9XG4gICAgICBjYiA9IGFyZ3NbMV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGNiID0gYXJnc1swXTtcbiAgICB9XG4gICAgdGhpcy4kJGhvb2tUb1BsdW1wKCk7XG4gICAgaWYgKHRoaXNbJGxvYWRlZF1bJHNlbGZdID09PSBmYWxzZSkge1xuICAgICAgdGhpc1skcGx1bXBdLnN0cmVhbUdldCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwgZmllbGRzKVxuICAgICAgLnN1YnNjcmliZSgodikgPT4gdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHYpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNbJHN1YmplY3RdLnN1YnNjcmliZShjYik7XG4gIH1cblxuICAkJGZpcmVVcGRhdGUoKSB7XG4gICAgdGhpc1skc3ViamVjdF0ubmV4dCh0aGlzWyRzdG9yZV0pO1xuICB9XG5cbiAgLy8gVE9ETzogZG9uJ3QgZmV0Y2ggaWYgd2UgJGdldCgpIHNvbWV0aGluZyB0aGF0IHdlIGFscmVhZHkgaGF2ZVxuXG4gICRnZXQob3B0cykge1xuICAgIGxldCBrZXlzID0gWyRzZWxmXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRzKSkge1xuICAgICAga2V5cyA9IG9wdHM7XG4gICAgfSBlbHNlIGlmIChvcHRzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChvcHRzID09PSAkYWxsKSB7XG4gICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpXG4gICAgICAgIC5maWx0ZXIoKGtleSkgPT4gdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKVxuICAgICAgICAuY29uY2F0KCRzZWxmKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGtleXMgPSBbb3B0c107XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoa2V5cy5tYXAoKGtleSkgPT4gdGhpcy4kJHNpbmdsZUdldChrZXkpKSlcbiAgICAudGhlbigodmFsdWVBcnJheSkgPT4ge1xuICAgICAgY29uc3Qgc2VsZklkeCA9IGtleXMuaW5kZXhPZigkc2VsZik7XG4gICAgICBpZiAoKHNlbGZJZHggPj0gMCkgJiYgKHZhbHVlQXJyYXlbc2VsZklkeF0gPT09IG51bGwpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlQXJyYXkucmVkdWNlKChhY2N1bSwgY3VycikgPT4gT2JqZWN0LmFzc2lnbihhY2N1bSwgY3VyciksIHt9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICQkc2luZ2xlR2V0KG9wdCA9ICRzZWxmKSB7XG4gICAgLy8gdGhyZWUgY2FzZXMuXG4gICAgLy8ga2V5ID09PSB1bmRlZmluZWQgLSBmZXRjaCBhbGwsIHVubGVzcyAkbG9hZGVkLCBidXQgcmV0dXJuIGFsbC5cbiAgICAvLyBmaWVsZHNba2V5XSA9PT0gJ2hhc01hbnknIC0gZmV0Y2ggY2hpbGRyZW4gKHBlcmhhcHMgbW92ZSB0aGlzIGRlY2lzaW9uIHRvIHN0b3JlKVxuICAgIC8vIG90aGVyd2lzZSAtIGZldGNoIGFsbCwgdW5sZXNzICRzdG9yZVtrZXldLCByZXR1cm4gJHN0b3JlW2tleV0uXG4gICAgbGV0IGtleTtcbiAgICBpZiAoKG9wdCAhPT0gJHNlbGYpICYmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbb3B0XS50eXBlICE9PSAnaGFzTWFueScpKSB7XG4gICAgICBrZXkgPSAkc2VsZjtcbiAgICB9IGVsc2Uge1xuICAgICAga2V5ID0gb3B0O1xuICAgIH1cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKGtleSA9PT0gJHNlbGYpIHtcbiAgICAgICAgaWYgKHRoaXNbJGxvYWRlZF1bJHNlbGZdID09PSBmYWxzZSAmJiB0aGlzWyRwbHVtcF0pIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLmdldCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCh0aGlzWyRsb2FkZWRdW2tleV0gPT09IGZhbHNlKSAmJiB0aGlzWyRwbHVtcF0pIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1sb25lbHktaWZcbiAgICAgICAgICByZXR1cm4gdGhpcy4kcmVsYXRpb25zaGlwc1trZXldLiRsaXN0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KS50aGVuKCh2KSA9PiB7XG4gICAgICBpZiAodiA9PT0gdHJ1ZSkge1xuICAgICAgICBpZiAoa2V5ID09PSAkc2VsZikge1xuICAgICAgICAgIGNvbnN0IHJldFZhbCA9IHt9O1xuICAgICAgICAgIGZvciAoY29uc3QgayBpbiB0aGlzWyRzdG9yZV0pIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba10udHlwZSAhPT0gJ2hhc01hbnknKSB7XG4gICAgICAgICAgICAgIHJldFZhbFtrXSA9IHRoaXNbJHN0b3JlXVtrXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJldFZhbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgeyBba2V5XTogdGhpc1skc3RvcmVdW2tleV0gfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodiAmJiAodlskc2VsZl0gIT09IG51bGwpKSB7XG4gICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KTtcbiAgICAgICAgdGhpc1skbG9hZGVkXVtrZXldID0gdHJ1ZTtcbiAgICAgICAgaWYgKGtleSA9PT0gJHNlbGYpIHtcbiAgICAgICAgICBjb25zdCByZXRWYWwgPSB7fTtcbiAgICAgICAgICBmb3IgKGNvbnN0IGsgaW4gdGhpc1skc3RvcmVdKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tdLnR5cGUgIT09ICdoYXNNYW55Jykge1xuICAgICAgICAgICAgICByZXRWYWxba10gPSB0aGlzWyRzdG9yZV1ba107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXRWYWw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHsgW2tleV06IHRoaXNbJHN0b3JlXVtrZXldIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICRzYXZlKCkge1xuICAgIHJldHVybiB0aGlzLiRzZXQoKTtcbiAgfVxuXG4gICRzZXQodSA9IHRoaXNbJHN0b3JlXSkge1xuICAgIGNvbnN0IHVwZGF0ZSA9IG1lcmdlT3B0aW9ucyh7fSwgdGhpc1skc3RvcmVdLCB1KTtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgICBkZWxldGUgdXBkYXRlW2tleV07XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHVwZGF0ZSk7IC8vIHRoaXMgaXMgdGhlIG9wdGltaXN0aWMgdXBkYXRlO1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0uc2F2ZSh0aGlzLmNvbnN0cnVjdG9yLCB1cGRhdGUpXG4gICAgLnRoZW4oKHVwZGF0ZWQpID0+IHtcbiAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh1cGRhdGVkKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0pO1xuICB9XG5cbiAgJGRlbGV0ZSgpIHtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLmRlbGV0ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCk7XG4gIH1cblxuICAkcmVzdChvcHRzKSB7XG4gICAgY29uc3QgcmVzdE9wdHMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICBvcHRzLFxuICAgICAge1xuICAgICAgICB1cmw6IGAvJHt0aGlzLmNvbnN0cnVjdG9yLiRuYW1lfS8ke3RoaXMuJGlkfS8ke29wdHMudXJsfWAsXG4gICAgICB9XG4gICAgKTtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLnJlc3RSZXF1ZXN0KHJlc3RPcHRzKTtcbiAgfVxuXG4gICRhZGQoa2V5LCBpdGVtLCBleHRyYXMpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgICBsZXQgaWQgPSAwO1xuICAgICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgICB9IGVsc2UgaWYgKGl0ZW0uJGlkKSB7XG4gICAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZCA9IGl0ZW1bdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0ucmVsYXRpb25zaGlwLiRzaWRlc1trZXldLm90aGVyLmZpZWxkXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0uYWRkKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkLCBleHRyYXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gYWRkZWQgdG8gaGFzTWFueScpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJykpO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKGwpID0+IHtcbiAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh7IFtrZXldOiBsIH0pO1xuICAgICAgcmV0dXJuIGw7XG4gICAgfSk7XG4gIH1cblxuICAkbW9kaWZ5UmVsYXRpb25zaGlwKGtleSwgaXRlbSwgZXh0cmFzKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gW107XG4gICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLm1vZGlmeVJlbGF0aW9uc2hpcCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpZCwgZXh0cmFzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gYWRkZWQgdG8gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICRyZW1vdmUoa2V5LCBpdGVtKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gW107XG4gICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLnJlbW92ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtICRyZW1vdmVkIGZyb20gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkcmVtb3ZlIGV4Y2VwdCBmcm9tIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG5cbiAgJHRlYXJkb3duKCkge1xuICAgIGlmICh0aGlzWyR1bnN1YnNjcmliZV0pIHtcbiAgICAgIHRoaXNbJHVuc3Vic2NyaWJlXS51bnN1YnNjcmliZSgpO1xuICAgIH1cbiAgfVxufVxuXG5Nb2RlbC5mcm9tSlNPTiA9IGZ1bmN0aW9uIGZyb21KU09OKGpzb24pIHtcbiAgdGhpcy4kaWQgPSBqc29uLiRpZCB8fCAnaWQnO1xuICB0aGlzLiRuYW1lID0ganNvbi4kbmFtZTtcbiAgdGhpcy4kZmllbGRzID0ge307XG4gIE9iamVjdC5rZXlzKGpzb24uJGZpZWxkcykuZm9yRWFjaCgoaykgPT4ge1xuICAgIGNvbnN0IGZpZWxkID0ganNvbi4kZmllbGRzW2tdO1xuICAgIGlmIChmaWVsZC50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGNsYXNzIER5bmFtaWNSZWxhdGlvbnNoaXAgZXh0ZW5kcyBSZWxhdGlvbnNoaXAge31cbiAgICAgIER5bmFtaWNSZWxhdGlvbnNoaXAuZnJvbUpTT04oZmllbGQucmVsYXRpb25zaGlwKTtcbiAgICAgIHRoaXMuJGZpZWxkc1trXSA9IHtcbiAgICAgICAgdHlwZTogJ2hhc01hbnknLFxuICAgICAgICByZWxhdGlvbnNoaXA6IER5bmFtaWNSZWxhdGlvbnNoaXAsXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiRmaWVsZHNba10gPSBPYmplY3QuYXNzaWduKHt9LCBmaWVsZCk7XG4gICAgfVxuICB9KTtcbn07XG5cbk1vZGVsLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTigpIHtcbiAgY29uc3QgcmV0VmFsID0ge1xuICAgICRpZDogdGhpcy4kaWQsXG4gICAgJG5hbWU6IHRoaXMuJG5hbWUsXG4gICAgJGZpZWxkczoge30sXG4gIH07XG4gIGNvbnN0IGZpZWxkTmFtZXMgPSBPYmplY3Qua2V5cyh0aGlzLiRmaWVsZHMpO1xuICBmaWVsZE5hbWVzLmZvckVhY2goKGspID0+IHtcbiAgICBpZiAodGhpcy4kZmllbGRzW2tdLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgcmV0VmFsLiRmaWVsZHNba10gPSB7XG4gICAgICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICAgICAgcmVsYXRpb25zaGlwOiB0aGlzLiRmaWVsZHNba10ucmVsYXRpb25zaGlwLnRvSlNPTigpLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0VmFsLiRmaWVsZHNba10gPSB0aGlzLiRmaWVsZHNba107XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHJldFZhbDtcbn07XG5cbk1vZGVsLiRyZXN0ID0gZnVuY3Rpb24gJHJlc3QocGx1bXAsIG9wdHMpIHtcbiAgY29uc3QgcmVzdE9wdHMgPSBPYmplY3QuYXNzaWduKFxuICAgIHt9LFxuICAgIG9wdHMsXG4gICAge1xuICAgICAgdXJsOiBgLyR7dGhpcy4kbmFtZX0vJHtvcHRzLnVybH1gLFxuICAgIH1cbiAgKTtcbiAgcmV0dXJuIHBsdW1wLnJlc3RSZXF1ZXN0KHJlc3RPcHRzKTtcbn07XG5cbk1vZGVsLmFzc2lnbiA9IGZ1bmN0aW9uIGFzc2lnbihvcHRzKSB7XG4gIGNvbnN0IHN0YXJ0ID0ge307XG4gIE9iamVjdC5rZXlzKHRoaXMuJGZpZWxkcykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgaWYgKG9wdHNba2V5XSkge1xuICAgICAgc3RhcnRba2V5XSA9IG9wdHNba2V5XTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuJGZpZWxkc1trZXldLmRlZmF1bHQpIHtcbiAgICAgIHN0YXJ0W2tleV0gPSB0aGlzLiRmaWVsZHNba2V5XS5kZWZhdWx0O1xuICAgIH0gZWxzZSBpZiAodGhpcy4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBzdGFydFtrZXldID0gW107XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXJ0W2tleV0gPSBudWxsO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBzdGFydDtcbn07XG5cbk1vZGVsLiRpZCA9ICdpZCc7XG5Nb2RlbC4kbmFtZSA9ICdCYXNlJztcbk1vZGVsLiRzZWxmID0gJHNlbGY7XG5Nb2RlbC4kZmllbGRzID0ge1xuICBpZDoge1xuICAgIHR5cGU6ICdudW1iZXInLFxuICB9LFxufTtcbiJdfQ==
