/* eslint-env node */
/* eslint no-shadow: 0, max-len: 0 */

import { MemoryStore, Plump } from '../src/index';
import { TestType } from './testType';
import * as Bluebird from 'bluebird';
import * as mergeOptions from 'merge-options';

Bluebird.config({
  longStackTraces: true,
});

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
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
        return actualStore.writeAttributes(sampleObject)
        .then((createdObject) => {
          return actualStore.read({ type: 'tests', id: createdObject.id }, ['attributes', 'relationships'])
          .then((v) => {
            return expect(v)
            .to.deep.equal(
              mergeOptions({}, sampleObject, {
                id: createdObject.id,
                relationships: {
                  parents: [],
                  children: [],
                  valenceParents: [],
                  valenceChildren: [],
                  queryParents: [],
                  queryChildren: [],
                },
                attributes: {
                  id: createdObject.id,
                  otherName: '',
                },
              })
            );
          });
        });
      });
      //
      // mocha.it('allows objects to be stored by id', () => {
      //   return actualStore.writeAttributes(sampleObject)
      //   .then((createdObject) => {
      //     const modObject = mergeOptions({}, createdObject, { attributes: { name: 'carrot' } });
      //     return actualStore.writeAttributes(modObject)
      //     .then((updatedObject) => {
      //       return actualStore.read({ type: 'tests', id: updatedObject.id }, 'attributes')
      //       .then((v) => {
      //         return .to.eventually.deep.equal(
      //         mergeOptions({}, modObject, {
      //           id: createdObject.id,
      //           relationships: {},
      //           attributes: {
      //             id: createdObject.id,
      //             otherName: '',
      //           },
      //         })
      //       );
      //     });
      //   });
      // });
    //
      mocha.it('allows for deletion of objects by id', () => {
        return actualStore.writeAttributes(sampleObject)
        .then((createdObject) => {
          return expect(actualStore.read({ type: 'tests', id: createdObject.id }))
          .to.eventually.equal(Object.assign({}, sampleObject, { [TestType.$id]: createdObject.id }))
          .then(() => actualStore.delete({ type: 'tests', id: createdObject.id }))
          .then(() => expect(actualStore.read({ type: 'tests', id: createdObject.id })).to.eventually.be.null);
        });
      });
    });
    //
    // mocha.describe('relationships', () => {
    //   mocha.it('can fetch a base and hasmany in one read', () => {
    //     return actualStore.writeAttributes(sampleObject)
    //     .then((createdObject) => {
    //       return actualStore.writeRelationshipItem({ type: 'tests', id: createdObject.id }, 'children', { id: 200 })
    //       .then(() => actualStore.writeRelationshipItem({ type: 'tests', id: createdObject.id }, 'children', { id: 201 }))
    //       .then(() => actualStore.writeRelationshipItem({ type: 'tests', id: createdObject.id }, 'children', { id: 202 }))
    //       .then(() => actualStore.writeRelationshipItem({ type: 'tests', id: createdObject.id }, 'children', { id: 203 }))
    //       .then(() => {
    //         const storedObject = actualStore.read({ type: 'tests', id: createdObject.id }, ['attributes', 'relationships.children']);
    //         return Bluebird.all([
    //           expect(storedObject).to.eventually.have.property('attributes')
    //             .that.contains.all.keys(Object.keys(sampleObject.attributes)),
    //           expect(storedObject).to.eventually.deep.containSubset({
    //             relationships: { children: [{ id: 200 }, { id: 201 }, { id: 202 }, { id: 203 }] },
    //           }),
    //         ]);
    //       });
    //     });
    //   });
    //
    //   mocha.it('can add to a hasMany relationship', () => {
    //     return actualStore.writeAttributes(sampleObject)
    //     .then((createdObject) => {
    //       return actualStore.writeRelationshipItem({ type: 'tests', id: createdObject.id }, 'children', { id: 100 })
    //       .then(() => actualStore.writeRelationshipItem({ type: 'tests', id: createdObject.id }, 'children', { id: 101 }))
    //       .then(() => actualStore.writeRelationshipItem({ type: 'tests', id: createdObject.id }, 'children', { id: 102 }))
    //       .then(() => actualStore.writeRelationshipItem({ type: 'tests', id: createdObject.id }, 'children', { id: 103 }))
    //       .then(() => actualStore.writeRelationshipItem({ type: 'tests', id: 100 }, 'children', { id: createdObject.id }))
    //       .then(() => {
    //         return expect(actualStore.read({ type: 'tests', id: createdObject.id }, ['relationships.children']))
    //         .to.eventually.deep.containSubset({
    //           relationships: {
    //             children: [
    //               { id: 100 },
    //               { id: 101 },
    //               { id: 102 },
    //               { id: 103 },
    //             ],
    //           },
    //         });
    //       }).then(() => {
    //         return expect(actualStore.read({ type: 'tests', id: createdObject.id }, ['relationships.parents']))
    //         .to.eventually.deep.containSubset({
    //           relationships: { parents: [{ id: 100 }] },
    //         });
    //       });
    //     });
    //   });
    //
    //   mocha.it('can add to a hasMany relationship with extras', () => {
    //     return actualStore.writeAttributes(sampleObject)
    //     .then((createdObject) => {
    //       return actualStore.writeRelationshipItem({ type: 'tests', id: createdObject.id }, 'valenceChildren', { id: 100, meta: { perm: 1 } })
    //       .then(() => {
    //         return expect(actualStore.read({ type: 'tests', id: createdObject.id }, 'relationships.valenceChildren'))
    //         .to.eventually.deep.containSubset({
    //           relationships: { valenceChildren: [{ id: 100, meta: { perm: 1 } }] },
    //         });
    //       });
    //     });
    //   });
    //
    //   mocha.it('can modify valence on a hasMany relationship', () => {
    //     return actualStore.writeAttributes(sampleObject)
    //     .then((createdObject) => {
    //       return actualStore.writeRelationshipItem({ type: 'tests', id: createdObject.id }, 'valenceChildren', { id: 100, meta: { perm: 1 } })
    //       .then(() => {
    //         return expect(actualStore.read({ type: 'tests', id: createdObject.id }, 'relationships.valenceChildren'))
    //         .to.eventually.deep.containSubset({
    //           relationships: { valenceChildren: [{ id: 100, meta: { perm: 1 } }] },
    //         });
    //       }).then(() => actualStore.writeRelationshipItem({ type: 'tests', id: createdObject.id }, 'valenceChildren', { id: 100, meta: { perm: 2 } }))
    //       .then(() => {
    //         return expect(actualStore.read({ type: 'tests', id: createdObject.id }, 'relationships.valenceChildren'))
    //         .to.eventually.deep.containSubset({
    //           relationships: { valenceChildren: [{ id: 100, meta: { perm: 2 } }] },
    //         });
    //       });
    //     });
    //   });
    //
    //   mocha.it('can remove from a hasMany relationship', () => {
    //     return actualStore.writeAttributes(sampleObject)
    //     .then((createdObject) => {
    //       return actualStore.writeRelationshipItem({ type: 'tests', id: createdObject.id }, 'children', { id: 100 })
    //       .then(() => {
    //         return expect(actualStore.read({ type: 'tests', id: createdObject.id }, 'relationships.children'))
    //         .to.eventually.deep.containSubset({
    //           relationships: { children: [{ id: 100 }] },
    //         });
    //       })
    //       .then(() => actualStore.deleteRelationshipItem({ type: 'tests', id: createdObject.id }, 'children', { id: 100 }))
    //       .then(() => {
    //         return expect(actualStore.read({ type: 'tests', id: createdObject.id }, 'relationships.children'))
    //         .to.eventually.deep.containSubset({
    //           relationships: { children: [] },
    //         });
    //       });
    //     });
    //   });
    // });
    //
    // mocha.describe('events', () => {
    //   mocha.it('should pass basic write-invalidation events to other datastores', () => {
    //     const memstore = new MemoryStore();
    //     const testPlump = new Plump({
    //       storage: [memstore, actualStore],
    //       types: [TestType],
    //     });
    //     return actualStore.writeAttributes({
    //       type: 'tests',
    //       attributes: { name: 'potato' },
    //     }).then((createdObject) => {
    //       return actualStore.read({ type: 'tests', id: createdObject.id })
    //       .then(() => {
    //         return new Bluebird((resolve) => setTimeout(resolve, 100))
    //         .then(() => {
    //           return expect(memstore.read({ type: 'tests', id: createdObject.id }))
    //           .to.eventually.have.deep.property('attributes.name', 'potato');
    //         }).then(() => {
    //           return actualStore.writeAttributes({
    //             type: 'tests',
    //             id: createdObject.id,
    //             attributes: {
    //               name: 'grotato',
    //             },
    //           });
    //         }).then(() => {
    //           return new Bluebird((resolve) => setTimeout(resolve, 100));
    //         }).then(() => {
    //           return expect(memstore.read({ type: 'tests', id: createdObject.id }))
    //           .to.eventually.be.null;
    //         });
    //       });
    //     }).finally(() => {
    //       return testPlump.teardown();
    //     });
    //   });
    //
    //   mocha.it('should pass basic cacheable-read events up the stack', () => {
    //     const testPlump = new Plump({ types: [TestType] });
    //     let testItem;
    //     let memstore;
    //     return actualStore.writeAttributes({
    //       type: 'tests',
    //       attributes: { name: 'potato' },
    //     }).then((createdObject) => {
    //       testItem = createdObject;
    //       return expect(actualStore.read({ type: 'tests', id: testItem.id }))
    //       .to.eventually.have.deep.property('attributes.name', 'potato');
    //     }).then(() => {
    //       memstore = new MemoryStore();
    //       testPlump.addStore(memstore);
    //       testPlump.addStore(actualStore);
    //       return expect(memstore.read({ type: 'tests', id: testItem.id })).to.eventually.be.null;
    //     }).then(() => {
    //       return actualStore.read({ type: 'tests', id: testItem.id });
    //     })
    //     .then(() => {
    //       // NOTE: this timeout is a hack, it is because
    //       // cacheable read events trigger multiple async things, but don't block
    //       // the promise from returning
    //       return new Bluebird((resolve) => setTimeout(resolve, 100));
    //     })
    //     .then(() => {
    //       return expect(memstore.read({ type: 'tests', id: testItem.id }))
    //       .to.eventually.have.deep.property('attributes.name', 'potato');
    //     }).finally(() => testPlump.teardown());
    //   });
    //
    //   mocha.it('should pass write-invalidation events on hasMany relationships to other datastores', () => {
    //     let testItem;
    //     const memstore = new MemoryStore();
    //     memstore.undertest = true;
    //     const testPlump = new Plump({
    //       storage: [memstore, actualStore],
    //       types: [TestType],
    //     });
    //     return actualStore.writeAttributes({
    //       type: 'tests',
    //       attributes: { name: 'potato' },
    //     }).then((createdObject) => {
    //       testItem = createdObject;
    //       return expect(actualStore.read({ type: 'tests', id: testItem.id }))
    //       .to.eventually.have.deep.property('attributes.name', 'potato');
    //     }).then(() => actualStore.writeRelationshipItem({ type: 'tests', id: testItem.id }, 'children', { id: 100 }))
    //     .then(() => {
    //       return expect(memstore.read({ type: 'tests', id: testItem.id }))
    //       .to.eventually.not.have.deep.property('relationships.children');
    //     }).then(() => {
    //       return actualStore.read({ type: 'tests', id: testItem.id }, 'children');
    //     }).then(() => {
    //       // NOTE: this timeout is a hack, it is because
    //       // cacheable read events trigger multiple async things, but don't block
    //       // the promise from returning
    //       return new Bluebird((resolve) => setTimeout(resolve, 100));
    //     })
    //     .then(() => {
    //       return expect(memstore.read({ type: 'tests', id: testItem.id }, 'children'))
    //       .to.eventually.have.property('relationships').that.deep.equals({
    //         children: [
    //           { id: 100 },
    //         ],
    //       });
    //     })
    //     .then(() => actualStore.writeRelationshipItem({ type: 'tests', id: testItem.id }, 'children', { id: 101 }))
    //     .then(() => new Bluebird((resolve) => setTimeout(resolve, 100)))
    //     .then(() => expect(memstore.read({ type: 'tests', id: testItem.id })).to.eventually.not.have.deep.property('relationships.children'))
    //     .finally(() => testPlump.teardown());
    //   });
    //
    //   mocha.it('should pass cacheable-read events on hasMany relationships to other datastores', () => {
    //     const testPlump = new Plump({ types: [TestType] });
    //     let testItem;
    //     let memstore;
    //     return actualStore.writeAttributes({
    //       type: 'tests',
    //       attributes: { name: 'potato' },
    //     }).then((createdObject) => {
    //       testItem = createdObject;
    //       return expect(actualStore.read({ type: 'tests', id: testItem.id }))
    //       .to.eventually.have.deep.property('attributes.name', 'potato');
    //     }).then(() => actualStore.writeRelationshipItem({ type: 'tests', id: testItem.id }, 'children', { id: 100 }))
    //     .then(() => {
    //       memstore = new MemoryStore();
    //       testPlump.addStore(actualStore);
    //       testPlump.addStore(memstore);
    //       return expect(memstore.read({ type: 'tests', id: testItem.id })).to.eventually.be.null;
    //     }).then(() => {
    //       return actualStore.read({ type: 'tests', id: testItem.id }, 'children');
    //     }).then(() => {
    //       // NOTE: this timeout is a hack, it is because
    //       // cacheable read events trigger multiple async things, but don't block
    //       // the promise from returning
    //       return new Bluebird((resolve) => setTimeout(resolve, 100));
    //     }).then(() => {
    //       return expect(memstore.read({ type: 'tests', id: testItem.id }, 'children'))
    //       .to.eventually.have.property('relationships').that.deep.equals({
    //         children: [
    //           { id: 100 },
    //         ],
    //       });
    //     }).finally(() => testPlump.teardown());
    //   });
    // });

    mocha.after(() => {
      return (store.after || (() => {}))(actualStore);
    });
  });
}
