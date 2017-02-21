import Bluebird from 'bluebird';
import { Relationship } from './relationship';
import mergeOptions from 'merge-options';
import { BehaviorSubject } from 'rxjs/Rx';
const $dirty = Symbol('$dirty');
const $plump = Symbol('$plump');
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

  get $dirtyFields() {
    return Object.keys(this[$dirty]).map(k => Object.keys(this[$dirty][k]))
    .reduce((acc, curr) => acc.concat(curr), []);
  }

  $$copyValuesFrom(opts = {}) {
    for (const key in opts) { // eslint-disable-line guard-for-in
      // Deep copy arrays and objects
      if (key === this.constructor.$id) {
        this[this.constructor.$id] = opts[key];
      } else if (this.$schema.attributes[key]) {
        this[$dirty].attributes[key] = opts[key];
      } else if (this.$schema.relationships[key]) {
        if (!this[$dirty].relationships[key]) {
          this[$dirty].relationships[key] = [];
        }
        opts[key].forEach(rel => {
          this[$dirty].relationships[key].push({
            op: 'add',
            data: rel,
          });
        });
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
    // if (this[$loaded][$self] === false) {
    //   this[$plump].streamGet(this.constructor, this.$id, fields)
    //   .subscribe((v) => this.$$copyValuesFrom(v));
    // }
    return this[$subject].subscribe(cb);
  }

  $$resetDirty() {
    this[$dirty] = { attributes: {}, relationships: {} };
  }

  $$fireUpdate() {
    const update = mergeOptions(this[$dirty]);
    if (this.$id) {
      update.id = this.$id;
    }
    this[$subject].next(update);
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
      const isClean = Object.keys(this[$dirty])
      .map(k => Object.keys(this[$dirty][k]).length)
      .reduce((acc, curr) => acc + curr, 0) === 0;
      if (!self && isClean) {
        return null;
      } else {
        const retVal = {
          type: this.$name,
          id: this.$id,
          attributes: {},
          relationships: {},
        };
        // copy from DB data
        for (const key in self) {
          if (this.$schema.attributes[key]) {
            retVal.attributes[key] = self[key];
          } else if (this.$schema.relationships[key]) {
            retVal.relationships[key] = self[key];
          }
        }
        // override from dirty cache
        for (const attr in this[$dirty].attributes) { // eslint-disable-line guard-for-in
          retVal.attributes[attr] = this[$dirty].attributes[attr];
        }
        for (const rel in this[$dirty].relationships) { // eslint-disable-line guard-for-in
          retVal[rel] = this.$$resolveRelDeltas(retVal[rel], rel);
        }
        return retVal;
      }
    });
  }

  $$applyDelta(current, delta) {
    if (delta.op === 'add' || delta.op === 'modify') {
      return mergeOptions({}, current, delta.data);
    } else if (delta.op === 'remove') {
      return undefined;
    } else {
      return current;
    }
  }

  $$resolveRelDeltas(current, opts) {
    const key = opts || this.$dirtyFields;
    const keys = Array.isArray(key) ? key : [key];
    const updates = {};
    for (const relName in current) {
      if (current in this.$schema.relationships) {
        updates[relName] = current[relName].map(rel => {
          return { [rel.id]: rel };
        }).reduce((acc, curr) => mergeOptions(acc, curr), {});
      }
    }

    for (const relName in keys) {
      // Apply any deltas in dirty cache on top of updates
      if (relName in this[$dirty].relationships) {
        this[$dirty].relationships.forEach(delta => {
          if (!updates[relName]) {
            updates[relName] = {};
          }
          updates[relName][delta.data.id] = this.$$applyDelta(updates[relName][delta.data.id], delta);
        });
      }
    }

    // Collapse updates back into list, omitting undefineds
    return Object.keys(updates).map(relName => {
      return {
        [relName]: Object.keys(updates[relName])
        .map(id => updates[relName][id])
        .filter(rel => rel !== undefined)
        .reduce((acc, curr) => acc.concat(curr), []),
      };
    });
  }

  $save(opts) {
    const key = opts || this.$dirtyFields;
    const keys = Array.isArray(key) ? key : [key];
    const update = {};
    if (this.$id) {
      update[this.constructor.$id] = this.$id;
    }
    keys.forEach(k => {
      if (this[$dirty].attributes[k]) {
        update[k] = this[$dirty].attributes[k];
        delete this[$dirty].attributes[k];
      } else if (this[$dirty].relationships[k]) {
        update[k] = this.$$resolveRelDeltas(null, k);
        delete this[$dirty].relationships[k];
      }
    });
    return this[$plump].save(this.constructor, update)
    .then((updated) => {
      this.$$copyValuesFrom(updated);
      return this;
    });
  }

  $set(update) {
    for (const key in update) {
      if (key in this.$schema.attributes) {
        this[$dirty].attributes[key] = update[key];
      } else if (key in this.$schema.relationships) {
        if (!(key in this[$dirty].relationships)) {
          this[$dirty].relationships[key] = [];
        }
        this[$dirty].relationships[key].push({
          op: 'modify',
          data: update[key],
        });
      }
    }

    return this;
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
      console.log(JSON.stringify(l));
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
