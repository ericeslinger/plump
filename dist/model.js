'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Model = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $store = Symbol('$store');
var $guild = Symbol('$guild');
var $loaded = Symbol('$loaded');
var $unsubscribe = Symbol('$unsubscribe');

// TODO: figure out where error events originate (storage or model)
// and who keeps a roll-backable delta

var Model = exports.Model = function () {
  function Model(opts, guild) {
    var _this = this;

    _classCallCheck(this, Model);

    this[$store] = {};
    this.$$copyValuesFrom(opts || {});
    this[$loaded] = false;
    this.$relationships = {};
    Object.keys(this.constructor.$fields).forEach(function (key) {
      if (_this.constructor.$fields[key].type === 'hasMany') {
        var Relationship = _this.constructor.$fields[key].relationship;
        _this.$relationships[key] = new Relationship(_this, key, guild);
      }
    });
    if (guild) {
      this.$$connectToGuild(guild);
    }
  }

  _createClass(Model, [{
    key: '$$connectToGuild',
    value: function $$connectToGuild(guild) {
      var _this2 = this;

      this[$guild] = guild;
      this[$unsubscribe] = guild.subscribe(this.constructor.$name, this.$id, function (v) {
        _this2.$$copyValuesFrom(v);
      });
    }
  }, {
    key: '$$copyValuesFrom',
    value: function $$copyValuesFrom() {
      var _this3 = this;

      var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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

    // TODO: don't fetch if we $get() something that we already have

  }, {
    key: '$get',
    value: function $get(key) {
      var _this4 = this;

      // three cases.
      // key === undefined - fetch all, unless $loaded, but return all.
      // fields[key] === 'hasMany' - fetch children (perhaps move this decision to store)
      // otherwise - fetch all, unless $store[key], return $store[key].

      return Promise.resolve().then(function () {
        if (key === undefined && _this4[$loaded] === false || key && _this4[$store][key] === undefined) {
          if (_this4.$relationships[key]) {
            return _this4.$relationships[key].$list();
          }
          return _this4[$guild].get(_this4.constructor, _this4.$id, key);
        } else {
          return true;
        }
      }).then(function (v) {
        if (v === true) {
          return _this4[$store][key];
        } else {
          _this4.$$copyValuesFrom(v);
          _this4[$loaded] = true;
          if (key) {
            return _this4[$store][key];
          } else {
            return Object.assign({}, _this4[$store]);
          }
        }
      });
    }
  }, {
    key: '$load',
    value: function $load() {
      var _this5 = this;

      var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var options = Object.assign({}, { self: true }, opts);
      if (options.self) {
        this.getSelf().then(function (data) {
          _this5.$$copyValuesFrom(data);
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

      var update = arguments.length <= 0 || arguments[0] === undefined ? this[$store] : arguments[0];

      this.$$copyValuesFrom(update); // this is the optimistic update;
      return this[$guild].save(this.constructor, update).then(function (updated) {
        _this6.$$copyValuesFrom(updated);
        return updated;
      });
      // .then((updates) => {
      //   return updates;
      // });
    }
  }, {
    key: '$add',
    value: function $add(key, item, extras) {
      if (this.constructor.$fields[key].type === 'hasMany') {
        var id = 0;
        if (typeof item === 'number') {
          id = item;
        } else {
          id = item.$id;
        }
        if (typeof id === 'number' && id >= 1) {
          return this[$guild].add(this.constructor, this.$id, key, id, extras);
        } else {
          return Promise.reject(new Error('Invalid item added to hasMany'));
        }
      } else {
        return Promise.reject(new Error('Cannot $add except to hasMany field'));
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
          return this[$guild].modifyRelationship(this.constructor, this.$id, key, id, extras);
        } else {
          return Promise.reject(new Error('Invalid item added to hasMany'));
        }
      } else {
        return Promise.reject(new Error('Cannot $add except to hasMany field'));
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
          return this[$guild].remove(this.constructor, this.$id, key, id);
        } else {
          return Promise.reject(new Error('Invalid item $removed from hasMany'));
        }
      } else {
        return Promise.reject(new Error('Cannot $remove except from hasMany field'));
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

Model.$id = 'id';
Model.$name = 'Base';
Model.$fields = {
  id: {
    type: 'number'
  }
};