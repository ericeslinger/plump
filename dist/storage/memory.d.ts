/// <reference types="bluebird" />
import * as Promise from 'bluebird';
import { KeyValueStore } from './keyValueStore';
export declare class MemoryStore extends KeyValueStore {
    private store;
    constructor(opts?: {});
    logStore(): void;
    _keys(typeName: any): Promise<string[]>;
    _get(k: any): Promise<any>;
    _set(k: any, v: any): Promise<void>;
    _del(k: any): Promise<any>;
}
