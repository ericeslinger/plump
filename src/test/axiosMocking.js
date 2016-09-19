import { MemoryStorage } from '../storage/memory';
import * as axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Promise from 'bluebird';

const backingStore = new MemoryStorage({terminal: true});


function setVal(t, v) {
  return backingStore.write(t, v)
  .then((r) => {
    if (r) {
      return [200, r];
    } else {
      return [404, {}];
    }
  });
}

function getVal(t, id) {
  return backingStore.read(t, id)
  .then((r) => [200, r]);
}

function mockup(t) {
  const mockedAxios = axios.create({baseURL: ''});
  mockedAxios.defaults.adapter = (config) => {
    return Promise.resolve().then(() => {
      console.log(config);
      if (config.method === 'get') {
        const id = parseInt(config.url.substring(0, t.$name.length + 2), 10);
        return getVal(t, id);
      } else if (config.method === 'post') {
        return setVal(t, config.data);
      } else if (config.method === 'put') {
        const id = parseInt(config.url.substring(0, t.$name.length + 2), 10);
        return setVal(t, Object.assign({}, config.data, {[t.$id]: id}));
      } else {
        return Promise.reject(new Error('ILLEGAL DATA'));
      }
    });
  };
  return mockedAxios;
}

const axiosMock = {
  mockup,
};

export default axiosMock;
