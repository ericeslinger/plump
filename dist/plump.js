'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Plump = exports.types = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.pathExists = pathExists;

var _rxjs = require('rxjs');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var types = exports.types = {};
function pathExists(obj, path) {
    return path.split('.').reduce(function (acc, next) {
        if (acc === false) {
            return false;
        } else {
            if (!!acc[next]) {
                return acc[next];
            } else {
                return false;
            }
        }
    }, obj) !== false;
}

var Plump = exports.Plump = function () {
    function Plump(terminal) {
        _classCallCheck(this, Plump);

        this.terminal = terminal;
        this.types = {};
        this.teardownSubject = new _rxjs.Subject();
        this.terminal.terminal = true;
        this.caches = [];
        this.destroy$ = this.teardownSubject.asObservable();
    }

    _createClass(Plump, [{
        key: 'addType',
        value: function addType(T) {
            var _this = this;

            // addType(T: typeof Model): Promise<void> {
            if (this.types[T.type] === undefined) {
                this.types[T.type] = T;
                return Promise.all(this.caches.map(function (s) {
                    return s.addSchema(T);
                })).then(function () {
                    if (_this.terminal) {
                        _this.terminal.addSchema(T);
                    }
                });
            } else {
                return Promise.reject('Duplicate Type registered: ' + T.type);
            }
        }
    }, {
        key: 'type',
        value: function type(T) {
            return this.types[T];
        }
    }, {
        key: 'getTypes',
        value: function getTypes() {
            var _this2 = this;

            return Object.keys(this.types).map(function (t) {
                return _this2.type(t);
            });
        }
    }, {
        key: 'addCache',
        value: function addCache(store) {
            var _this3 = this;

            this.caches.push(store);
            if (this.terminal !== undefined) {
                Plump.wire(store, this.terminal, this.destroy$);
            }
            return store.addSchemas(Object.keys(this.types).map(function (k) {
                return _this3.types[k];
            }));
        }
        // find<X extends TypeMap, K extends keyof typeof X>(
        //   ref: ModelReference,
        // ): typeof types[K]['prototype'] {
        //   const Type = this.types[ref.type];
        //   return new Type({ [Type.schema.idAttribute]: ref.id }, this);
        // }

    }, {
        key: 'find',
        value: function find(ref) {
            var Type = this.types[ref.type];
            return new Type({ attributes: _defineProperty({}, Type.schema.idAttribute, ref.id) }, this);
        }
    }, {
        key: 'forge',
        value: function forge(t, val) {
            var Type = this.types[t];
            return new Type(val, this);
        }
    }, {
        key: 'teardown',
        value: function teardown() {
            this.teardownSubject.next('done');
        }
    }, {
        key: 'get',
        value: function get(req) {
            var _this4 = this;

            var keys = req.fields.concat();
            if (keys.indexOf('relationships') >= 0) {
                keys.splice(keys.indexOf('relationships'), 1);
                keys.unshift.apply(keys, _toConsumableArray(Object.keys(this.types[req.item.type].schema.relationships).map(function (v) {
                    return 'relationships.' + v;
                })));
            }
            return this.caches.reduce(function (thenable, storage) {
                return thenable.then(function (v) {
                    if (v !== null) {
                        return v;
                    } else if (storage.hot(req.item)) {
                        return storage.read({ item: req.item, fields: keys });
                    } else {
                        return null;
                    }
                });
            }, Promise.resolve(null)).then(function (v) {
                if (_this4.terminal && (v === null || !keys.every(function (path) {
                    return pathExists(v, path);
                }))) {
                    return _this4.terminal.read({ item: req.item, fields: keys });
                } else {
                    return v;
                }
            });
        }
    }, {
        key: 'forceCreate',
        value: function forceCreate(value) {
            return this.save(value, { stripId: false });
        }
    }, {
        key: 'save',
        value: function save(value) {
            var _this5 = this;

            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { stripId: true };

            if (this.terminal) {
                return Promise.resolve().then(function () {
                    var attrs = Object.assign({}, value.attributes);
                    if (options.stripId) {
                        var idAttribute = _this5.types[value.type].schema.idAttribute;
                        if (attrs[idAttribute]) {
                            delete attrs[idAttribute];
                        }
                    }
                    if (Object.keys(attrs).length > 0) {
                        return _this5.terminal.writeAttributes({
                            attributes: value.attributes,
                            id: value.id,
                            type: value.type
                        });
                    } else {
                        return {
                            id: value.id,
                            type: value.type
                        };
                    }
                }).then(function (updated) {
                    if (value.relationships && Object.keys(value.relationships).length > 0) {
                        return Promise.all(Object.keys(value.relationships).map(function (relName) {
                            return value.relationships[relName].reduce(function (thenable, delta) {
                                return thenable.then(function () {
                                    if (delta.op === 'add') {
                                        return _this5.terminal.writeRelationshipItem(updated, relName, delta.data);
                                    } else if (delta.op === 'remove') {
                                        return _this5.terminal.deleteRelationshipItem(updated, relName, delta.data);
                                    } else if (delta.op === 'modify') {
                                        return _this5.terminal.writeRelationshipItem(updated, relName, delta.data);
                                    } else {
                                        throw new Error('Unknown relationship delta ' + JSON.stringify(delta));
                                    }
                                });
                            }, Promise.resolve());
                        })).then(function () {
                            return updated;
                        });
                    } else {
                        return updated;
                    }
                });
            } else {
                return Promise.reject(new Error('Plump has no terminal store'));
            }
        }
    }, {
        key: 'delete',
        value: function _delete(item) {
            var _this6 = this;

            if (this.terminal) {
                return this.terminal.delete(item).then(function () {
                    return Promise.all(_this6.caches.map(function (store) {
                        return store.wipe(item);
                    }));
                }).then(function () {
                    /* noop */
                });
            } else {
                return Promise.reject(new Error('Plump has no terminal store'));
            }
        }
    }, {
        key: 'add',
        value: function add(item, relName, child) {
            if (this.terminal) {
                return this.terminal.writeRelationshipItem(item, relName, child);
            } else {
                return Promise.reject(new Error('Plump has no terminal store'));
            }
        }
        // restRequest(opts) {
        //   if (this.terminal && this.terminal.rest) {
        //     return this.terminal.rest(opts);
        //   } else {
        //     return Promise.reject(new Error('No Rest terminal store'));
        //   }
        // }

    }, {
        key: 'modifyRelationship',
        value: function modifyRelationship(item, relName, child) {
            return this.add(item, relName, child);
        }
    }, {
        key: 'query',
        value: function query(type, q) {
            return this.terminal.query(type, q);
        }
    }, {
        key: 'deleteRelationshipItem',
        value: function deleteRelationshipItem(item, relName, child) {
            if (this.terminal) {
                return this.terminal.deleteRelationshipItem(item, relName, child);
            } else {
                return Promise.reject(new Error('Plump has no terminal store'));
            }
        }
    }, {
        key: 'invalidate',
        value: function invalidate(item, field) {
            var fields = Array.isArray(field) ? field : [field];
            this.terminal.fireWriteUpdate({
                type: item.type,
                id: item.id,
                invalidate: fields
            });
        }
    }], [{
        key: 'wire',
        value: function wire(me, they, shutdownSignal) {
            if (me.terminal) {
                throw new Error('Cannot wire a terminal store into another store');
            } else {
                // TODO: figure out where the type data comes from.
                they.read$.takeUntil(shutdownSignal).subscribe(function (v) {
                    me.cache(v);
                });
                they.write$.takeUntil(shutdownSignal).subscribe(function (v) {
                    v.invalidate.forEach(function (invalid) {
                        me.wipe(v, invalid);
                    });
                });
            }
        }
    }]);

    return Plump;
}();