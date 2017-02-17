import Bluebird from 'bluebird';
import { Relationship } from './relationship';
import mergeOptions from 'merge-options';
import { BehaviorSubject } from 'rxjs/Rx';
const $plump = Symbol('$plump');
const $unsubscribe = Symbol('$unsubscribe');
const $subject = Symbol('$subject');
const $updates = Symbol('$updates');
export const $self = Symbol('$self');
export const $all = Symbol('$all');

// TODO: figure out where error events originate (storage or model)
// and who keeps a roll-backable delta

export class Model {
  constructor(opts, plump) {
    this.$relationships = {};
    this[$subject] = new BehaviorSubject();
    this[$subject].next({});
    Object.keys(this.constructor.$fields).forEach((fieldName) => {
      if (this.constructor.$fields[fieldName].type === 'hasMany') {
        const Rel = this.constructor.$fields[fieldName].relationship;
        this.$relationships[fieldName] = new Rel(this, fieldName, plump);
      }
    });
    if (plump) {
      this[$plump] = plump;
    }
    this.$set(opts || {});
    if (opts[this.constructor.$id]) {
      this.$id = opts[this.constructor.$id];
    }
    // this.$$copyValuesFrom(opts || {});
  }

  get $name() {
    return this.constructor.$name;
  }

  get $$relatedFields() {
    return Object.keys(this.constructor.$include);
  }

  get $$path() {
    return `/${this.$name}/${this.$id}`;
  }

  get $$dataJSON() {
    return {
      type: this.$name,
      id: this.$id,
    };
  }

  $$unmarshal(val) {
    if (val) {
      function unmarshalOne(field, fieldName, values) {
        if (field.type === 'array') {
          return (values[fieldName] || []).concat();
        } else if (field.type === 'hasMany') {
          const side = field.relationship.$sides[fieldName];
          return (values[fieldName] || []).map((v) => {
            const retVal = {
              id: v[side.other.field],
            };
            if (field.relationship.$extras) {
              Object.keys(field.relationship.$extras).forEach((extra) => {
                retVal[extra] = v[extra];
              });
            }
            return retVal;
          });
        } else if (field.type === 'object') {
          return mergeOptions({}, values[fieldName]);
        } else {
          return values[fieldName];
        }
      }

      if (val && val[this.constructor.$id]) {
        this.$id = val[this.constructor.$id];
      }

      return Object.keys(this.constructor.$fields)
    .reduce((obj, fieldName) => {
      return Object.assign({}, obj, { [fieldName]: unmarshalOne(fieldName, this.constructor.$fields[fieldName], val) });
    }, {});
    } else {
      return null;
    }
  }

  // $$copyValuesFrom(opts = {}) {
  //   Object.keys(this.constructor.$fields).forEach((fieldName) => {
  //     if (opts[fieldName] !== undefined) {
  //       // copy from opts to the best of our ability
  //       if (field.type === 'array') {
  //         this[$store][fieldName] = (opts[fieldName] || []).concat();
  //         this[$loaded][fieldName] = true;
  //       } else if (field.type === 'hasMany') {
  //         const side = field.relationship.$sides[fieldName];
  //         this[$store][fieldName] = opts[fieldName].map((v) => {
  //           const retVal = {
  //             id: v[side.other.field],
  //           };
  //           if (field.relationship.$extras) {
  //             Object.keys(field.relationship.$extras).forEach((extra) => {
  //               retVal[extra] = v[extra];
  //             });
  //           }
  //           return retVal;
  //         });
  //         this[$loaded][fieldName] = true;
  //       } else if (field.type === 'object') {
  //         this[$store][fieldName] = Object.assign({}, opts[fieldName]);
  //       } else {
  //         this[$store][fieldName] = opts[fieldName];
  //       }
  //     }
  //   });
  //   this.$$fireUpdate();
  // }

  $$hookToPlump() {
    if (this[$unsubscribe] === undefined) {
      this[$unsubscribe] = this[$plump].subscribe(this.constructor.$name, this.$id, ({ field, value }) => {
        // if (field !== undefined) {
        //   // this.$$copyValuesFrom(value);
        //   // this.$$copyValuesFrom({ [field]: value });
        // } else {
        //   // this.$$copyValuesFrom(value);
        // }
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
    this[$plump].streamGet(this.constructor, this.$id, fields);
    // .subscribe((v) => this.$$copyValuesFrom(v));
    return this[$subject].subscribe(cb);
  }

  // $$fireUpdate() {
  //   this[$subject].next(this[$store]);
  // }
  //
  // Model.$get, when asking for a hasMany field will
  // ALWAYS resolve to an object with that field as a property.
  // The value of that property will ALWAYS be an array (possibly empty).
  // The elements of the array will ALWAYS be objects, with at least an 'id' field.
  // Array elements MAY have other fields (if the hasMany has valence).

  $get(opts = $self) {
    let keys;
    if (Array.isArray(opts)) {
      keys = opts;
    } else {
      keys = [opts];
    }
    return Bluebird.all(keys.map((key) => this.$$singleGet(key)))
    .then((valueArray) => {
      const selfIdx = keys.indexOf($self);
      if ((selfIdx >= 0) && (valueArray[selfIdx] === null)) {
        return null;
      } else {
        return valueArray.reduce((accum, curr) => Object.assign(accum, curr), {});
      }
    }).then((values) => {
      return Object.assign({}, values, this[$updates]);
    });
  }

  $$singleGet(opt = $self) {
    // X cases.
    // key === $all - fetch all fields unless loaded, return all fields
    // $fields[key].type === 'hasMany', - fetch children (perhaps move this decision to store)
    // otherwise - fetch non-hasMany fields unless already loaded, return all non-hasMany fields
    let key;
    if ((opt !== $self) && (opt !== $all) && (this.constructor.$fields[opt].type !== 'hasMany')) {
      key = $self;
    } else {
      key = opt;
    }

    return Bluebird.resolve()
    .then(() => {
      if (typeof key === 'symbol') { // key === $self or $all
        return this[$plump].get(this.constructor, this.$id, key);
      } else {
        return this.$relationships[key].$list();
      }
    }).then((v) => this.$$unmarshal(v));
  }

  $save(opts = {}) {
    this[$updates] = Object.assign({}, this[$updates], opts);
    return this[$plump].save(this.constructor, this[$updates])
    .then(() => {
      this[$updates] = {};
    });
  }

  $set(opts = {}) {
    this[$updates] = Object.assign({}, this[$updates], opts);
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
    }).then((l) => {
      // this.$$copyValuesFrom({ [key]: l });
      return l;
    });
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
    $include: this.$include,
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

Model.assign = function assign(opts) {
  const start = {};
  Object.keys(this.$fields).forEach((key) => {
    if (opts[key]) {
      start[key] = opts[key];
    } else if (this.$fields[key].default) {
      start[key] = this.$fields[key].default;
    } else if (this.$fields[key].type === 'hasMany') {
      start[key] = [];
    } else {
      start[key] = null;
    }
  });
  return start;
};

Model.$id = 'id';
Model.$name = 'Base';
Model.$self = $self;
Model.$fields = {
  id: {
    type: 'number',
  },
};
Model.$included = [];
