'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LocalForageStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _localforage = require('localforage');

var localforage = _interopRequireWildcard(_localforage);

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LocalForageStorage = exports.LocalForageStorage = function () {
  function LocalForageStorage() {
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, LocalForageStorage);

    localforage.config({
      name: opts.name || 'Trellis Storage',
      storeName: opts.storeName || 'localCache'
    });
  }

  _createClass(LocalForageStorage, [{
    key: 'create',
    value: function create(t, v) {
      if (v.id === undefined) {
        return Promise.reject('This service cannot allocate ID values');
      } else {
        return localforage.setItem(t + ':' + v.id, v);
      }
    }
  }, {
    key: 'read',
    value: function read(t, id) {
      return localforage.getItem(t + ':' + id);
    }
  }, {
    key: 'update',
    value: function update(t, id, v) {
      return this.create(t, v);
    }
  }, {
    key: 'delete',
    value: function _delete(t, id) {
      return localforage.removeItem(t + ':' + id);
    }
  }, {
    key: 'query',
    value: function query() {
      return Promise.reject('Query interface not supported on LocalForageStorage');
    }
  }]);

  return LocalForageStorage;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvbG9jYWxmb3JhZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0lBQVksVzs7QUFDWjs7SUFBWSxPOzs7Ozs7SUFFQyxrQixXQUFBLGtCO0FBRVgsZ0NBQXVCO0FBQUEsUUFBWCxJQUFXLHlEQUFKLEVBQUk7O0FBQUE7O0FBQ3JCLGdCQUFZLE1BQVosQ0FBbUI7QUFDakIsWUFBTSxLQUFLLElBQUwsSUFBYSxpQkFERjtBQUVqQixpQkFBVyxLQUFLLFNBQUwsSUFBa0I7QUFGWixLQUFuQjtBQUlEOzs7OzJCQUVNLEMsRUFBRyxDLEVBQUc7QUFDWCxVQUFJLEVBQUUsRUFBRixLQUFTLFNBQWIsRUFBd0I7QUFDdEIsZUFBTyxRQUFRLE1BQVIsQ0FBZSx3Q0FBZixDQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBTyxZQUFZLE9BQVosQ0FBdUIsQ0FBdkIsU0FBNEIsRUFBRSxFQUE5QixFQUFvQyxDQUFwQyxDQUFQO0FBQ0Q7QUFDRjs7O3lCQUVJLEMsRUFBRyxFLEVBQUk7QUFDVixhQUFPLFlBQVksT0FBWixDQUF1QixDQUF2QixTQUE0QixFQUE1QixDQUFQO0FBQ0Q7OzsyQkFFTSxDLEVBQUcsRSxFQUFJLEMsRUFBRztBQUNmLGFBQU8sS0FBSyxNQUFMLENBQVksQ0FBWixFQUFlLENBQWYsQ0FBUDtBQUNEOzs7NEJBRU0sQyxFQUFHLEUsRUFBSTtBQUNaLGFBQU8sWUFBWSxVQUFaLENBQTBCLENBQTFCLFNBQStCLEVBQS9CLENBQVA7QUFDRDs7OzRCQUVPO0FBQ04sYUFBTyxRQUFRLE1BQVIsQ0FBZSxxREFBZixDQUFQO0FBQ0QiLCJmaWxlIjoic3RvcmFnZS9sb2NhbGZvcmFnZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGxvY2FsZm9yYWdlIGZyb20gJ2xvY2FsZm9yYWdlJztcbmltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuXG5leHBvcnQgY2xhc3MgTG9jYWxGb3JhZ2VTdG9yYWdlIHtcblxuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBsb2NhbGZvcmFnZS5jb25maWcoe1xuICAgICAgbmFtZTogb3B0cy5uYW1lIHx8ICdUcmVsbGlzIFN0b3JhZ2UnLFxuICAgICAgc3RvcmVOYW1lOiBvcHRzLnN0b3JlTmFtZSB8fCAnbG9jYWxDYWNoZScsXG4gICAgfSk7XG4gIH1cblxuICBjcmVhdGUodCwgdikge1xuICAgIGlmICh2LmlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgnVGhpcyBzZXJ2aWNlIGNhbm5vdCBhbGxvY2F0ZSBJRCB2YWx1ZXMnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGxvY2FsZm9yYWdlLnNldEl0ZW0oYCR7dH06JHt2LmlkfWAsIHYpO1xuICAgIH1cbiAgfVxuXG4gIHJlYWQodCwgaWQpIHtcbiAgICByZXR1cm4gbG9jYWxmb3JhZ2UuZ2V0SXRlbShgJHt0fToke2lkfWApO1xuICB9XG5cbiAgdXBkYXRlKHQsIGlkLCB2KSB7XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlKHQsIHYpO1xuICB9XG5cbiAgZGVsZXRlKHQsIGlkKSB7XG4gICAgcmV0dXJuIGxvY2FsZm9yYWdlLnJlbW92ZUl0ZW0oYCR7dH06JHtpZH1gKTtcbiAgfVxuXG4gIHF1ZXJ5KCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgnUXVlcnkgaW50ZXJmYWNlIG5vdCBzdXBwb3J0ZWQgb24gTG9jYWxGb3JhZ2VTdG9yYWdlJyk7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
