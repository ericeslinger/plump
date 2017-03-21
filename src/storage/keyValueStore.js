import * as Bluebird from 'bluebird';
import mergeOptions from 'merge-options';

import { Storage } from './storage';

function saneNumber(i) {
  return ((typeof i === 'number') && (!isNaN(i)) && (i !== Infinity) & (i !== -Infinity));
}

// function applyDelta(base, delta) {
//   if (delta.op === 'add' || delta.op === 'modify') {
//     const retVal = mergeOptions({}, base, delta.data);
//     return retVal;
//   } else if (delta.op === 'remove') {
//     return undefined;
//   } else {
//     return base;
//   }
// }

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

  writeAttributes(inputValue) {
    const value = this.validateInput(inputValue);
    delete value.relationships;
    // trim out relationships for a direct write.
    return Bluebird.resolve()
    .then(() => {
      if (!this.terminal) {
        throw new Error('Cannot create new content in a non-terminal store');
      }
    })
    .then(() => {
      if ((value.id === undefined) || (value.id === null)) {
        return this.$$maxKey(value.type)
        .then((n) => {
          const id = n + 1;
          return mergeOptions({}, value, { id: id, relationships: {} }); // if new.
        });
      } else {
        // if not new, get current (including relationships) and merge
        return this._get(this.keyString(value)).then(current => mergeOptions({}, JSON.parse(current), value));
      }
    })
    .then((toSave) => {
      return this._set(this.keyString(toSave), JSON.stringify(toSave))
      .then(() => {
        this.fireWriteUpdate(Object.assign({}, toSave, { invalidate: ['attributes'] }));
        return toSave;
      });
    });
  }

  readAttributes(value) {
    return this._get(this.keyString(value))
    .then(d => JSON.parse(d));
  }

  cacheAttributes(value) {
    if ((value.id === undefined) || (value.id === null)) {
      return Bluebird.reject('Cannot cache data without an id - write it to a terminal first');
    } else {
      return this._get(this.keyString(value))
      .then((current) => {
        return this._set(this.keyString(value), JSON.stringify({
          type: value.type,
          id: value.id,
          atttributes: value.attributes,
          relationships: current.relationships || {},
        }));
      });
    }
  }

  readRelationship(value, relName) {
    return this._get(this.keyString(value))
    .then((v) => {
      const retVal = JSON.parse(v);
      if (!retVal.relationships[relName] && this.terminal) {
        retVal.relationships[relName] = [];
      }
      return retVal;
    });
  }

  delete(value) {
    return this._del(this.keyString(value))
    .then(() => {
      if (this.terminal) {
        this.fireWriteUpdate({ id: value.id, type: value.type, invalidate: ['attributes', 'relationships'] });
      }
    });
  }

  wipe(type, id, field) {
    const t = this.getType(type);
    if (field === 'attributes') {
      return this._del(this.keyString(t.$name, id));
    } else {
      return this._del(this.keyString(t.$name, id, field));
    }
  }

  writeRelationshipItem(value, relName, child) {
    const type = this.getType(value.type);
    const relSchema = type.$schema.relationships[relName].type;
    const otherRelType = relSchema.$sides[relName].otherType;
    const otherRelName = relSchema.$sides[relName].otherSide;
    const thisKeyString = this.keyString(value);
    const otherKeyString = this.keyString({ type: otherRelType, id: child.id });
    return Bluebird.all([
      this._get(thisKeyString),
      this._get(otherKeyString),
    ])
    .then(([thisItemString, otherItemString]) => {
      const thisItem = JSON.parse(thisItemString);
      const otherItem = JSON.parse(otherItemString);
      const newChild = { id: child.id };
      const newParent = { id: value.id };
      if (!thisItem.relationships[relName]) {
        thisItem.relationships[relName] = [];
      }
      if (!otherItem.relationships[otherRelName]) {
        otherItem.relationships[otherRelName] = [];
      }
      if (relSchema.$extras && child.meta) {
        newParent.meta = {};
        newChild.meta = {};
        for (const extra in child.meta) {
          if (extra in relSchema.$extras) {
            newChild.meta[extra] = child.meta[extra];
            newParent.meta[extra] = child.meta[extra];
          }
        }
      }

      const thisIdx = thisItem.relationships[relName].findIndex(item => item.id === child.id);
      const otherIdx = otherItem.relationships[otherRelName].findIndex(item => item.id === value.id);
      if (thisIdx < 0) {
        thisItem.relationships[relName].push(newChild);
      } else {
        thisItem.relationships[relName][thisIdx] = newChild;
      }
      if (otherIdx < 0) {
        otherItem.relationships[otherRelName].push(newParent);
      } else {
        otherItem.relationships[otherRelName][otherIdx] = newParent;
      }

      return Bluebird.all([
        this._set(this.keyString(thisItem.type, thisItem.id), JSON.stringify(thisItem)),
        this._set(this.keyString(otherItem.type, otherItem.id), JSON.stringify(otherItem)),
      ]).then(() => {
        this.fireWriteUpdate(Object.assign(thisItem, { invalidate: [`relationships.${relName}`] }));
        this.fireWriteUpdate(Object.assign(otherItem, { invalidate: [`relationships.${otherRelName}`] }));
      })
      .then(() => thisItem);
    });
  }

  deleteRelationshipItem(value, relName, childId) {
    const type = this.getType(value.type);
    const relSchema = type.$schema.relationships[relName].type;
    const otherRelType = relSchema.$sides[relName].otherType;
    const otherRelName = relSchema.$sides[relName].otherSide;
    const thisKeyString = this.keyString(value);
    const otherKeyString = this.keyString({ type: otherRelType, id: childId });
    return Bluebird.all([
      this._get(thisKeyString),
      this._get(otherKeyString),
    ])
    .then(([thisItemString, otherItemString]) => {
      const thisItem = JSON.parse(thisItemString);
      const otherItem = JSON.parse(otherItemString);
      if (!thisItem.relationships[relName]) {
        thisItem.relationships[relName] = [];
      }
      if (!otherItem.relationships[otherRelName]) {
        otherItem.relationships[otherRelName] = [];
      }
      const thisIdx = thisItem.relationships[relName].findIndex(item => item.id === childId);
      const otherIdx = otherItem.relationships[otherRelName].findIndex(item => item.id === value.id);
      if (thisIdx >= 0) {
        thisItem.relationships[relName].splice(thisIdx, 1);
      }
      if (otherIdx >= 0) {
        otherItem.relationships[otherRelName].splice(otherIdx, 1);
      }

      return Bluebird.all([
        this._set(this.keyString(thisItem), JSON.stringify(thisItem)),
        this._set(this.keyString(otherItem), JSON.stringify(otherItem)),
      ]).then(() => {
        this.fireWriteUpdate(Object.assign(thisItem, { invalidate: [`relationships.${relName}`] }));
        this.fireWriteUpdate(Object.assign(otherItem, { invalidate: [`relationships.${otherRelName}`] }));
      })
      .then(() => thisItem);
    });
  }

  cacheRelationship(value) {
    if ((value.id === undefined) || (value.id === null)) {
      return Bluebird.reject('Cannot cache data without an id - write it to a terminal first');
    } else {
      return this._get(this.keyString(value))
      .then((current) => {
        return this._set(this.keyString(value), JSON.stringify({
          type: value.type,
          id: value.id,
          atttributes: current.attributes || {},
          relationships: value.relationships,
        }));
      });
    }
  }

  keyString(value) {
    return `${value.type}:${value.id}`;
  }
}
