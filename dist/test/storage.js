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
/* eslint no-shadow: 0, no-unused-vars: "off", max-len: 0 */

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

var storageTypes = [
// {
//   name: 'redis',
//   constructor: RedisStorage,
//   opts: {
//     terminal: true,
//   },
//   before: () => {
//     return flushRedis();
//   },
//   after: (driver) => {
//     // return Promise.resolve().then(() => driver.teardown());
//     return flushRedis().then(() => driver.teardown());
//   },
// },
// {
//   name: 'sql',
//   constructor: SQLStorage,
//   opts: {
//     sql: {
//       connection: {
//         database: 'plump_test',
//         user: 'postgres',
//         host: 'localhost',
//         port: 5432,
//       },
//     },
//     terminal: true,
//   },
//   before: () => {
//     return runSQL('DROP DATABASE if exists plump_test;')
//     .then(() => runSQL('CREATE DATABASE plump_test;'))
//     .then(() => {
//       return runSQL(`
//         CREATE SEQUENCE testid_seq
//           START WITH 1
//           INCREMENT BY 1
//           NO MINVALUE
//           MAXVALUE 2147483647
//           CACHE 1
//           CYCLE;
//         CREATE TABLE tests (
//           id integer not null primary key DEFAULT nextval('testid_seq'::regclass),
//           name text,
//           extended jsonb not null default '{}'::jsonb
//         );
//         CREATE TABLE parent_child_relationship (parent_id integer not null, child_id integer not null);
//         CREATE UNIQUE INDEX children_join on parent_child_relationship (parent_id, child_id);
//         CREATE TABLE reactions (parent_id integer not null, child_id integer not null, reaction text not null);
//         CREATE UNIQUE INDEX reactions_join on reactions (parent_id, child_id, reaction);
//         CREATE TABLE valence_children (parent_id integer not null, child_id integer not null, perm integer not null);
//         --CREATE UNIQUE INDEX valence_children_join on valence_children (parent_id, child_id);
//       `, { database: 'plump_test' });
//     });
//   },
//   after: (driver) => {
//     return driver.teardown()
//     .then(() => runSQL('DROP DATABASE plump_test;'));
//   },
// },
{
  name: 'rest',
  constructor: _index.RestStorage,
  opts: {
    terminal: true,
    axios: _axiosMocking2.default.mockup(_testType.TestType)
  }
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3Qvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJwZyIsIlJlZGlzIiwicnVuU1FMIiwiY29tbWFuZCIsIm9wdHMiLCJjb25uT3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInVzZXIiLCJob3N0IiwicG9ydCIsImRhdGFiYXNlIiwiY2hhcnNldCIsImNsaWVudCIsIkNsaWVudCIsInJlc29sdmUiLCJjb25uZWN0IiwiZXJyIiwicXVlcnkiLCJlbmQiLCJmbHVzaFJlZGlzIiwiciIsImNyZWF0ZUNsaWVudCIsImRiIiwiZmx1c2hkYiIsInF1aXQiLCJzdG9yYWdlVHlwZXMiLCJuYW1lIiwiY29uc3RydWN0b3IiLCJ0ZXJtaW5hbCIsImF4aW9zIiwibW9ja3VwIiwic2FtcGxlT2JqZWN0IiwiZXh0ZW5kZWQiLCJhY3R1YWwiLCJvdGhlclZhbHVlIiwidXNlIiwiZXhwZWN0IiwiZm9yRWFjaCIsInN0b3JlIiwiZGVzY3JpYmUiLCJhY3R1YWxTdG9yZSIsImJlZm9yZSIsInRoZW4iLCJpdCIsIndyaXRlIiwiY3JlYXRlZE9iamVjdCIsInJlYWQiLCJpZCIsInRvIiwiZXZlbnR1YWxseSIsImRlZXAiLCJlcXVhbCIsIiRpZCIsIm1vZE9iamVjdCIsInVwZGF0ZWRPYmplY3QiLCJkZWxldGUiLCJhZGQiLCJsaWtlcnMiLCJwYXJlbnRfaWQiLCJjaGlsZF9pZCIsImFncmVlcnMiLCJjaGlsZHJlbiIsInBhcmVudHMiLCJwZXJtIiwidmFsZW5jZUNoaWxkcmVuIiwibW9kaWZ5UmVsYXRpb25zaGlwIiwicmVtb3ZlIiwicXVlcnlDaGlsZHJlbiIsIm1lbXN0b3JlIiwidGVzdFBsdW1wIiwic3RvcmFnZSIsInR5cGVzIiwiaGF2ZSIsInByb3BlcnR5IiwiZmluYWxseSIsInRlYXJkb3duIiwidGVzdEl0ZW0iLCJiZSIsIm51bGwiLCJhZnRlciJdLCJtYXBwaW5ncyI6Ijs7QUFHQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztJQUFZ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ckIsYUFETTtBQUQ2RSxXQUFoRixDQUFQO0FBUUQsU0F4Qk0sRUF3QkoyQixPQXhCSSxDQXdCSTtBQUFBLGlCQUFNTCxVQUFVTSxRQUFWLEVBQU47QUFBQSxTQXhCSixDQUFQO0FBeUJELE9BN0JEO0FBOEJELEtBN0ZEOztBQStGQUksVUFBTSxZQUFNO0FBQ1YsYUFBTyxDQUFDekMsTUFBTXlDLEtBQU4sSUFBZ0IsWUFBTSxDQUFFLENBQXpCLEVBQTRCdkMsV0FBNUIsQ0FBUDtBQUNELEtBRkQ7QUFHRCxHQTNXRDtBQTRXRCxDQTdXRCIsImZpbGUiOiJ0ZXN0L3N0b3JhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZW52IG5vZGUsIG1vY2hhKi9cbi8qIGVzbGludCBuby1zaGFkb3c6IDAsIG5vLXVudXNlZC12YXJzOiBcIm9mZlwiLCBtYXgtbGVuOiAwICovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IHsgTWVtb3J5U3RvcmFnZSwgUmVkaXNTdG9yYWdlLCBSZXN0U3RvcmFnZSwgU1FMU3RvcmFnZSwgUGx1bXAsICRzZWxmIH0gZnJvbSAnLi4vaW5kZXgnO1xuaW1wb3J0IHsgVGVzdFR5cGUgfSBmcm9tICcuL3Rlc3RUeXBlJztcbmltcG9ydCBheGlvc01vY2sgZnJvbSAnLi9heGlvc01vY2tpbmcnO1xuaW1wb3J0IFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0ICogYXMgcGcgZnJvbSAncGcnO1xuaW1wb3J0ICogYXMgUmVkaXMgZnJvbSAncmVkaXMnO1xuXG5mdW5jdGlvbiBydW5TUUwoY29tbWFuZCwgb3B0cyA9IHt9KSB7XG4gIGNvbnN0IGNvbm5PcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICB7fSxcbiAgICB7XG4gICAgICB1c2VyOiAncG9zdGdyZXMnLFxuICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgICBwb3J0OiA1NDMyLFxuICAgICAgZGF0YWJhc2U6ICdwb3N0Z3JlcycsXG4gICAgICBjaGFyc2V0OiAndXRmOCcsXG4gICAgfSxcbiAgICBvcHRzXG4gICk7XG4gIGNvbnN0IGNsaWVudCA9IG5ldyBwZy5DbGllbnQoY29ubk9wdGlvbnMpO1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICBjbGllbnQuY29ubmVjdCgoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICBjbGllbnQucXVlcnkoY29tbWFuZCwgKGVycikgPT4ge1xuICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICAgIGNsaWVudC5lbmQoKGVycikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBmbHVzaFJlZGlzKCkge1xuICBjb25zdCByID0gUmVkaXMuY3JlYXRlQ2xpZW50KHtcbiAgICBwb3J0OiA2Mzc5LFxuICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgIGRiOiAwLFxuICB9KTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgci5mbHVzaGRiKChlcnIpID0+IHtcbiAgICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICAgIHIucXVpdCgoZXJyKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5jb25zdCBzdG9yYWdlVHlwZXMgPSBbXG4gIC8vIHtcbiAgLy8gICBuYW1lOiAncmVkaXMnLFxuICAvLyAgIGNvbnN0cnVjdG9yOiBSZWRpc1N0b3JhZ2UsXG4gIC8vICAgb3B0czoge1xuICAvLyAgICAgdGVybWluYWw6IHRydWUsXG4gIC8vICAgfSxcbiAgLy8gICBiZWZvcmU6ICgpID0+IHtcbiAgLy8gICAgIHJldHVybiBmbHVzaFJlZGlzKCk7XG4gIC8vICAgfSxcbiAgLy8gICBhZnRlcjogKGRyaXZlcikgPT4ge1xuICAvLyAgICAgLy8gcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4gZHJpdmVyLnRlYXJkb3duKCkpO1xuICAvLyAgICAgcmV0dXJuIGZsdXNoUmVkaXMoKS50aGVuKCgpID0+IGRyaXZlci50ZWFyZG93bigpKTtcbiAgLy8gICB9LFxuICAvLyB9LFxuICAvLyB7XG4gIC8vICAgbmFtZTogJ3NxbCcsXG4gIC8vICAgY29uc3RydWN0b3I6IFNRTFN0b3JhZ2UsXG4gIC8vICAgb3B0czoge1xuICAvLyAgICAgc3FsOiB7XG4gIC8vICAgICAgIGNvbm5lY3Rpb246IHtcbiAgLy8gICAgICAgICBkYXRhYmFzZTogJ3BsdW1wX3Rlc3QnLFxuICAvLyAgICAgICAgIHVzZXI6ICdwb3N0Z3JlcycsXG4gIC8vICAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gIC8vICAgICAgICAgcG9ydDogNTQzMixcbiAgLy8gICAgICAgfSxcbiAgLy8gICAgIH0sXG4gIC8vICAgICB0ZXJtaW5hbDogdHJ1ZSxcbiAgLy8gICB9LFxuICAvLyAgIGJlZm9yZTogKCkgPT4ge1xuICAvLyAgICAgcmV0dXJuIHJ1blNRTCgnRFJPUCBEQVRBQkFTRSBpZiBleGlzdHMgcGx1bXBfdGVzdDsnKVxuICAvLyAgICAgLnRoZW4oKCkgPT4gcnVuU1FMKCdDUkVBVEUgREFUQUJBU0UgcGx1bXBfdGVzdDsnKSlcbiAgLy8gICAgIC50aGVuKCgpID0+IHtcbiAgLy8gICAgICAgcmV0dXJuIHJ1blNRTChgXG4gIC8vICAgICAgICAgQ1JFQVRFIFNFUVVFTkNFIHRlc3RpZF9zZXFcbiAgLy8gICAgICAgICAgIFNUQVJUIFdJVEggMVxuICAvLyAgICAgICAgICAgSU5DUkVNRU5UIEJZIDFcbiAgLy8gICAgICAgICAgIE5PIE1JTlZBTFVFXG4gIC8vICAgICAgICAgICBNQVhWQUxVRSAyMTQ3NDgzNjQ3XG4gIC8vICAgICAgICAgICBDQUNIRSAxXG4gIC8vICAgICAgICAgICBDWUNMRTtcbiAgLy8gICAgICAgICBDUkVBVEUgVEFCTEUgdGVzdHMgKFxuICAvLyAgICAgICAgICAgaWQgaW50ZWdlciBub3QgbnVsbCBwcmltYXJ5IGtleSBERUZBVUxUIG5leHR2YWwoJ3Rlc3RpZF9zZXEnOjpyZWdjbGFzcyksXG4gIC8vICAgICAgICAgICBuYW1lIHRleHQsXG4gIC8vICAgICAgICAgICBleHRlbmRlZCBqc29uYiBub3QgbnVsbCBkZWZhdWx0ICd7fSc6Ompzb25iXG4gIC8vICAgICAgICAgKTtcbiAgLy8gICAgICAgICBDUkVBVEUgVEFCTEUgcGFyZW50X2NoaWxkX3JlbGF0aW9uc2hpcCAocGFyZW50X2lkIGludGVnZXIgbm90IG51bGwsIGNoaWxkX2lkIGludGVnZXIgbm90IG51bGwpO1xuICAvLyAgICAgICAgIENSRUFURSBVTklRVUUgSU5ERVggY2hpbGRyZW5fam9pbiBvbiBwYXJlbnRfY2hpbGRfcmVsYXRpb25zaGlwIChwYXJlbnRfaWQsIGNoaWxkX2lkKTtcbiAgLy8gICAgICAgICBDUkVBVEUgVEFCTEUgcmVhY3Rpb25zIChwYXJlbnRfaWQgaW50ZWdlciBub3QgbnVsbCwgY2hpbGRfaWQgaW50ZWdlciBub3QgbnVsbCwgcmVhY3Rpb24gdGV4dCBub3QgbnVsbCk7XG4gIC8vICAgICAgICAgQ1JFQVRFIFVOSVFVRSBJTkRFWCByZWFjdGlvbnNfam9pbiBvbiByZWFjdGlvbnMgKHBhcmVudF9pZCwgY2hpbGRfaWQsIHJlYWN0aW9uKTtcbiAgLy8gICAgICAgICBDUkVBVEUgVEFCTEUgdmFsZW5jZV9jaGlsZHJlbiAocGFyZW50X2lkIGludGVnZXIgbm90IG51bGwsIGNoaWxkX2lkIGludGVnZXIgbm90IG51bGwsIHBlcm0gaW50ZWdlciBub3QgbnVsbCk7XG4gIC8vICAgICAgICAgLS1DUkVBVEUgVU5JUVVFIElOREVYIHZhbGVuY2VfY2hpbGRyZW5fam9pbiBvbiB2YWxlbmNlX2NoaWxkcmVuIChwYXJlbnRfaWQsIGNoaWxkX2lkKTtcbiAgLy8gICAgICAgYCwgeyBkYXRhYmFzZTogJ3BsdW1wX3Rlc3QnIH0pO1xuICAvLyAgICAgfSk7XG4gIC8vICAgfSxcbiAgLy8gICBhZnRlcjogKGRyaXZlcikgPT4ge1xuICAvLyAgICAgcmV0dXJuIGRyaXZlci50ZWFyZG93bigpXG4gIC8vICAgICAudGhlbigoKSA9PiBydW5TUUwoJ0RST1AgREFUQUJBU0UgcGx1bXBfdGVzdDsnKSk7XG4gIC8vICAgfSxcbiAgLy8gfSxcbiAge1xuICAgIG5hbWU6ICdyZXN0JyxcbiAgICBjb25zdHJ1Y3RvcjogUmVzdFN0b3JhZ2UsXG4gICAgb3B0czoge1xuICAgICAgdGVybWluYWw6IHRydWUsXG4gICAgICBheGlvczogYXhpb3NNb2NrLm1vY2t1cChUZXN0VHlwZSksXG4gICAgfSxcbiAgfSxcbiAgLy8ge1xuICAvLyAgIG5hbWU6ICdtZW1vcnknLFxuICAvLyAgIGNvbnN0cnVjdG9yOiBNZW1vcnlTdG9yYWdlLFxuICAvLyAgIG9wdHM6IHsgdGVybWluYWw6IHRydWUgfSxcbiAgLy8gfSxcbl07XG5cbmNvbnN0IHNhbXBsZU9iamVjdCA9IHtcbiAgbmFtZTogJ3BvdGF0bycsXG4gIGV4dGVuZGVkOiB7XG4gICAgYWN0dWFsOiAncnV0YWJhZ2EnLFxuICAgIG90aGVyVmFsdWU6IDQyLFxuICB9LFxufTtcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbnN0b3JhZ2VUeXBlcy5mb3JFYWNoKChzdG9yZSkgPT4ge1xuICBkZXNjcmliZShzdG9yZS5uYW1lLCAoKSA9PiB7XG4gICAgbGV0IGFjdHVhbFN0b3JlO1xuICAgIGJlZm9yZSgoKSA9PiB7XG4gICAgICByZXR1cm4gKHN0b3JlLmJlZm9yZSB8fCAoKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCkpKShhY3R1YWxTdG9yZSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgYWN0dWFsU3RvcmUgPSBuZXcgc3RvcmUuY29uc3RydWN0b3Ioc3RvcmUub3B0cyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdjb3JlIENSVUQnLCAoKSA9PiB7XG4gICAgICBpdCgnc3VwcG9ydHMgY3JlYXRpbmcgdmFsdWVzIHdpdGggbm8gaWQgZmllbGQsIGFuZCByZXRyaWV2aW5nIHZhbHVlcycsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKSlcbiAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKE9iamVjdC5hc3NpZ24oe30sIHNhbXBsZU9iamVjdCwgeyBbVGVzdFR5cGUuJGlkXTogY3JlYXRlZE9iamVjdC5pZCB9KSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdhbGxvd3Mgb2JqZWN0cyB0byBiZSBzdG9yZWQgYnkgaWQnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIGNvbnN0IG1vZE9iamVjdCA9IE9iamVjdC5hc3NpZ24oe30sIGNyZWF0ZWRPYmplY3QsIHsgbmFtZTogJ2NhcnJvdCcgfSk7XG4gICAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBtb2RPYmplY3QpXG4gICAgICAgICAgLnRoZW4oKHVwZGF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgdXBkYXRlZE9iamVjdC5pZCkpXG4gICAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKE9iamVjdC5hc3NpZ24oXG4gICAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgICBzYW1wbGVPYmplY3QsXG4gICAgICAgICAgICAgIHsgW1Rlc3RUeXBlLiRpZF06IGNyZWF0ZWRPYmplY3QuaWQsIG5hbWU6ICdjYXJyb3QnIH1cbiAgICAgICAgICAgICkpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnYWxsb3dzIGZvciBkZWxldGlvbiBvZiBvYmplY3RzIGJ5IGlkJywgKCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoT2JqZWN0LmFzc2lnbih7fSwgc2FtcGxlT2JqZWN0LCB7IFtUZXN0VHlwZS4kaWRdOiBjcmVhdGVkT2JqZWN0LmlkIH0pKVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmRlbGV0ZShUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwobnVsbCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ3JlbGF0aW9uc2hpcHMnLCAoKSA9PiB7XG4gICAgICBpdCgnaGFuZGxlcyByZWxhdGlvbnNoaXBzIHdpdGggcmVzdHJpY3Rpb25zJywgKCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnbGlrZXJzJywgMTAwKVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2xpa2VycycsIDEwMSkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnYWdyZWVycycsIDEwMCkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnYWdyZWVycycsIDEwMSkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnYWdyZWVycycsIDEwMikpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnbGlrZXJzJykpXG4gICAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgICAgbGlrZXJzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiAxMDAsXG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogMTAxLFxuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnYWdyZWVycycpKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICAgIGFncmVlcnM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiAxMDEsXG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogMTAyLFxuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnY2FuIGZldGNoIGEgYmFzZSBhbmQgaGFzbWFueSBpbiBvbmUgcmVhZCcsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMjAwKVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMjAxKSlcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDIwMikpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAyMDMpKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgWydjaGlsZHJlbicsICRzZWxmXSkpXG4gICAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFxuICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKFxuICAgICAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgICAgIGNyZWF0ZWRPYmplY3QsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAyMDAsXG4gICAgICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDIwMSxcbiAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMjAyLFxuICAgICAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAyMDMsXG4gICAgICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdjYW4gYWRkIHRvIGEgaGFzTWFueSByZWxhdGlvbnNoaXAnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMClcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMSkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDIpKVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMTAzKSlcbiAgICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIDUwMCwgJ2NoaWxkcmVuJywgY3JlYXRlZE9iamVjdC5pZCkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCBbJ2NoaWxkcmVuJ10pKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDEsXG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAyLFxuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMyxcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIDEwMCwgWydwYXJlbnRzJ10pKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICAgIHBhcmVudHM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ2NhbiBhZGQgdG8gYSBoYXNNYW55IHJlbGF0aW9uc2hpcCB3aXRoIGV4dHJhcycsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3ZhbGVuY2VDaGlsZHJlbicsIDEwMCwgeyBwZXJtOiAxIH0pXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgICAgdmFsZW5jZUNoaWxkcmVuOiBbe1xuICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgIHBlcm06IDEsXG4gICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdjYW4gbW9kaWZ5IHZhbGVuY2Ugb24gYSBoYXNNYW55IHJlbGF0aW9uc2hpcCcsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3ZhbGVuY2VDaGlsZHJlbicsIDEwMCwgeyBwZXJtOiAxIH0pXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgICAgdmFsZW5jZUNoaWxkcmVuOiBbe1xuICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgIHBlcm06IDEsXG4gICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSkudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5tb2RpZnlSZWxhdGlvbnNoaXAoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICd2YWxlbmNlQ2hpbGRyZW4nLCAxMDAsIHsgcGVybTogMiB9KSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgICB2YWxlbmNlQ2hpbGRyZW46IFt7XG4gICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgcGVybTogMixcbiAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ2NhbiByZW1vdmUgZnJvbSBhIGhhc01hbnkgcmVsYXRpb25zaGlwJywgKCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDApXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nKSlcbiAgICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgICBjaGlsZHJlbjogW3tcbiAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLnJlbW92ZShUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicpKVxuICAgICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IGNoaWxkcmVuOiBbXSB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3N1cHBvcnRzIHF1ZXJpZXMgaW4gaGFzTWFueSByZWxhdGlvbnNoaXBzJywgKCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAncXVlcnlDaGlsZHJlbicsIDEwMSwgeyBwZXJtOiAxIH0pXG4gICAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAncXVlcnlDaGlsZHJlbicsIDEwMiwgeyBwZXJtOiAyIH0pKVxuICAgICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3F1ZXJ5Q2hpbGRyZW4nLCAxMDMsIHsgcGVybTogMyB9KSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdxdWVyeUNoaWxkcmVuJykpXG4gICAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgICAgcXVlcnlDaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDIsXG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgICBwZXJtOiAyLFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDMsXG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgICAgICBwZXJtOiAzLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdldmVudHMnLCAoKSA9PiB7XG4gICAgICBpdCgnc2hvdWxkIHBhc3MgYmFzaWMgY2FjaGVhYmxlLXdyaXRlIGV2ZW50cyB0byBvdGhlciBkYXRhc3RvcmVzJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBtZW1zdG9yZSA9IG5ldyBNZW1vcnlTdG9yYWdlKCk7XG4gICAgICAgIGNvbnN0IHRlc3RQbHVtcCA9IG5ldyBQbHVtcCh7XG4gICAgICAgICAgc3RvcmFnZTogW21lbXN0b3JlLCBhY3R1YWxTdG9yZV0sXG4gICAgICAgICAgdHlwZXM6IFtUZXN0VHlwZV0sXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIHtcbiAgICAgICAgICBuYW1lOiAncG90YXRvJyxcbiAgICAgICAgfSkudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHJldHVybiBleHBlY3QobWVtc3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRlc3RQbHVtcC50ZWFyZG93bigpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIHBhc3MgYmFzaWMgY2FjaGVhYmxlLXJlYWQgZXZlbnRzIHVwIHRoZSBzdGFjaycsICgpID0+IHtcbiAgICAgICAgbGV0IHRlc3RQbHVtcDtcbiAgICAgICAgbGV0IHRlc3RJdGVtO1xuICAgICAgICBsZXQgbWVtc3RvcmU7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwge1xuICAgICAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgICAgICB9KS50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgdGVzdEl0ZW0gPSBjcmVhdGVkT2JqZWN0O1xuICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgdGVzdEl0ZW0uaWQpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIG1lbXN0b3JlID0gbmV3IE1lbW9yeVN0b3JhZ2UoKTtcbiAgICAgICAgICB0ZXN0UGx1bXAgPSBuZXcgUGx1bXAoe1xuICAgICAgICAgICAgc3RvcmFnZTogW21lbXN0b3JlLCBhY3R1YWxTdG9yZV0sXG4gICAgICAgICAgICB0eXBlczogW1Rlc3RUeXBlXSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KG1lbXN0b3JlLnJlYWQoVGVzdFR5cGUsIHRlc3RJdGVtLmlkKSkudG8uZXZlbnR1YWxseS5iZS5udWxsO1xuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgdGVzdEl0ZW0uaWQpO1xuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KG1lbXN0b3JlLnJlYWQoVGVzdFR5cGUsIHRlc3RJdGVtLmlkKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHRlc3RQbHVtcC50ZWFyZG93bigpKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIHBhc3MgY2FjaGVhYmxlLXdyaXRlIGV2ZW50cyBvbiBoYXNNYW55IHJlbGF0aW9uc2hpcHMgdG8gb3RoZXIgZGF0YXN0b3JlcycsICgpID0+IHtcbiAgICAgICAgbGV0IHRlc3RJdGVtO1xuICAgICAgICBjb25zdCBtZW1zdG9yZSA9IG5ldyBNZW1vcnlTdG9yYWdlKCk7XG4gICAgICAgIGNvbnN0IHRlc3RQbHVtcCA9IG5ldyBQbHVtcCh7XG4gICAgICAgICAgc3RvcmFnZTogW21lbXN0b3JlLCBhY3R1YWxTdG9yZV0sXG4gICAgICAgICAgdHlwZXM6IFtUZXN0VHlwZV0sXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIHtcbiAgICAgICAgICBuYW1lOiAncG90YXRvJyxcbiAgICAgICAgfSkudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHRlc3RJdGVtID0gY3JlYXRlZE9iamVjdDtcbiAgICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCB0ZXN0SXRlbS5pZCwgJ2xpa2VycycsIDEwMCk7XG4gICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBleHBlY3QobWVtc3RvcmUucmVhZChUZXN0VHlwZSwgdGVzdEl0ZW0uaWQsICdsaWtlcnMnKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgIGxpa2VyczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFyZW50X2lkOiAxMDAsXG4gICAgICAgICAgICAgICAgY2hpbGRfaWQ6IHRlc3RJdGVtLmlkLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSkuZmluYWxseSgoKSA9PiB0ZXN0UGx1bXAudGVhcmRvd24oKSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBwYXNzIGNhY2hlYWJsZS1yZWFkIGV2ZW50cyBvbiBoYXNNYW55IHJlbGF0aW9uc2hpcHMgdG8gb3RoZXIgZGF0YXN0b3JlcycsICgpID0+IHtcbiAgICAgICAgbGV0IHRlc3RQbHVtcDtcbiAgICAgICAgbGV0IHRlc3RJdGVtO1xuICAgICAgICBsZXQgbWVtc3RvcmU7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwge1xuICAgICAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgICAgICB9KS50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgdGVzdEl0ZW0gPSBjcmVhdGVkT2JqZWN0O1xuICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgdGVzdEl0ZW0uaWQpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgICAgIH0pLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCB0ZXN0SXRlbS5pZCwgJ2xpa2VycycsIDEwMCkpXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICBtZW1zdG9yZSA9IG5ldyBNZW1vcnlTdG9yYWdlKCk7XG4gICAgICAgICAgdGVzdFBsdW1wID0gbmV3IFBsdW1wKHtcbiAgICAgICAgICAgIHN0b3JhZ2U6IFttZW1zdG9yZSwgYWN0dWFsU3RvcmVdLFxuICAgICAgICAgICAgdHlwZXM6IFtUZXN0VHlwZV0sXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChtZW1zdG9yZS5yZWFkKFRlc3RUeXBlLCB0ZXN0SXRlbS5pZCkpLnRvLmV2ZW50dWFsbHkuYmUubnVsbDtcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIHRlc3RJdGVtLmlkLCAnbGlrZXJzJyk7XG4gICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBleHBlY3QobWVtc3RvcmUucmVhZChUZXN0VHlwZSwgdGVzdEl0ZW0uaWQsICdsaWtlcnMnKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgIGxpa2VyczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFyZW50X2lkOiAxMDAsXG4gICAgICAgICAgICAgICAgY2hpbGRfaWQ6IHRlc3RJdGVtLmlkLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSkuZmluYWxseSgoKSA9PiB0ZXN0UGx1bXAudGVhcmRvd24oKSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGFmdGVyKCgpID0+IHtcbiAgICAgIHJldHVybiAoc3RvcmUuYWZ0ZXIgfHwgKCgpID0+IHt9KSkoYWN0dWFsU3RvcmUpO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19
