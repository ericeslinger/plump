/* eslint-env node, mocha*/
/* eslint no-shadow: 0 */

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MemoryStorage } from '../storage/memory';
import { RedisStorage } from '../storage/redis';
import { RestStorage } from '../storage/rest';
import MockAdapter from 'axios-mock-adapter';
import { SQLStorage } from '../storage/sql';
import * as axios from 'axios';
import Promise from 'bluebird';
import * as pg from 'pg';
import * as Redis from 'redis';

const testType = {
  $name: 'tests',
  $id: 'id',
  $fields: {
    id: {
      type: 'number',
    },
    name: {
      type: 'string',
    },
    extended: {
      type: 'object',
    },
    children: {
      type: 'hasMany',
      joinTable: 'children',
      parentColumn: 'parent_id',
      childColumn: 'child_id',
      childType: 'tests',
    },
  },
};

const mockAxios = axios.create({
  baseURL: '',
});

function runSQL(command, opts = {}) {
  const connOptions = Object.assign(
    {},
    {
      user: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      charset: 'utf8',
    },
    opts
  );
  const client = new pg.Client(connOptions);
  return new Promise((resolve) => {
    client.connect((err) => {
      if (err) throw err;
      client.query(command, (err) => {
        if (err) throw err;
        client.end((err) => {
          if (err) throw err;
          resolve();
        });
      });
    });
  });
}

function flushRedis() {
  const r = Redis.createClient({
    port: 6379,
    host: 'localhost',
    db: 0,
  });
  return new Promise((resolve) => {
    r.flushdb((err) => {
      if (err) throw err;
      r.quit((err) => {
        if (err) throw err;
        resolve();
      });
    });
  });
}

const storageTypes = [
  {
    name: 'redis',
    constructor: RedisStorage,
    opts: {
      terminal: true,
    },
    before: () => {
      return flushRedis();
    },
    after: (driver) => {
      return flushRedis().then(() => driver.teardown());
    },
  },
  {
    name: 'sql',
    constructor: SQLStorage,
    opts: {
      sql: {
        connection: {
          database: 'guild_test',
        },
      },
      terminal: true,
    },
    before: () => {
      return runSQL('DROP DATABASE if exists guild_test;')
      .then(() => runSQL('CREATE DATABASE guild_test;'))
      .then(() => {
        return runSQL(`
          CREATE SEQUENCE testid_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            MAXVALUE 2147483647
            CACHE 1
            CYCLE;
          CREATE TABLE tests (
            id integer not null primary key DEFAULT nextval('testid_seq'::regclass),
            name text,
            extended jsonb not null default '{}'::jsonb
          );
          CREATE TABLE children (parent_id integer not null, child_id integer not null);
        `, {database: 'guild_test'});
      });
    },
    after: (driver) => {
      return driver.teardown()
      .then(() => runSQL('DROP DATABASE guild_test;'));
    },
  },
  {
    name: 'rest',
    constructor: RestStorage,
    opts: {
      terminal: true,
      axios: mockAxios,
    },
    before: () => {
      const mock = new MockAdapter(mockAxios);
      mock.onGet(/\/tests\/\d+/).reply((c) => {
        console.log('GET');
        console.log(c);
        return [200, {}];
      });
      mock.onPost('/tests').reply((v) => {
        console.log('SET');
        console.log(JSON.parse(v.data));
        return [200, {}];
      });
      return Promise.resolve(true);
    },
  },
  {
    name: 'memory',
    constructor: MemoryStorage,
    opts: {terminal: true},
  },
];

const sampleObject = {
  name: 'potato',
  extended: {
    actual: 'rutabaga',
    otherValue: 42,
  },
};

chai.use(chaiAsPromised);
const expect = chai.expect;

storageTypes.forEach((store) => {
  describe(store.name, () => {
    let actualStore;
    before(() => {
      return (store.before || (() => Promise.resolve()))(actualStore)
      .then(() => {
        actualStore = new store.constructor(store.opts);
      });
    });

    it('supports creating values with no id field, and retrieving values', () => {
      return actualStore.write(testType, sampleObject)
      .then((createdObject) => {
        return expect(actualStore.read(testType, createdObject.id))
        .to.eventually.deep.equal(Object.assign({}, sampleObject, {id: createdObject.id}));
      });
    });

    it('allows objects to be stored by id', () => {
      return actualStore.write(testType, sampleObject)
      .then((createdObject) => {
        const modObject = Object.assign({}, createdObject, {name: 'carrot'});
        return actualStore.write(testType, modObject)
        .then((updatedObject) => {
          return expect(actualStore.read(testType, updatedObject.id))
          .to.eventually.deep.equal(Object.assign({}, sampleObject, {id: createdObject.id, name: 'carrot'}));
        });
      });
    });

    it('allows for deletion of objects by id', () => {
      return actualStore.write(testType, sampleObject)
      .then((createdObject) => {
        return actualStore.delete(testType, createdObject.id)
        .then(() => expect(actualStore.read(testType, createdObject.id)).to.eventually.deep.equal(null));
      });
    });

    it('supports querying objects');

    it('can add to a hasMany relationship', () => {
      return actualStore.write(testType, sampleObject)
      .then((createdObject) => {
        return actualStore.add(testType, createdObject.id, 'children', 100)
        .then(() => expect(actualStore.has(testType, createdObject.id, 'children')).to.eventually.deep.equal([100]));
      });
    });

    it('can remove from a hasMany relationship', () => {
      return actualStore.write(testType, sampleObject)
      .then((createdObject) => {
        return actualStore.add(testType, createdObject.id, 'children', 100)
        .then(() => expect(actualStore.has(testType, createdObject.id, 'children')).to.eventually.deep.equal([100]))
        .then(() => actualStore.remove(testType, createdObject.id, 'children', 100))
        .then(() => expect(actualStore.has(testType, createdObject.id, 'children')).to.eventually.deep.equal([]));
      });
    });

    after(() => {
      return (store.after || (() => {}))(actualStore);
    });
  });
});
