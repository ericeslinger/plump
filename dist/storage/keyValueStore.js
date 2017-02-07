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
      if (id === undefined || id === null) {
        if (this.terminal) {
          return this.$$maxKey(t.$name).then(function (n) {
            var toSave = Object.assign({}, updateObject, _defineProperty({}, t.$id, n + 1));
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

      var relationshipType = t.$fields[relationship].relationship;
      var sideInfo = relationshipType.$sides[relationship];
      return Bluebird.resolve().then(function () {
        var resolves = [_this3._get(_this3.keyString(t.$name, id, relationship))];
        if (sideInfo.self.query && sideInfo.self.query.requireLoad) {
          resolves.push(_this3.readOne(t, id));
        } else {
          resolves.push(Bluebird.resolve({ id: id }));
        }
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
      var relationshipBlock = type.$fields[field].relationship;
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

      var relationshipBlock = type.$fields[relationshipTitle].relationship;
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

      var relationshipBlock = type.$fields[relationshipTitle].relationship;
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

      var relationshipBlock = type.$fields[relationshipTitle].relationship;
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uva2V5VmFsdWVTdG9yZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsInNhbmVOdW1iZXIiLCJpIiwiaXNOYU4iLCJJbmZpbml0eSIsImZpbmRFbnRyeUNhbGxiYWNrIiwicmVsYXRpb25zaGlwIiwicmVsYXRpb25zaGlwVGl0bGUiLCJ0YXJnZXQiLCJzaWRlSW5mbyIsIiRzaWRlcyIsInZhbHVlIiwic2VsZiIsImZpZWxkIiwib3RoZXIiLCIkcmVzdHJpY3QiLCJPYmplY3QiLCJrZXlzIiwicmVkdWNlIiwicHJpb3IiLCJyZXN0cmljdGlvbiIsIm1heWJlUHVzaCIsImFycmF5IiwidmFsIiwia2V5c3RyaW5nIiwic3RvcmUiLCJpZHgiLCJyZXNvbHZlIiwidGhlbiIsInB1c2giLCJfc2V0IiwiSlNPTiIsInN0cmluZ2lmeSIsIm1heWJlVXBkYXRlIiwiZXh0cmFzIiwibW9kaWZpZWRSZWxhdGlvbnNoaXAiLCJhc3NpZ24iLCJtYXliZURlbGV0ZSIsInNwbGljZSIsIktleVZhbHVlU3RvcmUiLCJ0IiwiX2tleXMiLCJrZXlBcnJheSIsImxlbmd0aCIsIm1hcCIsImsiLCJzcGxpdCIsInBhcnNlSW50IiwiZmlsdGVyIiwibWF4IiwiY3VycmVudCIsInYiLCJpZCIsIiRpZCIsInVwZGF0ZU9iamVjdCIsIiRmaWVsZHMiLCJmb3JFYWNoIiwiZmllbGROYW1lIiwidW5kZWZpbmVkIiwidHlwZSIsImNvbmNhdCIsInRlcm1pbmFsIiwiJCRtYXhLZXkiLCIkbmFtZSIsIm4iLCJ0b1NhdmUiLCJrZXlTdHJpbmciLCJub3RpZnlVcGRhdGUiLCJFcnJvciIsIl9nZXQiLCJvcmlnVmFsdWUiLCJ1cGRhdGUiLCJwYXJzZSIsImQiLCJyZWxhdGlvbnNoaXBUeXBlIiwicmVzb2x2ZXMiLCJxdWVyeSIsInJlcXVpcmVMb2FkIiwicmVhZE9uZSIsImFsbCIsImFycmF5U3RyaW5nIiwiY29udGV4dCIsInJlbGF0aW9uc2hpcEFycmF5IiwiZmlsdGVyQmxvY2siLCJtYXNzUmVwbGFjZSIsImxvZ2ljIiwiZW50cnkiLCJhcnkiLCJfZGVsIiwicmVsYXRpb25zaGlwQmxvY2siLCJyZXN0cmljdEJsb2NrIiwidGhpc0tleVN0cmluZyIsImNoaWxkSWQiLCJvdGhlcktleVN0cmluZyIsInRpdGxlIiwidGhpc0FycmF5U3RyaW5nIiwib3RoZXJBcnJheVN0cmluZyIsInRoaXNBcnJheSIsIm90aGVyQXJyYXkiLCJuZXdGaWVsZCIsIiRleHRyYXMiLCJleHRyYSIsInRoaXNJZHgiLCJmaW5kSW5kZXgiLCJvdGhlcklkeCIsInJlcyIsInR5cGVOYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztJQUFZQSxROztBQUNaOztBQUNBOztBQUNBOzs7Ozs7Ozs7Ozs7QUFFQSxTQUFTQyxVQUFULENBQW9CQyxDQUFwQixFQUF1QjtBQUNyQixTQUFTLE9BQU9BLENBQVAsS0FBYSxRQUFkLElBQTRCLENBQUNDLE1BQU1ELENBQU4sQ0FBN0IsSUFBMkNBLE1BQU1FLFFBQVAsR0FBb0JGLE1BQU0sQ0FBQ0UsUUFBN0U7QUFDRDs7QUFFRCxTQUFTQyxpQkFBVCxDQUEyQkMsWUFBM0IsRUFBeUNDLGlCQUF6QyxFQUE0REMsTUFBNUQsRUFBb0U7QUFDbEUsTUFBTUMsV0FBV0gsYUFBYUksTUFBYixDQUFvQkgsaUJBQXBCLENBQWpCO0FBQ0EsU0FBTyxVQUFDSSxLQUFELEVBQVc7QUFDaEIsUUFDR0EsTUFBTUYsU0FBU0csSUFBVCxDQUFjQyxLQUFwQixNQUErQkwsT0FBT0MsU0FBU0csSUFBVCxDQUFjQyxLQUFyQixDQUFoQyxJQUNDRixNQUFNRixTQUFTSyxLQUFULENBQWVELEtBQXJCLE1BQWdDTCxPQUFPQyxTQUFTSyxLQUFULENBQWVELEtBQXRCLENBRm5DLEVBR0U7QUFDQSxVQUFJUCxhQUFhUyxTQUFqQixFQUE0QjtBQUMxQixlQUFPQyxPQUFPQyxJQUFQLENBQVlYLGFBQWFTLFNBQXpCLEVBQW9DRyxNQUFwQyxDQUNMLFVBQUNDLEtBQUQsRUFBUUMsV0FBUjtBQUFBLGlCQUF3QkQsU0FBU1IsTUFBTVMsV0FBTixNQUF1QmQsYUFBYVMsU0FBYixDQUF1QkssV0FBdkIsRUFBb0NULEtBQTVGO0FBQUEsU0FESyxFQUVMLElBRkssQ0FBUDtBQUlELE9BTEQsTUFLTztBQUNMLGVBQU8sSUFBUDtBQUNEO0FBQ0YsS0FaRCxNQVlPO0FBQ0wsYUFBTyxLQUFQO0FBQ0Q7QUFDRixHQWhCRDtBQWlCRDs7QUFFRCxTQUFTVSxTQUFULENBQW1CQyxLQUFuQixFQUEwQkMsR0FBMUIsRUFBK0JDLFNBQS9CLEVBQTBDQyxLQUExQyxFQUFpREMsR0FBakQsRUFBc0Q7QUFDcEQsU0FBTzFCLFNBQVMyQixPQUFULEdBQ05DLElBRE0sQ0FDRCxZQUFNO0FBQ1YsUUFBSUYsTUFBTSxDQUFWLEVBQWE7QUFDWEosWUFBTU8sSUFBTixDQUFXTixHQUFYO0FBQ0EsYUFBT0UsTUFBTUssSUFBTixDQUFXTixTQUFYLEVBQXNCTyxLQUFLQyxTQUFMLENBQWVWLEtBQWYsQ0FBdEIsQ0FBUDtBQUNELEtBSEQsTUFHTztBQUNMLGFBQU8sSUFBUDtBQUNEO0FBQ0YsR0FSTSxDQUFQO0FBU0Q7O0FBR0QsU0FBU1csV0FBVCxDQUFxQlgsS0FBckIsRUFBNEJDLEdBQTVCLEVBQWlDQyxTQUFqQyxFQUE0Q0MsS0FBNUMsRUFBbURTLE1BQW5ELEVBQTJEUixHQUEzRCxFQUFnRTtBQUM5RCxTQUFPMUIsU0FBUzJCLE9BQVQsR0FDTkMsSUFETSxDQUNELFlBQU07QUFDVixRQUFJRixPQUFPLENBQVgsRUFBYztBQUNaLFVBQU1TLHVCQUF1Qm5CLE9BQU9vQixNQUFQLENBQzNCLEVBRDJCLEVBRTNCZCxNQUFNSSxHQUFOLENBRjJCLEVBRzNCUSxNQUgyQixDQUE3QjtBQUtBWixZQUFNSSxHQUFOLElBQWFTLG9CQUFiLENBTlksQ0FNdUI7QUFDbkMsYUFBT1YsTUFBTUssSUFBTixDQUFXTixTQUFYLEVBQXNCTyxLQUFLQyxTQUFMLENBQWVWLEtBQWYsQ0FBdEIsQ0FBUDtBQUNELEtBUkQsTUFRTztBQUNMLGFBQU8sSUFBUDtBQUNEO0FBQ0YsR0FiTSxDQUFQO0FBY0Q7O0FBRUQsU0FBU2UsV0FBVCxDQUFxQmYsS0FBckIsRUFBNEJJLEdBQTVCLEVBQWlDRixTQUFqQyxFQUE0Q0MsS0FBNUMsRUFBbUQ7QUFDakQsU0FBT3pCLFNBQVMyQixPQUFULEdBQ05DLElBRE0sQ0FDRCxZQUFNO0FBQ1YsUUFBSUYsT0FBTyxDQUFYLEVBQWM7QUFDWkosWUFBTWdCLE1BQU4sQ0FBYVosR0FBYixFQUFrQixDQUFsQjtBQUNBLGFBQU9ELE1BQU1LLElBQU4sQ0FBV04sU0FBWCxFQUFzQk8sS0FBS0MsU0FBTCxDQUFlVixLQUFmLENBQXRCLENBQVA7QUFDRCxLQUhELE1BR087QUFDTCxhQUFPLElBQVA7QUFDRDtBQUNGLEdBUk0sQ0FBUDtBQVNEOztJQUdZaUIsYSxXQUFBQSxhOzs7Ozs7Ozs7Ozs2QkFDRkMsQyxFQUFHO0FBQ1YsYUFBTyxLQUFLQyxLQUFMLENBQVdELENBQVgsRUFDTlosSUFETSxDQUNELFVBQUNjLFFBQUQsRUFBYztBQUNsQixZQUFJQSxTQUFTQyxNQUFULEtBQW9CLENBQXhCLEVBQTJCO0FBQ3pCLGlCQUFPLENBQVA7QUFDRCxTQUZELE1BRU87QUFDTCxpQkFBT0QsU0FBU0UsR0FBVCxDQUFhLFVBQUNDLENBQUQ7QUFBQSxtQkFBT0EsRUFBRUMsS0FBRixDQUFRLEdBQVIsRUFBYSxDQUFiLENBQVA7QUFBQSxXQUFiLEVBQ05GLEdBRE0sQ0FDRixVQUFDQyxDQUFEO0FBQUEsbUJBQU9FLFNBQVNGLENBQVQsRUFBWSxFQUFaLENBQVA7QUFBQSxXQURFLEVBRU5HLE1BRk0sQ0FFQyxVQUFDOUMsQ0FBRDtBQUFBLG1CQUFPRCxXQUFXQyxDQUFYLENBQVA7QUFBQSxXQUZELEVBR05nQixNQUhNLENBR0MsVUFBQytCLEdBQUQsRUFBTUMsT0FBTjtBQUFBLG1CQUFtQkEsVUFBVUQsR0FBWCxHQUFrQkMsT0FBbEIsR0FBNEJELEdBQTlDO0FBQUEsV0FIRCxFQUdvRCxDQUhwRCxDQUFQO0FBSUQ7QUFDRixPQVZNLENBQVA7QUFXRDs7OzBCQUVLVCxDLEVBQUdXLEMsRUFBRztBQUFBOztBQUNWLFVBQU1DLEtBQUtELEVBQUVYLEVBQUVhLEdBQUosQ0FBWDtBQUNBLFVBQU1DLGVBQWUsRUFBckI7QUFDQXRDLGFBQU9DLElBQVAsQ0FBWXVCLEVBQUVlLE9BQWQsRUFBdUJDLE9BQXZCLENBQStCLFVBQUNDLFNBQUQsRUFBZTtBQUM1QyxZQUFJTixFQUFFTSxTQUFGLE1BQWlCQyxTQUFyQixFQUFnQztBQUM5QjtBQUNBLGNBQ0dsQixFQUFFZSxPQUFGLENBQVVFLFNBQVYsRUFBcUJFLElBQXJCLEtBQThCLE9BQS9CLElBQ0NuQixFQUFFZSxPQUFGLENBQVVFLFNBQVYsRUFBcUJFLElBQXJCLEtBQThCLFNBRmpDLEVBR0U7QUFDQUwseUJBQWFHLFNBQWIsSUFBMEJOLEVBQUVNLFNBQUYsRUFBYUcsTUFBYixFQUExQjtBQUNELFdBTEQsTUFLTyxJQUFJcEIsRUFBRWUsT0FBRixDQUFVRSxTQUFWLEVBQXFCRSxJQUFyQixLQUE4QixRQUFsQyxFQUE0QztBQUNqREwseUJBQWFHLFNBQWIsSUFBMEJ6QyxPQUFPb0IsTUFBUCxDQUFjLEVBQWQsRUFBa0JlLEVBQUVNLFNBQUYsQ0FBbEIsQ0FBMUI7QUFDRCxXQUZNLE1BRUE7QUFDTEgseUJBQWFHLFNBQWIsSUFBMEJOLEVBQUVNLFNBQUYsQ0FBMUI7QUFDRDtBQUNGO0FBQ0YsT0FkRDtBQWVBLFVBQUtMLE9BQU9NLFNBQVIsSUFBdUJOLE9BQU8sSUFBbEMsRUFBeUM7QUFDdkMsWUFBSSxLQUFLUyxRQUFULEVBQW1CO0FBQ2pCLGlCQUFPLEtBQUtDLFFBQUwsQ0FBY3RCLEVBQUV1QixLQUFoQixFQUNObkMsSUFETSxDQUNELFVBQUNvQyxDQUFELEVBQU87QUFDWCxnQkFBTUMsU0FBU2pELE9BQU9vQixNQUFQLENBQWMsRUFBZCxFQUFrQmtCLFlBQWxCLHNCQUFtQ2QsRUFBRWEsR0FBckMsRUFBMkNXLElBQUksQ0FBL0MsRUFBZjtBQUNBLG1CQUFPLE9BQUtsQyxJQUFMLENBQVUsT0FBS29DLFNBQUwsQ0FBZTFCLEVBQUV1QixLQUFqQixFQUF3QkMsSUFBSSxDQUE1QixDQUFWLEVBQTBDakMsS0FBS0MsU0FBTCxDQUFlaUMsTUFBZixDQUExQyxFQUNOckMsSUFETSxDQUNELFlBQU07QUFDVixxQkFBTyxPQUFLdUMsWUFBTCxDQUFrQjNCLENBQWxCLEVBQXFCeUIsT0FBT3pCLEVBQUVhLEdBQVQsQ0FBckIsRUFBb0NZLE1BQXBDLENBQVA7QUFDRCxhQUhNLEVBSU5yQyxJQUpNLENBSUQ7QUFBQSxxQkFBTXFDLE1BQU47QUFBQSxhQUpDLENBQVA7QUFLRCxXQVJNLENBQVA7QUFTRCxTQVZELE1BVU87QUFDTCxnQkFBTSxJQUFJRyxLQUFKLENBQVUsbURBQVYsQ0FBTjtBQUNEO0FBQ0YsT0FkRCxNQWNPO0FBQ0wsZUFBTyxLQUFLQyxJQUFMLENBQVUsS0FBS0gsU0FBTCxDQUFlMUIsRUFBRXVCLEtBQWpCLEVBQXdCWCxFQUF4QixDQUFWLEVBQ054QixJQURNLENBQ0QsVUFBQzBDLFNBQUQsRUFBZTtBQUNuQixjQUFNQyxTQUFTdkQsT0FBT29CLE1BQVAsQ0FBYyxFQUFkLEVBQWtCTCxLQUFLeUMsS0FBTCxDQUFXRixTQUFYLENBQWxCLEVBQXlDaEIsWUFBekMsQ0FBZjtBQUNBLGlCQUFPLE9BQUt4QixJQUFMLENBQVUsT0FBS29DLFNBQUwsQ0FBZTFCLEVBQUV1QixLQUFqQixFQUF3QlgsRUFBeEIsQ0FBVixFQUF1Q3JCLEtBQUtDLFNBQUwsQ0FBZXVDLE1BQWYsQ0FBdkMsRUFDTjNDLElBRE0sQ0FDRCxZQUFNO0FBQ1YsbUJBQU8sT0FBS3VDLFlBQUwsQ0FBa0IzQixDQUFsQixFQUFxQlksRUFBckIsRUFBeUJtQixNQUF6QixDQUFQO0FBQ0QsV0FITSxFQUlOM0MsSUFKTSxDQUlEO0FBQUEsbUJBQU0yQyxNQUFOO0FBQUEsV0FKQyxDQUFQO0FBS0QsU0FSTSxDQUFQO0FBU0Q7QUFDRjs7OzRCQUVPL0IsQyxFQUFHWSxFLEVBQUk7QUFDYixhQUFPLEtBQUtpQixJQUFMLENBQVUsS0FBS0gsU0FBTCxDQUFlMUIsRUFBRXVCLEtBQWpCLEVBQXdCWCxFQUF4QixDQUFWLEVBQ054QixJQURNLENBQ0QsVUFBQzZDLENBQUQ7QUFBQSxlQUFPMUMsS0FBS3lDLEtBQUwsQ0FBV0MsQ0FBWCxDQUFQO0FBQUEsT0FEQyxDQUFQO0FBRUQ7Ozs2QkFFUWpDLEMsRUFBR1ksRSxFQUFJOUMsWSxFQUFjO0FBQUE7O0FBQzVCLFVBQU1vRSxtQkFBbUJsQyxFQUFFZSxPQUFGLENBQVVqRCxZQUFWLEVBQXdCQSxZQUFqRDtBQUNBLFVBQU1HLFdBQVdpRSxpQkFBaUJoRSxNQUFqQixDQUF3QkosWUFBeEIsQ0FBakI7QUFDQSxhQUFPTixTQUFTMkIsT0FBVCxHQUNOQyxJQURNLENBQ0QsWUFBTTtBQUNWLFlBQU0rQyxXQUFXLENBQUMsT0FBS04sSUFBTCxDQUFVLE9BQUtILFNBQUwsQ0FBZTFCLEVBQUV1QixLQUFqQixFQUF3QlgsRUFBeEIsRUFBNEI5QyxZQUE1QixDQUFWLENBQUQsQ0FBakI7QUFDQSxZQUFJRyxTQUFTRyxJQUFULENBQWNnRSxLQUFkLElBQXVCbkUsU0FBU0csSUFBVCxDQUFjZ0UsS0FBZCxDQUFvQkMsV0FBL0MsRUFBNEQ7QUFDMURGLG1CQUFTOUMsSUFBVCxDQUFjLE9BQUtpRCxPQUFMLENBQWF0QyxDQUFiLEVBQWdCWSxFQUFoQixDQUFkO0FBQ0QsU0FGRCxNQUVPO0FBQ0x1QixtQkFBUzlDLElBQVQsQ0FBYzdCLFNBQVMyQixPQUFULENBQWlCLEVBQUV5QixNQUFGLEVBQWpCLENBQWQ7QUFDRDtBQUNELGVBQU9wRCxTQUFTK0UsR0FBVCxDQUFhSixRQUFiLENBQVA7QUFDRCxPQVRNLEVBVU4vQyxJQVZNLENBVUQsZ0JBQTRCO0FBQUE7QUFBQSxZQUExQm9ELFdBQTBCO0FBQUEsWUFBYkMsT0FBYTs7QUFDaEMsWUFBSUMsb0JBQW9CbkQsS0FBS3lDLEtBQUwsQ0FBV1EsV0FBWCxLQUEyQixFQUFuRDtBQUNBLFlBQUl2RSxTQUFTRyxJQUFULENBQWNnRSxLQUFsQixFQUF5QjtBQUN2QixjQUFNTyxjQUFjLGlCQUFRQyxXQUFSLENBQW9CM0UsU0FBU0csSUFBVCxDQUFjZ0UsS0FBZCxDQUFvQlMsS0FBeEMsRUFBK0NKLE9BQS9DLENBQXBCO0FBQ0FDLDhCQUFvQkEsa0JBQWtCbEMsTUFBbEIsQ0FBeUIsZ0NBQWFtQyxXQUFiLENBQXpCLENBQXBCO0FBQ0Q7QUFDRCxZQUFJVCxpQkFBaUIzRCxTQUFyQixFQUFnQztBQUM5QixpQkFBT21FLGtCQUFrQmxDLE1BQWxCLENBQXlCLFVBQUNHLENBQUQsRUFBTztBQUNyQyxtQkFBT25DLE9BQU9DLElBQVAsQ0FBWXlELGlCQUFpQjNELFNBQTdCLEVBQXdDRyxNQUF4QyxDQUNMLFVBQUNDLEtBQUQsRUFBUUMsV0FBUjtBQUFBLHFCQUF3QkQsU0FBU2dDLEVBQUUvQixXQUFGLE1BQW1Cc0QsaUJBQWlCM0QsU0FBakIsQ0FBMkJLLFdBQTNCLEVBQXdDVCxLQUE1RjtBQUFBLGFBREssRUFFTCxJQUZLLENBQVA7QUFJRCxXQUxNLEVBS0ppQyxHQUxJLENBS0EsVUFBQzBDLEtBQUQsRUFBVztBQUNoQnRFLG1CQUFPQyxJQUFQLENBQVl5RCxpQkFBaUIzRCxTQUE3QixFQUF3Q3lDLE9BQXhDLENBQWdELFVBQUNYLENBQUQsRUFBTztBQUNyRCxxQkFBT3lDLE1BQU16QyxDQUFOLENBQVAsQ0FEcUQsQ0FDcEM7QUFDbEIsYUFGRDtBQUdBLG1CQUFPeUMsS0FBUDtBQUNELFdBVk0sQ0FBUDtBQVdELFNBWkQsTUFZTztBQUNMLGlCQUFPSixpQkFBUDtBQUNEO0FBQ0YsT0EvQk0sRUErQkp0RCxJQS9CSSxDQStCQyxVQUFDMkQsR0FBRCxFQUFTO0FBQ2YsbUNBQVVqRixZQUFWLEVBQXlCaUYsR0FBekI7QUFDRCxPQWpDTSxDQUFQO0FBa0NEOzs7NEJBRU0vQyxDLEVBQUdZLEUsRUFBSTtBQUNaLGFBQU8sS0FBS29DLElBQUwsQ0FBVSxLQUFLdEIsU0FBTCxDQUFlMUIsRUFBRXVCLEtBQWpCLEVBQXdCWCxFQUF4QixDQUFWLENBQVA7QUFDRDs7O3lCQUVJWixDLEVBQUdZLEUsRUFBSXZDLEssRUFBTztBQUNqQixVQUFJQSxzQkFBSixFQUFxQjtBQUNuQixlQUFPLEtBQUsyRSxJQUFMLENBQVUsS0FBS3RCLFNBQUwsQ0FBZTFCLEVBQUV1QixLQUFqQixFQUF3QlgsRUFBeEIsQ0FBVixDQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBTyxLQUFLb0MsSUFBTCxDQUFVLEtBQUt0QixTQUFMLENBQWUxQixFQUFFdUIsS0FBakIsRUFBd0JYLEVBQXhCLEVBQTRCdkMsS0FBNUIsQ0FBVixDQUFQO0FBQ0Q7QUFDRjs7O2lDQUVZOEMsSSxFQUFNUCxFLEVBQUl2QyxLLEVBQU9GLEssRUFBTztBQUNuQyxVQUFJc0QsU0FBU3RELEtBQWI7QUFDQSxVQUFNOEUsb0JBQW9COUIsS0FBS0osT0FBTCxDQUFhMUMsS0FBYixFQUFvQlAsWUFBOUM7QUFDQSxVQUFJbUYsa0JBQWtCMUUsU0FBdEIsRUFBaUM7QUFBQTtBQUMvQixjQUFNMkUsZ0JBQWdCLEVBQXRCO0FBQ0ExRSxpQkFBT0MsSUFBUCxDQUFZd0Usa0JBQWtCMUUsU0FBOUIsRUFBeUN5QyxPQUF6QyxDQUFpRCxVQUFDWCxDQUFELEVBQU87QUFDdEQ2QywwQkFBYzdDLENBQWQsSUFBbUI0QyxrQkFBa0IxRSxTQUFsQixDQUE0QjhCLENBQTVCLEVBQStCbEMsS0FBbEQ7QUFDRCxXQUZEO0FBR0FzRCxtQkFBU0EsT0FBT3JCLEdBQVAsQ0FBVyxVQUFDTyxDQUFEO0FBQUEsbUJBQU9uQyxPQUFPb0IsTUFBUCxDQUFjLEVBQWQsRUFBa0JlLENBQWxCLEVBQXFCdUMsYUFBckIsQ0FBUDtBQUFBLFdBQVgsQ0FBVDtBQUwrQjtBQU1oQztBQUNEO0FBQ0EsVUFBTUMsZ0JBQWdCLEtBQUt6QixTQUFMLENBQWVQLEtBQUtJLEtBQXBCLEVBQTJCWCxFQUEzQixFQUErQnZDLEtBQS9CLENBQXRCO0FBQ0EsYUFBTyxLQUFLaUIsSUFBTCxDQUFVNkQsYUFBVixFQUF5QjVELEtBQUtDLFNBQUwsQ0FBZWlDLE1BQWYsQ0FBekIsQ0FBUDtBQUNEOzs7d0JBRUdOLEksRUFBTVAsRSxFQUFJN0MsaUIsRUFBbUJxRixPLEVBQXNCO0FBQUE7O0FBQUEsVUFBYjFELE1BQWEsdUVBQUosRUFBSTs7QUFDckQsVUFBTXVELG9CQUFvQjlCLEtBQUtKLE9BQUwsQ0FBYWhELGlCQUFiLEVBQWdDRCxZQUExRDtBQUNBLFVBQU1HLFdBQVdnRixrQkFBa0IvRSxNQUFsQixDQUF5QkgsaUJBQXpCLENBQWpCO0FBQ0EsVUFBTW9GLGdCQUFnQixLQUFLekIsU0FBTCxDQUFlUCxLQUFLSSxLQUFwQixFQUEyQlgsRUFBM0IsRUFBK0I3QyxpQkFBL0IsQ0FBdEI7QUFDQSxVQUFNc0YsaUJBQWlCLEtBQUszQixTQUFMLENBQWV6RCxTQUFTSyxLQUFULENBQWU2QyxJQUE5QixFQUFvQ2lDLE9BQXBDLEVBQTZDbkYsU0FBU0ssS0FBVCxDQUFlZ0YsS0FBNUQsQ0FBdkI7QUFDQSxhQUFPOUYsU0FBUytFLEdBQVQsQ0FBYSxDQUNsQixLQUFLVixJQUFMLENBQVVzQixhQUFWLENBRGtCLEVBRWxCLEtBQUt0QixJQUFMLENBQVV3QixjQUFWLENBRmtCLENBQWIsRUFJTmpFLElBSk0sQ0FJRCxpQkFBeUM7QUFBQTs7QUFBQTtBQUFBLFlBQXZDbUUsZUFBdUM7QUFBQSxZQUF0QkMsZ0JBQXNCOztBQUM3QyxZQUFNQyxZQUFZbEUsS0FBS3lDLEtBQUwsQ0FBV3VCLGVBQVgsS0FBK0IsRUFBakQ7QUFDQSxZQUFNRyxhQUFhbkUsS0FBS3lDLEtBQUwsQ0FBV3dCLGdCQUFYLEtBQWdDLEVBQW5EO0FBQ0EsWUFBTUcsdURBQ0gxRixTQUFTSyxLQUFULENBQWVELEtBRFosRUFDb0IrRSxPQURwQiw4QkFFSG5GLFNBQVNHLElBQVQsQ0FBY0MsS0FGWCxFQUVtQnVDLEVBRm5CLGFBQU47QUFJQSxZQUFJcUMsa0JBQWtCMUUsU0FBdEIsRUFBaUM7QUFDL0JDLGlCQUFPQyxJQUFQLENBQVl3RSxrQkFBa0IxRSxTQUE5QixFQUF5Q3lDLE9BQXpDLENBQWlELFVBQUNwQyxXQUFELEVBQWlCO0FBQ2hFK0UscUJBQVMvRSxXQUFULElBQXdCcUUsa0JBQWtCMUUsU0FBbEIsQ0FBNEJLLFdBQTVCLEVBQXlDVCxLQUFqRTtBQUNELFdBRkQ7QUFHRDtBQUNELFlBQUk4RSxrQkFBa0JXLE9BQXRCLEVBQStCO0FBQzdCcEYsaUJBQU9DLElBQVAsQ0FBWXdFLGtCQUFrQlcsT0FBOUIsRUFBdUM1QyxPQUF2QyxDQUErQyxVQUFDNkMsS0FBRCxFQUFXO0FBQ3hERixxQkFBU0UsS0FBVCxJQUFrQm5FLE9BQU9tRSxLQUFQLENBQWxCO0FBQ0QsV0FGRDtBQUdEO0FBQ0QsWUFBTUMsVUFBVUwsVUFBVU0sU0FBVixDQUFvQmxHLGtCQUFrQm9GLGlCQUFsQixFQUFxQ2xGLGlCQUFyQyxFQUF3RDRGLFFBQXhELENBQXBCLENBQWhCO0FBQ0EsWUFBTUssV0FBV04sV0FBV0ssU0FBWCxDQUFxQmxHLGtCQUFrQm9GLGlCQUFsQixFQUFxQ2xGLGlCQUFyQyxFQUF3RDRGLFFBQXhELENBQXJCLENBQWpCO0FBQ0EsZUFBT25HLFNBQVMrRSxHQUFULENBQWEsQ0FDbEIxRCxVQUFVNEUsU0FBVixFQUFxQkUsUUFBckIsRUFBK0JSLGFBQS9CLFVBQW9EVyxPQUFwRCxDQURrQixFQUVsQmpGLFVBQVU2RSxVQUFWLEVBQXNCQyxRQUF0QixFQUFnQ04sY0FBaEMsVUFBc0RXLFFBQXRELENBRmtCLENBQWIsRUFJTjVFLElBSk0sQ0FJRDtBQUFBLGlCQUFNLE9BQUt1QyxZQUFMLENBQWtCUixJQUFsQixFQUF3QlAsRUFBeEIsRUFBNEIsSUFBNUIsRUFBa0M3QyxpQkFBbEMsQ0FBTjtBQUFBLFNBSkMsRUFLTnFCLElBTE0sQ0FLRDtBQUFBLGlCQUFNcUUsU0FBTjtBQUFBLFNBTEMsQ0FBUDtBQU1ELE9BN0JNLENBQVA7QUE4QkQ7Ozt1Q0FFa0J0QyxJLEVBQU1QLEUsRUFBSTdDLGlCLEVBQW1CcUYsTyxFQUFTMUQsTSxFQUFRO0FBQUE7O0FBQy9ELFVBQU11RCxvQkFBb0I5QixLQUFLSixPQUFMLENBQWFoRCxpQkFBYixFQUFnQ0QsWUFBMUQ7QUFDQSxVQUFNRyxXQUFXZ0Ysa0JBQWtCL0UsTUFBbEIsQ0FBeUJILGlCQUF6QixDQUFqQjtBQUNBLFVBQU1vRixnQkFBZ0IsS0FBS3pCLFNBQUwsQ0FBZVAsS0FBS0ksS0FBcEIsRUFBMkJYLEVBQTNCLEVBQStCN0MsaUJBQS9CLENBQXRCO0FBQ0EsVUFBTXNGLGlCQUFpQixLQUFLM0IsU0FBTCxDQUFlekQsU0FBU0ssS0FBVCxDQUFlNkMsSUFBOUIsRUFBb0NpQyxPQUFwQyxFQUE2Q25GLFNBQVNLLEtBQVQsQ0FBZWdGLEtBQTVELENBQXZCO0FBQ0EsYUFBTzlGLFNBQVMrRSxHQUFULENBQWEsQ0FDbEIsS0FBS1YsSUFBTCxDQUFVc0IsYUFBVixDQURrQixFQUVsQixLQUFLdEIsSUFBTCxDQUFVd0IsY0FBVixDQUZrQixDQUFiLEVBSU5qRSxJQUpNLENBSUQsaUJBQXlDO0FBQUE7O0FBQUE7QUFBQSxZQUF2Q21FLGVBQXVDO0FBQUEsWUFBdEJDLGdCQUFzQjs7QUFDN0MsWUFBTUMsWUFBWWxFLEtBQUt5QyxLQUFMLENBQVd1QixlQUFYLEtBQStCLEVBQWpEO0FBQ0EsWUFBTUcsYUFBYW5FLEtBQUt5QyxLQUFMLENBQVd3QixnQkFBWCxLQUFnQyxFQUFuRDtBQUNBLFlBQU14RixpREFDSEMsU0FBU0ssS0FBVCxDQUFlRCxLQURaLEVBQ29CK0UsT0FEcEIsNEJBRUhuRixTQUFTRyxJQUFULENBQWNDLEtBRlgsRUFFbUJ1QyxFQUZuQixXQUFOO0FBSUEsWUFBTWtELFVBQVVMLFVBQVVNLFNBQVYsQ0FBb0JsRyxrQkFBa0JvRixpQkFBbEIsRUFBcUNsRixpQkFBckMsRUFBd0RDLE1BQXhELENBQXBCLENBQWhCO0FBQ0EsWUFBTWdHLFdBQVdOLFdBQVdLLFNBQVgsQ0FBcUJsRyxrQkFBa0JvRixpQkFBbEIsRUFBcUNsRixpQkFBckMsRUFBd0RDLE1BQXhELENBQXJCLENBQWpCO0FBQ0EsZUFBT1IsU0FBUytFLEdBQVQsQ0FBYSxDQUNsQjlDLFlBQVlnRSxTQUFaLEVBQXVCekYsTUFBdkIsRUFBK0JtRixhQUEvQixVQUFvRHpELE1BQXBELEVBQTREb0UsT0FBNUQsQ0FEa0IsRUFFbEJyRSxZQUFZaUUsVUFBWixFQUF3QjFGLE1BQXhCLEVBQWdDcUYsY0FBaEMsVUFBc0QzRCxNQUF0RCxFQUE4RHNFLFFBQTlELENBRmtCLENBQWIsQ0FBUDtBQUlELE9BakJNLEVBa0JONUUsSUFsQk0sQ0FrQkQsVUFBQzZFLEdBQUQ7QUFBQSxlQUFTLE9BQUt0QyxZQUFMLENBQWtCUixJQUFsQixFQUF3QlAsRUFBeEIsRUFBNEIsSUFBNUIsRUFBa0M3QyxpQkFBbEMsRUFBcURxQixJQUFyRCxDQUEwRDtBQUFBLGlCQUFNNkUsR0FBTjtBQUFBLFNBQTFELENBQVQ7QUFBQSxPQWxCQyxDQUFQO0FBbUJEOzs7MkJBRU05QyxJLEVBQU1QLEUsRUFBSTdDLGlCLEVBQW1CcUYsTyxFQUFTO0FBQUE7O0FBQzNDLFVBQU1ILG9CQUFvQjlCLEtBQUtKLE9BQUwsQ0FBYWhELGlCQUFiLEVBQWdDRCxZQUExRDtBQUNBLFVBQU1HLFdBQVdnRixrQkFBa0IvRSxNQUFsQixDQUF5QkgsaUJBQXpCLENBQWpCO0FBQ0EsVUFBTW9GLGdCQUFnQixLQUFLekIsU0FBTCxDQUFlUCxLQUFLSSxLQUFwQixFQUEyQlgsRUFBM0IsRUFBK0I3QyxpQkFBL0IsQ0FBdEI7QUFDQSxVQUFNc0YsaUJBQWlCLEtBQUszQixTQUFMLENBQWV6RCxTQUFTSyxLQUFULENBQWU2QyxJQUE5QixFQUFvQ2lDLE9BQXBDLEVBQTZDbkYsU0FBU0ssS0FBVCxDQUFlZ0YsS0FBNUQsQ0FBdkI7QUFDQSxhQUFPOUYsU0FBUytFLEdBQVQsQ0FBYSxDQUNsQixLQUFLVixJQUFMLENBQVVzQixhQUFWLENBRGtCLEVBRWxCLEtBQUt0QixJQUFMLENBQVV3QixjQUFWLENBRmtCLENBQWIsRUFJTmpFLElBSk0sQ0FJRCxpQkFBeUM7QUFBQTs7QUFBQTtBQUFBLFlBQXZDbUUsZUFBdUM7QUFBQSxZQUF0QkMsZ0JBQXNCOztBQUM3QyxZQUFNQyxZQUFZbEUsS0FBS3lDLEtBQUwsQ0FBV3VCLGVBQVgsS0FBK0IsRUFBakQ7QUFDQSxZQUFNRyxhQUFhbkUsS0FBS3lDLEtBQUwsQ0FBV3dCLGdCQUFYLEtBQWdDLEVBQW5EO0FBQ0EsWUFBTXhGLG1EQUNIQyxTQUFTSyxLQUFULENBQWVELEtBRFosRUFDb0IrRSxPQURwQiw2QkFFSG5GLFNBQVNHLElBQVQsQ0FBY0MsS0FGWCxFQUVtQnVDLEVBRm5CLFlBQU47QUFJQSxZQUFNa0QsVUFBVUwsVUFBVU0sU0FBVixDQUFvQmxHLGtCQUFrQm9GLGlCQUFsQixFQUFxQ2xGLGlCQUFyQyxFQUF3REMsTUFBeEQsQ0FBcEIsQ0FBaEI7QUFDQSxZQUFNZ0csV0FBV04sV0FBV0ssU0FBWCxDQUFxQmxHLGtCQUFrQm9GLGlCQUFsQixFQUFxQ2xGLGlCQUFyQyxFQUF3REMsTUFBeEQsQ0FBckIsQ0FBakI7QUFDQSxlQUFPUixTQUFTK0UsR0FBVCxDQUFhLENBQ2xCMUMsWUFBWTRELFNBQVosRUFBdUJLLE9BQXZCLEVBQWdDWCxhQUFoQyxTQURrQixFQUVsQnRELFlBQVk2RCxVQUFaLEVBQXdCTSxRQUF4QixFQUFrQ1gsY0FBbEMsU0FGa0IsQ0FBYixDQUFQO0FBSUQsT0FqQk0sRUFrQk5qRSxJQWxCTSxDQWtCRCxVQUFDNkUsR0FBRDtBQUFBLGVBQVMsT0FBS3RDLFlBQUwsQ0FBa0JSLElBQWxCLEVBQXdCUCxFQUF4QixFQUE0QixJQUE1QixFQUFrQzdDLGlCQUFsQyxFQUFxRHFCLElBQXJELENBQTBEO0FBQUEsaUJBQU02RSxHQUFOO0FBQUEsU0FBMUQsQ0FBVDtBQUFBLE9BbEJDLENBQVA7QUFtQkQ7Ozs4QkFFU0MsUSxFQUFVdEQsRSxFQUFJOUMsWSxFQUFjO0FBQ3BDLGFBQVVvRyxRQUFWLFVBQXNCcEcsZ0JBQWdCLE9BQXRDLFVBQWlEOEMsRUFBakQ7QUFDRCIsImZpbGUiOiJzdG9yYWdlL2tleVZhbHVlU3RvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBTdG9yYWdlIH0gZnJvbSAnLi9zdG9yYWdlJztcbmltcG9ydCB7IGNyZWF0ZUZpbHRlciB9IGZyb20gJy4vY3JlYXRlRmlsdGVyJztcbmltcG9ydCB7ICRzZWxmIH0gZnJvbSAnLi4vbW9kZWwnO1xuXG5mdW5jdGlvbiBzYW5lTnVtYmVyKGkpIHtcbiAgcmV0dXJuICgodHlwZW9mIGkgPT09ICdudW1iZXInKSAmJiAoIWlzTmFOKGkpKSAmJiAoaSAhPT0gSW5maW5pdHkpICYgKGkgIT09IC1JbmZpbml0eSkpO1xufVxuXG5mdW5jdGlvbiBmaW5kRW50cnlDYWxsYmFjayhyZWxhdGlvbnNoaXAsIHJlbGF0aW9uc2hpcFRpdGxlLCB0YXJnZXQpIHtcbiAgY29uc3Qgc2lkZUluZm8gPSByZWxhdGlvbnNoaXAuJHNpZGVzW3JlbGF0aW9uc2hpcFRpdGxlXTtcbiAgcmV0dXJuICh2YWx1ZSkgPT4ge1xuICAgIGlmIChcbiAgICAgICh2YWx1ZVtzaWRlSW5mby5zZWxmLmZpZWxkXSA9PT0gdGFyZ2V0W3NpZGVJbmZvLnNlbGYuZmllbGRdKSAmJlxuICAgICAgKHZhbHVlW3NpZGVJbmZvLm90aGVyLmZpZWxkXSA9PT0gdGFyZ2V0W3NpZGVJbmZvLm90aGVyLmZpZWxkXSlcbiAgICApIHtcbiAgICAgIGlmIChyZWxhdGlvbnNoaXAuJHJlc3RyaWN0KSB7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhyZWxhdGlvbnNoaXAuJHJlc3RyaWN0KS5yZWR1Y2UoXG4gICAgICAgICAgKHByaW9yLCByZXN0cmljdGlvbikgPT4gcHJpb3IgJiYgdmFsdWVbcmVzdHJpY3Rpb25dID09PSByZWxhdGlvbnNoaXAuJHJlc3RyaWN0W3Jlc3RyaWN0aW9uXS52YWx1ZSxcbiAgICAgICAgICB0cnVlXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gbWF5YmVQdXNoKGFycmF5LCB2YWwsIGtleXN0cmluZywgc3RvcmUsIGlkeCkge1xuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gIC50aGVuKCgpID0+IHtcbiAgICBpZiAoaWR4IDwgMCkge1xuICAgICAgYXJyYXkucHVzaCh2YWwpO1xuICAgICAgcmV0dXJuIHN0b3JlLl9zZXQoa2V5c3RyaW5nLCBKU09OLnN0cmluZ2lmeShhcnJheSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0pO1xufVxuXG5cbmZ1bmN0aW9uIG1heWJlVXBkYXRlKGFycmF5LCB2YWwsIGtleXN0cmluZywgc3RvcmUsIGV4dHJhcywgaWR4KSB7XG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgLnRoZW4oKCkgPT4ge1xuICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgY29uc3QgbW9kaWZpZWRSZWxhdGlvbnNoaXAgPSBPYmplY3QuYXNzaWduKFxuICAgICAgICB7fSxcbiAgICAgICAgYXJyYXlbaWR4XSxcbiAgICAgICAgZXh0cmFzXG4gICAgICApO1xuICAgICAgYXJyYXlbaWR4XSA9IG1vZGlmaWVkUmVsYXRpb25zaGlwOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICByZXR1cm4gc3RvcmUuX3NldChrZXlzdHJpbmcsIEpTT04uc3RyaW5naWZ5KGFycmF5KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG1heWJlRGVsZXRlKGFycmF5LCBpZHgsIGtleXN0cmluZywgc3RvcmUpIHtcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAudGhlbigoKSA9PiB7XG4gICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICBhcnJheS5zcGxpY2UoaWR4LCAxKTtcbiAgICAgIHJldHVybiBzdG9yZS5fc2V0KGtleXN0cmluZywgSlNPTi5zdHJpbmdpZnkoYXJyYXkpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9KTtcbn1cblxuXG5leHBvcnQgY2xhc3MgS2V5VmFsdWVTdG9yZSBleHRlbmRzIFN0b3JhZ2Uge1xuICAkJG1heEtleSh0KSB7XG4gICAgcmV0dXJuIHRoaXMuX2tleXModClcbiAgICAudGhlbigoa2V5QXJyYXkpID0+IHtcbiAgICAgIGlmIChrZXlBcnJheS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ga2V5QXJyYXkubWFwKChrKSA9PiBrLnNwbGl0KCc6JylbMl0pXG4gICAgICAgIC5tYXAoKGspID0+IHBhcnNlSW50KGssIDEwKSlcbiAgICAgICAgLmZpbHRlcigoaSkgPT4gc2FuZU51bWJlcihpKSlcbiAgICAgICAgLnJlZHVjZSgobWF4LCBjdXJyZW50KSA9PiAoY3VycmVudCA+IG1heCkgPyBjdXJyZW50IDogbWF4LCAwKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHdyaXRlKHQsIHYpIHtcbiAgICBjb25zdCBpZCA9IHZbdC4kaWRdO1xuICAgIGNvbnN0IHVwZGF0ZU9iamVjdCA9IHt9O1xuICAgIE9iamVjdC5rZXlzKHQuJGZpZWxkcykuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICBpZiAodltmaWVsZE5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gY29weSBmcm9tIHYgdG8gdGhlIGJlc3Qgb2Ygb3VyIGFiaWxpdHlcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0LiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnYXJyYXknKSB8fFxuICAgICAgICAgICh0LiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnaGFzTWFueScpXG4gICAgICAgICkge1xuICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gdltmaWVsZE5hbWVdLmNvbmNhdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSBPYmplY3QuYXNzaWduKHt9LCB2W2ZpZWxkTmFtZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gdltmaWVsZE5hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKChpZCA9PT0gdW5kZWZpbmVkKSB8fCAoaWQgPT09IG51bGwpKSB7XG4gICAgICBpZiAodGhpcy50ZXJtaW5hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy4kJG1heEtleSh0LiRuYW1lKVxuICAgICAgICAudGhlbigobikgPT4ge1xuICAgICAgICAgIGNvbnN0IHRvU2F2ZSA9IE9iamVjdC5hc3NpZ24oe30sIHVwZGF0ZU9iamVjdCwgeyBbdC4kaWRdOiBuICsgMSB9KTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fc2V0KHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIG4gKyAxKSwgSlNPTi5zdHJpbmdpZnkodG9TYXZlKSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ub3RpZnlVcGRhdGUodCwgdG9TYXZlW3QuJGlkXSwgdG9TYXZlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC50aGVuKCgpID0+IHRvU2F2ZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIG5ldyBjb250ZW50IGluIGEgbm9uLXRlcm1pbmFsIHN0b3JlJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpKVxuICAgICAgLnRoZW4oKG9yaWdWYWx1ZSkgPT4ge1xuICAgICAgICBjb25zdCB1cGRhdGUgPSBPYmplY3QuYXNzaWduKHt9LCBKU09OLnBhcnNlKG9yaWdWYWx1ZSksIHVwZGF0ZU9iamVjdCk7XG4gICAgICAgIHJldHVybiB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpLCBKU09OLnN0cmluZ2lmeSh1cGRhdGUpKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubm90aWZ5VXBkYXRlKHQsIGlkLCB1cGRhdGUpO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB1cGRhdGUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmVhZE9uZSh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpKVxuICAgIC50aGVuKChkKSA9PiBKU09OLnBhcnNlKGQpKTtcbiAgfVxuXG4gIHJlYWRNYW55KHQsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBUeXBlID0gdC4kZmllbGRzW3JlbGF0aW9uc2hpcF0ucmVsYXRpb25zaGlwO1xuICAgIGNvbnN0IHNpZGVJbmZvID0gcmVsYXRpb25zaGlwVHlwZS4kc2lkZXNbcmVsYXRpb25zaGlwXTtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3QgcmVzb2x2ZXMgPSBbdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkLCByZWxhdGlvbnNoaXApKV07XG4gICAgICBpZiAoc2lkZUluZm8uc2VsZi5xdWVyeSAmJiBzaWRlSW5mby5zZWxmLnF1ZXJ5LnJlcXVpcmVMb2FkKSB7XG4gICAgICAgIHJlc29sdmVzLnB1c2godGhpcy5yZWFkT25lKHQsIGlkKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNvbHZlcy5wdXNoKEJsdWViaXJkLnJlc29sdmUoeyBpZCB9KSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKHJlc29sdmVzKTtcbiAgICB9KVxuICAgIC50aGVuKChbYXJyYXlTdHJpbmcsIGNvbnRleHRdKSA9PiB7XG4gICAgICBsZXQgcmVsYXRpb25zaGlwQXJyYXkgPSBKU09OLnBhcnNlKGFycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGlmIChzaWRlSW5mby5zZWxmLnF1ZXJ5KSB7XG4gICAgICAgIGNvbnN0IGZpbHRlckJsb2NrID0gU3RvcmFnZS5tYXNzUmVwbGFjZShzaWRlSW5mby5zZWxmLnF1ZXJ5LmxvZ2ljLCBjb250ZXh0KTtcbiAgICAgICAgcmVsYXRpb25zaGlwQXJyYXkgPSByZWxhdGlvbnNoaXBBcnJheS5maWx0ZXIoY3JlYXRlRmlsdGVyKGZpbHRlckJsb2NrKSk7XG4gICAgICB9XG4gICAgICBpZiAocmVsYXRpb25zaGlwVHlwZS4kcmVzdHJpY3QpIHtcbiAgICAgICAgcmV0dXJuIHJlbGF0aW9uc2hpcEFycmF5LmZpbHRlcigodikgPT4ge1xuICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhyZWxhdGlvbnNoaXBUeXBlLiRyZXN0cmljdCkucmVkdWNlKFxuICAgICAgICAgICAgKHByaW9yLCByZXN0cmljdGlvbikgPT4gcHJpb3IgJiYgdltyZXN0cmljdGlvbl0gPT09IHJlbGF0aW9uc2hpcFR5cGUuJHJlc3RyaWN0W3Jlc3RyaWN0aW9uXS52YWx1ZSxcbiAgICAgICAgICAgIHRydWVcbiAgICAgICAgICApO1xuICAgICAgICB9KS5tYXAoKGVudHJ5KSA9PiB7XG4gICAgICAgICAgT2JqZWN0LmtleXMocmVsYXRpb25zaGlwVHlwZS4kcmVzdHJpY3QpLmZvckVhY2goKGspID0+IHtcbiAgICAgICAgICAgIGRlbGV0ZSBlbnRyeVtrXTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBlbnRyeTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcmVsYXRpb25zaGlwQXJyYXk7XG4gICAgICB9XG4gICAgfSkudGhlbigoYXJ5KSA9PiB7XG4gICAgICByZXR1cm4geyBbcmVsYXRpb25zaGlwXTogYXJ5IH07XG4gICAgfSk7XG4gIH1cblxuICBkZWxldGUodCwgaWQpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVsKHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkKSk7XG4gIH1cblxuICB3aXBlKHQsIGlkLCBmaWVsZCkge1xuICAgIGlmIChmaWVsZCA9PT0gJHNlbGYpIHtcbiAgICAgIHJldHVybiB0aGlzLl9kZWwodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX2RlbCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCwgZmllbGQpKTtcbiAgICB9XG4gIH1cblxuICB3cml0ZUhhc01hbnkodHlwZSwgaWQsIGZpZWxkLCB2YWx1ZSkge1xuICAgIGxldCB0b1NhdmUgPSB2YWx1ZTtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBCbG9jayA9IHR5cGUuJGZpZWxkc1tmaWVsZF0ucmVsYXRpb25zaGlwO1xuICAgIGlmIChyZWxhdGlvbnNoaXBCbG9jay4kcmVzdHJpY3QpIHtcbiAgICAgIGNvbnN0IHJlc3RyaWN0QmxvY2sgPSB7fTtcbiAgICAgIE9iamVjdC5rZXlzKHJlbGF0aW9uc2hpcEJsb2NrLiRyZXN0cmljdCkuZm9yRWFjaCgoaykgPT4ge1xuICAgICAgICByZXN0cmljdEJsb2NrW2tdID0gcmVsYXRpb25zaGlwQmxvY2suJHJlc3RyaWN0W2tdLnZhbHVlO1xuICAgICAgfSk7XG4gICAgICB0b1NhdmUgPSB0b1NhdmUubWFwKCh2KSA9PiBPYmplY3QuYXNzaWduKHt9LCB2LCByZXN0cmljdEJsb2NrKSk7XG4gICAgfVxuICAgIC8vIGNvbnN0IHNpZGVJbmZvID0gcmVsYXRpb25zaGlwQmxvY2suJHNpZGVzW2ZpZWxkXTtcbiAgICBjb25zdCB0aGlzS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcodHlwZS4kbmFtZSwgaWQsIGZpZWxkKTtcbiAgICByZXR1cm4gdGhpcy5fc2V0KHRoaXNLZXlTdHJpbmcsIEpTT04uc3RyaW5naWZ5KHRvU2F2ZSkpO1xuICB9XG5cbiAgYWRkKHR5cGUsIGlkLCByZWxhdGlvbnNoaXBUaXRsZSwgY2hpbGRJZCwgZXh0cmFzID0ge30pIHtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBCbG9jayA9IHR5cGUuJGZpZWxkc1tyZWxhdGlvbnNoaXBUaXRsZV0ucmVsYXRpb25zaGlwO1xuICAgIGNvbnN0IHNpZGVJbmZvID0gcmVsYXRpb25zaGlwQmxvY2suJHNpZGVzW3JlbGF0aW9uc2hpcFRpdGxlXTtcbiAgICBjb25zdCB0aGlzS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcodHlwZS4kbmFtZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlKTtcbiAgICBjb25zdCBvdGhlcktleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHNpZGVJbmZvLm90aGVyLnR5cGUsIGNoaWxkSWQsIHNpZGVJbmZvLm90aGVyLnRpdGxlKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgIHRoaXMuX2dldCh0aGlzS2V5U3RyaW5nKSxcbiAgICAgIHRoaXMuX2dldChvdGhlcktleVN0cmluZyksXG4gICAgXSlcbiAgICAudGhlbigoW3RoaXNBcnJheVN0cmluZywgb3RoZXJBcnJheVN0cmluZ10pID0+IHtcbiAgICAgIGNvbnN0IHRoaXNBcnJheSA9IEpTT04ucGFyc2UodGhpc0FycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IG90aGVyQXJyYXkgPSBKU09OLnBhcnNlKG90aGVyQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3QgbmV3RmllbGQgPSB7XG4gICAgICAgIFtzaWRlSW5mby5vdGhlci5maWVsZF06IGNoaWxkSWQsXG4gICAgICAgIFtzaWRlSW5mby5zZWxmLmZpZWxkXTogaWQsXG4gICAgICB9O1xuICAgICAgaWYgKHJlbGF0aW9uc2hpcEJsb2NrLiRyZXN0cmljdCkge1xuICAgICAgICBPYmplY3Qua2V5cyhyZWxhdGlvbnNoaXBCbG9jay4kcmVzdHJpY3QpLmZvckVhY2goKHJlc3RyaWN0aW9uKSA9PiB7XG4gICAgICAgICAgbmV3RmllbGRbcmVzdHJpY3Rpb25dID0gcmVsYXRpb25zaGlwQmxvY2suJHJlc3RyaWN0W3Jlc3RyaWN0aW9uXS52YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBpZiAocmVsYXRpb25zaGlwQmxvY2suJGV4dHJhcykge1xuICAgICAgICBPYmplY3Qua2V5cyhyZWxhdGlvbnNoaXBCbG9jay4kZXh0cmFzKS5mb3JFYWNoKChleHRyYSkgPT4ge1xuICAgICAgICAgIG5ld0ZpZWxkW2V4dHJhXSA9IGV4dHJhc1tleHRyYV07XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgY29uc3QgdGhpc0lkeCA9IHRoaXNBcnJheS5maW5kSW5kZXgoZmluZEVudHJ5Q2FsbGJhY2socmVsYXRpb25zaGlwQmxvY2ssIHJlbGF0aW9uc2hpcFRpdGxlLCBuZXdGaWVsZCkpO1xuICAgICAgY29uc3Qgb3RoZXJJZHggPSBvdGhlckFycmF5LmZpbmRJbmRleChmaW5kRW50cnlDYWxsYmFjayhyZWxhdGlvbnNoaXBCbG9jaywgcmVsYXRpb25zaGlwVGl0bGUsIG5ld0ZpZWxkKSk7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgbWF5YmVQdXNoKHRoaXNBcnJheSwgbmV3RmllbGQsIHRoaXNLZXlTdHJpbmcsIHRoaXMsIHRoaXNJZHgpLFxuICAgICAgICBtYXliZVB1c2gob3RoZXJBcnJheSwgbmV3RmllbGQsIG90aGVyS2V5U3RyaW5nLCB0aGlzLCBvdGhlcklkeCksXG4gICAgICBdKVxuICAgICAgLnRoZW4oKCkgPT4gdGhpcy5ub3RpZnlVcGRhdGUodHlwZSwgaWQsIG51bGwsIHJlbGF0aW9uc2hpcFRpdGxlKSlcbiAgICAgIC50aGVuKCgpID0+IHRoaXNBcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBtb2RpZnlSZWxhdGlvbnNoaXAodHlwZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlLCBjaGlsZElkLCBleHRyYXMpIHtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBCbG9jayA9IHR5cGUuJGZpZWxkc1tyZWxhdGlvbnNoaXBUaXRsZV0ucmVsYXRpb25zaGlwO1xuICAgIGNvbnN0IHNpZGVJbmZvID0gcmVsYXRpb25zaGlwQmxvY2suJHNpZGVzW3JlbGF0aW9uc2hpcFRpdGxlXTtcbiAgICBjb25zdCB0aGlzS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcodHlwZS4kbmFtZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlKTtcbiAgICBjb25zdCBvdGhlcktleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHNpZGVJbmZvLm90aGVyLnR5cGUsIGNoaWxkSWQsIHNpZGVJbmZvLm90aGVyLnRpdGxlKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgIHRoaXMuX2dldCh0aGlzS2V5U3RyaW5nKSxcbiAgICAgIHRoaXMuX2dldChvdGhlcktleVN0cmluZyksXG4gICAgXSlcbiAgICAudGhlbigoW3RoaXNBcnJheVN0cmluZywgb3RoZXJBcnJheVN0cmluZ10pID0+IHtcbiAgICAgIGNvbnN0IHRoaXNBcnJheSA9IEpTT04ucGFyc2UodGhpc0FycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IG90aGVyQXJyYXkgPSBKU09OLnBhcnNlKG90aGVyQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3QgdGFyZ2V0ID0ge1xuICAgICAgICBbc2lkZUluZm8ub3RoZXIuZmllbGRdOiBjaGlsZElkLFxuICAgICAgICBbc2lkZUluZm8uc2VsZi5maWVsZF06IGlkLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IHRoaXNJZHggPSB0aGlzQXJyYXkuZmluZEluZGV4KGZpbmRFbnRyeUNhbGxiYWNrKHJlbGF0aW9uc2hpcEJsb2NrLCByZWxhdGlvbnNoaXBUaXRsZSwgdGFyZ2V0KSk7XG4gICAgICBjb25zdCBvdGhlcklkeCA9IG90aGVyQXJyYXkuZmluZEluZGV4KGZpbmRFbnRyeUNhbGxiYWNrKHJlbGF0aW9uc2hpcEJsb2NrLCByZWxhdGlvbnNoaXBUaXRsZSwgdGFyZ2V0KSk7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgbWF5YmVVcGRhdGUodGhpc0FycmF5LCB0YXJnZXQsIHRoaXNLZXlTdHJpbmcsIHRoaXMsIGV4dHJhcywgdGhpc0lkeCksXG4gICAgICAgIG1heWJlVXBkYXRlKG90aGVyQXJyYXksIHRhcmdldCwgb3RoZXJLZXlTdHJpbmcsIHRoaXMsIGV4dHJhcywgb3RoZXJJZHgpLFxuICAgICAgXSk7XG4gICAgfSlcbiAgICAudGhlbigocmVzKSA9PiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBpZCwgbnVsbCwgcmVsYXRpb25zaGlwVGl0bGUpLnRoZW4oKCkgPT4gcmVzKSk7XG4gIH1cblxuICByZW1vdmUodHlwZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlLCBjaGlsZElkKSB7XG4gICAgY29uc3QgcmVsYXRpb25zaGlwQmxvY2sgPSB0eXBlLiRmaWVsZHNbcmVsYXRpb25zaGlwVGl0bGVdLnJlbGF0aW9uc2hpcDtcbiAgICBjb25zdCBzaWRlSW5mbyA9IHJlbGF0aW9uc2hpcEJsb2NrLiRzaWRlc1tyZWxhdGlvbnNoaXBUaXRsZV07XG4gICAgY29uc3QgdGhpc0tleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHR5cGUuJG5hbWUsIGlkLCByZWxhdGlvbnNoaXBUaXRsZSk7XG4gICAgY29uc3Qgb3RoZXJLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyhzaWRlSW5mby5vdGhlci50eXBlLCBjaGlsZElkLCBzaWRlSW5mby5vdGhlci50aXRsZSk7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICB0aGlzLl9nZXQodGhpc0tleVN0cmluZyksXG4gICAgICB0aGlzLl9nZXQob3RoZXJLZXlTdHJpbmcpLFxuICAgIF0pXG4gICAgLnRoZW4oKFt0aGlzQXJyYXlTdHJpbmcsIG90aGVyQXJyYXlTdHJpbmddKSA9PiB7XG4gICAgICBjb25zdCB0aGlzQXJyYXkgPSBKU09OLnBhcnNlKHRoaXNBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCBvdGhlckFycmF5ID0gSlNPTi5wYXJzZShvdGhlckFycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IHRhcmdldCA9IHtcbiAgICAgICAgW3NpZGVJbmZvLm90aGVyLmZpZWxkXTogY2hpbGRJZCxcbiAgICAgICAgW3NpZGVJbmZvLnNlbGYuZmllbGRdOiBpZCxcbiAgICAgIH07XG4gICAgICBjb25zdCB0aGlzSWR4ID0gdGhpc0FycmF5LmZpbmRJbmRleChmaW5kRW50cnlDYWxsYmFjayhyZWxhdGlvbnNoaXBCbG9jaywgcmVsYXRpb25zaGlwVGl0bGUsIHRhcmdldCkpO1xuICAgICAgY29uc3Qgb3RoZXJJZHggPSBvdGhlckFycmF5LmZpbmRJbmRleChmaW5kRW50cnlDYWxsYmFjayhyZWxhdGlvbnNoaXBCbG9jaywgcmVsYXRpb25zaGlwVGl0bGUsIHRhcmdldCkpO1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIG1heWJlRGVsZXRlKHRoaXNBcnJheSwgdGhpc0lkeCwgdGhpc0tleVN0cmluZywgdGhpcyksXG4gICAgICAgIG1heWJlRGVsZXRlKG90aGVyQXJyYXksIG90aGVySWR4LCBvdGhlcktleVN0cmluZywgdGhpcyksXG4gICAgICBdKTtcbiAgICB9KVxuICAgIC50aGVuKChyZXMpID0+IHRoaXMubm90aWZ5VXBkYXRlKHR5cGUsIGlkLCBudWxsLCByZWxhdGlvbnNoaXBUaXRsZSkudGhlbigoKSA9PiByZXMpKTtcbiAgfVxuXG4gIGtleVN0cmluZyh0eXBlTmFtZSwgaWQsIHJlbGF0aW9uc2hpcCkge1xuICAgIHJldHVybiBgJHt0eXBlTmFtZX06JHtyZWxhdGlvbnNoaXAgfHwgJ3N0b3JlJ306JHtpZH1gO1xuICB9XG59XG4iXX0=
