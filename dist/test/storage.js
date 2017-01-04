'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _index = require('../index');

var _testType = require('./testType');

var _axiosMocking = require('./axiosMocking');

var _axiosMocking2 = _interopRequireDefault(_axiosMocking);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _pg = require('pg');

var pg = _interopRequireWildcard(_pg);

var _redis = require('redis');

var Redis = _interopRequireWildcard(_redis);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /* eslint-env node, mocha*/
/* eslint no-shadow: 0 */

function runSQL(command) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var connOptions = Object.assign({}, {
    user: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    charset: 'utf8'
  }, opts);
  var client = new pg.Client(connOptions);
  return new _bluebird2.default(function (resolve) {
    client.connect(function (err) {
      if (err) throw err;
      client.query(command, function (err) {
        if (err) throw err;
        client.end(function (err) {
          if (err) throw err;
          resolve();
        });
      });
    });
  });
}

function flushRedis() {
  var r = Redis.createClient({
    port: 6379,
    host: 'localhost',
    db: 0
  });
  return new _bluebird2.default(function (resolve) {
    r.flushdb(function (err) {
      if (err) throw err;
      r.quit(function (err) {
        if (err) throw err;
        resolve();
      });
    });
  });
}

var storageTypes = [{
  name: 'redis',
  constructor: _index.RedisStorage,
  opts: {
    terminal: true
  },
  before: function before() {
    return flushRedis();
  },
  after: function after(driver) {
    // return Promise.resolve().then(() => driver.teardown());
    return flushRedis().then(function () {
      return driver.teardown();
    });
  }
}, {
  name: 'sql',
  constructor: _index.SQLStorage,
  opts: {
    sql: {
      connection: {
        database: 'plump_test',
        user: 'postgres',
        host: 'localhost',
        port: 5432
      }
    },
    terminal: true
  },
  before: function before() {
    return runSQL('DROP DATABASE if exists plump_test;').then(function () {
      return runSQL('CREATE DATABASE plump_test;');
    }).then(function () {
      return runSQL('\n          CREATE SEQUENCE testid_seq\n            START WITH 1\n            INCREMENT BY 1\n            NO MINVALUE\n            MAXVALUE 2147483647\n            CACHE 1\n            CYCLE;\n          CREATE TABLE tests (\n            id integer not null primary key DEFAULT nextval(\'testid_seq\'::regclass),\n            name text,\n            extended jsonb not null default \'{}\'::jsonb\n          );\n          CREATE TABLE children (parent_id integer not null, child_id integer not null);\n          CREATE UNIQUE INDEX children_join on children (parent_id, child_id);\n          CREATE TABLE reactions (parent_id integer not null, child_id integer not null, reaction text not null);\n          CREATE UNIQUE INDEX reactions_join on reactions (parent_id, child_id, reaction);\n          CREATE TABLE valence_children (parent_id integer not null, child_id integer not null, perm integer not null);\n          --CREATE UNIQUE INDEX valence_children_join on valence_children (parent_id, child_id);\n        ', { database: 'plump_test' });
    });
  },
  after: function after(driver) {
    return driver.teardown().then(function () {
      return runSQL('DROP DATABASE plump_test;');
    });
  }
}, {
  name: 'rest',
  constructor: _index.RestStorage,
  opts: {
    terminal: true,
    axios: _axiosMocking2.default.mockup(_testType.TestType)
  }
}, {
  name: 'memory',
  constructor: _index.MemoryStorage,
  opts: { terminal: true }
}];

var sampleObject = {
  name: 'potato',
  extended: {
    actual: 'rutabaga',
    otherValue: 42
  }
};

_chai2.default.use(_chaiAsPromised2.default);
var expect = _chai2.default.expect;

storageTypes.forEach(function (store) {
  describe(store.name, function () {
    var actualStore = void 0;
    before(function () {
      return (store.before || function () {
        return _bluebird2.default.resolve();
      })(actualStore).then(function () {
        actualStore = new store.constructor(store.opts);
      });
    });

    describe('core CRUD', function () {
      it('supports creating values with no id field, and retrieving values', function () {
        return actualStore.write(_testType.TestType, sampleObject).then(function (createdObject) {
          return expect(actualStore.read(_testType.TestType, createdObject.id)).to.eventually.deep.equal(Object.assign({}, sampleObject, _defineProperty({}, _testType.TestType.$id, createdObject.id)));
        });
      });

      it('allows objects to be stored by id', function () {
        return actualStore.write(_testType.TestType, sampleObject).then(function (createdObject) {
          var modObject = Object.assign({}, createdObject, { name: 'carrot' });
          return actualStore.write(_testType.TestType, modObject).then(function (updatedObject) {
            var _Object$assign2;

            return expect(actualStore.read(_testType.TestType, updatedObject.id)).to.eventually.deep.equal(Object.assign({}, sampleObject, (_Object$assign2 = {}, _defineProperty(_Object$assign2, _testType.TestType.$id, createdObject.id), _defineProperty(_Object$assign2, 'name', 'carrot'), _Object$assign2)));
          });
        });
      });

      it('allows for deletion of objects by id', function () {
        return actualStore.write(_testType.TestType, sampleObject).then(function (createdObject) {
          return expect(actualStore.read(_testType.TestType, createdObject.id)).to.eventually.deep.equal(Object.assign({}, sampleObject, _defineProperty({}, _testType.TestType.$id, createdObject.id))).then(function () {
            return actualStore.delete(_testType.TestType, createdObject.id);
          }).then(function () {
            return expect(actualStore.read(_testType.TestType, createdObject.id)).to.eventually.deep.equal(null);
          });
        });
      });
    });

    describe('relationships', function () {
      it('handles relationships with restrictions', function () {
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

      it('can fetch a base and hasmany in one read', function () {
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

      it('can add to a hasMany relationship', function () {
        return actualStore.write(_testType.TestType, sampleObject).then(function (createdObject) {
          return actualStore.add(_testType.TestType, createdObject.id, 'children', 100).then(function () {
            return actualStore.add(_testType.TestType, createdObject.id, 'children', 101);
          }).then(function () {
            return actualStore.add(_testType.TestType, createdObject.id, 'children', 102);
          }).then(function () {
            return actualStore.add(_testType.TestType, createdObject.id, 'children', 103);
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

      it('can add to a hasMany relationship with extras', function () {
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

      it('can modify valence on a hasMany relationship', function () {
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

      it('can remove from a hasMany relationship', function () {
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

      it('supports queries in hasMany relationships', function () {
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

    describe('events', function () {
      it('should pass basic cacheable-write events to other datastores', function () {
        var memstore = new _index.MemoryStorage();
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

      it('should pass basic cacheable-read events up the stack', function () {
        var testPlump = void 0;
        var testItem = void 0;
        var memstore = void 0;
        return actualStore.write(_testType.TestType, {
          name: 'potato'
        }).then(function (createdObject) {
          testItem = createdObject;
          return expect(actualStore.read(_testType.TestType, testItem.id)).to.eventually.have.property('name', 'potato');
        }).then(function () {
          memstore = new _index.MemoryStorage();
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

      it('should pass cacheable-write events on hasMany relationships to other datastores', function () {
        var testItem = void 0;
        var memstore = new _index.MemoryStorage();
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

      it('should pass cacheable-read events on hasMany relationships to other datastores', function () {
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
          memstore = new _index.MemoryStorage();
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

    after(function () {
      return (store.after || function () {})(actualStore);
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3Qvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJwZyIsIlJlZGlzIiwicnVuU1FMIiwiY29tbWFuZCIsIm9wdHMiLCJjb25uT3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInVzZXIiLCJob3N0IiwicG9ydCIsImRhdGFiYXNlIiwiY2hhcnNldCIsImNsaWVudCIsIkNsaWVudCIsInJlc29sdmUiLCJjb25uZWN0IiwiZXJyIiwicXVlcnkiLCJlbmQiLCJmbHVzaFJlZGlzIiwiciIsImNyZWF0ZUNsaWVudCIsImRiIiwiZmx1c2hkYiIsInF1aXQiLCJzdG9yYWdlVHlwZXMiLCJuYW1lIiwiY29uc3RydWN0b3IiLCJ0ZXJtaW5hbCIsImJlZm9yZSIsImFmdGVyIiwiZHJpdmVyIiwidGhlbiIsInRlYXJkb3duIiwic3FsIiwiY29ubmVjdGlvbiIsImF4aW9zIiwibW9ja3VwIiwic2FtcGxlT2JqZWN0IiwiZXh0ZW5kZWQiLCJhY3R1YWwiLCJvdGhlclZhbHVlIiwidXNlIiwiZXhwZWN0IiwiZm9yRWFjaCIsInN0b3JlIiwiZGVzY3JpYmUiLCJhY3R1YWxTdG9yZSIsIml0Iiwid3JpdGUiLCJjcmVhdGVkT2JqZWN0IiwicmVhZCIsImlkIiwidG8iLCJldmVudHVhbGx5IiwiZGVlcCIsImVxdWFsIiwiJGlkIiwibW9kT2JqZWN0IiwidXBkYXRlZE9iamVjdCIsImRlbGV0ZSIsImFkZCIsImxpa2VycyIsInBhcmVudF9pZCIsImNoaWxkX2lkIiwiYWdyZWVycyIsImNoaWxkcmVuIiwicGFyZW50cyIsInBlcm0iLCJ2YWxlbmNlQ2hpbGRyZW4iLCJtb2RpZnlSZWxhdGlvbnNoaXAiLCJyZW1vdmUiLCJxdWVyeUNoaWxkcmVuIiwibWVtc3RvcmUiLCJ0ZXN0UGx1bXAiLCJzdG9yYWdlIiwidHlwZXMiLCJoYXZlIiwicHJvcGVydHkiLCJmaW5hbGx5IiwidGVzdEl0ZW0iLCJiZSIsIm51bGwiXSwibWFwcGluZ3MiOiI7O0FBR0E7Ozs7QUFDQTs7OztBQUNBOztBQUNB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VztBQUVwQjZCLG1CQUFPO0FBRmEsV0FBVixDQUFaO0FBSUEsaUJBQU9qQyxPQUFPOEIsU0FBU3RCLElBQVQscUJBQXdCNkIsU0FBUzVCLEVBQWpDLENBQVAsRUFBNkNDLEVBQTdDLENBQWdEQyxVQUFoRCxDQUEyRDJCLEVBQTNELENBQThEQyxJQUFyRTtBQUNELFNBYk0sRUFhSmxELElBYkksQ0FhQyxZQUFNO0FBQ1osaUJBQU9lLFlBQVlJLElBQVoscUJBQTJCNkIsU0FBUzVCLEVBQXBDLEVBQXdDLFFBQXhDLENBQVA7QUFDRCxTQWZNLEVBZUpwQixJQWZJLENBZUMsWUFBTTtBQUNaLGlCQUFPVyxPQUFPOEIsU0FBU3RCLElBQVQscUJBQXdCNkIsU0FBUzVCLEVBQWpDLEVBQXFDLFFBQXJDLENBQVAsRUFBdURDLEVBQXZELENBQTBEQyxVQUExRCxDQUFxRUMsSUFBckUsQ0FBMEVDLEtBQTFFLENBQWdGO0FBQ3JGTSxvQkFBUSxDQUNOO0FBQ0VDLHlCQUFXLEdBRGI7QUFFRUMsd0JBQVVnQixTQUFTNUI7QUFGckIsYUFETTtBQUQ2RSxXQUFoRixDQUFQO0FBUUQsU0F4Qk0sRUF3QkoyQixPQXhCSSxDQXdCSTtBQUFBLGlCQUFNTCxVQUFVekMsUUFBVixFQUFOO0FBQUEsU0F4QkosQ0FBUDtBQXlCRCxPQTdCRDtBQThCRCxLQTdGRDs7QUErRkFILFVBQU0sWUFBTTtBQUNWLGFBQU8sQ0FBQ2UsTUFBTWYsS0FBTixJQUFnQixZQUFNLENBQUUsQ0FBekIsRUFBNEJpQixXQUE1QixDQUFQO0FBQ0QsS0FGRDtBQUdELEdBMVdEO0FBMldELENBNVdEIiwiZmlsZSI6InRlc3Qvc3RvcmFnZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1lbnYgbm9kZSwgbW9jaGEqL1xuLyogZXNsaW50IG5vLXNoYWRvdzogMCAqL1xuXG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCB7IE1lbW9yeVN0b3JhZ2UsIFJlZGlzU3RvcmFnZSwgUmVzdFN0b3JhZ2UsIFNRTFN0b3JhZ2UsIFBsdW1wLCAkc2VsZiB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7IFRlc3RUeXBlIH0gZnJvbSAnLi90ZXN0VHlwZSc7XG5pbXBvcnQgYXhpb3NNb2NrIGZyb20gJy4vYXhpb3NNb2NraW5nJztcbmltcG9ydCBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCAqIGFzIHBnIGZyb20gJ3BnJztcbmltcG9ydCAqIGFzIFJlZGlzIGZyb20gJ3JlZGlzJztcblxuZnVuY3Rpb24gcnVuU1FMKGNvbW1hbmQsIG9wdHMgPSB7fSkge1xuICBjb25zdCBjb25uT3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAge30sXG4gICAge1xuICAgICAgdXNlcjogJ3Bvc3RncmVzJyxcbiAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgcG9ydDogNTQzMixcbiAgICAgIGRhdGFiYXNlOiAncG9zdGdyZXMnLFxuICAgICAgY2hhcnNldDogJ3V0ZjgnLFxuICAgIH0sXG4gICAgb3B0c1xuICApO1xuICBjb25zdCBjbGllbnQgPSBuZXcgcGcuQ2xpZW50KGNvbm5PcHRpb25zKTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgY2xpZW50LmNvbm5lY3QoKGVycikgPT4ge1xuICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgY2xpZW50LnF1ZXJ5KGNvbW1hbmQsIChlcnIpID0+IHtcbiAgICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgICBjbGllbnQuZW5kKChlcnIpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZmx1c2hSZWRpcygpIHtcbiAgY29uc3QgciA9IFJlZGlzLmNyZWF0ZUNsaWVudCh7XG4gICAgcG9ydDogNjM3OSxcbiAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICBkYjogMCxcbiAgfSk7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIHIuZmx1c2hkYigoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICByLnF1aXQoKGVycikgPT4ge1xuICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuY29uc3Qgc3RvcmFnZVR5cGVzID0gW1xuICB7XG4gICAgbmFtZTogJ3JlZGlzJyxcbiAgICBjb25zdHJ1Y3RvcjogUmVkaXNTdG9yYWdlLFxuICAgIG9wdHM6IHtcbiAgICAgIHRlcm1pbmFsOiB0cnVlLFxuICAgIH0sXG4gICAgYmVmb3JlOiAoKSA9PiB7XG4gICAgICByZXR1cm4gZmx1c2hSZWRpcygpO1xuICAgIH0sXG4gICAgYWZ0ZXI6IChkcml2ZXIpID0+IHtcbiAgICAgIC8vIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IGRyaXZlci50ZWFyZG93bigpKTtcbiAgICAgIHJldHVybiBmbHVzaFJlZGlzKCkudGhlbigoKSA9PiBkcml2ZXIudGVhcmRvd24oKSk7XG4gICAgfSxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdzcWwnLFxuICAgIGNvbnN0cnVjdG9yOiBTUUxTdG9yYWdlLFxuICAgIG9wdHM6IHtcbiAgICAgIHNxbDoge1xuICAgICAgICBjb25uZWN0aW9uOiB7XG4gICAgICAgICAgZGF0YWJhc2U6ICdwbHVtcF90ZXN0JyxcbiAgICAgICAgICB1c2VyOiAncG9zdGdyZXMnLFxuICAgICAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgICAgIHBvcnQ6IDU0MzIsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgdGVybWluYWw6IHRydWUsXG4gICAgfSxcbiAgICBiZWZvcmU6ICgpID0+IHtcbiAgICAgIHJldHVybiBydW5TUUwoJ0RST1AgREFUQUJBU0UgaWYgZXhpc3RzIHBsdW1wX3Rlc3Q7JylcbiAgICAgIC50aGVuKCgpID0+IHJ1blNRTCgnQ1JFQVRFIERBVEFCQVNFIHBsdW1wX3Rlc3Q7JykpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBydW5TUUwoYFxuICAgICAgICAgIENSRUFURSBTRVFVRU5DRSB0ZXN0aWRfc2VxXG4gICAgICAgICAgICBTVEFSVCBXSVRIIDFcbiAgICAgICAgICAgIElOQ1JFTUVOVCBCWSAxXG4gICAgICAgICAgICBOTyBNSU5WQUxVRVxuICAgICAgICAgICAgTUFYVkFMVUUgMjE0NzQ4MzY0N1xuICAgICAgICAgICAgQ0FDSEUgMVxuICAgICAgICAgICAgQ1lDTEU7XG4gICAgICAgICAgQ1JFQVRFIFRBQkxFIHRlc3RzIChcbiAgICAgICAgICAgIGlkIGludGVnZXIgbm90IG51bGwgcHJpbWFyeSBrZXkgREVGQVVMVCBuZXh0dmFsKCd0ZXN0aWRfc2VxJzo6cmVnY2xhc3MpLFxuICAgICAgICAgICAgbmFtZSB0ZXh0LFxuICAgICAgICAgICAgZXh0ZW5kZWQganNvbmIgbm90IG51bGwgZGVmYXVsdCAne30nOjpqc29uYlxuICAgICAgICAgICk7XG4gICAgICAgICAgQ1JFQVRFIFRBQkxFIGNoaWxkcmVuIChwYXJlbnRfaWQgaW50ZWdlciBub3QgbnVsbCwgY2hpbGRfaWQgaW50ZWdlciBub3QgbnVsbCk7XG4gICAgICAgICAgQ1JFQVRFIFVOSVFVRSBJTkRFWCBjaGlsZHJlbl9qb2luIG9uIGNoaWxkcmVuIChwYXJlbnRfaWQsIGNoaWxkX2lkKTtcbiAgICAgICAgICBDUkVBVEUgVEFCTEUgcmVhY3Rpb25zIChwYXJlbnRfaWQgaW50ZWdlciBub3QgbnVsbCwgY2hpbGRfaWQgaW50ZWdlciBub3QgbnVsbCwgcmVhY3Rpb24gdGV4dCBub3QgbnVsbCk7XG4gICAgICAgICAgQ1JFQVRFIFVOSVFVRSBJTkRFWCByZWFjdGlvbnNfam9pbiBvbiByZWFjdGlvbnMgKHBhcmVudF9pZCwgY2hpbGRfaWQsIHJlYWN0aW9uKTtcbiAgICAgICAgICBDUkVBVEUgVEFCTEUgdmFsZW5jZV9jaGlsZHJlbiAocGFyZW50X2lkIGludGVnZXIgbm90IG51bGwsIGNoaWxkX2lkIGludGVnZXIgbm90IG51bGwsIHBlcm0gaW50ZWdlciBub3QgbnVsbCk7XG4gICAgICAgICAgLS1DUkVBVEUgVU5JUVVFIElOREVYIHZhbGVuY2VfY2hpbGRyZW5fam9pbiBvbiB2YWxlbmNlX2NoaWxkcmVuIChwYXJlbnRfaWQsIGNoaWxkX2lkKTtcbiAgICAgICAgYCwgeyBkYXRhYmFzZTogJ3BsdW1wX3Rlc3QnIH0pO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBhZnRlcjogKGRyaXZlcikgPT4ge1xuICAgICAgcmV0dXJuIGRyaXZlci50ZWFyZG93bigpXG4gICAgICAudGhlbigoKSA9PiBydW5TUUwoJ0RST1AgREFUQUJBU0UgcGx1bXBfdGVzdDsnKSk7XG4gICAgfSxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdyZXN0JyxcbiAgICBjb25zdHJ1Y3RvcjogUmVzdFN0b3JhZ2UsXG4gICAgb3B0czoge1xuICAgICAgdGVybWluYWw6IHRydWUsXG4gICAgICBheGlvczogYXhpb3NNb2NrLm1vY2t1cChUZXN0VHlwZSksXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdtZW1vcnknLFxuICAgIGNvbnN0cnVjdG9yOiBNZW1vcnlTdG9yYWdlLFxuICAgIG9wdHM6IHsgdGVybWluYWw6IHRydWUgfSxcbiAgfSxcbl07XG5cbmNvbnN0IHNhbXBsZU9iamVjdCA9IHtcbiAgbmFtZTogJ3BvdGF0bycsXG4gIGV4dGVuZGVkOiB7XG4gICAgYWN0dWFsOiAncnV0YWJhZ2EnLFxuICAgIG90aGVyVmFsdWU6IDQyLFxuICB9LFxufTtcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbnN0b3JhZ2VUeXBlcy5mb3JFYWNoKChzdG9yZSkgPT4ge1xuICBkZXNjcmliZShzdG9yZS5uYW1lLCAoKSA9PiB7XG4gICAgbGV0IGFjdHVhbFN0b3JlO1xuICAgIGJlZm9yZSgoKSA9PiB7XG4gICAgICByZXR1cm4gKHN0b3JlLmJlZm9yZSB8fCAoKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCkpKShhY3R1YWxTdG9yZSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgYWN0dWFsU3RvcmUgPSBuZXcgc3RvcmUuY29uc3RydWN0b3Ioc3RvcmUub3B0cyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdjb3JlIENSVUQnLCAoKSA9PiB7XG4gICAgICBpdCgnc3VwcG9ydHMgY3JlYXRpbmcgdmFsdWVzIHdpdGggbm8gaWQgZmllbGQsIGFuZCByZXRyaWV2aW5nIHZhbHVlcycsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKSlcbiAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKE9iamVjdC5hc3NpZ24oe30sIHNhbXBsZU9iamVjdCwgeyBbVGVzdFR5cGUuJGlkXTogY3JlYXRlZE9iamVjdC5pZCB9KSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdhbGxvd3Mgb2JqZWN0cyB0byBiZSBzdG9yZWQgYnkgaWQnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIGNvbnN0IG1vZE9iamVjdCA9IE9iamVjdC5hc3NpZ24oe30sIGNyZWF0ZWRPYmplY3QsIHsgbmFtZTogJ2NhcnJvdCcgfSk7XG4gICAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBtb2RPYmplY3QpXG4gICAgICAgICAgLnRoZW4oKHVwZGF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgdXBkYXRlZE9iamVjdC5pZCkpXG4gICAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKE9iamVjdC5hc3NpZ24oXG4gICAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgICBzYW1wbGVPYmplY3QsXG4gICAgICAgICAgICAgIHsgW1Rlc3RUeXBlLiRpZF06IGNyZWF0ZWRPYmplY3QuaWQsIG5hbWU6ICdjYXJyb3QnIH1cbiAgICAgICAgICAgICkpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnYWxsb3dzIGZvciBkZWxldGlvbiBvZiBvYmplY3RzIGJ5IGlkJywgKCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoT2JqZWN0LmFzc2lnbih7fSwgc2FtcGxlT2JqZWN0LCB7IFtUZXN0VHlwZS4kaWRdOiBjcmVhdGVkT2JqZWN0LmlkIH0pKVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmRlbGV0ZShUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwobnVsbCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ3JlbGF0aW9uc2hpcHMnLCAoKSA9PiB7XG4gICAgICBpdCgnaGFuZGxlcyByZWxhdGlvbnNoaXBzIHdpdGggcmVzdHJpY3Rpb25zJywgKCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnbGlrZXJzJywgMTAwKVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2xpa2VycycsIDEwMSkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnYWdyZWVycycsIDEwMCkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnYWdyZWVycycsIDEwMSkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnYWdyZWVycycsIDEwMikpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnbGlrZXJzJykpXG4gICAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgICAgbGlrZXJzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiAxMDAsXG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogMTAxLFxuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnYWdyZWVycycpKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICAgIGFncmVlcnM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiAxMDEsXG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogMTAyLFxuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnY2FuIGZldGNoIGEgYmFzZSBhbmQgaGFzbWFueSBpbiBvbmUgcmVhZCcsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMjAwKVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMjAxKSlcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDIwMikpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAyMDMpKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgWydjaGlsZHJlbicsICRzZWxmXSkpXG4gICAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFxuICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKFxuICAgICAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgICAgIGNyZWF0ZWRPYmplY3QsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAyMDAsXG4gICAgICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDIwMSxcbiAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMjAyLFxuICAgICAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAyMDMsXG4gICAgICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdjYW4gYWRkIHRvIGEgaGFzTWFueSByZWxhdGlvbnNoaXAnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMClcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMSkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDIpKVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMTAzKSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsIFsnY2hpbGRyZW4nXSkpXG4gICAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMSxcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDIsXG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAzLFxuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgMTAwLCBbJ3BhcmVudHMnXSkpXG4gICAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgICAgcGFyZW50czogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnY2FuIGFkZCB0byBhIGhhc01hbnkgcmVsYXRpb25zaGlwIHdpdGggZXh0cmFzJywgKCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7IHBlcm06IDEgfSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgICB2YWxlbmNlQ2hpbGRyZW46IFt7XG4gICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgcGVybTogMSxcbiAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ2NhbiBtb2RpZnkgdmFsZW5jZSBvbiBhIGhhc01hbnkgcmVsYXRpb25zaGlwJywgKCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7IHBlcm06IDEgfSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgICB2YWxlbmNlQ2hpbGRyZW46IFt7XG4gICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgcGVybTogMSxcbiAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KS50aGVuKCgpID0+IGFjdHVhbFN0b3JlLm1vZGlmeVJlbGF0aW9uc2hpcChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3ZhbGVuY2VDaGlsZHJlbicsIDEwMCwgeyBwZXJtOiAyIH0pKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICAgIHZhbGVuY2VDaGlsZHJlbjogW3tcbiAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICBwZXJtOiAyLFxuICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnY2FuIHJlbW92ZSBmcm9tIGEgaGFzTWFueSByZWxhdGlvbnNoaXAnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicpKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICAgIGNoaWxkcmVuOiBbe1xuICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUucmVtb3ZlKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJykpXG4gICAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgY2hpbGRyZW46IFtdIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc3VwcG9ydHMgcXVlcmllcyBpbiBoYXNNYW55IHJlbGF0aW9uc2hpcHMnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdxdWVyeUNoaWxkcmVuJywgMTAxLCB7IHBlcm06IDEgfSlcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdxdWVyeUNoaWxkcmVuJywgMTAyLCB7IHBlcm06IDIgfSkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAncXVlcnlDaGlsZHJlbicsIDEwMywgeyBwZXJtOiAzIH0pKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3F1ZXJ5Q2hpbGRyZW4nKSlcbiAgICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgICBxdWVyeUNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMixcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICAgIHBlcm06IDIsXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMyxcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICAgIHBlcm06IDMsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ2V2ZW50cycsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgcGFzcyBiYXNpYyBjYWNoZWFibGUtd3JpdGUgZXZlbnRzIHRvIG90aGVyIGRhdGFzdG9yZXMnLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG1lbXN0b3JlID0gbmV3IE1lbW9yeVN0b3JhZ2UoKTtcbiAgICAgICAgY29uc3QgdGVzdFBsdW1wID0gbmV3IFBsdW1wKHtcbiAgICAgICAgICBzdG9yYWdlOiBbbWVtc3RvcmUsIGFjdHVhbFN0b3JlXSxcbiAgICAgICAgICB0eXBlczogW1Rlc3RUeXBlXSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwge1xuICAgICAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgICAgICB9KS50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChtZW1zdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gdGVzdFBsdW1wLnRlYXJkb3duKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgcGFzcyBiYXNpYyBjYWNoZWFibGUtcmVhZCBldmVudHMgdXAgdGhlIHN0YWNrJywgKCkgPT4ge1xuICAgICAgICBsZXQgdGVzdFBsdW1wO1xuICAgICAgICBsZXQgdGVzdEl0ZW07XG4gICAgICAgIGxldCBtZW1zdG9yZTtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCB7XG4gICAgICAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgICAgIH0pLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICB0ZXN0SXRlbSA9IGNyZWF0ZWRPYmplY3Q7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCB0ZXN0SXRlbS5pZCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgbWVtc3RvcmUgPSBuZXcgTWVtb3J5U3RvcmFnZSgpO1xuICAgICAgICAgIHRlc3RQbHVtcCA9IG5ldyBQbHVtcCh7XG4gICAgICAgICAgICBzdG9yYWdlOiBbbWVtc3RvcmUsIGFjdHVhbFN0b3JlXSxcbiAgICAgICAgICAgIHR5cGVzOiBbVGVzdFR5cGVdLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBleHBlY3QobWVtc3RvcmUucmVhZChUZXN0VHlwZSwgdGVzdEl0ZW0uaWQpKS50by5ldmVudHVhbGx5LmJlLm51bGw7XG4gICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCB0ZXN0SXRlbS5pZCk7XG4gICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBleHBlY3QobWVtc3RvcmUucmVhZChUZXN0VHlwZSwgdGVzdEl0ZW0uaWQpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4gdGVzdFBsdW1wLnRlYXJkb3duKCkpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgcGFzcyBjYWNoZWFibGUtd3JpdGUgZXZlbnRzIG9uIGhhc01hbnkgcmVsYXRpb25zaGlwcyB0byBvdGhlciBkYXRhc3RvcmVzJywgKCkgPT4ge1xuICAgICAgICBsZXQgdGVzdEl0ZW07XG4gICAgICAgIGNvbnN0IG1lbXN0b3JlID0gbmV3IE1lbW9yeVN0b3JhZ2UoKTtcbiAgICAgICAgY29uc3QgdGVzdFBsdW1wID0gbmV3IFBsdW1wKHtcbiAgICAgICAgICBzdG9yYWdlOiBbbWVtc3RvcmUsIGFjdHVhbFN0b3JlXSxcbiAgICAgICAgICB0eXBlczogW1Rlc3RUeXBlXSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwge1xuICAgICAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgICAgICB9KS50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgdGVzdEl0ZW0gPSBjcmVhdGVkT2JqZWN0O1xuICAgICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIHRlc3RJdGVtLmlkLCAnbGlrZXJzJywgMTAwKTtcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChtZW1zdG9yZS5yZWFkKFRlc3RUeXBlLCB0ZXN0SXRlbS5pZCwgJ2xpa2VycycpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgbGlrZXJzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICBjaGlsZF9pZDogdGVzdEl0ZW0uaWQsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHRlc3RQbHVtcC50ZWFyZG93bigpKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIHBhc3MgY2FjaGVhYmxlLXJlYWQgZXZlbnRzIG9uIGhhc01hbnkgcmVsYXRpb25zaGlwcyB0byBvdGhlciBkYXRhc3RvcmVzJywgKCkgPT4ge1xuICAgICAgICBsZXQgdGVzdFBsdW1wO1xuICAgICAgICBsZXQgdGVzdEl0ZW07XG4gICAgICAgIGxldCBtZW1zdG9yZTtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCB7XG4gICAgICAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgICAgIH0pLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICB0ZXN0SXRlbSA9IGNyZWF0ZWRPYmplY3Q7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCB0ZXN0SXRlbS5pZCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICAgICAgfSkudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIHRlc3RJdGVtLmlkLCAnbGlrZXJzJywgMTAwKSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIG1lbXN0b3JlID0gbmV3IE1lbW9yeVN0b3JhZ2UoKTtcbiAgICAgICAgICB0ZXN0UGx1bXAgPSBuZXcgUGx1bXAoe1xuICAgICAgICAgICAgc3RvcmFnZTogW21lbXN0b3JlLCBhY3R1YWxTdG9yZV0sXG4gICAgICAgICAgICB0eXBlczogW1Rlc3RUeXBlXSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KG1lbXN0b3JlLnJlYWQoVGVzdFR5cGUsIHRlc3RJdGVtLmlkKSkudG8uZXZlbnR1YWxseS5iZS5udWxsO1xuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgdGVzdEl0ZW0uaWQsICdsaWtlcnMnKTtcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChtZW1zdG9yZS5yZWFkKFRlc3RUeXBlLCB0ZXN0SXRlbS5pZCwgJ2xpa2VycycpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgbGlrZXJzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICBjaGlsZF9pZDogdGVzdEl0ZW0uaWQsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHRlc3RQbHVtcC50ZWFyZG93bigpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgYWZ0ZXIoKCkgPT4ge1xuICAgICAgcmV0dXJuIChzdG9yZS5hZnRlciB8fCAoKCkgPT4ge30pKShhY3R1YWxTdG9yZSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=
