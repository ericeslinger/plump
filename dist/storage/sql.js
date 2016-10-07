'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SQLStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _knex = require('knex');

var _knex2 = _interopRequireDefault(_knex);

var _storage = require('./storage');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var $knex = Symbol('$knex');

var SQLStorage = exports.SQLStorage = function (_Storage) {
  _inherits(SQLStorage, _Storage);

  function SQLStorage() {
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, SQLStorage);

    var _this = _possibleConstructorReturn(this, (SQLStorage.__proto__ || Object.getPrototypeOf(SQLStorage)).call(this, opts));

    var options = Object.assign({}, {
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
    _this[$knex] = (0, _knex2.default)(options);
    return _this;
  }

  /*
    note that knex.js "then" functions aren't actually promises the way you think they are.
    you can return knex.insert().into(), which has a then() on it, but that thenable isn't
    an actual promise yet. So instead we're returning Promise.resolve(thenable);
  */

  _createClass(SQLStorage, [{
    key: 'teardown',
    value: function teardown() {
      return this[$knex].destroy();
    }
  }, {
    key: 'onCacheableRead',
    value: function onCacheableRead() {}
  }, {
    key: 'write',
    value: function write(t, v) {
      var _this2 = this;

      var id = v[t.$id];
      var updateObject = {};
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
      if (id === undefined && this.terminal) {
        return this[$knex](t.$name).insert(updateObject).returning(t.$id).then(function (createdId) {
          return _this2.read(t, createdId[0]);
        });
      } else if (id !== undefined) {
        return this[$knex](t.$name).where(_defineProperty({}, t.$id, id)).update(updateObject).then(function () {
          return _this2.read(t, id);
        });
      } else {
        throw new Error('Cannot create new content in a non-terminal store');
      }
    }
  }, {
    key: 'read',
    value: function read(t, id) {
      return this[$knex](t.$name).where(_defineProperty({}, t.$id, id)).select().then(function (o) {
        return o[0] || null;
      });
    }
  }, {
    key: 'delete',
    value: function _delete(t, id) {
      return this[$knex](t.$name).where(_defineProperty({}, t.$id, id)).delete().then(function (o) {
        return o;
      });
    }
  }, {
    key: 'add',
    value: function add(t, id, relationship, childId) {
      var _this3 = this;

      var fieldInfo = t.$fields[relationship];
      if (fieldInfo === undefined) {
        return Promise.reject(new Error('Unknown field ' + relationship));
      } else {
        var _$knex$where4;

        return this[$knex](fieldInfo.joinTable).where((_$knex$where4 = {}, _defineProperty(_$knex$where4, fieldInfo.parentColumn, id), _defineProperty(_$knex$where4, fieldInfo.childColumn, childId), _$knex$where4)).select().then(function (l) {
          if (l.length > 0) {
            return Promise.reject(new Error('Item ' + childId + ' already in ' + relationship + ' of ' + t.$name + ':' + id));
          } else {
            var _this3$$knex$insert;

            return _this3[$knex](fieldInfo.joinTable).insert((_this3$$knex$insert = {}, _defineProperty(_this3$$knex$insert, fieldInfo.parentColumn, id), _defineProperty(_this3$$knex$insert, fieldInfo.childColumn, childId), _this3$$knex$insert)).then(function () {
              return _this3.has(t, id, relationship);
            });
          }
        });
      }
    }
  }, {
    key: 'has',
    value: function has(t, id, relationship) {
      var fieldInfo = t.$fields[relationship];
      if (fieldInfo === undefined) {
        return Promise.reject(new Error('Unknown field ' + relationship));
      } else {
        return this[$knex](fieldInfo.joinTable).where(_defineProperty({}, fieldInfo.parentColumn, id)).select(fieldInfo.childColumn).then(function (l) {
          return l.map(function (v) {
            return v[fieldInfo.childColumn];
          });
        });
      }
    }
  }, {
    key: 'remove',
    value: function remove(t, id, relationship, childId) {
      var _this4 = this;

      var fieldInfo = t.$fields[relationship];
      if (fieldInfo === undefined) {
        return Promise.reject(new Error('Unknown field ' + relationship));
      } else {
        var _$knex$where6;

        return this[$knex](fieldInfo.joinTable).where((_$knex$where6 = {}, _defineProperty(_$knex$where6, fieldInfo.parentColumn, id), _defineProperty(_$knex$where6, fieldInfo.childColumn, childId), _$knex$where6)).delete().then(function () {
          return _this4.has(t, id, relationship);
        });
      }
    }
  }, {
    key: 'query',
    value: function query(q) {
      return Promise.resolve(this[$knex].raw(q.query)).then(function (d) {
        return d.rows;
      });
    }
  }]);

  return SQLStorage;
}(_storage.Storage);
//# sourceMappingURL=data:application/json;base64,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QUFZLEdBQVosQ0FBZ0IsRUFBRSxLQUFsQixDQUFoQixFQUNOLElBRE0sQ0FDRCxVQUFDLENBQUQ7QUFBQSxlQUFPLEVBQUUsSUFBVDtBQUFBLE9BREMsQ0FBUDtBQUVEIiwiZmlsZSI6InN0b3JhZ2Uvc3FsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQga25leCBmcm9tICdrbmV4JztcbmltcG9ydCB7U3RvcmFnZX0gZnJvbSAnLi9zdG9yYWdlJztcbmNvbnN0ICRrbmV4ID0gU3ltYm9sKCcka25leCcpO1xuXG5leHBvcnQgY2xhc3MgU1FMU3RvcmFnZSBleHRlbmRzIFN0b3JhZ2Uge1xuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBzdXBlcihvcHRzKTtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAge1xuICAgICAgICBjbGllbnQ6ICdwb3N0Z3JlcycsXG4gICAgICAgIGRlYnVnOiBmYWxzZSxcbiAgICAgICAgY29ubmVjdGlvbjoge1xuICAgICAgICAgIHVzZXI6ICdwb3N0Z3JlcycsXG4gICAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgICAgICAgcG9ydDogNTQzMixcbiAgICAgICAgICBwYXNzd29yZDogJycsXG4gICAgICAgICAgY2hhcnNldDogJ3V0ZjgnLFxuICAgICAgICB9LFxuICAgICAgICBwb29sOiB7XG4gICAgICAgICAgbWF4OiAyMCxcbiAgICAgICAgICBtaW46IDAsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgb3B0cy5zcWxcbiAgICApO1xuICAgIHRoaXNbJGtuZXhdID0ga25leChvcHRpb25zKTtcbiAgfVxuXG4gIC8qXG4gICAgbm90ZSB0aGF0IGtuZXguanMgXCJ0aGVuXCIgZnVuY3Rpb25zIGFyZW4ndCBhY3R1YWxseSBwcm9taXNlcyB0aGUgd2F5IHlvdSB0aGluayB0aGV5IGFyZS5cbiAgICB5b3UgY2FuIHJldHVybiBrbmV4Lmluc2VydCgpLmludG8oKSwgd2hpY2ggaGFzIGEgdGhlbigpIG9uIGl0LCBidXQgdGhhdCB0aGVuYWJsZSBpc24ndFxuICAgIGFuIGFjdHVhbCBwcm9taXNlIHlldC4gU28gaW5zdGVhZCB3ZSdyZSByZXR1cm5pbmcgUHJvbWlzZS5yZXNvbHZlKHRoZW5hYmxlKTtcbiAgKi9cblxuICB0ZWFyZG93bigpIHtcbiAgICByZXR1cm4gdGhpc1ska25leF0uZGVzdHJveSgpO1xuICB9XG5cbiAgb25DYWNoZWFibGVSZWFkKCkge31cblxuICB3cml0ZSh0LCB2KSB7XG4gICAgY29uc3QgaWQgPSB2W3QuJGlkXTtcbiAgICBjb25zdCB1cGRhdGVPYmplY3QgPSB7fTtcbiAgICBPYmplY3Qua2V5cyh0LiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgaWYgKHZbZmllbGROYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGNvcHkgZnJvbSB2IHRvIHRoZSBiZXN0IG9mIG91ciBhYmlsaXR5XG4gICAgICAgIGlmIChcbiAgICAgICAgICAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2FycmF5JykgfHxcbiAgICAgICAgICAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2hhc01hbnknKVxuICAgICAgICApIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IHZbZmllbGROYW1lXS5jb25jYXQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0LiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgdltmaWVsZE5hbWVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IHZbZmllbGROYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICgoaWQgPT09IHVuZGVmaW5lZCkgJiYgKHRoaXMudGVybWluYWwpKSB7XG4gICAgICByZXR1cm4gdGhpc1ska25leF0odC4kbmFtZSkuaW5zZXJ0KHVwZGF0ZU9iamVjdCkucmV0dXJuaW5nKHQuJGlkKVxuICAgICAgLnRoZW4oKGNyZWF0ZWRJZCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkKHQsIGNyZWF0ZWRJZFswXSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzWyRrbmV4XSh0LiRuYW1lKS53aGVyZSh7W3QuJGlkXTogaWR9KS51cGRhdGUodXBkYXRlT2JqZWN0KVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkKHQsIGlkKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgbmV3IGNvbnRlbnQgaW4gYSBub24tdGVybWluYWwgc3RvcmUnKTtcbiAgICB9XG4gIH1cblxuICByZWFkKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXNbJGtuZXhdKHQuJG5hbWUpLndoZXJlKHtbdC4kaWRdOiBpZH0pLnNlbGVjdCgpXG4gICAgLnRoZW4oKG8pID0+IG9bMF0gfHwgbnVsbCk7XG4gIH1cblxuICBkZWxldGUodCwgaWQpIHtcbiAgICByZXR1cm4gdGhpc1ska25leF0odC4kbmFtZSkud2hlcmUoe1t0LiRpZF06IGlkfSkuZGVsZXRlKClcbiAgICAudGhlbigobykgPT4gbyk7XG4gIH1cblxuICBhZGQodCwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCkge1xuICAgIGNvbnN0IGZpZWxkSW5mbyA9IHQuJGZpZWxkc1tyZWxhdGlvbnNoaXBdO1xuICAgIGlmIChmaWVsZEluZm8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihgVW5rbm93biBmaWVsZCAke3JlbGF0aW9uc2hpcH1gKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzWyRrbmV4XShmaWVsZEluZm8uam9pblRhYmxlKVxuICAgICAgLndoZXJlKHtcbiAgICAgICAgW2ZpZWxkSW5mby5wYXJlbnRDb2x1bW5dOiBpZCxcbiAgICAgICAgW2ZpZWxkSW5mby5jaGlsZENvbHVtbl06IGNoaWxkSWQsXG4gICAgICB9KS5zZWxlY3QoKVxuICAgICAgLnRoZW4oKGwpID0+IHtcbiAgICAgICAgaWYgKGwubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYEl0ZW0gJHtjaGlsZElkfSBhbHJlYWR5IGluICR7cmVsYXRpb25zaGlwfSBvZiAke3QuJG5hbWV9OiR7aWR9YCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzWyRrbmV4XShmaWVsZEluZm8uam9pblRhYmxlKVxuICAgICAgICAgIC5pbnNlcnQoe1xuICAgICAgICAgICAgW2ZpZWxkSW5mby5wYXJlbnRDb2x1bW5dOiBpZCxcbiAgICAgICAgICAgIFtmaWVsZEluZm8uY2hpbGRDb2x1bW5dOiBjaGlsZElkLFxuICAgICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFzKHQsIGlkLCByZWxhdGlvbnNoaXApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBoYXModCwgaWQsIHJlbGF0aW9uc2hpcCkge1xuICAgIGNvbnN0IGZpZWxkSW5mbyA9IHQuJGZpZWxkc1tyZWxhdGlvbnNoaXBdO1xuICAgIGlmIChmaWVsZEluZm8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihgVW5rbm93biBmaWVsZCAke3JlbGF0aW9uc2hpcH1gKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzWyRrbmV4XShmaWVsZEluZm8uam9pblRhYmxlKVxuICAgICAgLndoZXJlKHtcbiAgICAgICAgW2ZpZWxkSW5mby5wYXJlbnRDb2x1bW5dOiBpZCxcbiAgICAgIH0pLnNlbGVjdChmaWVsZEluZm8uY2hpbGRDb2x1bW4pXG4gICAgICAudGhlbigobCkgPT4gbC5tYXAoKHYpID0+IHZbZmllbGRJbmZvLmNoaWxkQ29sdW1uXSkpO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZSh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKSB7XG4gICAgY29uc3QgZmllbGRJbmZvID0gdC4kZmllbGRzW3JlbGF0aW9uc2hpcF07XG4gICAgaWYgKGZpZWxkSW5mbyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGBVbmtub3duIGZpZWxkICR7cmVsYXRpb25zaGlwfWApKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXNbJGtuZXhdKGZpZWxkSW5mby5qb2luVGFibGUpXG4gICAgICAud2hlcmUoe1xuICAgICAgICBbZmllbGRJbmZvLnBhcmVudENvbHVtbl06IGlkLFxuICAgICAgICBbZmllbGRJbmZvLmNoaWxkQ29sdW1uXTogY2hpbGRJZCxcbiAgICAgIH0pLmRlbGV0ZSgpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmhhcyh0LCBpZCwgcmVsYXRpb25zaGlwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHF1ZXJ5KHEpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXNbJGtuZXhdLnJhdyhxLnF1ZXJ5KSlcbiAgICAudGhlbigoZCkgPT4gZC5yb3dzKTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
