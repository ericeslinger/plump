/* eslint-env node */
/* eslint no-shadow: 0 */

import { MemoryStorage, Plump, $self } from '../index';
import { TestType } from './testType';
import Bluebird from 'bluebird';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
const expect = chai.expect;

const sampleObject = {
  name: 'potato',
  extended: {
    actual: 'rutabaga',
    otherValue: 42,
  },
};

export function testSuite(mocha, store) {
  mocha.describe(store.name, () => {
    let actualStore;
    mocha.before(() => {
      return (store.before || (() => Bluebird.resolve()))(actualStore)
      .then(() => {
        actualStore = new store.constructor(store.opts);
      });
    });

    mocha.describe('core CRUD', () => {
      mocha.it('supports creating values with no id field, and retrieving values', () => {
        return actualStore.write(TestType, sampleObject)
        .then((createdObject) => {
          return expect(actualStore.read(TestType, createdObject.id))
          .to.eventually.deep.equal(Object.assign({}, sampleObject, { [TestType.$id]: createdObject.id }));
        });
      });

      mocha.it('allows objects to be stored by id', () => {
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

      mocha.it('allows for deletion of objects by id', () => {
        return actualStore.write(TestType, sampleObject)
        .then((createdObject) => {
          return expect(actualStore.read(TestType, createdObject.id))
          .to.eventually.deep.equal(Object.assign({}, sampleObject, { [TestType.$id]: createdObject.id }))
          .then(() => actualStore.delete(TestType, createdObject.id))
          .then(() => expect(actualStore.read(TestType, createdObject.id)).to.eventually.deep.equal(null));
        });
      });
    });

    mocha.describe('relationships', () => {
      mocha.it('handles relationships with restrictions', () => {
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

      mocha.it('can fetch a base and hasmany in one read', () => {
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

      mocha.it('can add to a hasMany relationship', () => {
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

      mocha.it('can add to a hasMany relationship with extras', () => {
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

      mocha.it('can modify valence on a hasMany relationship', () => {
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

      mocha.it('can remove from a hasMany relationship', () => {
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

      mocha.it('supports queries in hasMany relationships', () => {
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

    mocha.describe('events', () => {
      mocha.it('should pass basic cacheable-write events to other datastores', () => {
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

      mocha.it('should pass basic cacheable-read events up the stack', () => {
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

      mocha.it('should pass cacheable-write events on hasMany relationships to other datastores', () => {
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

      mocha.it('should pass cacheable-read events on hasMany relationships to other datastores', () => {
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

    mocha.after(() => {
      return (store.after || (() => {}))(actualStore);
    });
  });
}
