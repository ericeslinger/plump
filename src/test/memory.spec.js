/* eslint-env node, mocha*/
/* eslint no-shadow: 0 */

import { MemoryStorage } from '../index';
import { testSuite } from '../index';

testSuite({
  describe, it, before, after,
}, {
  ctor: MemoryStorage,
  name: 'Plump Memory Storage',
  opts: { terminal: true },
});
