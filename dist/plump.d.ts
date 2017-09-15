import { Subject, Observable } from 'rxjs';
import { Model } from './model';
import { ModelAttributes, ModelData, ModelReference, DirtyModel, RelationshipItem, CacheStore, TerminalStore } from './dataTypes';
export declare const types: {
    [type: string]: typeof Model;
};
export interface TypeMap {
    [type: string]: any;
}
export declare function pathExists(obj: any, path: string): boolean;
export declare class Plump<TermType extends TerminalStore = TerminalStore> {
    terminal: TermType;
    destroy$: Observable<string>;
    caches: CacheStore[];
    types: TypeMap;
    teardownSubject: Subject<string>;
    constructor(terminal: TermType);
    addType(T: any): Promise<void>;
    type(T: string): typeof Model;
    getTypes(): typeof Model[];
    addCache(store: CacheStore): Promise<void>;
    find<T extends ModelData>(ref: ModelReference): Model<T>;
    forge<A extends ModelAttributes, T extends Model<ModelData & {
        attributes?: A;
    }>>(t: string, val: Partial<A>): T;
    teardown(): void;
    get(value: ModelReference, opts?: string[]): Promise<ModelData>;
    bulkGet(value: ModelReference): Promise<ModelData>;
    forceCreate(value: DirtyModel): Promise<ModelData>;
    save(value: DirtyModel, options?: {
        stripId: boolean;
    }): Promise<ModelData>;
    delete(item: ModelReference): Promise<void>;
    add(item: ModelReference, relName: string, child: RelationshipItem): Promise<ModelData>;
    modifyRelationship(item: ModelReference, relName: string, child: RelationshipItem): Promise<ModelData>;
    query(type: string, q?: any): Promise<ModelReference[]>;
    deleteRelationshipItem(item: ModelReference, relName: string, child: RelationshipItem): Promise<ModelData>;
    invalidate(item: ModelReference, field?: string | string[]): void;
    static wire(me: CacheStore, they: TerminalStore, shutdownSignal: Observable<string>): void;
}
