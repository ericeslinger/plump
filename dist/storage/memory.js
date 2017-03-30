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
var modifiableKeyValueStore_1 = require("./modifiableKeyValueStore");
var mergeOptions = require("merge-options");
var MemoryStore = (function (_super) {
    __extends(MemoryStore, _super);
    function MemoryStore(opts) {
        if (opts === void 0) { opts = {}; }
        var _this = _super.call(this, opts) || this;
        _this.store = {};
        return _this;
    }
    MemoryStore.prototype.logStore = function () {
        console.log(JSON.stringify(this.store, null, 2));
    };
    MemoryStore.prototype._keys = function (typeName) {
        return Promise.resolve(Object.keys(this.store).filter(function (k) { return k.indexOf(typeName + ":") === 0; }));
    };
    MemoryStore.prototype._get = function (item) {
        var k = this.keyString(item);
        if (this.store[k]) {
            return Promise.resolve(this.store[k]);
        }
        else {
            return Promise.resolve(null);
        }
    };
    MemoryStore.prototype._upsert = function (vals) {
        var _this = this;
        return Promise.resolve()
            .then(function () {
            var k = _this.keyString(vals);
            if (_this.store[k] === undefined) {
                _this.store[k] = mergeOptions({}, vals);
            }
            else {
                _this.store[k] = mergeOptions(_this.store[k], vals);
            }
            return vals;
        });
    };
    MemoryStore.prototype._updateArray = function (ref, relName, item) {
        var _this = this;
        return Promise.resolve()
            .then(function () {
            var k = _this.keyString(ref);
            if (_this.store[k] === undefined) {
                _this.store[k] = {
                    id: ref.id,
                    typeName: ref.typeName,
                    attributes: {},
                    relationships: {
                        relName: [item]
                    }
                };
            }
            else if ((_this.store[k].relationships === undefined) || (_this.store[k].relationships[relName] === undefined)) {
                if (_this.store[k].relationships === undefined) {
                    _this.store[k].relationships = {};
                }
                _this.store[k].relationships[relName] = [item];
            }
            else {
                var idx = _this.store[k].relationships[relName].findIndex(function (v) { return v.id === item.id; });
                if (idx >= 0) {
                    _this.store[k].relationships[relName][idx] = item;
                }
                else {
                    _this.store[k].relationships[relName].push(item);
                }
            }
            return ref;
        });
    };
    MemoryStore.prototype._removeFromArray = function (ref, relName, item) {
        var _this = this;
        return Promise.resolve()
            .then(function () {
            var k = _this.keyString(ref);
            if ((_this.store[k] !== undefined) &&
                (_this.store[k].relationships !== undefined) &&
                (_this.store[k].relationships[relName] !== undefined)) {
                var idx = _this.store[k].relationships[relName].findIndex(function (v) { return v.id === item.id; });
                if (idx >= 0) {
                    _this.store[k].relationships[relName].splice(idx, 1);
                }
            }
            return ref;
        });
    };
    MemoryStore.prototype._del = function (ref, fields) {
        var _this = this;
        return Promise.resolve()
            .then(function () {
            var k = _this.keyString(ref);
            if (_this.store[k]) {
                fields.forEach(function (field) {
                    if (field === 'attributes') {
                        delete _this.store[k].attributes;
                    }
                    else if (field === 'relationships') {
                        delete _this.store[k].relationships;
                    }
                    else if ((field.indexOf('relationships.') === 0) && (_this.store[k].relationships)) {
                        delete _this.store[k].relationships[field.split('.')[1]];
                    }
                });
            }
            return _this.store[k];
        });
    };
    return MemoryStore;
}(modifiableKeyValueStore_1.ModifiableKeyValueStore));
exports.MemoryStore = MemoryStore;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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Q0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUNILGtCQUFDO0FBQUQsQ0F4R0EsQUF3R0MsQ0F4R2dDLGlEQUF1QixHQXdHdkQ7QUF4R1ksa0NBQVciLCJmaWxlIjoic3RvcmFnZS9tZW1vcnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2RpZmlhYmxlS2V5VmFsdWVTdG9yZSB9IGZyb20gJy4vbW9kaWZpYWJsZUtleVZhbHVlU3RvcmUnO1xuaW1wb3J0IHsgTW9kZWxEYXRhLCBSZWxhdGlvbnNoaXBJdGVtLCBNb2RlbFJlZmVyZW5jZSB9IGZyb20gJy4uL2RhdGFUeXBlcyc7XG5pbXBvcnQgKiBhcyBtZXJnZU9wdGlvbnMgZnJvbSAnbWVyZ2Utb3B0aW9ucyc7XG5cbmV4cG9ydCBjbGFzcyBNZW1vcnlTdG9yZSBleHRlbmRzIE1vZGlmaWFibGVLZXlWYWx1ZVN0b3JlIHtcblxuICBwcml2YXRlIHN0b3JlOiB7W2luZGV4OiBzdHJpbmddOiBNb2RlbERhdGF9ID0ge307XG5cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgc3VwZXIob3B0cyk7XG4gIH1cblxuICBsb2dTdG9yZSgpIHtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh0aGlzLnN0b3JlLCBudWxsLCAyKSk7XG4gIH1cblxuICBfa2V5cyh0eXBlTmFtZSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoT2JqZWN0LmtleXModGhpcy5zdG9yZSkuZmlsdGVyKChrKSA9PiBrLmluZGV4T2YoYCR7dHlwZU5hbWV9OmApID09PSAwKSk7XG4gIH1cblxuICBfZ2V0KGl0ZW06IE1vZGVsUmVmZXJlbmNlKSB7XG4gICAgY29uc3QgayA9IHRoaXMua2V5U3RyaW5nKGl0ZW0pO1xuICAgIGlmICh0aGlzLnN0b3JlW2tdKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuc3RvcmVba10pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIF91cHNlcnQodmFsczogTW9kZWxEYXRhKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3QgayA9IHRoaXMua2V5U3RyaW5nKHZhbHMpO1xuICAgICAgaWYgKHRoaXMuc3RvcmVba10gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLnN0b3JlW2tdID0gbWVyZ2VPcHRpb25zKHt9LCB2YWxzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc3RvcmVba10gPSBtZXJnZU9wdGlvbnModGhpcy5zdG9yZVtrXSwgdmFscyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdmFscztcbiAgICB9KTtcbiAgfVxuXG4gIF91cGRhdGVBcnJheShyZWY6IE1vZGVsUmVmZXJlbmNlLCByZWxOYW1lOiBzdHJpbmcsIGl0ZW06IFJlbGF0aW9uc2hpcEl0ZW0pIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCBrID0gdGhpcy5rZXlTdHJpbmcocmVmKTtcbiAgICAgIGlmICh0aGlzLnN0b3JlW2tdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5zdG9yZVtrXSA9IHtcbiAgICAgICAgICBpZDogcmVmLmlkLFxuICAgICAgICAgIHR5cGVOYW1lOiByZWYudHlwZU5hbWUsXG4gICAgICAgICAgYXR0cmlidXRlczoge30sXG4gICAgICAgICAgcmVsYXRpb25zaGlwczoge1xuICAgICAgICAgICAgcmVsTmFtZTogW2l0ZW1dXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIGlmICgodGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzID09PSB1bmRlZmluZWQpIHx8ICh0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0gPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RvcmVba10ucmVsYXRpb25zaGlwcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzID0ge307XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdID0gW2l0ZW1dO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgaWR4ID0gdGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLmZpbmRJbmRleCh2ID0+IHYuaWQgPT09IGl0ZW0uaWQpO1xuICAgICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgICB0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV1baWR4XSA9IGl0ZW07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnB1c2goaXRlbSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZWY7XG4gICAgfSk7XG4gIH1cblxuICBfcmVtb3ZlRnJvbUFycmF5KHJlZjogTW9kZWxSZWZlcmVuY2UsIHJlbE5hbWU6IHN0cmluZywgaXRlbTogUmVsYXRpb25zaGlwSXRlbSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IGsgPSB0aGlzLmtleVN0cmluZyhyZWYpO1xuICAgICAgaWYgKFxuICAgICAgICAodGhpcy5zdG9yZVtrXSAhPT0gdW5kZWZpbmVkKSAmJlxuICAgICAgICAodGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzICE9PSB1bmRlZmluZWQpICYmXG4gICAgICAgICh0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0gIT09IHVuZGVmaW5lZClcbiAgICAgICkge1xuICAgICAgICBjb25zdCBpZHggPSB0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0uZmluZEluZGV4KHYgPT4gdi5pZCA9PT0gaXRlbS5pZCk7XG4gICAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAgIHRoaXMuc3RvcmVba10ucmVsYXRpb25zaGlwc1tyZWxOYW1lXS5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlZjtcbiAgICB9KTtcbiAgfVxuXG4gIF9kZWwocmVmOiBNb2RlbFJlZmVyZW5jZSwgZmllbGRzOiBzdHJpbmdbXSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IGsgPSB0aGlzLmtleVN0cmluZyhyZWYpO1xuICAgICAgaWYgKHRoaXMuc3RvcmVba10pIHtcbiAgICAgICAgZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgaWYgKGZpZWxkID09PSAnYXR0cmlidXRlcycpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnN0b3JlW2tdLmF0dHJpYnV0ZXM7XG4gICAgICAgICAgfSBlbHNlIGlmIChmaWVsZCA9PT0gJ3JlbGF0aW9uc2hpcHMnKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzO1xuICAgICAgICAgIH0gZWxzZSBpZiAoKGZpZWxkLmluZGV4T2YoJ3JlbGF0aW9uc2hpcHMuJykgPT09IDApICYmICh0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHMpKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzW2ZpZWxkLnNwbGl0KCcuJylbMV1dO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5zdG9yZVtrXTtcbiAgICB9KTtcbiAgfVxufVxuIl19
