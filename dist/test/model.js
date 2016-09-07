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

TestType.$id = 'id';

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
    return memstore2.write(TestType, {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7O0FBRUE7Ozs7Ozs7OytlQU5BOztBQVFBLElBQU0sWUFBWSwyQkFBbEI7QUFDQSxJQUFNLFlBQVksMkJBQWxCO0FBQ0EsSUFBTSxLQUFLLHlCQUFjLEVBQUMsU0FBUyxDQUFDLFNBQUQsRUFBWSxTQUFaLENBQVYsRUFBZCxDQUFYOztJQUVNLFE7Ozs7Ozs7Ozs7RUFBaUIsR0FBRyxJOztBQUUxQixTQUFTLE9BQVQsR0FBbUI7QUFDakIsTUFBSTtBQUNGLFVBQU07QUFESixHQURhO0FBSWpCLFFBQU07QUFDSixVQUFNO0FBREYsR0FKVztBQU9qQixZQUFVO0FBQ1IsVUFBTSxTQURFO0FBRVIsZUFBVztBQUZIO0FBUE8sQ0FBbkI7O0FBYUEsU0FBUyxHQUFULEdBQWUsSUFBZjs7QUFFQSxTQUFTLEtBQVQsR0FBaUIsTUFBakI7O0FBRUEsR0FBRyxVQUFILENBQWMsUUFBZDs7QUFFQSxlQUFLLEdBQUw7QUFDQSxJQUFNLFNBQVMsZUFBSyxNQUFwQjs7QUFFQSxTQUFTLE9BQVQsRUFBa0IsWUFBTTtBQUN0QixLQUFHLDZDQUFIOztBQUVBLEtBQUcseUNBQUgsRUFBOEMsWUFBTTtBQUNsRCxRQUFNLE1BQU0sSUFBSSxRQUFKLENBQWEsRUFBQyxJQUFJLENBQUwsRUFBUSxNQUFNLFFBQWQsRUFBYixDQUFaO0FBQ0EsV0FBTyxJQUFJLElBQUosQ0FBUyxNQUFULENBQVAsRUFBeUIsRUFBekIsQ0FBNEIsVUFBNUIsQ0FBdUMsS0FBdkMsQ0FBNkMsUUFBN0M7QUFDRCxHQUhEOztBQUtBLEtBQUcsa0NBQUgsRUFBdUMsWUFBTTtBQUMzQyxXQUFPLFVBQVUsS0FBVixDQUFnQixRQUFoQixFQUEwQjtBQUMvQixVQUFJLENBRDJCO0FBRS9CLFlBQU07QUFGeUIsS0FBMUIsRUFHSixJQUhJLENBR0MsWUFBTTtBQUNaLFVBQU0sTUFBTSxHQUFHLElBQUgsQ0FBUSxNQUFSLEVBQWdCLENBQWhCLENBQVo7QUFDQSxhQUFPLE9BQU8sSUFBSSxJQUFKLENBQVMsTUFBVCxDQUFQLEVBQXlCLEVBQXpCLENBQTRCLFVBQTVCLENBQXVDLEtBQXZDLENBQTZDLFFBQTdDLENBQVA7QUFDRCxLQU5NLENBQVA7QUFPRCxHQVJEOztBQVVBLEtBQUcsK0NBQUgsRUFBb0QsWUFBTTtBQUN4RCxRQUFNLE1BQU0sSUFBSSxRQUFKLENBQWEsRUFBQyxJQUFJLENBQUwsRUFBUSxNQUFNLFFBQWQsRUFBYixDQUFaO0FBQ0EsUUFBSSxJQUFKLENBQVMsRUFBQyxNQUFNLFVBQVAsRUFBVDtBQUNBLFdBQU8sT0FBTyxJQUFJLElBQUosQ0FBUyxNQUFULENBQVAsRUFBeUIsRUFBekIsQ0FBNEIsVUFBNUIsQ0FBdUMsS0FBdkMsQ0FBNkMsVUFBN0MsQ0FBUDtBQUNELEdBSkQ7O0FBTUEsS0FBRyxtQ0FBSDs7QUFFQSxLQUFHLGdDQUFIO0FBQ0EsS0FBRyw2QkFBSDtBQUNBLEtBQUcsZ0NBQUg7QUFDQSxLQUFHLDREQUFIO0FBQ0EsS0FBRyw4Q0FBSDtBQUNBLEtBQUcsOENBQUg7QUFDQSxLQUFHLHFEQUFIO0FBQ0EsS0FBRyxpREFBSDtBQUNELENBbENEIiwiZmlsZSI6InRlc3QvbW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZW52IG5vZGUsIG1vY2hhKi9cblxuaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5pbXBvcnQgY2hhaUFzUHJvbWlzZWQgZnJvbSAnY2hhaS1hcy1wcm9taXNlZCc7XG5pbXBvcnQgeyBEYXRhc3RvcmUgfSBmcm9tICcuLi9kYXRhU3RvcmUnO1xuXG5pbXBvcnQgeyBNZW1vcnlTdG9yYWdlIH0gZnJvbSAnLi4vc3RvcmFnZS9tZW1vcnknO1xuXG5jb25zdCBtZW1zdG9yZTEgPSBuZXcgTWVtb3J5U3RvcmFnZSgpO1xuY29uc3QgbWVtc3RvcmUyID0gbmV3IE1lbW9yeVN0b3JhZ2UoKTtcbmNvbnN0IERTID0gbmV3IERhdGFzdG9yZSh7c3RvcmFnZTogW21lbXN0b3JlMSwgbWVtc3RvcmUyXX0pO1xuXG5jbGFzcyBUZXN0VHlwZSBleHRlbmRzIERTLkJhc2Uge31cblxuVGVzdFR5cGUuJGZpZWxkcyA9IHtcbiAgaWQ6IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbiAgbmFtZToge1xuICAgIHR5cGU6ICdzdHJpbmcnLFxuICB9LFxuICBjaGlsZHJlbjoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICBjaGlsZFR5cGU6ICdUZXN0VHlwZScsXG4gIH0sXG59O1xuXG5UZXN0VHlwZS4kaWQgPSAnaWQnO1xuXG5UZXN0VHlwZS4kbmFtZSA9ICdUZXN0JztcblxuRFMuZGVmaW5lVHlwZShUZXN0VHlwZSk7XG5cbmNoYWkudXNlKGNoYWlBc1Byb21pc2VkKTtcbmNvbnN0IGV4cGVjdCA9IGNoYWkuZXhwZWN0O1xuXG5kZXNjcmliZSgnbW9kZWwnLCAoKSA9PiB7XG4gIGl0KCdzaG91bGQgc2F2ZSBmaWVsZCB1cGRhdGVzIHRvIGFsbCBkYXRhc3RvcmVzJyk7XG5cbiAgaXQoJ3Nob3VsZCByZXR1cm4gcHJvbWlzZXMgdG8gZXhpc3RpbmcgZGF0YScsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe2lkOiAxLCBuYW1lOiAncG90YXRvJ30pO1xuICAgIGV4cGVjdChvbmUuJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdwb3RhdG8nKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBsb2FkIGRhdGEgZnJvbSBkYXRhc3RvcmVzJywgKCkgPT4ge1xuICAgIHJldHVybiBtZW1zdG9yZTIud3JpdGUoVGVzdFR5cGUsIHtcbiAgICAgIGlkOiAyLFxuICAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCB0d28gPSBEUy5maW5kKCdUZXN0JywgMik7XG4gICAgICByZXR1cm4gZXhwZWN0KHR3by4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3BvdGF0bycpO1xuICAgIH0pO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIG9wdGltaXN0aWNhbGx5IHVwZGF0ZSBvbiBmaWVsZCB1cGRhdGVzJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7aWQ6IDEsIG5hbWU6ICdwb3RhdG8nfSk7XG4gICAgb25lLiRzZXQoe25hbWU6ICdydXRhYmFnYSd9KTtcbiAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3J1dGFiYWdhJyk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgc2F2ZSB1cGRhdGVzIHRvIGRhdGFzdG9yZXMnKTtcblxuICBpdCgnc2hvdWxkIGxhenktbG9hZCBoYXNNYW55IGxpc3RzJyk7XG4gIGl0KCdzaG91bGQgYWRkIGhhc01hbnkgZWxlbWVudHMnKTtcbiAgaXQoJ3Nob3VsZCByZW1vdmUgaGFzTWFueSBlbGVtZW50cycpO1xuICBpdCgnc2hvdWxkIHVwZGF0ZSBhbiBpbmZsYXRlZCB2ZXJzaW9uIG9mIGl0cyBoYXNNYW55IHJlbGF0aW9ucycpO1xuICBpdCgnc2hvdWxkIG9wdGltaXN0aWNhbGx5IHVwZGF0ZSBoYXNNYW55IGNoYW5nZXMnKTtcbiAgaXQoJ3Nob3VsZCByb2xsIGJhY2sgb3B0aW1pc3RpYyBjaGFuZ2VzIG9uIGVycm9yJyk7XG4gIGl0KCdzaG91bGQgcmV0dXJuIGVycm9ycyB3aGVuIGZldGNoaW5nIHVuZGVmaW5lZCBmaWVsZHMnKTtcbiAgaXQoJ3Nob3VsZCBmaXJlIGV2ZW50cyB3aGVuIHVuZGVybHlpbmcgZGF0YSBjaGFuZ2VzJyk7XG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
