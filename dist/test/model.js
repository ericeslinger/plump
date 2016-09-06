'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _dataStore = require('../dataStore');

var _memory = require('../storage/memory');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* eslint-env node, mocha*/

var memstore1 = new _memory.MemoryStorage();
var memstore2 = new _memory.MemoryStorage();
var DS = new _dataStore.Datastore({ storage: [memstore1, memstore2] });

var TestType = function (_DS$Base) {
  _inherits(TestType, _DS$Base);

  function TestType() {
    _classCallCheck(this, TestType);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(TestType).apply(this, arguments));
  }

  return TestType;
}(DS.Base);

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

TestType.$name = 'Test';

DS.defineType(TestType);

_chai2.default.use(_chaiAsPromised2.default);
var expect = _chai2.default.expect;

describe('model', function () {
  it('should save field updates to all datastores');

  it('should return promises to existing data', function () {
    var one = new TestType({ id: 1, name: 'potato' });
    expect(one.$get('name')).to.eventually.equal('potato');
  });

  it('should load data from datastores', function () {
    return memstore2.create(TestType, {
      id: 2,
      name: 'potato'
    }).then(function () {
      var two = DS.find('Test', 2);
      return expect(two.$get('name')).to.eventually.equal('potato');
    });
  });

  it('should optimistically update on field updates', function () {
    var one = new TestType({ id: 1, name: 'potato' });
    one.$set({ name: 'rutabaga' });
    return expect(one.$get('name')).to.eventually.equal('rutabaga');
  });

  it('should save updates to datastores', function () {
    var one = new TestType({ id: 1, name: 'potato' });
    return one.$set({ name: 'rutabaga' }).then(function () {
      return expect(DS.find('Test', 1).$get('name')).to.eventually.equal('rutabaga');
    });
  });

  it('should lazy-load hasMany lists');
  it('should add hasMany elements');
  it('should remove hasMany elements');
  it('should update an inflated version of its hasMany relations');
  it('should optimistically update hasMany changes');
  it('should roll back optimistic changes on error');
  it('should return errors when fetching undefined fields');
  it('should fire events when underlying data changes');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7O0FBRUE7Ozs7Ozs7OytlQU5BOztBQVFBLElBQU0sWUFBWSwyQkFBbEI7QUFDQSxJQUFNLFlBQVksMkJBQWxCO0FBQ0EsSUFBTSxLQUFLLHlCQUFjLEVBQUMsU0FBUyxDQUFDLFNBQUQsRUFBWSxTQUFaLENBQVYsRUFBZCxDQUFYOztJQUVNLFE7Ozs7Ozs7Ozs7RUFBaUIsR0FBRyxJOztBQUUxQixTQUFTLE9BQVQsR0FBbUI7QUFDakIsTUFBSTtBQUNGLFVBQU07QUFESixHQURhO0FBSWpCLFFBQU07QUFDSixVQUFNO0FBREYsR0FKVztBQU9qQixZQUFVO0FBQ1IsVUFBTSxTQURFO0FBRVIsZUFBVztBQUZIO0FBUE8sQ0FBbkI7O0FBYUEsU0FBUyxLQUFULEdBQWlCLE1BQWpCOztBQUVBLEdBQUcsVUFBSCxDQUFjLFFBQWQ7O0FBRUEsZUFBSyxHQUFMO0FBQ0EsSUFBTSxTQUFTLGVBQUssTUFBcEI7O0FBRUEsU0FBUyxPQUFULEVBQWtCLFlBQU07QUFDdEIsS0FBRyw2Q0FBSDs7QUFFQSxLQUFHLHlDQUFILEVBQThDLFlBQU07QUFDbEQsUUFBTSxNQUFNLElBQUksUUFBSixDQUFhLEVBQUMsSUFBSSxDQUFMLEVBQVEsTUFBTSxRQUFkLEVBQWIsQ0FBWjtBQUNBLFdBQU8sSUFBSSxJQUFKLENBQVMsTUFBVCxDQUFQLEVBQXlCLEVBQXpCLENBQTRCLFVBQTVCLENBQXVDLEtBQXZDLENBQTZDLFFBQTdDO0FBQ0QsR0FIRDs7QUFLQSxLQUFHLGtDQUFILEVBQXVDLFlBQU07QUFDM0MsV0FBTyxVQUFVLE1BQVYsQ0FBaUIsUUFBakIsRUFBMkI7QUFDaEMsVUFBSSxDQUQ0QjtBQUVoQyxZQUFNO0FBRjBCLEtBQTNCLEVBR0osSUFISSxDQUdDLFlBQU07QUFDWixVQUFNLE1BQU0sR0FBRyxJQUFILENBQVEsTUFBUixFQUFnQixDQUFoQixDQUFaO0FBQ0EsYUFBTyxPQUFPLElBQUksSUFBSixDQUFTLE1BQVQsQ0FBUCxFQUF5QixFQUF6QixDQUE0QixVQUE1QixDQUF1QyxLQUF2QyxDQUE2QyxRQUE3QyxDQUFQO0FBQ0QsS0FOTSxDQUFQO0FBT0QsR0FSRDs7QUFVQSxLQUFHLCtDQUFILEVBQW9ELFlBQU07QUFDeEQsUUFBTSxNQUFNLElBQUksUUFBSixDQUFhLEVBQUMsSUFBSSxDQUFMLEVBQVEsTUFBTSxRQUFkLEVBQWIsQ0FBWjtBQUNBLFFBQUksSUFBSixDQUFTLEVBQUMsTUFBTSxVQUFQLEVBQVQ7QUFDQSxXQUFPLE9BQU8sSUFBSSxJQUFKLENBQVMsTUFBVCxDQUFQLEVBQXlCLEVBQXpCLENBQTRCLFVBQTVCLENBQXVDLEtBQXZDLENBQTZDLFVBQTdDLENBQVA7QUFDRCxHQUpEOztBQU1BLEtBQUcsbUNBQUgsRUFBd0MsWUFBTTtBQUM1QyxRQUFNLE1BQU0sSUFBSSxRQUFKLENBQWEsRUFBQyxJQUFJLENBQUwsRUFBUSxNQUFNLFFBQWQsRUFBYixDQUFaO0FBQ0EsV0FBTyxJQUFJLElBQUosQ0FBUyxFQUFDLE1BQU0sVUFBUCxFQUFULEVBQTZCLElBQTdCLENBQWtDLFlBQU07QUFDN0MsYUFBTyxPQUFPLEdBQUcsSUFBSCxDQUFRLE1BQVIsRUFBZ0IsQ0FBaEIsRUFBbUIsSUFBbkIsQ0FBd0IsTUFBeEIsQ0FBUCxFQUF3QyxFQUF4QyxDQUEyQyxVQUEzQyxDQUFzRCxLQUF0RCxDQUE0RCxVQUE1RCxDQUFQO0FBQ0QsS0FGTSxDQUFQO0FBR0QsR0FMRDs7QUFPQSxLQUFHLGdDQUFIO0FBQ0EsS0FBRyw2QkFBSDtBQUNBLEtBQUcsZ0NBQUg7QUFDQSxLQUFHLDREQUFIO0FBQ0EsS0FBRyw4Q0FBSDtBQUNBLEtBQUcsOENBQUg7QUFDQSxLQUFHLHFEQUFIO0FBQ0EsS0FBRyxpREFBSDtBQUNELENBdkNEIiwiZmlsZSI6InRlc3QvbW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZW52IG5vZGUsIG1vY2hhKi9cblxuaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5pbXBvcnQgY2hhaUFzUHJvbWlzZWQgZnJvbSAnY2hhaS1hcy1wcm9taXNlZCc7XG5pbXBvcnQgeyBEYXRhc3RvcmUgfSBmcm9tICcuLi9kYXRhU3RvcmUnO1xuXG5pbXBvcnQgeyBNZW1vcnlTdG9yYWdlIH0gZnJvbSAnLi4vc3RvcmFnZS9tZW1vcnknO1xuXG5jb25zdCBtZW1zdG9yZTEgPSBuZXcgTWVtb3J5U3RvcmFnZSgpO1xuY29uc3QgbWVtc3RvcmUyID0gbmV3IE1lbW9yeVN0b3JhZ2UoKTtcbmNvbnN0IERTID0gbmV3IERhdGFzdG9yZSh7c3RvcmFnZTogW21lbXN0b3JlMSwgbWVtc3RvcmUyXX0pO1xuXG5jbGFzcyBUZXN0VHlwZSBleHRlbmRzIERTLkJhc2Uge31cblxuVGVzdFR5cGUuJGZpZWxkcyA9IHtcbiAgaWQ6IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbiAgbmFtZToge1xuICAgIHR5cGU6ICdzdHJpbmcnLFxuICB9LFxuICBjaGlsZHJlbjoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICBjaGlsZFR5cGU6ICdUZXN0VHlwZScsXG4gIH0sXG59O1xuXG5UZXN0VHlwZS4kbmFtZSA9ICdUZXN0JztcblxuRFMuZGVmaW5lVHlwZShUZXN0VHlwZSk7XG5cbmNoYWkudXNlKGNoYWlBc1Byb21pc2VkKTtcbmNvbnN0IGV4cGVjdCA9IGNoYWkuZXhwZWN0O1xuXG5kZXNjcmliZSgnbW9kZWwnLCAoKSA9PiB7XG4gIGl0KCdzaG91bGQgc2F2ZSBmaWVsZCB1cGRhdGVzIHRvIGFsbCBkYXRhc3RvcmVzJyk7XG5cbiAgaXQoJ3Nob3VsZCByZXR1cm4gcHJvbWlzZXMgdG8gZXhpc3RpbmcgZGF0YScsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe2lkOiAxLCBuYW1lOiAncG90YXRvJ30pO1xuICAgIGV4cGVjdChvbmUuJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdwb3RhdG8nKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBsb2FkIGRhdGEgZnJvbSBkYXRhc3RvcmVzJywgKCkgPT4ge1xuICAgIHJldHVybiBtZW1zdG9yZTIuY3JlYXRlKFRlc3RUeXBlLCB7XG4gICAgICBpZDogMixcbiAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3QgdHdvID0gRFMuZmluZCgnVGVzdCcsIDIpO1xuICAgICAgcmV0dXJuIGV4cGVjdCh0d28uJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdwb3RhdG8nKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBvcHRpbWlzdGljYWxseSB1cGRhdGUgb24gZmllbGQgdXBkYXRlcycsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe2lkOiAxLCBuYW1lOiAncG90YXRvJ30pO1xuICAgIG9uZS4kc2V0KHtuYW1lOiAncnV0YWJhZ2EnfSk7XG4gICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdydXRhYmFnYScpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIHNhdmUgdXBkYXRlcyB0byBkYXRhc3RvcmVzJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7aWQ6IDEsIG5hbWU6ICdwb3RhdG8nfSk7XG4gICAgcmV0dXJuIG9uZS4kc2V0KHtuYW1lOiAncnV0YWJhZ2EnfSkudGhlbigoKSA9PiB7XG4gICAgICByZXR1cm4gZXhwZWN0KERTLmZpbmQoJ1Rlc3QnLCAxKS4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3J1dGFiYWdhJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgbGF6eS1sb2FkIGhhc01hbnkgbGlzdHMnKTtcbiAgaXQoJ3Nob3VsZCBhZGQgaGFzTWFueSBlbGVtZW50cycpO1xuICBpdCgnc2hvdWxkIHJlbW92ZSBoYXNNYW55IGVsZW1lbnRzJyk7XG4gIGl0KCdzaG91bGQgdXBkYXRlIGFuIGluZmxhdGVkIHZlcnNpb24gb2YgaXRzIGhhc01hbnkgcmVsYXRpb25zJyk7XG4gIGl0KCdzaG91bGQgb3B0aW1pc3RpY2FsbHkgdXBkYXRlIGhhc01hbnkgY2hhbmdlcycpO1xuICBpdCgnc2hvdWxkIHJvbGwgYmFjayBvcHRpbWlzdGljIGNoYW5nZXMgb24gZXJyb3InKTtcbiAgaXQoJ3Nob3VsZCByZXR1cm4gZXJyb3JzIHdoZW4gZmV0Y2hpbmcgdW5kZWZpbmVkIGZpZWxkcycpO1xuICBpdCgnc2hvdWxkIGZpcmUgZXZlbnRzIHdoZW4gdW5kZXJseWluZyBkYXRhIGNoYW5nZXMnKTtcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
