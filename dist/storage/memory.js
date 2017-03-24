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
        return Promise.resolve(Object.keys(this.store).filter(function (k) { return k.indexOf(typeName + ":attributes:") === 0; }));
    };
    MemoryStore.prototype._get = function (k) {
        return Promise.resolve(this.store[k] || null);
    };
    MemoryStore.prototype._set = function (k, v) {
        var _this = this;
        return Promise.resolve()
            .then(function () {
            _this.store[k] = v;
        });
    };
    MemoryStore.prototype._del = function (k) {
        var _this = this;
        return Promise.resolve()
            .then(function () {
            var retVal = _this.store[k];
            delete _this.store[k];
            return retVal;
        });
    };
    return MemoryStore;
}(KeyValueStore));
export { MemoryStore };

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvbWVtb3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxPQUFPLEtBQUssT0FBTyxNQUFNLFVBQVUsQ0FBQztBQUNwQyxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFaEQ7SUFBaUMsK0JBQWE7SUFJNUMscUJBQVksSUFBUztRQUFULHFCQUFBLEVBQUEsU0FBUztRQUFyQixZQUNFLGtCQUFNLElBQUksQ0FBQyxTQUNaO1FBSk8sV0FBSyxHQUFHLEVBQUUsQ0FBQzs7SUFJbkIsQ0FBQztJQUVELDhCQUFRLEdBQVI7UUFDRSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRUQsMkJBQUssR0FBTCxVQUFNLFFBQVE7UUFDWixNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBQyxDQUFDLElBQUssT0FBQSxDQUFDLENBQUMsT0FBTyxDQUFJLFFBQVEsaUJBQWMsQ0FBQyxLQUFLLENBQUMsRUFBMUMsQ0FBMEMsQ0FBQyxDQUFDLENBQUM7SUFDNUcsQ0FBQztJQUVELDBCQUFJLEdBQUosVUFBSyxDQUFDO1FBQ0osTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQztJQUNoRCxDQUFDO0lBRUQsMEJBQUksR0FBSixVQUFLLENBQUMsRUFBRSxDQUFDO1FBQVQsaUJBS0M7UUFKQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTthQUN2QixJQUFJLENBQUM7WUFDSixLQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNwQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCwwQkFBSSxHQUFKLFVBQUssQ0FBQztRQUFOLGlCQU9DO1FBTkMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUU7YUFDdkIsSUFBSSxDQUFDO1lBQ0osSUFBTSxNQUFNLEdBQUcsS0FBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QixPQUFPLEtBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckIsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUNoQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDSCxrQkFBQztBQUFELENBbkNBLEFBbUNDLENBbkNnQyxhQUFhLEdBbUM3QyIsImZpbGUiOiJzdG9yYWdlL21lbW9yeS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHsgS2V5VmFsdWVTdG9yZSB9IGZyb20gJy4va2V5VmFsdWVTdG9yZSc7XG5cbmV4cG9ydCBjbGFzcyBNZW1vcnlTdG9yZSBleHRlbmRzIEtleVZhbHVlU3RvcmUge1xuXG4gIHByaXZhdGUgc3RvcmUgPSB7fTtcblxuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBzdXBlcihvcHRzKTtcbiAgfVxuXG4gIGxvZ1N0b3JlKCkge1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRoaXMuc3RvcmUsIG51bGwsIDIpKTtcbiAgfVxuXG4gIF9rZXlzKHR5cGVOYW1lKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShPYmplY3Qua2V5cyh0aGlzLnN0b3JlKS5maWx0ZXIoKGspID0+IGsuaW5kZXhPZihgJHt0eXBlTmFtZX06YXR0cmlidXRlczpgKSA9PT0gMCkpO1xuICB9XG5cbiAgX2dldChrKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLnN0b3JlW2tdIHx8IG51bGwpO1xuICB9XG5cbiAgX3NldChrLCB2KSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5zdG9yZVtrXSA9IHY7XG4gICAgfSk7XG4gIH1cblxuICBfZGVsKGspIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCByZXRWYWwgPSB0aGlzLnN0b3JlW2tdO1xuICAgICAgZGVsZXRlIHRoaXMuc3RvcmVba107XG4gICAgICByZXR1cm4gcmV0VmFsO1xuICAgIH0pO1xuICB9XG59XG4iXX0=
