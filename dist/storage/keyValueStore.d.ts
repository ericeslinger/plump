/// <reference types="bluebird" />
import * as Bluebird from 'bluebird';
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
}
