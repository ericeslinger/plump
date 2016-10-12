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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUyIiwidGVybWluYWwiLCJUZXN0VHlwZSIsIiRuYW1lIiwiJGlkIiwiJGZpZWxkcyIsImlkIiwidHlwZSIsIm5hbWUiLCJleHRlbmRlZCIsImNoaWxkcmVuIiwicmVsYXRpb25zaGlwIiwicGFyZW50RmllbGQiLCJjaGlsZEZpZWxkIiwiY2hpbGRUeXBlIiwiZ3VpbGQiLCJzdG9yYWdlIiwidHlwZXMiLCJ1c2UiLCJleHBlY3QiLCJkZXNjcmliZSIsIml0Iiwib25lIiwiJGdldCIsInRvIiwiZXZlbnR1YWxseSIsImVxdWFsIiwid3JpdGUiLCJ0aGVuIiwidHdvIiwiZmluZCIsIm5vSUQiLCIkc2F2ZSIsImhhdmUiLCJhbGwiLCJrZXlzIiwiJHNldCIsImRlZXAiLCIkYWRkIiwiJHJlbW92ZSJdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7OztBQUNBOzs7O0FBRUE7O0FBQ0E7O0FBQ0E7Ozs7Ozs7OytlQVBBOztBQVNBO0FBQ0EsSUFBTUEsWUFBWSwwQkFBa0IsRUFBQ0MsVUFBVSxJQUFYLEVBQWxCLENBQWxCOztJQUVNQyxROzs7Ozs7Ozs7Ozs7QUFFTkEsU0FBU0MsS0FBVCxHQUFpQixPQUFqQjtBQUNBRCxTQUFTRSxHQUFULEdBQWUsSUFBZjtBQUNBRixTQUFTRyxPQUFULEdBQW1CO0FBQ2pCQyxNQUFJO0FBQ0ZDLFVBQU07QUFESixHQURhO0FBSWpCQyxRQUFNO0FBQ0pELFVBQU07QUFERixHQUpXO0FBT2pCRSxZQUFVO0FBQ1JGLFVBQU07QUFERSxHQVBPO0FBVWpCRyxZQUFVO0FBQ1JILFVBQU0sU0FERTtBQUVSSSxrQkFBYyxVQUZOO0FBR1JDLGlCQUFhLFdBSEw7QUFJUkMsZ0JBQVksVUFKSjtBQUtSQyxlQUFXO0FBTEg7QUFWTyxDQUFuQjs7QUFtQkEsSUFBTUMsUUFBUSxpQkFBVTtBQUN0QkMsV0FBUyxDQUFDaEIsU0FBRCxDQURhO0FBRXRCaUIsU0FBTyxDQUFDZixRQUFEO0FBRmUsQ0FB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Z0RYLEtBQWhELENBQXNELENBQUMsR0FBRCxDQUF0RCxDQUFOO0FBQUEsS0FGQyxDQUFQO0FBR0QsR0FMRDs7QUFPQUwsS0FBRyxnQ0FBSCxFQUFxQyxZQUFNO0FBQ3pDLFFBQU1DLE1BQU0sSUFBSXBCLFFBQUosQ0FBYSxFQUFDTSxNQUFNLFNBQVAsRUFBYixFQUFnQ08sS0FBaEMsQ0FBWjtBQUNBLFdBQU9PLElBQUlVLEtBQUosR0FDTkosSUFETSxDQUNEO0FBQUEsYUFBTU4sSUFBSWdCLElBQUosQ0FBUyxVQUFULEVBQXFCLEdBQXJCLENBQU47QUFBQSxLQURDLEVBRU5WLElBRk0sQ0FFRDtBQUFBLGFBQU1ULE9BQU9HLElBQUlDLElBQUosQ0FBUyxVQUFULENBQVAsRUFBNkJDLEVBQTdCLENBQWdDQyxVQUFoQyxDQUEyQ1ksSUFBM0MsQ0FBZ0RYLEtBQWhELENBQXNELENBQUMsR0FBRCxDQUF0RCxDQUFOO0FBQUEsS0FGQyxFQUdORSxJQUhNLENBR0Q7QUFBQSxhQUFNTixJQUFJaUIsT0FBSixDQUFZLFVBQVosRUFBd0IsR0FBeEIsQ0FBTjtBQUFBLEtBSEMsRUFJTlgsSUFKTSxDQUlEO0FBQUEsYUFBTVQsT0FBT0csSUFBSUMsSUFBSixDQUFTLFVBQVQsQ0FBUCxFQUE2QkMsRUFBN0IsQ0FBZ0NDLFVBQWhDLENBQTJDWSxJQUEzQyxDQUFnRFgsS0FBaEQsQ0FBc0QsRUFBdEQsQ0FBTjtBQUFBLEtBSkMsQ0FBUDtBQUtELEdBUEQ7O0FBU0FMLEtBQUcsNERBQUg7QUFDQUEsS0FBRyw4Q0FBSDtBQUNBQSxLQUFHLDhDQUFIO0FBQ0FBLEtBQUcscURBQUg7QUFDQUEsS0FBRyxpREFBSDtBQUNELENBM0REIiwiZmlsZSI6InRlc3QvbW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZW52IG5vZGUsIG1vY2hhKi9cblxuaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5pbXBvcnQgY2hhaUFzUHJvbWlzZWQgZnJvbSAnY2hhaS1hcy1wcm9taXNlZCc7XG5cbmltcG9ydCB7IE1lbW9yeVN0b3JhZ2UgfSBmcm9tICcuLi9zdG9yYWdlL21lbW9yeSc7XG5pbXBvcnQgeyBHdWlsZCB9IGZyb20gJy4uL2d1aWxkJztcbmltcG9ydCB7IE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwnO1xuXG4vLyBjb25zdCBtZW1zdG9yZTEgPSBuZXcgTWVtb3J5U3RvcmFnZSgpO1xuY29uc3QgbWVtc3RvcmUyID0gbmV3IE1lbW9yeVN0b3JhZ2Uoe3Rlcm1pbmFsOiB0cnVlfSk7XG5cbmNsYXNzIFRlc3RUeXBlIGV4dGVuZHMgTW9kZWwge31cblxuVGVzdFR5cGUuJG5hbWUgPSAndGVzdHMnO1xuVGVzdFR5cGUuJGlkID0gJ2lkJztcblRlc3RUeXBlLiRmaWVsZHMgPSB7XG4gIGlkOiB7XG4gICAgdHlwZTogJ251bWJlcicsXG4gIH0sXG4gIG5hbWU6IHtcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgfSxcbiAgZXh0ZW5kZWQ6IHtcbiAgICB0eXBlOiAnb2JqZWN0JyxcbiAgfSxcbiAgY2hpbGRyZW46IHtcbiAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgcmVsYXRpb25zaGlwOiAnY2hpbGRyZW4nLFxuICAgIHBhcmVudEZpZWxkOiAncGFyZW50X2lkJyxcbiAgICBjaGlsZEZpZWxkOiAnY2hpbGRfaWQnLFxuICAgIGNoaWxkVHlwZTogJ3Rlc3RzJyxcbiAgfSxcbn07XG5cbmNvbnN0IGd1aWxkID0gbmV3IEd1aWxkKHtcbiAgc3RvcmFnZTogW21lbXN0b3JlMl0sXG4gIHR5cGVzOiBbVGVzdFR5cGVdLFxufSk7XG5cbmNoYWkudXNlKGNoYWlBc1Byb21pc2VkKTtcbmNvbnN0IGV4cGVjdCA9IGNoYWkuZXhwZWN0O1xuXG5kZXNjcmliZSgnbW9kZWwnLCAoKSA9PiB7XG4gIGl0KCdzaG91bGQgc2F2ZSBmaWVsZCB1cGRhdGVzIHRvIGFsbCBkYXRhc3RvcmVzJyk7XG5cbiAgaXQoJ3Nob3VsZCByZXR1cm4gcHJvbWlzZXMgdG8gZXhpc3RpbmcgZGF0YScsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe2lkOiAxLCBuYW1lOiAncG90YXRvJ30pO1xuICAgIGV4cGVjdChvbmUuJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdwb3RhdG8nKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBsb2FkIGRhdGEgZnJvbSBkYXRhc3RvcmVzJywgKCkgPT4ge1xuICAgIHJldHVybiBtZW1zdG9yZTIud3JpdGUoVGVzdFR5cGUsIHtcbiAgICAgIGlkOiAyLFxuICAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCB0d28gPSBndWlsZC5maW5kKCd0ZXN0cycsIDIpO1xuICAgICAgcmV0dXJuIGV4cGVjdCh0d28uJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdwb3RhdG8nKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBjcmVhdGUgYW4gaWQgd2hlbiBvbmUgaXMgdW5zZXQnLCAoKSA9PiB7XG4gICAgY29uc3Qgbm9JRCA9IG5ldyBUZXN0VHlwZSh7bmFtZTogJ3BvdGF0byd9LCBndWlsZCk7XG4gICAgcmV0dXJuIGV4cGVjdChub0lELiRzYXZlKCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5hbGwua2V5cygnbmFtZScsICdpZCcpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIG9wdGltaXN0aWNhbGx5IHVwZGF0ZSBvbiBmaWVsZCB1cGRhdGVzJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7bmFtZTogJ3BvdGF0byd9LCBndWlsZCk7XG4gICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgLnRoZW4oKCkgPT4gb25lLiRzZXQoe25hbWU6ICdydXRhYmFnYSd9KSlcbiAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncnV0YWJhZ2EnKSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgc2F2ZSB1cGRhdGVzIHRvIGRhdGFzdG9yZXMnKTtcblxuICBpdCgnc2hvdWxkIHNob3cgZW1wdHkgaGFzTWFueSBsaXN0cyBhcyBbXScsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe25hbWU6ICdmcm90YXRvJ30sIGd1aWxkKTtcbiAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbXSkpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIGFkZCBoYXNNYW55IGVsZW1lbnRzJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7bmFtZTogJ2Zyb3RhdG8nfSwgZ3VpbGQpO1xuICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIDEwMCkpXG4gICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoWzEwMF0pKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCByZW1vdmUgaGFzTWFueSBlbGVtZW50cycsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe25hbWU6ICdmcm90YXRvJ30sIGd1aWxkKTtcbiAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDApKVxuICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFsxMDBdKSlcbiAgICAudGhlbigoKSA9PiBvbmUuJHJlbW92ZSgnY2hpbGRyZW4nLCAxMDApKVxuICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFtdKSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgdXBkYXRlIGFuIGluZmxhdGVkIHZlcnNpb24gb2YgaXRzIGhhc01hbnkgcmVsYXRpb25zJyk7XG4gIGl0KCdzaG91bGQgb3B0aW1pc3RpY2FsbHkgdXBkYXRlIGhhc01hbnkgY2hhbmdlcycpO1xuICBpdCgnc2hvdWxkIHJvbGwgYmFjayBvcHRpbWlzdGljIGNoYW5nZXMgb24gZXJyb3InKTtcbiAgaXQoJ3Nob3VsZCByZXR1cm4gZXJyb3JzIHdoZW4gZmV0Y2hpbmcgdW5kZWZpbmVkIGZpZWxkcycpO1xuICBpdCgnc2hvdWxkIGZpcmUgZXZlbnRzIHdoZW4gdW5kZXJseWluZyBkYXRhIGNoYW5nZXMnKTtcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
