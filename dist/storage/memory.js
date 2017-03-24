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
var keyValueStore_1 = require("./keyValueStore");
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
        return Bluebird.resolve(Object.keys(this.store).filter(function (k) { return k.indexOf(typeName + ":attributes:") === 0; }));
    };
    MemoryStore.prototype._get = function (k) {
        if (this.store[k]) {
            return Bluebird.resolve(JSON.parse(this.store[k]));
        }
        else {
            return Bluebird.resolve(null);
        }
    };
    MemoryStore.prototype._set = function (k, v) {
        var _this = this;
        return Bluebird.resolve()
            .then(function () {
            _this.store[k] = JSON.stringify(v);
            return v;
        });
    };
    MemoryStore.prototype._del = function (k) {
        var _this = this;
        return Bluebird.resolve()
            .then(function () {
            var retVal = JSON.parse(_this.store[k]);
            delete _this.store[k];
            return retVal;
        });
    };
    return MemoryStore;
}(keyValueStore_1.KeyValueStore));
exports.MemoryStore = MemoryStore;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvbWVtb3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLG1DQUFxQztBQUNyQyxpREFBZ0Q7QUFFaEQ7SUFBaUMsK0JBQWE7SUFJNUMscUJBQVksSUFBUztRQUFULHFCQUFBLEVBQUEsU0FBUztRQUFyQixZQUNFLGtCQUFNLElBQUksQ0FBQyxTQUNaO1FBSk8sV0FBSyxHQUE4QixFQUFFLENBQUM7O0lBSTlDLENBQUM7SUFFRCw4QkFBUSxHQUFSO1FBQ0UsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVELDJCQUFLLEdBQUwsVUFBTSxRQUFRO1FBQ1osTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsQ0FBQyxDQUFDLE9BQU8sQ0FBSSxRQUFRLGlCQUFjLENBQUMsS0FBSyxDQUFDLEVBQTFDLENBQTBDLENBQUMsQ0FBQyxDQUFDO0lBQzdHLENBQUM7SUFFRCwwQkFBSSxHQUFKLFVBQUssQ0FBQztRQUNKLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEMsQ0FBQztJQUNILENBQUM7SUFFRCwwQkFBSSxHQUFKLFVBQUssQ0FBQyxFQUFFLENBQUM7UUFBVCxpQkFNQztRQUxDLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFO2FBQ3hCLElBQUksQ0FBQztZQUNKLEtBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ1gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsMEJBQUksR0FBSixVQUFLLENBQUM7UUFBTixpQkFPQztRQU5DLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFO2FBQ3hCLElBQUksQ0FBQztZQUNKLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLE9BQU8sS0FBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQixNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ2hCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUNILGtCQUFDO0FBQUQsQ0F4Q0EsQUF3Q0MsQ0F4Q2dDLDZCQUFhLEdBd0M3QztBQXhDWSxrQ0FBVyIsImZpbGUiOiJzdG9yYWdlL21lbW9yeS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IEtleVZhbHVlU3RvcmUgfSBmcm9tICcuL2tleVZhbHVlU3RvcmUnO1xuXG5leHBvcnQgY2xhc3MgTWVtb3J5U3RvcmUgZXh0ZW5kcyBLZXlWYWx1ZVN0b3JlIHtcblxuICBwcml2YXRlIHN0b3JlOiB7W2luZGV4OiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG5cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgc3VwZXIob3B0cyk7XG4gIH1cblxuICBsb2dTdG9yZSgpIHtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh0aGlzLnN0b3JlLCBudWxsLCAyKSk7XG4gIH1cblxuICBfa2V5cyh0eXBlTmFtZSkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKE9iamVjdC5rZXlzKHRoaXMuc3RvcmUpLmZpbHRlcigoaykgPT4gay5pbmRleE9mKGAke3R5cGVOYW1lfTphdHRyaWJ1dGVzOmApID09PSAwKSk7XG4gIH1cblxuICBfZ2V0KGspIHtcbiAgICBpZiAodGhpcy5zdG9yZVtrXSkge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoSlNPTi5wYXJzZSh0aGlzLnN0b3JlW2tdKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIF9zZXQoaywgdikge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLnN0b3JlW2tdID0gSlNPTi5zdHJpbmdpZnkodik7XG4gICAgICByZXR1cm4gdjtcbiAgICB9KTtcbiAgfVxuXG4gIF9kZWwoaykge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCByZXRWYWwgPSBKU09OLnBhcnNlKHRoaXMuc3RvcmVba10pO1xuICAgICAgZGVsZXRlIHRoaXMuc3RvcmVba107XG4gICAgICByZXR1cm4gcmV0VmFsO1xuICAgIH0pO1xuICB9XG59XG4iXX0=
