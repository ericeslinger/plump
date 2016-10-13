'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _memory = require('../storage/memory');

var _guild = require('../guild');

var _model = require('../model');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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
  },
  valenceChildren: {
    type: 'hasMany',
    relationship: 'valence_children',
    parentField: 'parent_id',
    childField: 'child_id',
    childType: 'tests',
    extras: ['perm']
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
      return expect(one.$get('children')).to.eventually.deep.equal([_defineProperty({}, TestType.$id, 100)]);
    });
  });

  it('should remove hasMany elements', function () {
    var one = new TestType({ name: 'frotato' }, guild);
    return one.$save().then(function () {
      return one.$add('children', 100);
    }).then(function () {
      return expect(one.$get('children')).to.eventually.deep.equal([_defineProperty({}, TestType.$id, 100)]);
    }).then(function () {
      return one.$remove('children', 100);
    }).then(function () {
      return expect(one.$get('children')).to.eventually.deep.equal([]);
    });
  });

  it('should include valence in hasMany operations', function () {
    var one = new TestType({ name: 'grotato' }, guild);
    return one.$save().then(function () {
      return one.$add('valenceChildren', 100, { perm: 1 });
    }).then(function () {
      var _ref3;

      return expect(one.$get('valenceChildren')).to.eventually.deep.equal([(_ref3 = {}, _defineProperty(_ref3, TestType.$id, 100), _defineProperty(_ref3, 'perm', 1), _ref3)]);
    }).then(function () {
      return one.$modifyRelationship('valenceChildren', 100, { perm: 2 });
    }).then(function () {
      var _ref4;

      return expect(one.$get('valenceChildren')).to.eventually.deep.equal([(_ref4 = {}, _defineProperty(_ref4, TestType.$id, 100), _defineProperty(_ref4, 'perm', 2), _ref4)]);
    });
  });

  it('should update an inflated version of its hasMany relations');
  it('should optimistically update hasMany changes');
  it('should roll back optimistic changes on error');
  it('should return errors when fetching undefined fields');
  it('should fire events when underlying data changes');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUyIiwidGVybWluYWwiLCJUZXN0VHlwZSIsIiRuYW1lIiwiJGlkIiwiJGZpZWxkcyIsImlkIiwidHlwZSIsIm5hbWUiLCJleHRlbmRlZCIsImNoaWxkcmVuIiwicmVsYXRpb25zaGlwIiwicGFyZW50RmllbGQiLCJjaGlsZEZpZWxkIiwiY2hpbGRUeXBlIiwidmFsZW5jZUNoaWxkcmVuIiwiZXh0cmFzIiwiZ3VpbGQiLCJzdG9yYWdlIiwidHlwZXMiLCJ1c2UiLCJleHBlY3QiLCJkZXNjcmliZSIsIml0Iiwib25lIiwiJGdldCIsInRvIiwiZXZlbnR1YWxseSIsImVxdWFsIiwid3JpdGUiLCJ0aGVuIiwidHdvIiwiZmluZCIsIm5vSUQiLCIkc2F2ZSIsImhhdmUiLCJhbGwiLCJrZXlzIiwiZGVlcCIsIiRzZXQiLCIkYWRkIiwiJHJlbW92ZSIsInBlcm0iLCIkbW9kaWZ5UmVsYXRpb25zaGlwIl0sIm1hcHBpbmdzIjoiOztBQUVBOzs7O0FBQ0E7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7OzsrZUFQQTs7QUFTQTtBQUNBLElBQU1BLFlBQVksMEJBQWtCLEVBQUNDLFVBQVUsSUFBWCxFQUFsQixDQUFsQjs7SUFFTUMsUTs7Ozs7Ozs7Ozs7O0FBRU5BLFNBQVNDLEtBQVQsR0FBaUIsT0FBakI7QUFDQUQsU0FBU0UsR0FBVCxHQUFlLElBQWY7QUFDQUYsU0FBU0csT0FBVCxHQUFtQjtBQUNqQkMsTUFBSTtBQUNGQyxVQUFNO0FBREosR0FEYTtBQUlqQkMsUUFBTTtBQUNKRCxVQUFNO0FBREYsR0FKVztBQU9qQkUsWUFBVTtBQUNSRixVQUFNO0FBREUsR0FQTztBQVVqQkcsWUFBVTtBQUNSSCxVQUFNLFNBREU7QUFFUkksa0JBQWMsVUFGTjtBQUdSQyxpQkFBYSxXQUhMO0FBSVJDLGdCQUFZLFVBSko7QUFLUkMsZUFBVztBQUxILEdBVk87QUFpQmpCQyxtQkFBaUI7QUFDZlIsVUFBTSxTQURTO0FB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UDtBQUVELEtBTE0sRUFNTjBCLElBTk0sQ0FNRDtBQUFBLGFBQU1OLElBQUltQixtQkFBSixDQUF3QixpQkFBeEIsRUFBMkMsR0FBM0MsRUFBZ0QsRUFBQ0QsTUFBTSxDQUFQLEVBQWhELENBQU47QUFBQSxLQU5DLEVBT05aLElBUE0sQ0FPRCxZQUFNO0FBQUE7O0FBQ1YsYUFBT1QsT0FBT0csSUFBSUMsSUFBSixDQUFTLGlCQUFULENBQVAsRUFDTkMsRUFETSxDQUNIQyxVQURHLENBQ1FXLElBRFIsQ0FDYVYsS0FEYixDQUNtQixxQ0FBRzFCLFNBQVNFLEdBQVosRUFBa0IsR0FBbEIsa0NBQTZCLENBQTdCLFVBRG5CLENBQVA7QUFFRCxLQVZNLENBQVA7QUFXRCxHQWJEOztBQWVBbUIsS0FBRyw0REFBSDtBQUNBQSxLQUFHLDhDQUFIO0FBQ0FBLEtBQUcsOENBQUg7QUFDQUEsS0FBRyxxREFBSDtBQUNBQSxLQUFHLGlEQUFIO0FBQ0QsQ0FwRkQiLCJmaWxlIjoidGVzdC9tb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1lbnYgbm9kZSwgbW9jaGEqL1xuXG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcblxuaW1wb3J0IHsgTWVtb3J5U3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2UvbWVtb3J5JztcbmltcG9ydCB7IEd1aWxkIH0gZnJvbSAnLi4vZ3VpbGQnO1xuaW1wb3J0IHsgTW9kZWwgfSBmcm9tICcuLi9tb2RlbCc7XG5cbi8vIGNvbnN0IG1lbXN0b3JlMSA9IG5ldyBNZW1vcnlTdG9yYWdlKCk7XG5jb25zdCBtZW1zdG9yZTIgPSBuZXcgTWVtb3J5U3RvcmFnZSh7dGVybWluYWw6IHRydWV9KTtcblxuY2xhc3MgVGVzdFR5cGUgZXh0ZW5kcyBNb2RlbCB7fVxuXG5UZXN0VHlwZS4kbmFtZSA9ICd0ZXN0cyc7XG5UZXN0VHlwZS4kaWQgPSAnaWQnO1xuVGVzdFR5cGUuJGZpZWxkcyA9IHtcbiAgaWQ6IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbiAgbmFtZToge1xuICAgIHR5cGU6ICdzdHJpbmcnLFxuICB9LFxuICBleHRlbmRlZDoge1xuICAgIHR5cGU6ICdvYmplY3QnLFxuICB9LFxuICBjaGlsZHJlbjoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICByZWxhdGlvbnNoaXA6ICdjaGlsZHJlbicsXG4gICAgcGFyZW50RmllbGQ6ICdwYXJlbnRfaWQnLFxuICAgIGNoaWxkRmllbGQ6ICdjaGlsZF9pZCcsXG4gICAgY2hpbGRUeXBlOiAndGVzdHMnLFxuICB9LFxuICB2YWxlbmNlQ2hpbGRyZW46IHtcbiAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgcmVsYXRpb25zaGlwOiAndmFsZW5jZV9jaGlsZHJlbicsXG4gICAgcGFyZW50RmllbGQ6ICdwYXJlbnRfaWQnLFxuICAgIGNoaWxkRmllbGQ6ICdjaGlsZF9pZCcsXG4gICAgY2hpbGRUeXBlOiAndGVzdHMnLFxuICAgIGV4dHJhczogWydwZXJtJ10sXG4gIH0sXG59O1xuXG5jb25zdCBndWlsZCA9IG5ldyBHdWlsZCh7XG4gIHN0b3JhZ2U6IFttZW1zdG9yZTJdLFxuICB0eXBlczogW1Rlc3RUeXBlXSxcbn0pO1xuXG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5jb25zdCBleHBlY3QgPSBjaGFpLmV4cGVjdDtcblxuZGVzY3JpYmUoJ21vZGVsJywgKCkgPT4ge1xuICBpdCgnc2hvdWxkIHNhdmUgZmllbGQgdXBkYXRlcyB0byBhbGwgZGF0YXN0b3JlcycpO1xuXG4gIGl0KCdzaG91bGQgcmV0dXJuIHByb21pc2VzIHRvIGV4aXN0aW5nIGRhdGEnLCAoKSA9PiB7XG4gICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHtpZDogMSwgbmFtZTogJ3BvdGF0byd9KTtcbiAgICBleHBlY3Qob25lLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncG90YXRvJyk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgbG9hZCBkYXRhIGZyb20gZGF0YXN0b3JlcycsICgpID0+IHtcbiAgICByZXR1cm4gbWVtc3RvcmUyLndyaXRlKFRlc3RUeXBlLCB7XG4gICAgICBpZDogMixcbiAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3QgdHdvID0gZ3VpbGQuZmluZCgndGVzdHMnLCAyKTtcbiAgICAgIHJldHVybiBleHBlY3QodHdvLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncG90YXRvJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgY3JlYXRlIGFuIGlkIHdoZW4gb25lIGlzIHVuc2V0JywgKCkgPT4ge1xuICAgIGNvbnN0IG5vSUQgPSBuZXcgVGVzdFR5cGUoe25hbWU6ICdwb3RhdG8nfSwgZ3VpbGQpO1xuICAgIHJldHVybiBleHBlY3Qobm9JRC4kc2F2ZSgpKS50by5ldmVudHVhbGx5LmhhdmUuYWxsLmtleXMoJ25hbWUnLCAnaWQnKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBhbGxvdyBmaWVsZHMgdG8gYmUgbG9hZGVkJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7bmFtZTogJ3BvdGF0byd9LCBndWlsZCk7XG4gICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgLnRoZW4oKCkgPT4gZXhwZWN0KGd1aWxkLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdwb3RhdG8nKSlcbiAgICAudGhlbigoKSA9PiBleHBlY3QoZ3VpbGQuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7bmFtZTogJ3BvdGF0bycsIGlkOiBvbmUuJGlkfSkpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIG9wdGltaXN0aWNhbGx5IHVwZGF0ZSBvbiBmaWVsZCB1cGRhdGVzJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7bmFtZTogJ3BvdGF0byd9LCBndWlsZCk7XG4gICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgLnRoZW4oKCkgPT4gb25lLiRzZXQoe25hbWU6ICdydXRhYmFnYSd9KSlcbiAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncnV0YWJhZ2EnKSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgc2F2ZSB1cGRhdGVzIHRvIGRhdGFzdG9yZXMnKTtcblxuICBpdCgnc2hvdWxkIHNob3cgZW1wdHkgaGFzTWFueSBsaXN0cyBhcyBbXScsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe25hbWU6ICdmcm90YXRvJ30sIGd1aWxkKTtcbiAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbXSkpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIGFkZCBoYXNNYW55IGVsZW1lbnRzJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7bmFtZTogJ2Zyb3RhdG8nfSwgZ3VpbGQpO1xuICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIDEwMCkpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSlcbiAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW3tbVGVzdFR5cGUuJGlkXTogMTAwfV0pO1xuICAgIH0pO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIHJlbW92ZSBoYXNNYW55IGVsZW1lbnRzJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7bmFtZTogJ2Zyb3RhdG8nfSwgZ3VpbGQpO1xuICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIDEwMCkpXG4gICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW3tbVGVzdFR5cGUuJGlkXTogMTAwfV0pKVxuICAgIC50aGVuKCgpID0+IG9uZS4kcmVtb3ZlKCdjaGlsZHJlbicsIDEwMCkpXG4gICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW10pKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBpbmNsdWRlIHZhbGVuY2UgaW4gaGFzTWFueSBvcGVyYXRpb25zJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7bmFtZTogJ2dyb3RhdG8nfSwgZ3VpbGQpO1xuICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCd2YWxlbmNlQ2hpbGRyZW4nLCAxMDAsIHtwZXJtOiAxfSkpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFt7W1Rlc3RUeXBlLiRpZF06IDEwMCwgcGVybTogMX1dKTtcbiAgICB9KVxuICAgIC50aGVuKCgpID0+IG9uZS4kbW9kaWZ5UmVsYXRpb25zaGlwKCd2YWxlbmNlQ2hpbGRyZW4nLCAxMDAsIHtwZXJtOiAyfSkpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFt7W1Rlc3RUeXBlLiRpZF06IDEwMCwgcGVybTogMn1dKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCB1cGRhdGUgYW4gaW5mbGF0ZWQgdmVyc2lvbiBvZiBpdHMgaGFzTWFueSByZWxhdGlvbnMnKTtcbiAgaXQoJ3Nob3VsZCBvcHRpbWlzdGljYWxseSB1cGRhdGUgaGFzTWFueSBjaGFuZ2VzJyk7XG4gIGl0KCdzaG91bGQgcm9sbCBiYWNrIG9wdGltaXN0aWMgY2hhbmdlcyBvbiBlcnJvcicpO1xuICBpdCgnc2hvdWxkIHJldHVybiBlcnJvcnMgd2hlbiBmZXRjaGluZyB1bmRlZmluZWQgZmllbGRzJyk7XG4gIGl0KCdzaG91bGQgZmlyZSBldmVudHMgd2hlbiB1bmRlcmx5aW5nIGRhdGEgY2hhbmdlcycpO1xufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
