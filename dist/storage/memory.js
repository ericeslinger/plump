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
    MemoryStore.prototype._keys = function (type) {
        return Promise.resolve(Object.keys(this.store).filter(function (k) { return k.indexOf(type + ":") === 0; }));
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
        return Promise.resolve().then(function () {
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
        return Promise.resolve().then(function () {
            var k = _this.keyString(ref);
            if (_this.store[k] === undefined) {
                _this.store[k] = {
                    id: ref.id,
                    type: ref.type,
                    attributes: {},
                    relationships: (_a = {},
                        _a[relName] = [item],
                        _a),
                };
            }
            else if (_this.store[k].relationships === undefined ||
                _this.store[k].relationships[relName] === undefined) {
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
            var _a;
        });
    };
    MemoryStore.prototype._removeFromArray = function (ref, relName, item) {
        var _this = this;
        return Promise.resolve().then(function () {
            var k = _this.keyString(ref);
            if (_this.store[k] !== undefined &&
                _this.store[k].relationships !== undefined &&
                _this.store[k].relationships[relName] !== undefined) {
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
        return Promise.resolve().then(function () {
            var k = _this.keyString(ref);
            if (_this.store[k]) {
                fields.forEach(function (field) {
                    if (field === 'attributes') {
                        delete _this.store[k].attributes;
                    }
                    else if (field === 'relationships') {
                        delete _this.store[k].relationships;
                    }
                    else if (field.indexOf('relationships.') === 0 &&
                        _this.store[k].relationships) {
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zdG9yYWdlL21lbW9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxxRUFBb0U7QUFFcEUsNENBQThDO0FBRTlDO0lBQWlDLCtCQUF1QjtJQUd0RCxxQkFBWSxJQUFTO1FBQVQscUJBQUEsRUFBQSxTQUFTO1FBQXJCLFlBQ0Usa0JBQU0sSUFBSSxDQUFDLFNBQ1o7UUFKRCxXQUFLLEdBQW1DLEVBQUUsQ0FBQzs7SUFJM0MsQ0FBQztJQUVELDhCQUFRLEdBQVI7UUFDRSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRUQsMkJBQUssR0FBTCxVQUFNLElBQUk7UUFDUixNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FDcEIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLE9BQU8sQ0FBSSxJQUFJLE1BQUcsQ0FBQyxLQUFLLENBQUMsRUFBM0IsQ0FBMkIsQ0FBQyxDQUNqRSxDQUFDO0lBQ0osQ0FBQztJQUVELDBCQUFJLEdBQUosVUFBSyxJQUFvQjtRQUN2QixJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQixDQUFDO0lB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LENBbkhBLEFBbUhDLENBbkhnQyxpREFBdUIsR0FtSHZEO0FBbkhZLGtDQUFXIiwiZmlsZSI6InN0b3JhZ2UvbWVtb3J5LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kaWZpYWJsZUtleVZhbHVlU3RvcmUgfSBmcm9tICcuL21vZGlmaWFibGVLZXlWYWx1ZVN0b3JlJztcbmltcG9ydCB7IE1vZGVsRGF0YSwgUmVsYXRpb25zaGlwSXRlbSwgTW9kZWxSZWZlcmVuY2UgfSBmcm9tICcuLi9kYXRhVHlwZXMnO1xuaW1wb3J0ICogYXMgbWVyZ2VPcHRpb25zIGZyb20gJ21lcmdlLW9wdGlvbnMnO1xuXG5leHBvcnQgY2xhc3MgTWVtb3J5U3RvcmUgZXh0ZW5kcyBNb2RpZmlhYmxlS2V5VmFsdWVTdG9yZSB7XG4gIHN0b3JlOiB7IFtpbmRleDogc3RyaW5nXTogTW9kZWxEYXRhIH0gPSB7fTtcblxuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBzdXBlcihvcHRzKTtcbiAgfVxuXG4gIGxvZ1N0b3JlKCkge1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRoaXMuc3RvcmUsIG51bGwsIDIpKTtcbiAgfVxuXG4gIF9rZXlzKHR5cGUpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFxuICAgICAgT2JqZWN0LmtleXModGhpcy5zdG9yZSkuZmlsdGVyKGsgPT4gay5pbmRleE9mKGAke3R5cGV9OmApID09PSAwKVxuICAgICk7XG4gIH1cblxuICBfZ2V0KGl0ZW06IE1vZGVsUmVmZXJlbmNlKSB7XG4gICAgY29uc3QgayA9IHRoaXMua2V5U3RyaW5nKGl0ZW0pO1xuICAgIGlmICh0aGlzLnN0b3JlW2tdKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuc3RvcmVba10pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIF91cHNlcnQodmFsczogTW9kZWxEYXRhKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3QgayA9IHRoaXMua2V5U3RyaW5nKHZhbHMpO1xuICAgICAgaWYgKHRoaXMuc3RvcmVba10gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLnN0b3JlW2tdID0gbWVyZ2VPcHRpb25zKHsgcmVsYXRpb25zaGlwczoge30gfSwgdmFscyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnN0b3JlW2tdID0gbWVyZ2VPcHRpb25zKHRoaXMuc3RvcmVba10sIHZhbHMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHM7XG4gICAgfSk7XG4gIH1cblxuICBfdXBkYXRlQXJyYXkocmVmOiBNb2RlbFJlZmVyZW5jZSwgcmVsTmFtZTogc3RyaW5nLCBpdGVtOiBSZWxhdGlvbnNoaXBJdGVtKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3QgayA9IHRoaXMua2V5U3RyaW5nKHJlZik7XG4gICAgICBpZiAodGhpcy5zdG9yZVtrXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMuc3RvcmVba10gPSB7XG4gICAgICAgICAgaWQ6IHJlZi5pZCxcbiAgICAgICAgICB0eXBlOiByZWYudHlwZSxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiB7fSxcbiAgICAgICAgICByZWxhdGlvbnNoaXBzOiB7XG4gICAgICAgICAgICBbcmVsTmFtZV06IFtpdGVtXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgdGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgdGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdID09PSB1bmRlZmluZWRcbiAgICAgICkge1xuICAgICAgICBpZiAodGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHMgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0gPSBbaXRlbV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBpZHggPSB0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0uZmluZEluZGV4KFxuICAgICAgICAgIHYgPT4gdi5pZCA9PT0gaXRlbS5pZFxuICAgICAgICApO1xuICAgICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgICB0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV1baWR4XSA9IGl0ZW07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnB1c2goaXRlbSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZWY7XG4gICAgfSk7XG4gIH1cblxuICBfcmVtb3ZlRnJvbUFycmF5KFxuICAgIHJlZjogTW9kZWxSZWZlcmVuY2UsXG4gICAgcmVsTmFtZTogc3RyaW5nLFxuICAgIGl0ZW06IFJlbGF0aW9uc2hpcEl0ZW1cbiAgKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3QgayA9IHRoaXMua2V5U3RyaW5nKHJlZik7XG4gICAgICBpZiAoXG4gICAgICAgIHRoaXMuc3RvcmVba10gIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICB0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHMgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICB0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0gIT09IHVuZGVmaW5lZFxuICAgICAgKSB7XG4gICAgICAgIGNvbnN0IGlkeCA9IHRoaXMuc3RvcmVba10ucmVsYXRpb25zaGlwc1tyZWxOYW1lXS5maW5kSW5kZXgoXG4gICAgICAgICAgdiA9PiB2LmlkID09PSBpdGVtLmlkXG4gICAgICAgICk7XG4gICAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAgIHRoaXMuc3RvcmVba10ucmVsYXRpb25zaGlwc1tyZWxOYW1lXS5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlZjtcbiAgICB9KTtcbiAgfVxuXG4gIF9kZWwocmVmOiBNb2RlbFJlZmVyZW5jZSwgZmllbGRzOiBzdHJpbmdbXSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IGsgPSB0aGlzLmtleVN0cmluZyhyZWYpO1xuICAgICAgaWYgKHRoaXMuc3RvcmVba10pIHtcbiAgICAgICAgZmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgICAgIGlmIChmaWVsZCA9PT0gJ2F0dHJpYnV0ZXMnKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5zdG9yZVtrXS5hdHRyaWJ1dGVzO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQgPT09ICdyZWxhdGlvbnNoaXBzJykge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuc3RvcmVba10ucmVsYXRpb25zaGlwcztcbiAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgZmllbGQuaW5kZXhPZigncmVsYXRpb25zaGlwcy4nKSA9PT0gMCAmJlxuICAgICAgICAgICAgdGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzW2ZpZWxkLnNwbGl0KCcuJylbMV1dO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5zdG9yZVtrXTtcbiAgICB9KTtcbiAgfVxufVxuIl19
