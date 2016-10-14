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
    key: 'readOne',
    value: function readOne(t, id) {
      return this[$knex](t.$name).where(_defineProperty({}, t.$id, id)).select().then(function (o) {
        return o[0] || null;
      });
    }
  }, {
    key: 'readMany',
    value: function readMany(t, id, relationship) {
      var Rel = t.$fields[relationship].relationship;
      return this[$knex](Rel.$name).where(_defineProperty({}, Rel.otherType(relationship).field, id)).select().then(function (l) {
        return _defineProperty({}, relationship, l);
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
      var _newField,
          _this3 = this;

      var extras = arguments.length <= 4 || arguments[4] === undefined ? {} : arguments[4];

      var Rel = t.$fields[relationship].relationship;
      var newField = (_newField = {}, _defineProperty(_newField, Rel.$sides[relationship].field, childId), _defineProperty(_newField, Rel.otherType(relationship).field, id), _newField);
      (Rel.$extras || []).forEach(function (extra) {
        newField[extra] = extras[extra];
      });
      return this[$knex](Rel.$name).insert(newField).then(function () {
        return _this3.readMany(t, id, relationship);
      });
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(t, id, relationship, childId) {
      var _$knex$where5;

      var extras = arguments.length <= 4 || arguments[4] === undefined ? {} : arguments[4];

      var Rel = t.$fields[relationship].relationship;
      var newField = {};
      Rel.$extras.forEach(function (extra) {
        if (extras[extra] !== undefined) {
          newField[extra] = extras[extra];
        }
      });
      return this[$knex](Rel.$name).where((_$knex$where5 = {}, _defineProperty(_$knex$where5, Rel.$sides[relationship].field, childId), _defineProperty(_$knex$where5, Rel.otherType(relationship).field, id), _$knex$where5)).update(newField);
    }
  }, {
    key: 'remove',
    value: function remove(t, id, relationship, childId) {
      var _$knex$where6,
          _this4 = this;

      var Rel = t.$fields[relationship].relationship;
      return this[$knex](Rel.$name).where((_$knex$where6 = {}, _defineProperty(_$knex$where6, Rel.$sides[relationship].field, childId), _defineProperty(_$knex$where6, Rel.otherType(relationship).field, id), _$knex$where6)).delete().then(function () {
        return _this4.readMany(t, id, relationship);
      });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3FsLmpzIl0sIm5hbWVzIjpbIlByb21pc2UiLCIka25leCIsIlN5bWJvbCIsIlNRTFN0b3JhZ2UiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsImNsaWVudCIsImRlYnVnIiwiY29ubmVjdGlvbiIsInVzZXIiLCJob3N0IiwicG9ydCIsInBhc3N3b3JkIiwiY2hhcnNldCIsInBvb2wiLCJtYXgiLCJtaW4iLCJzcWwiLCJkZXN0cm95IiwidCIsInYiLCJpZCIsIiRpZCIsInVwZGF0ZU9iamVjdCIsImtleXMiLCIkZmllbGRzIiwiZm9yRWFjaCIsImZpZWxkTmFtZSIsInVuZGVmaW5lZCIsInR5cGUiLCJjb25jYXQiLCJ0ZXJtaW5hbCIsIiRuYW1lIiwiaW5zZXJ0IiwicmV0dXJuaW5nIiwidGhlbiIsImNyZWF0ZWRJZCIsInJlYWQiLCJ3aGVyZSIsInVwZGF0ZSIsIkVycm9yIiwic2VsZWN0IiwibyIsInJlbGF0aW9uc2hpcCIsIlJlbCIsIm90aGVyVHlwZSIsImZpZWxkIiwibCIsImRlbGV0ZSIsImNoaWxkSWQiLCJleHRyYXMiLCJuZXdGaWVsZCIsIiRzaWRlcyIsIiRleHRyYXMiLCJleHRyYSIsInJlYWRNYW55IiwicSIsInJlc29sdmUiLCJyYXciLCJxdWVyeSIsImQiLCJyb3dzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7SUFBWUEsTzs7QUFDWjs7OztBQUNBOzs7Ozs7Ozs7Ozs7OztBQUNBLElBQU1DLFFBQVFDLE9BQU8sT0FBUCxDQUFkOztJQUVhQyxVLFdBQUFBLFU7OztBQUNYLHdCQUF1QjtBQUFBLFFBQVhDLElBQVcseURBQUosRUFBSTs7QUFBQTs7QUFBQSx3SEFDZkEsSUFEZTs7QUFFckIsUUFBTUMsVUFBVUMsT0FBT0MsTUFBUCxDQUNkLEVBRGMsRUFFZDtBQUNFQyxjQUFRLFVBRFY7QUFFRUMsYUFBTyxLQUZUO0FBR0VDLGtCQUFZO0FBQ1ZDLGNBQU0sVUFESTtBQUVWQyxjQUFNLFdBRkk7QUFH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MkQsT0FBUixDQUFnQixLQUFLMUQsS0FBTCxFQUFZMkQsR0FBWixDQUFnQkYsRUFBRUcsS0FBbEIsQ0FBaEIsRUFDTnhCLElBRE0sQ0FDRCxVQUFDeUIsQ0FBRDtBQUFBLGVBQU9BLEVBQUVDLElBQVQ7QUFBQSxPQURDLENBQVA7QUFFRCIsImZpbGUiOiJzdG9yYWdlL3NxbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IGtuZXggZnJvbSAna25leCc7XG5pbXBvcnQge1N0b3JhZ2V9IGZyb20gJy4vc3RvcmFnZSc7XG5jb25zdCAka25leCA9IFN5bWJvbCgnJGtuZXgnKTtcblxuZXhwb3J0IGNsYXNzIFNRTFN0b3JhZ2UgZXh0ZW5kcyBTdG9yYWdlIHtcbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgc3VwZXIob3B0cyk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHtcbiAgICAgICAgY2xpZW50OiAncG9zdGdyZXMnLFxuICAgICAgICBkZWJ1ZzogZmFsc2UsXG4gICAgICAgIGNvbm5lY3Rpb246IHtcbiAgICAgICAgICB1c2VyOiAncG9zdGdyZXMnLFxuICAgICAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgICAgIHBvcnQ6IDU0MzIsXG4gICAgICAgICAgcGFzc3dvcmQ6ICcnLFxuICAgICAgICAgIGNoYXJzZXQ6ICd1dGY4JyxcbiAgICAgICAgfSxcbiAgICAgICAgcG9vbDoge1xuICAgICAgICAgIG1heDogMjAsXG4gICAgICAgICAgbWluOiAwLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIG9wdHMuc3FsXG4gICAgKTtcbiAgICB0aGlzWyRrbmV4XSA9IGtuZXgob3B0aW9ucyk7XG4gIH1cblxuICAvKlxuICAgIG5vdGUgdGhhdCBrbmV4LmpzIFwidGhlblwiIGZ1bmN0aW9ucyBhcmVuJ3QgYWN0dWFsbHkgcHJvbWlzZXMgdGhlIHdheSB5b3UgdGhpbmsgdGhleSBhcmUuXG4gICAgeW91IGNhbiByZXR1cm4ga25leC5pbnNlcnQoKS5pbnRvKCksIHdoaWNoIGhhcyBhIHRoZW4oKSBvbiBpdCwgYnV0IHRoYXQgdGhlbmFibGUgaXNuJ3RcbiAgICBhbiBhY3R1YWwgcHJvbWlzZSB5ZXQuIFNvIGluc3RlYWQgd2UncmUgcmV0dXJuaW5nIFByb21pc2UucmVzb2x2ZSh0aGVuYWJsZSk7XG4gICovXG5cbiAgdGVhcmRvd24oKSB7XG4gICAgcmV0dXJuIHRoaXNbJGtuZXhdLmRlc3Ryb3koKTtcbiAgfVxuXG4gIG9uQ2FjaGVhYmxlUmVhZCgpIHt9XG5cbiAgd3JpdGUodCwgdikge1xuICAgIGNvbnN0IGlkID0gdlt0LiRpZF07XG4gICAgY29uc3QgdXBkYXRlT2JqZWN0ID0ge307XG4gICAgT2JqZWN0LmtleXModC4kZmllbGRzKS5mb3JFYWNoKChmaWVsZE5hbWUpID0+IHtcbiAgICAgIGlmICh2W2ZpZWxkTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBjb3B5IGZyb20gdiB0byB0aGUgYmVzdCBvZiBvdXIgYWJpbGl0eVxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdhcnJheScpIHx8XG4gICAgICAgICAgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdoYXNNYW55JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSB2W2ZpZWxkTmFtZV0uY29uY2F0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IE9iamVjdC5hc3NpZ24oe30sIHZbZmllbGROYW1lXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSB2W2ZpZWxkTmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoKGlkID09PSB1bmRlZmluZWQpICYmICh0aGlzLnRlcm1pbmFsKSkge1xuICAgICAgcmV0dXJuIHRoaXNbJGtuZXhdKHQuJG5hbWUpLmluc2VydCh1cGRhdGVPYmplY3QpLnJldHVybmluZyh0LiRpZClcbiAgICAgIC50aGVuKChjcmVhdGVkSWQpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZCh0LCBjcmVhdGVkSWRbMF0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChpZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpc1ska25leF0odC4kbmFtZSkud2hlcmUoe1t0LiRpZF06IGlkfSkudXBkYXRlKHVwZGF0ZU9iamVjdClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZCh0LCBpZCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIG5ldyBjb250ZW50IGluIGEgbm9uLXRlcm1pbmFsIHN0b3JlJyk7XG4gICAgfVxuICB9XG5cbiAgcmVhZE9uZSh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzWyRrbmV4XSh0LiRuYW1lKS53aGVyZSh7W3QuJGlkXTogaWR9KS5zZWxlY3QoKVxuICAgIC50aGVuKChvKSA9PiBvWzBdIHx8IG51bGwpO1xuICB9XG5cbiAgcmVhZE1hbnkodCwgaWQsIHJlbGF0aW9uc2hpcCkge1xuICAgIGNvbnN0IFJlbCA9IHQuJGZpZWxkc1tyZWxhdGlvbnNoaXBdLnJlbGF0aW9uc2hpcDtcbiAgICByZXR1cm4gdGhpc1ska25leF0oUmVsLiRuYW1lKVxuICAgIC53aGVyZSh7XG4gICAgICBbUmVsLm90aGVyVHlwZShyZWxhdGlvbnNoaXApLmZpZWxkXTogaWQsXG4gICAgfSkuc2VsZWN0KClcbiAgICAudGhlbigobCkgPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgW3JlbGF0aW9uc2hpcF06IGwsXG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgZGVsZXRlKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXNbJGtuZXhdKHQuJG5hbWUpLndoZXJlKHtbdC4kaWRdOiBpZH0pLmRlbGV0ZSgpXG4gICAgLnRoZW4oKG8pID0+IG8pO1xuICB9XG5cbiAgYWRkKHQsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQsIGV4dHJhcyA9IHt9KSB7XG4gICAgY29uc3QgUmVsID0gdC4kZmllbGRzW3JlbGF0aW9uc2hpcF0ucmVsYXRpb25zaGlwO1xuICAgIGNvbnN0IG5ld0ZpZWxkID0ge1xuICAgICAgW1JlbC4kc2lkZXNbcmVsYXRpb25zaGlwXS5maWVsZF06IGNoaWxkSWQsXG4gICAgICBbUmVsLm90aGVyVHlwZShyZWxhdGlvbnNoaXApLmZpZWxkXTogaWQsXG4gICAgfTtcbiAgICAoUmVsLiRleHRyYXMgfHwgW10pLmZvckVhY2goKGV4dHJhKSA9PiB7XG4gICAgICBuZXdGaWVsZFtleHRyYV0gPSBleHRyYXNbZXh0cmFdO1xuICAgIH0pO1xuICAgIHJldHVybiB0aGlzWyRrbmV4XShSZWwuJG5hbWUpXG4gICAgLmluc2VydChuZXdGaWVsZCkudGhlbigoKSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5yZWFkTWFueSh0LCBpZCwgcmVsYXRpb25zaGlwKTtcbiAgICB9KTtcbiAgfVxuXG4gIG1vZGlmeVJlbGF0aW9uc2hpcCh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkLCBleHRyYXMgPSB7fSkge1xuICAgIGNvbnN0IFJlbCA9IHQuJGZpZWxkc1tyZWxhdGlvbnNoaXBdLnJlbGF0aW9uc2hpcDtcbiAgICBjb25zdCBuZXdGaWVsZCA9IHt9O1xuICAgIFJlbC4kZXh0cmFzLmZvckVhY2goKGV4dHJhKSA9PiB7XG4gICAgICBpZiAoZXh0cmFzW2V4dHJhXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG5ld0ZpZWxkW2V4dHJhXSA9IGV4dHJhc1tleHRyYV07XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXNbJGtuZXhdKFJlbC4kbmFtZSlcbiAgICAud2hlcmUoe1xuICAgICAgW1JlbC4kc2lkZXNbcmVsYXRpb25zaGlwXS5maWVsZF06IGNoaWxkSWQsXG4gICAgICBbUmVsLm90aGVyVHlwZShyZWxhdGlvbnNoaXApLmZpZWxkXTogaWQsXG4gICAgfSkudXBkYXRlKG5ld0ZpZWxkKTtcbiAgfVxuXG4gIHJlbW92ZSh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKSB7XG4gICAgY29uc3QgUmVsID0gdC4kZmllbGRzW3JlbGF0aW9uc2hpcF0ucmVsYXRpb25zaGlwO1xuICAgIHJldHVybiB0aGlzWyRrbmV4XShSZWwuJG5hbWUpXG4gICAgLndoZXJlKHtcbiAgICAgIFtSZWwuJHNpZGVzW3JlbGF0aW9uc2hpcF0uZmllbGRdOiBjaGlsZElkLFxuICAgICAgW1JlbC5vdGhlclR5cGUocmVsYXRpb25zaGlwKS5maWVsZF06IGlkLFxuICAgIH0pLmRlbGV0ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMucmVhZE1hbnkodCwgaWQsIHJlbGF0aW9uc2hpcCk7XG4gICAgfSk7XG4gIH1cblxuICBxdWVyeShxKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzWyRrbmV4XS5yYXcocS5xdWVyeSkpXG4gICAgLnRoZW4oKGQpID0+IGQucm93cyk7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
