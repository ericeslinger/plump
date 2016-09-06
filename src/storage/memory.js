import * as Promise from 'bluebird';
import {Storage} from './storage';

const $store = Symbol('$store');

export class MemoryStorage extends Storage {

  constructor() {
    super();
    this[$store] = [];
  }

  $$ensure(t) {
    if (this[$store][t.$name] === undefined) {
      this[$store][t.$name] = {};
    }
    return this[$store][t.$name];
  }

  create(t, v) {
    if (this.$$ensure(t)[v.id] === undefined) {
      this.$$ensure(t)[v.id] = v;
      return Promise.resolve(v);
    } else {
      return Promise.reject(new Error('Cannot overwrite existing value in memstore'));
    }
  }

  read(t, id) {
    return Promise.resolve(this.$$ensure(t)[id] || null);
  }

  update(t, v) {
    if (this.$$ensure(t)[t.$id] === undefined) {
      this.$$ensure(t)[t.$id] = {
        [t.constructor.$id]: t.$id,
      };
    }
    const updateObject = this.$$ensure(t)[t.$id];
    Object.keys(t.constructor.$fields).forEach((fieldName) => {
      if (v[fieldName] !== undefined) {
        // copy from v to the best of our ability
        if (
          (t.constructor.$fields[fieldName].type === 'array') ||
          (t.constructor.$fields[fieldName].type === 'hasMany')
        ) {
          updateObject[fieldName] = v[fieldName].concat();
        } else if (t.constructor.$fields[fieldName].type === 'object') {
          updateObject[fieldName] = Object.assign({}, v[fieldName]);
        } else {
          updateObject[fieldName] = v[fieldName];
        }
      }
    });
    return Promise.resolve(Object.assign({}, updateObject));
  }

  delete(t, id) {
    const retVal = this.$$ensure(t)[id];
    delete this.$$ensure(t)[id];
    return Promise.resolve(retVal);
  }

  query() {
    return Promise.reject(new Error('Query interface not supported on MemoryStorage'));
  }
}
