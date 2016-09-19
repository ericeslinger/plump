'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _memory = require('../storage/memory');

var _axios = require('axios');

var axios = _interopRequireWildcard(_axios);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var backingStore = new _memory.MemoryStorage({ terminal: true });

function setVal(t, v) {
  return backingStore.write(t, v).then(function (r) {
    if (r) {
      return {
        status: 200,
        data: r
      };
    } else {
      return {
        status: 404
      };
    }
  });
}

function getVal(t, id) {
  return backingStore.read(t, id).then(function (r) {
    if (r) {
      return {
        status: 200,
        data: r
      };
    } else {
      return {
        status: 404
      };
    }
  });
}

function mockup(t) {
  var mockedAxios = axios.create({ baseURL: '' });
  mockedAxios.defaults.adapter = function (config) {
    return _bluebird2.default.resolve().then(function () {
      if (config.method === 'get') {
        var id = parseInt(config.url.substring(t.$name.length + 2), 10);
        return backingStore.read(t, id);
      } else if (config.method === 'post') {
        return backingStore.write(t, JSON.parse(config.data));
      } else if (config.method === 'put') {
        var _id = parseInt(config.url.substring(t.$name.length + 2), 10);
        return backingStore.write(t, Object.assign({}, JSON.parse(config.data), _defineProperty({}, t.$id, _id)));
      } else if (config.method === 'delete') {
        var _id2 = parseInt(config.url.substring(t.$name.length + 2), 10);
        return backingStore.delete(t, _id2);
      } else {
        return _bluebird2.default.reject(new Error('ILLEGAL DATA'));
      }
    }).then(function (d) {
      // console.log('FOR');
      // console.log(config);
      // console.log(`RESOLVING ${JSON.stringify(d)}`);
      if (d) {
        return {
          data: _defineProperty({}, t.$name, [d])
        };
      } else {
        return _bluebird2.default.reject(404);
      }
    });
  };
  return mockedAxios;
}

var axiosMock = {
  mockup: mockup
};

exports.default = axiosMock;
//# sourceMappingURL=data:application/json;base64,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QUosRUFBTztBQUNMLGVBQU87QUFDTCxvQ0FDRyxFQUFFLEtBREwsRUFDYSxDQUFDLENBQUQsQ0FEYjtBQURLLFNBQVA7QUFLRCxPQU5ELE1BTU87QUFDTCxlQUFPLG1CQUFRLE1BQVIsQ0FBZSxHQUFmLENBQVA7QUFDRDtBQUNGLEtBNUJNLENBQVA7QUE2QkQsR0E5QkQ7QUErQkEsU0FBTyxXQUFQO0FBQ0Q7O0FBRUQsSUFBTSxZQUFZO0FBQ2hCO0FBRGdCLENBQWxCOztrQkFJZSxTIiwiZmlsZSI6InRlc3QvYXhpb3NNb2NraW5nLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWVtb3J5U3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2UvbWVtb3J5JztcbmltcG9ydCAqIGFzIGF4aW9zIGZyb20gJ2F4aW9zJztcbmltcG9ydCBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcblxuY29uc3QgYmFja2luZ1N0b3JlID0gbmV3IE1lbW9yeVN0b3JhZ2Uoe3Rlcm1pbmFsOiB0cnVlfSk7XG5cblxuZnVuY3Rpb24gc2V0VmFsKHQsIHYpIHtcbiAgcmV0dXJuIGJhY2tpbmdTdG9yZS53cml0ZSh0LCB2KVxuICAudGhlbigocikgPT4ge1xuICAgIGlmIChyKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0dXM6IDIwMCxcbiAgICAgICAgZGF0YTogcixcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0YXR1czogNDA0LFxuICAgICAgfTtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRWYWwodCwgaWQpIHtcbiAgcmV0dXJuIGJhY2tpbmdTdG9yZS5yZWFkKHQsIGlkKVxuICAudGhlbigocikgPT4ge1xuICAgIGlmIChyKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0dXM6IDIwMCxcbiAgICAgICAgZGF0YTogcixcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0YXR1czogNDA0LFxuICAgICAgfTtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBtb2NrdXAodCkge1xuICBjb25zdCBtb2NrZWRBeGlvcyA9IGF4aW9zLmNyZWF0ZSh7YmFzZVVSTDogJyd9KTtcbiAgbW9ja2VkQXhpb3MuZGVmYXVsdHMuYWRhcHRlciA9IChjb25maWcpID0+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICBpZiAoY29uZmlnLm1ldGhvZCA9PT0gJ2dldCcpIHtcbiAgICAgICAgY29uc3QgaWQgPSBwYXJzZUludChjb25maWcudXJsLnN1YnN0cmluZyh0LiRuYW1lLmxlbmd0aCArIDIpLCAxMCk7XG4gICAgICAgIHJldHVybiBiYWNraW5nU3RvcmUucmVhZCh0LCBpZCk7XG4gICAgICB9IGVsc2UgaWYgKGNvbmZpZy5tZXRob2QgPT09ICdwb3N0Jykge1xuICAgICAgICByZXR1cm4gYmFja2luZ1N0b3JlLndyaXRlKHQsIEpTT04ucGFyc2UoY29uZmlnLmRhdGEpKTtcbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLm1ldGhvZCA9PT0gJ3B1dCcpIHtcbiAgICAgICAgY29uc3QgaWQgPSBwYXJzZUludChjb25maWcudXJsLnN1YnN0cmluZyh0LiRuYW1lLmxlbmd0aCArIDIpLCAxMCk7XG4gICAgICAgIHJldHVybiBiYWNraW5nU3RvcmUud3JpdGUodCwgT2JqZWN0LmFzc2lnbih7fSwgSlNPTi5wYXJzZShjb25maWcuZGF0YSksIHtbdC4kaWRdOiBpZH0pKTtcbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLm1ldGhvZCA9PT0gJ2RlbGV0ZScpIHtcbiAgICAgICAgY29uc3QgaWQgPSBwYXJzZUludChjb25maWcudXJsLnN1YnN0cmluZyh0LiRuYW1lLmxlbmd0aCArIDIpLCAxMCk7XG4gICAgICAgIHJldHVybiBiYWNraW5nU3RvcmUuZGVsZXRlKHQsIGlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0lMTEVHQUwgREFUQScpKTtcbiAgICAgIH1cbiAgICB9KS50aGVuKChkKSA9PiB7XG4gICAgICAvLyBjb25zb2xlLmxvZygnRk9SJyk7XG4gICAgICAvLyBjb25zb2xlLmxvZyhjb25maWcpO1xuICAgICAgLy8gY29uc29sZS5sb2coYFJFU09MVklORyAke0pTT04uc3RyaW5naWZ5KGQpfWApO1xuICAgICAgaWYgKGQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBbdC4kbmFtZV06IFtkXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KDQwNCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG4gIHJldHVybiBtb2NrZWRBeGlvcztcbn1cblxuY29uc3QgYXhpb3NNb2NrID0ge1xuICBtb2NrdXAsXG59O1xuXG5leHBvcnQgZGVmYXVsdCBheGlvc01vY2s7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
