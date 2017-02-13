'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _jsonApi = require('../jsonApi');

var _testType = require('./testType');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_chai2.default.use(_chaiAsPromised2.default); /* eslint-env node, mocha */

var expect = _chai2.default.expect;

describe('JSON API', function () {
  it('should package all related models on read', function () {
    // For testing while actual bulkRead implementations are in development
    // MemoryStorage.prototype.bulkRead = function bulkRead(root, opts) { // eslint-disable-line no-unused-vars
    //   return Bluebird.all([
    //     this.read(TestType, 2, $all),
    //     this.read(TestType, 3, $all),
    //   ]).then(children => {
    //     return { children };
    //   });
    // };
    //
    // const memstore2 = new MemoryStorage({ terminal: true });

    var api = new _jsonApi.JSONApi({ schema: _testType.TestType.toJSON() });

    var root = {
      type: 'tests',
      id: 1,
      name: 'potato',
      extended: {},
      children: [{ parent_id: 1, child_id: 2 }]
    };
    var extended = {
      children: [{
        type: 'tests',
        id: 2,
        name: 'frotato',
        extended: { cohort: 2013 },
        children: [{ parent_id: 2, child_id: 3 }]
      }, {
        type: 'tests',
        id: 3,
        name: 'rutabaga',
        extended: {}
      }]
    };

    expect(JSON.parse(JSON.stringify(api.encode({ root: root, extended: extended }, { domain: 'https://example.com', path: '/api' })))).to.deep.equal(JSON.parse(_fs2.default.readFileSync('src/test/testType.json')));
  });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvanNvbkFwaS5qcyJdLCJuYW1lcyI6WyJ1c2UiLCJleHBlY3QiLCJkZXNjcmliZSIsIml0IiwiYXBpIiwic2NoZW1hIiwidG9KU09OIiwicm9vdCIsInR5cGUiLCJpZCIsIm5hbWUiLCJleHRlbmRlZCIsImNoaWxkcmVuIiwicGFyZW50X2lkIiwiY2hpbGRfaWQiLCJjb2hvcnQiLCJKU09OIiwicGFyc2UiLCJzdHJpbmdpZnkiLCJlbmNvZGUiLCJkb21haW4iLCJwYXRoIiwidG8iLCJkZWVwIiwiZXF1YWwiLCJyZWFkRmlsZVN5bmMiXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBS0E7O0FBQ0E7Ozs7QUFKQSxlQUFLQSxHQUFMLDJCLENBTkE7O0FBT0EsSUFBTUMsU0FBUyxlQUFLQSxNQUFwQjs7QUFLQUMsU0FBUyxVQUFULEVBQXFCLFlBQU07QUFDekJDLEtBQUcsMkNBQUgsRUFBZ0QsWUFBTTtBQUNwRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFFBQU1DLE1BQU0scUJBQVksRUFBRUMsUUFBUSxtQkFBU0MsTUFBVCxFQUFWLEVBQVosQ0FBWjs7QUFFQSxRQUFNQyxPQUFPO0FBQ1hDLFlBQU0sT0FESztBQUVYQyxVQUFJLENBRk87QUFHWEMsWUFBTSxRQUhLO0FBSVhDLGdCQUFVLEVBSkM7QUFLWEMsZ0JBQVUsQ0FBQyxFQUFFQyxXQUFXLENBQWIsRUFBZ0JDLFVBQVUsQ0FBMUIsRUFBRDtBQUxDLEtBQWI7QUFPQSxRQUFNSCxXQUFXO0FBQ2ZDLGdCQUFVLENBQ1I7QUFDRUosY0FBTSxPQURSO0FBRUVDLFlBQUksQ0FGTjtBQUdFQyxjQUFNLFNBSFI7QUFJRUMsa0JBQVUsRUFBRUksUUFBUSxJQUFWLEVBSlo7QUFLRUgsa0JBQVUsQ0FBQyxFQUFFQyxXQUFXLENBQWIsRUFBZ0JDLFVBQVUsQ0FBMUIsRUFBRDtBQUxaLE9BRFEsRUFRUjtBQUNFTixjQUFNLE9BRFI7QUFFRUMsWUFBSSxDQUZOO0FBR0VDLGNBQU0sVUFIUjtBQUlFQyxrQkFBVTtBQUpaLE9BUlE7QUFESyxLQUFqQjs7QUFrQkFWLFdBQU9lLEtBQUtDLEtBQUwsQ0FBV0QsS0FBS0UsU0FBTCxDQUFlZCxJQUFJZSxNQUFKLENBQVcsRUFBRVosVUFBRixFQUFRSSxrQkFBUixFQUFYLEVBQStCLEVBQUVTLFFBQVEscUJBQVYsRUFBaUNDLE1BQU0sTUFBdkMsRUFBL0IsQ0FBZixDQUFYLENBQVAsRUFDQ0MsRUFERCxDQUNJQyxJQURKLENBQ1NDLEtBRFQsQ0FDZVIsS0FBS0MsS0FBTCxDQUFXLGFBQUdRLFlBQUgsQ0FBZ0Isd0JBQWhCLENBQVgsQ0FEZjtBQUVELEdBMUNEO0FBMkNELENBNUNEIiwiZmlsZSI6InRlc3QvanNvbkFwaS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1lbnYgbm9kZSwgbW9jaGEgKi9cblxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuXG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5jb25zdCBleHBlY3QgPSBjaGFpLmV4cGVjdDtcblxuaW1wb3J0IHsgSlNPTkFwaSB9IGZyb20gJy4uL2pzb25BcGknO1xuaW1wb3J0IHsgVGVzdFR5cGUgfSBmcm9tICcuL3Rlc3RUeXBlJztcblxuZGVzY3JpYmUoJ0pTT04gQVBJJywgKCkgPT4ge1xuICBpdCgnc2hvdWxkIHBhY2thZ2UgYWxsIHJlbGF0ZWQgbW9kZWxzIG9uIHJlYWQnLCAoKSA9PiB7XG4gICAgLy8gRm9yIHRlc3Rpbmcgd2hpbGUgYWN0dWFsIGJ1bGtSZWFkIGltcGxlbWVudGF0aW9ucyBhcmUgaW4gZGV2ZWxvcG1lbnRcbiAgICAvLyBNZW1vcnlTdG9yYWdlLnByb3RvdHlwZS5idWxrUmVhZCA9IGZ1bmN0aW9uIGJ1bGtSZWFkKHJvb3QsIG9wdHMpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICAgIC8vICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgLy8gICAgIHRoaXMucmVhZChUZXN0VHlwZSwgMiwgJGFsbCksXG4gICAgLy8gICAgIHRoaXMucmVhZChUZXN0VHlwZSwgMywgJGFsbCksXG4gICAgLy8gICBdKS50aGVuKGNoaWxkcmVuID0+IHtcbiAgICAvLyAgICAgcmV0dXJuIHsgY2hpbGRyZW4gfTtcbiAgICAvLyAgIH0pO1xuICAgIC8vIH07XG4gICAgLy9cbiAgICAvLyBjb25zdCBtZW1zdG9yZTIgPSBuZXcgTWVtb3J5U3RvcmFnZSh7IHRlcm1pbmFsOiB0cnVlIH0pO1xuXG4gICAgY29uc3QgYXBpID0gbmV3IEpTT05BcGkoeyBzY2hlbWE6IFRlc3RUeXBlLnRvSlNPTigpIH0pO1xuXG4gICAgY29uc3Qgcm9vdCA9IHtcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgICBpZDogMSxcbiAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgICAgZXh0ZW5kZWQ6IHt9LFxuICAgICAgY2hpbGRyZW46IFt7IHBhcmVudF9pZDogMSwgY2hpbGRfaWQ6IDIgfV0sXG4gICAgfTtcbiAgICBjb25zdCBleHRlbmRlZCA9IHtcbiAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiAndGVzdHMnLFxuICAgICAgICAgIGlkOiAyLFxuICAgICAgICAgIG5hbWU6ICdmcm90YXRvJyxcbiAgICAgICAgICBleHRlbmRlZDogeyBjb2hvcnQ6IDIwMTMgfSxcbiAgICAgICAgICBjaGlsZHJlbjogW3sgcGFyZW50X2lkOiAyLCBjaGlsZF9pZDogMyB9XSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgICAgICAgaWQ6IDMsXG4gICAgICAgICAgbmFtZTogJ3J1dGFiYWdhJyxcbiAgICAgICAgICBleHRlbmRlZDoge30sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH07XG5cbiAgICBleHBlY3QoSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShhcGkuZW5jb2RlKHsgcm9vdCwgZXh0ZW5kZWQgfSwgeyBkb21haW46ICdodHRwczovL2V4YW1wbGUuY29tJywgcGF0aDogJy9hcGknIH0pKSkpXG4gICAgLnRvLmRlZXAuZXF1YWwoSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMoJ3NyYy90ZXN0L3Rlc3RUeXBlLmpzb24nKSkpO1xuICB9KTtcbn0pO1xuIl19
