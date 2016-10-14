'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _memory = require('../storage/memory');

var _redis = require('../storage/redis');

var _rest = require('../storage/rest');

var _sql = require('../storage/sql');

var _testType = require('./testType');

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
    axios: _axiosMocking2.default.mockup(_testType.TestType)
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

storageTypes.forEach(function (store, idx) {
  if (idx !== 3) return;
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
        return actualStore.delete(_testType.TestType, createdObject.id).then(function () {
          return expect(actualStore.read(_testType.TestType, createdObject.id)).to.eventually.deep.equal(null);
        });
      });
    });

    it('supports querying objects');

    it('can add to a hasMany relationship', function () {
      return actualStore.write(_testType.TestType, sampleObject).then(function (createdObject) {
        return actualStore.add(_testType.TestType, createdObject.id, 'children', 100).then(function () {
          return expect(actualStore.read(_testType.TestType, createdObject.id, 'children')).to.eventually.deep.equal({
            children: [{
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

    after(function () {
      return (store.after || function () {})(actualStore);
    });
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3Qvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJwZyIsIlJlZGlzIiwicnVuU1FMIiwiY29tbWFuZCIsIm9wdHMiLCJjb25uT3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInVzZXIiLCJob3N0IiwicG9ydCIsImRhdGFiYXNlIiwiY2hhcnNldCIsImNsaWVudCIsIkNsaWVudCIsInJlc29sdmUiLCJjb25uZWN0IiwiZXJyIiwicXVlcnkiLCJlbmQiLCJmbHVzaFJlZGlzIiwiciIsImNyZWF0ZUNsaWVudCIsImRiIiwiZmx1c2hkYiIsInF1aXQiLCJzdG9yYWdlVHlwZXMiLCJuYW1lIiwiY29uc3RydWN0b3IiLCJ0ZXJtaW5hbCIsImJlZm9yZSIsImFmdGVyIiwiZHJpdmVyIiwidGhlbiIsInRlYXJkb3duIiwic3FsIiwiY29ubmVjdGlvbiIsImF4aW9zIiwibW9ja3VwIiwic2FtcGxlT2JqZWN0IiwiZXh0ZW5kZWQiLCJhY3R1YWwiLCJvdGhlclZhbHVlIiwidXNlIiwiZXhwZWN0IiwiZm9yRWFjaCIsInN0b3JlIiwiaWR4IiwiZGVzY3JpYmUiLCJhY3R1YWxTdG9yZSIsIml0Iiwid3JpdGUiLCJjcmVhdGVkT2JqZWN0IiwicmVhZCIsImlkIiwidG8iLCJldmVudHVhbGx5IiwiZGVlcCIsImVxdWFsIiwiJGlkIiwibW9kT2JqZWN0IiwidXBkYXRlZE9iamVjdCIsImRlbGV0ZSIsImFkZCIsImNoaWxkcmVuIiwiY2hpbGRfaWQiLCJwYXJlbnRfaWQiLCJwZXJtIiwidmFsZW5jZUNoaWxkcmVuIiwibW9kaWZ5UmVsYXRpb25zaGlwIiwicmVtb3ZlIl0sIm1hcHBpbmdzIjoiOztBQUdBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0lBQVlBLEU7O0FBQ1o7O0lBQVlDLEs7Ozs7OztrTkFiWjtBQUNBOztBQWNBLFNBQVNDLE1BQVQsQ0FBZ0JDLE9BQWhCLEVBQW9DO0FBQUEsTUFBWEMsSUFB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WUFBTTtBQUNWLGlCQUFPVyxPQUFPSyxZQUFZSSxJQUFaLHFCQUEyQkQsY0FBY0UsRUFBekMsRUFBNkMsVUFBN0MsQ0FBUCxFQUNOQyxFQURNLENBQ0hDLFVBREcsQ0FDUUMsSUFEUixDQUNhQyxLQURiLENBQ21CO0FBQ3hCTSxzQkFBVSxDQUFDO0FBQ1RDLHdCQUFVLEdBREQ7QUFFVEMseUJBQVdkLGNBQWNFO0FBRmhCLGFBQUQ7QUFEYyxXQURuQixDQUFQO0FBT0QsU0FUTSxFQVVOckIsSUFWTSxDQVVEO0FBQUEsaUJBQU1nQixZQUFZcUIsTUFBWixxQkFBNkJsQixjQUFjRSxFQUEzQyxFQUErQyxVQUEvQyxFQUEyRCxHQUEzRCxDQUFOO0FBQUEsU0FWQyxFQVdOckIsSUFYTSxDQVdELFlBQU07QUFDVixpQkFBT1csT0FBT0ssWUFBWUksSUFBWixxQkFBMkJELGNBQWNFLEVBQXpDLEVBQTZDLFVBQTdDLENBQVAsRUFDTkMsRUFETSxDQUNIQyxVQURHLENBQ1FDLElBRFIsQ0FDYUMsS0FEYixDQUNtQixFQUFDTSxVQUFVLEVBQVgsRUFEbkIsQ0FBUDtBQUVELFNBZE0sQ0FBUDtBQWVELE9BakJNLENBQVA7QUFrQkQsS0FuQkQ7O0FBcUJBakMsVUFBTSxZQUFNO0FBQ1YsYUFBTyxDQUFDZSxNQUFNZixLQUFOLElBQWdCLFlBQU0sQ0FBRSxDQUF6QixFQUE0QmtCLFdBQTVCLENBQVA7QUFDRCxLQUZEO0FBR0QsR0EvSEQ7QUFnSUQsQ0FsSUQiLCJmaWxlIjoidGVzdC9zdG9yYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlLCBtb2NoYSovXG4vKiBlc2xpbnQgbm8tc2hhZG93OiAwICovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IHsgTWVtb3J5U3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2UvbWVtb3J5JztcbmltcG9ydCB7IFJlZGlzU3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2UvcmVkaXMnO1xuaW1wb3J0IHsgUmVzdFN0b3JhZ2UgfSBmcm9tICcuLi9zdG9yYWdlL3Jlc3QnO1xuaW1wb3J0IHsgU1FMU3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2Uvc3FsJztcbmltcG9ydCB7IFRlc3RUeXBlIH0gZnJvbSAnLi90ZXN0VHlwZSc7XG5pbXBvcnQgYXhpb3NNb2NrIGZyb20gJy4vYXhpb3NNb2NraW5nJztcbmltcG9ydCBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCAqIGFzIHBnIGZyb20gJ3BnJztcbmltcG9ydCAqIGFzIFJlZGlzIGZyb20gJ3JlZGlzJztcblxuZnVuY3Rpb24gcnVuU1FMKGNvbW1hbmQsIG9wdHMgPSB7fSkge1xuICBjb25zdCBjb25uT3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAge30sXG4gICAge1xuICAgICAgdXNlcjogJ3Bvc3RncmVzJyxcbiAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgcG9ydDogNTQzMixcbiAgICAgIGRhdGFiYXNlOiAncG9zdGdyZXMnLFxuICAgICAgY2hhcnNldDogJ3V0ZjgnLFxuICAgIH0sXG4gICAgb3B0c1xuICApO1xuICBjb25zdCBjbGllbnQgPSBuZXcgcGcuQ2xpZW50KGNvbm5PcHRpb25zKTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgY2xpZW50LmNvbm5lY3QoKGVycikgPT4ge1xuICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgY2xpZW50LnF1ZXJ5KGNvbW1hbmQsIChlcnIpID0+IHtcbiAgICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgICBjbGllbnQuZW5kKChlcnIpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZmx1c2hSZWRpcygpIHtcbiAgY29uc3QgciA9IFJlZGlzLmNyZWF0ZUNsaWVudCh7XG4gICAgcG9ydDogNjM3OSxcbiAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICBkYjogMCxcbiAgfSk7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIHIuZmx1c2hkYigoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICByLnF1aXQoKGVycikgPT4ge1xuICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuY29uc3Qgc3RvcmFnZVR5cGVzID0gW1xuICB7XG4gICAgbmFtZTogJ3JlZGlzJyxcbiAgICBjb25zdHJ1Y3RvcjogUmVkaXNTdG9yYWdlLFxuICAgIG9wdHM6IHtcbiAgICAgIHRlcm1pbmFsOiB0cnVlLFxuICAgIH0sXG4gICAgYmVmb3JlOiAoKSA9PiB7XG4gICAgICByZXR1cm4gZmx1c2hSZWRpcygpO1xuICAgIH0sXG4gICAgYWZ0ZXI6IChkcml2ZXIpID0+IHtcbiAgICAgIHJldHVybiBmbHVzaFJlZGlzKCkudGhlbigoKSA9PiBkcml2ZXIudGVhcmRvd24oKSk7XG4gICAgfSxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdzcWwnLFxuICAgIGNvbnN0cnVjdG9yOiBTUUxTdG9yYWdlLFxuICAgIG9wdHM6IHtcbiAgICAgIHNxbDoge1xuICAgICAgICBjb25uZWN0aW9uOiB7XG4gICAgICAgICAgZGF0YWJhc2U6ICdndWlsZF90ZXN0JyxcbiAgICAgICAgICB1c2VyOiAncG9zdGdyZXMnLFxuICAgICAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgICAgIHBvcnQ6IDU0MzIsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgdGVybWluYWw6IHRydWUsXG4gICAgfSxcbiAgICBiZWZvcmU6ICgpID0+IHtcbiAgICAgIHJldHVybiBydW5TUUwoJ0RST1AgREFUQUJBU0UgaWYgZXhpc3RzIGd1aWxkX3Rlc3Q7JylcbiAgICAgIC50aGVuKCgpID0+IHJ1blNRTCgnQ1JFQVRFIERBVEFCQVNFIGd1aWxkX3Rlc3Q7JykpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBydW5TUUwoYFxuICAgICAgICAgIENSRUFURSBTRVFVRU5DRSB0ZXN0aWRfc2VxXG4gICAgICAgICAgICBTVEFSVCBXSVRIIDFcbiAgICAgICAgICAgIElOQ1JFTUVOVCBCWSAxXG4gICAgICAgICAgICBOTyBNSU5WQUxVRVxuICAgICAgICAgICAgTUFYVkFMVUUgMjE0NzQ4MzY0N1xuICAgICAgICAgICAgQ0FDSEUgMVxuICAgICAgICAgICAgQ1lDTEU7XG4gICAgICAgICAgQ1JFQVRFIFRBQkxFIHRlc3RzIChcbiAgICAgICAgICAgIGlkIGludGVnZXIgbm90IG51bGwgcHJpbWFyeSBrZXkgREVGQVVMVCBuZXh0dmFsKCd0ZXN0aWRfc2VxJzo6cmVnY2xhc3MpLFxuICAgICAgICAgICAgbmFtZSB0ZXh0LFxuICAgICAgICAgICAgZXh0ZW5kZWQganNvbmIgbm90IG51bGwgZGVmYXVsdCAne30nOjpqc29uYlxuICAgICAgICAgICk7XG4gICAgICAgICAgQ1JFQVRFIFRBQkxFIGNoaWxkcmVuIChwYXJlbnRfaWQgaW50ZWdlciBub3QgbnVsbCwgY2hpbGRfaWQgaW50ZWdlciBub3QgbnVsbCk7XG4gICAgICAgICAgQ1JFQVRFIFVOSVFVRSBJTkRFWCBjaGlsZHJlbl9qb2luIG9uIGNoaWxkcmVuIChwYXJlbnRfaWQsIGNoaWxkX2lkKTtcbiAgICAgICAgICBDUkVBVEUgVEFCTEUgdmFsZW5jZV9jaGlsZHJlbiAocGFyZW50X2lkIGludGVnZXIgbm90IG51bGwsIGNoaWxkX2lkIGludGVnZXIgbm90IG51bGwsIHBlcm0gaW50ZWdlciBub3QgbnVsbCk7XG4gICAgICAgICAgQ1JFQVRFIFVOSVFVRSBJTkRFWCB2YWxlbmNlX2NoaWxkcmVuX2pvaW4gb24gdmFsZW5jZV9jaGlsZHJlbiAocGFyZW50X2lkLCBjaGlsZF9pZCwgcGVybSk7XG4gICAgICAgIGAsIHtkYXRhYmFzZTogJ2d1aWxkX3Rlc3QnfSk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGFmdGVyOiAoZHJpdmVyKSA9PiB7XG4gICAgICByZXR1cm4gZHJpdmVyLnRlYXJkb3duKClcbiAgICAgIC50aGVuKCgpID0+IHJ1blNRTCgnRFJPUCBEQVRBQkFTRSBndWlsZF90ZXN0OycpKTtcbiAgICB9LFxuICB9LFxuICB7XG4gICAgbmFtZTogJ3Jlc3QnLFxuICAgIGNvbnN0cnVjdG9yOiBSZXN0U3RvcmFnZSxcbiAgICBvcHRzOiB7XG4gICAgICB0ZXJtaW5hbDogdHJ1ZSxcbiAgICAgIGF4aW9zOiBheGlvc01vY2subW9ja3VwKFRlc3RUeXBlKSxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgbmFtZTogJ21lbW9yeScsXG4gICAgY29uc3RydWN0b3I6IE1lbW9yeVN0b3JhZ2UsXG4gICAgb3B0czoge3Rlcm1pbmFsOiB0cnVlfSxcbiAgfSxcbl07XG5cbmNvbnN0IHNhbXBsZU9iamVjdCA9IHtcbiAgbmFtZTogJ3BvdGF0bycsXG4gIGV4dGVuZGVkOiB7XG4gICAgYWN0dWFsOiAncnV0YWJhZ2EnLFxuICAgIG90aGVyVmFsdWU6IDQyLFxuICB9LFxufTtcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbnN0b3JhZ2VUeXBlcy5mb3JFYWNoKChzdG9yZSwgaWR4KSA9PiB7XG4gIGlmIChpZHggIT09IDMpIHJldHVybjtcbiAgZGVzY3JpYmUoc3RvcmUubmFtZSwgKCkgPT4ge1xuICAgIGxldCBhY3R1YWxTdG9yZTtcbiAgICBiZWZvcmUoKCkgPT4ge1xuICAgICAgcmV0dXJuIChzdG9yZS5iZWZvcmUgfHwgKCgpID0+IFByb21pc2UucmVzb2x2ZSgpKSkoYWN0dWFsU3RvcmUpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIGFjdHVhbFN0b3JlID0gbmV3IHN0b3JlLmNvbnN0cnVjdG9yKHN0b3JlLm9wdHMpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc3VwcG9ydHMgY3JlYXRpbmcgdmFsdWVzIHdpdGggbm8gaWQgZmllbGQsIGFuZCByZXRyaWV2aW5nIHZhbHVlcycsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChPYmplY3QuYXNzaWduKHt9LCBzYW1wbGVPYmplY3QsIHtbVGVzdFR5cGUuJGlkXTogY3JlYXRlZE9iamVjdC5pZH0pKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2FsbG93cyBvYmplY3RzIHRvIGJlIHN0b3JlZCBieSBpZCcsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgY29uc3QgbW9kT2JqZWN0ID0gT2JqZWN0LmFzc2lnbih7fSwgY3JlYXRlZE9iamVjdCwge25hbWU6ICdjYXJyb3QnfSk7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgbW9kT2JqZWN0KVxuICAgICAgICAudGhlbigodXBkYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgdXBkYXRlZE9iamVjdC5pZCkpXG4gICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChPYmplY3QuYXNzaWduKFxuICAgICAgICAgICAge30sXG4gICAgICAgICAgICBzYW1wbGVPYmplY3QsXG4gICAgICAgICAgICB7W1Rlc3RUeXBlLiRpZF06IGNyZWF0ZWRPYmplY3QuaWQsIG5hbWU6ICdjYXJyb3QnfVxuICAgICAgICAgICkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2FsbG93cyBmb3IgZGVsZXRpb24gb2Ygb2JqZWN0cyBieSBpZCcsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmRlbGV0ZShUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZClcbiAgICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwobnVsbCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc3VwcG9ydHMgcXVlcnlpbmcgb2JqZWN0cycpO1xuXG4gICAgaXQoJ2NhbiBhZGQgdG8gYSBoYXNNYW55IHJlbGF0aW9uc2hpcCcsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMTAwKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nKSlcbiAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgIGNoaWxkcmVuOiBbe1xuICAgICAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW4gYWRkIHRvIGEgaGFzTWFueSByZWxhdGlvbnNoaXAgd2l0aCBleHRyYXMnLCAoKSA9PiB7XG4gICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUoVGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICd2YWxlbmNlQ2hpbGRyZW4nLCAxMDAsIHtwZXJtOiAxfSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgdmFsZW5jZUNoaWxkcmVuOiBbe1xuICAgICAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgIHBlcm06IDEsXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW4gbW9kaWZ5IHZhbGVuY2Ugb24gYSBoYXNNYW55IHJlbGF0aW9uc2hpcCcsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3ZhbGVuY2VDaGlsZHJlbicsIDEwMCwge3Blcm06IDF9KVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICB2YWxlbmNlQ2hpbGRyZW46IFt7XG4gICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgcGVybTogMSxcbiAgICAgICAgICAgIH1dLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KS50aGVuKCgpID0+IGFjdHVhbFN0b3JlLm1vZGlmeVJlbGF0aW9uc2hpcChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3ZhbGVuY2VDaGlsZHJlbicsIDEwMCwge3Blcm06IDJ9KSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgdmFsZW5jZUNoaWxkcmVuOiBbe1xuICAgICAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICAgIHBlcm06IDIsXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW4gcmVtb3ZlIGZyb20gYSBoYXNNYW55IHJlbGF0aW9uc2hpcCcsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMTAwKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nKSlcbiAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgIGNoaWxkcmVuOiBbe1xuICAgICAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgICAgICBwYXJlbnRfaWQ6IGNyZWF0ZWRPYmplY3QuaWQsXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUucmVtb3ZlKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nKSlcbiAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtjaGlsZHJlbjogW119KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGFmdGVyKCgpID0+IHtcbiAgICAgIHJldHVybiAoc3RvcmUuYWZ0ZXIgfHwgKCgpID0+IHt9KSkoYWN0dWFsU3RvcmUpO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
