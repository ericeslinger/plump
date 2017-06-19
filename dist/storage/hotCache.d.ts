import { ModelReference } from '../dataTypes';
import { MemoryStore } from './memory';
export declare class HotCache extends MemoryStore {
    constructor();
    hot(item: ModelReference): boolean;
}
