import { Interfaces } from './dataTypes';

export abstract class Relationship {

  static schema: Interfaces.RelationshipSchema;

  constructor() {
    // this.plump = plump;
    // this.for = model;
    // this.title = title;
  }

  // $otherItem(childId) {
  //   const otherInfo = this.constructor.$sides[this.title].other;
  //   return this.plump.find(otherInfo.type, childId);
  // }
  //
  // $add(childId, extras) {
  //   return this.plump.add(this.for.constructor, this.for.$id, childId, extras);
  // }
  //
  // $remove(childId) {
  //   return this.plump.remove(this.for.constructor, this.for.$id, childId);
  // }
  //
  // $list() {
  //   return this.plump.get(this.for.constructor, this.for.$id, this.title);
  // }
  //
  // $modify(childId, extras) {
  //   return this.plump.modifyRelationship(this.for.constructor, this.for.$id, this.title, childId, extras);
  // }
}
