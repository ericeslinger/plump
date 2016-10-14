const $guild = Symbol('$guild');

export class Relationship {
  constructor(item, guild) {
    this.item = item;
    this[$guild] = guild;
  }
  get() {
  }
}

// returns a ref to the definition block
Relationship.other = function other(name) {
  const nameArray = Object.keys(this.$sides);
  return name === nameArray[0]
    ? nameArray[1]
    : nameArray[0];
};

Relationship.otherType = function otherType(name) {
  return this.$sides[this.other(name)];
};
