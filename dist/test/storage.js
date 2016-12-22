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

      it('can add to a hasMany relationship', function () {
        return actualStore.write(_testType.TestType, sampleObject).then(function (createdObject) {
          return actualStore.add(_testType.TestType, createdObject.id, 'children', 100).then(function () {
            return actualStore.add(_testType.TestType, createdObject.id, 'children', 101);
          }).then(function () {
            return actualStore.add(_testType.TestType, createdObject.id, 'children', 102);
          }).then(function () {
            return actualStore.add(_testType.TestType, createdObject.id, 'children', 103);
          }).then(function () {
            return expect(actualStore.read(_testType.TestType, createdObject.id, 'children')).to.eventually.deep.equal({
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
            return expect(actualStore.read(_testType.TestType, 100, 'parents')).to.eventually.deep.equal({
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3Qvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJwZyIsIlJlZGlzIiwicnVuU1FMIiwiY29tbWFuZCIsIm9wdHMiLCJjb25uT3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInVzZXIiLCJob3N0IiwicG9ydCIsImRhdGFiYXNlIiwiY2hhcnNldCIsImNsaWVudCIsIkNsaWVudCIsInJlc29sdmUiLCJjb25uZWN0IiwiZXJyIiwicXVlcnkiLCJlbmQiLCJmbHVzaFJlZGlzIiwiciIsImNyZWF0ZUNsaWVudCIsImRiIiwiZmx1c2hkYiIsInF1aXQiLCJzdG9yYWdlVHlwZXMiLCJuYW1lIiwiY29uc3RydWN0b3IiLCJ0ZXJtaW5hbCIsImJlZm9yZSIsImFmdGVyIiwiZHJpdmVyIiwidGhlbiIsInRlYXJkb3duIiwic3FsIiwiY29ubmVjdGlvbiIsImF4aW9zIiwibW9ja3VwIiwic2FtcGxlT2JqZWN0IiwiZXh0ZW5kZWQiLCJhY3R1YWwiLCJvdGhlclZhbHVlIiwidXNlIiwiZXhwZWN0IiwiZm9yRWFjaCIsInN0b3JlIiwiZGVzY3JpYmUiLCJhY3R1YWxTdG9yZSIsIml0Iiwid3JpdGUiLCJjcmVhdGVkT2JqZWN0IiwicmVhZCIsImlkIiwidG8iLCJldmVudHVhbGx5IiwiZGVlcCIsImVxdWFsIiwiJGlkIiwibW9kT2JqZWN0IiwidXBkYXRlZE9iamVjdCIsImRlbGV0ZSIsImFkZCIsImxpa2VycyIsInBhcmVudF9pZCIsImNoaWxkX2lkIiwiYWdyZWVycyIsImNoaWxkcmVuIiwicGFyZW50cyIsInBlcm0iLCJ2YWxlbmNlQ2hpbGRyZW4iLCJtb2RpZnlSZWxhdGlvbnNoaXAiLCJyZW1vdmUiLCJxdWVyeUNoaWxkcmVuIiwibWVtc3RvcmUiLCJ0ZXN0UGx1bXAiLCJzdG9yYWdlIiwidHlwZXMiLCJoYXZlIiwicHJvcGVydHkiLCJmaW5hbGx5IiwidGVzdEl0ZW0iLCJiZSIsIm51bGwiXSwibWFwcGluZ3MiOiI7O0FBR0E7Ozs7QUFDQTs7OztBQUNBOztBQUNB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QVQscUJBQXdCNkIsU0FBUzVCLEVBQWpDLENBQVAsRUFBNkNDLEVBQTdDLENBQWdEQyxVQUFoRCxDQUEyRDJCLEVBQTNELENBQThEQyxJQUFyRTtBQUNELFNBYk0sRUFhSmxELElBYkksQ0FhQyxZQUFNO0FBQ1osaUJBQU9lLFlBQVlJLElBQVoscUJBQTJCNkIsU0FBUzVCLEVBQXBDLEVBQXdDLFFBQXhDLENBQVA7QUFDRCxTQWZNLEVBZUpwQixJQWZJLENBZUMsWUFBTTtBQUNaLGlCQUFPVyxPQUFPOEIsU0FBU3RCLElBQVQscUJBQXdCNkIsU0FBUzVCLEVBQWpDLEVBQXFDLFFBQXJDLENBQVAsRUFBdURDLEVBQXZELENBQTBEQyxVQUExRCxDQUFxRUMsSUFBckUsQ0FBMEVDLEtBQTFFLENBQWdGO0FBQ3JGTSxvQkFBUSxDQUNOO0FBQ0VDLHlCQUFXLEdBRGI7QUFFRUMsd0JBQVVnQixTQUFTNUI7QUFGckIsYUFETTtBQUQ2RSxXQUFoRixDQUFQO0FBUUQsU0F4Qk0sRUF3QkoyQixPQXhCSSxDQXdCSTtBQUFBLGlCQUFNTCxVQUFVekMsUUFBVixFQUFOO0FBQUEsU0F4QkosQ0FBUDtBQXlCRCxPQTdCRDtBQThCRCxLQTdGRDs7QUErRkFILFVBQU0sWUFBTTtBQUNWLGFBQU8sQ0FBQ2UsTUFBTWYsS0FBTixJQUFnQixZQUFNLENBQUUsQ0FBekIsRUFBNEJpQixXQUE1QixDQUFQO0FBQ0QsS0FGRDtBQUdELEdBblVEO0FBb1VELENBclVEIiwiZmlsZSI6InRlc3Qvc3RvcmFnZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1lbnYgbm9kZSwgbW9jaGEqL1xuLyogZXNsaW50IG5vLXNoYWRvdzogMCAqL1xuXG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCB7IE1lbW9yeVN0b3JhZ2UsIFJlZGlzU3RvcmFnZSwgUmVzdFN0b3JhZ2UsIFNRTFN0b3JhZ2UsIFBsdW1wIH0gZnJvbSAnLi4vaW5kZXgnO1xuaW1wb3J0IHsgVGVzdFR5cGUgfSBmcm9tICcuL3Rlc3RUeXBlJztcbmltcG9ydCBheGlvc01vY2sgZnJvbSAnLi9heGlvc01vY2tpbmcnO1xuaW1wb3J0IFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0ICogYXMgcGcgZnJvbSAncGcnO1xuaW1wb3J0ICogYXMgUmVkaXMgZnJvbSAncmVkaXMnO1xuXG5mdW5jdGlvbiBydW5TUUwoY29tbWFuZCwgb3B0cyA9IHt9KSB7XG4gIGNvbnN0IGNvbm5PcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICB7fSxcbiAgICB7XG4gICAgICB1c2VyOiAncG9zdGdyZXMnLFxuICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgICBwb3J0OiA1NDMyLFxuICAgICAgZGF0YWJhc2U6ICdwb3N0Z3JlcycsXG4gICAgICBjaGFyc2V0OiAndXRmOCcsXG4gICAgfSxcbiAgICBvcHRzXG4gICk7XG4gIGNvbnN0IGNsaWVudCA9IG5ldyBwZy5DbGllbnQoY29ubk9wdGlvbnMpO1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICBjbGllbnQuY29ubmVjdCgoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICBjbGllbnQucXVlcnkoY29tbWFuZCwgKGVycikgPT4ge1xuICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICAgIGNsaWVudC5lbmQoKGVycikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBmbHVzaFJlZGlzKCkge1xuICBjb25zdCByID0gUmVkaXMuY3JlYXRlQ2xpZW50KHtcbiAgICBwb3J0OiA2Mzc5LFxuICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgIGRiOiAwLFxuICB9KTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgci5mbHVzaGRiKChlcnIpID0+IHtcbiAgICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICAgIHIucXVpdCgoZXJyKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5jb25zdCBzdG9yYWdlVHlwZXMgPSBbXG4gIHtcbiAgICBuYW1lOiAncmVkaXMnLFxuICAgIGNvbnN0cnVjdG9yOiBSZWRpc1N0b3JhZ2UsXG4gICAgb3B0czoge1xuICAgICAgdGVybWluYWw6IHRydWUsXG4gICAgfSxcbiAgICBiZWZvcmU6ICgpID0+IHtcbiAgICAgIHJldHVybiBmbHVzaFJlZGlzKCk7XG4gICAgfSxcbiAgICBhZnRlcjogKGRyaXZlcikgPT4ge1xuICAgICAgLy8gcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4gZHJpdmVyLnRlYXJkb3duKCkpO1xuICAgICAgcmV0dXJuIGZsdXNoUmVkaXMoKS50aGVuKCgpID0+IGRyaXZlci50ZWFyZG93bigpKTtcbiAgICB9LFxuICB9LFxuICB7XG4gICAgbmFtZTogJ3NxbCcsXG4gICAgY29uc3RydWN0b3I6IFNRTFN0b3JhZ2UsXG4gICAgb3B0czoge1xuICAgICAgc3FsOiB7XG4gICAgICAgIGNvbm5lY3Rpb246IHtcbiAgICAgICAgICBkYXRhYmFzZTogJ3BsdW1wX3Rlc3QnLFxuICAgICAgICAgIHVzZXI6ICdwb3N0Z3JlcycsXG4gICAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgICAgICAgcG9ydDogNTQzMixcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB0ZXJtaW5hbDogdHJ1ZSxcbiAgICB9LFxuICAgIGJlZm9yZTogKCkgPT4ge1xuICAgICAgcmV0dXJuIHJ1blNRTCgnRFJPUCBEQVRBQkFTRSBpZiBleGlzdHMgcGx1bXBfdGVzdDsnKVxuICAgICAgLnRoZW4oKCkgPT4gcnVuU1FMKCdDUkVBVEUgREFUQUJBU0UgcGx1bXBfdGVzdDsnKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHJ1blNRTChgXG4gICAgICAgICAgQ1JFQVRFIFNFUVVFTkNFIHRlc3RpZF9zZXFcbiAgICAgICAgICAgIFNUQVJUIFdJVEggMVxuICAgICAgICAgICAgSU5DUkVNRU5UIEJZIDFcbiAgICAgICAgICAgIE5PIE1JTlZBTFVFXG4gICAgICAgICAgICBNQVhWQUxVRSAyMTQ3NDgzNjQ3XG4gICAgICAgICAgICBDQUNIRSAxXG4gICAgICAgICAgICBDWUNMRTtcbiAgICAgICAgICBDUkVBVEUgVEFCTEUgdGVzdHMgKFxuICAgICAgICAgICAgaWQgaW50ZWdlciBub3QgbnVsbCBwcmltYXJ5IGtleSBERUZBVUxUIG5leHR2YWwoJ3Rlc3RpZF9zZXEnOjpyZWdjbGFzcyksXG4gICAgICAgICAgICBuYW1lIHRleHQsXG4gICAgICAgICAgICBleHRlbmRlZCBqc29uYiBub3QgbnVsbCBkZWZhdWx0ICd7fSc6Ompzb25iXG4gICAgICAgICAgKTtcbiAgICAgICAgICBDUkVBVEUgVEFCTEUgY2hpbGRyZW4gKHBhcmVudF9pZCBpbnRlZ2VyIG5vdCBudWxsLCBjaGlsZF9pZCBpbnRlZ2VyIG5vdCBudWxsKTtcbiAgICAgICAgICBDUkVBVEUgVU5JUVVFIElOREVYIGNoaWxkcmVuX2pvaW4gb24gY2hpbGRyZW4gKHBhcmVudF9pZCwgY2hpbGRfaWQpO1xuICAgICAgICAgIENSRUFURSBUQUJMRSByZWFjdGlvbnMgKHBhcmVudF9pZCBpbnRlZ2VyIG5vdCBudWxsLCBjaGlsZF9pZCBpbnRlZ2VyIG5vdCBudWxsLCByZWFjdGlvbiB0ZXh0IG5vdCBudWxsKTtcbiAgICAgICAgICBDUkVBVEUgVU5JUVVFIElOREVYIHJlYWN0aW9uc19qb2luIG9uIHJlYWN0aW9ucyAocGFyZW50X2lkLCBjaGlsZF9pZCwgcmVhY3Rpb24pO1xuICAgICAgICAgIENSRUFURSBUQUJMRSB2YWxlbmNlX2NoaWxkcmVuIChwYXJlbnRfaWQgaW50ZWdlciBub3QgbnVsbCwgY2hpbGRfaWQgaW50ZWdlciBub3QgbnVsbCwgcGVybSBpbnRlZ2VyIG5vdCBudWxsKTtcbiAgICAgICAgICAtLUNSRUFURSBVTklRVUUgSU5ERVggdmFsZW5jZV9jaGlsZHJlbl9qb2luIG9uIHZhbGVuY2VfY2hpbGRyZW4gKHBhcmVudF9pZCwgY2hpbGRfaWQpO1xuICAgICAgICBgLCB7IGRhdGFiYXNlOiAncGx1bXBfdGVzdCcgfSk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGFmdGVyOiAoZHJpdmVyKSA9PiB7XG4gICAgICByZXR1cm4gZHJpdmVyLnRlYXJkb3duKClcbiAgICAgIC50aGVuKCgpID0+IHJ1blNRTCgnRFJPUCBEQVRBQkFTRSBwbHVtcF90ZXN0OycpKTtcbiAgICB9LFxuICB9LFxuICB7XG4gICAgbmFtZTogJ3Jlc3QnLFxuICAgIGNvbnN0cnVjdG9yOiBSZXN0U3RvcmFnZSxcbiAgICBvcHRzOiB7XG4gICAgICB0ZXJtaW5hbDogdHJ1ZSxcbiAgICAgIGF4aW9zOiBheGlvc01vY2subW9ja3VwKFRlc3RUeXBlKSxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgbmFtZTogJ21lbW9yeScsXG4gICAgY29uc3RydWN0b3I6IE1lbW9yeVN0b3JhZ2UsXG4gICAgb3B0czogeyB0ZXJtaW5hbDogdHJ1ZSB9LFxuICB9LFxuXTtcblxuY29uc3Qgc2FtcGxlT2JqZWN0ID0ge1xuICBuYW1lOiAncG90YXRvJyxcbiAgZXh0ZW5kZWQ6IHtcbiAgICBhY3R1YWw6ICdydXRhYmFnYScsXG4gICAgb3RoZXJWYWx1ZTogNDIsXG4gIH0sXG59O1xuXG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5jb25zdCBleHBlY3QgPSBjaGFpLmV4cGVjdDtcblxuc3RvcmFnZVR5cGVzLmZvckVhY2goKHN0b3JlKSA9PiB7XG4gIGRlc2NyaWJlKHN0b3JlLm5hbWUsICgpID0+IHtcbiAgICBsZXQgYWN0dWFsU3RvcmU7XG4gICAgYmVmb3JlKCgpID0+IHtcbiAgICAgIHJldHVybiAoc3RvcmUuYmVmb3JlIHx8ICgoKSA9PiBQcm9taXNlLnJlc29sdmUoKSkpKGFjdHVhbFN0b3JlKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBhY3R1YWxTdG9yZSA9IG5ldyBzdG9yZS5jb25zdHJ1Y3RvcihzdG9yZS5vcHRzKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ2NvcmUgQ1JVRCcsICgpID0+IHtcbiAgICAgIGl0KCdzdXBwb3J0cyBjcmVhdGluZyB2YWx1ZXMgd2l0aCBubyBpZCBmaWVsZCwgYW5kIHJldHJpZXZpbmcgdmFsdWVzJywgKCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoT2JqZWN0LmFzc2lnbih7fSwgc2FtcGxlT2JqZWN0LCB7IFtUZXN0VHlwZS4kaWRdOiBjcmVhdGVkT2JqZWN0LmlkIH0pKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ2FsbG93cyBvYmplY3RzIHRvIGJlIHN0b3JlZCBieSBpZCcsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgY29uc3QgbW9kT2JqZWN0ID0gT2JqZWN0LmFzc2lnbih7fSwgY3JlYXRlZE9iamVjdCwgeyBuYW1lOiAnY2Fycm90JyB9KTtcbiAgICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIG1vZE9iamVjdClcbiAgICAgICAgICAudGhlbigodXBkYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCB1cGRhdGVkT2JqZWN0LmlkKSlcbiAgICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoT2JqZWN0LmFzc2lnbihcbiAgICAgICAgICAgICAge30sXG4gICAgICAgICAgICAgIHNhbXBsZU9iamVjdCxcbiAgICAgICAgICAgICAgeyBbVGVzdFR5cGUuJGlkXTogY3JlYXRlZE9iamVjdC5pZCwgbmFtZTogJ2NhcnJvdCcgfVxuICAgICAgICAgICAgKSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdhbGxvd3MgZm9yIGRlbGV0aW9uIG9mIG9iamVjdHMgYnkgaWQnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCkpXG4gICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChPYmplY3QuYXNzaWduKHt9LCBzYW1wbGVPYmplY3QsIHsgW1Rlc3RUeXBlLiRpZF06IGNyZWF0ZWRPYmplY3QuaWQgfSkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuZGVsZXRlKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKSlcbiAgICAgICAgICAudGhlbigoKSA9PiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCkpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChudWxsKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgncmVsYXRpb25zaGlwcycsICgpID0+IHtcbiAgICAgIGl0KCdoYW5kbGVzIHJlbGF0aW9uc2hpcHMgd2l0aCByZXN0cmljdGlvbnMnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdsaWtlcnMnLCAxMDApXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnbGlrZXJzJywgMTAxKSlcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdhZ3JlZXJzJywgMTAwKSlcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdhZ3JlZXJzJywgMTAxKSlcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdhZ3JlZXJzJywgMTAyKSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdsaWtlcnMnKSlcbiAgICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgICBsaWtlcnM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiAxMDEsXG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdhZ3JlZXJzJykpXG4gICAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgICAgYWdyZWVyczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogMTAwLFxuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IDEwMSxcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiAxMDIsXG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdjYW4gYWRkIHRvIGEgaGFzTWFueSByZWxhdGlvbnNoaXAnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMClcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMSkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDIpKVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMTAzKSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicpKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDEsXG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAyLFxuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMyxcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIDEwMCwgJ3BhcmVudHMnKSlcbiAgICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgICBwYXJlbnRzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdjYW4gYWRkIHRvIGEgaGFzTWFueSByZWxhdGlvbnNoaXAgd2l0aCBleHRyYXMnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICd2YWxlbmNlQ2hpbGRyZW4nLCAxMDAsIHsgcGVybTogMSB9KVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICAgIHZhbGVuY2VDaGlsZHJlbjogW3tcbiAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICBwZXJtOiAxLFxuICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnY2FuIG1vZGlmeSB2YWxlbmNlIG9uIGEgaGFzTWFueSByZWxhdGlvbnNoaXAnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICd2YWxlbmNlQ2hpbGRyZW4nLCAxMDAsIHsgcGVybTogMSB9KVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICAgIHZhbGVuY2VDaGlsZHJlbjogW3tcbiAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICBwZXJtOiAxLFxuICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUubW9kaWZ5UmVsYXRpb25zaGlwKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7IHBlcm06IDIgfSkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgICAgdmFsZW5jZUNoaWxkcmVuOiBbe1xuICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgIHBlcm06IDIsXG4gICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdjYW4gcmVtb3ZlIGZyb20gYSBoYXNNYW55IHJlbGF0aW9uc2hpcCcsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMTAwKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJykpXG4gICAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgICAgY2hpbGRyZW46IFt7XG4gICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5yZW1vdmUoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMCkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nKSlcbiAgICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoeyBjaGlsZHJlbjogW10gfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzdXBwb3J0cyBxdWVyaWVzIGluIGhhc01hbnkgcmVsYXRpb25zaGlwcycsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3F1ZXJ5Q2hpbGRyZW4nLCAxMDEsIHsgcGVybTogMSB9KVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3F1ZXJ5Q2hpbGRyZW4nLCAxMDIsIHsgcGVybTogMiB9KSlcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdxdWVyeUNoaWxkcmVuJywgMTAzLCB7IHBlcm06IDMgfSkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAncXVlcnlDaGlsZHJlbicpKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICAgIHF1ZXJ5Q2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAyLFxuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgICAgcGVybTogMixcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAzLFxuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgICAgcGVybTogMyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnZXZlbnRzJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCBwYXNzIGJhc2ljIGNhY2hlYWJsZS13cml0ZSBldmVudHMgdG8gb3RoZXIgZGF0YXN0b3JlcycsICgpID0+IHtcbiAgICAgICAgY29uc3QgbWVtc3RvcmUgPSBuZXcgTWVtb3J5U3RvcmFnZSgpO1xuICAgICAgICBjb25zdCB0ZXN0UGx1bXAgPSBuZXcgUGx1bXAoe1xuICAgICAgICAgIHN0b3JhZ2U6IFttZW1zdG9yZSwgYWN0dWFsU3RvcmVdLFxuICAgICAgICAgIHR5cGVzOiBbVGVzdFR5cGVdLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCB7XG4gICAgICAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgICAgIH0pLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KG1lbXN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB0ZXN0UGx1bXAudGVhcmRvd24oKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBwYXNzIGJhc2ljIGNhY2hlYWJsZS1yZWFkIGV2ZW50cyB1cCB0aGUgc3RhY2snLCAoKSA9PiB7XG4gICAgICAgIGxldCB0ZXN0UGx1bXA7XG4gICAgICAgIGxldCB0ZXN0SXRlbTtcbiAgICAgICAgbGV0IG1lbXN0b3JlO1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIHtcbiAgICAgICAgICBuYW1lOiAncG90YXRvJyxcbiAgICAgICAgfSkudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHRlc3RJdGVtID0gY3JlYXRlZE9iamVjdDtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIHRlc3RJdGVtLmlkKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICBtZW1zdG9yZSA9IG5ldyBNZW1vcnlTdG9yYWdlKCk7XG4gICAgICAgICAgdGVzdFBsdW1wID0gbmV3IFBsdW1wKHtcbiAgICAgICAgICAgIHN0b3JhZ2U6IFttZW1zdG9yZSwgYWN0dWFsU3RvcmVdLFxuICAgICAgICAgICAgdHlwZXM6IFtUZXN0VHlwZV0sXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChtZW1zdG9yZS5yZWFkKFRlc3RUeXBlLCB0ZXN0SXRlbS5pZCkpLnRvLmV2ZW50dWFsbHkuYmUubnVsbDtcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIHRlc3RJdGVtLmlkKTtcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChtZW1zdG9yZS5yZWFkKFRlc3RUeXBlLCB0ZXN0SXRlbS5pZCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICAgICAgfSkuZmluYWxseSgoKSA9PiB0ZXN0UGx1bXAudGVhcmRvd24oKSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBwYXNzIGNhY2hlYWJsZS13cml0ZSBldmVudHMgb24gaGFzTWFueSByZWxhdGlvbnNoaXBzIHRvIG90aGVyIGRhdGFzdG9yZXMnLCAoKSA9PiB7XG4gICAgICAgIGxldCB0ZXN0SXRlbTtcbiAgICAgICAgY29uc3QgbWVtc3RvcmUgPSBuZXcgTWVtb3J5U3RvcmFnZSgpO1xuICAgICAgICBjb25zdCB0ZXN0UGx1bXAgPSBuZXcgUGx1bXAoe1xuICAgICAgICAgIHN0b3JhZ2U6IFttZW1zdG9yZSwgYWN0dWFsU3RvcmVdLFxuICAgICAgICAgIHR5cGVzOiBbVGVzdFR5cGVdLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCB7XG4gICAgICAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgICAgIH0pLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICB0ZXN0SXRlbSA9IGNyZWF0ZWRPYmplY3Q7XG4gICAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgdGVzdEl0ZW0uaWQsICdsaWtlcnMnLCAxMDApO1xuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KG1lbXN0b3JlLnJlYWQoVGVzdFR5cGUsIHRlc3RJdGVtLmlkLCAnbGlrZXJzJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICBsaWtlcnM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcmVudF9pZDogMTAwLFxuICAgICAgICAgICAgICAgIGNoaWxkX2lkOiB0ZXN0SXRlbS5pZCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4gdGVzdFBsdW1wLnRlYXJkb3duKCkpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgcGFzcyBjYWNoZWFibGUtcmVhZCBldmVudHMgb24gaGFzTWFueSByZWxhdGlvbnNoaXBzIHRvIG90aGVyIGRhdGFzdG9yZXMnLCAoKSA9PiB7XG4gICAgICAgIGxldCB0ZXN0UGx1bXA7XG4gICAgICAgIGxldCB0ZXN0SXRlbTtcbiAgICAgICAgbGV0IG1lbXN0b3JlO1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIHtcbiAgICAgICAgICBuYW1lOiAncG90YXRvJyxcbiAgICAgICAgfSkudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHRlc3RJdGVtID0gY3JlYXRlZE9iamVjdDtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIHRlc3RJdGVtLmlkKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgICAgICB9KS50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgdGVzdEl0ZW0uaWQsICdsaWtlcnMnLCAxMDApKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgbWVtc3RvcmUgPSBuZXcgTWVtb3J5U3RvcmFnZSgpO1xuICAgICAgICAgIHRlc3RQbHVtcCA9IG5ldyBQbHVtcCh7XG4gICAgICAgICAgICBzdG9yYWdlOiBbbWVtc3RvcmUsIGFjdHVhbFN0b3JlXSxcbiAgICAgICAgICAgIHR5cGVzOiBbVGVzdFR5cGVdLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBleHBlY3QobWVtc3RvcmUucmVhZChUZXN0VHlwZSwgdGVzdEl0ZW0uaWQpKS50by5ldmVudHVhbGx5LmJlLm51bGw7XG4gICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCB0ZXN0SXRlbS5pZCwgJ2xpa2VycycpO1xuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KG1lbXN0b3JlLnJlYWQoVGVzdFR5cGUsIHRlc3RJdGVtLmlkLCAnbGlrZXJzJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICBsaWtlcnM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcmVudF9pZDogMTAwLFxuICAgICAgICAgICAgICAgIGNoaWxkX2lkOiB0ZXN0SXRlbS5pZCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4gdGVzdFBsdW1wLnRlYXJkb3duKCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBhZnRlcigoKSA9PiB7XG4gICAgICByZXR1cm4gKHN0b3JlLmFmdGVyIHx8ICgoKSA9PiB7fSkpKGFjdHVhbFN0b3JlKTtcbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdfQ==
