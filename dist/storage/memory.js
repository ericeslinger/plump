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
                _this.store[k] = mergeOptions({ relationships: {} }, vals);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zdG9yYWdlL21lbW9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxxRUFBb0U7QUFFcEUsNENBQThDO0FBRTlDO0lBQWlDLCtCQUF1QjtJQUl0RCxxQkFBWSxJQUFTO1FBQVQscUJBQUEsRUFBQSxTQUFTO1FBQXJCLFlBQ0Usa0JBQU0sSUFBSSxDQUFDLFNBQ1o7UUFKRCxXQUFLLEdBQWlDLEVBQUUsQ0FBQzs7SUFJekMsQ0FBQztJQUVELDhCQUFRLEdBQVI7UUFDRSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRUQsMkJBQUssR0FBTCxVQUFNLFFBQVE7UUFDWixNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBQyxDQUFDLElBQUssT0FBQSxDQUFDLENBQUMsT0FBTyxDQUFJLFFBQVEsTUFBRyxDQUFDLEtBQUssQ0FBQyxFQUEvQixDQUErQixDQUFDLENBQUMsQ0FBQztJQUNqRyxDQUFDO0lBRUQsMEJBQUksR0FBSixVQUFLLElBQW9CO1FBQ3ZCLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLENBQUM7SUFD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LENBQUMsQ0FBQyxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUNILGtCQUFDO0FBQUQsQ0F4R0EsQUF3R0MsQ0F4R2dDLGlEQUF1QixHQXdHdkQ7QUF4R1ksa0NBQVciLCJmaWxlIjoic3RvcmFnZS9tZW1vcnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2RpZmlhYmxlS2V5VmFsdWVTdG9yZSB9IGZyb20gJy4vbW9kaWZpYWJsZUtleVZhbHVlU3RvcmUnO1xuaW1wb3J0IHsgTW9kZWxEYXRhLCBSZWxhdGlvbnNoaXBJdGVtLCBNb2RlbFJlZmVyZW5jZSB9IGZyb20gJy4uL2RhdGFUeXBlcyc7XG5pbXBvcnQgKiBhcyBtZXJnZU9wdGlvbnMgZnJvbSAnbWVyZ2Utb3B0aW9ucyc7XG5cbmV4cG9ydCBjbGFzcyBNZW1vcnlTdG9yZSBleHRlbmRzIE1vZGlmaWFibGVLZXlWYWx1ZVN0b3JlIHtcblxuICBzdG9yZToge1tpbmRleDogc3RyaW5nXTogTW9kZWxEYXRhfSA9IHt9O1xuXG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIHN1cGVyKG9wdHMpO1xuICB9XG5cbiAgbG9nU3RvcmUoKSB7XG4gICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodGhpcy5zdG9yZSwgbnVsbCwgMikpO1xuICB9XG5cbiAgX2tleXModHlwZU5hbWUpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKE9iamVjdC5rZXlzKHRoaXMuc3RvcmUpLmZpbHRlcigoaykgPT4gay5pbmRleE9mKGAke3R5cGVOYW1lfTpgKSA9PT0gMCkpO1xuICB9XG5cbiAgX2dldChpdGVtOiBNb2RlbFJlZmVyZW5jZSkge1xuICAgIGNvbnN0IGsgPSB0aGlzLmtleVN0cmluZyhpdGVtKTtcbiAgICBpZiAodGhpcy5zdG9yZVtrXSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLnN0b3JlW2tdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICB9XG4gIH1cblxuICBfdXBzZXJ0KHZhbHM6IE1vZGVsRGF0YSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IGsgPSB0aGlzLmtleVN0cmluZyh2YWxzKTtcbiAgICAgIGlmICh0aGlzLnN0b3JlW2tdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5zdG9yZVtrXSA9IG1lcmdlT3B0aW9ucyh7IHJlbGF0aW9uc2hpcHM6IHt9IH0sIHZhbHMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zdG9yZVtrXSA9IG1lcmdlT3B0aW9ucyh0aGlzLnN0b3JlW2tdLCB2YWxzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWxzO1xuICAgIH0pO1xuICB9XG5cbiAgX3VwZGF0ZUFycmF5KHJlZjogTW9kZWxSZWZlcmVuY2UsIHJlbE5hbWU6IHN0cmluZywgaXRlbTogUmVsYXRpb25zaGlwSXRlbSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IGsgPSB0aGlzLmtleVN0cmluZyhyZWYpO1xuICAgICAgaWYgKHRoaXMuc3RvcmVba10gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLnN0b3JlW2tdID0ge1xuICAgICAgICAgIGlkOiByZWYuaWQsXG4gICAgICAgICAgdHlwZU5hbWU6IHJlZi50eXBlTmFtZSxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiB7fSxcbiAgICAgICAgICByZWxhdGlvbnNoaXBzOiB7XG4gICAgICAgICAgICByZWxOYW1lOiBbaXRlbV1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9IGVsc2UgaWYgKCh0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHMgPT09IHVuZGVmaW5lZCkgfHwgKHRoaXMuc3RvcmVba10ucmVsYXRpb25zaGlwc1tyZWxOYW1lXSA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICBpZiAodGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHMgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0gPSBbaXRlbV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBpZHggPSB0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0uZmluZEluZGV4KHYgPT4gdi5pZCA9PT0gaXRlbS5pZCk7XG4gICAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAgIHRoaXMuc3RvcmVba10ucmVsYXRpb25zaGlwc1tyZWxOYW1lXVtpZHhdID0gaXRlbTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0ucHVzaChpdGVtKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlZjtcbiAgICB9KTtcbiAgfVxuXG4gIF9yZW1vdmVGcm9tQXJyYXkocmVmOiBNb2RlbFJlZmVyZW5jZSwgcmVsTmFtZTogc3RyaW5nLCBpdGVtOiBSZWxhdGlvbnNoaXBJdGVtKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3QgayA9IHRoaXMua2V5U3RyaW5nKHJlZik7XG4gICAgICBpZiAoXG4gICAgICAgICh0aGlzLnN0b3JlW2tdICE9PSB1bmRlZmluZWQpICYmXG4gICAgICAgICh0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHMgIT09IHVuZGVmaW5lZCkgJiZcbiAgICAgICAgKHRoaXMuc3RvcmVba10ucmVsYXRpb25zaGlwc1tyZWxOYW1lXSAhPT0gdW5kZWZpbmVkKVxuICAgICAgKSB7XG4gICAgICAgIGNvbnN0IGlkeCA9IHRoaXMuc3RvcmVba10ucmVsYXRpb25zaGlwc1tyZWxOYW1lXS5maW5kSW5kZXgodiA9PiB2LmlkID09PSBpdGVtLmlkKTtcbiAgICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgICAgdGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnNwbGljZShpZHgsIDEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVmO1xuICAgIH0pO1xuICB9XG5cbiAgX2RlbChyZWY6IE1vZGVsUmVmZXJlbmNlLCBmaWVsZHM6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3QgayA9IHRoaXMua2V5U3RyaW5nKHJlZik7XG4gICAgICBpZiAodGhpcy5zdG9yZVtrXSkge1xuICAgICAgICBmaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICBpZiAoZmllbGQgPT09ICdhdHRyaWJ1dGVzJykge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuc3RvcmVba10uYXR0cmlidXRlcztcbiAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkID09PSAncmVsYXRpb25zaGlwcycpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHM7XG4gICAgICAgICAgfSBlbHNlIGlmICgoZmllbGQuaW5kZXhPZigncmVsYXRpb25zaGlwcy4nKSA9PT0gMCkgJiYgKHRoaXMuc3RvcmVba10ucmVsYXRpb25zaGlwcykpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHNbZmllbGQuc3BsaXQoJy4nKVsxXV07XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnN0b3JlW2tdO1xuICAgIH0pO1xuICB9XG59XG4iXX0=
