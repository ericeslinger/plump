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
var model_1 = require("./model");
var Rx_1 = require("rxjs/Rx");
var bluebird_1 = require("bluebird");
var $types = Symbol('$types');
var $storage = Symbol('$storage');
var $terminal = Symbol('$terminal');
var $teardown = Symbol('$teardown');
var $subscriptions = Symbol('$subscriptions');
var $storeSubscriptions = Symbol('$storeSubscriptions');
var Plump = (function () {
    function Plump(opts) {
        if (opts === void 0) { opts = {}; }
        var _this = this;
        var options = Object.assign({}, {
            storage: [],
            types: [],
        }, opts);
        this[$teardown] = new Rx_1.Subject();
        this.destroy$ = this[$teardown].asObservable();
        this[$subscriptions] = {};
        this[$storeSubscriptions] = [];
        this[$storage] = [];
        this.stores = [];
        this[$types] = {};
        options.storage.forEach(function (s) { return _this.addStore(s); });
        options.types.forEach(function (t) { return _this.addType(t); });
    }
    Plump.prototype.addTypesFromSchema = function (schemata, ExtendingModel) {
        if (ExtendingModel === void 0) { ExtendingModel = model_1.Model; }
        for (var k in schemata) {
            var DynamicModel = (function (_super) {
                __extends(DynamicModel, _super);
                function DynamicModel() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                return DynamicModel;
            }(ExtendingModel));
            DynamicModel.fromJSON(schemata[k]);
            this.addType(DynamicModel);
        }
    };
    Plump.prototype.addType = function (T) {
        if (this[$types][T.type] === undefined) {
            this[$types][T.type] = T;
            this[$storage].forEach(function (s) { return s.addType(T); });
            if (this[$terminal]) {
                this[$terminal].addType(T);
            }
        }
        else {
            throw new Error("Duplicate Type registered: " + T.type);
        }
    };
    Plump.prototype.type = function (T) {
        return this[$types][T];
    };
    Plump.prototype.types = function () {
        return Object.keys(this[$types]);
    };
    Plump.prototype.addStore = function (store) {
        var _this = this;
        if (store.terminal) {
            if (this[$terminal] !== undefined) {
                throw new Error('cannot have more than one terminal store');
            }
            else {
                this[$terminal] = store;
                this[$storage].forEach(function (cacheStore) {
                    cacheStore.wire(store, _this.destroy$);
                });
            }
        }
        else {
            this[$storage].push(store);
            if (this[$terminal] !== undefined) {
                store.wire(this[$terminal], this.destroy$);
            }
        }
        this.stores.push(store);
        this.types().forEach(function (t) { return store.addType(_this.type(t)); });
    };
    Plump.prototype.find = function (t, id) {
        var Type = typeof t === 'string' ? this[$types][t] : t;
        return new Type((_a = {}, _a[Type.$id] = id, _a), this);
        var _a;
    };
    Plump.prototype.forge = function (t, val) {
        var Type = typeof t === 'string' ? this[$types][t] : t;
        return new Type(val, this);
    };
    Plump.prototype.teardown = function () {
        this[$teardown].next(0);
    };
    Plump.prototype.get = function (value, opts) {
        var _this = this;
        if (opts === void 0) { opts = ['attributes']; }
        var keys = opts && !Array.isArray(opts) ? [opts] : opts;
        return this[$storage].reduce(function (thenable, storage) {
            return thenable.then(function (v) {
                if (v !== null) {
                    return v;
                }
                else if (storage.hot(value)) {
                    return storage.read(value, keys);
                }
                else {
                    return null;
                }
            });
        }, Promise.resolve(null))
            .then(function (v) {
            if (((v === null) || (v.attributes === null)) && (_this[$terminal])) {
                return _this[$terminal].read(value, keys);
            }
            else {
                return v;
            }
        });
    };
    Plump.prototype.bulkGet = function (type, id) {
        return this[$terminal].bulkRead(type, id);
    };
    Plump.prototype.save = function (value) {
        var _this = this;
        if (this[$terminal]) {
            return bluebird_1.default.resolve()
                .then(function () {
                if (Object.keys(value.attributes).length > 0) {
                    return _this[$terminal].writeAttributes(value);
                }
                else {
                    return null;
                }
            })
                .then(function (updated) {
                if (value.relationships && Object.keys(value.relationships).length > 0) {
                    return bluebird_1.default.all(Object.keys(value.relationships).map(function (relName) {
                        return bluebird_1.default.all(value.relationships[relName].map(function (delta) {
                            if (delta.op === 'add') {
                                return _this[$terminal].writeRelationshipItem(value, relName, delta);
                            }
                            else if (delta.op === 'remove') {
                                return _this[$terminal].deleteRelationshipItem(value, relName, delta);
                            }
                            else if (delta.op === 'modify') {
                                return _this[$terminal].writeRelationshipItem(value, relName, delta);
                            }
                            else {
                                throw new Error("Unknown relationship delta " + JSON.stringify(delta));
                            }
                        }));
                    })).then(function () { return updated; });
                }
                else {
                    return updated;
                }
            });
        }
        else {
            return Promise.reject(new Error('Plump has no terminal store'));
        }
    };
    Plump.prototype.delete = function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this[$terminal]) {
            return (_a = this[$terminal]).delete.apply(_a, args).then(function () {
                return bluebird_1.default.all(_this[$storage].map(function (store) {
                    return store.delete.apply(store, args);
                }));
            });
        }
        else {
            return Promise.reject(new Error('Plump has no terminal store'));
        }
        var _a;
    };
    Plump.prototype.add = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this[$terminal]) {
            return (_a = this[$terminal]).add.apply(_a, args);
        }
        else {
            return Promise.reject(new Error('Plump has no terminal store'));
        }
        var _a;
    };
    Plump.prototype.restRequest = function (opts) {
        if (this[$terminal] && this[$terminal].rest) {
            return this[$terminal].rest(opts);
        }
        else {
            return Promise.reject(new Error('No Rest terminal store'));
        }
    };
    Plump.prototype.modifyRelationship = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this[$terminal]) {
            return (_a = this[$terminal]).modifyRelationship.apply(_a, args);
        }
        else {
            return Promise.reject(new Error('Plump has no terminal store'));
        }
        var _a;
    };
    Plump.prototype.remove = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this[$terminal]) {
            return (_a = this[$terminal]).remove.apply(_a, args);
        }
        else {
            return Promise.reject(new Error('Plump has no terminal store'));
        }
        var _a;
    };
    Plump.prototype.invalidate = function (type, id, field) {
        var fields = Array.isArray(field) ? field : [field];
        this[$terminal].fireWriteUpdate({ type: type, id: id, invalidate: fields });
    };
    return Plump;
}());
exports.Plump = Plump;
