function: resolve(type, key)
  should do a reduce on datasource#read calls and return the first that does not resolve as null.

function: subscribe
* should do a forEach on datasources that wires them together for that particular item. ex:
  * memstore <-> localforage <-> rest
  * events from rest bubble to localforage, and thence up to memstore. each layer handles rethrowing the event if needed.
  * somewhere in there is the local storage to the object, but that's not memstore. memstore is the shared (on the constructor // facade pattern) value that is the first-tier in memory cache.
* the data model should probably take care of the actual propagation of events. like what actually happens is: REST says the model is updated, tells model. Model tells localforage and memstore.
* aaaactually, localforage cannot originate events, and probably neither can memstore. Events originate at the bottom of the storage stack or can be manually injected (from the interface). And probably events that come from the interface end up pushing into the bottom and then generate their own event that bubbles up normally (question is basically one of optimism here, do we optimistically update the other stores and roll back on error, or not?)
