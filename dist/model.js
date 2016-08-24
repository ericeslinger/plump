'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Promise = require('bluebird');

var Model = exports.Model = function () {
  function Model() {
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Model);

    if (opts.id) {
      this._id = opts.id;
    } else {
      this.set(opts);
    }
  }

  _createClass(Model, [{
    key: 'set',
    value: function set(a, val) {
      var _this = this;

      if (typeof a === 'string') {
        this._storage[a] = val;
      } else {
        Object.keys(a).forEach(function (k) {
          _this._storage[k] = a[k];
        });
      }
    }
  }, {
    key: 'getStorageServices',
    value: function getStorageServices() {
      return this.constructor._storageServices;
    }
  }, {
    key: 'resolve',
    value: function resolve(key) {
      var _this2 = this;

      if (this._storage[key]) {
        return Promise.resolve(this._storage[key]);
      } else {
        return this.getStorageServices().reduce(function (thenable, service) {
          return thenable.then(function (v) {
            if (v === null) {
              return service.read(_this2.tableName, _this2._id);
            } else {
              return v;
            }
          });
        }, Promise.resolve(null));
      }
    }
  }]);

  return Model;
}();

/*
  annotate attribute to denote model info. use get/set to store.
  expose get/set on lifecycle hooks, also use updated etc.

  POSSIBLY make this unsettable - only do on update({attr: val})

  HANDLE push / pull sql and http
  HANDLE cache mem, redis, localforage
*/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxJQUFNLFVBQVUsUUFBUSxVQUFSLENBQWhCOztJQUVhLEssV0FBQSxLO0FBQ1gsbUJBQXVCO0FBQUEsUUFBWCxJQUFXLHlEQUFKLEVBQUk7O0FBQUE7O0FBQ3JCLFFBQUksS0FBSyxFQUFULEVBQWE7QUFDWCxXQUFLLEdBQUwsR0FBVyxLQUFLLEVBQWhCO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsV0FBSyxHQUFMLENBQVMsSUFBVDtBQUNEO0FBQ0Y7Ozs7d0JBRUcsQyxFQUFHLEcsRUFBSztBQUFBOztBQUNWLFVBQUksT0FBTyxDQUFQLEtBQWEsUUFBakIsRUFBMkI7QUFDekIsYUFBSyxRQUFMLENBQWMsQ0FBZCxJQUFtQixHQUFuQjtBQUNELE9BRkQsTUFFTztBQUNMLGVBQU8sSUFBUCxDQUFZLENBQVosRUFBZSxPQUFmLENBQXVCLFVBQUMsQ0FBRCxFQUFPO0FBQzVCLGdCQUFLLFFBQUwsQ0FBYyxDQUFkLElBQW1CLEVBQUUsQ0FBRixDQUFuQjtBQUNELFNBRkQ7QUFHRDtBQUNGOzs7eUNBRW9CO0FBQ25CLGFBQU8sS0FBSyxXQUFMLENBQWlCLGdCQUF4QjtBQUNEOzs7NEJBRU8sRyxFQUFLO0FBQUE7O0FBQ1gsVUFBSSxLQUFLLFFBQUwsQ0FBYyxHQUFkLENBQUosRUFBd0I7QUFDdEIsZUFBTyxRQUFRLE9BQVIsQ0FBZ0IsS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFoQixDQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBTyxLQUFLLGtCQUFMLEdBQTBCLE1BQTFCLENBQWlDLFVBQUMsUUFBRCxFQUFXLE9BQVgsRUFBdUI7QUFDN0QsaUJBQU8sU0FBUyxJQUFULENBQWMsVUFBQyxDQUFELEVBQU87QUFDMUIsZ0JBQUksTUFBTSxJQUFWLEVBQWdCO0FBQ2QscUJBQU8sUUFBUSxJQUFSLENBQWEsT0FBSyxTQUFsQixFQUE2QixPQUFLLEdBQWxDLENBQVA7QUFDRCxhQUZELE1BRU87QUFDTCxxQkFBTyxDQUFQO0FBQ0Q7QUFDRixXQU5NLENBQVA7QUFPRCxTQVJNLEVBUUosUUFBUSxPQUFSLENBQWdCLElBQWhCLENBUkksQ0FBUDtBQVNEO0FBQ0Y7Ozs7OztBQUdIIiwiZmlsZSI6Im1vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgUHJvbWlzZSA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5cbmV4cG9ydCBjbGFzcyBNb2RlbCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIGlmIChvcHRzLmlkKSB7XG4gICAgICB0aGlzLl9pZCA9IG9wdHMuaWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2V0KG9wdHMpO1xuICAgIH1cbiAgfVxuXG4gIHNldChhLCB2YWwpIHtcbiAgICBpZiAodHlwZW9mIGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLl9zdG9yYWdlW2FdID0gdmFsO1xuICAgIH0gZWxzZSB7XG4gICAgICBPYmplY3Qua2V5cyhhKS5mb3JFYWNoKChrKSA9PiB7XG4gICAgICAgIHRoaXMuX3N0b3JhZ2Vba10gPSBhW2tdO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0U3RvcmFnZVNlcnZpY2VzKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLl9zdG9yYWdlU2VydmljZXM7XG4gIH1cblxuICByZXNvbHZlKGtleSkge1xuICAgIGlmICh0aGlzLl9zdG9yYWdlW2tleV0pIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fc3RvcmFnZVtrZXldKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0U3RvcmFnZVNlcnZpY2VzKCkucmVkdWNlKCh0aGVuYWJsZSwgc2VydmljZSkgPT4ge1xuICAgICAgICByZXR1cm4gdGhlbmFibGUudGhlbigodikgPT4ge1xuICAgICAgICAgIGlmICh2ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VydmljZS5yZWFkKHRoaXMudGFibGVOYW1lLCB0aGlzLl9pZCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9LCBQcm9taXNlLnJlc29sdmUobnVsbCkpO1xuICAgIH1cbiAgfVxufVxuXG4vKlxuICBhbm5vdGF0ZSBhdHRyaWJ1dGUgdG8gZGVub3RlIG1vZGVsIGluZm8uIHVzZSBnZXQvc2V0IHRvIHN0b3JlLlxuICBleHBvc2UgZ2V0L3NldCBvbiBsaWZlY3ljbGUgaG9va3MsIGFsc28gdXNlIHVwZGF0ZWQgZXRjLlxuXG4gIFBPU1NJQkxZIG1ha2UgdGhpcyB1bnNldHRhYmxlIC0gb25seSBkbyBvbiB1cGRhdGUoe2F0dHI6IHZhbH0pXG5cbiAgSEFORExFIHB1c2ggLyBwdWxsIHNxbCBhbmQgaHR0cFxuICBIQU5ETEUgY2FjaGUgbWVtLCByZWRpcywgbG9jYWxmb3JhZ2VcbiovXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
