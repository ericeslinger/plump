import * as mergeOptions from 'merge-options';

import { Storage } from './storage';
import {
  IndefiniteModelData,
  ModelData,
  ModelReference,
  ModelSchema,
  RelationshipItem,
  TerminalStore,
  CacheStore,
  AllocatingStore
} from '../dataTypes';

// declare function parseInt(n: string | number, radix: number): number;

export abstract class ModifiableKeyValueStore extends Storage implements TerminalStore, CacheStore, AllocatingStore {
  protected maxKeys: { [typeName: string]: number } = {};

  abstract _keys(typeName: string): Promise<string[]>;
  abstract _get(ref: ModelReference): Promise<ModelData | null>;
  abstract _upsert(v: ModelData): Promise<ModelData>;
  abstract _updateArray(ref: ModelReference, relName: string, item: RelationshipItem): Promise<ModelReference>;
  abstract _removeFromArray(ref: ModelReference, relName: string, item: RelationshipItem): Promise<ModelReference>;
  abstract _del(ref: ModelReference, fields: string[]): Promise<ModelData>;

  allocateId(typeName: string) {
    this.maxKeys[typeName] = this.maxKeys[typeName] + 1;
    return Promise.resolve(this.maxKeys[typeName]);
  }

  writeAttributes(inputValue: IndefiniteModelData) {
    const value = this.validateInput(inputValue);
    delete value.relationships;
    // trim out relationships for a direct write.
    return Promise.resolve()
    .then(() => {
      if ((value.id === undefined) || (value.id === null)) {
        if (!this.terminal) {
          throw new Error('Cannot create new content in a non-terminal store');
        }
        return this.allocateId(value.typeName)
        .then((n) => {
          return mergeOptions({}, value, { id: n, relationships: {} }) as ModelData; // if new.
        });
      } else {
        return value as ModelData;
      }
    })
    .then((toSave: ModelData) => {
      return this._upsert(toSave)
      .then(() => {
        this.fireWriteUpdate(Object.assign({}, toSave, { invalidate: ['attributes'] }));
        return toSave;
      });
    });
  }

  readAttributes(value: ModelReference): Promise<ModelData> {
    return this._get(value)
    .then(d => {
      if (d && d.attributes && Object.keys(d.attributes).length > 0) {
        return d;
      } else {
        return null;
      }
    });
  }

  cache(value: ModelData) {
    if ((value.id === undefined) || (value.id === null)) {
      return Promise.reject('Cannot cache data without an id - write it to a terminal first');
    } else {
      return this._get(value)
      .then((current) => {
        const newVal = mergeOptions(current || {}, value);
        return this._upsert(newVal);
      });
    }
  }

  cacheAttributes(value: ModelData) {
    if ((value.id === undefined) || (value.id === null)) {
      return Promise.reject('Cannot cache data without an id - write it to a terminal first');
    } else {
      return this._get(value)
      .then((current) => {
        return this._upsert({
          typeName: value.typeName,
          id: value.id,
          attributes: value.attributes,
          relationships: current.relationships || {},
        });
      });
    }
  }

  cacheRelationship(value: ModelData) {
    if ((value.id === undefined) || (value.id === null)) {
      return Promise.reject('Cannot cache data without an id - write it to a terminal first');
    } else {
      return this._get(value)
      .then((current) => {
        return this._upsert({
          typeName: value.typeName,
          id: value.id,
          attributes: current.attributes || {},
          relationships: value.relationships,
        });
      });
    }
  }

  readRelationship(value: ModelReference, relName: string): Promise<ModelData> {
    return this._get(value)
    .then((v) => {
      const retVal = Object.assign({}, v);
      if (!v) {
        if (this.terminal) {
          return { typeName: value.typeName, id: value.id, relationships: { [relName]: [] } };
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

  delete(value: ModelReference) {
    return this._del(value, ['attributes', 'relationships'])
    .then(() => {
      if (this.terminal) {
        this.fireWriteUpdate({ id: value.id, typeName: value.typeName, invalidate: ['attributes', 'relationships'] });
      }
    });
  }

  wipe(value: ModelReference, field: string) {
    return this._del(value, [field]);
  }

  writeRelationshipItem(value: ModelReference, relName: string, child: RelationshipItem) {
    const schema = this.getSchema(value.typeName);
    const relSchema = schema.relationships[relName].type;
    const otherRelType = relSchema.sides[relName].otherType;
    const otherRelName = relSchema.sides[relName].otherName;
    const otherReference = { typeName: otherRelType, id: child.id };

    const newChild: RelationshipItem = { id: child.id };
    const newParent: RelationshipItem = { id: value.id };
    if (relSchema.extras && child.meta) {
      newParent.meta = {};
      newChild.meta = {};
      for (const extra in child.meta) {
        if (extra in relSchema.extras) {
          newChild.meta[extra] = child.meta[extra];
          newParent.meta[extra] = child.meta[extra];
        }
      }
    }
    return Promise.all([
      this._updateArray(value, relName, newChild),
      this._updateArray(otherReference, otherRelName, newParent)
    ])
    .then(() => {
      this.fireWriteUpdate(Object.assign(value, { invalidate: [`relationships.${relName}`] }));
      this.fireWriteUpdate(Object.assign({ typeName: otherRelType, id: child.id }, { invalidate: [`relationships.${otherRelName}`] }));
    })
    .then(() => value);
  }

  deleteRelationshipItem(value: ModelReference, relName: string, child: RelationshipItem) {
    const schema = this.getSchema(value.typeName);
    const relSchema = schema.relationships[relName].type;
    const otherRelType = relSchema.sides[relName].otherType;
    const otherRelName = relSchema.sides[relName].otherName;
    const otherReference = { typeName: otherRelType, id: child.id };

    const newChild: RelationshipItem = { id: child.id };
    const newParent: RelationshipItem = { id: value.id };
    if (relSchema.extras && child.meta) {
      newParent.meta = {};
      newChild.meta = {};
      for (const extra in child.meta) {
        if (extra in relSchema.extras) {
          newChild.meta[extra] = child.meta[extra];
          newParent.meta[extra] = child.meta[extra];
        }
      }
    }
    return Promise.all([
      this._removeFromArray(value, relName, newChild),
      this._removeFromArray(otherReference, otherRelName, newParent)
    ])
    .then(() => {
      this.fireWriteUpdate(Object.assign(value, { invalidate: [`relationships.${relName}`] }));
      this.fireWriteUpdate(Object.assign({ typeName: otherRelType, id: child.id }, { invalidate: [`relationships.${otherRelName}`] }));
    })
    .then(() => value);
  }

  query(t: string): Promise<ModelReference[]> {
    return this._keys(t)
    .then((keys) => {
      return keys.map(k => {
        return {
          typeName: t,
          id: parseInt(k.split(':')[1], 10),
        };
      }).filter(v => !isNaN(v.id));
    });
  }

  addSchema(t: {typeName: string, schema: ModelSchema}) {
    return super.addSchema(t)
    .then(() => {
      this.maxKeys[t.typeName] = 0;
    });
  }

  keyString(value: ModelReference) {
    return `${value.typeName}:${value.id}`;
  }
}
