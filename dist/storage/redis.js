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
    value: function add(t, id, relationship, childId, extras) {
      var _this3 = this;

      return this[$redis].getAsync(keyString(t, id, relationship)).then(function (arrayString) {
        var relationshipArray = JSON.parse(arrayString);
        if (relationshipArray === null) {
          relationshipArray = [];
        }
        var newRelationship = _defineProperty({}, t.$id, childId);
        (t.$fields[relationship].extras || []).forEach(function (e) {
          newRelationship[e] = extras[e];
        });
        relationshipArray.push(newRelationship);
        return _this3[$redis].setAsync(keyString(t, id, relationship), JSON.stringify(relationshipArray)).then(function () {
          return relationshipArray;
        });
      });
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(t, id, relationship, childId, extras) {
      var _this4 = this;

      return this[$redis].getAsync(keyString(t, id, relationship)).then(function (arrayString) {
        var relationshipArray = JSON.parse(arrayString);
        if (relationshipArray === null) {
          relationshipArray = [];
        }
        var idx = relationshipArray.findIndex(function (v) {
          return v[t.$id] === childId;
        });
        if (idx >= 0) {
          relationshipArray[idx] = Object.assign({}, relationshipArray[idx], extras);
          return _this4[$redis].setAsync(keyString(t, id, relationship), JSON.stringify(relationshipArray)).then(function () {
            return relationshipArray;
          });
        } else {
          return Promise.reject(new Error('Item ' + childId + ' not found in ' + relationship + ' of ' + t.$name));
        }
      });
    }
  }, {
    key: 'remove',
    value: function remove(t, id, relationship, childId) {
      var _this5 = this;

      return this[$redis].getAsync(keyString(t, id, relationship)).then(function (arrayString) {
        var relationshipArray = JSON.parse(arrayString);
        if (relationshipArray === null) {
          relationshipArray = [];
        }
        var idx = relationshipArray.findIndex(function (v) {
          return v[t.$id] === childId;
        });
        if (idx >= 0) {
          relationshipArray.splice(idx, 1);
          return _this5[$redis].setAsync(keyString(t, id, relationship), JSON.stringify(relationshipArray)).then(function () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvcmVkaXMuanMiXSwibmFtZXMiOlsiUHJvbWlzZSIsIlJlZGlzIiwiUmVkaXNTZXJ2aWNlIiwicHJvbWlzaWZ5QWxsIiwiJHJlZGlzIiwiU3ltYm9sIiwic2FuZU51bWJlciIsImkiLCJpc05hTiIsIkluZmluaXR5Iiwia2V5U3RyaW5nIiwidCIsImlkIiwicmVsYXRpb25zaGlwIiwidW5kZWZpbmVkIiwiJG5hbWUiLCJSZWRpc1N0b3JhZ2UiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInBvcnQiLCJob3N0IiwiZGIiLCJyZXRyeV9zdHJhdGVneSIsIm8iLCJlcnJvciIsImNvZGUiLCJFcnJvciIsInRvdGFsX3JldHJ5X3RpbWUiLCJ0aW1lc19jb25uZWN0ZWQiLCJNYXRoIiwibWF4IiwiYXR0ZW1wdCIsImNyZWF0ZUNsaWVudCIsImlzQ2FjaGUiLCJxdWl0QXN5bmMiLCJrZXlzQXN5bmMiLCJ0aGVuIiwia2V5QXJyYXkiLCJsZW5ndGgiLCJtYXAiLCJrIiwic3BsaXQiLCJwYXJzZUludCIsImZpbHRlciIsInJlZHVjZSIsImN1cnJlbnQiLCJ2IiwiJGlkIiwidXBkYXRlT2JqZWN0Iiwia2V5cyIsIiRmaWVsZHMiLCJmb3JFYWNoIiwiZmllbGROYW1lIiwidHlwZSIsImNvbmNhdCIsInRlcm1pbmFsIiwiJCRtYXhLZXkiLCJuIiwidG9TYXZlIiwic2V0QXN5bmMiLCJKU09OIiwic3RyaW5naWZ5IiwiZ2V0QXN5bmMiLCJvcmlnVmFsdWUiLCJ1cGRhdGUiLCJwYXJzZSIsImFycmF5U3RyaW5nIiwiZCIsImRlbEFzeW5jIiwiY2hpbGRJZCIsImV4dHJhcyIsInJlbGF0aW9uc2hpcEFycmF5IiwibmV3UmVsYXRpb25zaGlwIiwiZSIsInB1c2giLCJpZHgiLCJmaW5kSW5kZXgiLCJyZWplY3QiLCJzcGxpY2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQUFZQSxPOztBQUNaOztJQUFZQyxLOztBQUNaOzs7Ozs7Ozs7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LENBQXNCdEQsVUFBVUMsQ0FBVixFQUFhQyxFQUFiLEVBQWlCQyxZQUFqQixDQUF0QixFQUNOeUIsSUFETSxDQUNELFVBQUM4QixXQUFELEVBQWlCO0FBQ3JCLFlBQUlLLG9CQUFvQlgsS0FBS0ssS0FBTCxDQUFXQyxXQUFYLENBQXhCO0FBQ0EsWUFBSUssc0JBQXNCLElBQTFCLEVBQWdDO0FBQzlCQSw4QkFBb0IsRUFBcEI7QUFDRDtBQUNELFlBQU1JLE1BQU1KLGtCQUFrQkssU0FBbEIsQ0FBNEIsVUFBQzlCLENBQUQ7QUFBQSxpQkFBT0EsRUFBRXJDLEVBQUVzQyxHQUFKLE1BQWFzQixPQUFwQjtBQUFBLFNBQTVCLENBQVo7QUFDQSxZQUFJTSxPQUFPLENBQVgsRUFBYztBQUNaSiw0QkFBa0JPLE1BQWxCLENBQXlCSCxHQUF6QixFQUE4QixDQUE5QjtBQUNBLGlCQUFPLE9BQUt6RSxNQUFMLEVBQWF5RCxRQUFiLENBQXNCbkQsVUFBVUMsQ0FBVixFQUFhQyxFQUFiLEVBQWlCQyxZQUFqQixDQUF0QixFQUFzRGlELEtBQUtDLFNBQUwsQ0FBZVUsaUJBQWYsQ0FBdEQsRUFDTm5DLElBRE0sQ0FDRDtBQUFBLG1CQUFNbUMsaUJBQU47QUFBQSxXQURDLENBQVA7QUFFRCxTQUpELE1BSU87QUFDTCxpQkFBT3pFLFFBQVErRSxNQUFSLENBQWUsSUFBSW5ELEtBQUosV0FBa0IyQyxPQUFsQixzQkFBMEMxRCxZQUExQyxZQUE2REYsRUFBRUksS0FBL0QsQ0FBZixDQUFQO0FBQ0Q7QUFDRixPQWRNLENBQVA7QUFlRCIsImZpbGUiOiJzdG9yYWdlL3JlZGlzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgKiBhcyBSZWRpcyBmcm9tICdyZWRpcyc7XG5pbXBvcnQge1N0b3JhZ2V9IGZyb20gJy4vc3RvcmFnZSc7XG5cblxuY29uc3QgUmVkaXNTZXJ2aWNlID0gUHJvbWlzZS5wcm9taXNpZnlBbGwoUmVkaXMpO1xuY29uc3QgJHJlZGlzID0gU3ltYm9sKCckcmVkaXMnKTtcblxuZnVuY3Rpb24gc2FuZU51bWJlcihpKSB7XG4gIHJldHVybiAoKHR5cGVvZiBpID09PSAnbnVtYmVyJykgJiYgKCFpc05hTihpKSkgJiYgKGkgIT09IEluZmluaXR5KSAmIChpICE9PSAtSW5maW5pdHkpKTtcbn1cblxuZnVuY3Rpb24ga2V5U3RyaW5nKHQsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgaWYgKHJlbGF0aW9uc2hpcCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGAke3QuJG5hbWV9OnN0b3JlOiR7aWR9YDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYCR7dC4kbmFtZX06JHtyZWxhdGlvbnNoaXB9OiR7aWR9YDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmVkaXNTdG9yYWdlIGV4dGVuZHMgU3RvcmFnZSB7XG5cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgc3VwZXIob3B0cyk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHtcbiAgICAgICAgcG9ydDogNjM3OSxcbiAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgICAgIGRiOiAwLFxuICAgICAgICByZXRyeV9zdHJhdGVneTogKG8pID0+IHtcbiAgICAgICAgICBpZiAoby5lcnJvci5jb2RlID09PSAnRUNPTk5SRUZVU0VEJykge1xuICAgICAgICAgICAgLy8gRW5kIHJlY29ubmVjdGluZyBvbiBhIHNwZWNpZmljIGVycm9yIGFuZCBmbHVzaCBhbGwgY29tbWFuZHMgd2l0aCBhIGluZGl2aWR1YWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXJyb3IoJ1RoZSBzZXJ2ZXIgcmVmdXNlZCB0aGUgY29ubmVjdGlvbicpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoby50b3RhbF9yZXRyeV90aW1lID4gMTAwMCAqIDYwICogNjApIHtcbiAgICAgICAgICAgIC8vIEVuZCByZWNvbm5lY3RpbmcgYWZ0ZXIgYSBzcGVjaWZpYyB0aW1lb3V0IGFuZCBmbHVzaCBhbGwgY29tbWFuZHMgd2l0aCBhIGluZGl2aWR1YWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXJyb3IoJ1JldHJ5IHRpbWUgZXhoYXVzdGVkJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChvLnRpbWVzX2Nvbm5lY3RlZCA+IDEwKSB7XG4gICAgICAgICAgICAvLyBFbmQgcmVjb25uZWN0aW5nIHdpdGggYnVpbHQgaW4gZXJyb3JcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHJlY29ubmVjdCBhZnRlclxuICAgICAgICAgIHJldHVybiBNYXRoLm1heChvLmF0dGVtcHQgKiAxMDAsIDMwMDApO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIG9wdHNcbiAgICApO1xuICAgIHRoaXNbJHJlZGlzXSA9IFJlZGlzU2VydmljZS5jcmVhdGVDbGllbnQob3B0aW9ucyk7XG4gICAgdGhpcy5pc0NhY2hlID0gdHJ1ZTtcbiAgfVxuXG4gIHRlYXJkb3duKCkge1xuICAgIHJldHVybiB0aGlzWyRyZWRpc10ucXVpdEFzeW5jKCk7XG4gIH1cblxuICAkJG1heEtleSh0KSB7XG4gICAgcmV0dXJuIHRoaXNbJHJlZGlzXS5rZXlzQXN5bmMoYCR7dC4kbmFtZX06c3RvcmU6KmApXG4gICAgLnRoZW4oKGtleUFycmF5KSA9PiB7XG4gICAgICBpZiAoa2V5QXJyYXkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGtleUFycmF5Lm1hcCgoaykgPT4gay5zcGxpdCgnOicpWzJdKVxuICAgICAgICAubWFwKChrKSA9PiBwYXJzZUludChrLCAxMCkpXG4gICAgICAgIC5maWx0ZXIoKGkpID0+IHNhbmVOdW1iZXIoaSkpXG4gICAgICAgIC5yZWR1Y2UoKG1heCwgY3VycmVudCkgPT4gKGN1cnJlbnQgPiBtYXgpID8gY3VycmVudCA6IG1heCwgMCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICB3cml0ZSh0LCB2KSB7XG4gICAgY29uc3QgaWQgPSB2W3QuJGlkXTtcbiAgICBjb25zdCB1cGRhdGVPYmplY3QgPSB7fTtcbiAgICBPYmplY3Qua2V5cyh0LiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgaWYgKHZbZmllbGROYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGNvcHkgZnJvbSB2IHRvIHRoZSBiZXN0IG9mIG91ciBhYmlsaXR5XG4gICAgICAgIGlmIChcbiAgICAgICAgICAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2FycmF5JykgfHxcbiAgICAgICAgICAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2hhc01hbnknKVxuICAgICAgICApIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IHZbZmllbGROYW1lXS5jb25jYXQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0LiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgdltmaWVsZE5hbWVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IHZbZmllbGROYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChpZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodGhpcy50ZXJtaW5hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy4kJG1heEtleSh0KVxuICAgICAgICAudGhlbigobikgPT4ge1xuICAgICAgICAgIGNvbnN0IHRvU2F2ZSA9IE9iamVjdC5hc3NpZ24oe30sIHtbdC4kaWRdOiBuICsgMX0sIHVwZGF0ZU9iamVjdCk7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJHJlZGlzXS5zZXRBc3luYyhrZXlTdHJpbmcodCwgbiArIDEpLCBKU09OLnN0cmluZ2lmeSh0b1NhdmUpKVxuICAgICAgICAgIC50aGVuKCgpID0+IHRvU2F2ZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIG5ldyBjb250ZW50IGluIGEgbm9uLXRlcm1pbmFsIHN0b3JlJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzWyRyZWRpc10uZ2V0QXN5bmMoa2V5U3RyaW5nKHQsIGlkKSlcbiAgICAgIC50aGVuKChvcmlnVmFsdWUpID0+IHtcbiAgICAgICAgY29uc3QgdXBkYXRlID0gT2JqZWN0LmFzc2lnbih7fSwgSlNPTi5wYXJzZShvcmlnVmFsdWUpLCB1cGRhdGVPYmplY3QpO1xuICAgICAgICByZXR1cm4gdGhpc1skcmVkaXNdLnNldEFzeW5jKGtleVN0cmluZyh0LCBpZCksIEpTT04uc3RyaW5naWZ5KHVwZGF0ZSkpXG4gICAgICAgIC50aGVuKCgpID0+IHVwZGF0ZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZWFkKHQsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgICBpZiAocmVsYXRpb25zaGlwICYmICh0LiRmaWVsZHNbcmVsYXRpb25zaGlwXS50eXBlID09PSAnaGFzTWFueScpKSB7XG4gICAgICByZXR1cm4gdGhpc1skcmVkaXNdLmdldEFzeW5jKGtleVN0cmluZyh0LCBpZCwgcmVsYXRpb25zaGlwKSlcbiAgICAgIC50aGVuKChhcnJheVN0cmluZykgPT4ge1xuICAgICAgICByZXR1cm4ge1tyZWxhdGlvbnNoaXBdOiAoSlNPTi5wYXJzZShhcnJheVN0cmluZykgfHwgW10pfTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpc1skcmVkaXNdLmdldEFzeW5jKGtleVN0cmluZyh0LCBpZCkpXG4gICAgICAudGhlbigoZCkgPT4gSlNPTi5wYXJzZShkKSk7XG4gICAgfVxuICB9XG5cbiAgZGVsZXRlKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXNbJHJlZGlzXS5kZWxBc3luYyhrZXlTdHJpbmcodCwgaWQpKTtcbiAgfVxuXG4gIGFkZCh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkLCBleHRyYXMpIHtcbiAgICByZXR1cm4gdGhpc1skcmVkaXNdLmdldEFzeW5jKGtleVN0cmluZyh0LCBpZCwgcmVsYXRpb25zaGlwKSlcbiAgICAudGhlbigoYXJyYXlTdHJpbmcpID0+IHtcbiAgICAgIGxldCByZWxhdGlvbnNoaXBBcnJheSA9IEpTT04ucGFyc2UoYXJyYXlTdHJpbmcpO1xuICAgICAgaWYgKHJlbGF0aW9uc2hpcEFycmF5ID09PSBudWxsKSB7XG4gICAgICAgIHJlbGF0aW9uc2hpcEFycmF5ID0gW107XG4gICAgICB9XG4gICAgICBjb25zdCBuZXdSZWxhdGlvbnNoaXAgPSB7W3QuJGlkXTogY2hpbGRJZH07XG4gICAgICAodC4kZmllbGRzW3JlbGF0aW9uc2hpcF0uZXh0cmFzIHx8IFtdKS5mb3JFYWNoKChlKSA9PiB7XG4gICAgICAgIG5ld1JlbGF0aW9uc2hpcFtlXSA9IGV4dHJhc1tlXTtcbiAgICAgIH0pO1xuICAgICAgcmVsYXRpb25zaGlwQXJyYXkucHVzaChuZXdSZWxhdGlvbnNoaXApO1xuICAgICAgcmV0dXJuIHRoaXNbJHJlZGlzXS5zZXRBc3luYyhrZXlTdHJpbmcodCwgaWQsIHJlbGF0aW9uc2hpcCksIEpTT04uc3RyaW5naWZ5KHJlbGF0aW9uc2hpcEFycmF5KSlcbiAgICAgIC50aGVuKCgpID0+IHJlbGF0aW9uc2hpcEFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIG1vZGlmeVJlbGF0aW9uc2hpcCh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkLCBleHRyYXMpIHtcbiAgICByZXR1cm4gdGhpc1skcmVkaXNdLmdldEFzeW5jKGtleVN0cmluZyh0LCBpZCwgcmVsYXRpb25zaGlwKSlcbiAgICAudGhlbigoYXJyYXlTdHJpbmcpID0+IHtcbiAgICAgIGxldCByZWxhdGlvbnNoaXBBcnJheSA9IEpTT04ucGFyc2UoYXJyYXlTdHJpbmcpO1xuICAgICAgaWYgKHJlbGF0aW9uc2hpcEFycmF5ID09PSBudWxsKSB7XG4gICAgICAgIHJlbGF0aW9uc2hpcEFycmF5ID0gW107XG4gICAgICB9XG4gICAgICBjb25zdCBpZHggPSByZWxhdGlvbnNoaXBBcnJheS5maW5kSW5kZXgoKHYpID0+IHZbdC4kaWRdID09PSBjaGlsZElkKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICByZWxhdGlvbnNoaXBBcnJheVtpZHhdID0gT2JqZWN0LmFzc2lnbihcbiAgICAgICAgICB7fSxcbiAgICAgICAgICByZWxhdGlvbnNoaXBBcnJheVtpZHhdLFxuICAgICAgICAgIGV4dHJhc1xuICAgICAgICApO1xuICAgICAgICByZXR1cm4gdGhpc1skcmVkaXNdLnNldEFzeW5jKGtleVN0cmluZyh0LCBpZCwgcmVsYXRpb25zaGlwKSwgSlNPTi5zdHJpbmdpZnkocmVsYXRpb25zaGlwQXJyYXkpKVxuICAgICAgICAudGhlbigoKSA9PiByZWxhdGlvbnNoaXBBcnJheSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGBJdGVtICR7Y2hpbGRJZH0gbm90IGZvdW5kIGluICR7cmVsYXRpb25zaGlwfSBvZiAke3QuJG5hbWV9YCkpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcmVtb3ZlKHQsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQpIHtcbiAgICByZXR1cm4gdGhpc1skcmVkaXNdLmdldEFzeW5jKGtleVN0cmluZyh0LCBpZCwgcmVsYXRpb25zaGlwKSlcbiAgICAudGhlbigoYXJyYXlTdHJpbmcpID0+IHtcbiAgICAgIGxldCByZWxhdGlvbnNoaXBBcnJheSA9IEpTT04ucGFyc2UoYXJyYXlTdHJpbmcpO1xuICAgICAgaWYgKHJlbGF0aW9uc2hpcEFycmF5ID09PSBudWxsKSB7XG4gICAgICAgIHJlbGF0aW9uc2hpcEFycmF5ID0gW107XG4gICAgICB9XG4gICAgICBjb25zdCBpZHggPSByZWxhdGlvbnNoaXBBcnJheS5maW5kSW5kZXgoKHYpID0+IHZbdC4kaWRdID09PSBjaGlsZElkKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICByZWxhdGlvbnNoaXBBcnJheS5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHJlZGlzXS5zZXRBc3luYyhrZXlTdHJpbmcodCwgaWQsIHJlbGF0aW9uc2hpcCksIEpTT04uc3RyaW5naWZ5KHJlbGF0aW9uc2hpcEFycmF5KSlcbiAgICAgICAgLnRoZW4oKCkgPT4gcmVsYXRpb25zaGlwQXJyYXkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihgSXRlbSAke2NoaWxkSWR9IG5vdCBmb3VuZCBpbiAke3JlbGF0aW9uc2hpcH0gb2YgJHt0LiRuYW1lfWApKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
