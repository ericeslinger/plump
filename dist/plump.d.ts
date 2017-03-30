import { Observable } from 'rxjs/Rx';
import { Model } from './model';
import { ModelData, ModelReference, DirtyModel, RelationshipItem, PackagedModelData, CacheStore, TerminalStore } from './dataTypes';
export declare class Plump {
    destroy$: Observable<string>;
    caches: CacheStore[];
    terminal: TerminalStore;
    private teardownSubject;
    private types;
    constructor();
    addType(T: typeof Model): Promise<void>;
    type(T: string): typeof Model;
    setTerminal(store: TerminalStore): Promise<void>;
    addCache(store: CacheStore): Promise<void>;
    find(t: any, id: any): Model;
    forge(t: any, val: any): Model;
    teardown(): void;
    get(value: ModelReference, opts?: string[]): Promise<ModelData>;
    bulkGet(value: ModelReference): Promise<PackagedModelData>;
    save(value: DirtyModel): Promise<ModelData>;
    delete(item: ModelReference): Promise<void[]>;
    add(item: ModelReference, relName: string, child: RelationshipItem): Promise<never>;
    modifyRelationship(item: ModelReference, relName: string, child: RelationshipItem): Promise<never>;
    query(q: any): Promise<ModelReference[]>;
    deleteRelationshipItem(item: ModelReference, relName: string, child: RelationshipItem): Promise<never>;
    invalidate(item: ModelReference, field?: string | string[]): void;
    static wire(me: CacheStore, they: TerminalStore, shutdownSignal: Observable<string>): void;
}
