'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _plump = require('../plump');

var _testType = require('./testType');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-env node, mocha*/

_chai2.default.use(_chaiAsPromised2.default);
var expect = _chai2.default.expect;

describe('Plump', function () {
  it('should allow dynamic creation of models from a schema', function () {
    var p = new _plump.Plump();
    p.addTypesFromSchema({ tests: _testType.TestType.toJSON() });
    return expect(p.find('tests', 1).constructor.toJSON()).to.deep.equal(_testType.TestType.toJSON());
  });
});