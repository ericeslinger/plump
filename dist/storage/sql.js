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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3FsLmpzIl0sIm5hbWVzIjpbIlByb21pc2UiLCIka25leCIsIlN5bWJvbCIsIlNRTFN0b3JhZ2UiLCJvcHRzIiwib3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsImNsaWVudCIsImRlYnVnIiwiY29ubmVjdGlvbiIsInVzZXIiLCJob3N0IiwicG9ydCIsInBhc3N3b3JkIiwiY2hhcnNldCIsInBvb2wiLCJtYXgiLCJtaW4iLCJzcWwiLCJkZXN0cm95IiwidCIsInYiLCJpZCIsIiRpZCIsInVwZGF0ZU9iamVjdCIsImtleXMiLCIkZmllbGRzIiwiZm9yRWFjaCIsImZpZWxkTmFtZSIsInVuZGVmaW5lZCIsInR5cGUiLCJjb25jYXQiLCJ0ZXJtaW5hbCIsIiRuYW1lIiwiaW5zZXJ0IiwicmV0dXJuaW5nIiwidGhlbiIsImNyZWF0ZWRJZCIsInJlYWQiLCJ3aGVyZSIsInVwZGF0ZSIsIkVycm9yIiwic2VsZWN0IiwibyIsImRlbGV0ZSIsInJlbGF0aW9uc2hpcCIsImNoaWxkSWQiLCJmaWVsZEluZm8iLCJyZWplY3QiLCJqb2luVGFibGUiLCJwYXJlbnRDb2x1bW4iLCJjaGlsZENvbHVtbiIsImwiLCJsZW5ndGgiLCJoYXMiLCJtYXAiLCJxIiwicmVzb2x2ZSIsInJhdyIsInF1ZXJ5IiwiZCIsInJvd3MiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQUFZQSxPOztBQUNaOzs7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsSUFBTUMsUUFBUUMsT0FBTyxPQUFQLENBQWQ7O0lBRWFDLFUsV0FBQUEsVTs7O0FBQ1gsd0JBQXVCO0FBQUEsUUFBWEMsSUFBVyx1RUFBSixFQUFJOztBQUFBOztBQUFBLHdIQUNmQSxJQURlOztBQUVyQixRQUFNQyxVQUFVQyxPQUFPQyxNQUFQLENBQ2QsRUFEYyxFQUVkO0FBQ0VDLGNBQVEsVUFEVjtBQUVFQyxhQUFPLEtBRlQ7QUFHRUMsa0JBQVk7QUFDVkMsY0FBTSxVQURJO0FBRVZDLGNBQU0sV0FGSTtBQUdWQyxjQUFNLElBSEk7QUFJVkMsa0JBQVUsRUFKQTtBQUtWQyxpQkFBUztBQUxDLE9BSGQ7QUFVRUMsWUFBTTtBQUNKQyxhQUFLLEVBREQ7QUFFSkMsYUFBSztBQUZEO0FBVlIsS0FGYyxFQWlCZGQsS0FBS2UsR0FqQlMsQ0FBaEI7QUFtQkEsVUFBS2xCLEtBQUwsSUFBYyxvQkFBS0ksT0FBTCxDQUFkO0FBckJxQjtBQXNCdEI7O0FBRUQ7Ozs7Ozs7OytCQU1XO0FBQ1QsYUFBTyxLQUFLSixLQUFMLEVBQVltQixPQUFaLEVBQVA7QUFDRDs7O3NDQUVpQixDQUFFOzs7MEJBRWRDLEMsRUFBR0MsQyxFQUFHO0FBQUE7O0FBQ1YsVUFBTUMsS0FBS0QsRUFBRUQsRUFBRUcsR0FBSixDQUFYO0FBQ0EsVUFBTUMsZUFBZSxFQUFyQjtBQUNBbkIsYUFBT29CLElBQVAsQ0FBWUwsRUFBRU0sT0FBZCxFQUF1QkMsT0FBdkIsQ0FBK0IsVUFBQ0MsU0FBRCxFQUFlO0FBQzVDLFlBQUlQLEVBQUVPLFNBQUYsTUFBaUJDLFNBQXJCLEVBQWdDO0FBQzlCO0FBQ0EsY0FDR1QsRUFBRU0sT0FBRixDQUFVRSxTQUFWLEVBQXFCRSxJQUFyQixLQUE4QixPQUEvQixJQUNDVixFQUFFTSxPQUFGLENBQVVFLFNBQVYsRUFBcUJFLElBQXJCLEtBQThCLFNBRmpDLEVBR0U7QUFDQU4seUJBQWFJLFNBQWIsSUFBMEJQLEVBQUVPLFNBQUYsRUFBYUcsTUFBYixFQUExQjtBQUNELFdBTEQsTUFLTyxJQUFJWCxFQUFFTSxPQUFGLENBQVVFLFNBQVYsRUFBcUJFLElBQXJCLEtBQThCLFFBQWxDLEVBQTRDO0FBQ2pETix5QkFBYUksU0FBYixJQUEwQnZCLE9BQU9DLE1BQVAsQ0FBYyxFQUFkLEVBQWtCZSxFQUFFTyxTQUFGLENBQWxCLENBQTFCO0FBQ0QsV0FGTSxNQUVBO0FBQ0xKLHlCQUFhSSxTQUFiLElBQTBCUCxFQUFFTyxTQUFGLENBQTFCO0FBQ0Q7QUFDRjtBQUNGLE9BZEQ7QUFlQSxVQUFLTixPQUFPTyxTQUFSLElBQXVCLEtBQUtHLFFBQWhDLEVBQTJDO0FBQ3pDLGVBQU8sS0FBS2hDLEtBQUwsRUFBWW9CLEVBQUVhLEtBQWQsRUFBcUJDLE1BQXJCLENBQTRCVixZQUE1QixFQUEwQ1csU0FBMUMsQ0FBb0RmLEVBQUVHLEdBQXRELEVBQ05hLElBRE0sQ0FDRCxVQUFDQyxTQUFELEVBQWU7QUFDbkIsaUJBQU8sT0FBS0MsSUFBTCxDQUFVbEIsQ0FBVixFQUFhaUIsVUFBVSxDQUFWLENBQWIsQ0FBUDtBQUNELFNBSE0sQ0FBUDtBQUlELE9BTEQsTUFLTyxJQUFJZixPQUFPTyxTQUFYLEVBQXNCO0FBQzNCLGVBQU8sS0FBSzdCLEtBQUwsRUFBWW9CLEVBQUVhLEtBQWQsRUFBcUJNLEtBQXJCLHFCQUE2Qm5CLEVBQUVHLEdBQS9CLEVBQXFDRCxFQUFyQyxHQUEwQ2tCLE1BQTFDLENBQWlEaEIsWUFBakQsRUFDTlksSUFETSxDQUNELFlBQU07QUFDVixpQkFBTyxPQUFLRSxJQUFMLENBQVVsQixDQUFWLEVBQWFFLEVBQWIsQ0FBUDtBQUNELFNBSE0sQ0FBUDtBQUlELE9BTE0sTUFLQTtBQUNMLGNBQU0sSUFBSW1CLEtBQUosQ0FBVSxtREFBVixDQUFOO0FBQ0Q7QUFDRjs7O3lCQUVJckIsQyxFQUFHRSxFLEVBQUk7QUFDVixhQUFPLEtBQUt0QixLQUFMLEVBQVlvQixFQUFFYSxLQUFkLEVBQXFCTSxLQUFyQixxQkFBNkJuQixFQUFFRyxHQUEvQixFQUFxQ0QsRUFBckMsR0FBMENvQixNQUExQyxHQUNOTixJQURNLENBQ0QsVUFBQ08sQ0FBRDtBQUFBLGVBQU9BLEVBQUUsQ0FBRixLQUFRLElBQWY7QUFBQSxPQURDLENBQVA7QUFFRDs7OzRCQUVNdkIsQyxFQUFHRSxFLEVBQUk7QUFDWixhQUFPLEtBQUt0QixLQUFMLEVBQVlvQixFQUFFYSxLQUFkLEVBQXFCTSxLQUFyQixxQkFBNkJuQixFQUFFRyxHQUEvQixFQUFxQ0QsRUFBckMsR0FBMENzQixNQUExQyxHQUNOUixJQURNLENBQ0QsVUFBQ08sQ0FBRDtBQUFBLGVBQU9BLENBQVA7QUFBQSxPQURDLENBQVA7QUFFRDs7O3dCQUVHdkIsQyxFQUFHRSxFLEVBQUl1QixZLEVBQWNDLE8sRUFBUztBQUFBOztBQUNoQyxVQUFNQyxZQUFZM0IsRUFBRU0sT0FBRixDQUFVbUIsWUFBVixDQUFsQjtBQUNBLFVBQUlFLGNBQWNsQixTQUFsQixFQUE2QjtBQUMzQixlQUFPOUIsUUFBUWlELE1BQVIsQ0FBZSxJQUFJUCxLQUFKLG9CQUEyQkksWUFBM0IsQ0FBZixDQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQUE7O0FBQ0wsZUFBTyxLQUFLN0MsS0FBTCxFQUFZK0MsVUFBVUUsU0FBdEIsRUFDTlYsS0FETSxxREFFSlEsVUFBVUcsWUFGTixFQUVxQjVCLEVBRnJCLGtDQUdKeUIsVUFBVUksV0FITixFQUdvQkwsT0FIcEIsbUJBSUpKLE1BSkksR0FLTk4sSUFMTSxDQUtELFVBQUNnQixDQUFELEVBQU87QUFDWCxjQUFJQSxFQUFFQyxNQUFGLEdBQVcsQ0FBZixFQUFrQjtBQUNoQixtQkFBT3RELFFBQVFpRCxNQUFSLENBQWUsSUFBSVAsS0FBSixXQUFrQkssT0FBbEIsb0JBQXdDRCxZQUF4QyxZQUEyRHpCLEVBQUVhLEtBQTdELFNBQXNFWCxFQUF0RSxDQUFmLENBQVA7QUFDRCxXQUZELE1BRU87QUFBQTs7QUFDTCxtQkFBTyxPQUFLdEIsS0FBTCxFQUFZK0MsVUFBVUUsU0FBdEIsRUFDTmYsTUFETSxpRUFFSmEsVUFBVUcsWUFGTixFQUVxQjVCLEVBRnJCLHdDQUdKeUIsVUFBVUksV0FITixFQUdvQkwsT0FIcEIseUJBSUpWLElBSkksQ0FJQyxZQUFNO0FBQ1oscUJBQU8sT0FBS2tCLEdBQUwsQ0FBU2xDLENBQVQsRUFBWUUsRUFBWixFQUFnQnVCLFlBQWhCLENBQVA7QUFDRCxhQU5NLENBQVA7QUFPRDtBQUNGLFNBakJNLENBQVA7QUFrQkQ7QUFDRjs7O3dCQUVHekIsQyxFQUFHRSxFLEVBQUl1QixZLEVBQWM7QUFDdkIsVUFBTUUsWUFBWTNCLEVBQUVNLE9BQUYsQ0FBVW1CLFlBQVYsQ0FBbEI7QUFDQSxVQUFJRSxjQUFjbEIsU0FBbEIsRUFBNkI7QUFDM0IsZUFBTzlCLFFBQVFpRCxNQUFSLENBQWUsSUFBSVAsS0FBSixvQkFBMkJJLFlBQTNCLENBQWYsQ0FBUDtBQUNELE9BRkQsTUFFTztBQUNMLGVBQU8sS0FBSzdDLEtBQUwsRUFBWStDLFVBQVVFLFNBQXRCLEVBQ05WLEtBRE0scUJBRUpRLFVBQVVHLFlBRk4sRUFFcUI1QixFQUZyQixHQUdKb0IsTUFISSxDQUdHSyxVQUFVSSxXQUhiLEVBSU5mLElBSk0sQ0FJRCxVQUFDZ0IsQ0FBRDtBQUFBLGlCQUFPQSxFQUFFRyxHQUFGLENBQU0sVUFBQ2xDLENBQUQ7QUFBQSxtQkFBT0EsRUFBRTBCLFVBQVVJLFdBQVosQ0FBUDtBQUFBLFdBQU4sQ0FBUDtBQUFBLFNBSkMsQ0FBUDtBQUtEO0FBQ0Y7OzsyQkFFTS9CLEMsRUFBR0UsRSxFQUFJdUIsWSxFQUFjQyxPLEVBQVM7QUFBQTs7QUFDbkMsVUFBTUMsWUFBWTNCLEVBQUVNLE9BQUYsQ0FBVW1CLFlBQVYsQ0FBbEI7QUFDQSxVQUFJRSxjQUFjbEIsU0FBbEIsRUFBNkI7QUFDM0IsZUFBTzlCLFFBQVFpRCxNQUFSLENBQWUsSUFBSVAsS0FBSixvQkFBMkJJLFlBQTNCLENBQWYsQ0FBUDtBQUNELE9BRkQsTUFFTztBQUFBOztBQUNMLGVBQU8sS0FBSzdDLEtBQUwsRUFBWStDLFVBQVVFLFNBQXRCLEVBQ05WLEtBRE0scURBRUpRLFVBQVVHLFlBRk4sRUFFcUI1QixFQUZyQixrQ0FHSnlCLFVBQVVJLFdBSE4sRUFHb0JMLE9BSHBCLG1CQUlKRixNQUpJLEdBS05SLElBTE0sQ0FLRCxZQUFNO0FBQ1YsaUJBQU8sT0FBS2tCLEdBQUwsQ0FBU2xDLENBQVQsRUFBWUUsRUFBWixFQUFnQnVCLFlBQWhCLENBQVA7QUFDRCxTQVBNLENBQVA7QUFRRDtBQUNGOzs7MEJBRUtXLEMsRUFBRztBQUNQLGFBQU96RCxRQUFRMEQsT0FBUixDQUFnQixLQUFLekQsS0FBTCxFQUFZMEQsR0FBWixDQUFnQkYsRUFBRUcsS0FBbEIsQ0FBaEIsRUFDTnZCLElBRE0sQ0FDRCxVQUFDd0IsQ0FBRDtBQUFBLGVBQU9BLEVBQUVDLElBQVQ7QUFBQSxPQURDLENBQVA7QUFFRCIsImZpbGUiOiJzdG9yYWdlL3NxbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IGtuZXggZnJvbSAna25leCc7XG5pbXBvcnQge1N0b3JhZ2V9IGZyb20gJy4vc3RvcmFnZSc7XG5jb25zdCAka25leCA9IFN5bWJvbCgnJGtuZXgnKTtcblxuZXhwb3J0IGNsYXNzIFNRTFN0b3JhZ2UgZXh0ZW5kcyBTdG9yYWdlIHtcbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgc3VwZXIob3B0cyk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHtcbiAgICAgICAgY2xpZW50OiAncG9zdGdyZXMnLFxuICAgICAgICBkZWJ1ZzogZmFsc2UsXG4gICAgICAgIGNvbm5lY3Rpb246IHtcbiAgICAgICAgICB1c2VyOiAncG9zdGdyZXMnLFxuICAgICAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgICAgIHBvcnQ6IDU0MzIsXG4gICAgICAgICAgcGFzc3dvcmQ6ICcnLFxuICAgICAgICAgIGNoYXJzZXQ6ICd1dGY4JyxcbiAgICAgICAgfSxcbiAgICAgICAgcG9vbDoge1xuICAgICAgICAgIG1heDogMjAsXG4gICAgICAgICAgbWluOiAwLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIG9wdHMuc3FsXG4gICAgKTtcbiAgICB0aGlzWyRrbmV4XSA9IGtuZXgob3B0aW9ucyk7XG4gIH1cblxuICAvKlxuICAgIG5vdGUgdGhhdCBrbmV4LmpzIFwidGhlblwiIGZ1bmN0aW9ucyBhcmVuJ3QgYWN0dWFsbHkgcHJvbWlzZXMgdGhlIHdheSB5b3UgdGhpbmsgdGhleSBhcmUuXG4gICAgeW91IGNhbiByZXR1cm4ga25leC5pbnNlcnQoKS5pbnRvKCksIHdoaWNoIGhhcyBhIHRoZW4oKSBvbiBpdCwgYnV0IHRoYXQgdGhlbmFibGUgaXNuJ3RcbiAgICBhbiBhY3R1YWwgcHJvbWlzZSB5ZXQuIFNvIGluc3RlYWQgd2UncmUgcmV0dXJuaW5nIFByb21pc2UucmVzb2x2ZSh0aGVuYWJsZSk7XG4gICovXG5cbiAgdGVhcmRvd24oKSB7XG4gICAgcmV0dXJuIHRoaXNbJGtuZXhdLmRlc3Ryb3koKTtcbiAgfVxuXG4gIG9uQ2FjaGVhYmxlUmVhZCgpIHt9XG5cbiAgd3JpdGUodCwgdikge1xuICAgIGNvbnN0IGlkID0gdlt0LiRpZF07XG4gICAgY29uc3QgdXBkYXRlT2JqZWN0ID0ge307XG4gICAgT2JqZWN0LmtleXModC4kZmllbGRzKS5mb3JFYWNoKChmaWVsZE5hbWUpID0+IHtcbiAgICAgIGlmICh2W2ZpZWxkTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBjb3B5IGZyb20gdiB0byB0aGUgYmVzdCBvZiBvdXIgYWJpbGl0eVxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdhcnJheScpIHx8XG4gICAgICAgICAgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdoYXNNYW55JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSB2W2ZpZWxkTmFtZV0uY29uY2F0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodC4kZmllbGRzW2ZpZWxkTmFtZV0udHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB1cGRhdGVPYmplY3RbZmllbGROYW1lXSA9IE9iamVjdC5hc3NpZ24oe30sIHZbZmllbGROYW1lXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSB2W2ZpZWxkTmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoKGlkID09PSB1bmRlZmluZWQpICYmICh0aGlzLnRlcm1pbmFsKSkge1xuICAgICAgcmV0dXJuIHRoaXNbJGtuZXhdKHQuJG5hbWUpLmluc2VydCh1cGRhdGVPYmplY3QpLnJldHVybmluZyh0LiRpZClcbiAgICAgIC50aGVuKChjcmVhdGVkSWQpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZCh0LCBjcmVhdGVkSWRbMF0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChpZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpc1ska25leF0odC4kbmFtZSkud2hlcmUoe1t0LiRpZF06IGlkfSkudXBkYXRlKHVwZGF0ZU9iamVjdClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZCh0LCBpZCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIG5ldyBjb250ZW50IGluIGEgbm9uLXRlcm1pbmFsIHN0b3JlJyk7XG4gICAgfVxuICB9XG5cbiAgcmVhZCh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzWyRrbmV4XSh0LiRuYW1lKS53aGVyZSh7W3QuJGlkXTogaWR9KS5zZWxlY3QoKVxuICAgIC50aGVuKChvKSA9PiBvWzBdIHx8IG51bGwpO1xuICB9XG5cbiAgZGVsZXRlKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXNbJGtuZXhdKHQuJG5hbWUpLndoZXJlKHtbdC4kaWRdOiBpZH0pLmRlbGV0ZSgpXG4gICAgLnRoZW4oKG8pID0+IG8pO1xuICB9XG5cbiAgYWRkKHQsIGlkLCByZWxhdGlvbnNoaXAsIGNoaWxkSWQpIHtcbiAgICBjb25zdCBmaWVsZEluZm8gPSB0LiRmaWVsZHNbcmVsYXRpb25zaGlwXTtcbiAgICBpZiAoZmllbGRJbmZvID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYFVua25vd24gZmllbGQgJHtyZWxhdGlvbnNoaXB9YCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpc1ska25leF0oZmllbGRJbmZvLmpvaW5UYWJsZSlcbiAgICAgIC53aGVyZSh7XG4gICAgICAgIFtmaWVsZEluZm8ucGFyZW50Q29sdW1uXTogaWQsXG4gICAgICAgIFtmaWVsZEluZm8uY2hpbGRDb2x1bW5dOiBjaGlsZElkLFxuICAgICAgfSkuc2VsZWN0KClcbiAgICAgIC50aGVuKChsKSA9PiB7XG4gICAgICAgIGlmIChsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGBJdGVtICR7Y2hpbGRJZH0gYWxyZWFkeSBpbiAke3JlbGF0aW9uc2hpcH0gb2YgJHt0LiRuYW1lfToke2lkfWApKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1ska25leF0oZmllbGRJbmZvLmpvaW5UYWJsZSlcbiAgICAgICAgICAuaW5zZXJ0KHtcbiAgICAgICAgICAgIFtmaWVsZEluZm8ucGFyZW50Q29sdW1uXTogaWQsXG4gICAgICAgICAgICBbZmllbGRJbmZvLmNoaWxkQ29sdW1uXTogY2hpbGRJZCxcbiAgICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmhhcyh0LCBpZCwgcmVsYXRpb25zaGlwKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgaGFzKHQsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgICBjb25zdCBmaWVsZEluZm8gPSB0LiRmaWVsZHNbcmVsYXRpb25zaGlwXTtcbiAgICBpZiAoZmllbGRJbmZvID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYFVua25vd24gZmllbGQgJHtyZWxhdGlvbnNoaXB9YCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpc1ska25leF0oZmllbGRJbmZvLmpvaW5UYWJsZSlcbiAgICAgIC53aGVyZSh7XG4gICAgICAgIFtmaWVsZEluZm8ucGFyZW50Q29sdW1uXTogaWQsXG4gICAgICB9KS5zZWxlY3QoZmllbGRJbmZvLmNoaWxkQ29sdW1uKVxuICAgICAgLnRoZW4oKGwpID0+IGwubWFwKCh2KSA9PiB2W2ZpZWxkSW5mby5jaGlsZENvbHVtbl0pKTtcbiAgICB9XG4gIH1cblxuICByZW1vdmUodCwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCkge1xuICAgIGNvbnN0IGZpZWxkSW5mbyA9IHQuJGZpZWxkc1tyZWxhdGlvbnNoaXBdO1xuICAgIGlmIChmaWVsZEluZm8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihgVW5rbm93biBmaWVsZCAke3JlbGF0aW9uc2hpcH1gKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzWyRrbmV4XShmaWVsZEluZm8uam9pblRhYmxlKVxuICAgICAgLndoZXJlKHtcbiAgICAgICAgW2ZpZWxkSW5mby5wYXJlbnRDb2x1bW5dOiBpZCxcbiAgICAgICAgW2ZpZWxkSW5mby5jaGlsZENvbHVtbl06IGNoaWxkSWQsXG4gICAgICB9KS5kZWxldGUoKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5oYXModCwgaWQsIHJlbGF0aW9uc2hpcCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBxdWVyeShxKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzWyRrbmV4XS5yYXcocS5xdWVyeSkpXG4gICAgLnRoZW4oKGQpID0+IGQucm93cyk7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
