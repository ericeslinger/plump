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
      var _this2 = this;

      var toSave = (0, _mergeOptions3.default)({}, v);
      if (this.terminal) {
        return this.$$maxKey(t.$name).then(function (n) {
          var id = n + 1;
          toSave.id = id;
          return Bluebird.all([_this2.writeAttributes(t, id, toSave.attributes), _this2.writeRelationships(t, id, toSave.relationships)]).then(function () {
            var _this2$notifyUpdate;

            return _this2.notifyUpdate(t, toSave[t.$id], (_this2$notifyUpdate = {}, _defineProperty(_this2$notifyUpdate, t.$schema.$id, id), _defineProperty(_this2$notifyUpdate, 'attributes', toSave.attributes), _defineProperty(_this2$notifyUpdate, 'relationships', resolveRelationships(t.$schema, toSave.relationships)), _this2$notifyUpdate));
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
      var _this3 = this;

      return Bluebird.all([this._get(this.keyString(t.$name, id)), this.readRelationships(t, id, Object.keys(v.relationships))]).then(function (_ref2) {
        var _ref3 = _slicedToArray(_ref2, 2),
            origAttributes = _ref3[0],
            origRelationships = _ref3[1];

        var updatedAttributes = Object.assign({}, JSON.parse(origAttributes), v.attributes);
        var updatedRelationships = resolveRelationships(t.$schema, v.relationships, origRelationships);
        var updated = { id: id, attributes: updatedAttributes, relationships: updatedRelationships };
        return Bluebird.all([_this3.writeAttributes(t, id, updatedAttributes), _this3.writeRelationships(t, id, updatedRelationships)]).then(function () {
          return _this3.notifyUpdate(t, id, updated);
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
      var _this4 = this;

      return Object.keys(relationships).map(function (relName) {
        return _this4._set(_this4.keyString(t.$name, id, relName), JSON.stringify(relationships[relName]));
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
        return JSON.parse(d);
      });
    }
  }, {
    key: 'readRelationship',
    value: function readRelationship(t, id, relationship) {
      return this._get(this.keyString(t.$name, id, relationship)).then(function (arrayString) {
        return _defineProperty({}, relationship, JSON.parse(arrayString) || []);
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
      var _this5 = this;

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
        return Bluebird.all([maybePush(thisArray, newChild, thisKeyString, _this5, thisIdx), maybePush(otherArray, newParent, otherKeyString, _this5, otherIdx)]).then(function () {
          return _this5.notifyUpdate(type, id, null, relName);
        }).then(function () {
          return _this5.notifyUpdate(type, childId, null, otherName);
        }).then(function () {
          return thisArray;
        });
      });
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(type, id, relName, childId, extras) {
      var _this6 = this;

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
        return Bluebird.all([maybeUpdate(thisArray, thisTarget, thisKeyString, _this6, extras, thisIdx), maybeUpdate(otherArray, otherTarget, otherKeyString, _this6, extras, otherIdx)]);
      }).then(function (res) {
        return _this6.notifyUpdate(type, id, null, relName).then(function () {
          return res;
        });
      }).then(function (res) {
        return _this6.notifyUpdate(type, childId, null, otherName).then(function () {
          return res;
        });
      });
    }
  }, {
    key: 'remove',
    value: function remove(type, id, relName, childId) {
      var _this7 = this;

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
        return Bluebird.all([maybeDelete(thisArray, thisIdx, thisKeyString, _this7), maybeDelete(otherArray, otherIdx, otherKeyString, _this7)]);
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
    key: 'keyString',
    value: function keyString(typeName, id, relationship) {
      return typeName + ':' + (relationship ? 'rel.' + relationship : 'attributes') + ':' + id;
    }
  }]);

  return KeyValueStore;
}(_storage.Storage);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uva2V5VmFsdWVTdG9yZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsInNhbmVOdW1iZXIiLCJpIiwiaXNOYU4iLCJJbmZpbml0eSIsIm1heWJlUHVzaCIsImFycmF5IiwidmFsIiwia2V5c3RyaW5nIiwic3RvcmUiLCJpZHgiLCJyZXNvbHZlIiwidGhlbiIsInB1c2giLCJfc2V0IiwiSlNPTiIsInN0cmluZ2lmeSIsIm1heWJlVXBkYXRlIiwiZXh0cmFzIiwibW9kaWZpZWRSZWxhdGlvbnNoaXAiLCJtZXRhIiwibWF5YmVEZWxldGUiLCJzcGxpY2UiLCJhcHBseURlbHRhIiwiYmFzZSIsImRlbHRhIiwib3AiLCJyZXRWYWwiLCJkYXRhIiwidW5kZWZpbmVkIiwicmVzb2x2ZVJlbGF0aW9uc2hpcCIsImRlbHRhcyIsIm1heWJlQmFzZSIsInVwZGF0ZXMiLCJtYXAiLCJyZWwiLCJpZCIsInJlZHVjZSIsImFjYyIsImN1cnIiLCJmb3JFYWNoIiwiY2hpbGRJZCIsIk9iamVjdCIsImtleXMiLCJmaWx0ZXIiLCJjb25jYXQiLCJyZXNvbHZlUmVsYXRpb25zaGlwcyIsInNjaGVtYSIsInJlbE5hbWUiLCJyZWxhdGlvbnNoaXBzIiwiS2V5VmFsdWVTdG9yZSIsInQiLCJfa2V5cyIsImtleUFycmF5IiwibGVuZ3RoIiwiayIsInNwbGl0IiwicGFyc2VJbnQiLCJtYXgiLCJjdXJyZW50IiwidiIsIiRzY2hlbWEiLCIkaWQiLCJjcmVhdGVOZXciLCJvdmVyd3JpdGUiLCJ0b1NhdmUiLCJ0ZXJtaW5hbCIsIiQkbWF4S2V5IiwiJG5hbWUiLCJuIiwiYWxsIiwid3JpdGVBdHRyaWJ1dGVzIiwiYXR0cmlidXRlcyIsIndyaXRlUmVsYXRpb25zaGlwcyIsIm5vdGlmeVVwZGF0ZSIsIkVycm9yIiwiX2dldCIsImtleVN0cmluZyIsInJlYWRSZWxhdGlvbnNoaXBzIiwib3JpZ0F0dHJpYnV0ZXMiLCJvcmlnUmVsYXRpb25zaGlwcyIsInVwZGF0ZWRBdHRyaWJ1dGVzIiwiYXNzaWduIiwicGFyc2UiLCJ1cGRhdGVkUmVsYXRpb25zaGlwcyIsInVwZGF0ZWQiLCJ0b1dyaXRlIiwidGhlbmFibGUiLCJkIiwicmVsYXRpb25zaGlwIiwiYXJyYXlTdHJpbmciLCJfZGVsIiwiZmllbGQiLCJ0eXBlIiwicmVsYXRpb25zaGlwQmxvY2siLCJ0aGlzVHlwZSIsIm90aGVyVHlwZSIsIiRzaWRlcyIsIm90aGVyTmFtZSIsInRoaXNLZXlTdHJpbmciLCJvdGhlcktleVN0cmluZyIsInRoaXNBcnJheVN0cmluZyIsIm90aGVyQXJyYXlTdHJpbmciLCJ0aGlzQXJyYXkiLCJvdGhlckFycmF5IiwibmV3Q2hpbGQiLCJuZXdQYXJlbnQiLCIkZXh0cmFzIiwiZXh0cmEiLCJ0aGlzSWR4IiwiZmluZEluZGV4IiwiaXRlbSIsIm90aGVySWR4IiwidGhpc1RhcmdldCIsIm90aGVyVGFyZ2V0IiwicmVzIiwidHlwZU5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0lBQVlBLFE7O0FBQ1o7Ozs7QUFFQTs7Ozs7Ozs7Ozs7Ozs7QUFFQSxTQUFTQyxVQUFULENBQW9CQyxDQUFwQixFQUF1QjtBQUNyQixTQUFTLE9BQU9BLENBQVAsS0FBYSxRQUFkLElBQTRCLENBQUNDLE1BQU1ELENBQU4sQ0FBN0IsSUFBMkNBLE1BQU1FLFFBQVAsR0FBb0JGLE1BQU0sQ0FBQ0UsUUFBN0U7QUFDRDs7QUFFRCxTQUFTQyxTQUFULENBQW1CQyxLQUFuQixFQUEwQkMsR0FBMUIsRUFBK0JDLFNBQS9CLEVBQTBDQyxLQUExQyxFQUFpREMsR0FBakQsRUFBc0Q7QUFDcEQsU0FBT1YsU0FBU1csT0FBVCxHQUNOQyxJQURNLENBQ0QsWUFBTTtBQUNWLFFBQUlGLE1BQU0sQ0FBVixFQUFhO0FBQ1hKLFlBQU1PLElBQU4sQ0FBV04sR0FBWDtBQUNBLGFBQU9FLE1BQU1LLElBQU4sQ0FBV04sU0FBWCxFQUFzQk8sS0FBS0MsU0FBTCxDQUFlVixLQUFmLENBQXRCLENBQVA7QUFDRCxLQUhELE1BR087QUFDTCxh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Q0FBdUQ7QUFBQSxpQkFBTXVHLEdBQU47QUFBQSxTQUF2RCxDQUFUO0FBQUEsT0FmQyxDQUFQO0FBZ0JEOzs7OEJBRVNDLFEsRUFBVWhGLEUsRUFBSXFELFksRUFBYztBQUNwQyxhQUFVMkIsUUFBVixVQUFzQjNCLHdCQUFzQkEsWUFBdEIsR0FBdUMsWUFBN0QsVUFBNkVyRCxFQUE3RTtBQUNEIiwiZmlsZSI6InN0b3JhZ2Uva2V5VmFsdWVTdG9yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBtZXJnZU9wdGlvbnMgZnJvbSAnbWVyZ2Utb3B0aW9ucyc7XG5cbmltcG9ydCB7IFN0b3JhZ2UgfSBmcm9tICcuL3N0b3JhZ2UnO1xuXG5mdW5jdGlvbiBzYW5lTnVtYmVyKGkpIHtcbiAgcmV0dXJuICgodHlwZW9mIGkgPT09ICdudW1iZXInKSAmJiAoIWlzTmFOKGkpKSAmJiAoaSAhPT0gSW5maW5pdHkpICYgKGkgIT09IC1JbmZpbml0eSkpO1xufVxuXG5mdW5jdGlvbiBtYXliZVB1c2goYXJyYXksIHZhbCwga2V5c3RyaW5nLCBzdG9yZSwgaWR4KSB7XG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgLnRoZW4oKCkgPT4ge1xuICAgIGlmIChpZHggPCAwKSB7XG4gICAgICBhcnJheS5wdXNoKHZhbCk7XG4gICAgICByZXR1cm4gc3RvcmUuX3NldChrZXlzdHJpbmcsIEpTT04uc3RyaW5naWZ5KGFycmF5KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSk7XG59XG5cblxuZnVuY3Rpb24gbWF5YmVVcGRhdGUoYXJyYXksIHZhbCwga2V5c3RyaW5nLCBzdG9yZSwgZXh0cmFzLCBpZHgpIHtcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAudGhlbigoKSA9PiB7XG4gICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICBjb25zdCBtb2RpZmllZFJlbGF0aW9uc2hpcCA9IG1lcmdlT3B0aW9ucyhcbiAgICAgICAge30sXG4gICAgICAgIGFycmF5W2lkeF0sXG4gICAgICAgIGV4dHJhcyA/IHsgbWV0YTogZXh0cmFzIH0gOiB7fVxuICAgICAgKTtcbiAgICAgIGFycmF5W2lkeF0gPSBtb2RpZmllZFJlbGF0aW9uc2hpcDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgcmV0dXJuIHN0b3JlLl9zZXQoa2V5c3RyaW5nLCBKU09OLnN0cmluZ2lmeShhcnJheSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBtYXliZURlbGV0ZShhcnJheSwgaWR4LCBrZXlzdHJpbmcsIHN0b3JlKSB7XG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgLnRoZW4oKCkgPT4ge1xuICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgYXJyYXkuc3BsaWNlKGlkeCwgMSk7XG4gICAgICByZXR1cm4gc3RvcmUuX3NldChrZXlzdHJpbmcsIEpTT04uc3RyaW5naWZ5KGFycmF5KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGFwcGx5RGVsdGEoYmFzZSwgZGVsdGEpIHtcbiAgaWYgKGRlbHRhLm9wID09PSAnYWRkJyB8fCBkZWx0YS5vcCA9PT0gJ21vZGlmeScpIHtcbiAgICBjb25zdCByZXRWYWwgPSBtZXJnZU9wdGlvbnMoe30sIGJhc2UsIGRlbHRhLmRhdGEpO1xuICAgIHJldHVybiByZXRWYWw7XG4gIH0gZWxzZSBpZiAoZGVsdGEub3AgPT09ICdyZW1vdmUnKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNvbHZlUmVsYXRpb25zaGlwKGRlbHRhcywgbWF5YmVCYXNlKSB7XG4gIGNvbnN0IGJhc2UgPSBtYXliZUJhc2UgfHwgW107XG4gIC8vIEluZGV4IGN1cnJlbnQgcmVsYXRpb25zaGlwcyBieSBJRCBmb3IgZWZmaWNpZW50IG1vZGlmaWNhdGlvblxuICBjb25zdCB1cGRhdGVzID0gYmFzZS5tYXAocmVsID0+IHtcbiAgICByZXR1cm4geyBbcmVsLmlkXTogcmVsIH07XG4gIH0pLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBtZXJnZU9wdGlvbnMoYWNjLCBjdXJyKSwge30pO1xuXG4gIC8vIEFwcGx5IGFueSBkZWx0YXMgaW4gZGlydHkgY2FjaGUgb24gdG9wIG9mIHVwZGF0ZXNcbiAgZGVsdGFzLmZvckVhY2goZGVsdGEgPT4ge1xuICAgIGNvbnN0IGNoaWxkSWQgPSBkZWx0YS5kYXRhLmlkO1xuICAgIHVwZGF0ZXNbY2hpbGRJZF0gPSBhcHBseURlbHRhKHVwZGF0ZXNbY2hpbGRJZF0sIGRlbHRhKTtcbiAgfSk7XG5cbiAgLy8gQ29sbGFwc2UgdXBkYXRlcyBiYWNrIGludG8gbGlzdCwgb21pdHRpbmcgdW5kZWZpbmVkc1xuICByZXR1cm4gT2JqZWN0LmtleXModXBkYXRlcylcbiAgICAubWFwKGlkID0+IHVwZGF0ZXNbaWRdKVxuICAgIC5maWx0ZXIocmVsID0+IHJlbCAhPT0gdW5kZWZpbmVkKVxuICAgIC5yZWR1Y2UoKGFjYywgY3VycikgPT4gYWNjLmNvbmNhdChjdXJyKSwgW10pO1xufVxuXG4vLyBUT0RPXG5mdW5jdGlvbiByZXNvbHZlUmVsYXRpb25zaGlwcyhzY2hlbWEsIGRlbHRhcywgYmFzZSA9IHt9KSB7XG4gIGNvbnN0IHVwZGF0ZXMgPSB7fTtcbiAgZm9yIChjb25zdCByZWxOYW1lIGluIGRlbHRhcykge1xuICAgIGlmIChyZWxOYW1lIGluIHNjaGVtYS5yZWxhdGlvbnNoaXBzKSB7XG4gICAgICB1cGRhdGVzW3JlbE5hbWVdID0gcmVzb2x2ZVJlbGF0aW9uc2hpcChkZWx0YXNbcmVsTmFtZV0sIGJhc2VbcmVsTmFtZV0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbWVyZ2VPcHRpb25zKHt9LCBiYXNlLCB1cGRhdGVzKTtcbn1cblxuXG5leHBvcnQgY2xhc3MgS2V5VmFsdWVTdG9yZSBleHRlbmRzIFN0b3JhZ2Uge1xuICAkJG1heEtleSh0KSB7XG4gICAgcmV0dXJuIHRoaXMuX2tleXModClcbiAgICAudGhlbigoa2V5QXJyYXkpID0+IHtcbiAgICAgIGlmIChrZXlBcnJheS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ga2V5QXJyYXkubWFwKChrKSA9PiBrLnNwbGl0KCc6JylbMl0pXG4gICAgICAgIC5tYXAoKGspID0+IHBhcnNlSW50KGssIDEwKSlcbiAgICAgICAgLmZpbHRlcigoaSkgPT4gc2FuZU51bWJlcihpKSlcbiAgICAgICAgLnJlZHVjZSgobWF4LCBjdXJyZW50KSA9PiAoY3VycmVudCA+IG1heCkgPyBjdXJyZW50IDogbWF4LCAwKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHdyaXRlKHQsIHYpIHtcbiAgICBjb25zdCBpZCA9IHYuaWQgfHwgdlt0LiRzY2hlbWEuJGlkXTtcbiAgICBpZiAoKGlkID09PSB1bmRlZmluZWQpIHx8IChpZCA9PT0gbnVsbCkpIHtcbiAgICAgIHJldHVybiB0aGlzLmNyZWF0ZU5ldyh0LCB2KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMub3ZlcndyaXRlKHQsIGlkLCB2KTtcbiAgICB9XG4gIH1cblxuICBjcmVhdGVOZXcodCwgdikge1xuICAgIGNvbnN0IHRvU2F2ZSA9IG1lcmdlT3B0aW9ucyh7fSwgdik7XG4gICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgIHJldHVybiB0aGlzLiQkbWF4S2V5KHQuJG5hbWUpXG4gICAgICAudGhlbigobikgPT4ge1xuICAgICAgICBjb25zdCBpZCA9IG4gKyAxO1xuICAgICAgICB0b1NhdmUuaWQgPSBpZDtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgICAgdGhpcy53cml0ZUF0dHJpYnV0ZXModCwgaWQsIHRvU2F2ZS5hdHRyaWJ1dGVzKSxcbiAgICAgICAgICB0aGlzLndyaXRlUmVsYXRpb25zaGlwcyh0LCBpZCwgdG9TYXZlLnJlbGF0aW9uc2hpcHMpLFxuICAgICAgICBdKS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5ub3RpZnlVcGRhdGUodCwgdG9TYXZlW3QuJGlkXSwge1xuICAgICAgICAgICAgW3QuJHNjaGVtYS4kaWRdOiBpZCxcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHRvU2F2ZS5hdHRyaWJ1dGVzLFxuICAgICAgICAgICAgcmVsYXRpb25zaGlwczogcmVzb2x2ZVJlbGF0aW9uc2hpcHModC4kc2NoZW1hLCB0b1NhdmUucmVsYXRpb25zaGlwcyksXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKCgpID0+IHRvU2F2ZSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIG5ldyBjb250ZW50IGluIGEgbm9uLXRlcm1pbmFsIHN0b3JlJyk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcndyaXRlKHQsIGlkLCB2KSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpKSxcbiAgICAgIHRoaXMucmVhZFJlbGF0aW9uc2hpcHModCwgaWQsIE9iamVjdC5rZXlzKHYucmVsYXRpb25zaGlwcykpLFxuICAgIF0pLnRoZW4oKFtvcmlnQXR0cmlidXRlcywgb3JpZ1JlbGF0aW9uc2hpcHNdKSA9PiB7XG4gICAgICBjb25zdCB1cGRhdGVkQXR0cmlidXRlcyA9IE9iamVjdC5hc3NpZ24oe30sIEpTT04ucGFyc2Uob3JpZ0F0dHJpYnV0ZXMpLCB2LmF0dHJpYnV0ZXMpO1xuICAgICAgY29uc3QgdXBkYXRlZFJlbGF0aW9uc2hpcHMgPSByZXNvbHZlUmVsYXRpb25zaGlwcyh0LiRzY2hlbWEsIHYucmVsYXRpb25zaGlwcywgb3JpZ1JlbGF0aW9uc2hpcHMpO1xuICAgICAgY29uc3QgdXBkYXRlZCA9IHsgaWQsIGF0dHJpYnV0ZXM6IHVwZGF0ZWRBdHRyaWJ1dGVzLCByZWxhdGlvbnNoaXBzOiB1cGRhdGVkUmVsYXRpb25zaGlwcyB9O1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIHRoaXMud3JpdGVBdHRyaWJ1dGVzKHQsIGlkLCB1cGRhdGVkQXR0cmlidXRlcyksXG4gICAgICAgIHRoaXMud3JpdGVSZWxhdGlvbnNoaXBzKHQsIGlkLCB1cGRhdGVkUmVsYXRpb25zaGlwcyksXG4gICAgICBdKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5ub3RpZnlVcGRhdGUodCwgaWQsIHVwZGF0ZWQpO1xuICAgICAgfSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHVwZGF0ZWQ7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHdyaXRlQXR0cmlidXRlcyh0LCBpZCwgYXR0cmlidXRlcykge1xuICAgIGNvbnN0ICRpZCA9IGF0dHJpYnV0ZXMuaWQgPyAnaWQnIDogdC4kc2NoZW1hLiRpZDtcbiAgICBjb25zdCB0b1dyaXRlID0gbWVyZ2VPcHRpb25zKHt9LCBhdHRyaWJ1dGVzLCB7IFskaWRdOiBpZCB9KTtcbiAgICByZXR1cm4gdGhpcy5fc2V0KHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkKSwgSlNPTi5zdHJpbmdpZnkodG9Xcml0ZSkpO1xuICB9XG5cbiAgd3JpdGVSZWxhdGlvbnNoaXBzKHQsIGlkLCByZWxhdGlvbnNoaXBzKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHJlbGF0aW9uc2hpcHMpLm1hcChyZWxOYW1lID0+IHtcbiAgICAgIHJldHVybiB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQsIHJlbE5hbWUpLCBKU09OLnN0cmluZ2lmeShyZWxhdGlvbnNoaXBzW3JlbE5hbWVdKSk7XG4gICAgfSkucmVkdWNlKCh0aGVuYWJsZSwgY3VycikgPT4gdGhlbmFibGUudGhlbigoKSA9PiBjdXJyKSwgQmx1ZWJpcmQucmVzb2x2ZSgpKTtcbiAgfVxuXG4gIHJlYWRBdHRyaWJ1dGVzKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCkpXG4gICAgLnRoZW4oKGQpID0+IEpTT04ucGFyc2UoZCkpO1xuICB9XG5cbiAgcmVhZFJlbGF0aW9uc2hpcCh0LCBpZCwgcmVsYXRpb25zaGlwKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCwgcmVsYXRpb25zaGlwKSlcbiAgICAudGhlbigoYXJyYXlTdHJpbmcpID0+IHtcbiAgICAgIHJldHVybiB7IFtyZWxhdGlvbnNoaXBdOiBKU09OLnBhcnNlKGFycmF5U3RyaW5nKSB8fCBbXSB9O1xuICAgIH0pO1xuICB9XG5cbiAgZGVsZXRlKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RlbCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCkpO1xuICB9XG5cbiAgd2lwZSh0LCBpZCwgZmllbGQpIHtcbiAgICBpZiAoZmllbGQgPT09ICdhdHRyaWJ1dGVzJykge1xuICAgICAgcmV0dXJuIHRoaXMuX2RlbCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5fZGVsKHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkLCBmaWVsZCkpO1xuICAgIH1cbiAgfVxuXG4gIGFkZCh0eXBlLCBpZCwgcmVsTmFtZSwgY2hpbGRJZCwgZXh0cmFzID0ge30pIHtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBCbG9jayA9IHR5cGUuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnR5cGU7XG4gICAgY29uc3QgdGhpc1R5cGUgPSB0eXBlLiRuYW1lO1xuICAgIGNvbnN0IG90aGVyVHlwZSA9IHJlbGF0aW9uc2hpcEJsb2NrLiRzaWRlc1tyZWxOYW1lXS5vdGhlclR5cGU7XG4gICAgY29uc3Qgb3RoZXJOYW1lID0gcmVsYXRpb25zaGlwQmxvY2suJHNpZGVzW3JlbE5hbWVdLm90aGVyTmFtZTtcbiAgICBjb25zdCB0aGlzS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcodGhpc1R5cGUsIGlkLCByZWxOYW1lKTtcbiAgICBjb25zdCBvdGhlcktleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKG90aGVyVHlwZSwgY2hpbGRJZCwgb3RoZXJOYW1lKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgIHRoaXMuX2dldCh0aGlzS2V5U3RyaW5nKSxcbiAgICAgIHRoaXMuX2dldChvdGhlcktleVN0cmluZyksXG4gICAgXSlcbiAgICAudGhlbigoW3RoaXNBcnJheVN0cmluZywgb3RoZXJBcnJheVN0cmluZ10pID0+IHtcbiAgICAgIGNvbnN0IHRoaXNBcnJheSA9IEpTT04ucGFyc2UodGhpc0FycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IG90aGVyQXJyYXkgPSBKU09OLnBhcnNlKG90aGVyQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3QgbmV3Q2hpbGQgPSB7IGlkOiBjaGlsZElkIH07XG4gICAgICBjb25zdCBuZXdQYXJlbnQgPSB7IGlkIH07XG4gICAgICBpZiAocmVsYXRpb25zaGlwQmxvY2suJGV4dHJhcykge1xuICAgICAgICBuZXdDaGlsZC5tZXRhID0gbmV3Q2hpbGQubWV0YSB8fCB7fTtcbiAgICAgICAgbmV3UGFyZW50Lm1ldGEgPSBuZXdQYXJlbnQubWV0YSB8fCB7fTtcbiAgICAgICAgZm9yIChjb25zdCBleHRyYSBpbiBleHRyYXMpIHtcbiAgICAgICAgICBpZiAoZXh0cmEgaW4gcmVsYXRpb25zaGlwQmxvY2suJGV4dHJhcykge1xuICAgICAgICAgICAgbmV3Q2hpbGQubWV0YVtleHRyYV0gPSBleHRyYXNbZXh0cmFdO1xuICAgICAgICAgICAgbmV3UGFyZW50Lm1ldGFbZXh0cmFdID0gZXh0cmFzW2V4dHJhXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IHRoaXNJZHggPSB0aGlzQXJyYXkuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gY2hpbGRJZCk7XG4gICAgICBjb25zdCBvdGhlcklkeCA9IG90aGVyQXJyYXkuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gaWQpO1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIG1heWJlUHVzaCh0aGlzQXJyYXksIG5ld0NoaWxkLCB0aGlzS2V5U3RyaW5nLCB0aGlzLCB0aGlzSWR4KSxcbiAgICAgICAgbWF5YmVQdXNoKG90aGVyQXJyYXksIG5ld1BhcmVudCwgb3RoZXJLZXlTdHJpbmcsIHRoaXMsIG90aGVySWR4KSxcbiAgICAgIF0pXG4gICAgICAudGhlbigoKSA9PiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBpZCwgbnVsbCwgcmVsTmFtZSkpXG4gICAgICAudGhlbigoKSA9PiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBjaGlsZElkLCBudWxsLCBvdGhlck5hbWUpKVxuICAgICAgLnRoZW4oKCkgPT4gdGhpc0FycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIG1vZGlmeVJlbGF0aW9uc2hpcCh0eXBlLCBpZCwgcmVsTmFtZSwgY2hpbGRJZCwgZXh0cmFzKSB7XG4gICAgY29uc3QgcmVsYXRpb25zaGlwQmxvY2sgPSB0eXBlLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxOYW1lXS50eXBlO1xuICAgIGNvbnN0IHRoaXNUeXBlID0gdHlwZS4kbmFtZTtcbiAgICBjb25zdCBvdGhlclR5cGUgPSByZWxhdGlvbnNoaXBCbG9jay4kc2lkZXNbcmVsTmFtZV0ub3RoZXJUeXBlO1xuICAgIGNvbnN0IG90aGVyTmFtZSA9IHJlbGF0aW9uc2hpcEJsb2NrLiRzaWRlc1tyZWxOYW1lXS5vdGhlck5hbWU7XG4gICAgY29uc3QgdGhpc0tleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHRoaXNUeXBlLCBpZCwgcmVsTmFtZSk7XG4gICAgY29uc3Qgb3RoZXJLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyhvdGhlclR5cGUsIGNoaWxkSWQsIG90aGVyTmFtZSk7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICB0aGlzLl9nZXQodGhpc0tleVN0cmluZyksXG4gICAgICB0aGlzLl9nZXQob3RoZXJLZXlTdHJpbmcpLFxuICAgIF0pXG4gICAgLnRoZW4oKFt0aGlzQXJyYXlTdHJpbmcsIG90aGVyQXJyYXlTdHJpbmddKSA9PiB7XG4gICAgICBjb25zdCB0aGlzQXJyYXkgPSBKU09OLnBhcnNlKHRoaXNBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCBvdGhlckFycmF5ID0gSlNPTi5wYXJzZShvdGhlckFycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IHRoaXNUYXJnZXQgPSB7IGlkOiBjaGlsZElkIH07XG4gICAgICBjb25zdCBvdGhlclRhcmdldCA9IHsgaWQgfTtcbiAgICAgIGNvbnN0IHRoaXNJZHggPSB0aGlzQXJyYXkuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gY2hpbGRJZCk7XG4gICAgICBjb25zdCBvdGhlcklkeCA9IG90aGVyQXJyYXkuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gaWQpO1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIG1heWJlVXBkYXRlKHRoaXNBcnJheSwgdGhpc1RhcmdldCwgdGhpc0tleVN0cmluZywgdGhpcywgZXh0cmFzLCB0aGlzSWR4KSxcbiAgICAgICAgbWF5YmVVcGRhdGUob3RoZXJBcnJheSwgb3RoZXJUYXJnZXQsIG90aGVyS2V5U3RyaW5nLCB0aGlzLCBleHRyYXMsIG90aGVySWR4KSxcbiAgICAgIF0pO1xuICAgIH0pXG4gICAgLnRoZW4oKHJlcykgPT4gdGhpcy5ub3RpZnlVcGRhdGUodHlwZSwgaWQsIG51bGwsIHJlbE5hbWUpLnRoZW4oKCkgPT4gcmVzKSlcbiAgICAudGhlbigocmVzKSA9PiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBjaGlsZElkLCBudWxsLCBvdGhlck5hbWUpLnRoZW4oKCkgPT4gcmVzKSk7XG4gIH1cblxuICByZW1vdmUodHlwZSwgaWQsIHJlbE5hbWUsIGNoaWxkSWQpIHtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBCbG9jayA9IHR5cGUuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnR5cGU7XG4gICAgY29uc3QgdGhpc1R5cGUgPSB0eXBlLiRuYW1lO1xuICAgIGNvbnN0IG90aGVyVHlwZSA9IHJlbGF0aW9uc2hpcEJsb2NrLiRzaWRlc1tyZWxOYW1lXS5vdGhlclR5cGU7XG4gICAgY29uc3Qgb3RoZXJOYW1lID0gcmVsYXRpb25zaGlwQmxvY2suJHNpZGVzW3JlbE5hbWVdLm90aGVyTmFtZTtcbiAgICBjb25zdCB0aGlzS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcodGhpc1R5cGUsIGlkLCByZWxOYW1lKTtcbiAgICBjb25zdCBvdGhlcktleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKG90aGVyVHlwZSwgY2hpbGRJZCwgb3RoZXJOYW1lKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgIHRoaXMuX2dldCh0aGlzS2V5U3RyaW5nKSxcbiAgICAgIHRoaXMuX2dldChvdGhlcktleVN0cmluZyksXG4gICAgXSlcbiAgICAudGhlbigoW3RoaXNBcnJheVN0cmluZywgb3RoZXJBcnJheVN0cmluZ10pID0+IHtcbiAgICAgIGNvbnN0IHRoaXNBcnJheSA9IEpTT04ucGFyc2UodGhpc0FycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IG90aGVyQXJyYXkgPSBKU09OLnBhcnNlKG90aGVyQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3QgdGhpc0lkeCA9IHRoaXNBcnJheS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSBjaGlsZElkKTtcbiAgICAgIGNvbnN0IG90aGVySWR4ID0gb3RoZXJBcnJheS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSBpZCk7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgbWF5YmVEZWxldGUodGhpc0FycmF5LCB0aGlzSWR4LCB0aGlzS2V5U3RyaW5nLCB0aGlzKSxcbiAgICAgICAgbWF5YmVEZWxldGUob3RoZXJBcnJheSwgb3RoZXJJZHgsIG90aGVyS2V5U3RyaW5nLCB0aGlzKSxcbiAgICAgIF0pO1xuICAgIH0pXG4gICAgLnRoZW4oKHJlcykgPT4gdGhpcy5ub3RpZnlVcGRhdGUodHlwZSwgaWQsIG51bGwsIHJlbE5hbWUpLnRoZW4oKCkgPT4gcmVzKSlcbiAgICAudGhlbigocmVzKSA9PiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBjaGlsZElkLCBudWxsLCBvdGhlck5hbWUpLnRoZW4oKCkgPT4gcmVzKSk7XG4gIH1cblxuICBrZXlTdHJpbmcodHlwZU5hbWUsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgICByZXR1cm4gYCR7dHlwZU5hbWV9OiR7cmVsYXRpb25zaGlwID8gYHJlbC4ke3JlbGF0aW9uc2hpcH1gIDogJ2F0dHJpYnV0ZXMnfToke2lkfWA7XG4gIH1cbn1cbiJdfQ==
