"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = unwrap;
function unwrap(value) {
  var valueStore = {};
  Object.keys(value.constructor.$fields).forEach(function (fieldName) {
    var field = value.constructor.$fields[fieldName];
    Object.defineProperty(valueStore, fieldName, {});
  });
}