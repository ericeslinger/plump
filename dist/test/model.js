'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _index = require('../index');

var _testType = require('./testType');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* eslint-env node, mocha*/

// For testing while actual bulkRead implementations are in development
_index.Storage.prototype.bulkRead = function bulkRead(opts) {
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

_chai2.default.use(_chaiAsPromised2.default);
var expect = _chai2.default.expect;

describe('model', function () {
  describe('basic functionality', function () {
    it('should return promises to existing data', function () {
      var one = new _testType.TestType({ id: 1, name: 'potato' });
      return expect(one.$get()).to.eventually.have.property('name', 'potato');
    });

    it('should properly serialize its schema', function () {
      var MiniTest = function (_Model) {
        _inherits(MiniTest, _Model);

        function MiniTest() {
          _classCallCheck(this, MiniTest);

          return _possibleConstructorReturn(this, (MiniTest.__proto__ || Object.getPrototypeOf(MiniTest)).apply(this, arguments));
        }

        return MiniTest;
      }(_index.Model);

      MiniTest.fromJSON(_testType.TestType.toJSON());
      return expect(MiniTest.toJSON()).to.deep.equal(_testType.TestType.toJSON());
    });

    it('should load data from datastores', function () {
      return memstore2.write(_testType.TestType, {
        id: 2,
        name: 'potato'
      }).then(function () {
        var two = plump.find('tests', 2);
        return expect(two.$get()).to.eventually.have.property('name', 'potato');
      });
    });

    it('should create an id when one is unset', function () {
      var noID = new _testType.TestType({ name: 'potato' }, plump);
      return expect(noID.$save().then(function (m) {
        return m.$get();
      })).to.eventually.contain.keys('name', 'id');
    });

    it('should allow data to be deleted', function () {
      var one = new _testType.TestType({ name: 'potato' }, plump);
      return one.$save().then(function () {
        return expect(plump.find('tests', one.$id).$get()).to.eventually.have.property('name', 'potato');
      }).then(function () {
        return one.$delete();
      }).then(function () {
        return expect(plump.find('tests', one.$id).$get()).to.eventually.be.null;
      });
    });

    it('should allow fields to be loaded', function () {
      var one = new _testType.TestType({ name: 'p' }, plump);
      return one.$save().then(function () {
        return expect(plump.find('tests', one.$id).$get()).to.eventually.have.property('name', 'p');
      }).then(function () {
        return expect(plump.find('tests', one.$id).$get(_index.$all)).to.eventually.deep.equal(_testType.TestType.assign({ name: 'p', id: one.$id }));
      });
    });

    it('should only load base fields on $get($self)', function () {
      var one = new _testType.TestType({ name: 'potato' }, plump);
      return one.$save().then(function () {
        var baseFields = Object.keys(_testType.TestType.$fields).filter(function (field) {
          return _testType.TestType.$fields[field].type !== 'hasMany';
        });
        // const hasManys = Object.keys(TestType.$fields).filter(field => TestType.$fields[field].type === 'hasMany');

        return expect(plump.find('tests', one.$id).$get()).to.eventually.have.all.keys(baseFields);
        // NOTE: .have.all requires list length equality
        // .and.not.keys(hasManys);
      });
    });

    it('should optimistically update on field updates', function () {
      var one = new _testType.TestType({ name: 'potato' }, plump);
      return one.$save().then(function () {
        return one.$set({ name: 'rutabaga' });
      }).then(function () {
        return expect(one.$get()).to.eventually.have.property('name', 'rutabaga');
      });
    });

    it('should package all related models for read', function () {
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
        return expect(one.$package()).to.eventually.deep.equal(JSON.parse(_fs2.default.readFileSync('src/test/testType.json')));
      });
    });
  });

  describe('relationships', function () {
    it('should show empty hasMany lists as {key: []}', function () {
      var one = new _testType.TestType({ name: 'frotato' }, plump);
      return one.$save().then(function () {
        return expect(one.$get('children')).to.eventually.deep.equal({ children: [] });
      });
    });

    it('should add hasMany elements', function () {
      var one = new _testType.TestType({ name: 'frotato' }, plump);
      return one.$save().then(function () {
        return one.$add('children', 100);
      }).then(function () {
        return expect(one.$get('children')).to.eventually.deep.equal({ children: [{
            child_id: 100,
            parent_id: one.$id
          }] });
      });
    });

    it('should add hasMany elements by child field', function () {
      var one = new _testType.TestType({ name: 'frotato' }, plump);
      return one.$save().then(function () {
        return one.$add('children', { child_id: 100 });
      }).then(function () {
        return expect(one.$get('children')).to.eventually.deep.equal({ children: [{
            child_id: 100,
            parent_id: one.$id
          }] });
      });
    });

    it('should remove hasMany elements', function () {
      var one = new _testType.TestType({ name: 'frotato' }, plump);
      return one.$save().then(function () {
        return one.$add('children', 100);
      }).then(function () {
        return expect(one.$get('children')).to.eventually.deep.equal({ children: [{
            child_id: 100,
            parent_id: one.$id
          }] });
      }).then(function () {
        return one.$remove('children', 100);
      }).then(function () {
        return expect(one.$get('children')).to.eventually.deep.equal({ children: [] });
      });
    });

    it('should include valence in hasMany operations', function () {
      var one = new _testType.TestType({ name: 'grotato' }, plump);
      return one.$save().then(function () {
        return one.$add('valenceChildren', 100, { perm: 1 });
      }).then(function () {
        return one.$get('valenceChildren');
      }).then(function () {
        return expect(one.$get('valenceChildren')).to.eventually.deep.equal({ valenceChildren: [{
            child_id: 100,
            parent_id: one.$id,
            perm: 1
          }] });
      }).then(function () {
        return one.$modifyRelationship('valenceChildren', 100, { perm: 2 });
      }).then(function () {
        return expect(one.$get('valenceChildren')).to.eventually.deep.equal({ valenceChildren: [{
            child_id: 100,
            parent_id: one.$id,
            perm: 2
          }] });
      });
    });
  });

  describe('events', function () {
    it('should allow subscription to model data', function (done) {
      var one = new _testType.TestType({ name: 'potato' }, plump);
      var phase = 0;
      one.$save().then(function () {
        var subscription = one.$subscribe(function (v) {
          try {
            if (phase === 0) {
              if (v.name) {
                phase = 1;
              }
            }
            if (phase === 1) {
              expect(v).to.have.property('name', 'potato');
              if (v.id !== undefined) {
                phase = 2;
              }
            }
            if (phase === 2) {
              if (v.name !== 'potato') {
                expect(v).to.have.property('name', 'grotato');
                phase = 3;
              }
            }
            if (phase === 3) {
              if (v.children && v.children.length > 0) {
                expect(v.children).to.deep.equal([{
                  child_id: 100,
                  parent_id: one.$id
                }]);
                subscription.unsubscribe();
                done();
              }
            }
          } catch (err) {
            done(err);
          }
        });
      }).then(function () {
        return one.$set({ name: 'grotato' });
      }).then(function () {
        return one.$add('children', { child_id: 100 });
      });
    });

    it('should allow subscription to model sideloads', function (done) {
      var one = new _testType.TestType({ name: 'potato' }, plump);
      var phase = 0;
      one.$save().then(function () {
        return one.$add('children', { child_id: 100 });
      }).then(function () {
        var subscription = one.$subscribe([_index.$all], function (v) {
          try {
            if (phase === 0) {
              if (v.name) {
                phase = 1;
              }
            }
            if (phase === 1) {
              expect(v).to.have.property('name', 'potato');
              expect(v.children).to.deep.equal([{
                child_id: 100,
                parent_id: one.$id
              }]);
              phase = 2;
            }
            if (phase === 2) {
              if (v.children && v.children.length > 1) {
                expect(v.children).to.deep.equal([{
                  child_id: 100,
                  parent_id: one.$id
                }, {
                  child_id: 101,
                  parent_id: one.$id
                }]);
                subscription.unsubscribe();
                done();
              }
            }
          } catch (err) {
            done(err);
          }
        });
      }).then(function () {
        return one.$add('children', { child_id: 101 });
      });
    });

    it('should update on cacheable read events', function (done) {
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
      var delayedMemstore = new Proxy(new _index.MemoryStorage({ terminal: true }), DelayProxy);
      var coldMemstore = new _index.MemoryStorage();
      var otherPlump = new _index.Plump({
        storage: [coldMemstore, delayedMemstore],
        types: [_testType.TestType]
      });
      var one = new _testType.TestType({ name: 'slowtato' }, otherPlump);
      one.$save().then(function () {
        return one.$get();
      }).then(function (val) {
        return coldMemstore.write(_testType.TestType, {
          name: 'potato',
          id: val.id
        }).then(function () {
          var phase = 0;
          var two = otherPlump.find('tests', val.id);
          var subscription = two.$subscribe(function (v) {
            try {
              if (phase === 0) {
                if (v.name) {
                  expect(v).to.have.property('name', 'potato');
                  phase = 1;
                }
              }
              if (phase === 1) {
                if (v.name !== 'potato') {
                  expect(v).to.have.property('name', 'slowtato');
                  subscription.unsubscribe();
                  done();
                }
              }
            } catch (err) {
              subscription.unsubscribe();
              done(err);
            }
          });
        });
      });
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsicHJvdG90eXBlIiwiYnVsa1JlYWQiLCJvcHRzIiwiYWxsIiwicmVhZCIsInRoZW4iLCJjaGlsZHJlbiIsIm1lbXN0b3JlMiIsInRlcm1pbmFsIiwicGx1bXAiLCJzdG9yYWdlIiwidHlwZXMiLCJ1c2UiLCJleHBlY3QiLCJkZXNjcmliZSIsIml0Iiwib25lIiwiaWQiLCJuYW1lIiwiJGdldCIsInRvIiwiZXZlbnR1YWxseSIsImhhdmUiLCJwcm9wZXJ0eSIsIk1pbmlUZXN0IiwiZnJvbUpTT04iLCJ0b0pTT04iLCJkZWVwIiwiZXF1YWwiLCJ3cml0ZSIsInR3byIsImZpbmQiLCJub0lEIiwiJHNhdmUiLCJtIiwiY29udGFpbiIsImtleXMiLCIkaWQiLCIkZGVsZXRlIiwiYmUiLCJudWxsIiwiYXNzaWduIiwiYmFzZUZpZWxkcyIsIk9iamVjdCIsIiRmaWVsZHMiLCJmaWx0ZXIiLCJmaWVsZCIsInR5cGUiLCIkc2V0IiwiZXh0ZW5kZWQiLCJjb2hvcnQiLCJ0aHJlZSIsIiRhZGQiLCIkcGFja2FnZSIsIkpTT04iLCJwYXJzZSIsInJlYWRGaWxlU3luYyIsImNoaWxkX2lkIiwicGFyZW50X2lkIiwiJHJlbW92ZSIsInBlcm0iLCJ2YWxlbmNlQ2hpbGRyZW4iLCIkbW9kaWZ5UmVsYXRpb25zaGlwIiwiZG9uZSIsInBoYXNlIiwic3Vic2NyaXB0aW9uIiwiJHN1YnNjcmliZSIsInYiLCJ1bmRlZmluZWQiLCJsZW5ndGgiLCJ1bnN1YnNjcmliZSIsImVyciIsIkRlbGF5UHJveHkiLCJnZXQiLCJ0YXJnZXQiLCJpbmRleE9mIiwiYXJncyIsImRlbGF5IiwiZGVsYXllZE1lbXN0b3JlIiwiUHJveHkiLCJjb2xkTWVtc3RvcmUiLCJvdGhlclBsdW1wIiwidmFsIl0sIm1hcHBpbmdzIjoiOztBQUVBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBRUE7O0FBQ0E7Ozs7Ozs7OytlQVJBOztBQVVBO0FBQ0EsZUFBUUEs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MkIsTUFBM0IsRUFBbUMsVUFBbkM7QUFDQTBDLCtCQUFhSyxXQUFiO0FBQ0FQO0FBQ0Q7QUFDRjtBQUNGLGFBZEQsQ0FjRSxPQUFPUSxHQUFQLEVBQVk7QUFDWk4sMkJBQWFLLFdBQWI7QUFDQVAsbUJBQUtRLEdBQUw7QUFDRDtBQUNGLFdBbkJvQixDQUFyQjtBQW9CRCxTQTNCTSxDQUFQO0FBNEJELE9BL0JEO0FBZ0NELEtBcEREO0FBcURELEdBM0lEO0FBNElELENBdlREIiwiZmlsZSI6InRlc3QvbW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZW52IG5vZGUsIG1vY2hhKi9cblxuaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5pbXBvcnQgY2hhaUFzUHJvbWlzZWQgZnJvbSAnY2hhaS1hcy1wcm9taXNlZCc7XG5pbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcblxuaW1wb3J0IHsgUGx1bXAsIE1vZGVsLCBTdG9yYWdlLCBNZW1vcnlTdG9yYWdlLCAkYWxsIH0gZnJvbSAnLi4vaW5kZXgnO1xuaW1wb3J0IHsgVGVzdFR5cGUgfSBmcm9tICcuL3Rlc3RUeXBlJztcblxuLy8gRm9yIHRlc3Rpbmcgd2hpbGUgYWN0dWFsIGJ1bGtSZWFkIGltcGxlbWVudGF0aW9ucyBhcmUgaW4gZGV2ZWxvcG1lbnRcblN0b3JhZ2UucHJvdG90eXBlLmJ1bGtSZWFkID0gZnVuY3Rpb24gYnVsa1JlYWQob3B0cykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgIHRoaXMucmVhZChUZXN0VHlwZSwgMiwgJGFsbCksXG4gICAgdGhpcy5yZWFkKFRlc3RUeXBlLCAzLCAkYWxsKSxcbiAgXSkudGhlbihjaGlsZHJlbiA9PiB7XG4gICAgcmV0dXJuIHsgY2hpbGRyZW4gfTtcbiAgfSk7XG59O1xuXG5jb25zdCBtZW1zdG9yZTIgPSBuZXcgTWVtb3J5U3RvcmFnZSh7IHRlcm1pbmFsOiB0cnVlIH0pO1xuXG5jb25zdCBwbHVtcCA9IG5ldyBQbHVtcCh7XG4gIHN0b3JhZ2U6IFttZW1zdG9yZTJdLFxuICB0eXBlczogW1Rlc3RUeXBlXSxcbn0pO1xuXG5cbmNoYWkudXNlKGNoYWlBc1Byb21pc2VkKTtcbmNvbnN0IGV4cGVjdCA9IGNoYWkuZXhwZWN0O1xuXG5kZXNjcmliZSgnbW9kZWwnLCAoKSA9PiB7XG4gIGRlc2NyaWJlKCdiYXNpYyBmdW5jdGlvbmFsaXR5JywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcmV0dXJuIHByb21pc2VzIHRvIGV4aXN0aW5nIGRhdGEnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBpZDogMSwgbmFtZTogJ3BvdGF0bycgfSk7XG4gICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcHJvcGVybHkgc2VyaWFsaXplIGl0cyBzY2hlbWEnLCAoKSA9PiB7XG4gICAgICBjbGFzcyBNaW5pVGVzdCBleHRlbmRzIE1vZGVsIHt9XG4gICAgICBNaW5pVGVzdC5mcm9tSlNPTihUZXN0VHlwZS50b0pTT04oKSk7XG4gICAgICByZXR1cm4gZXhwZWN0KE1pbmlUZXN0LnRvSlNPTigpKS50by5kZWVwLmVxdWFsKFRlc3RUeXBlLnRvSlNPTigpKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgbG9hZCBkYXRhIGZyb20gZGF0YXN0b3JlcycsICgpID0+IHtcbiAgICAgIHJldHVybiBtZW1zdG9yZTIud3JpdGUoVGVzdFR5cGUsIHtcbiAgICAgICAgaWQ6IDIsXG4gICAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IHR3byA9IHBsdW1wLmZpbmQoJ3Rlc3RzJywgMik7XG4gICAgICAgIHJldHVybiBleHBlY3QodHdvLiRnZXQoKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGNyZWF0ZSBhbiBpZCB3aGVuIG9uZSBpcyB1bnNldCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG5vSUQgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gZXhwZWN0KG5vSUQuJHNhdmUoKS50aGVuKChtKSA9PiBtLiRnZXQoKSkpLnRvLmV2ZW50dWFsbHkuY29udGFpbi5rZXlzKCduYW1lJywgJ2lkJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFsbG93IGRhdGEgdG8gYmUgZGVsZXRlZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KHBsdW1wLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJykpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGRlbGV0ZSgpKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KHBsdW1wLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgpKS50by5ldmVudHVhbGx5LmJlLm51bGwpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhbGxvdyBmaWVsZHMgdG8gYmUgbG9hZGVkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3AnIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KHBsdW1wLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncCcpKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KHBsdW1wLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgkYWxsKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChUZXN0VHlwZS5hc3NpZ24oeyBuYW1lOiAncCcsIGlkOiBvbmUuJGlkIH0pKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBvbmx5IGxvYWQgYmFzZSBmaWVsZHMgb24gJGdldCgkc2VsZiknLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3QgYmFzZUZpZWxkcyA9IE9iamVjdC5rZXlzKFRlc3RUeXBlLiRmaWVsZHMpLmZpbHRlcihmaWVsZCA9PiBUZXN0VHlwZS4kZmllbGRzW2ZpZWxkXS50eXBlICE9PSAnaGFzTWFueScpO1xuICAgICAgICAvLyBjb25zdCBoYXNNYW55cyA9IE9iamVjdC5rZXlzKFRlc3RUeXBlLiRmaWVsZHMpLmZpbHRlcihmaWVsZCA9PiBUZXN0VHlwZS4kZmllbGRzW2ZpZWxkXS50eXBlID09PSAnaGFzTWFueScpO1xuXG4gICAgICAgIHJldHVybiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5hbGwua2V5cyhiYXNlRmllbGRzKTtcbiAgICAgICAgLy8gTk9URTogLmhhdmUuYWxsIHJlcXVpcmVzIGxpc3QgbGVuZ3RoIGVxdWFsaXR5XG4gICAgICAgIC8vIC5hbmQubm90LmtleXMoaGFzTWFueXMpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIG9wdGltaXN0aWNhbGx5IHVwZGF0ZSBvbiBmaWVsZCB1cGRhdGVzJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJHNldCh7IG5hbWU6ICdydXRhYmFnYScgfSkpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3J1dGFiYWdhJykpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBwYWNrYWdlIGFsbCByZWxhdGVkIG1vZGVscyBmb3IgcmVhZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7XG4gICAgICAgIGlkOiAxLFxuICAgICAgICBuYW1lOiAncG90YXRvJyxcbiAgICAgIH0sIHBsdW1wKTtcbiAgICAgIGNvbnN0IHR3byA9IG5ldyBUZXN0VHlwZSh7XG4gICAgICAgIGlkOiAyLFxuICAgICAgICBuYW1lOiAnZnJvdGF0bycsXG4gICAgICAgIGV4dGVuZGVkOiB7IGNvaG9ydDogMjAxMyB9LFxuICAgICAgfSwgcGx1bXApO1xuICAgICAgY29uc3QgdGhyZWUgPSBuZXcgVGVzdFR5cGUoe1xuICAgICAgICBpZDogMyxcbiAgICAgICAgbmFtZTogJ3J1dGFiYWdhJyxcbiAgICAgIH0sIHBsdW1wKTtcblxuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIG9uZS4kc2F2ZSgpLFxuICAgICAgICB0d28uJHNhdmUoKSxcbiAgICAgICAgdGhyZWUuJHNhdmUoKSxcbiAgICAgIF0pLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgICBvbmUuJGFkZCgnY2hpbGRyZW4nLCB0d28uJGlkKSxcbiAgICAgICAgICB0d28uJGFkZCgnY2hpbGRyZW4nLCB0aHJlZS4kaWQpLFxuICAgICAgICBdKTtcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kcGFja2FnZSgpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoXG4gICAgICAgICAgSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMoJ3NyYy90ZXN0L3Rlc3RUeXBlLmpzb24nKSlcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgncmVsYXRpb25zaGlwcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHNob3cgZW1wdHkgaGFzTWFueSBsaXN0cyBhcyB7a2V5OiBbXX0nLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IGNoaWxkcmVuOiBbXSB9KSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFkZCBoYXNNYW55IGVsZW1lbnRzJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2Zyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IGNoaWxkcmVuOiBbe1xuICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICB9XSB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhZGQgaGFzTWFueSBlbGVtZW50cyBieSBjaGlsZCBmaWVsZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIHsgY2hpbGRfaWQ6IDEwMCB9KSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IGNoaWxkcmVuOiBbe1xuICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICB9XSB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZW1vdmUgaGFzTWFueSBlbGVtZW50cycsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIDEwMCkpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoeyBjaGlsZHJlbjogW3tcbiAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgfV0gfSk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRyZW1vdmUoJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgY2hpbGRyZW46IFtdIH0pKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaW5jbHVkZSB2YWxlbmNlIGluIGhhc01hbnkgb3BlcmF0aW9ucycsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdncm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCd2YWxlbmNlQ2hpbGRyZW4nLCAxMDAsIHsgcGVybTogMSB9KSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kZ2V0KCd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoeyB2YWxlbmNlQ2hpbGRyZW46IFt7XG4gICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgICAgcGVybTogMSxcbiAgICAgICAgfV0gfSk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRtb2RpZnlSZWxhdGlvbnNoaXAoJ3ZhbGVuY2VDaGlsZHJlbicsIDEwMCwgeyBwZXJtOiAyIH0pKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IHZhbGVuY2VDaGlsZHJlbjogW3tcbiAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgICBwZXJtOiAyLFxuICAgICAgICB9XSB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZXZlbnRzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgYWxsb3cgc3Vic2NyaXB0aW9uIHRvIG1vZGVsIGRhdGEnLCAoZG9uZSkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgbGV0IHBoYXNlID0gMDtcbiAgICAgIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG9uZS4kc3Vic2NyaWJlKCh2KSA9PiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMCkge1xuICAgICAgICAgICAgICBpZiAodi5uYW1lKSB7XG4gICAgICAgICAgICAgICAgcGhhc2UgPSAxO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGhhc2UgPT09IDEpIHtcbiAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgICAgICAgICAgIGlmICh2LmlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBwaGFzZSA9IDI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMikge1xuICAgICAgICAgICAgICBpZiAodi5uYW1lICE9PSAncG90YXRvJykge1xuICAgICAgICAgICAgICAgIGV4cGVjdCh2KS50by5oYXZlLnByb3BlcnR5KCduYW1lJywgJ2dyb3RhdG8nKTtcbiAgICAgICAgICAgICAgICBwaGFzZSA9IDM7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMykge1xuICAgICAgICAgICAgICBpZiAoKHYuY2hpbGRyZW4pICYmICh2LmNoaWxkcmVuLmxlbmd0aCA+IDApKSB7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHYuY2hpbGRyZW4pLnRvLmRlZXAuZXF1YWwoW3tcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgZG9uZShlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRzZXQoeyBuYW1lOiAnZ3JvdGF0bycgfSkpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCB7IGNoaWxkX2lkOiAxMDAgfSkpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhbGxvdyBzdWJzY3JpcHRpb24gdG8gbW9kZWwgc2lkZWxvYWRzJywgKGRvbmUpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIGxldCBwaGFzZSA9IDA7XG4gICAgICBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgeyBjaGlsZF9pZDogMTAwIH0pKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBvbmUuJHN1YnNjcmliZShbJGFsbF0sICh2KSA9PiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMCkge1xuICAgICAgICAgICAgICBpZiAodi5uYW1lKSB7XG4gICAgICAgICAgICAgICAgcGhhc2UgPSAxO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGhhc2UgPT09IDEpIHtcbiAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgICAgICAgICAgIGV4cGVjdCh2LmNoaWxkcmVuKS50by5kZWVwLmVxdWFsKFt7XG4gICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgcGhhc2UgPSAyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBoYXNlID09PSAyKSB7XG4gICAgICAgICAgICAgIGlmICgodi5jaGlsZHJlbikgJiYgKHYuY2hpbGRyZW4ubGVuZ3RoID4gMSkpIHtcbiAgICAgICAgICAgICAgICBleHBlY3Qodi5jaGlsZHJlbikudG8uZGVlcC5lcXVhbChbe1xuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAxLFxuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICBkb25lKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGRvbmUoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIHsgY2hpbGRfaWQ6IDEwMSB9KSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHVwZGF0ZSBvbiBjYWNoZWFibGUgcmVhZCBldmVudHMnLCAoZG9uZSkgPT4ge1xuICAgICAgY29uc3QgRGVsYXlQcm94eSA9IHtcbiAgICAgICAgZ2V0OiAodGFyZ2V0LCBuYW1lKSA9PiB7XG4gICAgICAgICAgaWYgKFsncmVhZCcsICd3cml0ZScsICdhZGQnLCAncmVtb3ZlJ10uaW5kZXhPZihuYW1lKSA+PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIEJsdWViaXJkLmRlbGF5KDIwMClcbiAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGFyZ2V0W25hbWVdKC4uLmFyZ3MpKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0YXJnZXRbbmFtZV07XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICAgIGNvbnN0IGRlbGF5ZWRNZW1zdG9yZSA9IG5ldyBQcm94eShuZXcgTWVtb3J5U3RvcmFnZSh7IHRlcm1pbmFsOiB0cnVlIH0pLCBEZWxheVByb3h5KTtcbiAgICAgIGNvbnN0IGNvbGRNZW1zdG9yZSA9IG5ldyBNZW1vcnlTdG9yYWdlKCk7XG4gICAgICBjb25zdCBvdGhlclBsdW1wID0gbmV3IFBsdW1wKHtcbiAgICAgICAgc3RvcmFnZTogW2NvbGRNZW1zdG9yZSwgZGVsYXllZE1lbXN0b3JlXSxcbiAgICAgICAgdHlwZXM6IFtUZXN0VHlwZV0sXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdzbG93dGF0bycgfSwgb3RoZXJQbHVtcCk7XG4gICAgICBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRnZXQoKSlcbiAgICAgIC50aGVuKCh2YWwpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbGRNZW1zdG9yZS53cml0ZShUZXN0VHlwZSwge1xuICAgICAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgICAgICAgIGlkOiB2YWwuaWQsXG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICBsZXQgcGhhc2UgPSAwO1xuICAgICAgICAgIGNvbnN0IHR3byA9IG90aGVyUGx1bXAuZmluZCgndGVzdHMnLCB2YWwuaWQpO1xuICAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IHR3by4kc3Vic2NyaWJlKCh2KSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBpZiAocGhhc2UgPT09IDApIHtcbiAgICAgICAgICAgICAgICBpZiAodi5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICBleHBlY3QodikudG8uaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICAgICAgICAgICAgICAgIHBoYXNlID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHBoYXNlID09PSAxKSB7XG4gICAgICAgICAgICAgICAgaWYgKHYubmFtZSAhPT0gJ3BvdGF0bycpIHtcbiAgICAgICAgICAgICAgICAgIGV4cGVjdCh2KS50by5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3Nsb3d0YXRvJyk7XG4gICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgZG9uZShlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19
