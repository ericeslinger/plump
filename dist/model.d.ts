import { Observable, Subscription, Observer } from 'rxjs/Rx';
import { ModelData, ModelSchema, RelationshipDelta, RelationshipItem, PackagedModelData } from './dataTypes';
import { Plump } from './plump';
export declare class Model {
    private plump;
    id: string | number;
    static typeName: string;
    static schema: ModelSchema;
    private dirty;
    readonly typeName: any;
    readonly schema: any;
    dirtyFields(): string[];
    constructor(opts: any, plump: Plump);
    $$copyValuesFrom(opts?: {}): void;
    $$resetDirty(): void;
    get(opts?: string | string[]): Promise<ModelData>;
    bulkGet(): Promise<PackagedModelData>;
    save(): Promise<ModelData>;
    set(update: any): this;
    asObservable(opts?: string | string[]): Observable<ModelData>;
    subscribe(cb: Observer<ModelData>): Subscription;
    subscribe(fields: string | string[], cb: Observer<ModelData>): Subscription;
    delete(): Promise<void[]>;
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
