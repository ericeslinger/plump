import {StorageService} from './storageService';
import {Dictionary, Storable} from './storable';
import * as Promise from 'bluebird';
import * as Knex from 'knex';

export class SQLStorage implements StorageService {
  private _knex: Knex;

  constructor(dbOpts: any = {}) {
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
    this._knex = Knex(options);
  }

  /*
    note that knex.js "then" functions aren't actually promises the way you think they are.
    you can return knex.insert().into(), which has a thenable on it, but that thenable isn't
    an actual promise yet. So instead we're returning Promise.resolve(thenable);
  */

  public create(t: string, v: Dictionary) {
    return Promise.resolve(this._knex.insert(v).into(t));
  }

  public read(t: string, id: number) {
    return Promise.resolve(this._knex(t).where({id: id})
    .select());
  }

  public update(t: string, id: number, v: Storable) {
    return Promise.resolve(this._knex(t).where({id: id})
    .update(v));
  }

  public delete(t: string, id: number) {
    return Promise.resolve(this._knex(t).where({id: id})
    .delete());
  }

  public query(q: {type: string, query: any}) {
    return Promise.resolve(this._knex.raw(q.query))
    .then((d) => d.rows);
  }

  public name: 'SQLStorage';

}
