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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3Qvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJwZyIsIlJlZGlzIiwidGVzdFR5cGUiLCIkbmFtZSIsIiRpZCIsIiRmaWVsZHMiLCJpZCIsInR5cGUiLCJuYW1lIiwiZXh0ZW5kZWQiLCJjaGlsZHJlbiIsInJlbGF0aW9uc2hpcCIsInBhcmVudEZpZWxkIiwiY2hpbGRGaWVsZCIsImNoaWxkVHlwZSIsInJ1blNRTCIsImNvbW1hbmQiLCJvcHRzIiwiY29ubk9wdGlvbnMiLCJPYmplY3QiLCJhc3NpZ24iLCJ1c2VyIiwiaG9zdCIsInBvcnQiLCJkYXRhYmFzZSIsImNoYXJzZXQiLCJjbGllbnQiLCJDbGllbnQiLCJyZXNvbHZlIiwiY29ubmVjdCIsImVyciIsInF1ZXJ5IiwiZW5kIiwiZmx1c2hSZWRpcyIsInIiLCJjcmVhdGVDbGllbnQiLCJkYiIsImZsdXNoZGIiLCJxdWl0Iiwic3RvcmFnZVR5cGVzIiwiY29uc3RydWN0b3IiLCJ0ZXJtaW5hbCIsImJlZm9yZSIsImFmdGVyIiwiZHJpdmVyIiwidGhlbiIsInRlYXJkb3duIiwic3FsIiwiY29ubmVjdGlvbiIsImF4aW9zIiwibW9ja3VwIiwic2FtcGxlT2JqZWN0IiwiYWN0dWFsIiwib3RoZXJWYWx1ZSIsInVzZSIsImV4cGVjdCIsImZvckVhY2giLCJzdG9yZSIsImRlc2NyaWJlIiwiYWN0dWFsU3RvcmUiLCJpdCIsIndyaXRlIiwiY3JlYXRlZE9iamVjdCIsInJlYWQiLCJ0byIsImV2ZW50dWFsbHkiLCJkZWVwIiwiZXF1YWwiLCJtb2RPYmplY3QiLCJ1cGRhdGVkT2JqZWN0IiwiZGVsZXRlIiwiYWRkIiwiaGFzIiwicmVtb3ZlIl0sIm1hcHBpbmdzIjoiOztBQUdBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0lBQVlBLEU7O0FBQ1o7O0lBQVlDLEs7Ozs7OztBQVpaO0FBQ0E7O0FBYUEsSUFBTUMsV0FBVztBQUNmQyxTQUFPLE9BRFE7QUFFZkMsT0FBSyxJQUZVO0FBR2ZDLFdBQVM7QUFDUEMsUUFBSTtBQUNGQyxZQUFNO0FBREosS0FERztBQUlQQyxVQUFNO0FBQ0pELFlBQU07QUFERixLQUpDO0FBT1BFLGNBQVU7QUFDUkYsWUFBTTtBQURFLEtBUEg7QUFVUEcsY0FBVTtBQUNSSCxZQUFNLFNBREU7QUFFUkksb0JBQWMsVUFGTjtBQUdSQyxtQkFBYSxXQUhMO0FBSVJDLGtCQUFZLFVBSko7QUFLUkMsaUJBQVc7QUFMSDtBQVZIO0FBSE0sQ0FBakI7O0FBdUJBLFNBQVNDLE1BQVQsQ0FBZ0JDLE9BQWhCLEVBQW9DO0FBQUEsTUFBWEMsSUFBVyx1RUFBSixFQUFJOztBQUNsQyxNQUFNQyxjQUFjQyxPQUFPQyxNQUFQLENBQ2xCLEVBRGtCLEVBRWxCO0FBQ0VDLFVBQU0sVUFEUjtBQUVFQyxVQUFNLFdBRlI7QUFHRUMsVUFBTSxJQUhSO0FBSUVDLGNBQVUsVUFKWjtBQUtFQyxhQUFTO0FBTFgsR0FGa0IsRUFTbEJSLElBVGtCLENBQXBCO0FBV0EsTUFBTVMsU0FBUyxJQUFJMUIsR0FBRzJCLE1BQVAsQ0FBY1QsV0FBZCxDQUFmO0FBQ0EsU0FBTyx1QkFBWSxVQUFDVSxPQUFELEVBQWE7QUFDOUJGLFdBQU9HLE9BQVAsQ0FBZSxVQUFDQyxHQUFELEVBQVM7QUFDdEIsVUFBSUEsR0FBSixFQUFTLE1BQU1BLEdBQU47QUFDVEosYUFBT0ssS0FBUCxDQUFhZixPQUFiLEVBQXNCLFVBQUNjLEdBQUQsRUFBUztBQUM3QixZQUFJQSxHQUFKLEVBQVMsTUFBTUEsR0FBTjtBQUNUSixlQUFPTSxHQUFQLENBQVcsVUFBQ0YsR0FBRCxFQUFTO0FBQ2xCLGNBQUlBLEdBQUosRUFBUyxNQUFNQSxHQUFOO0FBQ1RGO0FBQ0QsU0FIRDtBQUlELE9BTkQ7QUFPRCxLQVREO0FBVUQsR0FYTSxDQUFQO0FBWUQ7O0FBRUQsU0FBU0ssVUFBVCxHQUFzQjtBQUNwQixNQUFNQyxJQUFJakMsTUFBTWtDLFlBQU4sQ0FBbUI7QUFDM0JaLFVBQU0sSUFEcUI7QUFFM0JELFVBQU0sV0FGcUI7QUFHM0JjLFFBQUk7QUFIdUIsR0FBbkIsQ0FBVjtBQUtBLFNBQU8sdUJBQVksVUFBQ1IsT0FBRCxFQUFhO0FBQzlCTSxNQUFFRyxPQUFGLENBQVUsVUFBQ1AsR0FBRCxFQUFTO0FBQ2pCLFVBQUlBLEdBQUosRUFBUyxNQUFNQSxHQUFOO0FBQ1RJLFFBQUVJLElBQUYsQ0FBTyxVQUFDUixHQUFELEVBQVM7QUFDZCxZQUFJQSxHQUFKLEVBQVMsTUFBTUEsR0FBTjtBQUNURjtBQUNELE9BSEQ7QUFJRCxLQU5EO0FBT0QsR0FSTSxDQUFQO0FBU0Q7O0FBRUQsSUFBTVcsZUFBZSxDQUNuQjtBQUNFL0IsUUFBTSxPQURSO0FBRUVnQyxrQ0FGRjtBQUdFdkIsUUFBTTtBQUNKd0IsY0FBVTtBQUROLEdBSFI7QUFNRUMsVUFBUSxrQkFBTTtBQUNaLFdBQU9ULFlBQVA7QUFDRCxHQVJIO0FBU0VVLFNBQU8sZUFBQ0MsTUFBRCxFQUFZO0FBQ2pCLFdBQU9YLGFBQWFZLElBQWIsQ0FBa0I7QUFBQSxhQUFNRCxPQUFPRSxRQUFQLEVBQU47QUFBQSxLQUFsQixDQUFQO0FBQ0Q7QUFYSCxDQURtQixFQWNuQjtBQUNFdEMsUUFBTSxLQURSO0FBRUVnQyw4QkFGRjtBQUdFdkIsUUFBTTtBQUNKOEIsU0FBSztBQUNIQyxrQkFBWTtBQUNWeEIsa0JBQVUsWUFEQTtBQUVWSCxjQUFNLFVBRkk7QUFHVkMsY0FBTSxXQUhJO0FBSVZDLGNBQU07QUFKSTtBQURULEtBREQ7QUFTSmtCLGNBQVU7QUFUTixHQUhSO0FBY0VDLFVBQVEsa0JBQU07QUFDWixXQUFPM0IsT0FBTyxxQ0FBUCxFQUNOOEIsSUFETSxDQUNEO0FBQUEsYUFBTTlCLE9BQU8sNkJBQVAsQ0FBTjtBQUFBLEtBREMsRUFFTjhCLElBRk0sQ0FFRCxZQUFNO0FBQ1YsYUFBTzlCLHVnQkFjSixFQUFDUyxVQUFVLFlBQVgsRUFkSSxDQUFQO0FBZUQsS0FsQk0sQ0FBUDtBQW1CRCxHQWxDSDtBQW1DRW1CLFNBQU8sZUFBQ0MsTUFBRCxFQUFZO0FBQ2pCLFdBQU9BLE9BQU9FLFFBQVAsR0FDTkQsSUFETSxDQUNEO0FBQUEsYUFBTTlCLE9BQU8sMkJBQVAsQ0FBTjtBQUFBLEtBREMsQ0FBUDtBQUVEO0FBdENILENBZG1CLEVBc0RuQjtBQUNFUCxRQUFNLE1BRFI7QUFFRWdDLGdDQUZGO0FBR0V2QixRQUFNO0FBQ0p3QixjQUFVLElBRE47QUFFSlEsV0FBTyx1QkFBVUMsTUFBVixDQUFpQmhELFFBQWpCO0FBRkg7QUFIUixDQXREbUIsRUE4RG5CO0FBQ0VNLFFBQU0sUUFEUjtBQUVFZ0Msb0NBRkY7QUFHRXZCLFFBQU0sRUFBQ3dCLFVBQVUsSUFBWDtBQUhSLENBOURtQixDQUFyQjs7QUFxRUEsSUFBTVUsZUFBZTtBQUNuQjNDLFFBQU0sUUFEYTtBQUVuQkMsWUFBVTtBQUNSMkMsWUFBUSxVQURBO0FBRVJDLGdCQUFZO0FBRko7QUFGUyxDQUFyQjs7QUFRQSxlQUFLQyxHQUFMO0FBQ0EsSUFBTUMsU0FBUyxlQUFLQSxNQUFwQjs7QUFFQWhCLGFBQWFpQixPQUFiLENBQXFCLFVBQUNDLEtBQUQsRUFBVztBQUM5QkMsV0FBU0QsTUFBTWpELElBQWYsRUFBcUIsWUFBTTtBQUN6QixRQUFJbUQsb0JBQUo7QUFDQWpCLFdBQU8sWUFBTTtBQUNYLGFBQU8sQ0FBQ2UsTUFBTWYsTUFBTixJQUFpQjtBQUFBLGVBQU0sbUJBQVFkLE9BQVIsRUFBTjtBQUFBLE9BQWxCLEVBQTRDK0IsV0FBNUMsRUFDTmQsSUFETSxDQUNELFlBQU07QUFDVmMsc0JBQWMsSUFBSUYsTUFBTWpCLFdBQVYsQ0FBc0JpQixNQUFNeEMsSUFBNUIsQ0FBZDtBQUNELE9BSE0sQ0FBUDtBQUlELEtBTEQ7O0FBT0EyQyxPQUFHLGtFQUFILEVBQXVFLFlBQU07QUFDM0UsYUFBT0QsWUFBWUUsS0FBWixDQUFrQjNELFFBQWxCLEVBQTRCaUQsWUFBNUIsRUFDTk4sSUFETSxDQUNELFVBQUNpQixhQUFELEVBQW1CO0FBQ3ZCLGVBQU9QLE9BQU9JLFlBQVlJLElBQVosQ0FBaUI3RCxRQUFqQixFQUEyQjRELGNBQWN4RCxFQUF6QyxDQUFQLEVBQ04wRCxFQURNLENBQ0hDLFVBREcsQ0FDUUMsSUFEUixDQUNhQyxLQURiLENBQ21CaEQsT0FBT0MsTUFBUCxDQUFjLEVBQWQsRUFBa0IrQixZQUFsQixFQUFnQyxFQUFDN0MsSUFBSXdELGNBQWN4RCxFQUFuQixFQUFoQyxDQURuQixDQUFQO0FBRUQsT0FKTSxDQUFQO0FBS0QsS0FORDs7QUFRQXNELE9BQUcsbUNBQUgsRUFBd0MsWUFBTTtBQUM1QyxhQUFPRCxZQUFZRSxLQUFaLENBQWtCM0QsUUFBbEIsRUFBNEJpRCxZQUE1QixFQUNOTixJQURNLENBQ0QsVUFBQ2lCLGFBQUQsRUFBbUI7QUFDdkIsWUFBTU0sWUFBWWpELE9BQU9DLE1BQVAsQ0FBYyxFQUFkLEVBQWtCMEMsYUFBbEIsRUFBaUMsRUFBQ3RELE1BQU0sUUFBUCxFQUFqQyxDQUFsQjtBQUNBLGVBQU9tRCxZQUFZRSxLQUFaLENBQWtCM0QsUUFBbEIsRUFBNEJrRSxTQUE1QixFQUNOdkIsSUFETSxDQUNELFVBQUN3QixhQUFELEVBQW1CO0FBQ3ZCLGlCQUFPZCxPQUFPSSxZQUFZSSxJQUFaLENBQWlCN0QsUUFBakIsRUFBMkJtRSxjQUFjL0QsRUFBekMsQ0FBUCxFQUNOMEQsRUFETSxDQUNIQyxVQURHLENBQ1FDLElBRFIsQ0FDYUMsS0FEYixDQUNtQmhELE9BQU9DLE1BQVAsQ0FBYyxFQUFkLEVBQWtCK0IsWUFBbEIsRUFBZ0MsRUFBQzdDLElBQUl3RCxjQUFjeEQsRUFBbkIsRUFBdUJFLE1BQU0sUUFBN0IsRUFBaEMsQ0FEbkIsQ0FBUDtBQUVELFNBSk0sQ0FBUDtBQUtELE9BUk0sQ0FBUDtBQVNELEtBVkQ7O0FBWUFvRCxPQUFHLHNDQUFILEVBQTJDLFlBQU07QUFDL0MsYUFBT0QsWUFBWUUsS0FBWixDQUFrQjNELFFBQWxCLEVBQTRCaUQsWUFBNUIsRUFDTk4sSUFETSxDQUNELFVBQUNpQixhQUFELEVBQW1CO0FBQ3ZCLGVBQU9ILFlBQVlXLE1BQVosQ0FBbUJwRSxRQUFuQixFQUE2QjRELGNBQWN4RCxFQUEzQyxFQUNOdUMsSUFETSxDQUNEO0FBQUEsaUJBQU1VLE9BQU9JLFlBQVlJLElBQVosQ0FBaUI3RCxRQUFqQixFQUEyQjRELGNBQWN4RCxFQUF6QyxDQUFQLEVBQXFEMEQsRUFBckQsQ0FBd0RDLFVBQXhELENBQW1FQyxJQUFuRSxDQUF3RUMsS0FBeEUsQ0FBOEUsSUFBOUUsQ0FBTjtBQUFBLFNBREMsQ0FBUDtBQUVELE9BSk0sQ0FBUDtBQUtELEtBTkQ7O0FBUUFQLE9BQUcsMkJBQUg7O0FBRUFBLE9BQUcsbUNBQUgsRUFBd0MsWUFBTTtBQUM1QyxhQUFPRCxZQUFZRSxLQUFaLENBQWtCM0QsUUFBbEIsRUFBNEJpRCxZQUE1QixFQUNOTixJQURNLENBQ0QsVUFBQ2lCLGFBQUQsRUFBbUI7QUFDdkIsZUFBT0gsWUFBWVksR0FBWixDQUFnQnJFLFFBQWhCLEVBQTBCNEQsY0FBY3hELEVBQXhDLEVBQTRDLFVBQTVDLEVBQXdELEdBQXhELEVBQ051QyxJQURNLENBQ0Q7QUFBQSxpQkFBTVUsT0FBT0ksWUFBWWEsR0FBWixDQUFnQnRFLFFBQWhCLEVBQTBCNEQsY0FBY3hELEVBQXhDLEVBQTRDLFVBQTVDLENBQVAsRUFBZ0UwRCxFQUFoRSxDQUFtRUMsVUFBbkUsQ0FBOEVDLElBQTlFLENBQW1GQyxLQUFuRixDQUF5RixDQUFDLEdBQUQsQ0FBekYsQ0FBTjtBQUFBLFNBREMsQ0FBUDtBQUVELE9BSk0sQ0FBUDtBQUtELEtBTkQ7O0FBUUFQLE9BQUcsd0NBQUgsRUFBNkMsWUFBTTtBQUNqRCxhQUFPRCxZQUFZRSxLQUFaLENBQWtCM0QsUUFBbEIsRUFBNEJpRCxZQUE1QixFQUNOTixJQURNLENBQ0QsVUFBQ2lCLGFBQUQsRUFBbUI7QUFDdkIsZUFBT0gsWUFBWVksR0FBWixDQUFnQnJFLFFBQWhCLEVBQTBCNEQsY0FBY3hELEVBQXhDLEVBQTRDLFVBQTVDLEVBQXdELEdBQXhELEVBQ051QyxJQURNLENBQ0Q7QUFBQSxpQkFBTVUsT0FBT0ksWUFBWWEsR0FBWixDQUFnQnRFLFFBQWhCLEVBQTBCNEQsY0FBY3hELEVBQXhDLEVBQTRDLFVBQTVDLENBQVAsRUFBZ0UwRCxFQUFoRSxDQUFtRUMsVUFBbkUsQ0FBOEVDLElBQTlFLENBQW1GQyxLQUFuRixDQUF5RixDQUFDLEdBQUQsQ0FBekYsQ0FBTjtBQUFBLFNBREMsRUFFTnRCLElBRk0sQ0FFRDtBQUFBLGlCQUFNYyxZQUFZYyxNQUFaLENBQW1CdkUsUUFBbkIsRUFBNkI0RCxjQUFjeEQsRUFBM0MsRUFBK0MsVUFBL0MsRUFBMkQsR0FBM0QsQ0FBTjtBQUFBLFNBRkMsRUFHTnVDLElBSE0sQ0FHRDtBQUFBLGlCQUFNVSxPQUFPSSxZQUFZYSxHQUFaLENBQWdCdEUsUUFBaEIsRUFBMEI0RCxjQUFjeEQsRUFBeEMsRUFBNEMsVUFBNUMsQ0FBUCxFQUFnRTBELEVBQWhFLENBQW1FQyxVQUFuRSxDQUE4RUMsSUFBOUUsQ0FBbUZDLEtBQW5GLENBQXlGLEVBQXpGLENBQU47QUFBQSxTQUhDLENBQVA7QUFJRCxPQU5NLENBQVA7QUFPRCxLQVJEOztBQVVBeEIsVUFBTSxZQUFNO0FBQ1YsYUFBTyxDQUFDYyxNQUFNZCxLQUFOLElBQWdCLFlBQU0sQ0FBRSxDQUF6QixFQUE0QmdCLFdBQTVCLENBQVA7QUFDRCxLQUZEO0FBR0QsR0E1REQ7QUE2REQsQ0E5REQiLCJmaWxlIjoidGVzdC9zdG9yYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlLCBtb2NoYSovXG4vKiBlc2xpbnQgbm8tc2hhZG93OiAwICovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IHsgTWVtb3J5U3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2UvbWVtb3J5JztcbmltcG9ydCB7IFJlZGlzU3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2UvcmVkaXMnO1xuaW1wb3J0IHsgUmVzdFN0b3JhZ2UgfSBmcm9tICcuLi9zdG9yYWdlL3Jlc3QnO1xuaW1wb3J0IHsgU1FMU3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2Uvc3FsJztcbmltcG9ydCBheGlvc01vY2sgZnJvbSAnLi9heGlvc01vY2tpbmcnO1xuaW1wb3J0IFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0ICogYXMgcGcgZnJvbSAncGcnO1xuaW1wb3J0ICogYXMgUmVkaXMgZnJvbSAncmVkaXMnO1xuXG5jb25zdCB0ZXN0VHlwZSA9IHtcbiAgJG5hbWU6ICd0ZXN0cycsXG4gICRpZDogJ2lkJyxcbiAgJGZpZWxkczoge1xuICAgIGlkOiB7XG4gICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICB9LFxuICAgIG5hbWU6IHtcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgIH0sXG4gICAgZXh0ZW5kZWQ6IHtcbiAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgIH0sXG4gICAgY2hpbGRyZW46IHtcbiAgICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICAgIHJlbGF0aW9uc2hpcDogJ2NoaWxkcmVuJyxcbiAgICAgIHBhcmVudEZpZWxkOiAncGFyZW50X2lkJyxcbiAgICAgIGNoaWxkRmllbGQ6ICdjaGlsZF9pZCcsXG4gICAgICBjaGlsZFR5cGU6ICd0ZXN0cycsXG4gICAgfSxcbiAgfSxcbn07XG5cbmZ1bmN0aW9uIHJ1blNRTChjb21tYW5kLCBvcHRzID0ge30pIHtcbiAgY29uc3QgY29ubk9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgIHt9LFxuICAgIHtcbiAgICAgIHVzZXI6ICdwb3N0Z3JlcycsXG4gICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgIHBvcnQ6IDU0MzIsXG4gICAgICBkYXRhYmFzZTogJ3Bvc3RncmVzJyxcbiAgICAgIGNoYXJzZXQ6ICd1dGY4JyxcbiAgICB9LFxuICAgIG9wdHNcbiAgKTtcbiAgY29uc3QgY2xpZW50ID0gbmV3IHBnLkNsaWVudChjb25uT3B0aW9ucyk7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIGNsaWVudC5jb25uZWN0KChlcnIpID0+IHtcbiAgICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICAgIGNsaWVudC5xdWVyeShjb21tYW5kLCAoZXJyKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICAgICAgY2xpZW50LmVuZCgoZXJyKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGZsdXNoUmVkaXMoKSB7XG4gIGNvbnN0IHIgPSBSZWRpcy5jcmVhdGVDbGllbnQoe1xuICAgIHBvcnQ6IDYzNzksXG4gICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgZGI6IDAsXG4gIH0pO1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICByLmZsdXNoZGIoKGVycikgPT4ge1xuICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgci5xdWl0KChlcnIpID0+IHtcbiAgICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmNvbnN0IHN0b3JhZ2VUeXBlcyA9IFtcbiAge1xuICAgIG5hbWU6ICdyZWRpcycsXG4gICAgY29uc3RydWN0b3I6IFJlZGlzU3RvcmFnZSxcbiAgICBvcHRzOiB7XG4gICAgICB0ZXJtaW5hbDogdHJ1ZSxcbiAgICB9LFxuICAgIGJlZm9yZTogKCkgPT4ge1xuICAgICAgcmV0dXJuIGZsdXNoUmVkaXMoKTtcbiAgICB9LFxuICAgIGFmdGVyOiAoZHJpdmVyKSA9PiB7XG4gICAgICByZXR1cm4gZmx1c2hSZWRpcygpLnRoZW4oKCkgPT4gZHJpdmVyLnRlYXJkb3duKCkpO1xuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnc3FsJyxcbiAgICBjb25zdHJ1Y3RvcjogU1FMU3RvcmFnZSxcbiAgICBvcHRzOiB7XG4gICAgICBzcWw6IHtcbiAgICAgICAgY29ubmVjdGlvbjoge1xuICAgICAgICAgIGRhdGFiYXNlOiAnZ3VpbGRfdGVzdCcsXG4gICAgICAgICAgdXNlcjogJ3Bvc3RncmVzJyxcbiAgICAgICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgICAgICBwb3J0OiA1NDMyLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHRlcm1pbmFsOiB0cnVlLFxuICAgIH0sXG4gICAgYmVmb3JlOiAoKSA9PiB7XG4gICAgICByZXR1cm4gcnVuU1FMKCdEUk9QIERBVEFCQVNFIGlmIGV4aXN0cyBndWlsZF90ZXN0OycpXG4gICAgICAudGhlbigoKSA9PiBydW5TUUwoJ0NSRUFURSBEQVRBQkFTRSBndWlsZF90ZXN0OycpKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gcnVuU1FMKGBcbiAgICAgICAgICBDUkVBVEUgU0VRVUVOQ0UgdGVzdGlkX3NlcVxuICAgICAgICAgICAgU1RBUlQgV0lUSCAxXG4gICAgICAgICAgICBJTkNSRU1FTlQgQlkgMVxuICAgICAgICAgICAgTk8gTUlOVkFMVUVcbiAgICAgICAgICAgIE1BWFZBTFVFIDIxNDc0ODM2NDdcbiAgICAgICAgICAgIENBQ0hFIDFcbiAgICAgICAgICAgIENZQ0xFO1xuICAgICAgICAgIENSRUFURSBUQUJMRSB0ZXN0cyAoXG4gICAgICAgICAgICBpZCBpbnRlZ2VyIG5vdCBudWxsIHByaW1hcnkga2V5IERFRkFVTFQgbmV4dHZhbCgndGVzdGlkX3NlcSc6OnJlZ2NsYXNzKSxcbiAgICAgICAgICAgIG5hbWUgdGV4dCxcbiAgICAgICAgICAgIGV4dGVuZGVkIGpzb25iIG5vdCBudWxsIGRlZmF1bHQgJ3t9Jzo6anNvbmJcbiAgICAgICAgICApO1xuICAgICAgICAgIENSRUFURSBUQUJMRSBjaGlsZHJlbiAocGFyZW50X2lkIGludGVnZXIgbm90IG51bGwsIGNoaWxkX2lkIGludGVnZXIgbm90IG51bGwpO1xuICAgICAgICBgLCB7ZGF0YWJhc2U6ICdndWlsZF90ZXN0J30pO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBhZnRlcjogKGRyaXZlcikgPT4ge1xuICAgICAgcmV0dXJuIGRyaXZlci50ZWFyZG93bigpXG4gICAgICAudGhlbigoKSA9PiBydW5TUUwoJ0RST1AgREFUQUJBU0UgZ3VpbGRfdGVzdDsnKSk7XG4gICAgfSxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdyZXN0JyxcbiAgICBjb25zdHJ1Y3RvcjogUmVzdFN0b3JhZ2UsXG4gICAgb3B0czoge1xuICAgICAgdGVybWluYWw6IHRydWUsXG4gICAgICBheGlvczogYXhpb3NNb2NrLm1vY2t1cCh0ZXN0VHlwZSksXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdtZW1vcnknLFxuICAgIGNvbnN0cnVjdG9yOiBNZW1vcnlTdG9yYWdlLFxuICAgIG9wdHM6IHt0ZXJtaW5hbDogdHJ1ZX0sXG4gIH0sXG5dO1xuXG5jb25zdCBzYW1wbGVPYmplY3QgPSB7XG4gIG5hbWU6ICdwb3RhdG8nLFxuICBleHRlbmRlZDoge1xuICAgIGFjdHVhbDogJ3J1dGFiYWdhJyxcbiAgICBvdGhlclZhbHVlOiA0MixcbiAgfSxcbn07XG5cbmNoYWkudXNlKGNoYWlBc1Byb21pc2VkKTtcbmNvbnN0IGV4cGVjdCA9IGNoYWkuZXhwZWN0O1xuXG5zdG9yYWdlVHlwZXMuZm9yRWFjaCgoc3RvcmUpID0+IHtcbiAgZGVzY3JpYmUoc3RvcmUubmFtZSwgKCkgPT4ge1xuICAgIGxldCBhY3R1YWxTdG9yZTtcbiAgICBiZWZvcmUoKCkgPT4ge1xuICAgICAgcmV0dXJuIChzdG9yZS5iZWZvcmUgfHwgKCgpID0+IFByb21pc2UucmVzb2x2ZSgpKSkoYWN0dWFsU3RvcmUpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIGFjdHVhbFN0b3JlID0gbmV3IHN0b3JlLmNvbnN0cnVjdG9yKHN0b3JlLm9wdHMpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc3VwcG9ydHMgY3JlYXRpbmcgdmFsdWVzIHdpdGggbm8gaWQgZmllbGQsIGFuZCByZXRyaWV2aW5nIHZhbHVlcycsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZSh0ZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChPYmplY3QuYXNzaWduKHt9LCBzYW1wbGVPYmplY3QsIHtpZDogY3JlYXRlZE9iamVjdC5pZH0pKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2FsbG93cyBvYmplY3RzIHRvIGJlIHN0b3JlZCBieSBpZCcsICgpID0+IHtcbiAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZSh0ZXN0VHlwZSwgc2FtcGxlT2JqZWN0KVxuICAgICAgLnRoZW4oKGNyZWF0ZWRPYmplY3QpID0+IHtcbiAgICAgICAgY29uc3QgbW9kT2JqZWN0ID0gT2JqZWN0LmFzc2lnbih7fSwgY3JlYXRlZE9iamVjdCwge25hbWU6ICdjYXJyb3QnfSk7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS53cml0ZSh0ZXN0VHlwZSwgbW9kT2JqZWN0KVxuICAgICAgICAudGhlbigodXBkYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICAgIHJldHVybiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZCh0ZXN0VHlwZSwgdXBkYXRlZE9iamVjdC5pZCkpXG4gICAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChPYmplY3QuYXNzaWduKHt9LCBzYW1wbGVPYmplY3QsIHtpZDogY3JlYXRlZE9iamVjdC5pZCwgbmFtZTogJ2NhcnJvdCd9KSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnYWxsb3dzIGZvciBkZWxldGlvbiBvZiBvYmplY3RzIGJ5IGlkJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKHRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuZGVsZXRlKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKVxuICAgICAgICAudGhlbigoKSA9PiBleHBlY3QoYWN0dWFsU3RvcmUucmVhZCh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCkpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChudWxsKSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzdXBwb3J0cyBxdWVyeWluZyBvYmplY3RzJyk7XG5cbiAgICBpdCgnY2FuIGFkZCB0byBhIGhhc01hbnkgcmVsYXRpb25zaGlwJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKHRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuYWRkKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDApXG4gICAgICAgIC50aGVuKCgpID0+IGV4cGVjdChhY3R1YWxTdG9yZS5oYXModGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoWzEwMF0pKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NhbiByZW1vdmUgZnJvbSBhIGhhc01hbnkgcmVsYXRpb25zaGlwJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKHRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICByZXR1cm4gYWN0dWFsU3RvcmUuYWRkKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkLCAnY2hpbGRyZW4nLCAxMDApXG4gICAgICAgIC50aGVuKCgpID0+IGV4cGVjdChhY3R1YWxTdG9yZS5oYXModGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoWzEwMF0pKVxuICAgICAgICAudGhlbigoKSA9PiBhY3R1YWxTdG9yZS5yZW1vdmUodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMCkpXG4gICAgICAgIC50aGVuKCgpID0+IGV4cGVjdChhY3R1YWxTdG9yZS5oYXModGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW10pKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgYWZ0ZXIoKCkgPT4ge1xuICAgICAgcmV0dXJuIChzdG9yZS5hZnRlciB8fCAoKCkgPT4ge30pKShhY3R1YWxTdG9yZSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
