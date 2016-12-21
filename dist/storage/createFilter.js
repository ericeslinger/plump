'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvY3JlYXRlRmlsdGVyLmpzIl0sIm5hbWVzIjpbImNyZWF0ZUZpbHRlciIsImdldENvbXBhcmF0b3IiLCJjb21wYXJhdG9yU3RyaW5nIiwiYSIsImIiLCJoYW5kbGVXaGVyZSIsImJsb2NrRmlsdGVyIiwiYmFkIiwiQXJyYXkiLCJpc0FycmF5IiwibWFwIiwicmVkdWNlIiwicHJldiIsImN1cnIiLCJlbGVtIiwicHJvcCIsInZhbHVlIiwiY29tcGFyYXRvciIsInNsaWNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztRQXlDZ0JBLFksR0FBQUEsWTtBQXpDaEIsU0FBU0MsYUFBVCxDQUF1QkMsZ0JBQXZCLEVBQXlDO0FBQ3ZDLE1BQUlBLHFCQUFxQixHQUF6QixFQUE4QjtBQUM1QixXQUFPLFVBQUNDLENBQUQsRUFBSUMsQ0FBSjtBQUFBLGFBQVVELE1BQU1DLENBQWhCO0FBQUEsS0FBUDtBQUNELEdBRkQsTUFFTyxJQUFJRixxQkFBcUIsR0FBekIsRUFBOEI7QUFDbkMsV0FBTyxVQUFDQyxDQUFELEVBQUlDLENBQUo7QUFBQSxhQUFVRCxJQUFJQyxDQUFkO0FBQUEsS0FBUDtBQUNELEdBRk0sTUFFQSxJQUFJRixxQkFBcUIsSUFBekIsRUFBK0I7QUFDcEMsV0FBTyxVQUFDQyxDQUFELEVBQUlDLENBQUo7QUFBQSxhQUFVRCxLQUFLQyxDQUFmO0FBQUEsS0FBUDtBQUNELEdBRk0sTUFFQSxJQUFJRixxQkFBcUIsR0FBekIsRUFBOEI7QUFDbkMsV0FBTyxVQUFDQyxDQUFELEVBQUlDLENBQUo7QUFBQSxhQUFVRCxJQUFJQyxDQUFkO0FBQUEsS0FBUDtBQUNELEdBRk0sTUFFQSxJQUFJRixxQkFBcUIsSUFBekIsRUFBK0I7QUFDcEMsV0FBTyxVQUFDQyxDQUFELEVBQUlDLENBQUo7QUFBQSxhQUFVRCxLQUFLQyxDQUFmO0FBQUEsS0FBUDtBQUNELEdBRk0sTUFFQSxJQUFJRixxQkFBcUIsSUFBekIsRUFBK0I7QUFDcEMsV0FBTyxVQUFDQyxDQUFELEVBQUlDLENBQUo7QUFBQSxhQUFVRCxNQUFNQyxDQUFoQjtBQUFBLEtBQVA7QUFDRCxHQUZNLE1BRUE7QUFDTCxXQUFPLFVBQUNELENBQUQsRUFBSUMsQ0FBSjtBQUFBLGFBQVUsSUFBVjtBQUFBLEtBQVA7QUFDRDtBQUNGOztBQUVELFNBQVNDLFdBQVQsQ0FBcUJDLFdBQXJCLEVBQWtDO0FBQ2hDLE1BQUksQ0FBQ0EsWUFBWSxDQUFaLENBQUwsRUFBcUI7QUFDbkIsV0FBTyxTQUFTQyxHQUFULEdBQWU7QUFDcEIsYUFBTyxLQUFQO0FBQ0QsS0FGRDtBQUdEOztBQUVELE1BQUlDLE1BQU1DLE9BQU4sQ0FBY0gsWUFBWSxDQUFaLENBQWQsQ0FBSixFQUFtQztBQUNqQyxXQUFPQSxZQUFZSSxHQUFaLENBQWdCVixZQUFoQixFQUE4QlcsTUFBOUIsQ0FBcUMsVUFBQ0MsSUFBRCxFQUFPQyxJQUFQLEVBQWdCO0FBQzFELGFBQU8sVUFBQ0MsSUFBRDtBQUFBLGVBQVVGLEtBQUtFLElBQUwsS0FBY0QsS0FBS0MsSUFBTCxDQUF4QjtBQUFBLE9BQVA7QUFDRCxLQUZNLEVBRUosWUFBTTtBQUFFLGFBQU8sSUFBUDtBQUFjLEtBRmxCLENBQVA7QUFHRCxHQUpELE1BSU87QUFBQTtBQUNMLFVBQU1DLE9BQU9ULFlBQVksQ0FBWixDQUFiO0FBQ0EsVUFBTUosbUJBQW1CSSxZQUFZLENBQVosQ0FBekI7QUFDQSxVQUFNVSxRQUFRVixZQUFZLENBQVosQ0FBZDs7QUFFQTtBQUFBLFdBQU8sV0FBQ1EsSUFBRCxFQUFVO0FBQ2YsY0FBTUcsYUFBYWhCLGNBQWNDLGdCQUFkLENBQW5CO0FBQ0EsaUJBQU9lLFdBQVdILEtBQUtDLElBQUwsQ0FBWCxFQUF1QkMsS0FBdkIsQ0FBUDtBQUNEO0FBSEQ7QUFMSzs7QUFBQTtBQVNOO0FBQ0Y7O0FBRU0sU0FBU2hCLFlBQVQsQ0FBc0JNLFdBQXRCLEVBQW1DO0FBQ3hDLE1BQUlBLFlBQVksQ0FBWixLQUFrQkEsWUFBWSxDQUFaLE1BQW1CLE9BQXpDLEVBQWtEO0FBQ2hELFdBQU9ELFlBQVlDLFlBQVlZLEtBQVosQ0FBa0IsQ0FBbEIsQ0FBWixDQUFQO0FBQ0QsR0FGRCxNQUVPO0FBQ0wsV0FBTztBQUFBLGFBQU0sS0FBTjtBQUFBLEtBQVA7QUFDRDtBQUNGIiwiZmlsZSI6InN0b3JhZ2UvY3JlYXRlRmlsdGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZnVuY3Rpb24gZ2V0Q29tcGFyYXRvcihjb21wYXJhdG9yU3RyaW5nKSB7XG4gIGlmIChjb21wYXJhdG9yU3RyaW5nID09PSAnPScpIHtcbiAgICByZXR1cm4gKGEsIGIpID0+IGEgPT09IGI7XG4gIH0gZWxzZSBpZiAoY29tcGFyYXRvclN0cmluZyA9PT0gJz4nKSB7XG4gICAgcmV0dXJuIChhLCBiKSA9PiBhID4gYjtcbiAgfSBlbHNlIGlmIChjb21wYXJhdG9yU3RyaW5nID09PSAnPj0nKSB7XG4gICAgcmV0dXJuIChhLCBiKSA9PiBhID49IGI7XG4gIH0gZWxzZSBpZiAoY29tcGFyYXRvclN0cmluZyA9PT0gJzwnKSB7XG4gICAgcmV0dXJuIChhLCBiKSA9PiBhIDwgYjtcbiAgfSBlbHNlIGlmIChjb21wYXJhdG9yU3RyaW5nID09PSAnPD0nKSB7XG4gICAgcmV0dXJuIChhLCBiKSA9PiBhIDw9IGI7XG4gIH0gZWxzZSBpZiAoY29tcGFyYXRvclN0cmluZyA9PT0gJyE9Jykge1xuICAgIHJldHVybiAoYSwgYikgPT4gYSAhPT0gYjtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gKGEsIGIpID0+IHRydWU7XG4gIH1cbn1cblxuZnVuY3Rpb24gaGFuZGxlV2hlcmUoYmxvY2tGaWx0ZXIpIHtcbiAgaWYgKCFibG9ja0ZpbHRlclswXSkge1xuICAgIHJldHVybiBmdW5jdGlvbiBiYWQoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KGJsb2NrRmlsdGVyWzBdKSkge1xuICAgIHJldHVybiBibG9ja0ZpbHRlci5tYXAoY3JlYXRlRmlsdGVyKS5yZWR1Y2UoKHByZXYsIGN1cnIpID0+IHtcbiAgICAgIHJldHVybiAoZWxlbSkgPT4gcHJldihlbGVtKSAmJiBjdXJyKGVsZW0pO1xuICAgIH0sICgpID0+IHsgcmV0dXJuIHRydWU7IH0pO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHByb3AgPSBibG9ja0ZpbHRlclswXTtcbiAgICBjb25zdCBjb21wYXJhdG9yU3RyaW5nID0gYmxvY2tGaWx0ZXJbMV07XG4gICAgY29uc3QgdmFsdWUgPSBibG9ja0ZpbHRlclsyXTtcblxuICAgIHJldHVybiAoZWxlbSkgPT4ge1xuICAgICAgY29uc3QgY29tcGFyYXRvciA9IGdldENvbXBhcmF0b3IoY29tcGFyYXRvclN0cmluZyk7XG4gICAgICByZXR1cm4gY29tcGFyYXRvcihlbGVtW3Byb3BdLCB2YWx1ZSk7XG4gICAgfTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRmlsdGVyKGJsb2NrRmlsdGVyKSB7XG4gIGlmIChibG9ja0ZpbHRlclswXSAmJiBibG9ja0ZpbHRlclswXSA9PT0gJ3doZXJlJykge1xuICAgIHJldHVybiBoYW5kbGVXaGVyZShibG9ja0ZpbHRlci5zbGljZSgxKSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuICgpID0+IGZhbHNlO1xuICB9XG59XG4iXX0=
