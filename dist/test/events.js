'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _index = require('../index');

var _testType = require('./testType');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_bluebird2.default.config({ longStackTraces: true }); /* eslint-env node, mocha*/

var memstore1 = new _index.MemoryStorage();
var memstore2 = new _index.MemoryStorage({ terminal: true });

var plump = new _index.Plump({
  storage: [memstore1, memstore2],
  types: [_testType.TestType]
});

_chai2.default.use(_chaiAsPromised2.default);
var expect = _chai2.default.expect;

describe('Events', function () {
  it('should pass basic cacheable-write events to other datastores', function () {
    return memstore2.write(_testType.TestType, {
      id: 2,
      name: 'potato'
    }).then(function () {
      return expect(memstore1.read(_testType.TestType, 2)).to.eventually.have.property('name', 'potato');
    });
  });

  it('should pass basic cacheable-read events up the stack', function () {
    var memstore3 = new _index.MemoryStorage();
    return memstore2.write(_testType.TestType, {
      id: 3,
      name: 'potato'
    }).then(function () {
      return expect(memstore2.read(_testType.TestType, 3)).to.eventually.have.property('name', 'potato');
    }).then(function () {
      plump.addStore(memstore3);
      return expect(memstore3.read(_testType.TestType, 3)).to.eventually.be.null;
    }).then(function () {
      return memstore2.read(_testType.TestType, 3);
    }).then(function () {
      return expect(memstore3.read(_testType.TestType, 3)).to.eventually.have.property('name', 'potato');
    });
  });

  it('should pass cacheable-write events on hasMany relationships to other datastores', function () {
    return memstore2.write(_testType.TestType, {
      id: 4,
      name: 'potato'
    }).then(function () {
      return memstore2.add(_testType.TestType, 4, 'likers', 100);
    }).then(function () {
      return expect(memstore1.read(_testType.TestType, 4, 'likers')).to.eventually.deep.equal({
        likers: [{
          parent_id: 100,
          child_id: 4
        }]
      });
    });
  });

  it('should pass cacheable-read events on hasMany relationships to other datastores', function () {
    var memstore3 = new _index.MemoryStorage();
    return memstore2.write(_testType.TestType, {
      id: 5,
      name: 'potato'
    }).then(function () {
      return memstore2.add(_testType.TestType, 5, 'likers', 100);
    }).then(function () {
      plump.addStore(memstore3);
      return expect(memstore3.read(_testType.TestType, 5)).to.eventually.be.null;
    }).then(function () {
      return memstore2.read(_testType.TestType, 5, 'likers');
    }).then(function () {
      return expect(memstore3.read(_testType.TestType, 5, 'likers')).to.eventually.deep.equal({
        likers: [{
          parent_id: 100,
          child_id: 5
        }]
      });
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvZXZlbnRzLmpzIl0sIm5hbWVzIjpbImNvbmZpZyIsImxvbmdTdGFja1RyYWNlcyIsIm1lbXN0b3JlMSIsIm1lbXN0b3JlMiIsInRlcm1pbmFsIiwicGx1bXAiLCJzdG9yYWdlIiwidHlwZXMiLCJ1c2UiLCJleHBlY3QiLCJkZXNjcmliZSIsIml0Iiwid3JpdGUiLCJpZCIsIm5hbWUiLCJ0aGVuIiwicmVhZCIsInRvIiwiZXZlbnR1YWxseSIsImhhdmUiLCJwcm9wZXJ0eSIsIm1lbXN0b3JlMyIsImFkZFN0b3JlIiwiYmUiLCJudWxsIiwiYWRkIiwiZGVlcCIsImVxdWFsIiwibGlrZXJzIiwicGFyZW50X2lkIiwiY2hpbGRfaWQiXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOztBQUNBOztBQUVBOzs7Ozs7QUFDQSxtQkFBU0EsTUFBVCxDQUFnQixFQUFFQyxpQkFBaUIsSUFBbkIsRUFBaEIsRSxDQVJBOztBQVVBLElBQU1DLFlBQVksMEJBQWxCO0FBQ0EsSUFBTUMsWUFBWSx5QkFBa0IsRUFBRUMsVUFBVSxJQUFaLEVBQWxCLENBQWxCOztBQUVBLElBQU1DLFFBQVEsaUJBQVU7QUFDdEJDLFdBQVMsQ0FBQ0osU0FBRCxFQUFZQyxTQUFaLENBRGE7QUFFdEJJLFNBQU87QUFGZSxDQUFWLENBQWQ7O0FBS0EsZUFBS0MsR0FBTDtBQUNBLElBQU1DLFNBQVMsZUFBS0EsTUFBcEI7O0FBRUFDLFNBQVMsUUFBVCxFQUFtQixZQUFNO0FBQ3ZCQyxLQUFHLDhEQUFILEVBQW1FLFlBQU07QUFDdkUsV0FBT1IsVUFBVVMsS0FBVixxQkFBMEI7QUFDL0JDLFVBQUksQ0FEMkI7QUFFL0JDLFlBQU07QUFGeUIsS0FBMUIsRUFHSkMsSUFISSxDQUdDLFlBQU07QUFDWixhQUFPTixPQUFPUCxVQUFVYyxJQUFWLHFCQUF5QixDQUF6QixDQUFQLEVBQW9DQyxFQUFwQyxDQUF1Q0MsVUFBdkMsQ0FBa0RDLElBQWxELENBQXVEQyxRQUF2RCxDQUFnRSxN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RGI7QUFFRUMsb0JBQVU7QUFGWixTQURNO0FBRG9FLE9BQXZFLENBQVA7QUFRRCxLQW5CTSxDQUFQO0FBb0JELEdBdEJEO0FBdUJELENBcEVEIiwiZmlsZSI6InRlc3QvZXZlbnRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlLCBtb2NoYSovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IHsgUGx1bXAsIE1lbW9yeVN0b3JhZ2UgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgeyBUZXN0VHlwZSB9IGZyb20gJy4vdGVzdFR5cGUnO1xuXG5pbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuQmx1ZWJpcmQuY29uZmlnKHsgbG9uZ1N0YWNrVHJhY2VzOiB0cnVlIH0pO1xuXG5jb25zdCBtZW1zdG9yZTEgPSBuZXcgTWVtb3J5U3RvcmFnZSgpO1xuY29uc3QgbWVtc3RvcmUyID0gbmV3IE1lbW9yeVN0b3JhZ2UoeyB0ZXJtaW5hbDogdHJ1ZSB9KTtcblxuY29uc3QgcGx1bXAgPSBuZXcgUGx1bXAoe1xuICBzdG9yYWdlOiBbbWVtc3RvcmUxLCBtZW1zdG9yZTJdLFxuICB0eXBlczogW1Rlc3RUeXBlXSxcbn0pO1xuXG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5jb25zdCBleHBlY3QgPSBjaGFpLmV4cGVjdDtcblxuZGVzY3JpYmUoJ0V2ZW50cycsICgpID0+IHtcbiAgaXQoJ3Nob3VsZCBwYXNzIGJhc2ljIGNhY2hlYWJsZS13cml0ZSBldmVudHMgdG8gb3RoZXIgZGF0YXN0b3JlcycsICgpID0+IHtcbiAgICByZXR1cm4gbWVtc3RvcmUyLndyaXRlKFRlc3RUeXBlLCB7XG4gICAgICBpZDogMixcbiAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGV4cGVjdChtZW1zdG9yZTEucmVhZChUZXN0VHlwZSwgMikpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBwYXNzIGJhc2ljIGNhY2hlYWJsZS1yZWFkIGV2ZW50cyB1cCB0aGUgc3RhY2snLCAoKSA9PiB7XG4gICAgY29uc3QgbWVtc3RvcmUzID0gbmV3IE1lbW9yeVN0b3JhZ2UoKTtcbiAgICByZXR1cm4gbWVtc3RvcmUyLndyaXRlKFRlc3RUeXBlLCB7XG4gICAgICBpZDogMyxcbiAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGV4cGVjdChtZW1zdG9yZTIucmVhZChUZXN0VHlwZSwgMykpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIHBsdW1wLmFkZFN0b3JlKG1lbXN0b3JlMyk7XG4gICAgICByZXR1cm4gZXhwZWN0KG1lbXN0b3JlMy5yZWFkKFRlc3RUeXBlLCAzKSkudG8uZXZlbnR1YWxseS5iZS5udWxsO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIG1lbXN0b3JlMi5yZWFkKFRlc3RUeXBlLCAzKTtcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIHJldHVybiBleHBlY3QobWVtc3RvcmUzLnJlYWQoVGVzdFR5cGUsIDMpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgcGFzcyBjYWNoZWFibGUtd3JpdGUgZXZlbnRzIG9uIGhhc01hbnkgcmVsYXRpb25zaGlwcyB0byBvdGhlciBkYXRhc3RvcmVzJywgKCkgPT4ge1xuICAgIHJldHVybiBtZW1zdG9yZTIud3JpdGUoVGVzdFR5cGUsIHtcbiAgICAgIGlkOiA0LFxuICAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICByZXR1cm4gbWVtc3RvcmUyLmFkZChUZXN0VHlwZSwgNCwgJ2xpa2VycycsIDEwMCk7XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICByZXR1cm4gZXhwZWN0KG1lbXN0b3JlMS5yZWFkKFRlc3RUeXBlLCA0LCAnbGlrZXJzJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgIGxpa2VyczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHBhcmVudF9pZDogMTAwLFxuICAgICAgICAgICAgY2hpbGRfaWQ6IDQsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIHBhc3MgY2FjaGVhYmxlLXJlYWQgZXZlbnRzIG9uIGhhc01hbnkgcmVsYXRpb25zaGlwcyB0byBvdGhlciBkYXRhc3RvcmVzJywgKCkgPT4ge1xuICAgIGNvbnN0IG1lbXN0b3JlMyA9IG5ldyBNZW1vcnlTdG9yYWdlKCk7XG4gICAgcmV0dXJuIG1lbXN0b3JlMi53cml0ZShUZXN0VHlwZSwge1xuICAgICAgaWQ6IDUsXG4gICAgICBuYW1lOiAncG90YXRvJyxcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIHJldHVybiBtZW1zdG9yZTIuYWRkKFRlc3RUeXBlLCA1LCAnbGlrZXJzJywgMTAwKTtcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIHBsdW1wLmFkZFN0b3JlKG1lbXN0b3JlMyk7XG4gICAgICByZXR1cm4gZXhwZWN0KG1lbXN0b3JlMy5yZWFkKFRlc3RUeXBlLCA1KSkudG8uZXZlbnR1YWxseS5iZS5udWxsO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIG1lbXN0b3JlMi5yZWFkKFRlc3RUeXBlLCA1LCAnbGlrZXJzJyk7XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICByZXR1cm4gZXhwZWN0KG1lbXN0b3JlMy5yZWFkKFRlc3RUeXBlLCA1LCAnbGlrZXJzJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgIGxpa2VyczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHBhcmVudF9pZDogMTAwLFxuICAgICAgICAgICAgY2hpbGRfaWQ6IDUsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19
