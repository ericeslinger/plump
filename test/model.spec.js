/* eslint-env node, mocha*/

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import Bluebird from 'bluebird';

Bluebird.config({
  longStackTraces: true,
});

import { Plump, Model, MemoryStore, $all } from '../src/index';
import { TestType } from './testType';

const memstore2 = new MemoryStore({ terminal: true });

const plump = new Plump({
  storage: [memstore2],
  types: [TestType],
});


chai.use(chaiAsPromised);
const expect = chai.expect;

describe('model', () => {
  describe('basic functionality', () => {
    it('should return promises to existing data', () => {
      const one = new TestType({ id: 1, name: 'potato' }, plump);
      return expect(one.$get()).to.eventually.have.deep.property('attributes.name', 'potato');
    });

    it('should properly serialize its schema', () => {
      class MiniTest extends Model {}
      MiniTest.fromJSON(TestType.toJSON());
      return expect(MiniTest.toJSON()).to.deep.equal(TestType.toJSON());
    });

    it('should load data from datastores', () => {
      return memstore2.write(TestType, { attributes: { name: 'potato' }, relationships: {} })
      .then(createdObject => {
        const two = plump.find('tests', createdObject.id);
        return expect(two.$get()).to.eventually.have.deep.property('attributes.name', 'potato');
      });
    });

    it('should create an id when one is unset', () => {
      const noID = new TestType({ name: 'potato' }, plump);
      return noID.$save().then((m) => {
        return expect(m.$get())
        .to.eventually.have.property(TestType.$schema.$id)
        .that.is.not.null;
      });
    });

    it('should allow data to be deleted', () => {
      const one = new TestType({ name: 'potato' }, plump);
      return one.$save()
      .then(() => {
        return expect(plump.find('tests', one.$id).$get())
        .to.eventually.have.deep.property('attributes.name', 'potato');
      })
      .then(() => one.$delete())
      .then(() => expect(plump.find('tests', one.$id).$get()).to.eventually.be.null);
    });

    it('should allow fields to be loaded', () => {
      const one = new TestType({ name: 'p', otherName: 'q' }, plump);
      return one.$save()
      .then(() => {
        return expect(plump.find('tests', one.$id).$get())
        .to.eventually.have.deep.property('attributes.name', 'p');
      })
      .then(() => {
        return expect(plump.find('tests', one.$id).$get($all))
        .to.eventually.deep.equal(TestType.assign({ name: 'p', otherName: 'q', id: one.$id }));
      });
    });

    it('should dirty-cache updates that have not been saved', () => {
      const one = new TestType({ name: 'potato' }, plump);
      return one.$save()
      .then(() => {
        one.$set({ name: 'rutabaga' });
        return Bluebird.all([
          expect(one.$get()).to.eventually.have.deep.property('attributes.name', 'rutabaga'),
          expect(plump.get(TestType, one.$id))
          .to.eventually.have.deep.property('attributes.name', 'potato'),
        ]);
      }).then(() => {
        return one.$save();
      }).then(() => {
        return expect(plump.get(TestType, one.$id))
        .to.eventually.have.deep.property('attributes.name', 'rutabaga');
      });
    });

    it('should only load base fields on $get()', () => {
      const one = new TestType({ name: 'potato', otherName: 'schmotato' }, plump);
      return one.$save()
      .then(() => {
        // const hasManys = Object.keys(TestType.$fields).filter(field => TestType.$fields[field].type === 'hasMany');

        return plump.find('tests', one.$id).$get();
      }).then(data => {
        const baseFields = Object.keys(TestType.$schema.attributes);

        // NOTE: .have.all requires list length equality
        expect(data).to.have.property('attributes')
        .with.all.keys(baseFields);
        expect(data).to.have.property('relationships').that.is.empty; // eslint-disable-line no-unused-expressions
      });
    });

    it('should optimistically update on field updates', () => {
      const one = new TestType({ name: 'potato' }, plump);
      return one.$save()
      .then(() => one.$set({ name: 'rutabaga' }))
      .then(() => expect(one.$get()).to.eventually.have.deep.property('attributes.name', 'rutabaga'));
    });
  });

  describe('relationships', () => {
    it('should show empty hasMany lists as {key: []}', () => {
      const one = new TestType({ name: 'frotato' }, plump);
      return one.$save()
      .then(() => {
        return expect(one.$get('children')).to.eventually.have.property('relationships')
        .that.deep.equals({ children: [] });
      });
    });

    it('should add hasMany elements', () => {
      const one = new TestType({ name: 'frotato' }, plump);
      return one.$save()
      .then(() => one.$add('children', 100).$save())
      .then(() => {
        return expect(one.$get('children'))
        .to.eventually.have.property('relationships')
        .that.deep.equals({ children: [{ id: 100 }] });
      });
    });

    it('should add hasMany elements by child field', () => {
      const one = new TestType({ name: 'frotato' }, plump);
      return one.$save()
      .then(() => one.$add('children', 100).$save())
      .then(() => {
        return expect(one.$get('children'))
        .to.eventually.have.property('relationships')
        .that.deep.equals({ children: [{ id: 100 }] });
      });
    });

    it('should remove hasMany elements', () => {
      const one = new TestType({ name: 'frotato' }, plump);
      return one.$save()
      .then(() => one.$add('children', 100).$save())
      .then(() => {
        return expect(one.$get('children'))
        .to.eventually.have.property('relationships')
        .that.deep.equals({ children: [{ id: 100 }] });
      })
      .then(() => one.$remove('children', 100).$save())
      .then(() => {
        return expect(one.$get('children')).to.eventually.have.property('relationships')
        .that.deep.equals({ children: [] });
      });
    });

    it('should include valence in hasMany operations', () => {
      const one = new TestType({ name: 'grotato' }, plump);
      return one.$save()
      .then(() => one.$add('valenceChildren', 100, { perm: 1 }).$save())
      .then(() => {
        return expect(one.$get('valenceChildren'))
        .to.eventually.have.property('relationships')
        .that.deep.equals({ valenceChildren: [{
          id: 100,
          meta: {
            perm: 1,
          },
        }] });
      })
      .then(() => one.$modifyRelationship('valenceChildren', 100, { perm: 2 }).$save())
      .then(() => {
        return expect(one.$get('valenceChildren'))
        .to.eventually.have.property('relationships')
        .that.deep.equals({
          valenceChildren: [{
            id: 100,
            meta: {
              perm: 2,
            },
          }],
        });
      });
    });
  });

  describe('events', () => {
    it('should pass model hasMany changes to other models', () => {
      const one = new TestType({ name: 'potato' }, plump);
      return one.$save()
      .then(() => {
        const onePrime = plump.find(TestType.$name, one.$id);
        return one.$get('children')
        .then((res) => expect(res).to.have.property('relationships')
        .that.deep.equals({ children: [] }))
        .then(() => onePrime.$get('children'))
        .then((res) => expect(res).to.have.property('relationships')
        .that.deep.equals({ children: [] }))
        .then(() => one.$add('children', 100).$save())
        .then(() => one.$get('children'))
        .then((res) => expect(res).to.have.property('relationships')
        .that.deep.equals({ children: [{ id: 100 }] }))
        .then(() => onePrime.$get('children'))
        .then((res) => expect(res).to.have.property('relationships')
        .that.deep.equals({ children: [{ id: 100 }] }));
      });
    });

    it('should pass model changes to other models', () => {
      const one = new TestType({ name: 'potato' }, plump);
      return one.$save()
      .then(() => {
        const onePrime = plump.find(TestType.$name, one.$id);
        return one.$get()
        .then((res) => expect(res).have.deep.property('attributes.name', 'potato'))
        .then(() => onePrime.$get())
        .then((res) => expect(res).have.deep.property('attributes.name', 'potato'))
        .then(() => one.$set({ name: 'grotato' }).$save())
        .then(() => one.$get())
        .then((res) => expect(res).have.deep.property('attributes.name', 'grotato'))
        .then(() => onePrime.$get())
        .then((res) => expect(res).have.deep.property('attributes.name', 'grotato'));
      });
    });

    it('should allow subscription to model data', () => {
      return new Bluebird((resolve, reject) => {
        const one = new TestType({ name: 'potato' }, plump);
        let phase = 0;
        one.$save()
        .then(() => {
          const subscription = one.$subscribe((v) => {
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
                }
              }
              if (phase === 3) {
                if ((v.relationships.children) && (v.relationships.children.length > 0)) {
                  expect(v.relationships.children).to.deep.equal([{ id: 100 }]);
                  subscription.unsubscribe();
                  resolve();
                }
              }
            } catch (err) {
              reject(err);
            }
          });
        })
        .then(() => one.$set({ name: 'grotato' }))
        .then(() => one.$add('children', 100));
      });
    });

    it('should allow subscription to model sideloads', () => {
      return new Bluebird((resolve, reject) => {
        const one = new TestType({ name: 'potato' }, plump);
        let phase = 0;
        one.$save()
        .then(() => one.$add('children', 100).$save())
        .then(() => {
          const subscription = one.$subscribe([$all], (v) => {
            try {
              if (phase === 0) {
                if (v.attributes) {
                  expect(v).to.have.property('attributes').that.is.empty; // eslint-disable-line no-unused-expressions
                  phase = 1;
                }
              }
              if (phase === 1) {
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
          });
        })
        .then(() => one.$add('children', 101).$save());
      });
    });

    it('should update on cacheable read events', () => {
      return new Bluebird((resolve, reject) => {
        const DelayProxy = {
          get: (target, name) => {
            if (['read', 'write', 'add', 'remove'].indexOf(name) >= 0) {
              return (...args) => {
                return Bluebird.delay(200)
              .then(() => target[name](...args));
              };
            } else {
              return target[name];
            }
          },
        };
        const delayedMemstore = new Proxy(new MemoryStore({ terminal: true }), DelayProxy);
        const coldMemstore = new MemoryStore();
        const otherPlump = new Plump({
          storage: [coldMemstore, delayedMemstore],
          types: [TestType],
        });
        const one = new TestType({ name: 'slowtato' }, otherPlump);
        one.$save()
        .then(() => one.$get())
        .then((val) => {
          return coldMemstore.write(TestType, {
            id: val.id,
            attributes: {
              name: 'potato',
              id: val.id,
            },
          })
          .then(() => {
            let phase = 0;
            const two = otherPlump.find('tests', val.id);
            const subscription = two.$subscribe((v) => {
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
              } catch (err) {
                subscription.unsubscribe();
                reject(err);
              }
            });
          });
        });
      });
    });
  });
});
