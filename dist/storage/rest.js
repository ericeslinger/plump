'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RestStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _axios = require('axios');

var axios = _interopRequireWildcard(_axios);

var _storage = require('./storage');

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
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, RestStorage);

    var _this = _possibleConstructorReturn(this, (RestStorage.__proto__ || Object.getPrototypeOf(RestStorage)).call(this, opts));

    var options = Object.assign({}, {
      baseURL: 'http://localhost/api'
    }, opts);
    _this[$axios] = options.axios || axios.create(options);
    return _this;
  }

  _createClass(RestStorage, [{
    key: 'onCacheableRead',
    value: function onCacheableRead() {}
  }, {
    key: 'write',
    value: function write(t, v) {
      var _this2 = this;

      return _bluebird2.default.resolve().then(function () {
        if (v[t.$id]) {
          return _this2[$axios].patch('/' + t.$name + '/' + v[t.$id], v);
        } else {
          if (_this2.terminal) {
            return _this2[$axios].post('/' + t.$name, v);
          } else {
            throw new Error('Cannot create new content in a non-terminal store');
          }
        }
      }).then(function (d) {
        return d.data[t.$name][0];
      });
    }
  }, {
    key: 'readOne',
    value: function readOne(t, id) {
      return this[$axios].get('/' + t.$name + '/' + id).then(function (response) {
        return response.data[t.$name][0];
      }).catch(function (err) {
        if (err === 404) {
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
      });
    }
  }, {
    key: 'add',
    value: function add(t, id, relationship, childId, extras) {
      var _newField;

      var Rel = t.$fields[relationship].relationship;
      var otherField = Rel.$sides[relationship];
      var selfField = Rel.otherType(relationship);
      var newField = (_newField = {}, _defineProperty(_newField, selfField.field, id), _defineProperty(_newField, otherField.field, childId), _newField);
      (Rel.$extras || []).forEach(function (e) {
        newField[e] = extras[e];
      });
      return this[$axios].put('/' + t.$name + '/' + id + '/' + relationship, newField);
    }
  }, {
    key: 'remove',
    value: function remove(t, id, relationship, childId) {
      return this[$axios].delete('/' + t.$name + '/' + id + '/' + relationship + '/' + childId);
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(t, id, relationship, childId, extras) {
      return this[$axios].patch('/' + t.$name + '/' + id + '/' + relationship + '/' + childId, extras);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvcmVzdC5qcyJdLCJuYW1lcyI6WyJheGlvcyIsIiRheGlvcyIsIlN5bWJvbCIsIlJlc3RTdG9yYWdlIiwib3B0cyIsIm9wdGlvbnMiLCJPYmplY3QiLCJhc3NpZ24iLCJiYXNlVVJMIiwiY3JlYXRlIiwidCIsInYiLCJyZXNvbHZlIiwidGhlbiIsIiRpZCIsInBhdGNoIiwiJG5hbWUiLCJ0ZXJtaW5hbCIsInBvc3QiLCJFcnJvciIsImQiLCJkYXRhIiwiaWQiLCJnZXQiLCJyZXNwb25zZSIsImNhdGNoIiwiZXJyIiwicmVsYXRpb25zaGlwIiwiY2hpbGRJZCIsImV4dHJhcyIsIlJlbCIsIiRmaWVsZHMiLCJvdGhlckZpZWxkIiwiJHNpZGVzIiwic2VsZkZpZWxkIiwib3RoZXJUeXBlIiwibmV3RmllbGQiLCJmaWVsZCIsIiRleHRyYXMiLCJmb3JFYWNoIiwiZSIsInB1dCIsImRlbGV0ZSIsInEiLCJ0eXBlIiwicGFyYW1zIiwicXVlcnkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQUFZQSxLOztBQUNaOztBQUdBOzs7Ozs7Ozs7Ozs7Ozs7O0FBREEsSUFBTUMsU0FBU0MsT0FBTyxRQUFQLENBQWY7O0lBR2FDLFcsV0FBQUEsVzs7O0FBRVgseUJBQXVCO0FBQUEsUUFBWEMsSUFBVyx5REFBSixFQUFJOztBQUFBOztBQUFBLDBIQUNmQSxJQURlOztBQUVyQixRQUFNQyxVQUFVQyxPQUFPQyxNQUFQLENBQ2QsRUFEYyxFQUVkO0FBQ0VDLGVBQVM7QUFEWCxLQUZjLEVBS2RKLElBTGMsQ0FBaEI7QUFPQSxVQUFLSCxNQUFMLElBQWVJLFFBQVFMLEtBQVIsSUFBaUJBLE1BQU1TLE1BQU4sQ0FBYUosT0FBYixDQUFoQztBQVRxQjtBQVV0Qjs7OztzQ0FFaUIsQ0FBRTs7OzBCQUVkSyxDLEVBQUdDLEMsRUFBRztBQUFBOztBQUNWLGFBQU8sbUJBQVFDLE9BQVIsR0FDTkMsSUFETSxDQUNELFlBQU07QUFDVixZQUFJRixFQUFFRCxFQUFFSSxH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QixTQUFtQ00sRUFBbkMsRUFDTlQsSUFETSxDQUNELFVBQUNXLFFBQUQsRUFBYztBQUNsQixlQUFPQSxTQUFTSCxJQUFoQjtBQUNELE9BSE0sQ0FBUDtBQUlEOzs7MEJBRUtzQixDLEVBQUc7QUFDUCxhQUFPLEtBQUsxQyxNQUFMLEVBQWFzQixHQUFiLE9BQXFCb0IsRUFBRUMsSUFBdkIsRUFBK0IsRUFBQ0MsUUFBUUYsRUFBRUcsS0FBWCxFQUEvQixFQUNOakMsSUFETSxDQUNELFVBQUNXLFFBQUQsRUFBYztBQUNsQixlQUFPQSxTQUFTSCxJQUFoQjtBQUNELE9BSE0sQ0FBUDtBQUlEIiwiZmlsZSI6InN0b3JhZ2UvcmVzdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF4aW9zIGZyb20gJ2F4aW9zJztcbmltcG9ydCB7U3RvcmFnZX0gZnJvbSAnLi9zdG9yYWdlJztcblxuY29uc3QgJGF4aW9zID0gU3ltYm9sKCckYXhpb3MnKTtcbmltcG9ydCBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcblxuZXhwb3J0IGNsYXNzIFJlc3RTdG9yYWdlIGV4dGVuZHMgU3RvcmFnZSB7XG5cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgc3VwZXIob3B0cyk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHtcbiAgICAgICAgYmFzZVVSTDogJ2h0dHA6Ly9sb2NhbGhvc3QvYXBpJyxcbiAgICAgIH0sXG4gICAgICBvcHRzXG4gICAgKTtcbiAgICB0aGlzWyRheGlvc10gPSBvcHRpb25zLmF4aW9zIHx8IGF4aW9zLmNyZWF0ZShvcHRpb25zKTtcbiAgfVxuXG4gIG9uQ2FjaGVhYmxlUmVhZCgpIHt9XG5cbiAgd3JpdGUodCwgdikge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmICh2W3QuJGlkXSkge1xuICAgICAgICByZXR1cm4gdGhpc1skYXhpb3NdLnBhdGNoKGAvJHt0LiRuYW1lfS8ke3ZbdC4kaWRdfWAsIHYpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc1skYXhpb3NdLnBvc3QoYC8ke3QuJG5hbWV9YCwgdik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIG5ldyBjb250ZW50IGluIGEgbm9uLXRlcm1pbmFsIHN0b3JlJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KS50aGVuKChkKSA9PiBkLmRhdGFbdC4kbmFtZV1bMF0pO1xuICB9XG5cbiAgcmVhZE9uZSh0LCBpZCkge1xuICAgIHJldHVybiB0aGlzWyRheGlvc10uZ2V0KGAvJHt0LiRuYW1lfS8ke2lkfWApXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YVt0LiRuYW1lXVswXTtcbiAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyID09PSA0MDQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZWFkTWFueSh0LCBpZCwgcmVsYXRpb25zaGlwKSB7XG4gICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5nZXQoYC8ke3QuJG5hbWV9LyR7aWR9LyR7cmVsYXRpb25zaGlwfWApXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiByZXNwb25zZS5kYXRhKTtcbiAgfVxuXG4gIGFkZCh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkLCBleHRyYXMpIHtcbiAgICBjb25zdCBSZWwgPSB0LiRmaWVsZHNbcmVsYXRpb25zaGlwXS5yZWxhdGlvbnNoaXA7XG4gICAgY29uc3Qgb3RoZXJGaWVsZCA9IFJlbC4kc2lkZXNbcmVsYXRpb25zaGlwXTtcbiAgICBjb25zdCBzZWxmRmllbGQgPSBSZWwub3RoZXJUeXBlKHJlbGF0aW9uc2hpcCk7XG4gICAgY29uc3QgbmV3RmllbGQgPSB7W3NlbGZGaWVsZC5maWVsZF06IGlkLCBbb3RoZXJGaWVsZC5maWVsZF06IGNoaWxkSWR9O1xuICAgIChSZWwuJGV4dHJhcyB8fCBbXSkuZm9yRWFjaCgoZSkgPT4ge1xuICAgICAgbmV3RmllbGRbZV0gPSBleHRyYXNbZV07XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5wdXQoYC8ke3QuJG5hbWV9LyR7aWR9LyR7cmVsYXRpb25zaGlwfWAsIG5ld0ZpZWxkKTtcbiAgfVxuXG4gIHJlbW92ZSh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKSB7XG4gICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5kZWxldGUoYC8ke3QuJG5hbWV9LyR7aWR9LyR7cmVsYXRpb25zaGlwfS8ke2NoaWxkSWR9YCk7XG4gIH1cblxuICBtb2RpZnlSZWxhdGlvbnNoaXAodCwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCwgZXh0cmFzKSB7XG4gICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5wYXRjaChgLyR7dC4kbmFtZX0vJHtpZH0vJHtyZWxhdGlvbnNoaXB9LyR7Y2hpbGRJZH1gLCBleHRyYXMpO1xuICB9XG5cbiAgZGVsZXRlKHQsIGlkKSB7XG4gICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5kZWxldGUoYC8ke3QuJG5hbWV9LyR7aWR9YClcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgIH0pO1xuICB9XG5cbiAgcXVlcnkocSkge1xuICAgIHJldHVybiB0aGlzWyRheGlvc10uZ2V0KGAvJHtxLnR5cGV9YCwge3BhcmFtczogcS5xdWVyeX0pXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICB9KTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
