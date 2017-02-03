'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _fsSync = require('fs-sync');

var _fsSync2 = _interopRequireDefault(_fsSync);

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
        return expect(one.$package()).to.eventually.deep.equal(_fsSync2.default.readJSON('src/test/testType.json'));
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUyIiwidGVybWluYWwiLCJwbHVtcCIsInN0b3JhZ2UiLCJ0eXBlcyIsInVzZSIsImV4cGVjdCIsImRlc2NyaWJlIiwiaXQiLCJvbmUiLCJpZCIsIm5hbWUiLCIkZ2V0IiwidG8iLCJldmVudHVhbGx5IiwiaGF2ZSIsInByb3BlcnR5IiwiTWluaVRlc3QiLCJmcm9tSlNPTiIsInRvSlNPTiIsImRlZXAiLCJlcXVhbCIsIndyaXRlIiwidGhlbiIsInR3byIsImZpbmQiLCJub0lEIiwiJHNhdmUiLCJtIiwiY29udGFpbiIsImtleXMiLCIkaWQiLCIkZGVsZXRlIiwiYmUiLCJudWxsIiwiYXNzaWduIiwiJHNldCIsImV4dGVuZGVkIiwiY29ob3J0IiwidGhyZWUiLCJhbGwiLCIkYWRkIiwiJHBhY2thZ2UiLCJyZWFkSlNPTiIsImNoaWxkcmVuIiwiY2hpbGRfaWQiLCJwYXJlbnRfaWQiLCIkcmVtb3ZlIiwicGVybSIsInZhbGVuY2VDaGlsZHJlbiIsIiRtb2RpZnlSZWxhdGlvbnNoaXAiLCJkb25lIiwicGhhc2UiLCJzdWJzY3JpcHRpb24iLCIkc3Vic2NyaWJlIiwidiIsInVuZGVmaW5lZCIsImxlbmd0aCIsInVuc3Vic2NyaWJlIiwiZXJyIiwiRGVsYXlQcm94eSIsImdldCIsInRhcmdldCIsImluZGV4T2YiLCJhcmdzIiwiZGVsYXkiLCJkZWxheWVkTWVtc3RvcmUiLCJQcm94eSIsImNvbGRNZW1zdG9yZSIsIm90aGVyUGx1bXAiLCJ2YWwiXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQTs7QUFDQTs7Ozs7Ozs7K2VBUkE7O0FBVUEsSUFBTUEsWUFBWSx5QkFBa0IsRUFBRUMsVUFBVSxJQUFaLEVBQWxCLENBQWxCOztBQUVBLElBQU1DLFFBQVEsaUJBQVU7QUFDdEJDLFdBQVMsQ0FBQ0gsU0FBRCxDQURhO0FBRXRCSSxTQUFPO0FBRmUsQ0FBVixDQUFk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QWFFLElBQWIsQ0FBa0JDLFFBQWxCLENBQTJCLE1BQTNCLEVBQW1DLFVBQW5DO0FBQ0FxQywrQkFBYUssV0FBYjtBQUNBUDtBQUNEO0FBQ0Y7QUFDRixhQWRELENBY0UsT0FBT1EsR0FBUCxFQUFZO0FBQ1pOLDJCQUFhSyxXQUFiO0FBQ0FQLG1CQUFLUSxHQUFMO0FBQ0Q7QUFDRixXQW5Cb0IsQ0FBckI7QUFvQkQsU0EzQk0sQ0FBUDtBQTRCRCxPQS9CRDtBQWdDRCxLQXBERDtBQXFERCxHQTVJRDtBQTZJRCxDQXpTRCIsImZpbGUiOiJ0ZXN0L21vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlLCBtb2NoYSovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBmcyBmcm9tICdmcy1zeW5jJztcblxuaW1wb3J0IHsgUGx1bXAsIE1vZGVsLCBNZW1vcnlTdG9yYWdlLCAkYWxsIH0gZnJvbSAnLi4vaW5kZXgnO1xuaW1wb3J0IHsgVGVzdFR5cGUgfSBmcm9tICcuL3Rlc3RUeXBlJztcblxuY29uc3QgbWVtc3RvcmUyID0gbmV3IE1lbW9yeVN0b3JhZ2UoeyB0ZXJtaW5hbDogdHJ1ZSB9KTtcblxuY29uc3QgcGx1bXAgPSBuZXcgUGx1bXAoe1xuICBzdG9yYWdlOiBbbWVtc3RvcmUyXSxcbiAgdHlwZXM6IFtUZXN0VHlwZV0sXG59KTtcblxuXG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5jb25zdCBleHBlY3QgPSBjaGFpLmV4cGVjdDtcblxuZGVzY3JpYmUoJ21vZGVsJywgKCkgPT4ge1xuICBkZXNjcmliZSgnYmFzaWMgZnVuY3Rpb25hbGl0eScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHJldHVybiBwcm9taXNlcyB0byBleGlzdGluZyBkYXRhJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgaWQ6IDEsIG5hbWU6ICdwb3RhdG8nIH0pO1xuICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHByb3Blcmx5IHNlcmlhbGl6ZSBpdHMgc2NoZW1hJywgKCkgPT4ge1xuICAgICAgY2xhc3MgTWluaVRlc3QgZXh0ZW5kcyBNb2RlbCB7fVxuICAgICAgTWluaVRlc3QuZnJvbUpTT04oVGVzdFR5cGUudG9KU09OKCkpO1xuICAgICAgcmV0dXJuIGV4cGVjdChNaW5pVGVzdC50b0pTT04oKSkudG8uZGVlcC5lcXVhbChUZXN0VHlwZS50b0pTT04oKSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGxvYWQgZGF0YSBmcm9tIGRhdGFzdG9yZXMnLCAoKSA9PiB7XG4gICAgICByZXR1cm4gbWVtc3RvcmUyLndyaXRlKFRlc3RUeXBlLCB7XG4gICAgICAgIGlkOiAyLFxuICAgICAgICBuYW1lOiAncG90YXRvJyxcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCB0d28gPSBwbHVtcC5maW5kKCd0ZXN0cycsIDIpO1xuICAgICAgICByZXR1cm4gZXhwZWN0KHR3by4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgYW4gaWQgd2hlbiBvbmUgaXMgdW5zZXQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBub0lEID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIGV4cGVjdChub0lELiRzYXZlKCkudGhlbigobSkgPT4gbS4kZ2V0KCkpKS50by5ldmVudHVhbGx5LmNvbnRhaW4ua2V5cygnbmFtZScsICdpZCcpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhbGxvdyBkYXRhIHRvIGJlIGRlbGV0ZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChwbHVtcC5maW5kKCd0ZXN0cycsIG9uZS4kaWQpLiRnZXQoKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRkZWxldGUoKSlcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChwbHVtcC5maW5kKCd0ZXN0cycsIG9uZS4kaWQpLiRnZXQoKSkudG8uZXZlbnR1YWxseS5iZS5udWxsKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWxsb3cgZmllbGRzIHRvIGJlIGxvYWRlZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChwbHVtcC5maW5kKCd0ZXN0cycsIG9uZS4kaWQpLiRnZXQoKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3AnKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChwbHVtcC5maW5kKCd0ZXN0cycsIG9uZS4kaWQpLiRnZXQoKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChUZXN0VHlwZS5hc3NpZ24oeyBuYW1lOiAncCcsIGlkOiBvbmUuJGlkIH0pKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBvcHRpbWlzdGljYWxseSB1cGRhdGUgb24gZmllbGQgdXBkYXRlcycsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRzZXQoeyBuYW1lOiAncnV0YWJhZ2EnIH0pKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdydXRhYmFnYScpKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcGFja2FnZSBhbGwgcmVsYXRlZCBkb2N1bWVudHMgZm9yIHJlYWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoe1xuICAgICAgICBpZDogMSxcbiAgICAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgICB9LCBwbHVtcCk7XG4gICAgICBjb25zdCB0d28gPSBuZXcgVGVzdFR5cGUoe1xuICAgICAgICBpZDogMixcbiAgICAgICAgbmFtZTogJ2Zyb3RhdG8nLFxuICAgICAgICBleHRlbmRlZDogeyBjb2hvcnQ6IDIwMTMgfSxcbiAgICAgIH0sIHBsdW1wKTtcbiAgICAgIGNvbnN0IHRocmVlID0gbmV3IFRlc3RUeXBlKHtcbiAgICAgICAgaWQ6IDMsXG4gICAgICAgIG5hbWU6ICdydXRhYmFnYScsXG4gICAgICB9LCBwbHVtcCk7XG5cbiAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICBvbmUuJHNhdmUoKSxcbiAgICAgICAgdHdvLiRzYXZlKCksXG4gICAgICAgIHRocmVlLiRzYXZlKCksXG4gICAgICBdKS50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgICAgb25lLiRhZGQoJ2NoaWxkcmVuJywgdHdvLiRpZCksXG4gICAgICAgICAgdHdvLiRhZGQoJ2NoaWxkcmVuJywgdGhyZWUuJGlkKSxcbiAgICAgICAgXSk7XG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJHBhY2thZ2UoKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKGZzLnJlYWRKU09OKCdzcmMvdGVzdC90ZXN0VHlwZS5qc29uJykpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdyZWxhdGlvbnNoaXBzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgc2hvdyBlbXB0eSBoYXNNYW55IGxpc3RzIGFzIHtrZXk6IFtdfScsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgY2hpbGRyZW46IFtdIH0pKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWRkIGhhc01hbnkgZWxlbWVudHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgY2hpbGRyZW46IFt7XG4gICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgIH1dIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFkZCBoYXNNYW55IGVsZW1lbnRzIGJ5IGNoaWxkIGZpZWxkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2Zyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgeyBjaGlsZF9pZDogMTAwIH0pKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgY2hpbGRyZW46IFt7XG4gICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgIH1dIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlbW92ZSBoYXNNYW55IGVsZW1lbnRzJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2Zyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IGNoaWxkcmVuOiBbe1xuICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICB9XSB9KTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiBvbmUuJHJlbW92ZSgnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoeyBjaGlsZHJlbjogW10gfSkpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBpbmNsdWRlIHZhbGVuY2UgaW4gaGFzTWFueSBvcGVyYXRpb25zJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2dyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ3ZhbGVuY2VDaGlsZHJlbicsIDEwMCwgeyBwZXJtOiAxIH0pKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRnZXQoJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IHZhbGVuY2VDaGlsZHJlbjogW3tcbiAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgICBwZXJtOiAxLFxuICAgICAgICB9XSB9KTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiBvbmUuJG1vZGlmeVJlbGF0aW9uc2hpcCgndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7IHBlcm06IDIgfSkpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgdmFsZW5jZUNoaWxkcmVuOiBbe1xuICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICAgIHBlcm06IDIsXG4gICAgICAgIH1dIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdldmVudHMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBhbGxvdyBzdWJzY3JpcHRpb24gdG8gbW9kZWwgZGF0YScsIChkb25lKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICBsZXQgcGhhc2UgPSAwO1xuICAgICAgb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gb25lLiRzdWJzY3JpYmUoKHYpID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHBoYXNlID09PSAwKSB7XG4gICAgICAgICAgICAgIGlmICh2Lm5hbWUpIHtcbiAgICAgICAgICAgICAgICBwaGFzZSA9IDE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMSkge1xuICAgICAgICAgICAgICBleHBlY3QodikudG8uaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICAgICAgICAgICAgaWYgKHYuaWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHBoYXNlID0gMjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBoYXNlID09PSAyKSB7XG4gICAgICAgICAgICAgIGlmICh2Lm5hbWUgIT09ICdwb3RhdG8nKSB7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAnZ3JvdGF0bycpO1xuICAgICAgICAgICAgICAgIHBoYXNlID0gMztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBoYXNlID09PSAzKSB7XG4gICAgICAgICAgICAgIGlmICgodi5jaGlsZHJlbikgJiYgKHYuY2hpbGRyZW4ubGVuZ3RoID4gMCkpIHtcbiAgICAgICAgICAgICAgICBleHBlY3Qodi5jaGlsZHJlbikudG8uZGVlcC5lcXVhbChbe1xuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBkb25lKGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiBvbmUuJHNldCh7IG5hbWU6ICdncm90YXRvJyB9KSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIHsgY2hpbGRfaWQ6IDEwMCB9KSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFsbG93IHN1YnNjcmlwdGlvbiB0byBtb2RlbCBzaWRlbG9hZHMnLCAoZG9uZSkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgbGV0IHBoYXNlID0gMDtcbiAgICAgIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCB7IGNoaWxkX2lkOiAxMDAgfSkpXG4gICAgICAvLyAudGhlbigoKSA9PiBvbmUuJGdldChbJHNlbGYsICdjaGlsZHJlbiddKS50aGVuKCh2KSA9PiBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh2LCBudWxsLCAyKSkpKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBvbmUuJHN1YnNjcmliZShbJGFsbF0sICh2KSA9PiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMCkge1xuICAgICAgICAgICAgICBpZiAodi5uYW1lKSB7XG4gICAgICAgICAgICAgICAgcGhhc2UgPSAxO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGhhc2UgPT09IDEpIHtcbiAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgICAgICAgICAgIGV4cGVjdCh2LmNoaWxkcmVuKS50by5kZWVwLmVxdWFsKFt7XG4gICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgcGhhc2UgPSAyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBoYXNlID09PSAyKSB7XG4gICAgICAgICAgICAgIGlmICgodi5jaGlsZHJlbikgJiYgKHYuY2hpbGRyZW4ubGVuZ3RoID4gMSkpIHtcbiAgICAgICAgICAgICAgICBleHBlY3Qodi5jaGlsZHJlbikudG8uZGVlcC5lcXVhbChbe1xuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAxLFxuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICBkb25lKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGRvbmUoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIHsgY2hpbGRfaWQ6IDEwMSB9KSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHVwZGF0ZSBvbiBjYWNoZWFibGUgcmVhZCBldmVudHMnLCAoZG9uZSkgPT4ge1xuICAgICAgY29uc3QgRGVsYXlQcm94eSA9IHtcbiAgICAgICAgZ2V0OiAodGFyZ2V0LCBuYW1lKSA9PiB7XG4gICAgICAgICAgaWYgKFsncmVhZCcsICd3cml0ZScsICdhZGQnLCAncmVtb3ZlJ10uaW5kZXhPZihuYW1lKSA+PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIEJsdWViaXJkLmRlbGF5KDIwMClcbiAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGFyZ2V0W25hbWVdKC4uLmFyZ3MpKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0YXJnZXRbbmFtZV07XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICAgIGNvbnN0IGRlbGF5ZWRNZW1zdG9yZSA9IG5ldyBQcm94eShuZXcgTWVtb3J5U3RvcmFnZSh7IHRlcm1pbmFsOiB0cnVlIH0pLCBEZWxheVByb3h5KTtcbiAgICAgIGNvbnN0IGNvbGRNZW1zdG9yZSA9IG5ldyBNZW1vcnlTdG9yYWdlKCk7XG4gICAgICBjb25zdCBvdGhlclBsdW1wID0gbmV3IFBsdW1wKHtcbiAgICAgICAgc3RvcmFnZTogW2NvbGRNZW1zdG9yZSwgZGVsYXllZE1lbXN0b3JlXSxcbiAgICAgICAgdHlwZXM6IFtUZXN0VHlwZV0sXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdzbG93dGF0bycgfSwgb3RoZXJQbHVtcCk7XG4gICAgICBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRnZXQoKSlcbiAgICAgIC50aGVuKCh2YWwpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbGRNZW1zdG9yZS53cml0ZShUZXN0VHlwZSwge1xuICAgICAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgICAgICAgIGlkOiB2YWwuaWQsXG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICBsZXQgcGhhc2UgPSAwO1xuICAgICAgICAgIGNvbnN0IHR3byA9IG90aGVyUGx1bXAuZmluZCgndGVzdHMnLCB2YWwuaWQpO1xuICAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IHR3by4kc3Vic2NyaWJlKCh2KSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBpZiAocGhhc2UgPT09IDApIHtcbiAgICAgICAgICAgICAgICBpZiAodi5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICBleHBlY3QodikudG8uaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICAgICAgICAgICAgICAgIHBoYXNlID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHBoYXNlID09PSAxKSB7XG4gICAgICAgICAgICAgICAgaWYgKHYubmFtZSAhPT0gJ3BvdGF0bycpIHtcbiAgICAgICAgICAgICAgICAgIGV4cGVjdCh2KS50by5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3Nsb3d0YXRvJyk7XG4gICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgZG9uZShlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19
