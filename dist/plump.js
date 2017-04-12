"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Rx_1 = require("rxjs/Rx");
var Plump = (function () {
    function Plump() {
        this.teardownSubject = new Rx_1.Subject();
        this.caches = [];
        this.types = {};
        this.destroy$ = this.teardownSubject.asObservable();
    }
    Plump.prototype.addType = function (T) {
        var _this = this;
        if (this.types[T.typeName] === undefined) {
            this.types[T.typeName] = T;
            return Promise.all(this.caches.map(function (s) { return s.addSchema(T); })).then(function () {
                if (_this.terminal) {
                    _this.terminal.addSchema(T);
                }
            });
        }
        else {
            return Promise.reject("Duplicate Type registered: " + T.typeName);
        }
    };
    Plump.prototype.type = function (T) {
        return this.types[T];
    };
    Plump.prototype.setTerminal = function (store) {
        var _this = this;
        if (this.terminal !== undefined) {
            throw new Error('cannot have more than one terminal store');
        }
        else {
            store.terminal = true;
            this.terminal = store;
            this.caches.forEach(function (cacheStore) {
                Plump.wire(cacheStore, store, _this.destroy$);
            });
        }
        return store.addSchemas(Object.keys(this.types).map(function (k) { return _this.types[k]; }));
    };
    Plump.prototype.addCache = function (store) {
        var _this = this;
        this.caches.push(store);
        if (this.terminal !== undefined) {
            Plump.wire(store, this.terminal, this.destroy$);
        }
        return store.addSchemas(Object.keys(this.types).map(function (k) { return _this.types[k]; }));
    };
    Plump.prototype.find = function (t, id) {
        var Type = typeof t === 'string' ? this.types[t] : t;
        return new Type((_a = {}, _a[Type.schema.idAttribute] = id, _a), this);
        var _a;
    };
    Plump.prototype.forge = function (t, val) {
        var Type = typeof t === 'string' ? this.types[t] : t;
        return new Type(val, this);
    };
    Plump.prototype.teardown = function () {
        this.teardownSubject.next('done');
    };
    Plump.prototype.get = function (value, opts) {
        var _this = this;
        if (opts === void 0) { opts = ['attributes']; }
        var keys = opts && !Array.isArray(opts) ? [opts] : opts;
        return this.caches.reduce(function (thenable, storage) {
            return thenable.then(function (v) {
                if (v !== null) {
                    return v;
                }
                else if (storage.hot(value)) {
                    return storage.read(value, keys);
                }
                else {
                    return null;
                }
            });
        }, Promise.resolve(null))
            .then(function (v) {
            if (((v === null) || (v.attributes === null)) && (_this.terminal)) {
                return _this.terminal.read(value, keys);
            }
            else {
                return v;
            }
        });
    };
    Plump.prototype.bulkGet = function (value) {
        return this.terminal.bulkRead(value);
    };
    Plump.prototype.save = function (value) {
        var _this = this;
        if (this.terminal) {
            return Promise.resolve()
                .then(function () {
                if (Object.keys(value.attributes).length > 0) {
                    return _this.terminal.writeAttributes({
                        attributes: value.attributes,
                        id: value.id,
                        typeName: value.typeName,
                    });
                }
                else {
                    return {
                        id: value.id,
                        typeName: value.typeName,
                    };
                }
            })
                .then(function (updated) {
                if (value.relationships && Object.keys(value.relationships).length > 0) {
                    return Promise.all(Object.keys(value.relationships).map(function (relName) {
                        return value.relationships[relName].reduce(function (thenable, delta) {
                            return thenable.then(function () {
                                if (delta.op === 'add') {
                                    return _this.terminal.writeRelationshipItem(updated, relName, delta.data);
                                }
                                else if (delta.op === 'remove') {
                                    return _this.terminal.deleteRelationshipItem(updated, relName, delta.data);
                                }
                                else if (delta.op === 'modify') {
                                    return _this.terminal.writeRelationshipItem(updated, relName, delta.data);
                                }
                                else {
                                    throw new Error("Unknown relationship delta " + JSON.stringify(delta));
                                }
                            });
                        }, Promise.resolve());
                    })).then(function () { return updated; });
                }
                else {
                    return updated;
                }
            });
        }
        else {
            return Promise.reject(new Error('Plump has no terminal store'));
        }
    };
    Plump.prototype.delete = function (item) {
        var _this = this;
        if (this.terminal) {
            return this.terminal.delete(item).then(function () {
                return Promise.all(_this.caches.map(function (store) {
                    return store.wipe(item);
                }));
            }).then(function () { });
        }
        else {
            return Promise.reject(new Error('Plump has no terminal store'));
        }
    };
    Plump.prototype.add = function (item, relName, child) {
        if (this.terminal) {
            return this.terminal.writeRelationshipItem(item, relName, child);
        }
        else {
            return Promise.reject(new Error('Plump has no terminal store'));
        }
    };
    Plump.prototype.modifyRelationship = function (item, relName, child) {
        return this.add(item, relName, child);
    };
    Plump.prototype.query = function (q) {
        return this.terminal.query(q);
    };
    Plump.prototype.deleteRelationshipItem = function (item, relName, child) {
        if (this.terminal) {
            return this.terminal.deleteRelationshipItem(item, relName, child);
        }
        else {
            return Promise.reject(new Error('Plump has no terminal store'));
        }
    };
    Plump.prototype.invalidate = function (item, field) {
        var fields = Array.isArray(field) ? field : [field];
        this.terminal.fireWriteUpdate({ typeName: item.typeName, id: item.id, invalidate: fields });
    };
    Plump.wire = function (me, they, shutdownSignal) {
        if (me.terminal) {
            throw new Error('Cannot wire a terminal store into another store');
        }
        else {
            they.read$.takeUntil(shutdownSignal).subscribe(function (v) {
                me.cache(v);
            });
            they.write$.takeUntil(shutdownSignal).subscribe(function (v) {
                v.invalidate.forEach(function (invalid) {
                    me.wipe(v, invalid);
                });
            });
        }
    };
    return Plump;
}());
exports.Plump = Plump;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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Q0FBQyxDQUFDO1lBRU4sSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLENBQUMsU0FBUyxDQUFDLFVBQUMsQ0FBQztnQkFDL0MsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNkLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLENBQUMsU0FBUyxDQUFDLFVBQUMsQ0FBQztnQkFDaEQsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBQyxPQUFPO29CQUMzQixFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDdEIsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7SUFDSCxDQUFDO0lBR0gsWUFBQztBQUFELENBak5BLEFBaU5DLElBQUE7QUFqTlksc0JBQUsiLCJmaWxlIjoicGx1bXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTdWJqZWN0LCBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcy9SeCc7XG5cbmltcG9ydCB7IE1vZGVsIH0gZnJvbSAnLi9tb2RlbCc7XG5pbXBvcnQge1xuICAvLyBJbmRlZmluaXRlTW9kZWxEYXRhLFxuICBNb2RlbERhdGEsXG4gIC8vIE1vZGVsRGVsdGEsXG4gIC8vIE1vZGVsU2NoZW1hLFxuICBNb2RlbFJlZmVyZW5jZSxcbiAgRGlydHlNb2RlbCxcbiAgUmVsYXRpb25zaGlwSXRlbSxcbiAgQ2FjaGVTdG9yZSxcbiAgVGVybWluYWxTdG9yZSxcbn0gZnJvbSAnLi9kYXRhVHlwZXMnO1xuXG5leHBvcnQgY2xhc3MgUGx1bXAge1xuXG4gIGRlc3Ryb3kkOiBPYnNlcnZhYmxlPHN0cmluZz47XG4gIGNhY2hlczogQ2FjaGVTdG9yZVtdO1xuICB0ZXJtaW5hbDogVGVybWluYWxTdG9yZTtcblxuICBwcml2YXRlIHRlYXJkb3duU3ViamVjdDogU3ViamVjdDxzdHJpbmc+O1xuICBwcml2YXRlIHR5cGVzOiB7IFt0eXBlOiBzdHJpbmddOiB0eXBlb2YgTW9kZWwgfTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnRlYXJkb3duU3ViamVjdCA9IG5ldyBTdWJqZWN0KCk7XG4gICAgdGhpcy5jYWNoZXMgPSBbXTtcbiAgICB0aGlzLnR5cGVzID0ge307XG4gICAgdGhpcy5kZXN0cm95JCA9IHRoaXMudGVhcmRvd25TdWJqZWN0LmFzT2JzZXJ2YWJsZSgpO1xuICB9XG5cbiAgYWRkVHlwZShUOiB0eXBlb2YgTW9kZWwpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy50eXBlc1tULnR5cGVOYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnR5cGVzW1QudHlwZU5hbWVdID0gVDtcbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChcbiAgICAgICAgdGhpcy5jYWNoZXMubWFwKHMgPT4gcy5hZGRTY2hlbWEoVCkpXG4gICAgICApLnRoZW4oKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy50ZXJtaW5hbCkge1xuICAgICAgICAgIHRoaXMudGVybWluYWwuYWRkU2NoZW1hKFQpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGBEdXBsaWNhdGUgVHlwZSByZWdpc3RlcmVkOiAke1QudHlwZU5hbWV9YCk7XG4gICAgfVxuICB9XG5cbiAgdHlwZShUOiBzdHJpbmcpOiB0eXBlb2YgTW9kZWwge1xuICAgIHJldHVybiB0aGlzLnR5cGVzW1RdO1xuICB9XG5cbiAgc2V0VGVybWluYWwoc3RvcmU6IFRlcm1pbmFsU3RvcmUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy50ZXJtaW5hbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBoYXZlIG1vcmUgdGhhbiBvbmUgdGVybWluYWwgc3RvcmUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RvcmUudGVybWluYWwgPSB0cnVlO1xuICAgICAgdGhpcy50ZXJtaW5hbCA9IHN0b3JlO1xuICAgICAgdGhpcy5jYWNoZXMuZm9yRWFjaCgoY2FjaGVTdG9yZSkgPT4ge1xuICAgICAgICBQbHVtcC53aXJlKGNhY2hlU3RvcmUsIHN0b3JlLCB0aGlzLmRlc3Ryb3kkKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gc3RvcmUuYWRkU2NoZW1hcyhcbiAgICAgIE9iamVjdC5rZXlzKHRoaXMudHlwZXMpLm1hcChrID0+IHRoaXMudHlwZXNba10pXG4gICAgKTtcbiAgfVxuXG4gIGFkZENhY2hlKHN0b3JlOiBDYWNoZVN0b3JlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5jYWNoZXMucHVzaChzdG9yZSk7XG4gICAgaWYgKHRoaXMudGVybWluYWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgUGx1bXAud2lyZShzdG9yZSwgdGhpcy50ZXJtaW5hbCwgdGhpcy5kZXN0cm95JCk7XG4gICAgfVxuICAgIHJldHVybiBzdG9yZS5hZGRTY2hlbWFzKFxuICAgICAgT2JqZWN0LmtleXModGhpcy50eXBlcykubWFwKGsgPT4gdGhpcy50eXBlc1trXSlcbiAgICApO1xuICB9XG5cbiAgZmluZCh0LCBpZCk6IE1vZGVsIHtcbiAgICBjb25zdCBUeXBlID0gdHlwZW9mIHQgPT09ICdzdHJpbmcnID8gdGhpcy50eXBlc1t0XSA6IHQ7XG4gICAgcmV0dXJuIG5ldyBUeXBlKHsgW1R5cGUuc2NoZW1hLmlkQXR0cmlidXRlXTogaWQgfSwgdGhpcyk7XG4gIH1cblxuICBmb3JnZSh0LCB2YWwpOiBNb2RlbCB7XG4gICAgY29uc3QgVHlwZSA9IHR5cGVvZiB0ID09PSAnc3RyaW5nJyA/IHRoaXMudHlwZXNbdF0gOiB0O1xuICAgIHJldHVybiBuZXcgVHlwZSh2YWwsIHRoaXMpO1xuICB9XG5cbiAgdGVhcmRvd24oKTogdm9pZCB7XG4gICAgdGhpcy50ZWFyZG93blN1YmplY3QubmV4dCgnZG9uZScpO1xuICB9XG5cbiAgZ2V0KHZhbHVlOiBNb2RlbFJlZmVyZW5jZSwgb3B0czogc3RyaW5nW10gPSBbJ2F0dHJpYnV0ZXMnXSk6IFByb21pc2U8TW9kZWxEYXRhPiB7XG4gICAgY29uc3Qga2V5cyA9IG9wdHMgJiYgIUFycmF5LmlzQXJyYXkob3B0cykgPyBbb3B0c10gOiBvcHRzO1xuICAgIHJldHVybiB0aGlzLmNhY2hlcy5yZWR1Y2UoKHRoZW5hYmxlLCBzdG9yYWdlKSA9PiB7XG4gICAgICByZXR1cm4gdGhlbmFibGUudGhlbigodikgPT4ge1xuICAgICAgICBpZiAodiAhPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICB9IGVsc2UgaWYgKHN0b3JhZ2UuaG90KHZhbHVlKSkge1xuICAgICAgICAgIHJldHVybiBzdG9yYWdlLnJlYWQodmFsdWUsIGtleXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LCBQcm9taXNlLnJlc29sdmUobnVsbCkpXG4gICAgLnRoZW4oKHYpID0+IHtcbiAgICAgIGlmICgoKHYgPT09IG51bGwpIHx8ICh2LmF0dHJpYnV0ZXMgPT09IG51bGwpKSAmJiAodGhpcy50ZXJtaW5hbCkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGVybWluYWwucmVhZCh2YWx1ZSwga2V5cyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdjtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGJ1bGtHZXQodmFsdWU6IE1vZGVsUmVmZXJlbmNlKTogUHJvbWlzZTxNb2RlbERhdGE+IHtcbiAgICByZXR1cm4gdGhpcy50ZXJtaW5hbC5idWxrUmVhZCh2YWx1ZSk7XG4gIH1cblxuICBzYXZlKHZhbHVlOiBEaXJ0eU1vZGVsKTogUHJvbWlzZTxNb2RlbERhdGE+IHtcbiAgICBpZiAodGhpcy50ZXJtaW5hbCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIGlmIChPYmplY3Qua2V5cyh2YWx1ZS5hdHRyaWJ1dGVzKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMudGVybWluYWwud3JpdGVBdHRyaWJ1dGVzKHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHZhbHVlLmF0dHJpYnV0ZXMsXG4gICAgICAgICAgICBpZDogdmFsdWUuaWQsXG4gICAgICAgICAgICB0eXBlTmFtZTogdmFsdWUudHlwZU5hbWUsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlkOiB2YWx1ZS5pZCxcbiAgICAgICAgICAgIHR5cGVOYW1lOiB2YWx1ZS50eXBlTmFtZSxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnRoZW4oKHVwZGF0ZWQpID0+IHtcbiAgICAgICAgaWYgKHZhbHVlLnJlbGF0aW9uc2hpcHMgJiYgT2JqZWN0LmtleXModmFsdWUucmVsYXRpb25zaGlwcykubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChPYmplY3Qua2V5cyh2YWx1ZS5yZWxhdGlvbnNoaXBzKS5tYXAoKHJlbE5hbWUpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnJlZHVjZSgodGhlbmFibGU6IFByb21pc2U8dm9pZCB8IE1vZGVsRGF0YT4sIGRlbHRhKSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiB0aGVuYWJsZS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZGVsdGEub3AgPT09ICdhZGQnKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50ZXJtaW5hbC53cml0ZVJlbGF0aW9uc2hpcEl0ZW0odXBkYXRlZCwgcmVsTmFtZSwgZGVsdGEuZGF0YSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkZWx0YS5vcCA9PT0gJ3JlbW92ZScpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRlcm1pbmFsLmRlbGV0ZVJlbGF0aW9uc2hpcEl0ZW0odXBkYXRlZCwgcmVsTmFtZSwgZGVsdGEuZGF0YSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkZWx0YS5vcCA9PT0gJ21vZGlmeScpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRlcm1pbmFsLndyaXRlUmVsYXRpb25zaGlwSXRlbSh1cGRhdGVkLCByZWxOYW1lLCBkZWx0YS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHJlbGF0aW9uc2hpcCBkZWx0YSAke0pTT04uc3RyaW5naWZ5KGRlbHRhKX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgUHJvbWlzZS5yZXNvbHZlKCkpO1xuICAgICAgICAgIH0pKS50aGVuKCgpID0+IHVwZGF0ZWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB1cGRhdGVkO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIGRlbGV0ZShpdGVtOiBNb2RlbFJlZmVyZW5jZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICByZXR1cm4gdGhpcy50ZXJtaW5hbC5kZWxldGUoaXRlbSkudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbCh0aGlzLmNhY2hlcy5tYXAoKHN0b3JlKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JlLndpcGUoaXRlbSk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0pLnRoZW4oKCkgPT4geyAvKiBub29wICovIH0gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIGFkZChpdGVtOiBNb2RlbFJlZmVyZW5jZSwgcmVsTmFtZTogc3RyaW5nLCBjaGlsZDogUmVsYXRpb25zaGlwSXRlbSkge1xuICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICByZXR1cm4gdGhpcy50ZXJtaW5hbC53cml0ZVJlbGF0aW9uc2hpcEl0ZW0oaXRlbSwgcmVsTmFtZSwgY2hpbGQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgLy8gcmVzdFJlcXVlc3Qob3B0cykge1xuICAvLyAgIGlmICh0aGlzLnRlcm1pbmFsICYmIHRoaXMudGVybWluYWwucmVzdCkge1xuICAvLyAgICAgcmV0dXJuIHRoaXMudGVybWluYWwucmVzdChvcHRzKTtcbiAgLy8gICB9IGVsc2Uge1xuICAvLyAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignTm8gUmVzdCB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgLy8gICB9XG4gIC8vIH1cblxuICBtb2RpZnlSZWxhdGlvbnNoaXAoaXRlbTogTW9kZWxSZWZlcmVuY2UsIHJlbE5hbWU6IHN0cmluZywgY2hpbGQ6IFJlbGF0aW9uc2hpcEl0ZW0pIHtcbiAgICByZXR1cm4gdGhpcy5hZGQoaXRlbSwgcmVsTmFtZSwgY2hpbGQpO1xuICB9XG5cbiAgcXVlcnkocTogYW55KTogUHJvbWlzZTxNb2RlbFJlZmVyZW5jZVtdPiB7XG4gICAgcmV0dXJuIHRoaXMudGVybWluYWwucXVlcnkocSk7XG4gIH1cblxuICBkZWxldGVSZWxhdGlvbnNoaXBJdGVtKGl0ZW06IE1vZGVsUmVmZXJlbmNlLCByZWxOYW1lOiBzdHJpbmcsIGNoaWxkOiBSZWxhdGlvbnNoaXBJdGVtKSB7XG4gICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgIHJldHVybiB0aGlzLnRlcm1pbmFsLmRlbGV0ZVJlbGF0aW9uc2hpcEl0ZW0oaXRlbSwgcmVsTmFtZSwgY2hpbGQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgaW52YWxpZGF0ZShpdGVtOiBNb2RlbFJlZmVyZW5jZSwgZmllbGQ/OiBzdHJpbmcgfCBzdHJpbmdbXSk6IHZvaWQge1xuICAgIGNvbnN0IGZpZWxkcyA9IEFycmF5LmlzQXJyYXkoZmllbGQpID8gZmllbGQgOiBbZmllbGRdO1xuICAgIHRoaXMudGVybWluYWwuZmlyZVdyaXRlVXBkYXRlKHsgdHlwZU5hbWU6IGl0ZW0udHlwZU5hbWUsIGlkOiBpdGVtLmlkICwgaW52YWxpZGF0ZTogZmllbGRzIH0pO1xuICB9XG5cbiAgc3RhdGljIHdpcmUobWU6IENhY2hlU3RvcmUsIHRoZXk6IFRlcm1pbmFsU3RvcmUsIHNodXRkb3duU2lnbmFsOiBPYnNlcnZhYmxlPHN0cmluZz4pIHtcbiAgICBpZiAobWUudGVybWluYWwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHdpcmUgYSB0ZXJtaW5hbCBzdG9yZSBpbnRvIGFub3RoZXIgc3RvcmUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVE9ETzogZmlndXJlIG91dCB3aGVyZSB0aGUgdHlwZSBkYXRhIGNvbWVzIGZyb20uXG4gICAgICB0aGV5LnJlYWQkLnRha2VVbnRpbChzaHV0ZG93blNpZ25hbCkuc3Vic2NyaWJlKCh2KSA9PiB7XG4gICAgICAgIG1lLmNhY2hlKHYpO1xuICAgICAgfSk7XG4gICAgICB0aGV5LndyaXRlJC50YWtlVW50aWwoc2h1dGRvd25TaWduYWwpLnN1YnNjcmliZSgodikgPT4ge1xuICAgICAgICB2LmludmFsaWRhdGUuZm9yRWFjaCgoaW52YWxpZCkgPT4ge1xuICAgICAgICAgIG1lLndpcGUodiwgaW52YWxpZCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cblxufVxuIl19
