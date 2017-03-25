import { Subscription, Observer } from 'rxjs/Rx';
import * as Interfaces from './dataTypes';
export declare abstract class Model {
    private plump;
    id: string | number;
    static typeName: string;
    static schema: Interfaces.ModelSchema;
    private static storeCache;
    private dirty;
    readonly typeName: any;
    readonly schema: any;
    dirtyFields(): string[];
    constructor(opts: any, plump: any);
    $$copyValuesFrom(opts?: {}): void;
    $$resetDirty(): void;
    get(opts?: string | string[]): any;
    bulkGet(): any;
    save(): any;
    set(update: any): this;
    subscribe(cb: Observer<Interfaces.ModelData>): Subscription;
    subscribe(fields: string | string[], cb: Observer<Interfaces.ModelData>): Subscription;
    delete(): any;
    $rest(opts: any): any;
    add(key: string, item: Interfaces.RelationshipItem): this;
    modifyRelationship(key: string, item: Interfaces.RelationshipItem): this;
    remove(key: string, item: Interfaces.RelationshipItem): this;
    static applyDefaults(v: any): Interfaces.ModelData;
    static applyDelta(current: any, delta: any): any;
    static cacheGet(store: any, key: any): any;
    static cacheSet(store: any, key: any, value: any): void;
    static resolveAndOverlay(update: any, base?: {
        attributes: {};
        relationships: {};
    }): {
        attributes: any;
        relationships: any;
    };
    static resolveRelationships(deltas: any, base?: {}): any;
    static resolveRelationship(deltas: Interfaces.RelationshipDelta[], base?: Interfaces.RelationshipItem[]): Interfaces.RelationshipItem[];
}
