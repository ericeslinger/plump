'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var typeAccessor = Symbol('$types');

var Datastore = exports.Datastore = function () {
  function Datastore() {
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Datastore);

    this.$storage = opts.storage.concat();
    this[typeAccessor] = {};
  }

  _createClass(Datastore, [{
    key: 'defineType',
    value: function defineType(type) {
      if (this[typeAccessor][type.name] !== undefined) {
        throw new Error('Duplicate type definition ' + type.name);
      }
      this[typeAccessor][type.name] = type;
    }
  }, {
    key: 'getType',
    value: function getType(type) {
      return this[typeAccessor][type];
    }
  }]);

  return Datastore;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRhdGFTdG9yZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsSUFBTSxlQUFlLE9BQU8sUUFBUCxDQUFyQjs7SUFFYSxTLFdBQUEsUztBQUNYLHVCQUF1QjtBQUFBLFFBQVgsSUFBVyx5REFBSixFQUFJOztBQUFBOztBQUNyQixTQUFLLFFBQUwsR0FBZ0IsS0FBSyxPQUFMLENBQWEsTUFBYixFQUFoQjtBQUNBLFNBQUssWUFBTCxJQUFxQixFQUFyQjtBQUNEOzs7OytCQUNVLEksRUFBTTtBQUNmLFVBQUksS0FBSyxZQUFMLEVBQW1CLEtBQUssSUFBeEIsTUFBa0MsU0FBdEMsRUFBaUQ7QUFDL0MsY0FBTSxJQUFJLEtBQUosZ0NBQXVDLEtBQUssSUFBNUMsQ0FBTjtBQUNEO0FBQ0QsV0FBSyxZQUFMLEVBQW1CLEtBQUssSUFBeEIsSUFBZ0MsSUFBaEM7QUFDRDs7OzRCQUNPLEksRUFBTTtBQUNaLGFBQU8sS0FBSyxZQUFMLEVBQW1CLElBQW5CLENBQVA7QUFDRCIsImZpbGUiOiJkYXRhU3RvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB0eXBlQWNjZXNzb3IgPSBTeW1ib2woJyR0eXBlcycpO1xuXG5leHBvcnQgY2xhc3MgRGF0YXN0b3JlIHtcbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgdGhpcy4kc3RvcmFnZSA9IG9wdHMuc3RvcmFnZS5jb25jYXQoKTtcbiAgICB0aGlzW3R5cGVBY2Nlc3Nvcl0gPSB7fTtcbiAgfVxuICBkZWZpbmVUeXBlKHR5cGUpIHtcbiAgICBpZiAodGhpc1t0eXBlQWNjZXNzb3JdW3R5cGUubmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBEdXBsaWNhdGUgdHlwZSBkZWZpbml0aW9uICR7dHlwZS5uYW1lfWApO1xuICAgIH1cbiAgICB0aGlzW3R5cGVBY2Nlc3Nvcl1bdHlwZS5uYW1lXSA9IHR5cGU7XG4gIH1cbiAgZ2V0VHlwZSh0eXBlKSB7XG4gICAgcmV0dXJuIHRoaXNbdHlwZUFjY2Vzc29yXVt0eXBlXTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
