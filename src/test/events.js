/* eslint-env node, mocha*/

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Plump, MemoryStorage } from '../index';
import { TestType } from './testType';

const memstore1 = new MemoryStorage();
const memstore2 = new MemoryStorage({ terminal: true });

const plump = new Plump({
  storage: [memstore1, memstore2],
  types: [TestType],
});

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Events', () => {
  it('should pass basic cacheable-write events to other datastores', () => {
    return memstore2.write(TestType, {
      id: 2,
      name: 'potato',
    }).then(() => {
      return expect(memstore1.read(TestType, 2)).to.eventually.have.property('name', 'potato');
    });
  });

  it('should pass basic cacheable-read events up the stack', () => {
    const memstore3 = new MemoryStorage();
    return memstore2.write(TestType, {
      id: 3,
      name: 'potato',
    }).then(() => {
      return expect(memstore2.read(TestType, 3)).to.eventually.have.property('name', 'potato');
    }).then(() => {
      plump.addStore(memstore3);
      return expect(memstore3.read(TestType, 3)).to.eventually.be.null;
    }).then(() => {
      return memstore2.read(TestType, 3);
    }).then(() => {
      return expect(memstore3.read(TestType, 3)).to.eventually.have.property('name', 'potato');
    });
  });

  it('should pass cacheable-write events on hasMany relationships to other datastores', () => {
    return memstore2.write(TestType, {
      id: 4,
      name: 'potato',
    }).then(() => {
      return memstore2.add(TestType, 4, 'likers', 100);
    }).then(() => {
      return expect(memstore1.read(TestType, 4, 'likers')).to.eventually.deep.equal({
        likers: [
          {
            parent_id: 100,
            child_id: 4,
          },
        ],
      });
    });
  });
});
