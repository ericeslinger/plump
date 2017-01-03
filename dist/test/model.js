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

var memstore1 = new _index.MemoryStorage();
var memstore2 = new _index.MemoryStorage({ terminal: true });

var DelayProxy = {
  get: function get(target, name) {
    if (typeof target[name] === 'function') {
      return function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return new _bluebird2.default(function (resolve) {
          setTimeout(resolve, 200);
        }).then(function () {
          return target[name].apply(target, args);
        });
      };
    } else {
      return target[name];
    }
  }
};

var delayedMemstore = new Proxy(memstore2, DelayProxy);
var plump = new _index.Plump({
  storage: [memstore1, memstore2],
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUxIiwibWVtc3RvcmUyIiwidGVybWluYWwiLCJEZWxheVByb3h5IiwiZ2V0IiwidGFyZ2V0IiwibmFtZSIsImFyZ3MiLCJyZXNvbHZlIiwic2V0VGltZW91dCIsInRoZW4iLCJkZWxheWVkTWVtc3RvcmUiLCJQcm94eSIsInBsdW1wIiwic3RvcmFnZSIsInR5cGVzIiwidXNlIiwiZXhwZWN0IiwiZGVzY3JpYmUiLCJpdCIsIm9uZSIsImlkIiwiJGdldCIsInRvIiwiZXZlbnR1YWxseSIsImVxdWFsIiwiTWluaVRlc3QiLCJmcm9tSlNPTiIsInRvSlNPTiIsImRlZXAiLCJ3cml0ZSIsInR3byIsImZpbmQiLCJub0lEIiwiJHNhdmUiLCJtIiwiY29udGFpbiIsImtleXMiLCIkaWQiLCIkZGVsZXRlIiwiYmUiLCJudWxsIiwiYXNzaWduIiwiJHNldCIsIiRhZGQiLCJjaGlsZF9pZCIsInBhcmVudF9pZCIsIiRyZW1vdmUiLCJwZXJtIiwiJG1vZGlmeVJlbGF0aW9uc2hpcCIsImRvbmUiLCJwaGFzZSIsInN1YnNjcmlwdGlvbiIsIiRzdWJzY3JpYmUiLCJ2IiwiaGF2ZSIsInByb3BlcnR5IiwidW5kZWZpbmVkIiwiY2hpbGRyZW4iLCJsZW5ndGgiLCJ1bnN1YnNjcmliZSIsImVyciJdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQTs7QUFDQTs7Ozs7Ozs7K2VBUEE7O0FBU0EsSUFBTUEsWUFBWSwwQkFBbEI7QUFDQSxJQUFNQyxZQUFZLHlCQUFrQixFQUFFQyxVQUFVLElBQVosRUFBbEIsQ0FBbEI7O0FBRUEsSUFBTUMsYUFBYTtBQUNqQkMsT0FBSyxhQUFTQyxNQUFULEVBQWlCQyxJQUFqQixFQUF1QjtBQUMxQixRQUFJLE9BQU9ELE9BQU9DLElBQVAsQ0FBUCxLQUF3QixVQUE1QixFQUF3QztBQUN0QyxhQUFPLFlBQWE7QUFBQSwwQ0FBVEMsSUFBUztBQUFUQSxjQUFT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SSxRQUFULEVBQW1CbkMsRUFBbkIsQ0FBc0JNLElBQXRCLENBQTJCSixLQUEzQixDQUFpQyxDQUFDO0FBQ2hDb0IsNEJBQVUsR0FEc0I7QUFFaENDLDZCQUFXMUIsSUFBSWtCO0FBRmlCLGlCQUFELENBQWpDO0FBSUFjLDZCQUFhUSxXQUFiO0FBQ0FWO0FBQ0Q7QUFDRjtBQUNGLFdBN0JELENBNkJFLE9BQU9XLEdBQVAsRUFBWTtBQUNaWCxpQkFBS1csR0FBTDtBQUNEO0FBQ0YsU0FqQ29CLENBQXJCO0FBa0NELE9BcENELEVBcUNDbkQsSUFyQ0QsQ0FxQ007QUFBQSxlQUFNVSxJQUFJdUIsSUFBSixDQUFTLEVBQUVyQyxNQUFNLFNBQVIsRUFBVCxDQUFOO0FBQUEsT0FyQ04sRUFzQ0NJLElBdENELENBc0NNO0FBQUEsZUFBTVUsSUFBSXdCLElBQUosQ0FBUyxVQUFULEVBQXFCLEVBQUVDLFVBQVUsR0FBWixFQUFyQixDQUFOO0FBQUEsT0F0Q047QUF1Q0QsS0ExQ0Q7QUEyQ0QsR0E1Q0Q7QUE2Q0QsQ0E1S0QiLCJmaWxlIjoidGVzdC9tb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1lbnYgbm9kZSwgbW9jaGEqL1xuXG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5cbmltcG9ydCB7IFBsdW1wLCBNb2RlbCwgTWVtb3J5U3RvcmFnZSB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7IFRlc3RUeXBlIH0gZnJvbSAnLi90ZXN0VHlwZSc7XG5cbmNvbnN0IG1lbXN0b3JlMSA9IG5ldyBNZW1vcnlTdG9yYWdlKCk7XG5jb25zdCBtZW1zdG9yZTIgPSBuZXcgTWVtb3J5U3RvcmFnZSh7IHRlcm1pbmFsOiB0cnVlIH0pO1xuXG5jb25zdCBEZWxheVByb3h5ID0ge1xuICBnZXQ6IGZ1bmN0aW9uKHRhcmdldCwgbmFtZSkge1xuICAgIGlmICh0eXBlb2YgdGFyZ2V0W25hbWVdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBCbHVlYmlyZCgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgIHNldFRpbWVvdXQocmVzb2x2ZSwgMjAwKTtcbiAgICAgICAgfSkudGhlbigoKSA9PiB0YXJnZXRbbmFtZV0oLi4uYXJncykpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRhcmdldFtuYW1lXTtcbiAgICB9XG4gIH0sXG59O1xuXG5jb25zdCBkZWxheWVkTWVtc3RvcmUgPSBuZXcgUHJveHkobWVtc3RvcmUyLCBEZWxheVByb3h5KTtcbmNvbnN0IHBsdW1wID0gbmV3IFBsdW1wKHtcbiAgc3RvcmFnZTogW21lbXN0b3JlMSwgbWVtc3RvcmUyXSxcbiAgdHlwZXM6IFtUZXN0VHlwZV0sXG59KTtcblxuXG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5jb25zdCBleHBlY3QgPSBjaGFpLmV4cGVjdDtcblxuZGVzY3JpYmUoJ21vZGVsJywgKCkgPT4ge1xuICBkZXNjcmliZSgnYmFzaWMgZnVuY3Rpb25hbGl0eScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHJldHVybiBwcm9taXNlcyB0byBleGlzdGluZyBkYXRhJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgaWQ6IDEsIG5hbWU6ICdwb3RhdG8nIH0pO1xuICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnbmFtZScpKS50by5ldmVudHVhbGx5LmVxdWFsKCdwb3RhdG8nKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcHJvcGVybHkgc2VyaWFsaXplIGl0cyBzY2hlbWEnLCAoKSA9PiB7XG4gICAgICBjbGFzcyBNaW5pVGVzdCBleHRlbmRzIE1vZGVsIHt9XG4gICAgICBNaW5pVGVzdC5mcm9tSlNPTihUZXN0VHlwZS50b0pTT04oKSk7XG4gICAgICByZXR1cm4gZXhwZWN0KE1pbmlUZXN0LnRvSlNPTigpKS50by5kZWVwLmVxdWFsKFRlc3RUeXBlLnRvSlNPTigpKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgbG9hZCBkYXRhIGZyb20gZGF0YXN0b3JlcycsICgpID0+IHtcbiAgICAgIHJldHVybiBtZW1zdG9yZTIud3JpdGUoVGVzdFR5cGUsIHtcbiAgICAgICAgaWQ6IDIsXG4gICAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IHR3byA9IHBsdW1wLmZpbmQoJ3Rlc3RzJywgMik7XG4gICAgICAgIHJldHVybiBleHBlY3QodHdvLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncG90YXRvJyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY3JlYXRlIGFuIGlkIHdoZW4gb25lIGlzIHVuc2V0JywgKCkgPT4ge1xuICAgICAgY29uc3Qgbm9JRCA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBleHBlY3Qobm9JRC4kc2F2ZSgpLnRoZW4oKG0pID0+IG0uJGdldCgpKSkudG8uZXZlbnR1YWxseS5jb250YWluLmtleXMoJ25hbWUnLCAnaWQnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWxsb3cgZGF0YSB0byBiZSBkZWxldGVkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCduYW1lJykpLnRvLmV2ZW50dWFsbHkuZXF1YWwoJ3BvdGF0bycpKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRkZWxldGUoKSlcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChwbHVtcC5maW5kKCd0ZXN0cycsIG9uZS4kaWQpLiRnZXQoKSkudG8uZXZlbnR1YWxseS5iZS5udWxsKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWxsb3cgZmllbGRzIHRvIGJlIGxvYWRlZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IGV4cGVjdChwbHVtcC5maW5kKCd0ZXN0cycsIG9uZS4kaWQpLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncCcpKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KHBsdW1wLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFRlc3RUeXBlLmFzc2lnbih7IG5hbWU6ICdwJywgaWQ6IG9uZS4kaWQgfSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIG9wdGltaXN0aWNhbGx5IHVwZGF0ZSBvbiBmaWVsZCB1cGRhdGVzJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJHNldCh7IG5hbWU6ICdydXRhYmFnYScgfSkpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ25hbWUnKSkudG8uZXZlbnR1YWxseS5lcXVhbCgncnV0YWJhZ2EnKSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdyZWxhdGlvbnNoaXBzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgc2hvdyBlbXB0eSBoYXNNYW55IGxpc3RzIGFzIFtdJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2Zyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW10pKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWRkIGhhc01hbnkgZWxlbWVudHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFt7XG4gICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgIH1dKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhZGQgaGFzTWFueSBlbGVtZW50cyBieSBjaGlsZCBmaWVsZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIHsgY2hpbGRfaWQ6IDEwMCB9KSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbe1xuICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICB9XSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmVtb3ZlIGhhc01hbnkgZWxlbWVudHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFt7XG4gICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgIH1dKTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiBvbmUuJHJlbW92ZSgnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW10pKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaW5jbHVkZSB2YWxlbmNlIGluIGhhc01hbnkgb3BlcmF0aW9ucycsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdncm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCd2YWxlbmNlQ2hpbGRyZW4nLCAxMDAsIHsgcGVybTogMSB9KSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kZ2V0KCd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoW3tcbiAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgICAgICAgICBwZXJtOiAxLFxuICAgICAgICB9XSk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRtb2RpZnlSZWxhdGlvbnNoaXAoJ3ZhbGVuY2VDaGlsZHJlbicsIDEwMCwgeyBwZXJtOiAyIH0pKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChbe1xuICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAgICAgICAgIHBlcm06IDIsXG4gICAgICAgIH1dKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZXZlbnRzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgYWxsb3cgc3Vic2NyaXB0aW9uIHRvIG1vZGVsIGRhdGEnLCAoZG9uZSkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgbGV0IHBoYXNlID0gMDtcbiAgICAgIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG9uZS4kc3Vic2NyaWJlKCh2KSA9PiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke3BoYXNlfTogJHtKU09OLnN0cmluZ2lmeSh2LCBudWxsLCAyKX1gKTtcbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMCkge1xuICAgICAgICAgICAgICBpZiAodi5uYW1lKSB7XG4gICAgICAgICAgICAgICAgcGhhc2UgPSAxO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGhhc2UgPT09IDEpIHtcbiAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgICAgICAgICAgIGlmICh2LmlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBwaGFzZSA9IDI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMikge1xuICAgICAgICAgICAgICBpZiAodi5uYW1lICE9PSAncG90YXRvJykge1xuICAgICAgICAgICAgICAgIGV4cGVjdCh2KS50by5oYXZlLnByb3BlcnR5KCduYW1lJywgJ2dyb3RhdG8nKTtcbiAgICAgICAgICAgICAgICBwaGFzZSA9IDM7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMykge1xuICAgICAgICAgICAgICBpZiAoKHYuY2hpbGRyZW4pICYmICh2LmNoaWxkcmVuLmxlbmd0aCA+IDApKSB7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHYuY2hpbGRyZW4pLnRvLmRlZXAuZXF1YWwoW3tcbiAgICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgZG9uZShlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRzZXQoeyBuYW1lOiAnZ3JvdGF0bycgfSkpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCB7IGNoaWxkX2lkOiAxMDAgfSkpO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19
