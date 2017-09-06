import { ModelData, ModelSchema, RelationshipDelta, RelationshipItem, StringIndexed } from './dataTypes';
import { Plump } from './plump';
import { PlumpObservable } from './plumpObservable';
import { PlumpError } from './errors';
export declare class Model<MD extends ModelData> {
    private plump;
    id: string | number;
    static type: string;
    static schema: ModelSchema;
    error: PlumpError;
    private _write$;
    private dirty;
    readonly type: any;
    readonly schema: any;
    static empty(): {
        type: string;
        attributes: {};
        relationships: {};
    };
    empty(): MD;
    dirtyFields(): string[];
    constructor(opts: any, plump: Plump);
    $$copyValuesFrom(opts?: {}): void;
    $$resetDirty(): void;
    $$fireUpdate(): void;
    get<T extends ModelData>(opts?: string | string[]): Promise<T>;
    bulkGet<T extends ModelData>(): Promise<T>;
    save<T extends ModelData>(): Promise<T>;
    set(update: any): this;
    asObservable(opts?: string | string[]): PlumpObservable<MD>;
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
    static resolveRelationships(deltas: StringIndexed<RelationshipDelta[]>, base?: StringIndexed<RelationshipItem[]>): any;
    static resolveRelationship(deltas: RelationshipDelta[], base?: RelationshipItem[]): RelationshipItem[];
}
