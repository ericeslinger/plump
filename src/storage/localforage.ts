import * as localforage from 'localforage';
import { KeyValueStore } from './keyValueStore';

export class LocalForageStorage extends KeyValueStore {
  isCache: boolean;

  constructor(opts: { name?: string, storeName?: string } = {}) {
    super();
    this.isCache = true;
    localforage.config({
      name: opts.name || 'Trellis Storage',
      storeName: opts.storeName || 'localCache',
    });
  }

  _keys(typeName) {
    return localforage.keys()
    .then((keyArray) => keyArray.filter((k) => k.indexOf(`${typeName}:store:`) === 0));
  }

  _get(k) {
    return localforage.getItem(k);
  }

  _set(k, v) {
    return localforage.setItem(k, v);
  }

  _del(k) {
    return localforage.removeItem(k);
  }
}
