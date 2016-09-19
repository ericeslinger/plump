'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _memory = require('../storage/memory');

var _axios = require('axios');

var axios = _interopRequireWildcard(_axios);

var _axiosMockAdapter = require('axios-mock-adapter');

var _axiosMockAdapter2 = _interopRequireDefault(_axiosMockAdapter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

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
  var mock = new _axiosMockAdapter2.default(mockedAxios);
  mock.onGet(new RegExp('/' + t.$name + '/d+')).reply(function (data) {
    console.log('GET');
    console.log(data);
    var id = parseInt(data.config.url.substring(0, t.$name.length + 2), 10);
    return getVal(t, id);
  });
  mock.onPost('/' + t.$name).reply(function (data) {
    console.log('POST');
    console.log(data);
    return setVal(t, data.data);
  });
  mock.onPut(new RegExp('/' + t.$name + '/d+')).reply(function (data) {
    console.log('PUT');
    console.log(data);
    return setVal(t, data.data);
  });
  return mockedAxios;
}

var axiosMock = {
  mockup: mockup
};

exports.default = axiosMock;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvYXhpb3NNb2NraW5nLmpzIl0sIm5hbWVzIjpbImF4aW9zIiwiYmFja2luZ1N0b3JlIiwidGVybWluYWwiLCJzZXRWYWwiLCJ0IiwidiIsIndyaXRlIiwidGhlbiIsInIiLCJnZXRWYWwiLCJpZCIsInJlYWQiLCJtb2NrdXAiLCJtb2NrZWRBeGlvcyIsImNyZWF0ZSIsImJhc2VVUkwiLCJtb2NrIiwib25HZXQiLCJSZWdFeHAiLCIkbmFtZSIsInJlcGx5IiwiZGF0YSIsImNvbnNvbGUiLCJsb2ciLCJwYXJzZUludCIsImNvbmZpZyIsInVybCIsInN1YnN0cmluZyIsImxlbmd0aCIsIm9uUG9zdCIsIm9uUHV0IiwiYXhpb3NNb2NrIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7QUFDQTs7SUFBWUEsSzs7QUFDWjs7Ozs7Ozs7QUFFQSxJQUFNQyxlQUFlLDBCQUFrQixFQUFDQyxVQUFVLElBQVgsRUFBbEIsQ0FBckI7O0FBR0EsU0FBU0MsTUFBVCxDQUFnQkMsQ0FBaEIsRUFBbUJDLENBQW5CLEVBQXNCO0FBQ3BCLFNBQU9KLGFBQWFLLEtBQWIsQ0FBbUJGLENBQW5CLEVBQXNCQyxDQUF0QixFQUNORSxJQURNLENBQ0QsVUFBQ0MsQ0FBRCxFQUFPO0FBQ1gsUUFBSUEsQ0FBSixFQUFPO0FBQ0wsYUFBTyxDQUFDLEdBQUQsRUFBTUEsQ0FBTixDQUFQO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsYUFBTyxDQUFDLEdBQUQsRUFBTSxFQUFOLENBQVA7QUFDRDtBQUNGLEdBUE0sQ0FBUDtBQVFEOztBQUVELFNBQVNDLE1BQVQsQ0FBZ0JMLENBQWhCLEVBQW1CTSxFQUFuQixFQUF1QjtBQUNyQixTQUFPVCxhQUFhVSxJQUFiLENBQWtCUCxDQUFsQixFQUFxQk0sRUFBckIsRUFDTkgsSUFETSxDQUNELFVBQUNDLENBQUQ7QUFBQSxXQUFPLENBQUMsR0FBRCxFQUFNQSxDQUFOLENBQVA7QUFBQSxHQURDLENBQVA7QUFFRDs7QUFFRCxTQUFTSSxNQUFULENBQWdCUixDQUFoQixFQUFtQjtBQUNqQixNQUFNUyxjQUFjYixNQUFNYyxNQUFOLENBQWEsRUFBQ0MsU0FBUyxFQUFWLEVBQWIsQ0FBcEI7QUFDQSxNQUFNQyxPQUFPLCtCQUFnQkgsV0FBaEIsQ0FBYjtBQUNBRyxPQUFLQyxLQUFMLENBQVcsSUFBSUMsTUFBSixPQUFnQmQsRUFBRWUsS0FBbEIsU0FBWCxFQUEyQ0MsS0FBM0MsQ0FBaUQsVUFBQ0MsSUFBRCxFQUFVO0FBQ3pEQyxZQUFRQyxHQUFSLENBQVksS0FBWjtBQUNBRCxZQUFRQyxHQUFSLENBQVlGLElBQVo7QUFDQSxRQUFNWCxLQUFLYyxTQUFTSCxLQUFLSSxNQUFMLENBQVlDLEdBQVosQ0FBZ0JDLFNBQWhCLENBQTBCLENBQTFCLEVBQTZCdkIsRUFBRWUsS0FBRixDQUFRUyxNQUFSLEdBQWlCLENBQTlDLENBQVQsRUFBMkQsRUFBM0QsQ0FBWDtBQUNBLFdBQU9uQixPQUFPTCxDQUFQLEVBQVVNLEVBQVYsQ0FBUDtBQUNELEdBTEQ7QUFNQU0sT0FBS2EsTUFBTCxPQUFnQnpCLEVBQUVlLEtBQWxCLEVBQTJCQyxLQUEzQixDQUFpQyxVQUFDQyxJQUFELEVBQVU7QUFDekNDLFlBQVFDLEdBQVIsQ0FBWSxNQUFaO0FBQ0FELFlBQVFDLEdBQVIsQ0FBWUYsSUFBWjtBQUNBLFdBQU9sQixPQUFPQyxDQUFQLEVBQVVpQixLQUFLQSxJQUFmLENBQVA7QUFDRCxHQUpEO0FBS0FMLE9BQUtjLEtBQUwsQ0FBVyxJQUFJWixNQUFKLE9BQWdCZCxFQUFFZSxLQUFsQixTQUFYLEVBQTJDQyxLQUEzQyxDQUFpRCxVQUFDQyxJQUFELEVBQVU7QUFDekRDLFlBQVFDLEdBQVIsQ0FBWSxLQUFaO0FBQ0FELFlBQVFDLEdBQVIsQ0FBWUYsSUFBWjtBQUNBLFdBQU9sQixPQUFPQyxDQUFQLEVBQVVpQixLQUFLQSxJQUFmLENBQVA7QUFDRCxHQUpEO0FBS0EsU0FBT1IsV0FBUDtBQUNEOztBQUVELElBQU1rQixZQUFZO0FBQ2hCbkI7QUFEZ0IsQ0FBbEI7O2tCQUllbUIsUyIsImZpbGUiOiJ0ZXN0L2F4aW9zTW9ja2luZy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1lbW9yeVN0b3JhZ2UgfSBmcm9tICcuLi9zdG9yYWdlL21lbW9yeSc7XG5pbXBvcnQgKiBhcyBheGlvcyBmcm9tICdheGlvcyc7XG5pbXBvcnQgTW9ja0FkYXB0ZXIgZnJvbSAnYXhpb3MtbW9jay1hZGFwdGVyJztcblxuY29uc3QgYmFja2luZ1N0b3JlID0gbmV3IE1lbW9yeVN0b3JhZ2Uoe3Rlcm1pbmFsOiB0cnVlfSk7XG5cblxuZnVuY3Rpb24gc2V0VmFsKHQsIHYpIHtcbiAgcmV0dXJuIGJhY2tpbmdTdG9yZS53cml0ZSh0LCB2KVxuICAudGhlbigocikgPT4ge1xuICAgIGlmIChyKSB7XG4gICAgICByZXR1cm4gWzIwMCwgcl07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBbNDA0LCB7fV07XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0VmFsKHQsIGlkKSB7XG4gIHJldHVybiBiYWNraW5nU3RvcmUucmVhZCh0LCBpZClcbiAgLnRoZW4oKHIpID0+IFsyMDAsIHJdKTtcbn1cblxuZnVuY3Rpb24gbW9ja3VwKHQpIHtcbiAgY29uc3QgbW9ja2VkQXhpb3MgPSBheGlvcy5jcmVhdGUoe2Jhc2VVUkw6ICcnfSk7XG4gIGNvbnN0IG1vY2sgPSBuZXcgTW9ja0FkYXB0ZXIobW9ja2VkQXhpb3MpO1xuICBtb2NrLm9uR2V0KG5ldyBSZWdFeHAoYFxcLyR7dC4kbmFtZX1cXC9kK2ApKS5yZXBseSgoZGF0YSkgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdHRVQnKTtcbiAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICBjb25zdCBpZCA9IHBhcnNlSW50KGRhdGEuY29uZmlnLnVybC5zdWJzdHJpbmcoMCwgdC4kbmFtZS5sZW5ndGggKyAyKSwgMTApO1xuICAgIHJldHVybiBnZXRWYWwodCwgaWQpO1xuICB9KTtcbiAgbW9jay5vblBvc3QoYC8ke3QuJG5hbWV9YCkucmVwbHkoKGRhdGEpID0+IHtcbiAgICBjb25zb2xlLmxvZygnUE9TVCcpO1xuICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgIHJldHVybiBzZXRWYWwodCwgZGF0YS5kYXRhKTtcbiAgfSk7XG4gIG1vY2sub25QdXQobmV3IFJlZ0V4cChgXFwvJHt0LiRuYW1lfVxcL2QrYCkpLnJlcGx5KChkYXRhKSA9PiB7XG4gICAgY29uc29sZS5sb2coJ1BVVCcpO1xuICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgIHJldHVybiBzZXRWYWwodCwgZGF0YS5kYXRhKTtcbiAgfSk7XG4gIHJldHVybiBtb2NrZWRBeGlvcztcbn1cblxuY29uc3QgYXhpb3NNb2NrID0ge1xuICBtb2NrdXAsXG59O1xuXG5leHBvcnQgZGVmYXVsdCBheGlvc01vY2s7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
