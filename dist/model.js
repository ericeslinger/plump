"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var merge_options_1 = require("merge-options");
var Rx_1 = require("rxjs/Rx");
var util_1 = require("./util");
var $dirty = Symbol('$dirty');
var $plump = Symbol('$plump');
var $unsubscribe = Symbol('$unsubscribe');
var $subject = Symbol('$subject');
var Model = (function () {
    function Model(opts, plump) {
        if (plump) {
            this[$plump] = plump;
        }
        else {
            throw new Error('Cannot construct Plump model without a Plump');
        }
        this[$dirty] = {
            attributes: {},
            relationships: {},
        };
        this.$$copyValuesFrom(opts);
    }
    Object.defineProperty(Model.prototype, "type", {
        get: function () {
            return this.constructor.type;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Model.prototype, "$fields", {
        get: function () {
            return Object.keys(this.$schema.attributes)
                .concat(Object.keys(this.$schema.relationships));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Model.prototype, "$schema", {
        get: function () {
            return this.constructor.$schema;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Model.prototype, "$dirtyFields", {
        get: function () {
            var _this = this;
            return Object.keys(this[$dirty])
                .map(function (k) { return Object.keys(_this[$dirty][k]); })
                .reduce(function (acc, curr) { return acc.concat(curr); }, [])
                .filter(function (k) { return k !== _this.constructor.$id; })
                .reduce(function (acc, curr) { return acc.concat(curr); }, []);
        },
        enumerable: true,
        configurable: true
    });
    Model.prototype.$$copyValuesFrom = function (opts) {
        if (opts === void 0) { opts = {}; }
        if ((this.id === undefined) && (opts[this.constructor.$id])) {
            this.id = opts[this.constructor.$id];
        }
        this[$dirty] = merge_options_1.default(this[$dirty], { attributes: opts });
    };
    Model.prototype.$$resetDirty = function (opts) {
        var _this = this;
        var key = opts || this.$dirtyFields;
        var newDirty = { attributes: {}, relationships: {} };
        var keys = Array.isArray(key) ? key : [key];
        Object.keys(this[$dirty]).forEach(function (schemaField) {
            for (var field in _this[$dirty][schemaField]) {
                if (keys.indexOf(field) < 0) {
                    var val = _this[$dirty][schemaField][field];
                    newDirty[schemaField][field] = typeof val === 'object' ? merge_options_1.default({}, val) : val;
                }
            }
        });
        this[$dirty] = newDirty;
    };
    Model.prototype.$$fireUpdate = function (v) {
        var update = this.constructor.resolveAndOverlay(this[$dirty], v);
        if (this.$id) {
            update.id = this.$id;
        }
        this[$subject].next(update);
    };
    Model.prototype.$teardown = function () {
        if (this[$unsubscribe]) {
            this[$unsubscribe].unsubscribe();
        }
    };
    Model.prototype.get = function (opts) {
        var _this = this;
        if (opts === void 0) { opts = 'attributes'; }
        var keys = opts && !Array.isArray(opts) ? [opts] : opts;
        return this[$plump].get(this, keys)
            .then(function (self) {
            if (!self && _this.$dirtyFields.length === 0) {
                return null;
            }
            else if (_this.$dirtyFields.length === 0) {
                return self;
            }
            else {
                var resolved = _this.constructor.resolveAndOverlay(_this[$dirty], self || undefined);
                return merge_options_1.default({}, self || { id: _this.id, type: _this.type }, resolved);
            }
        });
    };
    Model.prototype.bulkGet = function () {
        return this[$plump].bulkGet(this.constructor, this.$id);
    };
    Model.prototype.save = function (opts) {
        var _this = this;
        var options = opts || this.$fields;
        var keys = Array.isArray(options) ? options : [options];
        var update = Object.keys(this[$dirty]).map(function (schemaField) {
            var value = Object.keys(_this[$dirty][schemaField])
                .filter(function (key) { return keys.indexOf(key) >= 0; })
                .map(function (key) {
                return (_a = {}, _a[key] = _this[$dirty][schemaField][key], _a);
                var _a;
            })
                .reduce(function (acc, curr) { return Object.assign(acc, curr); }, {});
            return _a = {}, _a[schemaField] = value, _a;
            var _a;
        })
            .reduce(function (acc, curr) { return merge_options_1.default(acc, curr); }, { id: this.$id, type: this.constructor.type });
        if (this.$id !== undefined) {
            update.id = this.$id;
        }
        update.type = this.type;
        return this[$plump].save(update)
            .then(function (updated) {
            _this.$$resetDirty(opts);
            if (updated.id) {
                _this[_this.constructor.$id] = updated.id;
                _this.id = updated.id;
            }
            return _this.get();
        });
    };
    Model.prototype.set = function (update) {
        var _this = this;
        var flat = update.attributes || update;
        var sanitized = Object.keys(flat)
            .filter(function (k) { return k in _this.$schema.attributes; })
            .map(function (k) {
            return _a = {}, _a[k] = flat[k], _a;
            var _a;
        })
            .reduce(function (acc, curr) { return merge_options_1.default(acc, curr); }, {});
        this.$$copyValuesFrom(sanitized);
        return this;
    };
    Model.prototype.subscribe = function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var fields = ['attributes'];
        var cb;
        if (args.length === 2) {
            fields = args[0];
            if (!Array.isArray(fields)) {
                fields = [fields];
            }
            cb = args[1];
        }
        else {
            cb = args[0];
        }
        var hots = this[$plump].stores.filter(function (s) { return s.hot(_this.type, _this.$id); });
        var colds = this[$plump].stores.filter(function (s) { return !s.hot(_this.type, _this.$id); });
        var terminal = this[$plump].stores.filter(function (s) { return s.terminal === true; });
        var preload$ = Rx_1.default.Observable.from(hots)
            .flatMap(function (s) { return Rx_1.default.Observable.fromPromise(s.read(_this.type, _this.$id, fields)); })
            .defaultIfEmpty(null)
            .flatMap(function (v) {
            if (v !== null) {
                return Rx_1.default.Observable.of(v);
            }
            else {
                var terminal$ = Rx_1.default.Observable.from(terminal)
                    .flatMap(function (s) { return Rx_1.default.Observable.fromPromise(s.read(_this.type, _this.$id, fields)); })
                    .share();
                var cold$ = Rx_1.default.Observable.from(colds)
                    .flatMap(function (s) { return Rx_1.default.Observable.fromPromise(s.read(_this.type, _this.$id, fields)); });
                return Rx_1.default.Observable.merge(terminal$, cold$.takeUntil(terminal$));
            }
        });
        var watchWrite$ = Rx_1.default.Observable.from(terminal)
            .flatMap(function (s) { return s.write$; })
            .filter(function (v) {
            return ((v.type === _this.type) &&
                (v.id === _this.$id) &&
                (v.invalidate.some(function (i) { return fields.indexOf(i) >= 0; })));
        })
            .flatMapTo(Rx_1.default.Observable.from(terminal)
            .flatMap(function (s) { return Rx_1.default.Observable.fromPromise(s.read(_this.type, _this.$id, fields)); }));
        return preload$.merge(watchWrite$)
            .subscribe(cb);
    };
    Model.prototype.delete = function () {
        return this[$plump].delete(this);
    };
    Model.prototype.$rest = function (opts) {
        var _this = this;
        var restOpts = Object.assign({}, opts, {
            url: "/" + this.constructor.type + "/" + this.$id + "/" + opts.url,
        });
        return this[$plump].restRequest(restOpts).then(function (data) { return _this.constructor.schematize(data); });
    };
    Model.prototype.add = function (key, item) {
        if (key in this.$schema.relationships) {
            if (item.id >= 1) {
                this[$dirty].relationships[key] = this[$dirty].relationships[key] || [];
                this[$dirty].relationships[key].push({
                    op: 'add',
                    data: item,
                });
                return this;
            }
            else {
                throw new Error('Invalid item added to hasMany');
            }
        }
        else {
            throw new Error('Cannot $add except to hasMany field');
        }
    };
    Model.prototype.modifyRelationship = function (key, item) {
        if (key in this.$schema.relationships) {
            if (item.id >= 1) {
                this[$dirty].relationships[key] = this[$dirty].relationships[key] || [];
                this[$dirty].relationships[key].push({
                    op: 'modify',
                    data: item,
                });
                return this;
            }
            else {
                throw new Error('Invalid item added to hasMany');
            }
        }
        else {
            throw new Error('Cannot $add except to hasMany field');
        }
    };
    Model.prototype.remove = function (key, item) {
        if (key in this.$schema.relationships) {
            if (item.id >= 1) {
                if (!(key in this[$dirty].relationships)) {
                    this[$dirty].relationships[key] = [];
                }
                this[$dirty].relationships[key].push({
                    op: 'remove',
                    data: item,
                });
                return this;
            }
            else {
                throw new Error('Invalid item $removed from hasMany');
            }
        }
        else {
            throw new Error('Cannot $remove except from hasMany field');
        }
    };
    return Model;
}());
exports.Model = Model;
Model.$rest = function $rest(plump, opts) {
    var restOpts = Object.assign({}, opts, {
        url: "/" + this.type + "/" + opts.url,
    });
    return plump.restRequest(restOpts);
};
Model.addDelta = function addDelta(relName, relationship) {
    var _this = this;
    return relationship.map(function (rel) {
        var relSchema = _this.$schema.relationships[relName].type.$sides[relName];
        var schematized = { op: 'add', data: { id: rel[relSchema.other.field] } };
        for (var relField in rel) {
            if (!(relField === relSchema.self.field || relField === relSchema.other.field)) {
                schematized.data[relField] = rel[relField];
            }
        }
        return schematized;
    });
};
Model.applyDefaults = function applyDefaults(v) {
    return util_1.validateInput(this, v);
};
Model.applyDelta = function applyDelta(current, delta) {
    if (delta.op === 'add' || delta.op === 'modify') {
        var retVal = merge_options_1.default({}, current, delta.data);
        return retVal;
    }
    else if (delta.op === 'remove') {
        return undefined;
    }
    else {
        return current;
    }
};
Model.cacheGet = function cacheGet(store, key) {
    return (this.$$storeCache.get(store) || {})[key];
};
Model.cacheSet = function cacheSet(store, key, value) {
    if (this.$$storeCache.get(store) === undefined) {
        this.$$storeCache.set(store, {});
    }
    this.$$storeCache.get(store)[key] = value;
};
Model.resolveAndOverlay = function resolveAndOverlay(update, base) {
    if (base === void 0) { base = { attributes: {}, relationships: {} }; }
    var attributes = merge_options_1.default({}, base.attributes, update.attributes);
    var resolvedRelationships = this.resolveRelationships(update.relationships, base.relationships);
    return { attributes: attributes, relationships: resolvedRelationships };
};
Model.resolveRelationships = function resolveRelationships(deltas, base) {
    var _this = this;
    if (base === void 0) { base = {}; }
    var updates = Object.keys(deltas).map(function (relName) {
        var resolved = _this.resolveRelationship(deltas[relName], base[relName]);
        return _a = {}, _a[relName] = resolved, _a;
        var _a;
    })
        .reduce(function (acc, curr) { return merge_options_1.default(acc, curr); }, {});
    return merge_options_1.default({}, base, updates);
};
Model.resolveRelationship = function resolveRelationship(deltas, base) {
    var _this = this;
    if (base === void 0) { base = []; }
    var updates = base.map(function (rel) {
        return _a = {}, _a[rel.id] = rel, _a;
        var _a;
    }).reduce(function (acc, curr) { return merge_options_1.default(acc, curr); }, {});
    deltas.forEach(function (delta) {
        var childId = delta.data ? delta.data.id : delta.id;
        updates[childId] = delta.op ? _this.applyDelta(updates[childId], delta) : delta;
    });
    return Object.keys(updates)
        .map(function (id) { return updates[id]; })
        .filter(function (rel) { return rel !== undefined; })
        .reduce(function (acc, curr) { return acc.concat(curr); }, []);
};
Model.$$storeCache = new Map();
Model.$id = 'id';
Model.type = 'Base';
Model.$schema = {
    $name: 'base',
    $id: 'id',
    attributes: {},
    relationships: {},
};
Model.$included = [];
