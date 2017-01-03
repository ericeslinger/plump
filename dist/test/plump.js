'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _plump = require('../plump');

var _testType = require('./testType');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-env node, mocha*/

_chai2.default.use(_chaiAsPromised2.default);
var expect = _chai2.default.expect;

describe('Plump', function () {
  it('should allow dynamic creation of models from a schema', function () {
    var p = new _plump.Plump();
    p.addTypesFromSchema({ tests: _testType.TestType.toJSON() });
    return expect(p.find('tests', 1).constructor.toJSON()).to.deep.equal(_testType.TestType.toJSON());
  });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvcGx1bXAuanMiXSwibmFtZXMiOlsidXNlIiwiZXhwZWN0IiwiZGVzY3JpYmUiLCJpdCIsInAiLCJhZGRUeXBlc0Zyb21TY2hlbWEiLCJ0ZXN0cyIsInRvSlNPTiIsImZpbmQiLCJjb25zdHJ1Y3RvciIsInRvIiwiZGVlcCIsImVxdWFsIl0sIm1hcHBpbmdzIjoiOztBQUVBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7OztBQUxBOztBQU9BLGVBQUtBLEdBQUw7QUFDQSxJQUFNQyxTQUFTLGVBQUtBLE1BQXBCOztBQUVBQyxTQUFTLE9BQVQsRUFBa0IsWUFBTTtBQUN0QkMsS0FBRyx1REFBSCxFQUE0RCxZQUFNO0FBQ2hFLFFBQU1DLElBQUksa0JBQVY7QUFDQUEsTUFBRUMsa0JBQUYsQ0FBcUIsRUFBRUMsT0FBTyxtQkFBU0MsTUFBVCxFQUFULEVBQXJCO0FBQ0EsV0FBT04sT0FBT0csRUFBRUksSUFBRixDQUFPLE9BQVAsRUFBZ0IsQ0FBaEIsRUFBbUJDLFdBQW5CLENBQStCRixNQUEvQixFQUFQLEVBQWdERyxFQUFoRCxDQUFtREMsSUFBbkQsQ0FBd0RDLEtBQXhELENBQThELG1CQUFTTCxNQUFULEVBQTlELENBQVA7QUFDRCxHQUpEO0FBS0QsQ0FORCIsImZpbGUiOiJ0ZXN0L3BsdW1wLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlLCBtb2NoYSovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IHsgUGx1bXAgfSBmcm9tICcuLi9wbHVtcCc7XG5pbXBvcnQgeyBUZXN0VHlwZSB9IGZyb20gJy4vdGVzdFR5cGUnO1xuXG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5jb25zdCBleHBlY3QgPSBjaGFpLmV4cGVjdDtcblxuZGVzY3JpYmUoJ1BsdW1wJywgKCkgPT4ge1xuICBpdCgnc2hvdWxkIGFsbG93IGR5bmFtaWMgY3JlYXRpb24gb2YgbW9kZWxzIGZyb20gYSBzY2hlbWEnLCAoKSA9PiB7XG4gICAgY29uc3QgcCA9IG5ldyBQbHVtcCgpO1xuICAgIHAuYWRkVHlwZXNGcm9tU2NoZW1hKHsgdGVzdHM6IFRlc3RUeXBlLnRvSlNPTigpIH0pO1xuICAgIHJldHVybiBleHBlY3QocC5maW5kKCd0ZXN0cycsIDEpLmNvbnN0cnVjdG9yLnRvSlNPTigpKS50by5kZWVwLmVxdWFsKFRlc3RUeXBlLnRvSlNPTigpKTtcbiAgfSk7XG59KTtcbiJdfQ==
