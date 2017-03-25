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
    };
    Storage.prototype.addTypes = function (a) {
        var _this = this;
        a.forEach(function (t) { return _this.addSchema(t); });
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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LEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUNwQyxDQUFDO0lBRUQsMEJBQVEsR0FBUixVQUFTLENBQUM7UUFBVixpQkFFQztRQURDLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxLQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFqQixDQUFpQixDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUdELGlDQUFlLEdBQWYsVUFBZ0IsR0FBMEI7UUFDeEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVELGdDQUFjLEdBQWQsVUFBZSxHQUF5QjtRQUN0QyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzQixNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBQ0gsY0FBQztBQUFELENBN0tBLEFBNktDLElBQUE7QUE3S3FCLDBCQUFPIiwiZmlsZSI6InN0b3JhZ2Uvc3RvcmFnZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludCBuby11bnVzZWQtdmFyczogMCAqL1xuXG5pbXBvcnQgKiBhcyBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgKiBhcyBtZXJnZU9wdGlvbnMgZnJvbSAnbWVyZ2Utb3B0aW9ucyc7XG5pbXBvcnQgeyB2YWxpZGF0ZUlucHV0IH0gZnJvbSAnLi4vdXRpbCc7XG5pbXBvcnQgeyBTdWJqZWN0LCBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcy9SeCc7XG5pbXBvcnQgKiBhcyBJbnRlcmZhY2VzIGZyb20gJy4uL2RhdGFUeXBlcyc7XG5cbi8vIHR5cGU6IGFuIG9iamVjdCB0aGF0IGRlZmluZXMgdGhlIHR5cGUuIHR5cGljYWxseSB0aGlzIHdpbGwgYmVcbi8vIHBhcnQgb2YgdGhlIE1vZGVsIGNsYXNzIGhpZXJhcmNoeSwgYnV0IFN0b3JhZ2Ugb2JqZWN0cyBjYWxsIG5vIG1ldGhvZHNcbi8vIG9uIHRoZSB0eXBlIG9iamVjdC4gV2Ugb25seSBhcmUgaW50ZXJlc3RlZCBpbiBUeXBlLiRuYW1lLCBUeXBlLiRpZCBhbmQgVHlwZS4kc2NoZW1hLlxuLy8gTm90ZSB0aGF0IFR5cGUuJGlkIGlzIHRoZSAqbmFtZSBvZiB0aGUgaWQgZmllbGQqIG9uIGluc3RhbmNlc1xuLy8gICAgYW5kIE5PVCB0aGUgYWN0dWFsIGlkIGZpZWxkIChlLmcuLCBpbiBtb3N0IGNhc2VzLCBUeXBlLiRpZCA9PT0gJ2lkJykuXG4vLyBpZDogdW5pcXVlIGlkLiBPZnRlbiBhbiBpbnRlZ2VyLCBidXQgbm90IG5lY2Vzc2FyeSAoY291bGQgYmUgYW4gb2lkKVxuXG5cbi8vIGhhc01hbnkgcmVsYXRpb25zaGlwcyBhcmUgdHJlYXRlZCBsaWtlIGlkIGFycmF5cy4gU28sIGFkZCAvIHJlbW92ZSAvIGhhc1xuLy8ganVzdCBzdG9yZXMgYW5kIHJlbW92ZXMgaW50ZWdlcnMuXG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTdG9yYWdlIHtcblxuICB0ZXJtaW5hbDogYm9vbGVhbjtcbiAgcmVhZCQ6IE9ic2VydmFibGU8SW50ZXJmYWNlcy5Nb2RlbERhdGE+O1xuICB3cml0ZSQ6IE9ic2VydmFibGU8SW50ZXJmYWNlcy5Nb2RlbERlbHRhPjtcbiAgcHJvdGVjdGVkIHR5cGVzOiBJbnRlcmZhY2VzLlN0cmluZ0luZGV4ZWQ8SW50ZXJmYWNlcy5Nb2RlbFNjaGVtYT4gPSB7fTtcbiAgcHJpdmF0ZSByZWFkU3ViamVjdCA9IG5ldyBTdWJqZWN0KCk7XG4gIHByaXZhdGUgd3JpdGVTdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgLy8gcHJvdGVjdGVkIHR5cGVzOiBNb2RlbFtdOyBUT0RPOiBmaWd1cmUgdGhpcyBvdXRcblxuICBjb25zdHJ1Y3RvcihvcHRzOiBhbnkgPSB7fSkge1xuICAgIC8vIGEgXCJ0ZXJtaW5hbFwiIHN0b3JhZ2UgZmFjaWxpdHkgaXMgdGhlIGVuZCBvZiB0aGUgc3RvcmFnZSBjaGFpbi5cbiAgICAvLyB1c3VhbGx5IHNxbCBvbiB0aGUgc2VydmVyIHNpZGUgYW5kIHJlc3Qgb24gdGhlIGNsaWVudCBzaWRlLCBpdCAqbXVzdCpcbiAgICAvLyByZWNlaXZlIHRoZSB3cml0ZXMsIGFuZCBpcyB0aGUgZmluYWwgYXV0aG9yaXRhdGl2ZSBhbnN3ZXIgb24gd2hldGhlclxuICAgIC8vIHNvbWV0aGluZyBpcyA0MDQuXG5cbiAgICAvLyB0ZXJtaW5hbCBmYWNpbGl0aWVzIGFyZSBhbHNvIHRoZSBvbmx5IG9uZXMgdGhhdCBjYW4gYXV0aG9yaXRhdGl2ZWx5IGFuc3dlclxuICAgIC8vIGF1dGhvcml6YXRpb24gcXVlc3Rpb25zLCBidXQgdGhlIGRlc2lnbiBtYXkgYWxsb3cgZm9yIGF1dGhvcml6YXRpb24gdG8gYmVcbiAgICAvLyBjYWNoZWQuXG4gICAgdGhpcy50ZXJtaW5hbCA9IG9wdHMudGVybWluYWwgfHwgZmFsc2U7XG4gICAgdGhpcy5yZWFkJCA9IHRoaXMucmVhZFN1YmplY3QuYXNPYnNlcnZhYmxlKCk7XG4gICAgdGhpcy53cml0ZSQgPSB0aGlzLndyaXRlU3ViamVjdC5hc09ic2VydmFibGUoKTtcbiAgfVxuXG4gIC8vIEFic3RyYWN0IC0gYWxsIHN0b3JlcyBtdXN0IHByb3ZpZGUgYmVsb3c6XG5cbiAgYWJzdHJhY3Qgd3JpdGVBdHRyaWJ1dGVzKHZhbHVlOiBJbnRlcmZhY2VzLkluZGVmaW5pdGVNb2RlbERhdGEpOiBCbHVlYmlyZDxJbnRlcmZhY2VzLk1vZGVsRGF0YT47XG4gIGFic3RyYWN0IHJlYWRBdHRyaWJ1dGVzKHZhbHVlOiBJbnRlcmZhY2VzLk1vZGVsUmVmZXJlbmNlKTogQmx1ZWJpcmQ8SW50ZXJmYWNlcy5Nb2RlbERhdGE+O1xuICBhYnN0cmFjdCBjYWNoZSh2YWx1ZTogSW50ZXJmYWNlcy5Nb2RlbERhdGEpOiBCbHVlYmlyZDxJbnRlcmZhY2VzLk1vZGVsRGF0YT47XG4gIGFic3RyYWN0IGNhY2hlQXR0cmlidXRlcyh2YWx1ZTogSW50ZXJmYWNlcy5Nb2RlbERhdGEpOiBCbHVlYmlyZDxJbnRlcmZhY2VzLk1vZGVsRGF0YT47XG4gIGFic3RyYWN0IGNhY2hlUmVsYXRpb25zaGlwKHZhbHVlOiBJbnRlcmZhY2VzLk1vZGVsRGF0YSk6IEJsdWViaXJkPEludGVyZmFjZXMuTW9kZWxEYXRhPjtcbiAgYWJzdHJhY3QgcmVhZFJlbGF0aW9uc2hpcCh2YWx1ZTogSW50ZXJmYWNlcy5Nb2RlbFJlZmVyZW5jZSwga2V5Pzogc3RyaW5nIHwgc3RyaW5nW10pOiBCbHVlYmlyZDxJbnRlcmZhY2VzLk1vZGVsRGF0YT47XG4gIGFic3RyYWN0IHdpcGUodmFsdWU6IEludGVyZmFjZXMuTW9kZWxSZWZlcmVuY2UsIGtleT86IHN0cmluZyB8IHN0cmluZ1tdKTogdm9pZDtcbiAgYWJzdHJhY3QgZGVsZXRlKHZhbHVlOiBJbnRlcmZhY2VzLk1vZGVsUmVmZXJlbmNlKTogQmx1ZWJpcmQ8dm9pZD47XG4gIGFic3RyYWN0IHdyaXRlUmVsYXRpb25zaGlwSXRlbShcbiAgICB2YWx1ZTogSW50ZXJmYWNlcy5Nb2RlbFJlZmVyZW5jZSxcbiAgICByZWxhdGlvbnNoaXBUaXRsZTogc3RyaW5nLFxuICAgIGNoaWxkOiB7aWQ6IHN0cmluZyB8IG51bWJlcn1cbiAgKTogQmx1ZWJpcmQ8SW50ZXJmYWNlcy5Nb2RlbERhdGE+O1xuICBhYnN0cmFjdCBkZWxldGVSZWxhdGlvbnNoaXBJdGVtKFxuICAgIHZhbHVlOiBJbnRlcmZhY2VzLk1vZGVsUmVmZXJlbmNlLFxuICAgIHJlbGF0aW9uc2hpcFRpdGxlOiBzdHJpbmcsXG4gICAgY2hpbGQ6IHtpZDogc3RyaW5nIHwgbnVtYmVyfVxuICApOiBCbHVlYmlyZDxJbnRlcmZhY2VzLk1vZGVsRGF0YT47XG5cblxuICBxdWVyeShxKSB7XG4gICAgLy8gcToge3R5cGU6IHN0cmluZywgcXVlcnk6IGFueX1cbiAgICAvLyBxLnF1ZXJ5IGlzIGltcGwgZGVmaW5lZCAtIGEgc3RyaW5nIGZvciBzcWwgKHJhdyBzcWwpXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ1F1ZXJ5IG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIC8vIGNvbnZlbmllbmNlIGZ1bmN0aW9uIHVzZWQgaW50ZXJuYWxseVxuICAvLyByZWFkIGEgYnVuY2ggb2YgcmVsYXRpb25zaGlwcyBhbmQgbWVyZ2UgdGhlbSB0b2dldGhlci5cbiAgcmVhZFJlbGF0aW9uc2hpcHMoaXRlbTogSW50ZXJmYWNlcy5Nb2RlbFJlZmVyZW5jZSwgcmVsYXRpb25zaGlwczogc3RyaW5nW10pIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKHJlbGF0aW9uc2hpcHMubWFwKHIgPT4gdGhpcy5yZWFkUmVsYXRpb25zaGlwKGl0ZW0sIHIpKSlcbiAgICAudGhlbihyQSA9PlxuICAgICAgckEucmVkdWNlKFxuICAgICAgICAoYSwgcikgPT4gbWVyZ2VPcHRpb25zKGEsIHIgfHwge30pLFxuICAgICAgICB7IHR5cGVOYW1lOiBpdGVtLnR5cGVOYW1lLCBpZDogaXRlbS5pZCwgYXR0cmlidXRlczoge30sIHJlbGF0aW9uc2hpcHM6IHt9IH1cbiAgICAgIClcbiAgICApO1xuICB9XG5cbiAgcmVhZChpdGVtOiBJbnRlcmZhY2VzLk1vZGVsUmVmZXJlbmNlLCBvcHRzOiBzdHJpbmcgfCBzdHJpbmdbXSA9IFsnYXR0cmlidXRlcyddKSB7XG4gICAgY29uc3Qgc2NoZW1hID0gdGhpcy5nZXRTY2hlbWEoaXRlbS50eXBlTmFtZSk7XG4gICAgY29uc3Qga2V5cyA9IChvcHRzICYmICFBcnJheS5pc0FycmF5KG9wdHMpID8gW29wdHNdIDogb3B0cykgYXMgc3RyaW5nW107XG4gICAgcmV0dXJuIHRoaXMucmVhZEF0dHJpYnV0ZXMoaXRlbSlcbiAgICAudGhlbihhdHRyaWJ1dGVzID0+IHtcbiAgICAgIGlmICghYXR0cmlidXRlcykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChhdHRyaWJ1dGVzLmlkICYmIGF0dHJpYnV0ZXMuYXR0cmlidXRlcyAmJiAhYXR0cmlidXRlcy5hdHRyaWJ1dGVzW3NjaGVtYS5pZEF0dHJpYnV0ZV0pIHtcbiAgICAgICAgICBhdHRyaWJ1dGVzLmF0dHJpYnV0ZXNbc2NoZW1hLmlkQXR0cmlidXRlXSA9IGF0dHJpYnV0ZXMuaWQ7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZWxzV2FudGVkID0gKGtleXMuaW5kZXhPZigncmVsYXRpb25zaGlwcycpID49IDApXG4gICAgICAgICAgPyBPYmplY3Qua2V5cyhzY2hlbWEucmVsYXRpb25zaGlwcylcbiAgICAgICAgICA6IGtleXMubWFwKGsgPT4gay5zcGxpdCgnLicpKVxuICAgICAgICAgICAgLmZpbHRlcihrYSA9PiBrYVswXSA9PT0gJ3JlbGF0aW9uc2hpcHMnKVxuICAgICAgICAgICAgLm1hcChrYSA9PiBrYVsxXSk7XG4gICAgICAgIGNvbnN0IHJlbHNUb0ZldGNoID0gcmVsc1dhbnRlZC5maWx0ZXIocmVsTmFtZSA9PiAhYXR0cmlidXRlcy5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdKTtcbiAgICAgICAgLy8gcmVhZEF0dHJpYnV0ZXMgY2FuIHJldHVybiByZWxhdGlvbnNoaXAgZGF0YSwgc28gZG9uJ3QgZmV0Y2ggdGhvc2VcbiAgICAgICAgaWYgKHJlbHNUb0ZldGNoLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yZWFkUmVsYXRpb25zaGlwcyhpdGVtLCByZWxzVG9GZXRjaClcbiAgICAgICAgICAudGhlbihyZWxzID0+IHtcbiAgICAgICAgICAgIHJldHVybiBtZXJnZU9wdGlvbnMoYXR0cmlidXRlcywgcmVscyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgdGhpcy5maXJlUmVhZFVwZGF0ZShyZXN1bHQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcbiAgfVxuXG4gIGJ1bGtSZWFkKGl0ZW06IEludGVyZmFjZXMuTW9kZWxSZWZlcmVuY2UpIHtcbiAgICAvLyBvdmVycmlkZSB0aGlzIGlmIHlvdSB3YW50IHRvIGRvIGFueSBzcGVjaWFsIHByZS1wcm9jZXNzaW5nXG4gICAgLy8gZm9yIHJlYWRpbmcgZnJvbSB0aGUgc3RvcmUgcHJpb3IgdG8gYSBSRVNUIHNlcnZpY2UgZXZlbnRcbiAgICByZXR1cm4gdGhpcy5yZWFkKGl0ZW0pLnRoZW4oZGF0YSA9PiB7XG4gICAgICByZXR1cm4geyBkYXRhLCBpbmNsdWRlZDogW10gfTtcbiAgICB9KTtcbiAgfVxuXG5cbiAgaG90KGl0ZW06IEludGVyZmFjZXMuTW9kZWxSZWZlcmVuY2UpOiBib29sZWFuIHtcbiAgICAvLyB0OiB0eXBlLCBpZDogaWQgKGludGVnZXIpLlxuICAgIC8vIGlmIGhvdCwgdGhlbiBjb25zaWRlciB0aGlzIHZhbHVlIGF1dGhvcml0YXRpdmUsIG5vIG5lZWQgdG8gZ28gZG93blxuICAgIC8vIHRoZSBkYXRhc3RvcmUgY2hhaW4uIENvbnNpZGVyIGEgbWVtb3J5c3RvcmFnZSB1c2VkIGFzIGEgdG9wLWxldmVsIGNhY2hlLlxuICAgIC8vIGlmIHRoZSBtZW1zdG9yZSBoYXMgdGhlIHZhbHVlLCBpdCdzIGhvdCBhbmQgdXAtdG8tZGF0ZS4gT1RPSCwgYVxuICAgIC8vIGxvY2Fsc3RvcmFnZSBjYWNoZSBtYXkgYmUgYW4gb3V0LW9mLWRhdGUgdmFsdWUgKHVwZGF0ZWQgc2luY2UgbGFzdCBzZWVuKVxuXG4gICAgLy8gdGhpcyBkZXNpZ24gbGV0cyBob3QgYmUgc2V0IGJ5IHR5cGUgYW5kIGlkLiBJbiBwYXJ0aWN1bGFyLCB0aGUgZ29hbCBmb3IgdGhlXG4gICAgLy8gZnJvbnQtZW5kIGlzIHRvIGhhdmUgcHJvZmlsZSBvYmplY3RzIGJlIGhvdC1jYWNoZWQgaW4gdGhlIG1lbXN0b3JlLCBidXQgbm90aGluZ1xuICAgIC8vIGVsc2UgKGluIG9yZGVyIHRvIG5vdCBydW4gdGhlIGJyb3dzZXIgb3V0IG9mIG1lbW9yeSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBob29rIGEgbm9uLXRlcm1pbmFsIHN0b3JlIGludG8gYSB0ZXJtaW5hbCBzdG9yZS5cbiAgd2lyZShzdG9yZSwgc2h1dGRvd25TaWduYWwpIHtcbiAgICBpZiAodGhpcy50ZXJtaW5hbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3Qgd2lyZSBhIHRlcm1pbmFsIHN0b3JlIGludG8gYW5vdGhlciBzdG9yZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIHRoZSB0eXBlIGRhdGEgY29tZXMgZnJvbS5cbiAgICAgIHN0b3JlLnJlYWQkLnRha2VVbnRpbChzaHV0ZG93blNpZ25hbCkuc3Vic2NyaWJlKCh2KSA9PiB7XG4gICAgICAgIHRoaXMuY2FjaGUodik7XG4gICAgICB9KTtcbiAgICAgIHN0b3JlLndyaXRlJC50YWtlVW50aWwoc2h1dGRvd25TaWduYWwpLnN1YnNjcmliZSgodikgPT4ge1xuICAgICAgICB2LmludmFsaWRhdGUuZm9yRWFjaCgoaW52YWxpZCkgPT4ge1xuICAgICAgICAgIHRoaXMud2lwZSh2LCBpbnZhbGlkKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICB2YWxpZGF0ZUlucHV0KHZhbHVlOiBJbnRlcmZhY2VzLkluZGVmaW5pdGVNb2RlbERhdGEsIG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IHR5cGUgPSB0aGlzLmdldFNjaGVtYSh2YWx1ZS50eXBlTmFtZSk7XG4gICAgcmV0dXJuIHZhbGlkYXRlSW5wdXQodHlwZSwgdmFsdWUpO1xuICB9XG5cbiAgLy8gc3RvcmUgdHlwZSBpbmZvIGRhdGEgb24gdGhlIHN0b3JlIGl0c2VsZlxuXG4gIGdldFNjaGVtYSh0OiB7c2NoZW1hOiBJbnRlcmZhY2VzLk1vZGVsU2NoZW1hfSB8IEludGVyZmFjZXMuTW9kZWxTY2hlbWEgfCBzdHJpbmcpOiBJbnRlcmZhY2VzLk1vZGVsU2NoZW1hIHtcbiAgICBpZiAodHlwZW9mIHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gdGhpcy50eXBlc1t0XTtcbiAgICB9IGVsc2UgaWYgKHRbJ3NjaGVtYSddKSB7XG4gICAgICByZXR1cm4gKHQgYXMge3NjaGVtYTogSW50ZXJmYWNlcy5Nb2RlbFNjaGVtYX0pLnNjaGVtYTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHQgYXMgSW50ZXJmYWNlcy5Nb2RlbFNjaGVtYTtcbiAgICB9XG4gIH1cblxuICBhZGRTY2hlbWEodDoge3R5cGVOYW1lOiBzdHJpbmcsIHNjaGVtYTogSW50ZXJmYWNlcy5Nb2RlbFNjaGVtYX0pIHtcbiAgICB0aGlzLnR5cGVzW3QudHlwZU5hbWVdID0gdC5zY2hlbWE7XG4gIH1cblxuICBhZGRUeXBlcyhhKSB7XG4gICAgYS5mb3JFYWNoKHQgPT4gdGhpcy5hZGRTY2hlbWEodCkpO1xuICB9XG5cblxuICBmaXJlV3JpdGVVcGRhdGUodmFsOiBJbnRlcmZhY2VzLk1vZGVsRGVsdGEpIHtcbiAgICB0aGlzLndyaXRlU3ViamVjdC5uZXh0KHZhbCk7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUodmFsKTtcbiAgfVxuXG4gIGZpcmVSZWFkVXBkYXRlKHZhbDogSW50ZXJmYWNlcy5Nb2RlbERhdGEpIHtcbiAgICB0aGlzLnJlYWRTdWJqZWN0Lm5leHQodmFsKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh2YWwpO1xuICB9XG59XG4iXX0=
