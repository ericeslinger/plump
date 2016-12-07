/* eslint-env node, mocha*/

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { MemoryStorage } from '../storage/memory';
import { Plump } from '../plump';
import { TestType } from './testType';
import { Model } from '../model';

// const memstore1 = new MemoryStorage();
const memstore2 = new MemoryStorage({ terminal: true });

const plump = new Plump({
  storage: [memstore2],
  types: [TestType],
});

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('model', () => {
  it('should return promises to existing data', () => {
    const one = new TestType({ id: 1, name: 'potato' });
    expect(one.$get('name')).to.eventually.equal('potato');
  });

  it('should properly serialize its schema', () => {
    class MiniTest extends Model {}
    MiniTest.fromJSON(TestType.toJSON());
    return expect(MiniTest.toJSON()).to.deep.equal(TestType.toJSON());
  });

  it('should load data from datastores', () => {
    return memstore2.write(TestType, {
      id: 2,
      name: 'potato',
    }).then(() => {
      const two = plump.find('tests', 2);
      return expect(two.$get('name')).to.eventually.equal('potato');
    });
  });

  it('should create an id when one is unset', () => {
    const noID = new TestType({ name: 'potato' }, plump);
    return expect(noID.$save()).to.eventually.have.all.keys('name', 'id');
  });

  it('should allow data to be deleted', () => {
    const one = new TestType({ name: 'potato' }, plump);
    return one.$save()
    .then(() => expect(plump.find('tests', one.$id).$get('name')).to.eventually.equal('potato'))
    .then(() => one.$delete())
    .then(() => expect(plump.find('tests', one.$id).$get()).to.eventually.be.null);
  });

  it('should allow fields to be loaded', () => {
    const one = new TestType({ name: 'potato' }, plump);
    return one.$save()
    .then(() => expect(plump.find('tests', one.$id).$get('name')).to.eventually.equal('potato'))
    .then(() => expect(plump.find('tests', one.$id).$get()).to.eventually.deep.equal({ name: 'potato', id: one.$id }));
  });

  it('should optimistically update on field updates', () => {
    const one = new TestType({ name: 'potato' }, plump);
    return one.$save()
    .then(() => one.$set({ name: 'rutabaga' }))
    .then(() => expect(one.$get('name')).to.eventually.equal('rutabaga'));
  });

  it('should show empty hasMany lists as []', () => {
    const one = new TestType({ name: 'frotato' }, plump);
    return one.$save()
    .then(() => expect(one.$get('children')).to.eventually.deep.equal([]));
  });

  it('should add hasMany elements', () => {
    const one = new TestType({ name: 'frotato' }, plump);
    return one.$save()
    .then(() => one.$add('children', 100))
    .then(() => {
      return expect(one.$get('children'))
      .to.eventually.deep.equal([{
        child_id: 100,
        parent_id: one.$id,
      }]);
    });
  });

  it('should remove hasMany elements', () => {
    const one = new TestType({ name: 'frotato' }, plump);
    return one.$save()
    .then(() => one.$add('children', 100))
    .then(() => {
      return expect(one.$get('children'))
      .to.eventually.deep.equal([{
        child_id: 100,
        parent_id: one.$id,
      }]);
    })
    .then(() => one.$remove('children', 100))
    .then(() => expect(one.$get('children')).to.eventually.deep.equal([]));
  });

  it('should include valence in hasMany operations', () => {
    const one = new TestType({ name: 'grotato' }, plump);
    return one.$save()
    .then(() => one.$add('valenceChildren', 100, { perm: 1 }))
    .then(() => one.$get('valenceChildren'))
    .then(() => {
      return expect(one.$get('valenceChildren'))
      .to.eventually.deep.equal([{
        child_id: 100,
        parent_id: one.$id,
        perm: 1,
      }]);
    })
    .then(() => one.$modifyRelationship('valenceChildren', 100, { perm: 2 }))
    .then(() => {
      return expect(one.$get('valenceChildren'))
      .to.eventually.deep.equal([{
        child_id: 100,
        parent_id: one.$id,
        perm: 2,
      }]);
    });
  });
});
