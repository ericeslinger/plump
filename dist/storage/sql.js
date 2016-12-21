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
      var _newField;

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
      return this[$knex](relationshipBlock.relationship.$name).insert(newField);
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(type, id, relationshipTitle, childId) {
      var _whereBlock;

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
      return objectToWhereChain(this[$knex](relationshipBlock.relationship.$name), whereBlock, { id: id, childId: childId }).update(newField);
    }
  }, {
    key: 'remove',
    value: function remove(type, id, relationshipTitle, childId) {
      var _whereBlock2;

      var relationshipBlock = type.$fields[relationshipTitle];
      var sideInfo = relationshipBlock.relationship.$sides[relationshipTitle];
      var whereBlock = (_whereBlock2 = {}, _defineProperty(_whereBlock2, sideInfo.other.field, childId), _defineProperty(_whereBlock2, sideInfo.self.field, id), _whereBlock2);
      if (relationshipBlock.relationship.$restrict) {
        Object.keys(relationshipBlock.relationship.$restrict).forEach(function (restriction) {
          whereBlock[restriction] = relationshipBlock.relationship.$restrict[restriction].value;
        });
      }
      return objectToWhereChain(this[$knex](relationshipBlock.relationship.$name), whereBlock).delete();
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3FsLmpzIl0sIm5hbWVzIjpbIkJsdWViaXJkIiwiJGtuZXgiLCJTeW1ib2wiLCJkZXNlcmlhbGl6ZVdoZXJlIiwicXVlcnkiLCJibG9jayIsImNhciIsImNkciIsInNsaWNlIiwiQXJyYXkiLCJpc0FycmF5IiwicmVkdWNlIiwic3ViUXVlcnkiLCJzdWJCbG9jayIsImFwcGx5Iiwib2JqZWN0VG9XaGVyZUNoYWluIiwiY29udGV4dCIsIk9iamVjdCIsImtleXMiLCJxIiwia2V5IiwibWFzc1JlcGxhY2UiLCJ3aGVyZSIsIlNRTFN0b3JhZ2UiLCJvcHRzIiwib3B0aW9ucyIsImFzc2lnbiIsImNsaWVudCIsImRlYnVnIiwiY29ubmVjdGlvbiIsInVzZXIiLCJob3N0IiwicG9ydCIsInBhc3N3b3JkIiwiY2hhcnNldCIsInBvb2wiLCJtYXgiLCJtaW4iLCJzcWwiLCJkZXN0cm95IiwidCIsInYiLCJpZCIsIiRpZCIsInVwZGF0ZU9iamVjdCIsIiRmaWVsZHMiLCJmb3JFYWNoIiwiZmllbGROYW1lIiwidW5kZWZpbmVkIiwidHlwZSIsImNvbmNhdCIsInRlcm1pbmFsIiwiJG5hbWUiLCJpbnNlcnQiLCJyZXR1cm5pbmciLCJ0aGVuIiwiY3JlYXRlZElkIiwicmVhZCIsInVwZGF0ZSIsIkVycm9yIiwic2VsZWN0IiwibyIsInJlbGF0aW9uc2hpcFRpdGxlIiwicmVsYXRpb25zaGlwQmxvY2siLCJzaWRlSW5mbyIsInJlbGF0aW9uc2hpcCIsIiRzaWRlcyIsInRvU2VsZWN0Iiwib3RoZXIiLCJmaWVsZCIsInNlbGYiLCIkZXh0cmFzIiwid2hlcmVCbG9jayIsImxvZ2ljIiwiJHJlc3RyaWN0IiwicmVzdHJpY3Rpb24iLCJ2YWx1ZSIsInJlc29sdmUiLCJyZXF1aXJlTG9hZCIsInJlYWRPbmUiLCJsIiwiZGVsZXRlIiwiY2hpbGRJZCIsImV4dHJhcyIsIm5ld0ZpZWxkIiwiZXh0cmEiLCJyYXciLCJkIiwicm93cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0lBQVlBLFE7O0FBQ1o7Ozs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7QUFDQSxJQUFNQyxRQUFRQyxPQUFPLE9BQVAsQ0FBZDs7QUFFQSxTQUFTQyxnQkFBVCxDQUEwQkMsS0FBMUIsRUFBaUNDLEtBQWpDLEVBQXdDO0FBQ3RDLE1BQU1DLE1BQU1ELE1BQU0sQ0FBTixDQUFaO0FBQ0EsTUFBTUUsTUFBTUYsTUFBTUcsS0FBTixDQUFZLENBQVosQ0FBWjtBQUNBLE1BQUlDLE1BQU1DLE9BQU4sQ0FBY0gsSUFBSSxDQUFKLENBQWQsQ0FBSixFQUEyQjtBQUN6QixXQUFPQSxJQUFJSSxNQUFKLENBQVcsVUFBQ0MsUUFBRCxFQUFXQyxRQUFYO0FBQUEsYUFBd0JWLGlCQUFpQlMsUUFBakIsRUFBMkJDLFFBQTNCLENBQXhCO0FBQUEsS0FBWCxFQUF5RVQsS0FBekUsQ0FBUDtBQUNELEdBRkQsTUFFTztBQUNMLFdBQU9BLE1BQU1FLEdBQU4sRUFBV1EsS0FBWCxDQUFpQlYsS0FBakIsRUFBd0JHLEdBQXhCLENBQVA7QUFDRDtBQUNGOztBQUVELFNBQVNRLGtCQUFULENBQTRCWCxLQUE1QixFQUFtQ0MsS0FBbkMsRUFBMENXLE9BQTFDLEVBQW1EO0FBQ2pELFNBQU9DLE9BQU9DLElBQVAsQ0FBWWIsS0FBWixFQUFtQk0sTUFBbkIsQ0FBMEIsVUFBQ1EsQ0FBRCxFQUFJQyxHQUFKLEVBQVk7QUFDM0MsUUFBSVgsTUFBTUMsT0FBTixDQUFjTCxNQUFNZSxHQUFOLENBQWQsQ0FBSixFQUErQjtBQUM3QixhQUFPakIsaUJBQWlCQyxLQUFqQixFQUF3QixpQkFBUWlCLFdBQVIsQ0FBb0JoQixNQUFNZSxHQUFOLENBQXBCLEVBQWdDSixPQUFoQyxDQUF4QixDQUFQO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsYUFBT0csRUFBRUcsS0FBRixDQUFRRixHQUFSLEVBQWFmLE1BQU1lLEdBQU4sQ0FBYixDQUFQO0FBQ0Q7QUFDRixHQU5NLEVBTUpoQixLQU5JLENBQVA7QUFPRDs7SUFHWW1CLFUsV0FBQUEsVTs7O0FBQ1gsd0JBQXVCO0FBQUEsUUFBWEMsSUFBVyx1RUFBSixFQUFJOztBQUFBOztBQUFBLHdIQUNmQSxJQURlOztBQUVyQixRQUFNQyxVQUFVUixPQUFPUyxNQUFQLENBQ2QsRUFEYyxFQUVkO0FBQ0VDLGNBQVEsVUFEVjtBQUVFQyxhQUFPLEtBRlQ7QUFHRUMsa0JBQVk7QUFDVkMsY0FBTSxVQURJO0FBRVZDLGNBQU0sV0FGSTtBQUdWQyxjQUFNLElBSEk7QUFJVkMsa0JBQVUsRUFKQTtBQUtWQyxpQkFBUztBQUxDLE9BSGQ7QUFVRUMsWUFBTTtBQUNKQyxhQUFLLEVBREQ7QUFFSkMsYUFBSztBQUZEO0FBVlIsS0FGYyxFQWlCZGIsS0FBS2MsR0FqQlMsQ0FBaEI7QUFtQkEsVUFBS3JDLEtBQUwsSUFBYyxvQkFBS3dCLE9BQUwsQ0FBZDtBQXJCcUI7QUFzQnRCOztBQUVEOzs7Ozs7OzsrQkFNVztBQUNULGFBQU8sS0FBS3hCLEtBQUwsRUFBWXNDLE9BQVosRUFBUDtBQUNEOzs7c0NBRWlCLENBQUU7OzswQkFFZEMsQyxFQUFHQyxDLEVBQUc7QUFBQTs7QUFDVixVQUFNQyxLQUFLRCxFQUFFRCxFQUFFRyxHQUFKLENBQVg7QUFDQSxVQUFNQyxlQUFlLEVBQXJCO0FBQ0EzQixhQUFPQyxJQUFQLENBQVlzQixFQUFFSyxPQUFkLEVBQXVCQyxPQUF2QixDQUErQixVQUFDQyxTQUFELEVBQWU7QUFDNUMsWUFBSU4sRUFBRU0sU0FBRixNQUFpQkMsU0FBckIsRUFBZ0M7QUFDOUI7QUFDQSxjQUNHUixFQUFFSyxPQUFGLENBQVVFLFNBQVYsRUFBcUJFLElBQXJCLEtBQThCLE9BQS9CLElBQ0NULEVBQUVLLE9BQUYsQ0FBVUUsU0FBVixFQUFxQkUsSUFBckIsS0FBOEIsU0FGakMsRUFHRTtBQUNBTCx5QkFBYUcsU0FBYixJQUEwQk4sRUFBRU0sU0FBRixFQUFhRyxNQUFiLEVBQTFCO0FBQ0QsV0FMRCxNQUtPLElBQUlWLEVBQUVLLE9BQUYsQ0FBVUUsU0FBVixFQUFxQkUsSUFBckIsS0FBOEIsUUFBbEMsRUFBNEM7QUFDakRMLHlCQUFhRyxTQUFiLElBQTBCOUIsT0FBT1MsTUFBUCxDQUFjLEVBQWQsRUFBa0JlLEVBQUVNLFNBQUYsQ0FBbEIsQ0FBMUI7QUFDRCxXQUZNLE1BRUE7QUFDTEgseUJBQWFHLFNBQWIsSUFBMEJOLEVBQUVNLFNBQUYsQ0FBMUI7QUFDRDtBQUNGO0FBQ0YsT0FkRDtBQWVBLFVBQUtMLE9BQU9NLFNBQVIsSUFBdUIsS0FBS0csUUFBaEMsRUFBMkM7QUFDekMsZUFBTyxLQUFLbEQsS0FBTCxFQUFZdUMsRUFBRVksS0FBZCxFQUFxQkMsTUFBckIsQ0FBNEJULFlBQTVCLEVBQTBDVSxTQUExQyxDQUFvRGQsRUFBRUcsR0FBdEQsRUFDTlksSUFETSxDQUNELFVBQUNDLFNBQUQsRUFBZTtBQUNuQixpQkFBTyxPQUFLQyxJQUFMLENBQVVqQixDQUFWLEVBQWFnQixVQUFVLENBQVYsQ0FBYixDQUFQO0FBQ0QsU0FITSxDQUFQO0FBSUQsT0FMRCxNQUtPLElBQUlkLE9BQU9NLFNBQVgsRUFBc0I7QUFDM0IsZUFBTyxLQUFLL0MsS0FBTCxFQUFZdUMsRUFBRVksS0FBZCxFQUFxQjlCLEtBQXJCLHFCQUE4QmtCLEVBQUVHLEdBQWhDLEVBQXNDRCxFQUF0QyxHQUE0Q2dCLE1BQTVDLENBQW1EZCxZQUFuRCxFQUNOVyxJQURNLENBQ0QsWUFBTTtBQUNWLGlCQUFPLE9BQUtFLElBQUwsQ0FBVWpCLENBQVYsRUFBYUUsRUFBYixDQUFQO0FBQ0QsU0FITSxDQUFQO0FBSUQsT0FMTSxNQUtBO0FBQ0wsY0FBTSxJQUFJaUIsS0FBSixDQUFVLG1EQUFWLENBQU47QUFDRDtBQUNGOzs7NEJBRU9uQixDLEVBQUdFLEUsRUFBSTtBQUNiLGFBQU8sS0FBS3pDLEtBQUwsRUFBWXVDLEVBQUVZLEtBQWQsRUFBcUI5QixLQUFyQixxQkFBOEJrQixFQUFFRyxHQUFoQyxFQUFzQ0QsRUFBdEMsR0FBNENrQixNQUE1QyxHQUNOTCxJQURNLENBQ0QsVUFBQ00sQ0FBRDtBQUFBLGVBQU9BLEVBQUUsQ0FBRixLQUFRLElBQWY7QUFBQSxPQURDLENBQVA7QUFFRDs7OzZCQUVRWixJLEVBQU1QLEUsRUFBSW9CLGlCLEVBQW1CO0FBQUE7O0FBQ3BDLFVBQU1DLG9CQUFvQmQsS0FBS0osT0FBTCxDQUFhaUIsaUJBQWIsQ0FBMUI7QUFDQSxVQUFNRSxXQUFXRCxrQkFBa0JFLFlBQWxCLENBQStCQyxNQUEvQixDQUFzQ0osaUJBQXRDLENBQWpCO0FBQ0EsVUFBSUssV0FBVyxDQUFDSCxTQUFTSSxLQUFULENBQWVDLEtBQWhCLEVBQXVCTCxTQUFTTSxJQUFULENBQWNELEtBQXJDLENBQWY7QUFDQSxVQUFJTixrQkFBa0JFLFlBQWxCLENBQStCTSxPQUFuQyxFQUE0QztBQUMxQ0osbUJBQVdBLFNBQVNqQixNQUFULENBQWdCakMsT0FBT0MsSUFBUCxDQUFZNkMsa0JBQWtCRSxZQUFsQixDQUErQk0sT0FBM0MsQ0FBaEIsQ0FBWDtBQUNEO0FBQ0QsVUFBTUMsYUFBYSxFQUFuQjtBQUNBLFVBQUlSLFNBQVNNLElBQVQsQ0FBY2xFLEtBQWxCLEVBQXlCO0FBQ3ZCb0UsbUJBQVdSLFNBQVNNLElBQVQsQ0FBY0QsS0FBekIsSUFBa0NMLFNBQVNNLElBQVQsQ0FBY2xFLEtBQWQsQ0FBb0JxRSxLQUF0RDtBQUNELE9BRkQsTUFFTztBQUNMRCxtQkFBV1IsU0FBU00sSUFBVCxDQUFjRCxLQUF6QixJQUFrQzNCLEVBQWxDO0FBQ0Q7QUFDRCxVQUFJcUIsa0JBQWtCRSxZQUFsQixDQUErQlMsU0FBbkMsRUFBOEM7QUFDNUN6RCxlQUFPQyxJQUFQLENBQVk2QyxrQkFBa0JFLFlBQWxCLENBQStCUyxTQUEzQyxFQUFzRDVCLE9BQXRELENBQThELFVBQUM2QixXQUFELEVBQWlCO0FBQzdFSCxxQkFBV0csV0FBWCxJQUEwQlosa0JBQWtCRSxZQUFsQixDQUErQlMsU0FBL0IsQ0FBeUNDLFdBQXpDLEVBQXNEQyxLQUFoRjtBQUNELFNBRkQ7QUFHRDtBQUNELGFBQU81RSxTQUFTNkUsT0FBVCxHQUNOdEIsSUFETSxDQUNELFlBQU07QUFDVixZQUFJUyxTQUFTTSxJQUFULENBQWNsRSxLQUFkLElBQXVCNEQsU0FBU00sSUFBVCxDQUFjbEUsS0FBZCxDQUFvQjBFLFdBQS9DLEVBQTREO0FBQzFELGlCQUFPLE9BQUtDLE9BQUwsQ0FBYTlCLElBQWIsRUFBbUJQLEVBQW5CLENBQVA7QUFDRCxTQUZELE1BRU87QUFDTCxpQkFBTyxFQUFFQSxNQUFGLEVBQVA7QUFDRDtBQUNGLE9BUE0sRUFRTmEsSUFSTSxDQVFELFVBQUN2QyxPQUFELEVBQWE7QUFDakIsZUFBT0QsbUJBQW1CLE9BQUtkLEtBQUwsRUFBWThELGtCQUFrQkUsWUFBbEIsQ0FBK0JiLEtBQTNDLENBQW5CLEVBQXNFb0IsVUFBdEUsRUFBa0Z4RCxPQUFsRixFQUNONEMsTUFETSxDQUNDTyxRQURELENBQVA7QUFFRCxPQVhNLEVBWU5aLElBWk0sQ0FZRCxVQUFDeUIsQ0FBRCxFQUFPO0FBQ1gsbUNBQ0dsQixpQkFESCxFQUN1QmtCLENBRHZCO0FBR0QsT0FoQk0sQ0FBUDtBQWlCRDs7OzRCQUVNeEMsQyxFQUFHRSxFLEVBQUk7QUFDWixhQUFPLEtBQUt6QyxLQUFMLEVBQVl1QyxFQUFFWSxLQUFkLEVBQXFCOUIsS0FBckIscUJBQThCa0IsRUFBRUcsR0FBaEMsRUFBc0NELEVBQXRDLEdBQTRDdUMsTUFBNUMsR0FDTjFCLElBRE0sQ0FDRCxVQUFDTSxDQUFEO0FBQUEsZUFBT0EsQ0FBUDtBQUFBLE9BREMsQ0FBUDtBQUVEOzs7d0JBRUdaLEksRUFBTVAsRSxFQUFJb0IsaUIsRUFBbUJvQixPLEVBQXNCO0FBQUE7O0FBQUEsVUFBYkMsTUFBYSx1RUFBSixFQUFJOztBQUNyRCxVQUFNcEIsb0JBQW9CZCxLQUFLSixPQUFMLENBQWFpQixpQkFBYixDQUExQjtBQUNBLFVBQU1FLFdBQVdELGtCQUFrQkUsWUFBbEIsQ0FBK0JDLE1BQS9CLENBQXNDSixpQkFBdEMsQ0FBakI7QUFDQSxVQUFNc0IsdURBQ0hwQixTQUFTSSxLQUFULENBQWVDLEtBRFosRUFDb0JhLE9BRHBCLDhCQUVIbEIsU0FBU00sSUFBVCxDQUFjRCxLQUZYLEVBRW1CM0IsRUFGbkIsYUFBTjtBQUlBLFVBQUlxQixrQkFBa0JFLFlBQWxCLENBQStCUyxTQUFuQyxFQUE4QztBQUM1Q3pELGVBQU9DLElBQVAsQ0FBWTZDLGtCQUFrQkUsWUFBbEIsQ0FBK0JTLFNBQTNDLEVBQXNENUIsT0FBdEQsQ0FBOEQsVUFBQzZCLFdBQUQsRUFBaUI7QUFDN0VTLG1CQUFTVCxXQUFULElBQXdCWixrQkFBa0JFLFlBQWxCLENBQStCUyxTQUEvQixDQUF5Q0MsV0FBekMsRUFBc0RDLEtBQTlFO0FBQ0QsU0FGRDtBQUdEO0FBQ0QsVUFBSWIsa0JBQWtCRSxZQUFsQixDQUErQk0sT0FBbkMsRUFBNEM7QUFDMUN0RCxlQUFPQyxJQUFQLENBQVk2QyxrQkFBa0JFLFlBQWxCLENBQStCTSxPQUEzQyxFQUFvRHpCLE9BQXBELENBQTRELFVBQUN1QyxLQUFELEVBQVc7QUFDckVELG1CQUFTQyxLQUFULElBQWtCRixPQUFPRSxLQUFQLENBQWxCO0FBQ0QsU0FGRDtBQUdEO0FBQ0QsYUFBTyxLQUFLcEYsS0FBTCxFQUFZOEQsa0JBQWtCRSxZQUFsQixDQUErQmIsS0FBM0MsRUFDTkMsTUFETSxDQUNDK0IsUUFERCxDQUFQO0FBRUQ7Ozt1Q0FFa0JuQyxJLEVBQU1QLEUsRUFBSW9CLGlCLEVBQW1Cb0IsTyxFQUFzQjtBQUFBOztBQUFBLFVBQWJDLE1BQWEsdUVBQUosRUFBSTs7QUFDcEUsVUFBTXBCLG9CQUFvQmQsS0FBS0osT0FBTCxDQUFhaUIsaUJBQWIsQ0FBMUI7QUFDQSxVQUFNRSxXQUFXRCxrQkFBa0JFLFlBQWxCLENBQStCQyxNQUEvQixDQUFzQ0osaUJBQXRDLENBQWpCO0FBQ0EsVUFBTXNCLFdBQVcsRUFBakI7QUFDQW5FLGFBQU9DLElBQVAsQ0FBWTZDLGtCQUFrQkUsWUFBbEIsQ0FBK0JNLE9BQTNDLEVBQW9EekIsT0FBcEQsQ0FBNEQsVUFBQ3VDLEtBQUQsRUFBVztBQUNyRSxZQUFJRixPQUFPRSxLQUFQLE1BQWtCckMsU0FBdEIsRUFBaUM7QUFDL0JvQyxtQkFBU0MsS0FBVCxJQUFrQkYsT0FBT0UsS0FBUCxDQUFsQjtBQUNEO0FBQ0YsT0FKRDtBQUtBLFVBQU1iLDZEQUNIUixTQUFTSSxLQUFULENBQWVDLEtBRFosRUFDb0JhLE9BRHBCLGdDQUVIbEIsU0FBU00sSUFBVCxDQUFjRCxLQUZYLEVBRW1CM0IsRUFGbkIsZUFBTjtBQUlBLFVBQUlxQixrQkFBa0JFLFlBQWxCLENBQStCUyxTQUFuQyxFQUE4QztBQUM1Q3pELGVBQU9DLElBQVAsQ0FBWTZDLGtCQUFrQkUsWUFBbEIsQ0FBK0JTLFNBQTNDLEVBQXNENUIsT0FBdEQsQ0FBOEQsVUFBQzZCLFdBQUQsRUFBaUI7QUFDN0VILHFCQUFXRyxXQUFYLElBQTBCWixrQkFBa0JFLFlBQWxCLENBQStCUyxTQUEvQixDQUF5Q0MsV0FBekMsRUFBc0RDLEtBQWhGO0FBQ0QsU0FGRDtBQUdEO0FBQ0QsYUFBTzdELG1CQUFtQixLQUFLZCxLQUFMLEVBQVk4RCxrQkFBa0JFLFlBQWxCLENBQStCYixLQUEzQyxDQUFuQixFQUFzRW9CLFVBQXRFLEVBQWtGLEVBQUU5QixNQUFGLEVBQU13QyxnQkFBTixFQUFsRixFQUNOeEIsTUFETSxDQUNDMEIsUUFERCxDQUFQO0FBRUQ7OzsyQkFFTW5DLEksRUFBTVAsRSxFQUFJb0IsaUIsRUFBbUJvQixPLEVBQVM7QUFBQTs7QUFDM0MsVUFBTW5CLG9CQUFvQmQsS0FBS0osT0FBTCxDQUFhaUIsaUJBQWIsQ0FBMUI7QUFDQSxVQUFNRSxXQUFXRCxrQkFBa0JFLFlBQWxCLENBQStCQyxNQUEvQixDQUFzQ0osaUJBQXRDLENBQWpCO0FBQ0EsVUFBTVUsK0RBQ0hSLFNBQVNJLEtBQVQsQ0FBZUMsS0FEWixFQUNvQmEsT0FEcEIsaUNBRUhsQixTQUFTTSxJQUFULENBQWNELEtBRlgsRUFFbUIzQixFQUZuQixnQkFBTjtBQUlBLFVBQUlxQixrQkFBa0JFLFlBQWxCLENBQStCUyxTQUFuQyxFQUE4QztBQUM1Q3pELGVBQU9DLElBQVAsQ0FBWTZDLGtCQUFrQkUsWUFBbEIsQ0FBK0JTLFNBQTNDLEVBQXNENUIsT0FBdEQsQ0FBOEQsVUFBQzZCLFdBQUQsRUFBaUI7QUFDN0VILHFCQUFXRyxXQUFYLElBQTBCWixrQkFBa0JFLFlBQWxCLENBQStCUyxTQUEvQixDQUF5Q0MsV0FBekMsRUFBc0RDLEtBQWhGO0FBQ0QsU0FGRDtBQUdEO0FBQ0QsYUFBTzdELG1CQUFtQixLQUFLZCxLQUFMLEVBQVk4RCxrQkFBa0JFLFlBQWxCLENBQStCYixLQUEzQyxDQUFuQixFQUFzRW9CLFVBQXRFLEVBQWtGUyxNQUFsRixFQUFQO0FBQ0Q7OzswQkFFSzlELEMsRUFBRztBQUNQLGFBQU9uQixTQUFTNkUsT0FBVCxDQUFpQixLQUFLNUUsS0FBTCxFQUFZcUYsR0FBWixDQUFnQm5FLEVBQUVmLEtBQWxCLENBQWpCLEVBQ05tRCxJQURNLENBQ0QsVUFBQ2dDLENBQUQ7QUFBQSxlQUFPQSxFQUFFQyxJQUFUO0FBQUEsT0FEQyxDQUFQO0FBRUQiLCJmaWxlIjoic3RvcmFnZS9zcWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQga25leCBmcm9tICdrbmV4JztcbmltcG9ydCB7IFN0b3JhZ2UgfSBmcm9tICcuL3N0b3JhZ2UnO1xuY29uc3QgJGtuZXggPSBTeW1ib2woJyRrbmV4Jyk7XG5cbmZ1bmN0aW9uIGRlc2VyaWFsaXplV2hlcmUocXVlcnksIGJsb2NrKSB7XG4gIGNvbnN0IGNhciA9IGJsb2NrWzBdO1xuICBjb25zdCBjZHIgPSBibG9jay5zbGljZSgxKTtcbiAgaWYgKEFycmF5LmlzQXJyYXkoY2RyWzBdKSkge1xuICAgIHJldHVybiBjZHIucmVkdWNlKChzdWJRdWVyeSwgc3ViQmxvY2spID0+IGRlc2VyaWFsaXplV2hlcmUoc3ViUXVlcnksIHN1YkJsb2NrKSwgcXVlcnkpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBxdWVyeVtjYXJdLmFwcGx5KHF1ZXJ5LCBjZHIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG9iamVjdFRvV2hlcmVDaGFpbihxdWVyeSwgYmxvY2ssIGNvbnRleHQpIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKGJsb2NrKS5yZWR1Y2UoKHEsIGtleSkgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGJsb2NrW2tleV0pKSB7XG4gICAgICByZXR1cm4gZGVzZXJpYWxpemVXaGVyZShxdWVyeSwgU3RvcmFnZS5tYXNzUmVwbGFjZShibG9ja1trZXldLCBjb250ZXh0KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBxLndoZXJlKGtleSwgYmxvY2tba2V5XSk7XG4gICAgfVxuICB9LCBxdWVyeSk7XG59XG5cblxuZXhwb3J0IGNsYXNzIFNRTFN0b3JhZ2UgZXh0ZW5kcyBTdG9yYWdlIHtcbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgc3VwZXIob3B0cyk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHtcbiAgICAgICAgY2xpZW50OiAncG9zdGdyZXMnLFxuICAgICAgICBkZWJ1ZzogZmFsc2UsXG4gICAgICAgIGNvbm5lY3Rpb246IHtcbiAgICAgICAgICB1c2VyOiAncG9zdGdyZXMnLFxuICAgICAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgICAgIHBvcnQ6IDU0MzIsXG4gICAgICAgICAgcGFzc3dvcmQ6ICcnLFxuICAgICAgICAgIGNoYXJzZXQ6ICd1dGY4JyxcbiAgICAgICAgfSxcbiAgICAgICAgcG9vbDoge1xuICAgICAgICAgIG1heDogMjAsXG4gICAgICAgICAgbWluOiAwLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIG9wdHMuc3FsXG4gICAgKTtcbiAgICB0aGlzWyRrbmV4XSA9IGtuZXgob3B0aW9ucyk7XG4gIH1cblxuICAvKlxuICAgIG5vdGUgdGhhdCBrbmV4LmpzIFwidGhlblwiIGZ1bmN0aW9ucyBhcmVuJ3QgYWN0dWFsbHkgcHJvbWlzZXMgdGhlIHdheSB5b3UgdGhpbmsgdGhleSBhcmUuXG4gICAgeW91IGNhbiByZXR1cm4ga25leC5pbnNlcnQoKS5pbnRvKCksIHdoaWNoIGhhcyBhIHRoZW4oKSBvbiBpdCwgYnV0IHRoYXQgdGhlbmFibGUgaXNuJ3RcbiAgICBhbiBhY3R1YWwgcHJvbWlzZSB5ZXQuIFNvIGluc3RlYWQgd2UncmUgcmV0dXJuaW5nIEJsdWViaXJkLnJlc29sdmUodGhlbmFibGUpO1xuICAqL1xuXG4gIHRlYXJkb3duKCkge1xuICAgIHJldHVybiB0aGlzWyRrbmV4XS5kZXN0cm95KCk7XG4gIH1cblxuICBvbkNhY2hlYWJsZVJlYWQoKSB7fVxuXG4gIHdyaXRlKHQsIHYpIHtcbiAgICBjb25zdCBpZCA9IHZbdC4kaWRdO1xuICAgIGNvbnN0IHVwZGF0ZU9iamVjdCA9IHt9O1xuICAgIE9iamVjdC5rZXlzKHQuJGZpZWxkcykuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICBpZiAodltmaWVsZE5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gY29weSBmcm9tIHYgdG8gdGhlIGJlc3Qgb2Ygb3VyIGFiaWxpdHlcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0LiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnYXJyYXknKSB8fFxuICAgICAgICAgICh0LiRmaWVsZHNbZmllbGROYW1lXS50eXBlID09PSAnaGFzTWFueScpXG4gICAgICAgICkge1xuICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gdltmaWVsZE5hbWVdLmNvbmNhdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHQuJGZpZWxkc1tmaWVsZE5hbWVdLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0W2ZpZWxkTmFtZV0gPSBPYmplY3QuYXNzaWduKHt9LCB2W2ZpZWxkTmFtZV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVwZGF0ZU9iamVjdFtmaWVsZE5hbWVdID0gdltmaWVsZE5hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKChpZCA9PT0gdW5kZWZpbmVkKSAmJiAodGhpcy50ZXJtaW5hbCkpIHtcbiAgICAgIHJldHVybiB0aGlzWyRrbmV4XSh0LiRuYW1lKS5pbnNlcnQodXBkYXRlT2JqZWN0KS5yZXR1cm5pbmcodC4kaWQpXG4gICAgICAudGhlbigoY3JlYXRlZElkKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWQodCwgY3JlYXRlZElkWzBdKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoaWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXNbJGtuZXhdKHQuJG5hbWUpLndoZXJlKHsgW3QuJGlkXTogaWQgfSkudXBkYXRlKHVwZGF0ZU9iamVjdClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZCh0LCBpZCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIG5ldyBjb250ZW50IGluIGEgbm9uLXRlcm1pbmFsIHN0b3JlJyk7XG4gICAgfVxuICB9XG5cbiAgcmVhZE9uZSh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzWyRrbmV4XSh0LiRuYW1lKS53aGVyZSh7IFt0LiRpZF06IGlkIH0pLnNlbGVjdCgpXG4gICAgLnRoZW4oKG8pID0+IG9bMF0gfHwgbnVsbCk7XG4gIH1cblxuICByZWFkTWFueSh0eXBlLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUpIHtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBCbG9jayA9IHR5cGUuJGZpZWxkc1tyZWxhdGlvbnNoaXBUaXRsZV07XG4gICAgY29uc3Qgc2lkZUluZm8gPSByZWxhdGlvbnNoaXBCbG9jay5yZWxhdGlvbnNoaXAuJHNpZGVzW3JlbGF0aW9uc2hpcFRpdGxlXTtcbiAgICBsZXQgdG9TZWxlY3QgPSBbc2lkZUluZm8ub3RoZXIuZmllbGQsIHNpZGVJbmZvLnNlbGYuZmllbGRdO1xuICAgIGlmIChyZWxhdGlvbnNoaXBCbG9jay5yZWxhdGlvbnNoaXAuJGV4dHJhcykge1xuICAgICAgdG9TZWxlY3QgPSB0b1NlbGVjdC5jb25jYXQoT2JqZWN0LmtleXMocmVsYXRpb25zaGlwQmxvY2sucmVsYXRpb25zaGlwLiRleHRyYXMpKTtcbiAgICB9XG4gICAgY29uc3Qgd2hlcmVCbG9jayA9IHt9O1xuICAgIGlmIChzaWRlSW5mby5zZWxmLnF1ZXJ5KSB7XG4gICAgICB3aGVyZUJsb2NrW3NpZGVJbmZvLnNlbGYuZmllbGRdID0gc2lkZUluZm8uc2VsZi5xdWVyeS5sb2dpYztcbiAgICB9IGVsc2Uge1xuICAgICAgd2hlcmVCbG9ja1tzaWRlSW5mby5zZWxmLmZpZWxkXSA9IGlkO1xuICAgIH1cbiAgICBpZiAocmVsYXRpb25zaGlwQmxvY2sucmVsYXRpb25zaGlwLiRyZXN0cmljdCkge1xuICAgICAgT2JqZWN0LmtleXMocmVsYXRpb25zaGlwQmxvY2sucmVsYXRpb25zaGlwLiRyZXN0cmljdCkuZm9yRWFjaCgocmVzdHJpY3Rpb24pID0+IHtcbiAgICAgICAgd2hlcmVCbG9ja1tyZXN0cmljdGlvbl0gPSByZWxhdGlvbnNoaXBCbG9jay5yZWxhdGlvbnNoaXAuJHJlc3RyaWN0W3Jlc3RyaWN0aW9uXS52YWx1ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKHNpZGVJbmZvLnNlbGYucXVlcnkgJiYgc2lkZUluZm8uc2VsZi5xdWVyeS5yZXF1aXJlTG9hZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkT25lKHR5cGUsIGlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB7IGlkIH07XG4gICAgICB9XG4gICAgfSlcbiAgICAudGhlbigoY29udGV4dCkgPT4ge1xuICAgICAgcmV0dXJuIG9iamVjdFRvV2hlcmVDaGFpbih0aGlzWyRrbmV4XShyZWxhdGlvbnNoaXBCbG9jay5yZWxhdGlvbnNoaXAuJG5hbWUpLCB3aGVyZUJsb2NrLCBjb250ZXh0KVxuICAgICAgLnNlbGVjdCh0b1NlbGVjdCk7XG4gICAgfSlcbiAgICAudGhlbigobCkgPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgW3JlbGF0aW9uc2hpcFRpdGxlXTogbCxcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBkZWxldGUodCwgaWQpIHtcbiAgICByZXR1cm4gdGhpc1ska25leF0odC4kbmFtZSkud2hlcmUoeyBbdC4kaWRdOiBpZCB9KS5kZWxldGUoKVxuICAgIC50aGVuKChvKSA9PiBvKTtcbiAgfVxuXG4gIGFkZCh0eXBlLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUsIGNoaWxkSWQsIGV4dHJhcyA9IHt9KSB7XG4gICAgY29uc3QgcmVsYXRpb25zaGlwQmxvY2sgPSB0eXBlLiRmaWVsZHNbcmVsYXRpb25zaGlwVGl0bGVdO1xuICAgIGNvbnN0IHNpZGVJbmZvID0gcmVsYXRpb25zaGlwQmxvY2sucmVsYXRpb25zaGlwLiRzaWRlc1tyZWxhdGlvbnNoaXBUaXRsZV07XG4gICAgY29uc3QgbmV3RmllbGQgPSB7XG4gICAgICBbc2lkZUluZm8ub3RoZXIuZmllbGRdOiBjaGlsZElkLFxuICAgICAgW3NpZGVJbmZvLnNlbGYuZmllbGRdOiBpZCxcbiAgICB9O1xuICAgIGlmIChyZWxhdGlvbnNoaXBCbG9jay5yZWxhdGlvbnNoaXAuJHJlc3RyaWN0KSB7XG4gICAgICBPYmplY3Qua2V5cyhyZWxhdGlvbnNoaXBCbG9jay5yZWxhdGlvbnNoaXAuJHJlc3RyaWN0KS5mb3JFYWNoKChyZXN0cmljdGlvbikgPT4ge1xuICAgICAgICBuZXdGaWVsZFtyZXN0cmljdGlvbl0gPSByZWxhdGlvbnNoaXBCbG9jay5yZWxhdGlvbnNoaXAuJHJlc3RyaWN0W3Jlc3RyaWN0aW9uXS52YWx1ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAocmVsYXRpb25zaGlwQmxvY2sucmVsYXRpb25zaGlwLiRleHRyYXMpIHtcbiAgICAgIE9iamVjdC5rZXlzKHJlbGF0aW9uc2hpcEJsb2NrLnJlbGF0aW9uc2hpcC4kZXh0cmFzKS5mb3JFYWNoKChleHRyYSkgPT4ge1xuICAgICAgICBuZXdGaWVsZFtleHRyYV0gPSBleHRyYXNbZXh0cmFdO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzWyRrbmV4XShyZWxhdGlvbnNoaXBCbG9jay5yZWxhdGlvbnNoaXAuJG5hbWUpXG4gICAgLmluc2VydChuZXdGaWVsZCk7XG4gIH1cblxuICBtb2RpZnlSZWxhdGlvbnNoaXAodHlwZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlLCBjaGlsZElkLCBleHRyYXMgPSB7fSkge1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcEJsb2NrID0gdHlwZS4kZmllbGRzW3JlbGF0aW9uc2hpcFRpdGxlXTtcbiAgICBjb25zdCBzaWRlSW5mbyA9IHJlbGF0aW9uc2hpcEJsb2NrLnJlbGF0aW9uc2hpcC4kc2lkZXNbcmVsYXRpb25zaGlwVGl0bGVdO1xuICAgIGNvbnN0IG5ld0ZpZWxkID0ge307XG4gICAgT2JqZWN0LmtleXMocmVsYXRpb25zaGlwQmxvY2sucmVsYXRpb25zaGlwLiRleHRyYXMpLmZvckVhY2goKGV4dHJhKSA9PiB7XG4gICAgICBpZiAoZXh0cmFzW2V4dHJhXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG5ld0ZpZWxkW2V4dHJhXSA9IGV4dHJhc1tleHRyYV07XG4gICAgICB9XG4gICAgfSk7XG4gICAgY29uc3Qgd2hlcmVCbG9jayA9IHtcbiAgICAgIFtzaWRlSW5mby5vdGhlci5maWVsZF06IGNoaWxkSWQsXG4gICAgICBbc2lkZUluZm8uc2VsZi5maWVsZF06IGlkLFxuICAgIH07XG4gICAgaWYgKHJlbGF0aW9uc2hpcEJsb2NrLnJlbGF0aW9uc2hpcC4kcmVzdHJpY3QpIHtcbiAgICAgIE9iamVjdC5rZXlzKHJlbGF0aW9uc2hpcEJsb2NrLnJlbGF0aW9uc2hpcC4kcmVzdHJpY3QpLmZvckVhY2goKHJlc3RyaWN0aW9uKSA9PiB7XG4gICAgICAgIHdoZXJlQmxvY2tbcmVzdHJpY3Rpb25dID0gcmVsYXRpb25zaGlwQmxvY2sucmVsYXRpb25zaGlwLiRyZXN0cmljdFtyZXN0cmljdGlvbl0udmFsdWU7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdFRvV2hlcmVDaGFpbih0aGlzWyRrbmV4XShyZWxhdGlvbnNoaXBCbG9jay5yZWxhdGlvbnNoaXAuJG5hbWUpLCB3aGVyZUJsb2NrLCB7IGlkLCBjaGlsZElkIH0pXG4gICAgLnVwZGF0ZShuZXdGaWVsZCk7XG4gIH1cblxuICByZW1vdmUodHlwZSwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlLCBjaGlsZElkKSB7XG4gICAgY29uc3QgcmVsYXRpb25zaGlwQmxvY2sgPSB0eXBlLiRmaWVsZHNbcmVsYXRpb25zaGlwVGl0bGVdO1xuICAgIGNvbnN0IHNpZGVJbmZvID0gcmVsYXRpb25zaGlwQmxvY2sucmVsYXRpb25zaGlwLiRzaWRlc1tyZWxhdGlvbnNoaXBUaXRsZV07XG4gICAgY29uc3Qgd2hlcmVCbG9jayA9IHtcbiAgICAgIFtzaWRlSW5mby5vdGhlci5maWVsZF06IGNoaWxkSWQsXG4gICAgICBbc2lkZUluZm8uc2VsZi5maWVsZF06IGlkLFxuICAgIH07XG4gICAgaWYgKHJlbGF0aW9uc2hpcEJsb2NrLnJlbGF0aW9uc2hpcC4kcmVzdHJpY3QpIHtcbiAgICAgIE9iamVjdC5rZXlzKHJlbGF0aW9uc2hpcEJsb2NrLnJlbGF0aW9uc2hpcC4kcmVzdHJpY3QpLmZvckVhY2goKHJlc3RyaWN0aW9uKSA9PiB7XG4gICAgICAgIHdoZXJlQmxvY2tbcmVzdHJpY3Rpb25dID0gcmVsYXRpb25zaGlwQmxvY2sucmVsYXRpb25zaGlwLiRyZXN0cmljdFtyZXN0cmljdGlvbl0udmFsdWU7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdFRvV2hlcmVDaGFpbih0aGlzWyRrbmV4XShyZWxhdGlvbnNoaXBCbG9jay5yZWxhdGlvbnNoaXAuJG5hbWUpLCB3aGVyZUJsb2NrKS5kZWxldGUoKTtcbiAgfVxuXG4gIHF1ZXJ5KHEpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh0aGlzWyRrbmV4XS5yYXcocS5xdWVyeSkpXG4gICAgLnRoZW4oKGQpID0+IGQucm93cyk7XG4gIH1cbn1cbiJdfQ==
