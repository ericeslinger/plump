import * as Bluebird from 'bluebird';
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
    return Bluebird.resolve(Object.keys(this.store).filter((k) => k.indexOf(`${typeName}:attributes:`) === 0));
  }

  _get(k) {
    if (this.store[k]) {
      return Bluebird.resolve(JSON.parse(this.store[k]));
    } else {
      return Bluebird.resolve(null);
    }
  }

  _set(k, v) {
    return Bluebird.resolve()
    .then(() => {
      this.store[k] = JSON.stringify(v);
      return v;
    });
  }

  _del(k) {
    return Bluebird.resolve()
    .then(() => {
      const retVal = JSON.parse(this.store[k]);
      delete this.store[k];
      return retVal;
    });
  }
}
