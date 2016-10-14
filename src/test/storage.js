/* eslint-env node, mocha*/
/* eslint no-shadow: 0 */

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MemoryStorage } from '../storage/memory';
import { RedisStorage } from '../storage/redis';
import { RestStorage } from '../storage/rest';
import { SQLStorage } from '../storage/sql';
import { TestType } from './testType';
import axiosMock from './axiosMocking';
import Promise from 'bluebird';
import * as pg from 'pg';
import * as Redis from 'redis';

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
          user: 'postgres',
          host: 'localhost',
          port: 5432,
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
          CREATE UNIQUE INDEX children_join on children (parent_id, child_id);
          CREATE TABLE valence_children (parent_id integer not null, child_id integer not null, perm integer not null);
          CREATE UNIQUE INDEX valence_children_join on valence_children (parent_id, child_id, perm);
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
      axios: axiosMock.mockup(TestType),
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

storageTypes.forEach((store, idx) => {
  if (idx !== 3) return;
  describe(store.name, () => {
    let actualStore;
    before(() => {
      return (store.before || (() => Promise.resolve()))(actualStore)
      .then(() => {
        actualStore = new store.constructor(store.opts);
      });
    });

    it('supports creating values with no id field, and retrieving values', () => {
      return actualStore.write(TestType, sampleObject)
      .then((createdObject) => {
        return expect(actualStore.read(TestType, createdObject.id))
        .to.eventually.deep.equal(Object.assign({}, sampleObject, {[TestType.$id]: createdObject.id}));
      });
    });

    it('allows objects to be stored by id', () => {
      return actualStore.write(TestType, sampleObject)
      .then((createdObject) => {
        const modObject = Object.assign({}, createdObject, {name: 'carrot'});
        return actualStore.write(TestType, modObject)
        .then((updatedObject) => {
          return expect(actualStore.read(TestType, updatedObject.id))
          .to.eventually.deep.equal(Object.assign(
            {},
            sampleObject,
            {[TestType.$id]: createdObject.id, name: 'carrot'}
          ));
        });
      });
    });

    it('allows for deletion of objects by id', () => {
      return actualStore.write(TestType, sampleObject)
      .then((createdObject) => {
        return actualStore.delete(TestType, createdObject.id)
        .then(() => expect(actualStore.read(TestType, createdObject.id)).to.eventually.deep.equal(null));
      });
    });

    it('supports querying objects');

    it('can add to a hasMany relationship', () => {
      return actualStore.write(TestType, sampleObject)
      .then((createdObject) => {
        return actualStore.add(TestType, createdObject.id, 'children', 100)
        .then(() => {
          return expect(actualStore.read(TestType, createdObject.id, 'children'))
          .to.eventually.deep.equal({
            children: [{
              child_id: 100,
              parent_id: createdObject.id,
            }],
          });
        });
      });
    });

    it('can add to a hasMany relationship with extras', () => {
      return actualStore.write(TestType, sampleObject)
      .then((createdObject) => {
        return actualStore.add(TestType, createdObject.id, 'valenceChildren', 100, {perm: 1})
        .then(() => {
          return expect(actualStore.read(TestType, createdObject.id, 'valenceChildren'))
          .to.eventually.deep.equal({
            valenceChildren: [{
              child_id: 100,
              parent_id: createdObject.id,
              perm: 1,
            }],
          });
        });
      });
    });

    it('can modify valence on a hasMany relationship', () => {
      return actualStore.write(TestType, sampleObject)
      .then((createdObject) => {
        return actualStore.add(TestType, createdObject.id, 'valenceChildren', 100, {perm: 1})
        .then(() => {
          return expect(actualStore.read(TestType, createdObject.id, 'valenceChildren'))
          .to.eventually.deep.equal({
            valenceChildren: [{
              child_id: 100,
              parent_id: createdObject.id,
              perm: 1,
            }],
          });
        }).then(() => actualStore.modifyRelationship(TestType, createdObject.id, 'valenceChildren', 100, {perm: 2}))
        .then(() => {
          return expect(actualStore.read(TestType, createdObject.id, 'valenceChildren'))
          .to.eventually.deep.equal({
            valenceChildren: [{
              child_id: 100,
              parent_id: createdObject.id,
              perm: 2,
            }],
          });
        });
      });
    });

    it('can remove from a hasMany relationship', () => {
      return actualStore.write(TestType, sampleObject)
      .then((createdObject) => {
        return actualStore.add(TestType, createdObject.id, 'children', 100)
        .then(() => {
          return expect(actualStore.read(TestType, createdObject.id, 'children'))
          .to.eventually.deep.equal({
            children: [{
              child_id: 100,
              parent_id: createdObject.id,
            }],
          });
        })
        .then(() => actualStore.remove(TestType, createdObject.id, 'children', 100))
        .then(() => {
          return expect(actualStore.read(TestType, createdObject.id, 'children'))
          .to.eventually.deep.equal({children: []});
        });
      });
    });

    after(() => {
      return (store.after || (() => {}))(actualStore);
    });
  });
});
