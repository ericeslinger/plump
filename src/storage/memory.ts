import {StorageService} from './storageService';
import * as Promise from 'bluebird';
import {Dictionary, Storable} from './storable';

export class MemoryStorage implements StorageService {
  private _storage: any = {};

  public create(t: string, v: Storable) {
    if (this._storage[t][v.id] === undefined) {
      this._storage[t][v.id] = v;
      return Promise.resolve(v);
    } else {
      return Promise.reject(new Error('Cannot overwrite existing value in memstore'));
    }
  }

  public read(t: string, id: number) {
    if (this._storage[t] === undefined) {
      return Promise.reject(new Error(`cannot find storage for type ${t}`));
    } else {
      return Promise.resolve(this._storage[t][id] || null);
    }
  }

  public update(t: string, id: number, v: Storable) {
    if (this._storage[t] === undefined) {
      return Promise.reject(new Error(`cannot find storage for type ${t}`));
    } else {
      this._storage[t][id] = v;
      return Promise.resolve(this._storage[t][id]);
    }
  }

  public delete(t: string, id: number) {
    if (this._storage[t] === undefined) {
      return Promise.reject(new Error(`cannot find storage for type ${t}`));
    } else {
      const retVal = this._storage[t][id];
      delete this._storage[t][id];
      return Promise.resolve(retVal);
    }
  }

  public query(q: {type: string, query: any}) {
    return Promise.reject('Query interface not supported on MemoryStorage');
  }

  public name: 'MemoryStorage';

}
