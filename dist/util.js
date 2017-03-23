"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var merge_options_1 = require("merge-options");
function validateInput(type, value) {
    var retVal = { type: value.type, id: value.id, attributes: {}, relationships: {} };
    var typeAttrs = Object.keys(type.$schema.attributes || {});
    var valAttrs = Object.keys(value.attributes || {});
    var typeRels = Object.keys(type.$schema.relationships || {});
    var valRels = Object.keys(value.relationships || {});
    var invalidAttrs = valAttrs.filter(function (item) { return typeAttrs.indexOf(item) < 0; });
    var invalidRels = valRels.filter(function (item) { return typeRels.indexOf(item) < 0; });
    if (invalidAttrs.length > 0) {
        throw new Error("Invalid attributes on value object: " + JSON.stringify(invalidAttrs));
    }
    if (invalidRels.length > 0) {
        throw new Error("Invalid relationships on value object: " + JSON.stringify(invalidRels));
    }
    for (var attrName in type.$schema.attributes) {
        if (!value.attributes[attrName] && (type.$schema.attributes[attrName].default !== undefined)) {
            if (Array.isArray(type.$schema.attributes[attrName].default)) {
                retVal.attributes[attrName] = type.$schema.attributes[attrName].default.concat();
            }
            else if (typeof type.$schema.attributes[attrName].default === 'object') {
                retVal.attributes[attrName] = Object.assign({}, type.$schema.attributes[attrName].default);
            }
            else {
                retVal.attributes[attrName] = type.$schema.attributes[attrName].default;
            }
        }
    }
    for (var relName in type.$schema.relationships) {
        if (value.relationships && value.relationships[relName] && !Array.isArray(value.relationships[relName])) {
            throw new Error("relation " + relName + " is not an array");
        }
    }
    return merge_options_1.default({}, value, retVal);
}
exports.validateInput = validateInput;
