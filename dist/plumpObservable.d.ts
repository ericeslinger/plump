import { Observable } from 'rxjs';
import { ModelData } from './dataTypes';
import { Plump } from './plump';
export declare class PlumpObservable<T extends ModelData> extends Observable<T> {
    plump: Plump;
    constructor(plump: Plump, observable: any);
    lift(operator: any): PlumpObservable<ModelData>;
    inflateRelationship(relName: string): any;
}
