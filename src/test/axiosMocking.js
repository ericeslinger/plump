import { MemoryStorage } from '../storage/memory';
import { TestType } from './testType';
import { Plump } from '../plump';
import * as axios from 'axios';
import Promise from 'bluebird';
import mergeOptions from 'merge-options';

// STUB
MemoryStorage.prototype.bulkRead = function bulkRead(root, opts) { // eslint-disable-line no-unused-vars
  return Promise.all(
    Object.keys(TestType.$include)
    .map(relationship => {
      return this.read(TestType, root.$id, relationship);
    })
  ).then(valueArray => {
    return valueArray.reduce((acc, curr) => mergeOptions(acc, curr), {});
  });
};

const backingStore = new MemoryStorage({ terminal: true });
backingStore.terminal = true;

function mockup(T) {
  const plump = new Plump({ storage: [backingStore], types: [T] });
  const mockedAxios = axios.create({ baseURL: '' });
  mockedAxios.defaults.adapter = (config) => {
    return Promise.resolve().then(() => {
      const matchBase = config.url.match(new RegExp(`^/${T.$name}$`));
      const matchItem = config.url.match(new RegExp(`^/${T.$name}/(\\d+)$`));
      const matchSideBase = config.url.match(new RegExp(`^/${T.$name}/(\\d+)/(\\w+)$`));
      const matchSideItem = config.url.match(new RegExp(`^/${T.$name}/(\\d+)/(\\w+)/(\\d+)$`));


      if (config.method === 'get') {
        if (matchBase) {
          return backingStore.query();
        } else if (matchItem) {
          return plump.get(T, parseInt(matchItem[1], 10));
        } else if (matchSideBase) {
          return plump.get(T, parseInt(matchSideBase[1], 10), matchSideBase[2]);
        }
      } else if (config.method === 'post') {
        if (matchBase) {
          return plump.save(T, JSON.parse(config.data));
        }
      } else if (config.method === 'patch') {
        if (matchItem) {
          return plump.save(
            T,
            Object.assign(
              {},
              JSON.parse(config.data),
              { [T.$id]: parseInt(matchItem[1], 10) }
            )
          );
        } else if (matchSideItem) {
          return plump.modifyRelationship(
            T,
            parseInt(matchSideItem[1], 10),
            matchSideItem[2],
            parseInt(matchSideItem[3], 10),
            JSON.parse(config.data)
          );
        }
      } else if (config.method === 'put') {
        if (matchSideBase) {
          const relationshipBlock = T.$fields[matchSideBase[2]];
          const sideInfo = relationshipBlock.relationship.$sides[matchSideBase[2]];
          return plump.add(
            T,
            parseInt(matchSideBase[1], 10),
            matchSideBase[2],
            JSON.parse(config.data)[sideInfo.other.field],
            JSON.parse(config.data)
          );
        }
      } else if (config.method === 'delete') {
        if (matchItem) {
          return plump.delete(T, parseInt(matchItem[1], 10));
        } else if (matchSideItem) {
          return plump.remove(
            T,
            parseInt(matchSideItem[1], 10),
            matchSideItem[2],
            parseInt(matchSideItem[3], 10)
          );
        }
      }
      return Promise.reject({ response: { status: 400 } });
    }).then((d) => {
      // console.log('FOR');
      // console.log(config);
      // console.log(`RESOLVING ${JSON.stringify(d, null, 2)}`);
      if (d) {
        return {
          data: d[T.$id]
            ? plump.forge(T, d).$package()
            : { response: { status: 200 } },
        };
      } else {
        return Promise.reject({ response: { status: 404 } });
      }
    });
  };
  return mockedAxios;
}

const axiosMock = {
  mockup,
};

export default axiosMock;
