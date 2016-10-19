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
    value: function readMany(t, id, relationshipTitle) {
      var Rel = t.$fields[relationshipTitle]; // {$fields}
      var otherFieldName = Rel.field;
      var selfFieldName = Rel.relationship.otherField(otherFieldName);
      return this[$knex](Rel.relationship.$name).where(_defineProperty({}, selfFieldName, id)).select().then(function (l) {
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
    value: function add(t, id, relationshipTitle, childId) {
      var _newField,
          _this3 = this;

      var extras = arguments.length <= 4 || arguments[4] === undefined ? {} : arguments[4];

      var Rel = t.$fields[relationshipTitle]; // {$fields}
      var otherFieldName = Rel.field;
      var selfFieldName = Rel.relationship.otherField(otherFieldName);
      var newField = (_newField = {}, _defineProperty(_newField, otherFieldName, childId), _defineProperty(_newField, selfFieldName, id), _newField);
      (Rel.relationship.$extras || []).forEach(function (extra) {
        newField[extra] = extras[extra];
      });
      return this[$knex](Rel.relationship.$name).insert(newField).then(function () {
        return _this3.readMany(t, id, relationshipTitle);
      });
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(t, id, relationshipTitle, childId) {
      var _$knex$where5;

      var extras = arguments.length <= 4 || arguments[4] === undefined ? {} : arguments[4];

      var Rel = t.$fields[relationshipTitle]; // {$fields}
      var otherFieldName = Rel.field;
      var selfFieldName = Rel.relationship.otherField(otherFieldName);
      var newField = {};
      Rel.relationship.$extras.forEach(function (extra) {
        if (extras[extra] !== undefined) {
          newField[extra] = extras[extra];
        }
      });
      return this[$knex](Rel.relationship.$name).where((_$knex$where5 = {}, _defineProperty(_$knex$where5, otherFieldName, childId), _defineProperty(_$knex$where5, selfFieldName, id), _$knex$where5)).update(newField);
    }
  }, {
    key: 'remove',
    value: function remove(t, id, relationshipTitle, childId) {
      var _$knex$where6,
          _this4 = this;

      var Rel = t.$fields[relationshipTitle]; // {$fields}
      var otherFieldName = Rel.field;
      var selfFieldName = Rel.relationship.otherField(otherFieldName);
      return this[$knex](Rel.relationship.$name).where((_$knex$where6 = {}, _defineProperty(_$knex$where6, otherFieldName, childId), _defineProperty(_$knex$where6, selfFieldName, id), _$knex$where6)).delete().then(function () {
        return _this4.readMany(t, id, relationshipTitle);
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