import { Observable } from 'rxjs/Rx';
import { IndefiniteModelData, ModelData, ModelDelta, ModelSchema, ModelReference, BaseStore, StorageOptions } from '../dataTypes';
export declare abstract class Storage implements BaseStore {
    terminal: boolean;
    read$: Observable<ModelData>;
    write$: Observable<ModelDelta>;
    protected types: {
        [type: string]: ModelSchema;
    };
    private readSubject;
    private writeSubject;
    constructor(opts?: StorageOptions);
    abstract readAttributes(value: ModelReference): Promise<ModelData>;
    abstract readRelationship(value: ModelReference, relName: string): Promise<ModelData>;
    readRelationships(item: ModelReference, relationships: string[]): Promise<ModelData>;
    read(item: ModelReference, opts?: string | string[]): Promise<any>;
    bulkRead(item: ModelReference): Promise<ModelData>;
    hot(item: ModelReference): boolean;
    validateInput(value: ModelData | IndefiniteModelData): typeof value;
    getSchema(t: {
        schema: ModelSchema;
    } | ModelSchema | string): ModelSchema;
    addSchema(t: {
        type: string;
        schema: ModelSchema;
    }): Promise<void>;
    addSchemas(a: {
        type: string;
        schema: ModelSchema;
    }[]): Promise<void>;
    fireWriteUpdate(val: ModelDelta): Promise<ModelDelta>;
    fireReadUpdate(val: ModelData): Promise<ModelData>;
}
