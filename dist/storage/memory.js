'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MemoryStorage = undefined;

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _storage = require('./storage');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

const $store = Symbol('$store');

class MemoryStorage extends _storage.Storage {

  constructor(...args) {
    super(...args);
    this[$store] = {};
    this.maxId = 0;
  }

  $$ensure(t) {
    if (this[$store][t.$name] === undefined) {
      this[$store][t.$name] = {};
    }
    return this[$store][t.$name];
  }

  read(t, id) {
    return Promise.resolve(this.$$ensure(t)[id] || null);
  }

  write(t, v) {
    let id = v[t.$id];
    if (id === undefined) {
      if (this.terminal) {
        id = this.maxId + 1;
      } else {
        throw new Error('Cannot create new content in a non-terminal store');
      }
    }
    let updateObject = this.$$ensure(t)[id];
    if (updateObject === undefined) {
      this.maxId = id;
      updateObject = {
        [t.$id]: id
      };
      this.$$ensure(t)[id] = updateObject;
    }
    Object.keys(t.$fields).forEach(fieldName => {
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

  delete(t, id) {
    const retVal = this.$$ensure(t)[id];
    delete this.$$ensure(t)[id];
    return Promise.resolve(retVal);
  }

  add(t, id, relationship, childId) {
    let relationshipArray = this.$$ensure(t)[`${ relationship }:${ id }`];
    if (relationshipArray === undefined) {
      relationshipArray = [];
      this.$$ensure(t)[`${ relationship }:${ id }`] = relationshipArray;
    }
    if (relationshipArray.indexOf(childId) < 0) {
      relationshipArray.push(childId);
    }
    return Promise.resolve(relationshipArray.concat());
  }

  has(t, id, relationship) {
    return Promise.resolve((this.$$ensure(t)[`${ relationship }:${ id }`] || []).concat());
  }

  remove(t, id, relationship, childId) {
    const relationshipArray = this.$$ensure(t)[`${ relationship }:${ id }`];
    if (relationshipArray !== undefined) {
      const idx = relationshipArray.indexOf(childId);
      if (idx >= 0) {
        relationshipArray.splice(idx, 1);
        return Promise.resolve(relationshipArray.concat());
      }
    }
    return Promise.reject(new Error(`Item ${ childId } not found in ${ relationship } of ${ t.$name }`));
  }

  query() {
    return Promise.reject(new Error('Query interface not supported on MemoryStorage'));
  }
}
exports.MemoryStorage = MemoryStorage;
//# sourceMappingURL=data:application/json;base64,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SUFBSSxLQUFKLENBQVUsZ0RBQVYsQ0FBZixDQUFQO0FBQ0Q7QUExRndDO1FBQTlCLGEsR0FBQSxhIiwiZmlsZSI6InN0b3JhZ2UvbWVtb3J5LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQge1N0b3JhZ2V9IGZyb20gJy4vc3RvcmFnZSc7XG5cbmNvbnN0ICRzdG9yZSA9IFN5bWJvbCgnJHN0b3JlJyk7XG5cbmV4cG9ydCBjbGFzcyBNZW1vcnlTdG9yYWdlIGV4dGVuZHMgU3RvcmFnZSB7XG5cbiAgY29uc3RydWN0b3IoLi4uYXJncykge1xuICAgIHN1cGVyKC4uLmFyZ3MpO1xuICAgIHRoaXNbJHN0b3JlXSA9IHt9O1xuICAgIHRoaXMubWF4SWQgPSAwO1xuICB9XG5cbiAgJCRlbnN1cmUodCkge1xuICAgIGlmICh0aGlzWyRzdG9yZV1bdC4kbmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpc1skc3RvcmVdW3QuJG5hbWVdID0ge307XG4gICAgfVxuICAgIHJldHVybiB0aGlzWyRzdG9yZV1bdC4kbmFtZV07XG4gIH1cblxuICByZWFkKHQsIGlkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLiQkZW5zdXJlKHQpW2lkXSB8fCBudWxsKTtcbiAgfVxuXG4gIHdyaXRlKHQsIHYpIHtcbiAgICBsZXQgaWQgPSB2W3QuJGlkXTtcbiAgICBpZiAoaWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgaWQgPSB0aGlzLm1heElkICsgMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBuZXcgY29udGVudCBpbiBhIG5vbi10ZXJtaW5hbCBzdG9yZScpO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgdXBkYXRlT2JqZWN0ID0gdGhpcy4kJGVuc3VyZSh0KVtpZF07XG4gICAgaWYgKHVwZGF0ZU9iamVjdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm1heElkID0gaWQ7XG4gICAgICB1cGRhdGVPYmplY3QgPSB7XG4gICAgICAgIFt0LiRpZF06IGlkLFxuICAgICAgfTtcbiAgICAgIHRoaXMuJCRlbnN1cmUodClbaWRdID0gdXBkYXRlT2JqZWN0O1xuICAgIH1cbiAgICBPYmplY3Qua2V5cyh0LiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgaWYgKHZbZmllbGROYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGNvcHkgZnJvbSB2IHRvIHRoZSBiZXN0IG9mIG91ciBhYmlsaXR5XG4gICAgICAgIGlmIChcbiAgICAgICAgICAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2FycmF5JykgfHxcbiAgICAgICAgICAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2hhc01hbnknKVxuICAgICAgICApIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IHZbZmllbGROYW1lXS5jb25jYXQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0LiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgdltmaWVsZE5hbWVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IHZbZmllbGROYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoT2JqZWN0LmFzc2lnbih7fSwgdXBkYXRlT2JqZWN0KSk7XG4gIH1cblxuICBkZWxldGUodCwgaWQpIHtcbiAgICBjb25zdCByZXRWYWwgPSB0aGlzLiQkZW5zdXJlKHQpW2lkXTtcbiAgICBkZWxldGUgdGhpcy4kJGVuc3VyZSh0KVtpZF07XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXRWYWwpO1xuICB9XG5cbiAgYWRkKHQsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQpIHtcbiAgICBsZXQgcmVsYXRpb25zaGlwQXJyYXkgPSB0aGlzLiQkZW5zdXJlKHQpW2Ake3JlbGF0aW9uc2hpcH06JHtpZH1gXTtcbiAgICBpZiAocmVsYXRpb25zaGlwQXJyYXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmVsYXRpb25zaGlwQXJyYXkgPSBbXTtcbiAgICAgIHRoaXMuJCRlbnN1cmUodClbYCR7cmVsYXRpb25zaGlwfToke2lkfWBdID0gcmVsYXRpb25zaGlwQXJyYXk7XG4gICAgfVxuICAgIGlmIChyZWxhdGlvbnNoaXBBcnJheS5pbmRleE9mKGNoaWxkSWQpIDwgMCkge1xuICAgICAgcmVsYXRpb25zaGlwQXJyYXkucHVzaChjaGlsZElkKTtcbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZWxhdGlvbnNoaXBBcnJheS5jb25jYXQoKSk7XG4gIH1cblxuICBoYXModCwgaWQsIHJlbGF0aW9uc2hpcCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKHRoaXMuJCRlbnN1cmUodClbYCR7cmVsYXRpb25zaGlwfToke2lkfWBdIHx8IFtdKS5jb25jYXQoKSk7XG4gIH1cblxuICByZW1vdmUodCwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCkge1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcEFycmF5ID0gdGhpcy4kJGVuc3VyZSh0KVtgJHtyZWxhdGlvbnNoaXB9OiR7aWR9YF07XG4gICAgaWYgKHJlbGF0aW9uc2hpcEFycmF5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGlkeCA9IHJlbGF0aW9uc2hpcEFycmF5LmluZGV4T2YoY2hpbGRJZCk7XG4gICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgcmVsYXRpb25zaGlwQXJyYXkuc3BsaWNlKGlkeCwgMSk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVsYXRpb25zaGlwQXJyYXkuY29uY2F0KCkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGBJdGVtICR7Y2hpbGRJZH0gbm90IGZvdW5kIGluICR7cmVsYXRpb25zaGlwfSBvZiAke3QuJG5hbWV9YCkpO1xuICB9XG5cbiAgcXVlcnkoKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUXVlcnkgaW50ZXJmYWNlIG5vdCBzdXBwb3J0ZWQgb24gTWVtb3J5U3RvcmFnZScpKTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
