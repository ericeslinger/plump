"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var bluebird_1 = require("bluebird");
var relationship_1 = require("./relationship");
var merge_options_1 = require("merge-options");
var Rx_1 = require("rxjs/Rx");
var $store = Symbol('$store');
var $plump = Symbol('$plump');
var $loaded = Symbol('$loaded');
var $unsubscribe = Symbol('$unsubscribe');
var $subject = Symbol('$subject');
exports.$self = Symbol('$self');
exports.$all = Symbol('$all');
var Model = (function () {
    function Model(opts, plump) {
        var _this = this;
        this[$store] = {};
        this.$relationships = {};
        this[$subject] = new Rx_1.BehaviorSubject();
        this[$subject].next({});
        this[$loaded] = (_a = {},
            _a[exports.$self] = false,
            _a);
        Object.keys(this.constructor.$fields).forEach(function (key) {
            if (_this.constructor.$fields[key].type === 'hasMany') {
                var Rel = _this.constructor.$fields[key].relationship;
                _this.$relationships[key] = new Rel(_this, key, plump);
                _this[$store][key] = [];
                _this[$loaded][key] = false;
            }
            else {
                _this[$store][key] = _this.constructor.$fields[key].default || null;
            }
        });
        this.$$copyValuesFrom(opts || {});
        if (plump) {
            this[$plump] = plump;
        }
        var _a;
    }
    Object.defineProperty(Model.prototype, "$name", {
        get: function () {
            return this.constructor.$name;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Model.prototype, "$id", {
        get: function () {
            return this[$store][this.constructor.$id];
        },
        enumerable: true,
        configurable: true
    });
    Model.prototype.$$copyValuesFrom = function (opts) {
        var _this = this;
        if (opts === void 0) { opts = {}; }
        Object.keys(this.constructor.$fields).forEach(function (fieldName) {
            if (opts[fieldName] !== undefined) {
                if ((_this.constructor.$fields[fieldName].type === 'array') ||
                    (_this.constructor.$fields[fieldName].type === 'hasMany')) {
                    _this[$store][fieldName] = (opts[fieldName] || []).concat();
                    _this[$loaded][fieldName] = true;
                }
                else if (_this.constructor.$fields[fieldName].type === 'object') {
                    _this[$store][fieldName] = Object.assign({}, opts[fieldName]);
                }
                else {
                    _this[$store][fieldName] = opts[fieldName];
                }
            }
        });
        this.$$fireUpdate();
    };
    Model.prototype.$$hookToPlump = function () {
        var _this = this;
        if (this[$unsubscribe] === undefined) {
            this[$unsubscribe] = this[$plump].subscribe(this.constructor.$name, this.$id, function (_a) {
                var field = _a.field, value = _a.value;
                if (field !== undefined) {
                    _this.$$copyValuesFrom((_b = {}, _b[field] = value, _b));
                }
                else {
                    _this.$$copyValuesFrom(value);
                }
                var _b;
            });
        }
    };
    Model.prototype.$subscribe = function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var fields = [exports.$self];
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
        this.$$hookToPlump();
        if (this[$loaded][exports.$self] === false) {
            this[$plump].streamGet(this.constructor, this.$id, fields)
                .subscribe(function (v) { return _this.$$copyValuesFrom(v); });
        }
        return this[$subject].subscribe(cb);
    };
    Model.prototype.$$fireUpdate = function () {
        this[$subject].next(this[$store]);
    };
    Model.prototype.$get = function (opts) {
        var _this = this;
        var keys = [exports.$self];
        if (Array.isArray(opts)) {
            keys = opts;
        }
        else if (opts !== undefined) {
            keys = [opts];
        }
        return bluebird_1.default.all(keys.map(function (key) { return _this.$$singleGet(key); }))
            .then(function (valueArray) {
            var selfIdx = keys.indexOf(exports.$self);
            if ((selfIdx >= 0) && (valueArray[selfIdx] === null)) {
                return null;
            }
            else {
                return valueArray.reduce(function (accum, curr) { return Object.assign(accum, curr); }, {});
            }
        });
    };
    Model.prototype.$$singleGet = function (opt) {
        var _this = this;
        if (opt === void 0) { opt = exports.$self; }
        var key;
        if ((opt !== exports.$self) && (this.constructor.$fields[opt].type !== 'hasMany')) {
            key = exports.$self;
        }
        else {
            key = opt;
        }
        return bluebird_1.default.resolve()
            .then(function () {
            if (key === exports.$self) {
                if (_this[$loaded][exports.$self] === false && _this[$plump]) {
                    return _this[$plump].get(_this.constructor, _this.$id, key);
                }
                else {
                    return true;
                }
            }
            else {
                if ((_this[$loaded][key] === false) && _this[$plump]) {
                    return _this.$relationships[key].$list();
                }
                else {
                    return true;
                }
            }
        }).then(function (v) {
            if (v === true) {
                if (key === exports.$self) {
                    return Object.assign({}, _this[$store]);
                }
                else {
                    return Object.assign({}, (_a = {}, _a[key] = _this[$store][key], _a));
                }
            }
            else if (v && (v[exports.$self] !== null)) {
                _this.$$copyValuesFrom(v);
                _this[$loaded][key] = true;
                if (key === exports.$self) {
                    return Object.assign({}, _this[$store]);
                }
                else {
                    return Object.assign({}, (_b = {}, _b[key] = _this[$store][key], _b));
                }
            }
            else {
                return null;
            }
            var _a, _b;
        });
    };
    Model.prototype.$save = function () {
        return this.$set();
    };
    Model.prototype.$set = function (u) {
        var _this = this;
        if (u === void 0) { u = this[$store]; }
        var update = merge_options_1.default({}, this[$store], u);
        Object.keys(this.constructor.$fields).forEach(function (key) {
            if (_this.constructor.$fields[key].type === 'hasMany') {
                delete update[key];
            }
        });
        return this[$plump].save(this.constructor, update)
            .then(function (updated) {
            _this.$$copyValuesFrom(updated);
            return _this;
        });
    };
    Model.prototype.$delete = function () {
        return this[$plump].delete(this.constructor, this.$id);
    };
    Model.prototype.$rest = function (opts) {
        var restOpts = Object.assign({}, opts, {
            url: "/" + this.constructor.$name + "/" + this.$id + "/" + opts.url,
        });
        return this[$plump].restRequest(restOpts);
    };
    Model.prototype.$add = function (key, item, extras) {
        var _this = this;
        return bluebird_1.default.resolve()
            .then(function () {
            if (_this.constructor.$fields[key].type === 'hasMany') {
                var id = 0;
                if (typeof item === 'number') {
                    id = item;
                }
                else if (item.$id) {
                    id = item.$id;
                }
                else {
                    id = item[_this.constructor.$fields[key].relationship.$sides[key].other.field];
                }
                if ((typeof id === 'number') && (id >= 1)) {
                    return _this[$plump].add(_this.constructor, _this.$id, key, id, extras);
                }
                else {
                    return bluebird_1.default.reject(new Error('Invalid item added to hasMany'));
                }
            }
            else {
                return bluebird_1.default.reject(new Error('Cannot $add except to hasMany field'));
            }
        }).then(function (l) {
            _this.$$copyValuesFrom((_a = {}, _a[key] = l, _a));
            return l;
            var _a;
        });
    };
    Model.prototype.$modifyRelationship = function (key, item, extras) {
        if (this.constructor.$fields[key].type === 'hasMany') {
            var id = 0;
            if (typeof item === 'number') {
                id = item;
            }
            else {
                id = item.$id;
            }
            if ((typeof id === 'number') && (id >= 1)) {
                this[$store][key] = [];
                this[$loaded][key] = false;
                return this[$plump].modifyRelationship(this.constructor, this.$id, key, id, extras);
            }
            else {
                return bluebird_1.default.reject(new Error('Invalid item added to hasMany'));
            }
        }
        else {
            return bluebird_1.default.reject(new Error('Cannot $add except to hasMany field'));
        }
    };
    Model.prototype.$remove = function (key, item) {
        if (this.constructor.$fields[key].type === 'hasMany') {
            var id = 0;
            if (typeof item === 'number') {
                id = item;
            }
            else {
                id = item.$id;
            }
            if ((typeof id === 'number') && (id >= 1)) {
                this[$store][key] = [];
                this[$loaded][key] = false;
                return this[$plump].remove(this.constructor, this.$id, key, id);
            }
            else {
                return bluebird_1.default.reject(new Error('Invalid item $removed from hasMany'));
            }
        }
        else {
            return bluebird_1.default.reject(new Error('Cannot $remove except from hasMany field'));
        }
    };
    Model.prototype.$teardown = function () {
        if (this[$unsubscribe]) {
            this[$unsubscribe].unsubscribe();
        }
    };
    return Model;
}());
exports.Model = Model;
Model.fromJSON = function fromJSON(json) {
    var _this = this;
    this.$id = json.$id || 'id';
    this.$name = json.$name;
    this.$fields = {};
    Object.keys(json.$fields).forEach(function (k) {
        var field = json.$fields[k];
        if (field.type === 'hasMany') {
            var DynamicRelationship = (function (_super) {
                __extends(DynamicRelationship, _super);
                function DynamicRelationship() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                return DynamicRelationship;
            }(relationship_1.Relationship));
            DynamicRelationship.fromJSON(field.relationship);
            _this.$fields[k] = {
                type: 'hasMany',
                relationship: DynamicRelationship,
            };
        }
        else {
            _this.$fields[k] = Object.assign({}, field);
        }
    });
};
Model.toJSON = function toJSON() {
    var _this = this;
    var retVal = {
        $id: this.$id,
        $name: this.$name,
        $fields: {},
    };
    var fieldNames = Object.keys(this.$fields);
    fieldNames.forEach(function (k) {
        if (_this.$fields[k].type === 'hasMany') {
            retVal.$fields[k] = {
                type: 'hasMany',
                relationship: _this.$fields[k].relationship.toJSON(),
            };
        }
        else {
            retVal.$fields[k] = _this.$fields[k];
        }
    });
    return retVal;
};
Model.$rest = function $rest(plump, opts) {
    var restOpts = Object.assign({}, opts, {
        url: "/" + this.$name + "/" + opts.url,
    });
    return plump.restRequest(restOpts);
};
Model.assign = function assign(opts) {
    var _this = this;
    var start = {};
    Object.keys(this.$fields).forEach(function (key) {
        if (opts[key]) {
            start[key] = opts[key];
        }
        else if (_this.$fields[key].default) {
            start[key] = _this.$fields[key].default;
        }
        else if (_this.$fields[key].type === 'hasMany') {
            start[key] = [];
        }
        else {
            start[key] = null;
        }
    });
    return start;
};
Model.$id = 'id';
Model.$name = 'Base';
Model.$self = exports.$self;
Model.$fields = {
    id: {
        type: 'number',
    },
};
