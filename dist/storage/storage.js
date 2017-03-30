/* eslint no-unused-vars: 0 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mergeOptions = require("merge-options");
// import { validateInput } from '../util';
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
    // abstract delete(value: ModelReference): Promise<void>;
    // abstract writeRelationshipItem( value: ModelReference, relName: string, child: {id: string | number} ): Promise<ModelData>;
    // abstract deleteRelationshipItem( value: ModelReference, relName: string, child: {id: string | number} ): Promise<ModelData>;
    //
    //
    // query(q: any): Promise<ModelReference[]> {
    //   // q: {type: string, query: any}
    //   // q.query is impl defined - a string for sql (raw sql)
    //   return Promise.reject(new Error('Query not implemented'));
    // }
    //
    // convenience function used internally
    // read a bunch of relationships and merge them together.
    Storage.prototype.readRelationships = function (item, relationships) {
        var _this = this;
        return Promise.all(relationships.map(function (r) { return _this.readRelationship(item, r); }))
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
    Storage.prototype.validateInput = function (value) {
        var schema = this.getSchema(value.typeName);
        var retVal = { typeName: value.typeName, id: value.id, attributes: {}, relationships: {} };
        var typeAttrs = Object.keys(schema.attributes || {});
        var valAttrs = Object.keys(value.attributes || {});
        var typeRels = Object.keys(schema.relationships || {});
        var valRels = Object.keys(value.relationships || {});
        var invalidAttrs = valAttrs.filter(function (item) { return typeAttrs.indexOf(item) < 0; });
        var invalidRels = valRels.filter(function (item) { return typeRels.indexOf(item) < 0; });
        if (invalidAttrs.length > 0) {
            throw new Error("Invalid attributes on value object: " + JSON.stringify(invalidAttrs));
        }
        if (invalidRels.length > 0) {
            throw new Error("Invalid relationships on value object: " + JSON.stringify(invalidRels));
        }
        for (var attrName in schema.attributes) {
            if (!value.attributes[attrName] && (schema.attributes[attrName].default !== undefined)) {
                if (Array.isArray(schema.attributes[attrName].default)) {
                    retVal.attributes[attrName] = schema.attributes[attrName].default.concat();
                }
                else if (typeof schema.attributes[attrName].default === 'object') {
                    retVal.attributes[attrName] = Object.assign({}, schema.attributes[attrName].default);
                }
                else {
                    retVal.attributes[attrName] = schema.attributes[attrName].default;
                }
            }
        }
        for (var relName in schema.relationships) {
            if (value.relationships && value.relationships[relName] && !Array.isArray(value.relationships[relName])) {
                throw new Error("relation " + relName + " is not an array");
            }
        }
        return mergeOptions({}, value, retVal);
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
        return Promise.resolve();
    };
    Storage.prototype.addSchemas = function (a) {
        var _this = this;
        return Promise.all(a.map(function (t) { return _this.addSchema(t); })).then(function () { });
    };
    Storage.prototype.fireWriteUpdate = function (val) {
        this.writeSubject.next(val);
        return Promise.resolve(val);
    };
    Storage.prototype.fireReadUpdate = function (val) {
        this.readSubject.next(val);
        return Promise.resolve(val);
    };
    return Storage;
}());
exports.Storage = Storage;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM1QixNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBRUQsZ0NBQWMsR0FBZCxVQUFlLEdBQWM7UUFDM0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUNILGNBQUM7QUFBRCxDQXZMQSxBQXVMQyxJQUFBO0FBdkxxQiwwQkFBTyIsImZpbGUiOiJzdG9yYWdlL3N0b3JhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQgbm8tdW51c2VkLXZhcnM6IDAgKi9cblxuaW1wb3J0ICogYXMgbWVyZ2VPcHRpb25zIGZyb20gJ21lcmdlLW9wdGlvbnMnO1xuLy8gaW1wb3J0IHsgdmFsaWRhdGVJbnB1dCB9IGZyb20gJy4uL3V0aWwnO1xuaW1wb3J0IHsgU3ViamVjdCwgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMvUngnO1xuaW1wb3J0IHtcbiAgSW5kZWZpbml0ZU1vZGVsRGF0YSxcbiAgTW9kZWxEYXRhLFxuICBNb2RlbERlbHRhLFxuICBNb2RlbFNjaGVtYSxcbiAgTW9kZWxSZWZlcmVuY2UsXG4gIEJhc2VTdG9yZSxcbiAgU3RvcmFnZU9wdGlvbnMsXG4gIFBhY2thZ2VkTW9kZWxEYXRhLFxuICAvLyBSZWxhdGlvbnNoaXBJdGVtLFxufSBmcm9tICcuLi9kYXRhVHlwZXMnO1xuXG4vLyB0eXBlOiBhbiBvYmplY3QgdGhhdCBkZWZpbmVzIHRoZSB0eXBlLiB0eXBpY2FsbHkgdGhpcyB3aWxsIGJlXG4vLyBwYXJ0IG9mIHRoZSBNb2RlbCBjbGFzcyBoaWVyYXJjaHksIGJ1dCBTdG9yYWdlIG9iamVjdHMgY2FsbCBubyBtZXRob2RzXG4vLyBvbiB0aGUgdHlwZSBvYmplY3QuIFdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gVHlwZS4kbmFtZSwgVHlwZS4kaWQgYW5kIFR5cGUuJHNjaGVtYS5cbi8vIE5vdGUgdGhhdCBUeXBlLiRpZCBpcyB0aGUgKm5hbWUgb2YgdGhlIGlkIGZpZWxkKiBvbiBpbnN0YW5jZXNcbi8vICAgIGFuZCBOT1QgdGhlIGFjdHVhbCBpZCBmaWVsZCAoZS5nLiwgaW4gbW9zdCBjYXNlcywgVHlwZS4kaWQgPT09ICdpZCcpLlxuLy8gaWQ6IHVuaXF1ZSBpZC4gT2Z0ZW4gYW4gaW50ZWdlciwgYnV0IG5vdCBuZWNlc3NhcnkgKGNvdWxkIGJlIGFuIG9pZClcblxuXG4vLyBoYXNNYW55IHJlbGF0aW9uc2hpcHMgYXJlIHRyZWF0ZWQgbGlrZSBpZCBhcnJheXMuIFNvLCBhZGQgLyByZW1vdmUgLyBoYXNcbi8vIGp1c3Qgc3RvcmVzIGFuZCByZW1vdmVzIGludGVnZXJzLlxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU3RvcmFnZSBpbXBsZW1lbnRzIEJhc2VTdG9yZSB7XG5cbiAgdGVybWluYWw6IGJvb2xlYW47XG4gIHJlYWQkOiBPYnNlcnZhYmxlPE1vZGVsRGF0YT47XG4gIHdyaXRlJDogT2JzZXJ2YWJsZTxNb2RlbERlbHRhPjtcbiAgcHJvdGVjdGVkIHR5cGVzOiB7IFt0eXBlOiBzdHJpbmddOiBNb2RlbFNjaGVtYX0gPSB7fTtcbiAgcHJpdmF0ZSByZWFkU3ViamVjdCA9IG5ldyBTdWJqZWN0KCk7XG4gIHByaXZhdGUgd3JpdGVTdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgLy8gcHJvdGVjdGVkIHR5cGVzOiBNb2RlbFtdOyBUT0RPOiBmaWd1cmUgdGhpcyBvdXRcblxuICBjb25zdHJ1Y3RvcihvcHRzOiBTdG9yYWdlT3B0aW9ucyA9IHt9KSB7XG4gICAgLy8gYSBcInRlcm1pbmFsXCIgc3RvcmFnZSBmYWNpbGl0eSBpcyB0aGUgZW5kIG9mIHRoZSBzdG9yYWdlIGNoYWluLlxuICAgIC8vIHVzdWFsbHkgc3FsIG9uIHRoZSBzZXJ2ZXIgc2lkZSBhbmQgcmVzdCBvbiB0aGUgY2xpZW50IHNpZGUsIGl0ICptdXN0KlxuICAgIC8vIHJlY2VpdmUgdGhlIHdyaXRlcywgYW5kIGlzIHRoZSBmaW5hbCBhdXRob3JpdGF0aXZlIGFuc3dlciBvbiB3aGV0aGVyXG4gICAgLy8gc29tZXRoaW5nIGlzIDQwNC5cblxuICAgIC8vIHRlcm1pbmFsIGZhY2lsaXRpZXMgYXJlIGFsc28gdGhlIG9ubHkgb25lcyB0aGF0IGNhbiBhdXRob3JpdGF0aXZlbHkgYW5zd2VyXG4gICAgLy8gYXV0aG9yaXphdGlvbiBxdWVzdGlvbnMsIGJ1dCB0aGUgZGVzaWduIG1heSBhbGxvdyBmb3IgYXV0aG9yaXphdGlvbiB0byBiZVxuICAgIC8vIGNhY2hlZC5cbiAgICB0aGlzLnRlcm1pbmFsID0gb3B0cy50ZXJtaW5hbCB8fCBmYWxzZTtcbiAgICB0aGlzLnJlYWQkID0gdGhpcy5yZWFkU3ViamVjdC5hc09ic2VydmFibGUoKTtcbiAgICB0aGlzLndyaXRlJCA9IHRoaXMud3JpdGVTdWJqZWN0LmFzT2JzZXJ2YWJsZSgpO1xuICB9XG5cbiAgLy8gQWJzdHJhY3QgLSBhbGwgc3RvcmVzIG11c3QgcHJvdmlkZSBiZWxvdzpcblxuICAvLyBhYnN0cmFjdCBhbGxvY2F0ZUlkKHR5cGVOYW1lOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZyB8IG51bWJlcj47XG4gIC8vIGFic3RyYWN0IHdyaXRlQXR0cmlidXRlcyh2YWx1ZTogSW5kZWZpbml0ZU1vZGVsRGF0YSk6IFByb21pc2U8TW9kZWxEYXRhPjtcbiAgYWJzdHJhY3QgcmVhZEF0dHJpYnV0ZXModmFsdWU6IE1vZGVsUmVmZXJlbmNlKTogUHJvbWlzZTxNb2RlbERhdGE+O1xuICBhYnN0cmFjdCByZWFkUmVsYXRpb25zaGlwKHZhbHVlOiBNb2RlbFJlZmVyZW5jZSwgcmVsTmFtZTogc3RyaW5nKTogUHJvbWlzZTxNb2RlbERhdGE+O1xuICAvLyBhYnN0cmFjdCBkZWxldGUodmFsdWU6IE1vZGVsUmVmZXJlbmNlKTogUHJvbWlzZTx2b2lkPjtcbiAgLy8gYWJzdHJhY3Qgd3JpdGVSZWxhdGlvbnNoaXBJdGVtKCB2YWx1ZTogTW9kZWxSZWZlcmVuY2UsIHJlbE5hbWU6IHN0cmluZywgY2hpbGQ6IHtpZDogc3RyaW5nIHwgbnVtYmVyfSApOiBQcm9taXNlPE1vZGVsRGF0YT47XG4gIC8vIGFic3RyYWN0IGRlbGV0ZVJlbGF0aW9uc2hpcEl0ZW0oIHZhbHVlOiBNb2RlbFJlZmVyZW5jZSwgcmVsTmFtZTogc3RyaW5nLCBjaGlsZDoge2lkOiBzdHJpbmcgfCBudW1iZXJ9ICk6IFByb21pc2U8TW9kZWxEYXRhPjtcbiAgLy9cbiAgLy9cbiAgLy8gcXVlcnkocTogYW55KTogUHJvbWlzZTxNb2RlbFJlZmVyZW5jZVtdPiB7XG4gIC8vICAgLy8gcToge3R5cGU6IHN0cmluZywgcXVlcnk6IGFueX1cbiAgLy8gICAvLyBxLnF1ZXJ5IGlzIGltcGwgZGVmaW5lZCAtIGEgc3RyaW5nIGZvciBzcWwgKHJhdyBzcWwpXG4gIC8vICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUXVlcnkgbm90IGltcGxlbWVudGVkJykpO1xuICAvLyB9XG4gIC8vXG4gIC8vIGNvbnZlbmllbmNlIGZ1bmN0aW9uIHVzZWQgaW50ZXJuYWxseVxuICAvLyByZWFkIGEgYnVuY2ggb2YgcmVsYXRpb25zaGlwcyBhbmQgbWVyZ2UgdGhlbSB0b2dldGhlci5cbiAgcmVhZFJlbGF0aW9uc2hpcHMoaXRlbTogTW9kZWxSZWZlcmVuY2UsIHJlbGF0aW9uc2hpcHM6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHJlbGF0aW9uc2hpcHMubWFwKHIgPT4gdGhpcy5yZWFkUmVsYXRpb25zaGlwKGl0ZW0sIHIpKSlcbiAgICAudGhlbihyQSA9PlxuICAgICAgckEucmVkdWNlKFxuICAgICAgICAoYSwgcikgPT4gbWVyZ2VPcHRpb25zKGEsIHIgfHwge30pLFxuICAgICAgICB7IHR5cGVOYW1lOiBpdGVtLnR5cGVOYW1lLCBpZDogaXRlbS5pZCwgYXR0cmlidXRlczoge30sIHJlbGF0aW9uc2hpcHM6IHt9IH1cbiAgICAgIClcbiAgICApO1xuICB9XG5cbiAgcmVhZChpdGVtOiBNb2RlbFJlZmVyZW5jZSwgb3B0czogc3RyaW5nIHwgc3RyaW5nW10gPSBbJ2F0dHJpYnV0ZXMnXSkge1xuICAgIGNvbnN0IHNjaGVtYSA9IHRoaXMuZ2V0U2NoZW1hKGl0ZW0udHlwZU5hbWUpO1xuICAgIGNvbnN0IGtleXMgPSAob3B0cyAmJiAhQXJyYXkuaXNBcnJheShvcHRzKSA/IFtvcHRzXSA6IG9wdHMpIGFzIHN0cmluZ1tdO1xuICAgIHJldHVybiB0aGlzLnJlYWRBdHRyaWJ1dGVzKGl0ZW0pXG4gICAgLnRoZW4oYXR0cmlidXRlcyA9PiB7XG4gICAgICBpZiAoIWF0dHJpYnV0ZXMpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoYXR0cmlidXRlcy5pZCAmJiBhdHRyaWJ1dGVzLmF0dHJpYnV0ZXMgJiYgIWF0dHJpYnV0ZXMuYXR0cmlidXRlc1tzY2hlbWEuaWRBdHRyaWJ1dGVdKSB7XG4gICAgICAgICAgYXR0cmlidXRlcy5hdHRyaWJ1dGVzW3NjaGVtYS5pZEF0dHJpYnV0ZV0gPSBhdHRyaWJ1dGVzLmlkOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVsc1dhbnRlZCA9IChrZXlzLmluZGV4T2YoJ3JlbGF0aW9uc2hpcHMnKSA+PSAwKVxuICAgICAgICAgID8gT2JqZWN0LmtleXMoc2NoZW1hLnJlbGF0aW9uc2hpcHMpXG4gICAgICAgICAgOiBrZXlzLm1hcChrID0+IGsuc3BsaXQoJy4nKSlcbiAgICAgICAgICAgIC5maWx0ZXIoa2EgPT4ga2FbMF0gPT09ICdyZWxhdGlvbnNoaXBzJylcbiAgICAgICAgICAgIC5tYXAoa2EgPT4ga2FbMV0pO1xuICAgICAgICBjb25zdCByZWxzVG9GZXRjaCA9IHJlbHNXYW50ZWQuZmlsdGVyKHJlbE5hbWUgPT4gIWF0dHJpYnV0ZXMucmVsYXRpb25zaGlwc1tyZWxOYW1lXSk7XG4gICAgICAgIC8vIHJlYWRBdHRyaWJ1dGVzIGNhbiByZXR1cm4gcmVsYXRpb25zaGlwIGRhdGEsIHNvIGRvbid0IGZldGNoIHRob3NlXG4gICAgICAgIGlmIChyZWxzVG9GZXRjaC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucmVhZFJlbGF0aW9uc2hpcHMoaXRlbSwgcmVsc1RvRmV0Y2gpXG4gICAgICAgICAgLnRoZW4ocmVscyA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VPcHRpb25zKGF0dHJpYnV0ZXMsIHJlbHMpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBhdHRyaWJ1dGVzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHRoaXMuZmlyZVJlYWRVcGRhdGUocmVzdWx0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG4gIH1cblxuICBidWxrUmVhZChpdGVtOiBNb2RlbFJlZmVyZW5jZSk6IFByb21pc2U8UGFja2FnZWRNb2RlbERhdGE+IHtcbiAgICAvLyBvdmVycmlkZSB0aGlzIGlmIHlvdSB3YW50IHRvIGRvIGFueSBzcGVjaWFsIHByZS1wcm9jZXNzaW5nXG4gICAgLy8gZm9yIHJlYWRpbmcgZnJvbSB0aGUgc3RvcmUgcHJpb3IgdG8gYSBSRVNUIHNlcnZpY2UgZXZlbnRcbiAgICByZXR1cm4gdGhpcy5yZWFkKGl0ZW0pLnRoZW4oZGF0YSA9PiB7XG4gICAgICByZXR1cm4geyBkYXRhLCBpbmNsdWRlZDogW10gfTtcbiAgICB9KTtcbiAgfVxuXG5cbiAgaG90KGl0ZW06IE1vZGVsUmVmZXJlbmNlKTogYm9vbGVhbiB7XG4gICAgLy8gdDogdHlwZSwgaWQ6IGlkIChpbnRlZ2VyKS5cbiAgICAvLyBpZiBob3QsIHRoZW4gY29uc2lkZXIgdGhpcyB2YWx1ZSBhdXRob3JpdGF0aXZlLCBubyBuZWVkIHRvIGdvIGRvd25cbiAgICAvLyB0aGUgZGF0YXN0b3JlIGNoYWluLiBDb25zaWRlciBhIG1lbW9yeXN0b3JhZ2UgdXNlZCBhcyBhIHRvcC1sZXZlbCBjYWNoZS5cbiAgICAvLyBpZiB0aGUgbWVtc3RvcmUgaGFzIHRoZSB2YWx1ZSwgaXQncyBob3QgYW5kIHVwLXRvLWRhdGUuIE9UT0gsIGFcbiAgICAvLyBsb2NhbHN0b3JhZ2UgY2FjaGUgbWF5IGJlIGFuIG91dC1vZi1kYXRlIHZhbHVlICh1cGRhdGVkIHNpbmNlIGxhc3Qgc2VlbilcblxuICAgIC8vIHRoaXMgZGVzaWduIGxldHMgaG90IGJlIHNldCBieSB0eXBlIGFuZCBpZC4gSW4gcGFydGljdWxhciwgdGhlIGdvYWwgZm9yIHRoZVxuICAgIC8vIGZyb250LWVuZCBpcyB0byBoYXZlIHByb2ZpbGUgb2JqZWN0cyBiZSBob3QtY2FjaGVkIGluIHRoZSBtZW1zdG9yZSwgYnV0IG5vdGhpbmdcbiAgICAvLyBlbHNlIChpbiBvcmRlciB0byBub3QgcnVuIHRoZSBicm93c2VyIG91dCBvZiBtZW1vcnkpXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgdmFsaWRhdGVJbnB1dCh2YWx1ZTogTW9kZWxEYXRhIHwgSW5kZWZpbml0ZU1vZGVsRGF0YSk6IHR5cGVvZiB2YWx1ZSB7XG4gICAgY29uc3Qgc2NoZW1hID0gdGhpcy5nZXRTY2hlbWEodmFsdWUudHlwZU5hbWUpO1xuICAgIGNvbnN0IHJldFZhbCA9IHsgdHlwZU5hbWU6IHZhbHVlLnR5cGVOYW1lLCBpZDogdmFsdWUuaWQsIGF0dHJpYnV0ZXM6IHt9LCByZWxhdGlvbnNoaXBzOiB7fSB9O1xuICAgIGNvbnN0IHR5cGVBdHRycyA9IE9iamVjdC5rZXlzKHNjaGVtYS5hdHRyaWJ1dGVzIHx8IHt9KTtcbiAgICBjb25zdCB2YWxBdHRycyA9IE9iamVjdC5rZXlzKHZhbHVlLmF0dHJpYnV0ZXMgfHwge30pO1xuICAgIGNvbnN0IHR5cGVSZWxzID0gT2JqZWN0LmtleXMoc2NoZW1hLnJlbGF0aW9uc2hpcHMgfHwge30pO1xuICAgIGNvbnN0IHZhbFJlbHMgPSBPYmplY3Qua2V5cyh2YWx1ZS5yZWxhdGlvbnNoaXBzIHx8IHt9KTtcblxuICAgIGNvbnN0IGludmFsaWRBdHRycyA9IHZhbEF0dHJzLmZpbHRlcihpdGVtID0+IHR5cGVBdHRycy5pbmRleE9mKGl0ZW0pIDwgMCk7XG4gICAgY29uc3QgaW52YWxpZFJlbHMgPSB2YWxSZWxzLmZpbHRlcihpdGVtID0+IHR5cGVSZWxzLmluZGV4T2YoaXRlbSkgPCAwKTtcblxuICAgIGlmIChpbnZhbGlkQXR0cnMubGVuZ3RoID4gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGF0dHJpYnV0ZXMgb24gdmFsdWUgb2JqZWN0OiAke0pTT04uc3RyaW5naWZ5KGludmFsaWRBdHRycyl9YCk7XG4gICAgfVxuXG4gICAgaWYgKGludmFsaWRSZWxzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCByZWxhdGlvbnNoaXBzIG9uIHZhbHVlIG9iamVjdDogJHtKU09OLnN0cmluZ2lmeShpbnZhbGlkUmVscyl9YCk7XG4gICAgfVxuXG5cbiAgICBmb3IgKGNvbnN0IGF0dHJOYW1lIGluIHNjaGVtYS5hdHRyaWJ1dGVzKSB7XG4gICAgICBpZiAoIXZhbHVlLmF0dHJpYnV0ZXNbYXR0ck5hbWVdICYmIChzY2hlbWEuYXR0cmlidXRlc1thdHRyTmFtZV0uZGVmYXVsdCAhPT0gdW5kZWZpbmVkKSkge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYXR0cmlidXRlc1thdHRyTmFtZV0uZGVmYXVsdCkpIHtcbiAgICAgICAgICByZXRWYWwuYXR0cmlidXRlc1thdHRyTmFtZV0gPSAoc2NoZW1hLmF0dHJpYnV0ZXNbYXR0ck5hbWVdLmRlZmF1bHQgYXMgYW55W10pLmNvbmNhdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzY2hlbWEuYXR0cmlidXRlc1thdHRyTmFtZV0uZGVmYXVsdCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICByZXRWYWwuYXR0cmlidXRlc1thdHRyTmFtZV0gPSBPYmplY3QuYXNzaWduKHt9LCBzY2hlbWEuYXR0cmlidXRlc1thdHRyTmFtZV0uZGVmYXVsdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0VmFsLmF0dHJpYnV0ZXNbYXR0ck5hbWVdID0gc2NoZW1hLmF0dHJpYnV0ZXNbYXR0ck5hbWVdLmRlZmF1bHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHJlbE5hbWUgaW4gc2NoZW1hLnJlbGF0aW9uc2hpcHMpIHtcbiAgICAgIGlmICh2YWx1ZS5yZWxhdGlvbnNoaXBzICYmIHZhbHVlLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0gJiYgIUFycmF5LmlzQXJyYXkodmFsdWUucmVsYXRpb25zaGlwc1tyZWxOYW1lXSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGByZWxhdGlvbiAke3JlbE5hbWV9IGlzIG5vdCBhbiBhcnJheWApO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWVyZ2VPcHRpb25zKHt9LCB2YWx1ZSwgcmV0VmFsKTtcbiAgfVxuXG4gIC8vIHN0b3JlIHR5cGUgaW5mbyBkYXRhIG9uIHRoZSBzdG9yZSBpdHNlbGZcblxuICBnZXRTY2hlbWEodDoge3NjaGVtYTogTW9kZWxTY2hlbWF9IHwgTW9kZWxTY2hlbWEgfCBzdHJpbmcpOiBNb2RlbFNjaGVtYSB7XG4gICAgaWYgKHR5cGVvZiB0ID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHRoaXMudHlwZXNbdF07XG4gICAgfSBlbHNlIGlmICh0WydzY2hlbWEnXSkge1xuICAgICAgcmV0dXJuICh0IGFzIHtzY2hlbWE6IE1vZGVsU2NoZW1hfSkuc2NoZW1hO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdCBhcyBNb2RlbFNjaGVtYTtcbiAgICB9XG4gIH1cblxuICBhZGRTY2hlbWEodDoge3R5cGVOYW1lOiBzdHJpbmcsIHNjaGVtYTogTW9kZWxTY2hlbWF9KSB7XG4gICAgdGhpcy50eXBlc1t0LnR5cGVOYW1lXSA9IHQuc2NoZW1hO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGFkZFNjaGVtYXMoYToge3R5cGVOYW1lOiBzdHJpbmcsIHNjaGVtYTogTW9kZWxTY2hlbWF9W10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoXG4gICAgICBhLm1hcCh0ID0+IHRoaXMuYWRkU2NoZW1hKHQpKVxuICAgICkudGhlbigoKSA9PiB7Lyogbm9vcCAqL30pO1xuICB9XG5cblxuICBmaXJlV3JpdGVVcGRhdGUodmFsOiBNb2RlbERlbHRhKSB7XG4gICAgdGhpcy53cml0ZVN1YmplY3QubmV4dCh2YWwpO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodmFsKTtcbiAgfVxuXG4gIGZpcmVSZWFkVXBkYXRlKHZhbDogTW9kZWxEYXRhKSB7XG4gICAgdGhpcy5yZWFkU3ViamVjdC5uZXh0KHZhbCk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh2YWwpO1xuICB9XG59XG4iXX0=
