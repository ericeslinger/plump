import Bluebird from 'bluebird';
import { Relationship } from './relationship';
import mergeOptions from 'merge-options';
import { BehaviorSubject } from 'rxjs/Rx';
const $dirty = Symbol('$dirty');
const $plump = Symbol('$plump');
const $loaded = Symbol('$loaded');
const $unsubscribe = Symbol('$unsubscribe');
const $subject = Symbol('$subject');
export const $self = Symbol('$self');
export const $all = Symbol('$all');

// TODO: figure out where error events originate (storage or model)
// and who keeps a roll-backable delta

export class Model {
  constructor(opts, plump) {
    if (plump) {
      this[$plump] = plump;
    } else {
      throw new Error('Cannot construct Plump model without a Plump');
    }
    // TODO: Define Delta interface
    this[$dirty] = {
      attributes: {}, // Simple key-value
      relationships: {}, // relName: Delta[]
    };
    this[$subject] = new BehaviorSubject();
    this[$subject].next({});
    this.$$copyValuesFrom(opts);
  }

  get $name() {
    return this.constructor.$name;
  }

  get $id() {
    return this[this.constructor.$id];
  }

  get $schema() {
    return this.constructor.$schema;
  }

  $$copyValuesFrom(opts = {}) {
    for (const key in opts) { // eslint-disable-line guard-for-in
      // Deep copy arrays and objects
      const val = typeof opts[key] === 'object' ? mergeOptions({}, opts[key]) : opts[key];
      if (key === this.constructor.$id) {
        this[this.constructor.$id] = val;
      } else if (this.$schema.attributes[key]) {
        this[$dirty].attributes[key] = val;
      } else if (this.$schema.relationships[key]) {
        this[$dirty].relationships[key] = val;
      }
    }
    this.$$fireUpdate();
  }

  $$hookToPlump() {
    if (this[$unsubscribe] === undefined) {
      this[$unsubscribe] = this[$plump].subscribe(this.constructor.$name, this.$id, ({ field, value }) => {
        if (field !== undefined) {
          // this.$$copyValuesFrom(value);
          this.$$copyValuesFrom({ [field]: value });
        }
      });
    }
  }

  // TODO: update for new $dirty interface
  $subscribe(...args) {
    let fields = [$self];
    let cb;
    if (args.length === 2) {
      fields = args[0];
      if (!Array.isArray(fields)) {
        fields = [fields];
      }
      cb = args[1];
    } else {
      cb = args[0];
    }
    this.$$hookToPlump();
    if (this[$loaded][$self] === false) {
      this[$plump].streamGet(this.constructor, this.$id, fields)
      .subscribe((v) => this.$$copyValuesFrom(v));
    }
    return this[$subject].subscribe(cb);
  }

  $$resetDirty() {
    this[$dirty] = { attributes: {}, relationships: {} };
  }

  $$fireUpdate() {
    this[$subject].next(this[$dirty]);
  }

  $get(opts) {
    return Bluebird.resolve()
    .then(() => {
      if (opts) {
        // just get the stuff that was requested
        const keys = Array.isArray(opts) ? opts : [opts];
        return this[$plump].get(this.constructor, this.$id, keys);
      } else {
        // get everything
        return this[$plump].get(this.constructor, this.$id);
      }
    }).then(self => {
      const isClean = Object.keys(this[$dirty]).map(k => {
        return Object.keys(this[$dirty][k]).length;
      }).reduce((acc, curr) => acc + curr, 0) === 0;
      if (!self && isClean) {
        return null;
      } else {
        const retVal = {
          type: this.$name,
          id: this.$id,
          attributes: {},
          relationships: {},
        };
        for (const key in self) {
          if (this.$schema.attributes[key]) {
            retVal.attributes[key] = self[key] || this[$dirty].attributes[key];
          } else if (this.$schema.relationships[key]) {
            retVal.relationships[key] = self[key] || this[$dirty].relationships[key];
          }
        }
        return retVal;
      }
    });
  }

  // TODO: Unstub this
  $$resolveRelDeltas(key) {
    return this[$dirty].relationships[key];
  }

  $save(opts) {
    const key = opts || Object.keys(this[$dirty].attributes).concat(Object.keys(this[$dirty].relationships));
    const keys = Array.isArray(key) ? key : [key];
    const update = {};
    keys.forEach(k => {
      if (this[$dirty].attributes[k]) {
        update[k] = this[$dirty].attributes[k];
        delete this[$dirty].attributes[k];
      } else if (this[$dirty].relationships[k]) {
        update[k] = this.$$resolveRelDeltas(k);
        delete this[$dirty].relationships[k];
      }
    });
    return this[$plump].save(this.constructor, update)
    .then((updated) => {
      if (updated[this.$schema.$id]) {
        this[this.$schema.$id] = updated[this.$schema.$id];
      }
      return this;
    });
  }

  $set(u = {}) {
    const update = mergeOptions({}, this[$dirty].attributes, u);
    // this.$$copyValuesFrom(update); // this is the optimistic update;
    return this[$plump].save(this.constructor, update)
    .then((updated) => {
      this.$$copyValuesFrom(updated);
      this.$$resetDirty();
      return this;
    });
  }

  $delete() {
    return this[$plump].delete(this.constructor, this.$id);
  }

  $rest(opts) {
    const restOpts = Object.assign(
      {},
      opts,
      {
        url: `/${this.constructor.$name}/${this.$id}/${opts.url}`,
      }
    );
    return this[$plump].restRequest(restOpts);
  }

  $add(key, item, extras) {
    return Bluebird.resolve()
    .then(() => {
      if (this.$schema.relationships[key]) {
        let id = 0;
        if (typeof item === 'number') {
          id = item;
        } else if (item.$id) {
          id = item.$id;
        } else {
          id = item[this.$schema.relationships[key].relationship.$sides[key].other.field];
        }
        if ((typeof id === 'number') && (id >= 1)) {
          return this[$plump].add(this.constructor, this.$id, key, id, extras);
        } else {
          return Bluebird.reject(new Error('Invalid item added to hasMany'));
        }
      } else {
        return Bluebird.reject(new Error('Cannot $add except to hasMany field'));
      }
    }).then((l) => {
      this.$$copyValuesFrom({ [key]: l });
      return l;
    });
  }

  $modifyRelationship(key, item, extras) {
    if (this.$schema.relationships[key]) {
      let id = 0;
      if (typeof item === 'number') {
        id = item;
      } else {
        id = item.$id;
      }
      if ((typeof id === 'number') && (id >= 1)) {
        return this[$plump].modifyRelationship(this.constructor, this.$id, key, id, extras);
      } else {
        return Bluebird.reject(new Error('Invalid item added to hasMany'));
      }
    } else {
      return Bluebird.reject(new Error('Cannot $add except to hasMany field'));
    }
  }

  $remove(key, item) {
    if (this.$schema.relationships[key]) {
      let id = 0;
      if (typeof item === 'number') {
        id = item;
      } else {
        id = item.$id;
      }
      if ((typeof id === 'number') && (id >= 1)) {
        return this[$plump].remove(this.constructor, this.$id, key, id);
      } else {
        return Bluebird.reject(new Error('Invalid item $removed from hasMany'));
      }
    } else {
      return Bluebird.reject(new Error('Cannot $remove except from hasMany field'));
    }
  }

  $teardown() {
    if (this[$unsubscribe]) {
      this[$unsubscribe].unsubscribe();
    }
  }
}

Model.fromJSON = function fromJSON(json) {
  this.$id = json.$id || 'id';
  this.$name = json.$name;
  this.$include = json.$include;
  this.$schema = {
    attributes: mergeOptions(json.$schema.attributes),
    relationships: {},
  };
  for (const rel in json.$schema.relationships) { // eslint-disable-line guard-for-in
    this.$schema.relationships[rel] = {};
    class DynamicRelationship extends Relationship {}
    DynamicRelationship.fromJSON(json.$schema.relationships[rel]);
    this.$schema.relationships[rel].type = DynamicRelationship;
  }
};

Model.toJSON = function toJSON() {
  const retVal = {
    $id: this.$id,
    $name: this.$name,
    $include: this.$include,
    $schema: { attributes: this.$schema.attributes, relationships: {} },
  };
  for (const rel in this.$schema.relationships) { // eslint-disable-line guard-for-in
    retVal.$schema.relationships[rel] = this.$schema.relationships[rel].type.toJSON();
  }
  return retVal;
};

Model.$rest = function $rest(plump, opts) {
  const restOpts = Object.assign(
    {},
    opts,
    {
      url: `/${this.$name}/${opts.url}`,
    }
  );
  return plump.restRequest(restOpts);
};

Model.assign = function assign(opts) {
  const start = {
    type: this.$name,
    id: opts[this.$schema.$id] || null,
    attributes: {},
    relationships: {},
  };
  ['attributes', 'relationships'].forEach(fieldType => {
    for (const key in this.$schema[fieldType]) {
      if (opts[key]) {
        start[fieldType][key] = opts[key];
      } else if (this.$schema[fieldType][key].default) {
        start[fieldType][key] = this.$schema[fieldType][key].default;
      } else {
        start[fieldType][key] = fieldType === 'attributes' ? null : [];
      }
    }
  });
  return start;
};

Model.$id = 'id';
Model.$name = 'Base';
Model.$self = $self;
Model.$schema = {
  $id: 'id',
  attributes: {},
  relationships: {},
};
Model.$included = [];
