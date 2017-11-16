import { ModifiableKeyValueStore } from './modifiableKeyValueStore';
import { ModelData, RelationshipItem, ModelReference, StorageReadRequest } from '../dataTypes';
export declare class MemoryStore extends ModifiableKeyValueStore {
    store: {
        [index: string]: ModelData;
    };
    constructor(opts?: {});
    logStore(): void;
    _keys(type: any): Promise<string[]>;
    _get(req: StorageReadRequest): Promise<any>;
    _upsert(vals: ModelData): Promise<ModelData>;
    _updateArray(ref: ModelReference, relName: string, item: RelationshipItem): Promise<ModelReference>;
    _removeFromArray(ref: ModelReference, relName: string, item: RelationshipItem): Promise<ModelReference>;
    _del(ref: ModelReference, fields: string[]): Promise<ModelData>;
}
