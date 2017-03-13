/* eslint-env node */
/* eslint no-shadow: 0 */

import { MemoryStore, Plump } from '../src/index';
import { TestType } from './testType';
import Bluebird from 'bluebird';

Bluebird.config({
  longStackTraces: true,
});

import chai from 'chai';
import chaiSubset from 'chai-subset';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiSubset);
chai.use(chaiAsPromised);
const expect = chai.expect;

const sampleObject = {
  type: 'tests',
  attributes: {
    name: 'potato',
    extended: {
      actual: 'rutabaga',
      otherValue: 42,
    },
  },
  relationships: {},
};

export function testSuite(mocha, storeOpts) {
  const store = Object.assign(
    {},
    {
      before: () => Bluebird.resolve(),
      after: () => Bluebird.resolve(),
    },
    storeOpts
  );
  mocha.describe(store.name, () => {
    let actualStore;
    mocha.before(() => {
      return (store.before || (() => Bluebird.resolve()))(actualStore)
      .then(() => {
        actualStore = new store.ctor(store.opts); // eslint-disable-line new-cap
        actualStore.addType(TestType);
      });
    });

    mocha.describe('core CRUD', () => {
      mocha.it('supports creating values with no id field, and retrieving values', () => {
        return actualStore.write('tests', sampleObject)
        .then((createdObject) => {
          return expect(actualStore.read('tests', createdObject.id))
          .to.eventually.containSubset(Object.assign({}, sampleObject, { [TestType.$id]: createdObject.id }));
        });
      });

      mocha.it('allows objects to be stored by id', () => {
        return actualStore.write('tests', sampleObject)
        .then((createdObject) => {
          const modObject = Object.assign({}, createdObject, { attributes: { name: 'carrot' } });
          return actualStore.write('tests', modObject)
          .then((updatedObject) => {
            return expect(actualStore.read('tests', updatedObject.id))
            .to.eventually.containSubset(Object.assign(
              {},
              sampleObject,
              { [TestType.$id]: createdObject.id, attributes: { name: 'carrot' } }
            ));
          });
        });
      });

      mocha.it('allows for deletion of objects by id', () => {
        return actualStore.write('tests', sampleObject)
        .then((createdObject) => {
          return expect(actualStore.read('tests', createdObject.id))
          .to.eventually.containSubset(Object.assign({}, sampleObject, { [TestType.$id]: createdObject.id }))
          .then(() => actualStore.delete('tests', createdObject.id))
          .then(() => expect(actualStore.read('tests', createdObject.id)).to.eventually.be.null);
        });
      });
    });

    mocha.describe('relationships', () => {
      mocha.it('can fetch a base and hasmany in one read', () => {
        return actualStore.write('tests', sampleObject)
        .then((createdObject) => {
          return actualStore.add('tests', createdObject.id, 'children', 200)
          .then(() => actualStore.add('tests', createdObject.id, 'children', 201))
          .then(() => actualStore.add('tests', createdObject.id, 'children', 202))
          .then(() => actualStore.add('tests', createdObject.id, 'children', 203))
          .then(() => {
            const storedObject = actualStore.read('tests', createdObject.id, 'children');
            return Bluebird.all([
              expect(storedObject).to.eventually.have.property('attributes')
                .that.contains.all.keys(Object.keys(sampleObject.attributes)),
              expect(storedObject).to.eventually.deep.containSubset({
                relationships: { children: [{ id: 200 }, { id: 201 }, { id: 202 }, { id: 203 }] },
              }),
            ]);
          });
        });
      });

      mocha.it('can write to relationships and attributes', () => {
        const deltaItem = Object.assign({}, sampleObject, {
          relationships: {
            children: [
              { op: 'add', data: { id: 101 } },
            ],
          },
        });
        const rawItem = Object.assign({}, sampleObject, {
          relationships: {
            children: [
              { id: 101 },
            ],
          },
        });
        return Bluebird.all([
          actualStore.write('tests', deltaItem),
          actualStore.write('tests', rawItem),
        ]).then((items) => {
          return Bluebird.all(items.map((it) => {
            return expect(actualStore.read('tests', it.id, ['children']))
            .to.eventually.deep.containSubset({
              relationships: {
                children: [
                  { id: 101 },
                ],
              },
            });
          }));
        });
      });

      mocha.it('can add to a hasMany relationship', () => {
        return actualStore.write('tests', sampleObject)
        .then((createdObject) => {
          return actualStore.add('tests', createdObject.id, 'children', 100)
          .then(() => actualStore.add('tests', createdObject.id, 'children', 101))
          .then(() => actualStore.add('tests', createdObject.id, 'children', 102))
          .then(() => actualStore.add('tests', createdObject.id, 'children', 103))
          .then(() => actualStore.add('tests', 100, 'children', createdObject.id))
          .then(() => {
            return expect(actualStore.read('tests', createdObject.id, ['children']))
            .to.eventually.deep.containSubset({
              relationships: {
                children: [
                  { id: 100 },
                  { id: 101 },
                  { id: 102 },
                  { id: 103 },
                ],
              },
            });
          }).then(() => {
            return expect(actualStore.read('tests', createdObject.id, ['parents']))
            .to.eventually.deep.containSubset({
              relationships: { parents: [{ id: 100 }] },
            });
          });
        });
      });

      mocha.it('can add to a hasMany relationship with extras', () => {
        return actualStore.write('tests', sampleObject)
        .then((createdObject) => {
          return actualStore.add('tests', createdObject.id, 'valenceChildren', 100, { perm: 1 })
          .then(() => {
            return expect(actualStore.read('tests', createdObject.id, 'valenceChildren'))
            .to.eventually.deep.containSubset({
              relationships: { valenceChildren: [{ id: 100, meta: { perm: 1 } }] },
            });
          });
        });
      });

      mocha.it('can modify valence on a hasMany relationship', () => {
        return actualStore.write('tests', sampleObject)
        .then((createdObject) => {
          return actualStore.add('tests', createdObject.id, 'valenceChildren', 100, { perm: 1 })
          .then(() => {
            return expect(actualStore.read('tests', createdObject.id, 'valenceChildren'))
            .to.eventually.deep.containSubset({
              relationships: { valenceChildren: [{ id: 100, meta: { perm: 1 } }] },
            });
          }).then(() => actualStore.modifyRelationship('tests', createdObject.id, 'valenceChildren', 100, { perm: 2 }))
          .then(() => {
            return expect(actualStore.read('tests', createdObject.id, 'valenceChildren'))
            .to.eventually.deep.containSubset({
              relationships: { valenceChildren: [{ id: 100, meta: { perm: 2 } }] },
            });
          });
        });
      });

      mocha.it('can remove from a hasMany relationship', () => {
        return actualStore.write('tests', sampleObject)
        .then((createdObject) => {
          return actualStore.add('tests', createdObject.id, 'children', 100)
          .then(() => {
            return expect(actualStore.read('tests', createdObject.id, 'children'))
            .to.eventually.deep.containSubset({
              relationships: { children: [{ id: 100 }] },
            });
          })
          .then(() => actualStore.remove('tests', createdObject.id, 'children', 100))
          .then(() => {
            return expect(actualStore.read('tests', createdObject.id, 'children'))
            .to.eventually.deep.containSubset({
              relationships: { children: [] },
            });
          });
        });
      });
    });

    mocha.describe('events', () => {
      mocha.it('should pass basic cacheable-write events to other datastores', () => {
        const memstore = new MemoryStore();
        const testPlump = new Plump({
          storage: [memstore, actualStore],
          types: [TestType],
        });
        return actualStore.write('tests', {
          attributes: { name: 'potato' },
          relationships: {},
        }).then((createdObject) => {
          // can be passing with a setTimeout
          return expect(memstore.read('tests', createdObject.id))
          .to.eventually.have.deep.property('attributes.name', 'potato');
        }).finally(() => {
          return testPlump.teardown();
        });
      });

      mocha.it('should pass basic cacheable-read events up the stack', () => {
        const testPlump = new Plump({ types: [TestType] });
        let testItem;
        let memstore;
        return actualStore.write('tests', {
          attributes: { name: 'potato' },
          relationships: {},
        }).then((createdObject) => {
          testItem = createdObject;
          return expect(actualStore.read('tests', testItem.id))
          .to.eventually.have.deep.property('attributes.name', 'potato');
        }).then(() => {
          memstore = new MemoryStore();
          testPlump.addStore(memstore);
          testPlump.addStore(actualStore);
          return expect(memstore.read('tests', testItem.id)).to.eventually.be.null;
        }).then(() => {
          return actualStore.read('tests', testItem.id);
        }).then(() => {
          return expect(memstore.read('tests', testItem.id))
          .to.eventually.have.deep.property('attributes.name', 'potato');
        }).finally(() => testPlump.teardown());
      });

      mocha.it('should pass cacheable-write events on hasMany relationships to other datastores', () => {
        let testItem;
        const memstore = new MemoryStore();
        const testPlump = new Plump({
          storage: [memstore, actualStore],
          types: [TestType],
        });
        return actualStore.write('tests', {
          attributes: { name: 'potato' },
          relationships: {},
        }).then((createdObject) => {
          testItem = createdObject;
          return actualStore.add('tests', testItem.id, 'likers', 100);
        }).then(() => {
          return expect(memstore.read('tests', testItem.id, 'likers'))
          .to.eventually.have.property('relationships').that.deep.equals({
            likers: [
              { id: 100 },
            ],
          });
        }).finally(() => testPlump.teardown());
      });

      mocha.it('should pass cacheable-read events on hasMany relationships to other datastores', () => {
        const testPlump = new Plump({ types: [TestType] });
        let testItem;
        let memstore;
        return actualStore.write('tests', {
          attributes: { name: 'potato' },
          relationships: {},
        }).then((createdObject) => {
          testItem = createdObject;
          return expect(actualStore.read('tests', testItem.id))
          .to.eventually.have.deep.property('attributes.name', 'potato');
        }).then(() => actualStore.add('tests', testItem.id, 'likers', 100))
        .then(() => {
          memstore = new MemoryStore();
          testPlump.addStore(actualStore);
          testPlump.addStore(memstore);
          return expect(memstore.read('tests', testItem.id)).to.eventually.be.null;
        }).then(() => {
          return actualStore.read('tests', testItem.id, 'likers');
        }).then(() => {
          return expect(memstore.read('tests', testItem.id, 'likers'))
          .to.eventually.have.property('relationships').that.deep.equals({
            likers: [
              { id: 100 },
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
