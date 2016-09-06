/* eslint-env node, mocha*/

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Datastore } from '../dataStore';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('store', () => {
  it('should have configurable storage types');
  it('should allow subclassing of DS.Base');
  it('should find data from storage by id');
  it('should query data from storage');
});
