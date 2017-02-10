import * as Rx from 'rxjs/Rx';
import * as Bluebird from 'bluebird';
import * as Axios from 'axios';

import { StringIndexed, NumericIDed} from './util';
import { Plump } from './plump.d';
import { Relationship } from './relationship.d'
import { Storage } from './storage/storage.d';

declare abstract class Model {
  static $id: string;
  static $name: string;
  static $self: symbol;
  static $fields: Model.Fields;
  static $included: Storage.BlockFilter;

  static fromJSON(json: Model): void;
  static toJSON(): Model;

  // TODO: Figure out shape of opts
  static $rest(
    plump: Plump,
    opts?: Axios.AxiosRequestConfig
  ): Bluebird<any>;

  // The keys of opts here should be a subset of the keys of Model.$fields
  static assign(opts: StringIndexed<any>): StringIndexed<any>;


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

declare namespace Model {
  interface Fields {
    [field: string]: {
      type: "number" | "string" | "date" | "array" | "hasMany" | "boolean",
      readOnly: boolean,
      default?: any,
      relationship: Relationship,
    }
  }
}

export { Model };
