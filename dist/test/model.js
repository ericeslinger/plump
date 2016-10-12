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
  },
  valenceChildren: {
    type: 'hasMany',
    relationship: 'children',
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
      return expect(one.$get('children')).to.eventually.deep.equal([{ id: 100 }]);
    });
  });

  it('should remove hasMany elements', function () {
    var one = new TestType({ name: 'frotato' }, guild);
    return one.$save().then(function () {
      return one.$add('children', 100);
    }).then(function () {
      return expect(one.$get('children')).to.eventually.deep.equal([{ id: 100 }]);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUyIiwidGVybWluYWwiLCJUZXN0VHlwZSIsIiRuYW1lIiwiJGlkIiwiJGZpZWxkcyIsImlkIiwidHlwZSIsIm5hbWUiLCJleHRlbmRlZCIsImNoaWxkcmVuIiwicmVsYXRpb25zaGlwIiwicGFyZW50RmllbGQiLCJjaGlsZEZpZWxkIiwiY2hpbGRUeXBlIiwidmFsZW5jZUNoaWxkcmVuIiwiZXh0cmFzIiwiZ3VpbGQiLCJzdG9yYWdlIiwidHlwZXMiLCJ1c2UiLCJleHBlY3QiLCJkZXNjcmliZSIsIml0Iiwib25lIiwiJGdldCIsInRvIiwiZXZlbnR1YWxseSIsImVxdWFsIiwid3JpdGUiLCJ0aGVuIiwidHdvIiwiZmluZCIsIm5vSUQiLCIkc2F2ZSIsImhhdmUiLCJhbGwiLCJrZXlzIiwiZGVlcCIsIiRzZXQiLCIkYWRkIiwiJHJlbW92ZSJdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7OztBQUNBOzs7O0FBRUE7O0FBQ0E7O0FBQ0E7Ozs7Ozs7OytlQVBBOztBQVNBO0FBQ0EsSUFBTUEsWUFBWSwwQkFBa0IsRUFBQ0MsVUFBVSxJQUFYLEVBQWxCLENBQWxCOztJQUVNQyxROzs7Ozs7Ozs7Ozs7QUFFTkEsU0FBU0MsS0FBVCxHQUFpQixPQUFqQjtBQUNBRCxTQUFTRSxHQUFULEdBQWUsSUFBZjtBQUNBRixTQUFTRyxPQUFULEdBQW1CO0FBQ2pCQyxNQUFJO0FBQ0ZDLFVBQU07QUFESixHQURhO0FBSWpCQyxRQUFNO0FBQ0pELFVBQU07QUFERixHQUpXO0FBT2pCRSxZQUFVO0FBQ1JGLFVBQU07QUFERSxHQVBPO0FBVWpCRyxZQUFVO0FBQ1JILFVBQU0sU0FERTtBQUVSSSxrQkFBYyxVQUZOO0FBR1JDLGlCQUFhLFdBSEw7QUFJUkMsZ0JBQVksVUFKSjtBQUtSQyxlQUFXO0FBTEgsR0FWTztBQWlCakJDLG1CQUFpQjtBQUNmUixVQUFNLFNBRFM7QUFFZkksa0JBQWMsVUFGQztBQUdmQyxpQkFBYSxXQUhF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RDtBQUFBLGFBQU1OLElBQUlnQixJQUFKLENBQVMsVUFBVCxFQUFxQixHQUFyQixDQUFOO0FBQUEsS0FEQyxFQUVOVixJQUZNLENBRUQ7QUFBQSxhQUFNVCxPQUFPRyxJQUFJQyxJQUFKLENBQVMsVUFBVCxDQUFQLEVBQTZCQyxFQUE3QixDQUFnQ0MsVUFBaEMsQ0FBMkNXLElBQTNDLENBQWdEVixLQUFoRCxDQUFzRCxDQUFDLEVBQUN0QixJQUFJLEdBQUwsRUFBRCxDQUF0RCxDQUFOO0FBQUEsS0FGQyxFQUdOd0IsSUFITSxDQUdEO0FBQUEsYUFBTU4sSUFBSWlCLE9BQUosQ0FBWSxVQUFaLEVBQXdCLEdBQXhCLENBQU47QUFBQSxLQUhDLEVBSU5YLElBSk0sQ0FJRDtBQUFBLGFBQU1ULE9BQU9HLElBQUlDLElBQUosQ0FBUyxVQUFULENBQVAsRUFBNkJDLEVBQTdCLENBQWdDQyxVQUFoQyxDQUEyQ1csSUFBM0MsQ0FBZ0RWLEtBQWhELENBQXNELEVBQXRELENBQU47QUFBQSxLQUpDLENBQVA7QUFLRCxHQVBEOztBQVNBTCxLQUFHLDREQUFIO0FBQ0FBLEtBQUcsOENBQUg7QUFDQUEsS0FBRyw4Q0FBSDtBQUNBQSxLQUFHLHFEQUFIO0FBQ0FBLEtBQUcsaURBQUg7QUFDRCxDQXJFRCIsImZpbGUiOiJ0ZXN0L21vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlLCBtb2NoYSovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuXG5pbXBvcnQgeyBNZW1vcnlTdG9yYWdlIH0gZnJvbSAnLi4vc3RvcmFnZS9tZW1vcnknO1xuaW1wb3J0IHsgR3VpbGQgfSBmcm9tICcuLi9ndWlsZCc7XG5pbXBvcnQgeyBNb2RlbCB9IGZyb20gJy4uL21vZGVsJztcblxuLy8gY29uc3QgbWVtc3RvcmUxID0gbmV3IE1lbW9yeVN0b3JhZ2UoKTtcbmNvbnN0IG1lbXN0b3JlMiA9IG5ldyBNZW1vcnlTdG9yYWdlKHt0ZXJtaW5hbDogdHJ1ZX0pO1xuXG5jbGFzcyBUZXN0VHlwZSBleHRlbmRzIE1vZGVsIHt9XG5cblRlc3RUeXBlLiRuYW1lID0gJ3Rlc3RzJztcblRlc3RUeXBlLiRpZCA9ICdpZCc7XG5UZXN0VHlwZS4kZmllbGRzID0ge1xuICBpZDoge1xuICAgIHR5cGU6ICdudW1iZXInLFxuICB9LFxuICBuYW1lOiB7XG4gICAgdHlwZTogJ3N0cmluZycsXG4gIH0sXG4gIGV4dGVuZGVkOiB7XG4gICAgdHlwZTogJ29iamVjdCcsXG4gIH0sXG4gIGNoaWxkcmVuOiB7XG4gICAgdHlwZTogJ2hhc01hbnknLFxuICAgIHJlbGF0aW9uc2hpcDogJ2NoaWxkcmVuJyxcbiAgICBwYXJlbnRGaWVsZDogJ3BhcmVudF9pZCcsXG4gICAgY2hpbGRGaWVsZDogJ2NoaWxkX2lkJyxcbiAgICBjaGlsZFR5cGU6ICd0ZXN0cycsXG4gIH0sXG4gIHZhbGVuY2VDaGlsZHJlbjoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICByZWxhdGlvbnNoaXA6ICdjaGlsZHJlbicsXG4gICAgcGFyZW50RmllbGQ6ICdwYXJlbnRfaWQnLFxuICAgIGNoaWxkRmllbGQ6ICdjaGlsZF9pZCcsXG4gICAgY2hpbGRUeXBlOiAndGVzdHMnLFxuICAgIGV4dHJhczogWydwZXJtJ10sXG4gIH0sXG59O1xuXG5jb25zdCBndWlsZCA9IG5ldyBHdWlsZCh7XG4gIHN0b3JhZ2U6IFttZW1zdG9yZTJdLFxuICB0eXBlczogW1Rlc3RUeXBlXSxcbn0pO1xuXG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5jb25zdCBleHBlY3QgPSBjaGFpLmV4cGVjdDtcblxuZGVzY3JpYmUoJ21vZGVsJywgKCkgPT4ge1xuICBpdCgnc2hvdWxkIHNhdmUgZmllbGQgdXBkYXRlcyB0byBhbGwgZGF0YXN0b3JlcycpO1xuXG4gIGl0KCdzaG91bGQgcmV0dXJuIHByb21pc2VzIHRvIGV4aXN0aW5nIGRhdGEnLCAoKSA9PiB7XG4gICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHtpZDogMSwgbmFtZTogJ3BvdGF0byd9KTtcbiAgICBleHBlY3Qob25lLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncG90YXRvJyk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgbG9hZCBkYXRhIGZyb20gZGF0YXN0b3JlcycsICgpID0+IHtcbiAgICByZXR1cm4gbWVtc3RvcmUyLndyaXRlKFRlc3RUeXBlLCB7XG4gICAgICBpZDogMixcbiAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3QgdHdvID0gZ3VpbGQuZmluZCgndGVzdHMnLCAyKTtcbiAgICAgIHJldHVybiBleHBlY3QodHdvLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncG90YXRvJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgY3JlYXRlIGFuIGlkIHdoZW4gb25lIGlzIHVuc2V0JywgKCkgPT4ge1xuICAgIGNvbnN0IG5vSUQgPSBuZXcgVGVzdFR5cGUoe25hbWU6ICdwb3RhdG8nfSwgZ3VpbGQpO1xuICAgIHJldHVybiBleHBlY3Qobm9JRC4kc2F2ZSgpKS50by5ldmVudHVhbGx5LmhhdmUuYWxsLmtleXMoJ25hbWUnLCAnaWQnKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBhbGxvdyBmaWVsZHMgdG8gYmUgbG9hZGVkJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7bmFtZTogJ3BvdGF0byd9LCBndWlsZCk7XG4gICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgLnRoZW4oKCkgPT4gZXhwZWN0KGd1aWxkLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdwb3RhdG8nKSlcbiAgICAudGhlbigoKSA9PiBleHBlY3QoZ3VpbGQuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7bmFtZTogJ3BvdGF0bycsIGlkOiBvbmUuJGlkfSkpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIG9wdGltaXN0aWNhbGx5IHVwZGF0ZSBvbiBmaWVsZCB1cGRhdGVzJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7bmFtZTogJ3BvdGF0byd9LCBndWlsZCk7XG4gICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgLnRoZW4oKCkgPT4gb25lLiRzZXQoe25hbWU6ICdydXRhYmFnYSd9KSlcbiAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncnV0YWJhZ2EnKSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgc2F2ZSB1cGRhdGVzIHRvIGRhdGFzdG9yZXMnKTtcblxuICBpdCgnc2hvdWxkIHNob3cgZW1wdHkgaGFzTWFueSBsaXN0cyBhcyBbXScsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe25hbWU6ICdmcm90YXRvJ30sIGd1aWxkKTtcbiAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbXSkpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIGFkZCBoYXNNYW55IGVsZW1lbnRzJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7bmFtZTogJ2Zyb3RhdG8nfSwgZ3VpbGQpO1xuICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIDEwMCkpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSlcbiAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW3tpZDogMTAwfV0pXG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgcmVtb3ZlIGhhc01hbnkgZWxlbWVudHMnLCAoKSA9PiB7XG4gICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHtuYW1lOiAnZnJvdGF0byd9LCBndWlsZCk7XG4gICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbe2lkOiAxMDB9XSkpXG4gICAgLnRoZW4oKCkgPT4gb25lLiRyZW1vdmUoJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbXSkpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIHVwZGF0ZSBhbiBpbmZsYXRlZCB2ZXJzaW9uIG9mIGl0cyBoYXNNYW55IHJlbGF0aW9ucycpO1xuICBpdCgnc2hvdWxkIG9wdGltaXN0aWNhbGx5IHVwZGF0ZSBoYXNNYW55IGNoYW5nZXMnKTtcbiAgaXQoJ3Nob3VsZCByb2xsIGJhY2sgb3B0aW1pc3RpYyBjaGFuZ2VzIG9uIGVycm9yJyk7XG4gIGl0KCdzaG91bGQgcmV0dXJuIGVycm9ycyB3aGVuIGZldGNoaW5nIHVuZGVmaW5lZCBmaWVsZHMnKTtcbiAgaXQoJ3Nob3VsZCBmaXJlIGV2ZW50cyB3aGVuIHVuZGVybHlpbmcgZGF0YSBjaGFuZ2VzJyk7XG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
