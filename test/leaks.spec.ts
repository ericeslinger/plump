import { expect } from 'chai';
import { Subject, Observable } from 'rxjs';

import {
  Plump,
  MemoryStore,
  ModelData,
  observeChild,
  observeList,
  HotCache,
  ModelReference,
} from '../dist/index';
import { TestType } from './testType';
import 'mocha';
const DelayProxy = {
  get: (target, name) => {
    if (['read', 'write', 'add', 'remove'].indexOf(name) >= 0) {
      return (...args) => {
        return new Promise(resolve => setTimeout(resolve, 200)).then(() =>
          target[name](...args)
        );
      };
    } else {
      return target[name];
    }
  },
};

describe('Plump', () => {
  it('should not leak references to the write subject', () => {
    const terminalStore = new MemoryStore({ terminal: true });
    const plump = new Plump(terminalStore);
    return plump.addType(TestType).then(() => {
      expect(terminalStore.writeSubject.observers.length).to.equal(0);
      const thing = new TestType({ attributes: { name: 'foo' } }, plump);
      return thing.save().then(() => {
        const sub = thing
          .asObservable({ fields: ['attributes'] })
          .subscribe(v => null);
        expect(terminalStore.writeSubject.observers.length).to.equal(1);
        sub.unsubscribe();
        expect(terminalStore.writeSubject.observers.length).to.equal(0);
        const unsub = new Subject();
        thing
          .asObservable({ fields: ['attributes'] })
          .takeUntil(unsub)
          .subscribe(v => null);
        expect(terminalStore.writeSubject.observers.length).to.equal(1);
        unsub.next();
        expect(terminalStore.writeSubject.observers.length).to.equal(0);
      });
    });
  });

  it('should not leak references in observeChild', () => {
    const terminalStore = new MemoryStore({ terminal: true });
    const plump = new Plump(terminalStore);
    return plump.addType(TestType).then(() => {
      expect(terminalStore.writeSubject.observers.length).to.equal(0);
      const thing = new TestType({ attributes: { name: 'foo' } }, plump);
      return thing.save().then(() => {
        const unsub = new Subject();
        observeChild(
          thing.asObservable({ fields: ['attributes'] }),
          'name',
          plump
        )
          .takeUntil(unsub)
          .subscribe(v => null);
        expect(terminalStore.writeSubject.observers.length).to.equal(1);
        unsub.next();
        expect(terminalStore.writeSubject.observers.length).to.equal(0);
      });
    });
  });

  it('should not leak references in observeList', () => {
    const terminalStore = new MemoryStore({ terminal: true });
    const delayedMemstore = new Proxy(terminalStore, DelayProxy);
    const coldMemstore = new MemoryStore();
    const hotMemstore = new MemoryStore();
    hotMemstore.hot = () => true;
    const plump = new Plump(terminalStore);
    return plump
      .addCache(hotMemstore)
      .then(() => plump.addType(TestType))
      .then(() => {
        expect(terminalStore.writeSubject.observers.length).to.equal(1);
        const thing = new TestType({ attributes: { name: 'foo' } }, plump);
        const kids = ['a', 'b', 'c', 'd'].map(
          s => new TestType({ attributes: { name: s } }, plump)
        );
        const unsub = new Subject();
        return thing.save().then(() => {
          observeList(
            thing
              .asObservable({ fields: ['attributes', 'relationships'] })
              .map(v => v.relationships.children),
            plump
          )
            .map(v => v.map(i => i.attributes.name).join(' '))
            .distinctUntilChanged((o, n) => o === n)
            .takeUntil(unsub)
            .subscribe(v => null);
          return kids
            .reduce((acc, curr, idx) => {
              return acc
                .then(() => {
                  return curr
                    .save()
                    .then(i => thing.add('children', { id: i.id }).save());
                })
                .then(() => {
                  return new Promise<boolean>(resolve =>
                    setTimeout(() => resolve(true), 100)
                  ).then(() => {
                    expect(
                      terminalStore.writeSubject.observers.length
                    ).to.equal(idx + 3);
                    return true;
                  });
                });
            }, Promise.resolve(true))
            .then(() => {
              unsub.next();
              expect(terminalStore.writeSubject.observers.length).to.equal(1);
            });
        });
      });
  });
});
