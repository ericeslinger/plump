'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _index = require('../index');

var _testType = require('./testType');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_chai2.default.use(_chaiAsPromised2.default); /* eslint-env node, mocha*/

var expect = _chai2.default.expect;

describe('Plump', function () {
  it('should allow dynamic creation of models from a schema', function () {
    var p = new _index.Plump();
    p.addTypesFromSchema({ tests: _testType.TestType.toJSON() });
    return expect(p.find('tests', 1).constructor.toJSON()).to.deep.equal(_testType.TestType.toJSON());
  });

  it('should refresh contents on an invalidation event', function (done) {
    console.log('** BEGINNING');
    var DelayProxy = {
      get: function get(target, name) {
        if (['read', 'write', 'add', 'remove'].indexOf(name) >= 0) {
          return function () {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
              args[_key] = arguments[_key];
            }

            return _bluebird2.default.delay(200).then(function () {
              return target[name].apply(target, args);
            });
          };
        } else {
          return target[name];
        }
      }
    };
    var terminalStore = new _index.MemoryStore({ terminal: true });
    var delayedMemstore = new Proxy(terminalStore, DelayProxy);
    var coldMemstore = new _index.MemoryStore();
    var hotMemstore = new _index.MemoryStore();
    hotMemstore.hot = function () {
      return true;
    };
    var otherPlump = new _index.Plump({
      storage: [hotMemstore, coldMemstore, delayedMemstore],
      types: [_testType.TestType]
    });
    var invalidated = new _testType.TestType({ name: 'foo' }, otherPlump);
    invalidated.$save().then(function () {
      console.log('** THEN 1');
      var phase = 0;
      var subscription = invalidated.$subscribe(function (v) {
        console.log('PHASE: ' + phase);
        console.log('CURRENT V:');
        console.log(JSON.stringify(v, null, 2));
        try {
          if (phase === 0) {
            if (v.attributes.name) {
              expect(v).to.have.property('attributes').with.property('name', 'foo');
              phase = 1;
            }
          }
          if (phase === 1) {
            if (v.attributes.name === 'slowtato') {
              phase = 2;
            } else if (v.attributes.name === 'grotato') {
              subscription.unsubscribe();
              done();
            }
          }
          if (phase === 2) {
            if (v.attributes.name !== 'slowtato') {
              expect(v).to.have.property('attributes').with.property('name', 'grotato');
              subscription.unsubscribe();
              done();
            }
          }
        } catch (err) {
          // subscription.unsubscribe();
          done(err);
        }
      });
      return coldMemstore._set(coldMemstore.keyString(_testType.TestType.$name, invalidated.$id), JSON.stringify({ id: invalidated.$id, name: 'slowtato' }));
    }).then(function () {
      console.log('** THEN 2');
      return terminalStore._set(terminalStore.keyString(_testType.TestType.$name, invalidated.$id), JSON.stringify({ id: invalidated.$id, name: 'grotato' }));
    }).then(function () {
      console.log('** THEN 3');
      // debugger;
      return otherPlump.invalidate(_testType.TestType, invalidated.$id, _index.$self);
    }).catch(function (err) {
      return done(err);
    });
  });
});