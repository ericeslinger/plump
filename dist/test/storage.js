'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _memory = require('../storage/memory');

var _redis = require('../storage/redis');

var _rest = require('../storage/rest');

var _sql = require('../storage/sql');

var _axiosMocking = require('./axiosMocking');

var _axiosMocking2 = _interopRequireDefault(_axiosMocking);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _pg = require('pg');

var pg = _interopRequireWildcard(_pg);

var _redis2 = require('redis');

var Redis = _interopRequireWildcard(_redis2);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-env node, mocha*/
/* eslint no-shadow: 0 */

var testType = {
  $name: 'tests',
  $id: 'id',
  $fields: {
    id: {
      type: 'number'
    },
    name: {
      type: 'string'
    },
    extended: {
      type: 'object'
    },
    children: {
      type: 'hasMany',
      relationship: 'children',
      parentField: 'parent_id',
      childField: 'child_id',
      childType: 'tests'
    },
    valenceChildren: {
      type: 'hasMany',
      relationship: 'children',
      parentField: 'parent_id',
      childField: 'child_id',
      childType: 'tests',
      extras: ['perm']
    }
  }
};

function runSQL(command) {
  var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

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
  constructor: _redis.RedisStorage,
  opts: {
    terminal: true
  },
  before: function before() {
    return flushRedis();
  },
  after: function after(driver) {
    return flushRedis().then(function () {
      return driver.teardown();
    });
  }
}, {
  name: 'sql',
  constructor: _sql.SQLStorage,
  opts: {
    sql: {
      connection: {
        database: 'guild_test',
        user: 'postgres',
        host: 'localhost',
        port: 5432
      }
    },
    terminal: true
  },
  before: function before() {
    return runSQL('DROP DATABASE if exists guild_test;').then(function () {
      return runSQL('CREATE DATABASE guild_test;');
    }).then(function () {
      return runSQL('\n          CREATE SEQUENCE testid_seq\n            START WITH 1\n            INCREMENT BY 1\n            NO MINVALUE\n            MAXVALUE 2147483647\n            CACHE 1\n            CYCLE;\n          CREATE TABLE tests (\n            id integer not null primary key DEFAULT nextval(\'testid_seq\'::regclass),\n            name text,\n            extended jsonb not null default \'{}\'::jsonb\n          );\n          CREATE TABLE children (parent_id integer not null, child_id integer not null);\n        ', { database: 'guild_test' });
    });
  },
  after: function after(driver) {
    return driver.teardown().then(function () {
      return runSQL('DROP DATABASE guild_test;');
    });
  }
}, {
  name: 'rest',
  constructor: _rest.RestStorage,
  opts: {
    terminal: true,
    axios: _axiosMocking2.default.mockup(testType)
  }
}, {
  name: 'memory',
  constructor: _memory.MemoryStorage,
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
      return actualStore.write(testType, sampleObject).then(function (createdObject) {
        return expect(actualStore.read(testType, createdObject.id)).to.eventually.deep.equal(Object.assign({}, sampleObject, { id: createdObject.id }));
      });
    });

    it('allows objects to be stored by id', function () {
      return actualStore.write(testType, sampleObject).then(function (createdObject) {
        var modObject = Object.assign({}, createdObject, { name: 'carrot' });
        return actualStore.write(testType, modObject).then(function (updatedObject) {
          return expect(actualStore.read(testType, updatedObject.id)).to.eventually.deep.equal(Object.assign({}, sampleObject, { id: createdObject.id, name: 'carrot' }));
        });
      });
    });

    it('allows for deletion of objects by id', function () {
      return actualStore.write(testType, sampleObject).then(function (createdObject) {
        return actualStore.delete(testType, createdObject.id).then(function () {
          return expect(actualStore.read(testType, createdObject.id)).to.eventually.deep.equal(null);
        });
      });
    });

    it('supports querying objects');

    it('can add to a hasMany relationship', function () {
      return actualStore.write(testType, sampleObject).then(function (createdObject) {
        return actualStore.add(testType, createdObject.id, 'children', 100).then(function () {
          return expect(actualStore.read(testType, createdObject.id, 'children')).to.eventually.deep.equal({ children: [{ id: 100 }] });
        });
      });
    });

    it('can add to a hasMany relationship with extras', function () {
      return actualStore.write(testType, sampleObject).then(function (createdObject) {
        return actualStore.add(testType, createdObject.id, 'children', 100, { perm: 1 }).then(function () {
          return expect(actualStore.read(testType, createdObject.id, 'children')).to.eventually.deep.equal({ children: [{ id: 100, perm: 1 }] });
        });
      });
    });

    it('can remove from a hasMany relationship', function () {
      return actualStore.write(testType, sampleObject).then(function (createdObject) {
        return actualStore.add(testType, createdObject.id, 'children', 100).then(function () {
          return expect(actualStore.read(testType, createdObject.id, 'children')).to.eventually.deep.equal({ children: [{ id: 100 }] });
        }).then(function () {
          return actualStore.remove(testType, createdObject.id, 'children', 100);
        }).then(function () {
          return expect(actualStore.read(testType, createdObject.id, 'children')).to.eventually.deep.equal({ children: [] });
        });
      });
    });

    after(function () {
      return (store.after || function () {})(actualStore);
    });
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3Qvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJwZyIsIlJlZGlzIiwidGVzdFR5cGUiLCIkbmFtZSIsIiRpZCIsIiRmaWVsZHMiLCJpZCIsInR5cGUiLCJuYW1lIiwiZXh0ZW5kZWQiLCJjaGlsZHJlbiIsInJlbGF0aW9uc2hpcCIsInBhcmVudEZpZWxkIiwiY2hpbGRGaWVsZCIsImNoaWxkVHlwZSIsInZhbGVuY2VDaGlsZHJlbiIsImV4dHJhcyIsInJ1blNRTCIsImNvbW1hbmQiLCJvcHRzIiwiY29ubk9wdGlvbnMiLCJPYmplY3QiLCJhc3NpZ24iLCJ1c2VyIiwiaG9zdCIsInBvcnQiLCJkYXRhYmFzZSIsImNoYXJzZXQiLCJjbGllbnQiLCJDbGllbnQiLCJyZXNvbHZlIiwiY29ubmVjdCIsImVyciIsInF1ZXJ5IiwiZW5kIiwiZmx1c2hSZWRpcyIsInIiLCJjcmVhdGVDbGllbnQiLCJkYiIsImZsdXNoZGIiLCJxdWl0Iiwic3RvcmFnZVR5cGVzIiwiY29uc3RydWN0b3IiLCJ0ZXJtaW5hbCIsImJlZm9yZSIsImFmdGVyIiwiZHJpdmVyIiwidGhlbiIsInRlYXJkb3duIiwic3FsIiwiY29ubmVjdGlvbiIsImF4aW9zIiwibW9ja3VwIiwic2FtcGxlT2JqZWN0IiwiYWN0dWFsIiwib3RoZXJWYWx1ZSIsInVzZSIsImV4cGVjdCIsImZvckVhY2giLCJzdG9yZSIsImRlc2NyaWJlIiwiYWN0dWFsU3RvcmUiLCJpdCIsIndyaXRlIiwiY3JlYXRlZE9iamVjdCIsInJlYWQiLCJ0byIsImV2ZW50dWFsbHkiLCJkZWVwIiwiZXF1YWwiLCJtb2RPYmplY3QiLCJ1cGRhdGVkT2JqZWN0IiwiZGVsZXRlIiwiYWRkIiwicGVybSIsInJlbW92ZSJdLCJtYXBwaW5ncyI6Ijs7QUFHQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztJQUFZQSxFOztBQUNaOztJQUFZQyxLOzs7Ozs7QUFaWjtBQUNBOztBQWFBLElB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QUEzQyxFQUErQyxVQUEvQyxFQUEyRCxHQUEzRCxDQUFOO0FBQUEsU0FMQyxFQU1OeUMsSUFOTSxDQU1ELFlBQU07QUFDVixpQkFBT1UsT0FBT0ksWUFBWUksSUFBWixDQUFpQi9ELFFBQWpCLEVBQTJCOEQsY0FBYzFELEVBQXpDLEVBQTZDLFVBQTdDLENBQVAsRUFDTjRELEVBRE0sQ0FDSEMsVUFERyxDQUNRQyxJQURSLENBQ2FDLEtBRGIsQ0FDbUIsRUFBQzNELFVBQVUsRUFBWCxFQURuQixDQUFQO0FBRUQsU0FUTSxDQUFQO0FBVUQsT0FaTSxDQUFQO0FBYUQsS0FkRDs7QUFnQkFtQyxVQUFNLFlBQU07QUFDVixhQUFPLENBQUNjLE1BQU1kLEtBQU4sSUFBZ0IsWUFBTSxDQUFFLENBQXpCLEVBQTRCZ0IsV0FBNUIsQ0FBUDtBQUNELEtBRkQ7QUFHRCxHQWhGRDtBQWlGRCxDQWxGRCIsImZpbGUiOiJ0ZXN0L3N0b3JhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZW52IG5vZGUsIG1vY2hhKi9cbi8qIGVzbGludCBuby1zaGFkb3c6IDAgKi9cblxuaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5pbXBvcnQgY2hhaUFzUHJvbWlzZWQgZnJvbSAnY2hhaS1hcy1wcm9taXNlZCc7XG5pbXBvcnQgeyBNZW1vcnlTdG9yYWdlIH0gZnJvbSAnLi4vc3RvcmFnZS9tZW1vcnknO1xuaW1wb3J0IHsgUmVkaXNTdG9yYWdlIH0gZnJvbSAnLi4vc3RvcmFnZS9yZWRpcyc7XG5pbXBvcnQgeyBSZXN0U3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2UvcmVzdCc7XG5pbXBvcnQgeyBTUUxTdG9yYWdlIH0gZnJvbSAnLi4vc3RvcmFnZS9zcWwnO1xuaW1wb3J0IGF4aW9zTW9jayBmcm9tICcuL2F4aW9zTW9ja2luZyc7XG5pbXBvcnQgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgKiBhcyBwZyBmcm9tICdwZyc7XG5pbXBvcnQgKiBhcyBSZWRpcyBmcm9tICdyZWRpcyc7XG5cbmNvbnN0IHRlc3RUeXBlID0ge1xuICAkbmFtZTogJ3Rlc3RzJyxcbiAgJGlkOiAnaWQnLFxuICAkZmllbGRzOiB7XG4gICAgaWQ6IHtcbiAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgIH0sXG4gICAgbmFtZToge1xuICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgfSxcbiAgICBleHRlbmRlZDoge1xuICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgfSxcbiAgICBjaGlsZHJlbjoge1xuICAgICAgdHlwZTogJ2hhc01hbnknLFxuICAgICAgcmVsYXRpb25zaGlwOiAnY2hpbGRyZW4nLFxuICAgICAgcGFyZW50RmllbGQ6ICdwYXJlbnRfaWQnLFxuICAgICAgY2hpbGRGaWVsZDogJ2NoaWxkX2lkJyxcbiAgICAgIGNoaWxkVHlwZTogJ3Rlc3RzJyxcbiAgICB9LFxuICAgIHZhbGVuY2VDaGlsZHJlbjoge1xuICAgICAgdHlwZTogJ2hhc01hbnknLFxuICAgICAgcmVsYXRpb25zaGlwOiAnY2hpbGRyZW4nLFxuICAgICAgcGFyZW50RmllbGQ6ICdwYXJlbnRfaWQnLFxuICAgICAgY2hpbGRGaWVsZDogJ2NoaWxkX2lkJyxcbiAgICAgIGNoaWxkVHlwZTogJ3Rlc3RzJyxcbiAgICAgIGV4dHJhczogWydwZXJtJ10sXG4gICAgfSxcbiAgfSxcbn07XG5cbmZ1bmN0aW9uIHJ1blNRTChjb21tYW5kLCBvcHRzID0ge30pIHtcbiAgY29uc3QgY29ubk9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgIHt9LFxuICAgIHtcbiAgICAgIHVzZXI6ICdwb3N0Z3JlcycsXG4gICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgIHBvcnQ6IDU0MzIsXG4gICAgICBkYXRhYmFzZTogJ3Bvc3RncmVzJyxcbiAgICAgIGNoYXJzZXQ6ICd1dGY4JyxcbiAgICB9LFxuICAgIG9wdHNcbiAgKTtcbiAgY29uc3QgY2xpZW50ID0gbmV3IHBnLkNsaWVudChjb25uT3B0aW9ucyk7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIGNsaWVudC5jb25uZWN0KChlcnIpID0+IHtcbiAgICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICAgIGNsaWVudC5xdWVyeShjb21tYW5kLCAoZXJyKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICAgICAgY2xpZW50LmVuZCgoZXJyKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGZsdXNoUmVkaXMoKSB7XG4gIGNvbnN0IHIgPSBSZWRpcy5jcmVhdGVDbGllbnQoe1xuICAgIHBvcnQ6IDYzNzksXG4gICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgZGI6IDAsXG4gIH0pO1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICByLmZsdXNoZGIoKGVycikgPT4ge1xuICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgci5xdWl0KChlcnIpID0+IHtcbiAgICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmNvbnN0IHN0b3JhZ2VUeXBlcyA9IFtcbiAge1xuICAgIG5hbWU6ICdyZWRpcycsXG4gICAgY29uc3RydWN0b3I6IFJlZGlzU3RvcmFnZSxcbiAgICBvcHRzOiB7XG4gICAgICB0ZXJtaW5hbDogdHJ1ZSxcbiAgICB9LFxuICAgIGJlZm9yZTogKCkgPT4ge1xuICAgICAgcmV0dXJuIGZsdXNoUmVkaXMoKTtcbiAgICB9LFxuICAgIGFmdGVyOiAoZHJpdmVyKSA9PiB7XG4gICAgICByZXR1cm4gZmx1c2hSZWRpcygpLnRoZW4oKCkgPT4gZHJpdmVyLnRlYXJkb3duKCkpO1xuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnc3FsJyxcbiAgICBjb25zdHJ1Y3RvcjogU1FMU3RvcmFnZSxcbiAgICBvcHRzOiB7XG4gICAgICBzcWw6IHtcbiAgICAgICAgY29ubmVjdGlvbjoge1xuICAgICAgICAgIGRhdGFiYXNlOiAnZ3VpbGRfdGVzdCcsXG4gICAgICAgICAgdXNlcjogJ3Bvc3RncmVzJyxcbiAgICAgICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgICAgICBwb3J0OiA1NDMyLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHRlcm1pbmFsOiB0cnVlLFxuICAgIH0sXG4gICAgYmVmb3JlOiAoKSA9PiB7XG4gICAgICByZXR1cm4gcnVuU1FMKCdEUk9QIERBVEFCQVNFIGlmIGV4aXN0cyBndWlsZF90ZXN0OycpXG4gICAgICAudGhlbigoKSA9PiBydW5TUUwoJ0NSRUFURSBEQVRBQkFTRSBndWlsZF90ZXN0OycpKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gcnVuU1FMKGBcbiAgICAgICAgICBDUkVBVEUgU0VRVUVOQ0UgdGVzdGlkX3NlcVxuICAgICAgICAgICAgU1RBUlQgV0lUSCAxXG4gICAgICAgICAgICBJTkNSRU1FTlQgQlkgMVxuICAgICAgICAgICAgTk8gTUlOVkFMVUVcbiAgICAgICAgICAgIE1BWFZBTFVFIDIxNDc0ODM2NDdcbiAgICAgICAgICAgIENBQ0hFIDFcbiAgICAgICAgICAgIENZQ0xFO1xuICAgICAgICAgIENSRUFURSBUQUJMRSB0ZXN0cyAoXG4gICAgICAgICAgICBpZCBpbnRlZ2VyIG5vdCBudWxsIHByaW1hcnkga2V5IERFRkFVTFQgbmV4dHZhbCgndGVzdGlkX3NlcSc6OnJlZ2NsYXNzKSxcbiAgICAgICAgICAgIG5hbWUgdGV4dCxcbiAgICAgICAgICAgIGV4dGVuZGVkIGpzb25iIG5vdCBudWxsIGRlZmF1bHQgJ3t9Jzo6anNvbmJcbiAgICAgICAgICApO1xuICAgICAgICAgIENSRUFURSBUQUJMRSBjaGlsZHJlbiAocGFyZW50X2lkIGludGVnZXIgbm90IG51bGwsIGNoaWxkX2lkIGludGVnZXIgbm90IG51bGwpO1xuICAgICAgICBgLCB7ZGF0YWJhc2U6ICdndWlsZF90ZXN0J30pO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBhZnRlcjogKGRyaXZlcikgPT4ge1xuICAgICAgcmV0dXJuIGRyaXZlci50ZWFyZG93bigpXG4gICAgICAudGhlbigoKSA9PiBydW5TUUwoJ0RST1AgREFUQUJBU0UgZ3VpbGRfdGVzdDsnKSk7XG4gICAgfSxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdyZXN0JyxcbiAgICBjb25zdHJ1Y3RvcjogUmVzdFN0b3JhZ2UsXG4gICAgb3B0czoge1xuICAgICAgdGVybWluYWw6IHRydWUsXG4gICAgICBheGlvczogYXhpb3NNb2NrLm1vY2t1cCh0ZXN0VHlwZSksXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdtZW1vcnknLFxuICAgIGNvbnN0cnVjdG9yOiBNZW1vcnlTdG9yYWdlLFxuICAgIG9wdHM6IHt0ZXJtaW5hbDogdHJ1ZX0sXG4gIH0sXG5dO1xuXG5jb25zdCBzYW1wbGVPYmplY3QgPSB7XG4gIG5hbWU6ICdwb3RhdG8nLFxuICBleHRlbmRlZDoge1xuICAgIGFjdHVhbDogJ3J1dGFiYWdhJyxcbiAgICBvdGhlclZhbHVlOiA0MixcbiAgfSxcbn07XG5cbmNoYWkudXNlKGNoYWlBc1Byb21pc2VkKTtcbmNvbnN0IGV4cGVjdCA9IGNoYWkuZXhwZWN0O1xuXG5zdG9yYWdlVHlwZXMuZm9yRWFjaCgoc3RvcmUpID0+IHtcbiAgZGVzY3JpYmUoc3RvcmUubmFtZSwgKCkgPT4ge1xuICAgIGxldCBhY3R1YWxTdG9yZTtcbiAgICBiZWZvcmUoKCkgPT4ge1xuICAgICAgcmV0dXJuIChzdG9yZS5iZWZvcmUgfHwgKCgpID0+IFByb21pc2UucmVzb2x2ZSgpKSkoYWN0dWFsU3RvcmUpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIGFjdHVhbFN0b3JlID0gbmV3IHN0b3JlLmNvbnN0cnVjdG9yKHN0b3JlLm9wdHMpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc3VwcG9ydHMgY3JlYXRpbmcgdmFsdWVzIHdpdGggbm8gaWQgZmllbGQsIGFuZCByZXRyaWV2aW5nIHZhbHVlcycsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZSh0ZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChPYmplY3QuYXNzaWduKHt9LCBzYW1wbGVPYmplY3QsIHtpZDogY3JlYXRlZE9iamVjdC5pZH0pKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2FsbG93cyBvYmplY3RzIHRvIGJlIHN0b3JlZCBieSBpZCcsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZSh0ZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgY29uc3QgbW9kT2JqZWN0ID0gT2JqZWN0LmFzc2lnbih7fSwgY3JlYXRlZE9iamVjdCwge25hbWU6ICdjYXJyb3QnfSk7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZSh0ZXN0VHlwZSwgbW9kT2JqZWN0KVxuICAgICAgICAudGhlbigodXBkYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZCh0ZXN0VHlwZSwgdXBkYXRlZE9iamVjdC5pZCkpXG4gICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChPYmplY3QuYXNzaWduKHt9LCBzYW1wbGVPYmplY3QsIHtpZDogY3JlYXRlZE9iamVjdC5pZCwgbmFtZTogJ2NhcnJvdCd9KSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnYWxsb3dzIGZvciBkZWxldGlvbiBvZiBvYmplY3RzIGJ5IGlkJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKHRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuZGVsZXRlKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKVxuICAgICAgICAudGhlbigoKSA9PiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZCh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCkpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChudWxsKSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzdXBwb3J0cyBxdWVyeWluZyBvYmplY3RzJyk7XG5cbiAgICBpdCgnY2FuIGFkZCB0byBhIGhhc01hbnkgcmVsYXRpb25zaGlwJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKHRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuYWRkKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDApXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe2NoaWxkcmVuOiBbe2lkOiAxMDB9XX0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NhbiBhZGQgdG8gYSBoYXNNYW55IHJlbGF0aW9uc2hpcCB3aXRoIGV4dHJhcycsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZSh0ZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZCh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMTAwLCB7cGVybTogMX0pXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe2NoaWxkcmVuOiBbe2lkOiAxMDAsIHBlcm06IDF9XX0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NhbiByZW1vdmUgZnJvbSBhIGhhc01hbnkgcmVsYXRpb25zaGlwJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKHRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuYWRkKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDApXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe2NoaWxkcmVuOiBbe2lkOiAxMDB9XX0pO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5yZW1vdmUodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMCkpXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe2NoaWxkcmVuOiBbXX0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgYWZ0ZXIoKCkgPT4ge1xuICAgICAgcmV0dXJuIChzdG9yZS5hZnRlciB8fCAoKCkgPT4ge30pKShhY3R1YWxTdG9yZSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
