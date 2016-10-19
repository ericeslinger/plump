'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RedisStorage = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

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

function keyString(typeName, id, relationship) {
  return typeName + ':' + (relationship || 'store') + ':' + id;
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
            return _this2[$redis].setAsync(keyString(t.$name, n + 1), JSON.stringify(toSave)).then(function () {
              return toSave;
            });
          });
        } else {
          throw new Error('Cannot create new content in a non-terminal store');
        }
      } else {
        return this[$redis].getAsync(keyString(t.$name, id)).then(function (origValue) {
          var update = Object.assign({}, JSON.parse(origValue), updateObject);
          return _this2[$redis].setAsync(keyString(t.$name, id), JSON.stringify(update)).then(function () {
            return update;
          });
        });
      }
    }
  }, {
    key: 'readOne',
    value: function readOne(t, id) {
      return this[$redis].getAsync(keyString(t.$name, id)).then(function (d) {
        return JSON.parse(d);
      });
    }
  }, {
    key: 'readMany',
    value: function readMany(t, id, relationship) {
      return this[$redis].getAsync(keyString(t.$name, id, relationship)).then(function (arrayString) {
        return _defineProperty({}, relationship, JSON.parse(arrayString) || []);
      });
    }
  }, {
    key: 'delete',
    value: function _delete(t, id) {
      return this[$redis].delAsync(keyString(t.$name, id));
    }
  }, {
    key: 'add',
    value: function add(t, id, relationshipTitle, childId, extras) {
      var _this3 = this;

      var Rel = t.$fields[relationshipTitle];
      var selfFieldName = Rel.field;
      var otherFieldName = Rel.relationship.otherField(selfFieldName);
      var thisKeyString = keyString(t.$name, id, relationshipTitle);
      var otherKeyString = keyString(Rel.relationship.$sides[otherFieldName], childId, Rel.otherside);
      return Promise.all([this[$redis].getAsync(thisKeyString), this[$redis].getAsync(otherKeyString)]).then(function (_ref2) {
        var _ref3 = _slicedToArray(_ref2, 2);

        var thisArrayString = _ref3[0];
        var otherArrayString = _ref3[1];

        var thisArray = JSON.parse(thisArrayString) || [];
        var otherArray = JSON.parse(otherArrayString) || [];
        var idx = thisArray.findIndex(function (v) {
          return v[selfFieldName] === id && v[otherFieldName] === childId;
        });
        if (idx < 0) {
          var _ret = function () {
            var _newRelationship;

            var newRelationship = (_newRelationship = {}, _defineProperty(_newRelationship, selfFieldName, id), _defineProperty(_newRelationship, otherFieldName, childId), _newRelationship);
            (Rel.relationship.$extras || []).forEach(function (e) {
              newRelationship[e] = extras[e];
            });
            thisArray.push(newRelationship);
            otherArray.push(newRelationship);
            return {
              v: Promise.all([_this3[$redis].setAsync(thisKeyString, JSON.stringify(thisArray)), _this3[$redis].setAsync(otherKeyString, JSON.stringify(otherArray))]).then(function () {
                return thisArray;
              })
            };
          }();

          if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        } else {
          return thisArray;
        }
      });
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(t, id, relationshipTitle, childId, extras) {
      var _this4 = this;

      var Rel = t.$fields[relationshipTitle];
      var selfFieldName = Rel.field;
      var otherFieldName = Rel.relationship.otherField(selfFieldName);
      var thisKeyString = keyString(t.$name, id, relationshipTitle);
      var otherKeyString = keyString(Rel.relationship.$sides[otherFieldName], childId, Rel.otherside);
      return Promise.all([this[$redis].getAsync(thisKeyString), this[$redis].getAsync(otherKeyString)]).then(function (_ref4) {
        var _ref5 = _slicedToArray(_ref4, 2);

        var thisArrayString = _ref5[0];
        var otherArrayString = _ref5[1];

        var thisArray = JSON.parse(thisArrayString) || [];
        var otherArray = JSON.parse(otherArrayString) || [];
        var thisIdx = thisArray.findIndex(function (v) {
          return v[selfFieldName] === id && v[otherFieldName] === childId;
        });
        var otherIdx = otherArray.findIndex(function (v) {
          return v[selfFieldName] === id && v[otherFieldName] === childId;
        });
        if (thisIdx >= 0) {
          var modifiedRelationship = Object.assign({}, thisArray[thisIdx], extras);
          thisArray[thisIdx] = modifiedRelationship;
          otherArray[otherIdx] = modifiedRelationship;
          return Promise.all([_this4[$redis].setAsync(thisKeyString, JSON.stringify(thisArray)), _this4[$redis].setAsync(otherKeyString, JSON.stringify(otherArray))]).then(function () {
            return thisArray;
          });
        } else {
          return thisArray;
        }
      });
    }
  }, {
    key: 'remove',
    value: function remove(t, id, relationshipTitle, childId) {
      var _this5 = this;

      var Rel = t.$fields[relationshipTitle];
      var selfFieldName = Rel.field;
      var otherFieldName = Rel.relationship.otherField(selfFieldName);
      var thisKeyString = keyString(t.$name, id, relationshipTitle);
      var otherKeyString = keyString(Rel.relationship.$sides[otherFieldName], childId, Rel.otherside);
      return Promise.all([this[$redis].getAsync(thisKeyString), this[$redis].getAsync(otherKeyString)]).then(function (_ref6) {
        var _ref7 = _slicedToArray(_ref6, 2);

        var thisArrayString = _ref7[0];
        var otherArrayString = _ref7[1];

        var thisArray = JSON.parse(thisArrayString) || [];
        var otherArray = JSON.parse(otherArrayString) || [];
        var thisIdx = thisArray.findIndex(function (v) {
          return v[selfFieldName] === id && v[otherFieldName] === childId;
        });
        var otherIdx = otherArray.findIndex(function (v) {
          return v[selfFieldName] === id && v[otherFieldName] === childId;
        });
        if (thisIdx >= 0) {
          thisArray.splice(thisIdx, 1);
          otherArray.splice(otherIdx, 1);
          return Promise.all([_this5[$redis].setAsync(thisKeyString, JSON.stringify(thisArray)), _this5[$redis].setAsync(otherKeyString, JSON.stringify(otherArray))]).then(function () {
            return thisArray;
          });
        } else {
          return thisArray;
        }
      });
    }
  }]);

  return RedisStorage;
}(_storage.Storage);