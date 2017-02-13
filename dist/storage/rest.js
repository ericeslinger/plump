'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RestStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _axios = require('axios');

var axios = _interopRequireWildcard(_axios);

var _mergeOptions = require('merge-options');

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _storage = require('./storage');

var _model = require('../model');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var $axios = Symbol('$axios');

var RestStorage = exports.RestStorage = function (_Storage) {
  _inherits(RestStorage, _Storage);

  function RestStorage() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, RestStorage);

    var _this = _possibleConstructorReturn(this, (RestStorage.__proto__ || Object.getPrototypeOf(RestStorage)).call(this, opts));

    var options = Object.assign({}, {
      baseURL: 'http://localhost/api'
    }, opts);
    _this[$axios] = options.axios || axios.create(options);
    return _this;
  }

  _createClass(RestStorage, [{
    key: 'rest',
    value: function rest(options) {
      return this[$axios](options);
    }
  }, {
    key: 'parseJSONApiRelationships',
    value: function parseJSONApiRelationships(json) {
      var data = typeof json === 'string' ? JSON.parse(json) : json;
      var type = this.type(data.data.type);

      return Object.keys(data.relationships).map(function (relName) {
        var relationship = type.$fields[relName].relationship;
        return _defineProperty({}, relName, data.relationships[relName].data.map(function (child) {
          var _ref;

          return _ref = {}, _defineProperty(_ref, relationship.$sides[relName].self.field, data.id), _defineProperty(_ref, relationship.$sides[relName].other.field, child.id), _ref;
        }));
      }).reduce(function (acc, curr) {
        return (0, _mergeOptions2.default)(acc, curr);
      }, {});
    }
  }, {
    key: 'parseJSONApi',
    value: function parseJSONApi(json) {
      var _this2 = this;

      var data = typeof json === 'string' ? JSON.parse(json) : json;
      var type = this.type(data.data.type);
      var relationships = this.parseJSONApiRelationships(data.relationships);

      var requested = Object.assign(_defineProperty({}, type.$id, data.id), data.attributes, relationships);
      this.save();

      data.included.forEach(function (inclusion) {
        var childType = _this2.type(inclusion.type);
        var childId = inclusion.id;
        var childData = Object.assign({}, inclusion.attributes, _this2.parseJSONApiRelationships(inclusion.relationships));
        var updatedFields = [_model.$self].concat(Object.keys(inclusion.relationships));

        _this2.notifyUpdate(childType, childId, childData, updatedFields);
      });

      return requested;
    }
  }, {
    key: 'write',
    value: function write(t, v) {
      var _this3 = this;

      return _bluebird2.default.resolve().then(function () {
        if (v[t.$id]) {
          return _this3[$axios].patch('/' + t.$name + '/' + v[t.$id], v);
        } else if (_this3.terminal) {
          return _this3[$axios].post('/' + t.$name, v);
        } else {
          throw new Error('Cannot create new content in a non-terminal store');
        }
      }).then(function (d) {
        return _this3.parseJSONApi(d.data);
      }) // formerly d.data[t.$name][0]
      .then(function (result) {
        return _this3.notifyUpdate(t, result[t.$id], result).then(function () {
          return result;
        });
      });
    }

    // TODO: NATE REWRITE HOW RESPONSE IS PARSED

  }, {
    key: 'readOne',
    value: function readOne(t, id) {
      var _this4 = this;

      return _bluebird2.default.resolve().then(function () {
        return _this4[$axios].get('/' + t.$name + '/' + id);
      }).then(function (response) {
        return _this4.parseJSONApi(response.data); // formerly response.data[t.$name][0];
      }).catch(function (err) {
        if (err.response && err.response.status === 404) {
          return null;
        } else {
          throw err;
        }
      });
    }
  }, {
    key: 'readMany',
    value: function readMany(t, id, relationship) {
      return this[$axios].get('/' + t.$name + '/' + id + '/' + relationship).then(function (response) {
        return response.data;
      }).catch(function (err) {
        if (err.response && err.response.status === 404) {
          return [];
        } else {
          throw err;
        }
      });
    }
  }, {
    key: 'add',
    value: function add(type, id, relationshipTitle, childId, extras) {
      var _newField,
          _this5 = this;

      var relationshipBlock = type.$fields[relationshipTitle];
      var sideInfo = relationshipBlock.relationship.$sides[relationshipTitle];
      var newField = (_newField = {}, _defineProperty(_newField, sideInfo.self.field, id), _defineProperty(_newField, sideInfo.other.field, childId), _newField);
      if (relationshipBlock.relationship.$extras) {
        Object.keys(relationshipBlock.relationship.$extras).forEach(function (extra) {
          newField[extra] = extras[extra];
        });
      }
      return this[$axios].put('/' + type.$name + '/' + id + '/' + relationshipTitle, newField).then(function () {
        return _this5.notifyUpdate(type, id, null, relationshipTitle);
      });
    }
  }, {
    key: 'remove',
    value: function remove(t, id, relationshipTitle, childId) {
      var _this6 = this;

      return this[$axios].delete('/' + t.$name + '/' + id + '/' + relationshipTitle + '/' + childId).then(function () {
        return _this6.notifyUpdate(t, id, null, relationshipTitle);
      });
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(t, id, relationshipTitle, childId, extras) {
      var _this7 = this;

      return this[$axios].patch('/' + t.$name + '/' + id + '/' + relationshipTitle + '/' + childId, extras).then(function () {
        return _this7.notifyUpdate(t, id, null, relationshipTitle);
      });
    }
  }, {
    key: 'delete',
    value: function _delete(t, id) {
      return this[$axios].delete('/' + t.$name + '/' + id).then(function (response) {
        return response.data;
      });
    }
  }, {
    key: 'query',
    value: function query(q) {
      return this[$axios].get('/' + q.type, { params: q.query }).then(function (response) {
        return response.data;
      });
    }
  }]);

  return RestStorage;
}(_storage.Storage);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvcmVzdC5qcyJdLCJuYW1lcyI6WyJheGlvcyIsIiRheGlvcyIsIlN5bWJvbCIsIlJlc3RTdG9yYWdlIiwib3B0cyIsIm9wdGlvbnMiLCJPYmplY3QiLCJhc3NpZ24iLCJiYXNlVVJMIiwiY3JlYXRlIiwianNvbiIsImRhdGEiLCJKU09OIiwicGFyc2UiLCJ0eXBlIiwia2V5cyIsInJlbGF0aW9uc2hpcHMiLCJtYXAiLCJyZWxhdGlvbnNoaXAiLCIkZmllbGRzIiwicmVsTmFtZSIsIiRzaWRlcyIsInNlbGYiLCJmaWVsZCIsImlkIiwib3RoZXIiLCJjaGlsZCIsInJlZHVjZSIsImFjYyIsImN1cnIiLCJwYXJzZUpTT05BcGlSZWxhdGlvbnNoaXBzIiwicmVxdWVzdGVkIiwiJGlkIiwiYXR0cmlidXRlcyIsInNhdmUiLCJpbmNsdWRlZCIsImZvckVhY2giLCJjaGlsZFR5cGUiLCJpbmNsdXNpb24iLCJjaGlsZElkIiwiY2hpbGREYXRhIiwidXBkYXRlZEZpZWxkcyIsImNvbmNhdCIsIm5vdGlmeVVwZGF0ZSIsInQiLCJ2IiwicmVzb2x2ZSIsInRoZW4iLCJwYXRjaCIsIiRuYW1lIiwidGVybWluYWwiLCJwb3N0IiwiRXJyb3IiLCJkIiwicGFyc2VKU09OQXBpIiwicmVzdWx0IiwiZ2V0IiwicmVzcG9uc2UiLCJjYXRjaCIsImVyciIsInN0YXR1cyIsInJlbGF0aW9uc2hpcFRpdGxlIiwiZXh0cmFzIiwicmVsYXRpb25zaGlwQmxvY2siLCJzaWRlSW5mbyIsIm5ld0ZpZWxkIiwiJGV4dHJhcyIsImV4dHJhIiwicHV0IiwiZGVsZXRlIiwicSIsInBhcmFtcyIsInF1ZXJ5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7SUFBWUEsSzs7QUFDWjs7OztBQUNBOztBQUNBOztBQUdBOzs7Ozs7Ozs7Ozs7Ozs7O0FBREEsSUFBTUMsU0FBU0MsT0FBTyxRQUFQLENBQWY7O0lBR2FDLFcsV0FBQUEsVzs7O0FBRVgseUJBQXVCO0FBQUEsUUFBWEMsSUFB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bkMsRUFDTnVCLElBRE0sQ0FDRCxVQUFDVSxRQUFELEVBQWM7QUFDbEIsZUFBT0EsU0FBUzlDLElBQWhCO0FBQ0QsT0FITSxDQUFQO0FBSUQ7OzswQkFFSzJELEMsRUFBRztBQUNQLGFBQU8sS0FBS3JFLE1BQUwsRUFBYXVELEdBQWIsT0FBcUJjLEVBQUV4RCxJQUF2QixFQUErQixFQUFFeUQsUUFBUUQsRUFBRUUsS0FBWixFQUEvQixFQUNOekIsSUFETSxDQUNELFVBQUNVLFFBQUQsRUFBYztBQUNsQixlQUFPQSxTQUFTOUMsSUFBaEI7QUFDRCxPQUhNLENBQVA7QUFJRCIsImZpbGUiOiJzdG9yYWdlL3Jlc3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBheGlvcyBmcm9tICdheGlvcyc7XG5pbXBvcnQgbWVyZ2VPcHRpb25zIGZyb20gJ21lcmdlLW9wdGlvbnMnO1xuaW1wb3J0IHsgU3RvcmFnZSB9IGZyb20gJy4vc3RvcmFnZSc7XG5pbXBvcnQgeyAkc2VsZiB9IGZyb20gJy4uL21vZGVsJztcblxuY29uc3QgJGF4aW9zID0gU3ltYm9sKCckYXhpb3MnKTtcbmltcG9ydCBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcblxuZXhwb3J0IGNsYXNzIFJlc3RTdG9yYWdlIGV4dGVuZHMgU3RvcmFnZSB7XG5cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgc3VwZXIob3B0cyk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHtcbiAgICAgICAgYmFzZVVSTDogJ2h0dHA6Ly9sb2NhbGhvc3QvYXBpJyxcbiAgICAgIH0sXG4gICAgICBvcHRzXG4gICAgKTtcbiAgICB0aGlzWyRheGlvc10gPSBvcHRpb25zLmF4aW9zIHx8IGF4aW9zLmNyZWF0ZShvcHRpb25zKTtcbiAgfVxuXG4gIHJlc3Qob3B0aW9ucykge1xuICAgIHJldHVybiB0aGlzWyRheGlvc10ob3B0aW9ucyk7XG4gIH1cblxuICBwYXJzZUpTT05BcGlSZWxhdGlvbnNoaXBzKGpzb24pIHtcbiAgICBjb25zdCBkYXRhID0gdHlwZW9mIGpzb24gPT09ICdzdHJpbmcnID8gSlNPTi5wYXJzZShqc29uKSA6IGpzb247XG4gICAgY29uc3QgdHlwZSA9IHRoaXMudHlwZShkYXRhLmRhdGEudHlwZSk7XG5cbiAgICByZXR1cm4gT2JqZWN0LmtleXMoZGF0YS5yZWxhdGlvbnNoaXBzKS5tYXAocmVsTmFtZSA9PiB7XG4gICAgICBjb25zdCByZWxhdGlvbnNoaXAgPSB0eXBlLiRmaWVsZHNbcmVsTmFtZV0ucmVsYXRpb25zaGlwO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgW3JlbE5hbWVdOiBkYXRhLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0uZGF0YS5tYXAoY2hpbGQgPT4ge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBbcmVsYXRpb25zaGlwLiRzaWRlc1tyZWxOYW1lXS5zZWxmLmZpZWxkXTogZGF0YS5pZCxcbiAgICAgICAgICAgIFtyZWxhdGlvbnNoaXAuJHNpZGVzW3JlbE5hbWVdLm90aGVyLmZpZWxkXTogY2hpbGQuaWQsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSksXG4gICAgICB9O1xuICAgIH0pLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBtZXJnZU9wdGlvbnMoYWNjLCBjdXJyKSwge30pO1xuICB9XG5cbiAgcGFyc2VKU09OQXBpKGpzb24pIHtcbiAgICBjb25zdCBkYXRhID0gdHlwZW9mIGpzb24gPT09ICdzdHJpbmcnID8gSlNPTi5wYXJzZShqc29uKSA6IGpzb247XG4gICAgY29uc3QgdHlwZSA9IHRoaXMudHlwZShkYXRhLmRhdGEudHlwZSk7XG4gICAgY29uc3QgcmVsYXRpb25zaGlwcyA9IHRoaXMucGFyc2VKU09OQXBpUmVsYXRpb25zaGlwcyhkYXRhLnJlbGF0aW9uc2hpcHMpO1xuXG4gICAgY29uc3QgcmVxdWVzdGVkID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHtcbiAgICAgICAgW3R5cGUuJGlkXTogZGF0YS5pZCxcbiAgICAgIH0sXG4gICAgICBkYXRhLmF0dHJpYnV0ZXMsXG4gICAgICByZWxhdGlvbnNoaXBzXG4gICAgKTtcbiAgICB0aGlzLnNhdmUoKTtcblxuICAgIGRhdGEuaW5jbHVkZWQuZm9yRWFjaChpbmNsdXNpb24gPT4ge1xuICAgICAgY29uc3QgY2hpbGRUeXBlID0gdGhpcy50eXBlKGluY2x1c2lvbi50eXBlKTtcbiAgICAgIGNvbnN0IGNoaWxkSWQgPSBpbmNsdXNpb24uaWQ7XG4gICAgICBjb25zdCBjaGlsZERhdGEgPSBPYmplY3QuYXNzaWduKFxuICAgICAgICB7fSxcbiAgICAgICAgaW5jbHVzaW9uLmF0dHJpYnV0ZXMsXG4gICAgICAgIHRoaXMucGFyc2VKU09OQXBpUmVsYXRpb25zaGlwcyhpbmNsdXNpb24ucmVsYXRpb25zaGlwcylcbiAgICAgICk7XG4gICAgICBjb25zdCB1cGRhdGVkRmllbGRzID0gWyRzZWxmXS5jb25jYXQoT2JqZWN0LmtleXMoaW5jbHVzaW9uLnJlbGF0aW9uc2hpcHMpKTtcblxuICAgICAgdGhpcy5ub3RpZnlVcGRhdGUoY2hpbGRUeXBlLCBjaGlsZElkLCBjaGlsZERhdGEsIHVwZGF0ZWRGaWVsZHMpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlcXVlc3RlZDtcbiAgfVxuXG4gIHdyaXRlKHQsIHYpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBpZiAodlt0LiRpZF0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5wYXRjaChgLyR7dC4kbmFtZX0vJHt2W3QuJGlkXX1gLCB2KTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy50ZXJtaW5hbCkge1xuICAgICAgICByZXR1cm4gdGhpc1skYXhpb3NdLnBvc3QoYC8ke3QuJG5hbWV9YCwgdik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgbmV3IGNvbnRlbnQgaW4gYSBub24tdGVybWluYWwgc3RvcmUnKTtcbiAgICAgIH1cbiAgICB9KVxuICAgIC50aGVuKChkKSA9PiB0aGlzLnBhcnNlSlNPTkFwaShkLmRhdGEpKSAvLyBmb3JtZXJseSBkLmRhdGFbdC4kbmFtZV1bMF1cbiAgICAudGhlbigocmVzdWx0KSA9PiB0aGlzLm5vdGlmeVVwZGF0ZSh0LCByZXN1bHRbdC4kaWRdLCByZXN1bHQpLnRoZW4oKCkgPT4gcmVzdWx0KSk7XG4gIH1cblxuICAvLyBUT0RPOiBOQVRFIFJFV1JJVEUgSE9XIFJFU1BPTlNFIElTIFBBUlNFRFxuICByZWFkT25lKHQsIGlkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4gdGhpc1skYXhpb3NdLmdldChgLyR7dC4kbmFtZX0vJHtpZH1gKSlcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlSlNPTkFwaShyZXNwb25zZS5kYXRhKTsgLy8gZm9ybWVybHkgcmVzcG9uc2UuZGF0YVt0LiRuYW1lXVswXTtcbiAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyLnJlc3BvbnNlICYmIGVyci5yZXNwb25zZS5zdGF0dXMgPT09IDQwNCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHJlYWRNYW55KHQsIGlkLCByZWxhdGlvbnNoaXApIHtcbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLmdldChgLyR7dC4kbmFtZX0vJHtpZH0vJHtyZWxhdGlvbnNoaXB9YClcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHJlc3BvbnNlLmRhdGEpXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGlmIChlcnIucmVzcG9uc2UgJiYgZXJyLnJlc3BvbnNlLnN0YXR1cyA9PT0gNDA0KSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGFkZCh0eXBlLCBpZCwgcmVsYXRpb25zaGlwVGl0bGUsIGNoaWxkSWQsIGV4dHJhcykge1xuICAgIGNvbnN0IHJlbGF0aW9uc2hpcEJsb2NrID0gdHlwZS4kZmllbGRzW3JlbGF0aW9uc2hpcFRpdGxlXTtcbiAgICBjb25zdCBzaWRlSW5mbyA9IHJlbGF0aW9uc2hpcEJsb2NrLnJlbGF0aW9uc2hpcC4kc2lkZXNbcmVsYXRpb25zaGlwVGl0bGVdO1xuICAgIGNvbnN0IG5ld0ZpZWxkID0geyBbc2lkZUluZm8uc2VsZi5maWVsZF06IGlkLCBbc2lkZUluZm8ub3RoZXIuZmllbGRdOiBjaGlsZElkIH07XG4gICAgaWYgKHJlbGF0aW9uc2hpcEJsb2NrLnJlbGF0aW9uc2hpcC4kZXh0cmFzKSB7XG4gICAgICBPYmplY3Qua2V5cyhyZWxhdGlvbnNoaXBCbG9jay5yZWxhdGlvbnNoaXAuJGV4dHJhcykuZm9yRWFjaCgoZXh0cmEpID0+IHtcbiAgICAgICAgbmV3RmllbGRbZXh0cmFdID0gZXh0cmFzW2V4dHJhXTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLnB1dChgLyR7dHlwZS4kbmFtZX0vJHtpZH0vJHtyZWxhdGlvbnNoaXBUaXRsZX1gLCBuZXdGaWVsZClcbiAgICAudGhlbigoKSA9PiB0aGlzLm5vdGlmeVVwZGF0ZSh0eXBlLCBpZCwgbnVsbCwgcmVsYXRpb25zaGlwVGl0bGUpKTtcbiAgfVxuXG4gIHJlbW92ZSh0LCBpZCwgcmVsYXRpb25zaGlwVGl0bGUsIGNoaWxkSWQpIHtcbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLmRlbGV0ZShgLyR7dC4kbmFtZX0vJHtpZH0vJHtyZWxhdGlvbnNoaXBUaXRsZX0vJHtjaGlsZElkfWApXG4gICAgLnRoZW4oKCkgPT4gdGhpcy5ub3RpZnlVcGRhdGUodCwgaWQsIG51bGwsIHJlbGF0aW9uc2hpcFRpdGxlKSk7XG4gIH1cblxuICBtb2RpZnlSZWxhdGlvbnNoaXAodCwgaWQsIHJlbGF0aW9uc2hpcFRpdGxlLCBjaGlsZElkLCBleHRyYXMpIHtcbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLnBhdGNoKGAvJHt0LiRuYW1lfS8ke2lkfS8ke3JlbGF0aW9uc2hpcFRpdGxlfS8ke2NoaWxkSWR9YCwgZXh0cmFzKVxuICAgIC50aGVuKCgpID0+IHRoaXMubm90aWZ5VXBkYXRlKHQsIGlkLCBudWxsLCByZWxhdGlvbnNoaXBUaXRsZSkpO1xuICB9XG5cbiAgZGVsZXRlKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5kZWxldGUoYC8ke3QuJG5hbWV9LyR7aWR9YClcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgIH0pO1xuICB9XG5cbiAgcXVlcnkocSkge1xuICAgIHJldHVybiB0aGlzWyRheGlvc10uZ2V0KGAvJHtxLnR5cGV9YCwgeyBwYXJhbXM6IHEucXVlcnkgfSlcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgIH0pO1xuICB9XG59XG4iXX0=
