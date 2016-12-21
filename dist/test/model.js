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
  it('should return promises to existing data', function () {
    var one = new _testType.TestType({ id: 1, name: 'potato' });
    expect(one.$get('name')).to.eventually.equal('potato');
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
    })).to.eventually.have.all.keys('name', 'id');
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
    var one = new _testType.TestType({ name: 'potato' }, plump);
    return one.$save().then(function () {
      return expect(plump.find('tests', one.$id).$get('name')).to.eventually.equal('potato');
    }).then(function () {
      return expect(plump.find('tests', one.$id).$get()).to.eventually.deep.equal({ name: 'potato', id: one.$id });
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUyIiwidGVybWluYWwiLCJwbHVtcCIsInN0b3JhZ2UiLCJ0eXBlcyIsInVzZSIsImV4cGVjdCIsImRlc2NyaWJlIiwiaXQiLCJvbmUiLCJpZCIsIm5hbWUiLCIkZ2V0IiwidG8iLCJldmVudHVhbGx5IiwiZXF1YWwiLCJNaW5pVGVzdCIsImZyb21KU09OIiwidG9KU09OIiwiZGVlcCIsIndyaXRlIiwidGhlbiIsInR3byIsImZpbmQiLCJub0lEIiwiJHNhdmUiLCJtIiwiaGF2ZSIsImFsbCIsImtleXMiLCIkaWQiLCIkZGVsZXRlIiwiYmUiLCJudWxsIiwiJHNldCIsIiRhZGQiLCJjaGlsZF9pZCIsInBhcmVudF9pZCIsIiRyZW1vdmUiLCJwZXJtIiwiJG1vZGlmeVJlbGF0aW9uc2hpcCJdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7OztBQUNBOzs7O0FBRUE7O0FBQ0E7Ozs7Ozs7OytlQU5BOztBQVFBO0FBQ0EsSUFBTUEsWUFBWSx5QkFBa0IsRUFBRUMsVUFBVSxJQUFaLEVBQWxCLENBQWxCOztBQUVBLElBQU1DLFFBQVEsaUJBQVU7QUFDdEJDLFdBQVMsQ0FBQ0gsU0FBRCxDQURhO0FBRXRCSSxTQUFPO0FBRmUsQ0FBVixDQUFkOztBQUtBLGVBQUtDLEdBQUw7QUFDQSxJQUFNQyxTQUFTLGVBQUtBLE1BQXBCOztBQUVBQyxTQUFTLE9BQVQsRUFBa0IsWUFBTTtBQUN0QkMsS0FBRyx5Q0FBSCxFQUE4QyxZQUFNO0FBQ2xELFFBQU1DLE1BQU0sdUJBQWEsRUFBRUMsSUFBSSxDQUFOLEVBQVNDLE1BQU0sUUFBZixFQUFiLENBQVo7QUFDQUwsV0FBT0csSUFBSUcsSUFBSixDQUFTLE1BQVQsQ0FBUCxFQUF5QkMsRUFBekIsQ0FBNEJDLFVBQTVCLENBQXVDQyxLQUF2QyxDQUE2QyxRQUE3QztBQUNELEdBSEQ7O0FBS0FQLEtBQUcsc0NBQUgsRUFBMkMsWUFBTTtBQUFBLFFBQ3pDUSxRQUR5QztBQUFBOztB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QkFBVCxDQUFQLEVBQ05DLEVBRE0sQ0FDSEMsVUFERyxDQUNRSyxJQURSLENBQ2FKLEtBRGIsQ0FDbUIsQ0FBQztBQUN6QnFCLGtCQUFVLEdBRGU7QUFFekJDLG1CQUFXNUIsSUFBSXFCLEdBRlU7QUFHekJTLGNBQU07QUFIbUIsT0FBRCxDQURuQixDQUFQO0FBTUQsS0FuQk0sQ0FBUDtBQW9CRCxHQXRCRDtBQXVCRCxDQXZIRCIsImZpbGUiOiJ0ZXN0L21vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlLCBtb2NoYSovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuXG5pbXBvcnQgeyBQbHVtcCwgTW9kZWwsIE1lbW9yeVN0b3JhZ2UgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgeyBUZXN0VHlwZSB9IGZyb20gJy4vdGVzdFR5cGUnO1xuXG4vLyBjb25zdCBtZW1zdG9yZTEgPSBuZXcgTWVtb3J5U3RvcmFnZSgpO1xuY29uc3QgbWVtc3RvcmUyID0gbmV3IE1lbW9yeVN0b3JhZ2UoeyB0ZXJtaW5hbDogdHJ1ZSB9KTtcblxuY29uc3QgcGx1bXAgPSBuZXcgUGx1bXAoe1xuICBzdG9yYWdlOiBbbWVtc3RvcmUyXSxcbiAgdHlwZXM6IFtUZXN0VHlwZV0sXG59KTtcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbmRlc2NyaWJlKCdtb2RlbCcsICgpID0+IHtcbiAgaXQoJ3Nob3VsZCByZXR1cm4gcHJvbWlzZXMgdG8gZXhpc3RpbmcgZGF0YScsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBpZDogMSwgbmFtZTogJ3BvdGF0bycgfSk7XG4gICAgZXhwZWN0KG9uZS4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3BvdGF0bycpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIHByb3Blcmx5IHNlcmlhbGl6ZSBpdHMgc2NoZW1hJywgKCkgPT4ge1xuICAgIGNsYXNzIE1pbmlUZXN0IGV4dGVuZHMgTW9kZWwge31cbiAgICBNaW5pVGVzdC5mcm9tSlNPTihUZXN0VHlwZS50b0pTT04oKSk7XG4gICAgcmV0dXJuIGV4cGVjdChNaW5pVGVzdC50b0pTT04oKSkudG8uZGVlcC5lcXVhbChUZXN0VHlwZS50b0pTT04oKSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgbG9hZCBkYXRhIGZyb20gZGF0YXN0b3JlcycsICgpID0+IHtcbiAgICByZXR1cm4gbWVtc3RvcmUyLndyaXRlKFRlc3RUeXBlLCB7XG4gICAgICBpZDogMixcbiAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3QgdHdvID0gcGx1bXAuZmluZCgndGVzdHMnLCAyKTtcbiAgICAgIHJldHVybiBleHBlY3QodHdvLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncG90YXRvJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgY3JlYXRlIGFuIGlkIHdoZW4gb25lIGlzIHVuc2V0JywgKCkgPT4ge1xuICAgIGNvbnN0IG5vSUQgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgcmV0dXJuIGV4cGVjdChub0lELiRzYXZlKCkudGhlbigobSkgPT4gbS4kZ2V0KCkpKS50by5ldmVudHVhbGx5LmhhdmUuYWxsLmtleXMoJ25hbWUnLCAnaWQnKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBhbGxvdyBkYXRhIHRvIGJlIGRlbGV0ZWQnLCAoKSA9PiB7XG4gICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgIC50aGVuKCgpID0+IGV4cGVjdChwbHVtcC5maW5kKCd0ZXN0cycsIG9uZS4kaWQpLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncG90YXRvJykpXG4gICAgLnRoZW4oKCkgPT4gb25lLiRkZWxldGUoKSlcbiAgICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuYmUubnVsbCk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgYWxsb3cgZmllbGRzIHRvIGJlIGxvYWRlZCcsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgLnRoZW4oKCkgPT4gZXhwZWN0KHBsdW1wLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdwb3RhdG8nKSlcbiAgICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IG5hbWU6ICdwb3RhdG8nLCBpZDogb25lLiRpZCB9KSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgb3B0aW1pc3RpY2FsbHkgdXBkYXRlIG9uIGZpZWxkIHVwZGF0ZXMnLCAoKSA9PiB7XG4gICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgIC50aGVuKCgpID0+IG9uZS4kc2V0KHsgbmFtZTogJ3J1dGFiYWdhJyB9KSlcbiAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncnV0YWJhZ2EnKSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgc2hvdyBlbXB0eSBoYXNNYW55IGxpc3RzIGFzIFtdJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW10pKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBhZGQgaGFzTWFueSBlbGVtZW50cycsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIDEwMCkpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSlcbiAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW3tcbiAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgfV0pO1xuICAgIH0pO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIGFkZCBoYXNNYW55IGVsZW1lbnRzIGJ5IGNoaWxkIGZpZWxkJywgKCkgPT4ge1xuICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgeyBjaGlsZF9pZDogMTAwIH0pKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpXG4gICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFt7XG4gICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgIH1dKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCByZW1vdmUgaGFzTWFueSBlbGVtZW50cycsICgpID0+IHtcbiAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIDEwMCkpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSlcbiAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW3tcbiAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgfV0pO1xuICAgIH0pXG4gICAgLnRoZW4oKCkgPT4gb25lLiRyZW1vdmUoJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbXSkpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIGluY2x1ZGUgdmFsZW5jZSBpbiBoYXNNYW55IG9wZXJhdGlvbnMnLCAoKSA9PiB7XG4gICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2dyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7IHBlcm06IDEgfSkpXG4gICAgLnRoZW4oKCkgPT4gb25lLiRnZXQoJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbe1xuICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgIHBlcm06IDEsXG4gICAgICB9XSk7XG4gICAgfSlcbiAgICAudGhlbigoKSA9PiBvbmUuJG1vZGlmeVJlbGF0aW9uc2hpcCgndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7IHBlcm06IDIgfSkpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFt7XG4gICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgcGVybTogMixcbiAgICAgIH1dKTtcbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdfQ==
