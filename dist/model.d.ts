import { Subscription } from 'rxjs/Rx';
import { Interfaces } from './dataTypes';
export declare class Model {
    private plump;
    id: string | number;
    static schema: Interfaces.ModelSchema;
    private static storeCache;
    private dirty;
    readonly type: any;
    readonly schema: any;
    dirtyFields(): string[];
    constructor(opts: any, plump: any);
    $$copyValuesFrom(opts?: {}): void;
    $$resetDirty(): void;
    get(opts?: string): any;
    bulkGet(): any;
    save(): any;
    set(update: any): this;
    subscribe(...args: any[]): Subscription;
    delete(): any;
    $rest(opts: any): any;
    add(key: any, item: any): this;
    modifyRelationship(key: any, item: any): this;
    remove(key: any, item: any): this;
    static rest(plump: any, opts: any): any;
    static applyDefaults(v: any): any;
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
