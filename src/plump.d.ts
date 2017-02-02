import * as Rx from 'rxjs/Rx.d';
import * as Bluebird from '@types/bluebird';

import { StringIndexed, NumericIDed } from './util.d';

import { Model } from './model.d';
import * as Relationship from './relationship.d';
import { Storage, KeyValueStore } from './storage/index.d';

export as namespace plump;

declare class Plump {
    new (opts?: {
      storage?: Array<Storage>,
      types?: Array<typeof Model>
    });

    addTypesFromSchema(
      schema: Model.Fields, // representation of Model.$fields
      ExtendingModel: Model
    ): void;

    addType(T: typeof Model): void;

    type(T: string): typeof Model;

    types(): (typeof Model)[];

    addStore(store: Storage): void;

    find(
      t: string | typeof Model,
      id: number
    ): Model;

    forge(
      t: string | typeof Model,
      val: Model.Fields
    ): Model;

    subscribe(
      typeName: string,
      id: number,
      handler: () => void
    ): Rx.Subscription;

    teardown(): void;

    get(
      type: typeof Model,
      id: number,
      keyOpts?: PropertyKey[]
    ): Bluebird<Model>;

    streamGet(
      type: typeof Model,
      id: number,
      keyOpts?: PropertyKey[]
    ): Rx.Observable<Model>;

    save(
      type: typeof Model,
      val: Model.Fields
    ): Bluebird<any>;

    delete(
      type: typeof Model,
      id: number
    ): Bluebird<Model>;

    add(
      type: typeof Model,
      id: number,
      relationshipTitle: string,
      childId: number,
      extras?: StringIndexed<any>
    ): Bluebird<Model>;

    restRequest(opts: any): Bluebird<any>;

    modifyRelationship(
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

    invalidate(
      type: typeof Model,
      id: number,
      field: symbol | string,
    ): Bluebird<any>;
}
