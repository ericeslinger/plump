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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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LEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUNwQyxDQUFDO0lBRUQsMEJBQVEsR0FBUixVQUFTLENBQUM7UUFBVixpQkFFQztRQURDLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxLQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFqQixDQUFpQixDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUdELGlDQUFlLEdBQWYsVUFBZ0IsR0FBZTtRQUM3QixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM1QixNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQsZ0NBQWMsR0FBZCxVQUFlLEdBQWM7UUFDM0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0IsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUNILGNBQUM7QUFBRCxDQTdLQSxBQTZLQyxJQUFBO0FBN0txQiwwQkFBTyIsImZpbGUiOiJzdG9yYWdlL3N0b3JhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQgbm8tdW51c2VkLXZhcnM6IDAgKi9cblxuaW1wb3J0ICogYXMgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0ICogYXMgbWVyZ2VPcHRpb25zIGZyb20gJ21lcmdlLW9wdGlvbnMnO1xuaW1wb3J0IHsgdmFsaWRhdGVJbnB1dCB9IGZyb20gJy4uL3V0aWwnO1xuaW1wb3J0IHsgU3ViamVjdCwgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMvUngnO1xuaW1wb3J0IHtcbiAgSW5kZWZpbml0ZU1vZGVsRGF0YSxcbiAgTW9kZWxEYXRhLFxuICBNb2RlbERlbHRhLFxuICBNb2RlbFNjaGVtYSxcbiAgTW9kZWxSZWZlcmVuY2UsXG4gIFJlbGF0aW9uc2hpcEl0ZW0sXG59IGZyb20gJy4uL2RhdGFUeXBlcyc7XG5cbi8vIHR5cGU6IGFuIG9iamVjdCB0aGF0IGRlZmluZXMgdGhlIHR5cGUuIHR5cGljYWxseSB0aGlzIHdpbGwgYmVcbi8vIHBhcnQgb2YgdGhlIE1vZGVsIGNsYXNzIGhpZXJhcmNoeSwgYnV0IFN0b3JhZ2Ugb2JqZWN0cyBjYWxsIG5vIG1ldGhvZHNcbi8vIG9uIHRoZSB0eXBlIG9iamVjdC4gV2Ugb25seSBhcmUgaW50ZXJlc3RlZCBpbiBUeXBlLiRuYW1lLCBUeXBlLiRpZCBhbmQgVHlwZS4kc2NoZW1hLlxuLy8gTm90ZSB0aGF0IFR5cGUuJGlkIGlzIHRoZSAqbmFtZSBvZiB0aGUgaWQgZmllbGQqIG9uIGluc3RhbmNlc1xuLy8gICAgYW5kIE5PVCB0aGUgYWN0dWFsIGlkIGZpZWxkIChlLmcuLCBpbiBtb3N0IGNhc2VzLCBUeXBlLiRpZCA9PT0gJ2lkJykuXG4vLyBpZDogdW5pcXVlIGlkLiBPZnRlbiBhbiBpbnRlZ2VyLCBidXQgbm90IG5lY2Vzc2FyeSAoY291bGQgYmUgYW4gb2lkKVxuXG5cbi8vIGhhc01hbnkgcmVsYXRpb25zaGlwcyBhcmUgdHJlYXRlZCBsaWtlIGlkIGFycmF5cy4gU28sIGFkZCAvIHJlbW92ZSAvIGhhc1xuLy8ganVzdCBzdG9yZXMgYW5kIHJlbW92ZXMgaW50ZWdlcnMuXG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTdG9yYWdlIHtcblxuICB0ZXJtaW5hbDogYm9vbGVhbjtcbiAgcmVhZCQ6IE9ic2VydmFibGU8TW9kZWxEYXRhPjtcbiAgd3JpdGUkOiBPYnNlcnZhYmxlPE1vZGVsRGVsdGE+O1xuICBwcm90ZWN0ZWQgdHlwZXM6IHsgW3R5cGU6IHN0cmluZ106IE1vZGVsU2NoZW1hfSA9IHt9O1xuICBwcml2YXRlIHJlYWRTdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgcHJpdmF0ZSB3cml0ZVN1YmplY3QgPSBuZXcgU3ViamVjdCgpO1xuICAvLyBwcm90ZWN0ZWQgdHlwZXM6IE1vZGVsW107IFRPRE86IGZpZ3VyZSB0aGlzIG91dFxuXG4gIGNvbnN0cnVjdG9yKG9wdHM6IGFueSA9IHt9KSB7XG4gICAgLy8gYSBcInRlcm1pbmFsXCIgc3RvcmFnZSBmYWNpbGl0eSBpcyB0aGUgZW5kIG9mIHRoZSBzdG9yYWdlIGNoYWluLlxuICAgIC8vIHVzdWFsbHkgc3FsIG9uIHRoZSBzZXJ2ZXIgc2lkZSBhbmQgcmVzdCBvbiB0aGUgY2xpZW50IHNpZGUsIGl0ICptdXN0KlxuICAgIC8vIHJlY2VpdmUgdGhlIHdyaXRlcywgYW5kIGlzIHRoZSBmaW5hbCBhdXRob3JpdGF0aXZlIGFuc3dlciBvbiB3aGV0aGVyXG4gICAgLy8gc29tZXRoaW5nIGlzIDQwNC5cblxuICAgIC8vIHRlcm1pbmFsIGZhY2lsaXRpZXMgYXJlIGFsc28gdGhlIG9ubHkgb25lcyB0aGF0IGNhbiBhdXRob3JpdGF0aXZlbHkgYW5zd2VyXG4gICAgLy8gYXV0aG9yaXphdGlvbiBxdWVzdGlvbnMsIGJ1dCB0aGUgZGVzaWduIG1heSBhbGxvdyBmb3IgYXV0aG9yaXphdGlvbiB0byBiZVxuICAgIC8vIGNhY2hlZC5cbiAgICB0aGlzLnRlcm1pbmFsID0gb3B0cy50ZXJtaW5hbCB8fCBmYWxzZTtcbiAgICB0aGlzLnJlYWQkID0gdGhpcy5yZWFkU3ViamVjdC5hc09ic2VydmFibGUoKTtcbiAgICB0aGlzLndyaXRlJCA9IHRoaXMud3JpdGVTdWJqZWN0LmFzT2JzZXJ2YWJsZSgpO1xuICB9XG5cbiAgLy8gQWJzdHJhY3QgLSBhbGwgc3RvcmVzIG11c3QgcHJvdmlkZSBiZWxvdzpcblxuICBhYnN0cmFjdCB3cml0ZUF0dHJpYnV0ZXModmFsdWU6IEluZGVmaW5pdGVNb2RlbERhdGEpOiBCbHVlYmlyZDxNb2RlbERhdGE+O1xuICBhYnN0cmFjdCByZWFkQXR0cmlidXRlcyh2YWx1ZTogTW9kZWxSZWZlcmVuY2UpOiBCbHVlYmlyZDxNb2RlbERhdGE+O1xuICBhYnN0cmFjdCBjYWNoZSh2YWx1ZTogTW9kZWxEYXRhKTogQmx1ZWJpcmQ8TW9kZWxEYXRhPjtcbiAgYWJzdHJhY3QgY2FjaGVBdHRyaWJ1dGVzKHZhbHVlOiBNb2RlbERhdGEpOiBCbHVlYmlyZDxNb2RlbERhdGE+O1xuICBhYnN0cmFjdCBjYWNoZVJlbGF0aW9uc2hpcCh2YWx1ZTogTW9kZWxEYXRhKTogQmx1ZWJpcmQ8TW9kZWxEYXRhPjtcbiAgYWJzdHJhY3QgcmVhZFJlbGF0aW9uc2hpcCh2YWx1ZTogTW9kZWxSZWZlcmVuY2UsIGtleT86IHN0cmluZyB8IHN0cmluZ1tdKTogQmx1ZWJpcmQ8TW9kZWxEYXRhIHwgUmVsYXRpb25zaGlwSXRlbVtdPjtcbiAgYWJzdHJhY3Qgd2lwZSh2YWx1ZTogTW9kZWxSZWZlcmVuY2UsIGtleT86IHN0cmluZyB8IHN0cmluZ1tdKTogdm9pZDtcbiAgYWJzdHJhY3QgZGVsZXRlKHZhbHVlOiBNb2RlbFJlZmVyZW5jZSk6IEJsdWViaXJkPHZvaWQ+O1xuICBhYnN0cmFjdCB3cml0ZVJlbGF0aW9uc2hpcEl0ZW0oXG4gICAgdmFsdWU6IE1vZGVsUmVmZXJlbmNlLFxuICAgIHJlbGF0aW9uc2hpcFRpdGxlOiBzdHJpbmcsXG4gICAgY2hpbGQ6IHtpZDogc3RyaW5nIHwgbnVtYmVyfVxuICApOiBCbHVlYmlyZDxNb2RlbERhdGE+O1xuICBhYnN0cmFjdCBkZWxldGVSZWxhdGlvbnNoaXBJdGVtKFxuICAgIHZhbHVlOiBNb2RlbFJlZmVyZW5jZSxcbiAgICByZWxhdGlvbnNoaXBUaXRsZTogc3RyaW5nLFxuICAgIGNoaWxkOiB7aWQ6IHN0cmluZyB8IG51bWJlcn1cbiAgKTogQmx1ZWJpcmQ8TW9kZWxEYXRhPjtcblxuXG4gIHF1ZXJ5KHEpIHtcbiAgICAvLyBxOiB7dHlwZTogc3RyaW5nLCBxdWVyeTogYW55fVxuICAgIC8vIHEucXVlcnkgaXMgaW1wbCBkZWZpbmVkIC0gYSBzdHJpbmcgZm9yIHNxbCAocmF3IHNxbClcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignUXVlcnkgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgLy8gY29udmVuaWVuY2UgZnVuY3Rpb24gdXNlZCBpbnRlcm5hbGx5XG4gIC8vIHJlYWQgYSBidW5jaCBvZiByZWxhdGlvbnNoaXBzIGFuZCBtZXJnZSB0aGVtIHRvZ2V0aGVyLlxuICByZWFkUmVsYXRpb25zaGlwcyhpdGVtOiBNb2RlbFJlZmVyZW5jZSwgcmVsYXRpb25zaGlwczogc3RyaW5nW10pIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKHJlbGF0aW9uc2hpcHMubWFwKHIgPT4gdGhpcy5yZWFkUmVsYXRpb25zaGlwKGl0ZW0sIHIpKSlcbiAgICAudGhlbihyQSA9PlxuICAgICAgckEucmVkdWNlKFxuICAgICAgICAoYSwgcikgPT4gbWVyZ2VPcHRpb25zKGEsIHIgfHwge30pLFxuICAgICAgICB7IHR5cGVOYW1lOiBpdGVtLnR5cGVOYW1lLCBpZDogaXRlbS5pZCwgYXR0cmlidXRlczoge30sIHJlbGF0aW9uc2hpcHM6IHt9IH1cbiAgICAgIClcbiAgICApO1xuICB9XG5cbiAgcmVhZChpdGVtOiBNb2RlbFJlZmVyZW5jZSwgb3B0czogc3RyaW5nIHwgc3RyaW5nW10gPSBbJ2F0dHJpYnV0ZXMnXSkge1xuICAgIGNvbnN0IHNjaGVtYSA9IHRoaXMuZ2V0U2NoZW1hKGl0ZW0udHlwZU5hbWUpO1xuICAgIGNvbnN0IGtleXMgPSAob3B0cyAmJiAhQXJyYXkuaXNBcnJheShvcHRzKSA/IFtvcHRzXSA6IG9wdHMpIGFzIHN0cmluZ1tdO1xuICAgIHJldHVybiB0aGlzLnJlYWRBdHRyaWJ1dGVzKGl0ZW0pXG4gICAgLnRoZW4oYXR0cmlidXRlcyA9PiB7XG4gICAgICBpZiAoIWF0dHJpYnV0ZXMpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoYXR0cmlidXRlcy5pZCAmJiBhdHRyaWJ1dGVzLmF0dHJpYnV0ZXMgJiYgIWF0dHJpYnV0ZXMuYXR0cmlidXRlc1tzY2hlbWEuaWRBdHRyaWJ1dGVdKSB7XG4gICAgICAgICAgYXR0cmlidXRlcy5hdHRyaWJ1dGVzW3NjaGVtYS5pZEF0dHJpYnV0ZV0gPSBhdHRyaWJ1dGVzLmlkOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVsc1dhbnRlZCA9IChrZXlzLmluZGV4T2YoJ3JlbGF0aW9uc2hpcHMnKSA+PSAwKVxuICAgICAgICAgID8gT2JqZWN0LmtleXMoc2NoZW1hLnJlbGF0aW9uc2hpcHMpXG4gICAgICAgICAgOiBrZXlzLm1hcChrID0+IGsuc3BsaXQoJy4nKSlcbiAgICAgICAgICAgIC5maWx0ZXIoa2EgPT4ga2FbMF0gPT09ICdyZWxhdGlvbnNoaXBzJylcbiAgICAgICAgICAgIC5tYXAoa2EgPT4ga2FbMV0pO1xuICAgICAgICBjb25zdCByZWxzVG9GZXRjaCA9IHJlbHNXYW50ZWQuZmlsdGVyKHJlbE5hbWUgPT4gIWF0dHJpYnV0ZXMucmVsYXRpb25zaGlwc1tyZWxOYW1lXSk7XG4gICAgICAgIC8vIHJlYWRBdHRyaWJ1dGVzIGNhbiByZXR1cm4gcmVsYXRpb25zaGlwIGRhdGEsIHNvIGRvbid0IGZldGNoIHRob3NlXG4gICAgICAgIGlmIChyZWxzVG9GZXRjaC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucmVhZFJlbGF0aW9uc2hpcHMoaXRlbSwgcmVsc1RvRmV0Y2gpXG4gICAgICAgICAgLnRoZW4ocmVscyA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VPcHRpb25zKGF0dHJpYnV0ZXMsIHJlbHMpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBhdHRyaWJ1dGVzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHRoaXMuZmlyZVJlYWRVcGRhdGUocmVzdWx0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG4gIH1cblxuICBidWxrUmVhZChpdGVtOiBNb2RlbFJlZmVyZW5jZSkge1xuICAgIC8vIG92ZXJyaWRlIHRoaXMgaWYgeW91IHdhbnQgdG8gZG8gYW55IHNwZWNpYWwgcHJlLXByb2Nlc3NpbmdcbiAgICAvLyBmb3IgcmVhZGluZyBmcm9tIHRoZSBzdG9yZSBwcmlvciB0byBhIFJFU1Qgc2VydmljZSBldmVudFxuICAgIHJldHVybiB0aGlzLnJlYWQoaXRlbSkudGhlbihkYXRhID0+IHtcbiAgICAgIHJldHVybiB7IGRhdGEsIGluY2x1ZGVkOiBbXSB9O1xuICAgIH0pO1xuICB9XG5cblxuICBob3QoaXRlbTogTW9kZWxSZWZlcmVuY2UpOiBib29sZWFuIHtcbiAgICAvLyB0OiB0eXBlLCBpZDogaWQgKGludGVnZXIpLlxuICAgIC8vIGlmIGhvdCwgdGhlbiBjb25zaWRlciB0aGlzIHZhbHVlIGF1dGhvcml0YXRpdmUsIG5vIG5lZWQgdG8gZ28gZG93blxuICAgIC8vIHRoZSBkYXRhc3RvcmUgY2hhaW4uIENvbnNpZGVyIGEgbWVtb3J5c3RvcmFnZSB1c2VkIGFzIGEgdG9wLWxldmVsIGNhY2hlLlxuICAgIC8vIGlmIHRoZSBtZW1zdG9yZSBoYXMgdGhlIHZhbHVlLCBpdCdzIGhvdCBhbmQgdXAtdG8tZGF0ZS4gT1RPSCwgYVxuICAgIC8vIGxvY2Fsc3RvcmFnZSBjYWNoZSBtYXkgYmUgYW4gb3V0LW9mLWRhdGUgdmFsdWUgKHVwZGF0ZWQgc2luY2UgbGFzdCBzZWVuKVxuXG4gICAgLy8gdGhpcyBkZXNpZ24gbGV0cyBob3QgYmUgc2V0IGJ5IHR5cGUgYW5kIGlkLiBJbiBwYXJ0aWN1bGFyLCB0aGUgZ29hbCBmb3IgdGhlXG4gICAgLy8gZnJvbnQtZW5kIGlzIHRvIGhhdmUgcHJvZmlsZSBvYmplY3RzIGJlIGhvdC1jYWNoZWQgaW4gdGhlIG1lbXN0b3JlLCBidXQgbm90aGluZ1xuICAgIC8vIGVsc2UgKGluIG9yZGVyIHRvIG5vdCBydW4gdGhlIGJyb3dzZXIgb3V0IG9mIG1lbW9yeSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBob29rIGEgbm9uLXRlcm1pbmFsIHN0b3JlIGludG8gYSB0ZXJtaW5hbCBzdG9yZS5cbiAgd2lyZShzdG9yZSwgc2h1dGRvd25TaWduYWwpIHtcbiAgICBpZiAodGhpcy50ZXJtaW5hbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3Qgd2lyZSBhIHRlcm1pbmFsIHN0b3JlIGludG8gYW5vdGhlciBzdG9yZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUT0RPOiBmaWd1cmUgb3V0IHdoZXJlIHRoZSB0eXBlIGRhdGEgY29tZXMgZnJvbS5cbiAgICAgIHN0b3JlLnJlYWQkLnRha2VVbnRpbChzaHV0ZG93blNpZ25hbCkuc3Vic2NyaWJlKCh2KSA9PiB7XG4gICAgICAgIHRoaXMuY2FjaGUodik7XG4gICAgICB9KTtcbiAgICAgIHN0b3JlLndyaXRlJC50YWtlVW50aWwoc2h1dGRvd25TaWduYWwpLnN1YnNjcmliZSgodikgPT4ge1xuICAgICAgICB2LmludmFsaWRhdGUuZm9yRWFjaCgoaW52YWxpZCkgPT4ge1xuICAgICAgICAgIHRoaXMud2lwZSh2LCBpbnZhbGlkKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICB2YWxpZGF0ZUlucHV0KHZhbHVlOiBJbmRlZmluaXRlTW9kZWxEYXRhLCBvcHRzID0ge30pIHtcbiAgICBjb25zdCB0eXBlID0gdGhpcy5nZXRTY2hlbWEodmFsdWUudHlwZU5hbWUpO1xuICAgIHJldHVybiB2YWxpZGF0ZUlucHV0KHR5cGUsIHZhbHVlKTtcbiAgfVxuXG4gIC8vIHN0b3JlIHR5cGUgaW5mbyBkYXRhIG9uIHRoZSBzdG9yZSBpdHNlbGZcblxuICBnZXRTY2hlbWEodDoge3NjaGVtYTogTW9kZWxTY2hlbWF9IHwgTW9kZWxTY2hlbWEgfCBzdHJpbmcpOiBNb2RlbFNjaGVtYSB7XG4gICAgaWYgKHR5cGVvZiB0ID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHRoaXMudHlwZXNbdF07XG4gICAgfSBlbHNlIGlmICh0WydzY2hlbWEnXSkge1xuICAgICAgcmV0dXJuICh0IGFzIHtzY2hlbWE6IE1vZGVsU2NoZW1hfSkuc2NoZW1hO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdCBhcyBNb2RlbFNjaGVtYTtcbiAgICB9XG4gIH1cblxuICBhZGRTY2hlbWEodDoge3R5cGVOYW1lOiBzdHJpbmcsIHNjaGVtYTogTW9kZWxTY2hlbWF9KSB7XG4gICAgdGhpcy50eXBlc1t0LnR5cGVOYW1lXSA9IHQuc2NoZW1hO1xuICB9XG5cbiAgYWRkVHlwZXMoYSkge1xuICAgIGEuZm9yRWFjaCh0ID0+IHRoaXMuYWRkU2NoZW1hKHQpKTtcbiAgfVxuXG5cbiAgZmlyZVdyaXRlVXBkYXRlKHZhbDogTW9kZWxEZWx0YSkge1xuICAgIHRoaXMud3JpdGVTdWJqZWN0Lm5leHQodmFsKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh2YWwpO1xuICB9XG5cbiAgZmlyZVJlYWRVcGRhdGUodmFsOiBNb2RlbERhdGEpIHtcbiAgICB0aGlzLnJlYWRTdWJqZWN0Lm5leHQodmFsKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh2YWwpO1xuICB9XG59XG4iXX0=
