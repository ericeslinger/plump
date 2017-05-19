/* eslint-env node, mocha*/

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { Plump, MemoryStore, Model, Schema, ModelData } from '../src/index';
import { TestType } from './testType';

const memstore2 = new MemoryStore({ terminal: true });

const plump = new Plump();

chai.use(chaiAsPromised);
const expect = chai.expect;

before(() => {
  return plump.setTerminal(memstore2)
  .then(() => plump.addType(TestType));
});

describe('model', () => {
  describe('basic functionality', () => {
    it('should return promises to existing data', () => {
      const one = new TestType({ id: 1, name: 'potato' }, plump);
      return expect(one.get()).to.eventually.have.deep.property('attributes.name', 'potato');
    });

    it('should let you subscribe to relationships that are empty', () => {
      @Schema({
        name: 'smallType',
        idAttribute: 'id',
        attributes: {},
        relationships: {
          children: {
            type: {
              sides: {
                parents: { otherType: 'smallType', otherName: 'children' },
                children: { otherType: 'smallType', otherName: 'parents' },
              },
            },
          },
          parents: {
            type: {
              sides: {
                parents: { otherType: 'smallType', otherName: 'children' },
                children: { otherType: 'smallType', otherName: 'parents' },
              },
            },
          },
        },
      })
      class MiniModel extends Model<ModelData> { }

      const tinyPlump = new Plump();
      return tinyPlump.addType(MiniModel)
      .then(() => tinyPlump.setTerminal(new MemoryStore({ terminal: true })))
      .then(() => new MiniModel({}, tinyPlump).save())
      .then((i) => {
        return new Promise((resolve, reject) => {
          return tinyPlump.find({typeName: 'smallType', id: i.id})
          .asObservable()
          .subscribe((v) => {
            if (v && v.relationships && v.relationships.children) {
              expect(v.relationships.children).to.deep.equal([]);
              resolve();
            }
          });
        })
      });
    });

    it('should load data from datastores', () => {
      return memstore2.writeAttributes({ typeName: 'tests', attributes: { name: 'potato' } })
      .then(createdObject => {
        const two = plump.find({ typeName: 'tests', id: createdObject.id });
        return expect(two.get()).to.eventually.have.deep.property('attributes.name', 'potato');
      });
    });

    it('should create an id when one is unset', () => {
      const noID = new TestType({ name: 'potato' }, plump);
      return noID.save()
      .then(() => noID.get())
      .then((v) => {
        expect(v.id).to.not.be.null;
        expect(v.attributes.id).to.not.be.null;
        expect(v.id).to.equal(v.attributes.id);
      });
    });

    it('should allow the creation of new models with an existing id', () => {
      const otherPlump = new Plump();
      const otherStore = new MemoryStore({ terminal: true });
      return otherPlump.setTerminal(otherStore)
      .then(() => otherPlump.addType(TestType))
      .then(() => new TestType({ name: 'potato', id: 101 }, otherPlump).save())
      .then(() => otherPlump.find({ typeName: 'tests', id: 101 }).get())
      .then((v) => {
        expect(v).to.have.property('id', 101);
        expect(v.attributes).to.have.property('id', 101);
      });
    });

    it('should allow data to be deleted', () => {
      const one = new TestType({ name: 'potato' }, plump);
      return one.save()
      .then(() => {
        return expect(plump.find({ typeName: 'tests', id: one.id }).get())
        .to.eventually.have.deep.property('attributes.name', 'potato');
      })
      .then(() => one.delete())
      .then(() => plump.find({ typeName: 'tests', id: one.id }).get())
      .then((v) => expect(v).to.be.null);
    });

    it('should allow fields to be loaded', () => {
      const one = new TestType({ name: 'p', otherName: 'q' }, plump);
      return one.save()
      .then(() => {
        return expect(plump.find({ typeName: 'tests', id: one.id }).get())
        .to.eventually.have.deep.property('attributes.name', 'p');
      })
      .then(() => {
        return expect(plump.find({ typeName: 'tests', id: one.id }).get(['attributes', 'relationships']))
        .to.eventually.deep.equal(
          {
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
          }
        );
      });
    });

    it('should dirty-cache updates that have not been saved', () => {
      const one = new TestType({ name: 'potato' }, plump);
      return one.save()
      .then(() => {
        one.set({ name: 'rutabaga' });
        return Promise.all([
          expect(one.get()).to.eventually.have.deep.property('attributes.name', 'rutabaga'),
          expect(plump.get(one)).to.eventually.have.deep.property('attributes.name', 'potato'),
        ]);
      }).then(() => {
        return one.save();
      }).then(() => {
        return expect(plump.get(one))
        .to.eventually.have.deep.property('attributes.name', 'rutabaga');
      });
    });

    it('should only load base fields on get()', () => {
      const one = new TestType({ name: 'potato', otherName: 'schmotato' }, plump);
      return one.save()
      .then(() => {
        // const hasManys = Object.keys(TestType.$fields).filter(field => TestType.$fields[field].type === 'hasMany');

        return plump.find({ typeName: 'tests', id: one.id }).get();
      }).then(data => {
        const baseFields = Object.keys(TestType.schema.attributes);

        // NOTE: .have.all requires list length equality
        expect(data).to.have.property('attributes')
        .with.all.keys(baseFields);
        expect(data).to.have.property('relationships').that.is.empty; // tslint:disable-line no-unused-expression
      });
    });

    it('should optimistically update on field updates', () => {
      const one = new TestType({ name: 'potato' }, plump);
      return one.save()
      .then(() => one.set({ name: 'rutabaga' }))
      .then(() => expect(one.get()).to.eventually.have.deep.property('attributes.name', 'rutabaga'));
    });
  });

  describe('relationships', () => {
    it('should show empty hasMany lists as {key: []}', () => {
      const one = new TestType({ name: 'frotato' }, plump);
      return one.save()
      .then(() => one.get('relationships.children'))
      .then((v) => expect(v.relationships.children).to.deep.equal([]));
    });

    it('should add hasMany elements', () => {
      const one = new TestType({ name: 'frotato' }, plump);
      return one.save()
      .then(() => one.add('children', { id: 100 }).save())
      .then(() => one.get('relationships.children'))
      .then((v) => expect(v.relationships.children).to.deep.equal([{ id: 100 }]));
    });

    it('should add hasMany elements by child field', () => {
      const one = new TestType({ name: 'frotato' }, plump);
      return one.save()
      .then(() => one.add('children', { id: 100 }).save())
      .then(() => one.get('relationships.children'))
      .then((v) => expect(v.relationships.children).to.deep.equal([{ id: 100 }]));
    });

    it('should add several hasMany elements by child field', () => {
      const one = new TestType({ name: 'frotato' }, plump);
      return one.save()
      .then(() => one.add('children', { id: 100 }).add('children', { id: 101 }).save())
      .then(() => one.get('relationships.children'))
      .then((v) => expect(v.relationships.children).to.deep.equal([{ id: 100 }, { id: 101 }]));
    });

    it('should remove hasMany elements', () => {
      const one = new TestType({ name: 'frotato' }, plump);
      return one.save()
      .then(() => one.add('children', { id: 100 }).save())
      .then(() => one.get('relationships.children'))
      .then((v) => expect(v.relationships.children).to.deep.equal([{ id: 100 }]))
      .then(() => one.remove('children', { id: 100 }).save())
      .then(() => one.get('relationships.children'))
      .then((v) => expect(v.relationships.children).to.deep.equal([]));
    });

    it('should include valence in hasMany operations', () => {
      const one = new TestType({ name: 'grotato' }, plump);
      return one.save()
      .then(() => one.add('valenceChildren', { id: 100, meta: { perm: 1 } }).save())
      .then(() => one.get('relationships.valenceChildren'))
      .then((v) => expect(v.relationships.valenceChildren).to.deep.equal([{ id: 100, meta: { perm: 1 } }]))
      .then(() => one.modifyRelationship('valenceChildren', { id: 100, meta: { perm: 2 } }).save())
      .then(() => one.get('relationships.valenceChildren'))
      .then((v) => expect(v.relationships.valenceChildren).to.deep.equal([{ id: 100, meta: { perm: 2 } }]));
    });
  });

  describe('events', () => {
    it('should pass model hasMany changes to other models', () => {
      const one = new TestType({ name: 'potato' }, plump);
      return one.save()
      .then(() => {
        const onePrime = plump.find({ typeName: TestType.typeName, id: one.id });
        return one.get('relationships.children')
        .then((res) => expect(res).to.have.property('relationships')
        .that.deep.equals({ children: [] }))
        .then(() => onePrime.get('relationships.children'))
        .then((res) => expect(res).to.have.property('relationships')
        .that.deep.equals({ children: [] }))
        .then(() => one.add('children', { id: 100 }).save())
        .then(() => one.get('relationships.children'))
        .then((res) => expect(res).to.have.property('relationships')
        .that.deep.equals({ children: [{ id: 100 }] }))
        .then(() => onePrime.get('relationships.children'))
        .then((res) => expect(res).to.have.property('relationships')
        .that.deep.equals({ children: [{ id: 100 }] }));
      });
    });

    it('should pass model changes to other models', () => {
      const one = new TestType({ name: 'potato' }, plump);
      return one.save()
      .then(() => {
        const onePrime = plump.find({ typeName: TestType.typeName, id: one.id });
        return one.get()
        .then((res) => expect(res).have.deep.property('attributes.name', 'potato'))
        .then(() => onePrime.get())
        .then((res) => expect(res).have.deep.property('attributes.name', 'potato'))
        .then(() => one.set({ name: 'grotato' }).save())
        .then(() => one.get())
        .then((res) => expect(res).have.deep.property('attributes.name', 'grotato'))
        .then(() => onePrime.get())
        .then((res) => expect(res).have.deep.property('attributes.name', 'grotato'));
      });
    });

    it('should allow subscription to model data', () => {
      return new Promise((resolve, reject) => {
        const one = new TestType({ name: 'potato' }, plump);
        let phase = 0;
        one.save()
        .then(() => {
          const subscription = one.subscribe({
            error: (err) => {
              throw err;
            },
            complete: () => { /* noop */ },
            next: (v) => {
              try {
                expect(v).to.not.be.undefined;
                if (!v) {
                  return;
                }
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
              } catch (err) {
                reject(err);
              }
            }
          });
        })
        .then(() => one.set({ name: 'grotato' }).save());
      });
    });

    it('should allow subscription to model sideloads', () => {
      return new Promise((resolve, reject) => {
        const one = new TestType({ name: 'potato' }, plump);
        let phase = 0;
        one.save()
        .then(() => one.add('children', { id: 100 }).save())
        .then(() => {
          const subscription = one.subscribe(['attributes', 'relationships'], {
            error: (err) => {
              throw err;
            },
            complete: () => { /* noop */ },
            next: (v) => {
              try {
                if (!v) {
                  return;
                }
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
              } catch (err) {
                reject(err);
              }
            }
          });
        })
        .then(() => one.add('children', { id: 101 }).save());
      });
    });

    it('should update on cacheable read events', () => {
      return new Promise((resolve, reject) => {
        const DelayProxy = {
          get: (target, name) => {
            if (['read', 'write', 'add', 'remove'].indexOf(name) >= 0) {
              return (...args) => {
                return new Promise((r) => setTimeout(r, 200))
                .then(() => target[name](...args));
              };
            } else {
              return target[name];
            }
          },
        };
        const delayedMemstore = new Proxy(new MemoryStore({ terminal: true }), DelayProxy);
        const coldMemstore = new MemoryStore();
        const otherPlump = new Plump();
        // {
        //   storage: [coldMemstore, delayedMemstore],
        //   types: [TestType],
        // });
        otherPlump.addType(TestType)
        .then(() => otherPlump.addCache(coldMemstore))
        .then(() => otherPlump.setTerminal(delayedMemstore))
        .then(() => {
          const one = new TestType({ name: 'slowtato' }, otherPlump);
          one.save()
          .then(() => one.get())
          .then((val) => {
            return coldMemstore.cache({
              id: val.id,
              typeName: 'tests',
              attributes: {
                name: 'potato',
                id: val.id,
              },
            })
            .then(() => {
              let phase = 0;
              const two = otherPlump.find({ typeName: 'tests', id: val.id });
              const subscription = two.subscribe({
                error: (err) => {
                  throw err;
                },
                complete: () => { /* noop */ },
                next: (v) => {
                  try {
                    if (!v) {
                      return;
                    }
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
                  } catch (err) {
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
});
