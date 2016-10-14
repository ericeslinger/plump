'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MemoryStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _storage = require('./storage');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var $store = Symbol('$store');

var MemoryStorage = exports.MemoryStorage = function (_Storage) {
  _inherits(MemoryStorage, _Storage);

  function MemoryStorage() {
    var _ref;

    _classCallCheck(this, MemoryStorage);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_ref = MemoryStorage.__proto__ || Object.getPrototypeOf(MemoryStorage)).call.apply(_ref, [this].concat(args)));

    _this[$store] = {};
    _this.maxId = 0;
    return _this;
  }

  _createClass(MemoryStorage, [{
    key: '$$ensure',
    value: function $$ensure(t, id) {
      if (this[$store][t.$name] === undefined) {
        this[$store][t.$name] = {};
      }
      if (id !== undefined) {
        if (this[$store][t.$name][id] === undefined) {
          this[$store][t.$name][id] = {};
        }
        return this[$store][t.$name][id];
      } else {
        return this[$store][t.$name];
      }
    }
  }, {
    key: '$$getRelationship',
    value: function $$getRelationship(t, parentId, relationship, childId) {
      if (this.$$ensure(t, parentId)[relationship] === undefined) {
        var newAry = [];
        this.$$ensure(t, parentId)[relationship] = newAry;
      }
      if (childId !== undefined) {
        var theOther = t.$fields[relationship].relationship.otherType(relationship);
        var childObj = this.$$ensure(theOther, childId);
        if (childObj[theOther.$name] === undefined) {
          childObj[theOther.$name] = this.$$ensure(t, parentId)[relationship];
        }
      }
      return this.$$ensure(t, parentId)[relationship];
    }
  }, {
    key: 'write',
    value: function write(t, v) {
      var id = v[t.$id];
      if (id === undefined) {
        if (this.terminal) {
          id = this.maxId + 1;
        } else {
          throw new Error('Cannot create new content in a non-terminal store');
        }
      }
      var updateObject = this.$$ensure(t)[id];
      if (updateObject === undefined) {
        this.maxId = id;
        updateObject = _defineProperty({}, t.$id, id);
        this.$$ensure(t)[id] = updateObject;
      }
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
      return Promise.resolve(Object.assign({}, updateObject));
    }
  }, {
    key: 'delete',
    value: function _delete(t, id) {
      var retVal = this.$$ensure(t)[id];
      delete this.$$ensure(t)[id];
      return Promise.resolve(retVal);
    }
  }, {
    key: 'add',
    value: function add(t, id, relationship, childId, extras) {
      var Rel = t.$fields[relationship].relationship;
      var relationshipArray = this.$$getRelationship(t, id, relationship, childId);
      // store: {parent_id: 1, child_id: 2, perm: 3}
      var otherField = Rel.$sides[relationship];
      var selfField = Rel.otherType(relationship);
      var idx = relationshipArray.findIndex(function (v) {
        return v[selfField.field] === id && v[otherField.field] === childId;
      });
      if (idx < 0) {
        (function () {
          var _newRelationship;

          var newRelationship = (_newRelationship = {}, _defineProperty(_newRelationship, selfField.field, id), _defineProperty(_newRelationship, otherField.field, childId), _newRelationship);
          (Rel.$extras || []).forEach(function (e) {
            newRelationship[e] = extras[e];
          });
          relationshipArray.push(newRelationship);
        })();
      }
      return Promise.resolve(relationshipArray.concat());
    }
  }, {
    key: 'readOne',
    value: function readOne(t, id) {
      return Promise.resolve(this.$$ensure(t)[id] || null);
    }
  }, {
    key: 'readMany',
    value: function readMany(t, id, relationship) {
      return Promise.resolve(_defineProperty({}, relationship, (this.$$getRelationship(t, id, relationship) || []).concat()));
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(t, id, relationship, childId, extras) {
      var Rel = t.$fields[relationship].relationship;
      var relationshipArray = this.$$getRelationship(t, id, relationship, childId);
      // store: {parent_id: 1, child_id: 2, perm: 3}
      var otherField = Rel.$sides[relationship];
      var selfField = Rel.otherType(relationship);
      var idx = relationshipArray.findIndex(function (v) {
        return v[selfField.field] === id && v[otherField.field] === childId;
      });
      if (idx >= 0) {
        relationshipArray[idx] = Object.assign({}, relationshipArray[idx], extras);
        return Promise.resolve(relationshipArray.concat());
      } else {
        return Promise.reject(new Error('Item ' + childId + ' not found in ' + relationship + ' of ' + t.$name));
      }
    }
  }, {
    key: 'remove',
    value: function remove(t, id, relationship, childId) {
      var Rel = t.$fields[relationship].relationship;
      var relationshipArray = this.$$getRelationship(t, id, relationship, childId);
      // store: {parent_id: 1, child_id: 2, perm: 3}
      var otherField = Rel.$sides[relationship];
      var selfField = Rel.otherType(relationship);
      var idx = relationshipArray.findIndex(function (v) {
        return v[selfField.field] === id && v[otherField.field] === childId;
      });
      if (idx >= 0) {
        relationshipArray.splice(idx, 1);
        return Promise.resolve(relationshipArray.concat());
      }
      return Promise.reject(new Error('Item ' + childId + ' not found in ' + relationship + ' of ' + t.$name));
    }
  }, {
    key: 'query',
    value: function query() {
      return Promise.reject(new Error('Query interface not supported on MemoryStorage'));
    }
  }]);

  return MemoryStorage;
}(_storage.Storage);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvbWVtb3J5LmpzIl0sIm5hbWVzIjpbIlByb21pc2UiLCIkc3RvcmUiLCJTeW1ib2wiLCJNZW1vcnlTdG9yYWdlIiwiYXJncyIsIm1heElkIiwidCIsImlkIiwiJG5hbWUiLCJ1bmRlZmluZWQiLCJwYXJlbnRJZCIsInJlbGF0aW9uc2hpcCIsImNoaWxkSWQiLCIkJGVuc3VyZSIsIm5ld0FyeSIsInRoZU90aGVyIiwiJGZpZWxkcyIsIm90aGVyVHlwZSIsImNoaWxkT2JqIiwidiIsIiRpZCIsInRlcm1pbmFsIiwiRXJyb3IiLCJ1cGRhdGVPYmplY3QiLCJPYmplY3QiLCJrZXlzIiwiZm9yRWFjaCIsImZpZWxkTmFtZSIsInR5cGUiLCJjb25jYXQiLCJhc3NpZ24iLCJyZXNvbHZlIiwicmV0VmFsIiwiZXh0cmFzIiwiUmVsIiwicmVsYXRpb25zaGlwQXJyYXkiLCIkJGdldFJlbGF0aW9uc2hpcCIsIm90aGVyRmllbGQiLCIkc2lkZXMiLCJzZWxmRmllbGQiLCJpZHgiLCJmaW5kSW5kZXgiLCJmaWVsZCIsIm5ld1JlbGF0aW9uc2hpcCIsIiRleHRyYXMiLCJlIiwicHVzaCIsInJlamVjdCIsInNwbGljZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0lBQVlBLE87O0FBQ1o7Ozs7Ozs7Ozs7OztBQUVBLElBQU1DLFNBQVNDLE9BQU8sUUFBUCxDQUFmOztJQUVhQyxhLFdBQUFBLGE7OztBQUVYLDJCQUFxQjtBQUFBOztBQUFBOztBQUFBLHNDQUFOQyxJQUFNO0FBQU5BLFVBQU07QUFBQTs7QUFBQSx5SkFDVkEsSUFEVTs7QUFFbkIsVUFBS0gsTUFBTCxJQUFlLEVBQWY7QUFDQSxVQUFLSSxLQUFMLEdBQWEsQ0FBYjtBQUhtQjtBQUlwQjs7Ozs2QkFFUUMsQyxFQUFHQyxFLEVBQUk7QUFDZCxVQUFJLEtBQUtOLE1BQUwsRUFBYUssRUFBRUUsS0FBZixNQUEwQkMsU0FBOUIsRUFBeUM7QUFDdkMsYUFBS1IsTUFBTCxFQUFhSyxFQUFFRSxLQUFm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O0FBQ0QsYUFBTzdCLFFBQVErQyxNQUFSLENBQWUsSUFBSXpCLEtBQUosV0FBa0JWLE9BQWxCLHNCQUEwQ0QsWUFBMUMsWUFBNkRMLEVBQUVFLEtBQS9ELENBQWYsQ0FBUDtBQUNEOzs7NEJBRU87QUFDTixhQUFPUixRQUFRK0MsTUFBUixDQUFlLElBQUl6QixLQUFKLENBQVUsZ0RBQVYsQ0FBZixDQUFQO0FBQ0QiLCJmaWxlIjoic3RvcmFnZS9tZW1vcnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7U3RvcmFnZX0gZnJvbSAnLi9zdG9yYWdlJztcblxuY29uc3QgJHN0b3JlID0gU3ltYm9sKCckc3RvcmUnKTtcblxuZXhwb3J0IGNsYXNzIE1lbW9yeVN0b3JhZ2UgZXh0ZW5kcyBTdG9yYWdlIHtcblxuICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgc3VwZXIoLi4uYXJncyk7XG4gICAgdGhpc1skc3RvcmVdID0ge307XG4gICAgdGhpcy5tYXhJZCA9IDA7XG4gIH1cblxuICAkJGVuc3VyZSh0LCBpZCkge1xuICAgIGlmICh0aGlzWyRzdG9yZV1bdC4kbmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skc3RvcmVdW3QuJG5hbWVdID0ge307XG4gICAgfVxuICAgIGlmIChpZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodGhpc1skc3RvcmVdW3QuJG5hbWVdW2lkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXNbJHN0b3JlXVt0LiRuYW1lXVtpZF0gPSB7fTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzWyRzdG9yZV1bdC4kbmFtZV1baWRdO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpc1skc3RvcmVdW3QuJG5hbWVdO1xuICAgIH1cbiAgfVxuXG4gICQkZ2V0UmVsYXRpb25zaGlwKHQsIHBhcmVudElkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQpIHtcbiAgICBpZiAodGhpcy4kJGVuc3VyZSh0LCBwYXJlbnRJZClbcmVsYXRpb25zaGlwXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBuZXdBcnkgPSBbXTtcbiAgICAgIHRoaXMuJCRlbnN1cmUodCwgcGFyZW50SWQpW3JlbGF0aW9uc2hpcF0gPSBuZXdBcnk7XG4gICAgfVxuICAgIGlmIChjaGlsZElkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IHRoZU90aGVyID0gdC4kZmllbGRzW3JlbGF0aW9uc2hpcF0ucmVsYXRpb25zaGlwLm90aGVyVHlwZShyZWxhdGlvbnNoaXApO1xuICAgICAgY29uc3QgY2hpbGRPYmogPSB0aGlzLiQkZW5zdXJlKHRoZU90aGVyLCBjaGlsZElkKTtcbiAgICAgIGlmIChjaGlsZE9ialt0aGVPdGhlci4kbmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjaGlsZE9ialt0aGVPdGhlci4kbmFtZV0gPSB0aGlzLiQkZW5zdXJlKHQsIHBhcmVudElkKVtyZWxhdGlvbnNoaXBdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy4kJGVuc3VyZSh0LCBwYXJlbnRJZClbcmVsYXRpb25zaGlwXTtcbiAgfVxuXG4gIHdyaXRlKHQsIHYpIHtcbiAgICBsZXQgaWQgPSB2W3QuJGlkXTtcbiAgICBpZiAoaWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgaWQgPSB0aGlzLm1heElkICsgMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBuZXcgY29udGVudCBpbiBhIG5vbi10ZXJtaW5hbCBzdG9yZScpO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgdXBkYXRlT2JqZWN0ID0gdGhpcy4kJGVuc3VyZSh0KVtpZF07XG4gICAgaWYgKHVwZGF0ZU9iamVjdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm1heElkID0gaWQ7XG4gICAgICB1cGRhdGVPYmplY3QgPSB7XG4gICAgICAgIFt0LiRpZF06IGlkLFxuICAgICAgfTtcbiAgICAgIHRoaXMuJCRlbnN1cmUodClbaWRdID0gdXBkYXRlT2JqZWN0O1xuICAgIH1cbiAgICBPYmplY3Qua2V5cyh0LiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgaWYgKHZbZmllbGROYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGNvcHkgZnJvbSB2IHRvIHRoZSBiZXN0IG9mIG91ciBhYmlsaXR5XG4gICAgICAgIGlmIChcbiAgICAgICAgICAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2FycmF5JykgfHxcbiAgICAgICAgICAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2hhc01hbnknKVxuICAgICAgICApIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IHZbZmllbGROYW1lXS5jb25jYXQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0LiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgdltmaWVsZE5hbWVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IHZbZmllbGROYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoT2JqZWN0LmFzc2lnbih7fSwgdXBkYXRlT2JqZWN0KSk7XG4gIH1cblxuICBkZWxldGUodCwgaWQpIHtcbiAgICBjb25zdCByZXRWYWwgPSB0aGlzLiQkZW5zdXJlKHQpW2lkXTtcbiAgICBkZWxldGUgdGhpcy4kJGVuc3VyZSh0KVtpZF07XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXRWYWwpO1xuICB9XG5cbiAgYWRkKHQsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQsIGV4dHJhcykge1xuICAgIGNvbnN0IFJlbCA9IHQuJGZpZWxkc1tyZWxhdGlvbnNoaXBdLnJlbGF0aW9uc2hpcDtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBBcnJheSA9IHRoaXMuJCRnZXRSZWxhdGlvbnNoaXAodCwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCk7XG4gICAgLy8gc3RvcmU6IHtwYXJlbnRfaWQ6IDEsIGNoaWxkX2lkOiAyLCBwZXJtOiAzfVxuICAgIGNvbnN0IG90aGVyRmllbGQgPSBSZWwuJHNpZGVzW3JlbGF0aW9uc2hpcF07XG4gICAgY29uc3Qgc2VsZkZpZWxkID0gUmVsLm90aGVyVHlwZShyZWxhdGlvbnNoaXApO1xuICAgIGNvbnN0IGlkeCA9IHJlbGF0aW9uc2hpcEFycmF5LmZpbmRJbmRleCgodikgPT4gKCh2W3NlbGZGaWVsZC5maWVsZF0gPT09IGlkKSAmJiAodltvdGhlckZpZWxkLmZpZWxkXSA9PT0gY2hpbGRJZCkpKTtcbiAgICBpZiAoaWR4IDwgMCkge1xuICAgICAgY29uc3QgbmV3UmVsYXRpb25zaGlwID0ge1tzZWxmRmllbGQuZmllbGRdOiBpZCwgW290aGVyRmllbGQuZmllbGRdOiBjaGlsZElkfTtcbiAgICAgIChSZWwuJGV4dHJhcyB8fCBbXSkuZm9yRWFjaCgoZSkgPT4ge1xuICAgICAgICBuZXdSZWxhdGlvbnNoaXBbZV0gPSBleHRyYXNbZV07XG4gICAgICB9KTtcbiAgICAgIHJlbGF0aW9uc2hpcEFycmF5LnB1c2gobmV3UmVsYXRpb25zaGlwKTtcbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZWxhdGlvbnNoaXBBcnJheS5jb25jYXQoKSk7XG4gIH1cblxuICByZWFkT25lKHQsIGlkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLiQkZW5zdXJlKHQpW2lkXSB8fCBudWxsKTtcbiAgfVxuXG4gIHJlYWRNYW55KHQsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtbcmVsYXRpb25zaGlwXTogKHRoaXMuJCRnZXRSZWxhdGlvbnNoaXAodCwgaWQsIHJlbGF0aW9uc2hpcCkgfHwgW10pLmNvbmNhdCgpfSk7XG4gIH1cblxuICBtb2RpZnlSZWxhdGlvbnNoaXAodCwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCwgZXh0cmFzKSB7XG4gICAgY29uc3QgUmVsID0gdC4kZmllbGRzW3JlbGF0aW9uc2hpcF0ucmVsYXRpb25zaGlwO1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcEFycmF5ID0gdGhpcy4kJGdldFJlbGF0aW9uc2hpcCh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKTtcbiAgICAvLyBzdG9yZToge3BhcmVudF9pZDogMSwgY2hpbGRfaWQ6IDIsIHBlcm06IDN9XG4gICAgY29uc3Qgb3RoZXJGaWVsZCA9IFJlbC4kc2lkZXNbcmVsYXRpb25zaGlwXTtcbiAgICBjb25zdCBzZWxmRmllbGQgPSBSZWwub3RoZXJUeXBlKHJlbGF0aW9uc2hpcCk7XG4gICAgY29uc3QgaWR4ID0gcmVsYXRpb25zaGlwQXJyYXkuZmluZEluZGV4KCh2KSA9PiAoKHZbc2VsZkZpZWxkLmZpZWxkXSA9PT0gaWQpICYmICh2W290aGVyRmllbGQuZmllbGRdID09PSBjaGlsZElkKSkpO1xuICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgcmVsYXRpb25zaGlwQXJyYXlbaWR4XSA9IE9iamVjdC5hc3NpZ24oXG4gICAgICAgIHt9LFxuICAgICAgICByZWxhdGlvbnNoaXBBcnJheVtpZHhdLFxuICAgICAgICBleHRyYXNcbiAgICAgICk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlbGF0aW9uc2hpcEFycmF5LmNvbmNhdCgpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihgSXRlbSAke2NoaWxkSWR9IG5vdCBmb3VuZCBpbiAke3JlbGF0aW9uc2hpcH0gb2YgJHt0LiRuYW1lfWApKTtcbiAgICB9XG4gIH1cblxuICByZW1vdmUodCwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCkge1xuICAgIGNvbnN0IFJlbCA9IHQuJGZpZWxkc1tyZWxhdGlvbnNoaXBdLnJlbGF0aW9uc2hpcDtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBBcnJheSA9IHRoaXMuJCRnZXRSZWxhdGlvbnNoaXAodCwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCk7XG4gICAgLy8gc3RvcmU6IHtwYXJlbnRfaWQ6IDEsIGNoaWxkX2lkOiAyLCBwZXJtOiAzfVxuICAgIGNvbnN0IG90aGVyRmllbGQgPSBSZWwuJHNpZGVzW3JlbGF0aW9uc2hpcF07XG4gICAgY29uc3Qgc2VsZkZpZWxkID0gUmVsLm90aGVyVHlwZShyZWxhdGlvbnNoaXApO1xuICAgIGNvbnN0IGlkeCA9IHJlbGF0aW9uc2hpcEFycmF5LmZpbmRJbmRleCgodikgPT4gKCh2W3NlbGZGaWVsZC5maWVsZF0gPT09IGlkKSAmJiAodltvdGhlckZpZWxkLmZpZWxkXSA9PT0gY2hpbGRJZCkpKTtcbiAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgIHJlbGF0aW9uc2hpcEFycmF5LnNwbGljZShpZHgsIDEpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZWxhdGlvbnNoaXBBcnJheS5jb25jYXQoKSk7XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYEl0ZW0gJHtjaGlsZElkfSBub3QgZm91bmQgaW4gJHtyZWxhdGlvbnNoaXB9IG9mICR7dC4kbmFtZX1gKSk7XG4gIH1cblxuICBxdWVyeSgpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdRdWVyeSBpbnRlcmZhY2Ugbm90IHN1cHBvcnRlZCBvbiBNZW1vcnlTdG9yYWdlJykpO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
