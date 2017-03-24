/// <reference types="bluebird" />
import { Model } from './model';
import { Observable } from 'rxjs/Rx';
import * as Bluebird from 'bluebird';
export declare class Plump {
    destroy$: Observable<string>;
    private teardownSubject;
    private storage;
    private types;
    private terminal;
    constructor(opts?: {
        storage?: Storage[];
        types?: (typeof Model)[];
    });
    addType(T: any): void;
    type(T: any): typeof Model;
    addStore(store: any): void;
    find(t: any, id: any): any;
    forge(t: any, val: any): any;
    teardown(): void;
    get(value: any, opts?: string[]): Promise<any>;
    bulkGet(type: any, id: any): any;
    save(value: any): Promise<never> | Bluebird<any>;
    delete(...args: any[]): any;
    add(...args: any[]): any;
    restRequest(opts: any): any;
    modifyRelationship(...args: any[]): any;
    remove(...args: any[]): any;
    invalidate(type: any, id: any, field: any): void;
}
