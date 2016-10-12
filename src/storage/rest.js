import * as axios from 'axios';
import {Storage} from './storage';

const $axios = Symbol('$axios');
import Promise from 'bluebird';

export class RestStorage extends Storage {

  constructor(opts = {}) {
    super(opts);
    const options = Object.assign(
      {},
      {
        baseURL: 'http://localhost/api',
      },
      opts
    );
    this[$axios] = options.axios || axios.create(options);
  }

  onCacheableRead() {}

  write(t, v) {
    return Promise.resolve()
    .then(() => {
      if (v[t.$id]) {
        return this[$axios].patch(`/${t.$name}/${v[t.$id]}`, v);
      } else {
        if (this.terminal) {
          return this[$axios].post(`/${t.$name}`, v);
        } else {
          throw new Error('Cannot create new content in a non-terminal store');
        }
      }
    }).then((d) => d.data[t.$name][0]);
  }

  read(t, id, relationship) {
    if (!relationship) {
      return this[$axios].get(`/${t.$name}/${id}`)
      .then((response) => {
        return response.data[t.$name][0];
      }).catch((err) => {
        if (err === 404) {
          return null;
        } else {
          throw err;
        }
      });
    } else {
      return this[$axios].get(`/${t.$name}/${id}/${relationship}`)
      .then((response) => response.data);
    }
    // TODO: cacheable read
    // {
    //   const retVal = {
    //     main: ,
    //     extra: [],
    //   };
    //   Object.keys(response.data).forEach((typeName) => {
    //     retVal.extra.concat(response.data[typeName].map((d) => {
    //       if ((d[t.$id] === id) && (typeName === t.$name)) {
    //         return null;
    //       } else {
    //         return Object.assign({}, {typeName}, d);
    //       }
    //     }).filter((v) => v !== null));
    //   });
    //   return retVal;
    // });
  }

  add(t, id, relationship, childId) {
    return this[$axios].put(`/${t.$name}/${id}/${relationship}`, childId);
  }

  remove(t, id, relationship, childId) {
    return this[$axios].delete(`/${t.$name}/${id}/${relationship}/${childId}`);
  }

  delete(t, id) {
    return this[$axios].delete(`/${t.$name}/${id}`)
    .then((response) => {
      return response.data;
    });
  }

  query(q) {
    return this[$axios].get(`/${q.type}`, {params: q.query})
    .then((response) => {
      return response.data;
    });
  }
}
