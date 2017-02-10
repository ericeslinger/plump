'use strict';

var _index = require('../index');

/* eslint-env node, mocha*/
/* eslint no-shadow: 0 */

(0, _index.testSuite)({
  describe: describe, it: it, before: before, after: after
}, {
  ctor: _index.MemoryStorage,
  name: 'Plump Memory Storage',
  opts: { terminal: true }
});