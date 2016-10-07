'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RestStorage = undefined;

var _axios = require('axios');

var axios = _interopRequireWildcard(_axios);

var _storage = require('./storage');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

const $axios = Symbol('$axios');
class RestStorage extends _storage.Storage {

  constructor(opts = {}) {
    super(opts);
    const options = Object.assign({}, {
      baseURL: 'http://localhost/api'
    }, opts);
    this[$axios] = options.axios || axios.create(options);
  }

  onCacheableRead() {}

  write(t, v) {
    return _bluebird2.default.resolve().then(() => {
      if (v[t.$id]) {
        return this[$axios].patch(`/${ t.$name }/${ v[t.$id] }`, v);
      } else {
        if (this.terminal) {
          return this[$axios].post(`/${ t.$name }`, v);
        } else {
          throw new Error('Cannot create new content in a non-terminal store');
        }
      }
    }).then(d => d.data[t.$name][0]);
  }

  read(t, id) {
    return this[$axios].get(`/${ t.$name }/${ id }`).then(response => {
      console.log('AXIOS RESPONSE');
      console.log(JSON.stringify(response));
      return response.data[t.$name][0];
    }).catch(err => {
      if (err === 404) {
        return null;
      } else {
        throw err;
      }
    });

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

  has(t, id, relationship) {
    return this[$axios].get(`/${ t.$name }/${ id }/${ relationship }`).then(response => response.data);
  }

  add(t, id, relationship, childId) {
    return this[$axios].put(`/${ t.$name }/${ id }/${ relationship }`, childId);
  }

  remove(t, id, relationship, childId) {
    return this[$axios].delete(`/${ t.$name }/${ id }/${ relationship }/${ childId }`);
  }

  delete(t, id) {
    return this[$axios].delete(`/${ t.$name }/${ id }`).then(response => {
      return response.data;
    });
  }

  query(q) {
    return this[$axios].get(`/${ q.type }`, { params: q.query }).then(response => {
      return response.data;
    });
  }
}
exports.RestStorage = RestStorage;
//# sourceMappingURL=data:application/json;base64,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RUFBYztBQUNaLFdBQU8sS0FBSyxNQUFMLEVBQWEsTUFBYixDQUFxQixLQUFHLEVBQUUsS0FBTSxNQUFHLEVBQUcsR0FBdEMsRUFDTixJQURNLENBQ0EsUUFBRCxJQUFjO0FBQ2xCLGFBQU8sU0FBUyxJQUFoQjtBQUNELEtBSE0sQ0FBUDtBQUlEOztBQUVELFFBQU0sQ0FBTixFQUFTO0FBQ1AsV0FBTyxLQUFLLE1BQUwsRUFBYSxHQUFiLENBQWtCLEtBQUcsRUFBRSxJQUFLLEdBQTVCLEVBQStCLEVBQUMsUUFBUSxFQUFFLEtBQVgsRUFBL0IsRUFDTixJQURNLENBQ0EsUUFBRCxJQUFjO0FBQ2xCLGFBQU8sU0FBUyxJQUFoQjtBQUNELEtBSE0sQ0FBUDtBQUlEO0FBekZzQztRQUE1QixXLEdBQUEsVyIsImZpbGUiOiJzdG9yYWdlL3Jlc3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBheGlvcyBmcm9tICdheGlvcyc7XG5pbXBvcnQge1N0b3JhZ2V9IGZyb20gJy4vc3RvcmFnZSc7XG5cbmNvbnN0ICRheGlvcyA9IFN5bWJvbCgnJGF4aW9zJyk7XG5pbXBvcnQgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5cbmV4cG9ydCBjbGFzcyBSZXN0U3RvcmFnZSBleHRlbmRzIFN0b3JhZ2Uge1xuXG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIHN1cGVyKG9wdHMpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIGJhc2VVUkw6ICdodHRwOi8vbG9jYWxob3N0L2FwaScsXG4gICAgICB9LFxuICAgICAgb3B0c1xuICAgICk7XG4gICAgdGhpc1skYXhpb3NdID0gb3B0aW9ucy5heGlvcyB8fCBheGlvcy5jcmVhdGUob3B0aW9ucyk7XG4gIH1cblxuICBvbkNhY2hlYWJsZVJlYWQoKSB7fVxuXG4gIHdyaXRlKHQsIHYpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBpZiAodlt0LiRpZF0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5wYXRjaChgLyR7dC4kbmFtZX0vJHt2W3QuJGlkXX1gLCB2KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5wb3N0KGAvJHt0LiRuYW1lfWAsIHYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBuZXcgY29udGVudCBpbiBhIG5vbi10ZXJtaW5hbCBzdG9yZScpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkudGhlbigoZCkgPT4gZC5kYXRhW3QuJG5hbWVdWzBdKTtcbiAgfVxuXG4gIHJlYWQodCwgaWQpIHtcbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLmdldChgLyR7dC4kbmFtZX0vJHtpZH1gKVxuICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ0FYSU9TIFJFU1BPTlNFJyk7XG4gICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShyZXNwb25zZSkpO1xuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGFbdC4kbmFtZV1bMF07XG4gICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgaWYgKGVyciA9PT0gNDA0KSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogY2FjaGVhYmxlIHJlYWRcbiAgICAvLyB7XG4gICAgLy8gICBjb25zdCByZXRWYWwgPSB7XG4gICAgLy8gICAgIG1haW46ICxcbiAgICAvLyAgICAgZXh0cmE6IFtdLFxuICAgIC8vICAgfTtcbiAgICAvLyAgIE9iamVjdC5rZXlzKHJlc3BvbnNlLmRhdGEpLmZvckVhY2goKHR5cGVOYW1lKSA9PiB7XG4gICAgLy8gICAgIHJldFZhbC5leHRyYS5jb25jYXQocmVzcG9uc2UuZGF0YVt0eXBlTmFtZV0ubWFwKChkKSA9PiB7XG4gICAgLy8gICAgICAgaWYgKChkW3QuJGlkXSA9PT0gaWQpICYmICh0eXBlTmFtZSA9PT0gdC4kbmFtZSkpIHtcbiAgICAvLyAgICAgICAgIHJldHVybiBudWxsO1xuICAgIC8vICAgICAgIH0gZWxzZSB7XG4gICAgLy8gICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwge3R5cGVOYW1lfSwgZCk7XG4gICAgLy8gICAgICAgfVxuICAgIC8vICAgICB9KS5maWx0ZXIoKHYpID0+IHYgIT09IG51bGwpKTtcbiAgICAvLyAgIH0pO1xuICAgIC8vICAgcmV0dXJuIHJldFZhbDtcbiAgICAvLyB9KTtcbiAgfVxuXG4gIGhhcyh0LCBpZCwgcmVsYXRpb25zaGlwKSB7XG4gICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5nZXQoYC8ke3QuJG5hbWV9LyR7aWR9LyR7cmVsYXRpb25zaGlwfWApXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiByZXNwb25zZS5kYXRhKTtcbiAgfVxuXG4gIGFkZCh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKSB7XG4gICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5wdXQoYC8ke3QuJG5hbWV9LyR7aWR9LyR7cmVsYXRpb25zaGlwfWAsIGNoaWxkSWQpO1xuICB9XG5cbiAgcmVtb3ZlKHQsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQpIHtcbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLmRlbGV0ZShgLyR7dC4kbmFtZX0vJHtpZH0vJHtyZWxhdGlvbnNoaXB9LyR7Y2hpbGRJZH1gKTtcbiAgfVxuXG4gIGRlbGV0ZSh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzWyRheGlvc10uZGVsZXRlKGAvJHt0LiRuYW1lfS8ke2lkfWApXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICB9KTtcbiAgfVxuXG4gIHF1ZXJ5KHEpIHtcbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLmdldChgLyR7cS50eXBlfWAsIHtwYXJhbXM6IHEucXVlcnl9KVxuICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgfSk7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
