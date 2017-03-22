import * as Rx from 'rxjs/Rx';
import * as Bluebird from 'bluebird';

import { StringIndexed } from '../util.d';

import { KeyValueStore } from './keyValueStore.d';
import { Model } from '../model.d';
import { Relationship } from '../relationship.d';

export as namespace MemoryStore;

declare class MemoryStore extends KeyValueStore {
  constructor(opts?: {
    terminal?: boolean,
  });

  logStore(): void;
  _keys(typeName: string): Bluebird<PropertyKey[]>;
  _get(k: string): Bluebird<Model.Attributes | Relationship.Data[] | null>;
  _set(k: string, v: any): Bluebird<any>;
  _del(k: string): Bluebird<any>;

  keyString(typeName: string, id: number, relationship: string): string;
}

export { MemoryStore };
