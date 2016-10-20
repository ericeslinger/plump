export class Relationship {
  constructor(model, title, guild) {
    this.guild = guild;
    this.for = model;
    this.title = title;
  }

  $add(childId, extras) {
    return this.guild.add(this.model.constructor, this.model.$id, childId, extras);
  }

  $remove(childId) {
    return this.guild.remove(this.model.constructor, this.model.$id, childId);
  }

  $list() {
    return this.guild.get(this.model.constructor, this.model.$id, this.title);
  }

  $modify() {}
}
