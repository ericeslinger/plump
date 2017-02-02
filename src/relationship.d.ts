import * as Rx from 'rxjs/Rx';
import * as Bluebird from 'bluebird';

import { StringIndexed, NumericIDed} from './util';
import * as Plump from './index.d';
import * as Model from './model.d';
import * as Storage from './storage/storage.d';

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


  new (model: typeof Model, title: string, plump: Plump);

  $otherItem(childId: number): Model;

  $add(
    childId: number,
    extras: StringIndexed<any>
  ): Bluebird<any>;

  $remove(childId: number): Bluebird<any>;

  $list(): Bluebird<Model[]>;

  $modify(
    childId: number,
    extras: StringIndexed<any>
  ): Bluebird<any>;
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
}

export { Relationship };
