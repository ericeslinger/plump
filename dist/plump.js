"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var model_1 = require("./model");
var Rx_1 = require("rxjs/Rx");
var bluebird_1 = require("bluebird");
var $types = Symbol('$types');
var $storage = Symbol('$storage');
var $terminal = Symbol('$terminal');
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
        this[$subscriptions] = {};
        this[$storeSubscriptions] = [];
        this[$storage] = [];
        this[$types] = {};
        options.storage.forEach(function (s) { return _this.addStore(s); });
        options.types.forEach(function (t) { return _this.addType(t); });
    }
    Plump.prototype.addTypesFromSchema = function (schema, ExtendingModel) {
        var _this = this;
        if (ExtendingModel === void 0) { ExtendingModel = model_1.Model; }
        Object.keys(schema).forEach(function (k) {
            var DynamicModel = (function (_super) {
                __extends(DynamicModel, _super);
                function DynamicModel() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                return DynamicModel;
            }(ExtendingModel));
            DynamicModel.fromJSON(schema[k]);
            _this.addType(DynamicModel);
        });
    };
    Plump.prototype.addType = function (T) {
        if (this[$types][T.$name] === undefined) {
            this[$types][T.$name] = T;
        }
        else {
            throw new Error("Duplicate Type registered: " + T.$name);
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
            if (this[$terminal] === undefined) {
                this[$terminal] = store;
            }
            else {
                throw new Error('cannot have more than one terminal store');
            }
        }
        else {
            this[$storage].push(store);
        }
        if (store.terminal) {
            this[$storeSubscriptions].push(store.onUpdate(function (_a) {
                var type = _a.type, id = _a.id, value = _a.value, field = _a.field;
                _this[$storage].forEach(function (storage) {
                    if (field) {
                        storage.writeHasMany(type, id, field, value);
                    }
                    else {
                        storage.write(type, value);
                    }
                });
                if (_this[$subscriptions][type.$name] && _this[$subscriptions][type.$name][id]) {
                    _this[$subscriptions][type.$name][id].next({ field: field, value: value });
                }
            }));
        }
    };
    Plump.prototype.find = function (t, id) {
        var Type = t;
        if (typeof t === 'string') {
            Type = this[$types][t];
        }
        var retVal = new Type((_a = {}, _a[Type.$id] = id, _a), this);
        return retVal;
        var _a;
    };
    Plump.prototype.forge = function (t, val) {
        var Type = t;
        if (typeof t === 'string') {
            Type = this[$types][t];
        }
        return new Type(val, this);
    };
    Plump.prototype.subscribe = function (typeName, id, handler) {
        if (this[$subscriptions][typeName] === undefined) {
            this[$subscriptions][typeName] = {};
        }
        if (this[$subscriptions][typeName][id] === undefined) {
            this[$subscriptions][typeName][id] = new Rx_1.Subject();
        }
        return this[$subscriptions][typeName][id].subscribe(handler);
    };
    Plump.prototype.teardown = function () {
        this[$storeSubscriptions].forEach(function (s) { return s.unsubscribe(); });
        this[$subscriptions] = undefined;
        this[$storeSubscriptions] = undefined;
    };
    Plump.prototype.get = function (type, id, keyOpts) {
        var _this = this;
        var keys = keyOpts;
        if (!keys) {
            keys = [model_1.$self];
        }
        if (!Array.isArray(keys)) {
            keys = [keys];
        }
        return this[$storage].reduce(function (thenable, storage) {
            return thenable.then(function (v) {
                if (v !== null) {
                    return v;
                }
                else if (storage.hot(type, id)) {
                    return storage.read(type, id, keys);
                }
                else {
                    return null;
                }
            });
        }, Promise.resolve(null))
            .then(function (v) {
            if (((v === null) || (v[model_1.$self] === null)) && (_this[$terminal])) {
                return _this[$terminal].read(type, id, keys);
            }
            else {
                return v;
            }
        }).then(function (v) {
            return v;
        });
    };
    Plump.prototype.streamGet = function (type, id, keyOpts) {
        var _this = this;
        var keys = keyOpts;
        if (!keys) {
            keys = [model_1.$self];
        }
        if (!Array.isArray(keys)) {
            keys = [keys];
        }
        return Rx_1.Observable.create(function (observer) {
            return bluebird_1.default.all((_this[$storage].map(function (store) {
                return store.read(type, id, keys)
                    .then(function (v) {
                    observer.next(v);
                    if (store.hot(type, id)) {
                        return v;
                    }
                    else {
                        return null;
                    }
                });
            })))
                .then(function (valArray) {
                var possiVal = valArray.filter(function (v) { return v !== null; });
                if ((possiVal.length === 0) && (_this[$terminal])) {
                    return _this[$terminal].read(type, id, keys)
                        .then(function (val) {
                        observer.next(val);
                        return val;
                    });
                }
                else {
                    return possiVal[0];
                }
            }).then(function (v) {
                observer.complete();
                return v;
            });
        });
    };
    Plump.prototype.save = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this[$terminal]) {
            return (_a = this[$terminal]).write.apply(_a, args);
        }
        else {
            return Promise.reject(new Error('Plump has no terminal store'));
        }
        var _a;
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
        var _this = this;
        var hots = this[$storage].filter(function (store) { return store.hot(type, id); });
        if (this[$terminal].hot(type, id)) {
            hots.push(this[$terminal]);
        }
        return bluebird_1.default.all(hots.map(function (store) {
            return store.wipe(type, id, field);
        })).then(function () {
            if (_this[$subscriptions][type.$name] && _this[$subscriptions][type.$name][id]) {
                return _this[$terminal].read(type, id, field);
            }
            else {
                return null;
            }
        });
    };
    return Plump;
}());
exports.Plump = Plump;
