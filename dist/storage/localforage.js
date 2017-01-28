"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var localforage_1 = require("localforage");
var keyValueStore_1 = require("./keyValueStore");
var LocalForageStorage = (function (_super) {
    __extends(LocalForageStorage, _super);
    function LocalForageStorage(opts) {
        if (opts === void 0) { opts = {}; }
        var _this = _super.call(this) || this;
        _this.isCache = true;
        localforage_1.default.config({
            name: opts.name || 'Trellis Storage',
            storeName: opts.storeName || 'localCache',
        });
        return _this;
    }
    LocalForageStorage.prototype._keys = function (typeName) {
        return localforage_1.default.keys()
            .then(function (keyArray) { return keyArray.filter(function (k) { return k.indexOf(typeName + ":store:") === 0; }); });
    };
    LocalForageStorage.prototype._get = function (k) {
        return localforage_1.default.getItem(k);
    };
    LocalForageStorage.prototype._set = function (k, v) {
        return localforage_1.default.setItem(k, v);
    };
    LocalForageStorage.prototype._del = function (k) {
        return localforage_1.default.removeItem(k);
    };
    return LocalForageStorage;
}(keyValueStore_1.KeyValueStore));
exports.LocalForageStorage = LocalForageStorage;
