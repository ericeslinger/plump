import {StorageService} from './storage/storageService';

export class Model {
  private _storage: {
    [key: string]: any;
  } = {};

  public tableName = 'models';

  private _id: number;
  private static _storageServices: [StorageService];
  public static addStorageService(ds: StorageService) {
    this._storageServices.push(ds);
  }

  constructor(opts: any = {}) {
    if (opts.id) {
      this._id = opts.id;
    } else {
      this.set(opts);
    }
  }

  public set(opts: any)
  public set(key: string, val: any)
  public set(a: string | any, val?: any) {
    if (typeof a === 'string') {
      this._storage[a] = val;
    } else {
      Object.keys(a).forEach((k) => this._storage[k] = a[k]);
    }
  }

  private getStorageServices(): [StorageService] {
    return this.constructor['_storageServices'];
  }

  public resolve(key: string) {
    if (this._storage[key]) {
      return Promise.resolve(this._storage[key]);
    } else {
      return this.getStorageServices().reduce((thenable, service) => {
        return thenable.then((v) => {
          if (v === null) {
            return service.read(this.tableName, this._id);
          } else {
            return v;
          }
        });
      }, Promise.resolve(null));
    }
  }
}

/*
  annotate attribute to denote model info. use get/set to store.
  expose get/set on lifecycle hooks, also use updated etc.

  POSSIBLY make this unsettable - only do on update({attr: val})

  HANDLE push / pull sql and http
  HANDLE cache mem, redis, localforage
*/
