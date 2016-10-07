'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Datastore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _model = require('./model');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $types = Symbol('$types');
var $storage = Symbol('$storage');

var Datastore = exports.Datastore = function () {
  function Datastore() {
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Datastore);

    this[$storage] = opts.storage.concat();
    this[$types] = {};
    this.Base = _model.Model;
    this.Base.$storage = this[$storage];
  }

  _createClass(Datastore, [{
    key: 'defineType',
    value: function defineType(type) {
      if (this[$types][type.$name] !== undefined) {
        throw new Error('Duplicate type definition ' + type.$name);
      }
      this[$types][type.$name] = type;
    }
  }, {
    key: 'getType',
    value: function getType(type) {
      return this[$types][type];
    }
  }, {
    key: 'getStorage',
    value: function getStorage() {
      return this[$storage];
    }
  }, {
    key: 'find',
    value: function find(type, id) {
      var Type = this[$types][type];
      return new Type(_defineProperty({}, Type.$id, id));
    }
  }]);

  return Datastore;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRhdGFTdG9yZS5qcyJdLCJuYW1lcyI6WyIkdHlwZXMiLCJTeW1ib2wiLCIkc3RvcmFnZSIsIkRhdGFzdG9yZSIsIm9wdHMiLCJzdG9yYWdlIiwiY29uY2F0IiwiQmFzZSIsInR5cGUiLCIkbmFtZSIsInVuZGVmaW5lZCIsIkVycm9yIiwiaWQiLCJUeXBlIiwiJGlkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7Ozs7O0FBRUEsSUFBTUEsU0FBU0MsT0FBTyxRQUFQLENBQWY7QUFDQSxJQUFNQyxXQUFXRCxPQUFPLFVBQVAsQ0FBakI7O0lBRWFFLFMsV0FBQUEsUztBQUNYLHVCQUF1QjtBQUFBLFFBQVhDLElBQVcseURBQUosRUFBSTs7QUFBQTs7QUFDckIsU0FBS0YsUUFBTCxJQUFpQkUsS0FBS0MsT0FBTCxDQUFhQyxNQUFiLEVBQWpCO0FBQ0EsU0FBS04sTUFBTCxJQUFlLEVBQWY7QUFDQSxTQUFLTyxJQUFMO0FBQ0EsU0FBS0EsSUFBTCxDQUFVTCxRQUFWLEdBQXFCLEtBQUtBLFFBQUwsQ0FBckI7QUFDRDs7OzsrQkFDVU0sSSxFQUFNO0FBQ2YsVUFBSSxLQUFLUixNQUFMLEVBQWFRLEtBQUtDLEtBQWxCLE1BQTZCQyxTQUFqQyxFQUE0QztBQUMxQyxjQUFNLElBQUlDLEtBQUosZ0NBQXVDSCxLQUFLQyxLQUE1QyxDQUFOO0FBQ0Q7QUFDRCxXQUFLVCxNQUFMLEVBQWFRLEtBQUtDLEtBQWxCLElBQTJCRCxJQUEzQjtBQUNEOzs7NEJBQ09BLEksRUFBTTtBQUNaLGFBQU8sS0FBS1IsTUFBTCxFQUFhUSxJQUFiLENBQVA7QUFDRDs7O2lDQUNZO0FBQ1gsYUFBTyxLQUFLTixRQUFMLENBQVA7QUFDRDs7O3lCQUNJTSxJLEVBQU1JLEUsRUFBSTtBQUNiLFVBQU1DLE9BQU8sS0FBS2IsTUFBTCxFQUFhUSxJQUFiLENBQWI7QUFDQSxhQUFPLElBQUlLLElBQUoscUJBQ0pBLEtBQUtDLEdBREQsRUFDT0YsRUFEUCxFQUFQO0FBR0QiLCJmaWxlIjoiZGF0YVN0b3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtNb2RlbH0gZnJvbSAnLi9tb2RlbCc7XG5cbmNvbnN0ICR0eXBlcyA9IFN5bWJvbCgnJHR5cGVzJyk7XG5jb25zdCAkc3RvcmFnZSA9IFN5bWJvbCgnJHN0b3JhZ2UnKTtcblxuZXhwb3J0IGNsYXNzIERhdGFzdG9yZSB7XG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIHRoaXNbJHN0b3JhZ2VdID0gb3B0cy5zdG9yYWdlLmNvbmNhdCgpO1xuICAgIHRoaXNbJHR5cGVzXSA9IHt9O1xuICAgIHRoaXMuQmFzZSA9IE1vZGVsO1xuICAgIHRoaXMuQmFzZS4kc3RvcmFnZSA9IHRoaXNbJHN0b3JhZ2VdO1xuICB9XG4gIGRlZmluZVR5cGUodHlwZSkge1xuICAgIGlmICh0aGlzWyR0eXBlc11bdHlwZS4kbmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBEdXBsaWNhdGUgdHlwZSBkZWZpbml0aW9uICR7dHlwZS4kbmFtZX1gKTtcbiAgICB9XG4gICAgdGhpc1skdHlwZXNdW3R5cGUuJG5hbWVdID0gdHlwZTtcbiAgfVxuICBnZXRUeXBlKHR5cGUpIHtcbiAgICByZXR1cm4gdGhpc1skdHlwZXNdW3R5cGVdO1xuICB9XG4gIGdldFN0b3JhZ2UoKSB7XG4gICAgcmV0dXJuIHRoaXNbJHN0b3JhZ2VdO1xuICB9XG4gIGZpbmQodHlwZSwgaWQpIHtcbiAgICBjb25zdCBUeXBlID0gdGhpc1skdHlwZXNdW3R5cGVdO1xuICAgIHJldHVybiBuZXcgVHlwZSh7XG4gICAgICBbVHlwZS4kaWRdOiBpZCxcbiAgICB9KTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
