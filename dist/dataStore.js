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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRhdGFTdG9yZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7Ozs7O0FBRUEsSUFBTSxTQUFTLE9BQU8sUUFBUCxDQUFmO0FBQ0EsSUFBTSxXQUFXLE9BQU8sVUFBUCxDQUFqQjs7SUFFYSxTLFdBQUEsUztBQUNYLHVCQUF1QjtBQUFBLFFBQVgsSUFBVyx5REFBSixFQUFJOztBQUFBOztBQUNyQixTQUFLLFFBQUwsSUFBaUIsS0FBSyxPQUFMLENBQWEsTUFBYixFQUFqQjtBQUNBLFNBQUssTUFBTCxJQUFlLEVBQWY7QUFDQSxTQUFLLElBQUw7QUFDQSxTQUFLLElBQUwsQ0FBVSxRQUFWLEdBQXFCLEtBQUssUUFBTCxDQUFyQjtBQUNEOzs7OytCQUNVLEksRUFBTTtBQUNmLFVBQUksS0FBSyxNQUFMLEVBQWEsS0FBSyxLQUFsQixNQUE2QixTQUFqQyxFQUE0QztBQUMxQyxjQUFNLElBQUksS0FBSixnQ0FBdUMsS0FBSyxLQUE1QyxDQUFOO0FBQ0Q7QUFDRCxXQUFLLE1BQUwsRUFBYSxLQUFLLEtBQWxCLElBQTJCLElBQTNCO0FBQ0Q7Ozs0QkFDTyxJLEVBQU07QUFDWixhQUFPLEtBQUssTUFBTCxFQUFhLElBQWIsQ0FBUDtBQUNEOzs7aUNBQ1k7QUFDWCxhQUFPLEtBQUssUUFBTCxDQUFQO0FBQ0Q7Ozt5QkFDSSxJLEVBQU0sRSxFQUFJO0FBQ2IsVUFBTSxPQUFPLEtBQUssTUFBTCxFQUFhLElBQWIsQ0FBYjtBQUNBLGFBQU8sSUFBSSxJQUFKLHFCQUNKLEtBQUssR0FERCxFQUNPLEVBRFAsRUFBUDtBQUdEIiwiZmlsZSI6ImRhdGFTdG9yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7TW9kZWx9IGZyb20gJy4vbW9kZWwnO1xuXG5jb25zdCAkdHlwZXMgPSBTeW1ib2woJyR0eXBlcycpO1xuY29uc3QgJHN0b3JhZ2UgPSBTeW1ib2woJyRzdG9yYWdlJyk7XG5cbmV4cG9ydCBjbGFzcyBEYXRhc3RvcmUge1xuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICB0aGlzWyRzdG9yYWdlXSA9IG9wdHMuc3RvcmFnZS5jb25jYXQoKTtcbiAgICB0aGlzWyR0eXBlc10gPSB7fTtcbiAgICB0aGlzLkJhc2UgPSBNb2RlbDtcbiAgICB0aGlzLkJhc2UuJHN0b3JhZ2UgPSB0aGlzWyRzdG9yYWdlXTtcbiAgfVxuICBkZWZpbmVUeXBlKHR5cGUpIHtcbiAgICBpZiAodGhpc1skdHlwZXNdW3R5cGUuJG5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRHVwbGljYXRlIHR5cGUgZGVmaW5pdGlvbiAke3R5cGUuJG5hbWV9YCk7XG4gICAgfVxuICAgIHRoaXNbJHR5cGVzXVt0eXBlLiRuYW1lXSA9IHR5cGU7XG4gIH1cbiAgZ2V0VHlwZSh0eXBlKSB7XG4gICAgcmV0dXJuIHRoaXNbJHR5cGVzXVt0eXBlXTtcbiAgfVxuICBnZXRTdG9yYWdlKCkge1xuICAgIHJldHVybiB0aGlzWyRzdG9yYWdlXTtcbiAgfVxuICBmaW5kKHR5cGUsIGlkKSB7XG4gICAgY29uc3QgVHlwZSA9IHRoaXNbJHR5cGVzXVt0eXBlXTtcbiAgICByZXR1cm4gbmV3IFR5cGUoe1xuICAgICAgW1R5cGUuJGlkXTogaWQsXG4gICAgfSk7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
