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
      return expect(one.$get()).to.eventually.have.property('attributes').with.property('name', 'potato');
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
        return expect(two.$get()).to.eventually.have.property('attributes').with.property('name', 'potato');
      });
    });

    it('should create an id when one is unset', function () {
      var noID = new _testType.TestType({ name: 'potato' }, plump);
      return noID.$save().then(function (m) {
        return expect(m.$get()).to.eventually.have.property(_testType.TestType.$schema.$id).that.is.not.null;
      });
    });

    it('should allow data to be deleted', function () {
      var one = new _testType.TestType({ name: 'potato' }, plump);
      return one.$save().then(function () {
        return expect(plump.find('tests', one.$id).$get()).to.eventually.have.property('attributes').with.property('name', 'potato');
      }).then(function () {
        return one.$delete();
      }).then(function () {
        return expect(plump.find('tests', one.$id).$get()).to.eventually.be.null;
      });
    });

    it('should allow fields to be loaded', function () {
      var one = new _testType.TestType({ name: 'p' }, plump);
      return one.$save().then(function () {
        return expect(plump.find('tests', one.$id).$get()).to.eventually.have.property('attributes').with.property('name', 'p');
      }).then(function () {
        return expect(plump.find('tests', one.$id).$get(_index.$all)).to.eventually.deep.equal(_testType.TestType.assign({ name: 'p', id: one.$id }));
      });
    });

    it('should only load base fields on $get()', function () {
      var one = new _testType.TestType({ name: 'potato' }, plump);
      return one.$save().then(function () {
        // const hasManys = Object.keys(TestType.$fields).filter(field => TestType.$fields[field].type === 'hasMany');

        return plump.find('tests', one.$id).$get();
      }).then(function (data) {
        var baseFields = Object.keys(_testType.TestType.$schema.attributes);

        // NOTE: .have.all requires list length equality
        expect(data).to.have.property('attributes').with.all.keys(baseFields);
        expect(data).to.have.property('relationships').that.is.empty; // eslint-disable-line no-unused-expressions
      });
    });

    it('should optimistically update on field updates', function () {
      var one = new _testType.TestType({ name: 'potato' }, plump);
      return one.$save().then(function () {
        return one.$set({ name: 'rutabaga' });
      }).then(function () {
        return expect(one.$get()).to.eventually.have.property('attributes').with.property('name', 'rutabaga');
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
  //       .to.eventually.deep.equal({ children: [{ id: 100 }] });
  //     });
  //   });
  //
  //   it('should add hasMany elements by child field', () => {
  //     const one = new TestType({ name: 'frotato' }, plump);
  //     return one.$save()
  //     .then(() => one.$add('children', 100))
  //     .then(() => {
  //       return expect(one.$get('children'))
  //       .to.eventually.deep.equal({ children: [{ id: 100 }] });
  //     });
  //   });
  //
  //   it('should remove hasMany elements', () => {
  //     const one = new TestType({ name: 'frotato' }, plump);
  //     return one.$save()
  //     .then(() => one.$add('children', 100))
  //     .then(() => {
  //       return expect(one.$get('children'))
  //       .to.eventually.deep.equal({ children: [{ id: 100 }] });
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
  //         id: 100,
  //         perm: 1,
  //       }] });
  //     })
  //     .then(() => one.$modifyRelationship('valenceChildren', 100, { perm: 2 }))
  //     .then(() => {
  //       return expect(one.$get('valenceChildren'))
  //       .to.eventually.deep.equal({ valenceChildren: [{
  //         id: 100,
  //         perm: 2,
  //       }] });
  //     });
  //   });
  // });
  //
  // describe('events', () => {
  //   it('should pass model hasMany changes to other models', () => {
  //     const one = new TestType({ name: 'potato' }, plump);
  //     return one.$save()
  //     .then(() => {
  //       const onePrime = plump.find(TestType.$name, one.$id);
  //       return one.$get('children')
  //       .then((res) => expect(res).to.deep.equal({ children: [] }))
  //       .then(() => onePrime.$get('children'))
  //       .then((res) => expect(res).to.deep.equal({ children: [] }))
  //       .then(() => one.$add('children', 100))
  //       .then(() => one.$get('children'))
  //       .then((res) => expect(res).to.deep.equal({ children: [{ id: 100 }] }))
  //       .then(() => onePrime.$get('children'))
  //       .then((res) => expect(res).to.deep.equal({ children: [{ id: 100 }] }));
  //     });
  //   });
  //
  //   it('should pass model changes to other models', () => {
  //     const one = new TestType({ name: 'potato' }, plump);
  //     return one.$save()
  //     .then(() => {
  //       const onePrime = plump.find(TestType.$name, one.$id);
  //       return one.$get()
  //       .then((res) => expect(res).have.property('attributes').with.property('name', 'potato'))
  //       .then(() => onePrime.$get())
  //       .then((res) => expect(res).have.property('attributes').with.property('name', 'potato'))
  //       .then(() => one.$set('name', 'grotato'))
  //       .then(() => one.$get())
  //       .then((res) => expect(res).have.property('attributes').with.property('name', 'grotato'))
  //       .then(() => onePrime.$get())
  //       .then((res) => expect(res).have.property('attributes').with.property('name', 'grotato'));
  //     });
  //   });
  //
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
  //             expect(v).to.have.property('attributes').with.property('name', 'potato');
  //             if (v.id !== undefined) {
  //               phase = 2;
  //             }
  //           }
  //           if (phase === 2) {
  //             if (v.name !== 'potato') {
  //               expect(v).to.have.property('attributes').with.property('name', 'grotato');
  //               phase = 3;
  //             }
  //           }
  //           if (phase === 3) {
  //             if ((v.children) && (v.children.length > 0)) {
  //               expect(v.children).to.deep.equal([{
  //                 id: 100,
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
  //     .then(() => one.$add('children', 100));
  //   });
  //
  //   it('should allow subscription to model sideloads', (done) => {
  //     const one = new TestType({ name: 'potato' }, plump);
  //     let phase = 0;
  //     one.$save()
  //     .then(() => one.$add('children', 100))
  //     .then(() => {
  //       const subscription = one.$subscribe([$all], (v) => {
  //         try {
  //           if (phase === 0) {
  //             if (v.name) {
  //               phase = 1;
  //             }
  //           }
  //           if (phase === 1) {
  //             expect(v).to.have.property('attributes').with.property('name', 'potato');
  //             expect(v.children).to.deep.equal([{
  //               id: 100,
  //             }]);
  //             phase = 2;
  //           }
  //           if (phase === 2) {
  //             if ((v.children) && (v.children.length > 1)) {
  //               expect(v.children).to.deep.equal([{
  //                 id: 100,
  //               }, {
  //                 id: 101,
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
  //     .then(() => one.$add('children', 101));
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
  //     const delayedMemstore = new Proxy(new MemoryStore({ terminal: true }), DelayProxy);
  //     const coldMemstore = new MemoryStore();
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
  //                 expect(v).to.have.property('attributes').with.property('name', 'potato');
  //                 phase = 1;
  //               }
  //             }
  //             if (phase === 1) {
  //               if (v.name !== 'potato') {
  //                 expect(v).to.have.property('attributes').with.property('name', 'slowtato');
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