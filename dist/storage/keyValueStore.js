'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KeyValueStore = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var Bluebird = _interopRequireWildcard(_bluebird);

var _mergeOptions = require('merge-options');

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _storage = require('./storage');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function saneNumber(i) {
  return typeof i === 'number' && !isNaN(i) && i !== Infinity & i !== -Infinity;
}

// function applyDelta(base, delta) {
//   if (delta.op === 'add' || delta.op === 'modify') {
//     const retVal = mergeOptions({}, base, delta.data);
//     return retVal;
//   } else if (delta.op === 'remove') {
//     return undefined;
//   } else {
//     return base;
//   }
// }

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
    key: 'writeAttributes',
    value: function writeAttributes(inputValue) {
      var _this2 = this;

      var value = this.validateInput(inputValue);
      delete value.relationships;
      // trim out relationships for a direct write.
      return Bluebird.resolve().then(function () {
        if (!_this2.terminal) {
          throw new Error('Cannot create new content in a non-terminal store');
        }
      }).then(function () {
        if (value.id === undefined || value.id === null) {
          return _this2.$$maxKey(value.type).then(function (n) {
            var id = n + 1;
            return (0, _mergeOptions2.default)({}, value, { id: id, relationships: {} }); // if new.
          });
        } else {
          // if not new, get current (including relationships) and merge
          return _this2._get(_this2.keyString(value)).then(function (current) {
            return (0, _mergeOptions2.default)({}, JSON.parse(current), value);
          });
        }
      }).then(function (toSave) {
        return _this2._set(_this2.keyString(toSave), JSON.stringify(toSave)).then(function () {
          _this2.fireWriteUpdate(Object.assign({}, toSave, { invalidate: ['attributes'] }));
          return toSave;
        });
      });
    }
  }, {
    key: 'readAttributes',
    value: function readAttributes(value) {
      return this._get(this.keyString(value)).then(function (d) {
        var rV = JSON.parse(d);
        if (rV && rV.attributes && Object.keys(rV.attributes).length > 0) {
          return rV;
        } else {
          return null;
        }
      });
    }
  }, {
    key: 'cache',
    value: function cache(value) {
      var _this3 = this;

      if (value.id === undefined || value.id === null) {
        return Bluebird.reject('Cannot cache data without an id - write it to a terminal first');
      } else {
        return this._get(this.keyString(value)).then(function (current) {
          var newVal = (0, _mergeOptions2.default)(JSON.parse(current) || {}, value);
          return _this3._set(_this3.keyString(value), JSON.stringify(newVal));
        });
      }
    }
  }, {
    key: 'cacheAttributes',
    value: function cacheAttributes(value) {
      var _this4 = this;

      if (value.id === undefined || value.id === null) {
        return Bluebird.reject('Cannot cache data without an id - write it to a terminal first');
      } else {
        return this._get(this.keyString(value)).then(function (current) {
          return _this4._set(_this4.keyString(value), JSON.stringify({
            type: value.type,
            id: value.id,
            atttributes: value.attributes,
            relationships: current.relationships || {}
          }));
        });
      }
    }
  }, {
    key: 'cacheRelationship',
    value: function cacheRelationship(value) {
      var _this5 = this;

      if (value.id === undefined || value.id === null) {
        return Bluebird.reject('Cannot cache data without an id - write it to a terminal first');
      } else {
        return this._get(this.keyString(value)).then(function (current) {
          return _this5._set(_this5.keyString(value), JSON.stringify({
            type: value.type,
            id: value.id,
            atttributes: current.attributes || {},
            relationships: value.relationships
          }));
        });
      }
    }
  }, {
    key: 'readRelationship',
    value: function readRelationship(value, relName) {
      var _this6 = this;

      return this._get(this.keyString(value)).then(function (v) {
        var retVal = JSON.parse(v);
        if (!retVal.relationships[relName] && _this6.terminal) {
          retVal.relationships[relName] = [];
        }
        return retVal;
      });
    }
  }, {
    key: 'delete',
    value: function _delete(value) {
      var _this7 = this;

      return this._del(this.keyString(value)).then(function () {
        if (_this7.terminal) {
          _this7.fireWriteUpdate({ id: value.id, type: value.type, invalidate: ['attributes', 'relationships'] });
        }
      });
    }
  }, {
    key: 'wipe',
    value: function wipe(value, field) {
      var _this8 = this;

      var ks = this.keyString(value);
      return this._get(ks).then(function (val) {
        var newVal = JSON.parse(val);
        if (newVal === null) {
          return null;
        }
        if (field === 'attributes') {
          delete newVal.attributes;
        } else if (field === 'relationships') {
          delete newVal.relationships;
        } else if (field.indexOf('relationships.') === 0) {
          delete newVal.relationships[field.split('.')[1]];
          if (Object.keys(newVal.relationships).length === 0) {
            delete newVal.relationships;
          }
        } else {
          throw new Error('Cannot delete field ' + field + ' - unknown format');
        }
        return _this8._set(ks, newVal);
      });
    }
  }, {
    key: 'writeRelationshipItem',
    value: function writeRelationshipItem(value, relName, child) {
      var _this9 = this;

      var type = this.getType(value.type);
      var relSchema = type.$schema.relationships[relName].type;
      var otherRelType = relSchema.$sides[relName].otherType;
      var otherRelName = relSchema.$sides[relName].otherName;
      var thisKeyString = this.keyString(value);
      var otherKeyString = this.keyString({ type: otherRelType, id: child.id });
      return Bluebird.all([this._get(thisKeyString), this._get(otherKeyString)]).then(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            thisItemString = _ref2[0],
            otherItemString = _ref2[1];

        var thisItem = JSON.parse(thisItemString);
        if (!thisItem) {
          thisItem = {
            id: child.id,
            type: otherRelType,
            attributes: {},
            relationships: {}
          };
        }
        var otherItem = JSON.parse(otherItemString);
        if (!otherItem) {
          otherItem = {
            id: child.id,
            type: otherRelType,
            attributes: {},
            relationships: {}
          };
        }
        var newChild = { id: child.id };
        var newParent = { id: value.id };
        if (!thisItem.relationships[relName]) {
          thisItem.relationships[relName] = [];
        }
        if (!otherItem.relationships[otherRelName]) {
          otherItem.relationships[otherRelName] = [];
        }
        if (relSchema.$extras && child.meta) {
          newParent.meta = {};
          newChild.meta = {};
          for (var extra in child.meta) {
            if (extra in relSchema.$extras) {
              newChild.meta[extra] = child.meta[extra];
              newParent.meta[extra] = child.meta[extra];
            }
          }
        }

        var thisIdx = thisItem.relationships[relName].findIndex(function (item) {
          return item.id === child.id;
        });
        var otherIdx = otherItem.relationships[otherRelName].findIndex(function (item) {
          return item.id === value.id;
        });
        if (thisIdx < 0) {
          thisItem.relationships[relName].push(newChild);
        } else {
          thisItem.relationships[relName][thisIdx] = newChild;
        }
        if (otherIdx < 0) {
          otherItem.relationships[otherRelName].push(newParent);
        } else {
          otherItem.relationships[otherRelName][otherIdx] = newParent;
        }

        return Bluebird.all([_this9._set(_this9.keyString(thisItem), JSON.stringify(thisItem)), _this9._set(_this9.keyString(otherItem), JSON.stringify(otherItem))]).then(function () {
          _this9.fireWriteUpdate(Object.assign(thisItem, { invalidate: ['relationships.' + relName] }));
          _this9.fireWriteUpdate(Object.assign(otherItem, { invalidate: ['relationships.' + otherRelName] }));
        }).then(function () {
          return thisItem;
        });
      });
    }
  }, {
    key: 'deleteRelationshipItem',
    value: function deleteRelationshipItem(value, relName, childId) {
      var _this10 = this;

      var type = this.getType(value.type);
      var relSchema = type.$schema.relationships[relName].type;
      var otherRelType = relSchema.$sides[relName].otherType;
      var otherRelName = relSchema.$sides[relName].otherSide;
      var thisKeyString = this.keyString(value);
      var otherKeyString = this.keyString({ type: otherRelType, id: childId });
      return Bluebird.all([this._get(thisKeyString), this._get(otherKeyString)]).then(function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
            thisItemString = _ref4[0],
            otherItemString = _ref4[1];

        var thisItem = JSON.parse(thisItemString);
        var otherItem = JSON.parse(otherItemString);
        if (!thisItem.relationships[relName]) {
          thisItem.relationships[relName] = [];
        }
        if (!otherItem.relationships[otherRelName]) {
          otherItem.relationships[otherRelName] = [];
        }
        var thisIdx = thisItem.relationships[relName].findIndex(function (item) {
          return item.id === childId;
        });
        var otherIdx = otherItem.relationships[otherRelName].findIndex(function (item) {
          return item.id === value.id;
        });
        if (thisIdx >= 0) {
          thisItem.relationships[relName].splice(thisIdx, 1);
        }
        if (otherIdx >= 0) {
          otherItem.relationships[otherRelName].splice(otherIdx, 1);
        }

        return Bluebird.all([_this10._set(_this10.keyString(thisItem), JSON.stringify(thisItem)), _this10._set(_this10.keyString(otherItem), JSON.stringify(otherItem))]).then(function () {
          _this10.fireWriteUpdate(Object.assign(thisItem, { invalidate: ['relationships.' + relName] }));
          _this10.fireWriteUpdate(Object.assign(otherItem, { invalidate: ['relationships.' + otherRelName] }));
        }).then(function () {
          return thisItem;
        });
      });
    }
  }, {
    key: 'keyString',
    value: function keyString(value) {
      if (value.type === undefined) {
        throw new Error('Bad ARGS to keyString');
      }
      return value.type + ':' + value.id;
    }
  }]);

  return KeyValueStore;
}(_storage.Storage);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uva2V5VmFsdWVTdG9yZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsInNhbmVOdW1iZXIiLCJpIiwiaXNOYU4iLCJJbmZpbml0eSIsIktleVZhbHVlU3RvcmUiLCJ0IiwiX2tleXMiLCJ0aGVuIiwia2V5QXJyYXkiLCJsZW5ndGgiLCJtYXAiLCJrIiwic3BsaXQiLCJwYXJzZUludCIsImZpbHRlciIsInJlZHVjZSIsIm1heCIsImN1cnJlbnQiLCJpbnB1dFZhbHVlIiwidmFsdWUiLCJ2YWxpZGF0ZUlucHV0IiwicmVsYXRpb25zaGlwcyIsInJlc29sdmUiLCJ0ZXJtaW5hbCIsIkVycm9yIiwiaWQiLCJ1bmRlZmluZWQiLCIkJG1heEtleSIsInR5cGUiLCJuIiwiX2dldCIsImtleVN0cmluZyIsIkpTT04iLCJwYXJzZSIsInRvU2F2ZSIsIl9zZXQiLCJzdHJpbmdpZnkiLCJmaXJlV3JpdGVVcGRhdGUiLCJPYmplY3QiLCJhc3NpZ24iLCJpbnZhbGlkYXRlIiwiclYiLCJkIiwiYXR0cmlidXRlcyIsImtleXMiLCJyZWplY3QiLCJuZXdWYWwiLCJhdHR0cmlidXRlcyIsInJlbE5hbWUiLCJ2IiwicmV0VmFsIiwiX2RlbCIsImZpZWxkIiwia3MiLCJ2YWwiLCJpbmRleE9mIiwiY2hpbGQiLCJnZXRUeXBlIiwicmVsU2NoZW1hIiwiJHNjaGVtYSIsIm90aGVyUmVsVHlwZSIsIiRzaWRlcyIsIm90aGVyVHlwZSIsIm90aGVyUmVsTmFtZSIsIm90aGVyTmFtZSIsInRoaXNLZXlTdHJpbmciLCJvdGhlcktleVN0cmluZyIsImFsbCIsInRoaXNJdGVtU3RyaW5nIiwib3RoZXJJdGVtU3RyaW5nIiwidGhpc0l0ZW0iLCJvdGhlckl0ZW0iLCJuZXdDaGlsZCIsIm5ld1BhcmVudCIsIiRleHRyYXMiLCJtZXRhIiwiZXh0cmEiLCJ0aGlzSWR4IiwiZmluZEluZGV4IiwiaXRlbSIsIm90aGVySWR4IiwicHVzaCIsImNoaWxkSWQiLCJvdGhlclNpZGUiLCJzcGxp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U0FBTCxDQUFla0MsUUFBZixDQUFwQyxDQURrQixFQUVsQixRQUFLbkMsSUFBTCxDQUFVLFFBQUtKLFNBQUwsQ0FBZXdDLFNBQWYsQ0FBVixFQUFxQ3ZDLEtBQUtJLFNBQUwsQ0FBZW1DLFNBQWYsQ0FBckMsQ0FGa0IsQ0FBYixFQUdKaEUsSUFISSxDQUdDLFlBQU07QUFDWixrQkFBSzhCLGVBQUwsQ0FBcUJDLE9BQU9DLE1BQVAsQ0FBYytCLFFBQWQsRUFBd0IsRUFBRTlCLFlBQVksb0JBQWtCUSxPQUFsQixDQUFkLEVBQXhCLENBQXJCO0FBQ0Esa0JBQUtYLGVBQUwsQ0FBcUJDLE9BQU9DLE1BQVAsQ0FBY2dDLFNBQWQsRUFBeUIsRUFBRS9CLFlBQVksb0JBQWtCdUIsWUFBbEIsQ0FBZCxFQUF6QixDQUFyQjtBQUNELFNBTk0sRUFPTnhELElBUE0sQ0FPRDtBQUFBLGlCQUFNK0QsUUFBTjtBQUFBLFNBUEMsQ0FBUDtBQVFELE9BOUJNLENBQVA7QUErQkQ7Ozs4QkFFU25ELEssRUFBTztBQUNmLFVBQUlBLE1BQU1TLElBQU4sS0FBZUYsU0FBbkIsRUFBOEI7QUFDNUIsY0FBTSxJQUFJRixLQUFKLENBQVUsdUJBQVYsQ0FBTjtBQUNEO0FBQ0QsYUFBVUwsTUFBTVMsSUFBaEIsU0FBd0JULE1BQU1NLEVBQTlCO0FBQ0QiLCJmaWxlIjoic3RvcmFnZS9rZXlWYWx1ZVN0b3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcblxuaW1wb3J0IHsgU3RvcmFnZSB9IGZyb20gJy4vc3RvcmFnZSc7XG5cbmZ1bmN0aW9uIHNhbmVOdW1iZXIoaSkge1xuICByZXR1cm4gKCh0eXBlb2YgaSA9PT0gJ251bWJlcicpICYmICghaXNOYU4oaSkpICYmIChpICE9PSBJbmZpbml0eSkgJiAoaSAhPT0gLUluZmluaXR5KSk7XG59XG5cbi8vIGZ1bmN0aW9uIGFwcGx5RGVsdGEoYmFzZSwgZGVsdGEpIHtcbi8vICAgaWYgKGRlbHRhLm9wID09PSAnYWRkJyB8fCBkZWx0YS5vcCA9PT0gJ21vZGlmeScpIHtcbi8vICAgICBjb25zdCByZXRWYWwgPSBtZXJnZU9wdGlvbnMoe30sIGJhc2UsIGRlbHRhLmRhdGEpO1xuLy8gICAgIHJldHVybiByZXRWYWw7XG4vLyAgIH0gZWxzZSBpZiAoZGVsdGEub3AgPT09ICdyZW1vdmUnKSB7XG4vLyAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbi8vICAgfSBlbHNlIHtcbi8vICAgICByZXR1cm4gYmFzZTtcbi8vICAgfVxuLy8gfVxuXG5leHBvcnQgY2xhc3MgS2V5VmFsdWVTdG9yZSBleHRlbmRzIFN0b3JhZ2Uge1xuICAkJG1heEtleSh0KSB7XG4gICAgcmV0dXJuIHRoaXMuX2tleXModClcbiAgICAudGhlbigoa2V5QXJyYXkpID0+IHtcbiAgICAgIGlmIChrZXlBcnJheS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ga2V5QXJyYXkubWFwKChrKSA9PiBrLnNwbGl0KCc6JylbMl0pXG4gICAgICAgIC5tYXAoKGspID0+IHBhcnNlSW50KGssIDEwKSlcbiAgICAgICAgLmZpbHRlcigoaSkgPT4gc2FuZU51bWJlcihpKSlcbiAgICAgICAgLnJlZHVjZSgobWF4LCBjdXJyZW50KSA9PiAoY3VycmVudCA+IG1heCkgPyBjdXJyZW50IDogbWF4LCAwKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHdyaXRlQXR0cmlidXRlcyhpbnB1dFZhbHVlKSB7XG4gICAgY29uc3QgdmFsdWUgPSB0aGlzLnZhbGlkYXRlSW5wdXQoaW5wdXRWYWx1ZSk7XG4gICAgZGVsZXRlIHZhbHVlLnJlbGF0aW9uc2hpcHM7XG4gICAgLy8gdHJpbSBvdXQgcmVsYXRpb25zaGlwcyBmb3IgYSBkaXJlY3Qgd3JpdGUuXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmICghdGhpcy50ZXJtaW5hbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgbmV3IGNvbnRlbnQgaW4gYSBub24tdGVybWluYWwgc3RvcmUnKTtcbiAgICAgIH1cbiAgICB9KVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmICgodmFsdWUuaWQgPT09IHVuZGVmaW5lZCkgfHwgKHZhbHVlLmlkID09PSBudWxsKSkge1xuICAgICAgICByZXR1cm4gdGhpcy4kJG1heEtleSh2YWx1ZS50eXBlKVxuICAgICAgICAudGhlbigobikgPT4ge1xuICAgICAgICAgIGNvbnN0IGlkID0gbiArIDE7XG4gICAgICAgICAgcmV0dXJuIG1lcmdlT3B0aW9ucyh7fSwgdmFsdWUsIHsgaWQ6IGlkLCByZWxhdGlvbnNoaXBzOiB7fSB9KTsgLy8gaWYgbmV3LlxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGlmIG5vdCBuZXcsIGdldCBjdXJyZW50IChpbmNsdWRpbmcgcmVsYXRpb25zaGlwcykgYW5kIG1lcmdlXG4gICAgICAgIHJldHVybiB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodmFsdWUpKS50aGVuKGN1cnJlbnQgPT4gbWVyZ2VPcHRpb25zKHt9LCBKU09OLnBhcnNlKGN1cnJlbnQpLCB2YWx1ZSkpO1xuICAgICAgfVxuICAgIH0pXG4gICAgLnRoZW4oKHRvU2F2ZSkgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyh0b1NhdmUpLCBKU09OLnN0cmluZ2lmeSh0b1NhdmUpKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLmZpcmVXcml0ZVVwZGF0ZShPYmplY3QuYXNzaWduKHt9LCB0b1NhdmUsIHsgaW52YWxpZGF0ZTogWydhdHRyaWJ1dGVzJ10gfSkpO1xuICAgICAgICByZXR1cm4gdG9TYXZlO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICByZWFkQXR0cmlidXRlcyh2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodmFsdWUpKVxuICAgIC50aGVuKGQgPT4ge1xuICAgICAgY29uc3QgclYgPSBKU09OLnBhcnNlKGQpO1xuICAgICAgaWYgKHJWICYmIHJWLmF0dHJpYnV0ZXMgJiYgT2JqZWN0LmtleXMoclYuYXR0cmlidXRlcykubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gclY7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGNhY2hlKHZhbHVlKSB7XG4gICAgaWYgKCh2YWx1ZS5pZCA9PT0gdW5kZWZpbmVkKSB8fCAodmFsdWUuaWQgPT09IG51bGwpKSB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KCdDYW5ub3QgY2FjaGUgZGF0YSB3aXRob3V0IGFuIGlkIC0gd3JpdGUgaXQgdG8gYSB0ZXJtaW5hbCBmaXJzdCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHZhbHVlKSlcbiAgICAgIC50aGVuKChjdXJyZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IG5ld1ZhbCA9IG1lcmdlT3B0aW9ucyhKU09OLnBhcnNlKGN1cnJlbnQpIHx8IHt9LCB2YWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzLl9zZXQodGhpcy5rZXlTdHJpbmcodmFsdWUpLCBKU09OLnN0cmluZ2lmeShuZXdWYWwpKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGNhY2hlQXR0cmlidXRlcyh2YWx1ZSkge1xuICAgIGlmICgodmFsdWUuaWQgPT09IHVuZGVmaW5lZCkgfHwgKHZhbHVlLmlkID09PSBudWxsKSkge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdCgnQ2Fubm90IGNhY2hlIGRhdGEgd2l0aG91dCBhbiBpZCAtIHdyaXRlIGl0IHRvIGEgdGVybWluYWwgZmlyc3QnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX2dldCh0aGlzLmtleVN0cmluZyh2YWx1ZSkpXG4gICAgICAudGhlbigoY3VycmVudCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2V0KHRoaXMua2V5U3RyaW5nKHZhbHVlKSwgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIHR5cGU6IHZhbHVlLnR5cGUsXG4gICAgICAgICAgaWQ6IHZhbHVlLmlkLFxuICAgICAgICAgIGF0dHRyaWJ1dGVzOiB2YWx1ZS5hdHRyaWJ1dGVzLFxuICAgICAgICAgIHJlbGF0aW9uc2hpcHM6IGN1cnJlbnQucmVsYXRpb25zaGlwcyB8fCB7fSxcbiAgICAgICAgfSkpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgY2FjaGVSZWxhdGlvbnNoaXAodmFsdWUpIHtcbiAgICBpZiAoKHZhbHVlLmlkID09PSB1bmRlZmluZWQpIHx8ICh2YWx1ZS5pZCA9PT0gbnVsbCkpIHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QoJ0Nhbm5vdCBjYWNoZSBkYXRhIHdpdGhvdXQgYW4gaWQgLSB3cml0ZSBpdCB0byBhIHRlcm1pbmFsIGZpcnN0Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLl9nZXQodGhpcy5rZXlTdHJpbmcodmFsdWUpKVxuICAgICAgLnRoZW4oKGN1cnJlbnQpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyh2YWx1ZSksIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICB0eXBlOiB2YWx1ZS50eXBlLFxuICAgICAgICAgIGlkOiB2YWx1ZS5pZCxcbiAgICAgICAgICBhdHR0cmlidXRlczogY3VycmVudC5hdHRyaWJ1dGVzIHx8IHt9LFxuICAgICAgICAgIHJlbGF0aW9uc2hpcHM6IHZhbHVlLnJlbGF0aW9uc2hpcHMsXG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJlYWRSZWxhdGlvbnNoaXAodmFsdWUsIHJlbE5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0KHRoaXMua2V5U3RyaW5nKHZhbHVlKSlcbiAgICAudGhlbigodikgPT4ge1xuICAgICAgY29uc3QgcmV0VmFsID0gSlNPTi5wYXJzZSh2KTtcbiAgICAgIGlmICghcmV0VmFsLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0gJiYgdGhpcy50ZXJtaW5hbCkge1xuICAgICAgICByZXRWYWwucmVsYXRpb25zaGlwc1tyZWxOYW1lXSA9IFtdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJldFZhbDtcbiAgICB9KTtcbiAgfVxuXG4gIGRlbGV0ZSh2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLl9kZWwodGhpcy5rZXlTdHJpbmcodmFsdWUpKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgIHRoaXMuZmlyZVdyaXRlVXBkYXRlKHsgaWQ6IHZhbHVlLmlkLCB0eXBlOiB2YWx1ZS50eXBlLCBpbnZhbGlkYXRlOiBbJ2F0dHJpYnV0ZXMnLCAncmVsYXRpb25zaGlwcyddIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgd2lwZSh2YWx1ZSwgZmllbGQpIHtcbiAgICBjb25zdCBrcyA9IHRoaXMua2V5U3RyaW5nKHZhbHVlKTtcbiAgICByZXR1cm4gdGhpcy5fZ2V0KGtzKVxuICAgIC50aGVuKCh2YWwpID0+IHtcbiAgICAgIGNvbnN0IG5ld1ZhbCA9IEpTT04ucGFyc2UodmFsKTtcbiAgICAgIGlmIChuZXdWYWwgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBpZiAoZmllbGQgPT09ICdhdHRyaWJ1dGVzJykge1xuICAgICAgICBkZWxldGUgbmV3VmFsLmF0dHJpYnV0ZXM7XG4gICAgICB9IGVsc2UgaWYgKGZpZWxkID09PSAncmVsYXRpb25zaGlwcycpIHtcbiAgICAgICAgZGVsZXRlIG5ld1ZhbC5yZWxhdGlvbnNoaXBzO1xuICAgICAgfSBlbHNlIGlmIChmaWVsZC5pbmRleE9mKCdyZWxhdGlvbnNoaXBzLicpID09PSAwKSB7XG4gICAgICAgIGRlbGV0ZSBuZXdWYWwucmVsYXRpb25zaGlwc1tmaWVsZC5zcGxpdCgnLicpWzFdXTtcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKG5ld1ZhbC5yZWxhdGlvbnNoaXBzKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBkZWxldGUgbmV3VmFsLnJlbGF0aW9uc2hpcHM7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGRlbGV0ZSBmaWVsZCAke2ZpZWxkfSAtIHVua25vd24gZm9ybWF0YCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fc2V0KGtzLCBuZXdWYWwpO1xuICAgIH0pO1xuICB9XG5cbiAgd3JpdGVSZWxhdGlvbnNoaXBJdGVtKHZhbHVlLCByZWxOYW1lLCBjaGlsZCkge1xuICAgIGNvbnN0IHR5cGUgPSB0aGlzLmdldFR5cGUodmFsdWUudHlwZSk7XG4gICAgY29uc3QgcmVsU2NoZW1hID0gdHlwZS4kc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0udHlwZTtcbiAgICBjb25zdCBvdGhlclJlbFR5cGUgPSByZWxTY2hlbWEuJHNpZGVzW3JlbE5hbWVdLm90aGVyVHlwZTtcbiAgICBjb25zdCBvdGhlclJlbE5hbWUgPSByZWxTY2hlbWEuJHNpZGVzW3JlbE5hbWVdLm90aGVyTmFtZTtcbiAgICBjb25zdCB0aGlzS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcodmFsdWUpO1xuICAgIGNvbnN0IG90aGVyS2V5U3RyaW5nID0gdGhpcy5rZXlTdHJpbmcoeyB0eXBlOiBvdGhlclJlbFR5cGUsIGlkOiBjaGlsZC5pZCB9KTtcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgIHRoaXMuX2dldCh0aGlzS2V5U3RyaW5nKSxcbiAgICAgIHRoaXMuX2dldChvdGhlcktleVN0cmluZyksXG4gICAgXSlcbiAgICAudGhlbigoW3RoaXNJdGVtU3RyaW5nLCBvdGhlckl0ZW1TdHJpbmddKSA9PiB7XG4gICAgICBsZXQgdGhpc0l0ZW0gPSBKU09OLnBhcnNlKHRoaXNJdGVtU3RyaW5nKTtcbiAgICAgIGlmICghdGhpc0l0ZW0pIHtcbiAgICAgICAgdGhpc0l0ZW0gPSB7XG4gICAgICAgICAgaWQ6IGNoaWxkLmlkLFxuICAgICAgICAgIHR5cGU6IG90aGVyUmVsVHlwZSxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiB7fSxcbiAgICAgICAgICByZWxhdGlvbnNoaXBzOiB7fSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGxldCBvdGhlckl0ZW0gPSBKU09OLnBhcnNlKG90aGVySXRlbVN0cmluZyk7XG4gICAgICBpZiAoIW90aGVySXRlbSkge1xuICAgICAgICBvdGhlckl0ZW0gPSB7XG4gICAgICAgICAgaWQ6IGNoaWxkLmlkLFxuICAgICAgICAgIHR5cGU6IG90aGVyUmVsVHlwZSxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiB7fSxcbiAgICAgICAgICByZWxhdGlvbnNoaXBzOiB7fSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG5ld0NoaWxkID0geyBpZDogY2hpbGQuaWQgfTtcbiAgICAgIGNvbnN0IG5ld1BhcmVudCA9IHsgaWQ6IHZhbHVlLmlkIH07XG4gICAgICBpZiAoIXRoaXNJdGVtLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0pIHtcbiAgICAgICAgdGhpc0l0ZW0ucmVsYXRpb25zaGlwc1tyZWxOYW1lXSA9IFtdO1xuICAgICAgfVxuICAgICAgaWYgKCFvdGhlckl0ZW0ucmVsYXRpb25zaGlwc1tvdGhlclJlbE5hbWVdKSB7XG4gICAgICAgIG90aGVySXRlbS5yZWxhdGlvbnNoaXBzW290aGVyUmVsTmFtZV0gPSBbXTtcbiAgICAgIH1cbiAgICAgIGlmIChyZWxTY2hlbWEuJGV4dHJhcyAmJiBjaGlsZC5tZXRhKSB7XG4gICAgICAgIG5ld1BhcmVudC5tZXRhID0ge307XG4gICAgICAgIG5ld0NoaWxkLm1ldGEgPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCBleHRyYSBpbiBjaGlsZC5tZXRhKSB7XG4gICAgICAgICAgaWYgKGV4dHJhIGluIHJlbFNjaGVtYS4kZXh0cmFzKSB7XG4gICAgICAgICAgICBuZXdDaGlsZC5tZXRhW2V4dHJhXSA9IGNoaWxkLm1ldGFbZXh0cmFdO1xuICAgICAgICAgICAgbmV3UGFyZW50Lm1ldGFbZXh0cmFdID0gY2hpbGQubWV0YVtleHRyYV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRoaXNJZHggPSB0aGlzSXRlbS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLmZpbmRJbmRleChpdGVtID0+IGl0ZW0uaWQgPT09IGNoaWxkLmlkKTtcbiAgICAgIGNvbnN0IG90aGVySWR4ID0gb3RoZXJJdGVtLnJlbGF0aW9uc2hpcHNbb3RoZXJSZWxOYW1lXS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSB2YWx1ZS5pZCk7XG4gICAgICBpZiAodGhpc0lkeCA8IDApIHtcbiAgICAgICAgdGhpc0l0ZW0ucmVsYXRpb25zaGlwc1tyZWxOYW1lXS5wdXNoKG5ld0NoaWxkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXNJdGVtLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV1bdGhpc0lkeF0gPSBuZXdDaGlsZDtcbiAgICAgIH1cbiAgICAgIGlmIChvdGhlcklkeCA8IDApIHtcbiAgICAgICAgb3RoZXJJdGVtLnJlbGF0aW9uc2hpcHNbb3RoZXJSZWxOYW1lXS5wdXNoKG5ld1BhcmVudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdGhlckl0ZW0ucmVsYXRpb25zaGlwc1tvdGhlclJlbE5hbWVdW290aGVySWR4XSA9IG5ld1BhcmVudDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChbXG4gICAgICAgIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyh0aGlzSXRlbSksIEpTT04uc3RyaW5naWZ5KHRoaXNJdGVtKSksXG4gICAgICAgIHRoaXMuX3NldCh0aGlzLmtleVN0cmluZyhvdGhlckl0ZW0pLCBKU09OLnN0cmluZ2lmeShvdGhlckl0ZW0pKSxcbiAgICAgIF0pLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLmZpcmVXcml0ZVVwZGF0ZShPYmplY3QuYXNzaWduKHRoaXNJdGVtLCB7IGludmFsaWRhdGU6IFtgcmVsYXRpb25zaGlwcy4ke3JlbE5hbWV9YF0gfSkpO1xuICAgICAgICB0aGlzLmZpcmVXcml0ZVVwZGF0ZShPYmplY3QuYXNzaWduKG90aGVySXRlbSwgeyBpbnZhbGlkYXRlOiBbYHJlbGF0aW9uc2hpcHMuJHtvdGhlclJlbE5hbWV9YF0gfSkpO1xuICAgICAgfSlcbiAgICAgIC50aGVuKCgpID0+IHRoaXNJdGVtKTtcbiAgICB9KTtcbiAgfVxuXG4gIGRlbGV0ZVJlbGF0aW9uc2hpcEl0ZW0odmFsdWUsIHJlbE5hbWUsIGNoaWxkSWQpIHtcbiAgICBjb25zdCB0eXBlID0gdGhpcy5nZXRUeXBlKHZhbHVlLnR5cGUpO1xuICAgIGNvbnN0IHJlbFNjaGVtYSA9IHR5cGUuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnR5cGU7XG4gICAgY29uc3Qgb3RoZXJSZWxUeXBlID0gcmVsU2NoZW1hLiRzaWRlc1tyZWxOYW1lXS5vdGhlclR5cGU7XG4gICAgY29uc3Qgb3RoZXJSZWxOYW1lID0gcmVsU2NoZW1hLiRzaWRlc1tyZWxOYW1lXS5vdGhlclNpZGU7XG4gICAgY29uc3QgdGhpc0tleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHZhbHVlKTtcbiAgICBjb25zdCBvdGhlcktleVN0cmluZyA9IHRoaXMua2V5U3RyaW5nKHsgdHlwZTogb3RoZXJSZWxUeXBlLCBpZDogY2hpbGRJZCB9KTtcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgIHRoaXMuX2dldCh0aGlzS2V5U3RyaW5nKSxcbiAgICAgIHRoaXMuX2dldChvdGhlcktleVN0cmluZyksXG4gICAgXSlcbiAgICAudGhlbigoW3RoaXNJdGVtU3RyaW5nLCBvdGhlckl0ZW1TdHJpbmddKSA9PiB7XG4gICAgICBjb25zdCB0aGlzSXRlbSA9IEpTT04ucGFyc2UodGhpc0l0ZW1TdHJpbmcpO1xuICAgICAgY29uc3Qgb3RoZXJJdGVtID0gSlNPTi5wYXJzZShvdGhlckl0ZW1TdHJpbmcpO1xuICAgICAgaWYgKCF0aGlzSXRlbS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdKSB7XG4gICAgICAgIHRoaXNJdGVtLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0gPSBbXTtcbiAgICAgIH1cbiAgICAgIGlmICghb3RoZXJJdGVtLnJlbGF0aW9uc2hpcHNbb3RoZXJSZWxOYW1lXSkge1xuICAgICAgICBvdGhlckl0ZW0ucmVsYXRpb25zaGlwc1tvdGhlclJlbE5hbWVdID0gW107XG4gICAgICB9XG4gICAgICBjb25zdCB0aGlzSWR4ID0gdGhpc0l0ZW0ucmVsYXRpb25zaGlwc1tyZWxOYW1lXS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSBjaGlsZElkKTtcbiAgICAgIGNvbnN0IG90aGVySWR4ID0gb3RoZXJJdGVtLnJlbGF0aW9uc2hpcHNbb3RoZXJSZWxOYW1lXS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSB2YWx1ZS5pZCk7XG4gICAgICBpZiAodGhpc0lkeCA+PSAwKSB7XG4gICAgICAgIHRoaXNJdGVtLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0uc3BsaWNlKHRoaXNJZHgsIDEpO1xuICAgICAgfVxuICAgICAgaWYgKG90aGVySWR4ID49IDApIHtcbiAgICAgICAgb3RoZXJJdGVtLnJlbGF0aW9uc2hpcHNbb3RoZXJSZWxOYW1lXS5zcGxpY2Uob3RoZXJJZHgsIDEpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgdGhpcy5fc2V0KHRoaXMua2V5U3RyaW5nKHRoaXNJdGVtKSwgSlNPTi5zdHJpbmdpZnkodGhpc0l0ZW0pKSxcbiAgICAgICAgdGhpcy5fc2V0KHRoaXMua2V5U3RyaW5nKG90aGVySXRlbSksIEpTT04uc3RyaW5naWZ5KG90aGVySXRlbSkpLFxuICAgICAgXSkudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMuZmlyZVdyaXRlVXBkYXRlKE9iamVjdC5hc3NpZ24odGhpc0l0ZW0sIHsgaW52YWxpZGF0ZTogW2ByZWxhdGlvbnNoaXBzLiR7cmVsTmFtZX1gXSB9KSk7XG4gICAgICAgIHRoaXMuZmlyZVdyaXRlVXBkYXRlKE9iamVjdC5hc3NpZ24ob3RoZXJJdGVtLCB7IGludmFsaWRhdGU6IFtgcmVsYXRpb25zaGlwcy4ke290aGVyUmVsTmFtZX1gXSB9KSk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4gdGhpc0l0ZW0pO1xuICAgIH0pO1xuICB9XG5cbiAga2V5U3RyaW5nKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlLnR5cGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCYWQgQVJHUyB0byBrZXlTdHJpbmcnKTtcbiAgICB9XG4gICAgcmV0dXJuIGAke3ZhbHVlLnR5cGV9OiR7dmFsdWUuaWR9YDtcbiAgfVxufVxuIl19
