import * as Promise from 'bluebird';
import { Storage } from './storage';

const $store = Symbol('$store');

export class MemoryStorage extends Storage {

  constructor(...args) {
    super(...args);
    this[$store] = {};
    this.maxId = 0;
  }

  $$ensure(typeName, id) {
    if (this[$store][typeName] === undefined) {
      this[$store][typeName] = {};
    }
    if (id !== undefined) {
      if (this[$store][typeName][id] === undefined) {
        this[$store][typeName][id] = {};
      }
      return this[$store][typeName][id];
    } else {
      return this[$store][typeName];
    }
  }

  $$getRelationship(typeName, parentId, relationshipTitle) {
    if (this.$$ensure(typeName, parentId)[relationshipTitle] === undefined) {
      this.$$ensure(typeName, parentId)[relationshipTitle] = [];
    }
    return this.$$ensure(typeName, parentId)[relationshipTitle];
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
    let updateObject = this.$$ensure(t.$name)[id];
    if (updateObject === undefined) {
      this.maxId = id;
      updateObject = {
        [t.$id]: id,
      };
      this.$$ensure(t.$name)[id] = updateObject;
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
    const retVal = this.$$ensure(t.$name)[id];
    delete this.$$ensure(t.$name)[id];
    return Promise.resolve(retVal);
  }

  // relationshipTitle === name of relationship from type perspective, eg., model.relationship
  // relationshipName === absolute name of relationship, e.g., the table name of the join table

  add(t, id, relationshipTitle, childId, extras) {
    const Rel = t.$fields[relationshipTitle]; // {$fields}
    const relationshipArray = this.$$getRelationship(t.$name, id, relationshipTitle);
    const otherFieldName = Rel.field;
    const selfFieldName = Rel.relationship.otherField(otherFieldName);
    const idx = relationshipArray.findIndex((v) => {
      return ((v[selfFieldName] === id) && (v[otherFieldName] === childId));
    });
    if (idx < 0) {
      const newRelationship = { [selfFieldName]: id, [otherFieldName]: childId };
      (Rel.relationship.$extras || []).forEach((e) => {
        newRelationship[e] = extras[e];
      });
      relationshipArray.push(newRelationship);
      const otherTypeName = Rel.relationship.$sides[otherFieldName];
      const otherSide = Rel.otherSide;
      const otherRelationshipArray = this.$$getRelationship(otherTypeName, childId, otherSide);
      otherRelationshipArray.push(newRelationship);
    }
    return Promise.resolve(relationshipArray.concat());
  }

  readOne(t, id) {
    return Promise.resolve(this.$$ensure(t.$name)[id] || null);
  }

  readMany(t, id, relationship) {
    return Promise.resolve({ [relationship]: (this.$$getRelationship(t.$name, id, relationship) || []).concat() });
  }

  modifyRelationship(t, id, relationshipTitle, childId, extras) {
    const Rel = t.$fields[relationshipTitle]; // {$fields}
    const relationshipArray = this.$$getRelationship(t.$name, id, relationshipTitle);
    const otherFieldName = Rel.field;
    const selfFieldName = Rel.relationship.otherField(otherFieldName);
    const idx = relationshipArray.findIndex((v) => {
      return ((v[selfFieldName] === id) && (v[otherFieldName] === childId));
    });
    if (idx >= 0) {
      relationshipArray[idx] = Object.assign(
        relationshipArray[idx],
        extras
      );
      return Promise.resolve(relationshipArray.concat());
    } else {
      return Promise.reject(new Error(`Item ${childId} not found in ${relationshipTitle} of ${t.$name}`));
    }
  }


  remove(t, id, relationshipTitle, childId) {
    const Rel = t.$fields[relationshipTitle]; // {$fields}
    const relationshipArray = this.$$getRelationship(t.$name, id, relationshipTitle);
    const otherFieldName = Rel.field;
    const selfFieldName = Rel.relationship.otherField(otherFieldName);
    const idx = relationshipArray.findIndex((v) => {
      return ((v[selfFieldName] === id) && (v[otherFieldName] === childId));
    });
    if (idx >= 0) {
      const otherTypeName = Rel.relationship.$sides[otherFieldName];
      const otherSide = Rel.otherSide;
      const otherRelationshipArray = this.$$getRelationship(otherTypeName, childId, otherSide);
      const otherSideIdx = otherRelationshipArray.findIndex((v) => {
        return ((v[selfFieldName] === id) && (v[otherFieldName] === childId));
      });
      relationshipArray.splice(idx, 1);
      otherRelationshipArray.splice(otherSideIdx, 1);
      return Promise.resolve(relationshipArray.concat());
    } else {
      return Promise.reject(new Error(`Item ${childId} not found in ${relationshipTitle} of ${t.$name}`));
    }
  }

  query() {
    return Promise.reject(new Error('Query interface not supported on MemoryStorage'));
  }
}
