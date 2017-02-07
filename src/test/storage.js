/* eslint-env node, mocha*/
/* eslint no-shadow: 0 */

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MemoryStorage, RedisStorage, RestStorage, SQLStorage, Plump, $self } from '../index';
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
      // return Promise.resolve().then(() => driver.teardown());
      return flushRedis().then(() => driver.teardown());
    },
  },
  {
    name: 'sql',
    constructor: SQLStorage,
    opts: {
      sql: {
        connection: {
          database: 'plump_test',
          user: 'postgres',
          host: 'localhost',
          port: 5432,
        },
      },
      terminal: true,
    },
    before: () => {
      return runSQL('DROP DATABASE if exists plump_test;')
      .then(() => runSQL('CREATE DATABASE plump_test;'))
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
          CREATE TABLE parent_child_relationship (parent_id integer not null, child_id integer not null);
          CREATE UNIQUE INDEX children_join on parent_child_relationship (parent_id, child_id);
          CREATE TABLE reactions (parent_id integer not null, child_id integer not null, reaction text not null);
          CREATE UNIQUE INDEX reactions_join on reactions (parent_id, child_id, reaction);
          CREATE TABLE valence_children (parent_id integer not null, child_id integer not null, perm integer not null);
          --CREATE UNIQUE INDEX valence_children_join on valence_children (parent_id, child_id);
        `, { database: 'plump_test' });
      });
    },
    after: (driver) => {
      return driver.teardown()
      .then(() => runSQL('DROP DATABASE plump_test;'));
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
    opts: { terminal: true },
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
  if (store.name !== 'redis') return;
  describe(store.name, () => {
    let actualStore;
    before(() => {
      return (store.before || (() => Promise.resolve()))(actualStore)
      .then(() => {
        actualStore = new store.constructor(store.opts);
      });
    });

    describe('core CRUD', () => {
      it('supports creating values with no id field, and retrieving values', () => {
        return actualStore.write(TestType, sampleObject)
        .then((createdObject) => {
          return expect(actualStore.read(TestType, createdObject.id))
          .to.eventually.deep.equal(Object.assign({}, sampleObject, { [TestType.$id]: createdObject.id }));
        });
      });

      it('allows objects to be stored by id', () => {
        return actualStore.write(TestType, sampleObject)
        .then((createdObject) => {
          const modObject = Object.assign({}, createdObject, { name: 'carrot' });
          return actualStore.write(TestType, modObject)
          .then((updatedObject) => {
            return expect(actualStore.read(TestType, updatedObject.id))
            .to.eventually.deep.equal(Object.assign(
              {},
              sampleObject,
              { [TestType.$id]: createdObject.id, name: 'carrot' }
            ));
          });
        });
      });

      it('allows for deletion of objects by id', () => {
        return actualStore.write(TestType, sampleObject)
        .then((createdObject) => {
          return expect(actualStore.read(TestType, createdObject.id))
          .to.eventually.deep.equal(Object.assign({}, sampleObject, { [TestType.$id]: createdObject.id }))
          .then(() => actualStore.delete(TestType, createdObject.id))
          .then(() => expect(actualStore.read(TestType, createdObject.id)).to.eventually.deep.equal(null));
        });
      });
    });

    describe('relationships', () => {
      it('handles relationships with restrictions', () => {
        return actualStore.write(TestType, sampleObject)
        .then((createdObject) => {
          return actualStore.add(TestType, createdObject.id, 'likers', 100)
          .then(() => actualStore.add(TestType, createdObject.id, 'likers', 101))
          .then(() => actualStore.add(TestType, createdObject.id, 'agreers', 100))
          .then(() => actualStore.add(TestType, createdObject.id, 'agreers', 101))
          .then(() => actualStore.add(TestType, createdObject.id, 'agreers', 102))
          .then(() => {
            return expect(actualStore.read(TestType, createdObject.id, 'likers'))
            .to.eventually.deep.equal({
              likers: [
                {
                  parent_id: 100,
                  child_id: createdObject.id,
                },
                {
                  parent_id: 101,
                  child_id: createdObject.id,
                },
              ],
            });
          })
          .then(() => {
            return expect(actualStore.read(TestType, createdObject.id, 'agreers'))
            .to.eventually.deep.equal({
              agreers: [
                {
                  parent_id: 100,
                  child_id: createdObject.id,
                },
                {
                  parent_id: 101,
                  child_id: createdObject.id,
                },
                {
                  parent_id: 102,
                  child_id: createdObject.id,
                },
              ],
            });
          });
        });
      });

      it('can fetch a base and hasmany in one read', () => {
        return actualStore.write(TestType, sampleObject)
        .then((createdObject) => {
          return actualStore.add(TestType, createdObject.id, 'children', 200)
          .then(() => actualStore.add(TestType, createdObject.id, 'children', 201))
          .then(() => actualStore.add(TestType, createdObject.id, 'children', 202))
          .then(() => actualStore.add(TestType, createdObject.id, 'children', 203))
          .then(() => {
            return expect(actualStore.read(TestType, createdObject.id, ['children', $self]))
            .to.eventually.deep.equal(
              Object.assign(
                {},
                createdObject,
                {
                  children: [
                    {
                      child_id: 200,
                      parent_id: createdObject.id,
                    },
                    {
                      child_id: 201,
                      parent_id: createdObject.id,
                    },
                    {
                      child_id: 202,
                      parent_id: createdObject.id,
                    },
                    {
                      child_id: 203,
                      parent_id: createdObject.id,
                    },
                  ],
                }
              )
            );
          });
        });
      });

      it('can add to a hasMany relationship', () => {
        return actualStore.write(TestType, sampleObject)
        .then((createdObject) => {
          return actualStore.add(TestType, createdObject.id, 'children', 100)
          .then(() => actualStore.add(TestType, createdObject.id, 'children', 101))
          .then(() => actualStore.add(TestType, createdObject.id, 'children', 102))
          .then(() => actualStore.add(TestType, createdObject.id, 'children', 103))
          .then(() => actualStore.add(TestType, 500, 'children', createdObject.id))
          .then(() => {
            return expect(actualStore.read(TestType, createdObject.id, ['children']))
            .to.eventually.deep.equal({
              children: [
                {
                  child_id: 100,
                  parent_id: createdObject.id,
                },
                {
                  child_id: 101,
                  parent_id: createdObject.id,
                },
                {
                  child_id: 102,
                  parent_id: createdObject.id,
                },
                {
                  child_id: 103,
                  parent_id: createdObject.id,
                },
              ],
            });
          }).then(() => {
            return expect(actualStore.read(TestType, 100, ['parents']))
            .to.eventually.deep.equal({
              parents: [
                {
                  child_id: 100,
                  parent_id: createdObject.id,
                },
              ],
            });
          });
        });
      });

      it('can add to a hasMany relationship with extras', () => {
        return actualStore.write(TestType, sampleObject)
        .then((createdObject) => {
          return actualStore.add(TestType, createdObject.id, 'valenceChildren', 100, { perm: 1 })
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
          return actualStore.add(TestType, createdObject.id, 'valenceChildren', 100, { perm: 1 })
          .then(() => {
            return expect(actualStore.read(TestType, createdObject.id, 'valenceChildren'))
            .to.eventually.deep.equal({
              valenceChildren: [{
                child_id: 100,
                parent_id: createdObject.id,
                perm: 1,
              }],
            });
          }).then(() => actualStore.modifyRelationship(TestType, createdObject.id, 'valenceChildren', 100, { perm: 2 }))
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
            .to.eventually.deep.equal({ children: [] });
          });
        });
      });

      it('supports queries in hasMany relationships', () => {
        return actualStore.write(TestType, sampleObject)
        .then((createdObject) => {
          return actualStore.add(TestType, createdObject.id, 'queryChildren', 101, { perm: 1 })
          .then(() => actualStore.add(TestType, createdObject.id, 'queryChildren', 102, { perm: 2 }))
          .then(() => actualStore.add(TestType, createdObject.id, 'queryChildren', 103, { perm: 3 }))
          .then(() => {
            return expect(actualStore.read(TestType, createdObject.id, 'queryChildren'))
            .to.eventually.deep.equal({
              queryChildren: [
                {
                  child_id: 102,
                  parent_id: createdObject.id,
                  perm: 2,
                }, {
                  child_id: 103,
                  parent_id: createdObject.id,
                  perm: 3,
                },
              ],
            });
          });
        });
      });
    });

    describe('events', () => {
      it('should pass basic cacheable-write events to other datastores', () => {
        const memstore = new MemoryStorage();
        const testPlump = new Plump({
          storage: [memstore, actualStore],
          types: [TestType],
        });
        return actualStore.write(TestType, {
          name: 'potato',
        }).then((createdObject) => {
          return expect(memstore.read(TestType, createdObject.id)).to.eventually.have.property('name', 'potato');
        }).finally(() => {
          return testPlump.teardown();
        });
      });

      it('should pass basic cacheable-read events up the stack', () => {
        let testPlump;
        let testItem;
        let memstore;
        return actualStore.write(TestType, {
          name: 'potato',
        }).then((createdObject) => {
          testItem = createdObject;
          return expect(actualStore.read(TestType, testItem.id)).to.eventually.have.property('name', 'potato');
        }).then(() => {
          memstore = new MemoryStorage();
          testPlump = new Plump({
            storage: [memstore, actualStore],
            types: [TestType],
          });
          return expect(memstore.read(TestType, testItem.id)).to.eventually.be.null;
        }).then(() => {
          return actualStore.read(TestType, testItem.id);
        }).then(() => {
          return expect(memstore.read(TestType, testItem.id)).to.eventually.have.property('name', 'potato');
        }).finally(() => testPlump.teardown());
      });

      it('should pass cacheable-write events on hasMany relationships to other datastores', () => {
        let testItem;
        const memstore = new MemoryStorage();
        const testPlump = new Plump({
          storage: [memstore, actualStore],
          types: [TestType],
        });
        return actualStore.write(TestType, {
          name: 'potato',
        }).then((createdObject) => {
          testItem = createdObject;
          return actualStore.add(TestType, testItem.id, 'likers', 100);
        }).then(() => {
          return expect(memstore.read(TestType, testItem.id, 'likers')).to.eventually.deep.equal({
            likers: [
              {
                parent_id: 100,
                child_id: testItem.id,
              },
            ],
          });
        }).finally(() => testPlump.teardown());
      });

      it('should pass cacheable-read events on hasMany relationships to other datastores', () => {
        let testPlump;
        let testItem;
        let memstore;
        return actualStore.write(TestType, {
          name: 'potato',
        }).then((createdObject) => {
          testItem = createdObject;
          return expect(actualStore.read(TestType, testItem.id)).to.eventually.have.property('name', 'potato');
        }).then(() => actualStore.add(TestType, testItem.id, 'likers', 100))
        .then(() => {
          memstore = new MemoryStorage();
          testPlump = new Plump({
            storage: [memstore, actualStore],
            types: [TestType],
          });
          return expect(memstore.read(TestType, testItem.id)).to.eventually.be.null;
        }).then(() => {
          return actualStore.read(TestType, testItem.id, 'likers');
        }).then(() => {
          return expect(memstore.read(TestType, testItem.id, 'likers')).to.eventually.deep.equal({
            likers: [
              {
                parent_id: 100,
                child_id: testItem.id,
              },
            ],
          });
        }).finally(() => testPlump.teardown());
      });
    });

    after(() => {
      return (store.after || (() => {}))(actualStore);
    });
  });
});
