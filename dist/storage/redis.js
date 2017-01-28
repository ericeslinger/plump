"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Promise = require("bluebird");
var Redis = require("redis");
var keyValueStore_1 = require("./keyValueStore");
var RedisService = Promise.promisifyAll(Redis);
var $redis = Symbol('$redis');
var RedisStorage = (function (_super) {
    __extends(RedisStorage, _super);
    function RedisStorage(opts) {
        if (opts === void 0) { opts = {}; }
        var _this = _super.call(this, opts) || this;
        var options = Object.assign({}, {
            port: 6379,
            host: 'localhost',
            db: 0,
            retry_strategy: function (o) {
                if (o.error.code === 'ECONNREFUSED') {
                    return new Error('The server refused the connection');
                }
                if (o.total_retry_time > 1000 * 60 * 60) {
                    return new Error('Retry time exhausted');
                }
                if (o.times_connected > 10) {
                    return undefined;
                }
                return Math.max(o.attempt * 100, 3000);
            },
        }, opts);
        _this[$redis] = RedisService.createClient(options);
        _this.isCache = true;
        return _this;
    }
    RedisStorage.prototype.teardown = function () {
        return this[$redis].quitAsync();
    };
    RedisStorage.prototype._keys = function (typeName) {
        return this[$redis].keysAsync(typeName + ":store:*");
    };
    RedisStorage.prototype._get = function (k) {
        return this[$redis].getAsync(k);
    };
    RedisStorage.prototype._set = function (k, v) {
        return this[$redis].setAsync(k, v);
    };
    RedisStorage.prototype._del = function (k) {
        return this[$redis].delAsync(k);
    };
    return RedisStorage;
}(keyValueStore_1.KeyValueStore));
exports.RedisStorage = RedisStorage;
