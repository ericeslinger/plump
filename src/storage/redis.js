import * as Promise from 'bluebird';
import * as Redis from 'redis';
import {Storage} from './storage';


const RedisService = Promise.promisifyAll(Redis);
const $redis = Symbol('$redis');

export class RedisStorage extends Storage {

  constructor(opts = {}) {
    super();
    const options = Object.assign(
      {},
      {
        port: 6379,
        host: 'localhost',
        db: 0,
        retry_strategy: (o) => {
          if (o.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with a individual error
            return new Error('The server refused the connection');
          }
          if (o.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands with a individual error
            return new Error('Retry time exhausted');
          }
          if (o.times_connected > 10) {
            // End reconnecting with built in error
            return undefined;
          }
          // reconnect after
          return Math.max(o.attempt * 100, 3000);
        },
      },
      opts
    );
    this[$redis] = RedisService.createClient(options);
    this.isCache = true;
  }

  teardown() {
    return this[$redis].quitAsync();
  }

  create(t, v) {
    if (v.id === undefined) {
      return Promise.reject('This service cannot allocate ID values');
    } else {
      return this[$redis].setAsync(`${t}:${v.id}`, JSON.stringify(v));
    }
  }

  read(t, id) {
    return this[$redis].getAsync(`${t}:${id}`)
    .then((d) => JSON.parse(d));
  }

  update(t, id, v) {
    return this.create(t, v);
  }

  delete(t, id) {
    return this[$redis].delAsync(`${t}:${id}`);
  }

  query(q) {
    return this[$redis].keysAsync(`${q.type}:${q.query}`);
  }
}
