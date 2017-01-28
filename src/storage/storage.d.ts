// Type definitions for Plump 0.6.0
// Project: Storage
// Definitions by: Nate Pinsky <github.com/mrpinsky>

/*~ This is the module template file for class modules.
 *~ You should rename it to index.d.ts and place it in a folder with the same name as the module.
 *~ For example, if you were writing a file for "super-greeter", this
 *~ file should be 'super-greeter/index.d.ts'
 */

/*~ Note that ES6 modules cannot directly export class objects.
 *~ This file should be imported using the CommonJS-style:
 *~   import x = require('someLibrary');
 *~
 *~ Refer to the documentation to understand common
 *~ workarounds for this limitation of ES6 modules.
 */

import * as Rx from 'rxjs/Rx.d';
import * as Bluebird from '@types/bluebird';

/*~ If this module is a UMD module that exposes a global variable 'myClassLib' when
 *~ loaded outside a module loader environment, declare that global here.
 *~ Otherwise, delete this declaration.
 */
export as namespace storage;

/*~ This declaration specifies that the class constructor function
 *~ is the exported object from the file
 */
export = Storage;

/*~ Write your module's methods and properties in this class */
declare class Storage {
  constructor(opts: { terminal?: any });

  terminal: any;
  $emitter: Rx.Subject<any>;

  hot(type: any, id: number): boolean;
  write(type: any, value: { id: any }): Bluebird<Error | any>;
  read(type: any, id: number, key: string | string[]): Bluebird<any>;
  wipe(type: any, id: number, field: string): Bluebird<Error | any>;
  readOne(type: any, id: number): Bluebird<Error | any>;
  readMany(type: any, id: number): Bluebird<Error | any>;
  delete(type: any, id: number): Bluebird<Error | any>;
  add(type: any, id: number, relationship: any, childId: number, valence: any): Bluebird<Error | any>;
  remove(type: any, id: number, relationship: any, childId: number): Bluebird<Error | any>;
  modifyRelationship(type: any, id: number, relationship: any, childId: number, valuence: any): Bluebird<Error | any>;
  query(q: { type: string, query: any }): Bluebird<Error | any>;
  onUpdate(observer: Rx.Observer<any>): { unsubscribe(): any };
  notifyUpdate(type: any, id: number, value: any, opts: any[]): Bluebird<any>;
  $$testIndex(...args: any[]): void | never;

  static massReplace(block: any[], context: any): any[];
}

/*~ If you want to expose types from your module as well, you can
 *~ place them in this block.
 */
declare namespace Storage {
    export interface MyClassMethodOptions {
        width?: number;
        height?: number;
    }
}
