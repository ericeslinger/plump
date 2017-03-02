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

var _createFilter = require('./createFilter');

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
    value: function readRelationship(t, id, relationship, attributes) {
      var relationshipType = t.$schema.relationships[relationship].type;
      var sideInfo = relationshipType.$sides[relationship];
      var resolves = [this._get(this.keyString(t.$name, id, relationship))];
      if (sideInfo.self.query && sideInfo.self.query.requireLoad && !attributes) {
        resolves.push(this.readAttributes(t, id));
      }
      // TODO: if there's a query, KVS loads a *lot* into memory and filters
      return Bluebird.all(resolves).then(function (_ref5) {
        var _ref6 = _slicedToArray(_ref5, 2),
            arrayString = _ref6[0],
            maybeContext = _ref6[1];

        var context = maybeContext || { id: id };
        var relationshipArray = JSON.parse(arrayString) || [];
        if (sideInfo.self.query) {
          var filterBlock = _storage.Storage.massReplace(sideInfo.self.query.logic, context);
          relationshipArray = relationshipArray.filter((0, _createFilter.createFilter)(filterBlock));
        }
        return _defineProperty({}, relationship, relationshipArray);
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
    value: function add(type, id, relationshipTitle, childId) {
      var _this6 = this;

      var extras = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

      var relationshipBlock = type.$schema.relationships[relationshipTitle].type;
      var sideInfo = relationshipBlock.$sides[relationshipTitle];
      var thisKeyString = this.keyString(type.$name, id, relationshipTitle);
      var otherKeyString = this.keyString(sideInfo.other.type, childId, sideInfo.other.title);
      return Bluebird.all([this._get(thisKeyString), this._get(otherKeyString)]).then(function (_ref8) {
        var _ref9 = _slicedToArray(_ref8, 2),
            thisArrayString = _ref9[0],
            otherArrayString = _ref9[1];

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
        // findEntryCallback(relationshipBlock, relationshipTitle, newChild));
        var otherIdx = otherArray.findIndex(function (item) {
          return item.id === id;
        });
        // findEntryCallback(relationshipBlock, relationshipTitle, newChild));
        return Bluebird.all([maybePush(thisArray, newChild, thisKeyString, _this6, thisIdx), maybePush(otherArray, newParent, otherKeyString, _this6, otherIdx)]).then(function () {
          return _this6.notifyUpdate(type, id, null, relationshipTitle);
        }).then(function () {
          return _this6.notifyUpdate(type, childId, null, sideInfo.other.title);
        }).then(function () {
          return thisArray;
        });
      });
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(type, id, relationshipTitle, childId, extras) {
      var _this7 = this;

      var relationshipBlock = type.$schema.relationships[relationshipTitle].type;
      var sideInfo = relationshipBlock.$sides[relationshipTitle];
      var thisKeyString = this.keyString(type.$name, id, relationshipTitle);
      var otherKeyString = this.keyString(sideInfo.other.type, childId, sideInfo.other.title);
      return Bluebird.all([this._get(thisKeyString), this._get(otherKeyString)]).then(function (_ref10) {
        var _ref11 = _slicedToArray(_ref10, 2),
            thisArrayString = _ref11[0],
            otherArrayString = _ref11[1];

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
        return _this7.notifyUpdate(type, id, null, relationshipTitle).then(function () {
          return res;
        });
      }).then(function (res) {
        return _this7.notifyUpdate(type, childId, null, sideInfo.other.title).then(function () {
          return res;
        });
      });
    }
  }, {
    key: 'remove',
    value: function remove(type, id, relationshipTitle, childId) {
      var _this8 = this;

      var relationshipBlock = type.$schema.relationships[relationshipTitle].type;
      var sideInfo = relationshipBlock.$sides[relationshipTitle];
      var thisKeyString = this.keyString(type.$name, id, relationshipTitle);
      var otherKeyString = this.keyString(sideInfo.other.type, childId, sideInfo.other.title);
      return Bluebird.all([this._get(thisKeyString), this._get(otherKeyString)]).then(function (_ref12) {
        var _ref13 = _slicedToArray(_ref12, 2),
            thisArrayString = _ref13[0],
            otherArrayString = _ref13[1];

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
        return _this8.notifyUpdate(type, id, null, relationshipTitle).then(function () {
          return res;
        });
      }).then(function (res) {
        return _this8.notifyUpdate(type, childId, null, sideInfo.other.title).then(function () {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uva2V5VmFsdWVTdG9yZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsInNhbmVOdW1iZXIiLCJpIiwiaXNOYU4iLCJJbmZpbml0eSIsIm1heWJlUHVzaCIsImFycmF5IiwidmFsIiwia2V5c3RyaW5nIiwic3RvcmUiLCJpZHgiLCJyZXNvbHZlIiwidGhlbiIsInB1c2giLCJfc2V0IiwiSlNPTiIsInN0cmluZ2lmeSIsIm1heWJlVXBkYXRlIiwiZXh0cmFzIiwibW9kaWZpZWRSZWxhdGlvbnNoaXAiLCJtZXRhIiwibWF5YmVEZWxldGUiLCJzcGxpY2UiLCJhcHBseURlbHRhIiwiYmFzZSIsImRlbHRhIiwib3AiLCJyZXRWYWwiLCJkYXRhIiwidW5kZWZpbmVkIiwicmVzb2x2ZVJlbGF0aW9uc2hpcCIsImRlbHRhcyIsIm1heWJlQmFzZSIsInVwZGF0ZXMiLCJtYXAiLCJyZWwiLCJpZCIsInJlZHVjZSIsImFjYyIsImN1cnIiLCJmb3JFYWNoIiwiY2hpbGRJZCIsIk9iamVjdCIsImtleXMiLCJmaWx0ZXIiLCJjb25jYXQiLCJyZXNvbHZlUmVsYXRpb25zaGlwcyIsInNjaGVtYSIsInJlbE5hbWUiLCJyZWxhdGlvbnNoaXBzIiwiS2V5VmFsdWVTdG9yZSIsInQiLCJfa2V5cyIsImtleUFycmF5IiwibGVuZ3RoIiwiayIsInNwbGl0IiwicGFyc2VJbnQiLCJtYXgiLCJjdXJyZW50Iiwib3B0cyIsIkFycmF5IiwiaXNBcnJheSIsImFsbCIsIl9nZXQiLCJrZXlTdHJpbmciLCIkbmFtZSIsInBhcnNlIiwicmVsTGlzdCIsInYiLCIkc2NoZW1hIiwiJGlkIiwiY3JlYXRlTmV3Iiwib3ZlcndyaXRlIiwidG9TYXZlIiwidGVybWluYWwiLCIkJG1heEtleSIsIm4iLCJ3cml0ZUF0dHJpYnV0ZXMiLCJhdHRyaWJ1dGVzIiwid3JpdGVSZWxhdGlvbnNoaXBzIiwibm90aWZ5VXBkYXRlIiwiRXJyb3IiLCJnZXRSZWxhdGlvbnNoaXBzIiwib3JpZ0F0dHJpYnV0ZXMiLCJvcmlnUmVsYXRpb25zaGlwcyIsInVwZGF0ZWRBdHRyaWJ1dGVzIiwiYXNzaWduIiwidXBkYXRlZFJlbGF0aW9uc2hpcHMiLCJ1cGRhdGVkIiwidG9Xcml0ZSIsInRoZW5hYmxlIiwiZCIsInJlbGF0aW9uc2hpcCIsInJlbGF0aW9uc2hpcFR5cGUiLCJ0eXBlIiwic2lkZUluZm8iLCIkc2lkZXMiLCJyZXNvbHZlcyIsInNlbGYiLCJxdWVyeSIsInJlcXVpcmVMb2FkIiwicmVhZEF0dHJpYnV0ZXMiLCJhcnJheVN0cmluZyIsIm1heWJlQ29udGV4dCIsImNvbnRleHQiLCJyZWxhdGlvbnNoaXBBcnJheSIsImZpbHRlckJsb2NrIiwibWFzc1JlcGxhY2UiLCJsb2dpYyIsIl9kZWwiLCJmaWVsZCIsInJlbGF0aW9uc2hpcFRpdGxlIiwicmVsYXRpb25zaGlwQmxvY2siLCJ0aGlzS2V5U3RyaW5nIiwib3RoZXJLZXlTdHJpbmciLCJvdGhlciIsInRpdGxlIiwidGhpc0FycmF5U3RyaW5nIiwib3RoZXJBcnJheVN0cmluZyIsInRoaXNBcnJheSIsIm90aGVyQXJyYXkiLCJuZXdDaGlsZCIsIm5ld1BhcmVudCIsIiRleHRyYXMiLCJleHRyYSIsInRoaXNJZHgiLCJmaW5kSW5kZXgiLCJpdGVtIiwib3RoZXJJZHgiLCJ0aGlzVGFyZ2V0Iiwib3RoZXJUYXJnZXQiLCJyZXMiLCJ0eXBlTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTs7SUFBWUEsUTs7QUFDWjs7OztBQUVBOztBQUNBOzs7Ozs7Ozs7Ozs7OztBQUVBLFNBQVNDLFVBQVQsQ0FBb0JDLENBQXBCLEVBQXVCO0FBQ3JCLFNBQVMsT0FBT0EsQ0FBUCxLQUFhLFFBQWQsSUFBNEIsQ0FBQ0MsTUFBTUQsQ0FBTixDQUE3QixJQUEyQ0EsTUFBTUUsUUFBUCxHQUFvQkYsTUFBTSxDQUFDRSxRQUE3RTtBQUNEOztBQUVELFNBQVNDLFNBQVQsQ0FBbUJDLEtBQW5CLEVBQTBCQyxHQUExQixFQUErQkMsU0FBL0IsRUFBMENDLEtBQTFDLEVB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Q0FBakI7QUFDQSxlQUFPcEMsU0FBUytELEdBQVQsQ0FBYSxDQUNsQjFDLFlBQVltRyxTQUFaLEVBQXVCTSxPQUF2QixFQUFnQ1osYUFBaEMsU0FEa0IsRUFFbEI3RixZQUFZb0csVUFBWixFQUF3QlEsUUFBeEIsRUFBa0NkLGNBQWxDLFNBRmtCLENBQWIsQ0FBUDtBQUlELE9BYk0sRUFjTnZHLElBZE0sQ0FjRCxVQUFDd0gsR0FBRDtBQUFBLGVBQVMsT0FBS25ELFlBQUwsQ0FBa0JjLElBQWxCLEVBQXdCM0QsRUFBeEIsRUFBNEIsSUFBNUIsRUFBa0M0RSxpQkFBbEMsRUFBcURwRyxJQUFyRCxDQUEwRDtBQUFBLGlCQUFNd0gsR0FBTjtBQUFBLFNBQTFELENBQVQ7QUFBQSxPQWRDLEVBZU54SCxJQWZNLENBZUQsVUFBQ3dILEdBQUQ7QUFBQSxlQUFTLE9BQUtuRCxZQUFMLENBQWtCYyxJQUFsQixFQUF3QnRELE9BQXhCLEVBQWlDLElBQWpDLEVBQXVDdUQsU0FBU29CLEtBQVQsQ0FBZUMsS0FBdEQsRUFBNkR6RyxJQUE3RCxDQUFrRTtBQUFBLGlCQUFNd0gsR0FBTjtBQUFBLFNBQWxFLENBQVQ7QUFBQSxPQWZDLENBQVA7QUFnQkQ7Ozs4QkFFU0MsUSxFQUFVakcsRSxFQUFJeUQsWSxFQUFjO0FBQ3BDLGFBQVV3QyxRQUFWLFVBQXNCeEMsd0JBQXNCQSxZQUF0QixHQUF1QyxZQUE3RCxVQUE2RXpELEVBQTdFO0FBQ0QiLCJmaWxlIjoic3RvcmFnZS9rZXlWYWx1ZVN0b3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcblxuaW1wb3J0IHsgU3RvcmFnZSB9IGZyb20gJy4vc3RvcmFnZSc7XG5pbXBvcnQgeyBjcmVhdGVGaWx0ZXIgfSBmcm9tICcuL2NyZWF0ZUZpbHRlcic7XG5cbmZ1bmN0aW9uIHNhbmVOdW1iZXIoaSkge1xuICByZXR1cm4gKCh0eXBlb2YgaSA9PT0gJ251bWJlcicpICYmICghaXNOYU4oaSkpICYmIChpICE9PSBJbmZpbml0eSkgJiAoaSAhPT0gLUluZmluaXR5KSk7XG59XG5cbmZ1bmN0aW9uIG1heWJlUHVzaChhcnJheSwgdmFsLCBrZXlzdHJpbmcsIHN0b3JlLCBpZHgpIHtcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAudGhlbigoKSA9PiB7XG4gICAgaWYgKGlkeCA8IDApIHtcbiAgICAgIGFycmF5LnB1c2godmFsKTtcbiAgICAgIHJldHVybiBzdG9yZS5fc2V0KGtleXN0cmluZywgSlNPTi5zdHJpbmdpZnkoYXJyYXkpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9KTtcbn1cblxuXG5mdW5jdGlvbiBtYXliZVVwZGF0ZShhcnJheSwgdmFsLCBrZXlzdHJpbmcsIHN0b3JlLCBleHRyYXMsIGlkeCkge1xuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gIC50aGVuKCgpID0+IHtcbiAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgIGNvbnN0IG1vZGlmaWVkUmVsYXRpb25zaGlwID0gbWVyZ2VPcHRpb25zKFxuICAgICAgICB7fSxcbiAgICAgICAgYXJyYXlbaWR4XSxcbiAgICAgICAgZXh0cmFzID8geyBtZXRhOiBleHRyYXMgfSA6IHt9XG4gICAgICApO1xuICAgICAgYXJyYXlbaWR4XSA9IG1vZGlmaWVkUmVsYXRpb25zaGlwOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICByZXR1cm4gc3RvcmUuX3NldChrZXlzdHJpbmcsIEpTT04uc3RyaW5naWZ5KGFycmF5KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG1heWJlRGVsZXRlKGFycmF5LCBpZHgsIGtleXN0cmluZywgc3RvcmUpIHtcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAudGhlbigoKSA9PiB7XG4gICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICBhcnJheS5zcGxpY2UoaWR4LCAxKTtcbiAgICAgIHJldHVybiBzdG9yZS5fc2V0KGtleXN0cmluZywgSlNPTi5zdHJpbmdpZnkoYXJyYXkpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gYXBwbHlEZWx0YShiYXNlLCBkZWx0YSkge1xuICBpZiAoZGVsdGEub3AgPT09ICdhZGQnIHx8IGRlbHRhLm9wID09PSAnbW9kaWZ5Jykge1xuICAgIGNvbnN0IHJldFZhbCA9IG1lcmdlT3B0aW9ucyh7fSwgYmFzZSwgZGVsdGEuZGF0YSk7XG4gICAgcmV0dXJuIHJldFZhbDtcbiAgfSBlbHNlIGlmIChkZWx0YS5vcCA9PT0gJ3JlbW92ZScpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVSZWxhdGlvbnNoaXAoZGVsdGFzLCBtYXliZUJhc2UpIHtcbiAgY29uc3QgYmFzZSA9IG1heWJlQmFzZSB8fCBbXTtcbiAgLy8gSW5kZXggY3VycmVudCByZWxhdGlvbnNoaXBzIGJ5IElEIGZvciBlZmZpY2llbnQgbW9kaWZpY2F0aW9uXG4gIGNvbnN0IHVwZGF0ZXMgPSBiYXNlLm1hcChyZWwgPT4ge1xuICAgIHJldHVybiB7IFtyZWwuaWRdOiByZWwgfTtcbiAgfSkucmVkdWNlKChhY2MsIGN1cnIpID0+IG1lcmdlT3B0aW9ucyhhY2MsIGN1cnIpLCB7fSk7XG5cbiAgLy8gQXBwbHkgYW55IGRlbHRhcyBpbiBkaXJ0eSBjYWNoZSBvbiB0b3Agb2YgdXBkYXRlc1xuICBkZWx0YXMuZm9yRWFjaChkZWx0YSA9PiB7XG4gICAgY29uc3QgY2hpbGRJZCA9IGRlbHRhLmRhdGEuaWQ7XG4gICAgdXBkYXRlc1tjaGlsZElkXSA9IGFwcGx5RGVsdGEodXBkYXRlc1tjaGlsZElkXSwgZGVsdGEpO1xuICB9KTtcblxuICAvLyBDb2xsYXBzZSB1cGRhdGVzIGJhY2sgaW50byBsaXN0LCBvbWl0dGluZyB1bmRlZmluZWRzXG4gIHJldHVybiBPYmplY3Qua2V5cyh1cGRhdGVzKVxuICAgIC5tYXAoaWQgPT4gdXBkYXRlc1tpZF0pXG4gICAgLmZpbHRlcihyZWwgPT4gcmVsICE9PSB1bmRlZmluZWQpXG4gICAgLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBhY2MuY29uY2F0KGN1cnIpLCBbXSk7XG59XG5cbi8vIFRPRE9cbmZ1bmN0aW9uIHJlc29sdmVSZWxhdGlvbnNoaXBzKHNjaGVtYSwgZGVsdGFzLCBiYXNlID0ge30pIHtcbiAgY29uc3QgdXBkYXRlcyA9IHt9O1xuICBmb3IgKGNvbnN0IHJlbE5hbWUgaW4gZGVsdGFzKSB7XG4gICAgaWYgKHJlbE5hbWUgaW4gc2NoZW1hLnJlbGF0aW9uc2hpcHMpIHtcbiAgICAgIHVwZGF0ZXNbcmVsTmFtZV0gPSByZXNvbHZlUmVsYXRpb25zaGlwKGRlbHRhc1tyZWxOYW1lXSwgYmFzZVtyZWxOYW1lXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBtZXJnZU9wdGlvbnMoe30sIGJhc2UsIHVwZGF0ZXMpO1xufVxuXG5cbmV4cG9ydCBjbGFzcyBLZXlWYWx1ZVN0b3JlIGV4dGVuZHMgU3RvcmFnZSB7XG4gICQkbWF4S2V5KHQpIHtcbiAgICByZXR1cm4gdGhpcy5fa2V5cyh0KVxuICAgIC50aGVuKChrZXlBcnJheSkgPT4ge1xuICAgICAgaWYgKGtleUFycmF5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBrZXlBcnJheS5tYXAoKGspID0+IGsuc3BsaXQoJzonKVsyXSlcbiAgICAgICAgLm1hcCgoaykgPT4gcGFyc2VJbnQoaywgMTApKVxuICAgICAgICAuZmlsdGVyKChpKSA9PiBzYW5lTnVtYmVyKGkpKVxuICAgICAgICAucmVkdWNlKChtYXgsIGN1cnJlbnQpID0+IChjdXJyZW50ID4gbWF4KSA/IGN1cnJlbnQgOiBtYXgsIDApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZ2V0UmVsYXRpb25zaGlwcyh0LCBpZCwgb3B0cykge1xuICAgIGNvbnN0IGtleXMgPSBvcHRzICYmICFBcnJheS5pc0FycmF5KG9wdHMpID8gW29wdHNdIDogb3B0cztcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFxuICAgICAga2V5cy5tYXAocmVsTmFtZSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQsIHJlbE5hbWUpKVxuICAgICAgICAudGhlbihyZWwgPT4ge1xuICAgICAgICAgIHJldHVybiB7IFtyZWxOYW1lXTogSlNPTi5wYXJzZShyZWwpIH07XG4gICAgICAgIH0pO1xuICAgICAgfSlcbiAgICApLnRoZW4ocmVsTGlzdCA9PiByZWxMaXN0LnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBtZXJnZU9wdGlvbnMoYWNjLCBjdXJyKSwge30pKTtcbiAgfVxuXG4gIHdyaXRlKHQsIHYpIHtcbiAgICBjb25zdCBpZCA9IHYuaWQgfHwgdlt0LiRzY2hlbWEuJGlkXTtcbiAgICBpZiAoKGlkID09PSB1bmRlZmluZWQpIHx8IChpZCA9PT0gbnVsbCkpIHtcbiAgICAgIHJldHVybiB0aGlzLmNyZWF0ZU5ldyh0LCB2KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMub3ZlcndyaXRlKHQsIGlkLCB2KTtcbiAgICB9XG4gIH1cblxuICBjcmVhdGVOZXcodCwgdikge1xuICAgIGNvbnN0IHRvU2F2ZSA9IG1lcmdlT3B0aW9ucyh7fSwgdik7XG4gICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgIHJldHVybiB0aGlzLiQkbWF4S2V5KHQuJG5hbWUpXG4gICAgICAudGhlbigobikgPT4ge1xuICAgICAgICBjb25zdCBpZCA9IG4gKyAxO1xuICAgICAgICB0b1NhdmUuaWQgPSBpZDtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgICAgdGhpcy53cml0ZUF0dHJpYnV0ZXModCwgaWQsIHRvU2F2ZS5hdHRyaWJ1dGVzKSxcbiAgICAgICAgICB0aGlzLndyaXRlUmVsYXRpb25zaGlwcyh0LCBpZCwgdG9TYXZlLnJlbGF0aW9uc2hpcHMpLFxuICAgICAgICBdKS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5ub3RpZnlVcGRhdGUodCwgdG9TYXZlW3QuJGlkXSwge1xuICAgICAgICAgICAgW3QuJHNjaGVtYS4kaWRdOiBpZCxcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHRvU2F2ZS5hdHRyaWJ1dGVzLFxuICAgICAgICAgICAgcmVsYXRpb25zaGlwczogcmVzb2x2ZVJlbGF0aW9uc2hpcHModC4kc2NoZW1hLCB0b1NhdmUucmVsYXRpb25zaGlwcyksXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKCgpID0+IHRvU2F2ZSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIG5ldyBjb250ZW50IGluIGEgbm9uLXRlcm1pbmFsIHN0b3JlJyk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcndyaXRlKHQsIGlkLCB2KSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpKSxcbiAgICAgIHRoaXMuZ2V0UmVsYXRpb25zaGlwcyh0LCBpZCwgT2JqZWN0LmtleXModi5yZWxhdGlvbnNoaXBzKSksXG4gICAgXSkudGhlbigoW29yaWdBdHRyaWJ1dGVzLCBvcmlnUmVsYXRpb25zaGlwc10pID0+IHtcbiAgICAgIGNvbnN0IHVwZGF0ZWRBdHRyaWJ1dGVzID0gT2JqZWN0LmFzc2lnbih7fSwgSlNPTi5wYXJzZShvcmlnQXR0cmlidXRlcyksIHYuYXR0cmlidXRlcyk7XG4gICAgICBjb25zdCB1cGRhdGVkUmVsYXRpb25zaGlwcyA9IHJlc29sdmVSZWxhdGlvbnNoaXBzKHQuJHNjaGVtYSwgdi5yZWxhdGlvbnNoaXBzLCBvcmlnUmVsYXRpb25zaGlwcyk7XG4gICAgICBjb25zdCB1cGRhdGVkID0geyBpZCwgYXR0cmlidXRlczogdXBkYXRlZEF0dHJpYnV0ZXMsIHJlbGF0aW9uc2hpcHM6IHVwZGF0ZWRSZWxhdGlvbnNoaXBzIH07XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgdGhpcy53cml0ZUF0dHJpYnV0ZXModCwgaWQsIHVwZGF0ZWRBdHRyaWJ1dGVzKSxcbiAgICAgICAgdGhpcy53cml0ZVJlbGF0aW9uc2hpcHModCwgaWQsIHVwZGF0ZWRSZWxhdGlvbnNoaXBzKSxcbiAgICAgIF0pXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vdGlmeVVwZGF0ZSh0LCBpZCwgdXBkYXRlZCk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdXBkYXRlZDtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgd3JpdGVBdHRyaWJ1dGVzKHQsIGlkLCBhdHRyaWJ1dGVzKSB7XG4gICAgY29uc3QgJGlkID0gYXR0cmlidXRlcy5pZCA/ICdpZCcgOiB0LiRzY2hlbWEuJGlkO1xuICAgIGNvbnN0IHRvV3JpdGUgPSBtZXJnZU9wdGlvbnMoe30sIGF0dHJpYnV0ZXMsIHsgWyRpZF06IGlkIH0pO1xuICAgIHJldHVybiB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpLCBKU09OLnN0cmluZ2lmeSh0b1dyaXRlKSk7XG4gIH1cblxuICB3cml0ZVJlbGF0aW9uc2hpcHModCwgaWQsIHJlbGF0aW9uc2hpcHMpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMocmVsYXRpb25zaGlwcykubWFwKHJlbE5hbWUgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCwgcmVsTmFtZSksIEpTT04uc3RyaW5naWZ5KHJlbGF0aW9uc2hpcHNbcmVsTmFtZV0pKTtcbiAgICB9KS5yZWR1Y2UoKHRoZW5hYmxlLCBjdXJyKSA9PiB0aGVuYWJsZS50aGVuKCgpID0+IGN1cnIpLCBCbHVlYmlyZC5yZXNvbHZlKCkpO1xuICB9XG5cbiAgcmVhZEF0dHJpYnV0ZXModCwgaWQpIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHQuJG5hbWUsIGlkKSlcbiAgICAudGhlbigoZCkgPT4gSlNPTi5wYXJzZShkKSk7XG4gIH1cblxuICByZWFkUmVsYXRpb25zaGlwKHQsIGlkLCByZWxhdGlvbnNoaXAsIGF0dHJpYnV0ZXMpIHtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBUeXBlID0gdC4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsYXRpb25zaGlwXS50eXBlO1xuICAgIGNvbnN0IHNpZGVJbmZvID0gcmVsYXRpb25zaGlwVHlwZS4kc2lkZXNbcmVsYXRpb25zaGlwXTtcbiAgICBjb25zdCByZXNvbHZlcyA9IFt0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQsIHJlbGF0aW9uc2hpcCkpXTtcbiAgICBpZiAoc2lkZUluZm8uc2VsZi5xdWVyeSAmJiBzaWRlSW5mby5zZWxmLnF1ZXJ5LnJlcXVpcmVMb2FkICYmICFhdHRyaWJ1dGVzKSB7XG4gICAgICByZXNvbHZlcy5wdXNoKHRoaXMucmVhZEF0dHJpYnV0ZXModCwgaWQpKTtcbiAgICB9XG4gICAgLy8gVE9ETzogaWYgdGhlcmUncyBhIHF1ZXJ5LCBLVlMgbG9hZHMgYSAqbG90KiBpbnRvIG1lbW9yeSBhbmQgZmlsdGVyc1xuICAgIHJldHVybiBCbHVlYmlyZC5hbGwocmVzb2x2ZXMpXG4gICAgLnRoZW4oKFthcnJheVN0cmluZywgbWF5YmVDb250ZXh0XSkgPT4ge1xuICAgICAgY29uc3QgY29udGV4dCA9IG1heWJlQ29udGV4dCB8fCB7IGlkIH07XG4gICAgICBsZXQgcmVsYXRpb25zaGlwQXJyYXkgPSBKU09OLnBhcnNlKGFycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGlmIChzaWRlSW5mby5zZWxmLnF1ZXJ5KSB7XG4gICAgICAgIGNvbnN0IGZpbHRlckJsb2NrID0gU3RvcmFnZS5tYXNzUmVwbGFjZShzaWRlSW5mby5zZWxmLnF1ZXJ5LmxvZ2ljLCBjb250ZXh0KTtcbiAgICAgICAgcmVsYXRpb25zaGlwQXJyYXkgPSByZWxhdGlvbnNoaXBBcnJheS5maWx0ZXIoY3JlYXRlRmlsdGVyKGZpbHRlckJsb2NrKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4geyBbcmVsYXRpb25zaGlwXTogcmVsYXRpb25zaGlwQXJyYXkgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGRlbGV0ZSh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzLl9kZWwodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpKTtcbiAgfVxuXG4gIHdpcGUodCwgaWQsIGZpZWxkKSB7XG4gICAgaWYgKGZpZWxkID09PSAnYXR0cmlidXRlcycpIHtcbiAgICAgIHJldHVybiB0aGlzLl9kZWwodGhpcy5rZXlTdHJpbmcodC4kbmFtZSwgaWQpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX2RlbCh0aGlzLmtleVN0cmluZyh0LiRuYW1lLCBpZCwgZmllbGQpKTtcbiAgICB9XG4gIH1cblxuICBhZGQodHlwZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlLCBjaGlsZElkLCBleHRyYXMgPSB7fSkge1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcEJsb2NrID0gdHlwZS4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsYXRpb25zaGlwVGl0bGVdLnR5cGU7XG4gICAgY29uc3Qgc2lkZUluZm8gPSByZWxhdGlvbnNoaXBCbG9jay4kc2lkZXNbcmVsYXRpb25zaGlwVGl0bGVdO1xuICAgIGNvbnN0IHRoaXNLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyh0eXBlLiRuYW1lLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUpO1xuICAgIGNvbnN0IG90aGVyS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcoc2lkZUluZm8ub3RoZXIudHlwZSwgY2hpbGRJZCwgc2lkZUluZm8ub3RoZXIudGl0bGUpO1xuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgdGhpcy5fZ2V0KHRoaXNLZXlTdHJpbmcpLFxuICAgICAgdGhpcy5fZ2V0KG90aGVyS2V5U3RyaW5nKSxcbiAgICBdKVxuICAgIC50aGVuKChbdGhpc0FycmF5U3RyaW5nLCBvdGhlckFycmF5U3RyaW5nXSkgPT4ge1xuICAgICAgY29uc3QgdGhpc0FycmF5ID0gSlNPTi5wYXJzZSh0aGlzQXJyYXlTdHJpbmcpIHx8IFtdO1xuICAgICAgY29uc3Qgb3RoZXJBcnJheSA9IEpTT04ucGFyc2Uob3RoZXJBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCBuZXdDaGlsZCA9IHsgaWQ6IGNoaWxkSWQgfTtcbiAgICAgIGNvbnN0IG5ld1BhcmVudCA9IHsgaWQgfTtcbiAgICAgIGlmIChyZWxhdGlvbnNoaXBCbG9jay4kZXh0cmFzKSB7XG4gICAgICAgIG5ld0NoaWxkLm1ldGEgPSBuZXdDaGlsZC5tZXRhIHx8IHt9O1xuICAgICAgICBuZXdQYXJlbnQubWV0YSA9IG5ld1BhcmVudC5tZXRhIHx8IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IGV4dHJhIGluIGV4dHJhcykge1xuICAgICAgICAgIGlmIChleHRyYSBpbiByZWxhdGlvbnNoaXBCbG9jay4kZXh0cmFzKSB7XG4gICAgICAgICAgICBuZXdDaGlsZC5tZXRhW2V4dHJhXSA9IGV4dHJhc1tleHRyYV07XG4gICAgICAgICAgICBuZXdQYXJlbnQubWV0YVtleHRyYV0gPSBleHRyYXNbZXh0cmFdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgdGhpc0lkeCA9IHRoaXNBcnJheS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSBjaGlsZElkKTtcbiAgICAgIC8vIGZpbmRFbnRyeUNhbGxiYWNrKHJlbGF0aW9uc2hpcEJsb2NrLCByZWxhdGlvbnNoaXBUaXRsZSwgbmV3Q2hpbGQpKTtcbiAgICAgIGNvbnN0IG90aGVySWR4ID0gb3RoZXJBcnJheS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSBpZCk7XG4gICAgICAvLyBmaW5kRW50cnlDYWxsYmFjayhyZWxhdGlvbnNoaXBCbG9jaywgcmVsYXRpb25zaGlwVGl0bGUsIG5ld0NoaWxkKSk7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgbWF5YmVQdXNoKHRoaXNBcnJheSwgbmV3Q2hpbGQsIHRoaXNLZXlTdHJpbmcsIHRoaXMsIHRoaXNJZHgpLFxuICAgICAgICBtYXliZVB1c2gob3RoZXJBcnJheSwgbmV3UGFyZW50LCBvdGhlcktleVN0cmluZywgdGhpcywgb3RoZXJJZHgpLFxuICAgICAgXSlcbiAgICAgIC50aGVuKCgpID0+IHRoaXMubm90aWZ5VXBkYXRlKHR5cGUsIGlkLCBudWxsLCByZWxhdGlvbnNoaXBUaXRsZSkpXG4gICAgICAudGhlbigoKSA9PiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBjaGlsZElkLCBudWxsLCBzaWRlSW5mby5vdGhlci50aXRsZSkpXG4gICAgICAudGhlbigoKSA9PiB0aGlzQXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKHR5cGUsIGlkLCByZWxhdGlvbnNoaXBUaXRsZSwgY2hpbGRJZCwgZXh0cmFzKSB7XG4gICAgY29uc3QgcmVsYXRpb25zaGlwQmxvY2sgPSB0eXBlLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxhdGlvbnNoaXBUaXRsZV0udHlwZTtcbiAgICBjb25zdCBzaWRlSW5mbyA9IHJlbGF0aW9uc2hpcEJsb2NrLiRzaWRlc1tyZWxhdGlvbnNoaXBUaXRsZV07XG4gICAgY29uc3QgdGhpc0tleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHR5cGUuJG5hbWUsIGlkLCByZWxhdGlvbnNoaXBUaXRsZSk7XG4gICAgY29uc3Qgb3RoZXJLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyhzaWRlSW5mby5vdGhlci50eXBlLCBjaGlsZElkLCBzaWRlSW5mby5vdGhlci50aXRsZSk7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICB0aGlzLl9nZXQodGhpc0tleVN0cmluZyksXG4gICAgICB0aGlzLl9nZXQob3RoZXJLZXlTdHJpbmcpLFxuICAgIF0pXG4gICAgLnRoZW4oKFt0aGlzQXJyYXlTdHJpbmcsIG90aGVyQXJyYXlTdHJpbmddKSA9PiB7XG4gICAgICBjb25zdCB0aGlzQXJyYXkgPSBKU09OLnBhcnNlKHRoaXNBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCBvdGhlckFycmF5ID0gSlNPTi5wYXJzZShvdGhlckFycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IHRoaXNUYXJnZXQgPSB7IGlkOiBjaGlsZElkIH07XG4gICAgICBjb25zdCBvdGhlclRhcmdldCA9IHsgaWQgfTtcbiAgICAgIGNvbnN0IHRoaXNJZHggPSB0aGlzQXJyYXkuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gY2hpbGRJZCk7XG4gICAgICBjb25zdCBvdGhlcklkeCA9IG90aGVyQXJyYXkuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gaWQpO1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIG1heWJlVXBkYXRlKHRoaXNBcnJheSwgdGhpc1RhcmdldCwgdGhpc0tleVN0cmluZywgdGhpcywgZXh0cmFzLCB0aGlzSWR4KSxcbiAgICAgICAgbWF5YmVVcGRhdGUob3RoZXJBcnJheSwgb3RoZXJUYXJnZXQsIG90aGVyS2V5U3RyaW5nLCB0aGlzLCBleHRyYXMsIG90aGVySWR4KSxcbiAgICAgIF0pO1xuICAgIH0pXG4gICAgLnRoZW4oKHJlcykgPT4gdGhpcy5ub3RpZnlVcGRhdGUodHlwZSwgaWQsIG51bGwsIHJlbGF0aW9uc2hpcFRpdGxlKS50aGVuKCgpID0+IHJlcykpXG4gICAgLnRoZW4oKHJlcykgPT4gdGhpcy5ub3RpZnlVcGRhdGUodHlwZSwgY2hpbGRJZCwgbnVsbCwgc2lkZUluZm8ub3RoZXIudGl0bGUpLnRoZW4oKCkgPT4gcmVzKSk7XG4gIH1cblxuICByZW1vdmUodHlwZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlLCBjaGlsZElkKSB7XG4gICAgY29uc3QgcmVsYXRpb25zaGlwQmxvY2sgPSB0eXBlLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxhdGlvbnNoaXBUaXRsZV0udHlwZTtcbiAgICBjb25zdCBzaWRlSW5mbyA9IHJlbGF0aW9uc2hpcEJsb2NrLiRzaWRlc1tyZWxhdGlvbnNoaXBUaXRsZV07XG4gICAgY29uc3QgdGhpc0tleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHR5cGUuJG5hbWUsIGlkLCByZWxhdGlvbnNoaXBUaXRsZSk7XG4gICAgY29uc3Qgb3RoZXJLZXlTdHJpbmcgPSB0aGlzLmtleVN0cmluZyhzaWRlSW5mby5vdGhlci50eXBlLCBjaGlsZElkLCBzaWRlSW5mby5vdGhlci50aXRsZSk7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICB0aGlzLl9nZXQodGhpc0tleVN0cmluZyksXG4gICAgICB0aGlzLl9nZXQob3RoZXJLZXlTdHJpbmcpLFxuICAgIF0pXG4gICAgLnRoZW4oKFt0aGlzQXJyYXlTdHJpbmcsIG90aGVyQXJyYXlTdHJpbmddKSA9PiB7XG4gICAgICBjb25zdCB0aGlzQXJyYXkgPSBKU09OLnBhcnNlKHRoaXNBcnJheVN0cmluZykgfHwgW107XG4gICAgICBjb25zdCBvdGhlckFycmF5ID0gSlNPTi5wYXJzZShvdGhlckFycmF5U3RyaW5nKSB8fCBbXTtcbiAgICAgIGNvbnN0IHRoaXNJZHggPSB0aGlzQXJyYXkuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gY2hpbGRJZCk7XG4gICAgICBjb25zdCBvdGhlcklkeCA9IG90aGVyQXJyYXkuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gaWQpO1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIG1heWJlRGVsZXRlKHRoaXNBcnJheSwgdGhpc0lkeCwgdGhpc0tleVN0cmluZywgdGhpcyksXG4gICAgICAgIG1heWJlRGVsZXRlKG90aGVyQXJyYXksIG90aGVySWR4LCBvdGhlcktleVN0cmluZywgdGhpcyksXG4gICAgICBdKTtcbiAgICB9KVxuICAgIC50aGVuKChyZXMpID0+IHRoaXMubm90aWZ5VXBkYXRlKHR5cGUsIGlkLCBudWxsLCByZWxhdGlvbnNoaXBUaXRsZSkudGhlbigoKSA9PiByZXMpKVxuICAgIC50aGVuKChyZXMpID0+IHRoaXMubm90aWZ5VXBkYXRlKHR5cGUsIGNoaWxkSWQsIG51bGwsIHNpZGVJbmZvLm90aGVyLnRpdGxlKS50aGVuKCgpID0+IHJlcykpO1xuICB9XG5cbiAga2V5U3RyaW5nKHR5cGVOYW1lLCBpZCwgcmVsYXRpb25zaGlwKSB7XG4gICAgcmV0dXJuIGAke3R5cGVOYW1lfToke3JlbGF0aW9uc2hpcCA/IGByZWwuJHtyZWxhdGlvbnNoaXB9YCA6ICdhdHRyaWJ1dGVzJ306JHtpZH1gO1xuICB9XG59XG4iXX0=
