"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var __decorate = undefined && undefined.__decorate || function (decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
        d;
    if ((typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
        if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    }return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var hasMany_1 = require('./mixins/hasMany');

var TestAnnotation = function TestAnnotation(o) {
    _classCallCheck(this, TestAnnotation);

    this.otherGuys = o;
};

__decorate([hasMany_1.hasMany({
    modelTable: 'other_guys'
})], TestAnnotation.prototype, "otherGuys", void 0);
exports.TestAnnotation = TestAnnotation;
function go() {
    var ta = new TestAnnotation('foobar');
    console.log(JSON.stringify(ta));
}
exports.go = go;