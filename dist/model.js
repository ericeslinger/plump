'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Model = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mergeOptions = require('merge-options');

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _deepEqual = require('deep-equal');

var deepEqual = _interopRequireWildcard(_deepEqual);

var _rxjs = require('rxjs');

var _plump = require('./plump');

var _errors = require('./errors');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// TODO: figure out where error events originate (storage or model)
// and who keeps a roll-backable delta
function condMerge(arg) {
    var args = arg.filter(function (v) {
        return !!v;
    });
    if (args[0] && args[0].empty && args.length > 1) {
        delete args[0].empty;
    }
    return _mergeOptions2.default.apply(undefined, _toConsumableArray(args));
}

var Model = exports.Model = function () {
    function Model(opts, plump) {
        _classCallCheck(this, Model);

        this.plump = plump;
        this._write$ = new _rxjs.Subject();
        this._dirty$ = new _rxjs.Subject();
        this.dirty$ = this._dirty$.asObservable().startWith(false);
        this.error = null;
        if (this.type === 'BASE') {
            throw new TypeError('Cannot instantiate base plump Models, please subclass with a schema and valid type');
        }
        var initialValue = opts;
        if (opts.id && !opts.attributes) {
            initialValue = { attributes: _defineProperty({}, this.schema.idAttribute, opts.id) };
        }
        this.dirty = {
            attributes: {},
            relationships: {}
        };
        this.$$copyValuesFrom(initialValue);
        // this.$$fireUpdate(opts);
    }

    _createClass(Model, [{
        key: 'empty',
        value: function empty(id, error) {
            return this.constructor['empty'](id, error);
        }
    }, {
        key: 'dirtyFields',
        value: function dirtyFields() {
            var _this = this;

            return Object.keys(this.dirty.attributes).filter(function (k) {
                return k !== _this.schema.idAttribute;
            }).concat(Object.keys(this.dirty.relationships));
        }
    }, {
        key: '$$copyValuesFrom',
        value: function $$copyValuesFrom() {
            var _this2 = this;

            var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            // const idField = this.constructor.$id in opts ? this.constructor.$id : 'id';
            // this[this.constructor.$id] = opts[idField] || this.id;
            if (this.id === undefined && (opts.id || opts.attributes && opts.attributes[this.schema.idAttribute])) {
                if (opts.id) {
                    this.id = opts.id;
                    if (!opts.attributes) {
                        opts.attributes = {};
                    }
                    if (!opts.attributes[this.schema.idAttribute]) {
                        opts.attributes[this.schema.idAttribute] = this.id;
                    }
                } else if (opts.attributes && opts.attributes[this.schema.idAttribute]) {
                    this.id = this.schema.attributes[this.schema.idAttribute].type === 'number' ? parseInt(opts.attributes[this.schema.idAttribute], 10) : opts.attributes[this.schema.idAttribute];
                }
            }
            var sanitized = Object.keys(opts.attributes || {}).filter(function (k) {
                return k in _this2.schema.attributes;
            }).map(function (k) {
                return _defineProperty({}, k, opts.attributes[k]);
            }).reduce(function (acc, curr) {
                return (0, _mergeOptions2.default)(acc, curr);
            }, {});
            this.dirty = (0, _mergeOptions2.default)(this.dirty, { attributes: sanitized });
        }
    }, {
        key: '$$resetDirty',
        value: function $$resetDirty() {
            this.dirty = {
                attributes: {},
                relationships: {}
            };
            this.$$fireUpdate();
        }
    }, {
        key: '$$fireUpdate',
        value: function $$fireUpdate() {
            var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            if (!this.id || force) {
                this._write$.next({
                    attributes: this.dirty.attributes,
                    type: this.type
                });
            }
            this._dirty$.next(this.dirtyFields().length !== 0);
        }
    }, {
        key: 'get',
        value: function get(req) {
            var _this3 = this;

            // If opts is falsy (i.e., undefined), get attributes
            // Otherwise, get what was requested,
            // wrapping the request in a Array if it wasn't already one
            return this.plump.get((0, _mergeOptions2.default)({}, req, {
                item: { id: this.id, type: this.type }
            })).catch(function (e) {
                _this3.error = e;
                return null;
            }).then(function (self) {
                if (!self && _this3.dirtyFields().length === 0) {
                    if (_this3.id) {
                        _this3.error = new _errors.NotFoundError();
                    }
                    return null;
                } else if (_this3.dirtyFields().length === 0) {
                    return self;
                } else {
                    var resolved = Model.resolveAndOverlay(_this3.dirty, self || undefined);
                    return (0, _mergeOptions2.default)({}, self || { id: _this3.id, type: _this3.type }, resolved);
                }
            });
        }
        // TODO: Should $save ultimately return this.get()?

    }, {
        key: 'create',
        value: function create() {
            return this.save({ stripId: false });
        }
    }, {
        key: 'save',
        value: function save() {
            var _this4 = this;

            var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { stripId: true };

            var update = (0, _mergeOptions2.default)({ id: this.id, type: this.type }, this.dirty);
            if (Object.keys(this.dirty.attributes).length + Object.keys(this.dirty.relationships).length > 0) {
                return this.plump.save(update, opts).then(function (updated) {
                    _this4.$$resetDirty();
                    if (updated.id) {
                        _this4.id = updated.id;
                    }
                    return _this4.get({ fields: ['attributes', 'relationships'] });
                }).catch(function (err) {
                    throw err;
                });
            } else {
                return Promise.resolve(null);
            }
        }
    }, {
        key: 'set',
        value: function set(update) {
            var wide = update.attributes || update;
            this.$$copyValuesFrom({ attributes: wide });
            this.$$fireUpdate();
            return this;
        }
    }, {
        key: 'parseOpts',
        value: function parseOpts(opts) {
            if (Array.isArray(opts) || typeof opts === 'string') {
                var fields = Array.isArray(opts) ? opts.concat() : [opts];
                if (fields.indexOf('relationships') >= 0) {
                    fields.splice(fields.indexOf('relationships'), 1);
                    fields = fields.concat(Object.keys(this.schema.relationships).map(function (k) {
                        return 'relationships.' + k;
                    }));
                }
                return {
                    fields: fields,
                    item: {
                        id: this.id,
                        type: this.type
                    },
                    view: 'default'
                };
            } else {
                return Object.assign({}, opts, {
                    item: {
                        id: this.id,
                        type: this.type
                    }
                });
            }
        }
    }, {
        key: 'asObservable',
        value: function asObservable(opts) {
            var _this5 = this;

            var hots = this.plump.caches.filter(function (s) {
                return s.hot(_this5);
            });
            var colds = this.plump.caches.filter(function (s) {
                return !s.hot(_this5);
            });
            var terminal = this.plump.terminal;
            var readReq = this.parseOpts(opts || { fields: ['attributes', 'relationships'] });
            var preload$ = _rxjs.Observable.from(hots).flatMap(function (s) {
                return _rxjs.Observable.fromPromise(s.read(readReq));
            }).defaultIfEmpty(null).flatMap(function (v) {
                if (!!v && readReq.fields.every(function (f) {
                    return (0, _plump.pathExists)(v, f);
                })) {
                    return _rxjs.Observable.of(v);
                } else {
                    var terminal$ = _rxjs.Observable.fromPromise(terminal.read(readReq).then(function (terminalValue) {
                        if (terminalValue === null) {
                            throw new _errors.NotFoundError();
                            // return null;
                        } else {
                            return terminalValue;
                        }
                    }));
                    // .catch(() => {
                    //   return Observable.of(this.empty(this.id, 'load error'));
                    // });
                    var cold$ = _rxjs.Observable.from(colds).flatMap(function (s) {
                        return _rxjs.Observable.fromPromise(s.read(readReq));
                    });
                    // .startWith(undefined);
                    return _rxjs.Observable.merge(terminal$, cold$.takeUntil(terminal$));
                }
            });
            var watchWrite$ = terminal.write$.filter(function (v) {
                return v.type === _this5.type && v.id === _this5.id // && v.invalidate.some(i => fields.indexOf(i) >= 0)
                ;
            }).flatMapTo(_rxjs.Observable.of(terminal).flatMap(function (s) {
                return _rxjs.Observable.fromPromise(s.read(Object.assign({}, readReq, { force: true })));
            })).startWith(null);
            return _rxjs.Observable.combineLatest(_rxjs.Observable.of(this.empty(this.id)), preload$, watchWrite$, this._write$.asObservable().startWith(null), _rxjs.Scheduler.queue).map(function (a) {
                return condMerge(a);
            }).map(function (v) {
                v.relationships = Model.resolveRelationships(_this5.dirty.relationships, v.relationships);
                return v;
            }).distinctUntilChanged(deepEqual).share();
        }
    }, {
        key: 'delete',
        value: function _delete() {
            return this.plump.delete(this);
        }
    }, {
        key: 'add',
        value: function add(key, item) {
            var toAdd = Object.assign({}, { type: this.schema.relationships[key].type.sides[key].otherType }, item);
            if (key in this.schema.relationships) {
                if (item.id >= 1) {
                    if (this.dirty.relationships[key] === undefined) {
                        this.dirty.relationships[key] = [];
                    }
                    this.dirty.relationships[key].push({
                        op: 'add',
                        data: toAdd
                    });
                    this.$$fireUpdate(true);
                    return this;
                } else {
                    throw new Error('Invalid item added to hasMany');
                }
            } else {
                throw new Error('Cannot $add except to hasMany field');
            }
        }
    }, {
        key: 'modifyRelationship',
        value: function modifyRelationship(key, item) {
            var toAdd = Object.assign({}, { type: this.schema.relationships[key].type.sides[key].otherType }, item);
            if (key in this.schema.relationships) {
                if (item.id >= 1) {
                    this.dirty.relationships[key] = this.dirty.relationships[key] || [];
                    this.dirty.relationships[key].push({
                        op: 'modify',
                        data: toAdd
                    });
                    this.$$fireUpdate(true);
                    return this;
                } else {
                    throw new Error('Invalid item added to hasMany');
                }
            } else {
                throw new Error('Cannot $add except to hasMany field');
            }
        }
    }, {
        key: 'remove',
        value: function remove(key, item) {
            var toAdd = Object.assign({}, { type: this.schema.relationships[key].type.sides[key].otherType }, item);
            if (key in this.schema.relationships) {
                if (item.id >= 1) {
                    if (!(key in this.dirty.relationships)) {
                        this.dirty.relationships[key] = [];
                    }
                    this.dirty.relationships[key].push({
                        op: 'remove',
                        data: toAdd
                    });
                    this.$$fireUpdate(true);
                    return this;
                } else {
                    throw new Error('Invalid item $removed from hasMany');
                }
            } else {
                throw new Error('Cannot $remove except from hasMany field');
            }
        }
    }, {
        key: 'type',
        get: function get() {
            return this.constructor['type'];
        }
    }, {
        key: 'schema',
        get: function get() {
            return this.constructor['schema'];
        }
    }], [{
        key: 'empty',
        value: function empty(id, error) {
            var _this6 = this;

            var retVal = {
                id: id,
                type: this.type,
                empty: true,
                error: error,
                attributes: {},
                relationships: {}
            };
            Object.keys(this.schema.attributes).forEach(function (key) {
                if (_this6.schema.attributes[key].type === 'number') {
                    retVal.attributes[key] = _this6.schema.attributes[key].default || 0;
                } else if (_this6.schema.attributes[key].type === 'date') {
                    retVal.attributes[key] = new Date(_this6.schema.attributes[key].default || Date.now());
                } else if (_this6.schema.attributes[key].type === 'string') {
                    retVal.attributes[key] = _this6.schema.attributes[key].default || '';
                } else if (_this6.schema.attributes[key].type === 'object') {
                    retVal.attributes[key] = Object.assign({}, _this6.schema.attributes[key].default);
                } else if (_this6.schema.attributes[key].type === 'array') {
                    retVal.attributes[key] = (_this6.schema.attributes[key].default || []).concat();
                }
            });
            Object.keys(this.schema.relationships).forEach(function (key) {
                retVal.relationships[key] = [];
            });
            return retVal;
        }
    }, {
        key: 'applyDelta',
        value: function applyDelta(current, delta) {
            if (delta.op === 'add' || delta.op === 'modify') {
                var retVal = (0, _mergeOptions2.default)({}, current, delta.data);
                return retVal;
            } else if (delta.op === 'remove') {
                return undefined;
            } else {
                return current;
            }
        }
    }, {
        key: 'resolveAndOverlay',
        value: function resolveAndOverlay(update) {
            var base = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
                attributes: {},
                relationships: {}
            };

            var attributes = (0, _mergeOptions2.default)({}, base.attributes, update.attributes);
            var resolvedRelationships = this.resolveRelationships(update.relationships, base.relationships);
            return { attributes: attributes, relationships: resolvedRelationships };
        }
    }, {
        key: 'resolveRelationships',
        value: function resolveRelationships(deltas) {
            var _this7 = this;

            var base = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            var updates = Object.keys(deltas).map(function (relName) {
                var resolved = _this7.resolveRelationship(deltas[relName], base[relName]);
                return _defineProperty({}, relName, resolved);
            }).reduce(function (acc, curr) {
                return (0, _mergeOptions2.default)(acc, curr);
            }, {});
            return (0, _mergeOptions2.default)({}, base, updates);
        }
    }, {
        key: 'resolveRelationship',
        value: function resolveRelationship(deltas) {
            var base = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

            var retVal = base.concat();
            deltas.forEach(function (delta) {
                if (delta.op === 'add' || delta.op === 'modify') {
                    var currentIndex = retVal.findIndex(function (v) {
                        return v.id === delta.data.id;
                    });
                    if (currentIndex >= 0) {
                        retVal[currentIndex] = delta.data;
                    } else {
                        retVal.push(delta.data);
                    }
                } else if (delta.op === 'remove') {
                    var _currentIndex = retVal.findIndex(function (v) {
                        return v.id === delta.data.id;
                    });
                    if (_currentIndex >= 0) {
                        retVal.splice(_currentIndex, 1);
                    }
                }
            });
            return retVal;
        }
    }]);

    return Model;
}();

Model.type = 'BASE';
Model.schema = {
    idAttribute: 'id',
    name: 'BASE',
    attributes: {},
    relationships: {}
};