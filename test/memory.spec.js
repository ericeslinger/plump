/* eslint-env node, mocha*/
/* eslint no-shadow: 0 */

import { MemoryStore } from '../src/index';
import { testSuite } from './storageTests';

testSuite({
  describe, it, before, after,
}, {
  ctor: MemoryStore,
  name: 'Plump Memory Storage',
  opts: { terminal: true },
});
