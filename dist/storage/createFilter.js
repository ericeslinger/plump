"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        return function () { return true; };
    }
    if (Array.isArray(blockFilter[0])) {
        return blockFilter.map(createFilter).reduce(function (prev, curr) {
            return function (elem) { return prev(elem) && curr(elem); };
        }, function () { return true; });
    }
    else {
        var properties_1 = blockFilter[0].split('.');
        var comparatorString = blockFilter[1];
        var expected_1 = blockFilter[2];
        var comparator_1 = getComparator(comparatorString);
        return function (elem) {
            var actual = properties_1.reduce(function (level, key) { return level ? level[key] : undefined; }, elem);
            return comparator_1(actual, expected_1);
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
