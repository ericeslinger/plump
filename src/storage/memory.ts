import { ModifiableKeyValueStore } from './modifiableKeyValueStore';
import { ModelData, RelationshipItem, ModelReference } from '../dataTypes';
import * as mergeOptions from 'merge-options';

export class MemoryStore extends ModifiableKeyValueStore {

  store: {[index: string]: ModelData} = {};

  constructor(opts = {}) {
    super(opts);
  }

  logStore() {
    console.log(JSON.stringify(this.store, null, 2));
  }

  _keys(type) {
    return Promise.resolve(Object.keys(this.store).filter((k) => k.indexOf(`${type}:`) === 0));
  }

  _get(item: ModelReference) {
    const k = this.keyString(item);
    if (this.store[k]) {
      return Promise.resolve(this.store[k]);
    } else {
      return Promise.resolve(null);
    }
  }

  _upsert(vals: ModelData) {
    return Promise.resolve()
    .then(() => {
      const k = this.keyString(vals);
      if (this.store[k] === undefined) {
        this.store[k] = mergeOptions({ relationships: {} }, vals);
      } else {
        this.store[k] = mergeOptions(this.store[k], vals);
      }
      return vals;
    });
  }

  _updateArray(ref: ModelReference, relName: string, item: RelationshipItem) {
    return Promise.resolve()
    .then(() => {
      const k = this.keyString(ref);
      if (this.store[k] === undefined) {
        this.store[k] = {
          id: ref.id,
          type: ref.type,
          attributes: {},
          relationships: {
            relName: [item]
          }
        };
      } else if ((this.store[k].relationships === undefined) || (this.store[k].relationships[relName] === undefined)) {
        if (this.store[k].relationships === undefined) {
          this.store[k].relationships = {};
        }
        this.store[k].relationships[relName] = [item];
      } else {
        const idx = this.store[k].relationships[relName].findIndex(v => v.id === item.id);
        if (idx >= 0) {
          this.store[k].relationships[relName][idx] = item;
        } else {
          this.store[k].relationships[relName].push(item);
        }
      }
      return ref;
    });
  }

  _removeFromArray(ref: ModelReference, relName: string, item: RelationshipItem) {
    return Promise.resolve()
    .then(() => {
      const k = this.keyString(ref);
      if (
        (this.store[k] !== undefined) &&
        (this.store[k].relationships !== undefined) &&
        (this.store[k].relationships[relName] !== undefined)
      ) {
        const idx = this.store[k].relationships[relName].findIndex(v => v.id === item.id);
        if (idx >= 0) {
          this.store[k].relationships[relName].splice(idx, 1);
        }
      }
      return ref;
    });
  }

  _del(ref: ModelReference, fields: string[]) {
    return Promise.resolve()
    .then(() => {
      const k = this.keyString(ref);
      if (this.store[k]) {
        fields.forEach((field) => {
          if (field === 'attributes') {
            delete this.store[k].attributes;
          } else if (field === 'relationships') {
            delete this.store[k].relationships;
          } else if ((field.indexOf('relationships.') === 0) && (this.store[k].relationships)) {
            delete this.store[k].relationships[field.split('.')[1]];
          }
        });
      }
      return this.store[k];
    });
  }
}
