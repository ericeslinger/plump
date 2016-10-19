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
          return backingStore.read(t, parseInt(matchSideBase[1], 10), matchSideBase[2]);
        }
      } else if (config.method === 'post') {
        if (matchBase) {
          return backingStore.write(t, JSON.parse(config.data));
        }
      } else if (config.method === 'patch') {
        if (matchItem) {
          return backingStore.write(t, Object.assign({}, JSON.parse(config.data), _defineProperty({}, t.$id, parseInt(matchItem[1], 10))));
        } else if (matchSideItem) {
          return backingStore.modifyRelationship(t, parseInt(matchSideItem[1], 10), matchSideItem[2], parseInt(matchSideItem[3], 10), JSON.parse(config.data));
        }
      } else if (config.method === 'put') {
        if (matchSideBase) {
          apiWrap = false;
          var Rel = t.$fields[matchSideBase[2]];
          var selfFieldName = Rel.field;
          var otherFieldName = Rel.relationship.otherField(selfFieldName);
          return backingStore.add(t, parseInt(matchSideBase[1], 10), matchSideBase[2], JSON.parse(config.data)[otherFieldName], JSON.parse(config.data));
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