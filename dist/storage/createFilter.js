"use strict";
function getComparator(comparatorString) {
    if (comparatorString === '=') {
        return function (a, b) { return a === b; };
    }
    else if (comparatorString === '>') {
        return function (a, b) { return a > b; };
    }
    else if (comparatorString === '>=') {
        return function (a, b) { return a >= b; };
    }
    else if (comparatorString === '<') {
        return function (a, b) { return a < b; };
    }
    else if (comparatorString === '<=') {
        return function (a, b) { return a <= b; };
    }
    else if (comparatorString === '!=') {
        return function (a, b) { return a !== b; };
    }
    else {
        return function (a, b) { return true; };
    }
}
function handleWhere(blockFilter) {
    if (!blockFilter[0]) {
        return function bad() {
            return false;
        };
    }
    if (Array.isArray(blockFilter[0])) {
        return blockFilter.map(createFilter).reduce(function (prev, curr) {
            return function (elem) { return prev(elem) && curr(elem); };
        }, function () { return true; });
    }
    else {
        var prop_1 = blockFilter[0];
        var comparatorString_1 = blockFilter[1];
        var value_1 = blockFilter[2];
        return function (elem) {
            var comparator = getComparator(comparatorString_1);
            return comparator(elem[prop_1], value_1);
        };
    }
}
function createFilter(blockFilter) {
    if (blockFilter[0] && blockFilter[0] === 'where') {
        return handleWhere(blockFilter.slice(1));
    }
    else {
        return function () { return false; };
    }
}
exports.createFilter = createFilter;
