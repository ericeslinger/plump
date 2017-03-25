import { Subscription, Observer } from 'rxjs/Rx';
import { ModelData, ModelSchema, RelationshipDelta, RelationshipItem } from './dataTypes';
export declare abstract class Model {
    private plump;
    id: string | number;
    static typeName: string;
    static schema: ModelSchema;
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
    subscribe(cb: Observer<ModelData>): Subscription;
    subscribe(fields: string | string[], cb: Observer<ModelData>): Subscription;
    delete(): any;
    $rest(opts: any): any;
    add(key: string, item: RelationshipItem): this;
    modifyRelationship(key: string, item: RelationshipItem): this;
    remove(key: string, item: RelationshipItem): this;
    static applyDefaults(v: any): ModelData;
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
    static resolveRelationship(deltas: RelationshipDelta[], base?: RelationshipItem[]): RelationshipItem[];
}
