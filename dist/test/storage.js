'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _memory = require('../storage/memory');

var _redis = require('../storage/redis');

var _rest = require('../storage/rest');

var _sql = require('../storage/sql');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _pg = require('pg');

var pg = _interopRequireWildcard(_pg);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-env node, mocha*/
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

var storageTypes = [{
  name: 'redis',
  constructor: _redis.RedisStorage,
  opts: {},
  after: function after(driver) {
    return driver.teardown();
  }
}, {
  name: 'sql',
  constructor: _sql.SQLStorage,
  opts: {
    connection: {
      database: 'guild_test'
    }
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
  opts: {}
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
      parentIdField: 'parent_id',
      childIdField: 'child_id',
      childType: 'tests'
    }
  }
};

_chai2.default.use(_chaiAsPromised2.default);
var expect = _chai2.default.expect;

storageTypes.shift();
storageTypes.shift();
storageTypes.shift();

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
//# sourceMappingURL=data:application/json;base64,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NEIsWUFBNUIsRUFDTixJQURNLENBQ0QsVUFBQyxhQUFELEVBQW1CO0FBQ3ZCLGVBQU8sWUFBWSxHQUFaLENBQWdCLFFBQWhCLEVBQTBCLGNBQWMsRUFBeEMsRUFBNEMsVUFBNUMsRUFBd0QsR0FBeEQsRUFDTixJQURNLENBQ0Q7QUFBQSxpQkFBTSxPQUFPLFlBQVksR0FBWixDQUFnQixRQUFoQixFQUEwQixjQUFjLEVBQXhDLEVBQTRDLFVBQTVDLENBQVAsRUFBZ0UsRUFBaEUsQ0FBbUUsVUFBbkUsQ0FBOEUsSUFBOUUsQ0FBbUYsS0FBbkYsQ0FBeUYsQ0FBQyxHQUFELENBQXpGLENBQU47QUFBQSxTQURDLEVBRU4sSUFGTSxDQUVEO0FBQUEsaUJBQU0sWUFBWSxNQUFaLENBQW1CLFFBQW5CLEVBQTZCLGNBQWMsRUFBM0MsRUFBK0MsVUFBL0MsRUFBMkQsR0FBM0QsQ0FBTjtBQUFBLFNBRkMsRUFHTixJQUhNLENBR0Q7QUFBQSxpQkFBTSxPQUFPLFlBQVksR0FBWixDQUFnQixRQUFoQixFQUEwQixjQUFjLEVBQXhDLEVBQTRDLFVBQTVDLENBQVAsRUFBZ0UsRUFBaEUsQ0FBbUUsVUFBbkUsQ0FBOEUsSUFBOUUsQ0FBbUYsS0FBbkYsQ0FBeUYsRUFBekYsQ0FBTjtBQUFBLFNBSEMsQ0FBUDtBQUlELE9BTk0sQ0FBUDtBQU9ELEtBUkQ7O0FBVUEsVUFBTSxZQUFNO0FBQ1YsYUFBTyxDQUFDLE1BQU0sS0FBTixJQUFnQixZQUFNLENBQUUsQ0FBekIsRUFBNEIsV0FBNUIsQ0FBUDtBQUNELEtBRkQ7QUFHRCxHQTVERDtBQTZERCxDQTlERCIsImZpbGUiOiJ0ZXN0L3N0b3JhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZW52IG5vZGUsIG1vY2hhKi9cbi8qIGVzbGludCBuby1zaGFkb3c6IDAgKi9cblxuaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5pbXBvcnQgY2hhaUFzUHJvbWlzZWQgZnJvbSAnY2hhaS1hcy1wcm9taXNlZCc7XG5pbXBvcnQgeyBNZW1vcnlTdG9yYWdlIH0gZnJvbSAnLi4vc3RvcmFnZS9tZW1vcnknO1xuaW1wb3J0IHsgUmVkaXNTdG9yYWdlIH0gZnJvbSAnLi4vc3RvcmFnZS9yZWRpcyc7XG5pbXBvcnQgeyBSZXN0U3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2UvcmVzdCc7XG5pbXBvcnQgeyBTUUxTdG9yYWdlIH0gZnJvbSAnLi4vc3RvcmFnZS9zcWwnO1xuaW1wb3J0IFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0ICogYXMgcGcgZnJvbSAncGcnO1xuXG5mdW5jdGlvbiBydW5TUUwoY29tbWFuZCwgb3B0cyA9IHt9KSB7XG4gIGNvbnN0IGNvbm5PcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICB7fSxcbiAgICB7XG4gICAgICB1c2VyOiAncG9zdGdyZXMnLFxuICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgICBwb3J0OiA1NDMyLFxuICAgICAgZGF0YWJhc2U6ICdwb3N0Z3JlcycsXG4gICAgICBjaGFyc2V0OiAndXRmOCcsXG4gICAgfSxcbiAgICBvcHRzXG4gICk7XG4gIGNvbnN0IGNsaWVudCA9IG5ldyBwZy5DbGllbnQoY29ubk9wdGlvbnMpO1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICBjbGllbnQuY29ubmVjdCgoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICBjbGllbnQucXVlcnkoY29tbWFuZCwgKGVycikgPT4ge1xuICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICAgIGNsaWVudC5lbmQoKGVycikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5jb25zdCBzdG9yYWdlVHlwZXMgPSBbXG4gIHtcbiAgICBuYW1lOiAncmVkaXMnLFxuICAgIGNvbnN0cnVjdG9yOiBSZWRpc1N0b3JhZ2UsXG4gICAgb3B0czoge30sXG4gICAgYWZ0ZXI6IChkcml2ZXIpID0+IHtcbiAgICAgIHJldHVybiBkcml2ZXIudGVhcmRvd24oKTtcbiAgICB9LFxuICB9LFxuICB7XG4gICAgbmFtZTogJ3NxbCcsXG4gICAgY29uc3RydWN0b3I6IFNRTFN0b3JhZ2UsXG4gICAgb3B0czoge1xuICAgICAgY29ubmVjdGlvbjoge1xuICAgICAgICBkYXRhYmFzZTogJ2d1aWxkX3Rlc3QnLFxuICAgICAgfSxcbiAgICB9LFxuICAgIGJlZm9yZTogKCkgPT4ge1xuICAgICAgcmV0dXJuIHJ1blNRTCgnRFJPUCBEQVRBQkFTRSBpZiBleGlzdHMgZ3VpbGRfdGVzdDsnKVxuICAgICAgLnRoZW4oKCkgPT4gcnVuU1FMKCdDUkVBVEUgREFUQUJBU0UgZ3VpbGRfdGVzdDsnKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHJ1blNRTChgXG4gICAgICAgICAgQ1JFQVRFIFNFUVVFTkNFIHRlc3RpZF9zZXFcbiAgICAgICAgICAgIFNUQVJUIFdJVEggMVxuICAgICAgICAgICAgSU5DUkVNRU5UIEJZIDFcbiAgICAgICAgICAgIE5PIE1JTlZBTFVFXG4gICAgICAgICAgICBNQVhWQUxVRSAyMTQ3NDgzNjQ3XG4gICAgICAgICAgICBDQUNIRSAxXG4gICAgICAgICAgICBDWUNMRTtcbiAgICAgICAgICBDUkVBVEUgVEFCTEUgdGVzdHMgKFxuICAgICAgICAgICAgaWQgaW50ZWdlciBub3QgbnVsbCBwcmltYXJ5IGtleSBERUZBVUxUIG5leHR2YWwoJ3Rlc3RpZF9zZXEnOjpyZWdjbGFzcyksXG4gICAgICAgICAgICBuYW1lIHRleHQsXG4gICAgICAgICAgICBleHRlbmRlZCBqc29uYiBub3QgbnVsbCBkZWZhdWx0ICd7fSc6Ompzb25iXG4gICAgICAgICAgKTtcbiAgICAgICAgICBDUkVBVEUgVEFCTEUgY2hpbGRyZW4gKHBhcmVudF9pZCBpbnRlZ2VyIG5vdCBudWxsLCBjaGlsZF9pZCBpbnRlZ2VyIG5vdCBudWxsKTtcbiAgICAgICAgYCwge2RhdGFiYXNlOiAnZ3VpbGRfdGVzdCd9KTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgYWZ0ZXI6IChkcml2ZXIpID0+IHtcbiAgICAgIHJldHVybiBkcml2ZXIudGVhcmRvd24oKVxuICAgICAgLnRoZW4oKCkgPT4gcnVuU1FMKCdEUk9QIERBVEFCQVNFIGd1aWxkX3Rlc3Q7JykpO1xuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAncmVzdCcsXG4gICAgY29uc3RydWN0b3I6IFJlc3RTdG9yYWdlLFxuICAgIG9wdHM6IHt9LFxuICB9LFxuICB7XG4gICAgbmFtZTogJ21lbW9yeScsXG4gICAgY29uc3RydWN0b3I6IE1lbW9yeVN0b3JhZ2UsXG4gICAgb3B0czoge3Rlcm1pbmFsOiB0cnVlfSxcbiAgfSxcbl07XG5cbmNvbnN0IHNhbXBsZU9iamVjdCA9IHtcbiAgbmFtZTogJ3BvdGF0bycsXG4gIGV4dGVuZGVkOiB7XG4gICAgYWN0dWFsOiAncnV0YWJhZ2EnLFxuICAgIG90aGVyVmFsdWU6IDQyLFxuICB9LFxufTtcblxuY29uc3QgdGVzdFR5cGUgPSB7XG4gICRuYW1lOiAndGVzdHMnLFxuICAkaWQ6ICdpZCcsXG4gICRmaWVsZHM6IHtcbiAgICBpZDoge1xuICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgfSxcbiAgICBuYW1lOiB7XG4gICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICB9LFxuICAgIGV4dGVuZGVkOiB7XG4gICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICB9LFxuICAgIGNoaWxkcmVuOiB7XG4gICAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgICBwYXJlbnRJZEZpZWxkOiAncGFyZW50X2lkJyxcbiAgICAgIGNoaWxkSWRGaWVsZDogJ2NoaWxkX2lkJyxcbiAgICAgIGNoaWxkVHlwZTogJ3Rlc3RzJyxcbiAgICB9LFxuICB9LFxufTtcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbnN0b3JhZ2VUeXBlcy5zaGlmdCgpO1xuc3RvcmFnZVR5cGVzLnNoaWZ0KCk7XG5zdG9yYWdlVHlwZXMuc2hpZnQoKTtcblxuc3RvcmFnZVR5cGVzLmZvckVhY2goKHN0b3JlKSA9PiB7XG4gIGRlc2NyaWJlKHN0b3JlLm5hbWUsICgpID0+IHtcbiAgICBsZXQgYWN0dWFsU3RvcmU7XG4gICAgYmVmb3JlKCgpID0+IHtcbiAgICAgIHJldHVybiAoc3RvcmUuYmVmb3JlIHx8ICgoKSA9PiBQcm9taXNlLnJlc29sdmUoKSkpKGFjdHVhbFN0b3JlKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBhY3R1YWxTdG9yZSA9IG5ldyBzdG9yZS5jb25zdHJ1Y3RvcihzdG9yZS5vcHRzKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3N1cHBvcnRzIGNyZWF0aW5nIHZhbHVlcyB3aXRoIG5vIGlkIGZpZWxkLCBhbmQgcmV0cmlldmluZyB2YWx1ZXMnLCAoKSA9PiB7XG4gICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUodGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZCh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCkpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoT2JqZWN0LmFzc2lnbih7fSwgc2FtcGxlT2JqZWN0LCB7aWQ6IGNyZWF0ZWRPYmplY3QuaWR9KSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdhbGxvd3Mgb2JqZWN0cyB0byBiZSBzdG9yZWQgYnkgaWQnLCAoKSA9PiB7XG4gICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUodGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IG1vZE9iamVjdCA9IE9iamVjdC5hc3NpZ24oe30sIGNyZWF0ZWRPYmplY3QsIHtuYW1lOiAnY2Fycm90J30pO1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUodGVzdFR5cGUsIG1vZE9iamVjdClcbiAgICAgICAgLnRoZW4oKHVwZGF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQodGVzdFR5cGUsIHVwZGF0ZWRPYmplY3QuaWQpKVxuICAgICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoT2JqZWN0LmFzc2lnbih7fSwgc2FtcGxlT2JqZWN0LCB7aWQ6IGNyZWF0ZWRPYmplY3QuaWQsIG5hbWU6ICdjYXJyb3QnfSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2FsbG93cyBmb3IgZGVsZXRpb24gb2Ygb2JqZWN0cyBieSBpZCcsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZSh0ZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmRlbGV0ZSh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZClcbiAgICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQpKS50by5ldmVudHVhbGx5LmJlLm51bGwpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc3VwcG9ydHMgcXVlcnlpbmcgb2JqZWN0cycpO1xuXG4gICAgaXQoJ2NhbiBhZGQgdG8gYSBoYXNNYW55IHJlbGF0aW9uc2hpcCcsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZSh0ZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZCh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMTAwKVxuICAgICAgICAudGhlbigoKSA9PiBleHBlY3QoYWN0dWFsU3RvcmUuaGFzKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFsxMDBdKSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdjYW4gcmVtb3ZlIGZyb20gYSBoYXNNYW55IHJlbGF0aW9uc2hpcCcsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZSh0ZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLmFkZCh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMTAwKVxuICAgICAgICAudGhlbigoKSA9PiBleHBlY3QoYWN0dWFsU3RvcmUuaGFzKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFsxMDBdKSlcbiAgICAgICAgLnRoZW4oKCkgPT4gYWN0dWFsU3RvcmUucmVtb3ZlKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgICAudGhlbigoKSA9PiBleHBlY3QoYWN0dWFsU3RvcmUuaGFzKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFtdKSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGFmdGVyKCgpID0+IHtcbiAgICAgIHJldHVybiAoc3RvcmUuYWZ0ZXIgfHwgKCgpID0+IHt9KSkoYWN0dWFsU3RvcmUpO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
