import * as Bluebird from 'bluebird';
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

function maybePush(array, val, keystring, store, idx) {
  return Bluebird.resolve()
  .then(() => {
    if (idx < 0) {
      array.push(val);
      return store._set(keystring, JSON.stringify(array));
    } else {
      return null;
    }
  });
}


function maybeUpdate(array, val, keystring, store, extras, idx) {
  return Bluebird.resolve()
  .then(() => {
    if (idx >= 0) {
      const modifiedRelationship = Object.assign(
        {},
        array[idx],
        extras
      );
      array[idx] = modifiedRelationship; // eslint-disable-line no-param-reassign
      return store._set(keystring, JSON.stringify(array));
    } else {
      return null;
    }
  });
}

function maybeDelete(array, idx, keystring, store) {
  return Bluebird.resolve()
  .then(() => {
    if (idx >= 0) {
      array.splice(idx, 1);
      return store._set(keystring, JSON.stringify(array));
    } else {
      return null;
    }
  });
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
          .then(() => {
            return this.notifyUpdate(t, toSave[t.$id], toSave);
          })
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
        .then(() => {
          return this.notifyUpdate(t, id, update);
        })
        .then(() => update);
      });
    }
  }

  readOne(t, id) {
    return this._get(this.keyString(t.$name, id))
    .then((d) => JSON.parse(d));
  }

  readMany(t, id, relationship) {
    const relationshipType = t.$fields[relationship].relationship;
    const sideInfo = relationshipType.$sides[relationship];
    return Bluebird.resolve()
    .then(() => {
      const resolves = [this._get(this.keyString(t.$name, id, relationshipType.$name))];
      if (sideInfo.self.query && sideInfo.self.query.requireLoad) {
        resolves.push(this.readOne(t, id));
      } else {
        resolves.push(Bluebird.resolve({ id }));
      }
      return Bluebird.all(resolves);
    })
    .then(([arrayString, context]) => {
      let relationshipArray = JSON.parse(arrayString) || [];
      if (sideInfo.self.query) {
        const filterBlock = Storage.massReplace(sideInfo.self.query.logic, context);
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

  writeHasMany(type, id, field, value) {
    let toSave = value;
    const relationshipBlock = type.$fields[field].relationship;
    if (relationshipBlock.$restrict) {
      const restrictBlock = {};
      Object.keys(relationshipBlock.$restrict).forEach((k) => {
        restrictBlock[k] = relationshipBlock.$restrict[k].value;
      });
      toSave = toSave.map((v) => Object.assign({}, v, restrictBlock));
    }
    // const sideInfo = relationshipBlock.$sides[field];
    const thisKeyString = this.keyString(type.$name, id, relationshipBlock.$name);
    return this._set(thisKeyString, JSON.stringify(toSave));
  }

  add(type, id, relationshipTitle, childId, extras = {}) {
    const relationshipBlock = type.$fields[relationshipTitle].relationship;
    const sideInfo = relationshipBlock.$sides[relationshipTitle];
    const thisKeyString = this.keyString(type.$name, id, relationshipBlock.$name);
    const otherKeyString = this.keyString(sideInfo.other.type, childId, relationshipBlock.$name);
    return Bluebird.all([
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
      const thisIdx = thisArray.findIndex(findEntryCallback(relationshipBlock, relationshipTitle, newField));
      const otherIdx = otherArray.findIndex(findEntryCallback(relationshipBlock, relationshipTitle, newField));
      return Bluebird.all([
        maybePush(thisArray, newField, thisKeyString, this, thisIdx),
        maybePush(otherArray, newField, otherKeyString, this, otherIdx),
      ])
      .then(() => this.notifyUpdate(type, id, null, relationshipTitle))
      .then(() => thisArray);
    });
  }

  modifyRelationship(type, id, relationshipTitle, childId, extras) {
    const relationshipBlock = type.$fields[relationshipTitle].relationship;
    const sideInfo = relationshipBlock.$sides[relationshipTitle];
    const thisKeyString = this.keyString(type.$name, id, relationshipBlock.$name);
    const otherKeyString = this.keyString(sideInfo.other.type, childId, relationshipBlock.$name);
    return Bluebird.all([
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
      return Bluebird.all([
        maybeUpdate(thisArray, target, thisKeyString, this, extras, thisIdx),
        maybeUpdate(otherArray, target, otherKeyString, this, extras, otherIdx),
      ]);
    })
    .then((res) => this.notifyUpdate(type, id, null, relationshipTitle).then(() => res));
  }

  remove(type, id, relationshipTitle, childId) {
    const relationshipBlock = type.$fields[relationshipTitle].relationship;
    const sideInfo = relationshipBlock.$sides[relationshipTitle];
    const thisKeyString = this.keyString(type.$name, id, relationshipBlock.$name);
    const otherKeyString = this.keyString(sideInfo.other.type, childId, relationshipBlock.$name);
    return Bluebird.all([
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
      return Bluebird.all([
        maybeDelete(thisArray, thisIdx, thisKeyString, this),
        maybeDelete(otherArray, otherIdx, otherKeyString, this),
      ]);
    })
    .then((res) => this.notifyUpdate(type, id, null, relationshipTitle).then(() => res));
  }

  keyString(typeName, id, relationship) {
    return `${typeName}:${relationship || 'store'}:${id}`;
  }
}
