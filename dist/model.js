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
var $self = Symbol('$self');
var $unsubscribe = Symbol('$unsubscribe');

// TODO: figure out where error events originate (storage or model)
// and who keeps a roll-backable delta

var Model = exports.Model = function () {
  function Model() {
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var guild = arguments[1];

    _classCallCheck(this, Model);

    this[$store] = {};
    this.$$copyValuesFrom(opts);
    if (guild) {
      this.connectToGuild(guild);
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
  }, {
    key: '$get',
    value: function $get(key) {
      var _this3 = this;

      if (this[$store][key] !== undefined) {
        return Promise.resolve(this[$store][key]);
      } else {
        return this[$guild].get(this.constructor, this.$id).then(function (v) {
          _this3.$$copyValuesFrom(v);
          return _this3[$store][key];
        });
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
      var _this5 = this;

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
        return Promise.all(_this5.constructor.$storage.map(function (storage) {
          if (storage !== skipTerminal) {
            return storage.write(_this5.constructor, toUpdate);
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
            return storage.add(_this6.constructor, _this6.$id, key, item);
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
      var _this7 = this;

      if (this.constructor.$fields[key].type === 'hasMany') {
        var id = 0;
        if (typeof item === 'number') {
          id = item;
        } else {
          id = item.$id;
        }
        if (typeof id === 'number' && id > 1) {
          return Promise.all(this.constructor.$storage.map(function (storage) {
            return storage.remove(_this7.constructor, _this7.$id, key, item);
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
Model.$self = $self;
Model.$fields = {
  id: {
    type: 'number'
  }
};
//# sourceMappingURL=data:application/json;base64,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aWxlIjoibW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmNvbnN0ICRzdG9yZSA9IFN5bWJvbCgnJHN0b3JlJyk7XG5jb25zdCAkZ3VpbGQgPSBTeW1ib2woJyRndWlsZCcpO1xuY29uc3QgJHNlbGYgPSBTeW1ib2woJyRzZWxmJyk7XG5jb25zdCAkdW5zdWJzY3JpYmUgPSBTeW1ib2woJyR1bnN1YnNjcmliZScpO1xuXG4vLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIGVycm9yIGV2ZW50cyBvcmlnaW5hdGUgKHN0b3JhZ2Ugb3IgbW9kZWwpXG4vLyBhbmQgd2hvIGtlZXBzIGEgcm9sbC1iYWNrYWJsZSBkZWx0YVxuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzID0ge30sIGd1aWxkKSB7XG4gICAgdGhpc1skc3RvcmVdID0ge307XG4gICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKG9wdHMpO1xuICAgIGlmIChndWlsZCkge1xuICAgICAgdGhpcy5jb25uZWN0VG9HdWlsZChndWlsZCk7XG4gICAgfVxuICB9XG5cbiAgJCRjb25uZWN0VG9HdWlsZChndWlsZCkge1xuICAgIHRoaXNbJGd1aWxkXSA9IGd1aWxkO1xuICAgIHRoaXNbJHVuc3Vic2NyaWJlXSA9IGd1aWxkLnN1YnNjcmliZSh0aGlzLmNvbnN0cnVjdG9yLiRuYW1lLCB0aGlzLiRpZCwgKHYpID0+IHtcbiAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldCAkbmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci4kbmFtZTtcbiAgfVxuXG4gIGdldCAkaWQoKSB7XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JlXVt0aGlzLmNvbnN0cnVjdG9yLiRpZF07XG4gIH1cblxuICAkJGNvcHlWYWx1ZXNGcm9tKG9wdHMgPSB7fSkge1xuICAgIE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkcykuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICBpZiAob3B0c1tmaWVsZE5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gY29weSBmcm9tIG9wdHMgdG8gdGhlIGJlc3Qgb2Ygb3VyIGFiaWxpdHlcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnYXJyYXknKSB8fFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnaGFzTWFueScpXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gb3B0c1tmaWVsZE5hbWVdLmNvbmNhdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBPYmplY3QuYXNzaWduKHt9LCBvcHRzW2ZpZWxkTmFtZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gb3B0c1tmaWVsZE5hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAkZ2V0KGtleSkge1xuICAgIGlmICh0aGlzWyRzdG9yZV1ba2V5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXNbJHN0b3JlXVtrZXldKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXNbJGd1aWxkXS5nZXQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQpXG4gICAgICAudGhlbigodikgPT4ge1xuICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20odik7XG4gICAgICAgIHJldHVybiB0aGlzWyRzdG9yZV1ba2V5XTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gICRsb2FkKG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB7c2VsZjogdHJ1ZX0sIG9wdHMpO1xuICAgIGlmIChvcHRpb25zLnNlbGYpIHtcbiAgICAgIHRoaXMuZ2V0U2VsZigpXG4gICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20oZGF0YSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAkc2F2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy4kc2V0KCk7XG4gIH1cblxuICAkc2V0KHVwZGF0ZSA9IHRoaXNbJHN0b3JlXSkge1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh1cGRhdGUpOyAvLyB0aGlzIGlzIHRoZSBvcHRpbWlzdGljIHVwZGF0ZTtcbiAgICBsZXQgc2V0dXBQcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKHVwZGF0ZSk7XG4gICAgbGV0IHNraXBUZXJtaW5hbCA9IG51bGw7XG4gICAgaWYgKCh0aGlzLiRpZCA9PT0gdW5kZWZpbmVkKSAmJiAodXBkYXRlW3RoaXMuY29uc3RydWN0b3IuJGlkXSA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgLy8gbmVlZCB0byBnZXQgYW4gSUQuXG4gICAgICBjb25zdCB0ZXJtaW5hbHMgPSB0aGlzLmNvbnN0cnVjdG9yLiRzdG9yYWdlLmZpbHRlcigocykgPT4gcy50ZXJtaW5hbCk7XG4gICAgICBpZiAodGVybWluYWxzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBza2lwVGVybWluYWwgPSB0ZXJtaW5hbHNbMF07XG4gICAgICAgIHNldHVwUHJvbWlzZSA9IHRlcm1pbmFsc1swXS53cml0ZSh0aGlzLmNvbnN0cnVjdG9yLCB1cGRhdGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignTW9kZWwgY2FuIG9ubHkgaGF2ZSBvbmUgdGVybWluYWwgc3RvcmUnKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzZXR1cFByb21pc2UudGhlbigodG9VcGRhdGUpID0+IHtcbiAgICAgIHJldHVybiBQcm9taXNlLmFsbCh0aGlzLmNvbnN0cnVjdG9yLiRzdG9yYWdlLm1hcCgoc3RvcmFnZSkgPT4ge1xuICAgICAgICBpZiAoc3RvcmFnZSAhPT0gc2tpcFRlcm1pbmFsKSB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JhZ2Uud3JpdGUodGhpcy5jb25zdHJ1Y3RvciwgdG9VcGRhdGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0b1VwZGF0ZTtcbiAgICAgICAgfVxuICAgICAgfSkpO1xuICAgIH0pLnRoZW4oKHVwZGF0ZXMpID0+IHVwZGF0ZXNbMF0pO1xuICB9XG5cbiAgJGFkZChrZXksIGl0ZW0pIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPiAxKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwodGhpcy5jb25zdHJ1Y3Rvci4kc3RvcmFnZS5tYXAoKHN0b3JhZ2UpID0+IHtcbiAgICAgICAgICByZXR1cm4gc3RvcmFnZS5hZGQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaXRlbSk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSBhZGRlZCB0byBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkcmVtb3ZlKGtleSwgaXRlbSkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+IDEpKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbCh0aGlzLmNvbnN0cnVjdG9yLiRzdG9yYWdlLm1hcCgoc3RvcmFnZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBzdG9yYWdlLnJlbW92ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpdGVtKTtcbiAgICAgICAgfSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtICRyZW1vdmVkIGZyb20gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRyZW1vdmUgZXhjZXB0IGZyb20gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkaGFzKGtleSkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIHJldHVybiB0aGlzWyRndWlsZF0uaGFzKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGhhcyBvbmx5IHZhbGlkIG9uIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG5cbiAgJHRlYXJkb3duKCkge1xuICAgIHRoaXNbJHVuc3Vic2NyaWJlXS51bnN1YnNjcmliZSgpO1xuICB9XG5cbn1cblxuTW9kZWwuJGlkID0gJ2lkJztcbk1vZGVsLiRuYW1lID0gJ0Jhc2UnO1xuTW9kZWwuJHNlbGYgPSAkc2VsZjtcbk1vZGVsLiRmaWVsZHMgPSB7XG4gIGlkOiB7XG4gICAgdHlwZTogJ251bWJlcicsXG4gIH0sXG59O1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
