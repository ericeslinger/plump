"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Bluebird = require("bluebird");
var storage_1 = require("./storage");
var createFilter_1 = require("./createFilter");
var model_1 = require("../model");
function saneNumber(i) {
    return ((typeof i === 'number') && (!isNaN(i)) && (i !== Infinity) & (i !== -Infinity));
}
function findEntryCallback(relationship, relationshipTitle, target) {
    var sideInfo = relationship.$sides[relationshipTitle];
    return function (value) {
        if ((value[sideInfo.self.field] === target[sideInfo.self.field]) &&
            (value[sideInfo.other.field] === target[sideInfo.other.field])) {
            if (relationship.$restrict) {
                return Object.keys(relationship.$restrict).reduce(function (prior, restriction) { return prior && value[restriction] === relationship.$restrict[restriction].value; }, true);
            }
            else {
                return true;
            }
        }
        else {
            return false;
        }
    };
}
function maybePush(array, val, keystring, store, idx) {
    return Bluebird.resolve()
        .then(function () {
        if (idx < 0) {
            array.push(val);
            return store._set(keystring, JSON.stringify(array));
        }
        else {
            return null;
        }
    });
}
function maybeUpdate(array, val, keystring, store, extras, idx) {
    return Bluebird.resolve()
        .then(function () {
        if (idx >= 0) {
            var modifiedRelationship = Object.assign({}, array[idx], extras);
            array[idx] = modifiedRelationship;
            return store._set(keystring, JSON.stringify(array));
        }
        else {
            return null;
        }
    });
}
function maybeDelete(array, idx, keystring, store) {
    return Bluebird.resolve()
        .then(function () {
        if (idx >= 0) {
            array.splice(idx, 1);
            return store._set(keystring, JSON.stringify(array));
        }
        else {
            return null;
        }
    });
}
var KeyValueStore = (function (_super) {
    __extends(KeyValueStore, _super);
    function KeyValueStore() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    KeyValueStore.prototype.$$maxKey = function (t) {
        return this._keys(t)
            .then(function (keyArray) {
            if (keyArray.length === 0) {
                return 0;
            }
            else {
                return keyArray.map(function (k) { return k.split(':')[2]; })
                    .map(function (k) { return parseInt(k, 10); })
                    .filter(function (i) { return saneNumber(i); })
                    .reduce(function (max, current) { return (current > max) ? current : max; }, 0);
            }
        });
    };
    KeyValueStore.prototype.write = function (t, v) {
        var _this = this;
        var id = v[t.$id];
        var updateObject = {};
        Object.keys(t.$fields).forEach(function (fieldName) {
            if (v[fieldName] !== undefined) {
                if ((t.$fields[fieldName].type === 'array') ||
                    (t.$fields[fieldName].type === 'hasMany')) {
                    updateObject[fieldName] = v[fieldName].concat();
                }
                else if (t.$fields[fieldName].type === 'object') {
                    updateObject[fieldName] = Object.assign({}, v[fieldName]);
                }
                else {
                    updateObject[fieldName] = v[fieldName];
                }
            }
        });
        if ((id === undefined) || (id === null)) {
            if (this.terminal) {
                return this.$$maxKey(t.$name)
                    .then(function (n) {
                    var toSave = Object.assign({}, updateObject, (_a = {}, _a[t.$id] = n + 1, _a));
                    return _this._set(_this.keyString(t.$name, n + 1), JSON.stringify(toSave))
                        .then(function () {
                        return _this.notifyUpdate(t, toSave[t.$id], toSave);
                    })
                        .then(function () { return toSave; });
                    var _a;
                });
            }
            else {
                throw new Error('Cannot create new content in a non-terminal store');
            }
        }
        else {
            return this._get(this.keyString(t.$name, id))
                .then(function (origValue) {
                var update = Object.assign({}, JSON.parse(origValue), updateObject);
                return _this._set(_this.keyString(t.$name, id), JSON.stringify(update))
                    .then(function () {
                    return _this.notifyUpdate(t, id, update);
                })
                    .then(function () { return update; });
            });
        }
    };
    KeyValueStore.prototype.readOne = function (t, id) {
        return this._get(this.keyString(t.$name, id))
            .then(function (d) { return JSON.parse(d); });
    };
    KeyValueStore.prototype.readMany = function (t, id, relationship) {
        var _this = this;
        var relationshipType = t.$fields[relationship].relationship;
        var sideInfo = relationshipType.$sides[relationship];
        return Bluebird.resolve()
            .then(function () {
            var resolves = [_this._get(_this.keyString(t.$name, id, relationshipType.$name))];
            if (sideInfo.self.query && sideInfo.self.query.requireLoad) {
                resolves.push(_this.readOne(t, id));
            }
            else {
                resolves.push(Bluebird.resolve({ id: id }));
            }
            return Bluebird.all(resolves);
        })
            .then(function (_a) {
            var arrayString = _a[0], context = _a[1];
            var relationshipArray = JSON.parse(arrayString) || [];
            if (sideInfo.self.query) {
                var filterBlock = storage_1.Storage.massReplace(sideInfo.self.query.logic, context);
                relationshipArray = relationshipArray.filter(createFilter_1.createFilter(filterBlock));
            }
            if (relationshipType.$restrict) {
                return relationshipArray.filter(function (v) {
                    return Object.keys(relationshipType.$restrict).reduce(function (prior, restriction) { return prior && v[restriction] === relationshipType.$restrict[restriction].value; }, true);
                }).map(function (entry) {
                    Object.keys(relationshipType.$restrict).forEach(function (k) {
                        delete entry[k];
                    });
                    return entry;
                });
            }
            else {
                return relationshipArray;
            }
        }).then(function (ary) {
            return _a = {}, _a[relationship] = ary, _a;
            var _a;
        });
    };
    KeyValueStore.prototype.delete = function (t, id) {
        return this._del(this.keyString(t.$name, id));
    };
    KeyValueStore.prototype.wipe = function (t, id, field) {
        if (field === model_1.$self) {
            return this._del(this.keyString(t.$name, id));
        }
        else {
            return this._del(this.keyString(t.$name, id, field));
        }
    };
    KeyValueStore.prototype.writeHasMany = function (type, id, field, value) {
        var toSave = value;
        var relationshipBlock = type.$fields[field].relationship;
        if (relationshipBlock.$restrict) {
            var restrictBlock_1 = {};
            Object.keys(relationshipBlock.$restrict).forEach(function (k) {
                restrictBlock_1[k] = relationshipBlock.$restrict[k].value;
            });
            toSave = toSave.map(function (v) { return Object.assign({}, v, restrictBlock_1); });
        }
        var thisKeyString = this.keyString(type.$name, id, relationshipBlock.$name);
        return this._set(thisKeyString, JSON.stringify(toSave));
    };
    KeyValueStore.prototype.add = function (type, id, relationshipTitle, childId, extras) {
        var _this = this;
        if (extras === void 0) { extras = {}; }
        var relationshipBlock = type.$fields[relationshipTitle].relationship;
        var sideInfo = relationshipBlock.$sides[relationshipTitle];
        var thisKeyString = this.keyString(type.$name, id, relationshipBlock.$name);
        var otherKeyString = this.keyString(sideInfo.other.type, childId, relationshipBlock.$name);
        return Bluebird.all([
            this._get(thisKeyString),
            this._get(otherKeyString),
        ])
            .then(function (_a) {
            var thisArrayString = _a[0], otherArrayString = _a[1];
            var thisArray = JSON.parse(thisArrayString) || [];
            var otherArray = JSON.parse(otherArrayString) || [];
            var newField = (_b = {},
                _b[sideInfo.other.field] = childId,
                _b[sideInfo.self.field] = id,
                _b);
            if (relationshipBlock.$restrict) {
                Object.keys(relationshipBlock.$restrict).forEach(function (restriction) {
                    newField[restriction] = relationshipBlock.$restrict[restriction].value;
                });
            }
            if (relationshipBlock.$extras) {
                Object.keys(relationshipBlock.$extras).forEach(function (extra) {
                    newField[extra] = extras[extra];
                });
            }
            var thisIdx = thisArray.findIndex(findEntryCallback(relationshipBlock, relationshipTitle, newField));
            var otherIdx = otherArray.findIndex(findEntryCallback(relationshipBlock, relationshipTitle, newField));
            return Bluebird.all([
                maybePush(thisArray, newField, thisKeyString, _this, thisIdx),
                maybePush(otherArray, newField, otherKeyString, _this, otherIdx),
            ])
                .then(function () { return _this.notifyUpdate(type, id, null, relationshipTitle); })
                .then(function () { return thisArray; });
            var _b;
        });
    };
    KeyValueStore.prototype.modifyRelationship = function (type, id, relationshipTitle, childId, extras) {
        var _this = this;
        var relationshipBlock = type.$fields[relationshipTitle].relationship;
        var sideInfo = relationshipBlock.$sides[relationshipTitle];
        var thisKeyString = this.keyString(type.$name, id, relationshipBlock.$name);
        var otherKeyString = this.keyString(sideInfo.other.type, childId, relationshipBlock.$name);
        return Bluebird.all([
            this._get(thisKeyString),
            this._get(otherKeyString),
        ])
            .then(function (_a) {
            var thisArrayString = _a[0], otherArrayString = _a[1];
            var thisArray = JSON.parse(thisArrayString) || [];
            var otherArray = JSON.parse(otherArrayString) || [];
            var target = (_b = {},
                _b[sideInfo.other.field] = childId,
                _b[sideInfo.self.field] = id,
                _b);
            var thisIdx = thisArray.findIndex(findEntryCallback(relationshipBlock, relationshipTitle, target));
            var otherIdx = otherArray.findIndex(findEntryCallback(relationshipBlock, relationshipTitle, target));
            return Bluebird.all([
                maybeUpdate(thisArray, target, thisKeyString, _this, extras, thisIdx),
                maybeUpdate(otherArray, target, otherKeyString, _this, extras, otherIdx),
            ]);
            var _b;
        })
            .then(function (res) { return _this.notifyUpdate(type, id, null, relationshipTitle).then(function () { return res; }); });
    };
    KeyValueStore.prototype.remove = function (type, id, relationshipTitle, childId) {
        var _this = this;
        var relationshipBlock = type.$fields[relationshipTitle].relationship;
        var sideInfo = relationshipBlock.$sides[relationshipTitle];
        var thisKeyString = this.keyString(type.$name, id, relationshipBlock.$name);
        var otherKeyString = this.keyString(sideInfo.other.type, childId, relationshipBlock.$name);
        return Bluebird.all([
            this._get(thisKeyString),
            this._get(otherKeyString),
        ])
            .then(function (_a) {
            var thisArrayString = _a[0], otherArrayString = _a[1];
            var thisArray = JSON.parse(thisArrayString) || [];
            var otherArray = JSON.parse(otherArrayString) || [];
            var target = (_b = {},
                _b[sideInfo.other.field] = childId,
                _b[sideInfo.self.field] = id,
                _b);
            var thisIdx = thisArray.findIndex(findEntryCallback(relationshipBlock, relationshipTitle, target));
            var otherIdx = otherArray.findIndex(findEntryCallback(relationshipBlock, relationshipTitle, target));
            return Bluebird.all([
                maybeDelete(thisArray, thisIdx, thisKeyString, _this),
                maybeDelete(otherArray, otherIdx, otherKeyString, _this),
            ]);
            var _b;
        })
            .then(function (res) { return _this.notifyUpdate(type, id, null, relationshipTitle).then(function () { return res; }); });
    };
    KeyValueStore.prototype.keyString = function (typeName, id, relationship) {
        return typeName + ":" + (relationship || 'store') + ":" + id;
    };
    return KeyValueStore;
}(storage_1.Storage));
exports.KeyValueStore = KeyValueStore;
