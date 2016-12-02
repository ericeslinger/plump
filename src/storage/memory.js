import * as Promise from 'bluebird';
import { KeyValueStore } from './keyValueStore';

const $store = Symbol('$store');

export class MemoryStorage extends KeyValueStore {

  constructor(...args) {
    super(...args);
    this[$store] = {};
  }

  logStore() {
    console.log(JSON.stringify(this[$store], null, 2));
  }

  _keys(typeName) {
    return Promise.resolve(Object.keys(this[$store]).filter((k) => k.indexOf(`${typeName}:store:`) === 0));
  }

  _get(k) {
    return Promise.resolve(this[$store][k] || null);
  }

  _set(k, v) {
    return Promise.resolve()
    .then(() => {
      this[$store][k] = v;
    });
  }

  _del(k) {
    return Promise.resolve()
    .then(() => {
      const retVal = this[$store][k];
      delete this[$store][k];
      return retVal;
    });
  }
}