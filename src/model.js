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

  get $fields() {
    return Object.keys(this.$schema.attributes)
    .concat(Object.keys(this.$schema.relationships));
  }

  get $schema() {
    return this.constructor.$schema;
  }

  get $dirtyFields() {
    return Object.keys(this[$dirty]).map(k => Object.keys(this[$dirty][k]))
    .reduce((acc, curr) => acc.concat(curr), []);
  }

  $$schematize(v) {
    const retVal = { attributes: {}, relationships: {} };
    for (const field in v) {
      if (field === 'id' || field === this.constructor.$id) {
        retVal.id = v[field];
      } else if (field in this.$schema.attributes) {
        retVal.attributes[field] = v[field];
      } else if (field in this.$schema.relationships) {
        retVal.relationships[field] = v[field].map(rel => {
          const relSchema = this.$schema.relationships[field].type.$sides[field];
          const schematized = { id: rel[relSchema.other.field] };
          for (const relField in rel) {
            if (!(relField === relSchema.self.field || relField === relSchema.other.field)) {
              schematized[relField] = rel[relField];
            }
          }
          return schematized;
        });
      }
    }
    return retVal;
  }

  $$flatten(opts) {
    const key = opts || this.$dirtyFields;
    const keys = Array.isArray(key) ? key : [key];
    const retVal = {};
    keys.forEach(k => {
      if (this[$dirty].attributes[k]) {
        retVal[k] = this[$dirty].attributes[k];
      } else if (this[$dirty].relationships[k]) {
        retVal[k] = this.$$resolveRelationships(k);
      }
    });
    return retVal;
  }

  $$overlayDirty(v) {
    const retVal = mergeOptions({}, v);
    for (const attr in this[$dirty].attributes) { // eslint-disable-line guard-for-in
      if (!retVal.attributes) {
        retVal.attributes = {};
      }
      retVal.attributes[attr] = this[$dirty].attributes[attr];
    }
    for (const rel in this[$dirty].relationships) { // eslint-disable-line guard-for-in
      if (!retVal.relationships) {
        retVal.relationships = {};
      }
      retVal.relationships[rel] = this.$$resolveRelationships(rel, retVal.relationships[rel]);
    }
    return retVal;
  }

  $$applyDelta(current, delta) {
    if (delta.op === 'add' || delta.op === 'modify') {
      const retVal = mergeOptions({}, current, delta.data);
      return retVal;
    } else if (delta.op === 'remove') {
      return undefined;
    } else {
      return current;
    }
  }

  $$resolveRelationships(relName, current) {
    // Index current relationships by ID for efficient modification
    const updates = (current || []).map(rel => {
      return { [rel.id]: rel };
    }).reduce((acc, curr) => mergeOptions(acc, curr), {});

    // Apply any deltas in dirty cache on top of updates
    if (relName in this[$dirty].relationships) {
      this[$dirty].relationships[relName].forEach(delta => {
        const childId = delta.data.id;
        updates[childId] = this.$$applyDelta(updates[childId], delta);
      });
    }

    // Collapse updates back into list, omitting undefineds
    return Object.keys(updates)
      .map(id => updates[id])
      .filter(rel => rel !== undefined)
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
          const relSchema = this.$schema.relationships[key].type.$sides[key];
          const id = rel[relSchema.other.field];
          const data = { id };
          for (const field in rel) {
            if (!(field === relSchema.other.field || field === relSchema.self.field)) {
              data[field] = rel[field];
            }
          }
          this[$dirty].relationships[key].push({
            op: 'add',
            data: data,
          });
        });
      }
    }
    this.$$fireUpdate();
  }

  $$hookToPlump() {
    if (this[$unsubscribe] === undefined) {
      this[$unsubscribe] = this[$plump].subscribe(this.constructor.$name, this.$id, ({ field, value }) => {
        if (field === undefined) {
          this.$$copyValuesFrom(value);
        } else {
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
    this[$plump].streamGet(this.constructor, this.$id, fields)
    .subscribe((v) => {
      this.$$fireUpdate(v);
    });
    return this[$subject].subscribeOn(cb);
  }

  $$resetDirty(opts) {
    const key = opts || this.$dirtyFields;
    const keys = Array.isArray(key) ? key : [key];
    keys.forEach(field => {
      if (field in this[$dirty].attributes) {
        delete this[$dirty].attributes[field];
      } else if (field in this[$dirty].relationships) {
        delete this[$dirty].relationships[field];
      }
    });
  }

  $$fireUpdate(v) {
    const update = this.$$overlayDirty(v);
    if (this.$id) {
      update.id = this.$id;
    }
    this[$subject].next(update);
  }

  $get(opts) {
    return Bluebird.resolve()
    .then(() => {
      // If opts is falsy (i.e., undefined), get everything
      // Otherwise, get what was requested,
      // wrapping it in a Array if it wasn't already one
      const keys = opts && !Array.isArray(opts) ? [opts] : opts;
      return this[$plump].get(this.constructor, this.$id, keys);
    }).then(self => {
      if (!self && this.$dirtyFields.length === 0) {
        return null;
      } else {
        const schematized = this.$$schematize(self);
        const retVal = this.$$overlayDirty(schematized);
        retVal.type = this.$name;
        retVal.id = this.$id;
        return retVal;
      }
    });
  }

  // TODO: Should $save ultimately return this.$get()?
  $save(opts) {
    const options = opts || this.$fields;
    const keys = Array.isArray(options) ? options : [options];

    // Deep copy this.$$dirty, filtering out keys that are not in opts
    const update = Object.keys(this[$dirty]).map(fieldType => {
      return { [fieldType]: Object.keys(this[$dirty][fieldType])
        .filter(key => key in keys)
        .map(key => {
          const val = this[$dirty][fieldType][key];
          return { [key]: typeof val === 'object' ? mergeOptions({}, val) : val };
        })
        .reduce((acc, curr) => Object.assign(acc, curr), {}),
      };
    }).reduce((acc, curr) => Object.assign(acc, curr), {});

    if (this.$id !== undefined) {
      update[this.constructor.$id] = this.$id;
    }

    return this[$plump].save(this.constructor, update)
    .then((updated) => {
      const schematized = this.$$schematize(updated);
      this.$$resetDirty(opts);
      if (schematized.id) {
        this[this.constructor.$id] = schematized.id;
      }
      this.$$fireUpdate(schematized);
      return this;
    });
  }

  $set(update) {
    // Filter out non-attribute keys
    const sanitized = {};
    for (const key in update) {
      if (key in this.$schema.attributes) {
        sanitized[key] = update[key];
      } else {
        throw new Error(`Key ${key} is not an attributes of ${this.$name}`);
      }
    }
    this.$$copyValuesFrom(sanitized);
    this.$$fireUpdate(sanitized);
    return this;
  }

  $delete() {
    return this[$plump].delete(this.constructor, this.$id)
    .then(data => this.$$schematize(data));
  }

  $rest(opts) {
    const restOpts = Object.assign(
      {},
      opts,
      {
        url: `/${this.constructor.$name}/${this.$id}/${opts.url}`,
      }
    );
    return this[$plump].restRequest(restOpts).then(data => this.$$schematize(data));
  }

  $add(key, item, extras) {
    if (this.$schema.relationships[key]) {
      let id = 0;
      if (typeof item === 'number') {
        id = item;
      } else if (item.$id) {
        id = item.$id;
      } else {
        id = item[this.$schema.relationships[key].type.$sides[key].other.field];
      }
      if ((typeof id === 'number') && (id >= 1)) {
        if (!(key in this[$dirty].relationships)) {
          this[$dirty].relationships[key] = [];
        }
        this[$dirty].relationships[key].push({
          op: 'add',
          data: Object.assign({ id }, extras),
        });
        this.$$fireUpdate();
        return this;
      } else {
        throw new Error('Invalid item added to hasMany');
      }
    } else {
      throw new Error('Cannot $add except to hasMany field');
    }
  }

  $modifyRelationship(key, item, extras) {
    if (key in this.$schema.relationships) {
      let id = 0;
      if (typeof item === 'number') {
        id = item;
      } else {
        id = item.$id;
      }
      if ((typeof id === 'number') && (id >= 1)) {
        if (!(key in this[$dirty].relationships)) {
          this[$dirty].relationships[key] = [];
        }
        this[$dirty].relationships[key].push({
          op: 'modify',
          data: Object.assign({ id }, extras),
        });
        this.$$fireUpdate();
        return this;
      } else {
        throw new Error('Invalid item added to hasMany');
      }
    } else {
      throw new Error('Cannot $add except to hasMany field');
    }
  }

  $remove(key, item) {
    if (key in this.$schema.relationships) {
      let id = 0;
      if (typeof item === 'number') {
        id = item;
      } else {
        id = item.$id;
      }
      if ((typeof id === 'number') && (id >= 1)) {
        if (key in this[$dirty].relationships) {
          this[$dirty].relationships[key].push({
            op: 'remove',
            data: { id },
          });
        }
        this.$$fireUpdate();
        return this;
      } else {
        throw new Error('Invalid item $removed from hasMany');
      }
    } else {
      throw new Error('Cannot $remove except from hasMany field');
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
