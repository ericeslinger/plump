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
    }; // eslint-disable-line
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
      // eslint-disable-line
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvY3JlYXRlRmlsdGVyLmpzIl0sIm5hbWVzIjpbImNyZWF0ZUZpbHRlciIsImdldENvbXBhcmF0b3IiLCJjb21wYXJhdG9yU3RyaW5nIiwiYSIsImIiLCJoYW5kbGVXaGVyZSIsImJsb2NrRmlsdGVyIiwiYmFkIiwiQXJyYXkiLCJpc0FycmF5IiwibWFwIiwicmVkdWNlIiwicHJldiIsImN1cnIiLCJlbGVtIiwicHJvcCIsInZhbHVlIiwiY29tcGFyYXRvciIsInNsaWNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztRQXlDZ0JBLFksR0FBQUEsWTtBQXpDaEIsU0FBU0MsYUFBVCxDQUF1QkMsZ0JBQXZCLEVBQXlDO0FBQ3ZDLE1BQUlBLHFCQUFxQixHQUF6QixFQUE4QjtBQUM1QixXQUFPLFVBQUNDLENBQUQsRUFBSUMsQ0FBSjtBQUFBLGFBQVVELE1BQU1DLENBQWhCO0FBQUEsS0FBUDtBQUNELEdBRkQsTUFFTyxJQUFJRixxQkFBcUIsR0FBekIsRUFBOEI7QUFDbkMsV0FBTyxVQUFDQyxDQUFELEVBQUlDLENBQUo7QUFBQSxhQUFVRCxJQUFJQyxDQUFkO0FBQUEsS0FBUDtBQUNELEdBRk0sTUFFQSxJQUFJRixxQkFBcUIsSUFBekIsRUFBK0I7QUFDcEMsV0FBTyxVQUFDQyxDQUFELEVBQUlDLENBQUo7QUFBQSxhQUFVRCxLQUFLQyxDQUFmO0FBQUEsS0FBUDtBQUNELEdBRk0sTUFFQSxJQUFJRixxQkFBcUIsR0FBekIsRUFBOEI7QUFDbkMsV0FBTyxVQUFDQyxDQUFELEVBQUlDLENBQUo7QUFBQSxhQUFVRCxJQUFJQyxDQUFkO0FBQUEsS0FBUDtBQUNELEdBRk0sTUFFQSxJQUFJRixxQkFBcUIsSUFBekIsRUFBK0I7QUFDcEMsV0FBTyxVQUFDQyxDQUFELEVBQUlDLENBQUo7QUFBQSxhQUFVRCxLQUFLQyxDQUFmO0FBQUEsS0FBUDtBQUNELEdBRk0sTUFFQSxJQUFJRixxQkFBcUIsSUFBekIsRUFBK0I7QUFDcEMsV0FBTyxVQUFDQyxDQUFELEVBQUlDLENBQUo7QUFBQSxhQUFVRCxNQUFNQyxDQUFoQjtBQUFBLEtBQVA7QUFDRCxHQUZNLE1BRUE7QUFDTCxXQUFPLFVBQUNELENBQUQsRUFBSUMsQ0FBSjtBQUFBLGFBQVUsSUFBVjtBQUFBLEtBQVAsQ0FESyxDQUNrQjtBQUN4QjtBQUNGOztBQUVELFNBQVNDLFdBQVQsQ0FBcUJDLFdBQXJCLEVBQWtDO0FBQ2hDLE1BQUksQ0FBQ0EsWUFBWSxDQUFaLENBQUwsRUFBcUI7QUFDbkIsV0FBTyxTQUFTQyxHQUFULEdBQWU7QUFDcEIsYUFBTyxLQUFQO0FBQ0QsS0FGRDtBQUdEOztBQUVELE1BQUlDLE1BQU1DLE9BQU4sQ0FBY0gsWUFBWSxDQUFaLENBQWQsQ0FBSixFQUFtQztBQUNqQyxXQUFPQSxZQUFZSSxHQUFaLENBQWdCVixZQUFoQixFQUE4QlcsTUFBOUIsQ0FBcUMsVUFBQ0MsSUFBRCxFQUFPQyxJQUFQLEVBQWdCO0FBQUU7QUFDNUQsYUFBTyxVQUFDQyxJQUFEO0FBQUEsZUFBVUYsS0FBS0UsSUFBTCxLQUFjRCxLQUFLQyxJQUFMLENBQXhCO0FBQUEsT0FBUDtBQUNELEtBRk0sRUFFSixZQUFNO0FBQUUsYUFBTyxJQUFQO0FBQWMsS0FGbEIsQ0FBUDtBQUdELEdBSkQsTUFJTztBQUFBO0FBQ0wsVUFBTUMsT0FBT1QsWUFBWSxDQUFaLENBQWI7QUFDQSxVQUFNSixtQkFBbUJJLFlBQVksQ0FBWixDQUF6QjtBQUNBLFVBQU1VLFFBQVFWLFlBQVksQ0FBWixDQUFkOztBQUVBO0FBQUEsV0FBTyxXQUFDUSxJQUFELEVBQVU7QUFDZixjQUFNRyxhQUFhaEIsY0FBY0MsZ0JBQWQsQ0FBbkI7QUFDQSxpQkFBT2UsV0FBV0gsS0FBS0MsSUFBTCxDQUFYLEVBQXVCQyxLQUF2QixDQUFQO0FBQ0Q7QUFIRDtBQUxLOztBQUFBO0FBU047QUFDRjs7QUFFTSxTQUFTaEIsWUFBVCxDQUFzQk0sV0FBdEIsRUFBbUM7QUFDeEMsTUFBSUEsWUFBWSxDQUFaLEtBQWtCQSxZQUFZLENBQVosTUFBbUIsT0FBekMsRUFBa0Q7QUFDaEQsV0FBT0QsWUFBWUMsWUFBWVksS0FBWixDQUFrQixDQUFsQixDQUFaLENBQVA7QUFDRCxHQUZELE1BRU87QUFDTCxXQUFPO0FBQUEsYUFBTSxLQUFOO0FBQUEsS0FBUDtBQUNEO0FBQ0YiLCJmaWxlIjoic3RvcmFnZS9jcmVhdGVGaWx0ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBnZXRDb21wYXJhdG9yKGNvbXBhcmF0b3JTdHJpbmcpIHtcbiAgaWYgKGNvbXBhcmF0b3JTdHJpbmcgPT09ICc9Jykge1xuICAgIHJldHVybiAoYSwgYikgPT4gYSA9PT0gYjtcbiAgfSBlbHNlIGlmIChjb21wYXJhdG9yU3RyaW5nID09PSAnPicpIHtcbiAgICByZXR1cm4gKGEsIGIpID0+IGEgPiBiO1xuICB9IGVsc2UgaWYgKGNvbXBhcmF0b3JTdHJpbmcgPT09ICc+PScpIHtcbiAgICByZXR1cm4gKGEsIGIpID0+IGEgPj0gYjtcbiAgfSBlbHNlIGlmIChjb21wYXJhdG9yU3RyaW5nID09PSAnPCcpIHtcbiAgICByZXR1cm4gKGEsIGIpID0+IGEgPCBiO1xuICB9IGVsc2UgaWYgKGNvbXBhcmF0b3JTdHJpbmcgPT09ICc8PScpIHtcbiAgICByZXR1cm4gKGEsIGIpID0+IGEgPD0gYjtcbiAgfSBlbHNlIGlmIChjb21wYXJhdG9yU3RyaW5nID09PSAnIT0nKSB7XG4gICAgcmV0dXJuIChhLCBiKSA9PiBhICE9PSBiO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAoYSwgYikgPT4gdHJ1ZTsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICB9XG59XG5cbmZ1bmN0aW9uIGhhbmRsZVdoZXJlKGJsb2NrRmlsdGVyKSB7XG4gIGlmICghYmxvY2tGaWx0ZXJbMF0pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gYmFkKCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShibG9ja0ZpbHRlclswXSkpIHtcbiAgICByZXR1cm4gYmxvY2tGaWx0ZXIubWFwKGNyZWF0ZUZpbHRlcikucmVkdWNlKChwcmV2LCBjdXJyKSA9PiB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgIHJldHVybiAoZWxlbSkgPT4gcHJldihlbGVtKSAmJiBjdXJyKGVsZW0pO1xuICAgIH0sICgpID0+IHsgcmV0dXJuIHRydWU7IH0pO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHByb3AgPSBibG9ja0ZpbHRlclswXTtcbiAgICBjb25zdCBjb21wYXJhdG9yU3RyaW5nID0gYmxvY2tGaWx0ZXJbMV07XG4gICAgY29uc3QgdmFsdWUgPSBibG9ja0ZpbHRlclsyXTtcblxuICAgIHJldHVybiAoZWxlbSkgPT4ge1xuICAgICAgY29uc3QgY29tcGFyYXRvciA9IGdldENvbXBhcmF0b3IoY29tcGFyYXRvclN0cmluZyk7XG4gICAgICByZXR1cm4gY29tcGFyYXRvcihlbGVtW3Byb3BdLCB2YWx1ZSk7XG4gICAgfTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRmlsdGVyKGJsb2NrRmlsdGVyKSB7XG4gIGlmIChibG9ja0ZpbHRlclswXSAmJiBibG9ja0ZpbHRlclswXSA9PT0gJ3doZXJlJykge1xuICAgIHJldHVybiBoYW5kbGVXaGVyZShibG9ja0ZpbHRlci5zbGljZSgxKSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuICgpID0+IGZhbHNlO1xuICB9XG59XG4iXX0=
