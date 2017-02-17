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

var _chaiSubset = require('chai-subset');

var _chaiSubset2 = _interopRequireDefault(_chaiSubset);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /* eslint-env node */
/* eslint no-shadow: 0 */

_chai2.default.use(_chaiSubset2.default);
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
          return expect(actualStore.read(_testType.TestType, createdObject.id)).to.eventually.containSubset(Object.assign({}, sampleObject, _defineProperty({}, _testType.TestType.$id, createdObject.id)));
        });
      });

      mocha.it('allows objects to be stored by id', function () {
        return actualStore.write(_testType.TestType, sampleObject).then(function (createdObject) {
          var modObject = Object.assign({}, createdObject, { name: 'carrot' });
          return actualStore.write(_testType.TestType, modObject).then(function (updatedObject) {
            var _Object$assign2;

            return expect(actualStore.read(_testType.TestType, updatedObject.id)).to.eventually.containSubset(Object.assign({}, sampleObject, (_Object$assign2 = {}, _defineProperty(_Object$assign2, _testType.TestType.$id, createdObject.id), _defineProperty(_Object$assign2, 'name', 'carrot'), _Object$assign2)));
          });
        });
      });

      mocha.it('allows for deletion of objects by id', function () {
        return actualStore.write(_testType.TestType, sampleObject).then(function (createdObject) {
          return expect(actualStore.read(_testType.TestType, createdObject.id)).to.eventually.containSubset(Object.assign({}, sampleObject, _defineProperty({}, _testType.TestType.$id, createdObject.id))).then(function () {
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
            return expect(actualStore.read(_testType.TestType, createdObject.id, ['children', _index.$self])).to.eventually.containSubset(Object.assign({}, createdObject, {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3Qvc3RvcmFnZVRlc3RzLmpzIl0sIm5hbWVzIjpbInRlc3RTdWl0ZSIsInVzZSIsImV4cGVjdCIsInNhbXBsZU9iamVjdCIsIm5hbWUiLCJleHRlbmRlZCIsImFjdHVhbCIsIm90aGVyVmFsdWUiLCJtb2NoYSIsInN0b3JlT3B0cyIsInN0b3JlIiwiT2JqZWN0IiwiYXNzaWduIiwiYmVmb3JlIiwicmVzb2x2ZSIsImFmdGVyIiwiZGVzY3JpYmUiLCJhY3R1YWxTdG9yZSIsInRoZW4iLCJjdG9yIiwib3B0cyIsIml0Iiwid3JpdGUiLCJjcmVhdGVkT2JqZWN0IiwicmVhZCIsImlkIiwidG8iLCJldmVudHVhbGx5IiwiY29udGFpblN1YnNldCIsIiRpZCIsIm1vZE9iamVjdCIsInVwZGF0ZWRPYmplY3QiLCJkZWxldGUiLCJkZWVwIiwiZXF1YWwiLCJhZGQiLCJsaWtlcnMiLCJwYXJlbnRfaWQiLCJjaGlsZF9pZCIsImFncmVlcnMiLCJjaGlsZHJlbiIsInBhcmVudHMiLCJwZXJtIiwidmFsZW5jZUNoaWxkcmVuIiwibW9kaWZ5UmVsYXRpb25zaGlwIiwicmVtb3ZlIiwicXVlcnlDaGlsZHJlbiIsIm1lbXN0b3JlIiwidGVzdFBsdW1wIiwic3RvcmFnZSIsInR5cGVzIiwiaGF2ZSIsInByb3BlcnR5IiwiZmluYWxseSIsInRlYXJkb3duIiwidGVzdEl0ZW0iLCJiZSIsIm51bGwiXSwibWFwcGluZ3MiOiI7Ozs7O1FBc0JnQkEsUyxHQUFBQSxTOztBQW5CaEI7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztrTkFSQTtBQUNBOztBQVNBLGVBQUtDLEdBQUw7QUFDQSxlQUFLQSxHQUFMO0FBQ0EsSUFBTUMsU0FBUyxlQUFLQSxNQUFwQjs7QUFFQSxJQUFNQyxlQUFlO0FBQ25CQyxRQUFNLFFBRGE7QUFFbkJDLFlBQVU7QUFDUkMsWUFBUSxVQURBO0FBRVJDLGdCQUFZO0FBRko7QUFGUyxDQUFyQjs7QUFRTyxTQUFTUCxTQUFULENB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Z2VUZXN0cy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1lbnYgbm9kZSAqL1xuLyogZXNsaW50IG5vLXNoYWRvdzogMCAqL1xuXG5pbXBvcnQgeyBNZW1vcnlTdG9yZSwgUGx1bXAsICRzZWxmIH0gZnJvbSAnLi4vaW5kZXgnO1xuaW1wb3J0IHsgVGVzdFR5cGUgfSBmcm9tICcuL3Rlc3RUeXBlJztcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpU3Vic2V0IGZyb20gJ2NoYWktc3Vic2V0JztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcblxuY2hhaS51c2UoY2hhaVN1YnNldCk7XG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5jb25zdCBleHBlY3QgPSBjaGFpLmV4cGVjdDtcblxuY29uc3Qgc2FtcGxlT2JqZWN0ID0ge1xuICBuYW1lOiAncG90YXRvJyxcbiAgZXh0ZW5kZWQ6IHtcbiAgICBhY3R1YWw6ICdydXRhYmFnYScsXG4gICAgb3RoZXJWYWx1ZTogNDIsXG4gIH0sXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gdGVzdFN1aXRlKG1vY2hhLCBzdG9yZU9wdHMpIHtcbiAgY29uc3Qgc3RvcmUgPSBPYmplY3QuYXNzaWduKFxuICAgIHt9LFxuICAgIHtcbiAgICAgIGJlZm9yZTogKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSgpLFxuICAgICAgYWZ0ZXI6ICgpID0+IEJsdWViaXJkLnJlc29sdmUoKSxcbiAgICB9LFxuICAgIHN0b3JlT3B0c1xuICApO1xuICBtb2NoYS5kZXNjcmliZShzdG9yZS5uYW1lLCAoKSA9PiB7XG4gICAgbGV0IGFjdHVhbFN0b3JlO1xuICAgIG1vY2hhLmJlZm9yZSgoKSA9PiB7XG4gICAgICByZXR1cm4gKHN0b3JlLmJlZm9yZSB8fCAoKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSgpKSkoYWN0dWFsU3RvcmUpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIGFjdHVhbFN0b3JlID0gbmV3IHN0b3JlLmN0b3Ioc3RvcmUub3B0cyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbmV3LWNhcFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBtb2NoYS5kZXNjcmliZSgnY29yZSBDUlVEJywgKCkgPT4ge1xuICAgICAgbW9jaGEuaXQoJ3N1cHBvcnRzIGNyZWF0aW5nIHZhbHVlcyB3aXRoIG5vIGlkIGZpZWxkLCBhbmQgcmV0cmlldmluZyB2YWx1ZXMnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCkpXG4gICAgICAgICAgLnRvLmV2ZW50dWFsbHkuY29udGFpblN1YnNldChPYmplY3QuYXNzaWduKHt9LCBzYW1wbGVPYmplY3QsIHsgW1Rlc3RUeXBlLiRpZF06IGNyZWF0ZWRPYmplY3QuaWQgfSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBtb2NoYS5pdCgnYWxsb3dzIG9iamVjdHMgdG8gYmUgc3RvcmVkIGJ5IGlkJywgKCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICBjb25zdCBtb2RPYmplY3QgPSBPYmplY3QuYXNzaWduKHt9LCBjcmVhdGVkT2JqZWN0LCB7IG5hbWU6ICdjYXJyb3QnIH0pO1xuICAgICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgbW9kT2JqZWN0KVxuICAgICAgICAgIC50aGVuKCh1cGRhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIHVwZGF0ZWRPYmplY3QuaWQpKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuY29udGFpblN1YnNldChPYmplY3QuYXNzaWduKFxuICAgICAgICAgICAgICB7fSxcbiAgICAgICAgICAgICAgc2FtcGxlT2JqZWN0LFxuICAgICAgICAgICAgICB7IFtUZXN0VHlwZS4kaWRdOiBjcmVhdGVkT2JqZWN0LmlkLCBuYW1lOiAnY2Fycm90JyB9XG4gICAgICAgICAgICApKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgbW9jaGEuaXQoJ2FsbG93cyBmb3IgZGVsZXRpb24gb2Ygb2JqZWN0cyBieSBpZCcsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKSlcbiAgICAgICAgICAudG8uZXZlbnR1YWxseS5jb250YWluU3Vic2V0KE9iamVjdC5hc3NpZ24oe30sIHNhbXBsZU9iamVjdCwgeyBbVGVzdFR5cGUuJGlkXTogY3JlYXRlZE9iamVjdC5pZCB9KSlcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5kZWxldGUoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQpKVxuICAgICAgICAgIC50aGVuKCgpID0+IGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKG51bGwpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIG1vY2hhLmRlc2NyaWJlKCdyZWxhdGlvbnNoaXBzJywgKCkgPT4ge1xuICAgICAgbW9jaGEuaXQoJ2hhbmRsZXMgcmVsYXRpb25zaGlwcyB3aXRoIHJlc3RyaWN0aW9ucycsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2xpa2VycycsIDEwMClcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdsaWtlcnMnLCAxMDEpKVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2FncmVlcnMnLCAxMDApKVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2FncmVlcnMnLCAxMDEpKVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2FncmVlcnMnLCAxMDIpKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2xpa2VycycpKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICAgIGxpa2VyczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogMTAwLFxuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IDEwMSxcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2FncmVlcnMnKSlcbiAgICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgICBhZ3JlZXJzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiAxMDAsXG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogMTAxLFxuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IDEwMixcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgbW9jaGEuaXQoJ2NhbiBmZXRjaCBhIGJhc2UgYW5kIGhhc21hbnkgaW4gb25lIHJlYWQnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDIwMClcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDIwMSkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAyMDIpKVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMjAzKSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsIFsnY2hpbGRyZW4nLCAkc2VsZl0pKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuY29udGFpblN1YnNldChcbiAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihcbiAgICAgICAgICAgICAgICB7fSxcbiAgICAgICAgICAgICAgICBjcmVhdGVkT2JqZWN0LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMjAwLFxuICAgICAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAyMDEsXG4gICAgICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDIwMixcbiAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMjAzLFxuICAgICAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBtb2NoYS5pdCgnY2FuIGFkZCB0byBhIGhhc01hbnkgcmVsYXRpb25zaGlwJywgKCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDApXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDEpKVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMTAyKSlcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMykpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCA1MDAsICdjaGlsZHJlbicsIGNyZWF0ZWRPYmplY3QuaWQpKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgWydjaGlsZHJlbiddKSlcbiAgICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAxLFxuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMixcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDMsXG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCAxMDAsIFsncGFyZW50cyddKSlcbiAgICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgICBwYXJlbnRzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIG1vY2hhLml0KCdjYW4gYWRkIHRvIGEgaGFzTWFueSByZWxhdGlvbnNoaXAgd2l0aCBleHRyYXMnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICd2YWxlbmNlQ2hpbGRyZW4nLCAxMDAsIHsgcGVybTogMSB9KVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICAgIHZhbGVuY2VDaGlsZHJlbjogW3tcbiAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICBwZXJtOiAxLFxuICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBtb2NoYS5pdCgnY2FuIG1vZGlmeSB2YWxlbmNlIG9uIGEgaGFzTWFueSByZWxhdGlvbnNoaXAnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICd2YWxlbmNlQ2hpbGRyZW4nLCAxMDAsIHsgcGVybTogMSB9KVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICAgIHZhbGVuY2VDaGlsZHJlbjogW3tcbiAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICBwZXJtOiAxLFxuICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUubW9kaWZ5UmVsYXRpb25zaGlwKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7IHBlcm06IDIgfSkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgICAgdmFsZW5jZUNoaWxkcmVuOiBbe1xuICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgIHBlcm06IDIsXG4gICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIG1vY2hhLml0KCdjYW4gcmVtb3ZlIGZyb20gYSBoYXNNYW55IHJlbGF0aW9uc2hpcCcsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMTAwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJykpXG4gICAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgICAgY2hpbGRyZW46IFt7XG4gICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5yZW1vdmUoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMCkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nKSlcbiAgICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoeyBjaGlsZHJlbjogW10gfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIG1vY2hhLml0KCdzdXBwb3J0cyBxdWVyaWVzIGluIGhhc01hbnkgcmVsYXRpb25zaGlwcycsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3F1ZXJ5Q2hpbGRyZW4nLCAxMDEsIHsgcGVybTogMSB9KVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3F1ZXJ5Q2hpbGRyZW4nLCAxMDIsIHsgcGVybTogMiB9KSlcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdxdWVyeUNoaWxkcmVuJywgMTAzLCB7IHBlcm06IDMgfSkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAncXVlcnlDaGlsZHJlbicpKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICAgIHF1ZXJ5Q2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAyLFxuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgICAgcGVybTogMixcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAzLFxuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgICAgcGVybTogMyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBtb2NoYS5kZXNjcmliZSgnZXZlbnRzJywgKCkgPT4ge1xuICAgICAgbW9jaGEuaXQoJ3Nob3VsZCBwYXNzIGJhc2ljIGNhY2hlYWJsZS13cml0ZSBldmVudHMgdG8gb3RoZXIgZGF0YXN0b3JlcycsICgpID0+IHtcbiAgICAgICAgY29uc3QgbWVtc3RvcmUgPSBuZXcgTWVtb3J5U3RvcmUoKTtcbiAgICAgICAgY29uc3QgdGVzdFBsdW1wID0gbmV3IFBsdW1wKHtcbiAgICAgICAgICBzdG9yYWdlOiBbbWVtc3RvcmUsIGFjdHVhbFN0b3JlXSxcbiAgICAgICAgICB0eXBlczogW1Rlc3RUeXBlXSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwge1xuICAgICAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgICAgICB9KS50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChtZW1zdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gdGVzdFBsdW1wLnRlYXJkb3duKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIG1vY2hhLml0KCdzaG91bGQgcGFzcyBiYXNpYyBjYWNoZWFibGUtcmVhZCBldmVudHMgdXAgdGhlIHN0YWNrJywgKCkgPT4ge1xuICAgICAgICBsZXQgdGVzdFBsdW1wO1xuICAgICAgICBsZXQgdGVzdEl0ZW07XG4gICAgICAgIGxldCBtZW1zdG9yZTtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCB7XG4gICAgICAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgICAgIH0pLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICB0ZXN0SXRlbSA9IGNyZWF0ZWRPYmplY3Q7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCB0ZXN0SXRlbS5pZCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgbWVtc3RvcmUgPSBuZXcgTWVtb3J5U3RvcmUoKTtcbiAgICAgICAgICB0ZXN0UGx1bXAgPSBuZXcgUGx1bXAoe1xuICAgICAgICAgICAgc3RvcmFnZTogW21lbXN0b3JlLCBhY3R1YWxTdG9yZV0sXG4gICAgICAgICAgICB0eXBlczogW1Rlc3RUeXBlXSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KG1lbXN0b3JlLnJlYWQoVGVzdFR5cGUsIHRlc3RJdGVtLmlkKSkudG8uZXZlbnR1YWxseS5iZS5udWxsO1xuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgdGVzdEl0ZW0uaWQpO1xuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KG1lbXN0b3JlLnJlYWQoVGVzdFR5cGUsIHRlc3RJdGVtLmlkKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHRlc3RQbHVtcC50ZWFyZG93bigpKTtcbiAgICAgIH0pO1xuXG4gICAgICBtb2NoYS5pdCgnc2hvdWxkIHBhc3MgY2FjaGVhYmxlLXdyaXRlIGV2ZW50cyBvbiBoYXNNYW55IHJlbGF0aW9uc2hpcHMgdG8gb3RoZXIgZGF0YXN0b3JlcycsICgpID0+IHtcbiAgICAgICAgbGV0IHRlc3RJdGVtO1xuICAgICAgICBjb25zdCBtZW1zdG9yZSA9IG5ldyBNZW1vcnlTdG9yZSgpO1xuICAgICAgICBjb25zdCB0ZXN0UGx1bXAgPSBuZXcgUGx1bXAoe1xuICAgICAgICAgIHN0b3JhZ2U6IFttZW1zdG9yZSwgYWN0dWFsU3RvcmVdLFxuICAgICAgICAgIHR5cGVzOiBbVGVzdFR5cGVdLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCB7XG4gICAgICAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgICAgIH0pLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICB0ZXN0SXRlbSA9IGNyZWF0ZWRPYmplY3Q7XG4gICAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgdGVzdEl0ZW0uaWQsICdsaWtlcnMnLCAxMDApO1xuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KG1lbXN0b3JlLnJlYWQoVGVzdFR5cGUsIHRlc3RJdGVtLmlkLCAnbGlrZXJzJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICBsaWtlcnM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcmVudF9pZDogMTAwLFxuICAgICAgICAgICAgICAgIGNoaWxkX2lkOiB0ZXN0SXRlbS5pZCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4gdGVzdFBsdW1wLnRlYXJkb3duKCkpO1xuICAgICAgfSk7XG5cbiAgICAgIG1vY2hhLml0KCdzaG91bGQgcGFzcyBjYWNoZWFibGUtcmVhZCBldmVudHMgb24gaGFzTWFueSByZWxhdGlvbnNoaXBzIHRvIG90aGVyIGRhdGFzdG9yZXMnLCAoKSA9PiB7XG4gICAgICAgIGxldCB0ZXN0UGx1bXA7XG4gICAgICAgIGxldCB0ZXN0SXRlbTtcbiAgICAgICAgbGV0IG1lbXN0b3JlO1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIHtcbiAgICAgICAgICBuYW1lOiAncG90YXRvJyxcbiAgICAgICAgfSkudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHRlc3RJdGVtID0gY3JlYXRlZE9iamVjdDtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIHRlc3RJdGVtLmlkKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgICAgICB9KS50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgdGVzdEl0ZW0uaWQsICdsaWtlcnMnLCAxMDApKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgbWVtc3RvcmUgPSBuZXcgTWVtb3J5U3RvcmUoKTtcbiAgICAgICAgICB0ZXN0UGx1bXAgPSBuZXcgUGx1bXAoe1xuICAgICAgICAgICAgc3RvcmFnZTogW21lbXN0b3JlLCBhY3R1YWxTdG9yZV0sXG4gICAgICAgICAgICB0eXBlczogW1Rlc3RUeXBlXSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KG1lbXN0b3JlLnJlYWQoVGVzdFR5cGUsIHRlc3RJdGVtLmlkKSkudG8uZXZlbnR1YWxseS5iZS5udWxsO1xuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgdGVzdEl0ZW0uaWQsICdsaWtlcnMnKTtcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChtZW1zdG9yZS5yZWFkKFRlc3RUeXBlLCB0ZXN0SXRlbS5pZCwgJ2xpa2VycycpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgbGlrZXJzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICBjaGlsZF9pZDogdGVzdEl0ZW0uaWQsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHRlc3RQbHVtcC50ZWFyZG93bigpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgbW9jaGEuYWZ0ZXIoKCkgPT4ge1xuICAgICAgcmV0dXJuIChzdG9yZS5hZnRlciB8fCAoKCkgPT4ge30pKShhY3R1YWxTdG9yZSk7XG4gICAgfSk7XG4gIH0pO1xufVxuIl19
