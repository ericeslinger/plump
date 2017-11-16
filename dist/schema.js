"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Schema = Schema;
function Schema(s) {
    return function annotate(target) {
        target.type = s.name;
        target.schema = s;
        return target;
    };
}