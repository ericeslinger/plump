const Promise = require('bluebird');

export class Model {
  constructor(opts = {}) {
    if (opts.id) {
      this._id = opts.id;
    } else {
      this.set(opts);
    }
  }

  set(a, val) {
    if (typeof a === 'string') {
      this._storage[a] = val;
    } else {
      Object.keys(a).forEach((k) => {
        this._storage[k] = a[k];
      });
    }
  }

  getStorageServices() {
    return this.constructor._storageServices;
  }

  resolve(key) {
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
