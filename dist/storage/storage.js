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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2Uvc3RvcmFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSw4QkFBOEI7QUFFOUIsT0FBTyxLQUFLLFFBQVEsTUFBTSxVQUFVLENBQUM7QUFDckMsT0FBTyxLQUFLLFlBQVksTUFBTSxlQUFlLENBQUM7QUFDOUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUN4QyxPQUFPLEVBQUUsT0FBTyxFQUFjLE1BQU0sU0FBUyxDQUFDO0FBRzlDLGdFQUFnRTtBQUNoRSx5RUFBeUU7QUFDekUsdUZBQXVGO0FBQ3ZGLGdFQUFnRTtBQUNoRSwyRUFBMkU7QUFDM0UsdUVBQXVFO0FBR3ZFLDJFQUEyRTtBQUMzRSxvQ0FBb0M7QUFFcEM7SUFRRSxrREFBa0Q7SUFFbEQsaUJBQVksSUFBYTtRQUN2QixpRUFBaUU7UUFDakUsd0VBQXdFO1FBQ3hFLHVFQUF1RTtRQUN2RSxvQkFBb0I7UUFKVixxQkFBQSxFQUFBLFNBQWE7UUFMakIsZ0JBQVcsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO1FBQzVCLGlCQUFZLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztRQUMzQixVQUFLLEdBQThFLEVBQUUsQ0FBQztRQVM5Riw2RUFBNkU7UUFDN0UsNEVBQTRFO1FBQzVFLFVBQVU7UUFDVixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLElBQUksS0FBSyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUM3QyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDakQsQ0FBQztJQWNELHVCQUFLLEdBQUwsVUFBTSxDQUFDO1FBQ0wsZ0NBQWdDO1FBQ2hDLHVEQUF1RDtRQUN2RCxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUM7SUFDN0QsQ0FBQztJQUVELHVDQUF1QztJQUN2Qyx5REFBeUQ7SUFDekQsbUNBQWlCLEdBQWpCLFVBQWtCLElBQStCLEVBQUUsYUFBdUI7UUFBMUUsaUJBUUM7UUFQQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsS0FBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBOUIsQ0FBOEIsQ0FBQyxDQUFDO2FBQzFFLElBQUksQ0FBQyxVQUFBLEVBQUU7WUFDTixPQUFBLEVBQUUsQ0FBQyxNQUFNLENBQ1AsVUFBQyxDQUFDLEVBQUUsQ0FBQyxJQUFLLE9BQUEsWUFBWSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQXhCLENBQXdCLEVBQ2xDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxhQUFhLEVBQUUsRUFBRSxFQUFFLENBQ3BFO1FBSEQsQ0FHQyxDQUNGLENBQUM7SUFDSixDQUFDO0lBRUQsc0JBQUksR0FBSixVQUFLLElBQStCLEVBQUUsSUFBd0M7UUFBOUUsaUJBaUNDO1FBakNxQyxxQkFBQSxFQUFBLFFBQTJCLFlBQVksQ0FBQztRQUM1RSxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQyxJQUFNLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQWEsQ0FBQztRQUN4RSxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUM7YUFDL0IsSUFBSSxDQUFDLFVBQUEsVUFBVTtZQUNkLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDaEIsTUFBTSxDQUFDLElBQUksQ0FBQztZQUNkLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDTixFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLFVBQVUsQ0FBQyxVQUFVLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQy9FLFVBQVUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyx3Q0FBd0M7Z0JBQzNGLENBQUM7Z0JBQ0QsSUFBTSxVQUFVLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztzQkFDbkQsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQztzQkFDdkMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQVosQ0FBWSxDQUFDO3lCQUMxQixNQUFNLENBQUMsVUFBQSxFQUFFLElBQUksT0FBQSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssZUFBZSxFQUF6QixDQUF5QixDQUFDO3lCQUN2QyxHQUFHLENBQUMsVUFBQSxFQUFFLElBQUksT0FBQSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUwsQ0FBSyxDQUFDLENBQUM7Z0JBQ3RCLElBQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsVUFBQSxPQUFPLElBQUksT0FBQSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLEVBQWxDLENBQWtDLENBQUMsQ0FBQztnQkFDckYsb0VBQW9FO2dCQUNwRSxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzNCLE1BQU0sQ0FBQyxLQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQzt5QkFDL0MsSUFBSSxDQUFDLFVBQUEsSUFBSTt3QkFDUixNQUFNLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDeEMsQ0FBQyxDQUFDLENBQUM7Z0JBQ0wsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFDTixNQUFNLENBQUMsVUFBVSxDQUFDO2dCQUNwQixDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFDLE1BQU07WUFDYixFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNYLEtBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDOUIsQ0FBQztZQUNELE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDaEIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsMEJBQVEsR0FBUixVQUFTLElBQStCO1FBQ3RDLDZEQUE2RDtRQUM3RCwyREFBMkQ7UUFDM0QsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsSUFBSTtZQUM5QixNQUFNLENBQUMsRUFBRSxJQUFJLE1BQUEsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLENBQUM7UUFDaEMsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBR0QscUJBQUcsR0FBSCxVQUFJLElBQStCO1FBQ2pDLDZCQUE2QjtRQUM3QixxRUFBcUU7UUFDckUsMkVBQTJFO1FBQzNFLGtFQUFrRTtRQUNsRSwyRUFBMkU7UUFFM0UsOEVBQThFO1FBQzlFLGtGQUFrRjtRQUNsRix1REFBdUQ7UUFDdkQsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCxtREFBbUQ7SUFDbkQsc0JBQUksR0FBSixVQUFLLEtBQUssRUFBRSxjQUFjO1FBQTFCLGlCQWVDO1FBZEMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDbEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxpREFBaUQsQ0FBQyxDQUFDO1FBQ3JFLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLG1EQUFtRDtZQUNuRCxRQUFRLENBQUM7WUFDVCxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxTQUFTLENBQUMsVUFBQyxDQUFDO2dCQUNoRCxLQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hCLENBQUMsQ0FBQyxDQUFDO1lBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLENBQUMsU0FBUyxDQUFDLFVBQUMsQ0FBQztnQkFDakQsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBQyxPQUFPO29CQUMzQixLQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDeEIsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7SUFDSCxDQUFDO0lBRUQsK0JBQWEsR0FBYixVQUFjLEtBQUssRUFBRSxJQUFTO1FBQVQscUJBQUEsRUFBQSxTQUFTO1FBQzVCLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFRCwyQ0FBMkM7SUFFM0MseUJBQU8sR0FBUCxVQUFRLENBQUM7UUFDUCxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzFCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZCLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDWCxDQUFDO0lBQ0gsQ0FBQztJQUVELHlCQUFPLEdBQVAsVUFBUSxDQUFDO1FBQ1AsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFFRCwwQkFBUSxHQUFSLFVBQVMsQ0FBQztRQUFWLGlCQUVDO1FBREMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLEtBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQWYsQ0FBZSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUdELGlDQUFlLEdBQWYsVUFBZ0IsR0FBa0Q7UUFDaEUsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVELGdDQUFjLEdBQWQsVUFBZSxHQUF5QjtRQUN0QyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzQixNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBQ0gsY0FBQztBQUFELENBbEtBLEFBa0tDLElBQUEiLCJmaWxlIjoic3RvcmFnZS9zdG9yYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50IG5vLXVudXNlZC12YXJzOiAwICovXG5cbmltcG9ydCAqIGFzIEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCAqIGFzIG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcbmltcG9ydCB7IHZhbGlkYXRlSW5wdXQgfSBmcm9tICcuLi91dGlsJztcbmltcG9ydCB7IFN1YmplY3QsIE9ic2VydmFibGUgfSBmcm9tICdyeGpzL1J4JztcbmltcG9ydCAqIGFzIEludGVyZmFjZXMgZnJvbSAnLi4vZGF0YVR5cGVzJztcblxuLy8gdHlwZTogYW4gb2JqZWN0IHRoYXQgZGVmaW5lcyB0aGUgdHlwZS4gdHlwaWNhbGx5IHRoaXMgd2lsbCBiZVxuLy8gcGFydCBvZiB0aGUgTW9kZWwgY2xhc3MgaGllcmFyY2h5LCBidXQgU3RvcmFnZSBvYmplY3RzIGNhbGwgbm8gbWV0aG9kc1xuLy8gb24gdGhlIHR5cGUgb2JqZWN0LiBXZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIFR5cGUuJG5hbWUsIFR5cGUuJGlkIGFuZCBUeXBlLiRzY2hlbWEuXG4vLyBOb3RlIHRoYXQgVHlwZS4kaWQgaXMgdGhlICpuYW1lIG9mIHRoZSBpZCBmaWVsZCogb24gaW5zdGFuY2VzXG4vLyAgICBhbmQgTk9UIHRoZSBhY3R1YWwgaWQgZmllbGQgKGUuZy4sIGluIG1vc3QgY2FzZXMsIFR5cGUuJGlkID09PSAnaWQnKS5cbi8vIGlkOiB1bmlxdWUgaWQuIE9mdGVuIGFuIGludGVnZXIsIGJ1dCBub3QgbmVjZXNzYXJ5IChjb3VsZCBiZSBhbiBvaWQpXG5cblxuLy8gaGFzTWFueSByZWxhdGlvbnNoaXBzIGFyZSB0cmVhdGVkIGxpa2UgaWQgYXJyYXlzLiBTbywgYWRkIC8gcmVtb3ZlIC8gaGFzXG4vLyBqdXN0IHN0b3JlcyBhbmQgcmVtb3ZlcyBpbnRlZ2Vycy5cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN0b3JhZ2Uge1xuXG4gIHRlcm1pbmFsOiBib29sZWFuO1xuICByZWFkJDogT2JzZXJ2YWJsZTxJbnRlcmZhY2VzLk1vZGVsRGF0YT47XG4gIHdyaXRlJDogT2JzZXJ2YWJsZTxJbnRlcmZhY2VzLk1vZGVsRGVsdGE+O1xuICBwcml2YXRlIHJlYWRTdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgcHJpdmF0ZSB3cml0ZVN1YmplY3QgPSBuZXcgU3ViamVjdCgpO1xuICBwcm90ZWN0ZWQgdHlwZXM6IEludGVyZmFjZXMuU3RyaW5nSW5kZXhlZDx7JHNjaGVtYTogSW50ZXJmYWNlcy5Nb2RlbFNjaGVtYSwgdHlwZTogc3RyaW5nfT4gPSB7fTtcbiAgLy8gcHJvdGVjdGVkIHR5cGVzOiBNb2RlbFtdOyBUT0RPOiBmaWd1cmUgdGhpcyBvdXRcblxuICBjb25zdHJ1Y3RvcihvcHRzOmFueSA9IHt9KSB7XG4gICAgLy8gYSBcInRlcm1pbmFsXCIgc3RvcmFnZSBmYWNpbGl0eSBpcyB0aGUgZW5kIG9mIHRoZSBzdG9yYWdlIGNoYWluLlxuICAgIC8vIHVzdWFsbHkgc3FsIG9uIHRoZSBzZXJ2ZXIgc2lkZSBhbmQgcmVzdCBvbiB0aGUgY2xpZW50IHNpZGUsIGl0ICptdXN0KlxuICAgIC8vIHJlY2VpdmUgdGhlIHdyaXRlcywgYW5kIGlzIHRoZSBmaW5hbCBhdXRob3JpdGF0aXZlIGFuc3dlciBvbiB3aGV0aGVyXG4gICAgLy8gc29tZXRoaW5nIGlzIDQwNC5cblxuICAgIC8vIHRlcm1pbmFsIGZhY2lsaXRpZXMgYXJlIGFsc28gdGhlIG9ubHkgb25lcyB0aGF0IGNhbiBhdXRob3JpdGF0aXZlbHkgYW5zd2VyXG4gICAgLy8gYXV0aG9yaXphdGlvbiBxdWVzdGlvbnMsIGJ1dCB0aGUgZGVzaWduIG1heSBhbGxvdyBmb3IgYXV0aG9yaXphdGlvbiB0byBiZVxuICAgIC8vIGNhY2hlZC5cbiAgICB0aGlzLnRlcm1pbmFsID0gb3B0cy50ZXJtaW5hbCB8fCBmYWxzZTtcbiAgICB0aGlzLnJlYWQkID0gdGhpcy5yZWFkU3ViamVjdC5hc09ic2VydmFibGUoKTtcbiAgICB0aGlzLndyaXRlJCA9IHRoaXMud3JpdGVTdWJqZWN0LmFzT2JzZXJ2YWJsZSgpO1xuICB9XG5cbiAgLy8gQWJzdHJhY3QgLSBhbGwgc3RvcmVzIG11c3QgcHJvdmlkZSBiZWxvdzpcblxuICBhYnN0cmFjdCB3cml0ZUF0dHJpYnV0ZXModmFsdWU6IEludGVyZmFjZXMuTW9kZWxEYXRhKTogQmx1ZWJpcmQ8SW50ZXJmYWNlcy5Nb2RlbERhdGE+O1xuICBhYnN0cmFjdCByZWFkQXR0cmlidXRlcyh2YWx1ZTogSW50ZXJmYWNlcy5Nb2RlbFJlZmVyZW5jZSk6IEJsdWViaXJkPEludGVyZmFjZXMuTW9kZWxEYXRhPjtcbiAgYWJzdHJhY3QgY2FjaGUodmFsdWU6IEludGVyZmFjZXMuTW9kZWxEYXRhKTogQmx1ZWJpcmQ8SW50ZXJmYWNlcy5Nb2RlbERhdGE+O1xuICBhYnN0cmFjdCBjYWNoZUF0dHJpYnV0ZXModmFsdWU6IEludGVyZmFjZXMuTW9kZWxEYXRhKTogQmx1ZWJpcmQ8SW50ZXJmYWNlcy5Nb2RlbERhdGE+O1xuICBhYnN0cmFjdCBjYWNoZVJlbGF0aW9uc2hpcCh2YWx1ZTogSW50ZXJmYWNlcy5Nb2RlbERhdGEpOiBCbHVlYmlyZDxJbnRlcmZhY2VzLk1vZGVsRGF0YT47XG4gIGFic3RyYWN0IHJlYWRSZWxhdGlvbnNoaXAodmFsdWU6IEludGVyZmFjZXMuTW9kZWxSZWZlcmVuY2UsIGtleT86IHN0cmluZyB8IHN0cmluZ1tdKTogQmx1ZWJpcmQ8SW50ZXJmYWNlcy5Nb2RlbERhdGE+O1xuICBhYnN0cmFjdCB3aXBlKHZhbHVlOiBJbnRlcmZhY2VzLk1vZGVsUmVmZXJlbmNlLCBrZXk/OiBzdHJpbmcgfCBzdHJpbmdbXSk6IHZvaWQ7XG4gIGFic3RyYWN0IGRlbGV0ZSh2YWx1ZTogSW50ZXJmYWNlcy5Nb2RlbFJlZmVyZW5jZSk6IHZvaWQ7XG4gIGFic3RyYWN0IHdyaXRlUmVsYXRpb25zaGlwSXRlbSh2YWx1ZTogSW50ZXJmYWNlcy5Nb2RlbFJlZmVyZW5jZSwgcmVsYXRpb25zaGlwVGl0bGU6IHN0cmluZywgY2hpbGQ6IHtpZDogc3RyaW5nIHwgbnVtYmVyfSk6IEJsdWViaXJkPEludGVyZmFjZXMuTW9kZWxEYXRhPjtcbiAgYWJzdHJhY3QgZGVsZXRlUmVsYXRpb25zaGlwSXRlbSh2YWx1ZTogSW50ZXJmYWNlcy5Nb2RlbFJlZmVyZW5jZSwgcmVsYXRpb25zaGlwVGl0bGU6IHN0cmluZywgY2hpbGQ6IHtpZDogc3RyaW5nIHwgbnVtYmVyfSk6IEJsdWViaXJkPEludGVyZmFjZXMuTW9kZWxEYXRhPjtcbiAgcXVlcnkocSkge1xuICAgIC8vIHE6IHt0eXBlOiBzdHJpbmcsIHF1ZXJ5OiBhbnl9XG4gICAgLy8gcS5xdWVyeSBpcyBpbXBsIGRlZmluZWQgLSBhIHN0cmluZyBmb3Igc3FsIChyYXcgc3FsKVxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKCdRdWVyeSBub3QgaW1wbGVtZW50ZWQnKSk7XG4gIH1cblxuICAvLyBjb252ZW5pZW5jZSBmdW5jdGlvbiB1c2VkIGludGVybmFsbHlcbiAgLy8gcmVhZCBhIGJ1bmNoIG9mIHJlbGF0aW9uc2hpcHMgYW5kIG1lcmdlIHRoZW0gdG9nZXRoZXIuXG4gIHJlYWRSZWxhdGlvbnNoaXBzKGl0ZW06IEludGVyZmFjZXMuTW9kZWxSZWZlcmVuY2UsIHJlbGF0aW9uc2hpcHM6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLmFsbChyZWxhdGlvbnNoaXBzLm1hcChyID0+IHRoaXMucmVhZFJlbGF0aW9uc2hpcChpdGVtLCByKSkpXG4gICAgLnRoZW4ockEgPT5cbiAgICAgIHJBLnJlZHVjZShcbiAgICAgICAgKGEsIHIpID0+IG1lcmdlT3B0aW9ucyhhLCByIHx8IHt9KSxcbiAgICAgICAgeyB0eXBlOiBpdGVtLnR5cGUsIGlkOiBpdGVtLmlkLCBhdHRyaWJ1dGVzOiB7fSwgcmVsYXRpb25zaGlwczoge30gfVxuICAgICAgKVxuICAgICk7XG4gIH1cblxuICByZWFkKGl0ZW06IEludGVyZmFjZXMuTW9kZWxSZWZlcmVuY2UsIG9wdHM6IHN0cmluZyB8IHN0cmluZ1tdID0gWydhdHRyaWJ1dGVzJ10pIHtcbiAgICBjb25zdCB0eXBlID0gdGhpcy5nZXRUeXBlKGl0ZW0udHlwZSk7XG4gICAgY29uc3Qga2V5cyA9IChvcHRzICYmICFBcnJheS5pc0FycmF5KG9wdHMpID8gW29wdHNdIDogb3B0cykgYXMgc3RyaW5nW107XG4gICAgcmV0dXJuIHRoaXMucmVhZEF0dHJpYnV0ZXMoaXRlbSlcbiAgICAudGhlbihhdHRyaWJ1dGVzID0+IHtcbiAgICAgIGlmICghYXR0cmlidXRlcykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChhdHRyaWJ1dGVzLmlkICYmIGF0dHJpYnV0ZXMuYXR0cmlidXRlcyAmJiAhYXR0cmlidXRlcy5hdHRyaWJ1dGVzW3R5cGUuJGlkXSkge1xuICAgICAgICAgIGF0dHJpYnV0ZXMuYXR0cmlidXRlc1t0eXBlLiRpZF0gPSBhdHRyaWJ1dGVzLmlkOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVsc1dhbnRlZCA9IChrZXlzLmluZGV4T2YoJ3JlbGF0aW9uc2hpcHMnKSA+PSAwKVxuICAgICAgICAgID8gT2JqZWN0LmtleXModHlwZS4kc2NoZW1hLnJlbGF0aW9uc2hpcHMpXG4gICAgICAgICAgOiBrZXlzLm1hcChrID0+IGsuc3BsaXQoJy4nKSlcbiAgICAgICAgICAgIC5maWx0ZXIoa2EgPT4ga2FbMF0gPT09ICdyZWxhdGlvbnNoaXBzJylcbiAgICAgICAgICAgIC5tYXAoa2EgPT4ga2FbMV0pO1xuICAgICAgICBjb25zdCByZWxzVG9GZXRjaCA9IHJlbHNXYW50ZWQuZmlsdGVyKHJlbE5hbWUgPT4gIWF0dHJpYnV0ZXMucmVsYXRpb25zaGlwc1tyZWxOYW1lXSk7XG4gICAgICAgIC8vIHJlYWRBdHRyaWJ1dGVzIGNhbiByZXR1cm4gcmVsYXRpb25zaGlwIGRhdGEsIHNvIGRvbid0IGZldGNoIHRob3NlXG4gICAgICAgIGlmIChyZWxzVG9GZXRjaC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucmVhZFJlbGF0aW9uc2hpcHMoaXRlbSwgcmVsc1RvRmV0Y2gpXG4gICAgICAgICAgLnRoZW4ocmVscyA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VPcHRpb25zKGF0dHJpYnV0ZXMsIHJlbHMpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBhdHRyaWJ1dGVzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHRoaXMuZmlyZVJlYWRVcGRhdGUocmVzdWx0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG4gIH1cblxuICBidWxrUmVhZChpdGVtOiBJbnRlcmZhY2VzLk1vZGVsUmVmZXJlbmNlKSB7XG4gICAgLy8gb3ZlcnJpZGUgdGhpcyBpZiB5b3Ugd2FudCB0byBkbyBhbnkgc3BlY2lhbCBwcmUtcHJvY2Vzc2luZ1xuICAgIC8vIGZvciByZWFkaW5nIGZyb20gdGhlIHN0b3JlIHByaW9yIHRvIGEgUkVTVCBzZXJ2aWNlIGV2ZW50XG4gICAgcmV0dXJuIHRoaXMucmVhZChpdGVtKS50aGVuKGRhdGEgPT4ge1xuICAgICAgcmV0dXJuIHsgZGF0YSwgaW5jbHVkZWQ6IFtdIH07XG4gICAgfSk7XG4gIH1cblxuXG4gIGhvdChpdGVtOiBJbnRlcmZhY2VzLk1vZGVsUmVmZXJlbmNlKSA6IGJvb2xlYW4ge1xuICAgIC8vIHQ6IHR5cGUsIGlkOiBpZCAoaW50ZWdlcikuXG4gICAgLy8gaWYgaG90LCB0aGVuIGNvbnNpZGVyIHRoaXMgdmFsdWUgYXV0aG9yaXRhdGl2ZSwgbm8gbmVlZCB0byBnbyBkb3duXG4gICAgLy8gdGhlIGRhdGFzdG9yZSBjaGFpbi4gQ29uc2lkZXIgYSBtZW1vcnlzdG9yYWdlIHVzZWQgYXMgYSB0b3AtbGV2ZWwgY2FjaGUuXG4gICAgLy8gaWYgdGhlIG1lbXN0b3JlIGhhcyB0aGUgdmFsdWUsIGl0J3MgaG90IGFuZCB1cC10by1kYXRlLiBPVE9ILCBhXG4gICAgLy8gbG9jYWxzdG9yYWdlIGNhY2hlIG1heSBiZSBhbiBvdXQtb2YtZGF0ZSB2YWx1ZSAodXBkYXRlZCBzaW5jZSBsYXN0IHNlZW4pXG5cbiAgICAvLyB0aGlzIGRlc2lnbiBsZXRzIGhvdCBiZSBzZXQgYnkgdHlwZSBhbmQgaWQuIEluIHBhcnRpY3VsYXIsIHRoZSBnb2FsIGZvciB0aGVcbiAgICAvLyBmcm9udC1lbmQgaXMgdG8gaGF2ZSBwcm9maWxlIG9iamVjdHMgYmUgaG90LWNhY2hlZCBpbiB0aGUgbWVtc3RvcmUsIGJ1dCBub3RoaW5nXG4gICAgLy8gZWxzZSAoaW4gb3JkZXIgdG8gbm90IHJ1biB0aGUgYnJvd3NlciBvdXQgb2YgbWVtb3J5KVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIGhvb2sgYSBub24tdGVybWluYWwgc3RvcmUgaW50byBhIHRlcm1pbmFsIHN0b3JlLlxuICB3aXJlKHN0b3JlLCBzaHV0ZG93blNpZ25hbCkge1xuICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCB3aXJlIGEgdGVybWluYWwgc3RvcmUgaW50byBhbm90aGVyIHN0b3JlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRPRE86IGZpZ3VyZSBvdXQgd2hlcmUgdGhlIHR5cGUgZGF0YSBjb21lcyBmcm9tLlxuICAgICAgZGVidWdnZXI7XG4gICAgICBzdG9yZS5yZWFkJC50YWtlVW50aWwoc2h1dGRvd25TaWduYWwpLnN1YnNjcmliZSgodikgPT4ge1xuICAgICAgICB0aGlzLmNhY2hlKHYpO1xuICAgICAgfSk7XG4gICAgICBzdG9yZS53cml0ZSQudGFrZVVudGlsKHNodXRkb3duU2lnbmFsKS5zdWJzY3JpYmUoKHYpID0+IHtcbiAgICAgICAgdi5pbnZhbGlkYXRlLmZvckVhY2goKGludmFsaWQpID0+IHtcbiAgICAgICAgICB0aGlzLndpcGUodiwgaW52YWxpZCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgdmFsaWRhdGVJbnB1dCh2YWx1ZSwgb3B0cyA9IHt9KSB7XG4gICAgY29uc3QgdHlwZSA9IHRoaXMuZ2V0VHlwZSh2YWx1ZS50eXBlKTtcbiAgICByZXR1cm4gdmFsaWRhdGVJbnB1dCh0eXBlLCB2YWx1ZSk7XG4gIH1cblxuICAvLyBzdG9yZSB0eXBlIGluZm8gZGF0YSBvbiB0aGUgc3RvcmUgaXRzZWxmXG5cbiAgZ2V0VHlwZSh0KSB7XG4gICAgaWYgKHR5cGVvZiB0ID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHRoaXMudHlwZXNbdF07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0O1xuICAgIH1cbiAgfVxuXG4gIGFkZFR5cGUodCkge1xuICAgIHRoaXMudHlwZXNbdC50eXBlXSA9IHQ7XG4gIH1cblxuICBhZGRUeXBlcyhhKSB7XG4gICAgYS5mb3JFYWNoKHQgPT4gdGhpcy5hZGRUeXBlKHQpKTtcbiAgfVxuXG5cbiAgZmlyZVdyaXRlVXBkYXRlKHZhbDogSW50ZXJmYWNlcy5Nb2RlbERhdGEgJiB7aW52YWxpZGF0ZTogc3RyaW5nW119KSB7XG4gICAgdGhpcy53cml0ZVN1YmplY3QubmV4dCh2YWwpO1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHZhbCk7XG4gIH1cblxuICBmaXJlUmVhZFVwZGF0ZSh2YWw6IEludGVyZmFjZXMuTW9kZWxEYXRhKSB7XG4gICAgdGhpcy5yZWFkU3ViamVjdC5uZXh0KHZhbCk7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUodmFsKTtcbiAgfVxufVxuIl19
