import { StorageService } from './storageService';
import { Dictionary, Storable } from './storable';
import { InstanceOptions } from 'axios';
export declare class RestStorage implements StorageService {
    private _axios;
    constructor(opts?: InstanceOptions);
    create(t: string, v: Dictionary): any;
    read(t: string, id: number): any;
    update(t: string, id: number, v: Storable): any;
    delete(t: string, id: number): any;
    query(q: {
        type: string;
        query: any;
    }): any;
    name: 'RestStorage';
}
