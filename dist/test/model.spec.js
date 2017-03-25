/* eslint-env node, mocha*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
var Bluebird = require("bluebird");
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var index_1 = require("../src/index");
var testType_1 = require("./testType");
var memstore2 = new index_1.MemoryStore({ terminal: true });
var plump = new index_1.Plump({
    storage: [memstore2],
    types: [testType_1.TestType],
});
Bluebird.config({
    longStackTraces: true
});
chai.use(chaiAsPromised);
var expect = chai.expect;
describe('model', function () {
    describe('basic functionality', function () {
        it('should return promises to existing data', function () {
            var one = new testType_1.TestType({ id: 1, name: 'potato' }, plump);
            return expect(one.get()).to.eventually.have.deep.property('attributes.name', 'potato');
        });
        // it('should properly serialize its schema', () => {
        //   class MiniTest extends Model {}
        //   MiniTest.fromJSON(TestType.toJSON());
        //   return expect(MiniTest.toJSON()).to.deep.equal(TestType.toJSON());
        // });
        it('should load data from datastores', function () {
            return memstore2.writeAttributes({ typeName: 'tests', attributes: { name: 'potato' } })
                .then(function (createdObject) {
                var two = plump.find('tests', createdObject.id);
                return expect(two.get()).to.eventually.have.deep.property('attributes.name', 'potato');
            });
        });
        it('should create an id when one is unset', function () {
            var noID = new testType_1.TestType({ name: 'potato' }, plump);
            return noID.save().then(function () {
                return expect(noID.get())
                    .to.eventually.have.property('id')
                    .that.is.not.null;
            });
        });
        it('should allow data to be deleted', function () {
            var one = new testType_1.TestType({ name: 'potato' }, plump);
            return one.save()
                .then(function () {
                return expect(plump.find('tests', one.id).get())
                    .to.eventually.have.deep.property('attributes.name', 'potato');
            })
                .then(function () { return one.delete(); })
                .then(function () { return plump.find('tests', one.id).get(); })
                .then(function (v) { return expect(v).to.be.null; });
        });
        it('should allow fields to be loaded', function () {
            var one = new testType_1.TestType({ name: 'p', otherName: 'q' }, plump);
            return one.save()
                .then(function () {
                return expect(plump.find('tests', one.id).get())
                    .to.eventually.have.deep.property('attributes.name', 'p');
            })
                .then(function () {
                return expect(plump.find('tests', one.id).get(['attributes', 'relationships']))
                    .to.eventually.deep.equal({
                    typeName: 'tests',
                    id: one.id,
                    attributes: { name: 'p', otherName: 'q', id: one.id, extended: {} },
                    relationships: {
                        parents: [],
                        children: [],
                        valenceParents: [],
                        valenceChildren: [],
                        queryParents: [],
                        queryChildren: [],
                    },
                });
            });
        });
        it('should dirty-cache updates that have not been saved', function () {
            var one = new testType_1.TestType({ name: 'potato' }, plump);
            return one.save()
                .then(function () {
                one.set({ name: 'rutabaga' });
                return Bluebird.all([
                    expect(one.get()).to.eventually.have.deep.property('attributes.name', 'rutabaga'),
                    expect(plump.get(one)).to.eventually.have.deep.property('attributes.name', 'potato'),
                ]);
            }).then(function () {
                return one.save();
            }).then(function () {
                return expect(plump.get(one))
                    .to.eventually.have.deep.property('attributes.name', 'rutabaga');
            });
        });
        it('should only load base fields on get()', function () {
            var one = new testType_1.TestType({ name: 'potato', otherName: 'schmotato' }, plump);
            return one.save()
                .then(function () {
                // const hasManys = Object.keys(TestType.$fields).filter(field => TestType.$fields[field].type === 'hasMany');
                return plump.find('tests', one.id).get();
            }).then(function (data) {
                var baseFields = Object.keys(testType_1.TestType.schema.attributes);
                // NOTE: .have.all requires list length equality
                expect(data).to.have.property('attributes')
                    .with.all.keys(baseFields);
                expect(data).to.have.property('relationships').that.is.empty; // eslint-disable-line no-unused-expressions
            });
        });
        it('should optimistically update on field updates', function () {
            var one = new testType_1.TestType({ name: 'potato' }, plump);
            return one.save()
                .then(function () { return one.set({ name: 'rutabaga' }); })
                .then(function () { return expect(one.get()).to.eventually.have.deep.property('attributes.name', 'rutabaga'); });
        });
    });
    describe('relationships', function () {
        it('should show empty hasMany lists as {key: []}', function () {
            var one = new testType_1.TestType({ name: 'frotato' }, plump);
            return one.save()
                .then(function () { return one.get('relationships.children'); })
                .then(function (v) { return expect(v.relationships.children).to.deep.equal([]); });
        });
        it('should add hasMany elements', function () {
            var one = new testType_1.TestType({ name: 'frotato' }, plump);
            return one.save()
                .then(function () { return one.add('children', { id: 100 }).save(); })
                .then(function () { return one.get('relationships.children'); })
                .then(function (v) { return expect(v.relationships.children).to.deep.equal([{ id: 100 }]); });
        });
        it('should add hasMany elements by child field', function () {
            var one = new testType_1.TestType({ name: 'frotato' }, plump);
            return one.save()
                .then(function () { return one.add('children', { id: 100 }).save(); })
                .then(function () { return one.get('relationships.children'); })
                .then(function (v) { return expect(v.relationships.children).to.deep.equal([{ id: 100 }]); });
        });
        it('should remove hasMany elements', function () {
            var one = new testType_1.TestType({ name: 'frotato' }, plump);
            return one.save()
                .then(function () { return one.add('children', { id: 100 }).save(); })
                .then(function () { return one.get('relationships.children'); })
                .then(function (v) { return expect(v.relationships.children).to.deep.equal([{ id: 100 }]); })
                .then(function () { return one.remove('children', { id: 100 }).save(); })
                .then(function () { return one.get('relationships.children'); })
                .then(function (v) { return expect(v.relationships.children).to.deep.equal([]); });
        });
        it('should include valence in hasMany operations', function () {
            var one = new testType_1.TestType({ name: 'grotato' }, plump);
            return one.save()
                .then(function () { return one.add('valenceChildren', { id: 100, meta: { perm: 1 } }).save(); })
                .then(function () { return one.get('relationships.valenceChildren'); })
                .then(function (v) { return expect(v.relationships.valenceChildren).to.deep.equal([{ id: 100, meta: { perm: 1 } }]); })
                .then(function () { return one.modifyRelationship('valenceChildren', { id: 100, meta: { perm: 2 } }).save(); })
                .then(function () { return one.get('relationships.valenceChildren'); })
                .then(function (v) { return expect(v.relationships.valenceChildren).to.deep.equal([{ id: 100, meta: { perm: 2 } }]); });
        });
    });
    describe('events', function () {
        it('should pass model hasMany changes to other models', function () {
            var one = new testType_1.TestType({ name: 'potato' }, plump);
            return one.save()
                .then(function () {
                var onePrime = plump.find(testType_1.TestType.typeName, one.id);
                return one.get('relationships.children')
                    .then(function (res) { return expect(res).to.have.property('relationships')
                    .that.deep.equals({ children: [] }); })
                    .then(function () { return onePrime.get('relationships.children'); })
                    .then(function (res) { return expect(res).to.have.property('relationships')
                    .that.deep.equals({ children: [] }); })
                    .then(function () { return one.add('children', { id: 100 }).save(); })
                    .then(function () { return one.get('relationships.children'); })
                    .then(function (res) { return expect(res).to.have.property('relationships')
                    .that.deep.equals({ children: [{ id: 100 }] }); })
                    .then(function () { return onePrime.get('relationships.children'); })
                    .then(function (res) { return expect(res).to.have.property('relationships')
                    .that.deep.equals({ children: [{ id: 100 }] }); });
            });
        });
        it('should pass model changes to other models', function () {
            var one = new testType_1.TestType({ name: 'potato' }, plump);
            return one.save()
                .then(function () {
                var onePrime = plump.find(testType_1.TestType.typeName, one.id);
                return one.get()
                    .then(function (res) { return expect(res).have.deep.property('attributes.name', 'potato'); })
                    .then(function () { return onePrime.get(); })
                    .then(function (res) { return expect(res).have.deep.property('attributes.name', 'potato'); })
                    .then(function () { return one.set({ name: 'grotato' }).save(); })
                    .then(function () { return one.get(); })
                    .then(function (res) { return expect(res).have.deep.property('attributes.name', 'grotato'); })
                    .then(function () { return onePrime.get(); })
                    .then(function (res) { return expect(res).have.deep.property('attributes.name', 'grotato'); });
            });
        });
        it('should allow subscription to model data', function () {
            return new Bluebird(function (resolve, reject) {
                var one = new testType_1.TestType({ name: 'potato' }, plump);
                var phase = 0;
                one.save()
                    .then(function () {
                    var subscription = one.subscribe({
                        error: function (err) {
                            throw err;
                        },
                        complete: function () { },
                        next: function (v) {
                            try {
                                if (phase === 0) {
                                    if (v.attributes.name) {
                                        phase = 1;
                                    }
                                }
                                if (phase === 1) {
                                    expect(v).to.have.deep.property('attributes.name', 'potato');
                                    if (v.id !== undefined) {
                                        phase = 2;
                                    }
                                }
                                if (phase === 2) {
                                    if (v.attributes.name !== 'potato') {
                                        expect(v).to.have.deep.property('attributes.name', 'grotato');
                                        phase = 3;
                                        subscription.unsubscribe();
                                        resolve();
                                    }
                                }
                            }
                            catch (err) {
                                reject(err);
                            }
                        }
                    });
                })
                    .then(function () { return one.set({ name: 'grotato' }).save(); });
            });
        });
        it('should allow subscription to model sideloads', function () {
            return new Bluebird(function (resolve, reject) {
                var one = new testType_1.TestType({ name: 'potato' }, plump);
                var phase = 0;
                one.save()
                    .then(function () { return one.add('children', { id: 100 }).save(); })
                    .then(function () {
                    var subscription = one.subscribe(['attributes', 'relationships'], {
                        error: function (err) {
                            throw err;
                        },
                        complete: function () { },
                        next: function (v) {
                            try {
                                if (phase === 0) {
                                    if (v.attributes) {
                                        expect(v).to.have.property('attributes');
                                        phase = 1;
                                    }
                                }
                                if (phase === 1 && v.relationships && v.relationships.children) {
                                    expect(v.relationships.children).to.deep.equal([{ id: 100 }]);
                                    phase = 2;
                                }
                                if (phase === 2) {
                                    if ((v.relationships.children) && (v.relationships.children.length > 1)) {
                                        expect(v.relationships.children).to.deep.equal([
                                            { id: 100 },
                                            { id: 101 },
                                        ]);
                                        subscription.unsubscribe();
                                        resolve();
                                    }
                                }
                            }
                            catch (err) {
                                reject(err);
                            }
                        }
                    });
                })
                    .then(function () { return one.add('children', { id: 101 }).save(); });
            });
        });
        it('should update on cacheable read events', function () {
            return new Bluebird(function (resolve, reject) {
                var DelayProxy = {
                    get: function (target, name) {
                        if (['read', 'write', 'add', 'remove'].indexOf(name) >= 0) {
                            return function () {
                                var args = [];
                                for (var _i = 0; _i < arguments.length; _i++) {
                                    args[_i] = arguments[_i];
                                }
                                return Bluebird.delay(200)
                                    .then(function () { return target[name].apply(target, args); });
                            };
                        }
                        else {
                            return target[name];
                        }
                    },
                };
                var delayedMemstore = new Proxy(new index_1.MemoryStore({ terminal: true }), DelayProxy);
                var coldMemstore = new index_1.MemoryStore();
                var otherPlump = new index_1.Plump({
                    storage: [coldMemstore, delayedMemstore],
                    types: [testType_1.TestType],
                });
                var one = new testType_1.TestType({ name: 'slowtato' }, otherPlump);
                one.save()
                    .then(function () { return one.get(); })
                    .then(function (val) {
                    return coldMemstore.cache({
                        id: val.id,
                        typeName: 'tests',
                        attributes: {
                            name: 'potato',
                            id: val.id,
                        },
                    })
                        .then(function () {
                        var phase = 0;
                        var two = otherPlump.find('tests', val.id);
                        var subscription = two.subscribe({
                            error: function (err) {
                                throw err;
                            },
                            complete: function () { },
                            next: function (v) {
                                try {
                                    if (phase === 0) {
                                        if (v.attributes.name) {
                                            expect(v).to.have.property('attributes').with.property('name', 'potato');
                                            phase = 1;
                                        }
                                    }
                                    if (phase === 1) {
                                        if (v.attributes.name !== 'potato') {
                                            expect(v).to.have.property('attributes').with.property('name', 'slowtato');
                                            subscription.unsubscribe();
                                            resolve();
                                        }
                                    }
                                }
                                catch (err) {
                                    subscription.unsubscribe();
                                    reject(err);
                                }
                            }
                        });
                    });
                });
            });
        });
    });
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQzs0Q0FDekUsS0FBSyxHQUFHLENBQUMsQ0FBQzt3Q0FDWixDQUFDO29DQUNILENBQUM7b0NBQ0QsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7d0NBQ2hCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7NENBQ25DLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQzs0Q0FDM0UsWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDOzRDQUMzQixPQUFPLEVBQUUsQ0FBQzt3Q0FDWixDQUFDO29DQUNILENBQUM7Z0NBQ0gsQ0FBQztnQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29DQUNiLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQ0FDM0IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dDQUNkLENBQUM7NEJBQ0gsQ0FBQzt5QkFDRixDQUFDLENBQUM7b0JBQ0wsQ0FBQyxDQUFDLENBQUM7Z0JBQ0wsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsImZpbGUiOiJtb2RlbC5zcGVjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBub2RlLCBtb2NoYSovXG5cbmltcG9ydCAnbW9jaGEnO1xuaW1wb3J0ICogYXMgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0ICogYXMgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCAqIGFzIGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuXG5pbXBvcnQgeyBQbHVtcCwgTWVtb3J5U3RvcmUgfSBmcm9tICcuLi9zcmMvaW5kZXgnO1xuaW1wb3J0IHsgVGVzdFR5cGUgfSBmcm9tICcuL3Rlc3RUeXBlJztcblxuY29uc3QgbWVtc3RvcmUyID0gbmV3IE1lbW9yeVN0b3JlKHsgdGVybWluYWw6IHRydWUgfSk7XG5cbmNvbnN0IHBsdW1wID0gbmV3IFBsdW1wKHtcbiAgc3RvcmFnZTogW21lbXN0b3JlMl0sXG4gIHR5cGVzOiBbVGVzdFR5cGVdLFxufSk7XG5cbkJsdWViaXJkLmNvbmZpZyh7XG4gIGxvbmdTdGFja1RyYWNlczogdHJ1ZVxufSk7XG5cbmNoYWkudXNlKGNoYWlBc1Byb21pc2VkKTtcbmNvbnN0IGV4cGVjdCA9IGNoYWkuZXhwZWN0O1xuXG5kZXNjcmliZSgnbW9kZWwnLCAoKSA9PiB7XG4gIGRlc2NyaWJlKCdiYXNpYyBmdW5jdGlvbmFsaXR5JywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcmV0dXJuIHByb21pc2VzIHRvIGV4aXN0aW5nIGRhdGEnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBpZDogMSwgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIGV4cGVjdChvbmUuZ2V0KCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5kZWVwLnByb3BlcnR5KCdhdHRyaWJ1dGVzLm5hbWUnLCAncG90YXRvJyk7XG4gICAgfSk7XG5cbiAgICAvLyBpdCgnc2hvdWxkIHByb3Blcmx5IHNlcmlhbGl6ZSBpdHMgc2NoZW1hJywgKCkgPT4ge1xuICAgIC8vICAgY2xhc3MgTWluaVRlc3QgZXh0ZW5kcyBNb2RlbCB7fVxuICAgIC8vICAgTWluaVRlc3QuZnJvbUpTT04oVGVzdFR5cGUudG9KU09OKCkpO1xuICAgIC8vICAgcmV0dXJuIGV4cGVjdChNaW5pVGVzdC50b0pTT04oKSkudG8uZGVlcC5lcXVhbChUZXN0VHlwZS50b0pTT04oKSk7XG4gICAgLy8gfSk7XG5cbiAgICBpdCgnc2hvdWxkIGxvYWQgZGF0YSBmcm9tIGRhdGFzdG9yZXMnLCAoKSA9PiB7XG4gICAgICByZXR1cm4gbWVtc3RvcmUyLndyaXRlQXR0cmlidXRlcyh7IHR5cGVOYW1lOiAndGVzdHMnLCBhdHRyaWJ1dGVzOiB7IG5hbWU6ICdwb3RhdG8nIH0gfSlcbiAgICAgIC50aGVuKGNyZWF0ZWRPYmplY3QgPT4ge1xuICAgICAgICBjb25zdCB0d28gPSBwbHVtcC5maW5kKCd0ZXN0cycsIGNyZWF0ZWRPYmplY3QuaWQpO1xuICAgICAgICByZXR1cm4gZXhwZWN0KHR3by5nZXQoKSkudG8uZXZlbnR1YWxseS5oYXZlLmRlZXAucHJvcGVydHkoJ2F0dHJpYnV0ZXMubmFtZScsICdwb3RhdG8nKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgYW4gaWQgd2hlbiBvbmUgaXMgdW5zZXQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBub0lEID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG5vSUQuc2F2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KG5vSUQuZ2V0KCkpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmhhdmUucHJvcGVydHkoJ2lkJylcbiAgICAgICAgLnRoYXQuaXMubm90Lm51bGw7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWxsb3cgZGF0YSB0byBiZSBkZWxldGVkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS5zYXZlKClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdChwbHVtcC5maW5kKCd0ZXN0cycsIG9uZS5pZCkuZ2V0KCkpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmhhdmUuZGVlcC5wcm9wZXJ0eSgnYXR0cmlidXRlcy5uYW1lJywgJ3BvdGF0bycpO1xuICAgICAgfSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS5kZWxldGUoKSlcbiAgICAgIC50aGVuKCgpID0+IHBsdW1wLmZpbmQoJ3Rlc3RzJywgb25lLmlkKS5nZXQoKSlcbiAgICAgIC50aGVuKCh2KSA9PiBleHBlY3QodikudG8uYmUubnVsbCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFsbG93IGZpZWxkcyB0byBiZSBsb2FkZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncCcsIG90aGVyTmFtZTogJ3EnIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3QocGx1bXAuZmluZCgndGVzdHMnLCBvbmUuaWQpLmdldCgpKVxuICAgICAgICAudG8uZXZlbnR1YWxseS5oYXZlLmRlZXAucHJvcGVydHkoJ2F0dHJpYnV0ZXMubmFtZScsICdwJyk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gZXhwZWN0KHBsdW1wLmZpbmQoJ3Rlc3RzJywgb25lLmlkKS5nZXQoWydhdHRyaWJ1dGVzJywgJ3JlbGF0aW9uc2hpcHMnXSkpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmRlZXAuZXF1YWwoXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZU5hbWU6ICd0ZXN0cycsXG4gICAgICAgICAgICBpZDogb25lLmlkLFxuICAgICAgICAgICAgYXR0cmlidXRlczogeyBuYW1lOiAncCcsIG90aGVyTmFtZTogJ3EnLCBpZDogb25lLmlkLCBleHRlbmRlZDoge30gfSxcbiAgICAgICAgICAgIHJlbGF0aW9uc2hpcHM6IHtcbiAgICAgICAgICAgICAgcGFyZW50czogW10sXG4gICAgICAgICAgICAgIGNoaWxkcmVuOiBbXSxcbiAgICAgICAgICAgICAgdmFsZW5jZVBhcmVudHM6IFtdLFxuICAgICAgICAgICAgICB2YWxlbmNlQ2hpbGRyZW46IFtdLFxuICAgICAgICAgICAgICBxdWVyeVBhcmVudHM6IFtdLFxuICAgICAgICAgICAgICBxdWVyeUNoaWxkcmVuOiBbXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGRpcnR5LWNhY2hlIHVwZGF0ZXMgdGhhdCBoYXZlIG5vdCBiZWVuIHNhdmVkJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS5zYXZlKClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgb25lLnNldCh7IG5hbWU6ICdydXRhYmFnYScgfSk7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICAgIGV4cGVjdChvbmUuZ2V0KCkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5kZWVwLnByb3BlcnR5KCdhdHRyaWJ1dGVzLm5hbWUnLCAncnV0YWJhZ2EnKSxcbiAgICAgICAgICBleHBlY3QocGx1bXAuZ2V0KG9uZSkpLnRvLmV2ZW50dWFsbHkuaGF2ZS5kZWVwLnByb3BlcnR5KCdhdHRyaWJ1dGVzLm5hbWUnLCAncG90YXRvJyksXG4gICAgICAgIF0pO1xuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBvbmUuc2F2ZSgpO1xuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBleHBlY3QocGx1bXAuZ2V0KG9uZSkpXG4gICAgICAgIC50by5ldmVudHVhbGx5LmhhdmUuZGVlcC5wcm9wZXJ0eSgnYXR0cmlidXRlcy5uYW1lJywgJ3J1dGFiYWdhJyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgb25seSBsb2FkIGJhc2UgZmllbGRzIG9uIGdldCgpJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycsIG90aGVyTmFtZTogJ3NjaG1vdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS5zYXZlKClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgLy8gY29uc3QgaGFzTWFueXMgPSBPYmplY3Qua2V5cyhUZXN0VHlwZS4kZmllbGRzKS5maWx0ZXIoZmllbGQgPT4gVGVzdFR5cGUuJGZpZWxkc1tmaWVsZF0udHlwZSA9PT0gJ2hhc01hbnknKTtcblxuICAgICAgICByZXR1cm4gcGx1bXAuZmluZCgndGVzdHMnLCBvbmUuaWQpLmdldCgpO1xuICAgICAgfSkudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc3QgYmFzZUZpZWxkcyA9IE9iamVjdC5rZXlzKFRlc3RUeXBlLnNjaGVtYS5hdHRyaWJ1dGVzKTtcblxuICAgICAgICAvLyBOT1RFOiAuaGF2ZS5hbGwgcmVxdWlyZXMgbGlzdCBsZW5ndGggZXF1YWxpdHlcbiAgICAgICAgZXhwZWN0KGRhdGEpLnRvLmhhdmUucHJvcGVydHkoJ2F0dHJpYnV0ZXMnKVxuICAgICAgICAud2l0aC5hbGwua2V5cyhiYXNlRmllbGRzKTtcbiAgICAgICAgZXhwZWN0KGRhdGEpLnRvLmhhdmUucHJvcGVydHkoJ3JlbGF0aW9uc2hpcHMnKS50aGF0LmlzLmVtcHR5OyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC1leHByZXNzaW9uc1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIG9wdGltaXN0aWNhbGx5IHVwZGF0ZSBvbiBmaWVsZCB1cGRhdGVzJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ3BvdGF0bycgfSwgcGx1bXApO1xuICAgICAgcmV0dXJuIG9uZS5zYXZlKClcbiAgICAgIC50aGVuKCgpID0+IG9uZS5zZXQoeyBuYW1lOiAncnV0YWJhZ2EnIH0pKVxuICAgICAgLnRoZW4oKCkgPT4gZXhwZWN0KG9uZS5nZXQoKSkudG8uZXZlbnR1YWxseS5oYXZlLmRlZXAucHJvcGVydHkoJ2F0dHJpYnV0ZXMubmFtZScsICdydXRhYmFnYScpKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3JlbGF0aW9uc2hpcHMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBzaG93IGVtcHR5IGhhc01hbnkgbGlzdHMgYXMge2tleTogW119JywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2Zyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuZ2V0KCdyZWxhdGlvbnNoaXBzLmNoaWxkcmVuJykpXG4gICAgICAudGhlbigodikgPT4gZXhwZWN0KHYucmVsYXRpb25zaGlwcy5jaGlsZHJlbikudG8uZGVlcC5lcXVhbChbXSkpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhZGQgaGFzTWFueSBlbGVtZW50cycsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLnNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLmFkZCgnY2hpbGRyZW4nLCB7IGlkOiAxMDAgfSkuc2F2ZSgpKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLmdldCgncmVsYXRpb25zaGlwcy5jaGlsZHJlbicpKVxuICAgICAgLnRoZW4oKHYpID0+IGV4cGVjdCh2LnJlbGF0aW9uc2hpcHMuY2hpbGRyZW4pLnRvLmRlZXAuZXF1YWwoW3sgaWQ6IDEwMCB9XSkpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhZGQgaGFzTWFueSBlbGVtZW50cyBieSBjaGlsZCBmaWVsZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLnNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLmFkZCgnY2hpbGRyZW4nLCB7IGlkOiAxMDAgfSkuc2F2ZSgpKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLmdldCgncmVsYXRpb25zaGlwcy5jaGlsZHJlbicpKVxuICAgICAgLnRoZW4oKHYpID0+IGV4cGVjdCh2LnJlbGF0aW9uc2hpcHMuY2hpbGRyZW4pLnRvLmRlZXAuZXF1YWwoW3sgaWQ6IDEwMCB9XSkpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZW1vdmUgaGFzTWFueSBlbGVtZW50cycsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdmcm90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLnNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLmFkZCgnY2hpbGRyZW4nLCB7IGlkOiAxMDAgfSkuc2F2ZSgpKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLmdldCgncmVsYXRpb25zaGlwcy5jaGlsZHJlbicpKVxuICAgICAgLnRoZW4oKHYpID0+IGV4cGVjdCh2LnJlbGF0aW9uc2hpcHMuY2hpbGRyZW4pLnRvLmRlZXAuZXF1YWwoW3sgaWQ6IDEwMCB9XSkpXG4gICAgICAudGhlbigoKSA9PiBvbmUucmVtb3ZlKCdjaGlsZHJlbicsIHsgaWQ6IDEwMCB9KS5zYXZlKCkpXG4gICAgICAudGhlbigoKSA9PiBvbmUuZ2V0KCdyZWxhdGlvbnNoaXBzLmNoaWxkcmVuJykpXG4gICAgICAudGhlbigodikgPT4gZXhwZWN0KHYucmVsYXRpb25zaGlwcy5jaGlsZHJlbikudG8uZGVlcC5lcXVhbChbXSkpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBpbmNsdWRlIHZhbGVuY2UgaW4gaGFzTWFueSBvcGVyYXRpb25zJywgKCkgPT4ge1xuICAgICAgY29uc3Qgb25lID0gbmV3IFRlc3RUeXBlKHsgbmFtZTogJ2dyb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiBvbmUuYWRkKCd2YWxlbmNlQ2hpbGRyZW4nLCB7IGlkOiAxMDAsIG1ldGE6IHsgcGVybTogMSB9IH0pLnNhdmUoKSlcbiAgICAgIC50aGVuKCgpID0+IG9uZS5nZXQoJ3JlbGF0aW9uc2hpcHMudmFsZW5jZUNoaWxkcmVuJykpXG4gICAgICAudGhlbigodikgPT4gZXhwZWN0KHYucmVsYXRpb25zaGlwcy52YWxlbmNlQ2hpbGRyZW4pLnRvLmRlZXAuZXF1YWwoW3sgaWQ6IDEwMCwgbWV0YTogeyBwZXJtOiAxIH0gfV0pKVxuICAgICAgLnRoZW4oKCkgPT4gb25lLm1vZGlmeVJlbGF0aW9uc2hpcCgndmFsZW5jZUNoaWxkcmVuJywgeyBpZDogMTAwLCBtZXRhOiB7IHBlcm06IDIgfSB9KS5zYXZlKCkpXG4gICAgICAudGhlbigoKSA9PiBvbmUuZ2V0KCdyZWxhdGlvbnNoaXBzLnZhbGVuY2VDaGlsZHJlbicpKVxuICAgICAgLnRoZW4oKHYpID0+IGV4cGVjdCh2LnJlbGF0aW9uc2hpcHMudmFsZW5jZUNoaWxkcmVuKS50by5kZWVwLmVxdWFsKFt7IGlkOiAxMDAsIG1ldGE6IHsgcGVybTogMiB9IH1dKSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdldmVudHMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBwYXNzIG1vZGVsIGhhc01hbnkgY2hhbmdlcyB0byBvdGhlciBtb2RlbHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICByZXR1cm4gb25lLnNhdmUoKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCBvbmVQcmltZSA9IHBsdW1wLmZpbmQoVGVzdFR5cGUudHlwZU5hbWUsIG9uZS5pZCk7XG4gICAgICAgIHJldHVybiBvbmUuZ2V0KCdyZWxhdGlvbnNoaXBzLmNoaWxkcmVuJylcbiAgICAgICAgLnRoZW4oKHJlcykgPT4gZXhwZWN0KHJlcykudG8uaGF2ZS5wcm9wZXJ0eSgncmVsYXRpb25zaGlwcycpXG4gICAgICAgIC50aGF0LmRlZXAuZXF1YWxzKHsgY2hpbGRyZW46IFtdIH0pKVxuICAgICAgICAudGhlbigoKSA9PiBvbmVQcmltZS5nZXQoJ3JlbGF0aW9uc2hpcHMuY2hpbGRyZW4nKSlcbiAgICAgICAgLnRoZW4oKHJlcykgPT4gZXhwZWN0KHJlcykudG8uaGF2ZS5wcm9wZXJ0eSgncmVsYXRpb25zaGlwcycpXG4gICAgICAgIC50aGF0LmRlZXAuZXF1YWxzKHsgY2hpbGRyZW46IFtdIH0pKVxuICAgICAgICAudGhlbigoKSA9PiBvbmUuYWRkKCdjaGlsZHJlbicsIHsgaWQ6IDEwMCB9KS5zYXZlKCkpXG4gICAgICAgIC50aGVuKCgpID0+IG9uZS5nZXQoJ3JlbGF0aW9uc2hpcHMuY2hpbGRyZW4nKSlcbiAgICAgICAgLnRoZW4oKHJlcykgPT4gZXhwZWN0KHJlcykudG8uaGF2ZS5wcm9wZXJ0eSgncmVsYXRpb25zaGlwcycpXG4gICAgICAgIC50aGF0LmRlZXAuZXF1YWxzKHsgY2hpbGRyZW46IFt7IGlkOiAxMDAgfV0gfSkpXG4gICAgICAgIC50aGVuKCgpID0+IG9uZVByaW1lLmdldCgncmVsYXRpb25zaGlwcy5jaGlsZHJlbicpKVxuICAgICAgICAudGhlbigocmVzKSA9PiBleHBlY3QocmVzKS50by5oYXZlLnByb3BlcnR5KCdyZWxhdGlvbnNoaXBzJylcbiAgICAgICAgLnRoYXQuZGVlcC5lcXVhbHMoeyBjaGlsZHJlbjogW3sgaWQ6IDEwMCB9XSB9KSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcGFzcyBtb2RlbCBjaGFuZ2VzIHRvIG90aGVyIG1vZGVscycsICgpID0+IHtcbiAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgIHJldHVybiBvbmUuc2F2ZSgpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IG9uZVByaW1lID0gcGx1bXAuZmluZChUZXN0VHlwZS50eXBlTmFtZSwgb25lLmlkKTtcbiAgICAgICAgcmV0dXJuIG9uZS5nZXQoKVxuICAgICAgICAudGhlbigocmVzKSA9PiBleHBlY3QocmVzKS5oYXZlLmRlZXAucHJvcGVydHkoJ2F0dHJpYnV0ZXMubmFtZScsICdwb3RhdG8nKSlcbiAgICAgICAgLnRoZW4oKCkgPT4gb25lUHJpbWUuZ2V0KCkpXG4gICAgICAgIC50aGVuKChyZXMpID0+IGV4cGVjdChyZXMpLmhhdmUuZGVlcC5wcm9wZXJ0eSgnYXR0cmlidXRlcy5uYW1lJywgJ3BvdGF0bycpKVxuICAgICAgICAudGhlbigoKSA9PiBvbmUuc2V0KHsgbmFtZTogJ2dyb3RhdG8nIH0pLnNhdmUoKSlcbiAgICAgICAgLnRoZW4oKCkgPT4gb25lLmdldCgpKVxuICAgICAgICAudGhlbigocmVzKSA9PiBleHBlY3QocmVzKS5oYXZlLmRlZXAucHJvcGVydHkoJ2F0dHJpYnV0ZXMubmFtZScsICdncm90YXRvJykpXG4gICAgICAgIC50aGVuKCgpID0+IG9uZVByaW1lLmdldCgpKVxuICAgICAgICAudGhlbigocmVzKSA9PiBleHBlY3QocmVzKS5oYXZlLmRlZXAucHJvcGVydHkoJ2F0dHJpYnV0ZXMubmFtZScsICdncm90YXRvJykpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFsbG93IHN1YnNjcmlwdGlvbiB0byBtb2RlbCBkYXRhJywgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBCbHVlYmlyZCgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdwb3RhdG8nIH0sIHBsdW1wKTtcbiAgICAgICAgbGV0IHBoYXNlID0gMDtcbiAgICAgICAgb25lLnNhdmUoKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gb25lLnN1YnNjcmliZSh7XG4gICAgICAgICAgICBlcnJvcjogKGVycikgPT4ge1xuICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHsgLyogbm9vcCAqLyB9LFxuICAgICAgICAgICAgbmV4dDogKHYpID0+IHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAocGhhc2UgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgIGlmICh2LmF0dHJpYnV0ZXMubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBwaGFzZSA9IDE7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUuZGVlcC5wcm9wZXJ0eSgnYXR0cmlidXRlcy5uYW1lJywgJ3BvdGF0bycpO1xuICAgICAgICAgICAgICAgICAgaWYgKHYuaWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBwaGFzZSA9IDI7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgaWYgKHYuYXR0cmlidXRlcy5uYW1lICE9PSAncG90YXRvJykge1xuICAgICAgICAgICAgICAgICAgICBleHBlY3QodikudG8uaGF2ZS5kZWVwLnByb3BlcnR5KCdhdHRyaWJ1dGVzLm5hbWUnLCAnZ3JvdGF0bycpO1xuICAgICAgICAgICAgICAgICAgICBwaGFzZSA9IDM7XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiBvbmUuc2V0KHsgbmFtZTogJ2dyb3RhdG8nIH0pLnNhdmUoKSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWxsb3cgc3Vic2NyaXB0aW9uIHRvIG1vZGVsIHNpZGVsb2FkcycsICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgQmx1ZWJpcmQoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCBvbmUgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAncG90YXRvJyB9LCBwbHVtcCk7XG4gICAgICAgIGxldCBwaGFzZSA9IDA7XG4gICAgICAgIG9uZS5zYXZlKClcbiAgICAgICAgLnRoZW4oKCkgPT4gb25lLmFkZCgnY2hpbGRyZW4nLCB7IGlkOiAxMDAgfSkuc2F2ZSgpKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gb25lLnN1YnNjcmliZShbJ2F0dHJpYnV0ZXMnLCAncmVsYXRpb25zaGlwcyddLCB7XG4gICAgICAgICAgICBlcnJvcjogKGVycikgPT4ge1xuICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHsgLyogbm9vcCAqLyB9LFxuICAgICAgICAgICAgbmV4dDogKHYpID0+IHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAocGhhc2UgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgIGlmICh2LmF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ2F0dHJpYnV0ZXMnKTtcbiAgICAgICAgICAgICAgICAgICAgcGhhc2UgPSAxO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocGhhc2UgPT09IDEgJiYgdi5yZWxhdGlvbnNoaXBzICYmIHYucmVsYXRpb25zaGlwcy5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgZXhwZWN0KHYucmVsYXRpb25zaGlwcy5jaGlsZHJlbikudG8uZGVlcC5lcXVhbChbeyBpZDogMTAwIH1dKTtcbiAgICAgICAgICAgICAgICAgIHBoYXNlID0gMjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHBoYXNlID09PSAyKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoKHYucmVsYXRpb25zaGlwcy5jaGlsZHJlbikgJiYgKHYucmVsYXRpb25zaGlwcy5jaGlsZHJlbi5sZW5ndGggPiAxKSkge1xuICAgICAgICAgICAgICAgICAgICBleHBlY3Qodi5yZWxhdGlvbnNoaXBzLmNoaWxkcmVuKS50by5kZWVwLmVxdWFsKFtcbiAgICAgICAgICAgICAgICAgICAgICB7IGlkOiAxMDAgfSxcbiAgICAgICAgICAgICAgICAgICAgICB7IGlkOiAxMDEgfSxcbiAgICAgICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiBvbmUuYWRkKCdjaGlsZHJlbicsIHsgaWQ6IDEwMSB9KS5zYXZlKCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHVwZGF0ZSBvbiBjYWNoZWFibGUgcmVhZCBldmVudHMnLCAoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IEJsdWViaXJkKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgRGVsYXlQcm94eSA9IHtcbiAgICAgICAgICBnZXQ6ICh0YXJnZXQsIG5hbWUpID0+IHtcbiAgICAgICAgICAgIGlmIChbJ3JlYWQnLCAnd3JpdGUnLCAnYWRkJywgJ3JlbW92ZSddLmluZGV4T2YobmFtZSkgPj0gMCkge1xuICAgICAgICAgICAgICByZXR1cm4gKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQmx1ZWJpcmQuZGVsYXkoMjAwKVxuICAgICAgICAgICAgICAudGhlbigoKSA9PiB0YXJnZXRbbmFtZV0oLi4uYXJncykpO1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRhcmdldFtuYW1lXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBkZWxheWVkTWVtc3RvcmUgPSBuZXcgUHJveHkobmV3IE1lbW9yeVN0b3JlKHsgdGVybWluYWw6IHRydWUgfSksIERlbGF5UHJveHkpO1xuICAgICAgICBjb25zdCBjb2xkTWVtc3RvcmUgPSBuZXcgTWVtb3J5U3RvcmUoKTtcbiAgICAgICAgY29uc3Qgb3RoZXJQbHVtcCA9IG5ldyBQbHVtcCh7XG4gICAgICAgICAgc3RvcmFnZTogW2NvbGRNZW1zdG9yZSwgZGVsYXllZE1lbXN0b3JlXSxcbiAgICAgICAgICB0eXBlczogW1Rlc3RUeXBlXSxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IG9uZSA9IG5ldyBUZXN0VHlwZSh7IG5hbWU6ICdzbG93dGF0bycgfSwgb3RoZXJQbHVtcCk7XG4gICAgICAgIG9uZS5zYXZlKClcbiAgICAgICAgLnRoZW4oKCkgPT4gb25lLmdldCgpKVxuICAgICAgICAudGhlbigodmFsKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGNvbGRNZW1zdG9yZS5jYWNoZSh7XG4gICAgICAgICAgICBpZDogdmFsLmlkLFxuICAgICAgICAgICAgdHlwZU5hbWU6ICd0ZXN0cycsXG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgIG5hbWU6ICdwb3RhdG8nLFxuICAgICAgICAgICAgICBpZDogdmFsLmlkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGxldCBwaGFzZSA9IDA7XG4gICAgICAgICAgICBjb25zdCB0d28gPSBvdGhlclBsdW1wLmZpbmQoJ3Rlc3RzJywgdmFsLmlkKTtcbiAgICAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IHR3by5zdWJzY3JpYmUoe1xuICAgICAgICAgICAgICBlcnJvcjogKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHsgLyogbm9vcCAqLyB9LFxuICAgICAgICAgICAgICBuZXh0OiAodikgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICBpZiAocGhhc2UgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHYuYXR0cmlidXRlcy5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ2F0dHJpYnV0ZXMnKS53aXRoLnByb3BlcnR5KCduYW1lJywgJ3BvdGF0bycpO1xuICAgICAgICAgICAgICAgICAgICAgIHBoYXNlID0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaWYgKHBoYXNlID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2LmF0dHJpYnV0ZXMubmFtZSAhPT0gJ3BvdGF0bycpIHtcbiAgICAgICAgICAgICAgICAgICAgICBleHBlY3QodikudG8uaGF2ZS5wcm9wZXJ0eSgnYXR0cmlidXRlcycpLndpdGgucHJvcGVydHkoJ25hbWUnLCAnc2xvd3RhdG8nKTtcbiAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdfQ==
