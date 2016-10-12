'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Model = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $store = Symbol('$store');
var $guild = Symbol('$guild');
var $loaded = Symbol('$loaded');
var $unsubscribe = Symbol('$unsubscribe');

// TODO: figure out where error events originate (storage or model)
// and who keeps a roll-backable delta

var Model = exports.Model = function () {
  function Model(opts, guild) {
    _classCallCheck(this, Model);

    this[$store] = {};
    this.$$copyValuesFrom(opts || {});
    this[$loaded] = false;
    if (guild) {
      this.$$connectToGuild(guild);
    }
  }

  _createClass(Model, [{
    key: '$$connectToGuild',
    value: function $$connectToGuild(guild) {
      var _this = this;

      this[$guild] = guild;
      this[$unsubscribe] = guild.subscribe(this.constructor.$name, this.$id, function (v) {
        _this.$$copyValuesFrom(v);
      });
    }
  }, {
    key: '$$copyValuesFrom',
    value: function $$copyValuesFrom() {
      var _this2 = this;

      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      Object.keys(this.constructor.$fields).forEach(function (fieldName) {
        if (opts[fieldName] !== undefined) {
          // copy from opts to the best of our ability
          if (_this2.constructor.$fields[fieldName].type === 'array' || _this2.constructor.$fields[fieldName].type === 'hasMany') {
            _this2[$store][fieldName] = (opts[fieldName] || []).concat();
          } else if (_this2.constructor.$fields[fieldName].type === 'object') {
            _this2[$store][fieldName] = Object.assign({}, opts[fieldName]);
          } else {
            _this2[$store][fieldName] = opts[fieldName];
          }
        }
      });
    }

    // TODO: don't fetch if we $get() something that we already have

  }, {
    key: '$get',
    value: function $get(key) {
      var _this3 = this;

      return Promise.resolve().then(function () {
        if (_this3[$loaded] === false && key === undefined || _this3[$store][key] === undefined) {
          if (_this3.constructor.$fields[key].type === 'hasMany') {
            return _this3[$guild].has(_this3.constructor, _this3.$id, key).then(function (v) {
              // TODO: this is a hack due to copyValuesFrom wanting a JSON obj
              return _defineProperty({}, key, v);
            });
          } else {
            return _this3[$guild].get(_this3.constructor, _this3.$id);
          }
        } else {
          return true;
        }
      }).then(function (v) {
        if (v === true) {
          return _this3[$store][key];
        } else {
          _this3.$$copyValuesFrom(v);
          _this3[$loaded] = true;
          if (key) {
            return _this3[$store][key];
          } else {
            return Object.assign({}, _this3[$store]);
          }
        }
      });
    }
  }, {
    key: '$load',
    value: function $load() {
      var _this4 = this;

      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var options = Object.assign({}, { self: true }, opts);
      if (options.self) {
        this.getSelf().then(function (data) {
          _this4.$$copyValuesFrom(data);
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
      var update = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this[$store];

      this.$$copyValuesFrom(update); // this is the optimistic update;
      return this[$guild].save(this.constructor, update);
      // .then((updates) => {
      //   return updates;
      // });
    }
  }, {
    key: '$add',
    value: function $add(key, item) {
      if (this.constructor.$fields[key].type === 'hasMany') {
        var id = 0;
        if (typeof item === 'number') {
          id = item;
        } else {
          id = item.$id;
        }
        if (typeof id === 'number' && id > 1) {
          return this[$guild].add(this.constructor, this.$id, key, id);
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
        if (typeof id === 'number' && id > 1) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIlByb21pc2UiLCIkc3RvcmUiLCJTeW1ib2wiLCIkZ3VpbGQiLCIkbG9hZGVkIiwiJHVuc3Vic2NyaWJlIiwiTW9kZWwiLCJvcHRzIiwiZ3VpbGQiLCIkJGNvcHlWYWx1ZXNGcm9tIiwiJCRjb25uZWN0VG9HdWlsZCIsInN1YnNjcmliZSIsImNvbnN0cnVjdG9yIiwiJG5hbWUiLCIkaWQiLCJ2IiwiT2JqZWN0Iiwia2V5cyIsIiRmaWVsZHMiLCJmb3JFYWNoIiwiZmllbGROYW1lIiwidW5kZWZpbmVkIiwidHlwZSIsImNvbmNhdCIsImFzc2lnbiIsImtleSIsInJlc29sdmUiLCJ0aGVuIiwiaGFzIiwiZ2V0Iiwib3B0aW9ucyIsInNlbGYiLCJnZXRTZWxmIiwiZGF0YSIsIiRzZXQiLCJ1cGRhdGUiLCJzYXZlIiwiaXRlbSIsImlkIiwiYWRkIiwicmVqZWN0IiwiRXJyb3IiLCJyZW1vdmUiLCJ1bnN1YnNjcmliZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0lBQVlBLE87Ozs7Ozs7O0FBQ1osSUFBTUMsU0FBU0MsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNQyxTQUFTRCxPQUFPLFFBQVAsQ0FBZjtBQUNBLElBQU1FLFVBQVVGLE9BQU8sU0FBUCxDQUFoQjtBQUNBLElBQU1HLGVBQWVILE9BQU8sY0FBUCxDQUFyQjs7QUFFQTtBQUNBOztJQUVhSSxLLFdBQUFBLEs7QUFDWCxpQkFBWUMsSUFBWixFQUFrQkMsS0FBbEIsRUFBeUI7QUFBQTs7QUFDdkIsU0FBS1AsTUFBTCxJQUFlLEVBQWY7QUFDQSxTQUFLUSxnQkFBTCxDQUFzQkYsUUFBUSxFQUE5QjtBQUNBLFNBQUtILE9BQUwsSUFBZ0IsS0FBaEI7QUFDQSxRQUFJSSxLQUFKLEVBQVc7QUFDVCxXQUFLRSxnQkFBTCxDQUFzQkYsS0FBdEI7QUFDRDtBQUNGOzs7O3FDQUVnQkEsSyxFQUFPO0FBQUE7O0FBQ3RCLFdBQUtMLE1BQUwsSUFBZUssS0FBZjtBQUNBLFdB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QUFNWSxPQUFOLEdBQWdCO0FBQ2RvQixNQUFJO0FBQ0ZoQixVQUFNO0FBREo7QUFEVSxDQUFoQiIsImZpbGUiOiJtb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuY29uc3QgJHN0b3JlID0gU3ltYm9sKCckc3RvcmUnKTtcbmNvbnN0ICRndWlsZCA9IFN5bWJvbCgnJGd1aWxkJyk7XG5jb25zdCAkbG9hZGVkID0gU3ltYm9sKCckbG9hZGVkJyk7XG5jb25zdCAkdW5zdWJzY3JpYmUgPSBTeW1ib2woJyR1bnN1YnNjcmliZScpO1xuXG4vLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIGVycm9yIGV2ZW50cyBvcmlnaW5hdGUgKHN0b3JhZ2Ugb3IgbW9kZWwpXG4vLyBhbmQgd2hvIGtlZXBzIGEgcm9sbC1iYWNrYWJsZSBkZWx0YVxuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzLCBndWlsZCkge1xuICAgIHRoaXNbJHN0b3JlXSA9IHt9O1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbShvcHRzIHx8IHt9KTtcbiAgICB0aGlzWyRsb2FkZWRdID0gZmFsc2U7XG4gICAgaWYgKGd1aWxkKSB7XG4gICAgICB0aGlzLiQkY29ubmVjdFRvR3VpbGQoZ3VpbGQpO1xuICAgIH1cbiAgfVxuXG4gICQkY29ubmVjdFRvR3VpbGQoZ3VpbGQpIHtcbiAgICB0aGlzWyRndWlsZF0gPSBndWlsZDtcbiAgICB0aGlzWyR1bnN1YnNjcmliZV0gPSBndWlsZC5zdWJzY3JpYmUodGhpcy5jb25zdHJ1Y3Rvci4kbmFtZSwgdGhpcy4kaWQsICh2KSA9PiB7XG4gICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odik7XG4gICAgfSk7XG4gIH1cblxuICBnZXQgJG5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuJG5hbWU7XG4gIH1cblxuICBnZXQgJGlkKCkge1xuICAgIHJldHVybiB0aGlzWyRzdG9yZV1bdGhpcy5jb25zdHJ1Y3Rvci4kaWRdO1xuICB9XG5cbiAgJCRjb3B5VmFsdWVzRnJvbShvcHRzID0ge30pIHtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgaWYgKG9wdHNbZmllbGROYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGNvcHkgZnJvbSBvcHRzIHRvIHRoZSBiZXN0IG9mIG91ciBhYmlsaXR5XG4gICAgICAgIGlmIChcbiAgICAgICAgICAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2FycmF5JykgfHxcbiAgICAgICAgICAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2hhc01hbnknKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IChvcHRzW2ZpZWxkTmFtZV0gfHwgW10pLmNvbmNhdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBPYmplY3QuYXNzaWduKHt9LCBvcHRzW2ZpZWxkTmFtZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gb3B0c1tmaWVsZE5hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvLyBUT0RPOiBkb24ndCBmZXRjaCBpZiB3ZSAkZ2V0KCkgc29tZXRoaW5nIHRoYXQgd2UgYWxyZWFkeSBoYXZlXG5cbiAgJGdldChrZXkpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBpZiAoXG4gICAgICAgICgodGhpc1skbG9hZGVkXSA9PT0gZmFsc2UpICYmIChrZXkgPT09IHVuZGVmaW5lZCkpIHx8XG4gICAgICAgICh0aGlzWyRzdG9yZV1ba2V5XSA9PT0gdW5kZWZpbmVkKVxuICAgICAgKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skZ3VpbGRdLmhhcyh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5KVxuICAgICAgICAgIC50aGVuKCh2KSA9PiB7XG4gICAgICAgICAgICAvLyBUT0RPOiB0aGlzIGlzIGEgaGFjayBkdWUgdG8gY29weVZhbHVlc0Zyb20gd2FudGluZyBhIEpTT04gb2JqXG4gICAgICAgICAgICByZXR1cm4ge1trZXldOiB2fTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skZ3VpbGRdLmdldCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKHYpID0+IHtcbiAgICAgIGlmICh2ID09PSB0cnVlKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyRzdG9yZV1ba2V5XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KTtcbiAgICAgICAgdGhpc1skbG9hZGVkXSA9IHRydWU7XG4gICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skc3RvcmVdW2tleV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXNbJHN0b3JlXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICRsb2FkKG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB7c2VsZjogdHJ1ZX0sIG9wdHMpO1xuICAgIGlmIChvcHRpb25zLnNlbGYpIHtcbiAgICAgIHRoaXMuZ2V0U2VsZigpXG4gICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20oZGF0YSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAkc2F2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy4kc2V0KCk7XG4gIH1cblxuICAkc2V0KHVwZGF0ZSA9IHRoaXNbJHN0b3JlXSkge1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh1cGRhdGUpOyAvLyB0aGlzIGlzIHRoZSBvcHRpbWlzdGljIHVwZGF0ZTtcbiAgICByZXR1cm4gdGhpc1skZ3VpbGRdLnNhdmUodGhpcy5jb25zdHJ1Y3RvciwgdXBkYXRlKTtcbiAgICAvLyAudGhlbigodXBkYXRlcykgPT4ge1xuICAgIC8vICAgcmV0dXJuIHVwZGF0ZXM7XG4gICAgLy8gfSk7XG4gIH1cblxuICAkYWRkKGtleSwgaXRlbSkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+IDEpKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyRndWlsZF0uYWRkKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSBhZGRlZCB0byBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkcmVtb3ZlKGtleSwgaXRlbSkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+IDEpKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzWyRzdG9yZV1ba2V5XTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJGd1aWxkXS5yZW1vdmUodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtICRyZW1vdmVkIGZyb20gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRyZW1vdmUgZXhjZXB0IGZyb20gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkdGVhcmRvd24oKSB7XG4gICAgdGhpc1skdW5zdWJzY3JpYmVdLnVuc3Vic2NyaWJlKCk7XG4gIH1cblxufVxuXG5Nb2RlbC4kaWQgPSAnaWQnO1xuTW9kZWwuJG5hbWUgPSAnQmFzZSc7XG5Nb2RlbC4kZmllbGRzID0ge1xuICBpZDoge1xuICAgIHR5cGU6ICdudW1iZXInLFxuICB9LFxufTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
