import { ModelData, ModelReference } from './dataTypes';
import { Plump } from './plump';
import { Observable } from 'rxjs';
export declare function observeAttribute<T>(o: Observable<ModelData>, attr: string): Observable<T>;
export declare function observeChild(o: Observable<ModelData>, rel: string, plump: Plump): Observable<ModelData[]>;
export declare function observeList(list: Observable<ModelReference[]>, plump: Plump): Observable<(ModelData)[]>;
