'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _memory = require('../storage/memory');

var _guild = require('../guild');

var _testType = require('./testType');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// const memstore1 = new MemoryStorage();
var memstore2 = new _memory.MemoryStorage({ terminal: true }); /* eslint-env node, mocha*/

var guild = new _guild.Guild({
  storage: [memstore2],
  types: [_testType.TestType]
});

_chai2.default.use(_chaiAsPromised2.default);
var expect = _chai2.default.expect;

describe('model', function () {
  it('should save field updates to all datastores');

  it('should return promises to existing data', function () {
    var one = new _testType.TestType({ id: 1, name: 'potato' });
    expect(one.$get('name')).to.eventually.equal('potato');
  });

  it('should load data from datastores', function () {
    return memstore2.write(_testType.TestType, {
      id: 2,
      name: 'potato'
    }).then(function () {
      var two = guild.find('tests', 2);
      return expect(two.$get('name')).to.eventually.equal('potato');
    });
  });

  it('should create an id when one is unset', function () {
    var noID = new _testType.TestType({ name: 'potato' }, guild);
    return expect(noID.$save()).to.eventually.have.all.keys('name', 'id');
  });

  it('should allow fields to be loaded', function () {
    var one = new _testType.TestType({ name: 'potato' }, guild);
    return one.$save().then(function () {
      return expect(guild.find('tests', one.$id).$get('name')).to.eventually.equal('potato');
    }).then(function () {
      return expect(guild.find('tests', one.$id).$get()).to.eventually.deep.equal({ name: 'potato', id: one.$id });
    });
  });

  it('should optimistically update on field updates', function () {
    var one = new _testType.TestType({ name: 'potato' }, guild);
    return one.$save().then(function () {
      return one.$set({ name: 'rutabaga' });
    }).then(function () {
      return expect(one.$get('name')).to.eventually.equal('rutabaga');
    });
  });

  it('should save updates to datastores');

  it('should show empty hasMany lists as []', function () {
    var one = new _testType.TestType({ name: 'frotato' }, guild);
    return one.$save().then(function () {
      return expect(one.$get('children')).to.eventually.deep.equal([]);
    });
  });

  it('should add hasMany elements', function () {
    var one = new _testType.TestType({ name: 'frotato' }, guild);
    return one.$save().then(function () {
      return one.$add('children', 100);
    }).then(function () {
      return expect(one.$get('children')).to.eventually.deep.equal([{
        child_id: 100,
        parent_id: one.$id
      }]);
    });
  });

  it('should remove hasMany elements', function () {
    var one = new _testType.TestType({ name: 'frotato' }, guild);
    return one.$save().then(function () {
      return one.$add('children', 100);
    }).then(function () {
      return expect(one.$get('children')).to.eventually.deep.equal([{
        child_id: 100,
        parent_id: one.$id
      }]);
    }).then(function () {
      return one.$remove('children', 100);
    }).then(function () {
      return expect(one.$get('children')).to.eventually.deep.equal([]);
    });
  });

  it('should include valence in hasMany operations', function () {
    var one = new _testType.TestType({ name: 'grotato' }, guild);
    return one.$save().then(function () {
      return one.$add('valenceChildren', 100, { perm: 1 });
    }).then(function () {
      return one.$get('valenceChildren');
    }).then(function (vx) {
      return console.log(vx);
    }).then(function () {
      return expect(one.$get('valenceChildren')).to.eventually.deep.equal([{
        child_id: 100,
        parent_id: one.$id,
        perm: 1
      }]);
    }).then(function () {
      return one.$modifyRelationship('valenceChildren', 100, { perm: 2 });
    }).then(function () {
      return expect(one.$get('valenceChildren')).to.eventually.deep.equal([{
        child_id: 100,
        parent_id: one.$id,
        perm: 2
      }]);
    });
  });

  it('should update an inflated version of its hasMany relations');
  it('should optimistically update hasMany changes');
  it('should roll back optimistic changes on error');
  it('should return errors when fetching undefined fields');
  it('should fire events when underlying data changes');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUyIiwidGVybWluYWwiLCJndWlsZCIsInN0b3JhZ2UiLCJ0eXBlcyIsInVzZSIsImV4cGVjdCIsImRlc2NyaWJlIiwiaXQiLCJvbmUiLCJpZCIsIm5hbWUiLCIkZ2V0IiwidG8iLCJldmVudHVhbGx5IiwiZXF1YWwiLCJ3cml0ZSIsInRoZW4iLCJ0d28iLCJmaW5kIiwibm9JRCIsIiRzYXZlIiwiaGF2ZSIsImFsbCIsImtleXMiLCIkaWQiLCJkZWVwIiwiJHNldCIsIiRhZGQiLCJjaGlsZF9pZCIsInBhcmVudF9pZCIsIiRyZW1vdmUiLCJwZXJtIiwidngiLCJjb25zb2xlIiwibG9nIiwiJG1vZGlmeVJlbGF0aW9uc2hpcCJdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7OztBQUNBOzs7O0FBRUE7O0FBQ0E7O0FBQ0E7Ozs7QUFFQTtBQUNBLElBQU1BLFlBQVksMEJBQWtCLEVBQUNDLFVBQVUsSUFBWCxFQUFsQixDQUFsQixDLENBVkE7O0FBWUEsSUFBTUMsUUFBUSxpQkFBVTtBQUN0QkMsV0FBUyxDQUFDSCxTQUFELENBRGE7QUFFdEJJLFNBQU87QUFGZSxDQUFWLENBQWQ7O0FBS0EsZUFBS0MsR0FBTDtBQUNBLElBQU1DLFNBQVMsZUFBS0EsTUFBcEI7O0FBRUFDLFNBQVMsT0FBVCxFQUFrQixZQUFNO0FBQ3RCQyxLQUFHLDZDQUFIOztBQUVBQSxLQUFHLHlDQUFILEVBQThDLFlBQU07QUFDbEQsUUFBTUMsTUFBTSx1QkFBYSxFQUFDQyxJQUFJLENBQUwsRUFBUUMsTUFBTSxRQUFkLEVBQWIsQ0FBWjtBQUNBTCxXQUFPRyxJQUFJRyxJQUFKLENBQVMsTUFBVCxDQUFQLEVBQXlCQyxFQUF6QixDQUE0QkMsVUFBNUIsQ0FBdUNDLEtBQXZDLENBQTZDLFFBQTdDO0FBQ0QsR0FIRDs7QUFLQVAsS0FBRyxrQ0FBSCxFQUF1QyxZQUFNO0FBQzNDLFdBQU9SLFVBQVVnQixLQUFWLHFCQUEwQjtBQUMvQk4sVUFB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LCJmaWxlIjoidGVzdC9tb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1lbnYgbm9kZSwgbW9jaGEqL1xuXG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcblxuaW1wb3J0IHsgTWVtb3J5U3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2UvbWVtb3J5JztcbmltcG9ydCB7IEd1aWxkIH0gZnJvbSAnLi4vZ3VpbGQnO1xuaW1wb3J0IHsgVGVzdFR5cGUgfSBmcm9tICcuL3Rlc3RUeXBlJztcblxuLy8gY29uc3QgbWVtc3RvcmUxID0gbmV3IE1lbW9yeVN0b3JhZ2UoKTtcbmNvbnN0IG1lbXN0b3JlMiA9IG5ldyBNZW1vcnlTdG9yYWdlKHt0ZXJtaW5hbDogdHJ1ZX0pO1xuXG5jb25zdCBndWlsZCA9IG5ldyBHdWlsZCh7XG4gIHN0b3JhZ2U6IFttZW1zdG9yZTJdLFxuICB0eXBlczogW1Rlc3RUeXBlXSxcbn0pO1xuXG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5jb25zdCBleHBlY3QgPSBjaGFpLmV4cGVjdDtcblxuZGVzY3JpYmUoJ21vZGVsJywgKCkgPT4ge1xuICBpdCgnc2hvdWxkIHNhdmUgZmllbGQgdXBkYXRlcyB0byBhbGwgZGF0YXN0b3JlcycpO1xuXG4gIGl0KCdzaG91bGQgcmV0dXJuIHByb21pc2VzIHRvIGV4aXN0aW5nIGRhdGEnLCAoKSA9PiB7XG4gICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHtpZDogMSwgbmFtZTogJ3BvdGF0byd9KTtcbiAgICBleHBlY3Qob25lLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncG90YXRvJyk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgbG9hZCBkYXRhIGZyb20gZGF0YXN0b3JlcycsICgpID0+IHtcbiAgICByZXR1cm4gbWVtc3RvcmUyLndyaXRlKFRlc3RUeXBlLCB7XG4gICAgICBpZDogMixcbiAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3QgdHdvID0gZ3VpbGQuZmluZCgndGVzdHMnLCAyKTtcbiAgICAgIHJldHVybiBleHBlY3QodHdvLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncG90YXRvJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgY3JlYXRlIGFuIGlkIHdoZW4gb25lIGlzIHVuc2V0JywgKCkgPT4ge1xuICAgIGNvbnN0IG5vSUQgPSBuZXcgVGVzdFR5cGUoe25hbWU6ICdwb3RhdG8nfSwgZ3VpbGQpO1xuICAgIHJldHVybiBleHBlY3Qobm9JRC4kc2F2ZSgpKS50by5ldmVudHVhbGx5LmhhdmUuYWxsLmtleXMoJ25hbWUnLCAnaWQnKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBhbGxvdyBmaWVsZHMgdG8gYmUgbG9hZGVkJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7bmFtZTogJ3BvdGF0byd9LCBndWlsZCk7XG4gICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgLnRoZW4oKCkgPT4gZXhwZWN0KGd1aWxkLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdwb3RhdG8nKSlcbiAgICAudGhlbigoKSA9PiBleHBlY3QoZ3VpbGQuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7bmFtZTogJ3BvdGF0bycsIGlkOiBvbmUuJGlkfSkpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIG9wdGltaXN0aWNhbGx5IHVwZGF0ZSBvbiBmaWVsZCB1cGRhdGVzJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7bmFtZTogJ3BvdGF0byd9LCBndWlsZCk7XG4gICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgLnRoZW4oKCkgPT4gb25lLiRzZXQoe25hbWU6ICdydXRhYmFnYSd9KSlcbiAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncnV0YWJhZ2EnKSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgc2F2ZSB1cGRhdGVzIHRvIGRhdGFzdG9yZXMnKTtcblxuICBpdCgnc2hvdWxkIHNob3cgZW1wdHkgaGFzTWFueSBsaXN0cyBhcyBbXScsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe25hbWU6ICdmcm90YXRvJ30sIGd1aWxkKTtcbiAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbXSkpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIGFkZCBoYXNNYW55IGVsZW1lbnRzJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7bmFtZTogJ2Zyb3RhdG8nfSwgZ3VpbGQpO1xuICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIDEwMCkpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSlcbiAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW3tcbiAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgfV0pO1xuICAgIH0pO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIHJlbW92ZSBoYXNNYW55IGVsZW1lbnRzJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7bmFtZTogJ2Zyb3RhdG8nfSwgZ3VpbGQpO1xuICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIDEwMCkpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSlcbiAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW3tcbiAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgfV0pO1xuICAgIH0pXG4gICAgLnRoZW4oKCkgPT4gb25lLiRyZW1vdmUoJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbXSkpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIGluY2x1ZGUgdmFsZW5jZSBpbiBoYXNNYW55IG9wZXJhdGlvbnMnLCAoKSA9PiB7XG4gICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHtuYW1lOiAnZ3JvdGF0byd9LCBndWlsZCk7XG4gICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ3ZhbGVuY2VDaGlsZHJlbicsIDEwMCwge3Blcm06IDF9KSlcbiAgICAudGhlbigoKSA9PiBvbmUuJGdldCgndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgLnRoZW4oKHZ4KSA9PiBjb25zb2xlLmxvZyh2eCkpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFt7XG4gICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgcGVybTogMSxcbiAgICAgIH1dKTtcbiAgICB9KVxuICAgIC50aGVuKCgpID0+IG9uZS4kbW9kaWZ5UmVsYXRpb25zaGlwKCd2YWxlbmNlQ2hpbGRyZW4nLCAxMDAsIHtwZXJtOiAyfSkpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFt7XG4gICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgcGVybTogMixcbiAgICAgIH1dKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCB1cGRhdGUgYW4gaW5mbGF0ZWQgdmVyc2lvbiBvZiBpdHMgaGFzTWFueSByZWxhdGlvbnMnKTtcbiAgaXQoJ3Nob3VsZCBvcHRpbWlzdGljYWxseSB1cGRhdGUgaGFzTWFueSBjaGFuZ2VzJyk7XG4gIGl0KCdzaG91bGQgcm9sbCBiYWNrIG9wdGltaXN0aWMgY2hhbmdlcyBvbiBlcnJvcicpO1xuICBpdCgnc2hvdWxkIHJldHVybiBlcnJvcnMgd2hlbiBmZXRjaGluZyB1bmRlZmluZWQgZmllbGRzJyk7XG4gIGl0KCdzaG91bGQgZmlyZSBldmVudHMgd2hlbiB1bmRlcmx5aW5nIGRhdGEgY2hhbmdlcycpO1xufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
