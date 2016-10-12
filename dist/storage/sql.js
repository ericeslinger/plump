'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SQLStorage = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

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
    value: function read(t, id, relationship) {
      var _this3 = this;

      if (relationship && t.$fields[relationship].type === 'hasMany') {
        var _ret = function () {
          var fieldInfo = t.$fields[relationship];
          if (fieldInfo === undefined) {
            return {
              v: Promise.reject(new Error('Unknown field ' + relationship))
            };
          } else {
            return {
              v: _this3[$knex](fieldInfo.relationship).where(_defineProperty({}, fieldInfo.parentField, id)).select(fieldInfo.childField).then(function (l) {
                return _defineProperty({}, relationship, l.map(function (v) {
                  return v[fieldInfo.childField];
                }));
              })
            };
          }
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
      } else {
        return this[$knex](t.$name).where(_defineProperty({}, t.$id, id)).select().then(function (o) {
          return o[0] || null;
        });
      }
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
      var _this4 = this;

      var fieldInfo = t.$fields[relationship];
      if (fieldInfo === undefined) {
        return Promise.reject(new Error('Unknown field ' + relationship));
      } else {
        var _$knex$where4;

        return this[$knex](fieldInfo.relationship).where((_$knex$where4 = {}, _defineProperty(_$knex$where4, fieldInfo.parentField, id), _defineProperty(_$knex$where4, fieldInfo.childField, childId), _$knex$where4)).select().then(function (l) {
          if (l.length > 0) {
            return Promise.reject(new Error('Item ' + childId + ' already in ' + relationship + ' of ' + t.$name + ':' + id));
          } else {
            var _this4$$knex$insert;

            return _this4[$knex](fieldInfo.relationship).insert((_this4$$knex$insert = {}, _defineProperty(_this4$$knex$insert, fieldInfo.parentField, id), _defineProperty(_this4$$knex$insert, fieldInfo.childField, childId), _this4$$knex$insert)).then(function () {
              return _this4.read(t, id, relationship);
            });
          }
        });
      }
    }
  }, {
    key: 'remove',
    value: function remove(t, id, relationship, childId) {
      var _this5 = this;

      var fieldInfo = t.$fields[relationship];
      if (fieldInfo === undefined) {
        return Promise.reject(new Error('Unknown field ' + relationship));
      } else {
        var _$knex$where5;

        return this[$knex](fieldInfo.relationship).where((_$knex$where5 = {}, _defineProperty(_$knex$where5, fieldInfo.parentField, id), _defineProperty(_$knex$where5, fieldInfo.childField, childId), _$knex$where5)).delete().then(function () {
          return _this5.read(t, id, relationship);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3FsLmpzIl0sIm5hbWVzIjpbIlByb21pc2UiLCIka25leCIsIlN5bWJvbCIsIlNRTFN0b3JhZ2UiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsImNsaWVudCIsImRlYnVnIiwiY29ubmVjdGlvbiIsInVzZXIiLCJob3N0IiwicG9ydCIsInBhc3N3b3JkIiwiY2hhcnNldCIsInBvb2wiLCJtYXgiLCJtaW4iLCJzcWwiLCJkZXN0cm95IiwidCIsInYiLCJpZCIsIiRpZCIsInVwZGF0ZU9iamVjdCIsImtleXMiLCIkZmllbGRzIiwiZm9yRWFjaCIsImZpZWxkTmFtZSIsInVuZGVmaW5lZCIsInR5cGUiLCJjb25jYXQiLCJ0ZXJtaW5hbCIsIiRuYW1lIiwiaW5zZXJ0IiwicmV0dXJuaW5nIiwidGhlbiIsImNyZWF0ZWRJZCIsInJlYWQiLCJ3aGVyZSIsInVwZGF0ZSIsIkVycm9yIiwicmVsYXRpb25zaGlwIiwiZmllbGRJbmZvIiwicmVqZWN0IiwicGFyZW50RmllbGQiLCJzZWxlY3QiLCJjaGlsZEZpZWxkIiwibCIsIm1hcCIsIm8iLCJkZWxldGUiLCJjaGlsZElkIiwibGVuZ3RoIiwicSIsInJlc29sdmUiLCJyYXciLCJxdWVyeSIsImQiLCJyb3dzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztJQUFZQSxPOztBQUNaOzs7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsSUFBTUMsUUFBUUMsT0FBTyxPQUFQLENBQWQ7O0lBRWFDLFUsV0FBQUEsVTs7O0FBQ1gsd0JBQXVCO0FBQUEsUUFBWEMsSUFBVyx5REFBSixFQUFJOztBQUFBOztBQUFBLHdIQUNmQSxJQURlOztBQUVyQixRQUFNQyxVQUFVQyxPQUFPQyxNQUFQLENBQ2QsRUFEYyxFQUVkO0FBQ0VDLGNBQVEsVUFEVjtBQUVFQyxhQUFPLEtBRlQ7QUFHRUMsa0JBQVk7QUFDVkMsY0FBTSxVQURJO0FBRVZDLGNBQU0sV0FGSTtBQUdWQyxjQUFNLElBSEk7QUFJVkMs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UUQ7QUFDRjs7OzBCQUVLWSxDLEVBQUc7QUFDUCxhQUFPdkQsUUFBUXdELE9BQVIsQ0FBZ0IsS0FBS3ZELEtBQUwsRUFBWXdELEdBQVosQ0FBZ0JGLEVBQUVHLEtBQWxCLENBQWhCLEVBQ05yQixJQURNLENBQ0QsVUFBQ3NCLENBQUQ7QUFBQSxlQUFPQSxFQUFFQyxJQUFUO0FBQUEsT0FEQyxDQUFQO0FBRUQiLCJmaWxlIjoic3RvcmFnZS9zcWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBrbmV4IGZyb20gJ2tuZXgnO1xuaW1wb3J0IHtTdG9yYWdlfSBmcm9tICcuL3N0b3JhZ2UnO1xuY29uc3QgJGtuZXggPSBTeW1ib2woJyRrbmV4Jyk7XG5cbmV4cG9ydCBjbGFzcyBTUUxTdG9yYWdlIGV4dGVuZHMgU3RvcmFnZSB7XG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIHN1cGVyKG9wdHMpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIGNsaWVudDogJ3Bvc3RncmVzJyxcbiAgICAgICAgZGVidWc6IGZhbHNlLFxuICAgICAgICBjb25uZWN0aW9uOiB7XG4gICAgICAgICAgdXNlcjogJ3Bvc3RncmVzJyxcbiAgICAgICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgICAgICBwb3J0OiA1NDMyLFxuICAgICAgICAgIHBhc3N3b3JkOiAnJyxcbiAgICAgICAgICBjaGFyc2V0OiAndXRmOCcsXG4gICAgICAgIH0sXG4gICAgICAgIHBvb2w6IHtcbiAgICAgICAgICBtYXg6IDIwLFxuICAgICAgICAgIG1pbjogMCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBvcHRzLnNxbFxuICAgICk7XG4gICAgdGhpc1ska25leF0gPSBrbmV4KG9wdGlvbnMpO1xuICB9XG5cbiAgLypcbiAgICBub3RlIHRoYXQga25leC5qcyBcInRoZW5cIiBmdW5jdGlvbnMgYXJlbid0IGFjdHVhbGx5IHByb21pc2VzIHRoZSB3YXkgeW91IHRoaW5rIHRoZXkgYXJlLlxuICAgIHlvdSBjYW4gcmV0dXJuIGtuZXguaW5zZXJ0KCkuaW50bygpLCB3aGljaCBoYXMgYSB0aGVuKCkgb24gaXQsIGJ1dCB0aGF0IHRoZW5hYmxlIGlzbid0XG4gICAgYW4gYWN0dWFsIHByb21pc2UgeWV0LiBTbyBpbnN0ZWFkIHdlJ3JlIHJldHVybmluZyBQcm9taXNlLnJlc29sdmUodGhlbmFibGUpO1xuICAqL1xuXG4gIHRlYXJkb3duKCkge1xuICAgIHJldHVybiB0aGlzWyRrbmV4XS5kZXN0cm95KCk7XG4gIH1cblxuICBvbkNhY2hlYWJsZVJlYWQoKSB7fVxuXG4gIHdyaXRlKHQsIHYpIHtcbiAgICBjb25zdCBpZCA9IHZbdC4kaWRdO1xuICAgIGNvbnN0IHVwZGF0ZU9iamVjdCA9IHt9O1xuICAgIE9iamVjdC5rZXlzKHQuJGZpZWxkcykuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICBpZiAodltmaWVsZE5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gY29weSBmcm9tIHYgdG8gdGhlIGJlc3Qgb2Ygb3VyIGFiaWxpdHlcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0LiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnYXJyYXknKSB8fFxuICAgICAgICAgICh0LiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnaGFzTWFueScpXG4gICAgICAgICkge1xuICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gdltmaWVsZE5hbWVdLmNvbmNhdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSBPYmplY3QuYXNzaWduKHt9LCB2W2ZpZWxkTmFtZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gdltmaWVsZE5hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKChpZCA9PT0gdW5kZWZpbmVkKSAmJiAodGhpcy50ZXJtaW5hbCkpIHtcbiAgICAgIHJldHVybiB0aGlzWyRrbmV4XSh0LiRuYW1lKS5pbnNlcnQodXBkYXRlT2JqZWN0KS5yZXR1cm5pbmcodC4kaWQpXG4gICAgICAudGhlbigoY3JlYXRlZElkKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWQodCwgY3JlYXRlZElkWzBdKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoaWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXNbJGtuZXhdKHQuJG5hbWUpLndoZXJlKHtbdC4kaWRdOiBpZH0pLnVwZGF0ZSh1cGRhdGVPYmplY3QpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWQodCwgaWQpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBuZXcgY29udGVudCBpbiBhIG5vbi10ZXJtaW5hbCBzdG9yZScpO1xuICAgIH1cbiAgfVxuXG4gIHJlYWQodCwgaWQsIHJlbGF0aW9uc2hpcCkge1xuICAgIGlmIChyZWxhdGlvbnNoaXAgJiYgKHQuJGZpZWxkc1tyZWxhdGlvbnNoaXBdLnR5cGUgPT09ICdoYXNNYW55JykpIHtcbiAgICAgIGNvbnN0IGZpZWxkSW5mbyA9IHQuJGZpZWxkc1tyZWxhdGlvbnNoaXBdO1xuICAgICAgaWYgKGZpZWxkSW5mbyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYFVua25vd24gZmllbGQgJHtyZWxhdGlvbnNoaXB9YCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJGtuZXhdKGZpZWxkSW5mby5yZWxhdGlvbnNoaXApXG4gICAgICAgIC53aGVyZSh7XG4gICAgICAgICAgW2ZpZWxkSW5mby5wYXJlbnRGaWVsZF06IGlkLFxuICAgICAgICB9KS5zZWxlY3QoZmllbGRJbmZvLmNoaWxkRmllbGQpXG4gICAgICAgIC50aGVuKChsKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtbcmVsYXRpb25zaGlwXTogbC5tYXAoKHYpID0+IHZbZmllbGRJbmZvLmNoaWxkRmllbGRdKX07XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpc1ska25leF0odC4kbmFtZSkud2hlcmUoe1t0LiRpZF06IGlkfSkuc2VsZWN0KClcbiAgICAgIC50aGVuKChvKSA9PiBvWzBdIHx8IG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIGRlbGV0ZSh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzWyRrbmV4XSh0LiRuYW1lKS53aGVyZSh7W3QuJGlkXTogaWR9KS5kZWxldGUoKVxuICAgIC50aGVuKChvKSA9PiBvKTtcbiAgfVxuXG4gIGFkZCh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKSB7XG4gICAgY29uc3QgZmllbGRJbmZvID0gdC4kZmllbGRzW3JlbGF0aW9uc2hpcF07XG4gICAgaWYgKGZpZWxkSW5mbyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGBVbmtub3duIGZpZWxkICR7cmVsYXRpb25zaGlwfWApKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXNbJGtuZXhdKGZpZWxkSW5mby5yZWxhdGlvbnNoaXApXG4gICAgICAud2hlcmUoe1xuICAgICAgICBbZmllbGRJbmZvLnBhcmVudEZpZWxkXTogaWQsXG4gICAgICAgIFtmaWVsZEluZm8uY2hpbGRGaWVsZF06IGNoaWxkSWQsXG4gICAgICB9KS5zZWxlY3QoKVxuICAgICAgLnRoZW4oKGwpID0+IHtcbiAgICAgICAgaWYgKGwubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYEl0ZW0gJHtjaGlsZElkfSBhbHJlYWR5IGluICR7cmVsYXRpb25zaGlwfSBvZiAke3QuJG5hbWV9OiR7aWR9YCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzWyRrbmV4XShmaWVsZEluZm8ucmVsYXRpb25zaGlwKVxuICAgICAgICAgIC5pbnNlcnQoe1xuICAgICAgICAgICAgW2ZpZWxkSW5mby5wYXJlbnRGaWVsZF06IGlkLFxuICAgICAgICAgICAgW2ZpZWxkSW5mby5jaGlsZEZpZWxkXTogY2hpbGRJZCxcbiAgICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlYWQodCwgaWQsIHJlbGF0aW9uc2hpcCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZSh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKSB7XG4gICAgY29uc3QgZmllbGRJbmZvID0gdC4kZmllbGRzW3JlbGF0aW9uc2hpcF07XG4gICAgaWYgKGZpZWxkSW5mbyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGBVbmtub3duIGZpZWxkICR7cmVsYXRpb25zaGlwfWApKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXNbJGtuZXhdKGZpZWxkSW5mby5yZWxhdGlvbnNoaXApXG4gICAgICAud2hlcmUoe1xuICAgICAgICBbZmllbGRJbmZvLnBhcmVudEZpZWxkXTogaWQsXG4gICAgICAgIFtmaWVsZEluZm8uY2hpbGRGaWVsZF06IGNoaWxkSWQsXG4gICAgICB9KS5kZWxldGUoKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkKHQsIGlkLCByZWxhdGlvbnNoaXApO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcXVlcnkocSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpc1ska25leF0ucmF3KHEucXVlcnkpKVxuICAgIC50aGVuKChkKSA9PiBkLnJvd3MpO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
