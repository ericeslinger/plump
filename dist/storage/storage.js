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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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LEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNsQyxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFFRCw0QkFBVSxHQUFWLFVBQVcsQ0FBQztRQUFaLGlCQUlDO1FBSEMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQ2pCLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxLQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFqQixDQUFpQixDQUFDLENBQzlCLENBQUMsSUFBSSxDQUFDLGNBQWlCLENBQUMsQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFHRCxpQ0FBZSxHQUFmLFVBQWdCLEdBQWU7UUFDN0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVELGdDQUFjLEdBQWQsVUFBZSxHQUFjO1FBQzNCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzNCLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFDSCxjQUFDO0FBQUQsQ0FqTEEsQUFpTEMsSUFBQTtBQWpMcUIsMEJBQU8iLCJmaWxlIjoic3RvcmFnZS9zdG9yYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50IG5vLXVudXNlZC12YXJzOiAwICovXG5cbmltcG9ydCAqIGFzIEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCAqIGFzIG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcbmltcG9ydCB7IHZhbGlkYXRlSW5wdXQgfSBmcm9tICcuLi91dGlsJztcbmltcG9ydCB7IFN1YmplY3QsIE9ic2VydmFibGUgfSBmcm9tICdyeGpzL1J4JztcbmltcG9ydCB7XG4gIEluZGVmaW5pdGVNb2RlbERhdGEsXG4gIE1vZGVsRGF0YSxcbiAgTW9kZWxEZWx0YSxcbiAgTW9kZWxTY2hlbWEsXG4gIE1vZGVsUmVmZXJlbmNlLFxuICBSZWxhdGlvbnNoaXBJdGVtLFxufSBmcm9tICcuLi9kYXRhVHlwZXMnO1xuXG4vLyB0eXBlOiBhbiBvYmplY3QgdGhhdCBkZWZpbmVzIHRoZSB0eXBlLiB0eXBpY2FsbHkgdGhpcyB3aWxsIGJlXG4vLyBwYXJ0IG9mIHRoZSBNb2RlbCBjbGFzcyBoaWVyYXJjaHksIGJ1dCBTdG9yYWdlIG9iamVjdHMgY2FsbCBubyBtZXRob2RzXG4vLyBvbiB0aGUgdHlwZSBvYmplY3QuIFdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gVHlwZS4kbmFtZSwgVHlwZS4kaWQgYW5kIFR5cGUuJHNjaGVtYS5cbi8vIE5vdGUgdGhhdCBUeXBlLiRpZCBpcyB0aGUgKm5hbWUgb2YgdGhlIGlkIGZpZWxkKiBvbiBpbnN0YW5jZXNcbi8vICAgIGFuZCBOT1QgdGhlIGFjdHVhbCBpZCBmaWVsZCAoZS5nLiwgaW4gbW9zdCBjYXNlcywgVHlwZS4kaWQgPT09ICdpZCcpLlxuLy8gaWQ6IHVuaXF1ZSBpZC4gT2Z0ZW4gYW4gaW50ZWdlciwgYnV0IG5vdCBuZWNlc3NhcnkgKGNvdWxkIGJlIGFuIG9pZClcblxuXG4vLyBoYXNNYW55IHJlbGF0aW9uc2hpcHMgYXJlIHRyZWF0ZWQgbGlrZSBpZCBhcnJheXMuIFNvLCBhZGQgLyByZW1vdmUgLyBoYXNcbi8vIGp1c3Qgc3RvcmVzIGFuZCByZW1vdmVzIGludGVnZXJzLlxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU3RvcmFnZSB7XG5cbiAgdGVybWluYWw6IGJvb2xlYW47XG4gIHJlYWQkOiBPYnNlcnZhYmxlPE1vZGVsRGF0YT47XG4gIHdyaXRlJDogT2JzZXJ2YWJsZTxNb2RlbERlbHRhPjtcbiAgcHJvdGVjdGVkIHR5cGVzOiB7IFt0eXBlOiBzdHJpbmddOiBNb2RlbFNjaGVtYX0gPSB7fTtcbiAgcHJpdmF0ZSByZWFkU3ViamVjdCA9IG5ldyBTdWJqZWN0KCk7XG4gIHByaXZhdGUgd3JpdGVTdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgLy8gcHJvdGVjdGVkIHR5cGVzOiBNb2RlbFtdOyBUT0RPOiBmaWd1cmUgdGhpcyBvdXRcblxuICBjb25zdHJ1Y3RvcihvcHRzOiBhbnkgPSB7fSkge1xuICAgIC8vIGEgXCJ0ZXJtaW5hbFwiIHN0b3JhZ2UgZmFjaWxpdHkgaXMgdGhlIGVuZCBvZiB0aGUgc3RvcmFnZSBjaGFpbi5cbiAgICAvLyB1c3VhbGx5IHNxbCBvbiB0aGUgc2VydmVyIHNpZGUgYW5kIHJlc3Qgb24gdGhlIGNsaWVudCBzaWRlLCBpdCAqbXVzdCpcbiAgICAvLyByZWNlaXZlIHRoZSB3cml0ZXMsIGFuZCBpcyB0aGUgZmluYWwgYXV0aG9yaXRhdGl2ZSBhbnN3ZXIgb24gd2hldGhlclxuICAgIC8vIHNvbWV0aGluZyBpcyA0MDQuXG5cbiAgICAvLyB0ZXJtaW5hbCBmYWNpbGl0aWVzIGFyZSBhbHNvIHRoZSBvbmx5IG9uZXMgdGhhdCBjYW4gYXV0aG9yaXRhdGl2ZWx5IGFuc3dlclxuICAgIC8vIGF1dGhvcml6YXRpb24gcXVlc3Rpb25zLCBidXQgdGhlIGRlc2lnbiBtYXkgYWxsb3cgZm9yIGF1dGhvcml6YXRpb24gdG8gYmVcbiAgICAvLyBjYWNoZWQuXG4gICAgdGhpcy50ZXJtaW5hbCA9IG9wdHMudGVybWluYWwgfHwgZmFsc2U7XG4gICAgdGhpcy5yZWFkJCA9IHRoaXMucmVhZFN1YmplY3QuYXNPYnNlcnZhYmxlKCk7XG4gICAgdGhpcy53cml0ZSQgPSB0aGlzLndyaXRlU3ViamVjdC5hc09ic2VydmFibGUoKTtcbiAgfVxuXG4gIC8vIEFic3RyYWN0IC0gYWxsIHN0b3JlcyBtdXN0IHByb3ZpZGUgYmVsb3c6XG5cbiAgYWJzdHJhY3QgYWxsb2NhdGVJZCh0eXBlTmFtZTogc3RyaW5nKTogQmx1ZWJpcmQ8c3RyaW5nIHwgbnVtYmVyPjtcbiAgYWJzdHJhY3Qgd3JpdGVBdHRyaWJ1dGVzKHZhbHVlOiBJbmRlZmluaXRlTW9kZWxEYXRhKTogQmx1ZWJpcmQ8TW9kZWxEYXRhPjtcbiAgYWJzdHJhY3QgcmVhZEF0dHJpYnV0ZXModmFsdWU6IE1vZGVsUmVmZXJlbmNlKTogQmx1ZWJpcmQ8TW9kZWxEYXRhPjtcbiAgYWJzdHJhY3QgY2FjaGUodmFsdWU6IE1vZGVsRGF0YSk6IEJsdWViaXJkPE1vZGVsRGF0YT47XG4gIGFic3RyYWN0IGNhY2hlQXR0cmlidXRlcyh2YWx1ZTogTW9kZWxEYXRhKTogQmx1ZWJpcmQ8TW9kZWxEYXRhPjtcbiAgYWJzdHJhY3QgY2FjaGVSZWxhdGlvbnNoaXAodmFsdWU6IE1vZGVsRGF0YSk6IEJsdWViaXJkPE1vZGVsRGF0YT47XG4gIGFic3RyYWN0IHJlYWRSZWxhdGlvbnNoaXAodmFsdWU6IE1vZGVsUmVmZXJlbmNlLCBrZXk/OiBzdHJpbmcgfCBzdHJpbmdbXSk6IEJsdWViaXJkPE1vZGVsRGF0YSB8IFJlbGF0aW9uc2hpcEl0ZW1bXT47XG4gIGFic3RyYWN0IHdpcGUodmFsdWU6IE1vZGVsUmVmZXJlbmNlLCBrZXk/OiBzdHJpbmcgfCBzdHJpbmdbXSk6IHZvaWQ7XG4gIGFic3RyYWN0IGRlbGV0ZSh2YWx1ZTogTW9kZWxSZWZlcmVuY2UpOiBCbHVlYmlyZDx2b2lkPjtcbiAgYWJzdHJhY3Qgd3JpdGVSZWxhdGlvbnNoaXBJdGVtKFxuICAgIHZhbHVlOiBNb2RlbFJlZmVyZW5jZSxcbiAgICByZWxhdGlvbnNoaXBUaXRsZTogc3RyaW5nLFxuICAgIGNoaWxkOiB7aWQ6IHN0cmluZyB8IG51bWJlcn1cbiAgKTogQmx1ZWJpcmQ8TW9kZWxEYXRhPjtcbiAgYWJzdHJhY3QgZGVsZXRlUmVsYXRpb25zaGlwSXRlbShcbiAgICB2YWx1ZTogTW9kZWxSZWZlcmVuY2UsXG4gICAgcmVsYXRpb25zaGlwVGl0bGU6IHN0cmluZyxcbiAgICBjaGlsZDoge2lkOiBzdHJpbmcgfCBudW1iZXJ9XG4gICk6IEJsdWViaXJkPE1vZGVsRGF0YT47XG5cblxuICBxdWVyeShxKSB7XG4gICAgLy8gcToge3R5cGU6IHN0cmluZywgcXVlcnk6IGFueX1cbiAgICAvLyBxLnF1ZXJ5IGlzIGltcGwgZGVmaW5lZCAtIGEgc3RyaW5nIGZvciBzcWwgKHJhdyBzcWwpXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ1F1ZXJ5IG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIC8vIGNvbnZlbmllbmNlIGZ1bmN0aW9uIHVzZWQgaW50ZXJuYWxseVxuICAvLyByZWFkIGEgYnVuY2ggb2YgcmVsYXRpb25zaGlwcyBhbmQgbWVyZ2UgdGhlbSB0b2dldGhlci5cbiAgcmVhZFJlbGF0aW9uc2hpcHMoaXRlbTogTW9kZWxSZWZlcmVuY2UsIHJlbGF0aW9uc2hpcHM6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChyZWxhdGlvbnNoaXBzLm1hcChyID0+IHRoaXMucmVhZFJlbGF0aW9uc2hpcChpdGVtLCByKSkpXG4gICAgLnRoZW4ockEgPT5cbiAgICAgIHJBLnJlZHVjZShcbiAgICAgICAgKGEsIHIpID0+IG1lcmdlT3B0aW9ucyhhLCByIHx8IHt9KSxcbiAgICAgICAgeyB0eXBlTmFtZTogaXRlbS50eXBlTmFtZSwgaWQ6IGl0ZW0uaWQsIGF0dHJpYnV0ZXM6IHt9LCByZWxhdGlvbnNoaXBzOiB7fSB9XG4gICAgICApXG4gICAgKTtcbiAgfVxuXG4gIHJlYWQoaXRlbTogTW9kZWxSZWZlcmVuY2UsIG9wdHM6IHN0cmluZyB8IHN0cmluZ1tdID0gWydhdHRyaWJ1dGVzJ10pIHtcbiAgICBjb25zdCBzY2hlbWEgPSB0aGlzLmdldFNjaGVtYShpdGVtLnR5cGVOYW1lKTtcbiAgICBjb25zdCBrZXlzID0gKG9wdHMgJiYgIUFycmF5LmlzQXJyYXkob3B0cykgPyBbb3B0c10gOiBvcHRzKSBhcyBzdHJpbmdbXTtcbiAgICByZXR1cm4gdGhpcy5yZWFkQXR0cmlidXRlcyhpdGVtKVxuICAgIC50aGVuKGF0dHJpYnV0ZXMgPT4ge1xuICAgICAgaWYgKCFhdHRyaWJ1dGVzKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXMuaWQgJiYgYXR0cmlidXRlcy5hdHRyaWJ1dGVzICYmICFhdHRyaWJ1dGVzLmF0dHJpYnV0ZXNbc2NoZW1hLmlkQXR0cmlidXRlXSkge1xuICAgICAgICAgIGF0dHJpYnV0ZXMuYXR0cmlidXRlc1tzY2hlbWEuaWRBdHRyaWJ1dGVdID0gYXR0cmlidXRlcy5pZDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlbHNXYW50ZWQgPSAoa2V5cy5pbmRleE9mKCdyZWxhdGlvbnNoaXBzJykgPj0gMClcbiAgICAgICAgICA/IE9iamVjdC5rZXlzKHNjaGVtYS5yZWxhdGlvbnNoaXBzKVxuICAgICAgICAgIDoga2V5cy5tYXAoayA9PiBrLnNwbGl0KCcuJykpXG4gICAgICAgICAgICAuZmlsdGVyKGthID0+IGthWzBdID09PSAncmVsYXRpb25zaGlwcycpXG4gICAgICAgICAgICAubWFwKGthID0+IGthWzFdKTtcbiAgICAgICAgY29uc3QgcmVsc1RvRmV0Y2ggPSByZWxzV2FudGVkLmZpbHRlcihyZWxOYW1lID0+ICFhdHRyaWJ1dGVzLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0pO1xuICAgICAgICAvLyByZWFkQXR0cmlidXRlcyBjYW4gcmV0dXJuIHJlbGF0aW9uc2hpcCBkYXRhLCBzbyBkb24ndCBmZXRjaCB0aG9zZVxuICAgICAgICBpZiAocmVsc1RvRmV0Y2gubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnJlYWRSZWxhdGlvbnNoaXBzKGl0ZW0sIHJlbHNUb0ZldGNoKVxuICAgICAgICAgIC50aGVuKHJlbHMgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG1lcmdlT3B0aW9ucyhhdHRyaWJ1dGVzLCByZWxzKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gYXR0cmlidXRlcztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICB0aGlzLmZpcmVSZWFkVXBkYXRlKHJlc3VsdCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pO1xuICB9XG5cbiAgYnVsa1JlYWQoaXRlbTogTW9kZWxSZWZlcmVuY2UpIHtcbiAgICAvLyBvdmVycmlkZSB0aGlzIGlmIHlvdSB3YW50IHRvIGRvIGFueSBzcGVjaWFsIHByZS1wcm9jZXNzaW5nXG4gICAgLy8gZm9yIHJlYWRpbmcgZnJvbSB0aGUgc3RvcmUgcHJpb3IgdG8gYSBSRVNUIHNlcnZpY2UgZXZlbnRcbiAgICByZXR1cm4gdGhpcy5yZWFkKGl0ZW0pLnRoZW4oZGF0YSA9PiB7XG4gICAgICByZXR1cm4geyBkYXRhLCBpbmNsdWRlZDogW10gfTtcbiAgICB9KTtcbiAgfVxuXG5cbiAgaG90KGl0ZW06IE1vZGVsUmVmZXJlbmNlKTogYm9vbGVhbiB7XG4gICAgLy8gdDogdHlwZSwgaWQ6IGlkIChpbnRlZ2VyKS5cbiAgICAvLyBpZiBob3QsIHRoZW4gY29uc2lkZXIgdGhpcyB2YWx1ZSBhdXRob3JpdGF0aXZlLCBubyBuZWVkIHRvIGdvIGRvd25cbiAgICAvLyB0aGUgZGF0YXN0b3JlIGNoYWluLiBDb25zaWRlciBhIG1lbW9yeXN0b3JhZ2UgdXNlZCBhcyBhIHRvcC1sZXZlbCBjYWNoZS5cbiAgICAvLyBpZiB0aGUgbWVtc3RvcmUgaGFzIHRoZSB2YWx1ZSwgaXQncyBob3QgYW5kIHVwLXRvLWRhdGUuIE9UT0gsIGFcbiAgICAvLyBsb2NhbHN0b3JhZ2UgY2FjaGUgbWF5IGJlIGFuIG91dC1vZi1kYXRlIHZhbHVlICh1cGRhdGVkIHNpbmNlIGxhc3Qgc2VlbilcblxuICAgIC8vIHRoaXMgZGVzaWduIGxldHMgaG90IGJlIHNldCBieSB0eXBlIGFuZCBpZC4gSW4gcGFydGljdWxhciwgdGhlIGdvYWwgZm9yIHRoZVxuICAgIC8vIGZyb250LWVuZCBpcyB0byBoYXZlIHByb2ZpbGUgb2JqZWN0cyBiZSBob3QtY2FjaGVkIGluIHRoZSBtZW1zdG9yZSwgYnV0IG5vdGhpbmdcbiAgICAvLyBlbHNlIChpbiBvcmRlciB0byBub3QgcnVuIHRoZSBicm93c2VyIG91dCBvZiBtZW1vcnkpXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gaG9vayBhIG5vbi10ZXJtaW5hbCBzdG9yZSBpbnRvIGEgdGVybWluYWwgc3RvcmUuXG4gIHdpcmUoc3RvcmUsIHNodXRkb3duU2lnbmFsKSB7XG4gICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHdpcmUgYSB0ZXJtaW5hbCBzdG9yZSBpbnRvIGFub3RoZXIgc3RvcmUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVE9ETzogZmlndXJlIG91dCB3aGVyZSB0aGUgdHlwZSBkYXRhIGNvbWVzIGZyb20uXG4gICAgICBzdG9yZS5yZWFkJC50YWtlVW50aWwoc2h1dGRvd25TaWduYWwpLnN1YnNjcmliZSgodikgPT4ge1xuICAgICAgICB0aGlzLmNhY2hlKHYpO1xuICAgICAgfSk7XG4gICAgICBzdG9yZS53cml0ZSQudGFrZVVudGlsKHNodXRkb3duU2lnbmFsKS5zdWJzY3JpYmUoKHYpID0+IHtcbiAgICAgICAgdi5pbnZhbGlkYXRlLmZvckVhY2goKGludmFsaWQpID0+IHtcbiAgICAgICAgICB0aGlzLndpcGUodiwgaW52YWxpZCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgdmFsaWRhdGVJbnB1dCh2YWx1ZTogSW5kZWZpbml0ZU1vZGVsRGF0YSwgb3B0cyA9IHt9KSB7XG4gICAgY29uc3QgdHlwZSA9IHRoaXMuZ2V0U2NoZW1hKHZhbHVlLnR5cGVOYW1lKTtcbiAgICByZXR1cm4gdmFsaWRhdGVJbnB1dCh0eXBlLCB2YWx1ZSk7XG4gIH1cblxuICAvLyBzdG9yZSB0eXBlIGluZm8gZGF0YSBvbiB0aGUgc3RvcmUgaXRzZWxmXG5cbiAgZ2V0U2NoZW1hKHQ6IHtzY2hlbWE6IE1vZGVsU2NoZW1hfSB8IE1vZGVsU2NoZW1hIHwgc3RyaW5nKTogTW9kZWxTY2hlbWEge1xuICAgIGlmICh0eXBlb2YgdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiB0aGlzLnR5cGVzW3RdO1xuICAgIH0gZWxzZSBpZiAodFsnc2NoZW1hJ10pIHtcbiAgICAgIHJldHVybiAodCBhcyB7c2NoZW1hOiBNb2RlbFNjaGVtYX0pLnNjaGVtYTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHQgYXMgTW9kZWxTY2hlbWE7XG4gICAgfVxuICB9XG5cbiAgYWRkU2NoZW1hKHQ6IHt0eXBlTmFtZTogc3RyaW5nLCBzY2hlbWE6IE1vZGVsU2NoZW1hfSkge1xuICAgIHRoaXMudHlwZXNbdC50eXBlTmFtZV0gPSB0LnNjaGVtYTtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpO1xuICB9XG5cbiAgYWRkU2NoZW1hcyhhKTogQmx1ZWJpcmQ8dm9pZD4ge1xuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoXG4gICAgICBhLm1hcCh0ID0+IHRoaXMuYWRkU2NoZW1hKHQpKVxuICAgICkudGhlbigoKSA9PiB7Lyogbm9vcCAqL30pO1xuICB9XG5cblxuICBmaXJlV3JpdGVVcGRhdGUodmFsOiBNb2RlbERlbHRhKSB7XG4gICAgdGhpcy53cml0ZVN1YmplY3QubmV4dCh2YWwpO1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHZhbCk7XG4gIH1cblxuICBmaXJlUmVhZFVwZGF0ZSh2YWw6IE1vZGVsRGF0YSkge1xuICAgIHRoaXMucmVhZFN1YmplY3QubmV4dCh2YWwpO1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHZhbCk7XG4gIH1cbn1cbiJdfQ==
