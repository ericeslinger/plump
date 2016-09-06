/* eslint-env node, mocha*/

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Datastore } from '../dataStore';

import { MemoryStorage } from '../storage/memory';

const memstore1 = new MemoryStorage();
const memstore2 = new MemoryStorage();
const DS = new Datastore({storage: [memstore1, memstore2]});

class TestType extends DS.Base {}

TestType.$fields = {
  id: {
    type: 'number',
  },
  name: {
    type: 'string',
  },
  children: {
    type: 'hasMany',
    childType: 'TestType',
  },
};

TestType.$name = 'Test';

DS.defineType(TestType);

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('model', () => {
  it('should save field updates to all datastores');

  it('should return promises to existing data', () => {
    const one = new TestType({id: 1, name: 'potato'});
    expect(one.$get('name')).to.eventually.equal('potato');
  });

  it('should load data from datastores', () => {
    return memstore2.create(TestType, {
      id: 2,
      name: 'potato',
    }).then(() => {
      const two = DS.find('Test', 2);
      return expect(two.$get('name')).to.eventually.equal('potato');
    });
  });

  it('should optimistically update on field updates', () => {
    const one = new TestType({id: 1, name: 'potato'});
    one.$set({name: 'rutabaga'});
    return expect(one.$get('name')).to.eventually.equal('rutabaga');
  });

  it('should save updates to datastores', () => {
    const one = new TestType({id: 1, name: 'potato'});
    return one.$set({name: 'rutabaga'}).then(() => {
      return expect(DS.find('Test', 1).$get('name')).to.eventually.equal('rutabaga');
    });
  });

  it('should lazy-load hasMany lists');
  it('should add hasMany elements');
  it('should remove hasMany elements');
  it('should update an inflated version of its hasMany relations');
  it('should optimistically update hasMany changes');
  it('should roll back optimistic changes on error');
  it('should return errors when fetching undefined fields');
  it('should fire events when underlying data changes');
});
