function: resolve(type, key)
  should do a reduce on datasource#read calls and return the first that does not resolve as null.

function: subscribe
* should do a forEach on datasources that wires them together for that particular item. ex:
  * memstore <-> localforage <-> rest
  * events from rest bubble to localforage, and thence up to memstore. each layer handles rethrowing the event if needed.
  * somewhere in there is the local storage to the object, but that's not memstore. memstore is the shared (on the constructor // facade pattern) value that is the first-tier in memory cache.
* the data model should probably take care of the actual propagation of events. like what actually happens is: REST says the model is updated, tells model. Model tells localforage and memstore.
* aaaactually, localforage cannot originate events, and probably neither can memstore. Events originate at the bottom of the storage stack or can be manually injected (from the interface). And probably events that come from the interface end up pushing into the bottom and then generate their own event that bubbles up normally (question is basically one of optimism here, do we optimistically update the other stores and roll back on error, or not?)


actually - actually, we need to disconnect storage from events. There's two event sources on each side, top and bottom. For the front end, the top is the user interface events (typing, clicking etc) and the bottom is websocket events from other non-user-initiated changes. On the server side, the top is rest PUT / POST / PATCH requests and the bottom is the database itself firing ON UPDATE NOTIFY.

The event sources should be separated from storage and treated differently. Ex: on a top-down event, we need to propagate changes down, optimistically updating mid layers, and then either confirm or undo those changes. On a bottom-up event, we need to propagate changes up but do not need to confirm changes.
