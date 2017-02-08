/* eslint-env node, mocha*/

import fs from 'fs';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Plump, MemoryStorage, $self, $all } from '../index';
import { TestType } from './testType';
import Bluebird from 'bluebird';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Plump', () => {
  it('should allow dynamic creation of models from a schema', () => {
    const p = new Plump();
    p.addTypesFromSchema({ tests: TestType.toJSON() });
    return expect(p.find('tests', 1).constructor.toJSON()).to.deep.equal(TestType.toJSON());
  });

  it('should refresh contents on an invalidation event', (done) => {
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
    const terminalStore = new MemoryStorage({ terminal: true });
    const delayedMemstore = new Proxy(terminalStore, DelayProxy);
    const coldMemstore = new MemoryStorage();
    const hotMemstore = new MemoryStorage();
    hotMemstore.hot = () => true;
    const otherPlump = new Plump({
      storage: [hotMemstore, coldMemstore, delayedMemstore],
      types: [TestType],
    });
    const invalidated = new TestType({ name: 'foo' }, otherPlump);
    invalidated.$save()
    .then(() => {
      let phase = 0;
      const subscription = invalidated.$subscribe((v) => {
        try {
          if (phase === 0) {
            if (v.name) {
              expect(v).to.have.property('name', 'foo');
              phase = 1;
            }
          }
          if (phase === 1) {
            if (v.name === 'slowtato') {
              phase = 2;
            } else if (v.name === 'grotato') {
              subscription.unsubscribe();
              done();
            }
          }
          if (phase === 2) {
            if (v.name !== 'slowtato') {
              expect(v).to.have.property('name', 'grotato');
              subscription.unsubscribe();
              done();
            }
          }
        } catch (err) {
          // subscription.unsubscribe();
          done(err);
        }
      });
      return coldMemstore._set(
        coldMemstore.keyString(TestType.$name, invalidated.$id),
        JSON.stringify({ id: invalidated.$id, name: 'slowtato' })
      );
    })
    .then(() => {
      return terminalStore._set(
        terminalStore.keyString(TestType.$name, invalidated.$id),
        JSON.stringify({ id: invalidated.$id, name: 'grotato' })
      );
    })
    .then(() => {
      // debugger;
      return otherPlump.invalidate(TestType, invalidated.$id, $self);
    })
    .catch((err) => done(err));
  });

  it('should package all related models on read', () => {
    // For testing while actual bulkRead implementations are in development
    MemoryStorage.prototype.bulkRead = function bulkRead(root, opts) { // eslint-disable-line no-unused-vars
      return Bluebird.all([
        this.read(TestType, 2, $all),
        this.read(TestType, 3, $all),
      ]).then(children => {
        return { children };
      });
    };

    const memstore2 = new MemoryStorage({ terminal: true });

    const plump = new Plump({
      storage: [memstore2],
      types: [TestType],
    });

    const one = new TestType({
      id: 1,
      name: 'potato',
    }, plump);
    const two = new TestType({
      id: 2,
      name: 'frotato',
      extended: { cohort: 2013 },
    }, plump);
    const three = new TestType({
      id: 3,
      name: 'rutabaga',
    }, plump);

    return Bluebird.all([
      one.$save(),
      two.$save(),
      three.$save(),
    ]).then(() => {
      return Bluebird.all([
        one.$add('children', two.$id),
        two.$add('children', three.$id),
      ]);
    }).then(() => {
      return expect(plump.jsonAPIify(TestType.$name, one.$id))
      .to.eventually.deep.equal(
        JSON.parse(fs.readFileSync('src/test/testType.json'))
      );
    });
  });
});
