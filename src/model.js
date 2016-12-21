import Bluebird from 'bluebird';
import { Relationship } from './relationship';
import mergeOptions from 'merge-options';
import { BehaviorSubject } from 'rxjs/Rx';
const $store = Symbol('$store');
const $plump = Symbol('$plump');
const $loaded = Symbol('$loaded');
const $unsubscribe = Symbol('$unsubscribe');
const $subject = Symbol('$subject');

// TODO: figure out where error events originate (storage or model)
// and who keeps a roll-backable delta

export class Model {
  constructor(opts, plump) {
    this[$store] = {};
    this[$loaded] = false;
    this.$relationships = {};
    this[$subject] = new BehaviorSubject();
    Object.keys(this.constructor.$fields).forEach((key) => {
      if (this.constructor.$fields[key].type === 'hasMany') {
        const Rel = this.constructor.$fields[key].relationship;
        this.$relationships[key] = new Rel(this, key, plump);
      }
    });
    this.$$copyValuesFrom(opts || {});
    if (plump) {
      this.$$connectToPlump(plump);
    }
  }

  $$connectToPlump(plump) {
    this[$plump] = plump;
    this[$unsubscribe] = plump.subscribe(this.constructor.$name, this.$id, (v) => {
      this.$$copyValuesFrom(v);
    });
  }

  get $name() {
    return this.constructor.$name;
  }

  get $id() {
    return this[$store][this.constructor.$id];
  }

  $$copyValuesFrom(opts = {}) {
    Object.keys(this.constructor.$fields).forEach((fieldName) => {
      if (opts[fieldName] !== undefined) {
        // copy from opts to the best of our ability
        if (
          (this.constructor.$fields[fieldName].type === 'array') ||
          (this.constructor.$fields[fieldName].type === 'hasMany')
        ) {
          this[$store][fieldName] = (opts[fieldName] || []).concat();
        } else if (this.constructor.$fields[fieldName].type === 'object') {
          this[$store][fieldName] = Object.assign({}, opts[fieldName]);
        } else {
          this[$store][fieldName] = opts[fieldName];
        }
      }
    });
    this[$subject].next(this[$store]);
  }

  $subscribe(l) {
    return this[$subject].subscribe(l);
  }

  // TODO: don't fetch if we $get() something that we already have

  $get(key) {
    // three cases.
    // key === undefined - fetch all, unless $loaded, but return all.
    // fields[key] === 'hasMany' - fetch children (perhaps move this decision to store)
    // otherwise - fetch all, unless $store[key], return $store[key].

    return Bluebird.resolve()
    .then(() => {
      if (
        ((key === undefined) && (this[$loaded] === false)) ||
        (key && (this[$store][key] === undefined))
      ) {
        if (this.$relationships[key]) {
          return this.$relationships[key].$list();
        }
        return this[$plump].get(this.constructor, this.$id, key);
      } else {
        return true;
      }
    }).then((v) => {
      if (v === true) {
        if (key) {
          return this[$store][key];
        } else {
          return Object.assign({}, this[$store]);
        }
      } else if (v) {
        this.$$copyValuesFrom(v);
        this[$loaded] = true;
        if (key) {
          return this[$store][key];
        } else {
          return Object.assign({}, this[$store]);
        }
      } else {
        return null;
      }
    });
  }

  $load(opts = {}) {
    const options = Object.assign({}, { self: true }, opts);
    if (options.self) {
      this.getSelf()
      .then((data) => {
        this.$$copyValuesFrom(data);
        return this;
      });
    }
  }

  $save() {
    return this.$set();
  }

  $set(u = this[$store]) {
    const update = mergeOptions({}, this[$store], u);
    this.$$copyValuesFrom(update); // this is the optimistic update;
    return this[$plump].save(this.constructor, update)
    .then((updated) => {
      this.$$copyValuesFrom(updated);
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
    if (this.constructor.$fields[key].type === 'hasMany') {
      let id = 0;
      if (typeof item === 'number') {
        id = item;
      } else if (item.$id) {
        id = item.$id;
      } else {
        id = item[this.constructor.$fields[key].relationship.$sides[key].other.field];
      }
      if ((typeof id === 'number') && (id >= 1)) {
        return this[$plump].add(this.constructor, this.$id, key, id, extras);
      } else {
        return Bluebird.reject(new Error('Invalid item added to hasMany'));
      }
    } else {
      return Bluebird.reject(new Error('Cannot $add except to hasMany field'));
    }
  }

  $modifyRelationship(key, item, extras) {
    if (this.constructor.$fields[key].type === 'hasMany') {
      let id = 0;
      if (typeof item === 'number') {
        id = item;
      } else {
        id = item.$id;
      }
      if ((typeof id === 'number') && (id >= 1)) {
        delete this[$store][key];
        return this[$plump].modifyRelationship(this.constructor, this.$id, key, id, extras);
      } else {
        return Bluebird.reject(new Error('Invalid item added to hasMany'));
      }
    } else {
      return Bluebird.reject(new Error('Cannot $add except to hasMany field'));
    }
  }

  $remove(key, item) {
    if (this.constructor.$fields[key].type === 'hasMany') {
      let id = 0;
      if (typeof item === 'number') {
        id = item;
      } else {
        id = item.$id;
      }
      if ((typeof id === 'number') && (id >= 1)) {
        delete this[$store][key];
        return this[$plump].remove(this.constructor, this.$id, key, id);
      } else {
        return Bluebird.reject(new Error('Invalid item $removed from hasMany'));
      }
    } else {
      return Bluebird.reject(new Error('Cannot $remove except from hasMany field'));
    }
  }

  $teardown() {
    this[$unsubscribe].unsubscribe();
  }
}

Model.fromJSON = function fromJSON(json) {
  this.$id = json.$id || 'id';
  this.$name = json.$name;
  this.$fields = {};
  Object.keys(json.$fields).forEach((k) => {
    const field = json.$fields[k];
    if (field.type === 'hasMany') {
      class DynamicRelationship extends Relationship {}
      DynamicRelationship.fromJSON(field.relationship);
      this.$fields[k] = {
        type: 'hasMany',
        relationship: DynamicRelationship,
      };
    } else {
      this.$fields[k] = Object.assign({}, field);
    }
  });
};

Model.toJSON = function toJSON() {
  const retVal = {
    $id: this.$id,
    $name: this.$name,
    $fields: {},
  };
  const fieldNames = Object.keys(this.$fields);
  fieldNames.forEach((k) => {
    if (this.$fields[k].type === 'hasMany') {
      retVal.$fields[k] = {
        type: 'hasMany',
        relationship: this.$fields[k].relationship.toJSON(),
      };
    } else {
      retVal.$fields[k] = this.$fields[k];
    }
  });
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

Model.$id = 'id';
Model.$name = 'Base';
Model.$fields = {
  id: {
    type: 'number',
  },
};
