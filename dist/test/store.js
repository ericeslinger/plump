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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3Qvc3RvcmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQSxlQUFLLEdBQUwsMkIsQ0FOQTs7QUFPQSxJQUFNLFNBQVMsZUFBSyxNQUFwQjs7QUFFQSxTQUFTLE9BQVQsRUFBa0IsWUFBTTtBQUN0QixLQUFHLHdDQUFIO0FBQ0EsS0FBRyxxQ0FBSDtBQUNBLEtBQUcscUNBQUg7QUFDQSxLQUFHLGdDQUFIO0FBQ0QsQ0FMRCIsImZpbGUiOiJ0ZXN0L3N0b3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlLCBtb2NoYSovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IHsgRGF0YXN0b3JlIH0gZnJvbSAnLi4vZGF0YVN0b3JlJztcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbmRlc2NyaWJlKCdzdG9yZScsICgpID0+IHtcbiAgaXQoJ3Nob3VsZCBoYXZlIGNvbmZpZ3VyYWJsZSBzdG9yYWdlIHR5cGVzJyk7XG4gIGl0KCdzaG91bGQgYWxsb3cgc3ViY2xhc3Npbmcgb2YgRFMuQmFzZScpO1xuICBpdCgnc2hvdWxkIGZpbmQgZGF0YSBmcm9tIHN0b3JhZ2UgYnkgaWQnKTtcbiAgaXQoJ3Nob3VsZCBxdWVyeSBkYXRhIGZyb20gc3RvcmFnZScpO1xufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
