import { Interfaces } from './dataTypes';
import { Plump } from './plump';
import { Model } from './model';

export abstract class Relationship {
  static sides: Interfaces.StringIndexed<{otherType: string, otherName: string}>
  static extras?: Interfaces.StringIndexed<any>;
  static storeData?: {
    sql?: {
      tableName: string;
      joinFields: Interfaces.StringIndexed<string>,
    },
  } & Interfaces.StringIndexed<any>;

  plump: Plump;
  for: typeof Model;
  title: string;

  constructor(plump: Plump, model: typeof Model, title: string) {
    this.plump = plump;
    this.for = model;
    this.title = title;
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
