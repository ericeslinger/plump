import * as Promise from 'bluebird';
import { Storage } from './storage';
import { createFilter } from './createFilter';

function saneNumber(i) {
  return ((typeof i === 'number') && (!isNaN(i)) && (i !== Infinity) & (i !== -Infinity));
}

function findEntryCallback(relationship, relationshipTitle, target) {
  const sideInfo = relationship.$sides[relationshipTitle];
  return (value) => {
    if (
      (value[sideInfo.self.field] === target[sideInfo.self.field]) &&
      (value[sideInfo.other.field] === target[sideInfo.other.field])
    ) {
      if (relationship.$restrict) {
        return Object.keys(relationship.$restrict).reduce(
          (prior, restriction) => prior && value[restriction] === relationship.$restrict[restriction].value,
          true
        );
      } else {
        return true;
      }
    } else {
      return false;
    }
  };
}

export class KeyValueStore extends Storage {
  $$maxKey(t) {
    return this._keys(t)
    .then((keyArray) => {
      if (keyArray.length === 0) {
        return 0;
      } else {
        return keyArray.map((k) => k.split(':')[2])
        .map((k) => parseInt(k, 10))
        .filter((i) => saneNumber(i))
        .reduce((max, current) => (current > max) ? current : max, 0);
      }
    });
  }

  write(t, v) {
    const id = v[t.$id];
    const updateObject = {};
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
    if (id === undefined) {
      if (this.terminal) {
        return this.$$maxKey(t.$name)
        .then((n) => {
          const toSave = Object.assign({}, { [t.$id]: n + 1 }, updateObject);
          return this._set(this.keyString(t.$name, n + 1), JSON.stringify(toSave))
          .then(() => toSave);
        });
      } else {
        throw new Error('Cannot create new content in a non-terminal store');
      }
    } else {
      return this._get(this.keyString(t.$name, id))
      .then((origValue) => {
        const update = Object.assign({}, JSON.parse(origValue), updateObject);
        return this._set(this.keyString(t.$name, id), JSON.stringify(update))
        .then(() => update);
      });
    }
  }

  readOne(t, id) {
    return this._get(this.keyString(t.$name, id))
    .then((d) => JSON.parse(d));
  }

  readMany(t, id, relationship) {
    return this._get(this.keyString(t.$name, id, relationship))
    .then((arrayString) => {
      let relationshipArray = JSON.parse(arrayString) || [];
      const relationshipType = t.$fields[relationship].relationship;
      if (relationshipType.$sides[relationship].self.query) {
        const filterBlock = Storage.massReplace(relationshipType.$sides[relationship].self.query, { id });
        relationshipArray = relationshipArray.filter(createFilter(filterBlock));
      }
      if (relationshipType.$restrict) {
        return relationshipArray.filter((v) => {
          return Object.keys(relationshipType.$restrict).reduce(
            (prior, restriction) => prior && v[restriction] === relationshipType.$restrict[restriction].value,
            true
          );
        }).map((entry) => {
          Object.keys(relationshipType.$restrict).forEach((k) => {
            delete entry[k]; // eslint-disable-line no-param-reassign
          });
          return entry;
        });
      } else {
        return relationshipArray;
      }
    }).then((ary) => {
      return { [relationship]: ary };
    });
  }

  delete(t, id) {
    return this._del(this.keyString(t.$name, id));
  }

  add(type, id, relationshipTitle, childId, extras = {}) {
    const relationshipBlock = type.$fields[relationshipTitle].relationship;
    const sideInfo = relationshipBlock.$sides[relationshipTitle];
    const thisKeyString = this.keyString(type.$name, id, relationshipTitle);
    const otherKeyString = this.keyString(sideInfo.other.type, childId, sideInfo.other.title);
    return Promise.all([
      this._get(thisKeyString),
      this._get(otherKeyString),
    ])
    .then(([thisArrayString, otherArrayString]) => {
      const thisArray = JSON.parse(thisArrayString) || [];
      const otherArray = JSON.parse(otherArrayString) || [];
      const newField = {
        [sideInfo.other.field]: childId,
        [sideInfo.self.field]: id,
      };
      const idx = thisArray.findIndex(findEntryCallback(relationshipBlock, relationshipTitle, newField));
      if (idx < 0) {
        if (relationshipBlock.$restrict) {
          Object.keys(relationshipBlock.$restrict).forEach((restriction) => {
            newField[restriction] = relationshipBlock.$restrict[restriction].value;
          });
        }
        if (relationshipBlock.$extras) {
          Object.keys(relationshipBlock.$extras).forEach((extra) => {
            newField[extra] = extras[extra];
          });
        }
        thisArray.push(newField);
        otherArray.push(newField);
        return Promise.all([
          this._set(thisKeyString, JSON.stringify(thisArray)),
          this._set(otherKeyString, JSON.stringify(otherArray)),
        ])
        .then(() => thisArray);
      } else {
        return thisArray;
      }
    });
  }

  modifyRelationship(type, id, relationshipTitle, childId, extras) {
    const relationshipBlock = type.$fields[relationshipTitle].relationship;
    const sideInfo = relationshipBlock.$sides[relationshipTitle];
    const thisKeyString = this.keyString(type.$name, id, relationshipTitle);
    const otherKeyString = this.keyString(sideInfo.other.type, childId, sideInfo.other.title);
    return Promise.all([
      this._get(thisKeyString),
      this._get(otherKeyString),
    ])
    .then(([thisArrayString, otherArrayString]) => {
      const thisArray = JSON.parse(thisArrayString) || [];
      const otherArray = JSON.parse(otherArrayString) || [];
      const target = {
        [sideInfo.other.field]: childId,
        [sideInfo.self.field]: id,
      };
      const thisIdx = thisArray.findIndex(findEntryCallback(relationshipBlock, relationshipTitle, target));
      const otherIdx = otherArray.findIndex(findEntryCallback(relationshipBlock, relationshipTitle, target));
      if (thisIdx >= 0) {
        const modifiedRelationship = Object.assign(
          {},
          thisArray[thisIdx],
          extras
        );
        thisArray[thisIdx] = modifiedRelationship;
        otherArray[otherIdx] = modifiedRelationship;
        return Promise.all([
          this._set(thisKeyString, JSON.stringify(thisArray)),
          this._set(otherKeyString, JSON.stringify(otherArray)),
        ])
        .then(() => thisArray);
      } else {
        return thisArray;
      }
    });
  }

  remove(type, id, relationshipTitle, childId) {
    const relationshipBlock = type.$fields[relationshipTitle].relationship;
    const sideInfo = relationshipBlock.$sides[relationshipTitle];
    const thisKeyString = this.keyString(type.$name, id, relationshipTitle);
    const otherKeyString = this.keyString(sideInfo.other.type, childId, sideInfo.other.title);
    return Promise.all([
      this._get(thisKeyString),
      this._get(otherKeyString),
    ])
    .then(([thisArrayString, otherArrayString]) => {
      const thisArray = JSON.parse(thisArrayString) || [];
      const otherArray = JSON.parse(otherArrayString) || [];
      const target = {
        [sideInfo.other.field]: childId,
        [sideInfo.self.field]: id,
      };
      const thisIdx = thisArray.findIndex(findEntryCallback(relationshipBlock, relationshipTitle, target));
      const otherIdx = otherArray.findIndex(findEntryCallback(relationshipBlock, relationshipTitle, target));
      if (thisIdx >= 0) {
        thisArray.splice(thisIdx, 1);
        otherArray.splice(otherIdx, 1);
        return Promise.all([
          this._set(thisKeyString, JSON.stringify(thisArray)),
          this._set(otherKeyString, JSON.stringify(otherArray)),
        ])
        .then(() => thisArray);
      } else {
        return thisArray;
      }
    });
  }

  keyString(typeName, id, relationship) {
    return `${typeName}:${relationship || 'store'}:${id}`;
  }
}
