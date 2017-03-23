"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var merge_options_1 = require("merge-options");
var Relationship = (function () {
    function Relationship(model, title, plump) {
        this.plump = plump;
        this.for = model;
        this.title = title;
    }
    Relationship.prototype.$otherItem = function (childId) {
        var otherInfo = this.constructor.$sides[this.title].other;
        return this.plump.find(otherInfo.type, childId);
    };
    Relationship.prototype.$add = function (childId, extras) {
        return this.plump.add(this.for.constructor, this.for.$id, childId, extras);
    };
    Relationship.prototype.$remove = function (childId) {
        return this.plump.remove(this.for.constructor, this.for.$id, childId);
    };
    Relationship.prototype.$list = function () {
        return this.plump.get(this.for.constructor, this.for.$id, this.title);
    };
    Relationship.prototype.$modify = function (childId, extras) {
        return this.plump.modifyRelationship(this.for.constructor, this.for.$id, this.title, childId, extras);
    };
    return Relationship;
}());
exports.Relationship = Relationship;
Relationship.fromJSON = function fromJSON(json) {
    this.$name = json.$name;
    if (json.$extras) {
        this.$extras = json.$extras;
    }
    if (json.$storeData) {
        this.$storeData = json.$storeData;
    }
    this.$sides = merge_options_1.default({}, json.$sides);
};
Relationship.toJSON = function toJSON() {
    var rV = {
        $name: this.$name,
        $sides: this.$sides,
    };
    if (this.$extras) {
        rV.$extras = this.$extras;
    }
    if (this.$storeData) {
        rV.$storeData = this.$storeData;
    }
    return rV;
};
