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
var mergeOptions = require("merge-options");
var storage_1 = require("./storage");
function saneNumber(i) {
    return (typeof i === 'number' && !isNaN(i) && i !== Infinity && i !== -Infinity);
}
var KeyValueStore = (function (_super) {
    __extends(KeyValueStore, _super);
    function KeyValueStore() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.maxKeys = {};
        return _this;
    }
    KeyValueStore.prototype.allocateId = function (type) {
        this.maxKeys[type] = this.maxKeys[type] + 1;
        return Promise.resolve(this.maxKeys[type]);
    };
    KeyValueStore.prototype.writeAttributes = function (inputValue) {
        var _this = this;
        var value = this.validateInput(inputValue);
        delete value.relationships;
        return Promise.resolve()
            .then(function () {
            var idAttribute = _this.getSchema(inputValue.type).idAttribute;
            if (value.id === undefined || value.id === null) {
                if (!_this.terminal) {
                    throw new Error('Cannot create new content in a non-terminal store');
                }
                return _this.allocateId(value.type).then(function (n) {
                    return mergeOptions({}, value, {
                        id: n,
                        relationships: {},
                        attributes: (_a = {}, _a[idAttribute] = n, _a),
                    });
                    var _a;
                });
            }
            else {
                var thisId = typeof value.id === 'string' ? parseInt(value.id, 10) : value.id;
                if (saneNumber(thisId) && thisId > _this.maxKeys[value.type]) {
                    _this.maxKeys[value.type] = thisId;
                }
                return _this._get(_this.keyString(value)).then(function (current) {
                    if (current) {
                        return mergeOptions({}, current, value);
                    }
                    else {
                        return mergeOptions({ relationships: {}, attributes: {} }, value);
                    }
                });
            }
        })
            .then(function (toSave) {
            return _this._set(_this.keyString(toSave), toSave).then(function () {
                _this.fireWriteUpdate(Object.assign({}, toSave, { invalidate: ['attributes'] }));
                return toSave;
            });
        });
    };
    KeyValueStore.prototype.readAttributes = function (value) {
        return this._get(this.keyString(value)).then(function (d) {
            if (d && d.attributes && Object.keys(d.attributes).length > 0) {
                return d;
            }
            else {
                return null;
            }
        });
    };
    KeyValueStore.prototype.cache = function (value) {
        var _this = this;
        if (value.id === undefined || value.id === null) {
            return Promise.reject('Cannot cache data without an id - write it to a terminal first');
        }
        else {
            return this._get(this.keyString(value)).then(function (current) {
                var newVal = mergeOptions(current || {}, value);
                return _this._set(_this.keyString(value), newVal);
            });
        }
    };
    KeyValueStore.prototype.cacheAttributes = function (value) {
        var _this = this;
        if (value.id === undefined || value.id === null) {
            return Promise.reject('Cannot cache data without an id - write it to a terminal first');
        }
        else {
            return this._get(this.keyString(value)).then(function (current) {
                return _this._set(_this.keyString(value), {
                    type: value.type,
                    id: value.id,
                    attributes: value.attributes,
                    relationships: current.relationships || {},
                });
            });
        }
    };
    KeyValueStore.prototype.cacheRelationship = function (value) {
        var _this = this;
        if (value.id === undefined || value.id === null) {
            return Promise.reject('Cannot cache data without an id - write it to a terminal first');
        }
        else {
            return this._get(this.keyString(value)).then(function (current) {
                return _this._set(_this.keyString(value), {
                    type: value.type,
                    id: value.id,
                    attributes: current.attributes || {},
                    relationships: value.relationships,
                });
            });
        }
    };
    KeyValueStore.prototype.readRelationship = function (value, relName) {
        var _this = this;
        return this._get(this.keyString(value)).then(function (v) {
            var retVal = Object.assign({}, v);
            if (!v) {
                if (_this.terminal) {
                    return {
                        type: value.type,
                        id: value.id,
                        relationships: (_a = {}, _a[relName] = [], _a),
                    };
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
        return this._del(this.keyString(value)).then(function () {
            if (_this.terminal) {
                _this.fireWriteUpdate({
                    id: value.id,
                    type: value.type,
                    invalidate: ['attributes', 'relationships'],
                });
            }
        });
    };
    KeyValueStore.prototype.wipe = function (value, field) {
        var _this = this;
        var ks = this.keyString(value);
        return this._get(ks).then(function (val) {
            if (val === null) {
                return null;
            }
            var newVal = Object.assign({}, val);
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
            return _this._set(ks, newVal);
        });
    };
    KeyValueStore.prototype.writeRelationshipItem = function (value, relName, child) {
        var _this = this;
        var schema = this.getSchema(value.type);
        var relSchema = schema.relationships[relName].type;
        var otherRelType = relSchema.sides[relName].otherType;
        var otherRelName = relSchema.sides[relName].otherName;
        var thisKeyString = this.keyString(value);
        var otherKeyString = this.keyString({ type: otherRelType, id: child.id });
        return Promise.all([
            this._get(thisKeyString),
            this._get(otherKeyString),
        ]).then(function (_a) {
            var thisItemResolved = _a[0], otherItemResolved = _a[1];
            var thisItem = thisItemResolved;
            if (!thisItem) {
                thisItem = {
                    id: child.id,
                    type: otherRelType,
                    attributes: {},
                    relationships: {},
                };
            }
            var otherItem = otherItemResolved;
            if (!otherItem) {
                otherItem = {
                    id: child.id,
                    type: otherRelType,
                    attributes: {},
                    relationships: {},
                };
            }
            var newChild = { id: child.id, type: otherRelType };
            var newParent = { id: value.id, type: value.type };
            if (!thisItem.relationships) {
                thisItem.relationships = {};
            }
            if (!thisItem.relationships[relName]) {
                thisItem.relationships[relName] = [];
            }
            if (!otherItem.relationships) {
                otherItem.relationships = {};
            }
            if (!otherItem.relationships[otherRelName]) {
                otherItem.relationships[otherRelName] = [];
            }
            if (relSchema.extras && child.meta) {
                newParent.meta = {};
                newChild.meta = {};
                for (var extra in child.meta) {
                    if (extra in relSchema.extras) {
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
            return Promise.all([
                _this._set(_this.keyString(thisItem), thisItem),
                _this._set(_this.keyString(otherItem), otherItem),
            ])
                .then(function () {
                _this.fireWriteUpdate(Object.assign(thisItem, {
                    invalidate: ["relationships." + relName],
                }));
                _this.fireWriteUpdate(Object.assign(otherItem, {
                    invalidate: ["relationships." + otherRelName],
                }));
            })
                .then(function () { return thisItem; });
        });
    };
    KeyValueStore.prototype.deleteRelationshipItem = function (value, relName, child) {
        var _this = this;
        var schema = this.getSchema(value.type);
        var relSchema = schema.relationships[relName].type;
        var otherRelType = relSchema.sides[relName].otherType;
        var otherRelName = relSchema.sides[relName].otherName;
        var thisKeyString = this.keyString(value);
        var otherKeyString = this.keyString({ type: otherRelType, id: child.id });
        return Promise.all([
            this._get(thisKeyString),
            this._get(otherKeyString),
        ]).then(function (_a) {
            var thisItem = _a[0], otherItem = _a[1];
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
            return Promise.all([
                _this._set(_this.keyString(thisItem), thisItem),
                _this._set(_this.keyString(otherItem), otherItem),
            ])
                .then(function () {
                _this.fireWriteUpdate(Object.assign(thisItem, {
                    invalidate: ["relationships." + relName],
                }));
                _this.fireWriteUpdate(Object.assign(otherItem, {
                    invalidate: ["relationships." + otherRelName],
                }));
            })
                .then(function () { return thisItem; });
        });
    };
    KeyValueStore.prototype.query = function (t, q) {
        return this._keys(t).then(function (keys) {
            return keys
                .map(function (k) {
                return {
                    type: t,
                    id: parseInt(k.split(':')[1], 10),
                };
            })
                .filter(function (v) { return !isNaN(v.id); });
        });
    };
    KeyValueStore.prototype.addSchema = function (t) {
        var _this = this;
        return _super.prototype.addSchema.call(this, t).then(function () {
            _this.maxKeys[t.type] = 0;
        });
    };
    KeyValueStore.prototype.keyString = function (value) {
        return value.type + ":" + value.id;
    };
    return KeyValueStore;
}(storage_1.Storage));
exports.KeyValueStore = KeyValueStore;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zdG9yYWdlL2tleVZhbHVlU3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsNENBQThDO0FBRTlDLHFDQUFvQztBQVlwQyxvQkFBb0IsQ0FBQztJQUNuQixNQUFNLENBQUMsQ0FDTCxPQUFPLENBQUMsS0FBSyxRQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQ3hFLENBQUM7QUFDSixDQUFDO0FBSUQ7SUFBNEMsaUNBQU87SUFBbkQ7UUFBQSxxRUEyVkM7UUF6VkMsYUFBTyxHQUErQixFQUFFLENBQUM7O0lBeVYzQyxDQUFDO0lBbFZDLGtDQUFVLEdBQVYsVUFBVyxJQUFZO1FBQ3JCLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRCx1Q0FBZSxHQUFmLFVBQWdCLFVBQStCO1FBQS9DLGlCQThDQztRQTdDQyxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzdDLE9BQU8sS0FBSyxDQUFDLGFBQWEsQ0FBQztRQUUzQixNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTthQUNyQixJQUFJLENBQUM7WUFDSixJQUFNLFdBQVcsR0FBRyxLQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUM7WUFDaEUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxTQUFTLElBQUksS0FBSyxDQUFDLEVBQUUsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNo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U0FBUyxZQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUM3QixLQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0IsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsaUNBQVMsR0FBVCxVQUFVLEtBQXFCO1FBQzdCLE1BQU0sQ0FBSSxLQUFLLENBQUMsSUFBSSxTQUFJLEtBQUssQ0FBQyxFQUFJLENBQUM7SUFDckMsQ0FBQztJQUNILG9CQUFDO0FBQUQsQ0EzVkEsQUEyVkMsQ0EzVjJDLGlCQUFPLEdBMlZsRDtBQTNWcUIsc0NBQWEiLCJmaWxlIjoic3RvcmFnZS9rZXlWYWx1ZVN0b3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgbWVyZ2VPcHRpb25zIGZyb20gJ21lcmdlLW9wdGlvbnMnO1xuXG5pbXBvcnQgeyBTdG9yYWdlIH0gZnJvbSAnLi9zdG9yYWdlJztcbmltcG9ydCB7XG4gIEluZGVmaW5pdGVNb2RlbERhdGEsXG4gIE1vZGVsRGF0YSxcbiAgTW9kZWxSZWZlcmVuY2UsXG4gIE1vZGVsU2NoZW1hLFxuICBSZWxhdGlvbnNoaXBJdGVtLFxuICBUZXJtaW5hbFN0b3JlLFxuICBDYWNoZVN0b3JlLFxuICBBbGxvY2F0aW5nU3RvcmUsXG59IGZyb20gJy4uL2RhdGFUeXBlcyc7XG5cbmZ1bmN0aW9uIHNhbmVOdW1iZXIoaSkge1xuICByZXR1cm4gKFxuICAgIHR5cGVvZiBpID09PSAnbnVtYmVyJyAmJiAhaXNOYU4oaSkgJiYgaSAhPT0gSW5maW5pdHkgJiYgaSAhPT0gLUluZmluaXR5XG4gICk7XG59XG5cbi8vIGRlY2xhcmUgZnVuY3Rpb24gcGFyc2VJbnQobjogc3RyaW5nIHwgbnVtYmVyLCByYWRpeDogbnVtYmVyKTogbnVtYmVyO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgS2V5VmFsdWVTdG9yZSBleHRlbmRzIFN0b3JhZ2VcbiAgaW1wbGVtZW50cyBUZXJtaW5hbFN0b3JlLCBDYWNoZVN0b3JlLCBBbGxvY2F0aW5nU3RvcmUge1xuICBtYXhLZXlzOiB7IFt0eXBlOiBzdHJpbmddOiBudW1iZXIgfSA9IHt9O1xuXG4gIGFic3RyYWN0IF9rZXlzKHR5cGU6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+O1xuICBhYnN0cmFjdCBfZ2V0KGs6IHN0cmluZyk6IFByb21pc2U8TW9kZWxEYXRhIHwgbnVsbD47XG4gIGFic3RyYWN0IF9zZXQoazogc3RyaW5nLCB2OiBNb2RlbERhdGEpOiBQcm9taXNlPE1vZGVsRGF0YT47XG4gIGFic3RyYWN0IF9kZWwoazogc3RyaW5nKTogUHJvbWlzZTxNb2RlbERhdGE+O1xuXG4gIGFsbG9jYXRlSWQodHlwZTogc3RyaW5nKSB7XG4gICAgdGhpcy5tYXhLZXlzW3R5cGVdID0gdGhpcy5tYXhLZXlzW3R5cGVdICsgMTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMubWF4S2V5c1t0eXBlXSk7XG4gIH1cblxuICB3cml0ZUF0dHJpYnV0ZXMoaW5wdXRWYWx1ZTogSW5kZWZpbml0ZU1vZGVsRGF0YSkge1xuICAgIGNvbnN0IHZhbHVlID0gdGhpcy52YWxpZGF0ZUlucHV0KGlucHV0VmFsdWUpO1xuICAgIGRlbGV0ZSB2YWx1ZS5yZWxhdGlvbnNoaXBzO1xuICAgIC8vIHRyaW0gb3V0IHJlbGF0aW9uc2hpcHMgZm9yIGEgZGlyZWN0IHdyaXRlLlxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCBpZEF0dHJpYnV0ZSA9IHRoaXMuZ2V0U2NoZW1hKGlucHV0VmFsdWUudHlwZSkuaWRBdHRyaWJ1dGU7XG4gICAgICAgIGlmICh2YWx1ZS5pZCA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlLmlkID09PSBudWxsKSB7XG4gICAgICAgICAgaWYgKCF0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICdDYW5ub3QgY3JlYXRlIG5ldyBjb250ZW50IGluIGEgbm9uLXRlcm1pbmFsIHN0b3JlJyxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0aGlzLmFsbG9jYXRlSWQodmFsdWUudHlwZSkudGhlbihuID0+IHtcbiAgICAgICAgICAgIHJldHVybiBtZXJnZU9wdGlvbnMoe30sIHZhbHVlLCB7XG4gICAgICAgICAgICAgIGlkOiBuLFxuICAgICAgICAgICAgICByZWxhdGlvbnNoaXBzOiB7fSxcbiAgICAgICAgICAgICAgYXR0cmlidXRlczogeyBbaWRBdHRyaWJ1dGVdOiBuIH0sXG4gICAgICAgICAgICB9KSBhcyBNb2RlbERhdGE7IC8vIGlmIG5ldy5cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBpZiBub3QgbmV3LCBnZXQgY3VycmVudCAoaW5jbHVkaW5nIHJlbGF0aW9uc2hpcHMpIGFuZCBtZXJnZVxuICAgICAgICAgIGNvbnN0IHRoaXNJZCA9XG4gICAgICAgICAgICB0eXBlb2YgdmFsdWUuaWQgPT09ICdzdHJpbmcnID8gcGFyc2VJbnQodmFsdWUuaWQsIDEwKSA6IHZhbHVlLmlkO1xuICAgICAgICAgIGlmIChzYW5lTnVtYmVyKHRoaXNJZCkgJiYgdGhpc0lkID4gdGhpcy5tYXhLZXlzW3ZhbHVlLnR5cGVdKSB7XG4gICAgICAgICAgICB0aGlzLm1heEtleXNbdmFsdWUudHlwZV0gPSB0aGlzSWQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0aGlzLl9nZXQoXG4gICAgICAgICAgICB0aGlzLmtleVN0cmluZyh2YWx1ZSBhcyBNb2RlbFJlZmVyZW5jZSksXG4gICAgICAgICAgKS50aGVuKGN1cnJlbnQgPT4ge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG1lcmdlT3B0aW9ucyh7fSwgY3VycmVudCwgdmFsdWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG1lcmdlT3B0aW9ucyh7IHJlbGF0aW9uc2hpcHM6IHt9LCBhdHRyaWJ1dGVzOiB7fSB9LCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAudGhlbigodG9TYXZlOiBNb2RlbERhdGEpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyh0b1NhdmUpLCB0b1NhdmUpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmlyZVdyaXRlVXBkYXRlKFxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbih7fSwgdG9TYXZlLCB7IGludmFsaWRhdGU6IFsnYXR0cmlidXRlcyddIH0pLFxuICAgICAgICAgICk7XG4gICAgICAgICAgcmV0dXJuIHRvU2F2ZTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgfVxuXG4gIHJlYWRBdHRyaWJ1dGVzKHZhbHVlOiBNb2RlbFJlZmVyZW5jZSk6IFByb21pc2U8TW9kZWxEYXRhPiB7XG4gICAgcmV0dXJuIHRoaXMuX2dldCh0aGlzLmtleVN0cmluZyh2YWx1ZSkpLnRoZW4oZCA9PiB7XG4gICAgICBpZiAoZCAmJiBkLmF0dHJpYnV0ZXMgJiYgT2JqZWN0LmtleXMoZC5hdHRyaWJ1dGVzKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiBkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBjYWNoZSh2YWx1ZTogTW9kZWxEYXRhKSB7XG4gICAgaWYgKHZhbHVlLmlkID09PSB1bmRlZmluZWQgfHwgdmFsdWUuaWQgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcbiAgICAgICAgJ0Nhbm5vdCBjYWNoZSBkYXRhIHdpdGhvdXQgYW4gaWQgLSB3cml0ZSBpdCB0byBhIHRlcm1pbmFsIGZpcnN0JyxcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodmFsdWUpKS50aGVuKGN1cnJlbnQgPT4ge1xuICAgICAgICBjb25zdCBuZXdWYWwgPSBtZXJnZU9wdGlvbnMoY3VycmVudCB8fCB7fSwgdmFsdWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5fc2V0KHRoaXMua2V5U3RyaW5nKHZhbHVlKSwgbmV3VmFsKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGNhY2hlQXR0cmlidXRlcyh2YWx1ZTogTW9kZWxEYXRhKSB7XG4gICAgaWYgKHZhbHVlLmlkID09PSB1bmRlZmluZWQgfHwgdmFsdWUuaWQgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcbiAgICAgICAgJ0Nhbm5vdCBjYWNoZSBkYXRhIHdpdGhvdXQgYW4gaWQgLSB3cml0ZSBpdCB0byBhIHRlcm1pbmFsIGZpcnN0JyxcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodmFsdWUpKS50aGVuKGN1cnJlbnQgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2V0KHRoaXMua2V5U3RyaW5nKHZhbHVlKSwge1xuICAgICAgICAgIHR5cGU6IHZhbHVlLnR5cGUsXG4gICAgICAgICAgaWQ6IHZhbHVlLmlkLFxuICAgICAgICAgIGF0dHJpYnV0ZXM6IHZhbHVlLmF0dHJpYnV0ZXMsXG4gICAgICAgICAgcmVsYXRpb25zaGlwczogY3VycmVudC5yZWxhdGlvbnNoaXBzIHx8IHt9LFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGNhY2hlUmVsYXRpb25zaGlwKHZhbHVlOiBNb2RlbERhdGEpIHtcbiAgICBpZiAodmFsdWUuaWQgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZS5pZCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KFxuICAgICAgICAnQ2Fubm90IGNhY2hlIGRhdGEgd2l0aG91dCBhbiBpZCAtIHdyaXRlIGl0IHRvIGEgdGVybWluYWwgZmlyc3QnLFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX2dldCh0aGlzLmtleVN0cmluZyh2YWx1ZSkpLnRoZW4oY3VycmVudCA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodmFsdWUpLCB7XG4gICAgICAgICAgdHlwZTogdmFsdWUudHlwZSxcbiAgICAgICAgICBpZDogdmFsdWUuaWQsXG4gICAgICAgICAgYXR0cmlidXRlczogY3VycmVudC5hdHRyaWJ1dGVzIHx8IHt9LFxuICAgICAgICAgIHJlbGF0aW9uc2hpcHM6IHZhbHVlLnJlbGF0aW9uc2hpcHMsXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmVhZFJlbGF0aW9uc2hpcCh2YWx1ZTogTW9kZWxSZWZlcmVuY2UsIHJlbE5hbWU6IHN0cmluZyk6IFByb21pc2U8TW9kZWxEYXRhPiB7XG4gICAgcmV0dXJuIHRoaXMuX2dldCh0aGlzLmtleVN0cmluZyh2YWx1ZSkpLnRoZW4odiA9PiB7XG4gICAgICBjb25zdCByZXRWYWwgPSBPYmplY3QuYXNzaWduKHt9LCB2KTtcbiAgICAgIGlmICghdikge1xuICAgICAgICBpZiAodGhpcy50ZXJtaW5hbCkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiB2YWx1ZS50eXBlLFxuICAgICAgICAgICAgaWQ6IHZhbHVlLmlkLFxuICAgICAgICAgICAgcmVsYXRpb25zaGlwczogeyBbcmVsTmFtZV06IFtdIH0sXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICghdi5yZWxhdGlvbnNoaXBzICYmIHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgcmV0VmFsLnJlbGF0aW9uc2hpcHMgPSB7IFtyZWxOYW1lXTogW10gfTtcbiAgICAgIH0gZWxzZSBpZiAoIXJldFZhbC5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdICYmIHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgcmV0VmFsLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0gPSBbXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXRWYWw7XG4gICAgfSk7XG4gIH1cblxuICBkZWxldGUodmFsdWU6IE1vZGVsUmVmZXJlbmNlKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RlbCh0aGlzLmtleVN0cmluZyh2YWx1ZSkpLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgdGhpcy5maXJlV3JpdGVVcGRhdGUoe1xuICAgICAgICAgIGlkOiB2YWx1ZS5pZCxcbiAgICAgICAgICB0eXBlOiB2YWx1ZS50eXBlLFxuICAgICAgICAgIGludmFsaWRhdGU6IFsnYXR0cmlidXRlcycsICdyZWxhdGlvbnNoaXBzJ10sXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgd2lwZSh2YWx1ZTogTW9kZWxSZWZlcmVuY2UsIGZpZWxkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBrcyA9IHRoaXMua2V5U3RyaW5nKHZhbHVlKTtcbiAgICByZXR1cm4gdGhpcy5fZ2V0KGtzKS50aGVuKHZhbCA9PiB7XG4gICAgICBpZiAodmFsID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgY29uc3QgbmV3VmFsID0gT2JqZWN0LmFzc2lnbih7fSwgdmFsKTtcbiAgICAgIGlmIChmaWVsZCA9PT0gJ2F0dHJpYnV0ZXMnKSB7XG4gICAgICAgIGRlbGV0ZSBuZXdWYWwuYXR0cmlidXRlcztcbiAgICAgIH0gZWxzZSBpZiAoZmllbGQgPT09ICdyZWxhdGlvbnNoaXBzJykge1xuICAgICAgICBkZWxldGUgbmV3VmFsLnJlbGF0aW9uc2hpcHM7XG4gICAgICB9IGVsc2UgaWYgKGZpZWxkLmluZGV4T2YoJ3JlbGF0aW9uc2hpcHMuJykgPT09IDApIHtcbiAgICAgICAgZGVsZXRlIG5ld1ZhbC5yZWxhdGlvbnNoaXBzW2ZpZWxkLnNwbGl0KCcuJylbMV1dO1xuICAgICAgICBpZiAoT2JqZWN0LmtleXMobmV3VmFsLnJlbGF0aW9uc2hpcHMpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGRlbGV0ZSBuZXdWYWwucmVsYXRpb25zaGlwcztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgZGVsZXRlIGZpZWxkICR7ZmllbGR9IC0gdW5rbm93biBmb3JtYXRgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9zZXQoa3MsIG5ld1ZhbCk7XG4gICAgfSk7XG4gIH1cblxuICB3cml0ZVJlbGF0aW9uc2hpcEl0ZW0oXG4gICAgdmFsdWU6IE1vZGVsUmVmZXJlbmNlLFxuICAgIHJlbE5hbWU6IHN0cmluZyxcbiAgICBjaGlsZDogUmVsYXRpb25zaGlwSXRlbSxcbiAgKSB7XG4gICAgY29uc3Qgc2NoZW1hID0gdGhpcy5nZXRTY2hlbWEodmFsdWUudHlwZSk7XG4gICAgY29uc3QgcmVsU2NoZW1hID0gc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0udHlwZTtcbiAgICBjb25zdCBvdGhlclJlbFR5cGUgPSByZWxTY2hlbWEuc2lkZXNbcmVsTmFtZV0ub3RoZXJUeXBlO1xuICAgIGNvbnN0IG90aGVyUmVsTmFtZSA9IHJlbFNjaGVtYS5zaWRlc1tyZWxOYW1lXS5vdGhlck5hbWU7XG4gICAgY29uc3QgdGhpc0tleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHZhbHVlKTtcbiAgICBjb25zdCBvdGhlcktleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHsgdHlwZTogb3RoZXJSZWxUeXBlLCBpZDogY2hpbGQuaWQgfSk7XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKFtcbiAgICAgIHRoaXMuX2dldCh0aGlzS2V5U3RyaW5nKSxcbiAgICAgIHRoaXMuX2dldChvdGhlcktleVN0cmluZyksXG4gICAgXSkudGhlbigoW3RoaXNJdGVtUmVzb2x2ZWQsIG90aGVySXRlbVJlc29sdmVkXSkgPT4ge1xuICAgICAgbGV0IHRoaXNJdGVtID0gdGhpc0l0ZW1SZXNvbHZlZDtcbiAgICAgIGlmICghdGhpc0l0ZW0pIHtcbiAgICAgICAgdGhpc0l0ZW0gPSB7XG4gICAgICAgICAgaWQ6IGNoaWxkLmlkLFxuICAgICAgICAgIHR5cGU6IG90aGVyUmVsVHlwZSxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiB7fSxcbiAgICAgICAgICByZWxhdGlvbnNoaXBzOiB7fSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGxldCBvdGhlckl0ZW0gPSBvdGhlckl0ZW1SZXNvbHZlZDtcbiAgICAgIGlmICghb3RoZXJJdGVtKSB7XG4gICAgICAgIG90aGVySXRlbSA9IHtcbiAgICAgICAgICBpZDogY2hpbGQuaWQsXG4gICAgICAgICAgdHlwZTogb3RoZXJSZWxUeXBlLFxuICAgICAgICAgIGF0dHJpYnV0ZXM6IHt9LFxuICAgICAgICAgIHJlbGF0aW9uc2hpcHM6IHt9LFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgY29uc3QgbmV3Q2hpbGQ6IFJlbGF0aW9uc2hpcEl0ZW0gPSB7IGlkOiBjaGlsZC5pZCwgdHlwZTogb3RoZXJSZWxUeXBlIH07XG4gICAgICBjb25zdCBuZXdQYXJlbnQ6IFJlbGF0aW9uc2hpcEl0ZW0gPSB7IGlkOiB2YWx1ZS5pZCwgdHlwZTogdmFsdWUudHlwZSB9O1xuICAgICAgaWYgKCF0aGlzSXRlbS5yZWxhdGlvbnNoaXBzKSB7XG4gICAgICAgIHRoaXNJdGVtLnJlbGF0aW9uc2hpcHMgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpc0l0ZW0ucmVsYXRpb25zaGlwc1tyZWxOYW1lXSkge1xuICAgICAgICB0aGlzSXRlbS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdID0gW107XG4gICAgICB9XG4gICAgICBpZiAoIW90aGVySXRlbS5yZWxhdGlvbnNoaXBzKSB7XG4gICAgICAgIG90aGVySXRlbS5yZWxhdGlvbnNoaXBzID0ge307XG4gICAgICB9XG4gICAgICBpZiAoIW90aGVySXRlbS5yZWxhdGlvbnNoaXBzW290aGVyUmVsTmFtZV0pIHtcbiAgICAgICAgb3RoZXJJdGVtLnJlbGF0aW9uc2hpcHNbb3RoZXJSZWxOYW1lXSA9IFtdO1xuICAgICAgfVxuICAgICAgaWYgKHJlbFNjaGVtYS5leHRyYXMgJiYgY2hpbGQubWV0YSkge1xuICAgICAgICBuZXdQYXJlbnQubWV0YSA9IHt9O1xuICAgICAgICBuZXdDaGlsZC5tZXRhID0ge307XG4gICAgICAgIGZvciAoY29uc3QgZXh0cmEgaW4gY2hpbGQubWV0YSkge1xuICAgICAgICAgIGlmIChleHRyYSBpbiByZWxTY2hlbWEuZXh0cmFzKSB7XG4gICAgICAgICAgICBuZXdDaGlsZC5tZXRhW2V4dHJhXSA9IGNoaWxkLm1ldGFbZXh0cmFdO1xuICAgICAgICAgICAgbmV3UGFyZW50Lm1ldGFbZXh0cmFdID0gY2hpbGQubWV0YVtleHRyYV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRoaXNJZHggPSB0aGlzSXRlbS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLmZpbmRJbmRleChcbiAgICAgICAgaXRlbSA9PiBpdGVtLmlkID09PSBjaGlsZC5pZCxcbiAgICAgICk7XG4gICAgICBjb25zdCBvdGhlcklkeCA9IG90aGVySXRlbS5yZWxhdGlvbnNoaXBzW290aGVyUmVsTmFtZV0uZmluZEluZGV4KFxuICAgICAgICBpdGVtID0+IGl0ZW0uaWQgPT09IHZhbHVlLmlkLFxuICAgICAgKTtcbiAgICAgIGlmICh0aGlzSWR4IDwgMCkge1xuICAgICAgICB0aGlzSXRlbS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnB1c2gobmV3Q2hpbGQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpc0l0ZW0ucmVsYXRpb25zaGlwc1tyZWxOYW1lXVt0aGlzSWR4XSA9IG5ld0NoaWxkO1xuICAgICAgfVxuICAgICAgaWYgKG90aGVySWR4IDwgMCkge1xuICAgICAgICBvdGhlckl0ZW0ucmVsYXRpb25zaGlwc1tvdGhlclJlbE5hbWVdLnB1c2gobmV3UGFyZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG90aGVySXRlbS5yZWxhdGlvbnNoaXBzW290aGVyUmVsTmFtZV1bb3RoZXJJZHhdID0gbmV3UGFyZW50O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgICB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodGhpc0l0ZW0pLCB0aGlzSXRlbSksXG4gICAgICAgIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyhvdGhlckl0ZW0pLCBvdGhlckl0ZW0pLFxuICAgICAgXSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmlyZVdyaXRlVXBkYXRlKFxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzSXRlbSwge1xuICAgICAgICAgICAgICBpbnZhbGlkYXRlOiBbYHJlbGF0aW9uc2hpcHMuJHtyZWxOYW1lfWBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLmZpcmVXcml0ZVVwZGF0ZShcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24ob3RoZXJJdGVtLCB7XG4gICAgICAgICAgICAgIGludmFsaWRhdGU6IFtgcmVsYXRpb25zaGlwcy4ke290aGVyUmVsTmFtZX1gXSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICk7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKCgpID0+IHRoaXNJdGVtKTtcbiAgICB9KTtcbiAgfVxuXG4gIGRlbGV0ZVJlbGF0aW9uc2hpcEl0ZW0oXG4gICAgdmFsdWU6IE1vZGVsUmVmZXJlbmNlLFxuICAgIHJlbE5hbWU6IHN0cmluZyxcbiAgICBjaGlsZDogUmVsYXRpb25zaGlwSXRlbSxcbiAgKSB7XG4gICAgY29uc3Qgc2NoZW1hID0gdGhpcy5nZXRTY2hlbWEodmFsdWUudHlwZSk7XG4gICAgY29uc3QgcmVsU2NoZW1hID0gc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0udHlwZTtcbiAgICBjb25zdCBvdGhlclJlbFR5cGUgPSByZWxTY2hlbWEuc2lkZXNbcmVsTmFtZV0ub3RoZXJUeXBlO1xuICAgIGNvbnN0IG90aGVyUmVsTmFtZSA9IHJlbFNjaGVtYS5zaWRlc1tyZWxOYW1lXS5vdGhlck5hbWU7XG4gICAgY29uc3QgdGhpc0tleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHZhbHVlKTtcbiAgICBjb25zdCBvdGhlcktleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHsgdHlwZTogb3RoZXJSZWxUeXBlLCBpZDogY2hpbGQuaWQgfSk7XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKFtcbiAgICAgIHRoaXMuX2dldCh0aGlzS2V5U3RyaW5nKSxcbiAgICAgIHRoaXMuX2dldChvdGhlcktleVN0cmluZyksXG4gICAgXSkudGhlbigoW3RoaXNJdGVtLCBvdGhlckl0ZW1dKSA9PiB7XG4gICAgICBpZiAoIXRoaXNJdGVtLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0pIHtcbiAgICAgICAgdGhpc0l0ZW0ucmVsYXRpb25zaGlwc1tyZWxOYW1lXSA9IFtdO1xuICAgICAgfVxuICAgICAgaWYgKCFvdGhlckl0ZW0ucmVsYXRpb25zaGlwc1tvdGhlclJlbE5hbWVdKSB7XG4gICAgICAgIG90aGVySXRlbS5yZWxhdGlvbnNoaXBzW290aGVyUmVsTmFtZV0gPSBbXTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHRoaXNJZHggPSB0aGlzSXRlbS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLmZpbmRJbmRleChcbiAgICAgICAgaXRlbSA9PiBpdGVtLmlkID09PSBjaGlsZC5pZCxcbiAgICAgICk7XG4gICAgICBjb25zdCBvdGhlcklkeCA9IG90aGVySXRlbS5yZWxhdGlvbnNoaXBzW290aGVyUmVsTmFtZV0uZmluZEluZGV4KFxuICAgICAgICBpdGVtID0+IGl0ZW0uaWQgPT09IHZhbHVlLmlkLFxuICAgICAgKTtcbiAgICAgIGlmICh0aGlzSWR4ID49IDApIHtcbiAgICAgICAgdGhpc0l0ZW0ucmVsYXRpb25zaGlwc1tyZWxOYW1lXS5zcGxpY2UodGhpc0lkeCwgMSk7XG4gICAgICB9XG4gICAgICBpZiAob3RoZXJJZHggPj0gMCkge1xuICAgICAgICBvdGhlckl0ZW0ucmVsYXRpb25zaGlwc1tvdGhlclJlbE5hbWVdLnNwbGljZShvdGhlcklkeCwgMSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICAgIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyh0aGlzSXRlbSksIHRoaXNJdGVtKSxcbiAgICAgICAgdGhpcy5fc2V0KHRoaXMua2V5U3RyaW5nKG90aGVySXRlbSksIG90aGVySXRlbSksXG4gICAgICBdKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maXJlV3JpdGVVcGRhdGUoXG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKHRoaXNJdGVtLCB7XG4gICAgICAgICAgICAgIGludmFsaWRhdGU6IFtgcmVsYXRpb25zaGlwcy4ke3JlbE5hbWV9YF0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMuZmlyZVdyaXRlVXBkYXRlKFxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihvdGhlckl0ZW0sIHtcbiAgICAgICAgICAgICAgaW52YWxpZGF0ZTogW2ByZWxhdGlvbnNoaXBzLiR7b3RoZXJSZWxOYW1lfWBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKTtcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKCkgPT4gdGhpc0l0ZW0pO1xuICAgIH0pO1xuICB9XG5cbiAgcXVlcnkodDogc3RyaW5nLCBxPzogYW55KTogUHJvbWlzZTxNb2RlbFJlZmVyZW5jZVtdPiB7XG4gICAgcmV0dXJuIHRoaXMuX2tleXModCkudGhlbihrZXlzID0+IHtcbiAgICAgIHJldHVybiBrZXlzXG4gICAgICAgIC5tYXAoayA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IHQsXG4gICAgICAgICAgICBpZDogcGFyc2VJbnQoay5zcGxpdCgnOicpWzFdLCAxMCksXG4gICAgICAgICAgfTtcbiAgICAgICAgfSlcbiAgICAgICAgLmZpbHRlcih2ID0+ICFpc05hTih2LmlkKSk7XG4gICAgfSk7XG4gIH1cblxuICBhZGRTY2hlbWEodDogeyB0eXBlOiBzdHJpbmc7IHNjaGVtYTogTW9kZWxTY2hlbWEgfSkge1xuICAgIHJldHVybiBzdXBlci5hZGRTY2hlbWEodCkudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLm1heEtleXNbdC50eXBlXSA9IDA7XG4gICAgfSk7XG4gIH1cblxuICBrZXlTdHJpbmcodmFsdWU6IE1vZGVsUmVmZXJlbmNlKSB7XG4gICAgcmV0dXJuIGAke3ZhbHVlLnR5cGV9OiR7dmFsdWUuaWR9YDtcbiAgfVxufVxuIl19
