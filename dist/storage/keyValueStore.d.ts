import * as Rx from 'rxjs/Rx';
import * as Bluebird from 'bluebird';

import { StringIndexed } from '../util.d';

import * as Storage from './storage.d';

export as namespace keyValueStorage;

declare abstract class KeyValueStore extends Storage {
  abstract logStore(): void;
  abstract _keys(typeName: string): Bluebird<PropertyKey[]>;
  abstract _get(k: string): Bluebird<any> | null;
  abstract _set(k: string, v: any): Bluebird<void>;
  abstract _del(k: string): Bluebird<any>;
}

export { KeyValueStore };
