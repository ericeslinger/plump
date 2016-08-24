'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SQLStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _knex = require('knex');

var Knex = _interopRequireWildcard(_knex);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SQLStorage = exports.SQLStorage = function () {
  function SQLStorage() {
    var dbOpts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, SQLStorage);

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
    }, dbOpts);
    this._knex = Knex(options); // eslint-disable-line new-cap
  }

  /*
    note that knex.js "then" functions aren't actually promises the way you think they are.
    you can return knex.insert().into(), which has a then() on it, but that thenable isn't
    an actual promise yet. So instead we're returning Promise.resolve(thenable);
  */

  _createClass(SQLStorage, [{
    key: 'create',
    value: function create(t, v) {
      return Promise.resolve(this._knex.insert(v).into(t));
    }
  }, {
    key: 'read',
    value: function read(t, id) {
      return Promise.resolve(this._knex(t).where({ id: id }).select());
    }
  }, {
    key: 'update',
    value: function update(t, id, v) {
      return Promise.resolve(this._knex(t).where({ id: id }).update(v));
    }
  }, {
    key: 'delete',
    value: function _delete(t, id) {
      return Promise.resolve(this._knex(t).where({ id: id }).delete());
    }
  }, {
    key: 'query',
    value: function query(q) {
      return Promise.resolve(this._knex.raw(q.query)).then(function (d) {
        return d.rows;
      });
    }
  }]);

  return SQLStorage;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3FsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQUFZLE87O0FBQ1o7O0lBQVksSTs7Ozs7O0lBRUMsVSxXQUFBLFU7QUFDWCx3QkFBeUI7QUFBQSxRQUFiLE1BQWEseURBQUosRUFBSTs7QUFBQTs7QUFDdkIsUUFBTSxVQUFVLE9BQU8sTUFBUCxDQUNkLEVBRGMsRUFFZDtBQUNFLGNBQVEsVUFEVjtBQUVFLGFBQU8sS0FGVDtBQUdFLGtCQUFZO0FBQ1YsY0FBTSxVQURJO0FBRVYsY0FBTSxXQUZJO0FBR1YsY0FBTSxJQUhJO0FBSVYsa0JBQVUsRUFKQTtBQUtWLGlCQUFTO0FBTEMsT0FIZDtBQVVFLFlBQU07QUFDSixhQUFLLEVBREQ7QUFFSixhQUFLO0FBRkQ7QUFWUixLQUZjLEVBaUJkLE1BakJjLENBQWhCO0FBbUJBLFNBQUssS0FBTCxHQUFhLEtBQUssT0FBTCxDQUFiLENBcEJ1QixDQW9CSztBQUM3Qjs7QUFFRDs7Ozs7Ozs7MkJBTU8sQyxFQUFHLEMsRUFBRztBQUNYLGFBQU8sUUFBUSxPQUFSLENBQWdCLEtBQUssS0FBTCxDQUFXLE1BQVgsQ0FBa0IsQ0FBbEIsRUFBcUIsSUFBckIsQ0FBMEIsQ0FBMUIsQ0FBaEIsQ0FBUDtBQUNEOzs7eUJBRUksQyxFQUFHLEUsRUFBSTtBQUNWLGFBQU8sUUFBUSxPQUFSLENBQWdCLEtBQUssS0FBTCxDQUFXLENBQVgsRUFBYyxLQUFkLENBQW9CLEVBQUMsSUFBSSxFQUFMLEVBQXBCLEVBQ3RCLE1BRHNCLEVBQWhCLENBQVA7QUFFRDs7OzJCQUVNLEMsRUFBRyxFLEVBQUksQyxFQUFHO0FBQ2YsYUFBTyxRQUFRLE9BQVIsQ0FBZ0IsS0FBSyxLQUFMLENBQVcsQ0FBWCxFQUFjLEtBQWQsQ0FBb0IsRUFBQyxJQUFJLEVBQUwsRUFBcEIsRUFDdEIsTUFEc0IsQ0FDZixDQURlLENBQWhCLENBQVA7QUFFRDs7OzRCQUVNLEMsRUFBRyxFLEVBQUk7QUFDWixhQUFPLFFBQVEsT0FBUixDQUFnQixLQUFLLEtBQUwsQ0FBVyxDQUFYLEVBQWMsS0FBZCxDQUFvQixFQUFDLElBQUksRUFBTCxFQUFwQixFQUN0QixNQURzQixFQUFoQixDQUFQO0FBRUQ7OzswQkFFSyxDLEVBQUc7QUFDUCxhQUFPLFFBQVEsT0FBUixDQUFnQixLQUFLLEtBQUwsQ0FBVyxHQUFYLENBQWUsRUFBRSxLQUFqQixDQUFoQixFQUNOLElBRE0sQ0FDRCxVQUFDLENBQUQ7QUFBQSxlQUFPLEVBQUUsSUFBVDtBQUFBLE9BREMsQ0FBUDtBQUVEIiwiZmlsZSI6InN0b3JhZ2Uvc3FsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgKiBhcyBLbmV4IGZyb20gJ2tuZXgnO1xuXG5leHBvcnQgY2xhc3MgU1FMU3RvcmFnZSB7XG4gIGNvbnN0cnVjdG9yKGRiT3B0cyA9IHt9KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHtcbiAgICAgICAgY2xpZW50OiAncG9zdGdyZXMnLFxuICAgICAgICBkZWJ1ZzogZmFsc2UsXG4gICAgICAgIGNvbm5lY3Rpb246IHtcbiAgICAgICAgICB1c2VyOiAncG9zdGdyZXMnLFxuICAgICAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgICAgIHBvcnQ6IDU0MzIsXG4gICAgICAgICAgcGFzc3dvcmQ6ICcnLFxuICAgICAgICAgIGNoYXJzZXQ6ICd1dGY4JyxcbiAgICAgICAgfSxcbiAgICAgICAgcG9vbDoge1xuICAgICAgICAgIG1heDogMjAsXG4gICAgICAgICAgbWluOiAwLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIGRiT3B0c1xuICAgICk7XG4gICAgdGhpcy5fa25leCA9IEtuZXgob3B0aW9ucyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbmV3LWNhcFxuICB9XG5cbiAgLypcbiAgICBub3RlIHRoYXQga25leC5qcyBcInRoZW5cIiBmdW5jdGlvbnMgYXJlbid0IGFjdHVhbGx5IHByb21pc2VzIHRoZSB3YXkgeW91IHRoaW5rIHRoZXkgYXJlLlxuICAgIHlvdSBjYW4gcmV0dXJuIGtuZXguaW5zZXJ0KCkuaW50bygpLCB3aGljaCBoYXMgYSB0aGVuKCkgb24gaXQsIGJ1dCB0aGF0IHRoZW5hYmxlIGlzbid0XG4gICAgYW4gYWN0dWFsIHByb21pc2UgeWV0LiBTbyBpbnN0ZWFkIHdlJ3JlIHJldHVybmluZyBQcm9taXNlLnJlc29sdmUodGhlbmFibGUpO1xuICAqL1xuXG4gIGNyZWF0ZSh0LCB2KSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9rbmV4Lmluc2VydCh2KS5pbnRvKHQpKTtcbiAgfVxuXG4gIHJlYWQodCwgaWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2tuZXgodCkud2hlcmUoe2lkOiBpZH0pXG4gICAgLnNlbGVjdCgpKTtcbiAgfVxuXG4gIHVwZGF0ZSh0LCBpZCwgdikge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fa25leCh0KS53aGVyZSh7aWQ6IGlkfSlcbiAgICAudXBkYXRlKHYpKTtcbiAgfVxuXG4gIGRlbGV0ZSh0LCBpZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fa25leCh0KS53aGVyZSh7aWQ6IGlkfSlcbiAgICAuZGVsZXRlKCkpO1xuICB9XG5cbiAgcXVlcnkocSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fa25leC5yYXcocS5xdWVyeSkpXG4gICAgLnRoZW4oKGQpID0+IGQucm93cyk7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
