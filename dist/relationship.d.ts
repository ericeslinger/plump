import * as Rx from 'rxjs/Rx';
import * as Bluebird from 'bluebird';

import { StringIndexed, NumericIDed} from './util';
import { Plump } from './index.d';
import { Model }from './model.d';
import { Storage } from './storage/storage.d';

declare abstract class Relationship {
  static fromJSON(
    json: {
      $name: string,
      $extras?: StringIndexed<any>,
      $restrict?: StringIndexed<{ value: string, type: string }>,
      $sides: Relationship.Sides,
    }): void;

  static toJSON(): {
    $name: string,
    $sides: Relationship.Sides;
    $restrict?: StringIndexed<{ value: string, type: string }>;
    $extras?: StringIndexed<any>;
  }


  static $sides: Relationship.Sides;


  new (model: Model, title: string, plump: Plump);

  $otherItem(childId: number): Model;

  $add(
    childId: number,
    extras: StringIndexed<any>
  ): Bluebird<[Relationship.Data[], Relationship.Data[]]>;

  $modify(
    childId: number,
    extras: StringIndexed<any>
  ): Bluebird<void | null>;

  $remove(childId: number): Bluebird<void | null>;

  $list(): Bluebird<Model[]>;
}

declare namespace Relationship {
  interface GenericSideData {
    field: string,
    type: string,
    query?: { logic: Storage.BlockFilter },
  }

  interface OtherSideData extends GenericSideData {
    title: string,
  }

  interface Sides {
    [relationshipName: string]: {
      self: GenericSideData,
      other: OtherSideData,
    }
  }

  interface Data {
    id: number,
    meta?: {
      extras?: StringIndexed<any>,
      restrict?: { type: string, value: any }, // TODO: Constrain value to value of type
    }
  }
}

export { Relationship };
