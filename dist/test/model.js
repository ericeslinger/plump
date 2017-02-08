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

/* eslint-env node, mocha*/

var memstore2 = new _index.MemoryStorage({ terminal: true });

var plump = new _index.Plump({
  storage: [memstore2],
  types: [_testType.TestType]
});

_chai2.default.use(_chaiAsPromised2.default);
var expect = _chai2.default.expect;

describe('model', function () {
  describe('basic functionality', function () {
    // it('should return promises to existing data', () => {
    //   const one = new TestType({ id: 1, name: 'potato' });
    //   return expect(one.$get()).to.eventually.have.property('name', 'potato');
    // });
    //
    // it('should properly serialize its schema', () => {
    //   class MiniTest extends Model {}
    //   MiniTest.fromJSON(TestType.toJSON());
    //   return expect(MiniTest.toJSON()).to.deep.equal(TestType.toJSON());
    // });
    //
    // it('should load data from datastores', () => {
    //   return memstore2.write(TestType, {
    //     id: 2,
    //     name: 'potato',
    //   }).then(() => {
    //     const two = plump.find('tests', 2);
    //     return expect(two.$get()).to.eventually.have.property('name', 'potato');
    //   });
    // });
    //
    // it('should create an id when one is unset', () => {
    //   const noID = new TestType({ name: 'potato' }, plump);
    //   return expect(noID.$save().then((m) => m.$get())).to.eventually.contain.keys('name', 'id');
    // });
    //
    // it('should allow data to be deleted', () => {
    //   const one = new TestType({ name: 'potato' }, plump);
    //   return one.$save()
    //   .then(() => expect(plump.find('tests', one.$id).$get()).to.eventually.have.property('name', 'potato'))
    //   .then(() => one.$delete())
    //   .then(() => expect(plump.find('tests', one.$id).$get()).to.eventually.be.null);
    // });
    //
    // it('should allow fields to be loaded', () => {
    //   const one = new TestType({ name: 'p' }, plump);
    //   return one.$save()
    //   .then(() => expect(plump.find('tests', one.$id).$get()).to.eventually.have.property('name', 'p'))
    //   .then(() => {
    //     return expect(plump.find('tests', one.$id).$get($all))
    //     .to.eventually.deep.equal(TestType.assign({ name: 'p', id: one.$id }));
    //   });
    // });
    //
    // it('should only load base fields on $get($self)', () => {
    //   const one = new TestType({ name: 'potato' }, plump);
    //   return one.$save()
    //   .then(() => {
    //     const baseFields = Object.keys(TestType.$fields).filter(field => TestType.$fields[field].type !== 'hasMany');
    //     // const hasManys = Object.keys(TestType.$fields).filter(field => TestType.$fields[field].type === 'hasMany');
    //
    //     return expect(plump.find('tests', one.$id).$get()).to.eventually.have.all.keys(baseFields);
    //     // NOTE: .have.all requires list length equality
    //     // .and.not.keys(hasManys);
    //   });
    // });
    //
    // it('should optimistically update on field updates', () => {
    //   const one = new TestType({ name: 'potato' }, plump);
    //   return one.$save()
    //   .then(() => one.$set({ name: 'rutabaga' }))
    //   .then(() => expect(one.$get()).to.eventually.have.property('name', 'rutabaga'));
    // });

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

  // describe('relationships', () => {
  //   it('should show empty hasMany lists as {key: []}', () => {
  //     const one = new TestType({ name: 'frotato' }, plump);
  //     return one.$save()
  //     .then(() => expect(one.$get('children')).to.eventually.deep.equal({ children: [] }));
  //   });
  //
  //   it('should add hasMany elements', () => {
  //     const one = new TestType({ name: 'frotato' }, plump);
  //     return one.$save()
  //     .then(() => one.$add('children', 100))
  //     .then(() => {
  //       return expect(one.$get('children'))
  //       .to.eventually.deep.equal({ children: [{
  //         child_id: 100,
  //         parent_id: one.$id,
  //       }] });
  //     });
  //   });
  //
  //   it('should add hasMany elements by child field', () => {
  //     const one = new TestType({ name: 'frotato' }, plump);
  //     return one.$save()
  //     .then(() => one.$add('children', { child_id: 100 }))
  //     .then(() => {
  //       return expect(one.$get('children'))
  //       .to.eventually.deep.equal({ children: [{
  //         child_id: 100,
  //         parent_id: one.$id,
  //       }] });
  //     });
  //   });
  //
  //   it('should remove hasMany elements', () => {
  //     const one = new TestType({ name: 'frotato' }, plump);
  //     return one.$save()
  //     .then(() => one.$add('children', 100))
  //     .then(() => {
  //       return expect(one.$get('children'))
  //       .to.eventually.deep.equal({ children: [{
  //         child_id: 100,
  //         parent_id: one.$id,
  //       }] });
  //     })
  //     .then(() => one.$remove('children', 100))
  //     .then(() => expect(one.$get('children')).to.eventually.deep.equal({ children: [] }));
  //   });
  //
  //   it('should include valence in hasMany operations', () => {
  //     const one = new TestType({ name: 'grotato' }, plump);
  //     return one.$save()
  //     .then(() => one.$add('valenceChildren', 100, { perm: 1 }))
  //     .then(() => one.$get('valenceChildren'))
  //     .then(() => {
  //       return expect(one.$get('valenceChildren'))
  //       .to.eventually.deep.equal({ valenceChildren: [{
  //         child_id: 100,
  //         parent_id: one.$id,
  //         perm: 1,
  //       }] });
  //     })
  //     .then(() => one.$modifyRelationship('valenceChildren', 100, { perm: 2 }))
  //     .then(() => {
  //       return expect(one.$get('valenceChildren'))
  //       .to.eventually.deep.equal({ valenceChildren: [{
  //         child_id: 100,
  //         parent_id: one.$id,
  //         perm: 2,
  //       }] });
  //     });
  //   });
  // });
  //
  // describe('events', () => {
  //   it('should allow subscription to model data', (done) => {
  //     const one = new TestType({ name: 'potato' }, plump);
  //     let phase = 0;
  //     one.$save()
  //     .then(() => {
  //       const subscription = one.$subscribe((v) => {
  //         try {
  //           if (phase === 0) {
  //             if (v.name) {
  //               phase = 1;
  //             }
  //           }
  //           if (phase === 1) {
  //             expect(v).to.have.property('name', 'potato');
  //             if (v.id !== undefined) {
  //               phase = 2;
  //             }
  //           }
  //           if (phase === 2) {
  //             if (v.name !== 'potato') {
  //               expect(v).to.have.property('name', 'grotato');
  //               phase = 3;
  //             }
  //           }
  //           if (phase === 3) {
  //             if ((v.children) && (v.children.length > 0)) {
  //               expect(v.children).to.deep.equal([{
  //                 child_id: 100,
  //                 parent_id: one.$id,
  //               }]);
  //               subscription.unsubscribe();
  //               done();
  //             }
  //           }
  //         } catch (err) {
  //           done(err);
  //         }
  //       });
  //     })
  //     .then(() => one.$set({ name: 'grotato' }))
  //     .then(() => one.$add('children', { child_id: 100 }));
  //   });
  //
  //   it('should allow subscription to model sideloads', (done) => {
  //     const one = new TestType({ name: 'potato' }, plump);
  //     let phase = 0;
  //     one.$save()
  //     .then(() => one.$add('children', { child_id: 100 }))
  //     // .then(() => one.$get([$self, 'children']).then((v) => console.log(JSON.stringify(v, null, 2))))
  //     .then(() => {
  //       const subscription = one.$subscribe([$all], (v) => {
  //         try {
  //           if (phase === 0) {
  //             if (v.name) {
  //               phase = 1;
  //             }
  //           }
  //           if (phase === 1) {
  //             expect(v).to.have.property('name', 'potato');
  //             expect(v.children).to.deep.equal([{
  //               child_id: 100,
  //               parent_id: one.$id,
  //             }]);
  //             phase = 2;
  //           }
  //           if (phase === 2) {
  //             if ((v.children) && (v.children.length > 1)) {
  //               expect(v.children).to.deep.equal([{
  //                 child_id: 100,
  //                 parent_id: one.$id,
  //               }, {
  //                 child_id: 101,
  //                 parent_id: one.$id,
  //               }]);
  //               subscription.unsubscribe();
  //               done();
  //             }
  //           }
  //         } catch (err) {
  //           done(err);
  //         }
  //       });
  //     })
  //     .then(() => one.$add('children', { child_id: 101 }));
  //   });
  //
  //   it('should update on cacheable read events', (done) => {
  //     const DelayProxy = {
  //       get: (target, name) => {
  //         if (['read', 'write', 'add', 'remove'].indexOf(name) >= 0) {
  //           return (...args) => {
  //             return Bluebird.delay(200)
  //             .then(() => target[name](...args));
  //           };
  //         } else {
  //           return target[name];
  //         }
  //       },
  //     };
  //     const delayedMemstore = new Proxy(new MemoryStorage({ terminal: true }), DelayProxy);
  //     const coldMemstore = new MemoryStorage();
  //     const otherPlump = new Plump({
  //       storage: [coldMemstore, delayedMemstore],
  //       types: [TestType],
  //     });
  //     const one = new TestType({ name: 'slowtato' }, otherPlump);
  //     one.$save()
  //     .then(() => one.$get())
  //     .then((val) => {
  //       return coldMemstore.write(TestType, {
  //         name: 'potato',
  //         id: val.id,
  //       })
  //       .then(() => {
  //         let phase = 0;
  //         const two = otherPlump.find('tests', val.id);
  //         const subscription = two.$subscribe((v) => {
  //           try {
  //             if (phase === 0) {
  //               if (v.name) {
  //                 expect(v).to.have.property('name', 'potato');
  //                 phase = 1;
  //               }
  //             }
  //             if (phase === 1) {
  //               if (v.name !== 'potato') {
  //                 expect(v).to.have.property('name', 'slowtato');
  //                 subscription.unsubscribe();
  //                 done();
  //               }
  //             }
  //           } catch (err) {
  //             subscription.unsubscribe();
  //             done(err);
  //           }
  //         });
  //       });
  //     });
  //   });
  // });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUyIiwidGVybWluYWwiLCJwbHVtcCIsInN0b3JhZ2UiLCJ0eXBlcyIsInVzZSIsImV4cGVjdCIsImRlc2NyaWJlIiwiaXQiLCJvbmUiLCJpZCIsIm5hbWUiLCJ0d28iLCJleHRlbmRlZCIsImNvaG9ydCIsInRocmVlIiwiYWxsIiwiJHNhdmUiLCJ0aGVuIiwiJGFkZCIsIiRpZCIsIiRwYWNrYWdlIiwidG8iLCJldmVudHVhbGx5IiwiZGVlcCIsImVxdWFsIiwiSlNPTiIsInBhcnNlIiwicmVhZEZpbGVTeW5jIl0sIm1hcHBpbmdzIjoiOztBQUVBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBRUE7O0FBQ0E7Ozs7QUFSQTs7QUFVQSxJQUFNQSxZQUFZLHlCQUFrQixFQUFFQyxVQUFVLElBQVosRUFBbEIsQ0FBbEI7O0FBRUEsSUFBTUMsUUFBUSxpQkFBVTtBQUN0QkMsV0FBUyxDQUFDSCxTQUFELENBRGE7QUFFdEJJLFNBQU87QUFGZSxDQUFWLENBQWQ7O0FBTUEsZUFBS0MsR0FBTDtBQUNBLElBQU1DLFNBQVMsZUFBS0EsTUFBcEI7O0FBRUFDLFNBQVMsT0FBVCxFQUFrQixZQUFNO0FBQ3RCQSxXQUFTLHFCQUFULEVBQWdDLFlBQU07QUFDcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBQyxPQUFHLCtDQUFILEVBQW9ELFlBQU07QUFDeEQsVUFBTUMsTUFBTSx1QkFBYTtBQUN2QkMsWUFBSSxDQURtQjtBQUV2QkMsY0FBTTtBQUZpQixPQUFiLEVBR1RULEtBSFMsQ0FBWjtBQUlBLFVBQU1VLE1BQU0sdUJBQWE7QUFDdkJGLFlBQUksQ0FEbUI7QUFFdkJDLGNBQU0sU0FGaUI7QUFHdkJFLGtCQUFVLEVBQUVDLFFBQVEsSUFBVjtBQUhhLE9BQWIsRUFJVFosS0FKUyxDQUFaO0FBS0EsVUFBTWEsUUFBUSx1QkFBYTtBQUN6QkwsWUFBSSxDQURxQjtBQUV6QkMsY0FBTTtBQUZtQixPQUFiLEVBR1hULEtBSFcsQ0FBZDs7QUFLQSxhQUFPLG1CQUFTYyxHQUFULENBQWEsQ0FDbEJQLElBQUlRLEtBQUosRUFEa0IsRUFFbEJMLElBQUlLLEtBQUosRUFGa0IsRUFHbEJGLE1BQU1FLEtBQU4sRUFIa0IsQ0FBYixFQUlKQyxJQUpJLENBSUMsWUFBTTtBQUNaLGVBQU8sbUJBQVNGLEdBQVQsQ0FBYSxDQUNsQlAsSUFBSVUsSUFBSixDQUFTLFVBQVQsRUFBcUJQLElBQUlRLEdBQXpCLENBRGtCLEVBRWxCUixJQUFJTyxJQUFKLENBQVMsVUFBVCxFQUFxQkosTUFBTUssR0FBM0IsQ0FGa0IsQ0FBYixDQUFQO0FBSUQsT0FUTSxFQVNKRixJQVRJLENBU0MsWUFBTTtBQUNaLGVBQU9aLE9BQU9HLElBQUlZLFFBQUosRUFBUCxFQUF1QkMsRUFBdkIsQ0FBMEJDLFVBQTFCLENBQXFDQyxJQUFyQyxDQUEwQ0MsS0FBMUMsQ0FDTEMsS0FBS0MsS0FBTCxDQUFXLGFBQUdDLFlBQUgsQ0FBZ0Isd0JBQWhCLENBQVgsQ0FESyxDQUFQO0FBR0QsT0FiTSxDQUFQO0FBY0QsS0E3QkQ7QUE4QkQsR0EvRkQ7O0FBaUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0QsQ0F4VEQiLCJmaWxlIjoidGVzdC9tb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1lbnYgbm9kZSwgbW9jaGEqL1xuXG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuXG5pbXBvcnQgeyBQbHVtcCwgTW9kZWwsIE1lbW9yeVN0b3JhZ2UsICRhbGwgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgeyBUZXN0VHlwZSB9IGZyb20gJy4vdGVzdFR5cGUnO1xuXG5jb25zdCBtZW1zdG9yZTIgPSBuZXcgTWVtb3J5U3RvcmFnZSh7IHRlcm1pbmFsOiB0cnVlIH0pO1xuXG5jb25zdCBwbHVtcCA9IG5ldyBQbHVtcCh7XG4gIHN0b3JhZ2U6IFttZW1zdG9yZTJdLFxuICB0eXBlczogW1Rlc3RUeXBlXSxcbn0pO1xuXG5cbmNoYWkudXNlKGNoYWlBc1Byb21pc2VkKTtcbmNvbnN0IGV4cGVjdCA9IGNoYWkuZXhwZWN0O1xuXG5kZXNjcmliZSgnbW9kZWwnLCAoKSA9PiB7XG4gIGRlc2NyaWJlKCdiYXNpYyBmdW5jdGlvbmFsaXR5JywgKCkgPT4ge1xuICAgIC8vIGl0KCdzaG91bGQgcmV0dXJuIHByb21pc2VzIHRvIGV4aXN0aW5nIGRhdGEnLCAoKSA9PiB7XG4gICAgLy8gICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBpZDogMSwgbmFtZTogJ3BvdGF0bycgfSk7XG4gICAgLy8gICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgICAvLyB9KTtcbiAgICAvL1xuICAgIC8vIGl0KCdzaG91bGQgcHJvcGVybHkgc2VyaWFsaXplIGl0cyBzY2hlbWEnLCAoKSA9PiB7XG4gICAgLy8gICBjbGFzcyBNaW5pVGVzdCBleHRlbmRzIE1vZGVsIHt9XG4gICAgLy8gICBNaW5pVGVzdC5mcm9tSlNPTihUZXN0VHlwZS50b0pTT04oKSk7XG4gICAgLy8gICByZXR1cm4gZXhwZWN0KE1pbmlUZXN0LnRvSlNPTigpKS50by5kZWVwLmVxdWFsKFRlc3RUeXBlLnRvSlNPTigpKTtcbiAgICAvLyB9KTtcbiAgICAvL1xuICAgIC8vIGl0KCdzaG91bGQgbG9hZCBkYXRhIGZyb20gZGF0YXN0b3JlcycsICgpID0+IHtcbiAgICAvLyAgIHJldHVybiBtZW1zdG9yZTIud3JpdGUoVGVzdFR5cGUsIHtcbiAgICAvLyAgICAgaWQ6IDIsXG4gICAgLy8gICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgIC8vICAgfSkudGhlbigoKSA9PiB7XG4gICAgLy8gICAgIGNvbnN0IHR3byA9IHBsdW1wLmZpbmQoJ3Rlc3RzJywgMik7XG4gICAgLy8gICAgIHJldHVybiBleHBlY3QodHdvLiRnZXQoKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgIC8vICAgfSk7XG4gICAgLy8gfSk7XG4gICAgLy9cbiAgICAvLyBpdCgnc2hvdWxkIGNyZWF0ZSBhbiBpZCB3aGVuIG9uZSBpcyB1bnNldCcsICgpID0+IHtcbiAgICAvLyAgIGNvbnN0IG5vSUQgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgLy8gICByZXR1cm4gZXhwZWN0KG5vSUQuJHNhdmUoKS50aGVuKChtKSA9PiBtLiRnZXQoKSkpLnRvLmV2ZW50dWFsbHkuY29udGFpbi5rZXlzKCduYW1lJywgJ2lkJyk7XG4gICAgLy8gfSk7XG4gICAgLy9cbiAgICAvLyBpdCgnc2hvdWxkIGFsbG93IGRhdGEgdG8gYmUgZGVsZXRlZCcsICgpID0+IHtcbiAgICAvLyAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAvLyAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgIC8vICAgLnRoZW4oKCkgPT4gZXhwZWN0KHBsdW1wLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJykpXG4gICAgLy8gICAudGhlbigoKSA9PiBvbmUuJGRlbGV0ZSgpKVxuICAgIC8vICAgLnRoZW4oKCkgPT4gZXhwZWN0KHBsdW1wLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgpKS50by5ldmVudHVhbGx5LmJlLm51bGwpO1xuICAgIC8vIH0pO1xuICAgIC8vXG4gICAgLy8gaXQoJ3Nob3VsZCBhbGxvdyBmaWVsZHMgdG8gYmUgbG9hZGVkJywgKCkgPT4ge1xuICAgIC8vICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3AnIH0sIHBsdW1wKTtcbiAgICAvLyAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgIC8vICAgLnRoZW4oKCkgPT4gZXhwZWN0KHBsdW1wLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncCcpKVxuICAgIC8vICAgLnRoZW4oKCkgPT4ge1xuICAgIC8vICAgICByZXR1cm4gZXhwZWN0KHBsdW1wLmZpbmQoJ3Rlc3RzJywgb25lLiRpZCkuJGdldCgkYWxsKSlcbiAgICAvLyAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChUZXN0VHlwZS5hc3NpZ24oeyBuYW1lOiAncCcsIGlkOiBvbmUuJGlkIH0pKTtcbiAgICAvLyAgIH0pO1xuICAgIC8vIH0pO1xuICAgIC8vXG4gICAgLy8gaXQoJ3Nob3VsZCBvbmx5IGxvYWQgYmFzZSBmaWVsZHMgb24gJGdldCgkc2VsZiknLCAoKSA9PiB7XG4gICAgLy8gICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgLy8gICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAvLyAgIC50aGVuKCgpID0+IHtcbiAgICAvLyAgICAgY29uc3QgYmFzZUZpZWxkcyA9IE9iamVjdC5rZXlzKFRlc3RUeXBlLiRmaWVsZHMpLmZpbHRlcihmaWVsZCA9PiBUZXN0VHlwZS4kZmllbGRzW2ZpZWxkXS50eXBlICE9PSAnaGFzTWFueScpO1xuICAgIC8vICAgICAvLyBjb25zdCBoYXNNYW55cyA9IE9iamVjdC5rZXlzKFRlc3RUeXBlLiRmaWVsZHMpLmZpbHRlcihmaWVsZCA9PiBUZXN0VHlwZS4kZmllbGRzW2ZpZWxkXS50eXBlID09PSAnaGFzTWFueScpO1xuICAgIC8vXG4gICAgLy8gICAgIHJldHVybiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5hbGwua2V5cyhiYXNlRmllbGRzKTtcbiAgICAvLyAgICAgLy8gTk9URTogLmhhdmUuYWxsIHJlcXVpcmVzIGxpc3QgbGVuZ3RoIGVxdWFsaXR5XG4gICAgLy8gICAgIC8vIC5hbmQubm90LmtleXMoaGFzTWFueXMpO1xuICAgIC8vICAgfSk7XG4gICAgLy8gfSk7XG4gICAgLy9cbiAgICAvLyBpdCgnc2hvdWxkIG9wdGltaXN0aWNhbGx5IHVwZGF0ZSBvbiBmaWVsZCB1cGRhdGVzJywgKCkgPT4ge1xuICAgIC8vICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgIC8vICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgLy8gICAudGhlbigoKSA9PiBvbmUuJHNldCh7IG5hbWU6ICdydXRhYmFnYScgfSkpXG4gICAgLy8gICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3J1dGFiYWdhJykpO1xuICAgIC8vIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBwYWNrYWdlIGFsbCByZWxhdGVkIGRvY3VtZW50cyBmb3IgcmVhZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7XG4gICAgICAgIGlkOiAxLFxuICAgICAgICBuYW1lOiAncG90YXRvJyxcbiAgICAgIH0sIHBsdW1wKTtcbiAgICAgIGNvbnN0IHR3byA9IG5ldyBUZXN0VHlwZSh7XG4gICAgICAgIGlkOiAyLFxuICAgICAgICBuYW1lOiAnZnJvdGF0bycsXG4gICAgICAgIGV4dGVuZGVkOiB7IGNvaG9ydDogMjAxMyB9LFxuICAgICAgfSwgcGx1bXApO1xuICAgICAgY29uc3QgdGhyZWUgPSBuZXcgVGVzdFR5cGUoe1xuICAgICAgICBpZDogMyxcbiAgICAgICAgbmFtZTogJ3J1dGFiYWdhJyxcbiAgICAgIH0sIHBsdW1wKTtcblxuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIG9uZS4kc2F2ZSgpLFxuICAgICAgICB0d28uJHNhdmUoKSxcbiAgICAgICAgdGhyZWUuJHNhdmUoKSxcbiAgICAgIF0pLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgICBvbmUuJGFkZCgnY2hpbGRyZW4nLCB0d28uJGlkKSxcbiAgICAgICAgICB0d28uJGFkZCgnY2hpbGRyZW4nLCB0aHJlZS4kaWQpLFxuICAgICAgICBdKTtcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kcGFja2FnZSgpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoXG4gICAgICAgICAgSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMoJ3NyYy90ZXN0L3Rlc3RUeXBlLmpzb24nKSlcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICAvLyBkZXNjcmliZSgncmVsYXRpb25zaGlwcycsICgpID0+IHtcbiAgLy8gICBpdCgnc2hvdWxkIHNob3cgZW1wdHkgaGFzTWFueSBsaXN0cyBhcyB7a2V5OiBbXX0nLCAoKSA9PiB7XG4gIC8vICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAvLyAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gIC8vICAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IGNoaWxkcmVuOiBbXSB9KSk7XG4gIC8vICAgfSk7XG4gIC8vXG4gIC8vICAgaXQoJ3Nob3VsZCBhZGQgaGFzTWFueSBlbGVtZW50cycsICgpID0+IHtcbiAgLy8gICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gIC8vICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgLy8gICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIDEwMCkpXG4gIC8vICAgICAudGhlbigoKSA9PiB7XG4gIC8vICAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpXG4gIC8vICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoeyBjaGlsZHJlbjogW3tcbiAgLy8gICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAvLyAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgLy8gICAgICAgfV0gfSk7XG4gIC8vICAgICB9KTtcbiAgLy8gICB9KTtcbiAgLy9cbiAgLy8gICBpdCgnc2hvdWxkIGFkZCBoYXNNYW55IGVsZW1lbnRzIGJ5IGNoaWxkIGZpZWxkJywgKCkgPT4ge1xuICAvLyAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2Zyb3RhdG8nIH0sIHBsdW1wKTtcbiAgLy8gICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAvLyAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgeyBjaGlsZF9pZDogMTAwIH0pKVxuICAvLyAgICAgLnRoZW4oKCkgPT4ge1xuICAvLyAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKVxuICAvLyAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgY2hpbGRyZW46IFt7XG4gIC8vICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgLy8gICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gIC8vICAgICAgIH1dIH0pO1xuICAvLyAgICAgfSk7XG4gIC8vICAgfSk7XG4gIC8vXG4gIC8vICAgaXQoJ3Nob3VsZCByZW1vdmUgaGFzTWFueSBlbGVtZW50cycsICgpID0+IHtcbiAgLy8gICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gIC8vICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgLy8gICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIDEwMCkpXG4gIC8vICAgICAudGhlbigoKSA9PiB7XG4gIC8vICAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpXG4gIC8vICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoeyBjaGlsZHJlbjogW3tcbiAgLy8gICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAvLyAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgLy8gICAgICAgfV0gfSk7XG4gIC8vICAgICB9KVxuICAvLyAgICAgLnRoZW4oKCkgPT4gb25lLiRyZW1vdmUoJ2NoaWxkcmVuJywgMTAwKSlcbiAgLy8gICAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSkudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgY2hpbGRyZW46IFtdIH0pKTtcbiAgLy8gICB9KTtcbiAgLy9cbiAgLy8gICBpdCgnc2hvdWxkIGluY2x1ZGUgdmFsZW5jZSBpbiBoYXNNYW55IG9wZXJhdGlvbnMnLCAoKSA9PiB7XG4gIC8vICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZ3JvdGF0bycgfSwgcGx1bXApO1xuICAvLyAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gIC8vICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7IHBlcm06IDEgfSkpXG4gIC8vICAgICAudGhlbigoKSA9PiBvbmUuJGdldCgndmFsZW5jZUNoaWxkcmVuJykpXG4gIC8vICAgICAudGhlbigoKSA9PiB7XG4gIC8vICAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAvLyAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgdmFsZW5jZUNoaWxkcmVuOiBbe1xuICAvLyAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gIC8vICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAvLyAgICAgICAgIHBlcm06IDEsXG4gIC8vICAgICAgIH1dIH0pO1xuICAvLyAgICAgfSlcbiAgLy8gICAgIC50aGVuKCgpID0+IG9uZS4kbW9kaWZ5UmVsYXRpb25zaGlwKCd2YWxlbmNlQ2hpbGRyZW4nLCAxMDAsIHsgcGVybTogMiB9KSlcbiAgLy8gICAgIC50aGVuKCgpID0+IHtcbiAgLy8gICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgndmFsZW5jZUNoaWxkcmVuJykpXG4gIC8vICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoeyB2YWxlbmNlQ2hpbGRyZW46IFt7XG4gIC8vICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgLy8gICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gIC8vICAgICAgICAgcGVybTogMixcbiAgLy8gICAgICAgfV0gfSk7XG4gIC8vICAgICB9KTtcbiAgLy8gICB9KTtcbiAgLy8gfSk7XG4gIC8vXG4gIC8vIGRlc2NyaWJlKCdldmVudHMnLCAoKSA9PiB7XG4gIC8vICAgaXQoJ3Nob3VsZCBhbGxvdyBzdWJzY3JpcHRpb24gdG8gbW9kZWwgZGF0YScsIChkb25lKSA9PiB7XG4gIC8vICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gIC8vICAgICBsZXQgcGhhc2UgPSAwO1xuICAvLyAgICAgb25lLiRzYXZlKClcbiAgLy8gICAgIC50aGVuKCgpID0+IHtcbiAgLy8gICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gb25lLiRzdWJzY3JpYmUoKHYpID0+IHtcbiAgLy8gICAgICAgICB0cnkge1xuICAvLyAgICAgICAgICAgaWYgKHBoYXNlID09PSAwKSB7XG4gIC8vICAgICAgICAgICAgIGlmICh2Lm5hbWUpIHtcbiAgLy8gICAgICAgICAgICAgICBwaGFzZSA9IDE7XG4gIC8vICAgICAgICAgICAgIH1cbiAgLy8gICAgICAgICAgIH1cbiAgLy8gICAgICAgICAgIGlmIChwaGFzZSA9PT0gMSkge1xuICAvLyAgICAgICAgICAgICBleHBlY3QodikudG8uaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgLy8gICAgICAgICAgICAgaWYgKHYuaWQgIT09IHVuZGVmaW5lZCkge1xuICAvLyAgICAgICAgICAgICAgIHBoYXNlID0gMjtcbiAgLy8gICAgICAgICAgICAgfVxuICAvLyAgICAgICAgICAgfVxuICAvLyAgICAgICAgICAgaWYgKHBoYXNlID09PSAyKSB7XG4gIC8vICAgICAgICAgICAgIGlmICh2Lm5hbWUgIT09ICdwb3RhdG8nKSB7XG4gIC8vICAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAnZ3JvdGF0bycpO1xuICAvLyAgICAgICAgICAgICAgIHBoYXNlID0gMztcbiAgLy8gICAgICAgICAgICAgfVxuICAvLyAgICAgICAgICAgfVxuICAvLyAgICAgICAgICAgaWYgKHBoYXNlID09PSAzKSB7XG4gIC8vICAgICAgICAgICAgIGlmICgodi5jaGlsZHJlbikgJiYgKHYuY2hpbGRyZW4ubGVuZ3RoID4gMCkpIHtcbiAgLy8gICAgICAgICAgICAgICBleHBlY3Qodi5jaGlsZHJlbikudG8uZGVlcC5lcXVhbChbe1xuICAvLyAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgLy8gICAgICAgICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgLy8gICAgICAgICAgICAgICB9XSk7XG4gIC8vICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gIC8vICAgICAgICAgICAgICAgZG9uZSgpO1xuICAvLyAgICAgICAgICAgICB9XG4gIC8vICAgICAgICAgICB9XG4gIC8vICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gIC8vICAgICAgICAgICBkb25lKGVycik7XG4gIC8vICAgICAgICAgfVxuICAvLyAgICAgICB9KTtcbiAgLy8gICAgIH0pXG4gIC8vICAgICAudGhlbigoKSA9PiBvbmUuJHNldCh7IG5hbWU6ICdncm90YXRvJyB9KSlcbiAgLy8gICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIHsgY2hpbGRfaWQ6IDEwMCB9KSk7XG4gIC8vICAgfSk7XG4gIC8vXG4gIC8vICAgaXQoJ3Nob3VsZCBhbGxvdyBzdWJzY3JpcHRpb24gdG8gbW9kZWwgc2lkZWxvYWRzJywgKGRvbmUpID0+IHtcbiAgLy8gICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgLy8gICAgIGxldCBwaGFzZSA9IDA7XG4gIC8vICAgICBvbmUuJHNhdmUoKVxuICAvLyAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgeyBjaGlsZF9pZDogMTAwIH0pKVxuICAvLyAgICAgLy8gLnRoZW4oKCkgPT4gb25lLiRnZXQoWyRzZWxmLCAnY2hpbGRyZW4nXSkudGhlbigodikgPT4gY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodiwgbnVsbCwgMikpKSlcbiAgLy8gICAgIC50aGVuKCgpID0+IHtcbiAgLy8gICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gb25lLiRzdWJzY3JpYmUoWyRhbGxdLCAodikgPT4ge1xuICAvLyAgICAgICAgIHRyeSB7XG4gIC8vICAgICAgICAgICBpZiAocGhhc2UgPT09IDApIHtcbiAgLy8gICAgICAgICAgICAgaWYgKHYubmFtZSkge1xuICAvLyAgICAgICAgICAgICAgIHBoYXNlID0gMTtcbiAgLy8gICAgICAgICAgICAgfVxuICAvLyAgICAgICAgICAgfVxuICAvLyAgICAgICAgICAgaWYgKHBoYXNlID09PSAxKSB7XG4gIC8vICAgICAgICAgICAgIGV4cGVjdCh2KS50by5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAvLyAgICAgICAgICAgICBleHBlY3Qodi5jaGlsZHJlbikudG8uZGVlcC5lcXVhbChbe1xuICAvLyAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gIC8vICAgICAgICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAvLyAgICAgICAgICAgICB9XSk7XG4gIC8vICAgICAgICAgICAgIHBoYXNlID0gMjtcbiAgLy8gICAgICAgICAgIH1cbiAgLy8gICAgICAgICAgIGlmIChwaGFzZSA9PT0gMikge1xuICAvLyAgICAgICAgICAgICBpZiAoKHYuY2hpbGRyZW4pICYmICh2LmNoaWxkcmVuLmxlbmd0aCA+IDEpKSB7XG4gIC8vICAgICAgICAgICAgICAgZXhwZWN0KHYuY2hpbGRyZW4pLnRvLmRlZXAuZXF1YWwoW3tcbiAgLy8gICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gIC8vICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gIC8vICAgICAgICAgICAgICAgfSwge1xuICAvLyAgICAgICAgICAgICAgICAgY2hpbGRfaWQ6IDEwMSxcbiAgLy8gICAgICAgICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgLy8gICAgICAgICAgICAgICB9XSk7XG4gIC8vICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gIC8vICAgICAgICAgICAgICAgZG9uZSgpO1xuICAvLyAgICAgICAgICAgICB9XG4gIC8vICAgICAgICAgICB9XG4gIC8vICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gIC8vICAgICAgICAgICBkb25lKGVycik7XG4gIC8vICAgICAgICAgfVxuICAvLyAgICAgICB9KTtcbiAgLy8gICAgIH0pXG4gIC8vICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCB7IGNoaWxkX2lkOiAxMDEgfSkpO1xuICAvLyAgIH0pO1xuICAvL1xuICAvLyAgIGl0KCdzaG91bGQgdXBkYXRlIG9uIGNhY2hlYWJsZSByZWFkIGV2ZW50cycsIChkb25lKSA9PiB7XG4gIC8vICAgICBjb25zdCBEZWxheVByb3h5ID0ge1xuICAvLyAgICAgICBnZXQ6ICh0YXJnZXQsIG5hbWUpID0+IHtcbiAgLy8gICAgICAgICBpZiAoWydyZWFkJywgJ3dyaXRlJywgJ2FkZCcsICdyZW1vdmUnXS5pbmRleE9mKG5hbWUpID49IDApIHtcbiAgLy8gICAgICAgICAgIHJldHVybiAoLi4uYXJncykgPT4ge1xuICAvLyAgICAgICAgICAgICByZXR1cm4gQmx1ZWJpcmQuZGVsYXkoMjAwKVxuICAvLyAgICAgICAgICAgICAudGhlbigoKSA9PiB0YXJnZXRbbmFtZV0oLi4uYXJncykpO1xuICAvLyAgICAgICAgICAgfTtcbiAgLy8gICAgICAgICB9IGVsc2Uge1xuICAvLyAgICAgICAgICAgcmV0dXJuIHRhcmdldFtuYW1lXTtcbiAgLy8gICAgICAgICB9XG4gIC8vICAgICAgIH0sXG4gIC8vICAgICB9O1xuICAvLyAgICAgY29uc3QgZGVsYXllZE1lbXN0b3JlID0gbmV3IFByb3h5KG5ldyBNZW1vcnlTdG9yYWdlKHsgdGVybWluYWw6IHRydWUgfSksIERlbGF5UHJveHkpO1xuICAvLyAgICAgY29uc3QgY29sZE1lbXN0b3JlID0gbmV3IE1lbW9yeVN0b3JhZ2UoKTtcbiAgLy8gICAgIGNvbnN0IG90aGVyUGx1bXAgPSBuZXcgUGx1bXAoe1xuICAvLyAgICAgICBzdG9yYWdlOiBbY29sZE1lbXN0b3JlLCBkZWxheWVkTWVtc3RvcmVdLFxuICAvLyAgICAgICB0eXBlczogW1Rlc3RUeXBlXSxcbiAgLy8gICAgIH0pO1xuICAvLyAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3Nsb3d0YXRvJyB9LCBvdGhlclBsdW1wKTtcbiAgLy8gICAgIG9uZS4kc2F2ZSgpXG4gIC8vICAgICAudGhlbigoKSA9PiBvbmUuJGdldCgpKVxuICAvLyAgICAgLnRoZW4oKHZhbCkgPT4ge1xuICAvLyAgICAgICByZXR1cm4gY29sZE1lbXN0b3JlLndyaXRlKFRlc3RUeXBlLCB7XG4gIC8vICAgICAgICAgbmFtZTogJ3BvdGF0bycsXG4gIC8vICAgICAgICAgaWQ6IHZhbC5pZCxcbiAgLy8gICAgICAgfSlcbiAgLy8gICAgICAgLnRoZW4oKCkgPT4ge1xuICAvLyAgICAgICAgIGxldCBwaGFzZSA9IDA7XG4gIC8vICAgICAgICAgY29uc3QgdHdvID0gb3RoZXJQbHVtcC5maW5kKCd0ZXN0cycsIHZhbC5pZCk7XG4gIC8vICAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gdHdvLiRzdWJzY3JpYmUoKHYpID0+IHtcbiAgLy8gICAgICAgICAgIHRyeSB7XG4gIC8vICAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMCkge1xuICAvLyAgICAgICAgICAgICAgIGlmICh2Lm5hbWUpIHtcbiAgLy8gICAgICAgICAgICAgICAgIGV4cGVjdCh2KS50by5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAvLyAgICAgICAgICAgICAgICAgcGhhc2UgPSAxO1xuICAvLyAgICAgICAgICAgICAgIH1cbiAgLy8gICAgICAgICAgICAgfVxuICAvLyAgICAgICAgICAgICBpZiAocGhhc2UgPT09IDEpIHtcbiAgLy8gICAgICAgICAgICAgICBpZiAodi5uYW1lICE9PSAncG90YXRvJykge1xuICAvLyAgICAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAnc2xvd3RhdG8nKTtcbiAgLy8gICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAvLyAgICAgICAgICAgICAgICAgZG9uZSgpO1xuICAvLyAgICAgICAgICAgICAgIH1cbiAgLy8gICAgICAgICAgICAgfVxuICAvLyAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gIC8vICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAvLyAgICAgICAgICAgICBkb25lKGVycik7XG4gIC8vICAgICAgICAgICB9XG4gIC8vICAgICAgICAgfSk7XG4gIC8vICAgICAgIH0pO1xuICAvLyAgICAgfSk7XG4gIC8vICAgfSk7XG4gIC8vIH0pO1xufSk7XG4iXX0=
