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
      joinTable: 'children',
      parentColumn: 'parent_id',
      childColumn: 'child_id',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3Qvc3RvcmFnZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUdBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0lBQVksRTs7QUFDWjs7SUFBWSxLOzs7Ozs7QUFaWjtBQUNBOztBQWFBLElBQU0sV0FBVztBQUNmLFNBQU8sT0FEUTtBQUVmLE9BQUssSUFGVTtBQUdmLFdBQVM7QUFDUCxRQUFJO0FBQ0YsWUFBTTtBQURKLEtBREc7QUFJUCxVQUFNO0FBQ0osWUFBTTtBQURGLEtBSkM7QUFPUCxjQUFVO0FBQ1IsWUFBTTtBQURFLEtBUEg7QUFVUCxjQUFVO0FBQ1IsWUFBTSxTQURFO0FBRVIsaUJBQVcsVUFGSDtBQUdSLG9CQUFjLFdBSE47QUFJUixtQkFBYSxVQUpMO0FBS1IsaUJBQVc7QUFMSDtBQVZIO0FBSE0sQ0FBakI7O0FBdUJBLFNBQVMsTUFBVCxDQUFnQixPQUFoQixFQUFvQztBQUFBLE1BQVgsSUFBVyx5REFBSixFQUFJOztBQUNsQyxNQUFNLGNBQWMsT0FBTyxNQUFQLENBQ2xCLEVBRGtCLEVBRWxCO0FBQ0UsVUFBTSxVQURSO0FBRUUsVUFBTSxXQUZSO0FBR0UsVUFBTSxJQUhSO0FBSUUsY0FBVSxVQUpaO0FBS0UsYUFBUztBQUxYLEdBRmtCLEVBU2xCLElBVGtCLENBQXBCO0FBV0EsTUFBTSxTQUFTLElBQUksR0FBRyxNQUFQLENBQWMsV0FBZCxDQUFmO0FBQ0EsU0FBTyx1QkFBWSxVQUFDLE9BQUQsRUFBYTtBQUM5QixXQUFPLE9BQVAsQ0FBZSxVQUFDLEdBQUQsRUFBUztBQUN0QixVQUFJLEdBQUosRUFBUyxNQUFNLEdBQU47QUFDVCxhQUFPLEtBQVAsQ0FBYSxPQUFiLEVBQXNCLFVBQUMsR0FBRCxFQUFTO0FBQzdCLFlBQUksR0FBSixFQUFTLE1BQU0sR0FBTjtBQUNULGVBQU8sR0FBUCxDQUFXLFVBQUMsR0FBRCxFQUFTO0FBQ2xCLGNBQUksR0FBSixFQUFTLE1BQU0sR0FBTjtBQUNUO0FBQ0QsU0FIRDtBQUlELE9BTkQ7QUFPRCxLQVREO0FBVUQsR0FYTSxDQUFQO0FBWUQ7O0FBRUQsU0FBUyxVQUFULEdBQXNCO0FBQ3BCLE1BQU0sSUFBSSxNQUFNLFlBQU4sQ0FBbUI7QUFDM0IsVUFBTSxJQURxQjtBQUUzQixVQUFNLFdBRnFCO0FBRzNCLFFBQUk7QUFIdUIsR0FBbkIsQ0FBVjtBQUtBLFNBQU8sdUJBQVksVUFBQyxPQUFELEVBQWE7QUFDOUIsTUFBRSxPQUFGLENBQVUsVUFBQyxHQUFELEVBQVM7QUFDakIsVUFBSSxHQUFKLEVBQVMsTUFBTSxHQUFOO0FBQ1QsUUFBRSxJQUFGLENBQU8sVUFBQyxHQUFELEVBQVM7QUFDZCxZQUFJLEdBQUosRUFBUyxNQUFNLEdBQU47QUFDVDtBQUNELE9BSEQ7QUFJRCxLQU5EO0FBT0QsR0FSTSxDQUFQO0FBU0Q7O0FBRUQsSUFBTSxlQUFlLENBQ25CO0FBQ0UsUUFBTSxPQURSO0FBRUUsa0NBRkY7QUFHRSxRQUFNO0FBQ0osY0FBVTtBQUROLEdBSFI7QUFNRSxVQUFRLGtCQUFNO0FBQ1osV0FBTyxZQUFQO0FBQ0QsR0FSSDtBQVNFLFNBQU8sZUFBQyxNQUFELEVBQVk7QUFDakIsV0FBTyxhQUFhLElBQWIsQ0FBa0I7QUFBQSxhQUFNLE9BQU8sUUFBUCxFQUFOO0FBQUEsS0FBbEIsQ0FBUDtBQUNEO0FBWEgsQ0FEbUIsRUFjbkI7QUFDRSxRQUFNLEtBRFI7QUFFRSw4QkFGRjtBQUdFLFFBQU07QUFDSixTQUFLO0FBQ0gsa0JBQVk7QUFDVixrQkFBVSxZQURBO0FBRVYsY0FBTSxVQUZJO0FBR1YsY0FBTSxXQUhJO0FBSVYsY0FBTTtBQUpJO0FBRFQsS0FERDtBQVNKLGNBQVU7QUFUTixHQUhSO0FBY0UsVUFBUSxrQkFBTTtBQUNaLFdBQU8sT0FBTyxxQ0FBUCxFQUNOLElBRE0sQ0FDRDtBQUFBLGFBQU0sT0FBTyw2QkFBUCxDQUFOO0FBQUEsS0FEQyxFQUVOLElBRk0sQ0FFRCxZQUFNO0FBQ1YsYUFBTyx1Z0JBY0osRUFBQyxVQUFVLFlBQVgsRUFkSSxDQUFQO0FBZUQsS0FsQk0sQ0FBUDtBQW1CRCxHQWxDSDtBQW1DRSxTQUFPLGVBQUMsTUFBRCxFQUFZO0FBQ2pCLFdBQU8sT0FBTyxRQUFQLEdBQ04sSUFETSxDQUNEO0FBQUEsYUFBTSxPQUFPLDJCQUFQLENBQU47QUFBQSxLQURDLENBQVA7QUFFRDtBQXRDSCxDQWRtQixFQXNEbkI7QUFDRSxRQUFNLE1BRFI7QUFFRSxnQ0FGRjtBQUdFLFFBQU07QUFDSixjQUFVLElBRE47QUFFSixXQUFPLHVCQUFVLE1BQVYsQ0FBaUIsUUFBakI7QUFGSDtBQUhSLENBdERtQixFQThEbkI7QUFDRSxRQUFNLFFBRFI7QUFFRSxvQ0FGRjtBQUdFLFFBQU0sRUFBQyxVQUFVLElBQVg7QUFIUixDQTlEbUIsQ0FBckI7O0FBcUVBLElBQU0sZUFBZTtBQUNuQixRQUFNLFFBRGE7QUFFbkIsWUFBVTtBQUNSLFlBQVEsVUFEQTtBQUVSLGdCQUFZO0FBRko7QUFGUyxDQUFyQjs7QUFRQSxlQUFLLEdBQUw7QUFDQSxJQUFNLFNBQVMsZUFBSyxNQUFwQjs7QUFFQSxhQUFhLE9BQWIsQ0FBcUIsVUFBQyxLQUFELEVBQVc7QUFDOUIsV0FBUyxNQUFNLElBQWYsRUFBcUIsWUFBTTtBQUN6QixRQUFJLG9CQUFKO0FBQ0EsV0FBTyxZQUFNO0FBQ1gsYUFBTyxDQUFDLE1BQU0sTUFBTixJQUFpQjtBQUFBLGVBQU0sbUJBQVEsT0FBUixFQUFOO0FBQUEsT0FBbEIsRUFBNEMsV0FBNUMsRUFDTixJQURNLENBQ0QsWUFBTTtBQUNWLHNCQUFjLElBQUksTUFBTSxXQUFWLENBQXNCLE1BQU0sSUFBNUIsQ0FBZDtBQUNELE9BSE0sQ0FBUDtBQUlELEtBTEQ7O0FBT0EsT0FBRyxrRUFBSCxFQUF1RSxZQUFNO0FBQzNFLGFBQU8sWUFBWSxLQUFaLENBQWtCLFFBQWxCLEVBQTRCLFlBQTVCLEVBQ04sSUFETSxDQUNELFVBQUMsYUFBRCxFQUFtQjtBQUN2QixlQUFPLE9BQU8sWUFBWSxJQUFaLENBQWlCLFFBQWpCLEVBQTJCLGNBQWMsRUFBekMsQ0FBUCxFQUNOLEVBRE0sQ0FDSCxVQURHLENBQ1EsSUFEUixDQUNhLEtBRGIsQ0FDbUIsT0FBTyxNQUFQLENBQWMsRUFBZCxFQUFrQixZQUFsQixFQUFnQyxFQUFDLElBQUksY0FBYyxFQUFuQixFQUFoQyxDQURuQixDQUFQO0FBRUQsT0FKTSxDQUFQO0FBS0QsS0FORDs7QUFRQSxPQUFHLG1DQUFILEVBQXdDLFlBQU07QUFDNUMsYUFBTyxZQUFZLEtBQVosQ0FBa0IsUUFBbEIsRUFBNEIsWUFBNUIsRUFDTixJQURNLENBQ0QsVUFBQyxhQUFELEVBQW1CO0FBQ3ZCLFlBQU0sWUFBWSxPQUFPLE1BQVAsQ0FBYyxFQUFkLEVBQWtCLGFBQWxCLEVBQWlDLEVBQUMsTUFBTSxRQUFQLEVBQWpDLENBQWxCO0FBQ0EsZUFBTyxZQUFZLEtBQVosQ0FBa0IsUUFBbEIsRUFBNEIsU0FBNUIsRUFDTixJQURNLENBQ0QsVUFBQyxhQUFELEVBQW1CO0FBQ3ZCLGlCQUFPLE9BQU8sWUFBWSxJQUFaLENBQWlCLFFBQWpCLEVBQTJCLGNBQWMsRUFBekMsQ0FBUCxFQUNOLEVBRE0sQ0FDSCxVQURHLENBQ1EsSUFEUixDQUNhLEtBRGIsQ0FDbUIsT0FBTyxNQUFQLENBQWMsRUFBZCxFQUFrQixZQUFsQixFQUFnQyxFQUFDLElBQUksY0FBYyxFQUFuQixFQUF1QixNQUFNLFFBQTdCLEVBQWhDLENBRG5CLENBQVA7QUFFRCxTQUpNLENBQVA7QUFLRCxPQVJNLENBQVA7QUFTRCxLQVZEOztBQVlBLE9BQUcsc0NBQUgsRUFBMkMsWUFBTTtBQUMvQyxhQUFPLFlBQVksS0FBWixDQUFrQixRQUFsQixFQUE0QixZQUE1QixFQUNOLElBRE0sQ0FDRCxVQUFDLGFBQUQsRUFBbUI7QUFDdkIsZUFBTyxZQUFZLE1BQVosQ0FBbUIsUUFBbkIsRUFBNkIsY0FBYyxFQUEzQyxFQUNOLElBRE0sQ0FDRDtBQUFBLGlCQUFNLE9BQU8sWUFBWSxJQUFaLENBQWlCLFFBQWpCLEVBQTJCLGNBQWMsRUFBekMsQ0FBUCxFQUFxRCxFQUFyRCxDQUF3RCxVQUF4RCxDQUFtRSxJQUFuRSxDQUF3RSxLQUF4RSxDQUE4RSxJQUE5RSxDQUFOO0FBQUEsU0FEQyxDQUFQO0FBRUQsT0FKTSxDQUFQO0FBS0QsS0FORDs7QUFRQSxPQUFHLDJCQUFIOztBQUVBLE9BQUcsbUNBQUgsRUFBd0MsWUFBTTtBQUM1QyxhQUFPLFlBQVksS0FBWixDQUFrQixRQUFsQixFQUE0QixZQUE1QixFQUNOLElBRE0sQ0FDRCxVQUFDLGFBQUQsRUFBbUI7QUFDdkIsZUFBTyxZQUFZLEdBQVosQ0FBZ0IsUUFBaEIsRUFBMEIsY0FBYyxFQUF4QyxFQUE0QyxVQUE1QyxFQUF3RCxHQUF4RCxFQUNOLElBRE0sQ0FDRDtBQUFBLGlCQUFNLE9BQU8sWUFBWSxHQUFaLENBQWdCLFFBQWhCLEVBQTBCLGNBQWMsRUFBeEMsRUFBNEMsVUFBNUMsQ0FBUCxFQUFnRSxFQUFoRSxDQUFtRSxVQUFuRSxDQUE4RSxJQUE5RSxDQUFtRixLQUFuRixDQUF5RixDQUFDLEdBQUQsQ0FBekYsQ0FBTjtBQUFBLFNBREMsQ0FBUDtBQUVELE9BSk0sQ0FBUDtBQUtELEtBTkQ7O0FBUUEsT0FBRyx3Q0FBSCxFQUE2QyxZQUFNO0FBQ2pELGFBQU8sWUFBWSxLQUFaLENBQWtCLFFBQWxCLEVBQTRCLFlBQTVCLEVBQ04sSUFETSxDQUNELFVBQUMsYUFBRCxFQUFtQjtBQUN2QixlQUFPLFlBQVksR0FBWixDQUFnQixRQUFoQixFQUEwQixjQUFjLEVBQXhDLEVBQTRDLFVBQTVDLEVBQXdELEdBQXhELEVBQ04sSUFETSxDQUNEO0FBQUEsaUJBQU0sT0FBTyxZQUFZLEdBQVosQ0FBZ0IsUUFBaEIsRUFBMEIsY0FBYyxFQUF4QyxFQUE0QyxVQUE1QyxDQUFQLEVBQWdFLEVBQWhFLENBQW1FLFVBQW5FLENBQThFLElBQTlFLENBQW1GLEtBQW5GLENBQXlGLENBQUMsR0FBRCxDQUF6RixDQUFOO0FBQUEsU0FEQyxFQUVOLElBRk0sQ0FFRDtBQUFBLGlCQUFNLFlBQVksTUFBWixDQUFtQixRQUFuQixFQUE2QixjQUFjLEVBQTNDLEVBQStDLFVBQS9DLEVBQTJELEdBQTNELENBQU47QUFBQSxTQUZDLEVBR04sSUFITSxDQUdEO0FBQUEsaUJBQU0sT0FBTyxZQUFZLEdBQVosQ0FBZ0IsUUFBaEIsRUFBMEIsY0FBYyxFQUF4QyxFQUE0QyxVQUE1QyxDQUFQLEVBQWdFLEVBQWhFLENBQW1FLFVBQW5FLENBQThFLElBQTlFLENBQW1GLEtBQW5GLENBQXlGLEVBQXpGLENBQU47QUFBQSxTQUhDLENBQVA7QUFJRCxPQU5NLENBQVA7QUFPRCxLQVJEOztBQVVBLFVBQU0sWUFBTTtBQUNWLGFBQU8sQ0FBQyxNQUFNLEtBQU4sSUFBZ0IsWUFBTSxDQUFFLENBQXpCLEVBQTRCLFdBQTVCLENBQVA7QUFDRCxLQUZEO0FBR0QsR0E1REQ7QUE2REQsQ0E5REQiLCJmaWxlIjoidGVzdC9zdG9yYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlLCBtb2NoYSovXG4vKiBlc2xpbnQgbm8tc2hhZG93OiAwICovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IHsgTWVtb3J5U3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2UvbWVtb3J5JztcbmltcG9ydCB7IFJlZGlzU3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2UvcmVkaXMnO1xuaW1wb3J0IHsgUmVzdFN0b3JhZ2UgfSBmcm9tICcuLi9zdG9yYWdlL3Jlc3QnO1xuaW1wb3J0IHsgU1FMU3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2Uvc3FsJztcbmltcG9ydCBheGlvc01vY2sgZnJvbSAnLi9heGlvc01vY2tpbmcnO1xuaW1wb3J0IFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0ICogYXMgcGcgZnJvbSAncGcnO1xuaW1wb3J0ICogYXMgUmVkaXMgZnJvbSAncmVkaXMnO1xuXG5jb25zdCB0ZXN0VHlwZSA9IHtcbiAgJG5hbWU6ICd0ZXN0cycsXG4gICRpZDogJ2lkJyxcbiAgJGZpZWxkczoge1xuICAgIGlkOiB7XG4gICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICB9LFxuICAgIG5hbWU6IHtcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgIH0sXG4gICAgZXh0ZW5kZWQ6IHtcbiAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgIH0sXG4gICAgY2hpbGRyZW46IHtcbiAgICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICAgIGpvaW5UYWJsZTogJ2NoaWxkcmVuJyxcbiAgICAgIHBhcmVudENvbHVtbjogJ3BhcmVudF9pZCcsXG4gICAgICBjaGlsZENvbHVtbjogJ2NoaWxkX2lkJyxcbiAgICAgIGNoaWxkVHlwZTogJ3Rlc3RzJyxcbiAgICB9LFxuICB9LFxufTtcblxuZnVuY3Rpb24gcnVuU1FMKGNvbW1hbmQsIG9wdHMgPSB7fSkge1xuICBjb25zdCBjb25uT3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAge30sXG4gICAge1xuICAgICAgdXNlcjogJ3Bvc3RncmVzJyxcbiAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgcG9ydDogNTQzMixcbiAgICAgIGRhdGFiYXNlOiAncG9zdGdyZXMnLFxuICAgICAgY2hhcnNldDogJ3V0ZjgnLFxuICAgIH0sXG4gICAgb3B0c1xuICApO1xuICBjb25zdCBjbGllbnQgPSBuZXcgcGcuQ2xpZW50KGNvbm5PcHRpb25zKTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgY2xpZW50LmNvbm5lY3QoKGVycikgPT4ge1xuICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgY2xpZW50LnF1ZXJ5KGNvbW1hbmQsIChlcnIpID0+IHtcbiAgICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgICBjbGllbnQuZW5kKChlcnIpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZmx1c2hSZWRpcygpIHtcbiAgY29uc3QgciA9IFJlZGlzLmNyZWF0ZUNsaWVudCh7XG4gICAgcG9ydDogNjM3OSxcbiAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICBkYjogMCxcbiAgfSk7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIHIuZmx1c2hkYigoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICByLnF1aXQoKGVycikgPT4ge1xuICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuY29uc3Qgc3RvcmFnZVR5cGVzID0gW1xuICB7XG4gICAgbmFtZTogJ3JlZGlzJyxcbiAgICBjb25zdHJ1Y3RvcjogUmVkaXNTdG9yYWdlLFxuICAgIG9wdHM6IHtcbiAgICAgIHRlcm1pbmFsOiB0cnVlLFxuICAgIH0sXG4gICAgYmVmb3JlOiAoKSA9PiB7XG4gICAgICByZXR1cm4gZmx1c2hSZWRpcygpO1xuICAgIH0sXG4gICAgYWZ0ZXI6IChkcml2ZXIpID0+IHtcbiAgICAgIHJldHVybiBmbHVzaFJlZGlzKCkudGhlbigoKSA9PiBkcml2ZXIudGVhcmRvd24oKSk7XG4gICAgfSxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdzcWwnLFxuICAgIGNvbnN0cnVjdG9yOiBTUUxTdG9yYWdlLFxuICAgIG9wdHM6IHtcbiAgICAgIHNxbDoge1xuICAgICAgICBjb25uZWN0aW9uOiB7XG4gICAgICAgICAgZGF0YWJhc2U6ICdndWlsZF90ZXN0JyxcbiAgICAgICAgICB1c2VyOiAncG9zdGdyZXMnLFxuICAgICAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgICAgIHBvcnQ6IDU0MzIsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgdGVybWluYWw6IHRydWUsXG4gICAgfSxcbiAgICBiZWZvcmU6ICgpID0+IHtcbiAgICAgIHJldHVybiBydW5TUUwoJ0RST1AgREFUQUJBU0UgaWYgZXhpc3RzIGd1aWxkX3Rlc3Q7JylcbiAgICAgIC50aGVuKCgpID0+IHJ1blNRTCgnQ1JFQVRFIERBVEFCQVNFIGd1aWxkX3Rlc3Q7JykpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBydW5TUUwoYFxuICAgICAgICAgIENSRUFURSBTRVFVRU5DRSB0ZXN0aWRfc2VxXG4gICAgICAgICAgICBTVEFSVCBXSVRIIDFcbiAgICAgICAgICAgIElOQ1JFTUVOVCBCWSAxXG4gICAgICAgICAgICBOTyBNSU5WQUxVRVxuICAgICAgICAgICAgTUFYVkFMVUUgMjE0NzQ4MzY0N1xuICAgICAgICAgICAgQ0FDSEUgMVxuICAgICAgICAgICAgQ1lDTEU7XG4gICAgICAgICAgQ1JFQVRFIFRBQkxFIHRlc3RzIChcbiAgICAgICAgICAgIGlkIGludGVnZXIgbm90IG51bGwgcHJpbWFyeSBrZXkgREVGQVVMVCBuZXh0dmFsKCd0ZXN0aWRfc2VxJzo6cmVnY2xhc3MpLFxuICAgICAgICAgICAgbmFtZSB0ZXh0LFxuICAgICAgICAgICAgZXh0ZW5kZWQganNvbmIgbm90IG51bGwgZGVmYXVsdCAne30nOjpqc29uYlxuICAgICAgICAgICk7XG4gICAgICAgICAgQ1JFQVRFIFRBQkxFIGNoaWxkcmVuIChwYXJlbnRfaWQgaW50ZWdlciBub3QgbnVsbCwgY2hpbGRfaWQgaW50ZWdlciBub3QgbnVsbCk7XG4gICAgICAgIGAsIHtkYXRhYmFzZTogJ2d1aWxkX3Rlc3QnfSk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGFmdGVyOiAoZHJpdmVyKSA9PiB7XG4gICAgICByZXR1cm4gZHJpdmVyLnRlYXJkb3duKClcbiAgICAgIC50aGVuKCgpID0+IHJ1blNRTCgnRFJPUCBEQVRBQkFTRSBndWlsZF90ZXN0OycpKTtcbiAgICB9LFxuICB9LFxuICB7XG4gICAgbmFtZTogJ3Jlc3QnLFxuICAgIGNvbnN0cnVjdG9yOiBSZXN0U3RvcmFnZSxcbiAgICBvcHRzOiB7XG4gICAgICB0ZXJtaW5hbDogdHJ1ZSxcbiAgICAgIGF4aW9zOiBheGlvc01vY2subW9ja3VwKHRlc3RUeXBlKSxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgbmFtZTogJ21lbW9yeScsXG4gICAgY29uc3RydWN0b3I6IE1lbW9yeVN0b3JhZ2UsXG4gICAgb3B0czoge3Rlcm1pbmFsOiB0cnVlfSxcbiAgfSxcbl07XG5cbmNvbnN0IHNhbXBsZU9iamVjdCA9IHtcbiAgbmFtZTogJ3BvdGF0bycsXG4gIGV4dGVuZGVkOiB7XG4gICAgYWN0dWFsOiAncnV0YWJhZ2EnLFxuICAgIG90aGVyVmFsdWU6IDQyLFxuICB9LFxufTtcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbnN0b3JhZ2VUeXBlcy5mb3JFYWNoKChzdG9yZSkgPT4ge1xuICBkZXNjcmliZShzdG9yZS5uYW1lLCAoKSA9PiB7XG4gICAgbGV0IGFjdHVhbFN0b3JlO1xuICAgIGJlZm9yZSgoKSA9PiB7XG4gICAgICByZXR1cm4gKHN0b3JlLmJlZm9yZSB8fCAoKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCkpKShhY3R1YWxTdG9yZSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgYWN0dWFsU3RvcmUgPSBuZXcgc3RvcmUuY29uc3RydWN0b3Ioc3RvcmUub3B0cyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzdXBwb3J0cyBjcmVhdGluZyB2YWx1ZXMgd2l0aCBubyBpZCBmaWVsZCwgYW5kIHJldHJpZXZpbmcgdmFsdWVzJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKHRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KGFjdHVhbFN0b3JlLnJlYWQodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKE9iamVjdC5hc3NpZ24oe30sIHNhbXBsZU9iamVjdCwge2lkOiBjcmVhdGVkT2JqZWN0LmlkfSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnYWxsb3dzIG9iamVjdHMgdG8gYmUgc3RvcmVkIGJ5IGlkJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKHRlc3RUeXBlLCBzYW1wbGVPYmplY3QpXG4gICAgICAudGhlbigoY3JlYXRlZE9iamVjdCkgPT4ge1xuICAgICAgICBjb25zdCBtb2RPYmplY3QgPSBPYmplY3QuYXNzaWduKHt9LCBjcmVhdGVkT2JqZWN0LCB7bmFtZTogJ2NhcnJvdCd9KTtcbiAgICAgICAgcmV0dXJuIGFjdHVhbFN0b3JlLndyaXRlKHRlc3RUeXBlLCBtb2RPYmplY3QpXG4gICAgICAgIC50aGVuKCh1cGRhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKHRlc3RUeXBlLCB1cGRhdGVkT2JqZWN0LmlkKSlcbiAgICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKE9iamVjdC5hc3NpZ24oe30sIHNhbXBsZU9iamVjdCwge2lkOiBjcmVhdGVkT2JqZWN0LmlkLCBuYW1lOiAnY2Fycm90J30pKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdhbGxvd3MgZm9yIGRlbGV0aW9uIG9mIG9iamVjdHMgYnkgaWQnLCAoKSA9PiB7XG4gICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUodGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5kZWxldGUodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQpXG4gICAgICAgIC50aGVuKCgpID0+IGV4cGVjdChhY3R1YWxTdG9yZS5yZWFkKHRlc3RUeXBlLCBjcmVhdGVkT2JqZWN0LmlkKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKG51bGwpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3N1cHBvcnRzIHF1ZXJ5aW5nIG9iamVjdHMnKTtcblxuICAgIGl0KCdjYW4gYWRkIHRvIGEgaGFzTWFueSByZWxhdGlvbnNoaXAnLCAoKSA9PiB7XG4gICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUodGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMClcbiAgICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KGFjdHVhbFN0b3JlLmhhcyh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbMTAwXSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnY2FuIHJlbW92ZSBmcm9tIGEgaGFzTWFueSByZWxhdGlvbnNoaXAnLCAoKSA9PiB7XG4gICAgICByZXR1cm4gYWN0dWFsU3RvcmUud3JpdGUodGVzdFR5cGUsIHNhbXBsZU9iamVjdClcbiAgICAgIC50aGVuKChjcmVhdGVkT2JqZWN0KSA9PiB7XG4gICAgICAgIHJldHVybiBhY3R1YWxTdG9yZS5hZGQodGVzdFR5cGUsIGNyZWF0ZWRPYmplY3QuaWQsICdjaGlsZHJlbicsIDEwMClcbiAgICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KGFjdHVhbFN0b3JlLmhhcyh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbMTAwXSkpXG4gICAgICAgIC50aGVuKCgpID0+IGFjdHVhbFN0b3JlLnJlbW92ZSh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KGFjdHVhbFN0b3JlLmhhcyh0ZXN0VHlwZSwgY3JlYXRlZE9iamVjdC5pZCwgJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbXSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBhZnRlcigoKSA9PiB7XG4gICAgICByZXR1cm4gKHN0b3JlLmFmdGVyIHx8ICgoKSA9PiB7fSkpKGFjdHVhbFN0b3JlKTtcbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
