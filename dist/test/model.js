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
//# sourceMappingURL=data:application/json;base64,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LWVudiBub2RlLCBtb2NoYSovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IHsgRGF0YXN0b3JlIH0gZnJvbSAnLi4vZGF0YVN0b3JlJztcblxuaW1wb3J0IHsgTWVtb3J5U3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2UvbWVtb3J5JztcblxuY29uc3QgbWVtc3RvcmUxID0gbmV3IE1lbW9yeVN0b3JhZ2UoKTtcbmNvbnN0IG1lbXN0b3JlMiA9IG5ldyBNZW1vcnlTdG9yYWdlKHt0ZXJtaW5hbDogdHJ1ZX0pO1xuY29uc3QgRFMgPSBuZXcgRGF0YXN0b3JlKHtzdG9yYWdlOiBbbWVtc3RvcmUxLCBtZW1zdG9yZTJdfSk7XG5cbmNsYXNzIFRlc3RUeXBlIGV4dGVuZHMgRFMuQmFzZSB7fVxuXG5UZXN0VHlwZS4kZmllbGRzID0ge1xuICBpZDoge1xuICAgIHR5cGU6ICdudW1iZXInLFxuICB9LFxuICBuYW1lOiB7XG4gICAgdHlwZTogJ3N0cmluZycsXG4gIH0sXG4gIGNoaWxkcmVuOiB7XG4gICAgdHlwZTogJ2hhc01hbnknLFxuICAgIGNoaWxkVHlwZTogJ1Rlc3RUeXBlJyxcbiAgfSxcbn07XG5cblRlc3RUeXBlLiRpZCA9ICdpZCc7XG5cblRlc3RUeXBlLiRuYW1lID0gJ1Rlc3QnO1xuXG5EUy5kZWZpbmVUeXBlKFRlc3RUeXBlKTtcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbmRlc2NyaWJlKCdtb2RlbCcsICgpID0+IHtcbiAgaXQoJ3Nob3VsZCBzYXZlIGZpZWxkIHVwZGF0ZXMgdG8gYWxsIGRhdGFzdG9yZXMnKTtcblxuICBpdCgnc2hvdWxkIHJldHVybiBwcm9taXNlcyB0byBleGlzdGluZyBkYXRhJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7aWQ6IDEsIG5hbWU6ICdwb3RhdG8nfSk7XG4gICAgZXhwZWN0KG9uZS4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3BvdGF0bycpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIGxvYWQgZGF0YSBmcm9tIGRhdGFzdG9yZXMnLCAoKSA9PiB7XG4gICAgcmV0dXJuIG1lbXN0b3JlMi53cml0ZShUZXN0VHlwZSwge1xuICAgICAgaWQ6IDIsXG4gICAgICBuYW1lOiAncG90YXRvJyxcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IHR3byA9IERTLmZpbmQoJ1Rlc3QnLCAyKTtcbiAgICAgIHJldHVybiBleHBlY3QodHdvLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncG90YXRvJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgY3JlYXRlIGFuIGlkIHdoZW4gb25lIGlzIHVuc2V0JywgKCkgPT4ge1xuICAgIGNvbnN0IG5vSUQgPSBuZXcgVGVzdFR5cGUoe25hbWU6ICdwb3RhdG8nfSk7XG4gICAgcmV0dXJuIGV4cGVjdChub0lELiRzYXZlKCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5hbGwua2V5cygnbmFtZScsICdpZCcpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIG9wdGltaXN0aWNhbGx5IHVwZGF0ZSBvbiBmaWVsZCB1cGRhdGVzJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7bmFtZTogJ3BvdGF0byd9KTtcbiAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAudGhlbigoKSA9PiBvbmUuJHNldCh7bmFtZTogJ3J1dGFiYWdhJ30pKVxuICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdydXRhYmFnYScpKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBzYXZlIHVwZGF0ZXMgdG8gZGF0YXN0b3JlcycpO1xuXG4gIGl0KCdzaG91bGQgbGF6eS1sb2FkIGhhc01hbnkgbGlzdHMnKTtcbiAgaXQoJ3Nob3VsZCBhZGQgaGFzTWFueSBlbGVtZW50cycpO1xuICBpdCgnc2hvdWxkIHJlbW92ZSBoYXNNYW55IGVsZW1lbnRzJyk7XG4gIGl0KCdzaG91bGQgdXBkYXRlIGFuIGluZmxhdGVkIHZlcnNpb24gb2YgaXRzIGhhc01hbnkgcmVsYXRpb25zJyk7XG4gIGl0KCdzaG91bGQgb3B0aW1pc3RpY2FsbHkgdXBkYXRlIGhhc01hbnkgY2hhbmdlcycpO1xuICBpdCgnc2hvdWxkIHJvbGwgYmFjayBvcHRpbWlzdGljIGNoYW5nZXMgb24gZXJyb3InKTtcbiAgaXQoJ3Nob3VsZCByZXR1cm4gZXJyb3JzIHdoZW4gZmV0Y2hpbmcgdW5kZWZpbmVkIGZpZWxkcycpO1xuICBpdCgnc2hvdWxkIGZpcmUgZXZlbnRzIHdoZW4gdW5kZXJseWluZyBkYXRhIGNoYW5nZXMnKTtcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
