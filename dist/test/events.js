'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _index = require('../index');

var _testType = require('./testType');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-env node, mocha*/

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
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvZXZlbnRzLmpzIl0sIm5hbWVzIjpbIm1lbXN0b3JlMSIsIm1lbXN0b3JlMiIsInRlcm1pbmFsIiwicGx1bXAiLCJzdG9yYWdlIiwidHlwZXMiLCJ1c2UiLCJleHBlY3QiLCJkZXNjcmliZSIsIml0Iiwid3JpdGUiLCJpZCIsIm5hbWUiLCJ0aGVuIiwicmVhZCIsInRvIiwiZXZlbnR1YWxseSIsImhhdmUiLCJwcm9wZXJ0eSIsIm1lbXN0b3JlMyIsImFkZFN0b3JlIiwiYmUiLCJudWxsIiwiYWRkIiwiZGVlcCIsImVxdWFsIiwibGlrZXJzIiwicGFyZW50X2lkIiwiY2hpbGRfaWQiXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOztBQUNBOzs7O0FBTEE7O0FBT0EsSUFBTUEsWUFBWSwwQkFBbEI7QUFDQSxJQUFNQyxZQUFZLHlCQUFrQixFQUFFQyxVQUFVLElBQVosRUFBbEIsQ0FBbEI7O0FBRUEsSUFBTUMsUUFBUSxpQkFBVTtBQUN0QkMsV0FBUyxDQUFDSixTQUFELEVBQVlDLFNBQVosQ0FEYTtBQUV0QkksU0FBTztBQUZlLENBQVYsQ0FBZDs7QUFLQSxlQUFLQyxHQUFMO0FBQ0EsSUFBTUMsU0FBUyxlQUFLQSxNQUFwQjs7QUFFQUMsU0FBUyxRQUFULEVBQW1CLFlBQU07QUFDdkJDLEtBQUcsOERBQUgsRUFBbUUsWUFBTTtBQUN2RSxXQUFPUixVQUFVUyxLQUFWLHFCQUEwQjtBQUMvQkMsVUFBSSxDQUQyQjtBQUUvQkMsWUFBTTtBQUZ5QixLQUExQixFQUdKQyxJQUhJLENBR0MsWUFBTTtBQUNaLGFBQU9OLE9BQU9QLFVBQVVjLElBQVYscUJBQXlCLENBQXpCLENBQVAsRUFBb0NDLEVBQXBDLENBQXVDQyxVQUF2QyxDQUFrREMsSUFBbEQsQ0FBdURDLFFBQXZELENBQWdFLE1BQWhFLEVBQXdFLFFBQXhFLENBQVA7QUFDRCxLQUxNLENBQVA7QUFNRCxHQVBEOztBQVNBVCxLQUFHLHNEQUFILEVBQTJELFlBQU07QUFDL0QsUUFBTVUsWUFBWSwwQkFBbEI7QUFDQSxXQUFPbEIsVUFBVVMsS0FBVixxQkFBMEI7QUFDL0JDLFVBQUksQ0FEMkI7QUFFL0JDLFlBQU07QUFGeUIsS0FBMUIsRUFHSkMsSUFISSxDQUdDLFlBQU07QUFDWixhQUFPTixPQUFPTixVQUFVYSxJQUFWLHFCQUF5QixDQUF6QixDQUFQLEVBQW9DQyxFQUFwQyxDQUF1Q0MsVUFBdkMsQ0FBa0RDLElBQWxELENBQXVEQyxRQUF2RCxDQUFnRSxNQUFoRSxFQUF3RSxRQUF4RSxDQUFQO0FBQ0QsS0FMTSxFQUtKTCxJQUxJLENBS0MsWUFBTTtBQUNaVixZQUFNaUIsUUFBTixDQUFlRCxTQUFmO0FBQ0EsYUFBT1osT0FBT1ksVUFBVUwsSUFBVixxQkFBeUIsQ0FBekIsQ0FBUCxFQUFvQ0MsRUFBcEMsQ0FBdUNDLFVBQXZDLENBQWtESyxFQUFsRCxDQUFxREMsSUFBNUQ7QUFDRCxLQVJNLEVBUUpULElBUkksQ0FRQyxZQUFNO0FBQ1osYUFBT1osVUFBVWEsSUFBVixxQkFBeUIsQ0FBekIsQ0FBUDtBQUNELEtBVk0sRUFVSkQsSUFWSSxDQVVDLFlBQU07QUFDWixhQUFPTixPQUFPWSxVQUFVTCxJQUFWLHFCQUF5QixDQUF6QixDQUFQLEVBQW9DQyxFQUFwQyxDQUF1Q0MsVUFBdkMsQ0FBa0RDLElBQWxELENBQXVEQyxRQUF2RCxDQUFnRSxNQUFoRSxFQUF3RSxRQUF4RSxDQUFQO0FBQ0QsS0FaTSxDQUFQO0FBYUQsR0FmRDs7QUFpQkFULEtBQUcsaUZBQUgsRUFBc0YsWUFBTTtBQUMxRixXQUFPUixVQUFVUyxLQUFWLHFCQUEwQjtBQUMvQkMsVUFBSSxDQUQyQjtBQUUvQkMsWUFBTTtBQUZ5QixLQUExQixFQUdKQyxJQUhJLENBR0MsWUFBTTtBQUNaLGFBQU9aLFVBQVVzQixHQUFWLHFCQUF3QixDQUF4QixFQUEyQixRQUEzQixFQUFxQyxHQUFyQyxDQUFQO0FBQ0QsS0FMTSxFQUtKVixJQUxJLENBS0MsWUFBTTtBQUNaLGFBQU9OLE9BQU9QLFVBQVVjLElBQVYscUJBQXlCLENBQXpCLEVBQTRCLFFBQTVCLENBQVAsRUFBOENDLEVBQTlDLENBQWlEQyxVQUFqRCxDQUE0RFEsSUFBNUQsQ0FBaUVDLEtBQWpFLENBQXVFO0FBQzVFQyxnQkFBUSxDQUNOO0FBQ0VDLHFCQUFXLEdBRGI7QUFFRUMsb0JBQVU7QUFGWixTQURNO0FBRG9FLE9BQXZFLENBQVA7QUFRRCxLQWRNLENBQVA7QUFlRCxHQWhCRDtBQWlCRCxDQTVDRCIsImZpbGUiOiJ0ZXN0L2V2ZW50cy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1lbnYgbm9kZSwgbW9jaGEqL1xuXG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCB7IFBsdW1wLCBNZW1vcnlTdG9yYWdlIH0gZnJvbSAnLi4vaW5kZXgnO1xuaW1wb3J0IHsgVGVzdFR5cGUgfSBmcm9tICcuL3Rlc3RUeXBlJztcblxuY29uc3QgbWVtc3RvcmUxID0gbmV3IE1lbW9yeVN0b3JhZ2UoKTtcbmNvbnN0IG1lbXN0b3JlMiA9IG5ldyBNZW1vcnlTdG9yYWdlKHsgdGVybWluYWw6IHRydWUgfSk7XG5cbmNvbnN0IHBsdW1wID0gbmV3IFBsdW1wKHtcbiAgc3RvcmFnZTogW21lbXN0b3JlMSwgbWVtc3RvcmUyXSxcbiAgdHlwZXM6IFtUZXN0VHlwZV0sXG59KTtcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbmRlc2NyaWJlKCdFdmVudHMnLCAoKSA9PiB7XG4gIGl0KCdzaG91bGQgcGFzcyBiYXNpYyBjYWNoZWFibGUtd3JpdGUgZXZlbnRzIHRvIG90aGVyIGRhdGFzdG9yZXMnLCAoKSA9PiB7XG4gICAgcmV0dXJuIG1lbXN0b3JlMi53cml0ZShUZXN0VHlwZSwge1xuICAgICAgaWQ6IDIsXG4gICAgICBuYW1lOiAncG90YXRvJyxcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIHJldHVybiBleHBlY3QobWVtc3RvcmUxLnJlYWQoVGVzdFR5cGUsIDIpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgcGFzcyBiYXNpYyBjYWNoZWFibGUtcmVhZCBldmVudHMgdXAgdGhlIHN0YWNrJywgKCkgPT4ge1xuICAgIGNvbnN0IG1lbXN0b3JlMyA9IG5ldyBNZW1vcnlTdG9yYWdlKCk7XG4gICAgcmV0dXJuIG1lbXN0b3JlMi53cml0ZShUZXN0VHlwZSwge1xuICAgICAgaWQ6IDMsXG4gICAgICBuYW1lOiAncG90YXRvJyxcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIHJldHVybiBleHBlY3QobWVtc3RvcmUyLnJlYWQoVGVzdFR5cGUsIDMpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICBwbHVtcC5hZGRTdG9yZShtZW1zdG9yZTMpO1xuICAgICAgcmV0dXJuIGV4cGVjdChtZW1zdG9yZTMucmVhZChUZXN0VHlwZSwgMykpLnRvLmV2ZW50dWFsbHkuYmUubnVsbDtcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIHJldHVybiBtZW1zdG9yZTIucmVhZChUZXN0VHlwZSwgMyk7XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICByZXR1cm4gZXhwZWN0KG1lbXN0b3JlMy5yZWFkKFRlc3RUeXBlLCAzKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgIH0pO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIHBhc3MgY2FjaGVhYmxlLXdyaXRlIGV2ZW50cyBvbiBoYXNNYW55IHJlbGF0aW9uc2hpcHMgdG8gb3RoZXIgZGF0YXN0b3JlcycsICgpID0+IHtcbiAgICByZXR1cm4gbWVtc3RvcmUyLndyaXRlKFRlc3RUeXBlLCB7XG4gICAgICBpZDogNCxcbiAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIG1lbXN0b3JlMi5hZGQoVGVzdFR5cGUsIDQsICdsaWtlcnMnLCAxMDApO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGV4cGVjdChtZW1zdG9yZTEucmVhZChUZXN0VHlwZSwgNCwgJ2xpa2VycycpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICBsaWtlcnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBwYXJlbnRfaWQ6IDEwMCxcbiAgICAgICAgICAgIGNoaWxkX2lkOiA0LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdfQ==
