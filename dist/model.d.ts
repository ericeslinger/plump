<<<<<<< HEAD
import * as Rx from 'rxjs/Rx';
import * as Bluebird from 'bluebird';

import { StringIndexed, NumericIDed} from './util';
import { Plump } from './plump.d';
import * as Relationship from './relationship.d'
import { Storage } from './storage/storage.d';

declare abstract class Model {
  static $id: string;
  static $name: string;
  static $schema: Model.Schema;
  static $included: any; // TODO: Figure out what this looks like

  static fromJSON(json: Model): void;
  static toJSON(): {
    $id: string,
    $name: string,
    $include: any,
    $schema: Model.Schema,
  };

  // TODO: Figure out shape of opts
  static $rest(
    plump: Plump,
    opts?: {
      url?: string,
      method?: string,
      payload?: any,
    }
  ): Bluebird<any>;

  // The keys of opts here should be a subset of the keys of Model.$fields
  // Assign calls schematize, and then adds any defaults specified in the schema
  static assign(opts: StringIndexed<any>): Model.Data;

  static schematize(v: StringIndexed<any>, opts: { includeId: boolean }): Model.Data;


  constructor(opts: Model.Data, plump: Plump);

  $subscribe(callback: () => void): Rx.Subscription;
  $subscribe(fields: string | string[], callback: () => void): Rx.Subscription;

  $teardown(): void;

  // Fetches from DB and then applies $dirty deltas on top before returning
  $get(opts?: (string | symbol)[]): Bluebird<Model.Data>;

  // Return a Promise that resolves to same thing as $get
  // Flushes $dirty to plump
  // Should take an argument list that defaults to $all
  // so that user can specify particular deltas if desired
  $save(): Bluebird<Model.Data>;

  // No longer async
  // Returns this so you can .then(self => self.$save())
  // a few error states for setting something you can't set
  // JUST pushes data into $dirty
  $set(u?: StringIndexed<any>): Model;

  $delete(): Bluebird<Model.Data>;

  $rest(opts?: StringIndexed<any>): Bluebird<Model.Data>;

  /* $add, $remove, $modifyRelationship should generate
     deltas that get applied at $save */

  $add(
    key: PropertyKey,
    item: number | NumericIDed | { [field: string]: any },
    extras?: StringIndexed<any>
  ): Model;

  $modifyRelationship(
    key: PropertyKey,
    item: number | NumericIDed,
    extras?: StringIndexed<any>
  ): Model;

  $remove(
    key: PropertyKey,
    item: number | NumericIDed
  ): Model;
}

declare namespace Model {
  type Attribute = number | string | boolean | Date | string[];
  type Attributes = StringIndexed<Attribute>;

  interface Relationship {
    id: number,
    meta: StringIndexed<number | string>,
  }

  // TODO: Make sure typeof default === type
  interface FieldMeta {
    type: string | Relationship.Relationship,
    readOnly: boolean,
    default?: any,
  }

  interface AttributeMeta extends FieldMeta {
    type: 'number' | 'string' | 'boolean' | 'date' | 'array',
    default?: number | string | boolean | Date | string[],
  }

  interface RelationshipMeta extends FieldMeta {
    type: Relationship.Relationship,
    default: Model.Relationship[],
  }

  interface Schema {
    $id: string,
    attributes: StringIndexed<AttributeMeta>,
    relationships: StringIndexed<RelationshipMeta>,
  }

  interface Data {
    type?: string,
    id?: number,
    attributes?: StringIndexed<Attribute>,
    relationships?: StringIndexed<Model.Relationship[]>,
  }
}

export { Model };
=======
import { Subscription, Observer } from 'rxjs/Rx';
import * as Interfaces from './dataTypes';
export declare abstract class Model {
    private plump;
    id: string | number;
    static typeName: string;
    static schema: Interfaces.ModelSchema;
    private static storeCache;
    private dirty;
    readonly typeName: any;
    readonly schema: any;
    dirtyFields(): string[];
    constructor(opts: any, plump: any);
    $$copyValuesFrom(opts?: {}): void;
    $$resetDirty(): void;
    get(opts?: string | string[]): any;
    bulkGet(): any;
    save(): any;
    set(update: any): this;
    subscribe(cb: Observer<Interfaces.ModelData>): Subscription;
    subscribe(fields: string | string[], cb: Observer<Interfaces.ModelData>): Subscription;
    delete(): any;
    $rest(opts: any): any;
    add(key: string, item: Interfaces.RelationshipItem): this;
    modifyRelationship(key: string, item: Interfaces.RelationshipItem): this;
    remove(key: string, item: Interfaces.RelationshipItem): this;
    static applyDefaults(v: any): Interfaces.ModelData;
    static applyDelta(current: any, delta: any): any;
    static cacheGet(store: any, key: any): any;
    static cacheSet(store: any, key: any, value: any): void;
    static resolveAndOverlay(update: any, base?: {
        attributes: {};
        relationships: {};
    }): {
        attributes: any;
        relationships: any;
    };
    static resolveRelationships(deltas: any, base?: {}): any;
    static resolveRelationship(deltas: Interfaces.RelationshipDelta[], base?: Interfaces.RelationshipItem[]): Interfaces.RelationshipItem[];
}
>>>>>>> master
