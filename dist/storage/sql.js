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

var _storage = require('./storage');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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
    _this._knex = Knex(options); // eslint-disable-line new-cap
    return _this;
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
}(_storage.Storage);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3FsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQUFZLE87O0FBQ1o7O0lBQVksSTs7QUFDWjs7Ozs7Ozs7OztJQUVhLFUsV0FBQSxVOzs7QUFDWCx3QkFBeUI7QUFBQSxRQUFiLE1BQWEseURBQUosRUFBSTs7QUFBQTs7QUFBQTs7QUFFdkIsUUFBTSxVQUFVLE9BQU8sTUFBUCxDQUNkLEVBRGMsRUFFZDtBQUNFLGNBQVEsVUFEVjtBQUVFLGFBQU8sS0FGVDtBQUdFLGtCQUFZO0FBQ1YsY0FBTSxVQURJO0FBRVYsY0FBTSxXQUZJO0FBR1YsY0FBTSxJQUhJO0FBSVYsa0JBQVUsRUFKQTtBQUtWLGlCQUFTO0FBTEMsT0FIZDtBQVVFLFlBQU07QUFDSixhQUFLLEVBREQ7QUFFSixhQUFLO0FBRkQ7QUFWUixLQUZjLEVBaUJkLE1BakJjLENBQWhCO0FBbUJBLFVBQUssS0FBTCxHQUFhLEtBQUssT0FBTCxDQUFiLENBckJ1QixDQXFCSztBQXJCTDtBQXNCeEI7O0FBRUQ7Ozs7Ozs7OzJCQU1PLEMsRUFBRyxDLEVBQUc7QUFDWCxhQUFPLFFBQVEsT0FBUixDQUFnQixLQUFLLEtBQUwsQ0FBVyxNQUFYLENBQWtCLENBQWxCLEVBQXFCLElBQXJCLENBQTBCLENBQTFCLENBQWhCLENBQVA7QUFDRDs7O3lCQUVJLEMsRUFBRyxFLEVBQUk7QUFDVixhQUFPLFFBQVEsT0FBUixDQUFnQixLQUFLLEtBQUwsQ0FBVyxDQUFYLEVBQWMsS0FBZCxDQUFvQixFQUFDLElBQUksRUFBTCxFQUFwQixFQUN0QixNQURzQixFQUFoQixDQUFQO0FBRUQ7OzsyQkFFTSxDLEVBQUcsRSxFQUFJLEMsRUFBRztBQUNmLGFBQU8sUUFBUSxPQUFSLENBQWdCLEtBQUssS0FBTCxDQUFXLENBQVgsRUFBYyxLQUFkLENBQW9CLEVBQUMsSUFBSSxFQUFMLEVBQXBCLEVBQ3RCLE1BRHNCLENBQ2YsQ0FEZSxDQUFoQixDQUFQO0FBRUQ7Ozs0QkFFTSxDLEVBQUcsRSxFQUFJO0FBQ1osYUFBTyxRQUFRLE9BQVIsQ0FBZ0IsS0FBSyxLQUFMLENBQVcsQ0FBWCxFQUFjLEtBQWQsQ0FBb0IsRUFBQyxJQUFJLEVBQUwsRUFBcEIsRUFDdEIsTUFEc0IsRUFBaEIsQ0FBUDtBQUVEOzs7MEJBRUssQyxFQUFHO0FBQ1AsYUFBTyxRQUFRLE9BQVIsQ0FBZ0IsS0FBSyxLQUFMLENBQVcsR0FBWCxDQUFlLEVBQUUsS0FBakIsQ0FBaEIsRUFDTixJQURNLENBQ0QsVUFBQyxDQUFEO0FBQUEsZUFBTyxFQUFFLElBQVQ7QUFBQSxPQURDLENBQVA7QUFFRCIsImZpbGUiOiJzdG9yYWdlL3NxbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0ICogYXMgS25leCBmcm9tICdrbmV4JztcbmltcG9ydCB7U3RvcmFnZX0gZnJvbSAnLi9zdG9yYWdlJztcblxuZXhwb3J0IGNsYXNzIFNRTFN0b3JhZ2UgZXh0ZW5kcyBTdG9yYWdlIHtcbiAgY29uc3RydWN0b3IoZGJPcHRzID0ge30pIHtcbiAgICBzdXBlcigpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIGNsaWVudDogJ3Bvc3RncmVzJyxcbiAgICAgICAgZGVidWc6IGZhbHNlLFxuICAgICAgICBjb25uZWN0aW9uOiB7XG4gICAgICAgICAgdXNlcjogJ3Bvc3RncmVzJyxcbiAgICAgICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgICAgICBwb3J0OiA1NDMyLFxuICAgICAgICAgIHBhc3N3b3JkOiAnJyxcbiAgICAgICAgICBjaGFyc2V0OiAndXRmOCcsXG4gICAgICAgIH0sXG4gICAgICAgIHBvb2w6IHtcbiAgICAgICAgICBtYXg6IDIwLFxuICAgICAgICAgIG1pbjogMCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBkYk9wdHNcbiAgICApO1xuICAgIHRoaXMuX2tuZXggPSBLbmV4KG9wdGlvbnMpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5ldy1jYXBcbiAgfVxuXG4gIC8qXG4gICAgbm90ZSB0aGF0IGtuZXguanMgXCJ0aGVuXCIgZnVuY3Rpb25zIGFyZW4ndCBhY3R1YWxseSBwcm9taXNlcyB0aGUgd2F5IHlvdSB0aGluayB0aGV5IGFyZS5cbiAgICB5b3UgY2FuIHJldHVybiBrbmV4Lmluc2VydCgpLmludG8oKSwgd2hpY2ggaGFzIGEgdGhlbigpIG9uIGl0LCBidXQgdGhhdCB0aGVuYWJsZSBpc24ndFxuICAgIGFuIGFjdHVhbCBwcm9taXNlIHlldC4gU28gaW5zdGVhZCB3ZSdyZSByZXR1cm5pbmcgUHJvbWlzZS5yZXNvbHZlKHRoZW5hYmxlKTtcbiAgKi9cblxuICBjcmVhdGUodCwgdikge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fa25leC5pbnNlcnQodikuaW50byh0KSk7XG4gIH1cblxuICByZWFkKHQsIGlkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9rbmV4KHQpLndoZXJlKHtpZDogaWR9KVxuICAgIC5zZWxlY3QoKSk7XG4gIH1cblxuICB1cGRhdGUodCwgaWQsIHYpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2tuZXgodCkud2hlcmUoe2lkOiBpZH0pXG4gICAgLnVwZGF0ZSh2KSk7XG4gIH1cblxuICBkZWxldGUodCwgaWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2tuZXgodCkud2hlcmUoe2lkOiBpZH0pXG4gICAgLmRlbGV0ZSgpKTtcbiAgfVxuXG4gIHF1ZXJ5KHEpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2tuZXgucmF3KHEucXVlcnkpKVxuICAgIC50aGVuKChkKSA9PiBkLnJvd3MpO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
