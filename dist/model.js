'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Promise = require('bluebird');
var $store = Symbol('$store');

// TODO: figure out where error events originate (storage or model)
// and who keeps a roll-backable delta

var Model = exports.Model = function () {
  function Model() {
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Model);

    this[$store] = {};
    this.$$copyValuesFrom(opts);
  }

  _createClass(Model, [{
    key: '$$copyValuesFrom',
    value: function $$copyValuesFrom() {
      var _this = this;

      var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      Object.keys(this.constructor.$fields).forEach(function (fieldName) {
        if (opts[fieldName] !== undefined) {
          // copy from opts to the best of our ability
          if (_this.constructor.$fields[fieldName].type === 'array' || _this.constructor.$fields[fieldName].type === 'hasMany') {
            _this[$store][fieldName] = opts[fieldName].concat();
          } else if (_this.constructor.$fields[fieldName].type === 'object') {
            _this[$store][fieldName] = Object.assign({}, opts[fieldName]);
          } else {
            _this[$store][fieldName] = opts[fieldName];
          }
        }
      });
    }
  }, {
    key: '$get',
    value: function $get(key) {
      var _this2 = this;

      if (this[$store][key] !== undefined) {
        return Promise.resolve(this[$store][key]);
      } else {
        return this.constructor.$storage.reduce(function (thenable, storage) {
          return thenable.then(function (v) {
            if (v !== null) {
              return v;
            } else {
              return storage.read(_this2.constructor, _this2.$id).then(function (value) {
                if (value !== null) {
                  _this2.$$copyValuesFrom(value);
                  return _this2[$store][key];
                } else {
                  return null;
                }
              });
            }
          });
        }, Promise.resolve(null));
      }
    }
  }, {
    key: '$load',
    value: function $load() {
      var _this3 = this;

      var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var options = Object.assign({}, { self: true }, opts);
      if (options.self) {
        this.getSelf().then(function (data) {
          _this3.$$copyValuesFrom(data);
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
      var _this4 = this;

      var update = arguments.length <= 0 || arguments[0] === undefined ? this[$store] : arguments[0];

      this.$$copyValuesFrom(update); // this is the optimistic update;
      var setupPromise = Promise.resolve(update);
      var skipTerminal = null;
      if (this.$id === undefined && update[this.constructor.$id] === undefined) {
        // need to get an ID.
        var terminals = this.constructor.$storage.filter(function (s) {
          return s.terminal;
        });
        if (terminals.length === 1) {
          skipTerminal = terminals[0];
          setupPromise = terminals[0].write(this.constructor, update);
        } else {
          return Promise.reject(new Error('Model can only have one terminal store'));
        }
      }
      return setupPromise.then(function (toUpdate) {
        return Promise.all(_this4.constructor.$storage.map(function (storage) {
          if (storage !== skipTerminal) {
            return storage.write(_this4.constructor, toUpdate);
          } else {
            return toUpdate;
          }
        }));
      }).then(function (updates) {
        return updates[0];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIlByb21pc2UiLCJyZXF1aXJlIiwiJHN0b3JlIiwiU3ltYm9sIiwiTW9kZWwiLCJvcHRzIiwiJCRjb3B5VmFsdWVzRnJvbSIsIk9iamVjdCIsImtleXMiLCJjb25zdHJ1Y3RvciIsIiRmaWVsZHMiLCJmb3JFYWNoIiwiZmllbGROYW1lIiwidW5kZWZpbmVkIiwidHlwZSIsImNvbmNhdCIsImFzc2lnbiIsImtleSIsInJlc29sdmUiLCIkc3RvcmFnZSIsInJlZHVjZSIsInRoZW5hYmxlIiwic3RvcmFnZSIsInRoZW4iLCJ2IiwicmVhZCIsIiRpZCIsInZhbHVlIiwib3B0aW9ucyIsInNlbGYiLCJnZXRTZWxmIiwiZGF0YSIsIiRzZXQiLCJ1cGRhdGUiLCJzZXR1cFByb21pc2UiLCJza2lwVGVybWluYWwiLCJ0ZXJtaW5hbHMiLCJmaWx0ZXIiLCJzIiwidGVybWluYWwiLCJsZW5ndGgiLCJ3cml0ZSIsInJlamVjdCIsIkVycm9yIiwidG9VcGRhdGUiLCJhbGwiLCJtYXAiLCJ1cGRhdGVzIiwiaXRlbSIsImlkIiwiYWRkIiwicmVtb3ZlIiwiJG5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxJQUFNQSxVQUFVQyxRQUFRLFVBQVIsQ0FBaEI7QUFDQSxJQUFNQyxTQUFTQyxPQUFPLFFBQVAsQ0FBZjs7QUFFQTtBQUNBOztJQUVhQyxLLFdBQUFBLEs7QUFDWCxtQkFBdUI7QUFBQSxRQUFYQyxJQUFXLHlEQUFKLEVBQUk7O0FBQUE7O0FBQ3JCLFNBQUtILE1BQUwsSUFBZSxFQUFmO0FBQ0EsU0FBS0ksZ0JBQUwsQ0FBc0JELElBQXRCO0FBQ0Q7Ozs7dUNBVTJCO0FBQUE7O0FBQUEsVUFBWEEsSUFBVyx5REFBSixFQUFJOztBQUMxQkUsYUFBT0MsSUFBUCxDQUFZLEtBQUtDLFdBQUwsQ0FBaUJDLE9BQTdCLEVBQXNDQyxPQUF0QyxDQUE4QyxVQUFDQyxTQUFELEVBQWU7QUFDM0QsWUFBSVAsS0FBS08sU0FBTCxNQUFv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QUZrQixDQUFaLENBQVA7QUFHRCxTQUpELE1BSU87QUFDTCxpQkFBT2hELFFBQVEwQyxNQUFSLENBQWUsSUFBSUMsS0FBSixDQUFVLG9DQUFWLENBQWYsQ0FBUDtBQUNEO0FBQ0YsT0FkRCxNQWNPO0FBQ0wsZUFBTzNDLFFBQVEwQyxNQUFSLENBQWUsSUFBSUMsS0FBSixDQUFVLDBDQUFWLENBQWYsQ0FBUDtBQUNEO0FBQ0Y7Ozt3QkEvSFc7QUFDVixhQUFPLEtBQUtsQyxXQUFMLENBQWlCMkMsS0FBeEI7QUFDRDs7O3dCQUVTO0FBQ1IsYUFBTyxLQUFLbEQsTUFBTCxFQUFhLEtBQUtPLFdBQUwsQ0FBaUJpQixHQUE5QixDQUFQO0FBQ0Q7Ozs7OztBQTRISHRCLE1BQU1zQixHQUFOLEdBQVksSUFBWjtBQUNBdEIsTUFBTWdELEtBQU4sR0FBYyxNQUFkO0FBQ0FoRCxNQUFNTSxPQUFOLEdBQWdCO0FBQ2R1QyxNQUFJO0FBQ0ZuQyxVQUFNO0FBREo7QUFEVSxDQUFoQiIsImZpbGUiOiJtb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IFByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuY29uc3QgJHN0b3JlID0gU3ltYm9sKCckc3RvcmUnKTtcblxuLy8gVE9ETzogZmlndXJlIG91dCB3aGVyZSBlcnJvciBldmVudHMgb3JpZ2luYXRlIChzdG9yYWdlIG9yIG1vZGVsKVxuLy8gYW5kIHdobyBrZWVwcyBhIHJvbGwtYmFja2FibGUgZGVsdGFcblxuZXhwb3J0IGNsYXNzIE1vZGVsIHtcbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgdGhpc1skc3RvcmVdID0ge307XG4gICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKG9wdHMpO1xuICB9XG5cbiAgZ2V0ICRuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLiRuYW1lO1xuICB9XG5cbiAgZ2V0ICRpZCgpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmVdW3RoaXMuY29uc3RydWN0b3IuJGlkXTtcbiAgfVxuXG4gICQkY29weVZhbHVlc0Zyb20ob3B0cyA9IHt9KSB7XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChmaWVsZE5hbWUpID0+IHtcbiAgICAgIGlmIChvcHRzW2ZpZWxkTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBjb3B5IGZyb20gb3B0cyB0byB0aGUgYmVzdCBvZiBvdXIgYWJpbGl0eVxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdhcnJheScpIHx8XG4gICAgICAgICAgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdoYXNNYW55JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBvcHRzW2ZpZWxkTmFtZV0uY29uY2F0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IE9iamVjdC5hc3NpZ24oe30sIG9wdHNbZmllbGROYW1lXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBvcHRzW2ZpZWxkTmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICRnZXQoa2V5KSB7XG4gICAgaWYgKHRoaXNbJHN0b3JlXVtrZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpc1skc3RvcmVdW2tleV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci4kc3RvcmFnZS5yZWR1Y2UoKHRoZW5hYmxlLCBzdG9yYWdlKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGVuYWJsZS50aGVuKCh2KSA9PiB7XG4gICAgICAgICAgaWYgKHYgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gc3RvcmFnZS5yZWFkKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkKVxuICAgICAgICAgICAgLnRoZW4oKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbJHN0b3JlXVtrZXldO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSwgUHJvbWlzZS5yZXNvbHZlKG51bGwpKTtcbiAgICB9XG4gIH1cblxuICAkbG9hZChvcHRzID0ge30pIHtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwge3NlbGY6IHRydWV9LCBvcHRzKTtcbiAgICBpZiAob3B0aW9ucy5zZWxmKSB7XG4gICAgICB0aGlzLmdldFNlbGYoKVxuICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKGRhdGEpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgJHNhdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHNldCgpO1xuICB9XG5cbiAgJHNldCh1cGRhdGUgPSB0aGlzWyRzdG9yZV0pIHtcbiAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odXBkYXRlKTsgLy8gdGhpcyBpcyB0aGUgb3B0aW1pc3RpYyB1cGRhdGU7XG4gICAgbGV0IHNldHVwUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSh1cGRhdGUpO1xuICAgIGxldCBza2lwVGVybWluYWwgPSBudWxsO1xuICAgIGlmICgodGhpcy4kaWQgPT09IHVuZGVmaW5lZCkgJiYgKHVwZGF0ZVt0aGlzLmNvbnN0cnVjdG9yLiRpZF0gPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgIC8vIG5lZWQgdG8gZ2V0IGFuIElELlxuICAgICAgY29uc3QgdGVybWluYWxzID0gdGhpcy5jb25zdHJ1Y3Rvci4kc3RvcmFnZS5maWx0ZXIoKHMpID0+IHMudGVybWluYWwpO1xuICAgICAgaWYgKHRlcm1pbmFscy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgc2tpcFRlcm1pbmFsID0gdGVybWluYWxzWzBdO1xuICAgICAgICBzZXR1cFByb21pc2UgPSB0ZXJtaW5hbHNbMF0ud3JpdGUodGhpcy5jb25zdHJ1Y3RvciwgdXBkYXRlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ01vZGVsIGNhbiBvbmx5IGhhdmUgb25lIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2V0dXBQcm9taXNlLnRoZW4oKHRvVXBkYXRlKSA9PiB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwodGhpcy5jb25zdHJ1Y3Rvci4kc3RvcmFnZS5tYXAoKHN0b3JhZ2UpID0+IHtcbiAgICAgICAgaWYgKHN0b3JhZ2UgIT09IHNraXBUZXJtaW5hbCkge1xuICAgICAgICAgIHJldHVybiBzdG9yYWdlLndyaXRlKHRoaXMuY29uc3RydWN0b3IsIHRvVXBkYXRlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdG9VcGRhdGU7XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9KS50aGVuKCh1cGRhdGVzKSA9PiB1cGRhdGVzWzBdKTtcbiAgfVxuXG4gICRhZGQoa2V5LCBpdGVtKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID4gMSkpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHRoaXMuY29uc3RydWN0b3IuJHN0b3JhZ2UubWFwKChzdG9yYWdlKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JhZ2UuYWRkKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGl0ZW0pO1xuICAgICAgICB9KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gYWRkZWQgdG8gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRhZGQgZXhjZXB0IHRvIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG5cbiAgJHJlbW92ZShrZXksIGl0ZW0pIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPiAxKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwodGhpcy5jb25zdHJ1Y3Rvci4kc3RvcmFnZS5tYXAoKHN0b3JhZ2UpID0+IHtcbiAgICAgICAgICByZXR1cm4gc3RvcmFnZS5yZW1vdmUodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaXRlbSk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSAkcmVtb3ZlZCBmcm9tIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkcmVtb3ZlIGV4Y2VwdCBmcm9tIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG59XG5cbk1vZGVsLiRpZCA9ICdpZCc7XG5Nb2RlbC4kbmFtZSA9ICdCYXNlJztcbk1vZGVsLiRmaWVsZHMgPSB7XG4gIGlkOiB7XG4gICAgdHlwZTogJ251bWJlcicsXG4gIH0sXG59O1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
