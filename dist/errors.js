'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var NotFoundError = exports.NotFoundError = function (_Error) {
    _inherits(NotFoundError, _Error);

    function NotFoundError() {
        _classCallCheck(this, NotFoundError);

        return _possibleConstructorReturn(this, (NotFoundError.__proto__ || Object.getPrototypeOf(NotFoundError)).call(this, 'not found'));
    }

    return NotFoundError;
}(Error);

var NotAuthorizedError = exports.NotAuthorizedError = function (_Error2) {
    _inherits(NotAuthorizedError, _Error2);

    function NotAuthorizedError() {
        _classCallCheck(this, NotAuthorizedError);

        return _possibleConstructorReturn(this, (NotAuthorizedError.__proto__ || Object.getPrototypeOf(NotAuthorizedError)).call(this, 'not authorized'));
    }

    return NotAuthorizedError;
}(Error);

var NotAuthenticatedError = exports.NotAuthenticatedError = function (_Error3) {
    _inherits(NotAuthenticatedError, _Error3);

    function NotAuthenticatedError() {
        _classCallCheck(this, NotAuthenticatedError);

        return _possibleConstructorReturn(this, (NotAuthenticatedError.__proto__ || Object.getPrototypeOf(NotAuthenticatedError)).call(this, 'not authenticated'));
    }

    return NotAuthenticatedError;
}(Error);

var UnknownError = exports.UnknownError = function (_Error4) {
    _inherits(UnknownError, _Error4);

    function UnknownError() {
        _classCallCheck(this, UnknownError);

        return _possibleConstructorReturn(this, (UnknownError.__proto__ || Object.getPrototypeOf(UnknownError)).call(this, 'unknown'));
    }

    return UnknownError;
}(Error);