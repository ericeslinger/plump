import { ModelReference } from '../dataTypes';
import { MemoryStore } from './memory';

export class HotCache extends MemoryStore {
  constructor() {
    super({ terminal: false });
  }
  hot(item: ModelReference): boolean {
    return !!this.store[this.keyString(item)];
  }
}
