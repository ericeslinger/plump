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
}; /* eslint-env node, mocha*/
/* eslint no-shadow: 0 */

var mockAxios = axios.create({
  baseURL: ''
});

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
    terminal: true,
    axios: mockAxios
  },
  before: function before() {
    var mock = new _axiosMockAdapter2.default(mockAxios);
    mock.onGet(/\/tests\/\d+/).reply(function (c) {
      console.log('GET');
      console.log(c);
      return [200, {}];
    });
    mock.onPost('/tests').reply(function (v) {
      console.log('SET');
      console.log(JSON.parse(v.data));
      return [200, {}];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3Qvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJheGlvcyIsInBnIiwiUmVkaXMiLCJ0ZXN0VHlwZSIsIiRuYW1lIiwiJGlkIiwiJGZpZWxkcyIsImlkIiwidHlwZSIsIm5hbWUiLCJleHRlbmRlZCIsImNoaWxkcmVuIiwiam9pblRhYmxlIiwicGFyZW50Q29sdW1uIiwiY2hpbGRDb2x1bW4iLCJjaGlsZFR5cGUiLCJtb2NrQXhpb3MiLCJjcmVhdGUiLCJiYXNlVVJMIiwicnVuU1FMIiwiY29tbWFuZCIsIm9wdHMiLCJjb25uT3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInVzZXIiLCJob3N0IiwicG9ydCIsImRhdGFiYXNlIiwiY2hhcnNldCIsImNsaWVudCIsIkNsaWVudCIsInJlc29sdmUiLCJjb25uZWN0IiwiZXJyIiwicXVlcnkiLCJlbmQiLCJmbHVzaFJlZGlzIiwiciIsImNyZWF0ZUNsaWVudCIsImRiIiwiZmx1c2hkYiIsInF1aXQiLCJzdG9yYWdlVHlwZXMiLCJjb25zdHJ1Y3RvciIsInRlcm1pbmFsIiwiYmVmb3JlIiwiYWZ0ZXIiLCJkcml2ZXIiLCJ0aGVuIiwidGVhcmRvd24iLCJzcWwiLCJjb25uZWN0aW9uIiwibW9jayIsIm9uR2V0IiwicmVwbHkiLCJjIiwiY29uc29sZSIsImxvZyIsIm9uUG9zdCIsInYiLCJKU09OIiwicGFyc2UiLCJkYXRhIiwic2FtcGxlT2JqZWN0IiwiYWN0dWFsIiwib3RoZXJWYWx1ZSIsInVzZSIsImV4cGVjdCIsImZvckVhY2giLCJzdG9yZSIsImRlc2NyaWJlIiwiYWN0dWFsU3RvcmUiLCJpdCIsIndyaXRlIiwiY3JlYXRlZE9iamVjdCIsInJlYWQiLCJ0byIsImV2ZW50dWFsbHkiLCJkZWVwIiwiZXF1YWwiLCJtb2RPYmplY3QiLCJ1cGRhdGVkT2JqZWN0IiwiZGVsZXRlIiwiYWRkIiwiaGFzIiwicmVtb3ZlIl0sIm1hcHBpbmdzIjoiOztBQUdBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFD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LFVBQTVDLENBQVAsRUFBZ0VzRSxFQUFoRSxDQUFtRUMsVUFBbkUsQ0FBOEVDLElBQTlFLENBQW1GQyxLQUFuRixDQUF5RixFQUF6RixDQUFOO0FBQUEsU0FIQyxDQUFQO0FBSUQsT0FOTSxDQUFQO0FBT0QsS0FSRDs7QUFVQWpDLFVBQU0sWUFBTTtBQUNWLGFBQU8sQ0FBQ3VCLE1BQU12QixLQUFOLElBQWdCLFlBQU0sQ0FBRSxDQUF6QixFQUE0QnlCLFdBQTVCLENBQVA7QUFDRCxLQUZEO0FBR0QsR0E1REQ7QUE2REQsQ0E5REQiLCJmaWxlIjoidGVzdC9zdG9yYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlLCBtb2NoYSovXG4vKiBlc2xpbnQgbm8tc2hhZG93OiAwICovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IHsgTWVtb3J5U3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2UvbWVtb3J5JztcbmltcG9ydCB7IFJlZGlzU3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2UvcmVkaXMnO1xuaW1wb3J0IHsgUmVzdFN0b3JhZ2UgfSBmcm9tICcuLi9zdG9yYWdlL3Jlc3QnO1xuaW1wb3J0IE1vY2tBZGFwdGVyIGZyb20gJ2F4aW9zLW1vY2stYWRhcHRlcic7XG5pbXBvcnQgeyBTUUxTdG9yYWdlIH0gZnJvbSAnLi4vc3RvcmFnZS9zcWwnO1xuaW1wb3J0ICogYXMgYXhpb3MgZnJvbSAnYXhpb3MnO1xuaW1wb3J0IFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0ICogYXMgcGcgZnJvbSAncGcnO1xuaW1wb3J0ICogYXMgUmVkaXMgZnJvbSAncmVkaXMnO1xuXG5jb25zdCB0ZXN0VHlwZSA9IHtcbiAgJG5hbWU6ICd0ZXN0cycsXG4gICRpZDogJ2lkJyxcbiAgJGZpZWxkczoge1xuICAgIGlkOiB7XG4gICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICB9LFxuICAgIG5hbWU6IHtcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgIH0sXG4gICAgZXh0ZW5kZWQ6IHtcbiAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgIH0sXG4gICAgY2hpbGRyZW46IHtcbiAgICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICAgIGpvaW5UYWJsZTogJ2NoaWxkcmVuJyxcbiAgICAgIHBhcmVudENvbHVtbjogJ3BhcmVudF9pZCcsXG4gICAgICBjaGlsZENvbHVtbjogJ2NoaWxkX2lkJyxcbiAgICAgIGNoaWxkVHlwZTogJ3Rlc3RzJyxcbiAgICB9LFxuICB9LFxufTtcblxuY29uc3QgbW9ja0F4aW9zID0gYXhpb3MuY3JlYXRlKHtcbiAgYmFzZVVSTDogJycsXG59KTtcblxuZnVuY3Rpb24gcnVuU1FMKGNvbW1hbmQsIG9wdHMgPSB7fSkge1xuICBjb25zdCBjb25uT3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAge30sXG4gICAge1xuICAgICAgdXNlcjogJ3Bvc3RncmVzJyxcbiAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgcG9ydDogNTQzMixcbiAgICAgIGRhdGFiYXNlOiAncG9zdGdyZXMnLFxuICAgICAgY2hhcnNldDogJ3V0ZjgnLFxuICAgIH0sXG4gICAgb3B0c1xuICApO1xuICBjb25zdCBjbGllbnQgPSBuZXcgcGcuQ2xpZW50KGNvbm5PcHRpb25zKTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgY2xpZW50LmNvbm5lY3QoKGVycikgPT4ge1xuICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgY2xpZW50LnF1ZXJ5KGNvbW1hbmQsIChlcnIpID0+IHtcbiAgICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgICBjbGllbnQuZW5kKChlcnIpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZmx1c2hSZWRpcygpIHtcbiAgY29uc3QgciA9IFJlZGlzLmNyZWF0ZUNsaWVudCh7XG4gICAgcG9ydDogNjM3OSxcbiAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICBkYjogMCxcbiAgfSk7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIHIuZmx1c2hkYigoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICByLnF1aXQoKGVycikgPT4ge1xuICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuY29uc3Qgc3RvcmFnZVR5cGVzID0gW1xuICB7XG4gICAgbmFtZTogJ3JlZGlzJyxcbiAgICBjb25zdHJ1Y3RvcjogUmVkaXNTdG9yYWdlLFxuICAgIG9wdHM6IHtcbiAgICAgIHRlcm1pbmFsOiB0cnVlLFxuICAgIH0sXG4gICAgYmVmb3JlOiAoKSA9PiB7XG4gICAgICByZXR1cm4gZmx1c2hSZWRpcygpO1xuICAgIH0sXG4gICAgYWZ0ZXI6IChkcml2ZXIpID0+IHtcbiAgICAgIHJldHVybiBmbHVzaFJlZGlzKCkudGhlbigoKSA9PiBkcml2ZXIudGVhcmRvd24oKSk7XG4gICAgfSxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdzcWwnLFxuICAgIGNvbnN0cnVjdG9yOiBTUUxTdG9yYWdlLFxuICAgIG9wdHM6IHtcbiAgICAgIHNxbDoge1xuICAgICAgICBjb25uZWN0aW9uOiB7XG4gICAgICAgICAgZGF0YWJhc2U6ICdndWlsZF90ZXN0JyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB0ZXJtaW5hbDogdHJ1ZSxcbiAgICB9LFxuICAgIGJlZm9yZTogKCkgPT4ge1xuICAgICAgcmV0dXJuIHJ1blNRTCgnRFJPUCBEQVRBQkFTRSBpZiBleGlzdHMgZ3VpbGRfdGVzdDsnKVxuICAgICAgLnRoZW4oKCkgPT4gcnVuU1FMKCdDUkVBVEUgREFUQUJBU0UgZ3VpbGRfdGVzdDsnKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHJ1blNRTChgXG4gICAgICAgICAgQ1JFQVRFIFNFUVVFTkNFIHRlc3RpZF9zZXFcbiAgICAgICAgICAgIFNUQVJUIFdJVEggMVxuICAgICAgICAgICAgSU5DUkVNRU5UIEJZIDFcbiAgICAgICAgICAgIE5PIE1JTlZBTFVFXG4gICAgICAgICAgICBNQVhWQUxVRSAyMTQ3NDgzNjQ3XG4gICAgICAgICAgICBDQUNIRSAxXG4gICAgICAgICAgICBDWUNMRTtcbiAgICAgICAgICBDUkVBVEUgVEFCTEUgdGVzdHMgKFxuICAgICAgICAgICAgaWQgaW50ZWdlciBub3QgbnVsbCBwcmltYXJ5IGtleSBERUZBVUxUIG5leHR2YWwoJ3Rlc3RpZF9zZXEnOjpyZWdjbGFzcyksXG4gICAgICAgICAgICBuYW1lIHRleHQsXG4gICAgICAgICAgICBleHRlbmRlZCBqc29uYiBub3QgbnVsbCBkZWZhdWx0ICd7fSc6Ompzb25iXG4gICAgICAgICAgKTtcbiAgICAgICAgICBDUkVBVEUgVEFCTEUgY2hpbGRyZW4gKHBhcmVudF9pZCBpbnRlZ2VyIG5vdCBudWxsLCBjaGlsZF9pZCBpbnRlZ2VyIG5vdCBudWxsKTtcbiAgICAgICAgYCwge2RhdGFiYXNlOiAnZ3VpbGRfdGVzdCd9KTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgYWZ0ZXI6IChkcml2ZXIpID0+IHtcbiAgICAgIHJldHVybiBkcml2ZXIudGVhcmRvd24oKVxuICAgICAgLnRoZW4oKCkgPT4gcnVuU1FMKCdEUk9QIERBVEFCQVNFIGd1aWxkX3Rlc3Q7JykpO1xuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAncmVzdCcsXG4gICAgY29uc3RydWN0b3I6IFJlc3RTdG9yYWdlLFxuICAgIG9wdHM6IHtcbiAgICAgIHRlcm1pbmFsOiB0cnVlLFxuICAgICAgYXhpb3M6IG1vY2tBeGlvcyxcbiAgICB9LFxuICAgIGJlZm9yZTogKCkgPT4ge1xuICAgICAgY29uc3QgbW9jayA9IG5ldyBNb2NrQWRhcHRlcihtb2NrQXhpb3MpO1xuICAgICAgbW9jay5vbkdldCgvXFwvdGVzdHNcXC9cXGQrLykucmVwbHkoKGMpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ0dFVCcpO1xuICAgICAgICBjb25zb2xlLmxvZyhjKTtcbiAgICAgICAgcmV0dXJuIFsyMDAsIHt9XTtcbiAgICAgIH0pO1xuICAgICAgbW9jay5vblBvc3QoJy90ZXN0cycpLnJlcGx5KCh2KSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdTRVQnKTtcbiAgICAgICAgY29uc29sZS5sb2coSlNPTi5wYXJzZSh2LmRhdGEpKTtcbiAgICAgICAgcmV0dXJuIFsyMDAsIHt9XTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0cnVlKTtcbiAgICB9LFxuICB9LFxuICB7XG4gICAgbmFtZTogJ21lbW9yeScsXG4gICAgY29uc3RydWN0b3I6IE1lbW9yeVN0b3JhZ2UsXG4gICAgb3B0czoge3Rlcm1pbmFsOiB0cnVlfSxcbiAgfSxcbl07XG5cbmNvbnN0IHNhbXBsZU9iamVjdCA9IHtcbiAgbmFtZTogJ3BvdGF0bycsXG4gIGV4dGVuZGVkOiB7XG4gICAgYWN0dWFsOiAncnV0YWJhZ2EnLFxuICAgIG90aGVyVmFsdWU6IDQyLFxuICB9LFxufTtcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbnN0b3JhZ2VUeXBlcy5mb3JFYWNoKChzdG9yZSkgPT4ge1xuICBkZXNjcmliZShzdG9yZS5uYW1lLCAoKSA9PiB7XG4gICAgbGV0IGFjdHVhbFN0b3JlO1xuICAgIGJlZm9yZSgoKSA9PiB7XG4gICAgICByZXR1cm4gKHN0b3JlLmJlZm9yZSB8fCAoKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCkpKShhY3R1YWxTdG9yZSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgYWN0dWFsU3RvcmUgPSBuZXcgc3RvcmUuY29uc3RydWN0b3Ioc3RvcmUub3B0cyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzdXBwb3J0cyBjcmVhdGluZyB2YWx1ZXMgd2l0aCBubyBpZCBmaWVsZCwgYW5kIHJldHJpZXZpbmcgdmFsdWVzJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKHRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKE9iamVjdC5hc3NpZ24oe30sIHNhbXBsZU9iamVjdCwge2lkOiBjcmVhdGVkT2JqZWN0LmlkfSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnYWxsb3dzIG9iamVjdHMgdG8gYmUgc3RvcmVkIGJ5IGlkJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKHRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICBjb25zdCBtb2RPYmplY3QgPSBPYmplY3QuYXNzaWduKHt9LCBjcmVhdGVkT2JqZWN0LCB7bmFtZTogJ2NhcnJvdCd9KTtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKHRlc3RUeXBlLCBtb2RPYmplY3QpXG4gICAgICAgIC50aGVuKCh1cGRhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKHRlc3RUeXBlLCB1cGRhdGVkT2JqZWN0LmlkKSlcbiAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKE9iamVjdC5hc3NpZ24oe30sIHNhbXBsZU9iamVjdCwge2lkOiBjcmVhdGVkT2JqZWN0LmlkLCBuYW1lOiAnY2Fycm90J30pKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdhbGxvd3MgZm9yIGRlbGV0aW9uIG9mIG9iamVjdHMgYnkgaWQnLCAoKSA9PiB7XG4gICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUodGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5kZWxldGUodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQpXG4gICAgICAgIC50aGVuKCgpID0+IGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKG51bGwpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3N1cHBvcnRzIHF1ZXJ5aW5nIG9iamVjdHMnKTtcblxuICAgIGl0KCdjYW4gYWRkIHRvIGEgaGFzTWFueSByZWxhdGlvbnNoaXAnLCAoKSA9PiB7XG4gICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUodGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMClcbiAgICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KGFjdHVhbFN0b3JlLmhhcyh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbMTAwXSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnY2FuIHJlbW92ZSBmcm9tIGEgaGFzTWFueSByZWxhdGlvbnNoaXAnLCAoKSA9PiB7XG4gICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUodGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMClcbiAgICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KGFjdHVhbFN0b3JlLmhhcyh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbMTAwXSkpXG4gICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLnJlbW92ZSh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KGFjdHVhbFN0b3JlLmhhcyh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbXSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBhZnRlcigoKSA9PiB7XG4gICAgICByZXR1cm4gKHN0b3JlLmFmdGVyIHx8ICgoKSA9PiB7fSkpKGFjdHVhbFN0b3JlKTtcbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
