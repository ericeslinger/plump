/* eslint no-unused-vars: 0 */

import * as Promise from 'bluebird';

export class Storage {

  constructor() {
    this.isCache = false;
  }

  create(t, v) {
    // t: type (string) v: value
    // if v.id === undefined, this is a true create otherwise it is a store
    return Promise.reject(new Error('Create not implemented'));
  }

  store(t, key, v) {
    // t: type (string), key: key (primitive), v: value
    // often (but not always, v.id === key)
    return Promise.reject(new Error('Store not implemented'));
  }

  read(t, id) {
    // t: type (string), id: id (usually int)
    return Promise.reject(new Error('Read not implemented'));
  }

  update(t, v) {
    // t: type (string) v: value
    // v.id must not be undefined
    return Promise.reject(new Error('Update not implemented'));
  }

  delete(t, id) {
    // t: type (string), id: id (usually int)
    return Promise.reject(new Error('Delete not implemented'));
  }

  query(q) {
    // q: {type: string, query: any}
    // q.query is impl defined - a string for sql (raw sql)
    return Promise.reject(new Error('Query not implemented'));
  }
}
