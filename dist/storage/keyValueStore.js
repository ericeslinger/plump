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

      // const t = this.getType(v.type);
      return Bluebird.all([this._get(this.keyString(v.type, v.id)), this.readRelationships(v.type, v.id, Object.keys(v.relationships || {}))]).then(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            origAttributes = _ref2[0],
            origRelationships = _ref2[1];

        var updatedAttributes = Object.assign({}, JSON.parse(origAttributes), v.attributes);
        var updatedRelationships = _this3.resolveRelationships(v.type, v.relationships, origRelationships);
        var updated = { id: v.id, attributes: updatedAttributes, relationships: updatedRelationships };
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
      var thisType = type.$name;
      var otherType = relationshipBlock.$sides[relName].otherType;
      var otherName = relationshipBlock.$sides[relName].otherName;
      var thisKeyString = this.keyString(thisType, id, relName);
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
          return _this6.fireWriteUpdate({ type: type.$name, id: id, invalidate: [relName] }).then(function () {
            return res;
          });
        }).then(function (res) {
          return _this6.fireWriteUpdate({ type: type.$name, id: childId, invalidate: [otherName] }).then(function () {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uva2V5VmFsdWVTdG9yZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsInNhbmVOdW1iZXIiLCJpIiwiaXNOYU4iLCJJbmZpbml0eSIsIm1heWJlUHVzaCIsImFycmF5IiwidmFsIiwia2V5c3RyaW5nIiwic3RvcmUiLCJpZHgiLCJyZXNvbHZlIiwidGhlbiIsInB1c2giLCJfc2V0IiwiSlNPTiIsInN0cmluZ2lmeSIsIm1heWJlVXBkYXRlIiwiZXh0cmFzIiwibW9kaWZpZWRSZWxhdGlvbnNoaXAiLCJtZXRhIiwibWF5YmVEZWxldGUiLCJzcGxpY2UiLCJhcHBseURlbHRhIiwiYmFzZSIsImRlbHRhIiwib3AiLCJyZXRWYWwiLCJkYXRhIiwidW5kZWZpbmVkIiwiS2V5VmFsdWVTdG9yZSIsInQiLCJfa2V5cyIsImtleUFycmF5IiwibGVuZ3RoIiwibWFwIiwiayIsInNwbGl0IiwicGFyc2VJbnQiLCJmaWx0ZXIiLCJyZWR1Y2UiLCJtYXgiLCJjdXJyZW50IiwidiIsImlkIiwiY3JlYXRlTmV3Iiwib3ZlcndyaXRlIiwidG9TYXZlIiwidGVybWluYWwiLCIkJG1heEtleSIsInR5cGUiLCJuIiwiYWxsIiwid3JpdGVBdHRyaWJ1dGVzIiwiYXR0cmlidXRlcyIsIndyaXRlUmVsYXRpb25zaGlwcyIsInJlbGF0aW9uc2hpcHMiLCJFcnJvciIsIl9nZXQiLCJrZXlTdHJpbmciLCJyZWFkUmVsYXRpb25zaGlwcyIsIk9iamVjdCIsImtleXMiLCJvcmlnQXR0cmlidXRlcyIsIm9yaWdSZWxhdGlvbnNoaXBzIiwidXBkYXRlZEF0dHJpYnV0ZXMiLCJhc3NpZ24iLCJwYXJzZSIsInVwZGF0ZWRSZWxhdGlvbnNoaXBzIiwicmVzb2x2ZVJlbGF0aW9uc2hpcHMiLCJ1cGRhdGVkIiwibm90aWZ5VXBkYXRlIiwidHlwZU5hbWUiLCJnZXRUeXBlIiwiJGlkIiwiJHNjaGVtYSIsInRvV3JpdGUiLCIkbmFtZSIsImZpcmVXcml0ZVVwZGF0ZSIsImludmFsaWRhdGUiLCJyZWxOYW1lIiwidGhlbmFibGUiLCJjdXJyIiwiZCIsInJlbGF0aW9uc2hpcCIsImFycmF5U3RyaW5nIiwiX2RlbCIsImZpZWxkIiwiY2hpbGRJZCIsInJlbGF0aW9uc2hpcEJsb2NrIiwidGhpc1R5cGUiLCJvdGhlclR5cGUiLCIkc2lkZXMiLCJvdGhlck5hbWUiLCJ0aGlzS2V5U3RyaW5nIiwib3RoZXJLZXlTdHJpbmciLCJ0aGlzQXJyYXlTdHJpbmciLCJvdGhlckFycmF5U3RyaW5nIiwidGhpc0FycmF5Iiwib3RoZXJBcnJheSIsIm5ld0NoaWxkIiwibmV3UGFyZW50IiwiJGV4dHJhcyIsImV4dHJhIiwidGhpc0lkeCIsImZpbmRJbmRleCIsIml0ZW0iLCJvdGhlcklkeCIsInJlcyIsInRoaXNUYXJnZXQiLCJvdGhlclRhcmdldCIsImNoaWxkcmVuIiwibWF5YmVCYXNlIiwidXBkYXRlcyIsInJlbCIsImFjYyIsImZvckVhY2giLCJjaGlsZCIsImNvbmNhdCIsImRlbHRhcyIsInNjaGVtYSIsInJlc29sdmVSZWxhdGlvbnNoaXAiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0lBQVlBLFE7O0FBQ1o7Ozs7QUFFQTs7Ozs7Ozs7Ozs7Ozs7QUFFQSxTQUFTQyxVQUFULENBQW9CQyxDQUFwQixFQUF1QjtBQUNyQixTQUFTLE9BQU9BLENBQVAsS0FBYSxRQUFkLElBQTRCLENBQUNDLE1BQU1ELENBQU4sQ0FBN0IsSUFBMkNBLE1BQU1FLFFBQVAsR0FBb0JGLE1BQU0sQ0FBQ0UsUUFBN0U7QUFDRDs7QUFFRCxTQUFTQyxTQUFULENBQW1CQyxLQUFuQixFQUEwQkMsR0FBMUIsRUFBK0JDLFNBQS9CLEVBQTBDQyxLQUExQyxFQUFpREMsR0FBakQsRUFBc0Q7QUFDcEQsU0FBT1YsU0FBU1csT0FBVCxHQUNOQyxJQURNLENBQ0QsWUFBTTtBQUNWLFFBQUlGLE1BQU0sQ0FBVixFQUFhO0FBQ1hKLFlBQU1PLElBQU4sQ0FBV04sR0FBWDtBQUNBLGFBQU9FLE1BQU1LLElBQU4sQ0FBV04sU0FBWCxF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VTVCLEUsRUFBSXdDLFksRUFBYztBQUNwQyxhQUFVWixRQUFWLFVBQXNCWSx3QkFBc0JBLFlBQXRCLEdBQXVDLFlBQTdELFVBQTZFeEMsRUFBN0U7QUFDRCIsImZpbGUiOiJzdG9yYWdlL2tleVZhbHVlU3RvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgbWVyZ2VPcHRpb25zIGZyb20gJ21lcmdlLW9wdGlvbnMnO1xuXG5pbXBvcnQgeyBTdG9yYWdlIH0gZnJvbSAnLi9zdG9yYWdlJztcblxuZnVuY3Rpb24gc2FuZU51bWJlcihpKSB7XG4gIHJldHVybiAoKHR5cGVvZiBpID09PSAnbnVtYmVyJykgJiYgKCFpc05hTihpKSkgJiYgKGkgIT09IEluZmluaXR5KSAmIChpICE9PSAtSW5maW5pdHkpKTtcbn1cblxuZnVuY3Rpb24gbWF5YmVQdXNoKGFycmF5LCB2YWwsIGtleXN0cmluZywgc3RvcmUsIGlkeCkge1xuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gIC50aGVuKCgpID0+IHtcbiAgICBpZiAoaWR4IDwgMCkge1xuICAgICAgYXJyYXkucHVzaCh2YWwpO1xuICAgICAgcmV0dXJuIHN0b3JlLl9zZXQoa2V5c3RyaW5nLCBKU09OLnN0cmluZ2lmeShhcnJheSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0pO1xufVxuXG5cbmZ1bmN0aW9uIG1heWJlVXBkYXRlKGFycmF5LCB2YWwsIGtleXN0cmluZywgc3RvcmUsIGV4dHJhcywgaWR4KSB7XG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgLnRoZW4oKCkgPT4ge1xuICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgY29uc3QgbW9kaWZpZWRSZWxhdGlvbnNoaXAgPSBtZXJnZU9wdGlvbnMoXG4gICAgICAgIHt9LFxuICAgICAgICBhcnJheVtpZHhdLFxuICAgICAgICBleHRyYXMgPyB7IG1ldGE6IGV4dHJhcyB9IDoge31cbiAgICAgICk7XG4gICAgICBhcnJheVtpZHhdID0gbW9kaWZpZWRSZWxhdGlvbnNoaXA7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgIHJldHVybiBzdG9yZS5fc2V0KGtleXN0cmluZywgSlNPTi5zdHJpbmdpZnkoYXJyYXkpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gbWF5YmVEZWxldGUoYXJyYXksIGlkeCwga2V5c3RyaW5nLCBzdG9yZSkge1xuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gIC50aGVuKCgpID0+IHtcbiAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgIGFycmF5LnNwbGljZShpZHgsIDEpO1xuICAgICAgcmV0dXJuIHN0b3JlLl9zZXQoa2V5c3RyaW5nLCBKU09OLnN0cmluZ2lmeShhcnJheSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBhcHBseURlbHRhKGJhc2UsIGRlbHRhKSB7XG4gIGlmIChkZWx0YS5vcCA9PT0gJ2FkZCcgfHwgZGVsdGEub3AgPT09ICdtb2RpZnknKSB7XG4gICAgY29uc3QgcmV0VmFsID0gbWVyZ2VPcHRpb25zKHt9LCBiYXNlLCBkZWx0YS5kYXRhKTtcbiAgICByZXR1cm4gcmV0VmFsO1xuICB9IGVsc2UgaWYgKGRlbHRhLm9wID09PSAncmVtb3ZlJykge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEtleVZhbHVlU3RvcmUgZXh0ZW5kcyBTdG9yYWdlIHtcbiAgJCRtYXhLZXkodCkge1xuICAgIHJldHVybiB0aGlzLl9rZXlzKHQpXG4gICAgLnRoZW4oKGtleUFycmF5KSA9PiB7XG4gICAgICBpZiAoa2V5QXJyYXkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGtleUFycmF5Lm1hcCgoaykgPT4gay5zcGxpdCgnOicpWzJdKVxuICAgICAgICAubWFwKChrKSA9PiBwYXJzZUludChrLCAxMCkpXG4gICAgICAgIC5maWx0ZXIoKGkpID0+IHNhbmVOdW1iZXIoaSkpXG4gICAgICAgIC5yZWR1Y2UoKG1heCwgY3VycmVudCkgPT4gKGN1cnJlbnQgPiBtYXgpID8gY3VycmVudCA6IG1heCwgMCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICB3cml0ZSh2KSB7XG4gICAgaWYgKCh2LmlkID09PSB1bmRlZmluZWQpIHx8ICh2LmlkID09PSBudWxsKSkge1xuICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlTmV3KHYpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5vdmVyd3JpdGUodik7XG4gICAgfVxuICB9XG5cbiAgY3JlYXRlTmV3KHYpIHtcbiAgICAvLyBjb25zdCB0ID0gdGhpcy5nZXRUeXBlKHYudHlwZSk7XG4gICAgY29uc3QgdG9TYXZlID0gbWVyZ2VPcHRpb25zKHt9LCB2KTtcbiAgICBpZiAodGhpcy50ZXJtaW5hbCkge1xuICAgICAgcmV0dXJuIHRoaXMuJCRtYXhLZXkodi50eXBlKVxuICAgICAgLnRoZW4oKG4pID0+IHtcbiAgICAgICAgY29uc3QgaWQgPSBuICsgMTtcbiAgICAgICAgdG9TYXZlLmlkID0gaWQ7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICAgIHRoaXMud3JpdGVBdHRyaWJ1dGVzKHYudHlwZSwgaWQsIHRvU2F2ZS5hdHRyaWJ1dGVzKSxcbiAgICAgICAgICB0aGlzLndyaXRlUmVsYXRpb25zaGlwcyh2LnR5cGUsIGlkLCB0b1NhdmUucmVsYXRpb25zaGlwcyksXG4gICAgICAgIF0pXG4gICAgICAgIC50aGVuKCgpID0+IHRvU2F2ZSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIG5ldyBjb250ZW50IGluIGEgbm9uLXRlcm1pbmFsIHN0b3JlJyk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcndyaXRlKHYpIHtcbiAgICAvLyBjb25zdCB0ID0gdGhpcy5nZXRUeXBlKHYudHlwZSk7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodi50eXBlLCB2LmlkKSksXG4gICAgICB0aGlzLnJlYWRSZWxhdGlvbnNoaXBzKHYudHlwZSwgdi5pZCwgT2JqZWN0LmtleXModi5yZWxhdGlvbnNoaXBzIHx8IHt9KSksXG4gICAgXSkudGhlbigoW29yaWdBdHRyaWJ1dGVzLCBvcmlnUmVsYXRpb25zaGlwc10pID0+IHtcbiAgICAgIGNvbnN0IHVwZGF0ZWRBdHRyaWJ1dGVzID0gT2JqZWN0LmFzc2lnbih7fSwgSlNPTi5wYXJzZShvcmlnQXR0cmlidXRlcyksIHYuYXR0cmlidXRlcyk7XG4gICAgICBjb25zdCB1cGRhdGVkUmVsYXRpb25zaGlwcyA9IHRoaXMucmVzb2x2ZVJlbGF0aW9uc2hpcHModi50eXBlLCB2LnJlbGF0aW9uc2hpcHMsIG9yaWdSZWxhdGlvbnNoaXBzKTtcbiAgICAgIGNvbnN0IHVwZGF0ZWQgPSB7IGlkOiB2LmlkLCBhdHRyaWJ1dGVzOiB1cGRhdGVkQXR0cmlidXRlcywgcmVsYXRpb25zaGlwczogdXBkYXRlZFJlbGF0aW9uc2hpcHMgfTtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICB0aGlzLndyaXRlQXR0cmlidXRlcyh2LnR5cGUsIHYuaWQsIHVwZGF0ZWRBdHRyaWJ1dGVzKSxcbiAgICAgICAgdGhpcy53cml0ZVJlbGF0aW9uc2hpcHModi50eXBlLCB2LmlkLCB1cGRhdGVkUmVsYXRpb25zaGlwcyksXG4gICAgICBdKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5ub3RpZnlVcGRhdGUodi50eXBlLCB2LmlkLCB1cGRhdGVkKTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB1cGRhdGVkO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICB3cml0ZUF0dHJpYnV0ZXModHlwZU5hbWUsIGlkLCBhdHRyaWJ1dGVzKSB7XG4gICAgY29uc3QgdCA9IHRoaXMuZ2V0VHlwZSh0eXBlTmFtZSk7XG4gICAgY29uc3QgJGlkID0gYXR0cmlidXRlcy5pZCA/ICdpZCcgOiB0LiRzY2hlbWEuJGlkO1xuICAgIGNvbnN0IHRvV3JpdGUgPSBtZXJnZU9wdGlvbnMoe30sIGF0dHJpYnV0ZXMsIHsgWyRpZF06IGlkIH0pO1xuICAgIHJldHVybiB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpLCBKU09OLnN0cmluZ2lmeSh0b1dyaXRlKSlcbiAgICAudGhlbigodikgPT4ge1xuICAgICAgdGhpcy5maXJlV3JpdGVVcGRhdGUoe1xuICAgICAgICB0eXBlOiB0LiRuYW1lLFxuICAgICAgICBpZDogaWQsXG4gICAgICAgIGludmFsaWRhdGU6IFsnYXR0cmlidXRlcyddLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gdjtcbiAgICB9KTtcbiAgfVxuXG4gIHdyaXRlUmVsYXRpb25zaGlwcyh0eXBlTmFtZSwgaWQsIHJlbGF0aW9uc2hpcHMpIHtcbiAgICBjb25zdCB0ID0gdGhpcy5nZXRUeXBlKHR5cGVOYW1lKTtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMocmVsYXRpb25zaGlwcykubWFwKHJlbE5hbWUgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCwgcmVsTmFtZSksIEpTT04uc3RyaW5naWZ5KHJlbGF0aW9uc2hpcHNbcmVsTmFtZV0pKTtcbiAgICB9KS5yZWR1Y2UoKHRoZW5hYmxlLCBjdXJyKSA9PiB0aGVuYWJsZS50aGVuKCgpID0+IGN1cnIpLCBCbHVlYmlyZC5yZXNvbHZlKCkpO1xuICB9XG5cbiAgcmVhZEF0dHJpYnV0ZXModHlwZSwgaWQpIHtcbiAgICBjb25zdCB0ID0gdGhpcy5nZXRUeXBlKHR5cGUpO1xuICAgIHJldHVybiB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpKVxuICAgIC50aGVuKGQgPT4gSlNPTi5wYXJzZShkKSk7XG4gIH1cblxuICByZWFkUmVsYXRpb25zaGlwKHR5cGUsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgICBjb25zdCB0ID0gdGhpcy5nZXRUeXBlKHR5cGUpO1xuICAgIHJldHVybiB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQsIHJlbGF0aW9uc2hpcCkpXG4gICAgLnRoZW4oKGFycmF5U3RyaW5nKSA9PiB7XG4gICAgICByZXR1cm4geyBbcmVsYXRpb25zaGlwXTogSlNPTi5wYXJzZShhcnJheVN0cmluZykgfHwgW10gfTtcbiAgICB9KTtcbiAgfVxuXG4gIGRlbGV0ZSh0eXBlLCBpZCkge1xuICAgIGNvbnN0IHQgPSB0aGlzLmdldFR5cGUodHlwZSk7XG4gICAgcmV0dXJuIHRoaXMuX2RlbCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCkpO1xuICB9XG5cbiAgd2lwZSh0eXBlLCBpZCwgZmllbGQpIHtcbiAgICBjb25zdCB0ID0gdGhpcy5nZXRUeXBlKHR5cGUpO1xuICAgIGlmIChmaWVsZCA9PT0gJ2F0dHJpYnV0ZXMnKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZGVsKHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLl9kZWwodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQsIGZpZWxkKSk7XG4gICAgfVxuICB9XG5cbiAgYWRkKHR5cGVOYW1lLCBpZCwgcmVsTmFtZSwgY2hpbGRJZCwgZXh0cmFzID0ge30pIHtcbiAgICBjb25zdCB0eXBlID0gdGhpcy5nZXRUeXBlKHR5cGVOYW1lKTtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBCbG9jayA9IHR5cGUuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnR5cGU7XG4gICAgY29uc3QgdGhpc1R5cGUgPSB0eXBlLiRuYW1lO1xuICAgIGNvbnN0IG90aGVyVHlwZSA9IHJlbGF0aW9uc2hpcEJsb2NrLiRzaWRlc1tyZWxOYW1lXS5vdGhlclR5cGU7XG4gICAgY29uc3Qgb3RoZXJOYW1lID0gcmVsYXRpb25zaGlwQmxvY2suJHNpZGVzW3JlbE5hbWVdLm90aGVyTmFtZTtcbiAgICBjb25zdCB0aGlzS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcodGhpc1R5cGUsIGlkLCByZWxOYW1lKTtcbiAgICBjb25zdCBvdGhlcktleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKG90aGVyVHlwZSwgY2hpbGRJZCwgb3RoZXJOYW1lKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgIHRoaXMuX2dldCh0aGlzS2V5U3RyaW5nKSxcbiAgICAgIHRoaXMuX2dldChvdGhlcktleVN0cmluZyksXG4gICAgXSlcbiAgICAudGhlbigoW3RoaXNBcnJheVN0cmluZywgb3RoZXJBcnJheVN0cmluZ10pID0+IHtcbiAgICAgIGNvbnN0IHRoaXNBcnJheSA9IEpTT04ucGFyc2UodGhpc0FycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IG90aGVyQXJyYXkgPSBKU09OLnBhcnNlKG90aGVyQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3QgbmV3Q2hpbGQgPSB7IGlkOiBjaGlsZElkIH07XG4gICAgICBjb25zdCBuZXdQYXJlbnQgPSB7IGlkIH07XG4gICAgICBpZiAocmVsYXRpb25zaGlwQmxvY2suJGV4dHJhcykge1xuICAgICAgICBuZXdDaGlsZC5tZXRhID0gbmV3Q2hpbGQubWV0YSB8fCB7fTtcbiAgICAgICAgbmV3UGFyZW50Lm1ldGEgPSBuZXdQYXJlbnQubWV0YSB8fCB7fTtcbiAgICAgICAgZm9yIChjb25zdCBleHRyYSBpbiBleHRyYXMpIHtcbiAgICAgICAgICBpZiAoZXh0cmEgaW4gcmVsYXRpb25zaGlwQmxvY2suJGV4dHJhcykge1xuICAgICAgICAgICAgbmV3Q2hpbGQubWV0YVtleHRyYV0gPSBleHRyYXNbZXh0cmFdO1xuICAgICAgICAgICAgbmV3UGFyZW50Lm1ldGFbZXh0cmFdID0gZXh0cmFzW2V4dHJhXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IHRoaXNJZHggPSB0aGlzQXJyYXkuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gY2hpbGRJZCk7XG4gICAgICBjb25zdCBvdGhlcklkeCA9IG90aGVyQXJyYXkuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gaWQpO1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIG1heWJlUHVzaCh0aGlzQXJyYXksIG5ld0NoaWxkLCB0aGlzS2V5U3RyaW5nLCB0aGlzLCB0aGlzSWR4KSxcbiAgICAgICAgbWF5YmVQdXNoKG90aGVyQXJyYXksIG5ld1BhcmVudCwgb3RoZXJLZXlTdHJpbmcsIHRoaXMsIG90aGVySWR4KSxcbiAgICAgIF0pXG4gICAgICAudGhlbigocmVzKSA9PiB0aGlzLmZpcmVXcml0ZVVwZGF0ZSh7IHR5cGU6IHR5cGUuJG5hbWUsIGlkOiBpZCwgaW52YWxpZGF0ZTogW3JlbE5hbWVdIH0pLnRoZW4oKCkgPT4gcmVzKSlcbiAgICAgIC50aGVuKChyZXMpID0+IHRoaXMuZmlyZVdyaXRlVXBkYXRlKHsgdHlwZTogdHlwZS4kbmFtZSwgaWQ6IGNoaWxkSWQsIGludmFsaWRhdGU6IFtvdGhlck5hbWVdIH0pLnRoZW4oKCkgPT4gcmVzKSlcbiAgICAgIC50aGVuKCgpID0+IHRoaXNBcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBtb2RpZnlSZWxhdGlvbnNoaXAodHlwZU5hbWUsIGlkLCByZWxOYW1lLCBjaGlsZElkLCBleHRyYXMpIHtcbiAgICBjb25zdCB0eXBlID0gdGhpcy5nZXRUeXBlKHR5cGVOYW1lKTtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBCbG9jayA9IHR5cGUuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnR5cGU7XG4gICAgY29uc3QgdGhpc1R5cGUgPSB0eXBlLiRuYW1lO1xuICAgIGNvbnN0IG90aGVyVHlwZSA9IHJlbGF0aW9uc2hpcEJsb2NrLiRzaWRlc1tyZWxOYW1lXS5vdGhlclR5cGU7XG4gICAgY29uc3Qgb3RoZXJOYW1lID0gcmVsYXRpb25zaGlwQmxvY2suJHNpZGVzW3JlbE5hbWVdLm90aGVyTmFtZTtcbiAgICBjb25zdCB0aGlzS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcodGhpc1R5cGUsIGlkLCByZWxOYW1lKTtcbiAgICBjb25zdCBvdGhlcktleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKG90aGVyVHlwZSwgY2hpbGRJZCwgb3RoZXJOYW1lKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgIHRoaXMuX2dldCh0aGlzS2V5U3RyaW5nKSxcbiAgICAgIHRoaXMuX2dldChvdGhlcktleVN0cmluZyksXG4gICAgXSlcbiAgICAudGhlbigoW3RoaXNBcnJheVN0cmluZywgb3RoZXJBcnJheVN0cmluZ10pID0+IHtcbiAgICAgIGNvbnN0IHRoaXNBcnJheSA9IEpTT04ucGFyc2UodGhpc0FycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IG90aGVyQXJyYXkgPSBKU09OLnBhcnNlKG90aGVyQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3QgdGhpc1RhcmdldCA9IHsgaWQ6IGNoaWxkSWQgfTtcbiAgICAgIGNvbnN0IG90aGVyVGFyZ2V0ID0geyBpZCB9O1xuICAgICAgY29uc3QgdGhpc0lkeCA9IHRoaXNBcnJheS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSBjaGlsZElkKTtcbiAgICAgIGNvbnN0IG90aGVySWR4ID0gb3RoZXJBcnJheS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSBpZCk7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgbWF5YmVVcGRhdGUodGhpc0FycmF5LCB0aGlzVGFyZ2V0LCB0aGlzS2V5U3RyaW5nLCB0aGlzLCBleHRyYXMsIHRoaXNJZHgpLFxuICAgICAgICBtYXliZVVwZGF0ZShvdGhlckFycmF5LCBvdGhlclRhcmdldCwgb3RoZXJLZXlTdHJpbmcsIHRoaXMsIGV4dHJhcywgb3RoZXJJZHgpLFxuICAgICAgXSk7XG4gICAgfSlcbiAgICAudGhlbigocmVzKSA9PiB0aGlzLmZpcmVXcml0ZVVwZGF0ZSh7IHR5cGU6IHR5cGUuJG5hbWUsIGlkOiBpZCwgaW52YWxpZGF0ZTogW3JlbE5hbWVdIH0pLnRoZW4oKCkgPT4gcmVzKSlcbiAgICAudGhlbigocmVzKSA9PiB0aGlzLmZpcmVXcml0ZVVwZGF0ZSh7IHR5cGU6IHR5cGUuJG5hbWUsIGlkOiBjaGlsZElkLCBpbnZhbGlkYXRlOiBbb3RoZXJOYW1lXSB9KS50aGVuKCgpID0+IHJlcykpO1xuICB9XG5cbiAgcmVtb3ZlKHR5cGVOYW1lLCBpZCwgcmVsTmFtZSwgY2hpbGRJZCkge1xuICAgIGNvbnN0IHR5cGUgPSB0aGlzLmdldFR5cGUodHlwZU5hbWUpO1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcEJsb2NrID0gdHlwZS4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0udHlwZTtcbiAgICBjb25zdCB0aGlzVHlwZSA9IHR5cGUuJG5hbWU7XG4gICAgY29uc3Qgb3RoZXJUeXBlID0gcmVsYXRpb25zaGlwQmxvY2suJHNpZGVzW3JlbE5hbWVdLm90aGVyVHlwZTtcbiAgICBjb25zdCBvdGhlck5hbWUgPSByZWxhdGlvbnNoaXBCbG9jay4kc2lkZXNbcmVsTmFtZV0ub3RoZXJOYW1lO1xuICAgIGNvbnN0IHRoaXNLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyh0aGlzVHlwZSwgaWQsIHJlbE5hbWUpO1xuICAgIGNvbnN0IG90aGVyS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcob3RoZXJUeXBlLCBjaGlsZElkLCBvdGhlck5hbWUpO1xuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgdGhpcy5fZ2V0KHRoaXNLZXlTdHJpbmcpLFxuICAgICAgdGhpcy5fZ2V0KG90aGVyS2V5U3RyaW5nKSxcbiAgICBdKVxuICAgIC50aGVuKChbdGhpc0FycmF5U3RyaW5nLCBvdGhlckFycmF5U3RyaW5nXSkgPT4ge1xuICAgICAgY29uc3QgdGhpc0FycmF5ID0gSlNPTi5wYXJzZSh0aGlzQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3Qgb3RoZXJBcnJheSA9IEpTT04ucGFyc2Uob3RoZXJBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCB0aGlzSWR4ID0gdGhpc0FycmF5LmZpbmRJbmRleChpdGVtID0+IGl0ZW0uaWQgPT09IGNoaWxkSWQpO1xuICAgICAgY29uc3Qgb3RoZXJJZHggPSBvdGhlckFycmF5LmZpbmRJbmRleChpdGVtID0+IGl0ZW0uaWQgPT09IGlkKTtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICBtYXliZURlbGV0ZSh0aGlzQXJyYXksIHRoaXNJZHgsIHRoaXNLZXlTdHJpbmcsIHRoaXMpLFxuICAgICAgICBtYXliZURlbGV0ZShvdGhlckFycmF5LCBvdGhlcklkeCwgb3RoZXJLZXlTdHJpbmcsIHRoaXMpLFxuICAgICAgXSk7XG4gICAgfSlcbiAgICAudGhlbigocmVzKSA9PiB0aGlzLmZpcmVXcml0ZVVwZGF0ZSh7IHR5cGU6IHR5cGUuJG5hbWUsIGlkOiBpZCwgaW52YWxpZGF0ZTogW3JlbE5hbWVdIH0pLnRoZW4oKCkgPT4gcmVzKSlcbiAgICAudGhlbigocmVzKSA9PiB0aGlzLmZpcmVXcml0ZVVwZGF0ZSh7IHR5cGU6IHR5cGUuJG5hbWUsIGlkOiBjaGlsZElkLCBpbnZhbGlkYXRlOiBbb3RoZXJOYW1lXSB9KS50aGVuKCgpID0+IHJlcykpO1xuICB9XG5cbiAgcmVzb2x2ZVJlbGF0aW9uc2hpcChjaGlsZHJlbiwgbWF5YmVCYXNlKSB7XG4gICAgY29uc3QgYmFzZSA9IG1heWJlQmFzZSB8fCBbXTtcbiAgICAvLyBJbmRleCBjdXJyZW50IHJlbGF0aW9uc2hpcHMgYnkgSUQgZm9yIGVmZmljaWVudCBtb2RpZmljYXRpb25cbiAgICBjb25zdCB1cGRhdGVzID0gYmFzZS5tYXAocmVsID0+IHtcbiAgICAgIHJldHVybiB7IFtyZWwuaWRdOiByZWwgfTtcbiAgICB9KS5yZWR1Y2UoKGFjYywgY3VycikgPT4gbWVyZ2VPcHRpb25zKGFjYywgY3VyciksIHt9KTtcblxuICAgIC8vIEFwcGx5IGFueSBjaGlsZHJlbiBpbiBkaXJ0eSBjYWNoZSBvbiB0b3Agb2YgdXBkYXRlc1xuICAgIGNoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4ge1xuICAgICAgaWYgKGNoaWxkLm9wKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkSWQgPSBjaGlsZC5kYXRhLmlkO1xuICAgICAgICB1cGRhdGVzW2NoaWxkSWRdID0gYXBwbHlEZWx0YSh1cGRhdGVzW2NoaWxkSWRdLCBjaGlsZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cGRhdGVzW2NoaWxkLmlkXSA9IGNoaWxkO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gQ29sbGFwc2UgdXBkYXRlcyBiYWNrIGludG8gbGlzdCwgb21pdHRpbmcgdW5kZWZpbmVkc1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh1cGRhdGVzKVxuICAgICAgLm1hcChpZCA9PiB1cGRhdGVzW2lkXSlcbiAgICAgIC5maWx0ZXIocmVsID0+IHJlbCAhPT0gdW5kZWZpbmVkKVxuICAgICAgLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBhY2MuY29uY2F0KGN1cnIpLCBbXSk7XG4gIH1cblxuICByZXNvbHZlUmVsYXRpb25zaGlwcyh0eXBlTmFtZSwgZGVsdGFzLCBiYXNlID0ge30pIHtcbiAgICBjb25zdCB1cGRhdGVzID0ge307XG4gICAgY29uc3Qgc2NoZW1hID0gdGhpcy5nZXRUeXBlKHR5cGVOYW1lKS4kc2NoZW1hO1xuICAgIGZvciAoY29uc3QgcmVsTmFtZSBpbiBkZWx0YXMpIHtcbiAgICAgIGlmIChyZWxOYW1lIGluIHNjaGVtYS5yZWxhdGlvbnNoaXBzKSB7XG4gICAgICAgIHVwZGF0ZXNbcmVsTmFtZV0gPSB0aGlzLnJlc29sdmVSZWxhdGlvbnNoaXAoZGVsdGFzW3JlbE5hbWVdLCBiYXNlW3JlbE5hbWVdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1lcmdlT3B0aW9ucyh7fSwgYmFzZSwgdXBkYXRlcyk7XG4gIH1cbiAga2V5U3RyaW5nKHR5cGVOYW1lLCBpZCwgcmVsYXRpb25zaGlwKSB7XG4gICAgcmV0dXJuIGAke3R5cGVOYW1lfToke3JlbGF0aW9uc2hpcCA/IGByZWwuJHtyZWxhdGlvbnNoaXB9YCA6ICdhdHRyaWJ1dGVzJ306JHtpZH1gO1xuICB9XG59XG4iXX0=
