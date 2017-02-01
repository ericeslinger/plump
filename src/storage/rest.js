import * as axios from 'axios';
import { Storage } from './storage';

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

  rest(options) {
    return this[$axios](options);
  }

  write(t, v) {
    return Promise.resolve()
    .then(() => {
      if (v[t.$id]) {
        return this[$axios].patch(`/${t.$name}/${v[t.$id]}`, v);
      } else if (this.terminal) {
        return this[$axios].post(`/${t.$name}`, v);
      } else {
        throw new Error('Cannot create new content in a non-terminal store');
      }
    })
    .then((d) => d.data[t.$name][0])
    .then((result) => this.notifyUpdate(t, result[t.$id], result).then(() => result));
  }

  readOne(t, id) {
    return Promise.resolve()
    .then(() => this[$axios].get(`/${t.$name}/${id}`))
    .then((response) => {
      return response.data[t.$name][0];
    }).catch((err) => {
      if (err.response && err.response.status === 404) {
        return null;
      } else {
        throw err;
      }
    });
  }

  readMany(t, id, relationship) {
    return this[$axios].get(`/${t.$name}/${id}/${relationship}`)
    .then((response) => response.data)
    .catch((err) => {
      if (err.response && err.response.status === 404) {
        return [];
      } else {
        throw err;
      }
    });
  }

  add(type, id, relationshipTitle, childId, extras) {
    const relationshipBlock = type.$fields[relationshipTitle];
    const sideInfo = relationshipBlock.relationship.$sides[relationshipTitle];
    const newField = { [sideInfo.self.field]: id, [sideInfo.other.field]: childId };
    if (relationshipBlock.relationship.$extras) {
      Object.keys(relationshipBlock.relationship.$extras).forEach((extra) => {
        newField[extra] = extras[extra];
      });
    }
    return this[$axios].put(`/${type.$name}/${id}/${relationshipTitle}`, newField)
    .then(() => this.notifyUpdate(type, id, null, relationshipTitle));
  }

  remove(t, id, relationshipTitle, childId) {
    return this[$axios].delete(`/${t.$name}/${id}/${relationshipTitle}/${childId}`)
    .then(() => this.notifyUpdate(t, id, null, relationshipTitle));
  }

  modifyRelationship(t, id, relationshipTitle, childId, extras) {
    return this[$axios].patch(`/${t.$name}/${id}/${relationshipTitle}/${childId}`, extras)
    .then(() => this.notifyUpdate(t, id, null, relationshipTitle));
  }

  delete(t, id) {
    return this[$axios].delete(`/${t.$name}/${id}`)
    .then((response) => {
      return response.data;
    });
  }

  query(q) {
    return this[$axios].get(`/${q.type}`, { params: q.query })
    .then((response) => {
      return response.data;
    });
  }
}
