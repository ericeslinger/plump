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
      })
      // .then(() => one.$get([$self, 'children']).then((v) => console.log(JSON.stringify(v, null, 2))))
      .then(function () {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUyIiwidGVybWluYWwiLCJwbHVtcCIsInN0b3JhZ2UiLCJ0eXBlcyIsInVzZSIsImV4cGVjdCIsImRlc2NyaWJlIiwiaXQiLCJvbmUiLCJpZCIsIm5hbWUiLCIkZ2V0IiwidG8iLCJldmVudHVhbGx5IiwiaGF2ZSIsInByb3BlcnR5IiwiTWluaVRlc3QiLCJmcm9tSlNPTiIsInRvSlNPTiIsImRlZXAiLCJlcXVhbCIsIndyaXRlIiwidGhlbiIsInR3byIsImZpbmQiLCJub0lEIiwiJHNhdmUiLCJtIiwiY29udGFpbiIsImtleXMiLCIkaWQiLCIkZGVsZXRlIiwiYmUiLCJudWxsIiwiYXNzaWduIiwiJHNldCIsImNoaWxkcmVuIiwiJGFkZCIsImNoaWxkX2lkIiwicGFyZW50X2lkIiwiJHJlbW92ZSIsInBlcm0iLCJ2YWxlbmNlQ2hpbGRyZW4iLCIkbW9kaWZ5UmVsYXRpb25zaGlwIiwiZG9uZSIsInBoYXNlIiwic3Vic2NyaXB0aW9uIiwiJHN1YnNjcmliZSIsInYiLCJ1bmRlZmluZWQiLCJsZW5ndGgiLCJ1bnN1YnNjcmliZSIsImVyciIsIkRlbGF5UHJveHkiLCJnZXQiLCJ0YXJnZXQiLCJpbmRleE9mIiwiYXJncyIsImRlbGF5IiwiZGVsYXllZE1lbXN0b3JlIiwiUHJveHkiLCJjb2xkTWVtc3RvcmUiLCJvdGhlclBsdW1wIiwidmFsIl0sIm1hcHBpbmdzIjoiOztBQUVBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBOztBQUNBOzs7Ozs7OzsrZUFQQTs7QUFTQSxJQUFNQSxZQUFZLHlCQUFrQixFQUFFQyxVQUFVLElBQVosRUFBbEIsQ0FBbEI7O0FBRUEsSUFBTUMsUUFBUSxpQkFBVTtBQUN0QkMsV0FBUyxDQUFDSCxTQUFELENBRGE7QUFFdEJJLFNBQU87QUFGZSxDQUFWLENBQWQ7O0FBTUEsZUFBS0MsR0FBTDtBQUNBLElBQU1DLFNBQVMsZUFBS0EsTUFBcEI7O0FBRUFDLFNBQVMsT0FBVCxF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QUV0QyxJQUFGLEtBQVcsUUFBZixFQUF5QjtBQUN2QkwseUJBQU8yQyxDQUFQLEVBQVVwQyxFQUFWLENBQWFFLElBQWIsQ0FBa0JDLFFBQWxCLENBQTJCLE1BQTNCLEVBQW1DLFVBQW5DO0FBQ0ErQiwrQkFBYUssV0FBYjtBQUNBUDtBQUNEO0FBQ0Y7QUFDRixhQWRELENBY0UsT0FBT1EsR0FBUCxFQUFZO0FBQ1pOLDJCQUFhSyxXQUFiO0FBQ0FQLG1CQUFLUSxHQUFMO0FBQ0Q7QUFDRixXQW5Cb0IsQ0FBckI7QUFvQkQsU0EzQk0sQ0FBUDtBQTRCRCxPQS9CRDtBQWdDRCxLQXBERDtBQXFERCxHQTVJRDtBQTZJRCxDQTVRRCIsImZpbGUiOiJ0ZXN0L21vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlLCBtb2NoYSovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcblxuaW1wb3J0IHsgUGx1bXAsIE1vZGVsLCBNZW1vcnlTdG9yYWdlLCAkYWxsLCAkc2VsZiB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7IFRlc3RUeXBlIH0gZnJvbSAnLi90ZXN0VHlwZSc7XG5cbmNvbnN0IG1lbXN0b3JlMiA9IG5ldyBNZW1vcnlTdG9yYWdlKHsgdGVybWluYWw6IHRydWUgfSk7XG5cbmNvbnN0IHBsdW1wID0gbmV3IFBsdW1wKHtcbiAgc3RvcmFnZTogW21lbXN0b3JlMl0sXG4gIHR5cGVzOiBbVGVzdFR5cGVdLFxufSk7XG5cblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbmRlc2NyaWJlKCdtb2RlbCcsICgpID0+IHtcbiAgZGVzY3JpYmUoJ2Jhc2ljIGZ1bmN0aW9uYWxpdHknLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gcHJvbWlzZXMgdG8gZXhpc3RpbmcgZGF0YScsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IGlkOiAxLCBuYW1lOiAncG90YXRvJyB9KTtcbiAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBwcm9wZXJseSBzZXJpYWxpemUgaXRzIHNjaGVtYScsICgpID0+IHtcbiAgICAgIGNsYXNzIE1pbmlUZXN0IGV4dGVuZHMgTW9kZWwge31cbiAgICAgIE1pbmlUZXN0LmZyb21KU09OKFRlc3RUeXBlLnRvSlNPTigpKTtcbiAgICAgIHJldHVybiBleHBlY3QoTWluaVRlc3QudG9KU09OKCkpLnRvLmRlZXAuZXF1YWwoVGVzdFR5cGUudG9KU09OKCkpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBsb2FkIGRhdGEgZnJvbSBkYXRhc3RvcmVzJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIG1lbXN0b3JlMi53cml0ZShUZXN0VHlwZSwge1xuICAgICAgICBpZDogMixcbiAgICAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3QgdHdvID0gcGx1bXAuZmluZCgndGVzdHMnLCAyKTtcbiAgICAgICAgcmV0dXJuIGV4cGVjdCh0d28uJGdldCgpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY3JlYXRlIGFuIGlkIHdoZW4gb25lIGlzIHVuc2V0JywgKCkgPT4ge1xuICAgICAgY29uc3Qgbm9JRCA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBleHBlY3Qobm9JRC4kc2F2ZSgpLnRoZW4oKG0pID0+IG0uJGdldCgpKSkudG8uZXZlbnR1YWxseS5jb250YWluLmtleXMoJ25hbWUnLCAnaWQnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWxsb3cgZGF0YSB0byBiZSBkZWxldGVkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kZGVsZXRlKCkpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuYmUubnVsbCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFsbG93IGZpZWxkcyB0byBiZSBsb2FkZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncCcgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwJykpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoVGVzdFR5cGUuYXNzaWduKHsgbmFtZTogJ3AnLCBpZDogb25lLiRpZCB9KSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgb3B0aW1pc3RpY2FsbHkgdXBkYXRlIG9uIGZpZWxkIHVwZGF0ZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kc2V0KHsgbmFtZTogJ3J1dGFiYWdhJyB9KSlcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncnV0YWJhZ2EnKSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdyZWxhdGlvbnNoaXBzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgc2hvdyBlbXB0eSBoYXNNYW55IGxpc3RzIGFzIHtrZXk6IFtdfScsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgY2hpbGRyZW46IFtdIH0pKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWRkIGhhc01hbnkgZWxlbWVudHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgY2hpbGRyZW46IFt7XG4gICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgIH1dIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFkZCBoYXNNYW55IGVsZW1lbnRzIGJ5IGNoaWxkIGZpZWxkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2Zyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgeyBjaGlsZF9pZDogMTAwIH0pKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgY2hpbGRyZW46IFt7XG4gICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgIH1dIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlbW92ZSBoYXNNYW55IGVsZW1lbnRzJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2Zyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IGNoaWxkcmVuOiBbe1xuICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICB9XSB9KTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiBvbmUuJHJlbW92ZSgnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoeyBjaGlsZHJlbjogW10gfSkpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBpbmNsdWRlIHZhbGVuY2UgaW4gaGFzTWFueSBvcGVyYXRpb25zJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2dyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ3ZhbGVuY2VDaGlsZHJlbicsIDEwMCwgeyBwZXJtOiAxIH0pKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRnZXQoJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IHZhbGVuY2VDaGlsZHJlbjogW3tcbiAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgICBwZXJtOiAxLFxuICAgICAgICB9XSB9KTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiBvbmUuJG1vZGlmeVJlbGF0aW9uc2hpcCgndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7IHBlcm06IDIgfSkpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgdmFsZW5jZUNoaWxkcmVuOiBbe1xuICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICAgIHBlcm06IDIsXG4gICAgICAgIH1dIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdldmVudHMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBhbGxvdyBzdWJzY3JpcHRpb24gdG8gbW9kZWwgZGF0YScsIChkb25lKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICBsZXQgcGhhc2UgPSAwO1xuICAgICAgb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gb25lLiRzdWJzY3JpYmUoKHYpID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHBoYXNlID09PSAwKSB7XG4gICAgICAgICAgICAgIGlmICh2Lm5hbWUpIHtcbiAgICAgICAgICAgICAgICBwaGFzZSA9IDE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMSkge1xuICAgICAgICAgICAgICBleHBlY3QodikudG8uaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICAgICAgICAgICAgaWYgKHYuaWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHBoYXNlID0gMjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBoYXNlID09PSAyKSB7XG4gICAgICAgICAgICAgIGlmICh2Lm5hbWUgIT09ICdwb3RhdG8nKSB7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAnZ3JvdGF0bycpO1xuICAgICAgICAgICAgICAgIHBoYXNlID0gMztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBoYXNlID09PSAzKSB7XG4gICAgICAgICAgICAgIGlmICgodi5jaGlsZHJlbikgJiYgKHYuY2hpbGRyZW4ubGVuZ3RoID4gMCkpIHtcbiAgICAgICAgICAgICAgICBleHBlY3Qodi5jaGlsZHJlbikudG8uZGVlcC5lcXVhbChbe1xuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBkb25lKGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiBvbmUuJHNldCh7IG5hbWU6ICdncm90YXRvJyB9KSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIHsgY2hpbGRfaWQ6IDEwMCB9KSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFsbG93IHN1YnNjcmlwdGlvbiB0byBtb2RlbCBzaWRlbG9hZHMnLCAoZG9uZSkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgbGV0IHBoYXNlID0gMDtcbiAgICAgIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCB7IGNoaWxkX2lkOiAxMDAgfSkpXG4gICAgICAvLyAudGhlbigoKSA9PiBvbmUuJGdldChbJHNlbGYsICdjaGlsZHJlbiddKS50aGVuKCh2KSA9PiBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh2LCBudWxsLCAyKSkpKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBvbmUuJHN1YnNjcmliZShbJGFsbF0sICh2KSA9PiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMCkge1xuICAgICAgICAgICAgICBpZiAodi5uYW1lKSB7XG4gICAgICAgICAgICAgICAgcGhhc2UgPSAxO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGhhc2UgPT09IDEpIHtcbiAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgICAgICAgICAgIGV4cGVjdCh2LmNoaWxkcmVuKS50by5kZWVwLmVxdWFsKFt7XG4gICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgcGhhc2UgPSAyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBoYXNlID09PSAyKSB7XG4gICAgICAgICAgICAgIGlmICgodi5jaGlsZHJlbikgJiYgKHYuY2hpbGRyZW4ubGVuZ3RoID4gMSkpIHtcbiAgICAgICAgICAgICAgICBleHBlY3Qodi5jaGlsZHJlbikudG8uZGVlcC5lcXVhbChbe1xuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAxLFxuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICBkb25lKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGRvbmUoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIHsgY2hpbGRfaWQ6IDEwMSB9KSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHVwZGF0ZSBvbiBjYWNoZWFibGUgcmVhZCBldmVudHMnLCAoZG9uZSkgPT4ge1xuICAgICAgY29uc3QgRGVsYXlQcm94eSA9IHtcbiAgICAgICAgZ2V0OiAodGFyZ2V0LCBuYW1lKSA9PiB7XG4gICAgICAgICAgaWYgKFsncmVhZCcsICd3cml0ZScsICdhZGQnLCAncmVtb3ZlJ10uaW5kZXhPZihuYW1lKSA+PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIEJsdWViaXJkLmRlbGF5KDIwMClcbiAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGFyZ2V0W25hbWVdKC4uLmFyZ3MpKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0YXJnZXRbbmFtZV07XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICAgIGNvbnN0IGRlbGF5ZWRNZW1zdG9yZSA9IG5ldyBQcm94eShuZXcgTWVtb3J5U3RvcmFnZSh7IHRlcm1pbmFsOiB0cnVlIH0pLCBEZWxheVByb3h5KTtcbiAgICAgIGNvbnN0IGNvbGRNZW1zdG9yZSA9IG5ldyBNZW1vcnlTdG9yYWdlKCk7XG4gICAgICBjb25zdCBvdGhlclBsdW1wID0gbmV3IFBsdW1wKHtcbiAgICAgICAgc3RvcmFnZTogW2NvbGRNZW1zdG9yZSwgZGVsYXllZE1lbXN0b3JlXSxcbiAgICAgICAgdHlwZXM6IFtUZXN0VHlwZV0sXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdzbG93dGF0bycgfSwgb3RoZXJQbHVtcCk7XG4gICAgICBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRnZXQoKSlcbiAgICAgIC50aGVuKCh2YWwpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbGRNZW1zdG9yZS53cml0ZShUZXN0VHlwZSwge1xuICAgICAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgICAgICAgIGlkOiB2YWwuaWQsXG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICBsZXQgcGhhc2UgPSAwO1xuICAgICAgICAgIGNvbnN0IHR3byA9IG90aGVyUGx1bXAuZmluZCgndGVzdHMnLCB2YWwuaWQpO1xuICAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IHR3by4kc3Vic2NyaWJlKCh2KSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBpZiAocGhhc2UgPT09IDApIHtcbiAgICAgICAgICAgICAgICBpZiAodi5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICBleHBlY3QodikudG8uaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICAgICAgICAgICAgICAgIHBoYXNlID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHBoYXNlID09PSAxKSB7XG4gICAgICAgICAgICAgICAgaWYgKHYubmFtZSAhPT0gJ3BvdGF0bycpIHtcbiAgICAgICAgICAgICAgICAgIGV4cGVjdCh2KS50by5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3Nsb3d0YXRvJyk7XG4gICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgZG9uZShlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19
