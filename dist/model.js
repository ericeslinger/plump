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
  }, {
    key: '$$packageForInclusion',
    value: function $$packageForInclusion(opts) {
      var _this5 = this;

      var options = Object.assign({}, {
        domain: 'https://example.com',
        apiPath: '/api'
      }, opts);
      var prefix = '' + options.domain + options.apiPath;

      console.log('INCLUDE Inflating...');
      return this.$get(this.constructor.$packageIncludes.concat($self)).then(function (inflated) {
        console.log('INCLUDE Inflated.');
        console.log('INCLUDE ID: ' + _this5.$id);
        return _bluebird2.default.all(_this5.constructor.$packageIncludes.map(function (relationship) {
          console.log('INCLUDE   Packaging ' + relationship);
          return _bluebird2.default.all(inflated[relationship].map(function (rel) {
            var otherSide = _this5.constructor.$fields[relationship].relationship.$sides[relationship].other;
            console.log('INCLUDE     Packaging child ' + _this5[$plump].find(otherSide.type, rel[otherSide.field]).$id);
            return _this5[$plump].find(otherSide.type, rel[otherSide.field]).$$packageForInclusion();
          }));
        })).then(function (childPkgs) {
          console.log('INCLUDE Child Packages loaded');
          var attributes = {};
          Object.keys(inflated).filter(function (k) {
            return k !== 'id' && _this5.constructor.$packageIncludes.indexOf(k) < 0;
          }).forEach(function (attribute) {
            attributes[attribute] = inflated[attribute];
          });

          // const included = [];
          var relationships = {};
          _this5.constructor.$packageIncludes.forEach(function (relationship, index) {
            console.log('INCLUDE  Building ' + relationship + ' relationship...');
            relationships[relationship] = {
              links: {
                related: prefix + '/' + _this5.constructor.$name + '/' + _this5.$id + '/' + relationship
              },
              data: childPkgs[index].map(function (childPkg) {
                console.log('INCLUDE    Adding relationship data ' + JSON.stringify(childPkg));
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

          console.log('INCLUDE Assembling package...');
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

      return _bluebird2.default.all([this.$get($self), this.$relationshipsJSON, this.$includedJSON]).then(function (_ref2) {
        var _ref3 = _slicedToArray(_ref2, 3),
            attributes = _ref3[0],
            relationships = _ref3[1],
            included = _ref3[2];

        return {
          links: { self: '' + prefix + _this6.$path },
          data: { type: _this6.$name, id: _this6.$id },
          attributes: attributes,
          relationships: relationships,
          included: included
        };
      });
    }
  }, {
    key: '$get',


    // console.log('Inflating...');
    // return this.$get(
    //   this.constructor.$packageIncludes.concat($self)
    // )
    // .then((inflated) => {
    //   console.log('Inflated.');
    //   console.log('Packaging children...');
    //   return Bluebird.all(
    //     this.constructor.$packageIncludes.map((relationship) => {
    //       console.log(`  Packaging ${relationship}...`);
    //       return Bluebird.all(
    //         inflated[relationship].map((rel) => {
    //           const otherSide = this.constructor.$fields[relationship].relationship.$sides[relationship].other;
    //           console.log(`    Packaging child ${this[$plump].find(otherSide.type, rel[otherSide.field]).$id}...`);
    //           return this[$plump].find(
    //             otherSide.type,
    //             rel[otherSide.field]
    //           ).$$packageForInclusion();
    //         })
    //       );
    //     })
    //   ).then((childPkgs) => {
    //     console.log('Children packaged...');
    //     const attributes = {};
    //     Object.keys(inflated).filter(k => k !== 'id' && (this.constructor.$packageIncludes.indexOf(k) < 0))
    //     .forEach((attribute) => {
    //       attributes[attribute] = inflated[attribute];
    //     });
    //
    //     const included = [];
    //     const relationships = {};
    //     this.constructor.$packageIncludes.forEach((relationship, index) => {
    //       console.log(`  Building ${relationship} relationship...`)
    //       relationships[relationship] = {
    //         links: {
    //           related: `${prefix}/${this.constructor.$name}/${this.$id}/${relationship}`,
    //         },
    //         data: childPkgs[index].map((childPkg) => {
    //           console.log(`   Adding relationship data ${childPkg}...`);
    //           const childPkgNoInclude = {};
    //           Object.keys(childPkg).filter(k => k !== 'included').forEach((key) => {
    //             childPkgNoInclude[key] = childPkg[key];
    //           });
    //           included.push(childPkgNoInclude);
    //           // childPkg.included.forEach((item) => {
    //           //   included.push(item);
    //           // });
    //           return { type: childPkg.type, id: childPkg.id };
    //         }),
    //       };
    //     });
    //
    //     console.log('Building package...');
    //     const pkg = {
    //       links: {
    //         self: `${prefix}/${this.constructor.$name}/${this.$id}`,
    //       },
    //       data: {
    //         type: this.constructor.$name,
    //         id: this.$id,
    //       },
    //       attributes: attributes,
    //       relationships: relationships,
    //       included: included,
    //     };
    //
    //     return pkg;
    //   });
    // });

    // TODO: don't fetch if we $get() something that we already have

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
  }, {
    key: '$path',
    get: function get() {
      return '/' + this.$name + '/' + this.$id;
    }
  }, {
    key: '$relationshipsJSON',
    get: function get() {
      return {};
    }
  }, {
    key: '$includedJSON',
    get: function get() {
      return {};
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRzdG9yZSIsIlN5bWJvbCIsIiRwbHVtcCIsIiRsb2FkZWQiLCIkdW5zdWJzY3JpYmUiLCIkc3ViamVjdCIsIiRzZWxmIiwiJGFsbCIsIk1vZGVsIiwib3B0cyIsInBsdW1wIiwiJHJlbGF0aW9uc2hpcHMiLCJuZXh0IiwiT2JqZWN0Iiwia2V5cyIsImNvbnN0cnVjdG9yIiwiJGZpZWxkcyIsImZvckVhY2giLCJrZXkiLCJ0eXBlIiwiUmVsIiwicmVsYXRpb25zaGlwIiwiZGVmYXVsdCIsIiQkY29weVZhbHVlc0Zyb20iLCJmaWVsZE5hbWUiLCJ1bmRlZmluZWQiLCJjb25jYXQiLCJhc3NpZ24iLCIkJGZpcmVVcGRhdGUiLCJzdWJzY3JpYmUiLCIkbmFtZSIsIiRpZCIsImZpZWxkIiwidmFsdWUiLCJmaWVsZHMiLCJjYiIsImxlbmd0aCIsIkFycmF5IiwiaXNBcnJheSIsIiQkaG9va1RvUGx1bXAiLCJzdHJlYW1HZXQiLCJ2Iiwib3B0aW9ucyIsImRvbWFpbiIsImFwaVBhdGgiLCJwcmVmaXgiLCJjb25zb2xlIiwibG9nIiwiJGdldCIsIiRwYWNrYWdlSW5jbHVkZXMiLCJ0aGVuIiwiaW5mbGF0ZWQiLCJhbGwiLCJtYXAiLCJyZWwiLCJvdGhlclNpZGUiLCIkc2lkZXMiLCJvdGhlciIsImZpbmQiLCIkJHBhY2thZ2VGb3JJbmNsdXNpb24iLCJjaGlsZFBrZ3MiLCJhdHRyaWJ1dGVzIiwiZmlsdGVyIiwiayIsImluZGV4T2YiLCJhdHRyaWJ1dGUiLCJyZWxhdGlvbnNoaXBzIiwiaW5kZXgiLCJsaW5rcyIsInJlbGF0ZWQiLCJkYXRhIiwiY2hpbGRQa2ciLCJKU09OIiwic3RyaW5naWZ5IiwiaWQiLCJzZWxmIiwiJHJlbGF0aW9uc2hpcHNKU09OIiwiJGluY2x1ZGVkSlNPTiIsImluY2x1ZGVkIiwiJHBhdGgiLCIkJHNpbmdsZUdldCIsInZhbHVlQXJyYXkiLCJzZWxmSWR4IiwicmVkdWNlIiwiYWNjdW0iLCJjdXJyIiwib3B0IiwicmVzb2x2ZSIsImdldCIsIiRsaXN0IiwicmV0VmFsIiwiJHNldCIsInUiLCJ1cGRhdGUiLCJzYXZlIiwidXBkYXRlZCIsImRlbGV0ZSIsInJlc3RPcHRzIiwidXJsIiwicmVzdFJlcXVlc3QiLCJpdGVtIiwiZXh0cmFzIiwiYWRkIiwicmVqZWN0IiwiRXJyb3IiLCJsIiwibW9kaWZ5UmVsYXRpb25zaGlwIiwicmVtb3ZlIiwidW5zdWJzY3JpYmUiLCJmcm9tSlNPTiIsImpzb24iLCJEeW5hbWljUmVsYXRpb25zaGlwIiwidG9KU09OIiwiZmllbGROYW1lcyIsIiRyZXN0Iiwic3RhcnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7QUFDQSxJQUFNQSxTQUFTQyxPQUFPLFFBQVAsQ0FBZjtBQUNBLElBQU1DLFNBQVNELE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUUsVUFBVUYsT0FBTyxTQUFQLENBQWhCO0FBQ0EsSUFBTUcsZUFBZUgsT0FBTyxjQUFQLENBQXJCO0FBQ0EsSUFBTUksV0FBV0osT0FBTyxVQUFQLENBQWpCO0FBQ08sSUFBTUssd0JBQVFMLE9BQU8sT0FBUCxDQUFkO0FBQ0EsSUFBTU0sc0JBQU9OLE9BQU8sTUFBUCxDQUFiOztBQUVQO0FBQ0E7O0lBRWFPLEssV0FBQUEsSztBQUNYLGlCQUFZQyxJQUFaLEVBQWtCQyxLQUFsQixFQUF5QjtBQUFBOztBQUFBOztBQUN2QixTQUFLVixNQUFMLElBQWUsRUFBZjtBQUNBLFNBQUtXLGNBQUwsR0FBc0IsRUFBdEI7QUFDQSxTQUFLTixRQUFMLElBQWlCLHlCQUFqQjtBQUNBLFNBQUtBLFFBQUwsRUFBZU8sSUFBZixDQUFvQixFQUFwQjtBQUNBLFNBQUtULE9BQUwsd0JBQ0dHLEtBREgsRUFDVyxLQURYO0FBR0FPLFdBQU9DLElBQVAsQ0FBWSxLQUFLQyxXQUFMLENBQWlCQyxPQUE3QixFQUFzQ0MsT0FBdEMsQ0FBOEMsVUFBQ0MsR0FBRCxFQUFTO0FBQ3JELFVBQUks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QixHQUhlLENBQWpCO0FBT0EsU0FBT3hGLE1BQU15RixXQUFOLENBQWtCRixRQUFsQixDQUFQO0FBQ0QsQ0FURDs7QUFXQXpGLE1BQU1tQixNQUFOLEdBQWUsU0FBU0EsTUFBVCxDQUFnQmxCLElBQWhCLEVBQXNCO0FBQUE7O0FBQ25DLE1BQU0wRyxRQUFRLEVBQWQ7QUFDQXRHLFNBQU9DLElBQVAsQ0FBWSxLQUFLRSxPQUFqQixFQUEwQkMsT0FBMUIsQ0FBa0MsVUFBQ0MsR0FBRCxFQUFTO0FBQ3pDLFFBQUlULEtBQUtTLEdBQUwsQ0FBSixFQUFlO0FBQ2JpRyxZQUFNakcsR0FBTixJQUFhVCxLQUFLUyxHQUFMLENBQWI7QUFDRCxLQUZELE1BRU8sSUFBSSxRQUFLRixPQUFMLENBQWFFLEdBQWIsRUFBa0JJLE9BQXRCLEVBQStCO0FBQ3BDNkYsWUFBTWpHLEdBQU4sSUFBYSxRQUFLRixPQUFMLENBQWFFLEdBQWIsRUFBa0JJLE9BQS9CO0FBQ0QsS0FGTSxNQUVBLElBQUksUUFBS04sT0FBTCxDQUFhRSxHQUFiLEVBQWtCQyxJQUFsQixLQUEyQixTQUEvQixFQUEwQztBQUMvQ2dHLFlBQU1qRyxHQUFOLElBQWEsRUFBYjtBQUNELEtBRk0sTUFFQTtBQUNMaUcsWUFBTWpHLEdBQU4sSUFBYSxJQUFiO0FBQ0Q7QUFDRixHQVZEO0FBV0EsU0FBT2lHLEtBQVA7QUFDRCxDQWREOztBQWdCQTNHLE1BQU11QixHQUFOLEdBQVksSUFBWjtBQUNBdkIsTUFBTXNCLEtBQU4sR0FBYyxNQUFkO0FBQ0F0QixNQUFNRixLQUFOLEdBQWNBLEtBQWQ7QUFDQUUsTUFBTVEsT0FBTixHQUFnQjtBQUNkMEQsTUFBSTtBQUNGdkQsVUFBTTtBQURKO0FBRFUsQ0FBaEIiLCJmaWxlIjoibW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHsgUmVsYXRpb25zaGlwIH0gZnJvbSAnLi9yZWxhdGlvbnNoaXAnO1xuaW1wb3J0IG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcbmltcG9ydCB7IEJlaGF2aW9yU3ViamVjdCB9IGZyb20gJ3J4anMvUngnO1xuY29uc3QgJHN0b3JlID0gU3ltYm9sKCckc3RvcmUnKTtcbmNvbnN0ICRwbHVtcCA9IFN5bWJvbCgnJHBsdW1wJyk7XG5jb25zdCAkbG9hZGVkID0gU3ltYm9sKCckbG9hZGVkJyk7XG5jb25zdCAkdW5zdWJzY3JpYmUgPSBTeW1ib2woJyR1bnN1YnNjcmliZScpO1xuY29uc3QgJHN1YmplY3QgPSBTeW1ib2woJyRzdWJqZWN0Jyk7XG5leHBvcnQgY29uc3QgJHNlbGYgPSBTeW1ib2woJyRzZWxmJyk7XG5leHBvcnQgY29uc3QgJGFsbCA9IFN5bWJvbCgnJGFsbCcpO1xuXG4vLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIGVycm9yIGV2ZW50cyBvcmlnaW5hdGUgKHN0b3JhZ2Ugb3IgbW9kZWwpXG4vLyBhbmQgd2hvIGtlZXBzIGEgcm9sbC1iYWNrYWJsZSBkZWx0YVxuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzLCBwbHVtcCkge1xuICAgIHRoaXNbJHN0b3JlXSA9IHt9O1xuICAgIHRoaXMuJHJlbGF0aW9uc2hpcHMgPSB7fTtcbiAgICB0aGlzWyRzdWJqZWN0XSA9IG5ldyBCZWhhdmlvclN1YmplY3QoKTtcbiAgICB0aGlzWyRzdWJqZWN0XS5uZXh0KHt9KTtcbiAgICB0aGlzWyRsb2FkZWRdID0ge1xuICAgICAgWyRzZWxmXTogZmFsc2UsXG4gICAgfTtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgICBjb25zdCBSZWwgPSB0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS5yZWxhdGlvbnNoaXA7XG4gICAgICAgIHRoaXMuJHJlbGF0aW9uc2hpcHNba2V5XSA9IG5ldyBSZWwodGhpcywga2V5LCBwbHVtcCk7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gW107XG4gICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpc1skc3RvcmVdW2tleV0gPSB0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS5kZWZhdWx0IHx8IG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKG9wdHMgfHwge30pO1xuICAgIGlmIChwbHVtcCkge1xuICAgICAgdGhpc1skcGx1bXBdID0gcGx1bXA7XG4gICAgfVxuICB9XG5cbiAgZ2V0ICRuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLiRuYW1lO1xuICB9XG5cbiAgZ2V0ICRpZCgpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmVdW3RoaXMuY29uc3RydWN0b3IuJGlkXTtcbiAgfVxuXG4gIGdldCAkcGF0aCgpIHtcbiAgICByZXR1cm4gYC8ke3RoaXMuJG5hbWV9LyR7dGhpcy4kaWR9YDtcbiAgfVxuXG4gICQkY29weVZhbHVlc0Zyb20ob3B0cyA9IHt9KSB7XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChmaWVsZE5hbWUpID0+IHtcbiAgICAgIGlmIChvcHRzW2ZpZWxkTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBjb3B5IGZyb20gb3B0cyB0byB0aGUgYmVzdCBvZiBvdXIgYWJpbGl0eVxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdhcnJheScpIHx8XG4gICAgICAgICAgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdoYXNNYW55JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSAob3B0c1tmaWVsZE5hbWVdIHx8IFtdKS5jb25jYXQoKTtcbiAgICAgICAgICB0aGlzWyRsb2FkZWRdW2ZpZWxkTmFtZV0gPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBPYmplY3QuYXNzaWduKHt9LCBvcHRzW2ZpZWxkTmFtZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gb3B0c1tmaWVsZE5hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy4kJGZpcmVVcGRhdGUoKTtcbiAgfVxuXG4gICQkaG9va1RvUGx1bXAoKSB7XG4gICAgaWYgKHRoaXNbJHVuc3Vic2NyaWJlXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyR1bnN1YnNjcmliZV0gPSB0aGlzWyRwbHVtcF0uc3Vic2NyaWJlKHRoaXMuY29uc3RydWN0b3IuJG5hbWUsIHRoaXMuJGlkLCAoeyBmaWVsZCwgdmFsdWUgfSkgPT4ge1xuICAgICAgICBpZiAoZmllbGQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIC8vIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2YWx1ZSk7XG4gICAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHsgW2ZpZWxkXTogdmFsdWUgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgJHN1YnNjcmliZSguLi5hcmdzKSB7XG4gICAgbGV0IGZpZWxkcyA9IFskc2VsZl07XG4gICAgbGV0IGNiO1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMikge1xuICAgICAgZmllbGRzID0gYXJnc1swXTtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShmaWVsZHMpKSB7XG4gICAgICAgIGZpZWxkcyA9IFtmaWVsZHNdO1xuICAgICAgfVxuICAgICAgY2IgPSBhcmdzWzFdO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYiA9IGFyZ3NbMF07XG4gICAgfVxuICAgIHRoaXMuJCRob29rVG9QbHVtcCgpO1xuICAgIGlmICh0aGlzWyRsb2FkZWRdWyRzZWxmXSA9PT0gZmFsc2UpIHtcbiAgICAgIHRoaXNbJHBsdW1wXS5zdHJlYW1HZXQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGZpZWxkcylcbiAgICAgIC5zdWJzY3JpYmUoKHYpID0+IHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzWyRzdWJqZWN0XS5zdWJzY3JpYmUoY2IpO1xuICB9XG5cbiAgJCRmaXJlVXBkYXRlKCkge1xuICAgIHRoaXNbJHN1YmplY3RdLm5leHQodGhpc1skc3RvcmVdKTtcbiAgfVxuXG4gICQkcGFja2FnZUZvckluY2x1c2lvbihvcHRzKSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHtcbiAgICAgICAgZG9tYWluOiAnaHR0cHM6Ly9leGFtcGxlLmNvbScsXG4gICAgICAgIGFwaVBhdGg6ICcvYXBpJyxcbiAgICAgIH0sXG4gICAgICBvcHRzXG4gICAgKTtcbiAgICBjb25zdCBwcmVmaXggPSBgJHtvcHRpb25zLmRvbWFpbn0ke29wdGlvbnMuYXBpUGF0aH1gO1xuXG4gICAgY29uc29sZS5sb2coJ0lOQ0xVREUgSW5mbGF0aW5nLi4uJyk7XG4gICAgcmV0dXJuIHRoaXMuJGdldChcbiAgICAgIHRoaXMuY29uc3RydWN0b3IuJHBhY2thZ2VJbmNsdWRlcy5jb25jYXQoJHNlbGYpXG4gICAgKS50aGVuKChpbmZsYXRlZCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ0lOQ0xVREUgSW5mbGF0ZWQuJyk7XG4gICAgICBjb25zb2xlLmxvZyhgSU5DTFVERSBJRDogJHt0aGlzLiRpZH1gKTtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoXG4gICAgICAgIHRoaXMuY29uc3RydWN0b3IuJHBhY2thZ2VJbmNsdWRlcy5tYXAoKHJlbGF0aW9uc2hpcCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBJTkNMVURFICAgUGFja2FnaW5nICR7cmVsYXRpb25zaGlwfWApO1xuICAgICAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoXG4gICAgICAgICAgICBpbmZsYXRlZFtyZWxhdGlvbnNoaXBdLm1hcCgocmVsKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IG90aGVyU2lkZSA9IHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tyZWxhdGlvbnNoaXBdLnJlbGF0aW9uc2hpcC4kc2lkZXNbcmVsYXRpb25zaGlwXS5vdGhlcjtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYElOQ0xVREUgICAgIFBhY2thZ2luZyBjaGlsZCAke3RoaXNbJHBsdW1wXS5maW5kKG90aGVyU2lkZS50eXBlLCByZWxbb3RoZXJTaWRlLmZpZWxkXSkuJGlkfWApO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLmZpbmQoXG4gICAgICAgICAgICAgICAgb3RoZXJTaWRlLnR5cGUsXG4gICAgICAgICAgICAgICAgcmVsW290aGVyU2lkZS5maWVsZF1cbiAgICAgICAgICAgICAgKS4kJHBhY2thZ2VGb3JJbmNsdXNpb24oKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKTtcbiAgICAgICAgfSlcbiAgICAgICkudGhlbigoY2hpbGRQa2dzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdJTkNMVURFIENoaWxkIFBhY2thZ2VzIGxvYWRlZCcpO1xuICAgICAgICBjb25zdCBhdHRyaWJ1dGVzID0ge307XG4gICAgICAgIE9iamVjdC5rZXlzKGluZmxhdGVkKS5maWx0ZXIoayA9PiBrICE9PSAnaWQnICYmICh0aGlzLmNvbnN0cnVjdG9yLiRwYWNrYWdlSW5jbHVkZXMuaW5kZXhPZihrKSA8IDApKVxuICAgICAgICAuZm9yRWFjaCgoYXR0cmlidXRlKSA9PiB7XG4gICAgICAgICAgYXR0cmlidXRlc1thdHRyaWJ1dGVdID0gaW5mbGF0ZWRbYXR0cmlidXRlXTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gY29uc3QgaW5jbHVkZWQgPSBbXTtcbiAgICAgICAgY29uc3QgcmVsYXRpb25zaGlwcyA9IHt9O1xuICAgICAgICB0aGlzLmNvbnN0cnVjdG9yLiRwYWNrYWdlSW5jbHVkZXMuZm9yRWFjaCgocmVsYXRpb25zaGlwLCBpbmRleCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBJTkNMVURFICBCdWlsZGluZyAke3JlbGF0aW9uc2hpcH0gcmVsYXRpb25zaGlwLi4uYCk7XG4gICAgICAgICAgcmVsYXRpb25zaGlwc1tyZWxhdGlvbnNoaXBdID0ge1xuICAgICAgICAgICAgbGlua3M6IHtcbiAgICAgICAgICAgICAgcmVsYXRlZDogYCR7cHJlZml4fS8ke3RoaXMuY29uc3RydWN0b3IuJG5hbWV9LyR7dGhpcy4kaWR9LyR7cmVsYXRpb25zaGlwfWAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGF0YTogY2hpbGRQa2dzW2luZGV4XS5tYXAoKGNoaWxkUGtnKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBJTkNMVURFICAgIEFkZGluZyByZWxhdGlvbnNoaXAgZGF0YSAke0pTT04uc3RyaW5naWZ5KGNoaWxkUGtnKX1gKTtcbiAgICAgICAgICAgICAgLy8gY29uc3QgY2hpbGRQa2dOb0luY2x1ZGUgPSB7fTtcbiAgICAgICAgICAgICAgLy8gT2JqZWN0LmtleXMoY2hpbGRQa2cpLmZpbHRlcihrID0+IGsgIT09ICdpbmNsdWRlZCcpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgICAvLyAgIGNoaWxkUGtnTm9JbmNsdWRlW2tleV0gPSBjaGlsZFBrZ1trZXldO1xuICAgICAgICAgICAgICAvLyB9KTtcbiAgICAgICAgICAgICAgLy8gaW5jbHVkZWQucHVzaChjaGlsZFBrZ05vSW5jbHVkZSk7XG4gICAgICAgICAgICAgIC8vIGNoaWxkUGtnLmluY2x1ZGVkLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgLy8gICBpbmNsdWRlZC5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAvLyB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogY2hpbGRQa2cudHlwZSwgaWQ6IGNoaWxkUGtnLmlkIH07XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zb2xlLmxvZygnSU5DTFVERSBBc3NlbWJsaW5nIHBhY2thZ2UuLi4nKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiB0aGlzLmNvbnN0cnVjdG9yLiRuYW1lLFxuICAgICAgICAgIGlkOiB0aGlzLiRpZCxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiBhdHRyaWJ1dGVzLFxuICAgICAgICAgIHJlbGF0aW9uc2hpcHM6IHJlbGF0aW9uc2hpcHMsXG4gICAgICAgICAgbGlua3M6IHtcbiAgICAgICAgICAgIHNlbGY6IGAke3ByZWZpeH0vJHt0aGlzLmNvbnN0cnVjdG9yLiRuYW1lfS8ke3RoaXMuJGlkfWAsXG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgJHBhY2thZ2Uob3B0cykge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIGRvbWFpbjogJ2h0dHBzOi8vZXhhbXBsZS5jb20nLFxuICAgICAgICBhcGlQYXRoOiAnL2FwaScsXG4gICAgICB9LFxuICAgICAgb3B0c1xuICAgICk7XG4gICAgY29uc3QgcHJlZml4ID0gYCR7b3B0aW9ucy5kb21haW59JHtvcHRpb25zLmFwaVBhdGh9YDtcblxuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgdGhpcy4kZ2V0KCRzZWxmKSxcbiAgICAgIHRoaXMuJHJlbGF0aW9uc2hpcHNKU09OLFxuICAgICAgdGhpcy4kaW5jbHVkZWRKU09OLFxuICAgIF0pLnRoZW4oKFthdHRyaWJ1dGVzLCByZWxhdGlvbnNoaXBzLCBpbmNsdWRlZF0pID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxpbmtzOiB7IHNlbGY6IGAke3ByZWZpeH0ke3RoaXMuJHBhdGh9YCB9LFxuICAgICAgICBkYXRhOiB7IHR5cGU6IHRoaXMuJG5hbWUsIGlkOiB0aGlzLiRpZCB9LFxuICAgICAgICBhdHRyaWJ1dGVzOiBhdHRyaWJ1dGVzLFxuICAgICAgICByZWxhdGlvbnNoaXBzOiByZWxhdGlvbnNoaXBzLFxuICAgICAgICBpbmNsdWRlZDogaW5jbHVkZWQsXG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0ICRyZWxhdGlvbnNoaXBzSlNPTigpIHtcbiAgICByZXR1cm4ge307XG4gIH1cblxuICBnZXQgJGluY2x1ZGVkSlNPTigpIHtcbiAgICByZXR1cm4ge307XG4gIH1cblxuICAvLyBjb25zb2xlLmxvZygnSW5mbGF0aW5nLi4uJyk7XG4gIC8vIHJldHVybiB0aGlzLiRnZXQoXG4gIC8vICAgdGhpcy5jb25zdHJ1Y3Rvci4kcGFja2FnZUluY2x1ZGVzLmNvbmNhdCgkc2VsZilcbiAgLy8gKVxuICAvLyAudGhlbigoaW5mbGF0ZWQpID0+IHtcbiAgLy8gICBjb25zb2xlLmxvZygnSW5mbGF0ZWQuJyk7XG4gIC8vICAgY29uc29sZS5sb2coJ1BhY2thZ2luZyBjaGlsZHJlbi4uLicpO1xuICAvLyAgIHJldHVybiBCbHVlYmlyZC5hbGwoXG4gIC8vICAgICB0aGlzLmNvbnN0cnVjdG9yLiRwYWNrYWdlSW5jbHVkZXMubWFwKChyZWxhdGlvbnNoaXApID0+IHtcbiAgLy8gICAgICAgY29uc29sZS5sb2coYCAgUGFja2FnaW5nICR7cmVsYXRpb25zaGlwfS4uLmApO1xuICAvLyAgICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFxuICAvLyAgICAgICAgIGluZmxhdGVkW3JlbGF0aW9uc2hpcF0ubWFwKChyZWwpID0+IHtcbiAgLy8gICAgICAgICAgIGNvbnN0IG90aGVyU2lkZSA9IHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tyZWxhdGlvbnNoaXBdLnJlbGF0aW9uc2hpcC4kc2lkZXNbcmVsYXRpb25zaGlwXS5vdGhlcjtcbiAgLy8gICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAgUGFja2FnaW5nIGNoaWxkICR7dGhpc1skcGx1bXBdLmZpbmQob3RoZXJTaWRlLnR5cGUsIHJlbFtvdGhlclNpZGUuZmllbGRdKS4kaWR9Li4uYCk7XG4gIC8vICAgICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLmZpbmQoXG4gIC8vICAgICAgICAgICAgIG90aGVyU2lkZS50eXBlLFxuICAvLyAgICAgICAgICAgICByZWxbb3RoZXJTaWRlLmZpZWxkXVxuICAvLyAgICAgICAgICAgKS4kJHBhY2thZ2VGb3JJbmNsdXNpb24oKTtcbiAgLy8gICAgICAgICB9KVxuICAvLyAgICAgICApO1xuICAvLyAgICAgfSlcbiAgLy8gICApLnRoZW4oKGNoaWxkUGtncykgPT4ge1xuICAvLyAgICAgY29uc29sZS5sb2coJ0NoaWxkcmVuIHBhY2thZ2VkLi4uJyk7XG4gIC8vICAgICBjb25zdCBhdHRyaWJ1dGVzID0ge307XG4gIC8vICAgICBPYmplY3Qua2V5cyhpbmZsYXRlZCkuZmlsdGVyKGsgPT4gayAhPT0gJ2lkJyAmJiAodGhpcy5jb25zdHJ1Y3Rvci4kcGFja2FnZUluY2x1ZGVzLmluZGV4T2YoaykgPCAwKSlcbiAgLy8gICAgIC5mb3JFYWNoKChhdHRyaWJ1dGUpID0+IHtcbiAgLy8gICAgICAgYXR0cmlidXRlc1thdHRyaWJ1dGVdID0gaW5mbGF0ZWRbYXR0cmlidXRlXTtcbiAgLy8gICAgIH0pO1xuICAvL1xuICAvLyAgICAgY29uc3QgaW5jbHVkZWQgPSBbXTtcbiAgLy8gICAgIGNvbnN0IHJlbGF0aW9uc2hpcHMgPSB7fTtcbiAgLy8gICAgIHRoaXMuY29uc3RydWN0b3IuJHBhY2thZ2VJbmNsdWRlcy5mb3JFYWNoKChyZWxhdGlvbnNoaXAsIGluZGV4KSA9PiB7XG4gIC8vICAgICAgIGNvbnNvbGUubG9nKGAgIEJ1aWxkaW5nICR7cmVsYXRpb25zaGlwfSByZWxhdGlvbnNoaXAuLi5gKVxuICAvLyAgICAgICByZWxhdGlvbnNoaXBzW3JlbGF0aW9uc2hpcF0gPSB7XG4gIC8vICAgICAgICAgbGlua3M6IHtcbiAgLy8gICAgICAgICAgIHJlbGF0ZWQ6IGAke3ByZWZpeH0vJHt0aGlzLmNvbnN0cnVjdG9yLiRuYW1lfS8ke3RoaXMuJGlkfS8ke3JlbGF0aW9uc2hpcH1gLFxuICAvLyAgICAgICAgIH0sXG4gIC8vICAgICAgICAgZGF0YTogY2hpbGRQa2dzW2luZGV4XS5tYXAoKGNoaWxkUGtnKSA9PiB7XG4gIC8vICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgQWRkaW5nIHJlbGF0aW9uc2hpcCBkYXRhICR7Y2hpbGRQa2d9Li4uYCk7XG4gIC8vICAgICAgICAgICBjb25zdCBjaGlsZFBrZ05vSW5jbHVkZSA9IHt9O1xuICAvLyAgICAgICAgICAgT2JqZWN0LmtleXMoY2hpbGRQa2cpLmZpbHRlcihrID0+IGsgIT09ICdpbmNsdWRlZCcpLmZvckVhY2goKGtleSkgPT4ge1xuICAvLyAgICAgICAgICAgICBjaGlsZFBrZ05vSW5jbHVkZVtrZXldID0gY2hpbGRQa2dba2V5XTtcbiAgLy8gICAgICAgICAgIH0pO1xuICAvLyAgICAgICAgICAgaW5jbHVkZWQucHVzaChjaGlsZFBrZ05vSW5jbHVkZSk7XG4gIC8vICAgICAgICAgICAvLyBjaGlsZFBrZy5pbmNsdWRlZC5mb3JFYWNoKChpdGVtKSA9PiB7XG4gIC8vICAgICAgICAgICAvLyAgIGluY2x1ZGVkLnB1c2goaXRlbSk7XG4gIC8vICAgICAgICAgICAvLyB9KTtcbiAgLy8gICAgICAgICAgIHJldHVybiB7IHR5cGU6IGNoaWxkUGtnLnR5cGUsIGlkOiBjaGlsZFBrZy5pZCB9O1xuICAvLyAgICAgICAgIH0pLFxuICAvLyAgICAgICB9O1xuICAvLyAgICAgfSk7XG4gIC8vXG4gIC8vICAgICBjb25zb2xlLmxvZygnQnVpbGRpbmcgcGFja2FnZS4uLicpO1xuICAvLyAgICAgY29uc3QgcGtnID0ge1xuICAvLyAgICAgICBsaW5rczoge1xuICAvLyAgICAgICAgIHNlbGY6IGAke3ByZWZpeH0vJHt0aGlzLmNvbnN0cnVjdG9yLiRuYW1lfS8ke3RoaXMuJGlkfWAsXG4gIC8vICAgICAgIH0sXG4gIC8vICAgICAgIGRhdGE6IHtcbiAgLy8gICAgICAgICB0eXBlOiB0aGlzLmNvbnN0cnVjdG9yLiRuYW1lLFxuICAvLyAgICAgICAgIGlkOiB0aGlzLiRpZCxcbiAgLy8gICAgICAgfSxcbiAgLy8gICAgICAgYXR0cmlidXRlczogYXR0cmlidXRlcyxcbiAgLy8gICAgICAgcmVsYXRpb25zaGlwczogcmVsYXRpb25zaGlwcyxcbiAgLy8gICAgICAgaW5jbHVkZWQ6IGluY2x1ZGVkLFxuICAvLyAgICAgfTtcbiAgLy9cbiAgLy8gICAgIHJldHVybiBwa2c7XG4gIC8vICAgfSk7XG4gIC8vIH0pO1xuXG4gIC8vIFRPRE86IGRvbid0IGZldGNoIGlmIHdlICRnZXQoKSBzb21ldGhpbmcgdGhhdCB3ZSBhbHJlYWR5IGhhdmVcblxuICAkZ2V0KG9wdHMpIHtcbiAgICBsZXQga2V5cyA9IFskc2VsZl07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkob3B0cykpIHtcbiAgICAgIGtleXMgPSBvcHRzO1xuICAgIH0gZWxzZSBpZiAob3B0cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAob3B0cyA9PT0gJGFsbCkge1xuICAgICAgICBrZXlzID0gT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKVxuICAgICAgICAuZmlsdGVyKChrZXkpID0+IHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55JylcbiAgICAgICAgLmNvbmNhdCgkc2VsZik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBrZXlzID0gW29wdHNdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKGtleXMubWFwKChrZXkpID0+IHRoaXMuJCRzaW5nbGVHZXQoa2V5KSkpXG4gICAgLnRoZW4oKHZhbHVlQXJyYXkpID0+IHtcbiAgICAgIGNvbnN0IHNlbGZJZHggPSBrZXlzLmluZGV4T2YoJHNlbGYpO1xuICAgICAgaWYgKChzZWxmSWR4ID49IDApICYmICh2YWx1ZUFycmF5W3NlbGZJZHhdID09PSBudWxsKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB2YWx1ZUFycmF5LnJlZHVjZSgoYWNjdW0sIGN1cnIpID0+IE9iamVjdC5hc3NpZ24oYWNjdW0sIGN1cnIpLCB7fSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAkJHNpbmdsZUdldChvcHQgPSAkc2VsZikge1xuICAgIC8vIHRocmVlIGNhc2VzLlxuICAgIC8vIGtleSA9PT0gdW5kZWZpbmVkIC0gZmV0Y2ggYWxsLCB1bmxlc3MgJGxvYWRlZCwgYnV0IHJldHVybiBhbGwuXG4gICAgLy8gZmllbGRzW2tleV0gPT09ICdoYXNNYW55JyAtIGZldGNoIGNoaWxkcmVuIChwZXJoYXBzIG1vdmUgdGhpcyBkZWNpc2lvbiB0byBzdG9yZSlcbiAgICAvLyBvdGhlcndpc2UgLSBmZXRjaCBhbGwsIHVubGVzcyAkc3RvcmVba2V5XSwgcmV0dXJuICRzdG9yZVtrZXldLlxuICAgIGxldCBrZXk7XG4gICAgaWYgKChvcHQgIT09ICRzZWxmKSAmJiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW29wdF0udHlwZSAhPT0gJ2hhc01hbnknKSkge1xuICAgICAga2V5ID0gJHNlbGY7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtleSA9IG9wdDtcbiAgICB9XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmIChrZXkgPT09ICRzZWxmKSB7XG4gICAgICAgIGlmICh0aGlzWyRsb2FkZWRdWyRzZWxmXSA9PT0gZmFsc2UgJiYgdGhpc1skcGx1bXBdKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5nZXQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICgodGhpc1skbG9hZGVkXVtrZXldID09PSBmYWxzZSkgJiYgdGhpc1skcGx1bXBdKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbG9uZWx5LWlmXG4gICAgICAgICAgcmV0dXJuIHRoaXMuJHJlbGF0aW9uc2hpcHNba2V5XS4kbGlzdCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkudGhlbigodikgPT4ge1xuICAgICAgaWYgKHYgPT09IHRydWUpIHtcbiAgICAgICAgaWYgKGtleSA9PT0gJHNlbGYpIHtcbiAgICAgICAgICBjb25zdCByZXRWYWwgPSB7fTtcbiAgICAgICAgICBmb3IgKGNvbnN0IGsgaW4gdGhpc1skc3RvcmVdKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tdLnR5cGUgIT09ICdoYXNNYW55Jykge1xuICAgICAgICAgICAgICByZXRWYWxba10gPSB0aGlzWyRzdG9yZV1ba107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXRWYWw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHsgW2tleV06IHRoaXNbJHN0b3JlXVtrZXldIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHYgJiYgKHZbJHNlbGZdICE9PSBudWxsKSkge1xuICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odik7XG4gICAgICAgIHRoaXNbJGxvYWRlZF1ba2V5XSA9IHRydWU7XG4gICAgICAgIGlmIChrZXkgPT09ICRzZWxmKSB7XG4gICAgICAgICAgY29uc3QgcmV0VmFsID0ge307XG4gICAgICAgICAgZm9yIChjb25zdCBrIGluIHRoaXNbJHN0b3JlXSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trXS50eXBlICE9PSAnaGFzTWFueScpIHtcbiAgICAgICAgICAgICAgcmV0VmFsW2tdID0gdGhpc1skc3RvcmVdW2tdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmV0VmFsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCB7IFtrZXldOiB0aGlzWyRzdG9yZV1ba2V5XSB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAkc2F2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy4kc2V0KCk7XG4gIH1cblxuICAkc2V0KHUgPSB0aGlzWyRzdG9yZV0pIHtcbiAgICBjb25zdCB1cGRhdGUgPSBtZXJnZU9wdGlvbnMoe30sIHRoaXNbJHN0b3JlXSwgdSk7XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgZGVsZXRlIHVwZGF0ZVtrZXldO1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8vIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh1cGRhdGUpOyAvLyB0aGlzIGlzIHRoZSBvcHRpbWlzdGljIHVwZGF0ZTtcbiAgICByZXR1cm4gdGhpc1skcGx1bXBdLnNhdmUodGhpcy5jb25zdHJ1Y3RvciwgdXBkYXRlKVxuICAgIC50aGVuKCh1cGRhdGVkKSA9PiB7XG4gICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odXBkYXRlZCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9KTtcbiAgfVxuXG4gICRkZWxldGUoKSB7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5kZWxldGUodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQpO1xuICB9XG5cbiAgJHJlc3Qob3B0cykge1xuICAgIGNvbnN0IHJlc3RPcHRzID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAgb3B0cyxcbiAgICAgIHtcbiAgICAgICAgdXJsOiBgLyR7dGhpcy5jb25zdHJ1Y3Rvci4kbmFtZX0vJHt0aGlzLiRpZH0vJHtvcHRzLnVybH1gLFxuICAgICAgfVxuICAgICk7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5yZXN0UmVxdWVzdChyZXN0T3B0cyk7XG4gIH1cblxuICAkYWRkKGtleSwgaXRlbSwgZXh0cmFzKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgbGV0IGlkID0gMDtcbiAgICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIGlkID0gaXRlbTtcbiAgICAgICAgfSBlbHNlIGlmIChpdGVtLiRpZCkge1xuICAgICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWQgPSBpdGVtW3RoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnJlbGF0aW9uc2hpcC4kc2lkZXNba2V5XS5vdGhlci5maWVsZF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skcGx1bXBdLmFkZCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpZCwgZXh0cmFzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpKTtcbiAgICAgIH1cbiAgICB9KS50aGVuKChsKSA9PiB7XG4gICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20oeyBba2V5XTogbCB9KTtcbiAgICAgIHJldHVybiBsO1xuICAgIH0pO1xuICB9XG5cbiAgJG1vZGlmeVJlbGF0aW9uc2hpcChrZXksIGl0ZW0sIGV4dHJhcykge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICB0aGlzWyRzdG9yZV1ba2V5XSA9IFtdO1xuICAgICAgICB0aGlzWyRsb2FkZWRdW2tleV0gPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5tb2RpZnlSZWxhdGlvbnNoaXAodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaWQsIGV4dHJhcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkcmVtb3ZlKGtleSwgaXRlbSkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICB0aGlzWyRzdG9yZV1ba2V5XSA9IFtdO1xuICAgICAgICB0aGlzWyRsb2FkZWRdW2tleV0gPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5yZW1vdmUodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSAkcmVtb3ZlZCBmcm9tIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJHJlbW92ZSBleGNlcHQgZnJvbSBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICR0ZWFyZG93bigpIHtcbiAgICBpZiAodGhpc1skdW5zdWJzY3JpYmVdKSB7XG4gICAgICB0aGlzWyR1bnN1YnNjcmliZV0udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cbn1cblxuTW9kZWwuZnJvbUpTT04gPSBmdW5jdGlvbiBmcm9tSlNPTihqc29uKSB7XG4gIHRoaXMuJGlkID0ganNvbi4kaWQgfHwgJ2lkJztcbiAgdGhpcy4kbmFtZSA9IGpzb24uJG5hbWU7XG4gIHRoaXMuJGZpZWxkcyA9IHt9O1xuICBPYmplY3Qua2V5cyhqc29uLiRmaWVsZHMpLmZvckVhY2goKGspID0+IHtcbiAgICBjb25zdCBmaWVsZCA9IGpzb24uJGZpZWxkc1trXTtcbiAgICBpZiAoZmllbGQudHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBjbGFzcyBEeW5hbWljUmVsYXRpb25zaGlwIGV4dGVuZHMgUmVsYXRpb25zaGlwIHt9XG4gICAgICBEeW5hbWljUmVsYXRpb25zaGlwLmZyb21KU09OKGZpZWxkLnJlbGF0aW9uc2hpcCk7XG4gICAgICB0aGlzLiRmaWVsZHNba10gPSB7XG4gICAgICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICAgICAgcmVsYXRpb25zaGlwOiBEeW5hbWljUmVsYXRpb25zaGlwLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kZmllbGRzW2tdID0gT2JqZWN0LmFzc2lnbih7fSwgZmllbGQpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5Nb2RlbC50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04oKSB7XG4gIGNvbnN0IHJldFZhbCA9IHtcbiAgICAkaWQ6IHRoaXMuJGlkLFxuICAgICRuYW1lOiB0aGlzLiRuYW1lLFxuICAgICRmaWVsZHM6IHt9LFxuICB9O1xuICBjb25zdCBmaWVsZE5hbWVzID0gT2JqZWN0LmtleXModGhpcy4kZmllbGRzKTtcbiAgZmllbGROYW1lcy5mb3JFYWNoKChrKSA9PiB7XG4gICAgaWYgKHRoaXMuJGZpZWxkc1trXS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIHJldFZhbC4kZmllbGRzW2tdID0ge1xuICAgICAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgICAgIHJlbGF0aW9uc2hpcDogdGhpcy4kZmllbGRzW2tdLnJlbGF0aW9uc2hpcC50b0pTT04oKSxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldFZhbC4kZmllbGRzW2tdID0gdGhpcy4kZmllbGRzW2tdO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZXRWYWw7XG59O1xuXG5Nb2RlbC4kcmVzdCA9IGZ1bmN0aW9uICRyZXN0KHBsdW1wLCBvcHRzKSB7XG4gIGNvbnN0IHJlc3RPcHRzID0gT2JqZWN0LmFzc2lnbihcbiAgICB7fSxcbiAgICBvcHRzLFxuICAgIHtcbiAgICAgIHVybDogYC8ke3RoaXMuJG5hbWV9LyR7b3B0cy51cmx9YCxcbiAgICB9XG4gICk7XG4gIHJldHVybiBwbHVtcC5yZXN0UmVxdWVzdChyZXN0T3B0cyk7XG59O1xuXG5Nb2RlbC5hc3NpZ24gPSBmdW5jdGlvbiBhc3NpZ24ob3B0cykge1xuICBjb25zdCBzdGFydCA9IHt9O1xuICBPYmplY3Qua2V5cyh0aGlzLiRmaWVsZHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgIGlmIChvcHRzW2tleV0pIHtcbiAgICAgIHN0YXJ0W2tleV0gPSBvcHRzW2tleV07XG4gICAgfSBlbHNlIGlmICh0aGlzLiRmaWVsZHNba2V5XS5kZWZhdWx0KSB7XG4gICAgICBzdGFydFtrZXldID0gdGhpcy4kZmllbGRzW2tleV0uZGVmYXVsdDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgc3RhcnRba2V5XSA9IFtdO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGFydFtrZXldID0gbnVsbDtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gc3RhcnQ7XG59O1xuXG5Nb2RlbC4kaWQgPSAnaWQnO1xuTW9kZWwuJG5hbWUgPSAnQmFzZSc7XG5Nb2RlbC4kc2VsZiA9ICRzZWxmO1xuTW9kZWwuJGZpZWxkcyA9IHtcbiAgaWQ6IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbn07XG4iXX0=
