/* eslint-env node, mocha*/

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Plump } from '../src/index';
import { TestType } from './testType';
import Bluebird from 'bluebird';

Bluebird.config({
  longStackTraces: true,
});

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Plump', () => {
  it('should allow dynamic creation of models from a schema', () => {
    const p = new Plump();
    p.addTypesFromSchema({ tests: TestType.toJSON() });
    return expect(p.find('tests', 1).constructor.toJSON()).to.deep.equal(TestType.toJSON());
  });
});
