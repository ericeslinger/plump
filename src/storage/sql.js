import * as Promise from 'bluebird';
import knex from 'knex';
import {Storage} from './storage';
const $knex = Symbol('$knex');

export class SQLStorage extends Storage {
  constructor(dbOpts = {}) {
    super();
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
      dbOpts
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

  create(t, v) {
    return Promise.resolve(this[$knex].insert(v).into(t));
  }

  read(t, id) {
    return Promise.resolve(this[$knex](t).where({id: id})
    .select());
  }

  update(t, id, v) {
    return Promise.resolve(this[$knex](t).where({id: id})
    .update(v));
  }

  delete(t, id) {
    return Promise.resolve(this[$knex](t).where({id: id})
    .delete());
  }

  query(q) {
    return Promise.resolve(this[$knex].raw(q.query))
    .then((d) => d.rows);
  }
}
