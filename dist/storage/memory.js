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
import * as Bluebird from 'bluebird';
import { KeyValueStore } from './keyValueStore';
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
}(KeyValueStore));
export { MemoryStore };

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvbWVtb3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxPQUFPLEtBQUssUUFBUSxNQUFNLFVBQVUsQ0FBQztBQUNyQyxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFaEQ7SUFBaUMsK0JBQWE7SUFJNUMscUJBQVksSUFBUztRQUFULHFCQUFBLEVBQUEsU0FBUztRQUFyQixZQUNFLGtCQUFNLElBQUksQ0FBQyxTQUNaO1FBSk8sV0FBSyxHQUE4QixFQUFFLENBQUM7O0lBSTlDLENBQUM7SUFFRCw4QkFBUSxHQUFSO1FBQ0UsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVELDJCQUFLLEdBQUwsVUFBTSxRQUFRO1FBQ1osTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsQ0FBQyxDQUFDLE9BQU8sQ0FBSSxRQUFRLGlCQUFjLENBQUMsS0FBSyxDQUFDLEVBQTFDLENBQTBDLENBQUMsQ0FBQyxDQUFDO0lBQzdHLENBQUM7SUFFRCwwQkFBSSxHQUFKLFVBQUssQ0FBQztRQUNKLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEMsQ0FBQztJQUNILENBQUM7SUFFRCwwQkFBSSxHQUFKLFVBQUssQ0FBQyxFQUFFLENBQUM7UUFBVCxpQkFNQztRQUxDLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFO2FBQ3hCLElBQUksQ0FBQztZQUNKLEtBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ1gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsMEJBQUksR0FBSixVQUFLLENBQUM7UUFBTixpQkFPQztRQU5DLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFO2FBQ3hCLElBQUksQ0FBQztZQUNKLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLE9BQU8sS0FBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQixNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ2hCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUNILGtCQUFDO0FBQUQsQ0F4Q0EsQUF3Q0MsQ0F4Q2dDLGFBQWEsR0F3QzdDIiwiZmlsZSI6InN0b3JhZ2UvbWVtb3J5LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHsgS2V5VmFsdWVTdG9yZSB9IGZyb20gJy4va2V5VmFsdWVTdG9yZSc7XG5cbmV4cG9ydCBjbGFzcyBNZW1vcnlTdG9yZSBleHRlbmRzIEtleVZhbHVlU3RvcmUge1xuXG4gIHByaXZhdGUgc3RvcmU6IHtbaW5kZXg6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcblxuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBzdXBlcihvcHRzKTtcbiAgfVxuXG4gIGxvZ1N0b3JlKCkge1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRoaXMuc3RvcmUsIG51bGwsIDIpKTtcbiAgfVxuXG4gIF9rZXlzKHR5cGVOYW1lKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoT2JqZWN0LmtleXModGhpcy5zdG9yZSkuZmlsdGVyKChrKSA9PiBrLmluZGV4T2YoYCR7dHlwZU5hbWV9OmF0dHJpYnV0ZXM6YCkgPT09IDApKTtcbiAgfVxuXG4gIF9nZXQoaykge1xuICAgIGlmICh0aGlzLnN0b3JlW2tdKSB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShKU09OLnBhcnNlKHRoaXMuc3RvcmVba10pKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUobnVsbCk7XG4gICAgfVxuICB9XG5cbiAgX3NldChrLCB2KSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuc3RvcmVba10gPSBKU09OLnN0cmluZ2lmeSh2KTtcbiAgICAgIHJldHVybiB2O1xuICAgIH0pO1xuICB9XG5cbiAgX2RlbChrKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IHJldFZhbCA9IEpTT04ucGFyc2UodGhpcy5zdG9yZVtrXSk7XG4gICAgICBkZWxldGUgdGhpcy5zdG9yZVtrXTtcbiAgICAgIHJldHVybiByZXRWYWw7XG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==
