"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Promise = require("bluebird");
var keyValueStore_1 = require("./keyValueStore");
var MemoryStore = (function (_super) {
    __extends(MemoryStore, _super);
    function MemoryStore(opts) {
        var _this = _super.call(this, opts) || this;
        _this.store = {};
        return _this;
    }
    MemoryStore.prototype.logStore = function () {
        console.log(JSON.stringify(this.store, null, 2));
    };
    MemoryStore.prototype._keys = function (typeName) {
        return Promise.resolve(Object.keys(this.store).filter(function (k) { return k.indexOf(typeName + ":attributes:") === 0; }));
    };
    MemoryStore.prototype._get = function (k) {
        return Promise.resolve(this.store[k] || null);
    };
    MemoryStore.prototype._set = function (k, v) {
        var _this = this;
        return Promise.resolve()
            .then(function () {
            _this.store[k] = v;
        });
    };
    MemoryStore.prototype._del = function (k) {
        var _this = this;
        return Promise.resolve()
            .then(function () {
            var retVal = _this.store[k];
            delete _this.store[k];
            return retVal;
        });
    };
    return MemoryStore;
}(keyValueStore_1.KeyValueStore));
exports.MemoryStore = MemoryStore;
