'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _memory = require('../storage/memory');

var _redis = require('../storage/redis');

var _rest = require('../storage/rest');

var _axiosMockAdapter = require('axios-mock-adapter');

var _axiosMockAdapter2 = _interopRequireDefault(_axiosMockAdapter);

var _sql = require('../storage/sql');

var _axios = require('axios');

var axios = _interopRequireWildcard(_axios);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _pg = require('pg');

var pg = _interopRequireWildcard(_pg);

var _redis2 = require('redis');

var Redis = _interopRequireWildcard(_redis2);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
} /* eslint-env node, mocha*/
/* eslint no-shadow: 0 */

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
        database: 'guild_test'
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
    terminal: true
  },
  before: function before() {
    var mock = new _axiosMockAdapter2.default(axios);
    mock.onPost('/tests').reply(function (v) {
      return [200, JSON.parse(v.data)];
    });
    return _bluebird2.default.resolve(true);
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
      joinTable: 'children',
      parentColumn: 'parent_id',
      childColumn: 'child_id',
      childType: 'tests'
    }
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
          return expect(actualStore.read(testType, createdObject.id)).to.eventually.be.null;
        });
      });
    });

    it('supports querying objects');

    it('can add to a hasMany relationship', function () {
      return actualStore.write(testType, sampleObject).then(function (createdObject) {
        return actualStore.add(testType, createdObject.id, 'children', 100).then(function () {
          return expect(actualStore.has(testType, createdObject.id, 'children')).to.eventually.deep.equal([100]);
        });
      });
    });

    it('can remove from a hasMany relationship', function () {
      return actualStore.write(testType, sampleObject).then(function (createdObject) {
        return actualStore.add(testType, createdObject.id, 'children', 100).then(function () {
          return expect(actualStore.has(testType, createdObject.id, 'children')).to.eventually.deep.equal([100]);
        }).then(function () {
          return actualStore.remove(testType, createdObject.id, 'children', 100);
        }).then(function () {
          return expect(actualStore.has(testType, createdObject.id, 'children')).to.eventually.deep.equal([]);
        });
      });
    });

    after(function () {
      return (store.after || function () {})(actualStore);
    });
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3Qvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJheGlvcyIsInBnIiwiUmVkaXMiLCJydW5TUUwiLCJjb21tYW5kIiwib3B0cyIsImNvbm5PcHRpb25zIiwiT2JqZWN0IiwiYXNzaWduIiwidXNlciIsImhvc3QiLCJwb3J0IiwiZGF0YWJhc2UiLCJjaGFyc2V0IiwiY2xpZW50IiwiQ2xpZW50IiwicmVzb2x2ZSIsImNvbm5lY3QiLCJlcnIiLCJxdWVyeSIsImVuZCIsImZsdXNoUmVkaXMiLCJyIiwiY3JlYXRlQ2xpZW50IiwiZGIiLCJmbHVzaGRiIiwicXVpdCIsInN0b3JhZ2VUeXBlcyIsIm5hbWUiLCJjb25zdHJ1Y3RvciIsInRlcm1pbmFsIiwiYmVmb3JlIiwiYWZ0ZXIiLCJkcml2ZXIiLCJ0aGVuIiwidGVhcmRvd24iLCJzcWwiLCJjb25uZWN0aW9uIiwibW9jayIsIm9uUG9zdCIsInJlcGx5IiwidiIsIkpTT04iLCJwYXJzZSIsImRhdGEiLCJzYW1wbGVPYmplY3QiLCJleHRlbmRlZCIsImFjdHVhbCIsIm90aGVyVmFsdWUiLCJ0ZXN0VHlwZSIsIiRuYW1lIiwiJGlkIiwiJGZpZWxkcyIsImlkIiwidHlwZSIsImNoaWxkcmVuIiwiam9pblRhYmxlIiwicGFyZW50Q29sdW1uIiwiY2hpbGRDb2x1bW4iLCJjaGlsZFR5cGUiLCJ1c2UiLCJleHBlY3QiLCJmb3JFYWNoIiwic3RvcmUiLCJkZXNjcmliZSIsImFjdHVhbFN0b3JlIiwiaXQiLCJ3cml0ZSIsImNyZWF0ZWRPYmplY3QiLCJyZWFkIiwidG8iLCJldmVudHVhbGx5IiwiZGVlcCIsImVxdWFsIiwibW9kT2JqZWN0IiwidXBkYXRlZE9iamVjdCIsImRlbGV0ZSIsImJlIiwibnVsbCIsImFkZCIsImhhcyIsInJlbW92ZSJdLCJtYXBwaW5ncyI6Ijs7QUFHQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7SUFBWUEsSzs7QUFDWjs7OztBQUNBOztJQUFZQyxF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QUE1QixFQUNOWCxJQURNLENBQ0QsVUFBQ2tDLGFBQUQsRUFBbUI7QUFDdkIsZUFBT0gsWUFBWWMsR0FBWixDQUFnQjlCLFFBQWhCLEVBQTBCbUIsY0FBY2YsRUFBeEMsRUFBNEMsVUFBNUMsRUFBd0QsR0FBeEQsRUFDTm5CLElBRE0sQ0FDRDtBQUFBLGlCQUFNMkIsT0FBT0ksWUFBWWUsR0FBWixDQUFnQi9CLFFBQWhCLEVBQTBCbUIsY0FBY2YsRUFBeEMsRUFBNEMsVUFBNUMsQ0FBUCxFQUFnRWlCLEVBQWhFLENBQW1FQyxVQUFuRSxDQUE4RUMsSUFBOUUsQ0FBbUZDLEtBQW5GLENBQXlGLENBQUMsR0FBRCxDQUF6RixDQUFOO0FBQUEsU0FEQyxFQUVOdkMsSUFGTSxDQUVEO0FBQUEsaUJBQU0rQixZQUFZZ0IsTUFBWixDQUFtQmhDLFFBQW5CLEVBQTZCbUIsY0FBY2YsRUFBM0MsRUFBK0MsVUFBL0MsRUFBMkQsR0FBM0QsQ0FBTjtBQUFBLFNBRkMsRUFHTm5CLElBSE0sQ0FHRDtBQUFBLGlCQUFNMkIsT0FBT0ksWUFBWWUsR0FBWixDQUFnQi9CLFFBQWhCLEVBQTBCbUIsY0FBY2YsRUFBeEMsRUFBNEMsVUFBNUMsQ0FBUCxFQUFnRWlCLEVBQWhFLENBQW1FQyxVQUFuRSxDQUE4RUMsSUFBOUUsQ0FBbUZDLEtBQW5GLENBQXlGLEVBQXpGLENBQU47QUFBQSxTQUhDLENBQVA7QUFJRCxPQU5NLENBQVA7QUFPRCxLQVJEOztBQVVBekMsVUFBTSxZQUFNO0FBQ1YsYUFBTyxDQUFDK0IsTUFBTS9CLEtBQU4sSUFBZ0IsWUFBTSxDQUFFLENBQXpCLEVBQTRCaUMsV0FBNUIsQ0FBUDtBQUNELEtBRkQ7QUFHRCxHQTVERDtBQTZERCxDQTlERCIsImZpbGUiOiJ0ZXN0L3N0b3JhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZW52IG5vZGUsIG1vY2hhKi9cbi8qIGVzbGludCBuby1zaGFkb3c6IDAgKi9cblxuaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5pbXBvcnQgY2hhaUFzUHJvbWlzZWQgZnJvbSAnY2hhaS1hcy1wcm9taXNlZCc7XG5pbXBvcnQgeyBNZW1vcnlTdG9yYWdlIH0gZnJvbSAnLi4vc3RvcmFnZS9tZW1vcnknO1xuaW1wb3J0IHsgUmVkaXNTdG9yYWdlIH0gZnJvbSAnLi4vc3RvcmFnZS9yZWRpcyc7XG5pbXBvcnQgeyBSZXN0U3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2UvcmVzdCc7XG5pbXBvcnQgTW9ja0FkYXB0ZXIgZnJvbSAnYXhpb3MtbW9jay1hZGFwdGVyJztcbmltcG9ydCB7IFNRTFN0b3JhZ2UgfSBmcm9tICcuLi9zdG9yYWdlL3NxbCc7XG5pbXBvcnQgKiBhcyBheGlvcyBmcm9tICdheGlvcyc7XG5pbXBvcnQgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgKiBhcyBwZyBmcm9tICdwZyc7XG5pbXBvcnQgKiBhcyBSZWRpcyBmcm9tICdyZWRpcyc7XG5cbmZ1bmN0aW9uIHJ1blNRTChjb21tYW5kLCBvcHRzID0ge30pIHtcbiAgY29uc3QgY29ubk9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgIHt9LFxuICAgIHtcbiAgICAgIHVzZXI6ICdwb3N0Z3JlcycsXG4gICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgIHBvcnQ6IDU0MzIsXG4gICAgICBkYXRhYmFzZTogJ3Bvc3RncmVzJyxcbiAgICAgIGNoYXJzZXQ6ICd1dGY4JyxcbiAgICB9LFxuICAgIG9wdHNcbiAgKTtcbiAgY29uc3QgY2xpZW50ID0gbmV3IHBnLkNsaWVudChjb25uT3B0aW9ucyk7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIGNsaWVudC5jb25uZWN0KChlcnIpID0+IHtcbiAgICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICAgIGNsaWVudC5xdWVyeShjb21tYW5kLCAoZXJyKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICAgICAgY2xpZW50LmVuZCgoZXJyKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGZsdXNoUmVkaXMoKSB7XG4gIGNvbnN0IHIgPSBSZWRpcy5jcmVhdGVDbGllbnQoe1xuICAgIHBvcnQ6IDYzNzksXG4gICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgZGI6IDAsXG4gIH0pO1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICByLmZsdXNoZGIoKGVycikgPT4ge1xuICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgci5xdWl0KChlcnIpID0+IHtcbiAgICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmNvbnN0IHN0b3JhZ2VUeXBlcyA9IFtcbiAge1xuICAgIG5hbWU6ICdyZWRpcycsXG4gICAgY29uc3RydWN0b3I6IFJlZGlzU3RvcmFnZSxcbiAgICBvcHRzOiB7XG4gICAgICB0ZXJtaW5hbDogdHJ1ZSxcbiAgICB9LFxuICAgIGJlZm9yZTogKCkgPT4ge1xuICAgICAgcmV0dXJuIGZsdXNoUmVkaXMoKTtcbiAgICB9LFxuICAgIGFmdGVyOiAoZHJpdmVyKSA9PiB7XG4gICAgICByZXR1cm4gZmx1c2hSZWRpcygpLnRoZW4oKCkgPT4gZHJpdmVyLnRlYXJkb3duKCkpO1xuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnc3FsJyxcbiAgICBjb25zdHJ1Y3RvcjogU1FMU3RvcmFnZSxcbiAgICBvcHRzOiB7XG4gICAgICBzcWw6IHtcbiAgICAgICAgY29ubmVjdGlvbjoge1xuICAgICAgICAgIGRhdGFiYXNlOiAnZ3VpbGRfdGVzdCcsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgdGVybWluYWw6IHRydWUsXG4gICAgfSxcbiAgICBiZWZvcmU6ICgpID0+IHtcbiAgICAgIHJldHVybiBydW5TUUwoJ0RST1AgREFUQUJBU0UgaWYgZXhpc3RzIGd1aWxkX3Rlc3Q7JylcbiAgICAgIC50aGVuKCgpID0+IHJ1blNRTCgnQ1JFQVRFIERBVEFCQVNFIGd1aWxkX3Rlc3Q7JykpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBydW5TUUwoYFxuICAgICAgICAgIENSRUFURSBTRVFVRU5DRSB0ZXN0aWRfc2VxXG4gICAgICAgICAgICBTVEFSVCBXSVRIIDFcbiAgICAgICAgICAgIElOQ1JFTUVOVCBCWSAxXG4gICAgICAgICAgICBOTyBNSU5WQUxVRVxuICAgICAgICAgICAgTUFYVkFMVUUgMjE0NzQ4MzY0N1xuICAgICAgICAgICAgQ0FDSEUgMVxuICAgICAgICAgICAgQ1lDTEU7XG4gICAgICAgICAgQ1JFQVRFIFRBQkxFIHRlc3RzIChcbiAgICAgICAgICAgIGlkIGludGVnZXIgbm90IG51bGwgcHJpbWFyeSBrZXkgREVGQVVMVCBuZXh0dmFsKCd0ZXN0aWRfc2VxJzo6cmVnY2xhc3MpLFxuICAgICAgICAgICAgbmFtZSB0ZXh0LFxuICAgICAgICAgICAgZXh0ZW5kZWQganNvbmIgbm90IG51bGwgZGVmYXVsdCAne30nOjpqc29uYlxuICAgICAgICAgICk7XG4gICAgICAgICAgQ1JFQVRFIFRBQkxFIGNoaWxkcmVuIChwYXJlbnRfaWQgaW50ZWdlciBub3QgbnVsbCwgY2hpbGRfaWQgaW50ZWdlciBub3QgbnVsbCk7XG4gICAgICAgIGAsIHtkYXRhYmFzZTogJ2d1aWxkX3Rlc3QnfSk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGFmdGVyOiAoZHJpdmVyKSA9PiB7XG4gICAgICByZXR1cm4gZHJpdmVyLnRlYXJkb3duKClcbiAgICAgIC50aGVuKCgpID0+IHJ1blNRTCgnRFJPUCBEQVRBQkFTRSBndWlsZF90ZXN0OycpKTtcbiAgICB9LFxuICB9LFxuICB7XG4gICAgbmFtZTogJ3Jlc3QnLFxuICAgIGNvbnN0cnVjdG9yOiBSZXN0U3RvcmFnZSxcbiAgICBvcHRzOiB7XG4gICAgICB0ZXJtaW5hbDogdHJ1ZSxcbiAgICB9LFxuICAgIGJlZm9yZTogKCkgPT4ge1xuICAgICAgY29uc3QgbW9jayA9IG5ldyBNb2NrQWRhcHRlcihheGlvcyk7XG4gICAgICBtb2NrLm9uUG9zdCgnL3Rlc3RzJykucmVwbHkoKHYpID0+IHtcbiAgICAgICAgcmV0dXJuIFsyMDAsIEpTT04ucGFyc2Uodi5kYXRhKV07XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodHJ1ZSk7XG4gICAgfSxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdtZW1vcnknLFxuICAgIGNvbnN0cnVjdG9yOiBNZW1vcnlTdG9yYWdlLFxuICAgIG9wdHM6IHt0ZXJtaW5hbDogdHJ1ZX0sXG4gIH0sXG5dO1xuXG5jb25zdCBzYW1wbGVPYmplY3QgPSB7XG4gIG5hbWU6ICdwb3RhdG8nLFxuICBleHRlbmRlZDoge1xuICAgIGFjdHVhbDogJ3J1dGFiYWdhJyxcbiAgICBvdGhlclZhbHVlOiA0MixcbiAgfSxcbn07XG5cbmNvbnN0IHRlc3RUeXBlID0ge1xuICAkbmFtZTogJ3Rlc3RzJyxcbiAgJGlkOiAnaWQnLFxuICAkZmllbGRzOiB7XG4gICAgaWQ6IHtcbiAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgIH0sXG4gICAgbmFtZToge1xuICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgfSxcbiAgICBleHRlbmRlZDoge1xuICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgfSxcbiAgICBjaGlsZHJlbjoge1xuICAgICAgdHlwZTogJ2hhc01hbnknLFxuICAgICAgam9pblRhYmxlOiAnY2hpbGRyZW4nLFxuICAgICAgcGFyZW50Q29sdW1uOiAncGFyZW50X2lkJyxcbiAgICAgIGNoaWxkQ29sdW1uOiAnY2hpbGRfaWQnLFxuICAgICAgY2hpbGRUeXBlOiAndGVzdHMnLFxuICAgIH0sXG4gIH0sXG59O1xuXG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5jb25zdCBleHBlY3QgPSBjaGFpLmV4cGVjdDtcblxuc3RvcmFnZVR5cGVzLmZvckVhY2goKHN0b3JlKSA9PiB7XG4gIGRlc2NyaWJlKHN0b3JlLm5hbWUsICgpID0+IHtcbiAgICBsZXQgYWN0dWFsU3RvcmU7XG4gICAgYmVmb3JlKCgpID0+IHtcbiAgICAgIHJldHVybiAoc3RvcmUuYmVmb3JlIHx8ICgoKSA9PiBQcm9taXNlLnJlc29sdmUoKSkpKGFjdHVhbFN0b3JlKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBhY3R1YWxTdG9yZSA9IG5ldyBzdG9yZS5jb25zdHJ1Y3RvcihzdG9yZS5vcHRzKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3N1cHBvcnRzIGNyZWF0aW5nIHZhbHVlcyB3aXRoIG5vIGlkIGZpZWxkLCBhbmQgcmV0cmlldmluZyB2YWx1ZXMnLCAoKSA9PiB7XG4gICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUodGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZCh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCkpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoT2JqZWN0LmFzc2lnbih7fSwgc2FtcGxlT2JqZWN0LCB7aWQ6IGNyZWF0ZWRPYmplY3QuaWR9KSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdhbGxvd3Mgb2JqZWN0cyB0byBiZSBzdG9yZWQgYnkgaWQnLCAoKSA9PiB7XG4gICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUodGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IG1vZE9iamVjdCA9IE9iamVjdC5hc3NpZ24oe30sIGNyZWF0ZWRPYmplY3QsIHtuYW1lOiAnY2Fycm90J30pO1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUodGVzdFR5cGUsIG1vZE9iamVjdClcbiAgICAgICAgLnRoZW4oKHVwZGF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQodGVzdFR5cGUsIHVwZGF0ZWRPYmplY3QuaWQpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoT2JqZWN0LmFzc2lnbih7fSwgc2FtcGxlT2JqZWN0LCB7aWQ6IGNyZWF0ZWRPYmplY3QuaWQsIG5hbWU6ICdjYXJyb3QnfSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2FsbG93cyBmb3IgZGVsZXRpb24gb2Ygb2JqZWN0cyBieSBpZCcsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZSh0ZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmRlbGV0ZSh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZClcbiAgICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQpKS50by5ldmVudHVhbGx5LmJlLm51bGwpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc3VwcG9ydHMgcXVlcnlpbmcgb2JqZWN0cycpO1xuXG4gICAgaXQoJ2NhbiBhZGQgdG8gYSBoYXNNYW55IHJlbGF0aW9uc2hpcCcsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZSh0ZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZCh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMTAwKVxuICAgICAgICAudGhlbigoKSA9PiBleHBlY3QoYWN0dWFsU3RvcmUuaGFzKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFsxMDBdKSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW4gcmVtb3ZlIGZyb20gYSBoYXNNYW55IHJlbGF0aW9uc2hpcCcsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZSh0ZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZCh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMTAwKVxuICAgICAgICAudGhlbigoKSA9PiBleHBlY3QoYWN0dWFsU3RvcmUuaGFzKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFsxMDBdKSlcbiAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUucmVtb3ZlKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgICAudGhlbigoKSA9PiBleHBlY3QoYWN0dWFsU3RvcmUuaGFzKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFtdKSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGFmdGVyKCgpID0+IHtcbiAgICAgIHJldHVybiAoc3RvcmUuYWZ0ZXIgfHwgKCgpID0+IHt9KSkoYWN0dWFsU3RvcmUpO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
