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
    key: '$save',
    value: function $save() {
      var _this3 = this;

      return Promise.all(this.constructor.$storage.map(function (storage) {
        return storage.write(_this3.constructor, _this3[$store]);
      }));
    }
  }, {
    key: '$set',
    value: function $set(update) {
      var _this4 = this;

      this.$$copyValuesFrom(update); // this is the optimistic update;
      return Promise.all(this.constructor.$storage.map(function (storage) {
        return storage.write(_this4.constructor, update);
      }));
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
//# sourceMappingURL=data:application/json;base64,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QUFDRCxTQUZELE1BRU87QUFDTCxlQUFLLEtBQUssR0FBVjtBQUNEO0FBQ0QsWUFBSyxPQUFPLEVBQVAsS0FBYyxRQUFmLElBQTZCLEtBQUssQ0FBdEMsRUFBMEM7QUFDeEMsaUJBQU8sUUFBUSxHQUFSLENBQVksS0FBSyxXQUFMLENBQWlCLFFBQWpCLENBQTBCLEdBQTFCLENBQThCLFVBQUMsT0FBRCxFQUFhO0FBQzVELG1CQUFPLFFBQVEsTUFBUixDQUFlLE9BQUssV0FBcEIsRUFBaUMsT0FBSyxHQUF0QyxFQUEyQyxHQUEzQyxFQUFnRCxJQUFoRCxDQUFQO0FBQ0QsV0FGa0IsQ0FBWixDQUFQO0FBR0QsU0FKRCxNQUlPO0FBQ0wsaUJBQU8sUUFBUSxNQUFSLENBQWUsSUFBSSxLQUFKLENBQVUsb0NBQVYsQ0FBZixDQUFQO0FBQ0Q7QUFDRixPQWRELE1BY087QUFDTCxlQUFPLFFBQVEsTUFBUixDQUFlLElBQUksS0FBSixDQUFVLDBDQUFWLENBQWYsQ0FBUDtBQUNEO0FBQ0Y7Ozt3QkFyR1c7QUFDVixhQUFPLEtBQUssV0FBTCxDQUFpQixLQUF4QjtBQUNEOzs7d0JBRVM7QUFDUixhQUFPLEtBQUssTUFBTCxFQUFhLEtBQUssV0FBTCxDQUFpQixHQUE5QixDQUFQO0FBQ0Q7Ozs7OztBQWtHSCxNQUFNLEdBQU4sR0FBWSxJQUFaO0FBQ0EsTUFBTSxLQUFOLEdBQWMsTUFBZDtBQUNBLE1BQU0sT0FBTixHQUFnQjtBQUNkLE1BQUk7QUFDRixVQUFNO0FBREo7QUFEVSxDQUFoQiIsImZpbGUiOiJtb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IFByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuY29uc3QgJHN0b3JlID0gU3ltYm9sKCckc3RvcmUnKTtcblxuLy8gVE9ETzogZmlndXJlIG91dCB3aGVyZSBlcnJvciBldmVudHMgb3JpZ2luYXRlIChzdG9yYWdlIG9yIG1vZGVsKVxuLy8gYW5kIHdobyBrZWVwcyBhIHJvbGwtYmFja2FibGUgZGVsdGFcblxuZXhwb3J0IGNsYXNzIE1vZGVsIHtcbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgdGhpc1skc3RvcmVdID0ge307XG4gICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKG9wdHMpO1xuICB9XG5cbiAgZ2V0ICRuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLiRuYW1lO1xuICB9XG5cbiAgZ2V0ICRpZCgpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmVdW3RoaXMuY29uc3RydWN0b3IuJGlkXTtcbiAgfVxuXG4gICQkY29weVZhbHVlc0Zyb20ob3B0cyA9IHt9KSB7XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChmaWVsZE5hbWUpID0+IHtcbiAgICAgIGlmIChvcHRzW2ZpZWxkTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBjb3B5IGZyb20gb3B0cyB0byB0aGUgYmVzdCBvZiBvdXIgYWJpbGl0eVxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdhcnJheScpIHx8XG4gICAgICAgICAgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdoYXNNYW55JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBvcHRzW2ZpZWxkTmFtZV0uY29uY2F0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IE9iamVjdC5hc3NpZ24oe30sIG9wdHNbZmllbGROYW1lXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBvcHRzW2ZpZWxkTmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICRnZXQoa2V5KSB7XG4gICAgaWYgKHRoaXNbJHN0b3JlXVtrZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpc1skc3RvcmVdW2tleV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci4kc3RvcmFnZS5yZWR1Y2UoKHRoZW5hYmxlLCBzdG9yYWdlKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGVuYWJsZS50aGVuKCh2KSA9PiB7XG4gICAgICAgICAgaWYgKHYgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gc3RvcmFnZS5yZWFkKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkKVxuICAgICAgICAgICAgLnRoZW4oKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbJHN0b3JlXVtrZXldO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSwgUHJvbWlzZS5yZXNvbHZlKG51bGwpKTtcbiAgICB9XG4gIH1cblxuICAkc2F2ZSgpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwodGhpcy5jb25zdHJ1Y3Rvci4kc3RvcmFnZS5tYXAoKHN0b3JhZ2UpID0+IHtcbiAgICAgIHJldHVybiBzdG9yYWdlLndyaXRlKHRoaXMuY29uc3RydWN0b3IsIHRoaXNbJHN0b3JlXSk7XG4gICAgfSkpO1xuICB9XG5cbiAgJHNldCh1cGRhdGUpIHtcbiAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odXBkYXRlKTsgLy8gdGhpcyBpcyB0aGUgb3B0aW1pc3RpYyB1cGRhdGU7XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHRoaXMuY29uc3RydWN0b3IuJHN0b3JhZ2UubWFwKChzdG9yYWdlKSA9PiB7XG4gICAgICByZXR1cm4gc3RvcmFnZS53cml0ZSh0aGlzLmNvbnN0cnVjdG9yLCB1cGRhdGUpO1xuICAgIH0pKTtcbiAgfVxuXG4gICRhZGQoa2V5LCBpdGVtKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID4gMSkpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHRoaXMuY29uc3RydWN0b3IuJHN0b3JhZ2UubWFwKChzdG9yYWdlKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JhZ2UuYWRkKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGl0ZW0pO1xuICAgICAgICB9KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gYWRkZWQgdG8gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRhZGQgZXhjZXB0IHRvIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG5cbiAgJHJlbW92ZShrZXksIGl0ZW0pIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPiAxKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwodGhpcy5jb25zdHJ1Y3Rvci4kc3RvcmFnZS5tYXAoKHN0b3JhZ2UpID0+IHtcbiAgICAgICAgICByZXR1cm4gc3RvcmFnZS5yZW1vdmUodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaXRlbSk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSAkcmVtb3ZlZCBmcm9tIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkcmVtb3ZlIGV4Y2VwdCBmcm9tIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG59XG5cbk1vZGVsLiRpZCA9ICdpZCc7XG5Nb2RlbC4kbmFtZSA9ICdCYXNlJztcbk1vZGVsLiRmaWVsZHMgPSB7XG4gIGlkOiB7XG4gICAgdHlwZTogJ251bWJlcicsXG4gIH0sXG59O1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
