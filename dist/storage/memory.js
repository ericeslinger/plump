"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Promise = require('bluebird');

var MemoryStorage = function () {
    function MemoryStorage() {
        _classCallCheck(this, MemoryStorage);

        this._storage = {};
    }

    _createClass(MemoryStorage, [{
        key: 'create',
        value: function create(t, v) {
            if (this._storage[t][v.id] === undefined) {
                this._storage[t][v.id] = v;
                return Promise.resolve(v);
            } else {
                return Promise.reject(new Error('Cannot overwrite existing value in memstore'));
            }
        }
    }, {
        key: 'read',
        value: function read(t, id) {
            if (this._storage[t] === undefined) {
                return Promise.reject(new Error('cannot find storage for type ' + t));
            } else {
                return Promise.resolve(this._storage[t][id] || null);
            }
        }
    }, {
        key: 'update',
        value: function update(t, id, v) {
            if (this._storage[t] === undefined) {
                return Promise.reject(new Error('cannot find storage for type ' + t));
            } else {
                this._storage[t][id] = v;
                return Promise.resolve(this._storage[t][id]);
            }
        }
    }, {
        key: 'delete',
        value: function _delete(t, id) {
            if (this._storage[t] === undefined) {
                return Promise.reject(new Error('cannot find storage for type ' + t));
            } else {
                var retVal = this._storage[t][id];
                delete this._storage[t][id];
                return Promise.resolve(retVal);
            }
        }
    }, {
        key: 'query',
        value: function query(q) {
            return Promise.reject('Query interface not supported on MemoryStorage');
        }
    }]);

    return MemoryStorage;
}();

exports.MemoryStorage = MemoryStorage;