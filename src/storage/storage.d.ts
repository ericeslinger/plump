import * as Rx from 'rxjs/Rx';
import * as Bluebird from 'bluebird';

import { StringIndexed } from '../util.d';

import { Model } from '../model';

export as namespace storage;

declare abstract class Storage {
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

declare namespace Storage {
  interface BlockFilter {
    [index: number]: string | BlockFilter,
    0: 'where',
  }
  function createFilter(blockFilter: BlockFilter): (elem: any) => boolean;
}

export { Storage };
