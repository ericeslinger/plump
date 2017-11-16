'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MemoryStore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _modifiableKeyValueStore = require('./modifiableKeyValueStore');

var _mergeOptions = require('merge-options');

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MemoryStore = exports.MemoryStore = function (_ModifiableKeyValueSt) {
    _inherits(MemoryStore, _ModifiableKeyValueSt);

    function MemoryStore() {
        var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, MemoryStore);

        var _this = _possibleConstructorReturn(this, (MemoryStore.__proto__ || Object.getPrototypeOf(MemoryStore)).call(this, opts));

        _this.store = {};
        return _this;
    }

    _createClass(MemoryStore, [{
        key: 'logStore',
        value: function logStore() {
            console.log(JSON.stringify(this.store, null, 2));
        }
    }, {
        key: '_keys',
        value: function _keys(type) {
            return Promise.resolve(Object.keys(this.store).filter(function (k) {
                return k.indexOf(type + ':') === 0;
            }));
        }
    }, {
        key: '_get',
        value: function _get(req) {
            var k = this.keyString(req.item);
            if (this.store[k]) {
                return Promise.resolve(this.store[k]);
            } else {
                return Promise.resolve(null);
            }
        }
    }, {
        key: '_upsert',
        value: function _upsert(vals) {
            var _this2 = this;

            return Promise.resolve().then(function () {
                var k = _this2.keyString(vals);
                if (_this2.store[k] === undefined) {
                    _this2.store[k] = (0, _mergeOptions2.default)({ relationships: {} }, vals);
                } else {
                    _this2.store[k] = (0, _mergeOptions2.default)(_this2.store[k], vals);
                }
                return vals;
            });
        }
    }, {
        key: '_updateArray',
        value: function _updateArray(ref, relName, item) {
            var _this3 = this;

            return Promise.resolve().then(function () {
                var k = _this3.keyString(ref);
                if (_this3.store[k] === undefined) {
                    _this3.store[k] = {
                        id: ref.id,
                        type: ref.type,
                        attributes: {},
                        relationships: _defineProperty({}, relName, [item])
                    };
                } else if (_this3.store[k].relationships === undefined || _this3.store[k].relationships[relName] === undefined) {
                    if (_this3.store[k].relationships === undefined) {
                        _this3.store[k].relationships = {};
                    }
                    _this3.store[k].relationships[relName] = [item];
                } else {
                    var idx = _this3.store[k].relationships[relName].findIndex(function (v) {
                        return v.id === item.id;
                    });
                    if (idx >= 0) {
                        _this3.store[k].relationships[relName][idx] = item;
                    } else {
                        _this3.store[k].relationships[relName].push(item);
                    }
                }
                return ref;
            });
        }
    }, {
        key: '_removeFromArray',
        value: function _removeFromArray(ref, relName, item) {
            var _this4 = this;

            return Promise.resolve().then(function () {
                var k = _this4.keyString(ref);
                if (_this4.store[k] !== undefined && _this4.store[k].relationships !== undefined && _this4.store[k].relationships[relName] !== undefined) {
                    var idx = _this4.store[k].relationships[relName].findIndex(function (v) {
                        return v.id === item.id;
                    });
                    if (idx >= 0) {
                        _this4.store[k].relationships[relName].splice(idx, 1);
                    }
                }
                return ref;
            });
        }
    }, {
        key: '_del',
        value: function _del(ref, fields) {
            var _this5 = this;

            return Promise.resolve().then(function () {
                var k = _this5.keyString(ref);
                if (_this5.store[k]) {
                    fields.forEach(function (field) {
                        if (field === 'attributes') {
                            delete _this5.store[k].attributes;
                        } else if (field === 'relationships') {
                            delete _this5.store[k].relationships;
                        } else if (field.indexOf('relationships.') === 0 && _this5.store[k].relationships) {
                            delete _this5.store[k].relationships[field.split('.')[1]];
                        }
                    });
                }
                return _this5.store[k];
            });
        }
    }]);

    return MemoryStore;
}(_modifiableKeyValueStore.ModifiableKeyValueStore);