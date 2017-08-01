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
var memory_1 = require("./memory");
var HotCache = (function (_super) {
    __extends(HotCache, _super);
    function HotCache() {
        return _super.call(this, { terminal: false }) || this;
    }
    HotCache.prototype.hot = function (item) {
        return !!this.store[this.keyString(item)];
    };
    return HotCache;
}(memory_1.MemoryStore));
exports.HotCache = HotCache;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zdG9yYWdlL2hvdENhY2hlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUNBLG1DQUF1QztBQUV2QztJQUE4Qiw0QkFBVztJQUN2QztlQUNFLGtCQUFNLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFDRCxzQkFBRyxHQUFILFVBQUksSUFBb0I7UUFDdEIsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBQ0gsZUFBQztBQUFELENBUEEsQUFPQyxDQVA2QixvQkFBVyxHQU94QztBQVBZLDRCQUFRIiwiZmlsZSI6InN0b3JhZ2UvaG90Q2FjaGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2RlbFJlZmVyZW5jZSB9IGZyb20gJy4uL2RhdGFUeXBlcyc7XG5pbXBvcnQgeyBNZW1vcnlTdG9yZSB9IGZyb20gJy4vbWVtb3J5JztcblxuZXhwb3J0IGNsYXNzIEhvdENhY2hlIGV4dGVuZHMgTWVtb3J5U3RvcmUge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcih7IHRlcm1pbmFsOiBmYWxzZSB9KTtcbiAgfVxuICBob3QoaXRlbTogTW9kZWxSZWZlcmVuY2UpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLnN0b3JlW3RoaXMua2V5U3RyaW5nKGl0ZW0pXTtcbiAgfVxufVxuIl19
