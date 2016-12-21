'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Plump = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _model = require('./model');

var _Rx = require('rxjs/Rx');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $types = Symbol('$types');
var $storage = Symbol('$storage');
var $terminal = Symbol('$terminal');
var $subscriptions = Symbol('$subscriptions');

var Plump = exports.Plump = function () {
  function Plump() {
    var _this = this;

    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Plump);

    var options = Object.assign({}, {
      storage: [],
      types: []
    }, opts);
    this[$subscriptions] = {};
    this[$storage] = [];
    this[$types] = {};
    options.storage.forEach(function (s) {
      return _this.addStore(s);
    });
    options.types.forEach(function (t) {
      return _this.addType(t);
    });
  }

  _createClass(Plump, [{
    key: 'addTypesFromSchema',
    value: function addTypesFromSchema(schema) {
      var _this3 = this;

      var ExtendingModel = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _model.Model;

      Object.keys(schema).forEach(function (k) {
        var DynamicModel = function (_ExtendingModel) {
          _inherits(DynamicModel, _ExtendingModel);

          function DynamicModel() {
            _classCallCheck(this, DynamicModel);

            return _possibleConstructorReturn(this, (DynamicModel.__proto__ || Object.getPrototypeOf(DynamicModel)).apply(this, arguments));
          }

          return DynamicModel;
        }(ExtendingModel);

        DynamicModel.fromJSON(schema[k]);
        _this3.addType(DynamicModel);
      });
    }
  }, {
    key: 'addType',
    value: function addType(T) {
      if (this[$types][T.$name] === undefined) {
        this[$types][T.$name] = T;
      } else {
        throw new Error('Duplicate Type registered: ' + T.$name);
      }
    }
  }, {
    key: 'type',
    value: function type(T) {
      return this[$types][T];
    }
  }, {
    key: 'types',
    value: function types() {
      return Object.keys(this[$types]);
    }
  }, {
    key: 'addStore',
    value: function addStore(store) {
      var _this4 = this;

      if (store.terminal) {
        if (this[$terminal] === undefined) {
          this[$terminal] = store;
        } else {
          throw new Error('cannot have more than one terminal store');
        }
      } else {
        this[$storage].push(store);
      }
      if (store.terminal) {
        store.onUpdate(function (_ref) {
          var type = _ref.type,
              id = _ref.id,
              value = _ref.value,
              field = _ref.field;

          _this4[$storage].forEach(function (storage) {
            if (field) {
              storage.writeHasMany(type, id, field, value);
            } else {
              storage.write(type, value);
            }
            // storage.onCacheableRead(Type, Object.assign({}, u.value, { [Type.$id]: u.id }));
          });
          if (_this4[$subscriptions][type] && _this4[$subscriptions][type][id]) {
            _this4[$subscriptions][type][id].next(value);
          }
        });
      }
    }
  }, {
    key: 'find',
    value: function find(t, id) {
      var Type = t;
      if (typeof t === 'string') {
        Type = this[$types][t];
      }
      var retVal = new Type(_defineProperty({}, Type.$id, id), this);
      return retVal;
    }
  }, {
    key: 'forge',
    value: function forge(t, val) {
      var Type = t;
      if (typeof t === 'string') {
        Type = this[$types][t];
      }
      return new Type(val, this);
    }

    // LOAD (type/id), SIDELOAD (type/id/side)? Or just LOADALL?
    // LOAD needs to scrub through hot caches first

  }, {
    key: 'subscribe',
    value: function subscribe(typeName, id, handler) {
      if (this[$subscriptions][typeName] === undefined) {
        this[$subscriptions][typeName] = {};
      }
      if (this[$subscriptions][typeName][id] === undefined) {
        this[$subscriptions][typeName][id] = new _Rx.Subject();
      }
      return this[$subscriptions][typeName][id].subscribe(handler);
    }
  }, {
    key: 'get',
    value: function get() {
      var _this5 = this;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return this[$storage].reduce(function (thenable, storage) {
        return thenable.then(function (v) {
          if (v !== null) {
            return v;
          } else {
            return storage.read.apply(storage, args);
          }
        });
      }, Promise.resolve(null)).then(function (v) {
        if (v === null && _this5[$terminal]) {
          var _$terminal;

          return (_$terminal = _this5[$terminal]).read.apply(_$terminal, args);
        } else {
          return v;
        }
      }).then(function (v) {
        return v;
      });
    }
  }, {
    key: 'save',
    value: function save() {
      if (this[$terminal]) {
        var _$terminal2;

        return (_$terminal2 = this[$terminal]).write.apply(_$terminal2, arguments);
      } else {
        return Promise.reject(new Error('Plump has no terminal store'));
      }
    }
  }, {
    key: 'delete',
    value: function _delete() {
      if (this[$terminal]) {
        var _$terminal3;

        return (_$terminal3 = this[$terminal]).delete.apply(_$terminal3, arguments);
      } else {
        return Promise.reject(new Error('Plump has no terminal store'));
      }
    }
  }, {
    key: 'add',
    value: function add() {
      if (this[$terminal]) {
        var _$terminal4;

        return (_$terminal4 = this[$terminal]).add.apply(_$terminal4, arguments);
      } else {
        return Promise.reject(new Error('Plump has no terminal store'));
      }
    }
  }, {
    key: 'restRequest',
    value: function restRequest(opts) {
      if (this[$terminal] && this[$terminal].rest) {
        return this[$terminal].rest(opts);
      } else {
        return Promise.reject(new Error('No Rest terminal store'));
      }
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship() {
      if (this[$terminal]) {
        var _$terminal5;

        return (_$terminal5 = this[$terminal]).modifyRelationship.apply(_$terminal5, arguments);
      } else {
        return Promise.reject(new Error('Plump has no terminal store'));
      }
    }
  }, {
    key: 'remove',
    value: function remove() {
      if (this[$terminal]) {
        var _$terminal6;

        return (_$terminal6 = this[$terminal]).remove.apply(_$terminal6, arguments);
      } else {
        return Promise.reject(new Error('Plump has no terminal store'));
      }
    }
  }, {
    key: 'dispatchUpdateToStores',
    value: function dispatchUpdateToStores(update) {}
  }, {
    key: 'dispatchUpdateToModels',
    value: function dispatchUpdateToModels(update) {}
  }]);

  return Plump;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBsdW1wLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHN1YnNjcmlwdGlvbnMiLCJQbHVtcCIsIm9wdHMiLCJvcHRpb25zIiwiT2JqZWN0IiwiYXNzaWduIiwic3RvcmFnZSIsInR5cGVzIiwiZm9yRWFjaCIsInMiLCJhZGRTdG9yZSIsInQiLCJhZGRUeXBlIiwic2NoZW1hIiwiRXh0ZW5kaW5nTW9kZWwiLCJrZXlzIiwiayIsIkR5bmFtaWNNb2RlbCIsImZyb21KU09OIiwiVCIsIiRuYW1lIiwidW5kZWZpbmVkIiwiRXJyb3IiLCJzdG9yZSIsInRlcm1pbmFsIiwicHVzaCIsIm9uVXBkYXRlIiwidHlwZSIsImlkIiwidmFsdWUiLCJmaWVsZCIsIndyaXRlSGFzTWFueSIsIndyaXRlIiwibmV4dCIsIlR5cGUiLCJyZXRWYWwiLCIkaWQiLCJ2YWwiLCJ0eXBlTmFtZSIsImhhbmRsZXIiLCJzdWJzY3JpYmUiLCJhcmdzIiwicmVkdWNlIiwidGhlbmFibGUiLCJ0aGVuIiwidiIsInJlYWQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImRlbGV0ZSIsImFkZCIsInJlc3QiLCJtb2RpZnlSZWxhdGlvbnNoaXAiLCJyZW1vdmUiLCJ1cGRhdGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUtBOztBQUVBOzs7Ozs7Ozs7O0FBUEEsSUFBTUEsU0FBU0MsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNQyxXQUFXRCxPQUFPLFVBQVAsQ0FBakI7QUFDQSxJQUFNRSxZQUFZRixPQUFPLFdBQVAsQ0FBbEI7QUFDQSxJQUFNRyxpQkFBaUJILE9BQU8sZ0JBQVAsQ0FBdkI7O0lBTWFJLEssV0FBQUEsSztBQUNYLG1CQUF1QjtBQUFBOztBQUFBLFFBQVhDLElBQVcsdUVBQUosRUFBSTs7QUFBQTs7QUFDckIsUUFBTUMsVUFBVUMsT0FBT0MsTUFBUCxDQUFjLEVBQWQsRUFBa0I7QUFDaENDLGVBQVMsRUFEdUI7QUFF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QUosQ0FBVSw2QkFBVixDQUFmLENBQVA7QUFDRDtBQUNGOzs7Z0NBRVdwQixJLEVBQU07QUFDaEIsVUFBSSxLQUFLSCxTQUFMLEtBQW1CLEtBQUtBLFNBQUwsRUFBZ0JxRCxJQUF2QyxFQUE2QztBQUMzQyxlQUFPLEtBQUtyRCxTQUFMLEVBQWdCcUQsSUFBaEIsQ0FBcUJsRCxJQUFyQixDQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBTzZDLFFBQVFFLE1BQVIsQ0FBZSxJQUFJM0IsS0FBSixDQUFVLHdCQUFWLENBQWYsQ0FBUDtBQUNEO0FBQ0Y7Ozt5Q0FFMkI7QUFDMUIsVUFBSSxLQUFLdkIsU0FBTCxDQUFKLEVBQXFCO0FBQUE7O0FBQ25CLGVBQU8sb0JBQUtBLFNBQUwsR0FBZ0JzRCxrQkFBaEIsOEJBQVA7QUFDRCxPQUZELE1BRU87QUFDTCxlQUFPTixRQUFRRSxNQUFSLENBQWUsSUFBSTNCLEtBQUosQ0FBVSw2QkFBVixDQUFmLENBQVA7QUFDRDtBQUNGOzs7NkJBRWU7QUFDZCxVQUFJLEtBQUt2QixTQUFMLENBQUosRUFBcUI7QUFBQTs7QUFDbkIsZUFBTyxvQkFBS0EsU0FBTCxHQUFnQnVELE1BQWhCLDhCQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBT1AsUUFBUUUsTUFBUixDQUFlLElBQUkzQixLQUFKLENBQVUsNkJBQVYsQ0FBZixDQUFQO0FBQ0Q7QUFDRjs7OzJDQUVzQmlDLE0sRUFBUSxDQUFFOzs7MkNBQ1ZBLE0sRUFBUSxDQUFFIiwiZmlsZSI6InBsdW1wLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgJHR5cGVzID0gU3ltYm9sKCckdHlwZXMnKTtcbmNvbnN0ICRzdG9yYWdlID0gU3ltYm9sKCckc3RvcmFnZScpO1xuY29uc3QgJHRlcm1pbmFsID0gU3ltYm9sKCckdGVybWluYWwnKTtcbmNvbnN0ICRzdWJzY3JpcHRpb25zID0gU3ltYm9sKCckc3Vic2NyaXB0aW9ucycpO1xuXG5pbXBvcnQgeyBNb2RlbCB9IGZyb20gJy4vbW9kZWwnO1xuXG5pbXBvcnQgeyBTdWJqZWN0IH0gZnJvbSAncnhqcy9SeCc7XG5cbmV4cG9ydCBjbGFzcyBQbHVtcCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB7XG4gICAgICBzdG9yYWdlOiBbXSxcbiAgICAgIHR5cGVzOiBbXSxcbiAgICB9LCBvcHRzKTtcbiAgICB0aGlzWyRzdWJzY3JpcHRpb25zXSA9IHt9O1xuICAgIHRoaXNbJHN0b3JhZ2VdID0gW107XG4gICAgdGhpc1skdHlwZXNdID0ge307XG4gICAgb3B0aW9ucy5zdG9yYWdlLmZvckVhY2goKHMpID0+IHRoaXMuYWRkU3RvcmUocykpO1xuICAgIG9wdGlvbnMudHlwZXMuZm9yRWFjaCgodCkgPT4gdGhpcy5hZGRUeXBlKHQpKTtcbiAgfVxuXG4gIGFkZFR5cGVzRnJvbVNjaGVtYShzY2hlbWEsIEV4dGVuZGluZ01vZGVsID0gTW9kZWwpIHtcbiAgICBPYmplY3Qua2V5cyhzY2hlbWEpLmZvckVhY2goKGspID0+IHtcbiAgICAgIGNsYXNzIER5bmFtaWNNb2RlbCBleHRlbmRzIEV4dGVuZGluZ01vZGVsIHt9XG4gICAgICBEeW5hbWljTW9kZWwuZnJvbUpTT04oc2NoZW1hW2tdKTtcbiAgICAgIHRoaXMuYWRkVHlwZShEeW5hbWljTW9kZWwpO1xuICAgIH0pO1xuICB9XG5cbiAgYWRkVHlwZShUKSB7XG4gICAgaWYgKHRoaXNbJHR5cGVzXVtULiRuYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyR0eXBlc11bVC4kbmFtZV0gPSBUO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYER1cGxpY2F0ZSBUeXBlIHJlZ2lzdGVyZWQ6ICR7VC4kbmFtZX1gKTtcbiAgICB9XG4gIH1cblxuICB0eXBlKFQpIHtcbiAgICByZXR1cm4gdGhpc1skdHlwZXNdW1RdO1xuICB9XG5cbiAgdHlwZXMoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXNbJHR5cGVzXSk7XG4gIH1cblxuICBhZGRTdG9yZShzdG9yZSkge1xuICAgIGlmIChzdG9yZS50ZXJtaW5hbCkge1xuICAgICAgaWYgKHRoaXNbJHRlcm1pbmFsXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXNbJHRlcm1pbmFsXSA9IHN0b3JlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgaGF2ZSBtb3JlIHRoYW4gb25lIHRlcm1pbmFsIHN0b3JlJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXNbJHN0b3JhZ2VdLnB1c2goc3RvcmUpO1xuICAgIH1cbiAgICBpZiAoc3RvcmUudGVybWluYWwpIHtcbiAgICAgIHN0b3JlLm9uVXBkYXRlKCh7IHR5cGUsIGlkLCB2YWx1ZSwgZmllbGQgfSkgPT4ge1xuICAgICAgICB0aGlzWyRzdG9yYWdlXS5mb3JFYWNoKChzdG9yYWdlKSA9PiB7XG4gICAgICAgICAgaWYgKGZpZWxkKSB7XG4gICAgICAgICAgICBzdG9yYWdlLndyaXRlSGFzTWFueSh0eXBlLCBpZCwgZmllbGQsIHZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RvcmFnZS53cml0ZSh0eXBlLCB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHN0b3JhZ2Uub25DYWNoZWFibGVSZWFkKFR5cGUsIE9iamVjdC5hc3NpZ24oe30sIHUudmFsdWUsIHsgW1R5cGUuJGlkXTogdS5pZCB9KSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZV0gJiYgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZV1baWRdKSB7XG4gICAgICAgICAgdGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZV1baWRdLm5leHQodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBmaW5kKHQsIGlkKSB7XG4gICAgbGV0IFR5cGUgPSB0O1xuICAgIGlmICh0eXBlb2YgdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIFR5cGUgPSB0aGlzWyR0eXBlc11bdF07XG4gICAgfVxuICAgIGNvbnN0IHJldFZhbCA9IG5ldyBUeXBlKHsgW1R5cGUuJGlkXTogaWQgfSwgdGhpcyk7XG4gICAgcmV0dXJuIHJldFZhbDtcbiAgfVxuXG4gIGZvcmdlKHQsIHZhbCkge1xuICAgIGxldCBUeXBlID0gdDtcbiAgICBpZiAodHlwZW9mIHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBUeXBlID0gdGhpc1skdHlwZXNdW3RdO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFR5cGUodmFsLCB0aGlzKTtcbiAgfVxuXG4gIC8vIExPQUQgKHR5cGUvaWQpLCBTSURFTE9BRCAodHlwZS9pZC9zaWRlKT8gT3IganVzdCBMT0FEQUxMP1xuICAvLyBMT0FEIG5lZWRzIHRvIHNjcnViIHRocm91Z2ggaG90IGNhY2hlcyBmaXJzdFxuXG4gIHN1YnNjcmliZSh0eXBlTmFtZSwgaWQsIGhhbmRsZXIpIHtcbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXSA9IHt9O1xuICAgIH1cbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdW2lkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV1baWRdID0gbmV3IFN1YmplY3QoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXVtpZF0uc3Vic2NyaWJlKGhhbmRsZXIpO1xuICB9XG5cbiAgZ2V0KC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmFnZV0ucmVkdWNlKCh0aGVuYWJsZSwgc3RvcmFnZSkgPT4ge1xuICAgICAgcmV0dXJuIHRoZW5hYmxlLnRoZW4oKHYpID0+IHtcbiAgICAgICAgaWYgKHYgIT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gc3RvcmFnZS5yZWFkKC4uLmFyZ3MpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LCBQcm9taXNlLnJlc29sdmUobnVsbCkpXG4gICAgLnRoZW4oKHYpID0+IHtcbiAgICAgIGlmICgodiA9PT0gbnVsbCkgJiYgKHRoaXNbJHRlcm1pbmFsXSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZWFkKC4uLmFyZ3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgICB9XG4gICAgfSkudGhlbigodikgPT4ge1xuICAgICAgcmV0dXJuIHY7XG4gICAgfSk7XG4gIH1cblxuICBzYXZlKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLndyaXRlKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgZGVsZXRlKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLmRlbGV0ZSguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIGFkZCguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5hZGQoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICByZXN0UmVxdWVzdChvcHRzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSAmJiB0aGlzWyR0ZXJtaW5hbF0ucmVzdCkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZXN0KG9wdHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdObyBSZXN0IHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIG1vZGlmeVJlbGF0aW9uc2hpcCguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXNbJHRlcm1pbmFsXSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5tb2RpZnlSZWxhdGlvbnNoaXAoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICByZW1vdmUoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVtb3ZlKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgZGlzcGF0Y2hVcGRhdGVUb1N0b3Jlcyh1cGRhdGUpIHt9XG4gIGRpc3BhdGNoVXBkYXRlVG9Nb2RlbHModXBkYXRlKSB7fVxufVxuIl19
