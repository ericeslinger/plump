import { Observable, Subject } from 'rxjs';
import { ModelData, ModelSchema, DirtyValues, UntypedRelationshipItem, TypedRelationshipItem, RelationshipDelta, StringIndexed } from './dataTypes';
import { Plump } from './plump';
import { PlumpError } from './errors';
export declare class Model<MD extends ModelData> {
    plump: Plump;
    id: string | number;
    static type: string;
    static schema: ModelSchema;
    error: PlumpError;
    _write$: Subject<MD>;
    dirty: DirtyValues;
    readonly type: any;
    readonly schema: any;
    static empty(id: number | string): {
        id: string | number;
        type: string;
        attributes: {};
        relationships: {};
    };
    empty(id: number | string): MD;
    dirtyFields(): string[];
    constructor(opts: any, plump: Plump);
    $$copyValuesFrom(opts?: {}): void;
    $$resetDirty(): void;
    $$fireUpdate(force?: boolean): void;
    get<T extends ModelData>(opts?: string | string[]): Promise<T>;
    bulkGet<T extends ModelData>(): Promise<T>;
    save<T extends ModelData>(): Promise<T>;
    set(update: any): this;
    asObservable(opts?: string | string[]): Observable<MD>;
    delete(): Promise<void>;
    add(key: string, item: UntypedRelationshipItem): this;
    modifyRelationship(key: string, item: UntypedRelationshipItem): this;
    remove(key: string, item: UntypedRelationshipItem): this;
    static applyDelta(current: any, delta: any): any;
    static resolveAndOverlay(update: any, base?: {
        attributes?: any;
        relationships?: any;
    }): {
        attributes: any;
        relationships: any;
    };
    static resolveRelationships(deltas: StringIndexed<RelationshipDelta[]>, base?: StringIndexed<TypedRelationshipItem[]>): any;
    static resolveRelationship(deltas: RelationshipDelta[], base?: TypedRelationshipItem[]): TypedRelationshipItem[];
}
