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

function resolveRelationship(children, maybeBase) {
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
    value: function write(type, v) {
      var t = this.getType(type);
      var id = v.id || v[t.$schema.$id];
      if (id === undefined || id === null) {
        return this.createNew(t, v);
      } else {
        return this.overwrite(t, id, v);
      }
    }
  }, {
    key: 'createNew',
    value: function createNew(type, v) {
      var _this2 = this;

      var t = this.getType(type);
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
    value: function overwrite(type, id, v) {
      var _this3 = this;

      var t = this.getType(type);
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
    value: function writeAttributes(type, id, attributes) {
      var _this4 = this;

      var t = this.getType(type);
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
    value: function writeRelationships(type, id, relationships) {
      var _this5 = this;

      var t = this.getType(type);
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
    key: 'keyString',
    value: function keyString(typeName, id, relationship) {
      return typeName + ':' + (relationship ? 'rel.' + relationship : 'attributes') + ':' + id;
    }
  }]);

  return KeyValueStore;
}(_storage.Storage);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uva2V5VmFsdWVTdG9yZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsInNhbmVOdW1iZXIiLCJpIiwiaXNOYU4iLCJJbmZpbml0eSIsIm1heWJlUHVzaCIsImFycmF5IiwidmFsIiwia2V5c3RyaW5nIiwic3RvcmUiLCJpZHgiLCJyZXNvbHZlIiwidGhlbiIsInB1c2giLCJfc2V0IiwiSlNPTiIsInN0cmluZ2lmeSIsIm1heWJlVXBkYXRlIiwiZXh0cmFzIiwibW9kaWZpZWRSZWxhdGlvbnNoaXAiLCJtZXRhIiwibWF5YmVEZWxldGUiLCJzcGxpY2UiLCJhcHBseURlbHRhIiwiYmFzZSIsImRlbHRhIiwib3AiLCJyZXRWYWwiLCJkYXRhIiwidW5kZWZpbmVkIiwicmVzb2x2ZVJlbGF0aW9uc2hpcCIsImNoaWxkcmVuIiwibWF5YmVCYXNlIiwidXBkYXRlcyIsIm1hcCIsInJlbCIsImlkIiwicmVkdWNlIiwiYWNjIiwiY3VyciIsImZvckVhY2giLCJjaGlsZCIsImNoaWxkSWQiLCJPYmplY3QiLCJrZXlzIiwiZmlsdGVyIiwiY29uY2F0IiwicmVzb2x2ZVJlbGF0aW9uc2hpcHMiLCJzY2hlbWEiLCJkZWx0YXMiLCJyZWxOYW1lIiwicmVsYXRpb25zaGlwcyIsIktleVZhbHVlU3RvcmUiLCJ0IiwiX2tleXMiLCJrZXlBcnJheSIsImxlbmd0aCIsImsiLCJzcGxpdCIsInBhcnNlSW50IiwibWF4IiwiY3VycmVudCIsInR5cGUiLCJ2IiwiZ2V0VHlwZSIsIiRzY2hlbWEiLCIkaWQiLCJjcmVhdGVOZXciLCJvdmVyd3JpdGUiLCJ0b1NhdmUiLCJ0ZXJtaW5hbCIsIiQkbWF4S2V5IiwiJG5hbWUiLCJuIiwiYWxsIiwid3JpdGVBdHRyaWJ1dGVzIiwiYXR0cmlidXRlcyIsIndyaXRlUmVsYXRpb25zaGlwcyIsIm5vdGlmeVVwZGF0ZSIsIkVycm9yIiwiX2dldCIsImtleVN0cmluZyIsInJlYWRSZWxhdGlvbnNoaXBzIiwib3JpZ0F0dHJpYnV0ZXMiLCJvcmlnUmVsYXRpb25zaGlwcyIsInVwZGF0ZWRBdHRyaWJ1dGVzIiwiYXNzaWduIiwicGFyc2UiLCJ1cGRhdGVkUmVsYXRpb25zaGlwcyIsInVwZGF0ZWQiLCJ0b1dyaXRlIiwiZmlyZVdyaXRlVXBkYXRlIiwiaW52YWxpZGF0ZSIsInRoZW5hYmxlIiwiZCIsInJlbGF0aW9uc2hpcCIsImFycmF5U3RyaW5nIiwiX2RlbCIsImZpZWxkIiwidHlwZU5hbWUiLCJyZWxhdGlvbnNoaXBCbG9jayIsInRoaXNUeXBlIiwib3RoZXJUeXBlIiwiJHNpZGVzIiwib3RoZXJOYW1lIiwidGhpc0tleVN0cmluZyIsIm90aGVyS2V5U3RyaW5nIiwidGhpc0FycmF5U3RyaW5nIiwib3RoZXJBcnJheVN0cmluZyIsInRoaXNBcnJheSIsIm90aGVyQXJyYXkiLCJuZXdDaGlsZCIsIm5ld1BhcmVudCIsIiRleHRyYXMiLCJleHRyYSIsInRoaXNJZHgiLCJmaW5kSW5kZXgiLCJpdGVtIiwib3RoZXJJZHgiLCJyZXMiLCJ0aGlzVGFyZ2V0Iiwib3RoZXJUYXJnZXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0lBQVlBLFE7O0FBQ1o7Ozs7QUFFQTs7Ozs7Ozs7Ozs7Ozs7QUFFQSxTQUFTQyxVQUFULENBQW9CQyxDQUFwQixFQUF1QjtBQUNyQixTQUFTLE9BQU9BLENBQVAsS0FBYSxRQUFkLElBQTRCLENBQUNDLE1BQU1ELENBQU4sQ0FBN0IsSUFBMkNBLE1BQU1FLFFBQVAsR0FBb0JGLE1BQU0sQ0FBQ0UsUUFBN0U7QUFDRDs7QUFFRCxTQUFTQyxTQUFULENBQW1CQyxLQUFuQixFQUEwQkMsR0FBMUIsRUFBK0JDLFNBQS9CLEVBQTBDQyxLQUExQyxFQUFpREMsR0FBakQsRUFBc0Q7QUFDcEQsU0FBT1YsU0FBU1csT0FBVCxHQUNOQyxJQURNLENBQ0QsWUFBTTtBQUNWLFFBQUlGLE1BQU0sQ0FBVixFQUFhO0FBQ1hKLFlBQU1PLElBQU4sQ0FBV04sR0FBWDtBQUNBLGFBQU9FLE1BQU1LLElBQU4sQ0FBV04sU0FBWCxF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b0JwQyxJQUFJQSxFQUF4QixFQUE0QndELFlBQVksQ0FBQzFDLE9BQUQsQ0FBeEMsRUFBckIsRUFBMEV0QyxJQUExRSxDQUErRTtBQUFBLGlCQUFNMkcsR0FBTjtBQUFBLFNBQS9FLENBQVQ7QUFBQSxPQWRDLEVBZU4zRyxJQWZNLENBZUQsVUFBQzJHLEdBQUQ7QUFBQSxlQUFTLE9BQUs1QixlQUFMLENBQXFCLEVBQUU3QixNQUFNQSxLQUFLVSxLQUFiLEVBQW9CcEMsSUFBSU0sT0FBeEIsRUFBaUNrRCxZQUFZLENBQUNZLFNBQUQsQ0FBN0MsRUFBckIsRUFBaUY1RixJQUFqRixDQUFzRjtBQUFBLGlCQUFNMkcsR0FBTjtBQUFBLFNBQXRGLENBQVQ7QUFBQSxPQWZDLENBQVA7QUFnQkQ7Ozs4QkFFU3BCLFEsRUFBVS9ELEUsRUFBSTJELFksRUFBYztBQUNwQyxhQUFVSSxRQUFWLFVBQXNCSix3QkFBc0JBLFlBQXRCLEdBQXVDLFlBQTdELFVBQTZFM0QsRUFBN0U7QUFDRCIsImZpbGUiOiJzdG9yYWdlL2tleVZhbHVlU3RvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgbWVyZ2VPcHRpb25zIGZyb20gJ21lcmdlLW9wdGlvbnMnO1xuXG5pbXBvcnQgeyBTdG9yYWdlIH0gZnJvbSAnLi9zdG9yYWdlJztcblxuZnVuY3Rpb24gc2FuZU51bWJlcihpKSB7XG4gIHJldHVybiAoKHR5cGVvZiBpID09PSAnbnVtYmVyJykgJiYgKCFpc05hTihpKSkgJiYgKGkgIT09IEluZmluaXR5KSAmIChpICE9PSAtSW5maW5pdHkpKTtcbn1cblxuZnVuY3Rpb24gbWF5YmVQdXNoKGFycmF5LCB2YWwsIGtleXN0cmluZywgc3RvcmUsIGlkeCkge1xuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gIC50aGVuKCgpID0+IHtcbiAgICBpZiAoaWR4IDwgMCkge1xuICAgICAgYXJyYXkucHVzaCh2YWwpO1xuICAgICAgcmV0dXJuIHN0b3JlLl9zZXQoa2V5c3RyaW5nLCBKU09OLnN0cmluZ2lmeShhcnJheSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0pO1xufVxuXG5cbmZ1bmN0aW9uIG1heWJlVXBkYXRlKGFycmF5LCB2YWwsIGtleXN0cmluZywgc3RvcmUsIGV4dHJhcywgaWR4KSB7XG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgLnRoZW4oKCkgPT4ge1xuICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgY29uc3QgbW9kaWZpZWRSZWxhdGlvbnNoaXAgPSBtZXJnZU9wdGlvbnMoXG4gICAgICAgIHt9LFxuICAgICAgICBhcnJheVtpZHhdLFxuICAgICAgICBleHRyYXMgPyB7IG1ldGE6IGV4dHJhcyB9IDoge31cbiAgICAgICk7XG4gICAgICBhcnJheVtpZHhdID0gbW9kaWZpZWRSZWxhdGlvbnNoaXA7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgIHJldHVybiBzdG9yZS5fc2V0KGtleXN0cmluZywgSlNPTi5zdHJpbmdpZnkoYXJyYXkpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gbWF5YmVEZWxldGUoYXJyYXksIGlkeCwga2V5c3RyaW5nLCBzdG9yZSkge1xuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gIC50aGVuKCgpID0+IHtcbiAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgIGFycmF5LnNwbGljZShpZHgsIDEpO1xuICAgICAgcmV0dXJuIHN0b3JlLl9zZXQoa2V5c3RyaW5nLCBKU09OLnN0cmluZ2lmeShhcnJheSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBhcHBseURlbHRhKGJhc2UsIGRlbHRhKSB7XG4gIGlmIChkZWx0YS5vcCA9PT0gJ2FkZCcgfHwgZGVsdGEub3AgPT09ICdtb2RpZnknKSB7XG4gICAgY29uc3QgcmV0VmFsID0gbWVyZ2VPcHRpb25zKHt9LCBiYXNlLCBkZWx0YS5kYXRhKTtcbiAgICByZXR1cm4gcmV0VmFsO1xuICB9IGVsc2UgaWYgKGRlbHRhLm9wID09PSAncmVtb3ZlJykge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVJlbGF0aW9uc2hpcChjaGlsZHJlbiwgbWF5YmVCYXNlKSB7XG4gIGNvbnN0IGJhc2UgPSBtYXliZUJhc2UgfHwgW107XG4gIC8vIEluZGV4IGN1cnJlbnQgcmVsYXRpb25zaGlwcyBieSBJRCBmb3IgZWZmaWNpZW50IG1vZGlmaWNhdGlvblxuICBjb25zdCB1cGRhdGVzID0gYmFzZS5tYXAocmVsID0+IHtcbiAgICByZXR1cm4geyBbcmVsLmlkXTogcmVsIH07XG4gIH0pLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBtZXJnZU9wdGlvbnMoYWNjLCBjdXJyKSwge30pO1xuXG4gIC8vIEFwcGx5IGFueSBjaGlsZHJlbiBpbiBkaXJ0eSBjYWNoZSBvbiB0b3Agb2YgdXBkYXRlc1xuICBjaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IHtcbiAgICBpZiAoY2hpbGQub3ApIHtcbiAgICAgIGNvbnN0IGNoaWxkSWQgPSBjaGlsZC5kYXRhLmlkO1xuICAgICAgdXBkYXRlc1tjaGlsZElkXSA9IGFwcGx5RGVsdGEodXBkYXRlc1tjaGlsZElkXSwgY2hpbGQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVzW2NoaWxkLmlkXSA9IGNoaWxkO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gQ29sbGFwc2UgdXBkYXRlcyBiYWNrIGludG8gbGlzdCwgb21pdHRpbmcgdW5kZWZpbmVkc1xuICByZXR1cm4gT2JqZWN0LmtleXModXBkYXRlcylcbiAgICAubWFwKGlkID0+IHVwZGF0ZXNbaWRdKVxuICAgIC5maWx0ZXIocmVsID0+IHJlbCAhPT0gdW5kZWZpbmVkKVxuICAgIC5yZWR1Y2UoKGFjYywgY3VycikgPT4gYWNjLmNvbmNhdChjdXJyKSwgW10pO1xufVxuXG4vLyBUT0RPXG5mdW5jdGlvbiByZXNvbHZlUmVsYXRpb25zaGlwcyhzY2hlbWEsIGRlbHRhcywgYmFzZSA9IHt9KSB7XG4gIGNvbnN0IHVwZGF0ZXMgPSB7fTtcbiAgZm9yIChjb25zdCByZWxOYW1lIGluIGRlbHRhcykge1xuICAgIGlmIChyZWxOYW1lIGluIHNjaGVtYS5yZWxhdGlvbnNoaXBzKSB7XG4gICAgICB1cGRhdGVzW3JlbE5hbWVdID0gcmVzb2x2ZVJlbGF0aW9uc2hpcChkZWx0YXNbcmVsTmFtZV0sIGJhc2VbcmVsTmFtZV0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbWVyZ2VPcHRpb25zKHt9LCBiYXNlLCB1cGRhdGVzKTtcbn1cblxuXG5leHBvcnQgY2xhc3MgS2V5VmFsdWVTdG9yZSBleHRlbmRzIFN0b3JhZ2Uge1xuICAkJG1heEtleSh0KSB7XG4gICAgcmV0dXJuIHRoaXMuX2tleXModClcbiAgICAudGhlbigoa2V5QXJyYXkpID0+IHtcbiAgICAgIGlmIChrZXlBcnJheS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ga2V5QXJyYXkubWFwKChrKSA9PiBrLnNwbGl0KCc6JylbMl0pXG4gICAgICAgIC5tYXAoKGspID0+IHBhcnNlSW50KGssIDEwKSlcbiAgICAgICAgLmZpbHRlcigoaSkgPT4gc2FuZU51bWJlcihpKSlcbiAgICAgICAgLnJlZHVjZSgobWF4LCBjdXJyZW50KSA9PiAoY3VycmVudCA+IG1heCkgPyBjdXJyZW50IDogbWF4LCAwKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHdyaXRlKHR5cGUsIHYpIHtcbiAgICBjb25zdCB0ID0gdGhpcy5nZXRUeXBlKHR5cGUpO1xuICAgIGNvbnN0IGlkID0gdi5pZCB8fCB2W3QuJHNjaGVtYS4kaWRdO1xuICAgIGlmICgoaWQgPT09IHVuZGVmaW5lZCkgfHwgKGlkID09PSBudWxsKSkge1xuICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlTmV3KHQsIHYpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5vdmVyd3JpdGUodCwgaWQsIHYpO1xuICAgIH1cbiAgfVxuXG4gIGNyZWF0ZU5ldyh0eXBlLCB2KSB7XG4gICAgY29uc3QgdCA9IHRoaXMuZ2V0VHlwZSh0eXBlKTtcbiAgICBjb25zdCB0b1NhdmUgPSBtZXJnZU9wdGlvbnMoe30sIHYpO1xuICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICByZXR1cm4gdGhpcy4kJG1heEtleSh0LiRuYW1lKVxuICAgICAgLnRoZW4oKG4pID0+IHtcbiAgICAgICAgY29uc3QgaWQgPSBuICsgMTtcbiAgICAgICAgdG9TYXZlLmlkID0gaWQ7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICAgIHRoaXMud3JpdGVBdHRyaWJ1dGVzKHQsIGlkLCB0b1NhdmUuYXR0cmlidXRlcyksXG4gICAgICAgICAgdGhpcy53cml0ZVJlbGF0aW9uc2hpcHModCwgaWQsIHRvU2F2ZS5yZWxhdGlvbnNoaXBzKSxcbiAgICAgICAgXSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubm90aWZ5VXBkYXRlKHQsIHRvU2F2ZVt0LiRpZF0sIHtcbiAgICAgICAgICAgIFt0LiRzY2hlbWEuJGlkXTogaWQsXG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiB0b1NhdmUuYXR0cmlidXRlcyxcbiAgICAgICAgICAgIHJlbGF0aW9uc2hpcHM6IHJlc29sdmVSZWxhdGlvbnNoaXBzKHQuJHNjaGVtYSwgdG9TYXZlLnJlbGF0aW9uc2hpcHMpLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB0b1NhdmUpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBuZXcgY29udGVudCBpbiBhIG5vbi10ZXJtaW5hbCBzdG9yZScpO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJ3cml0ZSh0eXBlLCBpZCwgdikge1xuICAgIGNvbnN0IHQgPSB0aGlzLmdldFR5cGUodHlwZSk7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpKSxcbiAgICAgIHRoaXMucmVhZFJlbGF0aW9uc2hpcHModCwgaWQsIE9iamVjdC5rZXlzKHYucmVsYXRpb25zaGlwcykpLFxuICAgIF0pLnRoZW4oKFtvcmlnQXR0cmlidXRlcywgb3JpZ1JlbGF0aW9uc2hpcHNdKSA9PiB7XG4gICAgICBjb25zdCB1cGRhdGVkQXR0cmlidXRlcyA9IE9iamVjdC5hc3NpZ24oe30sIEpTT04ucGFyc2Uob3JpZ0F0dHJpYnV0ZXMpLCB2LmF0dHJpYnV0ZXMpO1xuICAgICAgY29uc3QgdXBkYXRlZFJlbGF0aW9uc2hpcHMgPSByZXNvbHZlUmVsYXRpb25zaGlwcyh0LiRzY2hlbWEsIHYucmVsYXRpb25zaGlwcywgb3JpZ1JlbGF0aW9uc2hpcHMpO1xuICAgICAgY29uc3QgdXBkYXRlZCA9IHsgaWQsIGF0dHJpYnV0ZXM6IHVwZGF0ZWRBdHRyaWJ1dGVzLCByZWxhdGlvbnNoaXBzOiB1cGRhdGVkUmVsYXRpb25zaGlwcyB9O1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIHRoaXMud3JpdGVBdHRyaWJ1dGVzKHQsIGlkLCB1cGRhdGVkQXR0cmlidXRlcyksXG4gICAgICAgIHRoaXMud3JpdGVSZWxhdGlvbnNoaXBzKHQsIGlkLCB1cGRhdGVkUmVsYXRpb25zaGlwcyksXG4gICAgICBdKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5ub3RpZnlVcGRhdGUodCwgaWQsIHVwZGF0ZWQpO1xuICAgICAgfSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHVwZGF0ZWQ7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHdyaXRlQXR0cmlidXRlcyh0eXBlLCBpZCwgYXR0cmlidXRlcykge1xuICAgIGNvbnN0IHQgPSB0aGlzLmdldFR5cGUodHlwZSk7XG4gICAgY29uc3QgJGlkID0gYXR0cmlidXRlcy5pZCA/ICdpZCcgOiB0LiRzY2hlbWEuJGlkO1xuICAgIGNvbnN0IHRvV3JpdGUgPSBtZXJnZU9wdGlvbnMoe30sIGF0dHJpYnV0ZXMsIHsgWyRpZF06IGlkIH0pO1xuICAgIHJldHVybiB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpLCBKU09OLnN0cmluZ2lmeSh0b1dyaXRlKSlcbiAgICAudGhlbigodikgPT4ge1xuICAgICAgdGhpcy5maXJlV3JpdGVVcGRhdGUoe1xuICAgICAgICB0eXBlOiB0LiRuYW1lLFxuICAgICAgICBpZDogaWQsXG4gICAgICAgIGludmFsaWRhdGU6IFsnYXR0cmlidXRlcyddLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gdjtcbiAgICB9KTtcbiAgfVxuXG4gIHdyaXRlUmVsYXRpb25zaGlwcyh0eXBlLCBpZCwgcmVsYXRpb25zaGlwcykge1xuICAgIGNvbnN0IHQgPSB0aGlzLmdldFR5cGUodHlwZSk7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHJlbGF0aW9uc2hpcHMpLm1hcChyZWxOYW1lID0+IHtcbiAgICAgIHJldHVybiB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQsIHJlbE5hbWUpLCBKU09OLnN0cmluZ2lmeShyZWxhdGlvbnNoaXBzW3JlbE5hbWVdKSk7XG4gICAgfSkucmVkdWNlKCh0aGVuYWJsZSwgY3VycikgPT4gdGhlbmFibGUudGhlbigoKSA9PiBjdXJyKSwgQmx1ZWJpcmQucmVzb2x2ZSgpKTtcbiAgfVxuXG4gIHJlYWRBdHRyaWJ1dGVzKHR5cGUsIGlkKSB7XG4gICAgY29uc3QgdCA9IHRoaXMuZ2V0VHlwZSh0eXBlKTtcbiAgICByZXR1cm4gdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkKSlcbiAgICAudGhlbihkID0+IEpTT04ucGFyc2UoZCkpO1xuICB9XG5cbiAgcmVhZFJlbGF0aW9uc2hpcCh0eXBlLCBpZCwgcmVsYXRpb25zaGlwKSB7XG4gICAgY29uc3QgdCA9IHRoaXMuZ2V0VHlwZSh0eXBlKTtcbiAgICByZXR1cm4gdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkLCByZWxhdGlvbnNoaXApKVxuICAgIC50aGVuKChhcnJheVN0cmluZykgPT4ge1xuICAgICAgcmV0dXJuIHsgW3JlbGF0aW9uc2hpcF06IEpTT04ucGFyc2UoYXJyYXlTdHJpbmcpIHx8IFtdIH07XG4gICAgfSk7XG4gIH1cblxuICBkZWxldGUodHlwZSwgaWQpIHtcbiAgICBjb25zdCB0ID0gdGhpcy5nZXRUeXBlKHR5cGUpO1xuICAgIHJldHVybiB0aGlzLl9kZWwodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpKTtcbiAgfVxuXG4gIHdpcGUodHlwZSwgaWQsIGZpZWxkKSB7XG4gICAgY29uc3QgdCA9IHRoaXMuZ2V0VHlwZSh0eXBlKTtcbiAgICBpZiAoZmllbGQgPT09ICdhdHRyaWJ1dGVzJykge1xuICAgICAgcmV0dXJuIHRoaXMuX2RlbCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5fZGVsKHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkLCBmaWVsZCkpO1xuICAgIH1cbiAgfVxuXG4gIGFkZCh0eXBlTmFtZSwgaWQsIHJlbE5hbWUsIGNoaWxkSWQsIGV4dHJhcyA9IHt9KSB7XG4gICAgY29uc3QgdHlwZSA9IHRoaXMuZ2V0VHlwZSh0eXBlTmFtZSk7XG4gICAgY29uc3QgcmVsYXRpb25zaGlwQmxvY2sgPSB0eXBlLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxOYW1lXS50eXBlO1xuICAgIGNvbnN0IHRoaXNUeXBlID0gdHlwZS4kbmFtZTtcbiAgICBjb25zdCBvdGhlclR5cGUgPSByZWxhdGlvbnNoaXBCbG9jay4kc2lkZXNbcmVsTmFtZV0ub3RoZXJUeXBlO1xuICAgIGNvbnN0IG90aGVyTmFtZSA9IHJlbGF0aW9uc2hpcEJsb2NrLiRzaWRlc1tyZWxOYW1lXS5vdGhlck5hbWU7XG4gICAgY29uc3QgdGhpc0tleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHRoaXNUeXBlLCBpZCwgcmVsTmFtZSk7XG4gICAgY29uc3Qgb3RoZXJLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyhvdGhlclR5cGUsIGNoaWxkSWQsIG90aGVyTmFtZSk7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICB0aGlzLl9nZXQodGhpc0tleVN0cmluZyksXG4gICAgICB0aGlzLl9nZXQob3RoZXJLZXlTdHJpbmcpLFxuICAgIF0pXG4gICAgLnRoZW4oKFt0aGlzQXJyYXlTdHJpbmcsIG90aGVyQXJyYXlTdHJpbmddKSA9PiB7XG4gICAgICBjb25zdCB0aGlzQXJyYXkgPSBKU09OLnBhcnNlKHRoaXNBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCBvdGhlckFycmF5ID0gSlNPTi5wYXJzZShvdGhlckFycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IG5ld0NoaWxkID0geyBpZDogY2hpbGRJZCB9O1xuICAgICAgY29uc3QgbmV3UGFyZW50ID0geyBpZCB9O1xuICAgICAgaWYgKHJlbGF0aW9uc2hpcEJsb2NrLiRleHRyYXMpIHtcbiAgICAgICAgbmV3Q2hpbGQubWV0YSA9IG5ld0NoaWxkLm1ldGEgfHwge307XG4gICAgICAgIG5ld1BhcmVudC5tZXRhID0gbmV3UGFyZW50Lm1ldGEgfHwge307XG4gICAgICAgIGZvciAoY29uc3QgZXh0cmEgaW4gZXh0cmFzKSB7XG4gICAgICAgICAgaWYgKGV4dHJhIGluIHJlbGF0aW9uc2hpcEJsb2NrLiRleHRyYXMpIHtcbiAgICAgICAgICAgIG5ld0NoaWxkLm1ldGFbZXh0cmFdID0gZXh0cmFzW2V4dHJhXTtcbiAgICAgICAgICAgIG5ld1BhcmVudC5tZXRhW2V4dHJhXSA9IGV4dHJhc1tleHRyYV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCB0aGlzSWR4ID0gdGhpc0FycmF5LmZpbmRJbmRleChpdGVtID0+IGl0ZW0uaWQgPT09IGNoaWxkSWQpO1xuICAgICAgY29uc3Qgb3RoZXJJZHggPSBvdGhlckFycmF5LmZpbmRJbmRleChpdGVtID0+IGl0ZW0uaWQgPT09IGlkKTtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICBtYXliZVB1c2godGhpc0FycmF5LCBuZXdDaGlsZCwgdGhpc0tleVN0cmluZywgdGhpcywgdGhpc0lkeCksXG4gICAgICAgIG1heWJlUHVzaChvdGhlckFycmF5LCBuZXdQYXJlbnQsIG90aGVyS2V5U3RyaW5nLCB0aGlzLCBvdGhlcklkeCksXG4gICAgICBdKVxuICAgICAgLnRoZW4oKHJlcykgPT4gdGhpcy5maXJlV3JpdGVVcGRhdGUoeyB0eXBlOiB0eXBlLiRuYW1lLCBpZDogaWQsIGludmFsaWRhdGU6IFtyZWxOYW1lXSB9KS50aGVuKCgpID0+IHJlcykpXG4gICAgICAudGhlbigocmVzKSA9PiB0aGlzLmZpcmVXcml0ZVVwZGF0ZSh7IHR5cGU6IHR5cGUuJG5hbWUsIGlkOiBjaGlsZElkLCBpbnZhbGlkYXRlOiBbb3RoZXJOYW1lXSB9KS50aGVuKCgpID0+IHJlcykpXG4gICAgICAudGhlbigoKSA9PiB0aGlzQXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKHR5cGVOYW1lLCBpZCwgcmVsTmFtZSwgY2hpbGRJZCwgZXh0cmFzKSB7XG4gICAgY29uc3QgdHlwZSA9IHRoaXMuZ2V0VHlwZSh0eXBlTmFtZSk7XG4gICAgY29uc3QgcmVsYXRpb25zaGlwQmxvY2sgPSB0eXBlLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxOYW1lXS50eXBlO1xuICAgIGNvbnN0IHRoaXNUeXBlID0gdHlwZS4kbmFtZTtcbiAgICBjb25zdCBvdGhlclR5cGUgPSByZWxhdGlvbnNoaXBCbG9jay4kc2lkZXNbcmVsTmFtZV0ub3RoZXJUeXBlO1xuICAgIGNvbnN0IG90aGVyTmFtZSA9IHJlbGF0aW9uc2hpcEJsb2NrLiRzaWRlc1tyZWxOYW1lXS5vdGhlck5hbWU7XG4gICAgY29uc3QgdGhpc0tleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHRoaXNUeXBlLCBpZCwgcmVsTmFtZSk7XG4gICAgY29uc3Qgb3RoZXJLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyhvdGhlclR5cGUsIGNoaWxkSWQsIG90aGVyTmFtZSk7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICB0aGlzLl9nZXQodGhpc0tleVN0cmluZyksXG4gICAgICB0aGlzLl9nZXQob3RoZXJLZXlTdHJpbmcpLFxuICAgIF0pXG4gICAgLnRoZW4oKFt0aGlzQXJyYXlTdHJpbmcsIG90aGVyQXJyYXlTdHJpbmddKSA9PiB7XG4gICAgICBjb25zdCB0aGlzQXJyYXkgPSBKU09OLnBhcnNlKHRoaXNBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCBvdGhlckFycmF5ID0gSlNPTi5wYXJzZShvdGhlckFycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IHRoaXNUYXJnZXQgPSB7IGlkOiBjaGlsZElkIH07XG4gICAgICBjb25zdCBvdGhlclRhcmdldCA9IHsgaWQgfTtcbiAgICAgIGNvbnN0IHRoaXNJZHggPSB0aGlzQXJyYXkuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gY2hpbGRJZCk7XG4gICAgICBjb25zdCBvdGhlcklkeCA9IG90aGVyQXJyYXkuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gaWQpO1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIG1heWJlVXBkYXRlKHRoaXNBcnJheSwgdGhpc1RhcmdldCwgdGhpc0tleVN0cmluZywgdGhpcywgZXh0cmFzLCB0aGlzSWR4KSxcbiAgICAgICAgbWF5YmVVcGRhdGUob3RoZXJBcnJheSwgb3RoZXJUYXJnZXQsIG90aGVyS2V5U3RyaW5nLCB0aGlzLCBleHRyYXMsIG90aGVySWR4KSxcbiAgICAgIF0pO1xuICAgIH0pXG4gICAgLnRoZW4oKHJlcykgPT4gdGhpcy5maXJlV3JpdGVVcGRhdGUoeyB0eXBlOiB0eXBlLiRuYW1lLCBpZDogaWQsIGludmFsaWRhdGU6IFtyZWxOYW1lXSB9KS50aGVuKCgpID0+IHJlcykpXG4gICAgLnRoZW4oKHJlcykgPT4gdGhpcy5maXJlV3JpdGVVcGRhdGUoeyB0eXBlOiB0eXBlLiRuYW1lLCBpZDogY2hpbGRJZCwgaW52YWxpZGF0ZTogW290aGVyTmFtZV0gfSkudGhlbigoKSA9PiByZXMpKTtcbiAgfVxuXG4gIHJlbW92ZSh0eXBlTmFtZSwgaWQsIHJlbE5hbWUsIGNoaWxkSWQpIHtcbiAgICBjb25zdCB0eXBlID0gdGhpcy5nZXRUeXBlKHR5cGVOYW1lKTtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBCbG9jayA9IHR5cGUuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnR5cGU7XG4gICAgY29uc3QgdGhpc1R5cGUgPSB0eXBlLiRuYW1lO1xuICAgIGNvbnN0IG90aGVyVHlwZSA9IHJlbGF0aW9uc2hpcEJsb2NrLiRzaWRlc1tyZWxOYW1lXS5vdGhlclR5cGU7XG4gICAgY29uc3Qgb3RoZXJOYW1lID0gcmVsYXRpb25zaGlwQmxvY2suJHNpZGVzW3JlbE5hbWVdLm90aGVyTmFtZTtcbiAgICBjb25zdCB0aGlzS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcodGhpc1R5cGUsIGlkLCByZWxOYW1lKTtcbiAgICBjb25zdCBvdGhlcktleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKG90aGVyVHlwZSwgY2hpbGRJZCwgb3RoZXJOYW1lKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgIHRoaXMuX2dldCh0aGlzS2V5U3RyaW5nKSxcbiAgICAgIHRoaXMuX2dldChvdGhlcktleVN0cmluZyksXG4gICAgXSlcbiAgICAudGhlbigoW3RoaXNBcnJheVN0cmluZywgb3RoZXJBcnJheVN0cmluZ10pID0+IHtcbiAgICAgIGNvbnN0IHRoaXNBcnJheSA9IEpTT04ucGFyc2UodGhpc0FycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IG90aGVyQXJyYXkgPSBKU09OLnBhcnNlKG90aGVyQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3QgdGhpc0lkeCA9IHRoaXNBcnJheS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSBjaGlsZElkKTtcbiAgICAgIGNvbnN0IG90aGVySWR4ID0gb3RoZXJBcnJheS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSBpZCk7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgbWF5YmVEZWxldGUodGhpc0FycmF5LCB0aGlzSWR4LCB0aGlzS2V5U3RyaW5nLCB0aGlzKSxcbiAgICAgICAgbWF5YmVEZWxldGUob3RoZXJBcnJheSwgb3RoZXJJZHgsIG90aGVyS2V5U3RyaW5nLCB0aGlzKSxcbiAgICAgIF0pO1xuICAgIH0pXG4gICAgLnRoZW4oKHJlcykgPT4gdGhpcy5maXJlV3JpdGVVcGRhdGUoeyB0eXBlOiB0eXBlLiRuYW1lLCBpZDogaWQsIGludmFsaWRhdGU6IFtyZWxOYW1lXSB9KS50aGVuKCgpID0+IHJlcykpXG4gICAgLnRoZW4oKHJlcykgPT4gdGhpcy5maXJlV3JpdGVVcGRhdGUoeyB0eXBlOiB0eXBlLiRuYW1lLCBpZDogY2hpbGRJZCwgaW52YWxpZGF0ZTogW290aGVyTmFtZV0gfSkudGhlbigoKSA9PiByZXMpKTtcbiAgfVxuXG4gIGtleVN0cmluZyh0eXBlTmFtZSwgaWQsIHJlbGF0aW9uc2hpcCkge1xuICAgIHJldHVybiBgJHt0eXBlTmFtZX06JHtyZWxhdGlvbnNoaXAgPyBgcmVsLiR7cmVsYXRpb25zaGlwfWAgOiAnYXR0cmlidXRlcyd9OiR7aWR9YDtcbiAgfVxufVxuIl19
