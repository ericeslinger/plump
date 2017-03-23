/* eslint-env node, mocha*/
/* eslint no-shadow: 0 */

import { MemoryStore } from '../src/index';
import { testSuite } from './storageTests';
import 'mocha';

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
