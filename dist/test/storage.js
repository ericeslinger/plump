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
          return expect(actualStore.read(testType, createdObject.id, 'children')).to.eventually.deep.equal({ children: [100] });
        });
      });
    });

    it('can remove from a hasMany relationship', function () {
      return actualStore.write(testType, sampleObject).then(function (createdObject) {
        return actualStore.add(testType, createdObject.id, 'children', 100).then(function () {
          return expect(actualStore.read(testType, createdObject.id, 'children')).to.eventually.deep.equal({ children: [100] });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3Qvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJwZyIsIlJlZGlzIiwidGVzdFR5cGUiLCIkbmFtZSIsIiRpZCIsIiRmaWVsZHMiLCJpZCIsInR5cGUiLCJuYW1lIiwiZXh0ZW5kZWQiLCJjaGlsZHJlbiIsInJlbGF0aW9uc2hpcCIsInBhcmVudEZpZWxkIiwiY2hpbGRGaWVsZCIsImNoaWxkVHlwZSIsInJ1blNRTCIsImNvbW1hbmQiLCJvcHRzIiwiY29ubk9wdGlvbnMiLCJPYmplY3QiLCJhc3NpZ24iLCJ1c2VyIiwiaG9zdCIsInBvcnQiLCJkYXRhYmFzZSIsImNoYXJzZXQiLCJjbGllbnQiLCJDbGllbnQiLCJyZXNvbHZlIiwiY29ubmVjdCIsImVyciIsInF1ZXJ5IiwiZW5kIiwiZmx1c2hSZWRpcyIsInIiLCJjcmVhdGVDbGllbnQiLCJkYiIsImZsdXNoZGIiLCJxdWl0Iiwic3RvcmFnZVR5cGVzIiwiY29uc3RydWN0b3IiLCJ0ZXJtaW5hbCIsImJlZm9yZSIsImFmdGVyIiwiZHJpdmVyIiwidGhlbiIsInRlYXJkb3duIiwic3FsIiwiY29ubmVjdGlvbiIsImF4aW9zIiwibW9ja3VwIiwic2FtcGxlT2JqZWN0IiwiYWN0dWFsIiwib3RoZXJWYWx1ZSIsInVzZSIsImV4cGVjdCIsImZvckVhY2giLCJzdG9yZSIsImRlc2NyaWJlIiwiYWN0dWFsU3RvcmUiLCJpdCIsIndyaXRlIiwiY3JlYXRlZE9iamVjdCIsInJlYWQiLCJ0byIsImV2ZW50dWFsbHkiLCJkZWVwIiwiZXF1YWwiLCJtb2RPYmplY3QiLCJ1cGRhdGVkT2JqZWN0IiwiZGVsZXRlIiwiYWRkIiwicmVtb3ZlIl0sIm1hcHBpbmdzIjoiOztBQUdBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0lBQVlBLEU7O0FBQ1o7O0lBQVlDLEs7Ozs7OztBQVpaO0FBQ0E7O0FBYUEsSUFBTUMsV0FBVztBQUNmQyxTQUFPLE9BRFE7QUFFZkMsT0FB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QWpCLEVBQTJCNEQsY0FBY3hELEVBQXpDLEVBQTZDLFVBQTdDLENBQVAsRUFBaUUwRCxFQUFqRSxDQUFvRUMsVUFBcEUsQ0FBK0VDLElBQS9FLENBQW9GQyxLQUFwRixDQUEwRixFQUFDekQsVUFBVSxDQUFDLEdBQUQsQ0FBWCxFQUExRixDQUFOO0FBQUEsU0FEQyxFQUVObUMsSUFGTSxDQUVEO0FBQUEsaUJBQU1jLFlBQVlhLE1BQVosQ0FBbUJ0RSxRQUFuQixFQUE2QjRELGNBQWN4RCxFQUEzQyxFQUErQyxVQUEvQyxFQUEyRCxHQUEzRCxDQUFOO0FBQUEsU0FGQyxFQUdOdUMsSUFITSxDQUdEO0FBQUEsaUJBQU1VLE9BQU9JLFlBQVlJLElBQVosQ0FBaUI3RCxRQUFqQixFQUEyQjRELGNBQWN4RCxFQUF6QyxFQUE2QyxVQUE3QyxDQUFQLEVBQWlFMEQsRUFBakUsQ0FBb0VDLFVBQXBFLENBQStFQyxJQUEvRSxDQUFvRkMsS0FBcEYsQ0FBMEYsRUFBQ3pELFVBQVUsRUFBWCxFQUExRixDQUFOO0FBQUEsU0FIQyxDQUFQO0FBSUQsT0FOTSxDQUFQO0FBT0QsS0FSRDs7QUFVQWlDLFVBQU0sWUFBTTtBQUNWLGFBQU8sQ0FBQ2MsTUFBTWQsS0FBTixJQUFnQixZQUFNLENBQUUsQ0FBekIsRUFBNEJnQixXQUE1QixDQUFQO0FBQ0QsS0FGRDtBQUdELEdBNUREO0FBNkRELENBOUREIiwiZmlsZSI6InRlc3Qvc3RvcmFnZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1lbnYgbm9kZSwgbW9jaGEqL1xuLyogZXNsaW50IG5vLXNoYWRvdzogMCAqL1xuXG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCB7IE1lbW9yeVN0b3JhZ2UgfSBmcm9tICcuLi9zdG9yYWdlL21lbW9yeSc7XG5pbXBvcnQgeyBSZWRpc1N0b3JhZ2UgfSBmcm9tICcuLi9zdG9yYWdlL3JlZGlzJztcbmltcG9ydCB7IFJlc3RTdG9yYWdlIH0gZnJvbSAnLi4vc3RvcmFnZS9yZXN0JztcbmltcG9ydCB7IFNRTFN0b3JhZ2UgfSBmcm9tICcuLi9zdG9yYWdlL3NxbCc7XG5pbXBvcnQgYXhpb3NNb2NrIGZyb20gJy4vYXhpb3NNb2NraW5nJztcbmltcG9ydCBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCAqIGFzIHBnIGZyb20gJ3BnJztcbmltcG9ydCAqIGFzIFJlZGlzIGZyb20gJ3JlZGlzJztcblxuY29uc3QgdGVzdFR5cGUgPSB7XG4gICRuYW1lOiAndGVzdHMnLFxuICAkaWQ6ICdpZCcsXG4gICRmaWVsZHM6IHtcbiAgICBpZDoge1xuICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgfSxcbiAgICBuYW1lOiB7XG4gICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICB9LFxuICAgIGV4dGVuZGVkOiB7XG4gICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICB9LFxuICAgIGNoaWxkcmVuOiB7XG4gICAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgICByZWxhdGlvbnNoaXA6ICdjaGlsZHJlbicsXG4gICAgICBwYXJlbnRGaWVsZDogJ3BhcmVudF9pZCcsXG4gICAgICBjaGlsZEZpZWxkOiAnY2hpbGRfaWQnLFxuICAgICAgY2hpbGRUeXBlOiAndGVzdHMnLFxuICAgIH0sXG4gIH0sXG59O1xuXG5mdW5jdGlvbiBydW5TUUwoY29tbWFuZCwgb3B0cyA9IHt9KSB7XG4gIGNvbnN0IGNvbm5PcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICB7fSxcbiAgICB7XG4gICAgICB1c2VyOiAncG9zdGdyZXMnLFxuICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgICBwb3J0OiA1NDMyLFxuICAgICAgZGF0YWJhc2U6ICdwb3N0Z3JlcycsXG4gICAgICBjaGFyc2V0OiAndXRmOCcsXG4gICAgfSxcbiAgICBvcHRzXG4gICk7XG4gIGNvbnN0IGNsaWVudCA9IG5ldyBwZy5DbGllbnQoY29ubk9wdGlvbnMpO1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICBjbGllbnQuY29ubmVjdCgoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICBjbGllbnQucXVlcnkoY29tbWFuZCwgKGVycikgPT4ge1xuICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICAgIGNsaWVudC5lbmQoKGVycikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBmbHVzaFJlZGlzKCkge1xuICBjb25zdCByID0gUmVkaXMuY3JlYXRlQ2xpZW50KHtcbiAgICBwb3J0OiA2Mzc5LFxuICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgIGRiOiAwLFxuICB9KTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgci5mbHVzaGRiKChlcnIpID0+IHtcbiAgICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICAgIHIucXVpdCgoZXJyKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5jb25zdCBzdG9yYWdlVHlwZXMgPSBbXG4gIHtcbiAgICBuYW1lOiAncmVkaXMnLFxuICAgIGNvbnN0cnVjdG9yOiBSZWRpc1N0b3JhZ2UsXG4gICAgb3B0czoge1xuICAgICAgdGVybWluYWw6IHRydWUsXG4gICAgfSxcbiAgICBiZWZvcmU6ICgpID0+IHtcbiAgICAgIHJldHVybiBmbHVzaFJlZGlzKCk7XG4gICAgfSxcbiAgICBhZnRlcjogKGRyaXZlcikgPT4ge1xuICAgICAgcmV0dXJuIGZsdXNoUmVkaXMoKS50aGVuKCgpID0+IGRyaXZlci50ZWFyZG93bigpKTtcbiAgICB9LFxuICB9LFxuICB7XG4gICAgbmFtZTogJ3NxbCcsXG4gICAgY29uc3RydWN0b3I6IFNRTFN0b3JhZ2UsXG4gICAgb3B0czoge1xuICAgICAgc3FsOiB7XG4gICAgICAgIGNvbm5lY3Rpb246IHtcbiAgICAgICAgICBkYXRhYmFzZTogJ2d1aWxkX3Rlc3QnLFxuICAgICAgICAgIHVzZXI6ICdwb3N0Z3JlcycsXG4gICAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgICAgICAgcG9ydDogNTQzMixcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB0ZXJtaW5hbDogdHJ1ZSxcbiAgICB9LFxuICAgIGJlZm9yZTogKCkgPT4ge1xuICAgICAgcmV0dXJuIHJ1blNRTCgnRFJPUCBEQVRBQkFTRSBpZiBleGlzdHMgZ3VpbGRfdGVzdDsnKVxuICAgICAgLnRoZW4oKCkgPT4gcnVuU1FMKCdDUkVBVEUgREFUQUJBU0UgZ3VpbGRfdGVzdDsnKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHJ1blNRTChgXG4gICAgICAgICAgQ1JFQVRFIFNFUVVFTkNFIHRlc3RpZF9zZXFcbiAgICAgICAgICAgIFNUQVJUIFdJVEggMVxuICAgICAgICAgICAgSU5DUkVNRU5UIEJZIDFcbiAgICAgICAgICAgIE5PIE1JTlZBTFVFXG4gICAgICAgICAgICBNQVhWQUxVRSAyMTQ3NDgzNjQ3XG4gICAgICAgICAgICBDQUNIRSAxXG4gICAgICAgICAgICBDWUNMRTtcbiAgICAgICAgICBDUkVBVEUgVEFCTEUgdGVzdHMgKFxuICAgICAgICAgICAgaWQgaW50ZWdlciBub3QgbnVsbCBwcmltYXJ5IGtleSBERUZBVUxUIG5leHR2YWwoJ3Rlc3RpZF9zZXEnOjpyZWdjbGFzcyksXG4gICAgICAgICAgICBuYW1lIHRleHQsXG4gICAgICAgICAgICBleHRlbmRlZCBqc29uYiBub3QgbnVsbCBkZWZhdWx0ICd7fSc6Ompzb25iXG4gICAgICAgICAgKTtcbiAgICAgICAgICBDUkVBVEUgVEFCTEUgY2hpbGRyZW4gKHBhcmVudF9pZCBpbnRlZ2VyIG5vdCBudWxsLCBjaGlsZF9pZCBpbnRlZ2VyIG5vdCBudWxsKTtcbiAgICAgICAgYCwge2RhdGFiYXNlOiAnZ3VpbGRfdGVzdCd9KTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgYWZ0ZXI6IChkcml2ZXIpID0+IHtcbiAgICAgIHJldHVybiBkcml2ZXIudGVhcmRvd24oKVxuICAgICAgLnRoZW4oKCkgPT4gcnVuU1FMKCdEUk9QIERBVEFCQVNFIGd1aWxkX3Rlc3Q7JykpO1xuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAncmVzdCcsXG4gICAgY29uc3RydWN0b3I6IFJlc3RTdG9yYWdlLFxuICAgIG9wdHM6IHtcbiAgICAgIHRlcm1pbmFsOiB0cnVlLFxuICAgICAgYXhpb3M6IGF4aW9zTW9jay5tb2NrdXAodGVzdFR5cGUpLFxuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnbWVtb3J5JyxcbiAgICBjb25zdHJ1Y3RvcjogTWVtb3J5U3RvcmFnZSxcbiAgICBvcHRzOiB7dGVybWluYWw6IHRydWV9LFxuICB9LFxuXTtcblxuY29uc3Qgc2FtcGxlT2JqZWN0ID0ge1xuICBuYW1lOiAncG90YXRvJyxcbiAgZXh0ZW5kZWQ6IHtcbiAgICBhY3R1YWw6ICdydXRhYmFnYScsXG4gICAgb3RoZXJWYWx1ZTogNDIsXG4gIH0sXG59O1xuXG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5jb25zdCBleHBlY3QgPSBjaGFpLmV4cGVjdDtcblxuc3RvcmFnZVR5cGVzLmZvckVhY2goKHN0b3JlKSA9PiB7XG4gIGRlc2NyaWJlKHN0b3JlLm5hbWUsICgpID0+IHtcbiAgICBsZXQgYWN0dWFsU3RvcmU7XG4gICAgYmVmb3JlKCgpID0+IHtcbiAgICAgIHJldHVybiAoc3RvcmUuYmVmb3JlIHx8ICgoKSA9PiBQcm9taXNlLnJlc29sdmUoKSkpKGFjdHVhbFN0b3JlKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBhY3R1YWxTdG9yZSA9IG5ldyBzdG9yZS5jb25zdHJ1Y3RvcihzdG9yZS5vcHRzKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3N1cHBvcnRzIGNyZWF0aW5nIHZhbHVlcyB3aXRoIG5vIGlkIGZpZWxkLCBhbmQgcmV0cmlldmluZyB2YWx1ZXMnLCAoKSA9PiB7XG4gICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUodGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZCh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCkpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoT2JqZWN0LmFzc2lnbih7fSwgc2FtcGxlT2JqZWN0LCB7aWQ6IGNyZWF0ZWRPYmplY3QuaWR9KSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdhbGxvd3Mgb2JqZWN0cyB0byBiZSBzdG9yZWQgYnkgaWQnLCAoKSA9PiB7XG4gICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUodGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IG1vZE9iamVjdCA9IE9iamVjdC5hc3NpZ24oe30sIGNyZWF0ZWRPYmplY3QsIHtuYW1lOiAnY2Fycm90J30pO1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUodGVzdFR5cGUsIG1vZE9iamVjdClcbiAgICAgICAgLnRoZW4oKHVwZGF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQodGVzdFR5cGUsIHVwZGF0ZWRPYmplY3QuaWQpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoT2JqZWN0LmFzc2lnbih7fSwgc2FtcGxlT2JqZWN0LCB7aWQ6IGNyZWF0ZWRPYmplY3QuaWQsIG5hbWU6ICdjYXJyb3QnfSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2FsbG93cyBmb3IgZGVsZXRpb24gb2Ygb2JqZWN0cyBieSBpZCcsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZSh0ZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmRlbGV0ZSh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZClcbiAgICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwobnVsbCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc3VwcG9ydHMgcXVlcnlpbmcgb2JqZWN0cycpO1xuXG4gICAgaXQoJ2NhbiBhZGQgdG8gYSBoYXNNYW55IHJlbGF0aW9uc2hpcCcsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZSh0ZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZCh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMTAwKVxuICAgICAgICAudGhlbigoKSA9PiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZCh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7Y2hpbGRyZW46IFsxMDBdfSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnY2FuIHJlbW92ZSBmcm9tIGEgaGFzTWFueSByZWxhdGlvbnNoaXAnLCAoKSA9PiB7XG4gICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUodGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMClcbiAgICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe2NoaWxkcmVuOiBbMTAwXX0pKVxuICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5yZW1vdmUodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMCkpXG4gICAgICAgIC50aGVuKCgpID0+IGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtjaGlsZHJlbjogW119KSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGFmdGVyKCgpID0+IHtcbiAgICAgIHJldHVybiAoc3RvcmUuYWZ0ZXIgfHwgKCgpID0+IHt9KSkoYWN0dWFsU3RvcmUpO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
