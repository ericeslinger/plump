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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3Qvc3RvcmFnZVRlc3RzLmpzIl0sIm5hbWVzIjpbInRlc3RTdWl0ZSIsInVzZSIsImV4cGVjdCIsInNhbXBsZU9iamVjdCIsIm5hbWUiLCJleHRlbmRlZCIsImFjdHVhbCIsIm90aGVyVmFsdWUiLCJtb2NoYSIsInN0b3JlT3B0cyIsInN0b3JlIiwiT2JqZWN0IiwiYXNzaWduIiwiYmVmb3JlIiwicmVzb2x2ZSIsImFmdGVyIiwiZGVzY3JpYmUiLCJhY3R1YWxTdG9yZSIsInRoZW4iLCJjdG9yIiwib3B0cyIsIml0Iiwid3JpdGUiLCJjcmVhdGVkT2JqZWN0IiwicmVhZCIsImlkIiwidG8iLCJldmVudHVhbGx5IiwiZGVlcCIsImVxdWFsIiwiJGlkIiwibW9kT2JqZWN0IiwidXBkYXRlZE9iamVjdCIsImRlbGV0ZSIsImFkZCIsImxpa2VycyIsInBhcmVudF9pZCIsImNoaWxkX2lkIiwiYWdyZWVycyIsImNoaWxkcmVuIiwicGFyZW50cyIsInBlcm0iLCJ2YWxlbmNlQ2hpbGRyZW4iLCJtb2RpZnlSZWxhdGlvbnNoaXAiLCJyZW1vdmUiLCJxdWVyeUNoaWxkcmVuIiwibWVtc3RvcmUiLCJ0ZXN0UGx1bXAiLCJzdG9yYWdlIiwidHlwZXMiLCJoYXZlIiwicHJvcGVydHkiLCJmaW5hbGx5IiwidGVhcmRvd24iLCJ0ZXN0SXRlbSIsImJlIiwibnVsbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFvQmdCQSxTLEdBQUFBLFM7O0FBakJoQjs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztrTkFQQTtBQUNBOztBQVFBLGVBQUtDLEdBQUw7QUFDQSxJQUFNQyxTQUFTLGVBQUtBLE1BQXBCOztBQUVBLElBQU1DLGVBQWU7QUFDbkJDLFFBQU0sUUFEYTtBQUVuQkMsWUFBVTtBQUNSQyxZQUFRLFVBREE7QUFFUkMsZ0JBQVk7QUFGSjtBQUZTLENBQXJCOztBQVFPLFNBQVNQLFNBQVQsQ0FBbUJRLEtBQW5CLEVBQTBCQyxTQUExQixFQUFxQztBQUMxQyxNQUFN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c3Qvc3RvcmFnZVRlc3RzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlICovXG4vKiBlc2xpbnQgbm8tc2hhZG93OiAwICovXG5cbmltcG9ydCB7IE1lbW9yeVN0b3JlLCBQbHVtcCwgJHNlbGYgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgeyBUZXN0VHlwZSB9IGZyb20gJy4vdGVzdFR5cGUnO1xuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuXG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5jb25zdCBleHBlY3QgPSBjaGFpLmV4cGVjdDtcblxuY29uc3Qgc2FtcGxlT2JqZWN0ID0ge1xuICBuYW1lOiAncG90YXRvJyxcbiAgZXh0ZW5kZWQ6IHtcbiAgICBhY3R1YWw6ICdydXRhYmFnYScsXG4gICAgb3RoZXJWYWx1ZTogNDIsXG4gIH0sXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gdGVzdFN1aXRlKG1vY2hhLCBzdG9yZU9wdHMpIHtcbiAgY29uc3Qgc3RvcmUgPSBPYmplY3QuYXNzaWduKFxuICAgIHt9LFxuICAgIHtcbiAgICAgIGJlZm9yZTogKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSgpLFxuICAgICAgYWZ0ZXI6ICgpID0+IEJsdWViaXJkLnJlc29sdmUoKSxcbiAgICB9LFxuICAgIHN0b3JlT3B0c1xuICApO1xuICBtb2NoYS5kZXNjcmliZShzdG9yZS5uYW1lLCAoKSA9PiB7XG4gICAgbGV0IGFjdHVhbFN0b3JlO1xuICAgIG1vY2hhLmJlZm9yZSgoKSA9PiB7XG4gICAgICByZXR1cm4gKHN0b3JlLmJlZm9yZSB8fCAoKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSgpKSkoYWN0dWFsU3RvcmUpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIGFjdHVhbFN0b3JlID0gbmV3IHN0b3JlLmN0b3Ioc3RvcmUub3B0cyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbmV3LWNhcFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBtb2NoYS5kZXNjcmliZSgnY29yZSBDUlVEJywgKCkgPT4ge1xuICAgICAgbW9jaGEuaXQoJ3N1cHBvcnRzIGNyZWF0aW5nIHZhbHVlcyB3aXRoIG5vIGlkIGZpZWxkLCBhbmQgcmV0cmlldmluZyB2YWx1ZXMnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCkpXG4gICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChPYmplY3QuYXNzaWduKHt9LCBzYW1wbGVPYmplY3QsIHsgW1Rlc3RUeXBlLiRpZF06IGNyZWF0ZWRPYmplY3QuaWQgfSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBtb2NoYS5pdCgnYWxsb3dzIG9iamVjdHMgdG8gYmUgc3RvcmVkIGJ5IGlkJywgKCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICBjb25zdCBtb2RPYmplY3QgPSBPYmplY3QuYXNzaWduKHt9LCBjcmVhdGVkT2JqZWN0LCB7IG5hbWU6ICdjYXJyb3QnIH0pO1xuICAgICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgbW9kT2JqZWN0KVxuICAgICAgICAgIC50aGVuKCh1cGRhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIHVwZGF0ZWRPYmplY3QuaWQpKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChPYmplY3QuYXNzaWduKFxuICAgICAgICAgICAgICB7fSxcbiAgICAgICAgICAgICAgc2FtcGxlT2JqZWN0LFxuICAgICAgICAgICAgICB7IFtUZXN0VHlwZS4kaWRdOiBjcmVhdGVkT2JqZWN0LmlkLCBuYW1lOiAnY2Fycm90JyB9XG4gICAgICAgICAgICApKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgbW9jaGEuaXQoJ2FsbG93cyBmb3IgZGVsZXRpb24gb2Ygb2JqZWN0cyBieSBpZCcsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKSlcbiAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKE9iamVjdC5hc3NpZ24oe30sIHNhbXBsZU9iamVjdCwgeyBbVGVzdFR5cGUuJGlkXTogY3JlYXRlZE9iamVjdC5pZCB9KSlcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5kZWxldGUoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQpKVxuICAgICAgICAgIC50aGVuKCgpID0+IGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKG51bGwpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIG1vY2hhLmRlc2NyaWJlKCdyZWxhdGlvbnNoaXBzJywgKCkgPT4ge1xuICAgICAgbW9jaGEuaXQoJ2hhbmRsZXMgcmVsYXRpb25zaGlwcyB3aXRoIHJlc3RyaWN0aW9ucycsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2xpa2VycycsIDEwMClcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdsaWtlcnMnLCAxMDEpKVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2FncmVlcnMnLCAxMDApKVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2FncmVlcnMnLCAxMDEpKVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2FncmVlcnMnLCAxMDIpKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2xpa2VycycpKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICAgIGxpa2VyczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogMTAwLFxuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IDEwMSxcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2FncmVlcnMnKSlcbiAgICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgICBhZ3JlZXJzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiAxMDAsXG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogMTAxLFxuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IDEwMixcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgbW9jaGEuaXQoJ2NhbiBmZXRjaCBhIGJhc2UgYW5kIGhhc21hbnkgaW4gb25lIHJlYWQnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDIwMClcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDIwMSkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAyMDIpKVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMjAzKSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsIFsnY2hpbGRyZW4nLCAkc2VsZl0pKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChcbiAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihcbiAgICAgICAgICAgICAgICB7fSxcbiAgICAgICAgICAgICAgICBjcmVhdGVkT2JqZWN0LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMjAwLFxuICAgICAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAyMDEsXG4gICAgICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDIwMixcbiAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMjAzLFxuICAgICAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBtb2NoYS5pdCgnY2FuIGFkZCB0byBhIGhhc01hbnkgcmVsYXRpb25zaGlwJywgKCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDApXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDEpKVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMTAyKSlcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMykpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCA1MDAsICdjaGlsZHJlbicsIGNyZWF0ZWRPYmplY3QuaWQpKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgWydjaGlsZHJlbiddKSlcbiAgICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAxLFxuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMixcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDMsXG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCAxMDAsIFsncGFyZW50cyddKSlcbiAgICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgICBwYXJlbnRzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIG1vY2hhLml0KCdjYW4gYWRkIHRvIGEgaGFzTWFueSByZWxhdGlvbnNoaXAgd2l0aCBleHRyYXMnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICd2YWxlbmNlQ2hpbGRyZW4nLCAxMDAsIHsgcGVybTogMSB9KVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICAgIHZhbGVuY2VDaGlsZHJlbjogW3tcbiAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICBwZXJtOiAxLFxuICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBtb2NoYS5pdCgnY2FuIG1vZGlmeSB2YWxlbmNlIG9uIGEgaGFzTWFueSByZWxhdGlvbnNoaXAnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICd2YWxlbmNlQ2hpbGRyZW4nLCAxMDAsIHsgcGVybTogMSB9KVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICAgIHZhbGVuY2VDaGlsZHJlbjogW3tcbiAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICBwZXJtOiAxLFxuICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUubW9kaWZ5UmVsYXRpb25zaGlwKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7IHBlcm06IDIgfSkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgICAgdmFsZW5jZUNoaWxkcmVuOiBbe1xuICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgIHBlcm06IDIsXG4gICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIG1vY2hhLml0KCdjYW4gcmVtb3ZlIGZyb20gYSBoYXNNYW55IHJlbGF0aW9uc2hpcCcsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMTAwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJykpXG4gICAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgICAgY2hpbGRyZW46IFt7XG4gICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5yZW1vdmUoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMCkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nKSlcbiAgICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoeyBjaGlsZHJlbjogW10gfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIG1vY2hhLml0KCdzdXBwb3J0cyBxdWVyaWVzIGluIGhhc01hbnkgcmVsYXRpb25zaGlwcycsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3F1ZXJ5Q2hpbGRyZW4nLCAxMDEsIHsgcGVybTogMSB9KVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3F1ZXJ5Q2hpbGRyZW4nLCAxMDIsIHsgcGVybTogMiB9KSlcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdxdWVyeUNoaWxkcmVuJywgMTAzLCB7IHBlcm06IDMgfSkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAncXVlcnlDaGlsZHJlbicpKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICAgIHF1ZXJ5Q2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAyLFxuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgICAgcGVybTogMixcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAzLFxuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgICAgcGVybTogMyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBtb2NoYS5kZXNjcmliZSgnZXZlbnRzJywgKCkgPT4ge1xuICAgICAgbW9jaGEuaXQoJ3Nob3VsZCBwYXNzIGJhc2ljIGNhY2hlYWJsZS13cml0ZSBldmVudHMgdG8gb3RoZXIgZGF0YXN0b3JlcycsICgpID0+IHtcbiAgICAgICAgY29uc3QgbWVtc3RvcmUgPSBuZXcgTWVtb3J5U3RvcmUoKTtcbiAgICAgICAgY29uc3QgdGVzdFBsdW1wID0gbmV3IFBsdW1wKHtcbiAgICAgICAgICBzdG9yYWdlOiBbbWVtc3RvcmUsIGFjdHVhbFN0b3JlXSxcbiAgICAgICAgICB0eXBlczogW1Rlc3RUeXBlXSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwge1xuICAgICAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgICAgICB9KS50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChtZW1zdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gdGVzdFBsdW1wLnRlYXJkb3duKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIG1vY2hhLml0KCdzaG91bGQgcGFzcyBiYXNpYyBjYWNoZWFibGUtcmVhZCBldmVudHMgdXAgdGhlIHN0YWNrJywgKCkgPT4ge1xuICAgICAgICBsZXQgdGVzdFBsdW1wO1xuICAgICAgICBsZXQgdGVzdEl0ZW07XG4gICAgICAgIGxldCBtZW1zdG9yZTtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCB7XG4gICAgICAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgICAgIH0pLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICB0ZXN0SXRlbSA9IGNyZWF0ZWRPYmplY3Q7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCB0ZXN0SXRlbS5pZCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgbWVtc3RvcmUgPSBuZXcgTWVtb3J5U3RvcmUoKTtcbiAgICAgICAgICB0ZXN0UGx1bXAgPSBuZXcgUGx1bXAoe1xuICAgICAgICAgICAgc3RvcmFnZTogW21lbXN0b3JlLCBhY3R1YWxTdG9yZV0sXG4gICAgICAgICAgICB0eXBlczogW1Rlc3RUeXBlXSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KG1lbXN0b3JlLnJlYWQoVGVzdFR5cGUsIHRlc3RJdGVtLmlkKSkudG8uZXZlbnR1YWxseS5iZS5udWxsO1xuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgdGVzdEl0ZW0uaWQpO1xuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KG1lbXN0b3JlLnJlYWQoVGVzdFR5cGUsIHRlc3RJdGVtLmlkKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHRlc3RQbHVtcC50ZWFyZG93bigpKTtcbiAgICAgIH0pO1xuXG4gICAgICBtb2NoYS5pdCgnc2hvdWxkIHBhc3MgY2FjaGVhYmxlLXdyaXRlIGV2ZW50cyBvbiBoYXNNYW55IHJlbGF0aW9uc2hpcHMgdG8gb3RoZXIgZGF0YXN0b3JlcycsICgpID0+IHtcbiAgICAgICAgbGV0IHRlc3RJdGVtO1xuICAgICAgICBjb25zdCBtZW1zdG9yZSA9IG5ldyBNZW1vcnlTdG9yZSgpO1xuICAgICAgICBjb25zdCB0ZXN0UGx1bXAgPSBuZXcgUGx1bXAoe1xuICAgICAgICAgIHN0b3JhZ2U6IFttZW1zdG9yZSwgYWN0dWFsU3RvcmVdLFxuICAgICAgICAgIHR5cGVzOiBbVGVzdFR5cGVdLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCB7XG4gICAgICAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgICAgIH0pLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICB0ZXN0SXRlbSA9IGNyZWF0ZWRPYmplY3Q7XG4gICAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgdGVzdEl0ZW0uaWQsICdsaWtlcnMnLCAxMDApO1xuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KG1lbXN0b3JlLnJlYWQoVGVzdFR5cGUsIHRlc3RJdGVtLmlkLCAnbGlrZXJzJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICBsaWtlcnM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcmVudF9pZDogMTAwLFxuICAgICAgICAgICAgICAgIGNoaWxkX2lkOiB0ZXN0SXRlbS5pZCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4gdGVzdFBsdW1wLnRlYXJkb3duKCkpO1xuICAgICAgfSk7XG5cbiAgICAgIG1vY2hhLml0KCdzaG91bGQgcGFzcyBjYWNoZWFibGUtcmVhZCBldmVudHMgb24gaGFzTWFueSByZWxhdGlvbnNoaXBzIHRvIG90aGVyIGRhdGFzdG9yZXMnLCAoKSA9PiB7XG4gICAgICAgIGxldCB0ZXN0UGx1bXA7XG4gICAgICAgIGxldCB0ZXN0SXRlbTtcbiAgICAgICAgbGV0IG1lbXN0b3JlO1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIHtcbiAgICAgICAgICBuYW1lOiAncG90YXRvJyxcbiAgICAgICAgfSkudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHRlc3RJdGVtID0gY3JlYXRlZE9iamVjdDtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIHRlc3RJdGVtLmlkKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgICAgICB9KS50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgdGVzdEl0ZW0uaWQsICdsaWtlcnMnLCAxMDApKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgbWVtc3RvcmUgPSBuZXcgTWVtb3J5U3RvcmUoKTtcbiAgICAgICAgICB0ZXN0UGx1bXAgPSBuZXcgUGx1bXAoe1xuICAgICAgICAgICAgc3RvcmFnZTogW21lbXN0b3JlLCBhY3R1YWxTdG9yZV0sXG4gICAgICAgICAgICB0eXBlczogW1Rlc3RUeXBlXSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KG1lbXN0b3JlLnJlYWQoVGVzdFR5cGUsIHRlc3RJdGVtLmlkKSkudG8uZXZlbnR1YWxseS5iZS5udWxsO1xuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgdGVzdEl0ZW0uaWQsICdsaWtlcnMnKTtcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChtZW1zdG9yZS5yZWFkKFRlc3RUeXBlLCB0ZXN0SXRlbS5pZCwgJ2xpa2VycycpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgbGlrZXJzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICBjaGlsZF9pZDogdGVzdEl0ZW0uaWQsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHRlc3RQbHVtcC50ZWFyZG93bigpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgbW9jaGEuYWZ0ZXIoKCkgPT4ge1xuICAgICAgcmV0dXJuIChzdG9yZS5hZnRlciB8fCAoKCkgPT4ge30pKShhY3R1YWxTdG9yZSk7XG4gICAgfSk7XG4gIH0pO1xufVxuIl19
