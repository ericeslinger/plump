'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _memory = require('../storage/memory');

var _axios = require('axios');

var axios = _interopRequireWildcard(_axios);

var _axiosMockAdapter = require('axios-mock-adapter');

var _axiosMockAdapter2 = _interopRequireDefault(_axiosMockAdapter);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var backingStore = new _memory.MemoryStorage({ terminal: true });

function setVal(t, v) {
  return backingStore.write(t, v).then(function (r) {
    if (r) {
      return [200, r];
    } else {
      return [404, {}];
    }
  });
}

function getVal(t, id) {
  return backingStore.read(t, id).then(function (r) {
    return [200, r];
  });
}

function mockup(t) {
  var mockedAxios = axios.create({ baseURL: '' });
  mockedAxios.defaults.adapter = function (config) {
    return _bluebird2.default.resolve().then(function () {
      console.log(config);
      if (config.method === 'get') {
        var id = parseInt(config.url.substring(0, t.$name.length + 2), 10);
        return getVal(t, id);
      } else if (config.method === 'post') {
        return setVal(t, config.data);
      } else if (config.method === 'put') {
        var _id = parseInt(config.url.substring(0, t.$name.length + 2), 10);
        return setVal(t, Object.assign({}, config.data, _defineProperty({}, t.$id, _id)));
      } else {
        return _bluebird2.default.reject(new Error('ILLEGAL DATA'));
      }
    });
  };
  return mockedAxios;
}

var axiosMock = {
  mockup: mockup
};

exports.default = axiosMock;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvYXhpb3NNb2NraW5nLmpzIl0sIm5hbWVzIjpbImF4aW9zIiwiYmFja2luZ1N0b3JlIiwidGVybWluYWwiLCJzZXRWYWwiLCJ0IiwidiIsIndyaXRlIiwidGhlbiIsInIiLCJnZXRWYWwiLCJpZCIsInJlYWQiLCJtb2NrdXAiLCJtb2NrZWRBeGlvcyIsImNyZWF0ZSIsImJhc2VVUkwiLCJkZWZhdWx0cyIsImFkYXB0ZXIiLCJjb25maWciLCJyZXNvbHZlIiwiY29uc29sZSIsImxvZyIsIm1ldGhvZCIsInBhcnNlSW50IiwidXJsIiwic3Vic3RyaW5nIiwiJG5hbWUiLCJsZW5ndGgiLCJkYXRhIiwiT2JqZWN0IiwiYXNzaWduIiwiJGlkIiwicmVqZWN0IiwiRXJyb3IiLCJheGlvc01vY2siXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOztBQUNBOztJQUFZQSxLOztBQUNaOzs7O0FBQ0E7Ozs7Ozs7Ozs7QUFFQSxJQUFNQyxlQUFlLDBCQUFrQixFQUFDQyxVQUFVLElBQVgsRUFBbEIsQ0FBckI7O0FBR0EsU0FBU0MsTUFBVCxDQUFnQkMsQ0FBaEIsRUFBbUJDLENBQW5CLEVBQXNCO0FBQ3BCLFNBQU9KLGFBQWFLLEtBQWIsQ0FBbUJGLENBQW5CLEVBQXNCQyxDQUF0QixFQUNORSxJQURNLENBQ0QsVUFBQ0MsQ0FBRCxFQUFPO0FBQ1gsUUFBSUEsQ0FBSixFQUFPO0FBQ0wsYUFBTyxDQUFDLEdBQUQsRUFBTUEsQ0FBTixDQUFQO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsYUFBTyxDQUFDLEdBQUQsRUFBTSxFQUFOLENBQVA7QUFDRDtBQUNGLEdBUE0sQ0FBUDtBQVFEOztBQUVELFNBQVNDLE1BQVQsQ0FBZ0JMLENBQWhCLEVBQW1CTSxFQUFuQixFQUF1QjtBQUNyQixTQUFPVCxhQUFhVSxJQUFiLENBQWtCUCxDQUFsQixFQUFxQk0sRUFBckIsRUFDTkgsSUFETSxDQUNELFVBQUNDLENBQUQ7QUFBQSxXQUFPLENBQUMsR0FBRCxFQUFNQSxDQUFOLENBQVA7QUFBQSxHQURDLENBQVA7QUFFRDs7QUFFRCxTQUFTSSxNQUFULENBQWdCUixDQUFoQixFQUFtQjtBQUNqQixNQUFNUyxjQUFjYixNQUFNYyxNQUFOLENBQWEsRUFBQ0MsU0FBUyxFQUFWLEVBQWIsQ0FBcEI7QUFDQUYsY0FBWUcsUUFBWixDQUFxQkMsT0FBckIsR0FBK0IsVUFBQ0MsTUFBRCxFQUFZO0FBQ3pDLFdBQU8sbUJBQVFDLE9BQVIsR0FBa0JaLElBQWxCLENBQXVCLFlBQU07QUFDbENhLGNBQVFDLEdBQVIsQ0FBWUgsTUFBWjtBQUNBLFVBQUlBLE9BQU9JLE1BQVAsS0FBa0IsS0FBdEIsRUFBNkI7QUFDM0IsWUFBTVosS0FBS2EsU0FBU0wsT0FBT00sR0FBUCxDQUFXQyxTQUFYLENBQXFCLENBQXJCLEVBQXdCckIsRUFBRXNCLEtBQUYsQ0FBUUMsTUFBUixHQUFpQixDQUF6QyxDQUFULEVBQXNELEVBQXRELENBQVg7QUFDQSxlQUFPbEIsT0FBT0wsQ0FBUCxFQUFVTSxFQUFWLENBQVA7QUFDRCxPQUhELE1BR08sSUFBSVEsT0FBT0ksTUFBUCxLQUFrQixNQUF0QixFQUE4QjtBQUNuQyxlQUFPbkIsT0FBT0MsQ0FBUCxFQUFVYyxPQUFPVSxJQUFqQixDQUFQO0FBQ0QsT0FGTSxNQUVBLElBQUlWLE9BQU9JLE1BQVAsS0FBa0IsS0FBdEIsRUFBNkI7QUFDbEMsWUFBTVosTUFBS2EsU0FBU0wsT0FBT00sR0FBUCxDQUFXQyxTQUFYLENBQXFCLENBQXJCLEVBQXdCckIsRUFBRXNCLEtBQUYsQ0FBUUMsTUFBUixHQUFpQixDQUF6QyxDQUFULEVBQXNELEVBQXRELENBQVg7QUFDQSxlQUFPeEIsT0FBT0MsQ0FBUCxFQUFVeUIsT0FBT0MsTUFBUCxDQUFjLEVBQWQsRUFBa0JaLE9BQU9VLElBQXpCLHNCQUFpQ3hCLEVBQUUyQixHQUFuQyxFQUF5Q3JCLEdBQXpDLEVBQVYsQ0FBUDtBQUNELE9BSE0sTUFHQTtBQUNMLGVBQU8sbUJBQVFzQixNQUFSLENBQWUsSUFBSUMsS0FBSixDQUFVLGNBQVYsQ0FBZixDQUFQO0FBQ0Q7QUFDRixLQWJNLENBQVA7QUFjRCxHQWZEO0FBZ0JBLFNBQU9wQixXQUFQO0FBQ0Q7O0FBRUQsSUFBTXFCLFlBQVk7QUFDaEJ0QjtBQURnQixDQUFsQjs7a0JBSWVzQixTIiwiZmlsZSI6InRlc3QvYXhpb3NNb2NraW5nLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWVtb3J5U3RvcmFnZSB9IGZyb20gJy4uL3N0b3JhZ2UvbWVtb3J5JztcbmltcG9ydCAqIGFzIGF4aW9zIGZyb20gJ2F4aW9zJztcbmltcG9ydCBNb2NrQWRhcHRlciBmcm9tICdheGlvcy1tb2NrLWFkYXB0ZXInO1xuaW1wb3J0IFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuXG5jb25zdCBiYWNraW5nU3RvcmUgPSBuZXcgTWVtb3J5U3RvcmFnZSh7dGVybWluYWw6IHRydWV9KTtcblxuXG5mdW5jdGlvbiBzZXRWYWwodCwgdikge1xuICByZXR1cm4gYmFja2luZ1N0b3JlLndyaXRlKHQsIHYpXG4gIC50aGVuKChyKSA9PiB7XG4gICAgaWYgKHIpIHtcbiAgICAgIHJldHVybiBbMjAwLCByXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFs0MDQsIHt9XTtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRWYWwodCwgaWQpIHtcbiAgcmV0dXJuIGJhY2tpbmdTdG9yZS5yZWFkKHQsIGlkKVxuICAudGhlbigocikgPT4gWzIwMCwgcl0pO1xufVxuXG5mdW5jdGlvbiBtb2NrdXAodCkge1xuICBjb25zdCBtb2NrZWRBeGlvcyA9IGF4aW9zLmNyZWF0ZSh7YmFzZVVSTDogJyd9KTtcbiAgbW9ja2VkQXhpb3MuZGVmYXVsdHMuYWRhcHRlciA9IChjb25maWcpID0+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhjb25maWcpO1xuICAgICAgaWYgKGNvbmZpZy5tZXRob2QgPT09ICdnZXQnKSB7XG4gICAgICAgIGNvbnN0IGlkID0gcGFyc2VJbnQoY29uZmlnLnVybC5zdWJzdHJpbmcoMCwgdC4kbmFtZS5sZW5ndGggKyAyKSwgMTApO1xuICAgICAgICByZXR1cm4gZ2V0VmFsKHQsIGlkKTtcbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLm1ldGhvZCA9PT0gJ3Bvc3QnKSB7XG4gICAgICAgIHJldHVybiBzZXRWYWwodCwgY29uZmlnLmRhdGEpO1xuICAgICAgfSBlbHNlIGlmIChjb25maWcubWV0aG9kID09PSAncHV0Jykge1xuICAgICAgICBjb25zdCBpZCA9IHBhcnNlSW50KGNvbmZpZy51cmwuc3Vic3RyaW5nKDAsIHQuJG5hbWUubGVuZ3RoICsgMiksIDEwKTtcbiAgICAgICAgcmV0dXJuIHNldFZhbCh0LCBPYmplY3QuYXNzaWduKHt9LCBjb25maWcuZGF0YSwge1t0LiRpZF06IGlkfSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignSUxMRUdBTCBEQVRBJykpO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuICByZXR1cm4gbW9ja2VkQXhpb3M7XG59XG5cbmNvbnN0IGF4aW9zTW9jayA9IHtcbiAgbW9ja3VwLFxufTtcblxuZXhwb3J0IGRlZmF1bHQgYXhpb3NNb2NrO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
