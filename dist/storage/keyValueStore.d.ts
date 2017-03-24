/// <reference types="bluebird" />
import * as Bluebird from 'bluebird';
import { Storage } from './storage';
import { Interfaces } from '../dataTypes';
export declare abstract class KeyValueStore extends Storage {
    abstract _keys(typeName: string): Bluebird<string[]>;
    abstract _get(k: string): Bluebird<any | null>;
    abstract _set(k: string, v: any): Bluebird<any>;
    abstract _del(k: string): Bluebird<any>;
    $$maxKey(t: any): Bluebird<number>;
    writeAttributes(inputValue: any): Bluebird<any>;
    readAttributes(value: any): Bluebird<any>;
    cache(value: any): Bluebird<any>;
    cacheAttributes(value: any): Bluebird<any>;
    cacheRelationship(value: any): Bluebird<any>;
    readRelationship(value: any, relName: any): Bluebird<any>;
    delete(value: any): Bluebird<void>;
    wipe(value: any, field: any): Bluebird<any>;
    writeRelationshipItem(value: any, relName: any, child: any): Bluebird<any>;
    deleteRelationshipItem(value: any, relName: any, child: any): Bluebird<any>;
    keyString(value: Interfaces.ModelReference): string;
}
