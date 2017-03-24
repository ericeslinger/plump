import { Interfaces } from './dataTypes';
import { Plump } from './plump';
import { Model } from './model';
export declare abstract class Relationship {
    static sides: Interfaces.StringIndexed<{
        otherType: string;
        otherName: string;
    }>;
    static extras?: Interfaces.StringIndexed<any>;
    static storeData?: {
        sql?: {
            tableName: string;
            joinFields: Interfaces.StringIndexed<string>;
        };
    } & Interfaces.StringIndexed<any>;
    plump: Plump;
    for: typeof Model;
    title: string;
    constructor(plump: Plump, model: typeof Model, title: string);
}
