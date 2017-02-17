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

// For testing while actual bulkRead implementations are in development
_index.Storage.prototype.bulkRead = function bulkRead(opts) {
  // eslint-disable-line no-unused-vars
  return _bluebird2.default.all([this.read(_testType.TestType, 2, _index.$all), this.read(_testType.TestType, 3, _index.$all)]).then(function (children) {
    return { children: children };
  });
};

var memstore2 = new _index.MemoryStore({ terminal: true });

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
        return expect(one.$get('children')).to.eventually.deep.equal({ children: [{ id: 100 }] });
      });
    });

    it('should add hasMany elements by child field', function () {
      var one = new _testType.TestType({ name: 'frotato' }, plump);
      return one.$save().then(function () {
        return one.$add('children', 100);
      }).then(function () {
        return expect(one.$get('children')).to.eventually.deep.equal({ children: [{ id: 100 }] });
      });
    });

    it('should remove hasMany elements', function () {
      var one = new _testType.TestType({ name: 'frotato' }, plump);
      return one.$save().then(function () {
        return one.$add('children', 100);
      }).then(function () {
        return expect(one.$get('children')).to.eventually.deep.equal({ children: [{ id: 100 }] });
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
            id: 100,
            perm: 1
          }] });
      }).then(function () {
        return one.$modifyRelationship('valenceChildren', 100, { perm: 2 });
      }).then(function () {
        return expect(one.$get('valenceChildren')).to.eventually.deep.equal({ valenceChildren: [{
            id: 100,
            perm: 2
          }] });
      });
    });
  });

  describe('events', function () {
    // it('should pass model hasMany changes to other models', () => {
    //   const one = new TestType({ name: 'potato' }, plump);
    //   return one.$save()
    //   .then(() => {
    //     const onePrime = plump.find(TestType.$name, one.$id);
    //     return one.$get('children')
    //     .then((res) => expect(res).to.deep.equal({ children: [] }))
    //     .then(() => onePrime.$get('children'))
    //     .then((res) => expect(res).to.deep.equal({ children: [] }))
    //     .then(() => one.$add('children', 100))
    //     .then(() => one.$get('children'))
    //     .then((res) => expect(res).to.deep.equal({ children: [{ id: 100 }] }))
    //     .then(() => onePrime.$get('children'))
    //     .then((res) => expect(res).to.deep.equal({ children: [{ id: 100 }] }));
    //   });
    // });
    //
    // it('should pass model changes to other models', () => {
    //   const one = new TestType({ name: 'potato' }, plump);
    //   return one.$save()
    //   .then(() => {
    //     const onePrime = plump.find(TestType.$name, one.$id);
    //     return one.$get()
    //     .then((res) => expect(res).have.property('name', 'potato'))
    //     .then(() => onePrime.$get())
    //     .then((res) => expect(res).have.property('name', 'potato'))
    //     .then(() => one.$set('name', 'grotato'))
    //     .then(() => one.$get())
    //     .then((res) => expect(res).have.property('name', 'grotato'))
    //     .then(() => onePrime.$get())
    //     .then((res) => expect(res).have.property('name', 'grotato'));
    //   });
    // });

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
                  id: 100
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
        return one.$add('children', 100);
      });
    });

    it('should allow subscription to model sideloads', function (done) {
      var one = new _testType.TestType({ name: 'potato' }, plump);
      var phase = 0;
      one.$save().then(function () {
        return one.$add('children', 100);
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
                id: 100
              }]);
              phase = 2;
            }
            if (phase === 2) {
              if (v.children && v.children.length > 1) {
                expect(v.children).to.deep.equal([{
                  id: 100
                }, {
                  id: 101
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
        return one.$add('children', 101);
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
      var delayedMemstore = new Proxy(new _index.MemoryStore({ terminal: true }), DelayProxy);
      var coldMemstore = new _index.MemoryStore();
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuc3BlYy5qcyJdLCJuYW1lcyI6WyJwcm90b3R5cGUiLCJidWxrUmVhZCIsIm9wdHMiLCJhbGwiLCJyZWFkIiwidGhlbiIsImNoaWxkcmVuIiwibWVtc3RvcmUyIiwidGVybWluYWwiLCJwbHVtcCIsInN0b3JhZ2UiLCJ0eXBlcyIsInVzZSIsImV4cGVjdCIsImRlc2NyaWJlIiwiaXQiLCJvbmUiLCJpZCIsIm5hbWUiLCIkZ2V0IiwidG8iLCJldmVudHVhbGx5IiwiaGF2ZSIsInByb3BlcnR5IiwiTWluaVRlc3QiLCJmcm9tSlNPTiIsInRvSlNPTiIsImRlZXAiLCJlcXVhbCIsIndyaXRlIiwidHdvIiwiZmluZCIsIm5vSUQiLCIkc2F2ZSIsIm0iLCJjb250YWluIiwia2V5cyIsIiRpZCIsIiRkZWxldGUiLCJiZSIsIm51bGwiLCJhc3NpZ24iLCJiYXNlRmllbGRzIiwiT2JqZWN0IiwiJGZpZWxkcyIsImZpbHRlciIsImZpZWxkIiwidHlwZSIsIiRzZXQiLCIkYWRkIiwiJHJlbW92ZSIsInBlcm0iLCJ2YWxlbmNlQ2hpbGRyZW4iLCIkbW9kaWZ5UmVsYXRpb25zaGlwIiwiZG9uZSIsInBoYXNlIiwic3Vic2NyaXB0aW9uIiwiJHN1YnNjcmliZSIsInYiLCJ1bmRlZmluZWQiLCJsZW5ndGgiLCJ1bnN1YnNjcmliZSIsImVyciIsIkRlbGF5UHJveHkiLCJnZXQiLCJ0YXJnZXQiLCJpbmRleE9mIiwiYXJncyIsImRlbGF5IiwiZGVsYXllZE1lbXN0b3JlIiwiUHJveHkiLCJjb2xkTWVtc3RvcmUiLCJvdGhlclBsdW1wIiwidmFsIl0sIm1hcHBpbmdzIjoiOztBQUVBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBOztBQUNBOzs7Ozs7OzsrZUFQQTs7QUFTQTtBQUNBLGVBQVFBLFNBQVIsQ0FBa0JDLFFBQWxCLEdBQTZCLFNBQVNBLFFBQVQsQ0FBa0JDLElBQWxCLEVBQXdCO0FBQUU7QUFDckQsU0FBTyxtQkFBU0MsR0FBVCxDQUFhLENBQ2xCLEtB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LFNBM0JNLENBQVA7QUE0QkQsT0EvQkQ7QUFnQ0QsS0FwREQ7QUFxREQsR0F6S0Q7QUEwS0QsQ0EzU0QiLCJmaWxlIjoidGVzdC9tb2RlbC5zcGVjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlLCBtb2NoYSovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcblxuaW1wb3J0IHsgUGx1bXAsIE1vZGVsLCBTdG9yYWdlLCBNZW1vcnlTdG9yZSwgJGFsbCB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7IFRlc3RUeXBlIH0gZnJvbSAnLi90ZXN0VHlwZSc7XG5cbi8vIEZvciB0ZXN0aW5nIHdoaWxlIGFjdHVhbCBidWxrUmVhZCBpbXBsZW1lbnRhdGlvbnMgYXJlIGluIGRldmVsb3BtZW50XG5TdG9yYWdlLnByb3RvdHlwZS5idWxrUmVhZCA9IGZ1bmN0aW9uIGJ1bGtSZWFkKG9wdHMpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICB0aGlzLnJlYWQoVGVzdFR5cGUsIDIsICRhbGwpLFxuICAgIHRoaXMucmVhZChUZXN0VHlwZSwgMywgJGFsbCksXG4gIF0pLnRoZW4oY2hpbGRyZW4gPT4ge1xuICAgIHJldHVybiB7IGNoaWxkcmVuIH07XG4gIH0pO1xufTtcblxuY29uc3QgbWVtc3RvcmUyID0gbmV3IE1lbW9yeVN0b3JlKHsgdGVybWluYWw6IHRydWUgfSk7XG5cbmNvbnN0IHBsdW1wID0gbmV3IFBsdW1wKHtcbiAgc3RvcmFnZTogW21lbXN0b3JlMl0sXG4gIHR5cGVzOiBbVGVzdFR5cGVdLFxufSk7XG5cblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbmRlc2NyaWJlKCdtb2RlbCcsICgpID0+IHtcbiAgZGVzY3JpYmUoJ2Jhc2ljIGZ1bmN0aW9uYWxpdHknLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gcHJvbWlzZXMgdG8gZXhpc3RpbmcgZGF0YScsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IGlkOiAxLCBuYW1lOiAncG90YXRvJyB9KTtcbiAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBwcm9wZXJseSBzZXJpYWxpemUgaXRzIHNjaGVtYScsICgpID0+IHtcbiAgICAgIGNsYXNzIE1pbmlUZXN0IGV4dGVuZHMgTW9kZWwge31cbiAgICAgIE1pbmlUZXN0LmZyb21KU09OKFRlc3RUeXBlLnRvSlNPTigpKTtcbiAgICAgIHJldHVybiBleHBlY3QoTWluaVRlc3QudG9KU09OKCkpLnRvLmRlZXAuZXF1YWwoVGVzdFR5cGUudG9KU09OKCkpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBsb2FkIGRhdGEgZnJvbSBkYXRhc3RvcmVzJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIG1lbXN0b3JlMi53cml0ZShUZXN0VHlwZSwge1xuICAgICAgICBpZDogMixcbiAgICAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3QgdHdvID0gcGx1bXAuZmluZCgndGVzdHMnLCAyKTtcbiAgICAgICAgcmV0dXJuIGV4cGVjdCh0d28uJGdldCgpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY3JlYXRlIGFuIGlkIHdoZW4gb25lIGlzIHVuc2V0JywgKCkgPT4ge1xuICAgICAgY29uc3Qgbm9JRCA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBleHBlY3Qobm9JRC4kc2F2ZSgpLnRoZW4oKG0pID0+IG0uJGdldCgpKSkudG8uZXZlbnR1YWxseS5jb250YWluLmtleXMoJ25hbWUnLCAnaWQnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWxsb3cgZGF0YSB0byBiZSBkZWxldGVkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kZGVsZXRlKCkpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuYmUubnVsbCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFsbG93IGZpZWxkcyB0byBiZSBsb2FkZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncCcgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwJykpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCRhbGwpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFRlc3RUeXBlLmFzc2lnbih7IG5hbWU6ICdwJywgaWQ6IG9uZS4kaWQgfSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIG9ubHkgbG9hZCBiYXNlIGZpZWxkcyBvbiAkZ2V0KCRzZWxmKScsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCBiYXNlRmllbGRzID0gT2JqZWN0LmtleXMoVGVzdFR5cGUuJGZpZWxkcykuZmlsdGVyKGZpZWxkID0+IFRlc3RUeXBlLiRmaWVsZHNbZmllbGRdLnR5cGUgIT09ICdoYXNNYW55Jyk7XG4gICAgICAgIC8vIGNvbnN0IGhhc01hbnlzID0gT2JqZWN0LmtleXMoVGVzdFR5cGUuJGZpZWxkcykuZmlsdGVyKGZpZWxkID0+IFRlc3RUeXBlLiRmaWVsZHNbZmllbGRdLnR5cGUgPT09ICdoYXNNYW55Jyk7XG5cbiAgICAgICAgcmV0dXJuIGV4cGVjdChwbHVtcC5maW5kKCd0ZXN0cycsIG9uZS4kaWQpLiRnZXQoKSkudG8uZXZlbnR1YWxseS5oYXZlLmFsbC5rZXlzKGJhc2VGaWVsZHMpO1xuICAgICAgICAvLyBOT1RFOiAuaGF2ZS5hbGwgcmVxdWlyZXMgbGlzdCBsZW5ndGggZXF1YWxpdHlcbiAgICAgICAgLy8gLmFuZC5ub3Qua2V5cyhoYXNNYW55cyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgb3B0aW1pc3RpY2FsbHkgdXBkYXRlIG9uIGZpZWxkIHVwZGF0ZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kc2V0KHsgbmFtZTogJ3J1dGFiYWdhJyB9KSlcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncnV0YWJhZ2EnKSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdyZWxhdGlvbnNoaXBzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgc2hvdyBlbXB0eSBoYXNNYW55IGxpc3RzIGFzIHtrZXk6IFtdfScsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgY2hpbGRyZW46IFtdIH0pKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWRkIGhhc01hbnkgZWxlbWVudHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgY2hpbGRyZW46IFt7IGlkOiAxMDAgfV0gfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWRkIGhhc01hbnkgZWxlbWVudHMgYnkgY2hpbGQgZmllbGQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgY2hpbGRyZW46IFt7IGlkOiAxMDAgfV0gfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmVtb3ZlIGhhc01hbnkgZWxlbWVudHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgY2hpbGRyZW46IFt7IGlkOiAxMDAgfV0gfSk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRyZW1vdmUoJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgY2hpbGRyZW46IFtdIH0pKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaW5jbHVkZSB2YWxlbmNlIGluIGhhc01hbnkgb3BlcmF0aW9ucycsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdncm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCd2YWxlbmNlQ2hpbGRyZW4nLCAxMDAsIHsgcGVybTogMSB9KSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kZ2V0KCd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoeyB2YWxlbmNlQ2hpbGRyZW46IFt7XG4gICAgICAgICAgaWQ6IDEwMCxcbiAgICAgICAgICBwZXJtOiAxLFxuICAgICAgICB9XSB9KTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiBvbmUuJG1vZGlmeVJlbGF0aW9uc2hpcCgndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7IHBlcm06IDIgfSkpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgdmFsZW5jZUNoaWxkcmVuOiBbe1xuICAgICAgICAgIGlkOiAxMDAsXG4gICAgICAgICAgcGVybTogMixcbiAgICAgICAgfV0gfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2V2ZW50cycsICgpID0+IHtcbiAgICAvLyBpdCgnc2hvdWxkIHBhc3MgbW9kZWwgaGFzTWFueSBjaGFuZ2VzIHRvIG90aGVyIG1vZGVscycsICgpID0+IHtcbiAgICAvLyAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAvLyAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgIC8vICAgLnRoZW4oKCkgPT4ge1xuICAgIC8vICAgICBjb25zdCBvbmVQcmltZSA9IHBsdW1wLmZpbmQoVGVzdFR5cGUuJG5hbWUsIG9uZS4kaWQpO1xuICAgIC8vICAgICByZXR1cm4gb25lLiRnZXQoJ2NoaWxkcmVuJylcbiAgICAvLyAgICAgLnRoZW4oKHJlcykgPT4gZXhwZWN0KHJlcykudG8uZGVlcC5lcXVhbCh7IGNoaWxkcmVuOiBbXSB9KSlcbiAgICAvLyAgICAgLnRoZW4oKCkgPT4gb25lUHJpbWUuJGdldCgnY2hpbGRyZW4nKSlcbiAgICAvLyAgICAgLnRoZW4oKHJlcykgPT4gZXhwZWN0KHJlcykudG8uZGVlcC5lcXVhbCh7IGNoaWxkcmVuOiBbXSB9KSlcbiAgICAvLyAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAvLyAgICAgLnRoZW4oKCkgPT4gb25lLiRnZXQoJ2NoaWxkcmVuJykpXG4gICAgLy8gICAgIC50aGVuKChyZXMpID0+IGV4cGVjdChyZXMpLnRvLmRlZXAuZXF1YWwoeyBjaGlsZHJlbjogW3sgaWQ6IDEwMCB9XSB9KSlcbiAgICAvLyAgICAgLnRoZW4oKCkgPT4gb25lUHJpbWUuJGdldCgnY2hpbGRyZW4nKSlcbiAgICAvLyAgICAgLnRoZW4oKHJlcykgPT4gZXhwZWN0KHJlcykudG8uZGVlcC5lcXVhbCh7IGNoaWxkcmVuOiBbeyBpZDogMTAwIH1dIH0pKTtcbiAgICAvLyAgIH0pO1xuICAgIC8vIH0pO1xuICAgIC8vXG4gICAgLy8gaXQoJ3Nob3VsZCBwYXNzIG1vZGVsIGNoYW5nZXMgdG8gb3RoZXIgbW9kZWxzJywgKCkgPT4ge1xuICAgIC8vICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgIC8vICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgLy8gICAudGhlbigoKSA9PiB7XG4gICAgLy8gICAgIGNvbnN0IG9uZVByaW1lID0gcGx1bXAuZmluZChUZXN0VHlwZS4kbmFtZSwgb25lLiRpZCk7XG4gICAgLy8gICAgIHJldHVybiBvbmUuJGdldCgpXG4gICAgLy8gICAgIC50aGVuKChyZXMpID0+IGV4cGVjdChyZXMpLmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJykpXG4gICAgLy8gICAgIC50aGVuKCgpID0+IG9uZVByaW1lLiRnZXQoKSlcbiAgICAvLyAgICAgLnRoZW4oKHJlcykgPT4gZXhwZWN0KHJlcykuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKSlcbiAgICAvLyAgICAgLnRoZW4oKCkgPT4gb25lLiRzZXQoJ25hbWUnLCAnZ3JvdGF0bycpKVxuICAgIC8vICAgICAudGhlbigoKSA9PiBvbmUuJGdldCgpKVxuICAgIC8vICAgICAudGhlbigocmVzKSA9PiBleHBlY3QocmVzKS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ2dyb3RhdG8nKSlcbiAgICAvLyAgICAgLnRoZW4oKCkgPT4gb25lUHJpbWUuJGdldCgpKVxuICAgIC8vICAgICAudGhlbigocmVzKSA9PiBleHBlY3QocmVzKS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ2dyb3RhdG8nKSk7XG4gICAgLy8gICB9KTtcbiAgICAvLyB9KTtcblxuICAgIGl0KCdzaG91bGQgYWxsb3cgc3Vic2NyaXB0aW9uIHRvIG1vZGVsIGRhdGEnLCAoZG9uZSkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgbGV0IHBoYXNlID0gMDtcbiAgICAgIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG9uZS4kc3Vic2NyaWJlKCh2KSA9PiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMCkge1xuICAgICAgICAgICAgICBpZiAodi5uYW1lKSB7XG4gICAgICAgICAgICAgICAgcGhhc2UgPSAxO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGhhc2UgPT09IDEpIHtcbiAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgICAgICAgICAgIGlmICh2LmlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBwaGFzZSA9IDI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMikge1xuICAgICAgICAgICAgICBpZiAodi5uYW1lICE9PSAncG90YXRvJykge1xuICAgICAgICAgICAgICAgIGV4cGVjdCh2KS50by5oYXZlLnByb3BlcnR5KCduYW1lJywgJ2dyb3RhdG8nKTtcbiAgICAgICAgICAgICAgICBwaGFzZSA9IDM7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMykge1xuICAgICAgICAgICAgICBpZiAoKHYuY2hpbGRyZW4pICYmICh2LmNoaWxkcmVuLmxlbmd0aCA+IDApKSB7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHYuY2hpbGRyZW4pLnRvLmRlZXAuZXF1YWwoW3tcbiAgICAgICAgICAgICAgICAgIGlkOiAxMDAsXG4gICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgZG9uZShlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRzZXQoeyBuYW1lOiAnZ3JvdGF0bycgfSkpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDApKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWxsb3cgc3Vic2NyaXB0aW9uIHRvIG1vZGVsIHNpZGVsb2FkcycsIChkb25lKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICBsZXQgcGhhc2UgPSAwO1xuICAgICAgb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIDEwMCkpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG9uZS4kc3Vic2NyaWJlKFskYWxsXSwgKHYpID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHBoYXNlID09PSAwKSB7XG4gICAgICAgICAgICAgIGlmICh2Lm5hbWUpIHtcbiAgICAgICAgICAgICAgICBwaGFzZSA9IDE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMSkge1xuICAgICAgICAgICAgICBleHBlY3QodikudG8uaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICAgICAgICAgICAgZXhwZWN0KHYuY2hpbGRyZW4pLnRvLmRlZXAuZXF1YWwoW3tcbiAgICAgICAgICAgICAgICBpZDogMTAwLFxuICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgIHBoYXNlID0gMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMikge1xuICAgICAgICAgICAgICBpZiAoKHYuY2hpbGRyZW4pICYmICh2LmNoaWxkcmVuLmxlbmd0aCA+IDEpKSB7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHYuY2hpbGRyZW4pLnRvLmRlZXAuZXF1YWwoW3tcbiAgICAgICAgICAgICAgICAgIGlkOiAxMDAsXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgaWQ6IDEwMSxcbiAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBkb25lKGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDEpKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdXBkYXRlIG9uIGNhY2hlYWJsZSByZWFkIGV2ZW50cycsIChkb25lKSA9PiB7XG4gICAgICBjb25zdCBEZWxheVByb3h5ID0ge1xuICAgICAgICBnZXQ6ICh0YXJnZXQsIG5hbWUpID0+IHtcbiAgICAgICAgICBpZiAoWydyZWFkJywgJ3dyaXRlJywgJ2FkZCcsICdyZW1vdmUnXS5pbmRleE9mKG5hbWUpID49IDApIHtcbiAgICAgICAgICAgIHJldHVybiAoLi4uYXJncykgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gQmx1ZWJpcmQuZGVsYXkoMjAwKVxuICAgICAgICAgICAgICAudGhlbigoKSA9PiB0YXJnZXRbbmFtZV0oLi4uYXJncykpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRhcmdldFtuYW1lXTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgICAgY29uc3QgZGVsYXllZE1lbXN0b3JlID0gbmV3IFByb3h5KG5ldyBNZW1vcnlTdG9yZSh7IHRlcm1pbmFsOiB0cnVlIH0pLCBEZWxheVByb3h5KTtcbiAgICAgIGNvbnN0IGNvbGRNZW1zdG9yZSA9IG5ldyBNZW1vcnlTdG9yZSgpO1xuICAgICAgY29uc3Qgb3RoZXJQbHVtcCA9IG5ldyBQbHVtcCh7XG4gICAgICAgIHN0b3JhZ2U6IFtjb2xkTWVtc3RvcmUsIGRlbGF5ZWRNZW1zdG9yZV0sXG4gICAgICAgIHR5cGVzOiBbVGVzdFR5cGVdLFxuICAgICAgfSk7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnc2xvd3RhdG8nIH0sIG90aGVyUGx1bXApO1xuICAgICAgb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kZ2V0KCkpXG4gICAgICAudGhlbigodmFsKSA9PiB7XG4gICAgICAgIHJldHVybiBjb2xkTWVtc3RvcmUud3JpdGUoVGVzdFR5cGUsIHtcbiAgICAgICAgICBuYW1lOiAncG90YXRvJyxcbiAgICAgICAgICBpZDogdmFsLmlkLFxuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgbGV0IHBoYXNlID0gMDtcbiAgICAgICAgICBjb25zdCB0d28gPSBvdGhlclBsdW1wLmZpbmQoJ3Rlc3RzJywgdmFsLmlkKTtcbiAgICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSB0d28uJHN1YnNjcmliZSgodikgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgaWYgKHBoYXNlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKHYubmFtZSkge1xuICAgICAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgICAgICAgICAgICAgICBwaGFzZSA9IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGlmICh2Lm5hbWUgIT09ICdwb3RhdG8nKSB7XG4gICAgICAgICAgICAgICAgICBleHBlY3QodikudG8uaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdzbG93dGF0bycpO1xuICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICAgICAgICBkb25lKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICAgIGRvbmUoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdfQ==
