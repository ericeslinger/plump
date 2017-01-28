// Type definitions for Plump 0.6.0
// Project: Typing
// Definitions by: Nate Pinsky <github.com/mrpinsky>

// import * as Storage from './storage/storage.d';

export as namespace plump;

/*~ This declaration specifies that the class constructor function
 *~ is the exported object from the file
 */
export = Plump;

/*~ Write your module's methods and properties in this class */
declare class Plump {
    constructor(opts?: { storage?: Array<any>, types?: Array<any>});

    $subscriptions: any;
    $storeSubscriptions: any;
    $storage: Array<any>;
    $types: any;

    addTypesFromSchema(schema: any);
}

/*~ If you want to expose types from your module as well, you can
 *~ place them in this block.
 */
declare namespace Plump {
}
