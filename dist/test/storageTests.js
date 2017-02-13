'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.testSuite = testSuite;

var _index = require('../index');

var _testType = require('./testType');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /* eslint-env node */
/* eslint no-shadow: 0 */

_chai2.default.use(_chaiAsPromised2.default);
var expect = _chai2.default.expect;

var sampleObject = {
  name: 'potato',
  extended: {
    actual: 'rutabaga',
    otherValue: 42
  }
};

function testSuite(mocha, storeOpts) {
  var store = Object.assign({}, {
    before: function before() {
      return _bluebird2.default.resolve();
    },
    after: function after() {
      return _bluebird2.default.resolve();
    }
  }, storeOpts);
  mocha.describe(store.name, function () {
    var actualStore = void 0;
    mocha.before(function () {
      return (store.before || function () {
        return _bluebird2.default.resolve();
      })(actualStore).then(function () {
        actualStore = new store.ctor(store.opts); // eslint-disable-line new-cap
      });
    });

    mocha.describe('core CRUD', function () {
      mocha.it('supports creating values with no id field, and retrieving values', function () {
        return actualStore.write(_testType.TestType, sampleObject).then(function (createdObject) {
          return expect(actualStore.read(_testType.TestType, createdObject.id)).to.eventually.deep.equal(Object.assign({}, sampleObject, _defineProperty({}, _testType.TestType.$id, createdObject.id)));
        });
      });

      mocha.it('allows objects to be stored by id', function () {
        return actualStore.write(_testType.TestType, sampleObject).then(function (createdObject) {
          var modObject = Object.assign({}, createdObject, { name: 'carrot' });
          return actualStore.write(_testType.TestType, modObject).then(function (updatedObject) {
            var _Object$assign2;

            return expect(actualStore.read(_testType.TestType, updatedObject.id)).to.eventually.deep.equal(Object.assign({}, sampleObject, (_Object$assign2 = {}, _defineProperty(_Object$assign2, _testType.TestType.$id, createdObject.id), _defineProperty(_Object$assign2, 'name', 'carrot'), _Object$assign2)));
          });
        });
      });

      mocha.it('allows for deletion of objects by id', function () {
        return actualStore.write(_testType.TestType, sampleObject).then(function (createdObject) {
          return expect(actualStore.read(_testType.TestType, createdObject.id)).to.eventually.deep.equal(Object.assign({}, sampleObject, _defineProperty({}, _testType.TestType.$id, createdObject.id))).then(function () {
            return actualStore.delete(_testType.TestType, createdObject.id);
          }).then(function () {
            return expect(actualStore.read(_testType.TestType, createdObject.id)).to.eventually.deep.equal(null);
          });
        });
      });
    });

    mocha.describe('relationships', function () {
      mocha.it('handles relationships with restrictions', function () {
        return actualStore.write(_testType.TestType, sampleObject).then(function (createdObject) {
          return actualStore.add(_testType.TestType, createdObject.id, 'likers', 100).then(function () {
            return actualStore.add(_testType.TestType, createdObject.id, 'likers', 101);
          }).then(function () {
            return actualStore.add(_testType.TestType, createdObject.id, 'agreers', 100);
          }).then(function () {
            return actualStore.add(_testType.TestType, createdObject.id, 'agreers', 101);
          }).then(function () {
            return actualStore.add(_testType.TestType, createdObject.id, 'agreers', 102);
          }).then(function () {
            return expect(actualStore.read(_testType.TestType, createdObject.id, 'likers')).to.eventually.deep.equal({
              likers: [{
                parent_id: 100,
                child_id: createdObject.id
              }, {
                parent_id: 101,
                child_id: createdObject.id
              }]
            });
          }).then(function () {
            return expect(actualStore.read(_testType.TestType, createdObject.id, 'agreers')).to.eventually.deep.equal({
              agreers: [{
                parent_id: 100,
                child_id: createdObject.id
              }, {
                parent_id: 101,
                child_id: createdObject.id
              }, {
                parent_id: 102,
                child_id: createdObject.id
              }]
            });
          });
        });
      });

      mocha.it('can fetch a base and hasmany in one read', function () {
        return actualStore.write(_testType.TestType, sampleObject).then(function (createdObject) {
          return actualStore.add(_testType.TestType, createdObject.id, 'children', 200).then(function () {
            return actualStore.add(_testType.TestType, createdObject.id, 'children', 201);
          }).then(function () {
            return actualStore.add(_testType.TestType, createdObject.id, 'children', 202);
          }).then(function () {
            return actualStore.add(_testType.TestType, createdObject.id, 'children', 203);
          }).then(function () {
            return expect(actualStore.read(_testType.TestType, createdObject.id, ['children', _index.$self])).to.eventually.deep.equal(Object.assign({}, createdObject, {
              children: [{
                child_id: 200,
                parent_id: createdObject.id
              }, {
                child_id: 201,
                parent_id: createdObject.id
              }, {
                child_id: 202,
                parent_id: createdObject.id
              }, {
                child_id: 203,
                parent_id: createdObject.id
              }]
            }));
          });
        });
      });

      mocha.it('can add to a hasMany relationship', function () {
        return actualStore.write(_testType.TestType, sampleObject).then(function (createdObject) {
          return actualStore.add(_testType.TestType, createdObject.id, 'children', 100).then(function () {
            return actualStore.add(_testType.TestType, createdObject.id, 'children', 101);
          }).then(function () {
            return actualStore.add(_testType.TestType, createdObject.id, 'children', 102);
          }).then(function () {
            return actualStore.add(_testType.TestType, createdObject.id, 'children', 103);
          }).then(function () {
            return actualStore.add(_testType.TestType, 500, 'children', createdObject.id);
          }).then(function () {
            return expect(actualStore.read(_testType.TestType, createdObject.id, ['children'])).to.eventually.deep.equal({
              children: [{
                child_id: 100,
                parent_id: createdObject.id
              }, {
                child_id: 101,
                parent_id: createdObject.id
              }, {
                child_id: 102,
                parent_id: createdObject.id
              }, {
                child_id: 103,
                parent_id: createdObject.id
              }]
            });
          }).then(function () {
            return expect(actualStore.read(_testType.TestType, 100, ['parents'])).to.eventually.deep.equal({
              parents: [{
                child_id: 100,
                parent_id: createdObject.id
              }]
            });
          });
        });
      });

      mocha.it('can add to a hasMany relationship with extras', function () {
        return actualStore.write(_testType.TestType, sampleObject).then(function (createdObject) {
          return actualStore.add(_testType.TestType, createdObject.id, 'valenceChildren', 100, { perm: 1 }).then(function () {
            return expect(actualStore.read(_testType.TestType, createdObject.id, 'valenceChildren')).to.eventually.deep.equal({
              valenceChildren: [{
                child_id: 100,
                parent_id: createdObject.id,
                perm: 1
              }]
            });
          });
        });
      });

      mocha.it('can modify valence on a hasMany relationship', function () {
        return actualStore.write(_testType.TestType, sampleObject).then(function (createdObject) {
          return actualStore.add(_testType.TestType, createdObject.id, 'valenceChildren', 100, { perm: 1 }).then(function () {
            return expect(actualStore.read(_testType.TestType, createdObject.id, 'valenceChildren')).to.eventually.deep.equal({
              valenceChildren: [{
                child_id: 100,
                parent_id: createdObject.id,
                perm: 1
              }]
            });
          }).then(function () {
            return actualStore.modifyRelationship(_testType.TestType, createdObject.id, 'valenceChildren', 100, { perm: 2 });
          }).then(function () {
            return expect(actualStore.read(_testType.TestType, createdObject.id, 'valenceChildren')).to.eventually.deep.equal({
              valenceChildren: [{
                child_id: 100,
                parent_id: createdObject.id,
                perm: 2
              }]
            });
          });
        });
      });

      mocha.it('can remove from a hasMany relationship', function () {
        return actualStore.write(_testType.TestType, sampleObject).then(function (createdObject) {
          return actualStore.add(_testType.TestType, createdObject.id, 'children', 100).then(function () {
            return expect(actualStore.read(_testType.TestType, createdObject.id, 'children')).to.eventually.deep.equal({
              children: [{
                child_id: 100,
                parent_id: createdObject.id
              }]
            });
          }).then(function () {
            return actualStore.remove(_testType.TestType, createdObject.id, 'children', 100);
          }).then(function () {
            return expect(actualStore.read(_testType.TestType, createdObject.id, 'children')).to.eventually.deep.equal({ children: [] });
          });
        });
      });

      mocha.it('supports queries in hasMany relationships', function () {
        return actualStore.write(_testType.TestType, sampleObject).then(function (createdObject) {
          return actualStore.add(_testType.TestType, createdObject.id, 'queryChildren', 101, { perm: 1 }).then(function () {
            return actualStore.add(_testType.TestType, createdObject.id, 'queryChildren', 102, { perm: 2 });
          }).then(function () {
            return actualStore.add(_testType.TestType, createdObject.id, 'queryChildren', 103, { perm: 3 });
          }).then(function () {
            return expect(actualStore.read(_testType.TestType, createdObject.id, 'queryChildren')).to.eventually.deep.equal({
              queryChildren: [{
                child_id: 102,
                parent_id: createdObject.id,
                perm: 2
              }, {
                child_id: 103,
                parent_id: createdObject.id,
                perm: 3
              }]
            });
          });
        });
      });
    });

    mocha.describe('events', function () {
      mocha.it('should pass basic cacheable-write events to other datastores', function () {
        var memstore = new _index.MemoryStore();
        var testPlump = new _index.Plump({
          storage: [memstore, actualStore],
          types: [_testType.TestType]
        });
        return actualStore.write(_testType.TestType, {
          name: 'potato'
        }).then(function (createdObject) {
          return expect(memstore.read(_testType.TestType, createdObject.id)).to.eventually.have.property('name', 'potato');
        }).finally(function () {
          return testPlump.teardown();
        });
      });

      mocha.it('should pass basic cacheable-read events up the stack', function () {
        var testPlump = void 0;
        var testItem = void 0;
        var memstore = void 0;
        return actualStore.write(_testType.TestType, {
          name: 'potato'
        }).then(function (createdObject) {
          testItem = createdObject;
          return expect(actualStore.read(_testType.TestType, testItem.id)).to.eventually.have.property('name', 'potato');
        }).then(function () {
          memstore = new _index.MemoryStore();
          testPlump = new _index.Plump({
            storage: [memstore, actualStore],
            types: [_testType.TestType]
          });
          return expect(memstore.read(_testType.TestType, testItem.id)).to.eventually.be.null;
        }).then(function () {
          return actualStore.read(_testType.TestType, testItem.id);
        }).then(function () {
          return expect(memstore.read(_testType.TestType, testItem.id)).to.eventually.have.property('name', 'potato');
        }).finally(function () {
          return testPlump.teardown();
        });
      });

      mocha.it('should pass cacheable-write events on hasMany relationships to other datastores', function () {
        var testItem = void 0;
        var memstore = new _index.MemoryStore();
        var testPlump = new _index.Plump({
          storage: [memstore, actualStore],
          types: [_testType.TestType]
        });
        return actualStore.write(_testType.TestType, {
          name: 'potato'
        }).then(function (createdObject) {
          testItem = createdObject;
          return actualStore.add(_testType.TestType, testItem.id, 'likers', 100);
        }).then(function () {
          return expect(memstore.read(_testType.TestType, testItem.id, 'likers')).to.eventually.deep.equal({
            likers: [{
              parent_id: 100,
              child_id: testItem.id
            }]
          });
        }).finally(function () {
          return testPlump.teardown();
        });
      });

      mocha.it('should pass cacheable-read events on hasMany relationships to other datastores', function () {
        var testPlump = void 0;
        var testItem = void 0;
        var memstore = void 0;
        return actualStore.write(_testType.TestType, {
          name: 'potato'
        }).then(function (createdObject) {
          testItem = createdObject;
          return expect(actualStore.read(_testType.TestType, testItem.id)).to.eventually.have.property('name', 'potato');
        }).then(function () {
          return actualStore.add(_testType.TestType, testItem.id, 'likers', 100);
        }).then(function () {
          memstore = new _index.MemoryStore();
          testPlump = new _index.Plump({
            storage: [memstore, actualStore],
            types: [_testType.TestType]
          });
          return expect(memstore.read(_testType.TestType, testItem.id)).to.eventually.be.null;
        }).then(function () {
          return actualStore.read(_testType.TestType, testItem.id, 'likers');
        }).then(function () {
          return expect(memstore.read(_testType.TestType, testItem.id, 'likers')).to.eventually.deep.equal({
            likers: [{
              parent_id: 100,
              child_id: testItem.id
            }]
          });
        }).finally(function () {
          return testPlump.teardown();
        });
      });
    });

    mocha.after(function () {
      return (store.after || function () {})(actualStore);
    });
  });
}