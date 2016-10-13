import * as Promise from 'bluebird';
import knex from 'knex';
import {Storage} from './storage';
const $knex = Symbol('$knex');

export class SQLStorage extends Storage {
  constructor(opts = {}) {
    super(opts);
    const options = Object.assign(
      {},
      {
        client: 'postgres',
        debug: false,
        connection: {
          user: 'postgres',
          host: 'localhost',
          port: 5432,
          password: '',
          charset: 'utf8',
        },
        pool: {
          max: 20,
          min: 0,
        },
      },
      opts.sql
    );
    this[$knex] = knex(options);
  }

  /*
    note that knex.js "then" functions aren't actually promises the way you think they are.
    you can return knex.insert().into(), which has a then() on it, but that thenable isn't
    an actual promise yet. So instead we're returning Promise.resolve(thenable);
  */

  teardown() {
    return this[$knex].destroy();
  }

  onCacheableRead() {}

  write(t, v) {
    const id = v[t.$id];
    const updateObject = {};
    Object.keys(t.$fields).forEach((fieldName) => {
      if (v[fieldName] !== undefined) {
        // copy from v to the best of our ability
        if (
          (t.$fields[fieldName].type === 'array') ||
          (t.$fields[fieldName].type === 'hasMany')
        ) {
          updateObject[fieldName] = v[fieldName].concat();
        } else if (t.$fields[fieldName].type === 'object') {
          updateObject[fieldName] = Object.assign({}, v[fieldName]);
        } else {
          updateObject[fieldName] = v[fieldName];
        }
      }
    });
    if ((id === undefined) && (this.terminal)) {
      return this[$knex](t.$name).insert(updateObject).returning(t.$id)
      .then((createdId) => {
        return this.read(t, createdId[0]);
      });
    } else if (id !== undefined) {
      return this[$knex](t.$name).where({[t.$id]: id}).update(updateObject)
      .then(() => {
        return this.read(t, id);
      });
    } else {
      throw new Error('Cannot create new content in a non-terminal store');
    }
  }

  read(t, id, relationship) {
    if (relationship && (t.$fields[relationship].type === 'hasMany')) {
      const fieldInfo = t.$fields[relationship];
      if (fieldInfo === undefined) {
        return Promise.reject(new Error(`Unknown field ${relationship}`));
      } else {
        return this[$knex](fieldInfo.relationship)
        .where({
          [fieldInfo.parentField]: id,
        }).select([fieldInfo.childField].concat(fieldInfo.extras || []))
        .then((l) => {
          return {
            [relationship]: l.map((v) => {
              const childData = {
                [t.$id]: v[fieldInfo.childField],
              };
              (fieldInfo.extras || []).forEach((extra) => {
                childData[extra] = v[extra];
              });
              return childData;
            }),
          };
        });
      }
    } else {
      return this[$knex](t.$name).where({[t.$id]: id}).select()
      .then((o) => o[0] || null);
    }
  }

  delete(t, id) {
    return this[$knex](t.$name).where({[t.$id]: id}).delete()
    .then((o) => o);
  }

  add(t, id, relationship, childId, extras = {}) {
    const fieldInfo = t.$fields[relationship];
    if (fieldInfo === undefined) {
      return Promise.reject(new Error(`Unknown field ${relationship}`));
    } else {
      const newField = {
        [fieldInfo.parentField]: id,
        [fieldInfo.childField]: childId,
      };
      (fieldInfo.extras || []).forEach((extra) => {
        newField[extra] = extras[extra];
      });
      return this[$knex](fieldInfo.relationship)
      .insert(newField).then(() => {
        return this.read(t, id, relationship);
      });
    }
  }

  modifyRelationship(t, id, relationship, childId, extras = {}) {
    const fieldInfo = t.$fields[relationship];
    if (fieldInfo === undefined) {
      return Promise.reject(new Error(`Unknown field ${relationship}`));
    } else {
      const newField = {};
      fieldInfo.extras.forEach((extra) => {
        if (extras[extra] !== undefined) {
          newField[extra] = extras[extra];
        }
      });
      return this[$knex](fieldInfo.relationship)
      .where({
        [fieldInfo.parentField]: id,
        [fieldInfo.childField]: childId,
      }).update(newField);
    }
  }

  remove(t, id, relationship, childId) {
    const fieldInfo = t.$fields[relationship];
    if (fieldInfo === undefined) {
      return Promise.reject(new Error(`Unknown field ${relationship}`));
    } else {
      return this[$knex](fieldInfo.relationship)
      .where({
        [fieldInfo.parentField]: id,
        [fieldInfo.childField]: childId,
      }).delete()
      .then(() => {
        return this.read(t, id, relationship);
      });
    }
  }

  query(q) {
    return Promise.resolve(this[$knex].raw(q.query))
    .then((d) => d.rows);
  }
}
