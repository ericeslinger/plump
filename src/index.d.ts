// Type definitions for Plump 0.6.0
// Project: https://github.com/kstf/plump
// Definitions by: Nate Pinsky <github.com/mrpinsky>

import * as Rx from 'rxjs/Rx.d';
import * as Bluebird from '@types/bluebird';

export as namespace plump;

/*~ This declaration specifies that the class constructor function
 *~ is the exported object from the file
 */
export = Plump;

/*~ Write your module's methods and properties in this class */
declare class Plump {
    new (opts?: { storage?: Array<Plump.Storage>, types?: Array<Plump.PlumpObject>});

    $subscriptions: any;
    $storeSubscriptions: any;
    $storage: Array<Plump.Storage>;
    $types: Plump.PlumpObject;

    addTypesFromSchema(schema: any, ExtendingModel: Plump.Model): void;

    addType(T: Plump.PlumpObject): void;

    type(T: string): Plump.PlumpObject;

    types(): Plump.PlumpObject[];

    addStore(store: Plump.Storage): void;

    find(t: string | Plump.PlumpObject, id: number): Plump.PlumpObject;

    forge(t: string | Plump.PlumpObject, val: any): Plump.PlumpObject;

    subscribe(typeName: string, id: number, handler): Rx.Subscription;

    teardown(): void;

    get(type: Plump.PlumpObject, id: number, keyOpts?: PropertyKey[]): Bluebird<Plump.PlumpObject>;

    streamGet(type: Plump.PlumpObject, id: number, keyOpts?: PropertyKey[]): Rx.Observable<Plump.PlumpObject>;

    save(...args: Array<any>): Bluebird<any>;

    delete(...args: Array<any>): Bluebird<Plump.PlumpObject>;

    add(...args: Array<any>): Bluebird<any>;

    restRequest(opts: any): Bluebird<any>;

    modifyRelationship(...args: Array<any>): Bluebird<any>;

    remove(...args: Array<any>): any;

    invalidate(type: Plump.PlumpObject, id: number): Bluebird<any>;
}

/*~ If you want to expose types from your module as well, you can
 *~ place them in this block.
 */
declare namespace Plump {
  class Storage {
    constructor(opts: { terminal?: any });

    terminal: any;
    $emitter: Rx.Subject<any>;

    hot(type: PlumpObject, id: number): boolean;

    write(type: PlumpObject, value: { id: any }): Bluebird<any>;

    read(type: PlumpObject, id: number, key: string | string[]): Bluebird<any>;

    wipe(type: PlumpObject, id: number, field: string): Bluebird<any>;

    readOne(type: PlumpObject, id: number): Bluebird<any>;

    readMany(type: PlumpObject, id: number): Bluebird<any>;

    delete(type: PlumpObject, id: number): Bluebird<any>;

    add(type: PlumpObject, id: number, relationship: any, childId: number, valence: any): Bluebird<any>;

    remove(type: PlumpObject, id: number, relationship: any, childId: number): Bluebird<any>;

    modifyRelationship(type: PlumpObject, id: number, relationship: any, childId: number, valuence: any): Bluebird<any>;

    query(q: { type: string, query: any }): Bluebird<any>;

    onUpdate(observer: Rx.Observer<any>): { unsubscribe(): any };

    notifyUpdate(type: PlumpObject, id: number, value: any, opts: any[]): Bluebird<any>;

    $$testIndex(...args: any[]): void | never;


    static massReplace(block: any[], context: any): any[];
  }

  class Model {
    static $id: string;
    static $name: string;
    static $self: symbol;
    static $fields: any;

    static fromJSON(json: PlumpObject): void;

    static toJSON(): PlumpObject;

    static $rest(plump: Plump, opts?: any): Bluebird<any>;

    static assign(opts: any): any;

    $store: Storage;
    $relationships: any;
    $subject: Rx.BehaviorSubject<any>;
    $loaded: any;

    new (opts: any, plump: Plump);

    $get(opts?: any): any;

    $save(): any;

    $set(u?: Storage): Model;

    $delete(): PlumpObject;

    $rest(opts?): any;

    $add(key: PropertyKey, item: any, extras: any): Bluebird<any>;

    $modifyRelationship(key: PropertyKey, item: any, extras: any): Bluebird<any>;

    $remove(key: PropertyKey, item: any): Bluebird<any>;

    $teardown(): void;
  }

  namespace Model {}

  export interface PlumpObject {
    $id: number,
    $name: string,
    $fields: any[],
  }
}
