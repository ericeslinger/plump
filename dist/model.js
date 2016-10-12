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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIlByb21pc2UiLCIkc3RvcmUiLCJTeW1ib2wiLCIkZ3VpbGQiLCIkbG9hZGVkIiwiJHVuc3Vic2NyaWJlIiwiTW9kZWwiLCJvcHRzIiwiZ3VpbGQiLCIkJGNvcHlWYWx1ZXNGcm9tIiwiJCRjb25uZWN0VG9HdWlsZCIsInN1YnNjcmliZSIsImNvbnN0cnVjdG9yIiwiJG5hbWUiLCIkaWQiLCJ2IiwiT2JqZWN0Iiwia2V5cyIsIiRmaWVsZHMiLCJmb3JFYWNoIiwiZmllbGROYW1lIiwidW5kZWZpbmVkIiwidHlwZSIsImNvbmNhdCIsImFzc2lnbiIsImtleSIsInJlc29sdmUiLCJ0aGVuIiwiaGFzIiwiZ2V0Iiwib3B0aW9ucyIsInNlbGYiLCJnZXRTZWxmIiwiZGF0YSIsIiRzZXQiLCJ1cGRhdGUiLCJzYXZlIiwiaXRlbSIsImlkIiwiYWxsIiwiJHN0b3JhZ2UiLCJtYXAiLCJzdG9yYWdlIiwiYWRkIiwicmVqZWN0IiwiRXJyb3IiLCJyZW1vdmUiLCJ1bnN1YnNjcmliZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0lBQVlBLE87Ozs7OztBQUNaLElBQU1DLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUMsU0FBU0QsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNRSxVQUFVRixPQUFPLFNBQVAsQ0FBaEI7QUFDQSxJQUFNRyxlQUFlSCxPQUFPLGNBQVAsQ0FBckI7O0FBRUE7QUFDQTs7SUFFYUksSyxXQUFBQSxLO0FBQ1gsaUJBQVlDLElBQVosRUFBa0JDLEtBQWxCLEVBQXlCO0FBQUE7O0FBQ3ZCLFNBQUtQLE1BQUwsSUFBZSxFQUFmO0FBQ0EsU0FBS1EsZ0JBQUwsQ0FBc0JGLFFBQVEsRUFBOUI7QUFDQSxTQUFLSCxPQUFMLElBQWdCLEtBQWhCO0FBQ0EsUUFBSUksS0FBSixFQUFXO0FBQ1QsV0FBS0UsZ0JBQUwsQ0FBc0JGLEtBQXRCO0FBQ0Q7QUFDRjs7OztxQ0FFZ0JBLEssRUFBTztBQUFBOztBQUN0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QWF5QixHQUFiLENBQWlCLEtBQUtoQixXQUF0QixFQUFtQyxLQUFLRSxHQUF4QyxFQUE2Q1csR0FBN0MsQ0FBUDtBQUNELE9BRkQsTUFFTztBQUNMLGVBQU96QixRQUFRNEMsTUFBUixDQUFlLElBQUlDLEtBQUosQ0FBVSx5Q0FBVixDQUFmLENBQVA7QUFDRDtBQUNGOzs7Z0NBRVc7QUFDVixXQUFLeEMsWUFBTCxFQUFtQjBDLFdBQW5CO0FBQ0Q7Ozt3QkFsSVc7QUFDVixhQUFPLEtBQUtuQyxXQUFMLENBQWlCQyxLQUF4QjtBQUNEOzs7d0JBRVM7QUFDUixhQUFPLEtBQUtaLE1BQUwsRUFBYSxLQUFLVyxXQUFMLENBQWlCRSxHQUE5QixDQUFQO0FBQ0Q7Ozs7OztBQWdJSFIsTUFBTVEsR0FBTixHQUFZLElBQVo7QUFDQVIsTUFBTU8sS0FBTixHQUFjLE1BQWQ7QUFDQVAsTUFBTVksT0FBTixHQUFnQjtBQUNkb0IsTUFBSTtBQUNGaEIsVUFBTTtBQURKO0FBRFUsQ0FBaEIiLCJmaWxlIjoibW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmNvbnN0ICRzdG9yZSA9IFN5bWJvbCgnJHN0b3JlJyk7XG5jb25zdCAkZ3VpbGQgPSBTeW1ib2woJyRndWlsZCcpO1xuY29uc3QgJGxvYWRlZCA9IFN5bWJvbCgnJGxvYWRlZCcpO1xuY29uc3QgJHVuc3Vic2NyaWJlID0gU3ltYm9sKCckdW5zdWJzY3JpYmUnKTtcblxuLy8gVE9ETzogZmlndXJlIG91dCB3aGVyZSBlcnJvciBldmVudHMgb3JpZ2luYXRlIChzdG9yYWdlIG9yIG1vZGVsKVxuLy8gYW5kIHdobyBrZWVwcyBhIHJvbGwtYmFja2FibGUgZGVsdGFcblxuZXhwb3J0IGNsYXNzIE1vZGVsIHtcbiAgY29uc3RydWN0b3Iob3B0cywgZ3VpbGQpIHtcbiAgICB0aGlzWyRzdG9yZV0gPSB7fTtcbiAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20ob3B0cyB8fCB7fSk7XG4gICAgdGhpc1skbG9hZGVkXSA9IGZhbHNlO1xuICAgIGlmIChndWlsZCkge1xuICAgICAgdGhpcy4kJGNvbm5lY3RUb0d1aWxkKGd1aWxkKTtcbiAgICB9XG4gIH1cblxuICAkJGNvbm5lY3RUb0d1aWxkKGd1aWxkKSB7XG4gICAgdGhpc1skZ3VpbGRdID0gZ3VpbGQ7XG4gICAgdGhpc1skdW5zdWJzY3JpYmVdID0gZ3VpbGQuc3Vic2NyaWJlKHRoaXMuY29uc3RydWN0b3IuJG5hbWUsIHRoaXMuJGlkLCAodikgPT4ge1xuICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHYpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0ICRuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLiRuYW1lO1xuICB9XG5cbiAgZ2V0ICRpZCgpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmVdW3RoaXMuY29uc3RydWN0b3IuJGlkXTtcbiAgfVxuXG4gICQkY29weVZhbHVlc0Zyb20ob3B0cyA9IHt9KSB7XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChmaWVsZE5hbWUpID0+IHtcbiAgICAgIGlmIChvcHRzW2ZpZWxkTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBjb3B5IGZyb20gb3B0cyB0byB0aGUgYmVzdCBvZiBvdXIgYWJpbGl0eVxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdhcnJheScpIHx8XG4gICAgICAgICAgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdoYXNNYW55JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBvcHRzW2ZpZWxkTmFtZV0uY29uY2F0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IE9iamVjdC5hc3NpZ24oe30sIG9wdHNbZmllbGROYW1lXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBvcHRzW2ZpZWxkTmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIFRPRE86IGRvbid0IGZldGNoIGlmIHdlICRnZXQoKSBzb21ldGhpbmcgdGhhdCB3ZSBhbHJlYWR5IGhhdmVcblxuICAkZ2V0KGtleSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmIChcbiAgICAgICAgKCh0aGlzWyRsb2FkZWRdID09PSB0cnVlKSAmJiAoa2V5ID09PSB1bmRlZmluZWQpKSB8fFxuICAgICAgICAodGhpc1skc3RvcmVdW2tleV0gPT09IHVuZGVmaW5lZClcbiAgICAgICkge1xuICAgICAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJGd1aWxkXS5oYXModGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJGd1aWxkXS5nZXQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KS50aGVuKCh2KSA9PiB7XG4gICAgICBpZiAodiA9PT0gdHJ1ZSkge1xuICAgICAgICByZXR1cm4gdGhpc1skc3RvcmVdW2tleV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odik7XG4gICAgICAgIHRoaXNbJGxvYWRlZF0gPSB0cnVlO1xuICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHN0b3JlXVtrZXldO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCB0aGlzWyRzdG9yZV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAkbG9hZChvcHRzID0ge30pIHtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwge3NlbGY6IHRydWV9LCBvcHRzKTtcbiAgICBpZiAob3B0aW9ucy5zZWxmKSB7XG4gICAgICB0aGlzLmdldFNlbGYoKVxuICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKGRhdGEpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgJHNhdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHNldCgpO1xuICB9XG5cbiAgJHNldCh1cGRhdGUgPSB0aGlzWyRzdG9yZV0pIHtcbiAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odXBkYXRlKTsgLy8gdGhpcyBpcyB0aGUgb3B0aW1pc3RpYyB1cGRhdGU7XG4gICAgcmV0dXJuIHRoaXNbJGd1aWxkXS5zYXZlKHRoaXMuY29uc3RydWN0b3IsIHVwZGF0ZSk7XG4gICAgLy8gLnRoZW4oKHVwZGF0ZXMpID0+IHtcbiAgICAvLyAgIHJldHVybiB1cGRhdGVzO1xuICAgIC8vIH0pO1xuICB9XG5cbiAgJGFkZChrZXksIGl0ZW0pIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPiAxKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwodGhpcy5jb25zdHJ1Y3Rvci4kc3RvcmFnZS5tYXAoKHN0b3JhZ2UpID0+IHtcbiAgICAgICAgICByZXR1cm4gc3RvcmFnZS5hZGQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaXRlbSk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSBhZGRlZCB0byBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkcmVtb3ZlKGtleSwgaXRlbSkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+IDEpKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbCh0aGlzLmNvbnN0cnVjdG9yLiRzdG9yYWdlLm1hcCgoc3RvcmFnZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBzdG9yYWdlLnJlbW92ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpdGVtKTtcbiAgICAgICAgfSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtICRyZW1vdmVkIGZyb20gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRyZW1vdmUgZXhjZXB0IGZyb20gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkaGFzKGtleSkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIHJldHVybiB0aGlzWyRndWlsZF0uaGFzKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGhhcyBvbmx5IHZhbGlkIG9uIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG5cbiAgJHRlYXJkb3duKCkge1xuICAgIHRoaXNbJHVuc3Vic2NyaWJlXS51bnN1YnNjcmliZSgpO1xuICB9XG5cbn1cblxuTW9kZWwuJGlkID0gJ2lkJztcbk1vZGVsLiRuYW1lID0gJ0Jhc2UnO1xuTW9kZWwuJGZpZWxkcyA9IHtcbiAgaWQ6IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbn07XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
