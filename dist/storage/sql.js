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
              v: _this3[$knex](fieldInfo.relationship).where(_defineProperty({}, fieldInfo.parentField, id)).select([fieldInfo.childField].concat(fieldInfo.extras || [])).then(function (l) {
                return _defineProperty({}, relationship, l.map(function (v) {
                  var childData = _defineProperty({}, t.$id, v[fieldInfo.childField]);
                  (fieldInfo.extras || []).forEach(function (extra) {
                    childData[extra] = v[extra];
                  });
                  return childData;
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

      var extras = arguments.length <= 4 || arguments[4] === undefined ? {} : arguments[4];

      var fieldInfo = t.$fields[relationship];
      if (fieldInfo === undefined) {
        return Promise.reject(new Error('Unknown field ' + relationship));
      } else {
        var _ret2 = function () {
          var _newField;

          var newField = (_newField = {}, _defineProperty(_newField, fieldInfo.parentField, id), _defineProperty(_newField, fieldInfo.childField, childId), _newField);
          (fieldInfo.extras || []).forEach(function (extra) {
            newField[extra] = extras[extra];
          });
          return {
            v: _this4[$knex](fieldInfo.relationship).insert(newField).then(function () {
              return _this4.read(t, id, relationship);
            })
          };
        }();

        if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
      }
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(t, id, relationship, childId) {
      var _this5 = this;

      var extras = arguments.length <= 4 || arguments[4] === undefined ? {} : arguments[4];

      var fieldInfo = t.$fields[relationship];
      if (fieldInfo === undefined) {
        return Promise.reject(new Error('Unknown field ' + relationship));
      } else {
        var _ret3 = function () {
          var _this5$$knex$where;

          var newField = {};
          fieldInfo.extras.forEach(function (extra) {
            if (extras[extra] !== undefined) {
              newField[extra] = extras[extra];
            }
          });
          return {
            v: _this5[$knex](fieldInfo.relationship).where((_this5$$knex$where = {}, _defineProperty(_this5$$knex$where, fieldInfo.parentField, id), _defineProperty(_this5$$knex$where, fieldInfo.childField, childId), _this5$$knex$where)).update(newField)
          };
        }();

        if ((typeof _ret3 === 'undefined' ? 'undefined' : _typeof(_ret3)) === "object") return _ret3.v;
      }
    }
  }, {
    key: 'remove',
    value: function remove(t, id, relationship, childId) {
      var _this6 = this;

      var fieldInfo = t.$fields[relationship];
      if (fieldInfo === undefined) {
        return Promise.reject(new Error('Unknown field ' + relationship));
      } else {
        var _$knex$where4;

        return this[$knex](fieldInfo.relationship).where((_$knex$where4 = {}, _defineProperty(_$knex$where4, fieldInfo.parentField, id), _defineProperty(_$knex$where4, fieldInfo.childField, childId), _$knex$where4)).delete().then(function () {
          return _this6.read(t, id, relationship);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3FsLmpzIl0sIm5hbWVzIjpbIlByb21pc2UiLCIka25leCIsIlN5bWJvbCIsIlNRTFN0b3JhZ2UiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsImNsaWVudCIsImRlYnVnIiwiY29ubmVjdGlvbiIsInVzZXIiLCJob3N0IiwicG9ydCIsInBhc3N3b3JkIiwiY2hhcnNldCIsInBvb2wiLCJtYXgiLCJtaW4iLCJzcWwiLCJkZXN0cm95IiwidCIsInYiLCJpZCIsIiRpZCIsInVwZGF0ZU9iamVjdCIsImtleXMiLCIkZmllbGRzIiwiZm9yRWFjaCIsImZpZWxkTmFtZSIsInVuZGVmaW5lZCIsInR5cGUiLCJjb25jYXQiLCJ0ZXJtaW5hbCIsIiRuYW1lIiwiaW5zZXJ0IiwicmV0dXJuaW5nIiwidGhlbiIsImNyZWF0ZWRJZCIsInJlYWQiLCJ3aGVyZSIsInVwZGF0ZSIsIkVycm9yIiwicmVsYXRpb25zaGlwIiwiZmllbGRJbmZvIiwicmVqZWN0IiwicGFyZW50RmllbGQiLCJzZWxlY3QiLCJjaGlsZEZpZWxkIiwiZXh0cmFzIiwibCIsIm1hcCIsImNoaWxkRGF0YSIsImV4dHJhIiwibyIsImRlbGV0ZSIsImNoaWxkSWQiLCJuZXdGaWVsZCIsInEiLCJyZXNvbHZlIiwicmF3IiwicXVlcnkiLCJkIiwicm93cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTs7SUFBWUEsTzs7QUFDWjs7OztBQUNBOzs7Ozs7Ozs7Ozs7OztBQUNBLElBQU1DLFFBQVFDLE9BQU8sT0FBUCxDQUFkOztJQUVhQyxVLFdBQUFBLFU7OztBQUNYLHdCQUF1QjtBQUFBLFFBQVhDLElBQVcseURBQUosRUFBSTs7QUFBQTs7QUFBQSx3SEFDZkEsSUFEZTs7QUFFckIsUUFBTUMsVUFBVUMsT0FBT0MsTUFBUCxDQUNkLEVBRGMsRUFFZDtBQUNFQyxjQUFRLFVBRFY7QUFFRUMsYUFBTyxLQUZUO0FBR0VDLGtCQUFZO0FBQ1ZDLGNBQU0sVUFESTtBQUVWQyxj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aWxlIjoic3RvcmFnZS9zcWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBrbmV4IGZyb20gJ2tuZXgnO1xuaW1wb3J0IHtTdG9yYWdlfSBmcm9tICcuL3N0b3JhZ2UnO1xuY29uc3QgJGtuZXggPSBTeW1ib2woJyRrbmV4Jyk7XG5cbmV4cG9ydCBjbGFzcyBTUUxTdG9yYWdlIGV4dGVuZHMgU3RvcmFnZSB7XG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIHN1cGVyKG9wdHMpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIGNsaWVudDogJ3Bvc3RncmVzJyxcbiAgICAgICAgZGVidWc6IGZhbHNlLFxuICAgICAgICBjb25uZWN0aW9uOiB7XG4gICAgICAgICAgdXNlcjogJ3Bvc3RncmVzJyxcbiAgICAgICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgICAgICBwb3J0OiA1NDMyLFxuICAgICAgICAgIHBhc3N3b3JkOiAnJyxcbiAgICAgICAgICBjaGFyc2V0OiAndXRmOCcsXG4gICAgICAgIH0sXG4gICAgICAgIHBvb2w6IHtcbiAgICAgICAgICBtYXg6IDIwLFxuICAgICAgICAgIG1pbjogMCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBvcHRzLnNxbFxuICAgICk7XG4gICAgdGhpc1ska25leF0gPSBrbmV4KG9wdGlvbnMpO1xuICB9XG5cbiAgLypcbiAgICBub3RlIHRoYXQga25leC5qcyBcInRoZW5cIiBmdW5jdGlvbnMgYXJlbid0IGFjdHVhbGx5IHByb21pc2VzIHRoZSB3YXkgeW91IHRoaW5rIHRoZXkgYXJlLlxuICAgIHlvdSBjYW4gcmV0dXJuIGtuZXguaW5zZXJ0KCkuaW50bygpLCB3aGljaCBoYXMgYSB0aGVuKCkgb24gaXQsIGJ1dCB0aGF0IHRoZW5hYmxlIGlzbid0XG4gICAgYW4gYWN0dWFsIHByb21pc2UgeWV0LiBTbyBpbnN0ZWFkIHdlJ3JlIHJldHVybmluZyBQcm9taXNlLnJlc29sdmUodGhlbmFibGUpO1xuICAqL1xuXG4gIHRlYXJkb3duKCkge1xuICAgIHJldHVybiB0aGlzWyRrbmV4XS5kZXN0cm95KCk7XG4gIH1cblxuICBvbkNhY2hlYWJsZVJlYWQoKSB7fVxuXG4gIHdyaXRlKHQsIHYpIHtcbiAgICBjb25zdCBpZCA9IHZbdC4kaWRdO1xuICAgIGNvbnN0IHVwZGF0ZU9iamVjdCA9IHt9O1xuICAgIE9iamVjdC5rZXlzKHQuJGZpZWxkcykuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICBpZiAodltmaWVsZE5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gY29weSBmcm9tIHYgdG8gdGhlIGJlc3Qgb2Ygb3VyIGFiaWxpdHlcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0LiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnYXJyYXknKSB8fFxuICAgICAgICAgICh0LiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnaGFzTWFueScpXG4gICAgICAgICkge1xuICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gdltmaWVsZE5hbWVdLmNvbmNhdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSBPYmplY3QuYXNzaWduKHt9LCB2W2ZpZWxkTmFtZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gdltmaWVsZE5hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKChpZCA9PT0gdW5kZWZpbmVkKSAmJiAodGhpcy50ZXJtaW5hbCkpIHtcbiAgICAgIHJldHVybiB0aGlzWyRrbmV4XSh0LiRuYW1lKS5pbnNlcnQodXBkYXRlT2JqZWN0KS5yZXR1cm5pbmcodC4kaWQpXG4gICAgICAudGhlbigoY3JlYXRlZElkKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWQodCwgY3JlYXRlZElkWzBdKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoaWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXNbJGtuZXhdKHQuJG5hbWUpLndoZXJlKHtbdC4kaWRdOiBpZH0pLnVwZGF0ZSh1cGRhdGVPYmplY3QpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWQodCwgaWQpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBuZXcgY29udGVudCBpbiBhIG5vbi10ZXJtaW5hbCBzdG9yZScpO1xuICAgIH1cbiAgfVxuXG4gIHJlYWQodCwgaWQsIHJlbGF0aW9uc2hpcCkge1xuICAgIGlmIChyZWxhdGlvbnNoaXAgJiYgKHQuJGZpZWxkc1tyZWxhdGlvbnNoaXBdLnR5cGUgPT09ICdoYXNNYW55JykpIHtcbiAgICAgIGNvbnN0IGZpZWxkSW5mbyA9IHQuJGZpZWxkc1tyZWxhdGlvbnNoaXBdO1xuICAgICAgaWYgKGZpZWxkSW5mbyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYFVua25vd24gZmllbGQgJHtyZWxhdGlvbnNoaXB9YCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJGtuZXhdKGZpZWxkSW5mby5yZWxhdGlvbnNoaXApXG4gICAgICAgIC53aGVyZSh7XG4gICAgICAgICAgW2ZpZWxkSW5mby5wYXJlbnRGaWVsZF06IGlkLFxuICAgICAgICB9KS5zZWxlY3QoW2ZpZWxkSW5mby5jaGlsZEZpZWxkXS5jb25jYXQoZmllbGRJbmZvLmV4dHJhcyB8fCBbXSkpXG4gICAgICAgIC50aGVuKChsKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFtyZWxhdGlvbnNoaXBdOiBsLm1hcCgodikgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBjaGlsZERhdGEgPSB7XG4gICAgICAgICAgICAgICAgW3QuJGlkXTogdltmaWVsZEluZm8uY2hpbGRGaWVsZF0sXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIChmaWVsZEluZm8uZXh0cmFzIHx8IFtdKS5mb3JFYWNoKChleHRyYSkgPT4ge1xuICAgICAgICAgICAgICAgIGNoaWxkRGF0YVtleHRyYV0gPSB2W2V4dHJhXTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBjaGlsZERhdGE7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXNbJGtuZXhdKHQuJG5hbWUpLndoZXJlKHtbdC4kaWRdOiBpZH0pLnNlbGVjdCgpXG4gICAgICAudGhlbigobykgPT4gb1swXSB8fCBudWxsKTtcbiAgICB9XG4gIH1cblxuICBkZWxldGUodCwgaWQpIHtcbiAgICByZXR1cm4gdGhpc1ska25leF0odC4kbmFtZSkud2hlcmUoe1t0LiRpZF06IGlkfSkuZGVsZXRlKClcbiAgICAudGhlbigobykgPT4gbyk7XG4gIH1cblxuICBhZGQodCwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCwgZXh0cmFzID0ge30pIHtcbiAgICBjb25zdCBmaWVsZEluZm8gPSB0LiRmaWVsZHNbcmVsYXRpb25zaGlwXTtcbiAgICBpZiAoZmllbGRJbmZvID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYFVua25vd24gZmllbGQgJHtyZWxhdGlvbnNoaXB9YCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBuZXdGaWVsZCA9IHtcbiAgICAgICAgW2ZpZWxkSW5mby5wYXJlbnRGaWVsZF06IGlkLFxuICAgICAgICBbZmllbGRJbmZvLmNoaWxkRmllbGRdOiBjaGlsZElkLFxuICAgICAgfTtcbiAgICAgIChmaWVsZEluZm8uZXh0cmFzIHx8IFtdKS5mb3JFYWNoKChleHRyYSkgPT4ge1xuICAgICAgICBuZXdGaWVsZFtleHRyYV0gPSBleHRyYXNbZXh0cmFdO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gdGhpc1ska25leF0oZmllbGRJbmZvLnJlbGF0aW9uc2hpcClcbiAgICAgIC5pbnNlcnQobmV3RmllbGQpLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkKHQsIGlkLCByZWxhdGlvbnNoaXApO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKHQsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQsIGV4dHJhcyA9IHt9KSB7XG4gICAgY29uc3QgZmllbGRJbmZvID0gdC4kZmllbGRzW3JlbGF0aW9uc2hpcF07XG4gICAgaWYgKGZpZWxkSW5mbyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGBVbmtub3duIGZpZWxkICR7cmVsYXRpb25zaGlwfWApKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbmV3RmllbGQgPSB7fTtcbiAgICAgIGZpZWxkSW5mby5leHRyYXMuZm9yRWFjaCgoZXh0cmEpID0+IHtcbiAgICAgICAgaWYgKGV4dHJhc1tleHRyYV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIG5ld0ZpZWxkW2V4dHJhXSA9IGV4dHJhc1tleHRyYV07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRoaXNbJGtuZXhdKGZpZWxkSW5mby5yZWxhdGlvbnNoaXApXG4gICAgICAud2hlcmUoe1xuICAgICAgICBbZmllbGRJbmZvLnBhcmVudEZpZWxkXTogaWQsXG4gICAgICAgIFtmaWVsZEluZm8uY2hpbGRGaWVsZF06IGNoaWxkSWQsXG4gICAgICB9KS51cGRhdGUobmV3RmllbGQpO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZSh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKSB7XG4gICAgY29uc3QgZmllbGRJbmZvID0gdC4kZmllbGRzW3JlbGF0aW9uc2hpcF07XG4gICAgaWYgKGZpZWxkSW5mbyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGBVbmtub3duIGZpZWxkICR7cmVsYXRpb25zaGlwfWApKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXNbJGtuZXhdKGZpZWxkSW5mby5yZWxhdGlvbnNoaXApXG4gICAgICAud2hlcmUoe1xuICAgICAgICBbZmllbGRJbmZvLnBhcmVudEZpZWxkXTogaWQsXG4gICAgICAgIFtmaWVsZEluZm8uY2hpbGRGaWVsZF06IGNoaWxkSWQsXG4gICAgICB9KS5kZWxldGUoKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkKHQsIGlkLCByZWxhdGlvbnNoaXApO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcXVlcnkocSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpc1ska25leF0ucmF3KHEucXVlcnkpKVxuICAgIC50aGVuKChkKSA9PiBkLnJvd3MpO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
