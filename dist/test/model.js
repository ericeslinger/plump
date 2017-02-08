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

    it('should package all related documents for read', function () {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUyIiwidGVybWluYWwiLCJwbHVtcCIsInN0b3JhZ2UiLCJ0eXBlcyIsInVzZSIsImV4cGVjdCIsImRlc2NyaWJlIiwiaXQiLCJvbmUiLCJpZCIsIm5hbWUiLCIkZ2V0IiwidG8iLCJldmVudHVhbGx5IiwiaGF2ZSIsInByb3BlcnR5IiwiTWluaVRlc3QiLCJmcm9tSlNPTiIsInRvSlNPTiIsImRlZXAiLCJlcXVhbCIsIndyaXRlIiwidGhlbiIsInR3byIsImZpbmQiLCJub0lEIiwiJHNhdmUiLCJtIiwiY29udGFpbiIsImtleXMiLCIkaWQiLCIkZGVsZXRlIiwiYmUiLCJudWxsIiwiYXNzaWduIiwiYmFzZUZpZWxkcyIsIk9iamVjdCIsIiRmaWVsZHMiLCJmaWx0ZXIiLCJmaWVsZCIsInR5cGUiLCJhbGwiLCIkc2V0IiwiZXh0ZW5kZWQiLCJjb2hvcnQiLCJ0aHJlZSIsIiRhZGQiLCIkcGFja2FnZSIsIkpTT04iLCJwYXJzZSIsInJlYWRGaWxlU3luYyIsImNoaWxkcmVuIiwiY2hpbGRfaWQiLCJwYXJlbnRfaWQiLCIkcmVtb3ZlIiwicGVybSIsInZhbGVuY2VDaGlsZHJlbiIsIiRtb2RpZnlSZWxhdGlvbnNoaXAiLCJkb25lIiwicGhhc2UiLCJzdWJzY3JpcHRpb24iLCIkc3Vic2NyaWJlIiwidiIsInVuZGVmaW5lZCIsImxlbmd0aCIsInVuc3Vic2NyaWJlIiwiZXJyIiwiRGVsYXlQcm94eSIsImdldCIsInRhcmdldCIsImluZGV4T2YiLCJhcmdzIiwiZGVsYXkiLCJkZWxheWVkTWVtc3RvcmUiLCJQcm94eSIsImNvbGRNZW1zdG9yZSIsIm90aGVyUGx1bXAiLCJ2YWwiXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQTs7QUFDQTs7Ozs7Ozs7K2VBUkE7O0FBVUEsSUFBTUEsWUFBWSx5QkFBa0IsRUFBRUMsVUFBVSxJQUFaLEVBQWxCLENBQWxCOztB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LEVBQU47QUFBQSxPQUROLEVBRUNXLElBRkQsQ0FFTSxVQUFDdUQsR0FBRCxFQUFTO0FBQ2IsZUFBT0YsYUFBYXRELEtBQWIscUJBQTZCO0FBQ2xDWCxnQkFBTSxRQUQ0QjtBQUVsQ0QsY0FBSW9FLElBQUlwRTtBQUYwQixTQUE3QixFQUlOYSxJQUpNLENBSUQsWUFBTTtBQUNWLGNBQUlxQyxRQUFRLENBQVo7QUFDQSxjQUFNcEMsTUFBTXFELFdBQVdwRCxJQUFYLENBQWdCLE9BQWhCLEVBQXlCcUQsSUFBSXBFLEVBQTdCLENBQVo7QUFDQSxjQUFNbUQsZUFBZXJDLElBQUlzQyxVQUFKLENBQWUsVUFBQ0MsQ0FBRCxFQUFPO0FBQ3pDLGdCQUFJO0FBQ0Ysa0JBQUlILFVBQVUsQ0FBZCxFQUFpQjtBQUNmLG9CQUFJRyxFQUFFcEQsSUFBTixFQUFZO0FBQ1ZMLHlCQUFPeUQsQ0FBUCxFQUFVbEQsRUFBVixDQUFhRSxJQUFiLENBQWtCQyxRQUFsQixDQUEyQixNQUEzQixFQUFtQyxRQUFuQztBQUNBNEMsMEJBQVEsQ0FBUjtBQUNEO0FBQ0Y7QUFDRCxrQkFBSUEsVUFBVSxDQUFkLEVBQWlCO0FBQ2Ysb0JBQUlHLEVBQUVwRCxJQUFGLEtBQVcsUUFBZixFQUF5QjtBQUN2QkwseUJBQU95RCxDQUFQLEVBQVVsRCxFQUFWLENBQWFFLElBQWIsQ0FBa0JDLFFBQWxCLENBQTJCLE1BQTNCLEVBQW1DLFVBQW5DO0FBQ0E2QywrQkFBYUssV0FBYjtBQUNBUDtBQUNEO0FBQ0Y7QUFDRixhQWRELENBY0UsT0FBT1EsR0FBUCxFQUFZO0FBQ1pOLDJCQUFhSyxXQUFiO0FBQ0FQLG1CQUFLUSxHQUFMO0FBQ0Q7QUFDRixXQW5Cb0IsQ0FBckI7QUFvQkQsU0EzQk0sQ0FBUDtBQTRCRCxPQS9CRDtBQWdDRCxLQXBERDtBQXFERCxHQTNJRDtBQTRJRCxDQXZURCIsImZpbGUiOiJ0ZXN0L21vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlLCBtb2NoYSovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5cbmltcG9ydCB7IFBsdW1wLCBNb2RlbCwgTWVtb3J5U3RvcmFnZSwgJGFsbCB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7IFRlc3RUeXBlIH0gZnJvbSAnLi90ZXN0VHlwZSc7XG5cbmNvbnN0IG1lbXN0b3JlMiA9IG5ldyBNZW1vcnlTdG9yYWdlKHsgdGVybWluYWw6IHRydWUgfSk7XG5cbmNvbnN0IHBsdW1wID0gbmV3IFBsdW1wKHtcbiAgc3RvcmFnZTogW21lbXN0b3JlMl0sXG4gIHR5cGVzOiBbVGVzdFR5cGVdLFxufSk7XG5cblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbmRlc2NyaWJlKCdtb2RlbCcsICgpID0+IHtcbiAgZGVzY3JpYmUoJ2Jhc2ljIGZ1bmN0aW9uYWxpdHknLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gcHJvbWlzZXMgdG8gZXhpc3RpbmcgZGF0YScsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IGlkOiAxLCBuYW1lOiAncG90YXRvJyB9KTtcbiAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBwcm9wZXJseSBzZXJpYWxpemUgaXRzIHNjaGVtYScsICgpID0+IHtcbiAgICAgIGNsYXNzIE1pbmlUZXN0IGV4dGVuZHMgTW9kZWwge31cbiAgICAgIE1pbmlUZXN0LmZyb21KU09OKFRlc3RUeXBlLnRvSlNPTigpKTtcbiAgICAgIHJldHVybiBleHBlY3QoTWluaVRlc3QudG9KU09OKCkpLnRvLmRlZXAuZXF1YWwoVGVzdFR5cGUudG9KU09OKCkpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBsb2FkIGRhdGEgZnJvbSBkYXRhc3RvcmVzJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIG1lbXN0b3JlMi53cml0ZShUZXN0VHlwZSwge1xuICAgICAgICBpZDogMixcbiAgICAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3QgdHdvID0gcGx1bXAuZmluZCgndGVzdHMnLCAyKTtcbiAgICAgICAgcmV0dXJuIGV4cGVjdCh0d28uJGdldCgpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY3JlYXRlIGFuIGlkIHdoZW4gb25lIGlzIHVuc2V0JywgKCkgPT4ge1xuICAgICAgY29uc3Qgbm9JRCA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBleHBlY3Qobm9JRC4kc2F2ZSgpLnRoZW4oKG0pID0+IG0uJGdldCgpKSkudG8uZXZlbnR1YWxseS5jb250YWluLmtleXMoJ25hbWUnLCAnaWQnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWxsb3cgZGF0YSB0byBiZSBkZWxldGVkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kZGVsZXRlKCkpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuYmUubnVsbCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFsbG93IGZpZWxkcyB0byBiZSBsb2FkZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncCcgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwJykpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCRhbGwpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFRlc3RUeXBlLmFzc2lnbih7IG5hbWU6ICdwJywgaWQ6IG9uZS4kaWQgfSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIG9ubHkgbG9hZCBiYXNlIGZpZWxkcyBvbiAkZ2V0KCRzZWxmKScsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCBiYXNlRmllbGRzID0gT2JqZWN0LmtleXMoVGVzdFR5cGUuJGZpZWxkcykuZmlsdGVyKGZpZWxkID0+IFRlc3RUeXBlLiRmaWVsZHNbZmllbGRdLnR5cGUgIT09ICdoYXNNYW55Jyk7XG4gICAgICAgIC8vIGNvbnN0IGhhc01hbnlzID0gT2JqZWN0LmtleXMoVGVzdFR5cGUuJGZpZWxkcykuZmlsdGVyKGZpZWxkID0+IFRlc3RUeXBlLiRmaWVsZHNbZmllbGRdLnR5cGUgPT09ICdoYXNNYW55Jyk7XG5cbiAgICAgICAgcmV0dXJuIGV4cGVjdChwbHVtcC5maW5kKCd0ZXN0cycsIG9uZS4kaWQpLiRnZXQoKSkudG8uZXZlbnR1YWxseS5oYXZlLmFsbC5rZXlzKGJhc2VGaWVsZHMpO1xuICAgICAgICAvLyBOT1RFOiAuaGF2ZS5hbGwgcmVxdWlyZXMgbGlzdCBsZW5ndGggZXF1YWxpdHlcbiAgICAgICAgLy8gLmFuZC5ub3Qua2V5cyhoYXNNYW55cyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgb3B0aW1pc3RpY2FsbHkgdXBkYXRlIG9uIGZpZWxkIHVwZGF0ZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kc2V0KHsgbmFtZTogJ3J1dGFiYWdhJyB9KSlcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncnV0YWJhZ2EnKSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHBhY2thZ2UgYWxsIHJlbGF0ZWQgZG9jdW1lbnRzIGZvciByZWFkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHtcbiAgICAgICAgaWQ6IDEsXG4gICAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgICAgfSwgcGx1bXApO1xuICAgICAgY29uc3QgdHdvID0gbmV3IFRlc3RUeXBlKHtcbiAgICAgICAgaWQ6IDIsXG4gICAgICAgIG5hbWU6ICdmcm90YXRvJyxcbiAgICAgICAgZXh0ZW5kZWQ6IHsgY29ob3J0OiAyMDEzIH0sXG4gICAgICB9LCBwbHVtcCk7XG4gICAgICBjb25zdCB0aHJlZSA9IG5ldyBUZXN0VHlwZSh7XG4gICAgICAgIGlkOiAzLFxuICAgICAgICBuYW1lOiAncnV0YWJhZ2EnLFxuICAgICAgfSwgcGx1bXApO1xuXG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgb25lLiRzYXZlKCksXG4gICAgICAgIHR3by4kc2F2ZSgpLFxuICAgICAgICB0aHJlZS4kc2F2ZSgpLFxuICAgICAgXSkudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICAgIG9uZS4kYWRkKCdjaGlsZHJlbicsIHR3by4kaWQpLFxuICAgICAgICAgIHR3by4kYWRkKCdjaGlsZHJlbicsIHRocmVlLiRpZCksXG4gICAgICAgIF0pO1xuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3Qob25lLiRwYWNrYWdlKCkpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChcbiAgICAgICAgICBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYygnc3JjL3Rlc3QvdGVzdFR5cGUuanNvbicpKVxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdyZWxhdGlvbnNoaXBzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgc2hvdyBlbXB0eSBoYXNNYW55IGxpc3RzIGFzIHtrZXk6IFtdfScsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgY2hpbGRyZW46IFtdIH0pKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWRkIGhhc01hbnkgZWxlbWVudHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgY2hpbGRyZW46IFt7XG4gICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgIH1dIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFkZCBoYXNNYW55IGVsZW1lbnRzIGJ5IGNoaWxkIGZpZWxkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2Zyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgeyBjaGlsZF9pZDogMTAwIH0pKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgY2hpbGRyZW46IFt7XG4gICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgIH1dIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlbW92ZSBoYXNNYW55IGVsZW1lbnRzJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2Zyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IGNoaWxkcmVuOiBbe1xuICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICB9XSB9KTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiBvbmUuJHJlbW92ZSgnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoeyBjaGlsZHJlbjogW10gfSkpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBpbmNsdWRlIHZhbGVuY2UgaW4gaGFzTWFueSBvcGVyYXRpb25zJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2dyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ3ZhbGVuY2VDaGlsZHJlbicsIDEwMCwgeyBwZXJtOiAxIH0pKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRnZXQoJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IHZhbGVuY2VDaGlsZHJlbjogW3tcbiAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgICBwZXJtOiAxLFxuICAgICAgICB9XSB9KTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiBvbmUuJG1vZGlmeVJlbGF0aW9uc2hpcCgndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7IHBlcm06IDIgfSkpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgdmFsZW5jZUNoaWxkcmVuOiBbe1xuICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICAgIHBlcm06IDIsXG4gICAgICAgIH1dIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdldmVudHMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBhbGxvdyBzdWJzY3JpcHRpb24gdG8gbW9kZWwgZGF0YScsIChkb25lKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICBsZXQgcGhhc2UgPSAwO1xuICAgICAgb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gb25lLiRzdWJzY3JpYmUoKHYpID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHBoYXNlID09PSAwKSB7XG4gICAgICAgICAgICAgIGlmICh2Lm5hbWUpIHtcbiAgICAgICAgICAgICAgICBwaGFzZSA9IDE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMSkge1xuICAgICAgICAgICAgICBleHBlY3QodikudG8uaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICAgICAgICAgICAgaWYgKHYuaWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHBoYXNlID0gMjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBoYXNlID09PSAyKSB7XG4gICAgICAgICAgICAgIGlmICh2Lm5hbWUgIT09ICdwb3RhdG8nKSB7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAnZ3JvdGF0bycpO1xuICAgICAgICAgICAgICAgIHBoYXNlID0gMztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBoYXNlID09PSAzKSB7XG4gICAgICAgICAgICAgIGlmICgodi5jaGlsZHJlbikgJiYgKHYuY2hpbGRyZW4ubGVuZ3RoID4gMCkpIHtcbiAgICAgICAgICAgICAgICBleHBlY3Qodi5jaGlsZHJlbikudG8uZGVlcC5lcXVhbChbe1xuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBkb25lKGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiBvbmUuJHNldCh7IG5hbWU6ICdncm90YXRvJyB9KSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIHsgY2hpbGRfaWQ6IDEwMCB9KSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFsbG93IHN1YnNjcmlwdGlvbiB0byBtb2RlbCBzaWRlbG9hZHMnLCAoZG9uZSkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgbGV0IHBoYXNlID0gMDtcbiAgICAgIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCB7IGNoaWxkX2lkOiAxMDAgfSkpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG9uZS4kc3Vic2NyaWJlKFskYWxsXSwgKHYpID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHBoYXNlID09PSAwKSB7XG4gICAgICAgICAgICAgIGlmICh2Lm5hbWUpIHtcbiAgICAgICAgICAgICAgICBwaGFzZSA9IDE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMSkge1xuICAgICAgICAgICAgICBleHBlY3QodikudG8uaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICAgICAgICAgICAgZXhwZWN0KHYuY2hpbGRyZW4pLnRvLmRlZXAuZXF1YWwoW3tcbiAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICBwaGFzZSA9IDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGhhc2UgPT09IDIpIHtcbiAgICAgICAgICAgICAgaWYgKCh2LmNoaWxkcmVuKSAmJiAodi5jaGlsZHJlbi5sZW5ndGggPiAxKSkge1xuICAgICAgICAgICAgICAgIGV4cGVjdCh2LmNoaWxkcmVuKS50by5kZWVwLmVxdWFsKFt7XG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDEsXG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgZG9uZShlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgeyBjaGlsZF9pZDogMTAxIH0pKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdXBkYXRlIG9uIGNhY2hlYWJsZSByZWFkIGV2ZW50cycsIChkb25lKSA9PiB7XG4gICAgICBjb25zdCBEZWxheVByb3h5ID0ge1xuICAgICAgICBnZXQ6ICh0YXJnZXQsIG5hbWUpID0+IHtcbiAgICAgICAgICBpZiAoWydyZWFkJywgJ3dyaXRlJywgJ2FkZCcsICdyZW1vdmUnXS5pbmRleE9mKG5hbWUpID49IDApIHtcbiAgICAgICAgICAgIHJldHVybiAoLi4uYXJncykgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gQmx1ZWJpcmQuZGVsYXkoMjAwKVxuICAgICAgICAgICAgICAudGhlbigoKSA9PiB0YXJnZXRbbmFtZV0oLi4uYXJncykpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRhcmdldFtuYW1lXTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgICAgY29uc3QgZGVsYXllZE1lbXN0b3JlID0gbmV3IFByb3h5KG5ldyBNZW1vcnlTdG9yYWdlKHsgdGVybWluYWw6IHRydWUgfSksIERlbGF5UHJveHkpO1xuICAgICAgY29uc3QgY29sZE1lbXN0b3JlID0gbmV3IE1lbW9yeVN0b3JhZ2UoKTtcbiAgICAgIGNvbnN0IG90aGVyUGx1bXAgPSBuZXcgUGx1bXAoe1xuICAgICAgICBzdG9yYWdlOiBbY29sZE1lbXN0b3JlLCBkZWxheWVkTWVtc3RvcmVdLFxuICAgICAgICB0eXBlczogW1Rlc3RUeXBlXSxcbiAgICAgIH0pO1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3Nsb3d0YXRvJyB9LCBvdGhlclBsdW1wKTtcbiAgICAgIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGdldCgpKVxuICAgICAgLnRoZW4oKHZhbCkgPT4ge1xuICAgICAgICByZXR1cm4gY29sZE1lbXN0b3JlLndyaXRlKFRlc3RUeXBlLCB7XG4gICAgICAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgICAgICAgaWQ6IHZhbC5pZCxcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIGxldCBwaGFzZSA9IDA7XG4gICAgICAgICAgY29uc3QgdHdvID0gb3RoZXJQbHVtcC5maW5kKCd0ZXN0cycsIHZhbC5pZCk7XG4gICAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gdHdvLiRzdWJzY3JpYmUoKHYpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGlmICh2Lm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgIGV4cGVjdCh2KS50by5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgICAgICAgICAgICAgICAgcGhhc2UgPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAocGhhc2UgPT09IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAodi5uYW1lICE9PSAncG90YXRvJykge1xuICAgICAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAnc2xvd3RhdG8nKTtcbiAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgICBkb25lKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=
