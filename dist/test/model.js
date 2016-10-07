'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _dataStore = require('../dataStore');

var _memory = require('../storage/memory');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-env node, mocha*/

const memstore1 = new _memory.MemoryStorage();
const memstore2 = new _memory.MemoryStorage({ terminal: true });
const DS = new _dataStore.Datastore({ storage: [memstore1, memstore2] });

class TestType extends DS.Base {}

TestType.$fields = {
  id: {
    type: 'number'
  },
  name: {
    type: 'string'
  },
  children: {
    type: 'hasMany',
    childType: 'TestType'
  }
};

TestType.$id = 'id';

TestType.$name = 'Test';

DS.defineType(TestType);

_chai2.default.use(_chaiAsPromised2.default);
const expect = _chai2.default.expect;

describe('model', () => {
  it('should save field updates to all datastores');

  it('should return promises to existing data', () => {
    const one = new TestType({ id: 1, name: 'potato' });
    expect(one.$get('name')).to.eventually.equal('potato');
  });

  it('should load data from datastores', () => {
    return memstore2.write(TestType, {
      id: 2,
      name: 'potato'
    }).then(() => {
      const two = DS.find('Test', 2);
      return expect(two.$get('name')).to.eventually.equal('potato');
    });
  });

  it('should create an id when one is unset', () => {
    const noID = new TestType({ name: 'potato' });
    return expect(noID.$save()).to.eventually.have.all.keys('name', 'id');
  });

  it('should optimistically update on field updates', () => {
    const one = new TestType({ name: 'potato' });
    return one.$save().then(() => one.$set({ name: 'rutabaga' })).then(() => expect(one.$get('name')).to.eventually.equal('rutabaga'));
  });

  it('should save updates to datastores');

  it('should lazy-load hasMany lists');
  it('should add hasMany elements');
  it('should remove hasMany elements');
  it('should update an inflated version of its hasMany relations');
  it('should optimistically update hasMany changes');
  it('should roll back optimistic changes on error');
  it('should return errors when fetching undefined fields');
  it('should fire events when underlying data changes');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7O0FBRUE7Ozs7QUFOQTs7QUFRQSxNQUFNLFlBQVksMkJBQWxCO0FBQ0EsTUFBTSxZQUFZLDBCQUFrQixFQUFDLFVBQVUsSUFBWCxFQUFsQixDQUFsQjtBQUNBLE1BQU0sS0FBSyx5QkFBYyxFQUFDLFNBQVMsQ0FBQyxTQUFELEVBQVksU0FBWixDQUFWLEVBQWQsQ0FBWDs7QUFFQSxNQUFNLFFBQU4sU0FBdUIsR0FBRyxJQUExQixDQUErQjs7QUFFL0IsU0FBUyxPQUFULEdBQW1CO0FBQ2pCLE1BQUk7QUFDRixVQUFNO0FBREosR0FEYTtBQUlqQixRQUFNO0FBQ0osVUFBTTtBQURGLEdBSlc7QUFPakIsWUFBVTtBQUNSLFVBQU0sU0FERTtBQUVSLGVBQVc7QUFGSDtBQVBPLENBQW5COztBQWFBLFNBQVMsR0FBVCxHQUFlLElBQWY7O0FBRUEsU0FBUyxLQUFULEdBQWlCLE1BQWpCOztBQUVBLEdBQUcsVUFBSCxDQUFjLFFBQWQ7O0FBRUEsZUFBSyxHQUFMO0FBQ0EsTUFBTSxTQUFTLGVBQUssTUFBcEI7O0FBRUEsU0FBUyxPQUFULEVBQWtCLE1BQU07QUFDdEIsS0FBRyw2Q0FBSDs7QUFFQSxLQUFHLHlDQUFILEVBQThDLE1BQU07QUFDbEQsVUFBTSxNQUFNLElBQUksUUFBSixDQUFhLEVBQUMsSUFBSSxDQUFMLEVBQVEsTUFBTSxRQUFkLEVBQWIsQ0FBWjtBQUNBLFdBQU8sSUFBSSxJQUFKLENBQVMsTUFBVCxDQUFQLEVBQXlCLEVBQXpCLENBQTRCLFVBQTVCLENBQXVDLEtBQXZDLENBQTZDLFFBQTdDO0FBQ0QsR0FIRDs7QUFLQSxLQUFHLGtDQUFILEVBQXVDLE1BQU07QUFDM0MsV0FBTyxVQUFVLEtBQVYsQ0FBZ0IsUUFBaEIsRUFBMEI7QUFDL0IsVUFBSSxDQUQyQjtBQUUvQixZQUFNO0FBRnlCLEtBQTFCLEVBR0osSUFISSxDQUdDLE1BQU07QUFDWixZQUFNLE1BQU0sR0FBRyxJQUFILENBQVEsTUFBUixFQUFnQixDQUFoQixDQUFaO0FBQ0EsYUFBTyxPQUFPLElBQUksSUFBSixDQUFTLE1BQVQsQ0FBUCxFQUF5QixFQUF6QixDQUE0QixVQUE1QixDQUF1QyxLQUF2QyxDQUE2QyxRQUE3QyxDQUFQO0FBQ0QsS0FOTSxDQUFQO0FBT0QsR0FSRDs7QUFVQSxLQUFHLHVDQUFILEVBQTRDLE1BQU07QUFDaEQsVUFBTSxPQUFPLElBQUksUUFBSixDQUFhLEVBQUMsTUFBTSxRQUFQLEVBQWIsQ0FBYjtBQUNBLFdBQU8sT0FBTyxLQUFLLEtBQUwsRUFBUCxFQUFxQixFQUFyQixDQUF3QixVQUF4QixDQUFtQyxJQUFuQyxDQUF3QyxHQUF4QyxDQUE0QyxJQUE1QyxDQUFpRCxNQUFqRCxFQUF5RCxJQUF6RCxDQUFQO0FBQ0QsR0FIRDs7QUFLQSxLQUFHLCtDQUFILEVBQW9ELE1BQU07QUFDeEQsVUFBTSxNQUFNLElBQUksUUFBSixDQUFhLEVBQUMsTUFBTSxRQUFQLEVBQWIsQ0FBWjtBQUNBLFdBQU8sSUFBSSxLQUFKLEdBQ04sSUFETSxDQUNELE1BQU0sSUFBSSxJQUFKLENBQVMsRUFBQyxNQUFNLFVBQVAsRUFBVCxDQURMLEVBRU4sSUFGTSxDQUVELE1BQU0sT0FBTyxJQUFJLElBQUosQ0FBUyxNQUFULENBQVAsRUFBeUIsRUFBekIsQ0FBNEIsVUFBNUIsQ0FBdUMsS0FBdkMsQ0FBNkMsVUFBN0MsQ0FGTCxDQUFQO0FBR0QsR0FMRDs7QUFPQSxLQUFHLG1DQUFIOztBQUVBLEtBQUcsZ0NBQUg7QUFDQSxLQUFHLDZCQUFIO0FBQ0EsS0FBRyxnQ0FBSDtBQUNBLEtBQUcsNERBQUg7QUFDQSxLQUFHLDhDQUFIO0FBQ0EsS0FBRyw4Q0FBSDtBQUNBLEtBQUcscURBQUg7QUFDQSxLQUFHLGlEQUFIO0FBQ0QsQ0F4Q0QiLCJmaWxlIjoidGVzdC9tb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1lbnYgbm9kZSwgbW9jaGEqL1xuXG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCB7IERhdGFzdG9yZSB9IGZyb20gJy4uL2RhdGFTdG9yZSc7XG5cbmltcG9ydCB7IE1lbW9yeVN0b3JhZ2UgfSBmcm9tICcuLi9zdG9yYWdlL21lbW9yeSc7XG5cbmNvbnN0IG1lbXN0b3JlMSA9IG5ldyBNZW1vcnlTdG9yYWdlKCk7XG5jb25zdCBtZW1zdG9yZTIgPSBuZXcgTWVtb3J5U3RvcmFnZSh7dGVybWluYWw6IHRydWV9KTtcbmNvbnN0IERTID0gbmV3IERhdGFzdG9yZSh7c3RvcmFnZTogW21lbXN0b3JlMSwgbWVtc3RvcmUyXX0pO1xuXG5jbGFzcyBUZXN0VHlwZSBleHRlbmRzIERTLkJhc2Uge31cblxuVGVzdFR5cGUuJGZpZWxkcyA9IHtcbiAgaWQ6IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbiAgbmFtZToge1xuICAgIHR5cGU6ICdzdHJpbmcnLFxuICB9LFxuICBjaGlsZHJlbjoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICBjaGlsZFR5cGU6ICdUZXN0VHlwZScsXG4gIH0sXG59O1xuXG5UZXN0VHlwZS4kaWQgPSAnaWQnO1xuXG5UZXN0VHlwZS4kbmFtZSA9ICdUZXN0JztcblxuRFMuZGVmaW5lVHlwZShUZXN0VHlwZSk7XG5cbmNoYWkudXNlKGNoYWlBc1Byb21pc2VkKTtcbmNvbnN0IGV4cGVjdCA9IGNoYWkuZXhwZWN0O1xuXG5kZXNjcmliZSgnbW9kZWwnLCAoKSA9PiB7XG4gIGl0KCdzaG91bGQgc2F2ZSBmaWVsZCB1cGRhdGVzIHRvIGFsbCBkYXRhc3RvcmVzJyk7XG5cbiAgaXQoJ3Nob3VsZCByZXR1cm4gcHJvbWlzZXMgdG8gZXhpc3RpbmcgZGF0YScsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe2lkOiAxLCBuYW1lOiAncG90YXRvJ30pO1xuICAgIGV4cGVjdChvbmUuJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdwb3RhdG8nKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBsb2FkIGRhdGEgZnJvbSBkYXRhc3RvcmVzJywgKCkgPT4ge1xuICAgIHJldHVybiBtZW1zdG9yZTIud3JpdGUoVGVzdFR5cGUsIHtcbiAgICAgIGlkOiAyLFxuICAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCB0d28gPSBEUy5maW5kKCdUZXN0JywgMik7XG4gICAgICByZXR1cm4gZXhwZWN0KHR3by4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3BvdGF0bycpO1xuICAgIH0pO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIGNyZWF0ZSBhbiBpZCB3aGVuIG9uZSBpcyB1bnNldCcsICgpID0+IHtcbiAgICBjb25zdCBub0lEID0gbmV3IFRlc3RUeXBlKHtuYW1lOiAncG90YXRvJ30pO1xuICAgIHJldHVybiBleHBlY3Qobm9JRC4kc2F2ZSgpKS50by5ldmVudHVhbGx5LmhhdmUuYWxsLmtleXMoJ25hbWUnLCAnaWQnKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBvcHRpbWlzdGljYWxseSB1cGRhdGUgb24gZmllbGQgdXBkYXRlcycsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe25hbWU6ICdwb3RhdG8nfSk7XG4gICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgLnRoZW4oKCkgPT4gb25lLiRzZXQoe25hbWU6ICdydXRhYmFnYSd9KSlcbiAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncnV0YWJhZ2EnKSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgc2F2ZSB1cGRhdGVzIHRvIGRhdGFzdG9yZXMnKTtcblxuICBpdCgnc2hvdWxkIGxhenktbG9hZCBoYXNNYW55IGxpc3RzJyk7XG4gIGl0KCdzaG91bGQgYWRkIGhhc01hbnkgZWxlbWVudHMnKTtcbiAgaXQoJ3Nob3VsZCByZW1vdmUgaGFzTWFueSBlbGVtZW50cycpO1xuICBpdCgnc2hvdWxkIHVwZGF0ZSBhbiBpbmZsYXRlZCB2ZXJzaW9uIG9mIGl0cyBoYXNNYW55IHJlbGF0aW9ucycpO1xuICBpdCgnc2hvdWxkIG9wdGltaXN0aWNhbGx5IHVwZGF0ZSBoYXNNYW55IGNoYW5nZXMnKTtcbiAgaXQoJ3Nob3VsZCByb2xsIGJhY2sgb3B0aW1pc3RpYyBjaGFuZ2VzIG9uIGVycm9yJyk7XG4gIGl0KCdzaG91bGQgcmV0dXJuIGVycm9ycyB3aGVuIGZldGNoaW5nIHVuZGVmaW5lZCBmaWVsZHMnKTtcbiAgaXQoJ3Nob3VsZCBmaXJlIGV2ZW50cyB3aGVuIHVuZGVybHlpbmcgZGF0YSBjaGFuZ2VzJyk7XG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
