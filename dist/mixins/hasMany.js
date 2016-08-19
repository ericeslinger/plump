"use strict";

var common_1 = require('./common');
function hasMany(options) {
    return function (model, member) {
        console.log('hasMany decorator called');
        console.log(model);
        console.log(member);
        common_1.ensureStorage(model);
    };
}
exports.hasMany = hasMany;