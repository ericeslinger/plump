import * as Promise from 'bluebird';
const $store = Symbol('$store');
const $guild = Symbol('$guild');
const $self = Symbol('$self');
const $unsubscribe = Symbol('$unsubscribe');

// TODO: figure out where error events originate (storage or model)
// and who keeps a roll-backable delta

export class Model {
  constructor(opts = {}, guild) {
    this[$store] = {};
    this.$$copyValuesFrom(opts);
    if (guild) {
      this.connectToGuild(guild);
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
          this[$store][fieldName] = opts[fieldName].concat();
        } else if (this.constructor.$fields[fieldName].type === 'object') {
          this[$store][fieldName] = Object.assign({}, opts[fieldName]);
        } else {
          this[$store][fieldName] = opts[fieldName];
        }
      }
    });
  }

  $get(key) {
    if (this[$store][key] !== undefined) {
      return Promise.resolve(this[$store][key]);
    } else {
      return this[$guild].get(this.constructor, this.$id)
      .then((v) => {
        this.$$copyValuesFrom(v);
        return this[$store][key];
      });
    }
  }

  $load(opts = {}) {
    const options = Object.assign({}, {self: true}, opts);
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
    let setupPromise = Promise.resolve(update);
    let skipTerminal = null;
    if ((this.$id === undefined) && (update[this.constructor.$id] === undefined)) {
      // need to get an ID.
      const terminals = this.constructor.$storage.filter((s) => s.terminal);
      if (terminals.length === 1) {
        skipTerminal = terminals[0];
        setupPromise = terminals[0].write(this.constructor, update);
      } else {
        return Promise.reject(new Error('Model can only have one terminal store'));
      }
    }
    return setupPromise.then((toUpdate) => {
      return Promise.all(this.constructor.$storage.map((storage) => {
        if (storage !== skipTerminal) {
          return storage.write(this.constructor, toUpdate);
        } else {
          return toUpdate;
        }
      }));
    }).then((updates) => updates[0]);
  }

  $add(key, item) {
    if (this.constructor.$fields[key].type === 'hasMany') {
      let id = 0;
      if (typeof item === 'number') {
        id = item;
      } else {
        id = item.$id;
      }
      if ((typeof id === 'number') && (id > 1)) {
        return Promise.all(this.constructor.$storage.map((storage) => {
          return storage.add(this.constructor, this.$id, key, item);
        }));
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
        return Promise.all(this.constructor.$storage.map((storage) => {
          return storage.remove(this.constructor, this.$id, key, item);
        }));
      } else {
        return Promise.reject(new Error('Invalid item $removed from hasMany'));
      }
    } else {
      return Promise.reject(new Error('Cannot $remove except from hasMany field'));
    }
  }

  $has(key) {
    if (this.constructor.$fields[key].type === 'hasMany') {
      return this[$guild].has(this.constructor, this.$id, key);
    } else {
      return Promise.reject(new Error('Cannot $has only valid on hasMany field'));
    }
  }

  $teardown() {
    this[$unsubscribe].unsubscribe();
  }

}

Model.$id = 'id';
Model.$name = 'Base';
Model.$self = $self;
Model.$fields = {
  id: {
    type: 'number',
  },
};
