'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _index = require('../index');

var _testType = require('./testType');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* eslint-env node, mocha*/

// const memstore1 = new MemoryStorage();
var memstore2 = new _index.MemoryStorage({ terminal: true });

var plump = new _index.Plump({
  storage: [memstore2],
  types: [_testType.TestType]
});

_chai2.default.use(_chaiAsPromised2.default);
var expect = _chai2.default.expect;

describe('model', function () {
  it('should return promises to existing data', function () {
    var one = new _testType.TestType({ id: 1, name: 'potato' });
    expect(one.$get('name')).to.eventually.equal('potato');
  });

  it('should properly serialize its schema', function () {
    var MiniTest = function (_Model) {
      _inherits(MiniTest, _Model);

      function MiniTest() {
        _classCallCheck(this, MiniTest);

        return _possibleConstructorReturn(this, (MiniTest.__proto__ || Object.getPrototypeOf(MiniTest)).apply(this, arguments));
      }

      return MiniTest;
    }(_index.Model);

    MiniTest.fromJSON(_testType.TestType.toJSON());
    return expect(MiniTest.toJSON()).to.deep.equal(_testType.TestType.toJSON());
  });

  it('should load data from datastores', function () {
    return memstore2.write(_testType.TestType, {
      id: 2,
      name: 'potato'
    }).then(function () {
      var two = plump.find('tests', 2);
      return expect(two.$get('name')).to.eventually.equal('potato');
    });
  });

  it('should create an id when one is unset', function () {
    var noID = new _testType.TestType({ name: 'potato' }, plump);
    return expect(noID.$save()).to.eventually.have.all.keys('name', 'id');
  });

  it('should allow data to be deleted', function () {
    var one = new _testType.TestType({ name: 'potato' }, plump);
    return one.$save().then(function () {
      return expect(plump.find('tests', one.$id).$get('name')).to.eventually.equal('potato');
    }).then(function () {
      return one.$delete();
    }).then(function () {
      return expect(plump.find('tests', one.$id).$get()).to.eventually.be.null;
    });
  });

  it('should allow fields to be loaded', function () {
    var one = new _testType.TestType({ name: 'potato' }, plump);
    return one.$save().then(function () {
      return expect(plump.find('tests', one.$id).$get('name')).to.eventually.equal('potato');
    }).then(function () {
      return expect(plump.find('tests', one.$id).$get()).to.eventually.deep.equal({ name: 'potato', id: one.$id });
    });
  });

  it('should optimistically update on field updates', function () {
    var one = new _testType.TestType({ name: 'potato' }, plump);
    return one.$save().then(function () {
      return one.$set({ name: 'rutabaga' });
    }).then(function () {
      return expect(one.$get('name')).to.eventually.equal('rutabaga');
    });
  });

  it('should show empty hasMany lists as []', function () {
    var one = new _testType.TestType({ name: 'frotato' }, plump);
    return one.$save().then(function () {
      return expect(one.$get('children')).to.eventually.deep.equal([]);
    });
  });

  it('should add hasMany elements', function () {
    var one = new _testType.TestType({ name: 'frotato' }, plump);
    return one.$save().then(function () {
      return one.$add('children', 100);
    }).then(function () {
      return expect(one.$get('children')).to.eventually.deep.equal([{
        child_id: 100,
        parent_id: one.$id
      }]);
    });
  });

  it('should add hasMany elements by child field', function () {
    var one = new _testType.TestType({ name: 'frotato' }, plump);
    return one.$save().then(function () {
      return one.$add('children', { child_id: 100 });
    }).then(function () {
      return expect(one.$get('children')).to.eventually.deep.equal([{
        child_id: 100,
        parent_id: one.$id
      }]);
    });
  });

  it('should remove hasMany elements', function () {
    var one = new _testType.TestType({ name: 'frotato' }, plump);
    return one.$save().then(function () {
      return one.$add('children', 100);
    }).then(function () {
      return expect(one.$get('children')).to.eventually.deep.equal([{
        child_id: 100,
        parent_id: one.$id
      }]);
    }).then(function () {
      return one.$remove('children', 100);
    }).then(function () {
      return expect(one.$get('children')).to.eventually.deep.equal([]);
    });
  });

  it('should include valence in hasMany operations', function () {
    var one = new _testType.TestType({ name: 'grotato' }, plump);
    return one.$save().then(function () {
      return one.$add('valenceChildren', 100, { perm: 1 });
    }).then(function () {
      return one.$get('valenceChildren');
    }).then(function () {
      return expect(one.$get('valenceChildren')).to.eventually.deep.equal([{
        child_id: 100,
        parent_id: one.$id,
        perm: 1
      }]);
    }).then(function () {
      return one.$modifyRelationship('valenceChildren', 100, { perm: 2 });
    }).then(function () {
      return expect(one.$get('valenceChildren')).to.eventually.deep.equal([{
        child_id: 100,
        parent_id: one.$id,
        perm: 2
      }]);
    });
  });
});