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
      return this.$set();
    }
  }, {
    key: '$set',
    value: function $set() {
      var _this3 = this;

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
        return Promise.all(_this3.constructor.$storage.map(function (storage) {
          if (storage !== skipTerminal) {
            return storage.write(_this3.constructor, toUpdate);
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
            return storage.add(_this4.constructor, _this4.$id, key, item);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIlByb21pc2UiLCJyZXF1aXJlIiwiJHN0b3JlIiwiU3ltYm9sIiwiTW9kZWwiLCJvcHRzIiwiJCRjb3B5VmFsdWVzRnJvbSIsIk9iamVjdCIsImtleXMiLCJjb25zdHJ1Y3RvciIsIiRmaWVsZHMiLCJmb3JFYWNoIiwiZmllbGROYW1lIiwidW5kZWZpbmVkIiwidHlwZSIsImNvbmNhdCIsImFzc2lnbiIsImtleSIsInJlc29sdmUiLCIkc3RvcmFnZSIsInJlZHVjZSIsInRoZW5hYmxlIiwic3RvcmFnZSIsInRoZW4iLCJ2IiwicmVhZCIsIiRpZCIsInZhbHVlIiwiJHNldCIsInVwZGF0ZSIsInNldHVwUHJvbWlzZSIsInNraXBUZXJtaW5hbCIsInRlcm1pbmFscyIsImZpbHRlciIsInMiLCJ0ZXJtaW5hbCIsImxlbmd0aCIsIndyaXRlIiwicmVqZWN0IiwiRXJyb3IiLCJ0b1VwZGF0ZSIsImFsbCIsIm1hcCIsInVwZGF0ZXMiLCJpdGVtIiwiaWQiLCJhZGQiLCJyZW1vdmUiLCIkbmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLElBQU1BLFVBQVVDLFFBQVEsVUFBUixDQUFoQjtBQUNBLElBQU1DLFNBQVNDLE9BQU8sUUFBUCxDQUFmOztBQUVBO0FBQ0E7O0lBRWFDLEssV0FBQUEsSztBQUNYLG1CQUF1QjtBQUFBLFFBQVhDLElBQVcseURBQUosRUFBSTs7QUFBQTs7QUFDckIsU0FBS0gsTUFBTCxJQUFlLEVBQWY7QUFDQSxTQUFLSSxnQkFBTCxDQUFzQkQsSUFBdEI7QUFDRDs7Ozt1Q0FVMkI7QUFBQTs7QUFBQSxVQUFYQSxJQUFXLHlEQUFKLEVBQUk7O0FBQzFCRSxhQUFPQyxJQUFQLENBQVksS0FBS0MsV0FBTCxDQUFpQkMsT0FBN0IsRUFBc0NDLE9BQXRDLENBQThDLFVBQUNDLFNBQUQsRUFBZTtBQUMzRCxZQUFJUCxLQUFLTyxTQUFMLE1BQW9CQyxTQUF4QixFQUFtQztBQUNqQztBQUNBLGNBQ0csTUFB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QUFDRDs7Ozs7O0FBa0hIdEIsTUFBTXNCLEdBQU4sR0FBWSxJQUFaO0FBQ0F0QixNQUFNNEMsS0FBTixHQUFjLE1BQWQ7QUFDQTVDLE1BQU1NLE9BQU4sR0FBZ0I7QUFDZG1DLE1BQUk7QUFDRi9CLFVBQU07QUFESjtBQURVLENBQWhCIiwiZmlsZSI6Im1vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgUHJvbWlzZSA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5jb25zdCAkc3RvcmUgPSBTeW1ib2woJyRzdG9yZScpO1xuXG4vLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIGVycm9yIGV2ZW50cyBvcmlnaW5hdGUgKHN0b3JhZ2Ugb3IgbW9kZWwpXG4vLyBhbmQgd2hvIGtlZXBzIGEgcm9sbC1iYWNrYWJsZSBkZWx0YVxuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICB0aGlzWyRzdG9yZV0gPSB7fTtcbiAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20ob3B0cyk7XG4gIH1cblxuICBnZXQgJG5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuJG5hbWU7XG4gIH1cblxuICBnZXQgJGlkKCkge1xuICAgIHJldHVybiB0aGlzWyRzdG9yZV1bdGhpcy5jb25zdHJ1Y3Rvci4kaWRdO1xuICB9XG5cbiAgJCRjb3B5VmFsdWVzRnJvbShvcHRzID0ge30pIHtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgaWYgKG9wdHNbZmllbGROYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGNvcHkgZnJvbSBvcHRzIHRvIHRoZSBiZXN0IG9mIG91ciBhYmlsaXR5XG4gICAgICAgIGlmIChcbiAgICAgICAgICAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2FycmF5JykgfHxcbiAgICAgICAgICAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2hhc01hbnknKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IG9wdHNbZmllbGROYW1lXS5jb25jYXQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0c1tmaWVsZE5hbWVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IG9wdHNbZmllbGROYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgJGdldChrZXkpIHtcbiAgICBpZiAodGhpc1skc3RvcmVdW2tleV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzWyRzdG9yZV1ba2V5XSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLiRzdG9yYWdlLnJlZHVjZSgodGhlbmFibGUsIHN0b3JhZ2UpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoZW5hYmxlLnRoZW4oKHYpID0+IHtcbiAgICAgICAgICBpZiAodiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBzdG9yYWdlLnJlYWQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQpXG4gICAgICAgICAgICAudGhlbigodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1skc3RvcmVdW2tleV07XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9LCBQcm9taXNlLnJlc29sdmUobnVsbCkpO1xuICAgIH1cbiAgfVxuXG4gICRzYXZlKCkge1xuICAgIHJldHVybiB0aGlzLiRzZXQoKTtcbiAgfVxuXG4gICRzZXQodXBkYXRlID0gdGhpc1skc3RvcmVdKSB7XG4gICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHVwZGF0ZSk7IC8vIHRoaXMgaXMgdGhlIG9wdGltaXN0aWMgdXBkYXRlO1xuICAgIGxldCBzZXR1cFByb21pc2UgPSBQcm9taXNlLnJlc29sdmUodXBkYXRlKTtcbiAgICBsZXQgc2tpcFRlcm1pbmFsID0gbnVsbDtcbiAgICBpZiAoKHRoaXMuJGlkID09PSB1bmRlZmluZWQpICYmICh1cGRhdGVbdGhpcy5jb25zdHJ1Y3Rvci4kaWRdID09PSB1bmRlZmluZWQpKSB7XG4gICAgICAvLyBuZWVkIHRvIGdldCBhbiBJRC5cbiAgICAgIGNvbnN0IHRlcm1pbmFscyA9IHRoaXMuY29uc3RydWN0b3IuJHN0b3JhZ2UuZmlsdGVyKChzKSA9PiBzLnRlcm1pbmFsKTtcbiAgICAgIGlmICh0ZXJtaW5hbHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHNraXBUZXJtaW5hbCA9IHRlcm1pbmFsc1swXTtcbiAgICAgICAgc2V0dXBQcm9taXNlID0gdGVybWluYWxzWzBdLndyaXRlKHRoaXMuY29uc3RydWN0b3IsIHVwZGF0ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdNb2RlbCBjYW4gb25seSBoYXZlIG9uZSB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNldHVwUHJvbWlzZS50aGVuKCh0b1VwZGF0ZSkgPT4ge1xuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHRoaXMuY29uc3RydWN0b3IuJHN0b3JhZ2UubWFwKChzdG9yYWdlKSA9PiB7XG4gICAgICAgIGlmIChzdG9yYWdlICE9PSBza2lwVGVybWluYWwpIHtcbiAgICAgICAgICByZXR1cm4gc3RvcmFnZS53cml0ZSh0aGlzLmNvbnN0cnVjdG9yLCB0b1VwZGF0ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRvVXBkYXRlO1xuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgfSkudGhlbigodXBkYXRlcykgPT4gdXBkYXRlc1swXSk7XG4gIH1cblxuICAkYWRkKGtleSwgaXRlbSkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+IDEpKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbCh0aGlzLmNvbnN0cnVjdG9yLiRzdG9yYWdlLm1hcCgoc3RvcmFnZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBzdG9yYWdlLmFkZCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpdGVtKTtcbiAgICAgICAgfSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICRyZW1vdmUoa2V5LCBpdGVtKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID4gMSkpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHRoaXMuY29uc3RydWN0b3IuJHN0b3JhZ2UubWFwKChzdG9yYWdlKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JhZ2UucmVtb3ZlKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGl0ZW0pO1xuICAgICAgICB9KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gJHJlbW92ZWQgZnJvbSBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJHJlbW92ZSBleGNlcHQgZnJvbSBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxufVxuXG5Nb2RlbC4kaWQgPSAnaWQnO1xuTW9kZWwuJG5hbWUgPSAnQmFzZSc7XG5Nb2RlbC4kZmllbGRzID0ge1xuICBpZDoge1xuICAgIHR5cGU6ICdudW1iZXInLFxuICB9LFxufTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
