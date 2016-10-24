'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Storage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* eslint no-unused-vars: 0 */

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _Rx = require('rxjs/Rx');

var _Rx2 = _interopRequireDefault(_Rx);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $emitter = Symbol('$emitter');

// type: an object that defines the type. typically this will be
// part of the Model class hierarchy, but Storage objects call no methods
// on the type object. We only are interested in Type.$name, Type.$id and Type.$fields.
// Note that Type.$id is the *name of the id field* on instances
//    and NOT the actual id field (e.g., in most cases, Type.$id === 'id').
// id: unique id. Often an integer, but not necessary (could be an oid)


// hasMany relationships are treated like id arrays. So, add / remove / has
// just stores and removes integers.

var Storage = exports.Storage = function () {
  function Storage() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Storage);

    // a "terminal" storage facility is the end of the storage chain.
    // usually sql on the server side and rest on the client side, it *must*
    // receive the writes, and is the final authoritative answer on whether
    // something is 404.

    // terminal facilities are also the only ones that can authoritatively answer
    // authorization questions, but the design may allow for authorization to be
    // cached.
    this.terminal = opts.terminal || false;
    this[$emitter] = new _Rx2.default.Subject();
  }

  _createClass(Storage, [{
    key: 'hot',
    value: function hot(type, id) {
      // t: type, id: id (integer).
      // if hot, then consider this value authoritative, no need to go down
      // the datastore chain. Consider a memorystorage used as a top-level cache.
      // if the memstore has the value, it's hot and up-to-date. OTOH, a
      // localstorage cache may be an out-of-date value (updated since last seen)

      // this design lets hot be set by type and id. In particular, the goal for the
      // front-end is to have profile objects be hot-cached in the memstore, but nothing
      // else (in order to not run the browser out of memory)
      return false;
    }
  }, {
    key: 'write',
    value: function write(type, value) {
      // if value.id exists, this is an update. If it doesn't, it is an
      // insert. In the case of an update, it should merge down the tree.
      return Promise.reject(new Error('Write not implemented'));
    }
  }, {
    key: 'onCacheableRead',
    value: function onCacheableRead(type, value) {
      // override this if you want to not react to cacheableRead events.
      return this.write(type, value);
    }

    // TODO: write the two-way has/get logic into this method
    // and provide override hooks for readOne readMany

  }, {
    key: 'read',
    value: function read(type, id, key) {
      if (key && type.$fields[key].type === 'hasMany') {
        return this.readMany(type, id, key);
      } else {
        return this.readOne(type, id);
      }
    }
  }, {
    key: 'readOne',
    value: function readOne(type, id) {
      return Promise.reject(new Error('ReadOne not implemented'));
    }
  }, {
    key: 'readMany',
    value: function readMany(type, id, key) {
      return Promise.reject(new Error('ReadMany not implemented'));
    }
  }, {
    key: 'delete',
    value: function _delete(type, id) {
      return Promise.reject(new Error('Delete not implemented'));
    }
  }, {
    key: 'add',
    value: function add(type, id, relationship, childId) {
      var valence = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

      // add to a hasMany relationship
      // note that hasMany fields can have (impl-specific) valence data
      // example: membership between profile and community can have perm 1, 2, 3
      return Promise.reject(new Error('Add not implemented'));
    }
  }, {
    key: 'remove',
    value: function remove(type, id, relationship, childId) {
      // remove from a hasMany relationship
      return Promise.reject(new Error('remove not implemented'));
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(type, id, relationship, childId) {
      var valence = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

      // should modify an existing hasMany valence data. Throw if not existing.
      return Promise.reject(new Error('modifyRelationship not implemented'));
    }
  }, {
    key: 'query',
    value: function query(q) {
      // q: {type: string, query: any}
      // q.query is impl defined - a string for sql (raw sql)
      return Promise.reject(new Error('Query not implemented'));
    }
  }, {
    key: 'onUpdate',
    value: function onUpdate(observer) {
      // observer follows the RxJS pattern - it is either a function (for next())
      // or {next, error, complete};
      // returns an unsub hook (retVal.unsubscribe())
      return this[$emitter].subscribe(observer);
    }
  }, {
    key: 'update',
    value: function update(type, id, value) {
      this[$emitter]({
        type: type, id: id, value: value
      });
    }
  }, {
    key: '$$testIndex',
    value: function $$testIndex() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (args.length === 1) {
        if (args[0].$id === undefined) {
          throw new Error('Illegal operation on an unsaved new model');
        }
      } else {
        if (args[1][args[0].$id] === undefined) {
          throw new Error('Illegal operation on an unsaved new model');
        }
      }
    }
  }]);

  return Storage;
}();