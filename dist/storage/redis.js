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
    value: function read(t, id, relationship) {
      if (relationship && t.$fields[relationship].type === 'hasMany') {
        return this[$redis].getAsync(keyString(t, id, relationship)).then(function (arrayString) {
          return _defineProperty({}, relationship, JSON.parse(arrayString) || []);
        });
      } else {
        return this[$redis].getAsync(keyString(t, id)).then(function (d) {
          return JSON.parse(d);
        });
      }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvcmVkaXMuanMiXSwibmFtZXMiOlsiUHJvbWlzZSIsIlJlZGlzIiwiUmVkaXNTZXJ2aWNlIiwicHJvbWlzaWZ5QWxsIiwiJHJlZGlzIiwiU3ltYm9sIiwic2FuZU51bWJlciIsImkiLCJpc05hTiIsIkluZmluaXR5Iiwia2V5U3RyaW5nIiwidCIsImlkIiwicmVsYXRpb25zaGlwIiwidW5kZWZpbmVkIiwiJG5hbWUiLCJSZWRpc1N0b3JhZ2UiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInBvcnQiLCJob3N0IiwiZGIiLCJyZXRyeV9zdHJhdGVneSIsIm8iLCJlcnJvciIsImNvZGUiLCJFcnJvciIsInRvdGFsX3JldHJ5X3RpbWUiLCJ0aW1lc19jb25uZWN0ZWQiLCJNYXRoIiwibWF4IiwiYXR0ZW1wdCIsImNyZWF0ZUNsaWVudCIsImlzQ2FjaGUiLCJxdWl0QXN5bmMiLCJrZXlzQXN5bmMiLCJ0aGVuIiwia2V5QXJyYXkiLCJsZW5ndGgiLCJtYXAiLCJrIiwic3BsaXQiLCJwYXJzZUludCIsImZpbHRlciIsInJlZHVjZSIsImN1cnJlbnQiLCJ2IiwiJGlkIiwidXBkYXRlT2JqZWN0Iiwia2V5cyIsIiRmaWVsZHMiLCJmb3JFYWNoIiwiZmllbGROYW1lIiwidHlwZSIsImNvbmNhdCIsInRlcm1pbmFsIiwiJCRtYXhLZXkiLCJuIiwidG9TYXZlIiwic2V0QXN5bmMiLCJKU09OIiwic3RyaW5naWZ5IiwiZ2V0QXN5bmMiLCJvcmlnVmFsdWUiLCJ1cGRhdGUiLCJwYXJzZSIsImFycmF5U3RyaW5nIiwiZCIsImRlbEFzeW5jIiwiY2hpbGRJZCIsInJlbGF0aW9uc2hpcEFycmF5IiwiaW5kZXhPZiIsInB1c2giLCJpZHgiLCJzcGxpY2UiLCJyZWplY3QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQUFZQSxPOztBQUNaOztJQUFZQyxLOztBQUNaOzs7Ozs7Ozs7Ozs7QUFHQSxJQUFNQyxlQUFlRixRQUFRRyxZQUFSLENB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LEtBQUwsQ0FBV0MsV0FBWCxDQUF4QjtBQUNBLFlBQUlJLHNCQUFzQixJQUExQixFQUFnQztBQUM5QkEsOEJBQW9CLEVBQXBCO0FBQ0Q7QUFDRCxZQUFNRyxNQUFNSCxrQkFBa0JDLE9BQWxCLENBQTBCRixPQUExQixDQUFaO0FBQ0EsWUFBSUksT0FBTyxDQUFYLEVBQWM7QUFDWkgsNEJBQWtCSSxNQUFsQixDQUF5QkQsR0FBekIsRUFBOEIsQ0FBOUI7QUFDQSxpQkFBTyxPQUFLdkUsTUFBTCxFQUFheUQsUUFBYixDQUFzQm5ELFVBQVVDLENBQVYsRUFBYUMsRUFBYixFQUFpQkMsWUFBakIsQ0FBdEIsRUFBc0RpRCxLQUFLQyxTQUFMLENBQWVTLGlCQUFmLENBQXRELEVBQ05sQyxJQURNLENBQ0Q7QUFBQSxtQkFBTWtDLGlCQUFOO0FBQUEsV0FEQyxDQUFQO0FBRUQsU0FKRCxNQUlPO0FBQ0wsaUJBQU94RSxRQUFRNkUsTUFBUixDQUFlLElBQUlqRCxLQUFKLFdBQWtCMkMsT0FBbEIsc0JBQTBDMUQsWUFBMUMsWUFBNkRGLEVBQUVJLEtBQS9ELENBQWYsQ0FBUDtBQUNEO0FBQ0YsT0FkTSxDQUFQO0FBZUQiLCJmaWxlIjoic3RvcmFnZS9yZWRpcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0ICogYXMgUmVkaXMgZnJvbSAncmVkaXMnO1xuaW1wb3J0IHtTdG9yYWdlfSBmcm9tICcuL3N0b3JhZ2UnO1xuXG5cbmNvbnN0IFJlZGlzU2VydmljZSA9IFByb21pc2UucHJvbWlzaWZ5QWxsKFJlZGlzKTtcbmNvbnN0ICRyZWRpcyA9IFN5bWJvbCgnJHJlZGlzJyk7XG5cbmZ1bmN0aW9uIHNhbmVOdW1iZXIoaSkge1xuICByZXR1cm4gKCh0eXBlb2YgaSA9PT0gJ251bWJlcicpICYmICghaXNOYU4oaSkpICYmIChpICE9PSBJbmZpbml0eSkgJiAoaSAhPT0gLUluZmluaXR5KSk7XG59XG5cbmZ1bmN0aW9uIGtleVN0cmluZyh0LCBpZCwgcmVsYXRpb25zaGlwKSB7XG4gIGlmIChyZWxhdGlvbnNoaXAgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBgJHt0LiRuYW1lfTpzdG9yZToke2lkfWA7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGAke3QuJG5hbWV9OiR7cmVsYXRpb25zaGlwfToke2lkfWA7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJlZGlzU3RvcmFnZSBleHRlbmRzIFN0b3JhZ2Uge1xuXG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIHN1cGVyKG9wdHMpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIHBvcnQ6IDYzNzksXG4gICAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgICBkYjogMCxcbiAgICAgICAgcmV0cnlfc3RyYXRlZ3k6IChvKSA9PiB7XG4gICAgICAgICAgaWYgKG8uZXJyb3IuY29kZSA9PT0gJ0VDT05OUkVGVVNFRCcpIHtcbiAgICAgICAgICAgIC8vIEVuZCByZWNvbm5lY3Rpbmcgb24gYSBzcGVjaWZpYyBlcnJvciBhbmQgZmx1c2ggYWxsIGNvbW1hbmRzIHdpdGggYSBpbmRpdmlkdWFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gbmV3IEVycm9yKCdUaGUgc2VydmVyIHJlZnVzZWQgdGhlIGNvbm5lY3Rpb24nKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG8udG90YWxfcmV0cnlfdGltZSA+IDEwMDAgKiA2MCAqIDYwKSB7XG4gICAgICAgICAgICAvLyBFbmQgcmVjb25uZWN0aW5nIGFmdGVyIGEgc3BlY2lmaWMgdGltZW91dCBhbmQgZmx1c2ggYWxsIGNvbW1hbmRzIHdpdGggYSBpbmRpdmlkdWFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gbmV3IEVycm9yKCdSZXRyeSB0aW1lIGV4aGF1c3RlZCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoby50aW1lc19jb25uZWN0ZWQgPiAxMCkge1xuICAgICAgICAgICAgLy8gRW5kIHJlY29ubmVjdGluZyB3aXRoIGJ1aWx0IGluIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyByZWNvbm5lY3QgYWZ0ZXJcbiAgICAgICAgICByZXR1cm4gTWF0aC5tYXgoby5hdHRlbXB0ICogMTAwLCAzMDAwKTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBvcHRzXG4gICAgKTtcbiAgICB0aGlzWyRyZWRpc10gPSBSZWRpc1NlcnZpY2UuY3JlYXRlQ2xpZW50KG9wdGlvbnMpO1xuICAgIHRoaXMuaXNDYWNoZSA9IHRydWU7XG4gIH1cblxuICB0ZWFyZG93bigpIHtcbiAgICByZXR1cm4gdGhpc1skcmVkaXNdLnF1aXRBc3luYygpO1xuICB9XG5cbiAgJCRtYXhLZXkodCkge1xuICAgIHJldHVybiB0aGlzWyRyZWRpc10ua2V5c0FzeW5jKGAke3QuJG5hbWV9OnN0b3JlOipgKVxuICAgIC50aGVuKChrZXlBcnJheSkgPT4ge1xuICAgICAgaWYgKGtleUFycmF5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBrZXlBcnJheS5tYXAoKGspID0+IGsuc3BsaXQoJzonKVsyXSlcbiAgICAgICAgLm1hcCgoaykgPT4gcGFyc2VJbnQoaywgMTApKVxuICAgICAgICAuZmlsdGVyKChpKSA9PiBzYW5lTnVtYmVyKGkpKVxuICAgICAgICAucmVkdWNlKChtYXgsIGN1cnJlbnQpID0+IChjdXJyZW50ID4gbWF4KSA/IGN1cnJlbnQgOiBtYXgsIDApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgd3JpdGUodCwgdikge1xuICAgIGNvbnN0IGlkID0gdlt0LiRpZF07XG4gICAgY29uc3QgdXBkYXRlT2JqZWN0ID0ge307XG4gICAgT2JqZWN0LmtleXModC4kZmllbGRzKS5mb3JFYWNoKChmaWVsZE5hbWUpID0+IHtcbiAgICAgIGlmICh2W2ZpZWxkTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBjb3B5IGZyb20gdiB0byB0aGUgYmVzdCBvZiBvdXIgYWJpbGl0eVxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdhcnJheScpIHx8XG4gICAgICAgICAgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdoYXNNYW55JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSB2W2ZpZWxkTmFtZV0uY29uY2F0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IE9iamVjdC5hc3NpZ24oe30sIHZbZmllbGROYW1lXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSB2W2ZpZWxkTmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoaWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuJCRtYXhLZXkodClcbiAgICAgICAgLnRoZW4oKG4pID0+IHtcbiAgICAgICAgICBjb25zdCB0b1NhdmUgPSBPYmplY3QuYXNzaWduKHt9LCB7W3QuJGlkXTogbiArIDF9LCB1cGRhdGVPYmplY3QpO1xuICAgICAgICAgIHJldHVybiB0aGlzWyRyZWRpc10uc2V0QXN5bmMoa2V5U3RyaW5nKHQsIG4gKyAxKSwgSlNPTi5zdHJpbmdpZnkodG9TYXZlKSlcbiAgICAgICAgICAudGhlbigoKSA9PiB0b1NhdmUpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBuZXcgY29udGVudCBpbiBhIG5vbi10ZXJtaW5hbCBzdG9yZScpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpc1skcmVkaXNdLmdldEFzeW5jKGtleVN0cmluZyh0LCBpZCkpXG4gICAgICAudGhlbigob3JpZ1ZhbHVlKSA9PiB7XG4gICAgICAgIGNvbnN0IHVwZGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sIEpTT04ucGFyc2Uob3JpZ1ZhbHVlKSwgdXBkYXRlT2JqZWN0KTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHJlZGlzXS5zZXRBc3luYyhrZXlTdHJpbmcodCwgaWQpLCBKU09OLnN0cmluZ2lmeSh1cGRhdGUpKVxuICAgICAgICAudGhlbigoKSA9PiB1cGRhdGUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmVhZCh0LCBpZCwgcmVsYXRpb25zaGlwKSB7XG4gICAgaWYgKHJlbGF0aW9uc2hpcCAmJiAodC4kZmllbGRzW3JlbGF0aW9uc2hpcF0udHlwZSA9PT0gJ2hhc01hbnknKSkge1xuICAgICAgcmV0dXJuIHRoaXNbJHJlZGlzXS5nZXRBc3luYyhrZXlTdHJpbmcodCwgaWQsIHJlbGF0aW9uc2hpcCkpXG4gICAgICAudGhlbigoYXJyYXlTdHJpbmcpID0+IHtcbiAgICAgICAgcmV0dXJuIHtbcmVsYXRpb25zaGlwXTogKEpTT04ucGFyc2UoYXJyYXlTdHJpbmcpIHx8IFtdKX07XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXNbJHJlZGlzXS5nZXRBc3luYyhrZXlTdHJpbmcodCwgaWQpKVxuICAgICAgLnRoZW4oKGQpID0+IEpTT04ucGFyc2UoZCkpO1xuICAgIH1cbiAgfVxuXG4gIGRlbGV0ZSh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzWyRyZWRpc10uZGVsQXN5bmMoa2V5U3RyaW5nKHQsIGlkKSk7XG4gIH1cblxuICBhZGQodCwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCkge1xuICAgIHJldHVybiB0aGlzWyRyZWRpc10uZ2V0QXN5bmMoa2V5U3RyaW5nKHQsIGlkLCByZWxhdGlvbnNoaXApKVxuICAgIC50aGVuKChhcnJheVN0cmluZykgPT4ge1xuICAgICAgbGV0IHJlbGF0aW9uc2hpcEFycmF5ID0gSlNPTi5wYXJzZShhcnJheVN0cmluZyk7XG4gICAgICBpZiAocmVsYXRpb25zaGlwQXJyYXkgPT09IG51bGwpIHtcbiAgICAgICAgcmVsYXRpb25zaGlwQXJyYXkgPSBbXTtcbiAgICAgIH1cbiAgICAgIGlmIChyZWxhdGlvbnNoaXBBcnJheS5pbmRleE9mKGNoaWxkSWQpIDwgMCkge1xuICAgICAgICByZWxhdGlvbnNoaXBBcnJheS5wdXNoKGNoaWxkSWQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXNbJHJlZGlzXS5zZXRBc3luYyhrZXlTdHJpbmcodCwgaWQsIHJlbGF0aW9uc2hpcCksIEpTT04uc3RyaW5naWZ5KHJlbGF0aW9uc2hpcEFycmF5KSlcbiAgICAgIC50aGVuKCgpID0+IHJlbGF0aW9uc2hpcEFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlbW92ZSh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKSB7XG4gICAgcmV0dXJuIHRoaXNbJHJlZGlzXS5nZXRBc3luYyhrZXlTdHJpbmcodCwgaWQsIHJlbGF0aW9uc2hpcCkpXG4gICAgLnRoZW4oKGFycmF5U3RyaW5nKSA9PiB7XG4gICAgICBsZXQgcmVsYXRpb25zaGlwQXJyYXkgPSBKU09OLnBhcnNlKGFycmF5U3RyaW5nKTtcbiAgICAgIGlmIChyZWxhdGlvbnNoaXBBcnJheSA9PT0gbnVsbCkge1xuICAgICAgICByZWxhdGlvbnNoaXBBcnJheSA9IFtdO1xuICAgICAgfVxuICAgICAgY29uc3QgaWR4ID0gcmVsYXRpb25zaGlwQXJyYXkuaW5kZXhPZihjaGlsZElkKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICByZWxhdGlvbnNoaXBBcnJheS5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHJlZGlzXS5zZXRBc3luYyhrZXlTdHJpbmcodCwgaWQsIHJlbGF0aW9uc2hpcCksIEpTT04uc3RyaW5naWZ5KHJlbGF0aW9uc2hpcEFycmF5KSlcbiAgICAgICAgLnRoZW4oKCkgPT4gcmVsYXRpb25zaGlwQXJyYXkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihgSXRlbSAke2NoaWxkSWR9IG5vdCBmb3VuZCBpbiAke3JlbGF0aW9uc2hpcH0gb2YgJHt0LiRuYW1lfWApKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
