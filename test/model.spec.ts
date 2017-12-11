/* eslint-env node, mocha*/

import { expect } from 'chai';

import { Plump, MemoryStore, Model, Schema, ModelData } from '../dist/index';
import { TestType } from './testType';
import * as deepEqual from 'deep-equal';
const memstore2 = new MemoryStore({ terminal: true });
const plump = new Plump(memstore2);

before(() => plump.addType(TestType));

describe('model', () => {
  describe('basic functionality', () => {
    it('should return promises to existing data', () => {
      const one = new TestType(
        { attributes: { id: 1, name: 'potato' } },
        plump
      );
      return one
        .get({ fields: ['attributes', 'relationships'] })
        .then(v =>
          expect(v).to.have.nested.property('attributes.name', 'potato')
        );
    });

    it('should put erroring models into an error state', () => {
      const none = plump.find({ id: 999, type: TestType.type });
      return none.get({ fields: ['attributes', 'relationships'] }).then(v => {
        expect(v).to.be.null; // tslint:disable-line no-unused-expression
        expect(none.error.message).to.equal('not found');
        return new Promise((resolve, reject) => {
          none.asObservable().subscribe(
            s => {
              if (s['error']) {
                resolve(expect(s['error']).to.equal('not found'));
              }
            },
            (e: Error) => resolve(expect(e.message).to.equal('not found')),
            () => false
          );
        }).catch(e => console.log(e));
      });
    });

    it('should let you subscribe to relationships that are empty', () => {
      @Schema({
        name: 'smallType',
        idAttribute: 'id',
        attributes: {
          id: { type: 'number' },
        },
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
      class MiniModel extends Model<ModelData> {}

      const tinyPlump = new Plump(new MemoryStore({ terminal: true }));
      return tinyPlump
        .addType(MiniModel)
        .then(() =>
          tinyPlump.forceCreate({
            id: 101,
            type: 'smallType',
            attributes: { id: 101 },
          })
        )
        .then(i => {
          return new Promise((resolve, reject) => {
            return tinyPlump
              .find({ type: 'smallType', id: i.id })
              .asObservable()
              .subscribe(v => {
                if (v && v.relationships && v.relationships.children) {
                  expect(v.relationships.children).to.deep.equal([]);
                  resolve();
                }
              });
          });
        });
    });

    it('should allow you to optionally create with an ID', () => {
      return new TestType({ id: 57, attributes: { name: 'thing' } }, plump)
        .create()
        .then(v => {
          expect(v.id).to.equal(57);
          expect(v).to.have.nested.property('attributes.name', 'thing');
        });
    });

    it('should load data from datastores', () => {
      return memstore2
        .writeAttributes({
          type: TestType.type,
          attributes: { name: 'potato' },
        })
        .then(createdObject => {
          const two = plump.find({ type: TestType.type, id: createdObject.id });
          return two
            .get({ fields: ['attributes', 'relationships'] })
            .then(v =>
              expect(v).to.have.nested.property('attributes.name', 'potato')
            );
        });
    });

    it('should create an id when one is unset', () => {
      const noID = new TestType({ attributes: { name: 'potato' } }, plump);
      return noID
        .save()
        .then(() => noID.get({ fields: ['attributes', 'relationships'] }))
        .then(v => {
          expect(v.id).to.not.be.null; // tslint:disable-line no-unused-expression
          expect(v.attributes.id).to.not.be.null; // tslint:disable-line no-unused-expression
          expect(v.id).to.equal(v.attributes.id);
        });
    });

    it('should allow the creation of new models with an existing id', () => {
      const otherStore = new MemoryStore({ terminal: true });
      const otherPlump = new Plump(otherStore);
      return otherPlump
        .addType(TestType)
        .then(() =>
          new TestType(
            { attributes: { name: 'potato', id: 101 } },
            otherPlump
          ).save()
        )
        .then(() =>
          otherPlump
            .find({ type: TestType.type, id: 101 })
            .get({ fields: ['attributes', 'relationships'] })
        )
        .then(v => {
          expect(v).to.have.property('id', 101);
          expect(v.attributes).to.have.property('id', 101);
        });
    });

    it('does not overwrite attributes on child addition', () => {
      const one = new TestType(
        { attributes: { name: 'potato', otherName: 'elephant' } },
        plump
      );
      return one
        .save()
        .then(() =>
          plump
            .find({ type: TestType.type, id: one.id })
            .get({ fields: ['attributes', 'relationships'] })
        )
        .then(v =>
          expect(v).to.have.nested.property('attributes.otherName', 'elephant')
        )
        .then(() =>
          one.add('children', { type: TestType.type, id: 100 }).save()
        )
        .then(() =>
          plump
            .find({ type: TestType.type, id: one.id })
            .get({ fields: ['attributes', 'relationships'] })
        )
        .then(v =>
          expect(v).to.have.nested.property('attributes.otherName', 'elephant')
        );
    });

    it('should allow data to be deleted', () => {
      const one = new TestType({ attributes: { name: 'potato' } }, plump);
      return one
        .save()
        .then(() =>
          plump
            .find({ type: TestType.type, id: one.id })
            .get({ fields: ['attributes', 'relationships'] })
        )
        .then(v =>
          expect(v).to.have.nested.property('attributes.name', 'potato')
        )
        .then(() => one.delete())
        .then(() =>
          plump
            .find({ type: TestType.type, id: one.id })
            .get({ fields: ['attributes', 'relationships'] })
        )
        .then(v => expect(v).to.be.null);
    });

    it('should allow fields to be loaded', () => {
      const one = new TestType(
        { attributes: { name: 'p', otherName: 'q' } },
        plump
      );
      return one
        .save()
        .then(() =>
          plump
            .find({ type: TestType.type, id: one.id })
            .get({ fields: ['attributes', 'relationships'] })
        )
        .then(v => expect(v).to.have.nested.property('attributes.name', 'p'))
        .then(() =>
          plump
            .find({ type: TestType.type, id: one.id })
            .get({ fields: ['attributes', 'relationships'] })
        )
        .then(v =>
          expect(v).to.deep.equal({
            type: TestType.type,
            id: one.id,
            attributes: { name: 'p', otherName: 'q', id: one.id, extended: {} },
            relationships: {
              parents: [],
              children: [],
              valenceParents: [],
              valenceChildren: [],
            },
          })
        );
    });

    it('should dirty-cache updates that have not been saved', () => {
      const one = new TestType({ attributes: { name: 'potato' } }, plump);
      return one
        .save()
        .then(() => {
          one.set({ name: 'rutabaga' });
          return Promise.all([
            one.get({ fields: ['attributes', 'relationships'] }),
            plump.get({
              item: { id: one.id, type: one.type },
              fields: ['attributes', 'relationships'],
            }),
          ]);
        })
        .then(([ruta, potato]) => {
          expect(ruta).to.have.nested.property('attributes.name', 'rutabaga');
          expect(potato).to.have.nested.property('attributes.name', 'potato');
        })
        .then(() => one.save())
        .then(() =>
          plump.get({
            item: { id: one.id, type: one.type },
            fields: ['attributes', 'relationships'],
          })
        )
        .then(v =>
          expect(v).to.have.nested.property('attributes.name', 'rutabaga')
        );
    });

    it('should optimistically update on field updates', () => {
      const one = new TestType({ attributes: { name: 'potato' } }, plump);
      return one
        .save()
        .then(() => one.set({ name: 'rutabaga' }))
        .then(() => one.get({ fields: ['attributes', 'relationships'] }))
        .then(v =>
          expect(v).to.have.nested.property('attributes.name', 'rutabaga')
        );
    });
  });

  describe('relationships', () => {
    it('should show empty hasMany lists as {key: []}', () => {
      const one = new TestType({ attributes: { name: 'frotato' } }, plump);
      return one
        .save()
        .then(() => one.get({ fields: ['relationships.children'] }))
        .then(v => expect(v.relationships.children).to.deep.equal([]));
    });

    it('should add hasMany elements', () => {
      const one = new TestType({ attributes: { name: 'frotato' } }, plump);
      return one
        .save()
        .then(() =>
          one.add('children', { type: TestType.type, id: 100 }).save()
        )
        .then(() => one.get({ fields: ['relationships.children'] }))
        .then(v =>
          expect(v.relationships.children).to.deep.equal([
            { type: TestType.type, id: 100 },
          ])
        );
    });

    it('should add hasMany elements by child field', () => {
      const one = new TestType({ attributes: { name: 'frotato' } }, plump);
      return one
        .save()
        .then(() =>
          one.add('children', { type: TestType.type, id: 100 }).save()
        )
        .then(() => one.get({ fields: ['relationships.children'] }))
        .then(v =>
          expect(v.relationships.children).to.deep.equal([
            { type: TestType.type, id: 100 },
          ])
        );
    });

    it('should add several hasMany elements by child field', () => {
      const one = new TestType({ attributes: { name: 'frotato' } }, plump);
      return one
        .save()
        .then(() =>
          one
            .add('children', { type: TestType.type, id: 100 })
            .add('children', { type: TestType.type, id: 101 })
            .save()
        )
        .then(() => one.get({ fields: ['relationships.children'] }))
        .then(v =>
          expect(v.relationships.children).to.deep.equal(
            [100, 101].map(id => ({ type: TestType.type, id }))
          )
        );
    });

    it('should remove hasMany elements', () => {
      const one = new TestType({ attributes: { name: 'frotato' } }, plump);
      return one
        .save()
        .then(() =>
          one.add('children', { type: TestType.type, id: 100 }).save()
        )
        .then(() => one.get({ fields: ['relationships.children'] }))
        .then(v =>
          expect(v.relationships.children).to.deep.equal([
            { type: TestType.type, id: 100 },
          ])
        )
        .then(() =>
          one.remove('children', { type: TestType.type, id: 100 }).save()
        )
        .then(() => one.get({ fields: ['relationships.children'] }))
        .then(v => expect(v.relationships.children).to.deep.equal([]));
    });

    it('should include valence in hasMany operations', () => {
      const one = new TestType({ attributes: { name: 'grotato' } }, plump);
      return one
        .save()
        .then(() =>
          one
            .add('valenceChildren', {
              type: TestType.type,
              id: 100,
              meta: { perm: 1 },
            })
            .save()
        )
        .then(() => one.get({ fields: ['relationships.valenceChildren'] }))
        .then(v =>
          expect(v.relationships.valenceChildren).to.deep.equal([
            { type: TestType.type, id: 100, meta: { perm: 1 } },
          ])
        )
        .then(() =>
          one
            .modifyRelationship('valenceChildren', {
              type: TestType.type,
              id: 100,
              meta: { perm: 2 },
            })
            .save()
        )
        .then(() => one.get({ fields: ['relationships.valenceChildren'] }))
        .then(v =>
          expect(v.relationships.valenceChildren).to.deep.equal([
            { type: TestType.type, id: 100, meta: { perm: 2 } },
          ])
        );
    });
  });

  describe('events', () => {
    it('should pass model hasMany changes to other models', () => {
      const one = new TestType({ attributes: { name: 'potato' } }, plump);
      return one.save().then(() => {
        const onePrime = plump.find({ type: TestType.type, id: one.id });
        return one
          .get({ fields: ['relationships.children'] })
          .then(res => expect(res.relationships.children).to.deep.equal([]))
          .then(() => onePrime.get({ fields: ['relationships.children'] }))
          .then(res => expect(res.relationships.children).to.deep.equal([]))
          .then(() =>
            one.add('children', { type: TestType.type, id: 100 }).save()
          )
          .then(() => one.get({ fields: ['relationships.children'] }))
          .then(res =>
            expect(res.relationships.children).to.deep.equal([
              { type: TestType.type, id: 100 },
            ])
          )
          .then(() => onePrime.get({ fields: ['relationships.children'] }))
          .then(res =>
            expect(res.relationships.children).to.deep.equal([
              { type: TestType.type, id: 100 },
            ])
          );
      });
    });

    it('should pass model changes to other models', () => {
      const one = new TestType({ attributes: { name: 'potato' } }, plump);
      return one.save().then(() => {
        const onePrime = plump.find({ type: TestType.type, id: one.id });
        return one
          .get({ fields: ['attributes', 'relationships'] })
          .then(res =>
            expect(res).have.nested.property('attributes.name', 'potato')
          )
          .then(() => onePrime.get({ fields: ['attributes', 'relationships'] }))
          .then(res =>
            expect(res).have.nested.property('attributes.name', 'potato')
          )
          .then(() => one.set({ attributes: { name: 'grotato' } }).save())
          .then(() => one.get({ fields: ['attributes', 'relationships'] }))
          .then(res =>
            expect(res).have.nested.property('attributes.name', 'grotato')
          )
          .then(() => onePrime.get({ fields: ['attributes', 'relationships'] }))
          .then(res =>
            expect(res).have.nested.property('attributes.name', 'grotato')
          );
      });
    });

    it('should allow subscription to unsaved data set values', () => {
      return new Promise((resolve, reject) => {
        const one = new TestType({ attributes: { name: 'potato' } }, plump);
        let phase = 0;
        one
          .save()
          .then(() => {
            const subscription = one
              .asObservable(['attributes'])
              .subscribe(v => {
                try {
                  expect(v).to.not.be.undefined; // tslint:disable-line no-unused-expression
                  if (!v) {
                    return;
                  }
                  if (
                    phase === 0 &&
                    v.attributes.name &&
                    v.attributes.name !== ''
                  ) {
                    expect(v.attributes.name).to.equal('potato');
                    phase = 1;
                  } else if (phase === 1) {
                    expect(v.attributes.name).to.equal('not potato');
                    phase = 2;
                  } else if (
                    phase === 2 &&
                    v.attributes.name !== 'not potato'
                  ) {
                    expect(v.attributes.name).to.equal('actually potato');
                    resolve();
                  }
                } catch (err) {
                  reject(err);
                }
              });
          })
          .then(() => {
            setTimeout(
              () => one.set({ attributes: { name: 'not potato' } }),
              25
            );
            setTimeout(() => one.save(), 35);
            setTimeout(() => {
              plump.terminal.writeAttributes({
                type: one.type,
                id: one.id,
                attributes: {
                  name: 'actually potato',
                },
              });
            }, 100);
          });
      });
    });

    it('should allow subscription to model data', () => {
      return new Promise((resolve, reject) => {
        const one = new TestType({ attributes: { name: 'potato' } }, plump);
        let phase = 0;
        one
          .save()
          .then(() => {
            const subscription = one.asObservable(['attributes']).subscribe({
              error: err => {
                throw err;
              },
              complete: () => {
                /* noop */
              },
              next: v => {
                try {
                  expect(v).to.not.be.undefined; // tslint:disable-line no-unused-expression
                  if (!v) {
                    return;
                  }
                  if (phase === 0) {
                    if (v.attributes.name) {
                      phase = 1;
                    }
                  }
                  if (phase === 1) {
                    expect(v).to.have.nested.property(
                      'attributes.name',
                      'potato'
                    );
                    if (v.id !== undefined) {
                      phase = 2;
                    }
                  }
                  if (phase === 2) {
                    if (v.attributes.name !== 'potato') {
                      expect(v).to.have.nested.property(
                        'attributes.name',
                        'grotato'
                      );
                      phase = 3;
                      subscription.unsubscribe();
                      resolve();
                    }
                  }
                } catch (err) {
                  reject(err);
                }
              },
            });
          })
          .then(() =>
            setTimeout(
              () => one.set({ attributes: { name: 'grotato' } }).save(),
              75
            )
          );
      });
    });

    it('should allow subscription to model sideloads', () => {
      return new Promise((resolve, reject) => {
        const one = new TestType({ attributes: { name: 'potato' } }, plump);
        let phase = 0;
        one
          .save()
          .then(() =>
            one.add('children', { type: TestType.type, id: 100 }).save()
          )
          .then(() => {
            const subscription = one
              .asObservable(['attributes', 'relationships'])
              .distinctUntilChanged(deepEqual)
              .subscribe({
                error: err => {
                  throw err;
                },
                complete: () => {
                  /* noop */
                },
                next: v => {
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
                    if (
                      phase === 1 &&
                      v.relationships &&
                      v.relationships.children &&
                      v.relationships.children.length > 0
                    ) {
                      expect(v.relationships.children).to.deep.equal([
                        { type: TestType.type, id: 100 },
                      ]);
                      phase = 2;
                    }
                    if (phase === 2) {
                      if (
                        v.relationships.children &&
                        v.relationships.children.length === 0
                      ) {
                        expect(v.relationships.children).to.deep.equal([]);
                        phase = 3;
                      }
                    }
                    if (phase === 3) {
                      if (
                        v.relationships.children &&
                        v.relationships.children.length > 0
                      ) {
                        expect(v.relationships.children).to.deep.equal([
                          { type: TestType.type, id: 101 },
                        ]);
                        subscription.unsubscribe();
                        resolve();
                      }
                    }
                  } catch (err) {
                    reject(err);
                  }
                },
              });
          })
          .then(() => {
            setTimeout(() => {
              one.remove('children', { type: TestType.type, id: 100 }).save();
            }, 25);
            setTimeout(() => {
              one.add('children', { type: TestType.type, id: 101 }).save();
            }, 75);
          });
      });
    });

    it('should allow subscription to unsaved model sideloads', () => {
      return new Promise((resolve, reject) => {
        const one = new TestType({ attributes: { name: 'potato' } }, plump);
        let phase = 0;
        one
          .save()
          .then(() => {
            one
              .add('children', { type: TestType.type, id: 100 })
              .add('valenceChildren', {
                type: TestType.type,
                id: 200,
                meta: { perm: 1 },
              })
              .save();
          })
          .then(() => {
            const subscription = one
              .asObservable(['attributes', 'relationships'])
              .subscribe({
                error: err => {
                  throw err;
                },
                complete: () => {
                  /* noop */
                },
                next: v => {
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
                    if (
                      phase === 1 &&
                      v.relationships &&
                      v.relationships.children &&
                      v.relationships.children.length > 0
                    ) {
                      expect(v.relationships.children).to.deep.equal([
                        { type: TestType.type, id: 100 },
                      ]);
                      phase = 2;
                      setTimeout(
                        () =>
                          one.add('children', { type: TestType.type, id: 101 }),
                        25
                      );
                      console.log('added');
                    }
                    if (phase === 2) {
                      if (
                        v.relationships.children &&
                        v.relationships.children.length > 1
                      ) {
                        expect(v.relationships.children).to.deep.equal([
                          { type: TestType.type, id: 100 },
                          { type: TestType.type, id: 101 },
                        ]);
                        phase = 3;
                        setTimeout(
                          () =>
                            one.remove('children', {
                              type: TestType.type,
                              id: 101,
                            }),
                          25
                        );
                      }
                    } else if (
                      phase === 3 &&
                      v.relationships &&
                      v.relationships.children
                    ) {
                      expect(v.relationships.children).to.deep.equal([
                        { type: TestType.type, id: 100 },
                      ]);
                      phase = 4;
                      setTimeout(
                        () =>
                          one.modifyRelationship('valenceChildren', {
                            type: TestType.type,
                            id: 200,
                            meta: { perm: 2 },
                          }),
                        25
                      );
                    } else if (
                      phase === 4 &&
                      v.relationships &&
                      v.relationships.children
                    ) {
                      expect(v.relationships.valenceChildren).to.deep.equal([
                        { type: TestType.type, id: 200, meta: { perm: 2 } },
                      ]);
                      resolve();
                    }
                  } catch (err) {
                    reject(err);
                  }
                },
              });
          });
      });
    });

    it('should update on cacheable read events', () => {
      return new Promise((resolve, reject) => {
        const DelayProxy = {
          get: (target, name) => {
            if (['read', 'write', 'add', 'remove'].indexOf(name) >= 0) {
              return (...args) => {
                return new Promise(r => setTimeout(r, 200)).then(() =>
                  target[name](...args)
                );
              };
            } else {
              return target[name];
            }
          },
        };
        const delayedMemstore = new Proxy(
          new MemoryStore({ terminal: true }),
          DelayProxy
        );
        const coldMemstore = new MemoryStore();
        const otherPlump = new Plump(delayedMemstore);
        // {
        //   storage: [coldMemstore, delayedMemstore],
        //   types: [TestType],
        // });
        otherPlump
          .addType(TestType)
          .then(() => otherPlump.addCache(coldMemstore))
          .then(() => {
            const one = new TestType(
              { attributes: { name: 'slowtato' } },
              otherPlump
            );
            one
              .save()
              .then(() => one.get({ fields: ['attributes', 'relationships'] }))
              .then(val => {
                return coldMemstore
                  .cache({
                    id: val.id,
                    type: TestType.type,
                    attributes: {
                      name: 'potato',
                      id: val.id,
                    },
                  })
                  .then(() => {
                    let phase = 0;
                    const two = otherPlump.find({
                      type: TestType.type,
                      id: val.id,
                    });
                    const subscription = two
                      .asObservable(['attributes', 'relationships'])
                      .subscribe({
                        error: err => {
                          throw err;
                        },
                        complete: () => {
                          /* noop */
                        },
                        next: v => {
                          try {
                            if (!v) {
                              return;
                            }
                            if (phase === 0) {
                              if (v.attributes.name) {
                                expect(v)
                                  .to.have.property('attributes')
                                  .with.property('name', 'potato');
                                phase = 1;
                              }
                            }
                            if (phase === 1) {
                              if (v.attributes.name !== 'potato') {
                                expect(v)
                                  .to.have.property('attributes')
                                  .with.property('name', 'slowtato');
                                subscription.unsubscribe();
                                resolve();
                              }
                            }
                          } catch (err) {
                            subscription.unsubscribe();
                            reject(err);
                          }
                        },
                      });
                  });
              });
          });
      });
    });
  });
});
