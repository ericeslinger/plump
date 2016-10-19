"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Relationship = exports.Relationship = function Relationship(guild) {
  _classCallCheck(this, Relationship);

  this.guild = guild;
};

// Relationship.other('memberships') === {typeName: 'communities', field: 'community_id'};

Relationship.otherField = function otherField(field) {
  var nameArray = Object.keys(this.$sides);
  return field === nameArray[0] ? nameArray[1] : nameArray[0];
};