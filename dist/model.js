'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Model = exports.$all = exports.$self = undefined;

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

    // $$packageForInclusion(opts) {
    //   const options = Object.assign(
    //     {},
    //     {
    //       domain: 'https://example.com',
    //       apiPath: '/api',
    //     },
    //     opts
    //   );
    //   const prefix = `${options.domain}${options.apiPath}`;
    //
    //   console.log('INCLUDE Inflating...');
    //   return this.$get(
    //     this.constructor.$packageIncludes.concat($self)
    //   ).then((inflated) => {
    //     console.log('INCLUDE Inflated.');
    //     console.log(`INCLUDE ID: ${this.$id}`);
    //     return Bluebird.all(
    //       this.constructor.$packageIncludes.map((relationship) => {
    //         console.log(`INCLUDE   Packaging ${relationship}`);
    //         return Bluebird.all(
    //           inflated[relationship].map((rel) => {
    //             const otherSide = this.constructor.$fields[relationship].relationship.$sides[relationship].other;
    //             return this[$plump].find(
    //               otherSide.type,
    //               rel[otherSide.field]
    //             ).$$packageForInclusion();
    //           })
    //         );
    //       })
    //     ).then((childPkgs) => {
    //       console.log('INCLUDE Child Packages loaded');
    //       const attributes = {};
    //       Object.keys(inflated).filter(k => k !== 'id' && (this.constructor.$packageIncludes.indexOf(k) < 0))
    //       .forEach((attribute) => {
    //         attributes[attribute] = inflated[attribute];
    //       });
    //
    //       // const included = [];
    //       const relationships = {};
    //       this.constructor.$packageIncludes.forEach((relationship, index) => {
    //         console.log(`INCLUDE  Building ${relationship} relationship...`);
    //         relationships[relationship] = {
    //           links: {
    //             related: `${prefix}/${this.constructor.$name}/${this.$id}/${relationship}`,
    //           },
    //           data: childPkgs[index].map((childPkg) => {
    //             console.log(`INCLUDE    Adding relationship data ${JSON.stringify(childPkg)}`);
    //             // const childPkgNoInclude = {};
    //             // Object.keys(childPkg).filter(k => k !== 'included').forEach((key) => {
    //             //   childPkgNoInclude[key] = childPkg[key];
    //             // });
    //             // included.push(childPkgNoInclude);
    //             // childPkg.included.forEach((item) => {
    //             //   included.push(item);
    //             // });
    //             return { type: childPkg.type, id: childPkg.id };
    //           }),
    //         };
    //       });
    //
    //       console.log('INCLUDE Assembling package...');
    //       return {
    //         type: this.constructor.$name,
    //         id: this.$id,
    //         attributes: attributes,
    //         relationships: relationships,
    //         links: {
    //           self: `${prefix}/${this.constructor.$name}/${this.$id}`,
    //         },
    //       };
    //     });
    //   });
    // }

  }, {
    key: '$package',
    value: function $package(opts) {
      var _this5 = this;

      var options = Object.assign({}, {
        domain: 'https://example.com',
        apiPath: '/api'
      }, opts);
      var prefix = '' + options.domain + options.apiPath;

      return _bluebird2.default.all([this.$get(this.$relatedFields.concat($self)), this[$plump].bulkGet(this.$relatedFields)]).then(function (_ref2) {
        var _ref3 = _slicedToArray(_ref2, 2),
            self = _ref3[0],
            extendedJSON = _ref3[1];

        var extended = {};

        var _loop = function _loop(rel) {
          // eslint-disable-line guard-for-in
          var type = _this5.$relationships[rel].constructor.$sides[rel].other.type;
          extended[rel] = extendedJSON[rel].map(function (data) {
            return _this5[$plump].forge(type, data);
          });
        };

        for (var rel in extendedJSON) {
          _loop(rel);
        }
        return _bluebird2.default.all([self, _this5.$$relatedPackage(extended, options), _this5.$$includedPackage(extended, options)]);
      }).then(function (_ref4) {
        var _ref5 = _slicedToArray(_ref4, 3),
            self = _ref5[0],
            relationships = _ref5[1],
            included = _ref5[2];

        var attributes = {};
        _this5.$attributeFields.forEach(function (key) {
          attributes[key] = self[key];
        });

        var retVal = {
          links: { self: '' + prefix + _this5.$path },
          data: _this5.$dataJSON,
          attributes: attributes,
          included: included
        };

        if (relationships !== {}) {
          retVal.relationships = relationships;
        }

        return retVal;
      });
    }
  }, {
    key: '$$relatedPackage',
    value: function $$relatedPackage(extended, opts) {
      var _this6 = this;

      var options = Object.assign({}, {
        include: this.constructor.$include,
        domain: 'https://example.com',
        apiPath: '/api'
      }, opts);
      var prefix = '' + options.domain + opts.apiPath;
      var fields = Object.keys(options.include).filter(function (rel) {
        return _this6[$store][rel];
      });

      return this.$get(fields).then(function (self) {
        var retVal = {};
        fields.forEach(function (field) {
          if (extended[field] && self[field].length) {
            (function () {
              var childIds = self[field].map(function (rel) {
                return rel[_this6.$relationships[field].constructor.$sides[field].other.field];
              });
              retVal[field] = {
                links: {
                  related: '' + prefix + _this6.$path + '/' + field
                },
                data: extended[field].filter(function (child) {
                  return childIds.indexOf(child.$id) >= 0;
                }).map(function (child) {
                  return child.$dataJSON;
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
      var _this7 = this;

      return _bluebird2.default.all(Object.keys(extended).map(function (relationship) {
        return _bluebird2.default.all(extended[relationship].map(function (child) {
          var childOpts = Object.assign({}, opts, { include: _this7.constructor.$include });
          return child.$$packageForInclusion(childOpts);
        }));
      })).then(function (relationships) {
        return relationships.reduce(function (acc, curr) {
          return acc.concat(curr);
        });
      });
    }
  }, {
    key: '$$packageForInclusion',
    value: function $$packageForInclusion() {
      var _this8 = this;

      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var options = Object.assign({}, {
        domain: 'https://example.com',
        apiPath: '/api',
        include: this.constructor.$include
      }, opts);
      var prefix = '' + options.domain + options.apiPath;

      return this.$get(this.$relatedFields.concat($self)).then(function (self) {
        var related = {};
        _this8.$relatedFields.forEach(function (field) {
          console.log('*** ' + JSON.stringify(self[field], null, 2));
          related[field] = self[field].map(function (rel) {
            var otherMeta = _this8.$relationships[field].constructor.$sides[field].other;
            return _this8[$plump].forge(otherMeta.type, rel[otherMeta.field]);
          });
        });
        return _this8.$$relatedPackage(self, opts).then(function (relationships) {
          var attributes = {};
          for (var field in _this8.constructor.$fields) {
            if (field !== _this8.constructor.$id && _this8.constructor.$fields[field].type !== 'hasMany') {
              attributes[field] = self[field];
            }
          }

          var retVal = {
            type: _this8.$name,
            id: _this8.$id,
            attributes: attributes,
            links: {
              self: '' + prefix + _this8.$path
            }
          };

          if (relationships !== {}) {
            retVal.relationships = relationships;
          }

          return retVal;
        });
      });
    }

    // TODO: don't fetch if we $get() something that we already have

  }, {
    key: '$get',
    value: function $get(opts) {
      var _this9 = this;

      var keys = [$self];
      if (Array.isArray(opts)) {
        keys = opts;
      } else if (opts !== undefined) {
        keys = [opts];
      }
      return _bluebird2.default.all(keys.map(function (key) {
        return _this9.$$singleGet(key);
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
      var _this10 = this;

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
          if (_this10[$loaded][$self] === false && _this10[$plump]) {
            return _this10[$plump].get(_this10.constructor, _this10.$id, key);
          } else {
            return true;
          }
        } else {
          if (_this10[$loaded][key] === false && _this10[$plump]) {
            // eslint-disable-line no-lonely-if
            return _this10.$relationships[key].$list();
          } else {
            return true;
          }
        }
      }).then(function (v) {
        if (v === true) {
          if (key === $self) {
            var retVal = {};
            for (var k in _this10[$store]) {
              if (_this10.constructor.$fields[k].type !== 'hasMany') {
                retVal[k] = _this10[$store][k];
              }
            }
            return retVal;
          } else {
            return Object.assign({}, _defineProperty({}, key, _this10[$store][key]));
          }
        } else if (v && v[$self] !== null) {
          _this10.$$copyValuesFrom(v);
          _this10[$loaded][key] = true;
          if (key === $self) {
            var _retVal = {};
            for (var _k in _this10[$store]) {
              if (_this10.constructor.$fields[_k].type !== 'hasMany') {
                _retVal[_k] = _this10[$store][_k];
              }
            }
            return _retVal;
          } else {
            return Object.assign({}, _defineProperty({}, key, _this10[$store][key]));
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
      var _this11 = this;

      var u = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this[$store];

      var update = (0, _mergeOptions2.default)({}, this[$store], u);
      Object.keys(this.constructor.$fields).forEach(function (key) {
        if (_this11.constructor.$fields[key].type === 'hasMany') {
          delete update[key];
        }
      });
      // this.$$copyValuesFrom(update); // this is the optimistic update;
      return this[$plump].save(this.constructor, update).then(function (updated) {
        _this11.$$copyValuesFrom(updated);
        return _this11;
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
      var _this12 = this;

      return _bluebird2.default.resolve().then(function () {
        if (_this12.constructor.$fields[key].type === 'hasMany') {
          var id = 0;
          if (typeof item === 'number') {
            id = item;
          } else if (item.$id) {
            id = item.$id;
          } else {
            id = item[_this12.constructor.$fields[key].relationship.$sides[key].other.field];
          }
          if (typeof id === 'number' && id >= 1) {
            return _this12[$plump].add(_this12.constructor, _this12.$id, key, id, extras);
          } else {
            return _bluebird2.default.reject(new Error('Invalid item added to hasMany'));
          }
        } else {
          return _bluebird2.default.reject(new Error('Cannot $add except to hasMany field'));
        }
      }).then(function (l) {
        _this12.$$copyValuesFrom(_defineProperty({}, key, l));
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
    key: '$attributeFields',
    get: function get() {
      var _this13 = this;

      return Object.keys(this.constructor.$fields).filter(function (key) {
        return key !== _this13.constructor.$id && _this13.constructor.$fields[key].type !== 'hasMany';
      });
    }
  }, {
    key: '$relatedFields',
    get: function get() {
      return Object.keys(this.constructor.$include);
    }
  }, {
    key: '$path',
    get: function get() {
      return '/' + this.$name + '/' + this.$id;
    }
  }, {
    key: '$dataJSON',
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
  var _this15 = this;

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
      _this15.$fields[k] = {
        type: 'hasMany',
        relationship: DynamicRelationship
      };
    } else {
      _this15.$fields[k] = Object.assign({}, field);
    }
  });
};

Model.toJSON = function toJSON() {
  var _this16 = this;

  var retVal = {
    $id: this.$id,
    $name: this.$name,
    $fields: {}
  };
  var fieldNames = Object.keys(this.$fields);
  fieldNames.forEach(function (k) {
    if (_this16.$fields[k].type === 'hasMany') {
      retVal.$fields[k] = {
        type: 'hasMany',
        relationship: _this16.$fields[k].relationship.toJSON()
      };
    } else {
      retVal.$fields[k] = _this16.$fields[k];
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
  var _this17 = this;

  var start = {};
  Object.keys(this.$fields).forEach(function (key) {
    if (opts[key]) {
      start[key] = opts[key];
    } else if (_this17.$fields[key].default) {
      start[key] = _this17.$fields[key].default;
    } else if (_this17.$fields[key].type === 'hasMany') {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRzdG9yZSIsIlN5bWJvbCIsIiRwbHVtcCIsIiRsb2FkZWQiLCIkdW5zdWJzY3JpYmUiLCIkc3ViamVjdCIsIiRzZWxmIiwiJGFsbCIsIk1vZGVsIiwib3B0cyIsInBsdW1wIiwiJHJlbGF0aW9uc2hpcHMiLCJuZXh0IiwiT2JqZWN0Iiwia2V5cyIsImNvbnN0cnVjdG9yIiwiJGZpZWxkcyIsImZvckVhY2giLCJrZXkiLCJ0eXBlIiwiUmVsIiwicmVsYXRpb25zaGlwIiwiZGVmYXVsdCIsIiQkY29weVZhbHVlc0Zyb20iLCJmaWVsZE5hbWUiLCJ1bmRlZmluZWQiLCJjb25jYXQiLCJhc3NpZ24iLCIkJGZpcmVVcGRhdGUiLCJzdWJzY3JpYmUiLCIkbmFtZSIsIiRpZCIsImZpZWxkIiwidmFsdWUiLCJmaWVsZHMiLCJjYiIsImxlbmd0aCIsIkFycmF5IiwiaXNBcnJheSIsIiQkaG9va1RvUGx1bXAiLCJzdHJlYW1HZXQiLCJ2Iiwib3B0aW9ucyIsImRvbWFpbiIsImFwaVBhdGgiLCJwcmVmaXgiLCJhbGwiLCIkZ2V0IiwiJHJlbGF0ZWRGaWVsZHMiLCJidWxrR2V0IiwidGhlbiIsInNlbGYiLCJleHRlbmRlZEpTT04iLCJleHRlbmRlZCIsInJlbCIsIiRzaWRlcyIsIm90aGVyIiwibWFwIiwiZm9yZ2UiLCJkYXRhIiwiJCRyZWxhdGVkUGFja2FnZSIsIiQkaW5jbHVkZWRQYWNrYWdlIiwicmVsYXRpb25zaGlwcyIsImluY2x1ZGVkIiwiYXR0cmlidXRlcyIsIiRhdHRyaWJ1dGVGaWVsZHMiLCJyZXRWYWwiLCJsaW5rcyIsIiRwYXRoIiwiJGRhdGFKU09OIiwiaW5jbHVkZSIsIiRpbmNsdWRlIiwiZmlsdGVyIiwiY2hpbGRJZHMiLCJyZWxhdGVkIiwiaW5kZXhPZiIsImNoaWxkIiwiY2hpbGRPcHRzIiwiJCRwYWNrYWdlRm9ySW5jbHVzaW9uIiwicmVkdWNlIiwiYWNjIiwiY3VyciIsImNvbnNvbGUiLCJsb2ciLCJKU09OIiwic3RyaW5naWZ5Iiwib3RoZXJNZXRhIiwiaWQiLCIkJHNpbmdsZUdldCIsInZhbHVlQXJyYXkiLCJzZWxmSWR4IiwiYWNjdW0iLCJvcHQiLCJyZXNvbHZlIiwiZ2V0IiwiJGxpc3QiLCJrIiwiJHNldCIsInUiLCJ1cGRhdGUiLCJzYXZlIiwidXBkYXRlZCIsImRlbGV0ZSIsInJlc3RPcHRzIiwidXJsIiwicmVzdFJlcXVlc3QiLCJpdGVtIiwiZXh0cmFzIiwiYWRkIiwicmVqZWN0IiwiRXJyb3IiLCJsIiwibW9kaWZ5UmVsYXRpb25zaGlwIiwicmVtb3ZlIiwidW5zdWJzY3JpYmUiLCJmcm9tSlNPTiIsImpzb24iLCJEeW5hbWljUmVsYXRpb25zaGlwIiwidG9KU09OIiwiZmllbGROYW1lcyIsIiRyZXN0Iiwic3RhcnQiLCIkaW5jbHVkZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7QUFDQSxJQUFNQSxTQUFTQyxPQUFPLFFBQVAsQ0FBZjtBQUNBLElBQU1DLFNBQVNELE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUUsVUFBVUYsT0FBTyxTQUFQLENBQWhCO0FBQ0EsSUFBTUcsZUFBZUgsT0FBTyxjQUFQLENBQXJCO0FBQ0EsSUFBTUksV0FBV0osT0FBTyxVQUFQLENBQWpCO0FBQ08sSUFBTUssd0JBQVFMLE9BQU8sT0FBUCxDQUFkO0FBQ0EsSUFBTU0sc0JBQU9OLE9BQU8sTUFBUCxDQUFiOztBQUVQO0FBQ0E7O0lBRWFPLEssV0FBQUEsSztBQUNYLGlCQUFZQyxJQUFaLEVBQWtCQyxLQUFsQixFQUF5QjtBQUFBOztBQUFBOztBQUN2QixTQUFLVixNQUFMLElBQWUsRUFBZjtBQUNBLFNBQUtXLGNBQUwsR0FBc0IsRUFBdEI7QUFDQSxTQUFLTixRQUFMLElBQWlCLHlCQUFqQjtBQUNBLFNBQUtBLFFBQUwsRUFBZU8sSUFBZixDQUFvQixFQUFwQjtBQUNBLFNBQUtULE9BQUwsd0JBQ0dHLEtBREgsRUFDVyxLQURYO0FBR0FPLFdB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cmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHsgUmVsYXRpb25zaGlwIH0gZnJvbSAnLi9yZWxhdGlvbnNoaXAnO1xuaW1wb3J0IG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcbmltcG9ydCB7IEJlaGF2aW9yU3ViamVjdCB9IGZyb20gJ3J4anMvUngnO1xuY29uc3QgJHN0b3JlID0gU3ltYm9sKCckc3RvcmUnKTtcbmNvbnN0ICRwbHVtcCA9IFN5bWJvbCgnJHBsdW1wJyk7XG5jb25zdCAkbG9hZGVkID0gU3ltYm9sKCckbG9hZGVkJyk7XG5jb25zdCAkdW5zdWJzY3JpYmUgPSBTeW1ib2woJyR1bnN1YnNjcmliZScpO1xuY29uc3QgJHN1YmplY3QgPSBTeW1ib2woJyRzdWJqZWN0Jyk7XG5leHBvcnQgY29uc3QgJHNlbGYgPSBTeW1ib2woJyRzZWxmJyk7XG5leHBvcnQgY29uc3QgJGFsbCA9IFN5bWJvbCgnJGFsbCcpO1xuXG4vLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIGVycm9yIGV2ZW50cyBvcmlnaW5hdGUgKHN0b3JhZ2Ugb3IgbW9kZWwpXG4vLyBhbmQgd2hvIGtlZXBzIGEgcm9sbC1iYWNrYWJsZSBkZWx0YVxuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzLCBwbHVtcCkge1xuICAgIHRoaXNbJHN0b3JlXSA9IHt9O1xuICAgIHRoaXMuJHJlbGF0aW9uc2hpcHMgPSB7fTtcbiAgICB0aGlzWyRzdWJqZWN0XSA9IG5ldyBCZWhhdmlvclN1YmplY3QoKTtcbiAgICB0aGlzWyRzdWJqZWN0XS5uZXh0KHt9KTtcbiAgICB0aGlzWyRsb2FkZWRdID0ge1xuICAgICAgWyRzZWxmXTogZmFsc2UsXG4gICAgfTtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgICBjb25zdCBSZWwgPSB0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS5yZWxhdGlvbnNoaXA7XG4gICAgICAgIHRoaXMuJHJlbGF0aW9uc2hpcHNba2V5XSA9IG5ldyBSZWwodGhpcywga2V5LCBwbHVtcCk7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gW107XG4gICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpc1skc3RvcmVdW2tleV0gPSB0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS5kZWZhdWx0IHx8IG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKG9wdHMgfHwge30pO1xuICAgIGlmIChwbHVtcCkge1xuICAgICAgdGhpc1skcGx1bXBdID0gcGx1bXA7XG4gICAgfVxuICB9XG5cbiAgZ2V0ICRuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLiRuYW1lO1xuICB9XG5cbiAgZ2V0ICRpZCgpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmVdW3RoaXMuY29uc3RydWN0b3IuJGlkXTtcbiAgfVxuXG4gIGdldCAkYXR0cmlidXRlRmllbGRzKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpXG4gICAgLmZpbHRlcihrZXkgPT4ge1xuICAgICAgcmV0dXJuIGtleSAhPT0gdGhpcy5jb25zdHJ1Y3Rvci4kaWQgJiYgdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSAhPT0gJ2hhc01hbnknO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0ICRyZWxhdGVkRmllbGRzKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRpbmNsdWRlKTtcbiAgfVxuXG4gIGdldCAkcGF0aCgpIHtcbiAgICByZXR1cm4gYC8ke3RoaXMuJG5hbWV9LyR7dGhpcy4kaWR9YDtcbiAgfVxuXG4gIGdldCAkZGF0YUpTT04oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMuJG5hbWUsXG4gICAgICBpZDogdGhpcy4kaWQsXG4gICAgfTtcbiAgfVxuXG4gICQkY29weVZhbHVlc0Zyb20ob3B0cyA9IHt9KSB7XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChmaWVsZE5hbWUpID0+IHtcbiAgICAgIGlmIChvcHRzW2ZpZWxkTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBjb3B5IGZyb20gb3B0cyB0byB0aGUgYmVzdCBvZiBvdXIgYWJpbGl0eVxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdhcnJheScpIHx8XG4gICAgICAgICAgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdoYXNNYW55JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSAob3B0c1tmaWVsZE5hbWVdIHx8IFtdKS5jb25jYXQoKTtcbiAgICAgICAgICB0aGlzWyRsb2FkZWRdW2ZpZWxkTmFtZV0gPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBPYmplY3QuYXNzaWduKHt9LCBvcHRzW2ZpZWxkTmFtZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gb3B0c1tmaWVsZE5hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy4kJGZpcmVVcGRhdGUoKTtcbiAgfVxuXG4gICQkaG9va1RvUGx1bXAoKSB7XG4gICAgaWYgKHRoaXNbJHVuc3Vic2NyaWJlXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyR1bnN1YnNjcmliZV0gPSB0aGlzWyRwbHVtcF0uc3Vic2NyaWJlKHRoaXMuY29uc3RydWN0b3IuJG5hbWUsIHRoaXMuJGlkLCAoeyBmaWVsZCwgdmFsdWUgfSkgPT4ge1xuICAgICAgICBpZiAoZmllbGQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIC8vIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2YWx1ZSk7XG4gICAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHsgW2ZpZWxkXTogdmFsdWUgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgJHN1YnNjcmliZSguLi5hcmdzKSB7XG4gICAgbGV0IGZpZWxkcyA9IFskc2VsZl07XG4gICAgbGV0IGNiO1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMikge1xuICAgICAgZmllbGRzID0gYXJnc1swXTtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShmaWVsZHMpKSB7XG4gICAgICAgIGZpZWxkcyA9IFtmaWVsZHNdO1xuICAgICAgfVxuICAgICAgY2IgPSBhcmdzWzFdO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYiA9IGFyZ3NbMF07XG4gICAgfVxuICAgIHRoaXMuJCRob29rVG9QbHVtcCgpO1xuICAgIGlmICh0aGlzWyRsb2FkZWRdWyRzZWxmXSA9PT0gZmFsc2UpIHtcbiAgICAgIHRoaXNbJHBsdW1wXS5zdHJlYW1HZXQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGZpZWxkcylcbiAgICAgIC5zdWJzY3JpYmUoKHYpID0+IHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzWyRzdWJqZWN0XS5zdWJzY3JpYmUoY2IpO1xuICB9XG5cbiAgJCRmaXJlVXBkYXRlKCkge1xuICAgIHRoaXNbJHN1YmplY3RdLm5leHQodGhpc1skc3RvcmVdKTtcbiAgfVxuXG4gIC8vICQkcGFja2FnZUZvckluY2x1c2lvbihvcHRzKSB7XG4gIC8vICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gIC8vICAgICB7fSxcbiAgLy8gICAgIHtcbiAgLy8gICAgICAgZG9tYWluOiAnaHR0cHM6Ly9leGFtcGxlLmNvbScsXG4gIC8vICAgICAgIGFwaVBhdGg6ICcvYXBpJyxcbiAgLy8gICAgIH0sXG4gIC8vICAgICBvcHRzXG4gIC8vICAgKTtcbiAgLy8gICBjb25zdCBwcmVmaXggPSBgJHtvcHRpb25zLmRvbWFpbn0ke29wdGlvbnMuYXBpUGF0aH1gO1xuICAvL1xuICAvLyAgIGNvbnNvbGUubG9nKCdJTkNMVURFIEluZmxhdGluZy4uLicpO1xuICAvLyAgIHJldHVybiB0aGlzLiRnZXQoXG4gIC8vICAgICB0aGlzLmNvbnN0cnVjdG9yLiRwYWNrYWdlSW5jbHVkZXMuY29uY2F0KCRzZWxmKVxuICAvLyAgICkudGhlbigoaW5mbGF0ZWQpID0+IHtcbiAgLy8gICAgIGNvbnNvbGUubG9nKCdJTkNMVURFIEluZmxhdGVkLicpO1xuICAvLyAgICAgY29uc29sZS5sb2coYElOQ0xVREUgSUQ6ICR7dGhpcy4kaWR9YCk7XG4gIC8vICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFxuICAvLyAgICAgICB0aGlzLmNvbnN0cnVjdG9yLiRwYWNrYWdlSW5jbHVkZXMubWFwKChyZWxhdGlvbnNoaXApID0+IHtcbiAgLy8gICAgICAgICBjb25zb2xlLmxvZyhgSU5DTFVERSAgIFBhY2thZ2luZyAke3JlbGF0aW9uc2hpcH1gKTtcbiAgLy8gICAgICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFxuICAvLyAgICAgICAgICAgaW5mbGF0ZWRbcmVsYXRpb25zaGlwXS5tYXAoKHJlbCkgPT4ge1xuICAvLyAgICAgICAgICAgICBjb25zdCBvdGhlclNpZGUgPSB0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbcmVsYXRpb25zaGlwXS5yZWxhdGlvbnNoaXAuJHNpZGVzW3JlbGF0aW9uc2hpcF0ub3RoZXI7XG4gIC8vICAgICAgICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZmluZChcbiAgLy8gICAgICAgICAgICAgICBvdGhlclNpZGUudHlwZSxcbiAgLy8gICAgICAgICAgICAgICByZWxbb3RoZXJTaWRlLmZpZWxkXVxuICAvLyAgICAgICAgICAgICApLiQkcGFja2FnZUZvckluY2x1c2lvbigpO1xuICAvLyAgICAgICAgICAgfSlcbiAgLy8gICAgICAgICApO1xuICAvLyAgICAgICB9KVxuICAvLyAgICAgKS50aGVuKChjaGlsZFBrZ3MpID0+IHtcbiAgLy8gICAgICAgY29uc29sZS5sb2coJ0lOQ0xVREUgQ2hpbGQgUGFja2FnZXMgbG9hZGVkJyk7XG4gIC8vICAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSB7fTtcbiAgLy8gICAgICAgT2JqZWN0LmtleXMoaW5mbGF0ZWQpLmZpbHRlcihrID0+IGsgIT09ICdpZCcgJiYgKHRoaXMuY29uc3RydWN0b3IuJHBhY2thZ2VJbmNsdWRlcy5pbmRleE9mKGspIDwgMCkpXG4gIC8vICAgICAgIC5mb3JFYWNoKChhdHRyaWJ1dGUpID0+IHtcbiAgLy8gICAgICAgICBhdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gPSBpbmZsYXRlZFthdHRyaWJ1dGVdO1xuICAvLyAgICAgICB9KTtcbiAgLy9cbiAgLy8gICAgICAgLy8gY29uc3QgaW5jbHVkZWQgPSBbXTtcbiAgLy8gICAgICAgY29uc3QgcmVsYXRpb25zaGlwcyA9IHt9O1xuICAvLyAgICAgICB0aGlzLmNvbnN0cnVjdG9yLiRwYWNrYWdlSW5jbHVkZXMuZm9yRWFjaCgocmVsYXRpb25zaGlwLCBpbmRleCkgPT4ge1xuICAvLyAgICAgICAgIGNvbnNvbGUubG9nKGBJTkNMVURFICBCdWlsZGluZyAke3JlbGF0aW9uc2hpcH0gcmVsYXRpb25zaGlwLi4uYCk7XG4gIC8vICAgICAgICAgcmVsYXRpb25zaGlwc1tyZWxhdGlvbnNoaXBdID0ge1xuICAvLyAgICAgICAgICAgbGlua3M6IHtcbiAgLy8gICAgICAgICAgICAgcmVsYXRlZDogYCR7cHJlZml4fS8ke3RoaXMuY29uc3RydWN0b3IuJG5hbWV9LyR7dGhpcy4kaWR9LyR7cmVsYXRpb25zaGlwfWAsXG4gIC8vICAgICAgICAgICB9LFxuICAvLyAgICAgICAgICAgZGF0YTogY2hpbGRQa2dzW2luZGV4XS5tYXAoKGNoaWxkUGtnKSA9PiB7XG4gIC8vICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBJTkNMVURFICAgIEFkZGluZyByZWxhdGlvbnNoaXAgZGF0YSAke0pTT04uc3RyaW5naWZ5KGNoaWxkUGtnKX1gKTtcbiAgLy8gICAgICAgICAgICAgLy8gY29uc3QgY2hpbGRQa2dOb0luY2x1ZGUgPSB7fTtcbiAgLy8gICAgICAgICAgICAgLy8gT2JqZWN0LmtleXMoY2hpbGRQa2cpLmZpbHRlcihrID0+IGsgIT09ICdpbmNsdWRlZCcpLmZvckVhY2goKGtleSkgPT4ge1xuICAvLyAgICAgICAgICAgICAvLyAgIGNoaWxkUGtnTm9JbmNsdWRlW2tleV0gPSBjaGlsZFBrZ1trZXldO1xuICAvLyAgICAgICAgICAgICAvLyB9KTtcbiAgLy8gICAgICAgICAgICAgLy8gaW5jbHVkZWQucHVzaChjaGlsZFBrZ05vSW5jbHVkZSk7XG4gIC8vICAgICAgICAgICAgIC8vIGNoaWxkUGtnLmluY2x1ZGVkLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgLy8gICAgICAgICAgICAgLy8gICBpbmNsdWRlZC5wdXNoKGl0ZW0pO1xuICAvLyAgICAgICAgICAgICAvLyB9KTtcbiAgLy8gICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogY2hpbGRQa2cudHlwZSwgaWQ6IGNoaWxkUGtnLmlkIH07XG4gIC8vICAgICAgICAgICB9KSxcbiAgLy8gICAgICAgICB9O1xuICAvLyAgICAgICB9KTtcbiAgLy9cbiAgLy8gICAgICAgY29uc29sZS5sb2coJ0lOQ0xVREUgQXNzZW1ibGluZyBwYWNrYWdlLi4uJyk7XG4gIC8vICAgICAgIHJldHVybiB7XG4gIC8vICAgICAgICAgdHlwZTogdGhpcy5jb25zdHJ1Y3Rvci4kbmFtZSxcbiAgLy8gICAgICAgICBpZDogdGhpcy4kaWQsXG4gIC8vICAgICAgICAgYXR0cmlidXRlczogYXR0cmlidXRlcyxcbiAgLy8gICAgICAgICByZWxhdGlvbnNoaXBzOiByZWxhdGlvbnNoaXBzLFxuICAvLyAgICAgICAgIGxpbmtzOiB7XG4gIC8vICAgICAgICAgICBzZWxmOiBgJHtwcmVmaXh9LyR7dGhpcy5jb25zdHJ1Y3Rvci4kbmFtZX0vJHt0aGlzLiRpZH1gLFxuICAvLyAgICAgICAgIH0sXG4gIC8vICAgICAgIH07XG4gIC8vICAgICB9KTtcbiAgLy8gICB9KTtcbiAgLy8gfVxuXG4gICRwYWNrYWdlKG9wdHMpIHtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAge1xuICAgICAgICBkb21haW46ICdodHRwczovL2V4YW1wbGUuY29tJyxcbiAgICAgICAgYXBpUGF0aDogJy9hcGknLFxuICAgICAgfSxcbiAgICAgIG9wdHNcbiAgICApO1xuICAgIGNvbnN0IHByZWZpeCA9IGAke29wdGlvbnMuZG9tYWlufSR7b3B0aW9ucy5hcGlQYXRofWA7XG5cbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgIHRoaXMuJGdldCh0aGlzLiRyZWxhdGVkRmllbGRzLmNvbmNhdCgkc2VsZikpLFxuICAgICAgdGhpc1skcGx1bXBdLmJ1bGtHZXQodGhpcy4kcmVsYXRlZEZpZWxkcyksXG4gICAgXSkudGhlbigoW3NlbGYsIGV4dGVuZGVkSlNPTl0pID0+IHtcbiAgICAgIGNvbnN0IGV4dGVuZGVkID0ge307XG4gICAgICBmb3IgKGNvbnN0IHJlbCBpbiBleHRlbmRlZEpTT04pIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBndWFyZC1mb3ItaW5cbiAgICAgICAgY29uc3QgdHlwZSA9IHRoaXMuJHJlbGF0aW9uc2hpcHNbcmVsXS5jb25zdHJ1Y3Rvci4kc2lkZXNbcmVsXS5vdGhlci50eXBlO1xuICAgICAgICBleHRlbmRlZFtyZWxdID0gZXh0ZW5kZWRKU09OW3JlbF0ubWFwKGRhdGEgPT4ge1xuICAgICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZm9yZ2UodHlwZSwgZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIHNlbGYsXG4gICAgICAgIHRoaXMuJCRyZWxhdGVkUGFja2FnZShleHRlbmRlZCwgb3B0aW9ucyksXG4gICAgICAgIHRoaXMuJCRpbmNsdWRlZFBhY2thZ2UoZXh0ZW5kZWQsIG9wdGlvbnMpLFxuICAgICAgXSk7XG4gICAgfSkudGhlbigoW3NlbGYsIHJlbGF0aW9uc2hpcHMsIGluY2x1ZGVkXSkgPT4ge1xuICAgICAgY29uc3QgYXR0cmlidXRlcyA9IHt9O1xuICAgICAgdGhpcy4kYXR0cmlidXRlRmllbGRzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgYXR0cmlidXRlc1trZXldID0gc2VsZltrZXldO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHJldFZhbCA9IHtcbiAgICAgICAgbGlua3M6IHsgc2VsZjogYCR7cHJlZml4fSR7dGhpcy4kcGF0aH1gIH0sXG4gICAgICAgIGRhdGE6IHRoaXMuJGRhdGFKU09OLFxuICAgICAgICBhdHRyaWJ1dGVzOiBhdHRyaWJ1dGVzLFxuICAgICAgICBpbmNsdWRlZDogaW5jbHVkZWQsXG4gICAgICB9O1xuXG4gICAgICBpZiAocmVsYXRpb25zaGlwcyAhPT0ge30pIHtcbiAgICAgICAgcmV0VmFsLnJlbGF0aW9uc2hpcHMgPSByZWxhdGlvbnNoaXBzO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmV0VmFsO1xuICAgIH0pO1xuICB9XG5cbiAgJCRyZWxhdGVkUGFja2FnZShleHRlbmRlZCwgb3B0cykge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIGluY2x1ZGU6IHRoaXMuY29uc3RydWN0b3IuJGluY2x1ZGUsXG4gICAgICAgIGRvbWFpbjogJ2h0dHBzOi8vZXhhbXBsZS5jb20nLFxuICAgICAgICBhcGlQYXRoOiAnL2FwaScsXG4gICAgICB9LFxuICAgICAgb3B0c1xuICAgICk7XG4gICAgY29uc3QgcHJlZml4ID0gYCR7b3B0aW9ucy5kb21haW59JHtvcHRzLmFwaVBhdGh9YDtcbiAgICBjb25zdCBmaWVsZHMgPSBPYmplY3Qua2V5cyhvcHRpb25zLmluY2x1ZGUpLmZpbHRlcihyZWwgPT4ge1xuICAgICAgcmV0dXJuIHRoaXNbJHN0b3JlXVtyZWxdO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXMuJGdldChmaWVsZHMpXG4gICAgLnRoZW4oc2VsZiA9PiB7XG4gICAgICBjb25zdCByZXRWYWwgPSB7fTtcbiAgICAgIGZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgICAgaWYgKGV4dGVuZGVkW2ZpZWxkXSAmJiBzZWxmW2ZpZWxkXS5sZW5ndGgpIHtcbiAgICAgICAgICBjb25zdCBjaGlsZElkcyA9IHNlbGZbZmllbGRdLm1hcChyZWwgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHJlbFt0aGlzLiRyZWxhdGlvbnNoaXBzW2ZpZWxkXS5jb25zdHJ1Y3Rvci4kc2lkZXNbZmllbGRdLm90aGVyLmZpZWxkXTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXRWYWxbZmllbGRdID0ge1xuICAgICAgICAgICAgbGlua3M6IHtcbiAgICAgICAgICAgICAgcmVsYXRlZDogYCR7cHJlZml4fSR7dGhpcy4kcGF0aH0vJHtmaWVsZH1gLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRhdGE6IGV4dGVuZGVkW2ZpZWxkXS5maWx0ZXIoY2hpbGQgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gY2hpbGRJZHMuaW5kZXhPZihjaGlsZC4kaWQpID49IDA7XG4gICAgICAgICAgICB9KS5tYXAoY2hpbGQgPT4gY2hpbGQuJGRhdGFKU09OKSxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHJldFZhbDtcbiAgICB9KTtcbiAgfVxuXG4gICQkaW5jbHVkZWRQYWNrYWdlKGV4dGVuZGVkLCBvcHRzKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChcbiAgICAgIE9iamVjdC5rZXlzKGV4dGVuZGVkKS5tYXAocmVsYXRpb25zaGlwID0+IHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChcbiAgICAgICAgICBleHRlbmRlZFtyZWxhdGlvbnNoaXBdLm1hcChjaGlsZCA9PiB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZE9wdHMgPSBPYmplY3QuYXNzaWduKFxuICAgICAgICAgICAgICB7fSxcbiAgICAgICAgICAgICAgb3B0cyxcbiAgICAgICAgICAgICAgeyBpbmNsdWRlOiB0aGlzLmNvbnN0cnVjdG9yLiRpbmNsdWRlIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gY2hpbGQuJCRwYWNrYWdlRm9ySW5jbHVzaW9uKGNoaWxkT3B0cyk7XG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgIH0pXG4gICAgKS50aGVuKHJlbGF0aW9uc2hpcHMgPT4ge1xuICAgICAgcmV0dXJuIHJlbGF0aW9uc2hpcHMucmVkdWNlKChhY2MsIGN1cnIpID0+IGFjYy5jb25jYXQoY3VycikpO1xuICAgIH0pO1xuICB9XG5cbiAgJCRwYWNrYWdlRm9ySW5jbHVzaW9uKG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIGRvbWFpbjogJ2h0dHBzOi8vZXhhbXBsZS5jb20nLFxuICAgICAgICBhcGlQYXRoOiAnL2FwaScsXG4gICAgICAgIGluY2x1ZGU6IHRoaXMuY29uc3RydWN0b3IuJGluY2x1ZGUsXG4gICAgICB9LFxuICAgICAgb3B0c1xuICAgICk7XG4gICAgY29uc3QgcHJlZml4ID0gYCR7b3B0aW9ucy5kb21haW59JHtvcHRpb25zLmFwaVBhdGh9YDtcblxuICAgIHJldHVybiB0aGlzLiRnZXQodGhpcy4kcmVsYXRlZEZpZWxkcy5jb25jYXQoJHNlbGYpKVxuICAgIC50aGVuKHNlbGYgPT4ge1xuICAgICAgY29uc3QgcmVsYXRlZCA9IHt9O1xuICAgICAgdGhpcy4kcmVsYXRlZEZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coYCoqKiAke0pTT04uc3RyaW5naWZ5KHNlbGZbZmllbGRdLCBudWxsLCAyKX1gKTtcbiAgICAgICAgcmVsYXRlZFtmaWVsZF0gPSBzZWxmW2ZpZWxkXS5tYXAocmVsID0+IHtcbiAgICAgICAgICBjb25zdCBvdGhlck1ldGEgPSB0aGlzLiRyZWxhdGlvbnNoaXBzW2ZpZWxkXS5jb25zdHJ1Y3Rvci4kc2lkZXNbZmllbGRdLm90aGVyO1xuICAgICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZm9yZ2Uob3RoZXJNZXRhLnR5cGUsIHJlbFtvdGhlck1ldGEuZmllbGRdKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0aGlzLiQkcmVsYXRlZFBhY2thZ2Uoc2VsZiwgb3B0cylcbiAgICAgIC50aGVuKHJlbGF0aW9uc2hpcHMgPT4ge1xuICAgICAgICBjb25zdCBhdHRyaWJ1dGVzID0ge307XG4gICAgICAgIGZvciAoY29uc3QgZmllbGQgaW4gdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgZmllbGQgIT09IHRoaXMuY29uc3RydWN0b3IuJGlkICYmXG4gICAgICAgICAgICB0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGRdLnR5cGUgIT09ICdoYXNNYW55J1xuICAgICAgICAgICkge1xuICAgICAgICAgICAgYXR0cmlidXRlc1tmaWVsZF0gPSBzZWxmW2ZpZWxkXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZXRWYWwgPSB7XG4gICAgICAgICAgdHlwZTogdGhpcy4kbmFtZSxcbiAgICAgICAgICBpZDogdGhpcy4kaWQsXG4gICAgICAgICAgYXR0cmlidXRlczogYXR0cmlidXRlcyxcbiAgICAgICAgICBsaW5rczoge1xuICAgICAgICAgICAgc2VsZjogYCR7cHJlZml4fSR7dGhpcy4kcGF0aH1gLFxuICAgICAgICAgIH0sXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHJlbGF0aW9uc2hpcHMgIT09IHt9KSB7XG4gICAgICAgICAgcmV0VmFsLnJlbGF0aW9uc2hpcHMgPSByZWxhdGlvbnNoaXBzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldFZhbDtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gVE9ETzogZG9uJ3QgZmV0Y2ggaWYgd2UgJGdldCgpIHNvbWV0aGluZyB0aGF0IHdlIGFscmVhZHkgaGF2ZVxuXG4gICRnZXQob3B0cykge1xuICAgIGxldCBrZXlzID0gWyRzZWxmXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRzKSkge1xuICAgICAga2V5cyA9IG9wdHM7XG4gICAgfSBlbHNlIGlmIChvcHRzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGtleXMgPSBbb3B0c107XG4gICAgfVxuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoa2V5cy5tYXAoKGtleSkgPT4gdGhpcy4kJHNpbmdsZUdldChrZXkpKSlcbiAgICAudGhlbigodmFsdWVBcnJheSkgPT4ge1xuICAgICAgY29uc3Qgc2VsZklkeCA9IGtleXMuaW5kZXhPZigkc2VsZik7XG4gICAgICBpZiAoKHNlbGZJZHggPj0gMCkgJiYgKHZhbHVlQXJyYXlbc2VsZklkeF0gPT09IG51bGwpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlQXJyYXkucmVkdWNlKChhY2N1bSwgY3VycikgPT4gT2JqZWN0LmFzc2lnbihhY2N1bSwgY3VyciksIHt9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICQkc2luZ2xlR2V0KG9wdCA9ICRzZWxmKSB7XG4gICAgLy8gdGhyZWUgY2FzZXMuXG4gICAgLy8ga2V5ID09PSB1bmRlZmluZWQgLSBmZXRjaCBhbGwsIHVubGVzcyAkbG9hZGVkLCBidXQgcmV0dXJuIGFsbC5cbiAgICAvLyBmaWVsZHNba2V5XSA9PT0gJ2hhc01hbnknIC0gZmV0Y2ggY2hpbGRyZW4gKHBlcmhhcHMgbW92ZSB0aGlzIGRlY2lzaW9uIHRvIHN0b3JlKVxuICAgIC8vIG90aGVyd2lzZSAtIGZldGNoIGFsbCwgdW5sZXNzICRzdG9yZVtrZXldLCByZXR1cm4gJHN0b3JlW2tleV0uXG4gICAgbGV0IGtleTtcbiAgICBpZiAoKG9wdCAhPT0gJHNlbGYpICYmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbb3B0XS50eXBlICE9PSAnaGFzTWFueScpKSB7XG4gICAgICBrZXkgPSAkc2VsZjtcbiAgICB9IGVsc2Uge1xuICAgICAga2V5ID0gb3B0O1xuICAgIH1cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKGtleSA9PT0gJHNlbGYpIHtcbiAgICAgICAgaWYgKHRoaXNbJGxvYWRlZF1bJHNlbGZdID09PSBmYWxzZSAmJiB0aGlzWyRwbHVtcF0pIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLmdldCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCh0aGlzWyRsb2FkZWRdW2tleV0gPT09IGZhbHNlKSAmJiB0aGlzWyRwbHVtcF0pIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1sb25lbHktaWZcbiAgICAgICAgICByZXR1cm4gdGhpcy4kcmVsYXRpb25zaGlwc1trZXldLiRsaXN0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KS50aGVuKCh2KSA9PiB7XG4gICAgICBpZiAodiA9PT0gdHJ1ZSkge1xuICAgICAgICBpZiAoa2V5ID09PSAkc2VsZikge1xuICAgICAgICAgIGNvbnN0IHJldFZhbCA9IHt9O1xuICAgICAgICAgIGZvciAoY29uc3QgayBpbiB0aGlzWyRzdG9yZV0pIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba10udHlwZSAhPT0gJ2hhc01hbnknKSB7XG4gICAgICAgICAgICAgIHJldFZhbFtrXSA9IHRoaXNbJHN0b3JlXVtrXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJldFZhbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgeyBba2V5XTogdGhpc1skc3RvcmVdW2tleV0gfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodiAmJiAodlskc2VsZl0gIT09IG51bGwpKSB7XG4gICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KTtcbiAgICAgICAgdGhpc1skbG9hZGVkXVtrZXldID0gdHJ1ZTtcbiAgICAgICAgaWYgKGtleSA9PT0gJHNlbGYpIHtcbiAgICAgICAgICBjb25zdCByZXRWYWwgPSB7fTtcbiAgICAgICAgICBmb3IgKGNvbnN0IGsgaW4gdGhpc1skc3RvcmVdKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tdLnR5cGUgIT09ICdoYXNNYW55Jykge1xuICAgICAgICAgICAgICByZXRWYWxba10gPSB0aGlzWyRzdG9yZV1ba107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXRWYWw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHsgW2tleV06IHRoaXNbJHN0b3JlXVtrZXldIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICRzYXZlKCkge1xuICAgIHJldHVybiB0aGlzLiRzZXQoKTtcbiAgfVxuXG4gICRzZXQodSA9IHRoaXNbJHN0b3JlXSkge1xuICAgIGNvbnN0IHVwZGF0ZSA9IG1lcmdlT3B0aW9ucyh7fSwgdGhpc1skc3RvcmVdLCB1KTtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgICBkZWxldGUgdXBkYXRlW2tleV07XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHVwZGF0ZSk7IC8vIHRoaXMgaXMgdGhlIG9wdGltaXN0aWMgdXBkYXRlO1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0uc2F2ZSh0aGlzLmNvbnN0cnVjdG9yLCB1cGRhdGUpXG4gICAgLnRoZW4oKHVwZGF0ZWQpID0+IHtcbiAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh1cGRhdGVkKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0pO1xuICB9XG5cbiAgJGRlbGV0ZSgpIHtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLmRlbGV0ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCk7XG4gIH1cblxuICAkcmVzdChvcHRzKSB7XG4gICAgY29uc3QgcmVzdE9wdHMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICBvcHRzLFxuICAgICAge1xuICAgICAgICB1cmw6IGAvJHt0aGlzLmNvbnN0cnVjdG9yLiRuYW1lfS8ke3RoaXMuJGlkfS8ke29wdHMudXJsfWAsXG4gICAgICB9XG4gICAgKTtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLnJlc3RSZXF1ZXN0KHJlc3RPcHRzKTtcbiAgfVxuXG4gICRhZGQoa2V5LCBpdGVtLCBleHRyYXMpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgICBsZXQgaWQgPSAwO1xuICAgICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgICB9IGVsc2UgaWYgKGl0ZW0uJGlkKSB7XG4gICAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZCA9IGl0ZW1bdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0ucmVsYXRpb25zaGlwLiRzaWRlc1trZXldLm90aGVyLmZpZWxkXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0uYWRkKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkLCBleHRyYXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gYWRkZWQgdG8gaGFzTWFueScpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJykpO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKGwpID0+IHtcbiAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh7IFtrZXldOiBsIH0pO1xuICAgICAgcmV0dXJuIGw7XG4gICAgfSk7XG4gIH1cblxuICAkbW9kaWZ5UmVsYXRpb25zaGlwKGtleSwgaXRlbSwgZXh0cmFzKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gW107XG4gICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLm1vZGlmeVJlbGF0aW9uc2hpcCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpZCwgZXh0cmFzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gYWRkZWQgdG8gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICRyZW1vdmUoa2V5LCBpdGVtKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gW107XG4gICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLnJlbW92ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtICRyZW1vdmVkIGZyb20gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkcmVtb3ZlIGV4Y2VwdCBmcm9tIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG5cbiAgJHRlYXJkb3duKCkge1xuICAgIGlmICh0aGlzWyR1bnN1YnNjcmliZV0pIHtcbiAgICAgIHRoaXNbJHVuc3Vic2NyaWJlXS51bnN1YnNjcmliZSgpO1xuICAgIH1cbiAgfVxufVxuXG5Nb2RlbC5mcm9tSlNPTiA9IGZ1bmN0aW9uIGZyb21KU09OKGpzb24pIHtcbiAgdGhpcy4kaWQgPSBqc29uLiRpZCB8fCAnaWQnO1xuICB0aGlzLiRuYW1lID0ganNvbi4kbmFtZTtcbiAgdGhpcy4kZmllbGRzID0ge307XG4gIE9iamVjdC5rZXlzKGpzb24uJGZpZWxkcykuZm9yRWFjaCgoaykgPT4ge1xuICAgIGNvbnN0IGZpZWxkID0ganNvbi4kZmllbGRzW2tdO1xuICAgIGlmIChmaWVsZC50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGNsYXNzIER5bmFtaWNSZWxhdGlvbnNoaXAgZXh0ZW5kcyBSZWxhdGlvbnNoaXAge31cbiAgICAgIER5bmFtaWNSZWxhdGlvbnNoaXAuZnJvbUpTT04oZmllbGQucmVsYXRpb25zaGlwKTtcbiAgICAgIHRoaXMuJGZpZWxkc1trXSA9IHtcbiAgICAgICAgdHlwZTogJ2hhc01hbnknLFxuICAgICAgICByZWxhdGlvbnNoaXA6IER5bmFtaWNSZWxhdGlvbnNoaXAsXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiRmaWVsZHNba10gPSBPYmplY3QuYXNzaWduKHt9LCBmaWVsZCk7XG4gICAgfVxuICB9KTtcbn07XG5cbk1vZGVsLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTigpIHtcbiAgY29uc3QgcmV0VmFsID0ge1xuICAgICRpZDogdGhpcy4kaWQsXG4gICAgJG5hbWU6IHRoaXMuJG5hbWUsXG4gICAgJGZpZWxkczoge30sXG4gIH07XG4gIGNvbnN0IGZpZWxkTmFtZXMgPSBPYmplY3Qua2V5cyh0aGlzLiRmaWVsZHMpO1xuICBmaWVsZE5hbWVzLmZvckVhY2goKGspID0+IHtcbiAgICBpZiAodGhpcy4kZmllbGRzW2tdLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgcmV0VmFsLiRmaWVsZHNba10gPSB7XG4gICAgICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICAgICAgcmVsYXRpb25zaGlwOiB0aGlzLiRmaWVsZHNba10ucmVsYXRpb25zaGlwLnRvSlNPTigpLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0VmFsLiRmaWVsZHNba10gPSB0aGlzLiRmaWVsZHNba107XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHJldFZhbDtcbn07XG5cbk1vZGVsLiRyZXN0ID0gZnVuY3Rpb24gJHJlc3QocGx1bXAsIG9wdHMpIHtcbiAgY29uc3QgcmVzdE9wdHMgPSBPYmplY3QuYXNzaWduKFxuICAgIHt9LFxuICAgIG9wdHMsXG4gICAge1xuICAgICAgdXJsOiBgLyR7dGhpcy4kbmFtZX0vJHtvcHRzLnVybH1gLFxuICAgIH1cbiAgKTtcbiAgcmV0dXJuIHBsdW1wLnJlc3RSZXF1ZXN0KHJlc3RPcHRzKTtcbn07XG5cbk1vZGVsLmFzc2lnbiA9IGZ1bmN0aW9uIGFzc2lnbihvcHRzKSB7XG4gIGNvbnN0IHN0YXJ0ID0ge307XG4gIE9iamVjdC5rZXlzKHRoaXMuJGZpZWxkcykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgaWYgKG9wdHNba2V5XSkge1xuICAgICAgc3RhcnRba2V5XSA9IG9wdHNba2V5XTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuJGZpZWxkc1trZXldLmRlZmF1bHQpIHtcbiAgICAgIHN0YXJ0W2tleV0gPSB0aGlzLiRmaWVsZHNba2V5XS5kZWZhdWx0O1xuICAgIH0gZWxzZSBpZiAodGhpcy4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBzdGFydFtrZXldID0gW107XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXJ0W2tleV0gPSBudWxsO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBzdGFydDtcbn07XG5cbk1vZGVsLiRpZCA9ICdpZCc7XG5Nb2RlbC4kbmFtZSA9ICdCYXNlJztcbk1vZGVsLiRzZWxmID0gJHNlbGY7XG5Nb2RlbC4kZmllbGRzID0ge1xuICBpZDoge1xuICAgIHR5cGU6ICdudW1iZXInLFxuICB9LFxufTtcbk1vZGVsLiRpbmNsdWRlZCA9IFtdO1xuIl19
