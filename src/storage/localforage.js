import * as localforage from 'localforage';
import * as Promise from 'bluebird';
import {Storage} from './storage';

export class LocalForageStorage extends Storage {

  constructor(opts = {}) {
    super();
    this.isCache = true;
    localforage.config({
      name: opts.name || 'Trellis Storage',
      storeName: opts.storeName || 'localCache',
    });
  }

  create(t, v) {
    if (v.id === undefined) {
      return Promise.reject('This service cannot allocate ID values');
    } else {
      return localforage.setItem(`${t}:${v.id}`, v);
    }
  }

  read(t, id) {
    return localforage.getItem(`${t}:${id}`);
  }

  update(t, id, v) {
    return this.create(t, v);
  }

  delete(t, id) {
    return localforage.removeItem(`${t}:${id}`);
  }

  query() {
    return Promise.reject('Query interface not supported on LocalForageStorage');
  }
}
