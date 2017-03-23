"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Bluebird = require("bluebird");
var merge_options_1 = require("merge-options");
var util_1 = require("../util");
var Rx_1 = require("rxjs/Rx");
var $readSubject = Symbol('$readSubject');
var $writeSubject = Symbol('$writeSubject');
var $types = Symbol('$types');
var Storage = (function () {
    function Storage(opts) {
        if (opts === void 0) { opts = {}; }
        this.terminal = opts.terminal || false;
        this[$readSubject] = new Rx_1.Subject();
        this[$writeSubject] = new Rx_1.Subject();
        this.read$ = this[$readSubject].asObservable();
        this.write$ = this[$writeSubject].asObservable();
        this[$types] = {};
    }
    Storage.prototype.query = function (q) {
        return Bluebird.reject(new Error('Query not implemented'));
    };
    Storage.prototype.readRelationships = function (item, relationships) {
        var _this = this;
        return Bluebird.all(relationships.map(function (r) { return _this.readRelationship(item, r); }))
            .then(function (rA) {
            return rA.reduce(function (a, r) { return merge_options_1.default(a, r || {}); }, { type: item.type, id: item.id, attributes: {}, relationships: {} });
        });
    };
    Storage.prototype.read = function (item, opts) {
        var _this = this;
        if (opts === void 0) { opts = ['attributes']; }
        var type = this.getType(item.type);
        var keys = (opts && !Array.isArray(opts) ? [opts] : opts);
        return this.readAttributes(item)
            .then(function (attributes) {
            if (!attributes) {
                return null;
            }
            else {
                if (attributes.id && attributes.attributes && !attributes.attributes[type.$id]) {
                    attributes.attributes[type.$id] = attributes.id;
                }
                var relsWanted = (keys.indexOf('relationships') >= 0)
                    ? Object.keys(type.$schema.relationships)
                    : keys.map(function (k) { return k.split('.'); })
                        .filter(function (ka) { return ka[0] === 'relationships'; })
                        .map(function (ka) { return ka[1]; });
                var relsToFetch = relsWanted.filter(function (relName) { return !attributes.relationships[relName]; });
                if (relsToFetch.length > 0) {
                    return _this.readRelationships(item, relsToFetch)
                        .then(function (rels) {
                        return merge_options_1.default(attributes, rels);
                    });
                }
                else {
                    return attributes;
                }
            }
        }).then(function (result) {
            if (result) {
                _this.fireReadUpdate(result);
            }
            return result;
        });
    };
    Storage.prototype.bulkRead = function (item) {
        return this.read(item).then(function (data) {
            return { data: data, included: [] };
        });
    };
    Storage.prototype.hot = function (item) {
        return false;
    };
    Storage.prototype.wire = function (store, shutdownSignal) {
        var _this = this;
        if (this.terminal) {
            throw new Error('Cannot wire a terminal store into another store');
        }
        else {
            store.read$.takeUntil(shutdownSignal).subscribe(function (v) {
                _this.cache(v);
            });
            store.write$.takeUntil(shutdownSignal).subscribe(function (v) {
                v.invalidate.forEach(function (invalid) {
                    _this.wipe(v, invalid);
                });
            });
        }
    };
    Storage.prototype.validateInput = function (value, opts) {
        if (opts === void 0) { opts = {}; }
        var type = this.getType(value.type);
        return util_1.validateInput(type, value);
    };
    Storage.prototype.getType = function (t) {
        if (typeof t === 'string') {
            return this[$types][t];
        }
        else {
            return t;
        }
    };
    Storage.prototype.addType = function (t) {
        this[$types][t.type] = t;
    };
    Storage.prototype.addTypes = function (a) {
        var _this = this;
        a.forEach(function (t) { return _this.addType(t); });
    };
    Storage.prototype.fireWriteUpdate = function (val) {
        this[$writeSubject].next(val);
        return Bluebird.resolve(val);
    };
    Storage.prototype.fireReadUpdate = function (val) {
        this[$readSubject].next(val);
        return Bluebird.resolve(val);
    };
    return Storage;
}());
exports.Storage = Storage;
