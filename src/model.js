import Bluebird from 'bluebird';
import { Relationship } from './relationship';
import mergeOptions from 'merge-options';
import { BehaviorSubject } from 'rxjs/Rx';
const $store = Symbol('$store');
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
    this[$store] = {};
    this.$relationships = {};
    this[$subject] = new BehaviorSubject();
    this[$subject].next({});
    this[$loaded] = {
      [$self]: false,
    };
    Object.keys(this.constructor.$fields).forEach((key) => {
      if (this.constructor.$fields[key].type === 'hasMany') {
        const Rel = this.constructor.$fields[key].relationship;
        this.$relationships[key] = new Rel(this, key, plump);
        this[$store][key] = [];
        this[$loaded][key] = false;
      } else {
        this[$store][key] = this.constructor.$fields[key].default || null;
      }
    });
    this.$$copyValuesFrom(opts || {});
    if (plump) {
      this[$plump] = plump;
    }
  }

  get $name() {
    return this.constructor.$name;
  }

  get $id() {
    return this[$store][this.constructor.$id];
  }

  get $$attributeFields() {
    return Object.keys(this.constructor.$fields)
    .filter(key => {
      return key !== this.constructor.$id && this.constructor.$fields[key].type !== 'hasMany';
    });
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

  $$isLoaded(key) {
    if (key === $all) {
      return Object.keys(this[$loaded])
        .map(k => this[$loaded][k])
        .reduce((acc, curr) => acc && curr, true);
    } else {
      return this[$loaded][key];
    }
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
          this[$loaded][fieldName] = true;
        } else if (this.constructor.$fields[fieldName].type === 'object') {
          this[$store][fieldName] = Object.assign({}, opts[fieldName]);
        } else {
          this[$store][fieldName] = opts[fieldName];
        }
      }
    });
    this.$$fireUpdate();
  }

  $$hookToPlump() {
    if (this[$unsubscribe] === undefined) {
      this[$unsubscribe] = this[$plump].subscribe(this.constructor.$name, this.$id, ({ field, value }) => {
        if (field !== undefined) {
          // this.$$copyValuesFrom(value);
          this.$$copyValuesFrom({ [field]: value });
        } else {
          this.$$copyValuesFrom(value);
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
    if (this[$loaded][$self] === false) {
      this[$plump].streamGet(this.constructor, this.$id, fields)
      .subscribe((v) => this.$$copyValuesFrom(v));
    }
    return this[$subject].subscribe(cb);
  }

  $$fireUpdate() {
    this[$subject].next(this[$store]);
  }

  $package(opts) {
    const options = Object.assign(
      {},
      {
        domain: 'https://example.com',
        apiPath: '/api',
      },
      opts
    );
    const prefix = `${options.domain}${options.apiPath}`;

    return Bluebird.all([
      this.$get(this.$$relatedFields.concat($self)),
      this[$plump].bulkGet(this.$$relatedFields),
    ]).then(([self, extendedJSON]) => {
      const extended = {};
      for (const rel in extendedJSON) { // eslint-disable-line guard-for-in
        const type = this.$relationships[rel].constructor.$sides[rel].other.type;
        extended[rel] = extendedJSON[rel].map(data => {
          return this[$plump].forge(type, data);
        });
      }

      return Bluebird.all([
        self,
        this.$$relatedPackage(extended, options),
        this.$$includedPackage(extended, options),
      ]);
    }).then(([self, relationships, included]) => {
      const attributes = {};
      this.$$attributeFields.forEach(key => {
        attributes[key] = self[key];
      });

      const retVal = {
        links: { self: `${prefix}${this.$$path}` },
        data: this.$$dataJSON,
        attributes: attributes,
        included: included,
      };

      if (Object.keys(relationships).length > 0) {
        retVal.relationships = relationships;
      }

      return retVal;
    });
  }

  $$relatedPackage(extended, opts) {
    const options = Object.assign(
      {},
      {
        include: this.constructor.$include,
        domain: 'https://example.com',
        apiPath: '/api',
      },
      opts
    );
    const prefix = `${options.domain}${opts.apiPath}`;
    const fields = Object.keys(options.include).filter(rel => {
      return this[$store][rel] !== undefined;
    });

    return this.$get(fields)
    .then(self => {
      const retVal = {};
      fields.forEach(field => {
        if (extended[field] && self[field].length) {
          const childIds = self[field].map(rel => {
            return rel[this.$relationships[field].constructor.$sides[field].other.field];
          });
          retVal[field] = {
            links: {
              related: `${prefix}${this.$$path}/${field}`,
            },
            data: extended[field].filter(child => {
              return childIds.indexOf(child.$id) >= 0;
            }).map(child => child.$$dataJSON),
          };
        }
      });

      return retVal;
    });
  }

  $$includedPackage(extended, opts) {
    return Bluebird.all(
      Object.keys(extended).map(relationship => {
        return Bluebird.all(
          extended[relationship].map(child => {
            const childOpts = Object.assign(
              {},
              opts,
              { include: this.constructor.$include }
            );
            return child.$$packageForInclusion(extended, childOpts);
          })
        );
      })
    ).then(relationships => {
      return relationships.reduce((acc, curr) => acc.concat(curr));
    });
  }

  $$packageForInclusion(extended, opts = {}) {
    const options = Object.assign(
      {},
      {
        domain: 'https://example.com',
        apiPath: '/api',
        include: this.constructor.$include,
      },
      opts
    );
    const prefix = `${options.domain}${options.apiPath}`;

    return this.$get(this.$$relatedFields.concat($self))
    .then(self => {
      const related = {};
      this.$$relatedFields.forEach(field => {
        const childIds = self[field].map(rel => {
          return rel[this.$relationships[field].constructor.$sides[field].other.field];
        });
        related[field] = extended[field].filter(model => {
          return childIds.indexOf(model.$id) >= 0;
        });
      });
      return this.$$relatedPackage(related, opts)
      .then(relationships => {
        const attributes = {};
        this.$$attributeFields.forEach(field => {
          attributes[field] = self[field];
        });

        const retVal = {
          type: this.$name,
          id: this.$id,
          attributes: attributes,
          links: {
            self: `${prefix}${this.$$path}`,
          },
        };

        if (Object.keys(relationships).length > 0) {
          retVal.relationships = relationships;
        }

        return retVal;
      });
    });
  }

  // TODO: don't fetch if we $get() something that we already have

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
      if (!this.$$isLoaded(key) && this[$plump]) {
        if (typeof key === 'symbol') { // key === $self or $all
          return this[$plump].get(this.constructor, this.$id, key);
        } else {
          return this.$relationships[key].$list();
        }
      } else {
        return true;
      }
    }).then((v) => {
      if (v === true) {
        if (key === $self) {
          const retVal = {};
          for (const k in this[$store]) {
            if (this.constructor.$fields[k].type !== 'hasMany') {
              retVal[k] = this[$store][k];
            }
          }
          return retVal;
        } else {
          return Object.assign({}, { [key]: this[$store][key] });
        }
      } else if (v && (v[$self] !== null)) {
        this.$$copyValuesFrom(v);
        if (key === $all) {
          for (const k in this[$loaded]) { // eslint-disable-line guard-for-in
            this[$loaded][k] = true;
          }
        } else {
          this[$loaded][key] = true;
        }
        if (key === $self) {
          const retVal = {};
          for (const k in this[$store]) {
            if (this.constructor.$fields[k].type !== 'hasMany') {
              retVal[k] = this[$store][k];
            }
          }
          return retVal;
        } else if (key === $all) {
          return Object.assign({}, this[$store]);
        } else {
          return Object.assign({}, { [key]: this[$store][key] });
        }
      } else {
        return null;
      }
    });
  }

  $save() {
    return this.$set();
  }

  $set(u = this[$store]) {
    const update = mergeOptions({}, this[$store], u);
    Object.keys(this.constructor.$fields).forEach((key) => {
      if (this.constructor.$fields[key].type === 'hasMany') {
        delete update[key];
      }
    });
    // this.$$copyValuesFrom(update); // this is the optimistic update;
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
      this.$$copyValuesFrom({ [key]: l });
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
        this[$store][key] = [];
        this[$loaded][key] = false;
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
        this[$store][key] = [];
        this[$loaded][key] = false;
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
