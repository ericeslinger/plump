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
    value: function $$ensure(t) {
      if (this[$store][t.$name] === undefined) {
        this[$store][t.$name] = {};
      }
      return this[$store][t.$name];
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
      var relationshipArray = this.$$ensure(t)[relationship + ':' + id];
      if (relationshipArray === undefined) {
        relationshipArray = [];
        this.$$ensure(t)[relationship + ':' + id] = relationshipArray;
      }
      if (relationshipArray.indexOf(childId) < 0) {
        (function () {
          var newRelationship = _defineProperty({}, t.$id, childId);
          (t.$fields[relationship].extras || []).forEach(function (e) {
            newRelationship[e] = extras[e];
          });
          relationshipArray.push(newRelationship);
        })();
      }
      return Promise.resolve(relationshipArray.concat());
    }
  }, {
    key: 'read',
    value: function read(t, id, relationship) {
      var _this2 = this;

      return Promise.resolve().then(function () {
        if (relationship && t.$fields[relationship].type === 'hasMany') {
          return _defineProperty({}, relationship, (_this2.$$ensure(t)[relationship + ':' + id] || []).concat());
        } else {
          return Promise.resolve(_this2.$$ensure(t)[id] || null);
        }
      });
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(t, id, relationship, childId, extras) {
      var _this3 = this;

      return Promise.resolve().then(function () {
        var relationshipArray = _this3.$$ensure(t)[relationship + ':' + id];
        var idx = relationshipArray.findIndex(function (v) {
          return v[t.$id] === childId;
        });
        if (idx >= 0) {
          relationshipArray[idx] = Object.assign({}, relationshipArray[idx], extras);
          return Promise.resolve(relationshipArray.concat());
        } else {
          return Promise.reject(new Error('Item ' + childId + ' not found in ' + relationship + ' of ' + t.$name));
        }
      });
    }
  }, {
    key: 'remove',
    value: function remove(t, id, relationship, childId) {
      var relationshipArray = this.$$ensure(t)[relationship + ':' + id];
      if (relationshipArray !== undefined) {
        var idx = relationshipArray.findIndex(function (v) {
          return v[t.$id] === childId;
        });
        if (idx >= 0) {
          relationshipArray.splice(idx, 1);
          return Promise.resolve(relationshipArray.concat());
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvbWVtb3J5LmpzIl0sIm5hbWVzIjpbIlByb21pc2UiLCIkc3RvcmUiLCJTeW1ib2wiLCJNZW1vcnlTdG9yYWdlIiwiYXJncyIsIm1heElkIiwidCIsIiRuYW1lIiwidW5kZWZpbmVkIiwidiIsImlkIiwiJGlkIiwidGVybWluYWwiLCJFcnJvciIsInVwZGF0ZU9iamVjdCIsIiQkZW5zdXJlIiwiT2JqZWN0Iiwia2V5cyIsIiRmaWVsZHMiLCJmb3JFYWNoIiwiZmllbGROYW1lIiwidHlwZSIsImNvbmNhdCIsImFzc2lnbiIsInJlc29sdmUiLCJyZXRWYWwiLCJyZWxhdGlvbnNoaXAiLCJjaGlsZElkIiwiZXh0cmFzIiwicmVsYXRpb25zaGlwQXJyYXkiLCJpbmRleE9mIiwibmV3UmVsYXRpb25zaGlwIiwiZSIsInB1c2giLCJ0aGVuIiwiaWR4IiwiZmluZEluZGV4IiwicmVqZWN0Iiwic3BsaWNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7SUFBWUEsTzs7QUFDWjs7Ozs7Ozs7Ozs7O0FBRUEsSUFBTUMsU0FBU0MsT0FBTyxRQUFQLENBQWY7O0lBRWFDLGEsV0FBQUEsYTs7O0FBRVgsMkJBQXFCO0FBQUE7O0FBQUE7O0FBQUEsc0NBQU5DLElBQU07QUFBTkEsVUFBTTtBQUFBOztBQUFBLHlKQUNWQSxJQURVOztBQUVuQixVQUFLSCxNQUFMLElBQWUsRUFBZjtBQUNBLFVBQUtJLEtBQUwsR0FBYSxDQUFiO0FBSG1CO0FBSXBCOzs7OzZCQUVRQyxDLEVBQUc7QUFDVixVQUFJLEtBQUtMLE1BQUwsRUFBYUssRUFBRUMsS0FBZixNQUEwQkMsU0FBOUIsRUFBeUM7QUFDdkMsYUFBS1AsTUFBTCxFQUFhSyxFQUFFQyxLQUFmLElBQXdCLEVBQXhCO0FBQ0Q7QUFDRCxhQUFPLEtBQUtOLE1BQUwsRUFBYUssRUFBRUMsS0FBZixDQUFQO0FBQ0Q7OzswQkFFS0QsQyxFQUFHRyxDLEVBQUc7QUFDVixVQUFJQyxLQUFLRCxFQUFFSCxFQUFFSyxHQUFK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QyxZQUE2RHBCLEVBQUVDLEtBQS9ELENBQWYsQ0FBUDtBQUNEO0FBQ0YsT0FkTSxDQUFQO0FBZUQ7OzsyQkFFTUQsQyxFQUFHSSxFLEVBQUlnQixZLEVBQWNDLE8sRUFBUztBQUNuQyxVQUFNRSxvQkFBb0IsS0FBS2QsUUFBTCxDQUFjVCxDQUFkLEVBQW9Cb0IsWUFBcEIsU0FBb0NoQixFQUFwQyxDQUExQjtBQUNBLFVBQUltQixzQkFBc0JyQixTQUExQixFQUFxQztBQUNuQyxZQUFNMkIsTUFBTU4sa0JBQWtCTyxTQUFsQixDQUE0QixVQUFDM0IsQ0FBRDtBQUFBLGlCQUFPQSxFQUFFSCxFQUFFSyxHQUFKLE1BQWFnQixPQUFwQjtBQUFBLFNBQTVCLENBQVo7QUFDQSxZQUFJUSxPQUFPLENBQVgsRUFBYztBQUNaTiw0QkFBa0JTLE1BQWxCLENBQXlCSCxHQUF6QixFQUE4QixDQUE5QjtBQUNBLGlCQUFPbkMsUUFBUXdCLE9BQVIsQ0FBZ0JLLGtCQUFrQlAsTUFBbEIsRUFBaEIsQ0FBUDtBQUNEO0FBQ0Y7QUFDRCxhQUFPdEIsUUFBUXFDLE1BQVIsQ0FBZSxJQUFJeEIsS0FBSixXQUFrQmMsT0FBbEIsc0JBQTBDRCxZQUExQyxZQUE2RHBCLEVBQUVDLEtBQS9ELENBQWYsQ0FBUDtBQUNEOzs7NEJBRU87QUFDTixhQUFPUCxRQUFRcUMsTUFBUixDQUFlLElBQUl4QixLQUFKLENBQVUsZ0RBQVYsQ0FBZixDQUFQO0FBQ0QiLCJmaWxlIjoic3RvcmFnZS9tZW1vcnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7U3RvcmFnZX0gZnJvbSAnLi9zdG9yYWdlJztcblxuY29uc3QgJHN0b3JlID0gU3ltYm9sKCckc3RvcmUnKTtcblxuZXhwb3J0IGNsYXNzIE1lbW9yeVN0b3JhZ2UgZXh0ZW5kcyBTdG9yYWdlIHtcblxuICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgc3VwZXIoLi4uYXJncyk7XG4gICAgdGhpc1skc3RvcmVdID0ge307XG4gICAgdGhpcy5tYXhJZCA9IDA7XG4gIH1cblxuICAkJGVuc3VyZSh0KSB7XG4gICAgaWYgKHRoaXNbJHN0b3JlXVt0LiRuYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzWyRzdG9yZV1bdC4kbmFtZV0gPSB7fTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JlXVt0LiRuYW1lXTtcbiAgfVxuXG4gIHdyaXRlKHQsIHYpIHtcbiAgICBsZXQgaWQgPSB2W3QuJGlkXTtcbiAgICBpZiAoaWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgaWQgPSB0aGlzLm1heElkICsgMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBuZXcgY29udGVudCBpbiBhIG5vbi10ZXJtaW5hbCBzdG9yZScpO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgdXBkYXRlT2JqZWN0ID0gdGhpcy4kJGVuc3VyZSh0KVtpZF07XG4gICAgaWYgKHVwZGF0ZU9iamVjdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm1heElkID0gaWQ7XG4gICAgICB1cGRhdGVPYmplY3QgPSB7XG4gICAgICAgIFt0LiRpZF06IGlkLFxuICAgICAgfTtcbiAgICAgIHRoaXMuJCRlbnN1cmUodClbaWRdID0gdXBkYXRlT2JqZWN0O1xuICAgIH1cbiAgICBPYmplY3Qua2V5cyh0LiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgaWYgKHZbZmllbGROYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGNvcHkgZnJvbSB2IHRvIHRoZSBiZXN0IG9mIG91ciBhYmlsaXR5XG4gICAgICAgIGlmIChcbiAgICAgICAgICAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2FycmF5JykgfHxcbiAgICAgICAgICAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2hhc01hbnknKVxuICAgICAgICApIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IHZbZmllbGROYW1lXS5jb25jYXQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0LiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgdltmaWVsZE5hbWVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IHZbZmllbGROYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoT2JqZWN0LmFzc2lnbih7fSwgdXBkYXRlT2JqZWN0KSk7XG4gIH1cblxuICBkZWxldGUodCwgaWQpIHtcbiAgICBjb25zdCByZXRWYWwgPSB0aGlzLiQkZW5zdXJlKHQpW2lkXTtcbiAgICBkZWxldGUgdGhpcy4kJGVuc3VyZSh0KVtpZF07XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXRWYWwpO1xuICB9XG5cbiAgYWRkKHQsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQsIGV4dHJhcykge1xuICAgIGxldCByZWxhdGlvbnNoaXBBcnJheSA9IHRoaXMuJCRlbnN1cmUodClbYCR7cmVsYXRpb25zaGlwfToke2lkfWBdO1xuICAgIGlmIChyZWxhdGlvbnNoaXBBcnJheSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZWxhdGlvbnNoaXBBcnJheSA9IFtdO1xuICAgICAgdGhpcy4kJGVuc3VyZSh0KVtgJHtyZWxhdGlvbnNoaXB9OiR7aWR9YF0gPSByZWxhdGlvbnNoaXBBcnJheTtcbiAgICB9XG4gICAgaWYgKHJlbGF0aW9uc2hpcEFycmF5LmluZGV4T2YoY2hpbGRJZCkgPCAwKSB7XG4gICAgICBjb25zdCBuZXdSZWxhdGlvbnNoaXAgPSB7W3QuJGlkXTogY2hpbGRJZH07XG4gICAgICAodC4kZmllbGRzW3JlbGF0aW9uc2hpcF0uZXh0cmFzIHx8IFtdKS5mb3JFYWNoKChlKSA9PiB7XG4gICAgICAgIG5ld1JlbGF0aW9uc2hpcFtlXSA9IGV4dHJhc1tlXTtcbiAgICAgIH0pO1xuICAgICAgcmVsYXRpb25zaGlwQXJyYXkucHVzaChuZXdSZWxhdGlvbnNoaXApO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlbGF0aW9uc2hpcEFycmF5LmNvbmNhdCgpKTtcbiAgfVxuXG4gIHJlYWQodCwgaWQsIHJlbGF0aW9uc2hpcCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmIChyZWxhdGlvbnNoaXAgJiYgKHQuJGZpZWxkc1tyZWxhdGlvbnNoaXBdLnR5cGUgPT09ICdoYXNNYW55JykpIHtcbiAgICAgICAgcmV0dXJuIHtbcmVsYXRpb25zaGlwXTogKHRoaXMuJCRlbnN1cmUodClbYCR7cmVsYXRpb25zaGlwfToke2lkfWBdIHx8IFtdKS5jb25jYXQoKX07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuJCRlbnN1cmUodClbaWRdIHx8IG51bGwpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKHQsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQsIGV4dHJhcykge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IHJlbGF0aW9uc2hpcEFycmF5ID0gdGhpcy4kJGVuc3VyZSh0KVtgJHtyZWxhdGlvbnNoaXB9OiR7aWR9YF07XG4gICAgICBjb25zdCBpZHggPSByZWxhdGlvbnNoaXBBcnJheS5maW5kSW5kZXgoKHYpID0+IHZbdC4kaWRdID09PSBjaGlsZElkKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICByZWxhdGlvbnNoaXBBcnJheVtpZHhdID0gT2JqZWN0LmFzc2lnbihcbiAgICAgICAgICB7fSxcbiAgICAgICAgICByZWxhdGlvbnNoaXBBcnJheVtpZHhdLFxuICAgICAgICAgIGV4dHJhc1xuICAgICAgICApO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlbGF0aW9uc2hpcEFycmF5LmNvbmNhdCgpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYEl0ZW0gJHtjaGlsZElkfSBub3QgZm91bmQgaW4gJHtyZWxhdGlvbnNoaXB9IG9mICR7dC4kbmFtZX1gKSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZW1vdmUodCwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCkge1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcEFycmF5ID0gdGhpcy4kJGVuc3VyZSh0KVtgJHtyZWxhdGlvbnNoaXB9OiR7aWR9YF07XG4gICAgaWYgKHJlbGF0aW9uc2hpcEFycmF5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGlkeCA9IHJlbGF0aW9uc2hpcEFycmF5LmZpbmRJbmRleCgodikgPT4gdlt0LiRpZF0gPT09IGNoaWxkSWQpO1xuICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgIHJlbGF0aW9uc2hpcEFycmF5LnNwbGljZShpZHgsIDEpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlbGF0aW9uc2hpcEFycmF5LmNvbmNhdCgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihgSXRlbSAke2NoaWxkSWR9IG5vdCBmb3VuZCBpbiAke3JlbGF0aW9uc2hpcH0gb2YgJHt0LiRuYW1lfWApKTtcbiAgfVxuXG4gIHF1ZXJ5KCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1F1ZXJ5IGludGVyZmFjZSBub3Qgc3VwcG9ydGVkIG9uIE1lbW9yeVN0b3JhZ2UnKSk7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
