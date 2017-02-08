'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _index = require('../index');

var _testType = require('./testType');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-env node, mocha*/

_chai2.default.use(_chaiAsPromised2.default);
var expect = _chai2.default.expect;

describe('Plump', function () {
  it('should allow dynamic creation of models from a schema', function () {
    var p = new _index.Plump();
    p.addTypesFromSchema({ tests: _testType.TestType.toJSON() });
    return expect(p.find('tests', 1).constructor.toJSON()).to.deep.equal(_testType.TestType.toJSON());
  });

  it('should refresh contents on an invalidation event', function (done) {
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
    var terminalStore = new _index.MemoryStorage({ terminal: true });
    var delayedMemstore = new Proxy(terminalStore, DelayProxy);
    var coldMemstore = new _index.MemoryStorage();
    var hotMemstore = new _index.MemoryStorage();
    hotMemstore.hot = function () {
      return true;
    };
    var otherPlump = new _index.Plump({
      storage: [hotMemstore, coldMemstore, delayedMemstore],
      types: [_testType.TestType]
    });
    var invalidated = new _testType.TestType({ name: 'foo' }, otherPlump);
    invalidated.$save().then(function () {
      var phase = 0;
      var subscription = invalidated.$subscribe(function (v) {
        try {
          if (phase === 0) {
            if (v.name) {
              expect(v).to.have.property('name', 'foo');
              phase = 1;
            }
          }
          if (phase === 1) {
            if (v.name === 'slowtato') {
              phase = 2;
            } else if (v.name === 'grotato') {
              subscription.unsubscribe();
              done();
            }
          }
          if (phase === 2) {
            if (v.name !== 'slowtato') {
              expect(v).to.have.property('name', 'grotato');
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
      return terminalStore._set(terminalStore.keyString(_testType.TestType.$name, invalidated.$id), JSON.stringify({ id: invalidated.$id, name: 'grotato' }));
    }).then(function () {
      // debugger;
      return otherPlump.invalidate(_testType.TestType, invalidated.$id, _index.$self);
    }).catch(function (err) {
      return done(err);
    });
  });

  it('should package all related models on read', function () {
    // For testing while actual bulkRead implementations are in development
    _index.MemoryStorage.prototype.bulkRead = function bulkRead(root, opts) {
      // eslint-disable-line no-unused-vars
      return _bluebird2.default.all([this.read(_testType.TestType, 2, _index.$all), this.read(_testType.TestType, 3, _index.$all)]).then(function (children) {
        return { children: children };
      });
    };

    var memstore2 = new _index.MemoryStorage({ terminal: true });

    var plump = new _index.Plump({
      storage: [memstore2],
      types: [_testType.TestType]
    });

    var one = new _testType.TestType({
      id: 1,
      name: 'potato'
    }, plump);
    var two = new _testType.TestType({
      id: 2,
      name: 'frotato',
      extended: { cohort: 2013 }
    }, plump);
    var three = new _testType.TestType({
      id: 3,
      name: 'rutabaga'
    }, plump);

    return _bluebird2.default.all([one.$save(), two.$save(), three.$save()]).then(function () {
      return _bluebird2.default.all([one.$add('children', two.$id), two.$add('children', three.$id)]);
    }).then(function () {
      return expect(plump.jsonAPIify(_testType.TestType.$name, one.$id)).to.eventually.deep.equal(JSON.parse(_fs2.default.readFileSync('src/test/testType.json')));
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvcGx1bXAuanMiXSwibmFtZXMiOlsidXNlIiwiZXhwZWN0IiwiZGVzY3JpYmUiLCJpdCIsInAiLCJhZGRUeXBlc0Zyb21TY2hlbWEiLCJ0ZXN0cyIsInRvSlNPTiIsImZpbmQiLCJjb25zdHJ1Y3RvciIsInRvIiwiZGVlcCIsImVxdWFsIiwiZG9uZSIsIkRlbGF5UHJveHkiLCJnZXQiLCJ0YXJnZXQiLCJuYW1lIiwiaW5kZXhPZiIsImFyZ3MiLCJkZWxheSIsInRoZW4iLCJ0ZXJtaW5hbFN0b3JlIiwidGVybWluYWwiLCJkZWxheWVkTWVtc3RvcmUiLCJQcm94eSIsImNvbGRNZW1zdG9yZSIsImhvdE1lbXN0b3JlIiwiaG90Iiwib3RoZXJQbHVtcCIsInN0b3JhZ2UiLCJ0eXBlcyIsImludmFsaWRhdGVkIiwiJHNhdmUiLCJwaGFzZSIsInN1YnNjcmlwdGlvbiIsIiRzdWJzY3JpYmUiLCJ2IiwiaGF2ZSIsInByb3BlcnR5IiwidW5zdWJzY3JpYmUiLCJlcnIiLCJfc2V0Iiwia2V5U3RyaW5nIiwiJG5hbWUiLCIkaWQiLCJKU09OIiwic3RyaW5naWZ5IiwiaWQiLCJpbnZhbGlkYXRlIiwiY2F0Y2giLCJwcm90b3R5cGUiLCJidWxrUmVhZCIsInJvb3QiLCJvcHRzIiwiYWxsIiwicmVhZCIsImNoaWxkcmVuIiwibWVtc3RvcmUyIiwicGx1bXAiLCJvbmUiLCJ0d28iLCJleHRlbmRlZCIsImNvaG9ydCIsInRocmVlIiwiJGFkZCIsImpzb25BUElpZnkiLCJldmVudHVhbGx5IiwicGFyc2UiLCJyZWFkRmlsZVN5bmMiXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7OztBQVBBOztBQVNBLGVBQUtBLEdBQUw7QUFDQSxJQUFNQyxTQUFTLGVBQUtBLE1BQXBCOztBQUVBQyxTQUFTLE9BQVQsRUFBa0IsWUFBTTtBQUN0QkMsS0FBRyx1REFBSCxFQUE0RCxZQUFNO0FBQ2hFLFFBQU1DLElBQUksa0JB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dC1lbnYgbm9kZSwgbW9jaGEqL1xuXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5pbXBvcnQgY2hhaUFzUHJvbWlzZWQgZnJvbSAnY2hhaS1hcy1wcm9taXNlZCc7XG5pbXBvcnQgeyBQbHVtcCwgTWVtb3J5U3RvcmFnZSwgJHNlbGYsICRhbGwgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgeyBUZXN0VHlwZSB9IGZyb20gJy4vdGVzdFR5cGUnO1xuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbmRlc2NyaWJlKCdQbHVtcCcsICgpID0+IHtcbiAgaXQoJ3Nob3VsZCBhbGxvdyBkeW5hbWljIGNyZWF0aW9uIG9mIG1vZGVscyBmcm9tIGEgc2NoZW1hJywgKCkgPT4ge1xuICAgIGNvbnN0IHAgPSBuZXcgUGx1bXAoKTtcbiAgICBwLmFkZFR5cGVzRnJvbVNjaGVtYSh7IHRlc3RzOiBUZXN0VHlwZS50b0pTT04oKSB9KTtcbiAgICByZXR1cm4gZXhwZWN0KHAuZmluZCgndGVzdHMnLCAxKS5jb25zdHJ1Y3Rvci50b0pTT04oKSkudG8uZGVlcC5lcXVhbChUZXN0VHlwZS50b0pTT04oKSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgcmVmcmVzaCBjb250ZW50cyBvbiBhbiBpbnZhbGlkYXRpb24gZXZlbnQnLCAoZG9uZSkgPT4ge1xuICAgIGNvbnN0IERlbGF5UHJveHkgPSB7XG4gICAgICBnZXQ6ICh0YXJnZXQsIG5hbWUpID0+IHtcbiAgICAgICAgaWYgKFsncmVhZCcsICd3cml0ZScsICdhZGQnLCAncmVtb3ZlJ10uaW5kZXhPZihuYW1lKSA+PSAwKSB7XG4gICAgICAgICAgcmV0dXJuICguLi5hcmdzKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gQmx1ZWJpcmQuZGVsYXkoMjAwKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGFyZ2V0W25hbWVdKC4uLmFyZ3MpKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0YXJnZXRbbmFtZV07XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCB0ZXJtaW5hbFN0b3JlID0gbmV3IE1lbW9yeVN0b3JhZ2UoeyB0ZXJtaW5hbDogdHJ1ZSB9KTtcbiAgICBjb25zdCBkZWxheWVkTWVtc3RvcmUgPSBuZXcgUHJveHkodGVybWluYWxTdG9yZSwgRGVsYXlQcm94eSk7XG4gICAgY29uc3QgY29sZE1lbXN0b3JlID0gbmV3IE1lbW9yeVN0b3JhZ2UoKTtcbiAgICBjb25zdCBob3RNZW1zdG9yZSA9IG5ldyBNZW1vcnlTdG9yYWdlKCk7XG4gICAgaG90TWVtc3RvcmUuaG90ID0gKCkgPT4gdHJ1ZTtcbiAgICBjb25zdCBvdGhlclBsdW1wID0gbmV3IFBsdW1wKHtcbiAgICAgIHN0b3JhZ2U6IFtob3RNZW1zdG9yZSwgY29sZE1lbXN0b3JlLCBkZWxheWVkTWVtc3RvcmVdLFxuICAgICAgdHlwZXM6IFtUZXN0VHlwZV0sXG4gICAgfSk7XG4gICAgY29uc3QgaW52YWxpZGF0ZWQgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZm9vJyB9LCBvdGhlclBsdW1wKTtcbiAgICBpbnZhbGlkYXRlZC4kc2F2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgbGV0IHBoYXNlID0gMDtcbiAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IGludmFsaWRhdGVkLiRzdWJzY3JpYmUoKHYpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAocGhhc2UgPT09IDApIHtcbiAgICAgICAgICAgIGlmICh2Lm5hbWUpIHtcbiAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAnZm9vJyk7XG4gICAgICAgICAgICAgIHBoYXNlID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHBoYXNlID09PSAxKSB7XG4gICAgICAgICAgICBpZiAodi5uYW1lID09PSAnc2xvd3RhdG8nKSB7XG4gICAgICAgICAgICAgIHBoYXNlID0gMjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodi5uYW1lID09PSAnZ3JvdGF0bycpIHtcbiAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHBoYXNlID09PSAyKSB7XG4gICAgICAgICAgICBpZiAodi5uYW1lICE9PSAnc2xvd3RhdG8nKSB7XG4gICAgICAgICAgICAgIGV4cGVjdCh2KS50by5oYXZlLnByb3BlcnR5KCduYW1lJywgJ2dyb3RhdG8nKTtcbiAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIC8vIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgIGRvbmUoZXJyKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gY29sZE1lbXN0b3JlLl9zZXQoXG4gICAgICAgIGNvbGRNZW1zdG9yZS5rZXlTdHJpbmcoVGVzdFR5cGUuJG5hbWUsIGludmFsaWRhdGVkLiRpZCksXG4gICAgICAgIEpTT04uc3RyaW5naWZ5KHsgaWQ6IGludmFsaWRhdGVkLiRpZCwgbmFtZTogJ3Nsb3d0YXRvJyB9KVxuICAgICAgKTtcbiAgICB9KVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIHJldHVybiB0ZXJtaW5hbFN0b3JlLl9zZXQoXG4gICAgICAgIHRlcm1pbmFsU3RvcmUua2V5U3RyaW5nKFRlc3RUeXBlLiRuYW1lLCBpbnZhbGlkYXRlZC4kaWQpLFxuICAgICAgICBKU09OLnN0cmluZ2lmeSh7IGlkOiBpbnZhbGlkYXRlZC4kaWQsIG5hbWU6ICdncm90YXRvJyB9KVxuICAgICAgKTtcbiAgICB9KVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIC8vIGRlYnVnZ2VyO1xuICAgICAgcmV0dXJuIG90aGVyUGx1bXAuaW52YWxpZGF0ZShUZXN0VHlwZSwgaW52YWxpZGF0ZWQuJGlkLCAkc2VsZik7XG4gICAgfSlcbiAgICAuY2F0Y2goKGVycikgPT4gZG9uZShlcnIpKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBwYWNrYWdlIGFsbCByZWxhdGVkIG1vZGVscyBvbiByZWFkJywgKCkgPT4ge1xuICAgIC8vIEZvciB0ZXN0aW5nIHdoaWxlIGFjdHVhbCBidWxrUmVhZCBpbXBsZW1lbnRhdGlvbnMgYXJlIGluIGRldmVsb3BtZW50XG4gICAgTWVtb3J5U3RvcmFnZS5wcm90b3R5cGUuYnVsa1JlYWQgPSBmdW5jdGlvbiBidWxrUmVhZChyb290LCBvcHRzKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICB0aGlzLnJlYWQoVGVzdFR5cGUsIDIsICRhbGwpLFxuICAgICAgICB0aGlzLnJlYWQoVGVzdFR5cGUsIDMsICRhbGwpLFxuICAgICAgXSkudGhlbihjaGlsZHJlbiA9PiB7XG4gICAgICAgIHJldHVybiB7IGNoaWxkcmVuIH07XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgY29uc3QgbWVtc3RvcmUyID0gbmV3IE1lbW9yeVN0b3JhZ2UoeyB0ZXJtaW5hbDogdHJ1ZSB9KTtcblxuICAgIGNvbnN0IHBsdW1wID0gbmV3IFBsdW1wKHtcbiAgICAgIHN0b3JhZ2U6IFttZW1zdG9yZTJdLFxuICAgICAgdHlwZXM6IFtUZXN0VHlwZV0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe1xuICAgICAgaWQ6IDEsXG4gICAgICBuYW1lOiAncG90YXRvJyxcbiAgICB9LCBwbHVtcCk7XG4gICAgY29uc3QgdHdvID0gbmV3IFRlc3RUeXBlKHtcbiAgICAgIGlkOiAyLFxuICAgICAgbmFtZTogJ2Zyb3RhdG8nLFxuICAgICAgZXh0ZW5kZWQ6IHsgY29ob3J0OiAyMDEzIH0sXG4gICAgfSwgcGx1bXApO1xuICAgIGNvbnN0IHRocmVlID0gbmV3IFRlc3RUeXBlKHtcbiAgICAgIGlkOiAzLFxuICAgICAgbmFtZTogJ3J1dGFiYWdhJyxcbiAgICB9LCBwbHVtcCk7XG5cbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgIG9uZS4kc2F2ZSgpLFxuICAgICAgdHdvLiRzYXZlKCksXG4gICAgICB0aHJlZS4kc2F2ZSgpLFxuICAgIF0pLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIG9uZS4kYWRkKCdjaGlsZHJlbicsIHR3by4kaWQpLFxuICAgICAgICB0d28uJGFkZCgnY2hpbGRyZW4nLCB0aHJlZS4kaWQpLFxuICAgICAgXSk7XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICByZXR1cm4gZXhwZWN0KHBsdW1wLmpzb25BUElpZnkoVGVzdFR5cGUuJG5hbWUsIG9uZS4kaWQpKVxuICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChcbiAgICAgICAgSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMoJ3NyYy90ZXN0L3Rlc3RUeXBlLmpzb24nKSlcbiAgICAgICk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=
