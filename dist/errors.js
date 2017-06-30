"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var NotFoundError = (function (_super) {
    __extends(NotFoundError, _super);
    function NotFoundError() {
        return _super.call(this, 'not found') || this;
    }
    return NotFoundError;
}(Error));
exports.NotFoundError = NotFoundError;
var NotAuthorizedError = (function (_super) {
    __extends(NotAuthorizedError, _super);
    function NotAuthorizedError() {
        return _super.call(this, 'not authorized') || this;
    }
    return NotAuthorizedError;
}(Error));
exports.NotAuthorizedError = NotAuthorizedError;
var NotAuthenticatedError = (function (_super) {
    __extends(NotAuthenticatedError, _super);
    function NotAuthenticatedError() {
        return _super.call(this, 'not authenticated') || this;
    }
    return NotAuthenticatedError;
}(Error));
exports.NotAuthenticatedError = NotAuthenticatedError;
var UnknownError = (function (_super) {
    __extends(UnknownError, _super);
    function UnknownError() {
        return _super.call(this, 'unknown') || this;
    }
    return UnknownError;
}(Error));
exports.UnknownError = UnknownError;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9lcnJvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUE7SUFBbUMsaUNBQUs7SUFDdEM7ZUFDRSxrQkFBTSxXQUFXLENBQUM7SUFDcEIsQ0FBQztJQUNILG9CQUFDO0FBQUQsQ0FKQSxBQUlDLENBSmtDLEtBQUssR0FJdkM7QUFKWSxzQ0FBYTtBQU0xQjtJQUF3QyxzQ0FBSztJQUMzQztlQUNFLGtCQUFNLGdCQUFnQixDQUFDO0lBQ3pCLENBQUM7SUFDSCx5QkFBQztBQUFELENBSkEsQUFJQyxDQUp1QyxLQUFLLEdBSTVDO0FBSlksZ0RBQWtCO0FBTS9CO0lBQTJDLHlDQUFLO0lBQzlDO2VBQ0Usa0JBQU0sbUJBQW1CLENBQUM7SUFDNUIsQ0FBQztJQUNILDRCQUFDO0FBQUQsQ0FKQSxBQUlDLENBSjBDLEtBQUssR0FJL0M7QUFKWSxzREFBcUI7QUFNbEM7SUFBa0MsZ0NBQUs7SUFDckM7ZUFDRSxrQkFBTSxTQUFTLENBQUM7SUFDbEIsQ0FBQztJQUNILG1CQUFDO0FBQUQsQ0FKQSxBQUlDLENBSmlDLEtBQUssR0FJdEM7QUFKWSxvQ0FBWSIsImZpbGUiOiJlcnJvcnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY2xhc3MgTm90Rm91bmRFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoJ25vdCBmb3VuZCcpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOb3RBdXRob3JpemVkRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCdub3QgYXV0aG9yaXplZCcpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOb3RBdXRoZW50aWNhdGVkRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCdub3QgYXV0aGVudGljYXRlZCcpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBVbmtub3duRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCd1bmtub3duJyk7XG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgUGx1bXBFcnJvciA9XG4gIHwgTm90Rm91bmRFcnJvclxuICB8IE5vdEF1dGhvcml6ZWRFcnJvclxuICB8IE5vdEF1dGhvcml6ZWRFcnJvclxuICB8IFVua25vd25FcnJvcjtcbiJdfQ==
