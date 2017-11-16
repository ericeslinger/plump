/* eslint-env node, mocha*/

import * as chai from 'chai';

import {
  Plump,
  MemoryStore,
  ModelData,
  HotCache,
  ModelReference,
} from '../src/index';
import { TestType } from './testType';

// import { ITest } from 'mocha';
// The typings for it don't include the timeout() function. GRRRR.
// declare module 'mocha' {
//   interface IRunnable {
//     timeout(n: number): this;
//   }
// }

const expect = chai.expect;

describe('Plump', () => {
  it('should properly use hot and cold caches', () => {
    const DelayProxy = {
      get: (target, name) => {
        if (['read', 'write', 'add', 'remove'].indexOf(name) >= 0) {
          return (...args) => {
            return new Promise(resolve => setTimeout(resolve, 200)).then(() =>
              target[name](...args),
            );
          };
        } else {
          return target[name];
        }
      },
    };
    const terminalStore = new MemoryStore({ terminal: true });
    const delayedMemstore = new Proxy(terminalStore, DelayProxy);
    const coldMemstore = new MemoryStore();
    const hotMemstore = new MemoryStore();
    hotMemstore.hot = () => true;
    const otherPlump = new Plump(delayedMemstore);
    return otherPlump
      .addCache(hotMemstore)
      .then(() => otherPlump.addCache(coldMemstore))
      .then(() => otherPlump.addType(TestType))
      .then(() => {
        const invalidated = new TestType(
          { attributes: { name: 'foo' } },
          otherPlump,
        );
        invalidated
          .save()
          .then(() => {
            return new Promise((resolve, reject) => {
              let phase = 0;
              const newOne = otherPlump.find({
                type: 'tests',
                id: invalidated.id,
              });
              const subscription = newOne
                .asObservable(['attributes', 'relationships'])
                .subscribe({
                  next: v => {
                    try {
                      if (phase === 0) {
                        if (v.attributes.name) {
                          expect(v)
                            .to.have.property('attributes')
                            .with.property('name', 'foo');
                          phase = 1;
                        }
                      }
                      if (phase === 1) {
                        if (v.attributes.name === 'slowtato') {
                          phase = 2;
                        } else if (v.attributes.name === 'grotato') {
                          subscription.unsubscribe();
                          resolve();
                        }
                      }
                      if (phase === 2) {
                        if (v.attributes.name !== 'slowtato') {
                          expect(v)
                            .to.have.property('attributes')
                            .with.property('name', 'grotato');
                          subscription.unsubscribe();
                          resolve();
                        }
                      }
                    } catch (err) {
                      subscription.unsubscribe();
                      reject(err);
                    }
                  },
                  complete: () => {
                    /* noop */
                  },
                  error: err => {
                    throw err;
                  },
                });
              setTimeout(() => {
                coldMemstore._upsert({
                  id: invalidated.id,
                  type: TestType.type,
                  attributes: { name: 'slowtato' },
                  relationships: {},
                });
              }, 25);
            });
          })
          .then(() => {
            return terminalStore._upsert({
              id: invalidated.id,
              type: TestType.type,
              attributes: { name: 'grotato' },
              relationships: {},
            });
          })
          .then(() => {
            return otherPlump.invalidate(invalidated, ['attributes']);
          });
      })
      .catch(e => console.log(e));
  });

  it('handles invalidated or unloaded values in hot cache reads', () => {
    const DelayProxy = {
      get: (target, name) => {
        if (['read', 'write', 'add', 'remove'].indexOf(name) >= 0) {
          return (...args) => {
            return new Promise(resolve => setTimeout(resolve, 200)).then(() =>
              target[name](...args),
            );
          };
        } else {
          return target[name];
        }
      },
    };

    const terminalStore = new MemoryStore({ terminal: true });
    const delayedMemstore = new Proxy(terminalStore, DelayProxy);
    const hotMemstore = new HotCache();
    const otherPlump = new Plump(delayedMemstore);
    return otherPlump
      .addCache(hotMemstore)
      .then(() => otherPlump.addType(TestType))
      .then(() => {
        const testItem = new TestType(
          { attributes: { name: 'potato' } },
          otherPlump,
        );
        return testItem.save();
      })
      .then(i => {
        const savedItem = new TestType({ id: i.id }, otherPlump);
        return savedItem
          .add('children', { type: 'tests', id: 101 })
          .save()
          .then(() =>
            savedItem.get({ fields: ['attributes', 'relationships'] }),
          )
          .then(val => expect(val.relationships.children).to.have.length(1))
          .then(() =>
            savedItem.add('children', { type: 'tests', id: 102 }).save(),
          )
          .then(() =>
            savedItem.get({ fields: ['attributes', 'relationships'] }),
          )
          .then(val => expect(val.relationships.children).to.have.length(2))
          .then(() =>
            savedItem.get({ fields: ['attributes', 'relationships'] }),
          )
          .then(val => expect(val.relationships.children).to.have.length(2))
          .then(() => i);
      });
  });

  it('handles invalidated or unloaded values in hot cache subscribes', () => {
    const DelayProxy = {
      get: (target, name) => {
        if (['read', 'write', 'add', 'remove'].indexOf(name) >= 0) {
          return (...args) => {
            return new Promise(resolve => setTimeout(resolve, 200)).then(() =>
              target[name](...args),
            );
          };
        } else {
          return target[name];
        }
      },
    };

    function test(val: ModelData, p: number) {
      const phase = p;
      let retPhase = phase;
      if (phase === 0) {
        if (!!val) {
          retPhase = 1;
          return test(val, retPhase);
        }
      } else if (phase === 1) {
        expect(val.attributes).to.have.property('name', 'potato');
        retPhase = 2;
        return test(val, retPhase);
      } else if (phase === 2) {
        if (val.relationships && val.relationships.children) {
          expect(val.relationships.children.length).to.be.greaterThan(0);
          retPhase = 3;
          return test(val, retPhase);
        }
      } else if (phase === 3) {
        expect(val.relationships.children).to.have.length(2);
        retPhase = 99;
      }
      return retPhase;
    }

    const terminalStore = new MemoryStore({ terminal: true });
    const delayedMemstore = new Proxy(terminalStore, DelayProxy);
    const hotMemstore = new HotCache();
    const otherPlump = new Plump(delayedMemstore);
    return otherPlump
      .addCache(hotMemstore)
      .then(() => otherPlump.addType(TestType))
      .then(() => {
        const testItem = new TestType(
          { attributes: { name: 'potato' } },
          otherPlump,
        );
        return testItem.save();
      })
      .then(i => hotMemstore.cache(i).then(() => i))
      .then(i => {
        const savedItem = new TestType({ id: i.id }, otherPlump);
        return new Promise((resolve, reject) => {
          let outerPhase = 0;
          savedItem
            .asObservable(['attributes', 'relationships'])
            .subscribe(val => {
              outerPhase = test(val, outerPhase);
              if (outerPhase === 99) {
                resolve();
              } else if (outerPhase < 0) {
                reject();
              }
            });
          savedItem.add('children', { type: 'tests', id: 102 }).save();
          savedItem.add('children', { type: 'tests', id: 103 }).save();
        });
      });
  });

  it('HAMMERTIME', () => {
    const mstore = new MemoryStore({ terminal: true });
    const plump = new Plump(mstore);
    return plump
      .addType(TestType)
      .then(() => {
        return new Array(1000).fill(0);
      })
      .then(init => {
        return Promise.all(
          init.map(() => {
            return new TestType(
              { attributes: { name: 'mchammer' } },
              plump,
            ).save();
          }),
        );
      })
      .then(saved => {
        return Promise.all(
          saved.map(val => {
            return plump
              .find({ type: 'tests', id: val.id })
              .add('valenceChildren', {
                type: TestType.type,
                id: 1001,
                meta: { perm: 1 },
              })
              .add('valenceChildren', {
                type: TestType.type,
                id: 1002,
                meta: { perm: 2 },
              })
              .add('valenceChildren', {
                type: TestType.type,
                id: 1003,
                meta: { perm: 3 },
              })
              .save();
          }),
        );
      })
      .then(added => {
        return Promise.all(
          added.map(val => {
            return plump
              .find({ type: 'tests', id: val.id })
              .get({ fields: ['attributes', 'relationships'] })
              .then(final => {
                expect(final.attributes.name).to.equal('mchammer');
                expect(final.relationships.valenceChildren).to.deep.equal([
                  { type: TestType.type, id: 1001, meta: { perm: 1 } },
                  { type: TestType.type, id: 1002, meta: { perm: 2 } },
                  { type: TestType.type, id: 1003, meta: { perm: 3 } },
                ]);
              });
          }),
        );
      });
  });
});
