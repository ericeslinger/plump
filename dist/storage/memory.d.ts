import { ModifiableKeyValueStore } from './modifiableKeyValueStore';
import { ModelData, RelationshipItem, ModelReference } from '../dataTypes';
export declare class MemoryStore extends ModifiableKeyValueStore {
    store: {
        [index: string]: ModelData;
    };
    constructor(opts?: {});
    logStore(): void;
    _keys(typeName: any): Promise<string[]>;
    _get(item: ModelReference): Promise<any>;
    _upsert(vals: ModelData): Promise<ModelData>;
    _updateArray(ref: ModelReference, relName: string, item: RelationshipItem): Promise<ModelReference>;
    _removeFromArray(ref: ModelReference, relName: string, item: RelationshipItem): Promise<ModelReference>;
    _del(ref: ModelReference, fields: string[]): Promise<ModelData>;
}
