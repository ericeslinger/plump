'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _memory = require('../storage/memory');

var _guild = require('../guild');

var _model = require('../model');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* eslint-env node, mocha*/

var memstore1 = new _memory.MemoryStorage();
var memstore2 = new _memory.MemoryStorage({ terminal: true });

var TestType = function (_Model) {
  _inherits(TestType, _Model);

  function TestType() {
    _classCallCheck(this, TestType);

    return _possibleConstructorReturn(this, (TestType.__proto__ || Object.getPrototypeOf(TestType)).apply(this, arguments));
  }

  return TestType;
}(_model.Model);

TestType.$name = 'tests';
TestType.$id = 'id';
TestType.$fields = {
  id: {
    type: 'number'
  },
  name: {
    type: 'string'
  },
  extended: {
    type: 'object'
  },
  children: {
    type: 'hasMany',
    relationship: 'children',
    parentField: 'parent_id',
    childField: 'child_id',
    childType: 'tests'
  }
};

var guild = new _guild.Guild({
  storage: [memstore1, memstore2],
  types: [TestType]
});

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
      var two = guild.find('tests', 2);
      return expect(two.$get('name')).to.eventually.equal('potato');
    });
  });

  it('should create an id when one is unset', function () {
    var noID = new TestType({ name: 'potato' }, guild);
    return expect(noID.$save()).to.eventually.have.all.keys('name', 'id');
  });

  it('should optimistically update on field updates', function () {
    var one = new TestType({ name: 'potato' }, guild);
    return one.$save().then(function () {
      return one.$set({ name: 'rutabaga' });
    }).then(function () {
      return expect(one.$get('name')).to.eventually.equal('rutabaga');
    });
  });

  it('should save updates to datastores');

  it('should lazy-load hasMany lists', function () {
    var one = new TestType({ name: 'frotato' }, guild);
    return one.$save().then(function () {
      return one.$add('children', 100);
    }).then(function () {
      return expect(one.$get('children')).to.eventually.deep.equal([100]);
    });
  });

  it('should add hasMany elements');
  it('should remove hasMany elements');
  it('should update an inflated version of its hasMany relations');
  it('should optimistically update hasMany changes');
  it('should roll back optimistic changes on error');
  it('should return errors when fetching undefined fields');
  it('should fire events when underlying data changes');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUxIiwibWVtc3RvcmUyIiwidGVybWluYWwiLCJUZXN0VHlwZSIsIiRuYW1lIiwiJGlkIiwiJGZpZWxkcyIsImlkIiwidHlwZSIsIm5hbWUiLCJleHRlbmRlZCIsImNoaWxkcmVuIiwicmVsYXRpb25zaGlwIiwicGFyZW50RmllbGQiLCJjaGlsZEZpZWxkIiwiY2hpbGRUeXBlIiwiZ3VpbGQiLCJzdG9yYWdlIiwidHlwZXMiLCJ1c2UiLCJleHBlY3QiLCJkZXNjcmliZSIsIml0Iiwib25lIiwiJGdldCIsInRvIiwiZXZlbnR1YWxseSIsImVxdWFsIiwid3JpdGUiLCJ0aGVuIiwidHdvIiwiZmluZCIsIm5vSUQiLCIkc2F2ZSIsImhhdmUiLCJhbGwiLCJrZXlzIiwiJHNldCIsIiRhZGQiLCJkZWVwIl0sIm1hcHBpbmdzIjoiOztBQUVBOzs7O0FBQ0E7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7K2VBUEE7O0FBU0EsSUFBTUEsWUFBWSwyQkFBbEI7QUFDQSxJQUFNQyxZQUFZLDBCQUFrQixFQUFDQyxVQUFVLElBQVgsRUFBbEIsQ0FBbEI7O0lBRU1DLFE7Ozs7Ozs7Ozs7OztBQUVOQSxTQUFTQyxLQUFULEdBQWlCLE9BQWpCO0FBQ0FELFNBQVNFLEdBQVQsR0FBZSxJQUFmO0FBQ0FGLFNBQVNHLE9BQVQsR0FBbUI7QUFDakJDLE1BQUk7QUFDRkMsVUFBTTtBQURKLEdBRGE7QUFJakJDLFFBQU07QUFDSkQsVUFBTTtBQURGLEdBSlc7QUFPakJFLFlBQVU7QUFDUkYsVUFBTTtBQURFLEdBUE87QUFVakJHLFlBQVU7QUFDUkgsVUFBTSxTQURFO0FBRVJJLGtCQUFjLFVBRk47QUFHUkMsaUJBQWEsV0FITDtBQUlSQyxnQkFBWSxVQUpKO0FBS1JDLGVBQVc7QUFMSDtBQVZPLENBQW5COztBQW1CQSxJQUFNQyxRQUFRLGlCQUFVO0FBQ3RCQyxXQUFTLENBQUNqQixTQUFELEVBQVlDLFNBQVosQ0FEYTtB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bnYgbm9kZSwgbW9jaGEqL1xuXG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcblxuaW1wb3J0IHsgTWVtb3J5U3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2UvbWVtb3J5JztcbmltcG9ydCB7IEd1aWxkIH0gZnJvbSAnLi4vZ3VpbGQnO1xuaW1wb3J0IHsgTW9kZWwgfSBmcm9tICcuLi9tb2RlbCc7XG5cbmNvbnN0IG1lbXN0b3JlMSA9IG5ldyBNZW1vcnlTdG9yYWdlKCk7XG5jb25zdCBtZW1zdG9yZTIgPSBuZXcgTWVtb3J5U3RvcmFnZSh7dGVybWluYWw6IHRydWV9KTtcblxuY2xhc3MgVGVzdFR5cGUgZXh0ZW5kcyBNb2RlbCB7fVxuXG5UZXN0VHlwZS4kbmFtZSA9ICd0ZXN0cyc7XG5UZXN0VHlwZS4kaWQgPSAnaWQnO1xuVGVzdFR5cGUuJGZpZWxkcyA9IHtcbiAgaWQ6IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbiAgbmFtZToge1xuICAgIHR5cGU6ICdzdHJpbmcnLFxuICB9LFxuICBleHRlbmRlZDoge1xuICAgIHR5cGU6ICdvYmplY3QnLFxuICB9LFxuICBjaGlsZHJlbjoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICByZWxhdGlvbnNoaXA6ICdjaGlsZHJlbicsXG4gICAgcGFyZW50RmllbGQ6ICdwYXJlbnRfaWQnLFxuICAgIGNoaWxkRmllbGQ6ICdjaGlsZF9pZCcsXG4gICAgY2hpbGRUeXBlOiAndGVzdHMnLFxuICB9LFxufTtcblxuY29uc3QgZ3VpbGQgPSBuZXcgR3VpbGQoe1xuICBzdG9yYWdlOiBbbWVtc3RvcmUxLCBtZW1zdG9yZTJdLFxuICB0eXBlczogW1Rlc3RUeXBlXSxcbn0pO1xuXG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5jb25zdCBleHBlY3QgPSBjaGFpLmV4cGVjdDtcblxuZGVzY3JpYmUoJ21vZGVsJywgKCkgPT4ge1xuICBpdCgnc2hvdWxkIHNhdmUgZmllbGQgdXBkYXRlcyB0byBhbGwgZGF0YXN0b3JlcycpO1xuXG4gIGl0KCdzaG91bGQgcmV0dXJuIHByb21pc2VzIHRvIGV4aXN0aW5nIGRhdGEnLCAoKSA9PiB7XG4gICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHtpZDogMSwgbmFtZTogJ3BvdGF0byd9KTtcbiAgICBleHBlY3Qob25lLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncG90YXRvJyk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgbG9hZCBkYXRhIGZyb20gZGF0YXN0b3JlcycsICgpID0+IHtcbiAgICByZXR1cm4gbWVtc3RvcmUyLndyaXRlKFRlc3RUeXBlLCB7XG4gICAgICBpZDogMixcbiAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3QgdHdvID0gZ3VpbGQuZmluZCgndGVzdHMnLCAyKTtcbiAgICAgIHJldHVybiBleHBlY3QodHdvLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncG90YXRvJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgY3JlYXRlIGFuIGlkIHdoZW4gb25lIGlzIHVuc2V0JywgKCkgPT4ge1xuICAgIGNvbnN0IG5vSUQgPSBuZXcgVGVzdFR5cGUoe25hbWU6ICdwb3RhdG8nfSwgZ3VpbGQpO1xuICAgIHJldHVybiBleHBlY3Qobm9JRC4kc2F2ZSgpKS50by5ldmVudHVhbGx5LmhhdmUuYWxsLmtleXMoJ25hbWUnLCAnaWQnKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBvcHRpbWlzdGljYWxseSB1cGRhdGUgb24gZmllbGQgdXBkYXRlcycsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe25hbWU6ICdwb3RhdG8nfSwgZ3VpbGQpO1xuICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgIC50aGVuKCgpID0+IG9uZS4kc2V0KHtuYW1lOiAncnV0YWJhZ2EnfSkpXG4gICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3J1dGFiYWdhJykpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIHNhdmUgdXBkYXRlcyB0byBkYXRhc3RvcmVzJyk7XG5cbiAgaXQoJ3Nob3VsZCBsYXp5LWxvYWQgaGFzTWFueSBsaXN0cycsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe25hbWU6ICdmcm90YXRvJ30sIGd1aWxkKTtcbiAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDApKVxuICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFsxMDBdKSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgYWRkIGhhc01hbnkgZWxlbWVudHMnKTtcbiAgaXQoJ3Nob3VsZCByZW1vdmUgaGFzTWFueSBlbGVtZW50cycpO1xuICBpdCgnc2hvdWxkIHVwZGF0ZSBhbiBpbmZsYXRlZCB2ZXJzaW9uIG9mIGl0cyBoYXNNYW55IHJlbGF0aW9ucycpO1xuICBpdCgnc2hvdWxkIG9wdGltaXN0aWNhbGx5IHVwZGF0ZSBoYXNNYW55IGNoYW5nZXMnKTtcbiAgaXQoJ3Nob3VsZCByb2xsIGJhY2sgb3B0aW1pc3RpYyBjaGFuZ2VzIG9uIGVycm9yJyk7XG4gIGl0KCdzaG91bGQgcmV0dXJuIGVycm9ycyB3aGVuIGZldGNoaW5nIHVuZGVmaW5lZCBmaWVsZHMnKTtcbiAgaXQoJ3Nob3VsZCBmaXJlIGV2ZW50cyB3aGVuIHVuZGVybHlpbmcgZGF0YSBjaGFuZ2VzJyk7XG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
