import { Subject } from 'rxjs/Rx';
import * as Bluebird from 'bluebird';
var Plump = (function () {
    function Plump(opts) {
        if (opts === void 0) { opts = {}; }
        var _this = this;
        var options = Object.assign({}, {
            storage: [],
            types: [],
        }, opts);
        this.teardownSubject = new Subject();
        this.storage = [];
        this.types = {};
        this.destroy$ = this.teardownSubject.asObservable();
        options.storage.forEach(function (s) { return _this.addStore(s); });
        options.types.forEach(function (t) { return _this.addType(t); });
    }
    Plump.prototype.addType = function (T) {
        if (this.types[T.type] === undefined) {
            this.types[T.type] = T;
            this.storage.forEach(function (s) { return s.addType(T); });
            if (this.terminal) {
                this.terminal.addType(T);
            }
        }
        else {
            throw new Error("Duplicate Type registered: " + T.type);
        }
    };
    Plump.prototype.type = function (T) {
        return this.types[T];
    };
    Plump.prototype.addStore = function (store) {
        var _this = this;
        if (store.terminal) {
            if (this.terminal !== undefined) {
                throw new Error('cannot have more than one terminal store');
            }
            else {
                this.terminal = store;
                this.storage.forEach(function (cacheStore) {
                    cacheStore.wire(store, _this.destroy$);
                });
            }
        }
        else {
            this.storage.push(store);
            if (this.terminal !== undefined) {
                store.wire(this.terminal, this.destroy$);
            }
        }
        for (var typeName in this.types) {
            store.addType(this.types[typeName]);
        }
    };
    Plump.prototype.find = function (t, id) {
        var Type = typeof t === 'string' ? this.types[t] : t;
        return new Type((_a = {}, _a[Type.$id] = id, _a), this);
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
        return this.storage.reduce(function (thenable, storage) {
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
    Plump.prototype.bulkGet = function (type, id) {
        return this.terminal.bulkRead(type, id);
    };
    Plump.prototype.save = function (value) {
        var _this = this;
        if (this.terminal) {
            return Bluebird.resolve()
                .then(function () {
                if (Object.keys(value.attributes).length > 0) {
                    return _this.terminal.writeAttributes(value);
                }
                else {
                    return null;
                }
            })
                .then(function (updated) {
                if (value.relationships && Object.keys(value.relationships).length > 0) {
                    return Bluebird.all(Object.keys(value.relationships).map(function (relName) {
                        return Bluebird.all(value.relationships[relName].map(function (delta) {
                            if (delta.op === 'add') {
                                return _this.terminal.writeRelationshipItem(value, relName, delta);
                            }
                            else if (delta.op === 'remove') {
                                return _this.terminal.deleteRelationshipItem(value, relName, delta);
                            }
                            else if (delta.op === 'modify') {
                                return _this.terminal.writeRelationshipItem(value, relName, delta);
                            }
                            else {
                                throw new Error("Unknown relationship delta " + JSON.stringify(delta));
                            }
                        }));
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
    Plump.prototype.delete = function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.terminal) {
            return (_a = this.terminal).delete.apply(_a, args).then(function () {
                return Bluebird.all(_this.storage.map(function (store) {
                    return store.delete.apply(store, args);
                }));
            });
        }
        else {
            return Promise.reject(new Error('Plump has no terminal store'));
        }
        var _a;
    };
    Plump.prototype.add = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.terminal) {
            return (_a = this.terminal).add.apply(_a, args);
        }
        else {
            return Promise.reject(new Error('Plump has no terminal store'));
        }
        var _a;
    };
    Plump.prototype.restRequest = function (opts) {
        if (this.terminal && this.terminal.rest) {
            return this.terminal.rest(opts);
        }
        else {
            return Promise.reject(new Error('No Rest terminal store'));
        }
    };
    Plump.prototype.modifyRelationship = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.terminal) {
            return (_a = this.terminal).modifyRelationship.apply(_a, args);
        }
        else {
            return Promise.reject(new Error('Plump has no terminal store'));
        }
        var _a;
    };
    Plump.prototype.remove = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.terminal) {
            return (_a = this.terminal).remove.apply(_a, args);
        }
        else {
            return Promise.reject(new Error('Plump has no terminal store'));
        }
        var _a;
    };
    Plump.prototype.invalidate = function (type, id, field) {
        var fields = Array.isArray(field) ? field : [field];
        this.terminal.fireWriteUpdate({ type: type, id: id, invalidate: fields });
    };
    return Plump;
}());
export { Plump };

//# sourceMappingURL=data:application/json;charset=utf8;base64,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LENBQUM7UUFDdEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsRUFBRSxJQUFJLE1BQUEsRUFBRSxFQUFFLElBQUEsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUNsRSxDQUFDO0lBQ0gsWUFBQztBQUFELENBckxBLEFBcUxDLElBQUEiLCJmaWxlIjoicGx1bXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2RlbCB9IGZyb20gJy4vbW9kZWwnO1xuaW1wb3J0IHsgU3ViamVjdCwgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMvUngnO1xuaW1wb3J0ICogYXMgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHsgSW50ZXJmYWNlcyB9IGZyb20gJy4vZGF0YVR5cGVzJztcblxuZXhwb3J0IGNsYXNzIFBsdW1wIHtcblxuICBkZXN0cm95JDogT2JzZXJ2YWJsZTxzdHJpbmc+O1xuXG4gIHByaXZhdGUgdGVhcmRvd25TdWJqZWN0OiBTdWJqZWN0PHN0cmluZz47XG4gIHByaXZhdGUgc3RvcmFnZTogU3RvcmFnZVtdO1xuICBwcml2YXRlIHR5cGVzOiBJbnRlcmZhY2VzLlN0cmluZ0luZGV4ZWQ8TW9kZWw+O1xuICBwcml2YXRlIHRlcm1pbmFsOiBTdG9yYWdlO1xuXG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB7XG4gICAgICBzdG9yYWdlOiBbXSxcbiAgICAgIHR5cGVzOiBbXSxcbiAgICB9LCBvcHRzKTtcbiAgICB0aGlzLnRlYXJkb3duU3ViamVjdCA9IG5ldyBTdWJqZWN0KCk7XG4gICAgdGhpcy5zdG9yYWdlID0gW107XG4gICAgdGhpcy50eXBlcyA9IHt9O1xuICAgIHRoaXMuZGVzdHJveSQgPSB0aGlzLnRlYXJkb3duU3ViamVjdC5hc09ic2VydmFibGUoKTtcbiAgICBvcHRpb25zLnN0b3JhZ2UuZm9yRWFjaCgocykgPT4gdGhpcy5hZGRTdG9yZShzKSk7XG4gICAgb3B0aW9ucy50eXBlcy5mb3JFYWNoKCh0KSA9PiB0aGlzLmFkZFR5cGUodCkpO1xuICB9XG5cbiAgYWRkVHlwZShUKSB7XG4gICAgaWYgKHRoaXMudHlwZXNbVC50eXBlXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnR5cGVzW1QudHlwZV0gPSBUO1xuICAgICAgdGhpcy5zdG9yYWdlLmZvckVhY2gocyA9PiBzLmFkZFR5cGUoVCkpO1xuICAgICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgICAgdGhpcy50ZXJtaW5hbC5hZGRUeXBlKFQpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYER1cGxpY2F0ZSBUeXBlIHJlZ2lzdGVyZWQ6ICR7VC50eXBlfWApO1xuICAgIH1cbiAgfVxuXG4gIHR5cGUoVCkge1xuICAgIHJldHVybiB0aGlzLnR5cGVzW1RdO1xuICB9XG5cbiAgYWRkU3RvcmUoc3RvcmUpIHtcbiAgICBpZiAoc3RvcmUudGVybWluYWwpIHtcbiAgICAgIGlmICh0aGlzLnRlcm1pbmFsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgaGF2ZSBtb3JlIHRoYW4gb25lIHRlcm1pbmFsIHN0b3JlJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnRlcm1pbmFsID0gc3RvcmU7XG4gICAgICAgIHRoaXMuc3RvcmFnZS5mb3JFYWNoKChjYWNoZVN0b3JlKSA9PiB7XG4gICAgICAgICAgY2FjaGVTdG9yZS53aXJlKHN0b3JlLCB0aGlzLmRlc3Ryb3kkKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3RvcmFnZS5wdXNoKHN0b3JlKTtcbiAgICAgIGlmICh0aGlzLnRlcm1pbmFsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgc3RvcmUud2lyZSh0aGlzLnRlcm1pbmFsLCB0aGlzLmRlc3Ryb3kkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCB0eXBlTmFtZSBpbiB0aGlzLnR5cGVzKSB7XG4gICAgICBzdG9yZS5hZGRUeXBlKHRoaXMudHlwZXNbdHlwZU5hbWVdKTtcbiAgICB9XG4gIH1cblxuICBmaW5kKHQsIGlkKSB7XG4gICAgY29uc3QgVHlwZSA9IHR5cGVvZiB0ID09PSAnc3RyaW5nJyA/IHRoaXMudHlwZXNbdF0gOiB0O1xuICAgIHJldHVybiBuZXcgVHlwZSh7IFtUeXBlLiRpZF06IGlkIH0sIHRoaXMpO1xuICB9XG5cbiAgZm9yZ2UodCwgdmFsKSB7XG4gICAgY29uc3QgVHlwZSA9IHR5cGVvZiB0ID09PSAnc3RyaW5nJyA/IHRoaXMudHlwZXNbdF0gOiB0O1xuICAgIHJldHVybiBuZXcgVHlwZSh2YWwsIHRoaXMpO1xuICB9XG5cbiAgdGVhcmRvd24oKSB7XG4gICAgdGhpcy50ZWFyZG93blN1YmplY3QubmV4dCgnZG9uZScpO1xuICB9XG5cbiAgZ2V0KHZhbHVlLCBvcHRzID0gWydhdHRyaWJ1dGVzJ10pIHtcbiAgICBjb25zdCBrZXlzID0gb3B0cyAmJiAhQXJyYXkuaXNBcnJheShvcHRzKSA/IFtvcHRzXSA6IG9wdHM7XG4gICAgcmV0dXJuIHRoaXMuc3RvcmFnZS5yZWR1Y2UoKHRoZW5hYmxlLCBzdG9yYWdlKSA9PiB7XG4gICAgICByZXR1cm4gdGhlbmFibGUudGhlbigodikgPT4ge1xuICAgICAgICBpZiAodiAhPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICB9IGVsc2UgaWYgKHN0b3JhZ2UuaG90KHZhbHVlKSkge1xuICAgICAgICAgIHJldHVybiBzdG9yYWdlLnJlYWQodmFsdWUsIGtleXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LCBQcm9taXNlLnJlc29sdmUobnVsbCkpXG4gICAgLnRoZW4oKHYpID0+IHtcbiAgICAgIGlmICgoKHYgPT09IG51bGwpIHx8ICh2LmF0dHJpYnV0ZXMgPT09IG51bGwpKSAmJiAodGhpcy50ZXJtaW5hbCkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGVybWluYWwucmVhZCh2YWx1ZSwga2V5cyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdjtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGJ1bGtHZXQodHlwZSwgaWQpIHtcbiAgICByZXR1cm4gdGhpcy50ZXJtaW5hbC5idWxrUmVhZCh0eXBlLCBpZCk7XG4gIH1cblxuICBzYXZlKHZhbHVlKSB7XG4gICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKHZhbHVlLmF0dHJpYnV0ZXMpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy50ZXJtaW5hbC53cml0ZUF0dHJpYnV0ZXModmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnRoZW4oKHVwZGF0ZWQpID0+IHtcbiAgICAgICAgaWYgKHZhbHVlLnJlbGF0aW9uc2hpcHMgJiYgT2JqZWN0LmtleXModmFsdWUucmVsYXRpb25zaGlwcykubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoT2JqZWN0LmtleXModmFsdWUucmVsYXRpb25zaGlwcykubWFwKChyZWxOYW1lKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKHZhbHVlLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0ubWFwKChkZWx0YSkgPT4ge1xuICAgICAgICAgICAgICBpZiAoZGVsdGEub3AgPT09ICdhZGQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudGVybWluYWwud3JpdGVSZWxhdGlvbnNoaXBJdGVtKHZhbHVlLCByZWxOYW1lLCBkZWx0YSk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGVsdGEub3AgPT09ICdyZW1vdmUnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudGVybWluYWwuZGVsZXRlUmVsYXRpb25zaGlwSXRlbSh2YWx1ZSwgcmVsTmFtZSwgZGVsdGEpO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRlbHRhLm9wID09PSAnbW9kaWZ5Jykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRlcm1pbmFsLndyaXRlUmVsYXRpb25zaGlwSXRlbSh2YWx1ZSwgcmVsTmFtZSwgZGVsdGEpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biByZWxhdGlvbnNoaXAgZGVsdGEgJHtKU09OLnN0cmluZ2lmeShkZWx0YSl9YCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICB9KSkudGhlbigoKSA9PiB1cGRhdGVkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdXBkYXRlZDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1BsdW1wIGhhcyBubyB0ZXJtaW5hbCBzdG9yZScpKTtcbiAgICB9XG4gIH1cblxuICBkZWxldGUoLi4uYXJncykge1xuICAgIGlmICh0aGlzLnRlcm1pbmFsKSB7XG4gICAgICByZXR1cm4gdGhpcy50ZXJtaW5hbC5kZWxldGUoLi4uYXJncykudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwodGhpcy5zdG9yYWdlLm1hcCgoc3RvcmUpID0+IHtcbiAgICAgICAgICByZXR1cm4gc3RvcmUuZGVsZXRlKC4uLmFyZ3MpO1xuICAgICAgICB9KSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIGFkZCguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXMudGVybWluYWwpIHtcbiAgICAgIHJldHVybiB0aGlzLnRlcm1pbmFsLmFkZCguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignUGx1bXAgaGFzIG5vIHRlcm1pbmFsIHN0b3JlJykpO1xuICAgIH1cbiAgfVxuXG4gIHJlc3RSZXF1ZXN0KG9wdHMpIHtcbiAgICBpZiAodGhpcy50ZXJtaW5hbCAmJiB0aGlzLnRlcm1pbmFsLnJlc3QpIHtcbiAgICAgIHJldHVybiB0aGlzLnRlcm1pbmFsLnJlc3Qob3B0cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ05vIFJlc3QgdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgbW9kaWZ5UmVsYXRpb25zaGlwKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpcy50ZXJtaW5hbCkge1xuICAgICAgcmV0dXJuIHRoaXMudGVybWluYWwubW9kaWZ5UmVsYXRpb25zaGlwKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpcy50ZXJtaW5hbCkge1xuICAgICAgcmV0dXJuIHRoaXMudGVybWluYWwucmVtb3ZlKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbHVtcCBoYXMgbm8gdGVybWluYWwgc3RvcmUnKSk7XG4gICAgfVxuICB9XG5cbiAgaW52YWxpZGF0ZSh0eXBlLCBpZCwgZmllbGQpIHtcbiAgICBjb25zdCBmaWVsZHMgPSBBcnJheS5pc0FycmF5KGZpZWxkKSA/IGZpZWxkIDogW2ZpZWxkXTtcbiAgICB0aGlzLnRlcm1pbmFsLmZpcmVXcml0ZVVwZGF0ZSh7IHR5cGUsIGlkLCBpbnZhbGlkYXRlOiBmaWVsZHMgfSk7XG4gIH1cbn1cbiJdfQ==
