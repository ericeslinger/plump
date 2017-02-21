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
  if (json.$restrict) {
    this.$restrict = json.$restrict;
  }
  this.$sides = (0, _mergeOptions2.default)({}, json.$sides);
};

Relationship.toJSON = function toJSON() {
  var rV = {
    $name: this.$name,
    $sides: this.$sides
  };
  if (this.$restrict) {
    rV.$restrict = this.$restrict;
  }
  if (this.$extras) {
    rV.$extras = this.$extras;
  }
  return rV;
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlbGF0aW9uc2hpcC5qcyJdLCJuYW1lcyI6WyJSZWxhdGlvbnNoaXAiLCJtb2RlbCIsInRpdGxlIiwicGx1bXAiLCJmb3IiLCJjaGlsZElkIiwib3RoZXJJbmZvIiwiY29uc3RydWN0b3IiLCIkc2lkZXMiLCJvdGhlciIsImZpbmQiLCJ0eXBlIiwiZXh0cmFzIiwiYWRkIiwiJGlkIiwicmVtb3ZlIiwiZ2V0IiwibW9kaWZ5UmVsYXRpb25zaGlwIiwiZnJvbUpTT04iLCJqc29uIiwiJG5hbWUiLCIkZXh0cmFzIiwiJHJlc3RyaWN0IiwidG9KU09OIiwiclYiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7Ozs7OztJQUVhQSxZLFdBQUFBLFk7QUFDWCx3QkFBWUMsS0FBWixFQUFtQkMsS0FBbkIsRUFBMEJDLEtBQTFCLEVBQWlDO0FBQUE7O0FBQy9CLFNBQUtBLEtBQUwsR0FBYUEsS0FBYjtBQUNBLFNBQUtDLEdBQUwsR0FBV0gsS0FBWDtBQUNBLFNBQUtDLEtBQUwsR0FBYUEsS0FBYjtBQUNEOzs7OytCQUVVRyxPLEVBQVM7QUFDbEIsVUFBTUMsWUFBWSxLQUFLQyxXQUFMLENBQWlCQyxNQUFqQixDQUF3QixLQUFLTixLQUE3QixFQUFvQ08sS0FBdEQ7QUFDQSxhQUFPLEtBQUtOLEtBQUwsQ0FBV08sSUFBWCxDQUFnQkosVUFBVUssSUFBMUIsRUFBZ0NOLE9BQWhDLENBQVA7QUFDRDs7O3lCQUVJQSxPLEVBQVNPLE0sRUFBUTtBQUNwQixhQUFPLEtBQUtULEtBQUwsQ0FBV1UsR0FBWCxDQUFlLEtBQUtULEdBQUwsQ0FBU0csV0FBeEIsRUFBcUMsS0FBS0gsR0FBTCxDQUFTVSxHQUE5QyxFQUFtRFQsT0FBbkQsRUFBNERPLE1BQTVELENBQVA7QUFDRDs7OzRCQUVPUCxPLEVBQVM7QUFDZixhQUFPLEtBQUtGLEtBQUwsQ0FBV1ksTUFBWCxDQUFrQixLQUFLWCxHQUFMLENBQVNHLFdBQTNCLEVBQXdDLEtBQUtILEdBQUwsQ0FBU1UsR0FBakQsRUFBc0RULE9BQXRELENBQVA7QUFDRDs7OzRCQUVPO0FBQ04sYUFBTyxLQUFLRixLQUFMLENBQVdhLEdBQVgsQ0FBZSxLQUFLWixHQUFMLENBQVNHLFdBQXhCLEVBQXFDLEtBQUtILEdBQUwsQ0FBU1UsR0FBOUMsRUFBbUQsS0FBS1osS0FBeEQsQ0FBUDtBQUNEOzs7NEJBRU9HLE8sRUFBU08sTSxFQUFRO0FBQ3ZCLGFBQU8sS0FBS1QsS0FBTCxDQUFXYyxrQkFBWCxDQUE4QixLQUFLYixHQUFMLENBQVNHLFdBQXZDLEVBQW9ELEtBQUtILEdBQUwsQ0FBU1UsR0FBN0QsRUFBa0UsS0FBS1osS0FBdkUsRUFBOEVHLE9BQTlFLEVBQXVGTyxNQUF2RixDQUFQO0FBQ0Q7Ozs7OztBQUdIWixhQUFha0IsUUFBYixHQUF3QixTQUFTQSxRQUFULENBQWtCQyxJQUFsQixFQUF3QjtBQUM5QyxPQUFLQyxLQUFMLEdBQWFELEtBQUtDLEtBQWxCO0FBQ0EsTUFBSUQsS0FBS0UsT0FBVCxFQUFrQjtBQUNoQixTQUFLQSxPQUFMLEdBQWVGLEtBQUtFLE9BQXBCO0FBQ0Q7QUFDRCxNQUFJRixLQUFLRyxTQUFULEVBQW9CO0FBQ2xCLFNBQUtBLFNBQUwsR0FBaUJILEtBQUtHLFNBQXRCO0FBQ0Q7QUFDRCxPQUFLZCxNQUFMLEdBQWMsNEJBQWEsRUFBYixFQUFpQlcsS0FBS1gsTUFBdEIsQ0FBZDtBQUNELENBVEQ7O0FBV0FSLGFBQWF1QixNQUFiLEdBQXNCLFNBQVNBLE1BQVQsR0FBa0I7QUFDdEMsTUFBTUMsS0FBSztBQUNUSixXQUFPLEtBQUtBLEtBREg7QUFFVFosWUFBUSxLQUFLQTtBQUZKLEdBQVg7QUFJQSxNQUFJLEtBQUtjLFNBQVQsRUFBb0I7QUFDbEJFLE9BQUdGLFNBQUgsR0FBZSxLQUFLQSxTQUFwQjtBQUNEO0FBQ0QsTUFBSSxLQUFLRCxPQUFULEVBQWtCO0FBQ2hCRyxPQUFHSCxPQUFILEdBQWEsS0FBS0EsT0FBbEI7QUFDRDtBQUNELFNBQU9HLEVBQVA7QUFDRCxDQVpEIiwiZmlsZSI6InJlbGF0aW9uc2hpcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtZXJnZU9wdGlvbnMgZnJvbSAnbWVyZ2Utb3B0aW9ucyc7XG5cbmV4cG9ydCBjbGFzcyBSZWxhdGlvbnNoaXAge1xuICBjb25zdHJ1Y3Rvcihtb2RlbCwgdGl0bGUsIHBsdW1wKSB7XG4gICAgdGhpcy5wbHVtcCA9IHBsdW1wO1xuICAgIHRoaXMuZm9yID0gbW9kZWw7XG4gICAgdGhpcy50aXRsZSA9IHRpdGxlO1xuICB9XG5cbiAgJG90aGVySXRlbShjaGlsZElkKSB7XG4gICAgY29uc3Qgb3RoZXJJbmZvID0gdGhpcy5jb25zdHJ1Y3Rvci4kc2lkZXNbdGhpcy50aXRsZV0ub3RoZXI7XG4gICAgcmV0dXJuIHRoaXMucGx1bXAuZmluZChvdGhlckluZm8udHlwZSwgY2hpbGRJZCk7XG4gIH1cblxuICAkYWRkKGNoaWxkSWQsIGV4dHJhcykge1xuICAgIHJldHVybiB0aGlzLnBsdW1wLmFkZCh0aGlzLmZvci5jb25zdHJ1Y3RvciwgdGhpcy5mb3IuJGlkLCBjaGlsZElkLCBleHRyYXMpO1xuICB9XG5cbiAgJHJlbW92ZShjaGlsZElkKSB7XG4gICAgcmV0dXJuIHRoaXMucGx1bXAucmVtb3ZlKHRoaXMuZm9yLmNvbnN0cnVjdG9yLCB0aGlzLmZvci4kaWQsIGNoaWxkSWQpO1xuICB9XG5cbiAgJGxpc3QoKSB7XG4gICAgcmV0dXJuIHRoaXMucGx1bXAuZ2V0KHRoaXMuZm9yLmNvbnN0cnVjdG9yLCB0aGlzLmZvci4kaWQsIHRoaXMudGl0bGUpO1xuICB9XG5cbiAgJG1vZGlmeShjaGlsZElkLCBleHRyYXMpIHtcbiAgICByZXR1cm4gdGhpcy5wbHVtcC5tb2RpZnlSZWxhdGlvbnNoaXAodGhpcy5mb3IuY29uc3RydWN0b3IsIHRoaXMuZm9yLiRpZCwgdGhpcy50aXRsZSwgY2hpbGRJZCwgZXh0cmFzKTtcbiAgfVxufVxuXG5SZWxhdGlvbnNoaXAuZnJvbUpTT04gPSBmdW5jdGlvbiBmcm9tSlNPTihqc29uKSB7XG4gIHRoaXMuJG5hbWUgPSBqc29uLiRuYW1lO1xuICBpZiAoanNvbi4kZXh0cmFzKSB7XG4gICAgdGhpcy4kZXh0cmFzID0ganNvbi4kZXh0cmFzO1xuICB9XG4gIGlmIChqc29uLiRyZXN0cmljdCkge1xuICAgIHRoaXMuJHJlc3RyaWN0ID0ganNvbi4kcmVzdHJpY3Q7XG4gIH1cbiAgdGhpcy4kc2lkZXMgPSBtZXJnZU9wdGlvbnMoe30sIGpzb24uJHNpZGVzKTtcbn07XG5cblJlbGF0aW9uc2hpcC50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04oKSB7XG4gIGNvbnN0IHJWID0ge1xuICAgICRuYW1lOiB0aGlzLiRuYW1lLFxuICAgICRzaWRlczogdGhpcy4kc2lkZXMsXG4gIH07XG4gIGlmICh0aGlzLiRyZXN0cmljdCkge1xuICAgIHJWLiRyZXN0cmljdCA9IHRoaXMuJHJlc3RyaWN0O1xuICB9XG4gIGlmICh0aGlzLiRleHRyYXMpIHtcbiAgICByVi4kZXh0cmFzID0gdGhpcy4kZXh0cmFzO1xuICB9XG4gIHJldHVybiByVjtcbn07XG4iXX0=
