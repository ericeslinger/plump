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
    return t.$fields[relationship].relationship.$name + ':' + relationship + ':' + id;
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
    key: 'readOne',
    value: function readOne(t, id) {
      return this[$redis].getAsync(keyString(t, id)).then(function (d) {
        return JSON.parse(d);
      });
    }
  }, {
    key: 'readMany',
    value: function readMany(t, id, relationship) {
      return this[$redis].getAsync(keyString(t, id, relationship)).then(function (arrayString) {
        return _defineProperty({}, relationship, JSON.parse(arrayString) || []);
      });
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

      var Rel = t.$fields[relationship].relationship;
      var thisKeyString = keyString(t, id, relationship);
      var otherKeyString = keyString(Rel.otherType(relationship).type, childId, Rel.other(relationship));
      return this[$redis].getAsync(thisKeyString).then(function (arrayString) {
        var _newRelationship;

        var relationshipArray = JSON.parse(arrayString);
        if (relationshipArray === null) {
          relationshipArray = [];
        }
        var newRelationship = (_newRelationship = {}, _defineProperty(_newRelationship, Rel.$sides[relationship].field, childId), _defineProperty(_newRelationship, Rel.otherType(relationship).field, id), _newRelationship);
        (t.$fields[relationship].relationship.$extras || []).forEach(function (e) {
          newRelationship[e] = extras[e];
        });
        relationshipArray.push(newRelationship);
        return Promise.all([_this3[$redis].setAsync(thisKeyString, JSON.stringify(relationshipArray)), _this3[$redis].setAsync(otherKeyString, JSON.stringify(relationshipArray))]).then(function () {
          return relationshipArray;
        });
      });
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(t, id, relationship, childId, extras) {
      var _this4 = this;

      var Rel = t.$fields[relationship].relationship;
      var thisKeyString = keyString(t, id, relationship);
      var otherKeyString = keyString(Rel.otherType(relationship).type, childId, Rel.other(relationship));
      var otherField = Rel.$sides[relationship];
      var selfField = Rel.otherType(relationship);
      return this[$redis].getAsync(thisKeyString).then(function (arrayString) {
        var relationshipArray = JSON.parse(arrayString);
        if (relationshipArray === null) {
          relationshipArray = [];
        }
        var idx = relationshipArray.findIndex(function (v) {
          return v[selfField.field] === id && v[otherField.field] === childId;
        });
        if (idx >= 0) {
          relationshipArray[idx] = Object.assign({}, relationshipArray[idx], extras);
          return Promise.all([_this4[$redis].setAsync(thisKeyString, JSON.stringify(relationshipArray)), _this4[$redis].setAsync(otherKeyString, JSON.stringify(relationshipArray))]).then(function () {
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

      var Rel = t.$fields[relationship].relationship;
      var thisKeyString = keyString(t, id, relationship);
      var otherKeyString = keyString(Rel.otherType(relationship).type, childId, Rel.other(relationship));
      var otherField = Rel.$sides[relationship];
      var selfField = Rel.otherType(relationship);
      return this[$redis].getAsync(thisKeyString).then(function (arrayString) {
        var relationshipArray = JSON.parse(arrayString);
        if (relationshipArray === null) {
          relationshipArray = [];
        }
        var idx = relationshipArray.findIndex(function (v) {
          return v[selfField.field] === id && v[otherField.field] === childId;
        });
        if (idx >= 0) {
          relationshipArray.splice(idx, 1);
          return Promise.all([_this5[$redis].setAsync(thisKeyString, JSON.stringify(relationshipArray)), _this5[$redis].setAsync(otherKeyString, JSON.stringify(relationshipArray))]).then(function () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvcmVkaXMuanMiXSwibmFtZXMiOlsiUHJvbWlzZSIsIlJlZGlzIiwiUmVkaXNTZXJ2aWNlIiwicHJvbWlzaWZ5QWxsIiwiJHJlZGlzIiwiU3ltYm9sIiwic2FuZU51bWJlciIsImkiLCJpc05hTiIsIkluZmluaXR5Iiwia2V5U3RyaW5nIiwidCIsImlkIiwicmVsYXRpb25zaGlwIiwidW5kZWZpbmVkIiwiJG5hbWUiLCIkZmllbGRzIiwiUmVkaXNTdG9yYWdlIiwib3B0cyIsIm9wdGlvbnMiLCJPYmplY3QiLCJhc3NpZ24iLCJwb3J0IiwiaG9zdCIsImRiIiwicmV0cnlfc3RyYXRlZ3kiLCJvIiwiZXJyb3IiLCJjb2RlIiwiRXJyb3IiLCJ0b3RhbF9yZXRyeV90aW1lIiwidGltZXNfY29ubmVjdGVkIiwiTWF0aCIsIm1heCIsImF0dGVtcHQiLCJjcmVhdGVDbGllbnQiLCJpc0NhY2hlIiwicXVpdEFzeW5jIiwia2V5c0FzeW5jIiwidGhlbiIsImtleUFycmF5IiwibGVuZ3RoIiwibWFwIiwiayIsInNwbGl0IiwicGFyc2VJbnQiLCJmaWx0ZXIiLCJyZWR1Y2UiLCJjdXJyZW50IiwidiIsIiRpZCIsInVwZGF0ZU9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwiZmllbGROYW1lIiwidHlwZSIsImNvbmNhdCIsInRlcm1pbmFsIiwiJCRtYXhLZXkiLCJuIiwidG9TYXZlIiwic2V0QXN5bmMiLCJKU09OIiwic3RyaW5naWZ5IiwiZ2V0QXN5bmMiLCJvcmlnVmFsdWUiLCJ1cGRhdGUiLCJwYXJzZSIsImQiLCJhcnJheVN0cmluZyIsImRlbEFzeW5jIiwiY2hpbGRJZCIsImV4dHJhcyIsIlJlbCIsInRoaXNLZXlTdHJpbmciLCJvdGhlcktleVN0cmluZyIsIm90aGVyVHlwZSIsIm90aGVyIiwicmVsYXRpb25zaGlwQXJyYXkiLCJuZXdSZWxhdGlvbnNoaXAiLCIkc2lkZXMiLCJmaWVsZCIsIiRleHRyYXMiLCJlIiwicHVzaCIsImFsbCIsIm90aGVyRmll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QVosRUFJTnZDLElBSk0sQ0FJRDtBQUFBLG1CQUFNdUMsaUJBQU47QUFBQSxXQUpDLENBQVA7QUFLRCxTQVBELE1BT087QUFDTCxpQkFBTzlFLFFBQVEwRixNQUFSLENBQWUsSUFBSTdELEtBQUosV0FBa0IwQyxPQUFsQixzQkFBMEMxRCxZQUExQyxZQUE2REYsRUFBRUksS0FBL0QsQ0FBZixDQUFQO0FBQ0Q7QUFDRixPQW5CTSxDQUFQO0FBb0JEIiwiZmlsZSI6InN0b3JhZ2UvcmVkaXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCAqIGFzIFJlZGlzIGZyb20gJ3JlZGlzJztcbmltcG9ydCB7U3RvcmFnZX0gZnJvbSAnLi9zdG9yYWdlJztcblxuXG5jb25zdCBSZWRpc1NlcnZpY2UgPSBQcm9taXNlLnByb21pc2lmeUFsbChSZWRpcyk7XG5jb25zdCAkcmVkaXMgPSBTeW1ib2woJyRyZWRpcycpO1xuXG5mdW5jdGlvbiBzYW5lTnVtYmVyKGkpIHtcbiAgcmV0dXJuICgodHlwZW9mIGkgPT09ICdudW1iZXInKSAmJiAoIWlzTmFOKGkpKSAmJiAoaSAhPT0gSW5maW5pdHkpICYgKGkgIT09IC1JbmZpbml0eSkpO1xufVxuXG5mdW5jdGlvbiBrZXlTdHJpbmcodCwgaWQsIHJlbGF0aW9uc2hpcCkge1xuICBpZiAocmVsYXRpb25zaGlwID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gYCR7dC4kbmFtZX06c3RvcmU6JHtpZH1gO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBgJHt0LiRmaWVsZHNbcmVsYXRpb25zaGlwXS5yZWxhdGlvbnNoaXAuJG5hbWV9OiR7cmVsYXRpb25zaGlwfToke2lkfWA7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJlZGlzU3RvcmFnZSBleHRlbmRzIFN0b3JhZ2Uge1xuXG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIHN1cGVyKG9wdHMpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIHBvcnQ6IDYzNzksXG4gICAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgICBkYjogMCxcbiAgICAgICAgcmV0cnlfc3RyYXRlZ3k6IChvKSA9PiB7XG4gICAgICAgICAgaWYgKG8uZXJyb3IuY29kZSA9PT0gJ0VDT05OUkVGVVNFRCcpIHtcbiAgICAgICAgICAgIC8vIEVuZCByZWNvbm5lY3Rpbmcgb24gYSBzcGVjaWZpYyBlcnJvciBhbmQgZmx1c2ggYWxsIGNvbW1hbmRzIHdpdGggYSBpbmRpdmlkdWFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gbmV3IEVycm9yKCdUaGUgc2VydmVyIHJlZnVzZWQgdGhlIGNvbm5lY3Rpb24nKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG8udG90YWxfcmV0cnlfdGltZSA+IDEwMDAgKiA2MCAqIDYwKSB7XG4gICAgICAgICAgICAvLyBFbmQgcmVjb25uZWN0aW5nIGFmdGVyIGEgc3BlY2lmaWMgdGltZW91dCBhbmQgZmx1c2ggYWxsIGNvbW1hbmRzIHdpdGggYSBpbmRpdmlkdWFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gbmV3IEVycm9yKCdSZXRyeSB0aW1lIGV4aGF1c3RlZCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoby50aW1lc19jb25uZWN0ZWQgPiAxMCkge1xuICAgICAgICAgICAgLy8gRW5kIHJlY29ubmVjdGluZyB3aXRoIGJ1aWx0IGluIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyByZWNvbm5lY3QgYWZ0ZXJcbiAgICAgICAgICByZXR1cm4gTWF0aC5tYXgoby5hdHRlbXB0ICogMTAwLCAzMDAwKTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBvcHRzXG4gICAgKTtcbiAgICB0aGlzWyRyZWRpc10gPSBSZWRpc1NlcnZpY2UuY3JlYXRlQ2xpZW50KG9wdGlvbnMpO1xuICAgIHRoaXMuaXNDYWNoZSA9IHRydWU7XG4gIH1cblxuICB0ZWFyZG93bigpIHtcbiAgICByZXR1cm4gdGhpc1skcmVkaXNdLnF1aXRBc3luYygpO1xuICB9XG5cbiAgJCRtYXhLZXkodCkge1xuICAgIHJldHVybiB0aGlzWyRyZWRpc10ua2V5c0FzeW5jKGAke3QuJG5hbWV9OnN0b3JlOipgKVxuICAgIC50aGVuKChrZXlBcnJheSkgPT4ge1xuICAgICAgaWYgKGtleUFycmF5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBrZXlBcnJheS5tYXAoKGspID0+IGsuc3BsaXQoJzonKVsyXSlcbiAgICAgICAgLm1hcCgoaykgPT4gcGFyc2VJbnQoaywgMTApKVxuICAgICAgICAuZmlsdGVyKChpKSA9PiBzYW5lTnVtYmVyKGkpKVxuICAgICAgICAucmVkdWNlKChtYXgsIGN1cnJlbnQpID0+IChjdXJyZW50ID4gbWF4KSA/IGN1cnJlbnQgOiBtYXgsIDApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgd3JpdGUodCwgdikge1xuICAgIGNvbnN0IGlkID0gdlt0LiRpZF07XG4gICAgY29uc3QgdXBkYXRlT2JqZWN0ID0ge307XG4gICAgT2JqZWN0LmtleXModC4kZmllbGRzKS5mb3JFYWNoKChmaWVsZE5hbWUpID0+IHtcbiAgICAgIGlmICh2W2ZpZWxkTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBjb3B5IGZyb20gdiB0byB0aGUgYmVzdCBvZiBvdXIgYWJpbGl0eVxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdhcnJheScpIHx8XG4gICAgICAgICAgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdoYXNNYW55JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSB2W2ZpZWxkTmFtZV0uY29uY2F0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IE9iamVjdC5hc3NpZ24oe30sIHZbZmllbGROYW1lXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSB2W2ZpZWxkTmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoaWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuJCRtYXhLZXkodClcbiAgICAgICAgLnRoZW4oKG4pID0+IHtcbiAgICAgICAgICBjb25zdCB0b1NhdmUgPSBPYmplY3QuYXNzaWduKHt9LCB7W3QuJGlkXTogbiArIDF9LCB1cGRhdGVPYmplY3QpO1xuICAgICAgICAgIHJldHVybiB0aGlzWyRyZWRpc10uc2V0QXN5bmMoa2V5U3RyaW5nKHQsIG4gKyAxKSwgSlNPTi5zdHJpbmdpZnkodG9TYXZlKSlcbiAgICAgICAgICAudGhlbigoKSA9PiB0b1NhdmUpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBuZXcgY29udGVudCBpbiBhIG5vbi10ZXJtaW5hbCBzdG9yZScpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpc1skcmVkaXNdLmdldEFzeW5jKGtleVN0cmluZyh0LCBpZCkpXG4gICAgICAudGhlbigob3JpZ1ZhbHVlKSA9PiB7XG4gICAgICAgIGNvbnN0IHVwZGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sIEpTT04ucGFyc2Uob3JpZ1ZhbHVlKSwgdXBkYXRlT2JqZWN0KTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJHJlZGlzXS5zZXRBc3luYyhrZXlTdHJpbmcodCwgaWQpLCBKU09OLnN0cmluZ2lmeSh1cGRhdGUpKVxuICAgICAgICAudGhlbigoKSA9PiB1cGRhdGUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmVhZE9uZSh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzWyRyZWRpc10uZ2V0QXN5bmMoa2V5U3RyaW5nKHQsIGlkKSlcbiAgICAudGhlbigoZCkgPT4gSlNPTi5wYXJzZShkKSk7XG4gIH1cblxuICByZWFkTWFueSh0LCBpZCwgcmVsYXRpb25zaGlwKSB7XG4gICAgcmV0dXJuIHRoaXNbJHJlZGlzXS5nZXRBc3luYyhrZXlTdHJpbmcodCwgaWQsIHJlbGF0aW9uc2hpcCkpXG4gICAgLnRoZW4oKGFycmF5U3RyaW5nKSA9PiB7XG4gICAgICByZXR1cm4ge1tyZWxhdGlvbnNoaXBdOiAoSlNPTi5wYXJzZShhcnJheVN0cmluZykgfHwgW10pfTtcbiAgICB9KTtcbiAgfVxuXG4gIGRlbGV0ZSh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzWyRyZWRpc10uZGVsQXN5bmMoa2V5U3RyaW5nKHQsIGlkKSk7XG4gIH1cblxuICBhZGQodCwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCwgZXh0cmFzKSB7XG4gICAgY29uc3QgUmVsID0gdC4kZmllbGRzW3JlbGF0aW9uc2hpcF0ucmVsYXRpb25zaGlwO1xuICAgIGNvbnN0IHRoaXNLZXlTdHJpbmcgPSBrZXlTdHJpbmcodCwgaWQsIHJlbGF0aW9uc2hpcCk7XG4gICAgY29uc3Qgb3RoZXJLZXlTdHJpbmcgPSBrZXlTdHJpbmcoUmVsLm90aGVyVHlwZShyZWxhdGlvbnNoaXApLnR5cGUsIGNoaWxkSWQsIFJlbC5vdGhlcihyZWxhdGlvbnNoaXApKTtcbiAgICByZXR1cm4gdGhpc1skcmVkaXNdLmdldEFzeW5jKHRoaXNLZXlTdHJpbmcpXG4gICAgLnRoZW4oKGFycmF5U3RyaW5nKSA9PiB7XG4gICAgICBsZXQgcmVsYXRpb25zaGlwQXJyYXkgPSBKU09OLnBhcnNlKGFycmF5U3RyaW5nKTtcbiAgICAgIGlmIChyZWxhdGlvbnNoaXBBcnJheSA9PT0gbnVsbCkge1xuICAgICAgICByZWxhdGlvbnNoaXBBcnJheSA9IFtdO1xuICAgICAgfVxuICAgICAgY29uc3QgbmV3UmVsYXRpb25zaGlwID0ge1xuICAgICAgICBbUmVsLiRzaWRlc1tyZWxhdGlvbnNoaXBdLmZpZWxkXTogY2hpbGRJZCxcbiAgICAgICAgW1JlbC5vdGhlclR5cGUocmVsYXRpb25zaGlwKS5maWVsZF06IGlkLFxuICAgICAgfTtcbiAgICAgICh0LiRmaWVsZHNbcmVsYXRpb25zaGlwXS5yZWxhdGlvbnNoaXAuJGV4dHJhcyB8fCBbXSkuZm9yRWFjaCgoZSkgPT4ge1xuICAgICAgICBuZXdSZWxhdGlvbnNoaXBbZV0gPSBleHRyYXNbZV07XG4gICAgICB9KTtcbiAgICAgIHJlbGF0aW9uc2hpcEFycmF5LnB1c2gobmV3UmVsYXRpb25zaGlwKTtcbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICAgIHRoaXNbJHJlZGlzXS5zZXRBc3luYyh0aGlzS2V5U3RyaW5nLCBKU09OLnN0cmluZ2lmeShyZWxhdGlvbnNoaXBBcnJheSkpLFxuICAgICAgICB0aGlzWyRyZWRpc10uc2V0QXN5bmMob3RoZXJLZXlTdHJpbmcsIEpTT04uc3RyaW5naWZ5KHJlbGF0aW9uc2hpcEFycmF5KSksXG4gICAgICBdKVxuICAgICAgLnRoZW4oKCkgPT4gcmVsYXRpb25zaGlwQXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKHQsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQsIGV4dHJhcykge1xuICAgIGNvbnN0IFJlbCA9IHQuJGZpZWxkc1tyZWxhdGlvbnNoaXBdLnJlbGF0aW9uc2hpcDtcbiAgICBjb25zdCB0aGlzS2V5U3RyaW5nID0ga2V5U3RyaW5nKHQsIGlkLCByZWxhdGlvbnNoaXApO1xuICAgIGNvbnN0IG90aGVyS2V5U3RyaW5nID0ga2V5U3RyaW5nKFJlbC5vdGhlclR5cGUocmVsYXRpb25zaGlwKS50eXBlLCBjaGlsZElkLCBSZWwub3RoZXIocmVsYXRpb25zaGlwKSk7XG4gICAgY29uc3Qgb3RoZXJGaWVsZCA9IFJlbC4kc2lkZXNbcmVsYXRpb25zaGlwXTtcbiAgICBjb25zdCBzZWxmRmllbGQgPSBSZWwub3RoZXJUeXBlKHJlbGF0aW9uc2hpcCk7XG4gICAgcmV0dXJuIHRoaXNbJHJlZGlzXS5nZXRBc3luYyh0aGlzS2V5U3RyaW5nKVxuICAgIC50aGVuKChhcnJheVN0cmluZykgPT4ge1xuICAgICAgbGV0IHJlbGF0aW9uc2hpcEFycmF5ID0gSlNPTi5wYXJzZShhcnJheVN0cmluZyk7XG4gICAgICBpZiAocmVsYXRpb25zaGlwQXJyYXkgPT09IG51bGwpIHtcbiAgICAgICAgcmVsYXRpb25zaGlwQXJyYXkgPSBbXTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGlkeCA9IHJlbGF0aW9uc2hpcEFycmF5LmZpbmRJbmRleCgodikgPT4ge1xuICAgICAgICByZXR1cm4gKHZbc2VsZkZpZWxkLmZpZWxkXSA9PT0gaWQpICYmICh2W290aGVyRmllbGQuZmllbGRdID09PSBjaGlsZElkKTtcbiAgICAgIH0pO1xuICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgIHJlbGF0aW9uc2hpcEFycmF5W2lkeF0gPSBPYmplY3QuYXNzaWduKFxuICAgICAgICAgIHt9LFxuICAgICAgICAgIHJlbGF0aW9uc2hpcEFycmF5W2lkeF0sXG4gICAgICAgICAgZXh0cmFzXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICAgICAgdGhpc1skcmVkaXNdLnNldEFzeW5jKHRoaXNLZXlTdHJpbmcsIEpTT04uc3RyaW5naWZ5KHJlbGF0aW9uc2hpcEFycmF5KSksXG4gICAgICAgICAgdGhpc1skcmVkaXNdLnNldEFzeW5jKG90aGVyS2V5U3RyaW5nLCBKU09OLnN0cmluZ2lmeShyZWxhdGlvbnNoaXBBcnJheSkpLFxuICAgICAgICBdKVxuICAgICAgICAudGhlbigoKSA9PiByZWxhdGlvbnNoaXBBcnJheSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGBJdGVtICR7Y2hpbGRJZH0gbm90IGZvdW5kIGluICR7cmVsYXRpb25zaGlwfSBvZiAke3QuJG5hbWV9YCkpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcmVtb3ZlKHQsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQpIHtcbiAgICBjb25zdCBSZWwgPSB0LiRmaWVsZHNbcmVsYXRpb25zaGlwXS5yZWxhdGlvbnNoaXA7XG4gICAgY29uc3QgdGhpc0tleVN0cmluZyA9IGtleVN0cmluZyh0LCBpZCwgcmVsYXRpb25zaGlwKTtcbiAgICBjb25zdCBvdGhlcktleVN0cmluZyA9IGtleVN0cmluZyhSZWwub3RoZXJUeXBlKHJlbGF0aW9uc2hpcCkudHlwZSwgY2hpbGRJZCwgUmVsLm90aGVyKHJlbGF0aW9uc2hpcCkpO1xuICAgIGNvbnN0IG90aGVyRmllbGQgPSBSZWwuJHNpZGVzW3JlbGF0aW9uc2hpcF07XG4gICAgY29uc3Qgc2VsZkZpZWxkID0gUmVsLm90aGVyVHlwZShyZWxhdGlvbnNoaXApO1xuICAgIHJldHVybiB0aGlzWyRyZWRpc10uZ2V0QXN5bmModGhpc0tleVN0cmluZylcbiAgICAudGhlbigoYXJyYXlTdHJpbmcpID0+IHtcbiAgICAgIGxldCByZWxhdGlvbnNoaXBBcnJheSA9IEpTT04ucGFyc2UoYXJyYXlTdHJpbmcpO1xuICAgICAgaWYgKHJlbGF0aW9uc2hpcEFycmF5ID09PSBudWxsKSB7XG4gICAgICAgIHJlbGF0aW9uc2hpcEFycmF5ID0gW107XG4gICAgICB9XG4gICAgICBjb25zdCBpZHggPSByZWxhdGlvbnNoaXBBcnJheS5maW5kSW5kZXgoKHYpID0+IHtcbiAgICAgICAgcmV0dXJuICh2W3NlbGZGaWVsZC5maWVsZF0gPT09IGlkKSAmJiAodltvdGhlckZpZWxkLmZpZWxkXSA9PT0gY2hpbGRJZCk7XG4gICAgICB9KTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICByZWxhdGlvbnNoaXBBcnJheS5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFtcbiAgICAgICAgICB0aGlzWyRyZWRpc10uc2V0QXN5bmModGhpc0tleVN0cmluZywgSlNPTi5zdHJpbmdpZnkocmVsYXRpb25zaGlwQXJyYXkpKSxcbiAgICAgICAgICB0aGlzWyRyZWRpc10uc2V0QXN5bmMob3RoZXJLZXlTdHJpbmcsIEpTT04uc3RyaW5naWZ5KHJlbGF0aW9uc2hpcEFycmF5KSksXG4gICAgICAgIF0pXG4gICAgICAgIC50aGVuKCgpID0+IHJlbGF0aW9uc2hpcEFycmF5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYEl0ZW0gJHtjaGlsZElkfSBub3QgZm91bmQgaW4gJHtyZWxhdGlvbnNoaXB9IG9mICR7dC4kbmFtZX1gKSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
