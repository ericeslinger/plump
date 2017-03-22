import * as Rx from 'rxjs/Rx';
import * as Bluebird from 'bluebird';

import { StringIndexed } from '../util.d';

import { Storage } from './storage.d';
import { Model } from '../model.d';
import { Relationship } from '../relationship.d';

export as namespace keyValueStorage;

declare abstract class KeyValueStore extends Storage {
  abstract logStore(): void;
  abstract _keys(typeName: string): Bluebird<string[]>;
  abstract _get(k: string): Bluebird<Model.Attributes | Relationship.Data[] | null>;
  abstract _set(k: string, v: any): Bluebird<any>;
  abstract _del(k: string): Bluebird<any>;

  keyString(typeName: string, id: number, relationship: string): string;
}

export { KeyValueStore };
