const $types = Symbol('$types');
const $storage = Symbol('$storage');

export class Guild {
  constructor(opts = {}) {
    const options = Object.assign({}, {

    }, opts);
  }

  find(t, id) {
    let Type = t;
    if (typeof t === 'string') {
      Type = this[$types][t];
    }
    const retVal = new Type({[Type.$id]: id}, this);
    return retVal;
  }
}
