import {Model} from './model';

const $types = Symbol('$types');
const $storage = Symbol('$storage');

export class Datastore {
  constructor(opts = {}) {
    this[$storage] = opts.storage.concat();
    this[$types] = {};
    this.Base = Model;
    this.Base.$storage = this[$storage];
  }
  defineType(type) {
    if (this[$types][type.$name] !== undefined) {
      throw new Error(`Duplicate type definition ${type.$name}`);
    }
    this[$types][type.$name] = type;
  }
  getType(type) {
    return this[$types][type];
  }
  getStorage() {
    return this[$storage];
  }
  find(type, id) {
    const Type = this[$types][type];
    return new Type({
      [Type.$id]: id,
    });
  }
}
