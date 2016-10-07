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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvYXhpb3NNb2NraW5nLmpzIl0sIm5hbWVzIjpbImF4aW9zIiwiYmFja2luZ1N0b3JlIiwidGVybWluYWwiLCJtb2NrdXAiLCJ0IiwibW9ja2VkQXhpb3MiLCJjcmVhdGUiLCJiYXNlVVJMIiwiZGVmYXVsdHMiLCJhZGFwdGVyIiwiY29uZmlnIiwiYXBpV3JhcCIsInJlc29sdmUiLCJ0aGVuIiwibWF0Y2hCYXNlIiwidXJsIiwibWF0Y2giLCJSZWdFeHAiLCIkbmFtZSIsIm1hdGNoSXRlbSIsIm1hdGNoU2lkZUJhc2UiLCJtYXRjaFNpZGVJdGVtIiwibWV0aG9kIiwicXVlcnkiLCJyZWFkIiwicGFyc2VJbnQiLCJoYXMiLCJ3cml0ZSIsIkpTT04iLCJwYXJzZSIsImRhdGEiLCJPYmplY3QiLCJhc3NpZ24iLCIkaWQiLCJhZGQiLCJkZWxldGUiLCJyZW1vdmUiLCJyZWplY3QiLCJFcnJvciIsImQiLCJheGlvc01vY2siXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOztBQUNBOztJQUFZQSxLOztBQUNaOzs7Ozs7Ozs7O0FBRUEsSUFBTUMsZUFBZSwwQkFBa0IsRUFBQ0MsVUFBVSxJQUFYLEVBQWxCLENBQXJCOztBQUVBLFNBQVNDLE1BQVQsQ0FBZ0JDLENBQWhCLEVBQW1CO0FBQ2pCLE1BQU1DLGNBQWNMLE1BQU1NLE1BQU4sQ0FBYSxFQUFDQyxTQUFTLEVBQVYsRUFBYixDQUFwQjtBQUNBRixjQUFZRyxRQUFaLENBQXFCQyxPQUFyQixHQUErQixVQUFDQyxNQUFELEVBQVk7QUFDekMsUUFBSUMsVUFBVSxJQUFkLENBRHlDLENBQ3JCO0FBQ3BCLFdBQU8sbUJBQVFDLE9BQVIsR0FBa0JDLElBQWxCLENBQXVCLFlBQU07QUFDbEMsVUFBTUMsWUFBWUosT0FBT0ssR0FBUCxDQUFXQyxLQUFYLENBQWlCLElBQUlDLE1BQUosUUFBZ0JiLEVBQUVjLEtBQWxCLE9BQWpCLENBQWxCO0FBQ0EsVUFBTUMsWUFBWVQsT0FBT0ssR0FBUCxDQUFXQyxLQUFYLENBQWlC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O0FBQ0wsWUFBSTVCLE9BQUosRUFBYTtBQUNYLGlCQUFPO0FBQ0xtQixzQ0FDRzFCLEVBQUVjLEtBREwsRUFDYSxDQUFDcUIsQ0FBRCxDQURiO0FBREssV0FBUDtBQUtELFNBTkQsTUFNTztBQUNMLGlCQUFPO0FBQ0xULGtCQUFNUztBQURELFdBQVA7QUFHRDtBQUNGLE9BWkQsTUFZTztBQUNMLGVBQU8sbUJBQVFGLE1BQVIsQ0FBZSxHQUFmLENBQVA7QUFDRDtBQUNGLEtBckVNLENBQVA7QUFzRUQsR0F4RUQ7QUF5RUEsU0FBT2hDLFdBQVA7QUFDRDs7QUFFRCxJQUFNbUMsWUFBWTtBQUNoQnJDO0FBRGdCLENBQWxCOztrQkFJZXFDLFMiLCJmaWxlIjoidGVzdC9heGlvc01vY2tpbmcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNZW1vcnlTdG9yYWdlIH0gZnJvbSAnLi4vc3RvcmFnZS9tZW1vcnknO1xuaW1wb3J0ICogYXMgYXhpb3MgZnJvbSAnYXhpb3MnO1xuaW1wb3J0IFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuXG5jb25zdCBiYWNraW5nU3RvcmUgPSBuZXcgTWVtb3J5U3RvcmFnZSh7dGVybWluYWw6IHRydWV9KTtcblxuZnVuY3Rpb24gbW9ja3VwKHQpIHtcbiAgY29uc3QgbW9ja2VkQXhpb3MgPSBheGlvcy5jcmVhdGUoe2Jhc2VVUkw6ICcnfSk7XG4gIG1vY2tlZEF4aW9zLmRlZmF1bHRzLmFkYXB0ZXIgPSAoY29uZmlnKSA9PiB7XG4gICAgbGV0IGFwaVdyYXAgPSB0cnVlOyAvLyBzaG91bGQgd2Ugd3JhcCBpbiBzdGFuZGFyZCBKU09OIEFQSSBhdCB0aGUgYm90dG9tXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3QgbWF0Y2hCYXNlID0gY29uZmlnLnVybC5tYXRjaChuZXcgUmVnRXhwKGBeLyR7dC4kbmFtZX0kYCkpO1xuICAgICAgY29uc3QgbWF0Y2hJdGVtID0gY29uZmlnLnVybC5tYXRjaChuZXcgUmVnRXhwKGBeLyR7dC4kbmFtZX0vKFxcXFxkKykkYCkpO1xuICAgICAgY29uc3QgbWF0Y2hTaWRlQmFzZSA9IGNvbmZpZy51cmwubWF0Y2gobmV3IFJlZ0V4cChgXi8ke3QuJG5hbWV9LyhcXFxcZCspLyhcXFxcdyspJGApKTtcbiAgICAgIGNvbnN0IG1hdGNoU2lkZUl0ZW0gPSBjb25maWcudXJsLm1hdGNoKG5ldyBSZWdFeHAoYF4vJHt0LiRuYW1lfS8oXFxcXGQrKS8oXFxcXHcrKS8oXFxcXGQrKSRgKSk7XG5cblxuICAgICAgaWYgKGNvbmZpZy5tZXRob2QgPT09ICdnZXQnKSB7XG4gICAgICAgIGlmIChtYXRjaEJhc2UpIHtcbiAgICAgICAgICByZXR1cm4gYmFja2luZ1N0b3JlLnF1ZXJ5KCk7XG4gICAgICAgIH0gZWxzZSBpZiAobWF0Y2hJdGVtKSB7XG4gICAgICAgICAgcmV0dXJuIGJhY2tpbmdTdG9yZS5yZWFkKHQsIHBhcnNlSW50KG1hdGNoSXRlbVsxXSwgMTApKTtcbiAgICAgICAgfSBlbHNlIGlmIChtYXRjaFNpZGVCYXNlKSB7XG4gICAgICAgICAgYXBpV3JhcCA9IGZhbHNlO1xuICAgICAgICAgIHJldHVybiBiYWNraW5nU3RvcmUuaGFzKHQsIHBhcnNlSW50KG1hdGNoU2lkZUJhc2VbMV0sIDEwKSwgbWF0Y2hTaWRlQmFzZVsyXSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLm1ldGhvZCA9PT0gJ3Bvc3QnKSB7XG4gICAgICAgIGlmIChtYXRjaEJhc2UpIHtcbiAgICAgICAgICByZXR1cm4gYmFja2luZ1N0b3JlLndyaXRlKHQsIEpTT04ucGFyc2UoY29uZmlnLmRhdGEpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjb25maWcubWV0aG9kID09PSAncGF0Y2gnKSB7XG4gICAgICAgIGlmIChtYXRjaEl0ZW0pIHtcbiAgICAgICAgICByZXR1cm4gYmFja2luZ1N0b3JlLndyaXRlKFxuICAgICAgICAgICAgdCxcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oXG4gICAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgICBKU09OLnBhcnNlKGNvbmZpZy5kYXRhKSxcbiAgICAgICAgICAgICAge1t0LiRpZF06IHBhcnNlSW50KG1hdGNoSXRlbVsxXSwgMTApfVxuICAgICAgICAgICAgKVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLm1ldGhvZCA9PT0gJ3B1dCcpIHtcbiAgICAgICAgaWYgKG1hdGNoU2lkZUJhc2UpIHtcbiAgICAgICAgICBhcGlXcmFwID0gZmFsc2U7XG4gICAgICAgICAgcmV0dXJuIGJhY2tpbmdTdG9yZS5hZGQodCwgcGFyc2VJbnQobWF0Y2hTaWRlQmFzZVsxXSwgMTApLCBtYXRjaFNpZGVCYXNlWzJdLCBKU09OLnBhcnNlKGNvbmZpZy5kYXRhKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLm1ldGhvZCA9PT0gJ2RlbGV0ZScpIHtcbiAgICAgICAgaWYgKG1hdGNoSXRlbSkge1xuICAgICAgICAgIHJldHVybiBiYWNraW5nU3RvcmUuZGVsZXRlKHQsIHBhcnNlSW50KG1hdGNoSXRlbVsxXSwgMTApKTtcbiAgICAgICAgfSBlbHNlIGlmIChtYXRjaFNpZGVJdGVtKSB7XG4gICAgICAgICAgYXBpV3JhcCA9IGZhbHNlO1xuICAgICAgICAgIHJldHVybiBiYWNraW5nU3RvcmUucmVtb3ZlKFxuICAgICAgICAgICAgdCxcbiAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoU2lkZUl0ZW1bMV0sIDEwKSxcbiAgICAgICAgICAgIG1hdGNoU2lkZUl0ZW1bMl0sXG4gICAgICAgICAgICBwYXJzZUludChtYXRjaFNpZGVJdGVtWzNdLCAxMClcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKDQwNCkpO1xuICAgIH0pLnRoZW4oKGQpID0+IHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdGT1InKTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKGNvbmZpZyk7XG4gICAgICAvLyBjb25zb2xlLmxvZyhgUkVTT0xWSU5HICR7SlNPTi5zdHJpbmdpZnkoZCl9YCk7XG4gICAgICBpZiAoZCkge1xuICAgICAgICBpZiAoYXBpV3JhcCkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIFt0LiRuYW1lXTogW2RdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkYXRhOiBkLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCg0MDQpO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuICByZXR1cm4gbW9ja2VkQXhpb3M7XG59XG5cbmNvbnN0IGF4aW9zTW9jayA9IHtcbiAgbW9ja3VwLFxufTtcblxuZXhwb3J0IGRlZmF1bHQgYXhpb3NNb2NrO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
