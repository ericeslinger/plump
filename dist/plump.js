'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Plump = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _model = require('./model');

var _Rx = require('rxjs/Rx');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $types = Symbol('$types');
var $storage = Symbol('$storage');
var $terminal = Symbol('$terminal');
var $teardown = Symbol('$teardown');
var $subscriptions = Symbol('$subscriptions');
var $storeSubscriptions = Symbol('$storeSubscriptions');

var Plump = exports.Plump = function () {
  function Plump() {
    var _this = this;

    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Plump);

    var options = Object.assign({}, {
      storage: [],
      types: []
    }, opts);
    this[$teardown] = new _Rx.Subject();
    this.destroy = this[$teardown].asObservable();
    this[$subscriptions] = {};
    this[$storeSubscriptions] = [];
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
    value: function addTypesFromSchema(schemata) {
      var ExtendingModel = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _model.Model;

      for (var k in schemata) {
        // eslint-disable-line guard-for-in
        var DynamicModel = function (_ExtendingModel) {
          _inherits(DynamicModel, _ExtendingModel);

          function DynamicModel() {
            _classCallCheck(this, DynamicModel);

            return _possibleConstructorReturn(this, (DynamicModel.__proto__ || Object.getPrototypeOf(DynamicModel)).apply(this, arguments));
          }

          return DynamicModel;
        }(ExtendingModel);

        DynamicModel.fromJSON(schemata[k]);
        this.addType(DynamicModel);
      }
    }
  }, {
    key: 'addType',
    value: function addType(T) {
      if (this[$types][T.$name] === undefined) {
        this[$types][T.$name] = T;
        this[$storage].forEach(function (s) {
          return s.addType(T);
        });
        this[$terminal].addType(T);
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
      var _this3 = this;

      if (store.terminal) {
        if (this[$terminal] !== undefined) {
          throw new Error('cannot have more than one terminal store');
        } else {
          this[$terminal] = store;
          this[$storage].forEach(function (cacheStore) {
            store.observable.takeUntil(_this3.destroy).subscribe(function (val) {
              return cacheStore.write(val);
            });
          });
        }
      } else {
        this[$storage].push(store);
        if (this[$terminal] !== undefined) {
          this[$terminal].observable.takeUntil(this.destroy).subscribe(function (val) {
            return store.write(val);
          });
        }
      }
      this.types().forEach(function (t) {
        return store.addType(_this3.type(t));
      });
    }
  }, {
    key: 'find',
    value: function find(t, id) {
      var Type = typeof t === 'string' ? this[$types][t] : t;
      return new Type(_defineProperty({}, Type.$id, id), this);
    }
  }, {
    key: 'forge',
    value: function forge(t, val) {
      var Type = typeof t === 'string' ? this[$types][t] : t;
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
    key: 'teardown',
    value: function teardown() {
      this[$teardown].next(0);
    }
  }, {
    key: 'get',
    value: function get(type, id, opts) {
      var _this4 = this;

      var keys = opts && !Array.isArray(opts) ? [opts] : opts;
      return this[$storage].reduce(function (thenable, storage) {
        return thenable.then(function (v) {
          if (v !== null) {
            return v;
          } else if (storage.hot(type, id)) {
            return storage.read(type, id, keys);
          } else {
            return null;
          }
        });
      }, Promise.resolve(null)).then(function (v) {
        if ((v === null || v.attributes === null) && _this4[$terminal]) {
          return _this4[$terminal].read(type, id, keys);
        } else {
          return v;
        }
      });
    }
  }, {
    key: 'streamGet',
    value: function streamGet(type, id, opts) {
      var _this5 = this;

      var keys = opts && !Array.isArray(opts) ? [opts] : opts;
      return _Rx.Observable.create(function (observer) {
        return _bluebird2.default.all(_this5[$storage].map(function (store) {
          return store.read(type, id, keys).then(function (v) {
            observer.next(v);
            if (store.hot(type, id)) {
              return v;
            } else {
              return null;
            }
          });
        })).then(function (valArray) {
          var possiVal = valArray.filter(function (v) {
            return v !== null;
          });
          if (possiVal.length === 0 && _this5[$terminal]) {
            return _this5[$terminal].read(type, id, keys).then(function (val) {
              observer.next(val);
              return val;
            });
          } else {
            return possiVal[0];
          }
        }).then(function (v) {
          observer.complete();
          return v;
        });
      });
    }
  }, {
    key: 'bulkGet',
    value: function bulkGet(type, id) {
      return this[$terminal].bulkRead(type, id);
    }
  }, {
    key: 'save',
    value: function save() {
      if (this[$terminal]) {
        var _$terminal;

        return (_$terminal = this[$terminal]).write.apply(_$terminal, arguments);
      } else {
        return Promise.reject(new Error('Plump has no terminal store'));
      }
    }
  }, {
    key: 'delete',
    value: function _delete() {
      var _this6 = this;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (this[$terminal]) {
        var _$terminal2;

        return (_$terminal2 = this[$terminal]).delete.apply(_$terminal2, args).then(function () {
          return _bluebird2.default.all(_this6[$storage].map(function (store) {
            return store.delete.apply(store, args);
          }));
        });
      } else {
        return Promise.reject(new Error('Plump has no terminal store'));
      }
    }
  }, {
    key: 'add',
    value: function add() {
      if (this[$terminal]) {
        var _$terminal3;

        return (_$terminal3 = this[$terminal]).add.apply(_$terminal3, arguments);
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
        var _$terminal4;

        return (_$terminal4 = this[$terminal]).modifyRelationship.apply(_$terminal4, arguments);
      } else {
        return Promise.reject(new Error('Plump has no terminal store'));
      }
    }
  }, {
    key: 'remove',
    value: function remove() {
      if (this[$terminal]) {
        var _$terminal5;

        return (_$terminal5 = this[$terminal]).remove.apply(_$terminal5, arguments);
      } else {
        return Promise.reject(new Error('Plump has no terminal store'));
      }
    }
  }, {
    key: 'invalidate',
    value: function invalidate(type, id, field) {
      var _this7 = this;

      var hots = this[$storage].filter(function (store) {
        return store.hot(type, id);
      });
      if (this[$terminal].hot(type, id)) {
        hots.push(this[$terminal]);
      }
      return _bluebird2.default.all(hots.map(function (store) {
        return store.wipe(type, id, field);
      })).then(function () {
        if (_this7[$subscriptions][type.$name] && _this7[$subscriptions][type.$name][id]) {
          return _this7[$terminal].read(type, id, field);
        } else {
          return null;
        }
      });
    }
  }]);

  return Plump;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBsdW1wLmpzIl0sIm5hbWVzIjpbIiR0eXBlcyIsIlN5bWJvbCIsIiRzdG9yYWdlIiwiJHRlcm1pbmFsIiwiJHRlYXJkb3duIiwiJHN1YnNjcmlwdGlvbnMiLCIkc3RvcmVTdWJzY3JpcHRpb25zIiwiUGx1bXAiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInN0b3JhZ2UiLCJ0eXBlcyIsImRlc3Ryb3kiLCJhc09ic2VydmFibGUiLCJmb3JFYWNoIiwicyIsImFkZFN0b3JlIiwidCIsImFkZFR5cGUiLCJzY2hlbWF0YSIsIkV4dGVuZGluZ01vZGVsIiwiayIsIkR5bmFtaWNNb2RlbCIsImZyb21KU09OIiwiVCIsIiRuYW1lIiwidW5kZWZpbmVkIiwiRXJyb3IiLCJrZXlzIiwic3RvcmUiLCJ0ZXJtaW5hbCIsImNhY2hlU3RvcmUiLCJvYnNlcnZhYmxlIiwidGFrZVVudGlsIiwic3Vic2NyaWJlIiwidmFsIiwid3JpdGUiLCJwdXNoIiwidHlwZSIsImlkIiwiVHlwZSIsIiRpZCIsInR5cGVOYW1lIiwiaGFuZGxlciIsIm5leHQiLCJBcnJheSIsImlzQXJyYXkiLCJyZWR1Y2UiLCJ0aGVuYWJsZSIsInRoZW4iLCJ2IiwiaG90IiwicmVhZCIsIlByb21pc2UiLCJyZXNvbHZlIiwiYXR0cmlidXRlcyIsImNyZWF0ZSIsIm9ic2VydmVyIiwiYWxsIiwibWFwIiwidmFsQXJyYXkiLCJwb3NzaVZhbCIsImZpbHRlciIsImxlbmd0aCIsImNvbXBsZXRlIiwiYnVsa1JlYWQiLCJyZWplY3QiLCJhcmdzIiwiZGVsZXRlIiwiYWRkIiwicmVzdCIsIm1vZGlmeVJlbGF0aW9uc2hpcCIsInJlbW92ZSIsImZpZWxkIiwiaG90cyIsIndpcGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7Ozs7Ozs7Ozs7OztBQUVBLElBQU1BLFNBQVNDLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTUMsV0FBV0QsT0FBTyxVQUFQLENBQWpCO0FB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QSxPQUF0QixDQUFiO0FBQ0EsVUFBSSxLQUFLdEMsU0FBTCxFQUFnQmtELEdBQWhCLENBQW9CYixJQUFwQixFQUEwQkMsRUFBMUIsQ0FBSixFQUFtQztBQUNqQ21DLGFBQUtyQyxJQUFMLENBQVUsS0FBS3BDLFNBQUwsQ0FBVjtBQUNEO0FBQ0QsYUFBTyxtQkFBU3lELEdBQVQsQ0FBYWdCLEtBQUtmLEdBQUwsQ0FBUyxVQUFDOUIsS0FBRCxFQUFXO0FBQ3RDLGVBQU9BLE1BQU04QyxJQUFOLENBQVdyQyxJQUFYLEVBQWlCQyxFQUFqQixFQUFxQmtDLEtBQXJCLENBQVA7QUFDRCxPQUZtQixDQUFiLEVBRUh4QixJQUZHLENBRUUsWUFBTTtBQUNiLFlBQUksT0FBSzlDLGNBQUwsRUFBcUJtQyxLQUFLYixLQUExQixLQUFvQyxPQUFLdEIsY0FBTCxFQUFxQm1DLEtBQUtiLEtBQTFCLEVBQWlDYyxFQUFqQyxDQUF4QyxFQUE4RTtBQUM1RSxpQkFBTyxPQUFLdEMsU0FBTCxFQUFnQm1ELElBQWhCLENBQXFCZCxJQUFyQixFQUEyQkMsRUFBM0IsRUFBK0JrQyxLQUEvQixDQUFQO0FBQ0QsU0FGRCxNQUVPO0FBQ0wsaUJBQU8sSUFBUDtBQUNEO0FBQ0YsT0FSTSxDQUFQO0FBU0QiLCJmaWxlIjoicGx1bXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2RlbCB9IGZyb20gJy4vbW9kZWwnO1xuaW1wb3J0IHsgU3ViamVjdCwgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMvUngnO1xuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcblxuY29uc3QgJHR5cGVzID0gU3ltYm9sKCckdHlwZXMnKTtcbmNvbnN0ICRzdG9yYWdlID0gU3ltYm9sKCckc3RvcmFnZScpO1xuY29uc3QgJHRlcm1pbmFsID0gU3ltYm9sKCckdGVybWluYWwnKTtcbmNvbnN0ICR0ZWFyZG93biA9IFN5bWJvbCgnJHRlYXJkb3duJyk7XG5jb25zdCAkc3Vic2NyaXB0aW9ucyA9IFN5bWJvbCgnJHN1YnNjcmlwdGlvbnMnKTtcbmNvbnN0ICRzdG9yZVN1YnNjcmlwdGlvbnMgPSBTeW1ib2woJyRzdG9yZVN1YnNjcmlwdGlvbnMnKTtcblxuZXhwb3J0IGNsYXNzIFBsdW1wIHtcbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIHtcbiAgICAgIHN0b3JhZ2U6IFtdLFxuICAgICAgdHlwZXM6IFtdLFxuICAgIH0sIG9wdHMpO1xuICAgIHRoaXNbJHRlYXJkb3duXSA9IG5ldyBTdWJqZWN0KCk7XG4gICAgdGhpcy5kZXN0cm95ID0gdGhpc1skdGVhcmRvd25dLmFzT2JzZXJ2YWJsZSgpO1xuICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdID0ge307XG4gICAgdGhpc1skc3RvcmVTdWJzY3JpcHRpb25zXSA9IFtdO1xuICAgIHRoaXNbJHN0b3JhZ2VdID0gW107XG4gICAgdGhpc1skdHlwZXNdID0ge307XG4gICAgb3B0aW9ucy5zdG9yYWdlLmZvckVhY2goKHMpID0+IHRoaXMuYWRkU3RvcmUocykpO1xuICAgIG9wdGlvbnMudHlwZXMuZm9yRWFjaCgodCkgPT4gdGhpcy5hZGRUeXBlKHQpKTtcbiAgfVxuXG4gIGFkZFR5cGVzRnJvbVNjaGVtYShzY2hlbWF0YSwgRXh0ZW5kaW5nTW9kZWwgPSBNb2RlbCkge1xuICAgIGZvciAoY29uc3QgayBpbiBzY2hlbWF0YSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGd1YXJkLWZvci1pblxuICAgICAgY2xhc3MgRHluYW1pY01vZGVsIGV4dGVuZHMgRXh0ZW5kaW5nTW9kZWwge31cbiAgICAgIER5bmFtaWNNb2RlbC5mcm9tSlNPTihzY2hlbWF0YVtrXSk7XG4gICAgICB0aGlzLmFkZFR5cGUoRHluYW1pY01vZGVsKTtcbiAgICB9XG4gIH1cblxuICBhZGRUeXBlKFQpIHtcbiAgICBpZiAodGhpc1skdHlwZXNdW1QuJG5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHR5cGVzXVtULiRuYW1lXSA9IFQ7XG4gICAgICB0aGlzWyRzdG9yYWdlXS5mb3JFYWNoKHMgPT4gcy5hZGRUeXBlKFQpKTtcbiAgICAgIHRoaXNbJHRlcm1pbmFsXS5hZGRUeXBlKFQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYER1cGxpY2F0ZSBUeXBlIHJlZ2lzdGVyZWQ6ICR7VC4kbmFtZX1gKTtcbiAgICB9XG4gIH1cblxuICB0eXBlKFQpIHtcbiAgICByZXR1cm4gdGhpc1skdHlwZXNdW1RdO1xuICB9XG5cbiAgdHlwZXMoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXNbJHR5cGVzXSk7XG4gIH1cblxuICBhZGRTdG9yZShzdG9yZSkge1xuICAgIGlmIChzdG9yZS50ZXJtaW5hbCkge1xuICAgICAgaWYgKHRoaXNbJHRlcm1pbmFsXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGhhdmUgbW9yZSB0aGFuIG9uZSB0ZXJtaW5hbCBzdG9yZScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpc1skdGVybWluYWxdID0gc3RvcmU7XG4gICAgICAgIHRoaXNbJHN0b3JhZ2VdLmZvckVhY2goKGNhY2hlU3RvcmUpID0+IHtcbiAgICAgICAgICBzdG9yZS5vYnNlcnZhYmxlLnRha2VVbnRpbCh0aGlzLmRlc3Ryb3kpLnN1YnNjcmliZSgodmFsKSA9PiBjYWNoZVN0b3JlLndyaXRlKHZhbCkpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpc1skc3RvcmFnZV0ucHVzaChzdG9yZSk7XG4gICAgICBpZiAodGhpc1skdGVybWluYWxdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpc1skdGVybWluYWxdLm9ic2VydmFibGUudGFrZVVudGlsKHRoaXMuZGVzdHJveSkuc3Vic2NyaWJlKCh2YWwpID0+IHN0b3JlLndyaXRlKHZhbCkpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnR5cGVzKCkuZm9yRWFjaCh0ID0+IHN0b3JlLmFkZFR5cGUodGhpcy50eXBlKHQpKSk7XG4gIH1cblxuICBmaW5kKHQsIGlkKSB7XG4gICAgY29uc3QgVHlwZSA9IHR5cGVvZiB0ID09PSAnc3RyaW5nJyA/IHRoaXNbJHR5cGVzXVt0XSA6IHQ7XG4gICAgcmV0dXJuIG5ldyBUeXBlKHsgW1R5cGUuJGlkXTogaWQgfSwgdGhpcyk7XG4gIH1cblxuICBmb3JnZSh0LCB2YWwpIHtcbiAgICBjb25zdCBUeXBlID0gdHlwZW9mIHQgPT09ICdzdHJpbmcnID8gdGhpc1skdHlwZXNdW3RdIDogdDtcbiAgICByZXR1cm4gbmV3IFR5cGUodmFsLCB0aGlzKTtcbiAgfVxuXG4gIC8vIExPQUQgKHR5cGUvaWQpLCBTSURFTE9BRCAodHlwZS9pZC9zaWRlKT8gT3IganVzdCBMT0FEQUxMP1xuICAvLyBMT0FEIG5lZWRzIHRvIHNjcnViIHRocm91Z2ggaG90IGNhY2hlcyBmaXJzdFxuXG4gIHN1YnNjcmliZSh0eXBlTmFtZSwgaWQsIGhhbmRsZXIpIHtcbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXSA9IHt9O1xuICAgIH1cbiAgICBpZiAodGhpc1skc3Vic2NyaXB0aW9uc11bdHlwZU5hbWVdW2lkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlTmFtZV1baWRdID0gbmV3IFN1YmplY3QoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNbJHN1YnNjcmlwdGlvbnNdW3R5cGVOYW1lXVtpZF0uc3Vic2NyaWJlKGhhbmRsZXIpO1xuICB9XG5cbiAgdGVhcmRvd24oKSB7XG4gICAgdGhpc1skdGVhcmRvd25dLm5leHQoMCk7XG4gIH1cblxuICBnZXQodHlwZSwgaWQsIG9wdHMpIHtcbiAgICBjb25zdCBrZXlzID0gb3B0cyAmJiAhQXJyYXkuaXNBcnJheShvcHRzKSA/IFtvcHRzXSA6IG9wdHM7XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JhZ2VdLnJlZHVjZSgodGhlbmFibGUsIHN0b3JhZ2UpID0+IHtcbiAgICAgIHJldHVybiB0aGVuYWJsZS50aGVuKCh2KSA9PiB7XG4gICAgICAgIGlmICh2ICE9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RvcmFnZS5ob3QodHlwZSwgaWQpKSB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JhZ2UucmVhZCh0eXBlLCBpZCwga2V5cyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sIFByb21pc2UucmVzb2x2ZShudWxsKSlcbiAgICAudGhlbigodikgPT4ge1xuICAgICAgaWYgKCgodiA9PT0gbnVsbCkgfHwgKHYuYXR0cmlidXRlcyA9PT0gbnVsbCkpICYmICh0aGlzWyR0ZXJtaW5hbF0pKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVhZCh0eXBlLCBpZCwga2V5cyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdjtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHN0cmVhbUdldCh0eXBlLCBpZCwgb3B0cykge1xuICAgIGNvbnN0IGtleXMgPSBvcHRzICYmICFBcnJheS5pc0FycmF5KG9wdHMpID8gW29wdHNdIDogb3B0cztcbiAgICByZXR1cm4gT2JzZXJ2YWJsZS5jcmVhdGUoKG9ic2VydmVyKSA9PiB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKCh0aGlzWyRzdG9yYWdlXS5tYXAoKHN0b3JlKSA9PiB7XG4gICAgICAgIHJldHVybiBzdG9yZS5yZWFkKHR5cGUsIGlkLCBrZXlzKVxuICAgICAgICAudGhlbigodikgPT4ge1xuICAgICAgICAgIG9ic2VydmVyLm5leHQodik7XG4gICAgICAgICAgaWYgKHN0b3JlLmhvdCh0eXBlLCBpZCkpIHtcbiAgICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSkpKVxuICAgICAgLnRoZW4oKHZhbEFycmF5KSA9PiB7XG4gICAgICAgIGNvbnN0IHBvc3NpVmFsID0gdmFsQXJyYXkuZmlsdGVyKCh2KSA9PiB2ICE9PSBudWxsKTtcbiAgICAgICAgaWYgKChwb3NzaVZhbC5sZW5ndGggPT09IDApICYmICh0aGlzWyR0ZXJtaW5hbF0pKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZWFkKHR5cGUsIGlkLCBrZXlzKVxuICAgICAgICAgIC50aGVuKCh2YWwpID0+IHtcbiAgICAgICAgICAgIG9ic2VydmVyLm5leHQodmFsKTtcbiAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHBvc3NpVmFsWzBdO1xuICAgICAgICB9XG4gICAgICB9KS50aGVuKCh2KSA9PiB7XG4gICAgICAgIG9ic2VydmVyLmNvbXBsZXRlKCk7XG4gICAgICAgIHJldHVybiB2O1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBidWxrR2V0KHR5cGUsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5idWxrUmVhZCh0eXBlLCBpZCk7XG4gIH1cblxuICBzYXZlKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLndyaXRlKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgZGVsZXRlKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLmRlbGV0ZSguLi5hcmdzKS50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbCh0aGlzWyRzdG9yYWdlXS5tYXAoKHN0b3JlKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JlLmRlbGV0ZSguLi5hcmdzKTtcbiAgICAgICAgfSkpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBhZGQoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0uYWRkKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgcmVzdFJlcXVlc3Qob3B0cykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0gJiYgdGhpc1skdGVybWluYWxdLnJlc3QpIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ucmVzdChvcHRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignTm8gUmVzdCB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBtb2RpZnlSZWxhdGlvbnNoaXAoLi4uYXJncykge1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0pIHtcbiAgICAgIHJldHVybiB0aGlzWyR0ZXJtaW5hbF0ubW9kaWZ5UmVsYXRpb25zaGlwKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpc1skdGVybWluYWxdKSB7XG4gICAgICByZXR1cm4gdGhpc1skdGVybWluYWxdLnJlbW92ZSguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIGludmFsaWRhdGUodHlwZSwgaWQsIGZpZWxkKSB7XG4gICAgY29uc3QgaG90cyA9IHRoaXNbJHN0b3JhZ2VdLmZpbHRlcigoc3RvcmUpID0+IHN0b3JlLmhvdCh0eXBlLCBpZCkpO1xuICAgIGlmICh0aGlzWyR0ZXJtaW5hbF0uaG90KHR5cGUsIGlkKSkge1xuICAgICAgaG90cy5wdXNoKHRoaXNbJHRlcm1pbmFsXSk7XG4gICAgfVxuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoaG90cy5tYXAoKHN0b3JlKSA9PiB7XG4gICAgICByZXR1cm4gc3RvcmUud2lwZSh0eXBlLCBpZCwgZmllbGQpO1xuICAgIH0pKS50aGVuKCgpID0+IHtcbiAgICAgIGlmICh0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlLiRuYW1lXSAmJiB0aGlzWyRzdWJzY3JpcHRpb25zXVt0eXBlLiRuYW1lXVtpZF0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHRlcm1pbmFsXS5yZWFkKHR5cGUsIGlkLCBmaWVsZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIl19
