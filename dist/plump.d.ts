import { Observable } from 'rxjs';
import { Model } from './model';
import { ModelAttributes, ModelData, ModelReference, DirtyModel, RelationshipItem, CacheStore, TerminalStore } from './dataTypes';
export declare class Plump<TermType extends TerminalStore = TerminalStore> {
    terminal: TermType;
    destroy$: Observable<string>;
    caches: CacheStore[];
    private teardownSubject;
    private types;
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
    save(value: DirtyModel): Promise<ModelData>;
    delete(item: ModelReference): Promise<void>;
    add(item: ModelReference, relName: string, child: RelationshipItem): Promise<ModelData>;
    modifyRelationship(item: ModelReference, relName: string, child: RelationshipItem): Promise<ModelData>;
    query(q: any): Promise<ModelReference[]>;
    deleteRelationshipItem(item: ModelReference, relName: string, child: RelationshipItem): Promise<ModelData>;
    invalidate(item: ModelReference, field?: string | string[]): void;
    static wire(me: CacheStore, they: TerminalStore, shutdownSignal: Observable<string>): void;
}
