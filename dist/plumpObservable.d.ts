import { Observable } from 'rxjs';
import { ModelData } from './dataTypes';
import { Plump } from './plump';
export declare class PlumpObservable<T extends ModelData> extends Observable<T> {
    plump: Plump;
    constructor(plump: Plump, observable: any);
    lift<T extends ModelData>(operator: any): any;
    inflateRelationship(relName: string): any;
}
