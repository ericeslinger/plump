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
var Bluebird = require("bluebird");
var merge_options_1 = require("merge-options");
var storage_1 = require("./storage");
function saneNumber(i) {
    return ((typeof i === 'number') && (!isNaN(i)) && (i !== Infinity) && (i !== -Infinity));
}
var KeyValueStore = (function (_super) {
    __extends(KeyValueStore, _super);
    function KeyValueStore() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    KeyValueStore.prototype.$$maxKey = function (t) {
        return this._keys(t)
            .then(function (keyArray) {
            if (keyArray.length === 0) {
                return 0;
            }
            else {
                return keyArray.map(function (k) { return k.split(':')[2]; })
                    .map(function (k) { return parseInt(k, 10); })
                    .filter(function (i) { return saneNumber(i); })
                    .reduce(function (max, current) { return (current > max) ? current : max; }, 0);
            }
        });
    };
    KeyValueStore.prototype.writeAttributes = function (inputValue) {
        var _this = this;
        var value = this.validateInput(inputValue);
        delete value.relationships;
        return Bluebird.resolve()
            .then(function () {
            if (!_this.terminal) {
                throw new Error('Cannot create new content in a non-terminal store');
            }
        })
            .then(function () {
            if ((value.id === undefined) || (value.id === null)) {
                return _this.$$maxKey(value.type)
                    .then(function (n) {
                    var id = n + 1;
                    return merge_options_1.default({}, value, { id: id, relationships: {} });
                });
            }
            else {
                return _this._get(_this.keyString(value)).then(function (current) { return merge_options_1.default({}, JSON.parse(current), value); });
            }
        })
            .then(function (toSave) {
            return _this._set(_this.keyString(toSave), JSON.stringify(toSave))
                .then(function () {
                _this.fireWriteUpdate(Object.assign({}, toSave, { invalidate: ['attributes'] }));
                return toSave;
            });
        });
    };
    KeyValueStore.prototype.readAttributes = function (value) {
        return this._get(this.keyString(value))
            .then(function (d) {
            var rV = JSON.parse(d);
            if (rV && rV.attributes && Object.keys(rV.attributes).length > 0) {
                return rV;
            }
            else {
                return null;
            }
        });
    };
    KeyValueStore.prototype.cache = function (value) {
        var _this = this;
        if ((value.id === undefined) || (value.id === null)) {
            return Bluebird.reject('Cannot cache data without an id - write it to a terminal first');
        }
        else {
            return this._get(this.keyString(value))
                .then(function (current) {
                var newVal = merge_options_1.default(JSON.parse(current) || {}, value);
                return _this._set(_this.keyString(value), JSON.stringify(newVal));
            });
        }
    };
    KeyValueStore.prototype.cacheAttributes = function (value) {
        var _this = this;
        if ((value.id === undefined) || (value.id === null)) {
            return Bluebird.reject('Cannot cache data without an id - write it to a terminal first');
        }
        else {
            return this._get(this.keyString(value))
                .then(function (current) {
                return _this._set(_this.keyString(value), JSON.stringify({
                    type: value.type,
                    id: value.id,
                    atttributes: value.attributes,
                    relationships: current.relationships || {},
                }));
            });
        }
    };
    KeyValueStore.prototype.cacheRelationship = function (value) {
        var _this = this;
        if ((value.id === undefined) || (value.id === null)) {
            return Bluebird.reject('Cannot cache data without an id - write it to a terminal first');
        }
        else {
            return this._get(this.keyString(value))
                .then(function (current) {
                return _this._set(_this.keyString(value), JSON.stringify({
                    type: value.type,
                    id: value.id,
                    atttributes: current.attributes || {},
                    relationships: value.relationships,
                }));
            });
        }
    };
    KeyValueStore.prototype.readRelationship = function (value, relName) {
        var _this = this;
        return this._get(this.keyString(value))
            .then(function (v) {
            var retVal = JSON.parse(v);
            if (!v) {
                if (_this.terminal) {
                    return { type: value.type, id: value.id, relationships: (_a = {}, _a[relName] = [], _a) };
                }
                else {
                    return null;
                }
            }
            else if (!v.relationships && _this.terminal) {
                retVal.relationships = (_b = {}, _b[relName] = [], _b);
            }
            else if (!retVal.relationships[relName] && _this.terminal) {
                retVal.relationships[relName] = [];
            }
            return retVal;
            var _a, _b;
        });
    };
    KeyValueStore.prototype.delete = function (value) {
        var _this = this;
        return this._del(this.keyString(value))
            .then(function () {
            if (_this.terminal) {
                _this.fireWriteUpdate({ id: value.id, type: value.type, invalidate: ['attributes', 'relationships'] });
            }
        });
    };
    KeyValueStore.prototype.wipe = function (value, field) {
        var _this = this;
        var ks = this.keyString(value);
        return this._get(ks)
            .then(function (val) {
            var newVal = JSON.parse(val);
            if (newVal === null) {
                return null;
            }
            if (field === 'attributes') {
                delete newVal.attributes;
            }
            else if (field === 'relationships') {
                delete newVal.relationships;
            }
            else if (field.indexOf('relationships.') === 0) {
                delete newVal.relationships[field.split('.')[1]];
                if (Object.keys(newVal.relationships).length === 0) {
                    delete newVal.relationships;
                }
            }
            else {
                throw new Error("Cannot delete field " + field + " - unknown format");
            }
            return _this._set(ks, JSON.stringify(newVal));
        });
    };
    KeyValueStore.prototype.writeRelationshipItem = function (value, relName, child) {
        var _this = this;
        if (child.id === undefined || value.type === undefined || value.id === undefined) {
            throw new Error('Invalid arguments to writeRelationshipItem');
        }
        var type = this.getType(value.type);
        var relSchema = type.$schema.relationships[relName].type;
        var otherRelType = relSchema.$sides[relName].otherType;
        var otherRelName = relSchema.$sides[relName].otherName;
        var thisKeyString = this.keyString(value);
        var otherKeyString = this.keyString({ type: otherRelType, id: child.id });
        return Bluebird.all([
            this._get(thisKeyString),
            this._get(otherKeyString),
        ])
            .then(function (_a) {
            var thisItemString = _a[0], otherItemString = _a[1];
            var thisItem = JSON.parse(thisItemString);
            if (!thisItem) {
                thisItem = {
                    id: child.id,
                    type: otherRelType,
                    attributes: {},
                    relationships: {},
                };
            }
            var otherItem = JSON.parse(otherItemString);
            if (!otherItem) {
                otherItem = {
                    id: child.id,
                    type: otherRelType,
                    attributes: {},
                    relationships: {},
                };
            }
            var newChild = { id: child.id };
            var newParent = { id: value.id };
            if (!thisItem.relationships[relName]) {
                thisItem.relationships[relName] = [];
            }
            if (!otherItem.relationships[otherRelName]) {
                otherItem.relationships[otherRelName] = [];
            }
            if (relSchema.$extras && child.meta) {
                newParent.meta = {};
                newChild.meta = {};
                for (var extra in child.meta) {
                    if (extra in relSchema.$extras) {
                        newChild.meta[extra] = child.meta[extra];
                        newParent.meta[extra] = child.meta[extra];
                    }
                }
            }
            var thisIdx = thisItem.relationships[relName].findIndex(function (item) { return item.id === child.id; });
            var otherIdx = otherItem.relationships[otherRelName].findIndex(function (item) { return item.id === value.id; });
            if (thisIdx < 0) {
                thisItem.relationships[relName].push(newChild);
            }
            else {
                thisItem.relationships[relName][thisIdx] = newChild;
            }
            if (otherIdx < 0) {
                otherItem.relationships[otherRelName].push(newParent);
            }
            else {
                otherItem.relationships[otherRelName][otherIdx] = newParent;
            }
            return Bluebird.all([
                _this._set(_this.keyString(thisItem), JSON.stringify(thisItem)),
                _this._set(_this.keyString(otherItem), JSON.stringify(otherItem)),
            ]).then(function () {
                _this.fireWriteUpdate(Object.assign(thisItem, { invalidate: ["relationships." + relName] }));
                _this.fireWriteUpdate(Object.assign(otherItem, { invalidate: ["relationships." + otherRelName] }));
            })
                .then(function () { return thisItem; });
        });
    };
    KeyValueStore.prototype.deleteRelationshipItem = function (value, relName, child) {
        var _this = this;
        if (child.id === undefined) {
            throw new Error('incorrect call signature on deleteRelationshipItem');
        }
        var type = this.getType(value.type);
        var relSchema = type.$schema.relationships[relName].type;
        var otherRelType = relSchema.$sides[relName].otherType;
        var otherRelName = relSchema.$sides[relName].otherSide;
        var thisKeyString = this.keyString(value);
        var otherKeyString = this.keyString({ type: otherRelType, id: child.id });
        return Bluebird.all([
            this._get(thisKeyString),
            this._get(otherKeyString),
        ])
            .then(function (_a) {
            var thisItemString = _a[0], otherItemString = _a[1];
            var thisItem = JSON.parse(thisItemString);
            var otherItem = JSON.parse(otherItemString);
            if (!thisItem.relationships[relName]) {
                thisItem.relationships[relName] = [];
            }
            if (!otherItem.relationships[otherRelName]) {
                otherItem.relationships[otherRelName] = [];
            }
            var thisIdx = thisItem.relationships[relName].findIndex(function (item) { return item.id === child.id; });
            var otherIdx = otherItem.relationships[otherRelName].findIndex(function (item) { return item.id === value.id; });
            if (thisIdx >= 0) {
                thisItem.relationships[relName].splice(thisIdx, 1);
            }
            if (otherIdx >= 0) {
                otherItem.relationships[otherRelName].splice(otherIdx, 1);
            }
            return Bluebird.all([
                _this._set(_this.keyString(thisItem), JSON.stringify(thisItem)),
                _this._set(_this.keyString(otherItem), JSON.stringify(otherItem)),
            ]).then(function () {
                _this.fireWriteUpdate(Object.assign(thisItem, { invalidate: ["relationships." + relName] }));
                _this.fireWriteUpdate(Object.assign(otherItem, { invalidate: ["relationships." + otherRelName] }));
            })
                .then(function () { return thisItem; });
        });
    };
    KeyValueStore.prototype.keyString = function (value) {
        return value.type + ":" + value.id;
    };
    return KeyValueStore;
}(storage_1.Storage));
exports.KeyValueStore = KeyValueStore;
