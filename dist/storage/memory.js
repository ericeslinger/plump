'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MemoryStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MemoryStorage = exports.MemoryStorage = function () {
  function MemoryStorage() {
    _classCallCheck(this, MemoryStorage);

    this._storage = [];
  }

  _createClass(MemoryStorage, [{
    key: '$ensure',
    value: function $ensure(t) {
      if (this._storage[t] === undefined) {
        this._storage[t] = {};
      }
      return this._storage[t];
    }
  }, {
    key: 'create',
    value: function create(t, v) {
      if (this.$ensure(t)[v.id] === undefined) {
        this.$ensure(t)[v.id] = v;
        return Promise.resolve(v);
      } else {
        return Promise.reject(new Error('Cannot overwrite existing value in memstore'));
      }
    }
  }, {
    key: 'read',
    value: function read(t, id) {
      if (this.$ensure(t) === undefined) {
        return Promise.reject(new Error('cannot find storage for type ' + t));
      } else {
        return Promise.resolve(this.$ensure(t)[id] || null);
      }
    }
  }, {
    key: 'update',
    value: function update(t, id, v) {
      if (this.$ensure(t) === undefined) {
        return Promise.reject(new Error('cannot find storage for type ' + t));
      } else {
        this.$ensure(t)[id] = v;
        return Promise.resolve(this.$ensure(t)[id]);
      }
    }
  }, {
    key: 'delete',
    value: function _delete(t, id) {
      if (this.$ensure(t) === undefined) {
        return Promise.reject(new Error('cannot find storage for type ' + t));
      } else {
        var retVal = this.$ensure(t)[id];
        delete this.$ensure(t)[id];
        return Promise.resolve(retVal);
      }
    }
  }, {
    key: 'query',
    value: function query() {
      return Promise.reject('Query interface not supported on MemoryStorage');
    }
  }]);

  return MemoryStorage;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvbWVtb3J5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQUFZLE87Ozs7OztJQUVDLGEsV0FBQSxhO0FBRVgsMkJBQWM7QUFBQTs7QUFDWixTQUFLLFFBQUwsR0FBZ0IsRUFBaEI7QUFDRDs7Ozs0QkFFTyxDLEVBQUc7QUFDVCxVQUFJLEtBQUssUUFBTCxDQUFjLENBQWQsTUFBcUIsU0FBekIsRUFBb0M7QUFDbEMsYUFBSyxRQUFMLENBQWMsQ0FBZCxJQUFtQixFQUFuQjtBQUNEO0FBQ0QsYUFBTyxLQUFLLFFBQUwsQ0FBYyxDQUFkLENBQVA7QUFDRDs7OzJCQUVNLEMsRUFBRyxDLEVBQUc7QUFDWCxVQUFJLEtBQUssT0FBTCxDQUFhLENBQWIsRUFBZ0IsRUFBRSxFQUFsQixNQUEwQixTQUE5QixFQUF5QztBQUN2QyxhQUFLLE9BQUwsQ0FBYSxDQUFiLEVBQWdCLEVBQUUsRUFBbEIsSUFBd0IsQ0FBeEI7QUFDQSxlQUFPLFFBQVEsT0FBUixDQUFnQixDQUFoQixDQUFQO0FBQ0QsT0FIRCxNQUdPO0FBQ0wsZUFBTyxRQUFRLE1BQVIsQ0FBZSxJQUFJLEtBQUosQ0FBVSw2Q0FBVixDQUFmLENBQVA7QUFDRDtBQUNGOzs7eUJBRUksQyxFQUFHLEUsRUFBSTtBQUNWLFVBQUksS0FBSyxPQUFMLENBQWEsQ0FBYixNQUFvQixTQUF4QixFQUFtQztBQUNqQyxlQUFPLFFBQVEsTUFBUixDQUFlLElBQUksS0FBSixtQ0FBMEMsQ0FBMUMsQ0FBZixDQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBTyxRQUFRLE9BQVIsQ0FBZ0IsS0FBSyxPQUFMLENBQWEsQ0FBYixFQUFnQixFQUFoQixLQUF1QixJQUF2QyxDQUFQO0FBQ0Q7QUFDRjs7OzJCQUVNLEMsRUFBRyxFLEVBQUksQyxFQUFHO0FBQ2YsVUFBSSxLQUFLLE9BQUwsQ0FBYSxDQUFiLE1BQW9CLFNBQXhCLEVBQW1DO0FBQ2pDLGVBQU8sUUFBUSxNQUFSLENBQWUsSUFBSSxLQUFKLG1DQUEwQyxDQUExQyxDQUFmLENBQVA7QUFDRCxPQUZELE1BRU87QUFDTCxhQUFLLE9BQUwsQ0FBYSxDQUFiLEVBQWdCLEVBQWhCLElBQXNCLENBQXRCO0FBQ0EsZUFBTyxRQUFRLE9BQVIsQ0FBZ0IsS0FBSyxPQUFMLENBQWEsQ0FBYixFQUFnQixFQUFoQixDQUFoQixDQUFQO0FBQ0Q7QUFDRjs7OzRCQUVNLEMsRUFBRyxFLEVBQUk7QUFDWixVQUFJLEtBQUssT0FBTCxDQUFhLENBQWIsTUFBb0IsU0FBeEIsRUFBbUM7QUFDakMsZUFBTyxRQUFRLE1BQVIsQ0FBZSxJQUFJLEtBQUosbUNBQTBDLENBQTFDLENBQWYsQ0FBUDtBQUNELE9BRkQsTUFFTztBQUNMLFlBQU0sU0FBUyxLQUFLLE9BQUwsQ0FBYSxDQUFiLEVBQWdCLEVBQWhCLENBQWY7QUFDQSxlQUFPLEtBQUssT0FBTCxDQUFhLENBQWIsRUFBZ0IsRUFBaEIsQ0FBUDtBQUNBLGVBQU8sUUFBUSxPQUFSLENBQWdCLE1BQWhCLENBQVA7QUFDRDtBQUNGOzs7NEJBRU87QUFDTixhQUFPLFFBQVEsTUFBUixDQUFlLGdEQUFmLENBQVA7QUFDRCIsImZpbGUiOiJzdG9yYWdlL21lbW9yeS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuXG5leHBvcnQgY2xhc3MgTWVtb3J5U3RvcmFnZSB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fc3RvcmFnZSA9IFtdO1xuICB9XG5cbiAgJGVuc3VyZSh0KSB7XG4gICAgaWYgKHRoaXMuX3N0b3JhZ2VbdF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5fc3RvcmFnZVt0XSA9IHt9O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fc3RvcmFnZVt0XTtcbiAgfVxuXG4gIGNyZWF0ZSh0LCB2KSB7XG4gICAgaWYgKHRoaXMuJGVuc3VyZSh0KVt2LmlkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLiRlbnN1cmUodClbdi5pZF0gPSB2O1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh2KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90IG92ZXJ3cml0ZSBleGlzdGluZyB2YWx1ZSBpbiBtZW1zdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICByZWFkKHQsIGlkKSB7XG4gICAgaWYgKHRoaXMuJGVuc3VyZSh0KSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGBjYW5ub3QgZmluZCBzdG9yYWdlIGZvciB0eXBlICR7dH1gKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy4kZW5zdXJlKHQpW2lkXSB8fCBudWxsKTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGUodCwgaWQsIHYpIHtcbiAgICBpZiAodGhpcy4kZW5zdXJlKHQpID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYGNhbm5vdCBmaW5kIHN0b3JhZ2UgZm9yIHR5cGUgJHt0fWApKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kZW5zdXJlKHQpW2lkXSA9IHY7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuJGVuc3VyZSh0KVtpZF0pO1xuICAgIH1cbiAgfVxuXG4gIGRlbGV0ZSh0LCBpZCkge1xuICAgIGlmICh0aGlzLiRlbnN1cmUodCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihgY2Fubm90IGZpbmQgc3RvcmFnZSBmb3IgdHlwZSAke3R9YCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZXRWYWwgPSB0aGlzLiRlbnN1cmUodClbaWRdO1xuICAgICAgZGVsZXRlIHRoaXMuJGVuc3VyZSh0KVtpZF07XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJldFZhbCk7XG4gICAgfVxuICB9XG5cbiAgcXVlcnkoKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCdRdWVyeSBpbnRlcmZhY2Ugbm90IHN1cHBvcnRlZCBvbiBNZW1vcnlTdG9yYWdlJyk7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
