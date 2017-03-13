import mergeOptions from 'merge-options';
import { BehaviorSubject } from 'rxjs/Rx';

import { Relationship } from './relationship';
const $dirty = Symbol('$dirty');
const $plump = Symbol('$plump');
const $unsubscribe = Symbol('$unsubscribe');
const $subject = Symbol('$subject');
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
    // this.$$fireUpdate(opts);
  }

  // CONVENIENCE ACCESSORS

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
    return Object.keys(this[$dirty])
    .map(k => Object.keys(this[$dirty][k]))
    .reduce((acc, curr) => acc.concat(curr), [])
    .filter(k => k !== this.constructor.$id) // id should never be dirty
    .reduce((acc, curr) => acc.concat(curr), []);
  }

  // WIRING

  $$copyValuesFrom(opts = {}) {
    const idField = this.constructor.$id in opts ? this.constructor.$id : 'id';
    this[this.constructor.$id] = opts[idField] || this.$id;
    this[$dirty] = this.constructor.schematize(opts);
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
    let fields = ['attributes'];
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
    const newDirty = { attributes: {}, relationships: {} };
    const keys = Array.isArray(key) ? key : [key];
    Object.keys(this[$dirty]).forEach(schemaField => {
      for (const field in this[$dirty][schemaField]) {
        if (keys.indexOf(field) < 0) {
          const val = this[$dirty][schemaField][field];
          newDirty[schemaField][field] = typeof val === 'object' ? mergeOptions({}, val) : val;
        }
      }
    });
    this[$dirty] = newDirty;
  }

  $$fireUpdate(v) {
    const update = this.constructor.resolveAndOverlay(this[$dirty], v);
    if (this.$id) {
      update.id = this.$id;
    }
    this[$subject].next(update);
  }

  $teardown() {
    if (this[$unsubscribe]) {
      this[$unsubscribe].unsubscribe();
    }
  }

  // API METHODS

  $get(opts) {
    // If opts is falsy (i.e., undefined), get attributes
    // Otherwise, get what was requested,
    // wrapping the request in a Array if it wasn't already one
    let keys = opts && !Array.isArray(opts) ? [opts] : opts;
    if (keys && keys.indexOf($all) >= 0) {
      keys = Object.keys(this.$schema.relationships);
    }
    return this[$plump].get(this.constructor, this.$id, keys)
    .then(self => {
      if (!self && this.$dirtyFields.length === 0) {
        return null;
      } else {
        const schematized = this.constructor.schematize(self || {});
        const withDirty = this.constructor.resolveAndOverlay(this[$dirty], schematized);
        const retVal = this.constructor.applyDefaults(withDirty);
        retVal.type = this.$name;
        retVal.id = this.$id;
        return retVal;
      }
    });
  }

  $bulkGet() {
    return this[$plump].bulkGet(this.constructor, this.$id);
  }

  // TODO: Should $save ultimately return this.$get()?
  $save(opts) {
    const options = opts || this.$fields;
    const keys = Array.isArray(options) ? options : [options];

    // Deep copy dirty cache, filtering out keys that are not in opts
    const update = Object.keys(this[$dirty]).map(schemaField => {
      const value = Object.keys(this[$dirty][schemaField])
        .filter(key => keys.indexOf(key) >= 0)
        .map(key => ({ [key]: this[$dirty][schemaField][key] }))
        .reduce((acc, curr) => Object.assign(acc, curr), {});
      return { [schemaField]: value };
    })
    .reduce(
      (acc, curr) => Object.assign(acc, curr),
      { id: this.$id, type: this.constructor.$name });

    if (this.$id !== undefined) {
      update.id = this.$id;
    }
    update.type = this.$name;

    return this[$plump].save(update)
    .then((updated) => {
      this.$$resetDirty(opts);
      if (updated.id) {
        this[this.constructor.$id] = updated.id;
      }
      // this.$$fireUpdate(updated);
      return this.$get();
    });
  }

  $set(update) {
    const flat = update.attributes || update;
    // Filter out non-attribute keys
    const sanitized = Object.keys(flat)
      .filter(k => k in this.$schema.attributes)
      .map(k => { return { [k]: flat[k] }; })
      .reduce((acc, curr) => mergeOptions(acc, curr), {});

    this.$$copyValuesFrom(sanitized);
    // this.$$fireUpdate(sanitized);
    return this;
  }

  $delete() {
    return this[$plump].delete(this.constructor, this.$id)
    .then(data => data.map(this.constructor.schematize));
  }

  $rest(opts) {
    const restOpts = Object.assign(
      {},
      opts,
      {
        url: `/${this.constructor.$name}/${this.$id}/${opts.url}`,
      }
    );
    return this[$plump].restRequest(restOpts).then(data => this.constructor.schematize(data));
  }

  $add(key, item, extras) {
    if (this.$schema.relationships[key]) {
      let id = 0;
      if (typeof item === 'number') {
        id = item;
      } else if (item.id) {
        id = item.id;
      } else {
        id = item[this.$schema.relationships[key].type.$sides[key].other.field];
      }
      if ((typeof id === 'number') && (id >= 1)) {
        const data = { id };
        if (extras) {
          data.meta = extras;
        }
        this[$dirty].relationships[key] = this[$dirty].relationships[key] || [];
        this[$dirty].relationships[key].push({
          op: 'add',
          data,
        });
        // this.$$fireUpdate();
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
          data: Object.assign({ id }, { meta: extras }),
        });
        // this.$$fireUpdate();
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
        if (!(key in this[$dirty].relationships)) {
          this[$dirty].relationships[key] = [];
        }
        this[$dirty].relationships[key].push({
          op: 'remove',
          data: { id },
        });
        // this.$$fireUpdate();
        return this;
      } else {
        throw new Error('Invalid item $removed from hasMany');
      }
    } else {
      throw new Error('Cannot $remove except from hasMany field');
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

// SCHEMA FUNCTIONS

Model.addDelta = function addDelta(relName, relationship) {
  return relationship.map(rel => {
    const relSchema = this.$schema.relationships[relName].type.$sides[relName];
    const schematized = { op: 'add', data: { id: rel[relSchema.other.field] } };
    for (const relField in rel) {
      if (!(relField === relSchema.self.field || relField === relSchema.other.field)) {
        schematized.data[relField] = rel[relField];
      }
    }
    return schematized;
  });
};

Model.applyDefaults = function applyDefaults(v) {
  const retVal = mergeOptions({}, v);
  for (const attr in this.$schema.attributes) {
    if ('default' in this.$schema.attributes[attr] && !(attr in retVal.attributes)) {
      retVal.attributes[attr] = this.$schema.attributes[attr].default;
    }
  }
  Object.keys(this.$schema)
  .filter(k => k[0] !== '$')
  .forEach(schemaField => {
    for (const field in this.$schema[schemaField]) {
      if (!(field in retVal[schemaField])) {
        if ('default' in this.$schema[schemaField][field]) {
          retVal[schemaField][field] = this.$schema[schemaField][field].default;
        }
      }
    }
  });
  return retVal;
};

Model.applyDelta = function applyDelta(current, delta) {
  if (delta.op === 'add' || delta.op === 'modify') {
    const retVal = mergeOptions({}, current, delta.data);
    return retVal;
  } else if (delta.op === 'remove') {
    return undefined;
  } else {
    return current;
  }
};

Model.assign = function assign(opts) {
  const schematized = this.schematize(opts, { includeId: true });
  const retVal = this.applyDefaults(schematized);
  Object.keys(this.$schema)
  .filter(k => k[0] !== '$')
  .forEach(schemaField => {
    for (const field in this.$schema[schemaField]) {
      if (!(field in retVal[schemaField])) {
        retVal[schemaField][field] = schemaField === 'relationships' ? [] : null;
      }
    }
  });
  retVal.type = this.$name;
  return retVal;
};

Model.cacheGet = function cacheGet(store, key) {
  return (this.$$storeCache.get(store) || {})[key];
};

Model.cacheSet = function cacheSet(store, key, value) {
  if (this.$$storeCache.get(store) === undefined) {
    this.$$storeCache.set(store, {});
  }
  this.$$storeCache.get(store)[key] = value;
};

Model.resolveAndOverlay = function resolveAndOverlay(update, base = { attributes: {}, relationships: {} }) {
  const attributes = mergeOptions({}, base.attributes, update.attributes);
  const baseIsResolved = Object.keys(base.relationships).map(relName => {
    return base.relationships[relName].map(rel => !('op' in rel)).reduce((acc, curr) => acc && curr, true);
  }).reduce((acc, curr) => acc && curr, true);
  const resolvedBaseRels = baseIsResolved ? base.relationships : this.resolveRelationships(base.relationships);
  const resolvedRelationships = this.resolveRelationships(update.relationships, resolvedBaseRels);
  return { attributes, relationships: resolvedRelationships };
};

Model.resolveRelationships = function resolveRelationships(deltas, base = {}) {
  const updates = Object.keys(deltas).map(relName => {
    const resolved = this.resolveRelationship(deltas[relName], base[relName]);
    return { [relName]: resolved };
  })
  .reduce((acc, curr) => mergeOptions(acc, curr), {});
  return mergeOptions({}, base, updates);
};

Model.resolveRelationship = function resolveRelationship(deltas, base = []) {
  // Index current relationships by ID for efficient modification
  const updates = base.map(rel => {
    return { [rel.id]: rel };
  }).reduce((acc, curr) => mergeOptions(acc, curr), {});

  // Apply deltas on top of updates
  deltas.forEach(delta => {
    const childId = delta.data ? delta.data.id : delta.id;
    updates[childId] = delta.op ? this.applyDelta(updates[childId], delta) : delta;
  });

  // Reduce updates back into list, omitting undefineds
  return Object.keys(updates)
    .map(id => updates[id])
    .filter(rel => rel !== undefined)
    .reduce((acc, curr) => acc.concat(curr), []);
};

Model.schematize = function schematize(v = {}, opts = { includeId: false }) {
  const retVal = {};
  if (opts.includeId) {
    retVal.id = this.$id in v ? v[this.$id] : v.id;
  }
  Object.keys(this.$schema)
  .filter(k => k[0] !== '$')
  .forEach(schemaField => {
    if (schemaField in v) {
      retVal[schemaField] = mergeOptions({}, v[schemaField]);
    } else {
      retVal[schemaField] = retVal[schemaField] || {};
      for (const field in this.$schema[schemaField]) {
        if (field in v) {
          retVal[schemaField][field] = schemaField === 'relationships' ? this.addDelta(field, v[field]) : v[field];
        }
      }
    }
  });
  return retVal;
};

// METADATA

Model.$$storeCache = new Map();

Model.$id = 'id';
Model.$name = 'Base';
Model.$schema = {
  $name: 'base',
  $id: 'id',
  attributes: {},
  relationships: {},
};
Model.$included = [];
