'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Storage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* eslint no-unused-vars: 0 */

var _bluebird = require('bluebird');

var Bluebird = _interopRequireWildcard(_bluebird);

var _Rx = require('rxjs/Rx');

var _model = require('../model');

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
    this[$emitter] = new _Rx.Subject();
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
      return Bluebird.reject(new Error('Write not implemented'));
    }

    // TODO: write the two-way has/get logic into this method
    // and provide override hooks for readOne readMany

  }, {
    key: 'read',
    value: function read(type, id, key) {
      var _this = this;

      var keys = [_model.$self];
      if (Array.isArray(key)) {
        keys = key;
      } else if (key) {
        keys = [key];
      }
      if (keys.indexOf(_model.$all) >= 0) {
        keys = Object.keys(type.$fields).filter(function (k) {
          return type.$fields[k].type === 'hasMany';
        });
        keys.push(_model.$self);
      }
      // if (keys.indexOf($self) < 0) {
      //   keys.push($self);
      // }
      return Bluebird.resolve().then(function () {
        return Bluebird.all(keys.map(function (k) {
          if (k !== _model.$self && type.$fields[k].type === 'hasMany') {
            return _this.readMany(type, id, k);
          } else {
            return _this.readOne(type, id);
          }
        })).then(function (valArray) {
          var selfIdx = keys.indexOf(_model.$self);
          var retVal = {};
          if (selfIdx >= 0) {
            if (valArray[selfIdx] === null) {
              return null;
            } else {
              Object.assign(retVal, valArray[selfIdx]);
            }
          }
          valArray.forEach(function (val, idx) {
            if (idx !== selfIdx) {
              Object.assign(retVal, val);
            }
          });
          return retVal;
        });
      }).then(function (result) {
        if (result) {
          return _this.notifyUpdate(type, id, result, keys).then(function () {
            return result;
          });
        } else {
          return result;
        }
      });
    }
  }, {
    key: 'readOne',
    value: function readOne(type, id) {
      return Bluebird.reject(new Error('ReadOne not implemented'));
    }
  }, {
    key: 'readMany',
    value: function readMany(type, id, key) {
      return Bluebird.reject(new Error('ReadMany not implemented'));
    }
  }, {
    key: 'delete',
    value: function _delete(type, id) {
      return Bluebird.reject(new Error('Delete not implemented'));
    }
  }, {
    key: 'add',
    value: function add(type, id, relationship, childId) {
      var valence = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

      // add to a hasMany relationship
      // note that hasMany fields can have (impl-specific) valence data
      // example: membership between profile and community can have perm 1, 2, 3
      return Bluebird.reject(new Error('Add not implemented'));
    }
  }, {
    key: 'remove',
    value: function remove(type, id, relationship, childId) {
      // remove from a hasMany relationship
      return Bluebird.reject(new Error('remove not implemented'));
    }
  }, {
    key: 'modifyRelationship',
    value: function modifyRelationship(type, id, relationship, childId) {
      var valence = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

      // should modify an existing hasMany valence data. Throw if not existing.
      return Bluebird.reject(new Error('modifyRelationship not implemented'));
    }
  }, {
    key: 'query',
    value: function query(q) {
      // q: {type: string, query: any}
      // q.query is impl defined - a string for sql (raw sql)
      return Bluebird.reject(new Error('Query not implemented'));
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
    key: 'notifyUpdate',
    value: function notifyUpdate(type, id, value) {
      var _this2 = this;

      var opts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [_model.$self];

      var keys = opts;
      if (!Array.isArray(keys)) {
        keys = [keys];
      }
      return Bluebird.all(keys.map(function (field) {
        return Bluebird.resolve().then(function () {
          if (_this2.terminal) {
            if (field !== _model.$self) {
              if (value !== null) {
                return _this2[$emitter].next({
                  type: type, id: id, field: field, value: value[field]
                });
              } else {
                return _this2.readMany(type, id, field).then(function (list) {
                  return _this2[$emitter].next({
                    type: type, id: id, field: field, value: list[field]
                  });
                });
              }
            } else {
              return _this2[$emitter].next({
                type: type, id: id, value: value
              });
            }
          } else {
            return null;
          }
        });
      }));
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
      } else if (args[1][args[0].$id] === undefined) {
        throw new Error('Illegal operation on an unsaved new model');
      }
    }
  }]);

  return Storage;
}();

// convenience function that walks an array replacing any {id} with context.id


Storage.massReplace = function massReplace(block, context) {
  return block.map(function (v) {
    if (Array.isArray(v)) {
      return massReplace(v, context);
    } else if (typeof v === 'string' && v.match(/^\{(.*)\}$/)) {
      return context[v.match(/^\{(.*)\}$/)[1]];
    } else {
      return v;
    }
  });
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3RvcmFnZS5qcyJdLCJuYW1lcyI6WyJCbHVlYmlyZCIsIiRlbWl0dGVyIiwiU3ltYm9sIiwiU3RvcmFnZSIsIm9wdHMiLCJ0ZXJtaW5hbCIsInR5cGUiLCJpZCIsInZhbHVlIiwicmVqZWN0IiwiRXJyb3IiLCJrZXkiLCJrZXlzIiwiQXJyYXkiLCJpc0FycmF5IiwiaW5kZXhPZiIsIk9iamVjdCIsIiRmaWVsZHMiLCJmaWx0ZXIiLCJrIiwicHVzaCIsInJlc29sdmUiLCJ0aGVuIiwiYWxsIiwibWFwIiwicmVhZE1hbnkiLCJyZWFkT25lIiwidmFsQXJyYXkiLCJzZWxmSWR4IiwicmV0VmFsIiwiYXNzaWduIiwiZm9yRWFjaCIsInZhbCIsImlkeCIsInJlc3VsdCIsIm5vdGlmeVVwZGF0ZSIsInJlbGF0aW9uc2hpcCIsImNoaWxkSWQiLCJ2YWxlbmNlIiwicSIsIm9ic2VydmVyIiwic3Vic2NyaWJlIiwiZmllbGQiLCJuZXh0IiwibGlzdCIsImFyZ3MiLCJsZW5ndGgiLCIkaWQiLCJ1bmRlZmluZWQiLCJtYXNzUmVwbGFjZSIsImJsb2NrIiwiY29udGV4dCIsInYiLCJtYXRjaCJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztxakJBQUE7O0FBRUE7O0lBQVlBLFE7O0FBQ1o7O0FBQ0E7Ozs7OztBQUVBLElBQU1DLFdBQVdDLE9BQU8sVUFBUCxDQUFqQjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0lBRWFDLE8sV0FBQUEsTztBQUVYLHFCQUF1QjtBQUFBLFFBQVhDLElBQVcsdUVBQUosRUFBSTs7QUFBQTs7QUFDckI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsU0FBS0MsUUFBTCxHQUFnQkQsS0FBS0MsUUFBTCxJQUFpQixLQUFqQztBQUNBLFNBQUtKLFFBQUwsSUFBaUIsaUJBQWpCO0FBQ0Q7Ozs7d0JBRUdLLEksRUFBTUMsRSxFQUFJO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtB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LEtBQUssQ0FBTCxFQUFRRSxHQUFoQixNQUF5QkMsU0FBN0IsRUFBd0M7QUFDN0MsY0FBTSxJQUFJdEMsS0FBSixDQUFVLDJDQUFWLENBQU47QUFDRDtBQUNGOzs7Ozs7QUFJSDs7O0FBQ0FQLFFBQVE4QyxXQUFSLEdBQXNCLFNBQVNBLFdBQVQsQ0FBcUJDLEtBQXJCLEVBQTRCQyxPQUE1QixFQUFxQztBQUN6RCxTQUFPRCxNQUFNMUIsR0FBTixDQUFVLFVBQUM0QixDQUFELEVBQU87QUFDdEIsUUFBSXZDLE1BQU1DLE9BQU4sQ0FBY3NDLENBQWQsQ0FBSixFQUFzQjtBQUNwQixhQUFPSCxZQUFZRyxDQUFaLEVBQWVELE9BQWYsQ0FBUDtBQUNELEtBRkQsTUFFTyxJQUFLLE9BQU9DLENBQVAsS0FBYSxRQUFkLElBQTRCQSxFQUFFQyxLQUFGLENBQVEsWUFBUixDQUFoQyxFQUF3RDtBQUM3RCxhQUFPRixRQUFRQyxFQUFFQyxLQUFGLENBQVEsWUFBUixFQUFzQixDQUF0QixDQUFSLENBQVA7QUFDRCxLQUZNLE1BRUE7QUFDTCxhQUFPRCxDQUFQO0FBQ0Q7QUFDRixHQVJNLENBQVA7QUFTRCxDQVZEIiwiZmlsZSI6InN0b3JhZ2Uvc3RvcmFnZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludCBuby11bnVzZWQtdmFyczogMCAqL1xuXG5pbXBvcnQgKiBhcyBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBTdWJqZWN0IH0gZnJvbSAncnhqcy9SeCc7XG5pbXBvcnQgeyAkc2VsZiwgJGFsbCB9IGZyb20gJy4uL21vZGVsJztcblxuY29uc3QgJGVtaXR0ZXIgPSBTeW1ib2woJyRlbWl0dGVyJyk7XG5cbi8vIHR5cGU6IGFuIG9iamVjdCB0aGF0IGRlZmluZXMgdGhlIHR5cGUuIHR5cGljYWxseSB0aGlzIHdpbGwgYmVcbi8vIHBhcnQgb2YgdGhlIE1vZGVsIGNsYXNzIGhpZXJhcmNoeSwgYnV0IFN0b3JhZ2Ugb2JqZWN0cyBjYWxsIG5vIG1ldGhvZHNcbi8vIG9uIHRoZSB0eXBlIG9iamVjdC4gV2Ugb25seSBhcmUgaW50ZXJlc3RlZCBpbiBUeXBlLiRuYW1lLCBUeXBlLiRpZCBhbmQgVHlwZS4kZmllbGRzLlxuLy8gTm90ZSB0aGF0IFR5cGUuJGlkIGlzIHRoZSAqbmFtZSBvZiB0aGUgaWQgZmllbGQqIG9uIGluc3RhbmNlc1xuLy8gICAgYW5kIE5PVCB0aGUgYWN0dWFsIGlkIGZpZWxkIChlLmcuLCBpbiBtb3N0IGNhc2VzLCBUeXBlLiRpZCA9PT0gJ2lkJykuXG4vLyBpZDogdW5pcXVlIGlkLiBPZnRlbiBhbiBpbnRlZ2VyLCBidXQgbm90IG5lY2Vzc2FyeSAoY291bGQgYmUgYW4gb2lkKVxuXG5cbi8vIGhhc01hbnkgcmVsYXRpb25zaGlwcyBhcmUgdHJlYXRlZCBsaWtlIGlkIGFycmF5cy4gU28sIGFkZCAvIHJlbW92ZSAvIGhhc1xuLy8ganVzdCBzdG9yZXMgYW5kIHJlbW92ZXMgaW50ZWdlcnMuXG5cbmV4cG9ydCBjbGFzcyBTdG9yYWdlIHtcblxuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICAvLyBhIFwidGVybWluYWxcIiBzdG9yYWdlIGZhY2lsaXR5IGlzIHRoZSBlbmQgb2YgdGhlIHN0b3JhZ2UgY2hhaW4uXG4gICAgLy8gdXN1YWxseSBzcWwgb24gdGhlIHNlcnZlciBzaWRlIGFuZCByZXN0IG9uIHRoZSBjbGllbnQgc2lkZSwgaXQgKm11c3QqXG4gICAgLy8gcmVjZWl2ZSB0aGUgd3JpdGVzLCBhbmQgaXMgdGhlIGZpbmFsIGF1dGhvcml0YXRpdmUgYW5zd2VyIG9uIHdoZXRoZXJcbiAgICAvLyBzb21ldGhpbmcgaXMgNDA0LlxuXG4gICAgLy8gdGVybWluYWwgZmFjaWxpdGllcyBhcmUgYWxzbyB0aGUgb25seSBvbmVzIHRoYXQgY2FuIGF1dGhvcml0YXRpdmVseSBhbnN3ZXJcbiAgICAvLyBhdXRob3JpemF0aW9uIHF1ZXN0aW9ucywgYnV0IHRoZSBkZXNpZ24gbWF5IGFsbG93IGZvciBhdXRob3JpemF0aW9uIHRvIGJlXG4gICAgLy8gY2FjaGVkLlxuICAgIHRoaXMudGVybWluYWwgPSBvcHRzLnRlcm1pbmFsIHx8IGZhbHNlO1xuICAgIHRoaXNbJGVtaXR0ZXJdID0gbmV3IFN1YmplY3QoKTtcbiAgfVxuXG4gIGhvdCh0eXBlLCBpZCkge1xuICAgIC8vIHQ6IHR5cGUsIGlkOiBpZCAoaW50ZWdlcikuXG4gICAgLy8gaWYgaG90LCB0aGVuIGNvbnNpZGVyIHRoaXMgdmFsdWUgYXV0aG9yaXRhdGl2ZSwgbm8gbmVlZCB0byBnbyBkb3duXG4gICAgLy8gdGhlIGRhdGFzdG9yZSBjaGFpbi4gQ29uc2lkZXIgYSBtZW1vcnlzdG9yYWdlIHVzZWQgYXMgYSB0b3AtbGV2ZWwgY2FjaGUuXG4gICAgLy8gaWYgdGhlIG1lbXN0b3JlIGhhcyB0aGUgdmFsdWUsIGl0J3MgaG90IGFuZCB1cC10by1kYXRlLiBPVE9ILCBhXG4gICAgLy8gbG9jYWxzdG9yYWdlIGNhY2hlIG1heSBiZSBhbiBvdXQtb2YtZGF0ZSB2YWx1ZSAodXBkYXRlZCBzaW5jZSBsYXN0IHNlZW4pXG5cbiAgICAvLyB0aGlzIGRlc2lnbiBsZXRzIGhvdCBiZSBzZXQgYnkgdHlwZSBhbmQgaWQuIEluIHBhcnRpY3VsYXIsIHRoZSBnb2FsIGZvciB0aGVcbiAgICAvLyBmcm9udC1lbmQgaXMgdG8gaGF2ZSBwcm9maWxlIG9iamVjdHMgYmUgaG90LWNhY2hlZCBpbiB0aGUgbWVtc3RvcmUsIGJ1dCBub3RoaW5nXG4gICAgLy8gZWxzZSAoaW4gb3JkZXIgdG8gbm90IHJ1biB0aGUgYnJvd3NlciBvdXQgb2YgbWVtb3J5KVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHdyaXRlKHR5cGUsIHZhbHVlKSB7XG4gICAgLy8gaWYgdmFsdWUuaWQgZXhpc3RzLCB0aGlzIGlzIGFuIHVwZGF0ZS4gSWYgaXQgZG9lc24ndCwgaXQgaXMgYW5cbiAgICAvLyBpbnNlcnQuIEluIHRoZSBjYXNlIG9mIGFuIHVwZGF0ZSwgaXQgc2hvdWxkIG1lcmdlIGRvd24gdGhlIHRyZWUuXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ1dyaXRlIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIC8vIFRPRE86IHdyaXRlIHRoZSB0d28td2F5IGhhcy9nZXQgbG9naWMgaW50byB0aGlzIG1ldGhvZFxuICAvLyBhbmQgcHJvdmlkZSBvdmVycmlkZSBob29rcyBmb3IgcmVhZE9uZSByZWFkTWFueVxuXG4gIHJlYWQodHlwZSwgaWQsIGtleSkge1xuICAgIGxldCBrZXlzID0gWyRzZWxmXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShrZXkpKSB7XG4gICAgICBrZXlzID0ga2V5O1xuICAgIH0gZWxzZSBpZiAoa2V5KSB7XG4gICAgICBrZXlzID0gW2tleV07XG4gICAgfVxuICAgIGlmIChrZXlzLmluZGV4T2YoJGFsbCkgPj0gMCkge1xuICAgICAga2V5cyA9IE9iamVjdC5rZXlzKHR5cGUuJGZpZWxkcylcbiAgICAgIC5maWx0ZXIoKGspID0+IHR5cGUuJGZpZWxkc1trXS50eXBlID09PSAnaGFzTWFueScpO1xuICAgICAga2V5cy5wdXNoKCRzZWxmKTtcbiAgICB9XG4gICAgLy8gaWYgKGtleXMuaW5kZXhPZigkc2VsZikgPCAwKSB7XG4gICAgLy8gICBrZXlzLnB1c2goJHNlbGYpO1xuICAgIC8vIH1cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIEJsdWViaXJkLmFsbChrZXlzLm1hcCgoaykgPT4ge1xuICAgICAgICBpZiAoKGsgIT09ICRzZWxmKSAmJiAodHlwZS4kZmllbGRzW2tdLnR5cGUgPT09ICdoYXNNYW55JykpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yZWFkTWFueSh0eXBlLCBpZCwgayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucmVhZE9uZSh0eXBlLCBpZCk7XG4gICAgICAgIH1cbiAgICAgIH0pKS50aGVuKCh2YWxBcnJheSkgPT4ge1xuICAgICAgICBjb25zdCBzZWxmSWR4ID0ga2V5cy5pbmRleE9mKCRzZWxmKTtcbiAgICAgICAgY29uc3QgcmV0VmFsID0ge307XG4gICAgICAgIGlmIChzZWxmSWR4ID49IDApIHtcbiAgICAgICAgICBpZiAodmFsQXJyYXlbc2VsZklkeF0gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKHJldFZhbCwgdmFsQXJyYXlbc2VsZklkeF0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YWxBcnJheS5mb3JFYWNoKCh2YWwsIGlkeCkgPT4ge1xuICAgICAgICAgIGlmIChpZHggIT09IHNlbGZJZHgpIHtcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24ocmV0VmFsLCB2YWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXRWYWw7XG4gICAgICB9KTtcbiAgICB9KS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm90aWZ5VXBkYXRlKHR5cGUsIGlkLCByZXN1bHQsIGtleXMpXG4gICAgICAgIC50aGVuKCgpID0+IHJlc3VsdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcmVhZE9uZSh0eXBlLCBpZCkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdSZWFkT25lIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIHJlYWRNYW55KHR5cGUsIGlkLCBrZXkpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignUmVhZE1hbnkgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgZGVsZXRlKHR5cGUsIGlkKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0RlbGV0ZSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBhZGQodHlwZSwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCwgdmFsZW5jZSA9IHt9KSB7XG4gICAgLy8gYWRkIHRvIGEgaGFzTWFueSByZWxhdGlvbnNoaXBcbiAgICAvLyBub3RlIHRoYXQgaGFzTWFueSBmaWVsZHMgY2FuIGhhdmUgKGltcGwtc3BlY2lmaWMpIHZhbGVuY2UgZGF0YVxuICAgIC8vIGV4YW1wbGU6IG1lbWJlcnNoaXAgYmV0d2VlbiBwcm9maWxlIGFuZCBjb21tdW5pdHkgY2FuIGhhdmUgcGVybSAxLCAyLCAzXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ0FkZCBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICByZW1vdmUodHlwZSwgaWQsIHJlbGF0aW9uc2hpcCwgY2hpbGRJZCkge1xuICAgIC8vIHJlbW92ZSBmcm9tIGEgaGFzTWFueSByZWxhdGlvbnNoaXBcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcigncmVtb3ZlIG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIG1vZGlmeVJlbGF0aW9uc2hpcCh0eXBlLCBpZCwgcmVsYXRpb25zaGlwLCBjaGlsZElkLCB2YWxlbmNlID0ge30pIHtcbiAgICAvLyBzaG91bGQgbW9kaWZ5IGFuIGV4aXN0aW5nIGhhc01hbnkgdmFsZW5jZSBkYXRhLiBUaHJvdyBpZiBub3QgZXhpc3RpbmcuXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ21vZGlmeVJlbGF0aW9uc2hpcCBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICBxdWVyeShxKSB7XG4gICAgLy8gcToge3R5cGU6IHN0cmluZywgcXVlcnk6IGFueX1cbiAgICAvLyBxLnF1ZXJ5IGlzIGltcGwgZGVmaW5lZCAtIGEgc3RyaW5nIGZvciBzcWwgKHJhdyBzcWwpXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ1F1ZXJ5IG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIG9uVXBkYXRlKG9ic2VydmVyKSB7XG4gICAgLy8gb2JzZXJ2ZXIgZm9sbG93cyB0aGUgUnhKUyBwYXR0ZXJuIC0gaXQgaXMgZWl0aGVyIGEgZnVuY3Rpb24gKGZvciBuZXh0KCkpXG4gICAgLy8gb3Ige25leHQsIGVycm9yLCBjb21wbGV0ZX07XG4gICAgLy8gcmV0dXJucyBhbiB1bnN1YiBob29rIChyZXRWYWwudW5zdWJzY3JpYmUoKSlcbiAgICByZXR1cm4gdGhpc1skZW1pdHRlcl0uc3Vic2NyaWJlKG9ic2VydmVyKTtcbiAgfVxuXG4gIG5vdGlmeVVwZGF0ZSh0eXBlLCBpZCwgdmFsdWUsIG9wdHMgPSBbJHNlbGZdKSB7XG4gICAgbGV0IGtleXMgPSBvcHRzO1xuICAgIGlmICghQXJyYXkuaXNBcnJheShrZXlzKSkge1xuICAgICAga2V5cyA9IFtrZXlzXTtcbiAgICB9XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChrZXlzLm1hcCgoZmllbGQpID0+IHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgICBpZiAoZmllbGQgIT09ICRzZWxmKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbJGVtaXR0ZXJdLm5leHQoe1xuICAgICAgICAgICAgICAgIHR5cGUsIGlkLCBmaWVsZCwgdmFsdWU6IHZhbHVlW2ZpZWxkXSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWFkTWFueSh0eXBlLCBpZCwgZmllbGQpXG4gICAgICAgICAgICAgIC50aGVuKChsaXN0KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbJGVtaXR0ZXJdLm5leHQoe1xuICAgICAgICAgICAgICAgICAgdHlwZSwgaWQsIGZpZWxkLCB2YWx1ZTogbGlzdFtmaWVsZF0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1skZW1pdHRlcl0ubmV4dCh7XG4gICAgICAgICAgICAgIHR5cGUsIGlkLCB2YWx1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSkpO1xuICB9XG5cbiAgJCR0ZXN0SW5kZXgoLi4uYXJncykge1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgaWYgKGFyZ3NbMF0uJGlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbGxlZ2FsIG9wZXJhdGlvbiBvbiBhbiB1bnNhdmVkIG5ldyBtb2RlbCcpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYXJnc1sxXVthcmdzWzBdLiRpZF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbGxlZ2FsIG9wZXJhdGlvbiBvbiBhbiB1bnNhdmVkIG5ldyBtb2RlbCcpO1xuICAgIH1cbiAgfVxufVxuXG5cbi8vIGNvbnZlbmllbmNlIGZ1bmN0aW9uIHRoYXQgd2Fsa3MgYW4gYXJyYXkgcmVwbGFjaW5nIGFueSB7aWR9IHdpdGggY29udGV4dC5pZFxuU3RvcmFnZS5tYXNzUmVwbGFjZSA9IGZ1bmN0aW9uIG1hc3NSZXBsYWNlKGJsb2NrLCBjb250ZXh0KSB7XG4gIHJldHVybiBibG9jay5tYXAoKHYpID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2KSkge1xuICAgICAgcmV0dXJuIG1hc3NSZXBsYWNlKHYsIGNvbnRleHQpO1xuICAgIH0gZWxzZSBpZiAoKHR5cGVvZiB2ID09PSAnc3RyaW5nJykgJiYgKHYubWF0Y2goL15cXHsoLiopXFx9JC8pKSkge1xuICAgICAgcmV0dXJuIGNvbnRleHRbdi5tYXRjaCgvXlxceyguKilcXH0kLylbMV1dO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdjtcbiAgICB9XG4gIH0pO1xufTtcbiJdfQ==
