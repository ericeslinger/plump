'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MemoryStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _storage = require('./storage');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var $store = Symbol('$store');

var MemoryStorage = exports.MemoryStorage = function (_Storage) {
  _inherits(MemoryStorage, _Storage);

  function MemoryStorage() {
    var _ref;

    _classCallCheck(this, MemoryStorage);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_ref = MemoryStorage.__proto__ || Object.getPrototypeOf(MemoryStorage)).call.apply(_ref, [this].concat(args)));

    _this[$store] = {};
    _this.maxId = 0;
    return _this;
  }

  _createClass(MemoryStorage, [{
    key: '$$ensure',
    value: function $$ensure(typeName, id) {
      if (this[$store][typeName] === undefined) {
        this[$store][typeName] = {};
      }
      if (id !== undefined) {
        if (this[$store][typeName][id] === undefined) {
          this[$store][typeName][id] = {};
        }
        return this[$store][typeName][id];
      } else {
        return this[$store][typeName];
      }
    }
  }, {
    key: '$$getRelationship',
    value: function $$getRelationship(typeName, parentId, relationshipTitle) {
      if (this.$$ensure(typeName, parentId)[relationshipTitle] === undefined) {
        this.$$ensure(typeName, parentId)[relationshipTitle] = [];
      }
      return this.$$ensure(typeName, parentId)[relationshipTitle];
    }
  }, {
    key: 'write',
    value: function write(t, v) {
      var id = v[t.$id];
      if (id === undefined) {
        if (this.terminal) {
          id = this.maxId + 1;
        } else {
          throw new Error('Cannot create new content in a non-terminal store');
        }
      }
      var updateObject = this.$$ensure(t.$name)[id];
      if (updateObject === undefined) {
        this.maxId = id;
        updateObject = _defineProperty({}, t.$id, id);
        this.$$ensure(t.$name)[id] = updateObject;
      }
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
      return Promise.resolve(Object.assign({}, updateObject));
    }
  }, {
    key: 'delete',
    value: function _delete(t, id) {
      var retVal = this.$$ensure(t.$name)[id];
      delete this.$$ensure(t.$name)[id];
      return Promise.resolve(retVal);
    }

    // relationshipTitle === name of relationship from type perspective, eg., model.relationship
    // relationshipName === absolute name of relationship, e.g., the table name of the join table

  }, {
    key: 'add',
    value: function add(t, id, relationshipTitle, childId, extras) {
      var _this2 = this;

      var Rel = t.$fields[relationshipTitle]; // {$fields}
      var relationshipArray = this.$$getRelationship(t.$name, id, relationshipTitle);
      var selfFieldName = Rel.field;
      var otherFieldName = Rel.relationship.otherField(selfFieldName);
      var idx = relationshipArray.findIndex(function (v) {
        return v[selfFieldName] === id && v[otherFieldName] === childId;
      });
      if (idx < 0) {
        (function () {
          var _newRelationship;

          var newRelationship = (_newRelationship = {}, _defineProperty(_newRelationship, selfFieldName, id), _defineProperty(_newRelationship, otherFieldName, childId), _newRelationship);
          (Rel.relationship.$extras || []).forEach(function (e) {
            newRelationship[e] = extras[e];
          });
          relationshipArray.push(newRelationship);
          var otherTypeName = Rel.relationship.$sides[otherFieldName];
          var otherSide = Rel.otherSide;
          var otherRelationshipArray = _this2.$$getRelationship(otherTypeName, childId, otherSide);
          otherRelationshipArray.push(newRelationship);
        })();
      }
      return Promise.resolve(relationshipArray.concat());
    }
  }, {
    key: 'readOne',
    value: function readOne(t, id) {
      return Promise.resolve(this.$$ensure(t.$name)[id] || null);
    }
  }, {
    key: 'readMany',
    value: function readMany(t, id, relationship) {
      return Promise.resolve(_defineProperty({}, relationship, (this.$$getRelationship(t.$name, id, relationship) || []).concat()));
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(t, id, relationshipTitle, childId, extras) {
      var Rel = t.$fields[relationshipTitle]; // {$fields}
      var relationshipArray = this.$$getRelationship(t.$name, id, relationshipTitle);
      var selfFieldName = Rel.field;
      var otherFieldName = Rel.relationship.otherField(selfFieldName);
      var idx = relationshipArray.findIndex(function (v) {
        return v[selfFieldName] === id && v[otherFieldName] === childId;
      });
      if (idx >= 0) {
        relationshipArray[idx] = Object.assign(relationshipArray[idx], extras);
        return Promise.resolve(relationshipArray.concat());
      } else {
        return Promise.reject(new Error('Item ' + childId + ' not found in ' + relationshipTitle + ' of ' + t.$name));
      }
    }
  }, {
    key: 'remove',
    value: function remove(t, id, relationshipTitle, childId) {
      var Rel = t.$fields[relationshipTitle]; // {$fields}
      var relationshipArray = this.$$getRelationship(t.$name, id, relationshipTitle);
      var selfFieldName = Rel.field;
      var otherFieldName = Rel.relationship.otherField(selfFieldName);
      var idx = relationshipArray.findIndex(function (v) {
        return v[selfFieldName] === id && v[otherFieldName] === childId;
      });
      if (idx >= 0) {
        var otherTypeName = Rel.relationship.$sides[otherFieldName];
        var otherSide = Rel.otherSide;
        var otherRelationshipArray = this.$$getRelationship(otherTypeName, childId, otherSide);
        var otherSideIdx = otherRelationshipArray.findIndex(function (v) {
          return v[selfFieldName] === id && v[otherFieldName] === childId;
        });
        relationshipArray.splice(idx, 1);
        otherRelationshipArray.splice(otherSideIdx, 1);
        return Promise.resolve(relationshipArray.concat());
      } else {
        return Promise.reject(new Error('Item ' + childId + ' not found in ' + relationshipTitle + ' of ' + t.$name));
      }
    }
  }, {
    key: 'query',
    value: function query() {
      return Promise.reject(new Error('Query interface not supported on MemoryStorage'));
    }
  }]);

  return MemoryStorage;
}(_storage.Storage);