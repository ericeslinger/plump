'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.HotCache = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _memory = require('./memory');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var HotCache = exports.HotCache = function (_MemoryStore) {
    _inherits(HotCache, _MemoryStore);

    function HotCache() {
        _classCallCheck(this, HotCache);

        return _possibleConstructorReturn(this, (HotCache.__proto__ || Object.getPrototypeOf(HotCache)).call(this, { terminal: false }));
    }

    _createClass(HotCache, [{
        key: 'hot',
        value: function hot(item) {
            return !!this.store[this.keyString(item)];
        }
    }]);

    return HotCache;
}(_memory.MemoryStore);