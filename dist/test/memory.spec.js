/* eslint-env node, mocha*/
/* eslint no-shadow: 0 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var memory_1 = require("../src/storage/memory");
var storageTests_1 = require("./storageTests");
require("mocha");
storageTests_1.testSuite({
    describe: describe,
    it: it,
    before: before,
    after: after,
}, {
    ctor: memory_1.MemoryStore,
    name: 'Plump Memory Storage',
    opts: { terminal: true },
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1lbW9yeS5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDJCQUEyQjtBQUMzQix5QkFBeUI7OztBQUV6QixnREFBb0Q7QUFDcEQsK0NBQTJDO0FBRTNDLGlCQUFlO0FBRWYsd0JBQVMsQ0FBQztJQUNSLFFBQVEsRUFBRSxRQUFRO0lBQ2xCLEVBQUUsRUFBRSxFQUFFO0lBQ04sTUFBTSxFQUFFLE1BQU07SUFDZCxLQUFLLEVBQUUsS0FBSztDQUNiLEVBQUU7SUFDRCxJQUFJLEVBQUUsb0JBQVc7SUFDakIsSUFBSSxFQUFFLHNCQUFzQjtJQUM1QixJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFO0NBQ3pCLENBQUMsQ0FBQyIsImZpbGUiOiJtZW1vcnkuc3BlYy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1lbnYgbm9kZSwgbW9jaGEqL1xuLyogZXNsaW50IG5vLXNoYWRvdzogMCAqL1xuXG5pbXBvcnQgeyBNZW1vcnlTdG9yZSB9IGZyb20gJy4uL3NyYy9zdG9yYWdlL21lbW9yeSc7XG5pbXBvcnQgeyB0ZXN0U3VpdGUgfSBmcm9tICcuL3N0b3JhZ2VUZXN0cyc7XG5cbmltcG9ydCAnbW9jaGEnO1xuXG50ZXN0U3VpdGUoe1xuICBkZXNjcmliZTogZGVzY3JpYmUsXG4gIGl0OiBpdCxcbiAgYmVmb3JlOiBiZWZvcmUsXG4gIGFmdGVyOiBhZnRlcixcbn0sIHtcbiAgY3RvcjogTWVtb3J5U3RvcmUsXG4gIG5hbWU6ICdQbHVtcCBNZW1vcnkgU3RvcmFnZScsXG4gIG9wdHM6IHsgdGVybWluYWw6IHRydWUgfSxcbn0pO1xuIl19
