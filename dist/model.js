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
        if (_this3[$loaded] === true && key === undefined || _this3[$store][key] === undefined) {
          if (_this3.constructor.$fields[key].type === 'hasMany') {
            return _this3[$guild].has(_this3.constructor, _this3.$id, key);
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
            return storage.add(_this5.constructor, _this5.$id, key, item);
          }));
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
      var _this6 = this;

      if (this.constructor.$fields[key].type === 'hasMany') {
        var id = 0;
        if (typeof item === 'number') {
          id = item;
        } else {
          id = item.$id;
        }
        if (typeof id === 'number' && id > 1) {
          return Promise.all(this.constructor.$storage.map(function (storage) {
            return storage.remove(_this6.constructor, _this6.$id, key, item);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIlByb21pc2UiLCIkc3RvcmUiLCJTeW1ib2wiLCIkZ3VpbGQiLCIkbG9hZGVkIiwiJHVuc3Vic2NyaWJlIiwiTW9kZWwiLCJvcHRzIiwiZ3VpbGQiLCIkJGNvcHlWYWx1ZXNGcm9tIiwiJCRjb25uZWN0VG9HdWlsZCIsInN1YnNjcmliZSIsImNvbnN0cnVjdG9yIiwiJG5hbWUiLCIkaWQiLCJ2IiwiT2JqZWN0Iiwia2V5cyIsIiRmaWVsZHMiLCJmb3JFYWNoIiwiZmllbGROYW1lIiwidW5kZWZpbmVkIiwidHlwZSIsImNvbmNhdCIsImFzc2lnbiIsImtleSIsInJlc29sdmUiLCJ0aGVuIiwiaGFzIiwiZ2V0Iiwib3B0aW9ucyIsInNlbGYiLCJnZXRTZWxmIiwiZGF0YSIsIiRzZXQiLCJ1cGRhdGUiLCJzYXZlIiwiaXRlbSIsImlkIiwiYWxsIiwiJHN0b3JhZ2UiLCJtYXAiLCJzdG9yYWdlIiwiYWRkIiwicmVqZWN0IiwiRXJyb3IiLCJyZW1vdmUiLCJ1bnN1YnNjcmliZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0lBQVlBLE87Ozs7OztBQUNaLElBQU1DLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUMsU0FBU0QsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNRSxVQUFVRixPQUFPLFNBQVAsQ0FBaEI7QUFDQSxJQUFNRyxlQUFlSCxPQUFPLGNBQVAsQ0FBckI7O0FBRUE7QUFDQTs7SUFFYUksSyxXQUFBQSxLO0FBQ1gsaUJBQVlDLElBQVosRUFBa0JDLEtBQWxCLEVBQXlCO0FBQUE7O0FBQ3ZCLFNBQUtQLE1BQUwsSUFBZSxFQUFmO0FBQ0EsU0FBS1EsZ0JBQUwsQ0FBc0JGLFFBQVEsRUFBOUI7QUFDQSxTQUFLSCxPQUFMLElBQWdCLEtBQWhCO0FBQ0EsUUFBSUksS0FBSixFQUFXO0FBQ1QsV0FBS0UsZ0JBQUwsQ0FBc0JGLEtBQXRCO0FBQ0Q7QUFDRjs7OztxQ0FFZ0JBLEssRUFBTztBQUFBOztBQUN0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TCxFQUFhLEtBQUtXLFdBQUwsQ0FBaUJFLEdBQTlCLENBQVA7QUFDRDs7Ozs7O0FBd0hIUixNQUFNUSxHQUFOLEdBQVksSUFBWjtBQUNBUixNQUFNTyxLQUFOLEdBQWMsTUFBZDtBQUNBUCxNQUFNWSxPQUFOLEdBQWdCO0FBQ2RvQixNQUFJO0FBQ0ZoQixVQUFNO0FBREo7QUFEVSxDQUFoQiIsImZpbGUiOiJtb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuY29uc3QgJHN0b3JlID0gU3ltYm9sKCckc3RvcmUnKTtcbmNvbnN0ICRndWlsZCA9IFN5bWJvbCgnJGd1aWxkJyk7XG5jb25zdCAkbG9hZGVkID0gU3ltYm9sKCckbG9hZGVkJyk7XG5jb25zdCAkdW5zdWJzY3JpYmUgPSBTeW1ib2woJyR1bnN1YnNjcmliZScpO1xuXG4vLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIGVycm9yIGV2ZW50cyBvcmlnaW5hdGUgKHN0b3JhZ2Ugb3IgbW9kZWwpXG4vLyBhbmQgd2hvIGtlZXBzIGEgcm9sbC1iYWNrYWJsZSBkZWx0YVxuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzLCBndWlsZCkge1xuICAgIHRoaXNbJHN0b3JlXSA9IHt9O1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbShvcHRzIHx8IHt9KTtcbiAgICB0aGlzWyRsb2FkZWRdID0gZmFsc2U7XG4gICAgaWYgKGd1aWxkKSB7XG4gICAgICB0aGlzLiQkY29ubmVjdFRvR3VpbGQoZ3VpbGQpO1xuICAgIH1cbiAgfVxuXG4gICQkY29ubmVjdFRvR3VpbGQoZ3VpbGQpIHtcbiAgICB0aGlzWyRndWlsZF0gPSBndWlsZDtcbiAgICB0aGlzWyR1bnN1YnNjcmliZV0gPSBndWlsZC5zdWJzY3JpYmUodGhpcy5jb25zdHJ1Y3Rvci4kbmFtZSwgdGhpcy4kaWQsICh2KSA9PiB7XG4gICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odik7XG4gICAgfSk7XG4gIH1cblxuICBnZXQgJG5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuJG5hbWU7XG4gIH1cblxuICBnZXQgJGlkKCkge1xuICAgIHJldHVybiB0aGlzWyRzdG9yZV1bdGhpcy5jb25zdHJ1Y3Rvci4kaWRdO1xuICB9XG5cbiAgJCRjb3B5VmFsdWVzRnJvbShvcHRzID0ge30pIHtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgaWYgKG9wdHNbZmllbGROYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGNvcHkgZnJvbSBvcHRzIHRvIHRoZSBiZXN0IG9mIG91ciBhYmlsaXR5XG4gICAgICAgIGlmIChcbiAgICAgICAgICAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2FycmF5JykgfHxcbiAgICAgICAgICAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2hhc01hbnknKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IG9wdHNbZmllbGROYW1lXS5jb25jYXQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0c1tmaWVsZE5hbWVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IG9wdHNbZmllbGROYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gVE9ETzogZG9uJ3QgZmV0Y2ggaWYgd2UgJGdldCgpIHNvbWV0aGluZyB0aGF0IHdlIGFscmVhZHkgaGF2ZVxuXG4gICRnZXQoa2V5KSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKFxuICAgICAgICAoKHRoaXNbJGxvYWRlZF0gPT09IHRydWUpICYmIChrZXkgPT09IHVuZGVmaW5lZCkpIHx8XG4gICAgICAgICh0aGlzWyRzdG9yZV1ba2V5XSA9PT0gdW5kZWZpbmVkKVxuICAgICAgKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skZ3VpbGRdLmhhcyh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skZ3VpbGRdLmdldCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKHYpID0+IHtcbiAgICAgIGlmICh2ID09PSB0cnVlKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyRzdG9yZV1ba2V5XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KTtcbiAgICAgICAgdGhpc1skbG9hZGVkXSA9IHRydWU7XG4gICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skc3RvcmVdW2tleV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXNbJHN0b3JlXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICRsb2FkKG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB7c2VsZjogdHJ1ZX0sIG9wdHMpO1xuICAgIGlmIChvcHRpb25zLnNlbGYpIHtcbiAgICAgIHRoaXMuZ2V0U2VsZigpXG4gICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20oZGF0YSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAkc2F2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy4kc2V0KCk7XG4gIH1cblxuICAkc2V0KHVwZGF0ZSA9IHRoaXNbJHN0b3JlXSkge1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh1cGRhdGUpOyAvLyB0aGlzIGlzIHRoZSBvcHRpbWlzdGljIHVwZGF0ZTtcbiAgICByZXR1cm4gdGhpc1skZ3VpbGRdLnNhdmUodGhpcy5jb25zdHJ1Y3RvciwgdXBkYXRlKTtcbiAgICAvLyAudGhlbigodXBkYXRlcykgPT4ge1xuICAgIC8vICAgcmV0dXJuIHVwZGF0ZXM7XG4gICAgLy8gfSk7XG4gIH1cblxuICAkYWRkKGtleSwgaXRlbSkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+IDEpKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbCh0aGlzLmNvbnN0cnVjdG9yLiRzdG9yYWdlLm1hcCgoc3RvcmFnZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBzdG9yYWdlLmFkZCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpdGVtKTtcbiAgICAgICAgfSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICRyZW1vdmUoa2V5LCBpdGVtKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID4gMSkpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHRoaXMuY29uc3RydWN0b3IuJHN0b3JhZ2UubWFwKChzdG9yYWdlKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JhZ2UucmVtb3ZlKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGl0ZW0pO1xuICAgICAgICB9KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gJHJlbW92ZWQgZnJvbSBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJHJlbW92ZSBleGNlcHQgZnJvbSBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICR0ZWFyZG93bigpIHtcbiAgICB0aGlzWyR1bnN1YnNjcmliZV0udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG59XG5cbk1vZGVsLiRpZCA9ICdpZCc7XG5Nb2RlbC4kbmFtZSA9ICdCYXNlJztcbk1vZGVsLiRmaWVsZHMgPSB7XG4gIGlkOiB7XG4gICAgdHlwZTogJ251bWJlcicsXG4gIH0sXG59O1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
