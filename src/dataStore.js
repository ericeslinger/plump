const $types = Symbol('$types');
const $storage = Symbol('$storage');

export class Datastore {
  constructor(opts = {}) {
    this[$storage] = opts.storage.concat();
    this[$types] = {};
  }
  defineType(type) {
    if (this[$types][type.name] !== undefined) {
      throw new Error(`Duplicate type definition ${type.name}`);
    }
    this[$types][type.name] = type;
  }
  getType(type) {
    return this[$types][type];
  }
  getStorage() {
    return this[$storage];
  }
}
