import * as Promise from 'bluebird';
import {Storage} from './storage';

export class MemoryStorage extends Storage {

  constructor() {
    super();
    this.isCache = true;
    this._storage = [];
  }

  $ensure(t) {
    if (this._storage[t] === undefined) {
      this._storage[t] = {};
    }
    return this._storage[t];
  }

  create(t, v) {
    if (this.$ensure(t)[v.id] === undefined) {
      this.$ensure(t)[v.id] = v;
      return Promise.resolve(v);
    } else {
      return Promise.reject(new Error('Cannot overwrite existing value in memstore'));
    }
  }

  read(t, id) {
    if (this.$ensure(t) === undefined) {
      return Promise.reject(new Error(`cannot find storage for type ${t}`));
    } else {
      return Promise.resolve(this.$ensure(t)[id] || null);
    }
  }

  update(t, id, v) {
    if (this.$ensure(t) === undefined) {
      return Promise.reject(new Error(`cannot find storage for type ${t}`));
    } else {
      this.$ensure(t)[id] = v;
      return Promise.resolve(this.$ensure(t)[id]);
    }
  }

  delete(t, id) {
    if (this.$ensure(t) === undefined) {
      return Promise.reject(new Error(`cannot find storage for type ${t}`));
    } else {
      const retVal = this.$ensure(t)[id];
      delete this.$ensure(t)[id];
      return Promise.resolve(retVal);
    }
  }

  query() {
    return Promise.reject('Query interface not supported on MemoryStorage');
  }
}
