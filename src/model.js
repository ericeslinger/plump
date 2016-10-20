import * as Promise from 'bluebird';
const $store = Symbol('$store');
const $guild = Symbol('$guild');
const $loaded = Symbol('$loaded');
const $unsubscribe = Symbol('$unsubscribe');

// TODO: figure out where error events originate (storage or model)
// and who keeps a roll-backable delta

export class Model {
  constructor(opts, guild) {
    this[$store] = {};
    this.$$copyValuesFrom(opts || {});
    this[$loaded] = false;
    this.$relationships = {};
    Object.keys(this.constructor.$fields).forEach((key) => {
      if (this.constructor.$fields[key].type === 'hasMany') {
        const Relationship = this.constructor.$fields[key].relationship;
        this.$relationships[key] = new Relationship(this, key, guild);
      }
    });
    if (guild) {
      this.$$connectToGuild(guild);
    }
  }

  $$connectToGuild(guild) {
    this[$guild] = guild;
    this[$unsubscribe] = guild.subscribe(this.constructor.$name, this.$id, (v) => {
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
  }

  // TODO: don't fetch if we $get() something that we already have

  $get(key) {
    // three cases.
    // key === undefined - fetch all, unless $loaded, but return all.
    // fields[key] === 'hasMany' - fetch children (perhaps move this decision to store)
    // otherwise - fetch all, unless $store[key], return $store[key].

    return Promise.resolve()
    .then(() => {
      if (
        ((key === undefined) && (this[$loaded] === false)) ||
        (key && (this[$store][key] === undefined))
      ) {
        if (this.$relationships[key]) {
          return this.$relationships[key].$list();
        }
        return this[$guild].get(this.constructor, this.$id, key);
      } else {
        return true;
      }
    }).then((v) => {
      if (v === true) {
        return this[$store][key];
      } else {
        this.$$copyValuesFrom(v);
        this[$loaded] = true;
        if (key) {
          return this[$store][key];
        } else {
          return Object.assign({}, this[$store]);
        }
      }
    });
  }

  $relationship(key) {
    return
  }

  $load(opts = {}) {
    const options = Object.assign({}, { self: true }, opts);
    if (options.self) {
      this.getSelf()
      .then((data) => {
        this.$$copyValuesFrom(data);
      });
    }
  }

  $save() {
    return this.$set();
  }

  $set(update = this[$store]) {
    this.$$copyValuesFrom(update); // this is the optimistic update;
    return this[$guild].save(this.constructor, update)
    .then((updated) => {
      this.$$copyValuesFrom(updated);
      return updated;
    });
    // .then((updates) => {
    //   return updates;
    // });
  }

  $add(key, item, extras) {
    if (this.constructor.$fields[key].type === 'hasMany') {
      let id = 0;
      if (typeof item === 'number') {
        id = item;
      } else {
        id = item.$id;
      }
      if ((typeof id === 'number') && (id > 1)) {
        return this[$guild].add(this.constructor, this.$id, key, id, extras);
      } else {
        return Promise.reject(new Error('Invalid item added to hasMany'));
      }
    } else {
      return Promise.reject(new Error('Cannot $add except to hasMany field'));
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
      if ((typeof id === 'number') && (id > 1)) {
        delete this[$store][key];
        return this[$guild].modifyRelationship(this.constructor, this.$id, key, id, extras);
      } else {
        return Promise.reject(new Error('Invalid item added to hasMany'));
      }
    } else {
      return Promise.reject(new Error('Cannot $add except to hasMany field'));
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
      if ((typeof id === 'number') && (id > 1)) {
        delete this[$store][key];
        return this[$guild].remove(this.constructor, this.$id, key, id);
      } else {
        return Promise.reject(new Error('Invalid item $removed from hasMany'));
      }
    } else {
      return Promise.reject(new Error('Cannot $remove except from hasMany field'));
    }
  }

  $teardown() {
    this[$unsubscribe].unsubscribe();
  }

}

Model.$id = 'id';
Model.$name = 'Base';
Model.$fields = {
  id: {
    type: 'number',
  },
};
