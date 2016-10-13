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

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /* eslint-env node, mocha*/
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
      relationship: 'valence_children',
      parentField: 'parent_id',
      childField: 'child_id',
      childType: 'tests',
      extras: ['perm']
    }
  }
};

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
      return runSQL('\n          CREATE SEQUENCE testid_seq\n            START WITH 1\n            INCREMENT BY 1\n            NO MINVALUE\n            MAXVALUE 2147483647\n            CACHE 1\n            CYCLE;\n          CREATE TABLE tests (\n            id integer not null primary key DEFAULT nextval(\'testid_seq\'::regclass),\n            name text,\n            extended jsonb not null default \'{}\'::jsonb\n          );\n          CREATE TABLE children (parent_id integer not null, child_id integer not null);\n          CREATE UNIQUE INDEX children_join on children (parent_id, child_id);\n          CREATE TABLE valence_children (parent_id integer not null, child_id integer not null, perm integer not null);\n          CREATE UNIQUE INDEX valence_children_join on valence_children (parent_id, child_id, perm);\n        ', { database: 'guild_test' });
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
        return expect(actualStore.read(testType, createdObject.id)).to.eventually.deep.equal(Object.assign({}, sampleObject, _defineProperty({}, testType.$id, createdObject.id)));
      });
    });

    it('allows objects to be stored by id', function () {
      return actualStore.write(testType, sampleObject).then(function (createdObject) {
        var modObject = Object.assign({}, createdObject, { name: 'carrot' });
        return actualStore.write(testType, modObject).then(function (updatedObject) {
          var _Object$assign2;

          return expect(actualStore.read(testType, updatedObject.id)).to.eventually.deep.equal(Object.assign({}, sampleObject, (_Object$assign2 = {}, _defineProperty(_Object$assign2, testType.$id, createdObject.id), _defineProperty(_Object$assign2, 'name', 'carrot'), _Object$assign2)));
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
          return expect(actualStore.read(testType, createdObject.id, 'children')).to.eventually.deep.equal({ children: [_defineProperty({}, testType.$id, 100)] });
        });
      });
    });

    it('can add to a hasMany relationship with extras', function () {
      return actualStore.write(testType, sampleObject).then(function (createdObject) {
        return actualStore.add(testType, createdObject.id, 'valenceChildren', 100, { perm: 1 }).then(function () {
          var _ref2;

          return expect(actualStore.read(testType, createdObject.id, 'valenceChildren')).to.eventually.deep.equal({ valenceChildren: [(_ref2 = {}, _defineProperty(_ref2, testType.$id, 100), _defineProperty(_ref2, 'perm', 1), _ref2)] });
        });
      });
    });

    it('can modify valence on a hasMany relationship', function () {
      return actualStore.write(testType, sampleObject).then(function (createdObject) {
        return actualStore.add(testType, createdObject.id, 'valenceChildren', 100, { perm: 1 }).then(function () {
          var _ref3;

          return expect(actualStore.read(testType, createdObject.id, 'valenceChildren')).to.eventually.deep.equal({ valenceChildren: [(_ref3 = {}, _defineProperty(_ref3, testType.$id, 100), _defineProperty(_ref3, 'perm', 1), _ref3)] });
        }).then(function () {
          return actualStore.modifyRelationship(testType, createdObject.id, 'valenceChildren', 100, { perm: 2 });
        }).then(function () {
          var _ref4;

          return expect(actualStore.read(testType, createdObject.id, 'valenceChildren')).to.eventually.deep.equal({ valenceChildren: [(_ref4 = {}, _defineProperty(_ref4, testType.$id, 100), _defineProperty(_ref4, 'perm', 2), _ref4)] });
        });
      });
    });

    it('can remove from a hasMany relationship', function () {
      return actualStore.write(testType, sampleObject).then(function (createdObject) {
        return actualStore.add(testType, createdObject.id, 'children', 100).then(function () {
          return expect(actualStore.read(testType, createdObject.id, 'children')).to.eventually.deep.equal({ children: [_defineProperty({}, testType.$id, 100)] });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3Qvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJwZyIsIlJlZGlzIiwidGVzdFR5cGUiLCIkbmFtZSIsIiRpZCIsIiRmaWVsZHMiLCJpZCIsInR5cGUiLCJuYW1lIiwiZXh0ZW5kZWQiLCJjaGlsZHJlbiIsInJlbGF0aW9uc2hpcCIsInBhcmVudEZpZWxkIiwiY2hpbGRGaWVsZCIsImNoaWxkVHlwZSIsInZhbGVuY2VDaGlsZHJlbiIsImV4dHJhcyIsInJ1blNRTCIsImNvbW1hbmQiLCJvcHRzIiwiY29ubk9wdGlvbnMiLCJPYmplY3QiLCJhc3NpZ24iLCJ1c2VyIiwiaG9zdCIsInBvcnQiLCJkYXRhYmFzZSIsImNoYXJzZXQiLCJjbGllbnQiLCJDbGllbnQiLCJyZXNvbHZlIiwiY29ubmVjdCIsImVyciIsInF1ZXJ5IiwiZW5kIiwiZmx1c2hSZWRpcyIsInIiLCJjcmVhdGVDbGllbnQiLCJkYiIsImZsdXNoZGIiLCJxdWl0Iiwic3RvcmFnZVR5cGVzIiwiY29uc3RydWN0b3IiLCJ0ZXJtaW5hbCIsImJlZm9yZSIsImFmdGVyIiwiZHJpdmVyIiwidGhlbiIsInRlYXJkb3duIiwic3FsIiwiY29ubmVjdGlvbiIsImF4aW9zIiwibW9ja3VwIiwic2FtcGxlT2JqZWN0IiwiYWN0dWFsIiwib3RoZXJWYWx1ZSIsInVzZSIsImV4cGVjdCIsImZvckVhY2giLCJzdG9yZSIsImRlc2NyaWJlIiwiYWN0dWFsU3RvcmUiLCJpdCIsIndyaXRlIiwiY3JlYXRlZE9iamVjdCIsInJlYWQiLCJ0byIsImV2ZW50dWFsbHkiLCJkZWVwIiwiZXF1YWwiLCJtb2RPYmplY3QiLCJ1cGRhdGVkT2JqZWN0IiwiZGVsZXRlIiwiYWRkIiwicGVybSIsIm1vZGlmeVJlbGF0aW9uc2hpcCIsInJlbW92ZSJdLCJtYXBwaW5ncyI6Ijs7QUFHQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztJQUFZQSxFOztBQUNaOztJQUFZQyxLOzs7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QU1jLFlBQVllLE1BQVosQ0FBbUIxRSxRQUFuQixFQUE2QjhELGNBQWMxRCxFQUEzQyxFQUErQyxVQUEvQyxFQUEyRCxHQUEzRCxDQUFOO0FBQUEsU0FMQyxFQU1OeUMsSUFOTSxDQU1ELFlBQU07QUFDVixpQkFBT1UsT0FBT0ksWUFBWUksSUFBWixDQUFpQi9ELFFBQWpCLEVBQTJCOEQsY0FBYzFELEVBQXpDLEVBQTZDLFVBQTdDLENBQVAsRUFDTjRELEVBRE0sQ0FDSEMsVUFERyxDQUNRQyxJQURSLENBQ2FDLEtBRGIsQ0FDbUIsRUFBQzNELFVBQVUsRUFBWCxFQURuQixDQUFQO0FBRUQsU0FUTSxDQUFQO0FBVUQsT0FaTSxDQUFQO0FBYUQsS0FkRDs7QUFnQkFtQyxVQUFNLFlBQU07QUFDVixhQUFPLENBQUNjLE1BQU1kLEtBQU4sSUFBZ0IsWUFBTSxDQUFFLENBQXpCLEVBQTRCZ0IsV0FBNUIsQ0FBUDtBQUNELEtBRkQ7QUFHRCxHQW5HRDtBQW9HRCxDQXJHRCIsImZpbGUiOiJ0ZXN0L3N0b3JhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZW52IG5vZGUsIG1vY2hhKi9cbi8qIGVzbGludCBuby1zaGFkb3c6IDAgKi9cblxuaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5pbXBvcnQgY2hhaUFzUHJvbWlzZWQgZnJvbSAnY2hhaS1hcy1wcm9taXNlZCc7XG5pbXBvcnQgeyBNZW1vcnlTdG9yYWdlIH0gZnJvbSAnLi4vc3RvcmFnZS9tZW1vcnknO1xuaW1wb3J0IHsgUmVkaXNTdG9yYWdlIH0gZnJvbSAnLi4vc3RvcmFnZS9yZWRpcyc7XG5pbXBvcnQgeyBSZXN0U3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2UvcmVzdCc7XG5pbXBvcnQgeyBTUUxTdG9yYWdlIH0gZnJvbSAnLi4vc3RvcmFnZS9zcWwnO1xuaW1wb3J0IGF4aW9zTW9jayBmcm9tICcuL2F4aW9zTW9ja2luZyc7XG5pbXBvcnQgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgKiBhcyBwZyBmcm9tICdwZyc7XG5pbXBvcnQgKiBhcyBSZWRpcyBmcm9tICdyZWRpcyc7XG5cbmNvbnN0IHRlc3RUeXBlID0ge1xuICAkbmFtZTogJ3Rlc3RzJyxcbiAgJGlkOiAnaWQnLFxuICAkZmllbGRzOiB7XG4gICAgaWQ6IHtcbiAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgIH0sXG4gICAgbmFtZToge1xuICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgfSxcbiAgICBleHRlbmRlZDoge1xuICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgfSxcbiAgICBjaGlsZHJlbjoge1xuICAgICAgdHlwZTogJ2hhc01hbnknLFxuICAgICAgcmVsYXRpb25zaGlwOiAnY2hpbGRyZW4nLFxuICAgICAgcGFyZW50RmllbGQ6ICdwYXJlbnRfaWQnLFxuICAgICAgY2hpbGRGaWVsZDogJ2NoaWxkX2lkJyxcbiAgICAgIGNoaWxkVHlwZTogJ3Rlc3RzJyxcbiAgICB9LFxuICAgIHZhbGVuY2VDaGlsZHJlbjoge1xuICAgICAgdHlwZTogJ2hhc01hbnknLFxuICAgICAgcmVsYXRpb25zaGlwOiAndmFsZW5jZV9jaGlsZHJlbicsXG4gICAgICBwYXJlbnRGaWVsZDogJ3BhcmVudF9pZCcsXG4gICAgICBjaGlsZEZpZWxkOiAnY2hpbGRfaWQnLFxuICAgICAgY2hpbGRUeXBlOiAndGVzdHMnLFxuICAgICAgZXh0cmFzOiBbJ3Blcm0nXSxcbiAgICB9LFxuICB9LFxufTtcblxuZnVuY3Rpb24gcnVuU1FMKGNvbW1hbmQsIG9wdHMgPSB7fSkge1xuICBjb25zdCBjb25uT3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAge30sXG4gICAge1xuICAgICAgdXNlcjogJ3Bvc3RncmVzJyxcbiAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgcG9ydDogNTQzMixcbiAgICAgIGRhdGFiYXNlOiAncG9zdGdyZXMnLFxuICAgICAgY2hhcnNldDogJ3V0ZjgnLFxuICAgIH0sXG4gICAgb3B0c1xuICApO1xuICBjb25zdCBjbGllbnQgPSBuZXcgcGcuQ2xpZW50KGNvbm5PcHRpb25zKTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgY2xpZW50LmNvbm5lY3QoKGVycikgPT4ge1xuICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgY2xpZW50LnF1ZXJ5KGNvbW1hbmQsIChlcnIpID0+IHtcbiAgICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgICBjbGllbnQuZW5kKChlcnIpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZmx1c2hSZWRpcygpIHtcbiAgY29uc3QgciA9IFJlZGlzLmNyZWF0ZUNsaWVudCh7XG4gICAgcG9ydDogNjM3OSxcbiAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICBkYjogMCxcbiAgfSk7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIHIuZmx1c2hkYigoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICByLnF1aXQoKGVycikgPT4ge1xuICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuY29uc3Qgc3RvcmFnZVR5cGVzID0gW1xuICB7XG4gICAgbmFtZTogJ3JlZGlzJyxcbiAgICBjb25zdHJ1Y3RvcjogUmVkaXNTdG9yYWdlLFxuICAgIG9wdHM6IHtcbiAgICAgIHRlcm1pbmFsOiB0cnVlLFxuICAgIH0sXG4gICAgYmVmb3JlOiAoKSA9PiB7XG4gICAgICByZXR1cm4gZmx1c2hSZWRpcygpO1xuICAgIH0sXG4gICAgYWZ0ZXI6IChkcml2ZXIpID0+IHtcbiAgICAgIHJldHVybiBmbHVzaFJlZGlzKCkudGhlbigoKSA9PiBkcml2ZXIudGVhcmRvd24oKSk7XG4gICAgfSxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdzcWwnLFxuICAgIGNvbnN0cnVjdG9yOiBTUUxTdG9yYWdlLFxuICAgIG9wdHM6IHtcbiAgICAgIHNxbDoge1xuICAgICAgICBjb25uZWN0aW9uOiB7XG4gICAgICAgICAgZGF0YWJhc2U6ICdndWlsZF90ZXN0JyxcbiAgICAgICAgICB1c2VyOiAncG9zdGdyZXMnLFxuICAgICAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgICAgIHBvcnQ6IDU0MzIsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgdGVybWluYWw6IHRydWUsXG4gICAgfSxcbiAgICBiZWZvcmU6ICgpID0+IHtcbiAgICAgIHJldHVybiBydW5TUUwoJ0RST1AgREFUQUJBU0UgaWYgZXhpc3RzIGd1aWxkX3Rlc3Q7JylcbiAgICAgIC50aGVuKCgpID0+IHJ1blNRTCgnQ1JFQVRFIERBVEFCQVNFIGd1aWxkX3Rlc3Q7JykpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBydW5TUUwoYFxuICAgICAgICAgIENSRUFURSBTRVFVRU5DRSB0ZXN0aWRfc2VxXG4gICAgICAgICAgICBTVEFSVCBXSVRIIDFcbiAgICAgICAgICAgIElOQ1JFTUVOVCBCWSAxXG4gICAgICAgICAgICBOTyBNSU5WQUxVRVxuICAgICAgICAgICAgTUFYVkFMVUUgMjE0NzQ4MzY0N1xuICAgICAgICAgICAgQ0FDSEUgMVxuICAgICAgICAgICAgQ1lDTEU7XG4gICAgICAgICAgQ1JFQVRFIFRBQkxFIHRlc3RzIChcbiAgICAgICAgICAgIGlkIGludGVnZXIgbm90IG51bGwgcHJpbWFyeSBrZXkgREVGQVVMVCBuZXh0dmFsKCd0ZXN0aWRfc2VxJzo6cmVnY2xhc3MpLFxuICAgICAgICAgICAgbmFtZSB0ZXh0LFxuICAgICAgICAgICAgZXh0ZW5kZWQganNvbmIgbm90IG51bGwgZGVmYXVsdCAne30nOjpqc29uYlxuICAgICAgICAgICk7XG4gICAgICAgICAgQ1JFQVRFIFRBQkxFIGNoaWxkcmVuIChwYXJlbnRfaWQgaW50ZWdlciBub3QgbnVsbCwgY2hpbGRfaWQgaW50ZWdlciBub3QgbnVsbCk7XG4gICAgICAgICAgQ1JFQVRFIFVOSVFVRSBJTkRFWCBjaGlsZHJlbl9qb2luIG9uIGNoaWxkcmVuIChwYXJlbnRfaWQsIGNoaWxkX2lkKTtcbiAgICAgICAgICBDUkVBVEUgVEFCTEUgdmFsZW5jZV9jaGlsZHJlbiAocGFyZW50X2lkIGludGVnZXIgbm90IG51bGwsIGNoaWxkX2lkIGludGVnZXIgbm90IG51bGwsIHBlcm0gaW50ZWdlciBub3QgbnVsbCk7XG4gICAgICAgICAgQ1JFQVRFIFVOSVFVRSBJTkRFWCB2YWxlbmNlX2NoaWxkcmVuX2pvaW4gb24gdmFsZW5jZV9jaGlsZHJlbiAocGFyZW50X2lkLCBjaGlsZF9pZCwgcGVybSk7XG4gICAgICAgIGAsIHtkYXRhYmFzZTogJ2d1aWxkX3Rlc3QnfSk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGFmdGVyOiAoZHJpdmVyKSA9PiB7XG4gICAgICByZXR1cm4gZHJpdmVyLnRlYXJkb3duKClcbiAgICAgIC50aGVuKCgpID0+IHJ1blNRTCgnRFJPUCBEQVRBQkFTRSBndWlsZF90ZXN0OycpKTtcbiAgICB9LFxuICB9LFxuICB7XG4gICAgbmFtZTogJ3Jlc3QnLFxuICAgIGNvbnN0cnVjdG9yOiBSZXN0U3RvcmFnZSxcbiAgICBvcHRzOiB7XG4gICAgICB0ZXJtaW5hbDogdHJ1ZSxcbiAgICAgIGF4aW9zOiBheGlvc01vY2subW9ja3VwKHRlc3RUeXBlKSxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgbmFtZTogJ21lbW9yeScsXG4gICAgY29uc3RydWN0b3I6IE1lbW9yeVN0b3JhZ2UsXG4gICAgb3B0czoge3Rlcm1pbmFsOiB0cnVlfSxcbiAgfSxcbl07XG5cbmNvbnN0IHNhbXBsZU9iamVjdCA9IHtcbiAgbmFtZTogJ3BvdGF0bycsXG4gIGV4dGVuZGVkOiB7XG4gICAgYWN0dWFsOiAncnV0YWJhZ2EnLFxuICAgIG90aGVyVmFsdWU6IDQyLFxuICB9LFxufTtcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbnN0b3JhZ2VUeXBlcy5mb3JFYWNoKChzdG9yZSkgPT4ge1xuICBkZXNjcmliZShzdG9yZS5uYW1lLCAoKSA9PiB7XG4gICAgbGV0IGFjdHVhbFN0b3JlO1xuICAgIGJlZm9yZSgoKSA9PiB7XG4gICAgICByZXR1cm4gKHN0b3JlLmJlZm9yZSB8fCAoKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCkpKShhY3R1YWxTdG9yZSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgYWN0dWFsU3RvcmUgPSBuZXcgc3RvcmUuY29uc3RydWN0b3Ioc3RvcmUub3B0cyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzdXBwb3J0cyBjcmVhdGluZyB2YWx1ZXMgd2l0aCBubyBpZCBmaWVsZCwgYW5kIHJldHJpZXZpbmcgdmFsdWVzJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKHRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKE9iamVjdC5hc3NpZ24oe30sIHNhbXBsZU9iamVjdCwge1t0ZXN0VHlwZS4kaWRdOiBjcmVhdGVkT2JqZWN0LmlkfSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnYWxsb3dzIG9iamVjdHMgdG8gYmUgc3RvcmVkIGJ5IGlkJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKHRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICBjb25zdCBtb2RPYmplY3QgPSBPYmplY3QuYXNzaWduKHt9LCBjcmVhdGVkT2JqZWN0LCB7bmFtZTogJ2NhcnJvdCd9KTtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKHRlc3RUeXBlLCBtb2RPYmplY3QpXG4gICAgICAgIC50aGVuKCh1cGRhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKHRlc3RUeXBlLCB1cGRhdGVkT2JqZWN0LmlkKSlcbiAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKE9iamVjdC5hc3NpZ24oXG4gICAgICAgICAgICB7fSxcbiAgICAgICAgICAgIHNhbXBsZU9iamVjdCxcbiAgICAgICAgICAgIHtbdGVzdFR5cGUuJGlkXTogY3JlYXRlZE9iamVjdC5pZCwgbmFtZTogJ2NhcnJvdCd9XG4gICAgICAgICAgKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnYWxsb3dzIGZvciBkZWxldGlvbiBvZiBvYmplY3RzIGJ5IGlkJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKHRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuZGVsZXRlKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKVxuICAgICAgICAudGhlbigoKSA9PiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZCh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCkpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChudWxsKSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzdXBwb3J0cyBxdWVyeWluZyBvYmplY3RzJyk7XG5cbiAgICBpdCgnY2FuIGFkZCB0byBhIGhhc01hbnkgcmVsYXRpb25zaGlwJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKHRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuYWRkKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDApXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe2NoaWxkcmVuOiBbe1t0ZXN0VHlwZS4kaWRdOiAxMDB9XX0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NhbiBhZGQgdG8gYSBoYXNNYW55IHJlbGF0aW9uc2hpcCB3aXRoIGV4dHJhcycsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZSh0ZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZCh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3ZhbGVuY2VDaGlsZHJlbicsIDEwMCwge3Blcm06IDF9KVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7dmFsZW5jZUNoaWxkcmVuOiBbe1t0ZXN0VHlwZS4kaWRdOiAxMDAsIHBlcm06IDF9XX0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NhbiBtb2RpZnkgdmFsZW5jZSBvbiBhIGhhc01hbnkgcmVsYXRpb25zaGlwJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKHRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuYWRkKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7cGVybTogMX0pXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHt2YWxlbmNlQ2hpbGRyZW46IFt7W3Rlc3RUeXBlLiRpZF06IDEwMCwgcGVybTogMX1dfSk7XG4gICAgICAgIH0pLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUubW9kaWZ5UmVsYXRpb25zaGlwKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7cGVybTogMn0pKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7dmFsZW5jZUNoaWxkcmVuOiBbe1t0ZXN0VHlwZS4kaWRdOiAxMDAsIHBlcm06IDJ9XX0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NhbiByZW1vdmUgZnJvbSBhIGhhc01hbnkgcmVsYXRpb25zaGlwJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKHRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuYWRkKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDApXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe2NoaWxkcmVuOiBbe1t0ZXN0VHlwZS4kaWRdOiAxMDB9XX0pO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5yZW1vdmUodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMCkpXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe2NoaWxkcmVuOiBbXX0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgYWZ0ZXIoKCkgPT4ge1xuICAgICAgcmV0dXJuIChzdG9yZS5hZnRlciB8fCAoKCkgPT4ge30pKShhY3R1YWxTdG9yZSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
