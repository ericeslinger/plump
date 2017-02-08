'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Model = exports.$all = exports.$self = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

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
    key: '$package',
    value: function $package(opts) {
      var _this6 = this;

      var options = Object.assign({}, {
        domain: 'https://example.com',
        apiPath: '/api'
      }, opts);
      var prefix = '' + options.domain + options.apiPath;

      return _bluebird2.default.all([this.$get(this.$$relatedFields.concat($self)), this[$plump].bulkGet(this.$$relatedFields)]).then(function (_ref2) {
        var _ref3 = _slicedToArray(_ref2, 2),
            self = _ref3[0],
            extendedJSON = _ref3[1];

        var extended = {};

        var _loop = function _loop(rel) {
          // eslint-disable-line guard-for-in
          var type = _this6.$relationships[rel].constructor.$sides[rel].other.type;
          extended[rel] = extendedJSON[rel].map(function (data) {
            return _this6[$plump].forge(type, data);
          });
        };

        for (var rel in extendedJSON) {
          _loop(rel);
        }

        return _bluebird2.default.all([self, _this6.$$relatedPackage(extended, options), _this6.$$includedPackage(extended, options)]);
      }).then(function (_ref4) {
        var _ref5 = _slicedToArray(_ref4, 3),
            self = _ref5[0],
            relationships = _ref5[1],
            included = _ref5[2];

        var attributes = {};
        _this6.$$attributeFields.forEach(function (key) {
          attributes[key] = self[key];
        });

        var retVal = {
          links: { self: '' + prefix + _this6.$$path },
          data: _this6.$$dataJSON,
          attributes: attributes,
          included: included
        };

        if (Object.keys(relationships).length > 0) {
          retVal.relationships = relationships;
        }

        return retVal;
      });
    }
  }, {
    key: '$$relatedPackage',
    value: function $$relatedPackage(extended, opts) {
      var _this7 = this;

      var options = Object.assign({}, {
        include: this.constructor.$include,
        domain: 'https://example.com',
        apiPath: '/api'
      }, opts);
      var prefix = '' + options.domain + opts.apiPath;
      var fields = Object.keys(options.include).filter(function (rel) {
        return _this7[$store][rel] !== undefined;
      });

      return this.$get(fields).then(function (self) {
        var retVal = {};
        fields.forEach(function (field) {
          if (extended[field] && self[field].length) {
            (function () {
              var childIds = self[field].map(function (rel) {
                return rel[_this7.$relationships[field].constructor.$sides[field].other.field];
              });
              retVal[field] = {
                links: {
                  related: '' + prefix + _this7.$$path + '/' + field
                },
                data: extended[field].filter(function (child) {
                  return childIds.indexOf(child.$id) >= 0;
                }).map(function (child) {
                  return child.$$dataJSON;
                })
              };
            })();
          }
        });

        return retVal;
      });
    }
  }, {
    key: '$$includedPackage',
    value: function $$includedPackage(extended, opts) {
      var _this8 = this;

      return _bluebird2.default.all(Object.keys(extended).map(function (relationship) {
        return _bluebird2.default.all(extended[relationship].map(function (child) {
          var childOpts = Object.assign({}, opts, { include: _this8.constructor.$include });
          return child.$$packageForInclusion(extended, childOpts);
        }));
      })).then(function (relationships) {
        return relationships.reduce(function (acc, curr) {
          return acc.concat(curr);
        });
      });
    }
  }, {
    key: '$$packageForInclusion',
    value: function $$packageForInclusion(extended) {
      var _this9 = this;

      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var options = Object.assign({}, {
        domain: 'https://example.com',
        apiPath: '/api',
        include: this.constructor.$include
      }, opts);
      var prefix = '' + options.domain + options.apiPath;

      return this.$get(this.$$relatedFields.concat($self)).then(function (self) {
        var related = {};
        _this9.$$relatedFields.forEach(function (field) {
          var childIds = self[field].map(function (rel) {
            return rel[_this9.$relationships[field].constructor.$sides[field].other.field];
          });
          related[field] = extended[field].filter(function (model) {
            return childIds.indexOf(model.$id) >= 0;
          });
        });
        return _this9.$$relatedPackage(related, opts).then(function (relationships) {
          var attributes = {};
          _this9.$$attributeFields.forEach(function (field) {
            attributes[field] = self[field];
          });

          var retVal = {
            type: _this9.$name,
            id: _this9.$id,
            attributes: attributes,
            links: {
              self: '' + prefix + _this9.$$path
            }
          };

          if (Object.keys(relationships).length > 0) {
            retVal.relationships = relationships;
          }

          return retVal;
        });
      });
    }

    // TODO: don't fetch if we $get() something that we already have

  }, {
    key: '$get',
    value: function $get() {
      var _this10 = this;

      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : $self;

      var keys = void 0;
      if (Array.isArray(opts)) {
        keys = opts;
      } else {
        keys = [opts];
      }
      return _bluebird2.default.all(keys.map(function (key) {
        return _this10.$$singleGet(key);
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
      var _this11 = this;

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
        if (!_this11.$$isLoaded(key) && _this11[$plump]) {
          if ((typeof key === 'undefined' ? 'undefined' : _typeof(key)) === 'symbol') {
            // key === $self or $all
            return _this11[$plump].get(_this11.constructor, _this11.$id, key);
          } else {
            return _this11.$relationships[key].$list();
          }
        } else {
          return true;
        }
      }).then(function (v) {
        if (v === true) {
          if (key === $self) {
            var retVal = {};
            for (var k in _this11[$store]) {
              if (_this11.constructor.$fields[k].type !== 'hasMany') {
                retVal[k] = _this11[$store][k];
              }
            }
            return retVal;
          } else {
            return Object.assign({}, _defineProperty({}, key, _this11[$store][key]));
          }
        } else if (v && v[$self] !== null) {
          _this11.$$copyValuesFrom(v);
          if (key === $all) {
            for (var _k in _this11[$loaded]) {
              // eslint-disable-line guard-for-in
              _this11[$loaded][_k] = true;
            }
          } else {
            _this11[$loaded][key] = true;
          }
          if (key === $self) {
            var _retVal = {};
            for (var _k2 in _this11[$store]) {
              if (_this11.constructor.$fields[_k2].type !== 'hasMany') {
                _retVal[_k2] = _this11[$store][_k2];
              }
            }
            return _retVal;
          } else if (key === $all) {
            return Object.assign({}, _this11[$store]);
          } else {
            return Object.assign({}, _defineProperty({}, key, _this11[$store][key]));
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
      var _this12 = this;

      var u = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this[$store];

      var update = (0, _mergeOptions2.default)({}, this[$store], u);
      Object.keys(this.constructor.$fields).forEach(function (key) {
        if (_this12.constructor.$fields[key].type === 'hasMany') {
          delete update[key];
        }
      });
      // this.$$copyValuesFrom(update); // this is the optimistic update;
      return this[$plump].save(this.constructor, update).then(function (updated) {
        _this12.$$copyValuesFrom(updated);
        return _this12;
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
      var _this13 = this;

      return _bluebird2.default.resolve().then(function () {
        if (_this13.constructor.$fields[key].type === 'hasMany') {
          var id = 0;
          if (typeof item === 'number') {
            id = item;
          } else if (item.$id) {
            id = item.$id;
          } else {
            id = item[_this13.constructor.$fields[key].relationship.$sides[key].other.field];
          }
          if (typeof id === 'number' && id >= 1) {
            return _this13[$plump].add(_this13.constructor, _this13.$id, key, id, extras);
          } else {
            return _bluebird2.default.reject(new Error('Invalid item added to hasMany'));
          }
        } else {
          return _bluebird2.default.reject(new Error('Cannot $add except to hasMany field'));
        }
      }).then(function (l) {
        _this13.$$copyValuesFrom(_defineProperty({}, key, l));
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
    key: '$$attributeFields',
    get: function get() {
      var _this14 = this;

      return Object.keys(this.constructor.$fields).filter(function (key) {
        return key !== _this14.constructor.$id && _this14.constructor.$fields[key].type !== 'hasMany';
      });
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
  var _this16 = this;

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
      _this16.$fields[k] = {
        type: 'hasMany',
        relationship: DynamicRelationship
      };
    } else {
      _this16.$fields[k] = Object.assign({}, field);
    }
  });
};

Model.toJSON = function toJSON() {
  var _this17 = this;

  var retVal = {
    $id: this.$id,
    $name: this.$name,
    $fields: {}
  };
  var fieldNames = Object.keys(this.$fields);
  fieldNames.forEach(function (k) {
    if (_this17.$fields[k].type === 'hasMany') {
      retVal.$fields[k] = {
        type: 'hasMany',
        relationship: _this17.$fields[k].relationship.toJSON()
      };
    } else {
      retVal.$fields[k] = _this17.$fields[k];
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
  var _this18 = this;

  var start = {};
  Object.keys(this.$fields).forEach(function (key) {
    if (opts[key]) {
      start[key] = opts[key];
    } else if (_this18.$fields[key].default) {
      start[key] = _this18.$fields[key].default;
    } else if (_this18.$fields[key].type === 'hasMany') {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRzdG9yZSIsIlN5bWJvbCIsIiRwbHVtcCIsIiRsb2FkZWQiLCIkdW5zdWJzY3JpYmUiLCIkc3ViamVjdCIsIiRzZWxmIiwiJGFsbCIsIk1vZGVsIiwib3B0cyIsInBsdW1wIiwiJHJlbGF0aW9uc2hpcHMiLCJuZXh0IiwiT2JqZWN0Iiwia2V5cyIsImNvbnN0cnVjdG9yIiwiJGZpZWxkcyIsImZvckVhY2giLCJrZXkiLCJ0eXBlIiwiUmVsIiwicmVsYXRpb25zaGlwIiwiZGVmYXVsdCIsIiQkY29weVZhbHVlc0Zyb20iLCJtYXAiLCJrIiwicmVkdWNlIiwiYWNjIiwiY3VyciIsImZpZWxkTmFtZSIsInVuZGVmaW5lZCIsImNvbmNhdCIsImFzc2lnbiIsIiQkZmlyZVVwZGF0ZSIsInN1YnNjcmliZSIsIiRuYW1lIiwiJGlkIiwiZmllbGQiLCJ2YWx1ZSIsImZpZWxkcyIsImNiIiwibGVuZ3RoIiwiQXJyYXkiLCJpc0FycmF5IiwiJCRob29rVG9QbHVtcCIsInN0cmVhbUdldCIsInYiLCJvcHRpb25zIiwiZG9tYWluIiwiYXBpUGF0aCIsInByZWZpeCIsImFsbCIsIiRnZXQiLCIkJHJlbGF0ZWRGaWVsZHMiLCJidWxrR2V0IiwidGhlbiIsInNlbGYiLCJleHRlbmRlZEpTT04iLCJleHRlbmRlZCIsInJlbCIsIiRzaWRlcyIsIm90aGVyIiwiZm9yZ2UiLCJkYXRhIiwiJCRyZWxhdGVkUGFja2FnZSIsIiQkaW5jbHVkZWRQYWNrYWdlIiwicmVsYXRpb25zaGlwcyIsImluY2x1ZGVkIiwiYXR0cmlidXRlcyIsIiQkYXR0cmlidXRlRmllbGRzIiwicmV0VmFsIiwibGlua3MiLCIkJHBhdGgiLCIkJGRhdGFKU09OIiwiaW5jbHVkZSIsIiRpbmNsdWRlIiwiZmlsdGVyIiwiY2hpbGRJZHMiLCJyZWxhdGVkIiwiaW5kZXhPZiIsImNoaWxkIiwiY2hpbGRPcHRzIiwiJCRwYWNrYWdlRm9ySW5jbHVzaW9uIiwibW9kZWwiLCJpZCIsIiQkc2luZ2xlR2V0IiwidmFsdWVBcnJheSIsInNlbGZJZHgiLCJhY2N1bSIsIm9wdCIsInJlc29sdmUiLCIkJGlzTG9hZGVkIiwiZ2V0IiwiJGxpc3QiLCIkc2V0IiwidSIsInVwZGF0ZSIsInNhdmUiLCJ1cGRhdGVkIiwiZGVsZXRlIiwicmVzdE9wdHMiLCJ1cmwiLCJyZXN0UmVxdWVzdCIsIml0ZW0iLCJleHRyYXMiLCJhZGQiLCJyZWplY3QiLCJFcnJvciIsImwiLCJtb2RpZnlSZWxhdGlvbnNoaXAiLCJyZW1vdmUiLCJ1bnN1YnNjcmliZSIsImZyb21KU09OIiwianNvbiIsIkR5bmFtaWNSZWxhdGlvbnNoaXAiLCJ0b0pTT04iLCJmaWVsZE5hbWVzIiwiJHJlc3QiLCJzdGFydCIsIiRpbmNsdWRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7Ozs7O0FBQ0EsSUFBTUEsU0FBU0MsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNQyxTQUFTRCxPQUFPLFFBQVAsQ0FBZjtBQUNBLElBQU1FLFVBQVVGLE9BQU8sU0FBUCxDQUFoQjtBQUNBLElBQU1HLGVBQWVILE9BQU8sY0FBUCxDQUFyQjtBQUNBLElBQU1JLFdBQVdKLE9BQU8sVUFBUCxDQUFqQjtBQUNPLElBQU1LLHdCQUFRTCxPQUFPLE9BQVAsQ0FBZDtBQUNBLElBQU1NLHNCQUFPTixPQUFPLE1BQVAsQ0FBYjs7QUFFUDtBQUNBOztJQUVhTyxLLFdBQUFBLEs7QUFDWCxpQkFBWUMsSUFBWixFQUFrQkMsS0FBbEIsRUFBeUI7QUFBQTs7QUFBQTs7QUFDdkIsU0FBS1YsTUFBTCxJQUFlLEVBQWY7QUFDQSxTQUFLVyxjQUFMLEdBQXNCLEVBQXRCO0FBQ0EsU0FBS04sUUFBTCxJQUFpQix5QkFBakI7QUFDQSxTQUFLQSxRQUFMLEVBQWVPLElBQWYsQ0FBb0IsRUFBcEI7QUFDQSxTQUFLVCxPQUFMLHdCQUNHRyxLQURILEVBQ1csS0FEWDtBQUdBTyxXQUFPQyxJQUFQLENBQVksS0FBS0Ms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LCJmaWxlIjoibW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHsgUmVsYXRpb25zaGlwIH0gZnJvbSAnLi9yZWxhdGlvbnNoaXAnO1xuaW1wb3J0IG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcbmltcG9ydCB7IEJlaGF2aW9yU3ViamVjdCB9IGZyb20gJ3J4anMvUngnO1xuY29uc3QgJHN0b3JlID0gU3ltYm9sKCckc3RvcmUnKTtcbmNvbnN0ICRwbHVtcCA9IFN5bWJvbCgnJHBsdW1wJyk7XG5jb25zdCAkbG9hZGVkID0gU3ltYm9sKCckbG9hZGVkJyk7XG5jb25zdCAkdW5zdWJzY3JpYmUgPSBTeW1ib2woJyR1bnN1YnNjcmliZScpO1xuY29uc3QgJHN1YmplY3QgPSBTeW1ib2woJyRzdWJqZWN0Jyk7XG5leHBvcnQgY29uc3QgJHNlbGYgPSBTeW1ib2woJyRzZWxmJyk7XG5leHBvcnQgY29uc3QgJGFsbCA9IFN5bWJvbCgnJGFsbCcpO1xuXG4vLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIGVycm9yIGV2ZW50cyBvcmlnaW5hdGUgKHN0b3JhZ2Ugb3IgbW9kZWwpXG4vLyBhbmQgd2hvIGtlZXBzIGEgcm9sbC1iYWNrYWJsZSBkZWx0YVxuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzLCBwbHVtcCkge1xuICAgIHRoaXNbJHN0b3JlXSA9IHt9O1xuICAgIHRoaXMuJHJlbGF0aW9uc2hpcHMgPSB7fTtcbiAgICB0aGlzWyRzdWJqZWN0XSA9IG5ldyBCZWhhdmlvclN1YmplY3QoKTtcbiAgICB0aGlzWyRzdWJqZWN0XS5uZXh0KHt9KTtcbiAgICB0aGlzWyRsb2FkZWRdID0ge1xuICAgICAgWyRzZWxmXTogZmFsc2UsXG4gICAgfTtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgICBjb25zdCBSZWwgPSB0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS5yZWxhdGlvbnNoaXA7XG4gICAgICAgIHRoaXMuJHJlbGF0aW9uc2hpcHNba2V5XSA9IG5ldyBSZWwodGhpcywga2V5LCBwbHVtcCk7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gW107XG4gICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpc1skc3RvcmVdW2tleV0gPSB0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS5kZWZhdWx0IHx8IG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKG9wdHMgfHwge30pO1xuICAgIGlmIChwbHVtcCkge1xuICAgICAgdGhpc1skcGx1bXBdID0gcGx1bXA7XG4gICAgfVxuICB9XG5cbiAgZ2V0ICRuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLiRuYW1lO1xuICB9XG5cbiAgZ2V0ICRpZCgpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmVdW3RoaXMuY29uc3RydWN0b3IuJGlkXTtcbiAgfVxuXG4gIGdldCAkJGF0dHJpYnV0ZUZpZWxkcygpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKVxuICAgIC5maWx0ZXIoa2V5ID0+IHtcbiAgICAgIHJldHVybiBrZXkgIT09IHRoaXMuY29uc3RydWN0b3IuJGlkICYmIHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgIT09ICdoYXNNYW55JztcbiAgICB9KTtcbiAgfVxuXG4gIGdldCAkJHJlbGF0ZWRGaWVsZHMoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IuJGluY2x1ZGUpO1xuICB9XG5cbiAgZ2V0ICQkcGF0aCgpIHtcbiAgICByZXR1cm4gYC8ke3RoaXMuJG5hbWV9LyR7dGhpcy4kaWR9YDtcbiAgfVxuXG4gIGdldCAkJGRhdGFKU09OKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiB0aGlzLiRuYW1lLFxuICAgICAgaWQ6IHRoaXMuJGlkLFxuICAgIH07XG4gIH1cblxuICAkJGlzTG9hZGVkKGtleSkge1xuICAgIGlmIChrZXkgPT09ICRhbGwpIHtcbiAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzWyRsb2FkZWRdKVxuICAgICAgICAubWFwKGsgPT4gdGhpc1skbG9hZGVkXVtrXSlcbiAgICAgICAgLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBhY2MgJiYgY3VyciwgdHJ1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzWyRsb2FkZWRdW2tleV07XG4gICAgfVxuICB9XG5cbiAgJCRjb3B5VmFsdWVzRnJvbShvcHRzID0ge30pIHtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgaWYgKG9wdHNbZmllbGROYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGNvcHkgZnJvbSBvcHRzIHRvIHRoZSBiZXN0IG9mIG91ciBhYmlsaXR5XG4gICAgICAgIGlmIChcbiAgICAgICAgICAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2FycmF5JykgfHxcbiAgICAgICAgICAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2hhc01hbnknKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IChvcHRzW2ZpZWxkTmFtZV0gfHwgW10pLmNvbmNhdCgpO1xuICAgICAgICAgIHRoaXNbJGxvYWRlZF1bZmllbGROYW1lXSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IE9iamVjdC5hc3NpZ24oe30sIG9wdHNbZmllbGROYW1lXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBvcHRzW2ZpZWxkTmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLiQkZmlyZVVwZGF0ZSgpO1xuICB9XG5cbiAgJCRob29rVG9QbHVtcCgpIHtcbiAgICBpZiAodGhpc1skdW5zdWJzY3JpYmVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHVuc3Vic2NyaWJlXSA9IHRoaXNbJHBsdW1wXS5zdWJzY3JpYmUodGhpcy5jb25zdHJ1Y3Rvci4kbmFtZSwgdGhpcy4kaWQsICh7IGZpZWxkLCB2YWx1ZSB9KSA9PiB7XG4gICAgICAgIGlmIChmaWVsZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgLy8gdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHZhbHVlKTtcbiAgICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20oeyBbZmllbGRdOiB2YWx1ZSB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAkc3Vic2NyaWJlKC4uLmFyZ3MpIHtcbiAgICBsZXQgZmllbGRzID0gWyRzZWxmXTtcbiAgICBsZXQgY2I7XG4gICAgaWYgKGFyZ3MubGVuZ3RoID09PSAyKSB7XG4gICAgICBmaWVsZHMgPSBhcmdzWzBdO1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGZpZWxkcykpIHtcbiAgICAgICAgZmllbGRzID0gW2ZpZWxkc107XG4gICAgICB9XG4gICAgICBjYiA9IGFyZ3NbMV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGNiID0gYXJnc1swXTtcbiAgICB9XG4gICAgdGhpcy4kJGhvb2tUb1BsdW1wKCk7XG4gICAgaWYgKHRoaXNbJGxvYWRlZF1bJHNlbGZdID09PSBmYWxzZSkge1xuICAgICAgdGhpc1skcGx1bXBdLnN0cmVhbUdldCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwgZmllbGRzKVxuICAgICAgLnN1YnNjcmliZSgodikgPT4gdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHYpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNbJHN1YmplY3RdLnN1YnNjcmliZShjYik7XG4gIH1cblxuICAkJGZpcmVVcGRhdGUoKSB7XG4gICAgdGhpc1skc3ViamVjdF0ubmV4dCh0aGlzWyRzdG9yZV0pO1xuICB9XG5cbiAgJHBhY2thZ2Uob3B0cykge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIGRvbWFpbjogJ2h0dHBzOi8vZXhhbXBsZS5jb20nLFxuICAgICAgICBhcGlQYXRoOiAnL2FwaScsXG4gICAgICB9LFxuICAgICAgb3B0c1xuICAgICk7XG4gICAgY29uc3QgcHJlZml4ID0gYCR7b3B0aW9ucy5kb21haW59JHtvcHRpb25zLmFwaVBhdGh9YDtcblxuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgdGhpcy4kZ2V0KHRoaXMuJCRyZWxhdGVkRmllbGRzLmNvbmNhdCgkc2VsZikpLFxuICAgICAgdGhpc1skcGx1bXBdLmJ1bGtHZXQodGhpcy4kJHJlbGF0ZWRGaWVsZHMpLFxuICAgIF0pLnRoZW4oKFtzZWxmLCBleHRlbmRlZEpTT05dKSA9PiB7XG4gICAgICBjb25zdCBleHRlbmRlZCA9IHt9O1xuICAgICAgZm9yIChjb25zdCByZWwgaW4gZXh0ZW5kZWRKU09OKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZ3VhcmQtZm9yLWluXG4gICAgICAgIGNvbnN0IHR5cGUgPSB0aGlzLiRyZWxhdGlvbnNoaXBzW3JlbF0uY29uc3RydWN0b3IuJHNpZGVzW3JlbF0ub3RoZXIudHlwZTtcbiAgICAgICAgZXh0ZW5kZWRbcmVsXSA9IGV4dGVuZGVkSlNPTltyZWxdLm1hcChkYXRhID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLmZvcmdlKHR5cGUsIGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIHNlbGYsXG4gICAgICAgIHRoaXMuJCRyZWxhdGVkUGFja2FnZShleHRlbmRlZCwgb3B0aW9ucyksXG4gICAgICAgIHRoaXMuJCRpbmNsdWRlZFBhY2thZ2UoZXh0ZW5kZWQsIG9wdGlvbnMpLFxuICAgICAgXSk7XG4gICAgfSkudGhlbigoW3NlbGYsIHJlbGF0aW9uc2hpcHMsIGluY2x1ZGVkXSkgPT4ge1xuICAgICAgY29uc3QgYXR0cmlidXRlcyA9IHt9O1xuICAgICAgdGhpcy4kJGF0dHJpYnV0ZUZpZWxkcy5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIGF0dHJpYnV0ZXNba2V5XSA9IHNlbGZba2V5XTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXRWYWwgPSB7XG4gICAgICAgIGxpbmtzOiB7IHNlbGY6IGAke3ByZWZpeH0ke3RoaXMuJCRwYXRofWAgfSxcbiAgICAgICAgZGF0YTogdGhpcy4kJGRhdGFKU09OLFxuICAgICAgICBhdHRyaWJ1dGVzOiBhdHRyaWJ1dGVzLFxuICAgICAgICBpbmNsdWRlZDogaW5jbHVkZWQsXG4gICAgICB9O1xuXG4gICAgICBpZiAoT2JqZWN0LmtleXMocmVsYXRpb25zaGlwcykubGVuZ3RoID4gMCkge1xuICAgICAgICByZXRWYWwucmVsYXRpb25zaGlwcyA9IHJlbGF0aW9uc2hpcHM7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXRWYWw7XG4gICAgfSk7XG4gIH1cblxuICAkJHJlbGF0ZWRQYWNrYWdlKGV4dGVuZGVkLCBvcHRzKSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHtcbiAgICAgICAgaW5jbHVkZTogdGhpcy5jb25zdHJ1Y3Rvci4kaW5jbHVkZSxcbiAgICAgICAgZG9tYWluOiAnaHR0cHM6Ly9leGFtcGxlLmNvbScsXG4gICAgICAgIGFwaVBhdGg6ICcvYXBpJyxcbiAgICAgIH0sXG4gICAgICBvcHRzXG4gICAgKTtcbiAgICBjb25zdCBwcmVmaXggPSBgJHtvcHRpb25zLmRvbWFpbn0ke29wdHMuYXBpUGF0aH1gO1xuICAgIGNvbnN0IGZpZWxkcyA9IE9iamVjdC5rZXlzKG9wdGlvbnMuaW5jbHVkZSkuZmlsdGVyKHJlbCA9PiB7XG4gICAgICByZXR1cm4gdGhpc1skc3RvcmVdW3JlbF0gIT09IHVuZGVmaW5lZDtcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzLiRnZXQoZmllbGRzKVxuICAgIC50aGVuKHNlbGYgPT4ge1xuICAgICAgY29uc3QgcmV0VmFsID0ge307XG4gICAgICBmaWVsZHMuZm9yRWFjaChmaWVsZCA9PiB7XG4gICAgICAgIGlmIChleHRlbmRlZFtmaWVsZF0gJiYgc2VsZltmaWVsZF0ubGVuZ3RoKSB7XG4gICAgICAgICAgY29uc3QgY2hpbGRJZHMgPSBzZWxmW2ZpZWxkXS5tYXAocmVsID0+IHtcbiAgICAgICAgICAgIHJldHVybiByZWxbdGhpcy4kcmVsYXRpb25zaGlwc1tmaWVsZF0uY29uc3RydWN0b3IuJHNpZGVzW2ZpZWxkXS5vdGhlci5maWVsZF07XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0VmFsW2ZpZWxkXSA9IHtcbiAgICAgICAgICAgIGxpbmtzOiB7XG4gICAgICAgICAgICAgIHJlbGF0ZWQ6IGAke3ByZWZpeH0ke3RoaXMuJCRwYXRofS8ke2ZpZWxkfWAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGF0YTogZXh0ZW5kZWRbZmllbGRdLmZpbHRlcihjaGlsZCA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiBjaGlsZElkcy5pbmRleE9mKGNoaWxkLiRpZCkgPj0gMDtcbiAgICAgICAgICAgIH0pLm1hcChjaGlsZCA9PiBjaGlsZC4kJGRhdGFKU09OKSxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHJldFZhbDtcbiAgICB9KTtcbiAgfVxuXG4gICQkaW5jbHVkZWRQYWNrYWdlKGV4dGVuZGVkLCBvcHRzKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChcbiAgICAgIE9iamVjdC5rZXlzKGV4dGVuZGVkKS5tYXAocmVsYXRpb25zaGlwID0+IHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChcbiAgICAgICAgICBleHRlbmRlZFtyZWxhdGlvbnNoaXBdLm1hcChjaGlsZCA9PiB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZE9wdHMgPSBPYmplY3QuYXNzaWduKFxuICAgICAgICAgICAgICB7fSxcbiAgICAgICAgICAgICAgb3B0cyxcbiAgICAgICAgICAgICAgeyBpbmNsdWRlOiB0aGlzLmNvbnN0cnVjdG9yLiRpbmNsdWRlIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gY2hpbGQuJCRwYWNrYWdlRm9ySW5jbHVzaW9uKGV4dGVuZGVkLCBjaGlsZE9wdHMpO1xuICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICB9KVxuICAgICkudGhlbihyZWxhdGlvbnNoaXBzID0+IHtcbiAgICAgIHJldHVybiByZWxhdGlvbnNoaXBzLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBhY2MuY29uY2F0KGN1cnIpKTtcbiAgICB9KTtcbiAgfVxuXG4gICQkcGFja2FnZUZvckluY2x1c2lvbihleHRlbmRlZCwgb3B0cyA9IHt9KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHtcbiAgICAgICAgZG9tYWluOiAnaHR0cHM6Ly9leGFtcGxlLmNvbScsXG4gICAgICAgIGFwaVBhdGg6ICcvYXBpJyxcbiAgICAgICAgaW5jbHVkZTogdGhpcy5jb25zdHJ1Y3Rvci4kaW5jbHVkZSxcbiAgICAgIH0sXG4gICAgICBvcHRzXG4gICAgKTtcbiAgICBjb25zdCBwcmVmaXggPSBgJHtvcHRpb25zLmRvbWFpbn0ke29wdGlvbnMuYXBpUGF0aH1gO1xuXG4gICAgcmV0dXJuIHRoaXMuJGdldCh0aGlzLiQkcmVsYXRlZEZpZWxkcy5jb25jYXQoJHNlbGYpKVxuICAgIC50aGVuKHNlbGYgPT4ge1xuICAgICAgY29uc3QgcmVsYXRlZCA9IHt9O1xuICAgICAgdGhpcy4kJHJlbGF0ZWRGaWVsZHMuZm9yRWFjaChmaWVsZCA9PiB7XG4gICAgICAgIGNvbnN0IGNoaWxkSWRzID0gc2VsZltmaWVsZF0ubWFwKHJlbCA9PiB7XG4gICAgICAgICAgcmV0dXJuIHJlbFt0aGlzLiRyZWxhdGlvbnNoaXBzW2ZpZWxkXS5jb25zdHJ1Y3Rvci4kc2lkZXNbZmllbGRdLm90aGVyLmZpZWxkXTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJlbGF0ZWRbZmllbGRdID0gZXh0ZW5kZWRbZmllbGRdLmZpbHRlcihtb2RlbCA9PiB7XG4gICAgICAgICAgcmV0dXJuIGNoaWxkSWRzLmluZGV4T2YobW9kZWwuJGlkKSA+PSAwO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRoaXMuJCRyZWxhdGVkUGFja2FnZShyZWxhdGVkLCBvcHRzKVxuICAgICAgLnRoZW4ocmVsYXRpb25zaGlwcyA9PiB7XG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSB7fTtcbiAgICAgICAgdGhpcy4kJGF0dHJpYnV0ZUZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgICAgICBhdHRyaWJ1dGVzW2ZpZWxkXSA9IHNlbGZbZmllbGRdO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCByZXRWYWwgPSB7XG4gICAgICAgICAgdHlwZTogdGhpcy4kbmFtZSxcbiAgICAgICAgICBpZDogdGhpcy4kaWQsXG4gICAgICAgICAgYXR0cmlidXRlczogYXR0cmlidXRlcyxcbiAgICAgICAgICBsaW5rczoge1xuICAgICAgICAgICAgc2VsZjogYCR7cHJlZml4fSR7dGhpcy4kJHBhdGh9YCxcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChPYmplY3Qua2V5cyhyZWxhdGlvbnNoaXBzKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0VmFsLnJlbGF0aW9uc2hpcHMgPSByZWxhdGlvbnNoaXBzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldFZhbDtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gVE9ETzogZG9uJ3QgZmV0Y2ggaWYgd2UgJGdldCgpIHNvbWV0aGluZyB0aGF0IHdlIGFscmVhZHkgaGF2ZVxuXG4gICRnZXQob3B0cyA9ICRzZWxmKSB7XG4gICAgbGV0IGtleXM7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkob3B0cykpIHtcbiAgICAgIGtleXMgPSBvcHRzO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXlzID0gW29wdHNdO1xuICAgIH1cbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKGtleXMubWFwKChrZXkpID0+IHRoaXMuJCRzaW5nbGVHZXQoa2V5KSkpXG4gICAgLnRoZW4oKHZhbHVlQXJyYXkpID0+IHtcbiAgICAgIGNvbnN0IHNlbGZJZHggPSBrZXlzLmluZGV4T2YoJHNlbGYpO1xuICAgICAgaWYgKChzZWxmSWR4ID49IDApICYmICh2YWx1ZUFycmF5W3NlbGZJZHhdID09PSBudWxsKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB2YWx1ZUFycmF5LnJlZHVjZSgoYWNjdW0sIGN1cnIpID0+IE9iamVjdC5hc3NpZ24oYWNjdW0sIGN1cnIpLCB7fSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAkJHNpbmdsZUdldChvcHQgPSAkc2VsZikge1xuICAgIC8vIFggY2FzZXMuXG4gICAgLy8ga2V5ID09PSAkYWxsIC0gZmV0Y2ggYWxsIGZpZWxkcyB1bmxlc3MgbG9hZGVkLCByZXR1cm4gYWxsIGZpZWxkc1xuICAgIC8vICRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScsIC0gZmV0Y2ggY2hpbGRyZW4gKHBlcmhhcHMgbW92ZSB0aGlzIGRlY2lzaW9uIHRvIHN0b3JlKVxuICAgIC8vIG90aGVyd2lzZSAtIGZldGNoIG5vbi1oYXNNYW55IGZpZWxkcyB1bmxlc3MgYWxyZWFkeSBsb2FkZWQsIHJldHVybiBhbGwgbm9uLWhhc01hbnkgZmllbGRzXG4gICAgbGV0IGtleTtcbiAgICBpZiAoKG9wdCAhPT0gJHNlbGYpICYmIChvcHQgIT09ICRhbGwpICYmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbb3B0XS50eXBlICE9PSAnaGFzTWFueScpKSB7XG4gICAgICBrZXkgPSAkc2VsZjtcbiAgICB9IGVsc2Uge1xuICAgICAga2V5ID0gb3B0O1xuICAgIH1cblxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBpZiAoIXRoaXMuJCRpc0xvYWRlZChrZXkpICYmIHRoaXNbJHBsdW1wXSkge1xuICAgICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N5bWJvbCcpIHsgLy8ga2V5ID09PSAkc2VsZiBvciAkYWxsXG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5nZXQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuJHJlbGF0aW9uc2hpcHNba2V5XS4kbGlzdCgpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KS50aGVuKCh2KSA9PiB7XG4gICAgICBpZiAodiA9PT0gdHJ1ZSkge1xuICAgICAgICBpZiAoa2V5ID09PSAkc2VsZikge1xuICAgICAgICAgIGNvbnN0IHJldFZhbCA9IHt9O1xuICAgICAgICAgIGZvciAoY29uc3QgayBpbiB0aGlzWyRzdG9yZV0pIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba10udHlwZSAhPT0gJ2hhc01hbnknKSB7XG4gICAgICAgICAgICAgIHJldFZhbFtrXSA9IHRoaXNbJHN0b3JlXVtrXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJldFZhbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgeyBba2V5XTogdGhpc1skc3RvcmVdW2tleV0gfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodiAmJiAodlskc2VsZl0gIT09IG51bGwpKSB7XG4gICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KTtcbiAgICAgICAgaWYgKGtleSA9PT0gJGFsbCkge1xuICAgICAgICAgIGZvciAoY29uc3QgayBpbiB0aGlzWyRsb2FkZWRdKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZ3VhcmQtZm9yLWluXG4gICAgICAgICAgICB0aGlzWyRsb2FkZWRdW2tdID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpc1skbG9hZGVkXVtrZXldID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5ID09PSAkc2VsZikge1xuICAgICAgICAgIGNvbnN0IHJldFZhbCA9IHt9O1xuICAgICAgICAgIGZvciAoY29uc3QgayBpbiB0aGlzWyRzdG9yZV0pIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba10udHlwZSAhPT0gJ2hhc01hbnknKSB7XG4gICAgICAgICAgICAgIHJldFZhbFtrXSA9IHRoaXNbJHN0b3JlXVtrXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJldFZhbDtcbiAgICAgICAgfSBlbHNlIGlmIChrZXkgPT09ICRhbGwpIHtcbiAgICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgdGhpc1skc3RvcmVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgeyBba2V5XTogdGhpc1skc3RvcmVdW2tleV0gfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgJHNhdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHNldCgpO1xuICB9XG5cbiAgJHNldCh1ID0gdGhpc1skc3RvcmVdKSB7XG4gICAgY29uc3QgdXBkYXRlID0gbWVyZ2VPcHRpb25zKHt9LCB0aGlzWyRzdG9yZV0sIHUpO1xuICAgIE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkcykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICAgIGRlbGV0ZSB1cGRhdGVba2V5XTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyB0aGlzLiQkY29weVZhbHVlc0Zyb20odXBkYXRlKTsgLy8gdGhpcyBpcyB0aGUgb3B0aW1pc3RpYyB1cGRhdGU7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5zYXZlKHRoaXMuY29uc3RydWN0b3IsIHVwZGF0ZSlcbiAgICAudGhlbigodXBkYXRlZCkgPT4ge1xuICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHVwZGF0ZWQpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSk7XG4gIH1cblxuICAkZGVsZXRlKCkge1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZGVsZXRlKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkKTtcbiAgfVxuXG4gICRyZXN0KG9wdHMpIHtcbiAgICBjb25zdCByZXN0T3B0cyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIG9wdHMsXG4gICAgICB7XG4gICAgICAgIHVybDogYC8ke3RoaXMuY29uc3RydWN0b3IuJG5hbWV9LyR7dGhpcy4kaWR9LyR7b3B0cy51cmx9YCxcbiAgICAgIH1cbiAgICApO1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0ucmVzdFJlcXVlc3QocmVzdE9wdHMpO1xuICB9XG5cbiAgJGFkZChrZXksIGl0ZW0sIGV4dHJhcykge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICAgIGxldCBpZCA9IDA7XG4gICAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICBpZCA9IGl0ZW07XG4gICAgICAgIH0gZWxzZSBpZiAoaXRlbS4kaWQpIHtcbiAgICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlkID0gaXRlbVt0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS5yZWxhdGlvbnNoaXAuJHNpZGVzW2tleV0ub3RoZXIuZmllbGRdO1xuICAgICAgICB9XG4gICAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5hZGQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaWQsIGV4dHJhcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSBhZGRlZCB0byBoYXNNYW55JykpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRhZGQgZXhjZXB0IHRvIGhhc01hbnkgZmllbGQnKSk7XG4gICAgICB9XG4gICAgfSkudGhlbigobCkgPT4ge1xuICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHsgW2tleV06IGwgfSk7XG4gICAgICByZXR1cm4gbDtcbiAgICB9KTtcbiAgfVxuXG4gICRtb2RpZnlSZWxhdGlvbnNoaXAoa2V5LCBpdGVtLCBleHRyYXMpIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgdGhpc1skc3RvcmVdW2tleV0gPSBbXTtcbiAgICAgICAgdGhpc1skbG9hZGVkXVtrZXldID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0ubW9kaWZ5UmVsYXRpb25zaGlwKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkLCBleHRyYXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSBhZGRlZCB0byBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRhZGQgZXhjZXB0IHRvIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG5cbiAgJHJlbW92ZShrZXksIGl0ZW0pIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgdGhpc1skc3RvcmVdW2tleV0gPSBbXTtcbiAgICAgICAgdGhpc1skbG9hZGVkXVtrZXldID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0ucmVtb3ZlKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gJHJlbW92ZWQgZnJvbSBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRyZW1vdmUgZXhjZXB0IGZyb20gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkdGVhcmRvd24oKSB7XG4gICAgaWYgKHRoaXNbJHVuc3Vic2NyaWJlXSkge1xuICAgICAgdGhpc1skdW5zdWJzY3JpYmVdLnVuc3Vic2NyaWJlKCk7XG4gICAgfVxuICB9XG59XG5cbk1vZGVsLmZyb21KU09OID0gZnVuY3Rpb24gZnJvbUpTT04oanNvbikge1xuICB0aGlzLiRpZCA9IGpzb24uJGlkIHx8ICdpZCc7XG4gIHRoaXMuJG5hbWUgPSBqc29uLiRuYW1lO1xuICB0aGlzLiRmaWVsZHMgPSB7fTtcbiAgT2JqZWN0LmtleXMoanNvbi4kZmllbGRzKS5mb3JFYWNoKChrKSA9PiB7XG4gICAgY29uc3QgZmllbGQgPSBqc29uLiRmaWVsZHNba107XG4gICAgaWYgKGZpZWxkLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgY2xhc3MgRHluYW1pY1JlbGF0aW9uc2hpcCBleHRlbmRzIFJlbGF0aW9uc2hpcCB7fVxuICAgICAgRHluYW1pY1JlbGF0aW9uc2hpcC5mcm9tSlNPTihmaWVsZC5yZWxhdGlvbnNoaXApO1xuICAgICAgdGhpcy4kZmllbGRzW2tdID0ge1xuICAgICAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgICAgIHJlbGF0aW9uc2hpcDogRHluYW1pY1JlbGF0aW9uc2hpcCxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJGZpZWxkc1trXSA9IE9iamVjdC5hc3NpZ24oe30sIGZpZWxkKTtcbiAgICB9XG4gIH0pO1xufTtcblxuTW9kZWwudG9KU09OID0gZnVuY3Rpb24gdG9KU09OKCkge1xuICBjb25zdCByZXRWYWwgPSB7XG4gICAgJGlkOiB0aGlzLiRpZCxcbiAgICAkbmFtZTogdGhpcy4kbmFtZSxcbiAgICAkZmllbGRzOiB7fSxcbiAgfTtcbiAgY29uc3QgZmllbGROYW1lcyA9IE9iamVjdC5rZXlzKHRoaXMuJGZpZWxkcyk7XG4gIGZpZWxkTmFtZXMuZm9yRWFjaCgoaykgPT4ge1xuICAgIGlmICh0aGlzLiRmaWVsZHNba10udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICByZXRWYWwuJGZpZWxkc1trXSA9IHtcbiAgICAgICAgdHlwZTogJ2hhc01hbnknLFxuICAgICAgICByZWxhdGlvbnNoaXA6IHRoaXMuJGZpZWxkc1trXS5yZWxhdGlvbnNoaXAudG9KU09OKCksXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXRWYWwuJGZpZWxkc1trXSA9IHRoaXMuJGZpZWxkc1trXTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcmV0VmFsO1xufTtcblxuTW9kZWwuJHJlc3QgPSBmdW5jdGlvbiAkcmVzdChwbHVtcCwgb3B0cykge1xuICBjb25zdCByZXN0T3B0cyA9IE9iamVjdC5hc3NpZ24oXG4gICAge30sXG4gICAgb3B0cyxcbiAgICB7XG4gICAgICB1cmw6IGAvJHt0aGlzLiRuYW1lfS8ke29wdHMudXJsfWAsXG4gICAgfVxuICApO1xuICByZXR1cm4gcGx1bXAucmVzdFJlcXVlc3QocmVzdE9wdHMpO1xufTtcblxuTW9kZWwuYXNzaWduID0gZnVuY3Rpb24gYXNzaWduKG9wdHMpIHtcbiAgY29uc3Qgc3RhcnQgPSB7fTtcbiAgT2JqZWN0LmtleXModGhpcy4kZmllbGRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICBpZiAob3B0c1trZXldKSB7XG4gICAgICBzdGFydFtrZXldID0gb3B0c1trZXldO1xuICAgIH0gZWxzZSBpZiAodGhpcy4kZmllbGRzW2tleV0uZGVmYXVsdCkge1xuICAgICAgc3RhcnRba2V5XSA9IHRoaXMuJGZpZWxkc1trZXldLmRlZmF1bHQ7XG4gICAgfSBlbHNlIGlmICh0aGlzLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIHN0YXJ0W2tleV0gPSBbXTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhcnRba2V5XSA9IG51bGw7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHN0YXJ0O1xufTtcblxuTW9kZWwuJGlkID0gJ2lkJztcbk1vZGVsLiRuYW1lID0gJ0Jhc2UnO1xuTW9kZWwuJHNlbGYgPSAkc2VsZjtcbk1vZGVsLiRmaWVsZHMgPSB7XG4gIGlkOiB7XG4gICAgdHlwZTogJ251bWJlcicsXG4gIH0sXG59O1xuTW9kZWwuJGluY2x1ZGVkID0gW107XG4iXX0=
