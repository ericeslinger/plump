"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Relationship = exports.Relationship = function () {
  function Relationship(model, title, guild) {
    _classCallCheck(this, Relationship);

    this.guild = guild;
    this.for = model;
    this.title = title;
  }

  _createClass(Relationship, [{
    key: "$add",
    value: function $add(childId, extras) {
      return this.guild.add(this.for.constructor, this.for.$id, childId, extras);
    }
  }, {
    key: "$remove",
    value: function $remove(childId) {
      return this.guild.remove(this.for.constructor, this.for.$id, childId);
    }
  }, {
    key: "$list",
    value: function $list() {
      return this.guild.get(this.for.constructor, this.for.$id, this.title);
    }
  }, {
    key: "$modify",
    value: function $modify() {}
  }]);

  return Relationship;
}();