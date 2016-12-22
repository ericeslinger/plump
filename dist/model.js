'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Model = exports.$self = undefined;

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

// TODO: figure out where error events originate (storage or model)
// and who keeps a roll-backable delta

var Model = exports.Model = function () {
  function Model(opts, plump) {
    var _this = this;

    _classCallCheck(this, Model);

    this[$store] = _defineProperty({}, $loaded, false);
    this.$relationships = {};
    this[$subject] = new _Rx.BehaviorSubject();
    Object.keys(this.constructor.$fields).forEach(function (key) {
      if (_this.constructor.$fields[key].type === 'hasMany') {
        var Rel = _this.constructor.$fields[key].relationship;
        _this.$relationships[key] = new Rel(_this, key, plump);
        _this[$store][key] = [];
        _this[$store][key][$loaded] = false;
      } else {
        _this[$store][key] = _this.constructor.$fields[key].default || null;
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
    }
  }, {
    key: '$subscribe',
    value: function $subscribe(l) {
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
      var _this4 = this;

      var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : $self;

      // three cases.
      // key === undefined - fetch all, unless $loaded, but return all.
      // fields[key] === 'hasMany' - fetch children (perhaps move this decision to store)
      // otherwise - fetch all, unless $store[key], return $store[key].

      return _bluebird2.default.resolve().then(function () {
        if (key === $self || _this4.constructor.$fields[key].type !== 'hasMany') {
          if (_this4[$store][$loaded] === false && _this4[$plump]) {
            return _this4[$plump].get(_this4.constructor, _this4.$id, key);
          } else {
            return true;
          }
        } else {
          if (_this4[$store][key][$loaded] === false && _this4[$plump]) {
            // eslint-disable-line no-lonely-if
            return _this4.$relationships[key].$list();
          } else {
            return true;
          }
        }
      }).then(function (v) {
        if (v === true) {
          if (key === $self) {
            return Object.assign({}, _this4[$store]);
          } else {
            return _this4[$store][key];
          }
        } else if (v) {
          _this4.$$copyValuesFrom(v);
          if (key === $self) {
            _this4[$store][$loaded] = true;
          } else if (_this4.constructor.$fields[key].type === 'hasMany') {
            _this4[$store][key][$loaded] = true;
          }
          if (key === $self) {
            return Object.assign({}, _this4[$store]);
          } else {
            return _this4[$store][key];
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
      var _this5 = this;

      var u = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this[$store];

      var update = (0, _mergeOptions2.default)({}, this[$store], u);
      this.$$copyValuesFrom(update); // this is the optimistic update;
      return this[$plump].save(this.constructor, update).then(function (updated) {
        _this5.$$copyValuesFrom(updated);
        return _this5;
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
  var _this7 = this;

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
      _this7.$fields[k] = {
        type: 'hasMany',
        relationship: DynamicRelationship
      };
    } else {
      _this7.$fields[k] = Object.assign({}, field);
    }
  });
};

Model.toJSON = function toJSON() {
  var _this8 = this;

  var retVal = {
    $id: this.$id,
    $name: this.$name,
    $fields: {}
  };
  var fieldNames = Object.keys(this.$fields);
  fieldNames.forEach(function (k) {
    if (_this8.$fields[k].type === 'hasMany') {
      retVal.$fields[k] = {
        type: 'hasMany',
        relationship: _this8.$fields[k].relationship.toJSON()
      };
    } else {
      retVal.$fields[k] = _this8.$fields[k];
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
  var _this9 = this;

  var start = {};
  Object.keys(this.$fields).forEach(function (key) {
    if (opts[key]) {
      start[key] = opts[key];
    } else if (_this9.$fields[key].default) {
      start[key] = _this9.$fields[key].default;
    } else if (_this9.$fields[key].type === 'hasMany') {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIiRzdG9yZSIsIlN5bWJvbCIsIiRwbHVtcCIsIiRsb2FkZWQiLCIkdW5zdWJzY3JpYmUiLCIkc3ViamVjdCIsIiRzZWxmIiwiTW9kZWwiLCJvcHRzIiwicGx1bXAiLCIkcmVsYXRpb25zaGlwcyIsIk9iamVjdCIsImtleXMiLCJjb25zdHJ1Y3RvciIsIiRmaWVsZHMiLCJmb3JFYWNoIiwia2V5IiwidHlwZSIsIlJlbCIsInJlbGF0aW9uc2hpcCIsImRlZmF1bHQiLCIkJGNvcHlWYWx1ZXNGcm9tIiwiJCRjb25uZWN0VG9QbHVtcCIsInN1YnNjcmliZSIsIiRuYW1lIiwiJGlkIiwidiIsImZpZWxkTmFtZSIsInVuZGVmaW5lZCIsImNvbmNhdCIsImFzc2lnbiIsImwiLCJuZXh0IiwicmVzb2x2ZSIsInRoZW4iLCJnZXQiLCIkbGlzdCIsIiRzZXQiLCJ1IiwidXBkYXRlIiwic2F2ZSIsInVwZGF0ZWQiLCJkZWxldGUiLCJyZXN0T3B0cyIsInVybCIsInJlc3RSZXF1ZXN0IiwiaXRlbSIsImV4dHJhcyIsImlkIiwiJHNpZGVzIiwib3RoZXIiLCJmaWVsZCIsImFkZCIsInJlamVjdCIsIkVycm9yIiwibW9kaWZ5UmVsYXRpb25zaGlwIiwicmVtb3ZlIiwidW5zdWJzY3JpYmUiLCJmcm9tSlNPTiIsImpzb24iLCJrIiwiRHluYW1pY1JlbGF0aW9uc2hpcCIsInRvSlNPTiIsInJldFZhbCIsImZpZWxkTmFtZXMiLCIkcmVzdCIsInN0YXJ0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7OztBQUNBLElBQU1BLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUMsU0FBU0QsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNRSxVQUFVRixPQUFPLFNBQVAsQ0FBaEI7QUFDQSxJQUFNRyxlQUFlSCxPQUFPLGNBQVAsQ0FBckI7QUFDQSxJQUFNSSxXQUFXSixPQUFPLFVBQVAs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VSxDQUFoQiIsImZpbGUiOiJtb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBSZWxhdGlvbnNoaXAgfSBmcm9tICcuL3JlbGF0aW9uc2hpcCc7XG5pbXBvcnQgbWVyZ2VPcHRpb25zIGZyb20gJ21lcmdlLW9wdGlvbnMnO1xuaW1wb3J0IHsgQmVoYXZpb3JTdWJqZWN0IH0gZnJvbSAncnhqcy9SeCc7XG5jb25zdCAkc3RvcmUgPSBTeW1ib2woJyRzdG9yZScpO1xuY29uc3QgJHBsdW1wID0gU3ltYm9sKCckcGx1bXAnKTtcbmNvbnN0ICRsb2FkZWQgPSBTeW1ib2woJyRsb2FkZWQnKTtcbmNvbnN0ICR1bnN1YnNjcmliZSA9IFN5bWJvbCgnJHVuc3Vic2NyaWJlJyk7XG5jb25zdCAkc3ViamVjdCA9IFN5bWJvbCgnJHN1YmplY3QnKTtcbmV4cG9ydCBjb25zdCAkc2VsZiA9IFN5bWJvbCgnJHNlbGYnKTtcblxuLy8gVE9ETzogZmlndXJlIG91dCB3aGVyZSBlcnJvciBldmVudHMgb3JpZ2luYXRlIChzdG9yYWdlIG9yIG1vZGVsKVxuLy8gYW5kIHdobyBrZWVwcyBhIHJvbGwtYmFja2FibGUgZGVsdGFcblxuZXhwb3J0IGNsYXNzIE1vZGVsIHtcbiAgY29uc3RydWN0b3Iob3B0cywgcGx1bXApIHtcbiAgICB0aGlzWyRzdG9yZV0gPSB7XG4gICAgICBbJGxvYWRlZF06IGZhbHNlLFxuICAgIH07XG4gICAgdGhpcy4kcmVsYXRpb25zaGlwcyA9IHt9O1xuICAgIHRoaXNbJHN1YmplY3RdID0gbmV3IEJlaGF2aW9yU3ViamVjdCgpO1xuICAgIE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkcykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICAgIGNvbnN0IFJlbCA9IHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnJlbGF0aW9uc2hpcDtcbiAgICAgICAgdGhpcy4kcmVsYXRpb25zaGlwc1trZXldID0gbmV3IFJlbCh0aGlzLCBrZXksIHBsdW1wKTtcbiAgICAgICAgdGhpc1skc3RvcmVdW2tleV0gPSBbXTtcbiAgICAgICAgdGhpc1skc3RvcmVdW2tleV1bJGxvYWRlZF0gPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXNbJHN0b3JlXVtrZXldID0gdGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0uZGVmYXVsdCB8fCBudWxsO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbShvcHRzIHx8IHt9KTtcbiAgICBpZiAocGx1bXApIHtcbiAgICAgIHRoaXMuJCRjb25uZWN0VG9QbHVtcChwbHVtcCk7XG4gICAgfVxuICB9XG5cbiAgJCRjb25uZWN0VG9QbHVtcChwbHVtcCkge1xuICAgIHRoaXNbJHBsdW1wXSA9IHBsdW1wO1xuICAgIHRoaXNbJHVuc3Vic2NyaWJlXSA9IHBsdW1wLnN1YnNjcmliZSh0aGlzLmNvbnN0cnVjdG9yLiRuYW1lLCB0aGlzLiRpZCwgKHYpID0+IHtcbiAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldCAkbmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci4kbmFtZTtcbiAgfVxuXG4gIGdldCAkaWQoKSB7XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JlXVt0aGlzLmNvbnN0cnVjdG9yLiRpZF07XG4gIH1cblxuICAkJGNvcHlWYWx1ZXNGcm9tKG9wdHMgPSB7fSkge1xuICAgIE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkcykuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICBpZiAob3B0c1tmaWVsZE5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gY29weSBmcm9tIG9wdHMgdG8gdGhlIGJlc3Qgb2Ygb3VyIGFiaWxpdHlcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnYXJyYXknKSB8fFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnaGFzTWFueScpXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gKG9wdHNbZmllbGROYW1lXSB8fCBbXSkuY29uY2F0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IE9iamVjdC5hc3NpZ24oe30sIG9wdHNbZmllbGROYW1lXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBvcHRzW2ZpZWxkTmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICRzdWJzY3JpYmUobCkge1xuICAgIHJldHVybiB0aGlzWyRzdWJqZWN0XS5zdWJzY3JpYmUobCk7XG4gIH1cblxuICAkJGZpcmVVcGRhdGUoKSB7XG4gICAgdGhpc1skc3ViamVjdF0ubmV4dCh0aGlzWyRzdG9yZV0pO1xuICB9XG5cbiAgLy8gVE9ETzogZG9uJ3QgZmV0Y2ggaWYgd2UgJGdldCgpIHNvbWV0aGluZyB0aGF0IHdlIGFscmVhZHkgaGF2ZVxuXG4gICRnZXQoa2V5ID0gJHNlbGYpIHtcbiAgICAvLyB0aHJlZSBjYXNlcy5cbiAgICAvLyBrZXkgPT09IHVuZGVmaW5lZCAtIGZldGNoIGFsbCwgdW5sZXNzICRsb2FkZWQsIGJ1dCByZXR1cm4gYWxsLlxuICAgIC8vIGZpZWxkc1trZXldID09PSAnaGFzTWFueScgLSBmZXRjaCBjaGlsZHJlbiAocGVyaGFwcyBtb3ZlIHRoaXMgZGVjaXNpb24gdG8gc3RvcmUpXG4gICAgLy8gb3RoZXJ3aXNlIC0gZmV0Y2ggYWxsLCB1bmxlc3MgJHN0b3JlW2tleV0sIHJldHVybiAkc3RvcmVba2V5XS5cblxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBpZiAoKGtleSA9PT0gJHNlbGYpIHx8ICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlICE9PSAnaGFzTWFueScpKSB7XG4gICAgICAgIGlmICh0aGlzWyRzdG9yZV1bJGxvYWRlZF0gPT09IGZhbHNlICYmIHRoaXNbJHBsdW1wXSkge1xuICAgICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZ2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpc1skc3RvcmVdW2tleV1bJGxvYWRlZF0gPT09IGZhbHNlICYmIHRoaXNbJHBsdW1wXSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWxvbmVseS1pZlxuICAgICAgICAgIHJldHVybiB0aGlzLiRyZWxhdGlvbnNoaXBzW2tleV0uJGxpc3QoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLnRoZW4oKHYpID0+IHtcbiAgICAgIGlmICh2ID09PSB0cnVlKSB7XG4gICAgICAgIGlmIChrZXkgPT09ICRzZWxmKSB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXNbJHN0b3JlXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHN0b3JlXVtrZXldO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHYpIHtcbiAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHYpO1xuICAgICAgICBpZiAoa2V5ID09PSAkc2VsZikge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVskbG9hZGVkXSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2tleV1bJGxvYWRlZF0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXkgPT09ICRzZWxmKSB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXNbJHN0b3JlXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHN0b3JlXVtrZXldO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICRzYXZlKCkge1xuICAgIHJldHVybiB0aGlzLiRzZXQoKTtcbiAgfVxuXG4gICRzZXQodSA9IHRoaXNbJHN0b3JlXSkge1xuICAgIGNvbnN0IHVwZGF0ZSA9IG1lcmdlT3B0aW9ucyh7fSwgdGhpc1skc3RvcmVdLCB1KTtcbiAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odXBkYXRlKTsgLy8gdGhpcyBpcyB0aGUgb3B0aW1pc3RpYyB1cGRhdGU7XG4gICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5zYXZlKHRoaXMuY29uc3RydWN0b3IsIHVwZGF0ZSlcbiAgICAudGhlbigodXBkYXRlZCkgPT4ge1xuICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHVwZGF0ZWQpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSk7XG4gIH1cblxuICAkZGVsZXRlKCkge1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0uZGVsZXRlKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkKTtcbiAgfVxuXG4gICRyZXN0KG9wdHMpIHtcbiAgICBjb25zdCByZXN0T3B0cyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIG9wdHMsXG4gICAgICB7XG4gICAgICAgIHVybDogYC8ke3RoaXMuY29uc3RydWN0b3IuJG5hbWV9LyR7dGhpcy4kaWR9LyR7b3B0cy51cmx9YCxcbiAgICAgIH1cbiAgICApO1xuICAgIHJldHVybiB0aGlzWyRwbHVtcF0ucmVzdFJlcXVlc3QocmVzdE9wdHMpO1xuICB9XG5cbiAgJGFkZChrZXksIGl0ZW0sIGV4dHJhcykge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSBpZiAoaXRlbS4kaWQpIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbVt0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS5yZWxhdGlvbnNoaXAuJHNpZGVzW2tleV0ub3RoZXIuZmllbGRdO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPj0gMSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5hZGQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaWQsIGV4dHJhcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkbW9kaWZ5UmVsYXRpb25zaGlwKGtleSwgaXRlbSwgZXh0cmFzKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID49IDEpKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzWyRzdG9yZV1ba2V5XTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHBsdW1wXS5tb2RpZnlSZWxhdGlvbnNoaXAodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaWQsIGV4dHJhcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkcmVtb3ZlKGtleSwgaXRlbSkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+PSAxKSkge1xuICAgICAgICBkZWxldGUgdGhpc1skc3RvcmVdW2tleV07XG4gICAgICAgIHJldHVybiB0aGlzWyRwbHVtcF0ucmVtb3ZlKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gJHJlbW92ZWQgZnJvbSBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRyZW1vdmUgZXhjZXB0IGZyb20gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkdGVhcmRvd24oKSB7XG4gICAgdGhpc1skdW5zdWJzY3JpYmVdLnVuc3Vic2NyaWJlKCk7XG4gIH1cbn1cblxuTW9kZWwuZnJvbUpTT04gPSBmdW5jdGlvbiBmcm9tSlNPTihqc29uKSB7XG4gIHRoaXMuJGlkID0ganNvbi4kaWQgfHwgJ2lkJztcbiAgdGhpcy4kbmFtZSA9IGpzb24uJG5hbWU7XG4gIHRoaXMuJGZpZWxkcyA9IHt9O1xuICBPYmplY3Qua2V5cyhqc29uLiRmaWVsZHMpLmZvckVhY2goKGspID0+IHtcbiAgICBjb25zdCBmaWVsZCA9IGpzb24uJGZpZWxkc1trXTtcbiAgICBpZiAoZmllbGQudHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBjbGFzcyBEeW5hbWljUmVsYXRpb25zaGlwIGV4dGVuZHMgUmVsYXRpb25zaGlwIHt9XG4gICAgICBEeW5hbWljUmVsYXRpb25zaGlwLmZyb21KU09OKGZpZWxkLnJlbGF0aW9uc2hpcCk7XG4gICAgICB0aGlzLiRmaWVsZHNba10gPSB7XG4gICAgICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICAgICAgcmVsYXRpb25zaGlwOiBEeW5hbWljUmVsYXRpb25zaGlwLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kZmllbGRzW2tdID0gT2JqZWN0LmFzc2lnbih7fSwgZmllbGQpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5Nb2RlbC50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04oKSB7XG4gIGNvbnN0IHJldFZhbCA9IHtcbiAgICAkaWQ6IHRoaXMuJGlkLFxuICAgICRuYW1lOiB0aGlzLiRuYW1lLFxuICAgICRmaWVsZHM6IHt9LFxuICB9O1xuICBjb25zdCBmaWVsZE5hbWVzID0gT2JqZWN0LmtleXModGhpcy4kZmllbGRzKTtcbiAgZmllbGROYW1lcy5mb3JFYWNoKChrKSA9PiB7XG4gICAgaWYgKHRoaXMuJGZpZWxkc1trXS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIHJldFZhbC4kZmllbGRzW2tdID0ge1xuICAgICAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgICAgIHJlbGF0aW9uc2hpcDogdGhpcy4kZmllbGRzW2tdLnJlbGF0aW9uc2hpcC50b0pTT04oKSxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldFZhbC4kZmllbGRzW2tdID0gdGhpcy4kZmllbGRzW2tdO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZXRWYWw7XG59O1xuXG5Nb2RlbC4kcmVzdCA9IGZ1bmN0aW9uICRyZXN0KHBsdW1wLCBvcHRzKSB7XG4gIGNvbnN0IHJlc3RPcHRzID0gT2JqZWN0LmFzc2lnbihcbiAgICB7fSxcbiAgICBvcHRzLFxuICAgIHtcbiAgICAgIHVybDogYC8ke3RoaXMuJG5hbWV9LyR7b3B0cy51cmx9YCxcbiAgICB9XG4gICk7XG4gIHJldHVybiBwbHVtcC5yZXN0UmVxdWVzdChyZXN0T3B0cyk7XG59O1xuXG5Nb2RlbC5hc3NpZ24gPSBmdW5jdGlvbiBhc3NpZ24ob3B0cykge1xuICBjb25zdCBzdGFydCA9IHt9O1xuICBPYmplY3Qua2V5cyh0aGlzLiRmaWVsZHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgIGlmIChvcHRzW2tleV0pIHtcbiAgICAgIHN0YXJ0W2tleV0gPSBvcHRzW2tleV07XG4gICAgfSBlbHNlIGlmICh0aGlzLiRmaWVsZHNba2V5XS5kZWZhdWx0KSB7XG4gICAgICBzdGFydFtrZXldID0gdGhpcy4kZmllbGRzW2tleV0uZGVmYXVsdDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgc3RhcnRba2V5XSA9IFtdO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGFydFtrZXldID0gbnVsbDtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gc3RhcnQ7XG59O1xuXG5Nb2RlbC4kaWQgPSAnaWQnO1xuTW9kZWwuJG5hbWUgPSAnQmFzZSc7XG5Nb2RlbC4kc2VsZiA9ICRzZWxmO1xuTW9kZWwuJGZpZWxkcyA9IHtcbiAgaWQ6IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbn07XG4iXX0=
