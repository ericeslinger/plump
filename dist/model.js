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

var _mergeOptions = require('merge-options');

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _Rx = require('rxjs/Rx');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $plump = Symbol('$plump');
var $unsubscribe = Symbol('$unsubscribe');
var $subject = Symbol('$subject');
var $updates = Symbol('$updates');
var $self = exports.$self = Symbol('$self');
var $all = exports.$all = Symbol('$all');

// TODO: figure out where error events originate (storage or model)
// and who keeps a roll-backable delta

var Model = exports.Model = function () {
  function Model(opts, plump) {
    var _this = this;

    _classCallCheck(this, Model);

    this.$relationships = {};
    this[$subject] = new _Rx.BehaviorSubject();
    this[$subject].next({});
    Object.keys(this.constructor.$fields).forEach(function (fieldName) {
      if (_this.constructor.$fields[fieldName].type === 'hasMany') {
        var Rel = _this.constructor.$fields[fieldName].relationship;
        _this.$relationships[fieldName] = new Rel(_this, fieldName, plump);
      }
    });
    if (plump) {
      this[$plump] = plump;
    }
    this.$set(opts || {});
    if (opts[this.constructor.$id]) {
      this.$id = opts[this.constructor.$id];
    }
    // this.$$copyValuesFrom(opts || {});
  }

  _createClass(Model, [{
    key: '$$unmarshal',
    value: function $$unmarshal(val) {
      var _this2 = this;

      if (val) {
        var _ret = function () {
          var unmarshalOne = function unmarshalOne(field, fieldName, values) {
            if (field.type === 'array') {
              return (values[fieldName] || []).concat();
            } else if (field.type === 'hasMany') {
              var _ret2 = function () {
                var side = field.relationship.$sides[fieldName];
                return {
                  v: (values[fieldName] || []).map(function (v) {
                    var retVal = {
                      id: v[side.other.field]
                    };
                    if (field.relationship.$extras) {
                      Object.keys(field.relationship.$extras).forEach(function (extra) {
                        retVal[extra] = v[extra];
                      });
                    }
                    return retVal;
                  })
                };
              }();

              if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
            } else if (field.type === 'object') {
              return (0, _mergeOptions2.default)({}, values[fieldName]);
            } else {
              return values[fieldName];
            }
          };

          if (val && val[_this2.constructor.$id]) {
            _this2.$id = val[_this2.constructor.$id];
          }

          return {
            v: Object.keys(_this2.constructor.$fields).reduce(function (obj, fieldName) {
              return Object.assign({}, obj, _defineProperty({}, fieldName, unmarshalOne(fieldName, _this2.constructor.$fields[fieldName], val)));
            }, {})
          };
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
      } else {
        return null;
      }
    }

    // $$copyValuesFrom(opts = {}) {
    //   Object.keys(this.constructor.$fields).forEach((fieldName) => {
    //     if (opts[fieldName] !== undefined) {
    //       // copy from opts to the best of our ability
    //       if (field.type === 'array') {
    //         this[$store][fieldName] = (opts[fieldName] || []).concat();
    //         this[$loaded][fieldName] = true;
    //       } else if (field.type === 'hasMany') {
    //         const side = field.relationship.$sides[fieldName];
    //         this[$store][fieldName] = opts[fieldName].map((v) => {
    //           const retVal = {
    //             id: v[side.other.field],
    //           };
    //           if (field.relationship.$extras) {
    //             Object.keys(field.relationship.$extras).forEach((extra) => {
    //               retVal[extra] = v[extra];
    //             });
    //           }
    //           return retVal;
    //         });
    //         this[$loaded][fieldName] = true;
    //       } else if (field.type === 'object') {
    //         this[$store][fieldName] = Object.assign({}, opts[fieldName]);
    //       } else {
    //         this[$store][fieldName] = opts[fieldName];
    //       }
    //     }
    //   });
    //   this.$$fireUpdate();
    // }

  }, {
    key: '$$hookToPlump',
    value: function $$hookToPlump() {
      if (this[$unsubscribe] === undefined) {
        this[$unsubscribe] = this[$plump].subscribe(this.constructor.$name, this.$id, function (_ref) {
          // if (field !== undefined) {
          //   // this.$$copyValuesFrom(value);
          //   // this.$$copyValuesFrom({ [field]: value });
          // } else {
          //   // this.$$copyValuesFrom(value);
          // }

          var field = _ref.field,
              value = _ref.value;
        });
      }
    }
  }, {
    key: '$subscribe',
    value: function $subscribe() {
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
      this[$plump].streamGet(this.constructor, this.$id, fields);
      // .subscribe((v) => this.$$copyValuesFrom(v));
      return this[$subject].subscribe(cb);
    }

    // $$fireUpdate() {
    //   this[$subject].next(this[$store]);
    // }
    //
    // Model.$get, when asking for a hasMany field will
    // ALWAYS resolve to an object with that field as a property.
    // The value of that property will ALWAYS be an array (possibly empty).
    // The elements of the array will ALWAYS be objects, with at least an 'id' field.
    // Array elements MAY have other fields (if the hasMany has valence).

  }, {
    key: '$get',
    value: function $get() {
      var _this3 = this;

      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : $self;

      var keys = void 0;
      if (Array.isArray(opts)) {
        keys = opts;
      } else {
        keys = [opts];
      }
      return _bluebird2.default.all(keys.map(function (key) {
        return _this3.$$singleGet(key);
      })).then(function (valueArray) {
        var selfIdx = keys.indexOf($self);
        if (selfIdx >= 0 && valueArray[selfIdx] === null) {
          return null;
        } else {
          return valueArray.reduce(function (accum, curr) {
            return Object.assign(accum, curr);
          }, {});
        }
      }).then(function (values) {
        return Object.assign({}, values, _this3[$updates]);
      });
    }
  }, {
    key: '$$singleGet',
    value: function $$singleGet() {
      var _this4 = this;

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
        if ((typeof key === 'undefined' ? 'undefined' : _typeof(key)) === 'symbol') {
          // key === $self or $all
          return _this4[$plump].get(_this4.constructor, _this4.$id, key);
        } else {
          return _this4.$relationships[key].$list();
        }
      }).then(function (v) {
        return _this4.$$unmarshal(v);
      });
    }
  }, {
    key: '$save',
    value: function $save() {
      var _this5 = this;

      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      this[$updates] = Object.assign({}, this[$updates], opts);
      return this[$plump].save(this.constructor, this[$updates]).then(function () {
        _this5[$updates] = {};
      });
    }
  }, {
    key: '$set',
    value: function $set() {
      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      this[$updates] = Object.assign({}, this[$updates], opts);
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
      var _this6 = this;

      return _bluebird2.default.resolve().then(function () {
        if (_this6.constructor.$fields[key].type === 'hasMany') {
          var id = 0;
          if (typeof item === 'number') {
            id = item;
          } else if (item.$id) {
            id = item.$id;
          } else {
            id = item[_this6.constructor.$fields[key].relationship.$sides[key].other.field];
          }
          if (typeof id === 'number' && id >= 1) {
            return _this6[$plump].add(_this6.constructor, _this6.$id, key, id, extras);
          } else {
            return _bluebird2.default.reject(new Error('Invalid item added to hasMany'));
          }
        } else {
          return _bluebird2.default.reject(new Error('Cannot $add except to hasMany field'));
        }
      }).then(function (l) {
        // this.$$copyValuesFrom({ [key]: l });
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
  var _this8 = this;

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
    $include: this.$include,
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
Model.$included = [];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRwbHVtcCIsIlN5bWJvbCIsIiR1bnN1YnNjcmliZSIsIiRzdWJqZWN0IiwiJHVwZGF0ZXMiLCIkc2VsZiIsIiRhbGwiLCJNb2RlbCIsIm9wdHMiLCJwbHVtcCIsIiRyZWxhdGlvbnNoaXBzIiwibmV4dCIsIk9iamVjdCIsImtleXMiLCJjb25zdHJ1Y3RvciIsIiRmaWVsZHMiLCJmb3JFYWNoIiwiZmllbGROYW1lIiwidHlwZSIsIlJlbCIsInJlbGF0aW9uc2hpcCIsIiRzZXQiLCIkaWQiLCJ2YWwiLCJ1bm1hcnNoYWxPbmUiLCJmaWVsZCIsInZhbHVlcyIsImNvbmNhdCIsInNpZGUiLCIkc2lkZXMiLCJtYXAiLCJ2IiwicmV0VmFsIiwiaWQiLCJvdGhlciIsIiRleHRyYXMiLCJleHRyYSIsInJlZHVjZSIsIm9iaiIsImFzc2lnbiIsInVuZGVmaW5lZCIsInN1YnNjcmliZSIsIiRuYW1lIiwidmFsdWUiLCJmaWVsZHMiLCJjYiIsImxlbmd0aCIsIkFycmF5IiwiaXNBcnJheSIsIiQkaG9va1RvUGx1bXAiLCJzdHJlYW1HZXQiLCJhbGwiLCJrZXkiLCIkJHNpbmdsZUdldCIsInRoZW4iLCJ2YWx1ZUFycmF5Iiwic2VsZklkeCIsImluZGV4T2YiLCJhY2N1bSIsImN1cnIiLCJvcHQiLCJyZXNvbHZlIiwiZ2V0IiwiJGxpc3QiLCIkJHVubWFyc2hhbCIsInNhdmUiLCJkZWxldGUiLCJyZXN0T3B0cyIsInVybCIsInJlc3RSZXF1ZXN0IiwiaXRlbSIsImV4dHJhcyIsImFkZCIsInJlamVjdCIsIkVycm9yIiwibCIsIm1vZGlmeVJlbGF0aW9uc2hpcCIsInJlbW92ZSIsInVuc3Vic2NyaWJlIiwiJGluY2x1ZGUiLCJmcm9tSlNPTiIsImpzb24iLCJrIiwiRHluYW1pY1JlbGF0aW9uc2hpcCIsInRvSlNPTiIsImZpZWxkTmFtZXMiLCIkcmVzdCIsInN0YXJ0IiwiZGVmYXVsdCIsIiRpbmNsdWRlZCJdLCJtYXBwaW5ncyI6Ijs7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S0FBSzFCLEtBQWQsU0FBdUJsQyxLQUFLNEQ7QUFEOUIsR0FIZSxDQUFqQjtBQU9BLFNBQU8zRCxNQUFNNEQsV0FBTixDQUFrQkYsUUFBbEIsQ0FBUDtBQUNELENBVEQ7O0FBV0E1RCxNQUFNZ0MsTUFBTixHQUFlLFNBQVNBLE1BQVQsQ0FBZ0IvQixJQUFoQixFQUFzQjtBQUFBOztBQUNuQyxNQUFNK0UsUUFBUSxFQUFkO0FBQ0EzRSxTQUFPQyxJQUFQLENBQVksS0FBS0UsT0FBakIsRUFBMEJDLE9BQTFCLENBQWtDLFVBQUNvQyxHQUFELEVBQVM7QUFDekMsUUFBSTVDLEtBQUs0QyxHQUFMLENBQUosRUFBZTtBQUNibUMsWUFBTW5DLEdBQU4sSUFBYTVDLEtBQUs0QyxHQUFMLENBQWI7QUFDRCxLQUZELE1BRU8sSUFBSSxRQUFLckMsT0FBTCxDQUFhcUMsR0FBYixFQUFrQm9DLE9BQXRCLEVBQStCO0FBQ3BDRCxZQUFNbkMsR0FBTixJQUFhLFFBQUtyQyxPQUFMLENBQWFxQyxHQUFiLEVBQWtCb0MsT0FBL0I7QUFDRCxLQUZNLE1BRUEsSUFBSSxRQUFLekUsT0FBTCxDQUFhcUMsR0FBYixFQUFrQmxDLElBQWxCLEtBQTJCLFNBQS9CLEVBQTBDO0FBQy9DcUUsWUFBTW5DLEdBQU4sSUFBYSxFQUFiO0FBQ0QsS0FGTSxNQUVBO0FBQ0xtQyxZQUFNbkMsR0FBTixJQUFhLElBQWI7QUFDRDtBQUNGLEdBVkQ7QUFXQSxTQUFPbUMsS0FBUDtBQUNELENBZEQ7O0FBZ0JBaEYsTUFBTWUsR0FBTixHQUFZLElBQVo7QUFDQWYsTUFBTW1DLEtBQU4sR0FBYyxNQUFkO0FBQ0FuQyxNQUFNRixLQUFOLEdBQWNBLEtBQWQ7QUFDQUUsTUFBTVEsT0FBTixHQUFnQjtBQUNka0IsTUFBSTtBQUNGZixVQUFNO0FBREo7QUFEVSxDQUFoQjtBQUtBWCxNQUFNa0YsU0FBTixHQUFrQixFQUFsQiIsImZpbGUiOiJtb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBSZWxhdGlvbnNoaXAgfSBmcm9tICcuL3JlbGF0aW9uc2hpcCc7XG5pbXBvcnQgbWVyZ2VPcHRpb25zIGZyb20gJ21lcmdlLW9wdGlvbnMnO1xuaW1wb3J0IHsgQmVoYXZpb3JTdWJqZWN0IH0gZnJvbSAncnhqcy9SeCc7XG5jb25zdCAkcGx1bXAgPSBTeW1ib2woJyRwbHVtcCcpO1xuY29uc3QgJHVuc3Vic2NyaWJlID0gU3ltYm9sKCckdW5zdWJzY3JpYmUnKTtcbmNvbnN0ICRzdWJqZWN0ID0gU3ltYm9sKCckc3ViamVjdCcpO1xuY29uc3QgJHVwZGF0ZXMgPSBTeW1ib2woJyR1cGRhdGVzJyk7XG5leHBvcnQgY29uc3QgJHNlbGYgPSBTeW1ib2woJyRzZWxmJyk7XG5leHBvcnQgY29uc3QgJGFsbCA9IFN5bWJvbCgnJGFsbCcpO1xuXG4vLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIGVycm9yIGV2ZW50cyBvcmlnaW5hdGUgKHN0b3JhZ2Ugb3IgbW9kZWwpXG4vLyBhbmQgd2hvIGtlZXBzIGEgcm9sbC1iYWNrYWJsZSBkZWx0YVxuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzLCBwbHVtcCkge1xuICAgIHRoaXMuJHJlbGF0aW9uc2hpcHMgPSB7fTtcbiAgICB0aGlzWyRzdWJqZWN0XSA9IG5ldyBCZWhhdmlvclN1YmplY3QoKTtcbiAgICB0aGlzWyRzdWJqZWN0XS5uZXh0KHt9KTtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgICBjb25zdCBSZWwgPSB0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS5yZWxhdGlvbnNoaXA7XG4gICAgICAgIHRoaXMuJHJlbGF0aW9uc2hpcHNbZmllbGROYW1lXSA9IG5ldyBSZWwodGhpcywgZmllbGROYW1lLCBwbHVtcCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHBsdW1wKSB7XG4gICAgICB0aGlzWyRwbHVtcF0gPSBwbHVtcDtcbiAgICB9XG4gICAgdGhpcy4kc2V0KG9wdHMgfHwge30pO1xuICAgIGlmIChvcHRzW3RoaXMuY29uc3RydWN0b3IuJGlkXSkge1xuICAgICAgdGhpcy4kaWQgPSBvcHRzW3RoaXMuY29uc3RydWN0b3IuJGlkXTtcbiAgICB9XG4gICAgLy8gdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKG9wdHMgfHwge30pO1xuICB9XG5cbiAgZ2V0ICRuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLiRuYW1lO1xuICB9XG5cbiAgZ2V0ICQkcmVsYXRlZEZpZWxkcygpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kaW5jbHVkZSk7XG4gIH1cblxuICBnZXQgJCRwYXRoKCkge1xuICAgIHJldHVybiBgLyR7dGhpcy4kbmFtZX0vJHt0aGlzLiRpZH1gO1xuICB9XG5cbiAgZ2V0ICQkZGF0YUpTT04oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMuJG5hbWUsXG4gICAgICBpZDogdGhpcy4kaWQsXG4gICAgfTtcbiAgfVxuXG4gICQkdW5tYXJzaGFsKHZhbCkge1xuICAgIGlmICh2YWwpIHtcbiAgICAgIGZ1bmN0aW9uIHVubWFyc2hhbE9uZShmaWVsZCwgZmllbGROYW1lLCB2YWx1ZXMpIHtcbiAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09ICdhcnJheScpIHtcbiAgICAgICAgICByZXR1cm4gKHZhbHVlc1tmaWVsZE5hbWVdIHx8IFtdKS5jb25jYXQoKTtcbiAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgICBjb25zdCBzaWRlID0gZmllbGQucmVsYXRpb25zaGlwLiRzaWRlc1tmaWVsZE5hbWVdO1xuICAgICAgICAgIHJldHVybiAodmFsdWVzW2ZpZWxkTmFtZV0gfHwgW10pLm1hcCgodikgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmV0VmFsID0ge1xuICAgICAgICAgICAgICBpZDogdltzaWRlLm90aGVyLmZpZWxkXSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoZmllbGQucmVsYXRpb25zaGlwLiRleHRyYXMpIHtcbiAgICAgICAgICAgICAgT2JqZWN0LmtleXMoZmllbGQucmVsYXRpb25zaGlwLiRleHRyYXMpLmZvckVhY2goKGV4dHJhKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0VmFsW2V4dHJhXSA9IHZbZXh0cmFdO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXRWYWw7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICByZXR1cm4gbWVyZ2VPcHRpb25zKHt9LCB2YWx1ZXNbZmllbGROYW1lXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlc1tmaWVsZE5hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh2YWwgJiYgdmFsW3RoaXMuY29uc3RydWN0b3IuJGlkXSkge1xuICAgICAgICB0aGlzLiRpZCA9IHZhbFt0aGlzLmNvbnN0cnVjdG9yLiRpZF07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpXG4gICAgLnJlZHVjZSgob2JqLCBmaWVsZE5hbWUpID0+IHtcbiAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBvYmosIHsgW2ZpZWxkTmFtZV06IHVubWFyc2hhbE9uZShmaWVsZE5hbWUsIHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLCB2YWwpIH0pO1xuICAgIH0sIHt9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgLy8gJCRjb3B5VmFsdWVzRnJvbShvcHRzID0ge30pIHtcbiAgLy8gICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAvLyAgICAgaWYgKG9wdHNbZmllbGROYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gIC8vICAgICAgIC8vIGNvcHkgZnJvbSBvcHRzIHRvIHRoZSBiZXN0IG9mIG91ciBhYmlsaXR5XG4gIC8vICAgICAgIGlmIChmaWVsZC50eXBlID09PSAnYXJyYXknKSB7XG4gIC8vICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSAob3B0c1tmaWVsZE5hbWVdIHx8IFtdKS5jb25jYXQoKTtcbiAgLy8gICAgICAgICB0aGlzWyRsb2FkZWRdW2ZpZWxkTmFtZV0gPSB0cnVlO1xuICAvLyAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAvLyAgICAgICAgIGNvbnN0IHNpZGUgPSBmaWVsZC5yZWxhdGlvbnNoaXAuJHNpZGVzW2ZpZWxkTmFtZV07XG4gIC8vICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBvcHRzW2ZpZWxkTmFtZV0ubWFwKCh2KSA9PiB7XG4gIC8vICAgICAgICAgICBjb25zdCByZXRWYWwgPSB7XG4gIC8vICAgICAgICAgICAgIGlkOiB2W3NpZGUub3RoZXIuZmllbGRdLFxuICAvLyAgICAgICAgICAgfTtcbiAgLy8gICAgICAgICAgIGlmIChmaWVsZC5yZWxhdGlvbnNoaXAuJGV4dHJhcykge1xuICAvLyAgICAgICAgICAgICBPYmplY3Qua2V5cyhmaWVsZC5yZWxhdGlvbnNoaXAuJGV4dHJhcykuZm9yRWFjaCgoZXh0cmEpID0+IHtcbiAgLy8gICAgICAgICAgICAgICByZXRWYWxbZXh0cmFdID0gdltleHRyYV07XG4gIC8vICAgICAgICAgICAgIH0pO1xuICAvLyAgICAgICAgICAgfVxuICAvLyAgICAgICAgICAgcmV0dXJuIHJldFZhbDtcbiAgLy8gICAgICAgICB9KTtcbiAgLy8gICAgICAgICB0aGlzWyRsb2FkZWRdW2ZpZWxkTmFtZV0gPSB0cnVlO1xuICAvLyAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gIC8vICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBPYmplY3QuYXNzaWduKHt9LCBvcHRzW2ZpZWxkTmFtZV0pO1xuICAvLyAgICAgICB9IGVsc2Uge1xuICAvLyAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gb3B0c1tmaWVsZE5hbWVdO1xuICAvLyAgICAgICB9XG4gIC8vICAgICB9XG4gIC8vICAgfSk7XG4gIC8vICAgdGhpcy4kJGZpcmVVcGRhdGUoKTtcbiAgLy8gfVxuXG4gICQkaG9va1RvUGx1bXAoKSB7XG4gICAgaWYgKHRoaXNbJHVuc3Vic2NyaWJlXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyR1bnN1YnNjcmliZV0gPSB0aGlzWyRwbHVtcF0uc3Vic2NyaWJlKHRoaXMuY29uc3RydWN0b3IuJG5hbWUsIHRoaXMuJGlkLCAoeyBmaWVsZCwgdmFsdWUgfSkgPT4ge1xuICAgICAgICAvLyBpZiAoZmllbGQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyAgIC8vIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2YWx1ZSk7XG4gICAgICAgIC8vICAgLy8gdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHsgW2ZpZWxkXTogdmFsdWUgfSk7XG4gICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgIC8vICAgLy8gdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHZhbHVlKTtcbiAgICAgICAgLy8gfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgJHN1YnNjcmliZSguLi5hcmdzKSB7XG4gICAgbGV0IGZpZWxkcyA9IFskc2VsZl07XG4gICAgbGV0IGNiO1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMikge1xuICAgICAgZmllbGRzID0gYXJnc1swXTtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShmaWVsZHMpKSB7XG4gICAgICAgIGZpZWxkcyA9IFtmaWVsZHNdO1xuICAgICAgfVxuICAgICAgY2IgPSBhcmdzWzFdO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYiA9IGFyZ3NbMF07XG4gICAgfVxuICAgIHRoaXMuJCRob29rVG9QbHVtcCgpO1xuICAgIHRoaXNbJHBsdW1wXS5zdHJlYW1HZXQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGZpZWxkcyk7XG4gICAgLy8gLnN1YnNjcmliZSgodikgPT4gdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHYpKTtcbiAgICByZXR1cm4gdGhpc1skc3ViamVjdF0uc3Vic2NyaWJlKGNiKTtcbiAgfVxuXG4gIC8vICQkZmlyZVVwZGF0ZSgpIHtcbiAgLy8gICB0aGlzWyRzdWJqZWN0XS5uZXh0KHRoaXNbJHN0b3JlXSk7XG4gIC8vIH1cbiAgLy9cbiAgLy8gTW9kZWwuJGdldCwgd2hlbiBhc2tpbmcgZm9yIGEgaGFzTWFueSBmaWVsZCB3aWxsXG4gIC8vIEFMV0FZUyByZXNvbHZlIHRvIGFuIG9iamVjdCB3aXRoIHRoYXQgZmllbGQgYXMgYSBwcm9wZXJ0eS5cbiAgLy8gVGhlIHZhbHVlIG9mIHRoYXQgcHJvcGVydHkgd2lsbCBBTFdBWVMgYmUgYW4gYXJyYXkgKHBvc3NpYmx5IGVtcHR5KS5cbiAgLy8gVGhlIGVsZW1lbnRzIG9mIHRoZSBhcnJheSB3aWxsIEFMV0FZUyBiZSBvYmplY3RzLCB3aXRoIGF0IGxlYXN0IGFuICdpZCcgZmllbGQuXG4gIC8vIEFycmF5IGVsZW1lbnRzIE1BWSBoYXZlIG90aGVyIGZpZWxkcyAoaWYgdGhlIGhhc01hbnkgaGFzIHZhbGVuY2UpLlxuXG4gICRnZXQob3B0cyA9ICRzZWxmKSB7XG4gICAgbGV0IGtleXM7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkob3B0cykpIHtcbiAgICAgIGtleXMgPSBvcHRzO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXlzID0gW29wdHNdO1xuICAgIH1cbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKGtleXMubWFwKChrZXkpID0+IHRoaXMuJCRzaW5nbGVHZXQoa2V5KSkpXG4gICAgLnRoZW4oKHZhbHVlQXJyYXkpID0+IHtcbiAgICAgIGNvbnN0IHNlbGZJZHggPSBrZXlzLmluZGV4T2YoJHNlbGYpO1xuICAgICAgaWYgKChzZWxmSWR4ID49IDApICYmICh2YWx1ZUFycmF5W3NlbGZJZHhdID09PSBudWxsKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB2YWx1ZUFycmF5LnJlZHVjZSgoYWNjdW0sIGN1cnIpID0+IE9iamVjdC5hc3NpZ24oYWNjdW0sIGN1cnIpLCB7fSk7XG4gICAgICB9XG4gICAgfSkudGhlbigodmFsdWVzKSA9PiB7XG4gICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgdmFsdWVzLCB0aGlzWyR1cGRhdGVzXSk7XG4gICAgfSk7XG4gIH1cblxuICAkJHNpbmdsZUdldChvcHQgPSAkc2VsZikge1xuICAgIC8vIFggY2FzZXMuXG4gICAgLy8ga2V5ID09PSAkYWxsIC0gZmV0Y2ggYWxsIGZpZWxkcyB1bmxlc3MgbG9hZGVkLCByZXR1cm4gYWxsIGZpZWxkc1xuICAgIC8vICRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScsIC0gZmV0Y2ggY2hpbGRyZW4gKHBlcmhhcHMgbW92ZSB0aGlzIGRlY2lzaW9uIHRvIHN0b3JlKVxuICAgIC8vIG90aGVyd2lzZSAtIGZldGNoIG5vbi1oYXNNYW55IGZpZWxkcyB1bmxlc3MgYWxyZWFkeSBsb2FkZWQsIHJldHVybiBhbGwgbm9uLWhhc01hbnkgZmllbGRzXG4gICAgbGV0IGtleTtcbiAgICBpZiAoKG9wdCAhPT0gJHNlbGYpICYmIChvcHQgIT09ICRhbGwpICYmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbb3B0XS50eXBlICE9PSAnaGFzTWFueScpKSB7XG4gICAgICBrZXkgPSAkc2VsZjtcbiAgICB9IGVsc2Uge1xuICAgICAga2V5ID0gb3B0O1xuICAgIH1cblxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N5bWJvbCcpIHsgLy8ga2V5ID09PSAkc2VsZiBvciAkYWxsXG4gICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZ2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuJHJlbGF0aW9uc2hpcHNba2V5XS4kbGlzdCgpO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKHYpID0+IHRoaXMuJCR1bm1hcnNoYWwodikpO1xuICB9XG5cbiAgJHNhdmUob3B0cyA9IHt9KSB7XG4gICAgdGhpc1skdXBkYXRlc10gPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzWyR1cGRhdGVzXSwgb3B0cyk7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5zYXZlKHRoaXMuY29uc3RydWN0b3IsIHRoaXNbJHVwZGF0ZXNdKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIHRoaXNbJHVwZGF0ZXNdID0ge307XG4gICAgfSk7XG4gIH1cblxuICAkc2V0KG9wdHMgPSB7fSkge1xuICAgIHRoaXNbJHVwZGF0ZXNdID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpc1skdXBkYXRlc10sIG9wdHMpO1xuICB9XG5cbiAgJGRlbGV0ZSgpIHtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLmRlbGV0ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCk7XG4gIH1cblxuICAkcmVzdChvcHRzKSB7XG4gICAgY29uc3QgcmVzdE9wdHMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICBvcHRzLFxuICAgICAge1xuICAgICAgICB1cmw6IGAvJHt0aGlzLmNvbnN0cnVjdG9yLiRuYW1lfS8ke3RoaXMuJGlkfS8ke29wdHMudXJsfWAsXG4gICAgICB9XG4gICAgKTtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLnJlc3RSZXF1ZXN0KHJlc3RPcHRzKTtcbiAgfVxuXG4gICRhZGQoa2V5LCBpdGVtLCBleHRyYXMpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgICBsZXQgaWQgPSAwO1xuICAgICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgICB9IGVsc2UgaWYgKGl0ZW0uJGlkKSB7XG4gICAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZCA9IGl0ZW1bdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0ucmVsYXRpb25zaGlwLiRzaWRlc1trZXldLm90aGVyLmZpZWxkXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0uYWRkKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkLCBleHRyYXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gYWRkZWQgdG8gaGFzTWFueScpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJykpO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKGwpID0+IHtcbiAgICAgIC8vIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh7IFtrZXldOiBsIH0pO1xuICAgICAgcmV0dXJuIGw7XG4gICAgfSk7XG4gIH1cblxuICAkbW9kaWZ5UmVsYXRpb25zaGlwKGtleSwgaXRlbSwgZXh0cmFzKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0ubW9kaWZ5UmVsYXRpb25zaGlwKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkLCBleHRyYXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSBhZGRlZCB0byBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRhZGQgZXhjZXB0IHRvIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG5cbiAgJHJlbW92ZShrZXksIGl0ZW0pIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5yZW1vdmUodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSAkcmVtb3ZlZCBmcm9tIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJHJlbW92ZSBleGNlcHQgZnJvbSBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICR0ZWFyZG93bigpIHtcbiAgICBpZiAodGhpc1skdW5zdWJzY3JpYmVdKSB7XG4gICAgICB0aGlzWyR1bnN1YnNjcmliZV0udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cbn1cblxuTW9kZWwuZnJvbUpTT04gPSBmdW5jdGlvbiBmcm9tSlNPTihqc29uKSB7XG4gIHRoaXMuJGlkID0ganNvbi4kaWQgfHwgJ2lkJztcbiAgdGhpcy4kbmFtZSA9IGpzb24uJG5hbWU7XG4gIHRoaXMuJGluY2x1ZGUgPSBqc29uLiRpbmNsdWRlO1xuICB0aGlzLiRmaWVsZHMgPSB7fTtcbiAgT2JqZWN0LmtleXMoanNvbi4kZmllbGRzKS5mb3JFYWNoKChrKSA9PiB7XG4gICAgY29uc3QgZmllbGQgPSBqc29uLiRmaWVsZHNba107XG4gICAgaWYgKGZpZWxkLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgY2xhc3MgRHluYW1pY1JlbGF0aW9uc2hpcCBleHRlbmRzIFJlbGF0aW9uc2hpcCB7fVxuICAgICAgRHluYW1pY1JlbGF0aW9uc2hpcC5mcm9tSlNPTihmaWVsZC5yZWxhdGlvbnNoaXApO1xuICAgICAgdGhpcy4kZmllbGRzW2tdID0ge1xuICAgICAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgICAgIHJlbGF0aW9uc2hpcDogRHluYW1pY1JlbGF0aW9uc2hpcCxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJGZpZWxkc1trXSA9IE9iamVjdC5hc3NpZ24oe30sIGZpZWxkKTtcbiAgICB9XG4gIH0pO1xufTtcblxuTW9kZWwudG9KU09OID0gZnVuY3Rpb24gdG9KU09OKCkge1xuICBjb25zdCByZXRWYWwgPSB7XG4gICAgJGlkOiB0aGlzLiRpZCxcbiAgICAkbmFtZTogdGhpcy4kbmFtZSxcbiAgICAkaW5jbHVkZTogdGhpcy4kaW5jbHVkZSxcbiAgICAkZmllbGRzOiB7fSxcbiAgfTtcbiAgY29uc3QgZmllbGROYW1lcyA9IE9iamVjdC5rZXlzKHRoaXMuJGZpZWxkcyk7XG4gIGZpZWxkTmFtZXMuZm9yRWFjaCgoaykgPT4ge1xuICAgIGlmICh0aGlzLiRmaWVsZHNba10udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICByZXRWYWwuJGZpZWxkc1trXSA9IHtcbiAgICAgICAgdHlwZTogJ2hhc01hbnknLFxuICAgICAgICByZWxhdGlvbnNoaXA6IHRoaXMuJGZpZWxkc1trXS5yZWxhdGlvbnNoaXAudG9KU09OKCksXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXRWYWwuJGZpZWxkc1trXSA9IHRoaXMuJGZpZWxkc1trXTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcmV0VmFsO1xufTtcblxuTW9kZWwuJHJlc3QgPSBmdW5jdGlvbiAkcmVzdChwbHVtcCwgb3B0cykge1xuICBjb25zdCByZXN0T3B0cyA9IE9iamVjdC5hc3NpZ24oXG4gICAge30sXG4gICAgb3B0cyxcbiAgICB7XG4gICAgICB1cmw6IGAvJHt0aGlzLiRuYW1lfS8ke29wdHMudXJsfWAsXG4gICAgfVxuICApO1xuICByZXR1cm4gcGx1bXAucmVzdFJlcXVlc3QocmVzdE9wdHMpO1xufTtcblxuTW9kZWwuYXNzaWduID0gZnVuY3Rpb24gYXNzaWduKG9wdHMpIHtcbiAgY29uc3Qgc3RhcnQgPSB7fTtcbiAgT2JqZWN0LmtleXModGhpcy4kZmllbGRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICBpZiAob3B0c1trZXldKSB7XG4gICAgICBzdGFydFtrZXldID0gb3B0c1trZXldO1xuICAgIH0gZWxzZSBpZiAodGhpcy4kZmllbGRzW2tleV0uZGVmYXVsdCkge1xuICAgICAgc3RhcnRba2V5XSA9IHRoaXMuJGZpZWxkc1trZXldLmRlZmF1bHQ7XG4gICAgfSBlbHNlIGlmICh0aGlzLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIHN0YXJ0W2tleV0gPSBbXTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhcnRba2V5XSA9IG51bGw7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHN0YXJ0O1xufTtcblxuTW9kZWwuJGlkID0gJ2lkJztcbk1vZGVsLiRuYW1lID0gJ0Jhc2UnO1xuTW9kZWwuJHNlbGYgPSAkc2VsZjtcbk1vZGVsLiRmaWVsZHMgPSB7XG4gIGlkOiB7XG4gICAgdHlwZTogJ251bWJlcicsXG4gIH0sXG59O1xuTW9kZWwuJGluY2x1ZGVkID0gW107XG4iXX0=
