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
        return Promise.resolve(Object.keys(this.store).filter(function (k) { return k.indexOf(typeName + ":") === 0; }));
    };
    MemoryStore.prototype._get = function (k) {
        if (this.store[k]) {
            return Promise.resolve(JSON.parse(this.store[k]));
        }
        else {
            return Promise.resolve(null);
        }
    };
    MemoryStore.prototype._set = function (k, v) {
        var _this = this;
        return Promise.resolve()
            .then(function () {
            _this.store[k] = JSON.stringify(v);
            return v;
        });
    };
    MemoryStore.prototype._del = function (k) {
        var _this = this;
        return Promise.resolve()
            .then(function () {
            var retVal = JSON.parse(_this.store[k]);
            delete _this.store[k];
            return retVal;
        });
    };
    return MemoryStore;
}(keyValueStore_1.KeyValueStore));
exports.MemoryStore = MemoryStore;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvbWVtb3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFnRDtBQUVoRDtJQUFpQywrQkFBYTtJQUk1QyxxQkFBWSxJQUFTO1FBQVQscUJBQUEsRUFBQSxTQUFTO1FBQXJCLFlBQ0Usa0JBQU0sSUFBSSxDQUFDLFNBQ1o7UUFKTyxXQUFLLEdBQThCLEVBQUUsQ0FBQzs7SUFJOUMsQ0FBQztJQUVELDhCQUFRLEdBQVI7UUFDRSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRUQsMkJBQUssR0FBTCxVQUFNLFFBQVE7UUFDWixNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBQyxDQUFDLElBQUssT0FBQSxDQUFDLENBQUMsT0FBTyxDQUFJLFFBQVEsTUFBRyxDQUFDLEtBQUssQ0FBQyxFQUEvQixDQUErQixDQUFDLENBQUMsQ0FBQztJQUNqRyxDQUFDO0lBRUQsMEJBQUksR0FBSixVQUFLLENBQUM7UUFDSixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsQixNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLENBQUM7SUFDSCxDQUFDO0lBRUQsMEJBQUksR0FBSixVQUFLLENBQUMsRUFBRSxDQUFDO1FBQVQsaUJBTUM7UUFMQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTthQUN2QixJQUFJLENBQUM7WUFDSixLQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNYLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELDBCQUFJLEdBQUosVUFBSyxDQUFDO1FBQU4saUJBT0M7UUFOQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTthQUN2QixJQUFJLENBQUM7WUFDSixJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6QyxPQUFPLEtBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckIsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUNoQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDSCxrQkFBQztBQUFELENBeENBLEFBd0NDLENBeENnQyw2QkFBYSxHQXdDN0M7QUF4Q1ksa0NBQVciLCJmaWxlIjoic3RvcmFnZS9tZW1vcnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBLZXlWYWx1ZVN0b3JlIH0gZnJvbSAnLi9rZXlWYWx1ZVN0b3JlJztcblxuZXhwb3J0IGNsYXNzIE1lbW9yeVN0b3JlIGV4dGVuZHMgS2V5VmFsdWVTdG9yZSB7XG5cbiAgcHJpdmF0ZSBzdG9yZToge1tpbmRleDogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuXG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIHN1cGVyKG9wdHMpO1xuICB9XG5cbiAgbG9nU3RvcmUoKSB7XG4gICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodGhpcy5zdG9yZSwgbnVsbCwgMikpO1xuICB9XG5cbiAgX2tleXModHlwZU5hbWUpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKE9iamVjdC5rZXlzKHRoaXMuc3RvcmUpLmZpbHRlcigoaykgPT4gay5pbmRleE9mKGAke3R5cGVOYW1lfTpgKSA9PT0gMCkpO1xuICB9XG5cbiAgX2dldChrKSB7XG4gICAgaWYgKHRoaXMuc3RvcmVba10pIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoSlNPTi5wYXJzZSh0aGlzLnN0b3JlW2tdKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgfVxuICB9XG5cbiAgX3NldChrLCB2KSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5zdG9yZVtrXSA9IEpTT04uc3RyaW5naWZ5KHYpO1xuICAgICAgcmV0dXJuIHY7XG4gICAgfSk7XG4gIH1cblxuICBfZGVsKGspIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCByZXRWYWwgPSBKU09OLnBhcnNlKHRoaXMuc3RvcmVba10pO1xuICAgICAgZGVsZXRlIHRoaXMuc3RvcmVba107XG4gICAgICByZXR1cm4gcmV0VmFsO1xuICAgIH0pO1xuICB9XG59XG4iXX0=
