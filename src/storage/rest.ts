import {StorageService} from './storageService';
import {Dictionary, Storable} from './storable';
import * as Promise from 'bluebird';
import {AxiosInstance, InstanceOptions} from 'axios';
import * as axios from 'axios';

export class RestStorage implements StorageService {

  private _axios;

  constructor(opts: InstanceOptions = {}) {
    const options = Object.assign(
      {},
      {
        baseURL: 'http://localhost/api',
      },
      opts
    );
    this._axios = axios.create(options);
  }

  public create(t: string, v: Dictionary) {
    return this._axios.post(`/${t}`, v);
  }

  public read(t: string, id: number) {
    return this._axios.get(`/${t}/${id}`)
    .then((response) => {
      return response.data;
    });
  }

  public update(t: string, id: number, v: Storable) {
    return this._axios.put(`/${t}/${id}`, v)
    .then((response) => {
      return response.data;
    });
  }

  public delete(t: string, id: number) {
    return this._axios.delete(`/${t}/${id}`)
    .then((response) => {
      return response.data;
    });
  }

  public query(q: {type: string, query: any}) {
    return this._axios.get(`/${q.type}`, {params: q.query})
    .then((response) => {
      return response.data;
    });
  }

  public name: 'RestStorage';

}
