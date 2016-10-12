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
    key: 'read',
    value: function read(t, id, relationship) {
      if (!relationship) {
        return this[$axios].get('/' + t.$name + '/' + id).then(function (response) {
          return response.data[t.$name][0];
        }).catch(function (err) {
          if (err === 404) {
            return null;
          } else {
            throw err;
          }
        });
      } else {
        return this[$axios].get('/' + t.$name + '/' + id + '/' + relationship).then(function (response) {
          return response.data;
        });
      }
      // TODO: cacheable read
      // {
      //   const retVal = {
      //     main: ,
      //     extra: [],
      //   };
      //   Object.keys(response.data).forEach((typeName) => {
      //     retVal.extra.concat(response.data[typeName].map((d) => {
      //       if ((d[t.$id] === id) && (typeName === t.$name)) {
      //         return null;
      //       } else {
      //         return Object.assign({}, {typeName}, d);
      //       }
      //     }).filter((v) => v !== null));
      //   });
      //   return retVal;
      // });
    }
  }, {
    key: 'add',
    value: function add(t, id, relationship, childId) {
      return this[$axios].put('/' + t.$name + '/' + id + '/' + relationship, childId);
    }
  }, {
    key: 'remove',
    value: function remove(t, id, relationship, childId) {
      return this[$axios].delete('/' + t.$name + '/' + id + '/' + relationship + '/' + childId);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvcmVzdC5qcyJdLCJuYW1lcyI6WyJheGlvcyIsIiRheGlvcyIsIlN5bWJvbCIsIlJlc3RTdG9yYWdlIiwib3B0cyIsIm9wdGlvbnMiLCJPYmplY3QiLCJhc3NpZ24iLCJiYXNlVVJMIiwiY3JlYXRlIiwidCIsInYiLCJyZXNvbHZlIiwidGhlbiIsIiRpZCIsInBhdGNoIiwiJG5hbWUiLCJ0ZXJtaW5hbCIsInBvc3QiLCJFcnJvciIsImQiLCJkYXRhIiwiaWQiLCJyZWxhdGlvbnNoaXAiLCJnZXQiLCJyZXNwb25zZSIsImNhdGNoIiwiZXJyIiwiY2hpbGRJZCIsInB1dCIsImRlbGV0ZSIsInEiLCJ0eXBlIiwicGFyYW1zIiwicXVlcnkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQUFZQSxLOztBQUNaOztBQUdBOzs7Ozs7Ozs7Ozs7OztBQURBLElBQU1DLFNBQVNDLE9BQU8sUUFBUCxDQUFmOztJQUdhQyxXLFdBQUFBLFc7OztBQUVYLHlCQUF1QjtBQUFBLFFBQVhDLElBQVcseURBQUosRUFBSTs7QUFBQTs7QUFBQSwwSEFDZkEsSUFEZTs7QUFFckIsUUFBTUMsVUFBVUMsT0FBT0MsTUFBUCxDQUNkLEVBRGMsRUFFZDtBQUNFQyxlQUFTO0FBRFgsS0FGYyxFQUtkSixJQUxjLENBQWhCO0FBT0EsVUFBS0gsTUFBTCxJQUFlSSxRQUFRTCxLQUFSLElBQWlCQSxNQUFNUyxNQUFOLENBQWFKLE9BQWIsQ0FBaEM7QUFUcUI7QUFVdEI7Ozs7c0NBRWlCLENBQUU7OzswQkFFZEssQyxFQUFHQyxDLEVBQUc7QUFBQTs7QUFDVixhQUFPLG1CQUFRQyxPQUFSLEdBQ05DLElBRE0sQ0FDRCxZQUFNO0FBQ1YsWUFBSUYsRUFBRUQsRUFBRUksR0FBSixDQUFKLEVBQWM7QUFDWixpQkFBTyxPQUFLYixNQUFMLEVBQWFjLEtBQWIsT0FBdUJMLEVBQUVNLEtBQXpCLFNBQWtDTCxFQUFFRCxFQUFFSSxHQUFKLENBQWxDLEVBQThDSCxDQUE5QyxDQUFQO0FBQ0QsU0FGRCxNQUVPO0FBQ0wsY0FBSSxPQUFLTSxRQUFULEVBQW1CO0FBQ2pCLG1CQUFPLE9BQUtoQixNQUFMLEVBQWFpQixJQUFiLE9BQXNCUixFQUFFTSxLQUF4QixFQUFpQ0wsQ0FBakMsQ0FBUDtBQUNELFdBRkQsTUFFTztBQUNMLGtCQUFNLElBQUlRLEtBQUosQ0FBVSxtREFBVixDQUFOO0FBQ0Q7QUFDRjtBQUNGLE9BWE0sRUFXSk4sSUFYSSxDQVdDLFVBQUNPLENBQUQ7QUFBQSxlQUFPQSxFQUFFQyxJQUFGLENBQU9YLEVBQUVNLEtBQVQsRUFBZ0IsQ0FBaEIsQ0FBUDtBQUFBLE9BWEQsQ0FBUDtBQVlEOzs7eUJBRUlOLEMsRUFBR1ksRSxFQUFJQyxZLEVBQWM7QUFDeEIsVUFBSSxDQUFDQSxZQUFMLEVBQW1CO0FBQ2pCLGVBQU8sS0FBS3RCLE1BQUwsRUFBYXVCLEdBQWIsT0FBcUJkLEVBQUVNLEtBQXZCLFNBQWdDTSxFQUFoQyxFQUNOVCxJQURNLENBQ0QsVUFBQ1ksUUFBRCxFQUFjO0FBQ2xCLGlCQUFPQSxTQUFTSixJQUFULENBQWNYLEVBQUVNLEtBQWhCLEVBQXVCLENBQXZCLENBQVA7QUFDRCxTQUhNLEVBR0pVLEtBSEksQ0FHRSxVQUFDQyxHQUFELEVBQVM7QUFDaEIsY0FBSUEsUUFBUSxHQUFaLEVBQWlCO0FBQ2YsbUJBQU8sSUFBUDtBQUNELFdBRkQsTUFFTztBQUNMLGtCQUFNQSxHQUFOO0FBQ0Q7QUFDRixTQVRNLENBQVA7QUFVRCxPQVhELE1BV087QUFDTCxlQUFPLEtBQUsxQixNQUFMLEVBQWF1QixHQUFiLE9BQXFCZCxFQUFFTSxLQUF2QixTQUFnQ00sRUFBaEMsU0FBc0NDLFlBQXRDLEVBQ05WLElBRE0sQ0FDRCxVQUFDWSxRQUFEO0FBQUEsaUJBQWNBLFNBQVNKLElBQXZCO0FBQUEsU0FEQyxDQUFQO0FBRUQ7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Q7Ozt3QkFFR1gsQyxFQUFHWSxFLEVBQUlDLFksRUFBY0ssTyxFQUFTO0FBQ2hDLGFBQU8sS0FBSzNCLE1BQUwsRUFBYTRCLEdBQWIsT0FBcUJuQixFQUFFTSxLQUF2QixTQUFnQ00sRUFBaEMsU0FBc0NDLFlBQXRDLEVBQXNESyxPQUF0RCxDQUFQO0FBQ0Q7OzsyQkFFTWxCLEMsRUFBR1ksRSxFQUFJQyxZLEVBQWNLLE8sRUFBUztBQUNuQyxhQUFPLEtBQUszQixNQUFMLEVBQWE2QixNQUFiLE9BQXdCcEIsRUFBRU0sS0FBMUIsU0FBbUNNLEVBQW5DLFNBQXlDQyxZQUF6QyxTQUF5REssT0FBekQsQ0FBUDtBQUNEOzs7NEJBRU1sQixDLEVBQUdZLEUsRUFBSTtBQUNaLGFBQU8sS0FBS3JCLE1BQUwsRUFBYTZCLE1BQWIsT0FBd0JwQixFQUFFTSxLQUExQixTQUFtQ00sRUFBbkMsRUFDTlQsSUFETSxDQUNELFVBQUNZLFFBQUQsRUFBYztBQUNsQixlQUFPQSxTQUFTSixJQUFoQjtBQUNELE9BSE0sQ0FBUDtBQUlEOzs7MEJBRUtVLEMsRUFBRztBQUNQLGFBQU8sS0FBSzlCLE1BQUwsRUFBYXVCLEdBQWIsT0FBcUJPLEVBQUVDLElBQXZCLEVBQStCLEVBQUNDLFFBQVFGLEVBQUVHLEtBQVgsRUFBL0IsRUFDTnJCLElBRE0sQ0FDRCxVQUFDWSxRQUFELEVBQWM7QUFDbEIsZUFBT0EsU0FBU0osSUFBaEI7QUFDRCxPQUhNLENBQVA7QUFJRCIsImZpbGUiOiJzdG9yYWdlL3Jlc3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBheGlvcyBmcm9tICdheGlvcyc7XG5pbXBvcnQge1N0b3JhZ2V9IGZyb20gJy4vc3RvcmFnZSc7XG5cbmNvbnN0ICRheGlvcyA9IFN5bWJvbCgnJGF4aW9zJyk7XG5pbXBvcnQgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5cbmV4cG9ydCBjbGFzcyBSZXN0U3RvcmFnZSBleHRlbmRzIFN0b3JhZ2Uge1xuXG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIHN1cGVyKG9wdHMpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIGJhc2VVUkw6ICdodHRwOi8vbG9jYWxob3N0L2FwaScsXG4gICAgICB9LFxuICAgICAgb3B0c1xuICAgICk7XG4gICAgdGhpc1skYXhpb3NdID0gb3B0aW9ucy5heGlvcyB8fCBheGlvcy5jcmVhdGUob3B0aW9ucyk7XG4gIH1cblxuICBvbkNhY2hlYWJsZVJlYWQoKSB7fVxuXG4gIHdyaXRlKHQsIHYpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBpZiAodlt0LiRpZF0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5wYXRjaChgLyR7dC4kbmFtZX0vJHt2W3QuJGlkXX1gLCB2KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5wb3N0KGAvJHt0LiRuYW1lfWAsIHYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBuZXcgY29udGVudCBpbiBhIG5vbi10ZXJtaW5hbCBzdG9yZScpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkudGhlbigoZCkgPT4gZC5kYXRhW3QuJG5hbWVdWzBdKTtcbiAgfVxuXG4gIHJlYWQodCwgaWQsIHJlbGF0aW9uc2hpcCkge1xuICAgIGlmICghcmVsYXRpb25zaGlwKSB7XG4gICAgICByZXR1cm4gdGhpc1skYXhpb3NdLmdldChgLyR7dC4kbmFtZX0vJHtpZH1gKVxuICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhW3QuJG5hbWVdWzBdO1xuICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICBpZiAoZXJyID09PSA0MDQpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpc1skYXhpb3NdLmdldChgLyR7dC4kbmFtZX0vJHtpZH0vJHtyZWxhdGlvbnNoaXB9YClcbiAgICAgIC50aGVuKChyZXNwb25zZSkgPT4gcmVzcG9uc2UuZGF0YSk7XG4gICAgfVxuICAgIC8vIFRPRE86IGNhY2hlYWJsZSByZWFkXG4gICAgLy8ge1xuICAgIC8vICAgY29uc3QgcmV0VmFsID0ge1xuICAgIC8vICAgICBtYWluOiAsXG4gICAgLy8gICAgIGV4dHJhOiBbXSxcbiAgICAvLyAgIH07XG4gICAgLy8gICBPYmplY3Qua2V5cyhyZXNwb25zZS5kYXRhKS5mb3JFYWNoKCh0eXBlTmFtZSkgPT4ge1xuICAgIC8vICAgICByZXRWYWwuZXh0cmEuY29uY2F0KHJlc3BvbnNlLmRhdGFbdHlwZU5hbWVdLm1hcCgoZCkgPT4ge1xuICAgIC8vICAgICAgIGlmICgoZFt0LiRpZF0gPT09IGlkKSAmJiAodHlwZU5hbWUgPT09IHQuJG5hbWUpKSB7XG4gICAgLy8gICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAvLyAgICAgICB9IGVsc2Uge1xuICAgIC8vICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHt0eXBlTmFtZX0sIGQpO1xuICAgIC8vICAgICAgIH1cbiAgICAvLyAgICAgfSkuZmlsdGVyKCh2KSA9PiB2ICE9PSBudWxsKSk7XG4gICAgLy8gICB9KTtcbiAgICAvLyAgIHJldHVybiByZXRWYWw7XG4gICAgLy8gfSk7XG4gIH1cblxuICBhZGQodCwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCkge1xuICAgIHJldHVybiB0aGlzWyRheGlvc10ucHV0KGAvJHt0LiRuYW1lfS8ke2lkfS8ke3JlbGF0aW9uc2hpcH1gLCBjaGlsZElkKTtcbiAgfVxuXG4gIHJlbW92ZSh0LCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkKSB7XG4gICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5kZWxldGUoYC8ke3QuJG5hbWV9LyR7aWR9LyR7cmVsYXRpb25zaGlwfS8ke2NoaWxkSWR9YCk7XG4gIH1cblxuICBkZWxldGUodCwgaWQpIHtcbiAgICByZXR1cm4gdGhpc1skYXhpb3NdLmRlbGV0ZShgLyR7dC4kbmFtZX0vJHtpZH1gKVxuICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgfSk7XG4gIH1cblxuICBxdWVyeShxKSB7XG4gICAgcmV0dXJuIHRoaXNbJGF4aW9zXS5nZXQoYC8ke3EudHlwZX1gLCB7cGFyYW1zOiBxLnF1ZXJ5fSlcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgIH0pO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
