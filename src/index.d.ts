// Type definitions for Plump 0.6.0
// Project: https://github.com/kstf/plump
// Definitions by: Nate Pinsky <github.com/mrpinsky>

import * as Rx from 'rxjs/Rx.d';
import * as Bluebird from '@types/bluebird';

interface StringIndexed<T> {
  [index: string]: T,
}

export as namespace plump;

export = Plump;

declare class Plump {
    new (opts?: {
      storage?: Array<Plump.Storage>,
      types?: Array<typeof Plump.Model>
    });

    addTypesFromSchema(
      schema: Plump.Fields, // representation of Model.$fields
      ExtendingModel: Plump.Model
    ): void;

    addType(T: typeof Plump.Model): void;

    type(T: string): typeof Plump.Model;

    types(): (typeof Plump.Model)[];

    addStore(store: Plump.Storage): void;

    find(
      t: string | typeof Plump.Model,
      id: number
    ): Plump.Model;

    forge(
      t: string | typeof Plump.Model,
      val: Plump.Fields
    ): Plump.Model;

    subscribe(
      typeName: string,
      id: number,
      handler: () => void
    ): Rx.Subscription;

    teardown(): void;

    get(
      type: typeof Plump.Model,
      id: number,
      keyOpts?: PropertyKey[]
    ): Bluebird<Plump.Model>;

    streamGet(
      type: typeof Plump.Model,
      id: number,
      keyOpts?: PropertyKey[]
    ): Rx.Observable<Plump.Model>;

    save(
      type: typeof Plump.Model,
      val: any
    ): Bluebird<any>;

    delete(
      type: typeof Plump.Model,
      id: number
    ): Bluebird<Plump.Model>;

    add(
      type: typeof Plump.Model,
      id: number,
      relationshipTitle: string,
      childId: number,
      extras?: any
    ): Bluebird<Plump.Model>;

    restRequest(opts: any): Bluebird<any>;

    modifyRelationship(
      type: typeof Plump.Model,
      id: number,
      relationshipTitle: string,
      childId: number,
      extras?: any
    ): Bluebird<any>;

    remove(
      type: typeof Plump.Model,
      id: number,
      relationshipTitle: string,
      childId: number
    ): Bluebird<any>;

    invalidate(
      type: typeof Plump.Model,
      id: number,
      field: symbol | string
    ): Bluebird<any>;
}

/*~ If you want to expose types from your module as well, you can
 *~ place them in this block.
 */
declare namespace Plump {
  interface NumericIDed {
    $id: number
  }

  interface Fields {
    [field: string]: {
      type: "number" | "string" | "date" | "array" | "hasMany" | "boolean",
      readOnly: boolean,
      default?: any,
      relationship: Relationship,
    }
  }

  class Model {
    static $id: string;
    static $name: string;
    static $self: symbol;
    static $fields: Fields;


    static fromJSON(json: Model): void;

    static toJSON(): Model;

    // TODO: Figure out shape of opts
    static $rest(
      plump: Plump,
      opts?: StringIndexed<any>
    ): Bluebird<any>;

    // The keys of opts here should be a subset of the keys of Model.$fields
    static assign(opts: StringIndexed<any>): StringIndexed<any>;

    // TODO: Determine whether these properties should be exposed in the API
    // $store: any;
    // $relationships: { [rel: string]: Relationship };
    // $subject: Rx.BehaviorSubject<any>;
    // Symbol($loaded): any;


    new (opts: StringIndexed<any>, plump: Plump);

    $subscribe(callback: () => void): Rx.Subscription;
    $subscribe(fields: string | string[], callback: () => void): Rx.Subscription;

    $get(opts?: (string | symbol)[]): StringIndexed<any>;

    $save(): Model;

    $set(u?: StringIndexed<any>): Model;

    $delete(): Bluebird<Model>;

    // TODO: Figure out Plump.restRequest to resolve this
    $rest(opts?: StringIndexed<any>): any;

    $add(
      key: PropertyKey,
      item: number | NumericIDed | { [field: string]: any },
      extras?: StringIndexed<any>
    ): Bluebird<any>;

    $modifyRelationship(
      key: PropertyKey,
      item: number | NumericIDed,
      extras?: StringIndexed<any>
    ): Bluebird<any>;

    $remove(
      key: PropertyKey,
      item: number | NumericIDed
    ): Bluebird<any>;

    $teardown(): void;
  }

  class Relationship {
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

  export namespace Relationship {
    interface GenericSideData {
      field: string,
      type: string,
      query?: { logic: Storage.BlockFilter },
    }

    interface OtherSideData extends GenericSideData {
      title: string,
    }

    export interface Sides {
      [relationshipName: string]: {
        self: GenericSideData,
        other: OtherSideData,
      }
    }
  }

  class Storage {
    static massReplace(
      block: any[],
      context: StringIndexed<any>
    ): any[];


    new (opts: { isTerminal?: boolean });

    hot(type: typeof Model, id: number): boolean;

    write(
      type: typeof Model,
      value: {
        [index: string]: any,
        id?: number
      }
    ): Bluebird<any>;

    read(
      type: typeof Model,
      id: number,
      key?: string | string[]
    ): Bluebird<any>;

    wipe(
      type: typeof Model,
      id: number,
      field: string | symbol
    ): Bluebird<any>;

    delete(
      type: typeof Model,
      id: number
    ): Bluebird<any>;

    add(
      type: typeof Model,
      id: number,
      relationshipTitle: string,
      childId: number,
      extras?: StringIndexed<any>
    ): Bluebird<any>;

    remove(
      type: typeof Model,
      id: number,
      relationshipTitle: string,
      childId: number
    ): Bluebird<any>;

    modifyRelationship(
      type: typeof Model,
      id: number,
      relationship: string,
      childId: number,
      extras?: StringIndexed<any>
    ): Bluebird<any>;

    query(q: { type: string, query: any }): Bluebird<any>;

    onUpdate(observer: Rx.Observer<any>): Rx.Subscription;

    notifyUpdate(
      type: typeof Model,
      id: number,
      value: StringIndexed<any>,
      opts?: string | symbol | (string | symbol)[]
    ): Bluebird<any>;
  }

  namespace Storage {
    interface BlockFilter {
      [index: number]: string | BlockFilter,
    }
    function createFilter(blockFilter: BlockFilter): (elem: any) => boolean;
  }
}
