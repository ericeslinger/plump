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
  }, {
    key: '$$packageForInclusion',
    value: function $$packageForInclusion(opts) {
      var _this5 = this;

      var options = Object.assign({}, {
        domain: 'https://example.com',
        apiPath: '/api'
      }, opts);
      var prefix = '' + options.domain + options.apiPath;

      return this.$get(this.constructor.$packageIncludes.concat($self)).then(function (inflated) {
        return _bluebird2.default.resolve().then(function () {
          return _this5.constructor.$packageIncludes.map(function (relationship) {
            return _bluebird2.default.all(inflated[relationship].map(function (rel) {
              var otherSide = _this5.constructor.$fields[relationship].relationship.$sides[relationship].other;
              return _this5[$plump].find(otherSide.type, rel[otherSide.field]).$$packageForInclusion();
            }));
          });
        }).then(function (childPkgs) {
          var attributes = {};
          Object.keys(inflated).filter(function (k) {
            return k !== 'id' && _this5.constructor.$packageIncludes.indexOf(k) < 0;
          }).forEach(function (attribute) {
            attributes[attribute] = inflated[attribute];
          });

          // const included = [];
          var relationships = {};
          _this5.constructor.$packageIncludes.forEach(function (relationship, index) {
            relationships[relationship] = {
              links: {
                related: prefix + '/' + _this5.constructor.$name + '/' + _this5.$id + '/' + relationship
              },
              data: childPkgs[index].map(function (childPkg) {
                // const childPkgNoInclude = {};
                // Object.keys(childPkg).filter(k => k !== 'included').forEach((key) => {
                //   childPkgNoInclude[key] = childPkg[key];
                // });
                // included.push(childPkgNoInclude);
                // childPkg.included.forEach((item) => {
                //   included.push(item);
                // });
                return { type: childPkg.type, id: childPkg.id };
              })
            };
          });

          return {
            type: _this5.constructor.$name,
            id: _this5.$id,
            attributes: attributes,
            relationships: relationships,
            links: {
              self: prefix + '/' + _this5.constructor.$name + '/' + _this5.$id
            }
          };
        });
      });
    }
  }, {
    key: '$package',
    value: function $package(opts) {
      var _this6 = this;

      var options = Object.assign({}, {
        domain: 'https://example.com',
        apiPath: '/api'
      }, opts);
      var prefix = '' + options.domain + options.apiPath;

      return this.$get(this.constructor.$packageIncludes.concat($self)).then(function (inflated) {
        return _bluebird2.default.resolve().then(function () {
          return _this6.constructor.$packageIncludes.map(function (relationship) {
            return _bluebird2.default.all(inflated[relationship].map(function (rel) {
              var otherSide = _this6.constructor.$fields[relationship].relationship.$sides[relationship].other;
              return _this6[$plump].find(otherSide.type, rel[otherSide.field]).$$packageForInclusion();
            }));
          });
        }).then(function (childPkgs) {
          var attributes = {};
          Object.keys(inflated).filter(function (k) {
            return k !== 'id' && _this6.constructor.$packageIncludes.indexOf(k) < 0;
          }).forEach(function (attribute) {
            attributes[attribute] = inflated[attribute];
          });

          var included = [];
          var relationships = {};
          _this6.constructor.$packageIncludes.forEach(function (relationship, index) {
            relationships[relationship] = {
              links: {
                related: prefix + '/' + _this6.constructor.$name + '/' + _this6.$id + '/' + relationship
              },
              data: childPkgs[index].map(function (childPkg) {
                var childPkgNoInclude = {};
                Object.keys(childPkg).filter(function (k) {
                  return k !== 'included';
                }).forEach(function (key) {
                  childPkgNoInclude[key] = childPkg[key];
                });
                included.push(childPkgNoInclude);
                // childPkg.included.forEach((item) => {
                //   included.push(item);
                // });
                return { type: childPkg.type, id: childPkg.id };
              })
            };
          });

          var pkg = {
            links: {
              self: prefix + '/' + _this6.constructor.$name + '/' + _this6.$id
            },
            data: {
              type: _this6.constructor.$name,
              id: _this6.$id
            },
            attributes: attributes,
            relationships: relationships,
            included: included
          };

          return pkg;
        });
      });
    }

    // TODO: don't fetch if we $get() something that we already have

  }, {
    key: '$get',
    value: function $get(opts) {
      var _this7 = this;

      var keys = [$self];
      if (Array.isArray(opts)) {
        keys = opts;
      } else if (opts !== undefined) {
        if (opts === $all) {
          keys = Object.keys(this.constructor.$fields).filter(function (key) {
            return _this7.constructor.$fields[key].type === 'hasMany';
          }).concat($self);
        } else {
          keys = [opts];
        }
      }
      return _bluebird2.default.all(keys.map(function (key) {
        return _this7.$$singleGet(key);
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
      var _this8 = this;

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
          if (_this8[$loaded][$self] === false && _this8[$plump]) {
            return _this8[$plump].get(_this8.constructor, _this8.$id, key);
          } else {
            return true;
          }
        } else {
          if (_this8[$loaded][key] === false && _this8[$plump]) {
            // eslint-disable-line no-lonely-if
            return _this8.$relationships[key].$list();
          } else {
            return true;
          }
        }
      }).then(function (v) {
        if (v === true) {
          if (key === $self) {
            var retVal = {};
            for (var k in _this8[$store]) {
              if (_this8.constructor.$fields[k].type !== 'hasMany') {
                retVal[k] = _this8[$store][k];
              }
            }
            return retVal;
          } else {
            return Object.assign({}, _defineProperty({}, key, _this8[$store][key]));
          }
        } else if (v && v[$self] !== null) {
          _this8.$$copyValuesFrom(v);
          _this8[$loaded][key] = true;
          if (key === $self) {
            var _retVal = {};
            for (var _k in _this8[$store]) {
              if (_this8.constructor.$fields[_k].type !== 'hasMany') {
                _retVal[_k] = _this8[$store][_k];
              }
            }
            return _retVal;
          } else {
            return Object.assign({}, _defineProperty({}, key, _this8[$store][key]));
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
      var _this9 = this;

      var u = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this[$store];

      var update = (0, _mergeOptions2.default)({}, this[$store], u);
      Object.keys(this.constructor.$fields).forEach(function (key) {
        if (_this9.constructor.$fields[key].type === 'hasMany') {
          delete update[key];
        }
      });
      // this.$$copyValuesFrom(update); // this is the optimistic update;
      return this[$plump].save(this.constructor, update).then(function (updated) {
        _this9.$$copyValuesFrom(updated);
        return _this9;
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
      var _this10 = this;

      return _bluebird2.default.resolve().then(function () {
        if (_this10.constructor.$fields[key].type === 'hasMany') {
          var id = 0;
          if (typeof item === 'number') {
            id = item;
          } else if (item.$id) {
            id = item.$id;
          } else {
            id = item[_this10.constructor.$fields[key].relationship.$sides[key].other.field];
          }
          if (typeof id === 'number' && id >= 1) {
            return _this10[$plump].add(_this10.constructor, _this10.$id, key, id, extras);
          } else {
            return _bluebird2.default.reject(new Error('Invalid item added to hasMany'));
          }
        } else {
          return _bluebird2.default.reject(new Error('Cannot $add except to hasMany field'));
        }
      }).then(function (l) {
        _this10.$$copyValuesFrom(_defineProperty({}, key, l));
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
  var _this12 = this;

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
      _this12.$fields[k] = {
        type: 'hasMany',
        relationship: DynamicRelationship
      };
    } else {
      _this12.$fields[k] = Object.assign({}, field);
    }
  });
};

Model.toJSON = function toJSON() {
  var _this13 = this;

  var retVal = {
    $id: this.$id,
    $name: this.$name,
    $fields: {}
  };
  var fieldNames = Object.keys(this.$fields);
  fieldNames.forEach(function (k) {
    if (_this13.$fields[k].type === 'hasMany') {
      retVal.$fields[k] = {
        type: 'hasMany',
        relationship: _this13.$fields[k].relationship.toJSON()
      };
    } else {
      retVal.$fields[k] = _this13.$fields[k];
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
  var _this14 = this;

  var start = {};
  Object.keys(this.$fields).forEach(function (key) {
    if (opts[key]) {
      start[key] = opts[key];
    } else if (_this14.$fields[key].default) {
      start[key] = _this14.$fields[key].default;
    } else if (_this14.$fields[key].type === 'hasMany') {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRzdG9yZSIsIlN5bWJvbCIsIiRwbHVtcCIsIiRsb2FkZWQiLCIkdW5zdWJzY3JpYmUiLCIkc3ViamVjdCIsIiRzZWxmIiwiJGFsbCIsIk1vZGVsIiwib3B0cyIsInBsdW1wIiwiJHJlbGF0aW9uc2hpcHMiLCJuZXh0IiwiT2JqZWN0Iiwia2V5cyIsImNvbnN0cnVjdG9yIiwiJGZpZWxkcyIsImZvckVhY2giLCJrZXkiLCJ0eXBlIiwiUmVsIiwicmVsYXRpb25zaGlwIiwiZGVmYXVsdCIsIiQkY29weVZhbHVlc0Zyb20iLCJmaWVsZE5hbWUiLCJ1bmRlZmluZWQiLCJjb25jYXQiLCJhc3NpZ24iLCIkJGZpcmVVcGRhdGUiLCJzdWJzY3JpYmUiLCIkbmFtZSIsIiRpZCIsImZpZWxkIiwidmFsdWUiLCJmaWVsZHMiLCJjYiIsImxlbmd0aCIsIkFycmF5IiwiaXNBcnJheSIsIiQkaG9va1RvUGx1bXAiLCJzdHJlYW1HZXQiLCJ2Iiwib3B0aW9ucyIsImRvbWFpbiIsImFwaVBhdGgiLCJwcmVmaXgiLCIkZ2V0IiwiJHBhY2thZ2VJbmNsdWRlcyIsInRoZW4iLCJpbmZsYXRlZCIsInJlc29sdmUiLCJtYXAiLCJhbGwiLCJyZWwiLCJvdGhlclNpZGUiLCIkc2lkZXMiLCJvdGhlciIsImZpbmQiLCIkJHBhY2thZ2VGb3JJbmNsdXNpb24iLCJjaGlsZFBrZ3MiLCJhdHRyaWJ1dGVzIiwiZmlsdGVyIiwiayIsImluZGV4T2YiLCJhdHRyaWJ1dGUiLCJyZWxhdGlvbnNoaXBzIiwiaW5kZXgiLCJsaW5rcyIsInJlbGF0ZWQiLCJkYXRhIiwiY2hpbGRQa2ciLCJpZCIsInNlbGYiLCJpbmNsdWRlZCIsImNoaWxkUGtnTm9JbmNsdWRlIiwicHVzaCIsInBrZyIsIiQkc2luZ2xlR2V0IiwidmFsdWVBcnJheSIsInNlbGZJZHgiLCJyZWR1Y2UiLCJhY2N1bSIsImN1cnIiLCJvcHQiLCJnZXQiLCIkbGlzdCIsInJldFZhbCIsIiRzZXQiLCJ1IiwidXBkYXRlIiwic2F2ZSIsInVwZGF0ZWQiLCJkZWxldGUiLCJyZXN0T3B0cyIsInVybCIsInJlc3RSZXF1ZXN0IiwiaXRlbSIsImV4dHJhcyIsImFkZCIsInJlamVjdCIsIkVycm9yIiwibCIsIm1vZGlmeVJlbGF0aW9uc2hpcCIsInJlbW92ZSIsInVuc3Vic2NyaWJlIiwiZnJvbUpTT04iLCJqc29uIiwiRHluYW1pY1JlbGF0aW9uc2hpcCIsInRvSlNPTiIsImZpZWxkTmFtZXMiLCIkcmVzdCIsInN0YXJ0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7OztBQUNBLElBQU1BLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUMsU0FBU0QsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNRSxVQUFVRixPQUFPLFNBQVAsQ0FBaEI7QUFDQSxJQUFNRyxlQUFlSCxPQUFPLGNBQVAsQ0FBckI7QUFDQSxJQUFNSSxXQUFXSixPQUFPLFVBQVAsQ0FBakI7QUFDTyxJQUFNSyx3QkFBUUwsT0FBTyxPQUFQLENBQWQ7QUFDQSxJQUFNTSxzQkFBT04sT0FBTyxNQUFQLENBQWI7O0FBRVA7QUFDQTs7SUFFYU8sSyxXQUFBQSxLO0FBQ1gsaUJBQVlDLElBQVosRUFBa0JDLEtBQWxCLEVBQXlCO0FBQUE7O0FBQUE7O0FBQ3ZCLFNBQUtWLE1BQUwsSUFBZSxFQUFmO0FBQ0EsU0FBS1csY0FBTCxHQUFzQixFQUF0QjtBQUNBLFNBQUtOLFFBQUwsSUFBaUIseUJBQWpCO0FBQ0EsU0FBS0EsUUFBTCxFQUFlTyxJQUFmLENBQW9CLEVBQXBCO0FBQ0EsU0FBS1QsT0FBTCx3QkFDR0csS0FESCxFQUNXLEtBRFg7QUFHQU8sV0FBT0MsSUFBUCxDQUFZLEtBQUtDLFdBQUwsQ0FBaUJDLE9BQTdCLEVBQXNDQyxPQUF0QyxDQUE4QyxVQUFDQyxHQUFELEVBQVM7QUFDckQsVUFBSSxNQUFLSCxXQUFMLENBQWlCQyxPQUFqQixDQUF5QkUsR0FBekIsRUFBOEJDLElBQTlC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SSxRQUFLRixPQUFMLENBQWFFLEdBQWIsRUFBa0JJLE9BQXRCLEVBQStCO0FBQ3BDeUYsWUFBTTdGLEdBQU4sSUFBYSxRQUFLRixPQUFMLENBQWFFLEdBQWIsRUFBa0JJLE9BQS9CO0FBQ0QsS0FGTSxNQUVBLElBQUksUUFBS04sT0FBTCxDQUFhRSxHQUFiLEVBQWtCQyxJQUFsQixLQUEyQixTQUEvQixFQUEwQztBQUMvQzRGLFlBQU03RixHQUFOLElBQWEsRUFBYjtBQUNELEtBRk0sTUFFQTtBQUNMNkYsWUFBTTdGLEdBQU4sSUFBYSxJQUFiO0FBQ0Q7QUFDRixHQVZEO0FBV0EsU0FBTzZGLEtBQVA7QUFDRCxDQWREOztBQWdCQXZHLE1BQU11QixHQUFOLEdBQVksSUFBWjtBQUNBdkIsTUFBTXNCLEtBQU4sR0FBYyxNQUFkO0FBQ0F0QixNQUFNRixLQUFOLEdBQWNBLEtBQWQ7QUFDQUUsTUFBTVEsT0FBTixHQUFnQjtBQUNkdUQsTUFBSTtBQUNGcEQsVUFBTTtBQURKO0FBRFUsQ0FBaEIiLCJmaWxlIjoibW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHsgUmVsYXRpb25zaGlwIH0gZnJvbSAnLi9yZWxhdGlvbnNoaXAnO1xuaW1wb3J0IG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcbmltcG9ydCB7IEJlaGF2aW9yU3ViamVjdCB9IGZyb20gJ3J4anMvUngnO1xuY29uc3QgJHN0b3JlID0gU3ltYm9sKCckc3RvcmUnKTtcbmNvbnN0ICRwbHVtcCA9IFN5bWJvbCgnJHBsdW1wJyk7XG5jb25zdCAkbG9hZGVkID0gU3ltYm9sKCckbG9hZGVkJyk7XG5jb25zdCAkdW5zdWJzY3JpYmUgPSBTeW1ib2woJyR1bnN1YnNjcmliZScpO1xuY29uc3QgJHN1YmplY3QgPSBTeW1ib2woJyRzdWJqZWN0Jyk7XG5leHBvcnQgY29uc3QgJHNlbGYgPSBTeW1ib2woJyRzZWxmJyk7XG5leHBvcnQgY29uc3QgJGFsbCA9IFN5bWJvbCgnJGFsbCcpO1xuXG4vLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIGVycm9yIGV2ZW50cyBvcmlnaW5hdGUgKHN0b3JhZ2Ugb3IgbW9kZWwpXG4vLyBhbmQgd2hvIGtlZXBzIGEgcm9sbC1iYWNrYWJsZSBkZWx0YVxuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzLCBwbHVtcCkge1xuICAgIHRoaXNbJHN0b3JlXSA9IHt9O1xuICAgIHRoaXMuJHJlbGF0aW9uc2hpcHMgPSB7fTtcbiAgICB0aGlzWyRzdWJqZWN0XSA9IG5ldyBCZWhhdmlvclN1YmplY3QoKTtcbiAgICB0aGlzWyRzdWJqZWN0XS5uZXh0KHt9KTtcbiAgICB0aGlzWyRsb2FkZWRdID0ge1xuICAgICAgWyRzZWxmXTogZmFsc2UsXG4gICAgfTtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgICBjb25zdCBSZWwgPSB0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS5yZWxhdGlvbnNoaXA7XG4gICAgICAgIHRoaXMuJHJlbGF0aW9uc2hpcHNba2V5XSA9IG5ldyBSZWwodGhpcywga2V5LCBwbHVtcCk7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gW107XG4gICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpc1skc3RvcmVdW2tleV0gPSB0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS5kZWZhdWx0IHx8IG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKG9wdHMgfHwge30pO1xuICAgIGlmIChwbHVtcCkge1xuICAgICAgdGhpc1skcGx1bXBdID0gcGx1bXA7XG4gICAgfVxuICB9XG5cbiAgZ2V0ICRuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLiRuYW1lO1xuICB9XG5cbiAgZ2V0ICRpZCgpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmVdW3RoaXMuY29uc3RydWN0b3IuJGlkXTtcbiAgfVxuXG4gICQkY29weVZhbHVlc0Zyb20ob3B0cyA9IHt9KSB7XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChmaWVsZE5hbWUpID0+IHtcbiAgICAgIGlmIChvcHRzW2ZpZWxkTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBjb3B5IGZyb20gb3B0cyB0byB0aGUgYmVzdCBvZiBvdXIgYWJpbGl0eVxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdhcnJheScpIHx8XG4gICAgICAgICAgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdoYXNNYW55JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSAob3B0c1tmaWVsZE5hbWVdIHx8IFtdKS5jb25jYXQoKTtcbiAgICAgICAgICB0aGlzWyRsb2FkZWRdW2ZpZWxkTmFtZV0gPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBPYmplY3QuYXNzaWduKHt9LCBvcHRzW2ZpZWxkTmFtZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gb3B0c1tmaWVsZE5hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy4kJGZpcmVVcGRhdGUoKTtcbiAgfVxuXG4gICQkaG9va1RvUGx1bXAoKSB7XG4gICAgaWYgKHRoaXNbJHVuc3Vic2NyaWJlXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyR1bnN1YnNjcmliZV0gPSB0aGlzWyRwbHVtcF0uc3Vic2NyaWJlKHRoaXMuY29uc3RydWN0b3IuJG5hbWUsIHRoaXMuJGlkLCAoeyBmaWVsZCwgdmFsdWUgfSkgPT4ge1xuICAgICAgICBpZiAoZmllbGQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIC8vIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2YWx1ZSk7XG4gICAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHsgW2ZpZWxkXTogdmFsdWUgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgJHN1YnNjcmliZSguLi5hcmdzKSB7XG4gICAgbGV0IGZpZWxkcyA9IFskc2VsZl07XG4gICAgbGV0IGNiO1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMikge1xuICAgICAgZmllbGRzID0gYXJnc1swXTtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShmaWVsZHMpKSB7XG4gICAgICAgIGZpZWxkcyA9IFtmaWVsZHNdO1xuICAgICAgfVxuICAgICAgY2IgPSBhcmdzWzFdO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYiA9IGFyZ3NbMF07XG4gICAgfVxuICAgIHRoaXMuJCRob29rVG9QbHVtcCgpO1xuICAgIGlmICh0aGlzWyRsb2FkZWRdWyRzZWxmXSA9PT0gZmFsc2UpIHtcbiAgICAgIHRoaXNbJHBsdW1wXS5zdHJlYW1HZXQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGZpZWxkcylcbiAgICAgIC5zdWJzY3JpYmUoKHYpID0+IHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzWyRzdWJqZWN0XS5zdWJzY3JpYmUoY2IpO1xuICB9XG5cbiAgJCRmaXJlVXBkYXRlKCkge1xuICAgIHRoaXNbJHN1YmplY3RdLm5leHQodGhpc1skc3RvcmVdKTtcbiAgfVxuXG4gICQkcGFja2FnZUZvckluY2x1c2lvbihvcHRzKSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHtcbiAgICAgICAgZG9tYWluOiAnaHR0cHM6Ly9leGFtcGxlLmNvbScsXG4gICAgICAgIGFwaVBhdGg6ICcvYXBpJyxcbiAgICAgIH0sXG4gICAgICBvcHRzXG4gICAgKTtcbiAgICBjb25zdCBwcmVmaXggPSBgJHtvcHRpb25zLmRvbWFpbn0ke29wdGlvbnMuYXBpUGF0aH1gO1xuXG4gICAgcmV0dXJuIHRoaXMuJGdldChcbiAgICAgIHRoaXMuY29uc3RydWN0b3IuJHBhY2thZ2VJbmNsdWRlcy5jb25jYXQoJHNlbGYpXG4gICAgKS50aGVuKChpbmZsYXRlZCkgPT4ge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuJHBhY2thZ2VJbmNsdWRlcy5tYXAoKHJlbGF0aW9uc2hpcCkgPT4ge1xuICAgICAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoXG4gICAgICAgICAgICBpbmZsYXRlZFtyZWxhdGlvbnNoaXBdLm1hcCgocmVsKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IG90aGVyU2lkZSA9IHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tyZWxhdGlvbnNoaXBdLnJlbGF0aW9uc2hpcC4kc2lkZXNbcmVsYXRpb25zaGlwXS5vdGhlcjtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5maW5kKFxuICAgICAgICAgICAgICAgIG90aGVyU2lkZS50eXBlLFxuICAgICAgICAgICAgICAgIHJlbFtvdGhlclNpZGUuZmllbGRdXG4gICAgICAgICAgICAgICkuJCRwYWNrYWdlRm9ySW5jbHVzaW9uKCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgICAgfSkudGhlbigoY2hpbGRQa2dzKSA9PiB7XG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSB7fTtcbiAgICAgICAgT2JqZWN0LmtleXMoaW5mbGF0ZWQpLmZpbHRlcihrID0+IGsgIT09ICdpZCcgJiYgKHRoaXMuY29uc3RydWN0b3IuJHBhY2thZ2VJbmNsdWRlcy5pbmRleE9mKGspIDwgMCkpXG4gICAgICAgIC5mb3JFYWNoKChhdHRyaWJ1dGUpID0+IHtcbiAgICAgICAgICBhdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gPSBpbmZsYXRlZFthdHRyaWJ1dGVdO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBjb25zdCBpbmNsdWRlZCA9IFtdO1xuICAgICAgICBjb25zdCByZWxhdGlvbnNoaXBzID0ge307XG4gICAgICAgIHRoaXMuY29uc3RydWN0b3IuJHBhY2thZ2VJbmNsdWRlcy5mb3JFYWNoKChyZWxhdGlvbnNoaXAsIGluZGV4KSA9PiB7XG4gICAgICAgICAgcmVsYXRpb25zaGlwc1tyZWxhdGlvbnNoaXBdID0ge1xuICAgICAgICAgICAgbGlua3M6IHtcbiAgICAgICAgICAgICAgcmVsYXRlZDogYCR7cHJlZml4fS8ke3RoaXMuY29uc3RydWN0b3IuJG5hbWV9LyR7dGhpcy4kaWR9LyR7cmVsYXRpb25zaGlwfWAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGF0YTogY2hpbGRQa2dzW2luZGV4XS5tYXAoKGNoaWxkUGtnKSA9PiB7XG4gICAgICAgICAgICAgIC8vIGNvbnN0IGNoaWxkUGtnTm9JbmNsdWRlID0ge307XG4gICAgICAgICAgICAgIC8vIE9iamVjdC5rZXlzKGNoaWxkUGtnKS5maWx0ZXIoayA9PiBrICE9PSAnaW5jbHVkZWQnKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgICAgLy8gICBjaGlsZFBrZ05vSW5jbHVkZVtrZXldID0gY2hpbGRQa2dba2V5XTtcbiAgICAgICAgICAgICAgLy8gfSk7XG4gICAgICAgICAgICAgIC8vIGluY2x1ZGVkLnB1c2goY2hpbGRQa2dOb0luY2x1ZGUpO1xuICAgICAgICAgICAgICAvLyBjaGlsZFBrZy5pbmNsdWRlZC5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgIC8vICAgaW5jbHVkZWQucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgLy8gfSk7XG4gICAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IGNoaWxkUGtnLnR5cGUsIGlkOiBjaGlsZFBrZy5pZCB9O1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiB0aGlzLmNvbnN0cnVjdG9yLiRuYW1lLFxuICAgICAgICAgIGlkOiB0aGlzLiRpZCxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiBhdHRyaWJ1dGVzLFxuICAgICAgICAgIHJlbGF0aW9uc2hpcHM6IHJlbGF0aW9uc2hpcHMsXG4gICAgICAgICAgbGlua3M6IHtcbiAgICAgICAgICAgIHNlbGY6IGAke3ByZWZpeH0vJHt0aGlzLmNvbnN0cnVjdG9yLiRuYW1lfS8ke3RoaXMuJGlkfWAsXG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgJHBhY2thZ2Uob3B0cykge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIGRvbWFpbjogJ2h0dHBzOi8vZXhhbXBsZS5jb20nLFxuICAgICAgICBhcGlQYXRoOiAnL2FwaScsXG4gICAgICB9LFxuICAgICAgb3B0c1xuICAgICk7XG4gICAgY29uc3QgcHJlZml4ID0gYCR7b3B0aW9ucy5kb21haW59JHtvcHRpb25zLmFwaVBhdGh9YDtcblxuICAgIHJldHVybiB0aGlzLiRnZXQoXG4gICAgICB0aGlzLmNvbnN0cnVjdG9yLiRwYWNrYWdlSW5jbHVkZXMuY29uY2F0KCRzZWxmKVxuICAgIClcbiAgICAudGhlbigoaW5mbGF0ZWQpID0+IHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLiRwYWNrYWdlSW5jbHVkZXMubWFwKChyZWxhdGlvbnNoaXApID0+IHtcbiAgICAgICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFxuICAgICAgICAgICAgaW5mbGF0ZWRbcmVsYXRpb25zaGlwXS5tYXAoKHJlbCkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBvdGhlclNpZGUgPSB0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbcmVsYXRpb25zaGlwXS5yZWxhdGlvbnNoaXAuJHNpZGVzW3JlbGF0aW9uc2hpcF0ub3RoZXI7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZmluZChcbiAgICAgICAgICAgICAgICBvdGhlclNpZGUudHlwZSxcbiAgICAgICAgICAgICAgICByZWxbb3RoZXJTaWRlLmZpZWxkXVxuICAgICAgICAgICAgICApLiQkcGFja2FnZUZvckluY2x1c2lvbigpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICAgIH0pLnRoZW4oKGNoaWxkUGtncykgPT4ge1xuICAgICAgICBjb25zdCBhdHRyaWJ1dGVzID0ge307XG4gICAgICAgIE9iamVjdC5rZXlzKGluZmxhdGVkKS5maWx0ZXIoayA9PiBrICE9PSAnaWQnICYmICh0aGlzLmNvbnN0cnVjdG9yLiRwYWNrYWdlSW5jbHVkZXMuaW5kZXhPZihrKSA8IDApKVxuICAgICAgICAuZm9yRWFjaCgoYXR0cmlidXRlKSA9PiB7XG4gICAgICAgICAgYXR0cmlidXRlc1thdHRyaWJ1dGVdID0gaW5mbGF0ZWRbYXR0cmlidXRlXTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgaW5jbHVkZWQgPSBbXTtcbiAgICAgICAgY29uc3QgcmVsYXRpb25zaGlwcyA9IHt9O1xuICAgICAgICB0aGlzLmNvbnN0cnVjdG9yLiRwYWNrYWdlSW5jbHVkZXMuZm9yRWFjaCgocmVsYXRpb25zaGlwLCBpbmRleCkgPT4ge1xuICAgICAgICAgIHJlbGF0aW9uc2hpcHNbcmVsYXRpb25zaGlwXSA9IHtcbiAgICAgICAgICAgIGxpbmtzOiB7XG4gICAgICAgICAgICAgIHJlbGF0ZWQ6IGAke3ByZWZpeH0vJHt0aGlzLmNvbnN0cnVjdG9yLiRuYW1lfS8ke3RoaXMuJGlkfS8ke3JlbGF0aW9uc2hpcH1gLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRhdGE6IGNoaWxkUGtnc1tpbmRleF0ubWFwKChjaGlsZFBrZykgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBjaGlsZFBrZ05vSW5jbHVkZSA9IHt9O1xuICAgICAgICAgICAgICBPYmplY3Qua2V5cyhjaGlsZFBrZykuZmlsdGVyKGsgPT4gayAhPT0gJ2luY2x1ZGVkJykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgY2hpbGRQa2dOb0luY2x1ZGVba2V5XSA9IGNoaWxkUGtnW2tleV07XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICBpbmNsdWRlZC5wdXNoKGNoaWxkUGtnTm9JbmNsdWRlKTtcbiAgICAgICAgICAgICAgLy8gY2hpbGRQa2cuaW5jbHVkZWQuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAvLyAgIGluY2x1ZGVkLnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgIC8vIH0pO1xuICAgICAgICAgICAgICByZXR1cm4geyB0eXBlOiBjaGlsZFBrZy50eXBlLCBpZDogY2hpbGRQa2cuaWQgfTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHBrZyA9IHtcbiAgICAgICAgICBsaW5rczoge1xuICAgICAgICAgICAgc2VsZjogYCR7cHJlZml4fS8ke3RoaXMuY29uc3RydWN0b3IuJG5hbWV9LyR7dGhpcy4kaWR9YCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHR5cGU6IHRoaXMuY29uc3RydWN0b3IuJG5hbWUsXG4gICAgICAgICAgICBpZDogdGhpcy4kaWQsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiBhdHRyaWJ1dGVzLFxuICAgICAgICAgIHJlbGF0aW9uc2hpcHM6IHJlbGF0aW9uc2hpcHMsXG4gICAgICAgICAgaW5jbHVkZWQ6IGluY2x1ZGVkLFxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBwa2c7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFRPRE86IGRvbid0IGZldGNoIGlmIHdlICRnZXQoKSBzb21ldGhpbmcgdGhhdCB3ZSBhbHJlYWR5IGhhdmVcblxuICAkZ2V0KG9wdHMpIHtcbiAgICBsZXQga2V5cyA9IFskc2VsZl07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkob3B0cykpIHtcbiAgICAgIGtleXMgPSBvcHRzO1xuICAgIH0gZWxzZSBpZiAob3B0cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAob3B0cyA9PT0gJGFsbCkge1xuICAgICAgICBrZXlzID0gT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKVxuICAgICAgICAuZmlsdGVyKChrZXkpID0+IHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55JylcbiAgICAgICAgLmNvbmNhdCgkc2VsZik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBrZXlzID0gW29wdHNdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKGtleXMubWFwKChrZXkpID0+IHRoaXMuJCRzaW5nbGVHZXQoa2V5KSkpXG4gICAgLnRoZW4oKHZhbHVlQXJyYXkpID0+IHtcbiAgICAgIGNvbnN0IHNlbGZJZHggPSBrZXlzLmluZGV4T2YoJHNlbGYpO1xuICAgICAgaWYgKChzZWxmSWR4ID49IDApICYmICh2YWx1ZUFycmF5W3NlbGZJZHhdID09PSBudWxsKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB2YWx1ZUFycmF5LnJlZHVjZSgoYWNjdW0sIGN1cnIpID0+IE9iamVjdC5hc3NpZ24oYWNjdW0sIGN1cnIpLCB7fSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAkJHNpbmdsZUdldChvcHQgPSAkc2VsZikge1xuICAgIC8vIHRocmVlIGNhc2VzLlxuICAgIC8vIGtleSA9PT0gdW5kZWZpbmVkIC0gZmV0Y2ggYWxsLCB1bmxlc3MgJGxvYWRlZCwgYnV0IHJldHVybiBhbGwuXG4gICAgLy8gZmllbGRzW2tleV0gPT09ICdoYXNNYW55JyAtIGZldGNoIGNoaWxkcmVuIChwZXJoYXBzIG1vdmUgdGhpcyBkZWNpc2lvbiB0byBzdG9yZSlcbiAgICAvLyBvdGhlcndpc2UgLSBmZXRjaCBhbGwsIHVubGVzcyAkc3RvcmVba2V5XSwgcmV0dXJuICRzdG9yZVtrZXldLlxuICAgIGxldCBrZXk7XG4gICAgaWYgKChvcHQgIT09ICRzZWxmKSAmJiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW29wdF0udHlwZSAhPT0gJ2hhc01hbnknKSkge1xuICAgICAga2V5ID0gJHNlbGY7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtleSA9IG9wdDtcbiAgICB9XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmIChrZXkgPT09ICRzZWxmKSB7XG4gICAgICAgIGlmICh0aGlzWyRsb2FkZWRdWyRzZWxmXSA9PT0gZmFsc2UgJiYgdGhpc1skcGx1bXBdKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5nZXQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICgodGhpc1skbG9hZGVkXVtrZXldID09PSBmYWxzZSkgJiYgdGhpc1skcGx1bXBdKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbG9uZWx5LWlmXG4gICAgICAgICAgcmV0dXJuIHRoaXMuJHJlbGF0aW9uc2hpcHNba2V5XS4kbGlzdCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkudGhlbigodikgPT4ge1xuICAgICAgaWYgKHYgPT09IHRydWUpIHtcbiAgICAgICAgaWYgKGtleSA9PT0gJHNlbGYpIHtcbiAgICAgICAgICBjb25zdCByZXRWYWwgPSB7fTtcbiAgICAgICAgICBmb3IgKGNvbnN0IGsgaW4gdGhpc1skc3RvcmVdKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tdLnR5cGUgIT09ICdoYXNNYW55Jykge1xuICAgICAgICAgICAgICByZXRWYWxba10gPSB0aGlzWyRzdG9yZV1ba107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXRWYWw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHsgW2tleV06IHRoaXNbJHN0b3JlXVtrZXldIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHYgJiYgKHZbJHNlbGZdICE9PSBudWxsKSkge1xuICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odik7XG4gICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IHRydWU7XG4gICAgICAgIGlmIChrZXkgPT09ICRzZWxmKSB7XG4gICAgICAgICAgY29uc3QgcmV0VmFsID0ge307XG4gICAgICAgICAgZm9yIChjb25zdCBrIGluIHRoaXNbJHN0b3JlXSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trXS50eXBlICE9PSAnaGFzTWFueScpIHtcbiAgICAgICAgICAgICAgcmV0VmFsW2tdID0gdGhpc1skc3RvcmVdW2tdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmV0VmFsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCB7IFtrZXldOiB0aGlzWyRzdG9yZV1ba2V5XSB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAkc2F2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy4kc2V0KCk7XG4gIH1cblxuICAkc2V0KHUgPSB0aGlzWyRzdG9yZV0pIHtcbiAgICBjb25zdCB1cGRhdGUgPSBtZXJnZU9wdGlvbnMoe30sIHRoaXNbJHN0b3JlXSwgdSk7XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgZGVsZXRlIHVwZGF0ZVtrZXldO1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8vIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh1cGRhdGUpOyAvLyB0aGlzIGlzIHRoZSBvcHRpbWlzdGljIHVwZGF0ZTtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLnNhdmUodGhpcy5jb25zdHJ1Y3RvciwgdXBkYXRlKVxuICAgIC50aGVuKCh1cGRhdGVkKSA9PiB7XG4gICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odXBkYXRlZCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9KTtcbiAgfVxuXG4gICRkZWxldGUoKSB7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5kZWxldGUodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQpO1xuICB9XG5cbiAgJHJlc3Qob3B0cykge1xuICAgIGNvbnN0IHJlc3RPcHRzID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAgb3B0cyxcbiAgICAgIHtcbiAgICAgICAgdXJsOiBgLyR7dGhpcy5jb25zdHJ1Y3Rvci4kbmFtZX0vJHt0aGlzLiRpZH0vJHtvcHRzLnVybH1gLFxuICAgICAgfVxuICAgICk7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5yZXN0UmVxdWVzdChyZXN0T3B0cyk7XG4gIH1cblxuICAkYWRkKGtleSwgaXRlbSwgZXh0cmFzKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgbGV0IGlkID0gMDtcbiAgICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIGlkID0gaXRlbTtcbiAgICAgICAgfSBlbHNlIGlmIChpdGVtLiRpZCkge1xuICAgICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWQgPSBpdGVtW3RoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnJlbGF0aW9uc2hpcC4kc2lkZXNba2V5XS5vdGhlci5maWVsZF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLmFkZCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpZCwgZXh0cmFzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpKTtcbiAgICAgIH1cbiAgICB9KS50aGVuKChsKSA9PiB7XG4gICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20oeyBba2V5XTogbCB9KTtcbiAgICAgIHJldHVybiBsO1xuICAgIH0pO1xuICB9XG5cbiAgJG1vZGlmeVJlbGF0aW9uc2hpcChrZXksIGl0ZW0sIGV4dHJhcykge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICB0aGlzWyRzdG9yZV1ba2V5XSA9IFtdO1xuICAgICAgICB0aGlzWyRsb2FkZWRdW2tleV0gPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5tb2RpZnlSZWxhdGlvbnNoaXAodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaWQsIGV4dHJhcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkcmVtb3ZlKGtleSwgaXRlbSkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICB0aGlzWyRzdG9yZV1ba2V5XSA9IFtdO1xuICAgICAgICB0aGlzWyRsb2FkZWRdW2tleV0gPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5yZW1vdmUodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSAkcmVtb3ZlZCBmcm9tIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJHJlbW92ZSBleGNlcHQgZnJvbSBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICR0ZWFyZG93bigpIHtcbiAgICBpZiAodGhpc1skdW5zdWJzY3JpYmVdKSB7XG4gICAgICB0aGlzWyR1bnN1YnNjcmliZV0udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cbn1cblxuTW9kZWwuZnJvbUpTT04gPSBmdW5jdGlvbiBmcm9tSlNPTihqc29uKSB7XG4gIHRoaXMuJGlkID0ganNvbi4kaWQgfHwgJ2lkJztcbiAgdGhpcy4kbmFtZSA9IGpzb24uJG5hbWU7XG4gIHRoaXMuJGZpZWxkcyA9IHt9O1xuICBPYmplY3Qua2V5cyhqc29uLiRmaWVsZHMpLmZvckVhY2goKGspID0+IHtcbiAgICBjb25zdCBmaWVsZCA9IGpzb24uJGZpZWxkc1trXTtcbiAgICBpZiAoZmllbGQudHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBjbGFzcyBEeW5hbWljUmVsYXRpb25zaGlwIGV4dGVuZHMgUmVsYXRpb25zaGlwIHt9XG4gICAgICBEeW5hbWljUmVsYXRpb25zaGlwLmZyb21KU09OKGZpZWxkLnJlbGF0aW9uc2hpcCk7XG4gICAgICB0aGlzLiRmaWVsZHNba10gPSB7XG4gICAgICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICAgICAgcmVsYXRpb25zaGlwOiBEeW5hbWljUmVsYXRpb25zaGlwLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kZmllbGRzW2tdID0gT2JqZWN0LmFzc2lnbih7fSwgZmllbGQpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5Nb2RlbC50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04oKSB7XG4gIGNvbnN0IHJldFZhbCA9IHtcbiAgICAkaWQ6IHRoaXMuJGlkLFxuICAgICRuYW1lOiB0aGlzLiRuYW1lLFxuICAgICRmaWVsZHM6IHt9LFxuICB9O1xuICBjb25zdCBmaWVsZE5hbWVzID0gT2JqZWN0LmtleXModGhpcy4kZmllbGRzKTtcbiAgZmllbGROYW1lcy5mb3JFYWNoKChrKSA9PiB7XG4gICAgaWYgKHRoaXMuJGZpZWxkc1trXS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIHJldFZhbC4kZmllbGRzW2tdID0ge1xuICAgICAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgICAgIHJlbGF0aW9uc2hpcDogdGhpcy4kZmllbGRzW2tdLnJlbGF0aW9uc2hpcC50b0pTT04oKSxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldFZhbC4kZmllbGRzW2tdID0gdGhpcy4kZmllbGRzW2tdO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZXRWYWw7XG59O1xuXG5Nb2RlbC4kcmVzdCA9IGZ1bmN0aW9uICRyZXN0KHBsdW1wLCBvcHRzKSB7XG4gIGNvbnN0IHJlc3RPcHRzID0gT2JqZWN0LmFzc2lnbihcbiAgICB7fSxcbiAgICBvcHRzLFxuICAgIHtcbiAgICAgIHVybDogYC8ke3RoaXMuJG5hbWV9LyR7b3B0cy51cmx9YCxcbiAgICB9XG4gICk7XG4gIHJldHVybiBwbHVtcC5yZXN0UmVxdWVzdChyZXN0T3B0cyk7XG59O1xuXG5Nb2RlbC5hc3NpZ24gPSBmdW5jdGlvbiBhc3NpZ24ob3B0cykge1xuICBjb25zdCBzdGFydCA9IHt9O1xuICBPYmplY3Qua2V5cyh0aGlzLiRmaWVsZHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgIGlmIChvcHRzW2tleV0pIHtcbiAgICAgIHN0YXJ0W2tleV0gPSBvcHRzW2tleV07XG4gICAgfSBlbHNlIGlmICh0aGlzLiRmaWVsZHNba2V5XS5kZWZhdWx0KSB7XG4gICAgICBzdGFydFtrZXldID0gdGhpcy4kZmllbGRzW2tleV0uZGVmYXVsdDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgc3RhcnRba2V5XSA9IFtdO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGFydFtrZXldID0gbnVsbDtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gc3RhcnQ7XG59O1xuXG5Nb2RlbC4kaWQgPSAnaWQnO1xuTW9kZWwuJG5hbWUgPSAnQmFzZSc7XG5Nb2RlbC4kc2VsZiA9ICRzZWxmO1xuTW9kZWwuJGZpZWxkcyA9IHtcbiAgaWQ6IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbn07XG4iXX0=
