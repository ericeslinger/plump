/* eslint no-unused-vars: 0 */
import * as Bluebird from 'bluebird';
import * as mergeOptions from 'merge-options';
import { validateInput } from '../util';
import { Subject } from 'rxjs/Rx';
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
        this.readSubject = new Subject();
        this.writeSubject = new Subject();
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
        return validateInput(type, value);
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
export { Storage };

//# sourceMappingURL=data:application/json;charset=utf8;base64,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LENBQUM7UUFDckMsQ0FBQztJQUNILENBQUM7SUFFRCwyQkFBUyxHQUFULFVBQVUsQ0FBcUQ7UUFDN0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUNwQyxDQUFDO0lBRUQsMEJBQVEsR0FBUixVQUFTLENBQUM7UUFBVixpQkFFQztRQURDLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxLQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFqQixDQUFpQixDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUdELGlDQUFlLEdBQWYsVUFBZ0IsR0FBMEI7UUFDeEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVELGdDQUFjLEdBQWQsVUFBZSxHQUF5QjtRQUN0QyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzQixNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBQ0gsY0FBQztBQUFELENBN0tBLEFBNktDLElBQUEiLCJmaWxlIjoic3RvcmFnZS9zdG9yYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50IG5vLXVudXNlZC12YXJzOiAwICovXG5cbmltcG9ydCAqIGFzIEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCAqIGFzIG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcbmltcG9ydCB7IHZhbGlkYXRlSW5wdXQgfSBmcm9tICcuLi91dGlsJztcbmltcG9ydCB7IFN1YmplY3QsIE9ic2VydmFibGUgfSBmcm9tICdyeGpzL1J4JztcbmltcG9ydCAqIGFzIEludGVyZmFjZXMgZnJvbSAnLi4vZGF0YVR5cGVzJztcblxuLy8gdHlwZTogYW4gb2JqZWN0IHRoYXQgZGVmaW5lcyB0aGUgdHlwZS4gdHlwaWNhbGx5IHRoaXMgd2lsbCBiZVxuLy8gcGFydCBvZiB0aGUgTW9kZWwgY2xhc3MgaGllcmFyY2h5LCBidXQgU3RvcmFnZSBvYmplY3RzIGNhbGwgbm8gbWV0aG9kc1xuLy8gb24gdGhlIHR5cGUgb2JqZWN0LiBXZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIFR5cGUuJG5hbWUsIFR5cGUuJGlkIGFuZCBUeXBlLiRzY2hlbWEuXG4vLyBOb3RlIHRoYXQgVHlwZS4kaWQgaXMgdGhlICpuYW1lIG9mIHRoZSBpZCBmaWVsZCogb24gaW5zdGFuY2VzXG4vLyAgICBhbmQgTk9UIHRoZSBhY3R1YWwgaWQgZmllbGQgKGUuZy4sIGluIG1vc3QgY2FzZXMsIFR5cGUuJGlkID09PSAnaWQnKS5cbi8vIGlkOiB1bmlxdWUgaWQuIE9mdGVuIGFuIGludGVnZXIsIGJ1dCBub3QgbmVjZXNzYXJ5IChjb3VsZCBiZSBhbiBvaWQpXG5cblxuLy8gaGFzTWFueSByZWxhdGlvbnNoaXBzIGFyZSB0cmVhdGVkIGxpa2UgaWQgYXJyYXlzLiBTbywgYWRkIC8gcmVtb3ZlIC8gaGFzXG4vLyBqdXN0IHN0b3JlcyBhbmQgcmVtb3ZlcyBpbnRlZ2Vycy5cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN0b3JhZ2Uge1xuXG4gIHRlcm1pbmFsOiBib29sZWFuO1xuICByZWFkJDogT2JzZXJ2YWJsZTxJbnRlcmZhY2VzLk1vZGVsRGF0YT47XG4gIHdyaXRlJDogT2JzZXJ2YWJsZTxJbnRlcmZhY2VzLk1vZGVsRGVsdGE+O1xuICBwcm90ZWN0ZWQgdHlwZXM6IEludGVyZmFjZXMuU3RyaW5nSW5kZXhlZDxJbnRlcmZhY2VzLk1vZGVsU2NoZW1hPiA9IHt9O1xuICBwcml2YXRlIHJlYWRTdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgcHJpdmF0ZSB3cml0ZVN1YmplY3QgPSBuZXcgU3ViamVjdCgpO1xuICAvLyBwcm90ZWN0ZWQgdHlwZXM6IE1vZGVsW107IFRPRE86IGZpZ3VyZSB0aGlzIG91dFxuXG4gIGNvbnN0cnVjdG9yKG9wdHM6IGFueSA9IHt9KSB7XG4gICAgLy8gYSBcInRlcm1pbmFsXCIgc3RvcmFnZSBmYWNpbGl0eSBpcyB0aGUgZW5kIG9mIHRoZSBzdG9yYWdlIGNoYWluLlxuICAgIC8vIHVzdWFsbHkgc3FsIG9uIHRoZSBzZXJ2ZXIgc2lkZSBhbmQgcmVzdCBvbiB0aGUgY2xpZW50IHNpZGUsIGl0ICptdXN0KlxuICAgIC8vIHJlY2VpdmUgdGhlIHdyaXRlcywgYW5kIGlzIHRoZSBmaW5hbCBhdXRob3JpdGF0aXZlIGFuc3dlciBvbiB3aGV0aGVyXG4gICAgLy8gc29tZXRoaW5nIGlzIDQwNC5cblxuICAgIC8vIHRlcm1pbmFsIGZhY2lsaXRpZXMgYXJlIGFsc28gdGhlIG9ubHkgb25lcyB0aGF0IGNhbiBhdXRob3JpdGF0aXZlbHkgYW5zd2VyXG4gICAgLy8gYXV0aG9yaXphdGlvbiBxdWVzdGlvbnMsIGJ1dCB0aGUgZGVzaWduIG1heSBhbGxvdyBmb3IgYXV0aG9yaXphdGlvbiB0byBiZVxuICAgIC8vIGNhY2hlZC5cbiAgICB0aGlzLnRlcm1pbmFsID0gb3B0cy50ZXJtaW5hbCB8fCBmYWxzZTtcbiAgICB0aGlzLnJlYWQkID0gdGhpcy5yZWFkU3ViamVjdC5hc09ic2VydmFibGUoKTtcbiAgICB0aGlzLndyaXRlJCA9IHRoaXMud3JpdGVTdWJqZWN0LmFzT2JzZXJ2YWJsZSgpO1xuICB9XG5cbiAgLy8gQWJzdHJhY3QgLSBhbGwgc3RvcmVzIG11c3QgcHJvdmlkZSBiZWxvdzpcblxuICBhYnN0cmFjdCB3cml0ZUF0dHJpYnV0ZXModmFsdWU6IEludGVyZmFjZXMuSW5kZWZpbml0ZU1vZGVsRGF0YSk6IEJsdWViaXJkPEludGVyZmFjZXMuTW9kZWxEYXRhPjtcbiAgYWJzdHJhY3QgcmVhZEF0dHJpYnV0ZXModmFsdWU6IEludGVyZmFjZXMuTW9kZWxSZWZlcmVuY2UpOiBCbHVlYmlyZDxJbnRlcmZhY2VzLk1vZGVsRGF0YT47XG4gIGFic3RyYWN0IGNhY2hlKHZhbHVlOiBJbnRlcmZhY2VzLk1vZGVsRGF0YSk6IEJsdWViaXJkPEludGVyZmFjZXMuTW9kZWxEYXRhPjtcbiAgYWJzdHJhY3QgY2FjaGVBdHRyaWJ1dGVzKHZhbHVlOiBJbnRlcmZhY2VzLk1vZGVsRGF0YSk6IEJsdWViaXJkPEludGVyZmFjZXMuTW9kZWxEYXRhPjtcbiAgYWJzdHJhY3QgY2FjaGVSZWxhdGlvbnNoaXAodmFsdWU6IEludGVyZmFjZXMuTW9kZWxEYXRhKTogQmx1ZWJpcmQ8SW50ZXJmYWNlcy5Nb2RlbERhdGE+O1xuICBhYnN0cmFjdCByZWFkUmVsYXRpb25zaGlwKHZhbHVlOiBJbnRlcmZhY2VzLk1vZGVsUmVmZXJlbmNlLCBrZXk/OiBzdHJpbmcgfCBzdHJpbmdbXSk6IEJsdWViaXJkPEludGVyZmFjZXMuTW9kZWxEYXRhPjtcbiAgYWJzdHJhY3Qgd2lwZSh2YWx1ZTogSW50ZXJmYWNlcy5Nb2RlbFJlZmVyZW5jZSwga2V5Pzogc3RyaW5nIHwgc3RyaW5nW10pOiB2b2lkO1xuICBhYnN0cmFjdCBkZWxldGUodmFsdWU6IEludGVyZmFjZXMuTW9kZWxSZWZlcmVuY2UpOiBCbHVlYmlyZDx2b2lkPjtcbiAgYWJzdHJhY3Qgd3JpdGVSZWxhdGlvbnNoaXBJdGVtKFxuICAgIHZhbHVlOiBJbnRlcmZhY2VzLk1vZGVsUmVmZXJlbmNlLFxuICAgIHJlbGF0aW9uc2hpcFRpdGxlOiBzdHJpbmcsXG4gICAgY2hpbGQ6IHtpZDogc3RyaW5nIHwgbnVtYmVyfVxuICApOiBCbHVlYmlyZDxJbnRlcmZhY2VzLk1vZGVsRGF0YT47XG4gIGFic3RyYWN0IGRlbGV0ZVJlbGF0aW9uc2hpcEl0ZW0oXG4gICAgdmFsdWU6IEludGVyZmFjZXMuTW9kZWxSZWZlcmVuY2UsXG4gICAgcmVsYXRpb25zaGlwVGl0bGU6IHN0cmluZyxcbiAgICBjaGlsZDoge2lkOiBzdHJpbmcgfCBudW1iZXJ9XG4gICk6IEJsdWViaXJkPEludGVyZmFjZXMuTW9kZWxEYXRhPjtcblxuXG4gIHF1ZXJ5KHEpIHtcbiAgICAvLyBxOiB7dHlwZTogc3RyaW5nLCBxdWVyeTogYW55fVxuICAgIC8vIHEucXVlcnkgaXMgaW1wbCBkZWZpbmVkIC0gYSBzdHJpbmcgZm9yIHNxbCAocmF3IHNxbClcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcignUXVlcnkgbm90IGltcGxlbWVudGVkJykpO1xuICB9XG5cbiAgLy8gY29udmVuaWVuY2UgZnVuY3Rpb24gdXNlZCBpbnRlcm5hbGx5XG4gIC8vIHJlYWQgYSBidW5jaCBvZiByZWxhdGlvbnNoaXBzIGFuZCBtZXJnZSB0aGVtIHRvZ2V0aGVyLlxuICByZWFkUmVsYXRpb25zaGlwcyhpdGVtOiBJbnRlcmZhY2VzLk1vZGVsUmVmZXJlbmNlLCByZWxhdGlvbnNoaXBzOiBzdHJpbmdbXSkge1xuICAgIHJldHVybiBCbHVlYmlyZC5hbGwocmVsYXRpb25zaGlwcy5tYXAociA9PiB0aGlzLnJlYWRSZWxhdGlvbnNoaXAoaXRlbSwgcikpKVxuICAgIC50aGVuKHJBID0+XG4gICAgICByQS5yZWR1Y2UoXG4gICAgICAgIChhLCByKSA9PiBtZXJnZU9wdGlvbnMoYSwgciB8fCB7fSksXG4gICAgICAgIHsgdHlwZU5hbWU6IGl0ZW0udHlwZU5hbWUsIGlkOiBpdGVtLmlkLCBhdHRyaWJ1dGVzOiB7fSwgcmVsYXRpb25zaGlwczoge30gfVxuICAgICAgKVxuICAgICk7XG4gIH1cblxuICByZWFkKGl0ZW06IEludGVyZmFjZXMuTW9kZWxSZWZlcmVuY2UsIG9wdHM6IHN0cmluZyB8IHN0cmluZ1tdID0gWydhdHRyaWJ1dGVzJ10pIHtcbiAgICBjb25zdCBzY2hlbWEgPSB0aGlzLmdldFNjaGVtYShpdGVtLnR5cGVOYW1lKTtcbiAgICBjb25zdCBrZXlzID0gKG9wdHMgJiYgIUFycmF5LmlzQXJyYXkob3B0cykgPyBbb3B0c10gOiBvcHRzKSBhcyBzdHJpbmdbXTtcbiAgICByZXR1cm4gdGhpcy5yZWFkQXR0cmlidXRlcyhpdGVtKVxuICAgIC50aGVuKGF0dHJpYnV0ZXMgPT4ge1xuICAgICAgaWYgKCFhdHRyaWJ1dGVzKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXMuaWQgJiYgYXR0cmlidXRlcy5hdHRyaWJ1dGVzICYmICFhdHRyaWJ1dGVzLmF0dHJpYnV0ZXNbc2NoZW1hLmlkQXR0cmlidXRlXSkge1xuICAgICAgICAgIGF0dHJpYnV0ZXMuYXR0cmlidXRlc1tzY2hlbWEuaWRBdHRyaWJ1dGVdID0gYXR0cmlidXRlcy5pZDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlbHNXYW50ZWQgPSAoa2V5cy5pbmRleE9mKCdyZWxhdGlvbnNoaXBzJykgPj0gMClcbiAgICAgICAgICA/IE9iamVjdC5rZXlzKHNjaGVtYS5yZWxhdGlvbnNoaXBzKVxuICAgICAgICAgIDoga2V5cy5tYXAoayA9PiBrLnNwbGl0KCcuJykpXG4gICAgICAgICAgICAuZmlsdGVyKGthID0+IGthWzBdID09PSAncmVsYXRpb25zaGlwcycpXG4gICAgICAgICAgICAubWFwKGthID0+IGthWzFdKTtcbiAgICAgICAgY29uc3QgcmVsc1RvRmV0Y2ggPSByZWxzV2FudGVkLmZpbHRlcihyZWxOYW1lID0+ICFhdHRyaWJ1dGVzLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0pO1xuICAgICAgICAvLyByZWFkQXR0cmlidXRlcyBjYW4gcmV0dXJuIHJlbGF0aW9uc2hpcCBkYXRhLCBzbyBkb24ndCBmZXRjaCB0aG9zZVxuICAgICAgICBpZiAocmVsc1RvRmV0Y2gubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnJlYWRSZWxhdGlvbnNoaXBzKGl0ZW0sIHJlbHNUb0ZldGNoKVxuICAgICAgICAgIC50aGVuKHJlbHMgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG1lcmdlT3B0aW9ucyhhdHRyaWJ1dGVzLCByZWxzKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gYXR0cmlidXRlcztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICB0aGlzLmZpcmVSZWFkVXBkYXRlKHJlc3VsdCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pO1xuICB9XG5cbiAgYnVsa1JlYWQoaXRlbTogSW50ZXJmYWNlcy5Nb2RlbFJlZmVyZW5jZSkge1xuICAgIC8vIG92ZXJyaWRlIHRoaXMgaWYgeW91IHdhbnQgdG8gZG8gYW55IHNwZWNpYWwgcHJlLXByb2Nlc3NpbmdcbiAgICAvLyBmb3IgcmVhZGluZyBmcm9tIHRoZSBzdG9yZSBwcmlvciB0byBhIFJFU1Qgc2VydmljZSBldmVudFxuICAgIHJldHVybiB0aGlzLnJlYWQoaXRlbSkudGhlbihkYXRhID0+IHtcbiAgICAgIHJldHVybiB7IGRhdGEsIGluY2x1ZGVkOiBbXSB9O1xuICAgIH0pO1xuICB9XG5cblxuICBob3QoaXRlbTogSW50ZXJmYWNlcy5Nb2RlbFJlZmVyZW5jZSk6IGJvb2xlYW4ge1xuICAgIC8vIHQ6IHR5cGUsIGlkOiBpZCAoaW50ZWdlcikuXG4gICAgLy8gaWYgaG90LCB0aGVuIGNvbnNpZGVyIHRoaXMgdmFsdWUgYXV0aG9yaXRhdGl2ZSwgbm8gbmVlZCB0byBnbyBkb3duXG4gICAgLy8gdGhlIGRhdGFzdG9yZSBjaGFpbi4gQ29uc2lkZXIgYSBtZW1vcnlzdG9yYWdlIHVzZWQgYXMgYSB0b3AtbGV2ZWwgY2FjaGUuXG4gICAgLy8gaWYgdGhlIG1lbXN0b3JlIGhhcyB0aGUgdmFsdWUsIGl0J3MgaG90IGFuZCB1cC10by1kYXRlLiBPVE9ILCBhXG4gICAgLy8gbG9jYWxzdG9yYWdlIGNhY2hlIG1heSBiZSBhbiBvdXQtb2YtZGF0ZSB2YWx1ZSAodXBkYXRlZCBzaW5jZSBsYXN0IHNlZW4pXG5cbiAgICAvLyB0aGlzIGRlc2lnbiBsZXRzIGhvdCBiZSBzZXQgYnkgdHlwZSBhbmQgaWQuIEluIHBhcnRpY3VsYXIsIHRoZSBnb2FsIGZvciB0aGVcbiAgICAvLyBmcm9udC1lbmQgaXMgdG8gaGF2ZSBwcm9maWxlIG9iamVjdHMgYmUgaG90LWNhY2hlZCBpbiB0aGUgbWVtc3RvcmUsIGJ1dCBub3RoaW5nXG4gICAgLy8gZWxzZSAoaW4gb3JkZXIgdG8gbm90IHJ1biB0aGUgYnJvd3NlciBvdXQgb2YgbWVtb3J5KVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIGhvb2sgYSBub24tdGVybWluYWwgc3RvcmUgaW50byBhIHRlcm1pbmFsIHN0b3JlLlxuICB3aXJlKHN0b3JlLCBzaHV0ZG93blNpZ25hbCkge1xuICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCB3aXJlIGEgdGVybWluYWwgc3RvcmUgaW50byBhbm90aGVyIHN0b3JlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRPRE86IGZpZ3VyZSBvdXQgd2hlcmUgdGhlIHR5cGUgZGF0YSBjb21lcyBmcm9tLlxuICAgICAgc3RvcmUucmVhZCQudGFrZVVudGlsKHNodXRkb3duU2lnbmFsKS5zdWJzY3JpYmUoKHYpID0+IHtcbiAgICAgICAgdGhpcy5jYWNoZSh2KTtcbiAgICAgIH0pO1xuICAgICAgc3RvcmUud3JpdGUkLnRha2VVbnRpbChzaHV0ZG93blNpZ25hbCkuc3Vic2NyaWJlKCh2KSA9PiB7XG4gICAgICAgIHYuaW52YWxpZGF0ZS5mb3JFYWNoKChpbnZhbGlkKSA9PiB7XG4gICAgICAgICAgdGhpcy53aXBlKHYsIGludmFsaWQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHZhbGlkYXRlSW5wdXQodmFsdWU6IEludGVyZmFjZXMuSW5kZWZpbml0ZU1vZGVsRGF0YSwgb3B0cyA9IHt9KSB7XG4gICAgY29uc3QgdHlwZSA9IHRoaXMuZ2V0U2NoZW1hKHZhbHVlLnR5cGVOYW1lKTtcbiAgICByZXR1cm4gdmFsaWRhdGVJbnB1dCh0eXBlLCB2YWx1ZSk7XG4gIH1cblxuICAvLyBzdG9yZSB0eXBlIGluZm8gZGF0YSBvbiB0aGUgc3RvcmUgaXRzZWxmXG5cbiAgZ2V0U2NoZW1hKHQ6IHtzY2hlbWE6IEludGVyZmFjZXMuTW9kZWxTY2hlbWF9IHwgSW50ZXJmYWNlcy5Nb2RlbFNjaGVtYSB8IHN0cmluZyk6IEludGVyZmFjZXMuTW9kZWxTY2hlbWEge1xuICAgIGlmICh0eXBlb2YgdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiB0aGlzLnR5cGVzW3RdO1xuICAgIH0gZWxzZSBpZiAodFsnc2NoZW1hJ10pIHtcbiAgICAgIHJldHVybiAodCBhcyB7c2NoZW1hOiBJbnRlcmZhY2VzLk1vZGVsU2NoZW1hfSkuc2NoZW1hO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdCBhcyBJbnRlcmZhY2VzLk1vZGVsU2NoZW1hO1xuICAgIH1cbiAgfVxuXG4gIGFkZFNjaGVtYSh0OiB7dHlwZU5hbWU6IHN0cmluZywgc2NoZW1hOiBJbnRlcmZhY2VzLk1vZGVsU2NoZW1hfSkge1xuICAgIHRoaXMudHlwZXNbdC50eXBlTmFtZV0gPSB0LnNjaGVtYTtcbiAgfVxuXG4gIGFkZFR5cGVzKGEpIHtcbiAgICBhLmZvckVhY2godCA9PiB0aGlzLmFkZFNjaGVtYSh0KSk7XG4gIH1cblxuXG4gIGZpcmVXcml0ZVVwZGF0ZSh2YWw6IEludGVyZmFjZXMuTW9kZWxEZWx0YSkge1xuICAgIHRoaXMud3JpdGVTdWJqZWN0Lm5leHQodmFsKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh2YWwpO1xuICB9XG5cbiAgZmlyZVJlYWRVcGRhdGUodmFsOiBJbnRlcmZhY2VzLk1vZGVsRGF0YSkge1xuICAgIHRoaXMucmVhZFN1YmplY3QubmV4dCh2YWwpO1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHZhbCk7XG4gIH1cbn1cbiJdfQ==
