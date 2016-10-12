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
var $unsubscribe = Symbol('$unsubscribe');

// TODO: figure out where error events originate (storage or model)
// and who keeps a roll-backable delta

var Model = exports.Model = function () {
  function Model(opts, guild) {
    _classCallCheck(this, Model);

    this[$store] = {};
    this.$$copyValuesFrom(opts || {});
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

      if (key === undefined || this[$store][key] === undefined) {
        return this[$guild].get(this.constructor, this.$id).then(function (v) {
          _this3.$$copyValuesFrom(v);
          if (key) {
            return _this3[$store][key];
          } else {
            return Object.assign({}, _this3[$store]);
          }
        });
      } else {
        return Promise.resolve(this[$store][key]);
      }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVsLmpzIl0sIm5hbWVzIjpbIlByb21pc2UiLCIkc3RvcmUiLCJTeW1ib2wiLCIkZ3VpbGQiLCIkdW5zdWJzY3JpYmUiLCJNb2RlbCIsIm9wdHMiLCJndWlsZCIsIiQkY29weVZhbHVlc0Zyb20iLCIkJGNvbm5lY3RUb0d1aWxkIiwic3Vic2NyaWJlIiwiY29uc3RydWN0b3IiLCIkbmFtZSIsIiRpZCIsInYiLCJPYmplY3QiLCJrZXlzIiwiJGZpZWxkcyIsImZvckVhY2giLCJmaWVsZE5hbWUiLCJ1bmRlZmluZWQiLCJ0eXBlIiwiY29uY2F0IiwiYXNzaWduIiwia2V5IiwiZ2V0IiwidGhlbiIsInJlc29sdmUiLCJvcHRpb25zIiwic2VsZiIsImdldFNlbGYiLCJkYXRhIiwiJHNldCIsInVwZGF0ZSIsInNhdmUiLCJpdGVtIiwiaWQiLCJhbGwiLCIkc3RvcmFnZSIsIm1hcCIsInN0b3JhZ2UiLCJhZGQiLCJyZWplY3QiLCJFcnJvciIsInJlbW92ZSIsImhhcyIsInVuc3Vic2NyaWJlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7SUFBWUEsTzs7Ozs7O0FBQ1osSUFBTUMsU0FBU0MsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNQyxTQUFTRCxPQUFPLFFBQVAsQ0FBZjtBQUNBLElBQU1FLGVBQWVGLE9BQU8sY0FBUCxDQUFyQjs7QUFFQTtBQUNBOztJQUVhRyxLLFdBQUFBLEs7QUFDWCxpQkFBWUMsSUFBWixFQUFrQkMsS0FBbEIsRUFBeUI7QUFBQTs7QUFDdkIsU0FBS04sTUFBTCxJQUFlLEVBQWY7QUFDQSxTQUFLTyxnQkFBTCxDQUFzQkYsUUFBUSxFQUE5QjtBQUNBLFFBQUlDLEtBQUosRUFBVztBQUNULFdBQUtFLGdCQUFMLENBQXNCRixLQUF0QjtBQUNEO0FBQ0Y7Ozs7cUNBRWdCQSxLLEVBQU87QUFBQTs7QUFDdEIsV0FBS0osTUFBTCxJQUFlSSxLQUFmO0FBQ0EsV0FBS0gsWUFBTCxJQUFxQkcsTUFBTUcsU0FBTixDQUFnQixLQUFLQyxXQUFMLENBQWlCQyxLQUFqQyxFQUF3QyxLQUFLQyxHQUE3QyxFQUFrRCxVQUFDQyxDQUFELEVBQU87QUFDNUUsY0FBS04sZ0JBQUwsQ0FBc0JNLENBQXRCO0FBQ0QsT0FGb0IsQ0FBckI7QUFHRDs7O3VDQVUyQjtBQUFBOztBQUFBLFVBQVhSLElBQVcsdUVBQUosRUFBSTs7QUFDMUJTLGFBQU9DLElBQVAsQ0FBWSxLQUFLTCxXQUFMLENBQWlCTSxPQUE3QixFQUFzQ0MsT0FBdEMsQ0FBOEMsVUFBQ0MsU0FBRCxFQUFlO0FBQzNELFlBQUliLEtBQUthLFNBQUwsTUFBb0JDLFNBQXhCLEVBQW1DO0FBQ2pDO0FBQ0EsY0FDRyxPQUFLVCxXQUFMLENBQWlCTSxPQUFqQixDQUF5QkUsU0FBekIsRUFBb0NFLElBQXBDLEtBQTZDLE9BQTlDLElBQ0MsT0FBS1YsV0FBTCxDQUFpQk0sT0FBakIsQ0FBeUJFLFNBQXpCLEVBQW9DRSxJQUFwQyxLQUE2QyxTQUZoRCxFQUdFO0FBQ0EsbUJBQUtwQixNQUFMLEVBQWFrQixTQUFiLElBQTBCYixLQUFLYSxTQUFMLEVBQWdCRyxNQUFoQixFQUExQjtBQUNELFdBTEQsTUFLTyxJQUFJLE9BQUtYLFdBQUwsQ0FBaUJNLE9BQWpCLENBQXlCRSxTQUF6QixFQUFvQ0UsSUFBcEMsS0FBNkMsUUFBakQsRUFBMkQ7QUFDaEUsbUJBQUtwQixNQUFMLEVBQWFrQixTQUFiLElBQTBCSixPQUFPUSxNQUFQLENBQWMsRUFBZCxFQUFrQmpCLEtBQUthLFNBQUwsQ0FBbEIsQ0FBMUI7QUFDRCxXQUZNLE1BRUE7QUFDTCxtQkFBS2xCLE1BQUwsRUFBYWtCLFNBQWIsSUFBMEJiLEtBQUthLFNBQUwsQ0FBMUI7QUFDRDtBQUNGO0FBQ0YsT0FkRDtBQWVEOztBQUVEOzs7O3lCQUVLSyxHLEVBQUs7QUFBQTs7QUFDUixVQUFLQSxRQUFRSixTQUFULElBQXdCLEtBQUtuQixNQUFMLEVBQWF1QixHQUFiLE1BQXNCSixTQUFsRCxFQUE4RDtBQUM1RCxlQUFPLEtBQUtqQixNQUFMLEVBQWFzQixHQUFiLENBQWlCLEtBQUtkLFdBQXRCLEVBQW1DLEtBQUtFLEdBQXhDLEVBQ05hLElBRE0sQ0FDRCxVQUFDWixDQUFELEVBQU87QUFDWCxpQkFBS04sZ0JBQUwsQ0FBc0JNLENBQXRCO0FBQ0EsY0FBSVUsR0FBSixFQUFTO0FBQ1AsbUJBQU8sT0FBS3ZCLE1BQUwsRUFBYXVCLEdBQWIsQ0FBUDtBQUNELFdBRkQsTUFFTztBQUNMLG1CQUFPVCxPQUFPUSxNQUFQLENBQWMsRUFBZCxFQUFrQixPQUFLdEIsTUFBTCxDQUFsQixDQUFQO0FBQ0Q7QUFDRixTQVJNLENBQVA7QUFTRCxPQVZELE1BVU87QUFDTCxlQUFPRCxRQUFRMkIsT0FBUixDQUFnQixLQUFLMUIsTUFBTCxFQUFhdUIsR0FBYixDQUFoQixDQUFQO0FBQ0Q7QUFDRjs7OzRCQUVnQjtBQUFBOztBQUFBLFVBQVhsQixJQUFXLHVFQUFKLEVBQUk7O0FBQ2YsVUFBTXNCLFVBQVViLE9BQU9RLE1BQVAsQ0FBYyxFQUFkLEVBQWtCLEVBQUNNLE1BQU0sSUFBUCxFQUFsQixFQUFnQ3ZCLElBQWhDLENBQWhCO0FBQ0EsVUFBSXNCLFFBQVFDLElBQVosRUFBa0I7QUFDaEIsYUFBS0MsT0FBTCxHQUNDSixJQURELENBQ00sVUFBQ0ssSUFBRCxFQUFVO0FBQ2QsaUJBQUt2QixnQkFBTCxDQUFzQnVCLElBQXRCO0FBQ0QsU0FIRDtBQUlEO0FBQ0Y7Ozs0QkFFTztBQUNOLGFBQU8sS0FBS0MsSUFBTCxFQUFQO0FBQ0Q7OzsyQkFFMkI7QUFBQSxVQUF2QkMsTUFBdUIsdUVBQWQsS0FBS2hDLE1BQUwsQ0FBYzs7QUFDMUIsV0FBS08sZ0JBQUwsQ0FBc0J5QixNQUF0QixFQUQwQixDQUNLO0FBQy9CLGFBQU8sS0FBSzlCLE1BQUwsRUFBYStCLElBQWIsQ0FBa0IsS0FBS3ZCLFdBQXZCLEVBQW9Dc0IsTUFBcEMsQ0FBUDtBQUNBO0FBQ0E7QUFDQTtBQUNEOzs7eUJBRUlULEcsRUFBS1csSSxFQUFNO0FBQUE7O0FBQ2QsVUFBSSxLQUFLeEIsV0FBTCxDQUFpQk0sT0FBakIsQ0FBeUJPLEdBQXpCLEVBQThCSCxJQUE5QixLQUF1QyxTQUEzQyxFQUFzRDtBQUNwRCxZQUFJZSxLQUFLLENBQVQ7QUFDQSxZQUFJLE9BQU9ELElBQVAsS0FBZ0IsUUFBcEIsRUFBOEI7QUFDNUJDLGVBQUtELElBQUw7QUFDRCxTQUZELE1BRU87QUFDTEMsZUFBS0QsS0FBS3RCLEdBQVY7QUFDRDtBQUNELFlBQUssT0FBT3VCLEVBQVAsS0FBYyxRQUFmLElBQTZCQSxLQUFLLENBQXRDLEVBQTBDO0FBQ3hDLGlCQUFPcEMsUUFBUXFDLEdBQVIsQ0FBWSxLQUFLMUIsV0FBTCxDQUFpQjJCLFFBQWpCLENBQTBCQyxHQUExQixDQUE4QixVQUFDQyxPQUFELEVBQWE7QUFDNUQsbUJBQU9BLFFBQVFDLEdBQVIsQ0FBWSxPQUFLOUIsV0FBakIsRUFBOEIsT0FBS0UsR0FBbkMsRUFBd0NXLEdBQXhDLEVBQTZDVyxJQUE3QyxDQUFQO0FBQ0QsV0FGa0IsQ0FBWixDQUFQO0FBR0QsU0FKRCxNQUlPO0FBQ0wsaUJBQU9uQyxRQUFRMEMsTUFBUixDQUFlLElBQUlDLEtBQUosQ0FBVSwrQkFBVixDQUFmLENBQVA7QUFDRDtBQUNGLE9BZEQsTUFjTztBQUNMLGVBQU8zQyxRQUFRMEMsTUFBUixDQUFlLElBQUlDLEtBQUosQ0FBVSxxQ0FBVixDQUFmLENBQVA7QUFDRDtBQUNGOzs7NEJBRU9uQixHLEVBQUtXLEksRUFBTTtBQUFBOztBQUNqQixVQUFJLEtBQUt4QixXQUFMLENBQWlCTSxPQUFqQixDQUF5Qk8sR0FBekIsRUFBOEJILElBQTlCLEtBQXVDLFNBQTNDLEVBQXNEO0FBQ3BELFlBQUllLEtBQUssQ0FBVDtBQUNBLFlBQUksT0FBT0QsSUFBUCxLQUFnQixRQUFwQixFQUE4QjtBQUM1QkMsZUFBS0QsSUFBTDtBQUNELFNBRkQsTUFFTztBQUNMQyxlQUFLRCxLQUFLdEIsR0FBVjtBQUNEO0FBQ0QsWUFBSyxPQUFPdUIsRUFBUCxLQUFjLFFBQWYsSUFBNkJBLEtBQUssQ0FBdEMsRUFBMEM7QUFDeEMsaUJBQU9wQyxRQUFRcUMsR0FBUixDQUFZLEtBQUsxQixXQUFMLENBQWlCMkIsUUFBakIsQ0FBMEJDLEdBQTFCLENBQThCLFVBQUNDLE9BQUQsRUFBYTtBQUM1RCxtQkFBT0EsUUFBUUksTUFBUixDQUFlLE9BQUtqQyxXQUFwQixFQUFpQyxPQUFLRSxHQUF0QyxFQUEyQ1csR0FBM0MsRUFBZ0RXLElBQWhELENBQVA7QUFDRCxXQUZrQixDQUFaLENBQVA7QUFHRCxTQUpELE1BSU87QUFDTCxpQkFBT25DLFFBQVEwQyxNQUFSLENBQWUsSUFBSUMsS0FBSixDQUFVLG9DQUFWLENBQWYsQ0FBUDtBQUNEO0FBQ0YsT0FkRCxNQWNPO0FBQ0wsZUFBTzNDLFFBQVEwQyxNQUFSLENBQWUsSUFBSUMsS0FBSixDQUFVLDBDQUFWLENBQWYsQ0FBUDtBQUNEO0FBQ0Y7Ozt5QkFFSW5CLEcsRUFBSztBQUNSLFVBQUksS0FBS2IsV0FBTCxDQUFpQk0sT0FBakIsQ0FBeUJPLEdBQXpCLEVBQThCSCxJQUE5QixLQUF1QyxTQUEzQyxFQUFzRDtBQUNwRCxlQUFPLEtBQUtsQixNQUFMLEVBQWEwQyxHQUFiLENBQWlCLEtBQUtsQyxXQUF0QixFQUFtQyxLQUFLRSxHQUF4QyxFQUE2Q1csR0FBN0MsQ0FBUDtBQUNELE9BRkQsTUFFTztBQUNMLGVBQU94QixRQUFRMEMsTUFBUixDQUFlLElBQUlDLEtBQUosQ0FBVSx5Q0FBVixDQUFmLENBQVA7QUFDRDtBQUNGOzs7Z0NBRVc7QUFDVixXQUFLdkMsWUFBTCxFQUFtQjBDLFdBQW5CO0FBQ0Q7Ozt3QkFwSFc7QUFDVixhQUFPLEtBQUtuQyxXQUFMLENBQWlCQyxLQUF4QjtBQUNEOzs7d0JBRVM7QUFDUixhQUFPLEtBQUtYLE1BQUwsRUFBYSxLQUFLVSxXQUFMLENBQWlCRSxHQUE5QixDQUFQO0FBQ0Q7Ozs7OztBQWtISFIsTUFBTVEsR0FBTixHQUFZLElBQVo7QUFDQVIsTUFBTU8sS0FBTixHQUFjLE1BQWQ7QUFDQVAsTUFBTVksT0FBTixHQUFnQjtBQUNkbUIsTUFBSTtBQUNGZixVQUFNO0FBREo7QUFEVSxDQUFoQiIsImZpbGUiOiJtb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuY29uc3QgJHN0b3JlID0gU3ltYm9sKCckc3RvcmUnKTtcbmNvbnN0ICRndWlsZCA9IFN5bWJvbCgnJGd1aWxkJyk7XG5jb25zdCAkdW5zdWJzY3JpYmUgPSBTeW1ib2woJyR1bnN1YnNjcmliZScpO1xuXG4vLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIGVycm9yIGV2ZW50cyBvcmlnaW5hdGUgKHN0b3JhZ2Ugb3IgbW9kZWwpXG4vLyBhbmQgd2hvIGtlZXBzIGEgcm9sbC1iYWNrYWJsZSBkZWx0YVxuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzLCBndWlsZCkge1xuICAgIHRoaXNbJHN0b3JlXSA9IHt9O1xuICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbShvcHRzIHx8IHt9KTtcbiAgICBpZiAoZ3VpbGQpIHtcbiAgICAgIHRoaXMuJCRjb25uZWN0VG9HdWlsZChndWlsZCk7XG4gICAgfVxuICB9XG5cbiAgJCRjb25uZWN0VG9HdWlsZChndWlsZCkge1xuICAgIHRoaXNbJGd1aWxkXSA9IGd1aWxkO1xuICAgIHRoaXNbJHVuc3Vic2NyaWJlXSA9IGd1aWxkLnN1YnNjcmliZSh0aGlzLmNvbnN0cnVjdG9yLiRuYW1lLCB0aGlzLiRpZCwgKHYpID0+IHtcbiAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbSh2KTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldCAkbmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci4kbmFtZTtcbiAgfVxuXG4gIGdldCAkaWQoKSB7XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JlXVt0aGlzLmNvbnN0cnVjdG9yLiRpZF07XG4gIH1cblxuICAkJGNvcHlWYWx1ZXNGcm9tKG9wdHMgPSB7fSkge1xuICAgIE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkcykuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICBpZiAob3B0c1tmaWVsZE5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gY29weSBmcm9tIG9wdHMgdG8gdGhlIGJlc3Qgb2Ygb3VyIGFiaWxpdHlcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnYXJyYXknKSB8fFxuICAgICAgICAgICh0aGlzLmNvbnN0cnVjdG9yLiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnaGFzTWFueScpXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gb3B0c1tmaWVsZE5hbWVdLmNvbmNhdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdGhpc1skc3RvcmVdW2ZpZWxkTmFtZV0gPSBPYmplY3QuYXNzaWduKHt9LCBvcHRzW2ZpZWxkTmFtZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXNbJHN0b3JlXVtmaWVsZE5hbWVdID0gb3B0c1tmaWVsZE5hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvLyBUT0RPOiBkb24ndCBmZXRjaCBpZiB3ZSAkZ2V0KCkgc29tZXRoaW5nIHRoYXQgd2UgYWxyZWFkeSBoYXZlXG5cbiAgJGdldChrZXkpIHtcbiAgICBpZiAoKGtleSA9PT0gdW5kZWZpbmVkKSB8fCAodGhpc1skc3RvcmVdW2tleV0gPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgIHJldHVybiB0aGlzWyRndWlsZF0uZ2V0KHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkKVxuICAgICAgLnRoZW4oKHYpID0+IHtcbiAgICAgICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHYpO1xuICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHN0b3JlXVtrZXldO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCB0aGlzWyRzdG9yZV0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzWyRzdG9yZV1ba2V5XSk7XG4gICAgfVxuICB9XG5cbiAgJGxvYWQob3B0cyA9IHt9KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIHtzZWxmOiB0cnVlfSwgb3B0cyk7XG4gICAgaWYgKG9wdGlvbnMuc2VsZikge1xuICAgICAgdGhpcy5nZXRTZWxmKClcbiAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgIHRoaXMuJCRjb3B5VmFsdWVzRnJvbShkYXRhKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gICRzYXZlKCkge1xuICAgIHJldHVybiB0aGlzLiRzZXQoKTtcbiAgfVxuXG4gICRzZXQodXBkYXRlID0gdGhpc1skc3RvcmVdKSB7XG4gICAgdGhpcy4kJGNvcHlWYWx1ZXNGcm9tKHVwZGF0ZSk7IC8vIHRoaXMgaXMgdGhlIG9wdGltaXN0aWMgdXBkYXRlO1xuICAgIHJldHVybiB0aGlzWyRndWlsZF0uc2F2ZSh0aGlzLmNvbnN0cnVjdG9yLCB1cGRhdGUpO1xuICAgIC8vIC50aGVuKCh1cGRhdGVzKSA9PiB7XG4gICAgLy8gICByZXR1cm4gdXBkYXRlcztcbiAgICAvLyB9KTtcbiAgfVxuXG4gICRhZGQoa2V5LCBpdGVtKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuJGZpZWxkc1trZXldLnR5cGUgPT09ICdoYXNNYW55Jykge1xuICAgICAgbGV0IGlkID0gMDtcbiAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSBpdGVtLiRpZDtcbiAgICAgIH1cbiAgICAgIGlmICgodHlwZW9mIGlkID09PSAnbnVtYmVyJykgJiYgKGlkID4gMSkpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHRoaXMuY29uc3RydWN0b3IuJHN0b3JhZ2UubWFwKChzdG9yYWdlKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JhZ2UuYWRkKHRoaXMuY29uc3RydWN0b3IsIHRoaXMuJGlkLCBrZXksIGl0ZW0pO1xuICAgICAgICB9KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIGl0ZW0gYWRkZWQgdG8gaGFzTWFueScpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRhZGQgZXhjZXB0IHRvIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG5cbiAgJHJlbW92ZShrZXksIGl0ZW0pIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICBsZXQgaWQgPSAwO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGl0ZW0uJGlkO1xuICAgICAgfVxuICAgICAgaWYgKCh0eXBlb2YgaWQgPT09ICdudW1iZXInKSAmJiAoaWQgPiAxKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwodGhpcy5jb25zdHJ1Y3Rvci4kc3RvcmFnZS5tYXAoKHN0b3JhZ2UpID0+IHtcbiAgICAgICAgICByZXR1cm4gc3RvcmFnZS5yZW1vdmUodGhpcy5jb25zdHJ1Y3RvciwgdGhpcy4kaWQsIGtleSwgaXRlbSk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgaXRlbSAkcmVtb3ZlZCBmcm9tIGhhc01hbnknKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCAkcmVtb3ZlIGV4Y2VwdCBmcm9tIGhhc01hbnkgZmllbGQnKSk7XG4gICAgfVxuICB9XG5cbiAgJGhhcyhrZXkpIHtcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci4kZmllbGRzW2tleV0udHlwZSA9PT0gJ2hhc01hbnknKSB7XG4gICAgICByZXR1cm4gdGhpc1skZ3VpbGRdLmhhcyh0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLiRpZCwga2V5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignQ2Fubm90ICRoYXMgb25seSB2YWxpZCBvbiBoYXNNYW55IGZpZWxkJykpO1xuICAgIH1cbiAgfVxuXG4gICR0ZWFyZG93bigpIHtcbiAgICB0aGlzWyR1bnN1YnNjcmliZV0udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG59XG5cbk1vZGVsLiRpZCA9ICdpZCc7XG5Nb2RlbC4kbmFtZSA9ICdCYXNlJztcbk1vZGVsLiRmaWVsZHMgPSB7XG4gIGlkOiB7XG4gICAgdHlwZTogJ251bWJlcicsXG4gIH0sXG59O1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
