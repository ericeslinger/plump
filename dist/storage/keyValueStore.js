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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uva2V5VmFsdWVTdG9yZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsInNhbmVOdW1iZXIiLCJpIiwiaXNOYU4iLCJJbmZpbml0eSIsImZpbmRFbnRyeUNhbGxiYWNrIiwicmVsYXRpb25zaGlwIiwicmVsYXRpb25zaGlwVGl0bGUiLCJ0YXJnZXQiLCJzaWRlSW5mbyIsIiRzaWRlcyIsInZhbHVlIiwic2VsZiIsImZpZWxkIiwib3RoZXIiLCIkcmVzdHJpY3QiLCJPYmplY3QiLCJrZXlzIiwicmVkdWNlIiwicHJpb3IiLCJyZXN0cmljdGlvbiIsIm1heWJlUHVzaCIsImFycmF5IiwidmFsIiwia2V5c3RyaW5nIiwic3RvcmUiLCJpZHgiLCJyZXNvbHZlIiwidGhlbiIsInB1c2giLCJfc2V0IiwiSlNPTiIsInN0cmluZ2lmeSIsIm1heWJlVXBkYXRlIiwiZXh0cmFzIiwibW9kaWZpZWRSZWxhdGlvbnNoaXAiLCJhc3NpZ24iLCJtYXliZURlbGV0ZSIsInNwbGljZSIsIktleVZhbHVlU3RvcmUiLCJ0IiwiX2tleXMiLCJrZXlBcnJheSIsImxlbmd0aCIsIm1hcCIsImsiLCJzcGxpdCIsInBhcnNlSW50IiwiZmlsdGVyIiwibWF4IiwiY3VycmVudCIsInYiLCJpZCIsIiRzY2hlbWEiLCIkaWQiLCJ1cGRhdGVPYmplY3QiLCJyZWwiLCJyZWxhdGlvbnNoaXBzIiwidW5kZWZpbmVkIiwiY29uY2F0IiwiYXR0ciIsImF0dHJpYnV0ZXMiLCJ0eXBlIiwidGVybWluYWwiLCIkJG1heEtleSIsIiRuYW1lIiwibiIsInRvU2F2ZSIsImtleVN0cmluZyIsIm5vdGlmeVVwZGF0ZSIsIkVycm9yIiwiX2dldCIsIm9yaWdWYWx1ZSIsInVwZGF0ZSIsInBhcnNlIiwiZCIsInJlbGF0aW9uc2hpcFR5cGUiLCJyZXNvbHZlcyIsInF1ZXJ5IiwicmVxdWlyZUxvYWQiLCJyZWFkT25lIiwiYWxsIiwiYXJyYXlTdHJpbmciLCJjb250ZXh0IiwicmVsYXRpb25zaGlwQXJyYXkiLCJmaWx0ZXJCbG9jayIsIm1hc3NSZXBsYWNlIiwibG9naWMiLCJlbnRyeSIsImZvckVhY2giLCJhcnkiLCJfZGVsIiwicmVsYXRpb25zaGlwQmxvY2siLCJyZXN0cmljdEJsb2NrIiwidGhpc0tleVN0cmluZyIsImNoaWxkSWQiLCJvdGhlcktleVN0cmluZyIsInRpdGxlIiwidGhpc0FycmF5U3RyaW5nIiwib3RoZXJBcnJheVN0cmluZyIsInRoaXNBcnJheSIsIm90aGVyQXJyYXkiLCJuZXdGaWVsZCIsIiRleHRyYXMiLCJleHRyYSIsInRoaXNJZHgiLCJmaW5kSW5kZXgiLCJvdGhlcklkeCIsInJlcyIsInR5cGVOYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztJQUFZQSxROztBQUNaOztBQUNBOztBQUNBOzs7Ozs7Ozs7Ozs7QUFFQSxTQUFTQyxVQUFULENBQW9CQyxDQUFwQixFQUF1QjtBQUNyQixTQUFTLE9BQU9BLENBQVAsS0FBYSxRQUFkLElBQTRCLENBQUNDLE1BQU1ELENBQU4sQ0FBN0IsSUFBMkNBLE1BQU1FLFFBQVAsR0FBb0JGLE1BQU0sQ0FBQ0UsUUFBN0U7QUFDRDs7QUFFRCxTQUFTQyxpQkFBVCxDQUEyQkMsWUFBM0IsRUFBeUNDLGlCQUF6QyxFQUE0REMsTUFBNUQsRUFBb0U7QUFDbEUsTUFBTUMsV0FBV0gsYUFBYUksTUFBYixDQUFvQkgsaUJBQXBCLENBQWpCO0FBQ0EsU0FBTyxVQUFDSSxLQUFELEVBQVc7QUFDaEIsUUFDR0EsTUFBTUYsU0FBU0csSUFBVCxDQUFjQyxLQUFwQixNQUErQkwsT0FBT0MsU0FBU0csSUFBVCxDQUFjQyxLQUFyQixDQUFoQyxJQUNDRixNQUFNRixTQUFTSyxLQUFULENBQWVELEtBQXJCLE1BQWdDTCxPQUFPQyxTQUFTSyxLQUFULENBQWVELEtBQXRCLENBRm5DLEVBR0U7QUFDQSxVQUFJUCxhQUFhUyxTQUFqQixFQUE0QjtBQUMxQixlQUFPQyxPQUFPQyxJQUFQLENBQVlYLGFBQWFTLFNBQXpCLEVBQW9DRyxNQUFwQyxDQUNMLFVBQUNDLEtBQUQsRUFBUUMsV0FBUjtBQUFBLGlCQUF3QkQsU0FBU1IsTUFBTVMsV0FBTixNQUF1QmQsYUFBYVMsU0FBYixDQUF1QkssV0FBdkIsRUFBb0NULEtBQTVGO0FBQUEsU0FESyxFQUVMLElBRkssQ0FBUDtBQUlELE9BTEQsTUFLTztBQUNMLGVBQU8sSUFBUDtBQUNEO0FBQ0YsS0FaRCxNQVlPO0FBQ0wsYUFBTyxLQUFQO0FBQ0Q7QUFDRixHQWhCRDtBQWlCRDs7QUFFRCxTQUFTVSxTQUFULENBQW1CQyxLQUFuQixFQUEwQkMsR0FBMUIsRUFBK0JDLFNBQS9CLEVBQTBDQyxLQUExQyxFQUFpREMsR0FBakQsRUFBc0Q7QUFDcEQsU0FBTzFCLFNBQVMyQixPQUFULEdBQ05DLElBRE0sQ0FDRCxZQUFNO0FBQ1YsUUFBSUYsTUFBTSxDQUFWLEVBQWE7QUFDWEosWUFBTU8sSUFBTixDQUFXTixHQUFYO0FBQ0EsYUFBT0UsTUFBTUssSUFBTixDQUFXTixTQUFYLEVBQXNCTyxLQUFLQyxTQUFMLENBQWVWLEtBQWYsQ0FBdEIsQ0FBUDtBQUNELEtBSEQsTUFHTztBQUNMLGFBQU8sSUFBUDtBQUNEO0FBQ0YsR0FSTSxDQUFQO0FBU0Q7O0FBR0QsU0FBU1csV0FBVCxDQUFxQlgsS0FBckIsRUFBNEJDLEdBQTVCLEVBQWlDQyxTQUFqQyxFQUE0Q0MsS0FBNUMsRUFBbURTLE1BQW5ELEVBQTJEUixHQUEzRCxFQUFnRTtBQUM5RCxTQUFPMUIsU0FBUzJCLE9BQVQsR0FDTkMsSUFETSxDQUNELFlBQU07QUFDVixRQUFJRixPQUFPLENBQVgsRUFBYztBQUNaLFVBQU1TLHVCQUF1Qm5CLE9BQU9vQixNQUFQLENBQzNCLEVBRDJCLEVBRTNCZCxNQUFNSSxHQUFOLENBRjJCLEVBRzNCUSxNQUgyQixDQUE3QjtBQUtBWixZQUFNSSxHQUFOLElBQWFTLG9CQUFiLENBTlksQ0FNdUI7QUFDbkMsYUFBT1YsTUFBTUssSUFBTixDQUFXTixTQUFYLEVBQXNCTyxLQUFLQyxTQUFMLENBQWVWLEtBQWYsQ0FBdEIsQ0FBUDtBQUNELEtBUkQsTUFRTztBQUNMLGFBQU8sSUFBUDtBQUNEO0FBQ0YsR0FiTSxDQUFQO0FBY0Q7O0FBRUQsU0FBU2UsV0FBVCxDQUFxQmYsS0FBckIsRUFBNEJJLEdBQTVCLEVBQWlDRixTQUFqQyxFQUE0Q0MsS0FBNUMsRUFBbUQ7QUFDakQsU0FBT3pCLFNBQVMyQixPQUFULEdBQ05DLElBRE0sQ0FDRCxZQUFNO0FBQ1YsUUFBSUYsT0FBTyxDQUFYLEVBQWM7QUFDWkosWUFBTWdCLE1BQU4sQ0FBYVosR0FBYixFQUFrQixDQUFsQjtBQUNBLGFBQU9ELE1BQU1LLElBQU4sQ0FBV04sU0FBWCxFQUFzQk8sS0FBS0MsU0FBTCxDQUFlVixLQUFmLENBQXRCLENBQVA7QUFDRCxLQUhELE1BR087QUFDTCxhQUFPLElBQVA7QUFDRDtBQUNGLEdBUk0sQ0FBUDtBQVNEOztJQUdZaUIsYSxXQUFBQSxhOzs7Ozs7Ozs7Ozs2QkFDRkMsQyxFQUFHO0FBQ1YsYUFBTyxLQUFLQyxLQUFMLENBQVdELENBQVgsRUFDTlosSUFETSxDQUNELFVBQUNjLFFBQUQsRUFBYztBQUNsQixZQUFJQSxTQUFTQyxNQUFULEtBQW9CLENBQXhCLEVBQTJCO0FBQ3pCLGlCQUFPLENBQVA7QUFDRCxTQUZELE1BRU87QUFDTCxpQkFBT0QsU0FBU0UsR0FBVCxDQUFhLFVBQUNDLENBQUQ7QUFBQSxtQkFBT0EsRUFBRUMsS0FBRixDQUFRLEdBQVIsRUFBYSxDQUFiLENBQVA7QUFBQSxXQUFiLEVBQ05GLEdBRE0sQ0FDRixVQUFDQyxDQUFEO0FBQUEsbUJBQU9FLFNBQVNGLENBQVQsRUFBWSxFQUFaLENBQVA7QUFBQSxXQURFLEVBRU5HLE1BRk0sQ0FFQyxVQUFDOUMsQ0FBRDtBQUFBLG1CQUFPRCxXQUFXQyxDQUFYLENBQVA7QUFBQSxXQUZELEVBR05nQixNQUhNLENBR0MsVUFBQytCLEdBQUQsRUFBTUMsT0FBTjtBQUFBLG1CQUFtQkEsVUFBVUQsR0FBWCxHQUFrQkMsT0FBbEIsR0FBNEJELEdBQTlDO0FBQUEsV0FIRCxFQUdvRCxDQUhwRCxDQUFQO0FBSUQ7QUFDRixPQVZNLENBQVA7QUFXRDs7OzBCQUVLVCxDLEVBQUdXLEMsRUFBRztBQUFBOztBQUNWLFVBQU1DLEtBQUtELEVBQUVYLEVBQUVhLE9BQUYsQ0FBVUMsR0FBWixDQUFYO0FBQ0EsVUFBTUMsZUFBZSxFQUFyQjtBQUNBLFdBQUssSUFBTUMsR0FBWCxJQUFrQmhCLEVBQUVhLE9BQUYsQ0FBVUksYUFBNUIsRUFBMkM7QUFDekMsWUFBSU4sRUFBRUssR0FBRixNQUFXRSxTQUFmLEVBQTBCO0FBQ3hCSCx1QkFBYUMsR0FBYixJQUFvQkwsRUFBRUssR0FBRixFQUFPRyxNQUFQLEVBQXBCO0FBQ0Q7QUFDRjtBQUNELFdBQUssSUFBTUMsSUFBWCxJQUFtQnBCLEVBQUVhLE9BQUYsQ0FBVVEsVUFBN0IsRUFBeUM7QUFDdkMsWUFBSXJCLEVBQUVhLE9BQUYsQ0FBVVEsVUFBVixDQUFxQkQsSUFBckIsRUFBMkJFLElBQTNCLEtBQW9DLFFBQXhDLEVBQWtEO0FBQ2hEUCx1QkFBYUssSUFBYixJQUFxQjVDLE9BQU9vQixNQUFQLENBQWMsRUFBZCxFQUFrQmUsRUFBRVMsSUFBRixDQUFsQixDQUFyQjtBQUNELFNBRkQsTUFFTztBQUNMTCx1QkFBYUssSUFBYixJQUFxQlQsRUFBRVMsSUFBRixDQUFyQjtBQUNEO0FBQ0Y7QUFDRCxVQUFLUixPQUFPTSxTQUFSLElBQXVCTixPQUFPLElBQWxDLEVBQXlDO0FBQ3ZDLFlBQUksS0FBS1csUUFBVCxFQUFtQjtBQUNqQixpQkFBTyxLQUFLQyxRQUFMLENBQWN4QixFQUFFeUIsS0FBaEIsRUFDTnJDLElBRE0sQ0FDRCxVQUFDc0MsQ0FBRCxFQUFPO0FBQ1gsZ0JBQU1DLFNBQVNuRCxPQUFPb0IsTUFBUCxDQUFjLEVBQWQsRUFBa0JtQixZQUFsQixzQkFBbUNmLEVBQUVhLE9BQUYsQ0FBVUMsR0FBN0MsRUFBbURZLElBQUksQ0FBdkQsRUFBZjtBQUNBLG1CQUFPLE9BQUtwQyxJQUFMLENBQVUsT0FBS3NDLFNBQUwsQ0FBZTVCLEVBQUV5QixLQUFqQixFQUF3QkMsSUFBSSxDQUE1QixDQUFWLEVBQTBDbkMsS0FBS0MsU0FBTCxDQUFlbUMsTUFBZixDQUExQyxFQUNOdkMsSUFETSxDQUNELFlBQU07QUFDVixxQkFBTyxPQUFLeUMsWUFBTCxDQUFrQjdCLENBQWxCLEVBQXFCMkIsT0FBTzNCLEVBQUVjLEdBQVQsQ0FBckIsRUFBb0NhLE1BQXBDLENBQVA7QUFDRCxhQUhNLEVBSU52QyxJQUpNLENBSUQ7QUFBQSxxQkFBTXVDLE1BQU47QUFBQSxhQUpDLENBQVA7QUFLRCxXQVJNLENBQVA7QUFTRCxTQVZELE1BVU87QUFDTCxnQkFBTSxJQUFJRyxLQUFKLENBQVUsbURBQVYsQ0FBTjtBQUNEO0FBQ0YsT0FkRCxNQWNPO0FBQ0wsZUFBTyxLQUFLQyxJQUFMLENBQVUsS0FBS0gsU0FBTCxDQUFlNUIsRUFBRXlCLEtBQWpCLEVBQXdCYixFQUF4QixDQUFWLEVBQ054QixJQURNLENBQ0QsVUFBQzRDLFNBQUQsRUFBZTtBQUNuQixjQUFNQyxTQUFTekQsT0FBT29CLE1BQVAsQ0FBYyxFQUFkLEVBQWtCTCxLQUFLMkMsS0FBTCxDQUFXRixTQUFYLENBQWxCLEVBQXlDakIsWUFBekMsQ0FBZjtBQUNBLGlCQUFPLE9BQUt6QixJQUFMLENBQVUsT0FBS3NDLFNBQUwsQ0FBZTVCLEVBQUV5QixLQUFqQixFQUF3QmIsRUFBeEIsQ0FBVixFQUF1Q3JCLEtBQUtDLFNBQUwsQ0FBZXlDLE1BQWYsQ0FBdkMsRUFDTjdDLElBRE0sQ0FDRCxZQUFNO0FBQ1YsbUJBQU8sT0FBS3lDLFlBQUwsQ0FBa0I3QixDQUFsQixFQUFxQlksRUFBckIsRUFBeUJxQixNQUF6QixDQUFQO0FBQ0QsV0FITSxFQUlON0MsSUFKTSxDQUlEO0FBQUEsbUJBQU02QyxNQUFOO0FBQUEsV0FKQyxDQUFQO0FBS0QsU0FSTSxDQUFQO0FBU0Q7QUFDRjs7OzRCQUVPakMsQyxFQUFHWSxFLEVBQUk7QUFDYixhQUFPLEtBQUttQixJQUFMLENBQVUsS0FBS0gsU0FBTCxDQUFlNUIsRUFBRXlCLEtBQWpCLEVBQXdCYixFQUF4QixDQUFWLEVBQ054QixJQURNLENBQ0QsVUFBQytDLENBQUQ7QUFBQSxlQUFPNUMsS0FBSzJDLEtBQUwsQ0FBV0MsQ0FBWCxDQUFQO0FBQUEsT0FEQyxDQUFQO0FBRUQ7Ozs2QkFFUW5DLEMsRUFBR1ksRSxFQUFJOUMsWSxFQUFjO0FBQUE7O0FBQzVCLFVBQU1zRSxtQkFBbUJwQyxFQUFFYSxPQUFGLENBQVVJLGFBQVYsQ0FBd0JuRCxZQUF4QixFQUFzQ3dELElBQS9EO0FBQ0EsVUFBTXJELFdBQVdtRSxpQkFBaUJsRSxNQUFqQixDQUF3QkosWUFBeEIsQ0FBakI7QUFDQSxhQUFPTixTQUFTMkIsT0FBVCxHQUNOQyxJQURNLENBQ0QsWUFBTTtBQUNWLFlBQU1pRCxXQUFXLENBQUMsT0FBS04sSUFBTCxDQUFVLE9BQUtILFNBQUwsQ0FBZTVCLEVBQUV5QixLQUFqQixFQUF3QmIsRUFBeEIsRUFBNEI5QyxZQUE1QixDQUFWLENBQUQsQ0FBakI7QUFDQSxZQUFJRyxTQUFTRyxJQUFULENBQWNrRSxLQUFkLElBQXVCckUsU0FBU0csSUFBVCxDQUFja0UsS0FBZCxDQUFvQkMsV0FBL0MsRUFBNEQ7QUFDMURGLG1CQUFTaEQsSUFBVCxDQUFjLE9BQUttRCxPQUFMLENBQWF4QyxDQUFiLEVBQWdCWSxFQUFoQixDQUFkO0FBQ0QsU0FGRCxNQUVPO0FBQ0x5QixtQkFBU2hELElBQVQsQ0FBYzdCLFNBQVMyQixPQUFULENBQWlCLEVBQUV5QixNQUFGLEVBQWpCLENBQWQ7QUFDRDtBQUNEO0FBQ0EsZUFBT3BELFNBQVNpRixHQUFULENBQWFKLFFBQWIsQ0FBUDtBQUNELE9BVk0sRUFXTmpELElBWE0sQ0FXRCxnQkFBNEI7QUFBQTtBQUFBLFlBQTFCc0QsV0FBMEI7QUFBQSxZQUFiQyxPQUFhOztBQUNoQyxZQUFJQyxvQkFBb0JyRCxLQUFLMkMsS0FBTCxDQUFXUSxXQUFYLEtBQTJCLEVBQW5EO0FBQ0EsWUFBSXpFLFNBQVNHLElBQVQsQ0FBY2tFLEtBQWxCLEVBQXlCO0FBQ3ZCLGNBQU1PLGNBQWMsaUJBQVFDLFdBQVIsQ0FBb0I3RSxTQUFTRyxJQUFULENBQWNrRSxLQUFkLENBQW9CUyxLQUF4QyxFQUErQ0osT0FBL0MsQ0FBcEI7QUFDQUMsOEJBQW9CQSxrQkFBa0JwQyxNQUFsQixDQUF5QixnQ0FBYXFDLFdBQWIsQ0FBekIsQ0FBcEI7QUFDRDtBQUNELFlBQUlULGlCQUFpQjdELFNBQXJCLEVBQWdDO0FBQzlCLGlCQUFPcUUsa0JBQWtCcEMsTUFBbEIsQ0FBeUIsVUFBQ0csQ0FBRCxFQUFPO0FBQ3JDLG1CQUFPbkMsT0FBT0MsSUFBUCxDQUFZMkQsaUJBQWlCN0QsU0FBN0IsRUFBd0NHLE1BQXhDLENBQ0wsVUFBQ0MsS0FBRCxFQUFRQyxXQUFSO0FBQUEscUJBQXdCRCxTQUFTZ0MsRUFBRS9CLFdBQUYsTUFBbUJ3RCxpQkFBaUI3RCxTQUFqQixDQUEyQkssV0FBM0IsRUFBd0NULEtBQTVGO0FBQUEsYUFESyxFQUVMLElBRkssQ0FBUDtBQUlELFdBTE0sRUFLSmlDLEdBTEksQ0FLQSxVQUFDNEMsS0FBRCxFQUFXO0FBQ2hCeEUsbUJBQU9DLElBQVAsQ0FBWTJELGlCQUFpQjdELFNBQTdCLEVBQXdDMEUsT0FBeEMsQ0FBZ0QsVUFBQzVDLENBQUQsRUFBTztBQUNyRCxxQkFBTzJDLE1BQU0zQyxDQUFOLENBQVAsQ0FEcUQsQ0FDcEM7QUFDbEIsYUFGRDtBQUdBLG1CQUFPMkMsS0FBUDtBQUNELFdBVk0sQ0FBUDtBQVdELFNBWkQsTUFZTztBQUNMLGlCQUFPSixpQkFBUDtBQUNEO0FBQ0YsT0FoQ00sRUFnQ0p4RCxJQWhDSSxDQWdDQyxVQUFDOEQsR0FBRCxFQUFTO0FBQ2YsbUNBQVVwRixZQUFWLEVBQXlCb0YsR0FBekI7QUFDRCxPQWxDTSxDQUFQO0FBbUNEOzs7NEJBRU1sRCxDLEVBQUdZLEUsRUFBSTtBQUNaLGFBQU8sS0FBS3VDLElBQUwsQ0FBVSxLQUFLdkIsU0FBTCxDQUFlNUIsRUFBRXlCLEtBQWpCLEVBQXdCYixFQUF4QixDQUFWLENBQVA7QUFDRDs7O3lCQUVJWixDLEVBQUdZLEUsRUFBSXZDLEssRUFBTztBQUNqQixVQUFJQSxzQkFBSixFQUFxQjtBQUNuQixlQUFPLEtBQUs4RSxJQUFMLENBQVUsS0FBS3ZCLFNBQUwsQ0FBZTVCLEVBQUV5QixLQUFqQixFQUF3QmIsRUFBeEIsQ0FBVixDQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBTyxLQUFLdUMsSUFBTCxDQUFVLEtBQUt2QixTQUFMLENBQWU1QixFQUFFeUIsS0FBakIsRUFBd0JiLEVBQXhCLEVBQTRCdkMsS0FBNUIsQ0FBVixDQUFQO0FBQ0Q7QUFDRjs7O2lDQUVZaUQsSSxFQUFNVixFLEVBQUl2QyxLLEVBQU9GLEssRUFBTztBQUNuQyxVQUFJd0QsU0FBU3hELEtBQWI7QUFDQSxVQUFNaUYsb0JBQW9COUIsS0FBS1QsT0FBTCxDQUFhSSxhQUFiLENBQTJCNUMsS0FBM0IsRUFBa0NpRCxJQUE1RDtBQUNBLFVBQUk4QixrQkFBa0I3RSxTQUF0QixFQUFpQztBQUFBO0FBQy9CLGNBQU04RSxnQkFBZ0IsRUFBdEI7QUFDQTdFLGlCQUFPQyxJQUFQLENBQVkyRSxrQkFBa0I3RSxTQUE5QixFQUF5QzBFLE9BQXpDLENBQWlELFVBQUM1QyxDQUFELEVBQU87QUFDdERnRCwwQkFBY2hELENBQWQsSUFBbUIrQyxrQkFBa0I3RSxTQUFsQixDQUE0QjhCLENBQTVCLEVBQStCbEMsS0FBbEQ7QUFDRCxXQUZEO0FBR0F3RCxtQkFBU0EsT0FBT3ZCLEdBQVAsQ0FBVyxVQUFDTyxDQUFEO0FBQUEsbUJBQU9uQyxPQUFPb0IsTUFBUCxDQUFjLEVBQWQsRUFBa0JlLENBQWxCLEVBQXFCMEMsYUFBckIsQ0FBUDtBQUFBLFdBQVgsQ0FBVDtBQUwrQjtBQU1oQztBQUNEO0FBQ0EsVUFBTUMsZ0JBQWdCLEtBQUsxQixTQUFMLENBQWVOLEtBQUtHLEtBQXBCLEVBQTJCYixFQUEzQixFQUErQnZDLEtBQS9CLENBQXRCO0FBQ0EsYUFBTyxLQUFLaUIsSUFBTCxDQUFVZ0UsYUFBVixFQUF5Qi9ELEtBQUtDLFNBQUwsQ0FBZW1DLE1BQWYsQ0FBekIsQ0FBUDtBQUNEOzs7d0JBRUdMLEksRUFBTVYsRSxFQUFJN0MsaUIsRUFBbUJ3RixPLEVBQXNCO0FBQUE7O0FBQUEsVUFBYjdELE1BQWEsdUVBQUosRUFBSTs7QUFDckQsVUFBTTBELG9CQUFvQjlCLEtBQUtULE9BQUwsQ0FBYUksYUFBYixDQUEyQmxELGlCQUEzQixFQUE4Q3VELElBQXhFO0FBQ0EsVUFBTXJELFdBQVdtRixrQkFBa0JsRixNQUFsQixDQUF5QkgsaUJBQXpCLENBQWpCO0FBQ0EsVUFBTXVGLGdCQUFnQixLQUFLMUIsU0FBTCxDQUFlTixLQUFLRyxLQUFwQixFQUEyQmIsRUFBM0IsRUFBK0I3QyxpQkFBL0IsQ0FBdEI7QUFDQSxVQUFNeUYsaUJBQWlCLEtBQUs1QixTQUFMLENBQWUzRCxTQUFTSyxLQUFULENBQWVnRCxJQUE5QixFQUFvQ2lDLE9BQXBDLEVBQTZDdEYsU0FBU0ssS0FBVCxDQUFlbUYsS0FBNUQsQ0FBdkI7QUFDQSxhQUFPakcsU0FBU2lGLEdBQVQsQ0FBYSxDQUNsQixLQUFLVixJQUFMLENBQVV1QixhQUFWLENBRGtCLEVBRWxCLEtBQUt2QixJQUFMLENBQVV5QixjQUFWLENBRmtCLENBQWIsRUFJTnBFLElBSk0sQ0FJRCxpQkFBeUM7QUFBQTs7QUFBQTtBQUFBLFlBQXZDc0UsZUFBdUM7QUFBQSxZQUF0QkMsZ0JBQXNCOztBQUM3QyxZQUFNQyxZQUFZckUsS0FBSzJDLEtBQUwsQ0FBV3dCLGVBQVgsS0FBK0IsRUFBakQ7QUFDQSxZQUFNRyxhQUFhdEUsS0FBSzJDLEtBQUwsQ0FBV3lCLGdCQUFYLEtBQWdDLEVBQW5EO0FBQ0EsWUFBTUcsdURBQ0g3RixTQUFTSyxLQUFULENBQWVELEtBRFosRUFDb0JrRixPQURwQiw4QkFFSHRGLFNBQVNHLElBQVQsQ0FBY0MsS0FGWCxFQUVtQnVDLEVBRm5CLGFBQU47QUFJQSxZQUFJd0Msa0JBQWtCN0UsU0FBdEIsRUFBaUM7QUFDL0JDLGlCQUFPQyxJQUFQLENBQVkyRSxrQkFBa0I3RSxTQUE5QixFQUF5QzBFLE9BQXpDLENBQWlELFVBQUNyRSxXQUFELEVBQWlCO0FBQ2hFa0YscUJBQVNsRixXQUFULElBQXdCd0Usa0JBQWtCN0UsU0FBbEIsQ0FBNEJLLFdBQTVCLEVBQXlDVCxLQUFqRTtBQUNELFdBRkQ7QUFHRDtBQUNELFlBQUlpRixrQkFBa0JXLE9BQXRCLEVBQStCO0FBQzdCdkYsaUJBQU9DLElBQVAsQ0FBWTJFLGtCQUFrQlcsT0FBOUIsRUFBdUNkLE9BQXZDLENBQStDLFVBQUNlLEtBQUQsRUFBVztBQUN4REYscUJBQVNFLEtBQVQsSUFBa0J0RSxPQUFPc0UsS0FBUCxDQUFsQjtBQUNELFdBRkQ7QUFHRDtBQUNELFlBQU1DLFVBQVVMLFVBQVVNLFNBQVYsQ0FBb0JyRyxrQkFBa0J1RixpQkFBbEIsRUFBcUNyRixpQkFBckMsRUFBd0QrRixRQUF4RCxDQUFwQixDQUFoQjtBQUNBLFlBQU1LLFdBQVdOLFdBQVdLLFNBQVgsQ0FBcUJyRyxrQkFBa0J1RixpQkFBbEIsRUFBcUNyRixpQkFBckMsRUFBd0QrRixRQUF4RCxDQUFyQixDQUFqQjtBQUNBLGVBQU90RyxTQUFTaUYsR0FBVCxDQUFhLENBQ2xCNUQsVUFBVStFLFNBQVYsRUFBcUJFLFFBQXJCLEVBQStCUixhQUEvQixVQUFvRFcsT0FBcEQsQ0FEa0IsRUFFbEJwRixVQUFVZ0YsVUFBVixFQUFzQkMsUUFBdEIsRUFBZ0NOLGNBQWhDLFVBQXNEVyxRQUF0RCxDQUZrQixDQUFiLEVBSU4vRSxJQUpNLENBSUQ7QUFBQSxpQkFBTSxPQUFLeUMsWUFBTCxDQUFrQlAsSUFBbEIsRUFBd0JWLEVBQXhCLEVBQTRCLElBQTVCLEVBQWtDN0MsaUJBQWxDLENBQU47QUFBQSxTQUpDLEVBS05xQixJQUxNLENBS0Q7QUFBQSxpQkFBTXdFLFNBQU47QUFBQSxTQUxDLENBQVA7QUFNRCxPQTdCTSxDQUFQO0FBOEJEOzs7dUNBRWtCdEMsSSxFQUFNVixFLEVBQUk3QyxpQixFQUFtQndGLE8sRUFBUzdELE0sRUFBUTtBQUFBOztBQUMvRCxVQUFNMEQsb0JBQW9COUIsS0FBS1QsT0FBTCxDQUFhSSxhQUFiLENBQTJCbEQsaUJBQTNCLEVBQThDdUQsSUFBeEU7QUFDQSxVQUFNckQsV0FBV21GLGtCQUFrQmxGLE1BQWxCLENBQXlCSCxpQkFBekIsQ0FBakI7QUFDQSxVQUFNdUYsZ0JBQWdCLEtBQUsxQixTQUFMLENBQWVOLEtBQUtHLEtBQXBCLEVBQTJCYixFQUEzQixFQUErQjdDLGlCQUEvQixDQUF0QjtBQUNBLFVBQU15RixpQkFBaUIsS0FBSzVCLFNBQUwsQ0FBZTNELFNBQVNLLEtBQVQsQ0FBZWdELElBQTlCLEVBQW9DaUMsT0FBcEMsRUFBNkN0RixTQUFTSyxLQUFULENBQWVtRixLQUE1RCxDQUF2QjtBQUNBLGFBQU9qRyxTQUFTaUYsR0FBVCxDQUFhLENBQ2xCLEtBQUtWLElBQUwsQ0FBVXVCLGFBQVYsQ0FEa0IsRUFFbEIsS0FBS3ZCLElBQUwsQ0FBVXlCLGNBQVYsQ0FGa0IsQ0FBYixFQUlOcEUsSUFKTSxDQUlELGlCQUF5QztBQUFBOztBQUFBO0FBQUEsWUFBdkNzRSxlQUF1QztBQUFBLFlBQXRCQyxnQkFBc0I7O0FBQzdDLFlBQU1DLFlBQVlyRSxLQUFLMkMsS0FBTCxDQUFXd0IsZUFBWCxLQUErQixFQUFqRDtBQUNBLFlBQU1HLGFBQWF0RSxLQUFLMkMsS0FBTCxDQUFXeUIsZ0JBQVgsS0FBZ0MsRUFBbkQ7QUFDQSxZQUFNM0YsaURBQ0hDLFNBQVNLLEtBQVQsQ0FBZUQsS0FEWixFQUNvQmtGLE9BRHBCLDRCQUVIdEYsU0FBU0csSUFBVCxDQUFjQyxLQUZYLEVBRW1CdUMsRUFGbkIsV0FBTjtBQUlBLFlBQU1xRCxVQUFVTCxVQUFVTSxTQUFWLENBQW9Cckcsa0JBQWtCdUYsaUJBQWxCLEVBQXFDckYsaUJBQXJDLEVBQXdEQyxNQUF4RCxDQUFwQixDQUFoQjtBQUNBLFlBQU1tRyxXQUFXTixXQUFXSyxTQUFYLENBQXFCckcsa0JBQWtCdUYsaUJBQWxCLEVBQXFDckYsaUJBQXJDLEVBQXdEQyxNQUF4RCxDQUFyQixDQUFqQjtBQUNBLGVBQU9SLFNBQVNpRixHQUFULENBQWEsQ0FDbEJoRCxZQUFZbUUsU0FBWixFQUF1QjVGLE1BQXZCLEVBQStCc0YsYUFBL0IsVUFBb0Q1RCxNQUFwRCxFQUE0RHVFLE9BQTVELENBRGtCLEVBRWxCeEUsWUFBWW9FLFVBQVosRUFBd0I3RixNQUF4QixFQUFnQ3dGLGNBQWhDLFVBQXNEOUQsTUFBdEQsRUFBOER5RSxRQUE5RCxDQUZrQixDQUFiLENBQVA7QUFJRCxPQWpCTSxFQWtCTi9FLElBbEJNLENBa0JELFVBQUNnRixHQUFEO0FBQUEsZUFBUyxPQUFLdkMsWUFBTCxDQUFrQlAsSUFBbEIsRUFBd0JWLEVBQXhCLEVBQTRCLElBQTVCLEVBQWtDN0MsaUJBQWxDLEVBQXFEcUIsSUFBckQsQ0FBMEQ7QUFBQSxpQkFBTWdGLEdBQU47QUFBQSxTQUExRCxDQUFUO0FBQUEsT0FsQkMsQ0FBUDtBQW1CRDs7OzJCQUVNOUMsSSxFQUFNVixFLEVBQUk3QyxpQixFQUFtQndGLE8sRUFBUztBQUFBOztBQUMzQyxVQUFNSCxvQkFBb0I5QixLQUFLVCxPQUFMLENBQWFJLGFBQWIsQ0FBMkJsRCxpQkFBM0IsRUFBOEN1RCxJQUF4RTtBQUNBLFVBQU1yRCxXQUFXbUYsa0JBQWtCbEYsTUFBbEIsQ0FBeUJILGlCQUF6QixDQUFqQjtBQUNBLFVBQU11RixnQkFBZ0IsS0FBSzFCLFNBQUwsQ0FBZU4sS0FBS0csS0FBcEIsRUFBMkJiLEVBQTNCLEVBQStCN0MsaUJBQS9CLENBQXRCO0FBQ0EsVUFBTXlGLGlCQUFpQixLQUFLNUIsU0FBTCxDQUFlM0QsU0FBU0ssS0FBVCxDQUFlZ0QsSUFBOUIsRUFBb0NpQyxPQUFwQyxFQUE2Q3RGLFNBQVNLLEtBQVQsQ0FBZW1GLEtBQTVELENBQXZCO0FBQ0EsYUFBT2pHLFNBQVNpRixHQUFULENBQWEsQ0FDbEIsS0FBS1YsSUFBTCxDQUFVdUIsYUFBVixDQURrQixFQUVsQixLQUFLdkIsSUFBTCxDQUFVeUIsY0FBVixDQUZrQixDQUFiLEVBSU5wRSxJQUpNLENBSUQsaUJBQXlDO0FBQUE7O0FBQUE7QUFBQSxZQUF2Q3NFLGVBQXVDO0FBQUEsWUFBdEJDLGdCQUFzQjs7QUFDN0MsWUFBTUMsWUFBWXJFLEtBQUsyQyxLQUFMLENBQVd3QixlQUFYLEtBQStCLEVBQWpEO0FBQ0EsWUFBTUcsYUFBYXRFLEtBQUsyQyxLQUFMLENBQVd5QixnQkFBWCxLQUFnQyxFQUFuRDtBQUNBLFlBQU0zRixtREFDSEMsU0FBU0ssS0FBVCxDQUFlRCxLQURaLEVBQ29Ca0YsT0FEcEIsNkJBRUh0RixTQUFTRyxJQUFULENBQWNDLEtBRlgsRUFFbUJ1QyxFQUZuQixZQUFOO0FBSUEsWUFBTXFELFVBQVVMLFVBQVVNLFNBQVYsQ0FBb0JyRyxrQkFBa0J1RixpQkFBbEIsRUFBcUNyRixpQkFBckMsRUFBd0RDLE1BQXhELENBQXBCLENBQWhCO0FBQ0EsWUFBTW1HLFdBQVdOLFdBQVdLLFNBQVgsQ0FBcUJyRyxrQkFBa0J1RixpQkFBbEIsRUFBcUNyRixpQkFBckMsRUFBd0RDLE1BQXhELENBQXJCLENBQWpCO0FBQ0EsZUFBT1IsU0FBU2lGLEdBQVQsQ0FBYSxDQUNsQjVDLFlBQVkrRCxTQUFaLEVBQXVCSyxPQUF2QixFQUFnQ1gsYUFBaEMsU0FEa0IsRUFFbEJ6RCxZQUFZZ0UsVUFBWixFQUF3Qk0sUUFBeEIsRUFBa0NYLGNBQWxDLFNBRmtCLENBQWIsQ0FBUDtBQUlELE9BakJNLEVBa0JOcEUsSUFsQk0sQ0FrQkQsVUFBQ2dGLEdBQUQ7QUFBQSxlQUFTLE9BQUt2QyxZQUFMLENBQWtCUCxJQUFsQixFQUF3QlYsRUFBeEIsRUFBNEIsSUFBNUIsRUFBa0M3QyxpQkFBbEMsRUFBcURxQixJQUFyRCxDQUEwRDtBQUFBLGlCQUFNZ0YsR0FBTjtBQUFBLFNBQTFELENBQVQ7QUFBQSxPQWxCQyxDQUFQO0FBbUJEOzs7OEJBRVNDLFEsRUFBVXpELEUsRUFBSTlDLFksRUFBYztBQUNwQyxhQUFVdUcsUUFBVixVQUFzQnZHLGdCQUFnQixPQUF0QyxVQUFpRDhDLEVBQWpEO0FBQ0QiLCJmaWxlIjoic3RvcmFnZS9rZXlWYWx1ZVN0b3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHsgU3RvcmFnZSB9IGZyb20gJy4vc3RvcmFnZSc7XG5pbXBvcnQgeyBjcmVhdGVGaWx0ZXIgfSBmcm9tICcuL2NyZWF0ZUZpbHRlcic7XG5pbXBvcnQgeyAkc2VsZiB9IGZyb20gJy4uL21vZGVsJztcblxuZnVuY3Rpb24gc2FuZU51bWJlcihpKSB7XG4gIHJldHVybiAoKHR5cGVvZiBpID09PSAnbnVtYmVyJykgJiYgKCFpc05hTihpKSkgJiYgKGkgIT09IEluZmluaXR5KSAmIChpICE9PSAtSW5maW5pdHkpKTtcbn1cblxuZnVuY3Rpb24gZmluZEVudHJ5Q2FsbGJhY2socmVsYXRpb25zaGlwLCByZWxhdGlvbnNoaXBUaXRsZSwgdGFyZ2V0KSB7XG4gIGNvbnN0IHNpZGVJbmZvID0gcmVsYXRpb25zaGlwLiRzaWRlc1tyZWxhdGlvbnNoaXBUaXRsZV07XG4gIHJldHVybiAodmFsdWUpID0+IHtcbiAgICBpZiAoXG4gICAgICAodmFsdWVbc2lkZUluZm8uc2VsZi5maWVsZF0gPT09IHRhcmdldFtzaWRlSW5mby5zZWxmLmZpZWxkXSkgJiZcbiAgICAgICh2YWx1ZVtzaWRlSW5mby5vdGhlci5maWVsZF0gPT09IHRhcmdldFtzaWRlSW5mby5vdGhlci5maWVsZF0pXG4gICAgKSB7XG4gICAgICBpZiAocmVsYXRpb25zaGlwLiRyZXN0cmljdCkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMocmVsYXRpb25zaGlwLiRyZXN0cmljdCkucmVkdWNlKFxuICAgICAgICAgIChwcmlvciwgcmVzdHJpY3Rpb24pID0+IHByaW9yICYmIHZhbHVlW3Jlc3RyaWN0aW9uXSA9PT0gcmVsYXRpb25zaGlwLiRyZXN0cmljdFtyZXN0cmljdGlvbl0udmFsdWUsXG4gICAgICAgICAgdHJ1ZVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIG1heWJlUHVzaChhcnJheSwgdmFsLCBrZXlzdHJpbmcsIHN0b3JlLCBpZHgpIHtcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAudGhlbigoKSA9PiB7XG4gICAgaWYgKGlkeCA8IDApIHtcbiAgICAgIGFycmF5LnB1c2godmFsKTtcbiAgICAgIHJldHVybiBzdG9yZS5fc2V0KGtleXN0cmluZywgSlNPTi5zdHJpbmdpZnkoYXJyYXkpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9KTtcbn1cblxuXG5mdW5jdGlvbiBtYXliZVVwZGF0ZShhcnJheSwgdmFsLCBrZXlzdHJpbmcsIHN0b3JlLCBleHRyYXMsIGlkeCkge1xuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gIC50aGVuKCgpID0+IHtcbiAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgIGNvbnN0IG1vZGlmaWVkUmVsYXRpb25zaGlwID0gT2JqZWN0LmFzc2lnbihcbiAgICAgICAge30sXG4gICAgICAgIGFycmF5W2lkeF0sXG4gICAgICAgIGV4dHJhc1xuICAgICAgKTtcbiAgICAgIGFycmF5W2lkeF0gPSBtb2RpZmllZFJlbGF0aW9uc2hpcDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgcmV0dXJuIHN0b3JlLl9zZXQoa2V5c3RyaW5nLCBKU09OLnN0cmluZ2lmeShhcnJheSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBtYXliZURlbGV0ZShhcnJheSwgaWR4LCBrZXlzdHJpbmcsIHN0b3JlKSB7XG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgLnRoZW4oKCkgPT4ge1xuICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgYXJyYXkuc3BsaWNlKGlkeCwgMSk7XG4gICAgICByZXR1cm4gc3RvcmUuX3NldChrZXlzdHJpbmcsIEpTT04uc3RyaW5naWZ5KGFycmF5KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSk7XG59XG5cblxuZXhwb3J0IGNsYXNzIEtleVZhbHVlU3RvcmUgZXh0ZW5kcyBTdG9yYWdlIHtcbiAgJCRtYXhLZXkodCkge1xuICAgIHJldHVybiB0aGlzLl9rZXlzKHQpXG4gICAgLnRoZW4oKGtleUFycmF5KSA9PiB7XG4gICAgICBpZiAoa2V5QXJyYXkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGtleUFycmF5Lm1hcCgoaykgPT4gay5zcGxpdCgnOicpWzJdKVxuICAgICAgICAubWFwKChrKSA9PiBwYXJzZUludChrLCAxMCkpXG4gICAgICAgIC5maWx0ZXIoKGkpID0+IHNhbmVOdW1iZXIoaSkpXG4gICAgICAgIC5yZWR1Y2UoKG1heCwgY3VycmVudCkgPT4gKGN1cnJlbnQgPiBtYXgpID8gY3VycmVudCA6IG1heCwgMCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICB3cml0ZSh0LCB2KSB7XG4gICAgY29uc3QgaWQgPSB2W3QuJHNjaGVtYS4kaWRdO1xuICAgIGNvbnN0IHVwZGF0ZU9iamVjdCA9IHt9O1xuICAgIGZvciAoY29uc3QgcmVsIGluIHQuJHNjaGVtYS5yZWxhdGlvbnNoaXBzKSB7XG4gICAgICBpZiAodltyZWxdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdXBkYXRlT2JqZWN0W3JlbF0gPSB2W3JlbF0uY29uY2F0KCk7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgYXR0ciBpbiB0LiRzY2hlbWEuYXR0cmlidXRlcykge1xuICAgICAgaWYgKHQuJHNjaGVtYS5hdHRyaWJ1dGVzW2F0dHJdLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIHVwZGF0ZU9iamVjdFthdHRyXSA9IE9iamVjdC5hc3NpZ24oe30sIHZbYXR0cl0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXBkYXRlT2JqZWN0W2F0dHJdID0gdlthdHRyXTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKChpZCA9PT0gdW5kZWZpbmVkKSB8fCAoaWQgPT09IG51bGwpKSB7XG4gICAgICBpZiAodGhpcy50ZXJtaW5hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy4kJG1heEtleSh0LiRuYW1lKVxuICAgICAgICAudGhlbigobikgPT4ge1xuICAgICAgICAgIGNvbnN0IHRvU2F2ZSA9IE9iamVjdC5hc3NpZ24oe30sIHVwZGF0ZU9iamVjdCwgeyBbdC4kc2NoZW1hLiRpZF06IG4gKyAxIH0pO1xuICAgICAgICAgIHJldHVybiB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgbiArIDEpLCBKU09OLnN0cmluZ2lmeSh0b1NhdmUpKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5vdGlmeVVwZGF0ZSh0LCB0b1NhdmVbdC4kaWRdLCB0b1NhdmUpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLnRoZW4oKCkgPT4gdG9TYXZlKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgbmV3IGNvbnRlbnQgaW4gYSBub24tdGVybWluYWwgc3RvcmUnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX2dldCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCkpXG4gICAgICAudGhlbigob3JpZ1ZhbHVlKSA9PiB7XG4gICAgICAgIGNvbnN0IHVwZGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sIEpTT04ucGFyc2Uob3JpZ1ZhbHVlKSwgdXBkYXRlT2JqZWN0KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCksIEpTT04uc3RyaW5naWZ5KHVwZGF0ZSkpXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5ub3RpZnlVcGRhdGUodCwgaWQsIHVwZGF0ZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKCgpID0+IHVwZGF0ZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZWFkT25lKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCkpXG4gICAgLnRoZW4oKGQpID0+IEpTT04ucGFyc2UoZCkpO1xuICB9XG5cbiAgcmVhZE1hbnkodCwgaWQsIHJlbGF0aW9uc2hpcCkge1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcFR5cGUgPSB0LiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxhdGlvbnNoaXBdLnR5cGU7XG4gICAgY29uc3Qgc2lkZUluZm8gPSByZWxhdGlvbnNoaXBUeXBlLiRzaWRlc1tyZWxhdGlvbnNoaXBdO1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCByZXNvbHZlcyA9IFt0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQsIHJlbGF0aW9uc2hpcCkpXTtcbiAgICAgIGlmIChzaWRlSW5mby5zZWxmLnF1ZXJ5ICYmIHNpZGVJbmZvLnNlbGYucXVlcnkucmVxdWlyZUxvYWQpIHtcbiAgICAgICAgcmVzb2x2ZXMucHVzaCh0aGlzLnJlYWRPbmUodCwgaWQpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc29sdmVzLnB1c2goQmx1ZWJpcmQucmVzb2x2ZSh7IGlkIH0pKTtcbiAgICAgIH1cbiAgICAgIC8vIFRPRE86IGlmIHRoZXJlJ3MgYSBxdWVyeSwgS1ZTIGxvYWRzIGEgKmxvdCogaW50byBtZW1vcnkgYW5kIGZpbHRlcnNcbiAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwocmVzb2x2ZXMpO1xuICAgIH0pXG4gICAgLnRoZW4oKFthcnJheVN0cmluZywgY29udGV4dF0pID0+IHtcbiAgICAgIGxldCByZWxhdGlvbnNoaXBBcnJheSA9IEpTT04ucGFyc2UoYXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgaWYgKHNpZGVJbmZvLnNlbGYucXVlcnkpIHtcbiAgICAgICAgY29uc3QgZmlsdGVyQmxvY2sgPSBTdG9yYWdlLm1hc3NSZXBsYWNlKHNpZGVJbmZvLnNlbGYucXVlcnkubG9naWMsIGNvbnRleHQpO1xuICAgICAgICByZWxhdGlvbnNoaXBBcnJheSA9IHJlbGF0aW9uc2hpcEFycmF5LmZpbHRlcihjcmVhdGVGaWx0ZXIoZmlsdGVyQmxvY2spKTtcbiAgICAgIH1cbiAgICAgIGlmIChyZWxhdGlvbnNoaXBUeXBlLiRyZXN0cmljdCkge1xuICAgICAgICByZXR1cm4gcmVsYXRpb25zaGlwQXJyYXkuZmlsdGVyKCh2KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHJlbGF0aW9uc2hpcFR5cGUuJHJlc3RyaWN0KS5yZWR1Y2UoXG4gICAgICAgICAgICAocHJpb3IsIHJlc3RyaWN0aW9uKSA9PiBwcmlvciAmJiB2W3Jlc3RyaWN0aW9uXSA9PT0gcmVsYXRpb25zaGlwVHlwZS4kcmVzdHJpY3RbcmVzdHJpY3Rpb25dLnZhbHVlLFxuICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICk7XG4gICAgICAgIH0pLm1hcCgoZW50cnkpID0+IHtcbiAgICAgICAgICBPYmplY3Qua2V5cyhyZWxhdGlvbnNoaXBUeXBlLiRyZXN0cmljdCkuZm9yRWFjaCgoaykgPT4ge1xuICAgICAgICAgICAgZGVsZXRlIGVudHJ5W2tdOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIGVudHJ5O1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiByZWxhdGlvbnNoaXBBcnJheTtcbiAgICAgIH1cbiAgICB9KS50aGVuKChhcnkpID0+IHtcbiAgICAgIHJldHVybiB7IFtyZWxhdGlvbnNoaXBdOiBhcnkgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGRlbGV0ZSh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzLl9kZWwodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpKTtcbiAgfVxuXG4gIHdpcGUodCwgaWQsIGZpZWxkKSB7XG4gICAgaWYgKGZpZWxkID09PSAkc2VsZikge1xuICAgICAgcmV0dXJuIHRoaXMuX2RlbCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5fZGVsKHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkLCBmaWVsZCkpO1xuICAgIH1cbiAgfVxuXG4gIHdyaXRlSGFzTWFueSh0eXBlLCBpZCwgZmllbGQsIHZhbHVlKSB7XG4gICAgbGV0IHRvU2F2ZSA9IHZhbHVlO1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcEJsb2NrID0gdHlwZS4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbZmllbGRdLnR5cGU7XG4gICAgaWYgKHJlbGF0aW9uc2hpcEJsb2NrLiRyZXN0cmljdCkge1xuICAgICAgY29uc3QgcmVzdHJpY3RCbG9jayA9IHt9O1xuICAgICAgT2JqZWN0LmtleXMocmVsYXRpb25zaGlwQmxvY2suJHJlc3RyaWN0KS5mb3JFYWNoKChrKSA9PiB7XG4gICAgICAgIHJlc3RyaWN0QmxvY2tba10gPSByZWxhdGlvbnNoaXBCbG9jay4kcmVzdHJpY3Rba10udmFsdWU7XG4gICAgICB9KTtcbiAgICAgIHRvU2F2ZSA9IHRvU2F2ZS5tYXAoKHYpID0+IE9iamVjdC5hc3NpZ24oe30sIHYsIHJlc3RyaWN0QmxvY2spKTtcbiAgICB9XG4gICAgLy8gY29uc3Qgc2lkZUluZm8gPSByZWxhdGlvbnNoaXBCbG9jay4kc2lkZXNbZmllbGRdO1xuICAgIGNvbnN0IHRoaXNLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyh0eXBlLiRuYW1lLCBpZCwgZmllbGQpO1xuICAgIHJldHVybiB0aGlzLl9zZXQodGhpc0tleVN0cmluZywgSlNPTi5zdHJpbmdpZnkodG9TYXZlKSk7XG4gIH1cblxuICBhZGQodHlwZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlLCBjaGlsZElkLCBleHRyYXMgPSB7fSkge1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcEJsb2NrID0gdHlwZS4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsYXRpb25zaGlwVGl0bGVdLnR5cGU7XG4gICAgY29uc3Qgc2lkZUluZm8gPSByZWxhdGlvbnNoaXBCbG9jay4kc2lkZXNbcmVsYXRpb25zaGlwVGl0bGVdO1xuICAgIGNvbnN0IHRoaXNLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyh0eXBlLiRuYW1lLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUpO1xuICAgIGNvbnN0IG90aGVyS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcoc2lkZUluZm8ub3RoZXIudHlwZSwgY2hpbGRJZCwgc2lkZUluZm8ub3RoZXIudGl0bGUpO1xuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgdGhpcy5fZ2V0KHRoaXNLZXlTdHJpbmcpLFxuICAgICAgdGhpcy5fZ2V0KG90aGVyS2V5U3RyaW5nKSxcbiAgICBdKVxuICAgIC50aGVuKChbdGhpc0FycmF5U3RyaW5nLCBvdGhlckFycmF5U3RyaW5nXSkgPT4ge1xuICAgICAgY29uc3QgdGhpc0FycmF5ID0gSlNPTi5wYXJzZSh0aGlzQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3Qgb3RoZXJBcnJheSA9IEpTT04ucGFyc2Uob3RoZXJBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCBuZXdGaWVsZCA9IHtcbiAgICAgICAgW3NpZGVJbmZvLm90aGVyLmZpZWxkXTogY2hpbGRJZCxcbiAgICAgICAgW3NpZGVJbmZvLnNlbGYuZmllbGRdOiBpZCxcbiAgICAgIH07XG4gICAgICBpZiAocmVsYXRpb25zaGlwQmxvY2suJHJlc3RyaWN0KSB7XG4gICAgICAgIE9iamVjdC5rZXlzKHJlbGF0aW9uc2hpcEJsb2NrLiRyZXN0cmljdCkuZm9yRWFjaCgocmVzdHJpY3Rpb24pID0+IHtcbiAgICAgICAgICBuZXdGaWVsZFtyZXN0cmljdGlvbl0gPSByZWxhdGlvbnNoaXBCbG9jay4kcmVzdHJpY3RbcmVzdHJpY3Rpb25dLnZhbHVlO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmIChyZWxhdGlvbnNoaXBCbG9jay4kZXh0cmFzKSB7XG4gICAgICAgIE9iamVjdC5rZXlzKHJlbGF0aW9uc2hpcEJsb2NrLiRleHRyYXMpLmZvckVhY2goKGV4dHJhKSA9PiB7XG4gICAgICAgICAgbmV3RmllbGRbZXh0cmFdID0gZXh0cmFzW2V4dHJhXTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBjb25zdCB0aGlzSWR4ID0gdGhpc0FycmF5LmZpbmRJbmRleChmaW5kRW50cnlDYWxsYmFjayhyZWxhdGlvbnNoaXBCbG9jaywgcmVsYXRpb25zaGlwVGl0bGUsIG5ld0ZpZWxkKSk7XG4gICAgICBjb25zdCBvdGhlcklkeCA9IG90aGVyQXJyYXkuZmluZEluZGV4KGZpbmRFbnRyeUNhbGxiYWNrKHJlbGF0aW9uc2hpcEJsb2NrLCByZWxhdGlvbnNoaXBUaXRsZSwgbmV3RmllbGQpKTtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICBtYXliZVB1c2godGhpc0FycmF5LCBuZXdGaWVsZCwgdGhpc0tleVN0cmluZywgdGhpcywgdGhpc0lkeCksXG4gICAgICAgIG1heWJlUHVzaChvdGhlckFycmF5LCBuZXdGaWVsZCwgb3RoZXJLZXlTdHJpbmcsIHRoaXMsIG90aGVySWR4KSxcbiAgICAgIF0pXG4gICAgICAudGhlbigoKSA9PiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBpZCwgbnVsbCwgcmVsYXRpb25zaGlwVGl0bGUpKVxuICAgICAgLnRoZW4oKCkgPT4gdGhpc0FycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIG1vZGlmeVJlbGF0aW9uc2hpcCh0eXBlLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUsIGNoaWxkSWQsIGV4dHJhcykge1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcEJsb2NrID0gdHlwZS4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsYXRpb25zaGlwVGl0bGVdLnR5cGU7XG4gICAgY29uc3Qgc2lkZUluZm8gPSByZWxhdGlvbnNoaXBCbG9jay4kc2lkZXNbcmVsYXRpb25zaGlwVGl0bGVdO1xuICAgIGNvbnN0IHRoaXNLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyh0eXBlLiRuYW1lLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUpO1xuICAgIGNvbnN0IG90aGVyS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcoc2lkZUluZm8ub3RoZXIudHlwZSwgY2hpbGRJZCwgc2lkZUluZm8ub3RoZXIudGl0bGUpO1xuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgdGhpcy5fZ2V0KHRoaXNLZXlTdHJpbmcpLFxuICAgICAgdGhpcy5fZ2V0KG90aGVyS2V5U3RyaW5nKSxcbiAgICBdKVxuICAgIC50aGVuKChbdGhpc0FycmF5U3RyaW5nLCBvdGhlckFycmF5U3RyaW5nXSkgPT4ge1xuICAgICAgY29uc3QgdGhpc0FycmF5ID0gSlNPTi5wYXJzZSh0aGlzQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3Qgb3RoZXJBcnJheSA9IEpTT04ucGFyc2Uob3RoZXJBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCB0YXJnZXQgPSB7XG4gICAgICAgIFtzaWRlSW5mby5vdGhlci5maWVsZF06IGNoaWxkSWQsXG4gICAgICAgIFtzaWRlSW5mby5zZWxmLmZpZWxkXTogaWQsXG4gICAgICB9O1xuICAgICAgY29uc3QgdGhpc0lkeCA9IHRoaXNBcnJheS5maW5kSW5kZXgoZmluZEVudHJ5Q2FsbGJhY2socmVsYXRpb25zaGlwQmxvY2ssIHJlbGF0aW9uc2hpcFRpdGxlLCB0YXJnZXQpKTtcbiAgICAgIGNvbnN0IG90aGVySWR4ID0gb3RoZXJBcnJheS5maW5kSW5kZXgoZmluZEVudHJ5Q2FsbGJhY2socmVsYXRpb25zaGlwQmxvY2ssIHJlbGF0aW9uc2hpcFRpdGxlLCB0YXJnZXQpKTtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICBtYXliZVVwZGF0ZSh0aGlzQXJyYXksIHRhcmdldCwgdGhpc0tleVN0cmluZywgdGhpcywgZXh0cmFzLCB0aGlzSWR4KSxcbiAgICAgICAgbWF5YmVVcGRhdGUob3RoZXJBcnJheSwgdGFyZ2V0LCBvdGhlcktleVN0cmluZywgdGhpcywgZXh0cmFzLCBvdGhlcklkeCksXG4gICAgICBdKTtcbiAgICB9KVxuICAgIC50aGVuKChyZXMpID0+IHRoaXMubm90aWZ5VXBkYXRlKHR5cGUsIGlkLCBudWxsLCByZWxhdGlvbnNoaXBUaXRsZSkudGhlbigoKSA9PiByZXMpKTtcbiAgfVxuXG4gIHJlbW92ZSh0eXBlLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUsIGNoaWxkSWQpIHtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBCbG9jayA9IHR5cGUuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbGF0aW9uc2hpcFRpdGxlXS50eXBlO1xuICAgIGNvbnN0IHNpZGVJbmZvID0gcmVsYXRpb25zaGlwQmxvY2suJHNpZGVzW3JlbGF0aW9uc2hpcFRpdGxlXTtcbiAgICBjb25zdCB0aGlzS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcodHlwZS4kbmFtZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlKTtcbiAgICBjb25zdCBvdGhlcktleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHNpZGVJbmZvLm90aGVyLnR5cGUsIGNoaWxkSWQsIHNpZGVJbmZvLm90aGVyLnRpdGxlKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgIHRoaXMuX2dldCh0aGlzS2V5U3RyaW5nKSxcbiAgICAgIHRoaXMuX2dldChvdGhlcktleVN0cmluZyksXG4gICAgXSlcbiAgICAudGhlbigoW3RoaXNBcnJheVN0cmluZywgb3RoZXJBcnJheVN0cmluZ10pID0+IHtcbiAgICAgIGNvbnN0IHRoaXNBcnJheSA9IEpTT04ucGFyc2UodGhpc0FycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IG90aGVyQXJyYXkgPSBKU09OLnBhcnNlKG90aGVyQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3QgdGFyZ2V0ID0ge1xuICAgICAgICBbc2lkZUluZm8ub3RoZXIuZmllbGRdOiBjaGlsZElkLFxuICAgICAgICBbc2lkZUluZm8uc2VsZi5maWVsZF06IGlkLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IHRoaXNJZHggPSB0aGlzQXJyYXkuZmluZEluZGV4KGZpbmRFbnRyeUNhbGxiYWNrKHJlbGF0aW9uc2hpcEJsb2NrLCByZWxhdGlvbnNoaXBUaXRsZSwgdGFyZ2V0KSk7XG4gICAgICBjb25zdCBvdGhlcklkeCA9IG90aGVyQXJyYXkuZmluZEluZGV4KGZpbmRFbnRyeUNhbGxiYWNrKHJlbGF0aW9uc2hpcEJsb2NrLCByZWxhdGlvbnNoaXBUaXRsZSwgdGFyZ2V0KSk7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgbWF5YmVEZWxldGUodGhpc0FycmF5LCB0aGlzSWR4LCB0aGlzS2V5U3RyaW5nLCB0aGlzKSxcbiAgICAgICAgbWF5YmVEZWxldGUob3RoZXJBcnJheSwgb3RoZXJJZHgsIG90aGVyS2V5U3RyaW5nLCB0aGlzKSxcbiAgICAgIF0pO1xuICAgIH0pXG4gICAgLnRoZW4oKHJlcykgPT4gdGhpcy5ub3RpZnlVcGRhdGUodHlwZSwgaWQsIG51bGwsIHJlbGF0aW9uc2hpcFRpdGxlKS50aGVuKCgpID0+IHJlcykpO1xuICB9XG5cbiAga2V5U3RyaW5nKHR5cGVOYW1lLCBpZCwgcmVsYXRpb25zaGlwKSB7XG4gICAgcmV0dXJuIGAke3R5cGVOYW1lfToke3JlbGF0aW9uc2hpcCB8fCAnc3RvcmUnfToke2lkfWA7XG4gIH1cbn1cbiJdfQ==
