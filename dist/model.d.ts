import { Observable, Subject } from 'rxjs';
import { ModelData, ModelSchema, DirtyValues, UntypedRelationshipItem, TypedRelationshipItem, RelationshipDelta, ReadRequest, StorageReadRequest, StringIndexed, Attributed } from './dataTypes';
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
    _dirty$: Subject<boolean>;
    dirty$: Observable<boolean>;
    readonly type: any;
    readonly schema: any;
    static empty(id: number | string, error?: string): {
        id: string | number;
        type: string;
        empty: boolean;
        error: string;
        attributes: {};
        relationships: {};
    };
    empty(id: number | string, error?: string): MD;
    dirtyFields(): string[];
    constructor(opts: Attributed, plump: Plump);
    $$copyValuesFrom(opts?: Attributed): void;
    $$resetDirty(): void;
    $$fireUpdate(force?: boolean): void;
    get<T extends ModelData>(req: ReadRequest): Promise<T>;
    create(): Promise<MD>;
    save(opts?: any): Promise<MD>;
    set(update: any): this;
    parseOpts(opts: ReadRequest | string | string[]): StorageReadRequest;
    asObservable(opts?: ReadRequest | string | string[]): Observable<MD>;
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
