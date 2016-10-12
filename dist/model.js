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
            _this2[$store][fieldName] = opts[fieldName].concat();
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
      var _this5 = this;

      if (this.constructor.$fields[key].type === 'hasMany') {
        var id = 0;
        if (typeof item === 'number') {
          id = item;
        } else {
          id = item.$id;
        }
        if (typeof id === 'number' && id > 1) {
          return Promise.all(this.constructor.$storage.map(function (storage) {
            return storage.remove(_this5.constructor, _this5.$id, key, item);
          }));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIlByb21pc2UiLCIkc3RvcmUiLCJTeW1ib2wiLCIkZ3VpbGQiLCIkbG9hZGVkIiwiJHVuc3Vic2NyaWJlIiwiTW9kZWwiLCJvcHRzIiwiZ3VpbGQiLCIkJGNvcHlWYWx1ZXNGcm9tIiwiJCRjb25uZWN0VG9HdWlsZCIsInN1YnNjcmliZSIsImNvbnN0cnVjdG9yIiwiJG5hbWUiLCIkaWQiLCJ2IiwiT2JqZWN0Iiwia2V5cyIsIiRmaWVsZHMiLCJmb3JFYWNoIiwiZmllbGROYW1lIiwidW5kZWZpbmVkIiwidHlwZSIsImNvbmNhdCIsImFzc2lnbiIsImtleSIsInJlc29sdmUiLCJ0aGVuIiwiaGFzIiwiZ2V0Iiwib3B0aW9ucyIsInNlbGYiLCJnZXRTZWxmIiwiZGF0YSIsIiRzZXQiLCJ1cGRhdGUiLCJzYXZlIiwiaXRlbSIsImlkIiwiYWRkIiwicmVqZWN0IiwiRXJyb3IiLCJhbGwiLCIkc3RvcmFnZSIsIm1hcCIsInN0b3JhZ2UiLCJyZW1vdmUiLCJ1bnN1YnNjcmliZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0lBQVlBLE87Ozs7Ozs7O0FBQ1osSUFBTUMsU0FBU0MsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNQyxTQUFTRCxPQUFPLFFBQVAsQ0FBZjtBQUNBLElBQU1FLFVBQVVGLE9BQU8sU0FBUCxDQUFoQjtBQUNBLElBQU1HLGVBQWVILE9BQU8sY0FBUCxDQUFyQjs7QUFFQTtBQUNBOztJQUVhSSxLLFdBQUFBLEs7QUFDWCxpQkFBWUMsSUFBWixFQUFrQkMsS0FBbEIsRUFBeUI7QUFBQTs7QUFDdkIsU0FBS1AsTUFBTCxJQUFlLEVBQWY7QUFDQSxTQUFLUSxnQkFBTCxDQUFzQkYsUUFBUSxFQUE5QjtBQUNBLFNBQUtILE9BQUwsSUFBZ0IsS0FBaEI7QUFDQSxRQUFJSSxLQUFKLEVBQVc7QUFDVCxXQUFLRSxnQkFBTCxDQUFzQkYsS0FBdEI7QUFDRDtBQUNGOzs7O3FDQUVnQkEsSyxFQUFPO0FBQUE7O0FB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Q0FBUDtBQUNEOzs7Ozs7QUF5SEhSLE1BQU1RLEdBQU4sR0FBWSxJQUFaO0FBQ0FSLE1BQU1PLEtBQU4sR0FBYyxNQUFkO0FBQ0FQLE1BQU1ZLE9BQU4sR0FBZ0I7QUFDZG9CLE1BQUk7QUFDRmhCLFVBQU07QUFESjtBQURVLENBQWhCIiwiZmlsZSI6Im1vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5jb25zdCAkc3RvcmUgPSBTeW1ib2woJyRzdG9yZScpO1xuY29uc3QgJGd1aWxkID0gU3ltYm9sKCckZ3VpbGQnKTtcbmNvbnN0ICRsb2FkZWQgPSBTeW1ib2woJyRsb2FkZWQnKTtcbmNvbnN0ICR1bnN1YnNjcmliZSA9IFN5bWJvbCgnJHVuc3Vic2NyaWJlJyk7XG5cbi8vIFRPRE86IGZpZ3VyZSBvdXQgd2hlcmUgZXJyb3IgZXZlbnRzIG9yaWdpbmF0ZSAoc3RvcmFnZSBvciBtb2RlbClcbi8vIGFuZCB3aG8ga2VlcHMgYSByb2xsLWJhY2thYmxlIGRlbHRhXG5cbmV4cG9ydCBjbGFzcyBNb2RlbCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMsIGd1aWxkKSB7XG4gICAgdGhpc1skc3RvcmVdID0ge307XG4gICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKG9wdHMgfHwge30pO1xuICAgIHRoaXNbJGxvYWRlZF0gPSBmYWxzZTtcbiAgICBpZiAoZ3VpbGQpIHtcbiAgICAgIHRoaXMuJCRjb25uZWN0VG9HdWlsZChndWlsZCk7XG4gICAgfVxuICB9XG5cbiAgJCRjb25uZWN0VG9HdWlsZChndWlsZCkge1xuICAgIHRoaXNbJGd1aWxkXSA9IGd1aWxkO1xuICAgIHRoaXNbJHVuc3Vic2NyaWJlXSA9IGd1aWxkLnN1YnNjcmliZSh0aGlzLmNvbnN0cnVjdG9yLiRuYW1lLCB0aGlzLiRpZCwgKHYpID0+IHtcbiAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldCAkbmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci4kbmFtZTtcbiAgfVxuXG4gIGdldCAkaWQoKSB7XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JlXVt0aGlzLmNvbnN0cnVjdG9yLiRpZF07XG4gIH1cblxuICAkJGNvcHlWYWx1ZXNGcm9tKG9wdHMgPSB7fSkge1xuICAgIE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkcykuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICBpZiAob3B0c1tmaWVsZE5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gY29weSBmcm9tIG9wdHMgdG8gdGhlIGJlc3Qgb2Ygb3VyIGFiaWxpdHlcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnYXJyYXknKSB8fFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnaGFzTWFueScpXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gb3B0c1tmaWVsZE5hbWVdLmNvbmNhdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBPYmplY3QuYXNzaWduKHt9LCBvcHRzW2ZpZWxkTmFtZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gb3B0c1tmaWVsZE5hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvLyBUT0RPOiBkb24ndCBmZXRjaCBpZiB3ZSAkZ2V0KCkgc29tZXRoaW5nIHRoYXQgd2UgYWxyZWFkeSBoYXZlXG5cbiAgJGdldChrZXkpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBpZiAoXG4gICAgICAgICgodGhpc1skbG9hZGVkXSA9PT0gZmFsc2UpICYmIChrZXkgPT09IHVuZGVmaW5lZCkpIHx8XG4gICAgICAgICh0aGlzWyRzdG9yZV1ba2V5XSA9PT0gdW5kZWZpbmVkKVxuICAgICAgKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skZ3VpbGRdLmhhcyh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5KVxuICAgICAgICAgIC50aGVuKCh2KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1trZXldOiB2fTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skZ3VpbGRdLmdldCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKHYpID0+IHtcbiAgICAgIGlmICh2ID09PSB0cnVlKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyRzdG9yZV1ba2V5XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KTtcbiAgICAgICAgdGhpc1skbG9hZGVkXSA9IHRydWU7XG4gICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skc3RvcmVdW2tleV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXNbJHN0b3JlXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICRsb2FkKG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB7c2VsZjogdHJ1ZX0sIG9wdHMpO1xuICAgIGlmIChvcHRpb25zLnNlbGYpIHtcbiAgICAgIHRoaXMuZ2V0U2VsZigpXG4gICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20oZGF0YSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAkc2F2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy4kc2V0KCk7XG4gIH1cblxuICAkc2V0KHVwZGF0ZSA9IHRoaXNbJHN0b3JlXSkge1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh1cGRhdGUpOyAvLyB0aGlzIGlzIHRoZSBvcHRpbWlzdGljIHVwZGF0ZTtcbiAgICByZXR1cm4gdGhpc1skZ3VpbGRdLnNhdmUodGhpcy5jb25zdHJ1Y3RvciwgdXBkYXRlKTtcbiAgICAvLyAudGhlbigodXBkYXRlcykgPT4ge1xuICAgIC8vICAgcmV0dXJuIHVwZGF0ZXM7XG4gICAgLy8gfSk7XG4gIH1cblxuICAkYWRkKGtleSwgaXRlbSkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+IDEpKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyRndWlsZF0uYWRkKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSBhZGRlZCB0byBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkcmVtb3ZlKGtleSwgaXRlbSkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+IDEpKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbCh0aGlzLmNvbnN0cnVjdG9yLiRzdG9yYWdlLm1hcCgoc3RvcmFnZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBzdG9yYWdlLnJlbW92ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpdGVtKTtcbiAgICAgICAgfSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtICRyZW1vdmVkIGZyb20gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRyZW1vdmUgZXhjZXB0IGZyb20gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkdGVhcmRvd24oKSB7XG4gICAgdGhpc1skdW5zdWJzY3JpYmVdLnVuc3Vic2NyaWJlKCk7XG4gIH1cblxufVxuXG5Nb2RlbC4kaWQgPSAnaWQnO1xuTW9kZWwuJG5hbWUgPSAnQmFzZSc7XG5Nb2RlbC4kZmllbGRzID0ge1xuICBpZDoge1xuICAgIHR5cGU6ICdudW1iZXInLFxuICB9LFxufTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
