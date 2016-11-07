export class Relationship {
  constructor(model, title, guild) {
    this.guild = guild;
    this.for = model;
    this.title = title;
  }

  $otherItem(childId) {
    const otherInfo = this.constructor.$sides[this.title].other;
    return this.guild.find(otherInfo.type, childId);
  }

  $add(childId, extras) {
    return this.guild.add(this.for.constructor, this.for.$id, childId, extras);
  }

  $remove(childId) {
    return this.guild.remove(this.for.constructor, this.for.$id, childId);
  }

  $list() {
    return this.guild.get(this.for.constructor, this.for.$id, this.title);
  }

  $modify(childId, extras) {
    return this.guild.modifyRelationship(this.for.constructor, this.for.$id, this.title, childId, extras);
  }
}
