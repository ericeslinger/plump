'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _index = require('../index');

var _testType = require('./testType');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* eslint-env node, mocha*/

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
        return expect(plump.find('tests', one.$id).$get()).to.eventually.deep.equal(_testType.TestType.assign({ name: 'p', id: one.$id }));
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
  });

  describe('relationships', function () {
    it('should show empty hasMany lists as []', function () {
      var one = new _testType.TestType({ name: 'frotato' }, plump);
      return one.$save().then(function () {
        return expect(one.$get('children')).to.eventually.deep.equal([]);
      });
    });

    it('should add hasMany elements', function () {
      var one = new _testType.TestType({ name: 'frotato' }, plump);
      return one.$save().then(function () {
        return one.$add('children', 100);
      }).then(function () {
        return expect(one.$get('children')).to.eventually.deep.equal([{
          child_id: 100,
          parent_id: one.$id
        }]);
      });
    });

    it('should add hasMany elements by child field', function () {
      var one = new _testType.TestType({ name: 'frotato' }, plump);
      return one.$save().then(function () {
        return one.$add('children', { child_id: 100 });
      }).then(function () {
        return expect(one.$get('children')).to.eventually.deep.equal([{
          child_id: 100,
          parent_id: one.$id
        }]);
      });
    });

    it('should remove hasMany elements', function () {
      var one = new _testType.TestType({ name: 'frotato' }, plump);
      return one.$save().then(function () {
        return one.$add('children', 100);
      }).then(function () {
        return expect(one.$get('children')).to.eventually.deep.equal([{
          child_id: 100,
          parent_id: one.$id
        }]);
      }).then(function () {
        return one.$remove('children', 100);
      }).then(function () {
        return expect(one.$get('children')).to.eventually.deep.equal([]);
      });
    });

    it('should include valence in hasMany operations', function () {
      var one = new _testType.TestType({ name: 'grotato' }, plump);
      return one.$save().then(function () {
        return one.$add('valenceChildren', 100, { perm: 1 });
      }).then(function () {
        return one.$get('valenceChildren');
      }).then(function () {
        return expect(one.$get('valenceChildren')).to.eventually.deep.equal([{
          child_id: 100,
          parent_id: one.$id,
          perm: 1
        }]);
      }).then(function () {
        return one.$modifyRelationship('valenceChildren', 100, { perm: 2 });
      }).then(function () {
        return expect(one.$get('valenceChildren')).to.eventually.deep.equal([{
          child_id: 100,
          parent_id: one.$id,
          perm: 2
        }]);
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
            console.log(phase + ': ' + JSON.stringify(v, null, 2));
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUyIiwidGVybWluYWwiLCJwbHVtcCIsInN0b3JhZ2UiLCJ0eXBlcyIsInVzZSIsImV4cGVjdCIsImRlc2NyaWJlIiwiaXQiLCJvbmUiLCJpZCIsIm5hbWUiLCIkZ2V0IiwidG8iLCJldmVudHVhbGx5IiwiaGF2ZSIsInByb3BlcnR5IiwiTWluaVRlc3QiLCJmcm9tSlNPTiIsInRvSlNPTiIsImRlZXAiLCJlcXVhbCIsIndyaXRlIiwidGhlbiIsInR3byIsImZpbmQiLCJub0lEIiwiJHNhdmUiLCJtIiwiY29udGFpbiIsImtleXMiLCIkaWQiLCIkZGVsZXRlIiwiYmUiLCJudWxsIiwiYXNzaWduIiwiJHNldCIsIiRhZGQiLCJjaGlsZF9pZCIsInBhcmVudF9pZCIsIiRyZW1vdmUiLCJwZXJtIiwiJG1vZGlmeVJlbGF0aW9uc2hpcCIsImRvbmUiLCJwaGFzZSIsInN1YnNjcmlwdGlvbiIsIiRzdWJzY3JpYmUiLCJ2IiwidW5kZWZpbmVkIiwiY2hpbGRyZW4iLCJsZW5ndGgiLCJ1bnN1YnNjcmliZSIsImVyciIsImNvbnNvbGUiLCJsb2ciLCJKU09OIiwic3RyaW5naWZ5IiwiRGVsYXlQcm94eSIsImdldCIsInRhcmdldCIsImluZGV4T2YiLCJhcmdzIiwiZGVsYXkiLCJkZWxheWVkTWVtc3RvcmUiLCJQcm94eSIsImNvbGRNZW1zdG9yZSIsIm90aGVyUGx1bXAiLCJ2YWwiXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBRUE7O0FBQ0E7Ozs7Ozs7OytlQVBBOztBQVNBLElBQU1BLFlBQVkseUJBQWtCLEVBQUVDLFVBQVUsSUFBWixFQUFsQixDQUFsQjs7QUFFQSxJQUFNQyxRQUFRLGlCQUFVO0FBQ3RCQyxXQUFTLENBQUNILFNBQUQsQ0FEYTtBQUV0QkksU0FBTztBQUZlLENBQVYsQ0FBZDs7QUFNQSxlQUFLQyxHQUFMO0FBQ0EsSUFBTUMsU0FBUyxlQUFLQSxNQUFwQjs7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Q0FBUCxFQUFVbEMsRUFBVixDQUFhRSxJQUFiLENBQWtCQyxRQUFsQixDQUEyQixNQUEzQixFQUFtQyxVQUFuQztBQUNBNkIsK0JBQWFNLFdBQWI7QUFDQVI7QUFDRDtBQUNGO0FBQ0YsYUFkRCxDQWNFLE9BQU9TLEdBQVAsRUFBWTtBQUNaUCwyQkFBYU0sV0FBYjtBQUNBUixtQkFBS1MsR0FBTDtBQUNEO0FBQ0YsV0FuQm9CLENBQXJCO0FBb0JELFNBM0JNLENBQVA7QUE0QkQsT0EvQkQ7QUFnQ0QsS0FwREQ7QUFxREQsR0E1SUQ7QUE2SUQsQ0E1UUQiLCJmaWxlIjoidGVzdC9tb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1lbnYgbm9kZSwgbW9jaGEqL1xuXG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5cbmltcG9ydCB7IFBsdW1wLCBNb2RlbCwgTWVtb3J5U3RvcmFnZSwgJGFsbCB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7IFRlc3RUeXBlIH0gZnJvbSAnLi90ZXN0VHlwZSc7XG5cbmNvbnN0IG1lbXN0b3JlMiA9IG5ldyBNZW1vcnlTdG9yYWdlKHsgdGVybWluYWw6IHRydWUgfSk7XG5cbmNvbnN0IHBsdW1wID0gbmV3IFBsdW1wKHtcbiAgc3RvcmFnZTogW21lbXN0b3JlMl0sXG4gIHR5cGVzOiBbVGVzdFR5cGVdLFxufSk7XG5cblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbmRlc2NyaWJlKCdtb2RlbCcsICgpID0+IHtcbiAgZGVzY3JpYmUoJ2Jhc2ljIGZ1bmN0aW9uYWxpdHknLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gcHJvbWlzZXMgdG8gZXhpc3RpbmcgZGF0YScsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IGlkOiAxLCBuYW1lOiAncG90YXRvJyB9KTtcbiAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBwcm9wZXJseSBzZXJpYWxpemUgaXRzIHNjaGVtYScsICgpID0+IHtcbiAgICAgIGNsYXNzIE1pbmlUZXN0IGV4dGVuZHMgTW9kZWwge31cbiAgICAgIE1pbmlUZXN0LmZyb21KU09OKFRlc3RUeXBlLnRvSlNPTigpKTtcbiAgICAgIHJldHVybiBleHBlY3QoTWluaVRlc3QudG9KU09OKCkpLnRvLmRlZXAuZXF1YWwoVGVzdFR5cGUudG9KU09OKCkpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBsb2FkIGRhdGEgZnJvbSBkYXRhc3RvcmVzJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIG1lbXN0b3JlMi53cml0ZShUZXN0VHlwZSwge1xuICAgICAgICBpZDogMixcbiAgICAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3QgdHdvID0gcGx1bXAuZmluZCgndGVzdHMnLCAyKTtcbiAgICAgICAgcmV0dXJuIGV4cGVjdCh0d28uJGdldCgpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY3JlYXRlIGFuIGlkIHdoZW4gb25lIGlzIHVuc2V0JywgKCkgPT4ge1xuICAgICAgY29uc3Qgbm9JRCA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBleHBlY3Qobm9JRC4kc2F2ZSgpLnRoZW4oKG0pID0+IG0uJGdldCgpKSkudG8uZXZlbnR1YWxseS5jb250YWluLmtleXMoJ25hbWUnLCAnaWQnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWxsb3cgZGF0YSB0byBiZSBkZWxldGVkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kZGVsZXRlKCkpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuYmUubnVsbCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFsbG93IGZpZWxkcyB0byBiZSBsb2FkZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncCcgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwJykpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoVGVzdFR5cGUuYXNzaWduKHsgbmFtZTogJ3AnLCBpZDogb25lLiRpZCB9KSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgb3B0aW1pc3RpY2FsbHkgdXBkYXRlIG9uIGZpZWxkIHVwZGF0ZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kc2V0KHsgbmFtZTogJ3J1dGFiYWdhJyB9KSlcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncnV0YWJhZ2EnKSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdyZWxhdGlvbnNoaXBzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgc2hvdyBlbXB0eSBoYXNNYW55IGxpc3RzIGFzIFtdJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2Zyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW10pKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWRkIGhhc01hbnkgZWxlbWVudHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFt7XG4gICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgIH1dKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhZGQgaGFzTWFueSBlbGVtZW50cyBieSBjaGlsZCBmaWVsZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIHsgY2hpbGRfaWQ6IDEwMCB9KSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbe1xuICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICB9XSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmVtb3ZlIGhhc01hbnkgZWxlbWVudHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFt7XG4gICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgIH1dKTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiBvbmUuJHJlbW92ZSgnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW10pKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaW5jbHVkZSB2YWxlbmNlIGluIGhhc01hbnkgb3BlcmF0aW9ucycsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdncm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCd2YWxlbmNlQ2hpbGRyZW4nLCAxMDAsIHsgcGVybTogMSB9KSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kZ2V0KCd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW3tcbiAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgICBwZXJtOiAxLFxuICAgICAgICB9XSk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRtb2RpZnlSZWxhdGlvbnNoaXAoJ3ZhbGVuY2VDaGlsZHJlbicsIDEwMCwgeyBwZXJtOiAyIH0pKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbe1xuICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICAgIHBlcm06IDIsXG4gICAgICAgIH1dKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZXZlbnRzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgYWxsb3cgc3Vic2NyaXB0aW9uIHRvIG1vZGVsIGRhdGEnLCAoZG9uZSkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgbGV0IHBoYXNlID0gMDtcbiAgICAgIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG9uZS4kc3Vic2NyaWJlKCh2KSA9PiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMCkge1xuICAgICAgICAgICAgICBpZiAodi5uYW1lKSB7XG4gICAgICAgICAgICAgICAgcGhhc2UgPSAxO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGhhc2UgPT09IDEpIHtcbiAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgICAgICAgICAgIGlmICh2LmlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBwaGFzZSA9IDI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMikge1xuICAgICAgICAgICAgICBpZiAodi5uYW1lICE9PSAncG90YXRvJykge1xuICAgICAgICAgICAgICAgIGV4cGVjdCh2KS50by5oYXZlLnByb3BlcnR5KCduYW1lJywgJ2dyb3RhdG8nKTtcbiAgICAgICAgICAgICAgICBwaGFzZSA9IDM7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMykge1xuICAgICAgICAgICAgICBpZiAoKHYuY2hpbGRyZW4pICYmICh2LmNoaWxkcmVuLmxlbmd0aCA+IDApKSB7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHYuY2hpbGRyZW4pLnRvLmRlZXAuZXF1YWwoW3tcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgZG9uZShlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRzZXQoeyBuYW1lOiAnZ3JvdGF0bycgfSkpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCB7IGNoaWxkX2lkOiAxMDAgfSkpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhbGxvdyBzdWJzY3JpcHRpb24gdG8gbW9kZWwgc2lkZWxvYWRzJywgKGRvbmUpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIGxldCBwaGFzZSA9IDA7XG4gICAgICBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgeyBjaGlsZF9pZDogMTAwIH0pKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBvbmUuJHN1YnNjcmliZShbJGFsbF0sICh2KSA9PiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAke3BoYXNlfTogJHtKU09OLnN0cmluZ2lmeSh2LCBudWxsLCAyKX1gKTtcbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMCkge1xuICAgICAgICAgICAgICBpZiAodi5uYW1lKSB7XG4gICAgICAgICAgICAgICAgcGhhc2UgPSAxO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGhhc2UgPT09IDEpIHtcbiAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgICAgICAgICAgIGV4cGVjdCh2LmNoaWxkcmVuKS50by5kZWVwLmVxdWFsKFt7XG4gICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgcGhhc2UgPSAyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBoYXNlID09PSAyKSB7XG4gICAgICAgICAgICAgIGlmICgodi5jaGlsZHJlbikgJiYgKHYuY2hpbGRyZW4ubGVuZ3RoID4gMSkpIHtcbiAgICAgICAgICAgICAgICBleHBlY3Qodi5jaGlsZHJlbikudG8uZGVlcC5lcXVhbChbe1xuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAxLFxuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICBkb25lKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGRvbmUoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIHsgY2hpbGRfaWQ6IDEwMSB9KSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHVwZGF0ZSBvbiBjYWNoZWFibGUgcmVhZCBldmVudHMnLCAoZG9uZSkgPT4ge1xuICAgICAgY29uc3QgRGVsYXlQcm94eSA9IHtcbiAgICAgICAgZ2V0OiAodGFyZ2V0LCBuYW1lKSA9PiB7XG4gICAgICAgICAgaWYgKFsncmVhZCcsICd3cml0ZScsICdhZGQnLCAncmVtb3ZlJ10uaW5kZXhPZihuYW1lKSA+PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIEJsdWViaXJkLmRlbGF5KDIwMClcbiAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGFyZ2V0W25hbWVdKC4uLmFyZ3MpKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0YXJnZXRbbmFtZV07XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICAgIGNvbnN0IGRlbGF5ZWRNZW1zdG9yZSA9IG5ldyBQcm94eShuZXcgTWVtb3J5U3RvcmFnZSh7IHRlcm1pbmFsOiB0cnVlIH0pLCBEZWxheVByb3h5KTtcbiAgICAgIGNvbnN0IGNvbGRNZW1zdG9yZSA9IG5ldyBNZW1vcnlTdG9yYWdlKCk7XG4gICAgICBjb25zdCBvdGhlclBsdW1wID0gbmV3IFBsdW1wKHtcbiAgICAgICAgc3RvcmFnZTogW2NvbGRNZW1zdG9yZSwgZGVsYXllZE1lbXN0b3JlXSxcbiAgICAgICAgdHlwZXM6IFtUZXN0VHlwZV0sXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdzbG93dGF0bycgfSwgb3RoZXJQbHVtcCk7XG4gICAgICBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRnZXQoKSlcbiAgICAgIC50aGVuKCh2YWwpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbGRNZW1zdG9yZS53cml0ZShUZXN0VHlwZSwge1xuICAgICAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgICAgICAgIGlkOiB2YWwuaWQsXG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICBsZXQgcGhhc2UgPSAwO1xuICAgICAgICAgIGNvbnN0IHR3byA9IG90aGVyUGx1bXAuZmluZCgndGVzdHMnLCB2YWwuaWQpO1xuICAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IHR3by4kc3Vic2NyaWJlKCh2KSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBpZiAocGhhc2UgPT09IDApIHtcbiAgICAgICAgICAgICAgICBpZiAodi5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICBleHBlY3QodikudG8uaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICAgICAgICAgICAgICAgIHBoYXNlID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHBoYXNlID09PSAxKSB7XG4gICAgICAgICAgICAgICAgaWYgKHYubmFtZSAhPT0gJ3BvdGF0bycpIHtcbiAgICAgICAgICAgICAgICAgIGV4cGVjdCh2KS50by5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3Nsb3d0YXRvJyk7XG4gICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgZG9uZShlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19
