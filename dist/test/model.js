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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvbW9kZWwuanMiXSwibmFtZXMiOlsibWVtc3RvcmUyIiwidGVybWluYWwiLCJwbHVtcCIsInN0b3JhZ2UiLCJ0eXBlcyIsInVzZSIsImV4cGVjdCIsImRlc2NyaWJlIiwiaXQiLCJvbmUiLCJpZCIsIm5hbWUiLCJ0d28iLCJleHRlbmRlZCIsImNvaG9ydCIsInRocmVlIiwiYWxsIiwiJHNhdmUiLCJ0aGVuIiwiJGFkZCIsIiRpZCIsIiRwYWNrYWdlIiwidG8iLCJldmVudHVhbGx5IiwiZGVlcCIsImVxdWFsIiwiSlNPTiIsInBhcnNlIiwicmVhZEZpbGVTeW5jIl0sIm1hcHBpbmdzIjoiOztBQUVBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBRUE7O0FBQ0E7Ozs7QUFSQTs7QUFVQSxJQUFNQSxZQUFZLHlCQUFrQixFQUFFQyxVQUFVLElBQVosRUFBbEIsQ0FBbEI7O0FBRUEsSUFBTUMsUUFBUSxpQkFBVTtBQUN0QkMsV0FBUyxDQUFDSCxTQUFELENBRGE7QUFFdEJJLFNBQU87QUFGZSxDQUFWLENBQWQ7O0FBTUEsZUFBS0MsR0FBTDtBQUNBLElBQU1DLFNBQVMsZUFBS0EsTUFBcEI7O0FBRUFDLFNBQVMsT0FBVCxFQUFrQixZQUFNO0FBQ3RCQSxXQUFTLHFCQUFULEVBQWdDLFlBQU07QUFDcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBQyxPQUFHLCtDQUFILEVBQW9ELFlBQU07QUFDeEQsVUFBTUMsTUFBTSx1QkFBYTtBQUN2QkMsWUFBSSxDQURtQjtBQUV2QkMsY0FBTTtBQUZpQixPQUFiLEVBR1RULEtBSFMsQ0FBWjtBQUlBLFVBQU1VLE1BQU0sdUJBQWE7QUFDdkJGLFlBQUksQ0FEbUI7QUFFdkJDLGNBQU0sU0FGaUI7QUFHdkJFLGtCQUFVLEVBQUVDLFFBQVEsSUFBVjtBQUhhLE9BQWIsRUFJVFosS0FKUyxDQUFaO0FBS0EsVUFBTWEsUUFBUSx1QkFBYTtBQUN6QkwsWUFBSSxDQURxQjtBQUV6QkMsY0FBTTtBQUZtQixPQUFiLEVBR1hULEtBSFcsQ0FBZDs7QUFLQSxhQUFPLG1CQUFTYyxHQUFULENBQWEsQ0FDbEJQLElBQUlRLEtBQUosRUFEa0IsRUFFbEJMLElBQUlLLEtBQUosRUFGa0IsRUFHbEJGLE1BQU1FLEtBQU4sRUFIa0IsQ0FBYixFQUlKQyxJQUpJLENBSUMsWUFBTTtBQUNaLGVBQU8sbUJBQVNGLEdBQVQsQ0FBYSxDQUNsQlAsSUFBSVUsSUFBSixDQUFTLFVBQVQsRUFBcUJQLElBQUlRLEdBQXpCLENBRGtCLEVBRWxCUixJQUFJTyxJQUFKLENBQVMsVUFBVCxFQUFxQkosTUFBTUssR0FBM0IsQ0FGa0IsQ0FBYixDQUFQO0FBSUQsT0FUTSxFQVNKRixJQVRJLENBU0MsWUFBTTtBQUNaLGVBQU9aLE9BQU9HLElBQUlZLFFBQUosRUFBUCxFQUF1QkMsRUFBdkIsQ0FBMEJDLFVBQTFCLENBQXFDQyxJQUFyQyxDQUEwQ0MsS0FBMUMsQ0FBZ0RDLEtBQUtDLEtBQUwsQ0FBVyxhQUFHQyxZQUFILENBQWdCLHdCQUFoQixDQUFYLENBQWhELENBQVA7QUFDRCxPQVhNLENBQVA7QUFZRCxLQTNCRDtBQTRCRCxHQTdGRDs7QUErRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDRCxDQXRURCIsImZpbGUiOiJ0ZXN0L21vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlLCBtb2NoYSovXG5cbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5cbmltcG9ydCB7IFBsdW1wLCBNb2RlbCwgTWVtb3J5U3RvcmFnZSwgJGFsbCB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7IFRlc3RUeXBlIH0gZnJvbSAnLi90ZXN0VHlwZSc7XG5cbmNvbnN0IG1lbXN0b3JlMiA9IG5ldyBNZW1vcnlTdG9yYWdlKHsgdGVybWluYWw6IHRydWUgfSk7XG5cbmNvbnN0IHBsdW1wID0gbmV3IFBsdW1wKHtcbiAgc3RvcmFnZTogW21lbXN0b3JlMl0sXG4gIHR5cGVzOiBbVGVzdFR5cGVdLFxufSk7XG5cblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3QgZXhwZWN0ID0gY2hhaS5leHBlY3Q7XG5cbmRlc2NyaWJlKCdtb2RlbCcsICgpID0+IHtcbiAgZGVzY3JpYmUoJ2Jhc2ljIGZ1bmN0aW9uYWxpdHknLCAoKSA9PiB7XG4gICAgLy8gaXQoJ3Nob3VsZCByZXR1cm4gcHJvbWlzZXMgdG8gZXhpc3RpbmcgZGF0YScsICgpID0+IHtcbiAgICAvLyAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IGlkOiAxLCBuYW1lOiAncG90YXRvJyB9KTtcbiAgICAvLyAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoKSkudG8uZXZlbnR1YWxseS5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgIC8vIH0pO1xuICAgIC8vXG4gICAgLy8gaXQoJ3Nob3VsZCBwcm9wZXJseSBzZXJpYWxpemUgaXRzIHNjaGVtYScsICgpID0+IHtcbiAgICAvLyAgIGNsYXNzIE1pbmlUZXN0IGV4dGVuZHMgTW9kZWwge31cbiAgICAvLyAgIE1pbmlUZXN0LmZyb21KU09OKFRlc3RUeXBlLnRvSlNPTigpKTtcbiAgICAvLyAgIHJldHVybiBleHBlY3QoTWluaVRlc3QudG9KU09OKCkpLnRvLmRlZXAuZXF1YWwoVGVzdFR5cGUudG9KU09OKCkpO1xuICAgIC8vIH0pO1xuICAgIC8vXG4gICAgLy8gaXQoJ3Nob3VsZCBsb2FkIGRhdGEgZnJvbSBkYXRhc3RvcmVzJywgKCkgPT4ge1xuICAgIC8vICAgcmV0dXJuIG1lbXN0b3JlMi53cml0ZShUZXN0VHlwZSwge1xuICAgIC8vICAgICBpZDogMixcbiAgICAvLyAgICAgbmFtZTogJ3BvdGF0bycsXG4gICAgLy8gICB9KS50aGVuKCgpID0+IHtcbiAgICAvLyAgICAgY29uc3QgdHdvID0gcGx1bXAuZmluZCgndGVzdHMnLCAyKTtcbiAgICAvLyAgICAgcmV0dXJuIGV4cGVjdCh0d28uJGdldCgpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gICAgLy8gICB9KTtcbiAgICAvLyB9KTtcbiAgICAvL1xuICAgIC8vIGl0KCdzaG91bGQgY3JlYXRlIGFuIGlkIHdoZW4gb25lIGlzIHVuc2V0JywgKCkgPT4ge1xuICAgIC8vICAgY29uc3Qgbm9JRCA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAvLyAgIHJldHVybiBleHBlY3Qobm9JRC4kc2F2ZSgpLnRoZW4oKG0pID0+IG0uJGdldCgpKSkudG8uZXZlbnR1YWxseS5jb250YWluLmtleXMoJ25hbWUnLCAnaWQnKTtcbiAgICAvLyB9KTtcbiAgICAvL1xuICAgIC8vIGl0KCdzaG91bGQgYWxsb3cgZGF0YSB0byBiZSBkZWxldGVkJywgKCkgPT4ge1xuICAgIC8vICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgIC8vICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgLy8gICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKSlcbiAgICAvLyAgIC50aGVuKCgpID0+IG9uZS4kZGVsZXRlKCkpXG4gICAgLy8gICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuYmUubnVsbCk7XG4gICAgLy8gfSk7XG4gICAgLy9cbiAgICAvLyBpdCgnc2hvdWxkIGFsbG93IGZpZWxkcyB0byBiZSBsb2FkZWQnLCAoKSA9PiB7XG4gICAgLy8gICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncCcgfSwgcGx1bXApO1xuICAgIC8vICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gICAgLy8gICAudGhlbigoKSA9PiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwJykpXG4gICAgLy8gICAudGhlbigoKSA9PiB7XG4gICAgLy8gICAgIHJldHVybiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuJGlkKS4kZ2V0KCRhbGwpKVxuICAgIC8vICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKFRlc3RUeXBlLmFzc2lnbih7IG5hbWU6ICdwJywgaWQ6IG9uZS4kaWQgfSkpO1xuICAgIC8vICAgfSk7XG4gICAgLy8gfSk7XG4gICAgLy9cbiAgICAvLyBpdCgnc2hvdWxkIG9ubHkgbG9hZCBiYXNlIGZpZWxkcyBvbiAkZ2V0KCRzZWxmKScsICgpID0+IHtcbiAgICAvLyAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAvLyAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAgIC8vICAgLnRoZW4oKCkgPT4ge1xuICAgIC8vICAgICBjb25zdCBiYXNlRmllbGRzID0gT2JqZWN0LmtleXMoVGVzdFR5cGUuJGZpZWxkcykuZmlsdGVyKGZpZWxkID0+IFRlc3RUeXBlLiRmaWVsZHNbZmllbGRdLnR5cGUgIT09ICdoYXNNYW55Jyk7XG4gICAgLy8gICAgIC8vIGNvbnN0IGhhc01hbnlzID0gT2JqZWN0LmtleXMoVGVzdFR5cGUuJGZpZWxkcykuZmlsdGVyKGZpZWxkID0+IFRlc3RUeXBlLiRmaWVsZHNbZmllbGRdLnR5cGUgPT09ICdoYXNNYW55Jyk7XG4gICAgLy9cbiAgICAvLyAgICAgcmV0dXJuIGV4cGVjdChwbHVtcC5maW5kKCd0ZXN0cycsIG9uZS4kaWQpLiRnZXQoKSkudG8uZXZlbnR1YWxseS5oYXZlLmFsbC5rZXlzKGJhc2VGaWVsZHMpO1xuICAgIC8vICAgICAvLyBOT1RFOiAuaGF2ZS5hbGwgcmVxdWlyZXMgbGlzdCBsZW5ndGggZXF1YWxpdHlcbiAgICAvLyAgICAgLy8gLmFuZC5ub3Qua2V5cyhoYXNNYW55cyk7XG4gICAgLy8gICB9KTtcbiAgICAvLyB9KTtcbiAgICAvL1xuICAgIC8vIGl0KCdzaG91bGQgb3B0aW1pc3RpY2FsbHkgdXBkYXRlIG9uIGZpZWxkIHVwZGF0ZXMnLCAoKSA9PiB7XG4gICAgLy8gICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgLy8gICByZXR1cm4gb25lLiRzYXZlKClcbiAgICAvLyAgIC50aGVuKCgpID0+IG9uZS4kc2V0KHsgbmFtZTogJ3J1dGFiYWdhJyB9KSlcbiAgICAvLyAgIC50aGVuKCgpID0+IGV4cGVjdChvbmUuJGdldCgpKS50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ25hbWUnLCAncnV0YWJhZ2EnKSk7XG4gICAgLy8gfSk7XG5cbiAgICBpdCgnc2hvdWxkIHBhY2thZ2UgYWxsIHJlbGF0ZWQgZG9jdW1lbnRzIGZvciByZWFkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHtcbiAgICAgICAgaWQ6IDEsXG4gICAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgICAgfSwgcGx1bXApO1xuICAgICAgY29uc3QgdHdvID0gbmV3IFRlc3RUeXBlKHtcbiAgICAgICAgaWQ6IDIsXG4gICAgICAgIG5hbWU6ICdmcm90YXRvJyxcbiAgICAgICAgZXh0ZW5kZWQ6IHsgY29ob3J0OiAyMDEzIH0sXG4gICAgICB9LCBwbHVtcCk7XG4gICAgICBjb25zdCB0aHJlZSA9IG5ldyBUZXN0VHlwZSh7XG4gICAgICAgIGlkOiAzLFxuICAgICAgICBuYW1lOiAncnV0YWJhZ2EnLFxuICAgICAgfSwgcGx1bXApO1xuXG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgb25lLiRzYXZlKCksXG4gICAgICAgIHR3by4kc2F2ZSgpLFxuICAgICAgICB0aHJlZS4kc2F2ZSgpLFxuICAgICAgXSkudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICAgIG9uZS4kYWRkKCdjaGlsZHJlbicsIHR3by4kaWQpLFxuICAgICAgICAgIHR3by4kYWRkKCdjaGlsZHJlbicsIHRocmVlLiRpZCksXG4gICAgICAgIF0pO1xuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3Qob25lLiRwYWNrYWdlKCkpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbChKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYygnc3JjL3Rlc3QvdGVzdFR5cGUuanNvbicpKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gZGVzY3JpYmUoJ3JlbGF0aW9uc2hpcHMnLCAoKSA9PiB7XG4gIC8vICAgaXQoJ3Nob3VsZCBzaG93IGVtcHR5IGhhc01hbnkgbGlzdHMgYXMge2tleTogW119JywgKCkgPT4ge1xuICAvLyAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2Zyb3RhdG8nIH0sIHBsdW1wKTtcbiAgLy8gICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAvLyAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKS50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoeyBjaGlsZHJlbjogW10gfSkpO1xuICAvLyAgIH0pO1xuICAvL1xuICAvLyAgIGl0KCdzaG91bGQgYWRkIGhhc01hbnkgZWxlbWVudHMnLCAoKSA9PiB7XG4gIC8vICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAvLyAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gIC8vICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDApKVxuICAvLyAgICAgLnRoZW4oKCkgPT4ge1xuICAvLyAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKVxuICAvLyAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgY2hpbGRyZW46IFt7XG4gIC8vICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgLy8gICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gIC8vICAgICAgIH1dIH0pO1xuICAvLyAgICAgfSk7XG4gIC8vICAgfSk7XG4gIC8vXG4gIC8vICAgaXQoJ3Nob3VsZCBhZGQgaGFzTWFueSBlbGVtZW50cyBieSBjaGlsZCBmaWVsZCcsICgpID0+IHtcbiAgLy8gICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gIC8vICAgICByZXR1cm4gb25lLiRzYXZlKClcbiAgLy8gICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIHsgY2hpbGRfaWQ6IDEwMCB9KSlcbiAgLy8gICAgIC50aGVuKCgpID0+IHtcbiAgLy8gICAgICAgcmV0dXJuIGV4cGVjdChvbmUuJGdldCgnY2hpbGRyZW4nKSlcbiAgLy8gICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IGNoaWxkcmVuOiBbe1xuICAvLyAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gIC8vICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAvLyAgICAgICB9XSB9KTtcbiAgLy8gICAgIH0pO1xuICAvLyAgIH0pO1xuICAvL1xuICAvLyAgIGl0KCdzaG91bGQgcmVtb3ZlIGhhc01hbnkgZWxlbWVudHMnLCAoKSA9PiB7XG4gIC8vICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZnJvdGF0bycgfSwgcGx1bXApO1xuICAvLyAgICAgcmV0dXJuIG9uZS4kc2F2ZSgpXG4gIC8vICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCAxMDApKVxuICAvLyAgICAgLnRoZW4oKCkgPT4ge1xuICAvLyAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCdjaGlsZHJlbicpKVxuICAvLyAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgY2hpbGRyZW46IFt7XG4gIC8vICAgICAgICAgY2hpbGRfaWQ6IDEwMCxcbiAgLy8gICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gIC8vICAgICAgIH1dIH0pO1xuICAvLyAgICAgfSlcbiAgLy8gICAgIC50aGVuKCgpID0+IG9uZS4kcmVtb3ZlKCdjaGlsZHJlbicsIDEwMCkpXG4gIC8vICAgICAudGhlbigoKSA9PiBleHBlY3Qob25lLiRnZXQoJ2NoaWxkcmVuJykpLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IGNoaWxkcmVuOiBbXSB9KSk7XG4gIC8vICAgfSk7XG4gIC8vXG4gIC8vICAgaXQoJ3Nob3VsZCBpbmNsdWRlIHZhbGVuY2UgaW4gaGFzTWFueSBvcGVyYXRpb25zJywgKCkgPT4ge1xuICAvLyAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2dyb3RhdG8nIH0sIHBsdW1wKTtcbiAgLy8gICAgIHJldHVybiBvbmUuJHNhdmUoKVxuICAvLyAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ3ZhbGVuY2VDaGlsZHJlbicsIDEwMCwgeyBwZXJtOiAxIH0pKVxuICAvLyAgICAgLnRoZW4oKCkgPT4gb25lLiRnZXQoJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAvLyAgICAgLnRoZW4oKCkgPT4ge1xuICAvLyAgICAgICByZXR1cm4gZXhwZWN0KG9uZS4kZ2V0KCd2YWxlbmNlQ2hpbGRyZW4nKSlcbiAgLy8gICAgICAgLnRvLmV2ZW50dWFsbHkuZGVlcC5lcXVhbCh7IHZhbGVuY2VDaGlsZHJlbjogW3tcbiAgLy8gICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAvLyAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgLy8gICAgICAgICBwZXJtOiAxLFxuICAvLyAgICAgICB9XSB9KTtcbiAgLy8gICAgIH0pXG4gIC8vICAgICAudGhlbigoKSA9PiBvbmUuJG1vZGlmeVJlbGF0aW9uc2hpcCgndmFsZW5jZUNoaWxkcmVuJywgMTAwLCB7IHBlcm06IDIgfSkpXG4gIC8vICAgICAudGhlbigoKSA9PiB7XG4gIC8vICAgICAgIHJldHVybiBleHBlY3Qob25lLiRnZXQoJ3ZhbGVuY2VDaGlsZHJlbicpKVxuICAvLyAgICAgICAudG8uZXZlbnR1YWxseS5kZWVwLmVxdWFsKHsgdmFsZW5jZUNoaWxkcmVuOiBbe1xuICAvLyAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gIC8vICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAvLyAgICAgICAgIHBlcm06IDIsXG4gIC8vICAgICAgIH1dIH0pO1xuICAvLyAgICAgfSk7XG4gIC8vICAgfSk7XG4gIC8vIH0pO1xuICAvL1xuICAvLyBkZXNjcmliZSgnZXZlbnRzJywgKCkgPT4ge1xuICAvLyAgIGl0KCdzaG91bGQgYWxsb3cgc3Vic2NyaXB0aW9uIHRvIG1vZGVsIGRhdGEnLCAoZG9uZSkgPT4ge1xuICAvLyAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAvLyAgICAgbGV0IHBoYXNlID0gMDtcbiAgLy8gICAgIG9uZS4kc2F2ZSgpXG4gIC8vICAgICAudGhlbigoKSA9PiB7XG4gIC8vICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG9uZS4kc3Vic2NyaWJlKCh2KSA9PiB7XG4gIC8vICAgICAgICAgdHJ5IHtcbiAgLy8gICAgICAgICAgIGlmIChwaGFzZSA9PT0gMCkge1xuICAvLyAgICAgICAgICAgICBpZiAodi5uYW1lKSB7XG4gIC8vICAgICAgICAgICAgICAgcGhhc2UgPSAxO1xuICAvLyAgICAgICAgICAgICB9XG4gIC8vICAgICAgICAgICB9XG4gIC8vICAgICAgICAgICBpZiAocGhhc2UgPT09IDEpIHtcbiAgLy8gICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnLCAncG90YXRvJyk7XG4gIC8vICAgICAgICAgICAgIGlmICh2LmlkICE9PSB1bmRlZmluZWQpIHtcbiAgLy8gICAgICAgICAgICAgICBwaGFzZSA9IDI7XG4gIC8vICAgICAgICAgICAgIH1cbiAgLy8gICAgICAgICAgIH1cbiAgLy8gICAgICAgICAgIGlmIChwaGFzZSA9PT0gMikge1xuICAvLyAgICAgICAgICAgICBpZiAodi5uYW1lICE9PSAncG90YXRvJykge1xuICAvLyAgICAgICAgICAgICAgIGV4cGVjdCh2KS50by5oYXZlLnByb3BlcnR5KCduYW1lJywgJ2dyb3RhdG8nKTtcbiAgLy8gICAgICAgICAgICAgICBwaGFzZSA9IDM7XG4gIC8vICAgICAgICAgICAgIH1cbiAgLy8gICAgICAgICAgIH1cbiAgLy8gICAgICAgICAgIGlmIChwaGFzZSA9PT0gMykge1xuICAvLyAgICAgICAgICAgICBpZiAoKHYuY2hpbGRyZW4pICYmICh2LmNoaWxkcmVuLmxlbmd0aCA+IDApKSB7XG4gIC8vICAgICAgICAgICAgICAgZXhwZWN0KHYuY2hpbGRyZW4pLnRvLmRlZXAuZXF1YWwoW3tcbiAgLy8gICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDAsXG4gIC8vICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gIC8vICAgICAgICAgICAgICAgfV0pO1xuICAvLyAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAvLyAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgLy8gICAgICAgICAgICAgfVxuICAvLyAgICAgICAgICAgfVxuICAvLyAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAvLyAgICAgICAgICAgZG9uZShlcnIpO1xuICAvLyAgICAgICAgIH1cbiAgLy8gICAgICAgfSk7XG4gIC8vICAgICB9KVxuICAvLyAgICAgLnRoZW4oKCkgPT4gb25lLiRzZXQoeyBuYW1lOiAnZ3JvdGF0bycgfSkpXG4gIC8vICAgICAudGhlbigoKSA9PiBvbmUuJGFkZCgnY2hpbGRyZW4nLCB7IGNoaWxkX2lkOiAxMDAgfSkpO1xuICAvLyAgIH0pO1xuICAvL1xuICAvLyAgIGl0KCdzaG91bGQgYWxsb3cgc3Vic2NyaXB0aW9uIHRvIG1vZGVsIHNpZGVsb2FkcycsIChkb25lKSA9PiB7XG4gIC8vICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gIC8vICAgICBsZXQgcGhhc2UgPSAwO1xuICAvLyAgICAgb25lLiRzYXZlKClcbiAgLy8gICAgIC50aGVuKCgpID0+IG9uZS4kYWRkKCdjaGlsZHJlbicsIHsgY2hpbGRfaWQ6IDEwMCB9KSlcbiAgLy8gICAgIC8vIC50aGVuKCgpID0+IG9uZS4kZ2V0KFskc2VsZiwgJ2NoaWxkcmVuJ10pLnRoZW4oKHYpID0+IGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHYsIG51bGwsIDIpKSkpXG4gIC8vICAgICAudGhlbigoKSA9PiB7XG4gIC8vICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG9uZS4kc3Vic2NyaWJlKFskYWxsXSwgKHYpID0+IHtcbiAgLy8gICAgICAgICB0cnkge1xuICAvLyAgICAgICAgICAgaWYgKHBoYXNlID09PSAwKSB7XG4gIC8vICAgICAgICAgICAgIGlmICh2Lm5hbWUpIHtcbiAgLy8gICAgICAgICAgICAgICBwaGFzZSA9IDE7XG4gIC8vICAgICAgICAgICAgIH1cbiAgLy8gICAgICAgICAgIH1cbiAgLy8gICAgICAgICAgIGlmIChwaGFzZSA9PT0gMSkge1xuICAvLyAgICAgICAgICAgICBleHBlY3QodikudG8uaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgLy8gICAgICAgICAgICAgZXhwZWN0KHYuY2hpbGRyZW4pLnRvLmRlZXAuZXF1YWwoW3tcbiAgLy8gICAgICAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAvLyAgICAgICAgICAgICAgIHBhcmVudF9pZDogb25lLiRpZCxcbiAgLy8gICAgICAgICAgICAgfV0pO1xuICAvLyAgICAgICAgICAgICBwaGFzZSA9IDI7XG4gIC8vICAgICAgICAgICB9XG4gIC8vICAgICAgICAgICBpZiAocGhhc2UgPT09IDIpIHtcbiAgLy8gICAgICAgICAgICAgaWYgKCh2LmNoaWxkcmVuKSAmJiAodi5jaGlsZHJlbi5sZW5ndGggPiAxKSkge1xuICAvLyAgICAgICAgICAgICAgIGV4cGVjdCh2LmNoaWxkcmVuKS50by5kZWVwLmVxdWFsKFt7XG4gIC8vICAgICAgICAgICAgICAgICBjaGlsZF9pZDogMTAwLFxuICAvLyAgICAgICAgICAgICAgICAgcGFyZW50X2lkOiBvbmUuJGlkLFxuICAvLyAgICAgICAgICAgICAgIH0sIHtcbiAgLy8gICAgICAgICAgICAgICAgIGNoaWxkX2lkOiAxMDEsXG4gIC8vICAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IG9uZS4kaWQsXG4gIC8vICAgICAgICAgICAgICAgfV0pO1xuICAvLyAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAvLyAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgLy8gICAgICAgICAgICAgfVxuICAvLyAgICAgICAgICAgfVxuICAvLyAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAvLyAgICAgICAgICAgZG9uZShlcnIpO1xuICAvLyAgICAgICAgIH1cbiAgLy8gICAgICAgfSk7XG4gIC8vICAgICB9KVxuICAvLyAgICAgLnRoZW4oKCkgPT4gb25lLiRhZGQoJ2NoaWxkcmVuJywgeyBjaGlsZF9pZDogMTAxIH0pKTtcbiAgLy8gICB9KTtcbiAgLy9cbiAgLy8gICBpdCgnc2hvdWxkIHVwZGF0ZSBvbiBjYWNoZWFibGUgcmVhZCBldmVudHMnLCAoZG9uZSkgPT4ge1xuICAvLyAgICAgY29uc3QgRGVsYXlQcm94eSA9IHtcbiAgLy8gICAgICAgZ2V0OiAodGFyZ2V0LCBuYW1lKSA9PiB7XG4gIC8vICAgICAgICAgaWYgKFsncmVhZCcsICd3cml0ZScsICdhZGQnLCAncmVtb3ZlJ10uaW5kZXhPZihuYW1lKSA+PSAwKSB7XG4gIC8vICAgICAgICAgICByZXR1cm4gKC4uLmFyZ3MpID0+IHtcbiAgLy8gICAgICAgICAgICAgcmV0dXJuIEJsdWViaXJkLmRlbGF5KDIwMClcbiAgLy8gICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGFyZ2V0W25hbWVdKC4uLmFyZ3MpKTtcbiAgLy8gICAgICAgICAgIH07XG4gIC8vICAgICAgICAgfSBlbHNlIHtcbiAgLy8gICAgICAgICAgIHJldHVybiB0YXJnZXRbbmFtZV07XG4gIC8vICAgICAgICAgfVxuICAvLyAgICAgICB9LFxuICAvLyAgICAgfTtcbiAgLy8gICAgIGNvbnN0IGRlbGF5ZWRNZW1zdG9yZSA9IG5ldyBQcm94eShuZXcgTWVtb3J5U3RvcmFnZSh7IHRlcm1pbmFsOiB0cnVlIH0pLCBEZWxheVByb3h5KTtcbiAgLy8gICAgIGNvbnN0IGNvbGRNZW1zdG9yZSA9IG5ldyBNZW1vcnlTdG9yYWdlKCk7XG4gIC8vICAgICBjb25zdCBvdGhlclBsdW1wID0gbmV3IFBsdW1wKHtcbiAgLy8gICAgICAgc3RvcmFnZTogW2NvbGRNZW1zdG9yZSwgZGVsYXllZE1lbXN0b3JlXSxcbiAgLy8gICAgICAgdHlwZXM6IFtUZXN0VHlwZV0sXG4gIC8vICAgICB9KTtcbiAgLy8gICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdzbG93dGF0bycgfSwgb3RoZXJQbHVtcCk7XG4gIC8vICAgICBvbmUuJHNhdmUoKVxuICAvLyAgICAgLnRoZW4oKCkgPT4gb25lLiRnZXQoKSlcbiAgLy8gICAgIC50aGVuKCh2YWwpID0+IHtcbiAgLy8gICAgICAgcmV0dXJuIGNvbGRNZW1zdG9yZS53cml0ZShUZXN0VHlwZSwge1xuICAvLyAgICAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAvLyAgICAgICAgIGlkOiB2YWwuaWQsXG4gIC8vICAgICAgIH0pXG4gIC8vICAgICAgIC50aGVuKCgpID0+IHtcbiAgLy8gICAgICAgICBsZXQgcGhhc2UgPSAwO1xuICAvLyAgICAgICAgIGNvbnN0IHR3byA9IG90aGVyUGx1bXAuZmluZCgndGVzdHMnLCB2YWwuaWQpO1xuICAvLyAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IHR3by4kc3Vic2NyaWJlKCh2KSA9PiB7XG4gIC8vICAgICAgICAgICB0cnkge1xuICAvLyAgICAgICAgICAgICBpZiAocGhhc2UgPT09IDApIHtcbiAgLy8gICAgICAgICAgICAgICBpZiAodi5uYW1lKSB7XG4gIC8vICAgICAgICAgICAgICAgICBleHBlY3QodikudG8uaGF2ZS5wcm9wZXJ0eSgnbmFtZScsICdwb3RhdG8nKTtcbiAgLy8gICAgICAgICAgICAgICAgIHBoYXNlID0gMTtcbiAgLy8gICAgICAgICAgICAgICB9XG4gIC8vICAgICAgICAgICAgIH1cbiAgLy8gICAgICAgICAgICAgaWYgKHBoYXNlID09PSAxKSB7XG4gIC8vICAgICAgICAgICAgICAgaWYgKHYubmFtZSAhPT0gJ3BvdGF0bycpIHtcbiAgLy8gICAgICAgICAgICAgICAgIGV4cGVjdCh2KS50by5oYXZlLnByb3BlcnR5KCduYW1lJywgJ3Nsb3d0YXRvJyk7XG4gIC8vICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgLy8gICAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgLy8gICAgICAgICAgICAgICB9XG4gIC8vICAgICAgICAgICAgIH1cbiAgLy8gICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAvLyAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgLy8gICAgICAgICAgICAgZG9uZShlcnIpO1xuICAvLyAgICAgICAgICAgfVxuICAvLyAgICAgICAgIH0pO1xuICAvLyAgICAgICB9KTtcbiAgLy8gICAgIH0pO1xuICAvLyAgIH0pO1xuICAvLyB9KTtcbn0pO1xuIl19
