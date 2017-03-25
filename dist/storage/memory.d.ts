/// <reference types="bluebird" />
import * as Bluebird from 'bluebird';
import { KeyValueStore } from './keyValueStore';
export declare class MemoryStore extends KeyValueStore {
    private store;
    constructor(opts?: {});
    logStore(): void;
    _keys(typeName: any): Bluebird<string[]>;
    _get(k: any): Bluebird<any>;
    _set(k: any, v: any): Bluebird<any>;
    _del(k: any): Bluebird<any>;
}
