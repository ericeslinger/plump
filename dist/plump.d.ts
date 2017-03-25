/// <reference types="bluebird" />
import { Observable } from 'rxjs/Rx';
import * as Bluebird from 'bluebird';
import * as Interfaces from './dataTypes';
import { Storage } from './storage/storage';
import { Model } from './model';
export declare class Plump {
    destroy$: Observable<string>;
    private teardownSubject;
    private storage;
    private types;
    private terminal;
    constructor(opts?: {});
    addType(T: Interfaces.ModelConstructor): void;
    type(T: any): Interfaces.ModelConstructor;
    addStore(store: Storage): void;
    find(t: any, id: any): Model;
    forge(t: any, val: any): any;
    teardown(): void;
    get(value: Interfaces.ModelReference, opts?: string[]): Promise<any>;
    save(value: Interfaces.DirtyModel): Promise<never> | Bluebird<Interfaces.ModelData>;
    delete(item: Interfaces.ModelReference): Promise<never> | Bluebird<void[]>;
    add(item: Interfaces.ModelReference, relName: string, child: Interfaces.RelationshipItem): Promise<never> | Bluebird<Interfaces.ModelData>;
    modifyRelationship(item: Interfaces.ModelReference, relName: string, child: Interfaces.RelationshipItem): Promise<never> | Bluebird<Interfaces.ModelData>;
    deleteRelationshipItem(item: Interfaces.ModelReference, relName: string, child: Interfaces.RelationshipItem): Promise<never> | Bluebird<Interfaces.ModelData>;
    invalidate(item: Interfaces.ModelReference, field?: string | string[]): void;
}
