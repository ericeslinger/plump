import { Storage } from './storage';
import { IndefiniteModelData, ModelData, ModelReference, ModelSchema, RelationshipItem, TerminalStore, StorageReadRequest, CacheStore, AllocatingStore } from '../dataTypes';
export declare abstract class ModifiableKeyValueStore extends Storage implements TerminalStore, CacheStore, AllocatingStore {
    maxKeys: {
        [type: string]: number;
    };
    abstract _keys(type: string): Promise<string[]>;
    abstract _get(ref: StorageReadRequest): Promise<ModelData | null>;
    abstract _upsert(v: ModelData): Promise<ModelData>;
    abstract _updateArray(ref: ModelReference, relName: string, item: RelationshipItem): Promise<ModelReference>;
    abstract _removeFromArray(ref: ModelReference, relName: string, item: RelationshipItem): Promise<ModelReference>;
    abstract _del(ref: ModelReference, fields: string[]): Promise<ModelData>;
    allocateId(type: string): Promise<number>;
    writeAttributes(inputValue: IndefiniteModelData): Promise<ModelData>;
    readAttributes(value: StorageReadRequest): Promise<ModelData>;
    cache(value: ModelData): Promise<ModelData>;
    cacheAttributes(value: ModelData): Promise<ModelData>;
    cacheRelationship(value: ModelData): Promise<ModelData>;
    readRelationship(value: StorageReadRequest): Promise<ModelData>;
    delete(value: ModelReference): Promise<void>;
    wipe(value: ModelReference, field: string): Promise<ModelData>;
    writeRelationshipItem(value: ModelReference, relName: string, child: RelationshipItem): Promise<ModelReference>;
    deleteRelationshipItem(value: ModelReference, relName: string, child: RelationshipItem): Promise<ModelReference>;
    query(t: string, q?: any): Promise<ModelReference[]>;
    addSchema(t: {
        type: string;
        schema: ModelSchema;
    }): Promise<void>;
    keyString(value: ModelReference): string;
}
