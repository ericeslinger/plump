"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Bluebird = require("bluebird");
var knex_1 = require("knex");
var storage_1 = require("./storage");
var $knex = Symbol('$knex');
function deserializeWhere(query, block) {
    var car = block[0];
    var cdr = block.slice(1);
    if (Array.isArray(cdr[0])) {
        return cdr.reduce(function (subQuery, subBlock) { return deserializeWhere(subQuery, subBlock); }, query);
    }
    else {
        return query[car].apply(query, cdr);
    }
}
function objectToWhereChain(query, block, context) {
    return Object.keys(block).reduce(function (q, key) {
        if (Array.isArray(block[key])) {
            return deserializeWhere(query, storage_1.Storage.massReplace(block[key], context));
        }
        else {
            return q.where(key, block[key]);
        }
    }, query);
}
var SQLStorage = (function (_super) {
    __extends(SQLStorage, _super);
    function SQLStorage(opts) {
        if (opts === void 0) { opts = {}; }
        var _this = _super.call(this, opts) || this;
        var options = Object.assign({}, {
            client: 'postgres',
            debug: false,
            connection: {
                user: 'postgres',
                host: 'localhost',
                port: 5432,
                password: '',
                charset: 'utf8',
            },
            pool: {
                max: 20,
                min: 0,
            },
        }, opts.sql);
        _this[$knex] = knex_1.default(options);
        return _this;
    }
    SQLStorage.prototype.teardown = function () {
        return this[$knex].destroy();
    };
    SQLStorage.prototype.write = function (t, v) {
        var _this = this;
        return Bluebird.resolve()
            .then(function () {
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
            if ((id === undefined) && (_this.terminal)) {
                return _this[$knex](t.$name).insert(updateObject).returning(t.$id)
                    .then(function (createdId) {
                    return _this.read(t, createdId[0]);
                });
            }
            else if (id !== undefined) {
                return _this[$knex](t.$name).where((_a = {}, _a[t.$id] = id, _a)).update(updateObject)
                    .then(function () {
                    return _this.read(t, id);
                });
            }
            else {
                throw new Error('Cannot create new content in a non-terminal store');
            }
            var _a;
        }).then(function (result) {
            return _this.notifyUpdate(t, result[t.$id], result).then(function () { return result; });
        });
    };
    SQLStorage.prototype.readOne = function (t, id) {
        return this[$knex](t.$name).where((_a = {}, _a[t.$id] = id, _a)).select()
            .then(function (o) { return o[0] || null; });
        var _a;
    };
    SQLStorage.prototype.readMany = function (type, id, relationshipTitle) {
        var _this = this;
        var relationshipBlock = type.$fields[relationshipTitle];
        var sideInfo = relationshipBlock.relationship.$sides[relationshipTitle];
        var toSelect = [sideInfo.other.field, sideInfo.self.field];
        if (relationshipBlock.relationship.$extras) {
            toSelect = toSelect.concat(Object.keys(relationshipBlock.relationship.$extras));
        }
        var whereBlock = {};
        if (sideInfo.self.query) {
            whereBlock[sideInfo.self.field] = sideInfo.self.query.logic;
        }
        else {
            whereBlock[sideInfo.self.field] = id;
        }
        if (relationshipBlock.relationship.$restrict) {
            Object.keys(relationshipBlock.relationship.$restrict).forEach(function (restriction) {
                whereBlock[restriction] = relationshipBlock.relationship.$restrict[restriction].value;
            });
        }
        return Bluebird.resolve()
            .then(function () {
            if (sideInfo.self.query && sideInfo.self.query.requireLoad) {
                return _this.readOne(type, id);
            }
            else {
                return { id: id };
            }
        })
            .then(function (context) {
            return objectToWhereChain(_this[$knex](relationshipBlock.relationship.$name), whereBlock, context)
                .select(toSelect);
        })
            .then(function (l) {
            return _a = {},
                _a[relationshipTitle] = l,
                _a;
            var _a;
        });
    };
    SQLStorage.prototype.delete = function (t, id) {
        return this[$knex](t.$name).where((_a = {}, _a[t.$id] = id, _a)).delete()
            .then(function (o) { return o; });
        var _a;
    };
    SQLStorage.prototype.add = function (type, id, relationshipTitle, childId, extras) {
        var _this = this;
        if (extras === void 0) { extras = {}; }
        var relationshipBlock = type.$fields[relationshipTitle];
        var sideInfo = relationshipBlock.relationship.$sides[relationshipTitle];
        var newField = (_a = {},
            _a[sideInfo.other.field] = childId,
            _a[sideInfo.self.field] = id,
            _a);
        if (relationshipBlock.relationship.$restrict) {
            Object.keys(relationshipBlock.relationship.$restrict).forEach(function (restriction) {
                newField[restriction] = relationshipBlock.relationship.$restrict[restriction].value;
            });
        }
        if (relationshipBlock.relationship.$extras) {
            Object.keys(relationshipBlock.relationship.$extras).forEach(function (extra) {
                newField[extra] = extras[extra];
            });
        }
        return this[$knex](relationshipBlock.relationship.$name)
            .insert(newField)
            .then(function () { return _this.notifyUpdate(type, id, null, relationshipTitle); });
        var _a;
    };
    SQLStorage.prototype.modifyRelationship = function (type, id, relationshipTitle, childId, extras) {
        var _this = this;
        if (extras === void 0) { extras = {}; }
        var relationshipBlock = type.$fields[relationshipTitle];
        var sideInfo = relationshipBlock.relationship.$sides[relationshipTitle];
        var newField = {};
        Object.keys(relationshipBlock.relationship.$extras).forEach(function (extra) {
            if (extras[extra] !== undefined) {
                newField[extra] = extras[extra];
            }
        });
        var whereBlock = (_a = {},
            _a[sideInfo.other.field] = childId,
            _a[sideInfo.self.field] = id,
            _a);
        if (relationshipBlock.relationship.$restrict) {
            Object.keys(relationshipBlock.relationship.$restrict).forEach(function (restriction) {
                whereBlock[restriction] = relationshipBlock.relationship.$restrict[restriction].value;
            });
        }
        return objectToWhereChain(this[$knex](relationshipBlock.relationship.$name), whereBlock, { id: id, childId: childId })
            .update(newField)
            .then(function () { return _this.notifyUpdate(type, id, null, relationshipTitle); });
        var _a;
    };
    SQLStorage.prototype.remove = function (type, id, relationshipTitle, childId) {
        var _this = this;
        var relationshipBlock = type.$fields[relationshipTitle];
        var sideInfo = relationshipBlock.relationship.$sides[relationshipTitle];
        var whereBlock = (_a = {},
            _a[sideInfo.other.field] = childId,
            _a[sideInfo.self.field] = id,
            _a);
        if (relationshipBlock.relationship.$restrict) {
            Object.keys(relationshipBlock.relationship.$restrict).forEach(function (restriction) {
                whereBlock[restriction] = relationshipBlock.relationship.$restrict[restriction].value;
            });
        }
        return objectToWhereChain(this[$knex](relationshipBlock.relationship.$name), whereBlock).delete()
            .then(function () { return _this.notifyUpdate(type, id, null, relationshipTitle); });
        var _a;
    };
    SQLStorage.prototype.query = function (q) {
        return Bluebird.resolve(this[$knex].raw(q.query))
            .then(function (d) { return d.rows; });
    };
    return SQLStorage;
}(storage_1.Storage));
exports.SQLStorage = SQLStorage;
