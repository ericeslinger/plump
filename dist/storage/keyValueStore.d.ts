/// <reference types="bluebird" />
import * as Bluebird from 'bluebird';
import { Storage } from './storage';
import { IndefiniteModelData, ModelData, ModelReference, ModelSchema, RelationshipItem } from '../dataTypes';
export declare abstract class KeyValueStore extends Storage {
    protected maxKeys: {
        [typeName: string]: number;
    };
    abstract _keys(typeName: string): Bluebird<string[]>;
    abstract _get(k: string): Bluebird<ModelData | null>;
    abstract _set(k: string, v: ModelData): Bluebird<ModelData>;
    abstract _del(k: string): Bluebird<ModelData>;
    allocateId(typeName: string): Bluebird<number>;
    writeAttributes(inputValue: IndefiniteModelData): Bluebird<any>;
    readAttributes(value: ModelReference): Bluebird<ModelData>;
    cache(value: ModelData): Bluebird<any>;
    cacheAttributes(value: ModelData): Bluebird<any>;
    cacheRelationship(value: ModelData): Bluebird<any>;
    readRelationship(value: ModelReference, relName: string): Bluebird<ModelData>;
    delete(value: ModelReference): Bluebird<void>;
    wipe(value: ModelReference, field: string): Bluebird<ModelData>;
    writeRelationshipItem(value: ModelReference, relName: string, child: RelationshipItem): Bluebird<ModelData>;
    deleteRelationshipItem(value: ModelReference, relName: string, child: RelationshipItem): Bluebird<ModelData>;
    addSchema(t: {
        typeName: string;
        schema: ModelSchema;
    }): Bluebird<void>;
    keyString(value: ModelReference): string;
}
