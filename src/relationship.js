export class Relationship {
  constructor(guild) {
    this.guild = guild;
  }

}

// Relationship.other('memberships') === {typeName: 'communities', field: 'community_id'};

Relationship.otherField = function otherField(field) {
  const nameArray = Object.keys(this.$sides);
  return field === nameArray[0]
    ? nameArray[1]
    : nameArray[0];
};
