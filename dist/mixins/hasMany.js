"use strict";

function hasMany(options) {
    return function (model, member) {
        console.log('hasMany decorator called');
        console.log(model);
        console.log(member);
    };
}
exports.hasMany = hasMany;