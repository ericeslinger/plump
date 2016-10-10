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
var $unsubscribe = Symbol('$unsubscribe');

// TODO: figure out where error events originate (storage or model)
// and who keeps a roll-backable delta

var Model = exports.Model = function () {
  function Model(opts, guild) {
    _classCallCheck(this, Model);

    this[$store] = {};
    this.$$copyValuesFrom(opts || {});
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

      if (key === undefined || this[$store][key] === undefined) {
        return this[$guild].get(this.constructor, this.$id).then(function (v) {
          _this3.$$copyValuesFrom(v);
          if (key) {
            return _this3[$store][key];
          } else {
            return Object.assign({}, _this3[$store]);
          }
        });
      } else {
        return Promise.resolve(this[$store][key]);
      }
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
      var update = arguments.length <= 0 || arguments[0] === undefined ? this[$store] : arguments[0];

      this.$$copyValuesFrom(update); // this is the optimistic update;
      return this[$guild].save(this.constructor, update).then(function (updates) {
        console.log(updates);
        return updates;
      });
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
    key: '$has',
    value: function $has(key) {
      if (this.constructor.$fields[key].type === 'hasMany') {
        return this[$guild].has(this.constructor, this.$id, key);
      } else {
        return Promise.reject(new Error('Cannot $has only valid on hasMany field'));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIlByb21pc2UiLCIkc3RvcmUiLCJTeW1ib2wiLCIkZ3VpbGQiLCIkdW5zdWJzY3JpYmUiLCJNb2RlbCIsIm9wdHMiLCJndWlsZCIsIiQkY29weVZhbHVlc0Zyb20iLCIkJGNvbm5lY3RUb0d1aWxkIiwic3Vic2NyaWJlIiwiY29uc3RydWN0b3IiLCIkbmFtZSIsIiRpZCIsInYiLCJPYmplY3QiLCJrZXlzIiwiJGZpZWxkcyIsImZvckVhY2giLCJmaWVsZE5hbWUiLCJ1bmRlZmluZWQiLCJ0eXBlIiwiY29uY2F0IiwiYXNzaWduIiwia2V5IiwiZ2V0IiwidGhlbiIsInJlc29sdmUiLCJvcHRpb25zIiwic2VsZiIsImdldFNlbGYiLCJkYXRhIiwiJHNldCIsInVwZGF0ZSIsInNhdmUiLCJ1cGRhdGVzIiwiY29uc29sZSIsImxvZyIsIml0ZW0iLCJpZCIsImFsbCIsIiRzdG9yYWdlIiwibWFwIiwic3RvcmFnZSIsImFkZCIsInJlamVjdCIsIkVycm9yIiwicmVtb3ZlIiwiaGFzIiwidW5zdWJzY3JpYmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQUFZQSxPOzs7Ozs7QUFDWixJQUFNQyxTQUFTQyxPQUFPLFFBQVAsQ0FBZjtBQUNBLElBQU1DLFNBQVNELE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUUsZUFBZUYsT0FBTyxjQUFQLENBQXJCOztBQUVBO0FBQ0E7O0lBRWFHLEssV0FBQUEsSztBQUNYLGlCQUFZQyxJQUFaLEVBQWtCQyxLQUFsQixFQUF5QjtBQUFBOztBQUN2QixTQUFLTixNQUFMLElBQWUsRUFBZjtBQUNBLFNBQUtPLGdCQUFMLENBQXNCRixRQUFRLEVBQTlCO0FBQ0EsUUFBSUMsS0FBSixFQUFXO0FBQ1QsV0FBS0UsZ0JBQUwsQ0FBc0JGLEtBQXRCO0FBQ0Q7QUFDRjs7OztxQ0FFZ0JBLEssRUFBTztBQUFBOztBQUN0QixXQUFLSixNQUFMLElBQWVJLEtBQWY7QUFDQSxXQUFLSCxZQUFMLElBQXFC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UixNQUFNUSxHQUFOLEdBQVksSUFBWjtBQUNBUixNQUFNTyxLQUFOLEdBQWMsTUFBZDtBQUNBUCxNQUFNWSxPQUFOLEdBQWdCO0FBQ2RzQixNQUFJO0FBQ0ZsQixVQUFNO0FBREo7QUFEVSxDQUFoQiIsImZpbGUiOiJtb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuY29uc3QgJHN0b3JlID0gU3ltYm9sKCckc3RvcmUnKTtcbmNvbnN0ICRndWlsZCA9IFN5bWJvbCgnJGd1aWxkJyk7XG5jb25zdCAkdW5zdWJzY3JpYmUgPSBTeW1ib2woJyR1bnN1YnNjcmliZScpO1xuXG4vLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIGVycm9yIGV2ZW50cyBvcmlnaW5hdGUgKHN0b3JhZ2Ugb3IgbW9kZWwpXG4vLyBhbmQgd2hvIGtlZXBzIGEgcm9sbC1iYWNrYWJsZSBkZWx0YVxuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzLCBndWlsZCkge1xuICAgIHRoaXNbJHN0b3JlXSA9IHt9O1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbShvcHRzIHx8IHt9KTtcbiAgICBpZiAoZ3VpbGQpIHtcbiAgICAgIHRoaXMuJCRjb25uZWN0VG9HdWlsZChndWlsZCk7XG4gICAgfVxuICB9XG5cbiAgJCRjb25uZWN0VG9HdWlsZChndWlsZCkge1xuICAgIHRoaXNbJGd1aWxkXSA9IGd1aWxkO1xuICAgIHRoaXNbJHVuc3Vic2NyaWJlXSA9IGd1aWxkLnN1YnNjcmliZSh0aGlzLmNvbnN0cnVjdG9yLiRuYW1lLCB0aGlzLiRpZCwgKHYpID0+IHtcbiAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldCAkbmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci4kbmFtZTtcbiAgfVxuXG4gIGdldCAkaWQoKSB7XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JlXVt0aGlzLmNvbnN0cnVjdG9yLiRpZF07XG4gIH1cblxuICAkJGNvcHlWYWx1ZXNGcm9tKG9wdHMgPSB7fSkge1xuICAgIE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkcykuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICBpZiAob3B0c1tmaWVsZE5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gY29weSBmcm9tIG9wdHMgdG8gdGhlIGJlc3Qgb2Ygb3VyIGFiaWxpdHlcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnYXJyYXknKSB8fFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnaGFzTWFueScpXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gb3B0c1tmaWVsZE5hbWVdLmNvbmNhdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBPYmplY3QuYXNzaWduKHt9LCBvcHRzW2ZpZWxkTmFtZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gb3B0c1tmaWVsZE5hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvLyBUT0RPOiBkb24ndCBmZXRjaCBpZiB3ZSAkZ2V0KCkgc29tZXRoaW5nIHRoYXQgd2UgYWxyZWFkeSBoYXZlXG5cbiAgJGdldChrZXkpIHtcbiAgICBpZiAoKGtleSA9PT0gdW5kZWZpbmVkKSB8fCAodGhpc1skc3RvcmVdW2tleV0gPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgIHJldHVybiB0aGlzWyRndWlsZF0uZ2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkKVxuICAgICAgLnRoZW4oKHYpID0+IHtcbiAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHYpO1xuICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHN0b3JlXVtrZXldO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCB0aGlzWyRzdG9yZV0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzWyRzdG9yZV1ba2V5XSk7XG4gICAgfVxuICB9XG5cbiAgJGxvYWQob3B0cyA9IHt9KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIHtzZWxmOiB0cnVlfSwgb3B0cyk7XG4gICAgaWYgKG9wdGlvbnMuc2VsZikge1xuICAgICAgdGhpcy5nZXRTZWxmKClcbiAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbShkYXRhKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gICRzYXZlKCkge1xuICAgIHJldHVybiB0aGlzLiRzZXQoKTtcbiAgfVxuXG4gICRzZXQodXBkYXRlID0gdGhpc1skc3RvcmVdKSB7XG4gICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHVwZGF0ZSk7IC8vIHRoaXMgaXMgdGhlIG9wdGltaXN0aWMgdXBkYXRlO1xuICAgIHJldHVybiB0aGlzWyRndWlsZF0uc2F2ZSh0aGlzLmNvbnN0cnVjdG9yLCB1cGRhdGUpXG4gICAgLnRoZW4oKHVwZGF0ZXMpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKHVwZGF0ZXMpO1xuICAgICAgcmV0dXJuIHVwZGF0ZXM7XG4gICAgfSk7XG4gIH1cblxuICAkYWRkKGtleSwgaXRlbSkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+IDEpKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbCh0aGlzLmNvbnN0cnVjdG9yLiRzdG9yYWdlLm1hcCgoc3RvcmFnZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBzdG9yYWdlLmFkZCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpdGVtKTtcbiAgICAgICAgfSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICRyZW1vdmUoa2V5LCBpdGVtKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID4gMSkpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHRoaXMuY29uc3RydWN0b3IuJHN0b3JhZ2UubWFwKChzdG9yYWdlKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JhZ2UucmVtb3ZlKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGl0ZW0pO1xuICAgICAgICB9KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gJHJlbW92ZWQgZnJvbSBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJHJlbW92ZSBleGNlcHQgZnJvbSBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICRoYXMoa2V5KSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgcmV0dXJuIHRoaXNbJGd1aWxkXS5oYXModGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkaGFzIG9ubHkgdmFsaWQgb24gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkdGVhcmRvd24oKSB7XG4gICAgdGhpc1skdW5zdWJzY3JpYmVdLnVuc3Vic2NyaWJlKCk7XG4gIH1cblxufVxuXG5Nb2RlbC4kaWQgPSAnaWQnO1xuTW9kZWwuJG5hbWUgPSAnQmFzZSc7XG5Nb2RlbC4kZmllbGRzID0ge1xuICBpZDoge1xuICAgIHR5cGU6ICdudW1iZXInLFxuICB9LFxufTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
