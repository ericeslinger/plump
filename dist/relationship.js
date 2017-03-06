'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Relationship = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mergeOptions = require('merge-options');

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Relationship = exports.Relationship = function () {
  function Relationship(model, title, plump) {
    _classCallCheck(this, Relationship);

    this.plump = plump;
    this.for = model;
    this.title = title;
  }

  _createClass(Relationship, [{
    key: '$otherItem',
    value: function $otherItem(childId) {
      var otherInfo = this.constructor.$sides[this.title].other;
      return this.plump.find(otherInfo.type, childId);
    }
  }, {
    key: '$add',
    value: function $add(childId, extras) {
      return this.plump.add(this.for.constructor, this.for.$id, childId, extras);
    }
  }, {
    key: '$remove',
    value: function $remove(childId) {
      return this.plump.remove(this.for.constructor, this.for.$id, childId);
    }
  }, {
    key: '$list',
    value: function $list() {
      return this.plump.get(this.for.constructor, this.for.$id, this.title);
    }
  }, {
    key: '$modify',
    value: function $modify(childId, extras) {
      return this.plump.modifyRelationship(this.for.constructor, this.for.$id, this.title, childId, extras);
    }
  }]);

  return Relationship;
}();

Relationship.fromJSON = function fromJSON(json) {
  this.$name = json.$name;
  if (json.$extras) {
    this.$extras = json.$extras;
  }
  if (json.$storeData) {
    this.$storeData = json.$storeData;
  }
  this.$sides = (0, _mergeOptions2.default)({}, json.$sides);
};

Relationship.toJSON = function toJSON() {
  var rV = {
    $name: this.$name,
    $sides: this.$sides
  };
  if (this.$extras) {
    rV.$extras = this.$extras;
  }
  if (this.$storeData) {
    rV.$storeData = this.$storeData;
  }
  return rV;
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlbGF0aW9uc2hpcC5qcyJdLCJuYW1lcyI6WyJSZWxhdGlvbnNoaXAiLCJtb2RlbCIsInRpdGxlIiwicGx1bXAiLCJmb3IiLCJjaGlsZElkIiwib3RoZXJJbmZvIiwiY29uc3RydWN0b3IiLCIkc2lkZXMiLCJvdGhlciIsImZpbmQiLCJ0eXBlIiwiZXh0cmFzIiwiYWRkIiwiJGlkIiwicmVtb3ZlIiwiZ2V0IiwibW9kaWZ5UmVsYXRpb25zaGlwIiwiZnJvbUpTT04iLCJqc29uIiwiJG5hbWUiLCIkZXh0cmFzIiwiJHN0b3JlRGF0YSIsInRvSlNPTiIsInJWIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7SUFFYUEsWSxXQUFBQSxZO0FBQ1gsd0JBQVlDLEtBQVosRUFBbUJDLEtBQW5CLEVBQTBCQyxLQUExQixFQUFpQztBQUFBOztBQUMvQixTQUFLQSxLQUFMLEdBQWFBLEtBQWI7QUFDQSxTQUFLQyxHQUFMLEdBQVdILEtBQVg7QUFDQSxTQUFLQyxLQUFMLEdBQWFBLEtBQWI7QUFDRDs7OzsrQkFFVUcsTyxFQUFTO0FBQ2xCLFVBQU1DLFlBQVksS0FBS0MsV0FBTCxDQUFpQkMsTUFBakIsQ0FBd0IsS0FBS04sS0FBN0IsRUFBb0NPLEtBQXREO0FBQ0EsYUFBTyxLQUFLTixLQUFMLENBQVdPLElBQVgsQ0FBZ0JKLFVBQVVLLElBQTFCLEVBQWdDTixPQUFoQyxDQUFQO0FBQ0Q7Ozt5QkFFSUEsTyxFQUFTTyxNLEVBQVE7QUFDcEIsYUFBTyxLQUFLVCxLQUFMLENBQVdVLEdBQVgsQ0FBZSxLQUFLVCxHQUFMLENBQVNHLFdBQXhCLEVBQXFDLEtBQUtILEdBQUwsQ0FBU1UsR0FBOUMsRUFBbURULE9BQW5ELEVBQTRETyxNQUE1RCxDQUFQO0FBQ0Q7Ozs0QkFFT1AsTyxFQUFTO0FBQ2YsYUFBTyxLQUFLRixLQUFMLENBQVdZLE1BQVgsQ0FBa0IsS0FBS1gsR0FBTCxDQUFTRyxXQUEzQixFQUF3QyxLQUFLSCxHQUFMLENBQVNVLEdBQWpELEVBQXNEVCxPQUF0RCxDQUFQO0FBQ0Q7Ozs0QkFFTztBQUNOLGFBQU8sS0FBS0YsS0FBTCxDQUFXYSxHQUFYLENBQWUsS0FBS1osR0FBTCxDQUFTRyxXQUF4QixFQUFxQyxLQUFLSCxHQUFMLENBQVNVLEdBQTlDLEVBQW1ELEtBQUtaLEtBQXhELENBQVA7QUFDRDs7OzRCQUVPRyxPLEVBQVNPLE0sRUFBUTtBQUN2QixhQUFPLEtBQUtULEtBQUwsQ0FBV2Msa0JBQVgsQ0FBOEIsS0FBS2IsR0FBTCxDQUFTRyxXQUF2QyxFQUFvRCxLQUFLSCxHQUFMLENBQVNVLEdBQTdELEVBQWtFLEtBQUtaLEtBQXZFLEVBQThFRyxPQUE5RSxFQUF1Rk8sTUFBdkYsQ0FBUDtBQUNEOzs7Ozs7QUFHSFosYUFBYWtCLFFBQWIsR0FBd0IsU0FBU0EsUUFBVCxDQUFrQkMsSUFBbEIsRUFBd0I7QUFDOUMsT0FBS0MsS0FBTCxHQUFhRCxLQUFLQyxLQUFsQjtBQUNBLE1BQUlELEtBQUtFLE9BQVQsRUFBa0I7QUFDaEIsU0FBS0EsT0FBTCxHQUFlRixLQUFLRSxPQUFwQjtBQUNEO0FBQ0QsTUFBSUYsS0FBS0csVUFBVCxFQUFxQjtBQUNuQixTQUFLQSxVQUFMLEdBQWtCSCxLQUFLRyxVQUF2QjtBQUNEO0FBQ0QsT0FBS2QsTUFBTCxHQUFjLDRCQUFhLEVBQWIsRUFBaUJXLEtBQUtYLE1BQXRCLENBQWQ7QUFDRCxDQVREOztBQVdBUixhQUFhdUIsTUFBYixHQUFzQixTQUFTQSxNQUFULEdBQWtCO0FBQ3RDLE1BQU1DLEtBQUs7QUFDVEosV0FBTyxLQUFLQSxLQURIO0FBRVRaLFlBQVEsS0FBS0E7QUFGSixHQUFYO0FBSUEsTUFBSSxLQUFLYSxPQUFULEVBQWtCO0FBQ2hCRyxPQUFHSCxPQUFILEdBQWEsS0FBS0EsT0FBbEI7QUFDRDtBQUNELE1BQUksS0FBS0MsVUFBVCxFQUFxQjtBQUNuQkUsT0FBR0YsVUFBSCxHQUFnQixLQUFLQSxVQUFyQjtBQUNEO0FBQ0QsU0FBT0UsRUFBUDtBQUNELENBWkQiLCJmaWxlIjoicmVsYXRpb25zaGlwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcblxuZXhwb3J0IGNsYXNzIFJlbGF0aW9uc2hpcCB7XG4gIGNvbnN0cnVjdG9yKG1vZGVsLCB0aXRsZSwgcGx1bXApIHtcbiAgICB0aGlzLnBsdW1wID0gcGx1bXA7XG4gICAgdGhpcy5mb3IgPSBtb2RlbDtcbiAgICB0aGlzLnRpdGxlID0gdGl0bGU7XG4gIH1cblxuICAkb3RoZXJJdGVtKGNoaWxkSWQpIHtcbiAgICBjb25zdCBvdGhlckluZm8gPSB0aGlzLmNvbnN0cnVjdG9yLiRzaWRlc1t0aGlzLnRpdGxlXS5vdGhlcjtcbiAgICByZXR1cm4gdGhpcy5wbHVtcC5maW5kKG90aGVySW5mby50eXBlLCBjaGlsZElkKTtcbiAgfVxuXG4gICRhZGQoY2hpbGRJZCwgZXh0cmFzKSB7XG4gICAgcmV0dXJuIHRoaXMucGx1bXAuYWRkKHRoaXMuZm9yLmNvbnN0cnVjdG9yLCB0aGlzLmZvci4kaWQsIGNoaWxkSWQsIGV4dHJhcyk7XG4gIH1cblxuICAkcmVtb3ZlKGNoaWxkSWQpIHtcbiAgICByZXR1cm4gdGhpcy5wbHVtcC5yZW1vdmUodGhpcy5mb3IuY29uc3RydWN0b3IsIHRoaXMuZm9yLiRpZCwgY2hpbGRJZCk7XG4gIH1cblxuICAkbGlzdCgpIHtcbiAgICByZXR1cm4gdGhpcy5wbHVtcC5nZXQodGhpcy5mb3IuY29uc3RydWN0b3IsIHRoaXMuZm9yLiRpZCwgdGhpcy50aXRsZSk7XG4gIH1cblxuICAkbW9kaWZ5KGNoaWxkSWQsIGV4dHJhcykge1xuICAgIHJldHVybiB0aGlzLnBsdW1wLm1vZGlmeVJlbGF0aW9uc2hpcCh0aGlzLmZvci5jb25zdHJ1Y3RvciwgdGhpcy5mb3IuJGlkLCB0aGlzLnRpdGxlLCBjaGlsZElkLCBleHRyYXMpO1xuICB9XG59XG5cblJlbGF0aW9uc2hpcC5mcm9tSlNPTiA9IGZ1bmN0aW9uIGZyb21KU09OKGpzb24pIHtcbiAgdGhpcy4kbmFtZSA9IGpzb24uJG5hbWU7XG4gIGlmIChqc29uLiRleHRyYXMpIHtcbiAgICB0aGlzLiRleHRyYXMgPSBqc29uLiRleHRyYXM7XG4gIH1cbiAgaWYgKGpzb24uJHN0b3JlRGF0YSkge1xuICAgIHRoaXMuJHN0b3JlRGF0YSA9IGpzb24uJHN0b3JlRGF0YTtcbiAgfVxuICB0aGlzLiRzaWRlcyA9IG1lcmdlT3B0aW9ucyh7fSwganNvbi4kc2lkZXMpO1xufTtcblxuUmVsYXRpb25zaGlwLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTigpIHtcbiAgY29uc3QgclYgPSB7XG4gICAgJG5hbWU6IHRoaXMuJG5hbWUsXG4gICAgJHNpZGVzOiB0aGlzLiRzaWRlcyxcbiAgfTtcbiAgaWYgKHRoaXMuJGV4dHJhcykge1xuICAgIHJWLiRleHRyYXMgPSB0aGlzLiRleHRyYXM7XG4gIH1cbiAgaWYgKHRoaXMuJHN0b3JlRGF0YSkge1xuICAgIHJWLiRzdG9yZURhdGEgPSB0aGlzLiRzdG9yZURhdGE7XG4gIH1cbiAgcmV0dXJuIHJWO1xufTtcbiJdfQ==
