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
    .then(d => {
      const rV = JSON.parse(d);
      if (rV && rV.attributes && Object.keys(rV.attributes).length > 0) {
        return rV;
      } else {
        return null;
      }
    });
  }

  cache(value) {
    if ((value.id === undefined) || (value.id === null)) {
      return Bluebird.reject('Cannot cache data without an id - write it to a terminal first');
    } else {
      return this._get(this.keyString(value))
      .then((current) => {
        const newVal = mergeOptions(JSON.parse(current) || {}, value);
        return this._set(this.keyString(value), JSON.stringify(newVal));
      });
    }
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

  readRelationship(value, relName) {
    return this._get(this.keyString(value))
    .then((v) => {
      const retVal = JSON.parse(v);
      if (!v) {
        if (this.terminal) {
          return { type: value.type, id: value.id, relationships: { [relName]: [] } };
        } else {
          return null;
        }
      } else if (!v.relationships && this.terminal) {
        retVal.relationships = { [relName]: [] };
      } else if (!retVal.relationships[relName] && this.terminal) {
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

  wipe(value, field) {
    const ks = this.keyString(value);
    return this._get(ks)
    .then((val) => {
      const newVal = JSON.parse(val);
      if (newVal === null) {
        return null;
      }
      if (field === 'attributes') {
        delete newVal.attributes;
      } else if (field === 'relationships') {
        delete newVal.relationships;
      } else if (field.indexOf('relationships.') === 0) {
        delete newVal.relationships[field.split('.')[1]];
        if (Object.keys(newVal.relationships).length === 0) {
          delete newVal.relationships;
        }
      } else {
        throw new Error(`Cannot delete field ${field} - unknown format`);
      }
      return this._set(ks, JSON.stringify(newVal));
    });
  }

  writeRelationshipItem(value, relName, child) {
    if (child.id === undefined || value.type === undefined || value.id === undefined) {
      throw new Error('Invalid arguments to writeRelationshipItem');
    }
    const type = this.getType(value.type);
    const relSchema = type.$schema.relationships[relName].type;
    const otherRelType = relSchema.$sides[relName].otherType;
    const otherRelName = relSchema.$sides[relName].otherName;
    const thisKeyString = this.keyString(value);
    const otherKeyString = this.keyString({ type: otherRelType, id: child.id });
    return Bluebird.all([
      this._get(thisKeyString),
      this._get(otherKeyString),
    ])
    .then(([thisItemString, otherItemString]) => {
      let thisItem = JSON.parse(thisItemString);
      if (!thisItem) {
        thisItem = {
          id: child.id,
          type: otherRelType,
          attributes: {},
          relationships: {},
        };
      }
      let otherItem = JSON.parse(otherItemString);
      if (!otherItem) {
        otherItem = {
          id: child.id,
          type: otherRelType,
          attributes: {},
          relationships: {},
        };
      }
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
        this._set(this.keyString(thisItem), JSON.stringify(thisItem)),
        this._set(this.keyString(otherItem), JSON.stringify(otherItem)),
      ]).then(() => {
        this.fireWriteUpdate(Object.assign(thisItem, { invalidate: [`relationships.${relName}`] }));
        this.fireWriteUpdate(Object.assign(otherItem, { invalidate: [`relationships.${otherRelName}`] }));
      })
      .then(() => thisItem);
    });
  }

  deleteRelationshipItem(value, relName, child) {
    if (child.id === undefined) {
      throw new Error('incorrect call signature on deleteRelationshipItem');
    }
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
      if (!thisItem.relationships[relName]) {
        thisItem.relationships[relName] = [];
      }
      if (!otherItem.relationships[otherRelName]) {
        otherItem.relationships[otherRelName] = [];
      }
      const thisIdx = thisItem.relationships[relName].findIndex(item => item.id === child.id);
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

  keyString(value) {
    if (value.type === undefined) {
      throw new Error('Bad ARGS to keyString');
    }
    return `${value.type}:${value.id}`;
  }
}
