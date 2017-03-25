/// <reference types="bluebird" />
import { Observable } from 'rxjs/Rx';
import * as Bluebird from 'bluebird';
import { Storage } from './storage/storage';
import { Model } from './model';
import { ModelData, ModelReference, DirtyModel, RelationshipItem } from './dataTypes';
export declare class Plump {
    destroy$: Observable<string>;
    private teardownSubject;
    private storage;
    private types;
    private terminal;
<<<<<<< HEAD
    constructor(opts?: {
        storage?: Storage[];
        types?: (typeof Model)[];
    });
    addType(T: typeof Model): void;
    type(T: string): typeof Model;
    addStore(store: Storage): void;
=======
    constructor();
    addType(T: typeof Model): Bluebird<void>;
    type(T: string): typeof Model;
    addStore(store: Storage): Bluebird<void>;
>>>>>>> master
    find(t: any, id: any): Model;
    forge(t: any, val: any): Model;
    teardown(): void;
    get(value: ModelReference, opts?: string[]): Bluebird<ModelData>;
    save(value: DirtyModel): Bluebird<ModelData>;
    delete(item: ModelReference): Bluebird<void[]>;
    add(item: ModelReference, relName: string, child: RelationshipItem): Bluebird<any>;
    modifyRelationship(item: ModelReference, relName: string, child: RelationshipItem): Bluebird<any>;
    deleteRelationshipItem(item: ModelReference, relName: string, child: RelationshipItem): Bluebird<any>;
    invalidate(item: ModelReference, field?: string | string[]): void;
}
