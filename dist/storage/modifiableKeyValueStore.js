'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ModifiableKeyValueStore = undefined;

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

// declare function parseInt(n: string | number, radix: number): number;
var ModifiableKeyValueStore = exports.ModifiableKeyValueStore = function (_Storage) {
    _inherits(ModifiableKeyValueStore, _Storage);

    function ModifiableKeyValueStore() {
        _classCallCheck(this, ModifiableKeyValueStore);

        var _this = _possibleConstructorReturn(this, (ModifiableKeyValueStore.__proto__ || Object.getPrototypeOf(ModifiableKeyValueStore)).apply(this, arguments));

        _this.maxKeys = {};
        return _this;
    }

    _createClass(ModifiableKeyValueStore, [{
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
                    _this2.maxKeys[inputValue.type] = Math.max(_this2.maxKeys[inputValue.type], value.id);
                    return value;
                }
            }).then(function (toSave) {
                return _this2._upsert(toSave).then(function () {
                    _this2.fireWriteUpdate(Object.assign({}, toSave, { invalidate: ['attributes'] }));
                    return toSave;
                });
            });
        }
    }, {
        key: 'readAttributes',
        value: function readAttributes(value) {
            return this._get(value).then(function (d) {
                // TODO: figure out what happens when there's a
                // field with no real attributes
                if (d && d.attributes) {
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
                return this._get({
                    fields: ['attributes', 'relationships'],
                    item: value
                }).then(function (current) {
                    if (!current) {
                        return _this3._upsert(value);
                    } else {
                        var _newVal = (0, _mergeOptions2.default)({}, current, value);
                        Object.keys(current.relationships).forEach(function (relKey) {
                            if (current.relationships[relKey].length > 0 && (!value.relationships[relKey] || value.relationships[relKey].length === 0)) {
                                _newVal.relationships[relKey] = current.relationships[relKey].concat();
                            }
                        });
                    }
                    var newVal = (0, _mergeOptions2.default)(current || {}, value);
                    return _this3._upsert(newVal);
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
                return this._get({
                    fields: ['attributes', 'relationships'],
                    item: value
                }).then(function (current) {
                    return _this4._upsert({
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
                return this._get({
                    fields: ['attributes', 'relationships'],
                    item: value
                }).then(function (current) {
                    return _this5._upsert({
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
        value: function readRelationship(value) {
            var _this6 = this;

            return this._get(value).then(function (v) {
                var retVal = Object.assign({}, v);
                if (!v) {
                    if (_this6.terminal) {
                        return {
                            type: value.item.type,
                            id: value.item.id,
                            relationships: _defineProperty({}, value.rel, [])
                        };
                    } else {
                        return null;
                    }
                } else if (!v.relationships && _this6.terminal) {
                    retVal.relationships = _defineProperty({}, value.rel, []);
                } else if (!retVal.relationships[value.rel] && _this6.terminal) {
                    retVal.relationships[value.rel] = [];
                }
                return retVal;
            });
        }
    }, {
        key: 'delete',
        value: function _delete(value) {
            var _this7 = this;

            return this._del(value, ['attributes', 'relationships']).then(function () {
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
            return this._del(value, [field]);
        }
    }, {
        key: 'writeRelationshipItem',
        value: function writeRelationshipItem(value, relName, child) {
            var _this8 = this;

            var schema = this.getSchema(value.type);
            var relSchema = schema.relationships[relName].type;
            var otherRelType = relSchema.sides[relName].otherType;
            var otherRelName = relSchema.sides[relName].otherName;
            var otherReference = { type: otherRelType, id: child.id };
            var newChild = { id: child.id, type: otherRelType };
            var newParent = { id: value.id, type: schema.name };
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
            return Promise.all([this._updateArray(value, relName, newChild), this._updateArray(otherReference, otherRelName, newParent)]).then(function () {
                _this8.fireWriteUpdate(Object.assign(value, { invalidate: ['relationships.' + relName] }));
                _this8.fireWriteUpdate(Object.assign({ type: otherRelType, id: child.id }, { invalidate: ['relationships.' + otherRelName] }));
            }).then(function () {
                return value;
            });
        }
    }, {
        key: 'deleteRelationshipItem',
        value: function deleteRelationshipItem(value, relName, child) {
            var _this9 = this;

            var schema = this.getSchema(value.type);
            var relSchema = schema.relationships[relName].type;
            var otherRelType = relSchema.sides[relName].otherType;
            var otherRelName = relSchema.sides[relName].otherName;
            var otherReference = { type: otherRelType, id: child.id };
            var newChild = { id: child.id, type: otherRelType };
            var newParent = { id: value.id, type: value.type };
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
            return Promise.all([this._removeFromArray(value, relName, newChild), this._removeFromArray(otherReference, otherRelName, newParent)]).then(function () {
                _this9.fireWriteUpdate(Object.assign(value, { invalidate: ['relationships.' + relName] }));
                _this9.fireWriteUpdate(Object.assign({ type: otherRelType, id: child.id }, { invalidate: ['relationships.' + otherRelName] }));
            }).then(function () {
                return value;
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
            var _this10 = this;

            return _get(ModifiableKeyValueStore.prototype.__proto__ || Object.getPrototypeOf(ModifiableKeyValueStore.prototype), 'addSchema', this).call(this, t).then(function () {
                _this10.maxKeys[t.type] = 0;
            });
        }
    }, {
        key: 'keyString',
        value: function keyString(value) {
            return value.type + ':' + value.id;
        }
    }]);

    return ModifiableKeyValueStore;
}(_storage.Storage);