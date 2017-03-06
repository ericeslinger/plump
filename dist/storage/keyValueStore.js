'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KeyValueStore = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var Bluebird = _interopRequireWildcard(_bluebird);

var _mergeOptions2 = require('merge-options');

var _mergeOptions3 = _interopRequireDefault(_mergeOptions2);

var _storage = require('./storage');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function saneNumber(i) {
  return typeof i === 'number' && !isNaN(i) && i !== Infinity & i !== -Infinity;
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
      var modifiedRelationship = (0, _mergeOptions3.default)({}, array[idx], extras ? { meta: extras } : {});
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

function applyDelta(base, delta) {
  if (delta.op === 'add' || delta.op === 'modify') {
    var retVal = (0, _mergeOptions3.default)({}, base, delta.data);
    return retVal;
  } else if (delta.op === 'remove') {
    return undefined;
  } else {
    return base;
  }
}

function resolveRelationship(deltas, maybeBase) {
  var base = maybeBase || [];
  // Index current relationships by ID for efficient modification
  var updates = base.map(function (rel) {
    return _defineProperty({}, rel.id, rel);
  }).reduce(function (acc, curr) {
    return (0, _mergeOptions3.default)(acc, curr);
  }, {});

  // Apply any deltas in dirty cache on top of updates
  deltas.forEach(function (delta) {
    var childId = delta.data.id;
    updates[childId] = applyDelta(updates[childId], delta);
  });

  // Collapse updates back into list, omitting undefineds
  return Object.keys(updates).map(function (id) {
    return updates[id];
  }).filter(function (rel) {
    return rel !== undefined;
  }).reduce(function (acc, curr) {
    return acc.concat(curr);
  }, []);
}

// TODO
function resolveRelationships(schema, deltas) {
  var base = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var updates = {};
  for (var relName in deltas) {
    if (relName in schema.relationships) {
      updates[relName] = resolveRelationship(deltas[relName], base[relName]);
    }
  }
  return (0, _mergeOptions3.default)({}, base, updates);
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
    key: 'getRelationships',
    value: function getRelationships(t, id, opts) {
      var _this2 = this;

      var keys = opts && !Array.isArray(opts) ? [opts] : opts;
      return Bluebird.all(keys.map(function (relName) {
        return _this2._get(_this2.keyString(t.$name, id, relName)).then(function (rel) {
          return _defineProperty({}, relName, JSON.parse(rel));
        });
      })).then(function (relList) {
        return relList.reduce(function (acc, curr) {
          return (0, _mergeOptions3.default)(acc, curr);
        }, {});
      });
    }
  }, {
    key: 'write',
    value: function write(t, v) {
      var id = v.id || v[t.$schema.$id];
      if (id === undefined || id === null) {
        return this.createNew(t, v);
      } else {
        return this.overwrite(t, id, v);
      }
    }
  }, {
    key: 'createNew',
    value: function createNew(t, v) {
      var _this3 = this;

      var toSave = (0, _mergeOptions3.default)({}, v);
      if (this.terminal) {
        return this.$$maxKey(t.$name).then(function (n) {
          var id = n + 1;
          toSave.id = id;
          return Bluebird.all([_this3.writeAttributes(t, id, toSave.attributes), _this3.writeRelationships(t, id, toSave.relationships)]).then(function () {
            var _this3$notifyUpdate;

            return _this3.notifyUpdate(t, toSave[t.$id], (_this3$notifyUpdate = {}, _defineProperty(_this3$notifyUpdate, t.$schema.$id, id), _defineProperty(_this3$notifyUpdate, 'attributes', toSave.attributes), _defineProperty(_this3$notifyUpdate, 'relationships', resolveRelationships(t.$schema, toSave.relationships)), _this3$notifyUpdate));
          }).then(function () {
            return toSave;
          });
        });
      } else {
        throw new Error('Cannot create new content in a non-terminal store');
      }
    }
  }, {
    key: 'overwrite',
    value: function overwrite(t, id, v) {
      var _this4 = this;

      return Bluebird.all([this._get(this.keyString(t.$name, id)), this.getRelationships(t, id, Object.keys(v.relationships))]).then(function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
            origAttributes = _ref4[0],
            origRelationships = _ref4[1];

        var updatedAttributes = Object.assign({}, JSON.parse(origAttributes), v.attributes);
        var updatedRelationships = resolveRelationships(t.$schema, v.relationships, origRelationships);
        var updated = { id: id, attributes: updatedAttributes, relationships: updatedRelationships };
        return Bluebird.all([_this4.writeAttributes(t, id, updatedAttributes), _this4.writeRelationships(t, id, updatedRelationships)]).then(function () {
          return _this4.notifyUpdate(t, id, updated);
        }).then(function () {
          return updated;
        });
      });
    }
  }, {
    key: 'writeAttributes',
    value: function writeAttributes(t, id, attributes) {
      var $id = attributes.id ? 'id' : t.$schema.$id;
      var toWrite = (0, _mergeOptions3.default)({}, attributes, _defineProperty({}, $id, id));
      return this._set(this.keyString(t.$name, id), JSON.stringify(toWrite));
    }
  }, {
    key: 'writeRelationships',
    value: function writeRelationships(t, id, relationships) {
      var _this5 = this;

      return Object.keys(relationships).map(function (relName) {
        return _this5._set(_this5.keyString(t.$name, id, relName), JSON.stringify(relationships[relName]));
      }).reduce(function (thenable, curr) {
        return thenable.then(function () {
          return curr;
        });
      }, Bluebird.resolve());
    }
  }, {
    key: 'readAttributes',
    value: function readAttributes(t, id) {
      return this._get(this.keyString(t.$name, id)).then(function (d) {
        var data = JSON.parse(d);
        if (data) {
          return {
            type: t.$name,
            id: id,
            attributes: data
          };
        } else {
          return null;
        }
      });
    }
  }, {
    key: 'readRelationship',
    value: function readRelationship(t, id, relationship) {
      return this._get(this.keyString(t.$name, id, relationship)).then(function (arrayString) {
        return {
          type: t.$name,
          id: id,
          relationships: _defineProperty({}, relationship, JSON.parse(arrayString) || [])
        };
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
      if (field === 'attributes') {
        return this._del(this.keyString(t.$name, id));
      } else {
        return this._del(this.keyString(t.$name, id, field));
      }
    }
  }, {
    key: 'add',
    value: function add(type, id, relName, childId) {
      var _this6 = this;

      var extras = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

      var relationshipBlock = type.$schema.relationships[relName].type;
      var thisType = type.$name;
      var otherType = relationshipBlock.$sides[relName].otherType;
      var otherName = relationshipBlock.$sides[relName].otherName;
      var thisKeyString = this.keyString(thisType, id, relName);
      var otherKeyString = this.keyString(otherType, childId, otherName);
      return Bluebird.all([this._get(thisKeyString), this._get(otherKeyString)]).then(function (_ref5) {
        var _ref6 = _slicedToArray(_ref5, 2),
            thisArrayString = _ref6[0],
            otherArrayString = _ref6[1];

        var thisArray = JSON.parse(thisArrayString) || [];
        var otherArray = JSON.parse(otherArrayString) || [];
        var newChild = { id: childId };
        var newParent = { id: id };
        if (relationshipBlock.$extras) {
          newChild.meta = newChild.meta || {};
          newParent.meta = newParent.meta || {};
          for (var extra in extras) {
            if (extra in relationshipBlock.$extras) {
              newChild.meta[extra] = extras[extra];
              newParent.meta[extra] = extras[extra];
            }
          }
        }
        var thisIdx = thisArray.findIndex(function (item) {
          return item.id === childId;
        });
        var otherIdx = otherArray.findIndex(function (item) {
          return item.id === id;
        });
        return Bluebird.all([maybePush(thisArray, newChild, thisKeyString, _this6, thisIdx), maybePush(otherArray, newParent, otherKeyString, _this6, otherIdx)]).then(function () {
          return _this6.notifyUpdate(type, id, null, relName);
        }).then(function () {
          return _this6.notifyUpdate(type, childId, null, otherName);
        }).then(function () {
          return thisArray;
        });
      });
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(type, id, relName, childId, extras) {
      var _this7 = this;

      var relationshipBlock = type.$schema.relationships[relName].type;
      var thisType = type.$name;
      var otherType = relationshipBlock.$sides[relName].otherType;
      var otherName = relationshipBlock.$sides[relName].otherName;
      var thisKeyString = this.keyString(thisType, id, relName);
      var otherKeyString = this.keyString(otherType, childId, otherName);
      return Bluebird.all([this._get(thisKeyString), this._get(otherKeyString)]).then(function (_ref7) {
        var _ref8 = _slicedToArray(_ref7, 2),
            thisArrayString = _ref8[0],
            otherArrayString = _ref8[1];

        var thisArray = JSON.parse(thisArrayString) || [];
        var otherArray = JSON.parse(otherArrayString) || [];
        var thisTarget = { id: childId };
        var otherTarget = { id: id };
        var thisIdx = thisArray.findIndex(function (item) {
          return item.id === childId;
        });
        var otherIdx = otherArray.findIndex(function (item) {
          return item.id === id;
        });
        return Bluebird.all([maybeUpdate(thisArray, thisTarget, thisKeyString, _this7, extras, thisIdx), maybeUpdate(otherArray, otherTarget, otherKeyString, _this7, extras, otherIdx)]);
      }).then(function (res) {
        return _this7.notifyUpdate(type, id, null, relName).then(function () {
          return res;
        });
      }).then(function (res) {
        return _this7.notifyUpdate(type, childId, null, otherName).then(function () {
          return res;
        });
      });
    }
  }, {
    key: 'remove',
    value: function remove(type, id, relName, childId) {
      var _this8 = this;

      var relationshipBlock = type.$schema.relationships[relName].type;
      var thisType = type.$name;
      var otherType = relationshipBlock.$sides[relName].otherType;
      var otherName = relationshipBlock.$sides[relName].otherName;
      var thisKeyString = this.keyString(thisType, id, relName);
      var otherKeyString = this.keyString(otherType, childId, otherName);
      return Bluebird.all([this._get(thisKeyString), this._get(otherKeyString)]).then(function (_ref9) {
        var _ref10 = _slicedToArray(_ref9, 2),
            thisArrayString = _ref10[0],
            otherArrayString = _ref10[1];

        var thisArray = JSON.parse(thisArrayString) || [];
        var otherArray = JSON.parse(otherArrayString) || [];
        var thisIdx = thisArray.findIndex(function (item) {
          return item.id === childId;
        });
        var otherIdx = otherArray.findIndex(function (item) {
          return item.id === id;
        });
        return Bluebird.all([maybeDelete(thisArray, thisIdx, thisKeyString, _this8), maybeDelete(otherArray, otherIdx, otherKeyString, _this8)]);
      }).then(function (res) {
        return _this8.notifyUpdate(type, id, null, relName).then(function () {
          return res;
        });
      }).then(function (res) {
        return _this8.notifyUpdate(type, childId, null, otherName).then(function () {
          return res;
        });
      });
    }
  }, {
    key: 'keyString',
    value: function keyString(typeName, id, relationship) {
      return typeName + ':' + (relationship ? 'rel.' + relationship : 'attributes') + ':' + id;
    }
  }]);

  return KeyValueStore;
}(_storage.Storage);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uva2V5VmFsdWVTdG9yZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsInNhbmVOdW1iZXIiLCJpIiwiaXNOYU4iLCJJbmZpbml0eSIsIm1heWJlUHVzaCIsImFycmF5IiwidmFsIiwia2V5c3RyaW5nIiwic3RvcmUiLCJpZHgiLCJyZXNvbHZlIiwidGhlbiIsInB1c2giLCJfc2V0IiwiSlNPTiIsInN0cmluZ2lmeSIsIm1heWJlVXBkYXRlIiwiZXh0cmFzIiwibW9kaWZpZWRSZWxhdGlvbnNoaXAiLCJtZXRhIiwibWF5YmVEZWxldGUiLCJzcGxpY2UiLCJhcHBseURlbHRhIiwiYmFzZSIsImRlbHRhIiwib3AiLCJyZXRWYWwiLCJkYXRhIiwidW5kZWZpbmVkIiwicmVzb2x2ZVJlbGF0aW9uc2hpcCIsImRlbHRhcyIsIm1heWJlQmFzZSIsInVwZGF0ZXMiLCJtYXAiLCJyZWwiLCJpZCIsInJlZHVjZSIsImFjYyIsImN1cnIiLCJmb3JFYWNoIiwiY2hpbGRJZCIsIk9iamVjdCIsImtleXMiLCJmaWx0ZXIiLCJjb25jYXQiLCJyZXNvbHZlUmVsYXRpb25zaGlwcyIsInNjaGVtYSIsInJlbE5hbWUiLCJyZWxhdGlvbnNoaXBzIiwiS2V5VmFsdWVTdG9yZSIsInQiLCJfa2V5cyIsImtleUFycmF5IiwibGVuZ3RoIiwiayIsInNwbGl0IiwicGFyc2VJbnQiLCJtYXgiLCJjdXJyZW50Iiwib3B0cyIsIkFycmF5IiwiaXNBcnJheSIsImFsbCIsIl9nZXQiLCJrZXlTdHJpbmciLCIkbmFtZSIsInBhcnNlIiwicmVsTGlzdCIsInYiLCIkc2NoZW1hIiwiJGlkIiwiY3JlYXRlTmV3Iiwib3ZlcndyaXRlIiwidG9TYXZlIiwidGVybWluYWwiLCIkJG1heEtleSIsIm4iLCJ3cml0ZUF0dHJpYnV0ZXMiLCJhdHRyaWJ1dGVzIiwid3JpdGVSZWxhdGlvbnNoaXBzIiwibm90aWZ5VXBkYXRlIiwiRXJyb3IiLCJnZXRSZWxhdGlvbnNoaXBzIiwib3JpZ0F0dHJpYnV0ZXMiLCJvcmlnUmVsYXRpb25zaGlwcyIsInVwZGF0ZWRBdHRyaWJ1dGVzIiwiYXNzaWduIiwidXBkYXRlZFJlbGF0aW9uc2hpcHMiLCJ1cGRhdGVkIiwidG9Xcml0ZSIsInRoZW5hYmxlIiwiZCIsInR5cGUiLCJyZWxhdGlvbnNoaXAiLCJhcnJheVN0cmluZyIsIl9kZWwiLCJmaWVsZCIsInJlbGF0aW9uc2hpcEJsb2NrIiwidGhpc1R5cGUiLCJvdGhlclR5cGUiLCIkc2lkZXMiLCJvdGhlck5hbWUiLCJ0aGlzS2V5U3RyaW5nIiwib3RoZXJLZXlTdHJpbmciLCJ0aGlzQXJyYXlTdHJpbmciLCJvdGhlckFycmF5U3RyaW5nIiwidGhpc0FycmF5Iiwib3RoZXJBcnJheSIsIm5ld0NoaWxkIiwibmV3UGFyZW50IiwiJGV4dHJhcyIsImV4dHJhIiwidGhpc0lkeCIsImZpbmRJbmRleCIsIml0ZW0iLCJvdGhlcklkeCIsInRoaXNUYXJnZXQiLCJvdGhlclRhcmdldCIsInJlcyIsInR5cGVOYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztJQUFZQSxROztBQUNaOzs7O0FBRUE7Ozs7Ozs7Ozs7Ozs7O0FBRUEsU0FBU0MsVUFBVCxDQUFvQkMsQ0FBcEIsRUFBdUI7QUFDckIsU0FBUyxPQUFPQSxDQUFQLEtBQWEsUUFBZCxJQUE0QixDQUFDQyxNQUFNRCxDQUFOLENBQTdCLElBQTJDQSxNQUFNRSxRQUFQLEdBQW9CRixNQUFNLENBQUNFLFFBQTdFO0FBQ0Q7O0FBRUQsU0FBU0MsU0FBVCxDQUFtQkMsS0FBbkIsRUFBMEJDLEdBQTFCLEVBQStCQyxTQUEvQixFQUEwQ0MsS0FBMUMsRUFBaURDLEdBQWpELEVBQXNEO0FBQ3BELFNBQU9WLFNBQVNXLE9BQVQsR0FDTkMsSUFETSxDQUNELFlBQU07QUFDVixRQUFJRixNQUFNLENBQVYsRUFBYTtBQUNYSixZQUFNTyxJQUFOLENBQVdOLEdBQVg7QUFDQSxhQUFPRSxNQUFNSyxJQUFOLENBQVdOLFNBQVgsRUFBc0JPLEtBQUtDLFNBQUwsQ0FBZVYsS0FB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MEIsUUFBVixVQUFzQjFCLHdCQUFzQkEsWUFBdEIsR0FBdUMsWUFBN0QsVUFBNkUxRCxFQUE3RTtBQUNEIiwiZmlsZSI6InN0b3JhZ2Uva2V5VmFsdWVTdG9yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBtZXJnZU9wdGlvbnMgZnJvbSAnbWVyZ2Utb3B0aW9ucyc7XG5cbmltcG9ydCB7IFN0b3JhZ2UgfSBmcm9tICcuL3N0b3JhZ2UnO1xuXG5mdW5jdGlvbiBzYW5lTnVtYmVyKGkpIHtcbiAgcmV0dXJuICgodHlwZW9mIGkgPT09ICdudW1iZXInKSAmJiAoIWlzTmFOKGkpKSAmJiAoaSAhPT0gSW5maW5pdHkpICYgKGkgIT09IC1JbmZpbml0eSkpO1xufVxuXG5mdW5jdGlvbiBtYXliZVB1c2goYXJyYXksIHZhbCwga2V5c3RyaW5nLCBzdG9yZSwgaWR4KSB7XG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgLnRoZW4oKCkgPT4ge1xuICAgIGlmIChpZHggPCAwKSB7XG4gICAgICBhcnJheS5wdXNoKHZhbCk7XG4gICAgICByZXR1cm4gc3RvcmUuX3NldChrZXlzdHJpbmcsIEpTT04uc3RyaW5naWZ5KGFycmF5KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSk7XG59XG5cblxuZnVuY3Rpb24gbWF5YmVVcGRhdGUoYXJyYXksIHZhbCwga2V5c3RyaW5nLCBzdG9yZSwgZXh0cmFzLCBpZHgpIHtcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAudGhlbigoKSA9PiB7XG4gICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICBjb25zdCBtb2RpZmllZFJlbGF0aW9uc2hpcCA9IG1lcmdlT3B0aW9ucyhcbiAgICAgICAge30sXG4gICAgICAgIGFycmF5W2lkeF0sXG4gICAgICAgIGV4dHJhcyA/IHsgbWV0YTogZXh0cmFzIH0gOiB7fVxuICAgICAgKTtcbiAgICAgIGFycmF5W2lkeF0gPSBtb2RpZmllZFJlbGF0aW9uc2hpcDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgcmV0dXJuIHN0b3JlLl9zZXQoa2V5c3RyaW5nLCBKU09OLnN0cmluZ2lmeShhcnJheSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBtYXliZURlbGV0ZShhcnJheSwgaWR4LCBrZXlzdHJpbmcsIHN0b3JlKSB7XG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgLnRoZW4oKCkgPT4ge1xuICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgYXJyYXkuc3BsaWNlKGlkeCwgMSk7XG4gICAgICByZXR1cm4gc3RvcmUuX3NldChrZXlzdHJpbmcsIEpTT04uc3RyaW5naWZ5KGFycmF5KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGFwcGx5RGVsdGEoYmFzZSwgZGVsdGEpIHtcbiAgaWYgKGRlbHRhLm9wID09PSAnYWRkJyB8fCBkZWx0YS5vcCA9PT0gJ21vZGlmeScpIHtcbiAgICBjb25zdCByZXRWYWwgPSBtZXJnZU9wdGlvbnMoe30sIGJhc2UsIGRlbHRhLmRhdGEpO1xuICAgIHJldHVybiByZXRWYWw7XG4gIH0gZWxzZSBpZiAoZGVsdGEub3AgPT09ICdyZW1vdmUnKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNvbHZlUmVsYXRpb25zaGlwKGRlbHRhcywgbWF5YmVCYXNlKSB7XG4gIGNvbnN0IGJhc2UgPSBtYXliZUJhc2UgfHwgW107XG4gIC8vIEluZGV4IGN1cnJlbnQgcmVsYXRpb25zaGlwcyBieSBJRCBmb3IgZWZmaWNpZW50IG1vZGlmaWNhdGlvblxuICBjb25zdCB1cGRhdGVzID0gYmFzZS5tYXAocmVsID0+IHtcbiAgICByZXR1cm4geyBbcmVsLmlkXTogcmVsIH07XG4gIH0pLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBtZXJnZU9wdGlvbnMoYWNjLCBjdXJyKSwge30pO1xuXG4gIC8vIEFwcGx5IGFueSBkZWx0YXMgaW4gZGlydHkgY2FjaGUgb24gdG9wIG9mIHVwZGF0ZXNcbiAgZGVsdGFzLmZvckVhY2goZGVsdGEgPT4ge1xuICAgIGNvbnN0IGNoaWxkSWQgPSBkZWx0YS5kYXRhLmlkO1xuICAgIHVwZGF0ZXNbY2hpbGRJZF0gPSBhcHBseURlbHRhKHVwZGF0ZXNbY2hpbGRJZF0sIGRlbHRhKTtcbiAgfSk7XG5cbiAgLy8gQ29sbGFwc2UgdXBkYXRlcyBiYWNrIGludG8gbGlzdCwgb21pdHRpbmcgdW5kZWZpbmVkc1xuICByZXR1cm4gT2JqZWN0LmtleXModXBkYXRlcylcbiAgICAubWFwKGlkID0+IHVwZGF0ZXNbaWRdKVxuICAgIC5maWx0ZXIocmVsID0+IHJlbCAhPT0gdW5kZWZpbmVkKVxuICAgIC5yZWR1Y2UoKGFjYywgY3VycikgPT4gYWNjLmNvbmNhdChjdXJyKSwgW10pO1xufVxuXG4vLyBUT0RPXG5mdW5jdGlvbiByZXNvbHZlUmVsYXRpb25zaGlwcyhzY2hlbWEsIGRlbHRhcywgYmFzZSA9IHt9KSB7XG4gIGNvbnN0IHVwZGF0ZXMgPSB7fTtcbiAgZm9yIChjb25zdCByZWxOYW1lIGluIGRlbHRhcykge1xuICAgIGlmIChyZWxOYW1lIGluIHNjaGVtYS5yZWxhdGlvbnNoaXBzKSB7XG4gICAgICB1cGRhdGVzW3JlbE5hbWVdID0gcmVzb2x2ZVJlbGF0aW9uc2hpcChkZWx0YXNbcmVsTmFtZV0sIGJhc2VbcmVsTmFtZV0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbWVyZ2VPcHRpb25zKHt9LCBiYXNlLCB1cGRhdGVzKTtcbn1cblxuXG5leHBvcnQgY2xhc3MgS2V5VmFsdWVTdG9yZSBleHRlbmRzIFN0b3JhZ2Uge1xuICAkJG1heEtleSh0KSB7XG4gICAgcmV0dXJuIHRoaXMuX2tleXModClcbiAgICAudGhlbigoa2V5QXJyYXkpID0+IHtcbiAgICAgIGlmIChrZXlBcnJheS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ga2V5QXJyYXkubWFwKChrKSA9PiBrLnNwbGl0KCc6JylbMl0pXG4gICAgICAgIC5tYXAoKGspID0+IHBhcnNlSW50KGssIDEwKSlcbiAgICAgICAgLmZpbHRlcigoaSkgPT4gc2FuZU51bWJlcihpKSlcbiAgICAgICAgLnJlZHVjZSgobWF4LCBjdXJyZW50KSA9PiAoY3VycmVudCA+IG1heCkgPyBjdXJyZW50IDogbWF4LCAwKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGdldFJlbGF0aW9uc2hpcHModCwgaWQsIG9wdHMpIHtcbiAgICBjb25zdCBrZXlzID0gb3B0cyAmJiAhQXJyYXkuaXNBcnJheShvcHRzKSA/IFtvcHRzXSA6IG9wdHM7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChcbiAgICAgIGtleXMubWFwKHJlbE5hbWUgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkLCByZWxOYW1lKSlcbiAgICAgICAgLnRoZW4ocmVsID0+IHtcbiAgICAgICAgICByZXR1cm4geyBbcmVsTmFtZV06IEpTT04ucGFyc2UocmVsKSB9O1xuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgKS50aGVuKHJlbExpc3QgPT4gcmVsTGlzdC5yZWR1Y2UoKGFjYywgY3VycikgPT4gbWVyZ2VPcHRpb25zKGFjYywgY3VyciksIHt9KSk7XG4gIH1cblxuICB3cml0ZSh0LCB2KSB7XG4gICAgY29uc3QgaWQgPSB2LmlkIHx8IHZbdC4kc2NoZW1hLiRpZF07XG4gICAgaWYgKChpZCA9PT0gdW5kZWZpbmVkKSB8fCAoaWQgPT09IG51bGwpKSB7XG4gICAgICByZXR1cm4gdGhpcy5jcmVhdGVOZXcodCwgdik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLm92ZXJ3cml0ZSh0LCBpZCwgdik7XG4gICAgfVxuICB9XG5cbiAgY3JlYXRlTmV3KHQsIHYpIHtcbiAgICBjb25zdCB0b1NhdmUgPSBtZXJnZU9wdGlvbnMoe30sIHYpO1xuICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICByZXR1cm4gdGhpcy4kJG1heEtleSh0LiRuYW1lKVxuICAgICAgLnRoZW4oKG4pID0+IHtcbiAgICAgICAgY29uc3QgaWQgPSBuICsgMTtcbiAgICAgICAgdG9TYXZlLmlkID0gaWQ7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICAgIHRoaXMud3JpdGVBdHRyaWJ1dGVzKHQsIGlkLCB0b1NhdmUuYXR0cmlidXRlcyksXG4gICAgICAgICAgdGhpcy53cml0ZVJlbGF0aW9uc2hpcHModCwgaWQsIHRvU2F2ZS5yZWxhdGlvbnNoaXBzKSxcbiAgICAgICAgXSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubm90aWZ5VXBkYXRlKHQsIHRvU2F2ZVt0LiRpZF0sIHtcbiAgICAgICAgICAgIFt0LiRzY2hlbWEuJGlkXTogaWQsXG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiB0b1NhdmUuYXR0cmlidXRlcyxcbiAgICAgICAgICAgIHJlbGF0aW9uc2hpcHM6IHJlc29sdmVSZWxhdGlvbnNoaXBzKHQuJHNjaGVtYSwgdG9TYXZlLnJlbGF0aW9uc2hpcHMpLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB0b1NhdmUpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBuZXcgY29udGVudCBpbiBhIG5vbi10ZXJtaW5hbCBzdG9yZScpO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJ3cml0ZSh0LCBpZCwgdikge1xuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkKSksXG4gICAgICB0aGlzLmdldFJlbGF0aW9uc2hpcHModCwgaWQsIE9iamVjdC5rZXlzKHYucmVsYXRpb25zaGlwcykpLFxuICAgIF0pLnRoZW4oKFtvcmlnQXR0cmlidXRlcywgb3JpZ1JlbGF0aW9uc2hpcHNdKSA9PiB7XG4gICAgICBjb25zdCB1cGRhdGVkQXR0cmlidXRlcyA9IE9iamVjdC5hc3NpZ24oe30sIEpTT04ucGFyc2Uob3JpZ0F0dHJpYnV0ZXMpLCB2LmF0dHJpYnV0ZXMpO1xuICAgICAgY29uc3QgdXBkYXRlZFJlbGF0aW9uc2hpcHMgPSByZXNvbHZlUmVsYXRpb25zaGlwcyh0LiRzY2hlbWEsIHYucmVsYXRpb25zaGlwcywgb3JpZ1JlbGF0aW9uc2hpcHMpO1xuICAgICAgY29uc3QgdXBkYXRlZCA9IHsgaWQsIGF0dHJpYnV0ZXM6IHVwZGF0ZWRBdHRyaWJ1dGVzLCByZWxhdGlvbnNoaXBzOiB1cGRhdGVkUmVsYXRpb25zaGlwcyB9O1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIHRoaXMud3JpdGVBdHRyaWJ1dGVzKHQsIGlkLCB1cGRhdGVkQXR0cmlidXRlcyksXG4gICAgICAgIHRoaXMud3JpdGVSZWxhdGlvbnNoaXBzKHQsIGlkLCB1cGRhdGVkUmVsYXRpb25zaGlwcyksXG4gICAgICBdKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5ub3RpZnlVcGRhdGUodCwgaWQsIHVwZGF0ZWQpO1xuICAgICAgfSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHVwZGF0ZWQ7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHdyaXRlQXR0cmlidXRlcyh0LCBpZCwgYXR0cmlidXRlcykge1xuICAgIGNvbnN0ICRpZCA9IGF0dHJpYnV0ZXMuaWQgPyAnaWQnIDogdC4kc2NoZW1hLiRpZDtcbiAgICBjb25zdCB0b1dyaXRlID0gbWVyZ2VPcHRpb25zKHt9LCBhdHRyaWJ1dGVzLCB7IFskaWRdOiBpZCB9KTtcbiAgICByZXR1cm4gdGhpcy5fc2V0KHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkKSwgSlNPTi5zdHJpbmdpZnkodG9Xcml0ZSkpO1xuICB9XG5cbiAgd3JpdGVSZWxhdGlvbnNoaXBzKHQsIGlkLCByZWxhdGlvbnNoaXBzKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHJlbGF0aW9uc2hpcHMpLm1hcChyZWxOYW1lID0+IHtcbiAgICAgIHJldHVybiB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQsIHJlbE5hbWUpLCBKU09OLnN0cmluZ2lmeShyZWxhdGlvbnNoaXBzW3JlbE5hbWVdKSk7XG4gICAgfSkucmVkdWNlKCh0aGVuYWJsZSwgY3VycikgPT4gdGhlbmFibGUudGhlbigoKSA9PiBjdXJyKSwgQmx1ZWJpcmQucmVzb2x2ZSgpKTtcbiAgfVxuXG4gIHJlYWRBdHRyaWJ1dGVzKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCkpXG4gICAgLnRoZW4oKGQpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKGQpO1xuICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiB0LiRuYW1lLFxuICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiBkYXRhLFxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZWFkUmVsYXRpb25zaGlwKHQsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkLCByZWxhdGlvbnNoaXApKVxuICAgIC50aGVuKChhcnJheVN0cmluZykgPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogdC4kbmFtZSxcbiAgICAgICAgaWQ6IGlkLFxuICAgICAgICByZWxhdGlvbnNoaXBzOiB7IFtyZWxhdGlvbnNoaXBdOiBKU09OLnBhcnNlKGFycmF5U3RyaW5nKSB8fCBbXSB9LFxuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGRlbGV0ZSh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzLl9kZWwodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpKTtcbiAgfVxuXG4gIHdpcGUodCwgaWQsIGZpZWxkKSB7XG4gICAgaWYgKGZpZWxkID09PSAnYXR0cmlidXRlcycpIHtcbiAgICAgIHJldHVybiB0aGlzLl9kZWwodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX2RlbCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCwgZmllbGQpKTtcbiAgICB9XG4gIH1cblxuICBhZGQodHlwZSwgaWQsIHJlbE5hbWUsIGNoaWxkSWQsIGV4dHJhcyA9IHt9KSB7XG4gICAgY29uc3QgcmVsYXRpb25zaGlwQmxvY2sgPSB0eXBlLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxOYW1lXS50eXBlO1xuICAgIGNvbnN0IHRoaXNUeXBlID0gdHlwZS4kbmFtZTtcbiAgICBjb25zdCBvdGhlclR5cGUgPSByZWxhdGlvbnNoaXBCbG9jay4kc2lkZXNbcmVsTmFtZV0ub3RoZXJUeXBlO1xuICAgIGNvbnN0IG90aGVyTmFtZSA9IHJlbGF0aW9uc2hpcEJsb2NrLiRzaWRlc1tyZWxOYW1lXS5vdGhlck5hbWU7XG4gICAgY29uc3QgdGhpc0tleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHRoaXNUeXBlLCBpZCwgcmVsTmFtZSk7XG4gICAgY29uc3Qgb3RoZXJLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyhvdGhlclR5cGUsIGNoaWxkSWQsIG90aGVyTmFtZSk7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICB0aGlzLl9nZXQodGhpc0tleVN0cmluZyksXG4gICAgICB0aGlzLl9nZXQob3RoZXJLZXlTdHJpbmcpLFxuICAgIF0pXG4gICAgLnRoZW4oKFt0aGlzQXJyYXlTdHJpbmcsIG90aGVyQXJyYXlTdHJpbmddKSA9PiB7XG4gICAgICBjb25zdCB0aGlzQXJyYXkgPSBKU09OLnBhcnNlKHRoaXNBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCBvdGhlckFycmF5ID0gSlNPTi5wYXJzZShvdGhlckFycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IG5ld0NoaWxkID0geyBpZDogY2hpbGRJZCB9O1xuICAgICAgY29uc3QgbmV3UGFyZW50ID0geyBpZCB9O1xuICAgICAgaWYgKHJlbGF0aW9uc2hpcEJsb2NrLiRleHRyYXMpIHtcbiAgICAgICAgbmV3Q2hpbGQubWV0YSA9IG5ld0NoaWxkLm1ldGEgfHwge307XG4gICAgICAgIG5ld1BhcmVudC5tZXRhID0gbmV3UGFyZW50Lm1ldGEgfHwge307XG4gICAgICAgIGZvciAoY29uc3QgZXh0cmEgaW4gZXh0cmFzKSB7XG4gICAgICAgICAgaWYgKGV4dHJhIGluIHJlbGF0aW9uc2hpcEJsb2NrLiRleHRyYXMpIHtcbiAgICAgICAgICAgIG5ld0NoaWxkLm1ldGFbZXh0cmFdID0gZXh0cmFzW2V4dHJhXTtcbiAgICAgICAgICAgIG5ld1BhcmVudC5tZXRhW2V4dHJhXSA9IGV4dHJhc1tleHRyYV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCB0aGlzSWR4ID0gdGhpc0FycmF5LmZpbmRJbmRleChpdGVtID0+IGl0ZW0uaWQgPT09IGNoaWxkSWQpO1xuICAgICAgY29uc3Qgb3RoZXJJZHggPSBvdGhlckFycmF5LmZpbmRJbmRleChpdGVtID0+IGl0ZW0uaWQgPT09IGlkKTtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICBtYXliZVB1c2godGhpc0FycmF5LCBuZXdDaGlsZCwgdGhpc0tleVN0cmluZywgdGhpcywgdGhpc0lkeCksXG4gICAgICAgIG1heWJlUHVzaChvdGhlckFycmF5LCBuZXdQYXJlbnQsIG90aGVyS2V5U3RyaW5nLCB0aGlzLCBvdGhlcklkeCksXG4gICAgICBdKVxuICAgICAgLnRoZW4oKCkgPT4gdGhpcy5ub3RpZnlVcGRhdGUodHlwZSwgaWQsIG51bGwsIHJlbE5hbWUpKVxuICAgICAgLnRoZW4oKCkgPT4gdGhpcy5ub3RpZnlVcGRhdGUodHlwZSwgY2hpbGRJZCwgbnVsbCwgb3RoZXJOYW1lKSlcbiAgICAgIC50aGVuKCgpID0+IHRoaXNBcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBtb2RpZnlSZWxhdGlvbnNoaXAodHlwZSwgaWQsIHJlbE5hbWUsIGNoaWxkSWQsIGV4dHJhcykge1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcEJsb2NrID0gdHlwZS4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0udHlwZTtcbiAgICBjb25zdCB0aGlzVHlwZSA9IHR5cGUuJG5hbWU7XG4gICAgY29uc3Qgb3RoZXJUeXBlID0gcmVsYXRpb25zaGlwQmxvY2suJHNpZGVzW3JlbE5hbWVdLm90aGVyVHlwZTtcbiAgICBjb25zdCBvdGhlck5hbWUgPSByZWxhdGlvbnNoaXBCbG9jay4kc2lkZXNbcmVsTmFtZV0ub3RoZXJOYW1lO1xuICAgIGNvbnN0IHRoaXNLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyh0aGlzVHlwZSwgaWQsIHJlbE5hbWUpO1xuICAgIGNvbnN0IG90aGVyS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcob3RoZXJUeXBlLCBjaGlsZElkLCBvdGhlck5hbWUpO1xuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgdGhpcy5fZ2V0KHRoaXNLZXlTdHJpbmcpLFxuICAgICAgdGhpcy5fZ2V0KG90aGVyS2V5U3RyaW5nKSxcbiAgICBdKVxuICAgIC50aGVuKChbdGhpc0FycmF5U3RyaW5nLCBvdGhlckFycmF5U3RyaW5nXSkgPT4ge1xuICAgICAgY29uc3QgdGhpc0FycmF5ID0gSlNPTi5wYXJzZSh0aGlzQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3Qgb3RoZXJBcnJheSA9IEpTT04ucGFyc2Uob3RoZXJBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCB0aGlzVGFyZ2V0ID0geyBpZDogY2hpbGRJZCB9O1xuICAgICAgY29uc3Qgb3RoZXJUYXJnZXQgPSB7IGlkIH07XG4gICAgICBjb25zdCB0aGlzSWR4ID0gdGhpc0FycmF5LmZpbmRJbmRleChpdGVtID0+IGl0ZW0uaWQgPT09IGNoaWxkSWQpO1xuICAgICAgY29uc3Qgb3RoZXJJZHggPSBvdGhlckFycmF5LmZpbmRJbmRleChpdGVtID0+IGl0ZW0uaWQgPT09IGlkKTtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICBtYXliZVVwZGF0ZSh0aGlzQXJyYXksIHRoaXNUYXJnZXQsIHRoaXNLZXlTdHJpbmcsIHRoaXMsIGV4dHJhcywgdGhpc0lkeCksXG4gICAgICAgIG1heWJlVXBkYXRlKG90aGVyQXJyYXksIG90aGVyVGFyZ2V0LCBvdGhlcktleVN0cmluZywgdGhpcywgZXh0cmFzLCBvdGhlcklkeCksXG4gICAgICBdKTtcbiAgICB9KVxuICAgIC50aGVuKChyZXMpID0+IHRoaXMubm90aWZ5VXBkYXRlKHR5cGUsIGlkLCBudWxsLCByZWxOYW1lKS50aGVuKCgpID0+IHJlcykpXG4gICAgLnRoZW4oKHJlcykgPT4gdGhpcy5ub3RpZnlVcGRhdGUodHlwZSwgY2hpbGRJZCwgbnVsbCwgb3RoZXJOYW1lKS50aGVuKCgpID0+IHJlcykpO1xuICB9XG5cbiAgcmVtb3ZlKHR5cGUsIGlkLCByZWxOYW1lLCBjaGlsZElkKSB7XG4gICAgY29uc3QgcmVsYXRpb25zaGlwQmxvY2sgPSB0eXBlLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxOYW1lXS50eXBlO1xuICAgIGNvbnN0IHRoaXNUeXBlID0gdHlwZS4kbmFtZTtcbiAgICBjb25zdCBvdGhlclR5cGUgPSByZWxhdGlvbnNoaXBCbG9jay4kc2lkZXNbcmVsTmFtZV0ub3RoZXJUeXBlO1xuICAgIGNvbnN0IG90aGVyTmFtZSA9IHJlbGF0aW9uc2hpcEJsb2NrLiRzaWRlc1tyZWxOYW1lXS5vdGhlck5hbWU7XG4gICAgY29uc3QgdGhpc0tleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHRoaXNUeXBlLCBpZCwgcmVsTmFtZSk7XG4gICAgY29uc3Qgb3RoZXJLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyhvdGhlclR5cGUsIGNoaWxkSWQsIG90aGVyTmFtZSk7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICB0aGlzLl9nZXQodGhpc0tleVN0cmluZyksXG4gICAgICB0aGlzLl9nZXQob3RoZXJLZXlTdHJpbmcpLFxuICAgIF0pXG4gICAgLnRoZW4oKFt0aGlzQXJyYXlTdHJpbmcsIG90aGVyQXJyYXlTdHJpbmddKSA9PiB7XG4gICAgICBjb25zdCB0aGlzQXJyYXkgPSBKU09OLnBhcnNlKHRoaXNBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCBvdGhlckFycmF5ID0gSlNPTi5wYXJzZShvdGhlckFycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IHRoaXNJZHggPSB0aGlzQXJyYXkuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gY2hpbGRJZCk7XG4gICAgICBjb25zdCBvdGhlcklkeCA9IG90aGVyQXJyYXkuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gaWQpO1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIG1heWJlRGVsZXRlKHRoaXNBcnJheSwgdGhpc0lkeCwgdGhpc0tleVN0cmluZywgdGhpcyksXG4gICAgICAgIG1heWJlRGVsZXRlKG90aGVyQXJyYXksIG90aGVySWR4LCBvdGhlcktleVN0cmluZywgdGhpcyksXG4gICAgICBdKTtcbiAgICB9KVxuICAgIC50aGVuKChyZXMpID0+IHRoaXMubm90aWZ5VXBkYXRlKHR5cGUsIGlkLCBudWxsLCByZWxOYW1lKS50aGVuKCgpID0+IHJlcykpXG4gICAgLnRoZW4oKHJlcykgPT4gdGhpcy5ub3RpZnlVcGRhdGUodHlwZSwgY2hpbGRJZCwgbnVsbCwgb3RoZXJOYW1lKS50aGVuKCgpID0+IHJlcykpO1xuICB9XG5cbiAga2V5U3RyaW5nKHR5cGVOYW1lLCBpZCwgcmVsYXRpb25zaGlwKSB7XG4gICAgcmV0dXJuIGAke3R5cGVOYW1lfToke3JlbGF0aW9uc2hpcCA/IGByZWwuJHtyZWxhdGlvbnNoaXB9YCA6ICdhdHRyaWJ1dGVzJ306JHtpZH1gO1xuICB9XG59XG4iXX0=
