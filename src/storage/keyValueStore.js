import * as Bluebird from 'bluebird';
import mergeOptions from 'merge-options';

import { Storage } from './storage';
import { createFilter } from './createFilter';
import { $self } from '../model';

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

function applyDelta(base, delta) {
  if (delta.op === 'add' || delta.op === 'modify') {
    const retVal = mergeOptions({}, base, delta.data);
    return retVal;
  } else if (delta.op === 'remove') {
    return undefined;
  } else {
    return base;
  }
}

function resolveRelationship(deltas, base = []) {
  // Index current relationships by ID for efficient modification
  const updates = base.map(rel => {
    return { [rel.id]: rel };
  }).reduce((acc, curr) => mergeOptions(acc, curr), {});

  // Apply any deltas in dirty cache on top of updates
  deltas.forEach(delta => {
    const childId = delta.data.id;
    updates[childId] = applyDelta(updates[childId], delta);
  });

  // Collapse updates back into list, omitting undefineds
  return Object.keys(updates)
    .map(id => updates[id])
    .filter(rel => rel !== undefined)
    .reduce((acc, curr) => acc.concat(curr), []);
}

// TODO
function resolveRelationships(schema, deltas, base = {}) {
  const updates = {};
  for (const relName in deltas) {
    if (relName in schema.relationships) {
      updates[relName] = resolveRelationship(deltas[relName], base[relName]);
    }
  }
  return mergeOptions({}, base, updates);
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

  createNew(t, v) {
    const toSave = mergeOptions({}, v);
    if (this.terminal) {
      return this.$$maxKey(t.$name)
      .then((n) => {
        const id = n + 1;
        toSave[t.$schema.$id] = id;
        return Bluebird.all([
          this.writeAttributes(t, id, toSave.attributes),
          this.writeRelationships(t, id, toSave.relationships),
        ]).then(() => {
          return this.notifyUpdate(t, toSave[t.$id], {
            attributes: toSave.attributes,
            relationships: resolveRelationships(t.$schema, toSave.relationships),
          });
        })
        .then(() => toSave);
      });
    } else {
      throw new Error('Cannot create new content in a non-terminal store');
    }
  }

  getRelationships(t, id, opts) {
    const keys = opts && !Array.isArray(opts) ? [opts] : opts;
    return Bluebird.all(
      keys.map(relName => {
        return this._get(this.keyString(t.$name, id, relName))
        .then(rel => {
          return { relName: rel };
        });
      })
    ).then(relList => relList.reduce((acc, curr) => mergeOptions(acc, curr), {}));
  }

  write(t, v) {
    const id = v.id || v[t.$schema.$id];
    if ((id === undefined) || (id === null)) {
      return this.createNew(t, v);
    } else {
      return Bluebird.all([
        this._get(this.keyString(t.$name, id)),
        this.getRelationships(t, id, Object.keys(v.relationships)),
      ]).then(([origAttributes, origRelationships]) => {
        const updatedAttributes = Object.assign({}, JSON.parse(origAttributes), v.attributes);
        const updatedRelationships = resolveRelationships(t.$schema, v.relationships, origRelationships);
        return Bluebird.all([
          this.writeAttributes(t, id, updatedAttributes),
          this.writeRelationships(t, id, updatedRelationships),
        ])
        .then(() => {
          return this.notifyUpdate(t, id, {
            attributes: updatedAttributes,
            relationships: updatedRelationships,
          });
        })
        .then(() => {
          return { attributes: updatedAttributes, relationships: updatedRelationships };
        });
      });
    }
  }

  writeAttributes(t, id, attributes) {
    return this._set(this.keyString(t.$name, id), JSON.stringify(attributes));
  }

  writeRelationships(t, id, relationships) {
    return Object.keys(relationships).map(relName => {
      return this.writeHasMany(t, id, relName, relationships[relName]);
    }).reduce((thenable, curr) => thenable.then(() => curr), Bluebird.resolve());
  }

  readAttributes(t, id) {
    return this._get(this.keyString(t.$name, id))
    .then((d) => JSON.parse(d));
  }

  readRelationship(t, id, relationship) {
    const relationshipType = t.$schema.relationships[relationship].type;
    const sideInfo = relationshipType.$sides[relationship];
    return Bluebird.resolve()
    .then(() => {
      const resolves = [this._get(this.keyString(t.$name, id, relationship))];
      if (sideInfo.self.query && sideInfo.self.query.requireLoad) {
        resolves.push(this.readOne(t, id));
      } else {
        resolves.push(Bluebird.resolve({ id }));
      }
      // TODO: if there's a query, KVS loads a *lot* into memory and filters
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

  wipe(t, id, field) {
    if (field === $self) {
      return this._del(this.keyString(t.$name, id));
    } else {
      return this._del(this.keyString(t.$name, id, field));
    }
  }

  writeHasMany(type, id, field, value) {
    let toSave = value;
    const relationshipBlock = type.$schema.relationships[field].type;
    if (relationshipBlock.$restrict) {
      const restrictBlock = {};
      Object.keys(relationshipBlock.$restrict).forEach((k) => {
        restrictBlock[k] = relationshipBlock.$restrict[k].value;
      });
      toSave = toSave.map((v) => Object.assign({}, v, restrictBlock));
    }
    // const sideInfo = relationshipBlock.$sides[field];
    const thisKeyString = this.keyString(type.$name, id, field);
    return this._set(thisKeyString, JSON.stringify(toSave));
  }

  add(type, id, relationshipTitle, childId, extras = {}) {
    const relationshipBlock = type.$schema.relationships[relationshipTitle].type;
    const sideInfo = relationshipBlock.$sides[relationshipTitle];
    const thisKeyString = this.keyString(type.$name, id, relationshipTitle);
    const otherKeyString = this.keyString(sideInfo.other.type, childId, sideInfo.other.title);
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
    const relationshipBlock = type.$schema.relationships[relationshipTitle].type;
    const sideInfo = relationshipBlock.$sides[relationshipTitle];
    const thisKeyString = this.keyString(type.$name, id, relationshipTitle);
    const otherKeyString = this.keyString(sideInfo.other.type, childId, sideInfo.other.title);
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
    const relationshipBlock = type.$schema.relationships[relationshipTitle].type;
    const sideInfo = relationshipBlock.$sides[relationshipTitle];
    const thisKeyString = this.keyString(type.$name, id, relationshipTitle);
    const otherKeyString = this.keyString(sideInfo.other.type, childId, sideInfo.other.title);
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
    return `${typeName}:${relationship ? `rel.${relationship}` : 'attributes'}:${id}`;
  }
}
