import { Storage } from './storage';
import { IndefiniteModelData, ModelData, ModelReference, ModelSchema, RelationshipItem, TerminalStore, CacheStore, AllocatingStore } from '../dataTypes';
export declare abstract class ModifiableKeyValueStore extends Storage implements TerminalStore, CacheStore, AllocatingStore {
    protected maxKeys: {
        [typeName: string]: number;
    };
    abstract _keys(typeName: string): Promise<string[]>;
    abstract _get(ref: ModelReference): Promise<ModelData | null>;
    abstract _upsert(v: ModelData): Promise<ModelData>;
    abstract _updateArray(ref: ModelReference, relName: string, item: RelationshipItem): Promise<ModelReference>;
    abstract _removeFromArray(ref: ModelReference, relName: string, item: RelationshipItem): Promise<ModelReference>;
    abstract _del(ref: ModelReference, fields: string[]): Promise<ModelData>;
    allocateId(typeName: string): Promise<number>;
    writeAttributes(inputValue: IndefiniteModelData): Promise<ModelData>;
    readAttributes(value: ModelReference): Promise<ModelData>;
    cache(value: ModelData): Promise<never>;
    cacheAttributes(value: ModelData): Promise<never>;
    cacheRelationship(value: ModelData): Promise<never>;
    readRelationship(value: ModelReference, relName: string): Promise<ModelData>;
    delete(value: ModelReference): Promise<void>;
    wipe(value: ModelReference, field: string): Promise<ModelData>;
    writeRelationshipItem(value: ModelReference, relName: string, child: RelationshipItem): Promise<ModelReference>;
    deleteRelationshipItem(value: ModelReference, relName: string, child: RelationshipItem): Promise<ModelReference>;
    query(t: string): Promise<ModelReference[]>;
    addSchema(t: {
        typeName: string;
        schema: ModelSchema;
    }): Promise<void>;
    keyString(value: ModelReference): string;
}
