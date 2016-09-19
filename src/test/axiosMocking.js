import { MemoryStorage } from '../storage/memory';
import * as axios from 'axios';
import Promise from 'bluebird';

const backingStore = new MemoryStorage({terminal: true});


function setVal(t, v) {
  return backingStore.write(t, v)
  .then((r) => {
    if (r) {
      return {
        status: 200,
        data: r,
      };
    } else {
      return {
        status: 404,
      };
    }
  });
}

function getVal(t, id) {
  return backingStore.read(t, id)
  .then((r) => {
    if (r) {
      return {
        status: 200,
        data: r,
      };
    } else {
      return {
        status: 404,
      };
    }
  });
}

function mockup(t) {
  const mockedAxios = axios.create({baseURL: ''});
  mockedAxios.defaults.adapter = (config) => {
    return Promise.resolve().then(() => {
      if (config.method === 'get') {
        const id = parseInt(config.url.substring(t.$name.length + 2), 10);
        return backingStore.read(t, id);
      } else if (config.method === 'post') {
        return backingStore.write(t, JSON.parse(config.data));
      } else if (config.method === 'put') {
        const id = parseInt(config.url.substring(t.$name.length + 2), 10);
        return backingStore.write(t, Object.assign({}, JSON.parse(config.data), {[t.$id]: id}));
      } else if (config.method === 'delete') {
        const id = parseInt(config.url.substring(t.$name.length + 2), 10);
        return backingStore.delete(t, id);
      } else {
        return Promise.reject(new Error('ILLEGAL DATA'));
      }
    }).then((d) => {
      // console.log('FOR');
      // console.log(config);
      // console.log(`RESOLVING ${JSON.stringify(d)}`);
      if (d) {
        return {
          data: {
            [t.$name]: [d],
          },
        };
      } else {
        return Promise.reject(404);
      }
    });
  };
  return mockedAxios;
}

const axiosMock = {
  mockup,
};

export default axiosMock;
