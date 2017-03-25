/// <reference types="bluebird" />
import * as Bluebird from 'bluebird';
import { Observable } from 'rxjs/Rx';
import { IndefiniteModelData, ModelData, ModelDelta, ModelSchema, ModelReference, RelationshipItem } from '../dataTypes';
export declare abstract class Storage {
    terminal: boolean;
    read$: Observable<ModelData>;
    write$: Observable<ModelDelta>;
    protected types: {
        [type: string]: ModelSchema;
    };
    private readSubject;
    private writeSubject;
    constructor(opts?: any);
    abstract allocateId(typeName: string): Bluebird<string | number>;
    abstract writeAttributes(value: IndefiniteModelData): Bluebird<ModelData>;
    abstract readAttributes(value: ModelReference): Bluebird<ModelData>;
    abstract cache(value: ModelData): Bluebird<ModelData>;
    abstract cacheAttributes(value: ModelData): Bluebird<ModelData>;
    abstract cacheRelationship(value: ModelData): Bluebird<ModelData>;
    abstract readRelationship(value: ModelReference, key?: string | string[]): Bluebird<ModelData | RelationshipItem[]>;
    abstract wipe(value: ModelReference, key?: string | string[]): void;
    abstract delete(value: ModelReference): Bluebird<void>;
    abstract writeRelationshipItem(value: ModelReference, relationshipTitle: string, child: {
        id: string | number;
    }): Bluebird<ModelData>;
    abstract deleteRelationshipItem(value: ModelReference, relationshipTitle: string, child: {
        id: string | number;
    }): Bluebird<ModelData>;
    query(q: any): Bluebird<any>;
    readRelationships(item: ModelReference, relationships: string[]): Bluebird<RelationshipItem[] | ModelData>;
    read(item: ModelReference, opts?: string | string[]): Bluebird<any>;
    bulkRead(item: ModelReference): Bluebird<{
        data: any;
        included: any[];
    }>;
    hot(item: ModelReference): boolean;
    wire(store: any, shutdownSignal: any): void;
    validateInput(value: IndefiniteModelData, opts?: {}): ModelData;
    getSchema(t: {
        schema: ModelSchema;
    } | ModelSchema | string): ModelSchema;
    addSchema(t: {
        typeName: string;
        schema: ModelSchema;
    }): Bluebird<void>;
    addSchemas(a: any): Bluebird<void>;
    fireWriteUpdate(val: ModelDelta): Bluebird<ModelDelta>;
    fireReadUpdate(val: ModelData): Bluebird<ModelData>;
}
