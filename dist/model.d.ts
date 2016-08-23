/// <reference types="bluebird" />
import { StorageService } from './storage/storageService';
import * as Promise from 'bluebird';
export declare class Model {
    private _storage;
    tableName: string;
    private _id;
    private static _storageServices;
    static addStorageService(ds: StorageService): void;
    constructor(opts?: any);
    set(opts: any): any;
    set(key: string, val: any): any;
    private getStorageServices();
    resolve(key: string): Promise<any>;
}
