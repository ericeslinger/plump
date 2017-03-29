/* eslint no-unused-vars: 0 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Bluebird = require("bluebird");
var mergeOptions = require("merge-options");
var util_1 = require("../util");
var Rx_1 = require("rxjs/Rx");
// type: an object that defines the type. typically this will be
// part of the Model class hierarchy, but Storage objects call no methods
// on the type object. We only are interested in Type.$name, Type.$id and Type.$schema.
// Note that Type.$id is the *name of the id field* on instances
//    and NOT the actual id field (e.g., in most cases, Type.$id === 'id').
// id: unique id. Often an integer, but not necessary (could be an oid)
// hasMany relationships are treated like id arrays. So, add / remove / has
// just stores and removes integers.
var Storage = (function () {
    // protected types: Model[]; TODO: figure this out
    function Storage(opts) {
        // a "terminal" storage facility is the end of the storage chain.
        // usually sql on the server side and rest on the client side, it *must*
        // receive the writes, and is the final authoritative answer on whether
        // something is 404.
        if (opts === void 0) { opts = {}; }
        this.types = {};
        this.readSubject = new Rx_1.Subject();
        this.writeSubject = new Rx_1.Subject();
        // terminal facilities are also the only ones that can authoritatively answer
        // authorization questions, but the design may allow for authorization to be
        // cached.
        this.terminal = opts.terminal || false;
        this.read$ = this.readSubject.asObservable();
        this.write$ = this.writeSubject.asObservable();
    }
    Storage.prototype.query = function (q) {
        // q: {type: string, query: any}
        // q.query is impl defined - a string for sql (raw sql)
        return Bluebird.reject(new Error('Query not implemented'));
    };
    // convenience function used internally
    // read a bunch of relationships and merge them together.
    Storage.prototype.readRelationships = function (item, relationships) {
        var _this = this;
        return Bluebird.all(relationships.map(function (r) { return _this.readRelationship(item, r); }))
            .then(function (rA) {
            return rA.reduce(function (a, r) { return mergeOptions(a, r || {}); }, { typeName: item.typeName, id: item.id, attributes: {}, relationships: {} });
        });
    };
    Storage.prototype.read = function (item, opts) {
        var _this = this;
        if (opts === void 0) { opts = ['attributes']; }
        var schema = this.getSchema(item.typeName);
        var keys = (opts && !Array.isArray(opts) ? [opts] : opts);
        return this.readAttributes(item)
            .then(function (attributes) {
            if (!attributes) {
                return null;
            }
            else {
                if (attributes.id && attributes.attributes && !attributes.attributes[schema.idAttribute]) {
                    attributes.attributes[schema.idAttribute] = attributes.id; // eslint-disable-line no-param-reassign
                }
                var relsWanted = (keys.indexOf('relationships') >= 0)
                    ? Object.keys(schema.relationships)
                    : keys.map(function (k) { return k.split('.'); })
                        .filter(function (ka) { return ka[0] === 'relationships'; })
                        .map(function (ka) { return ka[1]; });
                var relsToFetch = relsWanted.filter(function (relName) { return !attributes.relationships[relName]; });
                // readAttributes can return relationship data, so don't fetch those
                if (relsToFetch.length > 0) {
                    return _this.readRelationships(item, relsToFetch)
                        .then(function (rels) {
                        return mergeOptions(attributes, rels);
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
        // override this if you want to do any special pre-processing
        // for reading from the store prior to a REST service event
        return this.read(item).then(function (data) {
            return { data: data, included: [] };
        });
    };
    Storage.prototype.hot = function (item) {
        // t: type, id: id (integer).
        // if hot, then consider this value authoritative, no need to go down
        // the datastore chain. Consider a memorystorage used as a top-level cache.
        // if the memstore has the value, it's hot and up-to-date. OTOH, a
        // localstorage cache may be an out-of-date value (updated since last seen)
        // this design lets hot be set by type and id. In particular, the goal for the
        // front-end is to have profile objects be hot-cached in the memstore, but nothing
        // else (in order to not run the browser out of memory)
        return false;
    };
    // hook a non-terminal store into a terminal store.
    Storage.prototype.wire = function (store, shutdownSignal) {
        var _this = this;
        if (this.terminal) {
            throw new Error('Cannot wire a terminal store into another store');
        }
        else {
            // TODO: figure out where the type data comes from.
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
        var type = this.getSchema(value.typeName);
        return util_1.validateInput(type, value);
    };
    // store type info data on the store itself
    Storage.prototype.getSchema = function (t) {
        if (typeof t === 'string') {
            return this.types[t];
        }
        else if (t['schema']) {
            return t.schema;
        }
        else {
            return t;
        }
    };
    Storage.prototype.addSchema = function (t) {
        this.types[t.typeName] = t.schema;
        return Bluebird.resolve();
    };
    Storage.prototype.addSchemas = function (a) {
        var _this = this;
        return Bluebird.all(a.map(function (t) { return _this.addSchema(t); })).then(function () { });
    };
    Storage.prototype.fireWriteUpdate = function (val) {
        this.writeSubject.next(val);
        return Bluebird.resolve(val);
    };
    Storage.prototype.fireReadUpdate = function (val) {
        this.readSubject.next(val);
        return Bluebird.resolve(val);
    };
    return Storage;
}());
exports.Storage = Storage;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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LEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNsQyxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFFRCw0QkFBVSxHQUFWLFVBQVcsQ0FBQztRQUFaLGlCQUlDO1FBSEMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQ2pCLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxLQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFqQixDQUFpQixDQUFDLENBQzlCLENBQUMsSUFBSSxDQUFDLGNBQWlCLENBQUMsQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFHRCxpQ0FBZSxHQUFmLFVBQWdCLEdBQWU7UUFDN0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVELGdDQUFjLEdBQWQsVUFBZSxHQUFjO1FBQzNCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzNCLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFDSCxjQUFDO0FBQUQsQ0FqTEEsQUFpTEMsSUFBQTtBQWpMcUIsMEJBQU8iLCJmaWxlIjoic3RvcmFnZS9zdG9yYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50IG5vLXVudXNlZC12YXJzOiAwICovXG5cbmltcG9ydCAqIGFzIEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCAqIGFzIG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcbmltcG9ydCB7IHZhbGlkYXRlSW5wdXQgfSBmcm9tICcuLi91dGlsJztcbmltcG9ydCB7IFN1YmplY3QsIE9ic2VydmFibGUgfSBmcm9tICdyeGpzL1J4JztcbmltcG9ydCB7XG4gIEluZGVmaW5pdGVNb2RlbERhdGEsXG4gIE1vZGVsRGF0YSxcbiAgTW9kZWxEZWx0YSxcbiAgTW9kZWxTY2hlbWEsXG4gIE1vZGVsUmVmZXJlbmNlLFxuICAvLyBSZWxhdGlvbnNoaXBJdGVtLFxufSBmcm9tICcuLi9kYXRhVHlwZXMnO1xuXG4vLyB0eXBlOiBhbiBvYmplY3QgdGhhdCBkZWZpbmVzIHRoZSB0eXBlLiB0eXBpY2FsbHkgdGhpcyB3aWxsIGJlXG4vLyBwYXJ0IG9mIHRoZSBNb2RlbCBjbGFzcyBoaWVyYXJjaHksIGJ1dCBTdG9yYWdlIG9iamVjdHMgY2FsbCBubyBtZXRob2RzXG4vLyBvbiB0aGUgdHlwZSBvYmplY3QuIFdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gVHlwZS4kbmFtZSwgVHlwZS4kaWQgYW5kIFR5cGUuJHNjaGVtYS5cbi8vIE5vdGUgdGhhdCBUeXBlLiRpZCBpcyB0aGUgKm5hbWUgb2YgdGhlIGlkIGZpZWxkKiBvbiBpbnN0YW5jZXNcbi8vICAgIGFuZCBOT1QgdGhlIGFjdHVhbCBpZCBmaWVsZCAoZS5nLiwgaW4gbW9zdCBjYXNlcywgVHlwZS4kaWQgPT09ICdpZCcpLlxuLy8gaWQ6IHVuaXF1ZSBpZC4gT2Z0ZW4gYW4gaW50ZWdlciwgYnV0IG5vdCBuZWNlc3NhcnkgKGNvdWxkIGJlIGFuIG9pZClcblxuXG4vLyBoYXNNYW55IHJlbGF0aW9uc2hpcHMgYXJlIHRyZWF0ZWQgbGlrZSBpZCBhcnJheXMuIFNvLCBhZGQgLyByZW1vdmUgLyBoYXNcbi8vIGp1c3Qgc3RvcmVzIGFuZCByZW1vdmVzIGludGVnZXJzLlxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU3RvcmFnZSB7XG5cbiAgdGVybWluYWw6IGJvb2xlYW47XG4gIHJlYWQkOiBPYnNlcnZhYmxlPE1vZGVsRGF0YT47XG4gIHdyaXRlJDogT2JzZXJ2YWJsZTxNb2RlbERlbHRhPjtcbiAgcHJvdGVjdGVkIHR5cGVzOiB7IFt0eXBlOiBzdHJpbmddOiBNb2RlbFNjaGVtYX0gPSB7fTtcbiAgcHJpdmF0ZSByZWFkU3ViamVjdCA9IG5ldyBTdWJqZWN0KCk7XG4gIHByaXZhdGUgd3JpdGVTdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgLy8gcHJvdGVjdGVkIHR5cGVzOiBNb2RlbFtdOyBUT0RPOiBmaWd1cmUgdGhpcyBvdXRcblxuICBjb25zdHJ1Y3RvcihvcHRzOiBhbnkgPSB7fSkge1xuICAgIC8vIGEgXCJ0ZXJtaW5hbFwiIHN0b3JhZ2UgZmFjaWxpdHkgaXMgdGhlIGVuZCBvZiB0aGUgc3RvcmFnZSBjaGFpbi5cbiAgICAvLyB1c3VhbGx5IHNxbCBvbiB0aGUgc2VydmVyIHNpZGUgYW5kIHJlc3Qgb24gdGhlIGNsaWVudCBzaWRlLCBpdCAqbXVzdCpcbiAgICAvLyByZWNlaXZlIHRoZSB3cml0ZXMsIGFuZCBpcyB0aGUgZmluYWwgYXV0aG9yaXRhdGl2ZSBhbnN3ZXIgb24gd2hldGhlclxuICAgIC8vIHNvbWV0aGluZyBpcyA0MDQuXG5cbiAgICAvLyB0ZXJtaW5hbCBmYWNpbGl0aWVzIGFyZSBhbHNvIHRoZSBvbmx5IG9uZXMgdGhhdCBjYW4gYXV0aG9yaXRhdGl2ZWx5IGFuc3dlclxuICAgIC8vIGF1dGhvcml6YXRpb24gcXVlc3Rpb25zLCBidXQgdGhlIGRlc2lnbiBtYXkgYWxsb3cgZm9yIGF1dGhvcml6YXRpb24gdG8gYmVcbiAgICAvLyBjYWNoZWQuXG4gICAgdGhpcy50ZXJtaW5hbCA9IG9wdHMudGVybWluYWwgfHwgZmFsc2U7XG4gICAgdGhpcy5yZWFkJCA9IHRoaXMucmVhZFN1YmplY3QuYXNPYnNlcnZhYmxlKCk7XG4gICAgdGhpcy53cml0ZSQgPSB0aGlzLndyaXRlU3ViamVjdC5hc09ic2VydmFibGUoKTtcbiAgfVxuXG4gIC8vIEFic3RyYWN0IC0gYWxsIHN0b3JlcyBtdXN0IHByb3ZpZGUgYmVsb3c6XG5cbiAgYWJzdHJhY3QgYWxsb2NhdGVJZCh0eXBlTmFtZTogc3RyaW5nKTogQmx1ZWJpcmQ8c3RyaW5nIHwgbnVtYmVyPjtcbiAgYWJzdHJhY3Qgd3JpdGVBdHRyaWJ1dGVzKHZhbHVlOiBJbmRlZmluaXRlTW9kZWxEYXRhKTogQmx1ZWJpcmQ8TW9kZWxEYXRhPjtcbiAgYWJzdHJhY3QgcmVhZEF0dHJpYnV0ZXModmFsdWU6IE1vZGVsUmVmZXJlbmNlKTogQmx1ZWJpcmQ8TW9kZWxEYXRhPjtcbiAgYWJzdHJhY3QgY2FjaGUodmFsdWU6IE1vZGVsRGF0YSk6IEJsdWViaXJkPE1vZGVsRGF0YT47XG4gIGFic3RyYWN0IGNhY2hlQXR0cmlidXRlcyh2YWx1ZTogTW9kZWxEYXRhKTogQmx1ZWJpcmQ8TW9kZWxEYXRhPjtcbiAgYWJzdHJhY3QgY2FjaGVSZWxhdGlvbnNoaXAodmFsdWU6IE1vZGVsRGF0YSk6IEJsdWViaXJkPE1vZGVsRGF0YT47XG4gIGFic3RyYWN0IHJlYWRSZWxhdGlvbnNoaXAodmFsdWU6IE1vZGVsUmVmZXJlbmNlLCByZWxOYW1lOiBzdHJpbmcpOiBCbHVlYmlyZDxNb2RlbERhdGE+O1xuICBhYnN0cmFjdCB3aXBlKHZhbHVlOiBNb2RlbFJlZmVyZW5jZSwga2V5Pzogc3RyaW5nIHwgc3RyaW5nW10pOiB2b2lkO1xuICBhYnN0cmFjdCBkZWxldGUodmFsdWU6IE1vZGVsUmVmZXJlbmNlKTogQmx1ZWJpcmQ8dm9pZD47XG4gIGFic3RyYWN0IHdyaXRlUmVsYXRpb25zaGlwSXRlbShcbiAgICB2YWx1ZTogTW9kZWxSZWZlcmVuY2UsXG4gICAgcmVsYXRpb25zaGlwVGl0bGU6IHN0cmluZyxcbiAgICBjaGlsZDoge2lkOiBzdHJpbmcgfCBudW1iZXJ9XG4gICk6IEJsdWViaXJkPE1vZGVsRGF0YT47XG4gIGFic3RyYWN0IGRlbGV0ZVJlbGF0aW9uc2hpcEl0ZW0oXG4gICAgdmFsdWU6IE1vZGVsUmVmZXJlbmNlLFxuICAgIHJlbGF0aW9uc2hpcFRpdGxlOiBzdHJpbmcsXG4gICAgY2hpbGQ6IHtpZDogc3RyaW5nIHwgbnVtYmVyfVxuICApOiBCbHVlYmlyZDxNb2RlbERhdGE+O1xuXG5cbiAgcXVlcnkocTogYW55KTogQmx1ZWJpcmQ8TW9kZWxSZWZlcmVuY2VbXT4ge1xuICAgIC8vIHE6IHt0eXBlOiBzdHJpbmcsIHF1ZXJ5OiBhbnl9XG4gICAgLy8gcS5xdWVyeSBpcyBpbXBsIGRlZmluZWQgLSBhIHN0cmluZyBmb3Igc3FsIChyYXcgc3FsKVxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdRdWVyeSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICAvLyBjb252ZW5pZW5jZSBmdW5jdGlvbiB1c2VkIGludGVybmFsbHlcbiAgLy8gcmVhZCBhIGJ1bmNoIG9mIHJlbGF0aW9uc2hpcHMgYW5kIG1lcmdlIHRoZW0gdG9nZXRoZXIuXG4gIHJlYWRSZWxhdGlvbnNoaXBzKGl0ZW06IE1vZGVsUmVmZXJlbmNlLCByZWxhdGlvbnNoaXBzOiBzdHJpbmdbXSkge1xuICAgIHJldHVybiBCbHVlYmlyZC5hbGwocmVsYXRpb25zaGlwcy5tYXAociA9PiB0aGlzLnJlYWRSZWxhdGlvbnNoaXAoaXRlbSwgcikpKVxuICAgIC50aGVuKHJBID0+XG4gICAgICByQS5yZWR1Y2UoXG4gICAgICAgIChhLCByKSA9PiBtZXJnZU9wdGlvbnMoYSwgciB8fCB7fSksXG4gICAgICAgIHsgdHlwZU5hbWU6IGl0ZW0udHlwZU5hbWUsIGlkOiBpdGVtLmlkLCBhdHRyaWJ1dGVzOiB7fSwgcmVsYXRpb25zaGlwczoge30gfVxuICAgICAgKVxuICAgICk7XG4gIH1cblxuICByZWFkKGl0ZW06IE1vZGVsUmVmZXJlbmNlLCBvcHRzOiBzdHJpbmcgfCBzdHJpbmdbXSA9IFsnYXR0cmlidXRlcyddKSB7XG4gICAgY29uc3Qgc2NoZW1hID0gdGhpcy5nZXRTY2hlbWEoaXRlbS50eXBlTmFtZSk7XG4gICAgY29uc3Qga2V5cyA9IChvcHRzICYmICFBcnJheS5pc0FycmF5KG9wdHMpID8gW29wdHNdIDogb3B0cykgYXMgc3RyaW5nW107XG4gICAgcmV0dXJuIHRoaXMucmVhZEF0dHJpYnV0ZXMoaXRlbSlcbiAgICAudGhlbihhdHRyaWJ1dGVzID0+IHtcbiAgICAgIGlmICghYXR0cmlidXRlcykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChhdHRyaWJ1dGVzLmlkICYmIGF0dHJpYnV0ZXMuYXR0cmlidXRlcyAmJiAhYXR0cmlidXRlcy5hdHRyaWJ1dGVzW3NjaGVtYS5pZEF0dHJpYnV0ZV0pIHtcbiAgICAgICAgICBhdHRyaWJ1dGVzLmF0dHJpYnV0ZXNbc2NoZW1hLmlkQXR0cmlidXRlXSA9IGF0dHJpYnV0ZXMuaWQ7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZWxzV2FudGVkID0gKGtleXMuaW5kZXhPZigncmVsYXRpb25zaGlwcycpID49IDApXG4gICAgICAgICAgPyBPYmplY3Qua2V5cyhzY2hlbWEucmVsYXRpb25zaGlwcylcbiAgICAgICAgICA6IGtleXMubWFwKGsgPT4gay5zcGxpdCgnLicpKVxuICAgICAgICAgICAgLmZpbHRlcihrYSA9PiBrYVswXSA9PT0gJ3JlbGF0aW9uc2hpcHMnKVxuICAgICAgICAgICAgLm1hcChrYSA9PiBrYVsxXSk7XG4gICAgICAgIGNvbnN0IHJlbHNUb0ZldGNoID0gcmVsc1dhbnRlZC5maWx0ZXIocmVsTmFtZSA9PiAhYXR0cmlidXRlcy5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdKTtcbiAgICAgICAgLy8gcmVhZEF0dHJpYnV0ZXMgY2FuIHJldHVybiByZWxhdGlvbnNoaXAgZGF0YSwgc28gZG9uJ3QgZmV0Y2ggdGhvc2VcbiAgICAgICAgaWYgKHJlbHNUb0ZldGNoLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yZWFkUmVsYXRpb25zaGlwcyhpdGVtLCByZWxzVG9GZXRjaClcbiAgICAgICAgICAudGhlbihyZWxzID0+IHtcbiAgICAgICAgICAgIHJldHVybiBtZXJnZU9wdGlvbnMoYXR0cmlidXRlcywgcmVscyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgdGhpcy5maXJlUmVhZFVwZGF0ZShyZXN1bHQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcbiAgfVxuXG4gIGJ1bGtSZWFkKGl0ZW06IE1vZGVsUmVmZXJlbmNlKSB7XG4gICAgLy8gb3ZlcnJpZGUgdGhpcyBpZiB5b3Ugd2FudCB0byBkbyBhbnkgc3BlY2lhbCBwcmUtcHJvY2Vzc2luZ1xuICAgIC8vIGZvciByZWFkaW5nIGZyb20gdGhlIHN0b3JlIHByaW9yIHRvIGEgUkVTVCBzZXJ2aWNlIGV2ZW50XG4gICAgcmV0dXJuIHRoaXMucmVhZChpdGVtKS50aGVuKGRhdGEgPT4ge1xuICAgICAgcmV0dXJuIHsgZGF0YSwgaW5jbHVkZWQ6IFtdIH07XG4gICAgfSk7XG4gIH1cblxuXG4gIGhvdChpdGVtOiBNb2RlbFJlZmVyZW5jZSk6IGJvb2xlYW4ge1xuICAgIC8vIHQ6IHR5cGUsIGlkOiBpZCAoaW50ZWdlcikuXG4gICAgLy8gaWYgaG90LCB0aGVuIGNvbnNpZGVyIHRoaXMgdmFsdWUgYXV0aG9yaXRhdGl2ZSwgbm8gbmVlZCB0byBnbyBkb3duXG4gICAgLy8gdGhlIGRhdGFzdG9yZSBjaGFpbi4gQ29uc2lkZXIgYSBtZW1vcnlzdG9yYWdlIHVzZWQgYXMgYSB0b3AtbGV2ZWwgY2FjaGUuXG4gICAgLy8gaWYgdGhlIG1lbXN0b3JlIGhhcyB0aGUgdmFsdWUsIGl0J3MgaG90IGFuZCB1cC10by1kYXRlLiBPVE9ILCBhXG4gICAgLy8gbG9jYWxzdG9yYWdlIGNhY2hlIG1heSBiZSBhbiBvdXQtb2YtZGF0ZSB2YWx1ZSAodXBkYXRlZCBzaW5jZSBsYXN0IHNlZW4pXG5cbiAgICAvLyB0aGlzIGRlc2lnbiBsZXRzIGhvdCBiZSBzZXQgYnkgdHlwZSBhbmQgaWQuIEluIHBhcnRpY3VsYXIsIHRoZSBnb2FsIGZvciB0aGVcbiAgICAvLyBmcm9udC1lbmQgaXMgdG8gaGF2ZSBwcm9maWxlIG9iamVjdHMgYmUgaG90LWNhY2hlZCBpbiB0aGUgbWVtc3RvcmUsIGJ1dCBub3RoaW5nXG4gICAgLy8gZWxzZSAoaW4gb3JkZXIgdG8gbm90IHJ1biB0aGUgYnJvd3NlciBvdXQgb2YgbWVtb3J5KVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIGhvb2sgYSBub24tdGVybWluYWwgc3RvcmUgaW50byBhIHRlcm1pbmFsIHN0b3JlLlxuICB3aXJlKHN0b3JlLCBzaHV0ZG93blNpZ25hbCkge1xuICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCB3aXJlIGEgdGVybWluYWwgc3RvcmUgaW50byBhbm90aGVyIHN0b3JlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRPRE86IGZpZ3VyZSBvdXQgd2hlcmUgdGhlIHR5cGUgZGF0YSBjb21lcyBmcm9tLlxuICAgICAgc3RvcmUucmVhZCQudGFrZVVudGlsKHNodXRkb3duU2lnbmFsKS5zdWJzY3JpYmUoKHYpID0+IHtcbiAgICAgICAgdGhpcy5jYWNoZSh2KTtcbiAgICAgIH0pO1xuICAgICAgc3RvcmUud3JpdGUkLnRha2VVbnRpbChzaHV0ZG93blNpZ25hbCkuc3Vic2NyaWJlKCh2KSA9PiB7XG4gICAgICAgIHYuaW52YWxpZGF0ZS5mb3JFYWNoKChpbnZhbGlkKSA9PiB7XG4gICAgICAgICAgdGhpcy53aXBlKHYsIGludmFsaWQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHZhbGlkYXRlSW5wdXQodmFsdWU6IEluZGVmaW5pdGVNb2RlbERhdGEsIG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IHR5cGUgPSB0aGlzLmdldFNjaGVtYSh2YWx1ZS50eXBlTmFtZSk7XG4gICAgcmV0dXJuIHZhbGlkYXRlSW5wdXQodHlwZSwgdmFsdWUpO1xuICB9XG5cbiAgLy8gc3RvcmUgdHlwZSBpbmZvIGRhdGEgb24gdGhlIHN0b3JlIGl0c2VsZlxuXG4gIGdldFNjaGVtYSh0OiB7c2NoZW1hOiBNb2RlbFNjaGVtYX0gfCBNb2RlbFNjaGVtYSB8IHN0cmluZyk6IE1vZGVsU2NoZW1hIHtcbiAgICBpZiAodHlwZW9mIHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gdGhpcy50eXBlc1t0XTtcbiAgICB9IGVsc2UgaWYgKHRbJ3NjaGVtYSddKSB7XG4gICAgICByZXR1cm4gKHQgYXMge3NjaGVtYTogTW9kZWxTY2hlbWF9KS5zY2hlbWE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0IGFzIE1vZGVsU2NoZW1hO1xuICAgIH1cbiAgfVxuXG4gIGFkZFNjaGVtYSh0OiB7dHlwZU5hbWU6IHN0cmluZywgc2NoZW1hOiBNb2RlbFNjaGVtYX0pIHtcbiAgICB0aGlzLnR5cGVzW3QudHlwZU5hbWVdID0gdC5zY2hlbWE7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKTtcbiAgfVxuXG4gIGFkZFNjaGVtYXMoYSk6IEJsdWViaXJkPHZvaWQ+IHtcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFxuICAgICAgYS5tYXAodCA9PiB0aGlzLmFkZFNjaGVtYSh0KSlcbiAgICApLnRoZW4oKCkgPT4gey8qIG5vb3AgKi99KTtcbiAgfVxuXG5cbiAgZmlyZVdyaXRlVXBkYXRlKHZhbDogTW9kZWxEZWx0YSkge1xuICAgIHRoaXMud3JpdGVTdWJqZWN0Lm5leHQodmFsKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh2YWwpO1xuICB9XG5cbiAgZmlyZVJlYWRVcGRhdGUodmFsOiBNb2RlbERhdGEpIHtcbiAgICB0aGlzLnJlYWRTdWJqZWN0Lm5leHQodmFsKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh2YWwpO1xuICB9XG59XG4iXX0=
