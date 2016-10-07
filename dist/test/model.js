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
var memstore2 = new _memory.MemoryStorage({ terminal: true });
var DS = new _dataStore.Datastore({ storage: [memstore1, memstore2] });

var TestType = function (_DS$Base) {
  _inherits(TestType, _DS$Base);

  function TestType() {
    _classCallCheck(this, TestType);

    return _possibleConstructorReturn(this, (TestType.__proto__ || Object.getPrototypeOf(TestType)).apply(this, arguments));
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

  it('should create an id when one is unset', function () {
    var noID = new TestType({ name: 'potato' });
    return expect(noID.$save()).to.eventually.have.all.keys('name', 'id');
  });

  it('should optimistically update on field updates', function () {
    var one = new TestType({ name: 'potato' });
    return one.$save().then(function () {
      return one.$set({ name: 'rutabaga' });
    }).then(function () {
      return expect(one.$get('name')).to.eventually.equal('rutabaga');
    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUxIiwibWVtc3RvcmUyIiwidGVybWluYWwiLCJEUyIsInN0b3JhZ2UiLCJUZXN0VHlwZSIsIkJhc2UiLCIkZmllbGRzIiwiaWQiLCJ0eXBlIiwibmFtZSIsImNoaWxkcmVuIiwiY2hpbGRUeXBlIiwiJGlkIiwiJG5hbWUiLCJkZWZpbmVUeXBlIiwidXNlIiwiZXhwZWN0IiwiZGVzY3JpYmUiLCJpdCIsIm9uZSIsIiRnZXQiLCJ0byIsImV2ZW50dWFsbHkiLCJlcXVhbCIsIndyaXRlIiwidGhlbiIsInR3byIsImZpbmQiLCJub0lEIiwiJHNhdmUiLCJoYXZlIiwiYWxsIiwia2V5cyIsIiRzZXQiXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOztBQUVBOzs7Ozs7OzsrZUFOQTs7QUFRQSxJQUFNQSxZQUFZLDJCQUFsQjtBQUNBLElBQU1DLFlBQVksMEJBQWtCLEVBQUNDLFVBQVUsSUFBWCxFQUFsQixDQUFsQjtBQUNBLElBQU1DLEtBQUsseUJBQWMsRUFBQ0MsU0FBUyxDQUFDSixTQUFELEVBQVlDLFNBQVosQ0FBVixFQUFkLENBQVg7O0lBRU1JLFE7Ozs7Ozs7Ozs7RUFBaUJGLEdBQUdHLEk7O0FBRTFCRCxTQUFTRSxPQUFULEdBQW1CO0FBQ2pCQyxNQUFJO0FBQ0ZDLFVBQU07QUFESixHQURhO0FBSWpCQyxRQUFNO0FBQ0pELFVBQU07QUFERixHQUpXO0FBT2pCRSxZQUFVO0FBQ1JGLFVBQU0sU0FERTtBQUVSRyxlQUFXO0FBRkg7QUFQTyxDQUFuQjs7QUFhQVAsU0FBU1EsR0FBVCxHQUFlLElBQWY7O0FBRUFSLFNBQVNTLEtBQVQsR0FBaUIsTUFBakI7O0FBRUFYLEdBQUdZLFVBQUgsQ0FBY1YsUUFBZDs7QUFFQSxlQUFLVyxHQUFMO0FBQ0EsSUFBTUMsU0FBUyxlQUFLQSxNQUFwQjs7QUFFQUMsU0FBUyxPQUFULEVBQWtCLFlBQU07QUFDdEJDLEtBQUcsNkNBQUg7O0FBRUFBLEtBQUcseUNBQUgsRUFBOEMsWUFBTTtBQUNsRCxRQUFNQyxNQUFNLElBQUlmLFFBQUosQ0FBYSxFQUFDRyxJQUFJLENBQUwsRUFBUUUsTUFBTSxRQUFkLEVBQWIsQ0FBWjtBQUNBTyxXQUFPRyxJQUFJQyxJQUFKLENBQVMsTUFBVCxDQUFQLEVBQXlCQyxFQUF6QixDQUE0QkMsVUFBNUIsQ0FBdUNDLEtBQXZDLENBQTZDLFFBQTdDO0FBQ0QsR0FIRDs7QUFLQUwsS0FBRyxrQ0FBSCxFQUF1QyxZQUFNO0FBQzNDLFdBQU9sQixVQUFVd0IsS0FBVixDQUFnQnBCLFFBQWhCLEVBQTBCO0FBQy9CRyxVQUFJLENBRDJCO0FBRS9CRSxZQUFNO0FBRnlCLEtBQTFCLEVBR0pnQixJQUhJLENBR0MsWUFBTTtBQUNaLFVBQU1DLE1BQU14QixHQUFHeUIsSUFBSCxDQUFRLE1BQVIsRUFBZ0IsQ0FBaEIsQ0FBWjtBQUNBLGFBQU9YLE9BQU9VLElBQUlOLElBQUosQ0FBUyxNQUFULENBQVAsRUFBeUJDLEVBQXpCLENBQTRCQyxVQUE1QixDQUF1Q0MsS0FBdkMsQ0FBNkMsUUFBN0MsQ0FBUDtBQUNELEtBTk0sQ0FBUDtBQU9ELEdBUkQ7O0FBVUFMLEtBQUcsdUNBQUgsRUFBNEMsWUFBTTtBQUNoRCxRQUFNVSxPQUFPLElBQUl4QixRQUFKLENBQWEsRUFBQ0ssTUFBTSxRQUFQLEVBQWIsQ0FBYjtBQUNBLFdBQU9PLE9BQU9ZLEtBQUtDLEtBQUwsRUFBUCxFQUFxQlIsRUFBckIsQ0FBd0JDLFVBQXhCLENBQW1DUSxJQUFuQyxDQUF3Q0MsR0FBeEMsQ0FBNENDLElBQTVDLENBQWlELE1BQWpELEVBQXlELElBQXpELENBQVA7QUFDRCxHQUhEOztBQUtBZCxLQUFHLCtDQUFILEVBQW9ELFlBQU07QUFDeEQsUUFBTUMsTUFBTSxJQUFJZixRQUFKLENBQWEsRUFBQ0ssTUFBTSxRQUFQLEVBQWIsQ0FBWjtBQUNBLFdBQU9VLElBQUlVLEtBQUosR0FDTkosSUFETSxDQUNEO0FBQUEsYUFBTU4sSUFBSWMsSUFBSixDQUFTLEVBQUN4QixNQUFNLFVBQVAsRUFBVCxDQUFOO0FBQUEsS0FEQyxFQUVOZ0IsSUFGTSxDQUVEO0FBQUEsYUFBTVQsT0FBT0csSUFBSUMsSUFBSixDQUFTLE1BQVQsQ0FBUCxFQUF5QkMsRUFBekIsQ0FBNEJDLFVBQTVCLENBQXVDQyxLQUF2QyxDQUE2QyxVQUE3QyxDQUFOO0FBQUEsS0FGQyxDQUFQO0FBR0QsR0FMRDs7QUFPQUwsS0FBRyxtQ0FBSDs7QUFFQUEsS0FBRyxnQ0FBSDtBQUNBQSxLQUFHLDZCQUFIO0FBQ0FBLEtBQUcsZ0NBQUg7QUFDQUEsS0FBRyw0REFBSDtBQUNBQSxLQUFHLDhDQUFIO0FBQ0FBLEtBQUcsOENBQUg7QUFDQUEsS0FBRyxxREFBSDtBQUNBQSxLQUFHLGlEQUFIO0FBQ0QsQ0F4Q0QiLCJmaWxlIjoidGVzdC9tb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1lbnYgbm9kZSwgbW9jaGEqL1xuXG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCB7IERhdGFzdG9yZSB9IGZyb20gJy4uL2RhdGFTdG9yZSc7XG5cbmltcG9ydCB7IE1lbW9yeVN0b3JhZ2UgfSBmcm9tICcuLi9zdG9yYWdlL21lbW9yeSc7XG5cbmNvbnN0IG1lbXN0b3JlMSA9IG5ldyBNZW1vcnlTdG9yYWdlKCk7XG5jb25zdCBtZW1zdG9yZTIgPSBuZXcgTWVtb3J5U3RvcmFnZSh7dGVybWluYWw6IHRydWV9KTtcbmNvbnN0IERTID0gbmV3IERhdGFzdG9yZSh7c3RvcmFnZTogW21lbXN0b3JlMSwgbWVtc3RvcmUyXX0pO1xuXG5jbGFzcyBUZXN0VHlwZSBleHRlbmRzIERTLkJhc2Uge31cblxuVGVzdFR5cGUuJGZpZWxkcyA9IHtcbiAgaWQ6IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbiAgbmFtZToge1xuICAgIHR5cGU6ICdzdHJpbmcnLFxuICB9LFxuICBjaGlsZHJlbjoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICBjaGlsZFR5cGU6ICdUZXN0VHlwZScsXG4gIH0sXG59O1xuXG5UZXN0VHlwZS4kaWQgPSAnaWQnO1xuXG5UZXN0VHlwZS4kbmFtZSA9ICdUZXN0JztcblxuRFMuZGVmaW5lVHlwZShUZXN0VHlwZSk7XG5cbmNoYWkudXNlKGNoYWlBc1Byb21pc2VkKTtcbmNvbnN0IGV4cGVjdCA9IGNoYWkuZXhwZWN0O1xuXG5kZXNjcmliZSgnbW9kZWwnLCAoKSA9PiB7XG4gIGl0KCdzaG91bGQgc2F2ZSBmaWVsZCB1cGRhdGVzIHRvIGFsbCBkYXRhc3RvcmVzJyk7XG5cbiAgaXQoJ3Nob3VsZCByZXR1cm4gcHJvbWlzZXMgdG8gZXhpc3RpbmcgZGF0YScsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe2lkOiAxLCBuYW1lOiAncG90YXRvJ30pO1xuICAgIGV4cGVjdChvbmUuJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdwb3RhdG8nKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBsb2FkIGRhdGEgZnJvbSBkYXRhc3RvcmVzJywgKCkgPT4ge1xuICAgIHJldHVybiBtZW1zdG9yZTIud3JpdGUoVGVzdFR5cGUsIHtcbiAgICAgIGlkOiAyLFxuICAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCB0d28gPSBEUy5maW5kKCdUZXN0JywgMik7XG4gICAgICByZXR1cm4gZXhwZWN0KHR3by4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3BvdGF0bycpO1xuICAgIH0pO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIGNyZWF0ZSBhbiBpZCB3aGVuIG9uZSBpcyB1bnNldCcsICgpID0+IHtcbiAgICBjb25zdCBub0lEID0gbmV3IFRlc3RUeXBlKHtuYW1lOiAncG90YXRvJ30pO1xuICAgIHJldHVybiBleHBlY3Qobm9JRC4kc2F2ZSgpKS50by5ldmVudHVhbGx5LmhhdmUuYWxsLmtleXMoJ25hbWUnLCAnaWQnKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBvcHRpbWlzdGljYWxseSB1cGRhdGUgb24gZmllbGQgdXBkYXRlcycsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe25hbWU6ICdwb3RhdG8nfSk7XG4gICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgLnRoZW4oKCkgPT4gb25lLiRzZXQoe25hbWU6ICdydXRhYmFnYSd9KSlcbiAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncnV0YWJhZ2EnKSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgc2F2ZSB1cGRhdGVzIHRvIGRhdGFzdG9yZXMnKTtcblxuICBpdCgnc2hvdWxkIGxhenktbG9hZCBoYXNNYW55IGxpc3RzJyk7XG4gIGl0KCdzaG91bGQgYWRkIGhhc01hbnkgZWxlbWVudHMnKTtcbiAgaXQoJ3Nob3VsZCByZW1vdmUgaGFzTWFueSBlbGVtZW50cycpO1xuICBpdCgnc2hvdWxkIHVwZGF0ZSBhbiBpbmZsYXRlZCB2ZXJzaW9uIG9mIGl0cyBoYXNNYW55IHJlbGF0aW9ucycpO1xuICBpdCgnc2hvdWxkIG9wdGltaXN0aWNhbGx5IHVwZGF0ZSBoYXNNYW55IGNoYW5nZXMnKTtcbiAgaXQoJ3Nob3VsZCByb2xsIGJhY2sgb3B0aW1pc3RpYyBjaGFuZ2VzIG9uIGVycm9yJyk7XG4gIGl0KCdzaG91bGQgcmV0dXJuIGVycm9ycyB3aGVuIGZldGNoaW5nIHVuZGVmaW5lZCBmaWVsZHMnKTtcbiAgaXQoJ3Nob3VsZCBmaXJlIGV2ZW50cyB3aGVuIHVuZGVybHlpbmcgZGF0YSBjaGFuZ2VzJyk7XG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
