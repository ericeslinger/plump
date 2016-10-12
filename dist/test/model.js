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

// const memstore1 = new MemoryStorage();
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
  storage: [memstore2],
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

  it('should allow fields to be loaded', function () {
    var one = new TestType({ name: 'potato' }, guild);
    return one.$save().then(function () {
      return expect(guild.find('tests', one.$id).$get('name')).to.eventually.equal('potato');
    }).then(function () {
      return expect(guild.find('tests', one.$id).$get()).to.eventually.deep.equal({ name: 'potato', id: one.$id });
    });
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

  it('should show empty hasMany lists as []', function () {
    var one = new TestType({ name: 'frotato' }, guild);
    return one.$save().then(function () {
      return expect(one.$get('children')).to.eventually.deep.equal([]);
    });
  });

  it('should add hasMany elements', function () {
    var one = new TestType({ name: 'frotato' }, guild);
    return one.$save().then(function () {
      return one.$add('children', 100);
    }).then(function () {
      return expect(one.$get('children')).to.eventually.deep.equal([100]);
    });
  });

  it('should remove hasMany elements', function () {
    var one = new TestType({ name: 'frotato' }, guild);
    return one.$save().then(function () {
      return one.$add('children', 100);
    }).then(function () {
      return expect(one.$get('children')).to.eventually.deep.equal([100]);
    }).then(function () {
      return one.$remove('children', 100);
    }).then(function () {
      return expect(one.$get('children')).to.eventually.deep.equal([]);
    });
  });

  it('should update an inflated version of its hasMany relations');
  it('should optimistically update hasMany changes');
  it('should roll back optimistic changes on error');
  it('should return errors when fetching undefined fields');
  it('should fire events when underlying data changes');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUyIiwidGVybWluYWwiLCJUZXN0VHlwZSIsIiRuYW1lIiwiJGlkIiwiJGZpZWxkcyIsImlkIiwidHlwZSIsIm5hbWUiLCJleHRlbmRlZCIsImNoaWxkcmVuIiwicmVsYXRpb25zaGlwIiwicGFyZW50RmllbGQiLCJjaGlsZEZpZWxkIiwiY2hpbGRUeXBlIiwiZ3VpbGQiLCJzdG9yYWdlIiwidHlwZXMiLCJ1c2UiLCJleHBlY3QiLCJkZXNjcmliZSIsIml0Iiwib25lIiwiJGdldCIsInRvIiwiZXZlbnR1YWxseSIsImVxdWFsIiwid3JpdGUiLCJ0aGVuIiwidHdvIiwiZmluZCIsIm5vSUQiLCIkc2F2ZSIsImhhdmUiLCJhbGwiLCJrZXlzIiwiZGVlcCIsIiRzZXQiLCIkYWRkIiwiJHJlbW92ZSJdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7OztBQUNBOzs7O0FBRUE7O0FBQ0E7O0FBQ0E7Ozs7Ozs7OytlQVBBOztBQVNBO0FBQ0EsSUFBTUEsWUFBWSwwQkFBa0IsRUFBQ0MsVUFBVSxJQUFYLEVBQWxCLENBQWxCOztJQUVNQyxROzs7Ozs7Ozs7Ozs7QUFFTkEsU0FBU0MsS0FBVCxHQUFpQixPQUFqQjtBQUNBRCxTQUFTRSxHQUFULEdBQWUsSUFBZjtBQUNBRixTQUFTRyxPQUFULEdBQW1CO0FBQ2pCQyxNQUFJO0FBQ0ZDLFVBQU07QUFESixHQURhO0FBSWpCQyxRQUFNO0FBQ0pELFVBQU07QUFERixHQUpXO0FBT2pCRSxZQUFVO0FBQ1JGLFVBQU07QUFERSxHQVBPO0FBVWpCRyxZQUFVO0FBQ1JILFVBQU0sU0FERTtBQUVSSSxrQkFBYyxVQUZOO0FBR1JDLGlCQUFhLFdBSEw7QUFJUkMsZ0JBQVksVUFKSjtBQUtSQyxlQUFXO0FBTEg7QUFWTyxDQUFuQjs7QUFtQkEsSUFBTUMsUUFBUSxpQkFBVTtBQUN0QkMsV0FBUyxDQUFDaEIsU0FBRCxDQURhO0FBRXRCaUIsU0FBTyxDQUFDZixRQUFEO0FBRmUsQ0FB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Q0FBc0QsQ0FBQyxHQUFELENBQXRELENBQU47QUFBQSxLQUZDLEVBR05FLElBSE0sQ0FHRDtBQUFBLGFBQU1OLElBQUlpQixPQUFKLENBQVksVUFBWixFQUF3QixHQUF4QixDQUFOO0FBQUEsS0FIQyxFQUlOWCxJQUpNLENBSUQ7QUFBQSxhQUFNVCxPQUFPRyxJQUFJQyxJQUFKLENBQVMsVUFBVCxDQUFQLEVBQTZCQyxFQUE3QixDQUFnQ0MsVUFBaEMsQ0FBMkNXLElBQTNDLENBQWdEVixLQUFoRCxDQUFzRCxFQUF0RCxDQUFOO0FBQUEsS0FKQyxDQUFQO0FBS0QsR0FQRDs7QUFTQUwsS0FBRyw0REFBSDtBQUNBQSxLQUFHLDhDQUFIO0FBQ0FBLEtBQUcsOENBQUg7QUFDQUEsS0FBRyxxREFBSDtBQUNBQSxLQUFHLGlEQUFIO0FBQ0QsQ0FsRUQiLCJmaWxlIjoidGVzdC9tb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1lbnYgbm9kZSwgbW9jaGEqL1xuXG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcblxuaW1wb3J0IHsgTWVtb3J5U3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2UvbWVtb3J5JztcbmltcG9ydCB7IEd1aWxkIH0gZnJvbSAnLi4vZ3VpbGQnO1xuaW1wb3J0IHsgTW9kZWwgfSBmcm9tICcuLi9tb2RlbCc7XG5cbi8vIGNvbnN0IG1lbXN0b3JlMSA9IG5ldyBNZW1vcnlTdG9yYWdlKCk7XG5jb25zdCBtZW1zdG9yZTIgPSBuZXcgTWVtb3J5U3RvcmFnZSh7dGVybWluYWw6IHRydWV9KTtcblxuY2xhc3MgVGVzdFR5cGUgZXh0ZW5kcyBNb2RlbCB7fVxuXG5UZXN0VHlwZS4kbmFtZSA9ICd0ZXN0cyc7XG5UZXN0VHlwZS4kaWQgPSAnaWQnO1xuVGVzdFR5cGUuJGZpZWxkcyA9IHtcbiAgaWQ6IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbiAgbmFtZToge1xuICAgIHR5cGU6ICdzdHJpbmcnLFxuICB9LFxuICBleHRlbmRlZDoge1xuICAgIHR5cGU6ICdvYmplY3QnLFxuICB9LFxuICBjaGlsZHJlbjoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICByZWxhdGlvbnNoaXA6ICdjaGlsZHJlbicsXG4gICAgcGFyZW50RmllbGQ6ICdwYXJlbnRfaWQnLFxuICAgIGNoaWxkRmllbGQ6ICdjaGlsZF9pZCcsXG4gICAgY2hpbGRUeXBlOiAndGVzdHMnLFxuICB9LFxufTtcblxuY29uc3QgZ3VpbGQgPSBuZXcgR3VpbGQoe1xuICBzdG9yYWdlOiBbbWVtc3RvcmUyXSxcbiAgdHlwZXM6IFtUZXN0VHlwZV0sXG59KTtcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbmRlc2NyaWJlKCdtb2RlbCcsICgpID0+IHtcbiAgaXQoJ3Nob3VsZCBzYXZlIGZpZWxkIHVwZGF0ZXMgdG8gYWxsIGRhdGFzdG9yZXMnKTtcblxuICBpdCgnc2hvdWxkIHJldHVybiBwcm9taXNlcyB0byBleGlzdGluZyBkYXRhJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7aWQ6IDEsIG5hbWU6ICdwb3RhdG8nfSk7XG4gICAgZXhwZWN0KG9uZS4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3BvdGF0bycpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIGxvYWQgZGF0YSBmcm9tIGRhdGFzdG9yZXMnLCAoKSA9PiB7XG4gICAgcmV0dXJuIG1lbXN0b3JlMi53cml0ZShUZXN0VHlwZSwge1xuICAgICAgaWQ6IDIsXG4gICAgICBuYW1lOiAncG90YXRvJyxcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IHR3byA9IGd1aWxkLmZpbmQoJ3Rlc3RzJywgMik7XG4gICAgICByZXR1cm4gZXhwZWN0KHR3by4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3BvdGF0bycpO1xuICAgIH0pO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIGNyZWF0ZSBhbiBpZCB3aGVuIG9uZSBpcyB1bnNldCcsICgpID0+IHtcbiAgICBjb25zdCBub0lEID0gbmV3IFRlc3RUeXBlKHtuYW1lOiAncG90YXRvJ30sIGd1aWxkKTtcbiAgICByZXR1cm4gZXhwZWN0KG5vSUQuJHNhdmUoKSkudG8uZXZlbnR1YWxseS5oYXZlLmFsbC5rZXlzKCduYW1lJywgJ2lkJyk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgYWxsb3cgZmllbGRzIHRvIGJlIGxvYWRlZCcsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe25hbWU6ICdwb3RhdG8nfSwgZ3VpbGQpO1xuICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgIC50aGVuKCgpID0+IGV4cGVjdChndWlsZC5maW5kKCd0ZXN0cycsIG9uZS4kaWQpLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncG90YXRvJykpXG4gICAgLnRoZW4oKCkgPT4gZXhwZWN0KGd1aWxkLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe25hbWU6ICdwb3RhdG8nLCBpZDogb25lLiRpZH0pKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBvcHRpbWlzdGljYWxseSB1cGRhdGUgb24gZmllbGQgdXBkYXRlcycsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe25hbWU6ICdwb3RhdG8nfSwgZ3VpbGQpO1xuICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgIC50aGVuKCgpID0+IG9uZS4kc2V0KHtuYW1lOiAncnV0YWJhZ2EnfSkpXG4gICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3J1dGFiYWdhJykpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIHNhdmUgdXBkYXRlcyB0byBkYXRhc3RvcmVzJyk7XG5cbiAgaXQoJ3Nob3VsZCBzaG93IGVtcHR5IGhhc01hbnkgbGlzdHMgYXMgW10nLCAoKSA9PiB7XG4gICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHtuYW1lOiAnZnJvdGF0byd9LCBndWlsZCk7XG4gICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW10pKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBhZGQgaGFzTWFueSBlbGVtZW50cycsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe25hbWU6ICdmcm90YXRvJ30sIGd1aWxkKTtcbiAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDApKVxuICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFsxMDBdKSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgcmVtb3ZlIGhhc01hbnkgZWxlbWVudHMnLCAoKSA9PiB7XG4gICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHtuYW1lOiAnZnJvdGF0byd9LCBndWlsZCk7XG4gICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbMTAwXSkpXG4gICAgLnRoZW4oKCkgPT4gb25lLiRyZW1vdmUoJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbXSkpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIHVwZGF0ZSBhbiBpbmZsYXRlZCB2ZXJzaW9uIG9mIGl0cyBoYXNNYW55IHJlbGF0aW9ucycpO1xuICBpdCgnc2hvdWxkIG9wdGltaXN0aWNhbGx5IHVwZGF0ZSBoYXNNYW55IGNoYW5nZXMnKTtcbiAgaXQoJ3Nob3VsZCByb2xsIGJhY2sgb3B0aW1pc3RpYyBjaGFuZ2VzIG9uIGVycm9yJyk7XG4gIGl0KCdzaG91bGQgcmV0dXJuIGVycm9ycyB3aGVuIGZldGNoaW5nIHVuZGVmaW5lZCBmaWVsZHMnKTtcbiAgaXQoJ3Nob3VsZCBmaXJlIGV2ZW50cyB3aGVuIHVuZGVybHlpbmcgZGF0YSBjaGFuZ2VzJyk7XG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
