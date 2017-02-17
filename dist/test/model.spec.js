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
      var one = new _testType.TestType({ id: 1, name: 'potato' }, plump);
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
    it('should pass model hasMany changes to other models', function () {
      var one = new _testType.TestType({ name: 'potato' }, plump);
      return one.$save().then(function () {
        var onePrime = plump.find(_testType.TestType.$name, one.$id);
        return one.$get('children').then(function (res) {
          return expect(res).to.deep.equal({ children: [] });
        }).then(function () {
          return onePrime.$get('children');
        }).then(function (res) {
          return expect(res).to.deep.equal({ children: [] });
        }).then(function () {
          return one.$add('children', 100);
        }).then(function () {
          return one.$get('children');
        }).then(function (res) {
          return expect(res).to.deep.equal({ children: [{ id: 100 }] });
        }).then(function () {
          return onePrime.$get('children');
        }).then(function (res) {
          return expect(res).to.deep.equal({ children: [{ id: 100 }] });
        });
      });
    });

    it('should pass model changes to other models', function () {
      var one = new _testType.TestType({ name: 'potato' }, plump);
      return one.$save().then(function () {
        var onePrime = plump.find(_testType.TestType.$name, one.$id);
        return one.$get().then(function (res) {
          return expect(res).have.property('name', 'potato');
        }).then(function () {
          return onePrime.$get();
        }).then(function (res) {
          return expect(res).have.property('name', 'potato');
        }).then(function () {
          return one.$set('name', 'grotato');
        }).then(function () {
          return one.$get();
        }).then(function (res) {
          return expect(res).have.property('name', 'grotato');
        }).then(function () {
          return onePrime.$get();
        }).then(function (res) {
          return expect(res).have.property('name', 'grotato');
        });
      });
    });

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuc3BlYy5qcyJdLCJuYW1lcyI6WyJwcm90b3R5cGUiLCJidWxrUmVhZCIsIm9wdHMiLCJhbGwiLCJyZWFkIiwidGhlbiIsImNoaWxkcmVuIiwibWVtc3RvcmUyIiwidGVybWluYWwiLCJwbHVtcCIsInN0b3JhZ2UiLCJ0eXBlcyIsInVzZSIsImV4cGVjdCIsImRlc2NyaWJlIiwiaXQiLCJvbmUiLCJpZCIsIm5hbWUiLCIkZ2V0IiwidG8iLCJldmVudHVhbGx5IiwiaGF2ZSIsInByb3BlcnR5IiwiTWluaVRlc3QiLCJmcm9tSlNPTiIsInRvSlNPTiIsImRlZXAiLCJlcXVhbCIsIndyaXRlIiwidHdvIiwiZmluZCIsIm5vSUQiLCIkc2F2ZSIsIm0iLCJjb250YWluIiwia2V5cyIsIiRpZCIsIiRkZWxldGUiLCJiZSIsIm51bGwiLCJhc3NpZ24iLCJiYXNlRmllbGRzIiwiT2JqZWN0IiwiJGZpZWxkcyIsImZpbHRlciIsImZpZWxkIiwidHlwZSIsIiRzZXQiLCIkYWRkIiwiJHJlbW92ZSIsInBlcm0iLCJ2YWxlbmNlQ2hpbGRyZW4iLCIkbW9kaWZ5UmVsYXRpb25zaGlwIiwib25lUHJpbWUiLCIkbmFtZSIsInJlcyIsImRvbmUiLCJwaGFzZSIsInN1YnNjcmlwdGlvbiIsIiRzdWJzY3JpYmUiLCJ2IiwidW5kZWZpbmVkIiwibGVuZ3RoIiwidW5zdWJzY3JpYmUiLCJlcnIiLCJEZWxheVByb3h5IiwiZ2V0IiwidGFyZ2V0IiwiaW5kZXhPZiIsImFyZ3MiLCJkZWxheSIsImRlbGF5ZWRNZW1zdG9yZSIsIlByb3h5IiwiY29sZE1lbXN0b3JlIiwib3RoZXJQbHVtcCIsInZhbCJdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQTs7QUFDQTs7Ozs7Ozs7K2VBUEE7O0FBU0E7QUFDQSxlQUFRQSxTQUFSLENBQWtCQyxRQUFsQixHQUE2QixTQUFTQSxRQUFULENBQWtCQyxJQUFsQixFQUF3QjtBQUFFO0FBQ3JELFNBQU8s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QUFVekMsRUFBVixDQUFhRSxJQUFiLENBQWtCQyxRQUFsQixDQUEyQixNQUEzQixFQUFtQyxVQUFuQztBQUNBb0MsK0JBQWFLLFdBQWI7QUFDQVA7QUFDRDtBQUNGO0FBQ0YsYUFkRCxDQWNFLE9BQU9RLEdBQVAsRUFBWTtBQUNaTiwyQkFBYUssV0FBYjtBQUNBUCxtQkFBS1EsR0FBTDtBQUNEO0FBQ0YsV0FuQm9CLENBQXJCO0FBb0JELFNBM0JNLENBQVA7QUE0QkQsT0EvQkQ7QUFnQ0QsS0FwREQ7QUFxREQsR0F6S0Q7QUEwS0QsQ0EzU0QiLCJmaWxlIjoidGVzdC9tb2RlbC5zcGVjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlLCBtb2NoYSovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcblxuaW1wb3J0IHsgUGx1bXAsIE1vZGVsLCBTdG9yYWdlLCBNZW1vcnlTdG9yZSwgJGFsbCB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7IFRlc3RUeXBlIH0gZnJvbSAnLi90ZXN0VHlwZSc7XG5cbi8vIEZvciB0ZXN0aW5nIHdoaWxlIGFjdHVhbCBidWxrUmVhZCBpbXBsZW1lbnRhdGlvbnMgYXJlIGluIGRldmVsb3BtZW50XG5TdG9yYWdlLnByb3RvdHlwZS5idWxrUmVhZCA9IGZ1bmN0aW9uIGJ1bGtSZWFkKG9wdHMpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICB0aGlzLnJlYWQoVGVzdFR5cGUsIDIsICRhbGwpLFxuICAgIHRoaXMucmVhZChUZXN0VHlwZSwgMywgJGFsbCksXG4gIF0pLnRoZW4oY2hpbGRyZW4gPT4ge1xuICAgIHJldHVybiB7IGNoaWxkcmVuIH07XG4gIH0pO1xufTtcblxuY29uc3QgbWVtc3RvcmUyID0gbmV3IE1lbW9yeVN0b3JlKHsgdGVybWluYWw6IHRydWUgfSk7XG5cbmNvbnN0IHBsdW1wID0gbmV3IFBsdW1wKHtcbiAgc3RvcmFnZTogW21lbXN0b3JlMl0sXG4gIHR5cGVzOiBbVGVzdFR5cGVdLFxufSk7XG5cblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbmRlc2NyaWJlKCdtb2RlbCcsICgpID0+IHtcbiAgZGVzY3JpYmUoJ2Jhc2ljIGZ1bmN0aW9uYWxpdHknLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gcHJvbWlzZXMgdG8gZXhpc3RpbmcgZGF0YScsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IGlkOiAxLCBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcHJvcGVybHkgc2VyaWFsaXplIGl0cyBzY2hlbWEnLCAoKSA9PiB7XG4gICAgICBjbGFzcyBNaW5pVGVzdCBleHRlbmRzIE1vZGVsIHt9XG4gICAgICBNaW5pVGVzdC5mcm9tSlNPTihUZXN0VHlwZS50b0pTT04oKSk7XG4gICAgICByZXR1cm4gZXhwZWN0KE1pbmlUZXN0LnRvSlNPTigpKS50by5kZWVwLmVxdWFsKFRlc3RUeXBlLnRvSlNPTigpKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgbG9hZCBkYXRhIGZyb20gZGF0YXN0b3JlcycsICgpID0+IHtcbiAgICAgIHJldHVybiBtZW1zdG9yZTIud3JpdGUoVGVzdFR5cGUsIHtcbiAgICAgICAgaWQ6IDIsXG4gICAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IHR3byA9IHBsdW1wLmZpbmQoJ3Rlc3RzJywgMik7XG4gICAgICAgIHJldHVybiBleHBlY3QodHdvLiRnZXQoKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGNyZWF0ZSBhbiBpZCB3aGVuIG9uZSBpcyB1bnNldCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG5vSUQgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gZXhwZWN0KG5vSUQuJHNhdmUoKS50aGVuKChtKSA9PiBtLiRnZXQoKSkpLnRvLmV2ZW50dWFsbHkuY29udGFpbi5rZXlzKCduYW1lJywgJ2lkJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFsbG93IGRhdGEgdG8gYmUgZGVsZXRlZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KHBsdW1wLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJykpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGRlbGV0ZSgpKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KHBsdW1wLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgpKS50by5ldmVudHVhbGx5LmJlLm51bGwpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhbGxvdyBmaWVsZHMgdG8gYmUgbG9hZGVkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3AnIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KHBsdW1wLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncCcpKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KHBsdW1wLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgkYWxsKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChUZXN0VHlwZS5hc3NpZ24oeyBuYW1lOiAncCcsIGlkOiBvbmUuJGlkIH0pKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBvbmx5IGxvYWQgYmFzZSBmaWVsZHMgb24gJGdldCgkc2VsZiknLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3QgYmFzZUZpZWxkcyA9IE9iamVjdC5rZXlzKFRlc3RUeXBlLiRmaWVsZHMpLmZpbHRlcihmaWVsZCA9PiBUZXN0VHlwZS4kZmllbGRzW2ZpZWxkXS50eXBlICE9PSAnaGFzTWFueScpO1xuICAgICAgICAvLyBjb25zdCBoYXNNYW55cyA9IE9iamVjdC5rZXlzKFRlc3RUeXBlLiRmaWVsZHMpLmZpbHRlcihmaWVsZCA9PiBUZXN0VHlwZS4kZmllbGRzW2ZpZWxkXS50eXBlID09PSAnaGFzTWFueScpO1xuXG4gICAgICAgIHJldHVybiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5hbGwua2V5cyhiYXNlRmllbGRzKTtcbiAgICAgICAgLy8gTk9URTogLmhhdmUuYWxsIHJlcXVpcmVzIGxpc3QgbGVuZ3RoIGVxdWFsaXR5XG4gICAgICAgIC8vIC5hbmQubm90LmtleXMoaGFzTWFueXMpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIG9wdGltaXN0aWNhbGx5IHVwZGF0ZSBvbiBmaWVsZCB1cGRhdGVzJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJHNldCh7IG5hbWU6ICdydXRhYmFnYScgfSkpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3J1dGFiYWdhJykpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgncmVsYXRpb25zaGlwcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHNob3cgZW1wdHkgaGFzTWFueSBsaXN0cyBhcyB7a2V5OiBbXX0nLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IGNoaWxkcmVuOiBbXSB9KSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFkZCBoYXNNYW55IGVsZW1lbnRzJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2Zyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IGNoaWxkcmVuOiBbeyBpZDogMTAwIH1dIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFkZCBoYXNNYW55IGVsZW1lbnRzIGJ5IGNoaWxkIGZpZWxkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2Zyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IGNoaWxkcmVuOiBbeyBpZDogMTAwIH1dIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlbW92ZSBoYXNNYW55IGVsZW1lbnRzJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2Zyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgMTAwKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IGNoaWxkcmVuOiBbeyBpZDogMTAwIH1dIH0pO1xuICAgICAgfSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kcmVtb3ZlKCdjaGlsZHJlbicsIDEwMCkpXG4gICAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IGNoaWxkcmVuOiBbXSB9KSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUgdmFsZW5jZSBpbiBoYXNNYW55IG9wZXJhdGlvbnMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZ3JvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7IHBlcm06IDEgfSkpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGdldCgndmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgdmFsZW5jZUNoaWxkcmVuOiBbe1xuICAgICAgICAgIGlkOiAxMDAsXG4gICAgICAgICAgcGVybTogMSxcbiAgICAgICAgfV0gfSk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRtb2RpZnlSZWxhdGlvbnNoaXAoJ3ZhbGVuY2VDaGlsZHJlbicsIDEwMCwgeyBwZXJtOiAyIH0pKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IHZhbGVuY2VDaGlsZHJlbjogW3tcbiAgICAgICAgICBpZDogMTAwLFxuICAgICAgICAgIHBlcm06IDIsXG4gICAgICAgIH1dIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdldmVudHMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBwYXNzIG1vZGVsIGhhc01hbnkgY2hhbmdlcyB0byBvdGhlciBtb2RlbHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3Qgb25lUHJpbWUgPSBwbHVtcC5maW5kKFRlc3RUeXBlLiRuYW1lLCBvbmUuJGlkKTtcbiAgICAgICAgcmV0dXJuIG9uZS4kZ2V0KCdjaGlsZHJlbicpXG4gICAgICAgIC50aGVuKChyZXMpID0+IGV4cGVjdChyZXMpLnRvLmRlZXAuZXF1YWwoeyBjaGlsZHJlbjogW10gfSkpXG4gICAgICAgIC50aGVuKCgpID0+IG9uZVByaW1lLiRnZXQoJ2NoaWxkcmVuJykpXG4gICAgICAgIC50aGVuKChyZXMpID0+IGV4cGVjdChyZXMpLnRvLmRlZXAuZXF1YWwoeyBjaGlsZHJlbjogW10gfSkpXG4gICAgICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIDEwMCkpXG4gICAgICAgIC50aGVuKCgpID0+IG9uZS4kZ2V0KCdjaGlsZHJlbicpKVxuICAgICAgICAudGhlbigocmVzKSA9PiBleHBlY3QocmVzKS50by5kZWVwLmVxdWFsKHsgY2hpbGRyZW46IFt7IGlkOiAxMDAgfV0gfSkpXG4gICAgICAgIC50aGVuKCgpID0+IG9uZVByaW1lLiRnZXQoJ2NoaWxkcmVuJykpXG4gICAgICAgIC50aGVuKChyZXMpID0+IGV4cGVjdChyZXMpLnRvLmRlZXAuZXF1YWwoeyBjaGlsZHJlbjogW3sgaWQ6IDEwMCB9XSB9KSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcGFzcyBtb2RlbCBjaGFuZ2VzIHRvIG90aGVyIG1vZGVscycsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCBvbmVQcmltZSA9IHBsdW1wLmZpbmQoVGVzdFR5cGUuJG5hbWUsIG9uZS4kaWQpO1xuICAgICAgICByZXR1cm4gb25lLiRnZXQoKVxuICAgICAgICAudGhlbigocmVzKSA9PiBleHBlY3QocmVzKS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpKVxuICAgICAgICAudGhlbigoKSA9PiBvbmVQcmltZS4kZ2V0KCkpXG4gICAgICAgIC50aGVuKChyZXMpID0+IGV4cGVjdChyZXMpLmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJykpXG4gICAgICAgIC50aGVuKCgpID0+IG9uZS4kc2V0KCduYW1lJywgJ2dyb3RhdG8nKSlcbiAgICAgICAgLnRoZW4oKCkgPT4gb25lLiRnZXQoKSlcbiAgICAgICAgLnRoZW4oKHJlcykgPT4gZXhwZWN0KHJlcykuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdncm90YXRvJykpXG4gICAgICAgIC50aGVuKCgpID0+IG9uZVByaW1lLiRnZXQoKSlcbiAgICAgICAgLnRoZW4oKHJlcykgPT4gZXhwZWN0KHJlcykuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdncm90YXRvJykpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFsbG93IHN1YnNjcmlwdGlvbiB0byBtb2RlbCBkYXRhJywgKGRvbmUpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIGxldCBwaGFzZSA9IDA7XG4gICAgICBvbmUuJHNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBvbmUuJHN1YnNjcmliZSgodikgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAocGhhc2UgPT09IDApIHtcbiAgICAgICAgICAgICAgaWYgKHYubmFtZSkge1xuICAgICAgICAgICAgICAgIHBoYXNlID0gMTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBoYXNlID09PSAxKSB7XG4gICAgICAgICAgICAgIGV4cGVjdCh2KS50by5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgICAgICAgICAgICBpZiAodi5pZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcGhhc2UgPSAyO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGhhc2UgPT09IDIpIHtcbiAgICAgICAgICAgICAgaWYgKHYubmFtZSAhPT0gJ3BvdGF0bycpIHtcbiAgICAgICAgICAgICAgICBleHBlY3QodikudG8uaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdncm90YXRvJyk7XG4gICAgICAgICAgICAgICAgcGhhc2UgPSAzO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGhhc2UgPT09IDMpIHtcbiAgICAgICAgICAgICAgaWYgKCh2LmNoaWxkcmVuKSAmJiAodi5jaGlsZHJlbi5sZW5ndGggPiAwKSkge1xuICAgICAgICAgICAgICAgIGV4cGVjdCh2LmNoaWxkcmVuKS50by5kZWVwLmVxdWFsKFt7XG4gICAgICAgICAgICAgICAgICBpZDogMTAwLFxuICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICBkb25lKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGRvbmUoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS4kc2V0KHsgbmFtZTogJ2dyb3RhdG8nIH0pKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgMTAwKSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFsbG93IHN1YnNjcmlwdGlvbiB0byBtb2RlbCBzaWRlbG9hZHMnLCAoZG9uZSkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgbGV0IHBoYXNlID0gMDtcbiAgICAgIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDApKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBvbmUuJHN1YnNjcmliZShbJGFsbF0sICh2KSA9PiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMCkge1xuICAgICAgICAgICAgICBpZiAodi5uYW1lKSB7XG4gICAgICAgICAgICAgICAgcGhhc2UgPSAxO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGhhc2UgPT09IDEpIHtcbiAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgICAgICAgICAgIGV4cGVjdCh2LmNoaWxkcmVuKS50by5kZWVwLmVxdWFsKFt7XG4gICAgICAgICAgICAgICAgaWQ6IDEwMCxcbiAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICBwaGFzZSA9IDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGhhc2UgPT09IDIpIHtcbiAgICAgICAgICAgICAgaWYgKCh2LmNoaWxkcmVuKSAmJiAodi5jaGlsZHJlbi5sZW5ndGggPiAxKSkge1xuICAgICAgICAgICAgICAgIGV4cGVjdCh2LmNoaWxkcmVuKS50by5kZWVwLmVxdWFsKFt7XG4gICAgICAgICAgICAgICAgICBpZDogMTAwLFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgIGlkOiAxMDEsXG4gICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgZG9uZShlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgMTAxKSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHVwZGF0ZSBvbiBjYWNoZWFibGUgcmVhZCBldmVudHMnLCAoZG9uZSkgPT4ge1xuICAgICAgY29uc3QgRGVsYXlQcm94eSA9IHtcbiAgICAgICAgZ2V0OiAodGFyZ2V0LCBuYW1lKSA9PiB7XG4gICAgICAgICAgaWYgKFsncmVhZCcsICd3cml0ZScsICdhZGQnLCAncmVtb3ZlJ10uaW5kZXhPZihuYW1lKSA+PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIEJsdWViaXJkLmRlbGF5KDIwMClcbiAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGFyZ2V0W25hbWVdKC4uLmFyZ3MpKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0YXJnZXRbbmFtZV07XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICAgIGNvbnN0IGRlbGF5ZWRNZW1zdG9yZSA9IG5ldyBQcm94eShuZXcgTWVtb3J5U3RvcmUoeyB0ZXJtaW5hbDogdHJ1ZSB9KSwgRGVsYXlQcm94eSk7XG4gICAgICBjb25zdCBjb2xkTWVtc3RvcmUgPSBuZXcgTWVtb3J5U3RvcmUoKTtcbiAgICAgIGNvbnN0IG90aGVyUGx1bXAgPSBuZXcgUGx1bXAoe1xuICAgICAgICBzdG9yYWdlOiBbY29sZE1lbXN0b3JlLCBkZWxheWVkTWVtc3RvcmVdLFxuICAgICAgICB0eXBlczogW1Rlc3RUeXBlXSxcbiAgICAgIH0pO1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3Nsb3d0YXRvJyB9LCBvdGhlclBsdW1wKTtcbiAgICAgIG9uZS4kc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuJGdldCgpKVxuICAgICAgLnRoZW4oKHZhbCkgPT4ge1xuICAgICAgICByZXR1cm4gY29sZE1lbXN0b3JlLndyaXRlKFRlc3RUeXBlLCB7XG4gICAgICAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgICAgICAgaWQ6IHZhbC5pZCxcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIGxldCBwaGFzZSA9IDA7XG4gICAgICAgICAgY29uc3QgdHdvID0gb3RoZXJQbHVtcC5maW5kKCd0ZXN0cycsIHZhbC5pZCk7XG4gICAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gdHdvLiRzdWJzY3JpYmUoKHYpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGlmICh2Lm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgIGV4cGVjdCh2KS50by5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgICAgICAgICAgICAgICAgcGhhc2UgPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAocGhhc2UgPT09IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAodi5uYW1lICE9PSAncG90YXRvJykge1xuICAgICAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAnc2xvd3RhdG8nKTtcbiAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgICBkb25lKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=
