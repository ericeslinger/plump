'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Guild = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Rx = require('rxjs/Rx');

var _Rx2 = _interopRequireDefault(_Rx);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $types = Symbol('$types');
var $storage = Symbol('$storage');
var $terminal = Symbol('$terminal');
var $subscriptions = Symbol('$subscriptions');

var Guild = exports.Guild = function () {
  function Guild() {
    var _this = this;

    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Guild);

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

  _createClass(Guild, [{
    key: 'addType',
    value: function addType(T) {
      if (this[$types][T.$name] === undefined) {
        this[$types][T.$name] = T;
      } else {
        throw new Error('Duplicate Type registered: ' + T.$name);
      }
    }
  }, {
    key: 'addStore',
    value: function addStore(store) {
      var _this2 = this;

      if (store.terminal) {
        if (this[$terminal] === undefined) {
          this[$terminal] = store;
        } else {
          throw new Error('cannot have more than one terminal store');
        }
      } else {
        this[$storage].push(store);
      }
      store.onUpdate(function (u) {
        _this2[$storage].forEach(function (storage) {
          var Type = _this2[$types][u.type];
          storage.onCacheableRead(Type, Object.assign({}, u.value, _defineProperty({}, Type.$id, u.id)));
        });
        if (_this2[$subscriptions][u.type] && _this2[$subscriptions][u.type][u.id]) {
          _this2[$subscriptions][u.type][u.id].next(u.value);
        }
      });
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

    // LOAD (type/id), SIDELOAD (type/id/side)? Or just LOADALL?
    // LOAD needs to scrub through hot caches first

  }, {
    key: 'subscribe',
    value: function subscribe(typeName, id, handler) {
      if (this[$subscriptions][typeName] === undefined) {
        this[$subscriptions][typeName] = {};
      }
      if (this[$subscriptions][typeName][id] === undefined) {
        this[$subscriptions][typeName][id] = new _Rx2.default.Subject();
      }
      return this[$subscriptions][typeName][id].subscribe(handler);
    }
  }, {
    key: 'get',
    value: function get() {
      var _this3 = this;

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
        if (v === null && _this3[$terminal]) {
          var _$terminal;

          return (_$terminal = _this3[$terminal]).read.apply(_$terminal, args);
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
        return Promise.reject(new Error('Guild has no terminal store'));
      }
    }
  }, {
    key: 'add',
    value: function add() {
      if (this[$terminal]) {
        var _$terminal3;

        return (_$terminal3 = this[$terminal]).add.apply(_$terminal3, arguments);
      } else {
        return Promise.reject(new Error('Guild has no terminal store'));
      }
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship() {
      if (this[$terminal]) {
        var _$terminal4;

        return (_$terminal4 = this[$terminal]).modifyRelationship.apply(_$terminal4, arguments);
      } else {
        return Promise.reject(new Error('Guild has no terminal store'));
      }
    }
  }, {
    key: 'remove',
    value: function remove() {
      if (this[$terminal]) {
        var _$terminal5;

        return (_$terminal5 = this[$terminal]).remove.apply(_$terminal5, arguments);
      } else {
        return Promise.reject(new Error('Guild has no terminal store'));
      }
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
  }]);

  return Guild;
}();