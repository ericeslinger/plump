'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.createFilter = createFilter;
function getComparator(comparatorString) {
  if (comparatorString === '=') {
    return function (a, b) {
      return a === b;
    };
  } else if (comparatorString === '>') {
    return function (a, b) {
      return a > b;
    };
  } else if (comparatorString === '>=') {
    return function (a, b) {
      return a >= b;
    };
  } else if (comparatorString === '<') {
    return function (a, b) {
      return a < b;
    };
  } else if (comparatorString === '<=') {
    return function (a, b) {
      return a <= b;
    };
  } else if (comparatorString === '!=') {
    return function (a, b) {
      return a !== b;
    };
  } else {
    return function (a, b) {
      return true;
    };
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
      return function (elem) {
        return prev(elem) && curr(elem);
      };
    }, function () {
      return true;
    });
  } else {
    var _ret = function () {
      var prop = blockFilter[0];
      var comparatorString = blockFilter[1];
      var value = blockFilter[2];

      return {
        v: function v(elem) {
          var comparator = getComparator(comparatorString);
          return comparator(elem[prop], value);
        }
      };
    }();

    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
  }
}

function createFilter(blockFilter) {
  if (blockFilter[0] && blockFilter[0] === 'where') {
    return handleWhere(blockFilter.slice(1));
  } else {
    return function () {
      return false;
    };
  }
}