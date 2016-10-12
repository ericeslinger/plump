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
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

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

        return this[$knex](fieldInfo.relationship).where((_$knex$where4 = {}, _defineProperty(_$knex$where4, fieldInfo.parentField, id), _defineProperty(_$knex$where4, fieldInfo.childField, childId), _$knex$where4)).select().then(function (l) {
          if (l.length > 0) {
            return Promise.reject(new Error('Item ' + childId + ' already in ' + relationship + ' of ' + t.$name + ':' + id));
          } else {
            var _this3$$knex$insert;

            return _this3[$knex](fieldInfo.relationship).insert((_this3$$knex$insert = {}, _defineProperty(_this3$$knex$insert, fieldInfo.parentField, id), _defineProperty(_this3$$knex$insert, fieldInfo.childField, childId), _this3$$knex$insert)).then(function () {
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
        return this[$knex](fieldInfo.relationship).where(_defineProperty({}, fieldInfo.parentField, id)).select(fieldInfo.childField).then(function (l) {
          return l.map(function (v) {
            return v[fieldInfo.childField];
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

        return this[$knex](fieldInfo.relationship).where((_$knex$where6 = {}, _defineProperty(_$knex$where6, fieldInfo.parentField, id), _defineProperty(_$knex$where6, fieldInfo.childField, childId), _$knex$where6)).delete().then(function () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3FsLmpzIl0sIm5hbWVzIjpbIlByb21pc2UiLCIka25leCIsIlN5bWJvbCIsIlNRTFN0b3JhZ2UiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsImNsaWVudCIsImRlYnVnIiwiY29ubmVjdGlvbiIsInVzZXIiLCJob3N0IiwicG9ydCIsInBhc3N3b3JkIiwiY2hhcnNldCIsInBvb2wiLCJtYXgiLCJtaW4iLCJzcWwiLCJkZXN0cm95IiwidCIsInYiLCJpZCIsIiRpZCIsInVwZGF0ZU9iamVjdCIsImtleXMiLCIkZmllbGRzIiwiZm9yRWFjaCIsImZpZWxkTmFtZSIsInVuZGVmaW5lZCIsInR5cGUiLCJjb25jYXQiLCJ0ZXJtaW5hbCIsIiRuYW1lIiwiaW5zZXJ0IiwicmV0dXJuaW5nIiwidGhlbiIsImNyZWF0ZWRJZCIsInJlYWQiLCJ3aGVyZSIsInVwZGF0ZSIsIkVycm9yIiwic2VsZWN0IiwibyIsImRlbGV0ZSIsInJlbGF0aW9uc2hpcCIsImNoaWxkSWQiLCJmaWVsZEluZm8iLCJyZWplY3QiLCJwYXJlbnRGaWVsZCIsImNoaWxkRmllbGQiLCJsIiwibGVuZ3RoIiwiaGFzIiwibWFwIiwicSIsInJlc29sdmUiLCJyYXciLCJxdWVyeSIsImQiLCJyb3dzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7SUFBWUEsTzs7QUFDWjs7OztBQUNBOzs7Ozs7Ozs7Ozs7OztBQUNBLElBQU1DLFFBQVFDLE9BQU8sT0FBUCxDQUFkOztJQUVhQyxVLFdBQUFBLFU7OztBQUNYLHdCQUF1QjtBQUFBLFFBQVhDLElBQVcsdUVBQUosRUFBSTs7QUFBQTs7QUFBQSx3SEFDZkEsSUFEZTs7QUFFckIsUUFBTUMsVUFBVUMsT0FBT0MsTUFBUCxDQUNkLEVBRGMsRUFFZDtBQUNFQyxjQUFRLFVBRFY7QUFFRUMsYUFBTyxLQUZUO0FBR0VDLGtCQUFZO0FBQ1ZDLGNBQU0sVUFESTtBQUVWQyxjQUFNLFdBRkk7QUFHVkMsY0FBTSxJQUhJO0FB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TSxDQUNELFVBQUN1QixDQUFEO0FBQUEsZUFBT0EsRUFBRUMsSUFBVDtBQUFBLE9BREMsQ0FBUDtBQUVEIiwiZmlsZSI6InN0b3JhZ2Uvc3FsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQga25leCBmcm9tICdrbmV4JztcbmltcG9ydCB7U3RvcmFnZX0gZnJvbSAnLi9zdG9yYWdlJztcbmNvbnN0ICRrbmV4ID0gU3ltYm9sKCcka25leCcpO1xuXG5leHBvcnQgY2xhc3MgU1FMU3RvcmFnZSBleHRlbmRzIFN0b3JhZ2Uge1xuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBzdXBlcihvcHRzKTtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAge1xuICAgICAgICBjbGllbnQ6ICdwb3N0Z3JlcycsXG4gICAgICAgIGRlYnVnOiBmYWxzZSxcbiAgICAgICAgY29ubmVjdGlvbjoge1xuICAgICAgICAgIHVzZXI6ICdwb3N0Z3JlcycsXG4gICAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgICAgICAgcG9ydDogNTQzMixcbiAgICAgICAgICBwYXNzd29yZDogJycsXG4gICAgICAgICAgY2hhcnNldDogJ3V0ZjgnLFxuICAgICAgICB9LFxuICAgICAgICBwb29sOiB7XG4gICAgICAgICAgbWF4OiAyMCxcbiAgICAgICAgICBtaW46IDAsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgb3B0cy5zcWxcbiAgICApO1xuICAgIHRoaXNbJGtuZXhdID0ga25leChvcHRpb25zKTtcbiAgfVxuXG4gIC8qXG4gICAgbm90ZSB0aGF0IGtuZXguanMgXCJ0aGVuXCIgZnVuY3Rpb25zIGFyZW4ndCBhY3R1YWxseSBwcm9taXNlcyB0aGUgd2F5IHlvdSB0aGluayB0aGV5IGFyZS5cbiAgICB5b3UgY2FuIHJldHVybiBrbmV4Lmluc2VydCgpLmludG8oKSwgd2hpY2ggaGFzIGEgdGhlbigpIG9uIGl0LCBidXQgdGhhdCB0aGVuYWJsZSBpc24ndFxuICAgIGFuIGFjdHVhbCBwcm9taXNlIHlldC4gU28gaW5zdGVhZCB3ZSdyZSByZXR1cm5pbmcgUHJvbWlzZS5yZXNvbHZlKHRoZW5hYmxlKTtcbiAgKi9cblxuICB0ZWFyZG93bigpIHtcbiAgICByZXR1cm4gdGhpc1ska25leF0uZGVzdHJveSgpO1xuICB9XG5cbiAgb25DYWNoZWFibGVSZWFkKCkge31cblxuICB3cml0ZSh0LCB2KSB7XG4gICAgY29uc3QgaWQgPSB2W3QuJGlkXTtcbiAgICBjb25zdCB1cGRhdGVPYmplY3QgPSB7fTtcbiAgICBPYmplY3Qua2V5cyh0LiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgaWYgKHZbZmllbGROYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGNvcHkgZnJvbSB2IHRvIHRoZSBiZXN0IG9mIG91ciBhYmlsaXR5XG4gICAgICAgIGlmIChcbiAgICAgICAgICAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2FycmF5JykgfHxcbiAgICAgICAgICAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ2hhc01hbnknKVxuICAgICAgICApIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IHZbZmllbGROYW1lXS5jb25jYXQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0LiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgdltmaWVsZE5hbWVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IHZbZmllbGROYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICgoaWQgPT09IHVuZGVmaW5lZCkgJiYgKHRoaXMudGVybWluYWwpKSB7XG4gICAgICByZXR1cm4gdGhpc1ska25leF0odC4kbmFtZSkuaW5zZXJ0KHVwZGF0ZU9iamVjdCkucmV0dXJuaW5nKHQuJGlkKVxuICAgICAgLnRoZW4oKGNyZWF0ZWRJZCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkKHQsIGNyZWF0ZWRJZFswXSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzWyRrbmV4XSh0LiRuYW1lKS53aGVyZSh7W3QuJGlkXTogaWR9KS51cGRhdGUodXBkYXRlT2JqZWN0KVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkKHQsIGlkKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgbmV3IGNvbnRlbnQgaW4gYSBub24tdGVybWluYWwgc3RvcmUnKTtcbiAgICB9XG4gIH1cblxuICByZWFkKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXNbJGtuZXhdKHQuJG5hbWUpLndoZXJlKHtbdC4kaWRdOiBpZH0pLnNlbGVjdCgpXG4gICAgLnRoZW4oKG8pID0+IG9bMF0gfHwgbnVsbCk7XG4gIH1cblxuICBkZWxldGUodCwgaWQpIHtcbiAgICByZXR1cm4gdGhpc1ska25leF0odC4kbmFtZSkud2hlcmUoe1t0LiRpZF06IGlkfSkuZGVsZXRlKClcbiAgICAudGhlbigobykgPT4gbyk7XG4gIH1cblxuICBhZGQodCwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCkge1xuICAgIGNvbnN0IGZpZWxkSW5mbyA9IHQuJGZpZWxkc1tyZWxhdGlvbnNoaXBdO1xuICAgIGlmIChmaWVsZEluZm8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihgVW5rbm93biBmaWVsZCAke3JlbGF0aW9uc2hpcH1gKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzWyRrbmV4XShmaWVsZEluZm8ucmVsYXRpb25zaGlwKVxuICAgICAgLndoZXJlKHtcbiAgICAgICAgW2ZpZWxkSW5mby5wYXJlbnRGaWVsZF06IGlkLFxuICAgICAgICBbZmllbGRJbmZvLmNoaWxkRmllbGRdOiBjaGlsZElkLFxuICAgICAgfSkuc2VsZWN0KClcbiAgICAgIC50aGVuKChsKSA9PiB7XG4gICAgICAgIGlmIChsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGBJdGVtICR7Y2hpbGRJZH0gYWxyZWFkeSBpbiAke3JlbGF0aW9uc2hpcH0gb2YgJHt0LiRuYW1lfToke2lkfWApKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1ska25leF0oZmllbGRJbmZvLnJlbGF0aW9uc2hpcClcbiAgICAgICAgICAuaW5zZXJ0KHtcbiAgICAgICAgICAgIFtmaWVsZEluZm8ucGFyZW50RmllbGRdOiBpZCxcbiAgICAgICAgICAgIFtmaWVsZEluZm8uY2hpbGRGaWVsZF06IGNoaWxkSWQsXG4gICAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5oYXModCwgaWQsIHJlbGF0aW9uc2hpcCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGhhcyh0LCBpZCwgcmVsYXRpb25zaGlwKSB7XG4gICAgY29uc3QgZmllbGRJbmZvID0gdC4kZmllbGRzW3JlbGF0aW9uc2hpcF07XG4gICAgaWYgKGZpZWxkSW5mbyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGBVbmtub3duIGZpZWxkICR7cmVsYXRpb25zaGlwfWApKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXNbJGtuZXhdKGZpZWxkSW5mby5yZWxhdGlvbnNoaXApXG4gICAgICAud2hlcmUoe1xuICAgICAgICBbZmllbGRJbmZvLnBhcmVudEZpZWxkXTogaWQsXG4gICAgICB9KS5zZWxlY3QoZmllbGRJbmZvLmNoaWxkRmllbGQpXG4gICAgICAudGhlbigobCkgPT4gbC5tYXAoKHYpID0+IHZbZmllbGRJbmZvLmNoaWxkRmllbGRdKSk7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlKHQsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQpIHtcbiAgICBjb25zdCBmaWVsZEluZm8gPSB0LiRmaWVsZHNbcmVsYXRpb25zaGlwXTtcbiAgICBpZiAoZmllbGRJbmZvID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYFVua25vd24gZmllbGQgJHtyZWxhdGlvbnNoaXB9YCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpc1ska25leF0oZmllbGRJbmZvLnJlbGF0aW9uc2hpcClcbiAgICAgIC53aGVyZSh7XG4gICAgICAgIFtmaWVsZEluZm8ucGFyZW50RmllbGRdOiBpZCxcbiAgICAgICAgW2ZpZWxkSW5mby5jaGlsZEZpZWxkXTogY2hpbGRJZCxcbiAgICAgIH0pLmRlbGV0ZSgpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmhhcyh0LCBpZCwgcmVsYXRpb25zaGlwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHF1ZXJ5KHEpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXNbJGtuZXhdLnJhdyhxLnF1ZXJ5KSlcbiAgICAudGhlbigoZCkgPT4gZC5yb3dzKTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
