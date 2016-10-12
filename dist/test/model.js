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

  it('should lazy-load hasMany lists');
  it('should add hasMany elements');
  it('should remove hasMany elements');
  it('should update an inflated version of its hasMany relations');
  it('should optimistically update hasMany changes');
  it('should roll back optimistic changes on error');
  it('should return errors when fetching undefined fields');
  it('should fire events when underlying data changes');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUxIiwibWVtc3RvcmUyIiwidGVybWluYWwiLCJUZXN0VHlwZSIsIiRuYW1lIiwiJGlkIiwiJGZpZWxkcyIsImlkIiwidHlwZSIsIm5hbWUiLCJleHRlbmRlZCIsImNoaWxkcmVuIiwicmVsYXRpb25zaGlwIiwicGFyZW50RmllbGQiLCJjaGlsZEZpZWxkIiwiY2hpbGRUeXBlIiwiZ3VpbGQiLCJzdG9yYWdlIiwidHlwZXMiLCJ1c2UiLCJleHBlY3QiLCJkZXNjcmliZSIsIml0Iiwib25lIiwiJGdldCIsInRvIiwiZXZlbnR1YWxseSIsImVxdWFsIiwid3JpdGUiLCJ0aGVuIiwidHdvIiwiZmluZCIsIm5vSUQiLCIkc2F2ZSIsImhhdmUiLCJhbGwiLCJrZXlzIiwiJHNldCJdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7OztBQUNBOzs7O0FBRUE7O0FBQ0E7O0FBQ0E7Ozs7Ozs7OytlQVBBOztBQVNBLElBQU1BLFlBQVksMkJBQWxCO0FBQ0EsSUFBTUMsWUFBWSwwQkFBa0IsRUFBQ0MsVUFBVSxJQUFYLEVBQWxCLENBQWxCOztJQUVNQyxROzs7Ozs7Ozs7Ozs7QUFFTkEsU0FBU0MsS0FBVCxHQUFpQixPQUFqQjtBQUNBRCxTQUFTRSxHQUFULEdBQWUsSUFBZjtBQUNBRixTQUFTRyxPQUFULEdBQW1CO0FBQ2pCQyxNQUFJO0FBQ0ZDLFVBQU07QUFESixHQURhO0FBSWpCQyxRQUFNO0FBQ0pELFVBQU07QUFERixHQUpXO0FBT2pCRSxZQUFVO0FBQ1JGLFVBQU07QUFERSxHQVBPO0FBVWpCRyxZQUFVO0FBQ1JILFVBQU0sU0FERTtBQUVSSSxrQkFBYyxVQUZOO0FBR1JDLGlCQUFhLFdBSEw7QUFJUkMsZ0JBQVksVUFKSjtBQUtSQyxlQUFXO0FBTEg7QUFWTyxDQUFuQjs7QUFtQkEsSUFBTUMsUUFBUSxpQkFBVTtBQUN0QkMsV0FBUyxDQUFDakIsU0FBRCxFQUFZQyxTQUFaLENBRGE7QUFFdEJpQixTQUFPLENBQUNmLFFBQUQ7QUFGZSxDQUFWLENBQWQ7O0FBS0EsZUFBS2dCLEdBQUw7QUFDQSxJQUFNQyxTQUFTLGVBQUtBLE1BQXBCOztBQUVBQyxTQUFTLE9BQVQsRUFBa0IsWUFBTTtBQUN0QkMsS0FBRyw2Q0FBSDs7QUFFQUEsS0FBRyx5Q0FBSCxFQUE4QyxZQUFNO0FBQ2xELFFBQU1DLE1BQU0sSUFBSXBCLFFBQUosQ0FBYSxFQUFDSSxJQUFJLENBQUwsRUFBUUUsTUFBTSxRQUFkLEVBQWIsQ0FBWjtBQUNBVyxXQUFPRyxJQUFJQyxJQUFKLENBQVMsTUFBVCxDQUFQLEVBQXlCQyxFQUF6QixDQUE0QkMsVUFBNUIsQ0FBdUNDLEtBQXZDLENBQTZDLFFBQTdDO0FBQ0QsR0FIRDs7QUFLQUwsS0FBRyxrQ0FBSCxFQUF1QyxZQUFNO0FBQzNDLFdBQU9yQixVQUFVMkIsS0FBVixDQUFnQnpCLFFBQWhCLEVBQTBCO0FBQy9CSSxVQUFJLENBRDJCO0FBRS9CRSxZQUFNO0FBRnlCLEtBQTFCLEVBR0pvQixJQUhJLENBR0MsWUFBTTtBQUNaLFVBQU1DLE1BQU1kLE1BQU1lLElBQU4sQ0FBVyxPQUFYLEVBQW9CLENBQXBCLENBQVo7QUFDQSxhQUFPWCxPQUFPVSxJQUFJTixJQUFKLENBQVMsTUFBVCxDQUFQLEVBQXlCQyxFQUF6QixDQUE0QkMsVUFBNUIsQ0FBdUNDLEtBQXZDLENBQTZDLFFBQTdDLENBQVA7QUFDRCxLQU5NLENBQVA7QUFPRCxHQVJEOztBQVVBTCxLQUFHLHVDQUFILEVBQTRDLFlBQU07QUFDaEQsUUFBTVUsT0FBTyxJQUFJN0IsUUFBSixDQUFhLEVBQUNNLE1BQU0sUUFBUCxFQUFiLEVBQStCTyxLQUEvQixDQUFiO0FBQ0EsV0FBT0ksT0FBT1ksS0FBS0MsS0FBTCxFQUFQLEVBQXFCUixFQUFyQixDQUF3QkMsVUFBeEIsQ0FBbUNRLElBQW5DLENBQXdDQyxHQUF4QyxDQUE0Q0MsSUFBNUMsQ0FBaUQsTUFBakQsRUFBeUQsSUFBekQsQ0FBUDtBQUNELEdBSEQ7O0FBS0FkLEtBQUcsK0NBQUgsRUFBb0QsWUFBTTtBQUN4RCxRQUFNQyxNQUFNLElBQUlwQixRQUFKLENBQWEsRUFBQ00sTUFBTSxRQUFQLEVBQWIsRUFBK0JPLEtBQS9CLENBQVo7QUFDQSxXQUFPTyxJQUFJVSxLQUFKLEdBQ05KLElBRE0sQ0FDRDtBQUFBLGFBQU1OLElBQUljLElBQUosQ0FBUyxFQUFDNUIsTUFBTSxVQUFQLEVBQVQsQ0FBTjtBQUFBLEtBREMsRUFFTm9CLElBRk0sQ0FFRDtBQUFBLGFBQU1ULE9BQU9HLElBQUlDLElBQUosQ0FBUyxNQUFULENBQVAsRUFBeUJDLEVBQXpCLENBQTRCQyxVQUE1QixDQUF1Q0MsS0FBdkMsQ0FBNkMsVUFBN0MsQ0FBTjtBQUFBLEtBRkMsQ0FBUDtBQUdELEdBTEQ7O0FBT0FMLEtBQUcsbUNBQUg7O0FBRUFBLEtBQUcsZ0NBQUg7QUFDQUEsS0FBRyw2QkFBSDtBQUNBQSxLQUFHLGdDQUFIO0FBQ0FBLEtBQUcsNERBQUg7QUFDQUEsS0FBRyw4Q0FBSDtBQUNBQSxLQUFHLDhDQUFIO0FBQ0FBLEtBQUcscURBQUg7QUFDQUEsS0FBRyxpREFBSDtBQUNELENBeENEIiwiZmlsZSI6InRlc3QvbW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZW52IG5vZGUsIG1vY2hhKi9cblxuaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5pbXBvcnQgY2hhaUFzUHJvbWlzZWQgZnJvbSAnY2hhaS1hcy1wcm9taXNlZCc7XG5cbmltcG9ydCB7IE1lbW9yeVN0b3JhZ2UgfSBmcm9tICcuLi9zdG9yYWdlL21lbW9yeSc7XG5pbXBvcnQgeyBHdWlsZCB9IGZyb20gJy4uL2d1aWxkJztcbmltcG9ydCB7IE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwnO1xuXG5jb25zdCBtZW1zdG9yZTEgPSBuZXcgTWVtb3J5U3RvcmFnZSgpO1xuY29uc3QgbWVtc3RvcmUyID0gbmV3IE1lbW9yeVN0b3JhZ2Uoe3Rlcm1pbmFsOiB0cnVlfSk7XG5cbmNsYXNzIFRlc3RUeXBlIGV4dGVuZHMgTW9kZWwge31cblxuVGVzdFR5cGUuJG5hbWUgPSAndGVzdHMnO1xuVGVzdFR5cGUuJGlkID0gJ2lkJztcblRlc3RUeXBlLiRmaWVsZHMgPSB7XG4gIGlkOiB7XG4gICAgdHlwZTogJ251bWJlcicsXG4gIH0sXG4gIG5hbWU6IHtcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgfSxcbiAgZXh0ZW5kZWQ6IHtcbiAgICB0eXBlOiAnb2JqZWN0JyxcbiAgfSxcbiAgY2hpbGRyZW46IHtcbiAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgcmVsYXRpb25zaGlwOiAnY2hpbGRyZW4nLFxuICAgIHBhcmVudEZpZWxkOiAncGFyZW50X2lkJyxcbiAgICBjaGlsZEZpZWxkOiAnY2hpbGRfaWQnLFxuICAgIGNoaWxkVHlwZTogJ3Rlc3RzJyxcbiAgfSxcbn07XG5cbmNvbnN0IGd1aWxkID0gbmV3IEd1aWxkKHtcbiAgc3RvcmFnZTogW21lbXN0b3JlMSwgbWVtc3RvcmUyXSxcbiAgdHlwZXM6IFtUZXN0VHlwZV0sXG59KTtcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbmRlc2NyaWJlKCdtb2RlbCcsICgpID0+IHtcbiAgaXQoJ3Nob3VsZCBzYXZlIGZpZWxkIHVwZGF0ZXMgdG8gYWxsIGRhdGFzdG9yZXMnKTtcblxuICBpdCgnc2hvdWxkIHJldHVybiBwcm9taXNlcyB0byBleGlzdGluZyBkYXRhJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7aWQ6IDEsIG5hbWU6ICdwb3RhdG8nfSk7XG4gICAgZXhwZWN0KG9uZS4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3BvdGF0bycpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIGxvYWQgZGF0YSBmcm9tIGRhdGFzdG9yZXMnLCAoKSA9PiB7XG4gICAgcmV0dXJuIG1lbXN0b3JlMi53cml0ZShUZXN0VHlwZSwge1xuICAgICAgaWQ6IDIsXG4gICAgICBuYW1lOiAncG90YXRvJyxcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IHR3byA9IGd1aWxkLmZpbmQoJ3Rlc3RzJywgMik7XG4gICAgICByZXR1cm4gZXhwZWN0KHR3by4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3BvdGF0bycpO1xuICAgIH0pO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIGNyZWF0ZSBhbiBpZCB3aGVuIG9uZSBpcyB1bnNldCcsICgpID0+IHtcbiAgICBjb25zdCBub0lEID0gbmV3IFRlc3RUeXBlKHtuYW1lOiAncG90YXRvJ30sIGd1aWxkKTtcbiAgICByZXR1cm4gZXhwZWN0KG5vSUQuJHNhdmUoKSkudG8uZXZlbnR1YWxseS5oYXZlLmFsbC5rZXlzKCduYW1lJywgJ2lkJyk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgb3B0aW1pc3RpY2FsbHkgdXBkYXRlIG9uIGZpZWxkIHVwZGF0ZXMnLCAoKSA9PiB7XG4gICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHtuYW1lOiAncG90YXRvJ30sIGd1aWxkKTtcbiAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAudGhlbigoKSA9PiBvbmUuJHNldCh7bmFtZTogJ3J1dGFiYWdhJ30pKVxuICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdydXRhYmFnYScpKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBzYXZlIHVwZGF0ZXMgdG8gZGF0YXN0b3JlcycpO1xuXG4gIGl0KCdzaG91bGQgbGF6eS1sb2FkIGhhc01hbnkgbGlzdHMnKTtcbiAgaXQoJ3Nob3VsZCBhZGQgaGFzTWFueSBlbGVtZW50cycpO1xuICBpdCgnc2hvdWxkIHJlbW92ZSBoYXNNYW55IGVsZW1lbnRzJyk7XG4gIGl0KCdzaG91bGQgdXBkYXRlIGFuIGluZmxhdGVkIHZlcnNpb24gb2YgaXRzIGhhc01hbnkgcmVsYXRpb25zJyk7XG4gIGl0KCdzaG91bGQgb3B0aW1pc3RpY2FsbHkgdXBkYXRlIGhhc01hbnkgY2hhbmdlcycpO1xuICBpdCgnc2hvdWxkIHJvbGwgYmFjayBvcHRpbWlzdGljIGNoYW5nZXMgb24gZXJyb3InKTtcbiAgaXQoJ3Nob3VsZCByZXR1cm4gZXJyb3JzIHdoZW4gZmV0Y2hpbmcgdW5kZWZpbmVkIGZpZWxkcycpO1xuICBpdCgnc2hvdWxkIGZpcmUgZXZlbnRzIHdoZW4gdW5kZXJseWluZyBkYXRhIGNoYW5nZXMnKTtcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
