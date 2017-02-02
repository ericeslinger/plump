'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SQLStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var Bluebird = _interopRequireWildcard(_bluebird);

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

function deserializeWhere(query, block) {
  var car = block[0];
  var cdr = block.slice(1);
  if (Array.isArray(cdr[0])) {
    return cdr.reduce(function (subQuery, subBlock) {
      return deserializeWhere(subQuery, subBlock);
    }, query);
  } else {
    return query[car].apply(query, cdr);
  }
}

function objectToWhereChain(query, block, context) {
  return Object.keys(block).reduce(function (q, key) {
    if (Array.isArray(block[key])) {
      return deserializeWhere(query, _storage.Storage.massReplace(block[key], context));
    } else {
      return q.where(key, block[key]);
    }
  }, query);
}

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
    an actual promise yet. So instead we're returning Bluebird.resolve(thenable);
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

      return Bluebird.resolve().then(function () {
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
        if (id === undefined && _this2.terminal) {
          return _this2[$knex](t.$name).insert(updateObject).returning(t.$id).then(function (createdId) {
            return _this2.read(t, createdId[0]);
          });
        } else if (id !== undefined) {
          return _this2[$knex](t.$name).where(_defineProperty({}, t.$id, id)).update(updateObject).then(function () {
            return _this2.read(t, id);
          });
        } else {
          throw new Error('Cannot create new content in a non-terminal store');
        }
      }).then(function (result) {
        return _this2.notifyUpdate(t, result[t.$id], result).then(function () {
          return result;
        });
      });
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
    value: function readMany(type, id, relationshipTitle) {
      var _this3 = this;

      var relationshipBlock = type.$fields[relationshipTitle];
      var sideInfo = relationshipBlock.relationship.$sides[relationshipTitle];
      var toSelect = [sideInfo.other.field, sideInfo.self.field];
      if (relationshipBlock.relationship.$extras) {
        toSelect = toSelect.concat(Object.keys(relationshipBlock.relationship.$extras));
      }
      var whereBlock = {};
      if (sideInfo.self.query) {
        whereBlock[sideInfo.self.field] = sideInfo.self.query.logic;
      } else {
        whereBlock[sideInfo.self.field] = id;
      }
      if (relationshipBlock.relationship.$restrict) {
        Object.keys(relationshipBlock.relationship.$restrict).forEach(function (restriction) {
          whereBlock[restriction] = relationshipBlock.relationship.$restrict[restriction].value;
        });
      }
      return Bluebird.resolve().then(function () {
        if (sideInfo.self.query && sideInfo.self.query.requireLoad) {
          return _this3.readOne(type, id);
        } else {
          return { id: id };
        }
      }).then(function (context) {
        return objectToWhereChain(_this3[$knex](relationshipBlock.relationship.$name), whereBlock, context).select(toSelect);
      }).then(function (l) {
        return _defineProperty({}, relationshipTitle, l);
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
    value: function add(type, id, relationshipTitle, childId) {
      var _newField,
          _this4 = this;

      var extras = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

      var relationshipBlock = type.$fields[relationshipTitle];
      var sideInfo = relationshipBlock.relationship.$sides[relationshipTitle];
      var newField = (_newField = {}, _defineProperty(_newField, sideInfo.other.field, childId), _defineProperty(_newField, sideInfo.self.field, id), _newField);
      if (relationshipBlock.relationship.$restrict) {
        Object.keys(relationshipBlock.relationship.$restrict).forEach(function (restriction) {
          newField[restriction] = relationshipBlock.relationship.$restrict[restriction].value;
        });
      }
      if (relationshipBlock.relationship.$extras) {
        Object.keys(relationshipBlock.relationship.$extras).forEach(function (extra) {
          newField[extra] = extras[extra];
        });
      }
      return this[$knex](relationshipBlock.relationship.$name).insert(newField).then(function () {
        return _this4.notifyUpdate(type, id, null, relationshipTitle);
      });
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(type, id, relationshipTitle, childId) {
      var _whereBlock,
          _this5 = this;

      var extras = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

      var relationshipBlock = type.$fields[relationshipTitle];
      var sideInfo = relationshipBlock.relationship.$sides[relationshipTitle];
      var newField = {};
      Object.keys(relationshipBlock.relationship.$extras).forEach(function (extra) {
        if (extras[extra] !== undefined) {
          newField[extra] = extras[extra];
        }
      });
      var whereBlock = (_whereBlock = {}, _defineProperty(_whereBlock, sideInfo.other.field, childId), _defineProperty(_whereBlock, sideInfo.self.field, id), _whereBlock);
      if (relationshipBlock.relationship.$restrict) {
        Object.keys(relationshipBlock.relationship.$restrict).forEach(function (restriction) {
          whereBlock[restriction] = relationshipBlock.relationship.$restrict[restriction].value;
        });
      }
      return objectToWhereChain(this[$knex](relationshipBlock.relationship.$name), whereBlock, { id: id, childId: childId }).update(newField).then(function () {
        return _this5.notifyUpdate(type, id, null, relationshipTitle);
      });
    }
  }, {
    key: 'remove',
    value: function remove(type, id, relationshipTitle, childId) {
      var _whereBlock2,
          _this6 = this;

      var relationshipBlock = type.$fields[relationshipTitle];
      var sideInfo = relationshipBlock.relationship.$sides[relationshipTitle];
      var whereBlock = (_whereBlock2 = {}, _defineProperty(_whereBlock2, sideInfo.other.field, childId), _defineProperty(_whereBlock2, sideInfo.self.field, id), _whereBlock2);
      if (relationshipBlock.relationship.$restrict) {
        Object.keys(relationshipBlock.relationship.$restrict).forEach(function (restriction) {
          whereBlock[restriction] = relationshipBlock.relationship.$restrict[restriction].value;
        });
      }
      return objectToWhereChain(this[$knex](relationshipBlock.relationship.$name), whereBlock).delete().then(function () {
        return _this6.notifyUpdate(type, id, null, relationshipTitle);
      });
    }
  }, {
    key: 'query',
    value: function query(q) {
      return Bluebird.resolve(this[$knex].raw(q.query)).then(function (d) {
        return d.rows;
      });
    }
  }]);

  return SQLStorage;
}(_storage.Storage);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3FsLmpzIl0sIm5hbWVzIjpbIkJsdWViaXJkIiwiJGtuZXgiLCJTeW1ib2wiLCJkZXNlcmlhbGl6ZVdoZXJlIiwicXVlcnkiLCJibG9jayIsImNhciIsImNkciIsInNsaWNlIiwiQXJyYXkiLCJpc0FycmF5IiwicmVkdWNlIiwic3ViUXVlcnkiLCJzdWJCbG9jayIsImFwcGx5Iiwib2JqZWN0VG9XaGVyZUNoYWluIiwiY29udGV4dCIsIk9iamVjdCIsImtleXMiLCJxIiwia2V5IiwibWFzc1JlcGxhY2UiLCJ3aGVyZSIsIlNRTFN0b3JhZ2UiLCJvcHRzIiwib3B0aW9ucyIsImFzc2lnbiIsImNsaWVudCIsImRlYnVnIiwiY29ubmVjdGlvbiIsInVzZXIiLCJob3N0IiwicG9ydCIsInBhc3N3b3JkIiwiY2hhcnNldCIsInBvb2wiLCJtYXgiLCJtaW4iLCJzcWwiLCJkZXN0cm95IiwidCIsInYiLCJyZXNvbHZlIiwidGhlbiIsImlkIiwiJGlkIiwidXBkYXRlT2JqZWN0IiwiJGZpZWxkcyIsImZvckVhY2giLCJmaWVsZE5hbWUiLCJ1bmRlZmluZWQiLCJ0eXBlIiwiY29uY2F0IiwidGVybWluYWwiLCIkbmFtZSIsImluc2VydCIsInJldHVybmluZyIsImNyZWF0ZWRJZCIsInJlYWQiLCJ1cGRhdGUiLCJFcnJvciIsInJlc3VsdCIsIm5vdGlmeVVwZGF0ZSIsInNlbGVjdCIsIm8iLCJyZWxhdGlvbnNoaXBUaXRsZSIsInJlbGF0aW9uc2hpcEJsb2NrIiwic2lkZUluZm8iLCJyZWxhdGlvbnNoaXAiLCIkc2lkZXMiLCJ0b1NlbGVjdCIsIm90aGVyIiwiZmllbGQiLCJzZWxmIiwiJGV4dHJhcyIsIndoZXJlQmxvY2siLCJsb2dpYyIsIiRyZXN0cmljdCIsInJlc3RyaWN0aW9uIiwidmFsdWUiLCJyZXF1aXJlTG9hZCIsInJlYWRPbmUiLCJsIiwiZGVsZXRlIiwiY2hpbGRJZCIsImV4dHJhcyIsIm5ld0ZpZWxkIiwiZXh0cmEiLCJyYXciLCJkIiwi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QVosQ0FBZ0JyRSxFQUFFZixLQUFsQixDQUFqQixFQUNOdUMsSUFETSxDQUNELFVBQUM4QyxDQUFEO0FBQUEsZUFBT0EsRUFBRUMsSUFBVDtBQUFBLE9BREMsQ0FBUDtBQUVEIiwiZmlsZSI6InN0b3JhZ2Uvc3FsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IGtuZXggZnJvbSAna25leCc7XG5pbXBvcnQgeyBTdG9yYWdlIH0gZnJvbSAnLi9zdG9yYWdlJztcbmNvbnN0ICRrbmV4ID0gU3ltYm9sKCcka25leCcpO1xuXG5mdW5jdGlvbiBkZXNlcmlhbGl6ZVdoZXJlKHF1ZXJ5LCBibG9jaykge1xuICBjb25zdCBjYXIgPSBibG9ja1swXTtcbiAgY29uc3QgY2RyID0gYmxvY2suc2xpY2UoMSk7XG4gIGlmIChBcnJheS5pc0FycmF5KGNkclswXSkpIHtcbiAgICByZXR1cm4gY2RyLnJlZHVjZSgoc3ViUXVlcnksIHN1YkJsb2NrKSA9PiBkZXNlcmlhbGl6ZVdoZXJlKHN1YlF1ZXJ5LCBzdWJCbG9jayksIHF1ZXJ5KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcXVlcnlbY2FyXS5hcHBseShxdWVyeSwgY2RyKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBvYmplY3RUb1doZXJlQ2hhaW4ocXVlcnksIGJsb2NrLCBjb250ZXh0KSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhibG9jaykucmVkdWNlKChxLCBrZXkpID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShibG9ja1trZXldKSkge1xuICAgICAgcmV0dXJuIGRlc2VyaWFsaXplV2hlcmUocXVlcnksIFN0b3JhZ2UubWFzc1JlcGxhY2UoYmxvY2tba2V5XSwgY29udGV4dCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcS53aGVyZShrZXksIGJsb2NrW2tleV0pO1xuICAgIH1cbiAgfSwgcXVlcnkpO1xufVxuXG5cbmV4cG9ydCBjbGFzcyBTUUxTdG9yYWdlIGV4dGVuZHMgU3RvcmFnZSB7XG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIHN1cGVyKG9wdHMpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIGNsaWVudDogJ3Bvc3RncmVzJyxcbiAgICAgICAgZGVidWc6IGZhbHNlLFxuICAgICAgICBjb25uZWN0aW9uOiB7XG4gICAgICAgICAgdXNlcjogJ3Bvc3RncmVzJyxcbiAgICAgICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgICAgICBwb3J0OiA1NDMyLFxuICAgICAgICAgIHBhc3N3b3JkOiAnJyxcbiAgICAgICAgICBjaGFyc2V0OiAndXRmOCcsXG4gICAgICAgIH0sXG4gICAgICAgIHBvb2w6IHtcbiAgICAgICAgICBtYXg6IDIwLFxuICAgICAgICAgIG1pbjogMCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBvcHRzLnNxbFxuICAgICk7XG4gICAgdGhpc1ska25leF0gPSBrbmV4KG9wdGlvbnMpO1xuICB9XG5cbiAgLypcbiAgICBub3RlIHRoYXQga25leC5qcyBcInRoZW5cIiBmdW5jdGlvbnMgYXJlbid0IGFjdHVhbGx5IHByb21pc2VzIHRoZSB3YXkgeW91IHRoaW5rIHRoZXkgYXJlLlxuICAgIHlvdSBjYW4gcmV0dXJuIGtuZXguaW5zZXJ0KCkuaW50bygpLCB3aGljaCBoYXMgYSB0aGVuKCkgb24gaXQsIGJ1dCB0aGF0IHRoZW5hYmxlIGlzbid0XG4gICAgYW4gYWN0dWFsIHByb21pc2UgeWV0LiBTbyBpbnN0ZWFkIHdlJ3JlIHJldHVybmluZyBCbHVlYmlyZC5yZXNvbHZlKHRoZW5hYmxlKTtcbiAgKi9cblxuICB0ZWFyZG93bigpIHtcbiAgICByZXR1cm4gdGhpc1ska25leF0uZGVzdHJveSgpO1xuICB9XG5cbiAgd3JpdGUodCwgdikge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCBpZCA9IHZbdC4kaWRdO1xuICAgICAgY29uc3QgdXBkYXRlT2JqZWN0ID0ge307XG4gICAgICBPYmplY3Qua2V5cyh0LiRmaWVsZHMpLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgICBpZiAodltmaWVsZE5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAvLyBjb3B5IGZyb20gdiB0byB0aGUgYmVzdCBvZiBvdXIgYWJpbGl0eVxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICh0LiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnYXJyYXknKSB8fFxuICAgICAgICAgICAgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdoYXNNYW55JylcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gdltmaWVsZE5hbWVdLmNvbmNhdCgpO1xuICAgICAgICAgIH0gZWxzZSBpZiAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgdltmaWVsZE5hbWVdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSB2W2ZpZWxkTmFtZV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGlmICgoaWQgPT09IHVuZGVmaW5lZCkgJiYgKHRoaXMudGVybWluYWwpKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyRrbmV4XSh0LiRuYW1lKS5pbnNlcnQodXBkYXRlT2JqZWN0KS5yZXR1cm5pbmcodC4kaWQpXG4gICAgICAgIC50aGVuKChjcmVhdGVkSWQpID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yZWFkKHQsIGNyZWF0ZWRJZFswXSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmIChpZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyRrbmV4XSh0LiRuYW1lKS53aGVyZSh7IFt0LiRpZF06IGlkIH0pLnVwZGF0ZSh1cGRhdGVPYmplY3QpXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yZWFkKHQsIGlkKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgbmV3IGNvbnRlbnQgaW4gYSBub24tdGVybWluYWwgc3RvcmUnKTtcbiAgICAgIH1cbiAgICB9KS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgIHJldHVybiB0aGlzLm5vdGlmeVVwZGF0ZSh0LCByZXN1bHRbdC4kaWRdLCByZXN1bHQpLnRoZW4oKCkgPT4gcmVzdWx0KTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlYWRPbmUodCwgaWQpIHtcbiAgICByZXR1cm4gdGhpc1ska25leF0odC4kbmFtZSkud2hlcmUoeyBbdC4kaWRdOiBpZCB9KS5zZWxlY3QoKVxuICAgIC50aGVuKChvKSA9PiBvWzBdIHx8IG51bGwpO1xuICB9XG5cbiAgcmVhZE1hbnkodHlwZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlKSB7XG4gICAgY29uc3QgcmVsYXRpb25zaGlwQmxvY2sgPSB0eXBlLiRmaWVsZHNbcmVsYXRpb25zaGlwVGl0bGVdO1xuICAgIGNvbnN0IHNpZGVJbmZvID0gcmVsYXRpb25zaGlwQmxvY2sucmVsYXRpb25zaGlwLiRzaWRlc1tyZWxhdGlvbnNoaXBUaXRsZV07XG4gICAgbGV0IHRvU2VsZWN0ID0gW3NpZGVJbmZvLm90aGVyLmZpZWxkLCBzaWRlSW5mby5zZWxmLmZpZWxkXTtcbiAgICBpZiAocmVsYXRpb25zaGlwQmxvY2sucmVsYXRpb25zaGlwLiRleHRyYXMpIHtcbiAgICAgIHRvU2VsZWN0ID0gdG9TZWxlY3QuY29uY2F0KE9iamVjdC5rZXlzKHJlbGF0aW9uc2hpcEJsb2NrLnJlbGF0aW9uc2hpcC4kZXh0cmFzKSk7XG4gICAgfVxuICAgIGNvbnN0IHdoZXJlQmxvY2sgPSB7fTtcbiAgICBpZiAoc2lkZUluZm8uc2VsZi5xdWVyeSkge1xuICAgICAgd2hlcmVCbG9ja1tzaWRlSW5mby5zZWxmLmZpZWxkXSA9IHNpZGVJbmZvLnNlbGYucXVlcnkubG9naWM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdoZXJlQmxvY2tbc2lkZUluZm8uc2VsZi5maWVsZF0gPSBpZDtcbiAgICB9XG4gICAgaWYgKHJlbGF0aW9uc2hpcEJsb2NrLnJlbGF0aW9uc2hpcC4kcmVzdHJpY3QpIHtcbiAgICAgIE9iamVjdC5rZXlzKHJlbGF0aW9uc2hpcEJsb2NrLnJlbGF0aW9uc2hpcC4kcmVzdHJpY3QpLmZvckVhY2goKHJlc3RyaWN0aW9uKSA9PiB7XG4gICAgICAgIHdoZXJlQmxvY2tbcmVzdHJpY3Rpb25dID0gcmVsYXRpb25zaGlwQmxvY2sucmVsYXRpb25zaGlwLiRyZXN0cmljdFtyZXN0cmljdGlvbl0udmFsdWU7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmIChzaWRlSW5mby5zZWxmLnF1ZXJ5ICYmIHNpZGVJbmZvLnNlbGYucXVlcnkucmVxdWlyZUxvYWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZE9uZSh0eXBlLCBpZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4geyBpZCB9O1xuICAgICAgfVxuICAgIH0pXG4gICAgLnRoZW4oKGNvbnRleHQpID0+IHtcbiAgICAgIHJldHVybiBvYmplY3RUb1doZXJlQ2hhaW4odGhpc1ska25leF0ocmVsYXRpb25zaGlwQmxvY2sucmVsYXRpb25zaGlwLiRuYW1lKSwgd2hlcmVCbG9jaywgY29udGV4dClcbiAgICAgIC5zZWxlY3QodG9TZWxlY3QpO1xuICAgIH0pXG4gICAgLnRoZW4oKGwpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIFtyZWxhdGlvbnNoaXBUaXRsZV06IGwsXG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgZGVsZXRlKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXNbJGtuZXhdKHQuJG5hbWUpLndoZXJlKHsgW3QuJGlkXTogaWQgfSkuZGVsZXRlKClcbiAgICAudGhlbigobykgPT4gbyk7XG4gIH1cblxuICBhZGQodHlwZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlLCBjaGlsZElkLCBleHRyYXMgPSB7fSkge1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcEJsb2NrID0gdHlwZS4kZmllbGRzW3JlbGF0aW9uc2hpcFRpdGxlXTtcbiAgICBjb25zdCBzaWRlSW5mbyA9IHJlbGF0aW9uc2hpcEJsb2NrLnJlbGF0aW9uc2hpcC4kc2lkZXNbcmVsYXRpb25zaGlwVGl0bGVdO1xuICAgIGNvbnN0IG5ld0ZpZWxkID0ge1xuICAgICAgW3NpZGVJbmZvLm90aGVyLmZpZWxkXTogY2hpbGRJZCxcbiAgICAgIFtzaWRlSW5mby5zZWxmLmZpZWxkXTogaWQsXG4gICAgfTtcbiAgICBpZiAocmVsYXRpb25zaGlwQmxvY2sucmVsYXRpb25zaGlwLiRyZXN0cmljdCkge1xuICAgICAgT2JqZWN0LmtleXMocmVsYXRpb25zaGlwQmxvY2sucmVsYXRpb25zaGlwLiRyZXN0cmljdCkuZm9yRWFjaCgocmVzdHJpY3Rpb24pID0+IHtcbiAgICAgICAgbmV3RmllbGRbcmVzdHJpY3Rpb25dID0gcmVsYXRpb25zaGlwQmxvY2sucmVsYXRpb25zaGlwLiRyZXN0cmljdFtyZXN0cmljdGlvbl0udmFsdWU7XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKHJlbGF0aW9uc2hpcEJsb2NrLnJlbGF0aW9uc2hpcC4kZXh0cmFzKSB7XG4gICAgICBPYmplY3Qua2V5cyhyZWxhdGlvbnNoaXBCbG9jay5yZWxhdGlvbnNoaXAuJGV4dHJhcykuZm9yRWFjaCgoZXh0cmEpID0+IHtcbiAgICAgICAgbmV3RmllbGRbZXh0cmFdID0gZXh0cmFzW2V4dHJhXTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpc1ska25leF0ocmVsYXRpb25zaGlwQmxvY2sucmVsYXRpb25zaGlwLiRuYW1lKVxuICAgIC5pbnNlcnQobmV3RmllbGQpXG4gICAgLnRoZW4oKCkgPT4gdGhpcy5ub3RpZnlVcGRhdGUodHlwZSwgaWQsIG51bGwsIHJlbGF0aW9uc2hpcFRpdGxlKSk7XG4gIH1cblxuICBtb2RpZnlSZWxhdGlvbnNoaXAodHlwZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlLCBjaGlsZElkLCBleHRyYXMgPSB7fSkge1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcEJsb2NrID0gdHlwZS4kZmllbGRzW3JlbGF0aW9uc2hpcFRpdGxlXTtcbiAgICBjb25zdCBzaWRlSW5mbyA9IHJlbGF0aW9uc2hpcEJsb2NrLnJlbGF0aW9uc2hpcC4kc2lkZXNbcmVsYXRpb25zaGlwVGl0bGVdO1xuICAgIGNvbnN0IG5ld0ZpZWxkID0ge307XG4gICAgT2JqZWN0LmtleXMocmVsYXRpb25zaGlwQmxvY2sucmVsYXRpb25zaGlwLiRleHRyYXMpLmZvckVhY2goKGV4dHJhKSA9PiB7XG4gICAgICBpZiAoZXh0cmFzW2V4dHJhXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG5ld0ZpZWxkW2V4dHJhXSA9IGV4dHJhc1tleHRyYV07XG4gICAgICB9XG4gICAgfSk7XG4gICAgY29uc3Qgd2hlcmVCbG9jayA9IHtcbiAgICAgIFtzaWRlSW5mby5vdGhlci5maWVsZF06IGNoaWxkSWQsXG4gICAgICBbc2lkZUluZm8uc2VsZi5maWVsZF06IGlkLFxuICAgIH07XG4gICAgaWYgKHJlbGF0aW9uc2hpcEJsb2NrLnJlbGF0aW9uc2hpcC4kcmVzdHJpY3QpIHtcbiAgICAgIE9iamVjdC5rZXlzKHJlbGF0aW9uc2hpcEJsb2NrLnJlbGF0aW9uc2hpcC4kcmVzdHJpY3QpLmZvckVhY2goKHJlc3RyaWN0aW9uKSA9PiB7XG4gICAgICAgIHdoZXJlQmxvY2tbcmVzdHJpY3Rpb25dID0gcmVsYXRpb25zaGlwQmxvY2sucmVsYXRpb25zaGlwLiRyZXN0cmljdFtyZXN0cmljdGlvbl0udmFsdWU7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdFRvV2hlcmVDaGFpbih0aGlzWyRrbmV4XShyZWxhdGlvbnNoaXBCbG9jay5yZWxhdGlvbnNoaXAuJG5hbWUpLCB3aGVyZUJsb2NrLCB7IGlkLCBjaGlsZElkIH0pXG4gICAgLnVwZGF0ZShuZXdGaWVsZClcbiAgICAudGhlbigoKSA9PiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBpZCwgbnVsbCwgcmVsYXRpb25zaGlwVGl0bGUpKTtcbiAgfVxuXG4gIHJlbW92ZSh0eXBlLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUsIGNoaWxkSWQpIHtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBCbG9jayA9IHR5cGUuJGZpZWxkc1tyZWxhdGlvbnNoaXBUaXRsZV07XG4gICAgY29uc3Qgc2lkZUluZm8gPSByZWxhdGlvbnNoaXBCbG9jay5yZWxhdGlvbnNoaXAuJHNpZGVzW3JlbGF0aW9uc2hpcFRpdGxlXTtcbiAgICBjb25zdCB3aGVyZUJsb2NrID0ge1xuICAgICAgW3NpZGVJbmZvLm90aGVyLmZpZWxkXTogY2hpbGRJZCxcbiAgICAgIFtzaWRlSW5mby5zZWxmLmZpZWxkXTogaWQsXG4gICAgfTtcbiAgICBpZiAocmVsYXRpb25zaGlwQmxvY2sucmVsYXRpb25zaGlwLiRyZXN0cmljdCkge1xuICAgICAgT2JqZWN0LmtleXMocmVsYXRpb25zaGlwQmxvY2sucmVsYXRpb25zaGlwLiRyZXN0cmljdCkuZm9yRWFjaCgocmVzdHJpY3Rpb24pID0+IHtcbiAgICAgICAgd2hlcmVCbG9ja1tyZXN0cmljdGlvbl0gPSByZWxhdGlvbnNoaXBCbG9jay5yZWxhdGlvbnNoaXAuJHJlc3RyaWN0W3Jlc3RyaWN0aW9uXS52YWx1ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0VG9XaGVyZUNoYWluKHRoaXNbJGtuZXhdKHJlbGF0aW9uc2hpcEJsb2NrLnJlbGF0aW9uc2hpcC4kbmFtZSksIHdoZXJlQmxvY2spLmRlbGV0ZSgpXG4gICAgLnRoZW4oKCkgPT4gdGhpcy5ub3RpZnlVcGRhdGUodHlwZSwgaWQsIG51bGwsIHJlbGF0aW9uc2hpcFRpdGxlKSk7XG4gIH1cblxuICBxdWVyeShxKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUodGhpc1ska25leF0ucmF3KHEucXVlcnkpKVxuICAgIC50aGVuKChkKSA9PiBkLnJvd3MpO1xuICB9XG59XG4iXX0=
