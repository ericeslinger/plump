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
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvcGx1bXAuc3BlYy5qcyJdLCJuYW1lcyI6WyJ1c2UiLCJleHBlY3QiLCJkZXNjcmliZSIsIml0IiwicCIsImFkZFR5cGVzRnJvbVNjaGVtYSIsInRlc3RzIiwidG9KU09OIiwiZmluZCIsImNvbnN0cnVjdG9yIiwidG8iLCJkZWVwIiwiZXF1YWwiLCJkb25lIiwiRGVsYXlQcm94eSIsImdldCIsInRhcmdldCIsIm5hbWUiLCJpbmRleE9mIiwiYXJncyIsImRlbGF5IiwidGhlbiIsInRlcm1pbmFsU3RvcmUiLCJ0ZXJtaW5hbCIsImRlbGF5ZWRNZW1zdG9yZSIsIlByb3h5IiwiY29sZE1lbXN0b3JlIiwiaG90TWVtc3RvcmUiLCJob3QiLCJvdGhlclBsdW1wIiwic3RvcmFnZSIsInR5cGVzIiwiaW52YWxpZGF0ZWQiLCIkc2F2ZSIsInBoYXNlIiwic3Vic2NyaXB0aW9uIiwiJHN1YnNjcmliZSIsInYiLCJoYXZlIiwicHJvcGVydHkiLCJ1bnN1YnNjcmliZSIsImVyciIsIl9zZXQiLCJrZXlTdHJpbmciLCIkbmFtZSIsIiRpZCIsIkpTT04iLCJzdHJpbmdpZnkiLCJpZCIsImludmFsaWRhdGUiLCJjYXRjaCJdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7OztBQUVBLGVBQUtBLEdBQUwsMkIsQ0FSQTs7QUFTQSxJQUFNQyxTQUFTLGVBQUtBLE1BQXBCOztBQUVBQyxTQUFTLE9BQVQsRUFBa0IsWUFBTTtBQUN0QkMsS0FBRyx1REFBSCxFQUE0RCxZQUFNO0FBQ2hFLFFBQU1DLElBQUksa0JBQVY7QUFDQUEsTUFBRUMsa0JBQUYsQ0FBcUIsRUFBRUMsT0FBTyxtQkFBU0MsTUFBVCxFQUFULEVBQXJCO0FBQ0EsV0FBT04sT0FBT0csRUFBRUksSUFBRixDQUFPLE9BQVAsRUFBZ0IsQ0FBaEIsRUFBbUJDLFdBQW5CLENBQStCRixNQUEvQixFQUFQLEVBQWdERyxFQUFoRCxDQUFtREMsSUFBbkQsQ0FBd0RDLEtB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QixjQUFjcUIsU0FBZCxDQUF3QixtQkFBU0MsS0FBakMsRUFBd0NaLFlBQVlhLEdBQXBELENBREssRUFFTEMsS0FBS0MsU0FBTCxDQUFlLEVBQUVDLElBQUloQixZQUFZYSxHQUFsQixFQUF1QjVCLE1BQU0sU0FBN0IsRUFBZixDQUZLLENBQVA7QUFJRCxLQXpDRCxFQTBDQ0ksSUExQ0QsQ0EwQ00sWUFBTTtBQUNWO0FBQ0EsYUFBT1EsV0FBV29CLFVBQVgscUJBQWdDakIsWUFBWWEsR0FBNUMsZUFBUDtBQUNELEtBN0NELEVBOENDSyxLQTlDRCxDQThDTyxVQUFDVCxHQUFEO0FBQUEsYUFBUzVCLEtBQUs0QixHQUFMLENBQVQ7QUFBQSxLQTlDUDtBQStDRCxHQXRFRDtBQXVFRCxDQTlFRCIsImZpbGUiOiJ0ZXN0L3BsdW1wLnNwZWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZW52IG5vZGUsIG1vY2hhKi9cblxuaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5pbXBvcnQgY2hhaUFzUHJvbWlzZWQgZnJvbSAnY2hhaS1hcy1wcm9taXNlZCc7XG5pbXBvcnQgeyBQbHVtcCwgTWVtb3J5U3RvcmUsICRzZWxmIH0gZnJvbSAnLi4vaW5kZXgnO1xuaW1wb3J0IHsgVGVzdFR5cGUgfSBmcm9tICcuL3Rlc3RUeXBlJztcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5cbmNoYWkudXNlKGNoYWlBc1Byb21pc2VkKTtcbmNvbnN0IGV4cGVjdCA9IGNoYWkuZXhwZWN0O1xuXG5kZXNjcmliZSgnUGx1bXAnLCAoKSA9PiB7XG4gIGl0KCdzaG91bGQgYWxsb3cgZHluYW1pYyBjcmVhdGlvbiBvZiBtb2RlbHMgZnJvbSBhIHNjaGVtYScsICgpID0+IHtcbiAgICBjb25zdCBwID0gbmV3IFBsdW1wKCk7XG4gICAgcC5hZGRUeXBlc0Zyb21TY2hlbWEoeyB0ZXN0czogVGVzdFR5cGUudG9KU09OKCkgfSk7XG4gICAgcmV0dXJuIGV4cGVjdChwLmZpbmQoJ3Rlc3RzJywgMSkuY29uc3RydWN0b3IudG9KU09OKCkpLnRvLmRlZXAuZXF1YWwoVGVzdFR5cGUudG9KU09OKCkpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIHJlZnJlc2ggY29udGVudHMgb24gYW4gaW52YWxpZGF0aW9uIGV2ZW50JywgKGRvbmUpID0+IHtcbiAgICBjb25zdCBEZWxheVByb3h5ID0ge1xuICAgICAgZ2V0OiAodGFyZ2V0LCBuYW1lKSA9PiB7XG4gICAgICAgIGlmIChbJ3JlYWQnLCAnd3JpdGUnLCAnYWRkJywgJ3JlbW92ZSddLmluZGV4T2YobmFtZSkgPj0gMCkge1xuICAgICAgICAgIHJldHVybiAoLi4uYXJncykgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIEJsdWViaXJkLmRlbGF5KDIwMClcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRhcmdldFtuYW1lXSguLi5hcmdzKSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGFyZ2V0W25hbWVdO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgdGVybWluYWxTdG9yZSA9IG5ldyBNZW1vcnlTdG9yZSh7IHRlcm1pbmFsOiB0cnVlIH0pO1xuICAgIGNvbnN0IGRlbGF5ZWRNZW1zdG9yZSA9IG5ldyBQcm94eSh0ZXJtaW5hbFN0b3JlLCBEZWxheVByb3h5KTtcbiAgICBjb25zdCBjb2xkTWVtc3RvcmUgPSBuZXcgTWVtb3J5U3RvcmUoKTtcbiAgICBjb25zdCBob3RNZW1zdG9yZSA9IG5ldyBNZW1vcnlTdG9yZSgpO1xuICAgIGhvdE1lbXN0b3JlLmhvdCA9ICgpID0+IHRydWU7XG4gICAgY29uc3Qgb3RoZXJQbHVtcCA9IG5ldyBQbHVtcCh7XG4gICAgICBzdG9yYWdlOiBbaG90TWVtc3RvcmUsIGNvbGRNZW1zdG9yZSwgZGVsYXllZE1lbXN0b3JlXSxcbiAgICAgIHR5cGVzOiBbVGVzdFR5cGVdLFxuICAgIH0pO1xuICAgIGNvbnN0IGludmFsaWRhdGVkID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2ZvbycgfSwgb3RoZXJQbHVtcCk7XG4gICAgaW52YWxpZGF0ZWQuJHNhdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGxldCBwaGFzZSA9IDA7XG4gICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBpbnZhbGlkYXRlZC4kc3Vic2NyaWJlKCh2KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKHBoYXNlID09PSAwKSB7XG4gICAgICAgICAgICBpZiAodi5uYW1lKSB7XG4gICAgICAgICAgICAgIGV4cGVjdCh2KS50by5oYXZlLnByb3BlcnR5KCduYW1lJywgJ2ZvbycpO1xuICAgICAgICAgICAgICBwaGFzZSA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChwaGFzZSA9PT0gMSkge1xuICAgICAgICAgICAgaWYgKHYubmFtZSA9PT0gJ3Nsb3d0YXRvJykge1xuICAgICAgICAgICAgICBwaGFzZSA9IDI7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHYubmFtZSA9PT0gJ2dyb3RhdG8nKSB7XG4gICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgICBkb25lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChwaGFzZSA9PT0gMikge1xuICAgICAgICAgICAgaWYgKHYubmFtZSAhPT0gJ3Nsb3d0YXRvJykge1xuICAgICAgICAgICAgICBleHBlY3QodikudG8uaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdncm90YXRvJyk7XG4gICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgICBkb25lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAvLyBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICBkb25lKGVycik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNvbGRNZW1zdG9yZS5fc2V0KFxuICAgICAgICBjb2xkTWVtc3RvcmUua2V5U3RyaW5nKFRlc3RUeXBlLiRuYW1lLCBpbnZhbGlkYXRlZC4kaWQpLFxuICAgICAgICBKU09OLnN0cmluZ2lmeSh7IGlkOiBpbnZhbGlkYXRlZC4kaWQsIG5hbWU6ICdzbG93dGF0bycgfSlcbiAgICAgICk7XG4gICAgfSlcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICByZXR1cm4gdGVybWluYWxTdG9yZS5fc2V0KFxuICAgICAgICB0ZXJtaW5hbFN0b3JlLmtleVN0cmluZyhUZXN0VHlwZS4kbmFtZSwgaW52YWxpZGF0ZWQuJGlkKSxcbiAgICAgICAgSlNPTi5zdHJpbmdpZnkoeyBpZDogaW52YWxpZGF0ZWQuJGlkLCBuYW1lOiAnZ3JvdGF0bycgfSlcbiAgICAgICk7XG4gICAgfSlcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICAvLyBkZWJ1Z2dlcjtcbiAgICAgIHJldHVybiBvdGhlclBsdW1wLmludmFsaWRhdGUoVGVzdFR5cGUsIGludmFsaWRhdGVkLiRpZCwgJHNlbGYpO1xuICAgIH0pXG4gICAgLmNhdGNoKChlcnIpID0+IGRvbmUoZXJyKSk7XG4gIH0pO1xufSk7XG4iXX0=
