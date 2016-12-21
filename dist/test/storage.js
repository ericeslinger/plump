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

    after(function () {
      return (store.after || function () {})(actualStore);
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3Qvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJwZyIsIlJlZGlzIiwicnVuU1FMIiwiY29tbWFuZCIsIm9wdHMiLCJjb25uT3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInVzZXIiLCJob3N0IiwicG9ydCIsImRhdGFiYXNlIiwiY2hhcnNldCIsImNsaWVudCIsIkNsaWVudCIsInJlc29sdmUiLCJjb25uZWN0IiwiZXJyIiwicXVlcnkiLCJlbmQiLCJmbHVzaFJlZGlzIiwiciIsImNyZWF0ZUNsaWVudCIsImRiIiwiZmx1c2hkYiIsInF1aXQiLCJzdG9yYWdlVHlwZXMiLCJuYW1lIiwiY29uc3RydWN0b3IiLCJ0ZXJtaW5hbCIsImJlZm9yZSIsImFmdGVyIiwiZHJpdmVyIiwidGhlbiIsInRlYXJkb3duIiwic3FsIiwiY29ubmVjdGlvbiIsImF4aW9zIiwibW9ja3VwIiwic2FtcGxlT2JqZWN0IiwiZXh0ZW5kZWQiLCJhY3R1YWwiLCJvdGhlclZhbHVlIiwidXNlIiwiZXhwZWN0IiwiZm9yRWFjaCIsInN0b3JlIiwiZGVzY3JpYmUiLCJhY3R1YWxTdG9yZSIsIml0Iiwid3JpdGUiLCJjcmVhdGVkT2JqZWN0IiwicmVhZCIsImlkIiwidG8iLCJldmVudHVhbGx5IiwiZGVlcCIsImVxdWFsIiwiJGlkIiwibW9kT2JqZWN0IiwidXBkYXRlZE9iamVjdCIsImRlbGV0ZSIsImFkZCIsImxpa2VycyIsInBhcmVudF9pZCIsImNoaWxkX2lkIiwiYWdyZWVycyIsImNoaWxkcmVuIiwicGFyZW50cyIsInBlcm0iLCJ2YWxlbmNlQ2hpbGRyZW4iLCJtb2RpZnlSZWxhdGlvbnNoaXAiLCJyZW1vdmUiLCJxdWVyeUNoaWxkcmVuIl0sIm1hcHBpbmdzIjoiOztBQUdBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0lBQVlBLEU7O0FBQ1o7O0lBQVlDLEs7Ozs7OztrTkFWWjtBQUNBOztBQVdBLFNBQVNDLE1BQVQsQ0FBZ0JDLE9BQWhC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bnYgbm9kZSwgbW9jaGEqL1xuLyogZXNsaW50IG5vLXNoYWRvdzogMCAqL1xuXG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCB7IE1lbW9yeVN0b3JhZ2UsIFJlZGlzU3RvcmFnZSwgUmVzdFN0b3JhZ2UsIFNRTFN0b3JhZ2UgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgeyBUZXN0VHlwZSB9IGZyb20gJy4vdGVzdFR5cGUnO1xuaW1wb3J0IGF4aW9zTW9jayBmcm9tICcuL2F4aW9zTW9ja2luZyc7XG5pbXBvcnQgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgKiBhcyBwZyBmcm9tICdwZyc7XG5pbXBvcnQgKiBhcyBSZWRpcyBmcm9tICdyZWRpcyc7XG5cbmZ1bmN0aW9uIHJ1blNRTChjb21tYW5kLCBvcHRzID0ge30pIHtcbiAgY29uc3QgY29ubk9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgIHt9LFxuICAgIHtcbiAgICAgIHVzZXI6ICdwb3N0Z3JlcycsXG4gICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgIHBvcnQ6IDU0MzIsXG4gICAgICBkYXRhYmFzZTogJ3Bvc3RncmVzJyxcbiAgICAgIGNoYXJzZXQ6ICd1dGY4JyxcbiAgICB9LFxuICAgIG9wdHNcbiAgKTtcbiAgY29uc3QgY2xpZW50ID0gbmV3IHBnLkNsaWVudChjb25uT3B0aW9ucyk7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIGNsaWVudC5jb25uZWN0KChlcnIpID0+IHtcbiAgICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICAgIGNsaWVudC5xdWVyeShjb21tYW5kLCAoZXJyKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICAgICAgY2xpZW50LmVuZCgoZXJyKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGZsdXNoUmVkaXMoKSB7XG4gIGNvbnN0IHIgPSBSZWRpcy5jcmVhdGVDbGllbnQoe1xuICAgIHBvcnQ6IDYzNzksXG4gICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgZGI6IDAsXG4gIH0pO1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICByLmZsdXNoZGIoKGVycikgPT4ge1xuICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgci5xdWl0KChlcnIpID0+IHtcbiAgICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmNvbnN0IHN0b3JhZ2VUeXBlcyA9IFtcbiAge1xuICAgIG5hbWU6ICdyZWRpcycsXG4gICAgY29uc3RydWN0b3I6IFJlZGlzU3RvcmFnZSxcbiAgICBvcHRzOiB7XG4gICAgICB0ZXJtaW5hbDogdHJ1ZSxcbiAgICB9LFxuICAgIGJlZm9yZTogKCkgPT4ge1xuICAgICAgcmV0dXJuIGZsdXNoUmVkaXMoKTtcbiAgICB9LFxuICAgIGFmdGVyOiAoZHJpdmVyKSA9PiB7XG4gICAgICAvLyByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiBkcml2ZXIudGVhcmRvd24oKSk7XG4gICAgICByZXR1cm4gZmx1c2hSZWRpcygpLnRoZW4oKCkgPT4gZHJpdmVyLnRlYXJkb3duKCkpO1xuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnc3FsJyxcbiAgICBjb25zdHJ1Y3RvcjogU1FMU3RvcmFnZSxcbiAgICBvcHRzOiB7XG4gICAgICBzcWw6IHtcbiAgICAgICAgY29ubmVjdGlvbjoge1xuICAgICAgICAgIGRhdGFiYXNlOiAncGx1bXBfdGVzdCcsXG4gICAgICAgICAgdXNlcjogJ3Bvc3RncmVzJyxcbiAgICAgICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgICAgICBwb3J0OiA1NDMyLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHRlcm1pbmFsOiB0cnVlLFxuICAgIH0sXG4gICAgYmVmb3JlOiAoKSA9PiB7XG4gICAgICByZXR1cm4gcnVuU1FMKCdEUk9QIERBVEFCQVNFIGlmIGV4aXN0cyBwbHVtcF90ZXN0OycpXG4gICAgICAudGhlbigoKSA9PiBydW5TUUwoJ0NSRUFURSBEQVRBQkFTRSBwbHVtcF90ZXN0OycpKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gcnVuU1FMKGBcbiAgICAgICAgICBDUkVBVEUgU0VRVUVOQ0UgdGVzdGlkX3NlcVxuICAgICAgICAgICAgU1RBUlQgV0lUSCAxXG4gICAgICAgICAgICBJTkNSRU1FTlQgQlkgMVxuICAgICAgICAgICAgTk8gTUlOVkFMVUVcbiAgICAgICAgICAgIE1BWFZBTFVFIDIxNDc0ODM2NDdcbiAgICAgICAgICAgIENBQ0hFIDFcbiAgICAgICAgICAgIENZQ0xFO1xuICAgICAgICAgIENSRUFURSBUQUJMRSB0ZXN0cyAoXG4gICAgICAgICAgICBpZCBpbnRlZ2VyIG5vdCBudWxsIHByaW1hcnkga2V5IERFRkFVTFQgbmV4dHZhbCgndGVzdGlkX3NlcSc6OnJlZ2NsYXNzKSxcbiAgICAgICAgICAgIG5hbWUgdGV4dCxcbiAgICAgICAgICAgIGV4dGVuZGVkIGpzb25iIG5vdCBudWxsIGRlZmF1bHQgJ3t9Jzo6anNvbmJcbiAgICAgICAgICApO1xuICAgICAgICAgIENSRUFURSBUQUJMRSBjaGlsZHJlbiAocGFyZW50X2lkIGludGVnZXIgbm90IG51bGwsIGNoaWxkX2lkIGludGVnZXIgbm90IG51bGwpO1xuICAgICAgICAgIENSRUFURSBVTklRVUUgSU5ERVggY2hpbGRyZW5fam9pbiBvbiBjaGlsZHJlbiAocGFyZW50X2lkLCBjaGlsZF9pZCk7XG4gICAgICAgICAgQ1JFQVRFIFRBQkxFIHJlYWN0aW9ucyAocGFyZW50X2lkIGludGVnZXIgbm90IG51bGwsIGNoaWxkX2lkIGludGVnZXIgbm90IG51bGwsIHJlYWN0aW9uIHRleHQgbm90IG51bGwpO1xuICAgICAgICAgIENSRUFURSBVTklRVUUgSU5ERVggcmVhY3Rpb25zX2pvaW4gb24gcmVhY3Rpb25zIChwYXJlbnRfaWQsIGNoaWxkX2lkLCByZWFjdGlvbik7XG4gICAgICAgICAgQ1JFQVRFIFRBQkxFIHZhbGVuY2VfY2hpbGRyZW4gKHBhcmVudF9pZCBpbnRlZ2VyIG5vdCBudWxsLCBjaGlsZF9pZCBpbnRlZ2VyIG5vdCBudWxsLCBwZXJtIGludGVnZXIgbm90IG51bGwpO1xuICAgICAgICAgIC0tQ1JFQVRFIFVOSVFVRSBJTkRFWCB2YWxlbmNlX2NoaWxkcmVuX2pvaW4gb24gdmFsZW5jZV9jaGlsZHJlbiAocGFyZW50X2lkLCBjaGlsZF9pZCk7XG4gICAgICAgIGAsIHsgZGF0YWJhc2U6ICdwbHVtcF90ZXN0JyB9KTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgYWZ0ZXI6IChkcml2ZXIpID0+IHtcbiAgICAgIHJldHVybiBkcml2ZXIudGVhcmRvd24oKVxuICAgICAgLnRoZW4oKCkgPT4gcnVuU1FMKCdEUk9QIERBVEFCQVNFIHBsdW1wX3Rlc3Q7JykpO1xuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAncmVzdCcsXG4gICAgY29uc3RydWN0b3I6IFJlc3RTdG9yYWdlLFxuICAgIG9wdHM6IHtcbiAgICAgIHRlcm1pbmFsOiB0cnVlLFxuICAgICAgYXhpb3M6IGF4aW9zTW9jay5tb2NrdXAoVGVzdFR5cGUpLFxuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnbWVtb3J5JyxcbiAgICBjb25zdHJ1Y3RvcjogTWVtb3J5U3RvcmFnZSxcbiAgICBvcHRzOiB7IHRlcm1pbmFsOiB0cnVlIH0sXG4gIH0sXG5dO1xuXG5jb25zdCBzYW1wbGVPYmplY3QgPSB7XG4gIG5hbWU6ICdwb3RhdG8nLFxuICBleHRlbmRlZDoge1xuICAgIGFjdHVhbDogJ3J1dGFiYWdhJyxcbiAgICBvdGhlclZhbHVlOiA0MixcbiAgfSxcbn07XG5cbmNoYWkudXNlKGNoYWlBc1Byb21pc2VkKTtcbmNvbnN0IGV4cGVjdCA9IGNoYWkuZXhwZWN0O1xuXG5zdG9yYWdlVHlwZXMuZm9yRWFjaCgoc3RvcmUpID0+IHtcbiAgZGVzY3JpYmUoc3RvcmUubmFtZSwgKCkgPT4ge1xuICAgIGxldCBhY3R1YWxTdG9yZTtcbiAgICBiZWZvcmUoKCkgPT4ge1xuICAgICAgcmV0dXJuIChzdG9yZS5iZWZvcmUgfHwgKCgpID0+IFByb21pc2UucmVzb2x2ZSgpKSkoYWN0dWFsU3RvcmUpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIGFjdHVhbFN0b3JlID0gbmV3IHN0b3JlLmNvbnN0cnVjdG9yKHN0b3JlLm9wdHMpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc3VwcG9ydHMgY3JlYXRpbmcgdmFsdWVzIHdpdGggbm8gaWQgZmllbGQsIGFuZCByZXRyaWV2aW5nIHZhbHVlcycsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChPYmplY3QuYXNzaWduKHt9LCBzYW1wbGVPYmplY3QsIHsgW1Rlc3RUeXBlLiRpZF06IGNyZWF0ZWRPYmplY3QuaWQgfSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnYWxsb3dzIG9iamVjdHMgdG8gYmUgc3RvcmVkIGJ5IGlkJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICBjb25zdCBtb2RPYmplY3QgPSBPYmplY3QuYXNzaWduKHt9LCBjcmVhdGVkT2JqZWN0LCB7IG5hbWU6ICdjYXJyb3QnIH0pO1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIG1vZE9iamVjdClcbiAgICAgICAgLnRoZW4oKHVwZGF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIHVwZGF0ZWRPYmplY3QuaWQpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoT2JqZWN0LmFzc2lnbihcbiAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgc2FtcGxlT2JqZWN0LFxuICAgICAgICAgICAgeyBbVGVzdFR5cGUuJGlkXTogY3JlYXRlZE9iamVjdC5pZCwgbmFtZTogJ2NhcnJvdCcgfVxuICAgICAgICAgICkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2FsbG93cyBmb3IgZGVsZXRpb24gb2Ygb2JqZWN0cyBieSBpZCcsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChPYmplY3QuYXNzaWduKHt9LCBzYW1wbGVPYmplY3QsIHsgW1Rlc3RUeXBlLiRpZF06IGNyZWF0ZWRPYmplY3QuaWQgfSkpXG4gICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmRlbGV0ZShUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCkpXG4gICAgICAgIC50aGVuKCgpID0+IGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKG51bGwpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2hhbmRsZXMgcmVsYXRpb25zaGlwcyB3aXRoIHJlc3RyaWN0aW9ucycsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2xpa2VycycsIDEwMClcbiAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnbGlrZXJzJywgMTAxKSlcbiAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnYWdyZWVycycsIDEwMCkpXG4gICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2FncmVlcnMnLCAxMDEpKVxuICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdhZ3JlZXJzJywgMTAyKSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2xpa2VycycpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgbGlrZXJzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICBjaGlsZF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcmVudF9pZDogMTAxLFxuICAgICAgICAgICAgICAgIGNoaWxkX2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2FncmVlcnMnKSlcbiAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgIGFncmVlcnM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcmVudF9pZDogMTAwLFxuICAgICAgICAgICAgICAgIGNoaWxkX2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFyZW50X2lkOiAxMDEsXG4gICAgICAgICAgICAgICAgY2hpbGRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IDEwMixcbiAgICAgICAgICAgICAgICBjaGlsZF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnY2FuIGFkZCB0byBhIGhhc01hbnkgcmVsYXRpb25zaGlwJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDApXG4gICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMTAxKSlcbiAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDIpKVxuICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMykpXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMSxcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAyLFxuICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDMsXG4gICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCAxMDAsICdwYXJlbnRzJykpXG4gICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICBwYXJlbnRzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnY2FuIGFkZCB0byBhIGhhc01hbnkgcmVsYXRpb25zaGlwIHdpdGggZXh0cmFzJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7IHBlcm06IDEgfSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgdmFsZW5jZUNoaWxkcmVuOiBbe1xuICAgICAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgIHBlcm06IDEsXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW4gbW9kaWZ5IHZhbGVuY2Ugb24gYSBoYXNNYW55IHJlbGF0aW9uc2hpcCcsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3ZhbGVuY2VDaGlsZHJlbicsIDEwMCwgeyBwZXJtOiAxIH0pXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgIHZhbGVuY2VDaGlsZHJlbjogW3tcbiAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICBwZXJtOiAxLFxuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUubW9kaWZ5UmVsYXRpb25zaGlwKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7IHBlcm06IDIgfSkpXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgIHZhbGVuY2VDaGlsZHJlbjogW3tcbiAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICBwZXJtOiAyLFxuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnY2FuIHJlbW92ZSBmcm9tIGEgaGFzTWFueSByZWxhdGlvbnNoaXAnLCAoKSA9PiB7XG4gICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMClcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJykpXG4gICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICBjaGlsZHJlbjogW3tcbiAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLnJlbW92ZShUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJykpXG4gICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IGNoaWxkcmVuOiBbXSB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzdXBwb3J0cyBxdWVyaWVzIGluIGhhc01hbnkgcmVsYXRpb25zaGlwcycsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3F1ZXJ5Q2hpbGRyZW4nLCAxMDEsIHsgcGVybTogMSB9KVxuICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdxdWVyeUNoaWxkcmVuJywgMTAyLCB7IHBlcm06IDIgfSkpXG4gICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3F1ZXJ5Q2hpbGRyZW4nLCAxMDMsIHsgcGVybTogMyB9KSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3F1ZXJ5Q2hpbGRyZW4nKSlcbiAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgIHF1ZXJ5Q2hpbGRyZW46IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDIsXG4gICAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICAgIHBlcm06IDIsXG4gICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAzLFxuICAgICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgICBwZXJtOiAzLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGFmdGVyKCgpID0+IHtcbiAgICAgIHJldHVybiAoc3RvcmUuYWZ0ZXIgfHwgKCgpID0+IHt9KSkoYWN0dWFsU3RvcmUpO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19
