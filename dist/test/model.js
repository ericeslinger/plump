'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _memory = require('../storage/memory');

var _plump = require('../plump');

var _testType = require('./testType');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// const memstore1 = new MemoryStorage();
var memstore2 = new _memory.MemoryStorage({ terminal: true }); /* eslint-env node, mocha*/

var plump = new _plump.Plump({
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

  it('should properly serialize its schema');

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