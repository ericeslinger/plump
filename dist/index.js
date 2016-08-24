'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.go = go;

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Foo = function () {
  function Foo() {
    _classCallCheck(this, Foo);
  }

  _createClass(Foo, [{
    key: 'greet',
    value: function greet() {
      console.log(this.constructor.thing);
    }
  }]);

  return Foo;
}();

Foo.thing = 'foo';

var Bar = function (_Foo) {
  _inherits(Bar, _Foo);

  function Bar() {
    _classCallCheck(this, Bar);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Bar).apply(this, arguments));
  }

  return Bar;
}(Foo);
// Bar.thing = 'bar';

function go() {
  var test = new Bar();
  test.greet();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O1FBV2dCLEUsR0FBQSxFOzs7Ozs7OztJQVhWLEc7Ozs7Ozs7NEJBQ0k7QUFDTixjQUFRLEdBQVIsQ0FBWSxLQUFLLFdBQUwsQ0FBaUIsS0FBN0I7QUFDRDs7Ozs7O0FBRUgsSUFBSSxLQUFKLEdBQVksS0FBWjs7SUFFTSxHOzs7Ozs7Ozs7O0VBQVksRztBQUVsQjs7QUFFTyxTQUFTLEVBQVQsR0FBYztBQUNuQixNQUFNLE9BQU8sSUFBSSxHQUFKLEVBQWI7QUFDQSxPQUFLLEtBQUw7QUFDRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImNsYXNzIEZvbyB7XG4gIGdyZWV0KCkge1xuICAgIGNvbnNvbGUubG9nKHRoaXMuY29uc3RydWN0b3IudGhpbmcpO1xuICB9XG59XG5Gb28udGhpbmcgPSAnZm9vJztcblxuY2xhc3MgQmFyIGV4dGVuZHMgRm9vIHtcbn1cbi8vIEJhci50aGluZyA9ICdiYXInO1xuXG5leHBvcnQgZnVuY3Rpb24gZ28oKSB7XG4gIGNvbnN0IHRlc3QgPSBuZXcgQmFyKCk7XG4gIHRlc3QuZ3JlZXQoKTtcbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
