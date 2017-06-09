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
    return ((typeof i === 'number') && (!isNaN(i)) && (i !== Infinity) && (i !== -Infinity));
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
            if ((value.id === undefined) || (value.id === null)) {
                if (!_this.terminal) {
                    throw new Error('Cannot create new content in a non-terminal store');
                }
                return _this.allocateId(value.type)
                    .then(function (n) {
                    return mergeOptions({}, value, { id: n, relationships: {}, attributes: (_a = {}, _a[idAttribute] = n, _a) });
                    var _a;
                });
            }
            else {
                var thisId = typeof value.id === 'string' ? parseInt(value.id, 10) : value.id;
                if (saneNumber(thisId) && thisId > _this.maxKeys[value.type]) {
                    _this.maxKeys[value.type] = thisId;
                }
                return _this._get(_this.keyString(value))
                    .then(function (current) {
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
            return _this._set(_this.keyString(toSave), toSave)
                .then(function () {
                _this.fireWriteUpdate(Object.assign({}, toSave, { invalidate: ['attributes'] }));
                return toSave;
            });
        });
    };
    KeyValueStore.prototype.readAttributes = function (value) {
        return this._get(this.keyString(value))
            .then(function (d) {
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
        if ((value.id === undefined) || (value.id === null)) {
            return Promise.reject('Cannot cache data without an id - write it to a terminal first');
        }
        else {
            return this._get(this.keyString(value))
                .then(function (current) {
                var newVal = mergeOptions(current || {}, value);
                return _this._set(_this.keyString(value), newVal);
            });
        }
    };
    KeyValueStore.prototype.cacheAttributes = function (value) {
        var _this = this;
        if ((value.id === undefined) || (value.id === null)) {
            return Promise.reject('Cannot cache data without an id - write it to a terminal first');
        }
        else {
            return this._get(this.keyString(value))
                .then(function (current) {
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
        if ((value.id === undefined) || (value.id === null)) {
            return Promise.reject('Cannot cache data without an id - write it to a terminal first');
        }
        else {
            return this._get(this.keyString(value))
                .then(function (current) {
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
        return this._get(this.keyString(value))
            .then(function (v) {
            var retVal = Object.assign({}, v);
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
        var otherRelName = relSchema.sides[relName].otherName;
        var thisKeyString = this.keyString(value);
        var otherKeyString = this.keyString(child);
        return Promise.all([
            this._get(thisKeyString),
            this._get(otherKeyString),
        ])
            .then(function (_a) {
            var thisItemResolved = _a[0], otherItemResolved = _a[1];
            var thisItem = thisItemResolved;
            if (!thisItem) {
                thisItem = {
                    id: value.id,
                    type: value.type,
                    attributes: {},
                    relationships: {},
                };
            }
            var otherItem = otherItemResolved;
            if (!otherItem) {
                otherItem = {
                    id: child.id,
                    type: child.type,
                    attributes: {},
                    relationships: {},
                };
            }
            var newChild = { type: child.type, id: child.id };
            var newParent = { type: value.type, id: value.id };
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
            ]).then(function () {
                _this.fireWriteUpdate(Object.assign(thisItem, { invalidate: ["relationships." + relName] }));
                _this.fireWriteUpdate(Object.assign(otherItem, { invalidate: ["relationships." + otherRelName] }));
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
        ])
            .then(function (_a) {
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
            ]).then(function () {
                _this.fireWriteUpdate(Object.assign(thisItem, { invalidate: ["relationships." + relName] }));
                _this.fireWriteUpdate(Object.assign(otherItem, { invalidate: ["relationships." + otherRelName] }));
            })
                .then(function () { return thisItem; });
        });
    };
    KeyValueStore.prototype.query = function (t) {
        return this._keys(t)
            .then(function (keys) {
            return keys.map(function (k) {
                return {
                    type: t,
                    id: parseInt(k.split(':')[1], 10),
                };
            }).filter(function (v) { return !isNaN(v.id); });
        });
    };
    KeyValueStore.prototype.addSchema = function (t) {
        var _this = this;
        return _super.prototype.addSchema.call(this, t)
            .then(function () {
            _this.maxKeys[t.type] = 0;
        });
    };
    KeyValueStore.prototype.keyString = function (value) {
        return value.type + ":" + value.id;
    };
    return KeyValueStore;
}(storage_1.Storage));
exports.KeyValueStore = KeyValueStore;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zdG9yYWdlL2tleVZhbHVlU3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsNENBQThDO0FBRTlDLHFDQUFvQztBQVlwQyxvQkFBb0IsQ0FBQztJQUNuQixNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDM0YsQ0FBQztBQUlEO0lBQTRDLGlDQUFPO0lBQW5EO1FBQUEscUVBMFNDO1FBelNDLGFBQU8sR0FBK0IsRUFBRSxDQUFDOztJQXlTM0MsQ0FBQztJQWxTQyxrQ0FBVSxHQUFWLFVBQVcsSUFBWTtRQUNyQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzVDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBRUQsdUNBQWUsR0FBZixVQUFnQixVQUErQjtRQUEvQyxpQkFzQ0M7UUFyQ0MsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM3QyxPQUFPLEtBQUssQ0FBQyxhQUFhLENBQUM7UUFFM0IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUU7YUFDdkIsSUFBSSxDQUFDO1lBQ0osSUFBTSxXQUFXLEdBQUcsS0FBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxDQUFDO1lBQ2hFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxTQUFTLENBQUMs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QUM7YUFDeEIsSUFBSSxDQUFDO1lBQ0osS0FBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzNCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELGlDQUFTLEdBQVQsVUFBVSxLQUFxQjtRQUM3QixNQUFNLENBQUksS0FBSyxDQUFDLElBQUksU0FBSSxLQUFLLENBQUMsRUFBSSxDQUFDO0lBQ3JDLENBQUM7SUFDSCxvQkFBQztBQUFELENBMVNBLEFBMFNDLENBMVMyQyxpQkFBTyxHQTBTbEQ7QUExU3FCLHNDQUFhIiwiZmlsZSI6InN0b3JhZ2Uva2V5VmFsdWVTdG9yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcblxuaW1wb3J0IHsgU3RvcmFnZSB9IGZyb20gJy4vc3RvcmFnZSc7XG5pbXBvcnQge1xuICBJbmRlZmluaXRlTW9kZWxEYXRhLFxuICBNb2RlbERhdGEsXG4gIE1vZGVsUmVmZXJlbmNlLFxuICBNb2RlbFNjaGVtYSxcbiAgUmVsYXRpb25zaGlwSXRlbSxcbiAgVGVybWluYWxTdG9yZSxcbiAgQ2FjaGVTdG9yZSxcbiAgQWxsb2NhdGluZ1N0b3JlXG59IGZyb20gJy4uL2RhdGFUeXBlcyc7XG5cbmZ1bmN0aW9uIHNhbmVOdW1iZXIoaSkge1xuICByZXR1cm4gKCh0eXBlb2YgaSA9PT0gJ251bWJlcicpICYmICghaXNOYU4oaSkpICYmIChpICE9PSBJbmZpbml0eSkgJiYgKGkgIT09IC1JbmZpbml0eSkpO1xufVxuXG4vLyBkZWNsYXJlIGZ1bmN0aW9uIHBhcnNlSW50KG46IHN0cmluZyB8IG51bWJlciwgcmFkaXg6IG51bWJlcik6IG51bWJlcjtcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEtleVZhbHVlU3RvcmUgZXh0ZW5kcyBTdG9yYWdlIGltcGxlbWVudHMgVGVybWluYWxTdG9yZSwgQ2FjaGVTdG9yZSwgQWxsb2NhdGluZ1N0b3JlIHtcbiAgbWF4S2V5czogeyBbdHlwZTogc3RyaW5nXTogbnVtYmVyIH0gPSB7fTtcblxuICBhYnN0cmFjdCBfa2V5cyh0eXBlOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPjtcbiAgYWJzdHJhY3QgX2dldChrOiBzdHJpbmcpOiBQcm9taXNlPE1vZGVsRGF0YSB8IG51bGw+O1xuICBhYnN0cmFjdCBfc2V0KGs6IHN0cmluZywgdjogTW9kZWxEYXRhKTogUHJvbWlzZTxNb2RlbERhdGE+O1xuICBhYnN0cmFjdCBfZGVsKGs6IHN0cmluZyk6IFByb21pc2U8TW9kZWxEYXRhPjtcblxuICBhbGxvY2F0ZUlkKHR5cGU6IHN0cmluZykge1xuICAgIHRoaXMubWF4S2V5c1t0eXBlXSA9IHRoaXMubWF4S2V5c1t0eXBlXSArIDE7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLm1heEtleXNbdHlwZV0pO1xuICB9XG5cbiAgd3JpdGVBdHRyaWJ1dGVzKGlucHV0VmFsdWU6IEluZGVmaW5pdGVNb2RlbERhdGEpIHtcbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMudmFsaWRhdGVJbnB1dChpbnB1dFZhbHVlKTtcbiAgICBkZWxldGUgdmFsdWUucmVsYXRpb25zaGlwcztcbiAgICAvLyB0cmltIG91dCByZWxhdGlvbnNoaXBzIGZvciBhIGRpcmVjdCB3cml0ZS5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCBpZEF0dHJpYnV0ZSA9IHRoaXMuZ2V0U2NoZW1hKGlucHV0VmFsdWUudHlwZSkuaWRBdHRyaWJ1dGU7XG4gICAgICBpZiAoKHZhbHVlLmlkID09PSB1bmRlZmluZWQpIHx8ICh2YWx1ZS5pZCA9PT0gbnVsbCkpIHtcbiAgICAgICAgaWYgKCF0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIG5ldyBjb250ZW50IGluIGEgbm9uLXRlcm1pbmFsIHN0b3JlJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuYWxsb2NhdGVJZCh2YWx1ZS50eXBlKVxuICAgICAgICAudGhlbigobikgPT4ge1xuICAgICAgICAgIHJldHVybiBtZXJnZU9wdGlvbnMoe30sIHZhbHVlLCB7IGlkOiBuLCByZWxhdGlvbnNoaXBzOiB7fSwgYXR0cmlidXRlczogeyBbaWRBdHRyaWJ1dGVdOiBuIH0gfSkgYXMgTW9kZWxEYXRhOyAvLyBpZiBuZXcuXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gaWYgbm90IG5ldywgZ2V0IGN1cnJlbnQgKGluY2x1ZGluZyByZWxhdGlvbnNoaXBzKSBhbmQgbWVyZ2VcbiAgICAgICAgY29uc3QgdGhpc0lkID0gdHlwZW9mIHZhbHVlLmlkID09PSAnc3RyaW5nJyA/IHBhcnNlSW50KHZhbHVlLmlkLCAxMCkgOiB2YWx1ZS5pZDtcbiAgICAgICAgaWYgKHNhbmVOdW1iZXIodGhpc0lkKSAmJiB0aGlzSWQgPiB0aGlzLm1heEtleXNbdmFsdWUudHlwZV0pIHtcbiAgICAgICAgICB0aGlzLm1heEtleXNbdmFsdWUudHlwZV0gPSB0aGlzSWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldCh0aGlzLmtleVN0cmluZyh2YWx1ZSBhcyBNb2RlbFJlZmVyZW5jZSkpXG4gICAgICAgIC50aGVuKGN1cnJlbnQgPT4gIHtcbiAgICAgICAgICBpZiAoY3VycmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIG1lcmdlT3B0aW9ucyh7fSwgY3VycmVudCwgdmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VPcHRpb25zKHsgcmVsYXRpb25zaGlwczoge30sIGF0dHJpYnV0ZXM6IHt9IH0sIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pXG4gICAgLnRoZW4oKHRvU2F2ZTogTW9kZWxEYXRhKSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5fc2V0KHRoaXMua2V5U3RyaW5nKHRvU2F2ZSksIHRvU2F2ZSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5maXJlV3JpdGVVcGRhdGUoT2JqZWN0LmFzc2lnbih7fSwgdG9TYXZlLCB7IGludmFsaWRhdGU6IFsnYXR0cmlidXRlcyddIH0pKTtcbiAgICAgICAgcmV0dXJuIHRvU2F2ZTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcmVhZEF0dHJpYnV0ZXModmFsdWU6IE1vZGVsUmVmZXJlbmNlKTogUHJvbWlzZTxNb2RlbERhdGE+IHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHZhbHVlKSlcbiAgICAudGhlbihkID0+IHtcbiAgICAgIGlmIChkICYmIGQuYXR0cmlidXRlcyAmJiBPYmplY3Qua2V5cyhkLmF0dHJpYnV0ZXMpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIGQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGNhY2hlKHZhbHVlOiBNb2RlbERhdGEpIHtcbiAgICBpZiAoKHZhbHVlLmlkID09PSB1bmRlZmluZWQpIHx8ICh2YWx1ZS5pZCA9PT0gbnVsbCkpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgnQ2Fubm90IGNhY2hlIGRhdGEgd2l0aG91dCBhbiBpZCAtIHdyaXRlIGl0IHRvIGEgdGVybWluYWwgZmlyc3QnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX2dldCh0aGlzLmtleVN0cmluZyh2YWx1ZSkpXG4gICAgICAudGhlbigoY3VycmVudCkgPT4ge1xuICAgICAgICBjb25zdCBuZXdWYWwgPSBtZXJnZU9wdGlvbnMoY3VycmVudCB8fCB7fSwgdmFsdWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5fc2V0KHRoaXMua2V5U3RyaW5nKHZhbHVlKSwgbmV3VmFsKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGNhY2hlQXR0cmlidXRlcyh2YWx1ZTogTW9kZWxEYXRhKSB7XG4gICAgaWYgKCh2YWx1ZS5pZCA9PT0gdW5kZWZpbmVkKSB8fCAodmFsdWUuaWQgPT09IG51bGwpKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ0Nhbm5vdCBjYWNoZSBkYXRhIHdpdGhvdXQgYW4gaWQgLSB3cml0ZSBpdCB0byBhIHRlcm1pbmFsIGZpcnN0Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodmFsdWUpKVxuICAgICAgLnRoZW4oKGN1cnJlbnQpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyh2YWx1ZSksIHtcbiAgICAgICAgICB0eXBlOiB2YWx1ZS50eXBlLFxuICAgICAgICAgIGlkOiB2YWx1ZS5pZCxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiB2YWx1ZS5hdHRyaWJ1dGVzLFxuICAgICAgICAgIHJlbGF0aW9uc2hpcHM6IGN1cnJlbnQucmVsYXRpb25zaGlwcyB8fCB7fSxcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBjYWNoZVJlbGF0aW9uc2hpcCh2YWx1ZTogTW9kZWxEYXRhKSB7XG4gICAgaWYgKCh2YWx1ZS5pZCA9PT0gdW5kZWZpbmVkKSB8fCAodmFsdWUuaWQgPT09IG51bGwpKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ0Nhbm5vdCBjYWNoZSBkYXRhIHdpdGhvdXQgYW4gaWQgLSB3cml0ZSBpdCB0byBhIHRlcm1pbmFsIGZpcnN0Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodmFsdWUpKVxuICAgICAgLnRoZW4oKGN1cnJlbnQpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyh2YWx1ZSksIHtcbiAgICAgICAgICB0eXBlOiB2YWx1ZS50eXBlLFxuICAgICAgICAgIGlkOiB2YWx1ZS5pZCxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiBjdXJyZW50LmF0dHJpYnV0ZXMgfHwge30sXG4gICAgICAgICAgcmVsYXRpb25zaGlwczogdmFsdWUucmVsYXRpb25zaGlwcyxcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZWFkUmVsYXRpb25zaGlwKHZhbHVlOiBNb2RlbFJlZmVyZW5jZSwgcmVsTmFtZTogc3RyaW5nKTogUHJvbWlzZTxNb2RlbERhdGE+IHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHZhbHVlKSlcbiAgICAudGhlbigodikgPT4ge1xuICAgICAgY29uc3QgcmV0VmFsID0gT2JqZWN0LmFzc2lnbih7fSwgdik7XG4gICAgICBpZiAoIXYpIHtcbiAgICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgICByZXR1cm4geyB0eXBlOiB2YWx1ZS50eXBlLCBpZDogdmFsdWUuaWQsIHJlbGF0aW9uc2hpcHM6IHsgW3JlbE5hbWVdOiBbXSB9IH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoIXYucmVsYXRpb25zaGlwcyAmJiB0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgIHJldFZhbC5yZWxhdGlvbnNoaXBzID0geyBbcmVsTmFtZV06IFtdIH07XG4gICAgICB9IGVsc2UgaWYgKCFyZXRWYWwucmVsYXRpb25zaGlwc1tyZWxOYW1lXSAmJiB0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgIHJldFZhbC5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdID0gW107XG4gICAgICB9XG4gICAgICByZXR1cm4gcmV0VmFsO1xuICAgIH0pO1xuICB9XG5cbiAgZGVsZXRlKHZhbHVlOiBNb2RlbFJlZmVyZW5jZSkge1xuICAgIHJldHVybiB0aGlzLl9kZWwodGhpcy5rZXlTdHJpbmcodmFsdWUpKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgIHRoaXMuZmlyZVdyaXRlVXBkYXRlKHsgaWQ6IHZhbHVlLmlkLCB0eXBlOiB2YWx1ZS50eXBlLCBpbnZhbGlkYXRlOiBbJ2F0dHJpYnV0ZXMnLCAncmVsYXRpb25zaGlwcyddIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgd2lwZSh2YWx1ZTogTW9kZWxSZWZlcmVuY2UsIGZpZWxkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBrcyA9IHRoaXMua2V5U3RyaW5nKHZhbHVlKTtcbiAgICByZXR1cm4gdGhpcy5fZ2V0KGtzKVxuICAgIC50aGVuKCh2YWwpID0+IHtcbiAgICAgIGlmICh2YWwgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBjb25zdCBuZXdWYWwgPSBPYmplY3QuYXNzaWduKHt9LCB2YWwpO1xuICAgICAgaWYgKGZpZWxkID09PSAnYXR0cmlidXRlcycpIHtcbiAgICAgICAgZGVsZXRlIG5ld1ZhbC5hdHRyaWJ1dGVzO1xuICAgICAgfSBlbHNlIGlmIChmaWVsZCA9PT0gJ3JlbGF0aW9uc2hpcHMnKSB7XG4gICAgICAgIGRlbGV0ZSBuZXdWYWwucmVsYXRpb25zaGlwcztcbiAgICAgIH0gZWxzZSBpZiAoZmllbGQuaW5kZXhPZigncmVsYXRpb25zaGlwcy4nKSA9PT0gMCkge1xuICAgICAgICBkZWxldGUgbmV3VmFsLnJlbGF0aW9uc2hpcHNbZmllbGQuc3BsaXQoJy4nKVsxXV07XG4gICAgICAgIGlmIChPYmplY3Qua2V5cyhuZXdWYWwucmVsYXRpb25zaGlwcykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgZGVsZXRlIG5ld1ZhbC5yZWxhdGlvbnNoaXBzO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBkZWxldGUgZmllbGQgJHtmaWVsZH0gLSB1bmtub3duIGZvcm1hdGApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX3NldChrcywgbmV3VmFsKTtcbiAgICB9KTtcbiAgfVxuXG4gIHdyaXRlUmVsYXRpb25zaGlwSXRlbSh2YWx1ZTogTW9kZWxSZWZlcmVuY2UsIHJlbE5hbWU6IHN0cmluZywgY2hpbGQ6IFJlbGF0aW9uc2hpcEl0ZW0pIHtcbiAgICBjb25zdCBzY2hlbWEgPSB0aGlzLmdldFNjaGVtYSh2YWx1ZS50eXBlKTtcbiAgICBjb25zdCByZWxTY2hlbWEgPSBzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxOYW1lXS50eXBlO1xuICAgIGNvbnN0IG90aGVyUmVsTmFtZSA9IHJlbFNjaGVtYS5zaWRlc1tyZWxOYW1lXS5vdGhlck5hbWU7XG4gICAgY29uc3QgdGhpc0tleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHZhbHVlKTtcbiAgICBjb25zdCBvdGhlcktleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKGNoaWxkKTtcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgdGhpcy5fZ2V0KHRoaXNLZXlTdHJpbmcpLFxuICAgICAgdGhpcy5fZ2V0KG90aGVyS2V5U3RyaW5nKSxcbiAgICBdKVxuICAgIC50aGVuKChbdGhpc0l0ZW1SZXNvbHZlZCwgb3RoZXJJdGVtUmVzb2x2ZWRdKSA9PiB7XG4gICAgICBsZXQgdGhpc0l0ZW0gPSB0aGlzSXRlbVJlc29sdmVkO1xuICAgICAgaWYgKCF0aGlzSXRlbSkge1xuICAgICAgICB0aGlzSXRlbSA9IHtcbiAgICAgICAgICBpZDogdmFsdWUuaWQsXG4gICAgICAgICAgdHlwZTogdmFsdWUudHlwZSxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiB7fSxcbiAgICAgICAgICByZWxhdGlvbnNoaXBzOiB7fSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGxldCBvdGhlckl0ZW0gPSBvdGhlckl0ZW1SZXNvbHZlZDtcbiAgICAgIGlmICghb3RoZXJJdGVtKSB7XG4gICAgICAgIG90aGVySXRlbSA9IHtcbiAgICAgICAgICBpZDogY2hpbGQuaWQsXG4gICAgICAgICAgdHlwZTogY2hpbGQudHlwZSxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiB7fSxcbiAgICAgICAgICByZWxhdGlvbnNoaXBzOiB7fSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG5ld0NoaWxkOiBSZWxhdGlvbnNoaXBJdGVtID0geyB0eXBlOiBjaGlsZC50eXBlLCBpZDogY2hpbGQuaWQgfTtcbiAgICAgIGNvbnN0IG5ld1BhcmVudDogUmVsYXRpb25zaGlwSXRlbSA9IHsgdHlwZTogdmFsdWUudHlwZSwgaWQ6IHZhbHVlLmlkIH07XG4gICAgICBpZiAoIXRoaXNJdGVtLnJlbGF0aW9uc2hpcHMpIHtcbiAgICAgICAgdGhpc0l0ZW0ucmVsYXRpb25zaGlwcyA9IHt9O1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzSXRlbS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdKSB7XG4gICAgICAgIHRoaXNJdGVtLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0gPSBbXTtcbiAgICAgIH1cbiAgICAgIGlmICghb3RoZXJJdGVtLnJlbGF0aW9uc2hpcHMpIHtcbiAgICAgICAgb3RoZXJJdGVtLnJlbGF0aW9uc2hpcHMgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmICghb3RoZXJJdGVtLnJlbGF0aW9uc2hpcHNbb3RoZXJSZWxOYW1lXSkge1xuICAgICAgICBvdGhlckl0ZW0ucmVsYXRpb25zaGlwc1tvdGhlclJlbE5hbWVdID0gW107XG4gICAgICB9XG4gICAgICBpZiAocmVsU2NoZW1hLmV4dHJhcyAmJiBjaGlsZC5tZXRhKSB7XG4gICAgICAgIG5ld1BhcmVudC5tZXRhID0ge307XG4gICAgICAgIG5ld0NoaWxkLm1ldGEgPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCBleHRyYSBpbiBjaGlsZC5tZXRhKSB7XG4gICAgICAgICAgaWYgKGV4dHJhIGluIHJlbFNjaGVtYS5leHRyYXMpIHtcbiAgICAgICAgICAgIG5ld0NoaWxkLm1ldGFbZXh0cmFdID0gY2hpbGQubWV0YVtleHRyYV07XG4gICAgICAgICAgICBuZXdQYXJlbnQubWV0YVtleHRyYV0gPSBjaGlsZC5tZXRhW2V4dHJhXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdGhpc0lkeCA9IHRoaXNJdGVtLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0uZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gY2hpbGQuaWQpO1xuICAgICAgY29uc3Qgb3RoZXJJZHggPSBvdGhlckl0ZW0ucmVsYXRpb25zaGlwc1tvdGhlclJlbE5hbWVdLmZpbmRJbmRleChpdGVtID0+IGl0ZW0uaWQgPT09IHZhbHVlLmlkKTtcbiAgICAgIGlmICh0aGlzSWR4IDwgMCkge1xuICAgICAgICB0aGlzSXRlbS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnB1c2gobmV3Q2hpbGQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpc0l0ZW0ucmVsYXRpb25zaGlwc1tyZWxOYW1lXVt0aGlzSWR4XSA9IG5ld0NoaWxkO1xuICAgICAgfVxuICAgICAgaWYgKG90aGVySWR4IDwgMCkge1xuICAgICAgICBvdGhlckl0ZW0ucmVsYXRpb25zaGlwc1tvdGhlclJlbE5hbWVdLnB1c2gobmV3UGFyZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG90aGVySXRlbS5yZWxhdGlvbnNoaXBzW290aGVyUmVsTmFtZV1bb3RoZXJJZHhdID0gbmV3UGFyZW50O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgICB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodGhpc0l0ZW0pLCB0aGlzSXRlbSksXG4gICAgICAgIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyhvdGhlckl0ZW0pLCBvdGhlckl0ZW0pLFxuICAgICAgXSkudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMuZmlyZVdyaXRlVXBkYXRlKE9iamVjdC5hc3NpZ24odGhpc0l0ZW0sIHsgaW52YWxpZGF0ZTogW2ByZWxhdGlvbnNoaXBzLiR7cmVsTmFtZX1gXSB9KSk7XG4gICAgICAgIHRoaXMuZmlyZVdyaXRlVXBkYXRlKE9iamVjdC5hc3NpZ24ob3RoZXJJdGVtLCB7IGludmFsaWRhdGU6IFtgcmVsYXRpb25zaGlwcy4ke290aGVyUmVsTmFtZX1gXSB9KSk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4gdGhpc0l0ZW0pO1xuICAgIH0pO1xuICB9XG5cbiAgZGVsZXRlUmVsYXRpb25zaGlwSXRlbSh2YWx1ZTogTW9kZWxSZWZlcmVuY2UsIHJlbE5hbWU6IHN0cmluZywgY2hpbGQ6IFJlbGF0aW9uc2hpcEl0ZW0pIHtcbiAgICBjb25zdCBzY2hlbWEgPSB0aGlzLmdldFNjaGVtYSh2YWx1ZS50eXBlKTtcbiAgICBjb25zdCByZWxTY2hlbWEgPSBzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxOYW1lXS50eXBlO1xuICAgIGNvbnN0IG90aGVyUmVsVHlwZSA9IHJlbFNjaGVtYS5zaWRlc1tyZWxOYW1lXS5vdGhlclR5cGU7XG4gICAgY29uc3Qgb3RoZXJSZWxOYW1lID0gcmVsU2NoZW1hLnNpZGVzW3JlbE5hbWVdLm90aGVyTmFtZTtcbiAgICBjb25zdCB0aGlzS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcodmFsdWUpO1xuICAgIGNvbnN0IG90aGVyS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcoeyB0eXBlOiBvdGhlclJlbFR5cGUsIGlkOiBjaGlsZC5pZCB9KTtcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgdGhpcy5fZ2V0KHRoaXNLZXlTdHJpbmcpLFxuICAgICAgdGhpcy5fZ2V0KG90aGVyS2V5U3RyaW5nKSxcbiAgICBdKVxuICAgIC50aGVuKChbdGhpc0l0ZW0sIG90aGVySXRlbV0pID0+IHtcbiAgICAgIGlmICghdGhpc0l0ZW0ucmVsYXRpb25zaGlwc1tyZWxOYW1lXSkge1xuICAgICAgICB0aGlzSXRlbS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdID0gW107XG4gICAgICB9XG4gICAgICBpZiAoIW90aGVySXRlbS5yZWxhdGlvbnNoaXBzW290aGVyUmVsTmFtZV0pIHtcbiAgICAgICAgb3RoZXJJdGVtLnJlbGF0aW9uc2hpcHNbb3RoZXJSZWxOYW1lXSA9IFtdO1xuICAgICAgfVxuICAgICAgY29uc3QgdGhpc0lkeCA9IHRoaXNJdGVtLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0uZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gY2hpbGQuaWQpO1xuICAgICAgY29uc3Qgb3RoZXJJZHggPSBvdGhlckl0ZW0ucmVsYXRpb25zaGlwc1tvdGhlclJlbE5hbWVdLmZpbmRJbmRleChpdGVtID0+IGl0ZW0uaWQgPT09IHZhbHVlLmlkKTtcbiAgICAgIGlmICh0aGlzSWR4ID49IDApIHtcbiAgICAgICAgdGhpc0l0ZW0ucmVsYXRpb25zaGlwc1tyZWxOYW1lXS5zcGxpY2UodGhpc0lkeCwgMSk7XG4gICAgICB9XG4gICAgICBpZiAob3RoZXJJZHggPj0gMCkge1xuICAgICAgICBvdGhlckl0ZW0ucmVsYXRpb25zaGlwc1tvdGhlclJlbE5hbWVdLnNwbGljZShvdGhlcklkeCwgMSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICAgIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyh0aGlzSXRlbSksIHRoaXNJdGVtKSxcbiAgICAgICAgdGhpcy5fc2V0KHRoaXMua2V5U3RyaW5nKG90aGVySXRlbSksIG90aGVySXRlbSksXG4gICAgICBdKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5maXJlV3JpdGVVcGRhdGUoT2JqZWN0LmFzc2lnbih0aGlzSXRlbSwgeyBpbnZhbGlkYXRlOiBbYHJlbGF0aW9uc2hpcHMuJHtyZWxOYW1lfWBdIH0pKTtcbiAgICAgICAgdGhpcy5maXJlV3JpdGVVcGRhdGUoT2JqZWN0LmFzc2lnbihvdGhlckl0ZW0sIHsgaW52YWxpZGF0ZTogW2ByZWxhdGlvbnNoaXBzLiR7b3RoZXJSZWxOYW1lfWBdIH0pKTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiB0aGlzSXRlbSk7XG4gICAgfSk7XG4gIH1cblxuICBxdWVyeSh0OiBzdHJpbmcpOiBQcm9taXNlPE1vZGVsUmVmZXJlbmNlW10+IHtcbiAgICByZXR1cm4gdGhpcy5fa2V5cyh0KVxuICAgIC50aGVuKChrZXlzKSA9PiB7XG4gICAgICByZXR1cm4ga2V5cy5tYXAoayA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogdCxcbiAgICAgICAgICBpZDogcGFyc2VJbnQoay5zcGxpdCgnOicpWzFdLCAxMCksXG4gICAgICAgIH07XG4gICAgICB9KS5maWx0ZXIodiA9PiAhaXNOYU4odi5pZCkpO1xuICAgIH0pO1xuICB9XG5cbiAgYWRkU2NoZW1hKHQ6IHt0eXBlOiBzdHJpbmcsIHNjaGVtYTogTW9kZWxTY2hlbWF9KSB7XG4gICAgcmV0dXJuIHN1cGVyLmFkZFNjaGVtYSh0KVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMubWF4S2V5c1t0LnR5cGVdID0gMDtcbiAgICB9KTtcbiAgfVxuXG4gIGtleVN0cmluZyh2YWx1ZTogTW9kZWxSZWZlcmVuY2UpIHtcbiAgICByZXR1cm4gYCR7dmFsdWUudHlwZX06JHt2YWx1ZS5pZH1gO1xuICB9XG59XG4iXX0=
