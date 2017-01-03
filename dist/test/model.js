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
            console.log(phase + ': ' + JSON.stringify(v, null, 2));
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUyIiwidGVybWluYWwiLCJwbHVtcCIsInN0b3JhZ2UiLCJ0eXBlcyIsInVzZSIsImV4cGVjdCIsImRlc2NyaWJlIiwiaXQiLCJvbmUiLCJpZCIsIm5hbWUiLCIkZ2V0IiwidG8iLCJldmVudHVhbGx5IiwiZXF1YWwiLCJNaW5pVGVzdCIsImZyb21KU09OIiwidG9KU09OIiwiZGVlcCIsIndyaXRlIiwidGhlbiIsInR3byIsImZpbmQiLCJub0lEIiwiJHNhdmUiLCJtIiwiY29udGFpbiIsImtleXMiLCIkaWQiLCIkZGVsZXRlIiwiYmUiLCJudWxsIiwiYXNzaWduIiwiJHNldCIsIiRhZGQiLCJjaGlsZF9pZCIsInBhcmVudF9pZCIsIiRyZW1vdmUiLCJwZXJtIiwiJG1vZGlmeVJlbGF0aW9uc2hpcCIsImRvbmUiLCJwaGFzZSIsInN1YnNjcmlwdGlvbiIsIiRzdWJzY3JpYmUiLCJ2IiwiY29uc29sZSIsImxvZyIsIkpTT04iLCJzdHJpbmdpZnkiLCJoYXZlIiwicHJvcGVydHkiLCJ1bmRlZmluZWQiLCJjaGlsZHJlbiIsImxlbmd0aCIsInVuc3Vic2NyaWJlIiwiZXJyIl0sIm1hcHBpbmdzIjoiOztBQUVBOzs7O0FBQ0E7Ozs7QUFFQTs7QUFDQTs7Ozs7Ozs7K2VBTkE7O0FBUUE7QUFDQSxJQUFNQSxZQUFZLHlCQUFrQixFQUFFQyxVQUFVLElBQVosRUFBbEIsQ0FBbEI7O0FBRUEsSUFBTUMsUUFBUSxpQkFBVTtBQUN0QkMsV0FBUyxDQUFDSCxTQUFELENBRGE7QUFFdEJJLFNBQU87QUFGZSxDQUFWLENBQWQ7O0FBS0EsZUFBS0MsR0FBTDtBQUNBLElBQU1DLFNBQVMsZUFBS0EsTUFBcEI7O0FBRUFDLFNBQVMsT0FBVCxFQUFrQixZQUFNO0FBQ3RCQSxXQUFTLHFCQUFULEVBQWdDLFlBQU07QUFDcENDLE9BQUcseUNBQUgsRUFBOEMsWUFBTTtBQUNsRCxVQUFNQyxNQUFNLHVCQUFhLEVBQUVDLElB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IjoidGVzdC9tb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1lbnYgbm9kZSwgbW9jaGEqL1xuXG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcblxuaW1wb3J0IHsgUGx1bXAsIE1vZGVsLCBNZW1vcnlTdG9yYWdlIH0gZnJvbSAnLi4vaW5kZXgnO1xuaW1wb3J0IHsgVGVzdFR5cGUgfSBmcm9tICcuL3Rlc3RUeXBlJztcblxuLy8gY29uc3QgbWVtc3RvcmUxID0gbmV3IE1lbW9yeVN0b3JhZ2UoKTtcbmNvbnN0IG1lbXN0b3JlMiA9IG5ldyBNZW1vcnlTdG9yYWdlKHsgdGVybWluYWw6IHRydWUgfSk7XG5cbmNvbnN0IHBsdW1wID0gbmV3IFBsdW1wKHtcbiAgc3RvcmFnZTogW21lbXN0b3JlMl0sXG4gIHR5cGVzOiBbVGVzdFR5cGVdLFxufSk7XG5cbmNoYWkudXNlKGNoYWlBc1Byb21pc2VkKTtcbmNvbnN0IGV4cGVjdCA9IGNoYWkuZXhwZWN0O1xuXG5kZXNjcmliZSgnbW9kZWwnLCAoKSA9PiB7XG4gIGRlc2NyaWJlKCdiYXNpYyBmdW5jdGlvbmFsaXR5JywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcmV0dXJuIHByb21pc2VzIHRvIGV4aXN0aW5nIGRhdGEnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBpZDogMSwgbmFtZTogJ3BvdGF0bycgfSk7XG4gICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3BvdGF0bycpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBwcm9wZXJseSBzZXJpYWxpemUgaXRzIHNjaGVtYScsICgpID0+IHtcbiAgICAgIGNsYXNzIE1pbmlUZXN0IGV4dGVuZHMgTW9kZWwge31cbiAgICAgIE1pbmlUZXN0LmZyb21KU09OKFRlc3RUeXBlLnRvSlNPTigpKTtcbiAgICAgIHJldHVybiBleHBlY3QoTWluaVRlc3QudG9KU09OKCkpLnRvLmRlZXAuZXF1YWwoVGVzdFR5cGUudG9KU09OKCkpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBsb2FkIGRhdGEgZnJvbSBkYXRhc3RvcmVzJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIG1lbXN0b3JlMi53cml0ZShUZXN0VHlwZSwge1xuICAgICAgICBpZDogMixcbiAgICAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3QgdHdvID0gcGx1bXAuZmluZCgndGVzdHMnLCAyKTtcbiAgICAgICAgcmV0dXJuIGV4cGVjdCh0d28uJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdwb3RhdG8nKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgYW4gaWQgd2hlbiBvbmUgaXMgdW5zZXQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBub0lEID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIGV4cGVjdChub0lELiRzYXZlKCkudGhlbigobSkgPT4gbS4kZ2V0KCkpKS50by5ldmVudHVhbGx5LmNvbnRhaW4ua2V5cygnbmFtZScsICdpZCcpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhbGxvdyBkYXRhIHRvIGJlIGRlbGV0ZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChwbHVtcC5maW5kKCd0ZXN0cycsIG9uZS4kaWQpLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncG90YXRvJykpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGRlbGV0ZSgpKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KHBsdW1wLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgpKS50by5ldmVudHVhbGx5LmJlLm51bGwpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhbGxvdyBmaWVsZHMgdG8gYmUgbG9hZGVkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3AnIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KHBsdW1wLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdwJykpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoVGVzdFR5cGUuYXNzaWduKHsgbmFtZTogJ3AnLCBpZDogb25lLiRpZCB9KSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgb3B0aW1pc3RpY2FsbHkgdXBkYXRlIG9uIGZpZWxkIHVwZGF0ZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kc2V0KHsgbmFtZTogJ3J1dGFiYWdhJyB9KSlcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdydXRhYmFnYScpKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3JlbGF0aW9uc2hpcHMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBzaG93IGVtcHR5IGhhc01hbnkgbGlzdHMgYXMgW10nLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbXSkpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhZGQgaGFzTWFueSBlbGVtZW50cycsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIDEwMCkpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW3tcbiAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgfV0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFkZCBoYXNNYW55IGVsZW1lbnRzIGJ5IGNoaWxkIGZpZWxkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2Zyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgeyBjaGlsZF9pZDogMTAwIH0pKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFt7XG4gICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgIH1dKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZW1vdmUgaGFzTWFueSBlbGVtZW50cycsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIDEwMCkpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW3tcbiAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgfV0pO1xuICAgICAgfSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kcmVtb3ZlKCdjaGlsZHJlbicsIDEwMCkpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbXSkpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBpbmNsdWRlIHZhbGVuY2UgaW4gaGFzTWFueSBvcGVyYXRpb25zJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2dyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ3ZhbGVuY2VDaGlsZHJlbicsIDEwMCwgeyBwZXJtOiAxIH0pKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRnZXQoJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbe1xuICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICAgIHBlcm06IDEsXG4gICAgICAgIH1dKTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiBvbmUuJG1vZGlmeVJlbGF0aW9uc2hpcCgndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7IHBlcm06IDIgfSkpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFt7XG4gICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgICAgcGVybTogMixcbiAgICAgICAgfV0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdldmVudHMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBhbGxvdyBzdWJzY3JpcHRpb24gdG8gbW9kZWwgZGF0YScsIChkb25lKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICBsZXQgcGhhc2UgPSAwO1xuICAgICAgb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gb25lLiRzdWJzY3JpYmUoKHYpID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCR7cGhhc2V9OiAke0pTT04uc3RyaW5naWZ5KHYsIG51bGwsIDIpfWApO1xuICAgICAgICAgICAgaWYgKHBoYXNlID09PSAwKSB7XG4gICAgICAgICAgICAgIGlmICh2Lm5hbWUpIHtcbiAgICAgICAgICAgICAgICBwaGFzZSA9IDE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMSkge1xuICAgICAgICAgICAgICBleHBlY3QodikudG8uaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICAgICAgICAgICAgaWYgKHYuaWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHBoYXNlID0gMjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBoYXNlID09PSAyKSB7XG4gICAgICAgICAgICAgIGlmICh2Lm5hbWUgIT09ICdwb3RhdG8nKSB7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAnZ3JvdGF0bycpO1xuICAgICAgICAgICAgICAgIHBoYXNlID0gMztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBoYXNlID09PSAzKSB7XG4gICAgICAgICAgICAgIGlmICgodi5jaGlsZHJlbikgJiYgKHYuY2hpbGRyZW4ubGVuZ3RoID4gMCkpIHtcbiAgICAgICAgICAgICAgICBleHBlY3Qodi5jaGlsZHJlbikudG8uZGVlcC5lcXVhbChbe1xuICAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBkb25lKGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiBvbmUuJHNldCh7IG5hbWU6ICdncm90YXRvJyB9KSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIHsgY2hpbGRfaWQ6IDEwMCB9KSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=
