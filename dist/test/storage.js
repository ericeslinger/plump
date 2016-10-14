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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3Qvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJwZyIsIlJlZGlzIiwicnVuU1FMIiwiY29tbWFuZCIsIm9wdHMiLCJjb25uT3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInVzZXIiLCJob3N0IiwicG9ydCIsImRhdGFiYXNlIiwiY2hhcnNldCIsImNsaWVudCIsIkNsaWVudCIsInJlc29sdmUiLCJjb25uZWN0IiwiZXJyIiwicXVlcnkiLCJlbmQiLCJmbHVzaFJlZGlzIiwiciIsImNyZWF0ZUNsaWVudCIsImRiIiwiZmx1c2hkYiIsInF1aXQiLCJzdG9yYWdlVHlwZXMiLCJuYW1lIiwiY29uc3RydWN0b3IiLCJ0ZXJtaW5hbCIsImJlZm9yZSIsImFmdGVyIiwiZHJpdmVyIiwidGhlbiIsInRlYXJkb3duIiwic3FsIiwiY29ubmVjdGlvbiIsImF4aW9zIiwibW9ja3VwIiwic2FtcGxlT2JqZWN0IiwiZXh0ZW5kZWQiLCJhY3R1YWwiLCJvdGhlclZhbHVlIiwidXNlIiwiZXhwZWN0IiwiZm9yRWFjaCIsInN0b3JlIiwiZGVzY3JpYmUiLCJhY3R1YWxTdG9yZSIsIml0Iiwid3JpdGUiLCJjcmVhdGVkT2JqZWN0IiwicmVhZCIsImlkIiwidG8iLCJldmVudHVhbGx5IiwiZGVlcCIsImVxdWFsIiwiJGlkIiwibW9kT2JqZWN0IiwidXBkYXRlZE9iamVjdCIsImRlbGV0ZSIsImFkZCIsImNoaWxkcmVuIiwiY2hpbGRfaWQiLCJwYXJlbnRfaWQiLCJwZXJtIiwidmFsZW5jZUNoaWxkcmVuIiwibW9kaWZ5UmVsYXRpb25zaGlwIiwicmVtb3ZlIl0sIm1hcHBpbmdzIjoiOztBQUdBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0lBQVlBLEU7O0FBQ1o7O0lBQVlDLEs7Ozs7OztrTkFiWjtBQUNBOztBQWNBLFNBQVNDLE1BQVQsQ0FBZ0JDLE9BQWhCLEVBQW9DO0FBQUEsTUFBWEMsSUFBVyx5REFB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LEVBQXpDLEVBQTZDLFVBQTdDLENBQVAsRUFDTkMsRUFETSxDQUNIQyxVQURHLENBQ1FDLElBRFIsQ0FDYUMsS0FEYixDQUNtQjtBQUN4Qk0sc0JBQVUsQ0FBQztBQUNUQyx3QkFBVSxHQUREO0FBRVRDLHlCQUFXZCxjQUFjRTtBQUZoQixhQUFEO0FBRGMsV0FEbkIsQ0FBUDtBQU9ELFNBVE0sRUFVTnBCLElBVk0sQ0FVRDtBQUFBLGlCQUFNZSxZQUFZcUIsTUFBWixxQkFBNkJsQixjQUFjRSxFQUEzQyxFQUErQyxVQUEvQyxFQUEyRCxHQUEzRCxDQUFOO0FBQUEsU0FWQyxFQVdOcEIsSUFYTSxDQVdELFlBQU07QUFDVixpQkFBT1csT0FBT0ksWUFBWUksSUFBWixxQkFBMkJELGNBQWNFLEVBQXpDLEVBQTZDLFVBQTdDLENBQVAsRUFDTkMsRUFETSxDQUNIQyxVQURHLENBQ1FDLElBRFIsQ0FDYUMsS0FEYixDQUNtQixFQUFDTSxVQUFVLEVBQVgsRUFEbkIsQ0FBUDtBQUVELFNBZE0sQ0FBUDtBQWVELE9BakJNLENBQVA7QUFrQkQsS0FuQkQ7O0FBcUJBaEMsVUFBTSxZQUFNO0FBQ1YsYUFBTyxDQUFDZSxNQUFNZixLQUFOLElBQWdCLFlBQU0sQ0FBRSxDQUF6QixFQUE0QmlCLFdBQTVCLENBQVA7QUFDRCxLQUZEO0FBR0QsR0EvSEQ7QUFnSUQsQ0FqSUQiLCJmaWxlIjoidGVzdC9zdG9yYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlLCBtb2NoYSovXG4vKiBlc2xpbnQgbm8tc2hhZG93OiAwICovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IHsgTWVtb3J5U3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2UvbWVtb3J5JztcbmltcG9ydCB7IFJlZGlzU3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2UvcmVkaXMnO1xuaW1wb3J0IHsgUmVzdFN0b3JhZ2UgfSBmcm9tICcuLi9zdG9yYWdlL3Jlc3QnO1xuaW1wb3J0IHsgU1FMU3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2Uvc3FsJztcbmltcG9ydCB7IFRlc3RUeXBlIH0gZnJvbSAnLi90ZXN0VHlwZSc7XG5pbXBvcnQgYXhpb3NNb2NrIGZyb20gJy4vYXhpb3NNb2NraW5nJztcbmltcG9ydCBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCAqIGFzIHBnIGZyb20gJ3BnJztcbmltcG9ydCAqIGFzIFJlZGlzIGZyb20gJ3JlZGlzJztcblxuZnVuY3Rpb24gcnVuU1FMKGNvbW1hbmQsIG9wdHMgPSB7fSkge1xuICBjb25zdCBjb25uT3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAge30sXG4gICAge1xuICAgICAgdXNlcjogJ3Bvc3RncmVzJyxcbiAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgcG9ydDogNTQzMixcbiAgICAgIGRhdGFiYXNlOiAncG9zdGdyZXMnLFxuICAgICAgY2hhcnNldDogJ3V0ZjgnLFxuICAgIH0sXG4gICAgb3B0c1xuICApO1xuICBjb25zdCBjbGllbnQgPSBuZXcgcGcuQ2xpZW50KGNvbm5PcHRpb25zKTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgY2xpZW50LmNvbm5lY3QoKGVycikgPT4ge1xuICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgY2xpZW50LnF1ZXJ5KGNvbW1hbmQsIChlcnIpID0+IHtcbiAgICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgICBjbGllbnQuZW5kKChlcnIpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZmx1c2hSZWRpcygpIHtcbiAgY29uc3QgciA9IFJlZGlzLmNyZWF0ZUNsaWVudCh7XG4gICAgcG9ydDogNjM3OSxcbiAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICBkYjogMCxcbiAgfSk7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIHIuZmx1c2hkYigoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICByLnF1aXQoKGVycikgPT4ge1xuICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuY29uc3Qgc3RvcmFnZVR5cGVzID0gW1xuICB7XG4gICAgbmFtZTogJ3JlZGlzJyxcbiAgICBjb25zdHJ1Y3RvcjogUmVkaXNTdG9yYWdlLFxuICAgIG9wdHM6IHtcbiAgICAgIHRlcm1pbmFsOiB0cnVlLFxuICAgIH0sXG4gICAgYmVmb3JlOiAoKSA9PiB7XG4gICAgICByZXR1cm4gZmx1c2hSZWRpcygpO1xuICAgIH0sXG4gICAgYWZ0ZXI6IChkcml2ZXIpID0+IHtcbiAgICAgIHJldHVybiBmbHVzaFJlZGlzKCkudGhlbigoKSA9PiBkcml2ZXIudGVhcmRvd24oKSk7XG4gICAgfSxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdzcWwnLFxuICAgIGNvbnN0cnVjdG9yOiBTUUxTdG9yYWdlLFxuICAgIG9wdHM6IHtcbiAgICAgIHNxbDoge1xuICAgICAgICBjb25uZWN0aW9uOiB7XG4gICAgICAgICAgZGF0YWJhc2U6ICdndWlsZF90ZXN0JyxcbiAgICAgICAgICB1c2VyOiAncG9zdGdyZXMnLFxuICAgICAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgICAgIHBvcnQ6IDU0MzIsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgdGVybWluYWw6IHRydWUsXG4gICAgfSxcbiAgICBiZWZvcmU6ICgpID0+IHtcbiAgICAgIHJldHVybiBydW5TUUwoJ0RST1AgREFUQUJBU0UgaWYgZXhpc3RzIGd1aWxkX3Rlc3Q7JylcbiAgICAgIC50aGVuKCgpID0+IHJ1blNRTCgnQ1JFQVRFIERBVEFCQVNFIGd1aWxkX3Rlc3Q7JykpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBydW5TUUwoYFxuICAgICAgICAgIENSRUFURSBTRVFVRU5DRSB0ZXN0aWRfc2VxXG4gICAgICAgICAgICBTVEFSVCBXSVRIIDFcbiAgICAgICAgICAgIElOQ1JFTUVOVCBCWSAxXG4gICAgICAgICAgICBOTyBNSU5WQUxVRVxuICAgICAgICAgICAgTUFYVkFMVUUgMjE0NzQ4MzY0N1xuICAgICAgICAgICAgQ0FDSEUgMVxuICAgICAgICAgICAgQ1lDTEU7XG4gICAgICAgICAgQ1JFQVRFIFRBQkxFIHRlc3RzIChcbiAgICAgICAgICAgIGlkIGludGVnZXIgbm90IG51bGwgcHJpbWFyeSBrZXkgREVGQVVMVCBuZXh0dmFsKCd0ZXN0aWRfc2VxJzo6cmVnY2xhc3MpLFxuICAgICAgICAgICAgbmFtZSB0ZXh0LFxuICAgICAgICAgICAgZXh0ZW5kZWQganNvbmIgbm90IG51bGwgZGVmYXVsdCAne30nOjpqc29uYlxuICAgICAgICAgICk7XG4gICAgICAgICAgQ1JFQVRFIFRBQkxFIGNoaWxkcmVuIChwYXJlbnRfaWQgaW50ZWdlciBub3QgbnVsbCwgY2hpbGRfaWQgaW50ZWdlciBub3QgbnVsbCk7XG4gICAgICAgICAgQ1JFQVRFIFVOSVFVRSBJTkRFWCBjaGlsZHJlbl9qb2luIG9uIGNoaWxkcmVuIChwYXJlbnRfaWQsIGNoaWxkX2lkKTtcbiAgICAgICAgICBDUkVBVEUgVEFCTEUgdmFsZW5jZV9jaGlsZHJlbiAocGFyZW50X2lkIGludGVnZXIgbm90IG51bGwsIGNoaWxkX2lkIGludGVnZXIgbm90IG51bGwsIHBlcm0gaW50ZWdlciBub3QgbnVsbCk7XG4gICAgICAgICAgQ1JFQVRFIFVOSVFVRSBJTkRFWCB2YWxlbmNlX2NoaWxkcmVuX2pvaW4gb24gdmFsZW5jZV9jaGlsZHJlbiAocGFyZW50X2lkLCBjaGlsZF9pZCwgcGVybSk7XG4gICAgICAgIGAsIHtkYXRhYmFzZTogJ2d1aWxkX3Rlc3QnfSk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGFmdGVyOiAoZHJpdmVyKSA9PiB7XG4gICAgICByZXR1cm4gZHJpdmVyLnRlYXJkb3duKClcbiAgICAgIC50aGVuKCgpID0+IHJ1blNRTCgnRFJPUCBEQVRBQkFTRSBndWlsZF90ZXN0OycpKTtcbiAgICB9LFxuICB9LFxuICB7XG4gICAgbmFtZTogJ3Jlc3QnLFxuICAgIGNvbnN0cnVjdG9yOiBSZXN0U3RvcmFnZSxcbiAgICBvcHRzOiB7XG4gICAgICB0ZXJtaW5hbDogdHJ1ZSxcbiAgICAgIGF4aW9zOiBheGlvc01vY2subW9ja3VwKFRlc3RUeXBlKSxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgbmFtZTogJ21lbW9yeScsXG4gICAgY29uc3RydWN0b3I6IE1lbW9yeVN0b3JhZ2UsXG4gICAgb3B0czoge3Rlcm1pbmFsOiB0cnVlfSxcbiAgfSxcbl07XG5cbmNvbnN0IHNhbXBsZU9iamVjdCA9IHtcbiAgbmFtZTogJ3BvdGF0bycsXG4gIGV4dGVuZGVkOiB7XG4gICAgYWN0dWFsOiAncnV0YWJhZ2EnLFxuICAgIG90aGVyVmFsdWU6IDQyLFxuICB9LFxufTtcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbnN0b3JhZ2VUeXBlcy5mb3JFYWNoKChzdG9yZSkgPT4ge1xuICBkZXNjcmliZShzdG9yZS5uYW1lLCAoKSA9PiB7XG4gICAgbGV0IGFjdHVhbFN0b3JlO1xuICAgIGJlZm9yZSgoKSA9PiB7XG4gICAgICByZXR1cm4gKHN0b3JlLmJlZm9yZSB8fCAoKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCkpKShhY3R1YWxTdG9yZSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgYWN0dWFsU3RvcmUgPSBuZXcgc3RvcmUuY29uc3RydWN0b3Ioc3RvcmUub3B0cyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzdXBwb3J0cyBjcmVhdGluZyB2YWx1ZXMgd2l0aCBubyBpZCBmaWVsZCwgYW5kIHJldHJpZXZpbmcgdmFsdWVzJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKE9iamVjdC5hc3NpZ24oe30sIHNhbXBsZU9iamVjdCwge1tUZXN0VHlwZS4kaWRdOiBjcmVhdGVkT2JqZWN0LmlkfSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnYWxsb3dzIG9iamVjdHMgdG8gYmUgc3RvcmVkIGJ5IGlkJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICBjb25zdCBtb2RPYmplY3QgPSBPYmplY3QuYXNzaWduKHt9LCBjcmVhdGVkT2JqZWN0LCB7bmFtZTogJ2NhcnJvdCd9KTtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBtb2RPYmplY3QpXG4gICAgICAgIC50aGVuKCh1cGRhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCB1cGRhdGVkT2JqZWN0LmlkKSlcbiAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKE9iamVjdC5hc3NpZ24oXG4gICAgICAgICAgICB7fSxcbiAgICAgICAgICAgIHNhbXBsZU9iamVjdCxcbiAgICAgICAgICAgIHtbVGVzdFR5cGUuJGlkXTogY3JlYXRlZE9iamVjdC5pZCwgbmFtZTogJ2NhcnJvdCd9XG4gICAgICAgICAgKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnYWxsb3dzIGZvciBkZWxldGlvbiBvZiBvYmplY3RzIGJ5IGlkJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuZGVsZXRlKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKVxuICAgICAgICAudGhlbigoKSA9PiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCkpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChudWxsKSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzdXBwb3J0cyBxdWVyeWluZyBvYmplY3RzJyk7XG5cbiAgICBpdCgnY2FuIGFkZCB0byBhIGhhc01hbnkgcmVsYXRpb25zaGlwJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDApXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgY2hpbGRyZW46IFt7XG4gICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgIH1dLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NhbiBhZGQgdG8gYSBoYXNNYW55IHJlbGF0aW9uc2hpcCB3aXRoIGV4dHJhcycsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZShUZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZChUZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ3ZhbGVuY2VDaGlsZHJlbicsIDEwMCwge3Blcm06IDF9KVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICB2YWxlbmNlQ2hpbGRyZW46IFt7XG4gICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgcGVybTogMSxcbiAgICAgICAgICAgIH1dLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NhbiBtb2RpZnkgdmFsZW5jZSBvbiBhIGhhc01hbnkgcmVsYXRpb25zaGlwJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7cGVybTogMX0pXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHtcbiAgICAgICAgICAgIHZhbGVuY2VDaGlsZHJlbjogW3tcbiAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgcGFyZW50X2lkOiBjcmVhdGVkT2JqZWN0LmlkLFxuICAgICAgICAgICAgICBwZXJtOiAxLFxuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUubW9kaWZ5UmVsYXRpb25zaGlwKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7cGVybTogMn0pKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7XG4gICAgICAgICAgICB2YWxlbmNlQ2hpbGRyZW46IFt7XG4gICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgICAgcGVybTogMixcbiAgICAgICAgICAgIH1dLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NhbiByZW1vdmUgZnJvbSBhIGhhc01hbnkgcmVsYXRpb25zaGlwJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKFRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuYWRkKFRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDApXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe1xuICAgICAgICAgICAgY2hpbGRyZW46IFt7XG4gICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgICAgIHBhcmVudF9pZDogY3JlYXRlZE9iamVjdC5pZCxcbiAgICAgICAgICAgIH1dLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5yZW1vdmUoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMCkpXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQoVGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoe2NoaWxkcmVuOiBbXX0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgYWZ0ZXIoKCkgPT4ge1xuICAgICAgcmV0dXJuIChzdG9yZS5hZnRlciB8fCAoKCkgPT4ge30pKShhY3R1YWxTdG9yZSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
