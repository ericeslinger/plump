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

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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
    value: function write(v) {
      if (v.id === undefined || v.id === null) {
        return this.createNew(v);
      } else {
        return this.overwrite(v);
      }
    }
  }, {
    key: 'createNew',
    value: function createNew(v) {
      var _this2 = this;

      // const t = this.getType(v.type);
      var toSave = (0, _mergeOptions3.default)({}, v);
      if (this.terminal) {
        return this.$$maxKey(v.type).then(function (n) {
          var id = n + 1;
          toSave.id = id;
          return Bluebird.all([_this2.writeAttributes(v.type, id, toSave.attributes), _this2.writeRelationships(v.type, id, toSave.relationships)]).then(function () {
            return toSave;
          });
        });
      } else {
        throw new Error('Cannot create new content in a non-terminal store');
      }
    }
  }, {
    key: 'overwrite',
    value: function overwrite(v) {
      var _this3 = this;

      return Bluebird.all([this._get(this.keyString(v.type, v.id)), this.readRelationships(v.type, v.id, Object.keys(v.relationships || {}))]).then(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            origAttributes = _ref2[0],
            origRelationships = _ref2[1];

        var updatedAttributes = Object.assign({}, JSON.parse(origAttributes), v.attributes);
        var updatedRelationships = _this3.resolveRelationships(v.type, v.relationships, origRelationships);
        var updated = { id: v.id, type: v.type, attributes: updatedAttributes, relationships: updatedRelationships };
        return Bluebird.all([_this3.writeAttributes(v.type, v.id, updatedAttributes), _this3.writeRelationships(v.type, v.id, updatedRelationships)]).then(function () {
          return _this3.notifyUpdate(v.type, v.id, updated);
        }).then(function () {
          return updated;
        });
      });
    }
  }, {
    key: 'writeAttributes',
    value: function writeAttributes(typeName, id, attributes) {
      var _this4 = this;

      var t = this.getType(typeName);
      var $id = attributes.id ? 'id' : t.$schema.$id;
      var toWrite = (0, _mergeOptions3.default)({}, attributes, _defineProperty({}, $id, id));
      return this._set(this.keyString(t.$name, id), JSON.stringify(toWrite)).then(function (v) {
        _this4.fireWriteUpdate({
          type: t.$name,
          id: id,
          invalidate: ['attributes']
        });
        return v;
      });
    }
  }, {
    key: 'writeRelationships',
    value: function writeRelationships(typeName, id, relationships) {
      var _this5 = this;

      var t = this.getType(typeName);
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
    value: function readAttributes(type, id) {
      var t = this.getType(type);
      return this._get(this.keyString(t.$name, id)).then(function (d) {
        return JSON.parse(d);
      });
    }
  }, {
    key: 'readRelationship',
    value: function readRelationship(type, id, relationship) {
      var t = this.getType(type);
      return this._get(this.keyString(t.$name, id, relationship)).then(function (arrayString) {
        return _defineProperty({}, relationship, JSON.parse(arrayString) || []);
      });
    }
  }, {
    key: 'delete',
    value: function _delete(type, id) {
      var t = this.getType(type);
      return this._del(this.keyString(t.$name, id));
    }
  }, {
    key: 'wipe',
    value: function wipe(type, id, field) {
      var t = this.getType(type);
      if (field === 'attributes') {
        return this._del(this.keyString(t.$name, id));
      } else {
        return this._del(this.keyString(t.$name, id, field));
      }
    }
  }, {
    key: 'add',
    value: function add(typeName, id, relName, childId) {
      var _this6 = this;

      var extras = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

      var type = this.getType(typeName);
      var relationshipBlock = type.$schema.relationships[relName].type;
      var otherType = relationshipBlock.$sides[relName].otherType;
      var otherName = relationshipBlock.$sides[relName].otherName;
      var thisKeyString = this.keyString(typeName, id, relName);
      var otherKeyString = this.keyString(otherType, childId, otherName);
      return Bluebird.all([this._get(thisKeyString), this._get(otherKeyString)]).then(function (_ref4) {
        var _ref5 = _slicedToArray(_ref4, 2),
            thisArrayString = _ref5[0],
            otherArrayString = _ref5[1];

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
        return Bluebird.all([maybePush(thisArray, newChild, thisKeyString, _this6, thisIdx), maybePush(otherArray, newParent, otherKeyString, _this6, otherIdx)]).then(function (res) {
          return _this6.fireWriteUpdate({ type: typeName, id: id, invalidate: [relName] }).then(function () {
            return res;
          });
        }).then(function (res) {
          return _this6.fireWriteUpdate({ type: otherType, id: childId, invalidate: [otherName] }).then(function () {
            return res;
          });
        }).then(function () {
          return thisArray;
        });
      });
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(typeName, id, relName, childId, extras) {
      var _this7 = this;

      var type = this.getType(typeName);
      var relationshipBlock = type.$schema.relationships[relName].type;
      var thisType = type.$name;
      var otherType = relationshipBlock.$sides[relName].otherType;
      var otherName = relationshipBlock.$sides[relName].otherName;
      var thisKeyString = this.keyString(thisType, id, relName);
      var otherKeyString = this.keyString(otherType, childId, otherName);
      return Bluebird.all([this._get(thisKeyString), this._get(otherKeyString)]).then(function (_ref6) {
        var _ref7 = _slicedToArray(_ref6, 2),
            thisArrayString = _ref7[0],
            otherArrayString = _ref7[1];

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
        return _this7.fireWriteUpdate({ type: type.$name, id: id, invalidate: [relName] }).then(function () {
          return res;
        });
      }).then(function (res) {
        return _this7.fireWriteUpdate({ type: type.$name, id: childId, invalidate: [otherName] }).then(function () {
          return res;
        });
      });
    }
  }, {
    key: 'remove',
    value: function remove(typeName, id, relName, childId) {
      var _this8 = this;

      var type = this.getType(typeName);
      var relationshipBlock = type.$schema.relationships[relName].type;
      var thisType = type.$name;
      var otherType = relationshipBlock.$sides[relName].otherType;
      var otherName = relationshipBlock.$sides[relName].otherName;
      var thisKeyString = this.keyString(thisType, id, relName);
      var otherKeyString = this.keyString(otherType, childId, otherName);
      return Bluebird.all([this._get(thisKeyString), this._get(otherKeyString)]).then(function (_ref8) {
        var _ref9 = _slicedToArray(_ref8, 2),
            thisArrayString = _ref9[0],
            otherArrayString = _ref9[1];

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
        return _this8.fireWriteUpdate({ type: type.$name, id: id, invalidate: [relName] }).then(function () {
          return res;
        });
      }).then(function (res) {
        return _this8.fireWriteUpdate({ type: type.$name, id: childId, invalidate: [otherName] }).then(function () {
          return res;
        });
      });
    }
  }, {
    key: 'resolveRelationship',
    value: function resolveRelationship(children, maybeBase) {
      var base = maybeBase || [];
      // Index current relationships by ID for efficient modification
      var updates = base.map(function (rel) {
        return _defineProperty({}, rel.id, rel);
      }).reduce(function (acc, curr) {
        return (0, _mergeOptions3.default)(acc, curr);
      }, {});

      // Apply any children in dirty cache on top of updates
      children.forEach(function (child) {
        if (child.op) {
          var childId = child.data.id;
          updates[childId] = applyDelta(updates[childId], child);
        } else {
          updates[child.id] = child;
        }
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
  }, {
    key: 'resolveRelationships',
    value: function resolveRelationships(typeName, deltas) {
      var base = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var updates = {};
      var schema = this.getType(typeName).$schema;
      for (var relName in deltas) {
        if (relName in schema.relationships) {
          updates[relName] = this.resolveRelationship(deltas[relName], base[relName]);
        }
      }
      return (0, _mergeOptions3.default)({}, base, updates);
    }
  }, {
    key: 'keyString',
    value: function keyString(typeName, id, relationship) {
      return typeName + ':' + (relationship ? 'rel.' + relationship : 'attributes') + ':' + id;
    }
  }]);

  return KeyValueStore;
}(_storage.Storage);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uva2V5VmFsdWVTdG9yZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsInNhbmVOdW1iZXIiLCJpIiwiaXNOYU4iLCJJbmZpbml0eSIsIm1heWJlUHVzaCIsImFycmF5IiwidmFsIiwia2V5c3RyaW5nIiwic3RvcmUiLCJpZHgiLCJyZXNvbHZlIiwidGhlbiIsInB1c2giLCJfc2V0IiwiSlNPTiIsInN0cmluZ2lmeSIsIm1heWJlVXBkYXRlIiwiZXh0cmFzIiwibW9kaWZpZWRSZWxhdGlvbnNoaXAiLCJtZXRhIiwibWF5YmVEZWxldGUiLCJzcGxpY2UiLCJhcHBseURlbHRhIiwiYmFzZSIsImRlbHRhIiwib3AiLCJyZXRWYWwiLCJkYXRhIiwidW5kZWZpbmVkIiwiS2V5VmFsdWVTdG9yZSIsInQiLCJfa2V5cyIsImtleUFycmF5IiwibGVuZ3RoIiwibWFwIiwiayIsInNwbGl0IiwicGFyc2VJbnQiLCJmaWx0ZXIiLCJyZWR1Y2UiLCJtYXgiLCJjdXJyZW50IiwidiIsImlkIiwiY3JlYXRlTmV3Iiwib3ZlcndyaXRlIiwidG9TYXZlIiwidGVybWluYWwiLCIkJG1heEtleSIsInR5cGUiLCJuIiwiYWxsIiwid3JpdGVBdHRyaWJ1dGVzIiwiYXR0cmlidXRlcyIsIndyaXRlUmVsYXRpb25zaGlwcyIsInJlbGF0aW9uc2hpcHMiLCJFcnJvciIsIl9nZXQiLCJrZXlTdHJpbmciLCJyZWFkUmVsYXRpb25zaGlwcyIsIk9iamVjdCIsImtleXMiLCJvcmlnQXR0cmlidXRlcyIsIm9yaWdSZWxhdGlvbnNoaXBzIiwidXBkYXRlZEF0dHJpYnV0ZXMiLCJhc3NpZ24iLCJwYXJzZSIsInVwZGF0ZWRSZWxhdGlvbnNoaXBzIiwicmVzb2x2ZVJlbGF0aW9uc2hpcHMiLCJ1cGRhdGVkIiwibm90aWZ5VXBkYXRlIiwidHlwZU5hbWUiLCJnZXRUeXBlIiwiJGlkIiwiJHNjaGVtYSIsInRvV3JpdGUiLCIkbmFtZSIsImZpcmVXcml0ZVVwZGF0ZSIsImludmFsaWRhdGUiLCJyZWxOYW1lIiwidGhlbmFibGUiLCJjdXJyIiwiZCIsInJlbGF0aW9uc2hpcCIsImFycmF5U3RyaW5nIiwiX2RlbCIsImZpZWxkIiwiY2hpbGRJZCIsInJlbGF0aW9uc2hpcEJsb2NrIiwib3RoZXJUeXBlIiwiJHNpZGVzIiwib3RoZXJOYW1lIiwidGhpc0tleVN0cmluZyIsIm90aGVyS2V5U3RyaW5nIiwidGhpc0FycmF5U3RyaW5nIiwib3RoZXJBcnJheVN0cmluZyIsInRoaXNBcnJheSIsIm90aGVyQXJyYXkiLCJuZXdDaGlsZCIsIm5ld1BhcmVudCIsIiRleHRyYXMiLCJleHRyYSIsInRoaXNJZHgiLCJmaW5kSW5kZXgiLCJpdGVtIiwib3RoZXJJZHgiLCJyZXMiLCJ0aGlzVHlwZSIsInRoaXNUYXJnZXQiLCJvdGhlclRhcmdldCIsImNoaWxkcmVuIiwibWF5YmVCYXNlIiwidXBkYXRlcyIsInJlbCIsImFjYyIsImZvckVhY2giLCJjaGlsZCIsImNvbmNhdCIsImRlbHRhcyIsInNjaGVtYSIsInJlc29sdmVSZWxhdGlvbnNoaXAiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0lBQVlBLFE7O0FBQ1o7Ozs7QUFFQTs7Ozs7Ozs7Ozs7Ozs7QUFFQSxTQUFTQyxVQUFULENBQW9CQyxDQUFwQixFQUF1QjtBQUNyQixTQUFTLE9BQU9BLENBQVAsS0FBYSxRQUFkLElBQTRCLENBQUNDLE1BQU1ELENBQU4sQ0FBN0IsSUFBMkNBLE1BQU1FLFFBQVAsR0FBb0JGLE1BQU0sQ0FBQ0UsUUFBN0U7QUFDRDs7QUFFRCxTQUFTQyxTQUFULENBQW1CQyxLQUFuQixFQUEwQkMsR0FBMUIsRUFBK0JDLFNBQS9CLEVBQTBDQyxLQUExQyxFQUFpREMsR0FBakQsRUFBc0Q7QUFDcEQsU0FBT1YsU0FBU1csT0FBVCxHQUNOQyxJQURNLENBQ0QsWUFBTTtBQUNWLFFBQUlGLE1BQU0sQ0FBVixFQUFhO0FBQ1hKLFlBQU1PLElBQU4sQ0FBV04sR0FBWDtBQUNBLGFBQU9FLE1BQU1LLElBQU4sQ0FBV04sU0FBWCxF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Q3BDLGFBQVVaLFFBQVYsVUFBc0JZLHdCQUFzQkEsWUFBdEIsR0FBdUMsWUFBN0QsVUFBNkV4QyxFQUE3RTtBQUNEIiwiZmlsZSI6InN0b3JhZ2Uva2V5VmFsdWVTdG9yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBtZXJnZU9wdGlvbnMgZnJvbSAnbWVyZ2Utb3B0aW9ucyc7XG5cbmltcG9ydCB7IFN0b3JhZ2UgfSBmcm9tICcuL3N0b3JhZ2UnO1xuXG5mdW5jdGlvbiBzYW5lTnVtYmVyKGkpIHtcbiAgcmV0dXJuICgodHlwZW9mIGkgPT09ICdudW1iZXInKSAmJiAoIWlzTmFOKGkpKSAmJiAoaSAhPT0gSW5maW5pdHkpICYgKGkgIT09IC1JbmZpbml0eSkpO1xufVxuXG5mdW5jdGlvbiBtYXliZVB1c2goYXJyYXksIHZhbCwga2V5c3RyaW5nLCBzdG9yZSwgaWR4KSB7XG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgLnRoZW4oKCkgPT4ge1xuICAgIGlmIChpZHggPCAwKSB7XG4gICAgICBhcnJheS5wdXNoKHZhbCk7XG4gICAgICByZXR1cm4gc3RvcmUuX3NldChrZXlzdHJpbmcsIEpTT04uc3RyaW5naWZ5KGFycmF5KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSk7XG59XG5cblxuZnVuY3Rpb24gbWF5YmVVcGRhdGUoYXJyYXksIHZhbCwga2V5c3RyaW5nLCBzdG9yZSwgZXh0cmFzLCBpZHgpIHtcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAudGhlbigoKSA9PiB7XG4gICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICBjb25zdCBtb2RpZmllZFJlbGF0aW9uc2hpcCA9IG1lcmdlT3B0aW9ucyhcbiAgICAgICAge30sXG4gICAgICAgIGFycmF5W2lkeF0sXG4gICAgICAgIGV4dHJhcyA/IHsgbWV0YTogZXh0cmFzIH0gOiB7fVxuICAgICAgKTtcbiAgICAgIGFycmF5W2lkeF0gPSBtb2RpZmllZFJlbGF0aW9uc2hpcDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgcmV0dXJuIHN0b3JlLl9zZXQoa2V5c3RyaW5nLCBKU09OLnN0cmluZ2lmeShhcnJheSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBtYXliZURlbGV0ZShhcnJheSwgaWR4LCBrZXlzdHJpbmcsIHN0b3JlKSB7XG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgLnRoZW4oKCkgPT4ge1xuICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgYXJyYXkuc3BsaWNlKGlkeCwgMSk7XG4gICAgICByZXR1cm4gc3RvcmUuX3NldChrZXlzdHJpbmcsIEpTT04uc3RyaW5naWZ5KGFycmF5KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGFwcGx5RGVsdGEoYmFzZSwgZGVsdGEpIHtcbiAgaWYgKGRlbHRhLm9wID09PSAnYWRkJyB8fCBkZWx0YS5vcCA9PT0gJ21vZGlmeScpIHtcbiAgICBjb25zdCByZXRWYWwgPSBtZXJnZU9wdGlvbnMoe30sIGJhc2UsIGRlbHRhLmRhdGEpO1xuICAgIHJldHVybiByZXRWYWw7XG4gIH0gZWxzZSBpZiAoZGVsdGEub3AgPT09ICdyZW1vdmUnKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgS2V5VmFsdWVTdG9yZSBleHRlbmRzIFN0b3JhZ2Uge1xuICAkJG1heEtleSh0KSB7XG4gICAgcmV0dXJuIHRoaXMuX2tleXModClcbiAgICAudGhlbigoa2V5QXJyYXkpID0+IHtcbiAgICAgIGlmIChrZXlBcnJheS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ga2V5QXJyYXkubWFwKChrKSA9PiBrLnNwbGl0KCc6JylbMl0pXG4gICAgICAgIC5tYXAoKGspID0+IHBhcnNlSW50KGssIDEwKSlcbiAgICAgICAgLmZpbHRlcigoaSkgPT4gc2FuZU51bWJlcihpKSlcbiAgICAgICAgLnJlZHVjZSgobWF4LCBjdXJyZW50KSA9PiAoY3VycmVudCA+IG1heCkgPyBjdXJyZW50IDogbWF4LCAwKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHdyaXRlKHYpIHtcbiAgICBpZiAoKHYuaWQgPT09IHVuZGVmaW5lZCkgfHwgKHYuaWQgPT09IG51bGwpKSB7XG4gICAgICByZXR1cm4gdGhpcy5jcmVhdGVOZXcodik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLm92ZXJ3cml0ZSh2KTtcbiAgICB9XG4gIH1cblxuICBjcmVhdGVOZXcodikge1xuICAgIC8vIGNvbnN0IHQgPSB0aGlzLmdldFR5cGUodi50eXBlKTtcbiAgICBjb25zdCB0b1NhdmUgPSBtZXJnZU9wdGlvbnMoe30sIHYpO1xuICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICByZXR1cm4gdGhpcy4kJG1heEtleSh2LnR5cGUpXG4gICAgICAudGhlbigobikgPT4ge1xuICAgICAgICBjb25zdCBpZCA9IG4gKyAxO1xuICAgICAgICB0b1NhdmUuaWQgPSBpZDtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgICAgdGhpcy53cml0ZUF0dHJpYnV0ZXModi50eXBlLCBpZCwgdG9TYXZlLmF0dHJpYnV0ZXMpLFxuICAgICAgICAgIHRoaXMud3JpdGVSZWxhdGlvbnNoaXBzKHYudHlwZSwgaWQsIHRvU2F2ZS5yZWxhdGlvbnNoaXBzKSxcbiAgICAgICAgXSlcbiAgICAgICAgLnRoZW4oKCkgPT4gdG9TYXZlKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgbmV3IGNvbnRlbnQgaW4gYSBub24tdGVybWluYWwgc3RvcmUnKTtcbiAgICB9XG4gIH1cblxuICBvdmVyd3JpdGUodikge1xuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHYudHlwZSwgdi5pZCkpLFxuICAgICAgdGhpcy5yZWFkUmVsYXRpb25zaGlwcyh2LnR5cGUsIHYuaWQsIE9iamVjdC5rZXlzKHYucmVsYXRpb25zaGlwcyB8fCB7fSkpLFxuICAgIF0pLnRoZW4oKFtvcmlnQXR0cmlidXRlcywgb3JpZ1JlbGF0aW9uc2hpcHNdKSA9PiB7XG4gICAgICBjb25zdCB1cGRhdGVkQXR0cmlidXRlcyA9IE9iamVjdC5hc3NpZ24oe30sIEpTT04ucGFyc2Uob3JpZ0F0dHJpYnV0ZXMpLCB2LmF0dHJpYnV0ZXMpO1xuICAgICAgY29uc3QgdXBkYXRlZFJlbGF0aW9uc2hpcHMgPSB0aGlzLnJlc29sdmVSZWxhdGlvbnNoaXBzKHYudHlwZSwgdi5yZWxhdGlvbnNoaXBzLCBvcmlnUmVsYXRpb25zaGlwcyk7XG4gICAgICBjb25zdCB1cGRhdGVkID0geyBpZDogdi5pZCwgdHlwZTogdi50eXBlLCBhdHRyaWJ1dGVzOiB1cGRhdGVkQXR0cmlidXRlcywgcmVsYXRpb25zaGlwczogdXBkYXRlZFJlbGF0aW9uc2hpcHMgfTtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICB0aGlzLndyaXRlQXR0cmlidXRlcyh2LnR5cGUsIHYuaWQsIHVwZGF0ZWRBdHRyaWJ1dGVzKSxcbiAgICAgICAgdGhpcy53cml0ZVJlbGF0aW9uc2hpcHModi50eXBlLCB2LmlkLCB1cGRhdGVkUmVsYXRpb25zaGlwcyksXG4gICAgICBdKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5ub3RpZnlVcGRhdGUodi50eXBlLCB2LmlkLCB1cGRhdGVkKTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB1cGRhdGVkO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICB3cml0ZUF0dHJpYnV0ZXModHlwZU5hbWUsIGlkLCBhdHRyaWJ1dGVzKSB7XG4gICAgY29uc3QgdCA9IHRoaXMuZ2V0VHlwZSh0eXBlTmFtZSk7XG4gICAgY29uc3QgJGlkID0gYXR0cmlidXRlcy5pZCA/ICdpZCcgOiB0LiRzY2hlbWEuJGlkO1xuICAgIGNvbnN0IHRvV3JpdGUgPSBtZXJnZU9wdGlvbnMoe30sIGF0dHJpYnV0ZXMsIHsgWyRpZF06IGlkIH0pO1xuICAgIHJldHVybiB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpLCBKU09OLnN0cmluZ2lmeSh0b1dyaXRlKSlcbiAgICAudGhlbigodikgPT4ge1xuICAgICAgdGhpcy5maXJlV3JpdGVVcGRhdGUoe1xuICAgICAgICB0eXBlOiB0LiRuYW1lLFxuICAgICAgICBpZDogaWQsXG4gICAgICAgIGludmFsaWRhdGU6IFsnYXR0cmlidXRlcyddLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gdjtcbiAgICB9KTtcbiAgfVxuXG4gIHdyaXRlUmVsYXRpb25zaGlwcyh0eXBlTmFtZSwgaWQsIHJlbGF0aW9uc2hpcHMpIHtcbiAgICBjb25zdCB0ID0gdGhpcy5nZXRUeXBlKHR5cGVOYW1lKTtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMocmVsYXRpb25zaGlwcykubWFwKHJlbE5hbWUgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCwgcmVsTmFtZSksIEpTT04uc3RyaW5naWZ5KHJlbGF0aW9uc2hpcHNbcmVsTmFtZV0pKTtcbiAgICB9KS5yZWR1Y2UoKHRoZW5hYmxlLCBjdXJyKSA9PiB0aGVuYWJsZS50aGVuKCgpID0+IGN1cnIpLCBCbHVlYmlyZC5yZXNvbHZlKCkpO1xuICB9XG5cbiAgcmVhZEF0dHJpYnV0ZXModHlwZSwgaWQpIHtcbiAgICBjb25zdCB0ID0gdGhpcy5nZXRUeXBlKHR5cGUpO1xuICAgIHJldHVybiB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpKVxuICAgIC50aGVuKGQgPT4gSlNPTi5wYXJzZShkKSk7XG4gIH1cblxuICByZWFkUmVsYXRpb25zaGlwKHR5cGUsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgICBjb25zdCB0ID0gdGhpcy5nZXRUeXBlKHR5cGUpO1xuICAgIHJldHVybiB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQsIHJlbGF0aW9uc2hpcCkpXG4gICAgLnRoZW4oKGFycmF5U3RyaW5nKSA9PiB7XG4gICAgICByZXR1cm4geyBbcmVsYXRpb25zaGlwXTogSlNPTi5wYXJzZShhcnJheVN0cmluZykgfHwgW10gfTtcbiAgICB9KTtcbiAgfVxuXG4gIGRlbGV0ZSh0eXBlLCBpZCkge1xuICAgIGNvbnN0IHQgPSB0aGlzLmdldFR5cGUodHlwZSk7XG4gICAgcmV0dXJuIHRoaXMuX2RlbCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCkpO1xuICB9XG5cbiAgd2lwZSh0eXBlLCBpZCwgZmllbGQpIHtcbiAgICBjb25zdCB0ID0gdGhpcy5nZXRUeXBlKHR5cGUpO1xuICAgIGlmIChmaWVsZCA9PT0gJ2F0dHJpYnV0ZXMnKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZGVsKHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLl9kZWwodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQsIGZpZWxkKSk7XG4gICAgfVxuICB9XG5cbiAgYWRkKHR5cGVOYW1lLCBpZCwgcmVsTmFtZSwgY2hpbGRJZCwgZXh0cmFzID0ge30pIHtcbiAgICBjb25zdCB0eXBlID0gdGhpcy5nZXRUeXBlKHR5cGVOYW1lKTtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBCbG9jayA9IHR5cGUuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnR5cGU7XG4gICAgY29uc3Qgb3RoZXJUeXBlID0gcmVsYXRpb25zaGlwQmxvY2suJHNpZGVzW3JlbE5hbWVdLm90aGVyVHlwZTtcbiAgICBjb25zdCBvdGhlck5hbWUgPSByZWxhdGlvbnNoaXBCbG9jay4kc2lkZXNbcmVsTmFtZV0ub3RoZXJOYW1lO1xuICAgIGNvbnN0IHRoaXNLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyh0eXBlTmFtZSwgaWQsIHJlbE5hbWUpO1xuICAgIGNvbnN0IG90aGVyS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcob3RoZXJUeXBlLCBjaGlsZElkLCBvdGhlck5hbWUpO1xuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgdGhpcy5fZ2V0KHRoaXNLZXlTdHJpbmcpLFxuICAgICAgdGhpcy5fZ2V0KG90aGVyS2V5U3RyaW5nKSxcbiAgICBdKVxuICAgIC50aGVuKChbdGhpc0FycmF5U3RyaW5nLCBvdGhlckFycmF5U3RyaW5nXSkgPT4ge1xuICAgICAgY29uc3QgdGhpc0FycmF5ID0gSlNPTi5wYXJzZSh0aGlzQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3Qgb3RoZXJBcnJheSA9IEpTT04ucGFyc2Uob3RoZXJBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCBuZXdDaGlsZCA9IHsgaWQ6IGNoaWxkSWQgfTtcbiAgICAgIGNvbnN0IG5ld1BhcmVudCA9IHsgaWQgfTtcbiAgICAgIGlmIChyZWxhdGlvbnNoaXBCbG9jay4kZXh0cmFzKSB7XG4gICAgICAgIG5ld0NoaWxkLm1ldGEgPSBuZXdDaGlsZC5tZXRhIHx8IHt9O1xuICAgICAgICBuZXdQYXJlbnQubWV0YSA9IG5ld1BhcmVudC5tZXRhIHx8IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IGV4dHJhIGluIGV4dHJhcykge1xuICAgICAgICAgIGlmIChleHRyYSBpbiByZWxhdGlvbnNoaXBCbG9jay4kZXh0cmFzKSB7XG4gICAgICAgICAgICBuZXdDaGlsZC5tZXRhW2V4dHJhXSA9IGV4dHJhc1tleHRyYV07XG4gICAgICAgICAgICBuZXdQYXJlbnQubWV0YVtleHRyYV0gPSBleHRyYXNbZXh0cmFdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgdGhpc0lkeCA9IHRoaXNBcnJheS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSBjaGlsZElkKTtcbiAgICAgIGNvbnN0IG90aGVySWR4ID0gb3RoZXJBcnJheS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSBpZCk7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgbWF5YmVQdXNoKHRoaXNBcnJheSwgbmV3Q2hpbGQsIHRoaXNLZXlTdHJpbmcsIHRoaXMsIHRoaXNJZHgpLFxuICAgICAgICBtYXliZVB1c2gob3RoZXJBcnJheSwgbmV3UGFyZW50LCBvdGhlcktleVN0cmluZywgdGhpcywgb3RoZXJJZHgpLFxuICAgICAgXSlcbiAgICAgIC50aGVuKChyZXMpID0+IHRoaXMuZmlyZVdyaXRlVXBkYXRlKHsgdHlwZTogdHlwZU5hbWUsIGlkOiBpZCwgaW52YWxpZGF0ZTogW3JlbE5hbWVdIH0pLnRoZW4oKCkgPT4gcmVzKSlcbiAgICAgIC50aGVuKChyZXMpID0+IHRoaXMuZmlyZVdyaXRlVXBkYXRlKHsgdHlwZTogb3RoZXJUeXBlLCBpZDogY2hpbGRJZCwgaW52YWxpZGF0ZTogW290aGVyTmFtZV0gfSkudGhlbigoKSA9PiByZXMpKVxuICAgICAgLnRoZW4oKCkgPT4gdGhpc0FycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIG1vZGlmeVJlbGF0aW9uc2hpcCh0eXBlTmFtZSwgaWQsIHJlbE5hbWUsIGNoaWxkSWQsIGV4dHJhcykge1xuICAgIGNvbnN0IHR5cGUgPSB0aGlzLmdldFR5cGUodHlwZU5hbWUpO1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcEJsb2NrID0gdHlwZS4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0udHlwZTtcbiAgICBjb25zdCB0aGlzVHlwZSA9IHR5cGUuJG5hbWU7XG4gICAgY29uc3Qgb3RoZXJUeXBlID0gcmVsYXRpb25zaGlwQmxvY2suJHNpZGVzW3JlbE5hbWVdLm90aGVyVHlwZTtcbiAgICBjb25zdCBvdGhlck5hbWUgPSByZWxhdGlvbnNoaXBCbG9jay4kc2lkZXNbcmVsTmFtZV0ub3RoZXJOYW1lO1xuICAgIGNvbnN0IHRoaXNLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyh0aGlzVHlwZSwgaWQsIHJlbE5hbWUpO1xuICAgIGNvbnN0IG90aGVyS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcob3RoZXJUeXBlLCBjaGlsZElkLCBvdGhlck5hbWUpO1xuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgdGhpcy5fZ2V0KHRoaXNLZXlTdHJpbmcpLFxuICAgICAgdGhpcy5fZ2V0KG90aGVyS2V5U3RyaW5nKSxcbiAgICBdKVxuICAgIC50aGVuKChbdGhpc0FycmF5U3RyaW5nLCBvdGhlckFycmF5U3RyaW5nXSkgPT4ge1xuICAgICAgY29uc3QgdGhpc0FycmF5ID0gSlNPTi5wYXJzZSh0aGlzQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3Qgb3RoZXJBcnJheSA9IEpTT04ucGFyc2Uob3RoZXJBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCB0aGlzVGFyZ2V0ID0geyBpZDogY2hpbGRJZCB9O1xuICAgICAgY29uc3Qgb3RoZXJUYXJnZXQgPSB7IGlkIH07XG4gICAgICBjb25zdCB0aGlzSWR4ID0gdGhpc0FycmF5LmZpbmRJbmRleChpdGVtID0+IGl0ZW0uaWQgPT09IGNoaWxkSWQpO1xuICAgICAgY29uc3Qgb3RoZXJJZHggPSBvdGhlckFycmF5LmZpbmRJbmRleChpdGVtID0+IGl0ZW0uaWQgPT09IGlkKTtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICBtYXliZVVwZGF0ZSh0aGlzQXJyYXksIHRoaXNUYXJnZXQsIHRoaXNLZXlTdHJpbmcsIHRoaXMsIGV4dHJhcywgdGhpc0lkeCksXG4gICAgICAgIG1heWJlVXBkYXRlKG90aGVyQXJyYXksIG90aGVyVGFyZ2V0LCBvdGhlcktleVN0cmluZywgdGhpcywgZXh0cmFzLCBvdGhlcklkeCksXG4gICAgICBdKTtcbiAgICB9KVxuICAgIC50aGVuKChyZXMpID0+IHRoaXMuZmlyZVdyaXRlVXBkYXRlKHsgdHlwZTogdHlwZS4kbmFtZSwgaWQ6IGlkLCBpbnZhbGlkYXRlOiBbcmVsTmFtZV0gfSkudGhlbigoKSA9PiByZXMpKVxuICAgIC50aGVuKChyZXMpID0+IHRoaXMuZmlyZVdyaXRlVXBkYXRlKHsgdHlwZTogdHlwZS4kbmFtZSwgaWQ6IGNoaWxkSWQsIGludmFsaWRhdGU6IFtvdGhlck5hbWVdIH0pLnRoZW4oKCkgPT4gcmVzKSk7XG4gIH1cblxuICByZW1vdmUodHlwZU5hbWUsIGlkLCByZWxOYW1lLCBjaGlsZElkKSB7XG4gICAgY29uc3QgdHlwZSA9IHRoaXMuZ2V0VHlwZSh0eXBlTmFtZSk7XG4gICAgY29uc3QgcmVsYXRpb25zaGlwQmxvY2sgPSB0eXBlLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxOYW1lXS50eXBlO1xuICAgIGNvbnN0IHRoaXNUeXBlID0gdHlwZS4kbmFtZTtcbiAgICBjb25zdCBvdGhlclR5cGUgPSByZWxhdGlvbnNoaXBCbG9jay4kc2lkZXNbcmVsTmFtZV0ub3RoZXJUeXBlO1xuICAgIGNvbnN0IG90aGVyTmFtZSA9IHJlbGF0aW9uc2hpcEJsb2NrLiRzaWRlc1tyZWxOYW1lXS5vdGhlck5hbWU7XG4gICAgY29uc3QgdGhpc0tleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHRoaXNUeXBlLCBpZCwgcmVsTmFtZSk7XG4gICAgY29uc3Qgb3RoZXJLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyhvdGhlclR5cGUsIGNoaWxkSWQsIG90aGVyTmFtZSk7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICB0aGlzLl9nZXQodGhpc0tleVN0cmluZyksXG4gICAgICB0aGlzLl9nZXQob3RoZXJLZXlTdHJpbmcpLFxuICAgIF0pXG4gICAgLnRoZW4oKFt0aGlzQXJyYXlTdHJpbmcsIG90aGVyQXJyYXlTdHJpbmddKSA9PiB7XG4gICAgICBjb25zdCB0aGlzQXJyYXkgPSBKU09OLnBhcnNlKHRoaXNBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCBvdGhlckFycmF5ID0gSlNPTi5wYXJzZShvdGhlckFycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IHRoaXNJZHggPSB0aGlzQXJyYXkuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gY2hpbGRJZCk7XG4gICAgICBjb25zdCBvdGhlcklkeCA9IG90aGVyQXJyYXkuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gaWQpO1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIG1heWJlRGVsZXRlKHRoaXNBcnJheSwgdGhpc0lkeCwgdGhpc0tleVN0cmluZywgdGhpcyksXG4gICAgICAgIG1heWJlRGVsZXRlKG90aGVyQXJyYXksIG90aGVySWR4LCBvdGhlcktleVN0cmluZywgdGhpcyksXG4gICAgICBdKTtcbiAgICB9KVxuICAgIC50aGVuKChyZXMpID0+IHRoaXMuZmlyZVdyaXRlVXBkYXRlKHsgdHlwZTogdHlwZS4kbmFtZSwgaWQ6IGlkLCBpbnZhbGlkYXRlOiBbcmVsTmFtZV0gfSkudGhlbigoKSA9PiByZXMpKVxuICAgIC50aGVuKChyZXMpID0+IHRoaXMuZmlyZVdyaXRlVXBkYXRlKHsgdHlwZTogdHlwZS4kbmFtZSwgaWQ6IGNoaWxkSWQsIGludmFsaWRhdGU6IFtvdGhlck5hbWVdIH0pLnRoZW4oKCkgPT4gcmVzKSk7XG4gIH1cblxuICByZXNvbHZlUmVsYXRpb25zaGlwKGNoaWxkcmVuLCBtYXliZUJhc2UpIHtcbiAgICBjb25zdCBiYXNlID0gbWF5YmVCYXNlIHx8IFtdO1xuICAgIC8vIEluZGV4IGN1cnJlbnQgcmVsYXRpb25zaGlwcyBieSBJRCBmb3IgZWZmaWNpZW50IG1vZGlmaWNhdGlvblxuICAgIGNvbnN0IHVwZGF0ZXMgPSBiYXNlLm1hcChyZWwgPT4ge1xuICAgICAgcmV0dXJuIHsgW3JlbC5pZF06IHJlbCB9O1xuICAgIH0pLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBtZXJnZU9wdGlvbnMoYWNjLCBjdXJyKSwge30pO1xuXG4gICAgLy8gQXBwbHkgYW55IGNoaWxkcmVuIGluIGRpcnR5IGNhY2hlIG9uIHRvcCBvZiB1cGRhdGVzXG4gICAgY2hpbGRyZW4uZm9yRWFjaChjaGlsZCA9PiB7XG4gICAgICBpZiAoY2hpbGQub3ApIHtcbiAgICAgICAgY29uc3QgY2hpbGRJZCA9IGNoaWxkLmRhdGEuaWQ7XG4gICAgICAgIHVwZGF0ZXNbY2hpbGRJZF0gPSBhcHBseURlbHRhKHVwZGF0ZXNbY2hpbGRJZF0sIGNoaWxkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVwZGF0ZXNbY2hpbGQuaWRdID0gY2hpbGQ7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBDb2xsYXBzZSB1cGRhdGVzIGJhY2sgaW50byBsaXN0LCBvbWl0dGluZyB1bmRlZmluZWRzXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHVwZGF0ZXMpXG4gICAgICAubWFwKGlkID0+IHVwZGF0ZXNbaWRdKVxuICAgICAgLmZpbHRlcihyZWwgPT4gcmVsICE9PSB1bmRlZmluZWQpXG4gICAgICAucmVkdWNlKChhY2MsIGN1cnIpID0+IGFjYy5jb25jYXQoY3VyciksIFtdKTtcbiAgfVxuXG4gIHJlc29sdmVSZWxhdGlvbnNoaXBzKHR5cGVOYW1lLCBkZWx0YXMsIGJhc2UgPSB7fSkge1xuICAgIGNvbnN0IHVwZGF0ZXMgPSB7fTtcbiAgICBjb25zdCBzY2hlbWEgPSB0aGlzLmdldFR5cGUodHlwZU5hbWUpLiRzY2hlbWE7XG4gICAgZm9yIChjb25zdCByZWxOYW1lIGluIGRlbHRhcykge1xuICAgICAgaWYgKHJlbE5hbWUgaW4gc2NoZW1hLnJlbGF0aW9uc2hpcHMpIHtcbiAgICAgICAgdXBkYXRlc1tyZWxOYW1lXSA9IHRoaXMucmVzb2x2ZVJlbGF0aW9uc2hpcChkZWx0YXNbcmVsTmFtZV0sIGJhc2VbcmVsTmFtZV0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWVyZ2VPcHRpb25zKHt9LCBiYXNlLCB1cGRhdGVzKTtcbiAgfVxuICBrZXlTdHJpbmcodHlwZU5hbWUsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgICByZXR1cm4gYCR7dHlwZU5hbWV9OiR7cmVsYXRpb25zaGlwID8gYHJlbC4ke3JlbGF0aW9uc2hpcH1gIDogJ2F0dHJpYnV0ZXMnfToke2lkfWA7XG4gIH1cbn1cbiJdfQ==
