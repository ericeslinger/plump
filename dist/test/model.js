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
    joinTable: 'children',
    parentColumn: 'parent_id',
    childColumn: 'child_id',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUxIiwibWVtc3RvcmUyIiwidGVybWluYWwiLCJUZXN0VHlwZSIsIiRuYW1lIiwiJGlkIiwiJGZpZWxkcyIsImlkIiwidHlwZSIsIm5hbWUiLCJleHRlbmRlZCIsImNoaWxkcmVuIiwiam9pblRhYmxlIiwicGFyZW50Q29sdW1uIiwiY2hpbGRDb2x1bW4iLCJjaGlsZFR5cGUiLCJndWlsZCIsInN0b3JhZ2UiLCJ0eXBlcyIsInVzZSIsImV4cGVjdCIsImRlc2NyaWJlIiwiaXQiLCJvbmUiLCIkZ2V0IiwidG8iLCJldmVudHVhbGx5IiwiZXF1YWwiLCJ3cml0ZSIsInRoZW4iLCJ0d28iLCJmaW5kIiwibm9JRCIsIiRzYXZlIiwiaGF2ZSIsImFsbCIsImtleXMiLCIkc2V0Il0sIm1hcHBpbmdzIjoiOztBQUVBOzs7O0FBQ0E7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7K2VBUEE7O0FBU0EsSUFBTUEsWUFBWSwyQkFBbEI7QUFDQSxJQUFNQyxZQUFZLDBCQUFrQixFQUFDQyxVQUFVLElBQVgsRUFBbEIsQ0FBbEI7O0lBRU1DLFE7Ozs7Ozs7Ozs7OztBQUVOQSxTQUFTQyxLQUFULEdBQWlCLE9BQWpCO0FBQ0FELFNBQVNFLEdBQVQsR0FBZSxJQUFmO0FBQ0FGLFNBQVNHLE9BQVQsR0FBbUI7QUFDakJDLE1BQUk7QUFDRkMsVUFBTTtBQURKLEdBRGE7QUFJakJDLFFBQU07QUFDSkQsVUFBTTtBQURGLEdBSlc7QUFPakJFLFlBQVU7QUFDUkYsVUFBTTtBQURFLEdBUE87QUFVakJHLFlBQVU7QUFDUkgsVUFBTSxTQURFO0FBRVJJLGVBQVcsVUFGSDtBQUdSQyxrQkFBYyxXQUhOO0FBSVJDLGlCQUFhLFVBSkw7QUFLUkMsZUFBVztBQUxIO0FBVk8sQ0FBbkI7O0FBbUJBLElBQU1DLFFBQVEsaUJBQVU7QUFDdEJDLFdBQVMsQ0FBQ2pCLFNBQUQsRUFBWUMsU0FBWixDQURhO0FBRXRCaUIsU0FBTyxDQUFDZixRQUFEO0FBRmUsQ0FBVixDQUFkOztBQUtBLGVBQUtnQixHQUFMO0FBQ0EsSUFBTUMsU0FBUyxlQUFLQSxNQUFwQjs7QUFFQUMsU0FBUyxPQUFULEVBQWtCLFlBQU07QUFDdEJDLEtBQUcsNkNBQUg7O0FBRUFBLEtBQUcseUNBQUgsRUFBOEMsWUFBTTtBQUNsRCxRQUFNQyxNQUFNLElBQUlwQixRQUFKLENBQWEsRUFBQ0ksSUFBSSxDQUFMLEVBQVFFLE1BQU0sUUFBZCxFQUFiLENBQVo7QUFDQVcsV0FBT0csSUFBSUMsSUFBSixDQUFTLE1BQVQsQ0FBUCxFQUF5QkMsRUFBekIsQ0FBNEJDLFVBQTVCLENBQXVDQyxLQUF2QyxDQUE2QyxRQUE3QztBQUNELEdBSEQ7O0FBS0FMLEtBQUcsa0NBQUgsRUFBdUMsWUFBTTtBQUMzQyxXQUFPckIsVUFBVTJCLEtBQVYsQ0FBZ0J6QixRQUFoQixFQUEwQjtBQUMvQkksVUFBSSxDQUQyQjtBQUUvQkUsWUFBTTtBQUZ5QixLQUExQixFQUdKb0IsSUFISSxDQUdDLFlBQU07QUFDWixVQUFNQyxNQUFNZCxNQUFNZSxJQUFOLENBQVcsT0FBWCxFQUFvQixDQUFwQixDQUFaO0FBQ0EsYUFBT1gsT0FBT1UsSUFBSU4sSUFBSixDQUFTLE1BQVQsQ0FBUCxFQUF5QkMsRUFBekIsQ0FBNEJDLFVBQTVCLENBQXVDQyxLQUF2QyxDQUE2QyxRQUE3QyxDQUFQO0FBQ0QsS0FOTSxDQUFQO0FBT0QsR0FSRDs7QUFVQUwsS0FBRyx1Q0FBSCxFQUE0QyxZQUFNO0FBQ2hELFFBQU1VLE9BQU8sSUFBSTdCLFFBQUosQ0FBYSxFQUFDTSxNQUFNLFFBQVAsRUFBYixFQUErQk8sS0FBL0IsQ0FBYjtBQUNBLFdBQU9JLE9BQU9ZLEtBQUtDLEtBQUwsRUFBUCxFQUFxQlIsRUFBckIsQ0FBd0JDLFVBQXhCLENBQW1DUSxJQUFuQyxDQUF3Q0MsR0FBeEMsQ0FBNENDLElBQTVDLENBQWlELE1BQWpELEVBQXlELElBQXpELENBQVA7QUFDRCxHQUhEOztBQUtBZCxLQUFHLCtDQUFILEVBQW9ELFlBQU07QUFDeEQsUUFBTUMsTUFBTSxJQUFJcEIsUUFBSixDQUFhLEVBQUNNLE1BQU0sUUFBUCxFQUFiLEVBQStCTyxLQUEvQixDQUFaO0FBQ0EsV0FBT08sSUFBSVUsS0FBSixHQUNOSixJQURNLENBQ0Q7QUFBQSxhQUFNTixJQUFJYyxJQUFKLENBQVMsRUFBQzVCLE1BQU0sVUFBUCxFQUFULENBQU47QUFBQSxLQURDLEVBRU5vQixJQUZNLENBRUQ7QUFBQSxhQUFNVCxPQUFPRyxJQUFJQyxJQUFKLENBQVMsTUFBVCxDQUFQLEVBQXlCQyxFQUF6QixDQUE0QkMsVUFBNUIsQ0FBdUNDLEtBQXZDLENBQTZDLFVBQTdDLENBQU47QUFBQSxLQUZDLENBQVA7QUFHRCxHQUxEOztBQU9BTCxLQUFHLG1DQUFIOztBQUVBQSxLQUFHLGdDQUFIO0FBQ0FBLEtBQUcsNkJBQUg7QUFDQUEsS0FBRyxnQ0FBSDtBQUNBQSxLQUFHLDREQUFIO0FBQ0FBLEtBQUcsOENBQUg7QUFDQUEsS0FBRyw4Q0FBSDtBQUNBQSxLQUFHLHFEQUFIO0FBQ0FBLEtBQUcsaURBQUg7QUFDRCxDQXhDRCIsImZpbGUiOiJ0ZXN0L21vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlLCBtb2NoYSovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuXG5pbXBvcnQgeyBNZW1vcnlTdG9yYWdlIH0gZnJvbSAnLi4vc3RvcmFnZS9tZW1vcnknO1xuaW1wb3J0IHsgR3VpbGQgfSBmcm9tICcuLi9ndWlsZCc7XG5pbXBvcnQgeyBNb2RlbCB9IGZyb20gJy4uL21vZGVsJztcblxuY29uc3QgbWVtc3RvcmUxID0gbmV3IE1lbW9yeVN0b3JhZ2UoKTtcbmNvbnN0IG1lbXN0b3JlMiA9IG5ldyBNZW1vcnlTdG9yYWdlKHt0ZXJtaW5hbDogdHJ1ZX0pO1xuXG5jbGFzcyBUZXN0VHlwZSBleHRlbmRzIE1vZGVsIHt9XG5cblRlc3RUeXBlLiRuYW1lID0gJ3Rlc3RzJztcblRlc3RUeXBlLiRpZCA9ICdpZCc7XG5UZXN0VHlwZS4kZmllbGRzID0ge1xuICBpZDoge1xuICAgIHR5cGU6ICdudW1iZXInLFxuICB9LFxuICBuYW1lOiB7XG4gICAgdHlwZTogJ3N0cmluZycsXG4gIH0sXG4gIGV4dGVuZGVkOiB7XG4gICAgdHlwZTogJ29iamVjdCcsXG4gIH0sXG4gIGNoaWxkcmVuOiB7XG4gICAgdHlwZTogJ2hhc01hbnknLFxuICAgIGpvaW5UYWJsZTogJ2NoaWxkcmVuJyxcbiAgICBwYXJlbnRDb2x1bW46ICdwYXJlbnRfaWQnLFxuICAgIGNoaWxkQ29sdW1uOiAnY2hpbGRfaWQnLFxuICAgIGNoaWxkVHlwZTogJ3Rlc3RzJyxcbiAgfSxcbn07XG5cbmNvbnN0IGd1aWxkID0gbmV3IEd1aWxkKHtcbiAgc3RvcmFnZTogW21lbXN0b3JlMSwgbWVtc3RvcmUyXSxcbiAgdHlwZXM6IFtUZXN0VHlwZV0sXG59KTtcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbmRlc2NyaWJlKCdtb2RlbCcsICgpID0+IHtcbiAgaXQoJ3Nob3VsZCBzYXZlIGZpZWxkIHVwZGF0ZXMgdG8gYWxsIGRhdGFzdG9yZXMnKTtcblxuICBpdCgnc2hvdWxkIHJldHVybiBwcm9taXNlcyB0byBleGlzdGluZyBkYXRhJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7aWQ6IDEsIG5hbWU6ICdwb3RhdG8nfSk7XG4gICAgZXhwZWN0KG9uZS4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3BvdGF0bycpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIGxvYWQgZGF0YSBmcm9tIGRhdGFzdG9yZXMnLCAoKSA9PiB7XG4gICAgcmV0dXJuIG1lbXN0b3JlMi53cml0ZShUZXN0VHlwZSwge1xuICAgICAgaWQ6IDIsXG4gICAgICBuYW1lOiAncG90YXRvJyxcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IHR3byA9IGd1aWxkLmZpbmQoJ3Rlc3RzJywgMik7XG4gICAgICByZXR1cm4gZXhwZWN0KHR3by4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3BvdGF0bycpO1xuICAgIH0pO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIGNyZWF0ZSBhbiBpZCB3aGVuIG9uZSBpcyB1bnNldCcsICgpID0+IHtcbiAgICBjb25zdCBub0lEID0gbmV3IFRlc3RUeXBlKHtuYW1lOiAncG90YXRvJ30sIGd1aWxkKTtcbiAgICByZXR1cm4gZXhwZWN0KG5vSUQuJHNhdmUoKSkudG8uZXZlbnR1YWxseS5oYXZlLmFsbC5rZXlzKCduYW1lJywgJ2lkJyk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgb3B0aW1pc3RpY2FsbHkgdXBkYXRlIG9uIGZpZWxkIHVwZGF0ZXMnLCAoKSA9PiB7XG4gICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHtuYW1lOiAncG90YXRvJ30sIGd1aWxkKTtcbiAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAudGhlbigoKSA9PiBvbmUuJHNldCh7bmFtZTogJ3J1dGFiYWdhJ30pKVxuICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdydXRhYmFnYScpKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBzYXZlIHVwZGF0ZXMgdG8gZGF0YXN0b3JlcycpO1xuXG4gIGl0KCdzaG91bGQgbGF6eS1sb2FkIGhhc01hbnkgbGlzdHMnKTtcbiAgaXQoJ3Nob3VsZCBhZGQgaGFzTWFueSBlbGVtZW50cycpO1xuICBpdCgnc2hvdWxkIHJlbW92ZSBoYXNNYW55IGVsZW1lbnRzJyk7XG4gIGl0KCdzaG91bGQgdXBkYXRlIGFuIGluZmxhdGVkIHZlcnNpb24gb2YgaXRzIGhhc01hbnkgcmVsYXRpb25zJyk7XG4gIGl0KCdzaG91bGQgb3B0aW1pc3RpY2FsbHkgdXBkYXRlIGhhc01hbnkgY2hhbmdlcycpO1xuICBpdCgnc2hvdWxkIHJvbGwgYmFjayBvcHRpbWlzdGljIGNoYW5nZXMgb24gZXJyb3InKTtcbiAgaXQoJ3Nob3VsZCByZXR1cm4gZXJyb3JzIHdoZW4gZmV0Y2hpbmcgdW5kZWZpbmVkIGZpZWxkcycpO1xuICBpdCgnc2hvdWxkIGZpcmUgZXZlbnRzIHdoZW4gdW5kZXJseWluZyBkYXRhIGNoYW5nZXMnKTtcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
