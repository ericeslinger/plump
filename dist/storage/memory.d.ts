/// <reference types="bluebird" />
import { StorageService } from './storageService';
import * as Promise from 'bluebird';
import { Storable } from './storable';
export declare class MemoryStorage implements StorageService {
    private _storage;
    create(t: string, v: Storable): Promise<any>;
    read(t: string, id: number): Promise<any>;
    update(t: string, id: number, v: Storable): Promise<any>;
    delete(t: string, id: number): Promise<any>;
    query(q: {
        type: string;
        query: any;
    }): Promise<any>;
    name: 'MemoryStorage';
}
