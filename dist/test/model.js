'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _index = require('../index');

var _testType = require('./testType');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* eslint-env node, mocha*/

// const memstore1 = new MemoryStorage();
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
  });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUyIiwidGVybWluYWwiLCJwbHVtcCIsInN0b3JhZ2UiLCJ0eXBlcyIsInVzZSIsImV4cGVjdCIsImRlc2NyaWJlIiwiaXQiLCJvbmUiLCJpZCIsIm5hbWUiLCIkZ2V0IiwidG8iLCJldmVudHVhbGx5IiwiZXF1YWwiLCJNaW5pVGVzdCIsImZyb21KU09OIiwidG9KU09OIiwiZGVlcCIsIndyaXRlIiwidGhlbiIsInR3byIsImZpbmQiLCJub0lEIiwiJHNhdmUiLCJtIiwiY29udGFpbiIsImtleXMiLCIkaWQiLCIkZGVsZXRlIiwiYmUiLCJudWxsIiwiYXNzaWduIiwiJHNldCIsIiRhZGQiLCJjaGlsZF9pZCIsInBhcmVudF9pZCIsIiRyZW1vdmUiLCJwZXJtIiwiJG1vZGlmeVJlbGF0aW9uc2hpcCIsImRvbmUiLCJwaGFzZSIsInN1YnNjcmlwdGlvbiIsIiRzdWJzY3JpYmUiLCJ2IiwiaGF2ZSIsInByb3BlcnR5IiwidW5kZWZpbmVkIiwiY2hpbGRyZW4iLCJsZW5ndGgiLCJ1bnN1YnNjcmliZSIsImVyciJdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7OztBQUNBOzs7O0FBRUE7O0FBQ0E7Ozs7Ozs7OytlQU5BOztBQVFBO0FBQ0EsSUFBTUEsWUFBWSx5QkFBa0IsRUFBRUMsVUFBVSxJQUFaLEVBQWxCLENBQWxCOztBQUVBLElBQU1DLFFBQVEsaUJBQVU7QUFDdEJDLFdBQVMsQ0FBQ0gsU0FBRCxDQURhO0FBRXRCSSxTQUFPO0FBRmUsQ0FBVixDQUFkOztBQUtBLGVBQUtDLEdBQUw7QUFDQSxJQUFNQyxTQUFTLGVBQUtBLE1BQXBCOztBQUVBQyxTQUFTLE9BQVQsRUFBa0IsWUFBTTtBQUN0QkEsV0FBUyxxQkFBVCxFQUFnQyxZQUFNO0FBQ3BDQyxPQUFHLHlDQUFILEVBQThDLFlBQU07QUFDbEQsVUFBTUMsTUFBTSx1QkFBYSxFQUFFQyxJQUFJLENBQU4sRUFBU0MsTUFBTSxRQUFmLEVBQWIsQ0FBWjtB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Q3RCTix3QkFBUSxDQUFSO0FBQ0Q7QUFDRjtBQUNELGdCQUFJQSxVQUFVLENBQWQsRUFBaUI7QUFDZixrQkFBSUcsRUFBRWxDLElBQUYsS0FBVyxRQUFmLEVBQXlCO0FBQ3ZCTCx1QkFBT3VDLENBQVAsRUFBVWhDLEVBQVYsQ0FBYWlDLElBQWIsQ0FBa0JDLFFBQWxCLENBQTJCLE1BQTNCLEVBQW1DLFNBQW5DO0FBQ0FMLHdCQUFRLENBQVI7QUFDRDtBQUNGO0FBQ0QsZ0JBQUlBLFVBQVUsQ0FBZCxFQUFpQjtBQUNmLGtCQUFLRyxFQUFFSSxRQUFILElBQWlCSixFQUFFSSxRQUFGLENBQVdDLE1BQVgsR0FBb0IsQ0FBekMsRUFBNkM7QUFDM0M1Qyx1QkFBT3VDLEVBQUVJLFFBQVQsRUFBbUJwQyxFQUFuQixDQUFzQk0sSUFBdEIsQ0FBMkJKLEtBQTNCLENBQWlDLENBQUM7QUFDaENxQiw0QkFBVSxHQURzQjtBQUVoQ0MsNkJBQVc1QixJQUFJb0I7QUFGaUIsaUJBQUQsQ0FBakM7QUFJQWMsNkJBQWFRLFdBQWI7QUFDQVY7QUFDRDtBQUNGO0FBQ0YsV0E3QkQsQ0E2QkUsT0FBT1csR0FBUCxFQUFZO0FBQ1pYLGlCQUFLVyxHQUFMO0FBQ0Q7QUFDRixTQWpDb0IsQ0FBckI7QUFrQ0QsT0FwQ0QsRUFxQ0MvQixJQXJDRCxDQXFDTTtBQUFBLGVBQU1aLElBQUl5QixJQUFKLENBQVMsRUFBRXZCLE1BQU0sU0FBUixFQUFULENBQU47QUFBQSxPQXJDTixFQXNDQ1UsSUF0Q0QsQ0FzQ007QUFBQSxlQUFNWixJQUFJMEIsSUFBSixDQUFTLFVBQVQsRUFBcUIsRUFBRUMsVUFBVSxHQUFaLEVBQXJCLENBQU47QUFBQSxPQXRDTjtBQXVDRCxLQTFDRDtBQTJDRCxHQTVDRDtBQTZDRCxDQTVLRCIsImZpbGUiOiJ0ZXN0L21vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlLCBtb2NoYSovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuXG5pbXBvcnQgeyBQbHVtcCwgTW9kZWwsIE1lbW9yeVN0b3JhZ2UgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgeyBUZXN0VHlwZSB9IGZyb20gJy4vdGVzdFR5cGUnO1xuXG4vLyBjb25zdCBtZW1zdG9yZTEgPSBuZXcgTWVtb3J5U3RvcmFnZSgpO1xuY29uc3QgbWVtc3RvcmUyID0gbmV3IE1lbW9yeVN0b3JhZ2UoeyB0ZXJtaW5hbDogdHJ1ZSB9KTtcblxuY29uc3QgcGx1bXAgPSBuZXcgUGx1bXAoe1xuICBzdG9yYWdlOiBbbWVtc3RvcmUyXSxcbiAgdHlwZXM6IFtUZXN0VHlwZV0sXG59KTtcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbmRlc2NyaWJlKCdtb2RlbCcsICgpID0+IHtcbiAgZGVzY3JpYmUoJ2Jhc2ljIGZ1bmN0aW9uYWxpdHknLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gcHJvbWlzZXMgdG8gZXhpc3RpbmcgZGF0YScsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IGlkOiAxLCBuYW1lOiAncG90YXRvJyB9KTtcbiAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncG90YXRvJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHByb3Blcmx5IHNlcmlhbGl6ZSBpdHMgc2NoZW1hJywgKCkgPT4ge1xuICAgICAgY2xhc3MgTWluaVRlc3QgZXh0ZW5kcyBNb2RlbCB7fVxuICAgICAgTWluaVRlc3QuZnJvbUpTT04oVGVzdFR5cGUudG9KU09OKCkpO1xuICAgICAgcmV0dXJuIGV4cGVjdChNaW5pVGVzdC50b0pTT04oKSkudG8uZGVlcC5lcXVhbChUZXN0VHlwZS50b0pTT04oKSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGxvYWQgZGF0YSBmcm9tIGRhdGFzdG9yZXMnLCAoKSA9PiB7XG4gICAgICByZXR1cm4gbWVtc3RvcmUyLndyaXRlKFRlc3RUeXBlLCB7XG4gICAgICAgIGlkOiAyLFxuICAgICAgICBuYW1lOiAncG90YXRvJyxcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCB0d28gPSBwbHVtcC5maW5kKCd0ZXN0cycsIDIpO1xuICAgICAgICByZXR1cm4gZXhwZWN0KHR3by4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3BvdGF0bycpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGNyZWF0ZSBhbiBpZCB3aGVuIG9uZSBpcyB1bnNldCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG5vSUQgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gZXhwZWN0KG5vSUQuJHNhdmUoKS50aGVuKChtKSA9PiBtLiRnZXQoKSkpLnRvLmV2ZW50dWFsbHkuY29udGFpbi5rZXlzKCduYW1lJywgJ2lkJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFsbG93IGRhdGEgdG8gYmUgZGVsZXRlZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KHBsdW1wLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdwb3RhdG8nKSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kZGVsZXRlKCkpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuYmUubnVsbCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFsbG93IGZpZWxkcyB0byBiZSBsb2FkZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncCcgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3AnKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChwbHVtcC5maW5kKCd0ZXN0cycsIG9uZS4kaWQpLiRnZXQoKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChUZXN0VHlwZS5hc3NpZ24oeyBuYW1lOiAncCcsIGlkOiBvbmUuJGlkIH0pKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBvcHRpbWlzdGljYWxseSB1cGRhdGUgb24gZmllbGQgdXBkYXRlcycsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRzZXQoeyBuYW1lOiAncnV0YWJhZ2EnIH0pKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3J1dGFiYWdhJykpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgncmVsYXRpb25zaGlwcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHNob3cgZW1wdHkgaGFzTWFueSBsaXN0cyBhcyBbXScsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFtdKSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFkZCBoYXNNYW55IGVsZW1lbnRzJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2Zyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbe1xuICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICB9XSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWRkIGhhc01hbnkgZWxlbWVudHMgYnkgY2hpbGQgZmllbGQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCB7IGNoaWxkX2lkOiAxMDAgfSkpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW3tcbiAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgfV0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlbW92ZSBoYXNNYW55IGVsZW1lbnRzJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2Zyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbe1xuICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICB9XSk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRyZW1vdmUoJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFtdKSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUgdmFsZW5jZSBpbiBoYXNNYW55IG9wZXJhdGlvbnMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZ3JvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7IHBlcm06IDEgfSkpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGdldCgndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFt7XG4gICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgICAgcGVybTogMSxcbiAgICAgICAgfV0pO1xuICAgICAgfSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kbW9kaWZ5UmVsYXRpb25zaGlwKCd2YWxlbmNlQ2hpbGRyZW4nLCAxMDAsIHsgcGVybTogMiB9KSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW3tcbiAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgICBwZXJtOiAyLFxuICAgICAgICB9XSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2V2ZW50cycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGFsbG93IHN1YnNjcmlwdGlvbiB0byBtb2RlbCBkYXRhJywgKGRvbmUpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIGxldCBwaGFzZSA9IDA7XG4gICAgICBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBvbmUuJHN1YnNjcmliZSgodikgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtwaGFzZX06ICR7SlNPTi5zdHJpbmdpZnkodiwgbnVsbCwgMil9YCk7XG4gICAgICAgICAgICBpZiAocGhhc2UgPT09IDApIHtcbiAgICAgICAgICAgICAgaWYgKHYubmFtZSkge1xuICAgICAgICAgICAgICAgIHBoYXNlID0gMTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBoYXNlID09PSAxKSB7XG4gICAgICAgICAgICAgIGV4cGVjdCh2KS50by5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgICAgICAgICAgICBpZiAodi5pZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcGhhc2UgPSAyO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGhhc2UgPT09IDIpIHtcbiAgICAgICAgICAgICAgaWYgKHYubmFtZSAhPT0gJ3BvdGF0bycpIHtcbiAgICAgICAgICAgICAgICBleHBlY3QodikudG8uaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdncm90YXRvJyk7XG4gICAgICAgICAgICAgICAgcGhhc2UgPSAzO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGhhc2UgPT09IDMpIHtcbiAgICAgICAgICAgICAgaWYgKCh2LmNoaWxkcmVuKSAmJiAodi5jaGlsZHJlbi5sZW5ndGggPiAwKSkge1xuICAgICAgICAgICAgICAgIGV4cGVjdCh2LmNoaWxkcmVuKS50by5kZWVwLmVxdWFsKFt7XG4gICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICBkb25lKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGRvbmUoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kc2V0KHsgbmFtZTogJ2dyb3RhdG8nIH0pKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgeyBjaGlsZF9pZDogMTAwIH0pKTtcbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdfQ==
