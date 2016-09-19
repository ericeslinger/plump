import { MemoryStorage } from '../storage/memory';
import * as axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

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
  const mock = new MockAdapter(mockedAxios);
  mock.onGet(new RegExp(`\/${t.$name}\/d+`)).reply((data) => {
    console.log('GET');
    console.log(data);
    const id = parseInt(data.config.url.substring(0, t.$name.length + 2), 10);
    return getVal(t, id);
  });
  mock.onPost(`/${t.$name}`).reply((data) => {
    console.log('POST');
    console.log(data);
    return setVal(t, data.data);
  });
  mock.onPut(new RegExp(`\/${t.$name}\/d+`)).reply((data) => {
    console.log('PUT');
    console.log(data);
    return setVal(t, data.data);
  });
  return mockedAxios;
}

const axiosMock = {
  mockup,
};

export default axiosMock;
