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

function mockup(t) {
  var mockedAxios = axios.create({ baseURL: '' });
  mockedAxios.defaults.adapter = function (config) {
    var apiWrap = true; // should we wrap in standard JSON API at the bottom
    return _bluebird2.default.resolve().then(function () {
      var matchBase = config.url.match(new RegExp('^/' + t.$name + '$'));
      var matchItem = config.url.match(new RegExp('^/' + t.$name + '/(\\d+)$'));
      var matchSideBase = config.url.match(new RegExp('^/' + t.$name + '/(\\d+)/(\\w+)$'));
      var matchSideItem = config.url.match(new RegExp('^/' + t.$name + '/(\\d+)/(\\w+)/(\\d+)$'));

      if (config.method === 'get') {
        if (matchBase) {
          return backingStore.query();
        } else if (matchItem) {
          return backingStore.read(t, parseInt(matchItem[1], 10));
        } else if (matchSideBase) {
          apiWrap = false;
          return backingStore.has(t, parseInt(matchSideBase[1], 10), matchSideBase[2]);
        }
      } else if (config.method === 'post') {
        if (matchBase) {
          return backingStore.write(t, JSON.parse(config.data));
        }
      } else if (config.method === 'patch') {
        if (matchItem) {
          return backingStore.write(t, Object.assign({}, JSON.parse(config.data), _defineProperty({}, t.$id, parseInt(matchItem[1], 10))));
        }
      } else if (config.method === 'put') {
        if (matchSideBase) {
          apiWrap = false;
          return backingStore.add(t, parseInt(matchSideBase[1], 10), matchSideBase[2], JSON.parse(config.data));
        }
      } else if (config.method === 'delete') {
        if (matchItem) {
          return backingStore.delete(t, parseInt(matchItem[1], 10));
        } else if (matchSideItem) {
          apiWrap = false;
          return backingStore.remove(t, parseInt(matchSideItem[1], 10), matchSideItem[2], parseInt(matchSideItem[3], 10));
        }
      }
      return _bluebird2.default.reject(new Error(404));
    }).then(function (d) {
      // console.log('FOR');
      // console.log(config);
      // console.log(`RESOLVING ${JSON.stringify(d)}`);
      if (d) {
        if (apiWrap) {
          return {
            data: _defineProperty({}, t.$name, [d])
          };
        } else {
          return {
            data: d
          };
        }
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
//# sourceMappingURL=data:application/json;base64,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LENBQVQsRUFBdUIsRUFBdkIsQ0FBdkIsQ0FBUDtBQUNELFNBRkQsTUFFTyxJQUFJLGFBQUosRUFBbUI7QUFDeEIsb0JBQVUsS0FBVjtBQUNBLGlCQUFPLGFBQWEsTUFBYixDQUNMLENBREssRUFFTCxTQUFTLGNBQWMsQ0FBZCxDQUFULEVBQTJCLEVBQTNCLENBRkssRUFHTCxjQUFjLENBQWQsQ0FISyxFQUlMLFNBQVMsY0FBYyxDQUFkLENBQVQsRUFBMkIsRUFBM0IsQ0FKSyxDQUFQO0FBTUQ7QUFDRjtBQUNELGFBQU8sbUJBQVEsTUFBUixDQUFlLElBQUksS0FBSixDQUFVLEdBQVYsQ0FBZixDQUFQO0FBQ0QsS0FsRE0sRUFrREosSUFsREksQ0FrREMsVUFBQyxDQUFELEVBQU87QUFDYjtBQUNBO0FBQ0E7QUFDQSxVQUFJLENBQUosRUFBTztBQUNMLFlBQUksT0FBSixFQUFhO0FBQ1gsaUJBQU87QUFDTCxzQ0FDRyxFQUFFLEtBREwsRUFDYSxDQUFDLENBQUQsQ0FEYjtBQURLLFdBQVA7QUFLRCxTQU5ELE1BTU87QUFDTCxpQkFBTztBQUNMLGtCQUFNO0FBREQsV0FBUDtBQUdEO0FBQ0YsT0FaRCxNQVlPO0FBQ0wsZUFBTyxtQkFBUSxNQUFSLENBQWUsR0FBZixDQUFQO0FBQ0Q7QUFDRixLQXJFTSxDQUFQO0FBc0VELEdBeEVEO0FBeUVBLFNBQU8sV0FBUDtBQUNEOztBQUVELElBQU0sWUFBWTtBQUNoQjtBQURnQixDQUFsQjs7a0JBSWUsUyIsImZpbGUiOiJ0ZXN0L2F4aW9zTW9ja2luZy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1lbW9yeVN0b3JhZ2UgfSBmcm9tICcuLi9zdG9yYWdlL21lbW9yeSc7XG5pbXBvcnQgKiBhcyBheGlvcyBmcm9tICdheGlvcyc7XG5pbXBvcnQgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5cbmNvbnN0IGJhY2tpbmdTdG9yZSA9IG5ldyBNZW1vcnlTdG9yYWdlKHt0ZXJtaW5hbDogdHJ1ZX0pO1xuXG5mdW5jdGlvbiBtb2NrdXAodCkge1xuICBjb25zdCBtb2NrZWRBeGlvcyA9IGF4aW9zLmNyZWF0ZSh7YmFzZVVSTDogJyd9KTtcbiAgbW9ja2VkQXhpb3MuZGVmYXVsdHMuYWRhcHRlciA9IChjb25maWcpID0+IHtcbiAgICBsZXQgYXBpV3JhcCA9IHRydWU7IC8vIHNob3VsZCB3ZSB3cmFwIGluIHN0YW5kYXJkIEpTT04gQVBJIGF0IHRoZSBib3R0b21cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCBtYXRjaEJhc2UgPSBjb25maWcudXJsLm1hdGNoKG5ldyBSZWdFeHAoYF4vJHt0LiRuYW1lfSRgKSk7XG4gICAgICBjb25zdCBtYXRjaEl0ZW0gPSBjb25maWcudXJsLm1hdGNoKG5ldyBSZWdFeHAoYF4vJHt0LiRuYW1lfS8oXFxcXGQrKSRgKSk7XG4gICAgICBjb25zdCBtYXRjaFNpZGVCYXNlID0gY29uZmlnLnVybC5tYXRjaChuZXcgUmVnRXhwKGBeLyR7dC4kbmFtZX0vKFxcXFxkKykvKFxcXFx3KykkYCkpO1xuICAgICAgY29uc3QgbWF0Y2hTaWRlSXRlbSA9IGNvbmZpZy51cmwubWF0Y2gobmV3IFJlZ0V4cChgXi8ke3QuJG5hbWV9LyhcXFxcZCspLyhcXFxcdyspLyhcXFxcZCspJGApKTtcblxuXG4gICAgICBpZiAoY29uZmlnLm1ldGhvZCA9PT0gJ2dldCcpIHtcbiAgICAgICAgaWYgKG1hdGNoQmFzZSkge1xuICAgICAgICAgIHJldHVybiBiYWNraW5nU3RvcmUucXVlcnkoKTtcbiAgICAgICAgfSBlbHNlIGlmIChtYXRjaEl0ZW0pIHtcbiAgICAgICAgICByZXR1cm4gYmFja2luZ1N0b3JlLnJlYWQodCwgcGFyc2VJbnQobWF0Y2hJdGVtWzFdLCAxMCkpO1xuICAgICAgICB9IGVsc2UgaWYgKG1hdGNoU2lkZUJhc2UpIHtcbiAgICAgICAgICBhcGlXcmFwID0gZmFsc2U7XG4gICAgICAgICAgcmV0dXJuIGJhY2tpbmdTdG9yZS5oYXModCwgcGFyc2VJbnQobWF0Y2hTaWRlQmFzZVsxXSwgMTApLCBtYXRjaFNpZGVCYXNlWzJdKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjb25maWcubWV0aG9kID09PSAncG9zdCcpIHtcbiAgICAgICAgaWYgKG1hdGNoQmFzZSkge1xuICAgICAgICAgIHJldHVybiBiYWNraW5nU3RvcmUud3JpdGUodCwgSlNPTi5wYXJzZShjb25maWcuZGF0YSkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGNvbmZpZy5tZXRob2QgPT09ICdwYXRjaCcpIHtcbiAgICAgICAgaWYgKG1hdGNoSXRlbSkge1xuICAgICAgICAgIHJldHVybiBiYWNraW5nU3RvcmUud3JpdGUoXG4gICAgICAgICAgICB0LFxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihcbiAgICAgICAgICAgICAge30sXG4gICAgICAgICAgICAgIEpTT04ucGFyc2UoY29uZmlnLmRhdGEpLFxuICAgICAgICAgICAgICB7W3QuJGlkXTogcGFyc2VJbnQobWF0Y2hJdGVtWzFdLCAxMCl9XG4gICAgICAgICAgICApXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjb25maWcubWV0aG9kID09PSAncHV0Jykge1xuICAgICAgICBpZiAobWF0Y2hTaWRlQmFzZSkge1xuICAgICAgICAgIGFwaVdyYXAgPSBmYWxzZTtcbiAgICAgICAgICByZXR1cm4gYmFja2luZ1N0b3JlLmFkZCh0LCBwYXJzZUludChtYXRjaFNpZGVCYXNlWzFdLCAxMCksIG1hdGNoU2lkZUJhc2VbMl0sIEpTT04ucGFyc2UoY29uZmlnLmRhdGEpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjb25maWcubWV0aG9kID09PSAnZGVsZXRlJykge1xuICAgICAgICBpZiAobWF0Y2hJdGVtKSB7XG4gICAgICAgICAgcmV0dXJuIGJhY2tpbmdTdG9yZS5kZWxldGUodCwgcGFyc2VJbnQobWF0Y2hJdGVtWzFdLCAxMCkpO1xuICAgICAgICB9IGVsc2UgaWYgKG1hdGNoU2lkZUl0ZW0pIHtcbiAgICAgICAgICBhcGlXcmFwID0gZmFsc2U7XG4gICAgICAgICAgcmV0dXJuIGJhY2tpbmdTdG9yZS5yZW1vdmUoXG4gICAgICAgICAgICB0LFxuICAgICAgICAgICAgcGFyc2VJbnQobWF0Y2hTaWRlSXRlbVsxXSwgMTApLFxuICAgICAgICAgICAgbWF0Y2hTaWRlSXRlbVsyXSxcbiAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoU2lkZUl0ZW1bM10sIDEwKVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoNDA0KSk7XG4gICAgfSkudGhlbigoZCkgPT4ge1xuICAgICAgLy8gY29uc29sZS5sb2coJ0ZPUicpO1xuICAgICAgLy8gY29uc29sZS5sb2coY29uZmlnKTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKGBSRVNPTFZJTkcgJHtKU09OLnN0cmluZ2lmeShkKX1gKTtcbiAgICAgIGlmIChkKSB7XG4gICAgICAgIGlmIChhcGlXcmFwKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgW3QuJG5hbWVdOiBbZF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRhdGE6IGQsXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KDQwNCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG4gIHJldHVybiBtb2NrZWRBeGlvcztcbn1cblxuY29uc3QgYXhpb3NNb2NrID0ge1xuICBtb2NrdXAsXG59O1xuXG5leHBvcnQgZGVmYXVsdCBheGlvc01vY2s7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
