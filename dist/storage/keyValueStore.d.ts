/// <reference types="bluebird" />
import * as Bluebird from 'bluebird';
<<<<<<< HEAD

import { StringIndexed } from '../util.d';

import { Storage } from './storage.d';
import { Model } from '../model.d';
import { Relationship } from '../relationship.d';

export as namespace KeyValueStore;

declare abstract class KeyValueStore extends Storage {
  abstract logStore(): void;
  abstract _keys(typeName: string): Bluebird<PropertyKey[]>;
  abstract _get(k: string): Bluebird<Model.Attributes | Relationship.Data[] | null>;
  abstract _set(k: string, v: any): Bluebird<any>;
  abstract _del(k: string): Bluebird<any>;

  keyString(typeName: string, id: number, relationship: string): string;
=======
import { Storage } from './storage';
import * as Interfaces from '../dataTypes';
export declare abstract class KeyValueStore extends Storage {
    abstract _keys(typeName: string): Bluebird<string[]>;
    abstract _get(k: string): Bluebird<Interfaces.ModelData | null>;
    abstract _set(k: string, v: Interfaces.ModelData): Bluebird<Interfaces.ModelData>;
    abstract _del(k: string): Bluebird<Interfaces.ModelData>;
    $$maxKey(t: string): Bluebird<number>;
    writeAttributes(inputValue: Interfaces.IndefiniteModelData): Bluebird<any>;
    readAttributes(value: Interfaces.ModelReference): Bluebird<Interfaces.ModelData>;
    cache(value: Interfaces.ModelData): Bluebird<any>;
    cacheAttributes(value: Interfaces.ModelData): Bluebird<any>;
    cacheRelationship(value: Interfaces.ModelData): Bluebird<any>;
    readRelationship(value: Interfaces.ModelReference, relName: string): Bluebird<Interfaces.ModelData>;
    delete(value: Interfaces.ModelReference): Bluebird<void>;
    wipe(value: Interfaces.ModelReference, field: string): Bluebird<Interfaces.ModelData>;
    writeRelationshipItem(value: Interfaces.ModelReference, relName: string, child: Interfaces.RelationshipItem): Bluebird<Interfaces.ModelData>;
    deleteRelationshipItem(value: Interfaces.ModelReference, relName: string, child: Interfaces.RelationshipItem): Bluebird<Interfaces.ModelData>;
    keyString(value: Interfaces.ModelReference): string;
>>>>>>> master
}
