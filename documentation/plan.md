# The basic plan for Guild.ts

We need a datastore that can do some things:
* uniform interface in terms of sync / async. Currently, we have sync accessors that will automatically update the data's value when first accessed. This has some problems.
  * sync access is not guaranteed to be up to date - if you get foo.value, it may be undefined, it may be the old cached value, and it may be the up-to-date value. All we know is *eventually* it will be up-to-date.
  * putting an object into up-to-date state requires an async call, which isn't terrible, but the ergonomics here could be improved.
  * In general, it's probably better to have the object be accessed by default via async ops. There can be a mixin to auto-update a sync properties dictionary, for stuff like angular1 that handles its own change detection.
  * This can be paired with making each object an event emitter, so we can deal with value changes using RxJS and be nice and future-compatible with angular2, as well as any other redux-ish architecture.
* pluggable storage interface. I want the majority of my code to be shared between front and back end. This means we need to plug in storage types - the back end hits SQL in the event of a cache miss (and caches in redis), and the front end hits the REST api in the event of a cache miss (and caches in localforage)
* smart event system. The current event model is haphazard and needs a clean api. The whole model needs to work with a socket.io interface - we need to be able to wire the event emitter from above into socket.io easily.
* shared facade items. we don't want the backend to run OOM because each REST hit created another zombie event emitter looking at documents/1
