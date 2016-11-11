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
    // return Promise.resolve().then(() => driver.teardown());
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
      return runSQL('\n          CREATE SEQUENCE testid_seq\n            START WITH 1\n            INCREMENT BY 1\n            NO MINVALUE\n            MAXVALUE 2147483647\n            CACHE 1\n            CYCLE;\n          CREATE TABLE tests (\n            id integer not null primary key DEFAULT nextval(\'testid_seq\'::regclass),\n            name text,\n            extended jsonb not null default \'{}\'::jsonb\n          );\n          CREATE TABLE children (parent_id integer not null, child_id integer not null);\n          CREATE UNIQUE INDEX children_join on children (parent_id, child_id);\n          CREATE TABLE reactions (parent_id integer not null, child_id integer not null, reaction text not null);\n          CREATE UNIQUE INDEX reactions_join on reactions (parent_id, child_id, reaction);\n          CREATE TABLE valence_children (parent_id integer not null, child_id integer not null, perm integer not null);\n          --CREATE UNIQUE INDEX valence_children_join on valence_children (parent_id, child_id);\n        ', { database: 'guild_test' });
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
        return expect(actualStore.read(_testType.TestType, createdObject.id)).to.eventually.deep.equal(Object.assign({}, sampleObject, _defineProperty({}, _testType.TestType.$id, createdObject.id))).then(function () {
          return actualStore.delete(_testType.TestType, createdObject.id);
        }).then(function () {
          return expect(actualStore.read(_testType.TestType, createdObject.id)).to.eventually.deep.equal(null);
        });
      });
    });

    it('handles relationships with restrictions', function () {
      return actualStore.write(_testType.TestType, sampleObject).then(function (createdObject) {
        return actualStore.add(_testType.TestType, createdObject.id, 'likers', 100).then(function () {
          return actualStore.add(_testType.TestType, createdObject.id, 'likers', 101);
        }).then(function () {
          return actualStore.add(_testType.TestType, createdObject.id, 'agreers', 100);
        }).then(function () {
          return actualStore.add(_testType.TestType, createdObject.id, 'agreers', 101);
        }).then(function () {
          return actualStore.add(_testType.TestType, createdObject.id, 'agreers', 102);
        }).then(function () {
          return expect(actualStore.read(_testType.TestType, createdObject.id, 'likers')).to.eventually.deep.equal({
            likers: [{
              parent_id: 100,
              child_id: createdObject.id
            }, {
              parent_id: 101,
              child_id: createdObject.id
            }]
          });
        }).then(function () {
          return expect(actualStore.read(_testType.TestType, createdObject.id, 'agreers')).to.eventually.deep.equal({
            agreers: [{
              parent_id: 100,
              child_id: createdObject.id
            }, {
              parent_id: 101,
              child_id: createdObject.id
            }, {
              parent_id: 102,
              child_id: createdObject.id
            }]
          });
        });
      });
    });

    it('can add to a hasMany relationship', function () {
      return actualStore.write(_testType.TestType, sampleObject).then(function (createdObject) {
        return actualStore.add(_testType.TestType, createdObject.id, 'children', 100).then(function () {
          return actualStore.add(_testType.TestType, createdObject.id, 'children', 101);
        }).then(function () {
          return actualStore.add(_testType.TestType, createdObject.id, 'children', 102);
        }).then(function () {
          return actualStore.add(_testType.TestType, createdObject.id, 'children', 103);
        }).then(function () {
          return expect(actualStore.read(_testType.TestType, createdObject.id, 'children')).to.eventually.deep.equal({
            children: [{
              child_id: 100,
              parent_id: createdObject.id
            }, {
              child_id: 101,
              parent_id: createdObject.id
            }, {
              child_id: 102,
              parent_id: createdObject.id
            }, {
              child_id: 103,
              parent_id: createdObject.id
            }]
          });
        }).then(function () {
          return expect(actualStore.read(_testType.TestType, 100, 'parents')).to.eventually.deep.equal({
            parents: [{
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

    it('supports queries in hasMany relationships', function () {
      return actualStore.write(_testType.TestType, sampleObject).then(function (createdObject) {
        return actualStore.add(_testType.TestType, createdObject.id, 'queryChildren', 101, { perm: 1 }).then(function () {
          return actualStore.add(_testType.TestType, createdObject.id, 'queryChildren', 102, { perm: 2 });
        }).then(function () {
          return actualStore.add(_testType.TestType, createdObject.id, 'queryChildren', 103, { perm: 3 });
        }).then(function () {
          return expect(actualStore.read(_testType.TestType, createdObject.id, 'queryChildren')).to.eventually.deep.equal({
            queryChildren: [{
              child_id: 102,
              parent_id: createdObject.id,
              perm: 2
            }, {
              child_id: 103,
              parent_id: createdObject.id,
              perm: 3
            }]
          });
        });
      });
    });

    after(function () {
      return (store.after || function () {})(actualStore);
    });
  });
});