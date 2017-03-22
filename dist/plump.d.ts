import * as Rx from 'rxjs/Rx.d';
import * as Bluebird from '@types/bluebird';

import { StringIndexed, NumericIDed } from './util.d';

import { Model } from './model.d';
import * as Relationship from './relationship.d';
import { Storage } from './storage/index.d';

export as namespace plump;

declare class Plump {
    constructor(opts?: {
      storage?: Storage[],
      types?: Model[],
    });

    addTypesFromSchema(
      schemata: { [k: string]: Model.Schema },
      ExtendingModel: Model
    ): void;

    addType(T: Model): void;

    type(T: string): Model;

    types(): Model[];

    addStore(store: Storage): void;

    find(
      t: string | Model,
      id: number
    ): Model;

    forge(
      t: string | Model,
      val: Model.Data
    ): Model;

    subscribe(
      typeName: string,
      id: number,
      handler: () => void
    ): Rx.Subscription;

    restRequest(opts: any): Bluebird<Model.Data>;

    teardown(): void;

    get(
      type: Model,
      id: number,
      keyOpts?: PropertyKey[]
    ): Bluebird<Model>;

    streamGet(
      type: Model,
      id: number,
      keyOpts?: PropertyKey[]
    ): Rx.Observable<Model>;

    save(
      type: Model,
      val: Model.Schema
    ): Bluebird<any>;

    delete(
      type: Model,
      id: number
    ): Bluebird<any>;

    add(
      type: Model,
      id: number,
      relationshipTitle: string,
      childId: number,
      extras?: StringIndexed<any>
    ): Bluebird<any>;


    modifyRelationship(
      type: Model,
      id: number,
      relationshipTitle: string,
      childId: number,
      extras?: StringIndexed<any>
    ): Bluebird<any>;

    remove(
      type: Model,
      id: number,
      relationshipTitle: string,
      childId: number
    ): Bluebird<any>;

    invalidate(
      type: Model,
      id: number,
      field: symbol | string,
    ): Bluebird<any>;
}
