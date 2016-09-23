const $types = Symbol('$types');
const $storage = Symbol('$storage');
const $terminal = Symbol('$terminal');

export class Guild {
  constructor(opts = {}) {
    const options = Object.assign({}, {
      storage: [],
    }, opts);
    options.storage.forEach((s) => this.addStore(s));
  }

  addStore(store) {
    if (store.terminal) {
      if (this[$terminal] === undefined) {
        this[$terminal] = store;
      } else {
        throw new Error('cannot have more than one terminal store');
      }
    } else {
      this[$storage].concat(store);
    }
  }

  find(t, id) {
    let Type = t;
    if (typeof t === 'string') {
      Type = this[$types][t];
    }
    const retVal = new Type({[Type.$id]: id}, this);
    return retVal;
  }

  // LOAD (type/id), SIDELOAD (type/id/side)? Or just LOADALL?
  // LOAD needs to scrub through hot caches first


  get(type, id) {
    return this[$storage].reduce((thenable, storage) => {
      return thenable.then((v) => {
        if (v !== null) {
          return v;
        } else {
          return storage.read(type, id);
        }
      });
    }, Promise.resolve(null));
  }
}
