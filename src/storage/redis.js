import * as Promise from 'bluebird';
import * as Redis from 'redis';
import {Storage} from './storage';


const RedisService = Promise.promisifyAll(Redis);
const $redis = Symbol('$redis');

function saneNumber(i) {
  return ((typeof i === 'number') && (!isNaN(i)) && (i !== Infinity) & (i !== -Infinity));
}

function keyString(t, id, relationship) {
  if (relationship === undefined) {
    return `${t.$name}:store:${id}`;
  } else {
    return `${t.$name}:${relationship}:${id}`;
  }
}

export class RedisStorage extends Storage {

  constructor(opts = {}) {
    super(opts);
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

  $$maxKey(t) {
    return this[$redis].keysAsync(`${t.$name}:store:*`)
    .then((keyArray) => {
      if (keyArray.length === 0) {
        return 0;
      } else {
        return keyArray.map((k) => k.split(':')[2])
        .map((k) => parseInt(k, 10))
        .filter((i) => saneNumber(i))
        .reduce((max, current) => (current > max) ? current : max, 0);
      }
    });
  }

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
    if (id === undefined) {
      if (this.terminal) {
        return this.$$maxKey(t)
        .then((n) => {
          const toSave = Object.assign({}, {[t.$id]: n + 1}, updateObject);
          return this[$redis].setAsync(keyString(t, n + 1), JSON.stringify(toSave))
          .then(() => toSave);
        });
      } else {
        throw new Error('Cannot create new content in a non-terminal store');
      }
    } else {
      return this[$redis].getAsync(keyString(t, id))
      .then((origValue) => {
        const update = Object.assign({}, JSON.parse(origValue), updateObject);
        return this[$redis].setAsync(keyString(t, id), JSON.stringify(update))
        .then(() => update);
      });
    }
  }

  read(t, id, relationship) {
    if (relationship && (t.$fields[relationship].type === 'hasMany')) {
      return this[$redis].getAsync(keyString(t, id, relationship))
      .then((arrayString) => {
        return {[relationship]: (JSON.parse(arrayString) || [])};
      });
    } else {
      return this[$redis].getAsync(keyString(t, id))
      .then((d) => JSON.parse(d));
    }
  }

  delete(t, id) {
    return this[$redis].delAsync(keyString(t, id));
  }

  add(t, id, relationship, childId) {
    return this[$redis].getAsync(keyString(t, id, relationship))
    .then((arrayString) => {
      let relationshipArray = JSON.parse(arrayString);
      if (relationshipArray === null) {
        relationshipArray = [];
      }
      if (relationshipArray.indexOf(childId) < 0) {
        relationshipArray.push(childId);
      }
      return this[$redis].setAsync(keyString(t, id, relationship), JSON.stringify(relationshipArray))
      .then(() => relationshipArray);
    });
  }

  remove(t, id, relationship, childId) {
    return this[$redis].getAsync(keyString(t, id, relationship))
    .then((arrayString) => {
      let relationshipArray = JSON.parse(arrayString);
      if (relationshipArray === null) {
        relationshipArray = [];
      }
      const idx = relationshipArray.indexOf(childId);
      if (idx >= 0) {
        relationshipArray.splice(idx, 1);
        return this[$redis].setAsync(keyString(t, id, relationship), JSON.stringify(relationshipArray))
        .then(() => relationshipArray);
      } else {
        return Promise.reject(new Error(`Item ${childId} not found in ${relationship} of ${t.$name}`));
      }
    });
  }
}
