"use strict";
var Bluebird = require("bluebird");
var Rx_1 = require("rxjs/Rx");
var model_1 = require("../model");
var $emitter = Symbol('$emitter');
var Storage = (function () {
    function Storage(opts) {
        if (opts === void 0) { opts = {}; }
        this.terminal = opts.terminal || false;
        this[$emitter] = new Rx_1.Subject();
    }
    Storage.prototype.hot = function (type, id) {
        return false;
    };
    Storage.prototype.write = function (type, value) {
        return Bluebird.reject(new Error('Write not implemented'));
    };
    Storage.prototype.read = function (type, id, key) {
        var _this = this;
        var keys = [model_1.$self];
        if (Array.isArray(key)) {
            keys = key;
        }
        else if (key) {
            keys = [key];
        }
        if (keys.indexOf(model_1.$all) >= 0) {
            keys = Object.keys(type.$fields)
                .filter(function (k) { return type.$fields[k].type === 'hasMany'; });
            keys.push(model_1.$self);
        }
        return Bluebird.resolve()
            .then(function () {
            return Bluebird.all(keys.map(function (k) {
                if ((k !== model_1.$self) && (type.$fields[k].type === 'hasMany')) {
                    return _this.readMany(type, id, k);
                }
                else {
                    return _this.readOne(type, id);
                }
            })).then(function (valArray) {
                var selfIdx = keys.indexOf(model_1.$self);
                var retVal = {};
                if (selfIdx >= 0) {
                    if (valArray[selfIdx] === null) {
                        return null;
                    }
                    else {
                        Object.assign(retVal, valArray[selfIdx]);
                    }
                }
                valArray.forEach(function (val, idx) {
                    if (idx !== selfIdx) {
                        Object.assign(retVal, val);
                    }
                });
                return retVal;
            });
        }).then(function (result) {
            if (result) {
                return _this.notifyUpdate(type, id, result, keys)
                    .then(function () { return result; });
            }
            else {
                return result;
            }
        });
    };
    Storage.prototype.wipe = function (type, id, field) {
        return Bluebird.reject(new Error('Wipe not implemented'));
    };
    Storage.prototype.readOne = function (type, id) {
        return Bluebird.reject(new Error('ReadOne not implemented'));
    };
    Storage.prototype.readMany = function (type, id, key) {
        return Bluebird.reject(new Error('ReadMany not implemented'));
    };
    Storage.prototype.delete = function (type, id) {
        return Bluebird.reject(new Error('Delete not implemented'));
    };
    Storage.prototype.add = function (type, id, relationship, childId, valence) {
        if (valence === void 0) { valence = {}; }
        return Bluebird.reject(new Error('Add not implemented'));
    };
    Storage.prototype.remove = function (type, id, relationship, childId) {
        return Bluebird.reject(new Error('remove not implemented'));
    };
    Storage.prototype.modifyRelationship = function (type, id, relationship, childId, valence) {
        if (valence === void 0) { valence = {}; }
        return Bluebird.reject(new Error('modifyRelationship not implemented'));
    };
    Storage.prototype.query = function (q) {
        return Bluebird.reject(new Error('Query not implemented'));
    };
    Storage.prototype.onUpdate = function (observer) {
        return this[$emitter].subscribe(observer);
    };
    Storage.prototype.notifyUpdate = function (type, id, value, opts) {
        var _this = this;
        if (opts === void 0) { opts = [model_1.$self]; }
        var keys = opts;
        if (!Array.isArray(keys)) {
            keys = [keys];
        }
        return Bluebird.all(keys.map(function (field) {
            return Bluebird.resolve()
                .then(function () {
                if (_this.terminal) {
                    if (field !== model_1.$self) {
                        if (value !== null) {
                            return _this[$emitter].next({
                                type: type, id: id, field: field, value: value[field],
                            });
                        }
                        else {
                            return _this.readMany(type, id, field)
                                .then(function (list) {
                                return _this[$emitter].next({
                                    type: type, id: id, field: field, value: list[field],
                                });
                            });
                        }
                    }
                    else {
                        return _this[$emitter].next({
                            type: type, id: id, value: value,
                        });
                    }
                }
                else {
                    return null;
                }
            });
        }));
    };
    Storage.prototype.$$testIndex = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (args.length === 1) {
            if (args[0].$id === undefined) {
                throw new Error('Illegal operation on an unsaved new model');
            }
        }
        else if (args[1][args[0].$id] === undefined) {
            throw new Error('Illegal operation on an unsaved new model');
        }
    };
    return Storage;
}());
exports.Storage = Storage;
Storage.massReplace = function massReplace(block, context) {
    return block.map(function (v) {
        if (Array.isArray(v)) {
            return massReplace(v, context);
        }
        else if ((typeof v === 'string') && (v.match(/^\{(.*)\}$/))) {
            return context[v.match(/^\{(.*)\}$/)[1]];
        }
        else {
            return v;
        }
    });
};
