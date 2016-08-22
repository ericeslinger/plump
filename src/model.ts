import {StorageService} from './storage/storageService';

export class Model {
  private _storage: {
    [key: string]: any;
  } = {};

  private static _dataServices: [StorageService];
  public static addStorageService(ds: StorageService) {
    this._dataServices.push(ds);
  }
}

/*
  annotate attribute to denote model info. use get/set to store.
  expose get/set on lifecycle hooks, also use updated etc.

  POSSIBLY make this unsettable - only do on update({attr: val})

  HANDLE push / pull sql and http
  HANDLE cache mem, redis, localforage
*/
