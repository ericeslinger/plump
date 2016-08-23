/// <reference types="bluebird" />
import { StorageService } from './storageService';
import { Dictionary, Storable } from './storable';
import * as Promise from 'bluebird';
export declare class SQLStorage implements StorageService {
    private _knex;
    constructor(dbOpts?: any);
    create(t: string, v: Dictionary): Promise<any>;
    read(t: string, id: number): Promise<any>;
    update(t: string, id: number, v: Storable): Promise<any>;
    delete(t: string, id: number): Promise<any>;
    query(q: {
        type: string;
        query: any;
    }): Promise<any>;
    name: 'SQLStorage';
}
