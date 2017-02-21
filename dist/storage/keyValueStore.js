'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KeyValueStore = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var Bluebird = _interopRequireWildcard(_bluebird);

var _storage = require('./storage');

var _createFilter = require('./createFilter');

var _model = require('../model');

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

function maybePush(array, val, keystring, store, idx) {
  return Bluebird.resolve().then(function () {
    if (idx < 0) {
      array.push(val);
      return store._set(keystring, JSON.stringify(array));
    } else {
      return null;
    }
  });
}

function maybeUpdate(array, val, keystring, store, extras, idx) {
  return Bluebird.resolve().then(function () {
    if (idx >= 0) {
      var modifiedRelationship = Object.assign({}, array[idx], extras);
      array[idx] = modifiedRelationship; // eslint-disable-line no-param-reassign
      return store._set(keystring, JSON.stringify(array));
    } else {
      return null;
    }
  });
}

function maybeDelete(array, idx, keystring, store) {
  return Bluebird.resolve().then(function () {
    if (idx >= 0) {
      array.splice(idx, 1);
      return store._set(keystring, JSON.stringify(array));
    } else {
      return null;
    }
  });
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

      var id = v[t.$schema.$id];
      var updateObject = {};
      for (var rel in t.$schema.relationships) {
        if (v[rel] !== undefined) {
          updateObject[rel] = v[rel].concat();
        }
      }
      for (var attr in t.$schema.attributes) {
        if (t.$schema.attributes[attr].type === 'object') {
          updateObject[attr] = Object.assign({}, v[attr]);
        } else {
          updateObject[attr] = v[attr];
        }
      }
      if (id === undefined || id === null) {
        if (this.terminal) {
          return this.$$maxKey(t.$name).then(function (n) {
            var toSave = Object.assign({}, updateObject, _defineProperty({}, t.$schema.$id, n + 1));
            return _this2._set(_this2.keyString(t.$name, n + 1), JSON.stringify(toSave)).then(function () {
              return _this2.notifyUpdate(t, toSave[t.$id], toSave);
            }).then(function () {
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
            return _this2.notifyUpdate(t, id, update);
          }).then(function () {
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
      var _this3 = this;

      var relationshipType = t.$schema.relationships[relationship].type;
      var sideInfo = relationshipType.$sides[relationship];
      return Bluebird.resolve().then(function () {
        var resolves = [_this3._get(_this3.keyString(t.$name, id, relationship))];
        if (sideInfo.self.query && sideInfo.self.query.requireLoad) {
          resolves.push(_this3.readOne(t, id));
        } else {
          resolves.push(Bluebird.resolve({ id: id }));
        }
        // TODO: if there's a query, KVS loads a *lot* into memory and filters
        return Bluebird.all(resolves);
      }).then(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            arrayString = _ref2[0],
            context = _ref2[1];

        var relationshipArray = JSON.parse(arrayString) || [];
        if (sideInfo.self.query) {
          var filterBlock = _storage.Storage.massReplace(sideInfo.self.query.logic, context);
          relationshipArray = relationshipArray.filter((0, _createFilter.createFilter)(filterBlock));
        }
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
    key: 'wipe',
    value: function wipe(t, id, field) {
      if (field === _model.$self) {
        return this._del(this.keyString(t.$name, id));
      } else {
        return this._del(this.keyString(t.$name, id, field));
      }
    }
  }, {
    key: 'writeHasMany',
    value: function writeHasMany(type, id, field, value) {
      var toSave = value;
      var relationshipBlock = type.$schema.relationships[field].type;
      if (relationshipBlock.$restrict) {
        (function () {
          var restrictBlock = {};
          Object.keys(relationshipBlock.$restrict).forEach(function (k) {
            restrictBlock[k] = relationshipBlock.$restrict[k].value;
          });
          toSave = toSave.map(function (v) {
            return Object.assign({}, v, restrictBlock);
          });
        })();
      }
      // const sideInfo = relationshipBlock.$sides[field];
      var thisKeyString = this.keyString(type.$name, id, field);
      return this._set(thisKeyString, JSON.stringify(toSave));
    }
  }, {
    key: 'add',
    value: function add(type, id, relationshipTitle, childId) {
      var _this4 = this;

      var extras = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

      var relationshipBlock = type.$schema.relationships[relationshipTitle].type;
      var sideInfo = relationshipBlock.$sides[relationshipTitle];
      var thisKeyString = this.keyString(type.$name, id, relationshipTitle);
      var otherKeyString = this.keyString(sideInfo.other.type, childId, sideInfo.other.title);
      return Bluebird.all([this._get(thisKeyString), this._get(otherKeyString)]).then(function (_ref4) {
        var _newField;

        var _ref5 = _slicedToArray(_ref4, 2),
            thisArrayString = _ref5[0],
            otherArrayString = _ref5[1];

        var thisArray = JSON.parse(thisArrayString) || [];
        var otherArray = JSON.parse(otherArrayString) || [];
        var newField = (_newField = {}, _defineProperty(_newField, sideInfo.other.field, childId), _defineProperty(_newField, sideInfo.self.field, id), _newField);
        if (relationshipBlock.$restrict) {
          Object.keys(relationshipBlock.$restrict).forEach(function (restriction) {
            newField[restriction] = relationshipBlock.$restrict[restriction].value;
          });
        }
        if (relationshipBlock.$extras) {
          Object.keys(relationshipBlock.$extras).forEach(function (extra) {
            newField[extra] = extras[extra];
          });
        }
        var thisIdx = thisArray.findIndex(findEntryCallback(relationshipBlock, relationshipTitle, newField));
        var otherIdx = otherArray.findIndex(findEntryCallback(relationshipBlock, relationshipTitle, newField));
        return Bluebird.all([maybePush(thisArray, newField, thisKeyString, _this4, thisIdx), maybePush(otherArray, newField, otherKeyString, _this4, otherIdx)]).then(function () {
          return _this4.notifyUpdate(type, id, null, relationshipTitle);
        }).then(function () {
          return thisArray;
        });
      });
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(type, id, relationshipTitle, childId, extras) {
      var _this5 = this;

      var relationshipBlock = type.$schema.relationships[relationshipTitle].type;
      var sideInfo = relationshipBlock.$sides[relationshipTitle];
      var thisKeyString = this.keyString(type.$name, id, relationshipTitle);
      var otherKeyString = this.keyString(sideInfo.other.type, childId, sideInfo.other.title);
      return Bluebird.all([this._get(thisKeyString), this._get(otherKeyString)]).then(function (_ref6) {
        var _target;

        var _ref7 = _slicedToArray(_ref6, 2),
            thisArrayString = _ref7[0],
            otherArrayString = _ref7[1];

        var thisArray = JSON.parse(thisArrayString) || [];
        var otherArray = JSON.parse(otherArrayString) || [];
        var target = (_target = {}, _defineProperty(_target, sideInfo.other.field, childId), _defineProperty(_target, sideInfo.self.field, id), _target);
        var thisIdx = thisArray.findIndex(findEntryCallback(relationshipBlock, relationshipTitle, target));
        var otherIdx = otherArray.findIndex(findEntryCallback(relationshipBlock, relationshipTitle, target));
        return Bluebird.all([maybeUpdate(thisArray, target, thisKeyString, _this5, extras, thisIdx), maybeUpdate(otherArray, target, otherKeyString, _this5, extras, otherIdx)]);
      }).then(function (res) {
        return _this5.notifyUpdate(type, id, null, relationshipTitle).then(function () {
          return res;
        });
      });
    }
  }, {
    key: 'remove',
    value: function remove(type, id, relationshipTitle, childId) {
      var _this6 = this;

      var relationshipBlock = type.$schema.relationships[relationshipTitle].type;
      var sideInfo = relationshipBlock.$sides[relationshipTitle];
      var thisKeyString = this.keyString(type.$name, id, relationshipTitle);
      var otherKeyString = this.keyString(sideInfo.other.type, childId, sideInfo.other.title);
      return Bluebird.all([this._get(thisKeyString), this._get(otherKeyString)]).then(function (_ref8) {
        var _target2;

        var _ref9 = _slicedToArray(_ref8, 2),
            thisArrayString = _ref9[0],
            otherArrayString = _ref9[1];

        var thisArray = JSON.parse(thisArrayString) || [];
        var otherArray = JSON.parse(otherArrayString) || [];
        var target = (_target2 = {}, _defineProperty(_target2, sideInfo.other.field, childId), _defineProperty(_target2, sideInfo.self.field, id), _target2);
        var thisIdx = thisArray.findIndex(findEntryCallback(relationshipBlock, relationshipTitle, target));
        var otherIdx = otherArray.findIndex(findEntryCallback(relationshipBlock, relationshipTitle, target));
        return Bluebird.all([maybeDelete(thisArray, thisIdx, thisKeyString, _this6), maybeDelete(otherArray, otherIdx, otherKeyString, _this6)]);
      }).then(function (res) {
        return _this6.notifyUpdate(type, id, null, relationshipTitle).then(function () {
          return res;
        });
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uva2V5VmFsdWVTdG9yZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsInNhbmVOdW1iZXIiLCJpIiwiaXNOYU4iLCJJbmZpbml0eSIsImZpbmRFbnRyeUNhbGxiYWNrIiwicmVsYXRpb25zaGlwIiwicmVsYXRpb25zaGlwVGl0bGUiLCJ0YXJnZXQiLCJzaWRlSW5mbyIsIiRzaWRlcyIsInZhbHVlIiwic2VsZiIsImZpZWxkIiwib3RoZXIiLCIkcmVzdHJpY3QiLCJPYmplY3QiLCJrZXlzIiwicmVkdWNlIiwicHJpb3IiLCJyZXN0cmljdGlvbiIsIm1heWJlUHVzaCIsImFycmF5IiwidmFsIiwia2V5c3RyaW5nIiwic3RvcmUiLCJpZHgiLCJyZXNvbHZlIiwidGhlbiIsInB1c2giLCJfc2V0IiwiSlNPTiIsInN0cmluZ2lmeSIsIm1heWJlVXBkYXRlIiwiZXh0cmFzIiwibW9kaWZpZWRSZWxhdGlvbnNoaXAiLCJhc3NpZ24iLCJtYXliZURlbGV0ZSIsInNwbGljZSIsIktleVZhbHVlU3RvcmUiLCJ0IiwiX2tleXMiLCJrZXlBcnJheSIsImxlbmd0aCIsIm1hcCIsImsiLCJzcGxpdCIsInBhcnNlSW50IiwiZmlsdGVyIiwibWF4IiwiY3VycmVudCIsInYiLCJpZCIsIiRpZCIsInVwZGF0ZU9iamVjdCIsIiRmaWVsZHMiLCJmb3JFYWNoIiwiZmllbGROYW1lIiwidW5kZWZpbmVkIiwidHlwZSIsImNvbmNhdCIsInRlcm1pbmFsIiwiJCRtYXhLZXkiLCIkbmFtZSIsIm4iLCJ0b1NhdmUiLCJrZXlTdHJpbmciLCJub3RpZnlVcGRhdGUiLCJFcnJvciIsIl9nZXQiLCJvcmlnVmFsdWUiLCJ1cGRhdGUiLCJwYXJzZSIsImQiLCJyZWxhdGlvbnNoaXBUeXBlIiwicmVzb2x2ZXMiLCJxdWVyeSIsInJlcXVpcmVMb2FkIiwicmVhZE9uZSIsImFsbCIsImFycmF5U3RyaW5nIiwiY29udGV4dCIsInJlbGF0aW9uc2hpcEFycmF5IiwiZmlsdGVyQmxvY2siLCJtYXNzUmVwbGFjZSIsImxvZ2ljIiwiZW50cnkiLCJhcnkiLCJfZGVsIiwicmVsYXRpb25zaGlwQmxvY2siLCJyZXN0cmljdEJsb2NrIiwidGhpc0tleVN0cmluZyIsImNoaWxkSWQiLCJvdGhlcktleVN0cmluZyIsInRpdGxlIiwidGhpc0FycmF5U3RyaW5nIiwib3RoZXJBcnJheVN0cmluZyIsInRoaXNBcnJheSIsIm90aGVyQXJyYXkiLCJuZXdGaWVsZCIsIiRleHRyYXMiLCJleHRyYSIsInRoaXNJZHgiLCJmaW5kSW5kZXgiLCJvdGhlcklkeCIsInJlcyIsInR5cGVOYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztJQUFZQSxROztBQUNaOztBQUNBOztBQUNBOzs7Ozs7Ozs7Ozs7QUFFQSxTQUFTQyxVQUFULENBQW9CQyxDQUFwQixFQUF1QjtBQUNyQixTQUFTLE9BQU9BLENBQVAsS0FBYSxRQUFkLElBQTRCLENBQUNDLE1BQU1ELENBQU4sQ0FBN0IsSUFBMkNBLE1BQU1FLFFBQVAsR0FBb0JGLE1BQU0sQ0FBQ0UsUUFBN0U7QUFDRDs7QUFFRCxTQUFTQyxpQkFBVCxDQUEyQkMsWUFBM0IsRUFBeUNDLGlCQUF6QyxFQUE0REMsTUFBNUQsRUFBb0U7QUFDbEUsTUFBTUMsV0FBV0gsYUFBYUksTUFBYixDQUFvQkgsaUJBQXBCLENBQWpCO0FBQ0EsU0FBTyxVQUFDSSxLQUFELEVBQVc7QUFDaEIsUUFDR0EsTUFBTUYsU0FBU0csSUFBVCxDQUFjQyxLQUFwQixNQUErQkwsT0FBT0MsU0FBU0csSUFBVCxDQUFjQyxLQUFyQixDQUFoQyxJQUNDRixNQUFNRixTQUFTSyxLQUFULENBQWVELEtBQXJCLE1BQWdDTCxPQUFPQyxTQUFTSyxLQUFULENBQWVELEtBQXRCLENBRm5DLEVBR0U7QUFDQSxVQUFJUCxhQUFhUyxTQUFqQixFQUE0QjtBQUMxQixlQUFPQyxPQUFPQyxJQUFQLENBQVlYLGFBQWFTLFNBQXpCLEVBQW9DRyxNQUFwQyxDQUNMLFVBQUNDLEtBQUQsRUFBUUMsV0FBUjtBQUFBLGlC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QixFQUFqRDtBQUNBLFlBQU1HLGFBQWFuRSxLQUFLeUMsS0FBTCxDQUFXd0IsZ0JBQVgsS0FBZ0MsRUFBbkQ7QUFDQSxZQUFNeEYsbURBQ0hDLFNBQVNLLEtBQVQsQ0FBZUQsS0FEWixFQUNvQitFLE9BRHBCLDZCQUVIbkYsU0FBU0csSUFBVCxDQUFjQyxLQUZYLEVBRW1CdUMsRUFGbkIsWUFBTjtBQUlBLFlBQU1rRCxVQUFVTCxVQUFVTSxTQUFWLENBQW9CbEcsa0JBQWtCb0YsaUJBQWxCLEVBQXFDbEYsaUJBQXJDLEVBQXdEQyxNQUF4RCxDQUFwQixDQUFoQjtBQUNBLFlBQU1nRyxXQUFXTixXQUFXSyxTQUFYLENBQXFCbEcsa0JBQWtCb0YsaUJBQWxCLEVBQXFDbEYsaUJBQXJDLEVBQXdEQyxNQUF4RCxDQUFyQixDQUFqQjtBQUNBLGVBQU9SLFNBQVMrRSxHQUFULENBQWEsQ0FDbEIxQyxZQUFZNEQsU0FBWixFQUF1QkssT0FBdkIsRUFBZ0NYLGFBQWhDLFNBRGtCLEVBRWxCdEQsWUFBWTZELFVBQVosRUFBd0JNLFFBQXhCLEVBQWtDWCxjQUFsQyxTQUZrQixDQUFiLENBQVA7QUFJRCxPQWpCTSxFQWtCTmpFLElBbEJNLENBa0JELFVBQUM2RSxHQUFEO0FBQUEsZUFBUyxPQUFLdEMsWUFBTCxDQUFrQlIsSUFBbEIsRUFBd0JQLEVBQXhCLEVBQTRCLElBQTVCLEVBQWtDN0MsaUJBQWxDLEVBQXFEcUIsSUFBckQsQ0FBMEQ7QUFBQSxpQkFBTTZFLEdBQU47QUFBQSxTQUExRCxDQUFUO0FBQUEsT0FsQkMsQ0FBUDtBQW1CRDs7OzhCQUVTQyxRLEVBQVV0RCxFLEVBQUk5QyxZLEVBQWM7QUFDcEMsYUFBVW9HLFFBQVYsVUFBc0JwRyxnQkFBZ0IsT0FBdEMsVUFBaUQ4QyxFQUFqRDtBQUNEIiwiZmlsZSI6InN0b3JhZ2Uva2V5VmFsdWVTdG9yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IFN0b3JhZ2UgfSBmcm9tICcuL3N0b3JhZ2UnO1xuaW1wb3J0IHsgY3JlYXRlRmlsdGVyIH0gZnJvbSAnLi9jcmVhdGVGaWx0ZXInO1xuaW1wb3J0IHsgJHNlbGYgfSBmcm9tICcuLi9tb2RlbCc7XG5cbmZ1bmN0aW9uIHNhbmVOdW1iZXIoaSkge1xuICByZXR1cm4gKCh0eXBlb2YgaSA9PT0gJ251bWJlcicpICYmICghaXNOYU4oaSkpICYmIChpICE9PSBJbmZpbml0eSkgJiAoaSAhPT0gLUluZmluaXR5KSk7XG59XG5cbmZ1bmN0aW9uIGZpbmRFbnRyeUNhbGxiYWNrKHJlbGF0aW9uc2hpcCwgcmVsYXRpb25zaGlwVGl0bGUsIHRhcmdldCkge1xuICBjb25zdCBzaWRlSW5mbyA9IHJlbGF0aW9uc2hpcC4kc2lkZXNbcmVsYXRpb25zaGlwVGl0bGVdO1xuICByZXR1cm4gKHZhbHVlKSA9PiB7XG4gICAgaWYgKFxuICAgICAgKHZhbHVlW3NpZGVJbmZvLnNlbGYuZmllbGRdID09PSB0YXJnZXRbc2lkZUluZm8uc2VsZi5maWVsZF0pICYmXG4gICAgICAodmFsdWVbc2lkZUluZm8ub3RoZXIuZmllbGRdID09PSB0YXJnZXRbc2lkZUluZm8ub3RoZXIuZmllbGRdKVxuICAgICkge1xuICAgICAgaWYgKHJlbGF0aW9uc2hpcC4kcmVzdHJpY3QpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHJlbGF0aW9uc2hpcC4kcmVzdHJpY3QpLnJlZHVjZShcbiAgICAgICAgICAocHJpb3IsIHJlc3RyaWN0aW9uKSA9PiBwcmlvciAmJiB2YWx1ZVtyZXN0cmljdGlvbl0gPT09IHJlbGF0aW9uc2hpcC4kcmVzdHJpY3RbcmVzdHJpY3Rpb25dLnZhbHVlLFxuICAgICAgICAgIHRydWVcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBtYXliZVB1c2goYXJyYXksIHZhbCwga2V5c3RyaW5nLCBzdG9yZSwgaWR4KSB7XG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgLnRoZW4oKCkgPT4ge1xuICAgIGlmIChpZHggPCAwKSB7XG4gICAgICBhcnJheS5wdXNoKHZhbCk7XG4gICAgICByZXR1cm4gc3RvcmUuX3NldChrZXlzdHJpbmcsIEpTT04uc3RyaW5naWZ5KGFycmF5KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSk7XG59XG5cblxuZnVuY3Rpb24gbWF5YmVVcGRhdGUoYXJyYXksIHZhbCwga2V5c3RyaW5nLCBzdG9yZSwgZXh0cmFzLCBpZHgpIHtcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAudGhlbigoKSA9PiB7XG4gICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICBjb25zdCBtb2RpZmllZFJlbGF0aW9uc2hpcCA9IE9iamVjdC5hc3NpZ24oXG4gICAgICAgIHt9LFxuICAgICAgICBhcnJheVtpZHhdLFxuICAgICAgICBleHRyYXNcbiAgICAgICk7XG4gICAgICBhcnJheVtpZHhdID0gbW9kaWZpZWRSZWxhdGlvbnNoaXA7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgIHJldHVybiBzdG9yZS5fc2V0KGtleXN0cmluZywgSlNPTi5zdHJpbmdpZnkoYXJyYXkpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gbWF5YmVEZWxldGUoYXJyYXksIGlkeCwga2V5c3RyaW5nLCBzdG9yZSkge1xuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gIC50aGVuKCgpID0+IHtcbiAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgIGFycmF5LnNwbGljZShpZHgsIDEpO1xuICAgICAgcmV0dXJuIHN0b3JlLl9zZXQoa2V5c3RyaW5nLCBKU09OLnN0cmluZ2lmeShhcnJheSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0pO1xufVxuXG5cbmV4cG9ydCBjbGFzcyBLZXlWYWx1ZVN0b3JlIGV4dGVuZHMgU3RvcmFnZSB7XG4gICQkbWF4S2V5KHQpIHtcbiAgICByZXR1cm4gdGhpcy5fa2V5cyh0KVxuICAgIC50aGVuKChrZXlBcnJheSkgPT4ge1xuICAgICAgaWYgKGtleUFycmF5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBrZXlBcnJheS5tYXAoKGspID0+IGsuc3BsaXQoJzonKVsyXSlcbiAgICAgICAgLm1hcCgoaykgPT4gcGFyc2VJbnQoaywgMTApKVxuICAgICAgICAuZmlsdGVyKChpKSA9PiBzYW5lTnVtYmVyKGkpKVxuICAgICAgICAucmVkdWNlKChtYXgsIGN1cnJlbnQpID0+IChjdXJyZW50ID4gbWF4KSA/IGN1cnJlbnQgOiBtYXgsIDApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgd3JpdGUodCwgdikge1xuICAgIGNvbnN0IGlkID0gdlt0LiRpZF07XG4gICAgY29uc3QgdXBkYXRlT2JqZWN0ID0ge307XG4gICAgT2JqZWN0LmtleXModC4kZmllbGRzKS5mb3JFYWNoKChmaWVsZE5hbWUpID0+IHtcbiAgICAgIGlmICh2W2ZpZWxkTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBjb3B5IGZyb20gdiB0byB0aGUgYmVzdCBvZiBvdXIgYWJpbGl0eVxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdhcnJheScpIHx8XG4gICAgICAgICAgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdoYXNNYW55JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSB2W2ZpZWxkTmFtZV0uY29uY2F0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IE9iamVjdC5hc3NpZ24oe30sIHZbZmllbGROYW1lXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSB2W2ZpZWxkTmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoKGlkID09PSB1bmRlZmluZWQpIHx8IChpZCA9PT0gbnVsbCkpIHtcbiAgICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiQkbWF4S2V5KHQuJG5hbWUpXG4gICAgICAgIC50aGVuKChuKSA9PiB7XG4gICAgICAgICAgY29uc3QgdG9TYXZlID0gT2JqZWN0LmFzc2lnbih7fSwgdXBkYXRlT2JqZWN0LCB7IFt0LiRpZF06IG4gKyAxIH0pO1xuICAgICAgICAgIHJldHVybiB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgbiArIDEpLCBKU09OLnN0cmluZ2lmeSh0b1NhdmUpKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5vdGlmeVVwZGF0ZSh0LCB0b1NhdmVbdC4kaWRdLCB0b1NhdmUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLnRoZW4oKCkgPT4gdG9TYXZlKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgbmV3IGNvbnRlbnQgaW4gYSBub24tdGVybWluYWwgc3RvcmUnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX2dldCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCkpXG4gICAgICAudGhlbigob3JpZ1ZhbHVlKSA9PiB7XG4gICAgICAgIGNvbnN0IHVwZGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sIEpTT04ucGFyc2Uob3JpZ1ZhbHVlKSwgdXBkYXRlT2JqZWN0KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCksIEpTT04uc3RyaW5naWZ5KHVwZGF0ZSkpXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5ub3RpZnlVcGRhdGUodCwgaWQsIHVwZGF0ZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKCgpID0+IHVwZGF0ZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZWFkT25lKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCkpXG4gICAgLnRoZW4oKGQpID0+IEpTT04ucGFyc2UoZCkpO1xuICB9XG5cbiAgcmVhZE1hbnkodCwgaWQsIHJlbGF0aW9uc2hpcCkge1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcFR5cGUgPSB0LiRmaWVsZHNbcmVsYXRpb25zaGlwXS5yZWxhdGlvbnNoaXA7XG4gICAgY29uc3Qgc2lkZUluZm8gPSByZWxhdGlvbnNoaXBUeXBlLiRzaWRlc1tyZWxhdGlvbnNoaXBdO1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCByZXNvbHZlcyA9IFt0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQsIHJlbGF0aW9uc2hpcCkpXTtcbiAgICAgIGlmIChzaWRlSW5mby5zZWxmLnF1ZXJ5ICYmIHNpZGVJbmZvLnNlbGYucXVlcnkucmVxdWlyZUxvYWQpIHtcbiAgICAgICAgcmVzb2x2ZXMucHVzaCh0aGlzLnJlYWRPbmUodCwgaWQpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc29sdmVzLnB1c2goQmx1ZWJpcmQucmVzb2x2ZSh7IGlkIH0pKTtcbiAgICAgIH1cbiAgICAgIC8vIFRPRE86IGlmIHRoZXJlJ3MgYSBxdWVyeSwgS1ZTIGxvYWRzIGEgKmxvdCogaW50byBtZW1vcnkgYW5kIGZpbHRlcnNcbiAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwocmVzb2x2ZXMpO1xuICAgIH0pXG4gICAgLnRoZW4oKFthcnJheVN0cmluZywgY29udGV4dF0pID0+IHtcbiAgICAgIGxldCByZWxhdGlvbnNoaXBBcnJheSA9IEpTT04ucGFyc2UoYXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgaWYgKHNpZGVJbmZvLnNlbGYucXVlcnkpIHtcbiAgICAgICAgY29uc3QgZmlsdGVyQmxvY2sgPSBTdG9yYWdlLm1hc3NSZXBsYWNlKHNpZGVJbmZvLnNlbGYucXVlcnkubG9naWMsIGNvbnRleHQpO1xuICAgICAgICByZWxhdGlvbnNoaXBBcnJheSA9IHJlbGF0aW9uc2hpcEFycmF5LmZpbHRlcihjcmVhdGVGaWx0ZXIoZmlsdGVyQmxvY2spKTtcbiAgICAgIH1cbiAgICAgIGlmIChyZWxhdGlvbnNoaXBUeXBlLiRyZXN0cmljdCkge1xuICAgICAgICByZXR1cm4gcmVsYXRpb25zaGlwQXJyYXkuZmlsdGVyKCh2KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHJlbGF0aW9uc2hpcFR5cGUuJHJlc3RyaWN0KS5yZWR1Y2UoXG4gICAgICAgICAgICAocHJpb3IsIHJlc3RyaWN0aW9uKSA9PiBwcmlvciAmJiB2W3Jlc3RyaWN0aW9uXSA9PT0gcmVsYXRpb25zaGlwVHlwZS4kcmVzdHJpY3RbcmVzdHJpY3Rpb25dLnZhbHVlLFxuICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICk7XG4gICAgICAgIH0pLm1hcCgoZW50cnkpID0+IHtcbiAgICAgICAgICBPYmplY3Qua2V5cyhyZWxhdGlvbnNoaXBUeXBlLiRyZXN0cmljdCkuZm9yRWFjaCgoaykgPT4ge1xuICAgICAgICAgICAgZGVsZXRlIGVudHJ5W2tdOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIGVudHJ5O1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiByZWxhdGlvbnNoaXBBcnJheTtcbiAgICAgIH1cbiAgICB9KS50aGVuKChhcnkpID0+IHtcbiAgICAgIHJldHVybiB7IFtyZWxhdGlvbnNoaXBdOiBhcnkgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGRlbGV0ZSh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzLl9kZWwodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpKTtcbiAgfVxuXG4gIHdpcGUodCwgaWQsIGZpZWxkKSB7XG4gICAgaWYgKGZpZWxkID09PSAkc2VsZikge1xuICAgICAgcmV0dXJuIHRoaXMuX2RlbCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5fZGVsKHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkLCBmaWVsZCkpO1xuICAgIH1cbiAgfVxuXG4gIHdyaXRlSGFzTWFueSh0eXBlLCBpZCwgZmllbGQsIHZhbHVlKSB7XG4gICAgbGV0IHRvU2F2ZSA9IHZhbHVlO1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcEJsb2NrID0gdHlwZS4kZmllbGRzW2ZpZWxkXS5yZWxhdGlvbnNoaXA7XG4gICAgaWYgKHJlbGF0aW9uc2hpcEJsb2NrLiRyZXN0cmljdCkge1xuICAgICAgY29uc3QgcmVzdHJpY3RCbG9jayA9IHt9O1xuICAgICAgT2JqZWN0LmtleXMocmVsYXRpb25zaGlwQmxvY2suJHJlc3RyaWN0KS5mb3JFYWNoKChrKSA9PiB7XG4gICAgICAgIHJlc3RyaWN0QmxvY2tba10gPSByZWxhdGlvbnNoaXBCbG9jay4kcmVzdHJpY3Rba10udmFsdWU7XG4gICAgICB9KTtcbiAgICAgIHRvU2F2ZSA9IHRvU2F2ZS5tYXAoKHYpID0+IE9iamVjdC5hc3NpZ24oe30sIHYsIHJlc3RyaWN0QmxvY2spKTtcbiAgICB9XG4gICAgLy8gY29uc3Qgc2lkZUluZm8gPSByZWxhdGlvbnNoaXBCbG9jay4kc2lkZXNbZmllbGRdO1xuICAgIGNvbnN0IHRoaXNLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyh0eXBlLiRuYW1lLCBpZCwgZmllbGQpO1xuICAgIHJldHVybiB0aGlzLl9zZXQodGhpc0tleVN0cmluZywgSlNPTi5zdHJpbmdpZnkodG9TYXZlKSk7XG4gIH1cblxuICBhZGQodHlwZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlLCBjaGlsZElkLCBleHRyYXMgPSB7fSkge1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcEJsb2NrID0gdHlwZS4kZmllbGRzW3JlbGF0aW9uc2hpcFRpdGxlXS5yZWxhdGlvbnNoaXA7XG4gICAgY29uc3Qgc2lkZUluZm8gPSByZWxhdGlvbnNoaXBCbG9jay4kc2lkZXNbcmVsYXRpb25zaGlwVGl0bGVdO1xuICAgIGNvbnN0IHRoaXNLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyh0eXBlLiRuYW1lLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUpO1xuICAgIGNvbnN0IG90aGVyS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcoc2lkZUluZm8ub3RoZXIudHlwZSwgY2hpbGRJZCwgc2lkZUluZm8ub3RoZXIudGl0bGUpO1xuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgdGhpcy5fZ2V0KHRoaXNLZXlTdHJpbmcpLFxuICAgICAgdGhpcy5fZ2V0KG90aGVyS2V5U3RyaW5nKSxcbiAgICBdKVxuICAgIC50aGVuKChbdGhpc0FycmF5U3RyaW5nLCBvdGhlckFycmF5U3RyaW5nXSkgPT4ge1xuICAgICAgY29uc3QgdGhpc0FycmF5ID0gSlNPTi5wYXJzZSh0aGlzQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3Qgb3RoZXJBcnJheSA9IEpTT04ucGFyc2Uob3RoZXJBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCBuZXdGaWVsZCA9IHtcbiAgICAgICAgW3NpZGVJbmZvLm90aGVyLmZpZWxkXTogY2hpbGRJZCxcbiAgICAgICAgW3NpZGVJbmZvLnNlbGYuZmllbGRdOiBpZCxcbiAgICAgIH07XG4gICAgICBpZiAocmVsYXRpb25zaGlwQmxvY2suJHJlc3RyaWN0KSB7XG4gICAgICAgIE9iamVjdC5rZXlzKHJlbGF0aW9uc2hpcEJsb2NrLiRyZXN0cmljdCkuZm9yRWFjaCgocmVzdHJpY3Rpb24pID0+IHtcbiAgICAgICAgICBuZXdGaWVsZFtyZXN0cmljdGlvbl0gPSByZWxhdGlvbnNoaXBCbG9jay4kcmVzdHJpY3RbcmVzdHJpY3Rpb25dLnZhbHVlO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmIChyZWxhdGlvbnNoaXBCbG9jay4kZXh0cmFzKSB7XG4gICAgICAgIE9iamVjdC5rZXlzKHJlbGF0aW9uc2hpcEJsb2NrLiRleHRyYXMpLmZvckVhY2goKGV4dHJhKSA9PiB7XG4gICAgICAgICAgbmV3RmllbGRbZXh0cmFdID0gZXh0cmFzW2V4dHJhXTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBjb25zdCB0aGlzSWR4ID0gdGhpc0FycmF5LmZpbmRJbmRleChmaW5kRW50cnlDYWxsYmFjayhyZWxhdGlvbnNoaXBCbG9jaywgcmVsYXRpb25zaGlwVGl0bGUsIG5ld0ZpZWxkKSk7XG4gICAgICBjb25zdCBvdGhlcklkeCA9IG90aGVyQXJyYXkuZmluZEluZGV4KGZpbmRFbnRyeUNhbGxiYWNrKHJlbGF0aW9uc2hpcEJsb2NrLCByZWxhdGlvbnNoaXBUaXRsZSwgbmV3RmllbGQpKTtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICBtYXliZVB1c2godGhpc0FycmF5LCBuZXdGaWVsZCwgdGhpc0tleVN0cmluZywgdGhpcywgdGhpc0lkeCksXG4gICAgICAgIG1heWJlUHVzaChvdGhlckFycmF5LCBuZXdGaWVsZCwgb3RoZXJLZXlTdHJpbmcsIHRoaXMsIG90aGVySWR4KSxcbiAgICAgIF0pXG4gICAgICAudGhlbigoKSA9PiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBpZCwgbnVsbCwgcmVsYXRpb25zaGlwVGl0bGUpKVxuICAgICAgLnRoZW4oKCkgPT4gdGhpc0FycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIG1vZGlmeVJlbGF0aW9uc2hpcCh0eXBlLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUsIGNoaWxkSWQsIGV4dHJhcykge1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcEJsb2NrID0gdHlwZS4kZmllbGRzW3JlbGF0aW9uc2hpcFRpdGxlXS5yZWxhdGlvbnNoaXA7XG4gICAgY29uc3Qgc2lkZUluZm8gPSByZWxhdGlvbnNoaXBCbG9jay4kc2lkZXNbcmVsYXRpb25zaGlwVGl0bGVdO1xuICAgIGNvbnN0IHRoaXNLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyh0eXBlLiRuYW1lLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUpO1xuICAgIGNvbnN0IG90aGVyS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcoc2lkZUluZm8ub3RoZXIudHlwZSwgY2hpbGRJZCwgc2lkZUluZm8ub3RoZXIudGl0bGUpO1xuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgdGhpcy5fZ2V0KHRoaXNLZXlTdHJpbmcpLFxuICAgICAgdGhpcy5fZ2V0KG90aGVyS2V5U3RyaW5nKSxcbiAgICBdKVxuICAgIC50aGVuKChbdGhpc0FycmF5U3RyaW5nLCBvdGhlckFycmF5U3RyaW5nXSkgPT4ge1xuICAgICAgY29uc3QgdGhpc0FycmF5ID0gSlNPTi5wYXJzZSh0aGlzQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3Qgb3RoZXJBcnJheSA9IEpTT04ucGFyc2Uob3RoZXJBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCB0YXJnZXQgPSB7XG4gICAgICAgIFtzaWRlSW5mby5vdGhlci5maWVsZF06IGNoaWxkSWQsXG4gICAgICAgIFtzaWRlSW5mby5zZWxmLmZpZWxkXTogaWQsXG4gICAgICB9O1xuICAgICAgY29uc3QgdGhpc0lkeCA9IHRoaXNBcnJheS5maW5kSW5kZXgoZmluZEVudHJ5Q2FsbGJhY2socmVsYXRpb25zaGlwQmxvY2ssIHJlbGF0aW9uc2hpcFRpdGxlLCB0YXJnZXQpKTtcbiAgICAgIGNvbnN0IG90aGVySWR4ID0gb3RoZXJBcnJheS5maW5kSW5kZXgoZmluZEVudHJ5Q2FsbGJhY2socmVsYXRpb25zaGlwQmxvY2ssIHJlbGF0aW9uc2hpcFRpdGxlLCB0YXJnZXQpKTtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICBtYXliZVVwZGF0ZSh0aGlzQXJyYXksIHRhcmdldCwgdGhpc0tleVN0cmluZywgdGhpcywgZXh0cmFzLCB0aGlzSWR4KSxcbiAgICAgICAgbWF5YmVVcGRhdGUob3RoZXJBcnJheSwgdGFyZ2V0LCBvdGhlcktleVN0cmluZywgdGhpcywgZXh0cmFzLCBvdGhlcklkeCksXG4gICAgICBdKTtcbiAgICB9KVxuICAgIC50aGVuKChyZXMpID0+IHRoaXMubm90aWZ5VXBkYXRlKHR5cGUsIGlkLCBudWxsLCByZWxhdGlvbnNoaXBUaXRsZSkudGhlbigoKSA9PiByZXMpKTtcbiAgfVxuXG4gIHJlbW92ZSh0eXBlLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUsIGNoaWxkSWQpIHtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBCbG9jayA9IHR5cGUuJGZpZWxkc1tyZWxhdGlvbnNoaXBUaXRsZV0ucmVsYXRpb25zaGlwO1xuICAgIGNvbnN0IHNpZGVJbmZvID0gcmVsYXRpb25zaGlwQmxvY2suJHNpZGVzW3JlbGF0aW9uc2hpcFRpdGxlXTtcbiAgICBjb25zdCB0aGlzS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcodHlwZS4kbmFtZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlKTtcbiAgICBjb25zdCBvdGhlcktleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHNpZGVJbmZvLm90aGVyLnR5cGUsIGNoaWxkSWQsIHNpZGVJbmZvLm90aGVyLnRpdGxlKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgIHRoaXMuX2dldCh0aGlzS2V5U3RyaW5nKSxcbiAgICAgIHRoaXMuX2dldChvdGhlcktleVN0cmluZyksXG4gICAgXSlcbiAgICAudGhlbigoW3RoaXNBcnJheVN0cmluZywgb3RoZXJBcnJheVN0cmluZ10pID0+IHtcbiAgICAgIGNvbnN0IHRoaXNBcnJheSA9IEpTT04ucGFyc2UodGhpc0FycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IG90aGVyQXJyYXkgPSBKU09OLnBhcnNlKG90aGVyQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3QgdGFyZ2V0ID0ge1xuICAgICAgICBbc2lkZUluZm8ub3RoZXIuZmllbGRdOiBjaGlsZElkLFxuICAgICAgICBbc2lkZUluZm8uc2VsZi5maWVsZF06IGlkLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IHRoaXNJZHggPSB0aGlzQXJyYXkuZmluZEluZGV4KGZpbmRFbnRyeUNhbGxiYWNrKHJlbGF0aW9uc2hpcEJsb2NrLCByZWxhdGlvbnNoaXBUaXRsZSwgdGFyZ2V0KSk7XG4gICAgICBjb25zdCBvdGhlcklkeCA9IG90aGVyQXJyYXkuZmluZEluZGV4KGZpbmRFbnRyeUNhbGxiYWNrKHJlbGF0aW9uc2hpcEJsb2NrLCByZWxhdGlvbnNoaXBUaXRsZSwgdGFyZ2V0KSk7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgbWF5YmVEZWxldGUodGhpc0FycmF5LCB0aGlzSWR4LCB0aGlzS2V5U3RyaW5nLCB0aGlzKSxcbiAgICAgICAgbWF5YmVEZWxldGUob3RoZXJBcnJheSwgb3RoZXJJZHgsIG90aGVyS2V5U3RyaW5nLCB0aGlzKSxcbiAgICAgIF0pO1xuICAgIH0pXG4gICAgLnRoZW4oKHJlcykgPT4gdGhpcy5ub3RpZnlVcGRhdGUodHlwZSwgaWQsIG51bGwsIHJlbGF0aW9uc2hpcFRpdGxlKS50aGVuKCgpID0+IHJlcykpO1xuICB9XG5cbiAga2V5U3RyaW5nKHR5cGVOYW1lLCBpZCwgcmVsYXRpb25zaGlwKSB7XG4gICAgcmV0dXJuIGAke3R5cGVOYW1lfToke3JlbGF0aW9uc2hpcCB8fCAnc3RvcmUnfToke2lkfWA7XG4gIH1cbn1cbiJdfQ==
