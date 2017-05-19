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
    KeyValueStore.prototype.allocateId = function (typeName) {
        this.maxKeys[typeName] = this.maxKeys[typeName] + 1;
        return Promise.resolve(this.maxKeys[typeName]);
    };
    KeyValueStore.prototype.writeAttributes = function (inputValue) {
        var _this = this;
        var value = this.validateInput(inputValue);
        delete value.relationships;
        return Promise.resolve()
            .then(function () {
            var idAttribute = _this.getSchema(inputValue.typeName).idAttribute;
            if ((value.id === undefined) || (value.id === null)) {
                if (!_this.terminal) {
                    throw new Error('Cannot create new content in a non-terminal store');
                }
                return _this.allocateId(value.typeName)
                    .then(function (n) {
                    return mergeOptions({}, value, { id: n, relationships: {}, attributes: (_a = {}, _a[idAttribute] = n, _a) });
                    var _a;
                });
            }
            else {
                var thisId = typeof value.id === 'string' ? parseInt(value.id, 10) : value.id;
                if (saneNumber(thisId) && thisId > _this.maxKeys[value.typeName]) {
                    _this.maxKeys[value.typeName] = thisId;
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
                    typeName: value.typeName,
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
                    typeName: value.typeName,
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
                    return { typeName: value.typeName, id: value.id, relationships: (_a = {}, _a[relName] = [], _a) };
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
                _this.fireWriteUpdate({ id: value.id, typeName: value.typeName, invalidate: ['attributes', 'relationships'] });
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
        var schema = this.getSchema(value.typeName);
        var relSchema = schema.relationships[relName].type;
        var otherRelType = relSchema.sides[relName].otherType;
        var otherRelName = relSchema.sides[relName].otherName;
        var thisKeyString = this.keyString(value);
        var otherKeyString = this.keyString({ typeName: otherRelType, id: child.id });
        return Promise.all([
            this._get(thisKeyString),
            this._get(otherKeyString),
        ])
            .then(function (_a) {
            var thisItemResolved = _a[0], otherItemResolved = _a[1];
            var thisItem = thisItemResolved;
            if (!thisItem) {
                thisItem = {
                    id: child.id,
                    typeName: otherRelType,
                    attributes: {},
                    relationships: {},
                };
            }
            var otherItem = otherItemResolved;
            if (!otherItem) {
                otherItem = {
                    id: child.id,
                    typeName: otherRelType,
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
        var schema = this.getSchema(value.typeName);
        var relSchema = schema.relationships[relName].type;
        var otherRelType = relSchema.sides[relName].otherType;
        var otherRelName = relSchema.sides[relName].otherName;
        var thisKeyString = this.keyString(value);
        var otherKeyString = this.keyString({ typeName: otherRelType, id: child.id });
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
                    typeName: t,
                    id: parseInt(k.split(':')[1], 10),
                };
            }).filter(function (v) { return !isNaN(v.id); });
        });
    };
    KeyValueStore.prototype.addSchema = function (t) {
        var _this = this;
        return _super.prototype.addSchema.call(this, t)
            .then(function () {
            _this.maxKeys[t.typeName] = 0;
        });
    };
    KeyValueStore.prototype.keyString = function (value) {
        return value.typeName + ":" + value.id;
    };
    return KeyValueStore;
}(storage_1.Storage));
exports.KeyValueStore = KeyValueStore;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zdG9yYWdlL2tleVZhbHVlU3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsNENBQThDO0FBRTlDLHFDQUFvQztBQVlwQyxvQkFBb0IsQ0FBQztJQUNuQixNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDM0YsQ0FBQztBQUlEO0lBQTRDLGlDQUFPO0lBQW5EO1FBQUEscUVBcVNDO1FBcFNDLGFBQU8sR0FBbUMsRUFBRSxDQUFDOztJQW9TL0MsQ0FBQztJQTdSQyxrQ0FBVSxHQUFWLFVBQVcsUUFBZ0I7UUFDekIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNwRCxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVELHVDQUFlLEdBQWYsVUFBZ0IsVUFBK0I7UUFBL0MsaUJBc0NDO1FBckNDLElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDN0MsT0FBTyxLQUFLLENBQUMsYUFBYSxDQUFDO1FBRTNCLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFO2FBQ3ZCLElBQUksQ0FBQztZQUNKLElBQU0sV0FBVyxHQUFHLEtBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsQ0FBQztZQUNwRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssU0FBUyxDQUFD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QUFJLEtBQUssQ0FBQyxFQUFJLENBQUM7SUFDekMsQ0FBQztJQUNILG9CQUFDO0FBQUQsQ0FyU0EsQUFxU0MsQ0FyUzJDLGlCQUFPLEdBcVNsRDtBQXJTcUIsc0NBQWEiLCJmaWxlIjoic3RvcmFnZS9rZXlWYWx1ZVN0b3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgbWVyZ2VPcHRpb25zIGZyb20gJ21lcmdlLW9wdGlvbnMnO1xuXG5pbXBvcnQgeyBTdG9yYWdlIH0gZnJvbSAnLi9zdG9yYWdlJztcbmltcG9ydCB7XG4gIEluZGVmaW5pdGVNb2RlbERhdGEsXG4gIE1vZGVsRGF0YSxcbiAgTW9kZWxSZWZlcmVuY2UsXG4gIE1vZGVsU2NoZW1hLFxuICBSZWxhdGlvbnNoaXBJdGVtLFxuICBUZXJtaW5hbFN0b3JlLFxuICBDYWNoZVN0b3JlLFxuICBBbGxvY2F0aW5nU3RvcmVcbn0gZnJvbSAnLi4vZGF0YVR5cGVzJztcblxuZnVuY3Rpb24gc2FuZU51bWJlcihpKSB7XG4gIHJldHVybiAoKHR5cGVvZiBpID09PSAnbnVtYmVyJykgJiYgKCFpc05hTihpKSkgJiYgKGkgIT09IEluZmluaXR5KSAmJiAoaSAhPT0gLUluZmluaXR5KSk7XG59XG5cbi8vIGRlY2xhcmUgZnVuY3Rpb24gcGFyc2VJbnQobjogc3RyaW5nIHwgbnVtYmVyLCByYWRpeDogbnVtYmVyKTogbnVtYmVyO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgS2V5VmFsdWVTdG9yZSBleHRlbmRzIFN0b3JhZ2UgaW1wbGVtZW50cyBUZXJtaW5hbFN0b3JlLCBDYWNoZVN0b3JlLCBBbGxvY2F0aW5nU3RvcmUge1xuICBtYXhLZXlzOiB7IFt0eXBlTmFtZTogc3RyaW5nXTogbnVtYmVyIH0gPSB7fTtcblxuICBhYnN0cmFjdCBfa2V5cyh0eXBlTmFtZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT47XG4gIGFic3RyYWN0IF9nZXQoazogc3RyaW5nKTogUHJvbWlzZTxNb2RlbERhdGEgfCBudWxsPjtcbiAgYWJzdHJhY3QgX3NldChrOiBzdHJpbmcsIHY6IE1vZGVsRGF0YSk6IFByb21pc2U8TW9kZWxEYXRhPjtcbiAgYWJzdHJhY3QgX2RlbChrOiBzdHJpbmcpOiBQcm9taXNlPE1vZGVsRGF0YT47XG5cbiAgYWxsb2NhdGVJZCh0eXBlTmFtZTogc3RyaW5nKSB7XG4gICAgdGhpcy5tYXhLZXlzW3R5cGVOYW1lXSA9IHRoaXMubWF4S2V5c1t0eXBlTmFtZV0gKyAxO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5tYXhLZXlzW3R5cGVOYW1lXSk7XG4gIH1cblxuICB3cml0ZUF0dHJpYnV0ZXMoaW5wdXRWYWx1ZTogSW5kZWZpbml0ZU1vZGVsRGF0YSkge1xuICAgIGNvbnN0IHZhbHVlID0gdGhpcy52YWxpZGF0ZUlucHV0KGlucHV0VmFsdWUpO1xuICAgIGRlbGV0ZSB2YWx1ZS5yZWxhdGlvbnNoaXBzO1xuICAgIC8vIHRyaW0gb3V0IHJlbGF0aW9uc2hpcHMgZm9yIGEgZGlyZWN0IHdyaXRlLlxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IGlkQXR0cmlidXRlID0gdGhpcy5nZXRTY2hlbWEoaW5wdXRWYWx1ZS50eXBlTmFtZSkuaWRBdHRyaWJ1dGU7XG4gICAgICBpZiAoKHZhbHVlLmlkID09PSB1bmRlZmluZWQpIHx8ICh2YWx1ZS5pZCA9PT0gbnVsbCkpIHtcbiAgICAgICAgaWYgKCF0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIG5ldyBjb250ZW50IGluIGEgbm9uLXRlcm1pbmFsIHN0b3JlJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuYWxsb2NhdGVJZCh2YWx1ZS50eXBlTmFtZSlcbiAgICAgICAgLnRoZW4oKG4pID0+IHtcbiAgICAgICAgICByZXR1cm4gbWVyZ2VPcHRpb25zKHt9LCB2YWx1ZSwgeyBpZDogbiwgcmVsYXRpb25zaGlwczoge30sIGF0dHJpYnV0ZXM6IHtbaWRBdHRyaWJ1dGVdOiBuIH0gfSkgYXMgTW9kZWxEYXRhOyAvLyBpZiBuZXcuXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gaWYgbm90IG5ldywgZ2V0IGN1cnJlbnQgKGluY2x1ZGluZyByZWxhdGlvbnNoaXBzKSBhbmQgbWVyZ2VcbiAgICAgICAgY29uc3QgdGhpc0lkID0gdHlwZW9mIHZhbHVlLmlkID09PSAnc3RyaW5nJyA/IHBhcnNlSW50KHZhbHVlLmlkLCAxMCkgOiB2YWx1ZS5pZDtcbiAgICAgICAgaWYgKHNhbmVOdW1iZXIodGhpc0lkKSAmJiB0aGlzSWQgPiB0aGlzLm1heEtleXNbdmFsdWUudHlwZU5hbWVdKSB7XG4gICAgICAgICAgdGhpcy5tYXhLZXlzW3ZhbHVlLnR5cGVOYW1lXSA9IHRoaXNJZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHZhbHVlIGFzIE1vZGVsUmVmZXJlbmNlKSlcbiAgICAgICAgLnRoZW4oY3VycmVudCA9PiAge1xuICAgICAgICAgIGlmIChjdXJyZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VPcHRpb25zKHt9LCBjdXJyZW50LCB2YWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBtZXJnZU9wdGlvbnMoeyByZWxhdGlvbnNoaXBzOiB7fSwgYXR0cmlidXRlczoge30gfSwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSlcbiAgICAudGhlbigodG9TYXZlOiBNb2RlbERhdGEpID0+IHtcbiAgICAgIHJldHVybiB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodG9TYXZlKSwgdG9TYXZlKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLmZpcmVXcml0ZVVwZGF0ZShPYmplY3QuYXNzaWduKHt9LCB0b1NhdmUsIHsgaW52YWxpZGF0ZTogWydhdHRyaWJ1dGVzJ10gfSkpO1xuICAgICAgICByZXR1cm4gdG9TYXZlO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICByZWFkQXR0cmlidXRlcyh2YWx1ZTogTW9kZWxSZWZlcmVuY2UpOiBQcm9taXNlPE1vZGVsRGF0YT4ge1xuICAgIHJldHVybiB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodmFsdWUpKVxuICAgIC50aGVuKGQgPT4ge1xuICAgICAgaWYgKGQgJiYgZC5hdHRyaWJ1dGVzICYmIE9iamVjdC5rZXlzKGQuYXR0cmlidXRlcykubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgY2FjaGUodmFsdWU6IE1vZGVsRGF0YSkge1xuICAgIGlmICgodmFsdWUuaWQgPT09IHVuZGVmaW5lZCkgfHwgKHZhbHVlLmlkID09PSBudWxsKSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCdDYW5ub3QgY2FjaGUgZGF0YSB3aXRob3V0IGFuIGlkIC0gd3JpdGUgaXQgdG8gYSB0ZXJtaW5hbCBmaXJzdCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHZhbHVlKSlcbiAgICAgIC50aGVuKChjdXJyZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IG5ld1ZhbCA9IG1lcmdlT3B0aW9ucyhjdXJyZW50IHx8IHt9LCB2YWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodmFsdWUpLCBuZXdWYWwpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgY2FjaGVBdHRyaWJ1dGVzKHZhbHVlOiBNb2RlbERhdGEpIHtcbiAgICBpZiAoKHZhbHVlLmlkID09PSB1bmRlZmluZWQpIHx8ICh2YWx1ZS5pZCA9PT0gbnVsbCkpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgnQ2Fubm90IGNhY2hlIGRhdGEgd2l0aG91dCBhbiBpZCAtIHdyaXRlIGl0IHRvIGEgdGVybWluYWwgZmlyc3QnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX2dldCh0aGlzLmtleVN0cmluZyh2YWx1ZSkpXG4gICAgICAudGhlbigoY3VycmVudCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2V0KHRoaXMua2V5U3RyaW5nKHZhbHVlKSwge1xuICAgICAgICAgIHR5cGVOYW1lOiB2YWx1ZS50eXBlTmFtZSxcbiAgICAgICAgICBpZDogdmFsdWUuaWQsXG4gICAgICAgICAgYXR0cmlidXRlczogdmFsdWUuYXR0cmlidXRlcyxcbiAgICAgICAgICByZWxhdGlvbnNoaXBzOiBjdXJyZW50LnJlbGF0aW9uc2hpcHMgfHwge30sXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgY2FjaGVSZWxhdGlvbnNoaXAodmFsdWU6IE1vZGVsRGF0YSkge1xuICAgIGlmICgodmFsdWUuaWQgPT09IHVuZGVmaW5lZCkgfHwgKHZhbHVlLmlkID09PSBudWxsKSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCdDYW5ub3QgY2FjaGUgZGF0YSB3aXRob3V0IGFuIGlkIC0gd3JpdGUgaXQgdG8gYSB0ZXJtaW5hbCBmaXJzdCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHZhbHVlKSlcbiAgICAgIC50aGVuKChjdXJyZW50KSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodmFsdWUpLCB7XG4gICAgICAgICAgdHlwZU5hbWU6IHZhbHVlLnR5cGVOYW1lLFxuICAgICAgICAgIGlkOiB2YWx1ZS5pZCxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiBjdXJyZW50LmF0dHJpYnV0ZXMgfHwge30sXG4gICAgICAgICAgcmVsYXRpb25zaGlwczogdmFsdWUucmVsYXRpb25zaGlwcyxcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZWFkUmVsYXRpb25zaGlwKHZhbHVlOiBNb2RlbFJlZmVyZW5jZSwgcmVsTmFtZTogc3RyaW5nKTogUHJvbWlzZTxNb2RlbERhdGE+IHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHZhbHVlKSlcbiAgICAudGhlbigodikgPT4ge1xuICAgICAgY29uc3QgcmV0VmFsID0gT2JqZWN0LmFzc2lnbih7fSwgdik7XG4gICAgICBpZiAoIXYpIHtcbiAgICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgICByZXR1cm4geyB0eXBlTmFtZTogdmFsdWUudHlwZU5hbWUsIGlkOiB2YWx1ZS5pZCwgcmVsYXRpb25zaGlwczogeyBbcmVsTmFtZV06IFtdIH0gfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICghdi5yZWxhdGlvbnNoaXBzICYmIHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgcmV0VmFsLnJlbGF0aW9uc2hpcHMgPSB7IFtyZWxOYW1lXTogW10gfTtcbiAgICAgIH0gZWxzZSBpZiAoIXJldFZhbC5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdICYmIHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgcmV0VmFsLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0gPSBbXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXRWYWw7XG4gICAgfSk7XG4gIH1cblxuICBkZWxldGUodmFsdWU6IE1vZGVsUmVmZXJlbmNlKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RlbCh0aGlzLmtleVN0cmluZyh2YWx1ZSkpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgdGhpcy5maXJlV3JpdGVVcGRhdGUoeyBpZDogdmFsdWUuaWQsIHR5cGVOYW1lOiB2YWx1ZS50eXBlTmFtZSwgaW52YWxpZGF0ZTogWydhdHRyaWJ1dGVzJywgJ3JlbGF0aW9uc2hpcHMnXSB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHdpcGUodmFsdWU6IE1vZGVsUmVmZXJlbmNlLCBmaWVsZDogc3RyaW5nKSB7XG4gICAgY29uc3Qga3MgPSB0aGlzLmtleVN0cmluZyh2YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXMuX2dldChrcylcbiAgICAudGhlbigodmFsKSA9PiB7XG4gICAgICBpZiAodmFsID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgY29uc3QgbmV3VmFsID0gT2JqZWN0LmFzc2lnbih7fSwgdmFsKTtcbiAgICAgIGlmIChmaWVsZCA9PT0gJ2F0dHJpYnV0ZXMnKSB7XG4gICAgICAgIGRlbGV0ZSBuZXdWYWwuYXR0cmlidXRlcztcbiAgICAgIH0gZWxzZSBpZiAoZmllbGQgPT09ICdyZWxhdGlvbnNoaXBzJykge1xuICAgICAgICBkZWxldGUgbmV3VmFsLnJlbGF0aW9uc2hpcHM7XG4gICAgICB9IGVsc2UgaWYgKGZpZWxkLmluZGV4T2YoJ3JlbGF0aW9uc2hpcHMuJykgPT09IDApIHtcbiAgICAgICAgZGVsZXRlIG5ld1ZhbC5yZWxhdGlvbnNoaXBzW2ZpZWxkLnNwbGl0KCcuJylbMV1dO1xuICAgICAgICBpZiAoT2JqZWN0LmtleXMobmV3VmFsLnJlbGF0aW9uc2hpcHMpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGRlbGV0ZSBuZXdWYWwucmVsYXRpb25zaGlwcztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgZGVsZXRlIGZpZWxkICR7ZmllbGR9IC0gdW5rbm93biBmb3JtYXRgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9zZXQoa3MsIG5ld1ZhbCk7XG4gICAgfSk7XG4gIH1cblxuICB3cml0ZVJlbGF0aW9uc2hpcEl0ZW0odmFsdWU6IE1vZGVsUmVmZXJlbmNlLCByZWxOYW1lOiBzdHJpbmcsIGNoaWxkOiBSZWxhdGlvbnNoaXBJdGVtKSB7XG4gICAgY29uc3Qgc2NoZW1hID0gdGhpcy5nZXRTY2hlbWEodmFsdWUudHlwZU5hbWUpO1xuICAgIGNvbnN0IHJlbFNjaGVtYSA9IHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnR5cGU7XG4gICAgY29uc3Qgb3RoZXJSZWxUeXBlID0gcmVsU2NoZW1hLnNpZGVzW3JlbE5hbWVdLm90aGVyVHlwZTtcbiAgICBjb25zdCBvdGhlclJlbE5hbWUgPSByZWxTY2hlbWEuc2lkZXNbcmVsTmFtZV0ub3RoZXJOYW1lO1xuICAgIGNvbnN0IHRoaXNLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyh2YWx1ZSk7XG4gICAgY29uc3Qgb3RoZXJLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyh7IHR5cGVOYW1lOiBvdGhlclJlbFR5cGUsIGlkOiBjaGlsZC5pZCB9KTtcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgdGhpcy5fZ2V0KHRoaXNLZXlTdHJpbmcpLFxuICAgICAgdGhpcy5fZ2V0KG90aGVyS2V5U3RyaW5nKSxcbiAgICBdKVxuICAgIC50aGVuKChbdGhpc0l0ZW1SZXNvbHZlZCwgb3RoZXJJdGVtUmVzb2x2ZWRdKSA9PiB7XG4gICAgICBsZXQgdGhpc0l0ZW0gPSB0aGlzSXRlbVJlc29sdmVkO1xuICAgICAgaWYgKCF0aGlzSXRlbSkge1xuICAgICAgICB0aGlzSXRlbSA9IHtcbiAgICAgICAgICBpZDogY2hpbGQuaWQsXG4gICAgICAgICAgdHlwZU5hbWU6IG90aGVyUmVsVHlwZSxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiB7fSxcbiAgICAgICAgICByZWxhdGlvbnNoaXBzOiB7fSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGxldCBvdGhlckl0ZW0gPSBvdGhlckl0ZW1SZXNvbHZlZDtcbiAgICAgIGlmICghb3RoZXJJdGVtKSB7XG4gICAgICAgIG90aGVySXRlbSA9IHtcbiAgICAgICAgICBpZDogY2hpbGQuaWQsXG4gICAgICAgICAgdHlwZU5hbWU6IG90aGVyUmVsVHlwZSxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiB7fSxcbiAgICAgICAgICByZWxhdGlvbnNoaXBzOiB7fSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG5ld0NoaWxkOiBSZWxhdGlvbnNoaXBJdGVtID0geyBpZDogY2hpbGQuaWQgfTtcbiAgICAgIGNvbnN0IG5ld1BhcmVudDogUmVsYXRpb25zaGlwSXRlbSA9IHsgaWQ6IHZhbHVlLmlkIH07XG4gICAgICBpZiAoIXRoaXNJdGVtLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0pIHtcbiAgICAgICAgdGhpc0l0ZW0ucmVsYXRpb25zaGlwc1tyZWxOYW1lXSA9IFtdO1xuICAgICAgfVxuICAgICAgaWYgKCFvdGhlckl0ZW0ucmVsYXRpb25zaGlwc1tvdGhlclJlbE5hbWVdKSB7XG4gICAgICAgIG90aGVySXRlbS5yZWxhdGlvbnNoaXBzW290aGVyUmVsTmFtZV0gPSBbXTtcbiAgICAgIH1cbiAgICAgIGlmIChyZWxTY2hlbWEuZXh0cmFzICYmIGNoaWxkLm1ldGEpIHtcbiAgICAgICAgbmV3UGFyZW50Lm1ldGEgPSB7fTtcbiAgICAgICAgbmV3Q2hpbGQubWV0YSA9IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IGV4dHJhIGluIGNoaWxkLm1ldGEpIHtcbiAgICAgICAgICBpZiAoZXh0cmEgaW4gcmVsU2NoZW1hLmV4dHJhcykge1xuICAgICAgICAgICAgbmV3Q2hpbGQubWV0YVtleHRyYV0gPSBjaGlsZC5tZXRhW2V4dHJhXTtcbiAgICAgICAgICAgIG5ld1BhcmVudC5tZXRhW2V4dHJhXSA9IGNoaWxkLm1ldGFbZXh0cmFdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCB0aGlzSWR4ID0gdGhpc0l0ZW0ucmVsYXRpb25zaGlwc1tyZWxOYW1lXS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSBjaGlsZC5pZCk7XG4gICAgICBjb25zdCBvdGhlcklkeCA9IG90aGVySXRlbS5yZWxhdGlvbnNoaXBzW290aGVyUmVsTmFtZV0uZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gdmFsdWUuaWQpO1xuICAgICAgaWYgKHRoaXNJZHggPCAwKSB7XG4gICAgICAgIHRoaXNJdGVtLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0ucHVzaChuZXdDaGlsZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzSXRlbS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdW3RoaXNJZHhdID0gbmV3Q2hpbGQ7XG4gICAgICB9XG4gICAgICBpZiAob3RoZXJJZHggPCAwKSB7XG4gICAgICAgIG90aGVySXRlbS5yZWxhdGlvbnNoaXBzW290aGVyUmVsTmFtZV0ucHVzaChuZXdQYXJlbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3RoZXJJdGVtLnJlbGF0aW9uc2hpcHNbb3RoZXJSZWxOYW1lXVtvdGhlcklkeF0gPSBuZXdQYXJlbnQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICAgIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyh0aGlzSXRlbSksIHRoaXNJdGVtKSxcbiAgICAgICAgdGhpcy5fc2V0KHRoaXMua2V5U3RyaW5nKG90aGVySXRlbSksIG90aGVySXRlbSksXG4gICAgICBdKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5maXJlV3JpdGVVcGRhdGUoT2JqZWN0LmFzc2lnbih0aGlzSXRlbSwgeyBpbnZhbGlkYXRlOiBbYHJlbGF0aW9uc2hpcHMuJHtyZWxOYW1lfWBdIH0pKTtcbiAgICAgICAgdGhpcy5maXJlV3JpdGVVcGRhdGUoT2JqZWN0LmFzc2lnbihvdGhlckl0ZW0sIHsgaW52YWxpZGF0ZTogW2ByZWxhdGlvbnNoaXBzLiR7b3RoZXJSZWxOYW1lfWBdIH0pKTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiB0aGlzSXRlbSk7XG4gICAgfSk7XG4gIH1cblxuICBkZWxldGVSZWxhdGlvbnNoaXBJdGVtKHZhbHVlOiBNb2RlbFJlZmVyZW5jZSwgcmVsTmFtZTogc3RyaW5nLCBjaGlsZDogUmVsYXRpb25zaGlwSXRlbSkge1xuICAgIGNvbnN0IHNjaGVtYSA9IHRoaXMuZ2V0U2NoZW1hKHZhbHVlLnR5cGVOYW1lKTtcbiAgICBjb25zdCByZWxTY2hlbWEgPSBzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxOYW1lXS50eXBlO1xuICAgIGNvbnN0IG90aGVyUmVsVHlwZSA9IHJlbFNjaGVtYS5zaWRlc1tyZWxOYW1lXS5vdGhlclR5cGU7XG4gICAgY29uc3Qgb3RoZXJSZWxOYW1lID0gcmVsU2NoZW1hLnNpZGVzW3JlbE5hbWVdLm90aGVyTmFtZTtcbiAgICBjb25zdCB0aGlzS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcodmFsdWUpO1xuICAgIGNvbnN0IG90aGVyS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcoeyB0eXBlTmFtZTogb3RoZXJSZWxUeXBlLCBpZDogY2hpbGQuaWQgfSk7XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKFtcbiAgICAgIHRoaXMuX2dldCh0aGlzS2V5U3RyaW5nKSxcbiAgICAgIHRoaXMuX2dldChvdGhlcktleVN0cmluZyksXG4gICAgXSlcbiAgICAudGhlbigoW3RoaXNJdGVtLCBvdGhlckl0ZW1dKSA9PiB7XG4gICAgICBpZiAoIXRoaXNJdGVtLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0pIHtcbiAgICAgICAgdGhpc0l0ZW0ucmVsYXRpb25zaGlwc1tyZWxOYW1lXSA9IFtdO1xuICAgICAgfVxuICAgICAgaWYgKCFvdGhlckl0ZW0ucmVsYXRpb25zaGlwc1tvdGhlclJlbE5hbWVdKSB7XG4gICAgICAgIG90aGVySXRlbS5yZWxhdGlvbnNoaXBzW290aGVyUmVsTmFtZV0gPSBbXTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHRoaXNJZHggPSB0aGlzSXRlbS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLmZpbmRJbmRleChpdGVtID0+IGl0ZW0uaWQgPT09IGNoaWxkLmlkKTtcbiAgICAgIGNvbnN0IG90aGVySWR4ID0gb3RoZXJJdGVtLnJlbGF0aW9uc2hpcHNbb3RoZXJSZWxOYW1lXS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSB2YWx1ZS5pZCk7XG4gICAgICBpZiAodGhpc0lkeCA+PSAwKSB7XG4gICAgICAgIHRoaXNJdGVtLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0uc3BsaWNlKHRoaXNJZHgsIDEpO1xuICAgICAgfVxuICAgICAgaWYgKG90aGVySWR4ID49IDApIHtcbiAgICAgICAgb3RoZXJJdGVtLnJlbGF0aW9uc2hpcHNbb3RoZXJSZWxOYW1lXS5zcGxpY2Uob3RoZXJJZHgsIDEpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgICB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodGhpc0l0ZW0pLCB0aGlzSXRlbSksXG4gICAgICAgIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyhvdGhlckl0ZW0pLCBvdGhlckl0ZW0pLFxuICAgICAgXSkudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMuZmlyZVdyaXRlVXBkYXRlKE9iamVjdC5hc3NpZ24odGhpc0l0ZW0sIHsgaW52YWxpZGF0ZTogW2ByZWxhdGlvbnNoaXBzLiR7cmVsTmFtZX1gXSB9KSk7XG4gICAgICAgIHRoaXMuZmlyZVdyaXRlVXBkYXRlKE9iamVjdC5hc3NpZ24ob3RoZXJJdGVtLCB7IGludmFsaWRhdGU6IFtgcmVsYXRpb25zaGlwcy4ke290aGVyUmVsTmFtZX1gXSB9KSk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4gdGhpc0l0ZW0pO1xuICAgIH0pO1xuICB9XG5cbiAgcXVlcnkodDogc3RyaW5nKTogUHJvbWlzZTxNb2RlbFJlZmVyZW5jZVtdPiB7XG4gICAgcmV0dXJuIHRoaXMuX2tleXModClcbiAgICAudGhlbigoa2V5cykgPT4ge1xuICAgICAgcmV0dXJuIGtleXMubWFwKGsgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGVOYW1lOiB0LFxuICAgICAgICAgIGlkOiBwYXJzZUludChrLnNwbGl0KCc6JylbMV0sIDEwKSxcbiAgICAgICAgfTtcbiAgICAgIH0pLmZpbHRlcih2ID0+ICFpc05hTih2LmlkKSk7XG4gICAgfSk7XG4gIH1cblxuICBhZGRTY2hlbWEodDoge3R5cGVOYW1lOiBzdHJpbmcsIHNjaGVtYTogTW9kZWxTY2hlbWF9KSB7XG4gICAgcmV0dXJuIHN1cGVyLmFkZFNjaGVtYSh0KVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMubWF4S2V5c1t0LnR5cGVOYW1lXSA9IDA7XG4gICAgfSk7XG4gIH1cblxuICBrZXlTdHJpbmcodmFsdWU6IE1vZGVsUmVmZXJlbmNlKSB7XG4gICAgcmV0dXJuIGAke3ZhbHVlLnR5cGVOYW1lfToke3ZhbHVlLmlkfWA7XG4gIH1cbn1cbiJdfQ==
