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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uva2V5VmFsdWVTdG9yZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsInNhbmVOdW1iZXIiLCJpIiwiaXNOYU4iLCJJbmZpbml0eSIsIm1heWJlUHVzaCIsImFycmF5IiwidmFsIiwia2V5c3RyaW5nIiwic3RvcmUiLCJpZHgiLCJyZXNvbHZlIiwidGhlbiIsInB1c2giLCJfc2V0IiwiSlNPTiIsInN0cmluZ2lmeSIsIm1heWJlVXBkYXRlIiwiZXh0cmFzIiwibW9kaWZpZWRSZWxhdGlvbnNoaXAiLCJtZXRhIiwibWF5YmVEZWxldGUiLCJzcGxpY2UiLCJhcHBseURlbHRhIiwiYmFzZSIsImRlbHRhIiwib3AiLCJyZXRWYWwiLCJkYXRhIiwidW5kZWZpbmVkIiwicmVzb2x2ZVJlbGF0aW9uc2hpcCIsImRlbHRhcyIsIm1heWJlQmFzZSIsInVwZGF0ZXMiLCJtYXAiLCJyZWwiLCJpZCIsInJlZHVjZSIsImFjYyIsImN1cnIiLCJmb3JFYWNoIiwiY2hpbGRJZCIsIk9iamVjdCIsImtleXMiLCJmaWx0ZXIiLCJjb25jYXQiLCJyZXNvbHZlUmVsYXRpb25zaGlwcyIsInNjaGVtYSIsInJlbE5hbWUiLCJyZWxhdGlvbnNoaXBzIiwiS2V5VmFsdWVTdG9yZSIsInQiLCJfa2V5cyIsImtleUFycmF5IiwibGVuZ3RoIiwiayIsInNwbGl0IiwicGFyc2VJbnQiLCJtYXgiLCJjdXJyZW50IiwidiIsIiRzY2hlbWEiLCIkaWQiLCJjcmVhdGVOZXciLCJvdmVyd3JpdGUiLCJ0b1NhdmUiLCJ0ZXJtaW5hbCIsIiQkbWF4S2V5IiwiJG5hbWUiLCJuIiwiYWxsIiwid3JpdGVBdHRyaWJ1dGVzIiwiYXR0cmlidXRlcyIsIndyaXRlUmVsYXRpb25zaGlwcyIsIm5vdGlmeVVwZGF0ZSIsIkVycm9yIiwiX2dldCIsImtleVN0cmluZyIsInJlYWRSZWxhdGlvbnNoaXBzIiwib3JpZ0F0dHJpYnV0ZXMiLCJvcmlnUmVsYXRpb25zaGlwcyIsInVwZGF0ZWRBdHRyaWJ1dGVzIiwiYXNzaWduIiwicGFyc2UiLCJ1cGRhdGVkUmVsYXRpb25zaGlwcyIsInVwZGF0ZWQiLCJ0b1dyaXRlIiwidGhlbmFibGUiLCJkIiwicmVsYXRpb25zaGlwIiwiYXJyYXlTdHJpbmciLCJfZGVsIiwiZmllbGQiLCJ0eXBlIiwicmVsYXRpb25zaGlwQmxvY2siLCJ0aGlzVHlwZSIsIm90aGVyVHlwZSIsIiRzaWRlcyIsIm90aGVyTmFtZSIsInRoaXNLZXlTdHJpbmciLCJvdGhlcktleVN0cmluZyIsInRoaXNBcnJheVN0cmluZyIsIm90aGVyQXJyYXlTdHJpbmciLCJ0aGlzQXJyYXkiLCJvdGhlckFycmF5IiwibmV3Q2hpbGQiLCJuZXdQYXJlbnQiLCIkZXh0cmFzIiwiZXh0cmEiLCJ0aGlzSWR4IiwiZmluZEluZGV4IiwiaXRlbSIsIm90aGVySWR4IiwidGhpc1RhcmdldCIsIm90aGVyVGFyZ2V0IiwicmVzIiwidHlwZU5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0lBQVlBLFE7O0FBQ1o7Ozs7QUFFQTs7Ozs7Ozs7Ozs7Ozs7QUFFQSxTQUFTQyxVQUFULENBQW9CQyxDQUFwQixFQUF1QjtBQUNyQixTQUFTLE9BQU9BLENBQVAsS0FBYSxRQUFkLElBQTRCLENBQUNDLE1BQU1ELENBQU4sQ0FBN0IsSUFBMkNBLE1BQU1FLFFBQVAsR0FBb0JGLE1BQU0sQ0FBQ0UsUUFBN0U7QUFDRDs7QUFFRCxTQUFTQyxTQUFULENBQW1CQyxLQUFuQixFQUEwQkMsR0FBMUIsRUFBK0JDLFNBQS9CLEVBQTBDQyxLQUExQyxFQUFpREMsR0FBakQsRUFBc0Q7QUFDcEQsU0FBT1YsU0FBU1csT0FBVCxHQUNOQyxJQURNLENBQ0QsWUFBTTtBQUNWLFFBQUlGLE1BQU0sQ0FBVixFQUFhO0FBQ1hKLFlBQU1PLElBQU4sQ0FBV04sR0FBWDtBQUNBLGFBQU9FLE1BQU1LLElBQU4sQ0FBV04sU0FBWCxFQUFzQk8sS0FBS0MsU0FBTCxDQUFlVixLQUFmLENBQXRCLENBQVA7QUFDRCxLQUhELE1BR087QUFDTCxh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QUFNdUcsR0FBTjtBQUFBLFNBQXZELENBQVQ7QUFBQSxPQWZDLENBQVA7QUFnQkQ7Ozs4QkFFU0MsUSxFQUFVaEYsRSxFQUFJcUQsWSxFQUFjO0FBQ3BDLGFBQVUyQixRQUFWLFVBQXNCM0Isd0JBQXNCQSxZQUF0QixHQUF1QyxZQUE3RCxVQUE2RXJELEVBQTdFO0FBQ0QiLCJmaWxlIjoic3RvcmFnZS9rZXlWYWx1ZVN0b3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcblxuaW1wb3J0IHsgU3RvcmFnZSB9IGZyb20gJy4vc3RvcmFnZSc7XG5cbmZ1bmN0aW9uIHNhbmVOdW1iZXIoaSkge1xuICByZXR1cm4gKCh0eXBlb2YgaSA9PT0gJ251bWJlcicpICYmICghaXNOYU4oaSkpICYmIChpICE9PSBJbmZpbml0eSkgJiAoaSAhPT0gLUluZmluaXR5KSk7XG59XG5cbmZ1bmN0aW9uIG1heWJlUHVzaChhcnJheSwgdmFsLCBrZXlzdHJpbmcsIHN0b3JlLCBpZHgpIHtcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAudGhlbigoKSA9PiB7XG4gICAgaWYgKGlkeCA8IDApIHtcbiAgICAgIGFycmF5LnB1c2godmFsKTtcbiAgICAgIHJldHVybiBzdG9yZS5fc2V0KGtleXN0cmluZywgSlNPTi5zdHJpbmdpZnkoYXJyYXkpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9KTtcbn1cblxuXG5mdW5jdGlvbiBtYXliZVVwZGF0ZShhcnJheSwgdmFsLCBrZXlzdHJpbmcsIHN0b3JlLCBleHRyYXMsIGlkeCkge1xuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gIC50aGVuKCgpID0+IHtcbiAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgIGNvbnN0IG1vZGlmaWVkUmVsYXRpb25zaGlwID0gbWVyZ2VPcHRpb25zKFxuICAgICAgICB7fSxcbiAgICAgICAgYXJyYXlbaWR4XSxcbiAgICAgICAgZXh0cmFzID8geyBtZXRhOiBleHRyYXMgfSA6IHt9XG4gICAgICApO1xuICAgICAgYXJyYXlbaWR4XSA9IG1vZGlmaWVkUmVsYXRpb25zaGlwOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICByZXR1cm4gc3RvcmUuX3NldChrZXlzdHJpbmcsIEpTT04uc3RyaW5naWZ5KGFycmF5KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG1heWJlRGVsZXRlKGFycmF5LCBpZHgsIGtleXN0cmluZywgc3RvcmUpIHtcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAudGhlbigoKSA9PiB7XG4gICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICBhcnJheS5zcGxpY2UoaWR4LCAxKTtcbiAgICAgIHJldHVybiBzdG9yZS5fc2V0KGtleXN0cmluZywgSlNPTi5zdHJpbmdpZnkoYXJyYXkpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gYXBwbHlEZWx0YShiYXNlLCBkZWx0YSkge1xuICBpZiAoZGVsdGEub3AgPT09ICdhZGQnIHx8IGRlbHRhLm9wID09PSAnbW9kaWZ5Jykge1xuICAgIGNvbnN0IHJldFZhbCA9IG1lcmdlT3B0aW9ucyh7fSwgYmFzZSwgZGVsdGEuZGF0YSk7XG4gICAgcmV0dXJuIHJldFZhbDtcbiAgfSBlbHNlIGlmIChkZWx0YS5vcCA9PT0gJ3JlbW92ZScpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVSZWxhdGlvbnNoaXAoZGVsdGFzLCBtYXliZUJhc2UpIHtcbiAgY29uc3QgYmFzZSA9IG1heWJlQmFzZSB8fCBbXTtcbiAgLy8gSW5kZXggY3VycmVudCByZWxhdGlvbnNoaXBzIGJ5IElEIGZvciBlZmZpY2llbnQgbW9kaWZpY2F0aW9uXG4gIGNvbnN0IHVwZGF0ZXMgPSBiYXNlLm1hcChyZWwgPT4ge1xuICAgIHJldHVybiB7IFtyZWwuaWRdOiByZWwgfTtcbiAgfSkucmVkdWNlKChhY2MsIGN1cnIpID0+IG1lcmdlT3B0aW9ucyhhY2MsIGN1cnIpLCB7fSk7XG5cbiAgLy8gQXBwbHkgYW55IGRlbHRhcyBpbiBkaXJ0eSBjYWNoZSBvbiB0b3Agb2YgdXBkYXRlc1xuICBkZWx0YXMuZm9yRWFjaChkZWx0YSA9PiB7XG4gICAgY29uc3QgY2hpbGRJZCA9IGRlbHRhLmRhdGEuaWQ7XG4gICAgdXBkYXRlc1tjaGlsZElkXSA9IGFwcGx5RGVsdGEodXBkYXRlc1tjaGlsZElkXSwgZGVsdGEpO1xuICB9KTtcblxuICAvLyBDb2xsYXBzZSB1cGRhdGVzIGJhY2sgaW50byBsaXN0LCBvbWl0dGluZyB1bmRlZmluZWRzXG4gIHJldHVybiBPYmplY3Qua2V5cyh1cGRhdGVzKVxuICAgIC5tYXAoaWQgPT4gdXBkYXRlc1tpZF0pXG4gICAgLmZpbHRlcihyZWwgPT4gcmVsICE9PSB1bmRlZmluZWQpXG4gICAgLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBhY2MuY29uY2F0KGN1cnIpLCBbXSk7XG59XG5cbi8vIFRPRE9cbmZ1bmN0aW9uIHJlc29sdmVSZWxhdGlvbnNoaXBzKHNjaGVtYSwgZGVsdGFzLCBiYXNlID0ge30pIHtcbiAgY29uc3QgdXBkYXRlcyA9IHt9O1xuICBmb3IgKGNvbnN0IHJlbE5hbWUgaW4gZGVsdGFzKSB7XG4gICAgaWYgKHJlbE5hbWUgaW4gc2NoZW1hLnJlbGF0aW9uc2hpcHMpIHtcbiAgICAgIHVwZGF0ZXNbcmVsTmFtZV0gPSByZXNvbHZlUmVsYXRpb25zaGlwKGRlbHRhc1tyZWxOYW1lXSwgYmFzZVtyZWxOYW1lXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBtZXJnZU9wdGlvbnMoe30sIGJhc2UsIHVwZGF0ZXMpO1xufVxuXG5cbmV4cG9ydCBjbGFzcyBLZXlWYWx1ZVN0b3JlIGV4dGVuZHMgU3RvcmFnZSB7XG4gICQkbWF4S2V5KHQpIHtcbiAgICByZXR1cm4gdGhpcy5fa2V5cyh0KVxuICAgIC50aGVuKChrZXlBcnJheSkgPT4ge1xuICAgICAgaWYgKGtleUFycmF5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBrZXlBcnJheS5tYXAoKGspID0+IGsuc3BsaXQoJzonKVsyXSlcbiAgICAgICAgLm1hcCgoaykgPT4gcGFyc2VJbnQoaywgMTApKVxuICAgICAgICAuZmlsdGVyKChpKSA9PiBzYW5lTnVtYmVyKGkpKVxuICAgICAgICAucmVkdWNlKChtYXgsIGN1cnJlbnQpID0+IChjdXJyZW50ID4gbWF4KSA/IGN1cnJlbnQgOiBtYXgsIDApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgd3JpdGUodCwgdikge1xuICAgIGNvbnN0IGlkID0gdi5pZCB8fCB2W3QuJHNjaGVtYS4kaWRdO1xuICAgIGlmICgoaWQgPT09IHVuZGVmaW5lZCkgfHwgKGlkID09PSBudWxsKSkge1xuICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlTmV3KHQsIHYpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5vdmVyd3JpdGUodCwgaWQsIHYpO1xuICAgIH1cbiAgfVxuXG4gIGNyZWF0ZU5ldyh0LCB2KSB7XG4gICAgY29uc3QgdG9TYXZlID0gbWVyZ2VPcHRpb25zKHt9LCB2KTtcbiAgICBpZiAodGhpcy50ZXJtaW5hbCkge1xuICAgICAgcmV0dXJuIHRoaXMuJCRtYXhLZXkodC4kbmFtZSlcbiAgICAgIC50aGVuKChuKSA9PiB7XG4gICAgICAgIGNvbnN0IGlkID0gbiArIDE7XG4gICAgICAgIHRvU2F2ZS5pZCA9IGlkO1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgICB0aGlzLndyaXRlQXR0cmlidXRlcyh0LCBpZCwgdG9TYXZlLmF0dHJpYnV0ZXMpLFxuICAgICAgICAgIHRoaXMud3JpdGVSZWxhdGlvbnNoaXBzKHQsIGlkLCB0b1NhdmUucmVsYXRpb25zaGlwcyksXG4gICAgICAgIF0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB0aGlzLm5vdGlmeVVwZGF0ZSh0LCB0b1NhdmVbdC4kaWRdLCB7XG4gICAgICAgICAgICBbdC4kc2NoZW1hLiRpZF06IGlkLFxuICAgICAgICAgICAgYXR0cmlidXRlczogdG9TYXZlLmF0dHJpYnV0ZXMsXG4gICAgICAgICAgICByZWxhdGlvbnNoaXBzOiByZXNvbHZlUmVsYXRpb25zaGlwcyh0LiRzY2hlbWEsIHRvU2F2ZS5yZWxhdGlvbnNoaXBzKSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKCkgPT4gdG9TYXZlKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgbmV3IGNvbnRlbnQgaW4gYSBub24tdGVybWluYWwgc3RvcmUnKTtcbiAgICB9XG4gIH1cblxuICBvdmVyd3JpdGUodCwgaWQsIHYpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgIHRoaXMuX2dldCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCkpLFxuICAgICAgdGhpcy5yZWFkUmVsYXRpb25zaGlwcyh0LCBpZCwgT2JqZWN0LmtleXModi5yZWxhdGlvbnNoaXBzKSksXG4gICAgXSkudGhlbigoW29yaWdBdHRyaWJ1dGVzLCBvcmlnUmVsYXRpb25zaGlwc10pID0+IHtcbiAgICAgIGNvbnN0IHVwZGF0ZWRBdHRyaWJ1dGVzID0gT2JqZWN0LmFzc2lnbih7fSwgSlNPTi5wYXJzZShvcmlnQXR0cmlidXRlcyksIHYuYXR0cmlidXRlcyk7XG4gICAgICBjb25zdCB1cGRhdGVkUmVsYXRpb25zaGlwcyA9IHJlc29sdmVSZWxhdGlvbnNoaXBzKHQuJHNjaGVtYSwgdi5yZWxhdGlvbnNoaXBzLCBvcmlnUmVsYXRpb25zaGlwcyk7XG4gICAgICBjb25zdCB1cGRhdGVkID0geyBpZCwgYXR0cmlidXRlczogdXBkYXRlZEF0dHJpYnV0ZXMsIHJlbGF0aW9uc2hpcHM6IHVwZGF0ZWRSZWxhdGlvbnNoaXBzIH07XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgdGhpcy53cml0ZUF0dHJpYnV0ZXModCwgaWQsIHVwZGF0ZWRBdHRyaWJ1dGVzKSxcbiAgICAgICAgdGhpcy53cml0ZVJlbGF0aW9uc2hpcHModCwgaWQsIHVwZGF0ZWRSZWxhdGlvbnNoaXBzKSxcbiAgICAgIF0pXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vdGlmeVVwZGF0ZSh0LCBpZCwgdXBkYXRlZCk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdXBkYXRlZDtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgd3JpdGVBdHRyaWJ1dGVzKHQsIGlkLCBhdHRyaWJ1dGVzKSB7XG4gICAgY29uc3QgJGlkID0gYXR0cmlidXRlcy5pZCA/ICdpZCcgOiB0LiRzY2hlbWEuJGlkO1xuICAgIGNvbnN0IHRvV3JpdGUgPSBtZXJnZU9wdGlvbnMoe30sIGF0dHJpYnV0ZXMsIHsgWyRpZF06IGlkIH0pO1xuICAgIHJldHVybiB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpLCBKU09OLnN0cmluZ2lmeSh0b1dyaXRlKSk7XG4gIH1cblxuICB3cml0ZVJlbGF0aW9uc2hpcHModCwgaWQsIHJlbGF0aW9uc2hpcHMpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMocmVsYXRpb25zaGlwcykubWFwKHJlbE5hbWUgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCwgcmVsTmFtZSksIEpTT04uc3RyaW5naWZ5KHJlbGF0aW9uc2hpcHNbcmVsTmFtZV0pKTtcbiAgICB9KS5yZWR1Y2UoKHRoZW5hYmxlLCBjdXJyKSA9PiB0aGVuYWJsZS50aGVuKCgpID0+IGN1cnIpLCBCbHVlYmlyZC5yZXNvbHZlKCkpO1xuICB9XG5cbiAgcmVhZEF0dHJpYnV0ZXModCwgaWQpIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkKSlcbiAgICAudGhlbihkID0+IEpTT04ucGFyc2UoZCkpO1xuICB9XG5cbiAgcmVhZFJlbGF0aW9uc2hpcCh0LCBpZCwgcmVsYXRpb25zaGlwKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCwgcmVsYXRpb25zaGlwKSlcbiAgICAudGhlbigoYXJyYXlTdHJpbmcpID0+IHtcbiAgICAgIHJldHVybiB7IFtyZWxhdGlvbnNoaXBdOiBKU09OLnBhcnNlKGFycmF5U3RyaW5nKSB8fCBbXSB9O1xuICAgIH0pO1xuICB9XG5cbiAgZGVsZXRlKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RlbCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCkpO1xuICB9XG5cbiAgd2lwZSh0LCBpZCwgZmllbGQpIHtcbiAgICBpZiAoZmllbGQgPT09ICdhdHRyaWJ1dGVzJykge1xuICAgICAgcmV0dXJuIHRoaXMuX2RlbCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5fZGVsKHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkLCBmaWVsZCkpO1xuICAgIH1cbiAgfVxuXG4gIGFkZCh0eXBlLCBpZCwgcmVsTmFtZSwgY2hpbGRJZCwgZXh0cmFzID0ge30pIHtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBCbG9jayA9IHR5cGUuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnR5cGU7XG4gICAgY29uc3QgdGhpc1R5cGUgPSB0eXBlLiRuYW1lO1xuICAgIGNvbnN0IG90aGVyVHlwZSA9IHJlbGF0aW9uc2hpcEJsb2NrLiRzaWRlc1tyZWxOYW1lXS5vdGhlclR5cGU7XG4gICAgY29uc3Qgb3RoZXJOYW1lID0gcmVsYXRpb25zaGlwQmxvY2suJHNpZGVzW3JlbE5hbWVdLm90aGVyTmFtZTtcbiAgICBjb25zdCB0aGlzS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcodGhpc1R5cGUsIGlkLCByZWxOYW1lKTtcbiAgICBjb25zdCBvdGhlcktleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKG90aGVyVHlwZSwgY2hpbGRJZCwgb3RoZXJOYW1lKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgIHRoaXMuX2dldCh0aGlzS2V5U3RyaW5nKSxcbiAgICAgIHRoaXMuX2dldChvdGhlcktleVN0cmluZyksXG4gICAgXSlcbiAgICAudGhlbigoW3RoaXNBcnJheVN0cmluZywgb3RoZXJBcnJheVN0cmluZ10pID0+IHtcbiAgICAgIGNvbnN0IHRoaXNBcnJheSA9IEpTT04ucGFyc2UodGhpc0FycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IG90aGVyQXJyYXkgPSBKU09OLnBhcnNlKG90aGVyQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3QgbmV3Q2hpbGQgPSB7IGlkOiBjaGlsZElkIH07XG4gICAgICBjb25zdCBuZXdQYXJlbnQgPSB7IGlkIH07XG4gICAgICBpZiAocmVsYXRpb25zaGlwQmxvY2suJGV4dHJhcykge1xuICAgICAgICBuZXdDaGlsZC5tZXRhID0gbmV3Q2hpbGQubWV0YSB8fCB7fTtcbiAgICAgICAgbmV3UGFyZW50Lm1ldGEgPSBuZXdQYXJlbnQubWV0YSB8fCB7fTtcbiAgICAgICAgZm9yIChjb25zdCBleHRyYSBpbiBleHRyYXMpIHtcbiAgICAgICAgICBpZiAoZXh0cmEgaW4gcmVsYXRpb25zaGlwQmxvY2suJGV4dHJhcykge1xuICAgICAgICAgICAgbmV3Q2hpbGQubWV0YVtleHRyYV0gPSBleHRyYXNbZXh0cmFdO1xuICAgICAgICAgICAgbmV3UGFyZW50Lm1ldGFbZXh0cmFdID0gZXh0cmFzW2V4dHJhXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IHRoaXNJZHggPSB0aGlzQXJyYXkuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gY2hpbGRJZCk7XG4gICAgICBjb25zdCBvdGhlcklkeCA9IG90aGVyQXJyYXkuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gaWQpO1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIG1heWJlUHVzaCh0aGlzQXJyYXksIG5ld0NoaWxkLCB0aGlzS2V5U3RyaW5nLCB0aGlzLCB0aGlzSWR4KSxcbiAgICAgICAgbWF5YmVQdXNoKG90aGVyQXJyYXksIG5ld1BhcmVudCwgb3RoZXJLZXlTdHJpbmcsIHRoaXMsIG90aGVySWR4KSxcbiAgICAgIF0pXG4gICAgICAudGhlbigoKSA9PiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBpZCwgbnVsbCwgcmVsTmFtZSkpXG4gICAgICAudGhlbigoKSA9PiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBjaGlsZElkLCBudWxsLCBvdGhlck5hbWUpKVxuICAgICAgLnRoZW4oKCkgPT4gdGhpc0FycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIG1vZGlmeVJlbGF0aW9uc2hpcCh0eXBlLCBpZCwgcmVsTmFtZSwgY2hpbGRJZCwgZXh0cmFzKSB7XG4gICAgY29uc3QgcmVsYXRpb25zaGlwQmxvY2sgPSB0eXBlLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxOYW1lXS50eXBlO1xuICAgIGNvbnN0IHRoaXNUeXBlID0gdHlwZS4kbmFtZTtcbiAgICBjb25zdCBvdGhlclR5cGUgPSByZWxhdGlvbnNoaXBCbG9jay4kc2lkZXNbcmVsTmFtZV0ub3RoZXJUeXBlO1xuICAgIGNvbnN0IG90aGVyTmFtZSA9IHJlbGF0aW9uc2hpcEJsb2NrLiRzaWRlc1tyZWxOYW1lXS5vdGhlck5hbWU7XG4gICAgY29uc3QgdGhpc0tleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHRoaXNUeXBlLCBpZCwgcmVsTmFtZSk7XG4gICAgY29uc3Qgb3RoZXJLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyhvdGhlclR5cGUsIGNoaWxkSWQsIG90aGVyTmFtZSk7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICB0aGlzLl9nZXQodGhpc0tleVN0cmluZyksXG4gICAgICB0aGlzLl9nZXQob3RoZXJLZXlTdHJpbmcpLFxuICAgIF0pXG4gICAgLnRoZW4oKFt0aGlzQXJyYXlTdHJpbmcsIG90aGVyQXJyYXlTdHJpbmddKSA9PiB7XG4gICAgICBjb25zdCB0aGlzQXJyYXkgPSBKU09OLnBhcnNlKHRoaXNBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCBvdGhlckFycmF5ID0gSlNPTi5wYXJzZShvdGhlckFycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IHRoaXNUYXJnZXQgPSB7IGlkOiBjaGlsZElkIH07XG4gICAgICBjb25zdCBvdGhlclRhcmdldCA9IHsgaWQgfTtcbiAgICAgIGNvbnN0IHRoaXNJZHggPSB0aGlzQXJyYXkuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gY2hpbGRJZCk7XG4gICAgICBjb25zdCBvdGhlcklkeCA9IG90aGVyQXJyYXkuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gaWQpO1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIG1heWJlVXBkYXRlKHRoaXNBcnJheSwgdGhpc1RhcmdldCwgdGhpc0tleVN0cmluZywgdGhpcywgZXh0cmFzLCB0aGlzSWR4KSxcbiAgICAgICAgbWF5YmVVcGRhdGUob3RoZXJBcnJheSwgb3RoZXJUYXJnZXQsIG90aGVyS2V5U3RyaW5nLCB0aGlzLCBleHRyYXMsIG90aGVySWR4KSxcbiAgICAgIF0pO1xuICAgIH0pXG4gICAgLnRoZW4oKHJlcykgPT4gdGhpcy5ub3RpZnlVcGRhdGUodHlwZSwgaWQsIG51bGwsIHJlbE5hbWUpLnRoZW4oKCkgPT4gcmVzKSlcbiAgICAudGhlbigocmVzKSA9PiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBjaGlsZElkLCBudWxsLCBvdGhlck5hbWUpLnRoZW4oKCkgPT4gcmVzKSk7XG4gIH1cblxuICByZW1vdmUodHlwZSwgaWQsIHJlbE5hbWUsIGNoaWxkSWQpIHtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBCbG9jayA9IHR5cGUuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnR5cGU7XG4gICAgY29uc3QgdGhpc1R5cGUgPSB0eXBlLiRuYW1lO1xuICAgIGNvbnN0IG90aGVyVHlwZSA9IHJlbGF0aW9uc2hpcEJsb2NrLiRzaWRlc1tyZWxOYW1lXS5vdGhlclR5cGU7XG4gICAgY29uc3Qgb3RoZXJOYW1lID0gcmVsYXRpb25zaGlwQmxvY2suJHNpZGVzW3JlbE5hbWVdLm90aGVyTmFtZTtcbiAgICBjb25zdCB0aGlzS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcodGhpc1R5cGUsIGlkLCByZWxOYW1lKTtcbiAgICBjb25zdCBvdGhlcktleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKG90aGVyVHlwZSwgY2hpbGRJZCwgb3RoZXJOYW1lKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgIHRoaXMuX2dldCh0aGlzS2V5U3RyaW5nKSxcbiAgICAgIHRoaXMuX2dldChvdGhlcktleVN0cmluZyksXG4gICAgXSlcbiAgICAudGhlbigoW3RoaXNBcnJheVN0cmluZywgb3RoZXJBcnJheVN0cmluZ10pID0+IHtcbiAgICAgIGNvbnN0IHRoaXNBcnJheSA9IEpTT04ucGFyc2UodGhpc0FycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IG90aGVyQXJyYXkgPSBKU09OLnBhcnNlKG90aGVyQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3QgdGhpc0lkeCA9IHRoaXNBcnJheS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSBjaGlsZElkKTtcbiAgICAgIGNvbnN0IG90aGVySWR4ID0gb3RoZXJBcnJheS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSBpZCk7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgbWF5YmVEZWxldGUodGhpc0FycmF5LCB0aGlzSWR4LCB0aGlzS2V5U3RyaW5nLCB0aGlzKSxcbiAgICAgICAgbWF5YmVEZWxldGUob3RoZXJBcnJheSwgb3RoZXJJZHgsIG90aGVyS2V5U3RyaW5nLCB0aGlzKSxcbiAgICAgIF0pO1xuICAgIH0pXG4gICAgLnRoZW4oKHJlcykgPT4gdGhpcy5ub3RpZnlVcGRhdGUodHlwZSwgaWQsIG51bGwsIHJlbE5hbWUpLnRoZW4oKCkgPT4gcmVzKSlcbiAgICAudGhlbigocmVzKSA9PiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBjaGlsZElkLCBudWxsLCBvdGhlck5hbWUpLnRoZW4oKCkgPT4gcmVzKSk7XG4gIH1cblxuICBrZXlTdHJpbmcodHlwZU5hbWUsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgICByZXR1cm4gYCR7dHlwZU5hbWV9OiR7cmVsYXRpb25zaGlwID8gYHJlbC4ke3JlbGF0aW9uc2hpcH1gIDogJ2F0dHJpYnV0ZXMnfToke2lkfWA7XG4gIH1cbn1cbiJdfQ==
