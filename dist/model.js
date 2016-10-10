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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIlByb21pc2UiLCIkc3RvcmUiLCJTeW1ib2wiLCIkZ3VpbGQiLCIkc2VsZiIsIiR1bnN1YnNjcmliZSIsIk1vZGVsIiwib3B0cyIsImd1aWxkIiwiJCRjb3B5VmFsdWVzRnJvbSIsIiQkY29ubmVjdFRvR3VpbGQiLCJzdWJzY3JpYmUiLCJjb25zdHJ1Y3RvciIsIiRuYW1lIiwiJGlkIiwidiIsIk9iamVjdCIsImtleXMiLCIkZmllbGRzIiwiZm9yRWFjaCIsImZpZWxkTmFtZSIsInVuZGVmaW5lZCIsInR5cGUiLCJjb25jYXQiLCJhc3NpZ24iLCJrZXkiLCJyZXNvbHZlIiwiZ2V0IiwidGhlbiIsIm9wdGlvbnMiLCJzZWxmIiwiZ2V0U2VsZiIsImRhdGEiLCIkc2V0IiwidXBkYXRlIiwic2V0dXBQcm9taXNlIiwic2tpcFRlcm1pbmFsIiwidGVybWluYWxzIiwiJHN0b3JhZ2UiLCJmaWx0ZXIiLCJzIiwidGVybWluYWwiLCJsZW5ndGgiLCJ3cml0ZSIsInJlamVjdCIsIkVycm9yIiwidG9VcGRhdGUiLCJhbGwiLCJtYXAiLCJzdG9yYWdlIiwidXBkYXRlcyIsIml0ZW0iLCJpZCIsImFkZCIsInJlbW92ZSIsImhhcyIsInVuc3Vic2NyaWJlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7SUFBWUEsTzs7Ozs7O0FBQ1osSUFBTUMsU0FBU0MsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNQyxTQUFTRCxPQUFPLFFBQVAsQ0FBZjtBQUNBLElBQU1FLFFBQVFGLE9BQU8sT0FBUCxDQUFkO0FBQ0EsSUFBTUcsZUFBZUgsT0FBTyxjQUFQLENBQXJCOztBQUVBO0FBQ0E7O0lBRWFJLEssV0FBQUEsSztBQUNYLG1CQUE4QjtBQUFBLFFBQWxCQyxJQUFrQix5REFBWCxFQUFXO0FBQUEsUUFBUEMsS0FBTzs7QUFBQTs7QUFDNUIsU0FBS1AsTUFBTCxJQUFlLEVBQWY7QUFDQSxTQUFLUSxnQkFBTCxDQUFzQkYsSUFBdEI7QUFDQSxRQUFJQyxLQUFKLEVBQVc7QUFDVCxXQUFLRSxnQkFBTCxDQUFzQkYsS0FBdEI7QUFDRDtBQUNGOzs7O3FDQUVnQkEsSyxFQUFPO0FBQUE7O0FBQ3RCLFdBQUtMLE1BQUwsSUFBZUssS0FBZjtBQUNBLFdBQUtILFlBQUwsSUFBcUJHLE1BQU1HLFNBQU4sQ0FBZ0IsS0FBS0MsV0FBTCxDQUFpQkMsS0FBakMsRUFBd0MsS0FBS0MsR0FBN0MsRUFBa0QsVUFBQ0MsQ0FBRCxFQUFPO0FBQzVFLGNBQUtOLGdCQUFMLENBQXNCTSxDQUF0QjtBQUNELE9BRm9CLENBQXJCO0FBR0Q7Ozt1Q0FVMkI7QUFBQTs7QUFBQSxVQUFYUixJQUFXLHlEQUFKLEVBQUk7O0FBQzFCUyxhQUFPQyxJQUFQLENBQVksS0FBS0wsV0FBTCxDQUFpQk0sT0FBN0IsRUFBc0NDLE9BQXRDLENBQThDLFVBQUNDLFNBQUQsRUFBZTtBQUMzRCxZQUFJYixLQUFLYSxTQUFMLE1BQW9CQyxTQUF4QixFQUFtQztBQUNqQztBQUNBLGNBQ0csT0FBS1QsV0FBTCxDQUFpQk0sT0FBakIsQ0FBeUJFLFNBQXpCLEVBQW9DRSxJQUFwQyxLQUE2QyxPQUE5QyxJQUNDLE9BQUtWLFdBQUwsQ0FBaUJNLE9BQWpCLENBQXlCRSxTQUF6QixFQUFvQ0UsSUFBcEMsS0FBNkMsU0FGaEQsRUFHRTtBQUNBLG1CQUFLckIsTUFBTCxFQUFhbUIsU0FBYixJQUEwQmIsS0FBS2EsU0FBTCxFQUFnQkcsTUFBaEIsRUFBMUI7QUFDRCxXQUxELE1BS08sSUFBSSxPQUFLWCxXQUFMLENBQWlCTSxPQUFqQixDQUF5QkUsU0FBekIsRUFBb0NFLElBQXBDLEtBQTZDLFFBQWpELEVBQTJEO0FBQ2hFLG1CQUFLckIsTUFBTCxFQUFhbUIsU0FBYixJQUEwQkosT0FBT1EsTUFBUCxDQUFjLEVBQWQsRUFBa0JqQixLQUFLYSxTQUFMLENBQWxCLENBQTFCO0FBQ0QsV0FGTSxNQUVBO0FBQ0wsbUJBQUtuQixNQUFMLEVBQWFtQixTQUFiLElBQTBCYixLQUFLYSxTQUFMLENBQTFCO0FBQ0Q7QUFDRjtBQUNGLE9BZEQ7QUFlRDs7O3lCQUVJSyxHLEVBQUs7QUFBQTs7QUFDUixVQUFJLEtBQUt4QixNQUFMLEVBQWF3QixHQUFiLE1BQXNCSixTQUExQixFQUFxQztBQUNuQyxlQUFPckIsUUFBUTBCLE9BQVIsQ0FBZ0IsS0FBS3pCLE1BQUwsRUFBYXdCLEdBQWIsQ0FBaEIsQ0FBUDtBQUNELE9BRkQsTUFFTztBQUNMLGVBQU8sS0FBS3RCLE1BQUwsRUFBYXdCLEdBQWIsQ0FBaUIsS0FBS2YsV0FBdEIsRUFBbUMsS0FBS0UsR0FBeEMsRUFDTmMsSUFETSxDQUNELFVBQUNiLENBQUQsRUFBTztBQUNYLGlCQUFLTixnQkFBTCxDQUFzQk0sQ0FBdEI7QUFDQSxpQkFBTyxPQUFLZCxNQUFMLEVBQWF3QixHQUFiLENBQVA7QUFDRCxTQUpNLENBQVA7QUFLRDtBQUNGOzs7NEJBRWdCO0FBQUE7O0FBQUEsVUFBWGxCLElBQVcseURBQUosRUFBSTs7QUFDZixVQUFNc0IsVUFBVWIsT0FBT1EsTUFBUCxDQUFjLEVBQWQsRUFBa0IsRUFBQ00sTUFBTSxJQUFQLEVBQWxCLEVBQWdDdkIsSUFBaEMsQ0FBaEI7QUFDQSxVQUFJc0IsUUFBUUMsSUFBWixFQUFrQjtBQUNoQixhQUFLQyxPQUFMLEdBQ0NILElBREQsQ0FDTSxVQUFDSSxJQUFELEVBQVU7QUFDZCxpQkFBS3ZCLGdCQUFMLENBQXNCdUIsSUFBdEI7QUFDRCxTQUhEO0FBSUQ7QUFDRjs7OzRCQUVPO0FBQ04sYUFBTyxLQUFLQyxJQUFMLEVBQVA7QUFDRDs7OzJCQUUyQjtBQUFBOztBQUFBLFVBQXZCQyxNQUF1Qix5REFBZCxLQUFLakMsTUFBTCxDQUFjOztBQUMxQixXQUFLUSxnQkFBTCxDQUFzQnlCLE1BQXRCLEVBRDBCLENBQ0s7QUFDL0IsVUFBSUMsZUFBZW5DLFFBQVEwQixPQUFSLENBQWdCUSxNQUFoQixDQUFuQjtBQUNBLFVBQUlFLGVBQWUsSUFBbkI7QUFDQSxVQUFLLEtBQUt0QixHQUFMLEtBQWFPLFNBQWQsSUFBNkJhLE9BQU8sS0FBS3RCLFdBQUwsQ0FBaUJFLEdBQXhCLE1BQWlDTyxTQUFsRSxFQUE4RTtBQUM1RTtBQUNBLFlBQU1nQixZQUFZLEtBQUt6QixXQUFMLENBQWlCMEIsUUFBakIsQ0FBMEJDLE1BQTFCLENBQWlDLFVBQUNDLENBQUQ7QUFBQSxpQkFBT0EsRUFBRUMsUUFBVDtBQUFBLFNBQWpDLENBQWxCO0FBQ0EsWUFBSUosVUFBVUssTUFBVixLQUFxQixDQUF6QixFQUE0QjtBQUMxQk4seUJBQWVDLFVBQVUsQ0FBVixDQUFmO0FBQ0FGLHlCQUFlRSxVQUFVLENBQVYsRUFBYU0sS0FBYixDQUFtQixLQUFLL0IsV0FBeEIsRUFBcUNzQixNQUFyQyxDQUFmO0FBQ0QsU0FIRCxNQUdPO0FBQ0wsaUJBQU9sQyxRQUFRNEMsTUFBUixDQUFlLElBQUlDLEtBQUosQ0FBVSx3Q0FBVixDQUFmLENBQVA7QUFDRDtBQUNGO0FBQ0QsYUFBT1YsYUFBYVAsSUFBYixDQUFrQixVQUFDa0IsUUFBRCxFQUFjO0FBQ3JDLGVBQU85QyxRQUFRK0MsR0FBUixDQUFZLE9BQUtuQyxXQUFMLENBQWlCMEIsUUFBakIsQ0FBMEJVLEdBQTFCLENBQThCLFVBQUNDLE9BQUQsRUFBYTtBQUM1RCxjQUFJQSxZQUFZYixZQUFoQixFQUE4QjtBQUM1QixtQkFBT2EsUUFBUU4sS0FBUixDQUFjLE9BQUsvQixXQUFuQixFQUFnQ2tDLFFBQWhDLENBQVA7QUFDRCxXQUZELE1BRU87QUFDTCxtQkFBT0EsUUFBUDtBQUNEO0FBQ0YsU0FOa0IsQ0FBWixDQUFQO0FBT0QsT0FSTSxFQVFKbEIsSUFSSSxDQVFDLFVBQUNzQixPQUFEO0FBQUEsZUFBYUEsUUFBUSxDQUFSLENBQWI7QUFBQSxPQVJELENBQVA7QUFTRDs7O3lCQUVJekIsRyxFQUFLMEIsSSxFQUFNO0FBQUE7O0FBQ2QsVUFBSSxLQUFLdkMsV0FBTCxDQUFpQk0sT0FBakIsQ0FBeUJPLEdBQXpCLEVBQThCSCxJQUE5QixLQUF1QyxTQUEzQyxFQUFzRDtBQUNwRCxZQUFJOEIsS0FBSyxDQUFUO0FBQ0EsWUFBSSxPQUFPRCxJQUFQLEtBQWdCLFFBQXBCLEVBQThCO0FBQzVCQyxlQUFLRCxJQUFMO0FBQ0QsU0FGRCxNQUVPO0FBQ0xDLGVBQUtELEtBQUtyQyxHQUFWO0FBQ0Q7QUFDRCxZQUFLLE9BQU9zQyxFQUFQLEtBQWMsUUFBZixJQUE2QkEsS0FBSyxDQUF0QyxFQUEwQztBQUN4QyxpQkFBT3BELFFBQVErQyxHQUFSLENBQVksS0FBS25DLFdBQUwsQ0FBaUIwQixRQUFqQixDQUEwQlUsR0FBMUIsQ0FBOEIsVUFBQ0MsT0FBRCxFQUFhO0FBQzVELG1CQUFPQSxRQUFRSSxHQUFSLENBQVksT0FBS3pDLFdBQWpCLEVBQThCLE9BQUtFLEdBQW5DLEVBQXdDVyxHQUF4QyxFQUE2QzBCLElBQTdDLENBQVA7QUFDRCxXQUZrQixDQUFaLENBQVA7QUFHRCxTQUpELE1BSU87QUFDTCxpQkFBT25ELFFBQVE0QyxNQUFSLENBQWUsSUFBSUMsS0FBSixDQUFVLCtCQUFWLENBQWYsQ0FBUDtBQUNEO0FBQ0YsT0FkRCxNQWNPO0FBQ0wsZUFBTzdDLFFBQVE0QyxNQUFSLENBQWUsSUFBSUMsS0FBSixDQUFVLHFDQUFWLENBQWYsQ0FBUDtBQUNEO0FBQ0Y7Ozs0QkFFT3BCLEcsRUFBSzBCLEksRUFBTTtBQUFBOztBQUNqQixVQUFJLEtBQUt2QyxXQUFMLENBQWlCTSxPQUFqQixDQUF5Qk8sR0FBekIsRUFBOEJILElBQTlCLEtBQXVDLFNBQTNDLEVBQXNEO0FBQ3BELFlBQUk4QixLQUFLLENBQVQ7QUFDQSxZQUFJLE9BQU9ELElBQVAsS0FBZ0IsUUFBcEIsRUFBOEI7QUFDNUJDLGVBQUtELElBQUw7QUFDRCxTQUZELE1BRU87QUFDTEMsZUFBS0QsS0FBS3JDLEdBQVY7QUFDRDtBQUNELFlBQUssT0FBT3NDLEVBQVAsS0FBYyxRQUFmLElBQTZCQSxLQUFLLENBQXRDLEVBQTBDO0FBQ3hDLGlCQUFPcEQsUUFBUStDLEdBQVIsQ0FBWSxLQUFLbkMsV0FBTCxDQUFpQjBCLFFBQWpCLENBQTBCVSxHQUExQixDQUE4QixVQUFDQyxPQUFELEVBQWE7QUFDNUQsbUJBQU9BLFFBQVFLLE1BQVIsQ0FBZSxPQUFLMUMsV0FBcEIsRUFBaUMsT0FBS0UsR0FBdEMsRUFBMkNXLEdBQTNDLEVBQWdEMEIsSUFBaEQsQ0FBUDtBQUNELFdBRmtCLENBQVosQ0FBUDtBQUdELFNBSkQsTUFJTztBQUNMLGlCQUFPbkQsUUFBUTRDLE1BQVIsQ0FBZSxJQUFJQyxLQUFKLENBQVUsb0NBQVYsQ0FBZixDQUFQO0FBQ0Q7QUFDRixPQWRELE1BY087QUFDTCxlQUFPN0MsUUFBUTRDLE1BQVIsQ0FBZSxJQUFJQyxLQUFKLENBQVUsMENBQVYsQ0FBZixDQUFQO0FBQ0Q7QUFDRjs7O3lCQUVJcEIsRyxFQUFLO0FBQ1IsVUFBSSxLQUFLYixXQUFMLENBQWlCTSxPQUFqQixDQUF5Qk8sR0FBekIsRUFBOEJILElBQTlCLEtBQXVDLFNBQTNDLEVBQXNEO0FBQ3BELGVBQU8sS0FBS25CLE1BQUwsRUFBYW9ELEdBQWIsQ0FBaUIsS0FBSzNDLFdBQXRCLEVBQW1DLEtBQUtFLEdBQXhDLEVBQTZDVyxHQUE3QyxDQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBT3pCLFFBQVE0QyxNQUFSLENBQWUsSUFBSUMsS0FBSixDQUFVLHlDQUFWLENBQWYsQ0FBUDtBQUNEO0FBQ0Y7OztnQ0FFVztBQUNWLFdBQUt4QyxZQUFMLEVBQW1CbUQsV0FBbkI7QUFDRDs7O3dCQS9IVztBQUNWLGFBQU8sS0FBSzVDLFdBQUwsQ0FBaUJDLEtBQXhCO0FBQ0Q7Ozt3QkFFUztBQUNSLGFBQU8sS0FBS1osTUFBTCxFQUFhLEtBQUtXLFdBQUwsQ0FBaUJFLEdBQTlCLENBQVA7QUFDRDs7Ozs7O0FBNkhIUixNQUFNUSxHQUFOLEdBQVksSUFBWjtBQUNBUixNQUFNTyxLQUFOLEdBQWMsTUFBZDtBQUNBUCxNQUFNRixLQUFOLEdBQWNBLEtBQWQ7QUFDQUUsTUFBTVksT0FBTixHQUFnQjtBQUNka0MsTUFBSTtBQUNGOUIsVUFBTTtBQURKO0FBRFUsQ0FBaEIiLCJmaWxlIjoibW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmNvbnN0ICRzdG9yZSA9IFN5bWJvbCgnJHN0b3JlJyk7XG5jb25zdCAkZ3VpbGQgPSBTeW1ib2woJyRndWlsZCcpO1xuY29uc3QgJHNlbGYgPSBTeW1ib2woJyRzZWxmJyk7XG5jb25zdCAkdW5zdWJzY3JpYmUgPSBTeW1ib2woJyR1bnN1YnNjcmliZScpO1xuXG4vLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIGVycm9yIGV2ZW50cyBvcmlnaW5hdGUgKHN0b3JhZ2Ugb3IgbW9kZWwpXG4vLyBhbmQgd2hvIGtlZXBzIGEgcm9sbC1iYWNrYWJsZSBkZWx0YVxuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzID0ge30sIGd1aWxkKSB7XG4gICAgdGhpc1skc3RvcmVdID0ge307XG4gICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKG9wdHMpO1xuICAgIGlmIChndWlsZCkge1xuICAgICAgdGhpcy4kJGNvbm5lY3RUb0d1aWxkKGd1aWxkKTtcbiAgICB9XG4gIH1cblxuICAkJGNvbm5lY3RUb0d1aWxkKGd1aWxkKSB7XG4gICAgdGhpc1skZ3VpbGRdID0gZ3VpbGQ7XG4gICAgdGhpc1skdW5zdWJzY3JpYmVdID0gZ3VpbGQuc3Vic2NyaWJlKHRoaXMuY29uc3RydWN0b3IuJG5hbWUsIHRoaXMuJGlkLCAodikgPT4ge1xuICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHYpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0ICRuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLiRuYW1lO1xuICB9XG5cbiAgZ2V0ICRpZCgpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmVdW3RoaXMuY29uc3RydWN0b3IuJGlkXTtcbiAgfVxuXG4gICQkY29weVZhbHVlc0Zyb20ob3B0cyA9IHt9KSB7XG4gICAgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzKS5mb3JFYWNoKChmaWVsZE5hbWUpID0+IHtcbiAgICAgIGlmIChvcHRzW2ZpZWxkTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBjb3B5IGZyb20gb3B0cyB0byB0aGUgYmVzdCBvZiBvdXIgYWJpbGl0eVxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdhcnJheScpIHx8XG4gICAgICAgICAgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdoYXNNYW55JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBvcHRzW2ZpZWxkTmFtZV0uY29uY2F0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB0aGlzWyRzdG9yZV1bZmllbGROYW1lXSA9IE9iamVjdC5hc3NpZ24oe30sIG9wdHNbZmllbGROYW1lXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBvcHRzW2ZpZWxkTmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICRnZXQoa2V5KSB7XG4gICAgaWYgKHRoaXNbJHN0b3JlXVtrZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpc1skc3RvcmVdW2tleV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpc1skZ3VpbGRdLmdldCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZClcbiAgICAgIC50aGVuKCh2KSA9PiB7XG4gICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHN0b3JlXVtrZXldO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgJGxvYWQob3B0cyA9IHt9KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIHtzZWxmOiB0cnVlfSwgb3B0cyk7XG4gICAgaWYgKG9wdGlvbnMuc2VsZikge1xuICAgICAgdGhpcy5nZXRTZWxmKClcbiAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbShkYXRhKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gICRzYXZlKCkge1xuICAgIHJldHVybiB0aGlzLiRzZXQoKTtcbiAgfVxuXG4gICRzZXQodXBkYXRlID0gdGhpc1skc3RvcmVdKSB7XG4gICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHVwZGF0ZSk7IC8vIHRoaXMgaXMgdGhlIG9wdGltaXN0aWMgdXBkYXRlO1xuICAgIGxldCBzZXR1cFByb21pc2UgPSBQcm9taXNlLnJlc29sdmUodXBkYXRlKTtcbiAgICBsZXQgc2tpcFRlcm1pbmFsID0gbnVsbDtcbiAgICBpZiAoKHRoaXMuJGlkID09PSB1bmRlZmluZWQpICYmICh1cGRhdGVbdGhpcy5jb25zdHJ1Y3Rvci4kaWRdID09PSB1bmRlZmluZWQpKSB7XG4gICAgICAvLyBuZWVkIHRvIGdldCBhbiBJRC5cbiAgICAgIGNvbnN0IHRlcm1pbmFscyA9IHRoaXMuY29uc3RydWN0b3IuJHN0b3JhZ2UuZmlsdGVyKChzKSA9PiBzLnRlcm1pbmFsKTtcbiAgICAgIGlmICh0ZXJtaW5hbHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHNraXBUZXJtaW5hbCA9IHRlcm1pbmFsc1swXTtcbiAgICAgICAgc2V0dXBQcm9taXNlID0gdGVybWluYWxzWzBdLndyaXRlKHRoaXMuY29uc3RydWN0b3IsIHVwZGF0ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdNb2RlbCBjYW4gb25seSBoYXZlIG9uZSB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNldHVwUHJvbWlzZS50aGVuKCh0b1VwZGF0ZSkgPT4ge1xuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHRoaXMuY29uc3RydWN0b3IuJHN0b3JhZ2UubWFwKChzdG9yYWdlKSA9PiB7XG4gICAgICAgIGlmIChzdG9yYWdlICE9PSBza2lwVGVybWluYWwpIHtcbiAgICAgICAgICByZXR1cm4gc3RvcmFnZS53cml0ZSh0aGlzLmNvbnN0cnVjdG9yLCB0b1VwZGF0ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRvVXBkYXRlO1xuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgfSkudGhlbigodXBkYXRlcykgPT4gdXBkYXRlc1swXSk7XG4gIH1cblxuICAkYWRkKGtleSwgaXRlbSkge1xuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNba2V5XS50eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgIGxldCBpZCA9IDA7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gaXRlbS4kaWQ7XG4gICAgICB9XG4gICAgICBpZiAoKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpICYmIChpZCA+IDEpKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbCh0aGlzLmNvbnN0cnVjdG9yLiRzdG9yYWdlLm1hcCgoc3RvcmFnZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBzdG9yYWdlLmFkZCh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5LCBpdGVtKTtcbiAgICAgICAgfSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBpdGVtIGFkZGVkIHRvIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkYWRkIGV4Y2VwdCB0byBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICRyZW1vdmUoa2V5LCBpdGVtKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID4gMSkpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHRoaXMuY29uc3RydWN0b3IuJHN0b3JhZ2UubWFwKChzdG9yYWdlKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JhZ2UucmVtb3ZlKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGl0ZW0pO1xuICAgICAgICB9KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gJHJlbW92ZWQgZnJvbSBoYXNNYW55JykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdDYW5ub3QgJHJlbW92ZSBleGNlcHQgZnJvbSBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICRoYXMoa2V5KSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgcmV0dXJuIHRoaXNbJGd1aWxkXS5oYXModGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkaGFzIG9ubHkgdmFsaWQgb24gaGFzTWFueSBmaWVsZCcpKTtcbiAgICB9XG4gIH1cblxuICAkdGVhcmRvd24oKSB7XG4gICAgdGhpc1skdW5zdWJzY3JpYmVdLnVuc3Vic2NyaWJlKCk7XG4gIH1cblxufVxuXG5Nb2RlbC4kaWQgPSAnaWQnO1xuTW9kZWwuJG5hbWUgPSAnQmFzZSc7XG5Nb2RlbC4kc2VsZiA9ICRzZWxmO1xuTW9kZWwuJGZpZWxkcyA9IHtcbiAgaWQ6IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbn07XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
