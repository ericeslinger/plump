/* eslint-env node, mocha*/

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { MemoryStorage } from '../storage/memory';
import { Guild } from '../guild';
import { Model } from '../model';

const memstore1 = new MemoryStorage();
const memstore2 = new MemoryStorage({terminal: true});

class TestType extends Model {}

TestType.$name = 'tests';
TestType.$id = 'id';
TestType.$fields = {
  id: {
    type: 'number',
  },
  name: {
    type: 'string',
  },
  extended: {
    type: 'object',
  },
  children: {
    type: 'hasMany',
    relationship: 'children',
    parentField: 'parent_id',
    childField: 'child_id',
    childType: 'tests',
  },
};

const guild = new Guild({
  storage: [memstore1, memstore2],
  types: [TestType],
});

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('model', () => {
  it('should save field updates to all datastores');

  it('should return promises to existing data', () => {
    const one = new TestType({id: 1, name: 'potato'});
    expect(one.$get('name')).to.eventually.equal('potato');
  });

  it('should load data from datastores', () => {
    return memstore2.write(TestType, {
      id: 2,
      name: 'potato',
    }).then(() => {
      const two = guild.find('tests', 2);
      return expect(two.$get('name')).to.eventually.equal('potato');
    });
  });

  it('should create an id when one is unset', () => {
    const noID = new TestType({name: 'potato'}, guild);
    return expect(noID.$save()).to.eventually.have.all.keys('name', 'id');
  });

  it('should optimistically update on field updates', () => {
    const one = new TestType({name: 'potato'}, guild);
    return one.$save()
    .then(() => one.$set({name: 'rutabaga'}))
    .then(() => expect(one.$get('name')).to.eventually.equal('rutabaga'));
  });

  it('should save updates to datastores');

  it('should lazy-load hasMany lists', () => {
    const one = new TestType({name: 'frotato'}, guild);
    return one.$save()
    .then(() => one.$add('children', 100))
    .then(() => expect(one.$get('children')).to.eventually.deep.equal([100]));
  });

  it('should add hasMany elements');
  it('should remove hasMany elements');
  it('should update an inflated version of its hasMany relations');
  it('should optimistically update hasMany changes');
  it('should roll back optimistic changes on error');
  it('should return errors when fetching undefined fields');
  it('should fire events when underlying data changes');
});
