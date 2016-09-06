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
              return storage.read(_this2, _this2.$id).then(function (value) {
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
    key: '$set',
    value: function $set(update) {
      var _this3 = this;

      this.$$copyValuesFrom(update);
      return Promise.all(this.constructor.$storage.map(function (storage) {
        return storage.update(_this3, update);
      }));
    }
  }, {
    key: '$add',
    value: function $add(key, item) {
      var _this4 = this;

      if (this.constructor.$fields[key].type === 'hasMany') {
        var id = 0;
        if (typeof item === 'number') {
          id = item;
        } else {
          id = item.$id;
        }
        if (typeof id === 'number' && id > 1) {
          return Promise.all(this.constructor.$storage.map(function (storage) {
            return storage.$add(_this4, key, item);
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
            return storage.$remove(_this5, key, item);
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
//# sourceMappingURL=data:application/json;base64,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O0FBQ0wsaUJBQU8sUUFBUSxNQUFSLENBQWUsSUFBSSxLQUFKLENBQVUsb0NBQVYsQ0FBZixDQUFQO0FBQ0Q7QUFDRixPQWRELE1BY087QUFDTCxlQUFPLFFBQVEsTUFBUixDQUFlLElBQUksS0FBSixDQUFVLDBDQUFWLENBQWYsQ0FBUDtBQUNEO0FBQ0Y7Ozt3QkEvRlc7QUFDVixhQUFPLEtBQUssV0FBTCxDQUFpQixLQUF4QjtBQUNEOzs7d0JBRVM7QUFDUixhQUFPLEtBQUssTUFBTCxFQUFhLEtBQUssV0FBTCxDQUFpQixHQUE5QixDQUFQO0FBQ0Q7Ozs7OztBQTRGSCxNQUFNLEdBQU4sR0FBWSxJQUFaO0FBQ0EsTUFBTSxLQUFOLEdBQWMsTUFBZDtBQUNBLE1BQU0sT0FBTixHQUFnQjtBQUNkLE1BQUk7QUFDRixVQUFNO0FBREo7QUFEVSxDQUFoQiIsImZpbGUiOiJtb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IFByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuY29uc3QgJHN0b3JlID0gU3ltYm9sKCckc3RvcmUnKTtcblxuLy8gVE9ETzogZmlndXJlIG91dCB3aGVyZSBlcnJvciBldmVudHMgb3JpZ2luYXRlIChzdG9yYWdlIG9yIG1vZGVsKVxuLy8gYW5kIHdobyBrZWVwcyBhIHJvbGwtYmFja2FibGUgZGVsdGFcblxuZXhwb3J0IGNsYXNzIE1vZGVsIHtcbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgdGhpc1skc3RvcmVdID0ge307XG4gICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKG9wdHMpO1xuICB9XG5cbiAgZ2V0ICRuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLiRuYW1lO1xuICB9XG5cbiAgZ2V0ICRpZCgpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmVdW3RoaXMuY29uc3RydWN0b3IuJGlkXTtcbiAgfVxuXG4gICQkY29weVZhbHVlc0Zyb20ob3B0cyA9IHt9KSB7XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChmaWVsZE5hbWUpID0+IHtcbiAgICAgIGlmIChvcHRzW2ZpZWxkTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBjb3B5IGZyb20gb3B0cyB0byB0aGUgYmVzdCBvZiBvdXIgYWJpbGl0eVxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdhcnJheScpIHx8XG4gICAgICAgICAgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdoYXNNYW55JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBvcHRzW2ZpZWxkTmFtZV0uY29uY2F0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IE9iamVjdC5hc3NpZ24oe30sIG9wdHNbZmllbGROYW1lXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBvcHRzW2ZpZWxkTmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICRnZXQoa2V5KSB7XG4gICAgaWYgKHRoaXNbJHN0b3JlXVtrZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpc1skc3RvcmVdW2tleV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci4kc3RvcmFnZS5yZWR1Y2UoKHRoZW5hYmxlLCBzdG9yYWdlKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGVuYWJsZS50aGVuKCh2KSA9PiB7XG4gICAgICAgICAgaWYgKHYgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gc3RvcmFnZS5yZWFkKHRoaXMsIHRoaXMuJGlkKVxuICAgICAgICAgICAgLnRoZW4oKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbJHN0b3JlXVtrZXldO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSwgUHJvbWlzZS5yZXNvbHZlKG51bGwpKTtcbiAgICB9XG4gIH1cblxuICAkc2V0KHVwZGF0ZSkge1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh1cGRhdGUpO1xuICAgIHJldHVybiBQcm9taXNlLmFsbCh0aGlzLmNvbnN0cnVjdG9yLiRzdG9yYWdlLm1hcCgoc3RvcmFnZSkgPT4ge1xuICAgICAgcmV0dXJuIHN0b3JhZ2UudXBkYXRlKHRoaXMsIHVwZGF0ZSk7XG4gICAgfSkpO1xuICB9XG5cbiAgJGFkZChrZXksIGl0ZW0pIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPiAxKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwodGhpcy5jb25zdHJ1Y3Rvci4kc3RvcmFnZS5tYXAoKHN0b3JhZ2UpID0+IHtcbiAgICAgICAgICByZXR1cm4gc3RvcmFnZS4kYWRkKHRoaXMsIGtleSwgaXRlbSk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSBhZGRlZCB0byBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkcmVtb3ZlKGtleSwgaXRlbSkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+IDEpKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbCh0aGlzLmNvbnN0cnVjdG9yLiRzdG9yYWdlLm1hcCgoc3RvcmFnZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBzdG9yYWdlLiRyZW1vdmUodGhpcywga2V5LCBpdGVtKTtcbiAgICAgICAgfSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtICRyZW1vdmVkIGZyb20gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRyZW1vdmUgZXhjZXB0IGZyb20gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cbn1cblxuTW9kZWwuJGlkID0gJ2lkJztcbk1vZGVsLiRuYW1lID0gJ0Jhc2UnO1xuTW9kZWwuJGZpZWxkcyA9IHtcbiAgaWQ6IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbn07XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
