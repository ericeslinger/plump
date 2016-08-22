import {StorageService} from './storageService';
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

  public create(t: string, v: any) {
    return this._knex.insert(v).into(t);
  }

  public read(t: string, id: number) {
    return this._knex(t).where({id: id})
    .select();
  }

  public update(t: string, id: number, v: any) {
    return this._knex(t).where({id: id})
    .update(v);
  }

  public delete(t: string, id: number) {
    return this._knex(t).where({id: id})
    .delete();
  }

  public query(q: string) {
    return this._knex.raw(q)
    .then((d) => d.rows);
  }

  public name: 'SQLStorage';

}
