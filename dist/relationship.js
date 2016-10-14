'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $guild = Symbol('$guild');

var Relationship = exports.Relationship = function () {
  function Relationship(item, guild) {
    _classCallCheck(this, Relationship);

    this.item = item;
    this[$guild] = guild;
  }

  _createClass(Relationship, [{
    key: 'get',
    value: function get() {}
  }]);

  return Relationship;
}();

// returns a ref to the definition block


Relationship.other = function other(name) {
  var nameArray = Object.keys(this.$sides);
  return name === nameArray[0] ? nameArray[1] : nameArray[0];
};

Relationship.otherType = function otherType(name) {
  return this.$sides[this.other(name)];
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlbGF0aW9uc2hpcC5qcyJdLCJuYW1lcyI6WyIkZ3VpbGQiLCJTeW1ib2wiLCJSZWxhdGlvbnNoaXAiLCJpdGVtIiwiZ3VpbGQiLCJvdGhlciIsIm5hbWUiLCJuYW1lQXJyYXkiLCJPYmplY3QiLCJrZXlzIiwiJHNpZGVzIiwib3RoZXJUeXBlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsSUFBTUEsU0FBU0MsT0FBTyxRQUFQLENBQWY7O0lBRWFDLFksV0FBQUEsWTtBQUNYLHdCQUFZQyxJQUFaLEVBQWtCQyxLQUFsQixFQUF5QjtBQUFBOztBQUN2QixTQUFLRCxJQUFMLEdBQVlBLElBQVo7QUFDQSxTQUFLSCxNQUFMLElBQWVJLEtBQWY7QUFDRDs7OzswQkFDSyxDQUNMOzs7Ozs7QUFHSDs7O0FBQ0FGLGFBQWFHLEtBQWIsR0FBcUIsU0FBU0EsS0FBVCxDQUFlQyxJQUFmLEVBQXFCO0FBQ3hDLE1BQU1DLFlBQVlDLE9BQU9DLElBQVAsQ0FBWSxLQUFLQyxNQUFqQixDQUFsQjtBQUNBLFNBQU9KLFNBQVNDLFVBQVUsQ0FBVixDQUFULEdBQ0hBLFVBQVUsQ0FBVixDQURHLEdBRUhBLFVBQVUsQ0FBVixDQUZKO0FBR0QsQ0FMRDs7QUFPQUwsYUFBYVMsU0FBYixHQUF5QixTQUFTQSxTQUFULENBQW1CTCxJQUFuQixFQUF5QjtBQUNoRCxTQUFPLEtBQUtJLE1BQUwsQ0FBWSxLQUFLTCxLQUFMLENBQVdDLElBQVgsQ0FBWixDQUFQO0FBQ0QsQ0FGRCIsImZpbGUiOiJyZWxhdGlvbnNoaXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCAkZ3VpbGQgPSBTeW1ib2woJyRndWlsZCcpO1xuXG5leHBvcnQgY2xhc3MgUmVsYXRpb25zaGlwIHtcbiAgY29uc3RydWN0b3IoaXRlbSwgZ3VpbGQpIHtcbiAgICB0aGlzLml0ZW0gPSBpdGVtO1xuICAgIHRoaXNbJGd1aWxkXSA9IGd1aWxkO1xuICB9XG4gIGdldCgpIHtcbiAgfVxufVxuXG4vLyByZXR1cm5zIGEgcmVmIHRvIHRoZSBkZWZpbml0aW9uIGJsb2NrXG5SZWxhdGlvbnNoaXAub3RoZXIgPSBmdW5jdGlvbiBvdGhlcihuYW1lKSB7XG4gIGNvbnN0IG5hbWVBcnJheSA9IE9iamVjdC5rZXlzKHRoaXMuJHNpZGVzKTtcbiAgcmV0dXJuIG5hbWUgPT09IG5hbWVBcnJheVswXVxuICAgID8gbmFtZUFycmF5WzFdXG4gICAgOiBuYW1lQXJyYXlbMF07XG59O1xuXG5SZWxhdGlvbnNoaXAub3RoZXJUeXBlID0gZnVuY3Rpb24gb3RoZXJUeXBlKG5hbWUpIHtcbiAgcmV0dXJuIHRoaXMuJHNpZGVzW3RoaXMub3RoZXIobmFtZSldO1xufTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
