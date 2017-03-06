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
      var _this6 = this;

      var extras = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

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
      return Bluebird.all([this._get(thisKeyString), this._get(otherKeyString)]).then(function (_ref8) {
        var _ref9 = _slicedToArray(_ref8, 2),
            thisArrayString = _ref9[0],
            otherArrayString = _ref9[1];

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
      return Bluebird.all([this._get(thisKeyString), this._get(otherKeyString)]).then(function (_ref10) {
        var _ref11 = _slicedToArray(_ref10, 2),
            thisArrayString = _ref11[0],
            otherArrayString = _ref11[1];

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uva2V5VmFsdWVTdG9yZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsInNhbmVOdW1iZXIiLCJpIiwiaXNOYU4iLCJJbmZpbml0eSIsIm1heWJlUHVzaCIsImFycmF5IiwidmFsIiwia2V5c3RyaW5nIiwic3RvcmUiLCJpZHgiLCJyZXNvbHZlIiwidGhlbiIsInB1c2giLCJfc2V0IiwiSlNPTiIsInN0cmluZ2lmeSIsIm1heWJlVXBkYXRlIiwiZXh0cmFzIiwibW9kaWZpZWRSZWxhdGlvbnNoaXAiLCJtZXRhIiwibWF5YmVEZWxldGUiLCJzcGxpY2UiLCJhcHBseURlbHRhIiwiYmFzZSIsImRlbHRhIiwib3AiLCJyZXRWYWwiLCJkYXRhIiwidW5kZWZpbmVkIiwicmVzb2x2ZVJlbGF0aW9uc2hpcCIsImRlbHRhcyIsIm1heWJlQmFzZSIsInVwZGF0ZXMiLCJtYXAiLCJyZWwiLCJpZCIsInJlZHVjZSIsImFjYyIsImN1cnIiLCJmb3JFYWNoIiwiY2hpbGRJZCIsIk9iamVjdCIsImtleXMiLCJmaWx0ZXIiLCJjb25jYXQiLCJyZXNvbHZlUmVsYXRpb25zaGlwcyIsInNjaGVtYSIsInJlbE5hbWUiLCJyZWxhdGlvbnNoaXBzIiwiS2V5VmFsdWVTdG9yZSIsInQiLCJfa2V5cyIsImtleUFycmF5IiwibGVuZ3RoIiwiayIsInNwbGl0IiwicGFyc2VJbnQiLCJtYXgiLCJjdXJyZW50Iiwib3B0cyIsIkFycmF5IiwiaXNBcnJheSIsImFsbCIsIl9nZXQiLCJrZXlTdHJpbmciLCIkbmFtZSIsInBhcnNlIiwicmVsTGlzdCIsInYiLCIkc2NoZW1hIiwiJGlkIiwiY3JlYXRlTmV3Iiwib3ZlcndyaXRlIiwidG9TYXZlIiwidGVybWluYWwiLCIkJG1heEtleSIsIm4iLCJ3cml0ZUF0dHJpYnV0ZXMiLCJhdHRyaWJ1dGVzIiwid3JpdGVSZWxhdGlvbnNoaXBzIiwibm90aWZ5VXBkYXRlIiwiRXJyb3IiLCJnZXRSZWxhdGlvbnNoaXBzIiwib3JpZ0F0dHJpYnV0ZXMiLCJvcmlnUmVsYXRpb25zaGlwcyIsInVwZGF0ZWRBdHRyaWJ1dGVzIiwiYXNzaWduIiwidXBkYXRlZFJlbGF0aW9uc2hpcHMiLCJ1cGRhdGVkIiwidG9Xcml0ZSIsInRoZW5hYmxlIiwiZCIsInJlbGF0aW9uc2hpcCIsImFycmF5U3RyaW5nIiwiX2RlbCIsImZpZWxkIiwidHlwZSIsInJlbGF0aW9uc2hpcEJsb2NrIiwidGhpc1R5cGUiLCJvdGhlclR5cGUiLCIkc2lkZXMiLCJvdGhlck5hbWUiLCJ0aGlzS2V5U3RyaW5nIiwib3RoZXJLZXlTdHJpbmciLCJ0aGlzQXJyYXlTdHJpbmciLCJvdGhlckFycmF5U3RyaW5nIiwidGhpc0FycmF5Iiwib3RoZXJBcnJheSIsIm5ld0NoaWxkIiwibmV3UGFyZW50IiwiJGV4dHJhcyIsImV4dHJhIiwidGhpc0lkeCIsImZpbmRJbmRleCIsIml0ZW0iLCJvdGhlcklkeCIsInRoaXNUYXJnZXQiLCJvdGhlclRhcmdldCIsInJlcyIsInR5cGVOYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztJQUFZQSxROztBQUNaOzs7O0FBRUE7Ozs7Ozs7Ozs7Ozs7O0FBRUEsU0FBU0MsVUFBVCxDQUFvQkMsQ0FBcEIsRUFBdUI7QUFDckIsU0FBUyxPQUFPQSxDQUFQLEtBQWEsUUFBZCxJQUE0QixDQUFDQyxNQUFNRCxDQUFOLENBQTdCLElBQTJDQSxNQUFNRSxRQUFQLEdBQW9CRixNQUFNLENBQUNFLFFBQTdFO0FBQ0Q7O0FBRUQsU0FBU0MsU0FBVCxDQUFtQkMsS0FBbkIsRUFBMEJDLEdBQTFCLEVBQStCQyxTQUEvQixFQUEwQ0MsS0FBMUMsRUFBaURDLEdBQWpELEVBQXNEO0FBQ3BELFNBQU9WLFNBQVNXLE9BQVQsR0FDTkMsSUFETSxDQUNELFlBQU07QUFDVixRQUFJRixNQUFNLENBQVYsRUFBYTtBQUNYSixZQUFNTyxJQUFOLENBQVdOLEdBQVg7QUFDQSxhQUFPRSxNQUFNSyxJQUFOLENBQVdOLFNBQVgsRUFBc0JPLEtBQUtDLFNBQUwsQ0FBZVYsS0FB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b0I7QUFBQSxpQkFBUUMsS0FBSy9FLEVBQUwsS0FBWUssT0FBcEI7QUFBQSxTQUFwQixDQUFoQjtBQUNBLFlBQU0yRSxXQUFXUixXQUFXTSxTQUFYLENBQXFCO0FBQUEsaUJBQVFDLEtBQUsvRSxFQUFMLEtBQVlBLEVBQXBCO0FBQUEsU0FBckIsQ0FBakI7QUFDQSxlQUFPcEMsU0FBUytELEdBQVQsQ0FBYSxDQUNsQjFDLFlBQVlzRixTQUFaLEVBQXVCTSxPQUF2QixFQUFnQ1YsYUFBaEMsU0FEa0IsRUFFbEJsRixZQUFZdUYsVUFBWixFQUF3QlEsUUFBeEIsRUFBa0NaLGNBQWxDLFNBRmtCLENBQWIsQ0FBUDtBQUlELE9BYk0sRUFjTjVGLElBZE0sQ0FjRCxVQUFDMkcsR0FBRDtBQUFBLGVBQVMsT0FBS3RDLFlBQUwsQ0FBa0JnQixJQUFsQixFQUF3QjdELEVBQXhCLEVBQTRCLElBQTVCLEVBQWtDWSxPQUFsQyxFQUEyQ3BDLElBQTNDLENBQWdEO0FBQUEsaUJBQU0yRyxHQUFOO0FBQUEsU0FBaEQsQ0FBVDtBQUFBLE9BZEMsRUFlTjNHLElBZk0sQ0FlRCxVQUFDMkcsR0FBRDtBQUFBLGVBQVMsT0FBS3RDLFlBQUwsQ0FBa0JnQixJQUFsQixFQUF3QnhELE9BQXhCLEVBQWlDLElBQWpDLEVBQXVDNkQsU0FBdkMsRUFBa0QxRixJQUFsRCxDQUF1RDtBQUFBLGlCQUFNMkcsR0FBTjtBQUFBLFNBQXZELENBQVQ7QUFBQSxPQWZDLENBQVA7QUFnQkQ7Ozs4QkFFU0MsUSxFQUFVcEYsRSxFQUFJeUQsWSxFQUFjO0FBQ3BDLGFBQVUyQixRQUFWLFVBQXNCM0Isd0JBQXNCQSxZQUF0QixHQUF1QyxZQUE3RCxVQUE2RXpELEVBQTdFO0FBQ0QiLCJmaWxlIjoic3RvcmFnZS9rZXlWYWx1ZVN0b3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcblxuaW1wb3J0IHsgU3RvcmFnZSB9IGZyb20gJy4vc3RvcmFnZSc7XG5cbmZ1bmN0aW9uIHNhbmVOdW1iZXIoaSkge1xuICByZXR1cm4gKCh0eXBlb2YgaSA9PT0gJ251bWJlcicpICYmICghaXNOYU4oaSkpICYmIChpICE9PSBJbmZpbml0eSkgJiAoaSAhPT0gLUluZmluaXR5KSk7XG59XG5cbmZ1bmN0aW9uIG1heWJlUHVzaChhcnJheSwgdmFsLCBrZXlzdHJpbmcsIHN0b3JlLCBpZHgpIHtcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAudGhlbigoKSA9PiB7XG4gICAgaWYgKGlkeCA8IDApIHtcbiAgICAgIGFycmF5LnB1c2godmFsKTtcbiAgICAgIHJldHVybiBzdG9yZS5fc2V0KGtleXN0cmluZywgSlNPTi5zdHJpbmdpZnkoYXJyYXkpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9KTtcbn1cblxuXG5mdW5jdGlvbiBtYXliZVVwZGF0ZShhcnJheSwgdmFsLCBrZXlzdHJpbmcsIHN0b3JlLCBleHRyYXMsIGlkeCkge1xuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gIC50aGVuKCgpID0+IHtcbiAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgIGNvbnN0IG1vZGlmaWVkUmVsYXRpb25zaGlwID0gbWVyZ2VPcHRpb25zKFxuICAgICAgICB7fSxcbiAgICAgICAgYXJyYXlbaWR4XSxcbiAgICAgICAgZXh0cmFzID8geyBtZXRhOiBleHRyYXMgfSA6IHt9XG4gICAgICApO1xuICAgICAgYXJyYXlbaWR4XSA9IG1vZGlmaWVkUmVsYXRpb25zaGlwOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICByZXR1cm4gc3RvcmUuX3NldChrZXlzdHJpbmcsIEpTT04uc3RyaW5naWZ5KGFycmF5KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG1heWJlRGVsZXRlKGFycmF5LCBpZHgsIGtleXN0cmluZywgc3RvcmUpIHtcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAudGhlbigoKSA9PiB7XG4gICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICBhcnJheS5zcGxpY2UoaWR4LCAxKTtcbiAgICAgIHJldHVybiBzdG9yZS5fc2V0KGtleXN0cmluZywgSlNPTi5zdHJpbmdpZnkoYXJyYXkpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gYXBwbHlEZWx0YShiYXNlLCBkZWx0YSkge1xuICBpZiAoZGVsdGEub3AgPT09ICdhZGQnIHx8IGRlbHRhLm9wID09PSAnbW9kaWZ5Jykge1xuICAgIGNvbnN0IHJldFZhbCA9IG1lcmdlT3B0aW9ucyh7fSwgYmFzZSwgZGVsdGEuZGF0YSk7XG4gICAgcmV0dXJuIHJldFZhbDtcbiAgfSBlbHNlIGlmIChkZWx0YS5vcCA9PT0gJ3JlbW92ZScpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVSZWxhdGlvbnNoaXAoZGVsdGFzLCBtYXliZUJhc2UpIHtcbiAgY29uc3QgYmFzZSA9IG1heWJlQmFzZSB8fCBbXTtcbiAgLy8gSW5kZXggY3VycmVudCByZWxhdGlvbnNoaXBzIGJ5IElEIGZvciBlZmZpY2llbnQgbW9kaWZpY2F0aW9uXG4gIGNvbnN0IHVwZGF0ZXMgPSBiYXNlLm1hcChyZWwgPT4ge1xuICAgIHJldHVybiB7IFtyZWwuaWRdOiByZWwgfTtcbiAgfSkucmVkdWNlKChhY2MsIGN1cnIpID0+IG1lcmdlT3B0aW9ucyhhY2MsIGN1cnIpLCB7fSk7XG5cbiAgLy8gQXBwbHkgYW55IGRlbHRhcyBpbiBkaXJ0eSBjYWNoZSBvbiB0b3Agb2YgdXBkYXRlc1xuICBkZWx0YXMuZm9yRWFjaChkZWx0YSA9PiB7XG4gICAgY29uc3QgY2hpbGRJZCA9IGRlbHRhLmRhdGEuaWQ7XG4gICAgdXBkYXRlc1tjaGlsZElkXSA9IGFwcGx5RGVsdGEodXBkYXRlc1tjaGlsZElkXSwgZGVsdGEpO1xuICB9KTtcblxuICAvLyBDb2xsYXBzZSB1cGRhdGVzIGJhY2sgaW50byBsaXN0LCBvbWl0dGluZyB1bmRlZmluZWRzXG4gIHJldHVybiBPYmplY3Qua2V5cyh1cGRhdGVzKVxuICAgIC5tYXAoaWQgPT4gdXBkYXRlc1tpZF0pXG4gICAgLmZpbHRlcihyZWwgPT4gcmVsICE9PSB1bmRlZmluZWQpXG4gICAgLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBhY2MuY29uY2F0KGN1cnIpLCBbXSk7XG59XG5cbi8vIFRPRE9cbmZ1bmN0aW9uIHJlc29sdmVSZWxhdGlvbnNoaXBzKHNjaGVtYSwgZGVsdGFzLCBiYXNlID0ge30pIHtcbiAgY29uc3QgdXBkYXRlcyA9IHt9O1xuICBmb3IgKGNvbnN0IHJlbE5hbWUgaW4gZGVsdGFzKSB7XG4gICAgaWYgKHJlbE5hbWUgaW4gc2NoZW1hLnJlbGF0aW9uc2hpcHMpIHtcbiAgICAgIHVwZGF0ZXNbcmVsTmFtZV0gPSByZXNvbHZlUmVsYXRpb25zaGlwKGRlbHRhc1tyZWxOYW1lXSwgYmFzZVtyZWxOYW1lXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBtZXJnZU9wdGlvbnMoe30sIGJhc2UsIHVwZGF0ZXMpO1xufVxuXG5cbmV4cG9ydCBjbGFzcyBLZXlWYWx1ZVN0b3JlIGV4dGVuZHMgU3RvcmFnZSB7XG4gICQkbWF4S2V5KHQpIHtcbiAgICByZXR1cm4gdGhpcy5fa2V5cyh0KVxuICAgIC50aGVuKChrZXlBcnJheSkgPT4ge1xuICAgICAgaWYgKGtleUFycmF5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBrZXlBcnJheS5tYXAoKGspID0+IGsuc3BsaXQoJzonKVsyXSlcbiAgICAgICAgLm1hcCgoaykgPT4gcGFyc2VJbnQoaywgMTApKVxuICAgICAgICAuZmlsdGVyKChpKSA9PiBzYW5lTnVtYmVyKGkpKVxuICAgICAgICAucmVkdWNlKChtYXgsIGN1cnJlbnQpID0+IChjdXJyZW50ID4gbWF4KSA/IGN1cnJlbnQgOiBtYXgsIDApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZ2V0UmVsYXRpb25zaGlwcyh0LCBpZCwgb3B0cykge1xuICAgIGNvbnN0IGtleXMgPSBvcHRzICYmICFBcnJheS5pc0FycmF5KG9wdHMpID8gW29wdHNdIDogb3B0cztcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFxuICAgICAga2V5cy5tYXAocmVsTmFtZSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQsIHJlbE5hbWUpKVxuICAgICAgICAudGhlbihyZWwgPT4ge1xuICAgICAgICAgIHJldHVybiB7IFtyZWxOYW1lXTogSlNPTi5wYXJzZShyZWwpIH07XG4gICAgICAgIH0pO1xuICAgICAgfSlcbiAgICApLnRoZW4ocmVsTGlzdCA9PiByZWxMaXN0LnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBtZXJnZU9wdGlvbnMoYWNjLCBjdXJyKSwge30pKTtcbiAgfVxuXG4gIHdyaXRlKHQsIHYpIHtcbiAgICBjb25zdCBpZCA9IHYuaWQgfHwgdlt0LiRzY2hlbWEuJGlkXTtcbiAgICBpZiAoKGlkID09PSB1bmRlZmluZWQpIHx8IChpZCA9PT0gbnVsbCkpIHtcbiAgICAgIHJldHVybiB0aGlzLmNyZWF0ZU5ldyh0LCB2KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMub3ZlcndyaXRlKHQsIGlkLCB2KTtcbiAgICB9XG4gIH1cblxuICBjcmVhdGVOZXcodCwgdikge1xuICAgIGNvbnN0IHRvU2F2ZSA9IG1lcmdlT3B0aW9ucyh7fSwgdik7XG4gICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgIHJldHVybiB0aGlzLiQkbWF4S2V5KHQuJG5hbWUpXG4gICAgICAudGhlbigobikgPT4ge1xuICAgICAgICBjb25zdCBpZCA9IG4gKyAxO1xuICAgICAgICB0b1NhdmUuaWQgPSBpZDtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgICAgdGhpcy53cml0ZUF0dHJpYnV0ZXModCwgaWQsIHRvU2F2ZS5hdHRyaWJ1dGVzKSxcbiAgICAgICAgICB0aGlzLndyaXRlUmVsYXRpb25zaGlwcyh0LCBpZCwgdG9TYXZlLnJlbGF0aW9uc2hpcHMpLFxuICAgICAgICBdKS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5ub3RpZnlVcGRhdGUodCwgdG9TYXZlW3QuJGlkXSwge1xuICAgICAgICAgICAgW3QuJHNjaGVtYS4kaWRdOiBpZCxcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHRvU2F2ZS5hdHRyaWJ1dGVzLFxuICAgICAgICAgICAgcmVsYXRpb25zaGlwczogcmVzb2x2ZVJlbGF0aW9uc2hpcHModC4kc2NoZW1hLCB0b1NhdmUucmVsYXRpb25zaGlwcyksXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKCgpID0+IHRvU2F2ZSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIG5ldyBjb250ZW50IGluIGEgbm9uLXRlcm1pbmFsIHN0b3JlJyk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcndyaXRlKHQsIGlkLCB2KSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpKSxcbiAgICAgIHRoaXMuZ2V0UmVsYXRpb25zaGlwcyh0LCBpZCwgT2JqZWN0LmtleXModi5yZWxhdGlvbnNoaXBzKSksXG4gICAgXSkudGhlbigoW29yaWdBdHRyaWJ1dGVzLCBvcmlnUmVsYXRpb25zaGlwc10pID0+IHtcbiAgICAgIGNvbnN0IHVwZGF0ZWRBdHRyaWJ1dGVzID0gT2JqZWN0LmFzc2lnbih7fSwgSlNPTi5wYXJzZShvcmlnQXR0cmlidXRlcyksIHYuYXR0cmlidXRlcyk7XG4gICAgICBjb25zdCB1cGRhdGVkUmVsYXRpb25zaGlwcyA9IHJlc29sdmVSZWxhdGlvbnNoaXBzKHQuJHNjaGVtYSwgdi5yZWxhdGlvbnNoaXBzLCBvcmlnUmVsYXRpb25zaGlwcyk7XG4gICAgICBjb25zdCB1cGRhdGVkID0geyBpZCwgYXR0cmlidXRlczogdXBkYXRlZEF0dHJpYnV0ZXMsIHJlbGF0aW9uc2hpcHM6IHVwZGF0ZWRSZWxhdGlvbnNoaXBzIH07XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgdGhpcy53cml0ZUF0dHJpYnV0ZXModCwgaWQsIHVwZGF0ZWRBdHRyaWJ1dGVzKSxcbiAgICAgICAgdGhpcy53cml0ZVJlbGF0aW9uc2hpcHModCwgaWQsIHVwZGF0ZWRSZWxhdGlvbnNoaXBzKSxcbiAgICAgIF0pXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vdGlmeVVwZGF0ZSh0LCBpZCwgdXBkYXRlZCk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdXBkYXRlZDtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgd3JpdGVBdHRyaWJ1dGVzKHQsIGlkLCBhdHRyaWJ1dGVzKSB7XG4gICAgY29uc3QgJGlkID0gYXR0cmlidXRlcy5pZCA/ICdpZCcgOiB0LiRzY2hlbWEuJGlkO1xuICAgIGNvbnN0IHRvV3JpdGUgPSBtZXJnZU9wdGlvbnMoe30sIGF0dHJpYnV0ZXMsIHsgWyRpZF06IGlkIH0pO1xuICAgIHJldHVybiB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpLCBKU09OLnN0cmluZ2lmeSh0b1dyaXRlKSk7XG4gIH1cblxuICB3cml0ZVJlbGF0aW9uc2hpcHModCwgaWQsIHJlbGF0aW9uc2hpcHMpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMocmVsYXRpb25zaGlwcykubWFwKHJlbE5hbWUgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCwgcmVsTmFtZSksIEpTT04uc3RyaW5naWZ5KHJlbGF0aW9uc2hpcHNbcmVsTmFtZV0pKTtcbiAgICB9KS5yZWR1Y2UoKHRoZW5hYmxlLCBjdXJyKSA9PiB0aGVuYWJsZS50aGVuKCgpID0+IGN1cnIpLCBCbHVlYmlyZC5yZXNvbHZlKCkpO1xuICB9XG5cbiAgcmVhZEF0dHJpYnV0ZXModCwgaWQpIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkKSlcbiAgICAudGhlbigoZCkgPT4gSlNPTi5wYXJzZShkKSk7XG4gIH1cblxuICByZWFkUmVsYXRpb25zaGlwKHQsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkLCByZWxhdGlvbnNoaXApKVxuICAgIC50aGVuKChhcnJheVN0cmluZykgPT4ge1xuICAgICAgcmV0dXJuIHsgW3JlbGF0aW9uc2hpcF06IEpTT04ucGFyc2UoYXJyYXlTdHJpbmcpIHx8IFtdIH07XG4gICAgfSk7XG4gIH1cblxuICBkZWxldGUodCwgaWQpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVsKHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkKSk7XG4gIH1cblxuICB3aXBlKHQsIGlkLCBmaWVsZCkge1xuICAgIGlmIChmaWVsZCA9PT0gJ2F0dHJpYnV0ZXMnKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZGVsKHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLl9kZWwodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQsIGZpZWxkKSk7XG4gICAgfVxuICB9XG5cbiAgYWRkKHR5cGUsIGlkLCByZWxOYW1lLCBjaGlsZElkLCBleHRyYXMgPSB7fSkge1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcEJsb2NrID0gdHlwZS4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0udHlwZTtcbiAgICBjb25zdCB0aGlzVHlwZSA9IHR5cGUuJG5hbWU7XG4gICAgY29uc3Qgb3RoZXJUeXBlID0gcmVsYXRpb25zaGlwQmxvY2suJHNpZGVzW3JlbE5hbWVdLm90aGVyVHlwZTtcbiAgICBjb25zdCBvdGhlck5hbWUgPSByZWxhdGlvbnNoaXBCbG9jay4kc2lkZXNbcmVsTmFtZV0ub3RoZXJOYW1lO1xuICAgIGNvbnN0IHRoaXNLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyh0aGlzVHlwZSwgaWQsIHJlbE5hbWUpO1xuICAgIGNvbnN0IG90aGVyS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcob3RoZXJUeXBlLCBjaGlsZElkLCBvdGhlck5hbWUpO1xuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgdGhpcy5fZ2V0KHRoaXNLZXlTdHJpbmcpLFxuICAgICAgdGhpcy5fZ2V0KG90aGVyS2V5U3RyaW5nKSxcbiAgICBdKVxuICAgIC50aGVuKChbdGhpc0FycmF5U3RyaW5nLCBvdGhlckFycmF5U3RyaW5nXSkgPT4ge1xuICAgICAgY29uc3QgdGhpc0FycmF5ID0gSlNPTi5wYXJzZSh0aGlzQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3Qgb3RoZXJBcnJheSA9IEpTT04ucGFyc2Uob3RoZXJBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCBuZXdDaGlsZCA9IHsgaWQ6IGNoaWxkSWQgfTtcbiAgICAgIGNvbnN0IG5ld1BhcmVudCA9IHsgaWQgfTtcbiAgICAgIGlmIChyZWxhdGlvbnNoaXBCbG9jay4kZXh0cmFzKSB7XG4gICAgICAgIG5ld0NoaWxkLm1ldGEgPSBuZXdDaGlsZC5tZXRhIHx8IHt9O1xuICAgICAgICBuZXdQYXJlbnQubWV0YSA9IG5ld1BhcmVudC5tZXRhIHx8IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IGV4dHJhIGluIGV4dHJhcykge1xuICAgICAgICAgIGlmIChleHRyYSBpbiByZWxhdGlvbnNoaXBCbG9jay4kZXh0cmFzKSB7XG4gICAgICAgICAgICBuZXdDaGlsZC5tZXRhW2V4dHJhXSA9IGV4dHJhc1tleHRyYV07XG4gICAgICAgICAgICBuZXdQYXJlbnQubWV0YVtleHRyYV0gPSBleHRyYXNbZXh0cmFdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgdGhpc0lkeCA9IHRoaXNBcnJheS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSBjaGlsZElkKTtcbiAgICAgIGNvbnN0IG90aGVySWR4ID0gb3RoZXJBcnJheS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSBpZCk7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgbWF5YmVQdXNoKHRoaXNBcnJheSwgbmV3Q2hpbGQsIHRoaXNLZXlTdHJpbmcsIHRoaXMsIHRoaXNJZHgpLFxuICAgICAgICBtYXliZVB1c2gob3RoZXJBcnJheSwgbmV3UGFyZW50LCBvdGhlcktleVN0cmluZywgdGhpcywgb3RoZXJJZHgpLFxuICAgICAgXSlcbiAgICAgIC50aGVuKCgpID0+IHRoaXMubm90aWZ5VXBkYXRlKHR5cGUsIGlkLCBudWxsLCByZWxOYW1lKSlcbiAgICAgIC50aGVuKCgpID0+IHRoaXMubm90aWZ5VXBkYXRlKHR5cGUsIGNoaWxkSWQsIG51bGwsIG90aGVyTmFtZSkpXG4gICAgICAudGhlbigoKSA9PiB0aGlzQXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKHR5cGUsIGlkLCByZWxOYW1lLCBjaGlsZElkLCBleHRyYXMpIHtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBCbG9jayA9IHR5cGUuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnR5cGU7XG4gICAgY29uc3QgdGhpc1R5cGUgPSB0eXBlLiRuYW1lO1xuICAgIGNvbnN0IG90aGVyVHlwZSA9IHJlbGF0aW9uc2hpcEJsb2NrLiRzaWRlc1tyZWxOYW1lXS5vdGhlclR5cGU7XG4gICAgY29uc3Qgb3RoZXJOYW1lID0gcmVsYXRpb25zaGlwQmxvY2suJHNpZGVzW3JlbE5hbWVdLm90aGVyTmFtZTtcbiAgICBjb25zdCB0aGlzS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcodGhpc1R5cGUsIGlkLCByZWxOYW1lKTtcbiAgICBjb25zdCBvdGhlcktleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKG90aGVyVHlwZSwgY2hpbGRJZCwgb3RoZXJOYW1lKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgIHRoaXMuX2dldCh0aGlzS2V5U3RyaW5nKSxcbiAgICAgIHRoaXMuX2dldChvdGhlcktleVN0cmluZyksXG4gICAgXSlcbiAgICAudGhlbigoW3RoaXNBcnJheVN0cmluZywgb3RoZXJBcnJheVN0cmluZ10pID0+IHtcbiAgICAgIGNvbnN0IHRoaXNBcnJheSA9IEpTT04ucGFyc2UodGhpc0FycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IG90aGVyQXJyYXkgPSBKU09OLnBhcnNlKG90aGVyQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3QgdGhpc1RhcmdldCA9IHsgaWQ6IGNoaWxkSWQgfTtcbiAgICAgIGNvbnN0IG90aGVyVGFyZ2V0ID0geyBpZCB9O1xuICAgICAgY29uc3QgdGhpc0lkeCA9IHRoaXNBcnJheS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSBjaGlsZElkKTtcbiAgICAgIGNvbnN0IG90aGVySWR4ID0gb3RoZXJBcnJheS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSBpZCk7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgbWF5YmVVcGRhdGUodGhpc0FycmF5LCB0aGlzVGFyZ2V0LCB0aGlzS2V5U3RyaW5nLCB0aGlzLCBleHRyYXMsIHRoaXNJZHgpLFxuICAgICAgICBtYXliZVVwZGF0ZShvdGhlckFycmF5LCBvdGhlclRhcmdldCwgb3RoZXJLZXlTdHJpbmcsIHRoaXMsIGV4dHJhcywgb3RoZXJJZHgpLFxuICAgICAgXSk7XG4gICAgfSlcbiAgICAudGhlbigocmVzKSA9PiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBpZCwgbnVsbCwgcmVsTmFtZSkudGhlbigoKSA9PiByZXMpKVxuICAgIC50aGVuKChyZXMpID0+IHRoaXMubm90aWZ5VXBkYXRlKHR5cGUsIGNoaWxkSWQsIG51bGwsIG90aGVyTmFtZSkudGhlbigoKSA9PiByZXMpKTtcbiAgfVxuXG4gIHJlbW92ZSh0eXBlLCBpZCwgcmVsTmFtZSwgY2hpbGRJZCkge1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcEJsb2NrID0gdHlwZS4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0udHlwZTtcbiAgICBjb25zdCB0aGlzVHlwZSA9IHR5cGUuJG5hbWU7XG4gICAgY29uc3Qgb3RoZXJUeXBlID0gcmVsYXRpb25zaGlwQmxvY2suJHNpZGVzW3JlbE5hbWVdLm90aGVyVHlwZTtcbiAgICBjb25zdCBvdGhlck5hbWUgPSByZWxhdGlvbnNoaXBCbG9jay4kc2lkZXNbcmVsTmFtZV0ub3RoZXJOYW1lO1xuICAgIGNvbnN0IHRoaXNLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyh0aGlzVHlwZSwgaWQsIHJlbE5hbWUpO1xuICAgIGNvbnN0IG90aGVyS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcob3RoZXJUeXBlLCBjaGlsZElkLCBvdGhlck5hbWUpO1xuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgdGhpcy5fZ2V0KHRoaXNLZXlTdHJpbmcpLFxuICAgICAgdGhpcy5fZ2V0KG90aGVyS2V5U3RyaW5nKSxcbiAgICBdKVxuICAgIC50aGVuKChbdGhpc0FycmF5U3RyaW5nLCBvdGhlckFycmF5U3RyaW5nXSkgPT4ge1xuICAgICAgY29uc3QgdGhpc0FycmF5ID0gSlNPTi5wYXJzZSh0aGlzQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3Qgb3RoZXJBcnJheSA9IEpTT04ucGFyc2Uob3RoZXJBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCB0aGlzSWR4ID0gdGhpc0FycmF5LmZpbmRJbmRleChpdGVtID0+IGl0ZW0uaWQgPT09IGNoaWxkSWQpO1xuICAgICAgY29uc3Qgb3RoZXJJZHggPSBvdGhlckFycmF5LmZpbmRJbmRleChpdGVtID0+IGl0ZW0uaWQgPT09IGlkKTtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICBtYXliZURlbGV0ZSh0aGlzQXJyYXksIHRoaXNJZHgsIHRoaXNLZXlTdHJpbmcsIHRoaXMpLFxuICAgICAgICBtYXliZURlbGV0ZShvdGhlckFycmF5LCBvdGhlcklkeCwgb3RoZXJLZXlTdHJpbmcsIHRoaXMpLFxuICAgICAgXSk7XG4gICAgfSlcbiAgICAudGhlbigocmVzKSA9PiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBpZCwgbnVsbCwgcmVsTmFtZSkudGhlbigoKSA9PiByZXMpKVxuICAgIC50aGVuKChyZXMpID0+IHRoaXMubm90aWZ5VXBkYXRlKHR5cGUsIGNoaWxkSWQsIG51bGwsIG90aGVyTmFtZSkudGhlbigoKSA9PiByZXMpKTtcbiAgfVxuXG4gIGtleVN0cmluZyh0eXBlTmFtZSwgaWQsIHJlbGF0aW9uc2hpcCkge1xuICAgIHJldHVybiBgJHt0eXBlTmFtZX06JHtyZWxhdGlvbnNoaXAgPyBgcmVsLiR7cmVsYXRpb25zaGlwfWAgOiAnYXR0cmlidXRlcyd9OiR7aWR9YDtcbiAgfVxufVxuIl19
