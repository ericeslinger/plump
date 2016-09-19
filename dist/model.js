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
//# sourceMappingURL=data:application/json;base64,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QUFLLFdBQUwsQ0FBaUIsUUFBakIsQ0FBMEIsR0FBMUIsQ0FBOEIsVUFBQyxPQUFELEVBQWE7QUFDNUQsbUJBQU8sUUFBUSxNQUFSLENBQWUsT0FBSyxXQUFwQixFQUFpQyxPQUFLLEdBQXRDLEVBQTJDLEdBQTNDLEVBQWdELElBQWhELENBQVA7QUFDRCxXQUZrQixDQUFaLENBQVA7QUFHRCxTQUpELE1BSU87QUFDTCxpQkFBTyxRQUFRLE1BQVIsQ0FBZSxJQUFJLEtBQUosQ0FBVSxvQ0FBVixDQUFmLENBQVA7QUFDRDtBQUNGLE9BZEQsTUFjTztBQUNMLGVBQU8sUUFBUSxNQUFSLENBQWUsSUFBSSxLQUFKLENBQVUsMENBQVYsQ0FBZixDQUFQO0FBQ0Q7QUFDRjs7O3dCQS9IVztBQUNWLGFBQU8sS0FBSyxXQUFMLENBQWlCLEtBQXhCO0FBQ0Q7Ozt3QkFFUztBQUNSLGFBQU8sS0FBSyxNQUFMLEVBQWEsS0FBSyxXQUFMLENBQWlCLEdBQTlCLENBQVA7QUFDRDs7Ozs7O0FBNEhILE1BQU0sR0FBTixHQUFZLElBQVo7QUFDQSxNQUFNLEtBQU4sR0FBYyxNQUFkO0FBQ0EsTUFBTSxPQUFOLEdBQWdCO0FBQ2QsTUFBSTtBQUNGLFVBQU07QUFESjtBQURVLENBQWhCIiwiZmlsZSI6Im1vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgUHJvbWlzZSA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5jb25zdCAkc3RvcmUgPSBTeW1ib2woJyRzdG9yZScpO1xuXG4vLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIGVycm9yIGV2ZW50cyBvcmlnaW5hdGUgKHN0b3JhZ2Ugb3IgbW9kZWwpXG4vLyBhbmQgd2hvIGtlZXBzIGEgcm9sbC1iYWNrYWJsZSBkZWx0YVxuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICB0aGlzWyRzdG9yZV0gPSB7fTtcbiAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20ob3B0cyk7XG4gIH1cblxuICBnZXQgJG5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuJG5hbWU7XG4gIH1cblxuICBnZXQgJGlkKCkge1xuICAgIHJldHVybiB0aGlzWyRzdG9yZV1bdGhpcy5jb25zdHJ1Y3Rvci4kaWRdO1xuICB9XG5cbiAgJCRjb3B5VmFsdWVzRnJvbShvcHRzID0ge30pIHtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgaWYgKG9wdHNbZmllbGROYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGNvcHkgZnJvbSBvcHRzIHRvIHRoZSBiZXN0IG9mIG91ciBhYmlsaXR5XG4gICAgICAgIGlmIChcbiAgICAgICAgICAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2FycmF5JykgfHxcbiAgICAgICAgICAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2hhc01hbnknKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IG9wdHNbZmllbGROYW1lXS5jb25jYXQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0c1tmaWVsZE5hbWVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IG9wdHNbZmllbGROYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgJGdldChrZXkpIHtcbiAgICBpZiAodGhpc1skc3RvcmVdW2tleV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzWyRzdG9yZV1ba2V5XSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLiRzdG9yYWdlLnJlZHVjZSgodGhlbmFibGUsIHN0b3JhZ2UpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoZW5hYmxlLnRoZW4oKHYpID0+IHtcbiAgICAgICAgICBpZiAodiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBzdG9yYWdlLnJlYWQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQpXG4gICAgICAgICAgICAudGhlbigodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1skc3RvcmVdW2tleV07XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9LCBQcm9taXNlLnJlc29sdmUobnVsbCkpO1xuICAgIH1cbiAgfVxuXG4gICRsb2FkKG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB7c2VsZjogdHJ1ZX0sIG9wdHMpO1xuICAgIGlmIChvcHRpb25zLnNlbGYpIHtcbiAgICAgIHRoaXMuZ2V0U2VsZigpXG4gICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICB0aGlzLiQkY29weVZhbHVlc0Zyb20oZGF0YSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAkc2F2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy4kc2V0KCk7XG4gIH1cblxuICAkc2V0KHVwZGF0ZSA9IHRoaXNbJHN0b3JlXSkge1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh1cGRhdGUpOyAvLyB0aGlzIGlzIHRoZSBvcHRpbWlzdGljIHVwZGF0ZTtcbiAgICBsZXQgc2V0dXBQcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKHVwZGF0ZSk7XG4gICAgbGV0IHNraXBUZXJtaW5hbCA9IG51bGw7XG4gICAgaWYgKCh0aGlzLiRpZCA9PT0gdW5kZWZpbmVkKSAmJiAodXBkYXRlW3RoaXMuY29uc3RydWN0b3IuJGlkXSA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgLy8gbmVlZCB0byBnZXQgYW4gSUQuXG4gICAgICBjb25zdCB0ZXJtaW5hbHMgPSB0aGlzLmNvbnN0cnVjdG9yLiRzdG9yYWdlLmZpbHRlcigocykgPT4gcy50ZXJtaW5hbCk7XG4gICAgICBpZiAodGVybWluYWxzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBza2lwVGVybWluYWwgPSB0ZXJtaW5hbHNbMF07XG4gICAgICAgIHNldHVwUHJvbWlzZSA9IHRlcm1pbmFsc1swXS53cml0ZSh0aGlzLmNvbnN0cnVjdG9yLCB1cGRhdGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignTW9kZWwgY2FuIG9ubHkgaGF2ZSBvbmUgdGVybWluYWwgc3RvcmUnKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzZXR1cFByb21pc2UudGhlbigodG9VcGRhdGUpID0+IHtcbiAgICAgIHJldHVybiBQcm9taXNlLmFsbCh0aGlzLmNvbnN0cnVjdG9yLiRzdG9yYWdlLm1hcCgoc3RvcmFnZSkgPT4ge1xuICAgICAgICBpZiAoc3RvcmFnZSAhPT0gc2tpcFRlcm1pbmFsKSB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JhZ2Uud3JpdGUodGhpcy5jb25zdHJ1Y3RvciwgdG9VcGRhdGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0b1VwZGF0ZTtcbiAgICAgICAgfVxuICAgICAgfSkpO1xuICAgIH0pLnRoZW4oKHVwZGF0ZXMpID0+IHVwZGF0ZXNbMF0pO1xuICB9XG5cbiAgJGFkZChrZXksIGl0ZW0pIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPiAxKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwodGhpcy5jb25zdHJ1Y3Rvci4kc3RvcmFnZS5tYXAoKHN0b3JhZ2UpID0+IHtcbiAgICAgICAgICByZXR1cm4gc3RvcmFnZS5hZGQodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaXRlbSk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSBhZGRlZCB0byBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJGFkZCBleGNlcHQgdG8gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkcmVtb3ZlKGtleSwgaXRlbSkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+IDEpKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbCh0aGlzLmNvbnN0cnVjdG9yLiRzdG9yYWdlLm1hcCgoc3RvcmFnZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBzdG9yYWdlLnJlbW92ZSh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpdGVtKTtcbiAgICAgICAgfSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtICRyZW1vdmVkIGZyb20gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRyZW1vdmUgZXhjZXB0IGZyb20gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cbn1cblxuTW9kZWwuJGlkID0gJ2lkJztcbk1vZGVsLiRuYW1lID0gJ0Jhc2UnO1xuTW9kZWwuJGZpZWxkcyA9IHtcbiAgaWQ6IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbn07XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
