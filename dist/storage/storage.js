'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Storage = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* eslint no-unused-vars: 0 */

// import { validateInput } from '../util';


var _mergeOptions = require('merge-options');

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _rxjs = require('rxjs');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// type: an object that defines the type. typically this will be
// part of the Model class hierarchy, but Storage objects call no methods
// on the type object. We only are interested in Type.$name, Type.$id and Type.$schema.
// Note that Type.$id is the *name of the id field* on instances
//    and NOT the actual id field (e.g., in most cases, Type.$id === 'id').
// id: unique id. Often an integer, but not necessary (could be an oid)
// hasMany relationships are treated like id arrays. So, add / remove / has
// just stores and removes integers.
var Storage = exports.Storage = function () {
    // public types: Model[]; TODO: figure this out
    function Storage() {
        var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, Storage);

        // a "terminal" storage facility is the end of the storage chain.
        // usually sql on the server side and rest on the client side, it *must*
        // receive the writes, and is the final authoritative answer on whether
        // something is 404.
        this.inProgress = {};
        this.types = {};
        this.readSubject = new _rxjs.Subject();
        this.writeSubject = new _rxjs.Subject();
        this.read$ = this.readSubject.asObservable();
        this.write$ = this.writeSubject.asObservable();
        // terminal facilities are also the only ones that can authoritatively answer
        // authorization questions, but the design may allow for authorization to be
        // cached.
        this.terminal = opts.terminal || false;
    }

    _createClass(Storage, [{
        key: 'readRelationships',
        value: function readRelationships(req, relationships) {
            var _this = this;

            return Promise.all(relationships.map(function (r) {
                return _this.readRelationship(Object.assign({}, req, { rel: r }));
            })).then(function (rA) {
                return rA.reduce(function (a, r) {
                    return (0, _mergeOptions2.default)(a, r || {});
                }, {
                    type: req.item.type,
                    id: req.item.id,
                    attributes: {},
                    relationships: {}
                });
            });
        }
        // debounces reads so multiple requests for the same thing return the same promise.

    }, {
        key: 'read',
        value: function read(req) {
            var _this2 = this;

            var reqKey = req.item.type + ':' + req.item.id + ' - ' + req.fields.join(';');
            if (req.force) {
                return this._read(req);
            } else {
                if (this.inProgress[reqKey] === undefined || this.inProgress[reqKey] === null) {
                    this.inProgress[reqKey] = this._read(req).then(function (result) {
                        delete _this2.inProgress[reqKey];
                        return result;
                    });
                }
                return this.inProgress[reqKey];
            }
        }
        // does the actual read

    }, {
        key: '_read',
        value: function _read(req) {
            var _this3 = this;

            var schema = this.getSchema(req.item.type);
            return this.readAttributes(req).then(function (attributes) {
                if (!attributes) {
                    return null;
                    // throw new NotFoundError();
                } else {
                    if (attributes.id && attributes.attributes && !attributes.attributes[schema.idAttribute]) {
                        attributes.attributes[schema.idAttribute] = attributes.id; // eslint-disable-line no-param-reassign
                    }
                    // load in default values
                    if (attributes.attributes) {
                        for (var attrName in schema.attributes) {
                            if (!attributes.attributes[attrName] && schema.attributes[attrName].default !== undefined) {
                                if (Array.isArray(schema.attributes[attrName].default)) {
                                    attributes.attributes[attrName] = schema.attributes[attrName].default.concat();
                                } else if (_typeof(schema.attributes[attrName].default) === 'object') {
                                    attributes.attributes[attrName] = Object.assign({}, schema.attributes[attrName].default);
                                } else {
                                    attributes.attributes[attrName] = schema.attributes[attrName].default;
                                }
                            }
                        }
                    }
                    var relsWanted = req.fields.indexOf('relationships') >= 0 ? Object.keys(schema.relationships) : req.fields.map(function (k) {
                        return k.split('.');
                    }).filter(function (ka) {
                        return ka[0] === 'relationships';
                    }).map(function (ka) {
                        return ka[1];
                    });
                    var relsToFetch = relsWanted.filter(function (relName) {
                        return !attributes.relationships[relName];
                    });
                    // readAttributes can return relationship data, so don't fetch those
                    if (relsToFetch.length > 0) {
                        return _this3.readRelationships(req, relsToFetch).then(function (rels) {
                            return (0, _mergeOptions2.default)(attributes, rels);
                        });
                    } else {
                        return attributes;
                    }
                }
            }).then(function (result) {
                if (result) {
                    Object.keys(result.relationships).forEach(function (relName) {
                        result.relationships[relName].forEach(function (relItem) {
                            relItem.type = _this3.getSchema(result.type).relationships[relName].type.sides[relName].otherType;
                        });
                    });
                    _this3.fireReadUpdate(result);
                }
                return result;
            });
        }
    }, {
        key: 'hot',
        value: function hot(item) {
            // t: type, id: id (integer).
            // if hot, then consider this value authoritative, no need to go down
            // the datastore chain. Consider a memorystorage used as a top-level cache.
            // if the memstore has the value, it's hot and up-to-date. OTOH, a
            // localstorage cache may be an out-of-date value (updated since last seen)
            // this design lets hot be set by type and id. In particular, the goal for the
            // front-end is to have profile objects be hot-cached in the memstore, but nothing
            // else (in order to not run the browser out of memory)
            return false;
        }
    }, {
        key: 'validateInput',
        value: function validateInput(value) {
            var schema = this.getSchema(value.type);
            var retVal = {
                type: value.type,
                id: value.id,
                attributes: {},
                relationships: {}
            };
            var typeAttrs = Object.keys(schema.attributes || {});
            var valAttrs = Object.keys(value.attributes || {});
            var typeRels = Object.keys(schema.relationships || {});
            var valRels = Object.keys(value.relationships || {});
            var idAttribute = schema.idAttribute;
            var invalidAttrs = valAttrs.filter(function (item) {
                return typeAttrs.indexOf(item) < 0;
            });
            var invalidRels = valRels.filter(function (item) {
                return typeRels.indexOf(item) < 0;
            });
            if (invalidAttrs.length > 0) {
                throw new Error('Invalid attributes on value object: ' + JSON.stringify(invalidAttrs));
            }
            if (invalidRels.length > 0) {
                throw new Error('Invalid relationships on value object: ' + JSON.stringify(invalidRels));
            }
            if (value.attributes[idAttribute] && !retVal.id) {
                retVal.id = value.attributes[idAttribute];
            }
            for (var relName in schema.relationships) {
                if (value.relationships && value.relationships[relName] && !Array.isArray(value.relationships[relName])) {
                    throw new Error('relation ' + relName + ' is not an array');
                }
            }
            return (0, _mergeOptions2.default)({}, value, retVal);
        }
        // store type info data on the store itself

    }, {
        key: 'getSchema',
        value: function getSchema(t) {
            if (typeof t === 'string') {
                return this.types[t];
            } else if (t['schema']) {
                return t.schema;
            } else {
                return t;
            }
        }
    }, {
        key: 'addSchema',
        value: function addSchema(t) {
            this.types[t.type] = t.schema;
            return Promise.resolve();
        }
    }, {
        key: 'addSchemas',
        value: function addSchemas(a) {
            var _this4 = this;

            return Promise.all(a.map(function (t) {
                return _this4.addSchema(t);
            })).then(function () {
                /* noop */
            });
        }
    }, {
        key: 'fireWriteUpdate',
        value: function fireWriteUpdate(val) {
            this.writeSubject.next(val);
            return Promise.resolve(val);
        }
    }, {
        key: 'fireReadUpdate',
        value: function fireReadUpdate(val) {
            this.readSubject.next(val);
            return Promise.resolve(val);
        }
    }]);

    return Storage;
}();