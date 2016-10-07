'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SQLStorage = undefined;

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _knex = require('knex');

var _knex2 = _interopRequireDefault(_knex);

var _storage = require('./storage');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

const $knex = Symbol('$knex');

class SQLStorage extends _storage.Storage {
  constructor(opts = {}) {
    super(opts);
    const options = Object.assign({}, {
      client: 'postgres',
      debug: false,
      connection: {
        user: 'postgres',
        host: 'localhost',
        port: 5432,
        password: '',
        charset: 'utf8'
      },
      pool: {
        max: 20,
        min: 0
      }
    }, opts.sql);
    this[$knex] = (0, _knex2.default)(options);
  }

  /*
    note that knex.js "then" functions aren't actually promises the way you think they are.
    you can return knex.insert().into(), which has a then() on it, but that thenable isn't
    an actual promise yet. So instead we're returning Promise.resolve(thenable);
  */

  teardown() {
    return this[$knex].destroy();
  }

  onCacheableRead() {}

  write(t, v) {
    const id = v[t.$id];
    const updateObject = {};
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
    if (id === undefined && this.terminal) {
      return this[$knex](t.$name).insert(updateObject).returning(t.$id).then(createdId => {
        return this.read(t, createdId[0]);
      });
    } else if (id !== undefined) {
      return this[$knex](t.$name).where({ [t.$id]: id }).update(updateObject).then(() => {
        return this.read(t, id);
      });
    } else {
      throw new Error('Cannot create new content in a non-terminal store');
    }
  }

  read(t, id) {
    return this[$knex](t.$name).where({ [t.$id]: id }).select().then(o => o[0] || null);
  }

  delete(t, id) {
    return this[$knex](t.$name).where({ [t.$id]: id }).delete().then(o => o);
  }

  add(t, id, relationship, childId) {
    const fieldInfo = t.$fields[relationship];
    if (fieldInfo === undefined) {
      return Promise.reject(new Error(`Unknown field ${ relationship }`));
    } else {
      return this[$knex](fieldInfo.joinTable).where({
        [fieldInfo.parentColumn]: id,
        [fieldInfo.childColumn]: childId
      }).select().then(l => {
        if (l.length > 0) {
          return Promise.reject(new Error(`Item ${ childId } already in ${ relationship } of ${ t.$name }:${ id }`));
        } else {
          return this[$knex](fieldInfo.joinTable).insert({
            [fieldInfo.parentColumn]: id,
            [fieldInfo.childColumn]: childId
          }).then(() => {
            return this.has(t, id, relationship);
          });
        }
      });
    }
  }

  has(t, id, relationship) {
    const fieldInfo = t.$fields[relationship];
    if (fieldInfo === undefined) {
      return Promise.reject(new Error(`Unknown field ${ relationship }`));
    } else {
      return this[$knex](fieldInfo.joinTable).where({
        [fieldInfo.parentColumn]: id
      }).select(fieldInfo.childColumn).then(l => l.map(v => v[fieldInfo.childColumn]));
    }
  }

  remove(t, id, relationship, childId) {
    const fieldInfo = t.$fields[relationship];
    if (fieldInfo === undefined) {
      return Promise.reject(new Error(`Unknown field ${ relationship }`));
    } else {
      return this[$knex](fieldInfo.joinTable).where({
        [fieldInfo.parentColumn]: id,
        [fieldInfo.childColumn]: childId
      }).delete().then(() => {
        return this.has(t, id, relationship);
      });
    }
  }

  query(q) {
    return Promise.resolve(this[$knex].raw(q.query)).then(d => d.rows);
  }
}
exports.SQLStorage = SQLStorage;
//# sourceMappingURL=data:application/json;base64,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RUQsUUFBTSxDQUFOLEVBQVM7QUFDUCxXQUFPLFFBQVEsT0FBUixDQUFnQixLQUFLLEtBQUwsRUFBWSxHQUFaLENBQWdCLEVBQUUsS0FBbEIsQ0FBaEIsRUFDTixJQURNLENBQ0EsQ0FBRCxJQUFPLEVBQUUsSUFEUixDQUFQO0FBRUQ7QUExSXFDO1FBQTNCLFUsR0FBQSxVIiwiZmlsZSI6InN0b3JhZ2Uvc3FsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQga25leCBmcm9tICdrbmV4JztcbmltcG9ydCB7U3RvcmFnZX0gZnJvbSAnLi9zdG9yYWdlJztcbmNvbnN0ICRrbmV4ID0gU3ltYm9sKCcka25leCcpO1xuXG5leHBvcnQgY2xhc3MgU1FMU3RvcmFnZSBleHRlbmRzIFN0b3JhZ2Uge1xuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBzdXBlcihvcHRzKTtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAge1xuICAgICAgICBjbGllbnQ6ICdwb3N0Z3JlcycsXG4gICAgICAgIGRlYnVnOiBmYWxzZSxcbiAgICAgICAgY29ubmVjdGlvbjoge1xuICAgICAgICAgIHVzZXI6ICdwb3N0Z3JlcycsXG4gICAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgICAgICAgcG9ydDogNTQzMixcbiAgICAgICAgICBwYXNzd29yZDogJycsXG4gICAgICAgICAgY2hhcnNldDogJ3V0ZjgnLFxuICAgICAgICB9LFxuICAgICAgICBwb29sOiB7XG4gICAgICAgICAgbWF4OiAyMCxcbiAgICAgICAgICBtaW46IDAsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgb3B0cy5zcWxcbiAgICApO1xuICAgIHRoaXNbJGtuZXhdID0ga25leChvcHRpb25zKTtcbiAgfVxuXG4gIC8qXG4gICAgbm90ZSB0aGF0IGtuZXguanMgXCJ0aGVuXCIgZnVuY3Rpb25zIGFyZW4ndCBhY3R1YWxseSBwcm9taXNlcyB0aGUgd2F5IHlvdSB0aGluayB0aGV5IGFyZS5cbiAgICB5b3UgY2FuIHJldHVybiBrbmV4Lmluc2VydCgpLmludG8oKSwgd2hpY2ggaGFzIGEgdGhlbigpIG9uIGl0LCBidXQgdGhhdCB0aGVuYWJsZSBpc24ndFxuICAgIGFuIGFjdHVhbCBwcm9taXNlIHlldC4gU28gaW5zdGVhZCB3ZSdyZSByZXR1cm5pbmcgUHJvbWlzZS5yZXNvbHZlKHRoZW5hYmxlKTtcbiAgKi9cblxuICB0ZWFyZG93bigpIHtcbiAgICByZXR1cm4gdGhpc1ska25leF0uZGVzdHJveSgpO1xuICB9XG5cbiAgb25DYWNoZWFibGVSZWFkKCkge31cblxuICB3cml0ZSh0LCB2KSB7XG4gICAgY29uc3QgaWQgPSB2W3QuJGlkXTtcbiAgICBjb25zdCB1cGRhdGVPYmplY3QgPSB7fTtcbiAgICBPYmplY3Qua2V5cyh0LiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgaWYgKHZbZmllbGROYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGNvcHkgZnJvbSB2IHRvIHRoZSBiZXN0IG9mIG91ciBhYmlsaXR5XG4gICAgICAgIGlmIChcbiAgICAgICAgICAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2FycmF5JykgfHxcbiAgICAgICAgICAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2hhc01hbnknKVxuICAgICAgICApIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IHZbZmllbGROYW1lXS5jb25jYXQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0LiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgdltmaWVsZE5hbWVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IHZbZmllbGROYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICgoaWQgPT09IHVuZGVmaW5lZCkgJiYgKHRoaXMudGVybWluYWwpKSB7XG4gICAgICByZXR1cm4gdGhpc1ska25leF0odC4kbmFtZSkuaW5zZXJ0KHVwZGF0ZU9iamVjdCkucmV0dXJuaW5nKHQuJGlkKVxuICAgICAgLnRoZW4oKGNyZWF0ZWRJZCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkKHQsIGNyZWF0ZWRJZFswXSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzWyRrbmV4XSh0LiRuYW1lKS53aGVyZSh7W3QuJGlkXTogaWR9KS51cGRhdGUodXBkYXRlT2JqZWN0KVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkKHQsIGlkKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgbmV3IGNvbnRlbnQgaW4gYSBub24tdGVybWluYWwgc3RvcmUnKTtcbiAgICB9XG4gIH1cblxuICByZWFkKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXNbJGtuZXhdKHQuJG5hbWUpLndoZXJlKHtbdC4kaWRdOiBpZH0pLnNlbGVjdCgpXG4gICAgLnRoZW4oKG8pID0+IG9bMF0gfHwgbnVsbCk7XG4gIH1cblxuICBkZWxldGUodCwgaWQpIHtcbiAgICByZXR1cm4gdGhpc1ska25leF0odC4kbmFtZSkud2hlcmUoe1t0LiRpZF06IGlkfSkuZGVsZXRlKClcbiAgICAudGhlbigobykgPT4gbyk7XG4gIH1cblxuICBhZGQodCwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCkge1xuICAgIGNvbnN0IGZpZWxkSW5mbyA9IHQuJGZpZWxkc1tyZWxhdGlvbnNoaXBdO1xuICAgIGlmIChmaWVsZEluZm8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihgVW5rbm93biBmaWVsZCAke3JlbGF0aW9uc2hpcH1gKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzWyRrbmV4XShmaWVsZEluZm8uam9pblRhYmxlKVxuICAgICAgLndoZXJlKHtcbiAgICAgICAgW2ZpZWxkSW5mby5wYXJlbnRDb2x1bW5dOiBpZCxcbiAgICAgICAgW2ZpZWxkSW5mby5jaGlsZENvbHVtbl06IGNoaWxkSWQsXG4gICAgICB9KS5zZWxlY3QoKVxuICAgICAgLnRoZW4oKGwpID0+IHtcbiAgICAgICAgaWYgKGwubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYEl0ZW0gJHtjaGlsZElkfSBhbHJlYWR5IGluICR7cmVsYXRpb25zaGlwfSBvZiAke3QuJG5hbWV9OiR7aWR9YCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzWyRrbmV4XShmaWVsZEluZm8uam9pblRhYmxlKVxuICAgICAgICAgIC5pbnNlcnQoe1xuICAgICAgICAgICAgW2ZpZWxkSW5mby5wYXJlbnRDb2x1bW5dOiBpZCxcbiAgICAgICAgICAgIFtmaWVsZEluZm8uY2hpbGRDb2x1bW5dOiBjaGlsZElkLFxuICAgICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFzKHQsIGlkLCByZWxhdGlvbnNoaXApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBoYXModCwgaWQsIHJlbGF0aW9uc2hpcCkge1xuICAgIGNvbnN0IGZpZWxkSW5mbyA9IHQuJGZpZWxkc1tyZWxhdGlvbnNoaXBdO1xuICAgIGlmIChmaWVsZEluZm8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihgVW5rbm93biBmaWVsZCAke3JlbGF0aW9uc2hpcH1gKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzWyRrbmV4XShmaWVsZEluZm8uam9pblRhYmxlKVxuICAgICAgLndoZXJlKHtcbiAgICAgICAgW2ZpZWxkSW5mby5wYXJlbnRDb2x1bW5dOiBpZCxcbiAgICAgIH0pLnNlbGVjdChmaWVsZEluZm8uY2hpbGRDb2x1bW4pXG4gICAgICAudGhlbigobCkgPT4gbC5tYXAoKHYpID0+IHZbZmllbGRJbmZvLmNoaWxkQ29sdW1uXSkpO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZSh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKSB7XG4gICAgY29uc3QgZmllbGRJbmZvID0gdC4kZmllbGRzW3JlbGF0aW9uc2hpcF07XG4gICAgaWYgKGZpZWxkSW5mbyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGBVbmtub3duIGZpZWxkICR7cmVsYXRpb25zaGlwfWApKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXNbJGtuZXhdKGZpZWxkSW5mby5qb2luVGFibGUpXG4gICAgICAud2hlcmUoe1xuICAgICAgICBbZmllbGRJbmZvLnBhcmVudENvbHVtbl06IGlkLFxuICAgICAgICBbZmllbGRJbmZvLmNoaWxkQ29sdW1uXTogY2hpbGRJZCxcbiAgICAgIH0pLmRlbGV0ZSgpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmhhcyh0LCBpZCwgcmVsYXRpb25zaGlwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHF1ZXJ5KHEpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXNbJGtuZXhdLnJhdyhxLnF1ZXJ5KSlcbiAgICAudGhlbigoZCkgPT4gZC5yb3dzKTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
