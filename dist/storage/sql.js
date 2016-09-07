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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var $knex = Symbol('$knex');

var SQLStorage = exports.SQLStorage = function (_Storage) {
  _inherits(SQLStorage, _Storage);

  function SQLStorage() {
    var dbOpts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, SQLStorage);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(SQLStorage).call(this));

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
    key: 'create',
    value: function create(t, v) {
      return Promise.resolve(this[$knex].insert(v).into(t));
    }
  }, {
    key: 'read',
    value: function read(t, id) {
      return Promise.resolve(this[$knex](t).where({ id: id }).select());
    }
  }, {
    key: 'update',
    value: function update(t, id, v) {
      return Promise.resolve(this[$knex](t).where({ id: id }).update(v));
    }
  }, {
    key: 'delete',
    value: function _delete(t, id) {
      return Promise.resolve(this[$knex](t).where({ id: id }).delete());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3FsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQUFZLE87O0FBQ1o7Ozs7QUFDQTs7Ozs7Ozs7Ozs7O0FBQ0EsSUFBTSxRQUFRLE9BQU8sT0FBUCxDQUFkOztJQUVhLFUsV0FBQSxVOzs7QUFDWCx3QkFBeUI7QUFBQSxRQUFiLE1BQWEseURBQUosRUFBSTs7QUFBQTs7QUFBQTs7QUFFdkIsUUFBTSxVQUFVLE9BQU8sTUFBUCxDQUNkLEVBRGMsRUFFZDtBQUNFLGNBQVEsVUFEVjtBQUVFLGFBQU8sS0FGVDtBQUdFLGtCQUFZO0FBQ1YsY0FBTSxVQURJO0FBRVYsY0FBTSxXQUZJO0FBR1YsY0FBTSxJQUhJO0FBSVYsa0JBQVUsRUFKQTtBQUtWLGlCQUFTO0FBTEMsT0FIZDtBQVVFLFlBQU07QUFDSixhQUFLLEVBREQ7QUFFSixhQUFLO0FBRkQ7QUFWUixLQUZjLEVBaUJkLE1BakJjLENBQWhCO0FBbUJBLFVBQUssS0FBTCxJQUFjLG9CQUFLLE9BQUwsQ0FBZDtBQXJCdUI7QUFzQnhCOztBQUVEOzs7Ozs7OzsrQkFNVztBQUNULGFBQU8sS0FBSyxLQUFMLEVBQVksT0FBWixFQUFQO0FBQ0Q7OzsyQkFFTSxDLEVBQUcsQyxFQUFHO0FBQ1gsYUFBTyxRQUFRLE9BQVIsQ0FBZ0IsS0FBSyxLQUFMLEVBQVksTUFBWixDQUFtQixDQUFuQixFQUFzQixJQUF0QixDQUEyQixDQUEzQixDQUFoQixDQUFQO0FBQ0Q7Ozt5QkFFSSxDLEVBQUcsRSxFQUFJO0FBQ1YsYUFBTyxRQUFRLE9BQVIsQ0FBZ0IsS0FBSyxLQUFMLEVBQVksQ0FBWixFQUFlLEtBQWYsQ0FBcUIsRUFBQyxJQUFJLEVBQUwsRUFBckIsRUFDdEIsTUFEc0IsRUFBaEIsQ0FBUDtBQUVEOzs7MkJBRU0sQyxFQUFHLEUsRUFBSSxDLEVBQUc7QUFDZixhQUFPLFFBQVEsT0FBUixDQUFnQixLQUFLLEtBQUwsRUFBWSxDQUFaLEVBQWUsS0FBZixDQUFxQixFQUFDLElBQUksRUFBTCxFQUFyQixFQUN0QixNQURzQixDQUNmLENBRGUsQ0FBaEIsQ0FBUDtBQUVEOzs7NEJBRU0sQyxFQUFHLEUsRUFBSTtBQUNaLGFBQU8sUUFBUSxPQUFSLENBQWdCLEtBQUssS0FBTCxFQUFZLENBQVosRUFBZSxLQUFmLENBQXFCLEVBQUMsSUFBSSxFQUFMLEVBQXJCLEVBQ3RCLE1BRHNCLEVBQWhCLENBQVA7QUFFRDs7OzBCQUVLLEMsRUFBRztBQUNQLGFBQU8sUUFBUSxPQUFSLENBQWdCLEtBQUssS0FBTCxFQUFZLEdBQVosQ0FBZ0IsRUFBRSxLQUFsQixDQUFoQixFQUNOLElBRE0sQ0FDRCxVQUFDLENBQUQ7QUFBQSxlQUFPLEVBQUUsSUFBVDtBQUFBLE9BREMsQ0FBUDtBQUVEIiwiZmlsZSI6InN0b3JhZ2Uvc3FsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQga25leCBmcm9tICdrbmV4JztcbmltcG9ydCB7U3RvcmFnZX0gZnJvbSAnLi9zdG9yYWdlJztcbmNvbnN0ICRrbmV4ID0gU3ltYm9sKCcka25leCcpO1xuXG5leHBvcnQgY2xhc3MgU1FMU3RvcmFnZSBleHRlbmRzIFN0b3JhZ2Uge1xuICBjb25zdHJ1Y3RvcihkYk9wdHMgPSB7fSkge1xuICAgIHN1cGVyKCk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHtcbiAgICAgICAgY2xpZW50OiAncG9zdGdyZXMnLFxuICAgICAgICBkZWJ1ZzogZmFsc2UsXG4gICAgICAgIGNvbm5lY3Rpb246IHtcbiAgICAgICAgICB1c2VyOiAncG9zdGdyZXMnLFxuICAgICAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgICAgIHBvcnQ6IDU0MzIsXG4gICAgICAgICAgcGFzc3dvcmQ6ICcnLFxuICAgICAgICAgIGNoYXJzZXQ6ICd1dGY4JyxcbiAgICAgICAgfSxcbiAgICAgICAgcG9vbDoge1xuICAgICAgICAgIG1heDogMjAsXG4gICAgICAgICAgbWluOiAwLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIGRiT3B0c1xuICAgICk7XG4gICAgdGhpc1ska25leF0gPSBrbmV4KG9wdGlvbnMpO1xuICB9XG5cbiAgLypcbiAgICBub3RlIHRoYXQga25leC5qcyBcInRoZW5cIiBmdW5jdGlvbnMgYXJlbid0IGFjdHVhbGx5IHByb21pc2VzIHRoZSB3YXkgeW91IHRoaW5rIHRoZXkgYXJlLlxuICAgIHlvdSBjYW4gcmV0dXJuIGtuZXguaW5zZXJ0KCkuaW50bygpLCB3aGljaCBoYXMgYSB0aGVuKCkgb24gaXQsIGJ1dCB0aGF0IHRoZW5hYmxlIGlzbid0XG4gICAgYW4gYWN0dWFsIHByb21pc2UgeWV0LiBTbyBpbnN0ZWFkIHdlJ3JlIHJldHVybmluZyBQcm9taXNlLnJlc29sdmUodGhlbmFibGUpO1xuICAqL1xuXG4gIHRlYXJkb3duKCkge1xuICAgIHJldHVybiB0aGlzWyRrbmV4XS5kZXN0cm95KCk7XG4gIH1cblxuICBjcmVhdGUodCwgdikge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpc1ska25leF0uaW5zZXJ0KHYpLmludG8odCkpO1xuICB9XG5cbiAgcmVhZCh0LCBpZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpc1ska25leF0odCkud2hlcmUoe2lkOiBpZH0pXG4gICAgLnNlbGVjdCgpKTtcbiAgfVxuXG4gIHVwZGF0ZSh0LCBpZCwgdikge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpc1ska25leF0odCkud2hlcmUoe2lkOiBpZH0pXG4gICAgLnVwZGF0ZSh2KSk7XG4gIH1cblxuICBkZWxldGUodCwgaWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXNbJGtuZXhdKHQpLndoZXJlKHtpZDogaWR9KVxuICAgIC5kZWxldGUoKSk7XG4gIH1cblxuICBxdWVyeShxKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzWyRrbmV4XS5yYXcocS5xdWVyeSkpXG4gICAgLnRoZW4oKGQpID0+IGQucm93cyk7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
