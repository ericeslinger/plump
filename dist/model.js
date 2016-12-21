'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Model = undefined;

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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $store = Symbol('$store');
var $plump = Symbol('$plump');
var $loaded = Symbol('$loaded');
var $unsubscribe = Symbol('$unsubscribe');
var $subject = Symbol('$subject');

// TODO: figure out where error events originate (storage or model)
// and who keeps a roll-backable delta

var Model = exports.Model = function () {
  function Model(opts, plump) {
    var _this = this;

    _classCallCheck(this, Model);

    this[$store] = {};
    this[$loaded] = false;
    this.$relationships = {};
    this[$subject] = new _Rx.BehaviorSubject();
    Object.keys(this.constructor.$fields).forEach(function (key) {
      if (_this.constructor.$fields[key].type === 'hasMany') {
        var Rel = _this.constructor.$fields[key].relationship;
        _this.$relationships[key] = new Rel(_this, key, plump);
      }
    });
    this.$$copyValuesFrom(opts || {});
    if (plump) {
      this.$$connectToPlump(plump);
    }
  }

  _createClass(Model, [{
    key: '$$connectToPlump',
    value: function $$connectToPlump(plump) {
      var _this2 = this;

      this[$plump] = plump;
      this[$unsubscribe] = plump.subscribe(this.constructor.$name, this.$id, function (v) {
        _this2.$$copyValuesFrom(v);
      });
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
          } else if (_this3.constructor.$fields[fieldName].type === 'object') {
            _this3[$store][fieldName] = Object.assign({}, opts[fieldName]);
          } else {
            _this3[$store][fieldName] = opts[fieldName];
          }
        }
      });
      this[$subject].next(this[$store]);
    }
  }, {
    key: '$subscribe',
    value: function $subscribe(l) {
      return this[$subject].subscribe(l);
    }

    // TODO: don't fetch if we $get() something that we already have

  }, {
    key: '$get',
    value: function $get(key) {
      var _this4 = this;

      // three cases.
      // key === undefined - fetch all, unless $loaded, but return all.
      // fields[key] === 'hasMany' - fetch children (perhaps move this decision to store)
      // otherwise - fetch all, unless $store[key], return $store[key].

      return _bluebird2.default.resolve().then(function () {
        if (key === undefined && _this4[$loaded] === false || key && _this4[$store][key] === undefined) {
          if (_this4.$relationships[key]) {
            return _this4.$relationships[key].$list();
          }
          return _this4[$plump].get(_this4.constructor, _this4.$id, key);
        } else {
          return true;
        }
      }).then(function (v) {
        if (v === true) {
          if (key) {
            return _this4[$store][key];
          } else {
            return Object.assign({}, _this4[$store]);
          }
        } else if (v) {
          _this4.$$copyValuesFrom(v);
          _this4[$loaded] = true;
          if (key) {
            return _this4[$store][key];
          } else {
            return Object.assign({}, _this4[$store]);
          }
        } else {
          return null;
        }
      });
    }
  }, {
    key: '$load',
    value: function $load() {
      var _this5 = this;

      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var options = Object.assign({}, { self: true }, opts);
      if (options.self) {
        this.getSelf().then(function (data) {
          _this5.$$copyValuesFrom(data);
          return _this5;
        });
      }
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
      this.$$copyValuesFrom(update); // this is the optimistic update;
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
          delete this[$store][key];
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
          delete this[$store][key];
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
      this[$unsubscribe].unsubscribe();
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

Model.$id = 'id';
Model.$name = 'Base';
Model.$fields = {
  id: {
    type: 'number'
  }
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRzdG9yZSIsIlN5bWJvbCIsIiRwbHVtcCIsIiRsb2FkZWQiLCIkdW5zdWJzY3JpYmUiLCIkc3ViamVjdCIsIk1vZGVsIiwib3B0cyIsInBsdW1wIiwiJHJlbGF0aW9uc2hpcHMiLCJPYmplY3QiLCJrZXlzIiwiY29uc3RydWN0b3IiLCIkZmllbGRzIiwiZm9yRWFjaCIsImtleSIsInR5cGUiLCJSZWwiLCJyZWxhdGlvbnNoaXAiLCIkJGNvcHlWYWx1ZXNGcm9tIiwiJCRjb25uZWN0VG9QbHVtcCIsInN1YnNjcmliZSIsIiRuYW1lIiwiJGlkIiwidiIsImZpZWxkTmFtZSIsInVuZGVmaW5lZCIsImNvbmNhdCIsImFzc2lnbiIsIm5leHQiLCJsIiwicmVzb2x2ZSIsInRoZW4iLCIkbGlzdCIsImdldCIsIm9wdGlvbnMiLCJzZWxmIiwiZ2V0U2VsZiIsImRhdGEiLCIkc2V0IiwidSIsInVwZGF0ZSIsInNhdmUiLCJ1cGRhdGVkIiwiZGVsZXRlIiwicmVzdE9wdHMiLCJ1cmwiLCJyZXN0UmVxdWVzdCIsIml0ZW0iLCJleHRyYXMiLCJpZCIsIiRzaWRlcyIsIm90aGVyIiwiZmllbGQiLCJhZGQiLCJyZWplY3QiLCJFcnJvciIsIm1vZGlmeVJlbGF0aW9uc2hpcCIsInJlbW92ZSIsInVuc3Vic2NyaWJlIiwiZnJvbUpTT04iLCJqc29uIiwiayIsIkR5bmFtaWNSZWxhdGlvbnNoaXAiLCJ0b0pTT04iLCJyZXRWYWwiLCJmaWVsZE5hbWVzIiwiJHJlc3QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7OztBQUNBLElBQU1BLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUMsU0FBU0QsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNRSxVQUFVRixPQUFPLFNBQVAsQ0FBaEI7QUFDQSxJQUFNRyxlQUFlSCxPQUFPLGNBQVAsQ0FBckI7QUFDQSxJQUFNSSxXQUFXSixPQUFP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c291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IFJlbGF0aW9uc2hpcCB9IGZyb20gJy4vcmVsYXRpb25zaGlwJztcbmltcG9ydCBtZXJnZU9wdGlvbnMgZnJvbSAnbWVyZ2Utb3B0aW9ucyc7XG5pbXBvcnQgeyBCZWhhdmlvclN1YmplY3QgfSBmcm9tICdyeGpzL1J4JztcbmNvbnN0ICRzdG9yZSA9IFN5bWJvbCgnJHN0b3JlJyk7XG5jb25zdCAkcGx1bXAgPSBTeW1ib2woJyRwbHVtcCcpO1xuY29uc3QgJGxvYWRlZCA9IFN5bWJvbCgnJGxvYWRlZCcpO1xuY29uc3QgJHVuc3Vic2NyaWJlID0gU3ltYm9sKCckdW5zdWJzY3JpYmUnKTtcbmNvbnN0ICRzdWJqZWN0ID0gU3ltYm9sKCckc3ViamVjdCcpO1xuXG4vLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIGVycm9yIGV2ZW50cyBvcmlnaW5hdGUgKHN0b3JhZ2Ugb3IgbW9kZWwpXG4vLyBhbmQgd2hvIGtlZXBzIGEgcm9sbC1iYWNrYWJsZSBkZWx0YVxuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzLCBwbHVtcCkge1xuICAgIHRoaXNbJHN0b3JlXSA9IHt9O1xuICAgIHRoaXNbJGxvYWRlZF0gPSBmYWxzZTtcbiAgICB0aGlzLiRyZWxhdGlvbnNoaXBzID0ge307XG4gICAgdGhpc1skc3ViamVjdF0gPSBuZXcgQmVoYXZpb3JTdWJqZWN0KCk7XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgY29uc3QgUmVsID0gdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0ucmVsYXRpb25zaGlwO1xuICAgICAgICB0aGlzLiRyZWxhdGlvbnNoaXBzW2tleV0gPSBuZXcgUmVsKHRoaXMsIGtleSwgcGx1bXApO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbShvcHRzIHx8IHt9KTtcbiAgICBpZiAocGx1bXApIHtcbiAgICAgIHRoaXMuJCRjb25uZWN0VG9QbHVtcChwbHVtcCk7XG4gICAgfVxuICB9XG5cbiAgJCRjb25uZWN0VG9QbHVtcChwbHVtcCkge1xuICAgIHRoaXNbJHBsdW1wXSA9IHBsdW1wO1xuICAgIHRoaXNbJHVuc3Vic2NyaWJlXSA9IHBsdW1wLnN1YnNjcmliZSh0aGlzLmNvbnN0cnVjdG9yLiRuYW1lLCB0aGlzLiRpZCwgKHYpID0+IHtcbiAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldCAkbmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci4kbmFtZTtcbiAgfVxuXG4gIGdldCAkaWQoKSB7XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JlXVt0aGlzLmNvbnN0cnVjdG9yLiRpZF07XG4gIH1cblxuICAkJGNvcHlWYWx1ZXNGcm9tKG9wdHMgPSB7fSkge1xuICAgIE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkcykuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICBpZiAob3B0c1tmaWVsZE5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gY29weSBmcm9tIG9wdHMgdG8gdGhlIGJlc3Qgb2Ygb3VyIGFiaWxpdHlcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnYXJyYXknKSB8fFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnaGFzTWFueScpXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gKG9wdHNbZmllbGROYW1lXSB8fCBbXSkuY29uY2F0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IE9iamVjdC5hc3NpZ24oe30sIG9wdHNbZmllbGROYW1lXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBvcHRzW2ZpZWxkTmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzWyRzdWJqZWN0XS5uZXh0KHRoaXNbJHN0b3JlXSk7XG4gIH1cblxuICAkc3Vic2NyaWJlKGwpIHtcbiAgICByZXR1cm4gdGhpc1skc3ViamVjdF0uc3Vic2NyaWJlKGwpO1xuICB9XG5cbiAgLy8gVE9ETzogZG9uJ3QgZmV0Y2ggaWYgd2UgJGdldCgpIHNvbWV0aGluZyB0aGF0IHdlIGFscmVhZHkgaGF2ZVxuXG4gICRnZXQoa2V5KSB7XG4gICAgLy8gdGhyZWUgY2FzZXMuXG4gICAgLy8ga2V5ID09PSB1bmRlZmluZWQgLSBmZXRjaCBhbGwsIHVubGVzcyAkbG9hZGVkLCBidXQgcmV0dXJuIGFsbC5cbiAgICAvLyBmaWVsZHNba2V5XSA9PT0gJ2hhc01hbnknIC0gZmV0Y2ggY2hpbGRyZW4gKHBlcmhhcHMgbW92ZSB0aGlzIGRlY2lzaW9uIHRvIHN0b3JlKVxuICAgIC8vIG90aGVyd2lzZSAtIGZldGNoIGFsbCwgdW5sZXNzICRzdG9yZVtrZXldLCByZXR1cm4gJHN0b3JlW2tleV0uXG5cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKFxuICAgICAgICAoKGtleSA9PT0gdW5kZWZpbmVkKSAmJiAodGhpc1skbG9hZGVkXSA9PT0gZmFsc2UpKSB8fFxuICAgICAgICAoa2V5ICYmICh0aGlzWyRzdG9yZV1ba2V5XSA9PT0gdW5kZWZpbmVkKSlcbiAgICAgICkge1xuICAgICAgICBpZiAodGhpcy4kcmVsYXRpb25zaGlwc1trZXldKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuJHJlbGF0aW9uc2hpcHNba2V5XS4kbGlzdCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZ2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfSkudGhlbigodikgPT4ge1xuICAgICAgaWYgKHYgPT09IHRydWUpIHtcbiAgICAgICAgaWYgKGtleSkge1xuICAgICAgICAgIHJldHVybiB0aGlzWyRzdG9yZV1ba2V5XTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgdGhpc1skc3RvcmVdKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh2KSB7XG4gICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KTtcbiAgICAgICAgdGhpc1skbG9hZGVkXSA9IHRydWU7XG4gICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skc3RvcmVdW2tleV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXNbJHN0b3JlXSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgJGxvYWQob3B0cyA9IHt9KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIHsgc2VsZjogdHJ1ZSB9LCBvcHRzKTtcbiAgICBpZiAob3B0aW9ucy5zZWxmKSB7XG4gICAgICB0aGlzLmdldFNlbGYoKVxuICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKGRhdGEpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gICRzYXZlKCkge1xuICAgIHJldHVybiB0aGlzLiRzZXQoKTtcbiAgfVxuXG4gICRzZXQodSA9IHRoaXNbJHN0b3JlXSkge1xuICAgIGNvbnN0IHVwZGF0ZSA9IG1lcmdlT3B0aW9ucyh7fSwgdGhpc1skc3RvcmVdLCB1KTtcbiAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odXBkYXRlKTsgLy8gdGhpcyBpcyB0aGUgb3B0aW1pc3RpYyB1cGRhdGU7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5zYXZlKHRoaXMuY29uc3RydWN0b3IsIHVwZGF0ZSlcbiAgICAudGhlbigodXBkYXRlZCkgPT4ge1xuICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHVwZGF0ZWQpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSk7XG4gIH1cblxuICAkZGVsZXRlKCkge1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZGVsZXRlKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkKTtcbiAgfVxuXG4gICRyZXN0KG9wdHMpIHtcbiAgICBjb25zdCByZXN0T3B0cyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIG9wdHMsXG4gICAgICB7XG4gICAgICAgIHVybDogYC8ke3RoaXMuY29uc3RydWN0b3IuJG5hbWV9LyR7dGhpcy4kaWR9LyR7b3B0cy51cmx9YCxcbiAgICAgIH1cbiAgICApO1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0ucmVzdFJlcXVlc3QocmVzdE9wdHMpO1xuICB9XG5cbiAgJGFkZChrZXksIGl0ZW0sIGV4dHJhcykge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSBpZiAoaXRlbS4kaWQpIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbVt0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS5yZWxhdGlvbnNoaXAuJHNpZGVzW2tleV0ub3RoZXIuZmllbGRdO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5hZGQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaWQsIGV4dHJhcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkbW9kaWZ5UmVsYXRpb25zaGlwKGtleSwgaXRlbSwgZXh0cmFzKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzWyRzdG9yZV1ba2V5XTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5tb2RpZnlSZWxhdGlvbnNoaXAodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaWQsIGV4dHJhcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkcmVtb3ZlKGtleSwgaXRlbSkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICBkZWxldGUgdGhpc1skc3RvcmVdW2tleV07XG4gICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0ucmVtb3ZlKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gJHJlbW92ZWQgZnJvbSBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRyZW1vdmUgZXhjZXB0IGZyb20gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkdGVhcmRvd24oKSB7XG4gICAgdGhpc1skdW5zdWJzY3JpYmVdLnVuc3Vic2NyaWJlKCk7XG4gIH1cbn1cblxuTW9kZWwuZnJvbUpTT04gPSBmdW5jdGlvbiBmcm9tSlNPTihqc29uKSB7XG4gIHRoaXMuJGlkID0ganNvbi4kaWQgfHwgJ2lkJztcbiAgdGhpcy4kbmFtZSA9IGpzb24uJG5hbWU7XG4gIHRoaXMuJGZpZWxkcyA9IHt9O1xuICBPYmplY3Qua2V5cyhqc29uLiRmaWVsZHMpLmZvckVhY2goKGspID0+IHtcbiAgICBjb25zdCBmaWVsZCA9IGpzb24uJGZpZWxkc1trXTtcbiAgICBpZiAoZmllbGQudHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBjbGFzcyBEeW5hbWljUmVsYXRpb25zaGlwIGV4dGVuZHMgUmVsYXRpb25zaGlwIHt9XG4gICAgICBEeW5hbWljUmVsYXRpb25zaGlwLmZyb21KU09OKGZpZWxkLnJlbGF0aW9uc2hpcCk7XG4gICAgICB0aGlzLiRmaWVsZHNba10gPSB7XG4gICAgICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICAgICAgcmVsYXRpb25zaGlwOiBEeW5hbWljUmVsYXRpb25zaGlwLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kZmllbGRzW2tdID0gT2JqZWN0LmFzc2lnbih7fSwgZmllbGQpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5Nb2RlbC50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04oKSB7XG4gIGNvbnN0IHJldFZhbCA9IHtcbiAgICAkaWQ6IHRoaXMuJGlkLFxuICAgICRuYW1lOiB0aGlzLiRuYW1lLFxuICAgICRmaWVsZHM6IHt9LFxuICB9O1xuICBjb25zdCBmaWVsZE5hbWVzID0gT2JqZWN0LmtleXModGhpcy4kZmllbGRzKTtcbiAgZmllbGROYW1lcy5mb3JFYWNoKChrKSA9PiB7XG4gICAgaWYgKHRoaXMuJGZpZWxkc1trXS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIHJldFZhbC4kZmllbGRzW2tdID0ge1xuICAgICAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgICAgIHJlbGF0aW9uc2hpcDogdGhpcy4kZmllbGRzW2tdLnJlbGF0aW9uc2hpcC50b0pTT04oKSxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldFZhbC4kZmllbGRzW2tdID0gdGhpcy4kZmllbGRzW2tdO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZXRWYWw7XG59O1xuXG5Nb2RlbC4kcmVzdCA9IGZ1bmN0aW9uICRyZXN0KHBsdW1wLCBvcHRzKSB7XG4gIGNvbnN0IHJlc3RPcHRzID0gT2JqZWN0LmFzc2lnbihcbiAgICB7fSxcbiAgICBvcHRzLFxuICAgIHtcbiAgICAgIHVybDogYC8ke3RoaXMuJG5hbWV9LyR7b3B0cy51cmx9YCxcbiAgICB9XG4gICk7XG4gIHJldHVybiBwbHVtcC5yZXN0UmVxdWVzdChyZXN0T3B0cyk7XG59O1xuXG5Nb2RlbC4kaWQgPSAnaWQnO1xuTW9kZWwuJG5hbWUgPSAnQmFzZSc7XG5Nb2RlbC4kZmllbGRzID0ge1xuICBpZDoge1xuICAgIHR5cGU6ICdudW1iZXInLFxuICB9LFxufTtcbiJdfQ==
