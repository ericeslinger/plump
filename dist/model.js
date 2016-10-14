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

      var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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

      // three cases.
      // key === undefined - fetch all, unless $loaded, but return all.
      // fields[key] === 'hasMany' - fetch children (perhaps move this decision to store)
      // otherwise - fetch all, unless $store[key], return $store[key].

      return Promise.resolve().then(function () {
        if (key === undefined && _this3[$loaded] === false || key && _this3[$store][key] === undefined) {
          return _this3[$guild].get(_this3.constructor, _this3.$id, key);
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

      var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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
      var _this5 = this;

      var update = arguments.length <= 0 || arguments[0] === undefined ? this[$store] : arguments[0];

      this.$$copyValuesFrom(update); // this is the optimistic update;
      return this[$guild].save(this.constructor, update).then(function (updated) {
        _this5.$$copyValuesFrom(updated);
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
        if (typeof id === 'number' && id > 1) {
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
        if (typeof id === 'number' && id > 1) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIlByb21pc2UiLCIkc3RvcmUiLCJTeW1ib2wiLCIkZ3VpbGQiLCIkbG9hZGVkIiwiJHVuc3Vic2NyaWJlIiwiTW9kZWwiLCJvcHRzIiwiZ3VpbGQiLCIkJGNvcHlWYWx1ZXNGcm9tIiwiJCRjb25uZWN0VG9HdWlsZCIsInN1YnNjcmliZSIsImNvbnN0cnVjdG9yIiwiJG5hbWUiLCIkaWQiLCJ2IiwiT2JqZWN0Iiwia2V5cyIsIiRmaWVsZHMiLCJmb3JFYWNoIiwiZmllbGROYW1lIiwidW5kZWZpbmVkIiwidHlwZSIsImNvbmNhdCIsImFzc2lnbiIsImtleSIsInJlc29sdmUiLCJ0aGVuIiwiZ2V0Iiwib3B0aW9ucyIsInNlbGYiLCJnZXRTZWxmIiwiZGF0YSIsIiRzZXQiLCJ1cGRhdGUiLCJzYXZlIiwidXBkYXRlZCIsIml0ZW0iLCJleHRyYXMiLCJpZCIsImFkZCIsInJlamVjdCIsIkVycm9yIiwibW9kaWZ5UmVsYXRpb25zaGlwIiwicmVtb3ZlIiwidW5zdWJzY3JpYmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQUFZQSxPOzs7Ozs7QUFDWixJQUFNQyxTQUFTQyxPQUFPLFFBQVAsQ0FBZjtBQUNBLElBQU1DLFNBQVNELE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUUsVUFBVUYsT0FBTyxTQUFQLENBQWhCO0FBQ0EsSUFBTUcsZUFBZUgsT0FBTyxjQUFQLENBQXJCOztBQUVBO0FBQ0E7O0lBRWFJLEssV0FBQUEsSztBQUNYLGlCQUFZQyxJQUFaLEVBQWtCQyxLQUFsQixFQUF5QjtBQUFBOztBQUN2QixTQUFLUCxNQUFMLElBQWUsRUFBZjtBQUNBLFNBQUtRLGdCQUFMLENBQXNCRixRQUFRLEVBQTlCO0FBQ0EsU0FBS0gsT0FBTCxJQUFnQixLQUFoQjtBQUNBLFFBQUlJLEtBQUosRUFBVztBQUNULFdBQUtFLGdCQUFMLENBQXNCRixLQUF0QjtBQUNEO0FBQ0Y7Ozs7cUNBRWdCQSxLLEVBQU87QUFBQTs7QUFD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MEM7QUFDeEMsaUJBQU8sS0FBS3RDLE1BQUwsRUFBYXdCLEdBQWIsQ0FBUDtBQUNBLGlCQUFPLEtBQUt0QixNQUFMLEVBQWF5QyxNQUFiLENBQW9CLEtBQUtoQyxXQUF6QixFQUFzQyxLQUFLRSxHQUEzQyxFQUFnRFcsR0FBaEQsRUFBcURjLEVBQXJELENBQVA7QUFDRCxTQUhELE1BR087QUFDTCxpQkFBT3ZDLFFBQVF5QyxNQUFSLENBQWUsSUFBSUMsS0FBSixDQUFVLG9DQUFWLENBQWYsQ0FBUDtBQUNEO0FBQ0YsT0FiRCxNQWFPO0FBQ0wsZUFBTzFDLFFBQVF5QyxNQUFSLENBQWUsSUFBSUMsS0FBSixDQUFVLDBDQUFWLENBQWYsQ0FBUDtBQUNEO0FBQ0Y7OztnQ0FFVztBQUNWLFdBQUtyQyxZQUFMLEVBQW1Cd0MsV0FBbkI7QUFDRDs7O3dCQS9JVztBQUNWLGFBQU8sS0FBS2pDLFdBQUwsQ0FBaUJDLEtBQXhCO0FBQ0Q7Ozt3QkFFUztBQUNSLGFBQU8sS0FBS1osTUFBTCxFQUFhLEtBQUtXLFdBQUwsQ0FBaUJFLEdBQTlCLENBQVA7QUFDRDs7Ozs7O0FBNklIUixNQUFNUSxHQUFOLEdBQVksSUFBWjtBQUNBUixNQUFNTyxLQUFOLEdBQWMsTUFBZDtBQUNBUCxNQUFNWSxPQUFOLEdBQWdCO0FBQ2RxQixNQUFJO0FBQ0ZqQixVQUFNO0FBREo7QUFEVSxDQUFoQiIsImZpbGUiOiJtb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuY29uc3QgJHN0b3JlID0gU3ltYm9sKCckc3RvcmUnKTtcbmNvbnN0ICRndWlsZCA9IFN5bWJvbCgnJGd1aWxkJyk7XG5jb25zdCAkbG9hZGVkID0gU3ltYm9sKCckbG9hZGVkJyk7XG5jb25zdCAkdW5zdWJzY3JpYmUgPSBTeW1ib2woJyR1bnN1YnNjcmliZScpO1xuXG4vLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIGVycm9yIGV2ZW50cyBvcmlnaW5hdGUgKHN0b3JhZ2Ugb3IgbW9kZWwpXG4vLyBhbmQgd2hvIGtlZXBzIGEgcm9sbC1iYWNrYWJsZSBkZWx0YVxuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzLCBndWlsZCkge1xuICAgIHRoaXNbJHN0b3JlXSA9IHt9O1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbShvcHRzIHx8IHt9KTtcbiAgICB0aGlzWyRsb2FkZWRdID0gZmFsc2U7XG4gICAgaWYgKGd1aWxkKSB7XG4gICAgICB0aGlzLiQkY29ubmVjdFRvR3VpbGQoZ3VpbGQpO1xuICAgIH1cbiAgfVxuXG4gICQkY29ubmVjdFRvR3VpbGQoZ3VpbGQpIHtcbiAgICB0aGlzWyRndWlsZF0gPSBndWlsZDtcbiAgICB0aGlzWyR1bnN1YnNjcmliZV0gPSBndWlsZC5zdWJzY3JpYmUodGhpcy5jb25zdHJ1Y3Rvci4kbmFtZSwgdGhpcy4kaWQsICh2KSA9PiB7XG4gICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odik7XG4gICAgfSk7XG4gIH1cblxuICBnZXQgJG5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuJG5hbWU7XG4gIH1cblxuICBnZXQgJGlkKCkge1xuICAgIHJldHVybiB0aGlzWyRzdG9yZV1bdGhpcy5jb25zdHJ1Y3Rvci4kaWRdO1xuICB9XG5cbiAgJCRjb3B5VmFsdWVzRnJvbShvcHRzID0ge30pIHtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgaWYgKG9wdHNbZmllbGROYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGNvcHkgZnJvbSBvcHRzIHRvIHRoZSBiZXN0IG9mIG91ciBhYmlsaXR5XG4gICAgICAgIGlmIChcbiAgICAgICAgICAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2FycmF5JykgfHxcbiAgICAgICAgICAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2hhc01hbnknKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IChvcHRzW2ZpZWxkTmFtZV0gfHwgW10pLmNvbmNhdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBPYmplY3QuYXNzaWduKHt9LCBvcHRzW2ZpZWxkTmFtZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gb3B0c1tmaWVsZE5hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvLyBUT0RPOiBkb24ndCBmZXRjaCBpZiB3ZSAkZ2V0KCkgc29tZXRoaW5nIHRoYXQgd2UgYWxyZWFkeSBoYXZlXG5cbiAgJGdldChrZXkpIHtcbiAgICAvLyB0aHJlZSBjYXNlcy5cbiAgICAvLyBrZXkgPT09IHVuZGVmaW5lZCAtIGZldGNoIGFsbCwgdW5sZXNzICRsb2FkZWQsIGJ1dCByZXR1cm4gYWxsLlxuICAgIC8vIGZpZWxkc1trZXldID09PSAnaGFzTWFueScgLSBmZXRjaCBjaGlsZHJlbiAocGVyaGFwcyBtb3ZlIHRoaXMgZGVjaXNpb24gdG8gc3RvcmUpXG4gICAgLy8gb3RoZXJ3aXNlIC0gZmV0Y2ggYWxsLCB1bmxlc3MgJHN0b3JlW2tleV0sIHJldHVybiAkc3RvcmVba2V5XS5cblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmIChcbiAgICAgICAgKChrZXkgPT09IHVuZGVmaW5lZCkgJiYgKHRoaXNbJGxvYWRlZF0gPT09IGZhbHNlKSkgfHxcbiAgICAgICAgKGtleSAmJiAodGhpc1skc3RvcmVdW2tleV0gPT09IHVuZGVmaW5lZCkpXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJGd1aWxkXS5nZXQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KS50aGVuKCh2KSA9PiB7XG4gICAgICBpZiAodiA9PT0gdHJ1ZSkge1xuICAgICAgICByZXR1cm4gdGhpc1skc3RvcmVdW2tleV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odik7XG4gICAgICAgIHRoaXNbJGxvYWRlZF0gPSB0cnVlO1xuICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHN0b3JlXVtrZXldO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCB0aGlzWyRzdG9yZV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAkbG9hZChvcHRzID0ge30pIHtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwge3NlbGY6IHRydWV9LCBvcHRzKTtcbiAgICBpZiAob3B0aW9ucy5zZWxmKSB7XG4gICAgICB0aGlzLmdldFNlbGYoKVxuICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKGRhdGEpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgJHNhdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHNldCgpO1xuICB9XG5cbiAgJHNldCh1cGRhdGUgPSB0aGlzWyRzdG9yZV0pIHtcbiAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odXBkYXRlKTsgLy8gdGhpcyBpcyB0aGUgb3B0aW1pc3RpYyB1cGRhdGU7XG4gICAgcmV0dXJuIHRoaXNbJGd1aWxkXS5zYXZlKHRoaXMuY29uc3RydWN0b3IsIHVwZGF0ZSlcbiAgICAudGhlbigodXBkYXRlZCkgPT4ge1xuICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHVwZGF0ZWQpO1xuICAgICAgcmV0dXJuIHVwZGF0ZWQ7XG4gICAgfSk7XG4gICAgLy8gLnRoZW4oKHVwZGF0ZXMpID0+IHtcbiAgICAvLyAgIHJldHVybiB1cGRhdGVzO1xuICAgIC8vIH0pO1xuICB9XG5cbiAgJGFkZChrZXksIGl0ZW0sIGV4dHJhcykge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+IDEpKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyRndWlsZF0uYWRkKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkLCBleHRyYXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICRtb2RpZnlSZWxhdGlvbnNoaXAoa2V5LCBpdGVtLCBleHRyYXMpIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPiAxKSkge1xuICAgICAgICBkZWxldGUgdGhpc1skc3RvcmVdW2tleV07XG4gICAgICAgIHJldHVybiB0aGlzWyRndWlsZF0ubW9kaWZ5UmVsYXRpb25zaGlwKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGlkLCBleHRyYXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICRyZW1vdmUoa2V5LCBpdGVtKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID4gMSkpIHtcbiAgICAgICAgZGVsZXRlIHRoaXNbJHN0b3JlXVtrZXldO1xuICAgICAgICByZXR1cm4gdGhpc1skZ3VpbGRdLnJlbW92ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gJHJlbW92ZWQgZnJvbSBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJHJlbW92ZSBleGNlcHQgZnJvbSBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICR0ZWFyZG93bigpIHtcbiAgICB0aGlzWyR1bnN1YnNjcmliZV0udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG59XG5cbk1vZGVsLiRpZCA9ICdpZCc7XG5Nb2RlbC4kbmFtZSA9ICdCYXNlJztcbk1vZGVsLiRmaWVsZHMgPSB7XG4gIGlkOiB7XG4gICAgdHlwZTogJ251bWJlcicsXG4gIH0sXG59O1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
