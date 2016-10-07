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
    key: 'read',
    value: function read(t, id) {
      return Promise.resolve(this.$$ensure(t)[id] || null);
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
    value: function add(t, id, relationship, childId) {
      var relationshipArray = this.$$ensure(t)[relationship + ':' + id];
      if (relationshipArray === undefined) {
        relationshipArray = [];
        this.$$ensure(t)[relationship + ':' + id] = relationshipArray;
      }
      if (relationshipArray.indexOf(childId) < 0) {
        relationshipArray.push(childId);
      }
      return Promise.resolve(relationshipArray.concat());
    }
  }, {
    key: 'has',
    value: function has(t, id, relationship) {
      return Promise.resolve((this.$$ensure(t)[relationship + ':' + id] || []).concat());
    }
  }, {
    key: 'remove',
    value: function remove(t, id, relationship, childId) {
      var relationshipArray = this.$$ensure(t)[relationship + ':' + id];
      if (relationshipArray !== undefined) {
        var idx = relationshipArray.indexOf(childId);
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
//# sourceMappingURL=data:application/json;base64,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IFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHtTdG9yYWdlfSBmcm9tICcuL3N0b3JhZ2UnO1xuXG5jb25zdCAkc3RvcmUgPSBTeW1ib2woJyRzdG9yZScpO1xuXG5leHBvcnQgY2xhc3MgTWVtb3J5U3RvcmFnZSBleHRlbmRzIFN0b3JhZ2Uge1xuXG4gIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICBzdXBlciguLi5hcmdzKTtcbiAgICB0aGlzWyRzdG9yZV0gPSB7fTtcbiAgICB0aGlzLm1heElkID0gMDtcbiAgfVxuXG4gICQkZW5zdXJlKHQpIHtcbiAgICBpZiAodGhpc1skc3RvcmVdW3QuJG5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHN0b3JlXVt0LiRuYW1lXSA9IHt9O1xuICAgIH1cbiAgICByZXR1cm4gdGhpc1skc3RvcmVdW3QuJG5hbWVdO1xuICB9XG5cbiAgcmVhZCh0LCBpZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy4kJGVuc3VyZSh0KVtpZF0gfHwgbnVsbCk7XG4gIH1cblxuICB3cml0ZSh0LCB2KSB7XG4gICAgbGV0IGlkID0gdlt0LiRpZF07XG4gICAgaWYgKGlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgIGlkID0gdGhpcy5tYXhJZCArIDE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgbmV3IGNvbnRlbnQgaW4gYSBub24tdGVybWluYWwgc3RvcmUnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IHVwZGF0ZU9iamVjdCA9IHRoaXMuJCRlbnN1cmUodClbaWRdO1xuICAgIGlmICh1cGRhdGVPYmplY3QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5tYXhJZCA9IGlkO1xuICAgICAgdXBkYXRlT2JqZWN0ID0ge1xuICAgICAgICBbdC4kaWRdOiBpZCxcbiAgICAgIH07XG4gICAgICB0aGlzLiQkZW5zdXJlKHQpW2lkXSA9IHVwZGF0ZU9iamVjdDtcbiAgICB9XG4gICAgT2JqZWN0LmtleXModC4kZmllbGRzKS5mb3JFYWNoKChmaWVsZE5hbWUpID0+IHtcbiAgICAgIGlmICh2W2ZpZWxkTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBjb3B5IGZyb20gdiB0byB0aGUgYmVzdCBvZiBvdXIgYWJpbGl0eVxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdhcnJheScpIHx8XG4gICAgICAgICAgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdoYXNNYW55JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSB2W2ZpZWxkTmFtZV0uY29uY2F0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IE9iamVjdC5hc3NpZ24oe30sIHZbZmllbGROYW1lXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSB2W2ZpZWxkTmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKE9iamVjdC5hc3NpZ24oe30sIHVwZGF0ZU9iamVjdCkpO1xuICB9XG5cbiAgZGVsZXRlKHQsIGlkKSB7XG4gICAgY29uc3QgcmV0VmFsID0gdGhpcy4kJGVuc3VyZSh0KVtpZF07XG4gICAgZGVsZXRlIHRoaXMuJCRlbnN1cmUodClbaWRdO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmV0VmFsKTtcbiAgfVxuXG4gIGFkZCh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKSB7XG4gICAgbGV0IHJlbGF0aW9uc2hpcEFycmF5ID0gdGhpcy4kJGVuc3VyZSh0KVtgJHtyZWxhdGlvbnNoaXB9OiR7aWR9YF07XG4gICAgaWYgKHJlbGF0aW9uc2hpcEFycmF5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJlbGF0aW9uc2hpcEFycmF5ID0gW107XG4gICAgICB0aGlzLiQkZW5zdXJlKHQpW2Ake3JlbGF0aW9uc2hpcH06JHtpZH1gXSA9IHJlbGF0aW9uc2hpcEFycmF5O1xuICAgIH1cbiAgICBpZiAocmVsYXRpb25zaGlwQXJyYXkuaW5kZXhPZihjaGlsZElkKSA8IDApIHtcbiAgICAgIHJlbGF0aW9uc2hpcEFycmF5LnB1c2goY2hpbGRJZCk7XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVsYXRpb25zaGlwQXJyYXkuY29uY2F0KCkpO1xuICB9XG5cbiAgaGFzKHQsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCh0aGlzLiQkZW5zdXJlKHQpW2Ake3JlbGF0aW9uc2hpcH06JHtpZH1gXSB8fCBbXSkuY29uY2F0KCkpO1xuICB9XG5cbiAgcmVtb3ZlKHQsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQpIHtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBBcnJheSA9IHRoaXMuJCRlbnN1cmUodClbYCR7cmVsYXRpb25zaGlwfToke2lkfWBdO1xuICAgIGlmIChyZWxhdGlvbnNoaXBBcnJheSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBpZHggPSByZWxhdGlvbnNoaXBBcnJheS5pbmRleE9mKGNoaWxkSWQpO1xuICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgIHJlbGF0aW9uc2hpcEFycmF5LnNwbGljZShpZHgsIDEpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlbGF0aW9uc2hpcEFycmF5LmNvbmNhdCgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihgSXRlbSAke2NoaWxkSWR9IG5vdCBmb3VuZCBpbiAke3JlbGF0aW9uc2hpcH0gb2YgJHt0LiRuYW1lfWApKTtcbiAgfVxuXG4gIHF1ZXJ5KCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1F1ZXJ5IGludGVyZmFjZSBub3Qgc3VwcG9ydGVkIG9uIE1lbW9yeVN0b3JhZ2UnKSk7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
