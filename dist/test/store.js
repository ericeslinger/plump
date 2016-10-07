'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _dataStore = require('../dataStore');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_chai2.default.use(_chaiAsPromised2.default); /* eslint-env node, mocha*/

var expect = _chai2.default.expect;

describe('store', function () {
  it('should have configurable storage types');
  it('should allow subclassing of DS.Base');
  it('should find data from storage by id');
  it('should query data from storage');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3Qvc3RvcmUuanMiXSwibmFtZXMiOlsidXNlIiwiZXhwZWN0IiwiZGVzY3JpYmUiLCJpdCJdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQSxlQUFLQSxHQUFMLDJCLENBTkE7O0FBT0EsSUFBTUMsU0FBUyxlQUFLQSxNQUFwQjs7QUFFQUMsU0FBUyxPQUFULEVBQWtCLFlBQU07QUFDdEJDLEtBQUcsd0NBQUg7QUFDQUEsS0FBRyxxQ0FBSDtBQUNBQSxLQUFHLHFDQUFIO0FBQ0FBLEtBQUcsZ0NBQUg7QUFDRCxDQUxEIiwiZmlsZSI6InRlc3Qvc3RvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZW52IG5vZGUsIG1vY2hhKi9cblxuaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5pbXBvcnQgY2hhaUFzUHJvbWlzZWQgZnJvbSAnY2hhaS1hcy1wcm9taXNlZCc7XG5pbXBvcnQgeyBEYXRhc3RvcmUgfSBmcm9tICcuLi9kYXRhU3RvcmUnO1xuXG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5jb25zdCBleHBlY3QgPSBjaGFpLmV4cGVjdDtcblxuZGVzY3JpYmUoJ3N0b3JlJywgKCkgPT4ge1xuICBpdCgnc2hvdWxkIGhhdmUgY29uZmlndXJhYmxlIHN0b3JhZ2UgdHlwZXMnKTtcbiAgaXQoJ3Nob3VsZCBhbGxvdyBzdWJjbGFzc2luZyBvZiBEUy5CYXNlJyk7XG4gIGl0KCdzaG91bGQgZmluZCBkYXRhIGZyb20gc3RvcmFnZSBieSBpZCcpO1xuICBpdCgnc2hvdWxkIHF1ZXJ5IGRhdGEgZnJvbSBzdG9yYWdlJyk7XG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
