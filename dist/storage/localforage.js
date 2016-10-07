'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LocalForageStorage = undefined;

var _localforage = require('localforage');

var localforage = _interopRequireWildcard(_localforage);

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _storage = require('./storage');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

class LocalForageStorage extends _storage.Storage {

  constructor(opts = {}) {
    super();
    this.isCache = true;
    localforage.config({
      name: opts.name || 'Trellis Storage',
      storeName: opts.storeName || 'localCache'
    });
  }

  create(t, v) {
    if (v.id === undefined) {
      return Promise.reject('This service cannot allocate ID values');
    } else {
      return localforage.setItem(`${ t }:${ v.id }`, v);
    }
  }

  read(t, id) {
    return localforage.getItem(`${ t }:${ id }`);
  }

  update(t, id, v) {
    return this.create(t, v);
  }

  delete(t, id) {
    return localforage.removeItem(`${ t }:${ id }`);
  }

  query() {
    return Promise.reject('Query interface not supported on LocalForageStorage');
  }
}
exports.LocalForageStorage = LocalForageStorage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UvbG9jYWxmb3JhZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztJQUFZLFc7O0FBQ1o7O0lBQVksTzs7QUFDWjs7OztBQUVPLE1BQU0sa0JBQU4sMEJBQXlDOztBQUU5QyxjQUFZLE9BQU8sRUFBbkIsRUFBdUI7QUFDckI7QUFDQSxTQUFLLE9BQUwsR0FBZSxJQUFmO0FBQ0EsZ0JBQVksTUFBWixDQUFtQjtBQUNqQixZQUFNLEtBQUssSUFBTCxJQUFhLGlCQURGO0FBRWpCLGlCQUFXLEtBQUssU0FBTCxJQUFrQjtBQUZaLEtBQW5CO0FBSUQ7O0FBRUQsU0FBTyxDQUFQLEVBQVUsQ0FBVixFQUFhO0FBQ1gsUUFBSSxFQUFFLEVBQUYsS0FBUyxTQUFiLEVBQXdCO0FBQ3RCLGFBQU8sUUFBUSxNQUFSLENBQWUsd0NBQWYsQ0FBUDtBQUNELEtBRkQsTUFFTztBQUNMLGFBQU8sWUFBWSxPQUFaLENBQXFCLElBQUUsQ0FBRSxNQUFHLEVBQUUsRUFBRyxHQUFqQyxFQUFvQyxDQUFwQyxDQUFQO0FBQ0Q7QUFDRjs7QUFFRCxPQUFLLENBQUwsRUFBUSxFQUFSLEVBQVk7QUFDVixXQUFPLFlBQVksT0FBWixDQUFxQixJQUFFLENBQUUsTUFBRyxFQUFHLEdBQS9CLENBQVA7QUFDRDs7QUFFRCxTQUFPLENBQVAsRUFBVSxFQUFWLEVBQWMsQ0FBZCxFQUFpQjtBQUNmLFdBQU8sS0FBSyxNQUFMLENBQVksQ0FBWixFQUFlLENBQWYsQ0FBUDtBQUNEOztBQUVELFNBQU8sQ0FBUCxFQUFVLEVBQVYsRUFBYztBQUNaLFdBQU8sWUFBWSxVQUFaLENBQXdCLElBQUUsQ0FBRSxNQUFHLEVBQUcsR0FBbEMsQ0FBUDtBQUNEOztBQUVELFVBQVE7QUFDTixXQUFPLFFBQVEsTUFBUixDQUFlLHFEQUFmLENBQVA7QUFDRDtBQWpDNkM7UUFBbkMsa0IsR0FBQSxrQiIsImZpbGUiOiJzdG9yYWdlL2xvY2FsZm9yYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgbG9jYWxmb3JhZ2UgZnJvbSAnbG9jYWxmb3JhZ2UnO1xuaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQge1N0b3JhZ2V9IGZyb20gJy4vc3RvcmFnZSc7XG5cbmV4cG9ydCBjbGFzcyBMb2NhbEZvcmFnZVN0b3JhZ2UgZXh0ZW5kcyBTdG9yYWdlIHtcblxuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuaXNDYWNoZSA9IHRydWU7XG4gICAgbG9jYWxmb3JhZ2UuY29uZmlnKHtcbiAgICAgIG5hbWU6IG9wdHMubmFtZSB8fCAnVHJlbGxpcyBTdG9yYWdlJyxcbiAgICAgIHN0b3JlTmFtZTogb3B0cy5zdG9yZU5hbWUgfHwgJ2xvY2FsQ2FjaGUnLFxuICAgIH0pO1xuICB9XG5cbiAgY3JlYXRlKHQsIHYpIHtcbiAgICBpZiAodi5pZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ1RoaXMgc2VydmljZSBjYW5ub3QgYWxsb2NhdGUgSUQgdmFsdWVzJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBsb2NhbGZvcmFnZS5zZXRJdGVtKGAke3R9OiR7di5pZH1gLCB2KTtcbiAgICB9XG4gIH1cblxuICByZWFkKHQsIGlkKSB7XG4gICAgcmV0dXJuIGxvY2FsZm9yYWdlLmdldEl0ZW0oYCR7dH06JHtpZH1gKTtcbiAgfVxuXG4gIHVwZGF0ZSh0LCBpZCwgdikge1xuICAgIHJldHVybiB0aGlzLmNyZWF0ZSh0LCB2KTtcbiAgfVxuXG4gIGRlbGV0ZSh0LCBpZCkge1xuICAgIHJldHVybiBsb2NhbGZvcmFnZS5yZW1vdmVJdGVtKGAke3R9OiR7aWR9YCk7XG4gIH1cblxuICBxdWVyeSgpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ1F1ZXJ5IGludGVyZmFjZSBub3Qgc3VwcG9ydGVkIG9uIExvY2FsRm9yYWdlU3RvcmFnZScpO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
