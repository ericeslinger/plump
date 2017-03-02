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
    return function () {
      return true;
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
      var properties = blockFilter[0].split('.');
      var comparatorString = blockFilter[1];
      var expected = blockFilter[2];
      var comparator = getComparator(comparatorString);

      return {
        v: function v(elem) {
          var actual = properties.reduce(function (level, key) {
            return level ? level[key] : undefined;
          }, elem);
          return comparator(actual, expected);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvY3JlYXRlRmlsdGVyLmpzIl0sIm5hbWVzIjpbImNyZWF0ZUZpbHRlciIsImdldENvbXBhcmF0b3IiLCJjb21wYXJhdG9yU3RyaW5nIiwiYSIsImIiLCJoYW5kbGVXaGVyZSIsImJsb2NrRmlsdGVyIiwiQXJyYXkiLCJpc0FycmF5IiwibWFwIiwicmVkdWNlIiwicHJldiIsImN1cnIiLCJlbGVtIiwicHJvcGVydGllcyIsInNwbGl0IiwiZXhwZWN0ZWQiLCJjb21wYXJhdG9yIiwiYWN0dWFsIiwibGV2ZWwiLCJrZXkiLCJ1bmRlZmluZWQiLCJzbGljZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7UUF3Q2dCQSxZLEdBQUFBLFk7QUF4Q2hCLFNBQVNDLGFBQVQsQ0FBdUJDLGdCQUF2QixFQUF5QztBQUN2QyxNQUFJQSxxQkFBcUIsR0FBekIsRUFBOEI7QUFDNUIsV0FBTyxVQUFDQyxDQUFELEVBQUlDLENBQUo7QUFBQSxhQUFVRCxNQUFNQyxDQUFoQjtBQUFBLEtBQVA7QUFDRCxHQUZELE1BRU8sSUFBSUYscUJBQXFCLEdBQXpCLEVBQThCO0FBQ25DLFdBQU8sVUFBQ0MsQ0FBRCxFQUFJQyxDQUFKO0FBQUEsYUFBVUQsSUFBSUMsQ0FBZDtBQUFBLEtBQVA7QUFDRCxHQUZNLE1BRUEsSUFBSUYscUJBQXFCLElBQXpCLEVBQStCO0FBQ3BDLFdBQU8sVUFBQ0MsQ0FBRCxFQUFJQyxDQUFKO0FBQUEsYUFBVUQsS0FBS0MsQ0FBZjtBQUFBLEtBQVA7QUFDRCxHQUZNLE1BRUEsSUFBSUYscUJBQXFCLEdBQXpCLEVBQThCO0FBQ25DLFdBQU8sVUFBQ0MsQ0FBRCxFQUFJQyxDQUFKO0FBQUEsYUFBVUQsSUFBSUMsQ0FBZDtBQUFBLEtBQVA7QUFDRCxHQUZNLE1BRUEsSUFBSUYscUJBQXFCLElBQXpCLEVBQStCO0FBQ3BDLFdBQU8sVUFBQ0MsQ0FBRCxFQUFJQyxDQUFKO0FBQUEsYUFBVUQsS0FBS0MsQ0FBZjtBQUFBLEtBQVA7QUFDRCxHQUZNLE1BRUEsSUFBSUYscUJBQXFCLElBQXpCLEVBQStCO0FBQ3BDLFdBQU8sVUFBQ0MsQ0FBRCxFQUFJQyxDQUFKO0FBQUEsYUFBVUQsTUFBTUMsQ0FBaEI7QUFBQSxLQUFQO0FBQ0QsR0FGTSxNQUVBO0FBQ0wsV0FBTyxVQUFDRCxDQUFELEVBQUlDLENBQUo7QUFBQSxhQUFVLElBQVY7QUFBQSxLQUFQLENBREssQ0FDa0I7QUFDeEI7QUFDRjs7QUFFRCxTQUFTQyxXQUFULENBQXFCQyxXQUFyQixFQUFrQztBQUNoQyxNQUFJLENBQUNBLFlBQVksQ0FBWixDQUFMLEVBQXFCO0FBQ25CLFdBQU87QUFBQSxhQUFNLElBQU47QUFBQSxLQUFQO0FBQ0Q7O0FBRUQsTUFBSUMsTUFBTUMsT0FBTixDQUFjRixZQUFZLENBQVosQ0FBZCxDQUFKLEVBQW1DO0FBQ2pDLFdBQU9BLFlBQVlHLEdBQVosQ0FBZ0JULFlBQWhCLEVBQThCVSxNQUE5QixDQUFxQyxVQUFDQyxJQUFELEVBQU9DLElBQVAsRUFBZ0I7QUFBRTtBQUM1RCxhQUFPLFVBQUNDLElBQUQ7QUFBQSxlQUFVRixLQUFLRSxJQUFMLEtBQWNELEtBQUtDLElBQUwsQ0FBeEI7QUFBQSxPQUFQO0FBQ0QsS0FGTSxFQUVKO0FBQUEsYUFBTSxJQUFOO0FBQUEsS0FGSSxDQUFQO0FBR0QsR0FKRCxNQUlPO0FBQUE7QUFDTCxVQUFNQyxhQUFhUixZQUFZLENBQVosRUFBZVMsS0FBZixDQUFxQixHQUFyQixDQUFuQjtBQUNBLFVBQU1iLG1CQUFtQkksWUFBWSxDQUFaLENBQXpCO0FBQ0EsVUFBTVUsV0FBV1YsWUFBWSxDQUFaLENBQWpCO0FBQ0EsVUFBTVcsYUFBYWhCLGNBQWNDLGdCQUFkLENBQW5COztBQUVBO0FBQUEsV0FBTyxXQUFDVyxJQUFELEVBQVU7QUFDZixjQUFNSyxTQUFTSixXQUFXSixNQUFYLENBQWtCLFVBQUNTLEtBQUQsRUFBUUMsR0FBUjtBQUFBLG1CQUFnQkQsUUFBUUEsTUFBTUMsR0FBTixDQUFSLEdBQXFCQyxTQUFyQztBQUFBLFdBQWxCLEVBQWtFUixJQUFsRSxDQUFmO0FBQ0EsaUJBQU9JLFdBQVdDLE1BQVgsRUFBbUJGLFFBQW5CLENBQVA7QUFDRDtBQUhEO0FBTks7O0FBQUE7QUFVTjtBQUNGOztBQUVNLFNBQVNoQixZQUFULENBQXNCTSxXQUF0QixFQUFtQztBQUN4QyxNQUFJQSxZQUFZLENBQVosS0FBa0JBLFlBQVksQ0FBWixNQUFtQixPQUF6QyxFQUFrRDtBQUNoRCxXQUFPRCxZQUFZQyxZQUFZZ0IsS0FBWixDQUFrQixDQUFsQixDQUFaLENBQVA7QUFDRCxHQUZELE1BRU87QUFDTCxXQUFPO0FBQUEsYUFBTSxLQUFOO0FBQUEsS0FBUDtBQUNEO0FBQ0YiLCJmaWxlIjoic3RvcmFnZS9jcmVhdGVGaWx0ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBnZXRDb21wYXJhdG9yKGNvbXBhcmF0b3JTdHJpbmcpIHtcbiAgaWYgKGNvbXBhcmF0b3JTdHJpbmcgPT09ICc9Jykge1xuICAgIHJldHVybiAoYSwgYikgPT4gYSA9PT0gYjtcbiAgfSBlbHNlIGlmIChjb21wYXJhdG9yU3RyaW5nID09PSAnPicpIHtcbiAgICByZXR1cm4gKGEsIGIpID0+IGEgPiBiO1xuICB9IGVsc2UgaWYgKGNvbXBhcmF0b3JTdHJpbmcgPT09ICc+PScpIHtcbiAgICByZXR1cm4gKGEsIGIpID0+IGEgPj0gYjtcbiAgfSBlbHNlIGlmIChjb21wYXJhdG9yU3RyaW5nID09PSAnPCcpIHtcbiAgICByZXR1cm4gKGEsIGIpID0+IGEgPCBiO1xuICB9IGVsc2UgaWYgKGNvbXBhcmF0b3JTdHJpbmcgPT09ICc8PScpIHtcbiAgICByZXR1cm4gKGEsIGIpID0+IGEgPD0gYjtcbiAgfSBlbHNlIGlmIChjb21wYXJhdG9yU3RyaW5nID09PSAnIT0nKSB7XG4gICAgcmV0dXJuIChhLCBiKSA9PiBhICE9PSBiO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAoYSwgYikgPT4gdHJ1ZTsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICB9XG59XG5cbmZ1bmN0aW9uIGhhbmRsZVdoZXJlKGJsb2NrRmlsdGVyKSB7XG4gIGlmICghYmxvY2tGaWx0ZXJbMF0pIHtcbiAgICByZXR1cm4gKCkgPT4gdHJ1ZTtcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KGJsb2NrRmlsdGVyWzBdKSkge1xuICAgIHJldHVybiBibG9ja0ZpbHRlci5tYXAoY3JlYXRlRmlsdGVyKS5yZWR1Y2UoKHByZXYsIGN1cnIpID0+IHsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgcmV0dXJuIChlbGVtKSA9PiBwcmV2KGVsZW0pICYmIGN1cnIoZWxlbSk7XG4gICAgfSwgKCkgPT4gdHJ1ZSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcHJvcGVydGllcyA9IGJsb2NrRmlsdGVyWzBdLnNwbGl0KCcuJyk7XG4gICAgY29uc3QgY29tcGFyYXRvclN0cmluZyA9IGJsb2NrRmlsdGVyWzFdO1xuICAgIGNvbnN0IGV4cGVjdGVkID0gYmxvY2tGaWx0ZXJbMl07XG4gICAgY29uc3QgY29tcGFyYXRvciA9IGdldENvbXBhcmF0b3IoY29tcGFyYXRvclN0cmluZyk7XG5cbiAgICByZXR1cm4gKGVsZW0pID0+IHtcbiAgICAgIGNvbnN0IGFjdHVhbCA9IHByb3BlcnRpZXMucmVkdWNlKChsZXZlbCwga2V5KSA9PiBsZXZlbCA/IGxldmVsW2tleV0gOiB1bmRlZmluZWQsIGVsZW0pO1xuICAgICAgcmV0dXJuIGNvbXBhcmF0b3IoYWN0dWFsLCBleHBlY3RlZCk7XG4gICAgfTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRmlsdGVyKGJsb2NrRmlsdGVyKSB7XG4gIGlmIChibG9ja0ZpbHRlclswXSAmJiBibG9ja0ZpbHRlclswXSA9PT0gJ3doZXJlJykge1xuICAgIHJldHVybiBoYW5kbGVXaGVyZShibG9ja0ZpbHRlci5zbGljZSgxKSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuICgpID0+IGZhbHNlO1xuICB9XG59XG4iXX0=
