/* eslint-env node, mocha*/

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Plump, MemoryStorage } from '../index';
import { TestType } from './testType';

import Bluebird from 'bluebird';
Bluebird.config({ longStackTraces: true });

const memstore1 = new MemoryStorage();
const memstore2 = new MemoryStorage({ terminal: true });

const plump = new Plump({
  storage: [memstore1, memstore2],
  types: [TestType],
});

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Events', () => {


});
