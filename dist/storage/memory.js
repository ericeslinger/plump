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
                    type: ref.type,
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zdG9yYWdlL21lbW9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxxRUFBb0U7QUFFcEUsNENBQThDO0FBRTlDO0lBQWlDLCtCQUF1QjtJQUl0RCxxQkFBWSxJQUFTO1FBQVQscUJBQUEsRUFBQSxTQUFTO1FBQXJCLFlBQ0Usa0JBQU0sSUFBSSxDQUFDLFNBQ1o7UUFKRCxXQUFLLEdBQWlDLEVBQUUsQ0FBQzs7SUFJekMsQ0FBQztJQUVELDhCQUFRLEdBQVI7UUFDRSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRUQsMkJBQUssR0FBTCxVQUFNLElBQUk7UUFDUixNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBQyxDQUFDLElBQUssT0FBQSxDQUFDLENBQUMsT0FBTyxDQUFJLElBQUksTUFBRyxDQUFDLEtBQUssQ0FBQyxFQUEzQixDQUEyQixDQUFDLENBQUMsQ0FBQztJQUM3RixDQUFDO0lBRUQsMEJBQUksR0FBSixVQUFLLElBQW9CO1FBQ3ZCLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLENBQUM7SUFD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Q0FBQyxDQUFDLENBQUM7UUFDdkIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBQ0gsa0JBQUM7QUFBRCxDQXhHQSxBQXdHQyxDQXhHZ0MsaURBQXVCLEdBd0d2RDtBQXhHWSxrQ0FBVyIsImZpbGUiOiJzdG9yYWdlL21lbW9yeS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vZGlmaWFibGVLZXlWYWx1ZVN0b3JlIH0gZnJvbSAnLi9tb2RpZmlhYmxlS2V5VmFsdWVTdG9yZSc7XG5pbXBvcnQgeyBNb2RlbERhdGEsIFJlbGF0aW9uc2hpcEl0ZW0sIE1vZGVsUmVmZXJlbmNlIH0gZnJvbSAnLi4vZGF0YVR5cGVzJztcbmltcG9ydCAqIGFzIG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcblxuZXhwb3J0IGNsYXNzIE1lbW9yeVN0b3JlIGV4dGVuZHMgTW9kaWZpYWJsZUtleVZhbHVlU3RvcmUge1xuXG4gIHN0b3JlOiB7W2luZGV4OiBzdHJpbmddOiBNb2RlbERhdGF9ID0ge307XG5cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgc3VwZXIob3B0cyk7XG4gIH1cblxuICBsb2dTdG9yZSgpIHtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh0aGlzLnN0b3JlLCBudWxsLCAyKSk7XG4gIH1cblxuICBfa2V5cyh0eXBlKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShPYmplY3Qua2V5cyh0aGlzLnN0b3JlKS5maWx0ZXIoKGspID0+IGsuaW5kZXhPZihgJHt0eXBlfTpgKSA9PT0gMCkpO1xuICB9XG5cbiAgX2dldChpdGVtOiBNb2RlbFJlZmVyZW5jZSkge1xuICAgIGNvbnN0IGsgPSB0aGlzLmtleVN0cmluZyhpdGVtKTtcbiAgICBpZiAodGhpcy5zdG9yZVtrXSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLnN0b3JlW2tdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICB9XG4gIH1cblxuICBfdXBzZXJ0KHZhbHM6IE1vZGVsRGF0YSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IGsgPSB0aGlzLmtleVN0cmluZyh2YWxzKTtcbiAgICAgIGlmICh0aGlzLnN0b3JlW2tdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5zdG9yZVtrXSA9IG1lcmdlT3B0aW9ucyh7IHJlbGF0aW9uc2hpcHM6IHt9IH0sIHZhbHMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zdG9yZVtrXSA9IG1lcmdlT3B0aW9ucyh0aGlzLnN0b3JlW2tdLCB2YWxzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWxzO1xuICAgIH0pO1xuICB9XG5cbiAgX3VwZGF0ZUFycmF5KHJlZjogTW9kZWxSZWZlcmVuY2UsIHJlbE5hbWU6IHN0cmluZywgaXRlbTogUmVsYXRpb25zaGlwSXRlbSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IGsgPSB0aGlzLmtleVN0cmluZyhyZWYpO1xuICAgICAgaWYgKHRoaXMuc3RvcmVba10gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLnN0b3JlW2tdID0ge1xuICAgICAgICAgIGlkOiByZWYuaWQsXG4gICAgICAgICAgdHlwZTogcmVmLnR5cGUsXG4gICAgICAgICAgYXR0cmlidXRlczoge30sXG4gICAgICAgICAgcmVsYXRpb25zaGlwczoge1xuICAgICAgICAgICAgcmVsTmFtZTogW2l0ZW1dXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIGlmICgodGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzID09PSB1bmRlZmluZWQpIHx8ICh0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0gPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RvcmVba10ucmVsYXRpb25zaGlwcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzID0ge307XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdID0gW2l0ZW1dO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgaWR4ID0gdGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLmZpbmRJbmRleCh2ID0+IHYuaWQgPT09IGl0ZW0uaWQpO1xuICAgICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgICB0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV1baWR4XSA9IGl0ZW07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnB1c2goaXRlbSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZWY7XG4gICAgfSk7XG4gIH1cblxuICBfcmVtb3ZlRnJvbUFycmF5KHJlZjogTW9kZWxSZWZlcmVuY2UsIHJlbE5hbWU6IHN0cmluZywgaXRlbTogUmVsYXRpb25zaGlwSXRlbSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IGsgPSB0aGlzLmtleVN0cmluZyhyZWYpO1xuICAgICAgaWYgKFxuICAgICAgICAodGhpcy5zdG9yZVtrXSAhPT0gdW5kZWZpbmVkKSAmJlxuICAgICAgICAodGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzICE9PSB1bmRlZmluZWQpICYmXG4gICAgICAgICh0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0gIT09IHVuZGVmaW5lZClcbiAgICAgICkge1xuICAgICAgICBjb25zdCBpZHggPSB0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0uZmluZEluZGV4KHYgPT4gdi5pZCA9PT0gaXRlbS5pZCk7XG4gICAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAgIHRoaXMuc3RvcmVba10ucmVsYXRpb25zaGlwc1tyZWxOYW1lXS5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlZjtcbiAgICB9KTtcbiAgfVxuXG4gIF9kZWwocmVmOiBNb2RlbFJlZmVyZW5jZSwgZmllbGRzOiBzdHJpbmdbXSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IGsgPSB0aGlzLmtleVN0cmluZyhyZWYpO1xuICAgICAgaWYgKHRoaXMuc3RvcmVba10pIHtcbiAgICAgICAgZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgaWYgKGZpZWxkID09PSAnYXR0cmlidXRlcycpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnN0b3JlW2tdLmF0dHJpYnV0ZXM7XG4gICAgICAgICAgfSBlbHNlIGlmIChmaWVsZCA9PT0gJ3JlbGF0aW9uc2hpcHMnKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzO1xuICAgICAgICAgIH0gZWxzZSBpZiAoKGZpZWxkLmluZGV4T2YoJ3JlbGF0aW9uc2hpcHMuJykgPT09IDApICYmICh0aGlzLnN0b3JlW2tdLnJlbGF0aW9uc2hpcHMpKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5zdG9yZVtrXS5yZWxhdGlvbnNoaXBzW2ZpZWxkLnNwbGl0KCcuJylbMV1dO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5zdG9yZVtrXTtcbiAgICB9KTtcbiAgfVxufVxuIl19
