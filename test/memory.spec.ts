/* eslint-env node, mocha*/
/* eslint no-shadow: 0 */

import { MemoryStore } from '../src/storage/memory';
import { ModelData } from '../src/dataTypes';
import { testSuite } from './storageTests';
import { TestType } from './testType';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

use(chaiAsPromised);

testSuite({
  describe: describe,
  it: it,
  before: before,
  after: after,
}, {
  ctor: MemoryStore,
  name: 'Plump Memory Storage',
  opts: { terminal: true },
});

describe('Memory Storage specific', () => {
  it('supports basic queries', () => {
    const newStore = new MemoryStore({ terminal: true });
    const idArray = [];
    return newStore.addSchema(TestType)
    .then(() => newStore.writeAttributes({ typeName: 'tests', attributes: { name: 'potato' } }).then(v => idArray.push(v.id)))
    .then(() => newStore.writeAttributes({ typeName: 'tests', attributes: { name: 'potato' } }).then(v => idArray.push(v.id)))
    .then(() => newStore.writeAttributes({ typeName: 'tests', attributes: { name: 'potato' } }).then(v => idArray.push(v.id)))
    .then(() => newStore.query('tests'))
    .then((items) => Promise.all(items.map(item => newStore.readAttributes(item))))
    .then((models: ModelData[]) => {
      models.forEach(v => expect(v.attributes.name).to.equal('potato'));
      expect(models.map(v => v.id)).to.have.members(idArray);
    });
  });
});
