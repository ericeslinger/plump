import { Subject, Observable } from 'rxjs';
import { IndefiniteModelData, ModelData, ModelDelta, ModelSchema, ModelReference, BaseStore, StorageReadRequest, StorageOptions } from '../dataTypes';
export declare abstract class Storage implements BaseStore {
    terminal: boolean;
    inProgress: {
        [key: string]: Promise<ModelData>;
    };
    types: {
        [type: string]: ModelSchema;
    };
    readSubject: Subject<ModelData>;
    writeSubject: Subject<ModelDelta>;
    read$: Observable<ModelData>;
    write$: Observable<ModelDelta>;
    constructor(opts?: StorageOptions);
    abstract readAttributes(value: StorageReadRequest): Promise<ModelData>;
    abstract readRelationship(value: StorageReadRequest): Promise<ModelData>;
    readRelationships(req: StorageReadRequest, relationships: string[]): Promise<any>;
    read(req: StorageReadRequest): Promise<ModelData>;
    _read(req: StorageReadRequest): Promise<ModelData>;
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
