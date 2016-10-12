import * as Promise from 'bluebird';
import {Storage} from './storage';

const $store = Symbol('$store');

export class MemoryStorage extends Storage {

  constructor(...args) {
    super(...args);
    this[$store] = {};
    this.maxId = 0;
  }

  $$ensure(t) {
    if (this[$store][t.$name] === undefined) {
      this[$store][t.$name] = {};
    }
    return this[$store][t.$name];
  }

  write(t, v) {
    let id = v[t.$id];
    if (id === undefined) {
      if (this.terminal) {
        id = this.maxId + 1;
      } else {
        throw new Error('Cannot create new content in a non-terminal store');
      }
    }
    let updateObject = this.$$ensure(t)[id];
    if (updateObject === undefined) {
      this.maxId = id;
      updateObject = {
        [t.$id]: id,
      };
      this.$$ensure(t)[id] = updateObject;
    }
    Object.keys(t.$fields).forEach((fieldName) => {
      if (v[fieldName] !== undefined) {
        // copy from v to the best of our ability
        if (
          (t.$fields[fieldName].type === 'array') ||
          (t.$fields[fieldName].type === 'hasMany')
        ) {
          updateObject[fieldName] = v[fieldName].concat();
        } else if (t.$fields[fieldName].type === 'object') {
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

  add(t, id, relationship, childId) {
    let relationshipArray = this.$$ensure(t)[`${relationship}:${id}`];
    if (relationshipArray === undefined) {
      relationshipArray = [];
      this.$$ensure(t)[`${relationship}:${id}`] = relationshipArray;
    }
    if (relationshipArray.indexOf(childId) < 0) {
      relationshipArray.push(childId);
    }
    return Promise.resolve(relationshipArray.concat());
  }

  read(t, id, relationship) {
    return Promise.resolve()
    .then(() => {
      if (relationship && (t.$fields[relationship].type === 'hasMany')) {
        return {[relationship]: (this.$$ensure(t)[`${relationship}:${id}`] || []).concat()};
      } else {
        return Promise.resolve(this.$$ensure(t)[id] || null);
      }
    });
  }

  remove(t, id, relationship, childId) {
    const relationshipArray = this.$$ensure(t)[`${relationship}:${id}`];
    if (relationshipArray !== undefined) {
      const idx = relationshipArray.indexOf(childId);
      if (idx >= 0) {
        relationshipArray.splice(idx, 1);
        return Promise.resolve(relationshipArray.concat());
      }
    }
    return Promise.reject(new Error(`Item ${childId} not found in ${relationship} of ${t.$name}`));
  }

  query() {
    return Promise.reject(new Error('Query interface not supported on MemoryStorage'));
  }
}
