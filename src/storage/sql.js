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

  read(t, id) {
    return this[$knex](t.$name).where({[t.$id]: id}).select()
    .then((o) => o[0] || null);
  }

  delete(t, id) {
    return this[$knex](t.$name).where({[t.$id]: id}).delete()
    .then((o) => o);
  }

  add(t, id, relationship, childId) {
    const fieldInfo = t.$fields[relationship];
    if (fieldInfo === undefined) {
      return Promise.reject(new Error(`Unknown field ${relationship}`));
    } else {
      return this[$knex](fieldInfo.joinTable)
      .where({
        [fieldInfo.parentColumn]: id,
        [fieldInfo.childColumn]: childId,
      }).select()
      .then((l) => {
        if (l.length > 0) {
          return Promise.reject(new Error(`Item ${childId} already in ${relationship} of ${t.$name}:${id}`));
        } else {
          return this[$knex](fieldInfo.joinTable)
          .insert({
            [fieldInfo.parentColumn]: id,
            [fieldInfo.childColumn]: childId,
          }).then(() => {
            return this.has(t, id, relationship);
          });
        }
      });
    }
  }

  has(t, id, relationship) {
    const fieldInfo = t.$fields[relationship];
    if (fieldInfo === undefined) {
      return Promise.reject(new Error(`Unknown field ${relationship}`));
    } else {
      return this[$knex](fieldInfo.joinTable)
      .where({
        [fieldInfo.parentColumn]: id,
      }).select(fieldInfo.childColumn)
      .then((l) => l.map((v) => v[fieldInfo.childColumn]));
    }
  }

  remove(t, id, relationship, childId) {
    const fieldInfo = t.$fields[relationship];
    if (fieldInfo === undefined) {
      return Promise.reject(new Error(`Unknown field ${relationship}`));
    } else {
      return this[$knex](fieldInfo.joinTable)
      .where({
        [fieldInfo.parentColumn]: id,
        [fieldInfo.childColumn]: childId,
      }).delete()
      .then(() => {
        return this.has(t, id, relationship);
      });
    }
  }

  query(q) {
    return Promise.resolve(this[$knex].raw(q.query))
    .then((d) => d.rows);
  }
}
