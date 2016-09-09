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

Promise.config({
  longStackTraces: true
});

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3FsLmpzIl0sIm5hbWVzIjpbIlByb21pc2UiLCIka25leCIsIlN5bWJvbCIsImNvbmZpZyIsImxvbmdTdGFja1RyYWNlcyIsIlNRTFN0b3JhZ2UiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsImNsaWVudCIsImRlYnVnIiwiY29ubmVjdGlvbiIsInVzZXIiLCJob3N0IiwicG9ydCIsInBhc3N3b3JkIiwiY2hhcnNldCIsInBvb2wiLCJtYXgiLCJtaW4iLCJzcWwiLCJkZXN0cm95IiwidCIsInYiLCJpZCIsIiRpZCIsInVwZGF0ZU9iamVjdCIsImtleXMiLCIkZmllbGRzIiwiZm9yRWFjaCIsImZpZWxkTmFtZSIsInVuZGVmaW5lZCIsInR5cGUiLCJjb25jYXQiLCJ0ZXJtaW5hbCIsIiRuYW1lIiwiaW5zZXJ0IiwicmV0dXJuaW5nIiwidGhlbiIsImNyZWF0ZWRJZCIsInJlYWQiLCJ3aGVyZSIsInVwZGF0ZSIsIkVycm9yIiwic2VsZWN0IiwibyIsImRlbGV0ZSIsInJlbGF0aW9uc2hpcCIsImNoaWxkSWQiLCJmaWVsZEluZm8iLCJyZWplY3QiLCJqb2luVGFibGUiLCJwYXJlbnRDb2x1bW4iLCJjaGlsZENvbHVtbiIsImwiLCJsZW5ndGgiLCJoYXMiLCJtYXAiLCJxIiwicmVzb2x2ZSIsInJhdyIsInF1ZXJ5IiwiZCIsInJvd3MiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQUFZQSxPOztBQUNaOzs7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsSUFBTUMsUUFBUUMsT0FBTyxPQUFQLENBQWQ7O0FBRUFGLFFBQVFHLE1BQVIsQ0FBZTtBQUNiQyxtQkFBaUI7QUFESixDQUFmOztJQUlhQyxVLFdBQUFBLFU7OztBQUNYLHdCQUF1QjtBQUFBLFFBQVhDLElBQVcseURBQUosRUFBSTs7QUFBQTs7QUFBQSx3SEFDZkEsSUFEZTs7QUFFckIsUUFBTUMsVUFBVUMsT0FBT0MsTUFBUCxDQUNkLEVBRGMsRUFFZDtBQUNFQyxj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QVE0RCxPQUFSLENBQWdCLEtBQUszRCxLQUFMLEVBQVk0RCxHQUFaLENBQWdCRixFQUFFRyxLQUFsQixDQUFoQixFQUNOdkIsSUFETSxDQUNELFVBQUN3QixDQUFEO0FBQUEsZUFBT0EsRUFBRUMsSUFBVDtBQUFBLE9BREMsQ0FBUDtBQUVEIiwiZmlsZSI6InN0b3JhZ2Uvc3FsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQga25leCBmcm9tICdrbmV4JztcbmltcG9ydCB7U3RvcmFnZX0gZnJvbSAnLi9zdG9yYWdlJztcbmNvbnN0ICRrbmV4ID0gU3ltYm9sKCcka25leCcpO1xuXG5Qcm9taXNlLmNvbmZpZyh7XG4gIGxvbmdTdGFja1RyYWNlczogdHJ1ZSxcbn0pO1xuXG5leHBvcnQgY2xhc3MgU1FMU3RvcmFnZSBleHRlbmRzIFN0b3JhZ2Uge1xuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBzdXBlcihvcHRzKTtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAge1xuICAgICAgICBjbGllbnQ6ICdwb3N0Z3JlcycsXG4gICAgICAgIGRlYnVnOiBmYWxzZSxcbiAgICAgICAgY29ubmVjdGlvbjoge1xuICAgICAgICAgIHVzZXI6ICdwb3N0Z3JlcycsXG4gICAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgICAgICAgcG9ydDogNTQzMixcbiAgICAgICAgICBwYXNzd29yZDogJycsXG4gICAgICAgICAgY2hhcnNldDogJ3V0ZjgnLFxuICAgICAgICB9LFxuICAgICAgICBwb29sOiB7XG4gICAgICAgICAgbWF4OiAyMCxcbiAgICAgICAgICBtaW46IDAsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgb3B0cy5zcWxcbiAgICApO1xuICAgIHRoaXNbJGtuZXhdID0ga25leChvcHRpb25zKTtcbiAgfVxuXG4gIC8qXG4gICAgbm90ZSB0aGF0IGtuZXguanMgXCJ0aGVuXCIgZnVuY3Rpb25zIGFyZW4ndCBhY3R1YWxseSBwcm9taXNlcyB0aGUgd2F5IHlvdSB0aGluayB0aGV5IGFyZS5cbiAgICB5b3UgY2FuIHJldHVybiBrbmV4Lmluc2VydCgpLmludG8oKSwgd2hpY2ggaGFzIGEgdGhlbigpIG9uIGl0LCBidXQgdGhhdCB0aGVuYWJsZSBpc24ndFxuICAgIGFuIGFjdHVhbCBwcm9taXNlIHlldC4gU28gaW5zdGVhZCB3ZSdyZSByZXR1cm5pbmcgUHJvbWlzZS5yZXNvbHZlKHRoZW5hYmxlKTtcbiAgKi9cblxuICB0ZWFyZG93bigpIHtcbiAgICByZXR1cm4gdGhpc1ska25leF0uZGVzdHJveSgpO1xuICB9XG5cbiAgd3JpdGUodCwgdikge1xuICAgIGNvbnN0IGlkID0gdlt0LiRpZF07XG4gICAgY29uc3QgdXBkYXRlT2JqZWN0ID0ge307XG4gICAgT2JqZWN0LmtleXModC4kZmllbGRzKS5mb3JFYWNoKChmaWVsZE5hbWUpID0+IHtcbiAgICAgIGlmICh2W2ZpZWxkTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBjb3B5IGZyb20gdiB0byB0aGUgYmVzdCBvZiBvdXIgYWJpbGl0eVxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdhcnJheScpIHx8XG4gICAgICAgICAgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdoYXNNYW55JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSB2W2ZpZWxkTmFtZV0uY29uY2F0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IE9iamVjdC5hc3NpZ24oe30sIHZbZmllbGROYW1lXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSB2W2ZpZWxkTmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoKGlkID09PSB1bmRlZmluZWQpICYmICh0aGlzLnRlcm1pbmFsKSkge1xuICAgICAgcmV0dXJuIHRoaXNbJGtuZXhdKHQuJG5hbWUpLmluc2VydCh1cGRhdGVPYmplY3QpLnJldHVybmluZyh0LiRpZClcbiAgICAgIC50aGVuKChjcmVhdGVkSWQpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZCh0LCBjcmVhdGVkSWRbMF0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChpZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpc1ska25leF0odC4kbmFtZSkud2hlcmUoe1t0LiRpZF06IGlkfSkudXBkYXRlKHVwZGF0ZU9iamVjdClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZCh0LCBpZCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIG5ldyBjb250ZW50IGluIGEgbm9uLXRlcm1pbmFsIHN0b3JlJyk7XG4gICAgfVxuICB9XG5cbiAgcmVhZCh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzWyRrbmV4XSh0LiRuYW1lKS53aGVyZSh7W3QuJGlkXTogaWR9KS5zZWxlY3QoKVxuICAgIC50aGVuKChvKSA9PiBvWzBdIHx8IG51bGwpO1xuICB9XG5cbiAgZGVsZXRlKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXNbJGtuZXhdKHQuJG5hbWUpLndoZXJlKHtbdC4kaWRdOiBpZH0pLmRlbGV0ZSgpXG4gICAgLnRoZW4oKG8pID0+IG8pO1xuICB9XG5cbiAgYWRkKHQsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQpIHtcbiAgICBjb25zdCBmaWVsZEluZm8gPSB0LiRmaWVsZHNbcmVsYXRpb25zaGlwXTtcbiAgICBpZiAoZmllbGRJbmZvID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYFVua25vd24gZmllbGQgJHtyZWxhdGlvbnNoaXB9YCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpc1ska25leF0oZmllbGRJbmZvLmpvaW5UYWJsZSlcbiAgICAgIC53aGVyZSh7XG4gICAgICAgIFtmaWVsZEluZm8ucGFyZW50Q29sdW1uXTogaWQsXG4gICAgICAgIFtmaWVsZEluZm8uY2hpbGRDb2x1bW5dOiBjaGlsZElkLFxuICAgICAgfSkuc2VsZWN0KClcbiAgICAgIC50aGVuKChsKSA9PiB7XG4gICAgICAgIGlmIChsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGBJdGVtICR7Y2hpbGRJZH0gYWxyZWFkeSBpbiAke3JlbGF0aW9uc2hpcH0gb2YgJHt0LiRuYW1lfToke2lkfWApKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1ska25leF0oZmllbGRJbmZvLmpvaW5UYWJsZSlcbiAgICAgICAgICAuaW5zZXJ0KHtcbiAgICAgICAgICAgIFtmaWVsZEluZm8ucGFyZW50Q29sdW1uXTogaWQsXG4gICAgICAgICAgICBbZmllbGRJbmZvLmNoaWxkQ29sdW1uXTogY2hpbGRJZCxcbiAgICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmhhcyh0LCBpZCwgcmVsYXRpb25zaGlwKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgaGFzKHQsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgICBjb25zdCBmaWVsZEluZm8gPSB0LiRmaWVsZHNbcmVsYXRpb25zaGlwXTtcbiAgICBpZiAoZmllbGRJbmZvID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYFVua25vd24gZmllbGQgJHtyZWxhdGlvbnNoaXB9YCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpc1ska25leF0oZmllbGRJbmZvLmpvaW5UYWJsZSlcbiAgICAgIC53aGVyZSh7XG4gICAgICAgIFtmaWVsZEluZm8ucGFyZW50Q29sdW1uXTogaWQsXG4gICAgICB9KS5zZWxlY3QoZmllbGRJbmZvLmNoaWxkQ29sdW1uKVxuICAgICAgLnRoZW4oKGwpID0+IGwubWFwKCh2KSA9PiB2W2ZpZWxkSW5mby5jaGlsZENvbHVtbl0pKTtcbiAgICB9XG4gIH1cblxuICByZW1vdmUodCwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCkge1xuICAgIGNvbnN0IGZpZWxkSW5mbyA9IHQuJGZpZWxkc1tyZWxhdGlvbnNoaXBdO1xuICAgIGlmIChmaWVsZEluZm8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihgVW5rbm93biBmaWVsZCAke3JlbGF0aW9uc2hpcH1gKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzWyRrbmV4XShmaWVsZEluZm8uam9pblRhYmxlKVxuICAgICAgLndoZXJlKHtcbiAgICAgICAgW2ZpZWxkSW5mby5wYXJlbnRDb2x1bW5dOiBpZCxcbiAgICAgICAgW2ZpZWxkSW5mby5jaGlsZENvbHVtbl06IGNoaWxkSWQsXG4gICAgICB9KS5kZWxldGUoKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5oYXModCwgaWQsIHJlbGF0aW9uc2hpcCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBxdWVyeShxKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzWyRrbmV4XS5yYXcocS5xdWVyeSkpXG4gICAgLnRoZW4oKGQpID0+IGQucm93cyk7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
