"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Promise = require("bluebird");
var keyValueStore_1 = require("./keyValueStore");
var $store = Symbol('$store');
var MemoryStorage = (function (_super) {
    __extends(MemoryStorage, _super);
    function MemoryStorage() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var _this = _super.apply(this, args) || this;
        _this[$store] = {};
        return _this;
    }
    MemoryStorage.prototype.logStore = function () {
        console.log(JSON.stringify(this[$store], null, 2));
    };
    MemoryStorage.prototype._keys = function (typeName) {
        return Promise.resolve(Object.keys(this[$store]).filter(function (k) { return k.indexOf(typeName + ":store:") === 0; }));
    };
    MemoryStorage.prototype._get = function (k) {
        return Promise.resolve(this[$store][k] || null);
    };
    MemoryStorage.prototype._set = function (k, v) {
        var _this = this;
        return Promise.resolve()
            .then(function () {
            _this[$store][k] = v;
        });
    };
    MemoryStorage.prototype._del = function (k) {
        var _this = this;
        return Promise.resolve()
            .then(function () {
            var retVal = _this[$store][k];
            delete _this[$store][k];
            return retVal;
        });
    };
    return MemoryStorage;
}(keyValueStore_1.KeyValueStore));
exports.MemoryStorage = MemoryStorage;
