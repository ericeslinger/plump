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
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvcGx1bXAuanMiXSwibmFtZXMiOlsidXNlIiwiZXhwZWN0IiwiZGVzY3JpYmUiLCJpdCIsInAiLCJhZGRUeXBlc0Zyb21TY2hlbWEiLCJ0ZXN0cyIsInRvSlNPTiIsImZpbmQiLCJjb25zdHJ1Y3RvciIsInRvIiwiZGVlcCIsImVxdWFsIiwiZG9uZSIsIkRlbGF5UHJveHkiLCJnZXQiLCJ0YXJnZXQiLCJuYW1lIiwiaW5kZXhPZiIsImFyZ3MiLCJkZWxheSIsInRoZW4iLCJ0ZXJtaW5hbFN0b3JlIiwidGVybWluYWwiLCJkZWxheWVkTWVtc3RvcmUiLCJQcm94eSIsImNvbGRNZW1zdG9yZSIsImhvdE1lbXN0b3JlIiwiaG90Iiwib3RoZXJQbHVtcCIsInN0b3JhZ2UiLCJ0eXBlcyIsImludmFsaWRhdGVkIiwiJHNhdmUiLCJwaGFzZSIsInN1YnNjcmlwdGlvbiIsIiRzdWJzY3JpYmUiLCJ2IiwiaGF2ZSIsInByb3BlcnR5IiwidW5zdWJzY3JpYmUiLCJlcnIiLCJfc2V0Iiwia2V5U3RyaW5nIiwiJG5hbWUiLCIkaWQiLCJKU09OIiwic3RyaW5naWZ5IiwiaWQiLCJpbnZhbGlkYXRlIiwiY2F0Y2giXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOztBQUNBOztBQUNBOzs7Ozs7QUFFQSxlQUFLQSxHQUFMLDJCLENBUkE7O0FBU0EsSUFBTUMsU0FBUyxlQUFLQSxNQUFwQjs7QUFFQUMsU0FBUyxPQUFULEVBQWtCLFlBQU07QUFDdEJDLEtBQUcsdURBQUgsRUFBNEQsWUFBTTtBQUNoRSxRQUFNQyxJQUFJLGtCQUFWO0FBQ0FBLE1BQUVDLGtCQUFGLENBQXFCLEVBQUVDLE9BQU8sbUJBQVNDLE1BQVQsRUFBVCxFQUFyQjtBQUNBLFdBQU9OLE9BQU9HLEVBQUVJLElBQUYsQ0FBTyxPQUFQLEVBQWdCLENBQWhCLEVBQW1CQyxXQUFuQixDQUErQkYsTUFBL0IsRUFBUCxFQUFnREcsRUFBaEQsQ0FBbURDLElBQW5ELENBQXdEQyxLQUF4RCxD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Y3FCLFNBQWQsQ0FBd0IsbUJBQVNDLEtBQWpDLEVBQXdDWixZQUFZYSxHQUFwRCxDQURLLEVBRUxDLEtBQUtDLFNBQUwsQ0FBZSxFQUFFQyxJQUFJaEIsWUFBWWEsR0FBbEIsRUFBdUI1QixNQUFNLFNBQTdCLEVBQWYsQ0FGSyxDQUFQO0FBSUQsS0F6Q0QsRUEwQ0NJLElBMUNELENBMENNLFlBQU07QUFDVjtBQUNBLGFBQU9RLFdBQVdvQixVQUFYLHFCQUFnQ2pCLFlBQVlhLEdBQTVDLGVBQVA7QUFDRCxLQTdDRCxFQThDQ0ssS0E5Q0QsQ0E4Q08sVUFBQ1QsR0FBRDtBQUFBLGFBQVM1QixLQUFLNEIsR0FBTCxDQUFUO0FBQUEsS0E5Q1A7QUErQ0QsR0F0RUQ7QUF1RUQsQ0E5RUQiLCJmaWxlIjoidGVzdC9wbHVtcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1lbnYgbm9kZSwgbW9jaGEqL1xuXG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCB7IFBsdW1wLCBNZW1vcnlTdG9yYWdlLCAkc2VsZiB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7IFRlc3RUeXBlIH0gZnJvbSAnLi90ZXN0VHlwZSc7XG5pbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuXG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5jb25zdCBleHBlY3QgPSBjaGFpLmV4cGVjdDtcblxuZGVzY3JpYmUoJ1BsdW1wJywgKCkgPT4ge1xuICBpdCgnc2hvdWxkIGFsbG93IGR5bmFtaWMgY3JlYXRpb24gb2YgbW9kZWxzIGZyb20gYSBzY2hlbWEnLCAoKSA9PiB7XG4gICAgY29uc3QgcCA9IG5ldyBQbHVtcCgpO1xuICAgIHAuYWRkVHlwZXNGcm9tU2NoZW1hKHsgdGVzdHM6IFRlc3RUeXBlLnRvSlNPTigpIH0pO1xuICAgIHJldHVybiBleHBlY3QocC5maW5kKCd0ZXN0cycsIDEpLmNvbnN0cnVjdG9yLnRvSlNPTigpKS50by5kZWVwLmVxdWFsKFRlc3RUeXBlLnRvSlNPTigpKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCByZWZyZXNoIGNvbnRlbnRzIG9uIGFuIGludmFsaWRhdGlvbiBldmVudCcsIChkb25lKSA9PiB7XG4gICAgY29uc3QgRGVsYXlQcm94eSA9IHtcbiAgICAgIGdldDogKHRhcmdldCwgbmFtZSkgPT4ge1xuICAgICAgICBpZiAoWydyZWFkJywgJ3dyaXRlJywgJ2FkZCcsICdyZW1vdmUnXS5pbmRleE9mKG5hbWUpID49IDApIHtcbiAgICAgICAgICByZXR1cm4gKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBCbHVlYmlyZC5kZWxheSgyMDApXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0YXJnZXRbbmFtZV0oLi4uYXJncykpO1xuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRhcmdldFtuYW1lXTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IHRlcm1pbmFsU3RvcmUgPSBuZXcgTWVtb3J5U3RvcmFnZSh7IHRlcm1pbmFsOiB0cnVlIH0pO1xuICAgIGNvbnN0IGRlbGF5ZWRNZW1zdG9yZSA9IG5ldyBQcm94eSh0ZXJtaW5hbFN0b3JlLCBEZWxheVByb3h5KTtcbiAgICBjb25zdCBjb2xkTWVtc3RvcmUgPSBuZXcgTWVtb3J5U3RvcmFnZSgpO1xuICAgIGNvbnN0IGhvdE1lbXN0b3JlID0gbmV3IE1lbW9yeVN0b3JhZ2UoKTtcbiAgICBob3RNZW1zdG9yZS5ob3QgPSAoKSA9PiB0cnVlO1xuICAgIGNvbnN0IG90aGVyUGx1bXAgPSBuZXcgUGx1bXAoe1xuICAgICAgc3RvcmFnZTogW2hvdE1lbXN0b3JlLCBjb2xkTWVtc3RvcmUsIGRlbGF5ZWRNZW1zdG9yZV0sXG4gICAgICB0eXBlczogW1Rlc3RUeXBlXSxcbiAgICB9KTtcbiAgICBjb25zdCBpbnZhbGlkYXRlZCA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmb28nIH0sIG90aGVyUGx1bXApO1xuICAgIGludmFsaWRhdGVkLiRzYXZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBsZXQgcGhhc2UgPSAwO1xuICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gaW52YWxpZGF0ZWQuJHN1YnNjcmliZSgodikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChwaGFzZSA9PT0gMCkge1xuICAgICAgICAgICAgaWYgKHYubmFtZSkge1xuICAgICAgICAgICAgICBleHBlY3QodikudG8uaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdmb28nKTtcbiAgICAgICAgICAgICAgcGhhc2UgPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocGhhc2UgPT09IDEpIHtcbiAgICAgICAgICAgIGlmICh2Lm5hbWUgPT09ICdzbG93dGF0bycpIHtcbiAgICAgICAgICAgICAgcGhhc2UgPSAyO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh2Lm5hbWUgPT09ICdncm90YXRvJykge1xuICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocGhhc2UgPT09IDIpIHtcbiAgICAgICAgICAgIGlmICh2Lm5hbWUgIT09ICdzbG93dGF0bycpIHtcbiAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAnZ3JvdGF0bycpO1xuICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgLy8gc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgZG9uZShlcnIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBjb2xkTWVtc3RvcmUuX3NldChcbiAgICAgICAgY29sZE1lbXN0b3JlLmtleVN0cmluZyhUZXN0VHlwZS4kbmFtZSwgaW52YWxpZGF0ZWQuJGlkKSxcbiAgICAgICAgSlNPTi5zdHJpbmdpZnkoeyBpZDogaW52YWxpZGF0ZWQuJGlkLCBuYW1lOiAnc2xvd3RhdG8nIH0pXG4gICAgICApO1xuICAgIH0pXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIHRlcm1pbmFsU3RvcmUuX3NldChcbiAgICAgICAgdGVybWluYWxTdG9yZS5rZXlTdHJpbmcoVGVzdFR5cGUuJG5hbWUsIGludmFsaWRhdGVkLiRpZCksXG4gICAgICAgIEpTT04uc3RyaW5naWZ5KHsgaWQ6IGludmFsaWRhdGVkLiRpZCwgbmFtZTogJ2dyb3RhdG8nIH0pXG4gICAgICApO1xuICAgIH0pXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgLy8gZGVidWdnZXI7XG4gICAgICByZXR1cm4gb3RoZXJQbHVtcC5pbnZhbGlkYXRlKFRlc3RUeXBlLCBpbnZhbGlkYXRlZC4kaWQsICRzZWxmKTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyKSA9PiBkb25lKGVycikpO1xuICB9KTtcbn0pO1xuIl19
