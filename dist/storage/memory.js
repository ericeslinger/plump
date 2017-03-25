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
        return Bluebird.resolve(Object.keys(this.store).filter(function (k) { return k.indexOf(typeName + ":") === 0; }));
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvbWVtb3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLG1DQUFxQztBQUNyQyxpREFBZ0Q7QUFFaEQ7SUFBaUMsK0JBQWE7SUFJNUMscUJBQVksSUFBUztRQUFULHFCQUFBLEVBQUEsU0FBUztRQUFyQixZQUNFLGtCQUFNLElBQUksQ0FBQyxTQUNaO1FBSk8sV0FBSyxHQUE4QixFQUFFLENBQUM7O0lBSTlDLENBQUM7SUFFRCw4QkFBUSxHQUFSO1FBQ0UsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVELDJCQUFLLEdBQUwsVUFBTSxRQUFRO1FBQ1osTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsQ0FBQyxDQUFDLE9BQU8sQ0FBSSxRQUFRLE1BQUcsQ0FBQyxLQUFLLENBQUMsRUFBL0IsQ0FBK0IsQ0FBQyxDQUFDLENBQUM7SUFDbEcsQ0FBQztJQUVELDBCQUFJLEdBQUosVUFBSyxDQUFDO1FBQ0osRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyRCxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoQyxDQUFDO0lBQ0gsQ0FBQztJQUVELDBCQUFJLEdBQUosVUFBSyxDQUFDLEVBQUUsQ0FBQztRQUFULGlCQU1DO1FBTEMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUU7YUFDeEIsSUFBSSxDQUFDO1lBQ0osS0FBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDWCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCwwQkFBSSxHQUFKLFVBQUssQ0FBQztRQUFOLGlCQU9DO1FBTkMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUU7YUFDeEIsSUFBSSxDQUFDO1lBQ0osSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekMsT0FBTyxLQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDaEIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBQ0gsa0JBQUM7QUFBRCxDQXhDQSxBQXdDQyxDQXhDZ0MsNkJBQWEsR0F3QzdDO0FBeENZLGtDQUFXIiwiZmlsZSI6InN0b3JhZ2UvbWVtb3J5LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHsgS2V5VmFsdWVTdG9yZSB9IGZyb20gJy4va2V5VmFsdWVTdG9yZSc7XG5cbmV4cG9ydCBjbGFzcyBNZW1vcnlTdG9yZSBleHRlbmRzIEtleVZhbHVlU3RvcmUge1xuXG4gIHByaXZhdGUgc3RvcmU6IHtbaW5kZXg6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcblxuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBzdXBlcihvcHRzKTtcbiAgfVxuXG4gIGxvZ1N0b3JlKCkge1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRoaXMuc3RvcmUsIG51bGwsIDIpKTtcbiAgfVxuXG4gIF9rZXlzKHR5cGVOYW1lKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoT2JqZWN0LmtleXModGhpcy5zdG9yZSkuZmlsdGVyKChrKSA9PiBrLmluZGV4T2YoYCR7dHlwZU5hbWV9OmApID09PSAwKSk7XG4gIH1cblxuICBfZ2V0KGspIHtcbiAgICBpZiAodGhpcy5zdG9yZVtrXSkge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoSlNPTi5wYXJzZSh0aGlzLnN0b3JlW2tdKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIF9zZXQoaywgdikge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLnN0b3JlW2tdID0gSlNPTi5zdHJpbmdpZnkodik7XG4gICAgICByZXR1cm4gdjtcbiAgICB9KTtcbiAgfVxuXG4gIF9kZWwoaykge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCByZXRWYWwgPSBKU09OLnBhcnNlKHRoaXMuc3RvcmVba10pO1xuICAgICAgZGVsZXRlIHRoaXMuc3RvcmVba107XG4gICAgICByZXR1cm4gcmV0VmFsO1xuICAgIH0pO1xuICB9XG59XG4iXX0=
