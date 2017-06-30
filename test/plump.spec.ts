/* eslint-env node, mocha*/

import * as chai from 'chai';

import { Plump, MemoryStore } from '../src/index';
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
              target[name](...args)
            );
          };
        } else {
          return target[name];
        }
      }
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
        const invalidated = new TestType({ name: 'foo' }, otherPlump);
        invalidated
          .save()
          .then(() => {
            return new Promise((resolve, reject) => {
              let phase = 0;
              const newOne = otherPlump.find({
                type: 'tests',
                id: invalidated.id
              });
              const subscription = newOne.subscribe({
                next: v => {
                  // console.log(JSON.stringify(v, null, 2));
                  try {
                    if (phase === 0) {
                      if (v.attributes.name) {
                        expect(v).to.have
                          .property('attributes')
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
                        expect(v).to.have
                          .property('attributes')
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
                }
              });
              return coldMemstore._upsert({
                id: invalidated.id,
                type: TestType.type,
                attributes: { name: 'slowtato' },
                relationships: {}
              });
            });
          })
          .then(() => {
            return terminalStore._upsert({
              id: invalidated.id,
              type: TestType.type,
              attributes: { name: 'grotato' },
              relationships: {}
            });
          })
          .then(() => {
            return otherPlump.invalidate(invalidated, ['attributes']);
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
            return new TestType({ name: 'mchammer' }, plump).save();
          })
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
                meta: { perm: 1 }
              })
              .add('valenceChildren', {
                type: TestType.type,
                id: 1002,
                meta: { perm: 2 }
              })
              .add('valenceChildren', {
                type: TestType.type,
                id: 1003,
                meta: { perm: 3 }
              })
              .save();
          })
        );
      })
      .then(added => {
        return Promise.all(
          added.map(val => {
            return plump
              .find({ type: 'tests', id: val.id })
              .get(['attributes', 'relationships'])
              .then(final => {
                expect(final.attributes.name).to.equal('mchammer');
                expect(final.relationships.valenceChildren).to.deep.equal([
                  { type: TestType.type, id: 1001, meta: { perm: 1 } },
                  { type: TestType.type, id: 1002, meta: { perm: 2 } },
                  { type: TestType.type, id: 1003, meta: { perm: 3 } }
                ]);
              });
          })
        );
      });
  });
});
