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
        this.readSubject = new Subject();
        this.writeSubject = new Subject();
        this.types = {};
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
            return rA.reduce(function (a, r) { return mergeOptions(a, r || {}); }, { type: item.type, id: item.id, attributes: {}, relationships: {} });
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
                    attributes.attributes[type.$id] = attributes.id; // eslint-disable-line no-param-reassign
                }
                var relsWanted = (keys.indexOf('relationships') >= 0)
                    ? Object.keys(type.$schema.relationships)
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
            debugger;
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
        return validateInput(type, value);
    };
    // store type info data on the store itself
    Storage.prototype.getType = function (t) {
        if (typeof t === 'string') {
            return this.types[t];
        }
        else {
            return t;
        }
    };
    Storage.prototype.addType = function (t) {
        this.types[t.type] = t;
    };
    Storage.prototype.addTypes = function (a) {
        var _this = this;
        a.forEach(function (t) { return _this.addType(t); });
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFFRCwwQkFBUSxHQUFSLFVBQVMsQ0FBQztRQUFWLGlCQUVDO1FBREMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLEtBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQWYsQ0FBZSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUdELGlDQUFlLEdBQWYsVUFBZ0IsR0FBa0Q7UUFDaEUsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVELGdDQUFjLEdBQWQsVUFBZSxHQUF5QjtRQUN0QyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzQixNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBQ0gsY0FBQztBQUFELENBbEtBLEFBa0tDLElBQUEiLCJmaWxlIjoic3RvcmFnZS9zdG9yYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50IG5vLXVudXNlZC12YXJzOiAwICovXG5cbmltcG9ydCAqIGFzIEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCAqIGFzIG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcbmltcG9ydCB7IHZhbGlkYXRlSW5wdXQgfSBmcm9tICcuLi91dGlsJztcbmltcG9ydCB7IFN1YmplY3QsIE9ic2VydmFibGUgfSBmcm9tICdyeGpzL1J4JztcbmltcG9ydCB7IEludGVyZmFjZXMgfSBmcm9tICcuLi9kYXRhVHlwZXMnO1xuXG4vLyB0eXBlOiBhbiBvYmplY3QgdGhhdCBkZWZpbmVzIHRoZSB0eXBlLiB0eXBpY2FsbHkgdGhpcyB3aWxsIGJlXG4vLyBwYXJ0IG9mIHRoZSBNb2RlbCBjbGFzcyBoaWVyYXJjaHksIGJ1dCBTdG9yYWdlIG9iamVjdHMgY2FsbCBubyBtZXRob2RzXG4vLyBvbiB0aGUgdHlwZSBvYmplY3QuIFdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gVHlwZS4kbmFtZSwgVHlwZS4kaWQgYW5kIFR5cGUuJHNjaGVtYS5cbi8vIE5vdGUgdGhhdCBUeXBlLiRpZCBpcyB0aGUgKm5hbWUgb2YgdGhlIGlkIGZpZWxkKiBvbiBpbnN0YW5jZXNcbi8vICAgIGFuZCBOT1QgdGhlIGFjdHVhbCBpZCBmaWVsZCAoZS5nLiwgaW4gbW9zdCBjYXNlcywgVHlwZS4kaWQgPT09ICdpZCcpLlxuLy8gaWQ6IHVuaXF1ZSBpZC4gT2Z0ZW4gYW4gaW50ZWdlciwgYnV0IG5vdCBuZWNlc3NhcnkgKGNvdWxkIGJlIGFuIG9pZClcblxuXG4vLyBoYXNNYW55IHJlbGF0aW9uc2hpcHMgYXJlIHRyZWF0ZWQgbGlrZSBpZCBhcnJheXMuIFNvLCBhZGQgLyByZW1vdmUgLyBoYXNcbi8vIGp1c3Qgc3RvcmVzIGFuZCByZW1vdmVzIGludGVnZXJzLlxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU3RvcmFnZSB7XG5cbiAgdGVybWluYWw6IGJvb2xlYW47XG4gIHJlYWQkOiBPYnNlcnZhYmxlPEludGVyZmFjZXMuTW9kZWxEYXRhPjtcbiAgd3JpdGUkOiBPYnNlcnZhYmxlPEludGVyZmFjZXMuTW9kZWxEZWx0YT47XG4gIHByaXZhdGUgcmVhZFN1YmplY3QgPSBuZXcgU3ViamVjdCgpO1xuICBwcml2YXRlIHdyaXRlU3ViamVjdCA9IG5ldyBTdWJqZWN0KCk7XG4gIHByb3RlY3RlZCB0eXBlczogSW50ZXJmYWNlcy5TdHJpbmdJbmRleGVkPHskc2NoZW1hOiBJbnRlcmZhY2VzLk1vZGVsU2NoZW1hLCB0eXBlOiBzdHJpbmd9PiA9IHt9O1xuICAvLyBwcm90ZWN0ZWQgdHlwZXM6IE1vZGVsW107IFRPRE86IGZpZ3VyZSB0aGlzIG91dFxuXG4gIGNvbnN0cnVjdG9yKG9wdHM6YW55ID0ge30pIHtcbiAgICAvLyBhIFwidGVybWluYWxcIiBzdG9yYWdlIGZhY2lsaXR5IGlzIHRoZSBlbmQgb2YgdGhlIHN0b3JhZ2UgY2hhaW4uXG4gICAgLy8gdXN1YWxseSBzcWwgb24gdGhlIHNlcnZlciBzaWRlIGFuZCByZXN0IG9uIHRoZSBjbGllbnQgc2lkZSwgaXQgKm11c3QqXG4gICAgLy8gcmVjZWl2ZSB0aGUgd3JpdGVzLCBhbmQgaXMgdGhlIGZpbmFsIGF1dGhvcml0YXRpdmUgYW5zd2VyIG9uIHdoZXRoZXJcbiAgICAvLyBzb21ldGhpbmcgaXMgNDA0LlxuXG4gICAgLy8gdGVybWluYWwgZmFjaWxpdGllcyBhcmUgYWxzbyB0aGUgb25seSBvbmVzIHRoYXQgY2FuIGF1dGhvcml0YXRpdmVseSBhbnN3ZXJcbiAgICAvLyBhdXRob3JpemF0aW9uIHF1ZXN0aW9ucywgYnV0IHRoZSBkZXNpZ24gbWF5IGFsbG93IGZvciBhdXRob3JpemF0aW9uIHRvIGJlXG4gICAgLy8gY2FjaGVkLlxuICAgIHRoaXMudGVybWluYWwgPSBvcHRzLnRlcm1pbmFsIHx8IGZhbHNlO1xuICAgIHRoaXMucmVhZCQgPSB0aGlzLnJlYWRTdWJqZWN0LmFzT2JzZXJ2YWJsZSgpO1xuICAgIHRoaXMud3JpdGUkID0gdGhpcy53cml0ZVN1YmplY3QuYXNPYnNlcnZhYmxlKCk7XG4gIH1cblxuICAvLyBBYnN0cmFjdCAtIGFsbCBzdG9yZXMgbXVzdCBwcm92aWRlIGJlbG93OlxuXG4gIGFic3RyYWN0IHdyaXRlQXR0cmlidXRlcyh2YWx1ZTogSW50ZXJmYWNlcy5Nb2RlbERhdGEpOiBCbHVlYmlyZDxJbnRlcmZhY2VzLk1vZGVsRGF0YT47XG4gIGFic3RyYWN0IHJlYWRBdHRyaWJ1dGVzKHZhbHVlOiBJbnRlcmZhY2VzLk1vZGVsUmVmZXJlbmNlKTogQmx1ZWJpcmQ8SW50ZXJmYWNlcy5Nb2RlbERhdGE+O1xuICBhYnN0cmFjdCBjYWNoZSh2YWx1ZTogSW50ZXJmYWNlcy5Nb2RlbERhdGEpOiBCbHVlYmlyZDxJbnRlcmZhY2VzLk1vZGVsRGF0YT47XG4gIGFic3RyYWN0IGNhY2hlQXR0cmlidXRlcyh2YWx1ZTogSW50ZXJmYWNlcy5Nb2RlbERhdGEpOiBCbHVlYmlyZDxJbnRlcmZhY2VzLk1vZGVsRGF0YT47XG4gIGFic3RyYWN0IGNhY2hlUmVsYXRpb25zaGlwKHZhbHVlOiBJbnRlcmZhY2VzLk1vZGVsRGF0YSk6IEJsdWViaXJkPEludGVyZmFjZXMuTW9kZWxEYXRhPjtcbiAgYWJzdHJhY3QgcmVhZFJlbGF0aW9uc2hpcCh2YWx1ZTogSW50ZXJmYWNlcy5Nb2RlbFJlZmVyZW5jZSwga2V5Pzogc3RyaW5nIHwgc3RyaW5nW10pOiBCbHVlYmlyZDxJbnRlcmZhY2VzLk1vZGVsRGF0YT47XG4gIGFic3RyYWN0IHdpcGUodmFsdWU6IEludGVyZmFjZXMuTW9kZWxSZWZlcmVuY2UsIGtleT86IHN0cmluZyB8IHN0cmluZ1tdKTogdm9pZDtcbiAgYWJzdHJhY3QgZGVsZXRlKHZhbHVlOiBJbnRlcmZhY2VzLk1vZGVsUmVmZXJlbmNlKTogdm9pZDtcbiAgYWJzdHJhY3Qgd3JpdGVSZWxhdGlvbnNoaXBJdGVtKHZhbHVlOiBJbnRlcmZhY2VzLk1vZGVsUmVmZXJlbmNlLCByZWxhdGlvbnNoaXBUaXRsZTogc3RyaW5nLCBjaGlsZDoge2lkOiBzdHJpbmcgfCBudW1iZXJ9KTogQmx1ZWJpcmQ8SW50ZXJmYWNlcy5Nb2RlbERhdGE+O1xuICBhYnN0cmFjdCBkZWxldGVSZWxhdGlvbnNoaXBJdGVtKHZhbHVlOiBJbnRlcmZhY2VzLk1vZGVsUmVmZXJlbmNlLCByZWxhdGlvbnNoaXBUaXRsZTogc3RyaW5nLCBjaGlsZDoge2lkOiBzdHJpbmcgfCBudW1iZXJ9KTogQmx1ZWJpcmQ8SW50ZXJmYWNlcy5Nb2RlbERhdGE+O1xuICBxdWVyeShxKSB7XG4gICAgLy8gcToge3R5cGU6IHN0cmluZywgcXVlcnk6IGFueX1cbiAgICAvLyBxLnF1ZXJ5IGlzIGltcGwgZGVmaW5lZCAtIGEgc3RyaW5nIGZvciBzcWwgKHJhdyBzcWwpXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoJ1F1ZXJ5IG5vdCBpbXBsZW1lbnRlZCcpKTtcbiAgfVxuXG4gIC8vIGNvbnZlbmllbmNlIGZ1bmN0aW9uIHVzZWQgaW50ZXJuYWxseVxuICAvLyByZWFkIGEgYnVuY2ggb2YgcmVsYXRpb25zaGlwcyBhbmQgbWVyZ2UgdGhlbSB0b2dldGhlci5cbiAgcmVhZFJlbGF0aW9uc2hpcHMoaXRlbTogSW50ZXJmYWNlcy5Nb2RlbFJlZmVyZW5jZSwgcmVsYXRpb25zaGlwczogc3RyaW5nW10pIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKHJlbGF0aW9uc2hpcHMubWFwKHIgPT4gdGhpcy5yZWFkUmVsYXRpb25zaGlwKGl0ZW0sIHIpKSlcbiAgICAudGhlbihyQSA9PlxuICAgICAgckEucmVkdWNlKFxuICAgICAgICAoYSwgcikgPT4gbWVyZ2VPcHRpb25zKGEsIHIgfHwge30pLFxuICAgICAgICB7IHR5cGU6IGl0ZW0udHlwZSwgaWQ6IGl0ZW0uaWQsIGF0dHJpYnV0ZXM6IHt9LCByZWxhdGlvbnNoaXBzOiB7fSB9XG4gICAgICApXG4gICAgKTtcbiAgfVxuXG4gIHJlYWQoaXRlbTogSW50ZXJmYWNlcy5Nb2RlbFJlZmVyZW5jZSwgb3B0czogc3RyaW5nIHwgc3RyaW5nW10gPSBbJ2F0dHJpYnV0ZXMnXSkge1xuICAgIGNvbnN0IHR5cGUgPSB0aGlzLmdldFR5cGUoaXRlbS50eXBlKTtcbiAgICBjb25zdCBrZXlzID0gKG9wdHMgJiYgIUFycmF5LmlzQXJyYXkob3B0cykgPyBbb3B0c10gOiBvcHRzKSBhcyBzdHJpbmdbXTtcbiAgICByZXR1cm4gdGhpcy5yZWFkQXR0cmlidXRlcyhpdGVtKVxuICAgIC50aGVuKGF0dHJpYnV0ZXMgPT4ge1xuICAgICAgaWYgKCFhdHRyaWJ1dGVzKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXMuaWQgJiYgYXR0cmlidXRlcy5hdHRyaWJ1dGVzICYmICFhdHRyaWJ1dGVzLmF0dHJpYnV0ZXNbdHlwZS4kaWRdKSB7XG4gICAgICAgICAgYXR0cmlidXRlcy5hdHRyaWJ1dGVzW3R5cGUuJGlkXSA9IGF0dHJpYnV0ZXMuaWQ7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZWxzV2FudGVkID0gKGtleXMuaW5kZXhPZigncmVsYXRpb25zaGlwcycpID49IDApXG4gICAgICAgICAgPyBPYmplY3Qua2V5cyh0eXBlLiRzY2hlbWEucmVsYXRpb25zaGlwcylcbiAgICAgICAgICA6IGtleXMubWFwKGsgPT4gay5zcGxpdCgnLicpKVxuICAgICAgICAgICAgLmZpbHRlcihrYSA9PiBrYVswXSA9PT0gJ3JlbGF0aW9uc2hpcHMnKVxuICAgICAgICAgICAgLm1hcChrYSA9PiBrYVsxXSk7XG4gICAgICAgIGNvbnN0IHJlbHNUb0ZldGNoID0gcmVsc1dhbnRlZC5maWx0ZXIocmVsTmFtZSA9PiAhYXR0cmlidXRlcy5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdKTtcbiAgICAgICAgLy8gcmVhZEF0dHJpYnV0ZXMgY2FuIHJldHVybiByZWxhdGlvbnNoaXAgZGF0YSwgc28gZG9uJ3QgZmV0Y2ggdGhvc2VcbiAgICAgICAgaWYgKHJlbHNUb0ZldGNoLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yZWFkUmVsYXRpb25zaGlwcyhpdGVtLCByZWxzVG9GZXRjaClcbiAgICAgICAgICAudGhlbihyZWxzID0+IHtcbiAgICAgICAgICAgIHJldHVybiBtZXJnZU9wdGlvbnMoYXR0cmlidXRlcywgcmVscyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgdGhpcy5maXJlUmVhZFVwZGF0ZShyZXN1bHQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcbiAgfVxuXG4gIGJ1bGtSZWFkKGl0ZW06IEludGVyZmFjZXMuTW9kZWxSZWZlcmVuY2UpIHtcbiAgICAvLyBvdmVycmlkZSB0aGlzIGlmIHlvdSB3YW50IHRvIGRvIGFueSBzcGVjaWFsIHByZS1wcm9jZXNzaW5nXG4gICAgLy8gZm9yIHJlYWRpbmcgZnJvbSB0aGUgc3RvcmUgcHJpb3IgdG8gYSBSRVNUIHNlcnZpY2UgZXZlbnRcbiAgICByZXR1cm4gdGhpcy5yZWFkKGl0ZW0pLnRoZW4oZGF0YSA9PiB7XG4gICAgICByZXR1cm4geyBkYXRhLCBpbmNsdWRlZDogW10gfTtcbiAgICB9KTtcbiAgfVxuXG5cbiAgaG90KGl0ZW06IEludGVyZmFjZXMuTW9kZWxSZWZlcmVuY2UpIDogYm9vbGVhbiB7XG4gICAgLy8gdDogdHlwZSwgaWQ6IGlkIChpbnRlZ2VyKS5cbiAgICAvLyBpZiBob3QsIHRoZW4gY29uc2lkZXIgdGhpcyB2YWx1ZSBhdXRob3JpdGF0aXZlLCBubyBuZWVkIHRvIGdvIGRvd25cbiAgICAvLyB0aGUgZGF0YXN0b3JlIGNoYWluLiBDb25zaWRlciBhIG1lbW9yeXN0b3JhZ2UgdXNlZCBhcyBhIHRvcC1sZXZlbCBjYWNoZS5cbiAgICAvLyBpZiB0aGUgbWVtc3RvcmUgaGFzIHRoZSB2YWx1ZSwgaXQncyBob3QgYW5kIHVwLXRvLWRhdGUuIE9UT0gsIGFcbiAgICAvLyBsb2NhbHN0b3JhZ2UgY2FjaGUgbWF5IGJlIGFuIG91dC1vZi1kYXRlIHZhbHVlICh1cGRhdGVkIHNpbmNlIGxhc3Qgc2VlbilcblxuICAgIC8vIHRoaXMgZGVzaWduIGxldHMgaG90IGJlIHNldCBieSB0eXBlIGFuZCBpZC4gSW4gcGFydGljdWxhciwgdGhlIGdvYWwgZm9yIHRoZVxuICAgIC8vIGZyb250LWVuZCBpcyB0byBoYXZlIHByb2ZpbGUgb2JqZWN0cyBiZSBob3QtY2FjaGVkIGluIHRoZSBtZW1zdG9yZSwgYnV0IG5vdGhpbmdcbiAgICAvLyBlbHNlIChpbiBvcmRlciB0byBub3QgcnVuIHRoZSBicm93c2VyIG91dCBvZiBtZW1vcnkpXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gaG9vayBhIG5vbi10ZXJtaW5hbCBzdG9yZSBpbnRvIGEgdGVybWluYWwgc3RvcmUuXG4gIHdpcmUoc3RvcmUsIHNodXRkb3duU2lnbmFsKSB7XG4gICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHdpcmUgYSB0ZXJtaW5hbCBzdG9yZSBpbnRvIGFub3RoZXIgc3RvcmUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVE9ETzogZmlndXJlIG91dCB3aGVyZSB0aGUgdHlwZSBkYXRhIGNvbWVzIGZyb20uXG4gICAgICBkZWJ1Z2dlcjtcbiAgICAgIHN0b3JlLnJlYWQkLnRha2VVbnRpbChzaHV0ZG93blNpZ25hbCkuc3Vic2NyaWJlKCh2KSA9PiB7XG4gICAgICAgIHRoaXMuY2FjaGUodik7XG4gICAgICB9KTtcbiAgICAgIHN0b3JlLndyaXRlJC50YWtlVW50aWwoc2h1dGRvd25TaWduYWwpLnN1YnNjcmliZSgodikgPT4ge1xuICAgICAgICB2LmludmFsaWRhdGUuZm9yRWFjaCgoaW52YWxpZCkgPT4ge1xuICAgICAgICAgIHRoaXMud2lwZSh2LCBpbnZhbGlkKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICB2YWxpZGF0ZUlucHV0KHZhbHVlLCBvcHRzID0ge30pIHtcbiAgICBjb25zdCB0eXBlID0gdGhpcy5nZXRUeXBlKHZhbHVlLnR5cGUpO1xuICAgIHJldHVybiB2YWxpZGF0ZUlucHV0KHR5cGUsIHZhbHVlKTtcbiAgfVxuXG4gIC8vIHN0b3JlIHR5cGUgaW5mbyBkYXRhIG9uIHRoZSBzdG9yZSBpdHNlbGZcblxuICBnZXRUeXBlKHQpIHtcbiAgICBpZiAodHlwZW9mIHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gdGhpcy50eXBlc1t0XTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHQ7XG4gICAgfVxuICB9XG5cbiAgYWRkVHlwZSh0KSB7XG4gICAgdGhpcy50eXBlc1t0LnR5cGVdID0gdDtcbiAgfVxuXG4gIGFkZFR5cGVzKGEpIHtcbiAgICBhLmZvckVhY2godCA9PiB0aGlzLmFkZFR5cGUodCkpO1xuICB9XG5cblxuICBmaXJlV3JpdGVVcGRhdGUodmFsOiBJbnRlcmZhY2VzLk1vZGVsRGF0YSAmIHtpbnZhbGlkYXRlOiBzdHJpbmdbXX0pIHtcbiAgICB0aGlzLndyaXRlU3ViamVjdC5uZXh0KHZhbCk7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUodmFsKTtcbiAgfVxuXG4gIGZpcmVSZWFkVXBkYXRlKHZhbDogSW50ZXJmYWNlcy5Nb2RlbERhdGEpIHtcbiAgICB0aGlzLnJlYWRTdWJqZWN0Lm5leHQodmFsKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh2YWwpO1xuICB9XG59XG4iXX0=
