# Guild: Basic Pluggable Javascript Datastore

Guild is a simple pluggable javascript datastore. It should work  with SQL, Redis, LocalForage
and HTTP interfaces.

Declare object schema, find data, use the data in your frontend or over and api.

Especially handy when you want to push data from an API to the front end and use the same
data models in the back end and front end. Agnostic as to your front end library (angular or whatever)

Basic stuff (move this to real documentation later)

You should subclass DS.Base with your model type, but this isn't necessary if you want to do something
strange. Methods with a `$` prefix like `$get` and so on are the standard API (thinking the prefix will help
prevent field name collisions with business logic stuff). Methods with `$$` prefixes are intended for internal
use and not supported (they're convenience functions and used to expose some hooks to test code, and are
subject to breaking changes).
