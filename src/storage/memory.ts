import { KeyValueStore } from './keyValueStore';

export class MemoryStore extends KeyValueStore {

  private store: {[index: string]: string} = {};

  constructor(opts = {}) {
    super(opts);
  }

  logStore() {
    console.log(JSON.stringify(this.store, null, 2));
  }

  _keys(typeName) {
    return Promise.resolve(Object.keys(this.store).filter((k) => k.indexOf(`${typeName}:`) === 0));
  }

  _get(k) {
    if (this.store[k]) {
      return Promise.resolve(JSON.parse(this.store[k]));
    } else {
      return Promise.resolve(null);
    }
  }

  _set(k, v) {
    return Promise.resolve()
    .then(() => {
      this.store[k] = JSON.stringify(v);
      return v;
    });
  }

  _del(k) {
    return Promise.resolve()
    .then(() => {
      const retVal = JSON.parse(this.store[k]);
      delete this.store[k];
      return retVal;
    });
  }
}
