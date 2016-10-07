'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RedisStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _redis = require('redis');

var Redis = _interopRequireWildcard(_redis);

var _storage = require('./storage');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var RedisService = Promise.promisifyAll(Redis);
var $redis = Symbol('$redis');

function saneNumber(i) {
  return typeof i === 'number' && !isNaN(i) && i !== Infinity & i !== -Infinity;
}

function keyString(t, id, relationship) {
  if (relationship === undefined) {
    return t.$name + ':store:' + id;
  } else {
    return t.$name + ':' + relationship + ':' + id;
  }
}

var RedisStorage = exports.RedisStorage = function (_Storage) {
  _inherits(RedisStorage, _Storage);

  function RedisStorage() {
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, RedisStorage);

    var _this = _possibleConstructorReturn(this, (RedisStorage.__proto__ || Object.getPrototypeOf(RedisStorage)).call(this, opts));

    var options = Object.assign({}, {
      port: 6379,
      host: 'localhost',
      db: 0,
      retry_strategy: function retry_strategy(o) {
        if (o.error.code === 'ECONNREFUSED') {
          // End reconnecting on a specific error and flush all commands with a individual error
          return new Error('The server refused the connection');
        }
        if (o.total_retry_time > 1000 * 60 * 60) {
          // End reconnecting after a specific timeout and flush all commands with a individual error
          return new Error('Retry time exhausted');
        }
        if (o.times_connected > 10) {
          // End reconnecting with built in error
          return undefined;
        }
        // reconnect after
        return Math.max(o.attempt * 100, 3000);
      }
    }, opts);
    _this[$redis] = RedisService.createClient(options);
    _this.isCache = true;
    return _this;
  }

  _createClass(RedisStorage, [{
    key: 'teardown',
    value: function teardown() {
      return this[$redis].quitAsync();
    }
  }, {
    key: '$$maxKey',
    value: function $$maxKey(t) {
      return this[$redis].keysAsync(t.$name + ':store:*').then(function (keyArray) {
        if (keyArray.length === 0) {
          return 0;
        } else {
          return keyArray.map(function (k) {
            return k.split(':')[2];
          }).map(function (k) {
            return parseInt(k, 10);
          }).filter(function (i) {
            return saneNumber(i);
          }).reduce(function (max, current) {
            return current > max ? current : max;
          }, 0);
        }
      });
    }
  }, {
    key: 'write',
    value: function write(t, v) {
      var _this2 = this;

      var id = v[t.$id];
      var updateObject = {};
      Object.keys(t.$fields).forEach(function (fieldName) {
        if (v[fieldName] !== undefined) {
          // copy from v to the best of our ability
          if (t.$fields[fieldName].type === 'array' || t.$fields[fieldName].type === 'hasMany') {
            updateObject[fieldName] = v[fieldName].concat();
          } else if (t.$fields[fieldName].type === 'object') {
            updateObject[fieldName] = Object.assign({}, v[fieldName]);
          } else {
            updateObject[fieldName] = v[fieldName];
          }
        }
      });
      if (id === undefined) {
        if (this.terminal) {
          return this.$$maxKey(t).then(function (n) {
            var toSave = Object.assign({}, _defineProperty({}, t.$id, n + 1), updateObject);
            return _this2[$redis].setAsync(keyString(t, n + 1), JSON.stringify(toSave)).then(function () {
              return toSave;
            });
          });
        } else {
          throw new Error('Cannot create new content in a non-terminal store');
        }
      } else {
        return this[$redis].getAsync(keyString(t, id)).then(function (origValue) {
          var update = Object.assign({}, JSON.parse(origValue), updateObject);
          return _this2[$redis].setAsync(keyString(t, id), JSON.stringify(update)).then(function () {
            return update;
          });
        });
      }
    }
  }, {
    key: 'read',
    value: function read(t, id) {
      return this[$redis].getAsync(keyString(t, id)).then(function (d) {
        return JSON.parse(d);
      });
    }
  }, {
    key: 'delete',
    value: function _delete(t, id) {
      return this[$redis].delAsync(keyString(t, id));
    }
  }, {
    key: 'add',
    value: function add(t, id, relationship, childId) {
      var _this3 = this;

      return this[$redis].getAsync(keyString(t, id, relationship)).then(function (arrayString) {
        var relationshipArray = JSON.parse(arrayString);
        if (relationshipArray === null) {
          relationshipArray = [];
        }
        if (relationshipArray.indexOf(childId) < 0) {
          relationshipArray.push(childId);
        }
        return _this3[$redis].setAsync(keyString(t, id, relationship), JSON.stringify(relationshipArray)).then(function () {
          return relationshipArray;
        });
      });
    }
  }, {
    key: 'has',
    value: function has(t, id, relationship) {
      return this[$redis].getAsync(keyString(t, id, relationship)).then(function (arrayString) {
        var relationshipArray = JSON.parse(arrayString);
        if (relationshipArray === null) {
          relationshipArray = [];
        }
        return relationshipArray;
      });
    }
  }, {
    key: 'remove',
    value: function remove(t, id, relationship, childId) {
      var _this4 = this;

      return this[$redis].getAsync(keyString(t, id, relationship)).then(function (arrayString) {
        var relationshipArray = JSON.parse(arrayString);
        if (relationshipArray === null) {
          relationshipArray = [];
        }
        var idx = relationshipArray.indexOf(childId);
        if (idx >= 0) {
          relationshipArray.splice(idx, 1);
          return _this4[$redis].setAsync(keyString(t, id, relationship), JSON.stringify(relationshipArray)).then(function () {
            return relationshipArray;
          });
        } else {
          return Promise.reject(new Error('Item ' + childId + ' not found in ' + relationship + ' of ' + t.$name));
        }
      });
    }
  }]);

  return RedisStorage;
}(_storage.Storage);
//# sourceMappingURL=data:application/json;base64,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c0IsVUFBVSxDQUFWLEVBQWEsRUFBYixFQUFpQixZQUFqQixDQUF0QixFQUFzRCxLQUFLLFNBQUwsQ0FBZSxpQkFBZixDQUF0RCxFQUNOLElBRE0sQ0FDRDtBQUFBLG1CQUFNLGlCQUFOO0FBQUEsV0FEQyxDQUFQO0FBRUQsU0FKRCxNQUlPO0FBQ0wsaUJBQU8sUUFBUSxNQUFSLENBQWUsSUFBSSxLQUFKLFdBQWtCLE9BQWxCLHNCQUEwQyxZQUExQyxZQUE2RCxFQUFFLEtBQS9ELENBQWYsQ0FBUDtBQUNEO0FBQ0YsT0FkTSxDQUFQO0FBZUQiLCJmaWxlIjoic3RvcmFnZS9yZWRpcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0ICogYXMgUmVkaXMgZnJvbSAncmVkaXMnO1xuaW1wb3J0IHtTdG9yYWdlfSBmcm9tICcuL3N0b3JhZ2UnO1xuXG5cbmNvbnN0IFJlZGlzU2VydmljZSA9IFByb21pc2UucHJvbWlzaWZ5QWxsKFJlZGlzKTtcbmNvbnN0ICRyZWRpcyA9IFN5bWJvbCgnJHJlZGlzJyk7XG5cbmZ1bmN0aW9uIHNhbmVOdW1iZXIoaSkge1xuICByZXR1cm4gKCh0eXBlb2YgaSA9PT0gJ251bWJlcicpICYmICghaXNOYU4oaSkpICYmIChpICE9PSBJbmZpbml0eSkgJiAoaSAhPT0gLUluZmluaXR5KSk7XG59XG5cbmZ1bmN0aW9uIGtleVN0cmluZyh0LCBpZCwgcmVsYXRpb25zaGlwKSB7XG4gIGlmIChyZWxhdGlvbnNoaXAgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBgJHt0LiRuYW1lfTpzdG9yZToke2lkfWA7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGAke3QuJG5hbWV9OiR7cmVsYXRpb25zaGlwfToke2lkfWA7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJlZGlzU3RvcmFnZSBleHRlbmRzIFN0b3JhZ2Uge1xuXG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIHN1cGVyKG9wdHMpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIHBvcnQ6IDYzNzksXG4gICAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgICBkYjogMCxcbiAgICAgICAgcmV0cnlfc3RyYXRlZ3k6IChvKSA9PiB7XG4gICAgICAgICAgaWYgKG8uZXJyb3IuY29kZSA9PT0gJ0VDT05OUkVGVVNFRCcpIHtcbiAgICAgICAgICAgIC8vIEVuZCByZWNvbm5lY3Rpbmcgb24gYSBzcGVjaWZpYyBlcnJvciBhbmQgZmx1c2ggYWxsIGNvbW1hbmRzIHdpdGggYSBpbmRpdmlkdWFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gbmV3IEVycm9yKCdUaGUgc2VydmVyIHJlZnVzZWQgdGhlIGNvbm5lY3Rpb24nKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG8udG90YWxfcmV0cnlfdGltZSA+IDEwMDAgKiA2MCAqIDYwKSB7XG4gICAgICAgICAgICAvLyBFbmQgcmVjb25uZWN0aW5nIGFmdGVyIGEgc3BlY2lmaWMgdGltZW91dCBhbmQgZmx1c2ggYWxsIGNvbW1hbmRzIHdpdGggYSBpbmRpdmlkdWFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gbmV3IEVycm9yKCdSZXRyeSB0aW1lIGV4aGF1c3RlZCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoby50aW1lc19jb25uZWN0ZWQgPiAxMCkge1xuICAgICAgICAgICAgLy8gRW5kIHJlY29ubmVjdGluZyB3aXRoIGJ1aWx0IGluIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyByZWNvbm5lY3QgYWZ0ZXJcbiAgICAgICAgICByZXR1cm4gTWF0aC5tYXgoby5hdHRlbXB0ICogMTAwLCAzMDAwKTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBvcHRzXG4gICAgKTtcbiAgICB0aGlzWyRyZWRpc10gPSBSZWRpc1NlcnZpY2UuY3JlYXRlQ2xpZW50KG9wdGlvbnMpO1xuICAgIHRoaXMuaXNDYWNoZSA9IHRydWU7XG4gIH1cblxuICB0ZWFyZG93bigpIHtcbiAgICByZXR1cm4gdGhpc1skcmVkaXNdLnF1aXRBc3luYygpO1xuICB9XG5cbiAgJCRtYXhLZXkodCkge1xuICAgIHJldHVybiB0aGlzWyRyZWRpc10ua2V5c0FzeW5jKGAke3QuJG5hbWV9OnN0b3JlOipgKVxuICAgIC50aGVuKChrZXlBcnJheSkgPT4ge1xuICAgICAgaWYgKGtleUFycmF5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBrZXlBcnJheS5tYXAoKGspID0+IGsuc3BsaXQoJzonKVsyXSlcbiAgICAgICAgLm1hcCgoaykgPT4gcGFyc2VJbnQoaywgMTApKVxuICAgICAgICAuZmlsdGVyKChpKSA9PiBzYW5lTnVtYmVyKGkpKVxuICAgICAgICAucmVkdWNlKChtYXgsIGN1cnJlbnQpID0+IChjdXJyZW50ID4gbWF4KSA/IGN1cnJlbnQgOiBtYXgsIDApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgd3JpdGUodCwgdikge1xuICAgIGNvbnN0IGlkID0gdlt0LiRpZF07XG4gICAgY29uc3QgdXBkYXRlT2JqZWN0ID0ge307XG4gICAgT2JqZWN0LmtleXModC4kZmllbGRzKS5mb3JFYWNoKChmaWVsZE5hbWUpID0+IHtcbiAgICAgIGlmICh2W2ZpZWxkTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBjb3B5IGZyb20gdiB0byB0aGUgYmVzdCBvZiBvdXIgYWJpbGl0eVxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdhcnJheScpIHx8XG4gICAgICAgICAgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdoYXNNYW55JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSB2W2ZpZWxkTmFtZV0uY29uY2F0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IE9iamVjdC5hc3NpZ24oe30sIHZbZmllbGROYW1lXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSB2W2ZpZWxkTmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoaWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuJCRtYXhLZXkodClcbiAgICAgICAgLnRoZW4oKG4pID0+IHtcbiAgICAgICAgICBjb25zdCB0b1NhdmUgPSBPYmplY3QuYXNzaWduKHt9LCB7W3QuJGlkXTogbiArIDF9LCB1cGRhdGVPYmplY3QpO1xuICAgICAgICAgIHJldHVybiB0aGlzWyRyZWRpc10uc2V0QXN5bmMoa2V5U3RyaW5nKHQsIG4gKyAxKSwgSlNPTi5zdHJpbmdpZnkodG9TYXZlKSlcbiAgICAgICAgICAudGhlbigoKSA9PiB0b1NhdmUpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBuZXcgY29udGVudCBpbiBhIG5vbi10ZXJtaW5hbCBzdG9yZScpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpc1skcmVkaXNdLmdldEFzeW5jKGtleVN0cmluZyh0LCBpZCkpXG4gICAgICAudGhlbigob3JpZ1ZhbHVlKSA9PiB7XG4gICAgICAgIGNvbnN0IHVwZGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sIEpTT04ucGFyc2Uob3JpZ1ZhbHVlKSwgdXBkYXRlT2JqZWN0KTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHJlZGlzXS5zZXRBc3luYyhrZXlTdHJpbmcodCwgaWQpLCBKU09OLnN0cmluZ2lmeSh1cGRhdGUpKVxuICAgICAgICAudGhlbigoKSA9PiB1cGRhdGUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmVhZCh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzWyRyZWRpc10uZ2V0QXN5bmMoa2V5U3RyaW5nKHQsIGlkKSlcbiAgICAudGhlbigoZCkgPT4gSlNPTi5wYXJzZShkKSk7XG4gIH1cblxuICBkZWxldGUodCwgaWQpIHtcbiAgICByZXR1cm4gdGhpc1skcmVkaXNdLmRlbEFzeW5jKGtleVN0cmluZyh0LCBpZCkpO1xuICB9XG5cbiAgYWRkKHQsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQpIHtcbiAgICByZXR1cm4gdGhpc1skcmVkaXNdLmdldEFzeW5jKGtleVN0cmluZyh0LCBpZCwgcmVsYXRpb25zaGlwKSlcbiAgICAudGhlbigoYXJyYXlTdHJpbmcpID0+IHtcbiAgICAgIGxldCByZWxhdGlvbnNoaXBBcnJheSA9IEpTT04ucGFyc2UoYXJyYXlTdHJpbmcpO1xuICAgICAgaWYgKHJlbGF0aW9uc2hpcEFycmF5ID09PSBudWxsKSB7XG4gICAgICAgIHJlbGF0aW9uc2hpcEFycmF5ID0gW107XG4gICAgICB9XG4gICAgICBpZiAocmVsYXRpb25zaGlwQXJyYXkuaW5kZXhPZihjaGlsZElkKSA8IDApIHtcbiAgICAgICAgcmVsYXRpb25zaGlwQXJyYXkucHVzaChjaGlsZElkKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzWyRyZWRpc10uc2V0QXN5bmMoa2V5U3RyaW5nKHQsIGlkLCByZWxhdGlvbnNoaXApLCBKU09OLnN0cmluZ2lmeShyZWxhdGlvbnNoaXBBcnJheSkpXG4gICAgICAudGhlbigoKSA9PiByZWxhdGlvbnNoaXBBcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBoYXModCwgaWQsIHJlbGF0aW9uc2hpcCkge1xuICAgIHJldHVybiB0aGlzWyRyZWRpc10uZ2V0QXN5bmMoa2V5U3RyaW5nKHQsIGlkLCByZWxhdGlvbnNoaXApKVxuICAgIC50aGVuKChhcnJheVN0cmluZykgPT4ge1xuICAgICAgbGV0IHJlbGF0aW9uc2hpcEFycmF5ID0gSlNPTi5wYXJzZShhcnJheVN0cmluZyk7XG4gICAgICBpZiAocmVsYXRpb25zaGlwQXJyYXkgPT09IG51bGwpIHtcbiAgICAgICAgcmVsYXRpb25zaGlwQXJyYXkgPSBbXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZWxhdGlvbnNoaXBBcnJheTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlbW92ZSh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKSB7XG4gICAgcmV0dXJuIHRoaXNbJHJlZGlzXS5nZXRBc3luYyhrZXlTdHJpbmcodCwgaWQsIHJlbGF0aW9uc2hpcCkpXG4gICAgLnRoZW4oKGFycmF5U3RyaW5nKSA9PiB7XG4gICAgICBsZXQgcmVsYXRpb25zaGlwQXJyYXkgPSBKU09OLnBhcnNlKGFycmF5U3RyaW5nKTtcbiAgICAgIGlmIChyZWxhdGlvbnNoaXBBcnJheSA9PT0gbnVsbCkge1xuICAgICAgICByZWxhdGlvbnNoaXBBcnJheSA9IFtdO1xuICAgICAgfVxuICAgICAgY29uc3QgaWR4ID0gcmVsYXRpb25zaGlwQXJyYXkuaW5kZXhPZihjaGlsZElkKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICByZWxhdGlvbnNoaXBBcnJheS5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHJlZGlzXS5zZXRBc3luYyhrZXlTdHJpbmcodCwgaWQsIHJlbGF0aW9uc2hpcCksIEpTT04uc3RyaW5naWZ5KHJlbGF0aW9uc2hpcEFycmF5KSlcbiAgICAgICAgLnRoZW4oKCkgPT4gcmVsYXRpb25zaGlwQXJyYXkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihgSXRlbSAke2NoaWxkSWR9IG5vdCBmb3VuZCBpbiAke3JlbGF0aW9uc2hpcH0gb2YgJHt0LiRuYW1lfWApKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
