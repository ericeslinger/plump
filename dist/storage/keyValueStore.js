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
        var resolves = [_this3._get(_this3.keyString(t.$name, id, relationshipType.$name))];
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
      var thisKeyString = this.keyString(type.$name, id, relationshipBlock.$name);
      return this._set(thisKeyString, JSON.stringify(toSave));
    }
  }, {
    key: 'add',
    value: function add(type, id, relationshipTitle, childId) {
      var _this4 = this;

      var extras = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

      var relationshipBlock = type.$fields[relationshipTitle].relationship;
      var sideInfo = relationshipBlock.$sides[relationshipTitle];
      var thisKeyString = this.keyString(type.$name, id, relationshipBlock.$name);
      var otherKeyString = this.keyString(sideInfo.other.type, childId, relationshipBlock.$name);
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
      var thisKeyString = this.keyString(type.$name, id, relationshipBlock.$name);
      var otherKeyString = this.keyString(sideInfo.other.type, childId, relationshipBlock.$name);
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
      var thisKeyString = this.keyString(type.$name, id, relationshipBlock.$name);
      var otherKeyString = this.keyString(sideInfo.other.type, childId, relationshipBlock.$name);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uva2V5VmFsdWVTdG9yZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsInNhbmVOdW1iZXIiLCJpIiwiaXNOYU4iLCJJbmZpbml0eSIsImZpbmRFbnRyeUNhbGxiYWNrIiwicmVsYXRpb25zaGlwIiwicmVsYXRpb25zaGlwVGl0bGUiLCJ0YXJnZXQiLCJzaWRlSW5mbyIsIiRzaWRlcyIsInZhbHVlIiwic2VsZiIsImZpZWxkIiwib3RoZXIiLCIkcmVzdHJpY3QiLCJPYmplY3QiLCJrZXlzIiwicmVkdWNlIiwicHJpb3IiLCJyZXN0cmljdGlvbiIsIm1heWJlUHVzaCIsImFycmF5IiwidmFsIiwia2V5c3RyaW5nIiwic3RvcmUiLCJpZHgiLCJyZXNvbHZlIiwidGhlbiIsInB1c2giLCJfc2V0IiwiSlNPTiIsInN0cmluZ2lmeSIsIm1heWJlVXBkYXRlIiwiZXh0cmFzIiwibW9kaWZpZWRSZWxhdGlvbnNoaXAiLCJhc3NpZ24iLCJtYXliZURlbGV0ZSIsInNwbGljZSIsIktleVZhbHVlU3RvcmUiLCJ0IiwiX2tleXMiLCJrZXlBcnJheSIsImxlbmd0aCIsIm1hcCIsImsiLCJzcGxpdCIsInBhcnNlSW50IiwiZmlsdGVyIiwibWF4IiwiY3VycmVudCIsInYiLCJpZCIsIiRpZCIsInVwZGF0ZU9iamVjdCIsIiRmaWVsZHMiLCJmb3JFYWNoIiwiZmllbGROYW1lIiwidW5kZWZpbmVkIiwidHlwZSIsImNvbmNhdCIsInRlcm1pbmFsIiwiJCRtYXhLZXkiLCIkbmFtZSIsIm4iLCJ0b1NhdmUiLCJrZXlTdHJpbmciLCJub3RpZnlVcGRhdGUiLCJFcnJvciIsIl9nZXQiLCJvcmlnVmFsdWUiLCJ1cGRhdGUiLCJwYXJzZSIsImQiLCJyZWxhdGlvbnNoaXBUeXBlIiwicmVzb2x2ZXMiLCJxdWVyeSIsInJlcXVpcmVMb2FkIiwicmVhZE9uZSIsImFsbCIsImFycmF5U3RyaW5nIiwiY29udGV4dCIsInJlbGF0aW9uc2hpcEFycmF5IiwiZmlsdGVyQmxvY2siLCJtYXNzUmVwbGFjZSIsImxvZ2ljIiwiZW50cnkiLCJhcnkiLCJfZGVsIiwicmVsYXRpb25zaGlwQmxvY2siLCJyZXN0cmljdEJsb2NrIiwidGhpc0tleVN0cmluZyIsImNoaWxkSWQiLCJvdGhlcktleVN0cmluZyIsInRoaXNBcnJheVN0cmluZyIsIm90aGVyQXJyYXlTdHJpbmciLCJ0aGlzQXJyYXkiLCJvdGhlckFycmF5IiwibmV3RmllbGQiLCIkZXh0cmFzIiwiZXh0cmEiLCJ0aGlzSWR4IiwiZmluZEluZGV4Iiwib3RoZXJJZHgiLCJyZXMiLCJ0eXBlTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTs7SUFBWUEsUTs7QUFDWjs7QUFDQTs7QUFDQTs7Ozs7Ozs7Ozs7O0FBRUEsU0FBU0MsVUFBVCxDQUFvQkMsQ0FBcEIsRUFBdUI7QUFDckIsU0FBUyxPQUFPQSxDQUFQLEtBQWEsUUFBZCxJQUE0QixDQUFDQyxNQUFNRCxDQUFOLENBQTdCLElBQTJDQSxNQUFNRSxRQUFQLEdBQW9CRixNQUFNLENBQUNFLFFBQTdFO0FBQ0Q7O0FBRUQsU0FBU0MsaUJBQVQsQ0FBMkJDLFlBQTNCLEVBQXlDQyxpQkFBekMsRUFBNERDLE1BQTVELEVBQW9FO0FBQ2xFLE1BQU1DLFdBQVdILGFBQWFJLE1BQWIsQ0FBb0JILGlCQUFwQixDQUFqQjtBQUNBLFNBQU8sVUFBQ0ksS0FBRCxFQUFXO0FBQ2hCLFFBQ0dBLE1BQU1GLFNBQVNHLElBQVQsQ0FBY0MsS0FBcEIsTUFBK0JMLE9BQU9DLFNBQVNHLElBQVQsQ0FBY0MsS0FBckIsQ0FBaEMsSUFDQ0YsTUFBTUYsU0FBU0ssS0FBVCxDQUFlRCxLQUFyQixNQUFnQ0wsT0FBT0MsU0FBU0ssS0FBVCxDQUFlRCxLQUF0QixDQUZuQyxFQUdFO0FBQ0EsVUFBSVAsYUFBYVMsU0FBakIsRUFBNEI7QUFDMUIsZUFBT0MsT0FBT0MsSUFBUCxDQUFZWCxhQUFhUyxTQUF6QixFQUFvQ0csTUFBcEMsQ0FDTCxVQUFDQyxLQUFELEVBQVFDLFdBQVI7QUFBQSxpQkFBd0JELFNB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S0FBK0IsRUFBakQ7QUFDQSxZQUFNRyxhQUFhbEUsS0FBS3lDLEtBQUwsQ0FBV3VCLGdCQUFYLEtBQWdDLEVBQW5EO0FBQ0EsWUFBTXZGLG1EQUNIQyxTQUFTSyxLQUFULENBQWVELEtBRFosRUFDb0IrRSxPQURwQiw2QkFFSG5GLFNBQVNHLElBQVQsQ0FBY0MsS0FGWCxFQUVtQnVDLEVBRm5CLFlBQU47QUFJQSxZQUFNaUQsVUFBVUwsVUFBVU0sU0FBVixDQUFvQmpHLGtCQUFrQm9GLGlCQUFsQixFQUFxQ2xGLGlCQUFyQyxFQUF3REMsTUFBeEQsQ0FBcEIsQ0FBaEI7QUFDQSxZQUFNK0YsV0FBV04sV0FBV0ssU0FBWCxDQUFxQmpHLGtCQUFrQm9GLGlCQUFsQixFQUFxQ2xGLGlCQUFyQyxFQUF3REMsTUFBeEQsQ0FBckIsQ0FBakI7QUFDQSxlQUFPUixTQUFTK0UsR0FBVCxDQUFhLENBQ2xCMUMsWUFBWTJELFNBQVosRUFBdUJLLE9BQXZCLEVBQWdDVixhQUFoQyxTQURrQixFQUVsQnRELFlBQVk0RCxVQUFaLEVBQXdCTSxRQUF4QixFQUFrQ1YsY0FBbEMsU0FGa0IsQ0FBYixDQUFQO0FBSUQsT0FqQk0sRUFrQk5qRSxJQWxCTSxDQWtCRCxVQUFDNEUsR0FBRDtBQUFBLGVBQVMsT0FBS3JDLFlBQUwsQ0FBa0JSLElBQWxCLEVBQXdCUCxFQUF4QixFQUE0QixJQUE1QixFQUFrQzdDLGlCQUFsQyxFQUFxRHFCLElBQXJELENBQTBEO0FBQUEsaUJBQU00RSxHQUFOO0FBQUEsU0FBMUQsQ0FBVDtBQUFBLE9BbEJDLENBQVA7QUFtQkQ7Ozs4QkFFU0MsUSxFQUFVckQsRSxFQUFJOUMsWSxFQUFjO0FBQ3BDLGFBQVVtRyxRQUFWLFVBQXNCbkcsZ0JBQWdCLE9BQXRDLFVBQWlEOEMsRUFBakQ7QUFDRCIsImZpbGUiOiJzdG9yYWdlL2tleVZhbHVlU3RvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBTdG9yYWdlIH0gZnJvbSAnLi9zdG9yYWdlJztcbmltcG9ydCB7IGNyZWF0ZUZpbHRlciB9IGZyb20gJy4vY3JlYXRlRmlsdGVyJztcbmltcG9ydCB7ICRzZWxmIH0gZnJvbSAnLi4vbW9kZWwnO1xuXG5mdW5jdGlvbiBzYW5lTnVtYmVyKGkpIHtcbiAgcmV0dXJuICgodHlwZW9mIGkgPT09ICdudW1iZXInKSAmJiAoIWlzTmFOKGkpKSAmJiAoaSAhPT0gSW5maW5pdHkpICYgKGkgIT09IC1JbmZpbml0eSkpO1xufVxuXG5mdW5jdGlvbiBmaW5kRW50cnlDYWxsYmFjayhyZWxhdGlvbnNoaXAsIHJlbGF0aW9uc2hpcFRpdGxlLCB0YXJnZXQpIHtcbiAgY29uc3Qgc2lkZUluZm8gPSByZWxhdGlvbnNoaXAuJHNpZGVzW3JlbGF0aW9uc2hpcFRpdGxlXTtcbiAgcmV0dXJuICh2YWx1ZSkgPT4ge1xuICAgIGlmIChcbiAgICAgICh2YWx1ZVtzaWRlSW5mby5zZWxmLmZpZWxkXSA9PT0gdGFyZ2V0W3NpZGVJbmZvLnNlbGYuZmllbGRdKSAmJlxuICAgICAgKHZhbHVlW3NpZGVJbmZvLm90aGVyLmZpZWxkXSA9PT0gdGFyZ2V0W3NpZGVJbmZvLm90aGVyLmZpZWxkXSlcbiAgICApIHtcbiAgICAgIGlmIChyZWxhdGlvbnNoaXAuJHJlc3RyaWN0KSB7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhyZWxhdGlvbnNoaXAuJHJlc3RyaWN0KS5yZWR1Y2UoXG4gICAgICAgICAgKHByaW9yLCByZXN0cmljdGlvbikgPT4gcHJpb3IgJiYgdmFsdWVbcmVzdHJpY3Rpb25dID09PSByZWxhdGlvbnNoaXAuJHJlc3RyaWN0W3Jlc3RyaWN0aW9uXS52YWx1ZSxcbiAgICAgICAgICB0cnVlXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gbWF5YmVQdXNoKGFycmF5LCB2YWwsIGtleXN0cmluZywgc3RvcmUsIGlkeCkge1xuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gIC50aGVuKCgpID0+IHtcbiAgICBpZiAoaWR4IDwgMCkge1xuICAgICAgYXJyYXkucHVzaCh2YWwpO1xuICAgICAgcmV0dXJuIHN0b3JlLl9zZXQoa2V5c3RyaW5nLCBKU09OLnN0cmluZ2lmeShhcnJheSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0pO1xufVxuXG5cbmZ1bmN0aW9uIG1heWJlVXBkYXRlKGFycmF5LCB2YWwsIGtleXN0cmluZywgc3RvcmUsIGV4dHJhcywgaWR4KSB7XG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgLnRoZW4oKCkgPT4ge1xuICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgY29uc3QgbW9kaWZpZWRSZWxhdGlvbnNoaXAgPSBPYmplY3QuYXNzaWduKFxuICAgICAgICB7fSxcbiAgICAgICAgYXJyYXlbaWR4XSxcbiAgICAgICAgZXh0cmFzXG4gICAgICApO1xuICAgICAgYXJyYXlbaWR4XSA9IG1vZGlmaWVkUmVsYXRpb25zaGlwOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICByZXR1cm4gc3RvcmUuX3NldChrZXlzdHJpbmcsIEpTT04uc3RyaW5naWZ5KGFycmF5KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG1heWJlRGVsZXRlKGFycmF5LCBpZHgsIGtleXN0cmluZywgc3RvcmUpIHtcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAudGhlbigoKSA9PiB7XG4gICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICBhcnJheS5zcGxpY2UoaWR4LCAxKTtcbiAgICAgIHJldHVybiBzdG9yZS5fc2V0KGtleXN0cmluZywgSlNPTi5zdHJpbmdpZnkoYXJyYXkpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9KTtcbn1cblxuXG5leHBvcnQgY2xhc3MgS2V5VmFsdWVTdG9yZSBleHRlbmRzIFN0b3JhZ2Uge1xuICAkJG1heEtleSh0KSB7XG4gICAgcmV0dXJuIHRoaXMuX2tleXModClcbiAgICAudGhlbigoa2V5QXJyYXkpID0+IHtcbiAgICAgIGlmIChrZXlBcnJheS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ga2V5QXJyYXkubWFwKChrKSA9PiBrLnNwbGl0KCc6JylbMl0pXG4gICAgICAgIC5tYXAoKGspID0+IHBhcnNlSW50KGssIDEwKSlcbiAgICAgICAgLmZpbHRlcigoaSkgPT4gc2FuZU51bWJlcihpKSlcbiAgICAgICAgLnJlZHVjZSgobWF4LCBjdXJyZW50KSA9PiAoY3VycmVudCA+IG1heCkgPyBjdXJyZW50IDogbWF4LCAwKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHdyaXRlKHQsIHYpIHtcbiAgICBjb25zdCBpZCA9IHZbdC4kaWRdO1xuICAgIGNvbnN0IHVwZGF0ZU9iamVjdCA9IHt9O1xuICAgIE9iamVjdC5rZXlzKHQuJGZpZWxkcykuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICBpZiAodltmaWVsZE5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gY29weSBmcm9tIHYgdG8gdGhlIGJlc3Qgb2Ygb3VyIGFiaWxpdHlcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0LiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnYXJyYXknKSB8fFxuICAgICAgICAgICh0LiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnaGFzTWFueScpXG4gICAgICAgICkge1xuICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gdltmaWVsZE5hbWVdLmNvbmNhdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSBPYmplY3QuYXNzaWduKHt9LCB2W2ZpZWxkTmFtZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gdltmaWVsZE5hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKChpZCA9PT0gdW5kZWZpbmVkKSB8fCAoaWQgPT09IG51bGwpKSB7XG4gICAgICBpZiAodGhpcy50ZXJtaW5hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy4kJG1heEtleSh0LiRuYW1lKVxuICAgICAgICAudGhlbigobikgPT4ge1xuICAgICAgICAgIGNvbnN0IHRvU2F2ZSA9IE9iamVjdC5hc3NpZ24oe30sIHVwZGF0ZU9iamVjdCwgeyBbdC4kaWRdOiBuICsgMSB9KTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fc2V0KHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIG4gKyAxKSwgSlNPTi5zdHJpbmdpZnkodG9TYXZlKSlcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ub3RpZnlVcGRhdGUodCwgdG9TYXZlW3QuJGlkXSwgdG9TYXZlKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC50aGVuKCgpID0+IHRvU2F2ZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIG5ldyBjb250ZW50IGluIGEgbm9uLXRlcm1pbmFsIHN0b3JlJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpKVxuICAgICAgLnRoZW4oKG9yaWdWYWx1ZSkgPT4ge1xuICAgICAgICBjb25zdCB1cGRhdGUgPSBPYmplY3QuYXNzaWduKHt9LCBKU09OLnBhcnNlKG9yaWdWYWx1ZSksIHVwZGF0ZU9iamVjdCk7XG4gICAgICAgIHJldHVybiB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpLCBKU09OLnN0cmluZ2lmeSh1cGRhdGUpKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubm90aWZ5VXBkYXRlKHQsIGlkLCB1cGRhdGUpO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB1cGRhdGUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmVhZE9uZSh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpKVxuICAgIC50aGVuKChkKSA9PiBKU09OLnBhcnNlKGQpKTtcbiAgfVxuXG4gIHJlYWRNYW55KHQsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBUeXBlID0gdC4kZmllbGRzW3JlbGF0aW9uc2hpcF0ucmVsYXRpb25zaGlwO1xuICAgIGNvbnN0IHNpZGVJbmZvID0gcmVsYXRpb25zaGlwVHlwZS4kc2lkZXNbcmVsYXRpb25zaGlwXTtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3QgcmVzb2x2ZXMgPSBbdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkLCByZWxhdGlvbnNoaXBUeXBlLiRuYW1lKSldO1xuICAgICAgaWYgKHNpZGVJbmZvLnNlbGYucXVlcnkgJiYgc2lkZUluZm8uc2VsZi5xdWVyeS5yZXF1aXJlTG9hZCkge1xuICAgICAgICByZXNvbHZlcy5wdXNoKHRoaXMucmVhZE9uZSh0LCBpZCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzb2x2ZXMucHVzaChCbHVlYmlyZC5yZXNvbHZlKHsgaWQgfSkpO1xuICAgICAgfVxuICAgICAgLy8gVE9ETzogaWYgdGhlcmUncyBhIHF1ZXJ5LCBLVlMgbG9hZHMgYSAqbG90KiBpbnRvIG1lbW9yeSBhbmQgZmlsdGVyc1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChyZXNvbHZlcyk7XG4gICAgfSlcbiAgICAudGhlbigoW2FycmF5U3RyaW5nLCBjb250ZXh0XSkgPT4ge1xuICAgICAgbGV0IHJlbGF0aW9uc2hpcEFycmF5ID0gSlNPTi5wYXJzZShhcnJheVN0cmluZykgfHwgW107XG4gICAgICBpZiAoc2lkZUluZm8uc2VsZi5xdWVyeSkge1xuICAgICAgICBjb25zdCBmaWx0ZXJCbG9jayA9IFN0b3JhZ2UubWFzc1JlcGxhY2Uoc2lkZUluZm8uc2VsZi5xdWVyeS5sb2dpYywgY29udGV4dCk7XG4gICAgICAgIHJlbGF0aW9uc2hpcEFycmF5ID0gcmVsYXRpb25zaGlwQXJyYXkuZmlsdGVyKGNyZWF0ZUZpbHRlcihmaWx0ZXJCbG9jaykpO1xuICAgICAgfVxuICAgICAgaWYgKHJlbGF0aW9uc2hpcFR5cGUuJHJlc3RyaWN0KSB7XG4gICAgICAgIHJldHVybiByZWxhdGlvbnNoaXBBcnJheS5maWx0ZXIoKHYpID0+IHtcbiAgICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMocmVsYXRpb25zaGlwVHlwZS4kcmVzdHJpY3QpLnJlZHVjZShcbiAgICAgICAgICAgIChwcmlvciwgcmVzdHJpY3Rpb24pID0+IHByaW9yICYmIHZbcmVzdHJpY3Rpb25dID09PSByZWxhdGlvbnNoaXBUeXBlLiRyZXN0cmljdFtyZXN0cmljdGlvbl0udmFsdWUsXG4gICAgICAgICAgICB0cnVlXG4gICAgICAgICAgKTtcbiAgICAgICAgfSkubWFwKChlbnRyeSkgPT4ge1xuICAgICAgICAgIE9iamVjdC5rZXlzKHJlbGF0aW9uc2hpcFR5cGUuJHJlc3RyaWN0KS5mb3JFYWNoKChrKSA9PiB7XG4gICAgICAgICAgICBkZWxldGUgZW50cnlba107IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gZW50cnk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHJlbGF0aW9uc2hpcEFycmF5O1xuICAgICAgfVxuICAgIH0pLnRoZW4oKGFyeSkgPT4ge1xuICAgICAgcmV0dXJuIHsgW3JlbGF0aW9uc2hpcF06IGFyeSB9O1xuICAgIH0pO1xuICB9XG5cbiAgZGVsZXRlKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RlbCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCkpO1xuICB9XG5cbiAgd2lwZSh0LCBpZCwgZmllbGQpIHtcbiAgICBpZiAoZmllbGQgPT09ICRzZWxmKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZGVsKHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLl9kZWwodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQsIGZpZWxkKSk7XG4gICAgfVxuICB9XG5cbiAgd3JpdGVIYXNNYW55KHR5cGUsIGlkLCBmaWVsZCwgdmFsdWUpIHtcbiAgICBsZXQgdG9TYXZlID0gdmFsdWU7XG4gICAgY29uc3QgcmVsYXRpb25zaGlwQmxvY2sgPSB0eXBlLiRmaWVsZHNbZmllbGRdLnJlbGF0aW9uc2hpcDtcbiAgICBpZiAocmVsYXRpb25zaGlwQmxvY2suJHJlc3RyaWN0KSB7XG4gICAgICBjb25zdCByZXN0cmljdEJsb2NrID0ge307XG4gICAgICBPYmplY3Qua2V5cyhyZWxhdGlvbnNoaXBCbG9jay4kcmVzdHJpY3QpLmZvckVhY2goKGspID0+IHtcbiAgICAgICAgcmVzdHJpY3RCbG9ja1trXSA9IHJlbGF0aW9uc2hpcEJsb2NrLiRyZXN0cmljdFtrXS52YWx1ZTtcbiAgICAgIH0pO1xuICAgICAgdG9TYXZlID0gdG9TYXZlLm1hcCgodikgPT4gT2JqZWN0LmFzc2lnbih7fSwgdiwgcmVzdHJpY3RCbG9jaykpO1xuICAgIH1cbiAgICAvLyBjb25zdCBzaWRlSW5mbyA9IHJlbGF0aW9uc2hpcEJsb2NrLiRzaWRlc1tmaWVsZF07XG4gICAgY29uc3QgdGhpc0tleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHR5cGUuJG5hbWUsIGlkLCByZWxhdGlvbnNoaXBCbG9jay4kbmFtZSk7XG4gICAgcmV0dXJuIHRoaXMuX3NldCh0aGlzS2V5U3RyaW5nLCBKU09OLnN0cmluZ2lmeSh0b1NhdmUpKTtcbiAgfVxuXG4gIGFkZCh0eXBlLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUsIGNoaWxkSWQsIGV4dHJhcyA9IHt9KSB7XG4gICAgY29uc3QgcmVsYXRpb25zaGlwQmxvY2sgPSB0eXBlLiRmaWVsZHNbcmVsYXRpb25zaGlwVGl0bGVdLnJlbGF0aW9uc2hpcDtcbiAgICBjb25zdCBzaWRlSW5mbyA9IHJlbGF0aW9uc2hpcEJsb2NrLiRzaWRlc1tyZWxhdGlvbnNoaXBUaXRsZV07XG4gICAgY29uc3QgdGhpc0tleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHR5cGUuJG5hbWUsIGlkLCByZWxhdGlvbnNoaXBCbG9jay4kbmFtZSk7XG4gICAgY29uc3Qgb3RoZXJLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyhzaWRlSW5mby5vdGhlci50eXBlLCBjaGlsZElkLCByZWxhdGlvbnNoaXBCbG9jay4kbmFtZSk7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICB0aGlzLl9nZXQodGhpc0tleVN0cmluZyksXG4gICAgICB0aGlzLl9nZXQob3RoZXJLZXlTdHJpbmcpLFxuICAgIF0pXG4gICAgLnRoZW4oKFt0aGlzQXJyYXlTdHJpbmcsIG90aGVyQXJyYXlTdHJpbmddKSA9PiB7XG4gICAgICBjb25zdCB0aGlzQXJyYXkgPSBKU09OLnBhcnNlKHRoaXNBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCBvdGhlckFycmF5ID0gSlNPTi5wYXJzZShvdGhlckFycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IG5ld0ZpZWxkID0ge1xuICAgICAgICBbc2lkZUluZm8ub3RoZXIuZmllbGRdOiBjaGlsZElkLFxuICAgICAgICBbc2lkZUluZm8uc2VsZi5maWVsZF06IGlkLFxuICAgICAgfTtcbiAgICAgIGlmIChyZWxhdGlvbnNoaXBCbG9jay4kcmVzdHJpY3QpIHtcbiAgICAgICAgT2JqZWN0LmtleXMocmVsYXRpb25zaGlwQmxvY2suJHJlc3RyaWN0KS5mb3JFYWNoKChyZXN0cmljdGlvbikgPT4ge1xuICAgICAgICAgIG5ld0ZpZWxkW3Jlc3RyaWN0aW9uXSA9IHJlbGF0aW9uc2hpcEJsb2NrLiRyZXN0cmljdFtyZXN0cmljdGlvbl0udmFsdWU7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKHJlbGF0aW9uc2hpcEJsb2NrLiRleHRyYXMpIHtcbiAgICAgICAgT2JqZWN0LmtleXMocmVsYXRpb25zaGlwQmxvY2suJGV4dHJhcykuZm9yRWFjaCgoZXh0cmEpID0+IHtcbiAgICAgICAgICBuZXdGaWVsZFtleHRyYV0gPSBleHRyYXNbZXh0cmFdO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHRoaXNJZHggPSB0aGlzQXJyYXkuZmluZEluZGV4KGZpbmRFbnRyeUNhbGxiYWNrKHJlbGF0aW9uc2hpcEJsb2NrLCByZWxhdGlvbnNoaXBUaXRsZSwgbmV3RmllbGQpKTtcbiAgICAgIGNvbnN0IG90aGVySWR4ID0gb3RoZXJBcnJheS5maW5kSW5kZXgoZmluZEVudHJ5Q2FsbGJhY2socmVsYXRpb25zaGlwQmxvY2ssIHJlbGF0aW9uc2hpcFRpdGxlLCBuZXdGaWVsZCkpO1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIG1heWJlUHVzaCh0aGlzQXJyYXksIG5ld0ZpZWxkLCB0aGlzS2V5U3RyaW5nLCB0aGlzLCB0aGlzSWR4KSxcbiAgICAgICAgbWF5YmVQdXNoKG90aGVyQXJyYXksIG5ld0ZpZWxkLCBvdGhlcktleVN0cmluZywgdGhpcywgb3RoZXJJZHgpLFxuICAgICAgXSlcbiAgICAgIC50aGVuKCgpID0+IHRoaXMubm90aWZ5VXBkYXRlKHR5cGUsIGlkLCBudWxsLCByZWxhdGlvbnNoaXBUaXRsZSkpXG4gICAgICAudGhlbigoKSA9PiB0aGlzQXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKHR5cGUsIGlkLCByZWxhdGlvbnNoaXBUaXRsZSwgY2hpbGRJZCwgZXh0cmFzKSB7XG4gICAgY29uc3QgcmVsYXRpb25zaGlwQmxvY2sgPSB0eXBlLiRmaWVsZHNbcmVsYXRpb25zaGlwVGl0bGVdLnJlbGF0aW9uc2hpcDtcbiAgICBjb25zdCBzaWRlSW5mbyA9IHJlbGF0aW9uc2hpcEJsb2NrLiRzaWRlc1tyZWxhdGlvbnNoaXBUaXRsZV07XG4gICAgY29uc3QgdGhpc0tleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHR5cGUuJG5hbWUsIGlkLCByZWxhdGlvbnNoaXBCbG9jay4kbmFtZSk7XG4gICAgY29uc3Qgb3RoZXJLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyhzaWRlSW5mby5vdGhlci50eXBlLCBjaGlsZElkLCByZWxhdGlvbnNoaXBCbG9jay4kbmFtZSk7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICB0aGlzLl9nZXQodGhpc0tleVN0cmluZyksXG4gICAgICB0aGlzLl9nZXQob3RoZXJLZXlTdHJpbmcpLFxuICAgIF0pXG4gICAgLnRoZW4oKFt0aGlzQXJyYXlTdHJpbmcsIG90aGVyQXJyYXlTdHJpbmddKSA9PiB7XG4gICAgICBjb25zdCB0aGlzQXJyYXkgPSBKU09OLnBhcnNlKHRoaXNBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCBvdGhlckFycmF5ID0gSlNPTi5wYXJzZShvdGhlckFycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IHRhcmdldCA9IHtcbiAgICAgICAgW3NpZGVJbmZvLm90aGVyLmZpZWxkXTogY2hpbGRJZCxcbiAgICAgICAgW3NpZGVJbmZvLnNlbGYuZmllbGRdOiBpZCxcbiAgICAgIH07XG4gICAgICBjb25zdCB0aGlzSWR4ID0gdGhpc0FycmF5LmZpbmRJbmRleChmaW5kRW50cnlDYWxsYmFjayhyZWxhdGlvbnNoaXBCbG9jaywgcmVsYXRpb25zaGlwVGl0bGUsIHRhcmdldCkpO1xuICAgICAgY29uc3Qgb3RoZXJJZHggPSBvdGhlckFycmF5LmZpbmRJbmRleChmaW5kRW50cnlDYWxsYmFjayhyZWxhdGlvbnNoaXBCbG9jaywgcmVsYXRpb25zaGlwVGl0bGUsIHRhcmdldCkpO1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIG1heWJlVXBkYXRlKHRoaXNBcnJheSwgdGFyZ2V0LCB0aGlzS2V5U3RyaW5nLCB0aGlzLCBleHRyYXMsIHRoaXNJZHgpLFxuICAgICAgICBtYXliZVVwZGF0ZShvdGhlckFycmF5LCB0YXJnZXQsIG90aGVyS2V5U3RyaW5nLCB0aGlzLCBleHRyYXMsIG90aGVySWR4KSxcbiAgICAgIF0pO1xuICAgIH0pXG4gICAgLnRoZW4oKHJlcykgPT4gdGhpcy5ub3RpZnlVcGRhdGUodHlwZSwgaWQsIG51bGwsIHJlbGF0aW9uc2hpcFRpdGxlKS50aGVuKCgpID0+IHJlcykpO1xuICB9XG5cbiAgcmVtb3ZlKHR5cGUsIGlkLCByZWxhdGlvbnNoaXBUaXRsZSwgY2hpbGRJZCkge1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcEJsb2NrID0gdHlwZS4kZmllbGRzW3JlbGF0aW9uc2hpcFRpdGxlXS5yZWxhdGlvbnNoaXA7XG4gICAgY29uc3Qgc2lkZUluZm8gPSByZWxhdGlvbnNoaXBCbG9jay4kc2lkZXNbcmVsYXRpb25zaGlwVGl0bGVdO1xuICAgIGNvbnN0IHRoaXNLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyh0eXBlLiRuYW1lLCBpZCwgcmVsYXRpb25zaGlwQmxvY2suJG5hbWUpO1xuICAgIGNvbnN0IG90aGVyS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcoc2lkZUluZm8ub3RoZXIudHlwZSwgY2hpbGRJZCwgcmVsYXRpb25zaGlwQmxvY2suJG5hbWUpO1xuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgdGhpcy5fZ2V0KHRoaXNLZXlTdHJpbmcpLFxuICAgICAgdGhpcy5fZ2V0KG90aGVyS2V5U3RyaW5nKSxcbiAgICBdKVxuICAgIC50aGVuKChbdGhpc0FycmF5U3RyaW5nLCBvdGhlckFycmF5U3RyaW5nXSkgPT4ge1xuICAgICAgY29uc3QgdGhpc0FycmF5ID0gSlNPTi5wYXJzZSh0aGlzQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3Qgb3RoZXJBcnJheSA9IEpTT04ucGFyc2Uob3RoZXJBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCB0YXJnZXQgPSB7XG4gICAgICAgIFtzaWRlSW5mby5vdGhlci5maWVsZF06IGNoaWxkSWQsXG4gICAgICAgIFtzaWRlSW5mby5zZWxmLmZpZWxkXTogaWQsXG4gICAgICB9O1xuICAgICAgY29uc3QgdGhpc0lkeCA9IHRoaXNBcnJheS5maW5kSW5kZXgoZmluZEVudHJ5Q2FsbGJhY2socmVsYXRpb25zaGlwQmxvY2ssIHJlbGF0aW9uc2hpcFRpdGxlLCB0YXJnZXQpKTtcbiAgICAgIGNvbnN0IG90aGVySWR4ID0gb3RoZXJBcnJheS5maW5kSW5kZXgoZmluZEVudHJ5Q2FsbGJhY2socmVsYXRpb25zaGlwQmxvY2ssIHJlbGF0aW9uc2hpcFRpdGxlLCB0YXJnZXQpKTtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICBtYXliZURlbGV0ZSh0aGlzQXJyYXksIHRoaXNJZHgsIHRoaXNLZXlTdHJpbmcsIHRoaXMpLFxuICAgICAgICBtYXliZURlbGV0ZShvdGhlckFycmF5LCBvdGhlcklkeCwgb3RoZXJLZXlTdHJpbmcsIHRoaXMpLFxuICAgICAgXSk7XG4gICAgfSlcbiAgICAudGhlbigocmVzKSA9PiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBpZCwgbnVsbCwgcmVsYXRpb25zaGlwVGl0bGUpLnRoZW4oKCkgPT4gcmVzKSk7XG4gIH1cblxuICBrZXlTdHJpbmcodHlwZU5hbWUsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgICByZXR1cm4gYCR7dHlwZU5hbWV9OiR7cmVsYXRpb25zaGlwIHx8ICdzdG9yZSd9OiR7aWR9YDtcbiAgfVxufVxuIl19
