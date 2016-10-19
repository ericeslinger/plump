import { MemoryStorage } from '../storage/memory';
import * as axios from 'axios';
import Promise from 'bluebird';

const backingStore = new MemoryStorage({ terminal: true });

function mockup(t) {
  const mockedAxios = axios.create({ baseURL: '' });
  mockedAxios.defaults.adapter = (config) => {
    let apiWrap = true; // should we wrap in standard JSON API at the bottom
    return Promise.resolve().then(() => {
      const matchBase = config.url.match(new RegExp(`^/${t.$name}$`));
      const matchItem = config.url.match(new RegExp(`^/${t.$name}/(\\d+)$`));
      const matchSideBase = config.url.match(new RegExp(`^/${t.$name}/(\\d+)/(\\w+)$`));
      const matchSideItem = config.url.match(new RegExp(`^/${t.$name}/(\\d+)/(\\w+)/(\\d+)$`));


      if (config.method === 'get') {
        if (matchBase) {
          return backingStore.query();
        } else if (matchItem) {
          return backingStore.read(t, parseInt(matchItem[1], 10));
        } else if (matchSideBase) {
          apiWrap = false;
          return backingStore.read(t, parseInt(matchSideBase[1], 10), matchSideBase[2]);
        }
      } else if (config.method === 'post') {
        if (matchBase) {
          return backingStore.write(t, JSON.parse(config.data));
        }
      } else if (config.method === 'patch') {
        if (matchItem) {
          return backingStore.write(
            t,
            Object.assign(
              {},
              JSON.parse(config.data),
              { [t.$id]: parseInt(matchItem[1], 10) }
            )
          );
        } else if (matchSideItem) {
          return backingStore.modifyRelationship(
            t,
            parseInt(matchSideItem[1], 10),
            matchSideItem[2],
            parseInt(matchSideItem[3], 10),
            JSON.parse(config.data)
          );
        }
      } else if (config.method === 'put') {
        if (matchSideBase) {
          apiWrap = false;
          const Rel = t.$fields[matchSideBase[2]];
          const selfFieldName = Rel.field;
          const otherFieldName = Rel.relationship.otherField(selfFieldName);
          return backingStore.add(
            t,
            parseInt(matchSideBase[1], 10),
            matchSideBase[2],
            JSON.parse(config.data)[otherFieldName],
            JSON.parse(config.data)
          );
        }
      } else if (config.method === 'delete') {
        if (matchItem) {
          return backingStore.delete(t, parseInt(matchItem[1], 10));
        } else if (matchSideItem) {
          apiWrap = false;
          return backingStore.remove(
            t,
            parseInt(matchSideItem[1], 10),
            matchSideItem[2],
            parseInt(matchSideItem[3], 10)
          );
        }
      }
      return Promise.reject(new Error(404));
    }).then((d) => {
      // console.log('FOR');
      // console.log(config);
      // console.log(`RESOLVING ${JSON.stringify(d)}`);
      if (d) {
        if (apiWrap) {
          return {
            data: {
              [t.$name]: [d],
            },
          };
        } else {
          return {
            data: d,
          };
        }
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
