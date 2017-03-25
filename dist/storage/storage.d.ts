/// <reference types="bluebird" />
import * as Bluebird from 'bluebird';
import { Observable } from 'rxjs/Rx';
import * as Interfaces from '../dataTypes';
export declare abstract class Storage {
    terminal: boolean;
    read$: Observable<Interfaces.ModelData>;
    write$: Observable<Interfaces.ModelDelta>;
    protected types: Interfaces.StringIndexed<Interfaces.ModelSchema>;
    private readSubject;
    private writeSubject;
    constructor(opts?: any);
    abstract writeAttributes(value: Interfaces.IndefiniteModelData): Bluebird<Interfaces.ModelData>;
    abstract readAttributes(value: Interfaces.ModelReference): Bluebird<Interfaces.ModelData>;
    abstract cache(value: Interfaces.ModelData): Bluebird<Interfaces.ModelData>;
    abstract cacheAttributes(value: Interfaces.ModelData): Bluebird<Interfaces.ModelData>;
    abstract cacheRelationship(value: Interfaces.ModelData): Bluebird<Interfaces.ModelData>;
    abstract readRelationship(value: Interfaces.ModelReference, key?: string | string[]): Bluebird<Interfaces.ModelData>;
    abstract wipe(value: Interfaces.ModelReference, key?: string | string[]): void;
    abstract delete(value: Interfaces.ModelReference): Bluebird<void>;
    abstract writeRelationshipItem(value: Interfaces.ModelReference, relationshipTitle: string, child: {
        id: string | number;
    }): Bluebird<Interfaces.ModelData>;
    abstract deleteRelationshipItem(value: Interfaces.ModelReference, relationshipTitle: string, child: {
        id: string | number;
    }): Bluebird<Interfaces.ModelData>;
    query(q: any): Bluebird<any>;
    readRelationships(item: Interfaces.ModelReference, relationships: string[]): Bluebird<Interfaces.ModelData>;
    read(item: Interfaces.ModelReference, opts?: string | string[]): Bluebird<any>;
    bulkRead(item: Interfaces.ModelReference): Bluebird<{
        data: any;
        included: any[];
    }>;
    hot(item: Interfaces.ModelReference): boolean;
    wire(store: any, shutdownSignal: any): void;
    validateInput(value: Interfaces.IndefiniteModelData, opts?: {}): Interfaces.ModelData;
    getSchema(t: {
        schema: Interfaces.ModelSchema;
    } | Interfaces.ModelSchema | string): Interfaces.ModelSchema;
    addSchema(t: {
        typeName: string;
        schema: Interfaces.ModelSchema;
    }): void;
    addTypes(a: any): void;
    fireWriteUpdate(val: Interfaces.ModelDelta): Bluebird<Interfaces.ModelDelta>;
    fireReadUpdate(val: Interfaces.ModelData): Bluebird<Interfaces.ModelData>;
}
