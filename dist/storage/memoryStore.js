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
import * as Promise from 'bluebird';
import { KeyValueStore } from './keyValueStore';
var $store = Symbol('$store');
var MemoryStore = (function (_super) {
    __extends(MemoryStore, _super);
    function MemoryStore(opts) {
        if (opts === void 0) { opts = {}; }
        var _this = _super.call(this, opts) || this;
        _this[$store] = {};
        return _this;
    }
    MemoryStore.prototype.logStore = function () {
        console.log(JSON.stringify(this[$store], null, 2));
    };
    MemoryStore.prototype._keys = function (typeName) {
        return Promise.resolve(Object.keys(this[$store]).filter(function (k) { return k.indexOf(typeName + ":attributes:") === 0; }));
    };
    MemoryStore.prototype._get = function (k) {
        return Promise.resolve(this[$store][k] || null);
    };
    MemoryStore.prototype._set = function (k, v) {
        var _this = this;
        return Promise.resolve()
            .then(function () {
            _this[$store][k] = v;
        });
    };
    MemoryStore.prototype._del = function (k) {
        var _this = this;
        return Promise.resolve()
            .then(function () {
            var retVal = _this[$store][k];
            delete _this[$store][k];
            return retVal;
        });
    };
    return MemoryStore;
}(KeyValueStore));
export { MemoryStore };

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvbWVtb3J5U3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLE9BQU8sS0FBSyxPQUFPLE1BQU0sVUFBVSxDQUFDO0FBQ3BDLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUVoRCxJQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7QUFFaEM7SUFBaUMsK0JBQWE7SUFDNUMscUJBQVksSUFBYztRQUFkLHFCQUFBLEVBQUEsU0FBYztRQUExQixZQUNFLGtCQUFNLElBQUksQ0FBQyxTQUVaO1FBREMsS0FBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQzs7SUFDcEIsQ0FBQztJQUVELDhCQUFRLEdBQVI7UUFDRSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFFRCwyQkFBSyxHQUFMLFVBQU0sUUFBUTtRQUNaLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsQ0FBQyxDQUFDLE9BQU8sQ0FBSSxRQUFRLGlCQUFjLENBQUMsS0FBSyxDQUFDLEVBQTFDLENBQTBDLENBQUMsQ0FBQyxDQUFDO0lBQzlHLENBQUM7SUFFRCwwQkFBSSxHQUFKLFVBQUssQ0FBQztRQUNKLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRUQsMEJBQUksR0FBSixVQUFLLENBQUMsRUFBRSxDQUFDO1FBQVQsaUJBS0M7UUFKQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTthQUN2QixJQUFJLENBQUM7WUFDSixLQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELDBCQUFJLEdBQUosVUFBSyxDQUFDO1FBQU4saUJBT0M7UUFOQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTthQUN2QixJQUFJLENBQUM7WUFDSixJQUFNLE1BQU0sR0FBRyxLQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0IsT0FBTyxLQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkIsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUNoQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDSCxrQkFBQztBQUFELENBakNBLEFBaUNDLENBakNnQyxhQUFhLEdBaUM3QyIsImZpbGUiOiJzdG9yYWdlL21lbW9yeVN0b3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBLZXlWYWx1ZVN0b3JlIH0gZnJvbSAnLi9rZXlWYWx1ZVN0b3JlJztcblxuY29uc3QgJHN0b3JlID0gU3ltYm9sKCckc3RvcmUnKTtcblxuZXhwb3J0IGNsYXNzIE1lbW9yeVN0b3JlIGV4dGVuZHMgS2V5VmFsdWVTdG9yZSB7XG4gIGNvbnN0cnVjdG9yKG9wdHM6IGFueSA9IHt9KSB7XG4gICAgc3VwZXIob3B0cyk7XG4gICAgdGhpc1skc3RvcmVdID0ge307XG4gIH1cblxuICBsb2dTdG9yZSgpIHtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh0aGlzWyRzdG9yZV0sIG51bGwsIDIpKTtcbiAgfVxuXG4gIF9rZXlzKHR5cGVOYW1lKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShPYmplY3Qua2V5cyh0aGlzWyRzdG9yZV0pLmZpbHRlcigoaykgPT4gay5pbmRleE9mKGAke3R5cGVOYW1lfTphdHRyaWJ1dGVzOmApID09PSAwKSk7XG4gIH1cblxuICBfZ2V0KGspIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXNbJHN0b3JlXVtrXSB8fCBudWxsKTtcbiAgfVxuXG4gIF9zZXQoaywgdikge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIHRoaXNbJHN0b3JlXVtrXSA9IHY7XG4gICAgfSk7XG4gIH1cblxuICBfZGVsKGspIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCByZXRWYWwgPSB0aGlzWyRzdG9yZV1ba107XG4gICAgICBkZWxldGUgdGhpc1skc3RvcmVdW2tdO1xuICAgICAgcmV0dXJuIHJldFZhbDtcbiAgICB9KTtcbiAgfVxufVxuIl19
