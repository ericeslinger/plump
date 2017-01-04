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
      return expect(one.$get('name')).to.eventually.equal('potato');
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
        return expect(two.$get('name')).to.eventually.equal('potato');
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
        return expect(plump.find('tests', one.$id).$get('name')).to.eventually.equal('potato');
      }).then(function () {
        return one.$delete();
      }).then(function () {
        return expect(plump.find('tests', one.$id).$get()).to.eventually.be.null;
      });
    });

    it('should allow fields to be loaded', function () {
      var one = new _testType.TestType({ name: 'p' }, plump);
      return one.$save().then(function () {
        return expect(plump.find('tests', one.$id).$get('name')).to.eventually.equal('p');
      }).then(function () {
        return expect(plump.find('tests', one.$id).$get()).to.eventually.deep.equal(_testType.TestType.assign({ name: 'p', id: one.$id }));
      });
    });

    it('should optimistically update on field updates', function () {
      var one = new _testType.TestType({ name: 'potato' }, plump);
      return one.$save().then(function () {
        return one.$set({ name: 'rutabaga' });
      }).then(function () {
        return expect(one.$get('name')).to.eventually.equal('rutabaga');
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
            // console.log(`${phase}: ${JSON.stringify(v, null, 2)}`);
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
              // console.log(phase);
              // console.log(JSON.stringify(v, null, 2));
              if (phase === 0) {
                if (v.name) {
                  console.log(v);
                  expect(v).to.have.property('name', 'potato');
                  phase = 1;
                }
              }
              if (phase === 1) {
                if (v.name !== 'potato') {
                  console.log(v);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUyIiwidGVybWluYWwiLCJwbHVtcCIsInN0b3JhZ2UiLCJ0eXBlcyIsInVzZSIsImV4cGVjdCIsImRlc2NyaWJlIiwiaXQiLCJvbmUiLCJpZCIsIm5hbWUiLCIkZ2V0IiwidG8iLCJldmVudHVhbGx5IiwiZXF1YWwiLCJNaW5pVGVzdCIsImZyb21KU09OIiwidG9KU09OIiwiZGVlcCIsIndyaXRlIiwidGhlbiIsInR3byIsImZpbmQiLCJub0lEIiwiJHNhdmUiLCJtIiwiY29udGFpbiIsImtleXMiLCIkaWQiLCIkZGVsZXRlIiwiYmUiLCJudWxsIiwiYXNzaWduIiwiJHNldCIsIiRhZGQiLCJjaGlsZF9pZCIsInBhcmVudF9pZCIsIiRyZW1vdmUiLCJwZXJtIiwiJG1vZGlmeVJlbGF0aW9uc2hpcCIsImRvbmUiLCJwaGFzZSIsInN1YnNjcmlwdGlvbiIsIiRzdWJzY3JpYmUiLCJ2IiwiaGF2ZSIsInByb3BlcnR5IiwidW5kZWZpbmVkIiwiY2hpbGRyZW4iLCJsZW5ndGgiLCJ1bnN1YnNjcmliZSIsImVyciIsIkRlbGF5UHJveHkiLCJnZXQiLCJ0YXJnZXQiLCJpbmRleE9mIiwiYXJncyIsImRlbGF5IiwiZGVsYXllZE1lbXN0b3JlIiwiUHJveHkiLCJjb2xkTWVtc3RvcmUiLCJvdGhlclBsdW1wIiwidmFsIiwiY29uc29sZSIsImxvZyJdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQTs7QUFDQTs7Ozs7Ozs7K2VBUEE7O0FBU0EsSUFBTUEsWUFBWSx5QkFBa0IsRUFBRUMsVUFBVSxJQUFaLEVBQWxCLENBQWxCOztBQUVBLElBQU1DLFFBQVEsaUJBQVU7QUFDdEJDLFdBQVMsQ0FBQ0gsU0FBRCxDQURhO0FBRXRCSSxTQUFPO0FBRmUsQ0FBVixDQUFkOztBQU1BLGVBQUtDLEdBQUw7QUFDQSxJQUFNQyxTQUFTLGVBQUtBLE1BQXBCOztBQUVBQyxTQUFTLE9BQVQsRUFB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QUFNO0FBQ1YsY0FBSXFCLFFBQVEsQ0FBWjtBQUNBLGNBQU1wQixNQUFNd0MsV0FBV3ZDLElBQVgsQ0FBZ0IsT0FBaEIsRUFBeUJ3QyxJQUFJckQsRUFBN0IsQ0FBWjtBQUNBLGNBQU1pQyxlQUFlckIsSUFBSXNCLFVBQUosQ0FBZSxVQUFDQyxDQUFELEVBQU87QUFDekMsZ0JBQUk7QUFDRjtBQUNBO0FBQ0Esa0JBQUlILFVBQVUsQ0FBZCxFQUFpQjtBQUNmLG9CQUFJRyxFQUFFbEMsSUFBTixFQUFZO0FBQ1ZxRCwwQkFBUUMsR0FBUixDQUFZcEIsQ0FBWjtBQUNBdkMseUJBQU91QyxDQUFQLEVBQVVoQyxFQUFWLENBQWFpQyxJQUFiLENBQWtCQyxRQUFsQixDQUEyQixNQUEzQixFQUFtQyxRQUFuQztBQUNBTCwwQkFBUSxDQUFSO0FBQ0Q7QUFDRjtBQUNELGtCQUFJQSxVQUFVLENBQWQsRUFBaUI7QUFDZixvQkFBSUcsRUFBRWxDLElBQUYsS0FBVyxRQUFmLEVBQXlCO0FBQ3ZCcUQsMEJBQVFDLEdBQVIsQ0FBWXBCLENBQVo7QUFDQXZDLHlCQUFPdUMsQ0FBUCxFQUFVaEMsRUFBVixDQUFhaUMsSUFBYixDQUFrQkMsUUFBbEIsQ0FBMkIsTUFBM0IsRUFBbUMsVUFBbkM7QUFDQUosK0JBQWFRLFdBQWI7QUFDQVY7QUFDRDtBQUNGO0FBQ0YsYUFsQkQsQ0FrQkUsT0FBT1csR0FBUCxFQUFZO0FBQ1pULDJCQUFhUSxXQUFiO0FBQ0FWLG1CQUFLVyxHQUFMO0FBQ0Q7QUFDRixXQXZCb0IsQ0FBckI7QUF3QkQsU0EvQk0sQ0FBUDtBQWdDRCxPQW5DRDtBQW9DRCxLQXhERDtBQXlERCxHQXRHRDtBQXVHRCxDQXRPRCIsImZpbGUiOiJ0ZXN0L21vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlLCBtb2NoYSovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcblxuaW1wb3J0IHsgUGx1bXAsIE1vZGVsLCBNZW1vcnlTdG9yYWdlIH0gZnJvbSAnLi4vaW5kZXgnO1xuaW1wb3J0IHsgVGVzdFR5cGUgfSBmcm9tICcuL3Rlc3RUeXBlJztcblxuY29uc3QgbWVtc3RvcmUyID0gbmV3IE1lbW9yeVN0b3JhZ2UoeyB0ZXJtaW5hbDogdHJ1ZSB9KTtcblxuY29uc3QgcGx1bXAgPSBuZXcgUGx1bXAoe1xuICBzdG9yYWdlOiBbbWVtc3RvcmUyXSxcbiAgdHlwZXM6IFtUZXN0VHlwZV0sXG59KTtcblxuXG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5jb25zdCBleHBlY3QgPSBjaGFpLmV4cGVjdDtcblxuZGVzY3JpYmUoJ21vZGVsJywgKCkgPT4ge1xuICBkZXNjcmliZSgnYmFzaWMgZnVuY3Rpb25hbGl0eScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHJldHVybiBwcm9taXNlcyB0byBleGlzdGluZyBkYXRhJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgaWQ6IDEsIG5hbWU6ICdwb3RhdG8nIH0pO1xuICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdwb3RhdG8nKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcHJvcGVybHkgc2VyaWFsaXplIGl0cyBzY2hlbWEnLCAoKSA9PiB7XG4gICAgICBjbGFzcyBNaW5pVGVzdCBleHRlbmRzIE1vZGVsIHt9XG4gICAgICBNaW5pVGVzdC5mcm9tSlNPTihUZXN0VHlwZS50b0pTT04oKSk7XG4gICAgICByZXR1cm4gZXhwZWN0KE1pbmlUZXN0LnRvSlNPTigpKS50by5kZWVwLmVxdWFsKFRlc3RUeXBlLnRvSlNPTigpKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgbG9hZCBkYXRhIGZyb20gZGF0YXN0b3JlcycsICgpID0+IHtcbiAgICAgIHJldHVybiBtZW1zdG9yZTIud3JpdGUoVGVzdFR5cGUsIHtcbiAgICAgICAgaWQ6IDIsXG4gICAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IHR3byA9IHBsdW1wLmZpbmQoJ3Rlc3RzJywgMik7XG4gICAgICAgIHJldHVybiBleHBlY3QodHdvLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncG90YXRvJyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY3JlYXRlIGFuIGlkIHdoZW4gb25lIGlzIHVuc2V0JywgKCkgPT4ge1xuICAgICAgY29uc3Qgbm9JRCA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBleHBlY3Qobm9JRC4kc2F2ZSgpLnRoZW4oKG0pID0+IG0uJGdldCgpKSkudG8uZXZlbnR1YWxseS5jb250YWluLmtleXMoJ25hbWUnLCAnaWQnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWxsb3cgZGF0YSB0byBiZSBkZWxldGVkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3BvdGF0bycpKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRkZWxldGUoKSlcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChwbHVtcC5maW5kKCd0ZXN0cycsIG9uZS4kaWQpLiRnZXQoKSkudG8uZXZlbnR1YWxseS5iZS5udWxsKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWxsb3cgZmllbGRzIHRvIGJlIGxvYWRlZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChwbHVtcC5maW5kKCd0ZXN0cycsIG9uZS4kaWQpLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncCcpKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KHBsdW1wLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFRlc3RUeXBlLmFzc2lnbih7IG5hbWU6ICdwJywgaWQ6IG9uZS4kaWQgfSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIG9wdGltaXN0aWNhbGx5IHVwZGF0ZSBvbiBmaWVsZCB1cGRhdGVzJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJHNldCh7IG5hbWU6ICdydXRhYmFnYScgfSkpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncnV0YWJhZ2EnKSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdyZWxhdGlvbnNoaXBzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgc2hvdyBlbXB0eSBoYXNNYW55IGxpc3RzIGFzIFtdJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2Zyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW10pKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWRkIGhhc01hbnkgZWxlbWVudHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFt7XG4gICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgIH1dKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhZGQgaGFzTWFueSBlbGVtZW50cyBieSBjaGlsZCBmaWVsZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIHsgY2hpbGRfaWQ6IDEwMCB9KSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbe1xuICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICB9XSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmVtb3ZlIGhhc01hbnkgZWxlbWVudHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFt7XG4gICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgIH1dKTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiBvbmUuJHJlbW92ZSgnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW10pKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaW5jbHVkZSB2YWxlbmNlIGluIGhhc01hbnkgb3BlcmF0aW9ucycsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdncm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCd2YWxlbmNlQ2hpbGRyZW4nLCAxMDAsIHsgcGVybTogMSB9KSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kZ2V0KCd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW3tcbiAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgICBwZXJtOiAxLFxuICAgICAgICB9XSk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRtb2RpZnlSZWxhdGlvbnNoaXAoJ3ZhbGVuY2VDaGlsZHJlbicsIDEwMCwgeyBwZXJtOiAyIH0pKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbe1xuICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICAgIHBlcm06IDIsXG4gICAgICAgIH1dKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZXZlbnRzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgYWxsb3cgc3Vic2NyaXB0aW9uIHRvIG1vZGVsIGRhdGEnLCAoZG9uZSkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgbGV0IHBoYXNlID0gMDtcbiAgICAgIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG9uZS4kc3Vic2NyaWJlKCh2KSA9PiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke3BoYXNlfTogJHtKU09OLnN0cmluZ2lmeSh2LCBudWxsLCAyKX1gKTtcbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMCkge1xuICAgICAgICAgICAgICBpZiAodi5uYW1lKSB7XG4gICAgICAgICAgICAgICAgcGhhc2UgPSAxO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGhhc2UgPT09IDEpIHtcbiAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgICAgICAgICAgIGlmICh2LmlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBwaGFzZSA9IDI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMikge1xuICAgICAgICAgICAgICBpZiAodi5uYW1lICE9PSAncG90YXRvJykge1xuICAgICAgICAgICAgICAgIGV4cGVjdCh2KS50by5oYXZlLnByb3BlcnR5KCduYW1lJywgJ2dyb3RhdG8nKTtcbiAgICAgICAgICAgICAgICBwaGFzZSA9IDM7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMykge1xuICAgICAgICAgICAgICBpZiAoKHYuY2hpbGRyZW4pICYmICh2LmNoaWxkcmVuLmxlbmd0aCA+IDApKSB7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHYuY2hpbGRyZW4pLnRvLmRlZXAuZXF1YWwoW3tcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgZG9uZShlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRzZXQoeyBuYW1lOiAnZ3JvdGF0bycgfSkpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCB7IGNoaWxkX2lkOiAxMDAgfSkpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB1cGRhdGUgb24gY2FjaGVhYmxlIHJlYWQgZXZlbnRzJywgKGRvbmUpID0+IHtcbiAgICAgIGNvbnN0IERlbGF5UHJveHkgPSB7XG4gICAgICAgIGdldDogKHRhcmdldCwgbmFtZSkgPT4ge1xuICAgICAgICAgIGlmIChbJ3JlYWQnLCAnd3JpdGUnLCAnYWRkJywgJ3JlbW92ZSddLmluZGV4T2YobmFtZSkgPj0gMCkge1xuICAgICAgICAgICAgcmV0dXJuICguLi5hcmdzKSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiBCbHVlYmlyZC5kZWxheSgyMDApXG4gICAgICAgICAgICAgIC50aGVuKCgpID0+IHRhcmdldFtuYW1lXSguLi5hcmdzKSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0W25hbWVdO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgICBjb25zdCBkZWxheWVkTWVtc3RvcmUgPSBuZXcgUHJveHkobmV3IE1lbW9yeVN0b3JhZ2UoeyB0ZXJtaW5hbDogdHJ1ZSB9KSwgRGVsYXlQcm94eSk7XG4gICAgICBjb25zdCBjb2xkTWVtc3RvcmUgPSBuZXcgTWVtb3J5U3RvcmFnZSgpO1xuICAgICAgY29uc3Qgb3RoZXJQbHVtcCA9IG5ldyBQbHVtcCh7XG4gICAgICAgIHN0b3JhZ2U6IFtjb2xkTWVtc3RvcmUsIGRlbGF5ZWRNZW1zdG9yZV0sXG4gICAgICAgIHR5cGVzOiBbVGVzdFR5cGVdLFxuICAgICAgfSk7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnc2xvd3RhdG8nIH0sIG90aGVyUGx1bXApO1xuICAgICAgb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kZ2V0KCkpXG4gICAgICAudGhlbigodmFsKSA9PiB7XG4gICAgICAgIHJldHVybiBjb2xkTWVtc3RvcmUud3JpdGUoVGVzdFR5cGUsIHtcbiAgICAgICAgICBuYW1lOiAncG90YXRvJyxcbiAgICAgICAgICBpZDogdmFsLmlkLFxuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgbGV0IHBoYXNlID0gMDtcbiAgICAgICAgICBjb25zdCB0d28gPSBvdGhlclBsdW1wLmZpbmQoJ3Rlc3RzJywgdmFsLmlkKTtcbiAgICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSB0d28uJHN1YnNjcmliZSgodikgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2cocGhhc2UpO1xuICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh2LCBudWxsLCAyKSk7XG4gICAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGlmICh2Lm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHYpO1xuICAgICAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgICAgICAgICAgICAgICBwaGFzZSA9IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGlmICh2Lm5hbWUgIT09ICdwb3RhdG8nKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh2KTtcbiAgICAgICAgICAgICAgICAgIGV4cGVjdCh2KS50by5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3Nsb3d0YXRvJyk7XG4gICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgZG9uZShlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19
