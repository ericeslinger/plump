import * as Promise from 'bluebird';
import { Storage } from './storage';

function saneNumber(i) {
  return ((typeof i === 'number') && (!isNaN(i)) && (i !== Infinity) & (i !== -Infinity));
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
        return this.$$maxKey(t)
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
      return { [relationship]: (JSON.parse(arrayString) || []) };
    });
  }

  delete(t, id) {
    return this._del(this.keyString(t.$name, id));
  }

  add(t, id, relationshipTitle, childId, extras) {
    const Rel = t.$fields[relationshipTitle];
    const selfFieldName = Rel.field;
    const otherFieldName = Rel.relationship.otherField(selfFieldName);
    const thisKeyString = this.keyString(t.$name, id, relationshipTitle);
    const otherKeyString = this.keyString(Rel.relationship.$sides[otherFieldName], childId, Rel.otherside);
    return Promise.all([
      this._get(thisKeyString),
      this._get(otherKeyString),
    ])
    .then(([thisArrayString, otherArrayString]) => {
      const thisArray = JSON.parse(thisArrayString) || [];
      const otherArray = JSON.parse(otherArrayString) || [];
      const idx = thisArray.findIndex((v) => {
        return ((v[selfFieldName] === id) && (v[otherFieldName] === childId));
      });
      if (idx < 0) {
        const newRelationship = { [selfFieldName]: id, [otherFieldName]: childId };
        (Rel.relationship.$extras || []).forEach((e) => {
          newRelationship[e] = extras[e];
        });
        thisArray.push(newRelationship);
        otherArray.push(newRelationship);
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

  modifyRelationship(t, id, relationshipTitle, childId, extras) {
    const Rel = t.$fields[relationshipTitle];
    const selfFieldName = Rel.field;
    const otherFieldName = Rel.relationship.otherField(selfFieldName);
    const thisKeyString = this.keyString(t.$name, id, relationshipTitle);
    const otherKeyString = this.keyString(Rel.relationship.$sides[otherFieldName], childId, Rel.otherside);
    return Promise.all([
      this._get(thisKeyString),
      this._get(otherKeyString),
    ])
    .then(([thisArrayString, otherArrayString]) => {
      const thisArray = JSON.parse(thisArrayString) || [];
      const otherArray = JSON.parse(otherArrayString) || [];
      const thisIdx = thisArray.findIndex((v) => {
        return ((v[selfFieldName] === id) && (v[otherFieldName] === childId));
      });
      const otherIdx = otherArray.findIndex((v) => {
        return ((v[selfFieldName] === id) && (v[otherFieldName] === childId));
      });
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

  remove(t, id, relationshipTitle, childId) {
    const Rel = t.$fields[relationshipTitle];
    const selfFieldName = Rel.field;
    const otherFieldName = Rel.relationship.otherField(selfFieldName);
    const thisKeyString = this.keyString(t.$name, id, relationshipTitle);
    const otherKeyString = this.keyString(Rel.relationship.$sides[otherFieldName], childId, Rel.otherside);
    return Promise.all([
      this._get(thisKeyString),
      this._get(otherKeyString),
    ])
    .then(([thisArrayString, otherArrayString]) => {
      const thisArray = JSON.parse(thisArrayString) || [];
      const otherArray = JSON.parse(otherArrayString) || [];
      const thisIdx = thisArray.findIndex((v) => {
        return ((v[selfFieldName] === id) && (v[otherFieldName] === childId));
      });
      const otherIdx = otherArray.findIndex((v) => {
        return ((v[selfFieldName] === id) && (v[otherFieldName] === childId));
      });
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
