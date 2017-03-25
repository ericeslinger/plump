/* eslint-env node, mocha*/


import 'mocha';
import * as Bluebird from 'bluebird';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { Plump, MemoryStore } from '../src/index';
import { TestType } from './testType';

Bluebird.config({
  longStackTraces: true,
});

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Plump', () => {
  it('should properly use hot and cold caches', (done) => {
    const DelayProxy = {
      get: (target, name) => {
        if (['read', 'write', 'add', 'remove'].indexOf(name) >= 0) {
          return (...args) => {
            return Bluebird.delay(200)
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
    const otherPlump = new Plump({
      storage: [hotMemstore, coldMemstore, delayedMemstore],
      types: [TestType],
    });
    const invalidated = new TestType({ name: 'foo' }, otherPlump);
    invalidated.save()
    .then(() => {
      let phase = 0;
      const newOne = otherPlump.find('tests', invalidated.id);
      const subscription = newOne.subscribe({
        next: (v) => {
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
      return coldMemstore._set(
        coldMemstore.keyString(invalidated),
        { id: invalidated.id, attributes: { name: 'slowtato' }, relationships: {} }
      );
    })
    .then(() => {
      return terminalStore._set(
        terminalStore.keyString(invalidated),
        { id: invalidated.id, attributes: { name: 'grotato' }, relationships: {} }
      );
    })
    .then(() => {
      return otherPlump.invalidate(invalidated, ['attributes']);
    })
    .catch((err) => done(err));
  });
});
