"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var Plump = (function () {
    function Plump(terminal) {
        this.terminal = terminal;
        this.teardownSubject = new rxjs_1.Subject();
        this.terminal.terminal = true;
        this.caches = [];
        this.types = {};
        this.destroy$ = this.teardownSubject.asObservable();
    }
    Plump.prototype.addType = function (T) {
        var _this = this;
        if (this.types[T.type] === undefined) {
            this.types[T.type] = T;
            return Promise.all(this.caches.map(function (s) { return s.addSchema(T); })).then(function () {
                if (_this.terminal) {
                    _this.terminal.addSchema(T);
                }
            });
        }
        else {
            return Promise.reject("Duplicate Type registered: " + T.type);
        }
    };
    Plump.prototype.type = function (T) {
        return this.types[T];
    };
    Plump.prototype.getTypes = function () {
        var _this = this;
        return Object.keys(this.types).map(function (t) { return _this.type(t); });
    };
    Plump.prototype.addCache = function (store) {
        var _this = this;
        this.caches.push(store);
        if (this.terminal !== undefined) {
            Plump.wire(store, this.terminal, this.destroy$);
        }
        return store.addSchemas(Object.keys(this.types).map(function (k) { return _this.types[k]; }));
    };
    Plump.prototype.find = function (ref) {
        var Type = this.types[ref.type];
        return new Type((_a = {}, _a[Type.schema.idAttribute] = ref.id, _a), this);
        var _a;
    };
    Plump.prototype.forge = function (t, val) {
        var Type = this.types[t];
        return new Type(val, this);
    };
    Plump.prototype.teardown = function () {
        this.teardownSubject.next('done');
    };
    Plump.prototype.get = function (value, opts) {
        var _this = this;
        if (opts === void 0) { opts = ['attributes']; }
        var keys = opts && !Array.isArray(opts) ? [opts] : opts;
        return this.caches
            .reduce(function (thenable, storage) {
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
            if ((v === null || v.attributes === null) && _this.terminal) {
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
                        type: value.type,
                    });
                }
                else {
                    return {
                        id: value.id,
                        type: value.type,
                    };
                }
            })
                .then(function (updated) {
                if (value.relationships &&
                    Object.keys(value.relationships).length > 0) {
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
            return this.terminal
                .delete(item)
                .then(function () {
                return Promise.all(_this.caches.map(function (store) {
                    return store.wipe(item);
                }));
            })
                .then(function () {
            });
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
        this.terminal.fireWriteUpdate({
            type: item.type,
            id: item.id,
            invalidate: fields,
        });
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUQsQ0FuUEEsQUFtUEMsSUFBQTtBQW5QWSxzQkFBSyIsImZpbGUiOiJwbHVtcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFN1YmplY3QsIE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHsgTW9kZWwgfSBmcm9tICcuL21vZGVsJztcbmltcG9ydCB7XG4gIE1vZGVsQXR0cmlidXRlcyxcbiAgLy8gSW5kZWZpbml0ZU1vZGVsRGF0YSxcbiAgTW9kZWxEYXRhLFxuICAvLyBNb2RlbERlbHRhLFxuICAvLyBNb2RlbFNjaGVtYSxcbiAgTW9kZWxSZWZlcmVuY2UsXG4gIERpcnR5TW9kZWwsXG4gIFJlbGF0aW9uc2hpcEl0ZW0sXG4gIENhY2hlU3RvcmUsXG4gIFRlcm1pbmFsU3RvcmUsXG59IGZyb20gJy4vZGF0YVR5cGVzJztcblxuZXhwb3J0IGNsYXNzIFBsdW1wPFRlcm1UeXBlIGV4dGVuZHMgVGVybWluYWxTdG9yZSA9IFRlcm1pbmFsU3RvcmU+IHtcbiAgZGVzdHJveSQ6IE9ic2VydmFibGU8c3RyaW5nPjtcbiAgY2FjaGVzOiBDYWNoZVN0b3JlW107XG5cbiAgcHJpdmF0ZSB0ZWFyZG93blN1YmplY3Q6IFN1YmplY3Q8c3RyaW5nPjtcbiAgcHJpdmF0ZSB0eXBlczogeyBbdHlwZTogc3RyaW5nXTogdHlwZW9mIE1vZGVsIH07XG5cbiAgY29uc3RydWN0b3IocHVibGljIHRlcm1pbmFsOiBUZXJtVHlwZSkge1xuICAgIHRoaXMudGVhcmRvd25TdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgICB0aGlzLnRlcm1pbmFsLnRlcm1pbmFsID0gdHJ1ZTtcbiAgICB0aGlzLmNhY2hlcyA9IFtdO1xuICAgIHRoaXMudHlwZXMgPSB7fTtcbiAgICB0aGlzLmRlc3Ryb3kkID0gdGhpcy50ZWFyZG93blN1YmplY3QuYXNPYnNlcnZhYmxlKCk7XG4gIH1cblxuICBhZGRUeXBlKFQ6IGFueSk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIGFkZFR5cGUoVDogdHlwZW9mIE1vZGVsKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMudHlwZXNbVC50eXBlXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnR5cGVzW1QudHlwZV0gPSBUO1xuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHRoaXMuY2FjaGVzLm1hcChzID0+IHMuYWRkU2NoZW1hKFQpKSkudGhlbigoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICAgICAgdGhpcy50ZXJtaW5hbC5hZGRTY2hlbWEoVCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoYER1cGxpY2F0ZSBUeXBlIHJlZ2lzdGVyZWQ6ICR7VC50eXBlfWApO1xuICAgIH1cbiAgfVxuXG4gIHR5cGUoVDogc3RyaW5nKTogdHlwZW9mIE1vZGVsIHtcbiAgICByZXR1cm4gdGhpcy50eXBlc1tUXTtcbiAgfVxuXG4gIGdldFR5cGVzKCk6IHR5cGVvZiBNb2RlbFtdIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy50eXBlcykubWFwKHQgPT4gdGhpcy50eXBlKHQpKTtcbiAgfVxuXG4gIGFkZENhY2hlKHN0b3JlOiBDYWNoZVN0b3JlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5jYWNoZXMucHVzaChzdG9yZSk7XG4gICAgaWYgKHRoaXMudGVybWluYWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgUGx1bXAud2lyZShzdG9yZSwgdGhpcy50ZXJtaW5hbCwgdGhpcy5kZXN0cm95JCk7XG4gICAgfVxuICAgIHJldHVybiBzdG9yZS5hZGRTY2hlbWFzKE9iamVjdC5rZXlzKHRoaXMudHlwZXMpLm1hcChrID0+IHRoaXMudHlwZXNba10pKTtcbiAgfVxuXG4gIGZpbmQ8VCBleHRlbmRzIE1vZGVsRGF0YT4ocmVmOiBNb2RlbFJlZmVyZW5jZSk6IE1vZGVsPFQ+IHtcbiAgICBjb25zdCBUeXBlID0gdGhpcy50eXBlc1tyZWYudHlwZV07XG4gICAgcmV0dXJuIG5ldyBUeXBlKHsgW1R5cGUuc2NoZW1hLmlkQXR0cmlidXRlXTogcmVmLmlkIH0sIHRoaXMpO1xuICB9XG5cbiAgZm9yZ2U8XG4gICAgQSBleHRlbmRzIE1vZGVsQXR0cmlidXRlcyxcbiAgICBUIGV4dGVuZHMgTW9kZWw8TW9kZWxEYXRhICYgeyBhdHRyaWJ1dGVzPzogQSB9PlxuICA+KHQ6IHN0cmluZywgdmFsOiBQYXJ0aWFsPEE+KTogVCB7XG4gICAgY29uc3QgVHlwZSA9IHRoaXMudHlwZXNbdF07XG4gICAgcmV0dXJuIG5ldyBUeXBlKHZhbCwgdGhpcykgYXMgVDtcbiAgfVxuXG4gIHRlYXJkb3duKCk6IHZvaWQge1xuICAgIHRoaXMudGVhcmRvd25TdWJqZWN0Lm5leHQoJ2RvbmUnKTtcbiAgfVxuXG4gIGdldChcbiAgICB2YWx1ZTogTW9kZWxSZWZlcmVuY2UsXG4gICAgb3B0czogc3RyaW5nW10gPSBbJ2F0dHJpYnV0ZXMnXSxcbiAgKTogUHJvbWlzZTxNb2RlbERhdGE+IHtcbiAgICBjb25zdCBrZXlzID0gb3B0cyAmJiAhQXJyYXkuaXNBcnJheShvcHRzKSA/IFtvcHRzXSA6IG9wdHM7XG4gICAgcmV0dXJuIHRoaXMuY2FjaGVzXG4gICAgICAucmVkdWNlKCh0aGVuYWJsZSwgc3RvcmFnZSkgPT4ge1xuICAgICAgICByZXR1cm4gdGhlbmFibGUudGhlbih2ID0+IHtcbiAgICAgICAgICBpZiAodiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgICAgfSBlbHNlIGlmIChzdG9yYWdlLmhvdCh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBzdG9yYWdlLnJlYWQodmFsdWUsIGtleXMpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSwgUHJvbWlzZS5yZXNvbHZlKG51bGwpKVxuICAgICAgLnRoZW4odiA9PiB7XG4gICAgICAgIGlmICgodiA9PT0gbnVsbCB8fCB2LmF0dHJpYnV0ZXMgPT09IG51bGwpICYmIHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy50ZXJtaW5hbC5yZWFkKHZhbHVlLCBrZXlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICBidWxrR2V0KHZhbHVlOiBNb2RlbFJlZmVyZW5jZSk6IFByb21pc2U8TW9kZWxEYXRhPiB7XG4gICAgcmV0dXJuIHRoaXMudGVybWluYWwuYnVsa1JlYWQodmFsdWUpO1xuICB9XG5cbiAgc2F2ZSh2YWx1ZTogRGlydHlNb2RlbCk6IFByb21pc2U8TW9kZWxEYXRhPiB7XG4gICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgaWYgKE9iamVjdC5rZXlzKHZhbHVlLmF0dHJpYnV0ZXMpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRlcm1pbmFsLndyaXRlQXR0cmlidXRlcyh7XG4gICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHZhbHVlLmF0dHJpYnV0ZXMsXG4gICAgICAgICAgICAgIGlkOiB2YWx1ZS5pZCxcbiAgICAgICAgICAgICAgdHlwZTogdmFsdWUudHlwZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBpZDogdmFsdWUuaWQsXG4gICAgICAgICAgICAgIHR5cGU6IHZhbHVlLnR5cGUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4odXBkYXRlZCA9PiB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdmFsdWUucmVsYXRpb25zaGlwcyAmJlxuICAgICAgICAgICAgT2JqZWN0LmtleXModmFsdWUucmVsYXRpb25zaGlwcykubGVuZ3RoID4gMFxuICAgICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFxuICAgICAgICAgICAgICBPYmplY3Qua2V5cyh2YWx1ZS5yZWxhdGlvbnNoaXBzKS5tYXAocmVsTmFtZSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnJlbGF0aW9uc2hpcHNbXG4gICAgICAgICAgICAgICAgICByZWxOYW1lXG4gICAgICAgICAgICAgICAgXS5yZWR1Y2UoKHRoZW5hYmxlOiBQcm9taXNlPHZvaWQgfCBNb2RlbERhdGE+LCBkZWx0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoZW5hYmxlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGVsdGEub3AgPT09ICdhZGQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudGVybWluYWwud3JpdGVSZWxhdGlvbnNoaXBJdGVtKFxuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbE5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWx0YS5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGVsdGEub3AgPT09ICdyZW1vdmUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudGVybWluYWwuZGVsZXRlUmVsYXRpb25zaGlwSXRlbShcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICByZWxOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsdGEuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRlbHRhLm9wID09PSAnbW9kaWZ5Jykge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRlcm1pbmFsLndyaXRlUmVsYXRpb25zaGlwSXRlbShcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICByZWxOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsdGEuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgIGBVbmtub3duIHJlbGF0aW9uc2hpcCBkZWx0YSAke0pTT04uc3RyaW5naWZ5KGRlbHRhKX1gLFxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sIFByb21pc2UucmVzb2x2ZSgpKTtcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICApLnRoZW4oKCkgPT4gdXBkYXRlZCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB1cGRhdGVkO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBkZWxldGUoaXRlbTogTW9kZWxSZWZlcmVuY2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy50ZXJtaW5hbCkge1xuICAgICAgcmV0dXJuIHRoaXMudGVybWluYWxcbiAgICAgICAgLmRlbGV0ZShpdGVtKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFxuICAgICAgICAgICAgdGhpcy5jYWNoZXMubWFwKHN0b3JlID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIHN0b3JlLndpcGUoaXRlbSk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICApO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgLyogbm9vcCAqL1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIGFkZChpdGVtOiBNb2RlbFJlZmVyZW5jZSwgcmVsTmFtZTogc3RyaW5nLCBjaGlsZDogUmVsYXRpb25zaGlwSXRlbSkge1xuICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICByZXR1cm4gdGhpcy50ZXJtaW5hbC53cml0ZVJlbGF0aW9uc2hpcEl0ZW0oaXRlbSwgcmVsTmFtZSwgY2hpbGQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgLy8gcmVzdFJlcXVlc3Qob3B0cykge1xuICAvLyAgIGlmICh0aGlzLnRlcm1pbmFsICYmIHRoaXMudGVybWluYWwucmVzdCkge1xuICAvLyAgICAgcmV0dXJuIHRoaXMudGVybWluYWwucmVzdChvcHRzKTtcbiAgLy8gICB9IGVsc2Uge1xuICAvLyAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignTm8gUmVzdCB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgLy8gICB9XG4gIC8vIH1cblxuICBtb2RpZnlSZWxhdGlvbnNoaXAoXG4gICAgaXRlbTogTW9kZWxSZWZlcmVuY2UsXG4gICAgcmVsTmFtZTogc3RyaW5nLFxuICAgIGNoaWxkOiBSZWxhdGlvbnNoaXBJdGVtLFxuICApIHtcbiAgICByZXR1cm4gdGhpcy5hZGQoaXRlbSwgcmVsTmFtZSwgY2hpbGQpO1xuICB9XG5cbiAgcXVlcnkocTogYW55KTogUHJvbWlzZTxNb2RlbFJlZmVyZW5jZVtdPiB7XG4gICAgcmV0dXJuIHRoaXMudGVybWluYWwucXVlcnkocSk7XG4gIH1cblxuICBkZWxldGVSZWxhdGlvbnNoaXBJdGVtKFxuICAgIGl0ZW06IE1vZGVsUmVmZXJlbmNlLFxuICAgIHJlbE5hbWU6IHN0cmluZyxcbiAgICBjaGlsZDogUmVsYXRpb25zaGlwSXRlbSxcbiAgKSB7XG4gICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgIHJldHVybiB0aGlzLnRlcm1pbmFsLmRlbGV0ZVJlbGF0aW9uc2hpcEl0ZW0oaXRlbSwgcmVsTmFtZSwgY2hpbGQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgaW52YWxpZGF0ZShpdGVtOiBNb2RlbFJlZmVyZW5jZSwgZmllbGQ/OiBzdHJpbmcgfCBzdHJpbmdbXSk6IHZvaWQge1xuICAgIGNvbnN0IGZpZWxkcyA9IEFycmF5LmlzQXJyYXkoZmllbGQpID8gZmllbGQgOiBbZmllbGRdO1xuICAgIHRoaXMudGVybWluYWwuZmlyZVdyaXRlVXBkYXRlKHtcbiAgICAgIHR5cGU6IGl0ZW0udHlwZSxcbiAgICAgIGlkOiBpdGVtLmlkLFxuICAgICAgaW52YWxpZGF0ZTogZmllbGRzLFxuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIHdpcmUoXG4gICAgbWU6IENhY2hlU3RvcmUsXG4gICAgdGhleTogVGVybWluYWxTdG9yZSxcbiAgICBzaHV0ZG93blNpZ25hbDogT2JzZXJ2YWJsZTxzdHJpbmc+LFxuICApIHtcbiAgICBpZiAobWUudGVybWluYWwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHdpcmUgYSB0ZXJtaW5hbCBzdG9yZSBpbnRvIGFub3RoZXIgc3RvcmUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVE9ETzogZmlndXJlIG91dCB3aGVyZSB0aGUgdHlwZSBkYXRhIGNvbWVzIGZyb20uXG4gICAgICB0aGV5LnJlYWQkLnRha2VVbnRpbChzaHV0ZG93blNpZ25hbCkuc3Vic2NyaWJlKHYgPT4ge1xuICAgICAgICBtZS5jYWNoZSh2KTtcbiAgICAgIH0pO1xuICAgICAgdGhleS53cml0ZSQudGFrZVVudGlsKHNodXRkb3duU2lnbmFsKS5zdWJzY3JpYmUodiA9PiB7XG4gICAgICAgIHYuaW52YWxpZGF0ZS5mb3JFYWNoKGludmFsaWQgPT4ge1xuICAgICAgICAgIG1lLndpcGUodiwgaW52YWxpZCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG4iXX0=
