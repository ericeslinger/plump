export class Relationship {
  constructor(model, title, guild) {
    this.guild = guild;
    this.for = model;
    this.title = title;
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

  $modify() {}
}
