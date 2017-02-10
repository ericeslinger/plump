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