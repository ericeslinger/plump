'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KeyValueStore = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _storage = require('./storage');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function saneNumber(i) {
  return typeof i === 'number' && !isNaN(i) && i !== Infinity & i !== -Infinity;
}

function findEntryCallback(relationship, relationshipTitle, target) {
  var sideInfo = relationship.$sides[relationshipTitle];
  return function (value) {
    if (value[sideInfo.self.field] === target[sideInfo.self.field] && value[sideInfo.other.field] === target[sideInfo.other.field]) {
      if (relationship.$restrict) {
        console.log('TESTING: ' + JSON.stringify(target) + ' vs ' + JSON.stringify(value));
        return Object.keys(relationship.$restrict).reduce(function (prior, restriction) {
          return prior && value[restriction] === relationship.$restrict[restriction].value;
        }, true);
      } else {
        return true;
      }
    } else {
      return false;
    }
  };
}

var KeyValueStore = exports.KeyValueStore = function (_Storage) {
  _inherits(KeyValueStore, _Storage);

  function KeyValueStore() {
    _classCallCheck(this, KeyValueStore);

    return _possibleConstructorReturn(this, (KeyValueStore.__proto__ || Object.getPrototypeOf(KeyValueStore)).apply(this, arguments));
  }

  _createClass(KeyValueStore, [{
    key: '$$maxKey',
    value: function $$maxKey(t) {
      return this._keys(t).then(function (keyArray) {
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
          return this.$$maxKey(t.$name).then(function (n) {
            var toSave = Object.assign({}, _defineProperty({}, t.$id, n + 1), updateObject);
            return _this2._set(_this2.keyString(t.$name, n + 1), JSON.stringify(toSave)).then(function () {
              return toSave;
            });
          });
        } else {
          throw new Error('Cannot create new content in a non-terminal store');
        }
      } else {
        return this._get(this.keyString(t.$name, id)).then(function (origValue) {
          var update = Object.assign({}, JSON.parse(origValue), updateObject);
          return _this2._set(_this2.keyString(t.$name, id), JSON.stringify(update)).then(function () {
            return update;
          });
        });
      }
    }
  }, {
    key: 'readOne',
    value: function readOne(t, id) {
      return this._get(this.keyString(t.$name, id)).then(function (d) {
        return JSON.parse(d);
      });
    }
  }, {
    key: 'readMany',
    value: function readMany(t, id, relationship) {
      return this._get(this.keyString(t.$name, id, relationship)).then(function (arrayString) {
        var relationshipArray = JSON.parse(arrayString) || [];
        var relationshipType = t.$fields[relationship].relationship;
        if (relationshipType.$restrict) {
          return relationshipArray.filter(function (v) {
            return Object.keys(relationshipType.$restrict).reduce(function (prior, restriction) {
              return prior && v[restriction] === relationshipType.$restrict[restriction].value;
            }, true);
          }).map(function (entry) {
            Object.keys(relationshipType.$restrict).forEach(function (k) {
              delete entry[k]; // eslint-disable-line no-param-reassign
            });
            return entry;
          });
        } else {
          return relationshipArray;
        }
      }).then(function (ary) {
        return _defineProperty({}, relationship, ary);
      });
    }
  }, {
    key: 'delete',
    value: function _delete(t, id) {
      return this._del(this.keyString(t.$name, id));
    }
  }, {
    key: 'add',
    value: function add(type, id, relationshipTitle, childId) {
      var _this3 = this;

      var extras = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

      var relationshipBlock = type.$fields[relationshipTitle];
      var sideInfo = relationshipBlock.relationship.$sides[relationshipTitle];
      var thisKeyString = this.keyString(type.$name, id, relationshipTitle);
      var otherKeyString = this.keyString(sideInfo.other.type, childId, sideInfo.other.title);
      return Promise.all([this._get(thisKeyString), this._get(otherKeyString)]).then(function (_ref2) {
        var _newField;

        var _ref3 = _slicedToArray(_ref2, 2);

        var thisArrayString = _ref3[0];
        var otherArrayString = _ref3[1];

        var thisArray = JSON.parse(thisArrayString) || [];
        var otherArray = JSON.parse(otherArrayString) || [];
        var newField = (_newField = {}, _defineProperty(_newField, sideInfo.other.field, childId), _defineProperty(_newField, sideInfo.self.field, id), _newField);
        var idx = thisArray.findIndex(findEntryCallback(relationshipBlock.relationship, relationshipTitle, newField));
        if (idx < 0) {
          if (relationshipBlock.relationship.$restrict) {
            Object.keys(relationshipBlock.relationship.$restrict).forEach(function (restriction) {
              newField[restriction] = relationshipBlock.relationship.$restrict[restriction].value;
            });
          }
          if (relationshipBlock.relationship.$extras) {
            Object.keys(relationshipBlock.relationship.$extras).forEach(function (extra) {
              newField[extra] = extras[extra];
            });
          }
          thisArray.push(newField);
          otherArray.push(newField);
          return Promise.all([_this3._set(thisKeyString, JSON.stringify(thisArray)), _this3._set(otherKeyString, JSON.stringify(otherArray))]).then(function () {
            return thisArray;
          });
        } else {
          return thisArray;
        }
      });
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(type, id, relationshipTitle, childId, extras) {
      var _this4 = this;

      var relationshipBlock = type.$fields[relationshipTitle];
      var sideInfo = relationshipBlock.relationship.$sides[relationshipTitle];
      var thisKeyString = this.keyString(type.$name, id, relationshipTitle);
      var otherKeyString = this.keyString(sideInfo.other.type, childId, sideInfo.other.title);
      return Promise.all([this._get(thisKeyString), this._get(otherKeyString)]).then(function (_ref4) {
        var _target;

        var _ref5 = _slicedToArray(_ref4, 2);

        var thisArrayString = _ref5[0];
        var otherArrayString = _ref5[1];

        var thisArray = JSON.parse(thisArrayString) || [];
        var otherArray = JSON.parse(otherArrayString) || [];
        var target = (_target = {}, _defineProperty(_target, sideInfo.other.field, childId), _defineProperty(_target, sideInfo.self.field, id), _target);
        var thisIdx = thisArray.findIndex(findEntryCallback(relationshipBlock.relationship, relationshipTitle, target));
        var otherIdx = otherArray.findIndex(findEntryCallback(relationshipBlock.relationship, relationshipTitle, target));
        if (thisIdx >= 0) {
          var modifiedRelationship = Object.assign({}, thisArray[thisIdx], extras);
          thisArray[thisIdx] = modifiedRelationship;
          otherArray[otherIdx] = modifiedRelationship;
          return Promise.all([_this4._set(thisKeyString, JSON.stringify(thisArray)), _this4._set(otherKeyString, JSON.stringify(otherArray))]).then(function () {
            return thisArray;
          });
        } else {
          return thisArray;
        }
      });
    }
  }, {
    key: 'remove',
    value: function remove(type, id, relationshipTitle, childId) {
      var _this5 = this;

      var relationshipBlock = type.$fields[relationshipTitle];
      var sideInfo = relationshipBlock.relationship.$sides[relationshipTitle];
      var thisKeyString = this.keyString(type.$name, id, relationshipTitle);
      var otherKeyString = this.keyString(sideInfo.other.type, childId, sideInfo.other.title);
      return Promise.all([this._get(thisKeyString), this._get(otherKeyString)]).then(function (_ref6) {
        var _target2;

        var _ref7 = _slicedToArray(_ref6, 2);

        var thisArrayString = _ref7[0];
        var otherArrayString = _ref7[1];

        var thisArray = JSON.parse(thisArrayString) || [];
        var otherArray = JSON.parse(otherArrayString) || [];
        var target = (_target2 = {}, _defineProperty(_target2, sideInfo.other.field, childId), _defineProperty(_target2, sideInfo.self.field, id), _target2);
        var thisIdx = thisArray.findIndex(findEntryCallback(relationshipBlock.relationship, relationshipTitle, target));
        var otherIdx = otherArray.findIndex(findEntryCallback(relationshipBlock.relationship, relationshipTitle, target));
        if (thisIdx >= 0) {
          thisArray.splice(thisIdx, 1);
          otherArray.splice(otherIdx, 1);
          return Promise.all([_this5._set(thisKeyString, JSON.stringify(thisArray)), _this5._set(otherKeyString, JSON.stringify(otherArray))]).then(function () {
            return thisArray;
          });
        } else {
          return thisArray;
        }
      });
    }
  }, {
    key: 'keyString',
    value: function keyString(typeName, id, relationship) {
      return typeName + ':' + (relationship || 'store') + ':' + id;
    }
  }]);

  return KeyValueStore;
}(_storage.Storage);