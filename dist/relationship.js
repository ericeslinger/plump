'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $guild = Symbol('$guild');

var Relationship = exports.Relationship = function () {
  function Relationship(guild) {
    _classCallCheck(this, Relationship);

    this[$guild] = guild;
  }

  _createClass(Relationship, [{
    key: 'findOthers',
    value: function findOthers(item) {}
  }]);

  return Relationship;
}();

// Relationship.other('memberships') === {typeName: 'communities', field: 'community_id'};

Relationship.otherField = function otherField(field) {
  var nameArray = Object.keys(this.$sides);
  return field === nameArray[0] ? nameArray[1] : nameArray[0];
};