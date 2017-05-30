import { Observable, Subscription, Observer } from 'rxjs/Rx';
import { ModelData, ModelSchema, RelationshipDelta, RelationshipItem } from './dataTypes';
import { Plump } from './plump';
export declare class Model<T extends ModelData> {
    private plump;
    id: string | number;
    static type: string;
    static schema: ModelSchema;
    private dirty;
    readonly type: any;
    readonly schema: any;
    dirtyFields(): string[];
    constructor(opts: any, plump: Plump);
    $$copyValuesFrom(opts?: {}): void;
    $$resetDirty(): void;
    get(opts?: string | string[]): Promise<T>;
    bulkGet(): Promise<T>;
    save(): Promise<T>;
    set(update: any): this;
    asObservable(opts?: string | string[]): Observable<T>;
    subscribe(cb: Observer<T>): Subscription;
    subscribe(fields: string | string[], cb: Observer<T>): Subscription;
    delete(): Promise<void>;
    add(key: string, item: RelationshipItem): this;
    modifyRelationship(key: string, item: RelationshipItem): this;
    remove(key: string, item: RelationshipItem): this;
    static applyDelta(current: any, delta: any): any;
    static resolveAndOverlay(update: any, base?: {
        attributes?: any;
        relationships?: any;
    }): {
        attributes: any;
        relationships: any;
    };
    static resolveRelationships(deltas: any, base?: {}): any;
    static resolveRelationship(deltas: RelationshipDelta[], base?: RelationshipItem[]): RelationshipItem[];
}
