import * as axios from 'axios';
import {Storage} from './storage';

const $axios = Symbol('$axios');

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

  write(t, v) {
    if (v[t.$id]) {
      return this[$axios].put(`/${t.$name}/${v[t.$id]}`, v);
    } else {
      if (this.terminal) {
        return this[$axios].post(`/${t.$name}`, v);
      } else {
        throw new Error('Cannot create new content in a non-terminal store');
      }
    }
  }

  read(t, id) {
    return this[$axios].get(`/${t.$name}/${id}`)
    .then((response) => {
      return response.data[t.$name][id];
    });

    // TODO: cahceable read
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
