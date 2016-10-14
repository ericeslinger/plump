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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUyIiwidGVybWluYWwiLCJndWlsZCIsInN0b3JhZ2UiLCJ0eXBlcyIsInVzZSIsImV4cGVjdCIsImRlc2NyaWJlIiwiaXQiLCJvbmUiLCJpZCIsIm5hbWUiLCIkZ2V0IiwidG8iLCJldmVudHVhbGx5IiwiZXF1YWwiLCJ3cml0ZSIsInRoZW4iLCJ0d28iLCJmaW5kIiwibm9JRCIsIiRzYXZlIiwiaGF2ZSIsImFsbCIsImtleXMiLCIkaWQiLCJkZWVwIiwiJHNldCIsIiRhZGQiLCJjaGlsZF9pZCIsInBhcmVudF9pZCIsIiRyZW1vdmUiLCJwZXJtIiwiJG1vZGlmeVJlbGF0aW9uc2hpcCJdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7OztBQUNBOzs7O0FBRUE7O0FBQ0E7O0FBQ0E7Ozs7QUFFQTtBQUNBLElBQU1BLFlBQVksMEJBQWtCLEVBQUNDLFVBQVUsSUFBWCxFQUFsQixDQUFsQixDLENBVkE7O0FBWUEsSUFBTUMsUUFBUSxpQkFBVTtBQUN0QkMsV0FBUyxDQUFDSCxTQUFELENBRGE7QUFFdEJJLFNBQU87QUFGZSxDQUFWLENBQWQ7O0FBS0EsZUFBS0MsR0FBTDtBQUNBLElBQU1DLFNBQVMsZUFBS0EsTUFBcEI7O0FBRUFDLFNBQVMsT0FBVCxFQUFrQixZQUFNO0FBQ3RCQyxLQUFHLDZDQUFIOztBQUVBQSxLQUFHLHlDQUFILEVBQThDLFlBQU07QUFDbEQsUUFBTUMsTUFBTSx1QkFBYSxFQUFDQyxJQUFJLENBQUwsRUFBUUMsTUFBTSxRQUFkLEVBQWIsQ0FBWjtBQUNBTCxXQUFPRyxJQUFJRyxJQUFKLENBQVMsTUFBVCxDQUFQLEVBQXlCQyxFQUF6QixDQUE0QkMsVUFBNUIsQ0FBdUNDLEtBQXZDLENBQTZDLFFBQTdDO0FBQ0QsR0FIRDs7QUFLQVAsS0FBRyxrQ0FBSCxFQUF1QyxZQUFNO0FBQzNDLFdBQU9SLFVBQVVnQixLQUFWLHFCQUEwQjtBQUMvQk4sVUFBSSxDQUQyQjtBQUUvQkMsWUFBTTtB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LENBQ0Q7QUFBQSxhQUFNUixJQUFJbUIsSUFBSixDQUFTLGlCQUFULEVBQTRCLEdBQTVCLEVBQWlDLEVBQUNJLE1BQU0sQ0FBUCxFQUFqQyxDQUFOO0FBQUEsS0FEQyxFQUVOZixJQUZNLENBRUQ7QUFBQSxhQUFNUixJQUFJRyxJQUFKLENBQVMsaUJBQVQsQ0FBTjtBQUFBLEtBRkMsRUFHTkssSUFITSxDQUdELFlBQU07QUFDVixhQUFPWCxPQUFPRyxJQUFJRyxJQUFKLENBQVMsaUJBQVQsQ0FBUCxFQUNOQyxFQURNLENBQ0hDLFVBREcsQ0FDUVksSUFEUixDQUNhWCxLQURiLENBQ21CLENBQUM7QUFDekJjLGtCQUFVLEdBRGU7QUFFekJDLG1CQUFXckIsSUFBSWdCLEdBRlU7QUFHekJPLGNBQU07QUFIbUIsT0FBRCxDQURuQixDQUFQO0FBTUQsS0FWTSxFQVdOZixJQVhNLENBV0Q7QUFBQSxhQUFNUixJQUFJd0IsbUJBQUosQ0FBd0IsaUJBQXhCLEVBQTJDLEdBQTNDLEVBQWdELEVBQUNELE1BQU0sQ0FBUCxFQUFoRCxDQUFOO0FBQUEsS0FYQyxFQVlOZixJQVpNLENBWUQsWUFBTTtBQUNWLGFBQU9YLE9BQU9HLElBQUlHLElBQUosQ0FBUyxpQkFBVCxDQUFQLEVBQ05DLEVBRE0sQ0FDSEMsVUFERyxDQUNRWSxJQURSLENBQ2FYLEtBRGIsQ0FDbUIsQ0FBQztBQUN6QmMsa0JBQVUsR0FEZTtBQUV6QkMsbUJBQVdyQixJQUFJZ0IsR0FGVTtBQUd6Qk8sY0FBTTtBQUhtQixPQUFELENBRG5CLENBQVA7QUFNRCxLQW5CTSxDQUFQO0FBb0JELEdBdEJEOztBQXdCQXhCLEtBQUcsNERBQUg7QUFDQUEsS0FBRyw4Q0FBSDtBQUNBQSxLQUFHLDhDQUFIO0FBQ0FBLEtBQUcscURBQUg7QUFDQUEsS0FBRyxpREFBSDtBQUNELENBdEdEIiwiZmlsZSI6InRlc3QvbW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZW52IG5vZGUsIG1vY2hhKi9cblxuaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5pbXBvcnQgY2hhaUFzUHJvbWlzZWQgZnJvbSAnY2hhaS1hcy1wcm9taXNlZCc7XG5cbmltcG9ydCB7IE1lbW9yeVN0b3JhZ2UgfSBmcm9tICcuLi9zdG9yYWdlL21lbW9yeSc7XG5pbXBvcnQgeyBHdWlsZCB9IGZyb20gJy4uL2d1aWxkJztcbmltcG9ydCB7IFRlc3RUeXBlIH0gZnJvbSAnLi90ZXN0VHlwZSc7XG5cbi8vIGNvbnN0IG1lbXN0b3JlMSA9IG5ldyBNZW1vcnlTdG9yYWdlKCk7XG5jb25zdCBtZW1zdG9yZTIgPSBuZXcgTWVtb3J5U3RvcmFnZSh7dGVybWluYWw6IHRydWV9KTtcblxuY29uc3QgZ3VpbGQgPSBuZXcgR3VpbGQoe1xuICBzdG9yYWdlOiBbbWVtc3RvcmUyXSxcbiAgdHlwZXM6IFtUZXN0VHlwZV0sXG59KTtcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbmRlc2NyaWJlKCdtb2RlbCcsICgpID0+IHtcbiAgaXQoJ3Nob3VsZCBzYXZlIGZpZWxkIHVwZGF0ZXMgdG8gYWxsIGRhdGFzdG9yZXMnKTtcblxuICBpdCgnc2hvdWxkIHJldHVybiBwcm9taXNlcyB0byBleGlzdGluZyBkYXRhJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7aWQ6IDEsIG5hbWU6ICdwb3RhdG8nfSk7XG4gICAgZXhwZWN0KG9uZS4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3BvdGF0bycpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIGxvYWQgZGF0YSBmcm9tIGRhdGFzdG9yZXMnLCAoKSA9PiB7XG4gICAgcmV0dXJuIG1lbXN0b3JlMi53cml0ZShUZXN0VHlwZSwge1xuICAgICAgaWQ6IDIsXG4gICAgICBuYW1lOiAncG90YXRvJyxcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IHR3byA9IGd1aWxkLmZpbmQoJ3Rlc3RzJywgMik7XG4gICAgICByZXR1cm4gZXhwZWN0KHR3by4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3BvdGF0bycpO1xuICAgIH0pO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIGNyZWF0ZSBhbiBpZCB3aGVuIG9uZSBpcyB1bnNldCcsICgpID0+IHtcbiAgICBjb25zdCBub0lEID0gbmV3IFRlc3RUeXBlKHtuYW1lOiAncG90YXRvJ30sIGd1aWxkKTtcbiAgICByZXR1cm4gZXhwZWN0KG5vSUQuJHNhdmUoKSkudG8uZXZlbnR1YWxseS5oYXZlLmFsbC5rZXlzKCduYW1lJywgJ2lkJyk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgYWxsb3cgZmllbGRzIHRvIGJlIGxvYWRlZCcsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe25hbWU6ICdwb3RhdG8nfSwgZ3VpbGQpO1xuICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgIC50aGVuKCgpID0+IGV4cGVjdChndWlsZC5maW5kKCd0ZXN0cycsIG9uZS4kaWQpLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncG90YXRvJykpXG4gICAgLnRoZW4oKCkgPT4gZXhwZWN0KGd1aWxkLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe25hbWU6ICdwb3RhdG8nLCBpZDogb25lLiRpZH0pKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBvcHRpbWlzdGljYWxseSB1cGRhdGUgb24gZmllbGQgdXBkYXRlcycsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe25hbWU6ICdwb3RhdG8nfSwgZ3VpbGQpO1xuICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgIC50aGVuKCgpID0+IG9uZS4kc2V0KHtuYW1lOiAncnV0YWJhZ2EnfSkpXG4gICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3J1dGFiYWdhJykpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIHNhdmUgdXBkYXRlcyB0byBkYXRhc3RvcmVzJyk7XG5cbiAgaXQoJ3Nob3VsZCBzaG93IGVtcHR5IGhhc01hbnkgbGlzdHMgYXMgW10nLCAoKSA9PiB7XG4gICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHtuYW1lOiAnZnJvdGF0byd9LCBndWlsZCk7XG4gICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW10pKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBhZGQgaGFzTWFueSBlbGVtZW50cycsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe25hbWU6ICdmcm90YXRvJ30sIGd1aWxkKTtcbiAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDApKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpXG4gICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFt7XG4gICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgIH1dKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCByZW1vdmUgaGFzTWFueSBlbGVtZW50cycsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe25hbWU6ICdmcm90YXRvJ30sIGd1aWxkKTtcbiAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDApKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpXG4gICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFt7XG4gICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgIH1dKTtcbiAgICB9KVxuICAgIC50aGVuKCgpID0+IG9uZS4kcmVtb3ZlKCdjaGlsZHJlbicsIDEwMCkpXG4gICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW10pKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBpbmNsdWRlIHZhbGVuY2UgaW4gaGFzTWFueSBvcGVyYXRpb25zJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7bmFtZTogJ2dyb3RhdG8nfSwgZ3VpbGQpO1xuICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCd2YWxlbmNlQ2hpbGRyZW4nLCAxMDAsIHtwZXJtOiAxfSkpXG4gICAgLnRoZW4oKCkgPT4gb25lLiRnZXQoJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbe1xuICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgIHBlcm06IDEsXG4gICAgICB9XSk7XG4gICAgfSlcbiAgICAudGhlbigoKSA9PiBvbmUuJG1vZGlmeVJlbGF0aW9uc2hpcCgndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7cGVybTogMn0pKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbe1xuICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgIHBlcm06IDIsXG4gICAgICB9XSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgdXBkYXRlIGFuIGluZmxhdGVkIHZlcnNpb24gb2YgaXRzIGhhc01hbnkgcmVsYXRpb25zJyk7XG4gIGl0KCdzaG91bGQgb3B0aW1pc3RpY2FsbHkgdXBkYXRlIGhhc01hbnkgY2hhbmdlcycpO1xuICBpdCgnc2hvdWxkIHJvbGwgYmFjayBvcHRpbWlzdGljIGNoYW5nZXMgb24gZXJyb3InKTtcbiAgaXQoJ3Nob3VsZCByZXR1cm4gZXJyb3JzIHdoZW4gZmV0Y2hpbmcgdW5kZWZpbmVkIGZpZWxkcycpO1xuICBpdCgnc2hvdWxkIGZpcmUgZXZlbnRzIHdoZW4gdW5kZXJseWluZyBkYXRhIGNoYW5nZXMnKTtcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
