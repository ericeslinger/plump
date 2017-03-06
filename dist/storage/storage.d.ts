import * as Rx from 'rxjs/Rx';
import * as Bluebird from 'bluebird';

import { StringIndexed } from '../util.d';

import { Model } from '../model';
import { Relationship } from '../relationship';

export as namespace storage;

declare abstract class Storage {
  static massReplace(
    block: Storage.BlockFilter,
    context: StringIndexed<any>
  ): Storage.BlockFilter;

  constructor(opts: { terminal?: boolean });

  onUpdate(observer: Rx.Observer<any>): Rx.Subscription;

  notifyUpdate(
    type: Model,
    id: number,
    value: Model.Data,
    opts?: string | symbol | (string | symbol)[]
  ): Bluebird<any>;

  hot(type: Model, id: number): boolean;

  write(
    type: Model,
    value: {
      [index: string]: any,
      id?: number
    }
  ): Bluebird<Model.Data>;

  read(
    type: Model,
    id: number,
    key?: string | string[]
  ): Bluebird<Model.Data>;

  wipe(
    type: Model,
    id: number,
    field: string | symbol
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
  ): Bluebird<[Relationship.Data[], Relationship.Data[]]>;

  modifyRelationship(
    type: Model,
    id: number,
    relationship: string,
    childId: number,
    extras?: StringIndexed<any>
  ): Bluebird<any>;

  remove(
    type: Model,
    id: number,
    relationshipTitle: string,
    childId: number
  ): Bluebird<any>;

  // TODO: What is this?
  query?(q: { type: string, query: any }): Bluebird<(Model.Data | Relationship.Data)[]>;
}

declare namespace Storage {
  interface BlockFilter {
    [index: number]: string | BlockFilter,
    0: 'where',
  }
  function createFilter(blockFilter: BlockFilter): (elem: any) => boolean;
}

export { Storage };
