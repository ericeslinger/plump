import * as Promise from 'bluebird';
import {Storage} from './storage';

const $store = Symbol('$store');

export class MemoryStorage extends Storage {

  constructor(...args) {
    super(...args);
    this[$store] = {};
    this.maxId = 0;
  }

  $$ensure(t, id) {
    if (this[$store][t.$name] === undefined) {
      this[$store][t.$name] = {};
    }
    if (id !== undefined) {
      if (this[$store][t.$name][id] === undefined) {
        this[$store][t.$name][id] = {};
      }
      return this[$store][t.$name][id];
    } else {
      return this[$store][t.$name];
    }
  }

  $$getRelationship(t, parentId, relationship, childId) {
    if (this.$$ensure(t, parentId)[relationship] === undefined) {
      const newAry = [];
      this.$$ensure(t, parentId)[relationship] = newAry;
    }
    if (childId !== undefined) {
      const theOther = t.$fields[relationship].relationship.otherType(relationship);
      const childObj = this.$$ensure(theOther, childId);
      if (childObj[theOther.$name] === undefined) {
        childObj[theOther.$name] = this.$$ensure(t, parentId)[relationship];
      }
    }
    return this.$$ensure(t, parentId)[relationship];
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

  add(t, id, relationship, childId, extras) {
    const Rel = t.$fields[relationship].relationship;
    const relationshipArray = this.$$getRelationship(t, id, relationship, childId);
    // store: {parent_id: 1, child_id: 2, perm: 3}
    const otherField = Rel.$sides[relationship];
    const selfField = Rel.otherType(relationship);
    const idx = relationshipArray.findIndex((v) => ((v[selfField.field] === id) && (v[otherField.field] === childId)));
    if (idx < 0) {
      const newRelationship = {[selfField.field]: id, [otherField.field]: childId};
      (Rel.$extras || []).forEach((e) => {
        newRelationship[e] = extras[e];
      });
      relationshipArray.push(newRelationship);
    }
    return Promise.resolve(relationshipArray.concat());
  }

  readOne(t, id) {
    return Promise.resolve(this.$$ensure(t)[id] || null);
  }

  readMany(t, id, relationship) {
    return Promise.resolve({[relationship]: (this.$$getRelationship(t, id, relationship) || []).concat()});
  }

  modifyRelationship(t, id, relationship, childId, extras) {
    const Rel = t.$fields[relationship].relationship;
    const relationshipArray = this.$$getRelationship(t, id, relationship, childId);
    // store: {parent_id: 1, child_id: 2, perm: 3}
    const otherField = Rel.$sides[relationship];
    const selfField = Rel.otherType(relationship);
    const idx = relationshipArray.findIndex((v) => ((v[selfField.field] === id) && (v[otherField.field] === childId)));
    if (idx >= 0) {
      relationshipArray[idx] = Object.assign(
        {},
        relationshipArray[idx],
        extras
      );
      return Promise.resolve(relationshipArray.concat());
    } else {
      return Promise.reject(new Error(`Item ${childId} not found in ${relationship} of ${t.$name}`));
    }
  }

  remove(t, id, relationship, childId) {
    const Rel = t.$fields[relationship].relationship;
    const relationshipArray = this.$$getRelationship(t, id, relationship, childId);
    // store: {parent_id: 1, child_id: 2, perm: 3}
    const otherField = Rel.$sides[relationship];
    const selfField = Rel.otherType(relationship);
    const idx = relationshipArray.findIndex((v) => ((v[selfField.field] === id) && (v[otherField.field] === childId)));
    if (idx >= 0) {
      relationshipArray.splice(idx, 1);
      return Promise.resolve(relationshipArray.concat());
    }
    return Promise.reject(new Error(`Item ${childId} not found in ${relationship} of ${t.$name}`));
  }

  query() {
    return Promise.reject(new Error('Query interface not supported on MemoryStorage'));
  }
}
