/* eslint-env node, mocha*/


import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { Plump, MemoryStore } from '../src/index';
import { TestType } from './testType';

// import { ITest } from 'mocha';
// The typings for it don't include the timeout() function. GRRRR.
// declare module 'mocha' {
//   interface IRunnable {
//     timeout(n: number): this;
//   }
// }

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Plump', () => {
  it('should properly use hot and cold caches', (done) => {
    const DelayProxy = {
      get: (target, name) => {
        if (['read', 'write', 'add', 'remove'].indexOf(name) >= 0) {
          return (...args) => {
            return new Promise((resolve) => setTimeout(resolve, 200))
            .then(() => target[name](...args));
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
    const otherPlump = new Plump();
    otherPlump.addCache(hotMemstore)
    .then(() => otherPlump.addCache(coldMemstore))
    .then(() => otherPlump.setTerminal(delayedMemstore))
    .then(() => otherPlump.addType(TestType))
    .then(() => {
      const invalidated = new TestType({ name: 'foo' }, otherPlump);
      invalidated.save()
      .then(() => {
        let phase = 0;
        const newOne = otherPlump.find('tests', invalidated.id);
        const subscription = newOne.subscribe({
          next: (v) => {
            // console.log(JSON.stringify(v, null, 2));
            try {
              if (phase === 0) {
                if (v.attributes.name) {
                  expect(v).to.have.property('attributes').with.property('name', 'foo');
                  phase = 1;
                }
              }
              if (phase === 1) {
                if (v.attributes.name === 'slowtato') {
                  phase = 2;
                } else if (v.attributes.name === 'grotato') {
                  subscription.unsubscribe();
                  done();
                }
              }
              if (phase === 2) {
                if (v.attributes.name !== 'slowtato') {
                  expect(v).to.have.property('attributes').with.property('name', 'grotato');
                  subscription.unsubscribe();
                  done();
                }
              }
            } catch (err) {
              subscription.unsubscribe();
              done(err);
            }
          },
          complete: () => { /* noop */ },
          error: (err) => {
            throw err;
          }
        });
        return coldMemstore._upsert(
          { id: invalidated.id, typeName: TestType.typeName, attributes: { name: 'slowtato' }, relationships: {} }
        );
      })
      .then(() => {
        return terminalStore._upsert(
          { id: invalidated.id, typeName: TestType.typeName, attributes: { name: 'grotato' }, relationships: {} }
        );
      })
      .then(() => {
        return otherPlump.invalidate(invalidated, ['attributes']);
      });
    })
    .catch((err) => done(err));
  });

  it('HAMMERTIME', () => {
    const mstore = new MemoryStore({ terminal: true });
    const plump = new Plump();
    return plump.setTerminal(mstore)
    .then(() => plump.addType(TestType))
    .then(() => {
      return new Array(1000).fill(0);
    })
    .then((init) => {
      return Promise.all(
        init.map(() => {
          return new TestType({ name: 'mchammer' }, plump).save();
        })
      );
    })
    .then((saved) => {
      return Promise.all(
        saved.map((val) => {
          return plump.find('tests', val.id)
          .add('valenceChildren', { id: 1001, meta: { perm: 1 } })
          .add('valenceChildren', { id: 1002, meta: { perm: 2 } })
          .add('valenceChildren', { id: 1003, meta: { perm: 3 } })
          .save();
        })
      );
    })
    .then((added) => {
      return Promise.all(
        added.map((val) => {
          return plump.find('tests', val.id).get(['attributes', 'relationships'])
          .then((final) => {
            expect(final.attributes.name).to.equal('mchammer');
            expect(final.relationships.valenceChildren).to.deep.equal(
              [{ id: 1001, meta: { perm: 1 } }, { id: 1002, meta: { perm: 2 } }, { id: 1003, meta: { perm: 3 } }]
            );
          });
        })
      );
    });
  });
});
