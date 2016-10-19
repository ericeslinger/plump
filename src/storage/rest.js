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

  onCacheableRead() {}

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
    }).then((d) => d.data[t.$name][0]);
  }

  readOne(t, id) {
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
  }

  readMany(t, id, relationship) {
    return this[$axios].get(`/${t.$name}/${id}/${relationship}`)
    .then((response) => response.data);
  }

  add(t, id, relationshipTitle, childId, extras) {
    const Rel = t.$fields[relationshipTitle];
    const selfFieldName = Rel.field;
    const otherFieldName = Rel.relationship.otherField(selfFieldName);
    const newField = { [selfFieldName]: id, [otherFieldName]: childId };
    (Rel.relationship.$extras || []).forEach((e) => {
      newField[e] = extras[e];
    });
    return this[$axios].put(`/${t.$name}/${id}/${relationshipTitle}`, newField);
  }

  remove(t, id, relationship, childId) {
    return this[$axios].delete(`/${t.$name}/${id}/${relationship}/${childId}`);
  }

  modifyRelationship(t, id, relationship, childId, extras) {
    return this[$axios].patch(`/${t.$name}/${id}/${relationship}/${childId}`, extras);
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
