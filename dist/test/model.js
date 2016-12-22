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
      var subscription = one.$subscribe(function (v) {
        try {
          console.log(phase + ': ' + JSON.stringify(v, null, 2));
          if (phase === 0) {
            expect(v).to.have.property('name', 'potato');
            if (v.id !== undefined) {
              phase = 1;
            }
          }
          if (phase === 1) {
            if (v.name !== 'potato') {
              expect(v).to.have.property('name', 'grotato');
              phase = 2;
            }
          }
          if (phase === 2) {
            if (v.children) {
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
      one.$save().then(function () {
        return one.$set({ name: 'grotato' });
      }).then(function () {
        return one.$add('children', { child_id: 100 });
      });
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUyIiwidGVybWluYWwiLCJwbHVtcCIsInN0b3JhZ2UiLCJ0eXBlcyIsInVzZSIsImV4cGVjdCIsImRlc2NyaWJlIiwiaXQiLCJvbmUiLCJpZCIsIm5hbWUiLCIkZ2V0IiwidG8iLCJldmVudHVhbGx5IiwiZXF1YWwiLCJNaW5pVGVzdCIsImZyb21KU09OIiwidG9KU09OIiwiZGVlcCIsIndyaXRlIiwidGhlbiIsInR3byIsImZpbmQiLCJub0lEIiwiJHNhdmUiLCJtIiwiY29udGFpbiIsImtleXMiLCIkaWQiLCIkZGVsZXRlIiwiYmUiLCJudWxsIiwiYXNzaWduIiwiJHNldCIsIiRhZGQiLCJjaGlsZF9pZCIsInBhcmVudF9pZCIsIiRyZW1vdmUiLCJwZXJtIiwiJG1vZGlmeVJlbGF0aW9uc2hpcCIsImRvbmUiLCJwaGFzZSIsInN1YnNjcmlwdGlvbiIsIiRzdWJzY3JpYmUiLCJ2IiwiY29uc29sZSIsImxvZyIsIkpTT04iLCJzdHJpbmdpZnkiLCJoYXZlIiwicHJvcGVydHkiLCJ1bmRlZmluZWQiLCJjaGlsZHJlbiIsInVuc3Vic2NyaWJlIiwiZXJyIl0sIm1hcHBpbmdzIjoiOztBQUVBOzs7O0FBQ0E7Ozs7QUFFQTs7QUFDQTs7Ozs7Ozs7K2VBTkE7O0FBUUE7QUFDQSxJQUFNQSxZQUFZLHlCQUFrQixFQUFFQyxVQUFVLElBQVosRUFBbEIsQ0FBbEI7O0FBRUEsSUFBTUMsUUFBUSxpQkFBVTtBQUN0QkMsV0FBUyxDQUFDSCxTQUFELENBRGE7QUFFdEJJLFNBQU87QUFGZSxDQUFWLENBQWQ7O0FBS0EsZUFBS0MsR0FBTDtBQUNBLElBQU1DLFNBQVMsZUFBS0EsTUFBcEI7O0FBRUFDLFNBQVMsT0FBVCxFQUFrQixZQUFNO0FBQ3RCQSxXQUFTLHFCQUFULEVBQWdDLFlBQU07QUFDcENDLE9BQUcseUNBQUgsRUFBOEMsWUFBTTtBQUNsRCxVQUFNQyxNQUFNLHVCQUFhLEVBQUVDLElBQUksQ0FBTixF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O0FBQ0Q7QUFDRjtBQUNELGNBQUlBLFVBQVUsQ0FBZCxFQUFpQjtBQUNmLGdCQUFJRyxFQUFFbEMsSUFBRixLQUFXLFFBQWYsRUFBeUI7QUFDdkJMLHFCQUFPdUMsQ0FBUCxFQUFVaEMsRUFBVixDQUFhcUMsSUFBYixDQUFrQkMsUUFBbEIsQ0FBMkIsTUFBM0IsRUFBbUMsU0FBbkM7QUFDQVQsc0JBQVEsQ0FBUjtBQUNEO0FBQ0Y7QUFDRCxjQUFJQSxVQUFVLENBQWQsRUFBaUI7QUFDZixnQkFBSUcsRUFBRVEsUUFBTixFQUFnQjtBQUNkL0MscUJBQU91QyxFQUFFUSxRQUFULEVBQW1CeEMsRUFBbkIsQ0FBc0JNLElBQXRCLENBQTJCSixLQUEzQixDQUFpQyxDQUFDO0FBQ2hDcUIsMEJBQVUsR0FEc0I7QUFFaENDLDJCQUFXNUIsSUFBSW9CO0FBRmlCLGVBQUQsQ0FBakM7QUFJQWMsMkJBQWFXLFdBQWI7QUFDQWI7QUFDRDtBQUNGO0FBQ0YsU0F4QkQsQ0F3QkUsT0FBT2MsR0FBUCxFQUFZO0FBQ1pkLGVBQUtjLEdBQUw7QUFDRDtBQUNGLE9BNUJvQixDQUFyQjtBQTZCQTlDLFVBQUlnQixLQUFKLEdBQ0NKLElBREQsQ0FDTTtBQUFBLGVBQU1aLElBQUl5QixJQUFKLENBQVMsRUFBRXZCLE1BQU0sU0FBUixFQUFULENBQU47QUFBQSxPQUROLEVBRUNVLElBRkQsQ0FFTTtBQUFBLGVBQU1aLElBQUkwQixJQUFKLENBQVMsVUFBVCxFQUFxQixFQUFFQyxVQUFVLEdBQVosRUFBckIsQ0FBTjtBQUFBLE9BRk47QUFHRCxLQW5DRDtBQW9DRCxHQXJDRDtBQXNDRCxDQWxLRCIsImZpbGUiOiJ0ZXN0L21vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlLCBtb2NoYSovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuXG5pbXBvcnQgeyBQbHVtcCwgTW9kZWwsIE1lbW9yeVN0b3JhZ2UgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgeyBUZXN0VHlwZSB9IGZyb20gJy4vdGVzdFR5cGUnO1xuXG4vLyBjb25zdCBtZW1zdG9yZTEgPSBuZXcgTWVtb3J5U3RvcmFnZSgpO1xuY29uc3QgbWVtc3RvcmUyID0gbmV3IE1lbW9yeVN0b3JhZ2UoeyB0ZXJtaW5hbDogdHJ1ZSB9KTtcblxuY29uc3QgcGx1bXAgPSBuZXcgUGx1bXAoe1xuICBzdG9yYWdlOiBbbWVtc3RvcmUyXSxcbiAgdHlwZXM6IFtUZXN0VHlwZV0sXG59KTtcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbmRlc2NyaWJlKCdtb2RlbCcsICgpID0+IHtcbiAgZGVzY3JpYmUoJ2Jhc2ljIGZ1bmN0aW9uYWxpdHknLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gcHJvbWlzZXMgdG8gZXhpc3RpbmcgZGF0YScsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IGlkOiAxLCBuYW1lOiAncG90YXRvJyB9KTtcbiAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncG90YXRvJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHByb3Blcmx5IHNlcmlhbGl6ZSBpdHMgc2NoZW1hJywgKCkgPT4ge1xuICAgICAgY2xhc3MgTWluaVRlc3QgZXh0ZW5kcyBNb2RlbCB7fVxuICAgICAgTWluaVRlc3QuZnJvbUpTT04oVGVzdFR5cGUudG9KU09OKCkpO1xuICAgICAgcmV0dXJuIGV4cGVjdChNaW5pVGVzdC50b0pTT04oKSkudG8uZGVlcC5lcXVhbChUZXN0VHlwZS50b0pTT04oKSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGxvYWQgZGF0YSBmcm9tIGRhdGFzdG9yZXMnLCAoKSA9PiB7XG4gICAgICByZXR1cm4gbWVtc3RvcmUyLndyaXRlKFRlc3RUeXBlLCB7XG4gICAgICAgIGlkOiAyLFxuICAgICAgICBuYW1lOiAncG90YXRvJyxcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCB0d28gPSBwbHVtcC5maW5kKCd0ZXN0cycsIDIpO1xuICAgICAgICByZXR1cm4gZXhwZWN0KHR3by4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3BvdGF0bycpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGNyZWF0ZSBhbiBpZCB3aGVuIG9uZSBpcyB1bnNldCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG5vSUQgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gZXhwZWN0KG5vSUQuJHNhdmUoKS50aGVuKChtKSA9PiBtLiRnZXQoKSkpLnRvLmV2ZW50dWFsbHkuY29udGFpbi5rZXlzKCduYW1lJywgJ2lkJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFsbG93IGRhdGEgdG8gYmUgZGVsZXRlZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KHBsdW1wLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdwb3RhdG8nKSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kZGVsZXRlKCkpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuYmUubnVsbCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFsbG93IGZpZWxkcyB0byBiZSBsb2FkZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncCcgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3AnKSlcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChwbHVtcC5maW5kKCd0ZXN0cycsIG9uZS4kaWQpLiRnZXQoKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFRlc3RUeXBlLmFzc2lnbih7IG5hbWU6ICdwJywgaWQ6IG9uZS4kaWQgfSkpKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgb3B0aW1pc3RpY2FsbHkgdXBkYXRlIG9uIGZpZWxkIHVwZGF0ZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kc2V0KHsgbmFtZTogJ3J1dGFiYWdhJyB9KSlcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdydXRhYmFnYScpKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3JlbGF0aW9uc2hpcHMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBzaG93IGVtcHR5IGhhc01hbnkgbGlzdHMgYXMgW10nLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbXSkpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhZGQgaGFzTWFueSBlbGVtZW50cycsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIDEwMCkpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW3tcbiAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgfV0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFkZCBoYXNNYW55IGVsZW1lbnRzIGJ5IGNoaWxkIGZpZWxkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2Zyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgeyBjaGlsZF9pZDogMTAwIH0pKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFt7XG4gICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgIH1dKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZW1vdmUgaGFzTWFueSBlbGVtZW50cycsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIDEwMCkpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW3tcbiAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgfV0pO1xuICAgICAgfSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kcmVtb3ZlKCdjaGlsZHJlbicsIDEwMCkpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbXSkpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBpbmNsdWRlIHZhbGVuY2UgaW4gaGFzTWFueSBvcGVyYXRpb25zJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2dyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ3ZhbGVuY2VDaGlsZHJlbicsIDEwMCwgeyBwZXJtOiAxIH0pKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRnZXQoJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbe1xuICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICAgIHBlcm06IDEsXG4gICAgICAgIH1dKTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiBvbmUuJG1vZGlmeVJlbGF0aW9uc2hpcCgndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7IHBlcm06IDIgfSkpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFt7XG4gICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgICAgcGVybTogMixcbiAgICAgICAgfV0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdldmVudHMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBhbGxvdyBzdWJzY3JpcHRpb24gdG8gbW9kZWwgZGF0YScsIChkb25lKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICBsZXQgcGhhc2UgPSAwO1xuICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gb25lLiRzdWJzY3JpYmUoKHYpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgJHtwaGFzZX06ICR7SlNPTi5zdHJpbmdpZnkodiwgbnVsbCwgMil9YCk7XG4gICAgICAgICAgaWYgKHBoYXNlID09PSAwKSB7XG4gICAgICAgICAgICBleHBlY3QodikudG8uaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICAgICAgICAgIGlmICh2LmlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgcGhhc2UgPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocGhhc2UgPT09IDEpIHtcbiAgICAgICAgICAgIGlmICh2Lm5hbWUgIT09ICdwb3RhdG8nKSB7XG4gICAgICAgICAgICAgIGV4cGVjdCh2KS50by5oYXZlLnByb3BlcnR5KCduYW1lJywgJ2dyb3RhdG8nKTtcbiAgICAgICAgICAgICAgcGhhc2UgPSAyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocGhhc2UgPT09IDIpIHtcbiAgICAgICAgICAgIGlmICh2LmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgIGV4cGVjdCh2LmNoaWxkcmVuKS50by5kZWVwLmVxdWFsKFt7XG4gICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGRvbmUoZXJyKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRzZXQoeyBuYW1lOiAnZ3JvdGF0bycgfSkpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCB7IGNoaWxkX2lkOiAxMDAgfSkpO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19
