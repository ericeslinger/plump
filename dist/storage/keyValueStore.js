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
            var newChild = { id: child.id };
            var newParent = { id: value.id };
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zdG9yYWdlL2tleVZhbHVlU3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsNENBQThDO0FBRTlDLHFDQUFvQztBQVlwQyxvQkFBb0IsQ0FBQztJQUNuQixNQUFNLENBQUMsQ0FDTCxPQUFPLENBQUMsS0FBSyxRQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQ3hFLENBQUM7QUFDSixDQUFDO0FBSUQ7SUFBNEMsaUNBQU87SUFBbkQ7UUFBQSxxRUEyVkM7UUF6VkMsYUFBTyxHQUErQixFQUFFLENBQUM7O0lBeVYzQyxDQUFDO0lBbFZDLGtDQUFVLEdBQVYsVUFBVyxJQUFZO1FBQ3JCLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRCx1Q0FBZSxHQUFmLFVBQWdCLFVBQStCO1FBQS9DLGlCQThDQztRQTdDQyxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzdDLE9BQU8sS0FBSyxDQUFDLGFBQWEsQ0FBQztRQUUzQixNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTthQUNyQixJQUFJLENBQUM7WUFDSixJQUFNLFdBQVcsR0FBRyxLQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUM7WUFDaEUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxTQUFTLElBQUksS0FBSyxDQUFDLEVBQUUsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNo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LE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzNCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELGlDQUFTLEdBQVQsVUFBVSxLQUFxQjtRQUM3QixNQUFNLENBQUksS0FBSyxDQUFDLElBQUksU0FBSSxLQUFLLENBQUMsRUFBSSxDQUFDO0lBQ3JDLENBQUM7SUFDSCxvQkFBQztBQUFELENBM1ZBLEFBMlZDLENBM1YyQyxpQkFBTyxHQTJWbEQ7QUEzVnFCLHNDQUFhIiwiZmlsZSI6InN0b3JhZ2Uva2V5VmFsdWVTdG9yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcblxuaW1wb3J0IHsgU3RvcmFnZSB9IGZyb20gJy4vc3RvcmFnZSc7XG5pbXBvcnQge1xuICBJbmRlZmluaXRlTW9kZWxEYXRhLFxuICBNb2RlbERhdGEsXG4gIE1vZGVsUmVmZXJlbmNlLFxuICBNb2RlbFNjaGVtYSxcbiAgUmVsYXRpb25zaGlwSXRlbSxcbiAgVGVybWluYWxTdG9yZSxcbiAgQ2FjaGVTdG9yZSxcbiAgQWxsb2NhdGluZ1N0b3JlLFxufSBmcm9tICcuLi9kYXRhVHlwZXMnO1xuXG5mdW5jdGlvbiBzYW5lTnVtYmVyKGkpIHtcbiAgcmV0dXJuIChcbiAgICB0eXBlb2YgaSA9PT0gJ251bWJlcicgJiYgIWlzTmFOKGkpICYmIGkgIT09IEluZmluaXR5ICYmIGkgIT09IC1JbmZpbml0eVxuICApO1xufVxuXG4vLyBkZWNsYXJlIGZ1bmN0aW9uIHBhcnNlSW50KG46IHN0cmluZyB8IG51bWJlciwgcmFkaXg6IG51bWJlcik6IG51bWJlcjtcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEtleVZhbHVlU3RvcmUgZXh0ZW5kcyBTdG9yYWdlXG4gIGltcGxlbWVudHMgVGVybWluYWxTdG9yZSwgQ2FjaGVTdG9yZSwgQWxsb2NhdGluZ1N0b3JlIHtcbiAgbWF4S2V5czogeyBbdHlwZTogc3RyaW5nXTogbnVtYmVyIH0gPSB7fTtcblxuICBhYnN0cmFjdCBfa2V5cyh0eXBlOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPjtcbiAgYWJzdHJhY3QgX2dldChrOiBzdHJpbmcpOiBQcm9taXNlPE1vZGVsRGF0YSB8IG51bGw+O1xuICBhYnN0cmFjdCBfc2V0KGs6IHN0cmluZywgdjogTW9kZWxEYXRhKTogUHJvbWlzZTxNb2RlbERhdGE+O1xuICBhYnN0cmFjdCBfZGVsKGs6IHN0cmluZyk6IFByb21pc2U8TW9kZWxEYXRhPjtcblxuICBhbGxvY2F0ZUlkKHR5cGU6IHN0cmluZykge1xuICAgIHRoaXMubWF4S2V5c1t0eXBlXSA9IHRoaXMubWF4S2V5c1t0eXBlXSArIDE7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLm1heEtleXNbdHlwZV0pO1xuICB9XG5cbiAgd3JpdGVBdHRyaWJ1dGVzKGlucHV0VmFsdWU6IEluZGVmaW5pdGVNb2RlbERhdGEpIHtcbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMudmFsaWRhdGVJbnB1dChpbnB1dFZhbHVlKTtcbiAgICBkZWxldGUgdmFsdWUucmVsYXRpb25zaGlwcztcbiAgICAvLyB0cmltIG91dCByZWxhdGlvbnNoaXBzIGZvciBhIGRpcmVjdCB3cml0ZS5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3QgaWRBdHRyaWJ1dGUgPSB0aGlzLmdldFNjaGVtYShpbnB1dFZhbHVlLnR5cGUpLmlkQXR0cmlidXRlO1xuICAgICAgICBpZiAodmFsdWUuaWQgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZS5pZCA9PT0gbnVsbCkge1xuICAgICAgICAgIGlmICghdGhpcy50ZXJtaW5hbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAnQ2Fubm90IGNyZWF0ZSBuZXcgY29udGVudCBpbiBhIG5vbi10ZXJtaW5hbCBzdG9yZScsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGhpcy5hbGxvY2F0ZUlkKHZhbHVlLnR5cGUpLnRoZW4obiA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VPcHRpb25zKHt9LCB2YWx1ZSwge1xuICAgICAgICAgICAgICBpZDogbixcbiAgICAgICAgICAgICAgcmVsYXRpb25zaGlwczoge30sXG4gICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHsgW2lkQXR0cmlidXRlXTogbiB9LFxuICAgICAgICAgICAgfSkgYXMgTW9kZWxEYXRhOyAvLyBpZiBuZXcuXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gaWYgbm90IG5ldywgZ2V0IGN1cnJlbnQgKGluY2x1ZGluZyByZWxhdGlvbnNoaXBzKSBhbmQgbWVyZ2VcbiAgICAgICAgICBjb25zdCB0aGlzSWQgPVxuICAgICAgICAgICAgdHlwZW9mIHZhbHVlLmlkID09PSAnc3RyaW5nJyA/IHBhcnNlSW50KHZhbHVlLmlkLCAxMCkgOiB2YWx1ZS5pZDtcbiAgICAgICAgICBpZiAoc2FuZU51bWJlcih0aGlzSWQpICYmIHRoaXNJZCA+IHRoaXMubWF4S2V5c1t2YWx1ZS50eXBlXSkge1xuICAgICAgICAgICAgdGhpcy5tYXhLZXlzW3ZhbHVlLnR5cGVdID0gdGhpc0lkO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGhpcy5fZ2V0KFxuICAgICAgICAgICAgdGhpcy5rZXlTdHJpbmcodmFsdWUgYXMgTW9kZWxSZWZlcmVuY2UpLFxuICAgICAgICAgICkudGhlbihjdXJyZW50ID0+IHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50KSB7XG4gICAgICAgICAgICAgIHJldHVybiBtZXJnZU9wdGlvbnMoe30sIGN1cnJlbnQsIHZhbHVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBtZXJnZU9wdGlvbnMoeyByZWxhdGlvbnNoaXBzOiB7fSwgYXR0cmlidXRlczoge30gfSwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnRoZW4oKHRvU2F2ZTogTW9kZWxEYXRhKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodG9TYXZlKSwgdG9TYXZlKS50aGVuKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpcmVXcml0ZVVwZGF0ZShcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oe30sIHRvU2F2ZSwgeyBpbnZhbGlkYXRlOiBbJ2F0dHJpYnV0ZXMnXSB9KSxcbiAgICAgICAgICApO1xuICAgICAgICAgIHJldHVybiB0b1NhdmU7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gIH1cblxuICByZWFkQXR0cmlidXRlcyh2YWx1ZTogTW9kZWxSZWZlcmVuY2UpOiBQcm9taXNlPE1vZGVsRGF0YT4ge1xuICAgIHJldHVybiB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodmFsdWUpKS50aGVuKGQgPT4ge1xuICAgICAgaWYgKGQgJiYgZC5hdHRyaWJ1dGVzICYmIE9iamVjdC5rZXlzKGQuYXR0cmlidXRlcykubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgY2FjaGUodmFsdWU6IE1vZGVsRGF0YSkge1xuICAgIGlmICh2YWx1ZS5pZCA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlLmlkID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXG4gICAgICAgICdDYW5ub3QgY2FjaGUgZGF0YSB3aXRob3V0IGFuIGlkIC0gd3JpdGUgaXQgdG8gYSB0ZXJtaW5hbCBmaXJzdCcsXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHZhbHVlKSkudGhlbihjdXJyZW50ID0+IHtcbiAgICAgICAgY29uc3QgbmV3VmFsID0gbWVyZ2VPcHRpb25zKGN1cnJlbnQgfHwge30sIHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyh2YWx1ZSksIG5ld1ZhbCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBjYWNoZUF0dHJpYnV0ZXModmFsdWU6IE1vZGVsRGF0YSkge1xuICAgIGlmICh2YWx1ZS5pZCA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlLmlkID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXG4gICAgICAgICdDYW5ub3QgY2FjaGUgZGF0YSB3aXRob3V0IGFuIGlkIC0gd3JpdGUgaXQgdG8gYSB0ZXJtaW5hbCBmaXJzdCcsXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHZhbHVlKSkudGhlbihjdXJyZW50ID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyh2YWx1ZSksIHtcbiAgICAgICAgICB0eXBlOiB2YWx1ZS50eXBlLFxuICAgICAgICAgIGlkOiB2YWx1ZS5pZCxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiB2YWx1ZS5hdHRyaWJ1dGVzLFxuICAgICAgICAgIHJlbGF0aW9uc2hpcHM6IGN1cnJlbnQucmVsYXRpb25zaGlwcyB8fCB7fSxcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBjYWNoZVJlbGF0aW9uc2hpcCh2YWx1ZTogTW9kZWxEYXRhKSB7XG4gICAgaWYgKHZhbHVlLmlkID09PSB1bmRlZmluZWQgfHwgdmFsdWUuaWQgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcbiAgICAgICAgJ0Nhbm5vdCBjYWNoZSBkYXRhIHdpdGhvdXQgYW4gaWQgLSB3cml0ZSBpdCB0byBhIHRlcm1pbmFsIGZpcnN0JyxcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodmFsdWUpKS50aGVuKGN1cnJlbnQgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2V0KHRoaXMua2V5U3RyaW5nKHZhbHVlKSwge1xuICAgICAgICAgIHR5cGU6IHZhbHVlLnR5cGUsXG4gICAgICAgICAgaWQ6IHZhbHVlLmlkLFxuICAgICAgICAgIGF0dHJpYnV0ZXM6IGN1cnJlbnQuYXR0cmlidXRlcyB8fCB7fSxcbiAgICAgICAgICByZWxhdGlvbnNoaXBzOiB2YWx1ZS5yZWxhdGlvbnNoaXBzLFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJlYWRSZWxhdGlvbnNoaXAodmFsdWU6IE1vZGVsUmVmZXJlbmNlLCByZWxOYW1lOiBzdHJpbmcpOiBQcm9taXNlPE1vZGVsRGF0YT4ge1xuICAgIHJldHVybiB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodmFsdWUpKS50aGVuKHYgPT4ge1xuICAgICAgY29uc3QgcmV0VmFsID0gT2JqZWN0LmFzc2lnbih7fSwgdik7XG4gICAgICBpZiAoIXYpIHtcbiAgICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogdmFsdWUudHlwZSxcbiAgICAgICAgICAgIGlkOiB2YWx1ZS5pZCxcbiAgICAgICAgICAgIHJlbGF0aW9uc2hpcHM6IHsgW3JlbE5hbWVdOiBbXSB9LFxuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoIXYucmVsYXRpb25zaGlwcyAmJiB0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgIHJldFZhbC5yZWxhdGlvbnNoaXBzID0geyBbcmVsTmFtZV06IFtdIH07XG4gICAgICB9IGVsc2UgaWYgKCFyZXRWYWwucmVsYXRpb25zaGlwc1tyZWxOYW1lXSAmJiB0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgIHJldFZhbC5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdID0gW107XG4gICAgICB9XG4gICAgICByZXR1cm4gcmV0VmFsO1xuICAgIH0pO1xuICB9XG5cbiAgZGVsZXRlKHZhbHVlOiBNb2RlbFJlZmVyZW5jZSkge1xuICAgIHJldHVybiB0aGlzLl9kZWwodGhpcy5rZXlTdHJpbmcodmFsdWUpKS50aGVuKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgIHRoaXMuZmlyZVdyaXRlVXBkYXRlKHtcbiAgICAgICAgICBpZDogdmFsdWUuaWQsXG4gICAgICAgICAgdHlwZTogdmFsdWUudHlwZSxcbiAgICAgICAgICBpbnZhbGlkYXRlOiBbJ2F0dHJpYnV0ZXMnLCAncmVsYXRpb25zaGlwcyddLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHdpcGUodmFsdWU6IE1vZGVsUmVmZXJlbmNlLCBmaWVsZDogc3RyaW5nKSB7XG4gICAgY29uc3Qga3MgPSB0aGlzLmtleVN0cmluZyh2YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXMuX2dldChrcykudGhlbih2YWwgPT4ge1xuICAgICAgaWYgKHZhbCA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG5ld1ZhbCA9IE9iamVjdC5hc3NpZ24oe30sIHZhbCk7XG4gICAgICBpZiAoZmllbGQgPT09ICdhdHRyaWJ1dGVzJykge1xuICAgICAgICBkZWxldGUgbmV3VmFsLmF0dHJpYnV0ZXM7XG4gICAgICB9IGVsc2UgaWYgKGZpZWxkID09PSAncmVsYXRpb25zaGlwcycpIHtcbiAgICAgICAgZGVsZXRlIG5ld1ZhbC5yZWxhdGlvbnNoaXBzO1xuICAgICAgfSBlbHNlIGlmIChmaWVsZC5pbmRleE9mKCdyZWxhdGlvbnNoaXBzLicpID09PSAwKSB7XG4gICAgICAgIGRlbGV0ZSBuZXdWYWwucmVsYXRpb25zaGlwc1tmaWVsZC5zcGxpdCgnLicpWzFdXTtcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKG5ld1ZhbC5yZWxhdGlvbnNoaXBzKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBkZWxldGUgbmV3VmFsLnJlbGF0aW9uc2hpcHM7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGRlbGV0ZSBmaWVsZCAke2ZpZWxkfSAtIHVua25vd24gZm9ybWF0YCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fc2V0KGtzLCBuZXdWYWwpO1xuICAgIH0pO1xuICB9XG5cbiAgd3JpdGVSZWxhdGlvbnNoaXBJdGVtKFxuICAgIHZhbHVlOiBNb2RlbFJlZmVyZW5jZSxcbiAgICByZWxOYW1lOiBzdHJpbmcsXG4gICAgY2hpbGQ6IFJlbGF0aW9uc2hpcEl0ZW0sXG4gICkge1xuICAgIGNvbnN0IHNjaGVtYSA9IHRoaXMuZ2V0U2NoZW1hKHZhbHVlLnR5cGUpO1xuICAgIGNvbnN0IHJlbFNjaGVtYSA9IHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnR5cGU7XG4gICAgY29uc3Qgb3RoZXJSZWxUeXBlID0gcmVsU2NoZW1hLnNpZGVzW3JlbE5hbWVdLm90aGVyVHlwZTtcbiAgICBjb25zdCBvdGhlclJlbE5hbWUgPSByZWxTY2hlbWEuc2lkZXNbcmVsTmFtZV0ub3RoZXJOYW1lO1xuICAgIGNvbnN0IHRoaXNLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyh2YWx1ZSk7XG4gICAgY29uc3Qgb3RoZXJLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyh7IHR5cGU6IG90aGVyUmVsVHlwZSwgaWQ6IGNoaWxkLmlkIH0pO1xuICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICB0aGlzLl9nZXQodGhpc0tleVN0cmluZyksXG4gICAgICB0aGlzLl9nZXQob3RoZXJLZXlTdHJpbmcpLFxuICAgIF0pLnRoZW4oKFt0aGlzSXRlbVJlc29sdmVkLCBvdGhlckl0ZW1SZXNvbHZlZF0pID0+IHtcbiAgICAgIGxldCB0aGlzSXRlbSA9IHRoaXNJdGVtUmVzb2x2ZWQ7XG4gICAgICBpZiAoIXRoaXNJdGVtKSB7XG4gICAgICAgIHRoaXNJdGVtID0ge1xuICAgICAgICAgIGlkOiBjaGlsZC5pZCxcbiAgICAgICAgICB0eXBlOiBvdGhlclJlbFR5cGUsXG4gICAgICAgICAgYXR0cmlidXRlczoge30sXG4gICAgICAgICAgcmVsYXRpb25zaGlwczoge30sXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBsZXQgb3RoZXJJdGVtID0gb3RoZXJJdGVtUmVzb2x2ZWQ7XG4gICAgICBpZiAoIW90aGVySXRlbSkge1xuICAgICAgICBvdGhlckl0ZW0gPSB7XG4gICAgICAgICAgaWQ6IGNoaWxkLmlkLFxuICAgICAgICAgIHR5cGU6IG90aGVyUmVsVHlwZSxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiB7fSxcbiAgICAgICAgICByZWxhdGlvbnNoaXBzOiB7fSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG5ld0NoaWxkOiBSZWxhdGlvbnNoaXBJdGVtID0geyBpZDogY2hpbGQuaWQgfTtcbiAgICAgIGNvbnN0IG5ld1BhcmVudDogUmVsYXRpb25zaGlwSXRlbSA9IHsgaWQ6IHZhbHVlLmlkIH07XG4gICAgICBpZiAoIXRoaXNJdGVtLnJlbGF0aW9uc2hpcHMpIHtcbiAgICAgICAgdGhpc0l0ZW0ucmVsYXRpb25zaGlwcyA9IHt9O1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzSXRlbS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdKSB7XG4gICAgICAgIHRoaXNJdGVtLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0gPSBbXTtcbiAgICAgIH1cbiAgICAgIGlmICghb3RoZXJJdGVtLnJlbGF0aW9uc2hpcHMpIHtcbiAgICAgICAgb3RoZXJJdGVtLnJlbGF0aW9uc2hpcHMgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmICghb3RoZXJJdGVtLnJlbGF0aW9uc2hpcHNbb3RoZXJSZWxOYW1lXSkge1xuICAgICAgICBvdGhlckl0ZW0ucmVsYXRpb25zaGlwc1tvdGhlclJlbE5hbWVdID0gW107XG4gICAgICB9XG4gICAgICBpZiAocmVsU2NoZW1hLmV4dHJhcyAmJiBjaGlsZC5tZXRhKSB7XG4gICAgICAgIG5ld1BhcmVudC5tZXRhID0ge307XG4gICAgICAgIG5ld0NoaWxkLm1ldGEgPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCBleHRyYSBpbiBjaGlsZC5tZXRhKSB7XG4gICAgICAgICAgaWYgKGV4dHJhIGluIHJlbFNjaGVtYS5leHRyYXMpIHtcbiAgICAgICAgICAgIG5ld0NoaWxkLm1ldGFbZXh0cmFdID0gY2hpbGQubWV0YVtleHRyYV07XG4gICAgICAgICAgICBuZXdQYXJlbnQubWV0YVtleHRyYV0gPSBjaGlsZC5tZXRhW2V4dHJhXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdGhpc0lkeCA9IHRoaXNJdGVtLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0uZmluZEluZGV4KFxuICAgICAgICBpdGVtID0+IGl0ZW0uaWQgPT09IGNoaWxkLmlkLFxuICAgICAgKTtcbiAgICAgIGNvbnN0IG90aGVySWR4ID0gb3RoZXJJdGVtLnJlbGF0aW9uc2hpcHNbb3RoZXJSZWxOYW1lXS5maW5kSW5kZXgoXG4gICAgICAgIGl0ZW0gPT4gaXRlbS5pZCA9PT0gdmFsdWUuaWQsXG4gICAgICApO1xuICAgICAgaWYgKHRoaXNJZHggPCAwKSB7XG4gICAgICAgIHRoaXNJdGVtLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0ucHVzaChuZXdDaGlsZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzSXRlbS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdW3RoaXNJZHhdID0gbmV3Q2hpbGQ7XG4gICAgICB9XG4gICAgICBpZiAob3RoZXJJZHggPCAwKSB7XG4gICAgICAgIG90aGVySXRlbS5yZWxhdGlvbnNoaXBzW290aGVyUmVsTmFtZV0ucHVzaChuZXdQYXJlbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3RoZXJJdGVtLnJlbGF0aW9uc2hpcHNbb3RoZXJSZWxOYW1lXVtvdGhlcklkeF0gPSBuZXdQYXJlbnQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICAgIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyh0aGlzSXRlbSksIHRoaXNJdGVtKSxcbiAgICAgICAgdGhpcy5fc2V0KHRoaXMua2V5U3RyaW5nKG90aGVySXRlbSksIG90aGVySXRlbSksXG4gICAgICBdKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgdGhpcy5maXJlV3JpdGVVcGRhdGUoXG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKHRoaXNJdGVtLCB7XG4gICAgICAgICAgICAgIGludmFsaWRhdGU6IFtgcmVsYXRpb25zaGlwcy4ke3JlbE5hbWV9YF0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMuZmlyZVdyaXRlVXBkYXRlKFxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihvdGhlckl0ZW0sIHtcbiAgICAgICAgICAgICAgaW52YWxpZGF0ZTogW2ByZWxhdGlvbnNoaXBzLiR7b3RoZXJSZWxOYW1lfWBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKTtcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKCkgPT4gdGhpc0l0ZW0pO1xuICAgIH0pO1xuICB9XG5cbiAgZGVsZXRlUmVsYXRpb25zaGlwSXRlbShcbiAgICB2YWx1ZTogTW9kZWxSZWZlcmVuY2UsXG4gICAgcmVsTmFtZTogc3RyaW5nLFxuICAgIGNoaWxkOiBSZWxhdGlvbnNoaXBJdGVtLFxuICApIHtcbiAgICBjb25zdCBzY2hlbWEgPSB0aGlzLmdldFNjaGVtYSh2YWx1ZS50eXBlKTtcbiAgICBjb25zdCByZWxTY2hlbWEgPSBzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxOYW1lXS50eXBlO1xuICAgIGNvbnN0IG90aGVyUmVsVHlwZSA9IHJlbFNjaGVtYS5zaWRlc1tyZWxOYW1lXS5vdGhlclR5cGU7XG4gICAgY29uc3Qgb3RoZXJSZWxOYW1lID0gcmVsU2NoZW1hLnNpZGVzW3JlbE5hbWVdLm90aGVyTmFtZTtcbiAgICBjb25zdCB0aGlzS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcodmFsdWUpO1xuICAgIGNvbnN0IG90aGVyS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcoeyB0eXBlOiBvdGhlclJlbFR5cGUsIGlkOiBjaGlsZC5pZCB9KTtcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgdGhpcy5fZ2V0KHRoaXNLZXlTdHJpbmcpLFxuICAgICAgdGhpcy5fZ2V0KG90aGVyS2V5U3RyaW5nKSxcbiAgICBdKS50aGVuKChbdGhpc0l0ZW0sIG90aGVySXRlbV0pID0+IHtcbiAgICAgIGlmICghdGhpc0l0ZW0ucmVsYXRpb25zaGlwc1tyZWxOYW1lXSkge1xuICAgICAgICB0aGlzSXRlbS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdID0gW107XG4gICAgICB9XG4gICAgICBpZiAoIW90aGVySXRlbS5yZWxhdGlvbnNoaXBzW290aGVyUmVsTmFtZV0pIHtcbiAgICAgICAgb3RoZXJJdGVtLnJlbGF0aW9uc2hpcHNbb3RoZXJSZWxOYW1lXSA9IFtdO1xuICAgICAgfVxuICAgICAgY29uc3QgdGhpc0lkeCA9IHRoaXNJdGVtLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0uZmluZEluZGV4KFxuICAgICAgICBpdGVtID0+IGl0ZW0uaWQgPT09IGNoaWxkLmlkLFxuICAgICAgKTtcbiAgICAgIGNvbnN0IG90aGVySWR4ID0gb3RoZXJJdGVtLnJlbGF0aW9uc2hpcHNbb3RoZXJSZWxOYW1lXS5maW5kSW5kZXgoXG4gICAgICAgIGl0ZW0gPT4gaXRlbS5pZCA9PT0gdmFsdWUuaWQsXG4gICAgICApO1xuICAgICAgaWYgKHRoaXNJZHggPj0gMCkge1xuICAgICAgICB0aGlzSXRlbS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnNwbGljZSh0aGlzSWR4LCAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChvdGhlcklkeCA+PSAwKSB7XG4gICAgICAgIG90aGVySXRlbS5yZWxhdGlvbnNoaXBzW290aGVyUmVsTmFtZV0uc3BsaWNlKG90aGVySWR4LCAxKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFtcbiAgICAgICAgdGhpcy5fc2V0KHRoaXMua2V5U3RyaW5nKHRoaXNJdGVtKSwgdGhpc0l0ZW0pLFxuICAgICAgICB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcob3RoZXJJdGVtKSwgb3RoZXJJdGVtKSxcbiAgICAgIF0pXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmZpcmVXcml0ZVVwZGF0ZShcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24odGhpc0l0ZW0sIHtcbiAgICAgICAgICAgICAgaW52YWxpZGF0ZTogW2ByZWxhdGlvbnNoaXBzLiR7cmVsTmFtZX1gXSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5maXJlV3JpdGVVcGRhdGUoXG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKG90aGVySXRlbSwge1xuICAgICAgICAgICAgICBpbnZhbGlkYXRlOiBbYHJlbGF0aW9uc2hpcHMuJHtvdGhlclJlbE5hbWV9YF0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICApO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB0aGlzSXRlbSk7XG4gICAgfSk7XG4gIH1cblxuICBxdWVyeSh0OiBzdHJpbmcsIHE/OiBhbnkpOiBQcm9taXNlPE1vZGVsUmVmZXJlbmNlW10+IHtcbiAgICByZXR1cm4gdGhpcy5fa2V5cyh0KS50aGVuKGtleXMgPT4ge1xuICAgICAgcmV0dXJuIGtleXNcbiAgICAgICAgLm1hcChrID0+IHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogdCxcbiAgICAgICAgICAgIGlkOiBwYXJzZUludChrLnNwbGl0KCc6JylbMV0sIDEwKSxcbiAgICAgICAgICB9O1xuICAgICAgICB9KVxuICAgICAgICAuZmlsdGVyKHYgPT4gIWlzTmFOKHYuaWQpKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFkZFNjaGVtYSh0OiB7IHR5cGU6IHN0cmluZzsgc2NoZW1hOiBNb2RlbFNjaGVtYSB9KSB7XG4gICAgcmV0dXJuIHN1cGVyLmFkZFNjaGVtYSh0KS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMubWF4S2V5c1t0LnR5cGVdID0gMDtcbiAgICB9KTtcbiAgfVxuXG4gIGtleVN0cmluZyh2YWx1ZTogTW9kZWxSZWZlcmVuY2UpIHtcbiAgICByZXR1cm4gYCR7dmFsdWUudHlwZX06JHt2YWx1ZS5pZH1gO1xuICB9XG59XG4iXX0=
