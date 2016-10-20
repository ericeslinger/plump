import * as Promise from 'bluebird';
import knex from 'knex';
import { Storage } from './storage';
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
      return this[$knex](t.$name).where({ [t.$id]: id }).update(updateObject)
      .then(() => {
        return this.read(t, id);
      });
    } else {
      throw new Error('Cannot create new content in a non-terminal store');
    }
  }

  readOne(t, id) {
    return this[$knex](t.$name).where({ [t.$id]: id }).select()
    .then((o) => o[0] || null);
  }

  readMany(type, id, relationshipTitle) {
    const relationshipBlock = type.$fields[relationshipTitle];
    const sideInfo = relationshipBlock.relationship.$sides[relationshipTitle];
    const toSelect = [sideInfo.other.field, sideInfo.self.field].concat(relationshipBlock.relationship.$extras || []);
    return this[$knex](relationshipBlock.relationship.$name)
    .where({
      [sideInfo.self.field]: id,
    }).select(toSelect)
    .then((l) => {
      return {
        [relationshipTitle]: l,
      };
    });
  }

  delete(t, id) {
    return this[$knex](t.$name).where({ [t.$id]: id }).delete()
    .then((o) => o);
  }

  add(type, id, relationshipTitle, childId, extras = {}) {
    const relationshipBlock = type.$fields[relationshipTitle];
    const sideInfo = relationshipBlock.relationship.$sides[relationshipTitle];
    const newField = {
      [sideInfo.other.field]: childId,
      [sideInfo.self.field]: id,
    };
    (relationshipBlock.relationship.$extras || []).forEach((extra) => {
      newField[extra] = extras[extra];
    });
    return this[$knex](relationshipBlock.relationship.$name)
    .insert(newField).then(() => {
      return this.readMany(type, id, relationshipTitle);
    });
  }

  modifyRelationship(type, id, relationshipTitle, childId, extras = {}) {
    const relationshipBlock = type.$fields[relationshipTitle];
    const sideInfo = relationshipBlock.relationship.$sides[relationshipTitle];
    const newField = {};
    relationshipBlock.relationship.$extras.forEach((extra) => {
      if (extras[extra] !== undefined) {
        newField[extra] = extras[extra];
      }
    });
    return this[$knex](relationshipBlock.relationship.$name)
    .where({
      [sideInfo.other.field]: childId,
      [sideInfo.self.field]: id,
    }).update(newField);
  }

  remove(type, id, relationshipTitle, childId) {
    const relationshipBlock = type.$fields[relationshipTitle];
    const sideInfo = relationshipBlock.relationship.$sides[relationshipTitle];
    return this[$knex](relationshipBlock.relationship.$name)
    .where({
      [sideInfo.other.field]: childId,
      [sideInfo.self.field]: id,
    }).delete()
    .then(() => {
      return this.readMany(type, id, relationshipTitle);
    });
  }

  query(q) {
    return Promise.resolve(this[$knex].raw(q.query))
    .then((d) => d.rows);
  }
}
