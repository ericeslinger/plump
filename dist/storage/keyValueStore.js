'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.KeyValueStore = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _mergeOptions = require('merge-options');

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _storage = require('./storage');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function saneNumber(i) {
    return typeof i === 'number' && !isNaN(i) && i !== Infinity && i !== -Infinity;
}
// declare function parseInt(n: string | number, radix: number): number;

var KeyValueStore = exports.KeyValueStore = function (_Storage) {
    _inherits(KeyValueStore, _Storage);

    function KeyValueStore() {
        _classCallCheck(this, KeyValueStore);

        var _this = _possibleConstructorReturn(this, (KeyValueStore.__proto__ || Object.getPrototypeOf(KeyValueStore)).apply(this, arguments));

        _this.maxKeys = {};
        return _this;
    }

    _createClass(KeyValueStore, [{
        key: 'allocateId',
        value: function allocateId(type) {
            this.maxKeys[type] = this.maxKeys[type] + 1;
            return Promise.resolve(this.maxKeys[type]);
        }
    }, {
        key: 'writeAttributes',
        value: function writeAttributes(inputValue) {
            var _this2 = this;

            var value = this.validateInput(inputValue);
            delete value.relationships;
            // trim out relationships for a direct write.
            return Promise.resolve().then(function () {
                var idAttribute = _this2.getSchema(inputValue.type).idAttribute;
                if (value.id === undefined || value.id === null) {
                    if (!_this2.terminal) {
                        throw new Error('Cannot create new content in a non-terminal store');
                    }
                    return _this2.allocateId(value.type).then(function (n) {
                        return (0, _mergeOptions2.default)({}, value, {
                            id: n,
                            relationships: {},
                            attributes: _defineProperty({}, idAttribute, n)
                        }); // if new.
                    });
                } else {
                    // if not new, get current (including relationships) and merge
                    var thisId = typeof value.id === 'string' ? parseInt(value.id, 10) : value.id;
                    if (saneNumber(thisId) && thisId > _this2.maxKeys[value.type]) {
                        _this2.maxKeys[value.type] = thisId;
                    }
                    return _this2._get(_this2.keyString(value)).then(function (current) {
                        if (current) {
                            return (0, _mergeOptions2.default)({}, current, value);
                        } else {
                            return (0, _mergeOptions2.default)({ relationships: {}, attributes: {} }, value);
                        }
                    });
                }
            }).then(function (toSave) {
                return _this2._set(_this2.keyString(toSave), toSave).then(function () {
                    _this2.fireWriteUpdate(Object.assign({}, toSave, { invalidate: ['attributes'] }));
                    return toSave;
                });
            });
        }
    }, {
        key: 'readAttributes',
        value: function readAttributes(req) {
            return this._get(this.keyString(req.item)).then(function (d) {
                if (d && d.attributes && Object.keys(d.attributes).length > 0) {
                    return d;
                } else {
                    return null;
                }
            });
        }
    }, {
        key: 'cache',
        value: function cache(value) {
            var _this3 = this;

            if (value.id === undefined || value.id === null) {
                return Promise.reject('Cannot cache data without an id - write it to a terminal first');
            } else {
                return this._get(this.keyString(value)).then(function (current) {
                    var newVal = (0, _mergeOptions2.default)(current || {}, value);
                    return _this3._set(_this3.keyString(value), newVal);
                });
            }
        }
    }, {
        key: 'cacheAttributes',
        value: function cacheAttributes(value) {
            var _this4 = this;

            if (value.id === undefined || value.id === null) {
                return Promise.reject('Cannot cache data without an id - write it to a terminal first');
            } else {
                return this._get(this.keyString(value)).then(function (current) {
                    return _this4._set(_this4.keyString(value), {
                        type: value.type,
                        id: value.id,
                        attributes: value.attributes,
                        relationships: current.relationships || {}
                    });
                });
            }
        }
    }, {
        key: 'cacheRelationship',
        value: function cacheRelationship(value) {
            var _this5 = this;

            if (value.id === undefined || value.id === null) {
                return Promise.reject('Cannot cache data without an id - write it to a terminal first');
            } else {
                return this._get(this.keyString(value)).then(function (current) {
                    return _this5._set(_this5.keyString(value), {
                        type: value.type,
                        id: value.id,
                        attributes: current.attributes || {},
                        relationships: value.relationships
                    });
                });
            }
        }
    }, {
        key: 'readRelationship',
        value: function readRelationship(req) {
            var _this6 = this;

            return this._get(this.keyString(req.item)).then(function (v) {
                var retVal = Object.assign({}, v);
                if (!v) {
                    if (_this6.terminal) {
                        return {
                            type: req.item.type,
                            id: req.item.id,
                            relationships: _defineProperty({}, req.rel, [])
                        };
                    } else {
                        return null;
                    }
                } else if (!v.relationships && _this6.terminal) {
                    retVal.relationships = _defineProperty({}, req.rel, []);
                } else if (!retVal.relationships[req.rel] && _this6.terminal) {
                    retVal.relationships[req.rel] = [];
                }
                return retVal;
            });
        }
    }, {
        key: 'delete',
        value: function _delete(value) {
            var _this7 = this;

            return this._del(this.keyString(value)).then(function () {
                if (_this7.terminal) {
                    _this7.fireWriteUpdate({
                        id: value.id,
                        type: value.type,
                        invalidate: ['attributes', 'relationships']
                    });
                }
            });
        }
    }, {
        key: 'wipe',
        value: function wipe(value, field) {
            var _this8 = this;

            var ks = this.keyString(value);
            return this._get(ks).then(function (val) {
                if (val === null) {
                    return null;
                }
                var newVal = Object.assign({}, val);
                if (field === 'attributes') {
                    delete newVal.attributes;
                } else if (field === 'relationships') {
                    delete newVal.relationships;
                } else if (field.indexOf('relationships.') === 0) {
                    delete newVal.relationships[field.split('.')[1]];
                    if (Object.keys(newVal.relationships).length === 0) {
                        delete newVal.relationships;
                    }
                } else {
                    throw new Error('Cannot delete field ' + field + ' - unknown format');
                }
                return _this8._set(ks, newVal);
            });
        }
    }, {
        key: 'writeRelationshipItem',
        value: function writeRelationshipItem(value, relName, child) {
            var _this9 = this;

            var schema = this.getSchema(value.type);
            var relSchema = schema.relationships[relName].type;
            var otherRelType = relSchema.sides[relName].otherType;
            var otherRelName = relSchema.sides[relName].otherName;
            var thisKeyString = this.keyString(value);
            var otherKeyString = this.keyString({ type: otherRelType, id: child.id });
            return Promise.all([this._get(thisKeyString), this._get(otherKeyString)]).then(function (_ref) {
                var _ref2 = _slicedToArray(_ref, 2),
                    thisItemResolved = _ref2[0],
                    otherItemResolved = _ref2[1];

                var thisItem = thisItemResolved;
                if (!thisItem) {
                    thisItem = {
                        id: child.id,
                        type: otherRelType,
                        attributes: {},
                        relationships: {}
                    };
                }
                var otherItem = otherItemResolved;
                if (!otherItem) {
                    otherItem = {
                        id: child.id,
                        type: otherRelType,
                        attributes: {},
                        relationships: {}
                    };
                }
                var newChild = { id: child.id, type: otherRelType };
                var newParent = { id: value.id, type: value.type };
                if (!thisItem.relationships) {
                    thisItem.relationships = {};
                }
                if (!thisItem.relationships[relName]) {
                    thisItem.relationships[relName] = [];
                }
                if (!otherItem.relationships) {
                    otherItem.relationships = {};
                }
                if (!otherItem.relationships[otherRelName]) {
                    otherItem.relationships[otherRelName] = [];
                }
                if (relSchema.extras && child.meta) {
                    newParent.meta = {};
                    newChild.meta = {};
                    for (var extra in child.meta) {
                        if (extra in relSchema.extras) {
                            newChild.meta[extra] = child.meta[extra];
                            newParent.meta[extra] = child.meta[extra];
                        }
                    }
                }
                var thisIdx = thisItem.relationships[relName].findIndex(function (item) {
                    return item.id === child.id;
                });
                var otherIdx = otherItem.relationships[otherRelName].findIndex(function (item) {
                    return item.id === value.id;
                });
                if (thisIdx < 0) {
                    thisItem.relationships[relName].push(newChild);
                } else {
                    thisItem.relationships[relName][thisIdx] = newChild;
                }
                if (otherIdx < 0) {
                    otherItem.relationships[otherRelName].push(newParent);
                } else {
                    otherItem.relationships[otherRelName][otherIdx] = newParent;
                }
                return Promise.all([_this9._set(_this9.keyString(thisItem), thisItem), _this9._set(_this9.keyString(otherItem), otherItem)]).then(function () {
                    _this9.fireWriteUpdate(Object.assign(thisItem, {
                        invalidate: ['relationships.' + relName]
                    }));
                    _this9.fireWriteUpdate(Object.assign(otherItem, {
                        invalidate: ['relationships.' + otherRelName]
                    }));
                }).then(function () {
                    return thisItem;
                });
            });
        }
    }, {
        key: 'deleteRelationshipItem',
        value: function deleteRelationshipItem(value, relName, child) {
            var _this10 = this;

            var schema = this.getSchema(value.type);
            var relSchema = schema.relationships[relName].type;
            var otherRelType = relSchema.sides[relName].otherType;
            var otherRelName = relSchema.sides[relName].otherName;
            var thisKeyString = this.keyString(value);
            var otherKeyString = this.keyString({ type: otherRelType, id: child.id });
            return Promise.all([this._get(thisKeyString), this._get(otherKeyString)]).then(function (_ref3) {
                var _ref4 = _slicedToArray(_ref3, 2),
                    thisItem = _ref4[0],
                    otherItem = _ref4[1];

                if (!thisItem.relationships[relName]) {
                    thisItem.relationships[relName] = [];
                }
                if (!otherItem.relationships[otherRelName]) {
                    otherItem.relationships[otherRelName] = [];
                }
                var thisIdx = thisItem.relationships[relName].findIndex(function (item) {
                    return item.id === child.id;
                });
                var otherIdx = otherItem.relationships[otherRelName].findIndex(function (item) {
                    return item.id === value.id;
                });
                if (thisIdx >= 0) {
                    thisItem.relationships[relName].splice(thisIdx, 1);
                }
                if (otherIdx >= 0) {
                    otherItem.relationships[otherRelName].splice(otherIdx, 1);
                }
                return Promise.all([_this10._set(_this10.keyString(thisItem), thisItem), _this10._set(_this10.keyString(otherItem), otherItem)]).then(function () {
                    _this10.fireWriteUpdate(Object.assign(thisItem, {
                        invalidate: ['relationships.' + relName]
                    }));
                    _this10.fireWriteUpdate(Object.assign(otherItem, {
                        invalidate: ['relationships.' + otherRelName]
                    }));
                }).then(function () {
                    return thisItem;
                });
            });
        }
    }, {
        key: 'query',
        value: function query(t, q) {
            return this._keys(t).then(function (keys) {
                return keys.map(function (k) {
                    return {
                        type: t,
                        id: parseInt(k.split(':')[1], 10)
                    };
                }).filter(function (v) {
                    return !isNaN(v.id);
                });
            });
        }
    }, {
        key: 'addSchema',
        value: function addSchema(t) {
            var _this11 = this;

            return _get(KeyValueStore.prototype.__proto__ || Object.getPrototypeOf(KeyValueStore.prototype), 'addSchema', this).call(this, t).then(function () {
                _this11.maxKeys[t.type] = 0;
            });
        }
    }, {
        key: 'keyString',
        value: function keyString(value) {
            return value.type + ':' + value.id;
        }
    }]);

    return KeyValueStore;
}(_storage.Storage);